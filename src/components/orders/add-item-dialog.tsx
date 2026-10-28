import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CartLine, PublicModifier, PublicModifierGroup, PublicProduct } from '@/types/api';

export function AddItemDialog({
  product,
  currency,
  open,
  onOpenChange,
  onAdd,
}: {
  product: PublicProduct | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: Omit<CartLine, 'key'>) => void;
}) {
  const [variantId, setVariantId] = useState<string | null>(
    () => product?.variantes[0]?.id ?? null,
  );
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    if (product.variantes.length === 0) return product.precio;
    return product.variantes.find((variant) => variant.id === variantId)?.precio ?? product.precio;
  }, [product, variantId]);

  const chosenModifiers = useMemo(() => {
    if (!product) return [] as Array<{ modifier: PublicModifier; quantity: number }>;
    return product.gruposModificadores.flatMap((group) =>
      group.modificadores
        .filter((modifier) => (selections[modifier.id] ?? 0) > 0)
        .map((modifier) => ({ modifier, quantity: selections[modifier.id] ?? 0 })),
    );
  }, [product, selections]);

  const extras = chosenModifiers.reduce(
    (sum, item) => sum + item.modifier.precioExtra * item.quantity,
    0,
  );
  const lineTotal = (unitPrice + extras) * quantity;

  if (!product) return null;

  const groupCount = (group: PublicModifierGroup) =>
    group.modificadores.reduce((sum, modifier) => sum + (selections[modifier.id] ?? 0), 0);

  const toggleModifier = (group: PublicModifierGroup, modifier: PublicModifier) => {
    setError(null);
    const current = selections[modifier.id] ?? 0;

    if (current > 0) {
      setSelections((previous) => {
        const next = { ...previous };
        delete next[modifier.id];
        return next;
      });
      return;
    }

    if (group.maximo > 0 && groupCount(group) >= group.maximo) {
      setError(`Puedes elegir como máximo ${group.maximo} en «${group.nombre}»`);
      return;
    }

    setSelections((previous) => ({ ...previous, [modifier.id]: 1 }));
  };

  const changeModifierQuantity = (
    group: PublicModifierGroup,
    modifier: PublicModifier,
    nextQuantity: number,
  ) => {
    setError(null);
    const current = selections[modifier.id] ?? 0;
    const others = groupCount(group) - current;
    const bounded = Math.max(0, Math.min(nextQuantity, group.maximo - others, 99));

    setSelections((previous) => {
      const next = { ...previous };
      if (bounded === 0) {
        delete next[modifier.id];
      } else {
        next[modifier.id] = bounded;
      }
      return next;
    });
  };

  const submit = () => {
    if (product.variantes.length > 0 && !variantId) {
      setError('Selecciona una presentación');
      return;
    }

    for (const group of product.gruposModificadores) {
      const count = groupCount(group);
      if (count < group.minimo) {
        setError(`Elige al menos ${group.minimo} en «${group.nombre}»`);
        return;
      }
      if (count > group.maximo) {
        setError(`Elige como máximo ${group.maximo} en «${group.nombre}»`);
        return;
      }
    }

    const variant = product.variantes.find((item) => item.id === variantId);

    onAdd({
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.nombre,
      variantName: variant?.nombre ?? null,
      unitPrice,
      quantity,
      modifiers: chosenModifiers.map(({ modifier, quantity: modifierQuantity }) => ({
        id: modifier.id,
        name: modifier.nombre,
        extraPrice: modifier.precioExtra,
        quantity: modifierQuantity,
      })),
      notes,
      area: product.area,
    });

    toast.success(`${product.nombre} agregado al pedido`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.nombre}</DialogTitle>
          {product.descripcion && <DialogDescription>{product.descripcion}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-5">
          {product.variantes.length > 0 && (
            <div className="space-y-2">
              <Label>Presentación</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {product.variantes.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setVariantId(variant.id)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                      variantId === variant.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-accent',
                    )}
                  >
                    <span>{variant.nombre}</span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(variant.precio, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.gruposModificadores.map((group) => {
            const count = groupCount(group);
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>
                    {group.nombre}
                    {group.obligatorio && <span className="text-destructive">*</span>}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {count}/{group.maximo} · mínimo {group.minimo}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.modificadores.map((modifier) => {
                    const selectedQuantity = selections[modifier.id] ?? 0;
                    return (
                      <div
                        key={modifier.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2',
                          selectedQuantity > 0 && 'border-primary/40 bg-primary/5',
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={selectedQuantity > 0}
                          onClick={() => toggleModifier(group, modifier)}
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded border text-[10px]',
                            selectedQuantity > 0
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input',
                          )}
                        >
                          {selectedQuantity > 0 ? '✓' : ''}
                        </button>
                        <button
                          type="button"
                          className="flex-1 text-left text-sm"
                          onClick={() => toggleModifier(group, modifier)}
                        >
                          {modifier.nombre}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {modifier.precioExtra > 0
                            ? `+ ${formatMoney(modifier.precioExtra, currency)}`
                            : 'Sin costo'}
                        </span>
                        {selectedQuantity > 0 && group.maximo > 1 && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() =>
                                changeModifierQuantity(group, modifier, selectedQuantity - 1)
                              }
                              aria-label={`Quitar ${modifier.nombre}`}
                            >
                              <Minus />
                            </Button>
                            <span className="w-5 text-center text-xs tabular-nums">
                              {selectedQuantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() =>
                                changeModifierQuantity(group, modifier, selectedQuantity + 1)
                              }
                              aria-label={`Agregar ${modifier.nombre}`}
                            >
                              <Plus />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="space-y-2">
            <Label htmlFor="item-notes">Notas para cocina (opcional)</Label>
            <Textarea
              id="item-notes"
              rows={2}
              maxLength={300}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Sin cebolla, término medio, salsa aparte…"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Label>Cantidad</Label>
              <div className="flex items-center rounded-lg border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Disminuir cantidad"
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                  aria-label="Aumentar cantidad"
                >
                  <Plus />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <Badge variant="secondary" className="text-sm">
                Total {formatMoney(lineTotal, currency)}
              </Badge>
              <Button type="button" onClick={submit}>
                <ShoppingBag /> Agregar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
