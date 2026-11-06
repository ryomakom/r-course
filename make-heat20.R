# -------------------------------------------------------------------------
# 20章の熱中症のグラフ（ブラウザで描く版）のデータと、印刷用の画像を作るスクリプト。
#
# 元の分析（https://github.com/ryomakom/heat_stroke）のデータを使います。
# あらかじめ、そのリポジトリを手元に clone しておき、HEAT_REPO にその場所を書いてください。
#   git clone https://github.com/ryomakom/heat_stroke.git
# データの組み立て（heat-prep.R）は、元の分析ページに載っているコードと同じです。
#
# 書き出すもの
#   assets/heat-data.js     ブラウザで描くためのデータ（全部の点と、近似曲線）
#   images/20-heatstroke.png 印刷用・スクリプトが動かないとき用の画像
# -------------------------------------------------------------------------

suppressMessages({library(tidyverse); library(readxl); library(lubridate)})

# heat_stroke リポジトリを clone した場所。自分の環境に合わせて書き換えてください
HEAT_REPO <- "C:/Users/1030202/AppData/Local/Temp/claude_50/heatrepo"
HEAT_PREP <- normalizePath("heat-prep.R")
OUT <- normalizePath(".")

old <- setwd(HEAT_REPO)
suppressMessages(suppressWarnings(source(HEAT_PREP, encoding = "UTF-8")))
d <- hs %>%
  mutate(year2 = ifelse(year < 2010, 2005,
                 ifelse(year < 2015, 2010,
                 ifelse(year < 2020, 2015, 2020)))) %>%
  left_join(read_csv("data/population.csv", show_col_types = FALSE), by = c("pref", "year2")) %>%
  left_join(climate, by = c("pref", "date")) %>%
  left_join(avg_temp_summer, by = "pref") %>%
  mutate(cases_pop = 100000 * cases / population) %>%
  mutate(group = ifelse(avg_temp_summer > 23, "23度超",
                 ifelse(avg_temp_summer > 22, "22～23度", "22度以下")),
         group = factor(group, levels = c("22度以下", "22～23度", "23度超")))
setwd(old)

cat("点の数:", nrow(d), "  期間:", format(min(d$date)), "〜", format(max(d$date)),
    "  月:", paste(sort(unique(month(d$date))), collapse = ","), "\n")

COLORS <- c("22度以下" = "#2b6cb0", "22～23度" = "#d69e2e", "23度超" = "#c53030")

# 近似曲線（元の分析と同じ geom_smooth(method = "gam")）を、ggplot に計算させて取り出す
p <- d %>%
  ggplot(aes(max_temp, cases_pop, color = group)) +
  geom_point(alpha = .12, size = .7) +
  geom_smooth(method = "gam", se = FALSE, linewidth = 1.5) +
  scale_color_manual(values = COLORS, name = "夏場の平均気温") +
  labs(title = "その日の最高気温と、熱中症の救急搬送数",
       subtitle = "人口10万人あたり。点は都道府県ごとの1日分、線は近似曲線",
       x = "その日の最高気温（度）", y = "救急搬送数（人口10万人あたり）",
       caption = "総務省消防庁、気象庁、国勢調査のデータから作成") +
  theme_minimal(base_family = "Yu Gothic", base_size = 13) +
  theme(plot.title = element_text(face = "bold"), legend.position = "top")
built <- suppressMessages(ggplot_build(p))
curves <- built$data[[2]] %>%
  mutate(group = levels(d$group)[group]) %>%
  select(group, x, y)

ggsave(file.path(OUT, "images/20-heatstroke.png"), p, width = 7.2, height = 4.8, dpi = 150, bg = "white")

# 点を1つ4文字に詰める（グループ・気温×10・搬送数×100 を24ビットに入れて、64進法で書く）
ALPHA <- strsplit("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", "")[[1]]
enc <- d %>%
  mutate(g = as.integer(group) - 1L,
         xi = as.integer(round(max_temp * 10)),
         yi = pmin(as.integer(round(cases_pop * 100)), 1023L)) %>%
  arrange(desc(g)) %>%                       # 数の多い「23度超」から先に描く
  mutate(v = g * 2^20 + xi * 2^10 + yi)
stopifnot(all(enc$xi >= 0 & enc$xi < 1024))
packed <- vapply(enc$v, function(v) paste(ALPHA[(v %/% 64^(3:0)) %% 64 + 1], collapse = ""), "")

js <- c(
  "// make-heat20.R が書き出したデータ。手で書き換えないでください",
  "window.HEAT_DATA = {",
  sprintf("  n: %d,", nrow(enc)),
  sprintf("  groups: [%s],", paste0('"', levels(d$group), '"', collapse = ", ")),
  sprintf("  colors: [%s],", paste0('"', COLORS[levels(d$group)], '"', collapse = ", ")),
  sprintf("  counts: [%s],", paste(as.integer(table(d$group)), collapse = ", ")),
  "  curves: {",
  paste0(sapply(levels(d$group), function(g) {
    cc <- curves %>% filter(group == g)
    sprintf('    "%s": [%s]', g, paste(sprintf("[%.2f,%.3f]", cc$x, cc$y), collapse = ","))
  }), collapse = ",\n"),
  "  },",
  sprintf('  points: "%s"', paste(packed, collapse = "")),
  "};")
writeLines(js, file.path(OUT, "assets/heat-data.js"), useBytes = TRUE)
cat("○ assets/heat-data.js (", round(file.size(file.path(OUT, "assets/heat-data.js")) / 1024), "KB )\n")
cat("○ images/20-heatstroke.png\n")
cat("y の最大:", max(d$cases_pop), "  x の範囲:", range(d$max_temp), "\n")
