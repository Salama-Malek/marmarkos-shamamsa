import * as XLSX from 'xlsx-js-style';

export type CellStyle = NonNullable<XLSX.CellObject['s']>;

export function setCellStyle(
  ws: XLSX.WorkSheet,
  address: string,
  style: CellStyle,
): void {
  const cell = ws[address] as XLSX.CellObject | undefined;
  if (!cell) return;
  cell.s = style;
}

/** Apply a style across a row range (inclusive). */
export function styleRow(
  ws: XLSX.WorkSheet,
  rowIdx0: number,
  fromCol: number,
  toCol: number,
  style: CellStyle,
): void {
  for (let c = fromCol; c <= toCol; c += 1) {
    const addr = XLSX.utils.encode_cell({ r: rowIdx0, c });
    setCellStyle(ws, addr, style);
  }
}

export function styleCells(
  ws: XLSX.WorkSheet,
  cells: { r: number; c: number; s: CellStyle }[],
): void {
  for (const { r, c, s } of cells) {
    setCellStyle(ws, XLSX.utils.encode_cell({ r, c }), s);
  }
}

export function mergeRange(r1: number, c1: number, r2: number, c2: number): XLSX.Range {
  return { s: { r: r1, c: c1 }, e: { r: r2, c: c2 } };
}

export function workbookToBase64(wb: XLSX.WorkBook): string {
  // 'base64' type avoids needing Buffer in React Native
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

/** Build an empty workbook configured for RTL. */
export function newRtlWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  // Workbook-level view marks the file as RTL so Excel respects column order
  // when reopened. Cast through unknown because xlsx-js-style's WorkbookProperties
  // type doesn't expose RTL on Views.
  (wb as unknown as { Workbook: { Views: { RTL: boolean }[] } }).Workbook = {
    Views: [{ RTL: true }],
  };
  return wb;
}

/** Mark a worksheet as RTL. */
export function setSheetRtl(ws: XLSX.WorkSheet): void {
  // SheetJS recognizes !direction = 'rtl' on the worksheet.
  (ws as unknown as Record<string, unknown>)['!direction'] = 'rtl';
}
