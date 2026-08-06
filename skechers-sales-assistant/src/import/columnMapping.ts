// Stage 4: column mapping. Maps varied source headers to canonical field names
// so CSV/Excel/JSON/API sources with slightly different columns all normalize.
import type { RawRow } from './parsers';

/** Canonical field → accepted source header aliases (all matched case/format-insensitively). */
const ALIASES: Record<string, string[]> = {
  sku: ['sku', 'product_code', 'productcode', 'code'],
  barcode: ['barcode', 'upc', 'ean', 'gtin'],
  style_number: ['style_number', 'style', 'styleno', 'style_no'],
  name: ['name', 'product_name', 'title'],
  category: ['category', 'cat'],
  subcategory: ['subcategory', 'sub_category', 'subcat'],
  gender: ['gender', 'sex'],
  color: ['color', 'colour', 'colorway'],
  size_range: ['size_range', 'sizes', 'size'],
  price: ['price', 'msrp', 'retail_price'],
  currency: ['currency', 'ccy'],
  region: ['region', 'market', 'country'],
  image_url: ['image_url', 'image', 'imageurl', 'img'],
  product_url: ['product_url', 'url', 'producturl', 'page_url'],
  description: ['description', 'desc', 'details'],
  key_features: ['key_features', 'features', 'keyfeatures'],
  technology: ['technology', 'tech'],
  activity_type: ['activity_type', 'activity', 'activitytype'],
  source_type: ['source_type', 'sourcetype'],
  source_url: ['source_url', 'sourceurl'],
  source_identifier: ['source_identifier', 'source_id', 'sourceidentifier'],
  source_version: ['source_version', 'sourceversion', 'version'],
  data_status: ['data_status', 'datastatus'],
  approval_status: ['approval_status', 'approvalstatus', 'status'],
};

/** Normalize a header for matching: lowercase, strip non-alphanumerics. */
function norm(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Precompute alias-lookup: normalized alias → canonical field.
const LOOKUP: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    for (const a of aliases) m.set(norm(a), canonical);
  }
  return m;
})();

/** Map one raw row's headers to canonical field names. Unknown columns are dropped. */
export function mapColumns(row: RawRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [header, value] of Object.entries(row)) {
    const canonical = LOOKUP.get(norm(header));
    if (canonical && out[canonical] === undefined) out[canonical] = value;
  }
  return out;
}

export const CANONICAL_FIELDS = Object.keys(ALIASES);
