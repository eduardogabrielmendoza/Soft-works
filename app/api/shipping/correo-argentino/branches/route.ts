import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type {
  CorreoArgentinoBranchSearchResponse,
  CorreoArgentinoBranchSearchResult,
  Database,
  SucursalCorreoArgentino,
} from '@/lib/types/database.types'
import { lookupPostalCode } from '@/lib/utils/postalCodes'

const SELECT_FIELDS = [
  'id',
  'source_key',
  'provincia_codigo',
  'provincia_nombre',
  'normalized_province_name',
  'localidad_id',
  'localidad_nombre',
  'localidad_nombre_solicitada',
  'codigo_postal',
  'tipo_sucursal',
  'nombre',
  'direccion',
  'horarios',
  'latitud',
  'longitud',
  'service_ids',
  'service_names',
  'normalized_branch_name',
  'normalized_address',
  'normalized_locality_name',
  'normalized_search_text',
  'admite_recepcion_ecommerce',
  'admite_entrega_ecommerce',
  'admite_etienda',
  'es_elegible_envio_sucursal',
  'activa',
  'ultimo_scrapeo',
  'fecha_creacion',
  'fecha_actualizacion',
].join(', ')

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeProvinceName(value: string): string {
  const normalized = normalizeSearchText(value)

  if (normalized === 'capital federal' || normalized === 'ciudad autonoma de buenos aires') {
    return 'caba'
  }

  if (normalized.startsWith('buenos aires')) {
    return 'buenos aires'
  }

  return normalized
}

function numericPostalCode(value: string | null): number | null {
  if (!value || !/^\d{4}$/.test(value)) return null
  return Number(value)
}

function branchTypeScore(type: string): number {
  const normalized = normalizeSearchText(type)

  if (normalized === 'sucursal') return 30
  if (normalized === 'agencia') return 18
  return 10
}

function scoreBranch(
  branch: SucursalCorreoArgentino,
  postalCode: string,
  normalizedQuery: string,
  normalizedProvince: string | null
): CorreoArgentinoBranchSearchResult {
  const branchPostalCode = numericPostalCode(branch.codigo_postal)
  const requestedPostalCode = numericPostalCode(postalCode)
  const postalCodeMatch = branch.codigo_postal === postalCode
  const queryTokens = normalizedQuery ? normalizedQuery.split(' ').filter(token => token.length >= 2) : []
  const matchedTokens = queryTokens.filter(token => branch.normalized_search_text.includes(token)).length
  const queryMatch = normalizedQuery
    ? branch.normalized_search_text.includes(normalizedQuery) || matchedTokens > 0
    : false

  let score = 0
  if (postalCodeMatch) score += 140
  if (requestedPostalCode != null && branchPostalCode != null) {
    const distance = Math.abs(requestedPostalCode - branchPostalCode)
    score += Math.max(0, 70 - Math.min(distance, 70))
  }
  if (normalizedProvince && branch.normalized_province_name === normalizedProvince) {
    score += 40
  }
  if (branch.es_elegible_envio_sucursal) {
    score += 30
  }
  if (normalizedQuery) {
    score += matchedTokens * 15
    if (branch.normalized_branch_name.includes(normalizedQuery)) score += 24
    if (branch.normalized_locality_name.includes(normalizedQuery)) score += 18
    if (branch.normalized_address.includes(normalizedQuery)) score += 16
  }
  score += branchTypeScore(branch.tipo_sucursal)

  return {
    ...branch,
    score,
    postal_code_match: postalCodeMatch,
    query_match: queryMatch,
  }
}

function sortResults(a: CorreoArgentinoBranchSearchResult, b: CorreoArgentinoBranchSearchResult) {
  if (b.score !== a.score) return b.score - a.score
  if (a.localidad_nombre !== b.localidad_nombre) {
    return a.localidad_nombre.localeCompare(b.localidad_nombre, 'es')
  }
  return a.nombre.localeCompare(b.nombre, 'es')
}

function dedupeBranches(branches: SucursalCorreoArgentino[]) {
  const unique = new Map<string, SucursalCorreoArgentino>()

  for (const branch of branches) {
    unique.set(branch.id, branch)
  }

  return [...unique.values()]
}

async function fetchCandidateSet(
  onlyEligible: boolean,
  normalizedProvince: string | null,
  postalCode: string,
  limit: number
) {
  const supabase = getSupabaseAdmin()

  const exactPostalQuery = supabase
    .from('sucursales_correo_argentino')
    .select(SELECT_FIELDS)
    .eq('activa', true)
    .eq('codigo_postal', postalCode)

  const scopedQuery = supabase
    .from('sucursales_correo_argentino')
    .select(SELECT_FIELDS)
    .eq('activa', true)
    .limit(limit)

  const exactPromise = (onlyEligible ? exactPostalQuery.eq('es_elegible_envio_sucursal', true) : exactPostalQuery).limit(40)

  const provinceScopedPromise = (() => {
    let builder = onlyEligible ? scopedQuery.eq('es_elegible_envio_sucursal', true) : scopedQuery
    if (normalizedProvince) {
      builder = builder.eq('normalized_province_name', normalizedProvince)
    }
    return builder
  })()

  const [exactResult, provinceScopedResult] = await Promise.all([exactPromise, provinceScopedPromise])

  if (exactResult.error) {
    throw new Error(exactResult.error.message)
  }

  if (provinceScopedResult.error) {
    throw new Error(provinceScopedResult.error.message)
  }

  return dedupeBranches([
    ...(exactResult.data || []),
    ...(provinceScopedResult.data || []),
  ])
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode')?.trim() || ''
    const rawQuery = searchParams.get('q')?.trim() || ''
    const requestedProvince = searchParams.get('province')?.trim() || ''
    const limitParam = Number(searchParams.get('limit') || '8')
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 12) : 8

    if (!/^\d{4}$/.test(postalCode)) {
      return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 })
    }

    const lookupResult = lookupPostalCode(postalCode)
    const resolvedProvince = requestedProvince || lookupResult?.provincia || null
    const normalizedProvince = resolvedProvince ? normalizeProvinceName(resolvedProvince) : null
    const normalizedQuery = normalizeSearchText(rawQuery)

    let candidates = await fetchCandidateSet(true, normalizedProvince, postalCode, 350)

    if (!candidates.length) {
      candidates = await fetchCandidateSet(false, normalizedProvince, postalCode, 350)
    }

    const scoredCandidates = candidates
      .map(branch => scoreBranch(branch, postalCode, normalizedQuery, normalizedProvince))
      .sort(sortResults)

    const filteredCandidates = normalizedQuery
      ? scoredCandidates.filter(branch => branch.query_match || branch.postal_code_match)
      : scoredCandidates

    const results = filteredCandidates.slice(0, limit)
    const payload: CorreoArgentinoBranchSearchResponse = {
      postalCode,
      province: resolvedProvince,
      query: rawQuery,
      recommendation: results[0] || scoredCandidates[0] || null,
      results,
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Correo Argentino branch search error:', error)
    return NextResponse.json(
      { error: 'No pudimos buscar sucursales de Correo Argentino.' },
      { status: 500 }
    )
  }
}