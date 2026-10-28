import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  OrderItem,
  OrderItemStatus,
  Paginated,
  PreparationArea,
  QueueItem,
} from '@/types/api';

export function useKitchenQueue(area: PreparationArea, enabled = true) {
  return useQuery({
    queryKey: ['queue', area],
    queryFn: () =>
      apiFetch<Paginated<QueueItem>>(`/areas/${area}/items-pendientes?limit=100`),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useAdvanceQueueItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      status,
    }: {
      orderId: string;
      itemId: string;
      status: OrderItemStatus;
    }) =>
      apiFetch<OrderItem>(`/pedidos/${orderId}/items/${itemId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
      void queryClient.invalidateQueries({ queryKey: ['order'] });
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}
