# 元の熱中症分析（https://ryomakom.github.io/heat_stroke/）に載っているコードのうち、データを組み立てる部分。
# make-heat20.R から読み込んで使う（作業フォルダは heat_stroke リポジトリにしてから実行する）

library(tidyverse)
library(readxl)
library(lubridate)

#=====CHUNK=====
hs08 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h20.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h20.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h20.xlsx",sheet=3))

hs09 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h21.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h21.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h21.xlsx",sheet=3))

hs10 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h22.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h22.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h22.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h22.xlsx",sheet=4))

hs11 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h23.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h23.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h23.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h23.xlsx",sheet=4))

hs12 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h24.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h24.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h24.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h24.xlsx",sheet=4))

hs13 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h25.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h25.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h25.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h25.xlsx",sheet=4))

hs14 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h26.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h26.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h26.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h26.xlsx",sheet=4))

hs15 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h27.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h27.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h27.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h27.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_h27.xlsx",sheet=5))

hs16 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h28.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h28.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h28.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h28.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_h28.xlsx",sheet=5))

# この年以降に発生場所の情報が加わる
hs17 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h29.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h29.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h29.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h29.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_h29.xlsx",sheet=5))

hs18 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_h30.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_h30.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_h30.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_h30.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_h30.xlsx",sheet=5))

hs19 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_r1.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_r1.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_r1.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_r1.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_r1.xlsx",sheet=5))

hs20 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_r2.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_r2.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_r2.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_r2.xlsx",sheet=4))

hs21 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_r3.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_r3.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_r3.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_r3.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_r3.xlsx",sheet=5))

hs22 <- bind_rows(read_xlsx("data/hs/heatstroke003_data_r4.xlsx",sheet=1),
                  read_xlsx("data/hs/heatstroke003_data_r4.xlsx",sheet=2),
                  read_xlsx("data/hs/heatstroke003_data_r4.xlsx",sheet=3),
                  read_xlsx("data/hs/heatstroke003_data_r4.xlsx",sheet=4),
                  read_xlsx("data/hs/heatstroke003_data_r4.xlsx",sheet=5))

hs <- bind_rows(hs08,
                hs09,
                hs10,
                hs11,
                hs12,
                hs13,
                hs14,
                hs15,
                hs16,
                hs17,
                hs18,
                hs19,
                hs20,
                hs21,
                hs22)

hs[is.na(hs)] <- 0

hs <- hs %>% 
  rename(date=日付,
         prefID=都道府県コード,
         cases=`搬送人員（計）`,
         age_newborn=`年齢区分：新生児`,
         age_infant=`年齢区分：乳幼児`,
         age_youth=`年齢区分：少年`,
         age_adult=`年齢区分：成人`,
         age_elder=`年齢区分：高齢者`,
         age_unknown=`年齢区分：不明`,
         severity_dead=`傷病程度：死亡`,
         severity_serious=`傷病程度：重症`,
         severity_moderate=`傷病程度：中等症`,
         severity_mild=`傷病程度：軽症`,
         severity_other=`傷病程度：その他`,
         place_house=`発生場所：住居`,
         place_work1=`発生場所：仕事場①`,
         place_work2=`発生場所：仕事場②`,
         place_school=`発生場所：教育機関`,
         place_public_inside=`発生場所：公衆(屋内)`,
         place_public_outside=`発生場所：公衆(屋外)`,
         place_road=`発生場所：道路`,
         place_other=`発生場所：その他`) %>% 
  mutate(date=as.Date(date)) %>% 
  left_join(read_csv("data/pref.csv")) %>% 
  mutate(year=as.double(year(date)),month=as.double(month(date)))

#=====CHUNK=====

#=====CHUNK=====
climate <- bind_rows(read_csv("data/climate/hokkaido.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="北海道",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/aomori.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="青森県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),                    
                     read_csv("data/climate/iwate.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="岩手県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/miyagi.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="宮城県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/akita.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="秋田県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/yamagata.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="山形県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/fukushima.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="福島県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/ibaraki.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="茨城県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/tochigi.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="栃木県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/gunma.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="群馬県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/saitama.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="埼玉県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/chiba.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="千葉県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/tokyo.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="東京都",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/kanagawa.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="神奈川県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/niigata.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="新潟県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/toyama.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="富山県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/ishikawa.csv", 
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="石川県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/fukui.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="福井県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/yamanashi.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="山梨県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/nagano.csv", 
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="長野県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/gifu.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="岐阜県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/shizuoka.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="静岡県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/aichi.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="愛知県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/mie.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="三重県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),                  
                     read_csv("data/climate/shiga.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="滋賀県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/kyoto.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="京都府",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/osaka.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="大阪府",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/hyogo.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="兵庫県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/nara.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="奈良県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/wakayama.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="和歌山県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/tottori.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="鳥取県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/shimane.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="島根県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/okayama.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="岡山県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/hiroshima.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="広島県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/yamaguchi.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="山口県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/tokushima.csv", 
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="徳島県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/kagawa.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="香川県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/ehime.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="愛媛県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/kochi.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="高知県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/fukuoka.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="福岡県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/saga.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="佐賀県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/nagasaki.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="長崎県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/kumamoto.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="熊本県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/oita.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="大分県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity), 
                     read_csv("data/climate/miyazaki.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="宮崎県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/kagoshima.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="鹿児島県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity),
                     read_csv("data/climate/okinawa.csv",
                              skip=3,
                              locale = locale(encoding = "shift-jis"))[,c(1,2,5,8)] %>%
                       filter(!is.na(年月日)) %>%
                       mutate(pref="沖縄県",
                              date=as.Date(年月日),
                              max_temp=`最高気温(℃)...2`,
                              avg_temp=`平均気温(℃)...5` ,
                              humidity=`平均湿度(％)...8`) %>%
                       dplyr::select(pref,date,max_temp,avg_temp,humidity)) %>% 
  mutate(year=as.double(year(date)),month=as.double(month(date)))

#=====CHUNK=====

#=====CHUNK=====
avg_temp_summer <- climate %>%
  filter(as.double(year(date))>=2020) %>%
  group_by(pref) %>%
  summarize(avg_temp_summer=mean(avg_temp)) %>%
  left_join(read_csv("data/pref.csv")) %>%
  arrange(prefID)
