import { useQuery } from '@tanstack/react-query';
import { downloadFile, apiFetch } from '@/lib/api';
import type {
  CashReport,
  PaymentMethod,
  ProductsReport,
  ReportGrouping,
  SalesReport,
} from '@/types/api';

export interface ReportRange {
  desde: string;
  hasta: string;
}

export function useSalesReport(
  range: ReportRange,
  agrupacion: ReportGrouping,
  enabled = true,
) {
  const params = new URLSearchParams({ ...range, agrupacion });

  return useQuery({
    queryKey: ['reports', 'sales', range, agrupacion],
    queryFn: () => apiFetch<SalesReport>(`/reportes/ventas?${params.toString()}`),
    enabled,
  });
}

export function useCashReport(
  range: ReportRange,
  metodoPago?: PaymentMethod,
  enabled = true,
) {
  const params = new URLSearchParams({ desde: range.desde, hasta: range.hasta });
  if (metodoPago) params.set('metodoPago', metodoPago);

  return useQuery({
    queryKey: ['reports', 'cash', range, metodoPago ?? 'all'],
    queryFn: () => apiFetch<CashReport>(`/reportes/caja?${params.toString()}`),
    enabled,
  });
}

export function useProductsReport(range: ReportRange, enabled = true) {
  const params = new URLSearchParams({ ...range, limite: '10', orden: 'DESC' });

  return useQuery({
    queryKey: ['reports', 'products', range],
    queryFn: () => apiFetch<ProductsReport>(`/reportes/productos?${params.toString()}`),
    enabled,
  });
}

export async function downloadSalesCsv(
  range: ReportRange,
  agrupacion: ReportGrouping,
): Promise<void> {
  const params = new URLSearchParams({ ...range, agrupacion });
  const filename = `ventas-${range.desde}-${range.hasta}.csv`;
  await downloadFile(`/reportes/ventas.csv?${params.toString()}`, filename);
}
