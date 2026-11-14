# pinto: Pinto Notes from the terminal

`pinto` reads and edits your Pinto Notes from a terminal, on macOS and Linux. It gives you the same
verbs Pinto Notes gives AIs (search, list, read, create, edit, write, move, delete, history,
restore, pin), so a person and an agent like Claude Code use one tool the same way. `pinto push`
sends a folder as a note's app, through those same verbs.

It's a thin client of the Pinto Notes MCP server (`https://mcp.pintonotes.com`), the one Claude and
ChatGPT connect to. It signs in the same way they do: you approve it in Pinto Notes.

It was called `amber`. The old name still works: `amber` is installed as a link to `pinto`, every
`AMBER_` setting is read when its `PINTO_` one isn't set, and a sign-in `amber` saved (in
`~/.config/amber` or the Keychain's `amber-cli`) keeps working, at `mcp.ambernotes.app`, until you
run `pinto login` again.

## Install

Nothing is published yet; these are the planned commands.

```sh
curl -fsSL https://pintonotes.com/install.sh | sh
```

The script downloads the archive for your machine (macOS or Linux, Apple silicon / arm64 or
Intel / x64; 29 to 34 MB), checks it against `SHA256SUMS`, and puts `pinto` in `~/.local/bin`, with
`amber` as a link to it unless another `amber` is there. No sudo. Set `PINTO_INSTALL_DIR` to put it
elsewhere.

With Homebrew (a tap of our own):

```sh
brew install pinto-notes/tap/pinto-notes
```

Or download `pinto-<os>-<arch>.tar.gz` from the release, unpack it and put `pinto` on your PATH.

The binary is a single file: 68 MB on Apple silicon, 80 MB on Intel Macs, 105 MB on Linux. Almost
all of that is the Deno runtime it carries; pinto's own code is about 140 KB.

## Sign in

```sh
pinto login
```

Your browser opens. Approve in Pinto Notes on your iPhone or Mac, and you're done. In Settings ›
Connect an AI the connection shows as **An app on this computer**; Disconnect there turns this
terminal away, like any other connection. `pinto logout` disconnects it from here.

- **On a server or over SSH** (no browser), `pinto login` prints an address instead. Open it in any
  browser and approve. The browser then lands on a page that won't load (it points at the server's
  127.0.0.1): copy that page's address and paste it into the terminal.
- **CI and scripts:** set `PINTO_TOKEN` to an access token from Settings › Connect an AI, or save one
  with `pinto login --token`.

Tokens are kept in the macOS Keychain, or on Linux in `~/.config/pinto/credentials.json` (mode 600).
`pinto` never prints them. The access token lasts an hour and renews itself; the refresh token is
single use, and pinto processes take turns renewing it so running several at once is safe.

## Use

```sh
pinto search butter                     # find notes by their words
pinto list                              # folders, pinned and recently edited notes
pinto list Work/                        # a folder
pinto read "Work/Clients/Acme.md"       # the markdown, exactly; pipes cleanly
pinto create Work "Standup

- Shipped the CLI"                      # the first line is the title
pinto create Ideas/Garden.md < garden.md
pinto edit Groceries.md "- [ ] Milk" "- [x] Milk"   # exact search and replace
pinto write Work/Standup.md < standup.md            # replace the whole note
pinto move Work/Standup.md Archive/
pinto delete Ideas/Garden.md            # to Recently Deleted; pinto restore brings it back
pinto history Groceries.md
pinto restore Groceries.md 12           # a version from history
pinto pin Groceries.md                  # --off to unpin
```

Notes are paths like `Work/Acme.md`; folders end in `/`; a note's id works anywhere a path does.
`pinto help` lists everything; `pinto help edit` explains one command.

Output is plain text for people. `--json` prints the server's full answer, for scripts and agents.
Errors go to stderr with exit code 1.

## Files and apps

A note's app is the folder `<note>.app` (`Games/Doom.app`); files kept in folders are paths too
(`To read/Paper.pdf`). `pinto write --file` sends a file as it is: text as text, anything else (a
.wasm, a picture, a PDF) as its bytes.

```sh
pinto write "To read/Paper.pdf" --file paper.pdf
pinto read Games/Doom.app/doom.wasm               # read before you replace a file
pinto write Games/Doom.app/doom.wasm --file build/doom.wasm
pinto push ./doom Games/Doom                      # the folder becomes the note's app
```

`pinto push <folder> <note>` does what dropping the folder on the note in Pinto Notes does: the
folder (with `index.html` at its top) becomes the note's app. It makes the note and its app if
needed, writes every file, and deletes the app's files the folder doesn't have. Hidden files are left
out, and `data.json` stays the app's data. Pushing again sends only what changed in text files (the
server answers "unchanged" for the rest) and every binary file. The app before is in its history.

What the server refuses, pinto prints as the server said it, with the file:

```
pinto: Games/Big.app/data.bin: Not saved:
- /data.bin is 12290 KB stored (compressed); a file can be at most 8 MB.
```

## Agents

Allow your agent to run `pinto`, and tell it the command exists. For Claude Code:

```sh
claude -p --allowedTools 'Bash(pinto:*)' "Use the pinto command (pinto help) to ..."
```

`pinto edit` is exact search and replace, like the coding agents' own Edit tool, and every change
keeps the previous version, so `pinto history` and `pinto restore` can undo it. An agent that built
an app on disk (a game with a big .wasm, say) sends it with `pinto push`: files a chat can't paste
into a tool call go up from the disk.

## What it can't do

- Locked notes stay locked: only the app opens them.
- It needs the server's file-like tool set (`list`, `fetch`, `edit`, …). Until that ships, it says
  so instead of guessing.

## Development

```sh
cd cli
deno task test                    # unit tests
deno task compile                 # dist/pinto-{macos,linux}-{arm64,x64}, .tar.gz of each, SHA256SUMS
deno task compile pinto-macos-arm64              # one of them
deno run -A e2e/run.ts            # end to end: the compiled binary against the real MCP server
                                  # and OAuth (e2e/local_server.ts: in-process Postgres, no Docker)
deno run -A e2e/push.ts           # pinto push of a web project (Doom), checked file by file
deno run -A e2e/agent_demo.ts     # claude -p using pinto against the same server
deno run -A e2e/local_server.ts --port 8787    # a local server to try pinto by hand:
pinto login --server http://127.0.0.1:8787/mcp
```

`packaging/homebrew/pinto-notes.rb` is the formula (a draft until there's a release and a tap).
