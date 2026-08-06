import { describe, it, expect } from 'vitest';
import { detectFormat, mapColumns, parseCsv, parseJson } from '../../src/import/index';

describe('detectFormat', () => {
  it('detects by extension', () => {
    expect(detectFormat('a.csv')).toBe('csv');
    expect(detectFormat('a.xlsx')).toBe('xlsx');
    expect(detectFormat('a.json')).toBe('json');
  });
  it('sniffs JSON content when extension is unknown', () => {
    expect(detectFormat('a.dat', '[{"sku":"1"}]')).toBe('json');
  });
  it('sniffs CSV content when extension is unknown', () => {
    expect(detectFormat('a.dat', 'sku,name\n1,x')).toBe('csv');
  });
  it('throws on the undetectable', () => {
    expect(() => detectFormat('a.dat', 'plain text')).toThrow();
  });
});

describe('mapColumns', () => {
  it('maps varied headers to canonical fields', () => {
    const mapped = mapColumns({ SKU: '1', 'Product Name': 'x', MSRP: '9.99', colour: 'Red' });
    expect(mapped).toMatchObject({ sku: '1', name: 'x', price: '9.99', color: 'Red' });
  });
  it('drops unknown columns', () => {
    const mapped = mapColumns({ sku: '1', nonsense: 'y' });
    expect(mapped).toEqual({ sku: '1' });
  });
});

describe('parsers', () => {
  it('parses CSV with headers', () => {
    const rows = parseCsv('sku,name\nA,alpha\nB,beta\n');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ sku: 'A', name: 'alpha' });
  });
  it('parses a JSON array', () => {
    expect(parseJson('[{"sku":"A"}]')).toHaveLength(1);
  });
  it('parses a { products: [...] } object', () => {
    expect(parseJson('{"products":[{"sku":"A"},{"sku":"B"}]}')).toHaveLength(2);
  });
});
