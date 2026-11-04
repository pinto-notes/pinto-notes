#!/usr/bin/env python3
"""One recorded clip for the persona council (scripts/persona-r7-videos.sh):
persona-r7-clip.py <raw.mp4> <recording start, epoch s> <work dir> <out dir> <name> [--timer]

The work dir holds what the test wrote: marks.tsv (moment, epoch s) and NN-moment.png screenshots.
Writes into <out dir>: <name>.mp4 (trimmed from the test's first mark to a second after its last,
H.264 at 30 fps), <name>-contact-sheet.png (a frame a second, labelled), <name>-NN-moment.png (the
test's screenshots) and <name>-moments.tsv (each moment's time in the clip). --timer burns the
clip's own clock into the video, and the time from clock-start to clock-stop once it's reached.

simctl writes its first frame when the screen first changes, seconds after it started, so the
recording's time zero isn't known. It's found from the test's screenshots: each was taken just
after its mark, so the one offset that puts every screenshot on a matching frame is the one used.
The recording start given is only the fallback for a clip with fewer than two screenshots."""
import glob, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageChops, ImageDraw, ImageFont

raw, start, work, out, name = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5]
timer = "--timer" in sys.argv[6:]
# --keys a,b,c: the moments whose screenshots are the clip's key stills; the rest go in more-stills/.
keys = next((a.split("=", 1)[1].split(",") for a in sys.argv[6:] if a.startswith("--keys=")), None)
os.makedirs(out, exist_ok=True)

marks = []  # (moment, epoch s)
if os.path.exists(os.path.join(work, "marks.tsv")):
    for line in open(os.path.join(work, "marks.tsv")):
        parts = line.rstrip("\n").split("\t")
        if len(parts) == 2:
            marks.append((parts[0], float(parts[1])))

# The screenshots, with their marks' times (the NN-moment.png files, in the order taken).
shots, seen = [], {}
for p in sorted(glob.glob(os.path.join(work, "[0-9][0-9]-*.png"))):
    m = os.path.basename(p)[3:-4]
    k = seen.get(m, 0); seen[m] = k + 1
    times = [t for n, t in marks if n == m]
    if k < len(times):
        shots.append((times[k], p))

def zero_from_screenshots():
    """The epoch time of the recording's first frame, or None when the screenshots can't say."""
    if len(shots) < 2:
        return None
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-vf", "fps=10,scale=90:-2,format=gray", os.path.join(tmp, "f%05d.png")], check=True)
    frames = [Image.open(f).convert("L") for f in sorted(glob.glob(os.path.join(tmp, "f*.png")))]
    shutil.rmtree(tmp, ignore_errors=True)
    if not frames:
        return None
    size = frames[0].size
    def diff(a, b):
        h = ImageChops.difference(a, b).histogram()
        return sum(i * c for i, c in enumerate(h)) / (size[0] * size[1])
    curves = []
    for t, p in shots:
        im = Image.open(p).convert("L").resize(size)
        curves.append((t, [diff(im, f) for f in frames]))
    begin = marks[0][1]
    # The first frame from five minutes before the test's first mark (a first run after an erase
    # installs the apps for over a minute) to 10 s after, a tenth at a time.
    # A screenshot lands a moment after its mark (0.3 s here). When a span of offsets fits about
    # as well (a screen that held still), the middle of that span is taken.
    totals = []
    for k in range(-3000, 101):
        zero = begin + k / 10
        total = 0.0
        for t, c in curves:
            i = int(round((t + 0.3 - zero) * 10))
            total += c[i] if 0 <= i < len(c) else 60.0
        totals.append((zero, total))
    j = min(range(len(totals)), key=lambda i: totals[i][1])
    best = totals[j][1]
    near = lambda i: totals[i][1] <= best + 0.4 * len(curves)
    lo = j
    while lo > 0 and near(lo - 1): lo -= 1
    hi = j
    while hi < len(totals) - 1 and near(hi + 1): hi += 1
    zero = (totals[lo][0] + totals[hi][0]) / 2
    print(f"{name}: first frame {zero - begin:+.1f} s from the test's first mark, give or take {(totals[hi][0] - totals[lo][0]) / 2:.1f} s (mismatch {best / len(curves):.1f} a screenshot)")
    return zero

zero = zero_from_screenshots()
if zero is None:
    zero = start
    print(f"{name}: fewer than two screenshots, so the recording's start is the script's guess")
marks = [(m, t - zero) for m, t in marks]
first = {}
for m, t in marks:
    first.setdefault(m, t)

def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0

total = duration(raw)
# From a second before the first screenshot (the app is up by then; the launch before it is dead
# time), or from the test's start.
t0 = max(0.0, (shots[0][0] - zero - 1.0) if shots else first.get("begin", 0.0) - 0.3)
t1 = min(total, first["end"] + 1.0) if "end" in first else total
if t1 <= t0:
    t1 = total
dest = os.path.join(out, f"{name}.mp4")
encode = ["-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"]
scale = "scale=trunc(iw/2)*2:trunc(ih/2)*2"
# Frames at a steady 30 a second first (simctl writes one only when the screen changes), then the cut:
# trimming the recording itself ran on to its next frame, seconds after the end.
cut = f"fps=30,trim=start={t0:.3f}:end={t1:.3f},setpts=PTS-STARTPTS,{scale}"

# Under the screen, a strip with the clip's own clock (so a cut would show) and what the app runs
# on; for --timer, the time from clock-start to clock-stop in its place, gold once it's stopped.
size = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", raw],
                      capture_output=True, text=True).stdout.strip().split(",")
w = int(size[0]) // 2 * 2
strip = int(w * 0.08) // 2 * 2
frames = int(round((t1 - t0) * 30))
mono = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", int(strip * 0.42))
sans = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", int(strip * 0.3))
a = first.get("clock-start", 0.0) - t0
b = first.get("clock-stop", 0.0) - t0
cache = {}
def strip_frame(t):
    clock = f"{int(t // 60)}:{t % 60:04.1f}"
    if timer:
        right, gold = "Launch to five items: " + (f"{b - a:.1f} s" if t >= b else f"{max(0.0, t - a):.1f} s"), t >= b
    else:
        right, gold = "Simulator, test mode: demo notes on the device, no server", False
    key = (clock, right, gold)
    if key not in cache:
        img = Image.new("RGB", (w, strip), (0, 0, 0))
        d = ImageDraw.Draw(img)
        pad = int(strip * 0.35)
        l, tp, r, bt = d.textbbox((0, 0), clock, font=mono)
        d.text((pad - l, (strip - (bt - tp)) // 2 - tp), clock, font=mono, fill=(255, 255, 255))
        f = mono if timer else sans
        l2, tp2, r2, bt2 = d.textbbox((0, 0), right, font=f)
        d.text((w - pad - r2, (strip - (bt2 - tp2)) // 2 - tp2), right, font=f, fill=(255, 214, 120) if gold else (175, 175, 180))
        cache.clear()
        cache[key] = img.tobytes()
    return cache[key]
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-i", raw,
                       "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{strip}", "-r", "30", "-i", "-",
                       "-filter_complex", f"[0:v]{cut},pad=iw:ih+{strip}:0:0:black[p];[p][1:v]overlay=0:main_h-{strip}:shortest=1[v]",
                       "-map", "[v]"] + encode + [dest], stdin=subprocess.PIPE)
for i in range(frames):
    ff.stdin.write(strip_frame(i / 30))
ff.stdin.close()
if ff.wait() != 0:
    sys.exit(f"{name}: ffmpeg failed")
if timer and "clock-stop" in first:
    # The stopped timer with the five items, as a still.
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{b + 0.6:.2f}", "-i", dest, "-frames:v", "1",
                    os.path.join(out, f"{name}-timer-stopped.png")], check=True)

# A frame a second, labelled with its second.
tmp = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", dest, "-vf", "fps=1,scale=240:-2", os.path.join(tmp, "%04d.png")], check=True)
thumbs = sorted(glob.glob(os.path.join(tmp, "*.png")))
if thumbs:
    cols = 8
    first_im = Image.open(thumbs[0])
    tw, th = first_im.size
    label = 26
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tw + 6) + 6, rows * (th + label + 6) + 6), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 18)
    for k, p in enumerate(thumbs):
        x, y = 6 + (k % cols) * (tw + 6), 6 + (k // cols) * (th + label + 6)
        d.text((x + 2, y + 2), f"{k} s", font=f, fill=(20, 20, 20))
        sheet.paste(Image.open(p).convert("RGB"), (x, y + label))
    sheet.save(os.path.join(out, f"{name}-contact-sheet.png"))
shutil.rmtree(tmp, ignore_errors=True)

# The test's screenshots of its key moments (an earlier take's are removed), and when each was in the clip.
more = os.path.join(out, "more-stills")
for p in glob.glob(os.path.join(out, f"{name}-[0-9][0-9]-*.png")) + glob.glob(os.path.join(more, f"{name}-[0-9][0-9]-*.png")):
    os.remove(p)
for p in sorted(glob.glob(os.path.join(work, "[0-9][0-9]-*.png"))):
    key = keys is None or os.path.basename(p)[3:-4] in keys
    if not key:
        os.makedirs(more, exist_ok=True)
    shutil.copy(p, os.path.join(out if key else more, f"{name}-{os.path.basename(p)}"))
with open(os.path.join(out, f"{name}-moments.tsv"), "w") as fh:
    for m, t in marks:
        fh.write(f"{m}\t{max(0.0, t - t0):.1f}\n")
print(f"{dest}: {t1 - t0:.1f} s, {len(thumbs)} frames on the sheet")
