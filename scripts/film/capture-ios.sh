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
sleep 1.2; xcrun simctl io "$SIM" screenshot "$OUT/4-share-town.png" >/dev/null 2>&1
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
# The movies the app made in that session (Town first, then Night, Paper, Dusk), as they're shared.
for i in {1..60}; do (( $(ls "$data"/tmp/NotebookFilm-*/Pinto*.mp4 2>/dev/null | wc -l) >= 4 )) && break; sleep 3; done
looks=(town night paper dusk); k=1
ls -tr "$data"/tmp/NotebookFilm-*/Pinto*.mp4 2>/dev/null | head -4 | while IFS= read -r f; do cp "$f" "$OUT/shared-${looks[$k]}.mp4"; k=$((k+1)); done

# The share screen in the other looks.
for look in night paper dusk; do
  launch -filmAutoWatch -filmLook $look
  sleep 25; xcrun simctl io "$SIM" screenshot "$OUT/6-share-$look.png" >/dev/null 2>&1
done
# Not now on the intro, and the close button part way through: both go straight back to the notes.
clip() {  # name seconds args...
  local name=$1 secs=$2; shift 2
  xcrun simctl terminate "$SIM" $APP 2>/dev/null || true; sleep 1
  xcrun simctl io "$SIM" recordVideo --codec=h264 --force "$OUT/clip-raw.mov" >/dev/null 2>&1 & local r=$!
  sleep 5
  local a=$(python3 -c "import time; print(time.time())")
  xcrun simctl launch "$SIM" $APP -uitest -demo -forceNotebookFilm "$@" >/dev/null
  sleep $secs
  local b=$(python3 -c "import time; print(time.time())")
  kill -INT $r; wait $r || true
  local raw=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/clip-raw.mov")
  ffmpeg -y -loglevel error -i "$OUT/clip-raw.mov" -ss $(python3 -c "print(max(0, $raw - ($b - $a) - 0.3))") -vf "scale=590:-2,format=yuv420p" -c:v libx264 -crf 20 -movflags +faststart "$OUT/$name.mp4"
  rm -f "$OUT/clip-raw.mov"
}
clip 8-not-now 9 -filmAutoNotNow
clip 8-close-part-way 14 -filmAutoWatch -filmAutoClose
# The thinnest month it's offered for, the whole way through in the app.
clip 9-light-month-flow 21 -filmAutoWatch -filmLight
xcrun simctl io "$SIM" screenshot "$OUT/9-light-month-share.png" >/dev/null 2>&1

# The thinnest month it's offered for (another made-up notebook: two folders, no AI), as shared.
scripts/film/render.sh "$OUT/shared-town-light-month.mp4" 7 35 town light >/dev/null 2>&1
scripts/film/render.sh "$OUT/shared-night-light-month.mp4" 7 35 night light >/dev/null 2>&1
scripts/film/render.sh "$OUT/shared-paper-light-month.mp4" 7 35 paper light >/dev/null 2>&1

# Folder names off: the share screen, and the movie the app makes.
rm -rf "$data"/tmp/NotebookFilm-* 2>/dev/null || true
launch -filmAutoWatch -filmNoFolderNames
sleep 25; xcrun simctl io "$SIM" screenshot "$OUT/6-share-no-folder-names.png" >/dev/null 2>&1
for i in {1..40}; do ls "$data"/tmp/NotebookFilm-*/Pinto*.mp4 >/dev/null 2>&1 && break; sleep 3; done
cp "$(ls -tr "$data"/tmp/NotebookFilm-*/Pinto*.mp4 | head -1)" "$OUT/shared-town-no-folder-names.mp4" 2>/dev/null || true
xcrun simctl terminate "$SIM" $APP 2>/dev/null || true
[[ -f "$OUT/shared-town.mp4" ]] && ffmpeg -y -loglevel error -i "$OUT/shared-town.mp4" -vf "fps=1.5,scale=270:-1,tile=10x2" -frames:v 1 "$OUT/shared-town-sheet.png"
# The shared film at the width a feed shows it (390 points), at 1, 5, 8 and 13 seconds.
if [[ -f "$OUT/shared-town.mp4" ]]; then
  for t in 1 5 8 13; do ffmpeg -y -loglevel error -ss $t -i "$OUT/shared-town.mp4" -frames:v 1 -update 1 -vf "scale=390:-1" "$OUT/feed-$t.png"; done
  ffmpeg -y -loglevel error -i "$OUT/feed-1.png" -i "$OUT/feed-5.png" -i "$OUT/feed-8.png" -i "$OUT/feed-13.png" -filter_complex hstack=4 "$OUT/shared-town-at-feed-size.png"
  rm -f "$OUT"/feed-*.png
fi
ls "$OUT"
