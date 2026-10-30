#!/bin/zsh
# Runs Mac unit tests in the QA derived data, with a hard time limit per run.
#   scripts/qa-test.sh [PaneTests/SuiteName[/testName] ...]
#   scripts/qa-test.sh --smoke     the tests CI runs for every change (smoke-tests.txt, always-tests.txt), a first check
#   scripts/qa-test.sh             every unit and interaction test: 20 to 30 minutes
#   scripts/qa-test.sh --summarize LOG   what a run prints, from its log (scripts/qa-test.test.ts)
# The test host runs without a window or Dock icon (see PaneApp.isUnitTestHost).
set -uo pipefail
cd "$(dirname "$0")/.."

# What went wrong, capped; then the two result lines, always. Logged lines with a timestamp (WebKit's
# "Connection to 'pboard' server had an error:" and the like) are left out before anything is matched,
# and so are the lines they continue on, so a passing run prints only its result.
summarize() {
  local summary="Test run with|TEST (SUCC|FAIL)"
  grep -v "^20[0-9][0-9]-" "$1" | grep -A2 -E "PERF|(^|: )error: |✘|timeout" \
    | grep -vE "^--$|^\s*export |^◇ |✔ (Suite|Test )|^Test (Suite|Case) |$summary|^\s+\"XPC|^}$|^Invalidation reason" \
    | head -${LINES_OUT:-40}
  grep -v "^20[0-9][0-9]-" "$1" | grep -E "$summary" | tail -2
}
if [[ ${1:-} == --summarize ]]; then summarize "$2"; exit 0; fi
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
only=()
if [[ ${1:-} == --smoke ]]; then
  shift
  # As CI names them (a suite nested in another, such as NetworkFaults, needs its full path).
  only=(${(f)"$(python3 scripts/ci/select-tests.py /dev/null 2>/dev/null | grep '^-only-testing:')"})
fi
for t in "$@"; do only+=(-only-testing:$t); done
# The whole suite gets the time it needs; a named run keeps the short limit, so a hang shows quickly.
[[ ${#only[@]} -eq 0 ]] && { only=(-only-testing:PaneTests); LIMIT=${LIMIT:-2400}; }
LIMIT=${LIMIT:-240}
DD=${DD:-build/ddqa}
log=$(mktemp)
CONFIG=${CONFIG:-Debug}
# CONFIG=Release measures optimised code (what people run); testability keeps @testable working.
# scripts/setup.sh builds the app with these same settings into build/ddqa, so a test run after it reuses that build.
xcodebuild -project Pane.xcodeproj -scheme Pane -configuration $CONFIG -destination 'platform=macOS' -derivedDataPath $DD \
  ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO ONLY_ACTIVE_ARCH=YES SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) QA' \
  CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER= \
  test "${only[@]}" >"$log" 2>&1 &
pid=$!
for i in $(seq 1 $LIMIT); do kill -0 $pid 2>/dev/null || break; sleep 1; done
if kill -0 $pid 2>/dev/null; then
  echo "TIMEOUT after ${LIMIT}s (LIMIT=<seconds> waits longer)"
  # Only this run's own host app and xcodebuild.
  for h in $(pgrep -f "$PWD/$DD/Build/Products/$CONFIG/Pane.app/Contents/MacOS/Pane"); do kill $h; done
  kill $pid 2>/dev/null
fi
wait $pid 2>/dev/null; code=$?
summarize "$log"
cp "$log" $DD/last-test.log; rm -f "$log"
echo "Full log: $DD/last-test.log"
exit $code
