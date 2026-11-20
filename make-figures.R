# -------------------------------------------------------------------------
# 「記者のためのR講座」に載せる実行結果とグラフを作り直すためのスクリプト。
#
# outputs/ に画面の表示（テキスト）、images/ にグラフ（png）を書き出します。
# サイトのほうは、この2つを読んで表示しているだけなので、
# データを新しくしたときは、これを実行し直してから python build.py すればOK。
#
# 使い方（RStudioで開いて全部実行、またはターミナルで）
#   Rscript make-figures.R
# -------------------------------------------------------------------------

suppressMessages(library(tidyverse))
suppressMessages(library(readxl))

# データの置き場所。自分の環境に合わせて書き換えてください
DATA <- "C:/Users/1030202/OneDrive - 株式会社朝日新聞社/Rデータ/R_lectures/data/"

# 書き出し先
OUT_TXT <- "outputs"
OUT_IMG <- "images"
dir.create(OUT_TXT, showWarnings = FALSE)
dir.create(OUT_IMG, showWarnings = FALSE)

# 画面の幅をそろえる（サイトの表示くずれを防ぐため、狭めにしておく）
options(width = 76, pillar.max_dec_width = 12)

# 日本語のフォント。Macなら "Hiragino Sans" など
FONT <- "Yu Gothic"
theme_set(theme_gray(base_family = FONT, base_size = 13))

# ---- 便利な関数 ---------------------------------------------------------

# 表示した内容をそのままテキストファイルに保存する
save_out <- function(name, expr, n = 12) {
  # tibble以外（数値や文字のかたまり）は n を渡すと怒られるので分ける
  txt <- if (is.data.frame(expr)) capture.output(print(expr, n = n)) else
    capture.output(print(expr))
  writeLines(txt, file.path(OUT_TXT, paste0(name, ".txt")), useBytes = TRUE)
  cat("○ outputs/", name, ".txt\n", sep = "")
}

# グラフを保存する
save_fig <- function(name, plot, w = 7.2, h = 4.2) {
  ggsave(file.path(OUT_IMG, paste0(name, ".png")), plot,
         width = w, height = h, dpi = 150, bg = "white")
  cat("○ images/", name, ".png\n", sep = "")
}

# =========================================================================
# 第1部　データを読む・加工する
# =========================================================================

df2020 <- read_csv(paste0(DATA, "人口データ2020.csv"), skip = 8,
                   show_col_types = FALSE, name_repair = "unique_quiet")

# 04章　読み込んだ直後のtibble
save_out("04-df2020", df2020 %>% select(1:6), n = 6)

# 05章　select と rename をかけたあと（データ型が見える）
df2020_simple <- df2020 %>%
  select(地域, `A1101_総人口【人】`, `A1303_65歳以上人口【人】`) %>%
  rename(region = 地域,
         population = `A1101_総人口【人】`,
         population_over65 = `A1303_65歳以上人口【人】`)

save_out("05-simple", df2020_simple, n = 6)

# 05章　高齢化率が低い順・高い順
save_out("05-arrange-asc",
         df2020_simple %>%
           mutate(rate_aged = population_over65 * 100 / population) %>%
           arrange(rate_aged), n = 10)

save_out("05-arrange-desc",
         df2020_simple %>%
           mutate(rate_aged = population_over65 * 100 / population) %>%
           arrange(desc(rate_aged)), n = 10)

# 06章　文字を分けたあと
df2020_split <- df2020_simple %>%
  mutate(rate_aged = population_over65 * 100 / population) %>%
  mutate(prefecture = str_split_i(region, " ", 1),
         municipality = str_split_i(region, " ", 2),
         ward = str_split_i(region, " ", 3))

save_out("06-split",
         df2020_split %>% select(prefecture, municipality, ward, rate_aged), n = 8)

# 06章　東京都だけ、高齢化率の高い順
save_out("06-tokyo",
         df2020_split %>%
           filter(prefecture == "東京都") %>%
           arrange(desc(rate_aged)) %>%
           select(municipality, population, rate_aged), n = 8)

# 07章　都道府県別に集計したもの
df2020_pref <- df2020_split %>%
  filter(is.na(ward)) %>%
  group_by(prefecture) %>%
  summarize(pref_population = sum(population),
            pref_population_over65 = sum(population_over65))

save_out("07-pref", df2020_pref, n = 6)

# 07章　答え合わせ（全国の総人口）
writeLines(capture.output(
  df2020_pref %>% summarize(zenkoku = sum(pref_population)) %>% print()
), file.path(OUT_TXT, "07-zenkoku.txt"), useBytes = TRUE)
cat("○ outputs/07-zenkoku.txt\n")

# 22章　AIが書いたかもしれない、二重計上してしまうコード（政令市の区を除いていない）
save_out("21-ai-wrong",
         df2020 %>%
           mutate(prefecture = str_split_i(地域, " ", 1)) %>%
           group_by(prefecture) %>%
           summarize(population = sum(`A1101_総人口【人】`)) %>%
           arrange(desc(population)), n = 5)

# 08章　2015年のファイルを skip=8 で読むと列名が壊れる
bad2015 <- suppressWarnings(
  read_csv(paste0(DATA, "人口データ2015.csv"), skip = 8,
           show_col_types = FALSE, name_repair = "unique_quiet"))
save_out("08-bad-skip", bad2015, n = 4)

# 08章　文字コードのエラー
err <- tryCatch(
  read_csv(paste0(DATA, "人口データ2010.csv"), skip = 5, show_col_types = FALSE),
  error = function(e) conditionMessage(e),
  warning = function(w) conditionMessage(w))
writeLines(as.character(err), file.path(OUT_TXT, "08-encoding-error.txt"),
           useBytes = TRUE)
cat("○ outputs/08-encoding-error.txt\n")

# 08章　3年分（2020・2015・2010）をくっつける
df3 <- bind_rows(
  read_csv(paste0(DATA, "人口データ2020.csv"), skip = 8,
           col_types = cols(.default = "c"), name_repair = "unique_quiet"),
  read_csv(paste0(DATA, "人口データ2015.csv"), skip = 2,
           col_types = cols(.default = "c"), name_repair = "unique_quiet"),
  read_csv(paste0(DATA, "人口データ2010.csv"), skip = 5,
           locale = locale(encoding = "CP932"),
           col_types = cols(.default = "c"), name_repair = "unique_quiet"))

save_out("08-count-year", df3 %>% count(調査年), n = 6)

# 10章　Excelの2年分も足して5年分にする
df <- bind_rows(
  read_csv(paste0(DATA, "人口データ2020.csv"), skip = 8,
           col_types = cols(.default = "c"), name_repair = "unique_quiet"),
  read_csv(paste0(DATA, "人口データ2015.csv"), skip = 2,
           col_types = cols(.default = "c"), name_repair = "unique_quiet"),
  read_csv(paste0(DATA, "人口データ2010.csv"), skip = 5,
           locale = locale(encoding = "CP932"),
           col_types = cols(.default = "c"), name_repair = "unique_quiet"),
  read_excel(paste0(DATA, "人口データ2005.xls"), skip = 8,
             col_types = "text", .name_repair = "unique_quiet"),
  read_excel(paste0(DATA, "人口データ2000.xlsx"), skip = 8,
             col_types = "text", .name_repair = "unique_quiet"))

save_out("10-count-year", df %>% count(調査年), n = 6)

# 09章　縦長と横長（この時点では3年分）
df_simple <- df3 %>%
  select(調査年, 地域, `A1101_総人口【人】`) %>%
  rename(year = 調査年, region = 地域, population = `A1101_総人口【人】`) %>%
  mutate(population = as.double(population))

save_out("09-long", df_simple, n = 6)

df_simple_wide <- df_simple %>%
  pivot_wider(names_from = year, values_from = population)

save_out("09-wide", df_simple_wide %>%
           select(region, `2020年度`, `2015年度`, `2010年度`), n = 6)

save_out("09-change",
         df_simple_wide %>%
           mutate(population_increase_rate = (`2020年度` / `2010年度` - 1) * 100) %>%
           select(region, `2010年度`, `2020年度`, population_increase_rate), n = 6)

# 10章　データ型が合わなくてbind_rowsが失敗する（本文のコードと同じ5年分で合体させる）
type_err <- tryCatch(
  bind_rows(
    df2020,
    read_csv(paste0(DATA, "人口データ2015.csv"), skip = 2,
             show_col_types = FALSE, name_repair = "unique_quiet"),
    read_csv(paste0(DATA, "人口データ2010.csv"), skip = 5,
             locale = locale(encoding = "CP932"),
             show_col_types = FALSE, name_repair = "unique_quiet"),
    read_excel(paste0(DATA, "人口データ2005.xls"), skip = 8,
               .name_repair = "unique_quiet"),
    read_excel(paste0(DATA, "人口データ2000.xlsx"), skip = 8,
               .name_repair = "unique_quiet")),
  error = function(e) conditionMessage(e))
writeLines(as.character(type_err), file.path(OUT_TXT, "10-type-error.txt"),
           useBytes = TRUE)
cat("○ outputs/10-type-error.txt\n")

# 10章　tibbleを表示すると、列名の下にデータ型が出る
save_out("10-df2020", df2020, n = 6)
save_out("10-df2005",
         read_excel(paste0(DATA, "人口データ2005.xls"), skip = 8,
                    .name_repair = "unique_quiet"), n = 6)
# 人口の列（表示のいちばん右の列）のデータ型だけに色をつける。«» で囲むとサイトで色がつく
mark_last_type <- function(name, type) {
  f <- file.path(OUT_TXT, paste0(name, ".txt"))
  txt <- read_lines(f)
  txt[3] <- sub(paste0("(.*)", type), paste0("\\1«", type, "»"), txt[3])   # 3行目が型の行
  writeLines(txt, f, useBytes = TRUE)
}
mark_last_type("10-df2020", "<dbl>")
mark_last_type("10-df2005", "<chr>")

# 10章　文字列を数値に戻すとNAが生まれる
save_out("10-na-check",
         df %>%
           rename(year = 調査年, population = `A1101_総人口【人】`) %>%
           mutate(population = suppressWarnings(as.double(population))) %>%
           filter(is.na(population)) %>%
           count(year), n = 6)

# 11章　名前で突合すると漏れる
working2020 <- read_csv(paste0(DATA, "労働人口データ2020.csv"), skip = 8,
                        show_col_types = FALSE, name_repair = "unique_quiet") %>%
  rename(code = `地域 コード`,
         region = 地域,
         primary = `F2201_第1次産業就業者数【人】`) %>%
  select(code, region, primary)

# 本文と同じく、10章の5年分（year, code, region, population）から2020年度だけを使う
df_simple11 <- df %>%
  rename(year = 調査年, code = `地域 コード`, region = 地域,
         population = `A1101_総人口【人】`) %>%
  select(year, code, region, population)

save_out("11-anti-join",
         df_simple11 %>%
           filter(year == "2020年度") %>%
           anti_join(working2020, by = join_by(region)), n = Inf)

# =========================================================================
# 第2部　データを見る
# =========================================================================

tokyo <- read_csv(paste0(DATA, "東京都の人口.csv"), show_col_types = FALSE)
five_pref <- read_csv(paste0(DATA, "主な都道府県の人口.csv"), show_col_types = FALSE)
all_pref <- read_csv(paste0(DATA, "都道府県別人口.csv"), show_col_types = FALSE)
all_municipality <- read_csv(paste0(DATA, "市町村別人口.csv"), show_col_types = FALSE)

# 12章　まっさらなキャンバス
save_fig("12-canvas", tokyo %>% ggplot())

# 12章　折れ線グラフ
save_fig("12-line-tokyo",
         tokyo %>% ggplot() + geom_line(aes(x = year, y = population)))

save_fig("12-line-ng",
         five_pref %>% ggplot() + geom_line(aes(x = year, y = population)))

save_fig("12-line-group",
         five_pref %>% ggplot() +
           geom_line(aes(x = year, y = population, group = prefecture)))

save_fig("12-line-color",
         five_pref %>% ggplot() +
           geom_line(aes(x = year, y = population, color = prefecture)))

save_fig("12-line-rate",
         five_pref %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() +
           geom_line(aes(x = year, y = rate_under15, color = prefecture)))

# 13章　棒グラフ
save_fig("13-col-tokyo",
         tokyo %>% ggplot() + geom_col(aes(x = year, y = population)))

tokyo_long <- tokyo %>%
  select(-population) %>%
  pivot_longer(cols = -c(year, prefecture),
               names_to = "category", values_to = "value")

save_fig("13-col-stack",
         tokyo_long %>% ggplot() +
           geom_col(aes(x = year, y = value, fill = category)))

save_fig("13-col-dodge",
         tokyo_long %>% ggplot() +
           geom_col(aes(x = year, y = value, fill = category),
                    position = "dodge"))

save_fig("13-col-five",
         five_pref %>% ggplot() +
           geom_col(aes(x = year, y = population_under15, fill = prefecture),
                    position = "dodge"))

# 14章　散布図
save_fig("14-point-plain",
         all_pref %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() + geom_point(aes(x = year, y = rate_under15)))

save_fig("14-point-color47",
         all_pref %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() +
           geom_point(aes(x = year, y = rate_under15, color = prefecture)))

save_fig("14-point-size",
         all_pref %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() +
           geom_point(aes(x = year, y = rate_under15, size = population)))

save_fig("14-point-alpha",
         all_pref %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() +
           geom_point(aes(x = year, y = rate_under15, size = population),
                      alpha = 0.1))

save_fig("14-point-municipality",
         all_municipality %>%
           mutate(rate_under15 = population_under15 * 100 / population) %>%
           ggplot() +
           geom_point(aes(x = year, y = rate_under15, size = population),
                      alpha = 0.1))

all_municipality_change <- all_municipality %>%
  filter(year %in% c(2020, 2000)) %>%
  select(year, code, prefecture, municipality, population_under15, population) %>%
  pivot_longer(cols = c(population_under15, population),
               names_to = "category", values_to = "value") %>%
  pivot_wider(names_from = c(category, year), values_from = value) %>%
  mutate(change_under15 =
           (population_under15_2020 * 100 / population_under15_2000) - 100)

save_fig("14-change-plain",
         all_municipality_change %>% ggplot() +
           geom_point(aes(x = population_2020, y = change_under15)))

save_fig("14-change-log",
         all_municipality_change %>% ggplot() +
           geom_point(aes(x = population_2020, y = change_under15)) +
           scale_x_log10())

save_fig("14-change-tokyo",
         all_municipality_change %>%
           mutate(area = ifelse(prefecture == "東京都", "東京都の自治体", "その他")) %>%
           ggplot() +
           geom_point(aes(x = population_2020, y = change_under15, color = area),
                      alpha = .3) +
           scale_x_log10())

save_fig("14-change-labs",
         all_municipality_change %>%
           mutate(area = ifelse(prefecture == "東京都", "東京都の自治体", "その他")) %>%
           ggplot() +
           geom_point(aes(x = population_2020, y = change_under15, color = area),
                      alpha = .3) +
           scale_x_log10() +
           labs(title = "全国の市町村における子どもの数の変化",
                subtitle = "2000年から2020年にかけての増減を％で表示。出典は国勢調査",
                x = "2020年の人口",
                y = "15歳未満人口の変化率（％）",
                color = "地域"),
         h = 4.6)

# 15章　テーマ違い（見た目の比較用）
save_fig("15-theme-gray",
         five_pref %>% ggplot() +
           geom_line(aes(x = year, y = population, color = prefecture)) +
           theme_gray(base_family = FONT) +
           labs(title = "theme_gray（初期設定）", x = "年", y = "人口",
                color = "都府県"))

save_fig("15-theme-minimal",
         five_pref %>% ggplot() +
           geom_line(aes(x = year, y = population, color = prefecture)) +
           theme_minimal(base_family = FONT) +
           labs(title = "theme_minimal", x = "年", y = "人口", color = "都府県"))

# 15章　ggplotly() で作った、マウスで触れるグラフ（ページに埋め込むhtml）
if (requireNamespace("plotly", quietly = TRUE)) {
  touchable <- plotly::ggplotly(
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
  # plotly.js を最小限の部品だけにして、ファイルを小さくする
  touchable <- tryCatch(plotly::partial_bundle(touchable), error = function(e) touchable)
  htmlwidgets::saveWidget(touchable, file.path(normalizePath(OUT_IMG), "15-plotly.html"),
                          selfcontained = TRUE, title = "ggplotlyで作ったグラフ")
  unlink(file.path(OUT_IMG, "15-plotly_files"), recursive = TRUE)
  cat("○ images/15-plotly.html\n")
}

# 13章　宿題の作例（宮城県）
save_fig("13-shukudai-miyagi",
         five_pref %>%
           filter(prefecture == "宮城県") %>%
           select(-population) %>%
           pivot_longer(cols = -c(year, prefecture),
                        names_to = "category", values_to = "value") %>%
           ggplot() +
           geom_col(aes(year, value, fill = category)) +
           labs(title = "宮城県の年齢層別人口の推移",
                x = "年", y = "人口", fill = "年齢層"))

# =========================================================================
# 付録C　宿題の作例
# =========================================================================

# 宿題1　若者率のランキング
save_out("a3-young-desc",
         df2020 %>%
           select(地域, `A1101_総人口【人】`, `A1301_15歳未満人口【人】`) %>%
           rename(region = 地域,
                  population = `A1101_総人口【人】`,
                  population_under15 = `A1301_15歳未満人口【人】`) %>%
           mutate(rate_young = population_under15 * 100 / population) %>%
           arrange(desc(rate_young)), n = 10)

# 宿題2　都道府県別の高齢化率ランキング
save_out("a3-pref-aged",
         df2020_pref %>%
           mutate(rate_aged = pref_population_over65 * 100 / pref_population) %>%
           arrange(desc(rate_aged)), n = 10)

# 宿題5　複数年の労働人口データ。同じ統計でもファイルによって型が違う
work_all_raw <- read_csv(paste0(DATA, "労働人口データ.csv"), skip = 8,
                         show_col_types = FALSE, name_repair = "unique_quiet") %>%
  rename(year = 調査年,
         code = `地域 コード`,
         primary = `F2201_第1次産業就業者数【人】`,
         secondary = `F2211_第2次産業就業者数【人】`,
         tertiary = `F2221_第3次産業就業者数【人】`)

save_out("a3-work-chr", work_all_raw %>% select(year, code, primary, secondary), n = 4)

# 数字ではない中身は何なのか
save_out("a3-work-nonnumeric",
         work_all_raw %>%
           filter(is.na(suppressWarnings(parse_number(primary)))) %>%
           count(year, primary), n = 6)

# 直した読み込み
work_all <- work_all_raw %>%
  select(year, code, primary, secondary, tertiary) %>%
  mutate(year = as.double(str_sub(year, 1, 4)),
         across(c(primary, secondary, tertiary),
                function(x) suppressWarnings(parse_number(x))))

df_simple5 <- df %>%
  rename(year = 調査年, code = `地域 コード`, region = 地域,
         population = `A1101_総人口【人】`) %>%
  select(year, code, region, population) %>%
  mutate(population = suppressWarnings(as.double(population)),
         year = as.double(str_sub(year, 1, 4)))

save_out("a3-join",
         df_simple5 %>%
           left_join(work_all, by = join_by(year, code)), n = 5)

save_out("a3-join-check",
         df_simple5 %>%
           left_join(work_all, by = join_by(year, code)) %>%
           filter(is.na(primary)) %>%
           count(year), n = 6)

# =========================================================================
# 実践編　16章　ガソリン価格を分析する
# =========================================================================

# 資源エネルギー庁の2ファイル（小売価格の週次、卸売価格の月次）は files/ に
# 置いて読者に配っているので、そこから読みます。
#   取得元 https://www.enecho.meti.go.jp/statistics/petroleum_and_lpgas/pl007/results.html
# 石油連盟の販売量のファイルは配っていないので、手元の置き場所から読みます。
# ほかの人が使うときは、この行を自分で落としたファイルの場所に書き換えてください。
#   取得元 https://www.paj.gr.jp/statis/statis （「07. 都道府県別販売実績」）
PAJ_FILE <- "C:/Users/1030202/OneDrive - 株式会社朝日新聞社/Rデータ/oil_cartel/data/paj-07_20261102.xls"

suppressMessages(library(lubridate))

# 1列目（注記が入った列）が論理型と判定され、最後の行の注記で警告が出るが、
# その列はすぐに捨てるので、警告は黙らせておく
gas <- suppressWarnings(
  read_excel("files/260902s5.xlsx", sheet = "レギュラー",
             .name_repair = "unique_quiet")) %>%
  select(-1) %>%
  rename(date = 調査日) %>%
  pivot_longer(cols = -date, names_to = "pref", values_to = "price") %>%
  filter(!is.na(price)) %>%
  mutate(date = as.Date(date),
         pref = str_remove_all(pref, "[ 　]")) %>%
  filter(!pref %in% c("（うちガソリン税）", "消費税率")) %>%
  mutate(pref = if_else(pref == "北海道局", "北海道", pref),
         pref = if_else(pref == "沖縄局", "沖縄", pref)) %>%
  filter(!str_detect(pref, "局"))

save_out("16-gas-clean", gas, n = 6)
save_out("16-gas-pref", gas %>% distinct(pref), n = 6)

# 2025年1月の平均価格のランキング
save_out("16-gas-rank",
         gas %>%
           mutate(year = year(date), month = month(date)) %>%
           filter(year == 2025, month == 1) %>%
           group_by(pref) %>%
           summarize(price = mean(price)) %>%
           arrange(desc(price)), n = 10)

# 折れ線グラフ（本文のコードと同じ）
gas2022 <- gas %>% filter(date >= "2022-01-01")

g_line <- gas2022 %>%
  ggplot() +
  geom_line(aes(x = date, y = price, group = pref),
            color = "grey80", linewidth = 0.3) +
  geom_line(data = gas2022 %>% filter(pref %in% c("長野", "高知", "全国")),
            aes(x = date, y = price, color = pref),
            linewidth = 1) +
  scale_color_manual(values = c("長野" = "blue", "高知" = "red", "全国" = "black"))

save_fig("16-gasoline-line", g_line)

# 章の冒頭の、スクロールで進むグラフ（assets/gas-anim.js）が使うデータ（assets/gas-data.js）。
# 2019年からの毎週の価格（47都道府県と全国）を、10倍した整数にして、都道府県ごとに1本の文字列にまとめる。
# 日付は、最初の調査日から何日目かで持つ（調査日は祝日などで1日ずれる週があるため、7日ごとと決め打ちしない）
gas_js <- gas %>%
  filter(date >= "2019-01-01") %>%
  mutate(v = round(price * 10))
gas_js_dates <- sort(unique(gas_js$date))
gas_js_series <- map_chr(unique(gas_js$pref), function(p) {   # 全国、北海道、青森……（シートの列の順）
  x <- gas_js %>% filter(pref == p) %>% arrange(date)
  stopifnot(identical(x$date, gas_js_dates))                  # どの週も欠けていないこと
  sprintf('    "%s": "%s"', p, paste(x$v, collapse = ","))
})
writeLines(enc2utf8(c(
  "// make-figures.R（16章）が書き出したデータ。手で書き換えないでください",
  "// 資源エネルギー庁「石油製品価格調査」のレギュラーガソリンの店頭価格（1リットルあたり、円）を10倍した整数。毎週の調査",
  "window.GAS_DATA = {",
  sprintf('  start: "%s",', format(gas_js_dates[1])),
  sprintf('  days: "%s",', paste(as.integer(gas_js_dates - gas_js_dates[1]), collapse = ",")),
  "  prices: {",
  paste(gas_js_series, collapse = ",\n"),
  "  }",
  "};")), "assets/gas-data.js", useBytes = TRUE)
cat("○ assets/gas-data.js (", round(file.size("assets/gas-data.js") / 1024), "KB )\n")

# 章の冒頭のスクロールで進むグラフの代わりに、印刷やスクリプトが動かないときに出す図。
# 2019年から。高知の値動きが止まった二つの期間に色を敷き、信濃毎日新聞の報道（2025年2月）に線を引く
gas2019 <- gas %>% filter(date >= "2019-01-01")
flat <- tibble(start = as.Date(c("2022-08-01", "2023-10-23")),
               end = as.Date(c("2023-07-24", "2024-07-29")))
save_fig("16-gasoline-flat",
         gas2019 %>%
           ggplot() +
           geom_rect(data = flat,
                     aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
                     fill = "#f6c6d6", alpha = 0.6) +
           geom_vline(xintercept = as.Date("2025-02-01"),
                      linetype = "dashed", color = "grey35") +
           annotate("text", x = as.Date("2025-02-01"), y = 222,
                    label = "信濃毎日新聞の報道\n（2025年2月）",
                    hjust = 1.05, size = 3, lineheight = 0.9, family = FONT) +
           geom_line(aes(x = date, y = price, group = pref),
                     color = "grey80", linewidth = 0.3) +
           geom_line(data = gas2019 %>% filter(pref %in% c("全国", "高知")),
                     aes(x = date, y = price, color = pref),
                     linewidth = 0.9) +
           scale_color_manual(values = c("高知" = "#d23a6e", "全国" = "black"),
                              labels = c("高知" = "高知", "全国" = "全国平均")) +
           labs(title = "レギュラーガソリンの店頭価格（1リットルあたり）",
                subtitle = "灰色の線はほかの46都道府県。色を塗った期間は、高知の値動きが止まっていた",
                x = NULL, y = "円", color = NULL),
         h = 4.6)

# 値動きの幅を都道府県ごとに比べる（二つの期間）
save_out("16-gas-range1",
         gas %>%
           filter(date >= "2022-08-01", date <= "2023-07-24") %>%
           group_by(pref) %>%
           summarize(weeks = n(),
                     min = min(price),
                     max = max(price)) %>%
           mutate(range = max - min) %>%
           arrange(range), n = 5)

save_out("16-gas-range2",
         gas %>%
           filter(date >= "2023-10-23", date <= "2024-07-29") %>%
           group_by(pref) %>%
           summarize(weeks = n(),
                     min = min(price),
                     max = max(price)) %>%
           mutate(range = max - min) %>%
           arrange(range), n = 5)

# 石油連盟の販売量（2026年6月）
gas_quantity <- suppressMessages(
  read_excel(PAJ_FILE, sheet = "202606", skip = 4)) %>%
  select(...2, `数　量...3`) %>%
  rename(pref = ...2, quantity = `数　量...3`)

save_out("16-gas-quantity", gas_quantity, n = 6)

# 販売量と価格の散布図
save_fig("16-gasoline-scatter",
         gas %>%
           mutate(year = year(date), month = month(date)) %>%
           filter(year == 2026, month == 6) %>%
           group_by(pref) %>%
           summarize(price = mean(price)) %>%
           left_join(gas_quantity, by = join_by(pref)) %>%
           filter(pref != "全国") %>%
           ggplot() +
           geom_point(aes(x = quantity, y = price)) +
           geom_text(aes(x = quantity, y = price, label = pref),
                     hjust = -0.2, size = 3, family = FONT),
         h = 4.8)

# 灯油の店頭価格（18リットルあたりを1リットルあたりに直す）
kerosene <- suppressWarnings(
  read_excel("files/260902s5.xlsx", sheet = "灯油店頭",
             .name_repair = "unique_quiet")) %>%
  select(-1) %>%
  rename(date = 調査日) %>%
  pivot_longer(cols = -date, names_to = "pref", values_to = "kerosene_price") %>%
  filter(!is.na(kerosene_price)) %>%
  mutate(date = as.Date(date),
         pref = str_remove_all(pref, "[ 　]")) %>%
  filter(pref != "消費税率") %>%
  mutate(pref = if_else(pref == "北海道局", "北海道", pref),
         pref = if_else(pref == "沖縄局", "沖縄", pref)) %>%
  filter(!str_detect(pref, "局")) %>%
  mutate(kerosene_price = kerosene_price / 18)

save_out("16-gas-kerosene",
         gas %>%
           left_join(kerosene, by = join_by(date, pref)) %>%
           filter(date == "2025-02-03") %>%
           mutate(diff = price - kerosene_price) %>%
           arrange(desc(diff)), n = 8)

save_out("16-gas-kerosene-zenkoku",
         gas %>%
           left_join(kerosene, by = join_by(date, pref)) %>%
           filter(date == "2025-02-03", pref == "全国") %>%
           mutate(diff = price - kerosene_price))

# 卸売価格（月次。消費税抜き）
wholesale <- read_excel("files/260831o5.xlsx", sheet = "レギュラー") %>%
  select(-1) %>%
  rename(date = 調査年月) %>%
  pivot_longer(cols = -date, names_to = "pref", values_to = "wholesale_price") %>%
  filter(!is.na(wholesale_price)) %>%
  mutate(date = as.Date(date),
         pref = str_remove_all(pref, "[ 　]")) %>%
  mutate(pref = if_else(pref == "北海道局", "北海道", pref),
         pref = if_else(pref == "沖縄局", "沖縄", pref)) %>%
  filter(!str_detect(pref, "局"))

save_out("16-gas-wholesale", wholesale, n = 4)

save_out("16-gas-profit",
         gas %>%
           filter(date == "2025-02-03") %>%
           left_join(wholesale %>%
                       filter(date == "2025-02-01") %>%
                       select(-date), by = join_by(pref)) %>%
           mutate(profit = price - wholesale_price) %>%
           arrange(desc(profit)), n = 8)

# =========================================================================
# 第3部　17章　スクレイピング（保存しておいたページから作る）
# =========================================================================

suppressMessages(library(rvest))
# 17章の実行結果は、保存しておいたページから作ります。相手のサーバーを
# 何度も叩かないためです（18章で書いているとおり）。
#   取得元 https://www.courts.go.jp/tokyo/about/syozai/index.html
#   取得日 2026年10月13日
PAGE <- "sample/tokyo.html"

tokyo <- PAGE %>%
  read_html() %>%
  html_element("div.module-sub-page-parts-table table") %>%
  html_table()

save_out("16-table", tokyo, n = 6)

save_out("16-clean",
         tokyo %>%
           rename(担当 = 4) %>%
           slice(-1), n = 6)

# =========================================================================
# 第3部　18章　リンクを集める（保存しておいたページから作る）
# =========================================================================

#   取得元 https://www.courts.go.jp/courthouse/map_tel/index.html
#   取得日 2026年10月13日
hrefs <- "sample/map_tel.html" %>%
  read_html() %>%
  html_elements("div.module-sub-page-parts-table") %>%
  html_elements("a") %>%
  html_attr("href")

# 全部で200個以上あるので、最初の10個だけ載せる（本文にもそう書いている）
save_out("17-href", head(hrefs, 10))
cat("17-href: 全部で", length(hrefs), "個\n")

# 18章　court_urls の中身（所在地のページのURLだけにして、絶対URLに直し、重複を除いたもの）
court_urls <- hrefs %>%
  str_subset("syozai") %>%
  url_absolute("https://www.courts.go.jp/courthouse/map_tel/index.html") %>%
  unique()

# 全部で69個あるので、最初の10個だけ載せる（本文にもそう書いている）
save_out("17-court-urls", head(court_urls, 10))
cat("17-court-urls: 全部で", length(court_urls), "個\n")

# 18章　全国の裁判所のページを集めたあとの court_contacts の列名（663行×16列になる）
# 69ページを保存しておいたもの（sample/courts/。並びは urls.txt と同じ）から作る
#   取得日 2026年10月13日・14日
court_contacts <- tibble()
for (f in sort(list.files("sample/courts", "html$", full.names = TRUE))) {
  table <- f %>%
    read_html() %>%
    html_elements("div.module-sub-page-parts-table table") %>%
    html_table()
  court_contacts <- suppressMessages(bind_rows(court_contacts, table))
}
writeLines(capture.output(print(court_contacts %>% colnames())),
           file.path(OUT_TXT, "17-colnames.txt"), useBytes = TRUE)
cat("○ outputs/17-colnames.txt\n")

# 18章　クリーニングしたあと（本文のコードと同じ）
court_contacts_clean <- court_contacts %>%
  distinct() %>%
  mutate(name = if_else(is.na(裁判所名),
                        `裁判所名（裁判所名をクリックすると地図が表示されます）`,
                        裁判所名),
         post_code = if_else(is.na(郵便番号), `郵便番号・所在地`, 郵便番号),
         address = if_else(is.na(所在地), str_sub(`郵便番号・所在地`, 10), 所在地)) %>%
  filter(str_sub(name, 1, 4) != "裁判所名") %>%
  mutate(name = name %>%
           str_split_i("\n", 1) %>%
           str_remove_all("地図表示") %>%
           str_squish(),
         post_code = post_code %>%
           str_remove_all("〒") %>%
           str_remove_all("地裁"),
         post_code = str_c(str_sub(post_code, 1, 3), "-", str_sub(post_code, 5, 8))) %>%
  rename(contact_point = `電話番号...4`,
         phone = `電話番号...5`) %>%
  select(name, post_code, address, contact_point, phone)

save_out("17-clean", court_contacts_clean, n = 6)

# =========================================================================
# トップページの実演（assets/top-demo.js）
# 市町村別人口.csv（国勢調査）の列を五つに絞ったものから高齢化率を出し、次のものを作る。
#   表3枚       outputs/00-aging-all・rate・rank.txt（1〜3段目の結果）
#   流す行      outputs/00-aging-stream.txt・stream-all.txt（1・2段目の、表の中を行が流れる動き）
#   グラフ2枚   images/00-aging-log.png（4段目）、00-aging-years.png（5段目）
#   軸だけの絵  images/00-aging-log-axes.png、00-aging-years-axes.png（4・5段目の、点を打っていく動きの下絵）
#   点の位置    outputs/00-aging-points.json、00-aging-points-years.json（その動きで打つ点。画像の中のピクセル）
#   補助線3枚   images/00-aging-log-line.png、00-aging-years-lines.png、00-aging-years-arrows.png（グラフに重ねる透明な絵）
# 表・流す行・点の位置は assets/top-demo.js に埋め込んである（T_ALL・T_RATE・T_RANK・T_STREAM・PTS・PTS_Y）。
# 作り直したときは、手で直さずに、作業場所で
#   python tools/fill_top_demo.py
#   python build.py
# の順に実行して写し直す。グラフと絵は top-demo.js が images/ から読むので、写す必要はない。
# グラフは小さな枠に出すので、ほかより小さく描いて字を大きく見せる。
# =========================================================================

local({
  old <- options(width = 80)
  on.exit(options(old))

  # 実演では、列を五つに絞り、列名を短くしたもの（pref・city・pop・pop_over65）を「市町村の人口.csv」として見せる
  # （表の1行を短くして、スマホでも表の字が小さくなりすぎず、右端の列が切れないように）
  all <- read_csv(paste0(DATA, "市町村別人口.csv"), show_col_types = FALSE) %>%
    select(year, pref = prefecture, city = municipality, pop = population, pop_over65 = population_over65)
  aging <- all %>%
    mutate(rate_over65 = pop_over65 / pop * 100)

  save_out("00-aging-all", all, n = 8)
  save_out("00-aging-rate", aging, n = 8)
  save_out("00-aging-rank", aging %>%
    arrange(desc(year), desc(rate_over65)), n = 8)   # 全部の年を高い順に並べると、避難で人口が41人だった2015年の飯舘村（100%）が先頭に来るので、新しい年を先にする

  # 1段目（読み込み）と2段目（いっぺんに計算）の動きで、表の中を流れていく行（top-demo.js の T_STREAM に写す）。
  # 最初の8行、全8,705行からデータの並びのまま等間隔に選んだ130行ほど、終わりの8行、の順に並べ、表と同じ列の幅にそろえて書き出す。
  # tibble は表示する行に合わせて列の幅を決めるので、選んだ行だけを print すると幅が変わってしまう。だから幅を決めて自分で並べる。
  # 列の幅（全角3字）に収まらない名前の行は選ばず、すぐ後ろの収まる行に替える（名前を切り詰めないため）。
  # 終わりの8行は、収まる行のうち最後の8行。動きはここで減速して止まり、いちばん読める場面になるので、
  # 番号が数え札（8,705 に近づいていく）と食い違わないよう、データの終わりぎわの行を詰めて置く。
  # 1行は「行番号 残り」の形。残りは、表の1行から行番号の欄（左の3字）を除いたものとまったく同じ形。行番号は本来の番号。
  # 00-aging-stream.txt は2段目の表（rate_over65 まで6列）、00-aging-stream-all.txt は1段目の表（5列）の形。
  # 6列の行は、5列の行の後ろに rate_over65 の欄（12字）を足しただけなので、top-demo.js では6列のほうだけを持ち、5列は後ろを切って作る
  wid <- function(x) nchar(x, type = "width")
  pad_l <- function(x, w) paste0(strrep(" ", pmax(0, w - wid(x))), x)
  pad_r <- function(x, w) paste0(x, strrep(" ", pmax(0, w - wid(x))))
  rows <- aging %>%
    mutate(n = row_number(),
           fits = wid(pref) <= 6 & wid(city) <= 6,
           rest_all = paste(year, pad_r(pref, 6), pad_r(city, 6),
                            pad_l(sprintf("%.0f", pop), 7),
                            pad_l(sprintf("%.0f", pop_over65), 10)),
           rest = paste(rest_all, pad_l(sprintf("%.1f", rate_over65), 11)))   # 表の rate_over65 と同じ小数1桁
  ok_n <- rows$n[rows$fits]
  last8 <- tail(ok_n, 8)
  mid <- ok_n[ok_n > 8 & ok_n < last8[1]]
  pick <- unique(sapply(round(seq(9, last8[1] - 1, length.out = 130)), function(t) mid[mid >= t][1]))
  pick <- c(1:8, pick[!is.na(pick)], last8)
  stream <- function(name, table, col) {
    out <- paste(rows$n[pick], rows[[col]][pick])
    # 自分で並べた最初の8行が、tibble の表示（table）と1字も違わないことを確かめる（行番号の欄は「1  」の3字）
    shown <- read_lines(file.path(OUT_TXT, paste0(table, ".txt")))[4:11]
    stopifnot(identical(sub("^(\\d) ", "\\1  ", out[1:8]), shown))
    writeLines(out, file.path(OUT_TXT, paste0(name, ".txt")), useBytes = TRUE)
    cat("○ outputs/", name, ".txt\n", sep = "")
  }
  stream("00-aging-stream", "00-aging-rate", "rest")
  stream("00-aging-stream-all", "00-aging-all", "rest_all")

  W <- 5.4; H <- 3.6
  # 横軸（人口）の目盛りは、そのままだと 1e+03 のような指数で出て、記者には読みにくい。
  # 1,000 / 10,000 … と桁区切りで出すよう、どの絵も scale_x_log10(labels = scales::label_comma()) にそろえる
  # （軸だけの絵・補助線の絵・点の位置も同じ組み立てにしないと、目盛りの字の幅でパネルの位置がずれる）
  y2020 <- aging %>% filter(year == 2020)
  both <- aging %>% filter(year %in% c(2000, 2020))

  # 2020年の双葉町は人口が0人で、割合が計算できない。その1点が外れるという警告は出さない
  suppressWarnings({
    save_fig("00-aging-log", y2020 %>%
      ggplot() +
      geom_point(aes(x = pop, y = rate_over65)) +
      scale_x_log10(labels = scales::label_comma()), w = W, h = H)

    save_fig("00-aging-years", both %>%
      ggplot() +
      geom_point(aes(x = pop, y = rate_over65, color = factor(year))) +
      scale_x_log10(labels = scales::label_comma()), w = W, h = H)

    # ---- 4段目の動き（点が打たれていく）のための、点のない絵と、点の位置。
    # 00-aging-log.png と同じ組み立てのまま点だけを透明にした「軸と目盛りだけ」の絵を描き、その上に、
    # ブラウザが点を一つずつ打っていく（top-demo.js の startDots）。打ち終わった絵が 00-aging-log.png と見分けがつかないよう、
    # 点の位置は、ggplot の目盛りの範囲と、この大きさで描いたときのパネルの位置から、画像の中のピクセルで出す。
    # 透明の点を残しておくのは、目盛りの範囲（どこからどこまでを描くか）を元の絵と同じにするため
    p_axes <- y2020 %>%
      ggplot() +
      geom_point(aes(x = pop, y = rate_over65), alpha = 0) +
      scale_x_log10(labels = scales::label_comma())
    save_fig("00-aging-log-axes", p_axes, w = W, h = H)
    DPI <- 150
    # 点の中心を、画像の左上を原点にしたピクセルで出す（4段目と5段目で共通）。
    # パネルの位置は、ggsave と同じ装置（ragg）・同じ大きさで描いて測る（目盛りの字の幅や凡例で、パネルの位置が決まるため）
    dot_px <- function(p) {
      tmp <- tempfile(fileext = ".png")
      ragg::agg_png(tmp, width = W, height = H, units = "in", res = DPI)
      grid::grid.newpage()
      # 描いた表（gtable）と同じ升目を組んで、パネルの升に入る（gtable は描き終えると升目を片づけるので、自分で組み直す）
      g <- ggplotGrob(p)
      grid::pushViewport(grid::viewport(layout = grid::grid.layout(
        length(g$heights), length(g$widths), widths = g$widths, heights = g$heights, respect = g$respect)))
      pan <- g$layout[g$layout$name == "panel", ]
      grid::pushViewport(grid::viewport(layout.pos.row = pan$t:pan$b, layout.pos.col = pan$l:pan$r))
      lo <- grid::deviceLoc(unit(0, "npc"), unit(0, "npc"))
      hi <- grid::deviceLoc(unit(1, "npc"), unit(1, "npc"))
      dev.off()
      unlink(tmp)
      lo <- sapply(lo, grid::convertUnit, "in", valueOnly = TRUE)
      hi <- sapply(hi, grid::convertUnit, "in", valueOnly = TRUE)
      pp <- ggplot_build(p)$layout$panel_params[[1]]
      d <- layer_data(p) %>% filter(is.finite(x), is.finite(y))   # 人口0人の双葉町などは、元の絵でも描かれない
      # x は log10 の値で目盛りの範囲に当てはめる。y は下から上へ増えるので、上から測り直す。
      # 行の並びは layer_data のまま（＝ggplot が点を描く順）
      d %>% mutate(px = (lo[1] + (x - pp$x.range[1]) / diff(pp$x.range) * (hi[1] - lo[1])) * DPI,
                   py = (H - (lo[2] + (y - pp$y.range[1]) / diff(pp$y.range) * (hi[2] - lo[2]))) * DPI)
    }
    xy_json <- function(d) paste(sprintf("%.1f,%.1f", d$px, d$py), collapse = ",")
    # 点の半径。ggplot の点（形19、大きさ1.5、ふち0.5）は、R の描画では「半径 0.375×（字の大きさ×1.2）」の円に、
    # ふちの線（太さ1が1/96インチ）を半分ぶん足したもの。元の絵との差分で確かめてある（約5.6ピクセル）
    fs <- 1.5 * .pt + 0.5 * .stroke / 2
    r <- 0.375 * 1.2 * fs / 72 * DPI + (0.5 * .stroke / 2) / 96 * DPI / 2
    d4 <- dot_px(p_axes)
    writeLines(sprintf('{"w":%d,"h":%d,"r":%.2f,"xy":[%s]}', W * DPI, H * DPI, r, xy_json(d4)),
               file.path(OUT_TXT, "00-aging-points.json"), useBytes = TRUE)
    cat("○ outputs/00-aging-points.json（", nrow(d4), "点）\n", sep = "")

    # ---- 5段目の動き（2000年の点、続けて2020年の点が打たれていく）のための、点のない絵と、点の位置。
    # 00-aging-years.png と同じ組み立てのまま点だけを透明にする。凡例の見本の点は、透明にすると凡例が読めなくなるので、元の濃さに戻す。
    p_axes5 <- both %>%
      ggplot() +
      geom_point(aes(x = pop, y = rate_over65, color = factor(year)), alpha = 0) +
      scale_x_log10(labels = scales::label_comma()) +
      guides(color = guide_legend(override.aes = list(alpha = 1)))
    save_fig("00-aging-years-axes", p_axes5, w = W, h = H)
    d5 <- dot_px(p_axes5) %>% mutate(year = levels(factor(both$year))[group])
    # ggplot はデータの並びのまま1点ずつ描く。データは新しい年から並んでいるので、2020年の点を全部描いたあとに2000年の点が重なる。
    # 年ごとにひとかたまりで描かれていることを確かめ、その順（draw）を書き出す。ブラウザはこの順に重ねて、打ち終わりの絵を元の絵と同じにする
    runs <- rle(d5$year)$values
    stopifnot(!anyDuplicated(runs))
    grp <- sapply(c("2000", "2020"), function(yr) {
      g <- d5 %>% filter(year == yr)
      sprintf('{"year":%s,"colour":"%s","xy":[%s]}', yr, unique(g$colour), xy_json(g))
    })
    writeLines(sprintf('{"w":%d,"h":%d,"r":%.2f,"draw":[%s],"groups":[%s]}', W * DPI, H * DPI, r,
                       paste(runs, collapse = ","), paste(grp, collapse = ",")),
               file.path(OUT_TXT, "00-aging-points-years.json"), useBytes = TRUE)
    cat("○ outputs/00-aging-points-years.json（", paste(table(d5$year), collapse = "＋"), "点）\n", sep = "")

    # ---- グラフに重ねる補助線（透明な地の画像）。
    # 元のグラフと同じ組み立てのまま、点も字も目盛りも透明にして、線だけを描く。こうすると、重ねたときに位置がぴったり合う
    ghost <- theme(
      text = element_text(colour = "transparent"),
      axis.text = element_text(colour = "transparent"),
      axis.ticks = element_line(colour = "transparent"),
      panel.background = element_rect(fill = "transparent", colour = NA),
      panel.grid = element_line(colour = "transparent"),
      plot.background = element_rect(fill = "transparent", colour = NA),
      legend.background = element_rect(fill = "transparent", colour = NA),
      legend.key = element_rect(fill = "transparent", colour = NA))
    save_layer <- function(name, plot) {
      ggsave(file.path(OUT_IMG, paste0(name, ".png")), plot + ghost,
             width = W, height = H, dpi = 150, bg = "transparent")
      cat("○ images/", name, ".png\n", sep = "")
    }
    ok <- function(d) d %>% filter(pop > 0)
    # 線は、白いふちどりの上に色の線を重ねて、点の群れの上でも見えるようにする
    trend <- function(d, colour) list(
      geom_smooth(aes(x = pop, y = rate_over65), data = d, method = "lm", formula = y ~ x,
                  se = FALSE, colour = "white", linewidth = 2.6),
      geom_smooth(aes(x = pop, y = rate_over65), data = d, method = "lm", formula = y ~ x,
                  se = FALSE, colour = colour, linewidth = 1.3))

    # 4段目：2020年の傾向の線（右下がり）
    save_layer("00-aging-log-line", ok(y2020) %>%
      ggplot() +
      geom_point(aes(x = pop, y = rate_over65), alpha = 0) +
      trend(ok(y2020), "#c0392b") +
      scale_x_log10(labels = scales::label_comma()))

    # 5段目：2000年と2020年、それぞれの傾向の線
    base5 <- ok(both) %>%
      ggplot() +
      geom_point(aes(x = pop, y = rate_over65, color = factor(year)), alpha = 0) +
      scale_x_log10(labels = scales::label_comma())
    save_layer("00-aging-years-lines", base5 +
      trend(ok(both) %>% filter(year == 2000), "#9c2b26") +
      trend(ok(both) %>% filter(year == 2020), "#0b6b6e"))

    # 5段目：2000年の線から2020年の線へ向かう、上向きの矢印（人口1万人と10万人のところ）
    at <- function(yr, x) {
      m <- lm(rate_over65 ~ log10(pop), data = ok(both) %>% filter(year == yr))
      unname(predict(m, tibble(pop = x)))
    }
    xs <- c(1e4, 1e5)
    arrows <- tibble(x = xs, y0 = at(2000, xs) + 0.8, y1 = at(2020, xs) - 0.8)
    save_layer("00-aging-years-arrows", base5 +
      geom_segment(aes(x = x, xend = x, y = y0, yend = y1), data = arrows,
                   colour = "white", linewidth = 2.8, lineend = "round",
                   arrow = arrow(length = unit(0.13, "in"), type = "closed")) +
      geom_segment(aes(x = x, xend = x, y = y0, yend = y1), data = arrows,
                   colour = "#1d1c1a", linewidth = 1.3,
                   arrow = arrow(length = unit(0.11, "in"), type = "closed")))
  })
})

cat("\n終わりました。python tools/fill_top_demo.py と python build.py を実行して、サイトを組み立て直してください。\n")
