#!/bin/zsh
set -uo pipefail
# Persona council round 7: the iPhone videos (PaneUITests/PersonaR7Recordings), one clip per test,
# on a headless simulator of their own (never Simulator.app), recorded by simctl recordVideo.
#   scripts/persona-r7-videos.sh <out dir>                      every clip
#   TESTS="testC1AIReview testC3Search" scripts/persona-r7-videos.sh <out dir>
#   SKIP_BUILD=1 reuses the last build; ERASE=1 erases the simulator first (the widget clip needs a
#   Home Screen without the widget). REPROCESS=1 records nothing: it cuts the clips again from
#   the recordings already in build/persona-r7-work (WORK=<dir> for another).
#   SUFFIX=-v2 names a re-take's files <clip>-v2…, next to the first take's, which stay.
# Each clip goes in its capture's folder (<out>/c1-ai-review/ …): iphone-<clip>.mp4 (H.264, 30 fps,
# trimmed to the test), iphone-<clip>-contact-sheet.png (a frame a second), and the test's own
# screenshots of its key moments (iphone-<clip>-NN-<moment>.png). The keyboard still keeps only
# its screenshot. Work files (raw recordings, logs) go in build/persona-r7-work, not <out>.
# The simulator records no sound; keyboard clicks are off.
cd "$(dirname "$0")/.."
zmodload zsh/datetime
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
OUT=${1:?out dir}; mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
WORK=${WORK:-$PWD/build/persona-r7-work}; mkdir -p "$WORK"
DD=build/dd-iphone
NAME="Pinto r7 captures"
PY=""
for p in python3 /usr/local/bin/python3; do "$p" -c 'import PIL' 2>/dev/null && { PY=$p; break; }; done
[[ -z $PY ]] && { echo "needs a python3 with Pillow"; exit 1; }

# test → capture folder, clip name, appearance
typeset -A FOLDER CLIP MODE
FOLDER=(testC1AIReview c1-ai-review testC2Writing c2-writing testC2KeyboardStill c2-writing testC3Search c3-search
        testC4ShareSheet c4-share-sheet testC5LockedNote c5-locked-note testC6Widget c6-widget testC6TimedChecklist c6-widget)
CLIP=(testC1AIReview c1-ai-review testC2Writing c2-writing testC2KeyboardStill c2-keyboard-still testC3Search c3-search
      testC4ShareSheet c4-share-sheet testC5LockedNote c5-locked-note testC6Widget c6-widget testC6TimedChecklist c6-timed-checklist)
MODE=(testC1AIReview dark testC2Writing light testC2KeyboardStill light testC3Search dark
      testC4ShareSheet light testC5LockedNote dark testC6Widget light testC6TimedChecklist light)
ALL=(testC6Widget testC6TimedChecklist testC1AIReview testC2Writing testC2KeyboardStill testC3Search testC4ShareSheet testC5LockedNote)
# Each clip's key stills (3 to 6); its other screenshots go in more-stills/.
typeset -A KEYS
KEYS=(testC1AIReview note-before,edit-landed,review-sheet,undid-sentence,result,note-after-top
      testC2Writing checklist-typed,link-suggestions,pasted-link,table-cell-edited,undone,undone-again,note-top
      testC3Search exact-title,buried-phrase,checklist-word,typo,edited,back-to-results
      testC4ShareSheet recipe-page,add-to-recipes,recipes-note,paragraph-selected,share-sheet-text,text-note
      testC5LockedNote list-with-lock,face-id,edited,locked-again,password-typed,ends-locked
      testC6Widget widget-gallery,choose-note,widget-packing,ticked-opens-pinto,edited-in-pinto,home-after-edit)

# Trimmed to the test, H.264 at 30 fps; a frame a second as a sheet; the test's screenshots.
cut_clip() { # <test>
  local t=$1 clip=${CLIP[$1]} extra=()
  [[ $t == testC6TimedChecklist ]] && extra=(--timer)
  [[ -n ${KEYS[$t]:-} ]] && extra+=(--keys=${KEYS[$t]})
  "$PY" scripts/persona-r7-clip.py "$WORK/$clip.raw.mp4" "$(cat "$WORK/$clip.start" 2>/dev/null || print 0)" "$WORK/$clip" "$OUT/${FOLDER[$t]}" "iphone-$clip-${MODE[$t]}${SUFFIX:-}" "${extra[@]}"
  # A still, not a clip: its two seconds of video say nothing.
  [[ $t == testC2KeyboardStill ]] && rm -f "$OUT/${FOLDER[$t]}/iphone-$clip-${MODE[$t]}${SUFFIX:-}"{.mp4,-contact-sheet.png,-moments.tsv}
  return 0
}
if [[ ${REPROCESS:-} == 1 ]]; then
  for t in ${=TESTS:-$ALL}; do mkdir -p "$OUT/${FOLDER[$t]}"; cut_clip $t; done
  exit 0
fi

SIM=$(xcrun simctl list devices available | grep "$NAME (" | head -1 | grep -oE '[0-9A-F-]{36}' || true)
[[ -z "$SIM" ]] && SIM=$(xcrun simctl create "$NAME" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro)
if [[ ${ERASE:-} == 1 ]]; then xcrun simctl shutdown "$SIM" 2>/dev/null; xcrun simctl erase "$SIM"; fi
xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl spawn "$SIM" defaults write com.apple.preferences.sounds keyboard -bool false 2>/dev/null || true
# iOS's own first-run keyboard tip (slide to type) stays away: it isn't Pinto's.
xcrun simctl spawn "$SIM" defaults write com.apple.keyboard.preferences DidShowContinuousPathIntroduction -bool true 2>/dev/null || true
xcrun simctl spawn "$SIM" defaults write -g AppleLocale en_US
xcrun simctl spawn "$SIM" defaults write -g AppleLanguages -array en-US
xcrun simctl status_bar "$SIM" override --time "9:41" --batteryState discharging --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --operatorName "" 2>/dev/null || true
# A face enrolled, for the locked note's Face ID.
xcrun simctl spawn "$SIM" notifyutil -s com.apple.BiometricKit.enrollmentChanged 1
xcrun simctl spawn "$SIM" notifyutil -p com.apple.BiometricKit.enrollmentChanged

signing=(CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER=)
if [[ ${SKIP_BUILD:-} != 1 ]]; then
  xcodegen generate >/dev/null
  if ! nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath $DD "${signing[@]}" build-for-testing > "$WORK/build.log" 2>&1; then
    grep -E "error:" "$WORK/build.log" | sort -u | head; echo BUILD FAILED; exit 1
  fi
fi

# What a test asks the Mac side for (PersonaR7Recordings.ask): a file in $ASK, removed when done.
ASK="$WORK/ask"; mkdir -p "$ASK"
watch_asks() {
  while true; do
    for f in "$ASK"/*(N); do
      case ${f:t} in
        faceid-match) xcrun simctl spawn "$SIM" notifyutil -p com.apple.BiometricKit_Sim.pearl.match ;;
        faceid-nomatch) xcrun simctl spawn "$SIM" notifyutil -p com.apple.BiometricKit_Sim.pearl.nomatch ;;
        shake) xcrun simctl spawn "$SIM" notifyutil -p com.apple.UIKit.SimulatorShake ;;
      esac
      rm -f "$f"
    done
    sleep 0.3
  done
}
watch_asks &
WATCHER=$!
trap 'kill $WATCHER 2>/dev/null' EXIT

for t in ${=TESTS:-$ALL}; do
  clip=${CLIP[$t]}; folder="$OUT/${FOLDER[$t]}"; mode=${MODE[$t]}
  mkdir -p "$folder"
  rm -rf "$WORK/$clip"; mkdir -p "$WORK/$clip"
  rm -f "$ASK"/*(N)
  xcrun simctl ui "$SIM" appearance "$mode"
  sleep 1
  raw="$WORK/$clip.raw.mp4"
  xcrun simctl io "$SIM" recordVideo --codec h264 --force "$raw" > /dev/null 2>&1 &
  REC=$!
  sleep 1.5
  # Only a guess: simctl's first frame comes when the screen first changes (the clip script finds
  # the real start from the test's screenshots).
  start=$EPOCHREALTIME
  print -- $start > "$WORK/$clip.start"
  TEST_RUNNER_PN_R7_OUT="$WORK" nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$SIM" -derivedDataPath $DD "${signing[@]}" \
    test-without-building -only-testing:PaneUITests/PersonaR7Recordings/$t > "$WORK/$clip.log" 2>&1
  sleep 1
  kill -INT $REC; wait $REC 2>/dev/null
  echo "$t: $(grep -oE "Test Case .*(passed|failed)" "$WORK/$clip.log" | tail -1)"
  grep -E "error: -|XCTAssert" "$WORK/$clip.log" | head -3
  cut_clip $t
done
