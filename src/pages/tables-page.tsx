import { Armchair, Clock, RefreshCw, Users, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader, SkeletonGrid, StatCard } from '@/components/shared/feedback';
import { TableStatusBadge } from '@/components/shared/status-badges';
import { OpenTableDialog } from '@/components/tables/open-table-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTables, useZones } from '@/hooks/use-tables';
import { errorMessage } from '@/lib/api';
import { elapsedLabel, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useOrderDraftStore } from '@/stores/order-draft-store';
import type { TableSummary } from '@/types/api';

export function TablesPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const setActiveTable = useOrderDraftStore((state) => state.setActiveTable);
  const [zoneId, setZoneId] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<TableSummary | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const zones = useZones(isAdmin);
  const tables = useTables(zoneId === 'all' ? undefined : zoneId);

  const zoneOptions = useMemo(() => {
    if (isAdmin && zones.data) {
      return zones.data.data.map((zone) => ({ id: zone.id, name: zone.name }));
    }
    const map = new Map<string, string>();
    for (const table of tables.data?.data ?? []) {
      map.set(table.zone.id, table.zone.name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [isAdmin, zones.data, tables.data]);

  const allTables = tables.data?.data ?? [];
  const free = allTables.filter((table) => table.status === 'FREE').length;
  const occupied = allTables.length - free;

  const openOrder = (table: TableSummary) => {
    const order = table.orders[0];
    if (!order) return;

    setActiveTable({
      id: table.id,
      name: table.name,
      zoneName: table.zone.name,
      orderId: order.id,
    });
    navigate(`/app/pedidos/${order.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servicio"
        title="Mesas"
        description="Abre una mesa para tomar el pedido o retoma una cuenta en curso."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void tables.refetch()}
            disabled={tables.isFetching}
          >
            <RefreshCw className={cn(tables.isFetching && 'animate-spin')} />
            Actualizar
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Mesas" value={String(allTables.length)} icon={<Armchair />} />
        <StatCard
          label="Libres"
          value={String(free)}
          tone="positive"
          icon={<UtensilsCrossed />}
        />
        <StatCard
          label="En servicio"
          value={String(occupied)}
          tone={occupied > 0 ? 'warning' : 'default'}
          icon={<Users />}
        />
      </div>

      {zoneOptions.length > 1 && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          <Button
            size="sm"
            variant={zoneId === 'all' ? 'default' : 'outline'}
            onClick={() => setZoneId('all')}
          >
            Todas
          </Button>
          {zoneOptions.map((zone) => (
            <Button
              key={zone.id}
              size="sm"
              variant={zoneId === zone.id ? 'default' : 'outline'}
              onClick={() => setZoneId(zone.id)}
              className="shrink-0"
            >
              {zone.name}
            </Button>
          ))}
        </div>
      )}

      {tables.isPending && <SkeletonGrid count={6} />}

      {tables.isError && (
        <ErrorState message={errorMessage(tables.error)} onRetry={() => void tables.refetch()} />
      )}

      {tables.isSuccess && allTables.length === 0 && (
        <EmptyState
          title="No hay mesas en esta zona"
          description="Crea mesas desde la API o cambia el filtro de zona."
          icon={<Armchair />}
        />
      )}

      {tables.isSuccess && allTables.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {allTables.map((table) => {
            const order = table.orders[0];
            const isFree = table.status === 'FREE' || !order;

            return (
              <Card
                key={table.id}
                className={cn(
                  'gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md',
                  !isFree && 'border-amber-200',
                )}
              >
                <div
                  className={cn(
                    'h-1.5 w-full',
                    isFree ? 'bg-emerald-500' : 'bg-amber-500',
                    table.status === 'TO_CHARGE' && 'bg-sky-500',
                  )}
                />
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{table.name}</h3>
                      <p className="text-xs text-muted-foreground">{table.zone.name}</p>
                    </div>
                    <TableStatusBadge status={table.status} />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4" /> {table.capacity} puestos
                    </span>
                    {order && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4" /> {formatTime(order.openedAt)}
                      </span>
                    )}
                  </div>

                  {order ? (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                        <p className="font-medium">
                          {order.guests} comensal{order.guests === 1 ? '' : 'es'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Abierta hace {elapsedLabel(order.openedAt)}
                        </p>
                      </div>
                      <Button className="w-full" onClick={() => openOrder(table)}>
                        Ver pedido
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setSelectedTable(table)}
                    >
                      Abrir mesa
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OpenTableDialog
        table={selectedTable}
        onOpenChange={(open) => !open && setSelectedTable(null)}
        onOpened={(table, orderId) => {
          setActiveTable({
            id: table.id,
            name: table.name,
            zoneName: table.zone.name,
            orderId,
          });
          void tables.refetch();
          navigate(`/app/pedidos/${orderId}`);
        }}
      />
    </div>
  );
}
