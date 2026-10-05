---
title: 全国の裁判所を一気に集める
nav: 17 まとめて集める（for文）
kicker: 第3部　データを集める
lead: ページは50以上。読みたいURLのリストをまず作って、それに同じ処理をいっぺんにかけます。
---

欲しいのは、札幌だけの一覧ではなくて、全国の裁判所の連絡先がそろった一枚の表です。でも読みたいページはたくさんあります。高裁ごと・地裁ごとに分かれていて、50以上。

素直に書くと、こうなります。

```r
sapporo <- "https://www.courts.go.jp/sapporo-h/about/syozai/index.html" %>%
  read_html() %>% html_nodes("div.module-sub-page-parts-table") %>% html_table()

sendai <- "https://www.courts.go.jp/sendai-h/about/syozai/index.html" %>%
  read_html() %>% html_nodes("div.module-sub-page-parts-table") %>% html_table()

tokyo <- "https://www.courts.go.jp/tokyo-h/about/syozai/index.html" %>%
  read_html() %>% html_nodes("div.module-sub-page-parts-table") %>% html_table()
```

一つ一つに同じことを繰り返すのは、めんどくさい。50回コピーして貼るあいだにURLを打ち間違えても、たぶん気づけません。

よく見ると、違うのはURLだけで、あとは全部同じです。ならば、そこはコンピューターにやらせましょう。まずは読みたいURLのリストを作って、そのリストに同じ処理をかけていくわけです。

## 読みたいURLのリストを作る

裁判所のサイトには、全国の裁判所へのリンクが並んだページがあります。ここからリンクだけを抜き出せば、リストができます。これも手で写すのはめんどくさいので、機械にやらせます。

前の章で覚えた `read_html()` と `html_nodes()` に、二つ足すだけです。

```r
"https://www.courts.go.jp/courthouse/map_tel/index.html" %>%
  read_html() %>%
  html_nodes("div.module-sub-page-parts-table") %>%   # ここまでは前と同じ
  html_elements("a") %>%
  html_attr("href")
```

`html_elements("a")` は、その中にあるすべての `<a>` 要素、つまりハイパーリンクを取ってきなさい、という命令です。そして `html_attr("href")` は、各リンクの `href` 属性、つまりURLの部分を抽出しなさい、という命令。

HTMLでリンクは `<a href="/sapporo-h/about/syozai/index.html">札幌高等裁判所</a>` のように書かれています。`html_table()` が拾ってくるのは「札幌高等裁判所」という目に見える文字のほうですが、`html_attr("href")` が拾ってくるのは行き先のほうだ、というわけです。

実行すると、URLらしきものがずらっと並んで返ってきます。でもそのままでは使えません。二つ手を入れます。

```r
"https://www.courts.go.jp/courthouse/map_tel/index.html" %>%
  read_html() %>%
  html_nodes("div.module-sub-page-parts-table") %>%
  html_elements("a") %>%
  html_attr("href") %>%
  str_subset("syozai") %>%                     # 所在地のほうのURLのみを抽出
  str_c("https://www.courts.go.jp", .)         # 相対パスを完全なURLにする
```

このページには地図のページなど別のリンクも混ざっているので、`str_subset("syozai")` で「syozai」という文字を含むものだけに絞っています。

もう一つの `str_c()` のほうは、頭にドメイン名をくっつけています。ページのHTMLに書かれているリンクは、`/sapporo-h/about/syozai/index.html` のようにドメイン名が省略されていることがよくあって、これを相対パスと呼びます。ブラウザは「同じサイトの中だな」と補って解釈してくれますが、Rはそこまで気を回してくれません。だから自分で完全な形に直してやるわけです。

ちなみに `str_c()` の最後にあるピリオドは、パイプで渡ってきたものを指しています。ふつうはパイプで渡ったものが一つ目の引数になりますが、ここでは二つ目に置きたいので、置き場所をピリオドで明示している、というわけです。

うまくいったらオブジェクトに入れて、中身を見ておきましょう。

```r
court_urls <- "https://www.courts.go.jp/courthouse/map_tel/index.html" %>%
  read_html() %>%
  html_nodes("div.module-sub-page-parts-table") %>%
  html_elements("a") %>%       # その中にあるすべての <a> 要素を取得
  html_attr("href") %>%        # 各リンクの href 属性（URL部分）を抽出
  str_subset("syozai") %>%     # 所在地のほうのURLのみを抽出
  str_c("https://www.courts.go.jp", .)   # 相対パスを完全なURLにする

court_urls
length(court_urls)
```

数が一覧ページに並んでいる裁判所の数と合っているか、URLの形がちゃんと `https://www.courts.go.jp/sapporo-h/...` になっているか、`NA` が混ざっていないか。ここは確かめておいて下さい。リストが間違っていると、このあとの繰り返しが全部無駄になります。

## リストを一つずつ処理する

リストができました。これを一つずつ、同じように処理していきます。Rでこれをやるにはfor文を使います。まず形だけ見て下さい。

```r
for (i in c("東京都", "大阪府", "愛知県")) {
  print(i)
}
```

```console
[1] "東京都"
[1] "大阪府"
[1] "愛知県"
```

丸括弧のなかのものを一つずつ順番に取り出して、それを `i` と呼ぶことにして、波括弧のなかの処理をやりなさい、という命令です。1周目の `i` は「東京都」、2周目は「大阪府」、3周目は「愛知県」になります。`i` という名前は慣習で、別に何でもかまいません。

`c()` は値を並べてひとかたまりにする関数で、[06章](06-strings-filter.html)の `filter(prefecture %in% c("東京都", "大阪府"))` でもう出てきていました。かたまりの何番目かを取り出すには角括弧を使います。`court_urls[1]` なら一つ目のURLです。

実務でよく見かけるのは、中身ではなく番号で回すこの書き方です。

```r
for (i in seq_along(court_urls)) {
  print(str_c(i, "個目：", court_urls[i]))
}
```

`seq_along(court_urls)` は「court_urlsの長さのぶんだけ、1、2、3……と数字を並べたもの」を返します。だから `i` に入るのは番号で、中身を取り出すには `court_urls[i]` と書く必要があるわけです。なぜこう書くのかというと、番号が手元にあると「いま何周目か」を表示できるからです。50ページ取っているときに「23個目で止まった」と分かるのは、けっこう助かります。

## 結果をまとめて保存する

for文の本当の使いどころは、結果をどこかにためていくことです。1周ごとに1ページ分の表が取れるので、それを一つの箱に足していきます。箱は先に用意しておきます。

```r
# データの収容先として空っぽのtibbleを作っておく
court_contacts <- tibble()

# URLのリストに対して、さっきと同じように表を抽出してtibbleにするのを
# いっぺんに実行して、結果をまとめて保存する
for (i in seq_along(court_urls)) {
  table <- court_urls[i] %>%
    read_html() %>%
    html_nodes("div.module-sub-page-parts-table") %>%
    html_table()

  court_contacts <- bind_rows(court_contacts, table)

  Sys.sleep(2) # アクセス先に過剰な負荷をかけないため、次の動作までちょっとだけ待つ
}
```

波括弧のなかを見て下さい。前の章で書いたコードと同じで、URLのところが `court_urls[i]` に変わっただけです。

肝は下から2行目の `bind_rows()` のところ。いまの箱の中身に、新しく読んだものを縦にくっつけて、それをまた同じ箱に入れ直す。これを繰り返すと箱の中身がどんどん増えていく、というわけです。[08章](08-bind.html)で覚えた関数が、ここで効いてきます。空っぽの箱を作るのを忘れると動かないので、そこは注意して下さい。

最後の `Sys.sleep(2)` は「2秒待て」という命令です。50ページを2秒間隔で回すので、全部終わるまで2分ほどかかります。そのあいだRStudioは操作できないので、コーヒーでも飲んでいて下さい。

:::warn 相手のサーバーに迷惑をかけない
コンピューターは何のためらいもなく、1秒間に何十回もアクセスします。これは相手のサーバーにとってはかなりの負荷で、場合によっては攻撃と区別がつきません。実際に、公開情報を機械的に取得しただけで問題になった例もあります。だから `Sys.sleep()` をループのなかに入れて、わざと足を止めてやるわけです。

2秒はあくまで最低ラインで、相手が小さな自治体のサーバーならもっと長くてもいいと思います。一度取ったものは手元に保存して、試行錯誤のたびに取り直さないようにする。何かあったときに相手の担当者が対応できない深夜や早朝は避ける。大量に取る必要があるなら、事前に連絡を入れる。私はこのあたりを自分に確認するようにしています。社内のルールがあれば、そちらが優先です。
:::

## 途中で止まらないようにする

2分間まったく画面が動かないと、動いているのか固まっているのか分かりません。それに50ページもあれば、たいてい一つか二つは作りが違って失敗します。ふつうのfor文はエラーが出るとそこで止まってしまうので、23個目で失敗すると24個目以降には進みません。

これを防ぐのが `tryCatch()` です。

```r
# エラーが出ても止まらないようにする
court_contacts <- tibble()

for (i in seq_along(court_urls)) {
  tryCatch({

    table <- court_urls[i] %>%
      read_html() %>%
      html_nodes("div.module-sub-page-parts-table") %>%
      html_table()

    court_contacts <- bind_rows(court_contacts, table)
    message(str_c("○ ", i, "/", length(court_urls)))

  }, error = function(e) {
    message(str_c("× ", court_urls[i], "：", e$message))
  })

  Sys.sleep(2)
}
```

波括弧のなかの処理を試して、エラーが起きたら `error = function(e)` のほうに書いた処理をして、次の周に進みなさい、という命令です。`e$message` にはエラーの内容が入っているので、表示しておくと後で原因を追えます。

`message()` は途中経過を画面に出す関数です。○と×を並べておけば、全部終わったあとに、どれが失敗したのかがひと目で分かります。失敗したものだけ、あとで個別に対処すればいいわけです。

:::tips いきなり50回まわさない
for文がうまく動かないときは、まず `i <- 1` と手で書いて実行してから、ループの中身だけを上から1行ずつ実行してみて下さい。原因の大半は、ループの中身がそもそも間違っていることです。中身が動くのを確かめてから `for` で囲む、という順番でやると早く終わります。
:::

## 集まったものを整える

さて、集まったtibbleを見てみましょう。……なかなかひどい状態です。

```r
court_contacts %>% colnames()
court_contacts %>% nrow()
```

ページによって表の列名が違うのです。「裁判所名」となっているところもあれば「裁判所名（裁判所名をクリックすると地図が表示されます）」となっているところもある。そもそも列名がなくて `X1` `X2` になっているページもある。`bind_rows()` は名前が違う列を別の列として扱いますから、列がやたら増えてしまっているわけです。

ここからが、地味ですが本番です。ある程度クリーニングしましょう。

```r
court_contacts <- court_contacts %>%
  filter(is.na(裁判所名) | 裁判所名 != "裁判所名") %>%
  mutate(裁判所名 = ifelse(
    !is.na(`裁判所名（裁判所名をクリックすると地図が表示されます）`),
    `裁判所名（裁判所名をクリックすると地図が表示されます）`,
    裁判所名)) %>%
  mutate(裁判所名 = ifelse(!is.na(X1), X1, 裁判所名)) %>%
  mutate(郵便番号 = ifelse(!is.na(X2), X2, 郵便番号)) %>%
  mutate(所在地 = ifelse(!is.na(X3), X3, 所在地)) %>%
  mutate(電話番号...4 = ifelse(!is.na(X4), X4, 電話番号...4)) %>%
  mutate(電話番号...5 = ifelse(!is.na(X5), X5, 電話番号...5)) %>%
  mutate(所在地 = ifelse(
    !is.na(`郵便番号・所在地`),
    `郵便番号・所在地`,
    所在地)) %>%
  mutate(郵便番号 = ifelse(
    is.na(郵便番号),
    str_sub(所在地, 2, 9),
    郵便番号)) %>%
  mutate(所在地 = ifelse(
    str_detect(所在地, "〒"),
    str_sub(所在地, 10, 100),
    所在地)) %>%
  rename(name = 裁判所名,
         post_code = 郵便番号,
         address = 所在地,
         contact_point = 電話番号...4,
         phone = 電話番号...5) %>%
  select(name, post_code, address, contact_point, phone)
```

長いですが、使っているのは第1部で覚えた関数だけです。やっていることも単純で、`ifelse()` を使って「こっちの列が空っぽでなければ、そっちの中身を採用する」を延々と繰り返しているだけです。

1行目の `filter()` は、表の見出し行がデータとして混ざり込んだものを捨てています。見出しなのに中身として読まれた行では、裁判所名の列に「裁判所名」という文字が入っているわけです。

後半では、`所在地` の列に「〒060-0042 札幌市中央区……」のように郵便番号ごと入っているページに対応しています。`str_sub(所在地, 2, 9)` で2文字目から9文字目、つまり郵便番号の部分を取り出し、`str_sub(所在地, 10, 100)` で10文字目以降、つまり住所の部分を取り出している、という具合です。

どこまでやるかは、目的に応じて判断して下さい。照会の宛先リストにするだけなら住所と電話番号が正しければ十分ですが、地図に落とすなら住所の表記をそろえる必要がありますし、過去の一覧と突き合わせるなら裁判所名の表記を完全にそろえないといけません。きれいにする作業には終わりがないので、必要なところで止めるのがコツです。

そして、できあがったら何件か抜き出して、元のページと見比べておきましょう。50件のうち5件でいいので、目で確かめる。機械が集めたものだからといって、そのまま信じないほうがいいです。

最後に書き出して、おしまいです。

```r
court_contacts %>%
  write_excel_csv("output/裁判所連絡先.csv")
```

:::tips for文はウェブ以外でも同じ
ここで覚えたfor文は、手元のファイルにもそのまま使えます。たとえば[08章](08-bind.html)で一つずつ書いた読み込みも、こう書けます。

```r
settei <- tibble(
  file = c("data/人口データ2020.csv",
           "data/人口データ2015.csv",
           "data/人口データ2010.csv"),
  skip = c(8, 2, 5),
  encoding = c("UTF-8", "UTF-8", "CP932")
)

df <- tibble()

for (i in seq_len(nrow(settei))) {
  temp <- read_csv(settei$file[i],
                   skip = settei$skip[i],
                   locale = locale(encoding = settei$encoding[i]),
                   col_types = cols(.default = "c"))
  df <- bind_rows(df, temp)
  message(settei$file[i])
}
```

飛ばす行数がファイルごとに違うという第1部の問題を、設定そのものを表にすることで片づけています。`seq_len(nrow(settei))` は「表の行数のぶんだけ数えなさい」、`settei$file[i]` のドル記号は「この表のこの列」を指す記号です。こうしておけば、来年のデータが出たときは `settei` に1行足すだけで済みます。
:::

:::homework 宿題
前の章の宿題で見つけたページが、都道府県別や年度別に分かれていたら、リンクのリストを作ってfor文で全部集めてみて下さい。`Sys.sleep()` と `tryCatch()` を入れること。集めたら行数を数えて、想定と合っているかどうかも確かめて下さい。
:::

ところで、役所が数字を出すときには、ページに表を貼るのではなく、Excelファイルへのリンクをずらりと並べていることもあります。選挙の得票データがまさにそれです。
