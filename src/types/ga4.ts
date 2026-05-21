/**
 * EC Web分析（GA4連携）の型定義
 */

/** 指標と前月比・前年比（vsは変化率% / 離脱率はpt差） */
export interface MetricComparison {
  value: number
  vs_prev_month: number
  vs_prev_year: number
}

/** 流入経路の構成比 */
export interface ChannelShare {
  channel: string
  share: number
}

/** 地区別の流入セッション数 */
export interface RegionTraffic {
  region: string
  sessions: number
}

/** EC Web分析サマリー（GA4連携） */
export interface GA4EcSummary {
  sessions: MetricComparison
  bounce_rate: MetricComparison
  channels: ChannelShare[]
  regions: RegionTraffic[]
  comment: string
  is_sample: boolean
  date_label: string
}
