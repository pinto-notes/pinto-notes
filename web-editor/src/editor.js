// The web note editor: Pinto's markdown, one block per line, in ProseMirror (through Tiptap).
// The app talks to it through window.PintoEditor and the "pinto" message handler.
import { Editor, Node, Mark, Extension, InputRule, mergeAttributes, markInputRule } from '@tiptap/core'
import { TextSelection, Plugin } from '@tiptap/pm/state'
import { Fragment, Slice } from '@tiptap/pm/model'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import History from '@tiptap/extension-history'
import CodeBlock from '@tiptap/extension-code-block'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import { parse, serialize, serializeBlock, parseLine, htmlToMarkdown } from './markdown.js'

const native = window.webkit?.messageHandlers?.pinto
const post = msg => { try { native ? native.postMessage(msg) : console.log('[pinto]', msg) } catch (e) {} }
const log = (...a) => post({ type: 'log', message: a.map(String).join(' ') })
window.addEventListener('error', e => log('error:', e.message, e.filename + ':' + e.lineno))

// --- Schema -------------------------------------------------------------------------------

// A list line: bullet, number or checkbox, with its indent kept exactly as written.
const Item = Node.create({
  name: 'item', group: 'block', content: 'inline*', defining: true,
  addAttributes() {
    return {
      indent: { default: '' }, marker: { default: '-' }, gap: { default: ' ' },
      box: { default: null }, boxGap: { default: null }, checked: { default: false },
    }
  },
  parseHTML() { return [{ tag: 'div[data-item]', getAttrs: el => JSON.parse(el.getAttribute('data-item') || '{}') }] },
  renderHTML({ node }) { return ['div', { 'data-item': JSON.stringify(node.attrs) }, 0] },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      const mark = document.createElement('span'); mark.contentEditable = 'false'; mark.className = 'mk'
      const text = document.createElement('span'); text.className = 'tx'
      dom.append(mark, text)
      const draw = n => {
        const a = n.attrs, depth = depthOf(a.indent)
        dom.className = 'item ' + (a.box ? 'task' : /\d/.test(a.marker) ? 'ordered' : 'bullet') + (a.checked ? ' done' : '') + (n.content.size ? '' : ' empty')
        dom.style.setProperty('--depth', depth)
        mark.textContent = a.box ? '' : /\d/.test(a.marker) ? a.marker : '•'
        mark.setAttribute('role', a.box ? 'checkbox' : 'presentation')
        if (a.box) { mark.setAttribute('aria-checked', a.checked ? 'true' : 'false'); mark.setAttribute('aria-label', 'Done') } else { mark.removeAttribute('aria-checked'); mark.removeAttribute('aria-label') }
      }
      draw(node)
      const toggle = e => {
        const pos = getPos(); const cur = editor.state.doc.nodeAt(pos)
        if (!cur?.attrs.box || !editor.isEditable) return
        e.preventDefault(); e.stopPropagation()
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...cur.attrs, checked: !cur.attrs.checked }))
      }
      mark.addEventListener('mousedown', toggle)
      mark.addEventListener('touchend', toggle)
      return { dom, contentDOM: text, update: n => { if (n.type.name !== 'item') return false; draw(n); return true }, ignoreMutation: m => m.target === mark || mark.contains(m.target) || m.type === 'attributes' && m.target === dom }
    }
  },
})
const depthOf = indent => indent.replace(/\t/g, '  ').length >> 1

const Quote = Node.create({
  name: 'quote', group: 'block', content: 'inline*', defining: true,
  addAttributes() { return { prefix: { default: '> ' } } },
  parseHTML() { return [{ tag: 'div.quote' }] },
  renderHTML() { return ['div', { class: 'quote' }, 0] },
})

// Lines kept exactly as written, drawn as what they are.
const rawAtom = (name, draw) => Node.create({
  name, group: 'block', atom: true, selectable: true, draggable: name !== 'hidden',
  addAttributes() { return { raw: { default: '' }, title: { default: null }, alt: { default: null }, src: { default: null } } },
  parseHTML() { return [{ tag: `div[data-${name}]`, getAttrs: el => ({ raw: el.getAttribute(`data-${name}`) }) }] },
  renderHTML({ node }) { return ['div', { [`data-${name}`]: node.attrs.raw }] },
  addNodeView() { return ({ node }) => { const dom = document.createElement('div'); dom.contentEditable = 'false'; draw(dom, node.attrs); return { dom } } },
})
const Divider = rawAtom('divider', dom => { dom.className = 'divider' })
const Hidden = rawAtom('hidden', dom => { dom.className = 'hidden-line' })
const Embed = rawAtom('embed', (dom, a) => {
  dom.className = 'embed'; dom.textContent = a.title.split('|')[0]
  dom.onclick = () => post({ type: 'openNote', title: a.title.split('|')[0].split('#')[0] })
})
const Image = rawAtom('image', (dom, a) => {
  dom.className = 'picture'
  if (/^pane-file:/.test(a.src) || /^https?:/.test(a.src)) {
    const img = document.createElement('img'); img.alt = a.alt; img.src = a.src; img.draggable = false
    img.onerror = () => { dom.textContent = a.alt || 'Picture'; dom.className = 'picture missing' }
    dom.append(img)
  } else dom.textContent = a.alt
})

const PintoCodeBlock = CodeBlock.extend({
  addAttributes() { return { ...this.parent?.(), open: { default: '```' }, close: { default: '```' } } },
})

// Table cells hold one line of text.
const Cell = TableCell.extend({ content: 'paragraph' })
const HeaderCell = TableHeader.extend({ content: 'paragraph' })
const PintoTable = Table.extend({ addAttributes() { return { ...this.parent?.(), sep: { default: null } } } })

const Wiki = Mark.create({
  name: 'wiki', inclusive: false,
  parseHTML() { return [{ tag: 'a[data-wiki]' }] },
  renderHTML({ HTMLAttributes }) { return ['a', mergeAttributes(HTMLAttributes, { 'data-wiki': '', class: 'wiki' }), 0] },
  addInputRules() { return [markInputRule({ find: /\[\[([^\]\n]+)\]\]$/, type: this.type })] },
})
const Tag = Mark.create({
  name: 'tag', inclusive: false,
  parseHTML() { return [{ tag: 'span.tag' }] },
  renderHTML() { return ['span', { class: 'tag' }, 0] },
})
const PintoItalic = Italic.extend({ addAttributes() { return { delim: { default: '*' } } } })
const PintoLink = Link.extend({ inclusive: false }).configure({ openOnClick: false, autolink: false, linkOnPaste: false })

// --- Editing behaviour, as Notes does it --------------------------------------------------

const lineStart = (state, $from) => $from.parentOffset === 0 && state.selection.empty
const itemType = s => s.schema.nodes.item

function blockRules() {
  const toItem = (attrs) => ({ state, range }) => {
    const $from = state.doc.resolve(range.from)
    if ($from.depth !== 1 || $from.parent.type.name !== 'paragraph') return null
    state.tr.delete(range.from, range.to).setBlockType(range.from, range.from, itemType(state), attrs)
  }
  return [
    new InputRule({ find: /^\s*(\[ ?\]|- \[ ?\]) $/, handler: toItem({ marker: '-', gap: ' ', box: '[ ]', boxGap: ' ', checked: false, indent: '' }) }),
    new InputRule({ find: /^([-*+]) $/, handler: ({ state, range, match }) => toItem({ marker: match[1], gap: ' ', indent: '' })({ state, range }) }),
    new InputRule({ find: /^(\d+[.)]) $/, handler: ({ state, range, match }) => toItem({ marker: match[1], gap: ' ', indent: '' })({ state, range }) }),
    new InputRule({ find: /^> $/, handler: ({ state, range }) => { const $f = state.doc.resolve(range.from); if ($f.depth !== 1 || $f.parent.type.name !== 'paragraph') return null; state.tr.delete(range.from, range.to).setBlockType(range.from, range.from, state.schema.nodes.quote, { prefix: '> ' }) } }),
    new InputRule({ find: /^(#{1,3}) $/, handler: ({ state, range, match }) => { const $f = state.doc.resolve(range.from); if ($f.depth !== 1 || $f.parent.type.name !== 'paragraph') return null; state.tr.delete(range.from, range.to).setBlockType(range.from, range.from, state.schema.nodes.heading, { level: match[1].length }) } }),
    new InputRule({ find: /^---$/, handler: ({ state, range }) => { const $f = state.doc.resolve(range.from); if ($f.depth !== 1 || $f.parent.type.name !== 'paragraph' || $f.parent.textContent !== '--') return null; state.tr.replaceWith(range.from - 1, range.to + 1, state.schema.nodes.divider.create({ raw: '---' })) } }),
  ]
}

const nextMarker = m => { const d = m.match(/^(\d+)([.)])$/); return d ? `${+d[1] + 1}${d[2]}` : m }

const Behaviour = Extension.create({
  name: 'pintoBehaviour',
  addInputRules() { return blockRules() },
  addKeyboardShortcuts() {
    const ed = this.editor
    const inItem = () => { const $f = ed.state.selection.$from; return $f.parent.type.name === 'item' ? $f : null }
    const indent = out => () => {
      const { state } = ed; const { from, to } = state.selection; let tr = state.tr, hit = false
      state.doc.nodesBetween(from, to, (n, pos) => {
        if (n.type.name !== 'item') return n.type.name === 'doc'
        hit = true
        let ind = n.attrs.indent
        if (out) ind = ind.startsWith('\t') ? ind.slice(1) : ind.slice(Math.min(2, ind.length - ind.trimStart().length))
        else ind = '  ' + ind
        tr = tr.setNodeMarkup(pos, undefined, { ...n.attrs, indent: ind })
        return false
      })
      if (!hit) return false
      ed.view.dispatch(tr); return true
    }
    return {
      Enter: () => {
        const $f = inItem(); if (!$f) return false
        const n = $f.parent
        if (n.content.size === 0) {
          // An empty item steps out: first its indent, then the list.
          if (n.attrs.indent) return indent(true)()
          return ed.commands.setNode('paragraph')
        }
        const attrs = { ...n.attrs, checked: false, marker: nextMarker(n.attrs.marker), box: n.attrs.box ? '[ ]' : null, boxGap: n.attrs.box ? ' ' : null }
        return ed.chain().splitBlock().command(({ tr }) => { tr.setNodeMarkup(tr.selection.$from.before(), itemType(ed.state), attrs); return true }).run()
      },
      Backspace: () => {
        const $f = inItem(); if (!$f || !lineStart(ed.state, $f)) return false
        return ed.commands.setNode('paragraph')
      },
      Tab: indent(false),
      'Shift-Tab': indent(true),
      'Mod-Shift-l': () => {
        const { $from } = ed.state.selection; const n = $from.parent; const pos = $from.before()
        if (n.type.name === 'item' && n.attrs.box) return ed.commands.setNode('paragraph')
        const attrs = { indent: n.attrs?.indent || '', marker: '-', gap: ' ', box: '[ ]', boxGap: ' ', checked: false }
        if (n.type.name === 'item') { ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { ...n.attrs, ...attrs, indent: n.attrs.indent })); return true }
        return ed.commands.setNode('item', attrs)
      },
      'Mod-Enter': () => {
        const $f = inItem(); if (!$f?.parent.attrs.box) return false
        ed.view.dispatch(ed.state.tr.setNodeMarkup($f.before(), undefined, { ...$f.parent.attrs, checked: !$f.parent.attrs.checked })); return true
      },
    }
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        // Copy as Pinto markdown; paste text as lines, and web pages through their structure.
        clipboardTextSerializer: slice => {
          const blocks = []; slice.content.forEach(n => blocks.push(n.isTextblock || n.type.name === 'table' || n.isAtom ? serializeBlock(n.toJSON()) : n.textContent))
          return blocks.join('\n')
        },
        handlePaste: (view, event) => {
          const html = event.clipboardData?.getData('text/html')
          const plain = event.clipboardData?.getData('text/plain')
          if (html && /data-pm-slice/.test(html)) return false // from this editor: keep as is
          let md = plain ?? ''
          if (html) { const d = document.createElement('div'); d.innerHTML = html; md = htmlToMarkdown(d) || md }
          if (!md.includes('\n')) return false
          const doc = view.state.schema.nodeFromJSON(parse(md))
          view.dispatch(view.state.tr.replaceSelection(new Slice(doc.content, 1, 1)).scrollIntoView())
          return true
        },
        handleClickOn: (view, pos, node, nodePos, event) => {
          const a = event.target.closest?.('a'); if (!a || !(event.metaKey || !view.editable || a.classList.contains('wiki'))) return false
          if (a.classList.contains('wiki')) post({ type: 'openNote', title: a.textContent.split('|')[0].split('#')[0] })
          else if (a.getAttribute('href')) post({ type: 'openLink', href: a.getAttribute('href') })
          return true
        },
      },
    })]
  },
})

// --- The editor -------------------------------------------------------------------------

let editor = null, lastSent = null, header = null, guardFailed = false
const sendSoon = (() => {
  let queued = false
  return () => {
    if (queued) return; queued = true
    requestAnimationFrame(() => {
      queued = false
      const text = serialize(editor.getJSON())
      if (text === lastSent) return
      lastSent = text
      post({ type: 'change', text })
    })
  }
})()

function makeEditor(el, text, editable) {
  return new Editor({
    element: el,
    extensions: [
      Document, Paragraph, Text, Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Bold, PintoItalic, Strike, Code, Highlight, PintoLink, Wiki, Tag,
      History, PintoCodeBlock, PintoTable.configure({ resizable: false }), TableRow, Cell, HeaderCell,
      Dropcursor, Gapcursor, Item, Quote, Divider, Hidden, Embed, Image, Behaviour,
    ],
    content: parse(text),
    editable,
    editorProps: { attributes: { class: 'note', spellcheck: 'true', autocorrect: 'on', autocapitalize: 'sentences', role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Note' } },
    onUpdate: () => { if (!guardFailed) sendSoon() },
  })
}

// Swap only the blocks that changed, so the caret and undo stay where they are.
function receive(text) {
  if (!editor || text === lastSent) return
  lastSent = text
  const next = editor.schema.nodeFromJSON(parse(text))
  const cur = editor.state.doc
  const start = cur.content.findDiffStart(next.content)
  if (start == null) return
  let { a: endA, b: endB } = cur.content.findDiffEnd(next.content)
  const overlap = start - Math.min(endA, endB)
  if (overlap > 0) { endA += overlap; endB += overlap }
  const tr = editor.state.tr.replace(start, endA, next.slice(start, endB)).setMeta('addToHistory', false)
  editor.view.dispatch(tr)
}

function applyStyle(s) {
  if (!s) return
  const r = document.documentElement.style
  const px = (k, v) => v != null && r.setProperty(k, v + 'px')
  px('--body', s.body); px('--title', s.title); px('--label', s.label); px('--line-gap', s.lineSpacing)
  if (s.font) r.setProperty('--face', { serif: 'ui-serif, "New York", Georgia, serif', rounded: 'ui-rounded, "SF Pro Rounded", system-ui', mono: 'ui-monospace, "SF Mono", Menlo, monospace' }[s.font] || '-apple-system, system-ui, sans-serif')
  for (const [scheme, colors] of Object.entries(s.colors || {})) {
    let css = document.getElementById('c-' + scheme)
    if (!css) { css = document.createElement('style'); css.id = 'c-' + scheme; document.head.append(css) }
    const decl = Object.entries(colors).map(([k, v]) => `--${k}:${v}`).join(';')
    css.textContent = scheme === 'dark' ? `@media (prefers-color-scheme: dark){:root{${decl}}}` : `:root{${decl}}`
  }
  document.documentElement.dataset.platform = s.platform || 'mac'
}

function load(opts) {
  const text = opts.text ?? ''
  applyStyle(opts.style)
  header = opts.header
  document.getElementById('date').textContent = header || ''
  // The guard: if this note wouldn't come back exactly, it opens read-only.
  const back = serialize(parse(text))
  guardFailed = back !== text
  if (guardFailed) {
    const i = [...text].findIndex((c, k) => c !== back[k])
    log('round-trip guard failed at', i, JSON.stringify(text.slice(Math.max(0, i - 20), i + 20)))
  }
  document.getElementById('guard').hidden = !guardFailed
  if (editor) editor.destroy()
  lastSent = text
  editor = makeEditor(document.getElementById('editor'), text, !opts.readOnly && !guardFailed)
  if (opts.focus) requestAnimationFrame(() => editor.commands.focus('end'))
  post({ type: 'loaded', ms: Math.round(performance.now() - t0), blocks: editor.state.doc.childCount, guard: !guardFailed })
}
const t0 = performance.now()

window.PintoEditor = {
  load, receive,
  focus: () => editor?.commands.focus(),
  text: () => editor ? serialize(editor.getJSON()) : null,
}

document.addEventListener('DOMContentLoaded', () => {
  if (native) post({ type: 'ready' })
  else load({ text: 'Web editor\n\nOpen this page from Pinto to edit a note.\n\n## Try\n- [ ] A checklist item\n- [x] Done\n  - nested bullet\n\n| A | B |\n| --- | --- |\n| 1 | 2 |', header: 'Today' })
})
