#!/usr/bin/env python3
"""Where development time goes, measured. Three sources, each optional:

  runs.jsonl   every run of prepush.sh and qa-test.sh, exact (scripts/dev-time/record.sh)
  load.csv     how busy the Mac was, every minute (scripts/dev-time/sample.sh)
  transcripts  every tool call agents made, timed from Claude Code's session logs

  python3 -I scripts/dev-time/dev-time.py [--days 1] [--json] [--logs DIR] [--transcripts DIR]
  (scripts/dev-time/daily.sh writes one a day and adds a line to trend.csv)

Times are agent time: two sessions building for an hour each count two hours. "Wall" is clock
time with at least one build or test running anywhere on the Mac.
"""
import argparse, bisect, collections, datetime, glob, json, os, re, statistics, sys, time

ap = argparse.ArgumentParser()
ap.add_argument("--days", type=float, default=1)
ap.add_argument("--until", type=float, default=None, help="epoch end of the window (default now)")
ap.add_argument("--json", action="store_true")
ap.add_argument("--logs", default=os.environ.get("PINTO_DEV_LOG", os.path.expanduser("~/Library/Logs/pinto-dev")))
ap.add_argument("--transcripts", default=os.path.expanduser("~/.claude/projects"))
ap.add_argument("--project", default="PintoNotes", help="transcript folders whose name holds this")
args = ap.parse_args()
END = args.until or time.time()
START = END - args.days * 86400

# What a shell command runs, heaviest first, matched on the first word of each segment of it, so
# `sed -n 1,9p scripts/qa-test.sh` is not a test run but `python3 - <<EOF … EOF && scripts/qa-test.sh` is.
RUN = [
    ("prepush", r"(\S*/)?prepush\.sh"),
    ("qa-test", r"(\S*/)?qa-test\.sh"),
    ("release/install", r"(\S*/)?(release-mac|testflight|install-mac|install-phone|release-gate)\.sh"),
    ("xcodebuild", r"xcodebuild"),
    ("shots/capture", r"(\S*/)?[\w-]*(shots|scenes|capture|film|clip|videos|drags|pages-[\w-]+)\S*\.(sh|py)|screencapture"),
    ("simulator", r"xcrun"),
    ("ssh/Air", r"ssh|scp|rsync"),
    ("video", r"ffmpeg|ffprobe|npx"),
    ("server tests", r"deno|supabase|(\S*/)?\S*e2e\S*\.sh"),
    ("xcodegen", r"xcodegen"),
    ("gh/CI", r"gh"),
    ("waiting (sleep/until)", r"sleep|until|while"),
    ("node", r"pnpm|npm|node|bun|tsx"),
    ("git", r"git"),
    ("python", r"python3?"),
]
HEAVY = ("prepush", "qa-test", "xcodebuild", "release/install")
SKIP = {"cd", "env", "caffeinate", "nice", "time", "timeout", "gtimeout", "exec", "command", "then", "do", "else", "{", "(", "!"}
FAIL = re.compile(r"TEST FAILED|BUILD FAILED|\*\* .*FAILED|✗|TIMEOUT after|error: ")


def first_words(cmd):
    for seg in re.split(r"\n|;|&&|\|\||\||\$\(|`", cmd):
        w = seg.strip().split()
        while w and (w[0] in SKIP or re.match(r"^-|^\w+=|^\d+$", w[0])):
            w = w[2:] if w[0] == "cd" else w[1:]
        if w:
            yield w[0]


def category(tool, cmd):
    if tool != "Bash":
        return "tool:" + str(tool)
    ws = list(first_words(cmd))
    for name, rx in RUN:
        if any(re.fullmatch(rx, x) for x in ws):
            return name
    return "other shell"


def iso(s):
    return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()


def transcript_calls():
    files = [f for f in glob.glob(os.path.join(args.transcripts, f"*{args.project}*", "**", "*.jsonl"), recursive=True)
             if os.path.getmtime(f) >= START]
    calls = []
    for f in files:
        sess = f.split("/")[-3] if "/subagents/" in f else os.path.basename(f)[:-6]
        pending = {}
        with open(f, errors="replace") as fh:
            for line in fh:
                if '"tool_use"' not in line and '"tool_result"' not in line:
                    continue
                try:
                    d = json.loads(line)
                    m = d["message"]; content = m["content"]; t = iso(d["timestamp"])
                except Exception:
                    continue
                if not isinstance(content, list):
                    continue
                for b in content:
                    if not isinstance(b, dict):
                        continue
                    if b.get("type") == "tool_use":
                        pending[b.get("id")] = (t, b.get("name"), b.get("input") or {})
                    elif b.get("type") == "tool_result" and b.get("tool_use_id") in pending:
                        t0, name, inp = pending.pop(b["tool_use_id"])
                        if not START <= t0 < END or not isinstance(inp, dict) or inp.get("run_in_background"):
                            continue
                        out = b.get("content")
                        if isinstance(out, list):
                            out = " ".join(x.get("text", "") for x in out if isinstance(x, dict))
                        out = str(out or "")
                        cmd = inp.get("command") or ""
                        calls.append(dict(sess=sess, t0=t0, dur=max(0.0, t - t0), cat=category(name, cmd), cmd=cmd,
                                          failed=bool(b.get("is_error")) or bool(FAIL.search(out[:400] + out[-600:])),
                                          lock_wait=max([int(x) for x in re.findall(r"Waiting for the local check of pid .*?(\d+) s so far", out)] or [0]),
                                          disk_refused="GB free on this disk" in out, qa_timeout="TIMEOUT after" in out))
    return calls, len(files)


def read_jsonl(p):
    try:
        with open(p) as fh:
            return [json.loads(l) for l in fh if l.strip()]
    except OSError:
        return []


def read_load(p):
    try:
        with open(p) as fh:
            head = fh.readline().strip().split(",")
            rows = []
            for l in fh:
                v = l.strip().split(",")
                if len(v) == len(head):
                    r = dict(zip(head, v))
                    rows.append({k: (float(x) if x else None) for k, x in r.items()})
            return rows
    except OSError:
        return []


def med(v):
    return statistics.median(v) if v else 0


def p90(v):
    return sorted(v)[int(len(v) * 0.9)] if v else 0


def wall(intervals):
    total, cur = 0.0, None
    for a, b in sorted(intervals):
        if cur and a <= cur[1]:
            cur[1] = max(cur[1], b)
        else:
            if cur: total += cur[1] - cur[0]
            cur = [a, b]
    return total + (cur[1] - cur[0] if cur else 0)


H = lambda s: round(s / 3600, 2)
rep = dict(window=dict(start=int(START), end=int(END), days=args.days))

# 1. Exact runs.
runs = [r for r in read_jsonl(os.path.join(args.logs, "runs.jsonl")) if START <= r.get("start", 0) < END]
load = [r for r in read_load(os.path.join(args.logs, "load.csv")) if START - 120 <= (r["epoch"] or 0) < END]
load_t = [r["epoch"] for r in load]


def load_at(t):
    if not load_t: return None
    i = bisect.bisect_left(load_t, t)
    cand = [j for j in (i - 1, i) if 0 <= j < len(load)]
    j = min(cand, key=lambda j: abs(load_t[j] - t))
    return load[j] if abs(load_t[j] - t) <= 180 else None


by_tool = {}
for tool in sorted({r["tool"] for r in runs}):
    v = [r for r in runs if r["tool"] == tool]
    secs = [r["secs"] for r in v]
    again = collections.Counter((r["cwd"], r["args"], datetime.date.fromtimestamp(r["start"])) for r in v)
    # Busy vs quiet: load per core at the start of the run.
    split = collections.defaultdict(list)
    for r in v:
        s = load_at(r["start"])
        if s and s["cores"]:
            ratio = s["load1"] / s["cores"]
            split["quiet (load < cores/2)" if ratio < .5 else "busy (load ≥ cores)" if ratio >= 1 else "medium"].append(r["secs"] - r.get("lock_wait", 0))
    by_tool[tool] = dict(runs=len(v), hours=H(sum(secs)), median_s=med(secs), p90_s=p90(secs),
                         failed=sum(r["exit"] != 0 for r in v), failed_hours=H(sum(r["secs"] for r in v if r["exit"] != 0)),
                         lock_wait_hours=H(sum(r.get("lock_wait", 0) for r in v)),
                         same_run_again=sum(n - 1 for n in again.values() if n > 1),
                         same_run_again_hours=H(sum(r["secs"] for r in v) - sum(next(x["secs"] for x in v if (x["cwd"], x["args"], datetime.date.fromtimestamp(x["start"])) == k) for k in again)),
                         median_s_by_load={k: dict(n=len(x), median_s=med(x)) for k, x in sorted(split.items())})
rep["runs"] = by_tool

# 2. The Mac.
if load:
    n = len(load)
    rep["mac"] = dict(samples=n,
                      overloaded_pct=round(100 * sum(1 for r in load if r["cores"] and r["load1"] >= r["cores"]) / n, 1),
                      low_memory_pct=round(100 * sum(1 for r in load if r["mem_free_pct"] is not None and r["mem_free_pct"] < 20) / n, 1),
                      median_load=med([r["load1"] for r in load]), cores=load[-1]["cores"],
                      max_swap_mb=max((r["swap_mb"] or 0) for r in load), min_disk_free_gb=min((r["disk_free_gb"] or 0) for r in load),
                      median_claude_processes=med([r["claude"] for r in load if r["claude"] is not None]),
                      median_xcodebuilds=med([r["xcodebuild"] for r in load if r["xcodebuild"] is not None]))

# 3. Agents.
calls, nfiles = transcript_calls()
cats = collections.defaultdict(lambda: [0, 0.0, 0, 0.0])
for c in calls:
    x = cats[c["cat"]]; x[0] += 1; x[1] += c["dur"]
    if c["failed"] and c["cat"] in HEAVY: x[2] += 1; x[3] += c["dur"]
heavy = [c for c in calls if c["cat"] in HEAVY]
# The same build or test asked for again in one session (same command, after the edit part).
key = lambda c: (c["sess"], c["cat"], re.sub(r"\s+", " ", re.sub(r"(?s)<<'?EOF'?.*?\nEOF", "", c["cmd"]))[-200:])
seen = collections.Counter(key(c) for c in heavy)
first = {}
again_s = 0.0
for c in sorted(heavy, key=lambda c: c["t0"]):
    k = key(c)
    if k in first: again_s += c["dur"]
    else: first[k] = c
# Others building at the same time, from other sessions.
hv = sorted(heavy, key=lambda c: c["t0"])
starts = [c["t0"] for c in hv]
conc = collections.defaultdict(list)
for c in hv:
    if c["dur"] < 5 or c["cat"] not in ("prepush", "qa-test"): continue
    a, b = c["t0"], c["t0"] + c["dur"]
    o = sum(1 for d in hv[:bisect.bisect_left(starts, b)] if d is not c and d["sess"] != c["sess"] and d["t0"] + d["dur"] > a)
    conc[(c["cat"], "0" if o == 0 else "1-2" if o <= 2 else "3+")].append(c["dur"])
rep["agents"] = dict(
    transcripts=nfiles, calls=len(calls), hours=H(sum(c["dur"] for c in calls)),
    wall_hours_building=H(wall([(c["t0"], c["t0"] + c["dur"]) for c in heavy])),
    by_category={k: dict(calls=v[0], hours=H(v[1]), failed=v[2], failed_hours=H(v[3]))
                 for k, v in sorted(cats.items(), key=lambda kv: -kv[1][1])},
    same_build_again=dict(runs=sum(n - 1 for n in seen.values() if n > 1), hours=H(again_s)),
    hit_10_min_tool_cap=dict(calls=sum(1 for c in calls if c["dur"] >= 590 and c["cat"] in HEAVY + ("waiting (sleep/until)",)),
                             hours=H(sum(c["dur"] for c in calls if c["dur"] >= 590 and c["cat"] in HEAVY + ("waiting (sleep/until)",)))),
    prepush_lock_waits=dict(calls=sum(1 for c in calls if c["lock_wait"]), hours=H(sum(c["lock_wait"] for c in calls))),
    disk_guard_refusals=sum(c["disk_refused"] for c in calls), qa_timeouts=sum(c["qa_timeout"] for c in calls),
    median_min_by_others_building={f"{k[0]}, others {k[1]}": dict(n=len(v), median_min=round(med(v) / 60, 1), p90_min=round(p90(v) / 60, 1))
                                   for k, v in sorted(conc.items())})

if args.json:
    json.dump(rep, sys.stdout, indent=1); print(); sys.exit(0)

d0 = datetime.datetime.fromtimestamp(START).strftime("%m-%d %H:%M"); d1 = datetime.datetime.fromtimestamp(END).strftime("%m-%d %H:%M")
print(f"# Dev time, {d0} to {d1}\n")
if "mac" in rep:
    m = rep["mac"]
    print(f"## The Mac ({m['samples']} minutes sampled)\n")
    print(f"- Load at or over its {m['cores']:.0f} cores: {m['overloaded_pct']}% of minutes (median load {m['median_load']})")
    print(f"- Under 20% memory free: {m['low_memory_pct']}% of minutes. Most swap: {m['max_swap_mb']:.0f} MB. Least disk free: {m['min_disk_free_gb']:.0f} GB")
    print(f"- Median Claude processes: {m['median_claude_processes']:.0f}; median xcodebuilds: {m['median_xcodebuilds']:.0f}\n")
if by_tool:
    print("## Script runs (exact)\n\n| script | runs | hours | median | p90 | failed | lock wait | same run again | median by load |\n|---|---|---|---|---|---|---|---|---|")
    for t, v in by_tool.items():
        bl = "; ".join(f"{k}: {x['median_s']:.0f} s (n={x['n']})" for k, x in v["median_s_by_load"].items())
        print(f"| {t} | {v['runs']} | {v['hours']} | {v['median_s']:.0f} s | {v['p90_s']:.0f} s | {v['failed']} ({v['failed_hours']} h) | {v['lock_wait_hours']} h | {v['same_run_again']} ({v['same_run_again_hours']} h) | {bl} |")
    print()
a = rep["agents"]
print(f"## Agents ({a['transcripts']} transcripts, {a['calls']} tool calls)\n")
print(f"- Agent time in tools: {a['hours']} h. Clock time with a build or test running: {a['wall_hours_building']} h")
print(f"- Same build or test asked for again in a session: {a['same_build_again']['runs']} runs, {a['same_build_again']['hours']} h")
print(f"- Calls that ran into the 10-minute tool limit: {a['hit_10_min_tool_cap']['calls']} ({a['hit_10_min_tool_cap']['hours']} h)")
print(f"- Waiting for the prepush lock: {a['prepush_lock_waits']['calls']} calls, {a['prepush_lock_waits']['hours']} h")
print(f"- Prepush refused for disk space: {a['disk_guard_refusals']}. qa-test timeouts: {a['qa_timeouts']}\n")
print("| what | calls | hours | failed |\n|---|---|---|---|")
for k, v in list(a["by_category"].items())[:16]:
    print(f"| {k} | {v['calls']} | {v['hours']} | {str(v['failed']) + ' (' + str(v['failed_hours']) + ' h)' if v['failed'] else ''} |")
if a["median_min_by_others_building"]:
    print("\n| run, while other sessions build | n | median min | p90 min |\n|---|---|---|---|")
    for k, v in a["median_min_by_others_building"].items():
        print(f"| {k} | {v['n']} | {v['median_min']} | {v['p90_min']} |")
