import { create } from 'zustand';
import type { CartLine } from '@/types/api';

export interface ActiveTable {
  id: string;
  name: string;
  zoneName: string;
  orderId: string | null;
}

interface OrderDraftState {
  activeTable: ActiveTable | null;
  lines: CartLine[];
  setActiveTable: (table: ActiveTable | null) => void;
  addLine: (line: Omit<CartLine, 'key'>) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

function signature(line: Omit<CartLine, 'key'>): string {
  return JSON.stringify({
    productId: line.productId,
    variantId: line.variantId,
    modifiers: line.modifiers
      .map((modifier) => `${modifier.id}:${modifier.quantity}`)
      .sort()
      .join('|'),
    notes: line.notes.trim(),
  });
}

export function cartLineTotal(line: CartLine): number {
  const extras = line.modifiers.reduce(
    (sum, modifier) => sum + modifier.extraPrice * modifier.quantity,
    0,
  );
  return (line.unitPrice + extras) * line.quantity;
}

export const useOrderDraftStore = create<OrderDraftState>((set) => ({
  activeTable: null,
  lines: [],
  setActiveTable: (activeTable) => set({ activeTable }),
  addLine: (line) =>
    set((state) => {
      const key = signature(line);
      const existing = state.lines.find((item) => item.key === key);

      if (existing) {
        return {
          lines: state.lines.map((item) =>
            item.key === key
              ? { ...item, quantity: Math.min(99, item.quantity + line.quantity) }
              : item,
          ),
        };
      }

      const newLine: CartLine = {
        ...line,
        key: `${line.productId}:${crypto.randomUUID()}`,
        notes: line.notes.trim(),
        modifiers: line.modifiers.filter((modifier) => modifier.quantity > 0),
      };

      return { lines: [...state.lines, newLine] };
    }),
  removeLine: (key) => set((state) => ({ lines: state.lines.filter((line) => line.key !== key) })),
  setQuantity: (key, quantity) =>
    set((state) => ({
      lines: state.lines
        .map((line) =>
          line.key === key
            ? { ...line, quantity: Math.max(0, Math.min(99, quantity)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    })),
  clear: () => set({ lines: [] }),
}));
