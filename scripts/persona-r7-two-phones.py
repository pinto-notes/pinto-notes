#!/usr/bin/env python3
"""Two phones side by side, from one recorded run of scripts/collab-two-simulators.ts
(COLLAB_RECORD=<run dir>), for the persona council (round 7, batch 2):

  persona-r7-two-phones.py <run dir> <shots/r7 dir>

The run dir holds emil.raw.mp4 and sara.raw.mp4 (simctl recordVideo), <who>.started (when each
recording said "Recording started": its first frame, and its frames' times count from there) and
moments.tsv (epoch s, moment). Writes three clips, each one unbroken stretch of the same run:

  c9-two-phones/two-iphones-c9-shared-list.mp4          sharing to removal
  c10-offline/two-iphones-c10-offline.mp4               the server paused to the merge
  c11-ai-edit-other-device/two-iphones-c11-ai-edit.mp4  the AI's edit on the shared note
  c11-ai-edit-other-device/iphone-c11-ai-edit-own-note.mp4   (Sara's phone) her AI's edit to her own note

Each gets <name>-contact-sheet.png (a frame a second, labelled), <name>-NN-<moment>.png (key stills at
full size, from the recordings) and <name>-moments.tsv (each moment's time in the clip). Under the
phones, a strip with the clip's own clock, so a cut would show, and what is happening.

simctl's files carry each frame's time twice, and its decode times run tens of seconds behind. When
two frames share a time, ffmpeg starts using the decode times and puts every later frame that much too
early (a tick seen before it was made). `-fflags +igndts` keeps ffmpeg on the frames' own times."""
import glob, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

run, out_root = sys.argv[1], sys.argv[2]
FPS = 30
started = {w: float(open(os.path.join(run, f"{w}.started")).read()) for w in ("emil", "sara")}
moments = []  # (epoch s, name)
for line in open(os.path.join(run, "moments.tsv")):
    t, name = line.rstrip("\n").split("\t")
    moments.append((float(t), name))
moments.sort()
first = {}
for t, n in moments:
    first.setdefault(n, t)

# What each moment says in the strip, and whose phone it's about.
SAYS = {
    "emil-note": ("emil", "Emil's checklist, not shared yet"),
    "emil-share-open": ("emil", "Emil opens Share"),
    "emil-link-can-edit": ("emil", "People with the link: Can edit"),
    "emil-link-copied": ("emil", "Shared: Emil copies the link"),
    "sara-join-question": ("sara", "Sara opens the link: join?"),
    "sara-joined": ("sara", "Joined: the list opens on Sara's phone"),
    "emil-ticked": ("both", "Both tick at once"),
    "sara-ticked": ("both", "Both tick at once"),
    "emil-sees-sara-tick": ("emil", "Each sees the other's tick"),
    "sara-sees-emil-tick": ("sara", "Each sees the other's tick"),
    "offline": ("both", "Offline: the server's gateway is paused"),
    # Typed and ticked a tenth of a second apart: one caption, so neither flashes by.
    "sara-typed-offline": ("sara", "Offline: Sara adds an item and ticks it"),
    "sara-ticked-offline": ("sara", "Offline: Sara adds an item and ticks it"),
    "online": ("both", "Back online"),
    "emil-sees-sara-offline-edits": ("emil", "Merged: Sara's offline edits reach Emil"),
    "ai-edit": ("sara", "Sara's AI edits the note (the local server's MCP function)"),
    "emil-sees-ai-edit": ("emil", "The AI's edit arrives"),
    "sara-sees-ai-edit": ("sara", "The AI's edit arrives"),
    "emil-share-people": ("emil", "Emil opens Share: Emil and Sara"),
    "emil-removed-sara": ("emil", "Removed: Emil removes Sara"),
    "sara-note-gone": ("sara", "Removed: the note leaves Sara's phone"),
    "sara-own-note": ("sara", "Sara's own note, not shared"),
    "sara-typed-budget": ("sara", "Sara types a line"),
    "private-ai-edit": ("sara", "Her AI reads the note and edits it (the local MCP function)"),
    "sara-sees-own-ai-edit": ("sara", "The AI's edit arrives on her phone"),
}
FOOT = "Two iPhone simulators · a server on this Mac (local Supabase) · made-up accounts"

def at(name, default=None):
    return first.get(name, default)

def latest(*names):
    ts = [first[n] for n in names if n in first]
    return max(ts) if ts else None

hold = 3.0
clips = []
# c9: from Emil's list before it's shared to the note gone from Sara's phone.
if at("emil-note") and at("sara-note-gone"):
    clips.append(dict(folder="c9-two-phones", name="two-iphones-c9-shared-list", phones=("emil", "sara"),
                      t0=at("emil-note") - 1.5, t1=latest("sara-note-gone", "emil-removed-sara") + hold + 1.5,
                      keys=["emil-link-copied", "sara-join-question", "sara-joined", "emil-sees-sara-tick", "emil-removed-sara", "sara-note-gone"]))
# c10: the stretch from just before the pause to Emil's phone showing the merge.
if at("offline") and at("emil-sees-sara-offline-edits"):
    clips.append(dict(folder="c10-offline", name="two-iphones-c10-offline", phones=("emil", "sara"),
                      t0=at("offline") - 2.5, t1=at("emil-sees-sara-offline-edits") + hold + 1.5,
                      keys=["offline", "sara-ticked-offline", "online", "emil-sees-sara-offline-edits"]))
# c11: the AI's edit on the shared note, arriving on both phones.
if at("ai-edit"):
    clips.append(dict(folder="c11-ai-edit-other-device", name="two-iphones-c11-ai-edit", phones=("emil", "sara"),
                      t0=at("ai-edit") - 3.0, t1=(latest("emil-sees-ai-edit", "sara-sees-ai-edit") or at("ai-edit")) + hold + 1.5,
                      keys=["ai-edit", "emil-sees-ai-edit", "sara-sees-ai-edit"]))
# c11, second clip: her AI's edit to her own note, on her phone.
if at("sara-own-note") and at("sara-sees-own-ai-edit"):
    clips.append(dict(folder="c11-ai-edit-other-device", name="iphone-c11-ai-edit-own-note", phones=("sara",),
                      t0=at("sara-own-note") - 1.0, t1=at("sara-sees-own-ai-edit") + 6.0,
                      keys=["sara-own-note", "sara-typed-budget", "private-ai-edit", "sara-sees-own-ai-edit"]))

def probe(path, entries):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "csv=p=0", path], capture_output=True, text=True)
    return r.stdout.strip()

raw = {w: os.path.join(run, f"{w}.raw.mp4") for w in ("emil", "sara")}
TIMES = ["-fflags", "+igndts"]  # read the frames' own times (see above)
size = {w: tuple(int(x) for x in probe(raw[w], "stream=width,height").split(",")[:2]) for w in raw}

mono = lambda s: ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", s)
sans = lambda s: ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", s)
ORANGE = (255, 159, 10)

def render(c):
    phones = c["phones"]
    pw, gap, top, strip = 560, 40, 74, 118
    ph = int(round(pw * size[phones[0]][1] / size[phones[0]][0] / 2)) * 2
    W = gap + len(phones) * (pw + gap)
    W += W % 2
    H = top + ph + strip
    # Not before either recording began: no frame is made up.
    t0, t1 = max(c["t0"], max(started[p] for p in phones) + 0.1), c["t1"]
    dur = t1 - t0
    frames = int(round(dur * FPS))
    folder = os.path.join(out_root, c["folder"])
    os.makedirs(folder, exist_ok=True)
    dest = os.path.join(folder, c["name"] + ".mp4")
    # The moments inside the clip (and the one in force when it starts).
    inside = [(t - t0, n) for t, n in moments if n in SAYS]
    offline_from, online_at = at("offline"), at("online")

    def band(t):
        """The labels over the phones and the strip under them, one image (cropped apart by ffmpeg)."""
        now = None
        for s, n in inside:
            if s <= t + 1e-6:
                now = n
        who, says = SAYS.get(now, ("", "")) if now else ("", "")
        if now:
            # A wait: how long since, so a held caption doesn't read as news.
            since = t - [s for s, n in inside if n == now][-1]
            if since >= 5:
                says += f" · {int(since)} s ago"
        off = offline_from is not None and offline_from - t0 <= t and (online_at is None or t < online_at - t0)
        clock = f"{int(t // 60)}:{t % 60:04.1f}"
        return (who, says, off, clock)

    cache = {}
    def band_image(key):
        who, says, off, clock = key
        img = Image.new("RGB", (W, top + strip), (0, 0, 0))
        d = ImageDraw.Draw(img)
        for i, p in enumerate(phones):
            x0 = gap + i * (pw + gap)
            name = "Emil's iPhone" if p == "emil" else "Sara's iPhone"
            on = who in (p, "both")
            f = sans(34)
            l, tp, r, bt = d.textbbox((0, 0), name, font=f)
            x = x0 + (pw - (r - l)) // 2 - l
            y = (top - (bt - tp)) // 2 - tp
            d.text((x, y), name, font=f, fill=ORANGE if on else (235, 235, 240))
            if on:
                rr = 8
                d.ellipse((x - 26 - rr, top // 2 - rr, x - 26 + rr, top // 2 + rr), fill=ORANGE)
        # The strip.
        y0 = top
        pad = 22
        f1, f2 = mono(40), sans(30)
        l, tp, r, bt = d.textbbox((0, 0), clock, font=f1)
        d.text((pad - l, y0 + 14 - tp), clock, font=f1, fill=(255, 255, 255))
        cx = pad + (r - l) + 28
        if off:
            pill = "Server paused"
            pl, ptp, pr, pbt = d.textbbox((0, 0), pill, font=sans(26))
            pw2, phh = pr - pl + 28, 44
            px = W - pad - pw2
            d.rounded_rectangle((px, y0 + 12, px + pw2, y0 + 12 + phh), radius=22, fill=(200, 40, 40))
            d.text((px + 14 - pl, y0 + 12 + (phh - (pbt - ptp)) // 2 - ptp), pill, font=sans(26), fill=(255, 255, 255))
            limit = px - 16
        else:
            limit = W - pad
        if says:
            f = f2
            while d.textlength(says, font=f) > limit - cx and f.size > 20:
                f = sans(f.size - 2)
            l2, tp2, r2, bt2 = d.textbbox((0, 0), says, font=f)
            d.text((cx - l2, y0 + 20 - tp2), says, font=f, fill=(255, 255, 255))
        f3 = sans(24)
        foot = FOOT if len(phones) > 1 else "iPhone simulator · a server on this Mac (local Supabase) · made-up account"
        while d.textlength(foot, font=f3) > W - 2 * pad and f3.size > 16:
            f3 = sans(f3.size - 1)
        l3, tp3, r3, bt3 = d.textbbox((0, 0), foot, font=f3)
        d.text((pad - l3, y0 + strip - 18 - (bt3 - tp3) - tp3), foot, font=f3, fill=(160, 160, 168))
        return img.tobytes()

    # Each phone from its own recording: frames at a steady 30 a second, cut to the clip's span by
    # its own clock (its first frame is when it said "Recording started").
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    chains = []
    for i, p in enumerate(phones):
        args += TIMES + ["-i", raw[p]]
        a = t0 - started[p]
        chains.append(f"[{i}:v]fps={FPS},tpad=stop_mode=clone:stop_duration=30,trim=start={a:.3f}:end={a + dur:.3f},setpts=PTS-STARTPTS,scale={pw}:{ph}[p{i}]")
    n = len(phones)
    args += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{top + strip}", "-r", str(FPS), "-i", "-"]
    fc = ";".join(chains)
    fc += f";color=c=black:s={W}x{H}:r={FPS}:d={dur:.3f}[bg]"
    fc += f";[{n}:v]split[b1][b2];[b1]crop={W}:{top}:0:0[top];[b2]crop={W}:{strip}:0:{top}[bot]"
    last = "bg"
    for i in range(n):
        fc += f";[{last}][p{i}]overlay={gap + i * (pw + gap)}:{top}[o{i}]"
        last = f"o{i}"
    fc += f";[{last}][top]overlay=0:0[ot];[ot][bot]overlay=0:{top + ph}:shortest=1[v]"
    args += ["-filter_complex", fc, "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
             "-r", str(FPS), "-movflags", "+faststart", "-an", dest]
    ff = subprocess.Popen(args, stdin=subprocess.PIPE)
    for k in range(frames):
        key = band(k / FPS)
        if key not in cache:
            cache.clear()
            cache[key] = band_image(key)
        ff.stdin.write(cache[key])
    ff.stdin.close()
    if ff.wait() != 0:
        sys.exit(f"{c['name']}: ffmpeg failed")

    # A frame a second, labelled with its second.
    tmp = tempfile.mkdtemp()
    tw = 220 * n + 40
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", dest, "-vf", f"fps=1,scale={tw}:-2", os.path.join(tmp, "%04d.png")], check=True)
    thumbs = sorted(glob.glob(os.path.join(tmp, "*.png")))
    if thumbs:
        cols = 6 if n > 1 else 8
        w0, h0 = Image.open(thumbs[0]).size
        label = 28
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (w0 + 8) + 8, rows * (h0 + label + 8) + 8), (255, 255, 255))
        d = ImageDraw.Draw(sheet)
        for k, p in enumerate(thumbs):
            x, y = 8 + (k % cols) * (w0 + 8), 8 + (k // cols) * (h0 + label + 8)
            d.text((x + 2, y + 3), f"{k} s", font=sans(20), fill=(20, 20, 20))
            sheet.paste(Image.open(p).convert("RGB"), (x, y + label))
        sheet.save(os.path.join(folder, c["name"] + "-contact-sheet.png"))
    shutil.rmtree(tmp, ignore_errors=True)

    # Key stills at full size, from the recordings, in the order they happened: each phone 1.5 s after
    # its moment (the change has landed by then), side by side, with the moment and its time in the clip.
    for old in glob.glob(os.path.join(folder, c["name"] + "-[0-9][0-9]-*.png")):
        os.remove(old)
    for k, key in enumerate(sorted((m for m in c["keys"] if m in first), key=lambda m: first[m]), start=1):
        t = first[key] + 1.5
        if t > t1:
            t = t1 - 0.2
        shots = []
        for p in phones:
            f = os.path.join(tempfile.mkdtemp(), "f.png")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + TIMES + ["-i", raw[p], "-vf", f"fps={FPS},tpad=stop_mode=clone:stop_duration=30,trim=start={t - started[p]:.3f},setpts=PTS-STARTPTS",
                            "-frames:v", "1", f], check=True)
            shots.append(Image.open(f).convert("RGB"))
            shutil.rmtree(os.path.dirname(f), ignore_errors=True)
        sw = 603
        sh = int(round(sw * shots[0].height / shots[0].width))
        lab, cap = 70, 64
        still = Image.new("RGB", (len(shots) * (sw + 30) + 30, lab + sh + cap), (0, 0, 0))
        d = ImageDraw.Draw(still)
        who = SAYS[key][0]
        for i, (p, im) in enumerate(zip(phones, shots)):
            x0 = 30 + i * (sw + 30)
            still.paste(im.resize((sw, sh), Image.LANCZOS), (x0, lab))
            name = "Emil's iPhone" if p == "emil" else "Sara's iPhone"
            f = sans(32)
            l, tp, r, bt = d.textbbox((0, 0), name, font=f)
            d.text((x0 + (sw - (r - l)) // 2 - l, (lab - (bt - tp)) // 2 - tp), name, font=f, fill=ORANGE if who in (p, "both") else (235, 235, 240))
        text = f"{int((t - t0) // 60)}:{(t - t0) % 60:04.1f}  {SAYS[key][1]}"
        f = sans(28)
        while d.textlength(text, font=f) > still.width - 40 and f.size > 16:
            f = sans(f.size - 1)
        l, tp, r, bt = d.textbbox((0, 0), text, font=f)
        d.text((20 - l, lab + sh + (cap - (bt - tp)) // 2 - tp), text, font=f, fill=(255, 255, 255))
        still.save(os.path.join(folder, f"{c['name']}-{k:02d}-{key}.png"))

    with open(os.path.join(folder, c["name"] + "-moments.tsv"), "w") as fh:
        for t, name in moments:
            if t0 - 0.05 <= t <= t1 and name in SAYS:
                fh.write(f"{name}\t{t - t0:.1f}\t{SAYS[name][1]}\n")
    print(f"{dest}: {dur:.1f} s, {len(thumbs)} frames on the sheet")

for c in clips:
    render(c)
