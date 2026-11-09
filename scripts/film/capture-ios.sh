#!/bin/zsh
# Captures the notebook film on the iPhone simulator, headless (no Simulator window): the flow from
# launch (intro, the film full screen, the share screen), the share screen in each look, and the
# shared movie itself. For council rounds and before/after pictures.
#   SIM=<udid> scripts/film/capture-ios.sh OUT_DIR
# Builds Release for the simulator into build/ddsim first (delete it afterwards: it's large).
set -euo pipefail
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
cd "$(dirname "$0")/../.."
OUT=${1:?out dir}; mkdir -p "$OUT"
: "${SIM:?set SIM to a simulator udid}"
APP=dev.emilwagman.pane
xcrun simctl boot "$SIM" 2>/dev/null || true
if [[ ${SKIP_BUILD:-0} != 1 ]]; then
  xcodebuild build -project Pane.xcodeproj -scheme Pane -configuration Release -destination "id=$SIM" -derivedDataPath build/ddsim \
    CODE_SIGNING_ALLOWED=NO SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) QA' > "$OUT/build.log" 2>&1 || { tail -20 "$OUT/build.log"; exit 1; }
fi
xcrun simctl install "$SIM" build/ddsim/Build/Products/Release-iphonesimulator/Pane.app
xcrun simctl spawn "$SIM" defaults write -g AppleLocale en_US
xcrun simctl status_bar "$SIM" override --time "9:41" --batteryState discharging --batteryLevel 100 --wifiBars 3 --cellularBars 4 --operatorName ""
xcrun simctl ui "$SIM" appearance light

launch() { xcrun simctl terminate "$SIM" $APP 2>/dev/null || true; sleep 1; xcrun simctl launch "$SIM" $APP -uitest -demo -forceNotebookFilm "$@" >/dev/null; }

# The whole flow, from the notes opening: intro, Watch, the film, the share screen, then Share.
xcrun simctl terminate "$SIM" $APP 2>/dev/null || true; sleep 1
data=$(xcrun simctl get_app_container "$SIM" $APP data)
rm -rf "$data"/tmp/NotebookFilm-* 2>/dev/null || true
xcrun simctl io "$SIM" recordVideo --codec=h264 --force "$OUT/flow-raw.mov" >/dev/null 2>&1 & rec=$!
# The recorder takes a few seconds to start writing.
sleep 5
t0=$(python3 -c "import time; print(time.time())")
xcrun simctl launch "$SIM" $APP -uitest -demo -forceNotebookFilm -filmAutoWatch -filmAutoShare >/dev/null
sleep 3; xcrun simctl io "$SIM" screenshot "$OUT/1-intro.png" >/dev/null 2>&1
sleep 7; xcrun simctl io "$SIM" screenshot "$OUT/2-watching-mid.png" >/dev/null 2>&1
sleep 7.5; xcrun simctl io "$SIM" screenshot "$OUT/3-watching-end.png" >/dev/null 2>&1
sleep 1.2; xcrun simctl io "$SIM" screenshot "$OUT/4-share-night.png" >/dev/null 2>&1
sleep 2.4; xcrun simctl io "$SIM" screenshot "$OUT/5-share-pressed.png" >/dev/null 2>&1
for i in {1..30}; do
  sleep 3
  ls "$data"/tmp/NotebookFilm-*/Pinto*.mp4 >/dev/null 2>&1 && break
done
sleep 3; xcrun simctl io "$SIM" screenshot "$OUT/7-share-sheet.png" >/dev/null 2>&1
sleep 2
t1=$(python3 -c "import time; print(time.time())")
kill -INT $rec; wait $rec || true
raw=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/flow-raw.mov")
start=$(python3 -c "print(max(0, $raw - ($t1 - $t0) - 0.3))")
ffmpeg -y -loglevel error -i "$OUT/flow-raw.mov" -ss $start -vf "scale=590:-2,format=yuv420p" -c:v libx264 -crf 20 -movflags +faststart "$OUT/flow.mp4"
rm -f "$OUT/flow-raw.mov"
ffmpeg -y -loglevel error -i "$OUT/flow.mp4" -vf "fps=2,scale=200:-1,tile=10x8" -frames:v 1 "$OUT/flow-2fps-sheet.png"
# The movies the app made in that session (Night first, then Paper, then Dusk), as they're shared.
for i in {1..60}; do (( $(ls "$data"/tmp/NotebookFilm-*/Pinto*.mp4 2>/dev/null | wc -l) >= 3 )) && break; sleep 3; done
looks=(night paper dusk); k=1
ls -tr "$data"/tmp/NotebookFilm-*/Pinto*.mp4 2>/dev/null | head -3 | while IFS= read -r f; do cp "$f" "$OUT/shared-${looks[$k]}.mp4"; k=$((k+1)); done

# The share screen in the other looks.
for look in paper dusk; do
  launch -filmAutoWatch -filmLook $look
  sleep 25; xcrun simctl io "$SIM" screenshot "$OUT/6-share-$look.png" >/dev/null 2>&1
done
xcrun simctl terminate "$SIM" $APP 2>/dev/null || true
[[ -f "$OUT/shared-night.mp4" ]] && ffmpeg -y -loglevel error -i "$OUT/shared-night.mp4" -vf "fps=1.5,scale=270:-1,tile=10x2" -frames:v 1 "$OUT/shared-night-sheet.png"
ls "$OUT"
