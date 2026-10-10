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

# ファイルの冒頭を、そのままテキストファイルに保存する
save_head <- function(name, path, n = 10, enc = "UTF-8") {
  txt <- read_lines(path, n_max = n, locale = locale(encoding = enc))
  txt <- str_trunc(txt, 120)
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

# 04章　csvの冒頭がどうなっているか（Excelで開いて確かめる代わり）
save_head("04-csv-head", paste0(DATA, "人口データ2020.csv"), n = 10)

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
           arrange(rate_aged) %>%
           select(region, population, rate_aged), n = 10)

save_out("05-arrange-desc",
         df2020_simple %>%
           mutate(rate_aged = population_over65 * 100 / population) %>%
           arrange(desc(rate_aged)) %>%
           select(region, population, rate_aged), n = 10)

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

# 08章　2015年のファイルを skip=8 で読むと列名が壊れる
bad2015 <- suppressWarnings(
  read_csv(paste0(DATA, "人口データ2015.csv"), skip = 8,
           show_col_types = FALSE, name_repair = "unique_quiet"))
save_out("08-bad-skip", bad2015 %>% select(1:5), n = 4)

# 08章　2015年ファイルの冒頭（意味のない行は2行しかない）
save_head("08-csv2015-head", paste0(DATA, "人口データ2015.csv"), n = 6)

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

# 10章　データ型が合わなくてbind_rowsが失敗する
type_err <- tryCatch(
  bind_rows(
    read_csv(paste0(DATA, "人口データ2020.csv"), skip = 8,
             show_col_types = FALSE, name_repair = "unique_quiet"),
    read_excel(paste0(DATA, "人口データ2005.xls"), skip = 8,
               .name_repair = "unique_quiet")),
  error = function(e) conditionMessage(e))
writeLines(as.character(type_err), file.path(OUT_TXT, "10-type-error.txt"),
           useBytes = TRUE)
cat("○ outputs/10-type-error.txt\n")

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

save_out("11-anti-join",
         df2020_simple %>%
           anti_join(working2020 %>% select(-code), by = join_by(region)) %>%
           select(region, population), n = 10)

# =========================================================================
# 第2部　データを見る
# =========================================================================

tokyo <- read_csv(paste0(DATA, "東京都の人口.csv"), show_col_types = FALSE)
five_pref <- read_csv(paste0(DATA, "主な都道府県の人口.csv"), show_col_types = FALSE)
all_pref <- read_csv(paste0(DATA, "都道府県別人口.csv"), show_col_types = FALSE)
all_municipality <- read_csv(paste0(DATA, "市町村別人口.csv"), show_col_types = FALSE)

save_out("12-tokyo-data", tokyo, n = 6)

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

save_fig("13-col-fill",
         tokyo_long %>% ggplot() +
           geom_col(aes(x = year, y = value, fill = category),
                    position = "fill"))

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

save_out("14-change-data",
         all_municipality_change %>%
           select(prefecture, municipality, population_2020, change_under15), n = 6)

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
           arrange(desc(rate_young)) %>%
           select(region, population, rate_young), n = 10)

# 宿題2　都道府県別の高齢化率ランキング
save_out("a3-pref-aged",
         df2020_pref %>%
           mutate(rate_aged = pref_population_over65 * 100 / pref_population) %>%
           arrange(desc(rate_aged)) %>%
           select(prefecture, pref_population, rate_aged), n = 10)

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
           left_join(work_all, by = join_by(year, code)) %>%
           select(year, region, population, primary, tertiary), n = 5)

save_out("a3-join-check",
         df_simple5 %>%
           left_join(work_all, by = join_by(year, code)) %>%
           filter(is.na(primary)) %>%
           count(year), n = 6)

# =========================================================================
# 第3部　16章　スクレイピング（保存しておいたページから作る）
# =========================================================================

suppressMessages(library(rvest))
# 16章の実行結果は、保存しておいたページから作ります。相手のサーバーを
# 何度も叩かないためです（16章・17章で書いているとおり）。
#   取得元 https://www.courts.go.jp/sapporo-h/about/syozai/index.html
#   取得日 2026年8月10日
PAGE <- "sample/sapporo.html"

tables <- PAGE %>% read_html() %>% html_table()

save_out("16-len", length(tables))
save_out("16-colnames", colnames(tables[[1]]))

# 列名が重複しているので、名前を直したものも見せる
naosita <- tables[[1]] %>% as_tibble(.name_repair = "unique")
save_out("16-repaired", colnames(naosita))
save_out("16-table",
         naosita %>%
           mutate(所在地 = str_trunc(所在地, 10)) %>%
           select(裁判所名, 郵便番号, 所在地, 電話番号...4, 電話番号...5))

save_out("16-node-len",
         length(PAGE %>% read_html() %>%
                  html_nodes("div.module-sub-page-parts-table") %>% html_table()))

cat("\n終わりました。python build.py でサイトを組み立て直してください。\n")
