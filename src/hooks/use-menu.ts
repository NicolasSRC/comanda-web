import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PublicMenu } from '@/types/api';

export function usePublicMenu(slug: string) {
  return useQuery({
    queryKey: ['menu', slug],
    queryFn: () => apiFetch<PublicMenu>(`/publico/${encodeURIComponent(slug)}/carta`),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 1,
  });
}
