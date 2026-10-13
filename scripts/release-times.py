#!/usr/bin/env python3
"""Release lead times for Pinto Notes Mac, measured, not reported.

For each Mac release tag:
  ready   = newest non-merge commit in the release (the last fix was done)
  live    = when release-mac.sh finished (its log's modification time)
  lead    = live - ready
  build   = how long release-mac.sh ran (log birth to last write)
  ci      = GitHub Actions 'ci' runs on commits in the release, their count and Mac minutes

Run: python3 scripts/release-times.py [count]
"""
import datetime as dt, json, os, subprocess, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGS = os.environ.get("PINTO_RELEASE_LOGS", os.path.expanduser("~/content-tools/projects/amber-proto/release-gate"))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 12

def sh(*a):
    return subprocess.run(a, cwd=REPO, capture_output=True, text=True, check=True).stdout.strip()

def ts(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))

tags = sh("git", "for-each-ref", "--sort=creatordate", "--format=%(refname:short)", "refs/tags/mac-v1.2*").split()
runs = json.loads(sh("gh", "run", "list", "-R", "pinto-notes/pinto-notes", "-w", "ci", "-L", "300",
                     "--json", "headSha,createdAt,updatedAt,status,conclusion,event"))
rows = []
for prev, tag in zip(tags, tags[1:]):
    ver = tag.removeprefix("mac-v")
    log = os.path.join(LOGS, f"release-{ver}.log")
    if not os.path.exists(log):
        continue
    st = os.stat(log)
    live = dt.datetime.fromtimestamp(st.st_mtime, dt.timezone.utc)
    build = (st.st_mtime - st.st_birthtime) / 60
    commits = sh("git", "log", "--no-merges", "--format=%H %cI", f"{prev}..{tag}").splitlines()
    shas = {c.split()[0] for c in commits}
    allshas = set(sh("git", "log", "--format=%H", f"{prev}..{tag}").split())
    ready = max(ts(c.split()[1]) for c in commits).astimezone(dt.timezone.utc) if commits else live
    mine = [r for r in runs if r["headSha"] in allshas]
    mins = sum((ts(r["updatedAt"]) - ts(r["createdAt"])).total_seconds() for r in mine) / 60
    red = sum(1 for r in mine if r["conclusion"] == "failure")
    rows.append((ver, ready, live, (live - ready).total_seconds() / 60, build, len(mine), mins, red))

print(f"{'release':8} {'ready (UTC)':12} {'live (UTC)':12} {'lead min':>8} {'build min':>9} {'ci runs':>7} {'ci min':>7} {'red':>4}")
for ver, ready, live, lead, build, n, mins, red in rows[-N:]:
    print(f"{ver:8} {ready:%m-%d %H:%M}  {live:%m-%d %H:%M}  {lead:8.0f} {build:9.0f} {n:7d} {mins:7.0f} {red:4d}")
