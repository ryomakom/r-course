// 09章の pivot_wider() / pivot_longer() で、セルがどう動くかを見せるアニメーション。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-anim-static）も置いてある。
//   アニメーションが組み立てられたら、そちらは隠す（印刷するときは静的な図を出す）。
function pivotAnim() {
  var host = document.querySelector('.pivot-anim');
  if (!host) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = reduce ? 0 : 1600;     // 一つの段の動きにかける時間（ミリ秒）
  var GAP = reduce ? 0 : 700;     // 段と段のあいだの間

  // 表の位置。縦長の「year」列と横長の「2010」列、「population」列と「2015」列が同じ場所になるようにしてある
  // （横長の「2020」列は、その右に足される）
  var X0 = 195, W0 = 90, W = 80, H = 30, TOP = 40;
  var COL = [X0, X0 + W0, X0 + W0 + W, X0 + W0 + W * 2];   // 1〜4列目の左端
  var YEAR_COL = { '2010': COL[1], '2015': COL[2], '2020': COL[3] };   // 横長で、その年が入る列
  function rowY(i) { return TOP + H * (i + 1); }  // データの i 行目の上端

  var data = [['A市', '2010', '80'], ['A市', '2015', '90'], ['A市', '2020', '100'],
              ['B市', '2010', '170'], ['B市', '2015', '180'], ['B市', '2020', '200']];
  var NYEAR = 3;   // 1自治体あたりの年の数

  // セルの定義：見た目の種類と、段ごとの位置・濃さ（0: 縦長、1: 年が列の名前になり値がその年の列へ移った途中、2: 横長）
  // 途中の段でも、どの値も正しい年の列にいるようにしてある（別の年の列に一瞬入る、ということがない）
  var cells = [];
  function add(text, kind, width, states) { cells.push({ text: text, kind: kind, w: width, s: states }); }
  function st(x, y, o) { return { x: x, y: y, o: o === undefined ? 1 : o }; }

  // 見出し
  add('region', 'head', W0, [st(COL[0], TOP), st(COL[0], TOP), st(COL[0], TOP)]);
  add('year', 'head', W, [st(COL[1], TOP), st(COL[1], TOP, 0), st(COL[1], TOP, 0)]);
  add('population', 'head', W, [st(COL[2], TOP), st(COL[2], TOP, 0), st(COL[2], TOP, 0)]);

  data.forEach(function (d, i) {
    var yr = YEAR_COL[d[1]];                           // この年が横長で入る列
    var rowFinal = d[0] === 'A市' ? 0 : 1;            // 横長での行
    var dup = (i % NYEAR !== 0);                       // 同じ自治体の2行目以降（あとで一つにまとまる）
    // 自治体名（段2で、同じ自治体の行が一つにまとまる）
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
    ]);
    // 人口 → 段1で、同じ行のままその年の列へ。段2で、まとまった行へ
    add(d[2], 'value', W, [
      st(COL[2], rowY(i)),
      st(yr, rowY(i)),
      st(yr, rowY(rowFinal))
    ]);
  });
  var LAST = 2;

  // 横長へ向かうときは、その段に着いたときの説明。縦長へ戻るときは、その段から戻る動きの説明
  var FWD = [
    '縦長の形。1行が「どこの、何年の、人口」になっている',
    '① 年の値（赤）が列の名前になり、人口の値（青）がその年の列へ移る（names_from = year, values_from = population）',
    '② 同じ自治体の行が、一つにまとまる。これで横長の形'
  ];
  var BACK = [
    '',
    '② 列の名前だった年（赤）がデータの中身へ降り、人口の値（青）が population の列へ戻る（names_to = "year", values_to = "population"）',
    '① 自治体の行が、年の数だけに分かれる'
  ];

  // ---- 組み立て
  var fig = document.createElement('figure');
  fig.className = 'fig pivot-fig anim-fig';
  var svg = document.createElementNS(SVGNS, 'svg');
  // 図の範囲。せまい画面（入れ物の幅が600px未満）では、表のあるところ（x = X0 から右へ330）だけを切り出して大きく見せる。
  // 720の幅のまま縮めると、スマホでは文字が6px ほどになって読めないため
  var VH = TOP + H * (data.length + 1) + 10;
  // 切り出したときは、本文（16px）との釣り合いをとって、図の文字（13px）が約11.5px になる幅までに抑え、中央に置く
  function fit() {
    var narrow = host.clientWidth < 600, vw = W0 + W * 3 + 16;
    svg.setAttribute('viewBox', narrow ? (X0 - 8) + ' 0 ' + vw + ' ' + VH : '0 0 720 ' + VH);
    svg.style.maxWidth = narrow ? Math.round(vw * 11.5 / 13) + 'px' : '';
    svg.style.margin = narrow ? '0 auto' : '';
  }
  fit();
  window.addEventListener('resize', fit);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'pivot_wider() と pivot_longer() で、表のセルがどう動くかを示すアニメーション');
  fig.appendChild(svg);

  var CLS = { head: 'f-head', cell: 'f-cell', year: 'f-mark', value: 'f-mark2' };
  var BAR = { year: 'f-bar-red', value: 'f-bar-blue' };   // 色のついたセルの左端に入れる帯（色の見分けがつきにくくても区別できるように）
  var nodes = cells.map(function (c) {
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'pv-cell');
    var r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('class', CLS[c.kind]);
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

  // 表の下に、いまの向きのコードを1行で出す。year と population には、セルと同じ色の札をつける。
  // 二つの向きのコードを同じ場所に重ねて置き、片方だけを見せる（切り替えても、下のボタンの位置が動かないように）
  var code = document.createElement('div');
  code.className = 'pv-call';
  function call(fn, args) {
    var c = document.createElement('code');
    c.appendChild(document.createTextNode(fn + '('));
    args.forEach(function (a, i) {
      // 引数ごとにまとめておき、せまい画面では引数の切れ目で折り返す
      var s = document.createElement('span');
      s.className = 'pv-arg';
      a.forEach(function (part) {
        if (typeof part === 'string') { s.appendChild(document.createTextNode(part)); return; }
        var k = document.createElement('span');
        k.className = part[1];
        k.textContent = part[0];
        s.appendChild(k);
      });
      s.appendChild(document.createTextNode(i < args.length - 1 ? ',' : ')'));
      c.appendChild(s);
      if (i < args.length - 1) c.appendChild(document.createTextNode(' '));
    });
    code.appendChild(c);
    return c;
  }
  var YEAR = ['year', 'k-red'], POP = ['population', 'k-blue'];
  var cWide = call('pivot_wider', [['names_from = ', YEAR], ['values_from = ', POP]]);
  var cLong = call('pivot_longer', [['cols = -region'], ['names_to = "', YEAR, '"'], ['values_to = "', POP, '"']]);
  function showCall(wide) {
    cWide.classList.toggle('is-off', !wide);
    cLong.classList.toggle('is-off', wide);
    cWide.setAttribute('aria-hidden', wide ? 'false' : 'true');
    cLong.setAttribute('aria-hidden', wide ? 'true' : 'false');
  }
  fig.appendChild(code);

  var note = document.createElement('p');
  note.className = 'pv-note';
  fig.appendChild(note);

  var bar = document.createElement('div');
  bar.className = 'pv-controls';
  var bWide = button('pivot_wider() で横長に ▶');
  var bLong = button('◀ pivot_longer() で縦長に');
  bar.appendChild(bLong);
  bar.appendChild(bWide);
  fig.appendChild(bar);

  var cap = document.createElement('figcaption');
  cap.textContent = 'ボタンを押すと、セルが動きます。数字は説明のための架空のものです。';
  fig.appendChild(cap);

  host.appendChild(fig);
  var fallback = document.querySelector('.fig-pivot-static');
  if (fallback) fallback.classList.add('is-replaced');

  function button(label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    return b;
  }

  // ---- 動かす
  var stage = 0, busy = false;
  function show(k, animate, text) {
    nodes.forEach(function (g, i) {
      var p = cells[i].s[k];
      g.style.transition = animate && DUR ? 'transform ' + DUR + 'ms ease, opacity ' + DUR + 'ms ease' : 'none';
      g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      g.style.opacity = p.o;
    });
    note.textContent = text;
    stage = k;
  }
  function buttons() {
    bWide.disabled = busy || stage === LAST;
    bLong.disabled = busy || stage === 0;
  }
  function run(to) {
    if (busy || stage === to) return;
    var forward = to > stage;
    showCall(forward);
    busy = true;
    buttons();
    (function next() {
      var k = stage + (forward ? 1 : -1);
      show(k, true, forward ? FWD[k] : BACK[stage]);
      if (k === to) {
        setTimeout(function () {
          busy = false;
          if (!forward) note.textContent = '縦長の形に戻った';
          buttons();
        }, DUR);
        return;
      }
      setTimeout(next, DUR + GAP);
    })();
  }
  bWide.addEventListener('click', function () { run(LAST); });
  bLong.addEventListener('click', function () { run(0); });
  show(0, false, FWD[0]);
  showCall(true);
  buttons();
}

// 静的な図などページ全体が読み込まれてから組み立てる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pivotAnim);
} else {
  pivotAnim();
}
