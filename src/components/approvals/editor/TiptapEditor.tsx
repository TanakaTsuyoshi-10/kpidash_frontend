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
import { Plugin, TextSelection } from '@tiptap/pm/state'
import { TableMap } from '@tiptap/pm/tables'
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
          // 横並び時の calc(50% - 8px) 形式からも % 値を取り出す
          const m = style.match(/width:\s*(?:calc\()?\s*([\d.]+%)/)
          return m ? m[1] : element.getAttribute('width')
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          // 横並び時は右マージン(8px)分を差し引き、「中(50%)」2枚が横にぴったり収まるようにする
          if (attributes.align === 'inline' && /%$/.test(attributes.width)) {
            return { style: `width: calc(${attributes.width} - 8px)` }
          }
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
          // 横並び: 隣接する横並び画像同士が同じ行に並ぶ
          if (attributes.align === 'inline') {
            return {
              'data-align': 'inline',
              style: 'display: inline-block; vertical-align: top; margin-right: 8px',
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
// =============================================================================
// 文字サイズ（textStyle マークの font-size 属性）
// =============================================================================

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
})

/** ツールバーの文字サイズ候補（プリセット） */
const FONT_SIZE_PRESETS = [
  { value: '', label: '標準' },
  { value: '12px', label: '小' },
  { value: '18px', label: '大' },
  { value: '24px', label: '特大' },
  { value: '32px', label: '見出し' },
] as const

/** px 直接指定の候補 */
const FONT_SIZE_PX = [
  '10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px',
  '20px', '22px', '24px', '26px', '28px', '32px', '36px', '40px', '48px',
] as const

// =============================================================================
// Excel等からの表ペースト
// =============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Excel/スプレッドシートからペーストされたHTML内の表を、
 * エディタのスタイルに合わせたクリーンな表HTMLに変換する。
 * 元のフォント・色・罫線などの装飾はすべて破棄し、
 * セルのテキストと結合（rowspan/colspan）のみを引き継ぐ。
 */
function cleanPastedTableHtml(html: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const tables = Array.from(doc.querySelectorAll('table'))
    if (tables.length === 0) return null

    const parts: string[] = []
    for (const table of tables) {
      // ネストした表は外側のみ対象にする
      if (table.parentElement?.closest('table')) continue
      const rows = Array.from(table.querySelectorAll('tr')).filter(
        (tr) => tr.closest('table') === table
      )
      if (rows.length === 0) continue

      const rowsHtml = rows
        .map((tr) => {
          const cells = Array.from(tr.children).filter(
            (c) => c.tagName === 'TD' || c.tagName === 'TH'
          )
          const cellsHtml = cells
            .map((cell) => {
              const el = cell as HTMLTableCellElement
              const attrs: string[] = []
              if (el.colSpan > 1) attrs.push(`colspan="${el.colSpan}"`)
              if (el.rowSpan > 1) attrs.push(`rowspan="${el.rowSpan}"`)
              const text = escapeHtml((el.textContent ?? '').replace(/\s+/g, ' ').trim())
              return `<td${attrs.length ? ' ' + attrs.join(' ') : ''}><p>${text}</p></td>`
            })
            .join('')
          return `<tr>${cellsHtml}</tr>`
        })
        .join('')
      parts.push(`<table><tbody>${rowsHtml}</tbody></table>`)
    }
    return parts.length > 0 ? parts.join('<p></p>') : null
  } catch {
    return null
  }
}

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
 * 行の高さ（縦幅）を指定できる TableRow
 *
 * height はあくまで「希望の高さ」で、CSS のテーブル仕様により
 * 行の実際の高さは中身（文字サイズ）より小さくならない。
 * → 最小サイズは自動的に文字サイズに追従する。
 */
const ResizableTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      height: {
        default: null,
        parseHTML: (element) => {
          const h = (element as HTMLElement).style.height
          return h ? parseInt(h, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { style: `height: ${attributes.height}px` }
        },
      },
    }
  },
})

/** 行の高さ候補（px）。「自動」は指定なし＝中身に合わせる */
const ROW_HEIGHTS = [30, 40, 50, 60, 80, 100, 120] as const

/**
 * 表内の上下キーで上下の行（同じ列のセル）へ移動する
 *
 * ProseMirror の表はセル内での上下キー移動が効かないため、
 * セルの端（視覚的に最上行/最下行）にカーソルがある場合のみ
 * 上下の行の同じ列のセルへ選択を移す。表の外や、セル内で
 * まだ上下に行がある場合はブラウザ標準の動作に任せる。
 */
function navigateTableRow(
  editor: Editor,
  dir: -1 | 1,
): boolean {
  const { state, view } = editor
  const { $from, empty } = state.selection
  if (!empty) return false

  // セルを探す
  let cellDepth = -1
  for (let d = $from.depth; d > 0; d--) {
    const name = $from.node(d).type.name
    if (name === 'tableCell' || name === 'tableHeader') {
      cellDepth = d
      break
    }
  }
  if (cellDepth === -1) return false

  // セル内でまだ上下に移動できる場合は標準動作に任せる
  // （折り返しも考慮して視覚的な端かどうかを判定）
  if (!view.endOfTextblock(dir === 1 ? 'down' : 'up')) return false

  const tableDepth = cellDepth - 2 // cell < row < table
  if (tableDepth < 0) return false
  const tableNode = $from.node(tableDepth)
  if (tableNode.type.name !== 'table') return false
  const tableStart = $from.start(tableDepth)
  const map = TableMap.get(tableNode)
  const cellRelPos = $from.before(cellDepth) - tableStart
  const rect = map.findCell(cellRelPos)

  const targetRow = dir === 1 ? rect.bottom : rect.top - 1
  if (targetRow < 0 || targetRow >= map.height) return false

  const targetCellRel = map.positionAt(targetRow, rect.left, tableNode)
  const targetCellPos = tableStart + targetCellRel
  // 探索方向は常に前方（セル先頭から中へ）。逆方向だと手前のセルに抜けてしまう
  const selection = TextSelection.near(
    state.doc.resolve(targetCellPos + 1),
    1,
  )
  view.dispatch(state.tr.setSelection(selection).scrollIntoView())
  return true
}

const TableRowNavigation = Extension.create({
  name: 'tableRowNavigation',
  addKeyboardShortcuts() {
    return {
      ArrowDown: ({ editor }) => navigateTableRow(editor as Editor, 1),
      ArrowUp: ({ editor }) => navigateTableRow(editor as Editor, -1),
    }
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
      FontSize,
      Color,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right'],
      }),
      Indent,
      ContinuousOrderedList,
      Table.configure({ resizable: true }),
      ResizableTableRow,
      TableRowNavigation,
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
        const cb = event.clipboardData
        if (!cb || !editor) return false

        // Excel等の表: クリップボードに画像とHTMLが同時に載るため、
        // 表HTMLがあれば画像より優先し、装飾を除去して表として貼り付ける
        const html = cb.getData('text/html')
        if (html && /<table[\s>]/i.test(html)) {
          const cleaned = cleanPastedTableHtml(html)
          if (cleaned) {
            event.preventDefault()
            editor.chain().focus().insertContent(cleaned).run()
            return true
          }
        }

        // 画像（スクリーンショット等）のペースト
        for (const item of Array.from(cb.items)) {
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

  /** カーソルのある表の行の height 属性（未指定は null） */
  const currentRowHeight: number | null = (() => {
    if (!isInTable) return null
    const { $from } = editor.state.selection
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d)
      if (node.type.name === 'tableRow') return node.attrs.height ?? null
    }
    return null
  })()

  /** カーソルのある行の高さを設定する（null で自動＝中身に合わせる） */
  const setRowHeight = (height: number | null) => {
    const { state, view } = editor
    const { $from } = state.selection
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d)
      if (node.type.name === 'tableRow') {
        const pos = $from.before(d)
        view.dispatch(
          state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, height })
        )
        editor.commands.focus()
        return
      }
    }
  }

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
    <div className="border rounded-md bg-white flex flex-col max-h-[75vh]">
      {/* ツールバー（ヘッダー固定: 本文が長い場合は本文側だけがスクロールする） */}
      <div className="shrink-0 flex flex-wrap items-center gap-1 border-b px-2 py-1.5 bg-gray-50 rounded-t-md">
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

        {/* 文字サイズ */}
        <select
          value={editor.getAttributes('textStyle').fontSize ?? ''}
          onChange={(e) => {
            const size = e.target.value
            if (size) {
              editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
            } else {
              // 標準に戻す: fontSize を外し、空になった textStyle マークは除去
              editor
                .chain()
                .focus()
                .setMark('textStyle', { fontSize: null })
                .removeEmptyTextStyle()
                .run()
            }
          }}
          className="h-7 px-1.5 rounded border border-gray-300 bg-white text-xs text-gray-700"
          title="文字サイズ"
          disabled={disabled}
        >
          <optgroup label="プリセット">
            {FONT_SIZE_PRESETS.map((f) => (
              <option key={f.value || 'default'} value={f.value}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="サイズ指定（px）">
            {FONT_SIZE_PX.map((px) => (
              <option key={px} value={px}>
                {px}
              </option>
            ))}
          </optgroup>
        </select>

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
            <span className="w-px h-5 bg-gray-300 mx-1" />
            <span className="text-xs text-gray-500 mr-0.5">並び:</span>
            {(
              [
                { label: '縦', value: 'left', title: '画像を縦に並べる（標準）' },
                { label: '横', value: 'inline', title: '隣り合う画像を横に並べる' },
              ] as const
            ).map((o) => {
              const active =
                o.value === 'inline'
                  ? currentAlign === 'inline'
                  : currentAlign !== 'inline'
              return (
                <button
                  key={o.value}
                  type="button"
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .updateAttributes('image', { align: o.value, indent: 0 })
                      .run()
                  }
                  title={o.title}
                  disabled={disabled}
                >
                  {o.label}
                </button>
              )
            })}
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

      {/* 表操作パネル（表内にカーソルがある時のみ表示・ツールバーと同様に固定） */}
      {isInTable && (
        <div className="shrink-0 flex flex-wrap items-center gap-1 border-b px-2 py-1.5 bg-blue-50/60">
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

          {/* 行の高さ（最小は文字サイズに応じて自動確保される） */}
          <span className="text-xs text-gray-500">行の高さ:</span>
          <select
            value={currentRowHeight ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setRowHeight(v ? parseInt(v, 10) : null)
            }}
            className="h-6 px-1 rounded border border-gray-300 bg-white text-xs text-gray-700"
            title="カーソルのある行の高さ"
            disabled={disabled}
          >
            <option value="">自動</option>
            {ROW_HEIGHTS.map((h) => (
              <option key={h} value={h}>
                {h}px
              </option>
            ))}
          </select>

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

      <div className="flex-1 min-h-0 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <p className="shrink-0 px-3 py-2 border-t text-xs text-gray-400">
        画像はドラッグ&ドロップまたは貼り付けで挿入できます。画像をクリックするとサイズ・配置（左/中央/右）・インデントを変更できます。
        複数の画像を横に並べるには、各画像で「並び: 横」を選択してください（サイズ「中」なら2枚、「小」なら4枚まで並びます）。文字色は
        Slack 投稿には反映されません。
      </p>
    </div>
  )
}
