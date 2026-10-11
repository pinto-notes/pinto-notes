# Note apps on in the released app: staging proof, 2026-10-11

A Release build of the iPhone app (the released bundle id, no `DEBUG`), on an iPhone 17 Pro
simulator with iOS 26.4, signed in to a new account on the staging project. Staging served the app
tools (`AMBER_MCP_TOOLS=pages`) with the render service behind them. The steps are
`PaneUITests/NoteAppsStagingUITests`, run one at a time in order; the MCP calls in them use an
access token made in the app (Settings, Connect an AI, Claude Code).

| Step | What it shows | Picture |
|---|---|---|
| An AI makes a note and gives it an app (`create_note`, `set_note_page`) | The note opens as the app | `02-app-made-by-ai.jpg` |
| Two taps in the app | The count goes up; "Changed · Undo"; the data reaches the server in about 3 s, where `get_page_data` reads it | `03-two-glasses.jpg` |
| The app is quit and opened again | The count is still there | `04-after-relaunch.jpg` |
| The AI changes the app while it is open (`edit_note_page`) | The new version arrives in about 1.5 s with "Claude Code updated it · Undo" | `05-ai-changed-the-app.jpg` |
| Undo | The version before is back, with the same data | `06-undone.jpg` |
| The AI changes the app's data (`update_page_data`) | The open app shows the new number | `07-ai-changed-the-data.jpg` |
| Launched with `-noteApps NO` | The same note is its text; More has no app items | `08-switched-off-text.jpg`, `09-switched-off-more-menu.jpg` |
| Launched normally again | The app and its data are back | `10-on-again.jpg` |
| The path the server teaches AIs: `create_app`, `delete_app_file`, `write_app_file`, `check_app`, `preview_app` | A React project is compiled by the render service, passes its checks, goes live and runs in the note | `11-react-project-app.jpg` |

| An app asks for Reminders and for the location (apps no longer have the device features) | "Reminders aren't available in apps yet.", "Location isn't available in apps yet.", in the app; no system permission prompt | `12-device-not-available.jpg` |
| An app asks to open a link | "This app wants to open a link" with the whole address. Don't Allow: nothing opens. Asked again the next time; Open: the browser opens it | `13-link-asked-about.jpg` |

The whole run was repeated on the build with the link prompt and without the device features,
steps A to G in order, all passing.

## The Mac app

The same steps on the Mac download's Release build (target PaneDirect, team-signed, on staging),
on a MacBook Air with macOS 27.0, on 2026-10-11. The Air has no Xcode, so the steps were run from
inside the app by a probe file added to that one build, as the release gate does: it signs in,
makes the access token the way Settings does, calls the MCP tools with it, taps in an app with the
page's own `click()`, and presses Pinto Notes' own buttons through their accessibility action.
The build had Pinto Notes Beta's bundle id and sandbox, so it could not touch the real app's notes
on that Mac; with that id Settings still shows the real-data preview toggle, which the released
app does not.

| Step | Result on the Mac |
|---|---|
| Sign in, key, first sync, token made in the app | passed |
| An AI makes an app; it renders; two taps counted; data on the server | passed (data there at the first look, under 1 s) |
| Quit and reopen: the count is kept | passed |
| The AI changes the open app; a receipt's Undo; the version before is back | passed (change on screen after 0.8 to 1.2 s) |
| The AI changes the data; the open app shows it | passed, `mac-07-ai-changed-the-data.jpg` |
| `-noteApps NO`: the note is its text, no web view | passed |
| On again: the app and its data are back | passed |
| React project: `create_app`, `write_app_file`, `check_app`, `preview_app`, runs in the note | passed, `mac-11-react-project-app.jpg` |
| Reminders and location asked for by an app | "…aren't available in apps yet.", `mac-12-device-not-available.jpg` |
| A link: the question with the whole address, Don't Allow, asked again the next time | passed. Open was not pressed (it would leave a browser window on that Mac) |

One thing seen there: while the sheet a new account gets ("How did you hear about Pinto Notes?")
is up, the link question waits behind it until the sheet is dismissed.

Not covered on the Mac: a person's own clicks (so no "Changed · Undo" after a tap), the unsandboxed
build with the real bundle id, and pictures of the receipt and the alert (the pictures are of the
window's content only).

## What the proof found

Three faults showed up only here, with a real server and a Release build. Each is fixed on this
branch with a test.

1. **An app's data never left the device** when an AI had made the app. The push wrote only if the
   row still had the stamp it had read, and compared that stamp in milliseconds; the server stamps
   in microseconds, so it never matched, with no error. Nothing synced to other devices, and the AI
   read empty data. (`SyncEngine.stampWindow`)
2. **A note could stay blank, and a working version be marked as broken**, when a new version
   arrived while the app was still opening its note at launch. The web view made ahead of time was
   taken while its blank document was still loading, and the app's own document was then refused as
   a navigation. (`NotePageSandbox.expected`)
3. **Your own tap showed "iPhone updated it · Undo"**, once data did reach the server: saving data
   writes the app's row again, stamped with the device. (`NotePageStore.arrived`)

## Not covered here

- A real iPhone, and two devices at once.
- Network requests and API keys.
- ChatGPT and Claude through OAuth: the token here is the kind Claude Code and Codex get.
