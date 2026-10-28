import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';
import { LoginPage } from './login-page';

vi.mock('@/hooks/use-auth', () => ({
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  });

  it('muestra los errores de validación con campos vacíos', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.clear(screen.getByRole('textbox', { name: /correo/i }));
    await user.clear(screen.getByLabelText(/contraseña/i));
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Escribe tu correo')).toBeInTheDocument();
    expect(await screen.findByText('Escribe tu contraseña')).toBeInTheDocument();
  });

  it('rellena las credenciales de las cuentas demo', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /^mesero/i }));

    expect(screen.getByRole('textbox', { name: /correo/i })).toHaveValue('mesero@demo.com');
    expect(screen.getByLabelText(/contraseña/i)).toHaveValue('Mesero123!');
  });
});
