// Data access for products. Reads only the existing `products` table.
import { supabase } from './supabase';
import { PRODUCT_COLUMNS, type Product } from '../types/db';

/**
 * Search products by SKU, style number, or name (case-insensitive, partial).
 * Excludes archived records. Returns up to `limit` matches ordered by name.
 */
export async function searchProducts(query: string, limit = 25): Promise<Product[]> {
  const q = query.trim();
  if (q === '') return [];
  const like = `%${q}%`;
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .or(`sku.ilike.${like},style_number.ilike.${like},name.ilike.${like}`)
    .neq('data_status', 'archived')
    .order('name', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

/** Fetch a single product by its SKU. Returns null when not found. */
export async function getProductBySku(sku: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('sku', sku)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Product | null) ?? null;
}
