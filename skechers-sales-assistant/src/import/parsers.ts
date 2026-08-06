// Stage 3: data parsing. Turns raw file content into an array of row objects
// keyed by their original column headers. CSV, Excel, and JSON are supported.
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileFormat } from './types';

export type RawRow = Record<string, unknown>;

/** Parse CSV/TSV text into row objects (headers from the first line). */
export function parseCsv(text: string): RawRow[] {
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  return result.data.filter((r) => Object.keys(r).length > 0);
}

/** Parse an .xlsx workbook (Buffer) — the first sheet — into row objects. */
export function parseXlsx(buffer: Buffer): RawRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const sheet = wb.Sheets[first];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
}

/** Parse JSON — either an array of products or `{ products: [...] }`. */
export function parseJson(text: string): RawRow[] {
  const data: unknown = JSON.parse(text);
  if (Array.isArray(data)) return data as RawRow[];
  if (data && typeof data === 'object' && Array.isArray((data as { products?: unknown }).products)) {
    return (data as { products: RawRow[] }).products;
  }
  throw new Error('JSON must be an array of products or an object with a "products" array');
}

/** Dispatch to the right parser for the detected format. */
export function parseByFormat(format: FileFormat, content: string | Buffer): RawRow[] {
  switch (format) {
    case 'csv':
      return parseCsv(typeof content === 'string' ? content : content.toString('utf8'));
    case 'json':
      return parseJson(typeof content === 'string' ? content : content.toString('utf8'));
    case 'xlsx':
      return parseXlsx(typeof content === 'string' ? Buffer.from(content) : content);
    default:
      throw new Error(`Unsupported format: ${format as string}`);
  }
}
