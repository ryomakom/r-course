---
title: 神エクセルを解体する
nav: 19 神エクセルを解体する
kicker: 第3部　データを集める
lead: 上に表題が載っていて、見出しが2段になっていて、シートが何枚もある。あのExcelを、tidyxlとunpivotrで機械が読める形に組み替えます。
---

## 神エクセルとは

役所が公表するExcelファイルには、独特の様式があります。上のほうに表題や日付や注記が入っていて、見出しが2段や3段になっていて、セルが結合されていて一つの見出しが複数の列にまたがっている。途中に小計の行が挟まっていたりもしますし、一つのファイルに同じ形のシートが47枚入っていることもあります。

紙に印刷して人が見るために作られているので、これはこれで理にかなっているわけです。でも `read_excel()` で読むと悲惨なことになります。列名が `...4` `...5` になり、結合されたセルの二つ目以降はNAになり、見出しの2段目はデータの1行目として読まれる。こういうファイルは、しばしば「神エクセル」と呼ばれます。

これを力技で直そうとすると、`rename` と `mutate` と `filter` を延々と書くことになります。しかもシートが何十枚もあれば、シートごとに微妙に形が違って、その全部に対応しなくてはいけません。めんどくさ。

でも、もっとましなやり方があります。

## 考え方をひっくり返す

使うのはtidyxlとunpivotrという2つのパッケージです。

```r
install.packages("tidyxl")
install.packages("unpivotr")
library(tidyxl)
library(unpivotr)
```

:::data この章で使うデータ
[18章](18-download.html)の手順でダウンロードしたファイルを使いますが、うまく落ちてこなかった人は、北海道のぶんをここから取って下さい。

[000979538.xlsx](files/000979538.xlsx)　第50回衆院選（2024年10月27日執行）の小選挙区の市区町村別得票（北海道）

`download` フォルダに入れると、この章のコードがそのまま動きます。総務省が公表しているファイルの写しです。
:::

`read_excel()` は、Excelのシートを「表」として読み込もうとします。だから表の形が崩れていると困るわけです。

一方、tidyxlの `xlsx_cells()` は、セルを一つずつ、バラバラの部品として読み込みます。

```r
"download/000979538.xlsx" %>%
  xlsx_cells()
```

返ってくるのは、こんな形のtibbleです（列が多いので、一部の列だけを、空っぽのセルを省いて表示しています）。

```text
# A tibble: 1,836 × 24
   sheet        address   row   col is_blank data_type character                         numeric
   <chr>        <chr>   <int> <int> <lgl>    <chr>     <chr>                               <dbl>
 1 北海道第１区 A1          1     1 FALSE    character 令和６年１０月２７日執行               NA
 2 北海道第１区 A2          2     1 FALSE    character 衆議院議員総選挙（小選挙区）　...      NA
 3 北海道第１区 A3          3     1 FALSE    character 北海道第１区                           NA
 4 北海道第１区 G3          3     7 FALSE    character [単位：票]                             NA
 5 北海道第１区 A4          4     1 FALSE    character 候補者名                               NA
 6 北海道第１区 B4          4     2 FALSE    character 小林　さとる                           NA
 7 北海道第１区 C4          4     3 FALSE    character 道下　大樹                             NA
（中略）
18 北海道第１区 A6          6     1 FALSE    character 札幌市中央区                           NA
19 北海道第１区 B6          6     2 FALSE    numeric   <NA>                                10260
20 北海道第１区 C6          6     3 FALSE    numeric   <NA>                                49131
```

1行が一つのセルです。何シートの何行目の何列目に、何が入っているか。それがすべて記録されているだけなので、表の形が崩れていようが関係ありません。セルは常にセルであって、崩れようがないからです。

文字のセルの中身は `character` の列に、数値のセルの中身は `numeric` の列に入ります。このファイルの得票数は数値として入っているので、`numeric` のほうです。

ここから、どのセルが見出しでどのセルが中身なのかをこちらが指定して、整然データに組み直していきます。それをやるのがunpivotrというパッケージです。

## beheadで見出しを剥がす

unpivotrの主役は `behead()` という関数です。beheadは「首を切り落とす」という意味で、要するに見出しを1段ずつ剥がして、それをデータの列に変えなさい、という命令です。

北海道のファイルの「北海道第１区」のシートは、こんな形をしています。

```text
     A                    B             C            …   G
1  令和６年１０月２７日執行
2  衆議院議員総選挙（小選挙区）　候補者別市区町村別得票数一覧
3  北海道第１区                                          [単位：票]
4  候補者名            小林　さとる   道下　大樹     …   得票数計
5  市区町村名＼政党名  日本維新の会   立憲民主党     …
6  札幌市中央区               10260        49131     …     114596
7  札幌市北区第１区             334         1399     …       3418
8  札幌市南区                  4480        27833     …      65810
9  札幌市西区第１区            4926        30031     …      66251
10 北海道第１区 合計          20000       108394     …     250075
```

（D〜F列の、ほかの候補者3人を省いています）

上の3行に日付と表題と選挙区名があって、4行目が候補者名、5行目が党派名。A列には市区町村名が並んでいます。いちばん下の行は選挙区全体の合計、いちばん右のG列は、市区町村ごとに全候補者の票を足した合計（得票数計）です。

ほしいのは、こういう形です。

| 市区町村 | 候補者 | 党派 | 得票 |
|---|---|---|---|
| 札幌市中央区 | 小林　さとる | 日本維新の会 | 10260 |
| 札幌市中央区 | 道下　大樹 | 立憲民主党 | 49131 |
| 札幌市北区第１区 | 小林　さとる | 日本維新の会 | 334 |

<figure class="fig">
<svg viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="シートのどのセルが、整然データのどの列になるかを色で示した図">
<defs><marker id="ar19" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="18">Excelのシート（北海道第１区）</text>
<rect class="f-head" x="32" y="28" width="108" height="26"/>
<text class="f-note" x="86.0" y="46.2" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="28" width="74" height="26"/>
<text class="f-note" x="177.0" y="46.2" text-anchor="middle">B</text>
<rect class="f-head" x="214" y="28" width="74" height="26"/>
<text class="f-note" x="251.0" y="46.2" text-anchor="middle">C</text>
<rect class="f-head" x="288" y="28" width="18" height="26"/>
<text class="f-note" x="297.0" y="46.2" text-anchor="middle">…</text>
<rect class="f-head" x="306" y="28" width="52" height="26"/>
<text class="f-note" x="332.0" y="46.2" text-anchor="middle">G</text>
<rect class="f-head" x="10" y="54" width="22" height="26"/>
<text class="f-note" x="21" y="72.2" text-anchor="middle">4</text>
<rect class="f-off" x="32" y="54" width="108" height="26"/>
<text x="36" y="72.2" style="font-size:11px">候補者名</text>
<rect class="f-mark" x="140" y="54" width="74" height="26"/>
<text x="144" y="72.2" style="font-size:11px">小林　さとる</text>
<rect class="f-mark" x="214" y="54" width="74" height="26"/>
<text x="218" y="72.2" style="font-size:11px">道下　大樹</text>
<rect class="f-off" x="306" y="54" width="52" height="26"/>
<text x="310" y="72.2" style="font-size:11px">得票数計</text>
<text class="f-note" x="297.0" y="72.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="80" width="22" height="26"/>
<text class="f-note" x="21" y="98.2" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="80" width="108" height="26"/>
<text x="36" y="98.2" style="font-size:11px">市区町村名＼政党名</text>
<rect class="f-mark2" x="140" y="80" width="74" height="26"/>
<text x="144" y="98.2" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="214" y="80" width="74" height="26"/>
<text x="218" y="98.2" style="font-size:11px">立憲民主党</text>
<rect class="f-off" x="306" y="80" width="52" height="26"/>
<text class="f-note" x="297.0" y="98.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="106" width="22" height="26"/>
<text class="f-note" x="21" y="124.2" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="106" width="108" height="26"/>
<text x="36" y="124.2" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="106" width="74" height="26"/>
<text x="144" y="124.2" style="font-size:11px">10260</text>
<rect class="f-cell" x="214" y="106" width="74" height="26"/>
<text x="218" y="124.2" style="font-size:11px">49131</text>
<rect class="f-off" x="306" y="106" width="52" height="26"/>
<text x="310" y="124.2" style="font-size:11px">114596</text>
<text class="f-note" x="297.0" y="124.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="132" width="22" height="26"/>
<text class="f-note" x="21" y="150.2" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="132" width="108" height="26"/>
<text x="36" y="150.2" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="132" width="74" height="26"/>
<text x="144" y="150.2" style="font-size:11px">334</text>
<rect class="f-cell" x="214" y="132" width="74" height="26"/>
<text x="218" y="150.2" style="font-size:11px">1399</text>
<rect class="f-off" x="306" y="132" width="52" height="26"/>
<text x="310" y="150.2" style="font-size:11px">3418</text>
<text class="f-note" x="297.0" y="150.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="158" width="22" height="26"/>
<text class="f-note" x="21" y="176.2" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="158" width="108" height="26"/>
<text x="36" y="176.2" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="158" width="74" height="26"/>
<text x="144" y="176.2" style="font-size:11px">4480</text>
<rect class="f-cell" x="214" y="158" width="74" height="26"/>
<text x="218" y="176.2" style="font-size:11px">27833</text>
<rect class="f-off" x="306" y="158" width="52" height="26"/>
<text x="310" y="176.2" style="font-size:11px">65810</text>
<text class="f-note" x="297.0" y="176.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="184" width="22" height="26"/>
<text class="f-note" x="21" y="202.2" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="184" width="108" height="26"/>
<text x="36" y="202.2" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="184" width="74" height="26"/>
<text x="144" y="202.2" style="font-size:11px">4926</text>
<rect class="f-cell" x="214" y="184" width="74" height="26"/>
<text x="218" y="202.2" style="font-size:11px">30031</text>
<rect class="f-off" x="306" y="184" width="52" height="26"/>
<text x="310" y="202.2" style="font-size:11px">66251</text>
<text class="f-note" x="297.0" y="202.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="210" width="22" height="26"/>
<text class="f-note" x="21" y="228.2" text-anchor="middle">10</text>
<rect class="f-off" x="32" y="210" width="108" height="26"/>
<text x="36" y="228.2" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-off" x="140" y="210" width="74" height="26"/>
<text x="144" y="228.2" style="font-size:11px">20000</text>
<rect class="f-off" x="214" y="210" width="74" height="26"/>
<text x="218" y="228.2" style="font-size:11px">108394</text>
<rect class="f-off" x="306" y="210" width="52" height="26"/>
<text x="310" y="228.2" style="font-size:11px">250075</text>
<text class="f-note" x="297.0" y="228.2" text-anchor="middle">…</text>
<path class="f-arrow" d="M362 132 H412" marker-end="url(#ar19)"/>
<text class="f-code" x="360" y="122">behead()</text>
<text class="f-label" x="420" y="18">整然データ</text>
<rect class="f-mark3" x="420" y="28" width="96" height="24"/>
<text class="f-th" x="424" y="44" style="font-size:11px">municipality</text>
<rect class="f-mark" x="516" y="28" width="72" height="24"/>
<text class="f-th" x="520" y="44" style="font-size:11px">name</text>
<rect class="f-mark2" x="588" y="28" width="76" height="24"/>
<text class="f-th" x="592" y="44" style="font-size:11px">party</text>
<rect class="f-head" x="664" y="28" width="50" height="24"/>
<text class="f-th" x="668" y="44" style="font-size:11px">vote</text>
<rect class="f-cell" x="420" y="52" width="96" height="24"/>
<text x="424" y="68" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="516" y="52" width="72" height="24"/>
<text x="520" y="68" style="font-size:11px">小林　さとる</text>
<rect class="f-cell" x="588" y="52" width="76" height="24"/>
<text x="592" y="68" style="font-size:11px">日本維新の会</text>
<rect class="f-cell" x="664" y="52" width="50" height="24"/>
<text x="668" y="68" style="font-size:11px">10260</text>
<rect class="f-cell" x="420" y="76" width="96" height="24"/>
<text x="424" y="92" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="516" y="76" width="72" height="24"/>
<text x="520" y="92" style="font-size:11px">道下　大樹</text>
<rect class="f-cell" x="588" y="76" width="76" height="24"/>
<text x="592" y="92" style="font-size:11px">立憲民主党</text>
<rect class="f-cell" x="664" y="76" width="50" height="24"/>
<text x="668" y="92" style="font-size:11px">49131</text>
<rect class="f-cell" x="420" y="100" width="96" height="24"/>
<text x="424" y="116" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="516" y="100" width="72" height="24"/>
<text x="520" y="116" style="font-size:11px">小林　さとる</text>
<rect class="f-cell" x="588" y="100" width="76" height="24"/>
<text x="592" y="116" style="font-size:11px">日本維新の会</text>
<rect class="f-cell" x="664" y="100" width="50" height="24"/>
<text x="668" y="116" style="font-size:11px">334</text>
<rect class="f-cell" x="420" y="124" width="96" height="24"/>
<text x="424" y="140" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="516" y="124" width="72" height="24"/>
<text x="520" y="140" style="font-size:11px">道下　大樹</text>
<rect class="f-cell" x="588" y="124" width="76" height="24"/>
<text x="592" y="140" style="font-size:11px">立憲民主党</text>
<rect class="f-cell" x="664" y="124" width="50" height="24"/>
<text x="668" y="140" style="font-size:11px">1399</text>
<text class="f-note" x="420" y="172">……</text>
<text class="f-note" x="10" y="268">赤（候補者名）→ name、青（党派名）→ party、黄（A列）→ municipality、白い数字 → vote</text>
<text class="f-note" x="10" y="288">灰色のセルは使わない。いちばん右の「得票数計」の列と、いちばん下の「合計」の行は、あとで捨てる</text>
<text class="f-note" x="10" y="308">（D〜F列の、ほかの候補者3人も同じように配られる）</text>
</svg>
<figcaption>シートのどのセルが、整然データのどの列になるか。北海道第１区のシートから、D〜F列（ほかの候補者3人）を省いています。</figcaption>
</figure>

`behead()` を使うと、こう書けます。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区", row >= 4, !is_blank) %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left", "municipality") %>%
  select(municipality, name, party, numeric)
```

```text
# A tibble: 30 × 4
   municipality     name           party        numeric
   <chr>            <chr>          <chr>          <dbl>
 1 札幌市中央区     小林　さとる   日本維新の会   10260
 2 札幌市中央区     道下　大樹     立憲民主党     49131
 3 札幌市中央区     田中　よしひと 参政党         10041
 4 札幌市中央区     千葉　なおこ   日本共産党      9446
 5 札幌市中央区     かとう　貴弘   自由民主党     35718
 6 札幌市中央区     得票数計       <NA>          114596
 7 札幌市北区第１区 小林　さとる   日本維新の会     334
 8 札幌市北区第１区 道下　大樹     立憲民主党      1399
 9 札幌市北区第１区 田中　よしひと 参政党           271
10 札幌市北区第１区 千葉　なおこ   日本共産党       281
# ℹ 20 more rows
```

順番に見ていきましょう。

`filter()` では、まず「北海道第１区」のシートだけに絞っています。そのうえで `row >= 4` で、上の3行（日付と表題と選挙区名）を捨てています。

`!is_blank` は、空っぽのセルを捨てる指定です。`is_blank` はセルが空っぽなら `TRUE` になる列で、頭の `!` は「〜でない」という意味でした（[6章](06-strings-filter.html)）。見た目は空白でも、罫線などの書式がついているセルを、`xlsx_cells()` は1つのセルとして読み込みます。このファイルでは表のすぐ下に、そういう空っぽのセルが何行ぶんも並んでいるので、先に落としておかないと、中身のない行がまじってしまいます。

そのあとに `behead()` が3回出てきます。丸括弧には二つ入っています。一つ目がその見出しの方向、つまりデータから見てどの向きにあるか。二つ目が、剥がした見出しを入れる列の名前です。

方向にはこんなものがあります。

| 指定 | 意味 |
|---|---|
| `"up"` | 真上にある見出し（列の見出し） |
| `"left"` | 真横（左）にある見出し（行の見出し） |
| `"up-left"` | 上にあって、左に寄っている見出し（結合セルや、左端だけに書かれた見出し） |
| `"left-up"` | 左にあって、上に寄っている見出し（グループの先頭の行にだけ書かれた見出し） |

上のコードでは、`"up"` で候補者名と党派名を上から1段ずつ剥がし、そのあと `"left"` で左の市区町村名を剥がしています。1枚ずつ皮をむくように、外側から順番に剥がしていくイメージです。剥がす順番が大事です。

見出しが1段ずつ剥がされて、数字のセルの1行ずつに配られていく様子を、動きで見てみましょう。

<div class="behead-anim anim-host"></div>
<script src="assets/behead-anim.js"></script>

<figure class="fig fig-behead-static fig-anim-static">
<svg viewBox="0 0 720 746" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="札幌市中央区の49131というセル1つに、beheadのたびにラベルがついていく様子を示した図">
<text class="f-label" x="10" y="18">札幌市中央区・道下さんの「49131」のセルを追いかける</text>
<rect class="f-head" x="32" y="36" width="108" height="18"/>
<text class="f-note" x="86.0" y="48.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="36" width="76" height="18"/>
<text class="f-note" x="178.0" y="48.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="36" width="76" height="18"/>
<text class="f-note" x="254.0" y="48.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="54" width="22" height="18"/>
<text class="f-note" x="21" y="66.6" text-anchor="middle">4</text>
<rect class="f-off" x="32" y="54" width="108" height="18"/>
<text x="36" y="66.6" style="font-size:11px">候補者名</text>
<rect class="f-mark" x="140" y="54" width="76" height="18"/>
<text x="144" y="66.6" style="font-size:11px">小林　さとる</text>
<rect class="f-mark" x="216" y="54" width="76" height="18"/>
<text x="220" y="66.6" style="font-size:11px">道下　大樹</text>
<rect class="f-head" x="10" y="72" width="22" height="18"/>
<text class="f-note" x="21" y="84.6" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="72" width="108" height="18"/>
<text x="36" y="84.6" style="font-size:11px">市区町村名＼政党名</text>
<rect class="f-mark2" x="140" y="72" width="76" height="18"/>
<text x="144" y="84.6" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="216" y="72" width="76" height="18"/>
<text x="220" y="84.6" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="10" y="90" width="22" height="18"/>
<text class="f-note" x="21" y="102.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="90" width="108" height="18"/>
<text x="36" y="102.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="90" width="76" height="18"/>
<text x="144" y="102.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="90" width="76" height="18"/>
<text x="220" y="102.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="108" width="22" height="18"/>
<text class="f-note" x="21" y="120.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="108" width="108" height="18"/>
<text x="36" y="120.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="108" width="76" height="18"/>
<text x="144" y="120.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="108" width="76" height="18"/>
<text x="220" y="120.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="126" width="22" height="18"/>
<text class="f-note" x="21" y="138.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="126" width="108" height="18"/>
<text x="36" y="138.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="126" width="76" height="18"/>
<text x="144" y="138.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="126" width="76" height="18"/>
<text x="220" y="138.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="144" width="22" height="18"/>
<text class="f-note" x="21" y="156.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="144" width="108" height="18"/>
<text x="36" y="156.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="144" width="76" height="18"/>
<text x="144" y="156.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="144" width="76" height="18"/>
<text x="220" y="156.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="162" width="22" height="18"/>
<text class="f-note" x="21" y="174.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="162" width="108" height="18"/>
<text x="36" y="174.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="162" width="76" height="18"/>
<text x="144" y="174.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="162" width="76" height="18"/>
<text x="220" y="174.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="90" width="76" height="18"/>
<text class="f-label" x="330" y="50">① 最初</text>
<text class="f-code" x="330" y="70">filter(row >= 4, !is_blank)</text>
<text class="f-note" x="330" y="90">セルがバラバラのまま。ラベルはまだない。</text>
<rect class="f-cell" x="330" y="102" width="370" height="44"/>
<text class="f-note" x="338" y="118">「49131」についているラベル</text>
<text class="f-note" x="338" y="136">（なし）</text>
<line class="f-sep" x1="10" y1="206" x2="710" y2="206"/>
<rect class="f-head" x="32" y="220" width="108" height="18"/>
<text class="f-note" x="86.0" y="232.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="220" width="76" height="18"/>
<text class="f-note" x="178.0" y="232.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="220" width="76" height="18"/>
<text class="f-note" x="254.0" y="232.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="238" width="22" height="18"/>
<text class="f-note" x="21" y="250.6" text-anchor="middle">4</text>
<rect class="f-gone" x="32" y="238" width="108" height="18"/>
<rect class="f-gone" x="140" y="238" width="76" height="18"/>
<rect class="f-gone" x="216" y="238" width="76" height="18"/>
<rect class="f-head" x="10" y="256" width="22" height="18"/>
<text class="f-note" x="21" y="268.6" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="256" width="108" height="18"/>
<text x="36" y="268.6" style="font-size:11px">市区町村名＼政党名</text>
<rect class="f-mark2" x="140" y="256" width="76" height="18"/>
<text x="144" y="268.6" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="216" y="256" width="76" height="18"/>
<text x="220" y="268.6" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="10" y="274" width="22" height="18"/>
<text class="f-note" x="21" y="286.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="274" width="108" height="18"/>
<text x="36" y="286.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="274" width="76" height="18"/>
<text x="144" y="286.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="274" width="76" height="18"/>
<text x="220" y="286.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="292" width="22" height="18"/>
<text class="f-note" x="21" y="304.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="292" width="108" height="18"/>
<text x="36" y="304.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="292" width="76" height="18"/>
<text x="144" y="304.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="292" width="76" height="18"/>
<text x="220" y="304.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="310" width="22" height="18"/>
<text class="f-note" x="21" y="322.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="310" width="108" height="18"/>
<text x="36" y="322.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="310" width="76" height="18"/>
<text x="144" y="322.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="310" width="76" height="18"/>
<text x="220" y="322.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="328" width="22" height="18"/>
<text class="f-note" x="21" y="340.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="328" width="108" height="18"/>
<text x="36" y="340.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="328" width="76" height="18"/>
<text x="144" y="340.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="328" width="76" height="18"/>
<text x="220" y="340.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="346" width="22" height="18"/>
<text class="f-note" x="21" y="358.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="346" width="108" height="18"/>
<text x="36" y="358.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="346" width="76" height="18"/>
<text x="144" y="358.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="346" width="76" height="18"/>
<text x="220" y="358.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="274" width="76" height="18"/>
<text class="f-label" x="330" y="234">② 候補者名を剥がす</text>
<text class="f-code" x="330" y="254">behead("up", "name")</text>
<text class="f-note" x="330" y="274">いちばん上の4行目を剥がして、真上の見出しを配る。</text>
<rect class="f-cell" x="330" y="286" width="370" height="44"/>
<text class="f-note" x="338" y="302">「49131」についているラベル</text>
<text class="f-code" x="338" y="320">name = 道下　大樹</text>
<line class="f-sep" x1="10" y1="390" x2="710" y2="390"/>
<rect class="f-head" x="32" y="404" width="108" height="18"/>
<text class="f-note" x="86.0" y="416.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="404" width="76" height="18"/>
<text class="f-note" x="178.0" y="416.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="404" width="76" height="18"/>
<text class="f-note" x="254.0" y="416.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="422" width="22" height="18"/>
<text class="f-note" x="21" y="434.6" text-anchor="middle">4</text>
<rect class="f-gone" x="32" y="422" width="108" height="18"/>
<rect class="f-gone" x="140" y="422" width="76" height="18"/>
<rect class="f-gone" x="216" y="422" width="76" height="18"/>
<rect class="f-head" x="10" y="440" width="22" height="18"/>
<text class="f-note" x="21" y="452.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="440" width="108" height="18"/>
<rect class="f-gone" x="140" y="440" width="76" height="18"/>
<rect class="f-gone" x="216" y="440" width="76" height="18"/>
<rect class="f-head" x="10" y="458" width="22" height="18"/>
<text class="f-note" x="21" y="470.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="458" width="108" height="18"/>
<text x="36" y="470.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="458" width="76" height="18"/>
<text x="144" y="470.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="458" width="76" height="18"/>
<text x="220" y="470.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="476" width="22" height="18"/>
<text class="f-note" x="21" y="488.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="476" width="108" height="18"/>
<text x="36" y="488.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="476" width="76" height="18"/>
<text x="144" y="488.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="476" width="76" height="18"/>
<text x="220" y="488.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="494" width="22" height="18"/>
<text class="f-note" x="21" y="506.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="494" width="108" height="18"/>
<text x="36" y="506.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="494" width="76" height="18"/>
<text x="144" y="506.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="494" width="76" height="18"/>
<text x="220" y="506.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="512" width="22" height="18"/>
<text class="f-note" x="21" y="524.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="512" width="108" height="18"/>
<text x="36" y="524.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="512" width="76" height="18"/>
<text x="144" y="524.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="512" width="76" height="18"/>
<text x="220" y="524.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="530" width="22" height="18"/>
<text class="f-note" x="21" y="542.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="530" width="108" height="18"/>
<text x="36" y="542.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="530" width="76" height="18"/>
<text x="144" y="542.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="530" width="76" height="18"/>
<text x="220" y="542.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="458" width="76" height="18"/>
<text class="f-label" x="330" y="418">③ 党派名を剥がす</text>
<text class="f-code" x="330" y="438">behead("up", "party")</text>
<text class="f-note" x="330" y="458">次にいちばん上になった5行目を剥がして、真上の見出しを配る。</text>
<rect class="f-cell" x="330" y="470" width="370" height="62"/>
<text class="f-note" x="338" y="486">「49131」についているラベル</text>
<text x="338" y="504">name = 道下　大樹</text>
<text class="f-code" x="338" y="522">party = 立憲民主党</text>
<line class="f-sep" x1="10" y1="574" x2="710" y2="574"/>
<rect class="f-head" x="32" y="588" width="108" height="18"/>
<text class="f-note" x="86.0" y="600.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="588" width="76" height="18"/>
<text class="f-note" x="178.0" y="600.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="588" width="76" height="18"/>
<text class="f-note" x="254.0" y="600.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="606" width="22" height="18"/>
<text class="f-note" x="21" y="618.6" text-anchor="middle">4</text>
<rect class="f-gone" x="32" y="606" width="108" height="18"/>
<rect class="f-gone" x="140" y="606" width="76" height="18"/>
<rect class="f-gone" x="216" y="606" width="76" height="18"/>
<rect class="f-head" x="10" y="624" width="22" height="18"/>
<text class="f-note" x="21" y="636.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="624" width="108" height="18"/>
<rect class="f-gone" x="140" y="624" width="76" height="18"/>
<rect class="f-gone" x="216" y="624" width="76" height="18"/>
<rect class="f-head" x="10" y="642" width="22" height="18"/>
<text class="f-note" x="21" y="654.6" text-anchor="middle">6</text>
<rect class="f-gone" x="32" y="642" width="108" height="18"/>
<rect class="f-cell" x="140" y="642" width="76" height="18"/>
<text x="144" y="654.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="642" width="76" height="18"/>
<text x="220" y="654.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="660" width="22" height="18"/>
<text class="f-note" x="21" y="672.6" text-anchor="middle">7</text>
<rect class="f-gone" x="32" y="660" width="108" height="18"/>
<rect class="f-cell" x="140" y="660" width="76" height="18"/>
<text x="144" y="672.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="660" width="76" height="18"/>
<text x="220" y="672.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="678" width="22" height="18"/>
<text class="f-note" x="21" y="690.6" text-anchor="middle">8</text>
<rect class="f-gone" x="32" y="678" width="108" height="18"/>
<rect class="f-cell" x="140" y="678" width="76" height="18"/>
<text x="144" y="690.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="678" width="76" height="18"/>
<text x="220" y="690.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="696" width="22" height="18"/>
<text class="f-note" x="21" y="708.6" text-anchor="middle">9</text>
<rect class="f-gone" x="32" y="696" width="108" height="18"/>
<rect class="f-cell" x="140" y="696" width="76" height="18"/>
<text x="144" y="708.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="696" width="76" height="18"/>
<text x="220" y="708.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="714" width="22" height="18"/>
<text class="f-note" x="21" y="726.6" text-anchor="middle">10</text>
<rect class="f-gone" x="32" y="714" width="108" height="18"/>
<rect class="f-cell" x="140" y="714" width="76" height="18"/>
<text x="144" y="726.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="714" width="76" height="18"/>
<text x="220" y="726.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="642" width="76" height="18"/>
<text class="f-label" x="330" y="602">④ 市区町村名を剥がす</text>
<text class="f-code" x="330" y="622">behead("left", "municipality")</text>
<text class="f-note" x="330" y="642">いちばん左のA列を剥がして、真横（左）の見出しを配る。</text>
<rect class="f-cell" x="330" y="654" width="370" height="80"/>
<text class="f-note" x="338" y="670">「49131」についているラベル</text>
<text x="338" y="688">name = 道下　大樹</text>
<text x="338" y="706">party = 立憲民主党</text>
<text class="f-code" x="338" y="724">municipality = 札幌市中央区</text>
</svg>
<figcaption>見出しを1段剥がすたびに、中身のセルにラベルが1つずつつく。最後には、どのセルも「どこの、誰の、何党の票か」が分かる1行になる。シートはD〜G列を省いています。</figcaption>
</figure>

最後の `select()` で、ほしい列だけを残しています。得票数は数値なので、`numeric` の列に入っています。

:::tips 1段ずつ実行して確かめる
このコードは、パイプを1本ずつ足しながら実行するのが正解です。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区", row >= 4, !is_blank) %>%
  behead("up", "name") %>%
  select(row, col, name, character, numeric) %>%      # ここで確かめる
  view()
```

`name` という列に、候補者名がその下のセル全部に配られていますか。配られていれば成功です。1つ剥がすたびに、こうやって目で確かめる。これがいちばん早い。

`select(row, col, ...)` で行番号と列番号を残しておくと、元のシートのどこの話なのかが分かって理解しやすくなります。
:::

:::warn tidyxlは.xlsを読めません
`xlsx_cells()` が読めるのは、拡張子が `.xlsx` と `.xlsm` のファイルだけです。古い `.xls` は読めません。

古い形式のファイルにぶつかったら、Excelで開いて `.xlsx` として保存し直すのが手っ取り早いです。「元データは手で触らない」原則と矛盾しますが、元ファイルは残したまま別名で保存すればいいので、実務上は問題になりません。
:::

## 合計の行と列を捨てる

さっきの結果には、まだ余計な行が混じっています。`name` が「得票数計」になっている行と、`municipality` が「北海道第１区 合計」になっている行です。いちばん右の列と、いちばん下の行にあった合計も、ほかのセルと同じように1行ずつになったわけです。このまま足し算すると、同じ票を2回数えることになってしまいます。

なので、こう足します。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区", row >= 4, !is_blank) %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left", "municipality") %>%
  filter(name != "得票数計", !str_detect(municipality, "合計")) %>%
  select(municipality, name, party, vote = numeric)
```

```text
# A tibble: 20 × 4
   municipality     name           party         vote
   <chr>            <chr>          <chr>        <dbl>
 1 札幌市中央区     小林　さとる   日本維新の会 10260
 2 札幌市中央区     道下　大樹     立憲民主党   49131
 3 札幌市中央区     田中　よしひと 参政党       10041
 4 札幌市中央区     千葉　なおこ   日本共産党    9446
 5 札幌市中央区     かとう　貴弘   自由民主党   35718
 6 札幌市北区第１区 小林　さとる   日本維新の会   334
 7 札幌市北区第１区 道下　大樹     立憲民主党    1399
 8 札幌市北区第１区 田中　よしひと 参政党         271
 9 札幌市北区第１区 千葉　なおこ   日本共産党     281
10 札幌市北区第１区 かとう　貴弘   自由民主党    1133
11 札幌市南区       小林　さとる   日本維新の会  4480
12 札幌市南区       道下　大樹     立憲民主党   27833
13 札幌市南区       田中　よしひと 参政党        4612
14 札幌市南区       千葉　なおこ   日本共産党    6280
15 札幌市南区       かとう　貴弘   自由民主党   22605
16 札幌市西区第１区 小林　さとる   日本維新の会  4926
17 札幌市西区第１区 道下　大樹     立憲民主党   30031
18 札幌市西区第１区 田中　よしひと 参政党        5173
19 札幌市西区第１区 千葉　なおこ   日本共産党    5444
20 札幌市西区第１区 かとう　貴弘   自由民主党   20677
```

足したのは、下から2行目の `filter()` です。`name != "得票数計"` で、得票数計の列から来た行を捨てています。`str_detect()` は[6章](06-strings-filter.html)で出てきた、ある文字を含むかどうかを調べる関数でした。頭に `!` をつけて、市区町村名に「合計」を含む行を捨てています。

最後の `select()` では、`numeric` の列の名前を `vote` に変えています。`select()` のなかで `新しい名前 = 古い名前` と書くと、選びながら名前も変えられます。

:::note partyがNAの行で捨ててはいけない
得票数計の列には党派名がないので、さっきの結果では、得票数計の行の `party` がNAになっていました。それなら `filter(!is.na(party))` で捨てればいいと思うかもしれません。

でも、それをやると困ったことになります。無所属の候補者は、党派名のセルが空っぽなのです。「北海道第３区」のシートを同じコードで処理すると、こうなります。

```text
# A tibble: 15 × 4
  municipality       name           party         vote
  <chr>              <chr>          <chr>        <dbl>
1 札幌市白石区第３区 増田　健治     <NA>          4280
2 札幌市白石区第３区 荒井　ゆたか   立憲民主党   32864
3 札幌市白石区第３区 とりこし　良孝 日本維新の会  7978
4 札幌市白石区第３区 伊藤　りち子   日本共産党    9775
5 札幌市白石区第３区 高木　ひろひさ 自由民主党   27989
6 札幌市豊平区       増田　健治     <NA>          5362
# ℹ 9 more rows
```

`!is.na(party)` で捨てていたら、増田さんの票がまるごと消えていました。しかもエラーは出ません。捨てたいものは、なるべくそのものの名前で指定するほうが安全です。
:::

## シートを全部処理する

さて、このファイルには北海道の小選挙区の数だけシートがあります。全部に同じ処理をしたい。[17章](17-loop.html)で覚えたfor文の出番です。今回は「ページの一覧」ではなく「シートの一覧」に対して回します。

まずシート名の一覧を取ります。

```r
sheet_names <- "download/000979538.xlsx" %>%
  excel_sheets()

sheet_names
```

```text
 [1] "北海道第１区"   "北海道第２区"   "北海道第３区"   "北海道第４区"  
 [5] "北海道第５区"   "北海道第６区"   "北海道第７区"   "北海道第８区"  
 [9] "北海道第９区"   "北海道第１０区" "北海道第１１区" "北海道第１２区"
```

`excel_sheets()` はreadxlの関数です（`library(readxl)` を忘れずに）。

そして回します。

```r
vote_data <- tibble()

for (i in sheet_names) {
  vote_data_temporaly <- "download/000979538.xlsx" %>%
    xlsx_cells() %>%
    filter(sheet == i, row >= 4, !is_blank) %>%
    behead("up", "name") %>%
    behead("up", "party") %>%
    behead("left", "municipality") %>%
    filter(name != "得票数計", !str_detect(municipality, "合計")) %>%
    mutate(district = i) %>%
    select(district, municipality, name, party, vote = numeric)

  vote_data <- bind_rows(vote_data, vote_data_temporaly)
}
```

さっきとの違いは二つです。

一つは `filter(sheet == i)` で、「北海道第１区」と決め打ちしていたところを、ループの変数 `i` にしたこと。1周目は「北海道第１区」、2周目は「北海道第２区」のシートが処理されます。

もう一つは `mutate(district = i)` のところ。シート名そのものが選挙区名なので、ループの変数 `i` をデータの一部として持ち込んでいます。これは覚えておくと便利な技です。

12枚のシートを処理し終えると、`vote_data` は539行になります。

:::note シート名が情報になっている
役所のExcelでは、「シート名」や「ファイル名」そのものが重要な情報を持っていることがよくあります。北海道第１区、北海道第２区……というシート名は、まさにそれです。

`read_excel()` で1枚ずつ読んでいると、この情報はどこにも残りません。だから `district = i` のように、明示的にデータの中へ入れてやる必要があります。

このファイルのシート名には、都道府県名まで入っています。なので、全国のファイルをまとめても、北海道の第1区と東京都の第1区を取り違えることはありません。シート名が「第1区」だけだったら、シートの中の表題などから都道府県名を取り出して、一緒に持ち込む必要がありました。ファイル名は `000979538.xlsx` のような番号なので、そこからは分かりません。
:::

## ファイルもシートも全部処理する

47都道府県分のファイルがあり、それぞれにシートが複数ある。というわけで、for文を二重にします。

```r
excel_files <- list.files("download/") %>%
  str_c("download/", .)

# 空のtibbleを初期化
vote_data <- tibble()

# 各ファイルをループ
for (i in excel_files) {
  cells <- xlsx_cells(i)           # ファイルを1回だけ読み込む
  sheet_names <- excel_sheets(i)

  # 各シートをループ
  for (j in sheet_names) {
    vote_data_temp <- cells %>%
      filter(sheet == j, row >= 4, !is_blank) %>%
      behead("up", "name") %>%
      behead("up", "party") %>%
      behead("left", "municipality") %>%
      filter(name != "得票数計", !str_detect(municipality, "合計")) %>%
      mutate(district = j,
             file = basename(i)) %>%
      select(district, municipality, name, party, vote = numeric, file)

    vote_data <- bind_rows(vote_data, vote_data_temp)
  }
}
```

外側のループがファイルを1つずつ、内側のループがそのファイルのシートを1つずつ処理します。シートは全部で289枚あるので、内側の処理は289回まわることになります。

外側のループの最初で、`xlsx_cells(i)` の結果を `cells` に入れています。ファイルを読み込むのは時間がかかるので、シートごとに読み直すのではなく、1回だけ読んでおいて、それを使い回しているわけです。

`file = basename(i)` で、どのファイルから来たデータなのかを記録しています。これがないと、あとで「この行はどこから来たんだ」が追えなくなります。

:::warn 全部同じ形だとは限らない
これだけ大量に処理すると、たいてい例外が出てきます。今回のファイルは、289枚のシートがどれも同じ形をしていました。4行目が候補者名、5行目が党派名、6行目から市区町村が並び、いちばん下が合計の行、いちばん右が得票数計の列。全部のシートで確かめてあります。

でも、これはたまたまです。同じ総務省の同じ種類のファイルでも、第51回（2026年）のものは形が違います。市区町村をA列とB列の2段に分けて書いたシートと、A列だけのシートがまじっていて、途中に小計の行も挟まっています。得票数も、カンマのついた文字として入っています。この章のコードは、そのままでは使えません。ちなみに、比例代表のファイルは形がまったく違います。18章で小選挙区のぶんだけを落としてきたのは、そのためでもあります。

1つのシートでうまくいったコードでも、全部に回したあとで、もう一度確かめる必要があるわけです。

例外にぶつかったときの対処のしかたはいくつかあります。[17章](17-loop.html)でやったように `tryCatch()` で囲んで、失敗したものを後から個別に処理する。あるいは形が同じファイルだけを先に処理して、残りは別のコードを書く。数が少なければ、例外のほうは手で入力してしまうのがいちばん早いこともあります。

どれを選んでもいいのですが、どのファイルを処理して、どのファイルを除いたのかは記録しておいて下さい。黙って除くと、あとで「全国のデータ」と言えなくなります。なぜ除いたのかも、メモに残しておきましょう。
:::

## 数え上げて確かめる

集まったら、必ず確かめます。

```r
# 選挙区の数
vote_data %>% distinct(district) %>% nrow()

# 候補者の数
vote_data %>% distinct(district, name) %>% nrow()

# 政党別の得票
vote_data %>%
  group_by(party) %>%
  summarize(gokei = sum(vote)) %>%
  arrange(desc(gokei))
```

```text
# A tibble: 12 × 2
   party                gokei
   <chr>                <dbl>
 1 自由民主党       20867762.
 2 立憲民主党       15740860.
 3 日本維新の会      6048104.
 4 日本共産党        3695807.
 5 <NA>              2572812.
 6 国民民主党        2349584.
 7 参政党            1357189.
 8 公明党             730401 
 9 れいわ新選組       425445.
10 社会民主党         283287.
11 （日本保守党）     161351 
12 みんなでつくる党    29275 
```

`distinct()` は、重複を除いて種類を数えるための関数です。シート名に都道府県名が入っているので、選挙区は `district` だけで数えられます。選挙区の数は289になっていますか。候補者は、このデータでは1113人です。政党別の合計は、公表されている数字と合っていますか。`party` がNAになっているのは、無所属の候補者の票です。

ちなみに、得票数のなかには「78678.614」のような小数がまじっています。名字や名前（あるいはその読み）が同じ候補者がいて、どちらに入れたのか分からない票を、得票の割合に応じて分けた「按分票」です。この数字は千葉県第８区の柏市のもので、名前が「さとし」という候補者が2人いました。間違いではないので、慌てないで下さい。上の合計で、数字のおしりに「.」がついているのも、この小数のせいです。

合わなければ、どこかを取りこぼしているか、二重に数えているということですから、合うまで直します。各シートのいちばん下にあった「合計」の行を捨てずに取っておいて、候補者ごとに足し上げた数字と見比べるのも、いい確かめ方です。ただし、合計の行も同じコードで取り出すと、コードに誤りがあったときに両方が同じように間違えてしまい、ずれが見えません。合計の行は、セルから直接取り出して見比べるのが安全です。逆にいえば、合ったときには、公表されていない切り口——市区町村別、候補者別、党派別の組み合わせ——で自由に分析できる材料が手に入ったことになるわけです。

:::homework 宿題
一つのファイルにある複数のシートに同じ処理を連続的にほどこすコードを、for文を使ってつくりましょう。

作例は[付録C](a3-shukudai.html)にあります。
:::
