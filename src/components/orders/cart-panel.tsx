import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAddOrderItems, type AddOrderItemPayload } from '@/hooks/use-orders';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { cartLineTotal, useOrderDraftStore } from '@/stores/order-draft-store';

export function CartPanel({
  orderId,
  currency,
  disabled = false,
}: {
  orderId: string;
  currency: string;
  disabled?: boolean;
}) {
  const lines = useOrderDraftStore((state) => state.lines);
  const setQuantity = useOrderDraftStore((state) => state.setQuantity);
  const removeLine = useOrderDraftStore((state) => state.removeLine);
  const clear = useOrderDraftStore((state) => state.clear);
  const addItems = useAddOrderItems(orderId);

  const total = lines.reduce((sum, line) => sum + cartLineTotal(line), 0);

  const submit = async () => {
    if (lines.length === 0) return;

    const items: AddOrderItemPayload[] = lines.map((line) => ({
      productoId: line.productId,
      ...(line.variantId ? { varianteId: line.variantId } : {}),
      cantidad: line.quantity,
      ...(line.modifiers.length > 0
        ? {
            modificadores: line.modifiers.map((modifier) => ({
              modificadorId: modifier.id,
              cantidad: modifier.quantity,
            })),
          }
        : {}),
      ...(line.notes ? { notas: line.notes } : {}),
    }));

    try {
      await addItems.mutateAsync(items);
      clear();
      toast.success('Ítems enviados al pedido');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-4" /> Nuevos ítems
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {lines.reduce((sum, line) => sum + line.quantity, 0)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 p-4">
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Elige productos de la carta para agregarlos al pedido.
          </p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => (
              <div key={line.key} className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {line.productName}
                      {line.variantName ? ` · ${line.variantName}` : ''}
                    </p>
                    {line.modifiers.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {line.modifiers
                          .map((modifier) =>
                            modifier.quantity > 1
                              ? `${modifier.quantity}× ${modifier.name}`
                              : modifier.name,
                          )
                          .join(', ')}
                      </p>
                    )}
                    {line.notes && (
                      <p className="text-xs italic text-muted-foreground">“{line.notes}”</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatMoney(cartLineTotal(line), currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-md border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                      aria-label="Disminuir cantidad"
                    >
                      <Minus />
                    </Button>
                    <span className="w-7 text-center text-xs tabular-nums">{line.quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(line.key)}
                    aria-label={`Quitar ${line.productName}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total estimado</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatMoney(total, currency)}
          </span>
        </div>

        <Button
          className="w-full"
          onClick={() => void submit()}
          disabled={disabled || lines.length === 0 || addItems.isPending}
        >
          {addItems.isPending ? 'Enviando…' : 'Enviar a cocina'}
        </Button>
        {disabled && (
          <p className="text-center text-xs text-muted-foreground">
            El pedido ya no está abierto.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
