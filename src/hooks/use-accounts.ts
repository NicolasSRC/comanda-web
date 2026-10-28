import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  Account,
  DiscountScope,
  DiscountType,
  PaymentMethod,
} from '@/types/api';

function invalidateAccount(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['account'] });
  void queryClient.invalidateQueries({ queryKey: ['tables'] });
  void queryClient.invalidateQueries({ queryKey: ['order'] });
  void queryClient.invalidateQueries({ queryKey: ['reports'] });
}

export function useAccountByTable(tableId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['account', 'table', tableId],
    queryFn: () => apiFetch<Account>(`/cuentas?mesaId=${tableId}`),
    enabled: Boolean(tableId) && enabled,
    refetchInterval: 20_000,
    retry: false,
  });
}

export function useAccount(accountId: string | undefined) {
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: () => apiFetch<Account>(`/cuentas/${accountId}`),
    enabled: Boolean(accountId),
  });
}

export function useApplyDiscount(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: {
      alcance: DiscountScope;
      tipo: DiscountType;
      valor: number;
      itemId?: string;
      motivo: string;
    }) =>
      apiFetch<Account>(`/cuentas/${accountId}/descuentos`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => invalidateAccount(queryClient),
  });
}

export function useUpdateTip(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (porcentajeBps: number) =>
      apiFetch<Account>(`/cuentas/${accountId}/propina`, {
        method: 'POST',
        body: JSON.stringify({ porcentajeBps }),
      }),
    onSuccess: () => invalidateAccount(queryClient),
  });
}

export function useRegisterPayment(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: {
      metodo: PaymentMethod;
      monto: number;
      referencia?: string;
    }) =>
      apiFetch<Account>(`/cuentas/${accountId}/pagos`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => invalidateAccount(queryClient),
  });
}

export function useCreateSplit(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comensales: number) =>
      apiFetch<Account>(`/cuentas/${accountId}/divisiones`, {
        method: 'POST',
        body: JSON.stringify({ tipo: 'COMENSAL', comensales }),
      }),
    onSuccess: () => invalidateAccount(queryClient),
  });
}

export function useCloseAccount(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<Account>(`/cuentas/${accountId}/cerrar`, {
        method: 'POST',
      }),
    onSuccess: () => invalidateAccount(queryClient),
  });
}

export function useVoidAccount(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (motivo: string) =>
      apiFetch<Account>(`/cuentas/${accountId}/anular`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
      }),
    onSuccess: () => invalidateAccount(queryClient),
  });
}
