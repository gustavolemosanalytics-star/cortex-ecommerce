// Helper to ensure value is a number
export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  const num = toNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('pt-BR').format(toNumber(value));
};

export const formatPercent = (value: number | string | null | undefined, decimals = 1): string => {
  if (value === null || value === undefined) return '0%';
  return `${toNumber(value).toFixed(decimals)}%`;
};

export const formatCompact = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  const num = toNumber(value);

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(0);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

export const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatROAS = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${toNumber(value).toFixed(2)}x`;
};

export const getChangeColor = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'text-gray-400';
  const num = toNumber(value);
  if (num > 0) return 'text-emerald-400';
  if (num < 0) return 'text-red-400';
  return 'text-gray-400';
};

export const getChangeIcon = (value: number | string | null | undefined): '↑' | '↓' | '→' => {
  if (value === null || value === undefined) return '→';
  const num = toNumber(value);
  if (num > 0) return '↑';
  if (num < 0) return '↓';
  return '→';
};
