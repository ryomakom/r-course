# -*- coding: utf-8 -*-
"""
SNSでシェアされたときに出る画像（OGP画像、1200×630）を作るスクリプト。

build.py がビルドのたびに呼び出して、assets/og/<ページ名>.png を作り直します
（中身が変わったときだけファイルを書き換えます）。単独でも動きます。

    python tools/make_og.py

必要なもの：Pillow（pip install pillow）と日本語フォント（Windowsの游明朝・游ゴシック、
なければ BIZ UD・Noto・ヒラギノ）。どちらも無いときは何もせず、いまある画像をそのまま使います。
"""

import io
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:   # Pillow が無い環境では build.py 側で画像作りを飛ばす
    Image = None

WIDTH, HEIGHT = 1200, 630

PAPER = (0xfb, 0xf9, 0xf5)
INK = (0x1d, 0x1c, 0x1a)
INK_2 = (0x5b, 0x58, 0x52)
LINE = (0xdd, 0xd8, 0xcf)
ACCENT = (0x9c, 0x2b, 0x26)

SITE_TITLE = "記者のためのR講座"
SITE_SUB = "データを自分の手で確かめるために"
SITE_HOST = "ryomakom.github.io/r-course"
AUTHOR = "小宮山亮磨"

# 見出し用の明朝（太め）と、小見出し用のゴシック。上から順に探して、最初に見つかったものを使う
FONT_DIRS = [
    r"C:\Windows\Fonts",
    "/System/Library/Fonts",
    "/Library/Fonts",
    "/usr/share/fonts/opentype/noto",
    "/usr/share/fonts/truetype",
]
MINCHO = ["yumindb.ttf", "BIZ-UDMinchoM.ttc", "NotoSerifJP-VF.ttf",
          "ヒラギノ明朝 ProN.ttc", "NotoSerifCJK-Bold.ttc"]
GOTHIC_B = ["YuGothB.ttc", "BIZ-UDGothicB.ttc", "meiryob.ttc",
            "ヒラギノ角ゴシック W6.ttc", "NotoSansCJK-Bold.ttc"]
GOTHIC_M = ["YuGothM.ttc", "BIZ-UDGothicR.ttc", "meiryo.ttc",
            "ヒラギノ角ゴシック W3.ttc", "NotoSansCJK-Regular.ttc"]

# 行の頭に来てはいけない文字（禁則）
NO_START = set("、。，．・：；？！ー」』）】〉》〕ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ々")


def find_font(names):
    for d in FONT_DIRS:
        for n in names:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return p
    return None


FONTS = {"mincho": find_font(MINCHO), "gothic_b": find_font(GOTHIC_B),
         "gothic_m": find_font(GOTHIC_M)}


def available():
    """画像を作れる環境かどうか。"""
    return Image is not None and all(FONTS.values())


def font(kind, size):
    return ImageFont.truetype(FONTS[kind], size)


def wrap(draw, text, fnt, width):
    """日本語の文を、幅に収まるように1文字ずつ折り返す。読点や空白の後ろで切れればそこで切る。"""
    lines = []
    cur = ""
    for ch in text:
        if draw.textlength(cur + ch, font=fnt) <= width or not cur:
            cur += ch
            continue
        # 禁則：行頭に来てはいけない文字は前の行にぶら下げる
        if ch in NO_START:
            cur += ch
            lines.append(cur)
            cur = ""
            continue
        # 行の後ろのほうに切れ目（読点・空白）があれば、そこで切る
        cut = max(cur.rfind("、"), cur.rfind(" "), cur.rfind("　"))
        if cut >= len(cur) * 0.6:
            lines.append(cur[:cut + 1].rstrip())
            cur = cur[cut + 1:].lstrip() + ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def frame(draw):
    """どのページの画像にも共通の枠：左の赤い帯、上のサイト名、下の線と所在。"""
    draw.rectangle([0, 0, 18, HEIGHT], fill=ACCENT)
    # サイトの見出しと同じ、小さな赤い棒＋サイト名
    draw.rectangle([90, 74, 100, 110], fill=ACCENT)
    f = font("mincho", 38)
    draw.text((116, 92), SITE_TITLE, font=f, fill=INK, anchor="lm")
    x = 116 + draw.textlength(SITE_TITLE, font=f) + 26
    draw.text((x, 96), SITE_SUB, font=font("gothic_m", 22), fill=INK_2, anchor="lm")
    draw.line([90, 530, WIDTH - 90, 530], fill=LINE, width=2)
    small = font("gothic_m", 24)
    draw.text((90, 568), SITE_HOST, font=small, fill=INK_2, anchor="lm")
    draw.text((WIDTH - 90, 568), AUTHOR, font=small, fill=INK_2, anchor="rm")


def card(kicker, title):
    """章の画像。kicker（部の名前）と章の題を大きく出す。"""
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    frame(d)
    width = WIDTH - 180
    # 3行に収まる大きさまで字を小さくしていく
    for size in (84, 76, 68, 60, 54, 48):
        f = font("mincho", size)
        lines = wrap(d, title, f, width)
        if len(lines) <= (2 if size > 60 else 3):
            break
    lead = int(size * 1.38)
    block = lead * len(lines)
    kick_h = 58 if kicker else 0
    top = 150 + (370 - block - kick_h) // 2   # 上の名前と下の線の間で上下中央に
    if kicker:
        d.text((90, top + 18), kicker, font=font("gothic_b", 30), fill=ACCENT, anchor="lm")
        top += kick_h
    for i, line in enumerate(lines):
        d.text((90, top + lead * i + lead // 2), line, font=f, fill=INK, anchor="lm")
    return img


def home_card():
    """トップページの画像。サイト名と副題を大きく出す。"""
    img = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 18, HEIGHT], fill=ACCENT)
    d.rectangle([90, 196, 108, 300], fill=ACCENT)
    d.text((136, 250), SITE_TITLE, font=font("mincho", 104), fill=INK, anchor="lm")
    d.text((136, 362), SITE_SUB, font=font("gothic_m", 40), fill=INK_2, anchor="lm")
    d.line([90, 530, WIDTH - 90, 530], fill=LINE, width=2)
    small = font("gothic_m", 24)
    d.text((90, 568), SITE_HOST, font=small, fill=INK_2, anchor="lm")
    d.text((WIDTH - 90, 568), "Rでデータを読む・加工する・描く・集める", font=small,
           fill=INK_2, anchor="rm")
    return img


def touch_icon():
    """スマホのホーム画面用のアイコン（180×180）。favicon.svg と同じ図柄。"""
    img = Image.new("RGB", (180, 180), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([40, 34, 66, 146], fill=ACCENT)
    d.text((118, 92), "R", font=font("mincho", 120), fill=INK, anchor="mm")
    return img


def png_bytes(img):
    # 色数を減らしたPNGにすると、文字だけの画像は数十KBに収まる
    q = img.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    buf = io.BytesIO()
    q.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def save(img, path):
    """中身が変わったときだけ書く。書いたら True を返す。"""
    data = png_bytes(img)
    if os.path.exists(path):
        with open(path, "rb") as f:
            if f.read() == data:
                return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    return True


def make_all(pages, outdir):
    """pages は [(ページ名, kicker, title), ...]。作り直した枚数を返す。"""
    n = 0
    for slug, kicker, title in pages:
        img = home_card() if slug == "index" else card(kicker, title)
        n += save(img, os.path.join(outdir, slug + ".png"))
    n += save(touch_icon(), os.path.join(outdir, "..", "apple-touch-icon.png"))
    return n


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if not available():
        sys.exit("Pillow か日本語フォントが見つからないので、画像を作れません。")
    # build.py と同じ目次から、全ページの画像を作る
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, base)
    import build
    pages = []
    for slug in build.ORDER:
        meta = build.read_page(slug)[0]
        pages.append((slug, meta.get("kicker", ""), meta.get("title", slug)))
    n = make_all(pages, os.path.join(base, "assets", "og"))
    print("%d 枚の画像を作り直しました（assets/og/）。" % n)
