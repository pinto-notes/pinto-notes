#!/usr/bin/env python3
"""The menu bar glyph: the app icon's own leaf in one ink, as a template image.

    uv run --with pillow python3 brand/menubar/leaf.py

Writes Pane/Resources/Assets.xcassets/MenuBarIcon.imageset/menubar.png (18 px) and menubar@2x.png
(36 px). The outline is the leaf of the icon itself: the alpha of brand/leaf/leaf.png, scaled.
What is orange inside it in the icon (the midrib and the six note lines) is cut out, so the menu
bar shows through. The note lines are cut one screen pixel thick on whole pixel rows, and the
midrib a little over a point wide: scaled as drawn they would be half a pixel and come out grey.
The cut stops where the stem begins, so the stem stays.
"""
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "leaf", "leaf.png")
DEST = os.path.normpath(os.path.join(HERE, "..", "..", "Pane", "Resources", "Assets.xcassets", "MenuBarIcon.imageset"))
# Measured in leaf.png (1024 px, as drawn): the middle of the midrib every 30 px, and the six note lines.
RIB=[(669,280),(634,310),(601,340),(572,370),(547,400),(524,430),(505,460),(487,490),(471,520),(457,550),(443,580),(431,610),(420,640),(409,670),(400,700),(387,730),(371,760)]
LINES=[(397,347,507),(397,586,751),(493,302,446),(493,532,733),(589,304,394),(589,493,689)]  # y, x from, x to
POINTS, TALL = 18, 16.0
def glyph(px):
    leaf=Image.open(SRC).convert("RGBA").split()[3]
    x0,y0,x1,y1=leaf.getbbox()
    k=TALL/(y1-y0)*(px/POINTS)
    w,h=round((x1-x0)*k),round((y1-y0)*k)
    ox,oy=(px-w)//2,(px-h)//2
    ss=8
    ink=Image.new("L",(px*ss,px*ss),0)
    ink.paste(leaf.crop((x0,y0,x1,y1)).resize((w*ss,h*ss),Image.LANCZOS),(ox*ss,oy*ss))
    d=ImageDraw.Draw(ink)
    X=lambda x:(ox+(x-x0)*k)*ss
    Y=lambda y:(oy+(y-y0)*k)
    thick=px//POINTS            # the note lines: one device pixel per point of scale, on whole pixel rows
    for y,a,b in LINES:
        top=round(Y(y)-thick/2)
        d.rounded_rectangle((X(a),top*ss,X(b),(top+thick)*ss-1),radius=thick*ss/2,fill=0)
    rw=1.15*px/POINTS*ss
    pts=[(X(x),Y(y)*ss) for x,y in RIB]
    d.line(pts,fill=0,width=round(rw),joint="curve")
    for x,y in (pts[0],pts[-1]): d.ellipse((x-rw/2,y-rw/2,x+rw/2,y+rw/2),fill=0)
    out=Image.new("RGBA",(px,px),(0,0,0,0)); out.putalpha(ink.resize((px,px),Image.LANCZOS)); return out

if __name__ == "__main__":
    glyph(18).save(os.path.join(DEST, "menubar.png"), optimize=True)
    glyph(36).save(os.path.join(DEST, "menubar@2x.png"), optimize=True)
