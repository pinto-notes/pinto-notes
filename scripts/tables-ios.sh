#!/bin/zsh
# Tables on iPhone: plays TableEditingUITests on its own simulator (no Simulator window), one
# recording per test.   scripts/tables-ios.sh [out dir]   TESTS="testWalkthrough" APPEARANCE=dark BUILD=0
# Output: <out>/<test>-<appearance>.mp4, the screenshots the test takes, and logs.
set -e
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
OUT="${1:-$PWD/.shots/tables}"
mkdir -p "$OUT"
NOTE="${NOTE:-$OUT/note.md}"
NAME="Pinto tables"
SIM=$(xcrun simctl list devices available | grep "$NAME (" | head -1 | grep -oE '[0-9A-F-]{36}' || true)
[[ -z "$SIM" ]] && SIM=$(xcrun simctl create "$NAME" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro)
xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl status_bar "$SIM" override --time "9:41" --batteryLevel 100 --cellularBars 4 --wifiBars 3 2>/dev/null || true
xcrun simctl ui "$SIM" appearance "${APPEARANCE:-light}"
xcrun simctl spawn "$SIM" defaults write com.apple.keyboard.preferences DidShowContinuousPathIntroduction -bool true
xcrun simctl spawn "$SIM" defaults write com.apple.Preferences DidShowContinuousPathIntroduction -bool true

if [[ "${BUILD:-1}" == 1 ]]; then
  xcodegen generate >/dev/null
  if ! nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath build/dd \
    CODE_SIGNING_ALLOWED=NO build-for-testing > "$OUT/build.log" 2>&1; then
    grep -E "error:" "$OUT/build.log" | sort -u | head -20
    echo "BUILD FAILED"; exit 1
  fi
fi

for t in ${=TESTS:-testWalkthrough}; do
  xcrun simctl io "$SIM" recordVideo --codec h264 --force "$OUT/$t${LINES:+-$LINES}-${APPEARANCE:-light}.mp4" 2>/dev/null &
  REC=$!
  sleep 1.5
  TEST_RUNNER_PANE_SHOTS="$OUT/${APPEARANCE:-light}" TEST_RUNNER_TABLE_NOTE="$NOTE" TEST_RUNNER_TABLE_LINES="${LINES:-}" \
    nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO test-without-building \
    -only-testing:"PaneUITests/TableEditingUITests/$t" > "$OUT/$t.log" 2>&1 || true
  kill -INT $REC; wait $REC 2>/dev/null || true
  grep -E "(passed|failed) \(|error:" "$OUT/$t.log" | head -5
done
[[ "${KEEP:-0}" == 1 ]] || xcrun simctl shutdown "$SIM"
