/**
 * Excel出力ユーティリティ
 * xlsxライブラリを使用してExcelファイルを生成・ダウンロード
 */
import * as XLSX from 'xlsx'

/**
 * シートデータの型定義
 */
export interface SheetData {
  name: string
  data: (string | number | null | undefined)[][]
  columnWidths?: number[]
}

/**
 * Excel出力オプション
 */
export interface ExcelExportOptions {
  filename: string
  sheets: SheetData[]
}

/**
 * 数値をフォーマット（カンマ区切り）
 */
export function formatNumberForExcel(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString('ja-JP')
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentForExcel(value: number | null | undefined): string {
  if (value == null) return '-'
  return `${value.toFixed(1)}%`
}

/**
 * 日付文字列（YYYY-MM-01）から月名を取得
 */
export function getMonthLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return `${year}年${month}月`
}

/**
 * 年度の月リストを生成（9月〜翌8月）
 */
export function getFiscalYearMonths(fiscalYear: number): string[] {
  const months: string[] = []
  // 9月〜12月（前年）
  for (let m = 9; m <= 12; m++) {
    months.push(`${fiscalYear - 1}-${String(m).padStart(2, '0')}-01`)
  }
  // 1月〜8月（当年）
  for (let m = 1; m <= 8; m++) {
    months.push(`${fiscalYear}-${String(m).padStart(2, '0')}-01`)
  }
  return months
}

/**
 * Excelファイルを生成してダウンロード
 */
export function downloadExcel(options: ExcelExportOptions): void {
  const workbook = XLSX.utils.book_new()

  for (const sheet of options.sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)

    // 列幅を設定
    if (sheet.columnWidths) {
      worksheet['!cols'] = sheet.columnWidths.map((w) => ({ wch: w }))
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  }

  // ダウンロード
  XLSX.writeFile(workbook, `${options.filename}.xlsx`)
}

/**
 * ヘッダー行を作成するヘルパー
 */
export function createHeaderRow(headers: string[]): string[] {
  return headers
}

/**
 * データ行を作成するヘルパー
 */
export function createDataRow(
  values: (string | number | null | undefined)[]
): (string | number | null | undefined)[] {
  return values
}

/**
 * 空行を作成
 */
export function createEmptyRow(columns: number): string[] {
  return Array(columns).fill('')
}

/**
 * タイトル行を作成
 */
export function createTitleRow(title: string, columns: number): string[] {
  const row = Array(columns).fill('')
  row[0] = title
  return row
}
