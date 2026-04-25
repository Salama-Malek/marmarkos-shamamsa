import {
  escapeHtml,
  pdfFooter,
  pdfHeader,
  pdfShell,
  rateClass,
} from './htmlBase';
import { htmlToPdf } from './render';
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

export async function buildStatsPdf(input: BuildStatsInput): Promise<{ uri: string; filename: string }> {
  const html = buildStatsHtml(input);
  const uri = await htmlToPdf(html);
  return { uri, filename: `إحصائيات-${toIsoDate(new Date())}.pdf` };
}

function buildStatsHtml(input: BuildStatsInput): string {
  const today = formatArabicDateLong(toIsoDate(new Date()));

  let body = pdfHeader('كنيسة مارمرقس الرسول · موسكو', ar.app.title);
  body += `<div class="body-pad">`;

  body += `<table class="meta-table" style="margin-top:12px">
    <tr><th>الفترة</th><td>${escapeHtml(input.periodLabel)}</td></tr>
    <tr><th>تاريخ التصدير</th><td>${escapeHtml(today)}</td></tr>
  </table>`;

  // Deacon stats sheet
  body += `<h2 class="section">${'إحصائيات الشمامسة'}</h2>
  <table class="data">
    <thead><tr>
      <th style="width:32px">#</th>
      <th>${ar.deacon.name}</th>
      <th>${ar.stats.cards.liturgiesHeld}</th>
      <th>${ar.status.present}</th>
      <th>${ar.status.absent}</th>
      <th>${ar.status.excused}</th>
      <th>${ar.stats.cards.averageAttendance}</th>
      <th>${ar.stats.cards.totalAssignments}</th>
    </tr></thead>
    <tbody>`;
  input.deaconStats.forEach((s, idx) => {
    const rate = s.liturgiesEligible > 0 ? s.attendanceRate : null;
    const rateLabel = rate !== null ? formatPercent(rate) : '—';
    const rateCls = rate !== null ? `rate ${rateClass(rate)}` : '';
    body += `<tr>
      <td style="text-align:center">${formatNumber(idx + 1)}</td>
      <td>${escapeHtml(s.deacon.name)}</td>
      <td style="text-align:center">${formatNumber(s.liturgiesEligible)}</td>
      <td style="text-align:center" class="${s.liturgiesEligible > 0 ? 'matrix-cell present' : ''}">${formatNumber(s.presentCount)}</td>
      <td style="text-align:center" class="${s.absentCount > 0 ? 'matrix-cell absent' : ''}">${formatNumber(s.absentCount)}</td>
      <td style="text-align:center" class="${s.excusedCount > 0 ? 'matrix-cell excused' : ''}">${formatNumber(s.excusedCount)}</td>
      <td style="text-align:center" class="${rateCls}">${rateLabel}</td>
      <td style="text-align:center">${formatNumber(s.assignmentsCount)}</td>
    </tr>`;
  });
  body += `</tbody></table>`;

  // Liturgy sheet
  body += `<h2 class="section" style="margin-top:20px">${'إحصائيات القداسات'}</h2>
  <table class="data">
    <thead><tr>
      <th>${ar.liturgy.date}</th>
      <th>اليوم</th>
      <th>${ar.liturgy.title}</th>
      <th>${ar.liturgy.feast}</th>
      <th>الحالة</th>
      <th>${ar.status.present}</th>
      <th>${ar.status.absent}</th>
    </tr></thead>
    <tbody>`;
  input.liturgies.forEach((l) => {
    const isCancelled = l.status === 'cancelled';
    const pillCls = isCancelled ? 'pill cancelled' : 'pill held';
    const pillLabel = isCancelled ? ar.status.cancelled : ar.status.held;
    body += `<tr>
      <td>${escapeHtml(formatArabicDateLong(l.date))}</td>
      <td>${escapeHtml(arabicDayName(l.date))}</td>
      <td>${escapeHtml(l.title || '—')}</td>
      <td>${escapeHtml(l.feastName || '—')}</td>
      <td style="text-align:center"><span class="${pillCls}">${pillLabel}</span></td>
      <td style="text-align:center">${isCancelled ? '—' : formatNumber(l.counts.present)}</td>
      <td style="text-align:center">${isCancelled ? '—' : formatNumber(l.counts.absent)}</td>
    </tr>`;
  });
  body += `</tbody></table>`;

  body += `</div>`;
  body += pdfFooter(`تصدير من ${ar.app.title} · ${today}`);
  return pdfShell('إحصائيات ' + input.periodLabel, body);
}
