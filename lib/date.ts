import { format, parseISO, previousSunday, isSunday, getDay } from 'date-fns';
import { toArabicDigits, type NumeralStyle, formatNumber } from './numerals';

const ARABIC_MONTHS_FULL = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

const ARABIC_MONTHS_SHORT = [
  'ينا',
  'فبر',
  'مار',
  'أبر',
  'ماي',
  'يون',
  'يول',
  'أغس',
  'سبت',
  'أكت',
  'نوف',
  'ديس',
] as const;

const ARABIC_DAY_NAMES = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

export function toIsoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function fromIsoDate(s: string): Date {
  return parseISO(s);
}

export function mostRecentSunday(today: Date = new Date()): Date {
  return isSunday(today) ? today : previousSunday(today);
}

export function arabicDayName(d: Date | string): string {
  const date = typeof d === 'string' ? fromIsoDate(d) : d;
  return ARABIC_DAY_NAMES[getDay(date)]!;
}

export function arabicMonthName(month: number, short = false): string {
  const arr = short ? ARABIC_MONTHS_SHORT : ARABIC_MONTHS_FULL;
  return arr[month]!;
}

export function formatArabicDate(
  d: Date | string,
  numerals: NumeralStyle = 'arabic',
): string {
  const date = typeof d === 'string' ? fromIsoDate(d) : d;
  const day = formatNumber(date.getDate(), numerals);
  const month = arabicMonthName(date.getMonth());
  const year = formatNumber(date.getFullYear(), numerals);
  return `${day} ${month} ${year}`;
}

export function formatArabicDateLong(
  d: Date | string,
  numerals: NumeralStyle = 'arabic',
): string {
  const date = typeof d === 'string' ? fromIsoDate(d) : d;
  return `${arabicDayName(date)} · ${formatArabicDate(date, numerals)}`;
}

export function defaultSessionTitle(
  d: Date | string,
  numerals: NumeralStyle = 'arabic',
): string {
  const date = typeof d === 'string' ? fromIsoDate(d) : d;
  const day = formatNumber(date.getDate(), numerals);
  const month = arabicMonthName(date.getMonth());
  const year = formatNumber(date.getFullYear(), numerals);
  return `اجتماع الأحد ${day} ${month} ${year}`;
}

export function yearMonthKey(d: Date | string): string {
  const date = typeof d === 'string' ? fromIsoDate(d) : d;
  return format(date, 'yyyy-MM');
}

export function arabicMonthYear(yearMonth: string, numerals: NumeralStyle = 'arabic'): string {
  const [yStr, mStr] = yearMonth.split('-');
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  return `${arabicMonthName(m)} ${formatNumber(y, numerals)}`;
}

export function nowMs(): number {
  return Date.now();
}

export const _internal = { ARABIC_MONTHS_FULL, ARABIC_DAY_NAMES, toArabicDigits };
