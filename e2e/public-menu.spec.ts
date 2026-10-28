import { expect, test } from '@playwright/test';

const menu = {
  restaurante: {
    nombre: 'Demo Restaurante',
    slug: 'demo',
    moneda: 'COP',
    zonaHoraria: 'America/Bogota',
  },
  version: {
    id: 'version-1',
    publicadaEn: '2026-10-01T12:00:00.000Z',
    estado: 'PUBLISHED',
  },
  categorias: [
    {
      id: 'category-1',
      nombre: 'Platos fuertes',
      orden: 1,
      productos: [
        {
          id: 'product-1',
          nombre: 'Pizza Margarita',
          descripcion: 'Tomate, albahaca y mozzarella.',
          precio: 18000,
          imagen: null,
          disponible: true,
          area: 'KITCHEN',
          variantes: [],
          gruposModificadores: [],
        },
      ],
    },
  ],
  combos: [],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/publico/demo/carta', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: menu }),
  );
});

test('muestra la carta pública con categorías y productos', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Demo Restaurante' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Platos fuertes' })).toBeVisible();
  await expect(page.getByText('Pizza Margarita')).toBeVisible();
  await expect(page.getByText(/18\.000/)).toBeVisible();
});

test('abre el detalle de un producto', async ({ page }) => {
  await page.goto('/');

  await page.getByText('Pizza Margarita').click();

  await expect(page.getByRole('dialog')).toBeVisible();
});
