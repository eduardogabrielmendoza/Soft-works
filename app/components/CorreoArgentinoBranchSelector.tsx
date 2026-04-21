'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Clock3, Loader2, MapPin, Search, Store } from 'lucide-react';
import type {
  CorreoArgentinoBranchSearchResponse,
  CorreoArgentinoBranchSearchResult,
  SucursalCorreoSeleccionada,
} from '@/lib/types/database.types';

interface CorreoArgentinoBranchSelectorProps {
  postalCode: string;
  province: string;
  selectedBranch: SucursalCorreoSeleccionada | null;
  onSelect: (branch: SucursalCorreoSeleccionada) => void;
}

function mapBranchSelection(branch: CorreoArgentinoBranchSearchResult): SucursalCorreoSeleccionada {
  return {
    id: branch.id,
    source_key: branch.source_key,
    tipo_sucursal: branch.tipo_sucursal,
    nombre: branch.nombre,
    direccion: branch.direccion,
    localidad_nombre: branch.localidad_nombre,
    provincia_nombre: branch.provincia_nombre,
    codigo_postal: branch.codigo_postal,
    horarios: branch.horarios,
    latitud: branch.latitud,
    longitud: branch.longitud,
    service_ids: branch.service_ids,
    service_names: branch.service_names,
    es_elegible_envio_sucursal: branch.es_elegible_envio_sucursal,
  };
}

function BranchCard({
  branch,
  isSelected,
  onSelect,
}: {
  branch: CorreoArgentinoBranchSearchResult;
  isSelected: boolean;
  onSelect: (branch: CorreoArgentinoBranchSearchResult) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(branch)}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        isSelected
          ? 'border-foreground bg-gray-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{branch.nombre}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
              {branch.tipo_sucursal}
            </span>
            {branch.postal_code_match && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                Coincide con tu CP
              </span>
            )}
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p>{branch.direccion}</p>
              <p>
                {branch.localidad_nombre}, {branch.provincia_nombre}
                {branch.codigo_postal ? ` - CP ${branch.codigo_postal}` : ''}
              </p>
            </div>
          </div>
          {branch.horarios && (
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{branch.horarios}</p>
            </div>
          )}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            isSelected
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isSelected ? 'Seleccionada' : 'Elegir'}
        </span>
      </div>
    </button>
  );
}

export default function CorreoArgentinoBranchSelector({
  postalCode,
  province,
  selectedBranch,
  onSelect,
}: CorreoArgentinoBranchSelectorProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const [data, setData] = useState<CorreoArgentinoBranchSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery('');
    setData(null);
    setError(null);
  }, [postalCode, province]);

  useEffect(() => {
    if (!postalCode || !province) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          postalCode,
          province,
          limit: '8',
        });

        if (deferredQuery) {
          searchParams.set('q', deferredQuery);
        }

        const response = await fetch(`/api/shipping/correo-argentino/branches?${searchParams.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'No pudimos cargar las sucursales disponibles.');
        }

        setData(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Error loading Correo Argentino branches:', fetchError);
        setData(null);
        setError('No pudimos cargar las sucursales disponibles para este código postal.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, deferredQuery ? 180 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [postalCode, province, deferredQuery]);

  const recommendedBranch = data?.recommendation ?? null;
  const branches = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-gray-500">Buscar sucursal</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-gray-300 py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Buscar por nombre, calle o localidad"
          />
          {isLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Te sugerimos la más cercana por código postal y también podés refinar por nombre, dirección o localidad.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {selectedBranch && (
        <div className="rounded-xl border border-foreground bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Store className="h-4 w-4" />
            Sucursal seleccionada
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <p className="font-medium text-foreground">{selectedBranch.nombre}</p>
            <p>{selectedBranch.direccion}</p>
            <p>
              {selectedBranch.localidad_nombre}, {selectedBranch.provincia_nombre}
              {selectedBranch.codigo_postal ? ` - CP ${selectedBranch.codigo_postal}` : ''}
            </p>
            {selectedBranch.horarios && <p>{selectedBranch.horarios}</p>}
          </div>
        </div>
      )}

      {!selectedBranch && recommendedBranch && !deferredQuery && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Recomendada para tu CP</p>
          <BranchCard
            branch={recommendedBranch}
            isSelected={false}
            onSelect={(branch) => onSelect(mapBranchSelection(branch))}
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          {deferredQuery ? 'Resultados' : 'Otras sucursales disponibles'}
        </p>

        {branches.length > 0 ? (
          <div className="space-y-3">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                isSelected={selectedBranch?.id === branch.id}
                onSelect={(selected) => onSelect(mapBranchSelection(selected))}
              />
            ))}
          </div>
        ) : !isLoading && !error ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
            No encontramos sucursales para este criterio. Probá con otra búsqueda o volvé a envío a domicilio.
          </div>
        ) : null}
      </div>
    </div>
  );
}