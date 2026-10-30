#!/bin/zsh
# Builds what a stranger gets from GitHub: a clone of this commit with no secrets, no
# Config/*.local.xcconfig and no Apple team, built with plain xcodebuild (no signing flags), as
# docs/MAKE-IT-YOURS.md tells people to. The nightly CI job runs it; it also runs on a Mac.
#
#   scripts/ci/fresh-clone-build.sh            the Mac app and the iPhone app for the Simulator
#   scripts/ci/fresh-clone-build.sh mac        one of them: the Mac app through scripts/setup.sh --local-only,
#   scripts/ci/fresh-clone-build.sh simulator  the guide's path with no Docker; the Simulator with plain xcodebuild
#
# The "clone" is the committed tree (git archive of HEAD), so uncommitted changes and gitignored
# files never reach it. It goes in a temporary folder and is deleted at the end.
# The Simulator build goes through scripts/make-it-yours.sh with someone else's bundle id, and
# scripts/deploy-backend.sh --dry-run checks its arguments and steps.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
WHAT=${1:-all}
# The selected Xcode (CI picks the newest), or Xcode.app when only the Command Line Tools are selected.
[[ -n ${DEVELOPER_DIR:-} || $(xcode-select -p) == */Xcode*.app/* ]] || export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
SRC=$TMP/clone

mkdir -p "$SRC"
git -C "$ROOT" archive HEAD | tar -x -C "$SRC"
cd "$SRC"
for f in Config/Backend.local.xcconfig Config/Identity.local.xcconfig .env .secrets; do
  [[ ! -e $f ]] || { echo "error: a fresh clone has $f; it must stay out of git" >&2; exit 1; }
done

scripts/deploy-backend.sh abcdefghijklmnopqrst --site https://notes.example.org --dry-run >/dev/null

build() {  # build NAME DESTINATION [settings…]
  local name=$1 dest=$2; shift 2
  local log=$TMP/$name.log start=$SECONDS
  if xcodebuild -project Pane.xcodeproj -scheme Pane -destination "$dest" -derivedDataPath "$TMP/dd-$name" "$@" build >"$log" 2>&1; then
    echo "✔ $name built from a fresh clone in $(( SECONDS - start ))s"
  else
    grep -E "error:" "$log" | sort -u | head -20
    echo "✘ $name didn't build from a fresh clone (no secrets, no team)" >&2
    return 1
  fi
}
failed=0
if [[ $WHAT == all || $WHAT == mac ]]; then
  start=$SECONDS
  if scripts/setup.sh --local-only > "$TMP/setup.log" 2>&1; then
    echo "✔ scripts/setup.sh --local-only built the Mac app from a fresh clone in $(( SECONDS - start ))s"
  else
    cat "$TMP/setup.log"; echo "✘ scripts/setup.sh --local-only failed on a fresh clone" >&2; failed=1
  fi
  app=build/app/Build/Products/Debug/Pane.app
  if [[ -d $app ]]; then
    [[ $(codesign -dv "$app" 2>&1) == *Signature=adhoc* ]] || { echo "✘ the Mac app isn't ad-hoc signed" >&2; failed=1; }
    plist=$app/Contents/Info.plist
    id=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$plist")
    [[ $id == local.*.notes ]] || { echo "✘ setup.sh didn't give the app a bundle id of its own ($id)" >&2; failed=1; }
    url=$(/usr/libexec/PlistBuddy -c "Print :PaneSupabaseURL" "$plist" 2>/dev/null)
    [[ -z $url ]] || { echo "✘ the --local-only app still has a backend ($url)" >&2; failed=1; }
  fi
fi
if [[ $WHAT == all || $WHAT == simulator ]]; then
  rm -f Config/Backend.local.xcconfig
  scripts/make-it-yours.sh --name "Fresh Clone Notes" --bundle-id org.example.freshnotes >/dev/null
  # One architecture: the check is that it compiles and signs, not that it runs on an Intel Mac.
  build simulator 'generic/platform=iOS Simulator' ARCHS=arm64 ONLY_ACTIVE_ARCH=NO || failed=1
  id=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$TMP/dd-simulator/Build/Products/Debug-iphonesimulator/Pane.app/Info.plist" 2>/dev/null)
  [[ $id == org.example.freshnotes ]] || { echo "✘ make-it-yours.sh's bundle id didn't reach the app (${id:-no app})" >&2; failed=1; }
fi
exit $failed
