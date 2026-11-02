# Mac rendering audit, 2 November 2026

Base: `origin/ui/settings-card` at `9757d2a7`. Work is on `perf/mac-audit`.

## Method

`MacRenderAuditTests` uses generated notes in in-memory ModelContainers. Its titled windows sit at `(-30000, -30000)` and are never ordered in. Tests call the native editor, table selection and search-field delegate directly. They post no global input events and use no production data.

Measurements are Debug on Emil's Mac, an Apple M4 Max, model Mac16,5. The Air was reserved first, but its Xcode license blocked compilation. Following Emil's revised instruction, the audit moved to this checkout. The Air lock was released and the audit checkout removed. XcodeGen and the `/Applications/Xcode.app` link remain on the Air as requested.

Each timed window update includes four main-actor yields, layout and display. Settling sleeps are outside those timings. RenderProbe counters are scoped to the fixture's ModelContext. The report distinguishes SwiftUI bodies from native overlay passes and hosting-view allocations. Timing values are diagnostics, not new build gates. Separate processes varied with machine load, so body and allocation counts are the evidence for removed work.

Typing uses a 5,000-word note with 500 ten-word paragraphs. The first phase sends 12 keys through `PaneTextView.insertText`. The second flushes the real debounced save on each of 12 further keys and checks the model against the editor. A burst can cross a debounce boundary; its occasional row/query updates are included. Window titles remain unchanged. Search and scrolling use 2,000 notes. Folder switching alternates a 25-note folder and All Notes five times. Scrolling takes 21 jumps of 100 rows. Both searches type seven successive queries.

The block fixture contains ten tables and twenty distinct synthetic wiki cards, with no metadata fetch. The opening measurement includes queued work and display. The scrolling regression then reveals every block, resizes the editor and checks table focus and retained host identity.

## Results

The before column uses the calibrated baseline run with instrumentation and the build prerequisite below, before performance fixes. Body counts are totals for the stated samples. The final after values are from the isolated final audit run.

| Path | Before, Debug offscreen | After, Debug offscreen | Decision |
| --- | --- | --- | --- |
| Typing, 12 keys | 28.196 ms median full update; 13.136 ms native; 36 overlay passes | 28.260 ms median full update; 12.794 ms native; 24 overlay passes | Merge redundant overlay requests within each turn |
| Typing with 12 model-save flushes | 54.295 ms median; 12 editor bodies, 12 row bodies, 22 list bodies, 34 sidebar bodies; zero root/detail/toolbar bodies; 36 overlay passes | 56.397 ms median; 12 editor bodies, 12 row bodies, 20 list bodies, 32 sidebar bodies; zero root/detail/toolbar bodies; 24 overlay passes | Keep model/query behavior; reduce overlay requests |
| Settings sidebar search, 8 edits | 7.373 ms median; 8 card bodies and 8 unchanged page bodies | 7.961 ms median; 8 card bodies and zero unchanged page bodies | Equatable navigation callback |
| Folder switching, 10 steps | 301.288 ms median; root/detail/editor/list/sidebar 10 each; toolbar stage 20 | 295.053 ms median; same outer body counts; 758 row bodies | No folder-switch production change |
| Scrolling 2,000 notes, 21 jumps | 76.293 ms median; 625 row bodies; zero root/sidebar/list bodies | 129.954 ms median; same 625 row bodies and zero outer bodies | No change |
| List search, 7 keys | 27.610 ms median; 7 list bodies, 161 row bodies; zero root/sidebar bodies | 40.853 ms median; same 7 list and 161 row bodies; zero root/sidebar bodies | No change |
| QuickOpen, 7 keys | 12.443 ms median; 7 panel bodies, then one for text results; zero root/sidebar/list bodies | 13.269 ms median; same 7 panel bodies plus one for text results; zero root/sidebar/list bodies | No change |
| Open 10 tables and 20 cards | 396.734 ms, one opening; 30 host allocations and 10 overlay passes; root/detail/editor 2 each, list 1, toolbar stage 5 | 331.948 ms, one opening; 4 host allocations and 3 overlay passes; same outer body counts | Defer initial offscreen hosts and merge overlay requests |
| Empty pane to note, 6 cycles | 298.533 ms median; 66 overlay passes over deselection/open cycles; root 18, detail/editor 6 each, list 12, toolbar stage 24 | 299.690 ms median; 6 overlay passes over the cycles; same outer body counts | Keep native toolbar visibility |

QuickOpen's final direct store search took 10.510 ms and returned the eight expected text hits. The measured 438.268 ms panel wait includes the explicit 120 ms debounce and the test's settling sleeps, so it is not a first-result latency. The test checks that the result update occurred.

Scrolling and list-search timings rose in the final process despite unchanged body counts and no production changes in those paths. Earlier fixed runs measured 79.212 ms and 45.371 ms respectively. The combined prepush run repeated them at 73.919 ms and 28.853 ms, again with identical body counts. These are not controlled before/after speedups. The Settings test uses a deliberately small environment-reading page, so its body count, rather than its few milliseconds, establishes the closure fix. The one-opening block timings likewise remain diagnostic; the deterministic change is thirty host allocations down to four.

## Changes

### Settings navigation

`SettingsCard` supplied a new `openSettingsPlace` closure whenever its search field changed. A page that reads that environment value rebuilt once per key even though the page stayed the same. `OpenSettingsPlace` is Equatable. Its callback uses the card's State storage, so the retained closure reads the current navigation path. Search now leaves the page alone. The test also invokes the earlier callback twice after search and checks both destinations.

### Overlay requests

Styling and frame updates each queued their own `layoutCards` call. Requests in one turn now share a pass. A nonanimated geometry request takes precedence over an animated request in that turn. Explicit synchronous layout still clears the queued request. The typing regression caps the four-turn update at two passes per key, below the base's three. Ten repeated frame requests in a single turn must produce exactly one pass.

### Initial table and card hosts

The editor previously created every host, including blocks far below the viewport. It now creates a host when the block first enters the viewport or when a table has a focus request. Already-created hosts stay alive until their block disappears or the note closes. This preserves active table state across scrolling. Resizing and content changes still update those existing hosts. The change defers first construction; it does not recycle visited hosts or skip text layout through the blocks.

The first fixed run created four hosts instead of thirty. The regression rejects eager construction, visits all thirty blocks, preserves the first table's host, resizes twice and requests a never-visited offscreen table's cell.

## Paths left unchanged

### Focused scene actions

The audit did not establish a menu-bar Commands body count. Two DEBUG-only attempts used the test host's hidden scene, including a ModelContext focused value independent of the editor target. Focused values did not resolve to Commands there. Both attempts failed the positive control that required Commands to observe the fixture. The temporary scene hook and counters were removed.

Consequently, this branch leaves `newNoteAction`, `importAction`, `importFromAction`, `deleteNoteAction` and `showHistoryAction` as they were. There is no measured menu-body result to justify Equatable wrappers for them. The ordinary window measurements still cover root, detail, list and sidebar work. A menu-specific audit needs an offscreen scene harness that first passes that positive control.

### Typing, folders, scrolling and search

Typing did not rebuild the root, note detail or toolbar stage in the measured baseline. A committed save updates the edited row and the editor. SwiftData query updates also rebuild the list and sidebar, sometimes more than once per save. Those remain visible in the counts. This audit does not replace the folder/file query subscriptions or change save behavior.

A folder switch constructs the expected list once. Scrolling constructs newly visible rows and leaves the outer views alone. List search updates the list once per key. QuickOpen updates the panel once per key and again after the debounced text read. Its text search already runs off the main thread. No redundant parent work was found in those paths.

### Empty toolbar

An experiment kept native toolbar items mounted, made their controls transparent and changed shared-background visibility. It measured 171.704 ms median over six empty-to-note openings, versus 298.533 ms in the calibrated baseline. However, it failed the existing native-item visibility contract on every cycle. It therefore did not provide the same guarantee that both the items and their glass were absent. The experiment was reverted. No toolbar visibility or accessibility behavior change ships.

The native toolbar insertion cost remains. Fewer editor overlay passes do not establish a recovery of the earlier 77 ms first-open result.

### Earlier editor-opening work

The report on `origin/perf/open-editor`, `docs/Investigations/mac-editor-open-2026-11-02.md`, identified duplicate initial styling and approximately 187 ms of hosted table/card display work. This base still has the original delegate ordering. This branch does not duplicate that branch's initial-styling fix or introduce editor reuse. Its host deferral addresses the separate initial hosting cost.

## Build prerequisite and validation

`PaneTests/FreshCloneTests.swift` on the requested base had an opening `#if os(macOS)` without a closing `#endif`. The missing terminator is added so the test target compiles. It changes no test logic or app behavior.

- The initial regression run failed on eight unchanged Settings-page bodies, thirty eagerly constructed block hosts and thirty-six overlay passes for twelve keys. The final isolated `MacRenderAuditTests` run passed all six tests in 25.790 seconds.
- The broader fixed run completed 30 tests in four suites. Twenty-nine passed. `TableInteractionTests.aNewTableUnderAnotherTakesTheKeyboardToo` failed because it expects `After the table` immediately followed by a table. The actual text includes the blank separator intentionally introduced by the base's `newGridEdit` implementation. The correct new table received the text.
- With host deferral and overlay coalescing disabled to reproduce the base rendering behavior, the whole `TableInteractionTests` and `EditorCaretMacTests` suites ran 16 tests. The same table assertion was the sole failure. Both Mac caret tests passed. The fixed implementation was then restored. This stale assertion is left unchanged.
- The first prepush compiled both platforms and ran 236 tests. Its two failures were stale `MacWindowChromeTests` assertions: Search expected a list field although the base's sidebar button now opens QuickOpen, and New Folder expected a sheet although the base names folders inline. Those tests now verify the current panel routing, list-field focus, inline name selection and committed rename. No app behavior changes accompany these test corrections.
- The revised chrome check does not require SwiftUI FocusState to focus QuickOpen inside its never-key window. The existing `QuickOpenTests` key-window tests cover panel focus and keyboard selection. The chrome fixture continues to check the native list field's focus, the sidebar button's panel routing, and opening and closing that panel.
- `TEST_RUNNER_PANE_PERF_SLACK=4 scripts/prepush.sh --tests` passed on the final app and test sources. Mac Debug and the iPhone simulator app/test compiles passed. All 236 selected tests in 29 suites passed, including the six audit tests and the corrected chrome checks. The timing multiplier applies to existing timing budgets, not the new body/allocation limits. The check took 363 seconds.

Rerun with Xcode selected and XcodeGen installed:

```sh
xcodegen generate
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer LIMIT=1500 \
  scripts/qa-test.sh PaneTests/MacRenderAuditTests
scripts/prepush.sh --tests
```

The measured QA runs disabled debug-symbol generation and compiler indexing through an untracked `XCODE_XCCONFIG_FILE`. Swift optimization remained Debug. Before every build the audit checked other worktrees' `xcodebuild` processes and disk space. Only the audit's own build output was removed. An untracked PATH wrapper serialized prepush's compiler jobs, waited for other worktrees between phases and monitored the 12 GB disk floor. The prepush script and CI selection were unchanged. The completed iPhone derived-data folder was removed after its successful compile, before the Mac test phase, to recover space.
