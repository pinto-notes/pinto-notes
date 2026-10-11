#!/bin/bash
# The end of a test step's pipe:  xcodebuild test-without-building ... | scripts/ci/show-tests.sh build/ci-test.log
#
# Keeps everything in the file and prints what a person reads: the test results, the PERF lines and
# real errors. The test host's own log lines are left out (dated lines from Pane[pid:thread]: linkd,
# pboard, link previews); thousands of them say "error:" and the failing test was lost among them
# on 2026-10-11. Each failed expectation is also raised as an error on the run's page.
# Exits 0 only when xcodebuild said the tests succeeded.
log=$1
tee "$log" \
  | grep --line-buffered -vE '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9:.]+[+-][0-9]{4} [^ ]+\[[0-9]+:[0-9]+\] ' \
  | grep --line-buffered -E '✔ Test run|✘|error:|PERF|NoteListView: |\*\* TEST' || true
if grep -q '✘' "$log"; then
  echo
  echo "What failed:"
  grep -E '^✘ ' "$log" | grep -vE '^✘ (Suite|Test run) ' | cut -c1-600
  grep -E '^✘ Test .* recorded an issue' "$log" | head -10 | cut -c1-600 | sed 's/^✘ /::error title=A test failed::/'
fi
grep -qE '\*\* TEST (EXECUTE )?SUCCEEDED \*\*' "$log"
