#!/bin/zsh
# Yesterday's dev-time report, once a day (launchd, see install.sh):
#   $PINTO_INTERNAL/evidence/dev-time/<date>.md  the report (private: it is read from agents' sessions)
#   $PINTO_DEV_LOG/trend.csv                      one line a day, to see whether a change made us faster
#   daily.sh <midnight epoch>                     the day before that midnight instead
# Runs from the copy install.sh puts in ~/.local/share/pinto-dev-time, so no checkout has to stay put.
set -uo pipefail
here=${0:A:h}
log=${PINTO_DEV_LOG:-$HOME/Library/Logs/pinto-dev}
internal=${PINTO_INTERNAL:-$HOME/Documents/Development/PintoNotes-internal}
end=${1:-$(date -j -f "%Y-%m-%d %H:%M:%S" "$(date +%Y-%m-%d) 00:00:00" +%s)}   # midnight today, or the epoch given (to fill in past days)
day=$(date -j -r $((end - 43200)) +%Y-%m-%d)
mkdir -p "$internal/evidence/dev-time" "$log"
nice -n 15 python3 -I "$here/dev-time.py" --days 1 --until $end > "$internal/evidence/dev-time/$day.md"
nice -n 15 python3 -I "$here/dev-time.py" --days 1 --until $end --json | python3 -I -c '
import json, sys, os
day, f = sys.argv[1], sys.argv[2]
r = json.load(sys.stdin); a = r["agents"]; m = r.get("mac", {}); c = a["by_category"]
h = lambda k: c.get(k, {}).get("hours", 0)
row = dict(day=day, agent_hours=a["hours"], wall_hours_building=a["wall_hours_building"],
  qa_test_h=h("qa-test"), prepush_h=h("prepush"), xcodebuild_h=h("xcodebuild"), waiting_h=h("waiting (sleep/until)"),
  same_build_again_h=a["same_build_again"]["hours"], lock_wait_h=a["prepush_lock_waits"]["hours"],
  tool_cap_hits=a["hit_10_min_tool_cap"]["calls"], disk_refusals=a["disk_guard_refusals"], qa_timeouts=a["qa_timeouts"],
  mac_overloaded_pct=m.get("overloaded_pct", ""), mac_low_memory_pct=m.get("low_memory_pct", ""))
new = not os.path.exists(f) or os.path.getsize(f) == 0
lines = [] if new else [l for l in open(f).read().splitlines()[1:] if not l.startswith(day + ",")]
with open(f, "w") as out:
    out.write(",".join(row) + "\n")
    for l in lines: out.write(l + "\n")
    out.write(",".join(str(v) for v in row.values()) + "\n")' "$day" "$log/trend.csv"
