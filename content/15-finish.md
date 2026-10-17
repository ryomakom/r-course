---
title: グラフを仕上げて外に出す
nav: 15 仕上げて外に出す
kicker: 第2部　データを見る
lead: 日本語が四角に化ける問題、画像として保存する方法、デザイナーに渡すcsvの作り方、ついでにマウスで触れるグラフも。
---

## 日本語が「□□□」になるとき

グラフに日本語のタイトルを入れたら、文字が全部豆腐みたいな四角になった。あるいは警告がずらずら出てきた。こういうことが時々あります。

原因は、ggplotが使おうとしている標準のフォントに日本語が入っていないことです。使うフォントを指定してやれば直ります。

```r
theme_set(theme_gray(base_family = "HiraKakuProN-W3"))   # Mac
theme_set(theme_gray(base_family = "Yu Gothic"))         # Windows
```

`theme_set()` は「これからつくるグラフ全部にこの設定を使ってね」という命令です。R Markdownのいちばん上、`library(tidyverse)` の次の行あたりに書いておくのがおすすめです。

:::tips 使えるフォントの名前を調べる
フォント名は環境によって違うので、手元で使えるものを確かめるのが確実です。

```r
library(systemfonts)
system_fonts() %>%
  filter(str_detect(family, "Gothic|Mincho|Hira|Noto")) %>%
  distinct(family)
```

Windowsなら「Yu Gothic」「Meiryo」「MS Gothic」、Macなら「Hiragino Sans」あたりが使えるはずです。どうしてもうまくいかないときは、グラフの文字は英語のままにして、あとで画像編集ソフトかデザイナーの手で日本語を入れる、という割り切り方もあります。
:::

## テーマで見た目を変える

ggplotの初期設定は背景が灰色です。こんな感じ。

![theme_grayで描いた折れ線グラフ。灰色の背景に白い格子](images/15-theme-gray.png "theme_gray。ggplotの初期設定")

テーマを変えると、雰囲気がかなり変わります。

```r
five_pref %>%
  ggplot() +
  geom_line(aes(x = year, y = population, color = prefecture)) +
  theme_minimal()
```
![theme_minimalで描いた折れ線グラフ。白地に薄い格子](images/15-theme-minimal.png "theme_minimal。白地ですっきり")

| テーマ | 見た目 |
|---|---|
| `theme_gray()` | 初期設定。灰色の背景に白い格子 |
| `theme_minimal()` | 白地に薄い格子。すっきり |
| `theme_classic()` | 白地に軸の線だけ。論文っぽい |
| `theme_bw()` | 白地に黒枠 |

細かい調整もできます。よく使うのは凡例の位置と、文字の大きさくらいでしょうか。

```r
  theme(legend.position = "bottom",           # 凡例を下に
        plot.title = element_text(size = 16)) # タイトルを大きく
```

が、まあこういうのは凝りだすとキリがありません。しかも凝ったところで社内のデザイナーが作り直すことになるので、ほどほどに。

## グラフを画像として保存する

同僚にチャットで送りたい、企画書に貼りたい。そういうときは `ggsave()` を使います。

```r
ggsave("output/kodomo.png", width = 8, height = 5, dpi = 200)
```

**直前に描いたグラフ**が保存されます。オブジェクトに入れてから保存することもできます。

```r
g <- five_pref %>%
  ggplot() +
  geom_line(aes(x = year, y = population, color = prefecture))

ggsave("output/jinko.png", plot = g, width = 8, height = 5, dpi = 200)
```

`width` と `height` はインチ、`dpi` は解像度です。拡張子を `.pdf` や `.svg` にすると、拡大しても劣化しない形式で保存できます。デザイナーに渡すならこちらのほうが喜ばれます。

あるいは、RStudioの右下のパネルにあるExportボタンを押せば、コードを書かなくても画像を保存できます。お好きなやり方でどうぞ。

## デザイナーに渡すデータを書き出す

いい感じのグラフができたとはいえ、さすがにこれをそのまま記事に使って読者様にお見せするのは、ちょっとキツイ。社内にいるプロのデザイナーに頼んで、もっとかっこいいグラフにしたいですよね。あるいはFlourishとかを使って、ウェブで使えるインタラクティブなグラフにしてもいいでしょう。いずれにしても、データを何らかの形で出力して保存する必要があります。そのときにはこんなコードを書きます。

```r
all_municipality_change %>%
  write_excel_csv("output/デザイナー用.csv")
```

`write_excel_csv` というのが、そのための関数です。同じようなことができる関数はいくつかあります。たとえば `write_csv` なんていうものもありますが、これで出力したファイルをエクセルでそのまま開くと文字化けしてしまいます。`write_excel_csv` ならエクセルでも文字化けしませんので、私はこちらをよく使っています。

渡す前に、必要な列だけに絞っておくのも親切です。たとえばこんな感じ。

```r
all_municipality_change %>%
  select(
    prefecture,
    municipality,
    population_2020,
    change_under15
  ) %>%
  write_excel_csv("output/デザイナー用.csv")
```


## マウスで触れるグラフにする

もう一つ、自分がデータを探るときに便利な技を紹介します。plotlyというパッケージを使うと、ggplotで描いたグラフをそのままマウスで触れるものに変えてくれます。

```r
install.packages("plotly")
library(plotly)
```

`ggplotly()` という関数の丸括弧のなかに、インタラクティブ化したいグラフを入れるだけです。

```r
ggplotly(
  all_municipality_change %>%
    mutate(area = if_else(prefecture == "東京都", "東京都の自治体", "その他")) %>%
    ggplot() +
    geom_point(
      aes(
        x = population_2020,
        y = change_under15,
        color = area,
        text = paste0(prefecture, municipality)
      ),
      alpha = 0.3
    ) +
    scale_x_log10(),
  tooltip = c("text", "x", "y")
)
```

<figure class="fig">
<iframe src="images/15-plotly.html" title="ggplotly() で作った、マウスで触れる散布図" loading="lazy"></iframe>
<figcaption>上のコードで作ったグラフ。点にマウスを乗せたり、範囲をドラッグして拡大したりできます。</figcaption>
</figure>

点にマウスを乗せると、それがどの市区町村のどんなデータなのかが表示されます。

**これは記事用ではなく、自分が確かめるための道具**だと考えるのがいいと思います。「この外れ値、どこだ？」みたいなことをすぐに確かめられるので、私は分析中にかなり使います。htmlとして出力することもできるので、同僚と共有するのにも使えます。

:::warn ggplotlyの限界
`ggplotly()` は便利ですが、ggplotの見た目を完全に再現してはくれません。タイトルの位置がずれたり、凡例の見出しが消えたり、`labs()` で入れたsubtitleが落ちたりします。

読者に見せるインタラクティブなグラフを作るなら、FlourishやDatawrapperのようなサービスにcsvを渡すか、社内のデザイナーに頼むのが現実的です。
:::

---

これで第2部は終わりです。データを読み込んで、加工して、グラフで眺めて、外に出すところまでできるようになりました。

ただ、ここまでのすべては「データがすでに手元にある」ことを前提にしていました。次の第3部では、そのデータを自分で集めてくる方法を扱います。
