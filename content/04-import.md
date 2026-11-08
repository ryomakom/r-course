---
title: データを読み込む
nav: 04 データを読み込む
kicker: 第1部　データを読む・加工する
lead: read_csvでファイルを読み、オブジェクトに入れて、中身を見る。ついでにR最大の発明「パイプ演算子」を覚えます。
---

## まずは読み込む命令

さて、いよいよデータ分析に入っていきましょう。とはいえ分析をするには、まず対象となるデータが必要になります。RStudioの中でデータを「つくる」こともできますが、大量のデータを手入力するのは大変なので、どこか他のところから持ってくるほうがふつうです。このため、データをRStudioで読み込んでやるわけです。いろいろなファイル形式のデータがありますが、まずはcsv形式のものから始めてみましょう。

ただしRStudioでデータを読み込むときは、Excelファイルのアイコンをダブルクリックするときのようにはいきません。読み込みのための命令を出してやる必要があります。tidyverseのパッケージではこんな命令を使うと、読み込んだデータを「tibble」という形式に変えてくれます（Rのなかでのデータ形式にもいろいろありますが、ひとまずはtibbleからはじめることにします）。

```r
read_csv()
```

この丸括弧の中に、読み込みたいファイルのありかを書き込んだうえで、命令を出してやります。ファイルは使っているパソコンの中に保存されているものでもいいですし、ウェブ上に置いてあるものでもかまいません。

パソコンの中なら、たとえば

```r
read_csv("data/xxx.csv")
```

となりますし、ウェブ上なら

```r
read_csv("https://xxx.xxx/xxx.csv")
```

となります。このとき、ファイルのありかをダブルクオーテーション（`"`）で囲うのを忘れないようにしましょう。

## 読み込んだものを、どこかに置いておく

また、読み込むだけでなく、それをRStudioの中に保存するには、「代入」するための命令（[付録A](a1-kigou.html)で触れています）を使って以下のようなコードを書く必要があります。

```r
df <- read_csv("data/xxx.csv")
```

`read_csv("data/xxx.csv")` という命令（つまり「data」というフォルダのなかにおいてある「xxx.csv」というファイルを読み込んでくださいね、という命令）によって読みこんだtibble形式のデータが、`df` という「オブジェクト」に左向きの矢印で注入された、みたいな感じでイメージしてください（`df`というのは、この手の教科書的なものによく出てきますが、「データフレーム」の頭文字です）。

オブジェクトというのもプログラミング業界の専門用語で、なんだかとっつきにくいですが、データとか数字とかのかたまりのようなものだと考えてください。

:::tips 名前のつけかた
`df` でもいいのですが、いくつもデータを扱いはじめると「dfって何のデータだっけ」と必ず混乱します。2020年の人口だったら`jinko2020`、2025年だったら`jinko2025` みたいに、中身が想像できる名前をつけたほうがいいでしょう。

ただし名前は半角英数字とアンダースコアで。数字から始める名前（`2020data` など）も使えません。
:::

## 実際に読んでみる

はい、というわけで実践です。

2020年時点での全国の各自治体における人口のデータ（国勢調査）を使います。

[人口データ2020.csv](files/人口データ2020.csv)

プロジェクトのフォルダ内に `data` というフォルダを新しくつくって、その中にファイルを移しましょう。つまりファイルは `data/人口データ2020.csv` というフォルダに引っ越したことになります。この住所を指定して、読み込んでやるわけです。

（この先の章で使うファイルも[付録D](a4-data.html)にまとめて置いてあります。先に全部落としておきたい人はそちらから。もとの入手先はe-Statで、その手順も付録Dに書きました）

ただまぁ、RStudioで読み込む前に、中身がどんななのかExcelを使ってチェックしてみましょうか。

![Excelでファイルを開いてみると、こんな中身だった](images/04-population-csv.png "Excelでファイルを開いてみると、こんな中身だった")

どうも、8行目まではいろんな説明文とか能書きとかが書かれていて、必要なデータ（と、そのラベル）は9行目からのようです。つまり、8行目までは飛ばしてしまったほうがよさそうです。なので、読み込むコードはこんな感じになります。

```r
df2020 <- read_csv("data/人口データ2020.csv", skip = 8)
```

`skip=` というのの後に、飛ばしたい行数分の数字を入力するわけです（skipの行数を指定しなければ、最初の行からすべて読み込みます）。これで最初の8行を無視した形でcsvファイルを読み込み、さらにそれを `df2020` というオブジェクトに入れることができました。

ファイルをパソコン内に保存することなく、ウェブ上にあるものを直接読み込むというやり方でも、同じことができます。ウェブ上にあるファイルのありかを括弧内に入力して、

```r
df2020 <- read_csv("http://www.xxxxxxxxx", skip = 8)
```

とすればいいわけです。

:::warn Rでは読み飛ばさせても、自分では読みましょう
上の4〜6行目に注目してください。

```text
***,調査又は集計していないもの
-,データが得られないもの
X,数値が秘匿されているもの
```

これは凡例です。表のなかに `***` や `-` や `X` が入っていたら、それぞれ意味が違うということが書いてあります。「調べていない」のと「秘匿した」のと「データが取れなかった」のは、まったく別の話です。

`skip = 8` で読み飛ばすのは、あくまでRに読ませないという意味であって、**自分が読まなくていいという意味ではありません**。ここを読まずに集計すると、記事に書く注記を間違えます。[10章](10-datatype.html)でこの話に戻ってきます。
:::

## 中身を見る

さて、`df2020` にはどんなデータが入ったんでしょうか。それを見るためにはシンプルに

```r
df2020
```

と入力すればいけます。こんなふうに表示されます（列が多いので、はじめの6列だけにしてあります）。

```out outputs/04-df2020.txt

```

でもこれだと、はじめの方にある数列分、数行分しかチェックできません。全体をみてみたいと思ったら、こんなふうに入力してください。

```r
df2020 %>% view()
```

![RStudioでview()を実行し、左上の枠に表形式でデータが表示された画面](images/04-view.png "view()を実行すると、左上の枠にこんな表が出てきます")

すると、左上の枠のところにExcelみたいな表が出てきて、そこに `df2020` の中身が表示されたのではないでしょうか。`view()` というのは、こうやって表形式でデータの中身を表示させるための関数です。`df2020 %>% view()` という文章は、`df2020` というオブジェクトに `view()` という関数を適用しなさい、という意味です。

:::tips 中身を確かめるための関数
`view()` のほかにも、状況に応じて使えるものがあります。

```r
df2020                 # 最初の10行だけ、ざっと見る
df2020 %>% view()      # 表形式で全部見る
df2020 %>% glimpse()   # 列の名前とデータ型を縦に並べて見る
df2020 %>% nrow()      # 何行あるか数える
df2020 %>% colnames()  # 列の名前だけ一覧にする
```

列がやたら多いデータでは `glimpse()` がとても便利です。「どんな列があるんだっけ」を確かめるとき、私はまずこれを打ちます。
:::

## パイプ演算子

`df2020` と `view()` の間にある `%>%` という記号は、「パイプ演算子」と呼びます。`df2020` というオブジェクトを `view()` という関数に手渡しする仲立ちのような役割をしています。右向きの矢印みたいなものだと考えると、直感的にわかりやすいかもしれません。

`view()` という関数になぜ丸括弧がついているのか、気になった人もたぶんいると思いますが、それもこのパイプ演算子と間接的に関係しています。実はひとむかし前は、パイプ演算子というものは使われていなかったのです。さっきのと同じ命令を、パイプ演算子を使わないで書くとこんなふうになります。

```r
view(df2020)
```

ここで、「関数」という考え方そのものにも触れておきます。関数とは、ひとことで言えば、材料を受け取って、何か加工をして、できあがったものを返してくれる機械のことです。丸括弧の中に入れるのが材料。`view()` なら、受け取ったデータを表の形に広げて見せてくれますし、さっきの `read_csv()` なら、受け取ったファイル名のファイルを読み込んで、tibbleにして返してくれます。

<figure class="fig fig-switch">
<svg class="svg-wide" viewBox="0 0 720 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="関数は、材料を受け取って加工し、できあがったものを返す機械だということを示した図。材料のdf2020が、view()という機械を通って、画面に出る表になる">
<defs><marker id="ar04a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<rect class="f-cell" x="20" y="20" width="180" height="90" rx="8"/>
<text class="f-note" x="110" y="40" text-anchor="middle">材料</text>
<text class="f-mono" x="110" y="77" text-anchor="middle" style="font-size:15px">df2020</text>
<rect class="f-mark" x="270" y="20" width="180" height="90" rx="8"/>
<text class="f-note" x="360" y="40" text-anchor="middle">関数（機械）</text>
<text class="f-mono" x="360" y="75" text-anchor="middle" style="font-size:15px">view()</text>
<text class="f-note" x="360" y="98" text-anchor="middle">表にして見せる</text>
<rect class="f-cell" x="520" y="20" width="180" height="90" rx="8"/>
<text class="f-note" x="610" y="40" text-anchor="middle">できあがり</text>
<text class="f-th" x="610" y="77" text-anchor="middle" style="font-size:15px">画面に出る表</text>
<path class="f-arrow" d="M204 65 H264" marker-end="url(#ar04a)"/>
<path class="f-arrow" d="M454 65 H514" marker-end="url(#ar04a)"/>
</svg>
<svg class="svg-narrow" style="--narrow-max: 250px" viewBox="0 0 280 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="関数は、材料を受け取って加工し、できあがったものを返す機械だということを示した図。材料のdf2020が、view()という機械を通って、画面に出る表になる">
<defs><marker id="ar04an" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<rect class="f-cell" x="20" y="10" width="240" height="84" rx="8"/>
<text class="f-note" x="140" y="30" text-anchor="middle">材料</text>
<text class="f-mono" x="140" y="64" text-anchor="middle" style="font-size:15px">df2020</text>
<rect class="f-mark" x="20" y="130" width="240" height="84" rx="8"/>
<text class="f-note" x="140" y="150" text-anchor="middle">関数（機械）</text>
<text class="f-mono" x="140" y="182" text-anchor="middle" style="font-size:15px">view()</text>
<text class="f-note" x="140" y="202" text-anchor="middle">表にして見せる</text>
<rect class="f-cell" x="20" y="250" width="240" height="84" rx="8"/>
<text class="f-note" x="140" y="270" text-anchor="middle">できあがり</text>
<text class="f-th" x="140" y="304" text-anchor="middle" style="font-size:15px">画面に出る表</text>
<path class="f-arrow" d="M140 98 V126" marker-end="url(#ar04an)"/>
<path class="f-arrow" d="M140 218 V246" marker-end="url(#ar04an)"/>
</svg>
</figure>

数学で f(x) みたいな数式？を書いたのを覚えている方もいらっしゃるでしょう。xという変数にfという関数を適用したよ、という意味ですね。これと同じで、`df2020` に `view` という関数をかけたものが `view(df2020)` と表現されるわけです。

ただ、関数が一つだけならまだいいんですが、いくつもいくつも関数を適用していくと、こんな感じになってしまいます。

```r
D(C(B(A(x))))
```

これはxという変数に関数Aを適用し、さらにそれに関数Bを適用し、さらに関数Cを、最後に関数Dを、というふうに、何重もの入れ子構造になっているわけです。非常に読みにくい、と思いませんか。一方で、パイプ演算子を使えば、同じ命令をこんなふうに書き表すことができます。

```r
x %>% A() %>% B() %>% C() %>% D()
```

これだと、左から右に字を読んでいくのと、関数をかけていく処理の流れが一致しているので、読みやすく、理解しやすい。だからパイプ演算子が人気になったわけです。

パン屋さんにたとえてみましょう。小麦を仕入れて、挽いて小麦粉にし、それをこねて生地にし、焼いてパンにする。「挽く」も「こねる」も「焼く」も、材料を受け取って別のものに変えて返す機械、つまり関数です。前の機械から出てきたものを、次の機械に手渡していく。その手渡しの役をしているのが、パイプ演算子です。

<figure class="fig fig-switch">
<svg class="svg-wide" viewBox="0 0 760 222" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="パン屋さんにたとえた図。小麦を挽く()という関数にかけると小麦粉になり、こねる()で生地に、焼く()でパンになる。パイプ演算子では 小麦 %>% 挽く() %>% こねる() %>% 焼く() と書く">
<defs><marker id="ar04b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<rect class="f-cell" x="14" y="16" width="82" height="128" rx="8"/>
<text class="f-note" x="55" y="36" text-anchor="middle">材料</text>
<g transform="translate(35 46)"><path d="M20 44 V9" style="stroke:#a87a26;stroke-width:1.6;fill:none"/><path d="M20 40 Q29 36 33 27" style="stroke:#a87a26;stroke-width:1.4;fill:none"/><ellipse cx="16.3" cy="13" rx="2.8" ry="5" transform="rotate(-32 16.3 13)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="13" rx="2.8" ry="5" transform="rotate(32 23.7 13)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 9 L8 -1 M26 9 L32 -1" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="16.3" cy="19" rx="2.8" ry="5" transform="rotate(-32 16.3 19)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="19" rx="2.8" ry="5" transform="rotate(32 23.7 19)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 15 L8 5 M26 15 L32 5" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="16.3" cy="25" rx="2.8" ry="5" transform="rotate(-32 16.3 25)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="25" rx="2.8" ry="5" transform="rotate(32 23.7 25)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 21 L8 11 M26 21 L32 11" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="16.3" cy="31" rx="2.8" ry="5" transform="rotate(-32 16.3 31)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="31" rx="2.8" ry="5" transform="rotate(32 23.7 31)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 27 L8 17 M26 27 L32 17" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="20" cy="8" rx="2.6" ry="4.6" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M20 4 V-2" style="stroke:#b88a34;stroke-width:.7"/></g>
<text class="f-th" x="55" y="124" text-anchor="middle" style="font-size:15px">小麦</text>
<rect class="f-mark" x="119" y="16" width="92" height="128" rx="8"/>
<text class="f-note" x="165" y="36" text-anchor="middle">関数</text>
<g transform="translate(145 46)"><path d="M13.5 44 L16.5 19 H23.5 L26.5 44 Z" style="fill:#d6c4a4;stroke:#6f5a40;stroke-width:1"/><path d="M14.5 19 L20 12.5 L25.5 19 Z" style="fill:#9c6b4a;stroke:#6f5a40;stroke-width:1"/><rect x="18" y="36" width="4" height="8" rx="2" style="fill:#6f5a40"/><g transform="rotate(20 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><g transform="rotate(110 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><g transform="rotate(200 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><g transform="rotate(290 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><circle cx="20" cy="15" r="2.2" style="fill:#6f5a40"/></g>
<text class="f-mono" x="165" y="124" text-anchor="middle" style="font-size:15px">挽く()</text>
<rect class="f-cell" x="234" y="16" width="82" height="128" rx="8"/>
<text class="f-note" x="275" y="36" text-anchor="middle">途中のもの</text>
<g transform="translate(255 46)"><path d="M8 11 L11 4 H29 L32 11" style="fill:#e9e1cf;stroke:#9a9488;stroke-width:1"/><path d="M8 11 H32 L34 42 Q34 44 32 44 H8 Q6 44 6 42 Z" style="fill:#f7f2e8;stroke:#9a9488;stroke-width:1.2"/><path d="M20 38 V22" style="stroke:#b88a34;stroke-width:1"/><ellipse cx="20" cy="20" rx="1.8" ry="3.2" transform="rotate(0 20 20)" style="fill:#d9a441"/><ellipse cx="17.6" cy="25" rx="1.8" ry="3.2" transform="rotate(-30 17.6 25)" style="fill:#d9a441"/><ellipse cx="22.4" cy="25" rx="1.8" ry="3.2" transform="rotate(30 22.4 25)" style="fill:#d9a441"/><ellipse cx="17.6" cy="30.5" rx="1.8" ry="3.2" transform="rotate(-30 17.6 30.5)" style="fill:#d9a441"/><ellipse cx="22.4" cy="30.5" rx="1.8" ry="3.2" transform="rotate(30 22.4 30.5)" style="fill:#d9a441"/><circle cx="31" cy="3" r="1.3" style="fill:#e8e2d6"/><circle cx="34" cy="6" r="1" style="fill:#e8e2d6"/></g>
<text class="f-th" x="275" y="124" text-anchor="middle" style="font-size:15px">小麦粉</text>
<rect class="f-mark" x="339" y="16" width="92" height="128" rx="8"/>
<text class="f-note" x="385" y="36" text-anchor="middle">関数</text>
<g transform="translate(365 46)"><ellipse cx="20" cy="34" rx="18" ry="8" style="fill:#f1e3c4;stroke:#b8a47e;stroke-width:1.2"/><g transform="rotate(-14 20 22)"><rect x="5" y="18" width="30" height="8" rx="4" style="fill:#d2a679;stroke:#8c5a2b;stroke-width:1"/><rect x="0" y="20" width="6" height="4" rx="2" style="fill:#8c5a2b"/><rect x="34" y="20" width="6" height="4" rx="2" style="fill:#8c5a2b"/></g></g>
<text class="f-mono" x="385" y="124" text-anchor="middle" style="font-size:15px">こねる()</text>
<rect class="f-cell" x="454" y="16" width="82" height="128" rx="8"/>
<text class="f-note" x="495" y="36" text-anchor="middle">途中のもの</text>
<g transform="translate(475 46)"><path d="M4 34 Q2 20 14 15 Q20 9 28 14 Q38 18 36 32 Q35 40 20 40 Q6 40 4 34 Z" style="fill:#f1e3c4;stroke:#b8a47e;stroke-width:1.2"/><path d="M12 22 Q16 19 20 21" style="stroke:#d9c6a0;stroke-width:1.6;fill:none"/></g>
<text class="f-th" x="495" y="124" text-anchor="middle" style="font-size:15px">生地</text>
<rect class="f-mark" x="559" y="16" width="92" height="128" rx="8"/>
<text class="f-note" x="605" y="36" text-anchor="middle">関数</text>
<g transform="translate(585 46)"><path d="M20 4 C30 15 33 24 29 33 Q20 45 11 33 C7 24 11 16 20 4 Z" style="fill:#e0703a"/><path d="M20 18 C25 24 26 29 24 34 Q20 40 16 34 C14 29 16 24 20 18 Z" style="fill:#f6bd56"/></g>
<text class="f-mono" x="605" y="124" text-anchor="middle" style="font-size:15px">焼く()</text>
<rect class="f-cell" x="674" y="16" width="82" height="128" rx="8"/>
<text class="f-note" x="715" y="36" text-anchor="middle">できあがり</text>
<g transform="translate(695 46)"><path d="M2 38 V26 Q2 10 20 10 Q38 10 38 26 V38 Q38 42 34 42 H6 Q2 42 2 38 Z" style="fill:#c98a4b;stroke:#8c5a2b;stroke-width:1.2"/><path d="M11 17 L15 24 M19 15 L23 22 M27 17 L31 24" style="stroke:#f2c98f;stroke-width:2.2;stroke-linecap:round"/></g>
<text class="f-th" x="715" y="124" text-anchor="middle" style="font-size:15px">パン</text>
<path class="f-arrow" d="M99 80 H115" marker-end="url(#ar04b)"/>
<path class="f-arrow" d="M214 80 H230" marker-end="url(#ar04b)"/>
<path class="f-arrow" d="M319 80 H335" marker-end="url(#ar04b)"/>
<path class="f-arrow" d="M434 80 H450" marker-end="url(#ar04b)"/>
<path class="f-arrow" d="M539 80 H555" marker-end="url(#ar04b)"/>
<path class="f-arrow" d="M654 80 H670" marker-end="url(#ar04b)"/>
<text class="f-code" x="380" y="180" text-anchor="middle" style="font-size:14px">小麦 %&gt;% 挽く() %&gt;% こねる() %&gt;% 焼く()</text>
<text class="f-note" x="380" y="204" text-anchor="middle">入れ子で書くと 焼く(こねる(挽く(小麦)))。中身は同じ</text>
</svg>
<svg class="svg-narrow" style="--narrow-max: 250px" viewBox="0 0 280 690" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="パン屋さんにたとえた図。小麦を挽く()という関数にかけると小麦粉になり、こねる()で生地に、焼く()でパンになる。パイプ演算子では 小麦 %>% 挽く() %>% こねる() %>% 焼く() と書く">
<defs><marker id="ar04bn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<rect class="f-cell" x="30" y="10" width="220" height="62" rx="8"/>
<g transform="translate(44 19)"><path d="M20 44 V9" style="stroke:#a87a26;stroke-width:1.6;fill:none"/><path d="M20 40 Q29 36 33 27" style="stroke:#a87a26;stroke-width:1.4;fill:none"/><ellipse cx="16.3" cy="13" rx="2.8" ry="5" transform="rotate(-32 16.3 13)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="13" rx="2.8" ry="5" transform="rotate(32 23.7 13)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 9 L8 -1 M26 9 L32 -1" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="16.3" cy="19" rx="2.8" ry="5" transform="rotate(-32 16.3 19)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="19" rx="2.8" ry="5" transform="rotate(32 23.7 19)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 15 L8 5 M26 15 L32 5" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="16.3" cy="25" rx="2.8" ry="5" transform="rotate(-32 16.3 25)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="25" rx="2.8" ry="5" transform="rotate(32 23.7 25)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 21 L8 11 M26 21 L32 11" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="16.3" cy="31" rx="2.8" ry="5" transform="rotate(-32 16.3 31)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><ellipse cx="23.7" cy="31" rx="2.8" ry="5" transform="rotate(32 23.7 31)" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M14 27 L8 17 M26 27 L32 17" style="stroke:#b88a34;stroke-width:.7"/><ellipse cx="20" cy="8" rx="2.6" ry="4.6" style="fill:#d9a441;stroke:#a87a26;stroke-width:.7"/><path d="M20 4 V-2" style="stroke:#b88a34;stroke-width:.7"/></g>
<text class="f-note" x="160" y="33" text-anchor="middle">材料</text>
<text class="f-th" x="160" y="57" text-anchor="middle" style="font-size:15px">小麦</text>
<path class="f-arrow" d="M140 74 V97" marker-end="url(#ar04bn)"/>
<rect class="f-mark" x="30" y="100" width="220" height="62" rx="8"/>
<g transform="translate(44 109)"><path d="M13.5 44 L16.5 19 H23.5 L26.5 44 Z" style="fill:#d6c4a4;stroke:#6f5a40;stroke-width:1"/><path d="M14.5 19 L20 12.5 L25.5 19 Z" style="fill:#9c6b4a;stroke:#6f5a40;stroke-width:1"/><rect x="18" y="36" width="4" height="8" rx="2" style="fill:#6f5a40"/><g transform="rotate(20 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><g transform="rotate(110 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><g transform="rotate(200 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><g transform="rotate(290 20 15)"><rect x="18" y="0" width="5" height="14" style="fill:#f6f1e6;stroke:#6f5a40;stroke-width:.8"/><path d="M18 4.5 H23 M18 9 H23" style="stroke:#6f5a40;stroke-width:.5"/></g><circle cx="20" cy="15" r="2.2" style="fill:#6f5a40"/></g>
<text class="f-note" x="160" y="123" text-anchor="middle">関数</text>
<text class="f-mono" x="160" y="147" text-anchor="middle" style="font-size:15px">挽く()</text>
<path class="f-arrow" d="M140 164 V187" marker-end="url(#ar04bn)"/>
<rect class="f-cell" x="30" y="190" width="220" height="62" rx="8"/>
<g transform="translate(44 199)"><path d="M8 11 L11 4 H29 L32 11" style="fill:#e9e1cf;stroke:#9a9488;stroke-width:1"/><path d="M8 11 H32 L34 42 Q34 44 32 44 H8 Q6 44 6 42 Z" style="fill:#f7f2e8;stroke:#9a9488;stroke-width:1.2"/><path d="M20 38 V22" style="stroke:#b88a34;stroke-width:1"/><ellipse cx="20" cy="20" rx="1.8" ry="3.2" transform="rotate(0 20 20)" style="fill:#d9a441"/><ellipse cx="17.6" cy="25" rx="1.8" ry="3.2" transform="rotate(-30 17.6 25)" style="fill:#d9a441"/><ellipse cx="22.4" cy="25" rx="1.8" ry="3.2" transform="rotate(30 22.4 25)" style="fill:#d9a441"/><ellipse cx="17.6" cy="30.5" rx="1.8" ry="3.2" transform="rotate(-30 17.6 30.5)" style="fill:#d9a441"/><ellipse cx="22.4" cy="30.5" rx="1.8" ry="3.2" transform="rotate(30 22.4 30.5)" style="fill:#d9a441"/><circle cx="31" cy="3" r="1.3" style="fill:#e8e2d6"/><circle cx="34" cy="6" r="1" style="fill:#e8e2d6"/></g>
<text class="f-note" x="160" y="213" text-anchor="middle">途中のもの</text>
<text class="f-th" x="160" y="237" text-anchor="middle" style="font-size:15px">小麦粉</text>
<path class="f-arrow" d="M140 254 V277" marker-end="url(#ar04bn)"/>
<rect class="f-mark" x="30" y="280" width="220" height="62" rx="8"/>
<g transform="translate(44 289)"><ellipse cx="20" cy="34" rx="18" ry="8" style="fill:#f1e3c4;stroke:#b8a47e;stroke-width:1.2"/><g transform="rotate(-14 20 22)"><rect x="5" y="18" width="30" height="8" rx="4" style="fill:#d2a679;stroke:#8c5a2b;stroke-width:1"/><rect x="0" y="20" width="6" height="4" rx="2" style="fill:#8c5a2b"/><rect x="34" y="20" width="6" height="4" rx="2" style="fill:#8c5a2b"/></g></g>
<text class="f-note" x="160" y="303" text-anchor="middle">関数</text>
<text class="f-mono" x="160" y="327" text-anchor="middle" style="font-size:15px">こねる()</text>
<path class="f-arrow" d="M140 344 V367" marker-end="url(#ar04bn)"/>
<rect class="f-cell" x="30" y="370" width="220" height="62" rx="8"/>
<g transform="translate(44 379)"><path d="M4 34 Q2 20 14 15 Q20 9 28 14 Q38 18 36 32 Q35 40 20 40 Q6 40 4 34 Z" style="fill:#f1e3c4;stroke:#b8a47e;stroke-width:1.2"/><path d="M12 22 Q16 19 20 21" style="stroke:#d9c6a0;stroke-width:1.6;fill:none"/></g>
<text class="f-note" x="160" y="393" text-anchor="middle">途中のもの</text>
<text class="f-th" x="160" y="417" text-anchor="middle" style="font-size:15px">生地</text>
<path class="f-arrow" d="M140 434 V457" marker-end="url(#ar04bn)"/>
<rect class="f-mark" x="30" y="460" width="220" height="62" rx="8"/>
<g transform="translate(44 469)"><path d="M20 4 C30 15 33 24 29 33 Q20 45 11 33 C7 24 11 16 20 4 Z" style="fill:#e0703a"/><path d="M20 18 C25 24 26 29 24 34 Q20 40 16 34 C14 29 16 24 20 18 Z" style="fill:#f6bd56"/></g>
<text class="f-note" x="160" y="483" text-anchor="middle">関数</text>
<text class="f-mono" x="160" y="507" text-anchor="middle" style="font-size:15px">焼く()</text>
<path class="f-arrow" d="M140 524 V547" marker-end="url(#ar04bn)"/>
<rect class="f-cell" x="30" y="550" width="220" height="62" rx="8"/>
<g transform="translate(44 559)"><path d="M2 38 V26 Q2 10 20 10 Q38 10 38 26 V38 Q38 42 34 42 H6 Q2 42 2 38 Z" style="fill:#c98a4b;stroke:#8c5a2b;stroke-width:1.2"/><path d="M11 17 L15 24 M19 15 L23 22 M27 17 L31 24" style="stroke:#f2c98f;stroke-width:2.2;stroke-linecap:round"/></g>
<text class="f-note" x="160" y="573" text-anchor="middle">できあがり</text>
<text class="f-th" x="160" y="597" text-anchor="middle" style="font-size:15px">パン</text>
<text class="f-code" x="140" y="656" text-anchor="middle" style="font-size:12px">小麦 %&gt;% 挽く() %&gt;% こねる() %&gt;% 焼く()</text>
<text class="f-note" x="140" y="678" text-anchor="middle">入れ子で書くと 焼く(こねる(挽く(小麦)))</text>
</svg>
</figure>

また、関数はもともと、適用する対象の変数などを丸括弧の中身に入れ込んでいくという書き方だったので、パイプ演算子を使えば丸括弧の中身が空っぽになる場合でも、丸括弧じたいは残すのが基本的なお作法とされているわけです。ま、`view()` とかのシンプルな関数なら、実際には丸括弧がなくてもちゃんと動いちゃうんですけどね。

それから、より新しいバージョンのRでは、`|>` という記号でパイプ演算子を表すこともあります。何がちがうかというと、こっちのほうが何となくシュッとしてます。あとは同じです。

……というのは厳密には間違いで、詳しくいうと動作に少し違いがあるらしいんですが、私はよく分かりません。この講座では `%>%` で通します。

あと、前節でも触れましたが、いちいち3文字打ち込むのがめんどくさいよ、というときには、コントロールキー(Ctrl)とシフトキー(Shift)、「M」のキーの三つを同時に打つと、パイプ演算子が出てきます。これを使うとだいぶ楽になります。

:::note 改行の位置
長いコードは、パイプ演算子のところで改行して書くのがお作法です。

```r
df2020 %>%
  select(地域) %>%
  view()
```

改行するときは、`%>%` **を行の末尾に置いて、次の行を書く**。逆に `%>%` を行の頭に置くと、Rは前の行で命令が終わったと判断してしまい、うまく動きません。

この形で書いておくと、上から1行ずつ足したり削ったりして「ここまでの段階でデータはどうなっているか」を確かめられます。これは実際の作業でものすごく多用する技です。
:::

次の章から、この形でデータを加工していきます。