// Build a Product record for a live-searched SKU. Two paths, both governance-safe:
//   • KNOWN authorized sample → return the reviewed sample record (real-ish attrs).
//   • UNKNOWN SKU → derive a CLEARLY-LABELLED demo record from the SKU shape
//     (segment inference only). We never fabricate a real name, price, image, or
//     proprietary technology for an unknown shoe — those stay empty/demo until an
//     authorized catalogue sync provides them. See CLAUDE.md "Never invent".
import type { Product } from '../../types/db';
import { canonicalSkuKey, inferSegment, parseSku, type SkuSegment } from './skuParse';

export interface DerivedProduct {
  product: Product;
  /** true when the record was DERIVED from the SKU pattern (not an authorized sample). */
  derived: boolean;
  segment: SkuSegment;
}

export interface DeriveOptions {
  region?: string;
  currency?: string;
}

/** Reviewed authorized-sample records for specific requested styles (browser copy). */
const KNOWN_SAMPLES: Record<string, Omit<Product, 'id'>> = {
  '304351L': {
    sku: 'SK-304351L', barcode: null, style_number: '304351L', name: 'Skechers Garage - Glam Racer',
    category: 'shoes', subcategory: 'kids', gender: 'kids', color: 'Rose Gold', size_range: 'UK 10-3 (Kids)',
    price: 179, currency: 'AED', region: 'AE',
    image_url: null, product_url: 'https://www.skechers.com/en-ae/product/304351L/',
    description: "Light-up kids' trainer with a glam racer look.",
    key_features: ['Skechers Garage Lighted Midsole', 'Rechargeable lights', 'Machine washable'],
    technology: 'Skechers Garage Lighted Midsole', activity_type: 'casual',
    data_status: 'imported', approval_status: 'approved',
  },
  '150740': {
    sku: 'SK-150740', barcode: null, style_number: '150740', name: 'Skechers Slip-ins: Ultra Flex 3.0',
    category: 'shoes', subcategory: 'walking', gender: 'women', color: 'Black', size_range: 'UK 3-8',
    price: 269, currency: 'AED', region: 'AE',
    image_url: null, product_url: 'https://www.skechers.com/en-ae/product/150740/',
    description: 'Hands-free stretch-knit walking comfort.',
    key_features: ['Hands-Free Slip-ins design', 'Air-Cooled Memory Foam', 'Ultra Flex stretch upper'],
    technology: 'Hands Free Slip-ins, Air-Cooled Memory Foam', activity_type: 'walking',
    data_status: 'imported', approval_status: 'approved',
  },
};

function demoPriceFor(segment: SkuSegment): number {
  switch (segment.subcategory) {
    case 'kids': return 149;
    case 'work': return 289;
    case 'walking': return segment.gender === 'women' ? 229 : 239;
    default: return 199;
  }
}

/**
 * Resolve a Product for a SKU string. Returns null when the input is not a valid
 * Skechers SKU shape.
 */
export function deriveProductFromSku(input: string, opts: DeriveOptions = {}): DerivedProduct | null {
  const parsed = parseSku(input);
  if (!parsed.valid) return null;
  const region = opts.region ?? 'AE';
  const currency = opts.currency ?? 'AED';
  const segment = inferSegment(parsed);

  // Known authorized sample (match by style number or full core).
  const sampleKey = parsed.suffix ? `${parsed.styleNumber}${parsed.suffix}` : parsed.styleNumber;
  const sample = KNOWN_SAMPLES[sampleKey] ?? KNOWN_SAMPLES[parsed.styleNumber];
  if (sample) {
    return { product: { ...sample, id: sample.sku }, derived: false, segment };
  }

  // Derived demo record — clearly labelled, no fabricated proprietary facts.
  const sku = canonicalSkuKey(parsed);
  const styleLabel = `${parsed.styleNumber}${parsed.suffix ?? ''}${parsed.colorway ? `-${parsed.colorway}` : ''}`;
  const product: Product = {
    id: sku, sku, barcode: null, style_number: parsed.styleNumber,
    name: `Skechers Style ${styleLabel} — ${segment.segmentLabel} (Demo)`,
    category: 'shoes', subcategory: segment.subcategory, gender: segment.gender,
    color: parsed.colorway, size_range: null, price: demoPriceFor(segment), currency, region,
    image_url: null, product_url: null,
    description: 'Derived from the SKU pattern for demo. Official name, price, image, and technology require an authorized catalogue sync.',
    key_features: null, technology: null, activity_type: segment.activityType,
    data_status: 'demo', approval_status: 'demo',
  };
  return { product, derived: true, segment };
}
