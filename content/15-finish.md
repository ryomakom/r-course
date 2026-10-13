---
title: グラフを仕上げて外に出す
nav: 15 仕上げて外に出す
kicker: 第2部　データを見る
lead: 日本語が四角に化ける問題、画像として保存する方法、デザイナーに渡すcsvの作り方、ついでにマウスで触れるグラフも。
---

## 日本語が「□□□」になるとき

グラフに日本語のタイトルを入れたら、文字が全部豆腐みたいな四角になった。あるいは警告がずらずら出てきた。Macを使っている人は、ほぼ確実にこれに出会います。

（このページのグラフはWindowsで作っていて、そちらでは何も指定しなくても日本語が出ました。Rが勝手に代わりのフォントを探してくれる場合があるからです。つまり**出る人と出ない人がいる**ので、勉強会では必ず両方の説明が必要になります）

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

ggplotの初期設定は背景が灰色ですが、これは好みが分かれるところです。テーマを変えると、雰囲気がかなり変わります。

```r
five_pref %>%
  ggplot() +
  geom_line(aes(x = year, y = population, color = prefecture)) +
  theme_minimal(base_family = "Yu Gothic")
```

![theme_grayで描いた折れ線グラフ。灰色の背景に白い格子](images/15-theme-gray.png "theme_gray。ggplotの初期設定")

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

## デザイナーに渡すデータを書き出す

とはいえ、このグラフを記事に使って読者様にお見せするのは、さすがにちょっとキツイ。社内にいるプロのデザイナーに頼んで、もっとかっこいいグラフにしたいですよね。あるいはFlourishとかを使って、ウェブで使えるインタラクティブなグラフにしてもいいでしょう。いずれにしても、データを何らかの形で出力して保存する必要があります。そのときにはこんなコードを書きます。

```r
all_municipality_change %>%
  write_excel_csv("デザイナー用.csv")
```

`write_excel_csv` というのが、そのための関数です。同じようなことができる関数はいくつかあります。たとえば `write_csv` なんていうものもありますが、これで出力したファイルをエクセルでそのまま開くと文字化けしてしまいます。`write_excel_csv` ならエクセルでも文字化けしませんので、私はこちらをよく使っています。

渡す前に、必要な列だけに絞っておくのも親切です。

```r
five_pref %>%
  mutate(rate_under15 = population_under15 * 100 / population) %>%
  select(year, prefecture, rate_under15) %>%
  write_excel_csv("output/デザイナー用.csv")
```

## マウスで触れるグラフにする

もうひとつ、自分がデータを探るときに便利な技を紹介します。plotlyというパッケージを使うと、ggplotで描いたグラフをそのままマウスで触れるものに変えてくれます。

```r
install.packages("plotly")
library(plotly)
```

`ggplotly()` という関数の丸括弧のなかに、インタラクティブ化したいグラフを入れるだけです。

```r
ggplotly(all_pref %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() +
           geom_point(aes(x = year,
                          y = rate_under15,
                          color = prefecture)))
```

点にマウスを乗せると、それがどの都道府県のどの年のデータなのかが表示されます。さきほど「47色は多すぎる」と書きましたが、こうやって一つずつ確かめられるなら、色が多くても探索の役には立ちます。

**これは記事用ではなく、自分が確かめるための道具**だと考えるのがいいと思います。「この外れ値、どこだ？」を一瞬で確かめられるので、私は分析中にかなり使います。htmlとして出力することもできるので、同僚と共有するのにも使えます。

:::warn ggplotlyの限界
`ggplotly()` は便利ですが、ggplotの見た目を完全に再現してはくれません。タイトルの位置がずれたり、凡例の見出しが消えたり、`labs()` で入れたsubtitleが落ちたりします。

読者に見せるインタラクティブなグラフを作るなら、FlourishやDatawrapperのようなサービスにcsvを渡すか、社内のデザイナーに頼むのが現実的です。
:::

---

これで第2部は終わりです。データを読み込んで、加工して、グラフで眺めて、外に出すところまでできるようになりました。

ただ、ここまでのすべては「データがすでに手元にある」ことを前提にしていました。次の第3部では、そのデータを自分で集めてくる方法を扱います。
