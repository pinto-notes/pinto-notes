#!/bin/zsh
# Real clicks on the note list of a built app, on the measuring Mac (docs/Technical/release-gate.md, "Clicks"):
#
#   scripts/row-clicks.sh <app> [--host fleet-air] [--budget 500] [--median 230]
#
# Copies the app and scripts/release-gate/RowClicks.swift to the Mac, opens the app there with a
# made-up library kept in memory (`-uitest -demo`: no account, nothing of the Mac's own notes is
# read or written), clicks each note row with the pointer travelling 0 to 3 points during the
# click, prints what each click did and quits the app. Exits 1 when a click opened nothing, one took
# longer than the budget from press to note, or the median of all of them is over its own budget.
#
# It moves the pointer and clicks: only on a Mac nobody is working at (take the machine first), and
# the Mac must let ssh sessions use Accessibility. An app signed for another machine can be signed
# again for this run with `codesign --force --deep -s -`.
set -euo pipefail
cd "$(dirname "$0")/.."
app=${1:?usage: scripts/row-clicks.sh <app> [--host fleet-air] [--budget 500] [--median 230]}; shift
host=fleet-air budget=500 median=230
while (( $# )); do
  case $1 in
    --host) host=$2; shift 2 ;;
    --budget) budget=$2; shift 2 ;;
    --median) median=$2; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
[[ -d $app ]] || { echo "No app at $app" >&2; exit 2; }
name=${app:t}
exe=$(defaults read "${app:A}/Contents/Info" CFBundleExecutable)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
ditto -c -k --keepParent "$app" "$tmp/app.zip"
ssh "$host" 'rm -rf ~/row-clicks && mkdir -p ~/row-clicks'
scp -q "$tmp/app.zip" scripts/release-gate/RowClicks.swift "${host}:row-clicks/"
ssh "$host" zsh -s -- "$name" "$exe" "$budget" "$median" <<'REMOTE'
set -u
cd ~/row-clicks
ditto -x -k app.zip . && rm app.zip
swiftc -O RowClicks.swift -o RowClicks 2>/dev/null || { echo "RowClicks.swift didn't compile on this Mac" >&2; exit 2; }
open -n -a "$PWD/$1" --args -uitest -demo
pid=
for i in {1..40}; do pid=$(pgrep -n -f "$PWD/$1/Contents/MacOS/$2" || true); [[ -n $pid ]] && break; sleep 0.25; done
[[ -n $pid ]] || { echo "The app didn't start" >&2; exit 2; }
sleep 5
osascript -e "tell application \"System Events\" to set frontmost of (first process whose unix id is $pid) to true" >/dev/null 2>&1 || true
sleep 1
./RowClicks $pid $3 $4
rc=$?
kill $pid 2>/dev/null
exit $rc
REMOTE
