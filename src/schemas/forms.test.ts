import { describe, expect, it } from 'vitest';
import { discountSchema, loginSchema, paymentSchema, splitSchema } from './forms';

describe('esquemas de formularios', () => {
  it('acepta credenciales válidas', () => {
    const result = loginSchema.safeParse({
      email: 'admin@demo.com',
      password: 'Admin123!',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza correos inválidos y contraseñas vacías', () => {
    const result = loginSchema.safeParse({ email: 'no-es-correo', password: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    }
  });

  it('exige montos enteros y positivos en los pagos', () => {
    expect(paymentSchema.safeParse({ metodo: 'CASH', monto: 18000 }).success).toBe(true);
    expect(paymentSchema.safeParse({ metodo: 'CASH', monto: 12.5 }).success).toBe(false);
    expect(paymentSchema.safeParse({ metodo: 'CASH', monto: 0 }).success).toBe(false);
  });

  it('valida descuentos por ítem y su porcentaje máximo', () => {
    const missingItem = discountSchema.safeParse({
      alcance: 'ITEM',
      tipo: 'PERCENT',
      valor: 10,
      motivo: 'Cortesía',
    });
    const validItem = discountSchema.safeParse({
      alcance: 'ITEM',
      tipo: 'FIXED',
      valor: 5000,
      itemId: 'item-1',
      motivo: 'Cortesía',
    });
    const tooHigh = discountSchema.safeParse({
      alcance: 'ACCOUNT',
      tipo: 'PERCENT',
      valor: 120,
      motivo: 'Cortesía',
    });

    expect(missingItem.success).toBe(false);
    expect(validItem.success).toBe(true);
    expect(tooHigh.success).toBe(false);
  });

  it('requiere al menos dos comensales para dividir la cuenta', () => {
    expect(splitSchema.safeParse({ comensales: 1 }).success).toBe(false);
    expect(splitSchema.safeParse({ comensales: 3 }).success).toBe(true);
  });
});
