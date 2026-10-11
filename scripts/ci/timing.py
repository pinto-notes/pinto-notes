#!/usr/bin/env python3
"""How long CI takes, from the runs themselves:
scripts/ci/timing.py [runs=40] [--limit-pr minutes] [--limit-merge minutes]

For the last finished `ci` runs: each job and each step over 10 seconds (median and worst, in
minutes), how long jobs waited for a runner, and the whole run from created to last job done,
week by week. Needs `gh` signed in (in a workflow: GH_TOKEN with actions: read).

CI has two shapes (.github/workflows/ci.yml) and they are counted apart: a pull request that is
ready for review runs one Mac job, the tests for the change; a merge into dev or main runs
everything, five Mac jobs side by side. Runs with no Mac job (drafts, changes outside the app)
are the third column, and runs from before the two shapes the fourth.

With a limit, exits 1 when the median whole run of this week's runs of that shape is over that
many minutes: the weekly workflow (.github/workflows/ci-timing.yml) uses both so a slow creep is
seen. In a workflow the table also goes to the job summary.
"""
import json, os, statistics as st, subprocess, sys
from datetime import datetime, timedelta, timezone

REPO = os.environ.get("GITHUB_REPOSITORY", "pinto-notes/pinto-notes")
count = next((int(a) for a in sys.argv[1:] if a.isdigit()), 40)
def flag(name):
    return float(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else None
limits = {"pr": flag("--limit-pr"), "merge": flag("--limit-merge")}
SHAPES = {"pr": "Pull requests (the tests for the change)", "merge": "After a merge (everything)", "other": "No Mac job", "old": "One Mac job for everything (until 10 October 2026)"}
# The Mac job of each shape, by its name in ci.yml.
LANE, MERGE = "The tests for this change", "After merge,"

def gh(*args):
    return json.loads(subprocess.run(["gh", *args], capture_output=True, text=True, check=True).stdout)

def t(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")) if s and not s.startswith("0001") else None

runs = [r for r in gh("run", "list", "-R", REPO, "--workflow", "ci.yml", "-L", str(count * 2), "--json", "databaseId,status,conclusion,event")
        if r["status"] == "completed" and r["conclusion"] in ("success", "failure")][:count]
jobs, steps, waits, weeks = {}, {}, {}, {}
for r in runs:
    run = gh("run", "view", str(r["databaseId"]), "-R", REPO, "--json", "jobs,createdAt,attempt")
    created, ends, shape = t(run["createdAt"]), [], "other"
    for job in run["jobs"]:
        start, end = t(job.get("startedAt")), t(job.get("completedAt"))
        if job["conclusion"] not in ("success", "failure") or not start or not end:
            continue
        ends.append(end)
        jobs.setdefault(job["name"], []).append((end - start).total_seconds() / 60)
        timed = [s for s in job.get("steps", []) if t(s.get("startedAt")) and t(s.get("completedAt"))]
        if timed and run.get("attempt", 1) == 1:
            waits.setdefault(job["name"], []).append((t(timed[0]["startedAt"]) - created).total_seconds() / 60)
        for s in timed:
            steps.setdefault((job["name"], s["name"]), []).append((t(s["completedAt"]) - t(s["startedAt"])).total_seconds() / 60)
        if job["name"].startswith(MERGE) and r["event"] == "push":
            shape = "merge"
        elif job["name"].startswith(LANE) and shape == "other":
            shape = "pr"
        # Before the two shapes, "App tests (macOS)" did the work itself; now it only gathers results.
        elif job["name"] == "App tests (macOS)" and shape == "other" and (end - start).total_seconds() > 60:
            shape = "old"
    # A re-run's clock starts at the first attempt: only first attempts say how long a run took.
    if ends and run.get("attempt", 1) == 1:
        monday = (created - timedelta(days=created.weekday())).date().isoformat()
        weeks.setdefault(monday, {k: [] for k in SHAPES})[shape].append((max(ends) - created).total_seconds() / 60)

def row(*cells):
    return "| " + " | ".join(str(c) for c in cells) + " |"
def med(v):
    return f"{st.median(v):.1f}" if v else ""
out = [f"## CI timing, last {len(runs)} finished runs ({datetime.now(timezone.utc):%Y-%m-%d})", "",
       "Whole run, created to last job done, minutes (first attempts only):", "",
       row("Week of", *[c for name in SHAPES.values() for c in (name, "median", "worst")]), row(*["---"] * (1 + 3 * len(SHAPES)))]
for week in sorted(weeks):
    out.append(row(week, *[c for v in weeks[week].values() for c in (len(v), med(v), f"{max(v):.1f}" if v else "")]))
out += ["", row("Job", "runs", "median", "worst", "waited for a runner: median", "worst"), row(*["---"] * 6)]
for name, v in sorted(jobs.items(), key=lambda x: -st.median(x[1])):
    w = waits.get(name, [])
    out.append(row(name, len(v), med(v), f"{max(v):.1f}", med(w), f"{max(w):.1f}" if w else ""))
out += ["", row("Step (over 10 s)", "runs", "median", "worst"), row(*["---"] * 4)]
for (job, name), v in sorted(steps.items(), key=lambda x: -st.median(x[1])):
    if st.median(v) >= 10 / 60:
        out.append(row(f"{job}: {name}", len(v), med(v), f"{max(v):.1f}"))
text = "\n".join(out)
print(text)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    open(os.environ["GITHUB_STEP_SUMMARY"], "a").write(text + "\n")
over = False
for shape, limit in limits.items():
    latest = weeks[max(weeks)][shape] if weeks else []
    if limit is not None and latest and st.median(latest) > limit:
        print(f"\n{SHAPES[shape]}: this week's runs took {st.median(latest):.1f} minutes (median of {len(latest)}); the limit is {limit:g}.")
        over = True
sys.exit(1 if over else 0)
