#!/bin/zsh
# iPhone pictures for the switcher councils: PaneUITests/IPhoneCouncilShots on a headless simulator
# of its own (never Simulator.app), muted, light and dark.
#   scripts/iphone-council-shots.sh <out dir> [test names...]
# SIM=<udid> picks the simulator (default: one named "Pinto iPhone reach", made if missing).
# BUILD=0 skips the build (reuses build/dd-iphone).
set -euo pipefail
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
OUT=${1:?out dir}; shift || true
[[ $OUT = /* ]] || OUT=$PWD/$OUT
mkdir -p "$OUT"
DD=build/dd-iphone
NAME="Pinto iPhone reach"
SIM=${SIM:-$(xcrun simctl list devices available | grep "$NAME (" | head -1 | grep -oE '[0-9A-F-]{36}' || true)}
[[ -z "$SIM" ]] && SIM=$(xcrun simctl create "$NAME" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro)
xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
# Silent, US English, a clean status bar.
xcrun simctl spawn "$SIM" defaults write com.apple.preferences.sounds keyboard -bool false 2>/dev/null || true
xcrun simctl spawn "$SIM" defaults write com.apple.preferences.sounds lock-sound -bool false 2>/dev/null || true
xcrun simctl spawn "$SIM" defaults write -g AppleLocale en_US
xcrun simctl spawn "$SIM" defaults write -g AppleLanguages -array en-US
xcrun simctl status_bar "$SIM" override --time "9:41" --batteryState discharging --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3 --operatorName "" 2>/dev/null || true

# The four app templates as the app ships them: the note, its compiled app and its starting data.
TPL=$PWD/build/council-templates
mkdir -p "$TPL"
python3 - "$TPL" <<'EOF'
import json, shutil, sys
out = sys.argv[1]
src = "Pane/Resources/Templates"
for e in json.load(open(f"{src}/catalog.json")):
    if not e["app"]: continue
    open(f"{out}/{e['slug']}.md", "w").write(e.get("note") or e["example"])
    for kind in ("project", "data"):
        shutil.copy(f"{src}/template-app-{e['slug']}.{kind}.json", f"{out}/{e['slug']}.{kind}.json")
EOF

if [[ ${BUILD:-1} != 0 ]]; then
  xcodegen generate >/dev/null
  if ! nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath $DD \
    CODE_SIGNING_ALLOWED=NO build-for-testing > "$OUT/build.log" 2>&1; then
    grep -E "error:" "$OUT/build.log" | sort -u | head -20
    echo "BUILD FAILED"; exit 1
  fi
fi

only=()
for t in "$@"; do only+=(-only-testing:PaneUITests/IPhoneCouncilShots/$t); done
[[ ${#only[@]} -eq 0 ]] && only=(-only-testing:PaneUITests/IPhoneCouncilShots)
for look in ${=LOOKS:-light dark}; do
  xcrun simctl ui "$SIM" appearance $look
  TEST_RUNNER_PANE_SHOTS="$OUT" TEST_RUNNER_PANE_SCHEME=$look TEST_RUNNER_PANE_TEMPLATES="$TPL" \
    TEST_RUNNER_PANE_TREE=${TREE:-} nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane \
    -destination "id=$SIM" -derivedDataPath $DD CODE_SIGNING_ALLOWED=NO test-without-building \
    "${only[@]}" > "$OUT/test-$look.log" 2>&1 || true
  grep -E "Test case .*(passed|failed)|error:" "$OUT/test-$look.log" | sed -E 's/^.*Test case/Test case/' | head -40
done
xcrun simctl ui "$SIM" appearance light
echo "$OUT"
