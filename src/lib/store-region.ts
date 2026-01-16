/**
 * 店舗-地区マッピングユーティリティ
 * 店舗別収支で地区順にソートするための定義
 */

// 地区の表示順序
export const REGION_ORDER = [
  '都城地区',
  '宮崎地区',
  '鹿児島地区',
  '福岡地区',
  '熊本地区',
  'その他',
] as const

export type RegionName = typeof REGION_ORDER[number]

// 地区の順序マップ（高速検索用）
export const REGION_ORDER_MAP: Record<string, number> = REGION_ORDER.reduce(
  (acc, region, index) => {
    acc[region] = index
    return acc
  },
  {} as Record<string, number>
)

// 店舗名から地区を取得するマッピング
// NOTE: この定義はバックエンドの店舗マスタと同期が必要
// 新店舗追加時はここにも追加する
export const STORE_REGION_MAP: Record<string, RegionName> = {
  // 都城地区
  '都城店': '都城地区',
  '都城本店': '都城地区',
  '三股店': '都城地区',
  '高城店': '都城地区',
  '山之口店': '都城地区',
  '志和池店': '都城地区',
  '高崎店': '都城地区',
  '山田店': '都城地区',
  '小林店': '都城地区',
  'えびの店': '都城地区',
  '高原店': '都城地区',
  '日南店': '都城地区',
  '串間店': '都城地区',

  // 宮崎地区
  '宮崎店': '宮崎地区',
  '宮崎本店': '宮崎地区',
  '大塚店': '宮崎地区',
  '佐土原店': '宮崎地区',
  '清武店': '宮崎地区',
  '高鍋店': '宮崎地区',
  '西都店': '宮崎地区',
  '日向店': '宮崎地区',
  '延岡店': '宮崎地区',
  '門川店': '宮崎地区',
  '国富店': '宮崎地区',
  '綾店': '宮崎地区',
  '木花店': '宮崎地区',
  '田野店': '宮崎地区',

  // 鹿児島地区
  '鹿児島店': '鹿児島地区',
  '鹿児島本店': '鹿児島地区',
  '鹿屋店': '鹿児島地区',
  '霧島店': '鹿児島地区',
  '国分店': '鹿児島地区',
  '隼人店': '鹿児島地区',
  '姶良店': '鹿児島地区',
  '加治木店': '鹿児島地区',
  '志布志店': '鹿児島地区',
  '垂水店': '鹿児島地区',
  '曽於店': '鹿児島地区',

  // 福岡地区
  '福岡店': '福岡地区',
  '福岡本店': '福岡地区',
  '博多店': '福岡地区',
  '天神店': '福岡地区',
  '久留米店': '福岡地区',
  '大牟田店': '福岡地区',
  '筑紫野店': '福岡地区',
  '春日店': '福岡地区',
  '太宰府店': '福岡地区',
  '糸島店': '福岡地区',
  '北九州店': '福岡地区',
  '小倉店': '福岡地区',
  '八幡店': '福岡地区',
  '行橋店': '福岡地区',
  '飯塚店': '福岡地区',
  '直方店': '福岡地区',
  '田川店': '福岡地区',

  // 熊本地区
  '熊本店': '熊本地区',
  '熊本本店': '熊本地区',
  '八代店': '熊本地区',
  '人吉店': '熊本地区',
  '水俣店': '熊本地区',
  '玉名店': '熊本地区',
  '山鹿店': '熊本地区',
  '菊池店': '熊本地区',
  '阿蘇店': '熊本地区',
  '合志店': '熊本地区',
  '宇城店': '熊本地区',
  '天草店': '熊本地区',
  '荒尾店': '熊本地区',
}

/**
 * 店舗名から地区名を取得
 * @param storeName 店舗名
 * @returns 地区名（マッピングがない場合はundefined）
 */
export function getRegionByStoreName(storeName: string): RegionName | undefined {
  // 完全一致を試みる
  if (STORE_REGION_MAP[storeName]) {
    return STORE_REGION_MAP[storeName]
  }

  // 部分一致を試みる（「○○店」→「○○」で検索）
  for (const [key, region] of Object.entries(STORE_REGION_MAP)) {
    if (storeName.includes(key.replace('店', '')) || key.includes(storeName.replace('店', ''))) {
      return region as RegionName
    }
  }

  return undefined
}

/**
 * 店舗名から地区の表示順序を取得
 * @param storeName 店舗名
 * @returns 順序番号（マッピングがない場合は最後尾）
 */
export function getRegionOrderByStoreName(storeName: string): number {
  const region = getRegionByStoreName(storeName)
  if (!region) return REGION_ORDER.length // マッピングがない場合は最後尾
  return REGION_ORDER_MAP[region] ?? REGION_ORDER.length
}

/**
 * 店舗リストを地区順にソート
 * @param stores 店舗リスト（store_nameプロパティを持つオブジェクト）
 * @returns ソートされた店舗リスト
 */
export function sortStoresByRegion<T extends { store_name: string }>(stores: T[]): T[] {
  return [...stores].sort((a, b) => {
    const orderA = getRegionOrderByStoreName(a.store_name)
    const orderB = getRegionOrderByStoreName(b.store_name)

    // 同じ地区内は店舗名でソート
    if (orderA === orderB) {
      return a.store_name.localeCompare(b.store_name, 'ja')
    }

    return orderA - orderB
  })
}

/**
 * 店舗リストを地区ごとにグループ化
 * @param stores 店舗リスト
 * @returns 地区ごとにグループ化された店舗マップ
 */
export function groupStoresByRegion<T extends { store_name: string }>(
  stores: T[]
): Map<RegionName | '未分類', T[]> {
  const grouped = new Map<RegionName | '未分類', T[]>()

  // 地区順序に従って初期化
  for (const region of REGION_ORDER) {
    grouped.set(region, [])
  }
  grouped.set('未分類', [])

  // 店舗を分類
  for (const store of stores) {
    const region = getRegionByStoreName(store.store_name) ?? '未分類'
    grouped.get(region)?.push(store)
  }

  // 空の地区を削除
  for (const [region, storeList] of grouped) {
    if (storeList.length === 0) {
      grouped.delete(region)
    }
  }

  return grouped
}
