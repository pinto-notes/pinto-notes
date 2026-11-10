#!/bin/zsh
# Captures the month in the app on the iPhone simulator, headless (no Simulator window): the intro and
# slides, then the film they end on, then the share screen. One recording per notebook, stills of each.
#   SIM=<udid> scripts/film/capture-recap.sh OUT_DIR [-filmMe|-filmWeek|-filmKB ...]
# Expects a Release build in build/ddsim (scripts/film/capture-ios.sh makes one; SKIP_BUILD=1 there).
set -euo pipefail
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
cd "$(dirname "$0")/../.."
OUT=${1:?out dir}; shift; mkdir -p "$OUT"
: "${SIM:?set SIM to a simulator udid}"
APP=dev.emilwagman.pane
profiles=(${@:--filmMe})
xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl install "$SIM" build/ddsim/Build/Products/Release-iphonesimulator/Pane.app
xcrun simctl spawn "$SIM" defaults write -g AppleLocale en_US
xcrun simctl status_bar "$SIM" override --time "9:41" --batteryState discharging --batteryLevel 100 --wifiBars 3 --cellularBars 4 --operatorName ""
xcrun simctl ui "$SIM" appearance ${APPEARANCE:-light}
# Once through unrecorded: a first launch after an install stalls the simulator for seconds.
xcrun simctl launch "$SIM" $APP -uitest -demo -forceNotebookFilm >/dev/null; sleep 10
for p in $profiles; do
  name=${p#-film}; name=${name:l}
  xcrun simctl terminate "$SIM" $APP 2>/dev/null || true; sleep 1
  xcrun simctl io "$SIM" recordVideo --codec=h264 --force "$OUT/$name-raw.mov" >/dev/null 2>&1 & rec=$!
  sleep 5
  t0=$(python3 -c "import time; print(time.time())")
  # From its card at the foot of the folders, opened a moment later as a tap would; the slides
  # turn every 3.2 s, the last one's play is pressed, then the film and the share screen.
  xcrun simctl launch "$SIM" $APP -uitest -demo -forceNotebookFilm -filmCard -filmAutoOpen -showFolders -filmAutoCards $p >/dev/null
  sleep 2.5; xcrun simctl io "$SIM" screenshot "$OUT/$name-card.png" >/dev/null 2>&1
  sleep 3.5
  for k in 1 2 3; do xcrun simctl io "$SIM" screenshot "$OUT/$name-slide-$k.png" >/dev/null 2>&1; sleep 3.2; done
  sleep 12; xcrun simctl io "$SIM" screenshot "$OUT/$name-film-late.png" >/dev/null 2>&1
  sleep 6; xcrun simctl io "$SIM" screenshot "$OUT/$name-share.png" >/dev/null 2>&1
  sleep 1
  t1=$(python3 -c "import time; print(time.time())")
  kill -INT $rec; wait $rec || true
  raw=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$name-raw.mov")
  start=$(python3 -c "print(max(0, $raw - ($t1 - $t0) - 0.3))")
  ffmpeg -y -loglevel error -i "$OUT/$name-raw.mov" -ss $start -vf "scale=590:-2,format=yuv420p" -c:v libx264 -crf 20 -movflags +faststart "$OUT/$name.mp4"
  rm -f "$OUT/$name-raw.mov"
  ffmpeg -y -loglevel error -i "$OUT/$name.mp4" -vf "fps=1,scale=200:-1,tile=10x4" -frames:v 1 "$OUT/$name-1fps-sheet.png"
done
xcrun simctl terminate "$SIM" $APP 2>/dev/null || true
ls "$OUT"
