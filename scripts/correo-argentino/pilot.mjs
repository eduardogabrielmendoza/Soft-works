import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const BASE_URL = 'https://www.correoargentino.com.ar';
const PAGE_URL = `${BASE_URL}/formularios/sucursales`;
const WS_URL = `${BASE_URL}/sites/all/modules/custom/ca_forms/api/wsFacade.php`;
const DEFAULT_HEADERS = {
  'accept-language': 'es-AR,es;q=0.9',
  'user-agent': 'SoftworksBot/1.0 (+https://softworks.com.ar)',
};

function parseArgs(argv) {
  const options = {
    province: 'V',
    limitLocalities: null,
    throttleMs: 150,
    outputDir: 'scripts/correo-argentino/output/pilot',
    saveRaw: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--province') {
      options.province = argv[index + 1]?.toUpperCase() || options.province;
      index += 1;
      continue;
    }

    if (arg === '--limit-localities') {
      const parsed = Number(argv[index + 1]);
      options.limitLocalities = Number.isFinite(parsed) ? parsed : null;
      index += 1;
      continue;
    }

    if (arg === '--throttle-ms') {
      const parsed = Number(argv[index + 1]);
      options.throttleMs = Number.isFinite(parsed) ? parsed : options.throttleMs;
      index += 1;
      continue;
    }

    if (arg === '--output-dir') {
      options.outputDir = argv[index + 1] || options.outputDir;
      index += 1;
      continue;
    }

    if (arg === '--no-save-raw') {
      options.saveRaw = false;
      continue;
    }

    if (arg === '--help') {
      console.log(`
Uso:
  npm run scrape:correo-pilot -- --province V

Opciones:
  --province <codigo>         Codigo de provincia de Correo Argentino (default: V)
  --limit-localities <n>      Limita la cantidad de localidades a procesar
  --throttle-ms <ms>          Pausa entre requests de sucursales (default: 150)
  --output-dir <ruta>         Directorio de salida (default: scripts/correo-argentino/output/pilot)
  --no-save-raw               No guarda respuestas crudas por localidad
      `.trim());
      process.exit(0);
    }
  }

  return options;
}

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

function cleanText(value) {
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

function normalizeKey(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function parseLeadingQuestionMark(text) {
  return text
    .replace(/^ï»¿/, '')
    .replace(/^\uFEFF/, '')
    .replace(/^\?/, '')
    .replace(/^ï»¿/, '')
    .replace(/^\uFEFF/, '');
}

async function fetchText(url, init = {}, fallbackEncoding = 'utf-8') {
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

async function postFacade(action, params = {}, fallbackEncoding = 'utf-8') {
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

function parseProvinceMap(html) {
  const provinces = new Map();
  const optionRegex = /<option value="([A-Z])">([^<]+)<\/option>/g;

  for (const match of html.matchAll(optionRegex)) {
    provinces.set(match[1], cleanText(match[2]));
  }

  return provinces;
}

function parseServices(rawText) {
  const parsed = JSON.parse(parseLeadingQuestionMark(rawText));
  return parsed[1] || {};
}

function parseLocalities(rawText) {
  const parsed = JSON.parse(parseLeadingQuestionMark(rawText));
  return parsed.Localidades?.lista || [];
}

function parseBranchEntries(rawHtml, context) {
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

    const branchType = cleanText(address[1]);
    const branchName = cleanText(address[2]);
    const streetAddress = cleanText(address[3]);
    const localityName = cleanText(address[4]);
    const hours = cleanText(address[5]);

    branches.push({
      sourceKey: normalizeKey(`${context.provinceCode}|${context.locality.id}|${branchName}|${streetAddress}`),
      provinceCode: context.provinceCode,
      provinceName: context.provinceName,
      localityId: context.locality.id,
      branchType,
      localityName,
      requestedLocalityName: cleanText(context.locality.nombre),
      postalCode: context.locality.cp || null,
      branchName,
      address: streetAddress,
      hours,
      latitude: coords ? Number(coords[1]) : null,
      longitude: coords ? Number(coords[2]) : null,
      serviceIds,
      serviceNames: serviceIds.map(id => context.services[id] || `UNKNOWN_${id}`),
      scrapedAt: new Date().toISOString(),
    });
  }

  return { branches, warnings };
}

function dedupeBranches(branches) {
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

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outputDir = resolve(options.outputDir);
  const rawDir = join(outputDir, 'raw');

  await ensureDir(outputDir);
  if (options.saveRaw) {
    await ensureDir(rawDir);
  }

  console.log(`[pilot] Fetching base page: ${PAGE_URL}`);
  const pageHtml = await fetchText(PAGE_URL, {}, 'utf-8');
  const provinces = parseProvinceMap(pageHtml);
  const provinceName = provinces.get(options.province);

  if (!provinceName) {
    throw new Error(`Province code ${options.province} is not available in the current page.`);
  }

  console.log(`[pilot] Province selected: ${provinceName} (${options.province})`);

  const rawServices = await postFacade('serviciosall');
  const services = parseServices(rawServices);
  const rawLocalities = await postFacade('localidadesconsucursales', { provincia: options.province });
  const localities = parseLocalities(rawLocalities);

  if (options.saveRaw) {
    await writeFile(join(rawDir, `services-${options.province}.json`), rawServices, 'utf8');
    await writeFile(join(rawDir, `localities-${options.province}.json`), rawLocalities, 'utf8');
  }

  const selectedLocalities = options.limitLocalities == null
    ? localities
    : localities.slice(0, options.limitLocalities);

  console.log(`[pilot] Localities discovered: ${localities.length}. Processing: ${selectedLocalities.length}.`);

  const allBranches = [];
  const warnings = [];
  const localitySummaries = [];

  for (let index = 0; index < selectedLocalities.length; index += 1) {
    const locality = selectedLocalities[index];
    console.log(`[pilot] ${index + 1}/${selectedLocalities.length} -> ${locality.nombre} (${locality.cp || 'sin CP'})`);

    const rawBranches = await postFacade('sucursales', {
      provincia: options.province,
      localidad: locality.id,
    });

    if (options.saveRaw) {
      await writeFile(join(rawDir, `sucursales-${options.province}-${locality.id}.html`), rawBranches, 'utf8');
    }

    const parsed = parseBranchEntries(rawBranches, {
      provinceCode: options.province,
      provinceName,
      locality,
      services,
    });

    allBranches.push(...parsed.branches);
    warnings.push(...parsed.warnings);
    localitySummaries.push({
      localityId: locality.id,
      localityName: locality.nombre,
      postalCode: locality.cp || null,
      branchCount: parsed.branches.length,
    });

    if (options.throttleMs > 0 && index < selectedLocalities.length - 1) {
      await sleep(options.throttleMs);
    }
  }

  const uniqueBranches = dedupeBranches(allBranches);
  const summary = {
    runAt: new Date().toISOString(),
    phase: 'pilot',
    source: PAGE_URL,
    strategy: 'direct-post-requests',
    endpoint: WS_URL,
    provinceCode: options.province,
    provinceName,
    localityCount: selectedLocalities.length,
    totalProvinceLocalityCount: localities.length,
    branchCount: uniqueBranches.length,
    warningsCount: warnings.length,
    savedRaw: options.saveRaw,
    throttleMs: options.throttleMs,
  };

  await writeFile(join(outputDir, `summary-${options.province}.json`), JSON.stringify(summary, null, 2));
  await writeFile(join(outputDir, `branches-${options.province}.json`), JSON.stringify(uniqueBranches, null, 2));
  await writeFile(join(outputDir, `sample-${options.province}.json`), JSON.stringify(uniqueBranches.slice(0, 10), null, 2));
  await writeFile(join(outputDir, `locality-summary-${options.province}.json`), JSON.stringify(localitySummaries, null, 2));
  await writeFile(join(outputDir, `warnings-${options.province}.json`), JSON.stringify(warnings, null, 2));

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error('[pilot] Failed:', error);
  process.exit(1);
});