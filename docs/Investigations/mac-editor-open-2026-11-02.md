# Mac editor opening, 2 November 2026

Base: `origin/release/1.3` at `acc13c3b`. This investigation covers the native editor. The list, window toolbar and cold whole-window open are being investigated separately.

## Lifetime and work on the open path

`RootView.detail` gives `NoteDetailView` the selected note's identity with `.id(note.id)`. Switching notes destroys that detail subtree. `PlatformEditor.makeNSView` creates a new `NSScrollView`, `PaneTextView` and its TextKit 2 stack. The date label and `EditorCore` are properties of the new text view. No editor stack is cached by note or reused across selections.

The Mac path runs in this order:

1. Create the scroll view and text view.
2. Configure text-view options, assign the plain string, remember its hash, install the storage/highlight observers, parse the structure and apply markdown attributes. Notes above 24,000 UTF-16 units style their first approximately 16,000 units, then schedule the remaining chunks on the main queue.
3. Set typing attributes, add the date label and set the header.
4. Connect the controller and attachment resolver, put the text view inside the scroll view, then install the links footer.
5. SwiftUI assigns the actual size. `setFrameSize` changes insets, places the foot, updates image dimensions and queues overlay placement. TextKit lays out the visible viewport.
6. `layoutCards` creates SwiftUI hosting views for tables and embeds. It explicitly ensures layout from the beginning through each styled block. Subsequent overlay passes reuse hosts, but still walk the blocks and ensure their text layout.

The Mac format bar is not an editor-owned accessory view. `FormatBarHost` creation in `MarkdownEditor.swift` is in the iOS branch. Mac format controls live in the window toolbar.

There is no synchronous version-history read in native editor configuration. `remember` appends a string hash to a bounded array. `NoteDetailView.noteOpened` refreshes wiki/backlink state and starts the unlinked-mentions search. The search runs in a detached utility task. These are note-detail tasks, outside the isolated editor measurement.

The Mac text view enables undo but has no separate history/undo-stack initialization loop on opening. It uses AppKit's undo manager. Editor reuse would need explicit treatment of note boundaries, selection, observers, pending styling, table focus, date folding, highlights, links and undo. A stable SwiftUI identity alone is not a complete reuse implementation.

## Measurement method

The committed `EditorOpenStageTests` uses an offscreen 720 by 760 point window. It exercises the real `PaneTextView`, forces TextKit 2 viewport layout at the final width, and measures construction, configuration, attachment, an empty links foot, viewport layout, overlays and display separately with `ContinuousClock`. Each fixture has one first sample and 24 warm samples. The synchronous samples exclude window creation and closing. A separate measurement keeps the window alive through four task yields and another layout/display pass, to include queued editor work. A fixture's first sample is not a cold-process first open. Warm medians are diagnostic and do not gate builds.

A second test measures the public `MarkdownEditor` representable through a SwiftUI hosting view. It compares changing its identity, as the selected note does, with retaining its identity and calling the existing external-text synchronization path. It checks the resulting text and native-view identity on each update. This experiment estimates the benefit available from reuse; it is not an application-level reuse fix.

Temporary internal checkpoints separated configuration options, plain-string assignment, hash bookkeeping, observers, structural scanning, markdown attributes, typing attributes and the header. The checkpoints were removed after measurements.

These are Debug-build relative costs on a Mac running other investigations, not Release click-to-photon measurements. Debug symbols and compiler indexing were disabled to limit disk use. No window was ordered on screen and no global input event was posted.

## Baseline editor stages

Warm medians in milliseconds before the fix, 24 opens per fixture. The block fixture has 10 tables and 20 synthetic note cards. The photo fixture has three generated 4032 by 3024 JPEGs; files are local and removed after the test. The benchmark does not fetch link metadata or use a real library.

| Stage | Small note | 80 lines | Tables and cards | Three photos |
| --- | ---: | ---: | ---: | ---: |
| Scroll-view allocation | 0.071 | 0.071 | 0.072 | 0.072 |
| Text view and TextKit allocation | 0.379 | 0.376 | 0.362 | 0.386 |
| Configure | 1.584 | 15.419 | 45.188 | 1.590 |
| Attach to scroll view and window | 1.184 | 4.772 | 3.094 | 1.653 |
| Empty links footer | 0.666 | 0.696 | 0.733 | 0.694 |
| Viewport layout | 2.315 | 14.100 | 7.367 | 3.490 |
| Overlay placement and creation | 0.017 | 0.023 | 11.795 | 1.084 |
| Display and hosted-view layout | 0.383 | 1.250 | 186.735 | 7.004 |
| Synchronous total | 6.942 | 37.023 | 258.301 | 16.612 |

Medians of individual stages need not sum to the median total. The first photo-fixture sample took 24.010 ms, including 12.811 ms in display. This is not a cold-process first open. Existing image preloading and caching matter; this benchmark does not simulate a hover preload.

Internal checkpoints on the small note measured 0.003 ms for the hash, 0.006 ms for observers, 0.030 ms for typing attributes and 0.124 ms for the header. Structural scanning was 0.022 ms. For 80 lines the hash was 0.006 ms, structural scanning 0.101 ms, and a markdown-attributes pass about 7.272 ms. The same pass in the table/card fixture was about 21.636 ms. These internal timings include probe overhead and are diagnostic.

## Confirmed duplicate work and fix

`PaneTextView.configure` installed its selection delegate before assigning `string`. AppKit sent a selection notification during assignment. `textViewDidChangeSelection` called `core.restyle`, and configuration then called it again. The regression test failed with `core.lastRegions == ["full", "full"]` instead of `["full"]`.

The fix installs the delegate after the initial text, attributes and header are ready. The explicit initial styling remains. No editor lifetime, undo or note-switch semantics change. The regression checks the pass count, text, title font, checklist decoration and final delegate.

The committed paired benchmark recreates the old ordering by setting `view.delegate = view` before calling `configure`. It alternates old and fixed ordering within each pair, checks two passes versus one, and prints medians from 24 pairs. This avoids treating a change in machine load between two test processes as a code improvement.

| Initial configuration, same-run paired medians | Previous order | Fixed order | Reduction |
| --- | ---: | ---: | ---: |
| Small note | 1.317 ms | 0.645 ms | 51% |
| 80 lines | 20.057 ms | 10.532 ms | 47% |
| 10 tables | 60.260 ms | 28.527 ms | 53% |

Absolute times varied with machine load. In particular, independent before/after processes sometimes had slower total times despite removing work. The paired results and the deterministic pass-count regression are the evidence for the fix. Do not read the separate fixture-total runs as a controlled whole-open speedup.

## Reuse and its effect on the whole window

After the fix, replacing a represented small editor measured 8.434 ms versus 3.013 ms with a stable identity. Through queued layout/display, the same cases measured 13.487 versus 4.485 ms. The experiment swaps only synthetic text and checks identity and resulting text; it does not validate all the state a real note switch must clear.

To test whether replacing the native editor caused a much larger layout cascade elsewhere, a temporary `PlatformEditor` cache returned the previous scroll/text view on alternating opens in `NoteOpenTests.window(notes: 200)`. The note-detail identity, list and toolbar still changed normally. The cached view received the new header, text, save closure and links model. Each open checked the shown text and whether the native text view was actually reused. All checks passed.

Across 20 alternating pairs, normal native replacement had a median of 320.215 ms and native reuse 312.732 ms. This is about 7.5 ms, or 2.3%, in that loaded Debug run. Native reuse did not remove the large whole-window cost. The absolute 320 ms differs from the coordinator's approximately 140 ms profile; use the within-run comparison, not those absolute numbers across machines or load conditions. The temporary cache and its test were removed. It was an experiment, not a safe note-lifetime implementation.

The small editor's native subtree contained 14 views after display, versus 41 to 42 for 80 lines, 154 for tables/cards and 23 for photos. These are counts of existing views, not counts of layout callbacks. They must not be compared numerically with the release gate's 500 to 1,000 layout calls per open.

## Remaining costs and proposed work

- For the short-note goal, prioritize the SwiftUI graph/list/toolbar investigation. The native editor is rebuilt, but retaining that subtree saved only several milliseconds in the whole-window experiment. Editor reuse alone will not take a 110 to 200 ms open below 50 ms.
- For notes with many tables/cards, defer creation of offscreen hosting views and update the visible set as the scroll viewport moves. `EditorCore.overlays` currently ensures text layout through all styled blocks, and `PaneTextView.layoutCards` creates every host without checking the viewport. In the baseline block fixture, hosted display/layout was about 187 ms and overlay creation/placement another 12 ms. The later loaded run measured 275 and 17 ms. These dominate the remaining markdown setup. A safe implementation needs tests for scrolling into blocks, active table cells, selection, resizing and returning to an earlier scroll position.
- Measure and coalesce the queued `layoutCards` requests before broad changes to editor lifetime. Configuration and every `setFrameSize` can each queue a pass. In the final instrument-free fixture run, the small editor's synchronous total was 6.215 ms and its total through queued display 12.354 ms; the 80-line fixture measured 34.172 and 54.163 ms. Four task yields include scheduler noise, so these are diagnostic totals, not a precise first-frame presentation time.
- Keep the image cache/preload path. Three generated local photos took about 17 ms warm in the baseline editor test and 21 ms in the later run. These results do not establish cold image decode as the short plain-note bottleneck.

The committed production change is only the delegate-order fix. The benchmark and report preserve the measurements and a way to rerun the paired comparison. No caching, offscreen-block deferral or first-open workaround is shipped in this branch.

## Validation and handoff

- The new regression was run before the fix and failed on the two initial full styling passes.
- `LIMIT=1500 scripts/qa-test.sh` with the regression, editor stages, incremental/progressive styling and links-footer suites passed 12 tests in four suites. The existing links-footer suite activates its offscreen window; the new tests never activate or order a window.
- A second offscreen run with the temporary whole-window experiment, paired configuration benchmark, regression and Mac caret suite passed seven tests in three suites. The temporary experiment was then removed.
- `scripts/prepush.sh --tests` passed on the final production code and committed test sources. Mac and iPhone simulator app/test builds passed; 67 selected tests ran with zero failures. This included the new regression and all three permanent editor benchmark tests, the smoke tests and whole-app checks. The check took 278 seconds.
- `git diff --check` passed. The QA build folder and the prepush build folders were removed. Disk space recovered to approximately 19 GB free, above the coordinator's temporary 12 GB floor.

To rerun the committed measurements, export `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`, generate the project with `xcodegen generate` if needed, then run `LIMIT=1500 scripts/qa-test.sh PaneTests/EditorOpenStageTests PaneTests/EditorInitialStyleTests`. The measured Debug runs used `GCC_GENERATE_DEBUGGING_SYMBOLS=NO` and `COMPILER_INDEX_STORE_ENABLE=NO` via a temporary `XCODE_XCCONFIG_FILE` to reduce disk use, without changing Swift optimization settings.
