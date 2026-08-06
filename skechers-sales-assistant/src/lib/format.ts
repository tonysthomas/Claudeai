// Presentation helpers. In demo mode, prices/availability are labeled as demo
// (synthetic data must never look like official Skechers pricing).

const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? 'true') !== 'false';

export const isDemoMode = DEMO_MODE;

/** Format a price with its currency, tagged as demo when in demo mode. */
export function formatPrice(price: number | null, currency: string): string {
  if (price === null || price === undefined) return 'Price N/A';
  const amount = price.toFixed(2);
  if (currency === 'DEMO' || DEMO_MODE) return `Demo ${currency} ${amount}`;
  return `${currency} ${amount}`;
}

/** A placeholder image path by product category. */
export function placeholderImage(category: string | null | undefined): string {
  switch (category) {
    case 'socks':
      return '/images/products/placeholder-sock.svg';
    case 'shoe_care':
      return '/images/products/placeholder-care.svg';
    default:
      return '/images/products/placeholder-shoe.svg';
  }
}

/** Human label for a value that may be null/empty. */
export function orDash(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : '—';
}
