// Builds the web editor into one page the app bundles: Pane/Resources/WebEditor/web-editor.html.
// `node build.mjs --serve` also serves it on port 5199 and reloads open editors (in the app on
// the Mac and the iPhone) when a source file changes: Settings > Experimental > Web editor source.
import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync, watch } from 'node:fs'
import { createServer } from 'node:http'

const here = new URL('.', import.meta.url).pathname
const out = here + '../Pane/Resources/WebEditor/web-editor.html'
const serve = process.argv.includes('--serve')
const clients = new Set()

async function build() {
  const t = Date.now()
  const js = await esbuild.build({ entryPoints: [here + 'src/editor.js'], bundle: true, minify: !serve, format: 'iife', target: ['safari16'], write: false, logLevel: 'error' })
  const css = readFileSync(here + 'src/editor.css', 'utf8')
  const code = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')
  const page = readFileSync(here + 'src/page.html', 'utf8').replace('/*CSS*/', () => css).replace('/*JS*/', () => code)
  mkdirSync(here + '../Pane/Resources/WebEditor', { recursive: true })
  if (!serve) writeFileSync(out, page)
  console.log(`built in ${Date.now() - t} ms, ${(page.length / 1024).toFixed(0)} KB`)
  return page
}

let page = await build()
if (serve) {
  const reload = `<script>(function(){var s=new EventSource('/events');s.onmessage=function(){location.reload()}})()</script>`
  createServer((req, res) => {
    if (req.url === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'access-control-allow-origin': '*' })
      res.write(': hi\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(page.replace('<!--DEV-->', reload))
  }).listen(5199, '0.0.0.0', () => console.log('serving on http://0.0.0.0:5199 (use this Mac’s address on the iPhone)'))
  let timer
  watch(here + 'src', { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      try { page = await build(); for (const c of clients) c.write('data: reload\n\n') } catch (e) { console.error(e.message) }
    }, 80)
  })
}
