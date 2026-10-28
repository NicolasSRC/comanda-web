import {
  BarChart3,
  CalendarRange,
  Download,
  Package,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState, ErrorState, LoadingBlock, PageHeader, StatCard } from '@/components/shared/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  downloadSalesCsv,
  useCashReport,
  useProductsReport,
  useSalesReport,
} from '@/hooks/use-reports';
import { errorMessage } from '@/lib/api';
import { formatMoney, formatNumber, lastNDays } from '@/lib/format';
import { paymentMethodLabels } from '@/lib/status';
import type { PaymentMethod, ReportGrouping } from '@/types/api';

type TabValue = 'ventas' | 'caja' | 'productos';

const CURRENCY = 'COP';

const groupingLabels: Record<ReportGrouping, string> = {
  DIA: 'Por día',
  SEMANA: 'Por semana',
  MES: 'Por mes',
};

export function ReportsPage() {
  const [range, setRange] = useState(() => lastNDays(29));
  const [agrupacion, setAgrupacion] = useState<ReportGrouping>('DIA');
  const [tab, setTab] = useState<TabValue>('ventas');
  const [downloading, setDownloading] = useState(false);

  const validRange = Boolean(range.desde) && Boolean(range.hasta) && range.desde <= range.hasta;

  const sales = useSalesReport(range, agrupacion, validRange && tab === 'ventas');
  const cash = useCashReport(range, undefined, validRange && tab === 'caja');
  const products = useProductsReport(range, validRange && tab === 'productos');

  const applyPreset = (days: number) => setRange(lastNDays(days));

  const downloadCsv = async () => {
    if (!validRange) return;
    setDownloading(true);
    try {
      await downloadSalesCsv(range, agrupacion);
      toast.success('Reporte CSV descargado');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description="Ventas por periodo, cierre de caja y productos más vendidos."
        actions={
          <Button size="sm" onClick={() => void downloadCsv()} disabled={!validRange || downloading}>
            <Download /> {downloading ? 'Generando…' : 'Descargar CSV'}
          </Button>
        }
      />

      <Card className="gap-4 py-4">
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="report-from">Desde</Label>
              <Input
                id="report-from"
                type="date"
                value={range.desde}
                max={range.hasta}
                onChange={(event) =>
                  setRange((current) => ({ ...current, desde: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to">Hasta</Label>
              <Input
                id="report-to"
                type="date"
                value={range.hasta}
                min={range.desde}
                onChange={(event) =>
                  setRange((current) => ({ ...current, hasta: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-grouping">Agrupación</Label>
              <select
                id="report-grouping"
                value={agrupacion}
                onChange={(event) => setAgrupacion(event.target.value as ReportGrouping)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
              >
                {Object.entries(groupingLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => applyPreset(0)}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(6)}>
              7 días
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(29)}>
              30 días
            </Button>
          </div>
        </CardContent>
      </Card>

      {!validRange && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La fecha inicial debe ser anterior o igual a la final.
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
        <TabsList>
          <TabsTrigger value="ventas">
            <TrendingUp /> Ventas
          </TabsTrigger>
          <TabsTrigger value="caja">
            <Wallet /> Caja
          </TabsTrigger>
          <TabsTrigger value="productos">
            <Package /> Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          {sales.isPending && validRange && <LoadingBlock label="Calculando ventas…" />}
          {sales.isError && (
            <ErrorState message={errorMessage(sales.error)} onRetry={() => void sales.refetch()} />
          )}
          {sales.isSuccess && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Ventas netas"
                  value={formatMoney(sales.data.totales.total, CURRENCY)}
                  icon={<BarChart3 />}
                />
                <StatCard
                  label="Pedidos"
                  value={formatNumber(sales.data.totales.pedidos)}
                  hint={`${formatNumber(sales.data.totales.comensales)} comensales`}
                  icon={<Receipt />}
                />
                <StatCard
                  label="Ticket promedio"
                  value={formatMoney(sales.data.totales.ticketPromedio, CURRENCY)}
                  icon={<TrendingUp />}
                />
                <StatCard
                  label="Propinas"
                  value={formatMoney(sales.data.totales.propina, CURRENCY)}
                  hint={`Descuentos: ${formatMoney(sales.data.totales.descuentos, CURRENCY)}`}
                  tone="positive"
                  icon={<Wallet />}
                />
              </div>

              {sales.data.periodos.length === 0 ? (
                <EmptyState
                  title="Sin ventas en el periodo"
                  description="Prueba con otro rango de fechas."
                  icon={<CalendarRange />}
                />
              ) : (
                <Card className="gap-0 py-0">
                  <CardHeader className="border-b py-4">
                    <CardTitle className="text-sm">
                      Detalle {groupingLabels[agrupacion].toLowerCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Periodo</TableHead>
                          <TableHead className="text-right">Pedidos</TableHead>
                          <TableHead className="text-right">Comensales</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Descuentos</TableHead>
                          <TableHead className="text-right">Impuestos</TableHead>
                          <TableHead className="text-right">Propina</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Ticket prom.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.data.periodos.map((period) => (
                          <TableRow key={period.periodo}>
                            <TableCell className="font-medium">{period.periodo}</TableCell>
                            <TableCell className="text-right">{period.pedidos}</TableCell>
                            <TableCell className="text-right">{period.comensales}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(period.subtotal, CURRENCY)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(period.descuentos, CURRENCY)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(period.impuestos, CURRENCY)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(period.propina, CURRENCY)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatMoney(period.total, CURRENCY)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(period.ticketPromedio, CURRENCY)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="caja">
          {cash.isPending && validRange && <LoadingBlock label="Calculando caja…" />}
          {cash.isError && (
            <ErrorState message={errorMessage(cash.error)} onRetry={() => void cash.refetch()} />
          )}
          {cash.isSuccess && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cash.data.porMetodo.map((method) => (
                  <StatCard
                    key={method.metodo}
                    label={paymentMethodLabels[method.metodo as PaymentMethod]}
                    value={formatMoney(method.total, CURRENCY)}
                    hint={`${formatNumber(method.pagos)} pagos`}
                    icon={<Wallet />}
                  />
                ))}
                <StatCard
                  label="Total recibido"
                  value={formatMoney(cash.data.totales.total, CURRENCY)}
                  hint={`${formatNumber(cash.data.totales.pagos)} pagos`}
                  tone="positive"
                  icon={<Receipt />}
                />
              </div>

              {cash.data.porDia.length === 0 ? (
                <EmptyState
                  title="Sin movimientos de caja"
                  description="No se registraron pagos en el periodo."
                  icon={<Wallet />}
                />
              ) : (
                <Card className="gap-0 py-0">
                  <CardHeader className="border-b py-4">
                    <CardTitle className="text-sm">Cierre por día</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Efectivo</TableHead>
                          <TableHead className="text-right">Tarjeta</TableHead>
                          <TableHead className="text-right">Transferencia</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cash.data.porDia.map((day) => {
                          const amount = (method: PaymentMethod) =>
                            day.metodos.find((item) => item.metodo === method)?.total ?? 0;

                          return (
                            <TableRow key={day.fecha}>
                              <TableCell className="font-medium">{day.fecha}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatMoney(amount('CASH'), CURRENCY)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatMoney(amount('CARD'), CURRENCY)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatMoney(amount('TRANSFER'), CURRENCY)}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {formatMoney(day.total, CURRENCY)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="productos">
          {products.isPending && validRange && <LoadingBlock label="Calculando productos…" />}
          {products.isError && (
            <ErrorState
              message={errorMessage(products.error)}
              onRetry={() => void products.refetch()}
            />
          )}
          {products.isSuccess && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="gap-0 py-0">
                <CardHeader className="border-b py-4">
                  <CardTitle className="text-sm">Más vendidos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {products.data.masVendidos.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Sin ventas registradas.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Ventas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.data.masVendidos.map((product) => (
                          <TableRow key={product.productoId}>
                            <TableCell className="font-medium">{product.producto}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {product.categoria}
                            </TableCell>
                            <TableCell className="text-right">{product.cantidad}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(product.ventas, CURRENCY)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 py-0">
                <CardHeader className="border-b py-4">
                  <CardTitle className="text-sm">Ventas por categoría</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {products.data.porCategoria.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Sin datos para el periodo.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Ventas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.data.porCategoria.map((category) => (
                          <TableRow key={category.categoriaId}>
                            <TableCell className="font-medium">{category.categoria}</TableCell>
                            <TableCell className="text-right">{category.cantidad}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(category.ventas, CURRENCY)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 py-0 xl:col-span-2">
                <CardHeader className="border-b py-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    Todos los productos
                    <Badge variant="outline">{formatNumber(products.data.productos.length)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {products.data.productos.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Sin productos vendidos.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Ventas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.data.productos.map((product) => (
                          <TableRow key={product.productoId}>
                            <TableCell className="font-medium">{product.producto}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {product.categoria}
                            </TableCell>
                            <TableCell className="text-right">{product.cantidad}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(product.ventas, CURRENCY)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">
          <RefreshCw className="size-3" /> Datos al consultar
        </Badge>
        <span>Las cuentas anuladas no se incluyen en las ventas.</span>
      </div>
    </div>
  );
}
