import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AddItemDialog } from '@/components/orders/add-item-dialog';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/shared/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePublicMenu } from '@/hooks/use-menu';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { CartLine, PublicProduct } from '@/types/api';

export function ProductPicker({
  slug,
  currency,
  onAdd,
}: {
  slug: string;
  currency: string;
  onAdd: (line: Omit<CartLine, 'key'>) => void;
}) {
  const menu = usePublicMenu(slug);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState<PublicProduct | null>(null);

  const products = useMemo(() => {
    const categories = menu.data?.categorias ?? [];
    const all = categories
      .filter((category) => selectedCategory === 'all' || category.id === selectedCategory)
      .flatMap((category) =>
        category.productos.map((item) => ({ ...item, categoryName: category.nombre })),
      );

    const term = search.trim().toLowerCase();
    return all.filter(
      (item) =>
        !term ||
        item.nombre.toLowerCase().includes(term) ||
        (item.descripcion ?? '').toLowerCase().includes(term),
    );
  }, [menu.data, search, selectedCategory]);

  if (menu.isPending) return <LoadingBlock label="Cargando productos…" />;
  if (menu.isError) {
    return <ErrorState message={errorMessage(menu.error)} onRetry={() => void menu.refetch()} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar en la carta…"
            className="pl-9"
            aria-label="Buscar productos"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          aria-label="Filtrar por categoría"
        >
          <option value="all">Todas las categorías</option>
          {menu.data.categorias.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba con otro nombre o cambia la categoría."
        />
      ) : (
        <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {products.map((item) => (
            <Card key={item.id} className="gap-0 py-0">
              <CardContent className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{item.nombre}</p>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(item.precio, currency)}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {item.descripcion ?? item.categoryName}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {item.categoryName}
                    </Badge>
                    {item.variantes.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.variantes.length} variantes
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  onClick={() => setProduct(item)}
                  aria-label={`Agregar ${item.nombre}`}
                >
                  <Plus />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddItemDialog
        key={product?.id ?? 'none'}
        product={product}
        currency={currency}
        open={Boolean(product)}
        onOpenChange={(open) => !open && setProduct(null)}
        onAdd={onAdd}
      />
    </div>
  );
}
