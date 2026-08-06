// In-memory data source for the self-contained browser demo (no Supabase).
// Mirrors a subset of the synthetic seed. Images are inline data-URI SVGs so the
// single-file demo needs no external assets.
import type { Product } from '../types/db';

const svg = (label: string, bg: string, fg: string): string =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="${bg}"/><text x="160" y="128" font-family="system-ui,sans-serif" font-size="18" fill="${fg}" text-anchor="middle">${label}</text></svg>`,
  );

const SHOE = svg('DEMO SHOE', '#e6edf5', '#456');
const SOCK = svg('DEMO SOCK', '#eef2e9', '#465');
const CARE = svg('DEMO SHOE CARE', '#f2ecf5', '#534');

function make(p: Partial<Product> & Pick<Product, 'sku' | 'name' | 'category'>): Product {
  return {
    id: p.sku,
    sku: p.sku,
    barcode: p.barcode ?? null,
    style_number: p.style_number ?? null,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory ?? null,
    gender: p.gender ?? 'unisex',
    color: p.color ?? null,
    size_range: p.size_range ?? 'US 7-12',
    price: p.price ?? null,
    currency: 'DEMO',
    region: 'DEMO',
    image_url: p.image_url ?? SHOE,
    product_url: null,
    description: p.description ?? null,
    key_features: p.key_features ?? null,
    technology: p.technology ?? null,
    activity_type: p.activity_type ?? null,
    data_status: 'demo',
    approval_status: 'demo',
  };
}

export const DEMO_PRODUCTS: Product[] = [
  make({ sku: 'SHOE-WALK-001', style_number: 'STY-001', name: 'Demo Walk Comfort 1', category: 'shoes', subcategory: 'walking', color: 'Grey', price: 59.99, technology: 'Demo Air Cushion', activity_type: 'walking', image_url: SHOE, description: 'Synthetic demo walking shoe for everyday comfort.', key_features: ['Cushioned midsole', 'Breathable upper'] }),
  make({ sku: 'SHOE-WALK-002', style_number: 'STY-002', name: 'Demo Walk Comfort 2', category: 'shoes', subcategory: 'walking', color: 'Black', price: 89.99, technology: 'Demo Air Cushion Max', activity_type: 'walking', image_url: SHOE, description: 'Synthetic demo premium walking shoe with extra cushioning.', key_features: ['Max cushioning', 'Arch support'] }),
  make({ sku: 'SHOE-WORK-001', style_number: 'STY-003', name: 'Demo Work Cushion 1', category: 'shoes', subcategory: 'work', color: 'Black', price: 69.99, technology: 'Demo Slip Resist', activity_type: 'work', image_url: SHOE, description: 'Synthetic demo work shoe for long hours on your feet.', key_features: ['Slip resistant', 'All-day cushioning'] }),
  make({ sku: 'SHOE-FIT-001', style_number: 'STY-005', name: 'Demo Sport Fit Runner 1', category: 'shoes', subcategory: 'fitness', color: 'Blue', price: 74.99, technology: 'Demo Rebound Foam', activity_type: 'fitness', image_url: SHOE, description: 'Synthetic demo training shoe for the gym and running.', key_features: ['Responsive foam', 'Lightweight'] }),
  make({ sku: 'SOCK-PERF-001', name: 'Demo Performance Sock 1', category: 'socks', subcategory: 'performance', color: 'White', size_range: 'M/L', price: 12.99, activity_type: 'fitness', image_url: SOCK, description: 'Synthetic demo moisture-wicking performance socks.', key_features: ['Moisture wicking', 'Arch band'] }),
  make({ sku: 'CARE-KIT-001', name: 'Demo Shoe Care Kit 1', category: 'shoe_care', subcategory: 'kit', size_range: null, price: 19.99, image_url: CARE, description: 'Synthetic demo shoe-care cleaning kit.', key_features: ['Cleaner', 'Brush', 'Cloth'] }),
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function searchProducts(query: string, limit = 25): Promise<Product[]> {
  await sleep(250);
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  return DEMO_PRODUCTS.filter((p) => `${p.sku} ${p.style_number ?? ''} ${p.name}`.toLowerCase().includes(q)).slice(0, limit);
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  await sleep(150);
  return DEMO_PRODUCTS.find((p) => p.sku === sku) ?? null;
}
