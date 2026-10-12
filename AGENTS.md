# Working on Pinto Notes

Rules for coding agents (and people) changing this repo. The README explains the architecture and how to build and test.

- **Apple Notes is the behaviour reference.** Copy what Notes does for editing, lists, checklists, tables, selection and navigation. Follow Apple's Human Interface Guidelines for layout, type, colour, controls and accessibility, in light and dark mode.
- **Every fix gets a regression test.** Editor and UI behaviour goes in the offscreen harness under `PaneTests/Harness` and `PaneTests/Interaction`; run `scripts/qa-test.sh`. Server changes get Deno tests; end-to-end tests run against the local stack only (`supabase start`, then `scripts/mcp-e2e.sh`).
- **Before pushing app code, run `scripts/prepush.sh --tests`.** It compiles what ships (the Mac download and the iPhone app, Release) and what CI builds (the app and its tests, Debug), side by side and headless, then runs the suites of the test files you touched in the test host (no window, no Dock icon). Without `--tests` it only compiles: about 2 minutes after an edit. A push that doesn't compile costs a CI run and everyone waiting behind it.
- **Open pull requests as drafts, into `dev`, and mark them ready when the work is done.** A draft runs no Mac job in CI. Push once, then mark the pull request ready: that starts the one Mac job, which builds the app's tests and runs a selection of them (a smoke set and the suites near your change, about 5 minutes). A push to a ready pull request runs it again, so finish first. After the merge, one Mac job on `dev` runs every unit test and the timing and render-count tests; it reports what failed in its summary and never blocks.
- **Bugs, QA findings and parked work are tracked outside GitHub.** Don't open GitHub issues for them. GitHub issues are for outside contributors (the help wanted and good first issue ones) only.
- **Never post global input events** (synthetic clicks or keystrokes) on a developer's Mac, and never leave windows or Dock icons behind. Kill only processes you started, by exact PID.
- **No secrets, ever.** Don't commit or print keys, tokens or passwords. They live in `.env`, `.secrets/`, `Config/Backend.local.xcconfig` and GitHub Secrets.
- **Never test against production data.** Load, abuse and end-to-end tests run on the local stack.
- **Migrations are additive** with a timestamp newer than every existing one. Never set `[auth.email] enable_signup = false` in `supabase/config.toml`: it turns off email sign-in entirely.
- **Installing on a developer's devices:** `scripts/install-mac.sh` (team-signed; never copy an ad-hoc build over the installed app) and `scripts/install-phone.sh`.
- **Releases** are tag-based and run in GitHub Actions; see `docs/RELEASING.md`. Never submit an app for App Store review; that stays with the maintainer. Nothing ships (App Store, TestFlight to users, Mac release, production deploy) without a passing release gate report: the `amber-release-gate` skill.
- Write plainly in UI copy and docs: sentence case, short sentences, no hype.
