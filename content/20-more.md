---
title: もっといろんなことをやるには
nav: 20 もっといろんなことを
kicker: 第4部　さらに先へ
lead: データ分析のための道具は、前章までにほぼそろいました。ここでは、その先に広がるRの世界を、私が使ったことのあるものから少しだけ紹介します。
---

データ分析のために必要なツールは、前章まででほぼすべて紹介しました。ここまでついてきた人なら、データ報道をするうえで、やりたいことのほとんどができるようになっているはずです。

とはいえ、Rでできることはまだたくさん、たくさんたくさんあります。そのすべてを紹介することはできないのですが（私自身も全貌なんて知りませんし）、どんな可能性があるのか、一部だけでもお伝えしようと思います。

## API

ウェブサイトにアクセスして、表やらファイルやらを取ってくるというのを第3部でやりました。ただ、実はもっと効率よくデータを集めてくる方法もあります。それを可能にするのがAPI。Application Programming Interfaceというものです。

ざっくり言うと、コンピューターどうしが直接、人間を介さずにコミュニケーションする窓口のようなもの、と考えてください。決まった書き方でURLを組み立てて「こういう条件のデータをください」とお願いすると、相手のサーバーがデータを送ってくれる仕組みです。

送られてくるのは、人間が見るためのウェブページではなく、XMLやJSONといった、プログラムで扱いやすい形のデータです。第3部でやったように、ページの作りを調べて表の場所を探したり、Excelファイルへのリンクをたどったりする必要がありません。ページのデザインが変わってコードが動かなくなる、という心配も（ほぼ）なくなります。

<figure class="fig xc-fig" role="img" aria-label="ファイルをダウンロードする場合とAPIを使う場合の、ウェブサイトとのやりとりのちがいを示した図。ファイルのダウンロードでは、ウェブサイトが用意したファイルを丸ごと受け取る。APIでは、こちらが条件を伝え、それに合うデータだけを受け取る">
<div class="xc-panel xc-dl">
<p class="xc-title">ファイルをダウンロードする</p>
<div class="xc-row">
<div class="xc-actor"><svg class="xc-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="9"/><path d="M6 46c0-11 8-18 18-18s18 7 18 18z"/></svg><span class="xc-name">人間</span></div>
<div class="xc-talk">
<div class="xc-msg xc-req"><span class="xc-say">「人口のファイルをください」</span></div>
<div class="xc-msg xc-res"><span class="xc-say">用意してあるファイルを丸ごと渡す</span><span class="xc-item xc-file">人口データ2020.csv<small>全国の市区町村ぶん。人が見るための表</small></span></div>
</div>
<div class="xc-actor"><svg class="xc-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="7" width="42" height="34" rx="4" class="xc-win"/><rect x="3" y="7" width="42" height="9" rx="4"/><circle cx="9" cy="11.5" r="1.6" class="xc-dot"/><circle cx="14" cy="11.5" r="1.6" class="xc-dot"/><rect x="9" y="22" width="30" height="3" rx="1.5"/><rect x="9" y="29" width="22" height="3" rx="1.5"/></svg><span class="xc-name">ウェブサイト</span><span class="xc-note">全国の人口をまとめたファイルが、あらかじめ置いてある</span></div>
</div>
<p class="xc-after">受け取ったら、表題などの行をよけて、札幌市の行を自分で探して取り出す</p>
</div>
<div class="xc-panel xc-api">
<p class="xc-title">APIを使う</p>
<div class="xc-row">
<div class="xc-actor"><svg class="xc-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="9"/><path d="M6 46c0-11 8-18 18-18s18 7 18 18z"/></svg><span class="xc-name">人間</span></div>
<div class="xc-talk">
<div class="xc-msg xc-req"><span class="xc-say">「2020年の札幌市の人口をください」</span></div>
<div class="xc-msg xc-res"><span class="xc-say">条件に合うデータだけを返す</span><span class="xc-item xc-data">札幌市｜2020年｜1973395<small>プログラムで扱いやすい形</small></span></div>
</div>
<div class="xc-actor"><svg class="xc-icon" viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="7" width="42" height="34" rx="4" class="xc-win"/><rect x="3" y="7" width="42" height="9" rx="4"/><circle cx="9" cy="11.5" r="1.6" class="xc-dot"/><circle cx="14" cy="11.5" r="1.6" class="xc-dot"/><rect x="9" y="22" width="30" height="3" rx="1.5"/><rect x="9" y="29" width="22" height="3" rx="1.5"/></svg><span class="xc-name">ウェブサイト</span><span class="xc-note">注文を受けてから、条件に合うものを探す</span></div>
</div>
<p class="xc-after">受け取ったら、そのまま分析に使える</p>
</div>
</figure>

私が使ったことのあるものだと、たとえば国会会議録検索システムのAPIがあります。国会のどの会議で、いつ、誰が、どんな発言をしたか。国立国会図書館はこうしたデータをウェブサイトで公開しています。

たとえば（めちゃめちゃ古いネタですが）昭和28年、衆院予算委員会での質疑の最中に、当時の吉田茂首相が「馬鹿野郎」とつぶやいたのがマイクに拾われました。これがきっかけになって、翌月には衆院解散にまで至りました（いわゆる「バカヤロー解散」です）。このときのやりとりもちゃんと記録に残っていて、[確認できます](https://kokkai.ndl.go.jp/txt/101505261X03119530228/267)（まあ、「馬鹿野郎」という言葉そのものは伏せ字になってますが）。

というわけで豊富なデータがあるわけですが、APIを使えば「いつ」「誰が」「どの会議で」といったさまざまな条件を指定して、**該当する発言をごっそりダウンロードする**こともできます。使い方は[公式サイト](https://kokkai.ndl.go.jp/api.html)を見てください。実際にどんな感じで使えるかは、私が使ってみたときの[コード](https://github.com/ryomakom/ldp_president)が参考になるでしょうか。

たとえば、首相が国会で「申し訳ございません」と言ったことが、2018年にどれくらいあったかを調べたいとしましょう。それなら[こんなURL](https://kokkai.ndl.go.jp/api/speech?speakerPosition=%E5%86%85%E9%96%A3%E7%B7%8F%E7%90%86%E5%A4%A7%E8%87%A3&any=%E7%94%B3%E3%81%97%E8%A8%B3%E3%81%94%E3%81%96%E3%81%84%E3%81%BE%E3%81%9B%E3%82%93&from=2018-01-01&until=2018-12-31)でお願いすることになります。

<figure class="fig fig-switch">
<svg class="svg-wide" viewBox="0 0 720 448" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="国会会議録検索システムのAPIに、肩書と言葉と期間の条件をつけたURLでお願いすると、発言のデータがXMLという形で返ってくる様子を示した図">
<defs><marker id="ar20" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="18">お願いする（リクエスト）：URLに条件を書いて送る</text>
<rect class="f-cell" x="10" y="28" width="700" height="132"/>
<text class="f-mono" x="22" y="50">https://kokkai.ndl.go.jp/api/speech?</text>
<text class="f-code" x="22" y="74">speakerPosition=内閣総理大臣</text>
<text class="f-note" x="26" y="96">肩書が「内閣総理大臣」で</text>
<text class="f-code" x="270" y="74">&amp;any=申し訳ございません</text>
<text class="f-note" x="274" y="96">この言葉を含む発言を</text>
<text class="f-code" x="22" y="128">&amp;from=2018-01-01</text>
<text class="f-note" x="26" y="150">この日から</text>
<text class="f-code" x="170" y="128">&amp;until=2018-12-31</text>
<text class="f-note" x="174" y="150">この日まで</text>
<path class="f-arrow" d="M60 166 V200" marker-end="url(#ar20)"/>
<text class="f-note" x="76" y="188">国会会議録検索システムのサーバーが、条件に合う発言を探して返してくる</text>
<text class="f-label" x="10" y="224">返ってくる（レスポンス）：プログラムで扱いやすいデータ</text>
<rect class="f-cell" x="10" y="234" width="700" height="208"/>
<text class="f-mono" x="22" y="256" style="white-space:pre">&lt;data&gt;</text>
<text class="f-mono" x="22" y="275" style="white-space:pre">  &lt;numberOfRecords&gt;6&lt;/numberOfRecords&gt;</text>
<text class="f-mono" x="22" y="294" style="white-space:pre">  …… &lt;speechRecord&gt;</text>
<text class="f-mono" x="22" y="313" style="white-space:pre">    &lt;speaker&gt;安倍晋三&lt;/speaker&gt; &lt;speakerPosition&gt;内閣総理大臣&lt;/speakerPosition&gt;</text>
<text class="f-mono" x="22" y="332" style="white-space:pre">    &lt;date&gt;2018-03-26&lt;/date&gt; &lt;nameOfHouse&gt;参議院&lt;/nameOfHouse&gt;</text>
<text class="f-mono" x="22" y="351" style="white-space:pre">    &lt;nameOfMeeting&gt;予算委員会&lt;/nameOfMeeting&gt;</text>
<text class="f-mono" x="22" y="370" style="white-space:pre">    &lt;speech&gt;○内閣総理大臣（安倍晋三君）　先ほど、質問の趣旨を取り違えまして</text>
<text class="f-mono" x="22" y="389" style="white-space:pre">            申し訳ございませんでした。……&lt;/speech&gt;</text>
<text class="f-mono" x="22" y="408" style="white-space:pre">  &lt;/speechRecord&gt; ……</text>
<text class="f-mono" x="22" y="427" style="white-space:pre">&lt;/data&gt;</text>
</svg>
<svg class="svg-narrow" style="--narrow-max: 345px" viewBox="0 0 360 586" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="国会会議録検索システムのAPIに、肩書と言葉と期間の条件をつけたURLでお願いすると、発言のデータがXMLという形で返ってくる様子を示した図">
<defs><marker id="ar20n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="4" y="18">お願いする（リクエスト）：URLに条件を書いて送る</text>
<rect class="f-cell" x="4" y="28" width="352" height="178"/>
<text class="f-mono" x="14" y="50">https://kokkai.ndl.go.jp/api/speech?</text>
<text class="f-code" x="14" y="74">speakerPosition=内閣総理大臣</text>
<text class="f-note" x="18" y="96">肩書が「内閣総理大臣」で</text>
<text class="f-code" x="14" y="124">&amp;any=申し訳ございません</text>
<text class="f-note" x="18" y="146">この言葉を含む発言を</text>
<text class="f-code" x="14" y="174">&amp;from=2018-01-01</text>
<text class="f-note" x="18" y="196">この日から</text>
<text class="f-code" x="178" y="174">&amp;until=2018-12-31</text>
<text class="f-note" x="182" y="196">この日まで</text>
<path class="f-arrow" d="M40 212 V264" marker-end="url(#ar20n)"/>
<text class="f-note" x="56" y="234">国会会議録検索システムのサーバーが、</text>
<text class="f-note" x="56" y="253">条件に合う発言を探して返してくる</text>
<text class="f-label" x="4" y="286">返ってくる（レスポンス）：プログラムで扱いやすいデータ</text>
<rect class="f-cell" x="4" y="296" width="352" height="284"/>
<text class="f-mono" x="14" y="318" style="white-space:pre">&lt;data&gt;</text>
<text class="f-mono" x="14" y="337" style="white-space:pre">  &lt;numberOfRecords&gt;6&lt;/numberOfRecords&gt;</text>
<text class="f-mono" x="14" y="356" style="white-space:pre">  …… &lt;speechRecord&gt;</text>
<text class="f-mono" x="14" y="375" style="white-space:pre">    &lt;speaker&gt;安倍晋三&lt;/speaker&gt;</text>
<text class="f-mono" x="14" y="394" style="white-space:pre">    &lt;speakerPosition&gt;内閣総理大臣</text>
<text class="f-mono" x="14" y="413" style="white-space:pre">    &lt;/speakerPosition&gt;</text>
<text class="f-mono" x="14" y="432" style="white-space:pre">    &lt;date&gt;2018-03-26&lt;/date&gt;</text>
<text class="f-mono" x="14" y="451" style="white-space:pre">    &lt;nameOfHouse&gt;参議院&lt;/nameOfHouse&gt;</text>
<text class="f-mono" x="14" y="470" style="white-space:pre">    &lt;nameOfMeeting&gt;予算委員会&lt;/nameOfMeeting&gt;</text>
<text class="f-mono" x="14" y="489" style="white-space:pre">    &lt;speech&gt;○内閣総理大臣（安倍晋三君）　</text>
<text class="f-mono" x="14" y="508" style="white-space:pre">            先ほど、質問の趣旨を取り違えまして</text>
<text class="f-mono" x="14" y="527" style="white-space:pre">            申し訳ございませんでした。……&lt;/speech&gt;</text>
<text class="f-mono" x="14" y="546" style="white-space:pre">  &lt;/speechRecord&gt; ……</text>
<text class="f-mono" x="14" y="565" style="white-space:pre">&lt;/data&gt;</text>
</svg>
<figcaption>国会会議録のAPIに、2018年に首相が「申し訳ございません」と言った発言をお願いしたところ。6件の発言が、一つずつ「誰が」「いつ」「どの会議で」「何と言ったか」の形で返ってきた（一部を省略し、見やすいように改行を入れています）。</figcaption>
</figure>

ちなみに、返ってきた6件のうち4件は、首相ではなく柳瀬唯夫・元首相秘書官の発言でした。肩書が「元内閣総理大臣秘書官」なので、条件に引っかかったわけです。APIで取ってきたデータも、中身はちゃんと確かめましょう。

それから、政府の各種統計データをダウンロードできる[e-StatのAPI](https://www.e-stat.go.jp/api/)もよく使います。これは事前に利用者登録をして、アプリケーションIDを取る必要があって、国会会議録のAPIより少しだけ面倒ですが、それでも非常に便利です。

Rには、このAPIを使うための専用パッケージ`estatapi`もあるので、ぜひ試してみてください。これさえあれば神エクセルと戦う必要がない！　tidyなデータが手間なしでゲットできる！　ありがてぇありがてぇ。すべての統計データが対応しているわけではありませんが、範囲は広がってきています。

## 地図（GIS）

それから、GIS（Geographic Information System、地理情報システム）を使った分析なんていうのもあります。平たく言うといろんなデータを地図上に表現して、何かおもしろいことが言えないかを探すこと、とお考えください。

Rでこれをやるなら、`sf`というパッケージが使えます。

`sf` は「simple features」の略で、地図の形をデータとして扱うためのパッケージです。`sf` で地図のファイルを読み込むと、おなじみのtibbleのような形になります。1行が一つの都道府県で、名前やコードの列と並んで、`geometry` という列に、その県の形（境界線の座標）が丸ごと入っているのです。

地図もtibbleなので、これまで覚えた関数がそのまま使えます。自分のデータを `left_join()` で地図にくっつけて、ggplotの `geom_sf()` で描く。たとえば、都道府県ごとの数字で色分けした地図なら、こんな形になります。

```r
library(sf)

st_read("data/prefectures.geojson") %>%    # 地図のファイルを読み込む
  left_join(pref_data, by = "pref") %>%    # 自分のデータ（都道府県コードの pref と、値の value）をくっつける
  ggplot() +
  geom_sf(aes(fill = value))               # 値で塗り分ける
```

くっつけるときは、[11章](11-join.html)でやったのと同じで、名前より都道府県コードや市区町村コードを手がかりにするのが安全です。地図のファイルは、国土交通省の「国土数値情報」や、e-Statの「地図で見る統計（統計GIS）」から、市区町村の境界まで無料で手に入ります。

色分けのほかにも、ある地点がどの市区町村に入っているかを調べたり、二つの地点の距離を測ったりと、地図ならではの計算もできます。

私はたとえば、新型コロナが大流行していた期間に死者が平常時よりどれだけ増えたのか（あるいは減ったのか）を、都道府県ごとの色分け地図をつくることで調べる、なんてことを[やりました](https://ryomakom.github.io/exdeaths/)。

<div class="exdeaths-map anim-host"></div>
<script src="assets/exdeaths-data.js"></script>
<script src="assets/exdeaths-map.js"></script>

<figure class="fig fig-exdeaths-static fig-anim-static">
<img src="images/20-exdeaths-map.png" alt="2020年、21年、22年の3枚の日本地図。都道府県ごとに、死者数が予測とどれだけ違ったかを色で示している。2020年は多くの県が青っぽく、21年は薄い赤、22年は濃い赤になっている" loading="lazy">
<figcaption>新型コロナ下の3年間に、死者数が予測をどれだけ上回ったか（下回ったか）を、人口10万人当たりで都道府県ごとに色分けした地図。2020年は予測を下回り（青）、21年は一転して上回り（赤）、22年にはその差がさらに広がった</figcaption>
</figure>

QGISという、無料のGIS分析ツールも広く使われています。このソフトなら、Excelファイルとかを取り込んでボタンをポチポチすることで、コードを書くことなく直感的な操作で地理分析ができて、これも大変便利です。ただ、**Rであればデータの分析から地図化までのすべてを、一連のコードとして表現できる**という利点があります。RやPythonでの地理分析を布教しているジャーナリストは「QGISは地理分析のExcelだ」と表現していました。

## 統計学

それから、統計学です。……と書くと身構えてしまうかもしれませんが、少しだけおつきあいください。

この講座でやってきたのは、データを集めて、整えて、足したり割ったりして、グラフにすることでした。それだけでも、記事になる発見はたくさんあります。

でも、「AとBのあいだには関係がありそうだ」と分かったときに、「それはたまたまじゃないの？」「ほかの理由で説明できるんじゃないの？」と聞かれたら、こういうツールだけでは答えきれません。そこで頼れるのが統計学です。

白状すると、私は統計学を勉強していたころ、こんなものが報道の現場で本当に役に立つとは、ほとんど思っていませんでした。まあ学ぶことは学びますがぁ、回帰分析だの検定だの、学者さんが論文を書くための道具でしょ、と。ところが意外にも、これがものすごく役に立ってしまったのです。

一つは、旧統一教会の選挙への影響を調べたときのことです。2022年の参院選比例区で教団の支援を受けた自民党の井上義行氏は、前回2019年と比べて得票を倍増させて当選しました。これは教団の支援のおかげなのか。だとしたら、票はどれくらい増えたのか。

![取材に応じる井上義行参院議員。スーツ姿で、右手を前に差し出しながら話している](images/20-inoue.jpg "井上義行参院議員＝2022年11月30日、国会内（朝日新聞）")

注目したのは、教団が信者コミュニティーの中心と位置づける「家庭教会」という施設です。施設のある自治体では信者の活動が活発なはずで、井上氏の得票の伸びも大きいのではないか。

ただ、施設のある自治体とない自治体を単純に比べると、施設の有無以外の条件の違いも混じってしまいます。そこで、施設のある259の自治体それぞれに、施設の有無以外の条件がよく似た別の自治体を組み合わせてペアをつくる「マッチング」という手法で比べました。

結果は、施設のある自治体のほうが、得票の伸びが約0.07%ポイント大きいというものでした。たったそれだけ？　と思うかもしれません。でも井上氏が挑んだのは比例区で、相手は日本の有権者全員でした。

施設のある自治体では約2380万人が投票していたので、票数にすると約1万7千票。しかもこれは統計解析で見えてきた「最低限」の数字です。自民党の比例区の候補は11万9千票あれば当選できた選挙だったので、教団の支援が魅力的だったことは明らか。過去にいろいろあった教団との関係を政治家が続けたくなる理由が、数字で見えてきたわけです。

井上氏と旧統一教会の関係は、より簡易な分析にもとづいた記事を朝日新聞に[出した](https://digital.asahi.com/articles/ASQ8K7VY0Q8CULEI001.html)あと、日本選挙学会でのポスター発表を経て、この学会の機関誌「選挙研究」に論文として載りました。データとコードは[私の個人サイト](https://github.com/ryomakom/UC_inoue2)で公開しています。

![左は「選挙研究」の表紙で、目次に「旧統一教会が参院選に与えた影響の推定」の題名と著者名がある。右は論文の最初のページで、題名と要旨が見える](images/20-uc-paper.jpg "日本選挙学会の機関誌「選挙研究」（40巻2号、2024年）に載った論文。左が表紙、右が論文の最初のページ")

もう一つは、熱中症です。2023年に、熱中症で救急搬送された人の数と気温との関係を、東京大学の疫学の先生に監修してもらいながら調べました。総務省消防庁の都道府県別・日別の搬送データに、気象庁の気温データや、収入、エアコンの保有台数といった都道府県別の統計をくっつけて、どんな要素が搬送数を左右しているのかを、重回帰分析という手法で探りました。

搬送数への影響がいちばん大きかったのは、当たり前ですが、その日の最高気温でした。でも次に効いていたのが夏の平均気温で、しかもむしろ涼しい地域ほど搬送数が多くなる、という結果だったのです。

どうやら涼しい地域の人ほど暑さに慣れておらず、同じ暑さでも熱中症になりやすい、らしい。専門家の知見とも矛盾しなかったので、これを[記事](https://digital.asahi.com/articles/DA3S15672239.html)の柱に据えました。これも分析の中身を[私の個人サイト](https://ryomakom.github.io/heat_stroke/)で公開しています。

<div class="heat-chart anim-host"></div>
<script src="assets/heat-data.js"></script>
<script src="assets/heat-chart.js"></script>

<figure class="fig fig-heat-static fig-anim-static">
<img src="images/20-heatstroke.png" alt="その日の最高気温を横軸、人口10万人あたりの熱中症の救急搬送数を縦軸にとった散布図に、3本の近似曲線を重ねたもの。夏場の平均気温で地域を三つに分けていて、涼しい地域の曲線ほど低い気温から立ち上がっている" loading="lazy">
<figcaption>その日の最高気温と、人口10万人あたりの熱中症の救急搬送数との関係。点は都道府県ごとの1日分で、線は近似曲線。夏場の平均気温が低い地域（青）ほど、同じ最高気温でも搬送が多い</figcaption>
</figure>

ついでに言うと、この「涼しい地域ほど危ない」という話は、私たちが最初から狙っていたものではありません。分析してみたら出てきたものです。統計の道具を持っていると、**データが思いもよらないことを教えてくれる**ことがあるわけです。

Rは基本的に統計解析をする研究者がよく使っているプログラミング言語です。回帰分析もマッチングも、そのためのパッケージがそろっています。この講座で身につけた「データを整える力」があれば、その先にある統計の道具にもきっと手が届くはずです。まあ、ある程度の勉強は必要ですけれど。

次が最後の章。AIの時代に、それでも自分でコードを書くことの意味を考えます。
