import {
  Armchair,
  CheckCircle2,
  Clock,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AccountPanel } from '@/components/cashier/account-panel';
import { EmptyState, ErrorState, PageHeader, SkeletonGrid, StatCard } from '@/components/shared/feedback';
import { AccountStatusBadge, PaymentBadge, TableStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTables } from '@/hooks/use-tables';
import { errorMessage } from '@/lib/api';
import { elapsedLabel, formatDateTime, formatMoney, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Account, TableSummary } from '@/types/api';

const CURRENCY = 'COP';

export function CashierPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tables = useTables();
  const [search, setSearch] = useState('');
  const [closedAccount, setClosedAccount] = useState<Account | null>(null);

  const selectedId = searchParams.get('mesaId');
  const allTables = useMemo(() => tables.data?.data ?? [], [tables.data]);

  const serviceTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allTables.filter((table) => {
      const hasOrder = table.orders.length > 0 || table.status !== 'FREE';
      if (!hasOrder) return false;
      if (!term) return true;
      return (
        table.name.toLowerCase().includes(term) ||
        table.zone.name.toLowerCase().includes(term)
      );
    });
  }, [allTables, search]);

  const selectedTable =
    serviceTables.find((table) => table.id === selectedId) ??
    allTables.find((table) => table.id === selectedId) ??
    serviceTables[0] ??
    null;

  const toCharge = allTables.filter((table) => table.status === 'TO_CHARGE').length;
  const free = allTables.filter((table) => table.status === 'FREE').length;

  const selectTable = (table: TableSummary) => {
    setSearchParams({ mesaId: table.id }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cobros"
        title="Caja"
        description="Revisa consumos, aplica propina o descuentos, registra pagos y cierra la cuenta."
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
        <StatCard
          label="Cuentas en servicio"
          value={String(serviceTables.length)}
          icon={<Receipt />}
        />
        <StatCard
          label="Por cobrar"
          value={String(toCharge)}
          tone={toCharge > 0 ? 'warning' : 'default'}
          icon={<Wallet />}
        />
        <StatCard label="Mesas libres" value={String(free)} tone="positive" icon={<Armchair />} />
      </div>

      {tables.isPending && <SkeletonGrid count={4} />}

      {tables.isError && (
        <ErrorState message={errorMessage(tables.error)} onRetry={() => void tables.refetch()} />
      )}

      {tables.isSuccess && serviceTables.length === 0 && (
        <EmptyState
          title="No hay cuentas abiertas"
          description="Cuando un mesero abra una mesa, aparecerá aquí para cobrarla."
          icon={<Receipt />}
        />
      )}

      {tables.isSuccess && serviceTables.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[20rem_1fr]">
          <aside className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar mesa o zona…"
                className="pl-9"
                aria-label="Buscar mesa o zona"
              />
            </div>

            <div className="space-y-2">
              {serviceTables.map((table) => {
                const order = table.orders[0];
                const active = selectedTable?.id === table.id;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => selectTable(table)}
                    className={cn(
                      'w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/50',
                      active && 'border-primary ring-1 ring-primary/30',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="text-xs text-muted-foreground">{table.zone.name}</p>
                      </div>
                      <TableStatusBadge status={table.status} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {order && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {formatTime(order.openedAt)}
                          </span>
                          <span>hace {elapsedLabel(order.openedAt)}</span>
                          <span>
                            {order.guests} comensal{order.guests === 1 ? '' : 'es'}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">
            {selectedTable ? (
              <AccountPanel
                key={selectedTable.id}
                table={selectedTable}
                currency={CURRENCY}
                onClosed={setClosedAccount}
              />
            ) : (
              <EmptyState
                title="Selecciona una mesa"
                description="Elige una cuenta de la lista para ver su detalle."
                icon={<Receipt />}
              />
            )}
          </div>
        </div>
      )}

      <ReceiptDialog
        account={closedAccount}
        onOpenChange={(open) => !open && setClosedAccount(null)}
      />
    </div>
  );
}

function ReceiptDialog({
  account,
  onOpenChange,
}: {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(account)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" /> Cuenta cerrada
          </DialogTitle>
          <DialogDescription>
            {account
              ? `${account.mesa} · ${account.zona} · cerrada el ${formatDateTime(account.cerradaEn)}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {account && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total cobrado</p>
              <p className="text-3xl font-semibold tabular-nums">
                {formatMoney(account.total, CURRENCY)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Atendida por {account.abiertaPor.fullName}
                {account.cerradaPor ? ` · cobrada por ${account.cerradaPor.fullName}` : ''}
              </p>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatMoney(account.subtotal, CURRENCY)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuentos</span>
                <span className="tabular-nums">− {formatMoney(account.descuentos, CURRENCY)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos</span>
                <span className="tabular-nums">{formatMoney(account.impuestos, CURRENCY)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Propina</span>
                <span className="tabular-nums">{formatMoney(account.propina, CURRENCY)}</span>
              </div>
            </div>

            <Separator />

            <Card className="gap-0 py-0">
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm">Pagos registrados</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {account.pagos.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="space-y-1">
                      <PaymentBadge method={payment.metodo} />
                      <p className="text-xs text-muted-foreground">
                        {payment.referencia ?? 'Sin referencia'} ·{' '}
                        {payment.recibidoPor.fullName}
                      </p>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatMoney(payment.monto, CURRENCY)}
                    </span>
                  </div>
                ))}
                {account.pagos.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">Sin pagos registrados.</p>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <AccountStatusBadge status={account.estado} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
