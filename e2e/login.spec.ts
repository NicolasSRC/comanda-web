import { expect, test } from '@playwright/test';

test('redirige al login cuando no hay sesión', async ({ page }) => {
  await page.goto('/app/mesas');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
});

test('valida el formulario de acceso', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/correo/i).fill('');
  await page.getByLabel(/contraseña/i).fill('');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page.getByText('Escribe tu correo')).toBeVisible();
  await expect(page.getByText('Escribe tu contraseña')).toBeVisible();
});

test('carga las credenciales de demostración', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: /^cajero/i }).click();

  await expect(page.getByLabel(/correo/i)).toHaveValue('cajero@demo.com');
  await expect(page.getByLabel(/contraseña/i)).toHaveValue('Cajero123!');
});
