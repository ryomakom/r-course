---
title: データ型でつまずく
nav: 10 データ型でつまずく
kicker: 第1部　データを読む・加工する
lead: Excelファイルを読み込み、ついでに「数値のはずなのに文字列」という定番の落とし穴に落ちます。
---

## Excelファイルを読む

さて、これまで2010、2015、2020年度という国勢調査3回分の人口データを扱ってきました。今度はさらに2000年と2005年のデータも加えてみましょう。ただし、このふたつのファイルはこれまでのcsvファイルとはちがって、Excelのファイルです。したがって、`read_csv()` 関数では読むことができません。

:::data この章で使うデータ
[人口データ2005.xls](files/人口データ2005.xls)

[人口データ2000.xlsx](files/人口データ2000.xlsx)

拡張子が違うことに注目してください。古い形式（xls）と新しい形式（xlsx）が混ざっています。
:::

便利なのはreadxlパッケージのなかにある、`read_excel()` 関数です。まずはreadxlパッケージをインストールし、さらに呼び出しましょう。

```r
install.packages("readxl")
library(readxl)
```

この関数だと、`read_csv()` とほとんど同じかたちでExcelファイルを読み込めます。あとうれしいのは、Excelファイルにも拡張子がxlsのやつとxlsxのやつがありますが、どちらでも同じように読み込んでくれることです。

```r
read_excel("data/人口データ2005.xls", skip = 8)
read_excel("data/人口データ2000.xlsx", skip = 8)
```

よしよし、うまく読めましたね。

:::tips シートが複数あるとき
Excelファイルは、ひとつのファイルの中に何枚もシートを持てます。何も指定しないと、`read_excel()` は**いちばん左のシート**だけを読みます。

```r
excel_sheets("data/人口データ2000.xlsx")            # シート名の一覧を見る
read_excel("data/人口データ2000.xlsx", sheet = 2)    # 2枚目を読む
read_excel("data/人口データ2000.xlsx", sheet = "北海道")  # 名前で指定する
```

シートがたくさんあるファイルを、それも何十個もまとめて読む、というのは[19章](19-kami-excel.html)でやります。

なお、`read_excel()` には `locale` の指定はいりません。文字コードの問題はExcelファイルには起きないので、そこだけはcsvよりラクです。
:::

## エラーが出る

というわけで、ほかの年のデータと合体してみましょう。

```r
df <- bind_rows(df2020,
                read_csv("data/人口データ2015.csv", skip = 2),
                read_csv("data/人口データ2010.csv", skip = 5,
                         locale = locale(encoding = "CP932")),
                read_excel("data/人口データ2005.xls", skip = 8),
                read_excel("data/人口データ2000.xlsx", skip = 8))
```

あらら、エラーが出てしまいました。なぜでしょうか。Rはこんなふうに理由を告げています。

```out outputs/10-type-error.txt <double> <character>
```

合体しようとしたところ、名前が同じ列なのに、あるものはデータ型がdouble、つまり数値として認識されていて、でも別のものはcharacter、つまり文字列として認識されている。だから合体できないよ、と言っているのです。

データ型って何じゃいと思いますよね。

:::note データ型の一覧
tibbleを表示したとき、列名の下に出てくる記号がデータ型です。

| 記号 | 名前 | 中身 |
|---|---|---|
| `<chr>` | character | 文字列。計算はできない |
| `<dbl>` | double | 小数を含みうる数値 |
| `<int>` | integer | 整数 |
| `<lgl>` | logical | TRUE か FALSE |
| `<date>` | Date | 日付 |
| `<fct>` | factor | 決まった選択肢のどれか（グラフの並び順を決めるときに使う） |

数値と文字列の区別がいちばん大事です。`"100"` と `100` は、人間の目には同じでもRには別物で、文字列のままでは足し算もできませんし、並べ替えをすると「1、10、100、2、20」のように辞書順に並んでしまいます。
:::

## なぜ数値が文字列として読まれたのか

同じ名前の列なのに、数値として読まれたり文字列として読まれたりするのはなぜなのか。ファイルを開くとわかります。2010年以降のみっつのファイルでは、人口データが入った列には数字しか入っていません。だから数値として認識されました。でも2000年と2005年のファイルでは、一部の自治体で数値以外にハイフン（-）とかアスタリスク（*）が入っていたりするのです。

ファイルの冒頭（読み込むときにskipしてすっ飛ばした部分）に書かれている凡例を思い出してください。[04章](04-import.html)で見たあの3行です。

| 記号 | 意味 |
|---|---|
| `***` | 調査又は集計していないもの |
| `-` | データが得られないもの |
| `X` | 数値が秘匿されているもの |

つまり、人口をそもそも集計していなかったり、データが得られなかったり、秘匿されていたりした場合に、この記号が入っているわけです。このように、数値以外の余計な文字が入っているから、Rには「ああ、これは数値じゃなくて、ひとまずただの文字列として読みこんどこうか」と判断されてしまったわけです。

## 全部文字列として読み込んでしまう

この問題を解決するには、いくつかのやり方がありますが、もっとも簡単なのは、データ型が数値になっている列についても、ここはいったん文字列として読み込むことにして、そのうえですべてを合体させる、というアプローチでしょう。たとえば、こんなふうに書けます。

```r
df <- bind_rows(read_csv("data/人口データ2020.csv", skip = 8,
                         col_types = cols(.default = "c")),
                read_csv("data/人口データ2015.csv", skip = 2,
                         col_types = cols(.default = "c")),
                read_csv("data/人口データ2010.csv", skip = 5,
                         locale = locale(encoding = "CP932"),
                         col_types = cols(.default = "c")),
                read_excel("data/人口データ2005.xls", skip = 8,
                           col_types = rep("text", 37)),
                read_excel("data/人口データ2000.xlsx", skip = 8,
                           col_types = rep("text", 37)))
```

`read_csv()` 関数の場合だと、丸括弧のなかで `col_types = cols(.default = "c")` と書くことで、すべての列はデフォルトで文字列として読み込んでくださいね、と宣言できます。2020年度、2015年度、2010年度のデータについてはこのように処理しています。

一方で2005年度と2000年度のファイルは `read_excel()` 関数を使わなければいけませんが、この関数では「デフォルト」となるデータ型を指定することができません。37個あるすべての列について、文字列で読み込んでくださいね、と明示的に指示しているのが `col_types = rep("text", 37)` という部分です。

`rep("text", 37)` というのが何なのか、不思議に思うかもしれませんが、要するに「text」というのを37回繰り返しなさいよ、といっているだけです。repはrepeatの最初の3文字です。

```console
> rep("text", 37)
 [1] "text" "text" "text" "text" "text" "text" "text" "text" "text" "text"
[11] "text" "text" "text" "text" "text" "text" "text" "text" "text" "text"
[21] "text" "text" "text" "text" "text" "text" "text" "text" "text" "text"
[31] "text" "text" "text" "text" "text" "text" "text"
```

でも、何だかややこしいですね。こんなアプローチもあります。

```r
df <- bind_rows(read_csv("data/人口データ2020.csv", skip = 8) %>%
                  mutate(across(everything(), as.character)),

                read_csv("data/人口データ2015.csv", skip = 2) %>%
                  mutate(across(everything(), as.character)),

                read_csv("data/人口データ2010.csv", skip = 5,
                         locale = locale(encoding = "CP932")) %>%
                  mutate(across(everything(), as.character)),

                read_excel("data/人口データ2005.xls", skip = 8) %>%
                  mutate(across(everything(), as.character)),

                read_excel("data/人口データ2000.xlsx", skip = 8) %>%
                  mutate(across(everything(), as.character)))
```

これは5件のデータに対して基本的に同じことをしています。パイプ演算子でつないでから

```r
mutate(across(everything(), as.character))
```

という関数をかけています。これは、すべて（everything）の列にわたって（across）、文字列として（as.character）変換してくださいね、という命令です。

どちらでも同じ結果が得られます。私は後者のほうが好みですが、やり方は他にもいろいろあるはずです。

どんなアプローチを選ぶかは趣味の問題でもありますが、だいじなのは手間を省きつつ、得たい結果を正しく得られるようなコードを書くことです。元となるデータの特徴をよく観察して、どういう手順をふむべきかを考えましょう。ぐぐったりAIに聞いたりすることも大いに役立ちます。

5年分を合体できたか、確かめておきましょう。

```out outputs/10-count-year.txt
```

いつつの年すべてが1916行。うまくいっています。

## 文字列を数値に戻す

さて、全部を文字列として読み込んで合体させたわけですが、このままでは計算ができません。必要な列だけ、数値に戻してやります。

```r
df_simple <- df %>%
  rename(year = 調査年,
         region = 地域,
         population = `A1101_総人口【人】`) %>%
  select(year, region, population) %>%
  mutate(population = as.double(population))
```

`as.double()` が、文字列を数値に変換する関数です。ここで、こんな警告が出ることがあります。

```text
Warning: NAs introduced by coercion
```

「変換の過程でNAが生まれました」という意味です。さっき出てきたハイフンやアスタリスクは数値にできないので、NAに置き換えられたわけです。

**これは、それでいいのです。** 「集計していない」という情報を「数値ではない」というかたちで持ち越したことになります。ただし、いくつNAになったかは必ず確かめてください。

```r
df_simple %>%
  filter(is.na(population)) %>%
  count(year)
```

```out outputs/10-na-check.txt
```

2000年度は47、2005年度は34、2010年度は5。思っていたより多ければ、変換の指定が間違っているか、そもそも読み込み方がおかしい可能性があります。

:::tips 数字に混ざったカンマや単位を落とす
役所のデータでは、数字が `"1,234"` や `"1,234人"` のような文字列で入っていることがよくあります。これは `as.double()` ではNAになってしまうので、先に余計な文字を取り除きます。

```r
mutate(population = parse_number(population))
```

`parse_number()` は、カンマや単位のような余計な文字を捨てて数字だけを取り出してくれる関数です。`as.double("1,234")` はNAになりますが、`parse_number("1,234")` は1234になります。

自分で取り除くこともできます。

```r
mutate(population = as.double(str_remove_all(population, "[,人 ]")))
```

`str_remove_all()` は、指定した文字を全部取り除く関数です。角括弧のなかに並べた文字（ここではカンマ、「人」、半角スペース）のどれかに当てはまるものが、すべて消えます。ただし、ふだんは `parse_number()` のほうが早くて安全です。**この違いで実際に4072件を溶かしかけた例が[付録C](a3-shukudai.html)にあります。**

△や※を「ゼロ扱い」にするか「NA扱い」にするかは、注記を読んで判断してください。ここは技術ではなく取材の問題です。
:::

## 年も数値にしておく

`year` の列には「2020年度」のような文字が入っています。このままではグラフの横軸として使いにくいので、数値の年に直しておきましょう。

```r
df_simple <- df_simple %>%
  mutate(year = as.double(str_sub(year, 1, 4)))
```

`str_sub(year, 1, 4)` で頭から4文字（＝「2020」）を取り出し、それを `as.double()` で数値にしています。文字列操作とデータ型変換の合わせ技で、これはよく使う形です。
