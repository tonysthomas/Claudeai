// Types for Method 1 — Real Skechers Product Ingestion & Web Connector.
//
// PROVENANCE: records flow  source adapter → extractor → normalizer → Phase 3
// import → (SQL / demo). The default adapter reads AUTHORIZED sample records from
// fixtures/a provided export file. There is NO live scraping of skechers.com in
// this codebase (see CLAUDE.md, database/GOVERNANCE.md). The live web adapter is
// a permission-gated seam that refuses to run without explicit authorization.

/** A raw product record as returned by a Skechers source adapter (pre-normalization). */
export interface RawSkechersProduct {
  styleNumber: string;
  sku?: string;
  name: string;
  category: string; // e.g. "Footwear"
  subcategory?: string; // e.g. "Walking"
  gender?: string; // Men | Women | Unisex | Kids
  color?: string;
  sizeRange?: string;
  price?: number | null;
  currency?: string; // e.g. AED | USD
  imageUrl?: string; // official image URL (referenced, never downloaded)
  productUrl?: string; // official product page URL
  description?: string;
  customerDescription?: string;
  keyFeatures?: string[];
  technology?: string; // e.g. "Hands Free Slip-ins, Arch Fit, Goga Mat"
  activityType?: string; // Walking | Work | Running | Casual
  /** Source provenance carried through the pipeline. */
  sourceRegion?: string; // e.g. AE, US
  sourceVersion?: string;
}

/** A source adapter that yields raw records. Implementations must not scrape without authorization. */
export interface SkechersSource {
  readonly name: string;
  /** Fetch one product by its style number. */
  fetchByStyle(style: string): Promise<RawSkechersProduct>;
  /** Fetch many; adapters should apply rate limiting between calls. */
  fetchMany(styles: string[]): Promise<RawSkechersProduct[]>;
}

/** Coarse price tier used for lower/higher price-option relationships. */
export type PriceTier = 'value' | 'core' | 'premium';

/** Options that steer a single ingestion run. */
export interface IngestOptions {
  region: string; // market code, e.g. AE
  currency: string; // ISO code, e.g. AED
  autoApprove: boolean; // explicit approval action (else pending_review)
  importedBy: string;
  syncedAt: string; // ISO timestamp stamped as source_version / synced_at
}

/** A normalized product row (canonical import shape) plus the derived price tier. */
export interface NormalizedIngestRow {
  row: Record<string, unknown>; // canonical fields consumed by the Phase 3 importer
  priceTier: PriceTier;
  sku: string;
}
