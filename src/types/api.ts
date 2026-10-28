export type Role = 'SUPERADMIN' | 'ADMIN' | 'WAITER' | 'KITCHEN' | 'CASHIER';
export type PreparationArea = 'KITCHEN' | 'BAR';
export type TableStatus = 'FREE' | 'OCCUPIED' | 'TO_CHARGE';
export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'IN_PREPARATION' | 'READY' | 'SERVED' | 'CANCELLED';
export type AccountStatus = 'OPEN' | 'CLOSED' | 'VOIDED';
export type DiscountScope = 'ITEM' | 'ACCOUNT';
export type DiscountType = 'PERCENT' | 'FIXED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';
export type ReportGrouping = 'DIA' | 'SEMANA' | 'MES';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  restaurantId: string | null;
  restaurant: RestaurantSummary | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: string;
  user: User;
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface PublicVariant {
  id: string;
  nombre: string;
  precio: number;
}

export interface PublicModifier {
  id: string;
  nombre: string;
  precioExtra: number;
}

export interface PublicModifierGroup {
  id: string;
  nombre: string;
  obligatorio: boolean;
  minimo: number;
  maximo: number;
  modificadores: PublicModifier[];
}

export interface PublicProduct {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  disponible: boolean;
  area: PreparationArea;
  variantes: PublicVariant[];
  gruposModificadores: PublicModifierGroup[];
}

export interface PublicCategory {
  id: string;
  nombre: string;
  orden: number;
  productos: PublicProduct[];
}

export interface PublicCombo {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen: string | null;
  items: Array<{
    productoId: string;
    producto: string;
    variante: string | null;
    cantidad: number;
  }>;
}

export interface PublicMenu {
  restaurante: {
    nombre: string;
    slug: string;
    moneda: string;
    zonaHoraria: string;
  };
  version: {
    id: string;
    publicadaEn: string;
    estado: string;
  };
  categorias: PublicCategory[];
  combos: PublicCombo[];
}

export interface Zone {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { tables: number };
}

export interface TableSummary {
  id: string;
  restaurantId: string;
  zoneId: string;
  name: string;
  capacity: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
  zone: { id: string; name: string; isActive: boolean };
  orders: Array<{
    id: string;
    status: OrderStatus;
    guests: number;
    openedAt: string;
    waiterId: string;
  }>;
}

export interface OrderItemModifier {
  id: string;
  orderItemId: string;
  modifierId: string;
  nameSnapshot: string;
  extraPrice: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  restaurantId: string;
  productId: string;
  variantId: string | null;
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  modifiersTotal: number;
  lineTotal: number;
  notes: string | null;
  preparationArea: PreparationArea;
  status: OrderItemStatus;
  sentAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  cancelledAt: string | null;
  cancelledById: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  preparationSeconds: number | null;
  modifiers: OrderItemModifier[];
  cancelledBy?: { id: string; fullName: string } | null;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  guests: number;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  total: number;
  table: {
    id: string;
    name: string;
    capacity: number;
    status: TableStatus;
    zone: { id: string; name: string };
  };
  waiter: { id: string; fullName: string; email: string };
  items: OrderItem[];
}

export interface OrderListItem {
  id: string;
  restaurantId: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  guests: number;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  table: {
    id: string;
    name: string;
    status: TableStatus;
    zone: { id: string; name: string };
  };
  waiter: { id: string; fullName: string };
  _count: { items: number };
}

export interface QueueItem extends OrderItem {
  order: {
    id: string;
    guests: number;
    openedAt: string;
    table: {
      id: string;
      name: string;
      zone: { id: string; name: string };
    };
    waiter: { id: string; fullName: string };
  };
}

export interface AccountLine {
  itemId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  descuento: number;
  neto: number;
}

export interface AccountDiscount {
  id: string;
  itemId: string | null;
  itemNombre: string | null;
  alcance: DiscountScope;
  tipo: DiscountType;
  valor: number;
  motivo: string;
  aplicadoPor: { id: string; fullName: string };
  aprobadoPor: { id: string; fullName: string } | null;
  aprobado: boolean;
  creadoEn: string;
}

export interface AccountPayment {
  id: string;
  metodo: PaymentMethod;
  monto: number;
  referencia: string | null;
  divisionId: string | null;
  division: string | null;
  recibidoPor: { id: string; fullName: string };
  creadoEn: string;
}

export interface AccountSplit {
  id: string;
  etiqueta: string;
  monto: number;
  items: Array<{
    itemId: string;
    nombre: string;
    cantidad: number;
    monto: number;
  }>;
}

export interface Account {
  id: string;
  estado: AccountStatus;
  mesaId: string;
  mesa: string;
  zona: string;
  pedidoId: string;
  comensales: number;
  abiertaEn: string;
  cerradaEn: string | null;
  anuladaEn: string | null;
  motivoAnulacion: string | null;
  abiertaPor: { id: string; fullName: string };
  cerradaPor: { id: string; fullName: string } | null;
  anuladaPor: { id: string; fullName: string } | null;
  subtotal: number;
  descuentos: number;
  impuestos: number;
  propina: number;
  total: number;
  pagado: number;
  saldo: number;
  propinaBps: number;
  propinaSugeridaBps: number;
  propinaHabilitada: boolean;
  preciosIncluyenImpuesto: boolean;
  lineas: AccountLine[];
  impuestosDetalle: Array<{ id: string; nombre: string; tasaBps: number; monto: number }>;
  descuentosDetalle: AccountDiscount[];
  pagos: AccountPayment[];
  divisiones: AccountSplit[];
}

export interface SalesPeriod {
  periodo: string;
  pedidos: number;
  comensales: number;
  subtotal: number;
  descuentos: number;
  impuestos: number;
  propina: number;
  total: number;
  ticketPromedio: number;
}

export interface SalesReport {
  desde: string;
  hasta: string;
  agrupacion: ReportGrouping;
  periodos: SalesPeriod[];
  totales: Omit<SalesPeriod, 'periodo'>;
}

export interface CashMethodTotal {
  metodo: PaymentMethod;
  pagos: number;
  total: number;
}

export interface CashReport {
  desde: string;
  hasta: string;
  porMetodo: CashMethodTotal[];
  porDia: Array<{
    fecha: string;
    metodos: CashMethodTotal[];
    total: number;
  }>;
  totales: { pagos: number; total: number };
}

export interface ProductSales {
  productoId: string;
  producto: string;
  categoriaId: string;
  categoria: string;
  cantidad: number;
  ventas: number;
}

export interface ProductsReport {
  desde: string;
  hasta: string;
  productos: ProductSales[];
  masVendidos: ProductSales[];
  menosVendidos: ProductSales[];
  porCategoria: Array<{
    categoriaId: string;
    categoria: string;
    cantidad: number;
    ventas: number;
  }>;
}

export interface CartModifier {
  id: string;
  name: string;
  extraPrice: number;
  quantity: number;
}

export interface CartLine {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  modifiers: CartModifier[];
  notes: string;
  area: PreparationArea;
}
