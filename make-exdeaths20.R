# -------------------------------------------------------------------------
# 20章のコロナの地図（ブラウザで描く版）のデータを作るスクリプト。
#
# 元の分析（https://github.com/ryomakom/exdeaths）のデータを使います。
# あらかじめ、そのリポジトリを手元に clone しておき、EX_REPO にその場所を書いてください。
#   git clone https://github.com/ryomakom/exdeaths.git
#
# 数字は、元の分析がデザイナー向けに書き出した data/for_designer/exdeath_map.csv をそのまま使う。
# 地図は data/prefectures.geojson（地図蔵）を、ブラウザで軽く描けるように簡単にしたもの。
# 沖縄県は、左上の囲みのなかに移して描く。
#
# 書き出すもの
#   assets/exdeaths-data.js
# -------------------------------------------------------------------------

suppressMessages({library(tidyverse); library(sf)})

# exdeaths リポジトリを clone した場所。自分の環境に合わせて書き換えてください
EX_REPO <- "C:/Users/1030202/AppData/Local/Temp/claude_50/exrepo"
OUT <- normalizePath(".")

vals <- read_csv(file.path(EX_REPO, "data/for_designer/exdeath_map.csv"),
                 col_types = cols(prefID = col_character(), .default = col_guess())) %>%
  filter(pref != "全国")                      # 全国の行は地図に使わない

jp <- st_read(file.path(EX_REPO, "data/prefectures.geojson"), quiet = TRUE) %>%
  mutate(pref = as.character(name)) %>%
  select(pref)
sf_use_s2(FALSE)

# 日本向けのランベルト正角円錐図法にして、メートル単位で扱う
LCC <- "+proj=lcc +lat_1=33 +lat_2=44 +lat_0=37 +lon_0=137 +datum=WGS84 +units=m +no_defs"
jp <- st_transform(jp, LCC)

# 小さな島を落とし、形を簡単にする
polys <- jp %>%
  st_cast("MULTIPOLYGON") %>% st_cast("POLYGON", warn = FALSE) %>%
  mutate(area_km2 = as.numeric(st_area(geometry)) / 1e6)
keep <- polys %>% filter(area_km2 >= 40 | pref == "沖縄県" & area_km2 >= 15)
cat("島を落とす前:", nrow(polys), " 後:", nrow(keep), "\n")
simp <- keep %>% st_simplify(preserveTopology = TRUE, dTolerance = 2500)

# 沖縄県だけを、左上の囲みのなかへ動かす。
# 沖縄本島のあたり（東経126.5〜128.5度）だけを、2.6倍に大きくして描く（宮古・八重山、大東諸島は省く）
main <- simp %>% filter(pref != "沖縄県")
oki  <- simp %>% filter(pref == "沖縄県")
lon <- st_coordinates(st_transform(st_centroid(oki), 4326))[, 1]
oki <- oki[lon > 126.5 & lon < 128.5, ]          # 大東諸島も省く
bo <- st_bbox(oki)
SCALE <- 2.6
st_geometry(oki) <- (st_geometry(oki) - c(bo["xmin"], bo["ymax"])) * SCALE + c(bo["xmin"], bo["ymax"])
bm <- st_bbox(main); bo <- st_bbox(oki)
PAD <- 25000
dx <- (bm["xmin"] + PAD) - bo["xmin"]
dy <- (bm["ymax"] - PAD) - bo["ymax"]
st_geometry(oki) <- st_geometry(oki) + c(dx, dy)
st_crs(oki) <- st_crs(main)
bo2 <- st_bbox(oki)
inset <- c(bo2["xmin"] - 15000, bo2["ymin"] - 15000, bo2["xmax"] + 15000, bo2["ymax"] + 15000)
all <- bind_rows(main, oki)

# SVGの座標（幅1000）に直す
bb <- st_bbox(all)
bb[c("xmin", "ymin", "xmax", "ymax")] <- c(min(bb["xmin"], inset[1]), min(bb["ymin"], inset[2]),
                                            max(bb["xmax"], inset[3]), max(bb["ymax"], inset[4]))
W <- 1000
s <- W / (bb["xmax"] - bb["xmin"])
H <- round((bb["ymax"] - bb["ymin"]) * s)
tx <- function(x) (x - bb["xmin"]) * s
ty <- function(y) (bb["ymax"] - y) * s
ring_d <- function(m) {
  paste0("M", paste(sprintf("%.1f %.1f", tx(m[, 1]), ty(m[, 2])), collapse = "L"), "Z")
}
paths <- all %>%
  group_by(pref) %>%
  summarize(d = paste(vapply(geometry, function(g) paste(vapply(g, ring_d, ""), collapse = ""), ""), collapse = ""),
            .groups = "drop")

prefs <- vals %>%
  select(prefID, pref, y2020 = exdeath_pop_2020, y2021 = exdeath_pop_2021, y2022 = exdeath_pop_2022) %>%
  left_join(paths %>% st_drop_geometry(), by = "pref") %>%
  arrange(prefID)
stopifnot(!any(is.na(prefs$d)))
cat("値の範囲:", range(c(prefs$y2020, prefs$y2021, prefs$y2022)), "\n")

js <- c(
  "// make-exdeaths20.R が書き出したデータ。手で書き換えないでください",
  "window.EXDEATHS_DATA = {",
  sprintf("  width: %d, height: %d,", W, H),
  sprintf("  inset: [%.1f, %.1f, %.1f, %.1f],", tx(inset[1]), ty(inset[4]), tx(inset[3]) - tx(inset[1]), ty(inset[2]) - ty(inset[4])),
  "  years: [2020, 2021, 2022],",
  "  prefs: [",
  paste0(sprintf('    {id: "%s", name: "%s", v: [%.1f, %.1f, %.1f], d: "%s"}',
                 prefs$prefID, prefs$pref, prefs$y2020, prefs$y2021, prefs$y2022, prefs$d), collapse = ",\n"),
  "  ]",
  "};")
writeLines(js, file.path(OUT, "assets/exdeaths-data.js"), useBytes = TRUE)
cat("○ assets/exdeaths-data.js (", round(file.size(file.path(OUT, "assets/exdeaths-data.js")) / 1024), "KB )  幅", W, "高さ", H, "\n")
