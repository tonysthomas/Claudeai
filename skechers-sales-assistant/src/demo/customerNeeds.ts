// In-memory customer needs for the self-contained browser demo.
import type { CustomerNeed } from '../types/db';

export const CANONICAL_NEEDS: ReadonlyArray<Pick<CustomerNeed, 'code' | 'name'>> = [
  { code: 'everyday_comfort', name: 'Everyday comfort' },
  { code: 'walking', name: 'Walking' },
  { code: 'work_long_hours', name: 'Work or long hours' },
  { code: 'fitness', name: 'Fitness' },
  { code: 'travel', name: 'Travel' },
  { code: 'style', name: 'Style' },
  { code: 'budget', name: 'Budget' },
  { code: 'maximum_cushioning', name: 'Maximum cushioning' },
  { code: 'support', name: 'Support' },
];

export async function listCustomerNeeds(): Promise<CustomerNeed[]> {
  return CANONICAL_NEEDS.map((n, i) => ({ id: String(i), code: n.code, name: n.name, description: null, active: true }));
}
