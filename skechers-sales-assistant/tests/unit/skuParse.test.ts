import { describe, it, expect } from 'vitest';
import { parseSku, isLikelySku, inferSegment, canonicalSkuKey } from '../../src/lib/ingest/skuParse';
import { deriveProductFromSku } from '../../src/lib/ingest/deriveProduct';

describe('parseSku', () => {
  it('parses numeric SKUs', () => {
    const p = parseSku('232625');
    expect(p).toMatchObject({ styleNumber: '232625', suffix: null, colorway: null, valid: true });
  });
  it('parses letter-suffixed SKUs (kids/youth)', () => {
    expect(parseSku('304351L')).toMatchObject({ styleNumber: '304351', suffix: 'L', valid: true });
    expect(parseSku('128200N')).toMatchObject({ styleNumber: '128200', suffix: 'N', valid: true });
  });
  it('parses hyphenated colorway SKUs', () => {
    expect(parseSku('150740-WBK')).toMatchObject({ styleNumber: '150740', colorway: 'WBK', valid: true });
  });
  it('rejects non-SKU input', () => {
    expect(parseSku('WALK-001').valid).toBe(false);
    expect(parseSku('zzz-nothing').valid).toBe(false);
    expect(parseSku('').valid).toBe(false);
  });
});

describe('isLikelySku', () => {
  it('accepts 4–6 digit cores, rejects short/alpha queries', () => {
    expect(isLikelySku('232625')).toBe(true);
    expect(isLikelySku('304351L')).toBe(true);
    expect(isLikelySku('150740-WBK')).toBe(true);
    expect(isLikelySku('WALK-001')).toBe(false);
    expect(isLikelySku('Go Walk 7')).toBe(false);
    expect(isLikelySku('001')).toBe(false);
  });
});

describe('inferSegment', () => {
  const seg = (s: string) => inferSegment(parseSku(s));
  it('infers Kids from L/N/K suffixes', () => {
    expect(seg('304351L')).toMatchObject({ ageSegment: 'kids', gender: 'kids' });
    expect(seg('304351L').segmentLabel).toMatch(/girls/i);
    expect(seg('128200K').segmentLabel).toMatch(/boys/i);
  });
  it('infers Work & Safety from 77xxx', () => {
    expect(seg('77055')).toMatchObject({ subcategory: 'work', activityType: 'work' });
    expect(seg('77055').segmentLabel).toMatch(/work/i);
  });
  it("infers Women's from 15xxx / 12xxxx", () => {
    expect(seg('15070')).toMatchObject({ gender: 'women' });
    expect(seg('124500')).toMatchObject({ gender: 'women' });
  });
  it("infers Men's from 23xxx / 21xxxx", () => {
    expect(seg('23262')).toMatchObject({ gender: 'men' });
    expect(seg('216202')).toMatchObject({ gender: 'men' });
  });
  it('defaults to unisex casual otherwise', () => {
    expect(seg('999999')).toMatchObject({ gender: 'unisex', subcategory: 'casual' });
  });
});

describe('canonicalSkuKey', () => {
  it('builds a stable SK- key including suffix/colorway', () => {
    expect(canonicalSkuKey(parseSku('304351L'))).toBe('SK-304351L');
    expect(canonicalSkuKey(parseSku('150740-WBK'))).toBe('SK-150740-WBK');
  });
});

describe('deriveProductFromSku', () => {
  it('returns a rich authorized sample for known styles', () => {
    const d = deriveProductFromSku('304351L');
    expect(d?.derived).toBe(false);
    expect(d?.product.name).toBe('Skechers Garage - Glam Racer');
    expect(d?.product.technology).toMatch(/Lighted Midsole/);
    expect(d?.product.currency).toBe('AED');
  });
  it('derives a clearly-labelled demo record for unknown SKUs (no fabricated tech)', () => {
    const d = deriveProductFromSku('216777', { region: 'AE', currency: 'AED' });
    expect(d?.derived).toBe(true);
    expect(d?.product.name).toMatch(/\(Demo\)/);
    expect(d?.product.technology).toBeNull(); // never invented
    expect(d?.product.data_status).toBe('demo');
    expect(d?.product.approval_status).toBe('demo');
    expect(d?.product.category).toBe('shoes');
  });
  it('returns null for non-SKU input', () => {
    expect(deriveProductFromSku('not-a-sku')).toBeNull();
  });
});
