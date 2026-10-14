---
title: ファイルを一括ダウンロードする
nav: 18 一括ダウンロード
kicker: 第3部　データを集める
lead: 総務省が出している衆院選の市区町村別得票データ。都道府県ごとに分かれたExcelを、リンクを拾って全部落としてきます。
---

ネット上にあるデータは、ウェブサイトに直接表示されているときもありますが、エクセルやCSVなどのファイルとして置かれている場合もあります。たとえば衆院選の市区町村別得票データは、47都道府県ごとに分かれたエクセルファイルが総務省の[サイト](https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin50/shikuchouson.html)に置かれています。

リンクを1個1個クリックしてダウンロードすることも、もちろんできます。でもやりたくないですよね。こういう単純作業はコンピューターにやってもらいましょう。ここでもfor文が使えます。

が、その前に、まずは一つのファイルをRのコードでダウンロードするのをやってみましょう。httrというパッケージを使います。

```r
# install.packages("httr")
library(httr)
```

たとえば北海道の小選挙区のデータが入ったエクセルファイルなら、こうやってダウンロードします。

```r
GET("https://www.soumu.go.jp/main_content/000979538.xlsx",
    write_disk("download/000979538.xlsx",
               overwrite = TRUE))
```

`GET()` は、そのURLに「このファイルを下さい」とお願いしなさい、という命令。`write_disk()` が、返ってきたものをファイルとして保存する場所の指定。`overwrite = TRUE` は、同じ名前のファイルがすでにあったら上書きしていいですよ、という意味です。なお、「download」というフォルダをあらかじめ作っておかないとエラーが出るのでご注意。

保存するファイルの名前は、URLの最後の部分（`000979538.xlsx`）と同じにしておきました。

## リンクの一覧をつくる

さて、ここからが本番。エクセルファイルへのリンクをまとめて取ってきます。前章と同じで、rvestを使います。

このページの表は2列に分かれていますね。今回は比例代表ではなく小選挙区のデータだけを取りたい。なので、左の列のリンクだけを集めます。

```r
excel_urls <- "https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin50/shikuchouson.html" %>%
  read_html() %>%                         # そのページのHTMLのコードを読み込む
  html_element("table.tableList") %>%     # 最初にある <table class="tableList"> 要素を取得
  html_elements("tr") %>%                 # 表の行を全部取得
  html_element("a") %>%                   # それぞれの行から、最初の <a> 要素を1つだけ取得（＝小選挙区のほう）
  html_attr("href") %>%                   # 各リンクの href 属性（URL部分）を抽出
  url_absolute("https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin50/shikuchouson.html") %>%
  str_subset("xlsx")                      # 見出しの行（リンクがない）を除く

length(excel_urls)
```

ポイントは4行目と5行目です。`html_elements("tr")` で表の行を全部取り、`html_element("a")` でそれぞれの行から最初のリンクをひとつだけ取っています。[16章](16-scraping.html)と[17章](17-loop.html)で見たとおり、複数形の `html_elements()` は当てはまるものを全部、単数形の `html_element()` は最初のひとつを取ってきます。表のどの行も左に小選挙区のリンクがあるので、最初のリンクを取れば小選挙区のほうになるわけです。

いちばん上の見出しの行にはリンクがないので、そこだけ空っぽ（NA）が入ります。最後の `str_subset("xlsx")` では、この空っぽのやつを消すために、xlsxファイルを指すURLだけを残しなさいと命令しています。

`length(excel_urls)` が47になっていれば、47都道府県のぶんがそろっています。

## 全部落とす

あとはfor文に入れるだけです。今回はtibbleにためるのではなく、ファイルを一つ一つ保存します。

```r
for (i in seq_along(excel_urls)) {
  # リンクの末尾に書かれているファイル名を取得
  filename <- excel_urls[i] %>%
    basename() %>%
    str_c("download/", .)

  # ローカルに保存
  excel_urls[i] %>%
    GET(write_disk(filename,
                   overwrite = TRUE))

  Sys.sleep(2)   # アクセス先に過剰な負荷をかけないため、次の動作までちょっとだけ待つ
}
```

`basename()` は、URLやファイルパスから最後の部分（＝ファイル名）だけを取り出す関数です。`https://www.soumu.go.jp/main_content/000979538.xlsx` なら `000979538.xlsx` が返ってきます。その前に`str_c()`関数で `download/` という文字列をくっつけて、保存先のパスにしています。`str_c("download/", .)` の最後にあるピリオドは、パイプで渡ってきたもの（ここではファイル名）を指しています。

## 途中で止まらないようにする

47回のうち1回でも、相手のサーバーにつながらないとか、返事が来なくて時間切れになるとかいったエラーが起きると、for文はそこで止まります。1回の失敗で最後まで走らないのは困るので、前章と同じように `tryCatch()` で囲みましょう。

ただ、ややこしいことに、リンク切れのほうは `GET()` にとってはエラーになりません。ファイルがなくても、相手のサーバーは「ページが見つかりません」という案内のページを返してきます。`GET()` はそれを受け取って、`.xlsx` という名前のままきちんと保存し、何事もなかったかのように次へ進んでしまうのです。中身はExcelではないので、次の章で読もうとしたところでエラーになります。

なので、返事の中身を確かめて、「見つかりません」のような返事だったらエラーとして扱うようにします。

```r
for (i in seq_along(excel_urls)) {

  # ファイル名をリンクの末尾から取得
  filename <- excel_urls[i] %>%
    basename() %>%
    str_c("download/", .)

  tryCatch({

    # ローカルに保存
    res <- GET(excel_urls[i], write_disk(filename, overwrite = TRUE))

    # 「見つかりません」などの返事だったら、エラーにする
    stop_for_status(res)

    message(
      str_c("✅ ", filename, " をダウンロードしました。")
    )

  }, error = function(e) {

    # 失敗したときに残った、中身の正しくないファイルを消す
    unlink(filename)

    message(
      str_c(
        "⚠️ ", excel_urls[i],
        " のダウンロード中にエラーが発生しました: ",
        e$message
      )
    )

  })

  Sys.sleep(2)  # サーバーへの負荷軽減のため待機
}
```

前のコードとの違いは、全体を `tryCatch()` で囲んで、前章と同じように ✅ と ⚠️ のメッセージを出すようにしたことに加えて、二つです。

一つめは、`GET()` の結果を `res` に入れて、`stop_for_status(res)` にかけていること。`stop_for_status()` は、サーバーからの返事が「見つかりません」や「サーバーの調子が悪いです」といった失敗の知らせだったときに、エラーを起こしてくれる関数です。これで、リンク切れも `error = function(e)` のほうに回るようになります。

二つめは、`error = function(e)` のなかの `unlink(filename)`。`unlink()` はファイルを削除する関数です。失敗したときには、「見つかりません」のページや、途中で切れた空っぽのファイルが `download` フォルダに残ってしまうので、それを消しています。こうしておけば、`download` フォルダに残っているのは、ちゃんと落ちてきたファイルだけになります。

全部終わったら、落ちてきたファイルを数えて確かめましょう。

```r
list.files("download")
length(list.files("download"))
```

`list.files()` は、フォルダのなかにあるファイルの名前を一覧にする関数です。47になっていますか。足りなければ、⚠️ が出たものを探して、そのファイルだけもう一度落とします。

これですべてのファイルがdownloadフォルダに保存されたはずです。手作業よりずっと楽、ですよね？
