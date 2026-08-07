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

/**
 * Live-ingest a SKU on a search miss. The app UI NEVER contacts skechers.com —
 * it calls OUR backend ingestion endpoint (VITE_INGEST_ENDPOINT), which runs the
 * authorized pipeline server-side and persists to Supabase; we then re-read the
 * product from our own database. With no endpoint configured, ingestion is
 * unavailable and this resolves to null (the UI shows "not found").
 */
export async function liveIngestSku(input: string): Promise<Product | null> {
  const endpoint = import.meta.env.VITE_INGEST_ENDPOINT as string | undefined;
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: input.trim() }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { sku?: string };
    if (!body.sku) return null;
    return await getProductBySku(body.sku);
  } catch {
    return null;
  }
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
