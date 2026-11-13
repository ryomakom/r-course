# -*- coding: utf-8 -*-
"""
トップページの実演（assets/top-demo.js）に埋め込んである表と点の位置を、
make-figures.R の書き出し（outputs/）から写し直すスクリプト。

    Rscript make-figures.R
    python tools/fill_top_demo.py
    python build.py

の順に実行します。写すものは次のとおり（手で写すと間違えるので、必ずこれで写す）。

    T_ALL      ← outputs/00-aging-all.txt        1段目の表
    T_RATE     ← outputs/00-aging-rate.txt       2段目の表
    T_RANK     ← outputs/00-aging-rank.txt       3段目の表
    T_STREAM   ← outputs/00-aging-stream.txt     1・2段目の動きで流す行
                 （00-aging-stream-all.txt は、その後ろ12字を切ったものと同じであることだけ確かめる）
    PTS        ← outputs/00-aging-points.json    4段目の動きで打つ点
    PTS_Y      ← outputs/00-aging-points-years.json  5段目の動きで打つ点

中身が変わったときだけ top-demo.js を書き換えます。改行コードは top-demo.js のまま（LF）。
build.py からは呼ばれません（R を実行し直したときだけ要るため）。
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "assets", "top-demo.js")
OUT = os.path.join(ROOT, "outputs")


def lines(name):
    # outputs/ の .txt は R が CRLF で書くことがあるので、行に分けてから使う
    with open(os.path.join(OUT, name), encoding="utf-8") as f:
        ls = f.read().splitlines()
    for l in ls:
        # JS の '…' にそのまま入れるので、引用符と逆斜線が無いことを確かめる
        if "'" in l or "\\" in l:
            sys.exit("%s に ' か \\ がある行があります: %s" % (name, l))
    return ls


def num(v):
    # 小数1桁。末尾の 0 は書かない（容量を減らすため。721.0 → 721）
    return ("%.1f" % v).rstrip("0").rstrip(".")


def xy(vs):
    return ",".join(num(v) for v in vs)


def replace(js, pattern, text, flags=0):
    js2, n = re.subn(pattern, lambda m: text, js, flags=flags)
    if n != 1:
        sys.exit("top-demo.js の中に、写す先（%s）がちょうど1か所見つかりませんでした（%d か所）" % (pattern, n))
    return js2


def main():
    with open(JS, encoding="utf-8", newline="") as f:
        js = f.read()
    old = js

    # 表3枚。tibble の表示そのまま（1行目 # A tibble … から最後の # ℹ … まで）
    for var, name in [("T_ALL", "00-aging-all.txt"), ("T_RATE", "00-aging-rate.txt"), ("T_RANK", "00-aging-rank.txt")]:
        body = "  var %s = [\n" % var + ",\n".join("    '%s'" % l for l in lines(name)) + "].join('\\n');\n"
        js = replace(js, r"  var %s = \[\n.*?\]\.join\('\\n'\);\n" % var, body, re.S)

    # 流す行。1段目は6列の行の後ろ12字（rate_over65 の欄）を切って作るので、そうして作ったものが5列の書き出しと同じか確かめる
    stream = lines("00-aging-stream.txt")
    alls = lines("00-aging-stream-all.txt")
    if len(stream) != len(alls) or any(a[:-12] != b for a, b in zip(stream, alls)):
        sys.exit("00-aging-stream.txt の後ろ12字を切ったものが、00-aging-stream-all.txt と合いません")
    body = "  var T_STREAM = [\n" + ",\n".join("    '%s'" % l for l in stream) + "];\n"
    js = replace(js, r"  var T_STREAM = \[\n.*?\];\n", body, re.S)

    # 4段目の点
    with open(os.path.join(OUT, "00-aging-points.json"), encoding="utf-8") as f:
        p = json.load(f)
    body = "  var PTS = { w: %d, h: %d, r: %s, xy: [%s] };\n" % (p["w"], p["h"], p["r"], xy(p["xy"]))
    js = replace(js, r"  var PTS = \{.*?\};\n", body)

    # 5段目の点。組（年）ごとに1行
    with open(os.path.join(OUT, "00-aging-points-years.json"), encoding="utf-8") as f:
        p = json.load(f)
    years = [g["year"] for g in p["groups"]]
    if sorted(p["draw"]) != sorted(years):
        sys.exit("00-aging-points-years.json の draw と groups の年が合いません")
    groups = ",\n".join("    { year: %d, colour: '%s', xy: [%s] }" % (g["year"], g["colour"], xy(g["xy"])) for g in p["groups"])
    body = "  var PTS_Y = { w: %d, h: %d, r: %s, draw: [%s], groups: [\n%s] };\n" % (
        p["w"], p["h"], p["r"], ", ".join(str(y) for y in p["draw"]), groups)
    js = replace(js, r"  var PTS_Y = \{.*?\};\n", body, re.S)

    n4 = len(json.load(open(os.path.join(OUT, "00-aging-points.json"), encoding="utf-8"))["xy"]) // 2
    n5 = "+".join(str(len(g["xy"]) // 2) for g in p["groups"])
    if js == old:
        print("top-demo.js は変わりありません（流す行 %d、点 %d と %s）" % (len(stream), n4, n5))
    else:
        with open(JS, "w", encoding="utf-8", newline="") as f:
            f.write(js)
        print("top-demo.js を写し直しました（流す行 %d、点 %d と %s、%d バイト）" % (len(stream), n4, n5, len(js.encode("utf-8"))))


if __name__ == "__main__":
    main()
