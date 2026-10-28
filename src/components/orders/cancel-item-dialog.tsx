import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCancelItem } from '@/hooks/use-orders';
import { errorMessage } from '@/lib/api';
import { cancelItemSchema, type CancelItemValues } from '@/schemas/forms';
import type { OrderItem } from '@/types/api';

export function CancelItemDialog({
  orderId,
  item,
  onOpenChange,
}: {
  orderId: string;
  item: OrderItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const cancelItem = useCancelItem(orderId);
  const form = useForm<CancelItemValues>({
    resolver: zodResolver(cancelItemSchema),
    defaultValues: { motivo: '' },
  });

  useEffect(() => {
    if (item) form.reset({ motivo: '' });
  }, [form, item]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!item) return;

    try {
      await cancelItem.mutateAsync({ itemId: item.id, motivo: values.motivo });
      toast.success('Ítem cancelado');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar «{item?.productNameSnapshot}»</DialogTitle>
          <DialogDescription>
            La cancelación queda registrada con tu usuario, la fecha y el motivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              rows={3}
              maxLength={300}
              placeholder="El cliente cambió de opinión…"
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
              disabled={cancelItem.isPending}
            >
              Volver
            </Button>
            <Button type="submit" variant="destructive" disabled={cancelItem.isPending}>
              {cancelItem.isPending ? 'Cancelando…' : 'Cancelar ítem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
