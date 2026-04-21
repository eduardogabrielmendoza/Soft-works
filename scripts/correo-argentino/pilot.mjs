import { scrapeProvince, writeProvinceArtifacts } from './core.mjs';

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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const artifacts = await scrapeProvince({
    provinceCode: options.province,
    limitLocalities: options.limitLocalities,
    throttleMs: options.throttleMs,
    outputDir: options.outputDir,
    saveRaw: options.saveRaw,
  });

  const summary = {
    ...artifacts.summary,
    phase: 'pilot',
  };

  await writeProvinceArtifacts(options.outputDir, options.province, {
    ...artifacts,
    summary,
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error('[pilot] Failed:', error);
  process.exit(1);
});