#!/bin/zsh
# Builds what a stranger gets from GitHub: a clone of this commit with no secrets, no
# Config/*.local.xcconfig and no Apple team, built with plain xcodebuild (no signing flags), as
# docs/MAKE-IT-YOURS.md tells people to. The nightly CI job runs it; it also runs on a Mac.
#
#   scripts/ci/fresh-clone-build.sh            the Mac app and the iPhone app for the Simulator
#   scripts/ci/fresh-clone-build.sh mac        one of them
#   scripts/ci/fresh-clone-build.sh simulator
#
# The "clone" is the committed tree (git archive of HEAD), so uncommitted changes and gitignored
# files never reach it. It goes in a temporary folder and is deleted at the end.
# Each build also goes through scripts/make-it-yours.sh with someone else's bundle id, and
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

scripts/make-it-yours.sh --name "Fresh Clone Notes" --bundle-id org.example.freshnotes >/dev/null
scripts/deploy-backend.sh abcdefghijklmnopqrst --site https://notes.example.org --dry-run >/dev/null

build() {  # build NAME DESTINATION [settings…]
  local name=$1 dest=$2; shift 2
  local log=$TMP/$name.log start=$SECONDS
  if xcodebuild -project Pane.xcodeproj -scheme Pane -destination "$dest" -derivedDataPath "$TMP/dd-$name" \
       ${CLONED_PACKAGES:+-clonedSourcePackagesDirPath "$CLONED_PACKAGES"} "$@" build >"$log" 2>&1; then
    echo "✔ $name built from a fresh clone in $(( SECONDS - start ))s"
  else
    grep -E "error:" "$log" | sort -u | head -20
    echo "✘ $name didn't build from a fresh clone (no secrets, no team)" >&2
    return 1
  fi
}
status=0
if [[ $WHAT == all || $WHAT == mac ]]; then
  build mac 'platform=macOS' || status=1
  if [[ -d $TMP/dd-mac/Build/Products/Debug/Pane.app ]]; then
    codesign -dv "$TMP/dd-mac/Build/Products/Debug/Pane.app" 2>&1 | grep -q "Signature=adhoc" \
      || { echo "✘ the Mac app isn't ad-hoc signed" >&2; status=1; }
    id=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$TMP/dd-mac/Build/Products/Debug/Pane.app/Contents/Info.plist")
    [[ $id == org.example.freshnotes ]] || { echo "✘ make-it-yours.sh's bundle id didn't reach the app ($id)" >&2; status=1; }
  fi
fi
if [[ $WHAT == all || $WHAT == simulator ]]; then
  # One architecture: the check is that it compiles and signs, not that it runs on an Intel Mac.
  build simulator 'generic/platform=iOS Simulator' ARCHS=arm64 ONLY_ACTIVE_ARCH=NO || status=1
fi
exit $status
