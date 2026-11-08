---
title: 神の頭を切り落とす
nav: 19 神の頭を切り落とす
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
[18章](18-download.html)の手順でダウンロードしたファイルを使いますが、うまく落ちてこなかった人は、北海道のぶんをここから取ってください。

[000979538.xlsx](files/000979538.xlsx)　2024年にあった第50回衆院選の小選挙区の市区町村別得票（北海道）

`download` フォルダに入れると、この章のコードがそのまま動きます。総務省が公表しているファイルの写しです。
:::

北海道の市区町村別得票データをExcelで開くと、「北海道第１区」のシートはこんな感じでした。

![Excelで開いた「北海道第１区」のシート。上に日付と表題と選挙区名があり、その下に候補者名・政党名の2段のラベル、左に市区町村名が並び、いちばん下が合計の行、いちばん右が得票数計の列になっている](images/19-excel.png "000979538.xlsx の「北海道第１区」のシートを、Excelで開いたところ")

最初の2行（日付と表題）はデータではなく注釈。3行目の「北海道第１区」は選挙区の名前で、これはデータの一部です。数字のうち、たとえばいちばん左上にある「10,260」は、「日本維新の会」所属の「小林さとる氏」が、北海道第１区の「札幌市中央区」で獲得した得票数を示しています。これは人間の目には一目瞭然なのですが、人間の常識を持ち合わせないコンピューターには読み取ることができません。

そこで、以下のような形に加工していくことが必要なわけです。縦長の、いわゆる整然（tidy）データです。

| 選挙区 | 市区町村 | 候補者 | 政党 | 得票 |
|---|---|---|---|---|
| 北海道第１区 | 札幌市中央区 | 小林　さとる | 日本維新の会 | 10260 |
| 北海道第１区 | 札幌市中央区 | 道下　大樹 | 立憲民主党 | 49131 |
| 北海道第１区 | 札幌市北区第１区 | 小林　さとる | 日本維新の会 | 334 |

tidyxlパッケージの`xlsx_cells()`という関数で表をセルごとにバラしたうえで、unpivotrパッケージの`behead()`関数でうまいことラベルを取り出してやると、この加工が簡単にできます。こんなイメージです。

<figure class="fig fig-switch">
<svg class="svg-wide" viewBox="0 0 746 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="シートのどのセルが、整然データのどの列になるかを色で示した図">
<defs><marker id="ar19" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="18">Excelのシート（北海道第１区）</text>
<rect class="f-head" x="32" y="28" width="104" height="26"/>
<text class="f-note" x="84" y="46.2" text-anchor="middle">A</text>
<rect class="f-head" x="136" y="28" width="72" height="26"/>
<text class="f-note" x="172" y="46.2" text-anchor="middle">B</text>
<rect class="f-head" x="208" y="28" width="72" height="26"/>
<text class="f-note" x="244" y="46.2" text-anchor="middle">C</text>
<rect class="f-head" x="280" y="28" width="12" height="26"/>
<text class="f-note" x="286" y="46.2" text-anchor="middle">…</text>
<rect class="f-head" x="292" y="28" width="54" height="26"/>
<text class="f-note" x="319" y="46.2" text-anchor="middle">G</text>
<rect class="f-head" x="10" y="54" width="22" height="26"/>
<text class="f-note" x="21" y="72.2" text-anchor="middle">3</text>
<rect class="f-mark4" x="32" y="54" width="104" height="26"/>
<text x="36" y="72.2" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="136" y="54" width="72" height="26"/>
<rect class="f-cell" x="208" y="54" width="72" height="26"/>
<rect class="f-off" x="292" y="54" width="54" height="26"/>
<text x="295" y="72.2" style="font-size:10px">[単位：票]</text>
<rect class="f-head" x="10" y="80" width="22" height="26"/>
<text class="f-note" x="21" y="98.2" text-anchor="middle">4</text>
<rect class="f-off" x="32" y="80" width="104" height="26"/>
<text x="36" y="98.2" style="font-size:11px">候補者名</text>
<rect class="f-mark" x="136" y="80" width="72" height="26"/>
<text x="140" y="98.2" style="font-size:11px">小林　さとる</text>
<rect class="f-mark" x="208" y="80" width="72" height="26"/>
<text x="212" y="98.2" style="font-size:11px">道下　大樹</text>
<rect class="f-off" x="292" y="80" width="54" height="26"/>
<text x="296" y="98.2" style="font-size:11px">得票数計</text>
<text class="f-note" x="286" y="98.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="106" width="22" height="26"/>
<text class="f-note" x="21" y="124.2" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="106" width="104" height="26"/>
<text x="36" y="124.2" style="font-size:10px">市区町村名＼政党名</text>
<rect class="f-mark2" x="136" y="106" width="72" height="26"/>
<text x="140" y="124.2" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="208" y="106" width="72" height="26"/>
<text x="212" y="124.2" style="font-size:11px">立憲民主党</text>
<rect class="f-off" x="292" y="106" width="54" height="26"/>
<text class="f-note" x="286" y="124.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="132" width="22" height="26"/>
<text class="f-note" x="21" y="150.2" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="132" width="104" height="26"/>
<text x="36" y="150.2" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="136" y="132" width="72" height="26"/>
<text x="140" y="150.2" style="font-size:11px">10260</text>
<rect class="f-cell" x="208" y="132" width="72" height="26"/>
<text x="212" y="150.2" style="font-size:11px">49131</text>
<rect class="f-off" x="292" y="132" width="54" height="26"/>
<text x="296" y="150.2" style="font-size:11px">114596</text>
<text class="f-note" x="286" y="150.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="158" width="22" height="26"/>
<text class="f-note" x="21" y="176.2" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="158" width="104" height="26"/>
<text x="36" y="176.2" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="136" y="158" width="72" height="26"/>
<text x="140" y="176.2" style="font-size:11px">334</text>
<rect class="f-cell" x="208" y="158" width="72" height="26"/>
<text x="212" y="176.2" style="font-size:11px">1399</text>
<rect class="f-off" x="292" y="158" width="54" height="26"/>
<text x="296" y="176.2" style="font-size:11px">3418</text>
<text class="f-note" x="286" y="176.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="184" width="22" height="26"/>
<text class="f-note" x="21" y="202.2" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="184" width="104" height="26"/>
<text x="36" y="202.2" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="136" y="184" width="72" height="26"/>
<text x="140" y="202.2" style="font-size:11px">4480</text>
<rect class="f-cell" x="208" y="184" width="72" height="26"/>
<text x="212" y="202.2" style="font-size:11px">27833</text>
<rect class="f-off" x="292" y="184" width="54" height="26"/>
<text x="296" y="202.2" style="font-size:11px">65810</text>
<text class="f-note" x="286" y="202.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="210" width="22" height="26"/>
<text class="f-note" x="21" y="228.2" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="210" width="104" height="26"/>
<text x="36" y="228.2" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="136" y="210" width="72" height="26"/>
<text x="140" y="228.2" style="font-size:11px">4926</text>
<rect class="f-cell" x="208" y="210" width="72" height="26"/>
<text x="212" y="228.2" style="font-size:11px">30031</text>
<rect class="f-off" x="292" y="210" width="54" height="26"/>
<text x="296" y="228.2" style="font-size:11px">66251</text>
<text class="f-note" x="286" y="228.2" text-anchor="middle">…</text>
<rect class="f-head" x="10" y="236" width="22" height="26"/>
<text class="f-note" x="21" y="254.2" text-anchor="middle">10</text>
<rect class="f-off" x="32" y="236" width="104" height="26"/>
<text x="36" y="254.2" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-off" x="136" y="236" width="72" height="26"/>
<text x="140" y="254.2" style="font-size:11px">20000</text>
<rect class="f-off" x="208" y="236" width="72" height="26"/>
<text x="212" y="254.2" style="font-size:11px">108394</text>
<rect class="f-off" x="292" y="236" width="54" height="26"/>
<text x="296" y="254.2" style="font-size:11px">250075</text>
<text class="f-note" x="286" y="254.2" text-anchor="middle">…</text>
<path class="f-arrow" d="M352 206 H378" marker-end="url(#ar19)"/>
<text class="f-code" x="350" y="196">behead()</text>
<text class="f-label" x="384" y="18">整然データ</text>
<rect class="f-mark4" x="384" y="28" width="74" height="24"/>
<text class="f-th" x="388" y="44" style="font-size:11px">district</text>
<rect class="f-cell" x="384" y="52" width="74" height="24"/>
<text x="388" y="68" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="384" y="76" width="74" height="24"/>
<text x="388" y="92" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="384" y="100" width="74" height="24"/>
<text x="388" y="116" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="384" y="124" width="74" height="24"/>
<text x="388" y="140" style="font-size:11px">北海道第１区</text>
<rect class="f-mark3" x="458" y="28" width="96" height="24"/>
<text class="f-th" x="462" y="44" style="font-size:11px">municipality</text>
<rect class="f-cell" x="458" y="52" width="96" height="24"/>
<text x="462" y="68" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="458" y="76" width="96" height="24"/>
<text x="462" y="92" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="458" y="100" width="96" height="24"/>
<text x="462" y="116" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="458" y="124" width="96" height="24"/>
<text x="462" y="140" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-mark" x="554" y="28" width="72" height="24"/>
<text class="f-th" x="558" y="44" style="font-size:11px">name</text>
<rect class="f-cell" x="554" y="52" width="72" height="24"/>
<text x="558" y="68" style="font-size:11px">小林　さとる</text>
<rect class="f-cell" x="554" y="76" width="72" height="24"/>
<text x="558" y="92" style="font-size:11px">道下　大樹</text>
<rect class="f-cell" x="554" y="100" width="72" height="24"/>
<text x="558" y="116" style="font-size:11px">小林　さとる</text>
<rect class="f-cell" x="554" y="124" width="72" height="24"/>
<text x="558" y="140" style="font-size:11px">道下　大樹</text>
<rect class="f-mark2" x="626" y="28" width="74" height="24"/>
<text class="f-th" x="630" y="44" style="font-size:11px">party</text>
<rect class="f-cell" x="626" y="52" width="74" height="24"/>
<text x="630" y="68" style="font-size:11px">日本維新の会</text>
<rect class="f-cell" x="626" y="76" width="74" height="24"/>
<text x="630" y="92" style="font-size:11px">立憲民主党</text>
<rect class="f-cell" x="626" y="100" width="74" height="24"/>
<text x="630" y="116" style="font-size:11px">日本維新の会</text>
<rect class="f-cell" x="626" y="124" width="74" height="24"/>
<text x="630" y="140" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="700" y="28" width="44" height="24"/>
<text class="f-th" x="704" y="44" style="font-size:11px">vote</text>
<rect class="f-cell" x="700" y="52" width="44" height="24"/>
<text x="704" y="68" style="font-size:11px">10260</text>
<rect class="f-cell" x="700" y="76" width="44" height="24"/>
<text x="704" y="92" style="font-size:11px">49131</text>
<rect class="f-cell" x="700" y="100" width="44" height="24"/>
<text x="704" y="116" style="font-size:11px">334</text>
<rect class="f-cell" x="700" y="124" width="44" height="24"/>
<text x="704" y="140" style="font-size:11px">1399</text>
<text class="f-note" x="384" y="172">……</text>
<text class="f-note" x="10" y="290">緑（選挙区名）→ district、赤（候補者名）→ name、青（政党名）→ party、黄（A列）→ municipality、白い数字 → vote</text>
</svg>
<svg class="svg-narrow" viewBox="0 0 370 552" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="シートのどのセルが、整然データのどの列になるかを色で示した図">
<defs><marker id="ar19n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="4" y="18">Excelのシート（北海道第１区）</text>
<rect class="f-head" x="26" y="28" width="104" height="26"/>
<text class="f-note" x="78" y="46.2" text-anchor="middle">A</text>
<rect class="f-head" x="130" y="28" width="72" height="26"/>
<text class="f-note" x="166" y="46.2" text-anchor="middle">B</text>
<rect class="f-head" x="202" y="28" width="72" height="26"/>
<text class="f-note" x="238" y="46.2" text-anchor="middle">C</text>
<rect class="f-head" x="274" y="28" width="12" height="26"/>
<text class="f-note" x="280" y="46.2" text-anchor="middle">…</text>
<rect class="f-head" x="286" y="28" width="54" height="26"/>
<text class="f-note" x="313" y="46.2" text-anchor="middle">G</text>
<rect class="f-head" x="4" y="54" width="22" height="26"/>
<text class="f-note" x="15" y="72.2" text-anchor="middle">3</text>
<rect class="f-mark4" x="26" y="54" width="104" height="26"/>
<text x="30" y="72.2" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="130" y="54" width="72" height="26"/>
<rect class="f-cell" x="202" y="54" width="72" height="26"/>
<rect class="f-off" x="286" y="54" width="54" height="26"/>
<text x="289" y="72.2" style="font-size:10px">[単位：票]</text>
<rect class="f-head" x="4" y="80" width="22" height="26"/>
<text class="f-note" x="15" y="98.2" text-anchor="middle">4</text>
<rect class="f-off" x="26" y="80" width="104" height="26"/>
<text x="30" y="98.2" style="font-size:11px">候補者名</text>
<rect class="f-mark" x="130" y="80" width="72" height="26"/>
<text x="134" y="98.2" style="font-size:11px">小林　さとる</text>
<rect class="f-mark" x="202" y="80" width="72" height="26"/>
<text x="206" y="98.2" style="font-size:11px">道下　大樹</text>
<rect class="f-off" x="286" y="80" width="54" height="26"/>
<text x="290" y="98.2" style="font-size:11px">得票数計</text>
<text class="f-note" x="280" y="98.2" text-anchor="middle">…</text>
<rect class="f-head" x="4" y="106" width="22" height="26"/>
<text class="f-note" x="15" y="124.2" text-anchor="middle">5</text>
<rect class="f-off" x="26" y="106" width="104" height="26"/>
<text x="30" y="124.2" style="font-size:10px">市区町村名＼政党名</text>
<rect class="f-mark2" x="130" y="106" width="72" height="26"/>
<text x="134" y="124.2" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="202" y="106" width="72" height="26"/>
<text x="206" y="124.2" style="font-size:11px">立憲民主党</text>
<rect class="f-off" x="286" y="106" width="54" height="26"/>
<text class="f-note" x="280" y="124.2" text-anchor="middle">…</text>
<rect class="f-head" x="4" y="132" width="22" height="26"/>
<text class="f-note" x="15" y="150.2" text-anchor="middle">6</text>
<rect class="f-mark3" x="26" y="132" width="104" height="26"/>
<text x="30" y="150.2" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="130" y="132" width="72" height="26"/>
<text x="134" y="150.2" style="font-size:11px">10260</text>
<rect class="f-cell" x="202" y="132" width="72" height="26"/>
<text x="206" y="150.2" style="font-size:11px">49131</text>
<rect class="f-off" x="286" y="132" width="54" height="26"/>
<text x="290" y="150.2" style="font-size:11px">114596</text>
<text class="f-note" x="280" y="150.2" text-anchor="middle">…</text>
<rect class="f-head" x="4" y="158" width="22" height="26"/>
<text class="f-note" x="15" y="176.2" text-anchor="middle">7</text>
<rect class="f-mark3" x="26" y="158" width="104" height="26"/>
<text x="30" y="176.2" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="130" y="158" width="72" height="26"/>
<text x="134" y="176.2" style="font-size:11px">334</text>
<rect class="f-cell" x="202" y="158" width="72" height="26"/>
<text x="206" y="176.2" style="font-size:11px">1399</text>
<rect class="f-off" x="286" y="158" width="54" height="26"/>
<text x="290" y="176.2" style="font-size:11px">3418</text>
<text class="f-note" x="280" y="176.2" text-anchor="middle">…</text>
<rect class="f-head" x="4" y="184" width="22" height="26"/>
<text class="f-note" x="15" y="202.2" text-anchor="middle">8</text>
<rect class="f-mark3" x="26" y="184" width="104" height="26"/>
<text x="30" y="202.2" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="130" y="184" width="72" height="26"/>
<text x="134" y="202.2" style="font-size:11px">4480</text>
<rect class="f-cell" x="202" y="184" width="72" height="26"/>
<text x="206" y="202.2" style="font-size:11px">27833</text>
<rect class="f-off" x="286" y="184" width="54" height="26"/>
<text x="290" y="202.2" style="font-size:11px">65810</text>
<text class="f-note" x="280" y="202.2" text-anchor="middle">…</text>
<rect class="f-head" x="4" y="210" width="22" height="26"/>
<text class="f-note" x="15" y="228.2" text-anchor="middle">9</text>
<rect class="f-mark3" x="26" y="210" width="104" height="26"/>
<text x="30" y="228.2" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="130" y="210" width="72" height="26"/>
<text x="134" y="228.2" style="font-size:11px">4926</text>
<rect class="f-cell" x="202" y="210" width="72" height="26"/>
<text x="206" y="228.2" style="font-size:11px">30031</text>
<rect class="f-off" x="286" y="210" width="54" height="26"/>
<text x="290" y="228.2" style="font-size:11px">66251</text>
<text class="f-note" x="280" y="228.2" text-anchor="middle">…</text>
<rect class="f-head" x="4" y="236" width="22" height="26"/>
<text class="f-note" x="15" y="254.2" text-anchor="middle">10</text>
<rect class="f-off" x="26" y="236" width="104" height="26"/>
<text x="30" y="254.2" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-off" x="130" y="236" width="72" height="26"/>
<text x="134" y="254.2" style="font-size:11px">20000</text>
<rect class="f-off" x="202" y="236" width="72" height="26"/>
<text x="206" y="254.2" style="font-size:11px">108394</text>
<rect class="f-off" x="286" y="236" width="54" height="26"/>
<text x="290" y="254.2" style="font-size:11px">250075</text>
<text class="f-note" x="280" y="254.2" text-anchor="middle">…</text>
<path class="f-arrow" d="M150 270 V308" marker-end="url(#ar19n)"/>
<text class="f-code" x="160" y="294">behead()</text>
<text class="f-label" x="4" y="330">整然データ</text>
<rect class="f-mark4" x="4" y="340" width="74" height="24"/>
<text class="f-th" x="8" y="356" style="font-size:11px">district</text>
<rect class="f-cell" x="4" y="364" width="74" height="24"/>
<text x="8" y="380" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="4" y="388" width="74" height="24"/>
<text x="8" y="404" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="4" y="412" width="74" height="24"/>
<text x="8" y="428" style="font-size:11px">北海道第１区</text>
<rect class="f-cell" x="4" y="436" width="74" height="24"/>
<text x="8" y="452" style="font-size:11px">北海道第１区</text>
<rect class="f-mark3" x="78" y="340" width="96" height="24"/>
<text class="f-th" x="82" y="356" style="font-size:11px">municipality</text>
<rect class="f-cell" x="78" y="364" width="96" height="24"/>
<text x="82" y="380" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="78" y="388" width="96" height="24"/>
<text x="82" y="404" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="78" y="412" width="96" height="24"/>
<text x="82" y="428" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="78" y="436" width="96" height="24"/>
<text x="82" y="452" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-mark" x="174" y="340" width="72" height="24"/>
<text class="f-th" x="178" y="356" style="font-size:11px">name</text>
<rect class="f-cell" x="174" y="364" width="72" height="24"/>
<text x="178" y="380" style="font-size:11px">小林　さとる</text>
<rect class="f-cell" x="174" y="388" width="72" height="24"/>
<text x="178" y="404" style="font-size:11px">道下　大樹</text>
<rect class="f-cell" x="174" y="412" width="72" height="24"/>
<text x="178" y="428" style="font-size:11px">小林　さとる</text>
<rect class="f-cell" x="174" y="436" width="72" height="24"/>
<text x="178" y="452" style="font-size:11px">道下　大樹</text>
<rect class="f-mark2" x="246" y="340" width="74" height="24"/>
<text class="f-th" x="250" y="356" style="font-size:11px">party</text>
<rect class="f-cell" x="246" y="364" width="74" height="24"/>
<text x="250" y="380" style="font-size:11px">日本維新の会</text>
<rect class="f-cell" x="246" y="388" width="74" height="24"/>
<text x="250" y="404" style="font-size:11px">立憲民主党</text>
<rect class="f-cell" x="246" y="412" width="74" height="24"/>
<text x="250" y="428" style="font-size:11px">日本維新の会</text>
<rect class="f-cell" x="246" y="436" width="74" height="24"/>
<text x="250" y="452" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="320" y="340" width="44" height="24"/>
<text class="f-th" x="324" y="356" style="font-size:11px">vote</text>
<rect class="f-cell" x="320" y="364" width="44" height="24"/>
<text x="324" y="380" style="font-size:11px">10260</text>
<rect class="f-cell" x="320" y="388" width="44" height="24"/>
<text x="324" y="404" style="font-size:11px">49131</text>
<rect class="f-cell" x="320" y="412" width="44" height="24"/>
<text x="324" y="428" style="font-size:11px">334</text>
<rect class="f-cell" x="320" y="436" width="44" height="24"/>
<text x="324" y="452" style="font-size:11px">1399</text>
<text class="f-note" x="4" y="484">……</text>
<text class="f-note" x="4" y="506">緑（選挙区名）→ district、赤（候補者名）→ name、</text>
<text class="f-note" x="4" y="524">青（政党名）→ party、黄（A列）→ municipality、</text>
<text class="f-note" x="4" y="542">白い数字 → vote</text>
</svg>
</figure>

コードはこんな感じ。`behead()`が最重要なわけですが、これは市区町村名や候補者名など、データのラベルに当たるものを切り離して、しかるべきところへ格納するための関数です。「首をはねる」という意味の英語から来ています（たぶん）。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区", row >= 4 | address == "A3", !is_blank) %>%
  behead("up-left", "district") %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left", "municipality") %>%
  select(district, municipality, name, party, numeric)
```

それぞれのコードが何をしているのか、順番に見ていきましょう。

`xlsx_cells()` はExcelの各セルを行にばらす関数です。たとえば3行×4列の表なら、12行のtibbleに変換します。それぞれの行には、もとのExcelでのセルの位置（行番号・列番号）や、セルに入力されている値、データの種類などが記録されます。

次に`filter()` で「北海道第１区」のシートだけに絞っています。そのうえで、上の2行（日付と表題）を捨てています。

`row >= 4 | address == "A3"` は、「4行目から下か、またはA3のセル」という意味です。`|` は[6章](06-strings-filter.html)で出てきた「または」。`address` は `xlsx_cells()` が作る列で、A3やB6といったセルの番地が入っています。本当は3行目を丸ごと残す `row >= 3` にしたいところですが、3行目の右端には「[単位：票]」という注釈もある。なので3行目からは、選挙区名の入ったA3だけを残しているわけです。


`is_blank` は`xlsx_cells()`関数で生成され、セルが空っぽのときに `TRUE` になる列です。頭に `!` をつけると「〜でない」という意味になる（[6章](06-strings-filter.html)）ので、ここでは空っぽでないセルだけを抽出しています。見た目は空白でも罫線などの書式がついていれば、`xlsx_cells()` はそれを一つのセルとして読み込みます。このファイルでは表のすぐ下に、そういう空っぽのセルが何行ぶんも並んでいるので、先に落としておかないと、中身のない行がまじってしまいます。

そのあとに `behead()` が4回出てきます。丸括弧の中には二つの要素が記述されています。データのラベルに当たるセルが、そのデータの入ったセルから見てどこにあるかを`up`とか`left`とかで示すのが、一つめの要素。そのラベルを何という名前の列に入れるかを決めるのが、二つめです。

一つめの要素では以下のような指定ができます。

| 指定 | 各セルから見た探し方 |
|---|---|
| `"up"` | 上に進み、表の上端にあるセルを探す |
| `"left"` | 左に進み、表の左端にあるセルを探す |
| `"up-left"` | 上端まで進み、そこが空白なら左に進んで値のあるセルを探す |
| `"left-up"` | 左端まで進み、そこが空白なら上に進んで値のあるセルを探す |

上のコードでは、まず `"up-left"` で選挙区名を切り離しています。数字のセルから上に進むと、いちばん上の3行目に着きます。でも `filter()` で残した3行目にあるのはA3だけで、数字のセルの真上は空白。そこで左に進んで、A3の「北海道第１区」にたどり着きます。こうして、どの数字のセルにも同じ選挙区名が配られるわけです。

次に `"up"` で候補者名と政党名を上から一つずつ切り離し、最後に `"left"` で左の市区町村名を切り離しています。1枚ずつ皮をむくように、外側から順番にはがしていくイメージです。**はがす順番が大事です。**

1枚ずつはがされていく様子を、動きで見てみましょう。

<div class="behead-anim anim-host"></div>
<script src="assets/behead-anim.js"></script>

<figure class="fig fig-behead-static fig-anim-static">
<svg viewBox="0 0 720 1018" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="札幌市中央区の49131というセル一つに、beheadのたびにラベルがついていく様子を示した図">
<text class="f-label" x="10" y="18">札幌市中央区・道下さんの「49131」のセルを追いかける</text>
<rect class="f-head" x="32" y="36" width="108" height="18"/>
<text class="f-note" x="86" y="48.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="36" width="76" height="18"/>
<text class="f-note" x="178" y="48.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="36" width="76" height="18"/>
<text class="f-note" x="254" y="48.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="54" width="22" height="18"/>
<text class="f-note" x="21" y="66.6" text-anchor="middle">3</text>
<rect class="f-mark4" x="32" y="54" width="108" height="18"/>
<text x="36" y="66.6" style="font-size:11px">北海道第１区</text>
<rect class="f-gone" x="140" y="54" width="76" height="18"/>
<rect class="f-gone" x="216" y="54" width="76" height="18"/>
<rect class="f-head" x="10" y="72" width="22" height="18"/>
<text class="f-note" x="21" y="84.6" text-anchor="middle">4</text>
<rect class="f-off" x="32" y="72" width="108" height="18"/>
<text x="36" y="84.6" style="font-size:11px">候補者名</text>
<rect class="f-mark" x="140" y="72" width="76" height="18"/>
<text x="144" y="84.6" style="font-size:11px">小林　さとる</text>
<rect class="f-mark" x="216" y="72" width="76" height="18"/>
<text x="220" y="84.6" style="font-size:11px">道下　大樹</text>
<rect class="f-head" x="10" y="90" width="22" height="18"/>
<text class="f-note" x="21" y="102.6" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="90" width="108" height="18"/>
<text x="36" y="102.6" style="font-size:11px">市区町村名＼政党名</text>
<rect class="f-mark2" x="140" y="90" width="76" height="18"/>
<text x="144" y="102.6" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="216" y="90" width="76" height="18"/>
<text x="220" y="102.6" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="10" y="108" width="22" height="18"/>
<text class="f-note" x="21" y="120.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="108" width="108" height="18"/>
<text x="36" y="120.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="108" width="76" height="18"/>
<text x="144" y="120.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="108" width="76" height="18"/>
<text x="220" y="120.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="126" width="22" height="18"/>
<text class="f-note" x="21" y="138.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="126" width="108" height="18"/>
<text x="36" y="138.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="126" width="76" height="18"/>
<text x="144" y="138.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="126" width="76" height="18"/>
<text x="220" y="138.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="144" width="22" height="18"/>
<text class="f-note" x="21" y="156.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="144" width="108" height="18"/>
<text x="36" y="156.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="144" width="76" height="18"/>
<text x="144" y="156.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="144" width="76" height="18"/>
<text x="220" y="156.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="162" width="22" height="18"/>
<text class="f-note" x="21" y="174.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="162" width="108" height="18"/>
<text x="36" y="174.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="162" width="76" height="18"/>
<text x="144" y="174.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="162" width="76" height="18"/>
<text x="220" y="174.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="180" width="22" height="18"/>
<text class="f-note" x="21" y="192.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="180" width="108" height="18"/>
<text x="36" y="192.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="180" width="76" height="18"/>
<text x="144" y="192.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="180" width="76" height="18"/>
<text x="220" y="192.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="108" width="76" height="18"/>
<text class="f-label" x="330" y="50">① 最初</text>
<text class="f-code" x="330" y="70">filter(row &gt;= 4 | address == "A3", !is_blank)</text>
<text class="f-note" x="330" y="90">セルがバラバラのまま。ラベルはまだない。</text>
<rect class="f-cell" x="330" y="102" width="370" height="44"/>
<text class="f-note" x="338" y="118">「49131」についているラベル</text>
<text class="f-note" x="338" y="136">（なし）</text>
<line class="f-sep" x1="10" y1="224" x2="710" y2="224"/>
<rect class="f-head" x="32" y="238" width="108" height="18"/>
<text class="f-note" x="86" y="250.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="238" width="76" height="18"/>
<text class="f-note" x="178" y="250.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="238" width="76" height="18"/>
<text class="f-note" x="254" y="250.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="256" width="22" height="18"/>
<text class="f-note" x="21" y="268.6" text-anchor="middle">3</text>
<rect class="f-gone" x="32" y="256" width="108" height="18"/>
<rect class="f-gone" x="140" y="256" width="76" height="18"/>
<rect class="f-gone" x="216" y="256" width="76" height="18"/>
<rect class="f-head" x="10" y="274" width="22" height="18"/>
<text class="f-note" x="21" y="286.6" text-anchor="middle">4</text>
<rect class="f-off" x="32" y="274" width="108" height="18"/>
<text x="36" y="286.6" style="font-size:11px">候補者名</text>
<rect class="f-mark" x="140" y="274" width="76" height="18"/>
<text x="144" y="286.6" style="font-size:11px">小林　さとる</text>
<rect class="f-mark" x="216" y="274" width="76" height="18"/>
<text x="220" y="286.6" style="font-size:11px">道下　大樹</text>
<rect class="f-head" x="10" y="292" width="22" height="18"/>
<text class="f-note" x="21" y="304.6" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="292" width="108" height="18"/>
<text x="36" y="304.6" style="font-size:11px">市区町村名＼政党名</text>
<rect class="f-mark2" x="140" y="292" width="76" height="18"/>
<text x="144" y="304.6" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="216" y="292" width="76" height="18"/>
<text x="220" y="304.6" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="10" y="310" width="22" height="18"/>
<text class="f-note" x="21" y="322.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="310" width="108" height="18"/>
<text x="36" y="322.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="310" width="76" height="18"/>
<text x="144" y="322.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="310" width="76" height="18"/>
<text x="220" y="322.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="328" width="22" height="18"/>
<text class="f-note" x="21" y="340.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="328" width="108" height="18"/>
<text x="36" y="340.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="328" width="76" height="18"/>
<text x="144" y="340.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="328" width="76" height="18"/>
<text x="220" y="340.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="346" width="22" height="18"/>
<text class="f-note" x="21" y="358.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="346" width="108" height="18"/>
<text x="36" y="358.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="346" width="76" height="18"/>
<text x="144" y="358.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="346" width="76" height="18"/>
<text x="220" y="358.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="364" width="22" height="18"/>
<text class="f-note" x="21" y="376.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="364" width="108" height="18"/>
<text x="36" y="376.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="364" width="76" height="18"/>
<text x="144" y="376.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="364" width="76" height="18"/>
<text x="220" y="376.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="382" width="22" height="18"/>
<text class="f-note" x="21" y="394.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="382" width="108" height="18"/>
<text x="36" y="394.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="382" width="76" height="18"/>
<text x="144" y="394.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="382" width="76" height="18"/>
<text x="220" y="394.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="310" width="76" height="18"/>
<text class="f-label" x="330" y="252">② 選挙区名を剥がす</text>
<text class="f-code" x="330" y="272">behead("up-left", "district")</text>
<text class="f-note" x="330" y="292">3行目まで上がり、空白なら左へ。A3の選挙区名を配る。</text>
<rect class="f-cell" x="330" y="304" width="370" height="44"/>
<text class="f-note" x="338" y="320">「49131」についているラベル</text>
<text class="f-code" x="338" y="338">district = 北海道第１区</text>
<line class="f-sep" x1="10" y1="426" x2="710" y2="426"/>
<rect class="f-head" x="32" y="440" width="108" height="18"/>
<text class="f-note" x="86" y="452.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="440" width="76" height="18"/>
<text class="f-note" x="178" y="452.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="440" width="76" height="18"/>
<text class="f-note" x="254" y="452.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="458" width="22" height="18"/>
<text class="f-note" x="21" y="470.6" text-anchor="middle">3</text>
<rect class="f-gone" x="32" y="458" width="108" height="18"/>
<rect class="f-gone" x="140" y="458" width="76" height="18"/>
<rect class="f-gone" x="216" y="458" width="76" height="18"/>
<rect class="f-head" x="10" y="476" width="22" height="18"/>
<text class="f-note" x="21" y="488.6" text-anchor="middle">4</text>
<rect class="f-gone" x="32" y="476" width="108" height="18"/>
<rect class="f-gone" x="140" y="476" width="76" height="18"/>
<rect class="f-gone" x="216" y="476" width="76" height="18"/>
<rect class="f-head" x="10" y="494" width="22" height="18"/>
<text class="f-note" x="21" y="506.6" text-anchor="middle">5</text>
<rect class="f-off" x="32" y="494" width="108" height="18"/>
<text x="36" y="506.6" style="font-size:11px">市区町村名＼政党名</text>
<rect class="f-mark2" x="140" y="494" width="76" height="18"/>
<text x="144" y="506.6" style="font-size:11px">日本維新の会</text>
<rect class="f-mark2" x="216" y="494" width="76" height="18"/>
<text x="220" y="506.6" style="font-size:11px">立憲民主党</text>
<rect class="f-head" x="10" y="512" width="22" height="18"/>
<text class="f-note" x="21" y="524.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="512" width="108" height="18"/>
<text x="36" y="524.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="512" width="76" height="18"/>
<text x="144" y="524.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="512" width="76" height="18"/>
<text x="220" y="524.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="530" width="22" height="18"/>
<text class="f-note" x="21" y="542.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="530" width="108" height="18"/>
<text x="36" y="542.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="530" width="76" height="18"/>
<text x="144" y="542.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="530" width="76" height="18"/>
<text x="220" y="542.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="548" width="22" height="18"/>
<text class="f-note" x="21" y="560.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="548" width="108" height="18"/>
<text x="36" y="560.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="548" width="76" height="18"/>
<text x="144" y="560.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="548" width="76" height="18"/>
<text x="220" y="560.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="566" width="22" height="18"/>
<text class="f-note" x="21" y="578.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="566" width="108" height="18"/>
<text x="36" y="578.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="566" width="76" height="18"/>
<text x="144" y="578.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="566" width="76" height="18"/>
<text x="220" y="578.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="584" width="22" height="18"/>
<text class="f-note" x="21" y="596.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="584" width="108" height="18"/>
<text x="36" y="596.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="584" width="76" height="18"/>
<text x="144" y="596.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="584" width="76" height="18"/>
<text x="220" y="596.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="512" width="76" height="18"/>
<text class="f-label" x="330" y="454">③ 候補者名を剥がす</text>
<text class="f-code" x="330" y="474">behead("up", "name")</text>
<text class="f-note" x="330" y="494">いちばん上になった4行目を剥がして、真上のラベルを配る。</text>
<rect class="f-cell" x="330" y="506" width="370" height="62"/>
<text class="f-note" x="338" y="522">「49131」についているラベル</text>
<text x="338" y="540">district = 北海道第１区</text>
<text class="f-code" x="338" y="558">name = 道下　大樹</text>
<line class="f-sep" x1="10" y1="628" x2="710" y2="628"/>
<rect class="f-head" x="32" y="642" width="108" height="18"/>
<text class="f-note" x="86" y="654.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="642" width="76" height="18"/>
<text class="f-note" x="178" y="654.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="642" width="76" height="18"/>
<text class="f-note" x="254" y="654.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="660" width="22" height="18"/>
<text class="f-note" x="21" y="672.6" text-anchor="middle">3</text>
<rect class="f-gone" x="32" y="660" width="108" height="18"/>
<rect class="f-gone" x="140" y="660" width="76" height="18"/>
<rect class="f-gone" x="216" y="660" width="76" height="18"/>
<rect class="f-head" x="10" y="678" width="22" height="18"/>
<text class="f-note" x="21" y="690.6" text-anchor="middle">4</text>
<rect class="f-gone" x="32" y="678" width="108" height="18"/>
<rect class="f-gone" x="140" y="678" width="76" height="18"/>
<rect class="f-gone" x="216" y="678" width="76" height="18"/>
<rect class="f-head" x="10" y="696" width="22" height="18"/>
<text class="f-note" x="21" y="708.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="696" width="108" height="18"/>
<rect class="f-gone" x="140" y="696" width="76" height="18"/>
<rect class="f-gone" x="216" y="696" width="76" height="18"/>
<rect class="f-head" x="10" y="714" width="22" height="18"/>
<text class="f-note" x="21" y="726.6" text-anchor="middle">6</text>
<rect class="f-mark3" x="32" y="714" width="108" height="18"/>
<text x="36" y="726.6" style="font-size:11px">札幌市中央区</text>
<rect class="f-cell" x="140" y="714" width="76" height="18"/>
<text x="144" y="726.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="714" width="76" height="18"/>
<text x="220" y="726.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="732" width="22" height="18"/>
<text class="f-note" x="21" y="744.6" text-anchor="middle">7</text>
<rect class="f-mark3" x="32" y="732" width="108" height="18"/>
<text x="36" y="744.6" style="font-size:11px">札幌市北区第１区</text>
<rect class="f-cell" x="140" y="732" width="76" height="18"/>
<text x="144" y="744.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="732" width="76" height="18"/>
<text x="220" y="744.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="750" width="22" height="18"/>
<text class="f-note" x="21" y="762.6" text-anchor="middle">8</text>
<rect class="f-mark3" x="32" y="750" width="108" height="18"/>
<text x="36" y="762.6" style="font-size:11px">札幌市南区</text>
<rect class="f-cell" x="140" y="750" width="76" height="18"/>
<text x="144" y="762.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="750" width="76" height="18"/>
<text x="220" y="762.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="768" width="22" height="18"/>
<text class="f-note" x="21" y="780.6" text-anchor="middle">9</text>
<rect class="f-mark3" x="32" y="768" width="108" height="18"/>
<text x="36" y="780.6" style="font-size:11px">札幌市西区第１区</text>
<rect class="f-cell" x="140" y="768" width="76" height="18"/>
<text x="144" y="780.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="768" width="76" height="18"/>
<text x="220" y="780.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="786" width="22" height="18"/>
<text class="f-note" x="21" y="798.6" text-anchor="middle">10</text>
<rect class="f-mark3" x="32" y="786" width="108" height="18"/>
<text x="36" y="798.6" style="font-size:11px">北海道第１区 合計</text>
<rect class="f-cell" x="140" y="786" width="76" height="18"/>
<text x="144" y="798.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="786" width="76" height="18"/>
<text x="220" y="798.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="714" width="76" height="18"/>
<text class="f-label" x="330" y="656">④ 政党名を剥がす</text>
<text class="f-code" x="330" y="676">behead("up", "party")</text>
<text class="f-note" x="330" y="696">次にいちばん上になった5行目を剥がして、真上のラベルを配る。</text>
<rect class="f-cell" x="330" y="708" width="370" height="80"/>
<text class="f-note" x="338" y="724">「49131」についているラベル</text>
<text x="338" y="742">district = 北海道第１区</text>
<text x="338" y="760">name = 道下　大樹</text>
<text class="f-code" x="338" y="778">party = 立憲民主党</text>
<line class="f-sep" x1="10" y1="830" x2="710" y2="830"/>
<rect class="f-head" x="32" y="844" width="108" height="18"/>
<text class="f-note" x="86" y="856.6" text-anchor="middle">A</text>
<rect class="f-head" x="140" y="844" width="76" height="18"/>
<text class="f-note" x="178" y="856.6" text-anchor="middle">B</text>
<rect class="f-head" x="216" y="844" width="76" height="18"/>
<text class="f-note" x="254" y="856.6" text-anchor="middle">C</text>
<rect class="f-head" x="10" y="862" width="22" height="18"/>
<text class="f-note" x="21" y="874.6" text-anchor="middle">3</text>
<rect class="f-gone" x="32" y="862" width="108" height="18"/>
<rect class="f-gone" x="140" y="862" width="76" height="18"/>
<rect class="f-gone" x="216" y="862" width="76" height="18"/>
<rect class="f-head" x="10" y="880" width="22" height="18"/>
<text class="f-note" x="21" y="892.6" text-anchor="middle">4</text>
<rect class="f-gone" x="32" y="880" width="108" height="18"/>
<rect class="f-gone" x="140" y="880" width="76" height="18"/>
<rect class="f-gone" x="216" y="880" width="76" height="18"/>
<rect class="f-head" x="10" y="898" width="22" height="18"/>
<text class="f-note" x="21" y="910.6" text-anchor="middle">5</text>
<rect class="f-gone" x="32" y="898" width="108" height="18"/>
<rect class="f-gone" x="140" y="898" width="76" height="18"/>
<rect class="f-gone" x="216" y="898" width="76" height="18"/>
<rect class="f-head" x="10" y="916" width="22" height="18"/>
<text class="f-note" x="21" y="928.6" text-anchor="middle">6</text>
<rect class="f-gone" x="32" y="916" width="108" height="18"/>
<rect class="f-cell" x="140" y="916" width="76" height="18"/>
<text x="144" y="928.6" style="font-size:11px">10260</text>
<rect class="f-cell" x="216" y="916" width="76" height="18"/>
<text x="220" y="928.6" style="font-size:11px">49131</text>
<rect class="f-head" x="10" y="934" width="22" height="18"/>
<text class="f-note" x="21" y="946.6" text-anchor="middle">7</text>
<rect class="f-gone" x="32" y="934" width="108" height="18"/>
<rect class="f-cell" x="140" y="934" width="76" height="18"/>
<text x="144" y="946.6" style="font-size:11px">334</text>
<rect class="f-cell" x="216" y="934" width="76" height="18"/>
<text x="220" y="946.6" style="font-size:11px">1399</text>
<rect class="f-head" x="10" y="952" width="22" height="18"/>
<text class="f-note" x="21" y="964.6" text-anchor="middle">8</text>
<rect class="f-gone" x="32" y="952" width="108" height="18"/>
<rect class="f-cell" x="140" y="952" width="76" height="18"/>
<text x="144" y="964.6" style="font-size:11px">4480</text>
<rect class="f-cell" x="216" y="952" width="76" height="18"/>
<text x="220" y="964.6" style="font-size:11px">27833</text>
<rect class="f-head" x="10" y="970" width="22" height="18"/>
<text class="f-note" x="21" y="982.6" text-anchor="middle">9</text>
<rect class="f-gone" x="32" y="970" width="108" height="18"/>
<rect class="f-cell" x="140" y="970" width="76" height="18"/>
<text x="144" y="982.6" style="font-size:11px">4926</text>
<rect class="f-cell" x="216" y="970" width="76" height="18"/>
<text x="220" y="982.6" style="font-size:11px">30031</text>
<rect class="f-head" x="10" y="988" width="22" height="18"/>
<text class="f-note" x="21" y="1000.6" text-anchor="middle">10</text>
<rect class="f-gone" x="32" y="988" width="108" height="18"/>
<rect class="f-cell" x="140" y="988" width="76" height="18"/>
<text x="144" y="1000.6" style="font-size:11px">20000</text>
<rect class="f-cell" x="216" y="988" width="76" height="18"/>
<text x="220" y="1000.6" style="font-size:11px">108394</text>
<rect class="f-hl" x="216" y="916" width="76" height="18"/>
<text class="f-label" x="330" y="858">⑤ 市区町村名を剥がす</text>
<text class="f-code" x="330" y="878">behead("left", "municipality")</text>
<text class="f-note" x="330" y="898">いちばん左のA列を剥がして、真横（左）のラベルを配る。</text>
<rect class="f-cell" x="330" y="910" width="370" height="98"/>
<text class="f-note" x="338" y="926">「49131」についているラベル</text>
<text x="338" y="944">district = 北海道第１区</text>
<text x="338" y="962">name = 道下　大樹</text>
<text x="338" y="980">party = 立憲民主党</text>
<text class="f-code" x="338" y="998">municipality = 札幌市中央区</text>
</svg>
<figcaption>上や左のラベルを1段剥がすたびに、数字のセルにラベルが一つずつつく。最後には、どのセルも「どの選挙区の、どこの、誰の、何党の票か」が分かる1行になる。シートはD〜G列を省いています。</figcaption>
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
    filter(sheet == i, row >= 4 | address == "A3", !is_blank) %>%
    behead("up-left", "district") %>%
    behead("up", "name") %>%
    behead("up", "party") %>%
    behead("left", "municipality") %>%
    select(district, municipality, name, party, vote = numeric)

  vote_data <- bind_rows(vote_data, vote_data_temporaly)
}
```

さっきとの違いは、`filter(sheet == i)` のところです。「北海道第１区」と決め打ちしていたところを、ループの変数 `i` にしました。ループの1周目では「北海道第１区」、2周目では「北海道第２区」のシートが処理されます。ついでに、最後の `select()` では `vote = numeric` として、得票数の列の名前を `vote` に変えています。

選挙区名は、どのシートでもA3に入っています。なので、さっきと同じ `behead("up-left", "district")` で、それぞれのシートの選挙区名が取れます。

:::note シート名が情報になっていることも
選挙区名は、シート名にも入っています。今回はシートの中のA3から取りましたが、役所のExcelでは、「シート名」や「ファイル名」にしか重要な情報がないこともよくあります。

`read_excel()` で1枚ずつ読んでいると、シート名はどこにも残りません。そういうときは、`mutate(district = i)` のようにして、ループの変数を**明示的にデータの中へ入れてやる必要があります。**

ちなみに、A3の選挙区名には都道府県名まで入っています。なので、全国のファイルをまとめても、北海道の第1区と東京都の第1区を取り違えることはありません。「第1区」としか書いていなかったら、表題などから都道府県名を取り出して、一緒に持ち込む必要がありました。ファイル名は `000979538.xlsx` のような番号なので、そこからは分かりません。
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
      filter(sheet == j, row >= 4 | address == "A3", !is_blank) %>%
      behead("up-left", "district") %>%
      behead("up", "name") %>%
      behead("up", "party") %>%
      behead("left", "municipality") %>%
      mutate(file = basename(i)) %>%
      select(district, municipality, name, party, vote = numeric, file)

    vote_data <- bind_rows(vote_data, vote_data_temp)
  }
}
```

外側のループがファイルを一つずつ、内側のループがそのファイルのシートを一つずつ処理します。シートは全部で289枚あるので、内側の処理は289回まわることになります。

外側のループの最初で、`xlsx_cells(i)` の結果を `cells` に入れています。ファイルを読み込むのは時間がかかるので、シートごとに読み直すのではなく、1回だけ読んでおいて、それを使い回しているわけです。

`file = basename(i)` で、どのファイルから来たデータなのかを記録しています。これがないと、あとで「この行はどこから来たんだ」が追えなくなります。

:::warn 全部同じ形だとは限らない
これだけ大量に処理すると、たいてい例外が出てきます。今回のファイルは、289枚のシートがどれも同じ形をしていました。3行目のA列が選挙区名で、右端に「[単位：票]」。4行目が候補者名、5行目が政党名、6行目から市区町村が並び、いちばん下が合計の行、いちばん右が得票数計の列。全部のシートで確かめてあります。

でも、これはたまたまです。同じ総務省の同じ種類のファイルでも、第51回（2026年）のものは形が違います。市区町村をA列とB列の2段に分けて書いたシートと、A列だけのシートがまじっていて、途中に小計の行も挟まっています。得票数も、カンマのついた文字として入っています。この章のコードは、そのままでは使えません。ちなみに、比例代表のファイルは形がまったく違います。18章で小選挙区のぶんだけを落としてきたのは、そのためでもあります。

一つのシートでうまくいったコードでも、全部に回したあとで、もう一度確かめる必要があるわけです。

例外にぶつかったときの対処のしかたはいくつかあります。[17章](17-loop.html)でやったように `tryCatch()` で囲んで、失敗したものを後から個別に処理する。あるいは形が同じファイルだけを先に処理して、残りは別のコードを書く。数が少なければ、例外のほうは手で入力してしまうのがいちばん早いこともあります。

どれを選んでもいいのですが、**どのファイルを処理して、どのファイルを除いたのかは記録しておいてください。**黙って除くと、あとで「全国のデータ」と言えなくなります。なぜ除いたのかも、メモに残しておきましょう。
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

次の第4部では、この講座の先に広がっているものを紹介します。APIや地図、統計学といった、Rでできるもっといろんなこと。そして、AIの時代にそれでも自分でコードを書くことの意味です。
