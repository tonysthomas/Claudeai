import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  buildImportPreview,
  planCommit,
  type ExistingCatalogue,
  type ImportContext,
  type ImportPreview,
} from '../../src/import/index';

const here = dirname(fileURLToPath(import.meta.url));
const csv = readFileSync(resolve(here, '../../data/demo-catalogue.csv'), 'utf8');

const existing: ExistingCatalogue = {
  skuApproval: new Map([
    ['DEMO-IMP-002', 'draft'],
    ['DEMO-IMP-005', 'approved'],
  ]),
  barcodes: new Map(),
};

const ctx: ImportContext = {
  fileName: 'demo-catalogue.csv',
  fileFormat: 'csv',
  sourceType: 'catalogue',
  region: 'DEMO',
  currency: 'DEMO',
  importedBy: 'tester',
  existing,
};

function rowByCode(preview: ImportPreview, code: string) {
  return preview.rows.find((r) => r.errors.some((e) => e.code === code));
}

describe('buildImportPreview on the sample catalogue', () => {
  let preview: ImportPreview;
  beforeAll(() => {
    preview = buildImportPreview(csv, ctx);
  });

  it('counts 9 rows: 5 valid, 4 invalid', () => {
    expect(preview.totalRows).toBe(9);
    expect(preview.validRows).toBe(5);
    expect(preview.invalidRows).toBe(4);
  });

  it('detects the duplicate SKU (row 6)', () => {
    const r = rowByCode(preview, 'duplicate_sku');
    expect(r?.rowNumber).toBe(6);
  });

  it('detects the missing required field (row 7, name)', () => {
    const r = preview.rows.find((x) => x.rowNumber === 7);
    expect(r?.errors.some((e) => e.field === 'name' && e.code === 'required')).toBe(true);
  });

  it('detects the invalid price (row 8)', () => {
    expect(rowByCode(preview, 'invalid_price')?.rowNumber).toBe(8);
  });

  it('detects the invalid currency (row 9)', () => {
    expect(rowByCode(preview, 'invalid_currency')?.rowNumber).toBe(9);
  });

  it('forces file approval_status=approved down to pending_review (row 1)', () => {
    const r = preview.rows.find((x) => x.rowNumber === 1);
    expect(r?.normalized?.approval_status).toBe('pending_review');
  });

  it('assigns actions: insert / update / protected conflict', () => {
    const r1 = preview.rows.find((x) => x.rowNumber === 1);
    const r2 = preview.rows.find((x) => x.rowNumber === 2);
    const r5 = preview.rows.find((x) => x.rowNumber === 5);
    expect(r1?.action).toBe('insert');
    expect(r2?.action).toBe('update'); // existing draft
    expect(r5?.action).toBe('conflict'); // existing approved
  });

  it('builds an error report covering all 4 invalid rows', () => {
    expect(preview.errorReport.map((e) => e.rowNumber)).toEqual([6, 7, 8, 9]);
  });
});

describe('planCommit — approved records are protected', () => {
  it('does not overwrite an approved product by default', () => {
    const preview = buildImportPreview(csv, ctx);
    const plan = planCommit(preview, { allowOverwriteApproved: false });
    const protectedSkus = plan.conflictsProtected.map((r) => r.normalized?.sku);
    expect(protectedSkus).toContain('DEMO-IMP-005');
    expect(plan.toUpdate.map((r) => r.normalized?.sku)).not.toContain('DEMO-IMP-005');
    // valid inserts are the brand-new SKUs
    expect(plan.toInsert.map((r) => r.normalized?.sku)).toEqual(['DEMO-IMP-001', 'DEMO-IMP-003', 'DEMO-IMP-004']);
    expect(plan.skipped).toHaveLength(4);
  });

  it('overwrites an approved product only with explicit confirmation', () => {
    const preview = buildImportPreview(csv, ctx);
    const plan = planCommit(preview, { allowOverwriteApproved: true });
    expect(plan.toUpdate.map((r) => r.normalized?.sku)).toContain('DEMO-IMP-005');
    expect(plan.conflictsProtected).toHaveLength(0);
    // even when overwriting, the record is never auto-approved (stays draft/pending_review)
    const r5 = plan.toUpdate.find((r) => r.normalized?.sku === 'DEMO-IMP-005');
    expect(['draft', 'pending_review']).toContain(r5?.normalized?.approval_status);
    expect(r5?.normalized?.approval_status).not.toBe('approved');
  });
});
