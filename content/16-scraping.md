---
title: ウェブのページから表を取る
nav: 16 ウェブから表を取る
kicker: 第3部　データを集める
lead: ウェブサイトに貼られている表を、手で写さずにそのままtibbleにします。使うのはrvestというパッケージです。
---

これまでやってきたのは、すでに手元にあるデータ、誰かが分析用に整えてくれたデータを分析したり、あるいは可視化したりするといった作業でした。ただ実際には、そういった準備や下ごしらえがすんだデータが存在しない、といったことがあります。

そういうときには、データを自分で集めなくてはいけません。たとえばウェブサイトに何か表があって、これを分析したいなと思ったとしましょう。

文字や数字は確かにそこにあります。ひとつひとつ、エクセルに手入力することだってできます。が、めんどくさい。運が良ければ、表部分をエクセルにコピペしたときに、その表形式がそのままうまく保存されてくれますが、いつもそれがうまくいくとは限りません。

そういうときに役に立つのがスクレイピングです。これをやるためのいろんなパッケージがPythonにはそろっているらしいですが、実はRでもぜんぜんできちゃいます。rvestというパッケージを、まずインストールして呼び出しましょう。

```r
install.packages("rvest")   # インストールは最初の1回だけ
library(rvest)
```

## 表を読み込む

準備OK、というわけで、まず最初に裁判所のウェブサイトでやってみましょう。東京地裁の管内にある裁判所の連絡先や住所などをまとめた[ページ](https://www.courts.go.jp/tokyo/about/syozai/index.html)です。こんなコードを書きます。

```r
"https://www.courts.go.jp/tokyo/about/syozai/index.html" %>%
  read_html() %>%
  html_element("table") %>%
  html_table()
```

まず最初にURLを二重引用符つきで書いて、パイプ演算子で次に回します。受け取った `read_html()` というコマンドは、そのURLにあるhtmlの文章を丸ごと読み込みなさいという命令です。

その次にある `html_element("table")` は、受け取った文章のなかからtableつまり表になっている要素を見つけて、そこだけを抜き出しなさいという命令。さらに `html_table()` というコマンドで、その抜き出した表をtibbleに変えるというわけです。

```out outputs/16-table.txt
```

## 場所を絞り込む

で、今回はこれでうまくいきました。ただ実際には、一つのページに複数の表が載っていたりするケースもあります。

気にせずに、ページに載ってる表をぜんぶ抜き出して、そのうち必要なものだけを後から選ぶという手順もあって、それでもまあOK、ではあるんですが、もうちょっとスマートな手順もあります。`html_element()` の段階で、もっと絞り込んでしまうというやりかたです。

絞り込むにはまず、htmlのソースを確認する必要があります。ちょっとだけめんどくさいんですが、急がば回れと申しますし、なれれば実はたいした手間でもありません。

ブラウザで先ほどの[ページ](https://www.courts.go.jp/tokyo/about/syozai/index.html)を開いて、画面のどこかで右クリックすると、ウィンドーが出てきます。そのなかに「検証」とか「開発者ツールで調査する」という項目がありますよね。これを選択してください。

![右クリックしたときのメニュー。いちばん下に「検証」がある](images/16-step1.png "ページの上で右クリックすると出てくるメニュー。いちばん下の「検証」を選ぶ")

:::tips ブラウザによって名前が違う
右クリックしたときのメニューの名前は、ブラウザによって違います。

| ブラウザ | メニューの名前 |
|---|---|
| Google Chrome | 検証 |
| Microsoft Edge | 開発者ツールで調査する |
| Firefox | 調査 |
| Safari（Mac） | 要素の詳細を表示 |

英語の画面なら、どれも「Inspect」（Safariは「Inspect Element」）です。Safariだけは最初に、「Safari」→「設定」→「詳細」で「Webデベロッパ用の機能を表示」をオンにしておかないと、メニューに出てきません。

キーボードでも開けます。**F12** か **Ctrl＋Shift＋I**（Macは **Cmd＋Option＋I**）で開発者ツールが開きます。**Ctrl＋Shift＋C**（Macは **Cmd＋Shift＋C**）なら、開発者ツールが開いたうえで、ページの上でクリックしたところのコードにすぐ飛べます。右クリックができないようにしてあるサイトでも使えます。
:::

すると、右側にhtmlのコードが出てきます。右側のコードにカーソルを合わせるとサイトを表示した左側の部分に青っぽい色がついて、カーソルを移動させると青っぽい色がかかる部分も動きます。これによって、いまカーソルを合わせているコードが、ページのどこを記述しているものなのかが分かるわけです。

![開発者ツールで main の行にカーソルを合わせ、ページの本文部分が青くなっている画面](images/16-step2.png "① HTMLの行（ここでは `<main>`）にカーソルを合わせると、② ページのその部分が青くなり、名前の札も出る。③ 「…」をクリックすると、その中身が開く")

htmlのコードは最初、「折りたたまれた」状態で出てきますが、左の三角（▶）や「...」の部分をクリックすると、中身を確認できるようになっています。その作業を繰り返すことで、表に対応したコードの容器のことを示す記号`<div class="xxxxx">` というのを探します。今回の場合、xxxxxには「module-sub-page-parts-table」という名前が入っているのが分かります。

<figure class="fig">
<svg viewBox="0 0 720 1018" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="開発者ツールでHTMLの行にカーソルを合わせ、外側の容器から順に開いて、表だけを囲む容器を探す流れの模式図">
<defs><marker id="ar16" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker></defs>
<text class="f-label" x="10" y="18">左：ページ（カーソルを合わせた部分が青くなる。赤い枠が狙っている表）　右：HTMLのコード</text>
<rect class="f-cell" x="10" y="34" width="280" height="206" rx="3"/>
<rect class="f-pg" x="20" y="44" width="260" height="24" rx="3"/>
<rect class="f-pg" x="20" y="76" width="260" height="154" rx="3"/>
<rect class="f-pg" x="30" y="86" width="240" height="136" rx="3"/>
<rect class="f-pg" x="40" y="96" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="113" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="130" width="220" height="86" rx="3"/>
<text class="f-pgtext" x="28" y="60">裁判所</text>
<text class="f-pgtext" x="50" y="145">案内図を表示するには…</text>
<rect class="f-target" x="50" y="152" width="200" height="58" rx="3"/>
<rect class="f-targethead" x="51" y="153" width="198" height="14.5"/>
<line class="f-targetline" x1="50" y1="166.5" x2="250" y2="166.5"/>
<line class="f-targetline" x1="50" y1="181" x2="250" y2="181"/>
<line class="f-targetline" x1="50" y1="195.5" x2="250" y2="195.5"/>
<line class="f-targetline" x1="120" y1="166.5" x2="120" y2="210"/>
<line class="f-targetline" x1="170" y1="166.5" x2="170" y2="210"/>
<rect class="f-blue" x="10" y="34" width="280" height="206" rx="3"/>
<rect class="f-targetedge" x="50" y="152" width="200" height="58" rx="3"/>
<text class="f-targettext" x="56" y="163.5">★ 狙っている表</text>
<rect class="f-tip" x="18" y="216" width="40.8" height="20" rx="3"/>
<text class="f-tiptext" x="25" y="230">body</text>
<text class="f-label" x="310" y="48">① まず &lt;body&gt; に合わせる</text>
<text class="f-note" x="310" y="68">ページ全体が青くなる。表はこの中のどこかにある</text>
<text class="f-tri" x="316" y="102">▼</text>
<text class="f-mono" x="329" y="102">&lt;body&gt;</text>
<text class="f-tri" x="330" y="126">▶</text>
<text class="f-mono" x="343" y="126">&lt;header&gt;…&lt;/header&gt;</text>
<text class="f-tri" x="330" y="150">▶</text>
<text class="f-mono" x="343" y="150">&lt;main id="main-contents"&gt;…&lt;/main&gt;</text>
<text class="f-mono" x="329" y="174">&lt;/body&gt;</text>
<line class="f-sep" x1="10" y1="260" x2="710" y2="260"/>
<rect class="f-cell" x="10" y="270" width="280" height="206" rx="3"/>
<rect class="f-pg" x="20" y="280" width="260" height="24" rx="3"/>
<rect class="f-pg" x="20" y="312" width="260" height="154" rx="3"/>
<rect class="f-pg" x="30" y="322" width="240" height="136" rx="3"/>
<rect class="f-pg" x="40" y="332" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="349" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="366" width="220" height="86" rx="3"/>
<text class="f-pgtext" x="28" y="296">裁判所</text>
<text class="f-pgtext" x="50" y="381">案内図を表示するには…</text>
<rect class="f-target" x="50" y="388" width="200" height="58" rx="3"/>
<rect class="f-targethead" x="51" y="389" width="198" height="14.5"/>
<line class="f-targetline" x1="50" y1="402.5" x2="250" y2="402.5"/>
<line class="f-targetline" x1="50" y1="417" x2="250" y2="417"/>
<line class="f-targetline" x1="50" y1="431.5" x2="250" y2="431.5"/>
<line class="f-targetline" x1="120" y1="402.5" x2="120" y2="446"/>
<line class="f-targetline" x1="170" y1="402.5" x2="170" y2="446"/>
<rect class="f-blue" x="20" y="312" width="260" height="154" rx="3"/>
<rect class="f-targetedge" x="50" y="388" width="200" height="58" rx="3"/>
<text class="f-targettext" x="56" y="399.5">★ 狙っている表</text>
<rect class="f-tip" x="24" y="470" width="134.6" height="20" rx="3"/>
<text class="f-tiptext" x="31" y="484">main#main-contents</text>
<text class="f-label" x="310" y="284">② &lt;main&gt; に合わせる</text>
<text class="f-note" x="310" y="304">本文の部分が青くなる。表はまだこの中。「…」をクリックして開く</text>
<text class="f-tri" x="316" y="338">▼</text>
<text class="f-mono" x="329" y="338">&lt;body&gt;</text>
<text class="f-tri" x="330" y="362">▶</text>
<text class="f-mono" x="343" y="362">&lt;header&gt;…&lt;/header&gt;</text>
<rect class="f-mark3" x="310" y="370" width="400" height="22"/>
<text class="f-tri" x="330" y="386">▶</text>
<text class="f-mono" x="343" y="386">&lt;main id="main-contents"&gt;…&lt;/main&gt;</text>
<text class="f-mono" x="329" y="410">&lt;/body&gt;</text>
<circle class="f-ring" cx="511.3" cy="381" r="11"/>
<line class="f-sep" x1="10" y1="496" x2="710" y2="496"/>
<rect class="f-cell" x="10" y="506" width="280" height="206" rx="3"/>
<rect class="f-pg" x="20" y="516" width="260" height="24" rx="3"/>
<rect class="f-pg" x="20" y="548" width="260" height="154" rx="3"/>
<rect class="f-pg" x="30" y="558" width="240" height="136" rx="3"/>
<rect class="f-pg" x="40" y="568" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="585" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="602" width="220" height="86" rx="3"/>
<text class="f-pgtext" x="28" y="532">裁判所</text>
<text class="f-pgtext" x="50" y="617">案内図を表示するには…</text>
<rect class="f-target" x="50" y="624" width="200" height="58" rx="3"/>
<rect class="f-targethead" x="51" y="625" width="198" height="14.5"/>
<line class="f-targetline" x1="50" y1="638.5" x2="250" y2="638.5"/>
<line class="f-targetline" x1="50" y1="653" x2="250" y2="653"/>
<line class="f-targetline" x1="50" y1="667.5" x2="250" y2="667.5"/>
<line class="f-targetline" x1="120" y1="638.5" x2="120" y2="682"/>
<line class="f-targetline" x1="170" y1="638.5" x2="170" y2="682"/>
<rect class="f-blue" x="40" y="602" width="220" height="86" rx="3"/>
<rect class="f-targetedge" x="50" y="624" width="200" height="58" rx="3"/>
<text class="f-targettext" x="56" y="635.5">★ 狙っている表</text>
<rect class="f-tip" x="44" y="692" width="114.5" height="20" rx="3"/>
<text class="f-tiptext" x="51" y="706">div.l-container</text>
<text class="f-label" x="310" y="520">③ 開いては合わせる、をくり返す</text>
<text class="f-note" x="310" y="540">表を含む &lt;div&gt; だけを開いていく</text>
<text class="f-tri" x="316" y="574">▼</text>
<text class="f-mono" x="329" y="574">&lt;main id="main-contents"&gt;</text>
<text class="f-tri" x="330" y="598">▼</text>
<text class="f-mono" x="343" y="598">&lt;div class="l-contents"&gt;</text>
<text class="f-tri" x="344" y="622">▶</text>
<text class="f-mono" x="357" y="622">&lt;div class="l-container"&gt;…&lt;/div&gt;</text>
<text class="f-tri" x="344" y="646">▶</text>
<text class="f-mono" x="357" y="646">&lt;div class="l-container"&gt;…&lt;/div&gt;</text>
<rect class="f-mark3" x="310" y="654" width="400" height="22"/>
<text class="f-tri" x="344" y="670">▶</text>
<text class="f-mono" x="357" y="670">&lt;div class="l-container"&gt;…&lt;/div&gt;</text>
<line class="f-sep" x1="10" y1="732" x2="710" y2="732"/>
<rect class="f-cell" x="10" y="742" width="280" height="206" rx="3"/>
<rect class="f-pg" x="20" y="752" width="260" height="24" rx="3"/>
<rect class="f-pg" x="20" y="784" width="260" height="154" rx="3"/>
<rect class="f-pg" x="30" y="794" width="240" height="136" rx="3"/>
<rect class="f-pg" x="40" y="804" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="821" width="220" height="12" rx="3"/>
<rect class="f-pg" x="40" y="838" width="220" height="86" rx="3"/>
<text class="f-pgtext" x="28" y="768">裁判所</text>
<text class="f-pgtext" x="50" y="853">案内図を表示するには…</text>
<rect class="f-target" x="50" y="860" width="200" height="58" rx="3"/>
<rect class="f-targethead" x="51" y="861" width="198" height="14.5"/>
<line class="f-targetline" x1="50" y1="874.5" x2="250" y2="874.5"/>
<line class="f-targetline" x1="50" y1="889" x2="250" y2="889"/>
<line class="f-targetline" x1="50" y1="903.5" x2="250" y2="903.5"/>
<line class="f-targetline" x1="120" y1="874.5" x2="120" y2="918"/>
<line class="f-targetline" x1="170" y1="874.5" x2="170" y2="918"/>
<rect class="f-blue" x="50" y="860" width="200" height="58" rx="3"/>
<rect class="f-targetedge" x="50" y="860" width="200" height="58" rx="3"/>
<text class="f-targettext" x="56" y="871.5">★ 狙っている表</text>
<rect class="f-tip" x="54" y="922" width="221.7" height="20" rx="3"/>
<text class="f-tiptext" x="61" y="936">div.module-sub-page-parts-table</text>
<text class="f-label" x="310" y="756">④ 表だけが青くなったら、そこが目当ての容器</text>
<text class="f-note" x="310" y="776">このとき出る名前が、コードに書く場所の指定になる</text>
<text class="f-tri" x="316" y="810">▼</text>
<text class="f-mono" x="329" y="810">&lt;div class="l-container"&gt;</text>
<text class="f-mono" x="343" y="834">&lt;p&gt;案内図を表示するには…&lt;/p&gt;</text>
<rect class="f-mark3" x="310" y="842" width="400" height="22"/>
<text class="f-tri" x="330" y="858">▶</text>
<text class="f-mono" x="343" y="858">&lt;div class="module-sub-page-parts-table"&gt;…&lt;/div&gt;</text>
<text class="f-mono" x="329" y="882">&lt;/div&gt;</text>
<path class="f-arrow" d="M60 944 V992 H300" marker-end="url(#ar16)"/>
<text class="f-note" x="70" y="984">コードでは</text>
<text class="f-code" x="310" y="997">html_element("div.module-sub-page-parts-table table")</text>
</svg>
<figcaption>外側の容器から順に、カーソルを合わせては開いていく。表だけが青くなったところが目当ての容器で、そのとき出る名前を、そのままコードに使う。HTMLは、余計な部分を省いて書いています。</figcaption>
</figure>

![module-sub-page-parts-table の行にカーソルを合わせ、表だけが青くなっている画面](images/16-step3.png "実際の画面では、こうなる。① `module-sub-page-parts-table` の行に合わせると、② 表だけが青くなり、③ 「div.module-sub-page-parts-table」という札が出る")

<details class="fig-details">
<summary>操作の様子を動画で見る（約40秒、字幕つき、音声なし）</summary>
<figure class="fig">
<video controls preload="metadata" playsinline poster="images/16-css-selector.png" aria-label="裁判所のページで「検証」を開き、HTMLの行に順にカーソルを合わせて、表を囲む容器を探していく操作の動画">
<source src="images/16-css-selector.mp4" type="video/mp4">
</video>
<figcaption>東京地裁のページで「検証」を開き、HTMLの行に順にカーソルを合わせて、表を囲む容器を探していく（約40秒、音声なし）。最後に表だけが青くなったとき、ページの側に出ている「div.module-sub-page-parts-table」が、このあとコードに書く場所の指定です。</figcaption>
</figure>
</details>

つまり、スクレイピングしたい表は「module-sub-page-parts-table」と名付けられた容器（div）の中に入れられているということなのです。html全体ではなく、この容器だけを指定したうえで、その中に入っているtableを抜き出してtibbleにしなさい、というのが以下のコードです。

```r
"https://www.courts.go.jp/tokyo/about/syozai/index.html" %>%
  read_html() %>%
  html_element("div.module-sub-page-parts-table table") %>%
  html_table()
```

上記コードの3行目は、「module-sub-page-parts-tableという領域（div）の中にあるtable要素をひとつ取得する」ということを意味しています。`div.` のあとに名前を続けると「この名前のついたdiv」、そのあとに半角スペースをはさんで `table` と書くと「その中にあるtable」という意味になります。こういう書き方を「CSSセレクタ」と呼びます。細かいですが、`html_element()` ではなく `html_elements()` というコマンドを使うと、複数のtable要素を（もしあれば）とってくることができます。

## 1行目を片づける

ところで、こうやって取ってきたtibbleを見てみると、本来は列名になるべきようなデータが1行目の中身になってしまっていますね。これは元のウェブサイトにある表の「電話番号」の列名にあたる部分が2行に分かれてしまっていたからです。

列名のほうも「電話番号」が二つ並んでしまっています。同じ名前の列が二つあると、Rはこのあとの加工をさせてくれません。というわけで、まず4列目の名前を変えてから、1行目を捨てる、という順番で、少しだけクリーニングする必要があります。

```r
tokyo <- "https://www.courts.go.jp/tokyo/about/syozai/index.html" %>%
  read_html() %>%
  html_element("div.module-sub-page-parts-table table") %>%
  html_table()

tokyo %>%
  rename(担当 = 4) %>%   # 4列目の名前を「担当」に変える
  slice(-1)              # 1行目を捨てる
```

`rename()` は[05章](05-select-mutate.html)で使いましたね。あのときは古い列名を書きましたが、ここでは同じ名前が二つあって区別できないので、「左から4番目」という番号で列を指定しています。

`slice()` は、何行目を残すかを番号で指定する関数です。`slice(-1)` のようにマイナスをつけると、「1行目以外を残す」、つまり1行目を捨てるという意味になります。

```out outputs/16-clean.txt
```

:::homework 宿題
自分の担当分野の役所のサイトから、表が貼られているページを一つ探して、`html_element("table")` と `html_table()` で取れるかどうか試して下さい。うまく取れなかった場合は「検証」でソースを見て、表を囲んでいる容器の名前を調べ、`html_element()` で指定してみましょう。
:::

次の章では、東京地裁の管内だけでなく、全国の裁判所の連絡先を一気に集めます。ページごとに同じコードを書く代わりに、読みたいページのURLのリストを作って、for文で回します。
