import { resolve, join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import {
  PAGE_URL,
  ensureDir,
  scrapeProvince,
  writeProvinceArtifacts,
  loadSourceMetadata,
  loadEnvFile,
  createSupabaseAdmin,
  upsertBranches,
} from './core.mjs';

function parseArgs(argv) {
  const options = {
    province: null,
    limitLocalities: null,
    limitProvinces: null,
    throttleMs: 150,
    outputDir: 'scripts/correo-argentino/output/full',
    saveRaw: false,
    upsertSupabase: false,
    chunkSize: 250,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--province') {
      options.province = argv[index + 1]?.toUpperCase() || null;
      index += 1;
      continue;
    }

    if (arg === '--limit-localities') {
      const parsed = Number(argv[index + 1]);
      options.limitLocalities = Number.isFinite(parsed) ? parsed : null;
      index += 1;
      continue;
    }

    if (arg === '--limit-provinces') {
      const parsed = Number(argv[index + 1]);
      options.limitProvinces = Number.isFinite(parsed) ? parsed : null;
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

    if (arg === '--save-raw') {
      options.saveRaw = true;
      continue;
    }

    if (arg === '--upsert-supabase') {
      options.upsertSupabase = true;
      continue;
    }

    if (arg === '--chunk-size') {
      const parsed = Number(argv[index + 1]);
      options.chunkSize = Number.isFinite(parsed) ? parsed : options.chunkSize;
      index += 1;
      continue;
    }

    if (arg === '--help') {
      console.log(`
Uso:
  npm run scrape:correo-sync -- --province V
  npm run scrape:correo-sync -- --upsert-supabase

Opciones:
  --province <codigo>         Procesa una sola provincia
  --limit-provinces <n>       Limita la cantidad de provincias a procesar
  --limit-localities <n>      Limita localidades por provincia
  --throttle-ms <ms>          Pausa entre requests (default: 150)
  --output-dir <ruta>         Directorio de salida (default: scripts/correo-argentino/output/full)
  --save-raw                  Guarda respuestas crudas por provincia/localidad
  --upsert-supabase           Upsertea el resultado en Supabase usando .env.local
  --chunk-size <n>            Lote de upsert (default: 250)
      `.trim());
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outputDir = resolve(options.outputDir);
  await ensureDir(outputDir);

  console.log('[sync] Loading source metadata...');
  const metadata = await loadSourceMetadata();
  const availableProvinceCodes = [...metadata.provinces.keys()];
  const provinceCodes = options.province
    ? [options.province]
    : (options.limitProvinces == null ? availableProvinceCodes : availableProvinceCodes.slice(0, options.limitProvinces));

  const provincesSummary = [];
  const allBranches = [];
  const allWarnings = [];

  for (const [index, provinceCode] of provinceCodes.entries()) {
    const provinceName = metadata.provinces.get(provinceCode);
    console.log(`[sync] ${index + 1}/${provinceCodes.length} -> ${provinceName} (${provinceCode})`);

    const artifacts = await scrapeProvince({
      provinceCode,
      metadata,
      limitLocalities: options.limitLocalities,
      throttleMs: options.throttleMs,
      outputDir: join(outputDir, provinceCode),
      saveRaw: options.saveRaw,
    });

    await writeProvinceArtifacts(join(outputDir, provinceCode), provinceCode, artifacts);

    provincesSummary.push(artifacts.summary);
    allBranches.push(...artifacts.branches);
    allWarnings.push(...artifacts.warnings);
  }

  const aggregateSummary = {
    runAt: new Date().toISOString(),
    phase: 'full-sync',
    source: PAGE_URL,
    provinceCount: provinceCodes.length,
    branchCount: allBranches.length,
    warningsCount: allWarnings.length,
    upsertSupabase: options.upsertSupabase,
    throttleMs: options.throttleMs,
  };

  await writeFile(join(outputDir, 'summary.json'), JSON.stringify(aggregateSummary, null, 2));
  await writeFile(join(outputDir, 'province-summary.json'), JSON.stringify(provincesSummary, null, 2));
  await writeFile(join(outputDir, 'branches.json'), JSON.stringify(allBranches, null, 2));
  await writeFile(join(outputDir, 'warnings.json'), JSON.stringify(allWarnings, null, 2));

  if (options.upsertSupabase) {
    console.log('[sync] Loading environment and upserting to Supabase...');
    await loadEnvFile();
    const supabase = createSupabaseAdmin();
    const upsertResult = await upsertBranches({
      supabase,
      branches: allBranches,
      provinceCodes,
      chunkSize: options.chunkSize,
    });
    await writeFile(join(outputDir, 'upsert-result.json'), JSON.stringify(upsertResult, null, 2));
  }

  console.log(JSON.stringify(aggregateSummary, null, 2));
}

main().catch(error => {
  console.error('[sync] Failed:', error);
  process.exit(1);
});