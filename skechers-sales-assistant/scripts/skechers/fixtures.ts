// AUTHORIZED SAMPLE Skechers product records (the "provided data" source).
//
// These stand in for records an authorized partner would supply via an official
// export/feed or a permission-gated connector. They are used so the ingestion
// pipeline is real, runnable, and testable WITHOUT scraping skechers.com. Style
// numbers and names are public product identifiers; image/product URLs are
// stored as REFERENCES only (never downloaded). Prices are illustrative sample
// values for the AE market and must be reconciled against the authorized feed
// before any production use.
import type { RawSkechersProduct } from './types';

const BASE = 'https://www.skechers.com';

export const SAMPLE_SKECHERS_PRODUCTS: Record<string, RawSkechersProduct> = {
  // ---- Requested sample styles -------------------------------------------
  '232625': {
    styleNumber: '232625',
    name: 'Skechers Slip-ins: Go Walk 7 - Easy On',
    category: 'Footwear',
    subcategory: 'Walking',
    gender: 'Men',
    color: 'Navy',
    sizeRange: 'UK 6-12',
    price: 279,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/232625/NVY.jpg`,
    productUrl: `${BASE}/en-ae/product/232625/`,
    description: 'Step in and go with the hands-free comfort of the Slip-ins Go Walk 7.',
    customerDescription: 'Hands-free comfort with a supportive, cushioned walking ride.',
    keyFeatures: ['Hands-Free Slip-ins design', 'Heel Pillow to hold the foot', 'Air-Cooled Goga Mat insole', 'Machine washable'],
    technology: 'Hands Free Slip-ins, Air-Cooled Goga Mat, Goodyear Rubber',
    activityType: 'Walking',
    sourceRegion: 'AE',
  },
  '124500': {
    styleNumber: '124500',
    name: 'Skechers Go Walk Joy',
    category: 'Footwear',
    subcategory: 'Walking',
    gender: 'Women',
    color: 'Black',
    sizeRange: 'UK 3-8',
    price: 199,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/124500/BBK.jpg`,
    productUrl: `${BASE}/en-ae/product/124500/`,
    description: 'Lightweight, everyday walking comfort with a slip-on fit.',
    customerDescription: 'A light, easy-on everyday walking shoe.',
    keyFeatures: ['Lightweight design', 'Air-Cooled Goga Mat insole', 'Slip-on fit'],
    technology: 'Air-Cooled Goga Mat',
    activityType: 'Walking',
    sourceRegion: 'AE',
  },
  '216202': {
    styleNumber: '216202',
    name: 'Skechers Slip-ins: Go Walk Flex - Hands Up',
    category: 'Footwear',
    subcategory: 'Walking',
    gender: 'Men',
    color: 'Charcoal',
    sizeRange: 'UK 6-12',
    price: 259,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/216202/CHAR.jpg`,
    productUrl: `${BASE}/en-ae/product/216202/`,
    description: 'Flexible hands-free walking comfort with responsive cushioning.',
    customerDescription: 'Flexible, hands-free walking with responsive cushioning.',
    keyFeatures: ['Hands-Free Slip-ins design', 'Ultra Flight cushioning', 'Air-Cooled Goga Mat insole'],
    technology: 'Hands Free Slip-ins, Ultra Flight, Air-Cooled Goga Mat',
    activityType: 'Walking',
    sourceRegion: 'AE',
  },

  // ---- Anchor products the relationship rules reference --------------------
  '204225': {
    styleNumber: '204225',
    name: 'Skechers Max Cushioning Elite',
    category: 'Footwear',
    subcategory: 'Walking',
    gender: 'Men',
    color: 'Black',
    sizeRange: 'UK 6-12',
    price: 389,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/204225/BBK.jpg`,
    productUrl: `${BASE}/en-ae/product/204225/`,
    description: 'Ultra-high cushioning for premium walking comfort.',
    customerDescription: 'Maximum cushioning for a plush, high-tier walking ride.',
    keyFeatures: ['ULTRA GO cushioning', 'Air-Cooled Goga Mat insole', 'High-rebound midsole'],
    technology: 'ULTRA GO, Air-Cooled Goga Mat',
    activityType: 'Walking',
    sourceRegion: 'AE',
  },
  '200147': {
    styleNumber: '200147',
    name: 'Skechers Work: Sure Track - Slip Resistant',
    category: 'Footwear',
    subcategory: 'Work',
    gender: 'Men',
    color: 'Black',
    sizeRange: 'UK 6-12',
    price: 329,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/200147/BLK.jpg`,
    productUrl: `${BASE}/en-ae/product/200147/`,
    description: 'Slip-resistant work shoe built for long shifts on hard floors.',
    customerDescription: 'Slip-resistant support for long shifts on your feet.',
    keyFeatures: ['Slip-resistant outsole', 'Memory Foam insole', 'Electrical hazard safe'],
    technology: 'Slip Resistant, Memory Foam',
    activityType: 'Work',
    sourceRegion: 'AE',
  },
  'SOCK-PERF-AE': {
    styleNumber: 'SOCK-PERF-AE',
    name: 'Skechers Performance Crew Socks (3 Pack)',
    category: 'Accessories',
    subcategory: 'Socks',
    gender: 'Unisex',
    color: 'White',
    sizeRange: 'M/L',
    price: 45,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/socks/perf.jpg`,
    productUrl: `${BASE}/en-ae/product/skechers-performance-socks/`,
    description: 'Moisture-wicking performance crew socks with arch support.',
    keyFeatures: ['Moisture-wicking', 'Arch support band', 'Cushioned sole'],
    technology: 'Moisture-Wicking',
    activityType: 'Walking',
    sourceRegion: 'AE',
  },
  'SOCK-NOSHOW-AE': {
    styleNumber: 'SOCK-NOSHOW-AE',
    name: 'Skechers No-Show Socks (6 Pack)',
    category: 'Accessories',
    subcategory: 'Socks',
    gender: 'Unisex',
    color: 'Black',
    sizeRange: 'M/L',
    price: 39,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/socks/noshow.jpg`,
    productUrl: `${BASE}/en-ae/product/skechers-no-show-socks/`,
    description: 'Low-cut no-show socks, ideal for slip-in and low-profile styles.',
    keyFeatures: ['No-show low cut', 'Heel grip', 'Breathable knit'],
    technology: 'Breathable Knit',
    activityType: 'Casual',
    sourceRegion: 'AE',
  },
  'CARE-CLEAN-AE': {
    styleNumber: 'CARE-CLEAN-AE',
    name: 'Skechers Shoe Cleaner Kit',
    category: 'Accessories',
    subcategory: 'Shoe Care',
    gender: 'Unisex',
    color: null as unknown as string,
    sizeRange: 'One size',
    price: 55,
    currency: 'AED',
    imageUrl: `${BASE}/en-ae/care/cleaner.jpg`,
    productUrl: `${BASE}/en-ae/product/skechers-shoe-cleaner/`,
    description: 'Cleaner solution, brush, and cloth to keep shoes looking new.',
    keyFeatures: ['Cleaning solution', 'Dual-sided brush', 'Microfibre cloth'],
    technology: null as unknown as string,
    activityType: 'Casual',
    sourceRegion: 'AE',
  },
};

/** The default set of styles ingested when none are specified. */
export const DEFAULT_SAMPLE_STYLES = Object.keys(SAMPLE_SKECHERS_PRODUCTS);

/**
 * Anchor products the relationship rules reference (upgrade / work / socks /
 * care). The runner auto-includes any of these that exist in the source so
 * generated relationships resolve even when only a few shoe styles are passed.
 */
export const ANCHOR_STYLES = ['204225', '200147', 'SOCK-PERF-AE', 'SOCK-NOSHOW-AE', 'CARE-CLEAN-AE'];
