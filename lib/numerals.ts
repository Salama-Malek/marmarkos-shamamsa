const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;
const WESTERN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export type NumeralStyle = 'arabic' | 'western';

export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]!);
}

export function toWesternDigits(input: string | number): string {
  return String(input).replace(/[٠-٩]/g, (d) => {
    const idx = ARABIC_DIGITS.indexOf(d as (typeof ARABIC_DIGITS)[number]);
    return idx >= 0 ? WESTERN_DIGITS[idx]! : d;
  });
}

export function formatNumber(n: number | string, style: NumeralStyle = 'arabic'): string {
  return style === 'arabic' ? toArabicDigits(n) : String(n);
}

export function formatPercent(rate: number, style: NumeralStyle = 'arabic'): string {
  const pct = Math.round(rate * 100);
  return `${formatNumber(pct, style)}٪`;
}
