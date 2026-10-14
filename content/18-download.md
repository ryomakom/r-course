---
title: ファイルを一括ダウンロードする
nav: 18 一括ダウンロード
kicker: 第3部　データを集める
lead: 総務省が出している衆院選の市区町村別得票データ。都道府県ごとに分かれたExcelを、リンクを拾って全部落としてきます。
---

ネット上にあるデータは、ウェブサイトに直接表示されているときもありますが、エクセルやCSVなどのファイルとして置かれている場合もあります。たとえば衆院選の市区町村別得票データは、47都道府県ごとに分かれたエクセルファイルが総務省のサイトに置かれています。

[https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin51/shikuchouson.html](https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin51/shikuchouson.html)

リンクを1個1個クリックしてダウンロードすることも、もちろんできます。でもやりたくないですよね。こういう単純作業はコンピューターにやってもらいましょう。ここでもfor文が使えます。

が、その前に、まずは一つのファイルをRのコードでダウンロードするのをやってみましょう。httrというパッケージを使います。

```r
# install.packages("httr")
library(httr)
```

たとえば北海道の小選挙区のデータが入ったエクセルファイルなら、こうやってダウンロードします。

```r
GET("https://www.soumu.go.jp/main_content/001062204.xlsx",
    write_disk("download/001062204.xlsx",
               overwrite = TRUE))
```

`GET()` は、そのURLに「このファイルを下さい」とお願いしなさい、という命令。`write_disk()` が、返ってきたものをファイルとして保存する場所の指定。`overwrite = TRUE` は、同じ名前のファイルがすでにあったら上書きしていいですよ、という意味です。なお、「download」というフォルダをあらかじめ作っておかないとエラーが出るのでご注意。

保存するファイルの名前は、URLの最後の部分（`001062204.xlsx`）と同じにしておきました。このあとfor文で全部落とすときも同じ名前で保存するので、北海道のファイルはそこで上書きされます。同じ中身のファイルが名前違いで二つたまる、ということがなくなるわけです。

## リンクの一覧をつくる

さて、ここからが本番。エクセルファイルへのリンクをまとめて取ってきます。前章と同じで、rvestを使います。

ただ、このページの表は「小選挙区」と「比例代表」の2列になっていて、比例代表のブロックごとのファイルへのリンクも並んでいます。今回ほしいのは小選挙区のほうだけなので、左の列のリンクだけを取ります。

```r
excel_urls <- "https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin51/shikuchouson.html" %>%
  read_html() %>%                         # そのページのHTMLのコードを読み込む
  html_element("table.tableList") %>%     # 最初にある <table class="tableList"> 要素を取得
  html_elements("td:first-child a") %>%   # 各行の最初のマス（小選挙区の列）にある <a> 要素を取得
  html_attr("href") %>%                   # 各リンクの href 属性（URL部分）を抽出
  url_absolute("https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin51/shikuchouson.html")

length(excel_urls)
```

4行目の `"td:first-child a"` は、[16章](16-scraping.html)で出てきたCSSセレクタの書き方です。`td` は表のマス、`:first-child` は「その行のなかで最初のもの」という意味なので、全体で「各行の最初のマスのなかにあるリンク」になります。ここを `"a"` だけにすると、比例代表の11ブロックのリンクも拾ってしまい、全部で58本になります。

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

`basename()` は、URLやファイルパスから最後の部分（＝ファイル名）だけを取り出す関数です。`https://www.soumu.go.jp/main_content/001062204.xlsx` なら `001062204.xlsx` が返ってきます。それに `download/` をくっつけて、保存先のパスにしています。

`str_c("download/", .)` の最後にあるピリオドは、パイプで渡ってきたもの（ここではファイル名）を指しています。ふつうはパイプで渡ったものがひとつ目の引数になりますが、ここではふたつ目に置きたいので、置き場所をピリオドで示しているわけです。

## 途中で止まらないようにする

47回のうち1回でも、通信のエラー（相手のサーバーにつながらない、返事が来なくて時間切れになる、など）が起きると、for文はそこで止まります。1回の失敗で最後まで走らないのは困るので、前章と同じように `tryCatch()` で囲みましょう。

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

一つ目は、`GET()` の結果を `res` に入れて、`stop_for_status(res)` にかけていること。`stop_for_status()` は、サーバーからの返事が「見つかりません」や「サーバーの調子が悪いです」といった失敗の知らせだったときに、エラーを起こしてくれる関数です。これで、リンク切れも `error = function(e)` のほうに回るようになります。

二つ目は、`error = function(e)` のなかの `unlink(filename)`。`unlink()` はファイルを削除する関数です。失敗したときには、「見つかりません」のページや、途中で切れた空っぽのファイルが `download` フォルダに残ってしまうので、それを消しています。こうしておけば、`download` フォルダに残っているのは、ちゃんと落ちてきたファイルだけになります。

全部終わったら、落ちてきたファイルを数えて確かめましょう。

```r
list.files("download")
length(list.files("download"))
```

`list.files()` は、フォルダのなかにあるファイルの名前を一覧にする関数です。47になっていますか。足りなければ、⚠️ が出たものを探して、そのファイルだけもう一度落とします。

これですべてのファイルがdownloadフォルダに保存されたはずです。手作業よりずっと楽、ですよね？
