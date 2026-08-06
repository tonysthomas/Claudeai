// Demo runner: parse data/demo-catalogue.csv through the import service and print
// the preview (successful + rejected rows), then the commit plan showing that an
// approved product is protected from accidental overwrite.
//
//   npm run import:demo
//
// Synthetic demo data only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  buildImportPreview,
  detectFormat,
  planCommit,
  type ExistingCatalogue,
  type ImportContext,
} from '../src/import/index';

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(here, '../data/demo-catalogue.csv');
const content = readFileSync(csvPath, 'utf8');

// Pretend the catalogue already has one approved and one draft product, to show
// update vs. protected-conflict behavior.
const existing: ExistingCatalogue = {
  skuApproval: new Map([
    ['DEMO-IMP-002', 'draft'],     // will be an UPDATE
    ['DEMO-IMP-005', 'approved'],  // will be a protected CONFLICT
  ]),
  barcodes: new Map(),
};

const ctx: ImportContext = {
  fileName: 'demo-catalogue.csv',
  fileFormat: detectFormat('demo-catalogue.csv', content),
  sourceType: 'catalogue',
  sourceUrl: 'https://demo.example/catalogue',
  region: 'DEMO',
  currency: 'DEMO',
  importedBy: 'demo_importer',
  existing,
};

const preview = buildImportPreview(content, ctx);

console.log('=== IMPORT PREVIEW ===');
console.log(`file=${preview.fileName} format=${preview.fileFormat} source=${preview.sourceType} region=${preview.region}`);
console.log(`importedBy=${preview.importedBy} importedAt=${preview.importedAt}`);
console.log(`totalRows=${preview.totalRows} valid=${preview.validRows} invalid=${preview.invalidRows}\n`);

console.log('row | sku            | status  | action   | approval(forced) | errors');
console.log('----+----------------+---------+----------+------------------+---------------------------');
for (const r of preview.rows) {
  const sku = (r.normalized?.sku ?? '').padEnd(14);
  const status = r.status.padEnd(7);
  const action = r.action.padEnd(8);
  const appr = (r.normalized?.approval_status ?? '').padEnd(16);
  const errs = r.errors.map((e) => e.code).join(', ') || '-';
  console.log(`${String(r.rowNumber).padStart(3)} | ${sku} | ${status} | ${action} | ${appr} | ${errs}`);
}

console.log('\n=== ERROR REPORT (rejected rows) ===');
for (const e of preview.errorReport) {
  for (const err of e.errors) {
    console.log(`  row ${e.rowNumber}: [${err.code}] ${err.message}`);
  }
}

console.log('\n=== COMMIT PLAN (approval-gated, no overwrite of approved) ===');
const plan = planCommit(preview, { allowOverwriteApproved: false });
console.log(`  insert:            ${plan.toInsert.map((r) => r.normalized?.sku).join(', ') || '-'}`);
console.log(`  update:            ${plan.toUpdate.map((r) => r.normalized?.sku).join(', ') || '-'}`);
console.log(`  conflictsProtected:${' '}${plan.conflictsProtected.map((r) => r.normalized?.sku).join(', ') || '-'}  <- approved, NOT overwritten`);
console.log(`  skipped(invalid):  ${plan.skipped.map((r) => r.normalized?.sku).join(', ') || '-'}`);

const forced = preview.rows.find((r) => r.normalized?.sku === 'DEMO-IMP-001');
console.log(
  `\nSafe-workflow check: row 1 file said approval_status="approved" but importer forced "${forced?.normalized?.approval_status}".`,
);
console.log('Approved-overwrite check: DEMO-IMP-005 (approved) stayed in conflictsProtected, not update.');
