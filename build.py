# -*- coding: utf-8 -*-
"""
「記者のためのR講座」サイトの組み立てスクリプト。

content/ にある .md ファイルを読んで、site/ に .html を書き出します。
使い方:  python build.py
"""

import html
import os
import re
import shutil
import sys
import zipfile

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(BASE, "content")
ASSETS = os.path.join(BASE, "assets")
IMAGES = os.path.join(BASE, "images")
FILES = os.path.join(BASE, "files")   # 読者にダウンロードしてもらうデータ
OUT = os.path.join(BASE, "docs")   # GitHub Pages が配信できる名前にしている

SITE_TITLE = "記者のためのR講座"
SITE_SUB = "データを自分の手で確かめるために"

# ---------------------------------------------------------------- 目次の定義
# (部の名前, [ファイル名（.md抜き）, ...])
# 部の名前が None のものは目次で見出しをつけない
PARTS = [
    (None, ["index"]),
    ("はじめに", [
        "01-hajimeni",
        "02-install",
        "03-project",
    ]),
    ("第1部　データを読む・加工する", [
        "04-import",
        "05-select-mutate",
        "06-strings-filter",
        "07-group",
        "08-bind",
        "09-pivot",
        "10-datatype",
        "11-join",
    ]),
    ("第2部　データを見る", [
        "12-line",
        "13-col",
        "14-point",
        "15-finish",
    ]),
    ("第3部　データを集める", [
        "16-scraping",
        "17-loop",
        "18-download",
        "19-kami-excel",
    ]),
    ("第4部　詰まったときに", [
        "20-error",
        "21-ai",
    ]),
    ("付録", [
        "a1-kigou",
        "a2-functions",
        "a3-shukudai",
        "a4-data",
    ]),
]

ORDER = [slug for _, slugs in PARTS for slug in slugs]

# 足りない画像・出力ファイルの控え（ビルドの最後に一覧を出す）
MISSING = []

# 「要検討」の印がついた箇所の控え
REVIEW = []
MEMO = []        # 小宮山さんの書き込み
CURRENT = [""]


# ------------------------------------------------------------ Markdown変換
# 使える書き方は限定しています（下の README.md に一覧があります）。

def esc(text):
    return html.escape(text, quote=False)


CODE_TOKEN = "\x00CODE%d\x00"


def filesize(path):
    """ファイルの大きさを読みやすい形にする。無ければNoneを返す。"""
    full = os.path.join(BASE, path)
    if not os.path.exists(full):
        return None
    n = os.path.getsize(full)
    if n >= 1024 * 1024:
        return "%.1f MB" % (n / 1048576)
    if n >= 1024:
        return "%d KB" % round(n / 1024)
    return "%d バイト" % n


def link(m):
    """[表示名](url) をHTMLにする。files/ 以下ならダウンロード用の見た目にする。"""
    label, href = m.group(1), m.group(2)
    if href.startswith("files/"):
        size = filesize(href)
        if size is None:
            MISSING.append(href)
            return ('<span class="dl dl-missing">%s（ファイル未配置）</span>' % label)
        return ('<a class="dl" href="%s" download>%s<span class="dl-size">%s</span></a>'
                % (href, label, size))
    return '<a href="%s">%s</a>' % (href, label)


def mark_review(m):
    """{{? …}} で囲んだ文を「要検討」の印つきにする。"""
    body = m.group(1)
    plain = re.sub(r"<[^>]+>", "", body)
    plain = plain.replace(chr(0), "")   # コード部分の目印を取り除く
    REVIEW.append(("sent", CURRENT[0], plain))
    return ('<span class="review" title="要検討：書いた人の意見が入っています">'
            '%s<span class="review-tag">要検討</span></span>' % body)


def mark_memo(m):
    """{{! …}} で囲んだところを「メモ」として表示する（原稿に直接書き込む用）。"""
    body = m.group(1)
    plain = re.sub(r"<[^>]+>", "", body).replace(chr(0), "")
    MEMO.append(("sent", CURRENT[0], plain))
    return ('<span class="memo-inline">'
            '<span class="memo-inline-tag">メモ</span>%s</span>' % body)


def inline(text):
    """段落のなかの記法（`コード` **太字** [リンク](url)）を変換する。"""
    codes = []

    def stash(m):
        codes.append(m.group(1).replace("\\|", "|"))
        return CODE_TOKEN % (len(codes) - 1)

    def stash_double(m):
        # ``...`` はバッククオート自体を含めたいとき用（両端の空白は落とす）
        codes.append(m.group(1).strip().replace("\\|", "|"))
        return CODE_TOKEN % (len(codes) - 1)

    text = re.sub(r"``(.+?)``", stash_double, text)
    text = re.sub(r"`([^`]+)`", stash, text)
    text = esc(text)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\{\{\?\s*(.+?)\s*\}\}", mark_review, text)
    text = re.sub(r"\{\{!\s*(.+?)\s*\}\}", mark_memo, text)
    text = text.replace("  \n", "<br>\n")
    text = text.replace("\\|", "|")
    for i, c in enumerate(codes):
        text = text.replace(CODE_TOKEN % i, "<code>%s</code>" % esc(c))
    return text


def slugify(text):
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[\s　]+", "-", text.strip())
    return re.sub(r'[^\w\-一-龠ぁ-んァ-ヶー]', "", text)


BOX_LABEL = {
    "note": "メモ",
    "tips": "コツ",
    "warn": "つまずきポイント",
    "homework": "宿題",
    "column": "寄り道",
    "data": "使うデータ",
}


def loc(line_no):
    """その部品がもとの.mdの何行目から来たのかをHTMLに書き込む（メモ機能用）。"""
    return ' data-src="%s:%d"' % (CURRENT[0], line_no)


def render(md, headings, base_line=1):
    """Markdownの本文をHTMLにする。見出しは headings に集める（章内の目次用）。"""
    lines = md.split("\n")
    out = []
    i = 0
    n = len(lines)

    def close_lists(stack):
        while stack:
            out.append("</%s>" % stack.pop())

    list_stack = []

    while i < n:
        line = lines[i]
        here = base_line + i          # いまの行が.mdの何行目か
        m = re.match(r"^(`{3,})(\w*)(?:\s+(.*?))?\s*$", line)
        if m:
            close_lists(list_stack)
            fence, lang = m.group(1), m.group(2) or "text"
            # ```out outputs/x.txt <chr> …… 1つ目が読み込むファイル、あとは色をつける文字
            tokens = (m.group(3) or "").split()
            include = tokens[0] if tokens else None
            marks = tokens[1:]
            i += 1
            buf = []
            while i < n and lines[i].rstrip() != fence:
                buf.append(lines[i])
                i += 1
            i += 1
            body = "\n".join(buf)
            if include:
                path = os.path.join(BASE, include)
                if os.path.exists(path):
                    with open(path, encoding="utf-8") as f:
                        body = f.read().replace("\r\n", "\n").rstrip("\n")
                else:
                    body = "（%s がまだありません。make-figures.R を実行してください）" % include
                    MISSING.append(include)
            label = {"r": "R", "text": "画面に出るもの", "console": "コンソール",
                     "out": "実行結果", "file": "ファイルの中身",
                     "html": "ページのソース"}.get(lang, lang)
            # «ここ» で囲んだ部分、および fence で指定された文字に色をつける
            code = esc(body).replace("«", "<mark>").replace("»", "</mark>")
            for word in marks:
                code = code.replace(esc(word), "<mark>%s</mark>" % esc(word))
            out.append(
                '<div class="code" data-lang="%s"%s><button class="copy" type="button">コピー</button>'
                '<pre><code>%s</code></pre></div>' % (esc(label), loc(here), code)
            )
            continue

        # 画像　![説明](images/xxx.png "キャプション")
        m = re.match(r'^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$', line)
        if m:
            close_lists(list_stack)
            alt, src, cap = m.group(1), m.group(2), m.group(3)
            i += 1
            if os.path.exists(os.path.join(BASE, src)):
                fig = '<img src="%s" alt="%s" loading="lazy">' % (esc(src), esc(alt))
            else:
                MISSING.append(src)
                fig = ('<div class="fig-todo"><p>ここに画像を入れる</p>'
                       '<p class="fig-todo-alt">%s</p><p class="fig-todo-path">%s</p></div>'
                       % (inline(alt), esc(src)))
            out.append('<figure class="fig"%s>%s%s</figure>' % (loc(here),
                fig,
                '<figcaption>%s</figcaption>' % inline(cap or alt) if (cap or alt) else ""))
            continue

        # 囲み記事（:::note タイトル 〜 :::）
        m = re.match(r"^:::(\w+)\s*(.*)$", line)
        if m:
            close_lists(list_stack)
            kind = m.group(1)
            title = m.group(2).strip()
            box_review = title.endswith("@要検討")
            if box_review:
                title = title[:-len("@要検討")].strip()
            box_memo = ""
            if "@メモ：" in title:
                title, box_memo = title.split("@メモ：", 1)
                title, box_memo = title.strip(), box_memo.strip()
                MEMO.append(("box", CURRENT[0], box_memo))
            i += 1
            buf = []
            while i < n and not re.match(r"^:::\s*$", lines[i]):
                buf.append(lines[i])
                i += 1
            i += 1
            inner_headings = []
            body = render("\n".join(buf), inner_headings, base_line=here + 1)
            label = title or BOX_LABEL.get(kind, "")
            if box_review:
                REVIEW.append(("box", CURRENT[0], label))
            out.append('<aside class="box box-%s%s"%s>%s%s</aside>' % (
                esc(kind),
                " box-review" if box_review else "",
                loc(here),
                '<p class="box-title">%s%s</p>' % (
                    inline(label),
                    '<span class="review-tag">要検討</span>' if box_review else "")
                if label else "",
                body + ('<p class="memo-mark memo-static">%s</p>' % inline(box_memo)
                        if box_memo else ""),
            ))
            continue

        # 見出し
        m = re.match(r"^(#{2,4})\s+(.*)$", line)
        if m:
            close_lists(list_stack)
            level = len(m.group(1))
            text = inline(m.group(2).strip())
            hid = slugify(m.group(2).strip())
            if level == 2:
                headings.append((hid, m.group(2).strip()))
            out.append('<h%d id="%s"%s>%s</h%d>' % (level, hid, loc(here), text, level))
            i += 1
            continue

        # 区切り線
        if re.match(r"^---+\s*$", line):
            close_lists(list_stack)
            out.append("<hr>")
            i += 1
            continue

        # 表（| a | b |）
        if line.startswith("|") and i + 1 < n and re.match(r"^\|[\s:|-]+\|\s*$", lines[i + 1]):
            close_lists(list_stack)
            def cells(row):
                row = row.strip().strip("|").replace("\\|", "\x01")
                return [c.strip().replace("\x01", "\\|") for c in row.split("|")]
            head = cells(line)
            i += 2
            rows = []
            while i < n and lines[i].startswith("|"):
                rows.append(cells(lines[i]))
                i += 1
            t = ['<div class="table-wrap"%s><table><thead><tr>' % loc(here)]
            t += ["<th>%s</th>" % inline(c) for c in head]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append("<tr>" + "".join("<td>%s</td>" % inline(c) for c in r) + "</tr>")
            t.append("</tbody></table></div>")
            out.append("".join(t))
            continue

        # 箇条書き
        m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", line)
        if m:
            indent = len(m.group(1))
            tag = "ol" if m.group(2)[0].isdigit() else "ul"
            depth = indent // 2 + 1
            while len(list_stack) > depth:
                out.append("</%s>" % list_stack.pop())
            if len(list_stack) < depth:
                out.append("<%s%s>" % (tag, loc(here) if depth == 1 else ""))
                list_stack.append(tag)
            out.append("<li>%s</li>" % inline(m.group(3)))
            i += 1
            continue

        # 引用
        if line.startswith("> "):
            close_lists(list_stack)
            buf = []
            while i < n and lines[i].startswith("> "):
                buf.append(lines[i][2:])
                i += 1
            out.append("<blockquote%s>%s</blockquote>" % (loc(here), inline(" ".join(buf))))
            continue

        # HTMLを直接書いた部分はそのまま通す
        if line.lstrip().startswith("<"):
            close_lists(list_stack)
            buf = []
            while i < n and lines[i].strip():
                buf.append(lines[i])
                i += 1
            out.append("\n".join(buf))
            continue

        # 空行
        if not line.strip():
            close_lists(list_stack)
            i += 1
            continue

        # 段落
        buf = []
        while i < n and lines[i].strip() and not re.match(
                r"^(```|:::|#{2,4}\s|---+\s*$|\s*([-*]|\d+\.)\s|>\s|\||\s*<)", lines[i]):
            buf.append(lines[i].strip())
            i += 1
        out.append("<p%s>%s</p>" % (loc(here), inline("".join(buf))))

    close_lists(list_stack)
    return "\n".join(out)


def read_page(slug):
    path = os.path.join(CONTENT, slug + ".md")
    with open(path, encoding="utf-8") as f:
        raw = f.read().replace("\r\n", "\n")
    meta = {}
    if raw.startswith("---\n"):
        end = raw.index("\n---\n", 3)
        for row in raw[4:end].split("\n"):
            if ":" in row:
                k, v = row.split(":", 1)
                meta[k.strip()] = v.strip()
        offset = raw[:end + 5].count(chr(10)) + 1   # 本文が何行目から始まるか
        raw = raw[end + 5:]
        return meta, raw, offset
    return meta, raw, 1


# ------------------------------------------------------------------ テンプレ
def nav_html(current):
    rows = []
    num = 0
    for part, slugs in PARTS:
        if part:
            rows.append('<p class="nav-part">%s</p><ul>' % esc(part))
        else:
            rows.append("<ul>")
        for slug in slugs:
            meta = PAGES[slug][0]
            label = meta.get("nav") or meta.get("title", slug)
            cls = ' class="here"' if slug == current else ""
            href = "index.html" if slug == "index" else slug + ".html"
            rows.append('<li%s><a href="%s">%s</a></li>' % (cls, href, esc(label)))
        rows.append("</ul>")
    return "\n".join(rows)


PAGE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | {site}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<a class="skip" href="#main">本文へ</a>
<header class="site-head">
  <a class="brand" href="index.html"><span class="brand-main">{site}</span><span class="brand-sub">{sitesub}</span></a>
  <button class="menu-btn" type="button" aria-expanded="false">目次</button>
</header>
<div class="layout">
  <nav class="toc" aria-label="目次">
{nav}
  </nav>
  <main id="main" class="page {pagecls}">
    <article>
      <p class="kicker">{kicker}</p>
      <h1>{title}</h1>
      {lead}
      {inpage}
      {body}
    </article>
    <nav class="pager">{pager}</nav>
    <footer class="site-foot">
      <p>{site}</p>
      <p class="small">朝日新聞社　小宮山亮磨／このページは自分の勉強と社内向けの勉強会のためにつくっています。</p>
    </footer>
  </main>
</div>
<script src="assets/site.js"></script>
<script src="assets/notes.js"></script>
</body>
</html>
"""


ZIP_NAME = "r-course-data.zip"


def make_zip():
    """files/ の中身を1つのzipにまとめる（「まとめてダウンロード」用）。"""
    names = sorted(f for f in os.listdir(FILES) if not f.endswith(".zip"))
    out = os.path.join(OUT, "files", ZIP_NAME)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.write(os.path.join(FILES, name), name)
    # zipじたいの大きさを表示できるように、files/ にも置いておく
    shutil.copy(out, os.path.join(FILES, ZIP_NAME))
    print("%d 個のデータファイルを %s にまとめました。" % (len(names), ZIP_NAME))


def build():
    global PAGES
    PAGES = {}
    for slug in ORDER:
        PAGES[slug] = read_page(slug)

    # 中身だけ作り直す（フォルダごと消すと、ブラウザで開いている間に失敗することがある）
    os.makedirs(OUT, exist_ok=True)
    for name in os.listdir(OUT):
        if name.endswith(".html"):
            os.remove(os.path.join(OUT, name))
    shutil.copytree(ASSETS, os.path.join(OUT, "assets"), dirs_exist_ok=True)
    if os.path.isdir(IMAGES):
        shutil.copytree(IMAGES, os.path.join(OUT, "images"), dirs_exist_ok=True)
    if os.path.isdir(FILES):
        shutil.copytree(FILES, os.path.join(OUT, "files"), dirs_exist_ok=True)
        make_zip()

    todos = []
    for idx, slug in enumerate(ORDER):
        meta, raw, offset = PAGES[slug]
        CURRENT[0] = slug
        headings = []
        body = render(raw, headings, base_line=offset)

        for m in re.finditer(r"TODO[^\n<]*", raw):
            todos.append((slug, m.group(0)))

        inpage = ""
        if len(headings) >= 3 and slug != "index":
            items = "".join('<li><a href="#%s">%s</a></li>' % (h, esc(t)) for h, t in headings)
            inpage = '<nav class="inpage"><p>このページの中身</p><ul>%s</ul></nav>' % items

        prev_link = next_link = ""
        if idx > 0:
            p = ORDER[idx - 1]
            prev_link = '<a class="prev" href="%s.html"><span>前へ</span>%s</a>' % (
                p, esc(PAGES[p][0].get("nav") or PAGES[p][0].get("title", p)))
        if idx < len(ORDER) - 1:
            nx = ORDER[idx + 1]
            next_link = '<a class="next" href="%s.html"><span>次へ</span>%s</a>' % (
                nx, esc(PAGES[nx][0].get("nav") or PAGES[nx][0].get("title", nx)))

        banner = ""
        if meta.get("memo"):
            MEMO.append(("page", slug, meta["memo"]))
            banner += ('<div class="page-memo"><p class="page-memo-title">'
                       'この章へのメモ</p><p>%s</p></div>' % inline(meta["memo"]))
        if meta.get("review"):
            REVIEW.append(("page", slug, meta["review"]))
            banner = ('<div class="page-review"><p class="page-review-title">'
                      'この章について</p><p>%s</p></div>' % inline(meta["review"]))
        lead = '<p class="lead">%s</p>' % inline(meta["lead"]) if meta.get("lead") else ""
        lead = banner + lead
        html_out = PAGE.format(
            title=esc(meta.get("title", slug)),
            site=esc(SITE_TITLE),
            sitesub=esc(SITE_SUB),
            desc=esc(meta.get("lead", SITE_SUB))[:120],
            nav=nav_html(slug),
            kicker=esc(meta.get("kicker", "")),
            lead=lead,
            inpage=inpage,
            body=body,
            pager=prev_link + next_link,
            pagecls="home" if slug == "index" else "chapter",
        )
        name = "index.html" if slug == "index" else slug + ".html"
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(html_out)

    print("%d ページを %s に書き出しました。" % (len(ORDER), OUT))
    if MISSING:
        print("\n--- まだ用意されていない画像・出力ファイルが %d 件あります ---"
              % len(set(MISSING)))
        for m in sorted(set(MISSING)):
            print("  %s" % m)

    if REVIEW:
        pages = [r for r in REVIEW if r[0] == "page"]
        boxes = [r for r in REVIEW if r[0] == "box"]
        sents = [r for r in REVIEW if r[0] == "sent"]
        print("\n--- 「要検討」の印：章ぜんたい %d本、囲み記事 %d個、文 %d本 ---"
              % (len(pages), len(boxes), len(sents)))
        for _, slug, note in pages:
            print("  [章] %-16s %s" % (slug, note[:44]))
        for _, slug, title in boxes:
            print("  [囲] %-16s %s" % (slug, title))
        for _, slug, sent in sents:
            print("  [文] %-16s %s" % (slug, sent[:44]))

    if MEMO:
        print("\n=== 小宮山さんの書き込み %d件 ===" % len(MEMO))
        for kind, slug, text in MEMO:
            mark = {"page": "章", "box": "囲", "sent": "文"}[kind]
            print("  [%s] %-16s %s" % (mark, slug, text[:56]))

    if todos:
        print("\n--- 書きかけ・要確認（TODO）が %d 件あります ---" % len(todos))
        for slug, t in todos:
            print("  %-16s %s" % (slug, t))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    build()
