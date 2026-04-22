import type { TipoEntrega } from '@/lib/types/database.types';

export type ShippingZoneKey = 'caba' | 'provincia' | 'interior_norte' | 'interior_sur';
export type ShippingDeliveryKey = Extract<TipoEntrega, 'domicilio' | 'sucursal_correo'>;

export interface ShippingZoneRates {
  domicilio: number;
  sucursal_correo: number;
}

export type ShippingRatesConfig = Record<ShippingZoneKey, ShippingZoneRates>;

export type PartialShippingRatesConfig = Partial<
  Record<ShippingZoneKey, Partial<ShippingZoneRates>>
>;

interface ShippingZoneDefinition {
  key: ShippingZoneKey;
  label: string;
  description: string;
  provinces: string[];
  aliases?: string[];
}

export const DEFAULT_SHIPPING_RATES: ShippingRatesConfig = {
  caba: {
    domicilio: 5000,
    sucursal_correo: 4500,
  },
  provincia: {
    domicilio: 7500,
    sucursal_correo: 5500,
  },
  interior_norte: {
    domicilio: 8500,
    sucursal_correo: 6500,
  },
  interior_sur: {
    domicilio: 8500,
    sucursal_correo: 6500,
  },
};

export const SHIPPING_ZONE_DEFINITIONS: ShippingZoneDefinition[] = [
  {
    key: 'caba',
    label: 'CABA',
    description: 'Capital Federal / Ciudad Autonoma de Buenos Aires',
    provinces: ['Ciudad Autonoma de Buenos Aires', 'Capital Federal'],
    aliases: ['CABA'],
  },
  {
    key: 'provincia',
    label: 'Provincia',
    description: 'Buenos Aires y variantes de GBA',
    provinces: [
      'Buenos Aires',
      'Buenos Aires - GBA Norte',
      'Buenos Aires - GBA Sur',
      'Buenos Aires - GBA Oeste',
    ],
    aliases: ['Provincia de Buenos Aires'],
  },
  {
    key: 'interior_norte',
    label: 'Interior Norte',
    description: 'Centro, NOA, NEA y Cuyo norte',
    provinces: [
      'Mendoza',
      'San Luis',
      'San Juan',
      'La Rioja',
      'Catamarca',
      'Tucuman',
      'Salta',
      'Jujuy',
      'Chaco',
      'Formosa',
      'Cordoba',
      'Santa Fe',
      'Entre Rios',
      'Corrientes',
      'Misiones',
      'Santiago del Estero',
    ],
  },
  {
    key: 'interior_sur',
    label: 'Interior Sur',
    description: 'Patagonia y La Pampa',
    provinces: [
      'La Pampa',
      'Neuquen',
      'Rio Negro',
      'Chubut',
      'Santa Cruz',
      'Tierra del Fuego',
    ],
    aliases: ['Tierra del Fuego, Antartida e Islas del Atlantico Sur'],
  },
];

const zoneLookup = SHIPPING_ZONE_DEFINITIONS.reduce<Record<string, ShippingZoneKey>>((lookup, zone) => {
  for (const province of zone.provinces) {
    lookup[normalizeShippingText(province)] = zone.key;
  }

  for (const alias of zone.aliases ?? []) {
    lookup[normalizeShippingText(alias)] = zone.key;
  }

  return lookup;
}, {});

function normalizeShippingText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function toSafeNumber(value: unknown, fallback: number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function normalizeShippingRatesConfig(
  value?: PartialShippingRatesConfig | null,
): ShippingRatesConfig {
  return {
    caba: {
      domicilio: toSafeNumber(value?.caba?.domicilio, DEFAULT_SHIPPING_RATES.caba.domicilio),
      sucursal_correo: toSafeNumber(
        value?.caba?.sucursal_correo,
        DEFAULT_SHIPPING_RATES.caba.sucursal_correo,
      ),
    },
    provincia: {
      domicilio: toSafeNumber(
        value?.provincia?.domicilio,
        DEFAULT_SHIPPING_RATES.provincia.domicilio,
      ),
      sucursal_correo: toSafeNumber(
        value?.provincia?.sucursal_correo,
        DEFAULT_SHIPPING_RATES.provincia.sucursal_correo,
      ),
    },
    interior_norte: {
      domicilio: toSafeNumber(
        value?.interior_norte?.domicilio,
        DEFAULT_SHIPPING_RATES.interior_norte.domicilio,
      ),
      sucursal_correo: toSafeNumber(
        value?.interior_norte?.sucursal_correo,
        DEFAULT_SHIPPING_RATES.interior_norte.sucursal_correo,
      ),
    },
    interior_sur: {
      domicilio: toSafeNumber(
        value?.interior_sur?.domicilio,
        DEFAULT_SHIPPING_RATES.interior_sur.domicilio,
      ),
      sucursal_correo: toSafeNumber(
        value?.interior_sur?.sucursal_correo,
        DEFAULT_SHIPPING_RATES.interior_sur.sucursal_correo,
      ),
    },
  };
}

export function resolveShippingZone(province: string): ShippingZoneKey | null {
  const normalizedProvince = normalizeShippingText(province);

  if (!normalizedProvince) {
    return null;
  }

  return zoneLookup[normalizedProvince] ?? null;
}

export function getShippingCostForProvince(
  province: string,
  deliveryType: ShippingDeliveryKey,
  rates?: PartialShippingRatesConfig | null,
) {
  const normalizedRates = normalizeShippingRatesConfig(rates);
  const zone = resolveShippingZone(province);

  if (zone) {
    return normalizedRates[zone][deliveryType];
  }

  if (normalizeShippingText(province).includes('buenos aires')) {
    return normalizedRates.provincia[deliveryType];
  }

  return normalizedRates.interior_norte[deliveryType];
}

export function getLegacyShippingCost(rates?: PartialShippingRatesConfig | null) {
  const normalizedRates = normalizeShippingRatesConfig(rates);
  return Math.max(
    normalizedRates.caba.domicilio,
    normalizedRates.provincia.domicilio,
    normalizedRates.interior_norte.domicilio,
    normalizedRates.interior_sur.domicilio,
  );
}