/**
 * Shared HTML scaffolding for PDF exports — handles RTL, system Arabic font
 * fallbacks, and a print-ready stylesheet tuned for A4 portrait. expo-print
 * runs the HTML through the platform print engine, so anything that works in
 * a browser and renders correctly in print preview will print correctly.
 */

const PRIMARY = '#7A1F2C';
const PRIMARY_DARK = '#5C1721';
const GOLD = '#B8954A';
const TEXT = '#2A1E1A';
const TEXT_MUTED = '#6B5D55';
const BORDER = '#D2BFA5';
const BG = '#F6F0E4';
const PRESENT_BG = '#E6EFDD';
const PRESENT_FG = '#5F8A4E';
const ABSENT_BG = '#F3DEDE';
const ABSENT_FG = '#A84545';
const EXCUSED_BG = '#F3E8D0';
const EXCUSED_FG = '#8C6F35';
const CANCEL_BG = '#E8E0D5';
const CANCEL_FG = '#8C7B6E';

export const PDF_COLORS = {
  PRIMARY,
  PRIMARY_DARK,
  GOLD,
  TEXT,
  TEXT_MUTED,
  BORDER,
  BG,
  PRESENT_BG,
  PRESENT_FG,
  ABSENT_BG,
  ABSENT_FG,
  EXCUSED_BG,
  EXCUSED_FG,
  CANCEL_BG,
  CANCEL_FG,
};

/** Coptic cross SVG used in the PDF header. Same shape as in-app component. */
export const COPTIC_CROSS_SVG = `
<svg viewBox="0 0 64 64" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round">
    <path d="M32 8 V56" />
    <path d="M8 32 H56" />
    <circle cx="32" cy="32" r="9" />
    <path d="M22 8 H42" />
    <path d="M22 56 H42" />
    <path d="M8 22 V42" />
    <path d="M56 22 V42" />
  </g>
</svg>`;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function pdfShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    direction: rtl;
    font-family: 'Cairo', 'Amiri', 'Tahoma', 'Arial', sans-serif;
    color: ${TEXT};
    background: ${BG};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { padding: 0 0 24px; }
  header.banner {
    background: ${PRIMARY};
    color: white;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 4px solid ${GOLD};
  }
  header.banner .titles h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
  header.banner .titles p {
    margin: 0;
    font-size: 12px;
    opacity: 0.9;
  }
  h2.section {
    color: ${PRIMARY_DARK};
    border-bottom: 2px solid ${GOLD};
    padding: 4px 0;
    margin: 16px 0 8px;
    font-size: 16px;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }
  .meta-table th, .meta-table td {
    padding: 6px 10px;
    border: 1px solid ${BORDER};
    text-align: right;
  }
  .meta-table th {
    background: ${BG};
    color: ${TEXT_MUTED};
    font-weight: 700;
    width: 30%;
  }
  table.data {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 12px;
  }
  table.data th, table.data td {
    padding: 6px 8px;
    border: 1px solid ${BORDER};
    text-align: right;
    vertical-align: middle;
  }
  table.data thead th {
    background: ${PRIMARY};
    color: white;
    font-weight: 700;
  }
  table.data tbody tr:nth-child(even) {
    background: rgba(255, 252, 246, 0.6);
  }
  .pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid;
  }
  .pill.present { background: ${PRESENT_BG}; color: ${PRESENT_FG}; border-color: ${PRESENT_FG}; }
  .pill.absent { background: ${ABSENT_BG}; color: ${ABSENT_FG}; border-color: ${ABSENT_FG}; }
  .pill.excused { background: ${EXCUSED_BG}; color: ${EXCUSED_FG}; border-color: ${EXCUSED_FG}; }
  .pill.cancelled { background: ${CANCEL_BG}; color: ${CANCEL_FG}; border-color: ${CANCEL_FG}; }
  .pill.held { background: ${PRESENT_BG}; color: ${PRESENT_FG}; border-color: ${PRESENT_FG}; }
  .stat-row {
    display: flex;
    gap: 8px;
    margin: 8px 0;
    flex-wrap: wrap;
  }
  .stat-card {
    flex: 1 1 22%;
    background: white;
    border: 1px solid ${BORDER};
    border-radius: 8px;
    padding: 10px 12px;
    text-align: center;
  }
  .stat-card .v { font-size: 18px; font-weight: 700; color: ${PRIMARY}; }
  .stat-card .l { font-size: 11px; color: ${TEXT_MUTED}; }
  .notice {
    background: ${ABSENT_BG};
    color: ${ABSENT_FG};
    border: 1px solid ${ABSENT_FG};
    padding: 10px 12px;
    border-radius: 8px;
    margin: 8px 0;
  }
  .matrix-cell { text-align: center; min-width: 28px; }
  .matrix-cell.present { background: ${PRESENT_BG}; color: ${PRESENT_FG}; font-weight: 700; }
  .matrix-cell.absent { background: ${ABSENT_BG}; color: ${ABSENT_FG}; font-weight: 700; }
  .matrix-cell.excused { background: ${EXCUSED_BG}; color: ${EXCUSED_FG}; font-weight: 700; }
  .matrix-cell.cancelled { background: ${CANCEL_BG}; color: ${CANCEL_FG}; }
  .matrix-cell.ineligible { background: ${BG}; color: ${TEXT_MUTED}; }
  .matrix-cell.unmarked { color: ${TEXT_MUTED}; }
  .rate.green { background: ${PRESENT_BG}; color: ${PRESENT_FG}; font-weight: 700; }
  .rate.amber { background: ${EXCUSED_BG}; color: ${EXCUSED_FG}; font-weight: 700; }
  .rate.red { background: ${ABSENT_BG}; color: ${ABSENT_FG}; font-weight: 700; }
  footer.foot {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid ${BORDER};
    color: ${TEXT_MUTED};
    font-size: 10px;
    text-align: center;
  }
  .body-pad { padding: 0 16px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export function pdfHeader(title: string, subtitle?: string): string {
  return `<header class="banner">
    <div class="titles">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
    </div>
    ${COPTIC_CROSS_SVG}
  </header>`;
}

export function pdfFooter(label: string): string {
  return `<footer class="foot">${escapeHtml(label)}</footer>`;
}

export function rateClass(rate: number): string {
  if (rate >= 0.8) return 'green';
  if (rate >= 0.5) return 'amber';
  return 'red';
}
