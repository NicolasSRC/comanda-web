import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionResponse } from '@/types/api';
import { defaultRouteForRole, useAuthStore } from './auth-store';

const session: SessionResponse = {
  accessToken: 'access-token',
  expiresIn: 900,
  refreshToken: 'refresh-token',
  refreshExpiresAt: '2026-11-28T00:00:00.000Z',
  user: {
    id: 'user-1',
    email: 'admin@demo.com',
    fullName: 'Ana Admin',
    role: 'ADMIN',
    restaurantId: 'restaurant-1',
    restaurant: { id: 'restaurant-1', name: 'Demo', slug: 'demo' },
  },
};

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  });

  it('guarda la sesión y la limpia al cerrar sesión', () => {
    useAuthStore.getState().setSession(session);

    expect(useAuthStore.getState().accessToken).toBe('access-token');
    expect(useAuthStore.getState().user?.role).toBe('ADMIN');

    useAuthStore.getState().clear();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('evalúa roles con hasRole', () => {
    useAuthStore.getState().setSession(session);

    expect(useAuthStore.getState().hasRole('ADMIN', 'CASHIER')).toBe(true);
    expect(useAuthStore.getState().hasRole('WAITER')).toBe(false);
  });

  it('redirige a cada rol a su pantalla inicial', () => {
    expect(defaultRouteForRole('ADMIN')).toBe('/app/mesas');
    expect(defaultRouteForRole('WAITER')).toBe('/app/mesas');
    expect(defaultRouteForRole('KITCHEN')).toBe('/app/cocina');
    expect(defaultRouteForRole('CASHIER')).toBe('/app/caja');
    expect(defaultRouteForRole(undefined)).toBe('/app/sin-acceso');
  });
});
