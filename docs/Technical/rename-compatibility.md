# Source rename compatibility

The source folders, Xcode project, targets and app module use PintoNotes. Product text uses Pinto
Notes. These remaining old names are intentional. Changing them would require a separate
compatibility change or would change historical material.

| Kept names | Where and why |
| --- | --- |
| `dev.emilwagman.pane*`, `group.dev.emilwagman.pane*`, related access groups and container IDs | Config, entitlements, exported UTTypes, Handoff, push, keychain services and logging subsystems. Installed apps and stored credentials use these identities. The test bundle IDs `dev.emilwagman.PaneTests` and `dev.emilwagman.PaneUITests` also stay. |
| `Pane.app`, executable `Pane`, `PaneShare.appex`, executable `PaneShare` | `project.yml`, generated project/schemes, install/setup/test/release scripts and their documentation. Explicit product names keep installs, embedded extensions and test hosts working. The direct download remains `Pinto Notes.app`; beta remains `Amber Notes Beta.app`. |
| `Pane`, `Pane.store`, `Pane-test`, `paneInstallID`, `PaneAutomaticUpdatesSet` | Existing application-support folders, library/store paths and UserDefaults keys. Other stored keys and filenames also remain byte-for-byte. |
| `PaneTips` | TipKit constructs stored parameter IDs from the enclosing type name. For example, `Bool.PaneTips+calm` must stay. The module name does not appear in that ID. `TipsTests` checks representative IDs. |
| `PaneSupabaseURL`, `PaneSupabaseKey`, `PaneShareURL`, `PaneMCPURL`, `PaneAuthHost`, `PaneURLScheme`, `PaneBundleID`, `PaneAppGroup`, `PaneAccent`, `PanePostHogKey`, `PanePostHogHost` | Build-time Info.plist contract, existing config and scripts that inspect archives. Values, including feeds, remain unchanged. |
| `ambernotes`, `ambernotes-beta`, `ambernotes.app`, its subdomains, staging/deployment hostnames and email addresses | URL schemes, associated domains, OAuth redirects, server endpoints, update feeds and old public links. Their case-insensitive URL tests also keep mixed-case old names. |
| `amber-notes` plugin/marketplace/server IDs and `AmberNotes` Homebrew formula | Existing plugin installs, client configuration, CLI installs and published package identities. The CLI command and release binaries remain `amber`, with the existing keychain services and `~/.config/amber` storage. |
| `AMBER_*`, `PANE_*`, `TEST_RUNNER_AMBER_*`, `TEST_RUNNER_PANE_*` | Existing environment, secret, build-setting and test switches. No new spelling replaces a deployed setting. Beta's target-dependent entitlement lookup uses the renamed target names. |
| `pane_*`, `pane.*`, `x-amber-client`, `x-amber-region`, `amber://` MCP resource URIs, MCP server/tool names | Database tables/functions/policies, HTTP and MCP contracts, internal notifications and attributed-text keys. Supabase function names and routes are unchanged. |
| `pane-file:`, `pane-note:`, `pane-table:`, token/encryption format names and `Amber Notes locked notes` | Serialized note markup and encryption/password verifier inputs. Existing notes and keys must continue to decode and unlock. |
| `amber.*`, `window.amber`, `amberApp`, `amberReady` and related bridge messages, `amber-app:`, `amber-lib:`, `amber`, `amber-ui`, `amber-router`, `amber.ts`, `amber.module.js`, `amber-router.module.js`, `amber-base.css`, `amber-ui.json`, `--amber-*`, `amber:*`, CSS layers and opt-out metadata | Saved note apps use these APIs, import names, resource filenames, event names and data formats. The repository's UI source folder is `pinto-ui`; the kit still serves the old public names. Server implementation modules are `pinto-base.ts` and `pinto-ui.ts`. |
| `Palette.amber`, `Color.amberInk`, `.amberProminent`, `AmberProminentButtonStyle`, `amberFaded`, `--amber` and other accent names | The colour amber, including documentation and contrast tests. These are not product branding. `paneAccent`, `paneFill` and `panePanel` strings remain as existing colour-cache keys. |
| `Amber Notes.app`, legacy download filenames/redirects, legacy client string `Amber Notes` | Bundle migration, old download URLs and the mapping from old revision authors to the current product name. Their regression fixtures keep the old names. |
| `formerly Amber Notes`, old-name landing/search/structured-data text, rename history and legal notices | Search discovery and accurate explanations of the rename. Plugin, marketplace, `server.json`, Gemini and README descriptions retain the requested old-name references. OldNameTests, OAuth impersonation checks, email checks and database-rename tests must still detect the old spelling. |
| Published blog/changelog text and public screenshot/video filenames | Historical text and existing public asset URLs remain. Template source comments and their generated copies use Pinto Notes; templates are not historical blog/changelog entries. |
| `AmberNotes-install`, `AmberNotes-devapp`, `AmberNotes.xcarchive`, beta DMG names, `amber-render`, external `amber-*` project/report directories and existing command protocols | Existing development/release worktrees, archive consumers, service identities and external tooling. Renaming them is unnecessary for the source/module rename and could strand existing integrations or artifacts. |
| `Pane`, `Pane.xcodeproj`, `PaneTextView`, `AmberNotesDirect` in the release-gate layout fallback | The gate can still build a historical commit for comparisons. It chooses that commit's project, scheme and editor type, including the intermediate scheme rename. Security scans cover both layouts. |
| Old `PaneTests` paths in `.gitleaksignore` | Fingerprints refer to fixed historical commits, whose paths cannot be renamed. |
| Ordinary words such as pane/panel and third-party names | UI terminology and vendored dependencies are not old product names. |

The generated Info metadata and all nine entitlement files were compared with the original values.
Only the exported drag item's human-readable description changes to Pinto Notes. The app and
extension bundle IDs, URL schemes, app groups, update settings and entitlement values stay the same.

`python3 scripts/rename-storage.test.py` builds two command-line fixtures from the app's actual stored
model declarations. A new temporary store is written with module Pane, opened and edited with
PintoNotes, then opened with Pane again. It checks notes, folder relationships and attachment metadata.
It never opens an installed app's library or connects to a backend.

Validation also includes XcodeGen regeneration, Swift syntax parsing, the iPhone-change detector and
test selector, 71 local Deno tests, all 719 passing web tests with one skipped, and TypeScript checking.
`PREPUSH_IPHONE=1 scripts/prepush.sh --tests` refused to start with exit code 1 because only 11 GB was
free and it requires 20 GB. The Mac/iPhone build and Swift test run still need that check on a machine
with enough free space. No files were deleted to make room, no app was launched, and no windows or
synthetic input events were created.
