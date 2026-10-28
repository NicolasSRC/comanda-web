import {
  ArrowLeft,
  ChefHat,
  CircleDollarSign,
  Clock,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CancelItemDialog } from '@/components/orders/cancel-item-dialog';
import { CartPanel } from '@/components/orders/cart-panel';
import { ProductPicker } from '@/components/orders/product-picker';
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/shared/feedback';
import { ItemStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePublicMenu } from '@/hooks/use-menu';
import { useChangeItemStatus, useOrder } from '@/hooks/use-orders';
import { errorMessage } from '@/lib/api';
import { elapsedLabel, formatMoney, formatTime } from '@/lib/format';
import { areaLabels } from '@/lib/status';
import { useAuthStore } from '@/stores/auth-store';
import { useOrderDraftStore } from '@/stores/order-draft-store';
import type { OrderItem } from '@/types/api';

export function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const user = useAuthStore((state) => state.user);
  const setActiveTable = useOrderDraftStore((state) => state.setActiveTable);
  const addLine = useOrderDraftStore((state) => state.addLine);
  const order = useOrder(orderId);
  const changeStatus = useChangeItemStatus(orderId ?? '');
  const slug = user?.restaurant?.slug ?? 'demo';
  const menu = usePublicMenu(slug);
  const [cancelItem, setCancelItem] = useState<OrderItem | null>(null);

  useEffect(() => {
    if (!order.data) return;
    setActiveTable({
      id: order.data.tableId,
      name: order.data.table.name,
      zoneName: order.data.table.zone.name,
      orderId: order.data.id,
    });
  }, [order.data, setActiveTable]);

  if (!orderId) return <ErrorState message="Pedido no encontrado" />;
  if (order.isPending) return <LoadingBlock label="Cargando el pedido…" />;
  if (order.isError) {
    return <ErrorState message={errorMessage(order.error)} onRetry={() => void order.refetch()} />;
  }

  const data = order.data;
  const currency = menu.data?.restaurante.moneda ?? 'COP';
  const isOpen = data.status === 'OPEN';
  const role = user?.role;
  const activeItems = data.items.filter((item) => item.status !== 'CANCELLED');

  const advance = async (item: OrderItem, status: 'IN_PREPARATION' | 'READY' | 'SERVED') => {
    try {
      await changeStatus.mutateAsync({ itemId: item.id, status });
      const labels = {
        IN_PREPARATION: 'En preparación',
        READY: 'Listo',
        SERVED: 'Servido',
      } as const;
      toast.success(`${item.productNameSnapshot}: ${labels[status]}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const canCancel = (item: OrderItem) =>
    item.status !== 'CANCELLED' &&
    (role === 'ADMIN' || (role === 'WAITER' && item.status !== 'SERVED'));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${data.table.zone.name} · Pedido ${data.id.slice(0, 8)}`}
        title={`${data.table.name} · ${data.guests} comensal${data.guests === 1 ? '' : 'es'}`}
        description={`Mesero: ${data.waiter.fullName} · Abierto a las ${formatTime(data.openedAt)} (${elapsedLabel(data.openedAt)})`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/mesas">
                <ArrowLeft /> Mesas
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void order.refetch()}
              disabled={order.isFetching}
            >
              <RefreshCw className={order.isFetching ? 'animate-spin' : undefined} /> Actualizar
            </Button>
            {role === 'ADMIN' && isOpen && (
              <Button size="sm" asChild>
                <Link to={`/app/caja?mesaId=${data.tableId}`}>
                  <CircleDollarSign /> Cobrar
                </Link>
              </Button>
            )}
          </>
        }
      />

      {!isOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Este pedido está {data.status === 'CLOSED' ? 'cerrado' : 'cancelado'} y ya no admite
          cambios.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_23rem]">
        <div className="space-y-6">
          <Card className="gap-0 py-0">
            <CardHeader className="flex-row items-center justify-between border-b py-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ChefHat className="size-4" /> Ítems del pedido
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {activeItems.length} activos
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {formatTime(data.openedAt)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {data.items.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Pedido vacío"
                    description="Agrega productos desde la carta para enviarlos a cocina."
                  />
                </div>
              ) : (
                <ul className="divide-y">
                  {data.items.map((item) => {
                    const pendingThis =
                      changeStatus.isPending && changeStatus.variables?.itemId === item.id;

                    return (
                      <li
                        key={item.id}
                        className={
                          item.status === 'CANCELLED'
                            ? 'space-y-3 p-4 opacity-60'
                            : 'space-y-3 p-4'
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                                {item.quantity}×
                              </span>
                              <p className="font-medium">
                                {item.productNameSnapshot}
                                {item.variantNameSnapshot
                                  ? ` · ${item.variantNameSnapshot}`
                                  : ''}
                              </p>
                              <ItemStatusBadge status={item.status} />
                            </div>
                            {item.modifiers.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {item.modifiers
                                  .map((modifier) =>
                                    modifier.quantity > 1
                                      ? `${modifier.quantity}× ${modifier.nameSnapshot}`
                                      : modifier.nameSnapshot,
                                  )
                                  .join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-xs italic text-muted-foreground">
                                “{item.notes}”
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {areaLabels[item.preparationArea]} ·{' '}
                              {formatMoney(item.unitPrice, currency)} c/u
                              {item.preparationSeconds !== null &&
                                ` · ${Math.max(1, Math.round(item.preparationSeconds / 60))} min de preparación`}
                            </p>
                            {item.status === 'CANCELLED' && item.cancelReason && (
                              <p className="text-xs text-destructive">
                                Cancelado: {item.cancelReason}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-semibold tabular-nums">
                              {formatMoney(item.lineTotal, currency)}
                            </p>
                          </div>
                        </div>

                        {isOpen && item.status !== 'CANCELLED' && (
                          <div className="flex flex-wrap items-center gap-2">
                            {item.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void advance(item, 'IN_PREPARATION')}
                                disabled={pendingThis}
                              >
                                Empezar
                              </Button>
                            )}
                            {item.status === 'IN_PREPARATION' && role === 'ADMIN' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void advance(item, 'READY')}
                                disabled={pendingThis}
                              >
                                Marcar listo
                              </Button>
                            )}
                            {item.status === 'READY' && (
                              <Button
                                size="sm"
                                onClick={() => void advance(item, 'SERVED')}
                                disabled={pendingThis}
                              >
                                Servir
                              </Button>
                            )}
                            {canCancel(item) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setCancelItem(item)}
                              >
                                <XCircle /> Cancelar
                              </Button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {isOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agregar productos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductPicker slug={slug} currency={currency} onAdd={addLine} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-sm">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ítems activos</span>
                <span>{activeItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comensales</span>
                <span>{data.guests}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Total pedido</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatMoney(data.total, currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los impuestos y la propina se calculan al cobrar.
              </p>
            </CardContent>
          </Card>

          {isOpen && <CartPanel orderId={data.id} currency={currency} />}
        </div>
      </div>

      <CancelItemDialog
        orderId={data.id}
        item={cancelItem}
        onOpenChange={(open) => !open && setCancelItem(null)}
      />
    </div>
  );
}
