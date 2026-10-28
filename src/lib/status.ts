import type {
  AccountStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  PreparationArea,
  Role,
  TableStatus,
} from '@/types/api';

export const roleLabels: Record<Role, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Administrador',
  WAITER: 'Mesero',
  KITCHEN: 'Cocina',
  CASHIER: 'Cajero',
};

export const itemStatusLabels: Record<OrderItemStatus, string> = {
  PENDING: 'Pendiente',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  SERVED: 'Servido',
  CANCELLED: 'Cancelado',
};

export const itemStatusStyles: Record<OrderItemStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  IN_PREPARATION: 'border-sky-200 bg-sky-50 text-sky-800',
  READY: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  SERVED: 'border-slate-200 bg-slate-100 text-slate-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
};

export const tableStatusLabels: Record<TableStatus, string> = {
  FREE: 'Libre',
  OCCUPIED: 'Ocupada',
  TO_CHARGE: 'Por cobrar',
};

export const tableStatusStyles: Record<TableStatus, string> = {
  FREE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  OCCUPIED: 'border-amber-200 bg-amber-50 text-amber-800',
  TO_CHARGE: 'border-sky-200 bg-sky-50 text-sky-800',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export const accountStatusLabels: Record<AccountStatus, string> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
  VOIDED: 'Anulada',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

export const areaLabels: Record<PreparationArea, string> = {
  KITCHEN: 'Cocina',
  BAR: 'Barra',
};

export const discountScopeLabels = {
  ACCOUNT: 'Toda la cuenta',
  ITEM: 'Un ítem',
} as const;

export const discountTypeLabels = {
  PERCENT: 'Porcentaje',
  FIXED: 'Valor fijo',
} as const;
