// Stage 2: file format detection.
import type { FileFormat } from './types';

const EXT_MAP: Record<string, FileFormat> = {
  csv: 'csv',
  tsv: 'csv',
  xlsx: 'xlsx',
  xlsm: 'xlsx',
  xls: 'xlsx',
  json: 'json',
};

/**
 * Detect the import format from the file name, falling back to a light content
 * sniff. Throws on anything unsupported so callers surface a clear error.
 */
export function detectFormat(fileName: string, content?: string | Buffer): FileFormat {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext in EXT_MAP) return EXT_MAP[ext] as FileFormat;

  if (typeof content === 'string') {
    const trimmed = content.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    if (trimmed.includes(',') || trimmed.includes('\t')) return 'csv';
  }
  throw new Error(`Unsupported or undetectable file format for "${fileName}"`);
}
