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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOpenTable } from '@/hooks/use-tables';
import { errorMessage } from '@/lib/api';
import { openTableSchema, type OpenTableValues } from '@/schemas/forms';
import type { TableSummary } from '@/types/api';

export function OpenTableDialog({
  table,
  onOpenChange,
  onOpened,
}: {
  table: TableSummary | null;
  onOpenChange: (open: boolean) => void;
  onOpened: (table: TableSummary, orderId: string) => void;
}) {
  const openTable = useOpenTable();
  const form = useForm<OpenTableValues>({
    resolver: zodResolver(openTableSchema),
    defaultValues: { comensales: 2, notas: '' },
  });

  useEffect(() => {
    if (table) {
      form.reset({ comensales: Math.min(2, table.capacity), notas: '' });
    }
  }, [form, table]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!table) return;

    try {
      const order = await openTable.mutateAsync({
        tableId: table.id,
        comensales: values.comensales,
        notas: values.notas?.trim() || undefined,
      });
      toast.success(`${table.name} abierta con ${values.comensales} comensales`);
      onOpenChange(false);
      onOpened(table, order.id);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={Boolean(table)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir {table?.name}</DialogTitle>
          <DialogDescription>
            {table?.zone.name} · capacidad para {table?.capacity} personas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="comensales">Comensales</Label>
            <Input
              id="comensales"
              type="number"
              min={1}
              max={99}
              aria-invalid={Boolean(form.formState.errors.comensales)}
              {...form.register('comensales', { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.comensales?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              rows={3}
              placeholder="Cumpleaños, silla para bebé, alergias…"
              {...form.register('notas')}
            />
            <FieldError message={form.formState.errors.notas?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={openTable.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={openTable.isPending}>
              {openTable.isPending ? 'Abriendo…' : 'Abrir mesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
