/**
 * Excel出力ユーティリティ
 * ExcelJSライブラリを使用してスタイル付きExcelファイルを生成・ダウンロード
 */
import type ExcelJS from 'exceljs'

// =============================================================================
// スタイル定数
// =============================================================================

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2EFDA' },
}

const SECTION_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF2F2F2' },
}

const TOTAL_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF2CC' },
}

const THIN_BORDER: ExcelJS.Border = { style: 'thin', color: { argb: 'FFD0D0D0' } }
const MEDIUM_BORDER: ExcelJS.Border = { style: 'medium', color: { argb: 'FF808080' } }

const ALL_THIN_BORDERS: Partial<ExcelJS.Borders> = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
}

export const CURRENCY_FMT = '#,##0'
export const PERCENT_FMT = '0.0%'

// =============================================================================
// スタイルヘルパー関数
// =============================================================================

/** ヘッダー行のスタイル適用 */
export function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = HEADER_FILL
    cell.font = { bold: true, size: 10 }
    cell.border = {
      top: MEDIUM_BORDER,
      bottom: MEDIUM_BORDER,
      left: THIN_BORDER,
      right: THIN_BORDER,
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  row.height = 22
}

/** セクション行のスタイル適用 */
export function applySectionStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = SECTION_FILL
    cell.font = { bold: true, size: 10 }
    cell.border = ALL_THIN_BORDERS
  })
}

/** 合計行のスタイル適用 */
export function applyTotalStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = TOTAL_FILL
    cell.font = { bold: true, size: 10 }
    cell.border = {
      top: MEDIUM_BORDER,
      bottom: MEDIUM_BORDER,
      left: THIN_BORDER,
      right: THIN_BORDER,
    }
  })
}

/** データ行のスタイル適用 */
export function applyDataStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = ALL_THIN_BORDERS
    cell.font = { size: 10 }
  })
}

/** 列書式一括設定 */
export function setColumnFormats(
  sheet: ExcelJS.Worksheet,
  formats: { col: number; width: number; numFmt?: string }[]
): void {
  for (const fmt of formats) {
    const col = sheet.getColumn(fmt.col)
    col.width = fmt.width
    if (fmt.numFmt) {
      col.numFmt = fmt.numFmt
    }
  }
}

/** タイトル + サブタイトルを追加 */
export function addTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  colCount: number
): number {
  // タイトル行
  const titleRow = sheet.addRow([title])
  titleRow.getCell(1).font = { bold: true, size: 16 }
  titleRow.height = 28
  if (colCount > 1) {
    sheet.mergeCells(titleRow.number, 1, titleRow.number, colCount)
  }

  // サブタイトル行
  const subRow = sheet.addRow([subtitle])
  subRow.getCell(1).font = { size: 10, color: { argb: 'FF666666' } }
  subRow.height = 18
  if (colCount > 1) {
    sheet.mergeCells(subRow.number, 1, subRow.number, colCount)
  }

  // 空行
  sheet.addRow([])

  return sheet.rowCount
}

// =============================================================================
// 共通ユーティリティ
// =============================================================================

/** 数値をフォーマット（カンマ区切り） */
export function formatNumberForExcel(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString('ja-JP')
}

/** パーセンテージをフォーマット */
export function formatPercentForExcel(value: number | null | undefined): string {
  if (value == null) return '-'
  return `${value.toFixed(1)}%`
}

/** 日付文字列（YYYY-MM-01）から月名を取得 */
export function getMonthLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return `${year}年${month}月`
}

/** 年度の月リストを生成（9月〜翌8月） */
export function getFiscalYearMonths(fiscalYear: number): string[] {
  const months: string[] = []
  for (let m = 9; m <= 12; m++) {
    months.push(`${fiscalYear - 1}-${String(m).padStart(2, '0')}-01`)
  }
  for (let m = 1; m <= 8; m++) {
    months.push(`${fiscalYear}-${String(m).padStart(2, '0')}-01`)
  }
  return months
}

/** 開始月〜終了月の月リストを返す（YYYY-MM-01形式） */
export function getMonthRange(start: string, end: string): string[] {
  const months: string[] = []
  const [startYear, startMonth] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)

  let y = startYear
  let m = startMonth

  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push(`${y}-${String(m).padStart(2, '0')}-01`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return months
}

// =============================================================================
// StyledSheetData & ダウンロード
// =============================================================================

export interface StyledSheetData {
  name: string
  build: (workbook: ExcelJS.Workbook) => void
}

// 後方互換のため旧インターフェースも残す（ただし内部では使わない）
export interface SheetData {
  name: string
  data: (string | number | null | undefined)[][]
  columnWidths?: number[]
}

/** Excelファイルを生成してダウンロード（ExcelJS版） */
export async function downloadExcel(options: {
  filename: string
  sheets: StyledSheetData[]
}): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'KPIダッシュボード'
  workbook.created = new Date()

  for (const sheet of options.sheets) {
    sheet.build(workbook)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${options.filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// =============================================================================
// 数値セル書き込みヘルパー
// =============================================================================

/** 数値をセルに書き込む（nullの場合はハイフン） */
export function setCurrencyCell(cell: ExcelJS.Cell, value: number | null | undefined): void {
  if (value == null) {
    cell.value = '-'
  } else {
    cell.value = value
    cell.numFmt = CURRENCY_FMT
  }
}

/** パーセントをセルに書き込む（値は100ベースで受け取り、0.01倍してセットする） */
export function setPercentCell(cell: ExcelJS.Cell, value: number | null | undefined): void {
  if (value == null) {
    cell.value = '-'
  } else {
    cell.value = value / 100
    cell.numFmt = PERCENT_FMT
  }
}
