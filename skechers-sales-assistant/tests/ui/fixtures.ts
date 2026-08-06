import type { Product } from '../../src/types/db';

export const demoProduct: Product = {
  id: 'p1',
  sku: 'SHOE-WALK-001',
  barcode: 'BC-1',
  style_number: 'STY-001',
  name: 'Demo Walk Comfort 1',
  category: 'shoes',
  subcategory: 'walking',
  gender: 'unisex',
  color: 'Grey',
  size_range: 'US 7-12',
  price: 59.99,
  currency: 'DEMO',
  region: 'DEMO',
  image_url: '/images/products/placeholder-shoe.svg',
  product_url: null,
  description: 'Synthetic demo walking shoe for everyday comfort.',
  key_features: ['Cushioned midsole', 'Breathable upper'],
  technology: 'Demo Air Cushion',
  activity_type: 'walking',
  data_status: 'demo',
  approval_status: 'demo',
};

export const demoProductNoImage: Product = {
  ...demoProduct,
  id: 'p2',
  sku: 'SHOE-WALK-002',
  name: 'Demo Walk Comfort 2',
  image_url: null,
};
