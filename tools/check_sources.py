"""第3部の章が取りにいく外部のページが、まだ本文のとおりの形をしているかを確かめる。

GitHub Actions で月に1回動かす（.github/workflows/check-sources.yml）。手元でも
    python tools/check_sources.py
で動く。どれかが本文と食い違っていたら、終了コード1で止まる（Actions が失敗し、GitHub から通知が届く）。

確かめること（Rのコードと同じ手順をPythonでなぞる）
- 17章：東京地裁の所在地ページに div.module-sub-page-parts-table の中の table がある
- 18章：所在地一覧ページから、syozai を含むリンクが EXPECTED_COURTS 個取れる。そのうち一つが開ける
- 19章：総務省の一覧ページの table.tableList から、小選挙区のExcelへのリンクが47個取れる。東京都のExcelが落とせる
"""
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "r-course-link-check (+https://ryomakom.github.io/r-course/)"}
COURTS_LIST = "https://www.courts.go.jp/courthouse/map_tel/index.html"
COURTS_TOKYO = "https://www.courts.go.jp/tokyo/about/syozai/index.html"
SOUMU_LIST = "https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin50/shikuchouson.html"
SOUMU_TOKYO = "https://www.soumu.go.jp/main_content/000979550.xlsx"
EXPECTED_COURTS = 69   # 18章の本文に書いてある数
EXPECTED_SOUMU = 47

problems = []


def get(url):
    time.sleep(2)   # 相手のサーバーに負担をかけない
    r = requests.get(url, headers=UA, timeout=60)
    r.raise_for_status()
    return r


def check(name, fn):
    try:
        msg = fn()
        print("OK  ", name, "—", msg)
    except Exception as e:   # どこで食い違っても、残りは確かめる
        print("NG  ", name, "—", e)
        problems.append(name)


def ch17():
    soup = BeautifulSoup(get(COURTS_TOKYO).content, "html.parser")
    tables = soup.select("div.module-sub-page-parts-table table")
    if not tables:
        raise RuntimeError("div.module-sub-page-parts-table の中に table が見つからない")
    return "表が%d個" % len(tables)


def ch18():
    soup = BeautifulSoup(get(COURTS_LIST).content, "html.parser")
    hrefs = [a.get("href") for div in soup.select("div.module-sub-page-parts-table")
             for a in div.select("a") if a.get("href")]
    urls = []
    for h in hrefs:
        if "syozai" in h:
            u = urljoin(COURTS_LIST, h)
            if u not in urls:
                urls.append(u)
    if len(urls) != EXPECTED_COURTS:
        raise RuntimeError("所在地ページのURLが%d個（本文は%d個）" % (len(urls), EXPECTED_COURTS))
    page = BeautifulSoup(get(urls[0]).content, "html.parser")
    if not page.select("div.module-sub-page-parts-table table"):
        raise RuntimeError("%s に表が見つからない" % urls[0])
    return "URLが%d個、1個目の表も取れる" % len(urls)


def ch19():
    r = get(SOUMU_LIST)
    soup = BeautifulSoup(r.content, "html.parser", from_encoding="cp932")
    table = soup.select_one("table.tableList")
    if table is None:
        raise RuntimeError("table.tableList が見つからない")
    urls = []
    for tr in table.select("tr"):
        a = tr.select_one("a")
        if a and a.get("href") and "xlsx" in a["href"]:
            urls.append(urljoin(SOUMU_LIST, a["href"]))
    if len(urls) != EXPECTED_SOUMU:
        raise RuntimeError("小選挙区のExcelが%d個（本文は%d個）" % (len(urls), EXPECTED_SOUMU))
    x = get(SOUMU_TOKYO)
    if not x.content.startswith(b"PK"):
        raise RuntimeError("東京都のExcelがExcelファイルとして返ってこない")
    return "Excelが%d個、東京都のファイルも落とせる" % len(urls)


check("17章 東京地裁の所在地ページ", ch17)
check("18章 裁判所の所在地一覧", ch18)
check("19章 総務省の市区町村別得票数", ch19)

if problems:
    print("\n本文と食い違っているもの：", "、".join(problems))
    sys.exit(1)
print("\nすべて本文のとおりでした。")
