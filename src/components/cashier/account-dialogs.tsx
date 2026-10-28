import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FieldError } from '@/components/shared/feedback';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useApplyDiscount,
  useCreateSplit,
  useRegisterPayment,
  useUpdateTip,
  useVoidAccount,
} from '@/hooks/use-accounts';
import { errorMessage } from '@/lib/api';
import { formatBps, formatMoney } from '@/lib/format';
import {
  discountSchema,
  paymentSchema,
  splitSchema,
  tipSchema,
  voidAccountSchema,
  type DiscountValues,
  type PaymentValues,
  type SplitValues,
  type TipValues,
  type VoidAccountValues,
} from '@/schemas/forms';
import type { Account } from '@/types/api';

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export function TipDialog({
  account,
  currency,
  open,
  onOpenChange,
}: {
  account: Account;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTip = useUpdateTip(account.id);
  const form = useForm<TipValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: { porcentaje: account.propinaBps / 100 },
  });

  useEffect(() => {
    if (open) form.reset({ porcentaje: account.propinaBps / 100 });
  }, [account.propinaBps, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateTip.mutateAsync(Math.round(values.porcentaje * 100));
      toast.success('Propina actualizada');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propina</DialogTitle>
          <DialogDescription>
            Sugerida: {formatBps(account.propinaSugeridaBps)}. Actual: {formatBps(account.propinaBps)}.
            El total es {formatMoney(account.total, currency)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="tip-percent">Porcentaje (%)</Label>
            <Input
              id="tip-percent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              aria-invalid={Boolean(form.formState.errors.porcentaje)}
              {...form.register('porcentaje', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.porcentaje?.message} />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={updateTip.isPending}
              onClick={() => {
                updateTip.mutate(0, {
                  onSuccess: () => {
                    toast.success('Propina retirada');
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                });
              }}
            >
              Quitar propina
            </Button>
            <Button type="submit" disabled={updateTip.isPending}>
              {updateTip.isPending ? 'Guardando…' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DiscountDialog({
  account,
  currency,
  open,
  onOpenChange,
}: {
  account: Account;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const applyDiscount = useApplyDiscount(account.id);
  const form = useForm<DiscountValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      alcance: 'ACCOUNT',
      tipo: 'PERCENT',
      valor: 10,
      itemId: account.lineas[0]?.itemId,
      motivo: '',
    },
  });
  const scope = useWatch({ control: form.control, name: 'alcance' });
  const type = useWatch({ control: form.control, name: 'tipo' });

  useEffect(() => {
    if (open) {
      form.reset({
        alcance: 'ACCOUNT',
        tipo: 'PERCENT',
        valor: 10,
        itemId: account.lineas[0]?.itemId,
        motivo: '',
      });
    }
  }, [account.lineas, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await applyDiscount.mutateAsync({
        alcance: values.alcance,
        tipo: values.tipo,
        valor:
          values.tipo === 'PERCENT' ? Math.round(values.valor * 100) : Math.round(values.valor),
        ...(values.alcance === 'ITEM' ? { itemId: values.itemId } : {}),
        motivo: values.motivo,
      });
      toast.success('Descuento aplicado');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar descuento</DialogTitle>
          <DialogDescription>
            El subtotal actual es {formatMoney(account.subtotal, currency)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount-scope">Alcance</Label>
              <select id="discount-scope" className={selectClassName} {...form.register('alcance')}>
                <option value="ACCOUNT">Toda la cuenta</option>
                <option value="ITEM">Un ítem</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-type">Tipo</Label>
              <select id="discount-type" className={selectClassName} {...form.register('tipo')}>
                <option value="PERCENT">Porcentaje</option>
                <option value="FIXED">Valor fijo</option>
              </select>
            </div>
          </div>

          {scope === 'ITEM' && (
            <div className="space-y-2">
              <Label htmlFor="discount-item">Ítem</Label>
              <select
                id="discount-item"
                className={selectClassName}
                {...form.register('itemId')}
              >
                {account.lineas.map((line) => (
                  <option key={line.itemId} value={line.itemId}>
                    {line.nombre} · {formatMoney(line.total, currency)}
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.itemId?.message} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="discount-value">
              {type === 'PERCENT' ? 'Porcentaje (%)' : `Valor (${currency})`}
            </Label>
            <Input
              id="discount-value"
              type="number"
              min={type === 'PERCENT' ? 0.01 : 1}
              max={type === 'PERCENT' ? 100 : undefined}
              step={type === 'PERCENT' ? '0.01' : '1'}
              aria-invalid={Boolean(form.formState.errors.valor)}
              {...form.register('valor', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.valor?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-reason">Motivo</Label>
            <Textarea
              id="discount-reason"
              rows={2}
              maxLength={300}
              placeholder="Cortesía del gerente…"
              aria-invalid={Boolean(form.formState.errors.motivo)}
              {...form.register('motivo')}
            />
            <FieldError message={form.formState.errors.motivo?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={applyDiscount.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={applyDiscount.isPending}>
              {applyDiscount.isPending ? 'Aplicando…' : 'Aplicar descuento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentDialog({
  account,
  currency,
  open,
  onOpenChange,
}: {
  account: Account;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const registerPayment = useRegisterPayment(account.id);
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { metodo: 'CASH', monto: account.saldo, referencia: '' },
  });

  useEffect(() => {
    if (open) form.reset({ metodo: 'CASH', monto: account.saldo, referencia: '' });
  }, [account.saldo, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerPayment.mutateAsync({
        metodo: values.metodo,
        monto: values.monto,
        ...(values.referencia?.trim() ? { referencia: values.referencia.trim() } : {}),
      });
      toast.success('Pago registrado');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Saldo pendiente: {formatMoney(account.saldo, currency)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método</Label>
            <select id="payment-method" className={selectClassName} {...form.register('metodo')}>
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Monto ({currency})</Label>
            <Input
              id="payment-amount"
              type="number"
              min={1}
              max={account.saldo}
              step="1"
              aria-invalid={Boolean(form.formState.errors.monto)}
              {...form.register('monto', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.monto?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">Referencia (opcional)</Label>
            <Input
              id="payment-reference"
              maxLength={120}
              placeholder="Aprobación 123456"
              {...form.register('referencia')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={registerPayment.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={registerPayment.isPending || account.saldo <= 0}>
              {registerPayment.isPending ? 'Registrando…' : 'Registrar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SplitDialog({
  account,
  currency,
  open,
  onOpenChange,
}: {
  account: Account;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createSplit = useCreateSplit(account.id);
  const form = useForm<SplitValues>({
    resolver: zodResolver(splitSchema),
    defaultValues: { comensales: Math.max(2, account.comensales) },
  });

  useEffect(() => {
    if (open) form.reset({ comensales: Math.max(2, account.comensales) });
  }, [account.comensales, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createSplit.mutateAsync(values.comensales);
      toast.success(`Cuenta dividida entre ${values.comensales} comensales`);
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dividir cuenta</DialogTitle>
          <DialogDescription>
            Se repartirá {formatMoney(account.total, currency)} entre los comensales, con ajuste de
            redondeo exacto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="split-count">Número de comensales</Label>
            <Input
              id="split-count"
              type="number"
              min={2}
              max={99}
              aria-invalid={Boolean(form.formState.errors.comensales)}
              {...form.register('comensales', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.comensales?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSplit.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createSplit.isPending}>
              {createSplit.isPending ? 'Dividiendo…' : 'Dividir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VoidAccountDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const voidAccount = useVoidAccount(account.id);
  const form = useForm<VoidAccountValues>({
    resolver: zodResolver(voidAccountSchema),
    defaultValues: { motivo: '' },
  });

  useEffect(() => {
    if (open) form.reset({ motivo: '' });
  }, [form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await voidAccount.mutateAsync(values.motivo);
      toast.success('Cuenta anulada');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular cuenta</DialogTitle>
          <DialogDescription>
            La anulación queda auditada y excluye la cuenta de los reportes de ventas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="void-reason">Motivo</Label>
            <Textarea
              id="void-reason"
              rows={3}
              maxLength={300}
              placeholder="Cobro duplicado…"
              aria-invalid={Boolean(form.formState.errors.motivo)}
              {...form.register('motivo')}
            />
            <FieldError message={form.formState.errors.motivo?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={voidAccount.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={voidAccount.isPending}>
              {voidAccount.isPending ? 'Anulando…' : 'Anular cuenta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
