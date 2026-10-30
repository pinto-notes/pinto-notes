# Make Pinto Notes yours

Pinto Notes is MIT licensed. You can clone it, build your own copy, run it against your own backend and change anything, by hand or with an AI coding agent. This page takes you from a fresh clone to your own app.

You don't need a paid Apple developer account. Without one you get the Mac app and the iPhone app in the Simulator. With a free Apple account you can also put it on your iPhone.

## 1. Clone and build

You need macOS 26 with Xcode 26, [Homebrew](https://brew.sh), and Docker Desktop (for the local backend).

```sh
brew install xcodegen supabase/tap/supabase deno pnpm
git clone https://github.com/pinto-notes/pinto-notes.git
cd pinto-notes
supabase start      # the local backend: Postgres, Auth, Storage and Functions, on ports 56420–56429
xcodegen generate   # makes Pane.xcodeproj from project.yml
open Pane.xcodeproj # run the "Pane" scheme on "My Mac" or an iPhone simulator
```

The clone is about 400 MB. The first `supabase start` downloads its Docker images, which takes a few minutes; later starts take seconds. The first build takes 3 to 10 minutes.

Out of the box the app talks to the local backend, so nothing you do touches anyone's real notes. Sign in with your email. The code doesn't go to a real inbox: open the local mail viewer at http://127.0.0.1:56424 and copy it from there. Sign in with Apple and Google aren't set up in your build; Apple needs a paid Apple account.

From the command line, if Xcode isn't your selected developer directory (`xcode-select -p` says `CommandLineTools`), put `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` in front of `xcodebuild`, or run `sudo xcode-select -s /Applications/Xcode.app` once.

```sh
# The Mac app, signed to run on this Mac only (no Apple account)
xcodebuild -project Pane.xcodeproj -scheme Pane -destination 'platform=macOS' build

# The iPhone app for the Simulator (no Apple account)
xcodebuild -project Pane.xcodeproj -scheme Pane -destination 'generic/platform=iOS Simulator' ARCHS=arm64 build
```

### Run the tests

```sh
scripts/qa-test.sh --smoke                    # a first check: the few tests every change runs, a few minutes
scripts/qa-test.sh PaneTests/ShareAskTests    # one suite
scripts/qa-test.sh                            # every unit and interaction test: 20 to 30 minutes
```

The interaction tests drive the real editor in an offscreen window, so they never move your mouse or take focus. A few timing tests can fail on a busy Mac; they report how slow something was, and they don't mean your change broke anything. The server's tests are in [CONTRIBUTING.md](../CONTRIBUTING.md).

## 2. Give it your name

One command sets your bundle id, app name and Apple team:

```sh
# No Apple account: the Mac app and the Simulator
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes

# A free Apple account: also your own iPhone (installs last 7 days)
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes --personal-team ABCDE12345

# A paid Apple Developer Program team: everything upstream has
scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes --team ABCDE12345
```

Your team id is in Xcode, Settings, Accounts (sign in with your Apple ID first), or at [developer.apple.com/account](https://developer.apple.com/account) under Membership.

The script writes `Config/Identity.local.xcconfig`, which git ignores, and regenerates the project. It sets the bundle id, the share extension's id, the app group, the URL scheme (`kimnotes://` for `com.kim.notes`) and the team. `--show` prints what's set and `--reset` goes back to upstream's.

What each kind of account gets:

| | No account | Free account | Paid team |
|---|---|---|---|
| Mac app | Yes | Yes | Yes |
| iPhone app in the Simulator | Yes | Yes | Yes |
| iPhone app on your phone | No | Yes, reinstall every 7 days | Yes, a year per install |
| Email sign-in, sync, encryption, share extension | Yes | Yes | Yes |
| Sign in with Apple | No | No | Yes |
| Push when an AI asks to connect | No | No | Yes, once your APNs key is in the functions' secrets (`APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`) |

To put it on your phone, plug it in and pick it as the run destination in Xcode, or run `PHONE="Kim's iPhone" scripts/install-phone.sh`. The Mac app is always signed to run locally, whatever you choose. With a paid team you can sign it too, for Sign in with Apple on the Mac: see how `scripts/install-mac.sh` builds it.

## 3. Run your own backend

The local backend is for building and testing. To use your app every day, on more than one device, give it a backend of its own: one free [Supabase](https://supabase.com) project.

1. Create a project at [supabase.com](https://supabase.com). Note its ref, the 20 letters in `https://<ref>.supabase.co`.
2. Make a personal access token at [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) and put it in `.env` (gitignored) as `SUPABASE_ACCESS_TOKEN=sbp_…`.
3. See what will happen, then do it:

   ```sh
   scripts/deploy-backend.sh <ref> --dry-run
   scripts/deploy-backend.sh <ref>
   ```

It applies the migrations, deploys the functions, sets their secrets, sets up email sign-in with a 6-digit code, and writes `Config/Backend.local.xcconfig` so your builds sync with the project. It asks for the database password you chose when you made the project. Run it again after you pull new migrations or functions; it keeps its secrets in `.secrets/backend-<ref>.env`. Never delete that file: it holds the secret that seals each account's key copy, and without it signing in on a new device can't open the notes.

Supabase's own mailer only sends to your project's team members, and only a few emails an hour. That's enough for you. For anyone else, add an SMTP server in the dashboard (Authentication, Emails, SMTP settings).

Share links and connecting ChatGPT or Claude need the website, `web/`. Deploy it to any Next.js host, such as Vercel, with `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_APP_SCHEME` (your URL scheme, like `kimnotes`) set, then run `scripts/deploy-backend.sh <ref> --site https://your-site` again. Claude Code and Codex don't need the site: in the app, open Settings, Connect an AI, and copy the command.

Your builds send no telemetry: the key is empty in every build that isn't Pinto Notes' own release.

## 4. Change it

The app is SwiftUI for iPhone and Mac, with a TextKit 2 editor. Folder and target names say "Pane", the app's working name. The [README](../README.md#how-its-built) maps the parts. The places people change first:

| What | Where |
|---|---|
| Colours, light and dark | `Pane/Editor/Palette.swift` (every colour the app draws), `Pane/Resources/Assets.xcassets/AccentColor.colorset` |
| Buttons, corner radii, shadows, toasts | `Pane/Views/DesignSystem.swift`, with the rules in [docs/DESIGN.md](DESIGN.md) |
| The iPhone bar above the keyboard | `Pane/Editor/FormatBar.swift` |
| The Mac's format menu and toolbar | `Pane/Views/FormatPopover.swift`, the `.toolbar` in `Pane/Views/RootView.swift` and `Pane/Views/NoteDetailView.swift`, glyphs in `Pane/Views/ToolbarGlyph.swift` |
| The app's name | `scripts/make-it-yours.sh --name` for the name under the icon; the words inside the app are in the views (search for "Pinto Notes") |
| The icon | `Pane/Resources/AppIcon.icon` (open it in Icon Composer, which comes with Xcode 26), `Assets.xcassets/AppIcon.appiconset` for older systems, `Mark` and `MenuBarIcon` for the mark inside the app |
| The AI server's tools | `supabase/functions/mcp/files_tools.ts`, deployed with `supabase functions deploy mcp --project-ref <ref>` |
| The sign-in emails | `scripts/auth-emails.ts`, then `deno run -A scripts/auth-emails.ts write` |

The repository's [CLAUDE.md](../CLAUDE.md) (and `AGENTS.md`) tell an AI coding agent how this codebase works and how to test a change, so Claude Code and Codex can work on it from the first prompt. Some prompts that work well here:

1. "Change the accent colour from amber to a deep green, in light and dark mode. Start in Pane/Editor/Palette.swift and the AccentColor asset, follow docs/DESIGN.md, and run scripts/qa-test.sh PaneTests/AmberButtonTests when you're done."
2. "Add a button to the iPhone keyboard bar (Pane/Editor/FormatBar.swift) that inserts today's date as a heading. Match the bar's other buttons, and add a test in PaneTests/Interaction like the ones there."
3. "Rename the app to Kim's Notes in every string a person reads, on the Mac and iPhone. Leave code names like Pane alone. Show me the list of strings before you change them."
4. "Add a word and character count for the open note to the Mac window's toolbar. Find how the toolbar is built in Pane/Views/RootView.swift first, and test it in the offscreen harness under PaneTests/Harness."
5. "Add a tool to the AI server that lists the notes changed in the last 7 days, in supabase/functions/mcp/files_tools.ts, with a Deno test next to the others. Then deploy it to my project with supabase functions deploy mcp."

Ask for one change at a time and run the tests the agent names. A small change you understand is easier to carry forward than a big one.

## 5. Keep pulling updates

New versions ship most days. To bring them into your copy:

```sh
git remote add upstream https://github.com/pinto-notes/pinto-notes.git   # once
git fetch upstream
git merge upstream/main
xcodegen generate
scripts/deploy-backend.sh <ref>   # when the update has new migrations or functions
```

Fewer conflicts, in order of how much they help:

- **Keep your settings out of tracked files.** Your identity is in `Config/Identity.local.xcconfig` and your backend in `Config/Backend.local.xcconfig`. Both are gitignored, so an update never touches them.
- **Add files rather than editing big ones.** A new view, a new `extension` in its own file, or a new test file never conflicts. Upstream changes the large files (the editor, the note list) often.
- **Let the project file regenerate.** `Pane.xcodeproj` is generated from `project.yml`. If it conflicts, take upstream's (`git checkout --theirs Pane.xcodeproj`) and run `xcodegen generate`.
- **Add migrations, never edit them.** Put database changes in a new file in `supabase/migrations` with a timestamp newer than every other one. Upstream's migrations then apply cleanly after yours.
- **Merge often.** A week of upstream is an easy merge; three months is a hard one.

## Something didn't work

If a step here fails on a fresh clone, that's a bug in this page or the scripts. Open an issue at [github.com/pinto-notes/pinto-notes](https://github.com/pinto-notes/pinto-notes/issues) with the command and what it printed. Every night CI builds a fresh clone with no secrets and no Apple team (`scripts/ci/fresh-clone-build.sh`), so most breaks are caught before you see them.
