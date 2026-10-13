# Templates with apps

A template is a note. It may also carry a note app: the same React + TypeScript + Tailwind +
shadcn project that `create { type: "app" }` starts, with its starting data. "Use template" then
adds the note and its app together, on the Mac and the iPhone, and through the MCP server.

## Files

```
web/content/templates/<slug>.json          the template, as today, with "app": true
web/content/templates/<slug>.app/          the app, exactly as `list "<Note>.app"` shows it
  README.md
  package.json
  index.html
  src/…  tests/…  docs/…                   every project file, source only
  data.json                                its starting data, exactly as `read "<Note>.app/data.json"` shows it
  preview-light.png                        the site's pictures of it (not project files)
  preview-dark.png
```

The tree is the export of a real app. To make one: build the app in a note with the file tools,
then copy what `list "<Note>.app"` lists, one file per path, with `read` (or `fetch`) for each file
and for `data.json`. Copy text as it is; don't add files the listing doesn't have. Add the two
pictures, then run the generator (below).

Everything in `<slug>.app/` is a project file at `/<path>` except `data.json`, `preview-light.png`
and `preview-dark.png`. Compiled output never goes in the tree: the server compiles, as it does
for every save.

### Rules (checked by `scripts/template-apps.ts` and the site's tests)

- `"app": true` in `<slug>.json` if and only if `<slug>.app/` exists.
- `index.html` is required. Paths use letters, digits, `.`, `_`, `-` and `/` only, as the file
  tools allow.
- Text files only, UTF-8: `.md .json .html .css .ts .tsx .js .jsx .svg .txt`. No dotfiles
  (`.env`, `.gitignore`), no `node_modules/`, `dist/` or lock files.
- The server's limits: at most 200 files, 512 KB a file, 3 MB for the whole project with its
  compiled files. `data.json` at most 1 MB.
- `data.json` is an object `{ "values": { … }, "collections": { … } }`. Sample rows are fine;
  `{"$file": …}` references aren't (files don't come along).
- No secrets: no API keys, tokens, private keys or passwords, and no `.env`. The generator refuses
  anything that looks like one (`sk-…`, `ghp_…`, `xox…`, `AKIA…`, JWTs, `-----BEGIN … KEY-----`).
- No import map in `index.html` (the app provides it), the same as any save.
- Pictures: PNG, the app at 1280 px wide (see_app's desktop size), light and dark, under 400 KB
  each. Both are required.

## Generated (committed, never edited by hand)

`deno run -A scripts/template-apps.ts` (add `<slug>` for one) checks every tree, compiles it with
the server's own code (`withFiles` and `linkProject`, as a save does), runs the app's tests and the
smoke check when a renderer is set up (`RENDER_URL`, as the server does), and writes:

```
web/public/templates/apps/<slug>.project.json   the project exactly as note_pages.page_ct holds it (serialize())
web/public/templates/apps/<slug>.data.json      the data exactly as note_pages.data_ct holds it (closeStored())
web/public/templates/apps/<slug>-light.png      copies of the pictures
web/public/templates/apps/<slug>-dark.png
```

`/templates/<slug>.json`, which the app and the server fetch, then names them:

```json
{ "app": "/templates/apps/<slug>.project.json", "data": "/templates/apps/<slug>.data.json",
  "preview": "/templates/apps/<slug>-light.png", "previewDark": "/templates/apps/<slug>-dark.png" }
```

The site's tests fail when a generated file is out of step with its tree (a file changed, added or
removed, or the data changed): run the generator again.

## Round trip

Tree → generated project → stored in `note_pages` → `list "<Note>.app"` and `read` give back the
same paths and the same text, and `read "<Note>.app/data.json"` the same data. Tested in
`supabase/functions/mcp/template_apps.pglite.test.ts`.

## Use template

- **Mac and iPhone** (`Pane/Model/NoteSource.swift`): the template's note is added as today; then
  the project becomes the note's app (`NotePageStore.setHere`) and the data its data
  (`NotePageDataStore.set`). Both are sealed with the account key and synced like any app.
  Builds from before this read `app` and `preview` only: they get the app without its data.
- **MCP** (`create { type: "app", path: "<Folder>/<Title>.md", template: "<slug>" }`): the
  server fetches the template from the site, makes the note with its markdown, saves the project
  through the same gate as any save (its tests and the smoke check run) and stores the data. The
  template's copy-paste prompt says to do this, so an AI makes the same note and app.
- **The site**: an app template's page and its card show the picture of the app (light or dark,
  as the reader's system is) instead of the note.
- A template without an app is unchanged everywhere.
