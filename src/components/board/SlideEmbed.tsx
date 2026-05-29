/**
 * Googleスライド埋め込みビューア
 * GoogleスライドのURLをレスポンシブな16:9のiframeで表示する。
 * GoogleスライドのURLでない場合はリンク表示にフォールバックする。
 */
'use client'

import { ExternalLink, Presentation } from 'lucide-react'
import { toSlidesEmbedUrl } from '@/lib/board-embed'

interface Props {
  url: string
  /** 資料のラベル（ファイル名）。Googleスライド以外の資料ではURLの代わりに表示する。 */
  label?: string | null
}

export function SlideEmbed({ url, label }: Props) {
  const embedUrl = toSlidesEmbedUrl(url)
  const trimmedLabel = label?.trim() || ''

  // Googleスライド埋め込み表示
  if (embedUrl) {
    return (
      <div>
        {trimmedLabel && (
          <p className="text-sm font-medium text-gray-700 mb-1.5">{trimmedLabel}</p>
        )}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-900">
          <div className="relative aspect-video bg-white">
            <iframe
              src={embedUrl}
              title={trimmedLabel || '取締役会 説明資料'}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
            <span className="flex items-center gap-1.5">
              <Presentation className="h-3.5 w-3.5" />
              Googleスライド埋め込み表示
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white"
            >
              新しいタブで開く
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
          <Presentation className="h-3.5 w-3.5 text-green-500" />
          この画面内でスライド送り・閲覧ができます
        </p>
      </div>
    )
  }

  // Googleスライド以外: ラベル（ファイル名）を主表示、ラベル未設定時はURL表示にフォールバック
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-blue-600 hover:bg-gray-100 hover:underline"
      title={url}
    >
      <ExternalLink className="h-4 w-4 flex-shrink-0" />
      <span className="break-all">{trimmedLabel || url}</span>
    </a>
  )
}
