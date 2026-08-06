// Holds the associate's current selection — the product in hand and the chosen
// customer need. This is the input the Phase 5 recommendation engine will read.
// No recommendations are generated here.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CustomerNeed, Product } from '../../types/db';

export interface SelectionState {
  selectedProduct: Product | null;
  selectedNeed: CustomerNeed | null;
  setSelectedProduct: (p: Product | null) => void;
  setSelectedNeed: (n: CustomerNeed | null) => void;
  reset: () => void;
}

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<CustomerNeed | null>(null);

  const value = useMemo<SelectionState>(
    () => ({
      selectedProduct,
      selectedNeed,
      setSelectedProduct,
      setSelectedNeed,
      reset: () => {
        setSelectedProduct(null);
        setSelectedNeed(null);
      },
    }),
    [selectedProduct, selectedNeed],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within a SelectionProvider');
  return ctx;
}
