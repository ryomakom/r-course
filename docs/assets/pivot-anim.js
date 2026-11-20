// 09章の pivot_wider() / pivot_longer() で、セルがどう動くかを見せるアニメーション。
// スクロールで進む（assets/scrolly.js の部品を使う。トップ・20章と同じ作り）。表が画面に留まり、その上を段ごとの札
// （見出し・小さい説明・その段のコード）が流れていく。札が表の上端を越えて抜けたら、その段の動きを見せる。
// 段は5つ：縦長 → pivot_wider() の①② で横長 → pivot_longer() の①② で縦長に戻る。1段目（縦長の形）には動きがない。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-anim-static）も置いてある。
//   アニメーションが組み立てられたら、そちらは隠す（印刷するときは静的な図を出す）。

// コードの行。[文字, 色札のクラス] の並び（色札は、表のセルと同じ色で「この語がこのセル」と結ぶ）。
// 札の幅に収まるよう、引数の切れ目で折り返してある（いちばん長い行で半角39字。CSS の --scly-code-ch）
var PIVOT_YEAR = ['year', 'k-red'], PIVOT_POP = ['population', 'k-blue'];
var PIVOT_WIDER = [
  [['pivot_wider(names_from = '], PIVOT_YEAR, [',']],
  [['            values_from = '], PIVOT_POP, [')']]
];
var PIVOT_LONGER = [
  [['pivot_longer(cols = -region,']],
  [['             names_to = "'], PIVOT_YEAR, ['",']],
  [['             values_to = "'], PIVOT_POP, ['")']]
];
// 段ごとの札。title：見出し、code：その段のコード、again：前の段と同じコードの続き（薄く出す）、
// shape：その段の表の形（0: 縦長、1: 途中、2: 横長）
var PIVOT_STEPS = [
  { title: '縦長の形', shape: 0 },
  { title: '年が列の名前になる', code: PIVOT_WIDER, shape: 1 },
  { title: '行がまとまって横長に', code: PIVOT_WIDER, again: true, shape: 2 },
  { title: '行が年の数に分かれる', code: PIVOT_LONGER, shape: 1 },
  { title: '年が中身へ降りて縦長に', code: PIVOT_LONGER, again: true, shape: 0 }
];

// ---- 絵（表の SVG）を組み立てる。戻り値の go(k, animate) で段 k の形にする
function pivotFigure() {
  var SVGNS = 'http://www.w3.org/2000/svg';
  // 1段の動きの長さ（ミリ秒）。スクロールで進む形では、次の札が来るまでに見終えられるよう、トップ・20章に合わせて短めにしている
  var DUR = 1200;
  // 動きだしと着くところをゆっくりにする（20章と同じ）。どのセルがどこから来たか、目で追えるように
  var EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

  // 表の位置。縦長の「year」列と横長の「2010」列、「population」列と「2015」列が同じ場所になるようにしてある
  // （横長の「2020」列は、その右に足される）
  var X0 = 195, W0 = 90, W = 80, H = 30, TOP = 40;
  var COL = [X0, X0 + W0, X0 + W0 + W, X0 + W0 + W * 2];   // 1〜4列目の左端
  var YN = { '2010': 1, '2015': 2, '2020': 3 };   // 年ごとの濃さの番号（薄い→濃い）
  var YEAR_COL = { '2010': COL[1], '2015': COL[2], '2020': COL[3] };   // 横長で、その年が入る列
  function rowY(i) { return TOP + H * (i + 1); }  // データの i 行目の上端

  // 人口の数字は架空。ただし市の人口らしい桁にしておく（2桁や3桁だと、町内会ほどの人数に見えてしまうため）
  var data = [['A市', '2010', '48,300'], ['A市', '2015', '49,100'], ['A市', '2020', '50,200'],
              ['B市', '2010', '82,100'], ['B市', '2015', '85,400'], ['B市', '2020', '88,700']];
  var NYEAR = 3;   // 1自治体あたりの年の数

  // セルの定義：見た目の種類と、形ごとの位置・濃さ（0: 縦長、1: 年が列の名前になり値がその年の列へ移った途中、2: 横長）
  // 途中の形でも、どの値も正しい年の列にいるようにしてある（別の年の列に一瞬入る、ということがない）
  var cells = [];
  // y は年の番号（1＝2010年、2＝2015年、3＝2020年）。年のセルと、その年の人口のセルを、同じ濃さにそろえるのに使う
  function add(text, kind, width, states, y) { cells.push({ text: text, kind: kind, w: width, s: states, y: y }); }
  function st(x, y, o) { return { x: x, y: y, o: o === undefined ? 1 : o }; }

  // 見出し
  add('region', 'head', W0, [st(COL[0], TOP), st(COL[0], TOP), st(COL[0], TOP)]);
  add('year', 'head', W, [st(COL[1], TOP), st(COL[1], TOP, 0), st(COL[1], TOP, 0)]);
  add('population', 'head', W, [st(COL[2], TOP), st(COL[2], TOP, 0), st(COL[2], TOP, 0)]);

  data.forEach(function (d, i) {
    var yr = YEAR_COL[d[1]];                           // この年が横長で入る列
    var rowFinal = d[0] === 'A市' ? 0 : 1;            // 横長での行
    var dup = (i % NYEAR !== 0);                       // 同じ自治体の2行目以降（あとで一つにまとまる）
    // 自治体名（形2で、同じ自治体の行が一つにまとまる）
    add(d[0], 'cell', W0, [
      st(COL[0], rowY(i)),
      st(COL[0], rowY(i)),
      st(COL[0], rowY(rowFinal), dup ? 0 : 1)
    ]);
    // 年 → 列の名前へ上がる（同じ年の二つめは重なって消える）
    var yearDup = (i >= NYEAR);
    add(d[1], 'year', W, [
      st(COL[1], rowY(i)),
      st(yr, TOP, yearDup ? 0 : 1),
      st(yr, TOP, yearDup ? 0 : 1)
    ], YN[d[1]]);
    // 人口 → 形1で、同じ行のままその年の列へ。形2で、まとまった行へ
    add(d[2], 'value', W, [
      st(COL[2], rowY(i)),
      st(yr, rowY(i)),
      st(yr, rowY(rowFinal))
    ], YN[d[1]]);
  });

  // ---- 組み立て
  var fig = document.createElement('figure');
  fig.className = 'fig pivot-fig anim-fig';
  var svg = document.createElementNS(SVGNS, 'svg');
  // 図の範囲は、表のあるところ（x = X0 から右へ、横長の4列ぶん）だけを切り出す。
  // 画面に留める絵なので、余白の多い 720 の幅のまま置くと、表が小さくなり、枠の高さもむだに取るため。
  // 大きさ（字が本文と釣り合うところ）は CSS で決める
  var VW = W0 + W * 3 + 16, VH = TOP + H * (data.length + 1) + 10;
  svg.setAttribute('viewBox', (X0 - 8) + ' 0 ' + VW + ' ' + VH);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'pivot_wider() と pivot_longer() で、表のセルがどう動くかを示すアニメーション');
  fig.appendChild(svg);

  var CLS = { head: 'f-head', cell: 'f-cell', year: 'f-mark', value: 'f-mark2' };
  var BAR = { year: 'f-bar-red', value: 'f-bar-blue' };   // 色のついたセルの左端に入れる帯（色の見分けがつきにくくても区別できるように）
  var nodes = cells.map(function (c) {
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'pv-cell');
    var r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('class', CLS[c.kind] + (c.y ? ' f-y' + c.y : ''));
    r.setAttribute('width', c.w);
    r.setAttribute('height', H);
    var t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('x', 10);
    t.setAttribute('y', 20);
    if (c.kind === 'head') t.setAttribute('class', 'f-th');
    t.textContent = c.text;
    g.appendChild(r);
    if (BAR[c.kind]) {
      // 帯はセルと同じ <g> に入れて、セルと一緒に動かす（年が列の名前になっても、赤い帯はついたまま）
      var b = document.createElementNS(SVGNS, 'rect');
      b.setAttribute('class', BAR[c.kind]);
      b.setAttribute('width', 3);
      b.setAttribute('height', H);
      g.appendChild(b);
    }
    g.appendChild(t);
    svg.appendChild(g);
    return g;
  });

  // ---- 動かす
  var stage = 0, timer = 0;
  // 段 k の表の形にする（段と形の対応は PIVOT_STEPS の shape）
  function show(k, animate) {
    var s = PIVOT_STEPS[k].shape;
    nodes.forEach(function (g, i) {
      var p = cells[i].s[s];
      g.style.transition = animate ? 'transform ' + DUR + 'ms ' + EASE + ', opacity ' + DUR + 'ms ease' : 'none';
      g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      g.style.opacity = p.o;
    });
    stage = k;
  }
  // 動きの途中なら止める（待っているタイマーを消し、いまの段の完成形にそろえる）
  function stop() {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    show(stage, false);
  }
  // 段 k の形にする。animate のときは、段 k-1 の完成形から始めて、段 k の形へなめらかに動かす。
  // 2段以上飛ばして来ても（速いスクロール）、いったん k-1 の完成形にそろえるので、途中の形が混ざらない
  function go(k, animate) {
    stop();
    if (!animate || k < 1) { show(k, false); return; }
    show(k - 1, false);
    svg.getBoundingClientRect();   // いまの形を確定させてから動きを始める（そうしないと、そろえた形を飛ばして動く）
    show(k, true);
    timer = setTimeout(function () { timer = 0; show(k, false); }, DUR);
  }
  show(0, false);
  return { el: fig, go: go, stop: stop };
}

// 札の中のコードを作る。year と population には、セルと同じ色の札をつける。
// again（前の段と同じコードの続き）のときは、コードを薄く出す（新しく書くコードではないと分かるように）
function pivotCode(lines, again) {
  var pre = document.createElement('pre');
  pre.className = 'scly-code' + (again ? ' pv-again' : '');
  lines.forEach(function (segs, i) {
    segs.forEach(function (sg) {
      var e = document.createElement('span');
      if (sg[1]) e.className = sg[1];
      e.textContent = sg[0];
      pre.appendChild(e);
    });
    if (i < lines.length - 1) pre.appendChild(document.createTextNode('\n'));
  });
  return pre;
}

function pivotAnim() {
  var host = document.querySelector('.pivot-anim');
  if (!host || typeof Scrolly !== 'function') return;
  var fig = pivotFigure();

  var steps = PIVOT_STEPS.map(function (s) {
    var nodes = [];
    if (s.code) nodes.push(pivotCode(s.code, s.again));
    return { title: s.title, nodes: nodes };
  });

  var sc = Scrolly(host, {
    className: 'pivot-scly',
    label: 'pivot_wider() と pivot_longer() で、表のセルが動く様子',
    steps: steps,
    stage: fig.el,
    // 前の段から進んできたときだけ、セルが動くところを見せる。戻ったとき・途中で開いたとき・動きを減らす設定では、完成形をすぐ出す
    onStep: function (k, prev, info) {
      fig.go(k, info.fwd && !info.reduced);
    }
  });
  if (!sc) return;   // 古いブラウザでは組み立てない（静的な図のまま）
  var fallback = document.querySelector('.fig-pivot-static');
  if (fallback) fallback.classList.add('is-replaced');
}

// 静的な図などページ全体が読み込まれてから組み立てる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pivotAnim);
} else {
  pivotAnim();
}
