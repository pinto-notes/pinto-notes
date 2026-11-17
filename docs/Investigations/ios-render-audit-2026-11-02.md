# iPhone render audit, 2026-11-02

The iPhone app had never been measured. This audit looked for the same traps found on the Mac
(back-forward-2026-11-02.md): values that count as changed on every pass, a whole screen worked out
again for one small change, main-thread work that can wait, and views kept alive after leaving.

## How it was measured

`PaneTests/Perf/PhoneRenderTests.swift` is a new suite for the iOS unit-test host. It runs headless
in the simulator, with no Simulator.app window and no input events. It puts the real `RootView` in
a `UIWindow` at iPhone 17 Pro size (402 × 874), on an in-memory library. The suite drives the app
the same way the app drives itself:

- notes open through `NoteOpener`, the path links, Shortcuts and the menu bar use
- Back pops the navigation stack, as the back button does
- keys go into the editor with `insertText`, and characters into the list's search field the same way
- scrolling sets the list's content offset

The suite counts bodies with the existing DEBUG `RenderProbe`, scoped to the fixture's
ModelContext. Two new counters were added: `NoteRow` (list rows) and `NotePreviewCard` (the
long-press card). A third, `FormatBar` (the bar above the keyboard), is global. All builds are
Debug on the iOS 26.4 simulator.

To find causes, `Self._printChanges()` was added for a while to RootView, SidebarView, NoteListView
and NoteDetailView, then removed.

Run it with:

```sh
xcodebuild test -project Pane.xcodeproj -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  CODE_SIGNING_ALLOWED=NO '-only-testing:PaneSystemTests/PhoneRenderTests'
```

`scripts/prepush.sh --tests` runs Mac tests only, so `scripts/ci/select-tests.py --suites-of` now
skips a test file that is iPhone-only as a whole. Before, the check asked the Mac run for those
suites and then failed with "no test of it ran".

## Before and after

Body counts are the evidence. Simulator timings on this busy Mac varied 2.5× between runs of the
same code (opens from 93 to 263 ms), so they are given as medians of the per-run medians and
claim nothing.

| Path (counts summed over 5 steps) | Base | Fixed |
| --- | ---: | ---: |
| Open a note: SidebarView (folder list under the stack) | 0 to 4 (3 of 7 runs above 0) | 0 (6 of 6 runs) |
| Open a note: NoteListView | 5 to 7 | 5 |
| Open a note: NoteDetailView | 5 to 7 | 5 |
| Open a note: RootView | 10 | 10 |
| Back: NoteDetailView (the note being left) | 0 to 2 | 0 |
| Back: SidebarView | 0 to 1 | 0 |
| Back: NoteListView / RootView | 5 / 5 | 5 / 5 |
| Open, median of 7 / 6 run medians (noisy) | 144.8 ms | 123.8 ms |
| Back, median of 7 / 6 run medians (noisy) | 76.9 ms | 71.4 ms |

Unchanged, measured to rule them out:

| Path | Counts | Time (Debug sim) |
| --- | --- | --- |
| Typing, 10 keys | NoteDetailView 1 (Undo becomes possible), editor text 2, RootView 0, rows 0, FormatBar 0 | 5 to 8 ms per key |
| One save while typing | SidebarView 2 to 3, NoteListView 1 to 2, editor text 1 | |
| Scrolling 2,000 notes, 20 steps of 400 pt | NoteRow 108 (the rows coming into view), NoteListView 0, NotePreviewCard 0 | 19 to 40 ms per step |
| Search, 7 characters, 2,000 notes | NoteListView 7 (one per character), NoteRow about 181 (highlights change) | 28 to 57 ms per character |
| Launch to the reopened note | varies run to run (NoteListView 4 to 13 with the same code) | |

## Findings and fixes

**1. The import actions counted as changed on random passes.** RootView handed the folders and
the list a new `ImportActions` value on every pass, made of two fresh closures. On the Mac,
`Equatable` with `==` returning `true` fixed this. But the environment compares old and new values
bit by bit, and two closure contexts are equal only when a freed context's memory happens to be
reused. `_printChanges` showed `SidebarView: _imports changed` and `NoteListView: _imports changed`
on some opens and not on others. In 3 of 7 base runs the folder list was worked out again on note
opens and the note pane on Back. The value is now one reference to a box that RootView keeps for
the window's life (`ImportActions.Box`). It is the same bits on every pass. The closures in the
box are replaced on each pass, and nothing observes them. This also applies on the Mac, where it
removes the same dependence on memory reuse.

**2. The folders and the list weren't shielded from RootView's passes on iPhone.** `.equatable()`
on SidebarView and NoteListView was Mac-only (it was added for sidebar toggles). On iPhone each
note open runs RootView twice: once for the `NoteOpener` request and once for the selection. That
also handed both columns their closures again. Both are now compared on iPhone too. The sidebar's
selection still arrives through its binding and the list's through its own, so they follow the
state as before.

**3. A waiting spare web view started in the middle of navigation.** After an app note takes the
spare `NotePageSandbox`, the next one starts 2 seconds later, and every navigation postpones it.
Only the Mac told the spare that navigation happened: on iPhone, `noteChanged` never called
`NotePageSandbox.navigationOccurred()`. A WebKit content process launch, about 18 ms on the Mac's
main thread, could then land in the next open or Back. It is now called on both platforms.

**4. The spare web view started during launch.** On iPhone, `PaneApp.init` created the spare
right away. Its web content process launched on the main thread during the first frames, as the
reopened note was coming up. The rule list still compiles at launch (WebKit does that off the main
thread). The web view now starts once launch and navigation have been quiet for 2 seconds
(`NotePageSandbox.prewarmAfterLaunch`). An app note opened in those first seconds makes its own
sandbox, as it always could. The Mac keeps its immediate prewarm (the Mac audit owns that path).

## Left as it is

- **Each save works out the hidden folder list 2 to 3 times.** While you type, the editor saves
  every 0.35 s or so. Each save invalidates SidebarView through three SwiftData triggers in
  separate updates: the `@Query` of folders, the `@Query` of files, and `Folder.parent`. On iPhone
  the folder list sits under the note and nobody sees it. Removing this means taking the folder
  counts and the change triggers out of `@Query`, as the list's counts already come from
  `LibraryNotes`. That is a structural change, not a quick win. The typing test fails if a fourth
  trigger appears.
- **Two RootView passes per open through `NoteOpener`.** One is for the request and one for the
  selection. A row tap sets the selection directly and costs one pass. After fixes 1 and 2, the
  extra pass reaches nothing below RootView.
- **The long-press preview.** It can't be driven without input events. Its card isn't built while
  rows show: 0 bodies while scrolling 2,000 notes, guarded by the scroll test. When it is shown it
  splits the whole note to read 24 lines, which only matters for very long notes.
- **The app note's web view on iPhone could not be measured.** In the iOS unit-test host, WebKit
  never finishes compiling the sandbox's rule list: `NotePageSandbox.make()` had not returned after
  20 s, so an app note never gets its web view there. Whether a departed web view is released is
  checked on the Mac (`BackForwardTests.leavingAnAppNote`), and that code is shared. The iPhone
  test checks fix 3 without WebKit.
- **The keyboard bar.** It counted 0 bodies while typing. The headless host may not show the
  software keyboard, so this shows the bar isn't worked out by keystrokes when it is in the view
  tree. It doesn't prove the bar was on screen.

## Regression tests

`PhoneRenderTests` (iOS only), all passing on the fixed branch over three iterations:

- `importActionsAreOneReference`: the value is one reference, with the same bits on two passes. If
  closures come back, this fails every time, not 3 runs in 7.
- `openAndBack`: no SidebarView body on any open or Back, NoteListView at most once per step,
  NoteDetailView once per open and never on Back. It also has loose time limits.
- `navigationPostponesTheSpareWebView`: a pending spare is cancelled and rescheduled by each open
  and each Back in the iPhone window. It failed 6 times out of 6 on the base RootView.
- `launchLeavesTheSpareWebViewForLater`: launch schedules the spare and doesn't start it, and
  navigation postpones it.
- `typing`: no RootView, row or keyboard-bar bodies from keys, the note pane only for Undo, and at
  most 3 sidebar passes per save.
- `searchAndScroll`: scrolling works out only rows coming into view, never the list or a
  long-press card. Search works out the list once per character.
- `launchToTheList`: printed, not judged (the counts vary run to run).

## Also on this branch

- `PaneTests/FreshCloneTests.swift` on `ui/settings-card` was missing its closing `#endif`, which
  stopped every test build. It now has it.
