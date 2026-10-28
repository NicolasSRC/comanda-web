import { CheckCircle2, ChefHat, Clock, Flame, RefreshCw, Wine } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState, ErrorState, PageHeader, SkeletonGrid, StatCard } from '@/components/shared/feedback';
import { ItemStatusBadge } from '@/components/shared/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdvanceQueueItem, useKitchenQueue } from '@/hooks/use-kitchen';
import { errorMessage } from '@/lib/api';
import { elapsedLabel, elapsedMinutes } from '@/lib/format';
import { areaLabels } from '@/lib/status';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { OrderItemStatus, PreparationArea, QueueItem } from '@/types/api';

const statusFilters: Array<{ value: 'ALL' | OrderItemStatus; label: string }> = [
  { value: 'ALL', label: 'Todo' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'IN_PREPARATION', label: 'En preparación' },
  { value: 'READY', label: 'Listos' },
];

function QueueColumn({
  area,
  filter,
}: {
  area: PreparationArea;
  filter: 'ALL' | OrderItemStatus;
}) {
  const queue = useKitchenQueue(area);
  const advance = useAdvanceQueueItem();
  const user = useAuthStore((state) => state.user);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const items = useMemo(
    () => (queue.data?.data ?? []).filter((item) => filter === 'ALL' || item.status === filter),
    [queue.data, filter],
  );

  const update = async (item: QueueItem, status: OrderItemStatus) => {
    try {
      await advance.mutateAsync({ orderId: item.order.id, itemId: item.id, status });
      toast.success(
        status === 'READY'
          ? `${item.productNameSnapshot} listo para servir`
          : `${item.productNameSnapshot} en preparación`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (queue.isPending) return <SkeletonGrid count={4} />;
  if (queue.isError) {
    return <ErrorState message={errorMessage(queue.error)} onRetry={() => void queue.refetch()} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={`Nada pendiente en ${areaLabels[area].toLowerCase()}`}
        description="Los nuevos ítems aparecerán aquí automáticamente."
        icon={area === 'KITCHEN' ? <ChefHat /> : <Wine />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => {
        const minutes = elapsedMinutes(item.createdAt, now);
        const urgent = minutes >= 15 && item.status !== 'READY';
        const pendingThis = advance.isPending && advance.variables?.itemId === item.id;

        return (
          <Card
            key={item.id}
            className={cn(
              'gap-0 overflow-hidden py-0',
              urgent && 'border-destructive/40',
              item.status === 'READY' && 'border-emerald-300',
            )}
          >
            <div
              className={cn(
                'h-1.5 w-full',
                item.status === 'PENDING' && 'bg-amber-500',
                item.status === 'IN_PREPARATION' && 'bg-sky-500',
                item.status === 'READY' && 'bg-emerald-500',
              )}
            />
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.order.table.name} · {item.order.table.zone.name}
                  </p>
                  <h3 className="text-lg font-semibold leading-tight">
                    {item.quantity}× {item.productNameSnapshot}
                  </h3>
                  {item.variantNameSnapshot && (
                    <p className="text-sm text-muted-foreground">{item.variantNameSnapshot}</p>
                  )}
                </div>
                <ItemStatusBadge status={item.status} />
              </div>

              {item.modifiers.length > 0 && (
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  {item.modifiers.map((modifier) => (
                    <p key={modifier.id}>
                      {modifier.quantity > 1 ? `${modifier.quantity}× ` : ''}
                      {modifier.nameSnapshot}
                    </p>
                  ))}
                </div>
              )}

              {item.notes && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {item.notes}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {elapsedLabel(item.createdAt, now)}
                </span>
                <span>Mesero: {item.order.waiter.fullName}</span>
                {item.order.guests > 0 && <span>{item.order.guests} comensales</span>}
              </div>

              <div className="flex gap-2">
                {item.status === 'PENDING' && (
                  <Button
                    className="flex-1"
                    onClick={() => void update(item, 'IN_PREPARATION')}
                    disabled={pendingThis}
                  >
                    <Flame /> Empezar
                  </Button>
                )}
                {item.status === 'IN_PREPARATION' && (
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => void update(item, 'READY')}
                    disabled={pendingThis}
                  >
                    <CheckCircle2 /> Marcar listo
                  </Button>
                )}
                {item.status === 'READY' && (
                  <div className="flex w-full items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" /> Listo para servir
                    </span>
                    {user?.role === 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void update(item, 'SERVED')}
                        disabled={pendingThis}
                      >
                        Servir
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function KitchenPage() {
  const user = useAuthStore((state) => state.user);
  const [area, setArea] = useState<PreparationArea>('KITCHEN');
  const [filter, setFilter] = useState<'ALL' | OrderItemStatus>('ALL');
  const kitchen = useKitchenQueue('KITCHEN');
  const bar = useKitchenQueue('BAR');

  const all = [...(kitchen.data?.data ?? []), ...(bar.data?.data ?? [])];
  const pending = all.filter((item) => item.status === 'PENDING').length;
  const preparing = all.filter((item) => item.status === 'IN_PREPARATION').length;
  const ready = all.filter((item) => item.status === 'READY').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Producción"
        title="Cocina y barra"
        description="Avanza los ítems en orden de llegada. La cola se actualiza en vivo."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void kitchen.refetch();
              void bar.refetch();
            }}
            disabled={kitchen.isFetching || bar.isFetching}
          >
            <RefreshCw className={cn((kitchen.isFetching || bar.isFetching) && 'animate-spin')} />
            Actualizar
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pendientes" value={String(pending)} tone="warning" icon={<Clock />} />
        <StatCard label="En preparación" value={String(preparing)} icon={<Flame />} />
        <StatCard label="Listos" value={String(ready)} tone="positive" icon={<CheckCircle2 />} />
      </div>

      <Tabs
        value={area}
        onValueChange={(value) => {
          setArea(value as PreparationArea);
          setFilter('ALL');
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="KITCHEN">
              <ChefHat /> Cocina
            </TabsTrigger>
            <TabsTrigger value="BAR">
              <Wine /> Barra
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? 'default' : 'outline'}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="KITCHEN">
          <QueueColumn area="KITCHEN" filter={filter} />
        </TabsContent>
        <TabsContent value="BAR">
          <QueueColumn area="BAR" filter={filter} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">Los ítems listos esperan al mesero</Badge>
        {user?.role === 'ADMIN' && <Badge variant="outline">Como admin también puedes servir</Badge>}
        <Badge variant="outline">Actualización en vivo por SSE</Badge>
      </div>
    </div>
  );
}
