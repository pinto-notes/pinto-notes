#!/bin/zsh
# One line per run of a slow script, so dev-time.py can say where the time went from what happened,
# not from guesses. Called from scripts/prepush.sh and scripts/qa-test.sh when they end:
#   scripts/dev-time/record.sh <tool> <start epoch> <exit code> <seconds waited for a lock> <args...>
# Writes to $PINTO_DEV_LOG/runs.jsonl (default ~/Library/Logs/pinto-dev). Never fails its caller.
{
  tool=$1 start=$2 code=$3 waited=$4; shift 4
  dir=${PINTO_DEV_LOG:-$HOME/Library/Logs/pinto-dev}
  mkdir -p "$dir"
  python3 -I -c '
import json, sys, time, os
tool, start, code, waited, cwd, branch, load = sys.argv[1:8]
end = time.time()
print(json.dumps(dict(tool=tool, start=int(start), end=int(end), secs=round(end - int(start)), exit=int(code),
    lock_wait=int(waited or 0), cwd=cwd, branch=branch, load_end=float(load or 0), args=" ".join(sys.argv[8:]))))' \
    "$tool" "$start" "$code" "$waited" "$PWD" "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" \
    "$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')" "$@" >> "$dir/runs.jsonl"
} 2>/dev/null || true
exit 0
