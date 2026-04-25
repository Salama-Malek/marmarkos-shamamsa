import * as XLSX from 'xlsx-js-style';
import {
  mergeRange,
  newRtlWorkbook,
  setCellStyle,
  setSheetRtl,
  styleRow,
  workbookToBase64,
} from './utils';
import { styles, statusStyle, rateStyle } from './styles';
import { ar } from '@/lib/i18n';
import { formatArabicDateLong, arabicMonthName, fromIsoDate } from '@/lib/date';
import { formatNumber, formatPercent } from '@/lib/numerals';
import type { AttendanceRecord, AttendanceStatus, Deacon, Liturgy } from '@/types';
import type { AssignmentDetail } from '@/db/assignments';

// ── Single Liturgy Export ────────────────────────────────────────────────────

interface BuildLiturgyInput {
  liturgy: Liturgy;
  feastName?: string;
  deacons: Deacon[];
  attendance: AttendanceRecord[];
  assignments: AssignmentDetail[];
}

export function buildLiturgyWorkbook(input: BuildLiturgyInput): {
  base64: string;
  filename: string;
} {
  const wb = newRtlWorkbook();
  XLSX.utils.book_append_sheet(wb, buildAttendanceSheet(input), 'الحضور');
  if (input.assignments.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildAssignmentsSheet(input), 'التكليفات');
  }
  return {
    base64: workbookToBase64(wb),
    filename: `قداس-${input.liturgy.date}.xlsx`,
  };
}

function buildAttendanceSheet(input: BuildLiturgyInput): XLSX.WorkSheet {
  const { liturgy, feastName, deacons, attendance } = input;
  const isCancelled = liturgy.status === 'cancelled';

  const statusByDeacon = new Map<string, AttendanceStatus>();
  for (const r of attendance) statusByDeacon.set(r.deaconId, r.status);

  const activeDeacons = deacons.filter((d) => d.isActive);

  const aoa: (string | number)[][] = [];
  aoa.push(['كنيسة مارمرقس الرسول · موسكو', '', '', '']);
  aoa.push([ar.app.title, '', '', '']);
  aoa.push([liturgy.title || (feastName ? `قداس ${feastName}` : ar.liturgy.detail), '', '', '']);
  aoa.push([ar.liturgy.date + ':', formatArabicDateLong(liturgy.date), '', '']);
  aoa.push(['الحالة:', isCancelled ? ar.status.cancelled : ar.status.held, '', '']);
  if (feastName) aoa.push([ar.liturgy.feast + ':', feastName, '', '']);
  aoa.push(['', '', '', '']);

  let tableHeaderRow = -1;
  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  const memberStatusCells: { r: number; status: AttendanceStatus | undefined }[] = [];

  if (isCancelled) {
    aoa.push(['سبب الإلغاء:', liturgy.cancellationReason || '—', '', '']);
  } else {
    aoa.push(['#', ar.deacon.name, 'الحالة', 'ملاحظات']);
    tableHeaderRow = aoa.length - 1;
    activeDeacons.forEach((d, idx) => {
      const status = statusByDeacon.get(d.id);
      const label = statusLabel(status);
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'excused') excusedCount++;
      aoa.push([formatNumber(idx + 1), d.name, label, '']);
      memberStatusCells.push({ r: aoa.length - 1, status });
    });

    aoa.push(['', '', '', '']);
    aoa.push(['الملخص:', '', '', '']);
    const summaryStart = aoa.length - 1;
    aoa.push([ar.liturgy.summaryPresent + ':', formatNumber(presentCount), '', '']);
    aoa.push([ar.liturgy.summaryAbsent + ':', formatNumber(absentCount), '', '']);
    aoa.push([ar.liturgy.summaryExcused + ':', formatNumber(excusedCount), '', '']);
    const denom = presentCount + absentCount + excusedCount;
    aoa.push(['نسبة الحضور:', formatPercent(denom > 0 ? presentCount / denom : 0), '', '']);
  }

  if (liturgy.notes) {
    aoa.push(['', '', '', '']);
    aoa.push([ar.liturgy.notes + ':', liturgy.notes, '', '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 14 }, { wch: 28 }];
  setSheetRtl(ws);
  ws['!merges'] = [
    mergeRange(0, 0, 0, 3),
    mergeRange(1, 0, 1, 3),
    mergeRange(2, 0, 2, 3),
    mergeRange(3, 1, 3, 3),
    mergeRange(4, 1, 4, 3),
  ];

  styleRow(ws, 0, 0, 3, styles.titleBar);
  styleRow(ws, 1, 0, 3, styles.subtitleBar);
  styleRow(ws, 2, 0, 3, styles.bannerLight);
  setCellStyle(ws, 'A4', styles.fieldLabel);
  setCellStyle(ws, 'B4', styles.fieldValue);
  setCellStyle(ws, 'A5', styles.fieldLabel);
  setCellStyle(ws, 'B5', styles.fieldValue);
  ws['!rows'] = [{ hpx: 28 }, { hpx: 24 }, { hpx: 24 }];

  if (!isCancelled && tableHeaderRow >= 0) {
    styleRow(ws, tableHeaderRow, 0, 3, styles.tableHeader);
    const tableStart = tableHeaderRow + 1;
    activeDeacons.forEach((_d, idx) => {
      const r = tableStart + idx;
      setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 0 }), styles.cellNumber);
      setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 1 }), styles.cellText);
      const status = memberStatusCells.find((x) => x.r === r)?.status;
      setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 2 }), statusStyle(status));
      setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 3 }), styles.cellText);
    });
  }

  (ws as unknown as Record<string, unknown>)['!pageSetup'] = {
    paperSize: 9,
    orientation: 'portrait',
    fitToWidth: 1,
  };

  return ws;
}

function buildAssignmentsSheet(input: BuildLiturgyInput): XLSX.WorkSheet {
  const { liturgy, feastName, assignments } = input;

  const sorted = [...assignments].sort((a, b) => a.partSortOrder - b.partSortOrder);

  const aoa: (string | number)[][] = [];
  aoa.push(['كنيسة مارمرقس الرسول · موسكو', '', '']);
  aoa.push([ar.app.title, '', '']);
  aoa.push(['التكليفات:', formatArabicDateLong(liturgy.date), '']);
  if (feastName) aoa.push([ar.liturgy.feast + ':', feastName, '']);
  aoa.push(['', '', '']);

  aoa.push(['#', 'الجزء', ar.deacon.name]);
  const headerRow = aoa.length - 1;

  sorted.forEach((a, idx) => {
    aoa.push([formatNumber(idx + 1), a.partName, a.deaconName]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setSheetRtl(ws);
  ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 26 }];
  ws['!merges'] = [
    mergeRange(0, 0, 0, 2),
    mergeRange(1, 0, 1, 2),
    mergeRange(2, 1, 2, 2),
  ];

  styleRow(ws, 0, 0, 2, styles.titleBar);
  styleRow(ws, 1, 0, 2, styles.subtitleBar);
  styleRow(ws, 2, 0, 2, styles.bannerLight);
  styleRow(ws, headerRow, 0, 2, styles.tableHeader);

  sorted.forEach((_a, idx) => {
    const r = headerRow + 1 + idx;
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 0 }), styles.cellNumber);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 1 }), styles.cellText);
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 2 }), styles.cellText);
  });

  ws['!rows'] = [{ hpx: 28 }, { hpx: 24 }, { hpx: 22 }];
  return ws;
}

// ── Monthly Matrix Export ────────────────────────────────────────────────────

export interface MonthlyMatrixRow {
  deacon: Deacon;
  cells: Map<string, AttendanceStatus | null>;
  presentCount: number;
  eligibleHeld: number;
}

export interface MonthlyMatrixData {
  yearMonth: string;
  liturgies: Array<{ id: string; date: string; status: 'held' | 'cancelled'; feastName?: string }>;
  rows: MonthlyMatrixRow[];
}

export function buildMonthlyWorkbook(data: MonthlyMatrixData): {
  base64: string;
  filename: string;
} {
  const wb = newRtlWorkbook();
  XLSX.utils.book_append_sheet(wb, buildMonthlySheet(data), 'الحضور');
  return {
    base64: workbookToBase64(wb),
    filename: `تقرير-شهر-${data.yearMonth}.xlsx`,
  };
}

function buildMonthlySheet(data: MonthlyMatrixData): XLSX.WorkSheet {
  const headerRow: string[] = [ar.deacon.name];
  data.liturgies.forEach((l) => {
    const d = fromIsoDate(l.date);
    const day = formatNumber(d.getDate());
    const month = arabicMonthName(d.getMonth(), true);
    headerRow.push(
      l.status === 'cancelled'
        ? `${day} ${ar.status.cancelled}`
        : l.feastName
          ? `${day} ${l.feastName.slice(0, 6)}`
          : `${day} ${month}`,
    );
  });
  headerRow.push('النسبة');
  headerRow.push('حضر/مؤهل');

  const aoa: (string | number)[][] = [headerRow];

  data.rows.forEach((row) => {
    const dataRow: (string | number)[] = [row.deacon.name];
    data.liturgies.forEach((l) => {
      const cell = row.cells.get(l.id);
      if (l.status === 'cancelled') { dataRow.push(ar.status.cancelled); return; }
      if (cell === 'present') dataRow.push('✓');
      else if (cell === 'absent') dataRow.push('✗');
      else if (cell === 'excused') dataRow.push('ع');
      else dataRow.push('·');
    });
    dataRow.push(row.eligibleHeld > 0 ? formatPercent(row.presentCount / row.eligibleHeld) : '—');
    dataRow.push(`${formatNumber(row.presentCount)}/${formatNumber(row.eligibleHeld)}`);
    aoa.push(dataRow);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setSheetRtl(ws);

  const cols: XLSX.ColInfo[] = [{ wch: 24 }];
  data.liturgies.forEach(() => cols.push({ wch: 8 }));
  cols.push({ wch: 10 }, { wch: 10 });
  ws['!cols'] = cols;

  data.liturgies.forEach((l, idx) => {
    setCellStyle(
      ws,
      XLSX.utils.encode_cell({ r: 0, c: idx + 1 }),
      l.status === 'cancelled' ? styles.tableHeaderCancelled : styles.tableHeader,
    );
  });
  setCellStyle(ws, XLSX.utils.encode_cell({ r: 0, c: 0 }), styles.tableHeader);
  setCellStyle(ws, XLSX.utils.encode_cell({ r: 0, c: data.liturgies.length + 1 }), styles.tableHeader);
  setCellStyle(ws, XLSX.utils.encode_cell({ r: 0, c: data.liturgies.length + 2 }), styles.tableHeader);

  data.rows.forEach((row, ri) => {
    const r = ri + 1;
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: 0 }), styles.cellText);
    data.liturgies.forEach((l, si) => {
      const c = si + 1;
      const cell = row.cells.get(l.id);
      let style = styles.unmarked;
      if (l.status === 'cancelled') style = styles.cancelled;
      else if (cell === 'present') style = styles.present;
      else if (cell === 'absent') style = styles.absent;
      else if (cell === 'excused') style = styles.excused;
      setCellStyle(ws, XLSX.utils.encode_cell({ r, c }), style);
    });
    setCellStyle(
      ws,
      XLSX.utils.encode_cell({ r, c: data.liturgies.length + 1 }),
      row.eligibleHeld > 0 ? rateStyle(row.presentCount / row.eligibleHeld) : styles.unmarked,
    );
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c: data.liturgies.length + 2 }), styles.cellNumber);
  });

  ws['!rows'] = [{ hpx: 32 }];
  return ws;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: AttendanceStatus | undefined): string {
  if (s === 'present') return ar.status.present;
  if (s === 'absent') return ar.status.absent;
  if (s === 'excused') return ar.status.excused;
  return '·';
}
