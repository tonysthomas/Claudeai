// Public surface of the catalogue-import service (Phase 3).
export * from './types';
export { detectFormat } from './formatDetection';
export { parseByFormat, parseCsv, parseJson, parseXlsx, type RawRow } from './parsers';
export { mapColumns, CANONICAL_FIELDS } from './columnMapping';
export {
  REQUIRED_FIELDS,
  normalizeRow,
  validatePrice,
  validateCurrency,
  validateRegion,
  validateImageUrl,
} from './validation';
export { buildImportPreview, planCommit, collectErrors } from './importService';
