---
title: 神エクセルを解体する
nav: 19 神エクセルを解体する
kicker: 第3部　データを集める
lead: 見出しが2段になっていて、セルが結合されていて、シートが47枚ある。あのExcelを、tidyxlとunpivotrで機械が読める形に組み替えます。
---

## 神エクセルとは

役所が公表するExcelファイルには、独特の様式があります。上のほうに表題や日付や注記が入っていて、見出しが2段や3段になっていて、セルが結合されていて一つの見出しが複数の列にまたがっている。途中に小計の行が挟まっていたりもしますし、一つのファイルに同じ形のシートが47枚入っていることもあります。

紙に印刷して人が見るために作られているので、これはこれで理にかなっているわけです。でも `read_excel()` で読むと悲惨なことになります。列名が `...4` `...5` になり、結合されたセルの二つ目以降はNAになり、見出しの2段目はデータの1行目として読まれる。こういうファイルは、しばしば「神エクセル」と呼ばれます。

これを力技で直そうとすると、`rename` と `mutate` と `filter` を延々と書くことになります。しかもシートが47枚あれば、シートごとに微妙に形が違って、その全部に対応しなくてはいけません。めんどくさ。

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

[000979538.xlsx](files/000979538.xlsx)　衆院選の市区町村別得票（北海道）

`download` フォルダに入れると、この章のコードがそのまま動きます。総務省が公表しているファイルの写しです。
:::

`read_excel()` は、Excelのシートを「表」として読み込もうとします。だから表の形が崩れていると困るわけです。

一方、tidyxlの `xlsx_cells()` は、セルを一つずつ、バラバラの部品として読み込みます。

```r
"download/000979538.xlsx" %>%
  xlsx_cells()
```

返ってくるのは、こんな形のtibbleです。

```text
# A tibble: 40,000 × 21
   sheet         address   row   col is_blank data_type content     numeric ...
   <chr>         <chr>   <int> <int> <lgl>    <chr>     <chr>         <dbl>
 1 北海道第１区  A1          1     1 FALSE    character 〇年〇月…        NA
 2 北海道第１区  B3          3     2 FALSE    character 候補者A          NA
 3 北海道第１区  C5          5     3 FALSE    numeric   45231         45231
```

1行が一つのセルです。何シートの何行目の何列目に、何が入っているか。それがすべて記録されているだけなので、表の形が崩れていようが関係ありません。セルは常にセルであって、崩れようがないからです。

ここから、どのセルが見出しでどのセルが中身なのかをこちらが指定して、整然データに組み直していきます。それをやるのがunpivotrというパッケージです。

## beheadで見出しを剥がす

unpivotrの主役は `behead()` という関数です。beheadは「首を切り落とす」という意味で、要するに見出しを1段ずつ剥がして、それをデータの列に変えなさい、という命令です。

たとえば、こんなシートを考えてみます。

```text
      A            B           C
1  〇年〇月〇日執行
2  〇〇県第1区
3               候補者A      候補者B      ← 候補者名（見出し1段目）
4               ○○党       △△党       ← 政党（見出し2段目）
5  〇〇市中央区   45,231      38,102
6  〇〇市北区     52,882      41,993
     ↑
   市区町村名（左の見出し）
```

（名前と数字は説明のための架空のものです）

ほしいのは、こういう形です。

| 市区町村 | 候補者 | 政党 | 得票 |
|---|---|---|---|
| 〇〇市中央区 | 候補者A | ○○党 | 45231 |
| 〇〇市中央区 | 候補者B | △△党 | 38102 |
| 〇〇市北区 | 候補者A | ○○党 | 52882 |

`behead()` を使うと、こう書けます。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区") %>%
  behead("up-left", "day") %>%
  behead("up-left", "garbage") %>%
  behead("up-left", "district") %>%
  behead("up", "name") %>%
  behead("up", "party") %>%
  behead("left", "municipality") %>%
  select(day, district, municipality, name, party, numeric) %>%
  filter(!is.na(name), !is.na(numeric), !is.na(municipality))
```

`behead()` の丸括弧には二つ入っています。一つ目がその見出しの方向、つまりデータから見てどの向きにあるか。二つ目が、剥がした見出しを入れる列の名前です。

方向にはこんなものがあります。

| 指定 | 意味 |
|---|---|
| `"up"` | 真上にある見出し（列の見出し） |
| `"left"` | 真横（左）にある見出し（行の見出し） |
| `"up-left"` | 上にあって、左に寄っている見出し（結合セルや、左端だけに書かれた見出し） |
| `"left-up"` | 左にあって、上に寄っている見出し |

このうち `"up-left"` が神エクセル攻略の鍵になります。セルが結合されていたり、グループの先頭にだけ名前が書かれていたりする場合、真上を見ても何もありません。だから「上のほう、左に寄ったところ」を探してもらう必要があるわけです。

上のコードでは、`up-left` を3回続けて使って、1行目の日付、2行目の余計なもの、3行目の選挙区名を順に剥がしています。1枚ずつ皮をむくように、上から順番に剥がしていくイメージです。剥がす順番が大事です。

:::tips 1段ずつ実行して確かめる
このコードは、パイプを1本ずつ足しながら実行するのが正解です。

```r
"download/000979538.xlsx" %>%
  xlsx_cells() %>%
  filter(sheet == "北海道第１区") %>%
  behead("up-left", "day") %>%
  select(row, col, day, content) %>%      # ここで確かめる
  view()
```

`day` という列に、日付が全部のセルに配られていますか。配られていれば成功です。1つ剥がすたびに、こうやって目で確かめる。これがいちばん早い。

`select(row, col, ...)` で行番号と列番号を残しておくと、元のシートのどこの話なのかが分かって理解しやすくなります。
:::

最後の2行も大事です。

```r
select(day, district, municipality, name, party, numeric) %>%
filter(!is.na(name), !is.na(numeric), !is.na(municipality))
```

`numeric` というのは、そのセルの数値としての中身が入った列です。tidyxlはセルの中身を型ごとに別の列に入れてくれるので、文字なら `character`、数値なら `numeric`、日付なら `date` を見ればいい、という具合です。最後の `filter(!is.na(...))` は、見出しでもなく数字でもない余計なセル、たとえば注記のようなものを落としています。

:::warn tidyxlは.xlsを読めません
`xlsx_cells()` が読めるのは、拡張子が `.xlsx` と `.xlsm` のファイルだけです。古い `.xls` は読めません。

古い形式のファイルにぶつかったら、Excelで開いて `.xlsx` として保存し直すのが手っ取り早いです。「元データは手で触らない」原則と矛盾しますが、元ファイルは残したまま別名で保存すればいいので、実務上は問題になりません。
:::

## シートを全部処理する

さて、このファイルには北海道の小選挙区の数だけシートがあります。全部に同じ処理をしたい。[17章](17-loop.html)で覚えたfor文の出番です。今回は「ページの一覧」ではなく「シートの一覧」に対して回します。

まずシート名の一覧を取ります。

```r
sheet_names <- "download/000979538.xlsx" %>%
  excel_sheets()

sheet_names
```

`excel_sheets()` はreadxlの関数です（`library(readxl)` を忘れずに）。

そして回します。

```r
vote_data <- tibble()

for (i in sheet_names) {
  vote_data_temporaly <- "download/000979538.xlsx" %>%
    xlsx_cells() %>%
    filter(row > 3, sheet == i) %>%
    behead("left", "municipality") %>%
    behead("up", "name") %>%
    behead("up", "party") %>%
    mutate(district = i) %>%
    rename(vote = content) %>%
    select(district, municipality, name, party, vote) %>%
    filter(!is.na(municipality))

  vote_data <- bind_rows(vote_data, vote_data_temporaly)
}
```

さっきと少し違うところが三つあります。

一つは `filter(row > 3)` で、上の3行、つまり日付や選挙区名が書かれた部分を最初に切り捨てていること。`behead("up-left", ...)` で剥がす代わりに、いらないものを先に落としてしまうわけです。こちらのほうが単純で、シートごとの形の違いにも強いです。

二つ目は `mutate(district = i)` のところ。シート名そのものが選挙区名なので、ループの変数 `i` をデータの一部として持ち込んでいます。これは覚えておくと便利な技です。

三つ目は `rename(vote = content)` で、セルの中身の列を `vote` という名前に変えていることです。

:::note シート名が情報になっている
役所のExcelでは、「シート名」や「ファイル名」そのものが重要な情報を持っていることがよくあります。北海道第1区、第2区……というシート名は、まさにそれです。

`read_excel()` で1枚ずつ読んでいると、この情報はどこにも残りません。だから `mutate(district = i)` のように、明示的にデータの中へ入れてやる必要があります。

同じことは、ファイル名についてもいえます。都道府県ごとに分かれたファイルなら、ファイル名から都道府県が分かる。次のコードでは、それも一緒に持ち込んでいます。
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
  sheet_names <- excel_sheets(i)

  for (j in sheet_names) {
    vote_data_temp <- i %>%
      xlsx_cells() %>%
      filter(row > 3, sheet == j) %>%
      behead("left", "municipality") %>%
      behead("up", "name") %>%
      behead("up", "party") %>%
      mutate(
        district = j,
        file = basename(i)
      ) %>%
      rename(vote = content) %>%
      select(district, municipality, name, party, vote, file) %>%
      filter(!is.na(municipality))

    vote_data <- bind_rows(vote_data, vote_data_temp)
  }
}
```

外側のループがファイルを1つずつ、内側のループがそのファイルのシートを1つずつ処理します。ファイルが47個、シートが平均6枚なら、内側の処理は280回ほど回ることになります。

`file = basename(i)` で、どのファイルから来たデータなのかを記録しています。これがないと、あとで「この行はどこから来たんだ」が追えなくなります。

:::warn 全部同じ形だとは限らない
これだけ大量に処理すると、必ず例外が出てきます。比例代表のファイルは形が違う、一つだけ見出しが3段になっている、シートの中に凡例だけのものが混ざっている……。

対処のしかたはいくつかあります。[17章](17-loop.html)でやったように `tryCatch()` で囲んで、失敗したものを後から個別に処理する。あるいは形が同じファイルだけを先に処理して、残りは別のコードを書く（`excel_files[c(1:46, 58)]` のように番号を指定して選ぶ手もあります）。数が少なければ、例外のほうは手で入力してしまうのがいちばん早いこともあります。

どれを選んでもいいのですが、どのファイルを処理して、どのファイルを除いたのかは記録しておいて下さい。黙って除くと、あとで「全国のデータ」と言えなくなります。なぜ除いたのかも、メモに残しておきましょう。
:::

## 数え上げて確かめる

集まったら、必ず確かめます。

```r
# 選挙区の数
vote_data %>% distinct(district) %>% nrow()

# 候補者の数
vote_data %>% distinct(district, name) %>% nrow()

# 政党別の得票
vote_data %>%
  mutate(vote = as.double(vote)) %>%
  group_by(party) %>%
  summarize(gokei = sum(vote, na.rm = TRUE)) %>%
  arrange(desc(gokei))
```

`distinct()` は、重複を除いて種類を数えるための関数です。選挙区の数は289になっていますか。政党別の合計は、公表されている数字と合っていますか。

合わなければ、どこかを取りこぼしているということですから、合うまで直します。逆にいえば、合ったときには、公表されていない切り口——市区町村別、候補者別、党派別の組み合わせ——で自由に分析できる材料が手に入ったことになるわけです。

:::homework 宿題
一つのファイルにある複数のシートに同じ処理を連続的にほどこすコードを、for文を使ってつくりましょう。

作例は[付録C](a3-shukudai.html)にあります。
:::
