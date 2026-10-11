#!/bin/zsh
# Before you push app code: does it compile the way it ships, and the way CI builds it?
#
#   scripts/prepush.sh            the three compiles below, side by side (about 2 minutes after an
#                                 edit to the app, 20 s when nothing changed, 3 the first time)
#   scripts/prepush.sh --tests    and then the suites of the test files this branch touches
#
# 1. PaneDirect, Release: the Mac download.          2. The iPhone app, Release.
# 3. The app and its tests, Debug: what CI builds.   All with code signing off.
#
# Release and Debug are both here because they fail differently: on 2026-10-10 CI was green and
# the Release build did not compile (a data-race error only the optimizer's mode reports), and
# two of that day's red CI runs were plain compile errors in the test build.
#
# Headless: nothing is launched by the compiles. --tests starts the test host (no window, no Dock
# icon), so use it where tests may run (CI, the Air); on a Mac someone is working at, the compiles
# alone are the check.
#
# The three compiles run side by side. The Swift packages are compiled once for every checkout
# and worktree (a cache by content in ~/Library/Caches/pinto-prepush, trimmed to 6 GB); the app
# itself is compiled again whenever one of its files changed, in Release as a whole, which is
# most of the time this takes. No build folder is left behind.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -n ${DEVELOPER_DIR:-} ]] || export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
CACHE=${PINTO_PREPUSH_CACHE:-$HOME/Library/Caches/pinto-prepush}
# The same build folder path every time for this checkout: the compiler's cache only hits when
# the path is the same. It is emptied when the check ends.
DD="$CACHE/build-$(print -n -- "$PWD" | shasum | cut -c1-12)"
rm -rf "$DD"
trap 'rm -rf "$DD"' EXIT
mkdir -p "$CACHE/cas" "$CACHE/packages" "$DD"
common=(-project Pane.xcodeproj -clonedSourcePackagesDirPath "$CACHE/packages" CODE_SIGNING_ALLOWED=NO CODE_SIGN_IDENTITY= COMPILATION_CACHE_ENABLE_CACHING=YES "COMPILATION_CACHE_CAS_PATH=$CACHE/cas")
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
    grep -E "error:|\*\* .* FAILED" "$DD/$name.log" | sort -u | head -30
    return 1
  fi
}
compile mac "Mac download, Release (PaneDirect)" build -scheme AmberNotesDirect "${release[@]}" -destination 'generic/platform=macOS' -derivedDataPath "$DD/mac" &
pids=($!)
compile ios "iPhone app, Release" build -scheme Pane "${release[@]}" -destination 'generic/platform=iOS' -derivedDataPath "$DD/ios" &
pids+=($!)
compile tests "App and tests, Debug (as CI)" build-for-testing -scheme Pane -destination 'platform=macOS' -derivedDataPath "$DD/tests" ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO &
pids+=($!)
failed=0
for pid in $pids; do wait $pid || failed=1; done
(( failed == 0 )) || { print -- "Not ready to push: fix the errors above."; exit 1; }

if [[ ${1:-} == --tests ]]; then
  # The suites declared in the test files this branch changed (against origin/dev, and not yet committed).
  base=$(git merge-base HEAD origin/dev 2>/dev/null || echo HEAD)
  only=()
  for f in $( { git diff --name-only "$base"; git diff --name-only; } | sort -u | grep -E '^PaneTests/.*\.swift$' || true); do
    [[ -f $f ]] || continue
    for suite in $(grep -oE '^(@[A-Za-z]+(\([^)]*\))? +)*(final +)?(struct|class) +[A-Za-z0-9_]+' "$f" | awk '{print $NF}'); do only+=("-only-testing:PaneTests/$suite"); done
  done
  if (( ${#only} )); then
    compile run "Tests of the touched test files (${#only} suites)" test-without-building -scheme Pane -destination 'platform=macOS' -derivedDataPath "$DD/tests" "${only[@]}" ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO
  else
    print -- "→ No test file touched: no tests run."
  fi
fi

# The cache stays under 6 GB: the files not read for longest go first.
if (( $(du -sk "$CACHE/cas" | cut -f1) > 6 * 1024 * 1024 )); then
  find "$CACHE/cas" -type f -atime +3 -delete 2>/dev/null || true
fi
print -- "✓ Compiles as it ships and as CI builds it: $((SECONDS - start)) s"
