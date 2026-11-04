#!/bin/zsh
set -uo pipefail
# Videos of the persona council changes on a headless iPhone simulator (never Simulator.app):
# PaneUITests/PersonaShowcaseRecordings, one clip per test, by simctl recordVideo.
#   scripts/persona-showcase-videos.sh <out dir>   (TESTS="test5WidgetTick" for one)
# The widget test needs a Home Screen without the widget: simctl erase the simulator first.
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
OUT=${1:?out dir}; mkdir -p "$OUT"
DD=build/dd-iphone
NAME="Pinto iPhone reach"
SIM=$(xcrun simctl list devices available | grep "$NAME (" | head -1 | grep -oE '[0-9A-F-]{36}' || true)
[[ -z "$SIM" ]] && SIM=$(xcrun simctl create "$NAME" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro)
xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl spawn "$SIM" defaults write com.apple.preferences.sounds keyboard -bool false 2>/dev/null || true
xcrun simctl spawn "$SIM" defaults write -g AppleLocale en_US
xcrun simctl spawn "$SIM" defaults write -g AppleLanguages -array en-US
xcrun simctl status_bar "$SIM" override --time "9:41" --batteryState discharging --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --operatorName "" 2>/dev/null || true
xcrun simctl ui "$SIM" appearance light
signing=(CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER=)
xcodegen generate >/dev/null
if ! nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath $DD "${signing[@]}" build-for-testing > $OUT/build.log 2>&1; then
  grep -E "error:" $OUT/build.log | sort -u | head; echo BUILD FAILED; exit 1; fi
for t in ${=TESTS:-test1ReviewSheet test2SearchGoesToTheLine test3ShareSheetSaved test4Connected}; do
  xcrun simctl io "$SIM" recordVideo --codec h264 --force "$OUT/$t.mp4" > /dev/null 2>&1 &
  REC=$!
  sleep 1
  nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath $DD "${signing[@]}" test-without-building -only-testing:PaneUITests/PersonaShowcaseRecordings/$t > $OUT/$t.log 2>&1
  kill -INT $REC; wait $REC 2>/dev/null
  echo "$t: $(grep -oE "Test Case .*(passed|failed)" $OUT/$t.log | tail -1)"
done
