// 19章の behead() で、ラベルがどう剥がされて、中身の各行に配られるかを見せるアニメーション。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-behead-static）も置いてある。
//   アニメーションが組み立てられたら、そちらは隠す（印刷するときは静的な図を出す）。
// ・シートのセルの位置と中身は、files/000979538.xlsx の「北海道第１区」のとおり（D〜G列を省いている）。
function beheadAnim() {
  var host = document.querySelector('.behead-anim');
  if (!host) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = reduce ? 0 : 1600;    // 一つの段の動きにかける時間（ミリ秒）
  var PEEL = 0.3;                 // 剥がしたあと・よそへ移ったあとに、もとの場所にうすく残す濃さ

  // ---- 左：シート
  var SX = 10, SY = 30, RH = 24, GUT = 22;
  var SW = { A: 112, B: 76, C: 76 };
  var SCOLS = ['A', 'B', 'C'];
  var ROWS = [4, 5, 6, 7, 8, 9, 10];
  function sx(c) { var x = SX + GUT; for (var k = 0; k < SCOLS.indexOf(c); k++) x += SW[SCOLS[k]]; return x; }
  function sy(r) { return SY + RH * (ROWS.indexOf(r) + 1); }

  // ---- 右：整然データ
  var TX = 372, TY = 30, TH = 24;
  var TCOLS = [['municipality', 112], ['name', 76], ['party', 82], ['numeric', 76]];
  function tx(name) { var x = TX; for (var k = 0; k < TCOLS.length && TCOLS[k][0] !== name; k++) x += TCOLS[k][1]; return x; }
  function tw(name) { for (var k = 0; k < TCOLS.length; k++) if (TCOLS[k][0] === name) return TCOLS[k][1]; }
  function ty(i) { return TY + TH * (i + 1); }

  // シートの中身（A列の市区町村名、4行目の候補者名、5行目の政党名、数字のセル）
  var MUNI = { 6: '札幌市中央区', 7: '札幌市北区第１区', 8: '札幌市南区', 9: '札幌市西区第１区', 10: '北海道第１区 合計' };
  var NAME = { B: '小林　さとる', C: '道下　大樹' };
  var PARTY = { B: '日本維新の会', C: '立憲民主党' };
  var VAL = { 6: [10260, 49131], 7: [334, 1399], 8: [4480, 27833], 9: [4926, 30031], 10: [20000, 108394] };
  // 数字のセルを、シートの行の順・列の順に並べる（R が返す行の順番と同じ）
  var votes = [];
  [6, 7, 8, 9, 10].forEach(function (r) {
    votes.push([r, 'B', String(VAL[r][0])]);
    votes.push([r, 'C', String(VAL[r][1])]);
  });

  var LAST = 4;
  // code: 光らせるコードの行（いくつでも）
  var STEPS = [
    { code: [0, 1], note: 'セルがバラバラのまま。数字のセル（白）の上と左に、ラベルのセル（色つき）がある' },
    { code: [], note: '数字のセル一つが、整然データの1行になる' },
    { code: [2], note: '"up"：数字のセルから見て「上」にあるラベル（候補者名）を、name の列に入れる' },
    { code: [3], note: '"up"：その次に「上」にあるラベル（政党名）を、party の列に入れる' },
    { code: [4], note: '"left"：数字のセルから見て「左」にあるラベル（A列）を、municipality の列に入れる。いちばん下の「合計」の行も同じように配られる（あとで答え合わせに使う）' }
  ];
  // コードの行。[文字, 強調するか] の並び
  var CODE = [
    [['"download/000979538.xlsx" %>% xlsx_cells() %>%', 0]],
    [['  filter(sheet == "北海道第１区", row >= 4, !is_blank) %>%', 0]],
    [['  behead(', 0], ['"up"', 1], [', "name") %>%', 0]],
    [['  behead(', 0], ['"up"', 1], [', "party") %>%', 0]],
    [['  behead(', 0], ['"left"', 1], [', "municipality")', 0]]
  ];

  // ---- セルの定義：段ごとの位置・濃さ（0〜LAST）
  var cells = [];
  function st(x, y, o) { return { x: x, y: y, o: o === undefined ? 1 : o }; }
  function add(text, cls, w, h, fn) {
    var s = [];
    for (var k = 0; k <= LAST; k++) s.push(fn(k));
    cells.push({ text: text, cls: cls, w: w, h: h, s: s });
  }

  // ラベルのセル（剥がされると、その場にうすく残る）。A4・A5 も、その行といっしょに剥がされる
  add('候補者名', 'f-off', SW.A, RH, function (k) { return st(sx('A'), sy(4), k < 2 ? 1 : PEEL); });
  add('市区町村名＼政党名', 'f-off', SW.A, RH, function (k) { return st(sx('A'), sy(5), k < 3 ? 1 : PEEL); });
  ['B', 'C'].forEach(function (c) {
    add(NAME[c], 'f-mark', SW[c], RH, function (k) { return st(sx(c), sy(4), k < 2 ? 1 : PEEL); });
    add(PARTY[c], 'f-mark2', SW[c], RH, function (k) { return st(sx(c), sy(5), k < 3 ? 1 : PEEL); });
  });
  [6, 7, 8, 9, 10].forEach(function (r) {
    add(MUNI[r], 'f-mark3', SW.A, RH, function (k) { return st(sx('A'), sy(r), k < 4 ? 1 : PEEL); });
  });

  // 数字のセルの影。もとの位置にうすく残る（本物の下に描くので、動くまでは見えない）
  votes.forEach(function (v) {
    add(v[2], 'f-cell', SW[v[1]], RH, function () { return st(sx(v[1]), sy(v[0]), PEEL); });
  });

  // 右の表の列名（最初からある）
  TCOLS.forEach(function (c) {
    add(c[0], 'f-head', c[1], TH, function () { return st(tx(c[0]), TY); });
  });
  // 右の表の空きマス（数字が来た行に、ほかの列の枠を出しておく）
  votes.forEach(function (v, i) {
    ['municipality', 'name', 'party'].forEach(function (col) {
      add('', 'f-cell', tw(col), TH, function (k) { return st(tx(col), ty(i), k < 1 ? 0 : 1); });
    });
  });
  // 数字のセル：段1で右の表の numeric の列へ
  votes.forEach(function (v, i) {
    add(v[2], 'f-cell', tw('numeric'), TH, function (k) {
      return k < 1 ? st(sx(v[1]), sy(v[0])) : st(tx('numeric'), ty(i));
    });
  });

  // 配られるラベルのコピー：段 a より前は元のセルの上で見えず、段 a で右の表へ飛んでいく
  function copy(text, cls, col, i, srcX, srcY, a) {
    add(text, cls, tw(col), TH, function (k) {
      return k < a ? st(srcX, srcY, 0) : st(tx(col), ty(i));
    });
  }
  votes.forEach(function (v, i) {
    copy(NAME[v[1]], 'f-mark', 'name', i, sx(v[1]), sy(4), 2);
    copy(PARTY[v[1]], 'f-mark2', 'party', i, sx(v[1]), sy(5), 3);
    copy(MUNI[v[0]], 'f-mark3', 'municipality', i, sx('A'), sy(v[0]), 4);
  });

  // ---- 矢印：その段のあいだだけ出す。[段, 線の形（path の d）]
  var arrows = [];
  function mid(c) { return sx(c) + SW[c] / 2; }
  ['B', 'C'].forEach(function (c) {
    // up（候補者名）：数字のセルから、真上のラベルの行へ
    arrows.push([2, 'M' + mid(c) + ' ' + (sy(10) + RH - 4) + ' V' + (sy(4) + RH + 2)]);
    // up（政党名）
    arrows.push([3, 'M' + mid(c) + ' ' + (sy(10) + RH - 4) + ' V' + (sy(5) + RH + 2)]);
  });
  // left：数字のセルから、真横（左）のA列へ
  [6, 7, 8, 9, 10].forEach(function (r) {
    arrows.push([4, 'M' + (sx('C') + SW.C - 6) + ' ' + (sy(r) + RH / 2) + ' H' + (sx('A') + SW.A + 2)]);
  });
  var arrowLabels = [
    [2, '"up"：上のラベルへ', sx('B'), sy(10) + RH + 18],
    [3, '"up"：上のラベルへ', sx('B'), sy(10) + RH + 18],
    [4, '"left"：左のラベルへ', sx('B'), sy(10) + RH + 18]
  ];

  // ---- 組み立て
  var fig = document.createElement('figure');
  fig.className = 'fig behead-fig anim-fig';
  var svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 720 ' + (ty(votes.length - 1) + TH + 14));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'behead() でラベルを剥がし、数字のセルの1行ずつに配っていく様子のアニメーション');
  fig.appendChild(svg);
  var defs = document.createElementNS(SVGNS, 'defs');
  defs.innerHTML = '<marker id="bh-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
                   '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--accent)"/></marker>';
  svg.appendChild(defs);

  function el(name, attrs, text) {
    var e = document.createElementNS(SVGNS, name);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (text !== undefined) e.textContent = text;
    svg.appendChild(e);
    return e;
  }
  el('text', { 'class': 'f-label', x: SX, y: 18 }, 'Excelのシート（北海道第１区）');
  el('text', { 'class': 'f-label', x: TX, y: 18 }, '整然データ');

  // シートの列名（A〜C）と行番号、空きマスの枠
  SCOLS.forEach(function (c) {
    el('rect', { 'class': 'f-head', x: sx(c), y: SY, width: SW[c], height: RH });
    el('text', { 'class': 'f-note', x: sx(c) + SW[c] / 2, y: SY + 16, 'text-anchor': 'middle' }, c);
  });
  ROWS.forEach(function (r) {
    el('rect', { 'class': 'f-head', x: SX, y: sy(r), width: GUT, height: RH });
    el('text', { 'class': 'f-note', x: SX + GUT / 2, y: sy(r) + 16, 'text-anchor': 'middle' }, String(r));
    SCOLS.forEach(function (c) {
      el('rect', { 'class': 'f-gone', x: sx(c), y: sy(r), width: SW[c], height: RH });
    });
  });

  var nodes = cells.map(function (c) {
    var g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'pv-cell');
    var r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('class', c.cls);
    r.setAttribute('width', c.w);
    r.setAttribute('height', c.h);
    g.appendChild(r);
    if (c.text) {
      var t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', 5);
      t.setAttribute('y', c.h / 2 + 4);
      t.setAttribute('class', c.cls === 'f-head' ? 'f-th pv-small' : 'pv-small');
      t.textContent = c.text;
      g.appendChild(t);
    }
    svg.appendChild(g);
    return g;
  });

  var arrowNodes = arrows.map(function (a) {
    return { k: a[0], e: el('path', { 'class': 'pv-arrow', d: a[1], 'marker-end': 'url(#bh-ar)' }) };
  });
  var labelNodes = arrowLabels.map(function (a) {
    return { k: a[0], e: el('text', { 'class': 'pv-arrow-label', x: a[2], y: a[3] }, a[1]) };
  });

  var note = document.createElement('p');
  note.className = 'pv-note';
  fig.appendChild(note);

  var code = document.createElement('pre');
  code.className = 'pv-code';
  var lines = CODE.map(function (segs) {
    var line = document.createElement('span');
    segs.forEach(function (sg) {
      var span = document.createElement(sg[1] ? 'b' : 'span');
      if (sg[1]) span.className = 'pv-dir';
      span.textContent = sg[0];
      line.appendChild(span);
    });
    code.appendChild(line);
    code.appendChild(document.createTextNode('\n'));
    return line;
  });
  fig.appendChild(code);

  var bar = document.createElement('div');
  bar.className = 'pv-controls';
  function button(labelText) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = labelText;
    bar.appendChild(b);
    return b;
  }
  var bReset = button('↺ 最初から');
  var bPrev = button('◀ 戻る');
  var bNext = button('次へ ▶');
  fig.insertBefore(bar, svg);     // ボタンはアニメーションの上に置く

  host.appendChild(fig);
  var fallback = document.querySelector('.fig-behead-static');
  if (fallback) fallback.classList.add('is-replaced');

  // ---- 動かす
  var stage = 0, busy = false;
  function fade(e, on, animate) {
    e.style.transition = animate && DUR ? 'opacity ' + (DUR / 2) + 'ms ease' : 'none';
    e.style.opacity = on ? 1 : 0;
  }
  function show(k, animate) {
    nodes.forEach(function (g, i) {
      var p = cells[i].s[k];
      g.style.transition = animate && DUR ? 'transform ' + DUR + 'ms ease, opacity ' + DUR + 'ms ease' : 'none';
      g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      g.style.opacity = p.o;
    });
    arrowNodes.forEach(function (a) { fade(a.e, a.k === k, animate); });
    labelNodes.forEach(function (a) { fade(a.e, a.k === k, animate); });
    note.textContent = STEPS[k].note;
    // いまの段のコードは光らせ、それより前の段で済んだコードはうすくする
    var done = [];
    for (var s = 0; s < k; s++) done = done.concat(STEPS[s].code);
    lines.forEach(function (line, j) {
      line.className = STEPS[k].code.indexOf(j) >= 0 ? 'is-now' : (done.indexOf(j) >= 0 ? 'is-done' : '');
    });
    stage = k;
    bNext.disabled = busy || stage === LAST;
    bPrev.disabled = busy || stage === 0;
    bReset.disabled = busy || stage === 0;
  }
  // 1段だけ動かす（+1 で次へ、-1 で戻る）。戻るときは、配ったコピーが元のラベルへ帰っていく
  function step(d) {
    var to = stage + d;
    if (busy || to < 0 || to > LAST) return;
    busy = true;
    show(to, true);
    setTimeout(function () { busy = false; show(stage, false); }, DUR);
  }
  bNext.addEventListener('click', function () { step(1); });
  bPrev.addEventListener('click', function () { step(-1); });
  bReset.addEventListener('click', function () { if (!busy) show(0, false); });
  show(0, false);
}

// 静的な図などページ全体が読み込まれてから組み立てる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', beheadAnim);
} else {
  beheadAnim();
}
