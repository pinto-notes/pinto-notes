#!/bin/zsh
# The iPhone pictures of the website's plain-note template pages: PaneHIGTests/TemplatePageShots on a
# headless simulator of its own (never Simulator.app), made for the run and deleted after it.
#   node web/scripts/template-page-shots.mjs manifest <dir>
#   scripts/template-page-shots-iphone.sh <dir>
# ONLY=slug,slug draws only those templates. BUILD=0 reuses the build in build/dd-iphone.
# An iPhone 17e: its screen is 390 by 844 points, the size the pages' phone frame is drawn at.
set -euo pipefail
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
OUT=${1:?the folder with manifest.json}
[[ $OUT = /* ]] || OUT=$PWD/$OUT
[[ -f $OUT/manifest.json ]] || { echo "no $OUT/manifest.json: run web/scripts/template-page-shots.mjs manifest first"; exit 1; }
DD=build/dd-iphone
LOG=$OUT/iphone-test.log

if [[ ${BUILD:-1} != 0 ]]; then
  if ! nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -configuration Debug -destination 'generic/platform=iOS Simulator' \
      -derivedDataPath $DD ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO build-for-testing > "$OUT/iphone-build.log" 2>&1; then
    grep -E "error:" "$OUT/iphone-build.log" | sort -u | head -20
    echo "BUILD FAILED"; exit 1
  fi
fi

SIM=$(xcrun simctl create "Pinto template page shots" com.apple.CoreSimulator.SimDeviceType.iPhone-17e)
trap 'xcrun simctl shutdown "$SIM" 2>/dev/null || true; xcrun simctl delete "$SIM" 2>/dev/null || true' EXIT
xcrun simctl boot "$SIM"
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl spawn "$SIM" defaults write -g AppleLocale en_US
xcrun simctl spawn "$SIM" defaults write -g AppleLanguages -array en-US
xcrun simctl ui "$SIM" appearance light

run=$(ls -t $DD/Build/Products/*iphonesimulator*.xctestrun | head -1)
code=0
TEST_RUNNER_TEMPLATE_PAGE_SHOTS="$OUT" TEST_RUNNER_TEMPLATE_PAGE_SHOTS_ONLY="${ONLY:-}" \
  nice -n 10 xcodebuild test-without-building -xctestrun "$run" -destination "id=$SIM" \
  -only-testing:PaneHIGTests/TemplatePageShots > "$LOG" 2>&1 || code=$?
grep -E "recorded an issue|Test run with|TEST (SUCC|FAIL)" "$LOG" | tail -8
echo "Full log: $LOG"
exit $code
