import { Flame, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from '@/lib/format';
import { areaLabels } from '@/lib/status';
import type { PublicProduct } from '@/types/api';

export function PublicProductDialog({
  product,
  currency,
  open,
  onOpenChange,
}: {
  product: PublicProduct | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{areaLabels[product.area]}</Badge>
            {product.variantes.length > 0 && (
              <Badge variant="outline">{product.variantes.length} presentaciones</Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{product.nombre}</DialogTitle>
          {product.descripcion && <DialogDescription>{product.descripcion}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between rounded-lg bg-muted/60 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {product.variantes.length > 0 ? 'Desde' : 'Precio'}
            </span>
            <span className="text-xl font-semibold">
              {formatMoney(product.precio, currency)}
            </span>
          </div>

          {product.variantes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Presentaciones</p>
              <div className="grid gap-2">
                {product.variantes.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{variant.nombre}</span>
                    <span className="font-medium tabular-nums">
                      {formatMoney(variant.precio, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.gruposModificadores.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Personaliza tu pedido</p>
                {product.gruposModificadores.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{group.nombre}</p>
                      <span className="text-xs text-muted-foreground">
                        {group.obligatorio ? 'Obligatorio' : 'Opcional'} · elige entre{' '}
                        {group.minimo} y {group.maximo}
                      </span>
                    </div>
                    <div className="grid gap-1.5">
                      {group.modificadores.map((modifier) => (
                        <div
                          key={modifier.id}
                          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-sm"
                        >
                          <span>{modifier.nombre}</span>
                          <span className="text-muted-foreground">
                            {modifier.precioExtra > 0
                              ? `+ ${formatMoney(modifier.precioExtra, currency)}`
                              : 'Sin costo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            {product.variantes.length > 0 ? <Sparkles className="size-4" /> : <Flame className="size-4" />}
            Pide directamente a tu mesero indicando el nombre del plato.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
