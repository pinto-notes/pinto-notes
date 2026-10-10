#!/usr/bin/env python3
"""Which tests a pull request runs before it merges: scripts/ci/select-tests.py <file of changed paths>

Prints xcodebuild's -only-testing arguments, one per line, and says on stderr what it chose and why.
Everything else runs on dev after the merge (the full suite), so this is about being fast and
catching the likely breakage, not about being complete.

In this order, until about 90 seconds of known test time is planned:
  1. the smoke set: one test for each bug that got out before (scripts/ci/smoke-tests.txt), always
  2. the suites in the test files the change touches, always
  3. suites named after a changed file (Foo.swift -> FooTests)
  4. suites whose test file names a type the changed files declare, quickest first
Suites that time things (PaneTests/Perf) and the ones in scripts/ci/after-merge-suites.txt (they wait
on real time by design) are only picked by rule 2. Times come from scripts/ci/suite-times.json, which
the run on dev rewrites; an unknown suite counts as 5 seconds.
"""
import glob, json, os, re, sys

BUDGET = float(os.environ.get("PANE_LANE_TEST_SECONDS", "90"))
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(os.path.dirname(here))
changed = [l.strip() for l in open(sys.argv[1]) if l.strip()]

def lines(name):
    try:
        return [l.split("#")[0].strip() for l in open(os.path.join(here, name)) if l.split("#")[0].strip()]
    except FileNotFoundError:
        return []
smoke = lines("smoke-tests.txt")
after_merge = set(lines("after-merge-suites.txt"))
try:
    times = json.load(open(os.path.join(here, "suite-times.json")))
except FileNotFoundError:
    times = {}
cost = lambda suite: float(times.get(suite, 5))

decl = re.compile(r"^\s*(?:@[\w.]+(?:\([^)]*\))?\s+)*(?:(?:public|private|fileprivate|final|internal|nonisolated)\s+)*(?:struct|class|enum|actor|protocol)\s+(\w+)", re.M)
suites_in, text_of = {}, {}
for f in glob.glob(os.path.join(root, "PaneTests/**/*.swift"), recursive=True):
    rel = os.path.relpath(f, root)
    text = open(f, errors="replace").read()
    text_of[rel] = text
    # A suite: a type the last full run timed, or one named like a suite (a new one has no time yet).
    suites_in[rel] = [n for n in decl.findall(text) if "@Test" in text and (n in times or re.search(r"(Tests?|Snapshots|Shots)$", n))]
perf = {s for f, ss in suites_in.items() if f.startswith("PaneTests/Perf/") for s in ss}
all_suites = {s for ss in suites_in.values() for s in ss}

chosen, why, planned = [], {}, 0.0
def take(suite, reason, always=False):
    global planned
    if suite in why or suite not in all_suites:
        return
    if not always and (planned + cost(suite) > BUDGET or suite in perf or suite in after_merge):
        return
    why[suite] = reason
    chosen.append(suite)
    planned += cost(suite)

smoke_cost = 0.0
for f in changed:                                   # 2
    for s in suites_in.get(f, []):
        take(s, f"its file changed ({f})", always=True)
sources = [f for f in changed if f.endswith(".swift") and (f.startswith("Pane/") or f.startswith("PaneShare/"))]
for f in sources:                                   # 3
    stem = os.path.splitext(os.path.basename(f))[0]
    for s in sorted(all_suites):
        if s in (stem + "Tests", stem + "Test"):
            take(s, f"named after {f}")
names = set()
for f in sources:                                   # 4
    try:
        text = open(os.path.join(root, f), errors="replace").read()
    except FileNotFoundError:
        continue
    names |= {n for n in set(decl.findall(text)) | set(re.findall(r"^\s*extension\s+(\w+)", text, re.M)) if len(n) > 3}
left = []
if names:
    rx = re.compile(r"\b(" + "|".join(map(re.escape, sorted(names))) + r")\b")
    for f, text in text_of.items():
        if rx.search(text):
            left += [s for s in suites_in[f] if s not in why]
skipped = []
for s in sorted(set(left), key=cost):
    before = len(chosen)
    take(s, "names a type the change declares")
    if len(chosen) == before:
        skipped.append(s)

for t in smoke:                                     # 1 (single tests: Suite/test())
    if t.split("/")[0] not in why:
        print(f"-only-testing:PaneTests/{t}")
for s in chosen:
    print(f"-only-testing:PaneTests/{s}")
print(f"{len(smoke)} smoke tests; {len(chosen)} suites, about {planned:.0f} s of them planned (limit {BUDGET:.0f} s):", file=sys.stderr)
for s in chosen:
    print(f"  {s} ({cost(s):.0f} s): {why[s]}", file=sys.stderr)
if skipped:
    print(f"left for the run on dev after the merge ({len(skipped)}): " + ", ".join(skipped[:40]), file=sys.stderr)
