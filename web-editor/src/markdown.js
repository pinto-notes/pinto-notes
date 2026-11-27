// Pinto's markdown, line by line, to and from the web editor's document (ProseMirror JSON).
//
// The rule that matters: serialize(parse(text)) === text for every note, byte for byte. Each
// line becomes one block. A line this file can't hold exactly stays as plain text, so a note
// is never rewritten by opening it.

const ITEM = /^([ \t]*)([-*+]|\d+[.)])( +)(?:(\[[ xX]\])( +|$))?(.*)$/
const HEADING = /^(#{1,6}) (.*)$/
const QUOTE = /^(> ?)(.*)$/
const DIVIDER = /^(?:-{3,}|\*{3,}|_{3,})$/
const IMAGE = /^!\[([^\]\n]*)\]\(([^)\s]+)\)$/
const EMBED = /^!\[\[([^\]\n]+)\]\]$/
const HIDDEN = /^<!--.*-->$/
const FENCE = /^(```|~~~)(.*)$/
const TABLE_ROW = /^\|.*\|$/
const TABLE_SEP = /^\|(?:\s*:?-{1,}:?\s*\|)+$/

// --- Inline -------------------------------------------------------------------------------

const INLINE = [
  { mark: 'code', re: /^`([^`\n]+)`/ },
  { mark: 'wiki', re: /^\[\[([^\]\n]+)\]\]/ },
  { mark: 'link', re: /^\[([^\]\n]+)\]\(([^)\s]+)\)/, attrs: m => ({ href: m[2] }) },
  { mark: 'bold', re: /^\*\*([^*\n]+)\*\*/ },
  { mark: 'strike', re: /^~~([^~\n]+)~~/ },
  { mark: 'highlight', re: /^==([^=\n]+)==/ },
  { mark: 'italic', re: /^\*([^*\n]+)\*/, attrs: () => ({ delim: '*' }) },
  { mark: 'italic', re: /^_([^_\n]+)_(?![\p{L}\p{N}])/u, attrs: () => ({ delim: '_' }), wordStart: true },
  { mark: 'tag', re: /^(#[\p{L}\p{N}_][\p{L}\p{N}_\-/]*)/u, wordStart: true },
]

function parseInlineRaw(s) {
  const out = []
  let plain = ''
  const flush = () => { if (plain) { out.push({ type: 'text', text: plain }); plain = '' } }
  let i = 0
  while (i < s.length) {
    const rest = s.slice(i)
    const prev = i > 0 ? s[i - 1] : ' '
    let hit = null
    for (const p of INLINE) {
      if (p.wordStart && /[\p{L}\p{N}_]/u.test(prev)) continue
      const m = rest.match(p.re)
      if (m) { hit = { p, m }; break }
    }
    if (!hit) { plain += s[i]; i++; continue }
    flush()
    const mark = { type: hit.p.mark }
    if (hit.p.attrs) mark.attrs = hit.p.attrs(hit.m)
    out.push({ type: 'text', text: hit.m[1], marks: [mark] })
    i += hit.m[0].length
  }
  flush()
  return out
}

// Outermost first, so a link that is also bold writes as [**x**](u).
const ORDER = ['link', 'wiki', 'tag', 'bold', 'italic', 'strike', 'highlight', 'code']
const markKey = m => m.type + (m.attrs ? JSON.stringify(m.attrs) : '')

function wrap(text, mark) {
  switch (mark.type) {
    case 'code': return '`' + text + '`'
    case 'wiki': return '[[' + text + ']]'
    case 'link': return '[' + text + '](' + (mark.attrs?.href ?? '') + ')'
    case 'bold': return '**' + text + '**'
    case 'strike': return '~~' + text + '~~'
    case 'highlight': return '==' + text + '=='
    case 'italic': { const d = mark.attrs?.delim || '*'; return d + text + d }
    case 'tag': return text
    default: return text
  }
}

export function serializeInline(content) {
  if (!content) return ''
  // Join neighbours with the same marks, then write each run.
  const runs = []
  for (const n of content) {
    if (n.type === 'hardBreak') { runs.push({ text: '\n', marks: [] }); continue }
    if (n.type !== 'text') continue
    const marks = (n.marks || []).slice().sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
    const key = marks.map(markKey).join('|')
    const last = runs[runs.length - 1]
    if (last && last.key === key) last.text += n.text
    else runs.push({ text: n.text, marks, key })
  }
  return runs.map(r => r.marks.slice().reverse().reduce((t, m) => wrap(t, m), r.text)).join('')
}

export function parseInline(s) {
  if (!s) return undefined
  const parsed = parseInlineRaw(s)
  // Anything that doesn't come back exactly stays as the text it is.
  if (serializeInline(parsed) !== s) return [{ type: 'text', text: s }]
  return parsed.length ? parsed : undefined
}

const withContent = (node, s) => { const c = parseInline(s); if (c) node.content = c; return node }

// --- Blocks -------------------------------------------------------------------------------

function parseTable(lines) {
  // lines: the table's rows, the second being the separator.
  const split = l => l.slice(1, -1).split('|').map(c => c.trim())
  const rows = lines.filter((_, i) => i !== 1).map(split)
  const width = rows[0].length
  if (rows.some(r => r.length !== width)) return null
  const node = {
    type: 'table', attrs: { sep: lines[1] },
    content: rows.map((cells, ri) => ({
      type: 'tableRow',
      content: cells.map(c => ({ type: ri === 0 ? 'tableHeader' : 'tableCell', content: [withContent({ type: 'paragraph' }, c)] })),
    })),
  }
  return serializeBlock(node) === lines.join('\n') ? node : null
}

export function parse(md) {
  const lines = md.split('\n')
  const blocks = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let m
    // A fenced code block runs to its closing fence; without one, its lines stay text.
    if ((m = line.match(FENCE))) {
      const close = lines.findIndex((l, j) => j > i && l.startsWith(m[1]) && l.trim() === m[1])
      if (close > 0) {
        const body = lines.slice(i + 1, close).join('\n')
        const node = { type: 'codeBlock', attrs: { open: line, close: lines[close], language: m[2].trim() || null } }
        if (body) node.content = [{ type: 'text', text: body }]
        blocks.push(node); i = close; continue
      }
    }
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      let end = i + 2
      while (end < lines.length && TABLE_ROW.test(lines[end])) end++
      const t = parseTable(lines.slice(i, end))
      if (t) { blocks.push(t); i = end - 1; continue }
    }
    blocks.push(parseLine(line))
  }
  return { type: 'doc', content: blocks }
}

export function parseLine(line) {
  let m
  if (HIDDEN.test(line)) return { type: 'hidden', attrs: { raw: line } }
  if ((m = line.match(EMBED))) return { type: 'embed', attrs: { raw: line, title: m[1] } }
  if ((m = line.match(IMAGE))) return { type: 'image', attrs: { raw: line, alt: m[1], src: m[2] } }
  if (DIVIDER.test(line)) return { type: 'divider', attrs: { raw: line } }
  if ((m = line.match(HEADING))) return withContent({ type: 'heading', attrs: { level: m[1].length } }, m[2])
  if ((m = line.match(ITEM))) {
    const [, indent, marker, gap, box, boxGap, text] = m
    const node = withContent({ type: 'item', attrs: { indent, marker, gap, box: box || null, boxGap: boxGap ?? null, checked: !!box && box !== '[ ]' } }, text)
    if (serializeBlock(node) === line) return node
  }
  if ((m = line.match(QUOTE))) return withContent({ type: 'quote', attrs: { prefix: m[1] } }, m[2])
  return withContent({ type: 'paragraph' }, line)
}

export function serializeBlock(n) {
  const text = () => serializeInline(n.content)
  switch (n.type) {
    case 'paragraph': return text()
    case 'heading': return '#'.repeat(n.attrs.level) + ' ' + text()
    case 'quote': return (n.attrs?.prefix ?? '> ') + text()
    case 'item': {
      const a = n.attrs
      let s = a.indent + a.marker + (a.gap || ' ')
      if (a.box) s += (a.checked ? (a.box === '[X]' ? '[X]' : '[x]') : '[ ]') + (a.boxGap ?? ' ')
      return s + text()
    }
    case 'divider': case 'hidden': case 'image': case 'embed': return n.attrs.raw
    case 'codeBlock': {
      const body = (n.content || []).map(t => t.text).join('')
      return n.attrs.open + '\n' + (body ? body + '\n' : '') + n.attrs.close
    }
    case 'table': {
      const rows = n.content.map(r => '| ' + r.content.map(c => serializeInline(c.content?.[0]?.content)).join(' | ') + ' |')
      const width = n.content[0]?.content.length || 1
      const sep = n.attrs?.sep && (n.attrs.sep.match(/\|/g) || []).length === width + 1 ? n.attrs.sep : '|' + ' --- |'.repeat(width)
      rows.splice(1, 0, sep)
      return rows.join('\n')
    }
    default: return text()
  }
}

export function serialize(doc) {
  return (doc.content || []).map(serializeBlock).join('\n')
}

// --- Pasted HTML to markdown lines --------------------------------------------------------

export function htmlToMarkdown(root) {
  const lines = []
  const inline = el => {
    let s = ''
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { s += c.textContent.replace(/\s+/g, ' '); continue }
      if (c.nodeType !== 1) continue
      const t = c.tagName.toLowerCase()
      const inner = inline(c)
      if (t === 'br') s += '\n'
      else if ((t === 'b' || t === 'strong') && inner.trim()) s += '**' + inner + '**'
      else if ((t === 'i' || t === 'em') && inner.trim()) s += '*' + inner + '*'
      else if ((t === 's' || t === 'del' || t === 'strike') && inner.trim()) s += '~~' + inner + '~~'
      else if (t === 'code') s += '`' + inner + '`'
      else if (t === 'a' && c.getAttribute('href') && inner.trim()) s += '[' + inner + '](' + c.getAttribute('href') + ')'
      else if (t === 'input') continue
      else s += inner
    }
    return s
  }
  const BLOCK = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'blockquote', 'pre', 'section', 'article', 'header', 'footer', 'hr'])
  const hasBlock = el => [...el.children].some(c => BLOCK.has(c.tagName.toLowerCase()))
  const walk = (el, depth) => {
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { const t = c.textContent.trim(); if (t) lines.push(t); continue }
      if (c.nodeType !== 1) continue
      const t = c.tagName.toLowerCase()
      if (/^h[1-6]$/.test(t)) { lines.push('#'.repeat(Math.min(3, +t[1])) + ' ' + inline(c).trim()); continue }
      if (t === 'hr') { lines.push('---'); continue }
      if (t === 'ul' || t === 'ol') {
        let n = 1
        for (const li of c.children) {
          if (li.tagName.toLowerCase() !== 'li') continue
          const box = li.querySelector(':scope > input[type=checkbox], :scope > label > input[type=checkbox], :scope > p > input[type=checkbox]')
          const marker = t === 'ol' ? `${n++}.` : '-'
          const own = document.createElement('div')
          for (const k of li.childNodes) if (!(k.nodeType === 1 && /^(ul|ol)$/i.test(k.tagName))) own.appendChild(k.cloneNode(true))
          const text = inline(own).replace(/\n/g, ' ').trim()
          lines.push('  '.repeat(depth) + (box ? `- [${box.checked ? 'x' : ' '}] ` : marker + ' ') + text)
          for (const k of li.children) if (/^(ul|ol)$/i.test(k.tagName)) walk({ childNodes: [k] }, depth + 1)
        }
        continue
      }
      if (t === 'table') {
        const rows = [...c.querySelectorAll('tr')].map(tr => [...tr.children].map(td => inline(td).replace(/\|/g, '/').replace(/\n/g, ' ').trim()))
        if (rows.length) {
          const w = Math.max(...rows.map(r => r.length))
          rows.forEach((r, i) => { while (r.length < w) r.push(''); lines.push('| ' + r.join(' | ') + ' |'); if (i === 0) lines.push('|' + ' --- |'.repeat(w)) })
        }
        continue
      }
      if (t === 'blockquote') { inline(c).split('\n').forEach(l => lines.push('> ' + l.trim())); continue }
      if (t === 'pre') { lines.push('```', ...c.textContent.replace(/\n$/, '').split('\n'), '```'); continue }
      if (BLOCK.has(t) && hasBlock(c)) { walk(c, depth); continue }
      if (BLOCK.has(t)) { inline(c).split('\n').forEach(l => lines.push(l.trim())); continue }
      const s = inline({ childNodes: [c] }).trim(); if (s) lines.push(s)
    }
  }
  walk(root, 0)
  return lines.join('\n')
}
