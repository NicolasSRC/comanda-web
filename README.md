# Comanda Web

Panel operativo y carta pública de **Comanda**, una plataforma multi-restaurante para gestionar mesas, pedidos, cocina/barra, caja y reportes.

Este repositorio contiene únicamente el frontend. La API vive en
[`NicolasSRC/comanda-api`](https://github.com/NicolasSRC/comanda-api).

- **Stack:** React 19 + TypeScript + Vite 8
- **UI:** Tailwind CSS 4 + componentes shadcn/ui (Radix)
- **Datos:** TanStack Query 5
- **Formularios:** React Hook Form + Zod
- **Estado global:** Zustand (sesión y borrador de pedido)
- **Rutas:** React Router 7
- **Tiempo real:** Server-Sent Events (SSE)
- **Pruebas:** Vitest + Testing Library + Playwright

---

## Características

| Módulo | Qué permite |
| ------ | ----------- |
| **Carta pública** (`/` y `/:slug`) | Consultar la carta publicada, filtrar por categoría, ver detalle, variantes, modificadores, alérgenos y disponibilidad. No requiere sesión. |
| **Inicio de sesión** (`/login`) | Autenticación con correo y contraseña, persistencia de sesión y redirección por rol. |
| **Mesas** (`/app/mesas`) | Ver zonas y estado de mesas, abrir mesa con comensales y mesero, entrar al pedido abierto. |
| **Pedido** (`/app/pedidos/:orderId`) | Agregar productos, elegir variante y modificadores, editar cantidades, cancelar ítems con motivo y seguir el estado de cada línea. |
| **Cocina y barra** (`/app/cocina`) | Cola por área, filtros por estado, tiempos transcurridos, alertas de demora y avance `PENDING → IN_PREPARATION → READY`. |
| **Caja** (`/app/caja`) | Buscar cuenta por mesa, aplicar descuentos y propina, registrar pagos, dividir la cuenta, cerrar, anular y ver/imprimir el recibo. |
| **Reportes** (`/app/reportes`) | Ventas por día/semana/mes, caja por método de pago y productos más vendidos, con rango de fechas, presets y descarga CSV. |

La interfaz está en español y usa **actualización en vivo** para que mesas, pedidos y colas reflejen los cambios de otros usuarios sin recargar.

---

## Requisitos

- Node.js 22 o superior
- npm 10 o superior
- La API de Comanda disponible (por defecto en `http://localhost:3000`)

Para levantar la API:

```bash
git clone https://github.com/NicolasSRC/comanda-api.git
cd comanda-api
npm install
cp .env.example .env
docker compose up --build
# o, sin Docker:
# npx prisma migrate dev && npm run db:seed && npm run start:dev
```

La API aplica migraciones y carga el restaurante demo (`demo`) con usuarios de prueba.

---

## Inicio rápido

```bash
npm install
cp .env.example .env
npm run dev
```

Abre <http://localhost:5173>.

En desarrollo, Vite redirige `/api/*` a `http://localhost:3000` y elimina el prefijo, de modo que no hace falta configurar CORS ni una URL absoluta.

### Variables de entorno

| Variable | Obligatoria | Descripción |
| -------- | ----------- | ----------- |
| `VITE_API_URL` | No | URL base de la API **sin** `/api`. Si se deja vacía, se usa el proxy de Vite y el prefijo `/api`. En producción debe apuntar a la API, por ejemplo `https://api.midominio.com`. |
| `VITE_RESTAURANT_SLUG` | No | Slug de la carta pública que se muestra en `/`. Por defecto `demo`. |

Ejemplo para producción:

```env
VITE_API_URL=https://api.midominio.com
VITE_RESTAURANT_SLUG=mi-restaurante
```

> `VITE_*` se inserta en tiempo de compilación. Si cambias estos valores, vuelve a ejecutar `npm run build`.

---

## Roles y rutas

| Ruta | Roles | Descripción |
| ---- | ----- | ----------- |
| `/` | Público | Carta del restaurante configurado en `VITE_RESTAURANT_SLUG`. |
| `/:slug` | Público | Carta de un restaurante concreto; permite compartir el enlace directo. |
| `/login` | Público | Inicio de sesión. |
| `/app` | Autenticado | Redirige al inicio correspondiente al rol. |
| `/app/mesas` | `ADMIN`, `WAITER` | Mapa de mesas y apertura de pedidos. |
| `/app/pedidos/:orderId` | `ADMIN`, `WAITER` | Detalle y edición de un pedido abierto. |
| `/app/cocina` | `ADMIN`, `KITCHEN` | Cola de cocina y barra. |
| `/app/caja` | `ADMIN`, `CASHIER` | Cobro y cierre de cuentas. |
| `/app/reportes` | `ADMIN` | Reportes y exportación CSV. |
| `/app/sin-acceso` | Autenticado | Pantalla para roles sin módulo asignado. |

Rutas protegidas:

- `ProtectedRoute` exige sesión y redirige a `/login` conservando el destino.
- `RequireRoles` muestra la pantalla de acceso denegado si el rol no corresponde.
- Al iniciar sesión, cada rol va a su módulo por defecto:
  - `ADMIN` y `WAITER` → mesas
  - `KITCHEN` → cocina
  - `CASHIER` → caja
  - otros → sin acceso

### Usuarios demo

| Rol | Correo | Contraseña |
| --- | ------ | ---------- |
| Administrador | `admin@demo.com` | `Admin123!` |
| Mesero | `mesero@demo.com` | `Mesero123!` |
| Cocina | `cocina@demo.com` | `Cocina123!` |
| Cajero | `cajero@demo.com` | `Cajero123!` |

> Solo para desarrollo. La API demo debe estar sembrada con el restaurante `demo`.

---

## Arquitectura

```text
src/
├─ components/
│  ├─ cashier/      # Panel de cuenta y diálogos de pago/descuento/división
│  ├─ layout/       # Shell, navegación y guards de ruta
│  ├─ menu/         # Detalle de producto de la carta pública
│  ├─ orders/       # Selector de productos, carrito y cancelación
│  ├─ shared/       # Feedback, estados y diálogos reutilizables
│  ├─ tables/       # Apertura de mesa
│  └─ ui/           # Componentes base shadcn/ui
├─ hooks/           # Consultas y mutaciones por dominio
├─ lib/             # Cliente HTTP, formato, estados y utilidades
├─ pages/           # Pantallas por ruta
├─ schemas/         # Esquemas Zod de formularios
├─ stores/          # Zustand: sesión y borrador de pedido
├─ types/           # Contratos TypeScript de la API
├─ App.tsx          # Rutas
└─ main.tsx         # Providers, router y notificaciones
```

### Cliente HTTP

`src/lib/api.ts` centraliza las peticiones:

- Añade `Authorization: Bearer <accessToken>`.
- Ante un `401`, intenta **una sola vez** `POST /auth/refresh`; si falla, limpia la sesión.
- Comparte la promesa de refresh entre peticiones concurrentes para no rotar el token dos veces.
- Normaliza los errores de la API (`message` puede ser string o array).
- Expone `downloadFile` para CSV y recibos.

### Sesión

La sesión se guarda en Zustand con `persist` bajo la clave `comanda.auth`. Incluye access token, refresh token y usuario. Al cerrar sesión se llama a `POST /auth/logout` y se limpia el estado local.

### Dinero y porcentajes

- Todos los importes llegan como **enteros en la unidad mínima** de la moneda.
- Los porcentajes llegan en **puntos base**: `10000 = 100 %`.
- `src/lib/format.ts` formatea moneda, números y tiempos; no se hacen cálculos monetarios en el navegador más allá de mostrar valores de la API.

---

## Tiempo real (SSE)

La API expone `GET /eventos/pedidos?token=<accessToken>`. `EventSource` no permite enviar el encabezado `Authorization`, por eso el token viaja en la query y la API lo valida como un access token normal.

`src/hooks/use-realtime.ts` se suscribe mientras haya sesión y escucha:

| Evento | Cuándo se emite |
| ------ | --------------- |
| `order.opened` | Se abre una mesa o se crea un pedido. |
| `items.created` | Se agregan ítems a un pedido. |
| `item.updated` | Cambia el estado de un ítem o se cancela. |
| `order.updated` | Se mueve/une un pedido o se cierra/anula la cuenta. |
| `ping` | Latido cada 25 s para mantener viva la conexión. |

Cada evento invalida las consultas de TanStack Query (`tables`, `order`, `queue`, `account`), que se vuelven a pedir a la API. Si SSE no está disponible, las pantallas siguen funcionando con **polling** y refresco manual.

La API filtra los eventos por `restaurantId`, por lo que un cliente solo recibe cambios de su restaurante.

---

## Scripts

| Comando | Descripción |
| ------- | ----------- |
| `npm run dev` | Servidor de desarrollo en <http://localhost:5173>. |
| `npm run build` | Typecheck y compilación de producción en `dist/`. |
| `npm run preview` | Sirve el build en <http://localhost:4173>. |
| `npm run typecheck` | TypeScript sin emitir archivos. |
| `npm run lint` | ESLint. |
| `npm test` | Pruebas unitarias y de componentes con Vitest. |
| `npm run test:watch` | Vitest en modo interactivo. |
| `npm run test:cov` | Vitest con cobertura. |
| `npm run test:e2e` | Playwright contra la app en `http://localhost:5173`. |
| `npm run test:e2e:install` | Instala Chromium para Playwright. |

### Pruebas

```bash
npm test
npm run test:e2e:install   # solo la primera vez
npm run test:e2e
```

Las **18 pruebas unitarias** cubren utilidades de formato, esquemas Zod, el store de sesión, componentes base y el formulario de login. Las **5 pruebas e2e** cubren la carta pública y el flujo de autenticación.

Playwright levanta `npm run dev` automáticamente. Para probar contra otra URL:

```bash
$env:E2E_BASE_URL="https://staging.midominio.com"
npm run test:e2e
```

---

## Build y despliegue

```bash
npm run build
```

El resultado queda en `dist/`. Es una SPA, así que el servidor debe devolver `index.html` para cualquier ruta desconocida (fallback). Ejemplos:

- **Nginx:** `try_files $uri $uri/ /index.html;`
- **Vercel/Netlify:** rewrite comodín a `/index.html`.
- **Docker:** sirve `dist/` con Nginx.

Configura `VITE_API_URL` apuntando a la API pública y asegúrate de que la API permita el origen del frontend en `CORS_ORIGINS`.

Si frontend y API comparten dominio, puedes publicar la API bajo `/api` y dejar `VITE_API_URL` vacío; el cliente usará rutas relativas.

---

## Relación con la API

| Necesidad | Endpoint principal |
| --------- | ------------------ |
| Carta pública | `GET /publico/:slug/carta` |
| Sesión | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Mesas | `GET /mesas`, `GET /mesas/:id`, `POST /mesas/:id/abrir` |
| Pedidos | `GET/POST /pedidos`, `GET /pedidos/:id`, `POST /pedidos/:id/items`, `PATCH /pedidos/:id/items/:itemId/estado`, `POST /pedidos/:id/items/:itemId/cancelar` |
| Cocina y barra | `GET /areas/:area/items-pendientes` |
| Cuentas | `GET /cuentas`, `GET /cuentas/:id`, `POST /cuentas/:id/descuentos`, `POST /cuentas/:id/propina`, `POST /cuentas/:id/pagos`, `POST /cuentas/:id/divisiones`, `POST /cuentas/:id/cerrar`, `POST /cuentas/:id/anular` |
| Reportes | `GET /reportes/ventas`, `GET /reportes/ventas.csv`, `GET /reportes/caja`, `GET /reportes/productos` |
| Tiempo real | `GET /eventos/pedidos?token=` |

La documentación completa de la API (endpoints, roles, reglas de negocio y Swagger) está en el [README de comanda-api](https://github.com/NicolasSRC/comanda-api#readme).
