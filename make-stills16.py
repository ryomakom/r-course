# -*- coding: utf-8 -*-
"""16章の「検証」の操作の要点を、動画から静止画にして切り出す。
使い方: python make-stills16.py 元の動画.mp4 images
（imageio-ffmpeg と Pillow が必要）

見てほしいところ以外をほんの少しだけ白っぽくして（veil。強くすると画面全体がかすむ）、赤い枠と番号をつける。
番号の意味は、本文の図の説明（figcaption）に書いている。
"""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

SRC, OUTDIR = sys.argv[1], sys.argv[2]
FF = imageio_ffmpeg.get_ffmpeg_exe()
WORK = os.path.join(tempfile.gettempdir(), "make-stills16")
os.makedirs(WORK, exist_ok=True)

RED = (200, 30, 30)
FONT = ImageFont.truetype("C:/Windows/Fonts/meiryob.ttc", 30)

# 座標は元の動画（1920×1080）のもの
STILLS = [
    {
        "name": "16-step1.png", "t": 3.0, "crop": (372, 0, 1548, 900), "veil": 0,
        # 見てほしいところ: (左, 上, 右, 下, 番号, 番号を置く側)
        "focus": [(995, 818, 1396, 866, None, None)],
        "circle": [],
    },
    {
        "name": "16-step2.png", "t": 17.6, "crop": (372, 125, 1548, 900), "veil": 55,
        "focus": [(399, 132, 858, 892, "2", "inside"),
                  (891, 622, 1540, 652, "1", "right")],
        "circle": [(1146, 637, 20, "3")],
    },
    {
        "name": "16-step3.png", "t": 33.8, "crop": (372, 125, 1548, 900), "veil": 55,
        "focus": [(426, 128, 832, 826, "2", "inside"),
                  (891, 606, 1540, 656, "1", "right"),
                  (426, 828, 824, 890, "3", "inside_bottom")],
        "circle": [],
    },
]


def badge(d, cx, cy, label):
    r = 24
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=RED)
    d.text((cx, cy), label, font=FONT, fill="white", anchor="mm")


for s in STILLS:
    raw = os.path.join(WORK, "raw_%s.png" % s["t"])
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s["t"]), "-i", SRC,
                    "-frames:v", "1", raw], check=True)
    im = Image.open(raw).convert("RGB")

    # 見てほしいところ以外を薄くする
    veil = Image.new("RGB", im.size, (255, 255, 255))
    mask = Image.new("L", im.size, s["veil"])    # 0なら何もかぶせない。55/255 で2割くらい白っぽくなる
    md = ImageDraw.Draw(mask)
    for (l, t, r, b, *_rest) in s["focus"]:
        md.rectangle([l, t, r, b], fill=0)
    for (cx, cy, rad, _) in s["circle"]:
        md.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=0)
    im = Image.composite(veil, im, mask)

    d = ImageDraw.Draw(im)
    for (l, t, r, b, label, where) in s["focus"]:
        d.rounded_rectangle([l - 4, t - 4, r + 4, b + 4], radius=8, outline=RED, width=5)
        if label is None:
            pass
        elif where == "left":
            badge(d, l - 36, (t + b) / 2, label)
        elif where == "right":
            badge(d, r - 24, t - 26, label)
        elif where == "inside":
            badge(d, l + 34, t + 34, label)
        elif where == "inside_bottom":
            badge(d, r - 34, t - 30, label)
    for (cx, cy, rad, label) in s["circle"]:
        d.ellipse([cx - rad - 6, cy - rad - 6, cx + rad + 6, cy + rad + 6], outline=RED, width=5)
        badge(d, cx + rad + 36, cy - rad - 22, label)

    out = im.crop(s["crop"])
    out.save(os.path.join(OUTDIR, s["name"]), optimize=True)   # 文字や赤い枠がにじまないよう png で
    print(s["name"], out.size)
