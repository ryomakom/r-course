# -*- coding: utf-8 -*-
"""16章の「検証」の操作動画に、手順の字幕を焼き込む。
使い方: python make-video16.py 元の動画.mp4 images
（imageio-ffmpeg と Pillow が必要。字幕を直したいときは、下の CAPS を書き換えて実行し直す）
出力: 16-css-selector.mp4（字幕入り・音声なし）、16-css-selector.png（ポスター画像）
元の動画は横長の画面の真ん中にブラウザの窓があって左右が黒いので、窓の部分だけを切り出す。
"""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

SRC, OUTDIR = sys.argv[1], sys.argv[2]
WORK = os.path.join(tempfile.gettempdir(), "make-video16-caps")   # 字幕の画像の置き場（作業用）
os.makedirs(WORK, exist_ok=True)
os.makedirs(OUTDIR, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()

H = 1080
X0, W = 372, 1176  # 元の動画のうち、ブラウザの窓がある部分（左端の位置と幅）。左右の黒い部分は捨てる
BAND = 200         # 字幕を入れる帯の高さ（動画の下に足す）
HOLD = 4.0          # 最後のコマを止めておく秒数
END = 34.8 + HOLD

# (始まり, 終わり, 字幕) 1行は全角27字くらいまで、3行まで（はみ出すと止まる）
CAPS = [
    (0.0, 5.0, ["ページの上で右クリックして、", "メニューのいちばん下の「検証」を選びます"]),
    (5.0, 9.5, ["右側に開発者ツールが開きます。", "左のページは、表が見えるところまで下げておきます"]),
    (9.5, 12.6, ["HTMLの行にカーソルを合わせると、", "ページのその部分が青くなります。", "<body> はページ全体です"]),
    (12.6, 17.0, ["<main> に合わせると、本文の部分が青くなりました。", "表はこの中にあります"]),
    (17.0, 20.9, ["「…」のところをクリックして、<main> の中身を開きます", "（左の三角 ▶ をクリックしても開けます）"]),
    (20.9, 27.0, ["中にある <div class=\"l-contents\"> も", "表を含んでいるので、これも開きます"]),
    (27.0, 32.7, ["中の <div> に順にカーソルを合わせて、", "表を含むものを探し、見つけたらさらに開きます"]),
    (32.7, END, ["<div class=\"module-sub-page-parts-table\"> が、",
                 "表だけを囲む容器です。ページの側にも",
                 "「div.module-sub-page-parts-table」と出ています"]),
]

FONT = ImageFont.truetype("C:/Windows/Fonts/meiryob.ttc", 34)
NUM = ImageFont.truetype("C:/Windows/Fonts/meiryob.ttc", 28)


def caption_png(i, lines, path):
    img = Image.new("RGBA", (W, BAND), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    pad, gap = 22, 8
    widths = [d.textlength(l, font=FONT) for l in lines]
    lh = 44
    badge = 48
    box_w = max(widths) + pad * 2 + badge + 18
    box_h = lh * len(lines) + gap * (len(lines) - 1) + pad * 2 - 10
    x0 = (W - box_w) / 2
    y0 = (BAND - box_h) / 2
    assert box_w <= W - 20 and box_h <= BAND, "字幕 %d が帯に収まらない（幅 %d, 高さ %d）" % (i + 1, box_w, box_h)
    # 手順の番号
    cx, cy = x0 + pad + badge / 2, y0 + box_h / 2
    d.ellipse([cx - badge / 2, cy - badge / 2, cx + badge / 2, cy + badge / 2], fill=(156, 43, 38, 255))
    d.text((cx, cy), str(i + 1), font=NUM, fill="white", anchor="mm")
    tx = x0 + pad + badge + 16
    for k, l in enumerate(lines):
        d.text((tx, y0 + pad - 6 + k * (lh + gap)), l, font=FONT, fill="white")
    img.save(path)


inputs, chain = ["-i", SRC], []
for i, (a, b, lines) in enumerate(CAPS):
    p = os.path.join(WORK, "cap%02d.png" % i)
    caption_png(i, lines, p)
    inputs += ["-i", p]

# 最後のコマを HOLD 秒止めてから、字幕を順に重ねる
prev = "[v0]"
chain.append("[0:v]crop=%d:%d:%d:0,tpad=stop_mode=clone:stop_duration=%g,pad=%d:%d:0:0:black[v0]"
             % (W, H, X0, HOLD, W, H + BAND))
for i, (a, b, _) in enumerate(CAPS):
    out = "[v%d]" % (i + 1)
    chain.append("%s[%d:v]overlay=0:%d:enable='between(t,%g,%g)'%s" % (prev, i + 1, H, a, b - 0.001, out))
    prev = out

mp4 = os.path.join(OUTDIR, "16-css-selector.mp4")
cmd = [FF, "-hide_banner", "-loglevel", "error", "-y"] + inputs + [
    "-filter_complex", ";".join(chain), "-map", prev, "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", mp4]
subprocess.run(cmd, check=True)

# ポスター画像（最後の場面。表が青くなり、セレクタが表示されているところ）
png = os.path.join(OUTDIR, "16-css-selector.png")
subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-ss", "35.5", "-i", mp4,
                "-frames:v", "1", png], check=True)
print(os.path.getsize(mp4), os.path.getsize(png))
