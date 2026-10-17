---
title: 神の頭を切り落とす
nav: 19 神エクセルを扱いやすく
kicker: 第3部　データを集める
lead: 物騒なタイトルですいません、が、そんなに物騒な話ではありません。主に役所が出している、めんどくさいExcelを、分析しやすい形に組み替えるかんたんなやり方を説明します。
---

## 神エクセルとは



役所（だけではないですが）が公表するExcelファイルには、独特の様式があります。上のほうに表題やら注釈やらがあって、データのラベルに当たるものが2段や3段に分かれて書いてあって、おまけにセルが結合されている。Excelが表計算ソフトではなく「方眼紙」として使われた結果です。

こうした資料は基本的に、紙に印刷して人が見るために作られています。[09章](09-pivot.html)でも説明しましたが、人間にとってはこういうスタイルのほうが見やすいし分かりやすい。その意味では理にかなっているわけです。

でも `read_excel()` で読むと悲惨なことになります。結合されたセルの二つめ以降はNAになり、ラベルの2段目はデータの1行目として読まれる。もうぐちゃぐちゃ。その筋では「紙＝神」をもじって「神エクセル」「ネ申エクセル」と呼ばれ、はっきり言って忌み嫌われます。

こういうファイルを読み込んで、分析可能な形に力技で直そうとすると、`rename` と `mutate` と `filter` を延々と書くことになります。しかもシートが何十枚もあれば、それぞれ微妙に形が違ったりするわけで、一つひとつプログラムを書き換えなくてはいけない。つらい。

でも、もっとマシなやり方があります。

## 二つの武器で戦う

使うのはtidyxlとunpivotrという二つのパッケージです。

```r
install.packages("tidyxl")
install.packages("unpivotr")
library(tidyxl)
library(unpivotr)
```

:::data この章で使うデータ
[18章](18-download.html)の手順でダウンロードしたファイルを使いますが、うまく落ちてこなかった人は、北海道のぶんをここから取って下さい。

[000979538.xlsx](files/000979538.xlsx)　2024年にあった第50回衆院選の小選挙区の市区町村別得票（北海道）

`download` フォルダに入れると、この章のコードがそのまま動きます。総務省が公表しているファイルの写しです。
:::

北海道の市区町村別得票データをExcelで開くと、「北海道第１区」のシートはこんな感じでした。

![Excelで開いた「北海道第１区」のシート。上に日付と表題と選挙区名があり、その下に候補者名・政党名の2段のラベル、左に市区町村名が並び、いちばん下が合計の行、いちばん右が得票数計の列になっている](images/19-excel.png "000979538.xlsx の「北海道第１区」のシートを、Excelで開いたところ")

最初の3行はデータではなく注釈。数字のうち、たとえば一番左上にある「10,260」は、「日本維新の会」所属の「小林さとる氏」が「札幌市中央区」で獲得した得票数を示しています。これは人間の目には一目瞭然なのですが、人間の常識を持ち合わせないコンピューターには読み取ることができません。

そこで、以下のような形に加工していくことが必要なわけです。縦長の、いわゆる整然（tidy）データです。

| 市区町村 | 候補者 | 政党 | 得票 |
|---|---|---|---|
| 札幌市中央区 | 小林　さとる | 日本維新の会 | 10260 |
| 札幌市中央区 | 道下　大樹 | 立憲民主党 | 49131 |
| 札幌市北区第１区 | 小林　さとる | 日本維新の会 | 334 |

`tidyxl`パッケージの`xlsx_cells()`という関数で表をセルごとにバラしたうえで、`unpivotr`パッケージの`behead()`関数でうまいことラベルを取り出してやると、この加工が簡単にできます。こんなイメージです。

<figure class="fig">
<svg viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="シートのどのセルが、整然データのどの列になるかを色で示した図">
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
<text class="f-note" x="10" y="268">赤（候補者名）→ name、青（政党名）→ party、黄（A列）→ municipality、白い数字 → vote</text>
</svg>
</figure>

コードはこんな感じ。`behead()`が最重要なわけですが、これは市区町村名や候補者名など、データのラベルに当たるものを切り離して、しかるべきところへ格納するための関数です。「首をはねる」という意味の英語から来ています（たぶん）。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区", row >= 4, !is_blank) %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left", "municipality") %>%
  select(municipality, name, party, numeric)
```

それぞれのコードが何をしているのか、順番に見ていきましょう。

`xlsx_cells()` はExcelの各セルを行にばらす関数です。たとえば3行×4列の表なら、12行のtibbleに変換します。それぞれの行には、もとのExcelでのセルの位置（行番号・列番号）や、セルに入力されている値、データの種類などが記録されます。

次に`filter()` で「北海道第１区」のシートだけに絞っています。そのうえで `row >= 4` で、上の3行（日付と表題と選挙区名）を捨てています。


`is_blank` は`xlsx_cells()`関数で生成され、セルが空っぽのときに `TRUE` になる列です。頭に `!` をつけると「〜でない」という意味になる（[6章](06-strings-filter.html)）ので、ここでは空っぽでないセルだけを抽出しています。見た目は空白でも罫線などの書式がついていれば、`xlsx_cells()` はそれを一つのセルとして読み込みます。このファイルでは表のすぐ下に、そういう空っぽのセルが何行ぶんも並んでいるので、先に落としておかないと、中身のない行がまじってしまいます。

そのあとに `behead()` が3回出てきます。丸括弧の中には二つの要素が記述されています。データのラベルに当たるセルが、そのデータの入ったセルから見てどこにあるかを`up`とか`left`とかで示すのが、一つめの要素。そのラベルを何という名前の列に入れるかを決めるのが、二つめです。

一つめの要素では以下のような指定ができます。

| 指定 | 各セルから見た探し方 |
|---|---|
| `"up"` | 上に進み、表の上端にあるセルを探す |
| `"left"` | 左に進み、表の左端にあるセルを探す |
| `"up-left"` | 上端まで進み、そこが空白なら左に進んで値のあるセルを探す |
| `"left-up"` | 左端まで進み、そこが空白なら上に進んで値のあるセルを探す |

上のコードでは、`"up"` で候補者名と政党名を上から一つずつ切り離し、そのあと `"left"` で左の市区町村名を切り離しています。1枚ずつ皮をむくように、外側から順番にはがしていくイメージです。**はがす順番が大事です。**

1枚ずつはがされていく様子を、動きで見てみましょう。

<div class="behead-anim anim-host"></div>
<script src="assets/behead-anim.js"></script>

<figure class="fig fig-behead-static fig-anim-static">
<svg viewBox="0 0 720 746" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="札幌市中央区の49131というセル一つに、beheadのたびにラベルがついていく様子を示した図">
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
<text class="f-note" x="330" y="274">いちばん上の4行目を剥がして、真上のラベルを配る。</text>
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
<text class="f-label" x="330" y="418">③ 政党名を剥がす</text>
<text class="f-code" x="330" y="438">behead("up", "party")</text>
<text class="f-note" x="330" y="458">次にいちばん上になった5行目を剥がして、真上のラベルを配る。</text>
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
<text class="f-note" x="330" y="642">いちばん左のA列を剥がして、真横（左）のラベルを配る。</text>
<rect class="f-cell" x="330" y="654" width="370" height="80"/>
<text class="f-note" x="338" y="670">「49131」についているラベル</text>
<text x="338" y="688">name = 道下　大樹</text>
<text x="338" y="706">party = 立憲民主党</text>
<text class="f-code" x="338" y="724">municipality = 札幌市中央区</text>
</svg>
<figcaption>上や左のラベルを1段剥がすたびに、数字のセルにラベルが一つずつつく。最後には、どのセルも「どこの、誰の、何党の票か」が分かる1行になる。シートはD〜G列を省いています。</figcaption>
</figure>

このコードを1行ずつ、順番に実行してみてください。どんなふうにデータが加工されていくか確かめると、腑に落ちるようになると思います。

最後の `select()` では、ほしい列だけを残しています。得票数は数値なので、`numeric` の列に入っています。

:::warn tidyxlは.xlsを読めません
`xlsx_cells()` が読めるのは、拡張子が `.xlsx` と `.xlsm` のファイルだけです。古い `.xls` は読めません。

古い形式のファイルにぶつかったら、Excelで開いて `.xlsx` として保存し直すのが手っ取り早いです。「元データは手で触らない」原則と矛盾しますが、元ファイルは残したまま別名で保存すればいいので、実務上は問題になりません。
:::

## シートを全部処理する

さて、このファイルには北海道の小選挙区の数だけシートがあります。全部に同じ処理をしたい。[17章](17-loop.html)で覚えたfor文の出番です。今回は「ページの一覧」ではなく「シートの一覧」に対してループを回します。

まずシート名の一覧を取ります。

```r
sheet_names <- "download/000979538.xlsx" %>%
  excel_sheets() # シート名をとる関数

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
vote_data <- tibble() # まずは空っぽのtibbleを作る

for (i in sheet_names) {
  vote_data_temporaly <- "download/000979538.xlsx" %>%
    xlsx_cells() %>%
    filter(sheet == i, row >= 4, !is_blank) %>%
    behead("up", "name") %>%
    behead("up", "party") %>%
    behead("left", "municipality") %>%
    mutate(district = i) %>%
    select(district, municipality, name, party, vote = numeric)

  vote_data <- bind_rows(vote_data, vote_data_temporaly)
}
```

さっきとの違いは二つです。

一つは `filter(sheet == i)` で、「北海道第１区」と決め打ちしていたところを、ループの変数 `i` にしたこと。ループの1周目では「北海道第１区」、2周目では「北海道第２区」のシートが処理されます。

もう一つは `mutate(district = i)` のところ。変数 `i` をデータの一部として持ち込んでいます。小選挙区名を格納するための列を足しているわけです。

:::note シート名が情報になっている
役所のExcelでは、「シート名」や「ファイル名」そのものが重要な情報を持っていることがよくあります。北海道第１区、北海道第２区……というシート名は、まさにそれです。

`read_excel()` で1枚ずつ読んでいると、この情報はどこにも残りません。だから `district = i` のように、**明示的にデータの中へ入れてやる必要があります。**

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
      mutate(district = j,
             file = basename(i)) %>%
      select(district, municipality, name, party, vote = numeric, file)

    vote_data <- bind_rows(vote_data, vote_data_temp)
  }
}
```

外側のループがファイルを一つずつ、内側のループがそのファイルのシートを一つずつ処理します。シートは全部で289枚あるので、内側の処理は289回まわることになります。

外側のループの最初で、`xlsx_cells(i)` の結果を `cells` に入れています。ファイルを読み込むのは時間がかかるので、シートごとに読み直すのではなく、1回だけ読んでおいて、それを使い回しているわけです。

`file = basename(i)` で、どのファイルから来たデータなのかを記録しています。これがないと、あとで「この行はどこから来たんだ」が追えなくなります。

:::warn 全部同じ形だとは限らない
これだけ大量に処理すると、たいてい例外が出てきます。今回のファイルは、289枚のシートがどれも同じ形をしていました。4行目が候補者名、5行目が政党名、6行目から市区町村が並び、いちばん下が合計の行、いちばん右が得票数計の列。全部のシートで確かめてあります。

でも、これはたまたまです。同じ総務省の同じ種類のファイルでも、第51回（2026年）のものは形が違います。市区町村をA列とB列の2段に分けて書いたシートと、A列だけのシートがまじっていて、途中に小計の行も挟まっています。得票数も、カンマのついた文字として入っています。この章のコードは、そのままでは使えません。ちなみに、比例代表のファイルは形がまったく違います。18章で小選挙区のぶんだけを落としてきたのは、そのためでもあります。

一つのシートでうまくいったコードでも、全部に回したあとで、もう一度確かめる必要があるわけです。

例外にぶつかったときの対処のしかたはいくつかあります。[17章](17-loop.html)でやったように `tryCatch()` で囲んで、失敗したものを後から個別に処理する。あるいは形が同じファイルだけを先に処理して、残りは別のコードを書く。数が少なければ、例外のほうは手で入力してしまうのがいちばん早いこともあります。

どれを選んでもいいのですが、**どのファイルを処理して、どのファイルを除いたのかは記録しておいて下さい。**黙って除くと、あとで「全国のデータ」と言えなくなります。なぜ除いたのかも、メモに残しておきましょう。
:::

## 数え上げて確かめる

集まったら、必ず確かめます。ここで、とっておいた合計の行の出番です。

市区町村ごとの全候補者の票を足し上げたものと、各シートの合計の行にある「得票数計」（その選挙区の票の総数）を足したものが、一致するかを見てみます。

```r
# 市区町村ごとの、全候補者の票を足す
vote_data %>%
  filter(name != "得票数計", !str_detect(municipality, "合計")) %>%
  summarize(gokei = sum(vote))

# 合計の行にある「得票数計」を足す
vote_data %>%
  filter(name == "得票数計", str_detect(municipality, "合計")) %>%
  summarize(gokei = sum(vote))
```

```text
# A tibble: 1 × 1
      gokei
      <dbl>
1 54261878.
# A tibble: 1 × 1
      gokei
      <dbl>
1 54261878.
```

一つめの `filter()` では、得票数計の列から来た行と、合計の行から来た行を除いて、市区町村ごとの票だけを残しています。二つめは逆に、合計の行の得票数計だけを残しています。`str_detect()` は[6章](06-strings-filter.html)で出てきた、ある文字を含むかどうかを調べる関数でした。

どちらも5426万1878票で、一致しました。

さらに、総務省が別に公表している、都道府県ごとの有効投票数をまとめた[表](https://www.soumu.go.jp/main_content/000979129.xls)を開いてみると、小選挙区の有効投票数の合計は5426万1878票。こちらで足し上げた数字と一致していました。

ちなみに、「54261878.」というふうに、数字のおしりに「.」がついているのは、得票数のなかに小数がまじっていて、足し合わせた数字が整数にはなっていないからです。なんで小数が混じった数字があるのかといえば、按分票があるから。按分票とは……説明不要ですよね。

:::homework 宿題
一つのファイルにある複数のシートに同じ処理を連続的にほどこすコードを、for文を使ってつくりましょう。

作例は[付録C](a3-shukudai.html)にあります。
:::

---

これで第3部は終わりです。ウェブのページから表を取り、たくさんのページやファイルをfor文でまとめて集め、扱いにくいExcelを分析しやすい形に組み替えるところまでできるようになりました。

次の第4部では、作業がうまく進まなくなったときの話をします。エラーとの付き合い方と、AIに手伝ってもらうやり方です。
