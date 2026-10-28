import { ArrowRight, Clock, MapPin, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicProductDialog } from '@/components/menu/public-product-dialog';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/shared/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePublicMenu } from '@/hooks/use-menu';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PublicProduct } from '@/types/api';

export function PublicMenuPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? import.meta.env.VITE_RESTAURANT_SLUG ?? 'demo';
  const menu = usePublicMenu(slug);
  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryNames = useMemo(
    () => menu.data?.categorias.map((category) => ({ id: category.id, nombre: category.nombre })) ?? [],
    [menu.data],
  );

  useEffect(() => {
    if (!menu.data) return;
    const name = menu.data.restaurante.nombre;
    document.title = `${name} · Carta digital`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      'content',
      `Carta digital de ${name}. Consulta platos, precios, variantes y combos.`,
    );
  }, [menu.data]);

  const activeCategory = selectedCategory ?? categoryNames[0]?.id ?? null;

  const currency = menu.data?.restaurante.moneda ?? 'COP';

  if (menu.isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <LoadingBlock label="Cargando la carta…" />
      </div>
    );
  }

  if (menu.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState message={errorMessage(menu.error)} onRetry={() => void menu.refetch()} />
      </div>
    );
  }

  const { restaurante, categorias, combos } = menu.data;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold">{restaurante.nombre}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> Carta digital
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">
              Personal <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b bg-sidebar text-sidebar-foreground">
          <div
            aria-hidden
            className="absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(circle at 15% 20%, color-mix(in oklab, var(--sidebar-primary) 40%, transparent), transparent 45%), radial-gradient(circle at 85% 80%, color-mix(in oklab, #f59e0b 18%, transparent), transparent 40%)',
            }}
          />
          <div className="relative mx-auto max-w-6xl space-y-4 px-4 py-14 md:py-20">
            <Badge className="bg-sidebar-primary text-sidebar-primary-foreground">
              Carta publicada
            </Badge>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              {restaurante.nombre}
            </h1>
            <p className="max-w-xl text-base text-sidebar-foreground/70">
              Descubre nuestros platos, presentaciones y combos. Los precios se muestran en{' '}
              {restaurante.moneda}.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-sidebar-foreground/60">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> Actualizada en tiempo real
              </span>
              <span>Zona horaria: {restaurante.zonaHoraria}</span>
            </div>
          </div>
        </section>

        <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 no-scrollbar">
            {categoryNames.map((category) => (
              <a
                key={category.id}
                href={`#categoria-${category.id}`}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  activeCategory === category.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent',
                )}
              >
                {category.nombre}
              </a>
            ))}
            {combos.length > 0 && (
              <a
                href="#combos"
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                Combos
              </a>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
          {categorias.length === 0 && combos.length === 0 && (
            <EmptyState
              title="La carta todavía no tiene productos"
              description="Vuelve a consultarla más tarde."
            />
          )}

          {categorias.map((category) => (
            <section key={category.id} id={`categoria-${category.id}`} className="scroll-mt-24 space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold md:text-2xl">{category.nombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    {category.productos.length} producto
                    {category.productos.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {category.productos.map((product) => (
                  <Card
                    key={product.id}
                    className="group cursor-pointer gap-3 py-0 transition-shadow hover:shadow-md"
                    onClick={() => setSelected(product)}
                  >
                    <div className="h-32 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/15 via-accent to-secondary">
                      {product.imagen ? (
                        <img
                          src={product.imagen}
                          alt={product.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UtensilsCrossed className="size-9 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-2 pb-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold leading-snug">{product.nombre}</h3>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatMoney(product.precio, currency)}
                        </span>
                      </div>
                      {product.descripcion && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {product.descripcion}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {product.variantes.length > 0 && (
                          <Badge variant="secondary">
                            {product.variantes.length} presentaciones
                          </Badge>
                        )}
                        {product.gruposModificadores.length > 0 && (
                          <Badge variant="outline">Personalizable</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {combos.length > 0 && (
            <section id="combos" className="scroll-mt-24 space-y-4">
              <h2 className="text-xl font-semibold md:text-2xl">Combos</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {combos.map((combo) => (
                  <Card key={combo.id} className="gap-3">
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{combo.nombre}</h3>
                          {combo.descripcion && (
                            <p className="text-sm text-muted-foreground">{combo.descripcion}</p>
                          )}
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatMoney(combo.precio, currency)}
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {combo.items.map((item, index) => (
                          <li key={`${combo.id}-${index}`}>
                            {item.cantidad} × {item.producto}
                            {item.variante ? ` (${item.variante})` : ''}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        {restaurante.nombre} · Carta generada con Comanda
      </footer>

      <PublicProductDialog
        product={selected}
        currency={currency}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
