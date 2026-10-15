# Release gate: gate/collab-fixes (6e97f65414)

**FAIL**: 17 over budget or failed, 2 regressions against mac-v1.2.31 (ef6f0f0efd).

- Date: 2026-10-15 03:54 UTC
- Build: Release, PaneDirect, Developer ID (team-signed, not notarized), Amber Notes Beta identity on staging, with the gate's probe added (scripts/release-gate/GateProbe.swift)
- Mac: fleet-air (Mac16,13, 27.0.1, Apple M4), 3 measured runs per account, medians
- Accounts: staging bench accounts of 1, 2000, 10000, 20000 notes, plus the gate's 3 notes each
- Server: staging runs what was deployed there, not this ref: mcp v45, account v20, account-status v19, share-files v19, lifecycle v22, key v10
- Budgets: scripts/release-gate/budgets.json; regression = over 15% worse than the baseline and past the metric's noise floor

## What failed

- 1 notes: folder switch, views laid out: 440 (budget 350) (baseline 401, +10%). AppKitPlatformViewHost 162, ToolbarItemHostingView 60, CellHostingView 60, NSHostingView 54, _NSCoreHostingView 42, WindowLayoutHostingView 24
- 2000 notes: cold launch to first usable window: 1708 ms (budget 1700 ms) (baseline 1695 ms, +1%)
- 2000 notes: folder switch, views laid out: 1583 (budget 350) (baseline 1586, 0%). AppKitPlatformViewHost 135, CellHostingView 132, NSHostingView 66, ToolbarItemHostingView 60, _NSCoreHostingView 42, WindowLayoutHostingView 24
- 2000 notes: longest hang during launch: 1442 ms (budget 900 ms) (baseline 1432 ms, +1%)
- 10000 notes: memory after the flows: 216 MB (budget 190 MB) (baseline 199 MB, +9%)
- 20000 notes: memory after the flows: 231 MB (budget 230 MB) (baseline 231 MB, +0%)
- 20000 notes: sidebar show, views laid out: 6117 (budget 5550) (baseline 6038, +1%). CellHostingView 756, AppKitPlatformViewHost 198, _NSCoreHostingView 162, NSHostingView 126, WindowLayoutHostingView 72, NSScrollPocket 54
- 20000 notes: typing and saving, hitches: 27 (budget 26) (baseline 26, +4%)
- 20000 notes: folder switch, longest frame: 647 ms (budget 490 ms) (baseline 726 ms, -11%)
- 20000 notes: folder switch, views laid out: 808 (budget 350) (baseline 1667, -52%). AppKitPlatformViewHost 342, CellHostingView 192, NSHostingView 66, ToolbarItemHostingView 60, _NSCoreHostingView 36, ListTableRowView 28
- Clicks on note rows that open the note (pointer travel 0 to 3 points): didn't run. The application ~/row-clicks/Amber cannot be opened for an unexpected reason, error=Error Domain=NSCocoaErrorDomain Code=260 "The file “Amber” couldn’t be opened because there is no such file." UserInfo={NSURL=file://~/row-clicks/Amber, NSFilePath=~/row-clicks/Amber, NSUnderlyingError=0x7a17044300 {Error Domain=NSPOSIXErrorDomain Code=2 "No such file or directory"}} The app didn't start
- Supabase security advisor warnings (staging): 117 (budget 114) (baseline 117, +0%). anon_security_definer_function_executable 30, authenticated_security_definer_function_executable 86, auth_leaked_password_protection 1
- Mac app installed: 61.4 MB (budget 56.0 MB) (baseline 49.2 MB, +25%)
- iPhone app compressed (download stand-in): 23.1 MB (budget 21.0 MB) (baseline 21.1 MB, +10%). Release build, unsigned, zipped; the App Store's thinned download is usually smaller.
- iPhone app installed (universal, unthinned): 60.4 MB (budget 54.0 MB) (baseline 54.4 MB, +11%)
- 2000 notes: sync push, one note, p95: 709 ms (budget 500 ms) (baseline 938 ms, -24%)
- 20000 notes: sync push, one note, p95: 1057 ms (budget 600 ms) (baseline 841 ms, +26%)
- 20000 notes: typing and saving, longest frame: 209 ms (budget 250 ms) (baseline 167 ms, +25%)
- Mac download (DMG): 24.1 MB (budget 26.0 MB) (baseline 20.2 MB, +19%)

## Headline numbers

| | 1 notes | 2000 notes | 10000 notes | 20000 notes |
|---|---|---|---|---|
| Cold launch to window | 773 ms | 1708 ms (fail) | 1705 ms | 2062 ms |
| Launch to synced | 2098 ms | 2635 ms | 2749 ms | 3127 ms |
| First sync | 856 ms | 3334 ms | 11990 ms | 24656 ms |
| Idle CPU | 0.5% | 0.5% | 0.5% | 0.5% |
| Views laid out while idle | 0 | 0 | 0 | 0 |
| Launch hangs per run | 2 | 1 | 1 | 1 |
| Flow hangs per run | 0 | 0 | 0 | 3 |
| Longest flow hang | 0 ms | 0 ms | 0 ms | 692 ms |
| Memory after the flows | 163 MB | 182 MB | 216 MB (fail) | 231 MB (fail) |
| Worst frame (step) | 119 ms (folder switch) | 179 ms (folder switch) | 217 ms (folder switch) | 647 ms (folder switch) |
| Mac download (DMG) | 24.1 MB (baseline 20.2 MB) | | | |
| Mac app installed | 61.4 MB (baseline 49.2 MB) | | | |
| iPhone app compressed (download stand-in) | 23.1 MB (baseline 21.1 MB) | | | |

## Totals

| Section | Pass | Fail | Regression |
|---|---|---|---|
| Performance | 130 | 11 | 1 |
| Security | 13 | 1 | 0 |
| Storage | 9 | 3 | 1 |
| Network | 71 | 2 | 0 |

Every line, every run and every hang stack: `~/content-tools/projects/amber-proto/release-gate/2026-10-15-gate-collab-fixes-6e97f65414.md` and `.json` (outside the repository).
