/**
 * アップロード結果表示コンポーネント
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadResult, ProductUploadResult, StorePLUploadResult, UploadError, ParseError } from '@/types/upload'

interface Props {
  result: UploadResult | null
}

// ProductUploadResultかどうかを判定する型ガード
function isProductResult(result: UploadResult): result is ProductUploadResult {
  return 'stores_processed' in result
}

// StorePLUploadResultかどうかを判定する型ガード
function isStorePLResult(result: UploadResult): result is StorePLUploadResult {
  return 'updated_count' in result || 'inserted_count' in result
}

// エラーが文字列かオブジェクトかを判定
function isParseError(error: UploadError): error is ParseError {
  return typeof error === 'object' && error !== null && 'message' in error
}

// エラーを表示用文字列に変換
function formatError(error: UploadError): string {
  if (typeof error === 'string') {
    return error
  }
  if (isParseError(error)) {
    const parts: string[] = []
    if (error.row !== undefined) {
      parts.push(`行${error.row}`)
    }
    if (error.column) {
      parts.push(`列「${error.column}」`)
    }
    parts.push(error.message)
    if (error.value) {
      parts.push(`（値: ${error.value}）`)
    }
    return parts.join(' ')
  }
  return String(error)
}

export function UploadResultDisplay({ result }: Props) {
  if (!result) {
    return null
  }

  const hasErrors = result.errors && result.errors.length > 0
  const hasWarnings = result.warnings && result.warnings.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          アップロード結果
          <Badge variant={result.success ? 'default' : 'destructive'}>
            {result.success ? '成功' : '失敗'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">対象期間</div>
            <div className="text-lg font-bold">
              {isStorePLResult(result) ? result.month : 'period' in result ? result.period : '-'}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">インポート件数</div>
            <div className="text-2xl font-bold text-green-600">
              {result.imported_count}
            </div>
          </div>
        </div>

        {/* 店舗別収支の追加情報 */}
        {isStorePLResult(result) && (result.updated_count > 0 || result.inserted_count > 0) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">新規登録</div>
              <div className="text-lg font-bold text-blue-600">
                {result.inserted_count}件
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">更新</div>
              <div className="text-lg font-bold text-yellow-600">
                {result.updated_count}件
              </div>
            </div>
          </div>
        )}

        {/* 商品別の追加情報 */}
        {isProductResult(result) && (
          <>
            {result.new_products && result.new_products.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  新規登録商品 ({result.new_products.length}件)
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.new_products.map((product, index) => (
                    <Badge key={index} variant="secondary">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.stores_processed && result.stores_processed.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  処理店舗 ({result.stores_processed.length}店舗)
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.stores_processed.map((store, index) => (
                    <Badge key={index} variant="outline">
                      {store.store_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.unmapped_products && result.unmapped_products.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-800 mb-2">
                  未マッピング商品 ({result.unmapped_products.length}件)
                </div>
                <div className="text-sm text-yellow-700">
                  {result.unmapped_products.join(', ')}
                </div>
              </div>
            )}
          </>
        )}

        {/* 警告 */}
        {hasWarnings && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 mb-2">
              警告 ({result.warnings.length}件)
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* エラー */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-2">
              エラー ({result.errors.length}件)
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {result.errors.map((error, index) => (
                <li key={index}>{formatError(error)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 店舗別収支の追加情報 */}
        {isStorePLResult(result) && result.message && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-700">{result.message}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
