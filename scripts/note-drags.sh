#!/bin/zsh
# Real drags of notes in a built Mac app, on the measuring Mac:
#
#   scripts/note-drags.sh <app> [--host fleet-air]
#
# Copies the app and scripts/release-gate/NoteDrags.swift to the Mac, opens the app there with a
# made-up library kept in memory (`-uitest -demo`: no account, nothing of the Mac's own notes is
# read or written), drags notes onto note rows and into a note's text with the real pointer,
# prints what each drag did and what the app logged about its drop targets, and quits the app.
#
# It moves the pointer and types: only on a Mac nobody is working at (take the machine first), and
# the Mac must let ssh sessions use Accessibility.
set -euo pipefail
cd "$(dirname "$0")/.."
app=${1:?usage: scripts/note-drags.sh <app> [--host fleet-air]}; shift
host=fleet-air
while (( $# )); do
  case $1 in
    --host) host=$2; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
[[ -d $app ]] || { echo "No app at $app" >&2; exit 2; }
name=${app:t}
exe=$(defaults read "${app:A}/Contents/Info" CFBundleExecutable)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
ditto -c -k --keepParent "$app" "$tmp/app.zip"
ssh "$host" 'rm -rf ~/note-drags && mkdir -p ~/note-drags'
scp -q "$tmp/app.zip" scripts/release-gate/NoteDrags.swift "${host}:note-drags/"
ssh "$host" NOTE_DRAG_STEPS=${(q)NOTE_DRAG_STEPS:-} zsh -s -- "${(q)name}" "${(q)exe}" <<'REMOTE'
set -u
cd ~/note-drags
ditto -x -k app.zip . && rm app.zip
swiftc -O NoteDrags.swift -o NoteDrags 2>/dev/null || { echo "NoteDrags.swift didn't compile on this Mac" >&2; exit 2; }
failed=0
for step in ${=NOTE_DRAG_STEPS:-row undo-menu two text self}; do
  start=$(date "+%Y-%m-%d %H:%M:%S")
  open -n -a "$PWD/$1" --args -uitest -demo
  pid=
  for i in {1..40}; do pid=$(pgrep -n -f "$PWD/$1/Contents/MacOS/$2" || true); [[ -n $pid ]] && break; sleep 0.25; done
  [[ -n $pid ]] || { echo "The app didn't start" >&2; exit 2; }
  sleep 5
  osascript -e "tell application \"System Events\" to set frontmost of (first process whose unix id is $pid) to true" >/dev/null 2>&1 || true
  sleep 1
  ./NoteDrags $pid $step || failed=1
  /usr/bin/log show --start "$start" --info --predicate "processID == $pid AND category == \"drop\"" 2>/dev/null | grep -E "sub-note drop|text drop" | sed -E 's/^[0-9-]+ ([0-9:]+)\.[0-9]+.*((sub-note drop|text drop).*)$/     app log \1 \2/'
  kill $pid 2>/dev/null
  sleep 1
done
exit $failed
REMOTE
