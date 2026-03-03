/**
 * データ出力用カスタムフック
 * ExcelJSベースのスタイル付きExcel出力
 */
'use client'

import { useCallback } from 'react'
import type ExcelJS from 'exceljs'
import { getDashboardData } from '@/lib/api/dashboard'
import { getFinanceAnalysisV2, getStorePLList } from '@/lib/api/financial'
import { getStoreSummary } from '@/lib/api/store'
import { getChannelSummary, getProductSummary, getCustomerSummary, getWebsiteStats } from '@/lib/api/ecommerce'
import { getManufacturingAnalysis } from '@/lib/api/manufacturing'
import {
  downloadExcel,
  getFiscalYearMonths,
  getMonthLabel,
  getMonthRange,
  addTitle,
  applyHeaderStyle,
  applySectionStyle,
  applyTotalStyle,
  applyDataStyle,
  setCurrencyCell,
  setPercentCell,
  CURRENCY_FMT,
  PERCENT_FMT,
  type StyledSheetData,
} from '@/lib/excel-export'
import type { ExportParams } from '@/components/common/ExportDialog'
import type { DashboardResponse } from '@/types/dashboard'
import type { FinancialAnalysisResponseV2, StorePLListResponse } from '@/types/financial'
import type { ManufacturingAnalysisResponse } from '@/types/manufacturing'

// =============================================================================
// 共通ヘルパー
// =============================================================================

function getPeriodLabel(
  periodType: 'monthly' | 'quarterly' | 'yearly',
  fiscalYear: number,
  month: number,
  quarter?: number
): string {
  if (periodType === 'monthly') {
    const calendarYear = month >= 9 ? fiscalYear - 1 : fiscalYear
    return `${calendarYear}年${month}月`
  } else if (periodType === 'quarterly') {
    return `${fiscalYear}年度Q${quarter}`
  } else {
    return `${fiscalYear}年度`
  }
}

/** scope に応じた月リストを取得 */
function getMonthsForScope(
  params: ExportParams,
  fiscalYear: number,
): string[] | null {
  if (params.scope === 'fiscal_year') {
    return getFiscalYearMonths(fiscalYear)
  }
  if (params.scope === 'custom' && params.startMonth && params.endMonth) {
    return getMonthRange(params.startMonth, params.endMonth)
  }
  return null // single period
}

/** カスタム期間のラベル */
function getCustomPeriodLabel(params: ExportParams, fiscalYear: number, periodType: string, month: number, quarter?: number): string {
  if (params.scope === 'current') {
    return getPeriodLabel(periodType as 'monthly' | 'quarterly' | 'yearly', fiscalYear, month, quarter)
  }
  if (params.scope === 'fiscal_year') {
    return `${fiscalYear}年度`
  }
  if (params.scope === 'custom' && params.startMonth && params.endMonth) {
    return `${getMonthLabel(params.startMonth)}〜${getMonthLabel(params.endMonth)}`
  }
  return `${fiscalYear}年度`
}

// =============================================================================
// ダッシュボード出力フック
// =============================================================================

export function useDashboardExport() {
  const exportData = useCallback(
    async (
      params: ExportParams,
      fiscalYear: number,
      currentMonth: number,
      periodType: 'monthly' | 'quarterly' | 'yearly',
      quarter?: number
    ) => {
      const sheets: StyledSheetData[] = []
      const months = getMonthsForScope(params, fiscalYear)

      if (months) {
        // 複数月データ取得
        const monthlyData: DashboardResponse[] = []
        for (const month of months) {
          const [, m] = month.split('-').map(Number)
          try {
            const data = await getDashboardData({
              period_type: 'monthly',
              year: fiscalYear,
              month: m,
            })
            monthlyData.push(data)
          } catch {
            // skip
          }
        }
        if (monthlyData.length > 0) {
          sheets.push(buildCompanySummarySheet(monthlyData, false))
          sheets.push(buildDepartmentSheet(monthlyData, false))
          sheets.push(buildCashFlowSheet(monthlyData, false))
          sheets.push(buildManagementIndicatorsSheet(monthlyData, false))
          sheets.push(buildSalesTrendSheet(monthlyData))
        }
      } else {
        // 単一期間
        const data = await getDashboardData({
          period_type: periodType,
          year: fiscalYear,
          month: periodType === 'monthly' ? currentMonth : undefined,
          quarter: periodType === 'quarterly' ? quarter : undefined,
        })
        sheets.push(buildCompanySummarySheet([data], true))
        sheets.push(buildDepartmentSheet([data], true))
        sheets.push(buildCashFlowSheet([data], true))
        sheets.push(buildManagementIndicatorsSheet([data], true))
        sheets.push(buildSalesTrendSheet([data]))
      }

      if (sheets.length === 0) throw new Error('出力するデータがありません')

      const periodLabel = getCustomPeriodLabel(params, fiscalYear, periodType, currentMonth, quarter)
      await downloadExcel({ filename: `ダッシュボード_${periodLabel}`, sheets })
    },
    []
  )
  return { exportData }
}

// --- ダッシュボード: 全社サマリーシート ---
function buildCompanySummarySheet(data: DashboardResponse[], single: boolean): StyledSheetData {
  return {
    name: '全社サマリー',
    build: (wb) => {
      const ws = wb.addWorksheet('全社サマリー')
      const subtitle = single
        ? getMonthLabel(data[0].company_summary.period)
        : `${getMonthLabel(data[0].company_summary.period)}〜${getMonthLabel(data[data.length - 1].company_summary.period)}`
      const colCount = single ? 6 : data.length + 1
      addTitle(ws, '全社サマリー', subtitle, colCount)

      if (single) {
        const s = data[0].company_summary
        // ヘッダー
        const hdr = ws.addRow(['項目', '実績', '目標', '達成率', '前年', '前年比'])
        applyHeaderStyle(hdr)

        const items: [string, any][] = [
          ['売上高', s.sales_total],
          ['粗利益', s.gross_profit],
          ['粗利率', s.gross_profit_rate],
          ['営業利益', s.operating_profit],
        ]
        for (const [label, m] of items) {
          const isRate = label === '粗利率'
          const row = ws.addRow([label])
          applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          if (isRate) {
            setPercentCell(row.getCell(2), m.value)
            setPercentCell(row.getCell(3), m.target)
            row.getCell(4).value = '-'
            setPercentCell(row.getCell(5), m.previous_year)
            row.getCell(6).value = '-'
          } else {
            setCurrencyCell(row.getCell(2), m.value)
            setCurrencyCell(row.getCell(3), m.target)
            setPercentCell(row.getCell(4), m.achievement_rate)
            setCurrencyCell(row.getCell(5), m.previous_year)
            setPercentCell(row.getCell(6), m.yoy_rate)
          }
        }

        // 列幅
        ws.getColumn(1).width = 15
        for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 15
      } else {
        // 月次横並び
        const hdr = ws.addRow(['項目', ...data.map((d) => getMonthLabel(d.company_summary.period))])
        applyHeaderStyle(hdr)

        const rows: [string, (d: DashboardResponse) => number | null][] = [
          ['売上高', (d) => d.company_summary.sales_total.value],
          ['売上高（目標）', (d) => d.company_summary.sales_total.target],
          ['売上高（前年）', (d) => d.company_summary.sales_total.previous_year],
          ['粗利益', (d) => d.company_summary.gross_profit.value],
          ['粗利益（目標）', (d) => d.company_summary.gross_profit.target],
          ['粗利益（前年）', (d) => d.company_summary.gross_profit.previous_year],
          ['営業利益', (d) => d.company_summary.operating_profit.value],
          ['営業利益（目標）', (d) => d.company_summary.operating_profit.target],
          ['営業利益（前年）', (d) => d.company_summary.operating_profit.previous_year],
        ]
        for (const [label, getter] of rows) {
          const row = ws.addRow([label, ...data.map(getter)])
          applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          for (let i = 2; i <= data.length + 1; i++) {
            row.getCell(i).numFmt = CURRENCY_FMT
          }
        }

        ws.getColumn(1).width = 18
        for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- ダッシュボード: 部門別実績シート ---
function buildDepartmentSheet(data: DashboardResponse[], single: boolean): StyledSheetData {
  return {
    name: '部門別実績',
    build: (wb) => {
      const ws = wb.addWorksheet('部門別実績')
      const colCount = single ? 6 : data.length + 2
      addTitle(ws, '部門別実績', '', colCount)

      if (single) {
        const hdr = ws.addRow(['部門', '売上高', '前年比', '利益', '達成率', '予算比'])
        applyHeaderStyle(hdr)

        for (const dept of data[0].department_performance) {
          const row = ws.addRow([dept.department])
          applyDataStyle(row)
          setCurrencyCell(row.getCell(2), dept.sales)
          setPercentCell(row.getCell(3), dept.sales_yoy_rate)
          setCurrencyCell(row.getCell(4), dept.profit)
          setPercentCell(row.getCell(5), dept.achievement_rate)
          setPercentCell(row.getCell(6), dept.budget_rate)
        }

        ws.getColumn(1).width = 12
        for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 14
      } else {
        const hdr = ws.addRow(['部門', '項目', ...data.map((d) => getMonthLabel(d.company_summary.period))])
        applyHeaderStyle(hdr)

        const deptNames = ['店舗', '通販']
        for (const dn of deptNames) {
          const r1 = ws.addRow([dn, '売上高', ...data.map((d) => d.department_performance.find((p) => p.department === dn)?.sales ?? null)])
          applyDataStyle(r1)
          r1.getCell(1).font = { bold: true, size: 10 }
          for (let i = 3; i <= data.length + 2; i++) r1.getCell(i).numFmt = CURRENCY_FMT

          const r2 = ws.addRow(['', '利益', ...data.map((d) => d.department_performance.find((p) => p.department === dn)?.profit ?? null)])
          applyDataStyle(r2)
          for (let i = 3; i <= data.length + 2; i++) r2.getCell(i).numFmt = CURRENCY_FMT

          ws.addRow([]) // spacer
        }

        ws.getColumn(1).width = 12
        ws.getColumn(2).width = 10
        for (let i = 3; i <= data.length + 2; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- ダッシュボード: キャッシュフローシート ---
function buildCashFlowSheet(data: DashboardResponse[], single: boolean): StyledSheetData {
  return {
    name: 'キャッシュフロー',
    build: (wb) => {
      const ws = wb.addWorksheet('キャッシュフロー')
      addTitle(ws, 'キャッシュフロー', '', single ? 4 : data.length + 1)

      if (single) {
        const cf = data[0].cash_flow
        const hdr = ws.addRow(['項目', '今期', '前年', '前々年'])
        applyHeaderStyle(hdr)

        const items: [string, number | null, number | null, number | null][] = [
          ['営業CF', cf.cf_operating, cf.cf_operating_prev, cf.cf_operating_prev2],
          ['投資CF', cf.cf_investing, cf.cf_investing_prev, cf.cf_investing_prev2],
          ['財務CF', cf.cf_financing, cf.cf_financing_prev, cf.cf_financing_prev2],
          ['フリーCF', cf.cf_free, cf.cf_free_prev, cf.cf_free_prev2],
        ]
        for (const [label, v1, v2, v3] of items) {
          const row = ws.addRow([label])
          const isFree = label === 'フリーCF'
          if (isFree) applyTotalStyle(row)
          else applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          setCurrencyCell(row.getCell(2), v1)
          setCurrencyCell(row.getCell(3), v2)
          setCurrencyCell(row.getCell(4), v3)
        }

        ws.getColumn(1).width = 12
        for (let i = 2; i <= 4; i++) ws.getColumn(i).width = 15
      } else {
        const hdr = ws.addRow(['項目', ...data.map((d) => getMonthLabel(d.company_summary.period))])
        applyHeaderStyle(hdr)

        const cfRows: [string, (d: DashboardResponse) => number | null][] = [
          ['営業CF', (d) => d.cash_flow.cf_operating],
          ['投資CF', (d) => d.cash_flow.cf_investing],
          ['財務CF', (d) => d.cash_flow.cf_financing],
          ['フリーCF', (d) => d.cash_flow.cf_free],
        ]
        for (const [label, getter] of cfRows) {
          const isFree = label === 'フリーCF'
          const row = ws.addRow([label, ...data.map(getter)])
          if (isFree) applyTotalStyle(row)
          else applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          for (let i = 2; i <= data.length + 1; i++) row.getCell(i).numFmt = CURRENCY_FMT
        }

        ws.getColumn(1).width = 12
        for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- ダッシュボード: 経営指標シート（新規） ---
function buildManagementIndicatorsSheet(data: DashboardResponse[], single: boolean): StyledSheetData {
  return {
    name: '経営指標',
    build: (wb) => {
      const ws = wb.addWorksheet('経営指標')
      addTitle(ws, '経営指標', '', single ? 6 : data.length + 1)

      if (single) {
        const mi = data[0].management_indicators
        const hdr = ws.addRow(['項目', '実績', '目標', '達成率', '前年', '前年差'])
        applyHeaderStyle(hdr)

        const items: [string, typeof mi.cost_rate, boolean][] = [
          ['原価率', mi.cost_rate, true],
          ['労務費率', mi.labor_cost_rate, true],
          ['客数', mi.customer_count, false],
          ['客単価', mi.customer_unit_price, false],
        ]
        for (const [label, m, isRate] of items) {
          const row = ws.addRow([label])
          applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          if (isRate) {
            setPercentCell(row.getCell(2), m.value)
            setPercentCell(row.getCell(3), m.target)
            setPercentCell(row.getCell(4), m.achievement_rate)
            setPercentCell(row.getCell(5), m.previous_year)
            if (m.yoy_diff != null) {
              row.getCell(6).value = m.yoy_diff / 100
              row.getCell(6).numFmt = PERCENT_FMT
            } else {
              row.getCell(6).value = '-'
            }
          } else {
            setCurrencyCell(row.getCell(2), m.value)
            setCurrencyCell(row.getCell(3), m.target)
            setPercentCell(row.getCell(4), m.achievement_rate)
            setCurrencyCell(row.getCell(5), m.previous_year)
            setCurrencyCell(row.getCell(6), m.yoy_diff)
          }
        }

        ws.getColumn(1).width = 12
        for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 14
      } else {
        const hdr = ws.addRow(['項目', ...data.map((d) => getMonthLabel(d.company_summary.period))])
        applyHeaderStyle(hdr)

        const rows: [string, (d: DashboardResponse) => number | null][] = [
          ['原価率', (d) => d.management_indicators.cost_rate.value],
          ['労務費率', (d) => d.management_indicators.labor_cost_rate.value],
          ['客数', (d) => d.management_indicators.customer_count.value],
          ['客単価', (d) => d.management_indicators.customer_unit_price.value],
        ]
        for (const [label, getter] of rows) {
          const isRate = label === '原価率' || label === '労務費率'
          const row = ws.addRow([label, ...data.map(getter)])
          applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          if (isRate) {
            for (let i = 2; i <= data.length + 1; i++) {
              const cell = row.getCell(i)
              if (typeof cell.value === 'number') {
                cell.value = (cell.value as number) / 100
                cell.numFmt = PERCENT_FMT
              }
            }
          } else {
            for (let i = 2; i <= data.length + 1; i++) row.getCell(i).numFmt = CURRENCY_FMT
          }
        }

        ws.getColumn(1).width = 12
        for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- ダッシュボード: 売上推移シート（新規） ---
function buildSalesTrendSheet(data: DashboardResponse[]): StyledSheetData {
  return {
    name: '売上推移',
    build: (wb) => {
      const ws = wb.addWorksheet('売上推移')
      const colCount = data.length + 1
      addTitle(ws, '売上推移', '', colCount)

      // chart_data があればそちらを使う（12ヶ月分）
      const firstChart = data[0].chart_data
      if (firstChart && firstChart.length > 0) {
        const hdr = ws.addRow(['項目', ...firstChart.map((c) => getMonthLabel(c.month))])
        applyHeaderStyle(hdr)

        const salesRow = ws.addRow(['売上高（実績）', ...firstChart.map((c) => c.sales)])
        applyDataStyle(salesRow)
        salesRow.getCell(1).font = { bold: true, size: 10 }
        for (let i = 2; i <= firstChart.length + 1; i++) salesRow.getCell(i).numFmt = CURRENCY_FMT

        const salesTargetRow = ws.addRow(['売上高（目標）', ...firstChart.map((c) => c.sales_target)])
        applyDataStyle(salesTargetRow)
        salesTargetRow.getCell(1).font = { bold: true, size: 10 }
        for (let i = 2; i <= firstChart.length + 1; i++) salesTargetRow.getCell(i).numFmt = CURRENCY_FMT

        const opRow = ws.addRow(['営業利益（実績）', ...firstChart.map((c) => c.operating_profit)])
        applyDataStyle(opRow)
        opRow.getCell(1).font = { bold: true, size: 10 }
        for (let i = 2; i <= firstChart.length + 1; i++) opRow.getCell(i).numFmt = CURRENCY_FMT

        const opTargetRow = ws.addRow(['営業利益（目標）', ...firstChart.map((c) => c.operating_profit_target)])
        applyDataStyle(opTargetRow)
        opTargetRow.getCell(1).font = { bold: true, size: 10 }
        for (let i = 2; i <= firstChart.length + 1; i++) opTargetRow.getCell(i).numFmt = CURRENCY_FMT

        ws.getColumn(1).width = 18
        for (let i = 2; i <= firstChart.length + 1; i++) ws.getColumn(i).width = 14
      } else {
        // chart_data がない場合はcompany_summaryから
        const hdr = ws.addRow(['項目', ...data.map((d) => getMonthLabel(d.company_summary.period))])
        applyHeaderStyle(hdr)

        const salesRow = ws.addRow(['売上高', ...data.map((d) => d.company_summary.sales_total.value)])
        applyDataStyle(salesRow)
        salesRow.getCell(1).font = { bold: true, size: 10 }
        for (let i = 2; i <= data.length + 1; i++) salesRow.getCell(i).numFmt = CURRENCY_FMT

        const opRow = ws.addRow(['営業利益', ...data.map((d) => d.company_summary.operating_profit.value)])
        applyDataStyle(opRow)
        opRow.getCell(1).font = { bold: true, size: 10 }
        for (let i = 2; i <= data.length + 1; i++) opRow.getCell(i).numFmt = CURRENCY_FMT

        ws.getColumn(1).width = 18
        for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// =============================================================================
// 財務分析出力フック
// =============================================================================

export function useFinancialExport() {
  const exportData = useCallback(
    async (
      params: ExportParams,
      fiscalYear: number,
      currentMonth: number,
      periodType: 'monthly' | 'quarterly' | 'yearly',
      quarter?: number
    ) => {
      const sheets: StyledSheetData[] = []
      const baseMonth = periodType === 'quarterly'
        ? [9, 12, 3, 6][quarter ? quarter - 1 : 0]
        : periodType === 'yearly' ? 9 : currentMonth
      const calendarYear = baseMonth >= 9 ? fiscalYear - 1 : fiscalYear
      const currentPeriod = `${calendarYear}-${String(baseMonth).padStart(2, '0')}-01`

      const months = getMonthsForScope(params, fiscalYear)

      if (months) {
        const monthlyFinanceData: { period: string; data: FinancialAnalysisResponseV2 }[] = []
        const monthlyStorePLData: { period: string; data: StorePLListResponse }[] = []

        for (const month of months) {
          try {
            const financeData = await getFinanceAnalysisV2(month, 'monthly')
            if (financeData?.current) monthlyFinanceData.push({ period: month, data: financeData })
          } catch { /* skip */ }
          try {
            const storePLData = await getStorePLList(month, 'store', 'monthly')
            if (storePLData?.stores?.length > 0) monthlyStorePLData.push({ period: month, data: storePLData })
          } catch { /* skip */ }
        }

        if (monthlyFinanceData.length > 0) sheets.push(buildFinancialSummarySheet(monthlyFinanceData))
        if (monthlyStorePLData.length > 0) sheets.push(buildStorePLSheet(monthlyStorePLData))
      } else {
        const v2PeriodType = periodType === 'monthly' ? 'monthly' : 'cumulative'
        try {
          const financeData = await getFinanceAnalysisV2(currentPeriod, v2PeriodType)
          const storePLData = await getStorePLList(currentPeriod, 'store', periodType)
          sheets.push(buildFinancialSummarySheet([{ period: currentPeriod, data: financeData }]))
          sheets.push(buildStorePLSheet([{ period: currentPeriod, data: storePLData }]))
        } catch (err) {
          console.error('Failed to fetch financial data:', err)
        }
      }

      if (sheets.length === 0) throw new Error('出力するデータがありません')

      const periodLabel = getCustomPeriodLabel(params, fiscalYear, periodType, currentMonth, quarter)
      await downloadExcel({ filename: `財務分析_${periodLabel}`, sheets })
    },
    []
  )
  return { exportData }
}

// --- 財務: 損益計算書シート ---
function buildFinancialSummarySheet(
  data: { period: string; data: FinancialAnalysisResponseV2 }[]
): StyledSheetData {
  return {
    name: '損益計算書',
    build: (wb) => {
      const ws = wb.addWorksheet('損益計算書')

      if (data.length === 1) {
        // 単一期間: 全P&L展開
        const { current, previous_year, target } = data[0].data
        const colCount = 6
        addTitle(ws, '損益計算書', getMonthLabel(data[0].period), colCount)

        const hdr = ws.addRow(['項目', '今期', '目標', '達成率', '前年', '前年比'])
        applyHeaderStyle(hdr)

        const salesTotal = Number(current.sales_total) || 0
        const prevSalesTotal = Number(previous_year?.sales_total) || 0

        // P&L項目定義: [label, currentValue, targetValue, prevValue, isSection, isSubtotal, isDetail]
        type PLRow = [string, number | null, number | null, number | null, boolean, boolean, boolean]
        const cosDetail = current.cost_of_sales_detail
        const prevCosDetail = previous_year?.cost_of_sales_detail
        const sgaDetail = current.sga_detail
        const prevSgaDetail = previous_year?.sga_detail

        const plRows: PLRow[] = [
          ['売上高', Number(current.sales_total), Number(target?.sales_total), Number(previous_year?.sales_total), false, true, false],
          ['　店舗売上', Number(current.sales_store), Number(target?.sales_store), Number(previous_year?.sales_store), false, false, true],
          ['　通販売上', Number(current.sales_online), Number(target?.sales_online), Number(previous_year?.sales_online), false, false, true],
          ['売上原価', Number(current.cost_of_sales), Number(target?.cost_of_sales), Number(previous_year?.cost_of_sales), true, false, false],
          ['　仕入高', cosDetail?.purchases ?? null, null, prevCosDetail?.purchases ?? null, false, false, true],
          ['　原材料仕入高', cosDetail?.raw_material_purchases ?? null, null, prevCosDetail?.raw_material_purchases ?? null, false, false, true],
          ['　労務費', cosDetail?.labor_cost ?? null, null, prevCosDetail?.labor_cost ?? null, false, false, true],
          ['　消耗品費', cosDetail?.consumables ?? null, null, prevCosDetail?.consumables ?? null, false, false, true],
          ['　賃借料', cosDetail?.rent ?? null, null, prevCosDetail?.rent ?? null, false, false, true],
          ['　修繕費', cosDetail?.repairs ?? null, null, prevCosDetail?.repairs ?? null, false, false, true],
          ['　水道光熱費', cosDetail?.utilities ?? null, null, prevCosDetail?.utilities ?? null, false, false, true],
          ['　その他', cosDetail?.others ?? null, null, prevCosDetail?.others ?? null, false, false, true],
          ['売上総利益', Number(current.gross_profit), Number(target?.gross_profit), Number(previous_year?.gross_profit), false, true, false],
          ['販管費計', Number(current.sga_total), Number(target?.sga_total), Number(previous_year?.sga_total), true, false, false],
          ['　役員報酬', sgaDetail?.executive_compensation ?? null, null, prevSgaDetail?.executive_compensation ?? null, false, false, true],
          ['　人件費', sgaDetail?.personnel_cost ?? null, null, prevSgaDetail?.personnel_cost ?? null, false, false, true],
          ['　配送費', sgaDetail?.delivery_cost ?? null, null, prevSgaDetail?.delivery_cost ?? null, false, false, true],
          ['　包装費', sgaDetail?.packaging_cost ?? null, null, prevSgaDetail?.packaging_cost ?? null, false, false, true],
          ['　支払手数料', sgaDetail?.payment_fees ?? null, null, prevSgaDetail?.payment_fees ?? null, false, false, true],
          ['　荷造運賃費', sgaDetail?.freight_cost ?? null, null, prevSgaDetail?.freight_cost ?? null, false, false, true],
          ['　販売手数料', sgaDetail?.sales_commission ?? null, null, prevSgaDetail?.sales_commission ?? null, false, false, true],
          ['　広告宣伝費', sgaDetail?.advertising_cost ?? null, null, prevSgaDetail?.advertising_cost ?? null, false, false, true],
          ['　その他', sgaDetail?.others ?? null, null, prevSgaDetail?.others ?? null, false, false, true],
          ['営業利益', Number(current.operating_profit), Number(target?.operating_profit), Number(previous_year?.operating_profit), false, true, false],
        ]

        for (const [label, curVal, tgtVal, prevVal, isSection, isSubtotal, isDetail] of plRows) {
          const row = ws.addRow([label])
          if (isSection) applySectionStyle(row)
          else if (isSubtotal) applyTotalStyle(row)
          else applyDataStyle(row)

          if (isDetail) {
            row.getCell(1).alignment = { indent: 1 }
          }

          setCurrencyCell(row.getCell(2), curVal)
          setCurrencyCell(row.getCell(3), tgtVal)

          // 達成率
          if (curVal != null && tgtVal != null && tgtVal !== 0) {
            setPercentCell(row.getCell(4), (curVal / tgtVal) * 100)
          } else {
            row.getCell(4).value = '-'
          }

          setCurrencyCell(row.getCell(5), prevVal)

          // 前年比
          if (curVal != null && prevVal != null && prevVal !== 0) {
            setPercentCell(row.getCell(6), (curVal / prevVal) * 100)
          } else {
            row.getCell(6).value = '-'
          }
        }

        ws.getColumn(1).width = 18
        for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 15
      } else {
        // 月次データ横並び: 全明細行
        const colCount = data.length + 1
        addTitle(ws, '損益計算書', `${getMonthLabel(data[0].period)}〜${getMonthLabel(data[data.length - 1].period)}`, colCount)

        const hdr = ws.addRow(['項目', ...data.map((d) => getMonthLabel(d.period))])
        applyHeaderStyle(hdr)

        type MonthlyPLRow = [string, (d: FinancialAnalysisResponseV2) => number | null, boolean, boolean, boolean]
        const plRows: MonthlyPLRow[] = [
          ['売上高', (d) => Number(d.current.sales_total), false, true, false],
          ['　店舗売上', (d) => Number(d.current.sales_store), false, false, true],
          ['　通販売上', (d) => Number(d.current.sales_online), false, false, true],
          ['売上原価', (d) => Number(d.current.cost_of_sales), true, false, false],
          ['　仕入高', (d) => d.current.cost_of_sales_detail?.purchases ?? null, false, false, true],
          ['　原材料仕入高', (d) => d.current.cost_of_sales_detail?.raw_material_purchases ?? null, false, false, true],
          ['　労務費', (d) => d.current.cost_of_sales_detail?.labor_cost ?? null, false, false, true],
          ['　消耗品費', (d) => d.current.cost_of_sales_detail?.consumables ?? null, false, false, true],
          ['　賃借料', (d) => d.current.cost_of_sales_detail?.rent ?? null, false, false, true],
          ['　修繕費', (d) => d.current.cost_of_sales_detail?.repairs ?? null, false, false, true],
          ['　水道光熱費', (d) => d.current.cost_of_sales_detail?.utilities ?? null, false, false, true],
          ['　その他', (d) => d.current.cost_of_sales_detail?.others ?? null, false, false, true],
          ['売上総利益', (d) => Number(d.current.gross_profit), false, true, false],
          ['販管費計', (d) => Number(d.current.sga_total), true, false, false],
          ['　役員報酬', (d) => d.current.sga_detail?.executive_compensation ?? null, false, false, true],
          ['　人件費', (d) => d.current.sga_detail?.personnel_cost ?? null, false, false, true],
          ['　配送費', (d) => d.current.sga_detail?.delivery_cost ?? null, false, false, true],
          ['　包装費', (d) => d.current.sga_detail?.packaging_cost ?? null, false, false, true],
          ['　支払手数料', (d) => d.current.sga_detail?.payment_fees ?? null, false, false, true],
          ['　荷造運賃費', (d) => d.current.sga_detail?.freight_cost ?? null, false, false, true],
          ['　販売手数料', (d) => d.current.sga_detail?.sales_commission ?? null, false, false, true],
          ['　広告宣伝費', (d) => d.current.sga_detail?.advertising_cost ?? null, false, false, true],
          ['　その他', (d) => d.current.sga_detail?.others ?? null, false, false, true],
          ['営業利益', (d) => Number(d.current.operating_profit), false, true, false],
        ]

        for (const [label, getter, isSection, isSubtotal, isDetail] of plRows) {
          const values = data.map((d) => getter(d.data))
          const row = ws.addRow([label, ...values])
          if (isSection) applySectionStyle(row)
          else if (isSubtotal) applyTotalStyle(row)
          else applyDataStyle(row)
          if (isDetail) row.getCell(1).alignment = { indent: 1 }
          for (let i = 2; i <= data.length + 1; i++) row.getCell(i).numFmt = CURRENCY_FMT
        }

        ws.getColumn(1).width = 18
        for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- 財務: 店舗別収支シート ---
function buildStorePLSheet(
  data: { period: string; data: StorePLListResponse }[]
): StyledSheetData {
  return {
    name: '店舗別収支',
    build: (wb) => {
      const ws = wb.addWorksheet('店舗別収支')

      if (data.length === 1) {
        const { stores, total_sales, total_gross_profit, total_operating_profit, total_cost_of_sales, total_sga } = data[0].data
        const colCount = 12
        addTitle(ws, '店舗別収支', getMonthLabel(data[0].period), colCount)

        const hdr = ws.addRow([
          '店舗名', '売上高', '売上原価', '粗利益', '販管費計',
          '人件費', '地代家賃', '賃借料', '水道光熱費', 'その他',
          '営業利益', '粗利率',
        ])
        applyHeaderStyle(hdr)

        for (const store of stores) {
          const sales = Number(store.sales) || 0
          const grossProfit = Number(store.gross_profit) || 0
          const row = ws.addRow([store.store_name])
          applyDataStyle(row)
          setCurrencyCell(row.getCell(2), Number(store.sales))
          setCurrencyCell(row.getCell(3), Number(store.cost_of_sales))
          setCurrencyCell(row.getCell(4), Number(store.gross_profit))
          setCurrencyCell(row.getCell(5), Number(store.sga_total))
          setCurrencyCell(row.getCell(6), store.sga_detail?.personnel_cost ?? null)
          setCurrencyCell(row.getCell(7), store.sga_detail?.land_rent ?? null)
          setCurrencyCell(row.getCell(8), store.sga_detail?.lease_cost ?? null)
          setCurrencyCell(row.getCell(9), store.sga_detail?.utilities ?? null)
          setCurrencyCell(row.getCell(10), store.sga_detail?.others ?? null)
          setCurrencyCell(row.getCell(11), Number(store.operating_profit))
          setPercentCell(row.getCell(12), sales > 0 ? (grossProfit / sales) * 100 : null)
        }

        // 合計行
        const totalRow = ws.addRow(['合計'])
        applyTotalStyle(totalRow)
        setCurrencyCell(totalRow.getCell(2), total_sales)
        setCurrencyCell(totalRow.getCell(3), total_cost_of_sales)
        setCurrencyCell(totalRow.getCell(4), total_gross_profit)
        setCurrencyCell(totalRow.getCell(5), total_sga)
        totalRow.getCell(6).value = '-'
        totalRow.getCell(7).value = '-'
        totalRow.getCell(8).value = '-'
        totalRow.getCell(9).value = '-'
        totalRow.getCell(10).value = '-'
        setCurrencyCell(totalRow.getCell(11), total_operating_profit)
        const ts = Number(total_sales) || 0
        const tg = Number(total_gross_profit) || 0
        setPercentCell(totalRow.getCell(12), ts > 0 ? (tg / ts) * 100 : null)

        ws.getColumn(1).width = 15
        for (let i = 2; i <= 12; i++) ws.getColumn(i).width = 13
      } else {
        // 月次: 店舗ごと
        const allStoreNames = new Set<string>()
        for (const d of data) for (const s of d.data.stores) allStoreNames.add(s.store_name)

        const colCount = data.length + 2
        addTitle(ws, '店舗別収支', `${getMonthLabel(data[0].period)}〜${getMonthLabel(data[data.length - 1].period)}`, colCount)

        const hdr = ws.addRow(['店舗', '項目', ...data.map((d) => getMonthLabel(d.period))])
        applyHeaderStyle(hdr)

        for (const storeName of allStoreNames) {
          const salesRow = ws.addRow([storeName, '売上高', ...data.map((d) => {
            const s = d.data.stores.find((s) => s.store_name === storeName)
            return s ? Number(s.sales) : null
          })])
          applyDataStyle(salesRow)
          salesRow.getCell(1).font = { bold: true, size: 10 }
          for (let i = 3; i <= data.length + 2; i++) salesRow.getCell(i).numFmt = CURRENCY_FMT

          const gpRow = ws.addRow(['', '粗利益', ...data.map((d) => {
            const s = d.data.stores.find((s) => s.store_name === storeName)
            return s ? Number(s.gross_profit) : null
          })])
          applyDataStyle(gpRow)
          for (let i = 3; i <= data.length + 2; i++) gpRow.getCell(i).numFmt = CURRENCY_FMT

          const opRow = ws.addRow(['', '営業利益', ...data.map((d) => {
            const s = d.data.stores.find((s) => s.store_name === storeName)
            return s ? Number(s.operating_profit) : null
          })])
          applyDataStyle(opRow)
          for (let i = 3; i <= data.length + 2; i++) opRow.getCell(i).numFmt = CURRENCY_FMT

          ws.addRow([])
        }

        ws.getColumn(1).width = 15
        ws.getColumn(2).width = 12
        for (let i = 3; i <= data.length + 2; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// =============================================================================
// 店舗分析出力フック
// =============================================================================

export function useStoreAnalysisExport() {
  const exportData = useCallback(
    async (
      params: ExportParams,
      fiscalYear: number,
      currentPeriod: string
    ) => {
      const sheets: StyledSheetData[] = []
      const months = getMonthsForScope(params, fiscalYear)

      if (months) {
        const monthlyData: { period: string; data: any }[] = []
        for (const month of months) {
          try {
            const storeData = await getStoreSummary(month, 'store', 'monthly')
            if (storeData?.stores?.length > 0) monthlyData.push({ period: month, data: storeData })
          } catch { /* skip */ }
        }
        if (monthlyData.length > 0) sheets.push(buildStoreAnalysisSheet(monthlyData))
      } else {
        try {
          const storeData = await getStoreSummary(currentPeriod, 'store', 'monthly')
          if (storeData) sheets.push(buildStoreAnalysisSheet([{ period: currentPeriod, data: storeData }]))
        } catch (err) {
          console.error('Failed to fetch store data:', err)
        }
      }

      if (sheets.length === 0) throw new Error('出力するデータがありません')

      const periodLabel = params.scope === 'current'
        ? getMonthLabel(currentPeriod)
        : params.scope === 'custom' && params.startMonth && params.endMonth
          ? `${getMonthLabel(params.startMonth)}〜${getMonthLabel(params.endMonth)}`
          : `${fiscalYear}年度`
      await downloadExcel({ filename: `店舗分析_${periodLabel}`, sheets })
    },
    []
  )
  return { exportData }
}

// --- 店舗分析シート ---
function buildStoreAnalysisSheet(data: { period: string; data: any }[]): StyledSheetData {
  return {
    name: '店舗別実績',
    build: (wb) => {
      const ws = wb.addWorksheet('店舗別実績')

      if (data.length === 1) {
        const { stores, totals } = data[0].data
        const colCount = 7
        addTitle(ws, '店舗別実績', getMonthLabel(data[0].period), colCount)

        const hdr = ws.addRow(['店舗', '売上高', '客数', '客単価', '前年売上', '前年比', '前年差'])
        applyHeaderStyle(hdr)

        for (const store of stores || []) {
          const row = ws.addRow([store.store_name])
          applyDataStyle(row)
          setCurrencyCell(row.getCell(2), store.sales)
          setCurrencyCell(row.getCell(3), store.customers)
          setCurrencyCell(row.getCell(4), store.unit_price)
          setCurrencyCell(row.getCell(5), store.sales_previous_year)
          setPercentCell(row.getCell(6), store.sales_yoy)
          const diff = store.sales != null && store.sales_previous_year != null
            ? store.sales - store.sales_previous_year : null
          setCurrencyCell(row.getCell(7), diff)
        }

        if (totals) {
          const totalRow = ws.addRow(['合計'])
          applyTotalStyle(totalRow)
          setCurrencyCell(totalRow.getCell(2), totals.sales)
          setCurrencyCell(totalRow.getCell(3), totals.customers)
          setCurrencyCell(totalRow.getCell(4), totals.unit_price)
          setCurrencyCell(totalRow.getCell(5), totals.sales_previous_year)
          setPercentCell(totalRow.getCell(6), totals.sales_yoy)
          const diff = totals.sales != null && totals.sales_previous_year != null
            ? totals.sales - totals.sales_previous_year : null
          setCurrencyCell(totalRow.getCell(7), diff)
        }

        ws.getColumn(1).width = 15
        for (let i = 2; i <= 7; i++) ws.getColumn(i).width = 13
      } else {
        const allStoreNames = new Set<string>()
        for (const d of data) for (const s of d.data.stores || []) allStoreNames.add(s.store_name)

        const colCount = data.length + 2
        addTitle(ws, '店舗別実績', `${getMonthLabel(data[0].period)}〜${getMonthLabel(data[data.length - 1].period)}`, colCount)

        const hdr = ws.addRow(['店舗', '項目', ...data.map((d) => getMonthLabel(d.period))])
        applyHeaderStyle(hdr)

        for (const storeName of allStoreNames) {
          const salesRow = ws.addRow([storeName, '売上高', ...data.map((d) => {
            const s = (d.data.stores || []).find((s: any) => s.store_name === storeName)
            return s?.sales ?? null
          })])
          applyDataStyle(salesRow)
          salesRow.getCell(1).font = { bold: true, size: 10 }
          for (let i = 3; i <= data.length + 2; i++) salesRow.getCell(i).numFmt = CURRENCY_FMT

          const custRow = ws.addRow(['', '客数', ...data.map((d) => {
            const s = (d.data.stores || []).find((s: any) => s.store_name === storeName)
            return s?.customers ?? null
          })])
          applyDataStyle(custRow)
          for (let i = 3; i <= data.length + 2; i++) custRow.getCell(i).numFmt = CURRENCY_FMT

          const upRow = ws.addRow(['', '客単価', ...data.map((d) => {
            const s = (d.data.stores || []).find((s: any) => s.store_name === storeName)
            return s?.unit_price ?? null
          })])
          applyDataStyle(upRow)
          for (let i = 3; i <= data.length + 2; i++) upRow.getCell(i).numFmt = CURRENCY_FMT

          ws.addRow([])
        }

        ws.getColumn(1).width = 15
        ws.getColumn(2).width = 10
        for (let i = 3; i <= data.length + 2; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// =============================================================================
// 通販分析出力フック
// =============================================================================

export function useEcommerceExport() {
  const exportData = useCallback(
    async (
      params: ExportParams,
      fiscalYear: number,
      currentPeriod: string,
      periodType: 'monthly' | 'cumulative' = 'monthly'
    ) => {
      const sheets: StyledSheetData[] = []
      const months = getMonthsForScope(params, fiscalYear)

      if (months) {
        // 複数月: チャネルデータ
        const monthlyData: { period: string; data: any }[] = []
        for (const month of months) {
          try {
            const channelData = await getChannelSummary(month, 'monthly')
            if (channelData?.channels?.length > 0) monthlyData.push({ period: month, data: channelData })
          } catch { /* skip */ }
        }
        if (monthlyData.length > 0) sheets.push(buildEcommerceSheet(monthlyData))

        // 商品別・顧客統計・HPアクセスは最後の月で取得
        const lastMonth = months[months.length - 1]
        try {
          const productData = await getProductSummary(lastMonth, 'monthly')
          if (productData?.products?.length > 0) sheets.push(buildProductSheet(productData, lastMonth))
        } catch { /* skip */ }
        try {
          const customerData = await getCustomerSummary(lastMonth, 'monthly')
          if (customerData?.data) sheets.push(buildCustomerSheet(customerData, lastMonth))
        } catch { /* skip */ }
        try {
          const websiteData = await getWebsiteStats(lastMonth, 'monthly')
          if (websiteData?.data) sheets.push(buildWebsiteSheet(websiteData, lastMonth))
        } catch { /* skip */ }
      } else {
        // 単一期間
        try {
          const channelData = await getChannelSummary(currentPeriod, periodType)
          if (channelData) sheets.push(buildEcommerceSheet([{ period: currentPeriod, data: channelData }]))
        } catch (err) {
          console.error('Failed to fetch ecommerce data:', err)
        }

        try {
          const productData = await getProductSummary(currentPeriod, periodType)
          if (productData?.products?.length > 0) sheets.push(buildProductSheet(productData, currentPeriod))
        } catch { /* skip */ }
        try {
          const customerData = await getCustomerSummary(currentPeriod, periodType)
          if (customerData?.data) sheets.push(buildCustomerSheet(customerData, currentPeriod))
        } catch { /* skip */ }
        try {
          const websiteData = await getWebsiteStats(currentPeriod, periodType)
          if (websiteData?.data) sheets.push(buildWebsiteSheet(websiteData, currentPeriod))
        } catch { /* skip */ }
      }

      if (sheets.length === 0) throw new Error('出力するデータがありません')

      const periodLabel = params.scope === 'current'
        ? getMonthLabel(currentPeriod)
        : params.scope === 'custom' && params.startMonth && params.endMonth
          ? `${getMonthLabel(params.startMonth)}〜${getMonthLabel(params.endMonth)}`
          : `${fiscalYear}年度`
      await downloadExcel({ filename: `通販分析_${periodLabel}`, sheets })
    },
    []
  )
  return { exportData }
}

// --- 通販: チャネル別実績シート ---
function buildEcommerceSheet(data: { period: string; data: any }[]): StyledSheetData {
  return {
    name: 'チャネル別実績',
    build: (wb) => {
      const ws = wb.addWorksheet('チャネル別実績')

      if (data.length === 1) {
        const { channels, totals } = data[0].data
        const colCount = 14
        addTitle(ws, 'チャネル別実績', getMonthLabel(data[0].period), colCount)

        const hdr = ws.addRow([
          'チャネル', '売上高', '目標', '達成率', '前年', '前年比', '2年前',
          '購入者数', '目標', '達成率', '前年', '前年比',
          '客単価', '前年',
        ])
        applyHeaderStyle(hdr)

        for (const ch of channels || []) {
          const row = ws.addRow([ch.channel ?? ch.channel_name])
          applyDataStyle(row)
          setCurrencyCell(row.getCell(2), ch.sales)
          setCurrencyCell(row.getCell(3), ch.sales_target ?? ch.target_sales)
          setPercentCell(row.getCell(4), ch.sales_achievement_rate ?? ch.achievement_rate)
          setCurrencyCell(row.getCell(5), ch.sales_previous_year)
          setPercentCell(row.getCell(6), ch.sales_yoy)
          setCurrencyCell(row.getCell(7), ch.sales_two_years_ago)
          setCurrencyCell(row.getCell(8), ch.buyers)
          setCurrencyCell(row.getCell(9), ch.buyers_target)
          setPercentCell(row.getCell(10), ch.buyers_achievement_rate)
          setCurrencyCell(row.getCell(11), ch.buyers_previous_year)
          setPercentCell(row.getCell(12), ch.buyers_yoy)
          setCurrencyCell(row.getCell(13), ch.unit_price)
          setCurrencyCell(row.getCell(14), ch.unit_price_previous_year)
        }

        if (totals) {
          const totalRow = ws.addRow(['合計'])
          applyTotalStyle(totalRow)
          setCurrencyCell(totalRow.getCell(2), totals.sales)
          setCurrencyCell(totalRow.getCell(3), totals.sales_target ?? totals.target_sales)
          setPercentCell(totalRow.getCell(4), totals.sales_achievement_rate ?? totals.achievement_rate)
          setCurrencyCell(totalRow.getCell(5), totals.sales_previous_year)
          setPercentCell(totalRow.getCell(6), totals.sales_yoy)
          setCurrencyCell(totalRow.getCell(7), totals.sales_two_years_ago)
          setCurrencyCell(totalRow.getCell(8), totals.buyers)
          setCurrencyCell(totalRow.getCell(9), totals.buyers_target)
          setPercentCell(totalRow.getCell(10), totals.buyers_achievement_rate)
          setCurrencyCell(totalRow.getCell(11), totals.buyers_previous_year)
          setPercentCell(totalRow.getCell(12), totals.buyers_yoy)
          setCurrencyCell(totalRow.getCell(13), totals.unit_price)
          setCurrencyCell(totalRow.getCell(14), totals.unit_price_previous_year)
        }

        ws.getColumn(1).width = 14
        for (let i = 2; i <= 14; i++) ws.getColumn(i).width = 12
      } else {
        // 月次横並び
        const allChannelNames = new Set<string>()
        for (const d of data) for (const ch of d.data.channels || []) allChannelNames.add(ch.channel ?? ch.channel_name)

        const colCount = data.length + 2
        addTitle(ws, 'チャネル別実績', `${getMonthLabel(data[0].period)}〜${getMonthLabel(data[data.length - 1].period)}`, colCount)

        const hdr = ws.addRow(['チャネル', '項目', ...data.map((d) => getMonthLabel(d.period))])
        applyHeaderStyle(hdr)

        for (const chName of allChannelNames) {
          const salesRow = ws.addRow([chName, '売上高', ...data.map((d) => {
            const ch = (d.data.channels || []).find((c: any) => (c.channel ?? c.channel_name) === chName)
            return ch?.sales ?? null
          })])
          applyDataStyle(salesRow)
          salesRow.getCell(1).font = { bold: true, size: 10 }
          for (let i = 3; i <= data.length + 2; i++) salesRow.getCell(i).numFmt = CURRENCY_FMT

          const buyRow = ws.addRow(['', '購入者数', ...data.map((d) => {
            const ch = (d.data.channels || []).find((c: any) => (c.channel ?? c.channel_name) === chName)
            return ch?.buyers ?? null
          })])
          applyDataStyle(buyRow)
          for (let i = 3; i <= data.length + 2; i++) buyRow.getCell(i).numFmt = CURRENCY_FMT

          const upRow = ws.addRow(['', '客単価', ...data.map((d) => {
            const ch = (d.data.channels || []).find((c: any) => (c.channel ?? c.channel_name) === chName)
            return ch?.unit_price ?? null
          })])
          applyDataStyle(upRow)
          for (let i = 3; i <= data.length + 2; i++) upRow.getCell(i).numFmt = CURRENCY_FMT

          ws.addRow([])
        }

        // 合計
        const totSalesRow = ws.addRow(['合計', '売上高', ...data.map((d) => d.data.totals?.sales ?? null)])
        applyTotalStyle(totSalesRow)
        for (let i = 3; i <= data.length + 2; i++) totSalesRow.getCell(i).numFmt = CURRENCY_FMT

        const totBuyRow = ws.addRow(['', '購入者数', ...data.map((d) => d.data.totals?.buyers ?? null)])
        applyTotalStyle(totBuyRow)
        for (let i = 3; i <= data.length + 2; i++) totBuyRow.getCell(i).numFmt = CURRENCY_FMT

        ws.getColumn(1).width = 14
        ws.getColumn(2).width = 10
        for (let i = 3; i <= data.length + 2; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- 通販: 商品別売上シート（新規） ---
function buildProductSheet(productData: any, period: string): StyledSheetData {
  return {
    name: '商品別売上',
    build: (wb) => {
      const ws = wb.addWorksheet('商品別売上')
      const colCount = 7
      addTitle(ws, '商品別売上', getMonthLabel(period), colCount)

      const hdr = ws.addRow(['商品名', 'カテゴリ', '売上高', '前年', '前年比', '数量', '前年数量'])
      applyHeaderStyle(hdr)

      for (const p of productData.products || []) {
        const row = ws.addRow([p.product_name, p.product_category ?? '-'])
        applyDataStyle(row)
        setCurrencyCell(row.getCell(3), p.sales)
        setCurrencyCell(row.getCell(4), p.sales_previous_year)
        setPercentCell(row.getCell(5), p.sales_yoy)
        setCurrencyCell(row.getCell(6), p.quantity)
        setCurrencyCell(row.getCell(7), p.quantity_previous_year)
      }

      // 合計行
      if (productData.total_sales != null) {
        const totalRow = ws.addRow(['合計', ''])
        applyTotalStyle(totalRow)
        setCurrencyCell(totalRow.getCell(3), productData.total_sales)
        setCurrencyCell(totalRow.getCell(4), productData.total_sales_previous_year)
        totalRow.getCell(5).value = '-'
        totalRow.getCell(6).value = '-'
        totalRow.getCell(7).value = '-'
      }

      ws.getColumn(1).width = 20
      ws.getColumn(2).width = 14
      for (let i = 3; i <= 7; i++) ws.getColumn(i).width = 13
    },
  }
}

// --- 通販: 顧客統計シート（新規） ---
function buildCustomerSheet(customerData: any, period: string): StyledSheetData {
  return {
    name: '顧客統計',
    build: (wb) => {
      const ws = wb.addWorksheet('顧客統計')
      const colCount = 6
      addTitle(ws, '顧客統計', getMonthLabel(period), colCount)

      const hdr = ws.addRow(['項目', '実績', '目標', '達成率', '前年', '前年比'])
      applyHeaderStyle(hdr)

      const d = customerData.data
      const items: [string, number | null, number | null, number | null, number | null, number | null, boolean][] = [
        ['新規顧客数', d.new_customers, d.new_customers_target, d.new_customers_achievement_rate, d.new_customers_previous_year, d.new_customers_yoy, false],
        ['リピーター数', d.repeat_customers, d.repeat_customers_target, d.repeat_customers_achievement_rate, d.repeat_customers_previous_year, d.repeat_customers_yoy, false],
        ['顧客合計', d.total_customers, d.total_customers_target, d.total_customers_achievement_rate, d.total_customers_previous_year, null, false],
        ['リピート率', d.repeat_rate, null, null, d.repeat_rate_previous_year, null, true],
      ]

      for (const [label, actual, target, achievement, prev, yoy, isRate] of items) {
        const isTotal = label === '顧客合計'
        const row = ws.addRow([label])
        if (isTotal) applyTotalStyle(row)
        else applyDataStyle(row)
        row.getCell(1).font = { bold: true, size: 10 }

        if (isRate) {
          setPercentCell(row.getCell(2), actual)
          row.getCell(3).value = '-'
          row.getCell(4).value = '-'
          setPercentCell(row.getCell(5), prev)
          row.getCell(6).value = '-'
        } else {
          setCurrencyCell(row.getCell(2), actual)
          setCurrencyCell(row.getCell(3), target)
          setPercentCell(row.getCell(4), achievement)
          setCurrencyCell(row.getCell(5), prev)
          setPercentCell(row.getCell(6), yoy)
        }
      }

      ws.getColumn(1).width = 14
      for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 13
    },
  }
}

// --- 通販: HPアクセス数シート（新規） ---
function buildWebsiteSheet(websiteData: any, period: string): StyledSheetData {
  return {
    name: 'HPアクセス数',
    build: (wb) => {
      const ws = wb.addWorksheet('HPアクセス数')
      const colCount = 5
      addTitle(ws, 'HPアクセス数', getMonthLabel(period), colCount)

      const hdr = ws.addRow(['項目', '実績', '前年', '前年比', '2年前'])
      applyHeaderStyle(hdr)

      const d = websiteData.data
      const items: [string, number | null, number | null, number | null, number | null][] = [
        ['PV数', d.page_views, d.page_views_previous_year, d.page_views_yoy, d.page_views_two_years_ago],
        ['UU数', d.unique_visitors, d.unique_visitors_previous_year, d.unique_visitors_yoy, d.unique_visitors_two_years_ago],
        ['セッション数', d.sessions, d.sessions_previous_year, d.sessions_yoy, d.sessions_two_years_ago],
      ]

      for (const [label, actual, prev, yoy, twoYearsAgo] of items) {
        const row = ws.addRow([label])
        applyDataStyle(row)
        row.getCell(1).font = { bold: true, size: 10 }
        setCurrencyCell(row.getCell(2), actual)
        setCurrencyCell(row.getCell(3), prev)
        setPercentCell(row.getCell(4), yoy)
        setCurrencyCell(row.getCell(5), twoYearsAgo)
      }

      ws.getColumn(1).width = 14
      for (let i = 2; i <= 5; i++) ws.getColumn(i).width = 14
    },
  }
}

// =============================================================================
// 製造分析出力フック（新規）
// =============================================================================

export function useManufacturingExport() {
  const exportData = useCallback(
    async (
      params: ExportParams,
      fiscalYear: number,
      currentMonth: number,
      periodType: 'monthly' | 'quarterly' | 'yearly',
      quarter?: number
    ) => {
      const sheets: StyledSheetData[] = []
      const months = getMonthsForScope(params, fiscalYear)

      if (months) {
        // 複数月: 月ごとにサマリー取得し横並び
        const monthlyData: { period: string; data: ManufacturingAnalysisResponse }[] = []
        for (const month of months) {
          const [y, m] = month.split('-').map(Number)
          const fy = m >= 9 ? y + 1 : y
          try {
            const mfgData = await getManufacturingAnalysis({
              period_type: 'monthly',
              year: fy,
              month: m,
            })
            if (mfgData?.summary) monthlyData.push({ period: month, data: mfgData })
          } catch { /* skip */ }
        }
        if (monthlyData.length > 0) {
          sheets.push(buildManufacturingSummarySheet(monthlyData))
          // 比較データ（最後の月のcomparison）
          const lastData = monthlyData[monthlyData.length - 1].data
          if (lastData.comparison) {
            sheets.push(buildManufacturingComparisonSheet(lastData.comparison, monthlyData[monthlyData.length - 1].period))
          }
        }
      } else {
        // 単一期間
        const mfgData = await getManufacturingAnalysis({
          period_type: periodType,
          year: fiscalYear,
          month: periodType === 'monthly' ? currentMonth : undefined,
          quarter: periodType === 'quarterly' ? quarter : undefined,
        })

        if (mfgData?.summary) {
          sheets.push(buildManufacturingSummarySheet([{ period: mfgData.period, data: mfgData }]))
        }

        // 日次データ（単月の場合のみ）
        if (periodType === 'monthly' && mfgData?.daily_data?.length > 0) {
          sheets.push(buildManufacturingDailySheet(mfgData.daily_data, mfgData.period))
        }

        // 前年比較
        if (mfgData?.comparison) {
          sheets.push(buildManufacturingComparisonSheet(mfgData.comparison, mfgData.period))
        }
      }

      if (sheets.length === 0) throw new Error('出力するデータがありません')

      const periodLabel = getCustomPeriodLabel(params, fiscalYear, periodType, currentMonth, quarter)
      await downloadExcel({ filename: `製造分析_${periodLabel}`, sheets })
    },
    []
  )
  return { exportData }
}

// --- 製造: 月次サマリーシート ---
function buildManufacturingSummarySheet(
  data: { period: string; data: ManufacturingAnalysisResponse }[]
): StyledSheetData {
  return {
    name: '月次サマリー',
    build: (wb) => {
      const ws = wb.addWorksheet('月次サマリー')

      if (data.length === 1) {
        const s = data[0].data.summary!
        addTitle(ws, '製造分析 月次サマリー', getMonthLabel(data[0].period), 2)

        const hdr = ws.addRow(['項目', '実績'])
        applyHeaderStyle(hdr)

        const items: [string, number | null][] = [
          ['生産量（バット）', s.total_batts],
          ['生産量（枚）', s.total_pieces],
          ['出勤人数', s.total_workers],
          ['1人あたり生産量', s.avg_production_per_worker],
          ['有給時間', s.total_paid_leave_hours],
          ['稼働日数', s.working_days],
        ]
        for (const [label, val] of items) {
          const row = ws.addRow([label])
          applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          setCurrencyCell(row.getCell(2), val)
        }

        ws.getColumn(1).width = 20
        ws.getColumn(2).width = 15
      } else {
        // 月次横並び
        const colCount = data.length + 1
        addTitle(ws, '製造分析 月次サマリー', `${getMonthLabel(data[0].period)}〜${getMonthLabel(data[data.length - 1].period)}`, colCount)

        const hdr = ws.addRow(['項目', ...data.map((d) => getMonthLabel(d.period))])
        applyHeaderStyle(hdr)

        const rows: [string, (d: ManufacturingAnalysisResponse) => number | null][] = [
          ['生産量（バット）', (d) => d.summary?.total_batts ?? null],
          ['生産量（枚）', (d) => d.summary?.total_pieces ?? null],
          ['出勤人数', (d) => d.summary?.total_workers ?? null],
          ['1人あたり生産量', (d) => d.summary?.avg_production_per_worker ?? null],
          ['有給時間', (d) => d.summary?.total_paid_leave_hours ?? null],
          ['稼働日数', (d) => d.summary?.working_days ?? null],
        ]
        for (const [label, getter] of rows) {
          const row = ws.addRow([label, ...data.map((d) => getter(d.data))])
          applyDataStyle(row)
          row.getCell(1).font = { bold: true, size: 10 }
          for (let i = 2; i <= data.length + 1; i++) row.getCell(i).numFmt = CURRENCY_FMT
        }

        ws.getColumn(1).width = 20
        for (let i = 2; i <= data.length + 1; i++) ws.getColumn(i).width = 14
      }
    },
  }
}

// --- 製造: 日次データシート ---
function buildManufacturingDailySheet(
  dailyData: ManufacturingAnalysisResponse['daily_data'],
  period: string
): StyledSheetData {
  return {
    name: '日次データ',
    build: (wb) => {
      const ws = wb.addWorksheet('日次データ')
      addTitle(ws, '日次データ', getMonthLabel(period), 6)

      const hdr = ws.addRow(['日付', '生産量(バット)', '生産量(枚)', '出勤人数', '1人あたり生産量', '有給時間'])
      applyHeaderStyle(hdr)

      for (const d of dailyData) {
        const row = ws.addRow([d.date])
        applyDataStyle(row)
        setCurrencyCell(row.getCell(2), d.production_batts)
        setCurrencyCell(row.getCell(3), d.production_pieces)
        setCurrencyCell(row.getCell(4), d.workers_count)
        if (d.production_per_worker != null) {
          row.getCell(5).value = d.production_per_worker
          row.getCell(5).numFmt = '#,##0.0'
        } else {
          row.getCell(5).value = '-'
        }
        if (d.paid_leave_hours != null) {
          row.getCell(6).value = d.paid_leave_hours
          row.getCell(6).numFmt = '#,##0.0'
        } else {
          row.getCell(6).value = '-'
        }
      }

      ws.getColumn(1).width = 12
      for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 16
    },
  }
}

// --- 製造: 前年比較シート ---
function buildManufacturingComparisonSheet(
  comparison: NonNullable<ManufacturingAnalysisResponse['comparison']>,
  period: string
): StyledSheetData {
  return {
    name: '前年比較',
    build: (wb) => {
      const ws = wb.addWorksheet('前年比較')
      addTitle(ws, '前年比較', getMonthLabel(period), 6)

      const hdr = ws.addRow(['項目', '今期', '前年', '前々年', '前年差', '前年比'])
      applyHeaderStyle(hdr)

      const cur = comparison.current
      const prev = comparison.previous_year
      const prev2 = comparison.previous_year2

      const items: [string, number | null, number | null, number | null, number | null, number | null][] = [
        ['生産量（バット）', cur?.total_batts ?? null, prev?.total_batts ?? null, prev2?.total_batts ?? null, comparison.yoy_batts_diff, comparison.yoy_batts_rate],
        ['出勤人数', cur?.total_workers ?? null, prev?.total_workers ?? null, prev2?.total_workers ?? null, comparison.yoy_workers_diff, comparison.yoy_workers_rate],
        ['1人あたり生産量', cur?.avg_production_per_worker ?? null, prev?.avg_production_per_worker ?? null, prev2?.avg_production_per_worker ?? null, comparison.yoy_productivity_diff, comparison.yoy_productivity_rate],
        ['有給時間', cur?.total_paid_leave_hours ?? null, prev?.total_paid_leave_hours ?? null, prev2?.total_paid_leave_hours ?? null, comparison.yoy_leave_diff, comparison.yoy_leave_rate],
      ]

      for (const [label, curVal, prevVal, prev2Val, diff, rate] of items) {
        const row = ws.addRow([label])
        applyDataStyle(row)
        row.getCell(1).font = { bold: true, size: 10 }
        setCurrencyCell(row.getCell(2), curVal)
        setCurrencyCell(row.getCell(3), prevVal)
        setCurrencyCell(row.getCell(4), prev2Val)
        setCurrencyCell(row.getCell(5), diff)
        setPercentCell(row.getCell(6), rate)
      }

      ws.getColumn(1).width = 18
      for (let i = 2; i <= 6; i++) ws.getColumn(i).width = 14
    },
  }
}
