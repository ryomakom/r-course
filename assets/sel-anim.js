// 17章の「開発者ツールで、表を囲む容器を探す」流れを見せるアニメーション。
// スクロールで進む（assets/scrolly.js の部品を使う。9・16・20章と同じ作り）。絵（左にページ、右にHTMLのコード）が画面に留まり、
// その上を段ごとの札が流れていく。札が絵の上端を越えて抜けたら、その段の形にする。
// 段は5つ：<body> → <main> → 中の <div> → 表を囲む <div> → その名前をコードに使う。
// ・段が替わると、ページの青い範囲と名前の札が次の容器へ動き、右のコードは次の段のものに入れ替わる。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-sel-static）も置いてある。
//   アニメーションが組み立てられたら、そちらは隠す（印刷するときは静的な図を出す）。
// ・せまい画面（入れ物の幅が SEL_NARROW 未満）では、コードを上、ページを下に並べる（静的な図のスマホ版と同じ並び）。
//   幅が境目をまたいだら絵だけ組み立て直す。
var SEL_NARROW = 600;

// 段ごとの札。title：見出し、sub：小さい説明（静的な図の説明文を生かしている）、code：札に出すコード
var SEL_STEPS = [
  { title: 'まず <body> に合わせる', sub: 'ページ全体が青くなる。表はこの中のどこかにある' },
  { title: '<main> に合わせる', sub: '本文の部分が青くなる。表はまだこの中。「…」をクリックして開く' },
  { title: '開いては合わせる、をくり返す', sub: '表を含む <div> だけを開いていく。青い範囲が、だんだん表に近づく' },
  { title: '表だけが青くなった', sub: 'そこが目当ての容器。このとき出る名前が、コードに書く場所の指定になる' },
  { title: 'その名前を、コードに使う', sub: '名前のあとに半角スペースと table を足すと、「その中にある表」という意味になる',
    code: ['html_element(', '  "div.module-sub-page-parts-table table")'] }
];

// 段ごとの、ページの青い範囲（ページの枠の左上からの位置）と、名前の札。最後の段は4段目と同じ
var SEL_BOX = [
  { x: 0, y: 0, w: 280, h: 206, tx: 8, ty: 182, tw: 40.8, tip: 'body' },
  { x: 10, y: 42, w: 260, h: 154, tx: 14, ty: 200, tw: 134.6, tip: 'main#main-contents' },
  { x: 30, y: 96, w: 220, h: 86, tx: 34, ty: 186, tw: 114.5, tip: 'div.l-container' },
  { x: 40, y: 118, w: 200, h: 58, tx: 44, ty: 180, tw: 221.7, tip: 'div.module-sub-page-parts-table' }
];

// 段ごとの右のコード。[深さ, 三角（'▼' '▶' ''）, 文字]。hl：カーソルを合わせている行（黄色）、
// ring：「…」に丸をつける行。せまい画面では、長い行を折り返したもの（narrow）を使う
var SEL_CODE = [
  { rows: [[0, '▼', '<body>'], [1, '▶', '<header>…</header>'], [1, '▶', '<main id="main-contents">…</main>'], [0, '', '</body>']],
    hl: [0, 1] },
  { rows: [[0, '▼', '<body>'], [1, '▶', '<header>…</header>'], [1, '▶', '<main id="main-contents">…</main>'], [0, '', '</body>']],
    hl: [2, 1], ring: 2 },
  { rows: [[0, '▼', '<main id="main-contents">'], [1, '▼', '<div class="l-contents">'],
           [2, '▶', '<div class="l-container">…</div>'], [2, '▶', '<div class="l-container">…</div>'],
           [2, '▶', '<div class="l-container">…</div>']],
    hl: [4, 1] },
  { rows: [[0, '▼', '<div class="l-container">'], [1, '', '<p>案内図を表示するには…</p>'],
           [1, '▶', '<div class="module-sub-page-parts-table">…</div>'], [0, '', '</div>']],
    hl: [2, 1],
    narrow: { rows: [[0, '▼', '<div class="l-container">'], [1, '', '<p>案内図を表示するには…</p>'],
                     [1, '▶', '<div class="module-sub-page-parts-table">'], [1, '', '…</div>'], [0, '', '</div>']],
              hl: [2, 2] } }
];

// ---- 絵を組み立てる。戻り値の go(k, animate) で段 k の形にする
function selFigure(narrow) {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var DUR = 1000;                                   // 青い範囲が動く長さ（ミリ秒）
  var FADE = 450;                                   // コードが入れ替わる長さ
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 配置。広い画面：上に説明の1行、左にページ、右にコード、下に「コードでは」の行。
  // せまい画面：上に説明の1行、その下にコード、ページ、「コードでは」の行
  var L = narrow
    ? { W: 366, PX: 43, PY: 166, CX: 10, CY: 50, ROW: 24, HLX: 4, HLW: 358, VH: 444, small: true }
    : { W: 720, PX: 10, PY: 30, CX: 316, CY: 64, ROW: 24, HLX: 310, HLW: 400, VH: 300, small: false };

  function mk(tag, attrs, text, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  var fig = document.createElement('figure');
  fig.className = 'fig sel-fig anim-fig';
  var svg = mk('svg', { viewBox: '0 0 ' + L.W + ' ' + L.VH, role: 'img',
    'aria-label': '開発者ツールでHTMLの行にカーソルを合わせ、外側の容器から順に開いて、表だけを囲む容器を探す様子のアニメーション' });
  fig.style.setProperty('--sel-ar', (L.W / L.VH).toFixed(4));
  fig.appendChild(svg);
  var defs = mk('defs', {}, undefined, svg);
  defs.innerHTML = '<marker id="sel-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">' +
    '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--ink-2)"/></marker>';

  mk('text', { 'class': 'f-label', x: 4, y: 16 },
    narrow ? '上：HTMLのコード　下：ページ' : '左：ページ（カーソルを合わせた部分が青くなる）　右：HTMLのコード', svg);

  // ページ（動かない部分）
  var PX = L.PX, PY = L.PY;
  var small = L.small ? { style: 'font-size:11px' } : {};
  function at(x, y, extra) {
    var o = { x: PX + x, y: PY + y };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  mk('rect', at(0, 0, { 'class': 'f-cell', width: 280, height: 206, rx: 3 }), undefined, svg);
  [[10, 10, 260, 24], [10, 42, 260, 154], [20, 52, 240, 136], [30, 62, 220, 12], [30, 79, 220, 12], [30, 96, 220, 86]]
    .forEach(function (r) { mk('rect', at(r[0], r[1], { 'class': 'f-pg', width: r[2], height: r[3], rx: 3 }), undefined, svg); });
  mk('text', at(18, 26, small), '裁判所', svg).setAttribute('class', 'f-pgtext');
  mk('text', at(40, 111, small), '案内図を表示するには…', svg).setAttribute('class', 'f-pgtext');
  mk('rect', at(40, 118, { 'class': 'f-target', width: 200, height: 58, rx: 3 }), undefined, svg);
  mk('rect', at(41, 119, { 'class': 'f-targethead', width: 198, height: 14.5 }), undefined, svg);
  [132.5, 147, 161.5].forEach(function (y) {
    mk('line', { 'class': 'f-targetline', x1: PX + 40, y1: PY + y, x2: PX + 240, y2: PY + y }, undefined, svg);
  });
  [110, 160].forEach(function (x) {
    mk('line', { 'class': 'f-targetline', x1: PX + x, y1: PY + 132.5, x2: PX + x, y2: PY + 176 }, undefined, svg);
  });
  // 青い範囲（動く）。表の赤い枠と「狙っている表」の字は、青の上に重ねる
  var blue = mk('rect', { 'class': 'f-blue', rx: 3 }, undefined, svg);
  mk('rect', at(40, 118, { 'class': 'f-targetedge', width: 200, height: 58, rx: 3 }), undefined, svg);
  var tt = mk('text', at(46, 129.5, small), '★ 狙っている表', svg);
  tt.setAttribute('class', 'f-targettext');
  // 名前の札（動く）
  var tipG = mk('g', { 'class': 'sel-tip' }, undefined, svg);
  var tipR = mk('rect', { 'class': 'f-tip', height: 20, rx: 3 }, undefined, tipG);
  var tipT = mk('text', { 'class': 'f-tiptext' }, '', tipG);

  // 右（せまい画面では上）のコード。段ごとに一つの <g> を作っておき、見せるものだけ濃くする
  var codeG = SEL_CODE.map(function (c, k) {
    var spec = narrow && c.narrow ? c.narrow : c;
    var g = mk('g', { 'class': 'sel-code' }, undefined, svg);
    var hy = L.CY + L.ROW * spec.hl[0] - 16;
    mk('rect', { 'class': 'f-mark3', x: L.HLX, y: hy, width: L.HLW, height: L.ROW * spec.hl[1] - 2 }, undefined, g);
    var ringRow = null;
    spec.rows.forEach(function (r, i) {
      var y = L.CY + L.ROW * i;
      var x = L.CX + 14 * r[0];
      if (r[1]) mk('text', { 'class': 'f-tri', x: x, y: y, style: narrow ? 'font-size:11px' : '' }, r[1], g);
      var t = mk('text', { 'class': 'f-mono', x: x + (narrow ? 14 : 13), y: y }, r[2], g);
      if (c.ring === i) ringRow = { el: t, text: r[2], x: x + (narrow ? 14 : 13), y: y };
    });
    var ring = null;
    if (ringRow) ring = mk('circle', { 'class': 'f-ring', r: 11, cy: ringRow.y - 5 }, undefined, g);
    return { g: g, ring: ring, ringRow: ringRow };
  });

  // 最後の段：名前からコードへの矢印と、コード
  var outG = mk('g', { 'class': 'sel-out' }, undefined, svg);
  var tb = SEL_BOX[3];
  var ax = PX + tb.tx + 6, ay = PY + tb.ty + 22;
  if (narrow) {
    mk('path', { 'class': 'f-arrow', d: 'M' + ax + ' ' + ay + ' V' + (ay + 34), 'marker-end': 'url(#sel-ar)' }, undefined, outG);
    mk('text', { 'class': 'f-note', x: ax + 10, y: ay + 22 }, 'コードでは', outG);
    var c1 = mk('text', { 'class': 'f-code', x: 50, y: ay + 52 }, 'html_element(', outG);
    var c2 = mk('text', { 'class': 'f-code', x: 64, y: ay + 70 }, '"', outG);
    mk('tspan', { 'class': 'sel-hit' }, 'div.module-sub-page-parts-table', c2);
    c2.appendChild(document.createTextNode(' table")'));
  } else {
    mk('path', { 'class': 'f-arrow', d: 'M' + ax + ' ' + ay + ' V' + (ay + 48) + ' H300', 'marker-end': 'url(#sel-ar)' }, undefined, outG);
    mk('text', { 'class': 'f-note', x: ax + 10, y: ay + 40 }, 'コードでは', outG);
    var c3 = mk('text', { 'class': 'f-code', x: 310, y: ay + 53 }, 'html_element("', outG);
    mk('tspan', { 'class': 'sel-hit' }, 'div.module-sub-page-parts-table', c3);
    c3.appendChild(document.createTextNode(' table")'));
  }

  // ---- 動かす
  var now = 0, raf = 0;
  function boxOf(k) { return SEL_BOX[Math.min(k, 3)]; }
  function setBox(b, tipText, tipOp) {
    blue.setAttribute('x', PX + b.x); blue.setAttribute('y', PY + b.y);
    blue.setAttribute('width', b.w); blue.setAttribute('height', b.h);
    tipR.setAttribute('x', PX + b.tx); tipR.setAttribute('y', PY + b.ty); tipR.setAttribute('width', b.tw);
    tipT.setAttribute('x', PX + b.tx + 7); tipT.setAttribute('y', PY + b.ty + 14);
    tipT.textContent = tipText;
    tipG.style.opacity = tipOp;
  }
  // 「…」の位置に丸をつける（字の幅は、描かれてから測る。測れないときは見当で置く）
  function placeRing(c) {
    if (!c.ring) return;
    var i = c.ringRow.text.indexOf('…'), x = c.ringRow.x + i * 7.02 + 3.5;
    try {
      var a = c.ringRow.el.getStartPositionOfChar(i), b = c.ringRow.el.getEndPositionOfChar(i);
      if (b.x > a.x) x = (a.x + b.x) / 2 + 2;   // 「…」の点は字の幅の右寄りに描かれるので、少し右へ
    } catch (e) { /* 描かれていないときは見当のまま */ }
    c.ring.setAttribute('cx', x);
  }
  function setCode(k, animate) {
    var ck = Math.min(k, 3);
    codeG.forEach(function (c, i) {
      c.g.style.transition = animate ? 'opacity ' + FADE + 'ms ease' : 'none';
      c.g.style.opacity = i === ck ? 1 : 0;
      if (i === ck) placeRing(c);
    });
    outG.style.transition = animate ? 'opacity ' + FADE + 'ms ease' : 'none';
    outG.style.opacity = k >= 4 ? 1 : 0;
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    setBox(boxOf(now), boxOf(now).tip, 1);
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function go(k, animate) {
    stop();
    var from = boxOf(Math.max(k - 1, 0)), to = boxOf(k);
    now = k;
    if (!animate || reduce || k < 1 || from === to) {
      setBox(to, to.tip, 1);
      if (animate && !reduce) { setCode(k - 1 < 0 ? 0 : k - 1, false); svg.getBoundingClientRect(); setCode(k, true); }
      else setCode(k, false);
      return;
    }
    setCode(k - 1, false);
    svg.getBoundingClientRect();
    setCode(k, true);
    var t0 = 0;
    function frame(ts) {
      if (!t0) t0 = ts;
      var t = Math.min(1, (ts - t0) / DUR), e = ease(t);
      var b = {};
      ['x', 'y', 'w', 'h', 'tx', 'ty', 'tw'].forEach(function (p) { b[p] = from[p] + (to[p] - from[p]) * e; });
      // 名前の札は、動きの前半で消えて、後半で新しい名前になって出る
      setBox(b, t < .5 ? from.tip : to.tip, Math.abs(1 - 2 * t));
      raf = t < 1 ? requestAnimationFrame(frame) : 0;
    }
    raf = requestAnimationFrame(frame);
  }
  go(0, false);
  return { el: fig, go: go, stop: stop, now: function () { return now; } };
}

function selCode(lines) {
  var pre = document.createElement('pre');
  pre.className = 'scly-code';
  pre.textContent = lines.join('\n');
  return pre;
}

function selAnim() {
  var host = document.querySelector('.sel-anim');
  if (!host || typeof Scrolly !== 'function') return;
  var narrow = host.clientWidth < SEL_NARROW;
  var fig = selFigure(narrow);
  var box = document.createElement('div');
  box.className = 'sel-box';
  box.appendChild(fig.el);

  var steps = SEL_STEPS.map(function (s) {
    var nodes = [];
    var p = document.createElement('p');
    p.className = 'scly-sub';
    p.textContent = s.sub;
    nodes.push(p);
    if (s.code) nodes.push(selCode(s.code));
    return { title: s.title, nodes: nodes };
  });

  var sc = Scrolly(host, {
    className: 'sel-scly',
    label: '開発者ツールで、表を囲む容器を探す様子',
    steps: steps,
    stage: box,
    // 前の段から進んできたときだけ動きを見せる。戻ったとき・途中で開いたとき・動きを減らす設定では、完成形をすぐ出す
    onStep: function (k, prev, info) {
      fig.go(k, info.fwd && !info.reduced);
    },
    onResize: function () {
      if ((host.clientWidth < SEL_NARROW) === narrow) return;
      narrow = !narrow;
      var k = fig.now();
      fig.stop();
      box.removeChild(fig.el);
      fig = selFigure(narrow);
      box.appendChild(fig.el);
      fig.go(k, false);
    }
  });
  if (!sc) return;   // 古いブラウザでは組み立てない（静的な図のまま）
  var fallback = document.querySelector('.fig-sel-static');
  if (fallback) fallback.classList.add('is-replaced');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', selAnim);
} else {
  selAnim();
}
