/**
 * データ出力用カスタムフック
 */
'use client'

import { useCallback } from 'react'
import { getDashboardData } from '@/lib/api/dashboard'
import { getFinanceAnalysisV2, getStorePLList } from '@/lib/api/financial'
import { getStoreSummary } from '@/lib/api/store'
import { getChannelSummary } from '@/lib/api/ecommerce'
import {
  downloadExcel,
  formatNumberForExcel,
  formatPercentForExcel,
  getFiscalYearMonths,
  getMonthLabel,
  createTitleRow,
  createEmptyRow,
  type SheetData,
} from '@/lib/excel-export'
import type { ExportScope } from '@/components/common/ExportDialog'
import type { DashboardResponse, CompanySummary, DepartmentPerformance, CashFlowData } from '@/types/dashboard'
import type { FinancialAnalysisResponseV2, StorePLListResponse } from '@/types/financial'

/**
 * ダッシュボードデータ出力フック
 */
export function useDashboardExport() {
  const exportData = useCallback(
    async (
      scope: ExportScope,
      fiscalYear: number,
      currentMonth: number,
      periodType: 'monthly' | 'quarterly' | 'yearly',
      quarter?: number
    ) => {
      const sheets: SheetData[] = []

      if (scope === 'current') {
        // 現在表示中のデータを出力
        const data = await getDashboardData({
          period_type: periodType,
          year: fiscalYear,
          month: periodType === 'monthly' ? currentMonth : undefined,
          quarter: periodType === 'quarterly' ? quarter : undefined,
        })

        sheets.push(createCompanySummarySheet([data], periodType))
        sheets.push(createDepartmentSheet([data]))
        sheets.push(createCashFlowSheet([data]))
      } else {
        // 年度全体の月次データを出力
        const months = getFiscalYearMonths(fiscalYear)
        const monthlyData: DashboardResponse[] = []

        for (const month of months) {
          const [year, m] = month.split('-').map(Number)
          try {
            const data = await getDashboardData({
              period_type: 'monthly',
              year: fiscalYear,
              month: m,
            })
            monthlyData.push(data)
          } catch {
            // データがない月はスキップ
          }
        }

        if (monthlyData.length > 0) {
          sheets.push(createCompanySummarySheet(monthlyData, 'monthly'))
          sheets.push(createDepartmentSheet(monthlyData))
          sheets.push(createCashFlowSheet(monthlyData))
        }
      }

      if (sheets.length === 0) {
        throw new Error('出力するデータがありません')
      }

      const periodLabel = scope === 'current'
        ? getPeriodLabel(periodType, fiscalYear, currentMonth, quarter)
        : `${fiscalYear}年度`

      downloadExcel({
        filename: `ダッシュボード_${periodLabel}`,
        sheets,
      })
    },
    []
  )

  return { exportData }
}

/**
 * 期間ラベルを取得
 */
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

/**
 * 全社サマリーシートを作成
 */
function createCompanySummarySheet(
  data: DashboardResponse[],
  periodType: string
): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  // ヘッダー
  rows.push(createTitleRow('全社サマリー', 8))
  rows.push(createEmptyRow(8))

  if (data.length === 1) {
    // 単一期間の場合
    const summary = data[0].company_summary
    rows.push(['項目', '実績', '目標', '達成率', '前年', '前年比'])
    rows.push([
      '売上高',
      summary.sales_total.value,
      summary.sales_total.target,
      summary.sales_total.achievement_rate != null
        ? formatPercentForExcel(summary.sales_total.achievement_rate)
        : '-',
      summary.sales_total.previous_year,
      summary.sales_total.yoy_rate != null
        ? formatPercentForExcel(summary.sales_total.yoy_rate)
        : '-',
    ])
    rows.push([
      '粗利益',
      summary.gross_profit.value,
      summary.gross_profit.target,
      summary.gross_profit.achievement_rate != null
        ? formatPercentForExcel(summary.gross_profit.achievement_rate)
        : '-',
      summary.gross_profit.previous_year,
      summary.gross_profit.yoy_rate != null
        ? formatPercentForExcel(summary.gross_profit.yoy_rate)
        : '-',
    ])
    rows.push([
      '粗利率',
      summary.gross_profit_rate.value != null
        ? formatPercentForExcel(summary.gross_profit_rate.value)
        : '-',
      summary.gross_profit_rate.target != null
        ? formatPercentForExcel(summary.gross_profit_rate.target)
        : '-',
      '-',
      summary.gross_profit_rate.previous_year != null
        ? formatPercentForExcel(summary.gross_profit_rate.previous_year)
        : '-',
      '-',
    ])
    rows.push([
      '営業利益',
      summary.operating_profit.value,
      summary.operating_profit.target,
      summary.operating_profit.achievement_rate != null
        ? formatPercentForExcel(summary.operating_profit.achievement_rate)
        : '-',
      summary.operating_profit.previous_year,
      summary.operating_profit.yoy_rate != null
        ? formatPercentForExcel(summary.operating_profit.yoy_rate)
        : '-',
    ])
  } else {
    // 月次データの場合（横軸に月を並べる）
    const headers = ['項目', ...data.map((d) => getMonthLabel(d.company_summary.period))]
    rows.push(headers)

    // 売上高
    rows.push([
      '売上高',
      ...data.map((d) => d.company_summary.sales_total.value),
    ])
    rows.push([
      '売上高（目標）',
      ...data.map((d) => d.company_summary.sales_total.target),
    ])
    rows.push([
      '売上高（前年）',
      ...data.map((d) => d.company_summary.sales_total.previous_year),
    ])
    rows.push([
      '売上高（前年比）',
      ...data.map((d) =>
        d.company_summary.sales_total.yoy_rate != null
          ? formatPercentForExcel(d.company_summary.sales_total.yoy_rate)
          : '-'
      ),
    ])

    rows.push(createEmptyRow(headers.length))

    // 粗利益
    rows.push([
      '粗利益',
      ...data.map((d) => d.company_summary.gross_profit.value),
    ])
    rows.push([
      '粗利益（目標）',
      ...data.map((d) => d.company_summary.gross_profit.target),
    ])
    rows.push([
      '粗利益（前年）',
      ...data.map((d) => d.company_summary.gross_profit.previous_year),
    ])

    rows.push(createEmptyRow(headers.length))

    // 粗利率
    rows.push([
      '粗利率',
      ...data.map((d) =>
        d.company_summary.gross_profit_rate.value != null
          ? formatPercentForExcel(d.company_summary.gross_profit_rate.value)
          : '-'
      ),
    ])

    rows.push(createEmptyRow(headers.length))

    // 営業利益
    rows.push([
      '営業利益',
      ...data.map((d) => d.company_summary.operating_profit.value),
    ])
    rows.push([
      '営業利益（目標）',
      ...data.map((d) => d.company_summary.operating_profit.target),
    ])
    rows.push([
      '営業利益（前年）',
      ...data.map((d) => d.company_summary.operating_profit.previous_year),
    ])
  }

  return {
    name: '全社サマリー',
    data: rows,
    columnWidths: [15, 15, 15, 12, 15, 12, 15, 15, 15, 15, 15, 15, 15],
  }
}

/**
 * 部門別実績シートを作成
 */
function createDepartmentSheet(data: DashboardResponse[]): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  rows.push(createTitleRow('部門別実績', 8))
  rows.push(createEmptyRow(8))

  if (data.length === 1) {
    rows.push(['部門', '売上高', '前年比', '利益', '達成率', '予算比'])
    for (const dept of data[0].department_performance) {
      rows.push([
        dept.department,
        dept.sales,
        dept.sales_yoy_rate != null ? formatPercentForExcel(dept.sales_yoy_rate) : '-',
        dept.profit,
        dept.achievement_rate != null ? formatPercentForExcel(dept.achievement_rate) : '-',
        dept.budget_rate != null ? formatPercentForExcel(dept.budget_rate) : '-',
      ])
    }
  } else {
    // 月次データ：部門ごとに行を作成
    const headers = ['部門', '項目', ...data.map((d) => getMonthLabel(d.company_summary.period))]
    rows.push(headers)

    // 店舗
    rows.push([
      '店舗',
      '売上高',
      ...data.map((d) => d.department_performance.find((p) => p.department === '店舗')?.sales ?? '-'),
    ])
    rows.push([
      '',
      '利益',
      ...data.map((d) => d.department_performance.find((p) => p.department === '店舗')?.profit ?? '-'),
    ])

    rows.push(createEmptyRow(headers.length))

    // 通販
    rows.push([
      '通販',
      '売上高',
      ...data.map((d) => d.department_performance.find((p) => p.department === '通販')?.sales ?? '-'),
    ])
    rows.push([
      '',
      '利益',
      ...data.map((d) => d.department_performance.find((p) => p.department === '通販')?.profit ?? '-'),
    ])
  }

  return {
    name: '部門別実績',
    data: rows,
    columnWidths: [12, 12, 15, 15, 12, 12, 15, 15, 15, 15, 15, 15, 15, 15],
  }
}

/**
 * キャッシュフローシートを作成
 */
function createCashFlowSheet(data: DashboardResponse[]): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  rows.push(createTitleRow('キャッシュフロー', 6))
  rows.push(createEmptyRow(6))

  if (data.length === 1) {
    const cf = data[0].cash_flow
    rows.push(['項目', '今期', '前年', '前々年'])
    rows.push(['営業CF', cf.cf_operating, cf.cf_operating_prev, cf.cf_operating_prev2])
    rows.push(['投資CF', cf.cf_investing, cf.cf_investing_prev, cf.cf_investing_prev2])
    rows.push(['財務CF', cf.cf_financing, cf.cf_financing_prev, cf.cf_financing_prev2])
    rows.push(['フリーCF', cf.cf_free, cf.cf_free_prev, cf.cf_free_prev2])
  } else {
    const headers = ['項目', ...data.map((d) => getMonthLabel(d.company_summary.period))]
    rows.push(headers)
    rows.push(['営業CF', ...data.map((d) => d.cash_flow.cf_operating)])
    rows.push(['投資CF', ...data.map((d) => d.cash_flow.cf_investing)])
    rows.push(['財務CF', ...data.map((d) => d.cash_flow.cf_financing)])
    rows.push(['フリーCF', ...data.map((d) => d.cash_flow.cf_free)])
  }

  return {
    name: 'キャッシュフロー',
    data: rows,
    columnWidths: [12, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
  }
}

/**
 * 財務分析データ出力フック
 */
export function useFinancialExport() {
  const exportData = useCallback(
    async (
      scope: ExportScope,
      fiscalYear: number,
      currentMonth: number,
      periodType: 'monthly' | 'quarterly' | 'yearly',
      quarter?: number
    ) => {
      const sheets: SheetData[] = []

      // 期間タイプに応じた基準月
      const baseMonth = periodType === 'quarterly'
        ? [9, 12, 3, 6][quarter ? quarter - 1 : 0]
        : periodType === 'yearly'
          ? 9
          : currentMonth

      // カレンダー年を計算
      const calendarYear = baseMonth >= 9 ? fiscalYear - 1 : fiscalYear
      const currentPeriod = `${calendarYear}-${String(baseMonth).padStart(2, '0')}-01`

      if (scope === 'current') {
        // 現在表示中のデータを出力
        const v2PeriodType = periodType === 'monthly' ? 'monthly' : 'cumulative'

        try {
          const financeData = await getFinanceAnalysisV2(currentPeriod, v2PeriodType)
          const storePLData = await getStorePLList(currentPeriod, 'store', periodType)

          sheets.push(createFinancialSummarySheet([{ period: currentPeriod, data: financeData }]))
          sheets.push(createStorePLSheet([{ period: currentPeriod, data: storePLData }]))
        } catch (err) {
          console.error('Failed to fetch financial data:', err)
        }
      } else {
        // 年度全体の月次データを出力
        const months = getFiscalYearMonths(fiscalYear)
        const monthlyFinanceData: { period: string; data: FinancialAnalysisResponseV2 }[] = []
        const monthlyStorePLData: { period: string; data: StorePLListResponse }[] = []

        for (const month of months) {
          try {
            const financeData = await getFinanceAnalysisV2(month, 'monthly')
            if (financeData?.current) {
              monthlyFinanceData.push({ period: month, data: financeData })
            }
          } catch {
            // データがない月はスキップ
          }

          try {
            const storePLData = await getStorePLList(month, 'store', 'monthly')
            if (storePLData?.stores?.length > 0) {
              monthlyStorePLData.push({ period: month, data: storePLData })
            }
          } catch {
            // データがない月はスキップ
          }
        }

        if (monthlyFinanceData.length > 0) {
          sheets.push(createFinancialSummarySheet(monthlyFinanceData))
        }
        if (monthlyStorePLData.length > 0) {
          sheets.push(createStorePLSheet(monthlyStorePLData))
        }
      }

      if (sheets.length === 0) {
        throw new Error('出力するデータがありません')
      }

      const periodLabel = scope === 'current'
        ? getPeriodLabel(periodType, fiscalYear, currentMonth, quarter)
        : `${fiscalYear}年度`

      downloadExcel({
        filename: `財務分析_${periodLabel}`,
        sheets,
      })
    },
    []
  )

  return { exportData }
}

/**
 * 財務サマリーシートを作成
 */
function createFinancialSummarySheet(
  data: { period: string; data: FinancialAnalysisResponseV2 }[]
): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  rows.push(createTitleRow('損益計算書', 15))
  rows.push(createEmptyRow(15))

  if (data.length === 1) {
    // 単一期間
    const { current, previous_year } = data[0].data
    rows.push(['項目', '今期', '前年', '増減'])
    rows.push(['売上高', Number(current.sales_total), Number(previous_year?.sales_total) || null, null])
    rows.push(['　店舗売上', Number(current.sales_store), Number(previous_year?.sales_store) || null, null])
    rows.push(['　通販売上', Number(current.sales_online), Number(previous_year?.sales_online) || null, null])
    rows.push(['売上原価', Number(current.cost_of_sales), Number(previous_year?.cost_of_sales) || null, null])
    rows.push(['売上総利益', Number(current.gross_profit), Number(previous_year?.gross_profit) || null, null])
    rows.push(['販管費計', Number(current.sga_total), Number(previous_year?.sga_total) || null, null])
    rows.push(['営業利益', Number(current.operating_profit), Number(previous_year?.operating_profit) || null, null])

    rows.push(createEmptyRow(4))
    rows.push(['指標', '今期', '前年', '差異'])

    const salesTotal = Number(current.sales_total) || 1
    const prevSalesTotal = Number(previous_year?.sales_total) || 1
    const grossProfitRate = (Number(current.gross_profit) / salesTotal * 100).toFixed(1) + '%'
    const prevGrossProfitRate = previous_year ? (Number(previous_year.gross_profit) / prevSalesTotal * 100).toFixed(1) + '%' : '-'
    const operatingProfitRate = (Number(current.operating_profit) / salesTotal * 100).toFixed(1) + '%'
    const prevOperatingProfitRate = previous_year ? (Number(previous_year.operating_profit) / prevSalesTotal * 100).toFixed(1) + '%' : '-'

    rows.push(['粗利率', grossProfitRate, prevGrossProfitRate, '-'])
    rows.push(['営業利益率', operatingProfitRate, prevOperatingProfitRate, '-'])
  } else {
    // 月次データ（横軸に月を並べる）
    const headers = ['項目', ...data.map((d) => getMonthLabel(d.period))]
    rows.push(headers)

    rows.push(['売上高', ...data.map((d) => Number(d.data.current.sales_total))])
    rows.push(['　店舗売上', ...data.map((d) => Number(d.data.current.sales_store))])
    rows.push(['　通販売上', ...data.map((d) => Number(d.data.current.sales_online))])
    rows.push(['売上原価', ...data.map((d) => Number(d.data.current.cost_of_sales))])
    rows.push(['売上総利益', ...data.map((d) => Number(d.data.current.gross_profit))])
    rows.push(['販管費計', ...data.map((d) => Number(d.data.current.sga_total))])
    rows.push(['営業利益', ...data.map((d) => Number(d.data.current.operating_profit))])

    rows.push(createEmptyRow(headers.length))
    rows.push(['粗利率', ...data.map((d) => {
      const sales = Number(d.data.current.sales_total) || 1
      const gross = Number(d.data.current.gross_profit)
      return (gross / sales * 100).toFixed(1) + '%'
    })])
    rows.push(['営業利益率', ...data.map((d) => {
      const sales = Number(d.data.current.sales_total) || 1
      const op = Number(d.data.current.operating_profit)
      return (op / sales * 100).toFixed(1) + '%'
    })])
  }

  return {
    name: '損益計算書',
    data: rows,
    columnWidths: [15, 15, 15, 12, 15, 15, 15, 15, 15, 15, 15, 15, 15],
  }
}

/**
 * 店舗別収支シートを作成
 */
function createStorePLSheet(
  data: { period: string; data: StorePLListResponse }[]
): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  rows.push(createTitleRow('店舗別収支', 15))
  rows.push(createEmptyRow(15))

  if (data.length === 1) {
    // 単一期間
    const { stores, total_sales, total_gross_profit, total_operating_profit } = data[0].data
    rows.push(['店舗', '売上高', '売上原価', '粗利益', '販管費', '営業利益', '粗利率', '営業利益率'])

    for (const store of stores) {
      const sales = Number(store.sales) || 0
      const grossProfit = Number(store.gross_profit) || 0
      const opProfit = Number(store.operating_profit) || 0
      const grossRate = sales > 0 ? (grossProfit / sales * 100).toFixed(1) + '%' : '-'
      const opRate = sales > 0 ? (opProfit / sales * 100).toFixed(1) + '%' : '-'

      rows.push([
        store.store_name,
        Number(store.sales),
        Number(store.cost_of_sales),
        Number(store.gross_profit),
        Number(store.sga),
        Number(store.operating_profit),
        grossRate,
        opRate,
      ])
    }

    // 合計行
    const totalSales = Number(total_sales) || 0
    const totalGross = Number(total_gross_profit) || 0
    const totalOp = Number(total_operating_profit) || 0
    rows.push([
      '合計',
      totalSales,
      '-',
      totalGross,
      '-',
      totalOp,
      totalSales > 0 ? (totalGross / totalSales * 100).toFixed(1) + '%' : '-',
      totalSales > 0 ? (totalOp / totalSales * 100).toFixed(1) + '%' : '-',
    ])
  } else {
    // 月次データ（店舗ごとに行を作成）
    const allStoreNames = new Set<string>()
    for (const d of data) {
      for (const store of d.data.stores) {
        allStoreNames.add(store.store_name)
      }
    }

    const headers = ['店舗', '項目', ...data.map((d) => getMonthLabel(d.period))]
    rows.push(headers)

    for (const storeName of allStoreNames) {
      rows.push([storeName, '売上高', ...data.map((d) => {
        const store = d.data.stores.find((s) => s.store_name === storeName)
        return store ? Number(store.sales) : '-'
      })])
      rows.push(['', '粗利益', ...data.map((d) => {
        const store = d.data.stores.find((s) => s.store_name === storeName)
        return store ? Number(store.gross_profit) : '-'
      })])
      rows.push(['', '営業利益', ...data.map((d) => {
        const store = d.data.stores.find((s) => s.store_name === storeName)
        return store ? Number(store.operating_profit) : '-'
      })])
      rows.push(createEmptyRow(headers.length))
    }
  }

  return {
    name: '店舗別収支',
    data: rows,
    columnWidths: [15, 12, 15, 15, 15, 15, 15, 12, 12, 15, 15, 15, 15, 15, 15],
  }
}

/**
 * 店舗分析データ出力フック
 */
export function useStoreAnalysisExport() {
  const exportData = useCallback(
    async (
      scope: ExportScope,
      fiscalYear: number,
      currentPeriod: string
    ) => {
      const sheets: SheetData[] = []

      if (scope === 'current') {
        // 現在表示中のデータを出力
        try {
          const storeData = await getStoreSummary(currentPeriod, 'store', 'monthly')
          if (storeData) {
            sheets.push(createStoreAnalysisSheet([{ period: currentPeriod, data: storeData }]))
          }
        } catch (err) {
          console.error('Failed to fetch store data:', err)
        }
      } else {
        // 年度全体の月次データを出力
        const months = getFiscalYearMonths(fiscalYear)
        const monthlyData: { period: string; data: any }[] = []

        for (const month of months) {
          try {
            const storeData = await getStoreSummary(month, 'store', 'monthly')
            if (storeData?.stores?.length > 0) {
              monthlyData.push({ period: month, data: storeData })
            }
          } catch {
            // データがない月はスキップ
          }
        }

        if (monthlyData.length > 0) {
          sheets.push(createStoreAnalysisSheet(monthlyData))
        }
      }

      if (sheets.length === 0) {
        throw new Error('出力するデータがありません')
      }

      // 期間ラベル
      const periodLabel = scope === 'current'
        ? getMonthLabel(currentPeriod)
        : `${fiscalYear}年度`

      downloadExcel({
        filename: `店舗分析_${periodLabel}`,
        sheets,
      })
    },
    []
  )

  return { exportData }
}

/**
 * 店舗分析シートを作成
 */
function createStoreAnalysisSheet(
  data: { period: string; data: any }[]
): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  rows.push(createTitleRow('店舗別実績', 15))
  rows.push(createEmptyRow(15))

  if (data.length === 1) {
    // 単一期間
    const { stores, totals } = data[0].data
    rows.push(['店舗', '売上高', '客数', '客単価', '前年売上', '前年比'])

    for (const store of stores || []) {
      rows.push([
        store.store_name,
        store.sales,
        store.customers,
        store.unit_price,
        store.sales_previous_year,
        store.sales_yoy != null ? formatPercentForExcel(store.sales_yoy) : '-',
      ])
    }

    // 合計行
    if (totals) {
      rows.push([
        '合計',
        totals.sales,
        totals.customers,
        totals.unit_price,
        totals.sales_previous_year,
        totals.sales_yoy != null ? formatPercentForExcel(totals.sales_yoy) : '-',
      ])
    }
  } else {
    // 月次データ（店舗ごとに行を作成）
    const allStoreNames = new Set<string>()
    for (const d of data) {
      for (const store of d.data.stores || []) {
        allStoreNames.add(store.store_name)
      }
    }

    const headers = ['店舗', '項目', ...data.map((d) => getMonthLabel(d.period))]
    rows.push(headers)

    for (const storeName of allStoreNames) {
      rows.push([storeName, '売上高', ...data.map((d) => {
        const store = (d.data.stores || []).find((s: any) => s.store_name === storeName)
        return store?.sales ?? '-'
      })])
      rows.push(['', '客数', ...data.map((d) => {
        const store = (d.data.stores || []).find((s: any) => s.store_name === storeName)
        return store?.customers ?? '-'
      })])
      rows.push(['', '客単価', ...data.map((d) => {
        const store = (d.data.stores || []).find((s: any) => s.store_name === storeName)
        return store?.unit_price ?? '-'
      })])
      rows.push(createEmptyRow(headers.length))
    }
  }

  return {
    name: '店舗別実績',
    data: rows,
    columnWidths: [15, 12, 15, 12, 12, 15, 12, 15, 15, 15, 15, 15, 15, 15],
  }
}

/**
 * 通販分析データ出力フック
 */
export function useEcommerceExport() {
  const exportData = useCallback(
    async (
      scope: ExportScope,
      fiscalYear: number,
      currentPeriod: string,
      periodType: 'monthly' | 'cumulative' = 'monthly'
    ) => {
      const sheets: SheetData[] = []

      if (scope === 'current') {
        // 現在表示中のデータを出力
        try {
          const channelData = await getChannelSummary(currentPeriod, periodType)
          if (channelData) {
            sheets.push(createEcommerceSheet([{ period: currentPeriod, data: channelData }]))
          }
        } catch (err) {
          console.error('Failed to fetch ecommerce data:', err)
        }
      } else {
        // 年度全体の月次データを出力
        const months = getFiscalYearMonths(fiscalYear)
        const monthlyData: { period: string; data: any }[] = []

        for (const month of months) {
          try {
            const channelData = await getChannelSummary(month, 'monthly')
            if (channelData?.channels?.length > 0) {
              monthlyData.push({ period: month, data: channelData })
            }
          } catch {
            // データがない月はスキップ
          }
        }

        if (monthlyData.length > 0) {
          sheets.push(createEcommerceSheet(monthlyData))
        }
      }

      if (sheets.length === 0) {
        throw new Error('出力するデータがありません')
      }

      // 期間ラベル
      const periodLabel = scope === 'current'
        ? getMonthLabel(currentPeriod)
        : `${fiscalYear}年度`

      downloadExcel({
        filename: `通販分析_${periodLabel}`,
        sheets,
      })
    },
    []
  )

  return { exportData }
}

/**
 * 通販分析シートを作成
 */
function createEcommerceSheet(
  data: { period: string; data: any }[]
): SheetData {
  const rows: (string | number | null | undefined)[][] = []

  rows.push(createTitleRow('チャネル別実績', 15))
  rows.push(createEmptyRow(15))

  if (data.length === 1) {
    // 単一期間
    const { channels, totals } = data[0].data
    rows.push(['チャネル', '売上高', '目標', '達成率', '購入者数', '客単価', '前年売上', '前年比'])

    for (const channel of channels || []) {
      rows.push([
        channel.channel_name,
        channel.sales,
        channel.target_sales,
        channel.achievement_rate != null ? formatPercentForExcel(channel.achievement_rate) : '-',
        channel.buyers,
        channel.unit_price,
        channel.sales_previous_year,
        channel.sales_yoy != null ? formatPercentForExcel(channel.sales_yoy) : '-',
      ])
    }

    // 合計行
    if (totals) {
      rows.push([
        '合計',
        totals.sales,
        totals.target_sales,
        totals.achievement_rate != null ? formatPercentForExcel(totals.achievement_rate) : '-',
        totals.buyers,
        totals.unit_price,
        totals.sales_previous_year,
        totals.sales_yoy != null ? formatPercentForExcel(totals.sales_yoy) : '-',
      ])
    }
  } else {
    // 月次データ（チャネルごとに行を作成）
    const allChannelNames = new Set<string>()
    for (const d of data) {
      for (const channel of d.data.channels || []) {
        allChannelNames.add(channel.channel_name)
      }
    }

    const headers = ['チャネル', '項目', ...data.map((d) => getMonthLabel(d.period))]
    rows.push(headers)

    for (const channelName of allChannelNames) {
      rows.push([channelName, '売上高', ...data.map((d) => {
        const channel = (d.data.channels || []).find((c: any) => c.channel_name === channelName)
        return channel?.sales ?? '-'
      })])
      rows.push(['', '購入者数', ...data.map((d) => {
        const channel = (d.data.channels || []).find((c: any) => c.channel_name === channelName)
        return channel?.buyers ?? '-'
      })])
      rows.push(['', '客単価', ...data.map((d) => {
        const channel = (d.data.channels || []).find((c: any) => c.channel_name === channelName)
        return channel?.unit_price ?? '-'
      })])
      rows.push(createEmptyRow(headers.length))
    }

    // 合計行
    rows.push(['合計', '売上高', ...data.map((d) => d.data.totals?.sales ?? '-')])
    rows.push(['', '購入者数', ...data.map((d) => d.data.totals?.buyers ?? '-')])
    rows.push(['', '客単価', ...data.map((d) => d.data.totals?.unit_price ?? '-')])
  }

  return {
    name: 'チャネル別実績',
    data: rows,
    columnWidths: [15, 12, 15, 15, 12, 12, 12, 15, 12, 15, 15, 15, 15, 15],
  }
}
