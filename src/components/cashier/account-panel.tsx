import {
  BadgePercent,
  CircleDollarSign,
  HandCoins,
  Receipt,
  Split,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  DiscountDialog,
  PaymentDialog,
  SplitDialog,
  TipDialog,
  VoidAccountDialog,
} from '@/components/cashier/account-dialogs';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/shared/feedback';
import { AccountStatusBadge, PaymentBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccountByTable, useCloseAccount } from '@/hooks/use-accounts';
import { ApiError, errorMessage } from '@/lib/api';
import { formatBps, formatDateTime, formatMoney } from '@/lib/format';
import { discountScopeLabels, discountTypeLabels } from '@/lib/status';
import { useAuthStore } from '@/stores/auth-store';
import type { Account, TableSummary } from '@/types/api';

export function AccountPanel({
  table,
  currency,
  onClosed,
}: {
  table: TableSummary;
  currency: string;
  onClosed: (account: Account) => void;
}) {
  const accountQuery = useAccountByTable(table.id);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const isCashier = user?.role === 'CASHIER';
  const [tipOpen, setTipOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const account = accountQuery.data;
  const closeAccount = useCloseAccount(account?.id ?? '');

  if (accountQuery.isPending) return <LoadingBlock label="Cargando la cuenta…" />;

  if (accountQuery.isError) {
    if (accountQuery.error instanceof ApiError && accountQuery.error.status === 404) {
      return (
        <EmptyState
          title="Sin cuenta abierta"
          description={`${table.name} todavía no tiene consumos o la cuenta ya fue cerrada.`}
          icon={<Receipt />}
        />
      );
    }
    return (
      <ErrorState
        message={errorMessage(accountQuery.error)}
        onRetry={() => void accountQuery.refetch()}
      />
    );
  }

  if (!account) return null;

  const isOpen = account.estado === 'OPEN';

  const close = async () => {
    try {
      const closed = await closeAccount.mutateAsync();
      toast.success(`Cuenta de ${closed.mesa} cerrada por ${formatMoney(closed.total, currency)}`);
      setCloseOpen(false);
      onClosed(closed);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">
                {account.mesa} · {account.zona}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Abierta por {account.abiertaPor.fullName} · {formatDateTime(account.abiertaEn)} ·{' '}
                {account.comensales} comensales
              </p>
            </div>
            <AccountStatusBadge status={account.estado} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(account.total, currency)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="text-2xl font-semibold tabular-nums text-emerald-700">
                {formatMoney(account.pagado, currency)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-2xl font-semibold tabular-nums text-amber-700">
                {formatMoney(account.saldo, currency)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOpen && (
              <Button size="sm" variant="outline" onClick={() => setTipOpen(true)}>
                <HandCoins /> Propina
              </Button>
            )}
            {isOpen && (
              <Button size="sm" variant="outline" onClick={() => setDiscountOpen(true)}>
                <BadgePercent /> Descuento
              </Button>
            )}
            {isOpen && isCashier && (
              <Button size="sm" variant="outline" onClick={() => setSplitOpen(true)}>
                <Split /> Dividir
              </Button>
            )}
            {isOpen && isCashier && (
              <Button size="sm" onClick={() => setPaymentOpen(true)} disabled={account.saldo <= 0}>
                <CircleDollarSign /> Registrar pago
              </Button>
            )}
            {isOpen && isCashier && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCloseOpen(true)}
                disabled={account.saldo > 0}
              >
                Cerrar cuenta
              </Button>
            )}
            {account.estado === 'CLOSED' && isAdmin && (
              <Button size="sm" variant="destructive" onClick={() => setVoidOpen(true)}>
                Anular cuenta
              </Button>
            )}
          </div>

          {isOpen && isAdmin && (
            <p className="text-xs text-muted-foreground">
              Los pagos y el cierre los realiza el cajero. Como administrador puedes aplicar
              propina, descuentos y anular cuentas cerradas.
            </p>
          )}

          {isOpen && account.saldo > 0 && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              La cuenta solo puede cerrarse cuando el saldo sea cero.
            </p>
          )}

          <Separator />

          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatMoney(account.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Descuentos</span>
              <span className="tabular-nums">− {formatMoney(account.descuentos, currency)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Impuestos</span>
              <span className="tabular-nums">{formatMoney(account.impuestos, currency)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Propina ({formatBps(account.propinaBps)})</span>
              <span className="tabular-nums">{formatMoney(account.propina, currency)}</span>
            </div>
          </div>

          {account.impuestosDetalle.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {account.preciosIncluyenImpuesto ? 'Precios con impuesto incluido' : 'Precios sin impuesto'} ·{' '}
              {account.impuestosDetalle
                .map((tax) => `${tax.nombre} ${formatBps(tax.tasaBps)} (${formatMoney(tax.monto, currency)})`)
                .join(' · ')}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="consumo">
        <TabsList>
          <TabsTrigger value="consumo">Consumo ({account.lineas.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({account.pagos.length})</TabsTrigger>
          <TabsTrigger value="descuentos">Descuentos ({account.descuentosDetalle.length})</TabsTrigger>
          <TabsTrigger value="divisiones">Divisiones ({account.divisiones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="consumo">
          <Card className="gap-0 py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ítem</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {account.lineas.map((line) => (
                    <TableRow key={line.itemId}>
                      <TableCell className="font-medium">{line.nombre}</TableCell>
                      <TableCell className="text-right">{line.cantidad}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(line.precioUnitario, currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {line.descuento > 0 ? `− ${formatMoney(line.descuento, currency)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(line.neto, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm">Pagos registrados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {account.pagos.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Todavía no hay pagos.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Recibido por</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.pagos.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <PaymentBadge method={payment.metodo} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.referencia ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.recibidoPor.fullName}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(payment.monto, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descuentos">
          <Card className="gap-0 py-0">
            <CardContent className="p-0">
              {account.descuentosDetalle.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No hay descuentos aplicados.</p>
              ) : (
                <ul className="divide-y">
                  {account.descuentosDetalle.map((discount) => (
                    <li key={discount.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {discountScopeLabels[discount.alcance]}
                          {discount.itemNombre ? ` · ${discount.itemNombre}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {discountTypeLabels[discount.tipo]}{' '}
                          {discount.tipo === 'PERCENT'
                            ? formatBps(discount.valor)
                            : formatMoney(discount.valor, currency)}{' '}
                          · {discount.motivo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aplicado por {discount.aplicadoPor.fullName}
                          {discount.aprobadoPor
                            ? ` · aprobado por ${discount.aprobadoPor.fullName}`
                            : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {discount.aprobado ? 'Aprobado' : 'Registrado'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="divisiones">
          <Card className="gap-0 py-0">
            <CardContent className="p-0">
              {account.divisiones.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  La cuenta no se ha dividido.
                </p>
              ) : (
                <ul className="divide-y">
                  {account.divisiones.map((split) => (
                    <li key={split.id} className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <Users className="size-4" /> {split.etiqueta}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {split.items.map((item) => item.nombre).join(', ') || 'Sin ítems'}
                        </p>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatMoney(split.monto, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isOpen && (
        <>
          <TipDialog
            account={account}
            currency={currency}
            open={tipOpen}
            onOpenChange={setTipOpen}
          />
          <DiscountDialog
            account={account}
            currency={currency}
            open={discountOpen}
            onOpenChange={setDiscountOpen}
          />
          <SplitDialog
            account={account}
            currency={currency}
            open={splitOpen}
            onOpenChange={setSplitOpen}
          />
          <PaymentDialog
            account={account}
            currency={currency}
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
          />
          <ConfirmDialog
            open={closeOpen}
            onOpenChange={setCloseOpen}
            title={`Cerrar cuenta de ${account.mesa}`}
            description={`Se cerrará por ${formatMoney(account.total, currency)} y la mesa volverá a estar libre.`}
            confirmLabel="Cerrar cuenta"
            pending={closeAccount.isPending}
            onConfirm={() => void close()}
          />
        </>
      )}

      {account.estado === 'CLOSED' && (
        <VoidAccountDialog
          account={account}
          open={voidOpen}
          onOpenChange={setVoidOpen}
        />
      )}
    </div>
  );
}
