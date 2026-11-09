# -*- coding: utf-8 -*-
"""
「記者のためのR講座」サイトの組み立てスクリプト。

content/ にある .md ファイルを読んで、docs/ に .html を書き出します。
使い方:  python build.py
"""

import datetime
import html
import json
import os
import re
import shutil
import subprocess
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

# ---------------------------------------------- 検索・AI・SNS向けの情報
# 公開先のURL（最後の / を忘れずに）。canonical・OGP・sitemap.xml・llms.txt はここから作る
SITE_URL = "https://ryomakom.github.io/r-course/"
# トップページの説明（検索結果やSNSのカードに出る。ほかのページは各ページの lead を使う）
SITE_DESC = ("Rをまったく触ったことのない記者のための入門講座。国勢調査や選挙のデータを使い、"
             "読み込み・加工・グラフ・スクレイピングまでを、つまずきどころと一緒に解説します。")
AUTHOR = "小宮山亮磨"
AUTHOR_ORG = "朝日新聞デジタル企画報道部"
X_HANDLE = "@ryomakom"
X_URL = "https://x.com/ryomakom"
OG_DIR = os.path.join(ASSETS, "og")   # SNS用の画像（tools/make_og.py が作る）

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
    ("第4部　さらに先へ", [
        "20-more",
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

# 工事中の部。ここに書いた部の章は、本文を出さずに「工事中」のページだけを書き出す。
# 公開してよくなったら、この集合から部の名前を消すだけでよい。
WIP_PARTS = set()   # いまは工事中の部はない。工事中にしたいときは {"第3部　データを集める"} のように書く
WIP = {slug for part, slugs in PARTS if part in WIP_PARTS for slug in slugs}

WIP_BODY = """<div class="wip-notice">
<p class="wip-notice-title">工事中</p>
<p>この章はいま書いているところです。公開まで、もうしばらくお待ちください。</p>
<p>先に<a href="index.html">第1部・第2部</a>を進めておくと、この章もすっと読めるはずです。</p>
</div>"""

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


def math(m):
    r"""\(f(x)\) を教科書の数式ふうにする。文字は斜体、かっこや数字は立体のまま。"""
    body = re.sub(r"([A-Za-z])", r"<var>\1</var>", m.group(1))
    return '<span class="math">%s</span>' % body


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
    text = re.sub(r"\\\((.+?)\\\)", math, text)
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


# ------------------------------------------------ チャットの画面（:::chat）
# AIとのやりとりを、チャットのサービスの画面ふうに見せる。
#   @私        ここから自分の発言（右側の吹き出し）
#   @ChatGPT   ここから相手の発言（吹き出しなしで左に流す）。名前は何でもよい（空白を含んでもよい）
#   [添付] 名前  自分の発言のなかに書くと、貼りつけたファイルの札になる（「名前｜種類」も可）
# 画面の上の名前は「:::chat 名前」で変えられる（省略すると相手の名前）。
# ```で囲んだコードのなかの @ の行は、発言の切れ目とは見なさない。
CHAT_ME = {"私", "わたし", "自分", "ユーザー", "user", "me"}   # 英字は大文字小文字を区別しない


def chat_icon(body, cls="chat-ico"):
    return ('<svg class="%s" viewBox="0 0 24 24" aria-hidden="true" focusable="false">%s</svg>'
            % (cls, body))


CHAT_ICONS = {
    "chev": '<path d="m7 10 5 5 5-5"/>',
    "doc": '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>'
           '<path d="M14 3v5h5M9 13h6M9 17h4"/>',
    "copy": '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/>'
            '<path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
    "good": '<path d="M7.5 10.5V20H5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1zm0 0 3.6-6.4a1.9 1.9 0 0 1 3.4 1.5'
            'l-.9 3.9H19a1.8 1.8 0 0 1 1.8 2.1l-1.3 6.8A2 2 0 0 1 17.6 20H7.5"/>',
    "share": '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5"/>',
    "again": '<path d="M19.5 12A7.5 7.5 0 1 1 17 6.4M19.5 4v4.5H15"/>',
    "plus": '<path d="M12 5.5v13M5.5 12h13"/>',
    "mic": '<rect x="9" y="3.5" width="6" height="10.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V20.5"/>',
    "send": '<path d="M12 18V6.5M6.8 11.5 12 6.3l5.2 5.2"/>',
}


def is_me(who):
    return who.lower() in CHAT_ME


def render_chat(lines, title, here, review=False, memo=""):
    """:::chat の中身（行のリスト）を、チャットの画面ふうのHTMLにする。"""
    turns = []                      # [名前, 中身の行, 中身が始まる.mdの行]
    fence = None                    # いま ``` の中にいるなら、その ``` の文字
    for k, line in enumerate(lines):
        line_no = here + 1 + k
        m = None if fence else re.match(r"^@(\S.{0,40}?)\s*$", line)
        if m:
            turns.append([m.group(1), [], line_no + 1])
            continue
        f = re.match(r"^(`{3,})", line)
        if f and fence is None:
            fence = f.group(1)
        elif fence is not None and line.rstrip() == fence:
            fence = None
        if turns:
            turns[-1][1].append(line)
        elif line.strip():
            print("  注意：%s.md の %d行目は :::chat の最初の「@名前」より前にあるので、表示されません"
                  % (CURRENT[0], line_no))
    others = [t[0] for t in turns if not is_me(t[0])]
    app = title or (others[0] if others else "チャット")
    if review:
        REVIEW.append(("box", CURRENT[0], "チャット（%s）" % app))

    log = []
    for who, body, start in turns:
        me = is_me(who)
        files = []
        text = []
        for line in body:
            f = re.match(r"^\[添付\]\s*(.+?)\s*$", line) if me else None
            if f:
                name, _, kind = f.group(1).partition("｜")
                files.append(
                    '<div class="chat-file">%s<span class="chat-file-text">'
                    '<span class="chat-file-name">%s</span>'
                    '<span class="chat-file-kind">%s</span></span></div>'
                    % (chat_icon(CHAT_ICONS["doc"]), inline(name.strip()),
                       inline(kind.strip() or "テキスト")))
                text.append("")         # 行の数をずらさないよう、空行を残す（メモ機能の行番号のため）
            else:
                text.append(line)
        inner = render("\n".join(text), [], base_line=start)
        who_html = '<p class="chat-who">%s：</p>' % esc(who)
        if me:
            log.append('<div class="chat-turn chat-me">%s%s%s</div>' % (
                who_html, "".join(files),
                '<div class="chat-bubble">%s</div>' % inner if inner.strip() else ""))
        else:
            # コピー・よい・よくない（「よい」を逆さに）・共有・作り直し。飾りなので押せない
            tools = (chat_icon(CHAT_ICONS["copy"]) + chat_icon(CHAT_ICONS["good"])
                     + chat_icon(CHAT_ICONS["good"], "chat-ico chat-flip")
                     + chat_icon(CHAT_ICONS["share"]) + chat_icon(CHAT_ICONS["again"]))
            log.append('<div class="chat-turn chat-ai">%s<div class="chat-text">%s</div>'
                       '<div class="chat-tools" aria-hidden="true">%s</div></div>'
                       % (who_html, inner, tools))

    return (
        '<figure class="chat%s" role="group" aria-label="%s とのやりとり">'
        '<div class="chat-bar"><span class="chat-app" aria-hidden="true">%s</span>%s%s</div>'
        '<div class="chat-log">%s</div>'
        '<div class="chat-input" aria-hidden="true">%s'
        '<span class="chat-ph">質問してみましょう</span>%s'
        '<span class="chat-send">%s</span></div>'
        '</figure>%s' % (
            " box-review" if review else "",
            esc(app), esc(app), chat_icon(CHAT_ICONS["chev"], "chat-chev"),
            '<span class="review-tag">要検討</span>' if review else "",
            "".join(log),
            chat_icon(CHAT_ICONS["plus"]), chat_icon(CHAT_ICONS["mic"]),
            chat_icon(CHAT_ICONS["send"]),
            '<p class="memo-mark memo-static">%s</p>' % inline(memo) if memo else ""))


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
            # ```r copy …… この枠だけはコピーを止めない（長い後片づけのコードなど、写すより貼るほうがいいもの）
            copy_ok = "copy" in tokens
            tokens = [t for t in tokens if t != "copy"]
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
                     "html": "ページのソース",
                     "tree": "フォルダの中身"}.get(lang, lang)
            # «ここ» で囲んだ部分、および fence で指定された文字に色をつける
            code = esc(body).replace("«", "<mark>").replace("»", "</mark>")
            for word in marks:
                code = code.replace(esc(word), "<mark>%s</mark>" % esc(word))
            out.append(
                '<div class="code%s" data-lang="%s">'
                '<pre><code>%s</code></pre></div>' % (" copy-ok" if copy_ok else "", esc(label), code)
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
            out.append('<figure class="fig">%s%s</figure>' % (
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
            if kind == "chat":
                out.append(render_chat(buf, title, here, box_review, box_memo))
                continue
            inner_headings = []
            body = render("\n".join(buf), inner_headings, base_line=here + 1)
            label = title or BOX_LABEL.get(kind, "")
            if box_review:
                REVIEW.append(("box", CURRENT[0], label))
            out.append('<aside class="box box-%s%s">%s%s</aside>' % (
                esc(kind),
                " box-review" if box_review else "",
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
            out.append('<h%d id="%s">%s</h%d>' % (level, hid, text, level))
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
            t = ['<div class="table-wrap"><table><thead><tr>']
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
                out.append("<%s>" % tag)
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
            out.append("<blockquote>%s</blockquote>" % inline(" ".join(buf)))
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
        out.append("<p>%s</p>" % inline("".join(buf)))

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
    for k, (part, slugs) in enumerate(PARTS):
        if part:
            rows.append('<p class="nav-part" id="part-%d">%s</p><ul>' % (k, esc(part)))
        else:
            rows.append("<ul>")
        for slug in slugs:
            meta = PAGES[slug][0]
            label = meta.get("nav") or meta.get("title", slug)
            classes = []
            if slug == current:
                classes.append("here")
            if slug in WIP:
                classes.append("wip")
            cls = ' class="%s"' % " ".join(classes) if classes else ""
            href = "index.html" if slug == "index" else slug + ".html"
            tag = '<span class="wip-tag">工事中</span>' if slug in WIP else ""
            rows.append('<li%s><a href="%s">%s%s</a></li>' % (cls, href, esc(label), tag))
        rows.append("</ul>")
    return "\n".join(rows)


PAGE = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{doctitle}</title>
{head}
<link rel="stylesheet" href="assets/style.css">
<script>
// 手元（ファイルを直接開いたとき・localhost）でだけ、「要検討」の印と原稿に書いたメモを出す
(function () {{
  var h = location.hostname;
  if (location.protocol === "file:" || h === "localhost" || h === "127.0.0.1") {{
    document.documentElement.classList.add("local");
  }}
}})();
</script>
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
      <p class="small">©小宮山亮磨 朝日新聞デジタル企画報道部　<a href="https://x.com/ryomakom">@ryomakom</a></p>
    </footer>
  </main>
</div>
<script src="assets/site.js"></script>
</body>
</html>
"""


# --------------------------------------------- 検索・AI・SNS向けの情報を作る
def attr(text):
    """属性値に入れる文字のエスケープ（" も & に変える）。"""
    return html.escape(text, quote=True)


def plain(md_text):
    """lead などのMarkdownから記法を取り除いて、ただの文にする。"""
    t = md_text
    t = re.sub(r"\{\{[?!]\s*(.+?)\s*\}\}", r"\1", t)          # 要検討・メモの印
    t = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", t)           # リンク・画像
    t = re.sub(r"``\s*(.+?)\s*``|`([^`]+)`",
               lambda m: m.group(1) or m.group(2), t)          # コード
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)                   # 太字
    t = re.sub(r"\\\((.+?)\\\)", r"\1", t)                     # 数式
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\s+", " ", t).strip()


def clip(text, limit=120):
    """説明文を limit 字までに縮める。はみ出すときは、なるべく文の切れ目で切る。"""
    if len(text) <= limit:
        return text
    head = text[:limit]
    cut = max(head.rfind("。"), head.rfind("！"), head.rfind("？"))
    if cut >= limit * 0.6:
        return head[:cut + 1]
    return head[:limit - 1] + "…"


def page_url(slug):
    return SITE_URL if slug == "index" else SITE_URL + slug + ".html"


def page_file(slug):
    return "index.html" if slug == "index" else slug + ".html"


def part_of(slug):
    for k, (part, slugs) in enumerate(PARTS):
        if slug in slugs:
            return k, part
    return None, None


def git_dates():
    """content/*.md ごとに（最初のコミット日, 最後のコミット日）を返す。
    まだコミットしていない変更があるファイルは、最後の日付をファイルの更新日時にする。"""
    dates = {}
    try:
        log = subprocess.run(
            ["git", "log", "--format=@%cI", "--name-only", "--", "content"],
            cwd=BASE, capture_output=True, text=True, encoding="utf-8", check=True).stdout
        status = subprocess.run(
            ["git", "status", "--porcelain", "--", "content"],
            cwd=BASE, capture_output=True, text=True, encoding="utf-8", check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        log, status = "", ""
    when = None
    for line in log.splitlines():          # 新しいコミットから順に出てくる
        if line.startswith("@"):
            when = line[1:11]
        elif line.startswith("content/") and line.endswith(".md"):
            slug = line[len("content/"):-3]
            first, last = dates.get(slug, (when, when))
            dates[slug] = (when, last)       # いちばん古いものが最後に残る
    dirty = {re.sub(r"^content/|\.md$", "", l[3:].strip().strip('"'))
             for l in status.splitlines()}
    for slug in ORDER:
        path = os.path.join(CONTENT, slug + ".md")
        mtime = datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat()
        first, last = dates.get(slug, (None, None))
        if last is None or slug in dirty:
            last = max(last or mtime, mtime)
        dates[slug] = (first or last, last)
    return dates


def make_og_images():
    """SNS用の画像を作り直す（Pillowと日本語フォントがあるときだけ）。"""
    sys.path.insert(0, os.path.join(BASE, "tools"))
    try:
        import make_og
    except ImportError:
        make_og = None
    if make_og is None or not make_og.available():
        print("（Pillow か日本語フォントが無いので、SNS用の画像は作り直さず、いまあるものを使います）")
        return
    pages = [(slug, PAGES[slug][0].get("kicker", ""), PAGES[slug][0].get("title", slug))
             for slug in ORDER]
    n = make_og.make_all(pages, OG_DIR)
    if n:
        print("SNS用の画像を %d 枚作り直しました（assets/og/）。" % n)


def og_image(slug):
    """そのページのSNS用画像のURL。章の画像が無ければトップの画像を使う。"""
    for name in (slug, "index"):
        if os.path.exists(os.path.join(OG_DIR, name + ".png")):
            return SITE_URL + "assets/og/%s.png" % name
    return None


def jsonld(data):
    text = json.dumps(data, ensure_ascii=False, indent=1)
    return '<script type="application/ld+json">\n%s\n</script>' % text.replace("</", "<\\/")


PERSON = {
    "@type": "Person",
    "@id": SITE_URL + "#author",
    "name": AUTHOR,
    "url": X_URL,
    "sameAs": [X_URL],
    "affiliation": {"@type": "Organization", "name": AUTHOR_ORG},
}


def structured_data(slug, title, desc, image, dates):
    course_ref = {"@type": "Course", "@id": SITE_URL + "#course",
                  "name": SITE_TITLE, "url": SITE_URL}
    if slug == "index":
        chapters = [s for s in ORDER if s != "index"]
        graph = [
            {"@type": "WebSite", "@id": SITE_URL + "#website", "url": SITE_URL,
             "name": SITE_TITLE, "alternateName": "%s　%s" % (SITE_TITLE, SITE_SUB),
             "description": desc, "inLanguage": "ja",
             "author": {"@id": PERSON["@id"]}, "publisher": {"@id": PERSON["@id"]}},
            dict(course_ref, **{
                "description": desc, "inLanguage": "ja",
                "provider": {"@id": PERSON["@id"]}, "author": {"@id": PERSON["@id"]},
                "educationalLevel": "初心者",
                "audience": {"@type": "Audience", "audienceType": "記者・編集者"},
                "about": ["R", "tidyverse", "データジャーナリズム", "データ分析"],
                "isAccessibleForFree": True,
                "image": image,
                "hasPart": [{"@type": "LearningResource", "name": PAGES[s][0].get("title", s),
                             "url": page_url(s)} for s in chapters],
            }),
            PERSON,
        ]
    else:
        k, part = part_of(slug)
        crumbs = [{"@type": "ListItem", "position": 1, "name": SITE_TITLE, "item": SITE_URL}]
        # 部（「第1部」など）は独立したページがないので、パンくずには入れない（#つきのURLは同じページと見なされるため）
        crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": title,
                       "item": page_url(slug)})
        first, last = dates[slug]
        graph = [
            {"@type": ["Article", "LearningResource"], "@id": page_url(slug) + "#article",
             "headline": title, "name": title, "description": desc,
             "url": page_url(slug), "mainEntityOfPage": page_url(slug),
             "inLanguage": "ja", "image": image,
             "datePublished": first, "dateModified": last,
             "author": PERSON, "publisher": {"@id": PERSON["@id"]},
             "isPartOf": course_ref, "learningResourceType": "講座の章",
             "educationalLevel": "初心者", "isAccessibleForFree": True},
            {"@type": "BreadcrumbList", "itemListElement": crumbs},
        ]
    for node in graph:
        if node.get("image") is None:
            node.pop("image", None)
    return jsonld({"@context": "https://schema.org", "@graph": graph})


def head_html(slug, title, desc, dates):
    """<head> に入れる説明・canonical・OGP・Xのカード・構造化データ。"""
    url = page_url(slug)
    image = og_image(slug)
    og_title = SITE_TITLE if slug == "index" else "%s | %s" % (title, SITE_TITLE)
    rows = [
        '<meta name="description" content="%s">' % attr(desc),
        '<meta name="author" content="%s">' % attr(AUTHOR),
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        '<link rel="canonical" href="%s">' % url,
        '<link rel="icon" href="assets/favicon.png" type="image/png" sizes="64x64">',
        '<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">',
        '<link rel="sitemap" type="application/xml" href="sitemap.xml">',
        '<meta name="theme-color" content="#fbf9f5" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#16171a" media="(prefers-color-scheme: dark)">',
        '<meta property="og:type" content="%s">' % ("website" if slug == "index" else "article"),
        '<meta property="og:site_name" content="%s">' % attr(SITE_TITLE),
        '<meta property="og:locale" content="ja_JP">',
        '<meta property="og:title" content="%s">' % attr(og_title),
        '<meta property="og:description" content="%s">' % attr(desc),
        '<meta property="og:url" content="%s">' % url,
    ]
    if slug != "index":
        first, last = dates[slug]
        rows += ['<meta property="article:author" content="%s">' % X_URL,
                 '<meta property="article:section" content="%s">'
                 % attr(part_of(slug)[1] or SITE_TITLE),
                 '<meta property="article:published_time" content="%s">' % first,
                 '<meta property="article:modified_time" content="%s">' % last]
    alt = SITE_TITLE if slug == "index" else "%s：%s" % (SITE_TITLE, title)
    if image:
        rows += ['<meta property="og:image" content="%s">' % image,
                 '<meta property="og:image:type" content="image/png">',
                 '<meta property="og:image:width" content="1200">',
                 '<meta property="og:image:height" content="630">',
                 '<meta property="og:image:alt" content="%s">' % attr(alt)]
    rows += ['<meta name="twitter:card" content="summary_large_image">',
             '<meta name="twitter:site" content="%s">' % X_HANDLE,
             '<meta name="twitter:creator" content="%s">' % X_HANDLE,
             '<meta name="twitter:title" content="%s">' % attr(og_title),
             '<meta name="twitter:description" content="%s">' % attr(desc)]
    if image:
        rows += ['<meta name="twitter:image" content="%s">' % image,
                 '<meta name="twitter:image:alt" content="%s">' % attr(alt)]
    rows.append(structured_data(slug, title, desc, image, dates))
    return "\n".join(rows)


def html_to_text(body):
    """本文のHTMLを、AI向けのただのテキスト（Markdownふう）にする。
    手元でしか出ない「要検討」の札やメモ、図の中身（SVG）は落とす。"""
    t = body
    t = re.sub(r"(?s)<(script|style|svg)\b.*?</\1>", "", t)
    t = re.sub(r'(?s)<div class="(page-memo|page-review)">.*?</div>', "", t)
    t = re.sub(r'(?s)<p class="memo-mark[^"]*">.*?</p>', "", t)
    t = re.sub(r'(?s)<span class="(review-tag|memo-inline-tag)">.*?</span>', "", t)
    t = re.sub(r'(?s)<div class="chat-(tools|input)"[^>]*>.*?</div>', "", t)
    blocks = []   # コードの枠は中身をそのまま残したいので、いったんよけておく

    def keep(m):
        blocks.append("\n```\n%s\n```\n" % re.sub(r"<[^>]+>", "", m.group(1)))
        return "\x02%d\x02" % (len(blocks) - 1)

    t = re.sub(r'(?s)<div class="code"[^>]*><pre><code>(.*?)</code></pre></div>', keep, t)
    t = re.sub(r"(?s)<code>(.*?)</code>", r"`\1`", t)
    for lv in (2, 3, 4):
        t = re.sub(r"<h%d[^>]*>" % lv, "\n\n" + "#" * lv + " ", t)
    t = re.sub(r'(?s)<p class="box-title">(.*?)</p>', r"\n\n【\1】\n", t)
    t = re.sub(r"<li[^>]*>", "\n- ", t)
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"</(p|h\d|ul|ol|table|tr|blockquote|figure|aside|div)>", "\n", t)
    t = re.sub(r"</t[dh]>", " | ", t)
    t = re.sub(r"<img [^>]*alt=\"([^\"]*)\"[^>]*>", r"［図：\1］", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"\x02(\d+)\x02", lambda m: blocks[int(m.group(1))], t)
    t = html.unescape(t)
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def write_text(name, text):
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_discovery_files(descs, dates, texts):
    """sitemap.xml・robots.txt・llms.txt・llms-full.txt・.nojekyll を毎回書き直す。"""
    # sitemap.xml
    rows = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for slug in ORDER:
        rows.append("  <url><loc>%s</loc><lastmod>%s</lastmod></url>"
                    % (html.escape(page_url(slug)), dates[slug][1]))
    rows.append("</urlset>")
    write_text("sitemap.xml", "\n".join(rows) + "\n")

    # robots.txt（GitHub Pages のプロジェクトサイトでは、検索エンジンが見るのは
    # ドメイン直下の robots.txt だけ。ここに置くのは目印。sitemap は Search Console から登録する）
    write_text("robots.txt", "User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % SITE_URL)

    # llms.txt（https://llmstxt.org/ の書き方）
    rows = ["# %s" % SITE_TITLE, "",
            "> %s" % SITE_DESC, "",
            ("%s（%s）が書いた、記者向けのRの入門講座です。RとRStudioの準備から、tidyverseを使った"
             "データの読み込み・加工（select、mutate、filter、group_by、pivot、join）、ggplot2での"
             "グラフ、rvestでのスクレイピング、扱いにくいExcelの組み替えまでを、国勢調査の人口データなど"
             "実際の公的データで順に学びます。コードはすべて日本語の説明つきで、つまずきやすい点も"
             "書き添えています。講座で使うデータは %sfiles/r-course-data.zip から一括で入手できます。"
             "本文はすべて日本語です。") % (AUTHOR, AUTHOR_ORG, SITE_URL),
            ""]
    for part, slugs in PARTS:
        rows.append("## %s" % (part or "トップ"))
        rows.append("")
        for slug in slugs:
            title = PAGES[slug][0].get("title", slug)
            rows.append("- [%s](%s): %s" % (title, page_url(slug), descs[slug]))
        rows.append("")
    rows += ["## Optional", "",
             "- [全文テキスト](%sllms-full.txt): すべての章の本文をつなげたテキスト" % SITE_URL,
             "- [サイトマップ](%ssitemap.xml)" % SITE_URL, ""]
    write_text("llms.txt", "\n".join(rows))

    # llms-full.txt（全章の本文。大きくなりすぎたら書かない）
    parts = ["# %s\n\n> %s\n\n著者：%s（%s）\n%s" % (SITE_TITLE, SITE_DESC, AUTHOR, AUTHOR_ORG, SITE_URL)]
    for slug in ORDER:
        meta = PAGES[slug][0]
        parts.append("\n\n---\n\n# %s\n\nURL: %s\n%s\n\n%s" % (
            meta.get("title", slug), page_url(slug),
            ("\n" + plain(meta["lead"])) if meta.get("lead") else "", texts[slug]))
    full = "".join(parts) + "\n"
    path = os.path.join(OUT, "llms-full.txt")
    if len(full.encode("utf-8")) < 1_500_000:
        write_text("llms-full.txt", full)
    elif os.path.exists(path):
        os.remove(path)

    # GitHub Pages に Jekyll を通さず、そのまま配信してもらう
    write_text(".nojekyll", "")


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
    make_og_images()   # assets/og/ に作るので、assets をコピーする前に
    dates = git_dates()
    descs, texts = {}, {}
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
        if slug in WIP:
            body = WIP_BODY
        else:
            body = render(raw, headings, base_line=offset)
            for m in re.finditer(r"TODO[^\n<]*", raw):
                todos.append((slug, m.group(0)))

        inpage = ""   # 章の頭の「このページの中身」（見出しの一覧）は出さないことにした

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
        if slug in WIP:
            meta = dict(meta, lead="")
        if meta.get("memo") and slug not in WIP:
            MEMO.append(("page", slug, meta["memo"]))
            banner += ('<div class="page-memo"><p class="page-memo-title">'
                       'この章へのメモ</p><p>%s</p></div>' % inline(meta["memo"]))
        if meta.get("review") and slug not in WIP:
            REVIEW.append(("page", slug, meta["review"]))
            banner = ('<div class="page-review"><p class="page-review-title">'
                      'この章について</p><p>%s</p></div>' % inline(meta["review"]))
        lead = '<p class="lead">%s</p>' % inline(meta["lead"]) if meta.get("lead") else ""
        lead = banner + lead
        title = meta.get("title", slug)
        desc = clip(plain(meta["lead"])) if meta.get("lead") else SITE_DESC
        descs[slug] = desc
        texts[slug] = html_to_text(body)
        html_out = PAGE.format(
            doctitle=esc("%s | %s" % (SITE_TITLE, SITE_SUB) if slug == "index"
                         else "%s | %s" % (title, SITE_TITLE)),
            head=head_html(slug, title, desc, dates),
            title=esc(title),
            site=esc(SITE_TITLE),
            sitesub=esc(SITE_SUB),
            nav=nav_html(slug),
            kicker=esc(meta.get("kicker", "")),
            lead=lead,
            inpage=inpage,
            body=body,
            pager=prev_link + next_link,
            # frontmatter に copy: ok と書いた章（付録など）は、ページのコードを全部コピーできる
            pagecls=("home" if slug == "index" else "chapter")
                    + (" copy-ok" if meta.get("copy", "").strip() == "ok" else ""),
        )
        name = "index.html" if slug == "index" else slug + ".html"
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            f.write(html_out)

    write_discovery_files(descs, dates, texts)
    print("%d ページを %s に書き出しました（sitemap.xml・llms.txt なども）。" % (len(ORDER), OUT))
    if WIP:
        print("（うち %d ページは「工事中」として本文を出していません：%s）"
              % (len(WIP), "、".join(sorted(WIP_PARTS))))
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
