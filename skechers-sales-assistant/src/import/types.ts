// Types for the catalogue-import service (Phase 3).
// Synthetic demo only — no real Skechers data flows through here.

/** Supported import file formats (stages 1–2: upload + format detection). */
export type FileFormat = 'csv' | 'xlsx' | 'json';

/** Source classes, matching products.source_type / catalogue_imports.source_type. */
export type SourceType =
  | 'website'
  | 'catalogue'
  | 'api_feed'
  | 'manual'
  | 'synthetic_demo'
  | 'skechers_official_web';

/** Lifecycle status of a product record (products.data_status). */
export type DataStatus = 'demo' | 'imported' | 'synchronized' | 'changed' | 'archived';

/** Approval status (products.approval_status). */
export type ApprovalStatus =
  | 'draft'
  | 'demo'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';

/** The canonical product shape the importer normalizes every row into. */
export interface CanonicalProduct {
  sku: string;
  barcode: string | null;
  style_number: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  gender: string | null;
  color: string | null;
  size_range: string | null;
  price: number | null;
  currency: string;
  region: string;
  image_url: string | null;
  product_url: string | null;
  description: string | null;
  key_features: string[] | null;
  technology: string | null;
  activity_type: string | null;
  source_type: SourceType;
  source_url: string | null;
  source_identifier: string | null;
  source_version: string | null;
  data_status: DataStatus;
  approval_status: ApprovalStatus;
}

/** A single validation problem on a row/field. */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

/** Planned action for a valid row against the existing catalogue. */
export type RowAction = 'insert' | 'update' | 'conflict' | 'skip';

/** Result of validating one input row. */
export interface ImportRowResult {
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: CanonicalProduct | null;
  status: 'valid' | 'invalid';
  action: RowAction;
  errors: ValidationError[];
}

/** What the importer knows about the existing catalogue (for dedupe/conflict). */
export interface ExistingCatalogue {
  /** Existing SKU → its current approval_status. */
  skuApproval: Map<string, ApprovalStatus>;
  /** Existing barcode → the SKU that owns it (so re-importing the same product's barcode isn't a conflict). */
  barcodes: Map<string, string>;
}

/** Context supplied for an import run (stage 1 + traceability). */
export interface ImportContext {
  fileName: string;
  fileFormat: FileFormat;
  sourceType: SourceType;
  sourceUrl?: string | null;
  region: string;
  currency: string;
  importedBy: string;
  importedAt?: string;
  existing?: ExistingCatalogue;
}

/** The preview object produced before anything is written (stages 12–13). */
export interface ImportPreview {
  fileName: string;
  fileFormat: FileFormat;
  sourceType: SourceType;
  region: string;
  currency: string;
  importedBy: string;
  importedAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportRowResult[];
  /** Flat list of per-row errors for the error report. */
  errorReport: Array<{ rowNumber: number; errors: ValidationError[] }>;
}

/** The plan produced when applying an approved preview (stages 14–15). */
export interface CommitPlan {
  toInsert: ImportRowResult[];
  toUpdate: ImportRowResult[];
  conflictsProtected: ImportRowResult[];
  skipped: ImportRowResult[];
}

export const EMPTY_EXISTING: ExistingCatalogue = {
  skuApproval: new Map(),
  barcodes: new Map(),
};
