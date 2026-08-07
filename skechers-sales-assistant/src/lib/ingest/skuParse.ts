// Universal Skechers SKU / style-number parser + segment inference. Pure and
// browser-safe (no node deps) so both the app (live search) and the node
// ingestion scripts share one implementation. It parses the SKU STRING SHAPE and
// infers a coarse segment from documented style-number ranges — it does NOT
// invent product facts (name, price, technology, image); those come from an
// authorized record or are shown as clearly-labelled derived demo values.

export interface ParsedSku {
  raw: string; // original input, trimmed
  normalized: string; // uppercased
  styleNumber: string; // leading digit run (e.g. 304351)
  suffix: string | null; // trailing letters on the core (e.g. L, N, K)
  colorway: string | null; // after a hyphen (e.g. WBK)
  valid: boolean; // matched the numeric-core SKU shape
}

/** Parse numeric (232625), suffixed (304351L, 128200N), or hyphenated (150740-WBK) SKUs. */
export function parseSku(input: string): ParsedSku {
  const raw = (input ?? '').trim();
  const normalized = raw.toUpperCase();
  const [core = '', ...rest] = normalized.split('-');
  const colorway = rest.length > 0 ? rest.join('-') : null;
  const m = /^(\d{3,6})([A-Z]{0,3})$/.exec(core);
  if (!m) return { raw, normalized, styleNumber: '', suffix: null, colorway, valid: false };
  return { raw, normalized, styleNumber: m[1] ?? '', suffix: (m[2] ?? '') || null, colorway, valid: true };
}

/** A query is a "likely SKU" (worth live-ingesting on a search miss) when it has a 4–6 digit core. */
export function isLikelySku(input: string): boolean {
  const p = parseSku(input);
  return p.valid && p.styleNumber.length >= 4;
}

export type AgeSegment = 'adult' | 'kids';
export type Gender = 'men' | 'women' | 'unisex' | 'kids';

export interface SkuSegment {
  gender: Gender;
  ageSegment: AgeSegment;
  category: 'shoes';
  subcategory: string; // walking | work | sport | casual | kids
  activityType: string; // walking | work | fitness | casual
  segmentLabel: string; // human label, e.g. "Women's Walking", "Work & Safety", "Kids (Boys)"
}

/**
 * Infer a coarse segment from the SKU shape. Rules (documented):
 *  - suffix contains L / N / K → Kids (L→Girls, K→Boys, N→Kids).
 *  - style 77xxx → Work & Safety.
 *  - style 15xxx or 12xxxx → Women's Walking/Sport.
 *  - style 23xxx or 21xxxx → Men's Walking/Sport.
 *  - otherwise → Unisex Casual.
 */
export function inferSegment(parsed: ParsedSku): SkuSegment {
  const style = parsed.styleNumber;
  const suffix = parsed.suffix ?? '';

  if (/[LNK]/.test(suffix)) {
    const label = suffix.includes('L') ? 'Kids (Girls)' : suffix.includes('K') ? 'Kids (Boys)' : 'Kids';
    return { gender: 'kids', ageSegment: 'kids', category: 'shoes', subcategory: 'kids', activityType: 'casual', segmentLabel: label };
  }
  if (style.startsWith('77')) {
    return { gender: 'unisex', ageSegment: 'adult', category: 'shoes', subcategory: 'work', activityType: 'work', segmentLabel: 'Work & Safety' };
  }
  // Style-range families (5- or 6-digit): 15xxx/12xxxx → Women's; 23xxx/21xxxx → Men's.
  const women = style.startsWith('15') || style.startsWith('12');
  const men = style.startsWith('23') || style.startsWith('21');
  if (women) {
    return { gender: 'women', ageSegment: 'adult', category: 'shoes', subcategory: 'walking', activityType: 'walking', segmentLabel: "Women's Walking/Sport" };
  }
  if (men) {
    return { gender: 'men', ageSegment: 'adult', category: 'shoes', subcategory: 'walking', activityType: 'walking', segmentLabel: "Men's Walking/Sport" };
  }
  return { gender: 'unisex', ageSegment: 'adult', category: 'shoes', subcategory: 'casual', activityType: 'casual', segmentLabel: 'Unisex Casual' };
}

/** A canonical, de-duplicated SKU key for storage (e.g. "SK-304351L" or "SK-150740-WBK"). */
export function canonicalSkuKey(parsed: ParsedSku): string {
  const core = `${parsed.styleNumber}${parsed.suffix ?? ''}`;
  return `SK-${parsed.colorway ? `${core}-${parsed.colorway}` : core}`;
}
