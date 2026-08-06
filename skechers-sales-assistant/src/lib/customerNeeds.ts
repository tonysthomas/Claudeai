// Data access for customer needs. Reads only the existing `customer_needs` table.
import { supabase } from './supabase';
import type { CustomerNeed } from '../types/db';

/** The canonical 9 needs — used as an offline fallback and for tests. */
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

/** List active customer needs from the database. */
export async function listCustomerNeeds(): Promise<CustomerNeed[]> {
  const { data, error } = await supabase
    .from('customer_needs')
    .select('id, code, name, description, active')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerNeed[];
}
