// Every note must come back from the web editor byte for byte (the editor never rewrites a
// note just by opening it). Run: node --test web-editor/test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse, serialize, parseLine } from '../src/markdown.js'

const round = s => serialize(parse(s))

test('Pinto constructs round-trip exactly', () => {
  const samples = [
    'Week plan\n\n## Today\n- [ ] Book the dentist\n- [x] Send times\n  - [ ] nested\n\t- [X] tab nested\n',
    '- \n- [ ]\n- [ ] \n1. one\n2) two\n10.  wide gap\n* star\n+ plus',
    '| Item | Planned |\n| --- | ---: |\n| Rent | 9 800 |\n| **Food** | 4 000 |',
    '<!-- pane-table: {"cols":["text","number"]} -->\n| a | b |\n|---|---|\n|x|y|',
    '```js\nconst a = 1\n\n```\n```\nunclosed',
    '> quote\n>tight\n> [!warning] Check the passport',
    '---\n***\n![photo.jpg](pane-file:0D1B6C8E-1111-2222-3333-444455556666)\n![[Lisbon]]',
    'Links [[Lisbon|the trip]] and [site](https://a.b/c) and #tag and #work/clients, a#b, ==hi==',
    'Odd **bold *nested* bold** and __under__ and *a* _b_ snake_case_word ~~gone~~ `co*de`',
    '# H1\n###### H6\n#nospace\n#',
    '', '\n', '\n\n\n', 'trailing   ', '\ttabbed line', '   - [ ] spaced',
  ]
  for (const s of samples) assert.equal(round(s), s, JSON.stringify(s))
})

test('lines become the blocks Pinto means', () => {
  assert.equal(parseLine('- [ ] Milk').type, 'item')
  assert.equal(parseLine('- [ ] Milk').attrs.box, '[ ]')
  assert.equal(parseLine('- [x] Milk').attrs.checked, true)
  assert.equal(parseLine('  - Milk').attrs.indent, '  ')
  assert.equal(parseLine('## Today').type, 'heading')
  assert.equal(parseLine('#tag').type, 'paragraph')
  assert.deepEqual(parseLine('a **b** c').content.map(n => n.marks?.[0]?.type ?? null), [null, 'bold', null])
  assert.equal(parse('| a |\n| --- |\n| b |').content[0].type, 'table')
})

test('every markdown file in the repo round-trips', () => {
  const root = new URL('../../', import.meta.url).pathname
  const files = []
  const walk = d => {
    for (const f of readdirSync(d)) {
      if (['node_modules', '.git', 'build', 'DerivedData', '.next'].includes(f)) continue
      const p = join(d, f); const s = statSync(p)
      if (s.isDirectory()) walk(p); else if (/\.(md|markdown|txt)$/.test(f) && s.size < 2_000_000) files.push(p)
    }
  }
  walk(root)
  assert.ok(files.length > 50, 'found ' + files.length)
  const bad = files.filter(f => { const s = readFileSync(f, 'utf8'); return round(s) !== s })
  assert.deepEqual(bad, [])
})
