# Back and forward, 2026-11-02

## Findings

The requested base, `origin/ui/note-row-menu` at `9f40cb80`, lacks the earlier `perf/note-open` fixes. On that base, Back/Forward took 157.9 ms per step in Debug. RootView, sidebar, list, detail and editor each evaluated twice. Restoring the Equatable environment actions reduced this to 48.9 ms and removed sidebar updates. The earlier deferred prewarm and off-main snapshot encoding fixes are included too.

History was a value in RootView's state. Clearing its internal acknowledgement rebuilt the window and detail a second time. It is now an observable reference with an unobserved acknowledgement. The toolbar alone reads its button state. DEBUG body counters are scoped to the fixture's ModelContext, so concurrent windows do not pollute the measurement. History selection and toolbar preference updates use nonanimated transactions. The viewport stays fixed across every measured step.

The empty toolbar retained eight items whose contents had opacity zero. `ToolbarContent.hidden(_:)`, available since macOS 15, hides the native items and their glass. This differs from hiding a control's contents. Common writing commands now belong to the persistent toolbar stage; only the note-specific Attach menu comes from the pane. The empty column keeps a one-point background-free anchor.

An app's ready callback retained its sandbox. Its unstructured eight-second timeout also retained the old web view. The regression confirmed that every departed web view survived. The ready callback is now weak and clears itself, the timeout belongs to the view task, snapshot work cancels on disappearance, and departing or superseded pages disconnect their callbacks. The old web view now releases within the settling check.

Samples also showed deferred spare WebKit creation during later navigation steps. One cancellable task now replaces the separate delayed prewarms. Every navigation postpones it until navigation has been quiet for two seconds. The test checks cancellation of the pending prewarm when Back runs.

Untouched empty notes were purged without an animation. Cleanup now follows the destination's first commit, using a run-loop timer and a fresh empty/unselected check. Only the list animates its removal, over 0.2 seconds. The test checks the actual list transaction and the destination editor before waiting for removal.

## Measurements

All fixtures use in-memory data and titled windows at `(-30000, -30000)`, never ordered in. Toolbar menu actions exercise the real buttons without global input. Full-step timings include four main-actor yields, layout and display. The app test additionally drives and records the first destination frame before those yields. It then checks complete teardown separately. Pauses between steps are excluded.

| Debug measurement | Base | Fixed |
| --- | ---: | ---: |
| Back/Forward full step, median | 157.9 ms | 38.7 ms |
| App-note exit, settled median | 285.2 ms | 119.5 ms |
| App-note exit, first destination frame | not recorded | 88.9 ms |
| Root/detail/editor bodies per history step | 2 each | 1 each |
| Sidebar bodies per history step | 2 | 0 |
| List bodies per history step | 2 | 1 |
| Destination frame while discarding an empty note | not recorded | 62.8 ms |

The base history run measured 300 steps; the final scoped run measured 16. App exits used five base samples and five final scoped samples. The first open from an empty pane costs about 170 to 190 ms with native toolbar visibility. The comparable earlier opacity implementation measured 77 ms after the environment-action fixes. Ordinary history steps stay near 39 ms. This empty-pane layout cost is retained to remove the glass completely.

Profiling used `sample <our Debug test-host pid> N -mayDie -file ...`, with 3 to 8 second captures. The original history sample showed sidebar/list work in AttributeGraph. App samples showed native toolbar updates and NSHostingView layout under NSAnimationContext, plus delayed spare creation. Animation-context frames alone do not prove a SwiftUI animation. The fixes address measured redundant work and explicit view lifetimes.

## Validation

`BackForwardTests` passes all four tests, including time/body budgets, unchanged viewport geometry, native toolbar visibility, actual web-view release, prewarm cancellation and animated removal. `NotePageTests` passes 67 tests, `MacWindowChromeTests` 12, `RecentlyDeletedEditTests` 9 and `OpenedNotesTests` 4.

The extra `WindowUpdateTests` run passes its rendering-count checks but fails the old sidebar-collapse assertion twice. This is already inconsistent with the requested base: commit `f752a20a` deliberately pins the sidebar open and sets `canCollapse = false`. Its newer geometry test confirms that behavior. This branch leaves that behavior and the stale test unchanged.

`DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer TEST_RUNNER_PANE_PERF_SLACK=4 scripts/prepush.sh --tests` passed: Mac Debug, both iPhone simulator architectures and the combined selected suites. The existing busy-machine multiplier affects time budgets only; the isolated suite passes the default budgets above.

The first combined run passed the compiles and functional checks but exceeded default timing budgets (app first frame 256.3 ms, settled exit 334.0 ms). A subsequent run exposed the global RenderProbe counting other windows' sidebar bodies. Per-context counters and the context-filtered animation callback resolved that test interference before the final passing run.
