---
title: 付録B　関数早見表
nav: B 関数早見表
kicker: 付録
lead: 「あれ、何だっけ」の8割はここで済むように並べました。tidyverseを呼び出していれば、日付以外は全部そのまま使えます。
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

## 読み込む・書き出す

| 関数 | すること |
|---|---|
| `read_csv("path")` | csvを読み込む |
| `read_csv("path", skip = 8)` | 上の8行を飛ばして読む |
| `read_csv("path", locale = locale(encoding = "CP932"))` | Shift-JISのcsvを読む |
| `read_csv("path", col_types = cols(.default = "c"))` | 全部の列を文字列として読む |
| `read_excel("path", sheet = 2)` | Excelの2枚目のシートを読む（`library(readxl)`） |
| `excel_sheets("path")` | Excelのシート名の一覧 |
| `parse_number(x)` | カンマや単位を無視して数字だけ取り出す |
| `write_excel_csv(df, "path")` | csvに書き出す。Excelで開いても化けない |
| `list.files("folder", full.names = TRUE)` | フォルダの中のファイル名一覧 |

## 中身を確かめる

| 関数 | すること |
|---|---|
| `view(df)` | 表形式で全部見る |
| `glimpse(df)` | 列名とデータ型を縦に並べて見る |
| `nrow(df)` / `ncol(df)` | 行数／列数 |
| `colnames(df)` | 列名の一覧 |
| `head(df, 20)` | 最初の20行 |
| `count(df, year)` | year列の値ごとの行数 |
| `distinct(df, code)` | 重複を除く |
| `summary(df)` | 列ごとの最小・最大・平均などをまとめて見る |

## 列を扱う

| 関数 | すること |
|---|---|
| `select(a, b, c)` | 列a、b、cだけ残す |
| `select(-a, -b)` | 列aとbを捨てる |
| `select(year, code, everything())` | yearとcodeを左に持ってきて、あとはそのまま |
| `rename(new = old)` | 列名を変える |
| `mutate(new = a * 100 / b)` | 新しい列を作る |
| `mutate(across(everything(), as.character))` | 全部の列を文字列に変える |
| `relocate(code, .after = year)` | 列の順番を変える |

## 行を扱う

| 関数 | すること |
|---|---|
| `filter(x > 100)` | 条件に合う行だけ残す |
| `filter(is.na(x))` | xが空っぽの行だけ |
| `filter(x %in% c("A", "B"))` | xがAかBの行だけ |
| `arrange(x)` | xの小さい順に並べる |
| `arrange(desc(x))` | xの大きい順に並べる |
| `slice_max(x, n = 10)` | xが大きい上位10行だけ取り出す |
| `distinct(df, code, .keep_all = TRUE)` | codeが重複する行を1つに絞る |

## 集計する

| 関数 | すること |
|---|---|
| `group_by(prefecture)` | 都道府県ごとにグループ分けする |
| `summarize(gokei = sum(x))` | グループごとに合計する |
| `ungroup()` | グループ分けを解除する |
| `n()` | そのグループの行数（＝件数） |
| `sum(x)` / `mean(x)` / `median(x)` | 合計／平均／中央値 |
| `min(x)` / `max(x)` | 最小／最大 |
| `sum(x, na.rm = TRUE)` | NAを除いて合計する（使うときは理由を確かめて） |

## くっつける

| 関数 | すること |
|---|---|
| `bind_rows(a, b)` | 縦に積み上げる |
| `left_join(b, by = join_by(code))` | codeをとっかかりに横にくっつける |
| `left_join(b, by = join_by(year, code))` | 2つの列で突合する |
| `left_join(b, by = join_by(code == shikuchoson_code))` | 名前が違う列同士で突合する |
| `anti_join(b, by = join_by(code))` | 突合できなかった行を探す |
| `full_join()` / `inner_join()` | 両方全部残す／両方にあるものだけ残す |

## 形を変える

| 関数 | すること |
|---|---|
| `pivot_wider(names_from = year, values_from = population)` | 横長にする |
| `pivot_longer(cols = -c(region), names_to = "year", values_to = "population")` | 縦長にする |
| `pivot_wider(names_from = c(category, year), values_from = value)` | 2つの列を組み合わせた列名で横長にする |

## 文字を扱う（stringr）

名前が `str_` で始まります。

| 関数 | すること |
|---|---|
| `str_c("a", "b")` | くっつける |
| `str_sub(x, 1, 4)` | 1文字目から4文字目を取り出す |
| `str_sub(x, -1, -1)` | 最後の1文字を取り出す |
| `str_split_i(x, " ", 1)` | 半角スペースで区切って1つ目を取り出す |
| `str_detect(x, "市")` | 「市」を含むかどうか（TRUE/FALSE） |
| `str_subset(x, "syozai")` | 「syozai」を含むものだけに絞る |
| `str_remove_all(x, ",")` | カンマを全部取り除く |
| `str_replace_all(x, "ヶ", "ケ")` | 置き換える |
| `str_trim(x)` / `str_squish(x)` | 前後の空白を取る／連続する空白もまとめる |
| `str_length(x)` | 文字数を数える |
| `str_pad(x, 5, pad = "0")` | 5桁になるまで頭に0を足す |

`str_pad()` は地味に重要です。市区町村コードをExcelから読むと、先頭の0が落ちて「1100」（本当は「01100」）になっていることがあります。突合の前にこれで桁をそろえます。

## 日付を扱う（lubridate）

日付だけは、`library(lubridate)` を書いたほうが安全です（tidyverseに含まれていますが、明示しておくと後で読みやすい）。

| 関数 | すること |
|---|---|
| `ymd("2025-04-09")` | 年月日の順に並んだ文字を日付に変える |
| `ymd("2025年4月9日")` | 日本語混じりでも読んでくれる |
| `ymd_hms("2025-04-09 13:05:00")` | 時刻つき |
| `year(x)` / `month(x)` / `day(x)` | 年／月／日を取り出す |
| `wday(x, label = TRUE)` | 曜日を取り出す |
| `today()` / `now()` | 今日／いま |
| `floor_date(x, "month")` | その月の1日にそろえる（月ごとの集計に使う） |
| `x - y` | 日付の差（何日か）を計算する |

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

| 関数 | すること |
|---|---|
| `ifelse(条件, 合うとき, 合わないとき)` | 2つに振り分ける |
| `case_when(条件1 ~ 値1, 条件2 ~ 値2, .default = 値3)` | 3つ以上に振り分ける |
| `if_else()` | ifelseの厳しい版（型のずれを見つけてくれる） |

## グラフを描く（ggplot2）

| 関数 | すること |
|---|---|
| `ggplot()` | キャンバスを作る。ここから先は `+` でつなぐ |
| `geom_line(aes(x = year, y = population))` | 折れ線 |
| `geom_col(aes(x = year, y = population))` | 棒（集計済みの数字を使う） |
| `geom_bar(aes(x = prefecture))` | 棒（行数を数えて高さにする） |
| `geom_point(aes(x = a, y = b))` | 散布図 |
| `aes(color = x)` / `aes(fill = x)` | 線の色／面の色を列によって変える |
| `aes(size = x)` / `alpha = 0.3` | 点の大きさを変える／半透明にする |
| `position = "dodge"` / `"stack"` / `"fill"` | 横並び／積み上げ／100%積み上げ |
| `labs(title =, subtitle =, x =, y =, color =)` | タイトルや軸の名前 |
| `scale_x_log10()` | 横軸を対数目盛りにする |
| `facet_wrap(~ prefecture)` | 都道府県ごとに小さいグラフを並べる |
| `theme_minimal(base_family = "Yu Gothic")` | 見た目を変える。日本語フォントの指定もここ |
| `ggsave("out.png", width = 8, height = 5, dpi = 200)` | 画像として保存 |

## 繰り返す

| 書き方 | すること |
|---|---|
| `for (i in x) { ... }` | xの中身を1つずつ取り出して繰り返す |
| `for (i in seq_along(x)) { ... }` | 番号で繰り返す |
| `for (i in seq_len(nrow(df))) { ... }` | 表の行数だけ繰り返す |
| `tibble()` | 空っぽの受け皿を作る |
| `bind_rows(kekka, temp)` | 受け皿に足す |
| `tryCatch({ ... }, error = function(e) { ... })` | エラーが出ても止まらない |
| `Sys.sleep(2)` | 2秒待つ |
| `message("...")` | 途中経過を表示する |

## ウェブから取る

| 関数 | すること |
|---|---|
| `read_html("url")` | ページのHTMLを読む（`library(rvest)`） |
| `html_nodes("div.class-name")` | 名札で場所を指定する |
| `html_elements("a")` | リンクを全部取り出す |
| `html_attr("href")` | リンク先のURLを取り出す |
| `html_table()` | 表をtibbleに変える |
| `html_text2()` | 中の文字だけを取り出す |
| `url_absolute(x, "元のURL")` | 相対パスを完全なURLに直す |
| `GET(url, write_disk("path", overwrite = TRUE))` | ファイルを落とす（`library(httr)`） |
| `basename(url)` | URLの末尾のファイル名だけ取り出す |

## 神エクセルを解体する

| 関数 | すること |
|---|---|
| `xlsx_cells("path")` | セルを1個ずつバラして読む（`library(tidyxl)`） |
| `behead("up", "name")` | 上の見出しを剥がしてname列にする（`library(unpivotr)`） |
| `behead("up-left", "name")` | 上にあって左に寄った見出しを剥がす |
| `behead("left", "name")` | 左の見出しを剥がす |
