#!/bin/bash
# The end of a test step's pipe:  xcodebuild test-without-building ... | scripts/ci/show-tests.sh build/ci-test.log
#
# Keeps everything in the file and prints what a person reads: the test results, the PERF lines and
# real errors. The test host's own log lines are left out (dated lines from Pane[pid:thread]: linkd,
# pboard, link previews); thousands of them say "error:" and the failing test was lost among them
# on 2026-10-11. Each failed expectation is also raised as an error on the run's page.
# Decides nothing: whether the tests passed is xcodebuild's own exit status, which the step gets
# through `set -o pipefail`. A line in this output is not proof of anything: the test host writes
# into the same stream, and on 2026-10-11 it cut "Test run with 6 tests" in two (#488).
log=$1
tee "$log" \
  | grep --line-buffered -vE '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9:.]+[+-][0-9]{4} [^ ]+\[[0-9]+:[0-9]+\] ' \
  | grep --line-buffered -E '✔ Test run|✘|error:|PERF|\*\* TEST' || true
if grep -q '✘' "$log"; then
  echo
  echo "What failed:"
  grep -E '^✘ ' "$log" | grep -vE '^✘ (Suite|Test run) ' | cut -c1-600
  grep -E '^✘ Test .* recorded an issue' "$log" | head -10 | cut -c1-600 | sed 's/^✘ /::error title=A test failed::/'
fi
exit 0
