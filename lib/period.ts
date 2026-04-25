import { format, subMonths, startOfYear } from 'date-fns';
import { toIsoDate } from './date';

export type PeriodKey = 'all' | 'thisYear' | 'last3Months';

export interface Period {
  key: PeriodKey;
  dateFrom?: string;
  dateTo?: string;
}

export function buildPeriod(key: PeriodKey, today: Date = new Date()): Period {
  switch (key) {
    case 'thisYear':
      return {
        key,
        dateFrom: toIsoDate(startOfYear(today)),
        dateTo: toIsoDate(today),
      };
    case 'last3Months':
      return {
        key,
        dateFrom: toIsoDate(subMonths(today, 3)),
        dateTo: toIsoDate(today),
      };
    case 'all':
    default:
      return { key };
  }
}

export function _formatTodayHint(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}
