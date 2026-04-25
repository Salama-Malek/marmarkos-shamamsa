import * as XLSX from 'xlsx-js-style';
import {
  mergeRange,
  newRtlWorkbook,
  setCellStyle,
  setSheetRtl,
  styleRow,
  workbookToBase64,
} from './utils';
import { styles, rateStyle } from './styles';
import { ar } from '@/lib/i18n';
import { toIsoDate, formatArabicDateLong, arabicDayName } from '@/lib/date';
import { formatNumber, formatPercent } from '@/lib/numerals';
import type { DeaconStats } from '@/types';
import type { LiturgyListItem } from '@/db/liturgies';

interface BuildStatsInput {
  periodLabel: string;
  deaconStats: DeaconStats[];
  liturgies: LiturgyListItem[];
}

export function buildStatsWorkbook(input: BuildStatsInput): {
  base64: string;
  filename: string;
} {
  const wb = newRtlWorkbook();
  XLSX.utils.book_append_sheet(wb, buildDeaconSheet(input), 'إحصائيات الشمامسة');
  XLSX.utils.book_append_sheet(wb, buildLiturgySheet(input), 'إحصائيات القداسات');
  return {
    base64: workbookToBase64(wb),
    filename: `إحصائيات-${toIsoDate(new Date())}.xlsx`,
  };
}

function buildDeaconSheet(input: BuildStatsInput): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [];
  aoa.push(['كنيسة مارمرقس الرسول · موسكو', '', '', '', '', '', '', '']);
  aoa.push([ar.app.title, '', '', '', '', '', '', '']);
  aoa.push([
    'الفترة:',
    input.periodLabel,
    '',
    'تاريخ التصدير:',
    formatArabicDateLong(toIsoDate(new Date())),
    '',
    '',
    '',
  ]);
  aoa.push(['', '', '', '', '', '', '', '']);

  aoa.push(['#', ar.deacon.name, ar.stats.cards.liturgiesHeld, ar.status.present, ar.status.absent, ar.status.excused, ar.stats.cards.averageAttendance, ar.stats.cards.totalAssignments]);
  const headerRow = aoa.length - 1;

  input.deaconStats.forEach((s, idx) => {
    aoa.push([
      formatNumber(idx + 1),
      s.deacon.name,
      formatNumber(s.liturgiesEligible),
      formatNumber(s.presentCount),
      formatNumber(s.absentCount),
      formatNumber(s.excusedCount),
      s.liturgiesEligible > 0 ? formatPercent(s.attendanceRate) : '—',
      formatNumber(s.assignmentsCount),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setSheetRtl(ws);
  ws['!cols'] = [
    { wch: 5 }, { wch: 26 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];
  ws['!merges'] = [
    mergeRange(0, 0, 0, 7),
    mergeRange(1, 0, 1, 7),
    mergeRange(2, 1, 2, 2),
    mergeRange(2, 4, 2, 7),
  ];

  styleRow(ws, 0, 0, 7, styles.titleBar);
  styleRow(ws, 1, 0, 7, styles.subtitleBar);
  styleRow(ws, 2, 0, 7, styles.bannerLight);
  styleRow(ws, headerRow, 0, 7, styles.tableHeader);

  input.deaconStats.forEach((s, idx) => {
    const r = headerRow + 1 + idx;
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 0 }), styles.cellNumber);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 1 }), styles.cellText);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 2 }), styles.cellNumber);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 3 }), styles.present);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 4 }), styles.absent);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 5 }), styles.excused);
    setCellStyle(
      ws,
      XLSX.utils.encode_cell({ r, c: 6 }),
      s.liturgiesEligible > 0 ? rateStyle(s.attendanceRate) : styles.unmarked,
    );
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 7 }), styles.cellNumber);
  });

  ws['!rows'] = [{ hpx: 28 }, { hpx: 24 }, { hpx: 22 }];
  return ws;
}

function buildLiturgySheet(input: BuildStatsInput): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [];
  aoa.push(['كنيسة مارمرقس الرسول · موسكو', '', '', '', '', '', '']);
  aoa.push([ar.app.title, '', '', '', '', '', '']);
  aoa.push(['الفترة:', input.periodLabel, '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '', '']);

  aoa.push([ar.liturgy.date, 'اليوم', ar.liturgy.title, ar.liturgy.feast, 'الحالة', ar.status.present, ar.status.absent]);
  const headerRow = aoa.length - 1;

  input.liturgies.forEach((l) => {
    const isCancelled = l.status === 'cancelled';
    aoa.push([
      formatArabicDateLong(l.date),
      arabicDayName(l.date),
      l.title || '—',
      l.feastName || '—',
      isCancelled ? ar.status.cancelled : ar.status.held,
      isCancelled ? '—' : formatNumber(l.counts.present),
      isCancelled ? '—' : formatNumber(l.counts.absent),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setSheetRtl(ws);
  ws['!cols'] = [
    { wch: 24 }, { wch: 10 }, { wch: 26 }, { wch: 20 },
    { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];
  ws['!merges'] = [
    mergeRange(0, 0, 0, 6),
    mergeRange(1, 0, 1, 6),
    mergeRange(2, 1, 2, 6),
  ];

  styleRow(ws, 0, 0, 6, styles.titleBar);
  styleRow(ws, 1, 0, 6, styles.subtitleBar);
  styleRow(ws, 2, 0, 6, styles.bannerLight);
  styleRow(ws, headerRow, 0, 6, styles.tableHeader);

  input.liturgies.forEach((l, idx) => {
    const r = headerRow + 1 + idx;
    const isCancelled = l.status === 'cancelled';
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 0 }), styles.cellText);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 1 }), styles.cellText);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 2 }), styles.cellText);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 3 }), styles.cellText);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 4 }), isCancelled ? styles.cancelled : styles.present);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 5 }), isCancelled ? styles.unmarked : styles.cellNumber);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 6 }), isCancelled ? styles.unmarked : styles.cellNumber);
  });

  ws['!rows'] = [{ hpx: 28 }, { hpx: 24 }, { hpx: 22 }];
  return ws;
}
