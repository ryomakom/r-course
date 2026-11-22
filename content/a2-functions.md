---
title: 付録B　関数早見表
nav: B 関数早見表
kicker: 付録
lead: 「あれ、何だっけ」の8割はここで済むように並べました。tidyverseを呼び出せば、大半はそのまま使えます。ほかのパッケージが要るものには、表の中で `library()` を書き添えました。
copy: ok
---

## よく使う組み合わせ

ふだんの仕事で出てくるデータ処理は、たいていこの並びでできています。詰まったときは、この順に手を動かしてみてください。

| やること | 使う関数 |
|---|---|
| 読み込む | `read_csv` `read_excel` |
| いらない列を捨てる、名前をつけかえる | `select` `rename` |
| 計算した列を足す | `mutate` |
| 条件に合う行だけ絞る、並べ替える | `filter` `arrange` |
| グループごとに集計する | `group_by` `summarize` |
| 別のデータとくっつける | `bind_rows` `left_join` |
| 縦長と横長を入れ替える | `pivot_longer` `pivot_wider` |
| グラフにする | `ggplot` ＋ `geom_*` |

実際には、これをパイプでつないで書きます。

```r
read_csv("data/人口データ2020.csv", skip = 8) %>%
  select(region = 地域, population = `A1101_総人口【人】`) %>%
  filter(population >= 100000) %>%
  arrange(desc(population))
```

このページの表では、関数を `%>%` の右側に書くときの形で載せています。

## 読み込む・書き出す

| 関数 | すること |
|---|---|
| `read_csv("path")` | csvを読み込む |
| `read_csv("path", skip = 8)` | 上の8行を飛ばして読む |
| `read_csv("path", locale = locale(encoding = "CP932"))` | Shift-JISのcsvを読む |
| `read_csv("path", col_types = cols(.default = "c"))` | 全部の列を文字列として読む |
| `read_excel("path", sheet = 2)` | Excelの2枚目のシートを読む（`library(readxl)`） |
| `excel_sheets("path")` | Excelのシート名の一覧（`library(readxl)`） |
| `parse_number(x)` | xからカンマや単位を除いて、数字だけ取り出す（「1,234人」→ 1234） |
| `write_excel_csv("path")` | pathにcsvとして書き出す。Excelで開いても化けない |
| `list.files("folder", full.names = TRUE)` | folderの中のファイル名を、フォルダ名つきで一覧にする |

## 中身を確かめる

| 関数 | すること |
|---|---|
| `view()` | 表形式で全部見る |
| `glimpse()` | 列名とデータ型を縦に並べて見る |
| `nrow()` / `ncol()` | 行数／列数 |
| `colnames()` | 列名の一覧 |
| `head(20)` | 最初の20行 |
| `count(year)` | year列の値ごとの行数 |
| `distinct(code)` | codeの値を、重複を除いて一覧にする |
| `summary()` | 列ごとの最小・最大・平均などをまとめて見る |

## 列を扱う

| 関数 | すること |
|---|---|
| `select(a, b, c)` | 列a、b、cだけ残す |
| `select(-a, -b)` | 列aとbを捨てる |
| `select(year, code, everything())` | yearとcodeを左に持ってきて、あとはそのまま |
| `rename(new = old)` | 列oldの名前をnewに変える |
| `mutate(new = a * 100 / b)` | aをbで割って100をかけた値（百分率）を、新しい列newにする |
| `mutate(across(everything(), as.character))` | 全部の列を文字列に変える |
| `relocate(code, .after = year)` | 列codeを、列yearのすぐ右に移す |

## 行を扱う

| 関数 | すること |
|---|---|
| `filter(x > 100)` | xが100より大きい行だけ残す |
| `filter(is.na(x))` | xが空っぽの行だけ |
| `filter(x %in% c("A", "B"))` | xがAかBの行だけ |
| `arrange(x)` | xの小さい順に並べる |
| `arrange(desc(x))` | xの大きい順に並べる |
| `slice_max(x, n = 10)` | xが大きい上位10行だけ取り出す |
| `distinct(code, .keep_all = TRUE)` | codeが重複する行を一つに絞る |

## 集計する

`n()` から下は、`summarize()` の丸括弧の中で使います。

| 関数 | すること |
|---|---|
| `group_by(prefecture)` | 都道府県ごとにグループ分けする |
| `summarize(gokei = sum(x))` | グループごとにxを合計して、gokeiという列にする |
| `ungroup()` | グループ分けを解除する |
| `n()` | そのグループの行数（＝件数） |
| `sum(x)` / `mean(x)` / `median(x)` | xの合計／平均／中央値 |
| `min(x)` / `max(x)` | xの最小／最大 |
| `sum(x, na.rm = TRUE)` | NAを除いてxを合計する（使うときは理由を確かめて） |

## くっつける

| 関数 | すること |
|---|---|
| `bind_rows(a, b)` | aの下にbを積み上げる |
| `left_join(b, by = join_by(code))` | codeが一致する行どうしで、bを右側にくっつける |
| `left_join(b, by = join_by(year, code))` | yearとcodeの両方が一致する行どうしでくっつける |
| `left_join(b, by = join_by(code == shikuchoson_code))` | 左のcodeとbのshikuchoson_codeが一致する行どうしでくっつける（列名が違うとき） |
| `anti_join(b, by = join_by(code))` | codeで突合して、bに相手が見つからなかった行だけを残す |
| `full_join()` / `inner_join()` | 両方全部残す／両方にあるものだけ残す。書き方は `left_join()` と同じ |

## 形を変える

| 関数 | すること |
|---|---|
| `pivot_wider(names_from = year, values_from = population)` | yearの値を列名に、populationの値を中身にして横長にする |
| `pivot_longer(cols = -c(region), names_to = "year", values_to = "population")` | region以外の列を縦に並べ直す。もとの列名はyear列に、中身はpopulation列に入る |
| `pivot_wider(names_from = c(category, year), values_from = value)` | categoryとyearを組み合わせた列名（「人口_2020」など）で横長にする。中身はvalue |

## 文字を扱う（stringr）

名前が `str_` で始まります。たいていは `mutate()` や `filter()` の丸括弧の中で使います（`mutate(ken = str_split_i(region, " ", 1))` のように）。

| 関数 | すること |
|---|---|
| `str_c("a", "b")` | 「a」と「b」をくっつけて「ab」にする |
| `str_sub(x, 1, 4)` | xの1文字目から4文字目を取り出す |
| `str_sub(x, -1, -1)` | xの最後の1文字を取り出す |
| `str_split_i(x, " ", 1)` | xを半角スペースで区切って、一つ目を取り出す |
| `str_detect(x, "市")` | xに「市」を含むかどうか（TRUE/FALSE） |
| `str_subset(x, "syozai")` | xのうち、「syozai」を含むものだけ残す |
| `str_remove_all(x, ",")` | xからカンマを全部取り除く |
| `str_replace_all(x, "ヶ", "ケ")` | xの「ヶ」を全部「ケ」に置き換える |
| `str_trim(x)` / `str_squish(x)` | xの前後の空白を取る／連続する空白もまとめる |
| `str_length(x)` | xの文字数を数える |
| `str_pad(x, 5, pad = "0")` | xが5桁になるまで頭に0を足す |

`str_pad()` は地味に重要です。市区町村コードをExcelから読むと、先頭の0が落ちて「1100」（本当は「01100」）になっていることがあります。突合の前にこれで桁をそろえます。

## 日付を扱う（lubridate）

日付だけは、`library(lubridate)` を書いたほうが安全です（tidyverseに含まれていますが、明示しておくと後で読みやすい）。

| 関数 | すること |
|---|---|
| `ymd("2025-04-09")` | 年月日の順に並んだ文字を日付に変える |
| `ymd("2025年4月9日")` | 日本語混じりでも読んでくれる |
| `ymd_hms("2025-04-09 13:05:00")` | 年月日と時刻の順に並んだ文字を、時刻つきの日付に変える |
| `year(x)` / `month(x)` / `day(x)` | 日付xから年／月／日を取り出す |
| `wday(x, label = TRUE)` | 日付xから曜日を取り出す。`label = TRUE` で「月」「火」のような名前に |
| `today()` / `now()` | 今日／いま |
| `floor_date(x, "month")` | 日付xを、その月の1日にそろえる（月ごとの集計に使う） |
| `x - y` | 日付xとyの差（何日か）を計算する |

日付として読み込めていれば、「月ごとの件数」「曜日ごとの件数」「発生から処分までの日数」といった集計ができるようになります。文字列のままではできません。事件や事故のデータを扱うなら、まず日付をきちんと日付型にするのが出発点です。

```r
jiken %>%
  mutate(hi = ymd(発生年月日)) %>%
  mutate(tsuki = floor_date(hi, "month")) %>%
  count(tsuki)
```

:::warn 和暦は自動では読めません
`ymd("令和7年4月9日")` は読めません。和暦は自分で西暦に直す必要があります。

```r
mutate(seireki = case_when(
  str_detect(x, "令和") ~ as.double(str_extract(x, "(?<=令和)\\d+")) + 2018,
  str_detect(x, "平成") ~ as.double(str_extract(x, "(?<=平成)\\d+")) + 1988,
  .default = NA))
```

（`str_extract()` は条件に合う部分を取り出す関数で、`(?<=令和)\\d+` は「『令和』の直後にある数字」という指定です。この書き方は正規表現といって、それだけで一冊の本になる世界なので、必要になったらAIに聞くのが早いです）

なお元年は「1年」と書かれていないことがあるので、そこも確かめてください。
:::

## 条件で振り分ける

どれも `mutate()` の丸括弧の中で使います。

| 関数 | すること |
|---|---|
| `if_else(条件, 合うとき, 合わないとき)` | 二つに振り分ける |
| `case_when(条件1 ~ 値1, 条件2 ~ 値2, .default = 値3)` | 三つ以上に振り分ける |
| `ifelse()` | `if_else()` の緩い版。型がずれていても黙って通す |

## グラフを描く（ggplot2）

| 関数 | すること |
|---|---|
| `ggplot()` | キャンバスを作る。ここから先は `%>%` ではなく `+` でつなぐ |
| `geom_line(aes(x = year, y = population))` | 横軸year、縦軸populationの折れ線 |
| `geom_col(aes(x = year, y = population))` | 横軸year、高さpopulationの棒（集計済みの数字を使う） |
| `geom_bar(aes(x = prefecture))` | prefectureごとに行数を数えて、棒の高さにする |
| `geom_point(aes(x = a, y = b))` | 横軸a、縦軸bの散布図 |
| `aes(color = x)` / `aes(fill = x)` | 列xの値によって、線の色／面の色を変える |
| `aes(size = x)` / `alpha = 0.3` | 列xの値によって点の大きさを変える／濃さを3割にする（半透明） |
| `position = "dodge"` / `"stack"` / `"fill"` | 横並び／積み上げ／100%積み上げ |
| `labs(title =, subtitle =, x =, y =, color =)` | タイトルや軸の名前 |
| `scale_x_log10()` | 横軸を対数目盛りにする |
| `facet_wrap(~ prefecture)` | 都道府県ごとに小さいグラフを並べる |
| `theme_minimal(base_family = "Yu Gothic")` | 飾りの少ない見た目にして、文字を游ゴシックにする |
| `ggsave("out.png", width = 8, height = 5, dpi = 200)` | out.pngという名前で、幅8×高さ5インチ、解像度200で保存する |

## 繰り返す

| 書き方 | すること |
|---|---|
| `for (i in x) { ... }` | xの中身を一つずつ取り出して繰り返す |
| `for (i in seq_along(x)) { ... }` | xの1番目から最後まで、番号iで繰り返す |
| `for (i in seq_len(nrow(df))) { ... }` | dfの行数だけ、番号iで繰り返す |
| `tibble()` | 空っぽの受け皿を作る |
| `bind_rows(kekka, temp)` | 受け皿kekkaの下にtempを足す |
| `tryCatch({ ... }, error = function(e) { ... })` | エラーが出ても止まらない |
| `Sys.sleep(2)` | 2秒待つ |
| `message("...")` | 途中経過を表示する |

## ウェブから取る

`read_html()` で読んだものを、上から順にパイプでつないでいきます。

| 関数 | すること |
|---|---|
| `read_html("url")` | ページのHTMLを読む（`library(rvest)`） |
| `html_element("div.class-name table")` | class-nameというクラスのdivの中にある表のうち、最初の一つを取り出す |
| `html_elements("div.class-name table")` | class-nameというクラスのdivの中にある表を、全部取り出す |
| `html_elements("a")` | リンクを全部取り出す |
| `html_attr("href")` | リンク先のURLを取り出す |
| `html_table()` | 表をtibbleに変える |
| `html_text2()` | 中の文字だけを取り出す |
| `url_absolute(x, "元のURL")` | xの相対パスを、元のURLを基準にして完全なURLに直す |
| `stop_for_status(res)` | サーバーの返事resが失敗（「見つかりません」など）ならエラーにする（`library(httr)`） |
| `unlink("path")` | pathのファイルを消す |
| `GET(url, write_disk("path", overwrite = TRUE))` | urlのファイルを落として、pathに保存する。同じ名前があれば上書き（`library(httr)`） |
| `basename(url)` | urlの末尾にあるファイル名だけ取り出す |

## 神エクセルを解体する

`xlsx_cells()` で読んだものを、パイプでつないで `behead()` に渡していきます。

| 関数 | すること |
|---|---|
| `xlsx_cells("path")` | セルを1個ずつバラして読む（`library(tidyxl)`） |
| `behead("up", "name")` | 上のラベルを剥がしてname列にする（`library(unpivotr)`） |
| `behead("up-left", "name")` | 上にあって左に寄ったラベルを剥がして、name列にする |
| `behead("left-up", "area")` | 左にあって上に寄ったラベル（グループの先頭の行にだけ書かれたラベル）を剥がして、area列にする |
| `behead("left", "name")` | 左のラベルを剥がして、name列にする |
