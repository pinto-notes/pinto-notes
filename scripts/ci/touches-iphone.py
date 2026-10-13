#!/usr/bin/env python3
"""Whether a change touches what the iPhone app compiles: scripts/ci/touches-iphone.py <changed path>...

Prints "yes <the first such path>" or "no". The iPhone app is built from Pane/ (all of it; a Swift
file wrapped whole in `#if os(macOS)` compiles to nothing there), PaneShare/, PaneTests/ (the iPhone test build), the project
(project.yml, Pane.xcodeproj/), Config/ and the Swift packages. Scripts, docs, the site and
the server are not in it. A file that is gone counts as touched: removing it changes the build.
"""
import os, re, sys

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def mac_only(path):
    """A Swift file whose code is one `#if os(macOS)` ... `#endif` with no #else for other platforms."""
    try:
        text = open(os.path.join(root, path), errors="replace").read()
    except FileNotFoundError:
        return False
    code = [l.strip() for l in text.splitlines() if l.strip() and not l.strip().startswith("//")]
    if not code or code[0] != "#if os(macOS)" or code[-1] != "#endif":
        return False
    depth = 0
    for i, l in enumerate(code):
        if l.startswith("#if"):
            depth += 1
        elif l.startswith(("#else", "#elseif")) and depth == 1:
            return False
        elif l.startswith("#endif"):
            depth -= 1
            if depth == 0 and i != len(code) - 1:
                return False
    return True

for p in sys.argv[1:]:
    ios = (p.startswith(("Pane/", "PaneShare/", "PaneTests/", "Config/", "Pane.xcodeproj/")) or p == "project.yml"
           or p.endswith("Package.resolved"))
    if ios and not (p.startswith(("Pane/", "PaneTests/")) and p.endswith(".swift") and mac_only(p)):
        print("yes", p)
        sys.exit(0)
print("no")
