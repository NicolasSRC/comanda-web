import type {
  AccountStatus,
  OrderItemStatus,
  PaymentMethod,
  Role,
  TableStatus,
} from '@/types/api';
import { cn } from '@/lib/utils';
import {
  accountStatusLabels,
  itemStatusLabels,
  itemStatusStyles,
  paymentMethodLabels,
  roleLabels,
  tableStatusLabels,
  tableStatusStyles,
} from '@/lib/status';

export function ItemStatusBadge({ status }: { status: OrderItemStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        itemStatusStyles[status],
      )}
    >
      {itemStatusLabels[status]}
    </span>
  );
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tableStatusStyles[status],
      )}
    >
      {tableStatusLabels[status]}
    </span>
  );
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        status === 'OPEN' && 'border-amber-200 bg-amber-50 text-amber-800',
        status === 'CLOSED' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        status === 'VOIDED' && 'border-rose-200 bg-rose-50 text-rose-700',
      )}
    >
      {accountStatusLabels[status]}
    </span>
  );
}

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
      {paymentMethodLabels[method]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {roleLabels[role]}
    </span>
  );
}
