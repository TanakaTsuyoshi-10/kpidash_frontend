/**
 * リッチテキストエディタ（Tiptap v3）
 *
 * - 太字 / 下線 / 取り消し線 / 文字色 / 箇条書き / インデント
 * - 画像の貼り付け・ドラッグ&ドロップ（Supabase Storage へ即時アップロード）
 * - 画像サイズ変更（画像を選択するとツールバーにサイズボタンが出る）
 * - HTML を onChange で親へ返す（保存形式は HTML）
 */
'use client'

import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ImagePlus,
  Undo2,
  Redo2,
  RemoveFormatting,
  IndentIncrease,
  IndentDecrease,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadAttachment } from '@/lib/api/approvals'
import type { ApprovalAttachment } from '@/types/approval'

const COLOR_PRESETS = [
  { label: '黒', value: '#111827' },
  { label: '赤', value: '#dc2626' },
  { label: '青', value: '#2563eb' },
  { label: '緑', value: '#16a34a' },
  { label: 'オレンジ', value: '#ea580c' },
]

const IMAGE_SIZES = [
  { label: '小', value: '25%' },
  { label: '中', value: '50%' },
  { label: '大', value: '75%' },
  { label: '原寸', value: null },
]

const MAX_INDENT = 8
const INDENT_PX = 24

// セル背景色プリセット（薄めの色 + クリア）
const CELL_COLORS = [
  { label: 'なし', value: null, swatch: '#ffffff' },
  { label: 'グレー', value: '#f3f4f6', swatch: '#f3f4f6' },
  { label: '黄', value: '#fef9c3', swatch: '#fef9c3' },
  { label: '緑', value: '#dcfce7', swatch: '#dcfce7' },
  { label: '青', value: '#dbeafe', swatch: '#dbeafe' },
  { label: '赤', value: '#fee2e2', swatch: '#fee2e2' },
  { label: 'オレンジ', value: '#ffedd5', swatch: '#ffedd5' },
]

// =============================================================================
// カスタム拡張
// =============================================================================

/** width / 配置 / インデント対応の画像 */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const style = element.getAttribute('style') ?? ''
          const m = style.match(/width:\s*([\d.]+%)/)
          return m ? m[1] : element.getAttribute('width')
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { style: `width: ${attributes.width}` }
        },
      },
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'left',
        renderHTML: (attributes) => {
          if (attributes.align === 'center') {
            return {
              'data-align': 'center',
              style: 'display: block; margin-left: auto; margin-right: auto',
            }
          }
          if (attributes.align === 'right') {
            return {
              'data-align': 'right',
              style: 'display: block; margin-left: auto',
            }
          }
          return { style: 'display: block' }
        },
      },
      indent: {
        default: 0,
        parseHTML: (element) => {
          const v = parseInt(element.getAttribute('data-indent') ?? '0', 10)
          return Number.isNaN(v) ? 0 : v
        },
        renderHTML: (attributes) => {
          // 中央・右寄せ時は margin が競合するためインデントは左寄せ時のみ有効
          if (!attributes.indent || attributes.align !== 'left') return {}
          return {
            'data-indent': String(attributes.indent),
            style: `margin-left: ${attributes.indent * INDENT_PX}px`,
          }
        },
      },
    }
  },
})

/** 段落・見出しのインデント（margin-left ベース）＋ Tab / Shift+Tab */
const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const ml = parseInt(element.style.marginLeft || '0', 10)
              return Number.isNaN(ml) ? 0 : Math.round(ml / INDENT_PX)
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) return {}
              return { style: `margin-left: ${attributes.indent * INDENT_PX}px` }
            },
          },
        },
      },
    ]
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // リスト内は list の入れ子として処理
        if (editor.isActive('listItem')) {
          return editor.chain().focus().sinkListItem('listItem').run()
        }
        return applyIndent(editor as Editor, 1)
      },
      'Shift-Tab': ({ editor }) => {
        if (editor.isActive('listItem')) {
          return editor.chain().focus().liftListItem('listItem').run()
        }
        return applyIndent(editor as Editor, -1)
      },
    }
  },
})

/** 背景色を保持できるテーブルセル属性（TableCell / TableHeader 共通） */
const cellBackgroundAttribute = {
  backgroundColor: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-bg-color') ??
      (element.style.backgroundColor || null),
    renderHTML: (attributes: Record<string, unknown>) => {
      if (!attributes.backgroundColor) return {}
      return {
        'data-bg-color': attributes.backgroundColor,
        style: `background-color: ${attributes.backgroundColor}`,
      }
    },
  },
}

const ColoredTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellBackgroundAttribute }
  },
})

const ColoredTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellBackgroundAttribute }
  },
})

/**
 * 番号付きリストの連番継続
 *
 * 空行（空の段落）や画像だけを挟んで番号付きリストが分かれた場合、
 * 次のリストの開始番号を前のリストからの連番に自動調整する。
 * テキストのある段落や見出しを挟んだ場合は新しいリスト（1から）になる。
 */
const ContinuousOrderedList = Extension.create({
  name: 'continuousOrderedList',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null

          const tr = newState.tr
          let modified = false
          // 直前までの連番チェーンの最終番号（チェーンが切れたら null）
          let cumulative: number | null = null

          newState.doc.forEach((node, pos) => {
            if (node.type.name === 'orderedList') {
              const desiredStart = cumulative === null ? 1 : cumulative + 1
              if ((node.attrs.start ?? 1) !== desiredStart) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  start: desiredStart,
                })
                modified = true
              }
              cumulative = desiredStart + node.childCount - 1
            } else if (
              (node.type.name === 'paragraph' && node.content.size === 0) ||
              node.type.name === 'image'
            ) {
              // 空行・画像はチェーンを維持する（番号を続ける）
            } else {
              // テキスト段落・見出し等はチェーンを切る（次のリストは1から）
              cumulative = null
            }
          })

          return modified ? tr : null
        },
      }),
    ]
  },
})

/** 選択中の画像/段落/見出しの indent を増減する */
function applyIndent(editor: Editor, delta: 1 | -1): boolean {
  const type = editor.isActive('image')
    ? 'image'
    : editor.isActive('heading')
      ? 'heading'
      : 'paragraph'
  const current = (editor.getAttributes(type).indent as number) || 0
  const next = Math.max(0, Math.min(MAX_INDENT, current + delta))
  if (next === current) return delta > 0 ? true : false
  // 画像をインデントする場合は左寄せに戻す（中央/右寄せとは併用しない）
  const attrs =
    type === 'image' ? { indent: next, align: 'left' } : { indent: next }
  return editor.chain().focus().updateAttributes(type, attrs).run()
}

// =============================================================================
// アップロード
// =============================================================================

async function uploadAndInsert(
  editor: Editor,
  file: File,
  onImageUploaded?: (attachment: ApprovalAttachment) => void
) {
  if (!file.type.startsWith('image/')) {
    toast.error('画像ファイルのみ添付できます')
    return
  }
  const loadingToast = toast.loading('画像をアップロード中...')
  try {
    const result = await uploadAttachment(file)
    editor
      .chain()
      .focus()
      .setImage({ src: result.url, alt: result.filename })
      .run()
    onImageUploaded?.(result)
    toast.success('画像を挿入しました', { id: loadingToast })
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'アップロードに失敗しました', {
      id: loadingToast,
    })
  }
}

// =============================================================================
// エディタ本体
// =============================================================================

interface TiptapEditorProps {
  initialHtml?: string
  placeholder?: string
  onChange: (html: string, plainText: string) => void
  onImageUploaded?: (attachment: ApprovalAttachment) => void
  disabled?: boolean
}

export function TiptapEditor({
  initialHtml = '',
  placeholder = '本文を入力してください…',
  onChange,
  onImageUploaded,
  disabled = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    // ツールバーの活性状態（isActive）を正しく追随させる
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: false, allowBase64: false }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right'],
      }),
      Indent,
      ContinuousOrderedList,
      Table.configure({ resizable: true }),
      TableRow,
      ColoredTableHeader,
      ColoredTableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          'rich-content prose prose-sm max-w-none min-h-[320px] p-4 focus:outline-none ' +
          '[&_img]:max-w-full [&_img]:rounded-md [&_img.ProseMirror-selectednode]:ring-2 ' +
          '[&_img.ProseMirror-selectednode]:ring-blue-400 [&_ul]:list-disc [&_ol]:list-decimal ' +
          '[&_ul]:pl-5 [&_ol]:pl-5',
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (files && files.length > 0 && editor) {
          event.preventDefault()
          Array.from(files).forEach((file) =>
            uploadAndInsert(editor, file, onImageUploaded)
          )
          return true
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items || !editor) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              event.preventDefault()
              uploadAndInsert(editor, file, onImageUploaded)
              return true
            }
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText())
    },
  })

  useEffect(() => {
    if (editor && !disabled !== editor.isEditable) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  const insertImageFromPicker = useCallback(() => {
    if (!editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/gif,image/webp'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) uploadAndInsert(editor, file, onImageUploaded)
    }
    input.click()
  }, [editor, onImageUploaded])

  if (!editor) {
    return (
      <div className="border rounded-md min-h-[360px] animate-pulse bg-gray-50" />
    )
  }

  const btnClass = (active: boolean) =>
    `p-1.5 rounded hover:bg-gray-200 transition-colors ${
      active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
    }`

  const isImageSelected = editor.isActive('image')
  const currentImageWidth = editor.getAttributes('image').width ?? null
  const isInTable = editor.isActive('table')

  const ALIGNS = [
    { value: 'left', icon: AlignLeft, label: '左揃え' },
    { value: 'center', icon: AlignCenter, label: '中央揃え' },
    { value: 'right', icon: AlignRight, label: '右揃え' },
  ] as const

  /** 現在の配置（画像選択時は画像の align、それ以外は段落の textAlign） */
  const currentAlign: string = isImageSelected
    ? (editor.getAttributes('image').align ?? 'left')
    : editor.isActive({ textAlign: 'center' })
      ? 'center'
      : editor.isActive({ textAlign: 'right' })
        ? 'right'
        : 'left'

  /** 配置ボタン: 画像選択時は画像へ、それ以外は文字（段落）へ適用 */
  const setAlign = (value: 'left' | 'center' | 'right') => {
    if (isImageSelected) {
      editor
        .chain()
        .focus()
        .updateAttributes('image', { align: value, indent: 0 })
        .run()
    } else {
      editor.chain().focus().setTextAlign(value).run()
    }
  }

  return (
    <div className="border rounded-md bg-white">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5 bg-gray-50 rounded-t-md">
        <button
          type="button"
          className={btnClass(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="太字"
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(editor.isActive('underline'))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="下線"
          disabled={disabled}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="取り消し線"
          disabled={disabled}
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* 文字色 */}
        <div className="flex items-center gap-0.5">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: c.value }}
              onClick={() => editor.chain().focus().setColor(c.value).run()}
              title={`文字色: ${c.label}`}
              disabled={disabled}
            />
          ))}
        </div>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          className={btnClass(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="箇条書き"
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="番号付きリスト"
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* 配置（文字・画像共通: 画像選択時は画像へ、それ以外は文字へ適用） */}
        {ALIGNS.map((a) => (
          <button
            key={a.value}
            type="button"
            className={btnClass(currentAlign === a.value)}
            onClick={() => setAlign(a.value)}
            title={a.label}
            disabled={disabled}
          >
            <a.icon className="h-4 w-4" />
          </button>
        ))}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* インデント（文字・画像共通） */}
        <button
          type="button"
          className={btnClass(false)}
          onClick={() => {
            if (editor.isActive('listItem')) {
              editor.chain().focus().liftListItem('listItem').run()
            } else {
              applyIndent(editor, -1)
            }
          }}
          title="インデント解除（Shift+Tab）"
          disabled={disabled}
        >
          <IndentDecrease className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(false)}
          onClick={() => {
            if (editor.isActive('listItem')) {
              editor.chain().focus().sinkListItem('listItem').run()
            } else {
              applyIndent(editor, 1)
            }
          }}
          title="インデント（Tab）"
          disabled={disabled}
        >
          <IndentIncrease className="h-4 w-4" />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          className={btnClass(false)}
          onClick={insertImageFromPicker}
          title="画像を挿入"
          disabled={disabled}
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(isInTable)}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="表を挿入（3×3）"
          disabled={disabled || isInTable}
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(false)}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          title="書式をクリア"
          disabled={disabled}
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>

        {/* 画像サイズ・配置（画像選択時のみ表示） */}
        {isImageSelected && (
          <>
            <span className="w-px h-5 bg-gray-300 mx-1" />
            <span className="text-xs text-gray-500 mr-0.5">画像サイズ:</span>
            {IMAGE_SIZES.map((s) => (
              <button
                key={s.label}
                type="button"
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  currentImageWidth === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { width: s.value })
                    .run()
                }
                disabled={disabled}
              >
                {s.label}
              </button>
            ))}
          </>
        )}

        <span className="flex-1" />

        <button
          type="button"
          className={btnClass(false)}
          onClick={() => editor.chain().focus().undo().run()}
          title="元に戻す"
          disabled={disabled}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btnClass(false)}
          onClick={() => editor.chain().focus().redo().run()}
          title="やり直す"
          disabled={disabled}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      {/* 表操作パネル（表内にカーソルがある時のみ表示） */}
      {isInTable && (
        <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5 bg-blue-50/60">
          <span className="text-xs text-gray-500 mr-1">表:</span>
          {(
            [
              ['行を上に追加', () => editor.chain().focus().addRowBefore().run()],
              ['行を下に追加', () => editor.chain().focus().addRowAfter().run()],
              ['行を削除', () => editor.chain().focus().deleteRow().run()],
              ['列を左に追加', () => editor.chain().focus().addColumnBefore().run()],
              ['列を右に追加', () => editor.chain().focus().addColumnAfter().run()],
              ['列を削除', () => editor.chain().focus().deleteColumn().run()],
              ['セル結合', () => editor.chain().focus().mergeCells().run()],
              ['分割', () => editor.chain().focus().splitCell().run()],
              ['ヘッダー行', () => editor.chain().focus().toggleHeaderRow().run()],
            ] as const
          ).map(([label, onClick]) => (
            <button
              key={label}
              type="button"
              className="px-2 py-0.5 rounded text-xs bg-white border text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={onClick}
              disabled={disabled}
            >
              {label}
            </button>
          ))}

          <span className="w-px h-4 bg-gray-300 mx-1" />

          {/* セル背景色 */}
          <span className="text-xs text-gray-500">セル色:</span>
          {CELL_COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform text-[9px] leading-none text-gray-400"
              style={{ backgroundColor: c.swatch }}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setCellAttribute('backgroundColor', c.value)
                  .run()
              }
              title={`セル背景色: ${c.label}`}
              disabled={disabled}
            >
              {c.value === null ? '×' : ''}
            </button>
          ))}

          <span className="flex-1" />

          <button
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white border text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={disabled}
          >
            <Trash2 className="h-3 w-3" />
            表を削除
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <p className="px-3 pb-2 text-xs text-gray-400">
        画像はドラッグ&ドロップまたは貼り付けで挿入できます。画像をクリックするとサイズ・配置（左/中央/右）・インデントを変更できます。文字色は
        Slack 投稿には反映されません。
      </p>
    </div>
  )
}
