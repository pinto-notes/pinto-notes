#!/usr/bin/env python3
"""Where the main thread's time went in a whole-run sample (AMBER_GATE_PROFILE=1, see launch.zsh).

    scripts/release-gate/profile.py <dSYM DWARF file> <sample report>... [--top 60] [--match text] [--exclude text]

Prints the functions the main thread spent the most samples in (inclusive: a function and what it
called), each counted once per stack, with the app's frames named from the archive's dSYM; several
reports (the gate's hang samples, AMBER_GATE_KEEP_SAMPLES=1) are added together. Samples
spent waiting for the next event don't count. `--match` keeps only the stacks through a frame
containing that text and counts what it called, to read one flow (for example `LibraryNotes.load`); `--exclude` drops the stacks through a frame
containing that text.
"""
import re
import subprocess
import sys
from collections import Counter, defaultdict

args = sys.argv[1:]
top = 60
match = None
if "--top" in args:
    i = args.index("--top"); top = int(args[i + 1]); del args[i:i + 2]
exclude = None
if "--exclude" in args:
    i = args.index("--exclude"); exclude = args[i + 1]; del args[i:i + 2]
if "--match" in args:
    i = args.index("--match"); match = args[i + 1]; del args[i:i + 2]
dsym, reports = args[0], args[1:]
IDLE = re.compile(r"__CFRunLoopServiceMachPort|mach_msg2_trap|__psynch_cvwait|__semwait_signal|kevent")
APP = re.compile(r"\?\?\?  \(in Amber Notes Beta\)  load address (0x[0-9a-f]+) \+ 0x[0-9a-f]+  \[(0x[0-9a-f]+)\]")


def tree(report):
    """The main thread's call tree in a `sample` report: (depth, count, frame) in order."""
    text = open(report, errors="replace").read()
    main = next((t for t in re.split(r"\n(?=    \d+ Thread_)", text) if "com.apple.main-thread" in t or "Main Thread" in t.split("\n", 1)[0]), "")
    out = []
    for line in main.split("\n")[1:]:
        m = re.match(r"^([ +!:|]*)(\d+) (.*)$", line)
        if m:
            out.append((len(m.group(1)), int(m.group(2)), m.group(3)))
    return out


trees = [tree(r) for r in reports]
# App addresses named with atos, once per load address.
by_load = defaultdict(set)
for nodes in trees:
    for _, _, f in nodes:
        a = APP.search(f)
        if a:
            by_load[a.group(1)].add(a.group(2))
names = {}
for load, addrs in by_load.items():
    addrs = sorted(addrs)
    out = subprocess.run(["atos", "-o", dsym, "-arch", "arm64", "-l", load, *addrs], capture_output=True, text=True).stdout.split("\n")
    names.update({(load, a): re.sub(r"\s*\(in Amber Notes Beta\)", "", n).strip() for a, n in zip(addrs, out)})


def name(f):
    a = APP.search(f)
    if a:
        n = names.get((a.group(1), a.group(2)), f)
        return "APP " + re.sub(r" \(\S+\.swift:\d+\)$", "", n)
    return re.sub(r"\s+\+ \d+$", "", re.sub(r"\s+\[0x[0-9a-f]+\]$", "", f)).replace("  (in ", " (in ")


inclusive = Counter()
selfc = Counter()
busy = 0
total = 0
# Leaves give the samples: a node's own samples are its count minus its children's.
for nodes in trees:
    total += nodes[0][1] if nodes else 0
    children = defaultdict(int)
    parents = []
    stack = []
    for i, (d, c, f) in enumerate(nodes):
        while stack and nodes[stack[-1]][0] >= d:
            stack.pop()
        parents.append(stack[-1] if stack else None)
        if stack:
            children[stack[-1]] += c
        stack.append(i)
    for i, (d, c, f) in enumerate(nodes):
        own = c - children[i]
        if own <= 0:
            continue
        path = []
        j = i
        while j is not None:
            path.append(name(nodes[j][2]))
            j = parents[j]
        if any(IDLE.search(p) for p in path):
            continue
        if exclude and any(exclude in p for p in path):
            continue
        if match:
            # Only what the matched frame called (and the frame itself): the callers above it are the same for every stack.
            hit = next((k for k, p in enumerate(path) if match in p), None)
            if hit is None:
                continue
            path = path[:hit + 1]
        busy += own
        selfc[path[0]] += own
        for p in set(path):
            inclusive[p] += own

print(f"main thread: {busy} busy samples of {total} in {len(trees)} report(s){' through ' + match if match else ''}\n")
print("inclusive  self  function")
for f, c in inclusive.most_common(top * 3):
    if f.startswith("APP ") or c >= busy * 0.02:
        print(f"{c:9d} {selfc[f]:5d}  {f[:200]}")
