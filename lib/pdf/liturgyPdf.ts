import {
  escapeHtml,
  pdfFooter,
  pdfHeader,
  pdfShell,
  rateClass,
} from './htmlBase';
import { htmlToPdf } from './render';
import { ar } from '@/lib/i18n';
import { formatArabicDateLong, arabicMonthName, fromIsoDate } from '@/lib/date';
import { formatNumber, formatPercent } from '@/lib/numerals';
import type { AttendanceRecord, AttendanceStatus, Deacon, Liturgy } from '@/types';
import type { AssignmentDetail } from '@/db/assignments';
import type { MonthlyMatrixData } from '@/lib/excel/liturgyExport';

// ── Single Liturgy PDF ───────────────────────────────────────────────────────

interface BuildLiturgyInput {
  liturgy: Liturgy;
  feastName?: string;
  deacons: Deacon[];
  attendance: AttendanceRecord[];
  assignments: AssignmentDetail[];
}

export async function buildLiturgyPdf(input: BuildLiturgyInput): Promise<{ uri: string; filename: string }> {
  const html = buildLiturgyHtml(input);
  const uri = await htmlToPdf(html);
  return { uri, filename: `قداس-${input.liturgy.date}.pdf` };
}

function buildLiturgyHtml(input: BuildLiturgyInput): string {
  const { liturgy, feastName, deacons, attendance, assignments } = input;
  const isCancelled = liturgy.status === 'cancelled';

  const statusByDeacon = new Map<string, AttendanceStatus>();
  for (const r of attendance) statusByDeacon.set(r.deaconId, r.status);
  const activeDeacons = deacons.filter((d) => d.isActive);

  const title = liturgy.title || (feastName ? `قداس ${feastName}` : ar.liturgy.detail);
  const dateLabel = formatArabicDateLong(liturgy.date);

  let body = pdfHeader('كنيسة مارمرقس الرسول · موسكو', ar.app.title);
  body += `<div class="body-pad">`;

  // Meta
  body += `<table class="meta-table" style="margin-top:12px">
    <tr><th>${ar.liturgy.date}</th><td>${escapeHtml(dateLabel)}</td></tr>
    <tr><th>عنوان القداس</th><td>${escapeHtml(title)}</td></tr>`;
  if (feastName) body += `<tr><th>${ar.liturgy.feast}</th><td>${escapeHtml(feastName)}</td></tr>`;
  const statusPill = isCancelled
    ? `<span class="pill cancelled">${ar.status.cancelled}</span>`
    : `<span class="pill held">${ar.status.held}</span>`;
  body += `<tr><th>الحالة</th><td>${statusPill}</td></tr>`;
  if (isCancelled && liturgy.cancellationReason) {
    body += `<tr><th>سبب الإلغاء</th><td>${escapeHtml(liturgy.cancellationReason)}</td></tr>`;
  }
  if (liturgy.notes) {
    body += `<tr><th>${ar.liturgy.notes}</th><td>${escapeHtml(liturgy.notes)}</td></tr>`;
  }
  body += `</table>`;

  if (isCancelled) {
    body += `<div class="notice">تم إلغاء هذا القداس${liturgy.cancellationReason ? ': ' + escapeHtml(liturgy.cancellationReason) : ''}.</div>`;
  } else {
    // Counts
    let presentCount = 0, absentCount = 0, excusedCount = 0;
    activeDeacons.forEach((d) => {
      const s = statusByDeacon.get(d.id);
      if (s === 'present') presentCount++;
      else if (s === 'absent') absentCount++;
      else if (s === 'excused') excusedCount++;
    });
    const denom = presentCount + absentCount + excusedCount;
    const rate = denom > 0 ? presentCount / denom : 0;

    body += `<div class="stat-row" style="margin-top:12px">
      <div class="stat-card"><div class="v">${formatNumber(presentCount)}</div><div class="l">${ar.liturgy.summaryPresent}</div></div>
      <div class="stat-card"><div class="v">${formatNumber(absentCount)}</div><div class="l">${ar.liturgy.summaryAbsent}</div></div>
      <div class="stat-card"><div class="v">${formatNumber(excusedCount)}</div><div class="l">${ar.liturgy.summaryExcused}</div></div>
      <div class="stat-card"><div class="v rate ${denom > 0 ? rateClass(rate) : ''}">${denom > 0 ? formatPercent(rate) : '—'}</div><div class="l">نسبة الحضور</div></div>
    </div>`;

    // Attendance table
    body += `<h2 class="section">${ar.liturgy.attendanceTab}</h2>
    <table class="data">
      <thead><tr><th style="width:36px">#</th><th>${ar.deacon.name}</th><th style="width:90px">الحالة</th></tr></thead>
      <tbody>`;
    activeDeacons.forEach((d, idx) => {
      const s = statusByDeacon.get(d.id);
      const pillClass = s ?? 'unmarked';
      const label = s === 'present' ? ar.status.present : s === 'absent' ? ar.status.absent : s === 'excused' ? ar.status.excused : '·';
      body += `<tr>
        <td style="text-align:center">${formatNumber(idx + 1)}</td>
        <td>${escapeHtml(d.name)}</td>
        <td style="text-align:center"><span class="pill ${pillClass}">${escapeHtml(label)}</span></td>
      </tr>`;
    });
    body += `</tbody></table>`;

    // Assignments
    if (assignments.length > 0) {
      const sorted = [...assignments].sort((a, b) => a.partSortOrder - b.partSortOrder);
      body += `<h2 class="section">${ar.liturgy.assignmentsTab}</h2>
      <table class="data">
        <thead><tr><th style="width:36px">#</th><th>الجزء</th><th>${ar.deacon.name}</th></tr></thead>
        <tbody>`;
      sorted.forEach((a, idx) => {
        body += `<tr>
          <td style="text-align:center">${formatNumber(idx + 1)}</td>
          <td>${escapeHtml(a.partName)}</td>
          <td>${escapeHtml(a.deaconName)}</td>
        </tr>`;
      });
      body += `</tbody></table>`;
    }
  }

  body += `</div>`;
  body += pdfFooter(`تصدير من ${ar.app.title} · ${dateLabel}`);

  return pdfShell(title, body);
}

// ── Monthly Matrix PDF ───────────────────────────────────────────────────────

export async function buildMonthlyPdf(data: MonthlyMatrixData): Promise<{ uri: string; filename: string }> {
  const html = buildMonthlyHtml(data);
  const uri = await htmlToPdf(html);
  return { uri, filename: `تقرير-شهر-${data.yearMonth}.pdf` };
}

function buildMonthlyHtml(data: MonthlyMatrixData): string {
  const title = `تقرير الحضور — ${data.yearMonth}`;

  let body = pdfHeader('كنيسة مارمرقس الرسول · موسكو', ar.app.title);
  body += `<div class="body-pad">`;
  body += `<h2 class="section" style="margin-top:12px">${escapeHtml(title)}</h2>`;

  body += `<table class="data" style="font-size:11px">
    <thead><tr>
      <th>${ar.deacon.name}</th>`;
  data.liturgies.forEach((l) => {
    const d = fromIsoDate(l.date);
    const day = formatNumber(d.getDate());
    const month = arabicMonthName(d.getMonth(), true);
    const label = l.status === 'cancelled'
      ? `${day} ${ar.status.cancelled}`
      : l.feastName
        ? `${day} ${escapeHtml(l.feastName.slice(0, 6))}`
        : `${day} ${month}`;
    const cls = l.status === 'cancelled' ? 'style="background:#E8E0D5;color:#8C7B6E"' : '';
    body += `<th class="matrix-cell" ${cls}>${label}</th>`;
  });
  body += `<th>النسبة</th><th>حضر/مؤهل</th></tr></thead><tbody>`;

  data.rows.forEach((row) => {
    body += `<tr><td>${escapeHtml(row.deacon.name)}</td>`;
    data.liturgies.forEach((l) => {
      const cell = row.cells.get(l.id);
      let cls = 'matrix-cell';
      let label = '·';
      if (l.status === 'cancelled') { cls += ' cancelled'; label = ar.status.cancelled; }
      else if (cell === 'present') { cls += ' present'; label = '✓'; }
      else if (cell === 'absent') { cls += ' absent'; label = '✗'; }
      else if (cell === 'excused') { cls += ' excused'; label = 'ع'; }
      else { cls += ' unmarked'; }
      body += `<td class="${cls}">${label}</td>`;
    });
    const rate = row.eligibleHeld > 0 ? row.presentCount / row.eligibleHeld : null;
    const rateLabel = rate !== null ? formatPercent(rate) : '—';
    const rateCls = rate !== null ? `rate ${rateClass(rate)}` : '';
    body += `<td class="matrix-cell ${rateCls}">${rateLabel}</td>`;
    body += `<td class="matrix-cell">${formatNumber(row.presentCount)}/${formatNumber(row.eligibleHeld)}</td>`;
    body += `</tr>`;
  });

  body += `</tbody></table>`;
  body += `</div>`;
  body += pdfFooter(`تصدير من ${ar.app.title}`);
  return pdfShell(title, body);
}
