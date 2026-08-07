// Extractor: turn a raw source record into the explicit, validated field set the
// task enumerates (sku, style_number, name, category/subcategory, gender, color,
// size_range, price/currency, image_url, product_url, description +
// customer_description, key_features[], technology, activity_type). For fixtures
// the records are already structured; for an authorized HTML/JSON payload an
// endpoint-specific parser would produce a RawSkechersProduct that flows here.
import type { RawSkechersProduct } from './types';

export interface ExtractedSkechersProduct {
  sku: string;
  style_number: string;
  name: string;
  category: string;
  subcategory: string | null;
  gender: string | null;
  color: string | null;
  size_range: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  product_url: string | null;
  description: string | null;
  customer_description: string | null;
  key_features: string[];
  technology: string | null;
  activity_type: string | null;
  source_region: string | null;
  source_version: string | null;
}

function clean(v: string | null | undefined): string | null {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
}

/** Extract + validate one product. Throws if a required field is missing. */
export function extractProduct(raw: RawSkechersProduct): ExtractedSkechersProduct {
  const style = clean(raw.styleNumber);
  const name = clean(raw.name);
  const category = clean(raw.category);
  if (!style) throw new Error('extract: missing styleNumber');
  if (!name) throw new Error(`extract: missing name for style ${style}`);
  if (!category) throw new Error(`extract: missing category for style ${style}`);

  const features = Array.isArray(raw.keyFeatures)
    ? raw.keyFeatures.map((f) => f.toString().trim()).filter(Boolean)
    : [];

  return {
    sku: clean(raw.sku) ?? `SK-${style}`,
    style_number: style,
    name,
    category,
    subcategory: clean(raw.subcategory),
    gender: clean(raw.gender),
    color: clean(raw.color),
    size_range: clean(raw.sizeRange),
    price: typeof raw.price === 'number' && Number.isFinite(raw.price) ? raw.price : null,
    currency: clean(raw.currency),
    image_url: clean(raw.imageUrl),
    product_url: clean(raw.productUrl),
    description: clean(raw.description),
    customer_description: clean(raw.customerDescription),
    key_features: features,
    technology: clean(raw.technology),
    activity_type: clean(raw.activityType),
    source_region: clean(raw.sourceRegion),
    source_version: clean(raw.sourceVersion),
  };
}
