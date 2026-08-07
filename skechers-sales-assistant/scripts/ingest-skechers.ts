// Method 1 — Real Skechers Product Ingestion & Web Connector (CLI runner).
//
//   npm run ingest:skechers -- --styles=232625,124500,216202
//   npm run ingest:skechers -- --styles=232625 --auto-approve --update-demo
//   npm run ingest:skechers -- --file=./data/skechers-export.json --region=US --currency=USD
//
// Sources AUTHORIZED sample records (fixtures / a provided export file),
// extracts + normalizes them, wires generated recommendation relationships, and
// runs everything through the Phase 3 catalogue importer. Emits an idempotent SQL
// script (and optionally the browser-demo module). NO live scraping of
// skechers.com — see CLAUDE.md and database/GOVERNANCE.md.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createSource } from './skechers/source';
import { runIngest, resultToSql, resultToDemoModule } from './skechers/pipeline';
import { ANCHOR_STYLES, DEFAULT_SAMPLE_STYLES } from './skechers/fixtures';
import type { IngestOptions } from './skechers/types';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

async function main(): Promise<void> {
  const requested = (arg('styles') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const file = arg('file');
  const region = arg('region') ?? 'AE';
  const currency = arg('currency') ?? 'AED';
  const autoApprove = flag('auto-approve');
  const updateDemo = flag('update-demo');
  const dryRun = flag('dry-run');
  const live = flag('live');
  const outPath = arg('out') ?? resolve(repo, 'supabase/seed/skechers_ingested.sql');

  // Auto-include anchor styles so generated relationships resolve.
  const base = requested.length > 0 ? requested : DEFAULT_SAMPLE_STYLES;
  const styles = [...new Set([...base, ...ANCHOR_STYLES])];

  const opts: IngestOptions = {
    region, currency, autoApprove, importedBy: 'skechers_ingest', syncedAt: new Date().toISOString(),
  };

  console.log('=== Skechers Ingestion (Method 1) ===');
  console.log(`source=${live ? 'live-web (gated)' : 'fixture/export'}  region=${region}  currency=${currency}  approval=${autoApprove ? 'approved' : 'pending_review'}`);
  console.log(`requested styles: ${base.join(', ')}`);
  console.log(`+ anchors auto-included: ${ANCHOR_STYLES.join(', ')}\n`);

  const source = createSource({ file, live, endpoint: arg('endpoint') });
  const result = await runIngest({ styles, source, opts });

  // Extraction / normalization summary.
  console.log('EXTRACTED + NORMALIZED PRODUCTS:');
  console.log('sku            | name                                        | cat       | tier    | price   | need');
  console.log('---------------+---------------------------------------------+-----------+---------+---------+-----------');
  for (const n of result.rows) {
    const r = n.row;
    const sku = String(r.sku).padEnd(13);
    const name = String(r.name).slice(0, 43).padEnd(43);
    const cat = String(r.category).padEnd(9);
    const tier = n.priceTier.padEnd(7);
    const price = `${r.currency} ${r.price ?? '-'}`.padEnd(7);
    console.log(`${sku} | ${name} | ${cat} | ${tier} | ${price} | -`);
  }

  console.log(`\nIMPORT PREVIEW (Phase 3): total=${result.preview.totalRows} valid=${result.preview.validRows} invalid=${result.preview.invalidRows}`);
  if (result.preview.errorReport.length > 0) {
    for (const e of result.preview.errorReport) {
      for (const err of e.errors) console.log(`  row ${e.rowNumber}: [${err.code}] ${err.message}`);
    }
  } else {
    console.log('  no validation errors.');
  }
  console.log(`  plan: insert=${result.plan.toInsert.length} update=${result.plan.toUpdate.length} conflictsProtected=${result.plan.conflictsProtected.length} skipped=${result.plan.skipped.length}`);

  console.log(`\nGENERATED RELATIONSHIPS (${result.relationships.length}):`);
  const bySource = new Map<string, typeof result.relationships>();
  for (const rel of result.relationships) {
    const list = bySource.get(rel.sourceSku) ?? [];
    list.push(rel);
    bySource.set(rel.sourceSku, list);
  }
  for (const [src, rels] of bySource) {
    console.log(`  ${src}:`);
    for (const rel of rels) console.log(`     -${rel.relationship_type.padEnd(20)} → ${rel.targetSku.padEnd(14)} (${rel.reason})`);
  }

  const sql = resultToSql(result);
  if (!dryRun) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, sql);
    console.log(`\nWROTE SQL: ${outPath}  (${sql.split('\n').length} lines)`);
    if (updateDemo) {
      const demoPath = resolve(repo, 'src/demo/ingested.generated.ts');
      writeFileSync(demoPath, resultToDemoModule(result));
      console.log(`WROTE DEMO MODULE: ${demoPath}`);
    }
  } else {
    console.log('\n[dry-run] no files written.');
  }
  console.log('\nDone. Apply the SQL to a Supabase/staging DB to persist the records (never production without review).');
}

main().catch((e) => {
  console.error('ingestion failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
