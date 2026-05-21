/**
 * GoogleスライドURLを埋め込み用URLに変換するユーティリティ
 */

/**
 * GoogleスライドのURLから埋め込み用URLを生成する。
 *
 * 入力例:
 *   https://docs.google.com/presentation/d/<ID>/edit#slide=id.p
 *   https://docs.google.com/presentation/d/<ID>/edit?usp=sharing
 *   https://docs.google.com/presentation/d/<ID>/pub
 *
 * 出力例:
 *   https://docs.google.com/presentation/d/<ID>/embed?start=false&loop=false
 *
 * GoogleスライドのURLでない場合は null を返す。
 *
 * @param url 変換対象のURL
 * @returns 埋め込み用URL、またはGoogleスライドでない場合は null
 */
export function toSlidesEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  const trimmed = url.trim()

  // Googleスライドのプレゼンテーション URL から ID を抽出
  const match = trimmed.match(
    /https?:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/
  )

  if (!match || !match[1]) {
    return null
  }

  const presentationId = match[1]
  return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false`
}
