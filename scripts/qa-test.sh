#!/bin/zsh
# Runs Mac unit tests in the QA derived data, with a hard time limit per run.
#   scripts/qa-test.sh [PaneTests/SuiteName[/testName] ...]
#   scripts/qa-test.sh --smoke     the tests CI runs for every change (smoke-tests.txt, always-tests.txt), a first check
#   scripts/qa-test.sh             every unit and interaction test: 20 to 30 minutes
# The test host runs without a window or Dock icon (see PaneApp.isUnitTestHost).
set -uo pipefail
cd "$(dirname "$0")/.."
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
wait $pid 2>/dev/null
grep -A2 -E "PERF|error:|✘|✔ Test run|Test run with|TEST (SUCC|FAIL)|passed after|timeout" "$log" | grep -v "^20[0-9][0-9]-" | grep -vE "✔ (Suite|Test [a-zA-Z]+\(\) passed)" | head -${LINES_OUT:-40}
cp "$log" $DD/last-test.log; rm -f "$log"
