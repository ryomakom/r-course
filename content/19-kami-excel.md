---
title: 神エクセルを解体する
nav: 19 神エクセルを解体する
kicker: 第3部　データを集める
lead: 見出しが2段になっていて、小計の行が挟まっていて、シートが何枚もある。あのExcelを、tidyxlとunpivotrで機械が読める形に組み替えます。
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

[001062204.xlsx](files/001062204.xlsx)　第51回衆院選（2026年2月8日執行）の小選挙区の市区町村別得票（北海道）

`download` フォルダに入れると、この章のコードがそのまま動きます。総務省が公表しているファイルの写しです。
:::

`read_excel()` は、Excelのシートを「表」として読み込もうとします。だから表の形が崩れていると困るわけです。

一方、tidyxlの `xlsx_cells()` は、セルを一つずつ、バラバラの部品として読み込みます。

```r
"download/001062204.xlsx" %>%
  xlsx_cells()
```

返ってくるのは、こんな形のtibbleです（列が多いので、一部の列だけを、空っぽのセルを省いて表示しています）。

```text
# A tibble: 2,871 × 24
  sheet address   row   col is_blank data_type character
  <chr> <chr>   <int> <int> <lgl>    <chr>     <chr>
1 第1区 A2          2     1 FALSE    character 令和８年２月８日執行
2 第1区 D2          2     4 FALSE    character 衆議院小選挙区選出議員選挙　開票結果…
3 第1区 A4          4     1 FALSE    character 北海道選挙管理委員会
4 第1区 A5          5     1 FALSE    character 候補者名
5 第1区 C5          5     3 FALSE    character 道　下　　大　樹
```

1行が一つのセルです。何シートの何行目の何列目に、何が入っているか。それがすべて記録されているだけなので、表の形が崩れていようが関係ありません。セルは常にセルであって、崩れようがないからです。

ここから、どのセルが見出しでどのセルが中身なのかをこちらが指定して、整然データに組み直していきます。それをやるのがunpivotrというパッケージです。

## beheadで見出しを剥がす

unpivotrの主役は `behead()` という関数です。beheadは「首を切り落とす」という意味で、要するに見出しを1段ずつ剥がして、それをデータの列に変えなさい、という命令です。

北海道のファイルの「第1区」のシートは、こんな形をしています。

```text
      A            B              C            D
2  令和８年２月８日執行             衆議院小選挙区選出議員選挙　開票結果…
4  北海道選挙管理委員会
5  候補者名                   道下大樹      臼木ひでたけ   … 得票数計
7  開票区名＼党派名           中道改革連合  国民民主党     …
9  札幌市                      81,560       29,134        ← 札幌市の小計
10              札幌市中央区   36,297       14,627
11              札幌市北区第１  1,053          536
12              札幌市南区     22,137        6,236
13              札幌市西区第１ 22,073        7,735
14 第１区計                    81,560       29,134        ← 選挙区の合計
```

（列を省いたり、候補者名の空白を詰めたりしています）

上に日付や表題があって、5行目が候補者名、7行目が党派名。左にはA列とB列の2段の見出しがあって、A列には「札幌市」のような、いくつかの区をまとめた小計の行が入っています。いちばん下の行は選挙区全体の合計です。

ほしいのは、こういう形です。

| 開票区 | 候補者 | 党派 | 得票 |
|---|---|---|---|
| 札幌市中央区 | 道下大樹 | 中道改革連合 | 36297 |
| 札幌市中央区 | 臼木ひでたけ | 国民民主党 | 14627 |
| 札幌市北区第１ | 道下大樹 | 中道改革連合 | 1053 |

<figure class="fig">
<svg viewBox="0 0 720 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="シートの見出しの部分が、整然データのどの列になるかを色で示した図">
<defs><marker id="ar19" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="18">Excelのシート（第1区）</text>
<rect class="f-head" x="32" y="28" width="58" height="26"/>
<text class="f-note" x="61" y="46.2" text-anchor="middle">A</text>
<rect class="f-head" x="90" y="28" width="84" height="26"/>
<text class="f-note" x="132" y="46.2" text-anchor="middle">B</text>
<rect class="f-head" x="174" y="28" width="74" height="26"/>
<text class="f-note" x="211" y="46.2" text-anchor="middle">C</text>
<rect class="f-head" x="248" y="28" width="74" height="26"/>
<text class="f-note" x="285" y="46.2" text-anchor="middle">D</text>
<rect class="f-head" x="10" y="54" width="22" height="26"/>
<text class="f-note" x="21" y="72.2" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="54" width="58" height="26"/>
<text x="36" y="72.2" style="font-size:11px">候補者名</text>
<rect class="f-cell" x="90" y="54" width="84" height="26"/>
<rect class="f-mark" x="174" y="54" width="74" height="26"/>
<text x="178" y="72.2" style="font-size:11px">道下大樹</text>
<rect class="f-mark" x="248" y="54" width="74" height="26"/>
<text x="252" y="72.2" style="font-size:11px">臼木ひでたけ</text>
<rect class="f-head" x="10" y="80" width="22" height="26"/>
<text class="f-note" x="21" y="98.2" text-anchor="middle">7</text>
<rect class="f-off" x="32" y="80" width="58" height="26"/>
<text x="36" y="98.2" style="font-size:11px">開票区名…</text>
<rect class="f-cell" x="90" y="80" width="84" height="26"/>
<rect class="f-mark2" x="174" y="80" width="74" height="26"/>
<text x="178" y="98.2" style="font-size:11px">中道改革連合</text>
<rect class="f-mark2" x="248" y="80" width="74" height="26"/>
<text x="252" y="98.2" style="font-size:11px">国民民主党</text>
<rect class="f-head" x="10" y="106" width="22" height="26"/>
<text class="f-note" x="21" y="124.2" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="106" width="58" height="26"/>
<text x="36" y="124.2" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="90" y="106" width="84" height="26"/>
<rect class="f-cell" x="174" y="106" width="74" height="26"/>
<text x="178" y="124.2" style="font-size:11px">81,560</text>
<rect class="f-cell" x="248" y="106" width="74" height="26"/>
<text x="252" y="124.2" style="font-size:11px">29,134</text>
<rect class="f-head" x="10" y="132" width="22" height="26"/>
<text class="f-note" x="21" y="150.2" text-anchor="middle">10</text>
<rect class="f-cell" x="32" y="132" width="58" height="26"/>
<rect class="f-mark4" x="90" y="132" width="84" height="26"/>
<text x="94" y="150.2" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="174" y="132" width="74" height="26"/>
<text x="178" y="150.2" style="font-size:11px">36,297</text>
<rect class="f-cell" x="248" y="132" width="74" height="26"/>
<text x="252" y="150.2" style="font-size:11px">14,627</text>
<rect class="f-head" x="10" y="158" width="22" height="26"/>
<text class="f-note" x="21" y="176.2" text-anchor="middle">12</text>
<rect class="f-cell" x="32" y="158" width="58" height="26"/>
<rect class="f-mark4" x="90" y="158" width="84" height="26"/>
<text x="94" y="176.2" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="174" y="158" width="74" height="26"/>
<text x="178" y="176.2" style="font-size:11px">22,137</text>
<rect class="f-cell" x="248" y="158" width="74" height="26"/>
<text x="252" y="176.2" style="font-size:11px">6,236</text>
<rect class="f-head" x="10" y="184" width="22" height="26"/>
<text class="f-note" x="21" y="202.2" text-anchor="middle">14</text>
<rect class="f-mark3" x="32" y="184" width="58" height="26"/>
<text x="36" y="202.2" style="font-size:11px">第１区計</text>
<rect class="f-cell" x="90" y="184" width="84" height="26"/>
<rect class="f-cell" x="174" y="184" width="74" height="26"/>
<text x="178" y="202.2" style="font-size:11px">81,560</text>
<rect class="f-cell" x="248" y="184" width="74" height="26"/>
<text x="252" y="202.2" style="font-size:11px">29,134</text>
<path class="f-arrow" d="M330 120 H398" marker-end="url(#ar19)"/>
<text class="f-code" x="330" y="108">behead()</text>
<text class="f-code2" x="330" y="140">left_join()</text>
<text class="f-label" x="410" y="18">整然データ</text>
<rect class="f-mark3" x="410" y="28" width="56" height="24"/>
<text class="f-th" x="414" y="44" style="font-size:11px">area</text>
<rect class="f-mark4" x="466" y="28" width="84" height="24"/>
<text class="f-th" x="470" y="44" style="font-size:11px">municipality</text>
<rect class="f-mark" x="550" y="28" width="40" height="24"/>
<text class="f-th" x="554" y="44" style="font-size:11px">name</text>
<rect class="f-mark2" x="590" y="28" width="80" height="24"/>
<text class="f-th" x="594" y="44" style="font-size:11px">party</text>
<rect class="f-head" x="670" y="28" width="46" height="24"/>
<text class="f-th" x="674" y="44" style="font-size:11px">vote</text>
<rect class="f-cell" x="410" y="52" width="56" height="24"/>
<text x="414" y="68" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="466" y="52" width="84" height="24"/>
<text class="f-note" x="470" y="68" style="font-size:11px">NA</text>
<rect class="f-cell" x="550" y="52" width="40" height="24"/>
<text x="554" y="68" style="font-size:11px">道下</text>
<rect class="f-cell" x="590" y="52" width="80" height="24"/>
<text x="594" y="68" style="font-size:11px">中道改革連合</text>
<rect class="f-cell" x="670" y="52" width="46" height="24"/>
<text x="674" y="68" style="font-size:11px">81560</text>
<rect class="f-cell" x="410" y="76" width="56" height="24"/>
<text x="414" y="92" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="466" y="76" width="84" height="24"/>
<text class="f-note" x="470" y="92" style="font-size:11px">NA</text>
<rect class="f-cell" x="550" y="76" width="40" height="24"/>
<text x="554" y="92" style="font-size:11px">臼木</text>
<rect class="f-cell" x="590" y="76" width="80" height="24"/>
<text x="594" y="92" style="font-size:11px">国民民主党</text>
<rect class="f-cell" x="670" y="76" width="46" height="24"/>
<text x="674" y="92" style="font-size:11px">29134</text>
<rect class="f-cell" x="410" y="100" width="56" height="24"/>
<text x="414" y="116" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="466" y="100" width="84" height="24"/>
<text x="470" y="116" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="550" y="100" width="40" height="24"/>
<text x="554" y="116" style="font-size:11px">道下</text>
<rect class="f-cell" x="590" y="100" width="80" height="24"/>
<text x="594" y="116" style="font-size:11px">中道改革連合</text>
<rect class="f-cell" x="670" y="100" width="46" height="24"/>
<text x="674" y="116" style="font-size:11px">36297</text>
<rect class="f-cell" x="410" y="124" width="56" height="24"/>
<text x="414" y="140" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="466" y="124" width="84" height="24"/>
<text x="470" y="140" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="550" y="124" width="40" height="24"/>
<text x="554" y="140" style="font-size:11px">臼木</text>
<rect class="f-cell" x="590" y="124" width="80" height="24"/>
<text x="594" y="140" style="font-size:11px">国民民主党</text>
<rect class="f-cell" x="670" y="124" width="46" height="24"/>
<text x="674" y="140" style="font-size:11px">14627</text>
<rect class="f-cell" x="410" y="148" width="56" height="24"/>
<text x="414" y="164" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="466" y="148" width="84" height="24"/>
<text x="470" y="164" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="550" y="148" width="40" height="24"/>
<text x="554" y="164" style="font-size:11px">道下</text>
<rect class="f-cell" x="590" y="148" width="80" height="24"/>
<text x="594" y="164" style="font-size:11px">中道改革連合</text>
<rect class="f-cell" x="670" y="148" width="46" height="24"/>
<text x="674" y="164" style="font-size:11px">22137</text>
<rect class="f-cell" x="410" y="172" width="56" height="24"/>
<text x="414" y="188" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="466" y="172" width="84" height="24"/>
<text x="470" y="188" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="550" y="172" width="40" height="24"/>
<text x="554" y="188" style="font-size:11px">臼木</text>
<rect class="f-cell" x="590" y="172" width="80" height="24"/>
<text x="594" y="188" style="font-size:11px">国民民主党</text>
<rect class="f-cell" x="670" y="172" width="46" height="24"/>
<text x="674" y="188" style="font-size:11px">6236</text>
<text class="f-note" x="410" y="212">……</text>
<text class="f-note" x="10" y="232">赤（候補者名）→ name、青（党派名）→ party、</text>
<text class="f-note" x="10" y="250">黄（A列）→ area、緑（B列）→ municipality、白い数字 → vote</text>
<text class="f-note" x="10" y="268">灰色のセルは、どこにも使わない見出しの残り</text>
</svg>
<figcaption>シートのどのセルが、整然データのどの列になるか。第1区のシートを簡単にしたもので、行を省いたり、候補者名の空白を詰めたりしています。</figcaption>
</figure>

`behead()` を使うと、こう書けます。

```r
cells_1 <- "download/001062204.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "第1区", row >= 5, character != "")

b_col <- cells_1 %>%
  filter(col == 2) %>%
  select(row, municipality = character)

cells_1 %>%
  filter(col != 2) %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left-up", "area") %>%
  left_join(b_col, by = "row") %>%
  filter(!is.na(party)) %>%
  mutate(vote = parse_number(character)) %>%
  select(area, municipality, name, party, vote)
```

```text
# A tibble: 30 × 5
   area   municipality   name               party          vote
   <chr>  <chr>          <chr>              <chr>         <dbl>
 1 札幌市 <NA>           道　下　　大　樹   中道改革連合  81560
 2 札幌市 <NA>           臼　木　　ひでたけ 国民民主党    29134
 3 札幌市 <NA>           森　　つねと       日本共産党    12906
 4 札幌市 <NA>           かとう　　貴　弘   自由民主党   112618
 5 札幌市 <NA>           加　納　　ちずこ   参政党        22024
 6 札幌市 札幌市中央区   道　下　　大　樹   中道改革連合  36297
 7 札幌市 札幌市中央区   臼　木　　ひでたけ 国民民主党    14627
 8 札幌市 札幌市中央区   森　　つねと       日本共産党     5975
 9 札幌市 札幌市中央区   かとう　　貴　弘   自由民主党    52386
10 札幌市 札幌市中央区   加　納　　ちずこ   参政党        10597
# ℹ 20 more rows
```

順番に見ていきましょう。

最初のかたまりの `filter()` では、まず「第1区」のシートだけに絞っています。そのうえで `row >= 5` で、上の4行（日付や表題、選挙管理委員会の名前）を捨てています。`character != ""` は、空っぽの文字が入っているだけのセルを捨てる指定です。このファイルでは6行目と8行目に、見た目は空白なのに「中身が空の文字」が入ったセルが並んでいるので、先に落としておかないと、それを見出しと勘違いしてしまいます。

2つ目のかたまりは、あとで使うB列の部品です。B列のセルだけを取り出して、行番号（`row`）と中身だけにしています。中身の列には `municipality` という名前をつけました。`select()` のなかで `新しい名前 = 古い名前` と書くと、選びながら名前も変えられます。

3つ目のかたまりからが本番で、`behead()` が出てきます。丸括弧には二つ入っています。一つ目がその見出しの方向、つまりデータから見てどの向きにあるか。二つ目が、剥がした見出しを入れる列の名前です。

方向にはこんなものがあります。

| 指定 | 意味 |
|---|---|
| `"up"` | 真上にある見出し（列の見出し） |
| `"left"` | 真横（左）にある見出し（行の見出し） |
| `"up-left"` | 上にあって、左に寄っている見出し（結合セルや、左端だけに書かれた見出し） |
| `"left-up"` | 左にあって、上に寄っている見出し（グループの先頭の行にだけ書かれた見出し） |

上のコードでは、`"up"` で候補者名と党派名を上から1段ずつ剥がし、そのあと左の見出しを剥がしています。1枚ずつ皮をむくように、外側から順番に剥がしていくイメージです。剥がす順番が大事です。

中央区の道下さんの票（36,297）のセルを1つだけ追いかけると、こうなります。

<figure class="fig">
<svg viewBox="0 0 720 920" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="中央区の36,297というセル1つに、beheadのたびにラベルがついていく様子を示した図">
<defs><marker id="ar19" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="18">中央区・道下さんの「36,297」のセルを追いかける</text>
<rect class="f-head" x="32" y="36" width="58" height="18"/>
<text class="f-note" x="61" y="48.6" text-anchor="middle">A</text>
<rect class="f-head" x="90" y="36" width="80" height="18"/>
<text class="f-note" x="130" y="48.6" text-anchor="middle">B</text>
<rect class="f-head" x="170" y="36" width="70" height="18"/>
<text class="f-note" x="205" y="48.6" text-anchor="middle">C</text>
<rect class="f-head" x="240" y="36" width="70" height="18"/>
<text class="f-note" x="275" y="48.6" text-anchor="middle">D</text>
<rect class="f-head" x="10" y="54" width="22" height="18"/>
<text class="f-note" x="21" y="66.6" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="54" width="58" height="18"/>
<text x="36" y="66.6" style="font-size:11px">候補者名</text>
<rect class="f-cell" x="90" y="54" width="80" height="18"/>
<rect class="f-mark" x="170" y="54" width="70" height="18"/>
<text x="174" y="66.6" style="font-size:11px">道下大樹</text>
<rect class="f-mark" x="240" y="54" width="70" height="18"/>
<text x="244" y="66.6" style="font-size:11px">臼木ひでたけ</text>
<rect class="f-head" x="10" y="72" width="22" height="18"/>
<text class="f-note" x="21" y="84.6" text-anchor="middle">7</text>
<rect class="f-off" x="32" y="72" width="58" height="18"/>
<text x="36" y="84.6" style="font-size:11px">開票区名…</text>
<rect class="f-cell" x="90" y="72" width="80" height="18"/>
<rect class="f-mark2" x="170" y="72" width="70" height="18"/>
<text x="174" y="84.6" style="font-size:11px">中道改革連合</text>
<rect class="f-mark2" x="240" y="72" width="70" height="18"/>
<text x="244" y="84.6" style="font-size:11px">国民民主党</text>
<rect class="f-head" x="10" y="90" width="22" height="18"/>
<text class="f-note" x="21" y="102.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="90" width="58" height="18"/>
<text x="36" y="102.6" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="90" y="90" width="80" height="18"/>
<rect class="f-cell" x="170" y="90" width="70" height="18"/>
<text x="174" y="102.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="90" width="70" height="18"/>
<text x="244" y="102.6" style="font-size:11px">29,134</text>
<rect class="f-head" x="10" y="108" width="22" height="18"/>
<text class="f-note" x="21" y="120.6" text-anchor="middle">10</text>
<rect class="f-cell" x="32" y="108" width="58" height="18"/>
<rect class="f-aside" x="90" y="108" width="80" height="18"/>
<text x="94" y="120.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="170" y="108" width="70" height="18"/>
<text x="174" y="120.6" style="font-size:11px">36,297</text>
<rect class="f-cell" x="240" y="108" width="70" height="18"/>
<text x="244" y="120.6" style="font-size:11px">14,627</text>
<rect class="f-head" x="10" y="126" width="22" height="18"/>
<text class="f-note" x="21" y="138.6" text-anchor="middle">12</text>
<rect class="f-cell" x="32" y="126" width="58" height="18"/>
<rect class="f-aside" x="90" y="126" width="80" height="18"/>
<text x="94" y="138.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="170" y="126" width="70" height="18"/>
<text x="174" y="138.6" style="font-size:11px">22,137</text>
<rect class="f-cell" x="240" y="126" width="70" height="18"/>
<text x="244" y="138.6" style="font-size:11px">6,236</text>
<rect class="f-head" x="10" y="144" width="22" height="18"/>
<text class="f-note" x="21" y="156.6" text-anchor="middle">14</text>
<rect class="f-mark3" x="32" y="144" width="58" height="18"/>
<text x="36" y="156.6" style="font-size:11px">第１区計</text>
<rect class="f-cell" x="90" y="144" width="80" height="18"/>
<rect class="f-cell" x="170" y="144" width="70" height="18"/>
<text x="174" y="156.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="144" width="70" height="18"/>
<text x="244" y="156.6" style="font-size:11px">29,134</text>
<rect class="f-hl" x="170" y="108" width="70" height="18"/>
<text class="f-label" x="330" y="50">① B列をよけておく</text>
<text class="f-code" x="330" y="70">filter(col != 2)</text>
<text class="f-note" x="330" y="90">B列（緑）は、あとでくっつけるので、いったんよけておく。</text>
<rect class="f-cell" x="330" y="102" width="370" height="44"/>
<text class="f-note" x="338" y="118">「36,297」についているラベル</text>
<text class="f-note" x="338" y="136">（なし）</text>
<line class="f-sep" x1="10" y1="202" x2="710" y2="202"/>
<rect class="f-head" x="32" y="214" width="58" height="18"/>
<text class="f-note" x="61" y="226.6" text-anchor="middle">A</text>
<rect class="f-head" x="90" y="214" width="80" height="18"/>
<text class="f-note" x="130" y="226.6" text-anchor="middle">B</text>
<rect class="f-head" x="170" y="214" width="70" height="18"/>
<text class="f-note" x="205" y="226.6" text-anchor="middle">C</text>
<rect class="f-head" x="240" y="214" width="70" height="18"/>
<text class="f-note" x="275" y="226.6" text-anchor="middle">D</text>
<rect class="f-head" x="10" y="232" width="22" height="18"/>
<text class="f-note" x="21" y="244.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="232" width="58" height="18"/>
<rect class="f-gone" x="90" y="232" width="80" height="18"/>
<rect class="f-gone" x="170" y="232" width="70" height="18"/>
<rect class="f-gone" x="240" y="232" width="70" height="18"/>
<rect class="f-head" x="10" y="250" width="22" height="18"/>
<text class="f-note" x="21" y="262.6" text-anchor="middle">7</text>
<rect class="f-off" x="32" y="250" width="58" height="18"/>
<text x="36" y="262.6" style="font-size:11px">開票区名…</text>
<rect class="f-cell" x="90" y="250" width="80" height="18"/>
<rect class="f-mark2" x="170" y="250" width="70" height="18"/>
<text x="174" y="262.6" style="font-size:11px">中道改革連合</text>
<rect class="f-mark2" x="240" y="250" width="70" height="18"/>
<text x="244" y="262.6" style="font-size:11px">国民民主党</text>
<rect class="f-head" x="10" y="268" width="22" height="18"/>
<text class="f-note" x="21" y="280.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="268" width="58" height="18"/>
<text x="36" y="280.6" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="90" y="268" width="80" height="18"/>
<rect class="f-cell" x="170" y="268" width="70" height="18"/>
<text x="174" y="280.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="268" width="70" height="18"/>
<text x="244" y="280.6" style="font-size:11px">29,134</text>
<rect class="f-head" x="10" y="286" width="22" height="18"/>
<text class="f-note" x="21" y="298.6" text-anchor="middle">10</text>
<rect class="f-cell" x="32" y="286" width="58" height="18"/>
<rect class="f-aside" x="90" y="286" width="80" height="18"/>
<text x="94" y="298.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="170" y="286" width="70" height="18"/>
<text x="174" y="298.6" style="font-size:11px">36,297</text>
<rect class="f-cell" x="240" y="286" width="70" height="18"/>
<text x="244" y="298.6" style="font-size:11px">14,627</text>
<rect class="f-head" x="10" y="304" width="22" height="18"/>
<text class="f-note" x="21" y="316.6" text-anchor="middle">12</text>
<rect class="f-cell" x="32" y="304" width="58" height="18"/>
<rect class="f-aside" x="90" y="304" width="80" height="18"/>
<text x="94" y="316.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="170" y="304" width="70" height="18"/>
<text x="174" y="316.6" style="font-size:11px">22,137</text>
<rect class="f-cell" x="240" y="304" width="70" height="18"/>
<text x="244" y="316.6" style="font-size:11px">6,236</text>
<rect class="f-head" x="10" y="322" width="22" height="18"/>
<text class="f-note" x="21" y="334.6" text-anchor="middle">14</text>
<rect class="f-mark3" x="32" y="322" width="58" height="18"/>
<text x="36" y="334.6" style="font-size:11px">第１区計</text>
<rect class="f-cell" x="90" y="322" width="80" height="18"/>
<rect class="f-cell" x="170" y="322" width="70" height="18"/>
<text x="174" y="334.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="322" width="70" height="18"/>
<text x="244" y="334.6" style="font-size:11px">29,134</text>
<rect class="f-hl" x="170" y="286" width="70" height="18"/>
<text class="f-label" x="330" y="228">② 候補者名を剥がす</text>
<text class="f-code" x="330" y="248">behead("up", "name")</text>
<text class="f-note" x="330" y="268">いちばん上の5行目を剥がして、</text>
<rect class="f-cell" x="330" y="280" width="370" height="44"/>
<text class="f-note" x="338" y="296">「36,297」についているラベル</text>
<text class="f-code" x="338" y="314">name = 道下大樹</text>
<line class="f-sep" x1="10" y1="380" x2="710" y2="380"/>
<rect class="f-head" x="32" y="392" width="58" height="18"/>
<text class="f-note" x="61" y="404.6" text-anchor="middle">A</text>
<rect class="f-head" x="90" y="392" width="80" height="18"/>
<text class="f-note" x="130" y="404.6" text-anchor="middle">B</text>
<rect class="f-head" x="170" y="392" width="70" height="18"/>
<text class="f-note" x="205" y="404.6" text-anchor="middle">C</text>
<rect class="f-head" x="240" y="392" width="70" height="18"/>
<text class="f-note" x="275" y="404.6" text-anchor="middle">D</text>
<rect class="f-head" x="10" y="410" width="22" height="18"/>
<text class="f-note" x="21" y="422.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="410" width="58" height="18"/>
<rect class="f-gone" x="90" y="410" width="80" height="18"/>
<rect class="f-gone" x="170" y="410" width="70" height="18"/>
<rect class="f-gone" x="240" y="410" width="70" height="18"/>
<rect class="f-head" x="10" y="428" width="22" height="18"/>
<text class="f-note" x="21" y="440.6" text-anchor="middle">7</text>
<rect class="f-gone" x="32" y="428" width="58" height="18"/>
<rect class="f-gone" x="90" y="428" width="80" height="18"/>
<rect class="f-gone" x="170" y="428" width="70" height="18"/>
<rect class="f-gone" x="240" y="428" width="70" height="18"/>
<rect class="f-head" x="10" y="446" width="22" height="18"/>
<text class="f-note" x="21" y="458.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="446" width="58" height="18"/>
<text x="36" y="458.6" style="font-size:11px">札幌市</text>
<rect class="f-cell" x="90" y="446" width="80" height="18"/>
<rect class="f-cell" x="170" y="446" width="70" height="18"/>
<text x="174" y="458.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="446" width="70" height="18"/>
<text x="244" y="458.6" style="font-size:11px">29,134</text>
<rect class="f-head" x="10" y="464" width="22" height="18"/>
<text class="f-note" x="21" y="476.6" text-anchor="middle">10</text>
<rect class="f-cell" x="32" y="464" width="58" height="18"/>
<rect class="f-aside" x="90" y="464" width="80" height="18"/>
<text x="94" y="476.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="170" y="464" width="70" height="18"/>
<text x="174" y="476.6" style="font-size:11px">36,297</text>
<rect class="f-cell" x="240" y="464" width="70" height="18"/>
<text x="244" y="476.6" style="font-size:11px">14,627</text>
<rect class="f-head" x="10" y="482" width="22" height="18"/>
<text class="f-note" x="21" y="494.6" text-anchor="middle">12</text>
<rect class="f-cell" x="32" y="482" width="58" height="18"/>
<rect class="f-aside" x="90" y="482" width="80" height="18"/>
<text x="94" y="494.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="170" y="482" width="70" height="18"/>
<text x="174" y="494.6" style="font-size:11px">22,137</text>
<rect class="f-cell" x="240" y="482" width="70" height="18"/>
<text x="244" y="494.6" style="font-size:11px">6,236</text>
<rect class="f-head" x="10" y="500" width="22" height="18"/>
<text class="f-note" x="21" y="512.6" text-anchor="middle">14</text>
<rect class="f-mark3" x="32" y="500" width="58" height="18"/>
<text x="36" y="512.6" style="font-size:11px">第１区計</text>
<rect class="f-cell" x="90" y="500" width="80" height="18"/>
<rect class="f-cell" x="170" y="500" width="70" height="18"/>
<text x="174" y="512.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="500" width="70" height="18"/>
<text x="244" y="512.6" style="font-size:11px">29,134</text>
<rect class="f-hl" x="170" y="464" width="70" height="18"/>
<text class="f-label" x="330" y="406">③ 党派名を剥がす</text>
<text class="f-code" x="330" y="426">behead("up", "party")</text>
<text class="f-note" x="330" y="446">次に上になった7行目を剥がして、</text>
<rect class="f-cell" x="330" y="458" width="370" height="62"/>
<text class="f-note" x="338" y="474">「36,297」についているラベル</text>
<text x="338" y="492">name = 道下大樹</text>
<text class="f-code" x="338" y="510">party = 中道改革連合</text>
<line class="f-sep" x1="10" y1="558" x2="710" y2="558"/>
<rect class="f-head" x="32" y="570" width="58" height="18"/>
<text class="f-note" x="61" y="582.6" text-anchor="middle">A</text>
<rect class="f-head" x="90" y="570" width="80" height="18"/>
<text class="f-note" x="130" y="582.6" text-anchor="middle">B</text>
<rect class="f-head" x="170" y="570" width="70" height="18"/>
<text class="f-note" x="205" y="582.6" text-anchor="middle">C</text>
<rect class="f-head" x="240" y="570" width="70" height="18"/>
<text class="f-note" x="275" y="582.6" text-anchor="middle">D</text>
<rect class="f-head" x="10" y="588" width="22" height="18"/>
<text class="f-note" x="21" y="600.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="588" width="58" height="18"/>
<rect class="f-gone" x="90" y="588" width="80" height="18"/>
<rect class="f-gone" x="170" y="588" width="70" height="18"/>
<rect class="f-gone" x="240" y="588" width="70" height="18"/>
<rect class="f-head" x="10" y="606" width="22" height="18"/>
<text class="f-note" x="21" y="618.6" text-anchor="middle">7</text>
<rect class="f-gone" x="32" y="606" width="58" height="18"/>
<rect class="f-gone" x="90" y="606" width="80" height="18"/>
<rect class="f-gone" x="170" y="606" width="70" height="18"/>
<rect class="f-gone" x="240" y="606" width="70" height="18"/>
<rect class="f-head" x="10" y="624" width="22" height="18"/>
<text class="f-note" x="21" y="636.6" text-anchor="middle">9</text>
<rect class="f-gone" x="32" y="624" width="58" height="18"/>
<rect class="f-cell" x="90" y="624" width="80" height="18"/>
<rect class="f-cell" x="170" y="624" width="70" height="18"/>
<text x="174" y="636.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="624" width="70" height="18"/>
<text x="244" y="636.6" style="font-size:11px">29,134</text>
<rect class="f-head" x="10" y="642" width="22" height="18"/>
<text class="f-note" x="21" y="654.6" text-anchor="middle">10</text>
<rect class="f-gone" x="32" y="642" width="58" height="18"/>
<rect class="f-aside" x="90" y="642" width="80" height="18"/>
<text x="94" y="654.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="170" y="642" width="70" height="18"/>
<text x="174" y="654.6" style="font-size:11px">36,297</text>
<rect class="f-cell" x="240" y="642" width="70" height="18"/>
<text x="244" y="654.6" style="font-size:11px">14,627</text>
<rect class="f-head" x="10" y="660" width="22" height="18"/>
<text class="f-note" x="21" y="672.6" text-anchor="middle">12</text>
<rect class="f-gone" x="32" y="660" width="58" height="18"/>
<rect class="f-aside" x="90" y="660" width="80" height="18"/>
<text x="94" y="672.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="170" y="660" width="70" height="18"/>
<text x="174" y="672.6" style="font-size:11px">22,137</text>
<rect class="f-cell" x="240" y="660" width="70" height="18"/>
<text x="244" y="672.6" style="font-size:11px">6,236</text>
<rect class="f-head" x="10" y="678" width="22" height="18"/>
<text class="f-note" x="21" y="690.6" text-anchor="middle">14</text>
<rect class="f-gone" x="32" y="678" width="58" height="18"/>
<rect class="f-cell" x="90" y="678" width="80" height="18"/>
<rect class="f-cell" x="170" y="678" width="70" height="18"/>
<text x="174" y="690.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="678" width="70" height="18"/>
<text x="244" y="690.6" style="font-size:11px">29,134</text>
<rect class="f-hl" x="170" y="642" width="70" height="18"/>
<text x="36" y="637" style="font-size:11px">札幌市</text>
<text class="f-code" x="36" y="655" style="font-size:11px">札幌市</text>
<text class="f-code" x="36" y="673" style="font-size:11px">札幌市</text>
<text x="36" y="691" style="font-size:11px">第１区計</text>
<path class="f-arrow f-dash" d="M84 638 V674" marker-end="url(#ar19)"/>
<text class="f-label" x="330" y="584">④ A列を剥がす</text>
<text class="f-code" x="330" y="604">behead("left-up", "area")</text>
<text class="f-note" x="330" y="624">A列を剥がす。「札幌市」は下の行にも配られる。</text>
<rect class="f-cell" x="330" y="636" width="370" height="80"/>
<text class="f-note" x="338" y="652">「36,297」についているラベル</text>
<text x="338" y="670">name = 道下大樹</text>
<text x="338" y="688">party = 中道改革連合</text>
<text class="f-code" x="338" y="706">area = 札幌市</text>
<line class="f-sep" x1="10" y1="736" x2="710" y2="736"/>
<rect class="f-head" x="32" y="748" width="58" height="18"/>
<text class="f-note" x="61" y="760.6" text-anchor="middle">A</text>
<rect class="f-head" x="90" y="748" width="80" height="18"/>
<text class="f-note" x="130" y="760.6" text-anchor="middle">B</text>
<rect class="f-head" x="170" y="748" width="70" height="18"/>
<text class="f-note" x="205" y="760.6" text-anchor="middle">C</text>
<rect class="f-head" x="240" y="748" width="70" height="18"/>
<text class="f-note" x="275" y="760.6" text-anchor="middle">D</text>
<rect class="f-head" x="10" y="766" width="22" height="18"/>
<text class="f-note" x="21" y="778.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="766" width="58" height="18"/>
<rect class="f-gone" x="90" y="766" width="80" height="18"/>
<rect class="f-gone" x="170" y="766" width="70" height="18"/>
<rect class="f-gone" x="240" y="766" width="70" height="18"/>
<rect class="f-head" x="10" y="784" width="22" height="18"/>
<text class="f-note" x="21" y="796.6" text-anchor="middle">7</text>
<rect class="f-gone" x="32" y="784" width="58" height="18"/>
<rect class="f-gone" x="90" y="784" width="80" height="18"/>
<rect class="f-gone" x="170" y="784" width="70" height="18"/>
<rect class="f-gone" x="240" y="784" width="70" height="18"/>
<rect class="f-head" x="10" y="802" width="22" height="18"/>
<text class="f-note" x="21" y="814.6" text-anchor="middle">9</text>
<rect class="f-gone" x="32" y="802" width="58" height="18"/>
<rect class="f-gone" x="90" y="802" width="80" height="18"/>
<rect class="f-cell" x="170" y="802" width="70" height="18"/>
<text x="174" y="814.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="802" width="70" height="18"/>
<text x="244" y="814.6" style="font-size:11px">29,134</text>
<rect class="f-head" x="10" y="820" width="22" height="18"/>
<text class="f-note" x="21" y="832.6" text-anchor="middle">10</text>
<rect class="f-gone" x="32" y="820" width="58" height="18"/>
<rect class="f-gone" x="90" y="820" width="80" height="18"/>
<rect class="f-cell" x="170" y="820" width="70" height="18"/>
<text x="174" y="832.6" style="font-size:11px">36,297</text>
<rect class="f-cell" x="240" y="820" width="70" height="18"/>
<text x="244" y="832.6" style="font-size:11px">14,627</text>
<rect class="f-head" x="10" y="838" width="22" height="18"/>
<text class="f-note" x="21" y="850.6" text-anchor="middle">12</text>
<rect class="f-gone" x="32" y="838" width="58" height="18"/>
<rect class="f-gone" x="90" y="838" width="80" height="18"/>
<rect class="f-cell" x="170" y="838" width="70" height="18"/>
<text x="174" y="850.6" style="font-size:11px">22,137</text>
<rect class="f-cell" x="240" y="838" width="70" height="18"/>
<text x="244" y="850.6" style="font-size:11px">6,236</text>
<rect class="f-head" x="10" y="856" width="22" height="18"/>
<text class="f-note" x="21" y="868.6" text-anchor="middle">14</text>
<rect class="f-gone" x="32" y="856" width="58" height="18"/>
<rect class="f-gone" x="90" y="856" width="80" height="18"/>
<rect class="f-cell" x="170" y="856" width="70" height="18"/>
<text x="174" y="868.6" style="font-size:11px">81,560</text>
<rect class="f-cell" x="240" y="856" width="70" height="18"/>
<text x="244" y="868.6" style="font-size:11px">29,134</text>
<rect class="f-hl" x="170" y="820" width="70" height="18"/>
<text class="f-label" x="330" y="762">⑤ B列をくっつける</text>
<text class="f-code2" x="330" y="782">left_join(b_col, by = "row")</text>
<text class="f-note" x="330" y="802">よけておいたB列を、行番号でくっつける。</text>
<rect class="f-cell" x="330" y="814" width="370" height="98"/>
<text class="f-note" x="338" y="830">「36,297」についているラベル</text>
<text x="338" y="848">name = 道下大樹</text>
<text x="338" y="866">party = 中道改革連合</text>
<text x="338" y="884">area = 札幌市</text>
<text class="f-code" x="338" y="902">municipality = 札幌市中央区</text>
</svg>
<figcaption>見出しを1段剥がすたびに、中身のセルにラベルが1つずつつく。最後には、どのセルも「どこの、誰の、何党の票か」が分かる1行になる。</figcaption>
</figure>

左の見出しのうち、A列には `"left-up"` を使っています。A列の「札幌市」は、そのグループの先頭の行にしか書かれていません。中央区や南区の行のA列は空っぽです。`"left-up"` は「左にあって、上のほう」を探してくれるので、中央区や南区の行にも「札幌市」が配られます。

B列のほうは、`behead()` で剥がさずに、`filter(col != 2)` でいったんよけておいて、あとから `left_join()` で行番号を手がかりにくっつけています。[11章](11-join.html)でやった突合と同じです。B列に何もない行（小計や合計の行）は、`municipality` がNAになります。

なぜこんな回り道をするのか。`behead("left", ...)` は、残っているセルのうち「いちばん左の列」を見出しとして剥がします。北海道のシートなら、A列を剥がしたあとのいちばん左はB列です。ところが東京都などのシートには、B列にセルが一つもありません。そういうシートで `behead("left", ...)` を使うと、B列の代わりにC列、つまり1人目の候補者の得票を見出しとして剥がしてしまうのです。しかもエラーは出ません。その候補者が黙って消えるだけです。B列があるかないかにかかわらず同じように動くよう、B列は行番号でくっつけることにしたわけです。

最後の3行も大事です。

`filter(!is.na(party))` は、表の右端にある「得票数計」と「開票率（％）」の列を落としています。この2列には党派名がないので、`party` がNAになるわけです。

`parse_number()` は、文字の中から数字だけを取り出して数値に変える関数です。このファイルでは、得票数が「81,560 」のように、カンマと空白がついた文字として入っています。そのままでは足し算ができないので、ここで数値に直しています。

:::tips 1段ずつ実行して確かめる
このコードは、パイプを1本ずつ足しながら実行するのが正解です。

```r
"download/001062204.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "第1区", row >= 5, character != "") %>%
  behead("up", "name") %>%
  select(row, col, name, character) %>%      # ここで確かめる
  view()
```

`name` という列に、候補者名がその下のセル全部に配られていますか。配られていれば成功です。1つ剥がすたびに、こうやって目で確かめる。これがいちばん早い。

`select(row, col, ...)` で行番号と列番号を残しておくと、元のシートのどこの話なのかが分かって理解しやすくなります。
:::

:::warn tidyxlは.xlsを読めません
`xlsx_cells()` が読めるのは、拡張子が `.xlsx` と `.xlsm` のファイルだけです。古い `.xls` は読めません。

古い形式のファイルにぶつかったら、Excelで開いて `.xlsx` として保存し直すのが手っ取り早いです。「元データは手で触らない」原則と矛盾しますが、元ファイルは残したまま別名で保存すればいいので、実務上は問題になりません。
:::

## 小計と合計の行を捨てる

さっきの結果には、まだ余計な行が混じっています。「札幌市」の小計の行（`municipality` がNAの行）と、いちばん下の「第１区計」の行です。このまま足し算すると、札幌市の票を2回数えることになってしまいます。

ややこしいのは、A列に入っているのが小計とは限らないことです。たとえば青森県のファイルでは、「青森市」はA列にそのまま書かれていて、その下にB列の区はありません。この場合はA列の行そのものが、ほしい開票区のデータです。一方で「東津軽郡」のように、その下のB列に町村が並んでいるものは小計です。

なので、こういうルールで片づけます。

```r
cells_1 %>%
  filter(col != 2) %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left-up", "area") %>%
  left_join(b_col, by = "row") %>%
  filter(!is.na(party)) %>%
  mutate(vote = parse_number(character)) %>%
  filter(!str_ends(area, "計")) %>%                                 # 選挙区の合計の行を捨てる
  group_by(area) %>%
  filter(!(is.na(municipality) & any(!is.na(municipality)))) %>%   # 小計の行を捨てる
  ungroup() %>%
  mutate(municipality = if_else(is.na(municipality), area, municipality)) %>%
  select(municipality, name, party, vote)
```

足したのは下の6行です。

`filter(!str_ends(area, "計"))` は、A列の名前が「計」で終わる行、つまり「第１区計」の行を捨てています。

その次の3行が小計の片づけです。`group_by(area)` で、A列の名前ごとにグループにしています。「札幌市」のグループには、札幌市の小計の行（B列が空っぽ）と、中央区や南区の行（B列に名前がある）が入っています。`any(!is.na(municipality))` は「このグループのなかに、B列に名前がある行が一つでもあるか」という意味です。あるなら、B列が空っぽの行は小計なので捨てる。一つもなければ（「青森市」のように、A列にそのまま書かれているものなら）、捨てずに残す、というわけです。

最後の `mutate()` で、B列が空っぽの行には、A列の名前を開票区の名前として入れています。`if_else()` は[14章](14-point.html)で出てきた関数ですね。

## シートを全部処理する

さて、このファイルには北海道の小選挙区の数だけシートがあります。全部に同じ処理をしたい。[17章](17-loop.html)で覚えたfor文の出番です。今回は「ページの一覧」ではなく「シートの一覧」に対して回します。

まずシート名の一覧を取ります。

```r
sheet_names <- "download/001062204.xlsx" %>%
  excel_sheets()

sheet_names
```

```text
 [1] "第1区"  "第2区"  "第3区"  "第4区"  "第5区"  "第6区"  "第7区"  "第8区"
 [9] "第9区"  "第10区" "第11区" "第12区"
```

`excel_sheets()` はreadxlの関数です（`library(readxl)` を忘れずに）。

そして回します。

```r
vote_data <- tibble()

for (i in sheet_names) {
  sheet_cells <- "download/001062204.xlsx" %>%
    xlsx_cells() %>%
    filter(sheet == i, row >= 5, character != "")

  b_col <- sheet_cells %>%
    filter(col == 2) %>%
    select(row, municipality = character)

  vote_data_temporaly <- sheet_cells %>%
    filter(col != 2) %>%
    behead("up", "name") %>%
    behead("up", "party") %>%
    behead("left-up", "area") %>%
    left_join(b_col, by = "row") %>%
    filter(!is.na(party)) %>%
    mutate(vote = parse_number(character)) %>%
    filter(!str_ends(area, "計")) %>%
    group_by(area) %>%
    filter(!(is.na(municipality) & any(!is.na(municipality)))) %>%
    ungroup() %>%
    mutate(municipality = if_else(is.na(municipality), area, municipality),
           district = i) %>%
    select(district, municipality, name, party, vote)

  vote_data <- bind_rows(vote_data, vote_data_temporaly)
}
```

さっきとの違いは二つです。

一つは `filter(sheet == i)` で、「第1区」と決め打ちしていたところを、ループの変数 `i` にしたこと。1周目は「第1区」、2周目は「第2区」のシートが処理されます。B列の部品（`b_col`）も、シートごとに作り直しています。

もう一つは `mutate()` のなかの `district = i` のところ。シート名そのものが選挙区名なので、ループの変数 `i` をデータの一部として持ち込んでいます。これは覚えておくと便利な技です。

:::note シート名が情報になっている
役所のExcelでは、「シート名」や「ファイル名」そのものが重要な情報を持っていることがよくあります。第1区、第2区……というシート名は、まさにそれです。

`read_excel()` で1枚ずつ読んでいると、この情報はどこにも残りません。だから `district = i` のように、明示的にデータの中へ入れてやる必要があります。

ただ、このシート名には都道府県名が入っていません。北海道の第1区も東京都の第1区も、同じ「第1区」です。ファイル名も `001062204.xlsx` のような番号なので、そこからも分かりません。でも、シートをよく見ると、4行目に「北海道選挙管理委員会」と書いてあります。次のコードでは、ここから都道府県名を取り出して、一緒に持ち込んでいます。
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
    sheet_cells <- cells %>%
      filter(sheet == j)

    # 4行目の「〇〇選挙管理委員会」から、都道府県名を取り出す
    pref <- sheet_cells %>%
      filter(address == "A4") %>%
      pull(character) %>%
      str_remove("選挙管理委員会")

    sheet_cells <- sheet_cells %>%
      filter(row >= 5, character != "")

    b_col <- sheet_cells %>%
      filter(col == 2) %>%
      select(row, municipality = character)

    vote_data_temp <- sheet_cells %>%
      filter(col != 2) %>%
      behead("up", "name") %>%
      behead("up", "party") %>%
      behead("left-up", "area") %>%
      left_join(b_col, by = "row") %>%
      filter(!is.na(party)) %>%
      mutate(vote = parse_number(character)) %>%
      filter(!str_ends(area, "計")) %>%
      group_by(area) %>%
      filter(!(is.na(municipality) & any(!is.na(municipality)))) %>%
      ungroup() %>%
      mutate(municipality = if_else(is.na(municipality), area, municipality),
             prefecture = pref,
             district = j,
             file = basename(i)) %>%
      select(prefecture, district, municipality, name, party, vote, file)

    vote_data <- bind_rows(vote_data, vote_data_temp)
  }
}
```

外側のループがファイルを1つずつ、内側のループがそのファイルのシートを1つずつ処理します。シートは全部で289枚あるので、内側の処理は289回まわることになります。

外側のループの最初で、`xlsx_cells(i)` の結果を `cells` に入れています。ファイルを読み込むのは時間がかかるので、シートごとに読み直すのではなく、1回だけ読んでおいて、それを使い回しているわけです。

`pull()` は、tibbleから1つの列を取り出して、ただの値の並びにする関数です。4行目のA列のセルは1つしかないので、「北海道選挙管理委員会」という文字が一つだけ取り出されます。そこから `str_remove()` で「選挙管理委員会」を取り除けば、「北海道」が残ります。

`file = basename(i)` で、どのファイルから来たデータなのかを記録しています。これがないと、あとで「この行はどこから来たんだ」が追えなくなります。

:::warn 全部同じ形だとは限らない
これだけ大量に処理すると、たいてい例外が出てきます。今回のファイルは、289枚のシートの枠組み（上の見出しの位置や、右端の列）はどれも同じでした。それでも、市区町村の書き方はA列にそのまま書くものと、A列の小計の下のB列に並べるものの2通りがありました。B列がまったくないシートも、289枚のうち80枚あります。B列を `behead()` ではなく `left_join()` でくっつけたのも、小計の行の片づけ方も、この違いに合わせたものです。ちなみに、比例代表のファイルは形がまったく違います。18章で小選挙区のぶんだけを落としてきたのは、そのためでもあります。

北海道のシートだけで試していたら、B列がないシートのことには気づけませんでした。1つのシートでうまくいったコードでも、全部に回したあとで、もう一度確かめる必要があるわけです。

例外にぶつかったときの対処のしかたはいくつかあります。[17章](17-loop.html)でやったように `tryCatch()` で囲んで、失敗したものを後から個別に処理する。あるいは形が同じファイルだけを先に処理して、残りは別のコードを書く。数が少なければ、例外のほうは手で入力してしまうのがいちばん早いこともあります。

どれを選んでもいいのですが、どのファイルを処理して、どのファイルを除いたのかは記録しておいて下さい。黙って除くと、あとで「全国のデータ」と言えなくなります。なぜ除いたのかも、メモに残しておきましょう。
:::

## 数え上げて確かめる

集まったら、必ず確かめます。

```r
# 選挙区の数
vote_data %>% distinct(prefecture, district) %>% nrow()

# 候補者の数
vote_data %>% distinct(prefecture, district, name) %>% nrow()

# 政党別の得票
vote_data %>%
  group_by(party) %>%
  summarize(gokei = sum(vote)) %>%
  arrange(desc(gokei))
```

`distinct()` は、重複を除いて種類を数えるための関数です。選挙区は「第1区」だけでは都道府県の区別がつかないので、`prefecture` と `district` の組み合わせで数えています。選挙区の数は289になっていますか。候補者は、このデータでは1119人です。政党別の合計は、公表されている数字と合っていますか。

ちなみに、得票数のなかには「2675.287」のような小数がまじっています。名字や名前（あるいはその読み）が同じ候補者がいて、どちらに入れたのか分からない票を、得票の割合に応じて分けた「按分票」です。この数字は茨城県第2区のもので、名前が「たくみ」という候補者が2人いました。間違いではないので、慌てないで下さい。

合わなければ、どこかを取りこぼしているか、二重に数えているということですから、合うまで直します。各シートのいちばん下にあった「第〇区計」の行を捨てずに取っておいて、候補者ごとに足し上げた数字と見比べるのも、いい確かめ方です。ただし、計の行も同じコードで取り出すと、コードに誤りがあったときに両方が同じように間違えてしまい、ずれが見えません。計の行は、セルから直接取り出して見比べるのが安全です。逆にいえば、合ったときには、公表されていない切り口——市区町村別、候補者別、党派別の組み合わせ——で自由に分析できる材料が手に入ったことになるわけです。

:::homework 宿題
一つのファイルにある複数のシートに同じ処理を連続的にほどこすコードを、for文を使ってつくりましょう。

作例は[付録C](a3-shukudai.html)にあります。
:::
