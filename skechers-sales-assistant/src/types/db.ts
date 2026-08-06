// Database row types used by the UI (subset of the products / customer_needs
// columns from the Phase 2 schema — see database/SCHEMA.md).

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  style_number: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  gender: string | null;
  color: string | null;
  size_range: string | null;
  price: number | null;
  currency: string;
  region: string;
  image_url: string | null;
  product_url: string | null;
  description: string | null;
  key_features: string[] | null;
  technology: string | null;
  activity_type: string | null;
  data_status: string;
  approval_status: string;
}

export interface CustomerNeed {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

/** The columns the UI reads from `products`. */
export const PRODUCT_COLUMNS =
  'id, sku, barcode, style_number, name, category, subcategory, gender, color, size_range, price, currency, region, image_url, product_url, description, key_features, technology, activity_type, data_status, approval_status';
