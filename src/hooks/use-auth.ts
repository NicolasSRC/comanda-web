import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { SessionResponse } from '@/types/api';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (values: { email: string; password: string }) =>
      apiFetch<SessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
        retryOnUnauthorized: false,
      }),
    onSuccess: (session) => setSession(session),
  });
}

export function useLogout() {
  const clear = useAuthStore((state) => state.clear);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          retryOnUnauthorized: false,
        }).catch(() => undefined);
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}
