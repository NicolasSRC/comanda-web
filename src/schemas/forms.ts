import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const openTableSchema = z.object({
  comensales: z
    .number({ message: 'Indica cuántos comensales hay' })
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 comensal')
    .max(99, 'Máximo 99 comensales'),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

export type OpenTableValues = z.infer<typeof openTableSchema>;

export const cancelItemSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(300, 'Máximo 300 caracteres'),
});

export type CancelItemValues = z.infer<typeof cancelItemSchema>;

export const discountSchema = z
  .object({
    alcance: z.enum(['ACCOUNT', 'ITEM']),
    tipo: z.enum(['PERCENT', 'FIXED']),
    valor: z.number({ message: 'Indica el valor del descuento' }).positive('El valor debe ser mayor que cero'),
    itemId: z.string().optional(),
    motivo: z
      .string()
      .trim()
      .min(3, 'El motivo debe tener al menos 3 caracteres')
      .max(300, 'Máximo 300 caracteres'),
  })
  .superRefine((values, context) => {
    if (values.alcance === 'ITEM' && !values.itemId) {
      context.addIssue({
        code: 'custom',
        path: ['itemId'],
        message: 'Selecciona el ítem que recibirá el descuento',
      });
    }
    if (values.tipo === 'PERCENT' && values.valor > 100) {
      context.addIssue({
        code: 'custom',
        path: ['valor'],
        message: 'El porcentaje no puede superar 100',
      });
    }
  });

export type DiscountValues = z.infer<typeof discountSchema>;

export const tipSchema = z.object({
  porcentaje: z
    .number({ message: 'Indica el porcentaje de propina' })
    .min(0, 'Mínimo 0 %')
    .max(100, 'Máximo 100 %'),
});

export type TipValues = z.infer<typeof tipSchema>;

export const paymentSchema = z.object({
  metodo: z.enum(['CASH', 'CARD', 'TRANSFER']),
  monto: z
    .number({ message: 'Indica el monto del pago' })
    .int('Usa un valor entero')
    .positive('El monto debe ser mayor que cero'),
  referencia: z.string().max(120, 'Máximo 120 caracteres').optional(),
});

export type PaymentValues = z.infer<typeof paymentSchema>;

export const splitSchema = z.object({
  comensales: z
    .number({ message: 'Indica el número de comensales' })
    .int('Debe ser un número entero')
    .min(2, 'Mínimo 2 comensales')
    .max(99, 'Máximo 99 comensales'),
});

export type SplitValues = z.infer<typeof splitSchema>;

export const voidAccountSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(300, 'Máximo 300 caracteres'),
});

export type VoidAccountValues = z.infer<typeof voidAccountSchema>;
