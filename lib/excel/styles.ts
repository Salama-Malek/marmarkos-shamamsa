/**
 * xlsx-js-style cell-style definitions for the Coptic palette so that
 * Excel/Sheets/Numbers prints match the in-app aesthetic. Color values
 * are RGB hex strings without the leading '#'.
 */
import type { CellStyle } from './utils';

const C = {
  primary: '7A1F2C',
  primaryDark: '5C1721',
  white: 'FFFFFF',
  text: '2A1E1A',
  textMuted: '6B5D55',
  presentBg: 'E6EFDD',
  present: '5F8A4E',
  absentBg: 'F3DEDE',
  absent: 'A84545',
  excusedBg: 'F3E8D0',
  excused: '8C6F35',
  cancelledBg: 'E8E0D5',
  cancelled: '8C7B6E',
  border: 'E4D6C2',
  borderStrong: 'D2BFA5',
  bgDeep: 'EFE6D4',
} as const;

const baseFont = { name: 'Cairo', sz: 11 } as const;

const arabicAlign = { horizontal: 'right', vertical: 'center', wrapText: true } as const;
const centerAlign = { horizontal: 'center', vertical: 'center', wrapText: true } as const;

const thinBorder = {
  top: { style: 'thin', color: { rgb: C.borderStrong } },
  bottom: { style: 'thin', color: { rgb: C.borderStrong } },
  left: { style: 'thin', color: { rgb: C.borderStrong } },
  right: { style: 'thin', color: { rgb: C.borderStrong } },
} as const;

export const styles: Record<string, CellStyle> = {
  titleBar: {
    fill: { fgColor: { rgb: C.primary } },
    font: { ...baseFont, bold: true, color: { rgb: C.white }, sz: 14 },
    alignment: centerAlign,
  },
  subtitleBar: {
    fill: { fgColor: { rgb: C.primaryDark } },
    font: { ...baseFont, bold: true, color: { rgb: C.white }, sz: 12 },
    alignment: centerAlign,
  },
  bannerLight: {
    fill: { fgColor: { rgb: C.bgDeep } },
    font: { ...baseFont, bold: true, color: { rgb: C.text } },
    alignment: arabicAlign,
    border: thinBorder,
  },
  fieldLabel: {
    font: { ...baseFont, bold: true, color: { rgb: C.text } },
    alignment: arabicAlign,
    border: thinBorder,
  },
  fieldValue: {
    font: { ...baseFont, color: { rgb: C.text } },
    alignment: arabicAlign,
    border: thinBorder,
  },
  tableHeader: {
    fill: { fgColor: { rgb: C.primary } },
    font: { ...baseFont, bold: true, color: { rgb: C.white } },
    alignment: centerAlign,
    border: thinBorder,
  },
  tableHeaderCancelled: {
    fill: { fgColor: { rgb: C.cancelledBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.cancelled } },
    alignment: centerAlign,
    border: thinBorder,
  },
  cellText: {
    font: { ...baseFont, color: { rgb: C.text } },
    alignment: arabicAlign,
    border: thinBorder,
  },
  cellNumber: {
    font: { ...baseFont, color: { rgb: C.text } },
    alignment: centerAlign,
    border: thinBorder,
  },
  present: {
    fill: { fgColor: { rgb: C.presentBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.present } },
    alignment: centerAlign,
    border: thinBorder,
  },
  absent: {
    fill: { fgColor: { rgb: C.absentBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.absent } },
    alignment: centerAlign,
    border: thinBorder,
  },
  excused: {
    fill: { fgColor: { rgb: C.excusedBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.excused } },
    alignment: centerAlign,
    border: thinBorder,
  },
  cancelled: {
    fill: { fgColor: { rgb: C.cancelledBg } },
    font: { ...baseFont, color: { rgb: C.cancelled }, italic: true },
    alignment: centerAlign,
    border: thinBorder,
  },
  ineligible: {
    fill: { fgColor: { rgb: C.bgDeep } },
    font: { ...baseFont, color: { rgb: C.textMuted } },
    alignment: centerAlign,
    border: thinBorder,
  },
  unmarked: {
    font: { ...baseFont, color: { rgb: C.textMuted } },
    alignment: centerAlign,
    border: thinBorder,
  },
  summaryLabel: {
    font: { ...baseFont, bold: true, color: { rgb: C.text } },
    alignment: arabicAlign,
  },
  summaryValue: {
    font: { ...baseFont, color: { rgb: C.text }, sz: 12 },
    alignment: arabicAlign,
  },
  rateGreen: {
    fill: { fgColor: { rgb: C.presentBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.present } },
    alignment: centerAlign,
    border: thinBorder,
  },
  rateAmber: {
    fill: { fgColor: { rgb: C.excusedBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.excused } },
    alignment: centerAlign,
    border: thinBorder,
  },
  rateRed: {
    fill: { fgColor: { rgb: C.absentBg } },
    font: { ...baseFont, bold: true, color: { rgb: C.absent } },
    alignment: centerAlign,
    border: thinBorder,
  },
};

export function rateStyle(rate: number): CellStyle {
  if (rate >= 0.8) return styles.rateGreen!;
  if (rate >= 0.5) return styles.rateAmber!;
  return styles.rateRed!;
}

export function statusStyle(status: 'present' | 'absent' | 'excused' | undefined): CellStyle {
  switch (status) {
    case 'present':
      return styles.present!;
    case 'absent':
      return styles.absent!;
    case 'excused':
      return styles.excused!;
    default:
      return styles.unmarked!;
  }
}
