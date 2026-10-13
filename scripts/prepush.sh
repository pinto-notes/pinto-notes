#!/bin/zsh
# Before you push app code: does it compile the way it ships, and the way CI builds it?
#
#   scripts/prepush.sh            the app and its tests, Debug, as CI builds them (about 30 s after
#                                 an edit), plus the iPhone app and its tests when the change touches it
#   scripts/prepush.sh --tests    and then the suites of the test files this branch touches, the
#                                 smoke tests and the suites that check the whole app at once
#                                 (scripts/ci/smoke-tests.txt, scripts/ci/always-tests.txt)
#   PREPUSH_RELEASE=1             also the two Release compiles (the Mac download, the iPhone app)
#
# Debug by default because Release compiles the app as a whole module: about 130 s each after a
# one-line edit, against about 25 s for Debug (measured 2026-10-13). The Release compiles still run
# where they matter: scripts/release-mac.sh and scripts/testflight.sh build Release before anything
# ships, and stop on an error (on 2026-10-10 a data-race error showed only in Release).
#
# The iPhone app and its tests are compiled (Debug, for the simulator) only when the change touches
# what they are built from (Pane/ outside the Mac-only files, PaneShare/, PaneTests/, the project,
# Config/: scripts/ci/touches-iphone.py). On 2026-10-13 a test that used Process broke the iPhone
# test build and nothing caught it. PREPUSH_IPHONE=1 compiles them anyway.
#
# A tree that passed once is not compiled again: the check remembers the last tree it passed for
# (by git's hash of the files, with what isn't committed yet) and says so. --tests always runs.
#
# Headless: nothing is launched by the compiles. --tests starts the test host (no window, no Dock
# icon), so use it where tests may run (CI, the Air); on a Mac someone is working at, the compiles
# alone are the check.
#
# The compiles run side by side. The Swift packages are compiled once for every checkout
# and worktree (a cache by content in ~/Library/Caches/pinto-prepush, held to 8 GB by Xcode
# itself); the app is compiled again whenever one of its files changed. No build folder is left behind.
#
# One check at a time on a machine: a second one waits and says for whom. It does not start with
# less than 20 GB free on the disk.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -n ${DEVELOPER_DIR:-} ]] || export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
CACHE=${PINTO_PREPUSH_CACHE:-$HOME/Library/Caches/pinto-prepush}
CAP_GB=8
mkdir -p "$CACHE"

# One at a time: three of these side by side are nine compiles, and they share the cache below.
LOCK="$CACHE/running"
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  holder=$(cat "$LOCK/pid" 2>/dev/null || true)
  if [[ -n $holder ]] && ! kill -0 "$holder" 2>/dev/null; then rm -rf "$LOCK"; continue; fi   # it died without tidying up
  if [[ -z $holder ]] && (( waited >= 30 )); then rm -rf "$LOCK"; continue; fi
  (( waited % 60 )) || print -- "→ Waiting for the local check of pid ${holder:-?} ($(cat "$LOCK/where" 2>/dev/null || print '?')), $waited s so far"
  sleep 5; waited=$((waited + 5))
done
print -- $$ > "$LOCK/pid"; print -- "$PWD" > "$LOCK/where"
# The same build folder path every time for this checkout: the compiler's cache only hits when
# the path is the same. It is emptied when the check ends.
DD="$CACHE/build-$(print -n -- "$PWD" | shasum | cut -c1-12)"
trap 'rm -rf "$DD" "$LOCK"' EXIT
rm -rf "$DD"

# The cache is Xcode's (index and data files plus loose large objects), and Xcode holds it to
# its limit by itself (COMPILATION_CACHE_LIMIT_SIZE below). Never delete single files in it: on
# 2026-10-11, after files were removed by age, the next build's ValidateCAS step said "recovered
# from invalid data" and started the cache from nothing. Should it still be far over the limit
# (a build that was killed, an Xcode that ignores the setting), it is removed whole, here, where
# no other check is running: a cold cache costs about a minute, a full disk costs the day.
if [[ -d $CACHE/cas ]] && (( $(du -sk "$CACHE/cas" | cut -f1) > CAP_GB * 3 / 2 * 1024 * 1024 )); then
  print -- "→ The compile cache is $(du -sh "$CACHE/cas" | cut -f1), over its $CAP_GB GB: starting it again from nothing."
  rm -rf "$CACHE/cas"
fi
# Build folders a killed check left behind (two hours old: a checkout that still has this script
# without the lock may be building right now).
find "$CACHE" -maxdepth 1 -type d -name 'build-*' -mmin +120 -exec rm -rf {} + 2>/dev/null || true
free=$(df -g "$CACHE" | awk 'NR == 2 { print $4 }')
if (( free < 20 )); then
  print -- "✗ Not started: $free GB free on this disk, and the check wants 20 (its three build folders and the cache take about 15 while it runs). Free some space and run it again."
  exit 1
fi
mkdir -p "$CACHE/cas" "$CACHE/packages" "$DD"
common=(-project Pane.xcodeproj -clonedSourcePackagesDirPath "$CACHE/packages" CODE_SIGNING_ALLOWED=NO CODE_SIGN_IDENTITY= COMPILATION_CACHE_ENABLE_CACHING=YES "COMPILATION_CACHE_CAS_PATH=$CACHE/cas" "COMPILATION_CACHE_LIMIT_SIZE=${CAP_GB}G")
# One architecture and no dSYM: this checks that it compiles, it doesn't make the download.
release=(-configuration Release ONLY_ACTIVE_ARCH=YES DEBUG_INFORMATION_FORMAT=dwarf)
start=$SECONDS
command -v xcodegen >/dev/null && xcodegen generate >/dev/null
# Packages first, once, so the three compiles don't each fetch them.
xcodebuild -resolvePackageDependencies -project Pane.xcodeproj -clonedSourcePackagesDirPath "$CACHE/packages" > "$DD/resolve.log" 2>&1 || { tail -5 "$DD/resolve.log"; exit 1; }

compile() { # <name> <what> <xcodebuild arguments...>
  local name=$1 what=$2 t=$SECONDS; shift 2
  if nice -n 10 xcodebuild "$@" "${common[@]}" > "$DD/$name.log" 2>&1; then
    print -- "✓ $what: $((SECONDS - t)) s"
  else
    print -- "✗ $what FAILED after $((SECONDS - t)) s"
    # The errors in the code first. One error in a test file makes every @Test and @Suite in the
    # module report two more ("@const value should be initialized with a compile-time value",
    # from @__swiftmacro_ files): on 2026-10-11 500 of those hid the two real ones.
    local real fallout
    real=$(grep -E "error:" "$DD/$name.log" | grep -v '^@__swiftmacro_' | sort -u || true)
    fallout=$(grep -cE '^@__swiftmacro_.*error:' "$DD/$name.log" || true)
    if [[ -n $real ]]; then
      print -r -- "$real" | head -30
      (( fallout == 0 )) || print -- "  (and $fallout errors inside test macros, which follow from the ones above)"
    else
      grep -E "error:|\*\* .* FAILED" "$DD/$name.log" | sort -u | head -30
    fi
    return 1
  fi
}
# What this branch changes against dev, with what isn't committed yet.
base=$(git merge-base HEAD origin/dev 2>/dev/null || echo HEAD)
changed=(${(f)"$( { git diff --name-only "$base"; git diff --name-only; git ls-files --others --exclude-standard; } | sort -u )"})
# The tree this check is about: HEAD's files with the working tree's changes on top.
cp "$(git rev-parse --path-format=absolute --git-path index)" "$DD/index"
tree=$(GIT_INDEX_FILE="$DD/index" git add -A . >/dev/null 2>&1; GIT_INDEX_FILE="$DD/index" git write-tree)
PASSED="$CACHE/passed-$(print -n -- "$PWD" | shasum | cut -c1-12)"
if [[ ${1:-} != --tests && ${PREPUSH_IPHONE:-0} != 1 && ${PREPUSH_RELEASE:-0} != 1 && -f $PASSED && $(cat "$PASSED") == "$tree" ]]; then
  print -- "✓ This tree passed the check already ($tree): nothing to compile."
  exit 0
fi

pids=()
if [[ ${PREPUSH_RELEASE:-0} == 1 ]]; then
  compile mac "Mac download, Release (PaneDirect)" build -scheme AmberNotesDirect "${release[@]}" -destination 'generic/platform=macOS' -derivedDataPath "$DD/mac" &
  pids+=($!)
  compile ios "iPhone app, Release" build -scheme Pane "${release[@]}" -destination 'generic/platform=iOS' -derivedDataPath "$DD/ios" &
  pids+=($!)
fi
iphone=$(python3 scripts/ci/touches-iphone.py $changed)
if [[ ${PREPUSH_IPHONE:-0} == 1 || $iphone == yes* ]]; then
  compile iostests "iPhone app and tests, Debug (simulator)" build-for-testing -scheme Pane -destination 'generic/platform=iOS Simulator' -derivedDataPath "$DD/iostests" &
  pids+=($!)
else
  print -- "→ iPhone app not compiled: nothing it is built from changed (PREPUSH_IPHONE=1 compiles it anyway)"
fi
compile tests "App and tests, Debug (as CI)" build-for-testing -scheme Pane -destination 'platform=macOS' -derivedDataPath "$DD/tests" ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO &
pids+=($!)
failed=0
for pid in $pids; do wait $pid || failed=1; done
(( failed == 0 )) || { print -- "Not ready to push: fix the errors above."; exit 1; }

if [[ ${1:-} == --tests ]]; then
  # The suites declared in the test files this branch changed (against origin/dev, and not yet committed).
  only=(); touched=()
  # scripts/ci/select-tests.py knows which suites a test file holds and their full names: a suite
  # written inside "extension Outer {" is Outer/Suite to xcodebuild, and matches nothing without it.
  python3 scripts/ci/select-tests.py --suites-of ${(M)changed:#PaneTests/*.swift} | while IFS=$'\t' read -r f suites; do
    for suite in ${=suites}; do only+=("-only-testing:PaneTests/$suite"); done
    touched+=("$f:${(j:|:)${(@)${=suites}:t}}")
  done
  # Always: the smoke tests and the suites that check the whole app at once ("every primary button
  # is amber", "the telemetry page lists every value"). A change elsewhere breaks them without
  # touching their files: on 2026-10-13 two were red on dev all night.
  always=(${(f)"$(python3 scripts/ci/select-tests.py --always)"})
  only+=($always)
  if (( ${#only} )); then
    compile run "Tests of the touched test files, the smoke tests and the whole-app suites (${#only})" test-without-building -scheme Pane -destination 'platform=macOS' -derivedDataPath "$DD/tests" -resultBundlePath "$DD/run.xcresult" "${only[@]}" ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO
    # A name that matches no test is not an error to xcodebuild, so look: every touched test file
    # has to have had a test of a suite of its own run. Read from the result bundle, not from the
    # log: the test host writes into the same stream and cuts its lines in two.
    xcrun xcresulttool get test-results tests --path "$DD/run.xcresult" --compact | python3 -c '
import json, sys
def walk(node, suites):
    kids = node.get("children", [])
    if node.get("nodeType") == "Test Suite" and any(k.get("nodeType") == "Test Case" for k in kids):
        suites.add(node.get("name", "").replace(".", "/").split("/")[-1])
    for k in kids: walk(k, suites)
suites, cases = set(), 0
doc = json.load(sys.stdin)
for n in doc.get("testNodes", []): walk(n, suites)
print("\n".join(sorted(suites)))' > "$DD/ran.txt"
    for t in $touched; do
      if ! grep -qxE "(${t#*:})" "$DD/ran.txt"; then
        print -- "✗ No test of ${t%%:*} ran (asked for: ${${t#*:}//|/, }). Not ready to push."
        exit 1
      fi
    done
    print -- "  $(xcrun xcresulttool get test-results summary --path "$DD/run.xcresult" --compact | python3 -c 'import json, sys; d = json.load(sys.stdin); print(d["totalTestCount"], "tests ran,", d["failedTests"], "failed")')"
  else
    print -- "→ No test file touched: no tests run."
  fi
fi

print -r -- "$tree" > "$PASSED"
print -- "✓ Compiles as CI builds it$([[ ${PREPUSH_RELEASE:-0} == 1 ]] && print -n " and as it ships"): $((SECONDS - start)) s"
