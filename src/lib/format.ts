const DEFAULT_LOCALE = 'es-CO';

export function formatMoney(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(value);
}

export function formatBps(bps: number): string {
  return `${new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(bps / 100)} %`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function elapsedLabel(from: string | Date, now = new Date()): string {
  const start = new Date(from).getTime();
  const seconds = Math.max(0, Math.floor((now.getTime() - start) / 1000));

  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export function elapsedMinutes(from: string | Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / 60_000));
}

export function isoDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function lastNDays(days: number): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date(hasta);
  desde.setDate(desde.getDate() - days);
  return { desde: isoDate(desde), hasta: isoDate(hasta) };
}
