const numberFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'decimal',
  maximumFractionDigits: 0,
});

const CURRENCY_LABELS: Record<string, string> = {
  XOF: 'FCFA',
  EUR: '€',
  USD: '$',
};

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return numberFormatter.format(value);
}

export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'XOF',
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const amount = numberFormatter.format(value);
  const label = CURRENCY_LABELS[currency] ?? currency;
  return `${amount} ${label}`;
}
