#!/usr/bin/env python3
"""The board benchmark's numbers (scripts/board-perf.sh) as a table, idle and loaded side by side.

  table.py build/board-perf                       the table of results-idle.json and results-loaded.json
  table.py build/board-perf --check BASELINE      exits 1 when a number is more than 20% worse than the
                                                  baseline's (and worse by more than a little: 1 ms, 2 points)
  table.py build/board-perf --save BASELINE       keeps these numbers as the baseline
  table.py build/board-perf --compare before      before (before-idle.json, before-loaded.json) and
                                                  after (the results), idle and loaded, side by side
"""
import json, os, statistics, sys

def load(folder, label, prefix="results"):
    p = os.path.join(folder, f"{prefix}-{label}.json")
    return json.load(open(p)) if os.path.exists(p) else None

def get(d, *path):
    for k in path:
        if d is None:
            return None
        d = d.get(k) if isinstance(d, dict) else None
    return d

def med(xs):
    xs = [x for x in (xs or []) if isinstance(x, (int, float)) and x >= 0]
    return round(statistics.median(xs), 1) if xs else None

def runs(result, n):
    out = {}
    for r in (result or {}).get("runs", []):
        if r.get("n") == n:
            out[r["subject"]] = r
    return out

def per_move(s):
    moving = get(s, "trafficMoving") or {}
    moves = get(s, "moves") or 0
    sent = (moving.get("canvas") or 0) + (moving.get("data") or 0)
    return round(sent / moves, 2) if moves else (sent if moving else None)

def per_frame(s):
    moving = get(s, "trafficMoving") or {}
    frames = get(s, "frames", "n") or 0
    sent = (moving.get("canvas") or 0) + (moving.get("data") or 0)
    return round(sent / frames, 2) if frames else None

def soak_growth(r):
    mb = get(r, "soak", "webMB") or []
    return (mb[-1] - mb[0]) if len(mb) >= 2 else None

def soak_last_minutes(r):
    """Growth over the soak's second half (MB): the drawing grows a little; a leak keeps on."""
    mb = get(r, "soak", "webMB") or []
    if len(mb) < 4:
        return None
    return mb[-1] - mb[len(mb) // 2]

# (name, target text, function of a subject's run, check(value) -> bool or None, lower is better, slack)
def metrics(n):
    rows = [
        ("Pencil: pointer to ink p95 (ms)", "≤ 16", lambda r: get(r, "scenarios", "freedraw", "latency", "p95"), lambda v: v <= 16, 1.0),
        ("Pencil: frame p95 (ms)", "≤ 16.7 (≤ 8.3 at 120 Hz)", lambda r: get(r, "scenarios", "freedraw", "frames", "p95"), None, 1.0),
        ("Pencil: frames a second", "", lambda r: get(r, "scenarios", "freedraw", "frames", "fps"), None, None),
        ("Pencil: frames dropped", "", lambda r: (lambda f: f"{f.get('dropped')} of {f.get('n')}" if f and "dropped" in f else None)(get(r, "scenarios", "freedraw", "frames")), None, None),
        ("Pan: frame p95 (ms)", "≤ 16.7", lambda r: get(r, "scenarios", "pan", "frames", "p95"), lambda v: v <= 16.7, 1.0),
        ("Pan: page held up, longest (ms)", "≤ 50", lambda r: get(r, "scenarios", "pan", "held", "max"), lambda v: v <= 50, 4),
        ("Pinch zoom: frame p95 (ms)", "≤ 16.7", lambda r: get(r, "scenarios", "zoom", "frames", "p95"), lambda v: v <= 16.7, 1.0),
        ("Pinch zoom: page held up, longest (ms)", "≤ 50", lambda r: get(r, "scenarios", "zoom", "held", "max"), lambda v: v <= 50, 4),
        ("Drag 20 shapes: frame p95 (ms)", "≤ 16.7", lambda r: get(r, "scenarios", "drag", "frames", "p95"), lambda v: v <= 16.7, 1.0),
        ("Pencil: messages to the app per pointer move", "0", lambda r: per_move(get(r, "scenarios", "freedraw")), lambda v: v == 0, 0.0),
        ("Drag: messages to the app per frame", "0", lambda r: per_frame(get(r, "scenarios", "drag")), lambda v: v == 0, 0.0),
        ("Pan: messages to the app per frame", "0", lambda r: per_frame(get(r, "scenarios", "pan")), None, 0.0),
        ("App main thread: longest task, stroke and save (ms)", "≤ 8", lambda r: get(r, "scenarios", "freedraw", "main", "max"), lambda v: v <= 8, 2),
        ("App main thread: tasks over 8 ms, stroke and save", "0", lambda r: get(r, "scenarios", "freedraw", "main", "over8"), lambda v: v == 0, 1),
        ("App main thread: longest task, drag (ms)", "", lambda r: get(r, "scenarios", "drag", "main", "max"), None, 2),
        ("App main thread: longest task, pan and zoom (ms)", "", lambda r: max([x for x in [get(r, "scenarios", "pan", "main", "max"), get(r, "scenarios", "zoom", "main", "max")] if x is not None], default=None), None, 2),
        ("App CPU while drawing (% of a core)", "≤ 10 over plain", lambda r: get(r, "scenarios", "freedraw", "appCPU"), None, 5),
        ("Web content CPU while drawing (% of a core)", "", lambda r: get(r, "scenarios", "freedraw", "webCPU"), None, 10),
        ("Page work per frame, pencil p95 (ms)", "", lambda r: get(r, "scenarios", "freedraw", "work", "p95"), None, 1.0),
    ]
    if n == min(SIZES):
        rows += [
            ("Open, first after launch (ms)", "≤ 800", lambda r: get(r, "openCold"), lambda v: v <= 800, 50),
            ("Open again, median (ms)", "≤ 300", lambda r: med(get(r, "openWarm")), lambda v: v <= 300, 30),
        ]
    else:
        rows += [("Open again, median (ms)", "", lambda r: med(get(r, "openWarm")), None, 30)]
    rows += [
        ("Switch board to board, median (ms)", "≤ 150", lambda r: med(get(r, "switch")), lambda v: v <= 150, 20),
        ("App main thread: longest task opening (ms)", "", lambda r: max(get(r, "switchMainMax") or [0]) if get(r, "switchMainMax") else None, None, 10),
        ("Web content memory (MB)", "< 400" if n == max(SIZES) else "", lambda r: get(r, "webMB"), (lambda v: v < 400) if n == max(SIZES) else None, 40),
        ("Web content memory, left alone 10 s (MB)", "< 400" if n == max(SIZES) else "", lambda r: get(r, "webMBSettled"), (lambda v: v < 400) if n == max(SIZES) else None, 40),
    ]
    if n == max(SIZES):
        rows += [
            ("Memory over the drawing soak: first → last (MB)", "no growth", lambda r: (lambda mb: f"{mb[0]} → {mb[-1]}" if mb else None)(get(r, "soak", "webMB")), None, None),
            ("Memory growth, second half of the soak (MB)", "≈ 0", soak_last_minutes, lambda v: v <= 25, 25),
        ]
    return rows

# A scenario measured while WebKit held the page back as idle (frames halved, and before the bench
# turned WebKit's idle throttles off, timers a second late: a fault of the bench, never the
# board's) shows as "throttled", and isn't compared.
SCENARIO_OF = (("Pencil", "freedraw"), ("App main thread: longest task, stroke", "freedraw"), ("App main thread: tasks over 8 ms, stroke", "freedraw"),
               ("App CPU while drawing", "freedraw"), ("Web content CPU while drawing", "freedraw"), ("Page work per frame, pencil", "freedraw"),
               ("Pan", "pan"), ("Pinch zoom", "zoom"), ("Drag", "drag"), ("App main thread: longest task, drag", "drag"))

def throttled(run, name):
    for prefix, scen in SCENARIO_OF:
        if name.startswith(prefix):
            s = get(run, "scenarios", scen)
            if not s:
                return False
            # Newer runs probe the page before each scenario; the first baseline had no probe.
            return (not s["awake"]) if "awake" in s else (get(s, "held", "p95") or 0) >= 500
    return False

class Held:
    """A number measured while the page was held back as idle: shown with a *, never compared."""
    def __init__(self, v): self.v = v

def fmt(v):
    if v is None:
        return "–"
    if isinstance(v, Held):
        return "–" if v.v is None else fmt(v.v) + "*"
    if isinstance(v, float):
        return f"{v:.1f}" if abs(v) >= 10 or v == int(v) else f"{v:.2f}"
    return str(v)

def same_rate(rs):
    """Plain Excalidraw at the board's own frame rate: 120 Hz when the board drew at 120."""
    p50 = get(rs.get("pinto"), "scenarios", "pan", "frames", "p50") or 16.7
    return rs.get("plain120") if p50 < 12 and "plain120" in rs else rs.get("plain")

def machine(result):
    b = (result or {}).get("before") or {}
    a = (result or {}).get("after") or {}
    if not b:
        return "–"
    idle = lambda m: f", user idle {m['userIdle']} s" if "userIdle" in m else ""
    return f"{b.get('cores')} cores, {b.get('freeGB')} of {b.get('memoryGB')} GB free, load {', '.join(str(x) for x in b.get('load', []))}{idle(b)} (after: free {a.get('freeGB')} GB, load {a.get('load', ['?'])[0]}{idle(a)})"

def met_of(name, ok, cells):
    """Whether the target is met in every (run, value) of `cells` that has a number."""
    if name.startswith("Pencil: frame p95"):
        checks = []
        for run, v in cells:
            if isinstance(v, (int, float)):
                hz120 = (get(run, "scenarios", "pan", "frames", "p50") or 16.7) < 12
                # WebKit's clock has 1 ms steps: a frame on time at 120 Hz (8.3 ms) reads 8 or 9.
                checks.append(v <= (9 if hz120 else 16.7))
        return ("yes" if all(checks) else "no") if checks else ""
    if ok is None:
        return ""
    checks = [ok(v) for _, v in cells if isinstance(v, (int, float))]
    return ("yes" if all(checks) else "no") if checks else ""

def parity(rs, p):
    """The board's worst ratio to plain Excalidraw (same rate, same load): ink latency and frame times."""
    worst = None
    for path in (("freedraw", "latency", "p95"), ("freedraw", "frames", "p95"), ("pan", "frames", "p95"), ("zoom", "frames", "p95"), ("drag", "frames", "p95")):
        if any(throttled(x, {"freedraw": "Pencil", "pan": "Pan", "zoom": "Pinch zoom", "drag": "Drag"}[path[0]]) for x in (rs.get("pinto"), p)):
            continue
        a, b = get(rs.get("pinto"), "scenarios", *path), get(p, "scenarios", *path)
        if isinstance(a, (int, float)) and isinstance(b, (int, float)) and b > 0:
            worst = max(worst or 0, a / b)
    return worst

def compare(folder, prefix):
    bi, bl = load(folder, "idle", prefix), load(folder, "loaded", prefix)
    ai, al = load(folder, "idle"), load(folder, "loaded")
    lines = [f"Before, idle: {machine(bi)}  ", f"Before, loaded: {machine(bl)}  ", f"After, idle: {machine(ai)}  ", f"After, loaded: {machine(al)}", ""]
    for n in SIZES:
        rbi, rbl, rai, ral = runs(bi, n), runs(bl, n), runs(ai, n), runs(al, n)
        pai, pal = same_rate(rai), same_rate(ral)
        lines.append(f"### {n} elements")
        lines.append("")
        lines.append("| | Target | Before idle | After idle | Before loaded | After loaded | Plain idle | Plain loaded | Met after |")
        lines.append("|---|---|---|---|---|---|---|---|---|")
        for name, target, f, ok, _ in [(m[0], m[1], m[2], m[3], m[4]) for m in metrics(n)]:
            cells = (rbi.get("pinto"), rai.get("pinto"), rbl.get("pinto"), ral.get("pinto"), pai, pal)
            vals = [Held(f(run)) if throttled(run, name) else f(run) for run in cells]
            met = met_of(name, ok, ((rai.get("pinto"), vals[1]), (ral.get("pinto"), vals[3])))
            lines.append(f"| {name} | {target} | " + " | ".join(fmt(v) for v in vals) + f" | {met} |")
        cells = []
        for rs, p in ((rbi, same_rate(rbi)), (rai, pai), (rbl, same_rate(rbl)), (ral, pal)):
            w = parity(rs, p)
            cells.append(f"{w:.2f}×" if w is not None else "–")
        after = [w for w in (parity(rai, pai), parity(ral, pal)) if w is not None]
        lines.append(f"| Worst ratio to plain Excalidraw (frames, ink) | ≤ 1.10× | " + " | ".join(cells) + f" | | | {('yes' if all(w <= 1.10 for w in after) else 'no') if after else ''} |")
        lines.append("")
    lines.append("Plain: plain Excalidraw 0.18.1, the same scene and scripted input, at the board's own frame rate, in the after runs.  ")
    lines.append("Pencil frame p95 at 120 Hz: WebKit's performance.now() has 1 ms steps, so a frame on time (8.3 ms) reads 8 or 9; 9 is met.  ")
    lines.append("\\* Measured while WebKit held the page back as idle (frames halved; before 16 November 2026 also timers a second late): not compared. In the first baseline, which had no probe for it, any scenario with the page held up over 500 ms at p95.")
    return "\n".join(lines)

def table(folder):
    idle, loaded = load(folder, "idle"), load(folder, "loaded")
    lines = []
    lines.append(f"Idle: {machine(idle)}  ")
    lines.append(f"Loaded: {machine(loaded)}")
    lines.append("")
    for n in SIZES:
        ri, rl = runs(idle, n), runs(loaded, n)
        pi, pl = same_rate(ri), same_rate(rl)
        lines.append(f"### {n} elements")
        lines.append("")
        lines.append("| | Target | Pinto idle | Plain idle | Pinto loaded | Plain loaded | Met |")
        lines.append("|---|---|---|---|---|---|---|")
        for name, target, f, ok, _, in [(m[0], m[1], m[2], m[3], m[4]) for m in metrics(n)]:
            vals = [Held(f(run)) if throttled(run, name) else f(run) for run in (ri.get("pinto"), pi, rl.get("pinto"), pl)]
            met = ""
            if ok is not None:
                checks = [ok(v) for v in (vals[0], vals[2]) if isinstance(v, (int, float))]
                met = ("yes" if all(checks) else "no") if checks else ""
            if name.startswith("Pencil: frame p95"):
                met = met_of(name, ok, ((ri.get("pinto"), vals[0]), (rl.get("pinto"), vals[2])))
            lines.append(f"| {name} | {target} | " + " | ".join(fmt(v) for v in vals) + f" | {met} |")
        # Parity: the board's frame times and ink latency against plain Excalidraw's (same rate, same load).
        par = []
        for label, rs, p in (("idle", ri, pi), ("loaded", rl, pl)):
            worst = None
            for path in (("freedraw", "latency", "p95"), ("freedraw", "frames", "p95"), ("pan", "frames", "p95"), ("zoom", "frames", "p95"), ("drag", "frames", "p95")):
                if any(throttled(x, {"freedraw": "Pencil", "pan": "Pan", "zoom": "Pinch zoom", "drag": "Drag"}[path[0]]) for x in (rs.get("pinto"), p)):
                    continue
                a, b = get(rs.get("pinto"), "scenarios", *path), get(p, "scenarios", *path)
                if isinstance(a, (int, float)) and isinstance(b, (int, float)) and b > 0:
                    worst = max(worst or 0, a / b)
            if worst is not None:
                par.append(f"{label} {worst:.2f}×")
        lines.append(f"| Worst ratio to plain Excalidraw (frames, ink) | ≤ 1.10× | {' · '.join(par) or '–'} | | | | {'yes' if par and all(float(x.split()[1][:-1]) <= 1.10 for x in par) else ('no' if par else '')} |")
        lines.append("")
    lines.append("Pencil frame p95 at 120 Hz: WebKit's performance.now() has 1 ms steps, so a frame on time (8.3 ms) reads 8 or 9; 9 is met.  ")
    lines.append("\\* Measured while WebKit held the page back as idle (frames halved; before 16 November 2026 also timers a second late): not compared. In the first baseline, which had no probe for it, any scenario with the page held up over 500 ms at p95.")
    return "\n".join(lines)

def flat(folder):
    """Every number the check watches, by name: lower is better for all of them."""
    out = {}
    for label in ("idle", "loaded"):
        res = load(folder, label)
        for n in SIZES:
            r = runs(res, n).get("pinto")
            if not r:
                continue
            for name, _, f, _, slack in metrics(n):
                if throttled(r, name):
                    continue
                v = f(r)
                if isinstance(v, (int, float)) and slack is not None:
                    out[f"{label} {n} {name}"] = (v, slack)
    return out

def check(folder, baseline):
    base = json.load(open(baseline))
    now = flat(folder)
    worse = []
    for k, (v, slack) in now.items():
        if k not in base:
            continue
        b = base[k]
        if v > b * 1.2 and v - b > slack:
            worse.append(f"{k}: {fmt(b)} → {fmt(v)}")
    print("\n".join(worse) if worse else f"No number more than 20% worse than {baseline} ({len(now)} compared).")
    return 1 if worse else 0

SIZES = [500, 2000]

if __name__ == "__main__":
    folder = sys.argv[1]
    prefixes = ["results"] + ([sys.argv[3]] if len(sys.argv) > 3 and sys.argv[2] == "--compare" else [])
    SIZES = sorted({r["n"] for p in prefixes for label in ("idle", "loaded") for r in (load(folder, label, p) or {}).get("runs", [])}) or SIZES
    if len(sys.argv) > 3 and sys.argv[2] == "--compare":
        print(compare(folder, sys.argv[3]))
        sys.exit(0)
    if len(sys.argv) > 3 and sys.argv[2] == "--check":
        sys.exit(check(folder, sys.argv[3]))
    if len(sys.argv) > 3 and sys.argv[2] == "--save":
        json.dump({k: v for k, (v, _) in flat(folder).items()}, open(sys.argv[3], "w"), indent=1, sort_keys=True)
        print(f"Saved {sys.argv[3]}")
        sys.exit(0)
    print(table(folder))
