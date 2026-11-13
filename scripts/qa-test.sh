#!/bin/zsh
# Runs Mac unit tests in the QA derived data, with a hard time limit per run.
#   scripts/qa-test.sh [PaneTests/SuiteName[/testName] ...]
#   scripts/qa-test.sh --smoke     the tests CI runs for every change (smoke-tests.txt, always-tests.txt), a first check
#   scripts/qa-test.sh             every unit and interaction test: 20 to 30 minutes
#   scripts/qa-test.sh --summarize LOG   what a run prints, from its log (scripts/qa-test.test.ts)
#   scripts/qa-test.sh --only NAME ...   the -only-testing arguments a run with these names makes
# The tests are four targets (PaneTests, PaneInteractionTests, PaneHIGTests, PaneSystemTests; see
# project.yml). A name is given the old way, PaneTests/Suite[/test()], and runs in the target that
# holds the suite now (scripts/ci/select-tests.py --map); Target/Suite works too.
# The test host runs without a window or Dock icon (see PaneApp.isUnitTestHost).
set -uo pipefail
cd "$(dirname "$0")/.."

# What went wrong, capped; then the two result lines, always. Logged lines with a timestamp (WebKit's
# "Connection to 'pboard' server had an error:" and the like) are left out before anything is matched,
# and so are the lines they continue on, so a passing run prints only its result.
summarize() {
  local summary="Test run with|TEST (SUCC|FAIL)" log
  log=$(grep -v "^20[0-9][0-9]-" "$1")
  # Why: compile errors, then each failed expectation with its file:line and the values it saw (the
  # lines under it that start "↳", less the test's own doc comment).
  print -r -- "$log" | grep -A2 -E "(^|: )error: " | grep -vE "^--$|^\s+\"XPC|^}$|^Invalidation reason" | head -20
  print -r -- "$log" | grep -A3 "recorded an issue" | grep -E "recorded an issue|^↳ " | grep -v "^↳ ///" | head -${LINES_OUT:-40}
  # Which: every test that failed, one line each; then anything slow or stuck.
  print -r -- "$log" | grep -E "✘ Test .* failed after" | grep -v "Test run with" | head -30
  print -r -- "$log" | grep -E "PERF|timeout" | grep -vE "$summary|^\s*export " | head -10
  print -r -- "$log" | grep -E "$summary" | tail -2
}
# One line that says how the run went, printed first and last, so a `| head`, `| tail` or a grep for
# TEST, passed, failed or error never hides it: 345 runs in two weeks to 2026-11-12 lost their result
# that way and were often run again. A run where no test ran is a failure: a name that matches no
# test is not an error to xcodebuild, and 32 such runs looked green while testing nothing.
verdict() {  # log, exit code; prints the line and returns the run's real exit code
  local log=$1 code=$2 ran failed
  ran=$(grep -oE "Test run with [0-9]+ tests?" "$log" | grep -oE "[0-9]+" | awk '{s+=$1} END {print s+0}')
  ran=$(( ran + $(grep -oE "Executed [0-9]+ tests?" "$log" | grep -oE "[0-9]+" | awk '{s+=$1} END {print s+0}') ))
  failed=$(grep -E "✘ Test .* failed after" "$log" | grep -vc "Test run with")
  if grep -q "^TIMEOUT after" "$log"; then
    print -- "RESULT: TEST FAILED, timed out (LIMIT=<seconds> waits longer)"; return 1
  elif (( code == 0 && ran == 0 )); then
    print -- "RESULT: TEST FAILED, no test ran: the names given matched nothing (name a suite with arguments without its test)"; return 1
  elif (( code == 0 )); then
    print -- "RESULT: TEST PASSED, $ran tests passed"; return 0
  elif (( ran == 0 )) && grep -qE "(^|: )error: " "$log"; then
    print -- "RESULT: BUILD FAILED, error: the compile errors are above"; return $code
  else
    print -- "RESULT: TEST FAILED, $failed of $ran tests failed"; return $code
  fi
}
if [[ ${1:-} == --summarize ]]; then summarize "$2"; exit 0; fi
if [[ ${1:-} == --verdict ]]; then verdict "$2" "$3"; exit $?; fi
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
only=()
[[ ${1:-} == --only ]] && { dry=1; shift; }
if [[ ${1:-} == --smoke ]]; then
  shift
  # As CI names them (a suite nested in another, such as NetworkFaults, needs its full path).
  only=(${(f)"$(python3 scripts/ci/select-tests.py /dev/null 2>/dev/null | grep '^-only-testing:')"})
fi
# Each name in the target that holds its suite. A name that matches no suite is passed as it is:
# nothing runs, and the run fails with "no test ran".
(( $# )) && for t in ${(f)"$(python3 scripts/ci/select-tests.py --map "$@")"}; do only+=(-only-testing:$t); done
# The whole suite gets the time it needs; a named run keeps the short limit, so a hang shows quickly.
if [[ ${#only[@]} -eq 0 ]]; then
  for t in ${(f)"$(python3 scripts/ci/select-tests.py --map PaneTests)"}; do only+=(-only-testing:$t); done
  LIMIT=${LIMIT:-2400}
fi
# A whole test target (a name with no suite) also gets the long limit.
for t in $only; do [[ $t != */* ]] && LIMIT=${LIMIT:-2400}; done
if [[ -n ${dry:-} ]]; then print -l -- $only; exit 0; fi
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
  echo "TIMEOUT after ${LIMIT}s (LIMIT=<seconds> waits longer)"; timedout=1
  # Only this run's own host app and xcodebuild.
  for h in $(pgrep -f "$PWD/$DD/Build/Products/$CONFIG/Pane.app/Contents/MacOS/Pane"); do kill $h; done
  kill $pid 2>/dev/null
fi
wait $pid 2>/dev/null; code=$?
[[ -n ${timedout:-} ]] && print "TIMEOUT after ${LIMIT}s" >> "$log"
line=$(verdict "$log" $code); code=$?
print -- "$line"
summarize "$log"
cp "$log" $DD/last-test.log; rm -f "$log"
echo "Full log: $DD/last-test.log"
print -- "$line"
exit $code
