import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, SessionResponse, User } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (session: SessionResponse) => void;
  updateSession: (session: SessionResponse) => void;
  clear: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        }),
      updateSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      hasRole: (...roles) => {
        const role = get().user?.role;
        return Boolean(role && roles.includes(role));
      },
    }),
    {
      name: 'comanda.auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

export function defaultRouteForRole(role: Role | undefined): string {
  switch (role) {
    case 'WAITER':
    case 'ADMIN':
      return '/app/mesas';
    case 'KITCHEN':
      return '/app/cocina';
    case 'CASHIER':
      return '/app/caja';
    default:
      return '/app/sin-acceso';
  }
}
