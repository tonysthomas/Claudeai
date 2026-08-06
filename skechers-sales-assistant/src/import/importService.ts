// Orchestrates the import stages into a preview (12–13) and a commit plan (14–15).
import { mapColumns } from './columnMapping';
import { parseByFormat } from './parsers';
import { normalizeRow } from './validation';
import {
  EMPTY_EXISTING,
  type CommitPlan,
  type ExistingCatalogue,
  type ImportContext,
  type ImportPreview,
  type ImportRowResult,
  type RowAction,
  type ValidationError,
} from './types';

/**
 * Build an import preview from raw file content: parse → map → normalize →
 * validate → dedupe → decide a per-row action. Nothing is written; the result
 * is a preview + error report for review before commit.
 */
export function buildImportPreview(content: string | Buffer, ctx: ImportContext): ImportPreview {
  const existing = ctx.existing ?? EMPTY_EXISTING;
  const rawRows = parseByFormat(ctx.fileFormat, content);

  const seenSkus = new Set<string>();
  const seenBarcodes = new Set<string>();
  const rows: ImportRowResult[] = [];

  rawRows.forEach((raw, i) => {
    const rowNumber = i + 1;
    const mapped = mapColumns(raw);
    const { normalized, errors } = normalizeRow(mapped, ctx);
    const sku = normalized.sku;
    const barcode = normalized.barcode;

    // Duplicate SKU within this batch
    if (sku !== '') {
      if (seenSkus.has(sku)) {
        errors.push({ field: 'sku', code: 'duplicate_sku', message: `Duplicate SKU "${sku}" within this import` });
      } else {
        seenSkus.add(sku);
      }
    }

    // Duplicate barcode within this batch
    if (barcode) {
      if (seenBarcodes.has(barcode)) {
        errors.push({ field: 'barcode', code: 'duplicate_barcode', message: `Duplicate barcode "${barcode}" within this import` });
      } else {
        seenBarcodes.add(barcode);
      }
      // Barcode already owned by a DIFFERENT product in the catalogue
      const owner = existing.barcodes.get(barcode);
      if (owner && owner !== sku) {
        errors.push({ field: 'barcode', code: 'duplicate_barcode', message: `Barcode "${barcode}" already belongs to SKU "${owner}"` });
      }
    }

    const status: 'valid' | 'invalid' = errors.length === 0 ? 'valid' : 'invalid';
    const action = decideAction(status, sku, existing);

    rows.push({ rowNumber, raw, normalized, status, action, errors });
  });

  const validRows = rows.filter((r) => r.status === 'valid').length;
  const errorReport = rows
    .filter((r) => r.errors.length > 0)
    .map((r) => ({ rowNumber: r.rowNumber, errors: r.errors }));

  return {
    fileName: ctx.fileName,
    fileFormat: ctx.fileFormat,
    sourceType: ctx.sourceType,
    region: ctx.region,
    currency: ctx.currency,
    importedBy: ctx.importedBy,
    importedAt: ctx.importedAt ?? new Date().toISOString(),
    totalRows: rows.length,
    validRows,
    invalidRows: rows.length - validRows,
    rows,
    errorReport,
  };
}

/** Decide the planned action for a row against the existing catalogue. */
function decideAction(status: 'valid' | 'invalid', sku: string, existing: ExistingCatalogue): RowAction {
  if (status === 'invalid') return 'skip';
  const approval = existing.skuApproval.get(sku);
  if (approval === undefined) return 'insert';
  if (approval === 'approved') return 'conflict'; // protected — see planCommit
  return 'update';
}

/**
 * Turn an approved preview into a commit plan (stages 14–15).
 *
 * SAFE WORKFLOW:
 *  - invalid rows are skipped;
 *  - rows whose SKU matches an APPROVED product are `conflictsProtected` and are
 *    NOT applied unless `allowOverwriteApproved` is explicitly true;
 *  - even when overwriting is allowed, the caller must re-stage as
 *    pending_review and snapshot the prior version (never auto-approve).
 */
export function planCommit(
  preview: ImportPreview,
  opts: { allowOverwriteApproved?: boolean } = {},
): CommitPlan {
  const allowOverwrite = opts.allowOverwriteApproved === true;
  const plan: CommitPlan = { toInsert: [], toUpdate: [], conflictsProtected: [], skipped: [] };

  for (const row of preview.rows) {
    if (row.status === 'invalid') {
      plan.skipped.push(row);
      continue;
    }
    switch (row.action) {
      case 'insert':
        plan.toInsert.push(row);
        break;
      case 'update':
        plan.toUpdate.push(row);
        break;
      case 'conflict':
        if (allowOverwrite) plan.toUpdate.push(row);
        else plan.conflictsProtected.push(row);
        break;
      default:
        plan.skipped.push(row);
    }
  }
  return plan;
}

/** Convenience: flatten a preview's errors for reporting. */
export function collectErrors(preview: ImportPreview): ValidationError[] {
  return preview.rows.flatMap((r) => r.errors);
}
