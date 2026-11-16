#!/bin/zsh
# The board benchmark: how a whiteboard of 500 and 2000 elements feels in the app, in a Release
# build, against plain Excalidraw (the same version) in a plain web view, idle and under load.
# Everything runs off screen (BoardPerfTests): no window shows, no input reaches the system.
#
#   scripts/board-perf.sh                 builds, runs idle then loaded, prints the table
#   scripts/board-perf.sh --idle          one run (or --loaded)
#   scripts/board-perf.sh --table         the table of the last runs
#   scripts/board-perf.sh --check         exits 1 when a number is more than 20% worse than
#                                         scripts/board-perf/baseline.json (never part of CI or prepush:
#                                         timing gates nothing)
#   scripts/board-perf.sh --save          keeps the last runs as that baseline
#   scripts/board-perf.sh --compare       before (before-*.json in build/board-perf) and after, side by side
#   NO_BUILD=1     reuses the last build      SIZES=500,2000     SECONDS_EACH=3 (each scenario)
#   SOAK=300       seconds of drawing on the biggest board idle while its memory is watched (60 loaded)
#   KEEP=1         keeps the build folder (it's deleted after a full run: the disk is shared)
#   LABEL=trial    names a single run's results (results-trial.json) instead of idle or loaded
#   ONLY=pinto     runs only these of pinto, plain and plain120
#
# Each size and subject (pinto, plain, plain120) runs in an app of its own: in an app whose windows
# are all off screen, WebKit halves every page's frame rate about a minute after it starts, and
# nothing done off screen undoes it (BoardPerfTests.wakeful).
#
# Loaded: every core but one busy (yes, at normal priority), 60% of free memory held (incompressible)
# and a 1 GB file written and read without the cache, in build/board-perf; each started and stopped
# by its own PID, the moment the run ends.
set -uo pipefail
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
OUT=$PWD/build/board-perf
DD=${DD:-build/ddperf}
SIZES=${SIZES:-500,2000}
table() { python3 scripts/board-perf/table.py $OUT "$@"; }
BASELINE=scripts/board-perf/baseline.json

case ${1:-} in
  --table) table; exit ;;
  --check) table --check $BASELINE; exit ;;
  --save) table --save $BASELINE; exit ;;
  --compare) table --compare before; exit ;;
esac

(cd canvas-stack && node bench/build.mjs "$SIZES") || exit 1

if [[ -z ${NO_BUILD:-} ]]; then
  echo "Building (Release, testable)…"
  xcodebuild -project Pane.xcodeproj -scheme PaneBench -configuration Release -destination 'platform=macOS' -derivedDataPath $DD \
    ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO ONLY_ACTIVE_ARCH=YES SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) QA' \
    CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER= \
    ${=BUILD_SETTINGS:-} build-for-testing > $OUT/build.log 2>&1 || { grep -E "error:" $OUT/build.log | sort -u | head -20; exit 1; }
fi

machine() { echo "$(sysctl -n hw.ncpu) cores; $(vm_stat | awk '/Pages free|Pages inactive|Pages speculative/ {gsub("\\.","",$NF); s+=$NF} END {printf "%.1f GB free", s*16384/1e9}'); $(uptime | sed 's/.*load averages*: //')"; }

load_pids=()
stop_load() {
  for p in $load_pids; do kill $p 2>/dev/null; done
  for p in $load_pids; do wait $p 2>/dev/null; done
  load_pids=()
  rm -f $OUT/load-io.bin
}
trap stop_load EXIT INT TERM

start_load() {
  local cores=$(sysctl -n hw.ncpu)
  for i in $(seq 1 $((cores - 1))); do yes > /dev/null & load_pids+=($!); done
  python3 scripts/board-perf/load.py memory 0.6 & load_pids+=($!)
  python3 scripts/board-perf/load.py disk $OUT & load_pids+=($!)
  sleep 8  # the memory filled and the disk busy before anything is measured
}

# One size and subject in a run of the app, added to the label's results; a run that fails says
# why and the next goes on.
one() {
  local label=$1 n=$2 who=$3 soak=$4 log=$OUT/run-$1-$2-$3.log
  TEST_RUNNER_BOARD_PERF=$OUT TEST_RUNNER_BOARD_PERF_LABEL=$label TEST_RUNNER_BOARD_PERF_SIZES=$n TEST_RUNNER_BOARD_PERF_APPEND=1 \
  TEST_RUNNER_BOARD_PERF_SECONDS=${SECONDS_EACH:-3} TEST_RUNNER_BOARD_PERF_SOAK=$soak TEST_RUNNER_BOARD_PERF_ONLY=$who \
    xcodebuild -project Pane.xcodeproj -scheme PaneBench -configuration Release -destination 'platform=macOS' -derivedDataPath $DD \
    test-without-building '-only-testing:PaneBench/BoardPerfTests/boardPerf()' > $log 2>&1 &
  local pid=$!
  # A hung run stops after 15 minutes (its own host app, by its path, and xcodebuild).
  for i in $(seq 1 900); do kill -0 $pid 2>/dev/null || break; sleep 1; done
  if kill -0 $pid 2>/dev/null; then
    echo "TIMEOUT: $who, $n elements"
    for h in $(pgrep -f "$PWD/$DD/Build/Products/Release/Pane.app/Contents/MacOS/Pane"); do kill $h; done
    kill $pid 2>/dev/null
  fi
  wait $pid 2>/dev/null
  local failed="recorded an issue|unexpected exit|TEST EXECUTE FAILED"
  if grep -qE "$failed" $log; then echo "$who, $n elements:"; grep -E "$failed" $log | head -5; fi
}

run() {
  local label=$1 soak=$2 biggest=$(echo $SIZES | tr ',' '\n' | sort -n | tail -1)
  echo "$label: $(machine)"
  rm -f $OUT/results-$label.json
  for n in ${(s:,:)SIZES}; do
    for who in ${(s:,:)${ONLY:-pinto,plain,plain120}}; do
      # The soak on the biggest board, in the app's run.
      one $label $n $who $([[ $n == $biggest && $who == pinto ]] && echo $soak || echo 0)
    done
  done
  [[ -f $OUT/results-$label.json ]]
}

case ${1:-} in
  --idle) run ${LABEL:-idle} ${SOAK:-300} ;;
  --loaded) start_load; run ${LABEL:-loaded} ${SOAK_LOADED:-60}; stop_load ;;
  *)
    run idle ${SOAK:-300} || exit 1
    start_load; run loaded ${SOAK_LOADED:-60}; stop_load
    [[ -z ${KEEP:-} ]] && rm -rf $DD
    ;;
esac
table
