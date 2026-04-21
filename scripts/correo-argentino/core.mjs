import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

export const BASE_URL = 'https://www.correoargentino.com.ar';
export const PAGE_URL = `${BASE_URL}/formularios/sucursales`;
export const WS_URL = `${BASE_URL}/sites/all/modules/custom/ca_forms/api/wsFacade.php`;
export const DEFAULT_HEADERS = {
  'accept-language': 'es-AR,es;q=0.9',
  'user-agent': 'SoftworksBot/1.0 (+https://softworks.com.ar)',
};

const ECOMMERCE_RECEPCION_SERVICE_ID = '38';
const ECOMMERCE_ENTREGA_SERVICE_ID = '40';
const ETIENDA_SERVICE_ID = '29';

export function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

export function cleanText(value) {
  const repairedValue = /[ÃÂï»¿]/.test(value)
    ? Buffer.from(value, 'latin1').toString('utf8')
    : value;

  return repairedValue
    .replace(/^ï»¿/, '')
    .replace(/^\uFEFF/, '')
    .replace(/Â°/g, '°')
    .replace(/Âº/g, 'º')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSearchText(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeProvinceName(value) {
  const normalized = normalizeSearchText(value);

  if (normalized === 'capital federal' || normalized === 'ciudad autonoma de buenos aires') {
    return 'caba';
  }

  if (normalized.startsWith('buenos aires')) {
    return 'buenos aires';
  }

  return normalized;
}

export function normalizeKey(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseLeadingQuestionMark(text) {
  return text
    .replace(/^ï»¿/, '')
    .replace(/^\uFEFF/, '')
    .replace(/^\?/, '')
    .replace(/^ï»¿/, '')
    .replace(/^\uFEFF/, '');
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export async function fetchText(url, init = {}, fallbackEncoding = 'utf-8') {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder(fallbackEncoding);
  return decoder.decode(buffer);
}

export async function postFacade(action, params = {}, fallbackEncoding = 'utf-8') {
  const body = new URLSearchParams({
    action,
    provincia: params.provincia || '',
    departamento: params.departamento || '',
    localidad: params.localidad || '',
    nis: params.nis || '',
    servicios: Array.isArray(params.servicios) ? params.servicios.join(',') : (params.servicios || ''),
  });

  return fetchText(WS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body,
  }, fallbackEncoding);
}

export function parseProvinceMap(html) {
  const provinces = new Map();
  const optionRegex = /<option value="([A-Z])">([^<]+)<\/option>/g;

  for (const match of html.matchAll(optionRegex)) {
    provinces.set(match[1], cleanText(match[2]));
  }

  return provinces;
}

export function parseServices(rawText) {
  const parsed = JSON.parse(parseLeadingQuestionMark(rawText));
  return parsed[1] || {};
}

export function parseLocalities(rawText) {
  const parsed = JSON.parse(parseLeadingQuestionMark(rawText));
  return parsed.Localidades?.lista || [];
}

export function enrichBranch(baseBranch, context) {
  const admiteRecepcionEcommerce = baseBranch.serviceIds.includes(ECOMMERCE_RECEPCION_SERVICE_ID);
  const admiteEntregaEcommerce = baseBranch.serviceIds.includes(ECOMMERCE_ENTREGA_SERVICE_ID);
  const admiteEtienda = baseBranch.serviceIds.includes(ETIENDA_SERVICE_ID);
  const normalizedBranchName = normalizeSearchText(baseBranch.branchName);
  const normalizedAddress = normalizeSearchText(baseBranch.address);
  const normalizedLocalityName = normalizeSearchText(baseBranch.localityName);
  const normalizedSearchText = normalizeSearchText([
    baseBranch.branchType,
    baseBranch.branchName,
    baseBranch.address,
    baseBranch.localityName,
    context.provinceName,
    baseBranch.postalCode || '',
  ].join(' '));

  return {
    ...baseBranch,
    normalizedProvinceName: normalizeProvinceName(context.provinceName),
    normalizedBranchName,
    normalizedAddress,
    normalizedLocalityName,
    normalizedSearchText,
    admiteRecepcionEcommerce,
    admiteEntregaEcommerce,
    admiteEtienda,
    esElegibleEnvioSucursal: admiteRecepcionEcommerce || admiteEntregaEcommerce || admiteEtienda,
  };
}

export function parseBranchEntries(rawHtml, context) {
  const html = parseLeadingQuestionMark(rawHtml);
  const noResults = /No se encontraron resultados/i.test(html);
  if (noResults) {
    return { branches: [], warnings: [] };
  }

  const addressMatches = [...html.matchAll(/<address>\s*<strong>\s*(SUCURSAL|AGENCIA|UNIDAD POSTAL):\s*([^<]+?)\s*<\/strong><br>\s*([^<]*?)<br>\s*([^<]*?)<\/br>\s*<\/address>\s*<p><strong>\s*HORARIOS:\s*<\/strong>\s*([^<]*?)<\/p>/gis)];
  const serviceMatches = [...html.matchAll(/class="accordion-toggle servicios"[^>]*rel="([^"]*?)\|(\d+)"/gi)];
  const coordMatches = [...html.matchAll(/L\.marker\(\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/g)];
  const count = Math.max(addressMatches.length, serviceMatches.length, coordMatches.length);
  const warnings = [];

  if (addressMatches.length !== serviceMatches.length || addressMatches.length !== coordMatches.length) {
    warnings.push({
      localityId: context.locality.id,
      localityName: context.locality.nombre,
      addressCount: addressMatches.length,
      serviceCount: serviceMatches.length,
      coordinateCount: coordMatches.length,
    });
  }

  const branches = [];
  for (let index = 0; index < count; index += 1) {
    const address = addressMatches[index];
    if (!address) {
      continue;
    }

    const service = serviceMatches[index];
    const coords = coordMatches[index];
    const serviceIds = service?.[1] ? service[1].split(',').filter(Boolean) : [];

    const branch = enrichBranch({
      sourceKey: normalizeKey(`${context.provinceCode}|${context.locality.id}|${address[2]}|${address[3]}`),
      provinceCode: context.provinceCode,
      provinceName: context.provinceName,
      localityId: context.locality.id,
      branchType: cleanText(address[1]),
      localityName: cleanText(address[4]),
      requestedLocalityName: cleanText(context.locality.nombre),
      postalCode: context.locality.cp || null,
      branchName: cleanText(address[2]),
      address: cleanText(address[3]),
      hours: cleanText(address[5]),
      latitude: coords ? Number(coords[1]) : null,
      longitude: coords ? Number(coords[2]) : null,
      serviceIds,
      serviceNames: serviceIds.map(id => context.services[id] || `UNKNOWN_${id}`),
      scrapedAt: new Date().toISOString(),
    }, context);

    branches.push(branch);
  }

  return { branches, warnings };
}

export function dedupeBranches(branches) {
  const map = new Map();

  for (const branch of branches) {
    const existing = map.get(branch.sourceKey);
    if (!existing) {
      map.set(branch.sourceKey, branch);
      continue;
    }

    const existingScore = (existing.serviceIds?.length || 0) + (existing.latitude != null ? 1 : 0);
    const currentScore = (branch.serviceIds?.length || 0) + (branch.latitude != null ? 1 : 0);
    if (currentScore > existingScore) {
      map.set(branch.sourceKey, branch);
    }
  }

  return [...map.values()];
}

export async function loadSourceMetadata() {
  const pageHtml = await fetchText(PAGE_URL, {}, 'utf-8');
  const provinces = parseProvinceMap(pageHtml);
  const rawServices = await postFacade('serviciosall');
  const services = parseServices(rawServices);

  return {
    pageHtml,
    provinces,
    rawServices,
    services,
  };
}

export async function scrapeProvince({
  provinceCode,
  metadata,
  limitLocalities = null,
  throttleMs = 150,
  outputDir,
  saveRaw = true,
}) {
  const resolvedOutputDir = resolve(outputDir);
  const rawDir = join(resolvedOutputDir, 'raw');
  await ensureDir(resolvedOutputDir);
  if (saveRaw) {
    await ensureDir(rawDir);
  }

  const sourceMetadata = metadata || await loadSourceMetadata();
  const provinceName = sourceMetadata.provinces.get(provinceCode);
  if (!provinceName) {
    throw new Error(`Province code ${provinceCode} is not available in the current page.`);
  }

  const rawLocalities = await postFacade('localidadesconsucursales', { provincia: provinceCode });
  const localities = parseLocalities(rawLocalities);
  if (saveRaw) {
    await writeFile(join(rawDir, `services-${provinceCode}.json`), sourceMetadata.rawServices, 'utf8');
    await writeFile(join(rawDir, `localities-${provinceCode}.json`), rawLocalities, 'utf8');
  }

  const selectedLocalities = limitLocalities == null ? localities : localities.slice(0, limitLocalities);
  const allBranches = [];
  const warnings = [];
  const localitySummaries = [];

  for (let index = 0; index < selectedLocalities.length; index += 1) {
    const locality = selectedLocalities[index];
    const rawBranches = await postFacade('sucursales', {
      provincia: provinceCode,
      localidad: locality.id,
    });

    if (saveRaw) {
      await writeFile(join(rawDir, `sucursales-${provinceCode}-${locality.id}.html`), rawBranches, 'utf8');
    }

    const parsed = parseBranchEntries(rawBranches, {
      provinceCode,
      provinceName,
      locality,
      services: sourceMetadata.services,
    });

    allBranches.push(...parsed.branches);
    warnings.push(...parsed.warnings);
    localitySummaries.push({
      localityId: locality.id,
      localityName: locality.nombre,
      postalCode: locality.cp || null,
      branchCount: parsed.branches.length,
    });

    if (throttleMs > 0 && index < selectedLocalities.length - 1) {
      await sleep(throttleMs);
    }
  }

  const uniqueBranches = dedupeBranches(allBranches);
  const summary = {
    runAt: new Date().toISOString(),
    source: PAGE_URL,
    strategy: 'direct-post-requests',
    endpoint: WS_URL,
    provinceCode,
    provinceName,
    localityCount: selectedLocalities.length,
    totalProvinceLocalityCount: localities.length,
    branchCount: uniqueBranches.length,
    warningsCount: warnings.length,
    savedRaw: saveRaw,
    throttleMs,
  };

  return {
    summary,
    branches: uniqueBranches,
    warnings,
    localitySummaries,
    provinceName,
    localities,
  };
}

export async function writeProvinceArtifacts(outputDir, provinceCode, artifacts) {
  const resolvedOutputDir = resolve(outputDir);
  await ensureDir(resolvedOutputDir);

  await writeFile(join(resolvedOutputDir, `summary-${provinceCode}.json`), JSON.stringify(artifacts.summary, null, 2));
  await writeFile(join(resolvedOutputDir, `branches-${provinceCode}.json`), JSON.stringify(artifacts.branches, null, 2));
  await writeFile(join(resolvedOutputDir, `sample-${provinceCode}.json`), JSON.stringify(artifacts.branches.slice(0, 10), null, 2));
  await writeFile(join(resolvedOutputDir, `locality-summary-${provinceCode}.json`), JSON.stringify(artifacts.localitySummaries, null, 2));
  await writeFile(join(resolvedOutputDir, `warnings-${provinceCode}.json`), JSON.stringify(artifacts.warnings, null, 2));
}

export function toDatabaseRow(branch) {
  const now = new Date().toISOString();
  return {
    source_key: branch.sourceKey,
    provincia_codigo: branch.provinceCode,
    provincia_nombre: branch.provinceName,
    normalized_province_name: branch.normalizedProvinceName,
    localidad_id: branch.localityId,
    localidad_nombre: branch.localityName,
    localidad_nombre_solicitada: branch.requestedLocalityName,
    codigo_postal: branch.postalCode,
    tipo_sucursal: branch.branchType,
    nombre: branch.branchName,
    direccion: branch.address,
    horarios: branch.hours,
    latitud: branch.latitude,
    longitud: branch.longitude,
    service_ids: branch.serviceIds,
    service_names: branch.serviceNames,
    normalized_branch_name: branch.normalizedBranchName,
    normalized_address: branch.normalizedAddress,
    normalized_locality_name: branch.normalizedLocalityName,
    normalized_search_text: branch.normalizedSearchText,
    admite_recepcion_ecommerce: branch.admiteRecepcionEcommerce,
    admite_entrega_ecommerce: branch.admiteEntregaEcommerce,
    admite_etienda: branch.admiteEtienda,
    es_elegible_envio_sucursal: branch.esElegibleEnvioSucursal,
    activa: true,
    ultimo_scrapeo: branch.scrapedAt,
    fecha_actualizacion: now,
  };
}

export function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function loadEnvFile(filePath = '.env.local') {
  try {
    const envContent = await readFile(resolve(filePath), 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) continue;
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const unquoted = rawValue.replace(/^['"]|['"]$/g, '');
      process.env[key] = unquoted;
    }
  } catch {
    // Missing env file is acceptable; the caller may already provide env vars.
  }
}

export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function upsertBranches({
  supabase,
  branches,
  provinceCodes,
  tableName = 'sucursales_correo_argentino',
  chunkSize = 250,
}) {
  if (!branches.length) {
    return { upsertedCount: 0, deactivatedCount: 0 };
  }

  const rows = branches.map(toDatabaseRow);
  const { error: deactivateError } = await supabase
    .from(tableName)
    .update({ activa: false, fecha_actualizacion: new Date().toISOString() })
    .in('provincia_codigo', provinceCodes);

  if (deactivateError) {
    throw new Error(`No se pudieron desactivar registros previos: ${deactivateError.message}`);
  }

  for (const batch of chunkArray(rows, chunkSize)) {
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'source_key' });

    if (error) {
      throw new Error(`No se pudo upsertear el lote de sucursales: ${error.message}`);
    }
  }

  return {
    upsertedCount: rows.length,
    deactivatedCount: provinceCodes.length,
  };
}