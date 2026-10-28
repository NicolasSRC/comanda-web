import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Order, OrderItem, OrderItemStatus } from '@/types/api';

export interface AddOrderItemPayload {
  productoId: string;
  varianteId?: string;
  cantidad: number;
  modificadores?: Array<{ modificadorId: string; cantidad: number }>;
  notas?: string;
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiFetch<Order>(`/pedidos/${orderId}`),
    enabled: Boolean(orderId),
    refetchInterval: 20_000,
  });
}

export function useAddOrderItems(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: AddOrderItemPayload[]) =>
      apiFetch<Order>(`/pedidos/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['account'] });
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useChangeItemStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: OrderItemStatus }) =>
      apiFetch<OrderItem>(`/pedidos/${orderId}/items/${itemId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
      void queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}

export function useCancelItem(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, motivo }: { itemId: string; motivo: string }) =>
      apiFetch<OrderItem>(`/pedidos/${orderId}/items/${itemId}/cancelar`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
      void queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}
