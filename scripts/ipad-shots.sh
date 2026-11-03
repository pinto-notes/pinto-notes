#!/bin/zsh
# Screenshots of the iPhone app on iPad simulators, headless (no Simulator.app window).
#   scripts/ipad-shots.sh <out-dir> [device-name ...]
# Needs a build-for-testing in build/dd (Debug-iphonesimulator). Portrait comes from launches;
# landscape from PaneUITests/TabletShotsTests (simctl can't rotate), turned upright here.
# Devices default to the three iPad sizes: 13-inch Pro, 11-inch Air, mini.
set -euo pipefail
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
cd "$(dirname "$0")/.."
OUT=${1:?out dir}; shift || true
[[ $OUT = /* ]] || OUT=$PWD/$OUT
mkdir -p "$OUT"
APP=dev.emilwagman.pane
BUILD=build/dd/Build/Products/Debug-iphonesimulator/Pane.app
typeset -A TYPES=(
  pn-ipad-pro13 com.apple.CoreSimulator.SimDeviceType.iPad-Pro-13-inch-M5-12GB
  pn-ipad-air11 com.apple.CoreSimulator.SimDeviceType.iPad-Air-11-inch-M4
  pn-ipad-mini  com.apple.CoreSimulator.SimDeviceType.iPad-mini-A17-Pro
)
DEVICES=(${@:-pn-ipad-pro13 pn-ipad-air11 pn-ipad-mini})

udid() { # name: the simulator's udid, made if missing
  local id
  id=$(xcrun simctl list devices available | grep "    $1 (" | head -1 | grep -oE '[0-9A-F-]{36}' || true)
  [[ -n $id ]] || id=$(xcrun simctl create "$1" "${TYPES[$1]}")
  echo $id
}

for name in $DEVICES; do
  SIM=$(udid $name)
  xcrun simctl boot $SIM 2>/dev/null || true
  xcrun simctl bootstatus $SIM -b >/dev/null
  xcrun simctl spawn $SIM defaults write -g AppleLocale en_US
  xcrun simctl spawn $SIM defaults write -g AppleLanguages -array en-US
  xcrun simctl status_bar $SIM override --time "9:41" --batteryState discharging --batteryLevel 100 --wifiBars 3 2>/dev/null || true
  xcrun simctl install $SIM $BUILD
  # The first launch after an install takes longer (it photographed a blank window).
  xcrun simctl launch $SIM $APP -uitest -demo >/dev/null; sleep 8
  shoot() { # file appearance args...
    local file=$1 look=$2; shift 2
    xcrun simctl ui $SIM appearance $look
    xcrun simctl terminate $SIM $APP 2>/dev/null || true
    xcrun simctl launch $SIM $APP -uitest -demo "$@" >/dev/null
    sleep ${WAIT:-5}
    xcrun simctl io $SIM screenshot --type=png "$OUT/$name-$file.png" >/dev/null
    echo "$OUT/$name-$file.png"
  }
  shoot 1-note light -open Lisbon
  shoot 2-list light
  shoot 3-groceries light -open Groceries
  shoot 4-note-dark dark -open Lisbon
  shoot 5-folders light -showFolders
  xcrun simctl ui $SIM appearance light
  xcrun simctl terminate $SIM $APP 2>/dev/null || true
  PANE_SHOTS=$OUT TEST_RUNNER_PANE_SHOTS=$OUT xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" \
    -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO test-without-building \
    -only-testing:PaneUITests/TabletShotsTests > "$OUT/$name-ui.log" 2>&1 || echo "$name: landscape test failed, see $OUT/$name-ui.log"
  # The test names files by the simulator's name; the screen buffer stays portrait.
  for f in "$OUT"/$name-landscape-*.png(N); do sips -r 270 "$f" >/dev/null; done
  [[ -n ${KEEP:-} ]] || xcrun simctl shutdown $SIM
done
