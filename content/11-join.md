---
title: データを横にくっつける
nav: 11 横にくっつける（join）
kicker: 第1部　データを読む・加工する
lead: 別々の統計データをleft_joinでくっつけます。いわゆる「ケ・ヶ問題」で苦しむことで、表記ゆれのないコードによる管理のありがたさを学びます。
---

ではつぎにjoin関数を学んでいきましょう。複数のデータを合体する、という意味では `bind_rows` 関数と似ていますが、あれは複数の「行」を合体するためだったのに対して、今回のjoin関数は「列」を合体するためのものです。しかも、単にくっつけるだけではなくて、しかるべきもの、くっつけてほしいものをくっつけることができます。

## まずはくっつけてみる

どういうことかはおいおい説明するとして、まずは合体させるためのデータを用意しましょう。市区町村別の労働人口についてのデータです。

:::data この章で使うデータ
[労働人口データ2020.csv](files/労働人口データ2020.csv)
:::

```r
read_csv("data/労働人口データ2020.csv", skip = 8)
```

以前に読み込んだ人口についてのデータと同じように、分かりにくい列の名前を簡単なものに改めるとともに、必要な列だけを残しましょう。

```r
working_population2020 <- read_csv("data/労働人口データ2020.csv", skip = 8) %>%
  rename(region = 地域,
         primary = `F2201_第1次産業就業者数【人】`,
         secondary = `F2211_第2次産業就業者数【人】`,
         tertiary = `F2221_第3次産業就業者数【人】`) %>%
  select(region,
         primary,
         secondary,
         tertiary)
```

では、これを人口のデータ（`df_simple`）に合体させてみましょう。`left_join()` という関数を使います。ちなみに、なぜ「left」なのかという話は、後で説明しますね。

```r
df_simple %>%
  left_join(working_population2020) %>%
  view()
```

このコードを実行すると `Joining with by = join_by(region)` というメッセージが出たはずです。これは、`df_simple` と `working_population2020` というふたつのオブジェクトのうち、`region` という列を「とっかかり」にして合体したよ、という意味です。いずれのオブジェクトにも、自治体名を示す `region` という列があったのを思い出してください。このメッセージはつまり、`region` の列に格納された文字列を使って「突合」をして合体した、ということを意味しています。

## うまくいった、と思いきや

`view` 関数をつかって、できあがったデータをよくみてみましょう。北海道札幌市の行をみると、人口を示す `population` の列に数字が入っていますし、その横には第1次産業の労働者数を示す `primary` や第2次産業の `secondary` などの数字も入っています。パッと見たところ、うまく行っているようです。

ただし、注意が必要です。たとえば `primary` の列に注目して、数字が小さい順に並べ替えてみましょう。そのうえで一番下までスクロールしてみると……NA、つまり「空っぽ」のところがいくつも並んでいますね。なぜでしょうか。

NAとなっている自治体の名前をみてみると、たとえば「青森県六ケ所村」「佐賀県吉野ケ里町」「東京都青ケ島村」など、カタカナの「ケ」が入っているところが多くなっています。あとは「東京都檜原村」と「福島県檜枝岐村」とか。想像するに、**異体字が原因でうまく突合ができていない**ということなのでしょう。

:::warn 名前で突合してはいけない
これは日本語のデータを扱う記者が、いつか必ずぶつかる壁です。同じ自治体を指しているのに、統計によって表記が違う。

- 「六ケ所村」と「六ヶ所村」（大文字のケと小文字のヶ）
- 「檜原村」と「桧原村」（異体字）
- 「長崎県南島原市」と「長崎県 南島原市」（空白の有無）
- 「大阪市北区」と「大阪府大阪市北区」（都道府県名を含むかどうか）

人間の目には同じに見えますが、コンピューターには完全な別物です。しかもjoinでは、突合できなかった行があってもエラーは出ません。だから気づかないまま記事にしてしまう危険があります。

対策は一つ。**名前ではなくコード**（プログラミング言語で書いた文章を意味する「コード」とは別物です）**で突合する。** 自治体なら全国地方公共団体コード、企業なら法人番号、学校なら学校コード。数字なら異体字の問題は起きません。
:::

## 地域コードで突合し直す

ではどうするか。元のデータには、いずれも地域の「コード」を示す列がありました。ここを利用すればうまくやれそうです。というわけで、まずオブジェクトを作り直しましょう。

まずは労働力データから。地域コードの列を `code` という名前にしたうえで残しておきます。

```r
working_population2020 <- read_csv("data/労働人口データ2020.csv", skip = 8) %>%
  rename(code = `地域 コード`,
         region = 地域,
         primary = `F2201_第1次産業就業者数【人】`,
         secondary = `F2211_第2次産業就業者数【人】`,
         tertiary = `F2221_第3次産業就業者数【人】`) %>%
  select(code,
         region,
         primary,
         secondary,
         tertiary)
```

次に人口データ。同様に地域コードの列を `code` と改名して残します。

```r
df_simple <- df %>%
  rename(year = 調査年,
         code = `地域 コード`,
         region = 地域,
         population = `A1101_総人口【人】`) %>%
  select(year,
         code,
         region,
         population)
```

このふたつを合体してみます。さっきは突合の手がかりについて何も指定しませんでしたが、今回は明示的に指定します。ふたつのオブジェクトで名前が共通している列を使って突合するのがデフォルトですが、今回は `region` の列は使わずに（使うと前回と同じような突合漏れが発生してしまいます）、`code` の列だけを使ってほしいからです。

```r
df_simple %>%
  left_join(working_population2020,
            by = join_by(code)) %>%
  view()
```

`by = join_by(code)` が、「codeの列だけをとっかかりに突合してね」という指示です。`by = "code"` と書いても同じです。ふたつのデータで列の名前が違う場合（たとえば片方が `code`、もう片方が `shikuchoson_code`）は、`by = join_by(code == shikuchoson_code)` のように対応を書きます。

## 同じ名前の列がふたつできる

できたものを見てみましょう。住所を示す列が、`region.x` と `region.y` のふたつ、できていますね。

このうち `region.x` のほうは `df_simple` にあったregion列の名前が変わったもので、`region.y` は `working_population2020` のほうにあったものです。両方のtibbleで同じ名前の列があったけれど、その列は突合のとっかかりに使わなかったので、合体後のtibbleに両方とも残ることになりました。でも名前が同じ列がふたつあると区別が付かなくて具合が悪いので、「.x」「.y」というのを列名の後ろにくっつけた、というわけです。

ともあれ、住所を示す列がふたつあるのは、やっぱり気持ちがよくないし無駄ですよね。なので、片方は削ってしまいましょう。`df_simple` のregion列を優先するために、`working_population2020` のほうを削ることにします。つまり、こんなコードです。

```r
df_simple %>%
  left_join(working_population2020 %>%
              select(-region),
            by = join_by(code)) %>%
  view()
```

こうすれば、合体後のtibbleには余計なregionの列はひとつしか残らないことになります。

くっつける側のデータを、`left_join()` の丸括弧のなかでそのまま加工しているのがポイントです。こういう書き方ができるので、わざわざ別のオブジェクトを作らなくても済みます。

## left_joinのleftとは

ちなみに、join関数には `left_join()` 以外にもいくつかありますが、基本、よく使うのは `left_join()` だと思ってください。left_joinのleftは「左」のことで、たとえば `A %>% left_join(B)` というコードだと、「AのtibbleにBをくっつけなさい」という意味になります。逆に `B %>% left_join(A)` だと、「BにAをくっつけなさい」ということです。

どっちも同じじゃないの、と思ったかもしれませんが、ちょっと違います。たとえばAのtibbleには10行分のデータがあって、Bには5行分があったとしましょう。この場合、`A %>% left_join(B)` とすると、合体後のtibbleは10行になります。`B %>% left_join(A)` だと、5行になります。

もう少し説明します。

たとえば住所をとっかかりにAとBのtibbleを合体させるとして、「東京都中央区」のデータはAのほうにしかなく、「大阪市浪速区」のデータはBにしかない、といったケースを考えてみましょう。このとき、AをもとにしてそこにBを合体させると、合体後のtibbleに東京都中央区のデータはあっても大阪市浪速区のものはありません。また、BをもとにしてAを合体させると、合体後に大阪市浪速区のデータはあっても東京都中央区はなくなります。

<figure class="fig">
<svg viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="left_joinで左のtibbleの行だけが残る様子を示した図">
  <text class="f-label" x="10" y="18">A（人口データ）</text>
  <rect class="f-head" x="10" y="28" width="70" height="26"/><rect class="f-head" x="80" y="28" width="90" height="26"/><rect class="f-head" x="170" y="28" width="70" height="26"/>
  <text class="f-th" x="20" y="46">code</text><text class="f-th" x="90" y="46">region</text><text class="f-th" x="180" y="46">人口</text>
  <rect class="f-mark" x="10" y="54" width="70" height="26"/><rect class="f-cell" x="80" y="54" width="90" height="26"/><rect class="f-cell" x="170" y="54" width="70" height="26"/>
  <text x="20" y="72">13102</text><text x="90" y="72">中央区</text><text x="180" y="72">100</text>
  <rect class="f-mark" x="10" y="80" width="70" height="26"/><rect class="f-cell" x="80" y="80" width="90" height="26"/><rect class="f-cell" x="170" y="80" width="70" height="26"/>
  <text x="20" y="98">13104</text><text x="90" y="98">新宿区</text><text x="180" y="98">200</text>
  <text class="f-label" x="10" y="150">B（労働人口データ）</text>
  <rect class="f-head" x="10" y="160" width="70" height="26"/><rect class="f-head" x="80" y="160" width="90" height="26"/>
  <text class="f-th" x="20" y="178">code</text><text class="f-th" x="90" y="178">第1次産業</text>
  <rect class="f-mark" x="10" y="186" width="70" height="26"/><rect class="f-cell" x="80" y="186" width="90" height="26"/>
  <text x="20" y="204">13102</text><text x="90" y="204">30</text>
  <rect class="f-off" x="10" y="212" width="70" height="26"/><rect class="f-off" x="80" y="212" width="90" height="26"/>
  <text x="20" y="230">27111</text><text x="90" y="230">15</text>
  <text class="f-note" x="10" y="256">27111（浪速区）はAにない</text>
  <path class="f-arrow" d="M250 130 H360" marker-end="url(#ar2)"/>
  <defs>
    <marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/>
    </marker>
  </defs>
  <text class="f-code" x="252" y="122">A %&gt;% left_join(B)</text>
  <text class="f-note" x="252" y="152">code を手がかりに</text>
  <text class="f-label" x="390" y="18">合体したもの</text>
  <rect class="f-head" x="390" y="28" width="70" height="26"/><rect class="f-head" x="460" y="28" width="80" height="26"/><rect class="f-head" x="540" y="28" width="60" height="26"/><rect class="f-head" x="600" y="28" width="100" height="26"/>
  <text class="f-th" x="400" y="46">code</text><text class="f-th" x="470" y="46">region</text><text class="f-th" x="550" y="46">人口</text><text class="f-th" x="610" y="46">第1次産業</text>
  <rect class="f-mark" x="390" y="54" width="70" height="26"/><rect class="f-cell" x="460" y="54" width="80" height="26"/><rect class="f-cell" x="540" y="54" width="60" height="26"/><rect class="f-mark2" x="600" y="54" width="100" height="26"/>
  <text x="400" y="72">13102</text><text x="470" y="72">中央区</text><text x="550" y="72">100</text><text x="610" y="72">30</text>
  <rect class="f-mark" x="390" y="80" width="70" height="26"/><rect class="f-cell" x="460" y="80" width="80" height="26"/><rect class="f-cell" x="540" y="80" width="60" height="26"/><rect class="f-mark2" x="600" y="80" width="100" height="26"/>
  <text x="400" y="98">13104</text><text x="470" y="98">新宿区</text><text x="550" y="98">200</text><text x="610" y="98">NA</text>
  <text class="f-note" x="390" y="132">・Aの行はすべて残る（2行）</text>
  <text class="f-note" x="390" y="154">・Bにしかない行は消える</text>
  <text class="f-note" x="390" y="176">・突合できなかったところは</text>
  <text class="f-note" x="390" y="196">　黙って NA になる ← ここが罠</text>
  <text class="f-note" x="390" y="226">B %&gt;% left_join(A) にすると</text>
  <text class="f-note" x="390" y="246">残るのはBの2行のほうになる</text>
</svg>
<figcaption>left_joinは「左のtibbleの行を全部残す」。数字は説明のための架空のものです。</figcaption>
</figure>

`A %>% left_join(B)` というコードだと、最初に指定したAというtibbleをもとにして、これにBというtibbleを合体させるわけです。文字は左から右に流れるので、もととなるAのtibbleは左側に書かれていますね。だから `left_join()` ということなのです。

`right_join()` はこれとは逆に、右側にあるtibble（つまり後に指定したtibble）に左側のtibbleを合体させるというものです。単にひっくり返しただけですし、書く順番をひっくり返せば `left_join()` だけでも実現できるので、`left_join()` さえ覚えておけば何とかなるケースが大半です。

また、どっちをもとにして合体する、というのが関係ないjoinのやり方もあります。それが `full_join()` と `inner_join()` です。先ほどの例を使って説明すると、`full_join()` をすると合体後のデータには東京都中央区と大阪市浪速区のデータが両方残ります。AとBのどちらか一方にしかデータがない行も合体後に残しておく、これがfull_joinです。一方で、`inner_join()` を使った合体後のデータからは、両方とも消えてしまいます。AとBの両方にデータがある行だけ残しなさい、これがinner_joinというわけです。

……ちょっと複雑でしょうか。でも正直言って、それほど真面目に覚える必要はありません。先ほど書いたとおり、`left_join()` さえ覚えてしまえば大丈夫。すでに覚えたいろいろな関数を使えば、その他のjoin関数でできるのと同じことが実現できますから、何とかなります。

| 関数 | 残る行 | 使いどき |
|---|---|---|
| `left_join()` | 左のtibbleの行が全部 | ふだんはこれ |
| `right_join()` | 右のtibbleの行が全部 | ほぼ使わない |
| `full_join()` | 両方の行が全部 | どちらにしかないものも見たいとき |
| `inner_join()` | 両方にある行だけ | 両方そろっている分だけで計算したいとき |
| `anti_join()` | 左にあって右にない行だけ | **突合できなかったものを探すとき** |

## anti_joinで「漏れ」を洗い出す

表のいちばん下に書いた `anti_join()` は、地味ですが役に立ちます。突合できなかった行だけを取り出してくれるからです。

```r
df_simple %>%
  anti_join(working_population2020, by = join_by(region))
```

```out outputs/11-anti-join.txt
```

15件、出てきました。「外ヶ浜町」「鰺ヶ沢町」「六ヶ所村」「七ヶ宿町」「青ヶ島村」は小さい「ヶ」、「塩竈市」は竈の字、「檜枝岐村」「檜原村」は檜の字。これが**突合できなかった自治体の全部**です。

さきほどの「ケ」と「ヶ」の問題も、これを一発打てば犯人の一覧が出てきます。joinをしたら、まずanti_joinで漏れを確かめる。この癖をつけておけば、黙ってNAにされる事故を防げます。

:::tips joinの前後で行数を見る
`left_join()` は、右側のデータに同じキーの行が複数あると、**行が増えます**。たとえば年ごとのデータに、年を指定せずに突合すると、ひとつの行が年の数だけ複製されることがあります。

```r
df_simple %>% nrow()                                  # 突合前
df_simple %>% left_join(working_population2020) %>% nrow()   # 突合後
```

このふたつが一致していなければ、キーの指定を間違えています。**joinの前後で行数を見る。** これだけで、データ分析の事故はかなり減ります。
:::

:::homework 宿題
複数の年のデータを含んだ労働力人口のcsvを読み込んで、`df_simple` と「年度」「自治体」に基づいて突合してください。

ヒント：とっかかりにする列がふたつになります。`by = join_by(year, code)` のように書きます。作例は[付録C](a3-shukudai.html)にあります。
:::

---

これで第1部は終わりです。読み込む、選ぶ、名前を変える、計算する、絞る、並べる、集計する、縦横を入れ替える、くっつける。ここまでで、記者の仕事で出てくるデータ加工のかなりの部分はこなせるようになりました。

次の第2部では、加工したデータを目で見えるようにしていきます。
