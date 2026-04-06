// =============================================
// Mapeo de Códigos Postales Argentinos → Provincia
// Sistema tradicional de 4 dígitos
// =============================================

interface PostalLookupResult {
  provincia: string
  codigoPostal: string
}

// Rangos de códigos postales por provincia (ordenados ascendente, sin solapamientos)
// Fuente: Sistema postal argentino tradicional (CPA de 4 dígitos)
const CP_RANGES: [number, number, string][] = [
  // CABA
  [1000, 1440, 'Ciudad Autónoma de Buenos Aires'],

  // Buenos Aires - Gran Buenos Aires y alrededores
  [1441, 1599, 'Buenos Aires'],
  [1600, 1699, 'Buenos Aires'],
  [1700, 1799, 'Buenos Aires'],
  [1800, 1899, 'Buenos Aires'],
  [1900, 1999, 'Buenos Aires'],

  // Santa Fe - sur y centro
  [2000, 2099, 'Santa Fe'], // Rosario
  [2100, 2199, 'Santa Fe'],
  [2200, 2299, 'Santa Fe'],
  [2300, 2399, 'Santa Fe'],
  [2400, 2499, 'Santa Fe'],
  [2500, 2599, 'Santa Fe'],
  [2600, 2699, 'Santa Fe'],

  // Buenos Aires - norte (Pergamino, San Nicolás, etc.)
  [2700, 2799, 'Buenos Aires'],
  [2800, 2829, 'Buenos Aires'],

  // Santa Fe - norte
  [2830, 2899, 'Santa Fe'],
  [2900, 2999, 'Santa Fe'],

  // Entre Ríos
  [3000, 3099, 'Entre Ríos'], // Paraná
  [3100, 3199, 'Entre Ríos'],
  [3200, 3299, 'Entre Ríos'],

  // Misiones
  [3300, 3399, 'Misiones'],

  // Corrientes
  [3400, 3499, 'Corrientes'],

  // Chaco
  [3500, 3599, 'Chaco'], // Resistencia

  // Formosa
  [3600, 3699, 'Formosa'],

  // Chaco - extensión norte
  [3700, 3749, 'Chaco'],

  // Corrientes - extensión
  [3750, 3799, 'Corrientes'],

  // Santiago del Estero - zona limítrofe
  [3800, 3899, 'Santiago del Estero'],

  // Tucumán - zona limítrofe
  [3900, 3999, 'Tucumán'],

  // Tucumán
  [4000, 4099, 'Tucumán'], // San Miguel de Tucumán
  [4100, 4199, 'Tucumán'],

  // Santiago del Estero
  [4200, 4299, 'Santiago del Estero'], // Santiago del Estero capital
  [4300, 4399, 'Santiago del Estero'],

  // Salta
  [4400, 4499, 'Salta'], // Salta capital
  [4500, 4599, 'Salta'],

  // Jujuy
  [4600, 4699, 'Jujuy'], // San Salvador de Jujuy

  // Catamarca
  [4700, 4799, 'Catamarca'], // San Fernando del Valle de Catamarca
  [4800, 4899, 'Catamarca'],

  // Catamarca / La Rioja limítrofe
  [4900, 4999, 'Catamarca'],

  // Córdoba - centro y norte
  [5000, 5099, 'Córdoba'], // Córdoba capital
  [5100, 5199, 'Córdoba'],
  [5200, 5299, 'Córdoba'],

  // La Rioja
  [5300, 5399, 'La Rioja'], // La Rioja capital

  // San Juan
  [5400, 5499, 'San Juan'], // San Juan capital

  // Mendoza
  [5500, 5599, 'Mendoza'], // Mendoza capital
  [5600, 5699, 'Mendoza'],

  // San Luis
  [5700, 5799, 'San Luis'], // San Luis capital

  // Córdoba - sur
  [5800, 5899, 'Córdoba'], // Río Cuarto
  [5900, 5999, 'Córdoba'],

  // Buenos Aires - oeste (Junín, Chivilcoy, etc.)
  [6000, 6099, 'Buenos Aires'],
  [6100, 6199, 'Buenos Aires'],

  // Córdoba - sureste (Laboulaye, etc.)
  [6200, 6299, 'Córdoba'],

  // La Pampa
  [6300, 6399, 'La Pampa'], // Santa Rosa

  // Buenos Aires - oeste extensión (Trenque Lauquen, Pehuajó, etc.)
  [6400, 6499, 'Buenos Aires'],
  [6500, 6599, 'Buenos Aires'],
  [6600, 6699, 'Buenos Aires'],

  // Buenos Aires - zona centro
  [6700, 6799, 'Buenos Aires'], // Luján

  // Buenos Aires - zona sur/oeste
  [6800, 6899, 'Buenos Aires'],
  [6900, 6999, 'Buenos Aires'],

  // Buenos Aires - costa atlántica y sur
  [7000, 7099, 'Buenos Aires'], // Tandil
  [7100, 7199, 'Buenos Aires'], // Azul
  [7200, 7299, 'Buenos Aires'], // Balcarce
  [7300, 7399, 'Buenos Aires'], // Necochea
  [7400, 7499, 'Buenos Aires'], // Olavarría
  [7500, 7599, 'Buenos Aires'], // Mar del Plata extensión
  [7600, 7699, 'Buenos Aires'], // Mar del Plata

  // Buenos Aires - zona sur/interior
  [7700, 7799, 'Buenos Aires'],
  [7800, 7899, 'Buenos Aires'],
  [7900, 7999, 'Buenos Aires'],

  // Buenos Aires - Bahía Blanca y alrededores
  [8000, 8099, 'Buenos Aires'], // Bahía Blanca
  [8100, 8199, 'Buenos Aires'],

  // La Pampa - sur
  [8200, 8299, 'La Pampa'], // General Pico, Gral. Acha

  // Neuquén
  [8300, 8399, 'Neuquén'], // Neuquén capital

  // Río Negro
  [8400, 8499, 'Río Negro'], // Cipolletti, General Roca
  [8500, 8599, 'Río Negro'], // Viedma

  // Neuquén - extensión (San Martín de los Andes, etc.)
  [8370, 8399, 'Neuquén'],

  // Río Negro - extensión
  [8600, 8699, 'Río Negro'],

  // Chubut - norte
  [8700, 8799, 'Chubut'],

  // Chubut
  [9000, 9099, 'Chubut'], // Comodoro Rivadavia
  [9100, 9199, 'Chubut'], // Trelew, Rawson
  [9200, 9299, 'Chubut'], // Esquel

  // Santa Cruz
  [9300, 9399, 'Santa Cruz'], // Río Gallegos

  // Tierra del Fuego
  [9400, 9499, 'Tierra del Fuego'], // Río Grande
  [9500, 9599, 'Tierra del Fuego'], // Ushuaia

  // Santa Cruz - extensión
  [9600, 9699, 'Santa Cruz'],
]

/**
 * Extrae el código postal numérico de 4 dígitos.
 * Soporta formato tradicional (4 dígitos) y CPA (letra + 4 dígitos + 3 letras).
 */
function extractNumericCP(input: string): number | null {
  const cleaned = input.trim().toUpperCase()

  // Formato CPA: B1636ABC → extraer 1636
  const cpaMatch = cleaned.match(/^[A-Z](\d{4})[A-Z]{0,3}$/)
  if (cpaMatch) {
    return parseInt(cpaMatch[1], 10)
  }

  // Formato tradicional: 4 dígitos
  const numMatch = cleaned.match(/^(\d{4})$/)
  if (numMatch) {
    return parseInt(numMatch[1], 10)
  }

  return null
}

/**
 * Busca la provincia correspondiente a un código postal argentino.
 * Retorna null si no se encuentra coincidencia.
 */
export function lookupPostalCode(codigoPostal: string): PostalLookupResult | null {
  const numeric = extractNumericCP(codigoPostal)
  if (numeric === null) return null

  // Buscar en rangos (el último match gana para manejar solapamientos intencionales)
  let result: string | null = null
  for (const [min, max, provincia] of CP_RANGES) {
    if (numeric >= min && numeric <= max) {
      result = provincia
    }
  }

  if (result) {
    return {
      provincia: result,
      codigoPostal: numeric.toString(),
    }
  }

  return null
}

/**
 * Valida que el input tenga formato de código postal argentino válido.
 */
export function isValidPostalFormat(input: string): boolean {
  return extractNumericCP(input) !== null
}
