# Make Pinto Notes yours

Pinto Notes is MIT licensed. You can clone it, build your own copy, run it against your own backend and change anything, by hand or with an AI coding agent. This page takes you from nothing to your own app on your Mac in one command, then shows how to make it yours.

You don't need a paid Apple developer account. Without one you get the Mac app and the iPhone app in the Simulator. With a free Apple account you can put it on your iPhone too.

## What you need

| | Why | How long |
|---|---|---|
| A Mac with macOS 26 | The app is built for macOS 26 and iOS 26 | |
| Xcode 26 | Builds the app. Install it from the App Store, then open it once so it installs its parts | 20 to 40 minutes, about 15 GB |
| [Homebrew](https://brew.sh) | Installs XcodeGen and the Supabase CLI for you | a few minutes |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) (optional) | Runs the local backend, so you can sign in and sync on this Mac. Without it, notes stay on this Mac | a few minutes |

Once those are there, the rest takes 5 to 20 minutes, most of it downloads.

## 1. Build it

Open Terminal and run:

```sh
git clone --filter=blob:none https://github.com/pinto-notes/pinto-notes.git
cd pinto-notes
scripts/setup.sh
```

The clone is about 300 MB. It takes 1 to 6 minutes, depending on your connection: `--filter=blob:none` downloads the files of the newest version only, and fetches older ones when git needs them (switching branches, for example, fetches more). A plain `git clone` works too, at about 400 MB.

```
✓ Xcode 26.4.1
✓ XcodeGen 2.46.0, Supabase CLI 2.75.0
✓ Your app is My Pinto Notes (local.kim.notes). To rename it: scripts/make-it-yours.sh --name "…" --bundle-id com.you.notes
→ Starting the local backend (the first time downloads about 3 GB of Docker images: 5 to 15 minutes)
✓ The local backend is running
✓ Made Pane.xcodeproj
→ Building the Mac app (3 to 10 minutes the first time, under a minute after that)
✓ Built in 113 s: /Users/kim/pinto-notes/build/ddqa/Build/Products/Debug/Pane.app

Done in 9 min. Open your app:
  open "/Users/kim/pinto-notes/build/ddqa/Build/Products/Debug/Pane.app"
```

Copy the `open` line it prints and run it. Every build in this guide goes to `build/ddqa`, so the tests (step 6) reuse it instead of building the app again.

The file is called Pane.app, the project's working name, and stays that way in your builds: the tests and scripts find the app by that name. The Dock, the menu bar, Finder's Get Info and the app's windows all show your app's name ("My Pinto Notes" until you rename it).

No Docker? Run `scripts/setup.sh --local-only` instead. The app then has no backend: no sign-in, no sync, and your notes stay on this Mac. You can add a backend later.

When a step fails, `scripts/setup.sh` stops and says what to do. Do that and run it again; each step that's already done is skipped.

### What you see the first time

**With the local backend** (plain `scripts/setup.sh`):

1. A welcome window: "The notes app your AI can use." Press **Get started**.
2. **Sign in or sign up.** Type any email address (it doesn't have to be real) and press **Continue**.
3. Make a password of 12 characters or more. Nothing is really emailed. If the app asks for a code, open the local mail viewer at http://127.0.0.1:56424 and copy it from there.
4. A short setup: your name, bringing notes over, connecting an AI. Skip any of it.
5. Your notes: a Notes folder with "Welcome to Pinto Notes" and a sample Habit tracker note. Press Command-N for a new note.

Sign in with Apple and Sign in with Google show on that screen but aren't set up in your build: use email.

**With `--local-only`:** the app opens straight on your notes, with the same two notes. Settings says "Sync is off. This build keeps notes on this device only."

Either way your notes are saved as you type and are there when you open the app again. They live in `~/Library/Application Support/<your bundle id>`, apart from any Pinto Notes you have installed.

### If something goes wrong

| You see | What to do |
|---|---|
| `xcode-select: error: tool 'xcodebuild' requires Xcode` | Run `scripts/setup.sh`, which finds Xcode for you. For your own `xcodebuild` commands, run `sudo xcode-select -s /Applications/Xcode.app` once. |
| `✗ Docker isn't running.` | Open Docker Desktop, wait until it says the engine is running, and run `scripts/setup.sh` again. |
| `✗ Something else is using a port the backend needs` | Another Supabase project is running. Run `supabase stop` in its folder, then `scripts/setup.sh` again. |
| `✗ The build failed` with `Could not resolve package dependencies` | A download failed. Check your connection and run `scripts/setup.sh` again. |
| The app says "Can't reach the server. Check your connection." | The local backend isn't running (Docker was quit, or the Mac restarted). Open Docker Desktop and run `scripts/setup.sh` again. |
| "Sign in with Apple" or "Google" does nothing or fails | Expected in your build. Use email. |

Anything else: open an issue at [github.com/pinto-notes/pinto-notes/issues](https://github.com/pinto-notes/pinto-notes/issues) with the command and what it printed.

## 2. Give it your name

`scripts/setup.sh` called your build "My Pinto Notes". To pick your own name and bundle id:

```sh
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes
scripts/setup.sh
```

A bundle id is your reversed domain or name plus the app, like `com.kim.notes`. The script writes `Config/Identity.local.xcconfig`, which git ignores, so pulling updates never conflicts with it. Run it again later with only what you want to change, such as `scripts/make-it-yours.sh --name "Kim's Journal"`; everything else stays as it is. `--show` prints what's set and `--reset` goes back to upstream's (don't run that build next to an installed Pinto Notes: they'd share settings).

A new bundle id is a new app to macOS: it starts with an empty library and asks you to sign in again.

## 3. Put it on your iPhone

The iPhone app runs in the Simulator with no account. Open the project with `open Pane.xcodeproj`, pick an iPhone simulator at the top of the window, and press Run (Command-R). From Terminal (3 to 10 minutes the first time):

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project Pane.xcodeproj -scheme Pane \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ddqa ARCHS=arm64 build
```

It ends with `** BUILD SUCCEEDED **`, and the app is `build/ddqa/Build/Products/Debug-iphonesimulator/Pane.app`. To run it there, open the Simulator (`open -a Simulator`), then `xcrun simctl install booted build/ddqa/Build/Products/Debug-iphonesimulator/Pane.app` and `xcrun simctl launch booted <your bundle id>`.

To put it on your own phone you need an Apple account in Xcode (Xcode, Settings, Accounts, then the + button) and its team id (shown there, 10 letters and digits). Then:

```sh
# A free Apple account: installs last 7 days, then reinstall. No Sign in with Apple or push.
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes --personal-team ABCDE12345

# A paid Apple Developer Program team: a year per install
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes --team ABCDE12345
```

Plug the phone in, unlock it, pick it at the top of the Xcode window and press Run. The first time, the phone asks you to trust your developer certificate: Settings, General, VPN & Device Management.

The phone can't reach the backend on your Mac (127.0.0.1 is the phone itself), so for a phone that syncs, run your own backend (step 4).

| | No account | Free account | Paid team |
|---|---|---|---|
| Mac app | Yes | Yes | Yes |
| iPhone app in the Simulator | Yes | Yes | Yes |
| iPhone app on your phone | No | Yes, reinstall every 7 days | Yes, a year per install |
| Email sign-in, sync, encryption, share extension | Yes | Yes | Yes |
| Sign in with Apple | No | No | Yes |
| Push when an AI asks to connect | No | No | Yes, once your APNs key is in the functions' secrets (`APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`) |

## 4. Run your own backend

The local backend lives on your Mac. To use your app every day, on your phone too, give it a backend of its own: one free [Supabase](https://supabase.com) project. This takes about 10 minutes.

1. Make a project at [supabase.com/dashboard](https://supabase.com/dashboard) (New project). Write down the database password you choose. The project's ref is the 20 letters in its address, `https://<ref>.supabase.co` (Project Settings, General).
2. Make a personal access token at [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) and put it in a file called `.env` in the `pinto-notes` folder (git ignores it):

   ```sh
   echo 'SUPABASE_ACCESS_TOKEN=sbp_your_token_here' > .env
   ```

3. See what will happen, then do it (about 5 minutes; it asks for the database password once). `brew install deno` first if you don't have it (the sign-in emails are written with it).

   ```sh
   scripts/deploy-backend.sh <ref> --dry-run
   scripts/deploy-backend.sh <ref>
   scripts/setup.sh
   ```

   The end of `deploy-backend.sh` reads `Back up this file now: …/.secrets/backend-<ref>.env`. From now on `scripts/setup.sh` builds against your project and needs no Docker: it prints `✓ Using your backend https://<ref>.supabase.co`.

`deploy-backend.sh` asks for the database password, applies the migrations, deploys the functions and their secrets, checks the clean-up jobs, sets up email sign-in, and writes `Config/Backend.local.xcconfig` so your builds use the project. `scripts/setup.sh` then rebuilds the app against it. Each step that fails says what to do; running it again is safe.

It keeps the secrets it makes in `.secrets/backend-<ref>.env`. Back it up (a password manager is a good place) and never delete it: it holds the secret that seals each account's key copy, and without it signing in on a new device can't open the notes. The same file has `BACKEND_PROXY_SECRET`, which your site needs (below).

What it sets up, and what it leaves off:

- **Clean-up jobs.** The migrations turn on `pg_cron` and schedule the jobs that clear expired sign-ins, rate-limit rows and notes in Recently Deleted for 30 days. The script checks for them and prints how many are scheduled (or how to fix it). Without them nothing breaks at first, but that data is never cleared.
- **Welcome and report emails: off.** They need the `lifecycle` function and two secrets in the database's vault ([docs/Technical/lifecycle-emails.md](Technical/lifecycle-emails.md)). Sign-in codes and password resets don't depend on them.
- **Sign in with Apple: only with a paid team.** With `make-it-yours.sh --team`, it's turned on for your bundle id. With a free account or none, it stays off and the app's button won't work: use email.

Supabase's own mailer only sends to your project's team members, a few emails an hour. That's enough for you. For anyone else, add an SMTP server in the dashboard (Authentication, Emails, SMTP settings).

Share links and connecting ChatGPT or Claude need the website, `web/`. Claude Code and Codex don't: in the app, open Settings, Connect an AI, and copy the command. For the site:

1. Deploy `web/` to any Next.js host, such as Vercel (New project, import your fork, root directory `web`), with these environment variables. `deploy-backend.sh` prints them at the end with your values:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `PANE_SUPABASE_KEY` in `Config/Backend.local.xcconfig` |
   | `MCP_PROXY_SECRET` | the `BACKEND_PROXY_SECRET` in `.secrets/backend-<ref>.env` |
   | `NEXT_PUBLIC_APP_SCHEME` | your URL scheme (`scripts/make-it-yours.sh --show` prints it). If it's missing or not lowercase letters, digits and hyphens, the site falls back to Pinto Notes' `ambernotes` and its links open the wrong app |
   | `APP_PAGES_ONLY` | `1`: only the pages your app uses (connecting an AI, password resets, share links, links that open the app). Pinto Notes' home page, blog, changelog and downloads are 404s |
   | `SITE_NOINDEX` | `1`: keeps the site out of search |

2. Point the backend and the app at it, then rebuild:

   ```sh
   scripts/deploy-backend.sh <ref> --site https://your-site
   scripts/make-it-yours.sh --site https://your-site
   scripts/setup.sh
   ```

3. Connect ChatGPT or Claude: add a custom connector with the address `https://<ref>.supabase.co/functions/v1/mcp` (`deploy-backend.sh` prints it). Not `mcp.pintonotes.com`: that one is Pinto Notes' own server. Signing in to connect opens your site's `/connect` page.

Your builds send no telemetry: the key is empty in every build that isn't Pinto Notes' own release.

## 5. Change it

The app is SwiftUI for iPhone and Mac, with a TextKit 2 editor. Folder and target names say "Pane", the app's working name. The [README](../README.md#how-its-built) maps the parts. The places people change first:

| What | Where |
|---|---|
| The accent colour | `scripts/set-accent.sh 1E7A4C 5CC48A` (light mode, then dark mode). It sets `Palette.accent` in `Pane/Editor/Palette.swift`, which every button, tick, link and hover follows, and the AccentColor asset the system's controls use. `scripts/set-accent.sh amber` puts Pinto Notes' back |
| Other colours, light and dark | the rest of `Pane/Editor/Palette.swift`: every colour the app draws |
| Buttons, corner radii, shadows, toasts | `Pane/Views/DesignSystem.swift`, with the rules in [docs/DESIGN.md](DESIGN.md) |
| The iPhone bar above the keyboard | `Pane/Editor/FormatBar.swift` |
| The Mac's format menu and toolbar | `Pane/Views/FormatPopover.swift`, the `.toolbar` in `Pane/Views/RootView.swift` and `Pane/Views/NoteDetailView.swift`, glyphs in `Pane/Views/ToolbarGlyph.swift` |
| The app's name | `scripts/make-it-yours.sh --name` for the name under the icon; the words inside the app are in the views (search for "Pinto Notes") |
| The first notes in a new library | `Seed.ensureLibrary` and the welcome text in `Pane/App/PaneApp.swift` |
| The icon | `Pane/Resources/AppIcon.icon` (open it in Icon Composer, which comes with Xcode 26), `Assets.xcassets/AppIcon.appiconset` for older systems, `Mark` and `MenuBarIcon` for the mark inside the app |
| The AI server's tools | `supabase/functions/mcp/files_tools.ts`, deployed with `supabase functions deploy mcp --project-ref <ref>` |
| The sign-in emails | `scripts/auth-emails.ts`, then `deno run -A scripts/auth-emails.ts write` |

After a change, run `scripts/setup.sh` again (under a minute) and reopen the app, or press Run in Xcode.

The repository's [CLAUDE.md](../CLAUDE.md) (and `AGENTS.md`) tell an AI coding agent how this codebase works and how to test a change, so Claude Code and Codex can work on it from the first prompt. Start one in the `pinto-notes` folder (`claude` or `codex`) and try:

1. "Make the accent colour a deep green in light and dark mode with scripts/set-accent.sh, pick shades that pass the contrast checks, and run scripts/qa-test.sh PaneTests/AmberButtonTests PaneTests/NotePageTests."
2. "Add a button to the iPhone keyboard bar (Pane/Editor/FormatBar.swift) that inserts today's date as a heading. Match the bar's other buttons, and add a test in PaneTests/Interaction like the ones there."
3. "Rename the app to Kim's Notes in every string a person reads, on the Mac and iPhone. Leave code names like Pane alone. Show me the list of strings before you change them."
4. "Add a word and character count for the open note to the Mac window's toolbar. Find how the toolbar is built in Pane/Views/RootView.swift first, and test it in the offscreen harness under PaneTests/Harness."
5. "Add a tool to the AI server that lists the notes changed in the last 7 days, in supabase/functions/mcp/files_tools.ts, with a Deno test next to the others. Then deploy it to my project with supabase functions deploy mcp."

Ask for one change at a time and run the tests the agent names. A small change you understand is easier to carry forward than a big one.

## 6. Run the tests

```sh
scripts/qa-test.sh --smoke                    # what CI runs for every change: about a minute after setup.sh
scripts/qa-test.sh PaneTests/ShareAskTests    # one suite
scripts/qa-test.sh                            # every unit and interaction test: 20 to 30 minutes
```

Each ends with two lines, the count and the result, such as `✔ Test run with 412 tests in 38 suites passed after 61.2 seconds.` and `** TEST SUCCEEDED **`. When something fails, the failing tests come first with `✘`, then `** TEST FAILED **`; the full log is in `build/ddqa/last-test.log`. The interaction tests drive the real editor in an offscreen window, so they never move your mouse or take focus. Some tests time things, and on a busy Mac they can fail by being slow; that isn't your change. The server's tests are in [CONTRIBUTING.md](../CONTRIBUTING.md).

## 7. Keep pulling updates

New versions ship most days. To bring them into your copy:

```sh
git remote add upstream https://github.com/pinto-notes/pinto-notes.git   # once
git pull upstream main
scripts/setup.sh
scripts/deploy-backend.sh <ref>   # if you run your own backend: applies new migrations and functions
```

Fewer conflicts, in order of how much they help:

- **Keep your settings out of tracked files.** Your identity is in `Config/Identity.local.xcconfig` and your backend in `Config/Backend.local.xcconfig`. Both are gitignored, so an update never touches them.
- **Add files rather than editing big ones.** A new view, a new `extension` in its own file, or a new test file never conflicts. Upstream changes the large files (the editor, the note list) often.
- **Let the project file regenerate.** `Pane.xcodeproj` is generated from `project.yml`. If it conflicts, take upstream's (`git checkout --theirs Pane.xcodeproj`) and run `scripts/setup.sh`.
- **Add migrations, never edit them.** Put database changes in a new file in `supabase/migrations` with a timestamp newer than every other one. Upstream's migrations then apply cleanly after yours.
- **Merge often.** A week of upstream is an easy merge; three months is a hard one.

## What setup.sh does, by hand

If you'd rather run each step yourself:

```sh
brew install xcodegen supabase/tap/supabase
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes
supabase start          # needs Docker; skip it for a build with no backend (see below)
xcodegen generate       # makes Pane.xcodeproj from project.yml
open Pane.xcodeproj     # and press Run, or:
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  xcodebuild -project Pane.xcodeproj -scheme Pane -destination 'platform=macOS' -derivedDataPath build/ddqa build
open build/ddqa/Build/Products/Debug/Pane.app
```

A build with no backend has `PANE_SUPABASE_URL =` (empty) in `Config/Backend.local.xcconfig`. Every night CI builds a fresh clone with no secrets and no Apple team through `scripts/setup.sh --local-only` (`scripts/ci/fresh-clone-build.sh`), so this path stays working.
