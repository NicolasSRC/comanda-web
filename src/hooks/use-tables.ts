import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Order, Paginated, TableSummary, Zone } from '@/types/api';

export function useZones(enabled = true) {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => apiFetch<Paginated<Zone>>('/zonas?limit=100'),
    staleTime: 60_000,
    enabled,
  });
}

export function useTables(zoneId?: string) {
  return useQuery({
    queryKey: ['tables', { zoneId: zoneId ?? 'all' }],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '100' });
      if (zoneId) params.set('zoneId', zoneId);
      return apiFetch<Paginated<TableSummary>>(`/mesas?${params.toString()}`);
    },
    refetchInterval: 20_000,
  });
}

export function useOpenTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tableId,
      comensales,
      notas,
    }: {
      tableId: string;
      comensales: number;
      notas?: string;
    }) =>
      apiFetch<Order>(`/mesas/${tableId}/abrir`, {
        method: 'POST',
        body: JSON.stringify({ comensales, ...(notas ? { notas } : {}) }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
