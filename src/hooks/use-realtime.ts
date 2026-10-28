import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';

const rawBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const API_BASE = rawBase || '/api';

const WATCHED_EVENTS = ['order.opened', 'order.updated', 'items.created', 'item.updated'];

/**
 * Se suscribe a `GET /eventos/pedidos` (SSE). La autenticación va por query
 * porque `EventSource` no permite encabezados. Si el navegador pierde la
 * conexión, se reintenta solo y las consultas siguen refrescándose por polling.
 */
export function useRealtime(enabled: boolean): void {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const url = `${API_BASE}/eventos/pedidos?token=${encodeURIComponent(accessToken)}`;
    const source = new EventSource(url);

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
      void queryClient.invalidateQueries({ queryKey: ['order'] });
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['account'] });
    };

    for (const eventName of WATCHED_EVENTS) {
      source.addEventListener(eventName, refresh);
    }

    return () => {
      for (const eventName of WATCHED_EVENTS) {
        source.removeEventListener(eventName, refresh);
      }
      source.close();
    };
  }, [accessToken, enabled, queryClient]);
}
