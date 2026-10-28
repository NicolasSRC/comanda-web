import { describe, expect, it } from 'vitest';
import { elapsedLabel, formatBps, formatDate, formatMoney, formatNumber, isoDate } from './format';

describe('format', () => {
  it('formatea montos enteros sin decimales', () => {
    const formatted = formatMoney(18000, 'COP');

    expect(formatted).toContain('18');
    expect(formatted).not.toContain(',00');
  });

  it('formatea números con separador de miles', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('convierte puntos base a porcentaje', () => {
    expect(formatBps(10000)).toBe('100 %');
    expect(formatBps(1250)).toBe('12,5 %');
  });

  it('calcula el tiempo transcurrido en distintas unidades', () => {
    const start = new Date('2026-10-28T10:00:00.000Z');

    expect(elapsedLabel(start, new Date('2026-10-28T10:00:30.000Z'))).toBe('30 s');
    expect(elapsedLabel(start, new Date('2026-10-28T10:05:00.000Z'))).toBe('5 min');
    expect(elapsedLabel(start, new Date('2026-10-28T12:20:00.000Z'))).toBe('2 h 20 min');
  });

  it('devuelve un guion para fechas vacías', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('genera una fecha ISO local sin desplazar el día', () => {
    const date = new Date(2026, 9, 28, 23, 30);

    expect(isoDate(date)).toBe('2026-10-28');
  });
});
