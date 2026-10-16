---
title: 縦長と横長を行き来する
nav: 09 縦長と横長
kicker: 第1部　データを読む・加工する
lead: データを横長に変えるpivot_widerと、縦長にするpivot_longer。私は理解するのにたいへん時間がかかりましたが、とてもよく使う関数でもあります。
---

## 機械に読みやすい形、人間に読みやすい形

いまの `df_simple` というデータ形式だと、「年」「自治体名」「人口」が横に並んでいますね。1行に一つの数字が入っている形です。これが「縦長」で、コンピューターに読みやすい形式のデータです。

```out outputs/09-long.txt
```

でも、たとえば各自治体の人口がどう変わってきたかを（人間が）みるのには、この形式はあまり分かりやすくありません。自治体名がいちばん左にあって、その右側に各年度の人口が並んでいる、というほうが直感的に理解しやすかったりします。役所が公表しているデータも、多くの場合はそういう形式になっています。こちらを「横長」と呼びます。

変形していきましょう。

## pivot_wider——横長にする

めざすのは、「調査年」を列の名前にして、その列の「中身」に各自治体の人口が入っているというような形式です。コードは `pivot_wider()` 関数を使って、こんなふうに書きます。

```r
df_simple_wide <- df_simple %>%
  pivot_wider(names_from = year,
              values_from = population)
```

```out outputs/09-wide.txt
```

行数が9580から1916に減って、代わりに年の列が三つ増えました。列名は `year` から取ってきて、その中身（つまりvalue）は `population` から取ってくる。こうすることでデータを横長に、つまり幅広に（wider）にしなさい、という意味です。

縦長と横長の違いを図にすると、こうなります。

<figure class="fig">
<svg viewBox="0 0 720 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="同じデータを縦長と横長の二つの形で並べた模式図。縦長では年が列の中身になっていて、横長では年が列の名前になっている">
<defs><marker id="ar09" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="24">縦長</text>
<rect class="f-head" x="10" y="36" width="70" height="28"/>
<text class="f-th" x="18" y="55">region</text>
<rect class="f-head" x="80" y="36" width="64" height="28"/>
<text class="f-th" x="88" y="55">year</text>
<rect class="f-head" x="144" y="36" width="100" height="28"/>
<text class="f-th" x="152" y="55">population</text>
<rect class="f-cell" x="10" y="64" width="70" height="28"/>
<text x="18" y="83">A市</text>
<rect class="f-mark" x="80" y="64" width="64" height="28"/>
<text x="88" y="83">2010</text>
<rect class="f-mark2" x="144" y="64" width="100" height="28"/>
<text x="152" y="83">80</text>
<rect class="f-cell" x="10" y="92" width="70" height="28"/>
<text x="18" y="111">A市</text>
<rect class="f-mark" x="80" y="92" width="64" height="28"/>
<text x="88" y="111">2015</text>
<rect class="f-mark2" x="144" y="92" width="100" height="28"/>
<text x="152" y="111">90</text>
<rect class="f-cell" x="10" y="120" width="70" height="28"/>
<text x="18" y="139">A市</text>
<rect class="f-mark" x="80" y="120" width="64" height="28"/>
<text x="88" y="139">2020</text>
<rect class="f-mark2" x="144" y="120" width="100" height="28"/>
<text x="152" y="139">100</text>
<rect class="f-cell" x="10" y="148" width="70" height="28"/>
<text x="18" y="167">B市</text>
<rect class="f-mark" x="80" y="148" width="64" height="28"/>
<text x="88" y="167">2010</text>
<rect class="f-mark2" x="144" y="148" width="100" height="28"/>
<text x="152" y="167">170</text>
<rect class="f-cell" x="10" y="176" width="70" height="28"/>
<text x="18" y="195">B市</text>
<rect class="f-mark" x="80" y="176" width="64" height="28"/>
<text x="88" y="195">2015</text>
<rect class="f-mark2" x="144" y="176" width="100" height="28"/>
<text x="152" y="195">180</text>
<rect class="f-cell" x="10" y="204" width="70" height="28"/>
<text x="18" y="223">B市</text>
<rect class="f-mark" x="80" y="204" width="64" height="28"/>
<text x="88" y="223">2020</text>
<rect class="f-mark2" x="144" y="204" width="100" height="28"/>
<text x="152" y="223">200</text>
<text class="f-note" x="10" y="256">1行に数字が一つだけ。</text>
<text class="f-note" x="10" y="274">同じ自治体が、年の数だけ行に並ぶ</text>
<path class="f-arrow" d="M262 106 H372" marker-start="url(#ar09)" marker-end="url(#ar09)"/>
<text class="f-note" x="317" y="96" text-anchor="middle">同じデータ</text>
<text class="f-label" x="390" y="24">横長</text>
<rect class="f-head" x="390" y="36" width="70" height="28"/>
<text class="f-th" x="398" y="55">region</text>
<rect class="f-mark" x="460" y="36" width="80" height="28"/>
<text class="f-th" x="468" y="55">2010</text>
<rect class="f-mark" x="540" y="36" width="80" height="28"/>
<text class="f-th" x="548" y="55">2015</text>
<rect class="f-mark" x="620" y="36" width="80" height="28"/>
<text class="f-th" x="628" y="55">2020</text>
<rect class="f-cell" x="390" y="64" width="70" height="28"/>
<text x="398" y="83">A市</text>
<rect class="f-mark2" x="460" y="64" width="80" height="28"/>
<text x="468" y="83">80</text>
<rect class="f-mark2" x="540" y="64" width="80" height="28"/>
<text x="548" y="83">90</text>
<rect class="f-mark2" x="620" y="64" width="80" height="28"/>
<text x="628" y="83">100</text>
<rect class="f-cell" x="390" y="92" width="70" height="28"/>
<text x="398" y="111">B市</text>
<rect class="f-mark2" x="460" y="92" width="80" height="28"/>
<text x="468" y="111">170</text>
<rect class="f-mark2" x="540" y="92" width="80" height="28"/>
<text x="548" y="111">180</text>
<rect class="f-mark2" x="620" y="92" width="80" height="28"/>
<text x="628" y="111">200</text>
<text class="f-note" x="390" y="144">自治体ごとに1行。</text>
<text class="f-note" x="390" y="162">年（赤）が列の名前になり、</text>
<text class="f-note" x="390" y="180">人口（青）がその下に並ぶ</text>
</svg>
<figcaption>縦長と横長。中身は同じデータです。数字は説明のための架空のものです。</figcaption>
</figure>

あまり見ないタイプですが、いちばん左側に「調査年度」の列があって、その横に自治体名の列がずらりと並んでいる、というような表も考えられます。こんなコードで書けます。

```r
df_simple %>%
  pivot_wider(names_from = region,
              values_from = population)
```

なかなかピンと来ないかもしれませんが、データ処理や分析をしていくうえでは、この関数はメチャクチャ多用しますので、ぜひしっかり覚えてください。

## 横長にすると計算ができる

こういう横長の形式にすると、たとえば各自治体について2020年度の人口を2010年度の人口で割り算することで、10年間の人口変化率がどうだったか、といったことを計算することができます。具体的にはこうやるわけです。

```r
df_simple_wide %>%
  mutate(population_increase_rate = (`2020年度` / `2010年度` - 1) * 100) %>%
  select(region, `2010年度`, `2020年度`, population_increase_rate)
```

```out outputs/09-change.txt
```

札幌市は10年で3.1％増えた、と読めます。年度名を表す列名がバッククオート（`` ` ``）で囲われているのは、列名の最初に半角数字が来ると、そのままではRにきちんと認識してもらえなくなるからです（毎度ながらめんどくさい……）。

「縦長」のデータ形式のままでは、こういう計算をすることができません。計算は基本的に、一つの「行」の中で完結しなければいけませんが、縦長状態では、一つの自治体のデータが複数の行にまたがっているからです。横長にすると複数年のデータが1行にまとまるので、今回のように、たとえば年ごとの変遷を追うような計算がやりやすくなります。

:::tips 計算するなら横長に
「前年比」「10年間の変化」「A市とB市の差」のような**引き算・割り算をしたくなったら、まず横長にする**。これを覚えておくと、詰まったときに手が動きます。

逆に、グラフを描くときや、集計するときは縦長のほうが便利です。分析の過程ではたいてい、「計算のために横長にして、グラフのために縦長に戻す」のを繰り返します。
:::

## pivot_longer——縦長に戻す

と、横長データのメリットを説明したばかりではあるのですが、今度は横長から縦長に変換するやり方を説明します。なぜそんなことをする必要があるのかというと、横長のままだと、データの意味するところをコンピューターに理解してもらうのが難しいからです。

なぜ理解できないかというと、たとえば今回、データの中身はすべて「人口」でしたよね。でも、データのどこをみても、そんなことは書いてありません。これは人口のデータだよねというのを人間が理解できるのは、たとえばファイル名とか、あるいはファイルの中身を説明するための文書とかに、そのむねが書いてあるから（あるいは今回のように、それまで自分が加工してきたデータだから）。データの「外部」にある何かをすでに読んでいるから、なわけです。

でも、コンピューターがアクセスできるのはデータだけです。もとの縦長データでは、「調査年」「自治体名」「人口」と、それぞれの列の中身が何なのかを示すものがそれぞれの列の名前になっていましたよね。**すべての数字に「これは●●を示す数字ですよ」というラベルがついている。** これこそが、コンピューターにとって読みやすく、理解しやすい形式なのです。

こういうコードを書くと、縦長に戻すことができます。

```r
df_simple_wide %>%
  pivot_longer(cols = -region,
               names_to = "year",
               values_to = "population")
```

`pivot_longer()` 関数の括弧の中では、`cols` のところでまず、どの列を縦長にするかを選びます。この場合で縦長にしたいのは、`region` という列を除いた、「2020年度」「2015年度」「2010年度」の三つですね。この三つを一つずつ列挙することもできますが、ここでは`region` の前にマイナス記号をつけることで、region「以外」だよ、と指定しています。

さらに `names_to` のところでは、いまは列名になっているもの（つまり「2020年度」「2015年度」「2010年度」の三つです）を、`year`という名前の列の中身に格納してください、と指示しています。`year`を二重引用符で囲っているのは、このデータには`year`という列はもともと存在しないので、コンピューターにとっては「初耳」だから、とでも解釈してください。

つぎに `values_to` のところでは、もとのデータで中身になっていたもの（つまり「2020年度」「2015年度」「2010年度」の三つの列に格納されていた数字）を、`population` という列に入れてください、と指示しています。`population`を二重引用符で囲っているのは、`year`のときと同じ理由です。

めんどくさいですが、こういう書き方もできます。

```r
df_simple_wide %>%
  pivot_longer(cols = c(`2020年度`, `2015年度`, `2010年度`),
               names_to = "year",
               values_to = "population")
```

`cols`のところで、縦長にしたい三つの要素をすべて指名しています。複数の要素を指定するときには`c(region, code)`といった形で囲ってあげる必要があります。

どうでしょうか。さくっと理解するのはなかなか難しいと思います。私は正直、これが腑に落ちるまでかなりの時間を要しました。ていうか、今でもときどき混乱します。

`pivot_wider()` と `pivot_longer()` で、データがどう組み替わるのか。以下のアニメーションを動かしてみることが、理解の助けになるかもしれません。ボタンを押して、何度でも行き来してみてください。

<div class="pivot-anim anim-host"></div>
<script src="assets/pivot-anim.js"></script>

<figure class="fig fig-pivot-static fig-anim-static">
<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="縦長のデータを横長に変える様子を示した図">
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="24">縦長（tidy data）</text>
<rect class="f-head" x="10" y="36" width="70" height="28"/>
<text class="f-th" x="18" y="55">region</text>
<rect class="f-head" x="80" y="36" width="64" height="28"/>
<text class="f-th" x="88" y="55">year</text>
<rect class="f-head" x="144" y="36" width="100" height="28"/>
<text class="f-th" x="152" y="55">population</text>
<rect class="f-cell" x="10" y="64" width="70" height="28"/>
<text x="18" y="83">A市</text>
<rect class="f-mark" x="80" y="64" width="64" height="28"/>
<text x="88" y="83">2010</text>
<rect class="f-mark2" x="144" y="64" width="100" height="28"/>
<text x="152" y="83">80</text>
<rect class="f-cell" x="10" y="92" width="70" height="28"/>
<text x="18" y="111">A市</text>
<rect class="f-mark" x="80" y="92" width="64" height="28"/>
<text x="88" y="111">2015</text>
<rect class="f-mark2" x="144" y="92" width="100" height="28"/>
<text x="152" y="111">90</text>
<rect class="f-cell" x="10" y="120" width="70" height="28"/>
<text x="18" y="139">A市</text>
<rect class="f-mark" x="80" y="120" width="64" height="28"/>
<text x="88" y="139">2020</text>
<rect class="f-mark2" x="144" y="120" width="100" height="28"/>
<text x="152" y="139">100</text>
<rect class="f-cell" x="10" y="148" width="70" height="28"/>
<text x="18" y="167">B市</text>
<rect class="f-mark" x="80" y="148" width="64" height="28"/>
<text x="88" y="167">2010</text>
<rect class="f-mark2" x="144" y="148" width="100" height="28"/>
<text x="152" y="167">170</text>
<rect class="f-cell" x="10" y="176" width="70" height="28"/>
<text x="18" y="195">B市</text>
<rect class="f-mark" x="80" y="176" width="64" height="28"/>
<text x="88" y="195">2015</text>
<rect class="f-mark2" x="144" y="176" width="100" height="28"/>
<text x="152" y="195">180</text>
<rect class="f-cell" x="10" y="204" width="70" height="28"/>
<text x="18" y="223">B市</text>
<rect class="f-mark" x="80" y="204" width="64" height="28"/>
<text x="88" y="223">2020</text>
<rect class="f-mark2" x="144" y="204" width="100" height="28"/>
<text x="152" y="223">200</text>
<path class="f-arrow" d="M258 100 H382" marker-end="url(#ar)"/>
<path class="f-arrow" d="M382 170 H258" marker-end="url(#ar)"/>
<text class="f-code" x="260" y="91">pivot_wider()</text>
<text class="f-note" x="260" y="122">列の名前に持ち上げる</text>
<text class="f-code2" x="260" y="161">pivot_longer()</text>
<text class="f-note" x="260" y="192">データの中身に降ろす</text>
<text class="f-label" x="390" y="24">横長（人間が読みやすい形）</text>
<rect class="f-head" x="390" y="36" width="70" height="28"/>
<text class="f-th" x="398" y="55">region</text>
<rect class="f-mark" x="460" y="36" width="80" height="28"/>
<text class="f-th" x="468" y="55">2010</text>
<rect class="f-mark" x="540" y="36" width="80" height="28"/>
<text class="f-th" x="548" y="55">2015</text>
<rect class="f-mark" x="620" y="36" width="80" height="28"/>
<text class="f-th" x="628" y="55">2020</text>
<rect class="f-cell" x="390" y="64" width="70" height="28"/>
<text x="398" y="83">A市</text>
<rect class="f-mark2" x="460" y="64" width="80" height="28"/>
<text x="468" y="83">80</text>
<rect class="f-mark2" x="540" y="64" width="80" height="28"/>
<text x="548" y="83">90</text>
<rect class="f-mark2" x="620" y="64" width="80" height="28"/>
<text x="628" y="83">100</text>
<rect class="f-cell" x="390" y="92" width="70" height="28"/>
<text x="398" y="111">B市</text>
<rect class="f-mark2" x="460" y="92" width="80" height="28"/>
<text x="468" y="111">170</text>
<rect class="f-mark2" x="540" y="92" width="80" height="28"/>
<text x="548" y="111">180</text>
<rect class="f-mark2" x="620" y="92" width="80" height="28"/>
<text x="628" y="111">200</text>
<text class="f-note" x="390" y="144">赤い部分が列の名前になり、</text>
<text class="f-note" x="390" y="162">青い部分が中身になる</text>
<text class="f-note" x="390" y="196">この形なら 2020／2010 の</text>
<text class="f-note" x="390" y="214">割り算が1行の中でできる</text>
</svg>
<figcaption>同じデータの二つの形。数字は説明のための架空のものです。</figcaption>
</figure>

:::note 覚え方
私はこう考えるようにしています。

- pivot_longer：列の名前を、データの中身に降ろす。だから行が増えて縦に長くなる。
- pivot_wider：データの中身を、列の名前に持ち上げる。だから列が増えて横に広くなる。

そして引数の指定は、この対応で覚えます。

| | 列の名前 | 中身の数字 |
|---|---|---|
| longer（降ろす） | `names_to = "year"` | `values_to = "population"` |
| wider（持ち上げる） | `names_from = year` | `values_from = population` |

`_to` はこれから作る列（だから引用符でくくる。まだ存在しないので）、`_from` はいまある列（だから引用符はいらない）。ここが混乱の元です。
:::

:::homework 宿題
`df_simple` のデータフレームについて、`region` の列を「都道府県名」「市町村名」「区名」に分けたうえで、まず `pivot_wider` をかけ、それをまた `pivot_longer` で元に戻してください。`df_simple` はyear、region、populationの三つの列だけで構成されたデータフレームです。

作例は[付録C](a3-shukudai.html)にあります。
:::

## 整然データ、という考え方

いま説明した「縦長」の形には、tidy data（整然データ）という名前がついています。tidyverseというパッケージ名の「tidy」はここから来ています。決まりごとは三つだけです。

1. 一つの列に、一つの種類の情報が入っている
2. 一つの行が、1件の観測にあたる
3. 一つのマスに、一つの値だけが入っている

役所が出す表は、ほぼこの逆を向いています。列の名前に年や性別が入り、一つのマスに「1,234（うち男 567）」のような複数の情報が詰め込まれ、行の途中に小計が挟まる。

だから私たちの仕事のかなりの部分は、「人間が見るために作られた表」を「機械が読める整然データ」に組み替えることになります（[19章](19-kami-excel.html)では、その最終形態ともいえる「神エクセル」に挑みます）。

次の章では、2000年と2005年のデータも加えます。「数値のはずが文字列だった」という定番のトラップを体験します。
