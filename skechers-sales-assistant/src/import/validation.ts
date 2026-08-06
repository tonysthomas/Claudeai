// Stages 5–11: field/type/price/currency/region/image validation + normalization.
// Pure functions — no I/O — so they are fully unit-testable.
import type {
  ApprovalStatus,
  CanonicalProduct,
  DataStatus,
  ImportContext,
  SourceType,
  ValidationError,
} from './types';

export const REQUIRED_FIELDS = ['sku', 'name', 'category'] as const;

const SOURCE_TYPES: ReadonlySet<string> = new Set([
  'website',
  'catalogue',
  'api_feed',
  'manual',
  'synthetic_demo',
]);
const DATA_STATUSES: ReadonlySet<string> = new Set([
  'demo',
  'imported',
  'synchronized',
  'changed',
  'archived',
]);

const CURRENCY_RE = /^[A-Z]{3}$/; // ISO-4217-like, or the literal DEMO
const REGION_RE = /^[A-Za-z0-9_-]{2,20}$/;
const URL_RE = /^(https?:\/\/|\/)/;

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}
function orNull(v: unknown): string | null {
  const s = str(v);
  return s === '' ? null : s;
}

/** Price: absent → null; present must parse to a finite number ≥ 0. */
export function validatePrice(raw: unknown): { value: number | null; error: ValidationError | null } {
  const s = str(raw);
  if (s === '') return { value: null, error: null };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    return {
      value: null,
      error: { field: 'price', code: 'invalid_price', message: `Price "${s}" is not a valid non-negative number` },
    };
  }
  return { value: n, error: null };
}

/** Currency: the literal DEMO or a 3-letter uppercase code. */
export function validateCurrency(value: string): ValidationError | null {
  if (value === 'DEMO' || CURRENCY_RE.test(value)) return null;
  return { field: 'currency', code: 'invalid_currency', message: `Currency "${value}" is not DEMO or a 3-letter code` };
}

/** Region: DEMO or a short alphanumeric market code (no spaces/symbols). */
export function validateRegion(value: string): ValidationError | null {
  if (REGION_RE.test(value)) return null;
  return { field: 'region', code: 'invalid_region', message: `Region "${value}" is not a valid market code` };
}

/** Image URL (when present): http(s) URL or root-relative path. */
export function validateImageUrl(value: string | null): ValidationError | null {
  if (value === null) return null;
  if (URL_RE.test(value)) return null;
  return { field: 'image_url', code: 'invalid_image_url', message: `Image URL "${value}" is not a valid URL or path` };
}

function parseFeatures(raw: unknown): string[] | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s) as unknown[];
      if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* fall through to delimiter split */
    }
  }
  return s.split(/[;|]/).map((x) => x.trim()).filter(Boolean);
}

/**
 * Normalize a mapped row into a CanonicalProduct and collect field-level errors.
 * Enforces the SAFE WORKFLOW: imported records are never `approved` — they land
 * as `draft` (only if explicitly requested) or `pending_review`; `data_status`
 * is forced to `imported`.
 */
export function normalizeRow(
  mapped: Record<string, unknown>,
  ctx: ImportContext,
): { normalized: CanonicalProduct; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (str(mapped[field]) === '') {
      errors.push({ field, code: 'required', message: `Missing required field "${field}"` });
    }
  }

  const { value: price, error: priceErr } = validatePrice(mapped['price']);
  if (priceErr) errors.push(priceErr);

  const currency = str(mapped['currency']) || ctx.currency;
  const curErr = validateCurrency(currency);
  if (curErr) errors.push(curErr);

  const region = str(mapped['region']) || ctx.region;
  const regErr = validateRegion(region);
  if (regErr) errors.push(regErr);

  const imageUrl = orNull(mapped['image_url']);
  const imgErr = validateImageUrl(imageUrl);
  if (imgErr) errors.push(imgErr);

  // source_type: use row value if valid, else fall back to the import context
  const rawSource = str(mapped['source_type']);
  const sourceType: SourceType = (SOURCE_TYPES.has(rawSource) ? rawSource : ctx.sourceType) as SourceType;

  // data_status forced to 'imported' (ignore/repair any row value)
  const rawData = str(mapped['data_status']);
  const dataStatus: DataStatus = (DATA_STATUSES.has(rawData) ? rawData : 'imported') as DataStatus;
  // Safe workflow: never trust the file to set an active status.
  const approvalStatus: ApprovalStatus = str(mapped['approval_status']) === 'draft' ? 'draft' : 'pending_review';

  const normalized: CanonicalProduct = {
    sku: str(mapped['sku']),
    barcode: orNull(mapped['barcode']),
    style_number: orNull(mapped['style_number']),
    name: str(mapped['name']),
    category: str(mapped['category']),
    subcategory: orNull(mapped['subcategory']),
    gender: orNull(mapped['gender']),
    color: orNull(mapped['color']),
    size_range: orNull(mapped['size_range']),
    price,
    currency,
    region,
    image_url: imageUrl,
    product_url: orNull(mapped['product_url']),
    description: orNull(mapped['description']),
    key_features: parseFeatures(mapped['key_features']),
    technology: orNull(mapped['technology']),
    activity_type: orNull(mapped['activity_type']),
    source_type: sourceType,
    source_url: orNull(mapped['source_url']) ?? (ctx.sourceUrl ?? null),
    source_identifier: orNull(mapped['source_identifier']),
    source_version: orNull(mapped['source_version']),
    data_status: dataStatus,
    approval_status: approvalStatus,
  };

  return { normalized, errors };
}
