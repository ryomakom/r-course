---
title: 縦長と横長を行き来する
nav: 09 縦長と横長
kicker: 第1部　データを読む・加工する
lead: pivot_widerとpivot_longer。理解するのに私はいちばん時間がかかりましたが、とてもよく使う関数でもあります。
---

## 人間に読みやすい形、機械に読みやすい形

いまの `df_simple` というデータ形式だと、「年」「自治体名」「人口」が横に並んでいますね。1行に1つの数字が入っている形です。これを**縦長**と呼びます。

```out outputs/09-long.txt
```

でも、たとえば各自治体の人口がどう変わってきたかを（人間が）みるのには、この形式はあまり分かりやすくありません。自治体名がいちばん左にあって、その右側に各年度の人口が並んでいる、というほうが分かりやすかったりします。役所が公表しているデータも、多くの場合はそういう形式になっています。こちらを**横長**と呼びます。

変形していきましょう。

## pivot_wider——横長にする

つまり、「調査年」を列の名前にして、その列の「中身」に各自治体の人口が入っているというようなイメージです。コードは `pivot_wider()` 関数を使って、こんなふうに書きます。

```r
df_simple_wide <- df_simple %>%
  pivot_wider(names_from = year,
              values_from = population)
```

```out outputs/09-wide.txt
```

行数が9580から1916に減って、代わりに年の列が3つ増えました。列名を `year` から取ってきて、その中身（つまりvalue）を `population` から取ってくることによって、データを横長（wider）にしなさい、という意味です。

<div class="pivot-anim anim-host"></div>
<script src="assets/pivot-anim.js"></script>

<figure class="fig fig-pivot-static fig-anim-static">
<svg viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="縦長のデータを横長に変える様子を示した図">
  <text class="f-label" x="10" y="18">縦長（tidy data）</text>
  <rect class="f-head" x="10" y="28" width="90" height="26"/>
  <rect class="f-mark" x="100" y="28" width="60" height="26"/>
  <rect class="f-mark2" x="160" y="28" width="80" height="26"/>
  <text class="f-th" x="20" y="46">region</text>
  <text class="f-th" x="110" y="46">year</text>
  <text class="f-th" x="170" y="46">人口</text>
  <rect class="f-cell" x="10" y="54" width="90" height="26"/><rect class="f-cell" x="100" y="54" width="60" height="26"/><rect class="f-cell" x="160" y="54" width="80" height="26"/>
  <text x="20" y="72">A市</text><text x="110" y="72">2020</text><text x="170" y="72">100</text>
  <rect class="f-cell" x="10" y="80" width="90" height="26"/><rect class="f-cell" x="100" y="80" width="60" height="26"/><rect class="f-cell" x="160" y="80" width="80" height="26"/>
  <text x="20" y="98">A市</text><text x="110" y="98">2015</text><text x="170" y="98">90</text>
  <rect class="f-cell" x="10" y="106" width="90" height="26"/><rect class="f-cell" x="100" y="106" width="60" height="26"/><rect class="f-cell" x="160" y="106" width="80" height="26"/>
  <text x="20" y="124">B市</text><text x="110" y="124">2020</text><text x="170" y="124">200</text>
  <rect class="f-cell" x="10" y="132" width="90" height="26"/><rect class="f-cell" x="100" y="132" width="60" height="26"/><rect class="f-cell" x="160" y="132" width="80" height="26"/>
  <text x="20" y="150">B市</text><text x="110" y="150">2015</text><text x="170" y="150">180</text>

  <path class="f-arrow" d="M270 95 H400" marker-end="url(#ar)"/>
  <path class="f-arrow" d="M400 165 H270" marker-end="url(#ar)"/>
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="currentColor" style="fill:var(--ink-2)"/>
    </marker>
  </defs>
  <text class="f-code" x="272" y="86">pivot_wider()</text>
  <text class="f-note" x="272" y="118">列の名前に持ち上げる</text>
  <text class="f-code2" x="272" y="157">pivot_longer()</text>
  <text class="f-note" x="272" y="189">データの中身に降ろす</text>

  <text class="f-label" x="430" y="18">横長（人間が読みやすい形）</text>
  <rect class="f-head" x="430" y="28" width="90" height="26"/>
  <rect class="f-mark" x="520" y="28" width="70" height="26"/>
  <rect class="f-mark" x="590" y="28" width="70" height="26"/>
  <text class="f-th" x="440" y="46">region</text>
  <text class="f-th" x="534" y="46">2020</text>
  <text class="f-th" x="604" y="46">2015</text>
  <rect class="f-cell" x="430" y="54" width="90" height="26"/><rect class="f-mark2" x="520" y="54" width="70" height="26"/><rect class="f-mark2" x="590" y="54" width="70" height="26"/>
  <text x="440" y="72">A市</text><text x="540" y="72">100</text><text x="610" y="72">90</text>
  <rect class="f-cell" x="430" y="80" width="90" height="26"/><rect class="f-mark2" x="520" y="80" width="70" height="26"/><rect class="f-mark2" x="590" y="80" width="70" height="26"/>
  <text x="440" y="98">B市</text><text x="540" y="98">200</text><text x="610" y="98">180</text>
  <text class="f-note" x="430" y="132">赤い部分が列の名前になり、</text>
  <text class="f-note" x="430" y="150">青い部分が中身になる</text>
  <text class="f-note" x="430" y="186">この形なら 2020／2015 の</text>
  <text class="f-note" x="430" y="204">引き算が1行の中でできる</text>
</svg>
<figcaption>同じデータの2つの形。数字は説明のための架空のものです。</figcaption>
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

札幌市は10年で3.1％増えた、と読めます。年度名を表す列名がバッククオート（`` ` ``）で囲われているのは、列名の最初に半角数字が来ると、そのままではRにきちんと認識してもらえなくなるからです。めんどくさい……。

「縦長」のデータ形式のままでは、こういう計算をすることができません。**計算は基本的に、ひとつの「行」の中で完結しなければいけません**が、縦長状態では、ひとつの自治体のデータが複数の行にまたがっているからです。横長にすると複数年のデータが1行にまとまるので、今回のように、たとえば年ごとの変遷を追うような計算がやりやすくなります。

:::tips ここが分かれ道
「前年比」「10年間の変化」「A市とB市の差」のような**引き算・割り算をしたくなったら、まず横長にする**。これを覚えておくと、詰まったときに手が動きます。

逆に、グラフを描くときや、集計するときは縦長のほうが便利です。この講座でこれからやることは、要するに「計算のために横長にして、グラフのために縦長に戻す」の繰り返しです。
:::

## pivot_longer——縦長に戻す

と、横長データのメリットを説明したばかりではあるのですが、今度は横長から縦長に変換するやり方を説明します。なぜそんなことをする必要があるのかというと、横長のままだと、データの意味するところをコンピューターに理解してもらうのが難しいからです。

なぜ理解できないかというと、たとえば今回、データの中身はすべて「人口」でしたよね。でも、データのどこをみても、そんなことは書いてありません。これは人口のデータだよねというのを人間が理解できるのは、たとえばファイル名とか、あるいはファイルの中身を説明するための文書とかに、そのむねが書いてあるから（あるいは今回のように、それまで自分が加工してきたデータだから）。データの「外部」にある何かをすでに読んでいるから、なわけです。

でも、コンピューターがアクセスできるのはデータだけです。もとの縦長データでは、「調査年」「自治体名」「人口」と、それぞれの列の中身が何なのかを示すものがそれぞれの列の名前になっていましたよね。**すべての数字に「これは●●を示す数字ですよ」というラベルがついている。** これこそが、コンピューターにとって読みやすく、理解しやすい形式なのです。

こういうコードを書くと、縦長に戻すことができます。

```r
df_simple_wide %>%
  pivot_longer(cols = -c(region),
               names_to = "year",
               values_to = "population")
```

`pivot_longer()` 関数の括弧の中では、`cols` のところでまず、どの列を縦長にするかを選びます。この場合で縦長にしたいのは、`region` という列を除いた、「2020年度」「2015年度」「2010年度」の3つですね。この3つを一つずつ列挙することもできますが、`region` の前にマイナス記号をつけることで、region「以外」だよ、と指定することもできます。

さらに `names_to` のところでは、いまは列名になっているもの（つまり「2020年度」「2015年度」「2010年度」の3つです）を、「year」という名前の列の中身に格納してください、と指示しています。yearを二重引用符で囲っているのは、このデータにはyearという列はもともと存在しないので、コンピューターにとっては「初耳」だから、とでも解釈してください。

つぎに `values_to` のところでは、もとのデータで中身になっていたもの（つまり「2020年度」「2015年度」「2010年度」の3つの列に格納されていた数字）を、`population` という列に入れてください、と指示しています。populationを二重引用符で囲っているのは、yearのときと同じ理由です。

めんどくさいですが、こういう書き方もできます。

```r
df_simple_wide %>%
  pivot_longer(cols = c(`2020年度`, `2015年度`, `2010年度`),
               names_to = "year",
               values_to = "population")
```

どうでしょうか。理解するのはなかなか難しいと思います。私は正直、これが腑に落ちるまでかなりの時間を要しました。今でもときどき混乱します。何度も練習して、体にしみこませてください。

:::note 覚え方
私はこう考えるようにしています。

- **pivot_longer**：列の名前を、データの中身に降ろす。だから行が増えて縦に長くなる。
- **pivot_wider**：データの中身を、列の名前に持ち上げる。だから列が増えて横に広くなる。

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

いま説明した「縦長」の形には、tidy data（整然データ）という名前がついています。tidyverseというパッケージ名の「tidy」はここから来ています。決まりごとは3つだけです。

1. 1つの列に、1つの種類の情報が入っている
2. 1つの行が、1件の観測にあたる
3. 1つのマスに、1つの値だけが入っている

役所が出す表は、ほぼこの逆を向いています。列の名前に年や性別が入り、1つのマスに「1,234（うち男 567）」のような複数の情報が詰め込まれ、行の途中に小計が挟まる。

だから私たちの仕事のかなりの部分は、「人間が見るために作られた表」を「機械が読める整然データ」に組み替えることになります。この講座の第1部でやってきたことは、全部そのための道具です。そして[19章](19-kami-excel.html)では、その最終形態ともいえる「神エクセル」に挑みます。
