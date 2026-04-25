import { ReportFilterRequest } from './models';

export function formatCurrency(value: number | null | undefined, currency = 'INR'): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return '--';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return '--';
  }

  return new Intl.NumberFormat('en-IN').format(Number(value));
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return '--';
  }

  return `${Number(value).toFixed(2)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTodayDateValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(days, 0));
  return date.toISOString().slice(0, 10);
}

export function buildDefaultDateRange(days = 30): Pick<ReportFilterRequest, 'fromDate' | 'toDate'> {
  return {
    fromDate: getDateDaysAgo(days),
    toDate: getTodayDateValue()
  };
}

export function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function clampPageSize(value: number | null | undefined, fallback = 20): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(parsed, 1) : fallback;
}

export function buildPeriodLabel(fromDate?: string | null, toDate?: string | null): string {
  if (fromDate && toDate) {
    return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
  }

  if (fromDate) {
    return `From ${formatDate(fromDate)}`;
  }

  if (toDate) {
    return `Up to ${formatDate(toDate)}`;
  }

  return 'All available dates';
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const record =
    error && typeof error === 'object'
      ? (error as {
          message?: string;
          error?: {
            message?: string;
            error?: string;
            fieldErrors?: Record<string, string>;
          };
        })
      : null;

  const fieldErrors = record?.error?.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length) {
    return Object.values(fieldErrors).join(' ');
  }

  return (
    record?.error?.message ??
    record?.error?.error ??
    record?.message ??
    fallback
  );
}
