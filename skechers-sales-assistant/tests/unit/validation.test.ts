import { describe, it, expect } from 'vitest';
import {
  validatePrice,
  validateCurrency,
  validateRegion,
  validateImageUrl,
  normalizeRow,
} from '../../src/import/index';
import type { ImportContext } from '../../src/import/index';

const ctx: ImportContext = {
  fileName: 'x.csv',
  fileFormat: 'csv',
  sourceType: 'catalogue',
  region: 'DEMO',
  currency: 'DEMO',
  importedBy: 'tester',
};

describe('validatePrice', () => {
  it('accepts empty as null', () => expect(validatePrice('').value).toBeNull());
  it('accepts a valid number', () => expect(validatePrice('59.99').value).toBe(59.99));
  it('rejects non-numeric', () => expect(validatePrice('NOT_A_PRICE').error?.code).toBe('invalid_price'));
  it('rejects negative', () => expect(validatePrice('-1').error?.code).toBe('invalid_price'));
});

describe('validateCurrency', () => {
  it('accepts DEMO', () => expect(validateCurrency('DEMO')).toBeNull());
  it('accepts a 3-letter code', () => expect(validateCurrency('USD')).toBeNull());
  it('rejects US$', () => expect(validateCurrency('US$')?.code).toBe('invalid_currency'));
});

describe('validateRegion', () => {
  it('accepts DEMO', () => expect(validateRegion('DEMO')).toBeNull());
  it('rejects a value with spaces', () => expect(validateRegion('New York')?.code).toBe('invalid_region'));
  it('rejects a symbol', () => expect(validateRegion('US$')?.code).toBe('invalid_region'));
});

describe('validateImageUrl', () => {
  it('accepts null', () => expect(validateImageUrl(null)).toBeNull());
  it('accepts a root path', () => expect(validateImageUrl('/images/x.svg')).toBeNull());
  it('accepts https', () => expect(validateImageUrl('https://x/y.png')).toBeNull());
  it('rejects ftp', () => expect(validateImageUrl('ftp://x')?.code).toBe('invalid_image_url'));
});

describe('normalizeRow — safe workflow', () => {
  it('never lets the file set approved (forces pending_review)', () => {
    const { normalized } = normalizeRow({ sku: 'A', name: 'n', category: 'shoes', approval_status: 'approved' }, ctx);
    expect(normalized.approval_status).toBe('pending_review');
  });
  it('keeps an explicit draft', () => {
    const { normalized } = normalizeRow({ sku: 'A', name: 'n', category: 'shoes', approval_status: 'draft' }, ctx);
    expect(normalized.approval_status).toBe('draft');
  });
  it('forces data_status to imported', () => {
    const { normalized } = normalizeRow({ sku: 'A', name: 'n', category: 'shoes', data_status: 'approved' as unknown as string }, ctx);
    expect(normalized.data_status).toBe('imported');
  });
  it('flags missing required fields', () => {
    const { errors } = normalizeRow({ sku: 'A', category: 'shoes' }, ctx);
    expect(errors.some((e) => e.field === 'name' && e.code === 'required')).toBe(true);
  });
  it('parses key_features from a delimited string', () => {
    const { normalized } = normalizeRow({ sku: 'A', name: 'n', category: 'shoes', key_features: 'x;y' }, ctx);
    expect(normalized.key_features).toEqual(['x', 'y']);
  });
});
