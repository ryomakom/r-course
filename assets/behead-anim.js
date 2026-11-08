// 19章の behead() で、ラベルがどう剥がされて、中身の各行に配られるかを見せるアニメーション。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-behead-static）も置いてある。
//   アニメーションが組み立てられたら、そちらは隠す（印刷するときは静的な図を出す）。
// ・シートのセルの位置と中身は、files/000979538.xlsx の「北海道第１区」のとおり（D〜G列を省いている）。
//   1〜2行目と、3行目の右端の「[単位：票]」は filter() で捨てるので、3行目はA3（選挙区名）だけが残る。
// ・せまい画面（入れ物の幅が NARROW 未満）では、シートの下に整然データを置く（縦に並べる）。
//   横に並べたまま縮めると、スマホでは文字が5px ほどになって読めないため。幅が境目をまたいだら組み立て直す。
var BEHEAD_NARROW = 600;
function beheadAnim(startStage) {
  var host = document.querySelector('.behead-anim');
  if (!host) return;
  var narrow = host.clientWidth < BEHEAD_NARROW;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 時間（ミリ秒）。前に進む段では、まず矢印を1本ずつ出し（STEP_GAP ずつずらし、ARROW_IN かけて出す）、
  // 出そろったところ（LEAD）で、指されたラベルの写しが右の表へ飛んでいく（FLY）
  var FLY = reduce ? 0 : 1500;
  // 飛ぶときの速さの変化。動きだしをゆっくりにして（どこから飛んだか目で追えるように）、着くときもゆっくり
  var EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  var APPEAR = 250;                // 飛んでいく写しが、もとの場所で見えてくるまでの時間
  var LEAD = reduce ? 0 : 1000;
  var ARROW_IN = 300, STEP_GAP = 60;
  var PEEL = 0.3;                 // 剥がし終わったラベルを、もとの場所にうすく残す濃さ

  // ---- 左（せまい画面では上）：シート
  // せまい画面では、ボタンとシートと整然データが一つの画面に収まるよう、セルの高さと余白を詰める
  var SX = narrow ? 4 : 10, SY = narrow ? 22 : 30, RH = narrow ? 20 : 24, GUT = 22;
  var SW = { A: 108, B: 72, C: 72 };
  var SCOLS = ['A', 'B', 'C'];
  var ROWS = [3, 4, 5, 6, 7, 8, 9, 10];
  function sx(c) { var x = SX + GUT; for (var k = 0; k < SCOLS.indexOf(c); k++) x += SW[SCOLS[k]]; return x; }
  function sy(r) { return SY + RH * (ROWS.indexOf(r) + 1); }

  // ---- 右（せまい画面ではシートの下）：整然データ
  var TX = narrow ? 4 : 302, TY = narrow ? 246 : 30, TH = narrow ? 20 : 24;
  var W = narrow ? 412 : 720;      // 図の横幅（viewBox）
  // numeric の幅は、シートのB・C列（SW.B, SW.C）と同じにする。数字のセルはこの幅のままシートから右の表へ動くので、
  // 違う幅だと、シートの中で数字のセルの横にすき間ができて、別のセルのように見えてしまう
  var TCOLS = [['district', 76], ['municipality', 104], ['name', 76], ['party', 76], ['numeric', 72]];
  function tx(name) { var x = TX; for (var k = 0; k < TCOLS.length && TCOLS[k][0] !== name; k++) x += TCOLS[k][1]; return x; }
  function tw(name) { for (var k = 0; k < TCOLS.length; k++) if (TCOLS[k][0] === name) return TCOLS[k][1]; }
  function ty(i) { return TY + TH * (i + 1); }

  // シートの中身（A3の選挙区名、A列の市区町村名、4行目の候補者名、5行目の政党名、数字のセル）。B3・C3 は空白
  var DISTRICT = '北海道第１区';
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

  var LAST = 5;
  // code: 光らせるコードの行（いくつでも）
  var STEPS = [
    { code: [0, 1], note: '' },
    { code: [], note: '数字のセル一つが、整然データの1行になる' },
    { code: [2], note: '"up-left"：数字のセルから、いちばん上の3行目まで上がる。真上のセルは空白なので左へ進み、A3の選挙区名を district の列に入れる' },
    { code: [3], note: '"up"：数字のセルから見て「上」にあるラベル（候補者名）を、name の列に入れる' },
    { code: [4], note: '"up"：その次に「上」にあるラベル（政党名）を、party の列に入れる' },
    { code: [5], note: '"left"：数字のセルから見て「左」にあるラベル（A列）を、municipality の列に入れる' }
  ];
  // コードの行。[文字, 強調するか] の並び
  var CODE = [
    [['"download/000979538.xlsx" %>% xlsx_cells() %>%', 0]],
    [['  filter(sheet == "北海道第１区", row >= 4 | address == "A3", !is_blank) %>%', 0]],
    [['  behead(', 0], ['"up-left"', 1], [', "district") %>%', 0]],
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

  // ラベルのセル。剥がしている段では矢印の先として濃いまま残し、次の段からうすくする
  // （濃いのは「いま関わっているセル」、うすいのは「剥がし終わったセル」と見分けられるように）。
  // A4・A5 も、その行といっしょに剥がされる
  add(DISTRICT, 'f-mark4', SW.A, RH, function (k) { return st(sx('A'), sy(3), k <= 2 ? 1 : PEEL); });
  add('候補者名', 'f-off', SW.A, RH, function (k) { return st(sx('A'), sy(4), k <= 3 ? 1 : PEEL); });
  add('市区町村名＼政党名', 'f-off', SW.A, RH, function (k) { return st(sx('A'), sy(5), k <= 4 ? 1 : PEEL); });
  ['B', 'C'].forEach(function (c) {
    add(NAME[c], 'f-mark', SW[c], RH, function (k) { return st(sx(c), sy(4), k <= 3 ? 1 : PEEL); });
    add(PARTY[c], 'f-mark2', SW[c], RH, function (k) { return st(sx(c), sy(5), k <= 4 ? 1 : PEEL); });
  });
  [6, 7, 8, 9, 10].forEach(function (r) {
    add(MUNI[r], 'f-mark3', SW.A, RH, function (k) { return st(sx('A'), sy(r), k <= 5 ? 1 : PEEL); });
  });

  // 数字のセルは、シートのもとの位置にも濃いまま残す（behead() が剥がすのはラベルだけ）。
  // 右の表へ飛んでいくのは、この上に重ねた写しのほう
  votes.forEach(function (v) {
    add(v[2], 'f-cell', SW[v[1]], RH, function () { return st(sx(v[1]), sy(v[0])); });
  });

  // 右の表の列名（最初からある）
  TCOLS.forEach(function (c) {
    add(c[0], 'f-head', c[1], TH, function () { return st(tx(c[0]), TY); });
  });
  // 右の表の空きマス（数字が来た行に、ほかの列の枠を出しておく）
  votes.forEach(function (v, i) {
    ['district', 'municipality', 'name', 'party'].forEach(function (col) {
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
    copy(DISTRICT, 'f-mark4', 'district', i, sx('A'), sy(3), 2);
    copy(NAME[v[1]], 'f-mark', 'name', i, sx(v[1]), sy(4), 3);
    copy(PARTY[v[1]], 'f-mark2', 'party', i, sx(v[1]), sy(5), 4);
    copy(MUNI[v[0]], 'f-mark3', 'municipality', i, sx('A'), sy(v[0]), 5);
  });

  // ---- 矢印：その段のあいだだけ出す。[段, 線の形（path の d）, 始点x, 始点y]
  // 数字のセル一つひとつから、点を始点にした矢印を出す（どのセルも自分でラベルを探しにいく、と見えるように）。
  // 同じ列のセルの矢印が重ならないよう、行ごとに少しずつ横にずらす。left は、B列を少し上、C列を少し下に通す
  var arrows = [];
  ['B', 'C'].forEach(function (c) {
    [6, 7, 8, 9, 10].forEach(function (r) {
      var x = sx(c) + 12 + (r - 6) * 12, y = sy(r) + RH / 2;
      // up-left（選挙区名）：上端の3行目まで上がり、真上が空白なので左のA3へ
      arrows.push([2, 'M' + x + ' ' + y + ' V' + (sy(3) + RH / 2) + ' H' + (sx('A') + SW.A + 2), x, y]);
      // up（候補者名）：真上のラベルの行へ
      arrows.push([3, 'M' + x + ' ' + y + ' V' + (sy(4) + RH + 2), x, y]);
      // up（政党名）
      arrows.push([4, 'M' + x + ' ' + y + ' V' + (sy(5) + RH + 2), x, y]);
      // left（市区町村名）：真横（左）のA列へ
      var lx = sx(c) + SW[c] / 2, ly = y + (c === 'B' ? -5 : 5);   // 始点はセルのまん中
      arrows.push([5, 'M' + lx + ' ' + ly + ' H' + (sx('A') + SW.A + 2), lx, ly]);
    });
  });
  var arrowLabels = [
    [2, '"up-left"：上へ、空白なら左へ', sx('A') + 4, sy(10) + RH + (narrow ? 15 : 18)],
    [3, '"up"：上のラベルへ', sx('B'), sy(10) + RH + (narrow ? 15 : 18)],
    [4, '"up"：上のラベルへ', sx('B'), sy(10) + RH + (narrow ? 15 : 18)],
    [5, '"left"：左のラベルへ', sx('B'), sy(10) + RH + (narrow ? 15 : 18)]
  ];

  // ---- 組み立て
  var fig = document.createElement('figure');
  fig.className = 'fig behead-fig anim-fig';
  var svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (ty(votes.length - 1) + TH + (narrow ? 4 : 14)));
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
  el('text', { 'class': 'f-label', x: SX, y: narrow ? 14 : 18 }, 'Excelのシート（北海道第１区）');
  el('text', { 'class': 'f-label', x: TX, y: narrow ? TY - 8 : 18 }, '整然データ');

  // シートの列名（A〜C）と行番号、空きマスの枠
  SCOLS.forEach(function (c) {
    el('rect', { 'class': 'f-head', x: sx(c), y: SY, width: SW[c], height: RH });
    el('text', { 'class': 'f-note', x: sx(c) + SW[c] / 2, y: SY + RH / 2 + 4, 'text-anchor': 'middle' }, c);
  });
  ROWS.forEach(function (r) {
    el('rect', { 'class': 'f-head', x: SX, y: sy(r), width: GUT, height: RH });
    el('text', { 'class': 'f-note', x: SX + GUT / 2, y: sy(r) + RH / 2 + 4, 'text-anchor': 'middle' }, String(r));
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

  // ---- その段で剥がすラベル（矢印の行き先）を、その段のあいだだけ赤い枠で目立たせる。[枠を出す段, 列, 行]
  var hls = [];
  ['B', 'C'].forEach(function (c) {
    hls.push([[3], c, 4]);                                                    // 候補者名
    hls.push([[4], c, 5]);                                                    // 政党名
  });
  hls.push([[2], 'A', 3]);                                                    // 選挙区名
  [6, 7, 8, 9, 10].forEach(function (r) { hls.push([[5], 'A', r]); });       // 市区町村名
  var hlNodes = hls.map(function (h) {
    return { ks: h[0], e: el('rect', { 'class': 'pv-hl', x: sx(h[1]) + 1, y: sy(h[2]) + 1, width: SW[h[1]] - 2, height: RH - 2 }) };
  });

  // 矢印は、始点の点と線をひとまとめにする。order は、その段のなかで何本目か（順番に出すため）
  var perStep = {};
  var arrowNodes = arrows.map(function (a) {
    var g = document.createElementNS(SVGNS, 'g');
    var line = document.createElementNS(SVGNS, 'path');
    line.setAttribute('class', 'pv-arrow');
    line.setAttribute('d', a[1]);
    line.setAttribute('marker-end', 'url(#bh-ar)');
    var dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('class', 'pv-dot');
    dot.setAttribute('cx', a[2]);
    dot.setAttribute('cy', a[3]);
    dot.setAttribute('r', 3);
    g.appendChild(line);
    g.appendChild(dot);
    svg.appendChild(g);
    perStep[a[0]] = (perStep[a[0]] || 0) + 1;
    return { k: a[0], e: g, order: perStep[a[0]] - 1 };
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
  // スマホでは、この帯がアニメーションの下に移って画面の下に貼りつく（CSS）。
  // そのとき、いまの段のコードの行と、何段目かも帯に出す（パソコンでは隠す。コード全体が近くに見えているので）
  var now = document.createElement('div');
  now.className = 'pv-now';
  var nowStep = document.createElement('span');
  nowStep.className = 'pv-now-step';
  var nowCode = document.createElement('code');
  nowCode.className = 'pv-now-code';
  now.appendChild(nowStep);
  now.appendChild(nowCode);
  bar.appendChild(now);
  var buttons = document.createElement('div');
  buttons.className = 'pv-buttons';
  bar.appendChild(buttons);
  function button(labelText) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = labelText;
    buttons.appendChild(b);
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
  function hasArrows(k) { return arrows.some(function (a) { return a[0] === k; }); }
  // 前に進んで矢印のある段へ行くときは、矢印が出そろうまでセルを動かさずに待つ
  function leadFor(to, from) { return to > from && hasArrows(to) ? LEAD : 0; }
  // delay：出すときだけ、その分（ミリ秒）遅らせる。矢印をセルごとに順番に出すのに使う
  function fade(e, on, animate, delay) {
    e.style.transition = animate && FLY ? 'opacity ' + ARROW_IN + 'ms ease ' + (on ? delay || 0 : 0) + 'ms' : 'none';
    e.style.opacity = on ? 1 : 0;
  }
  function show(k, animate) {
    var lead = leadFor(k, stage);
    nodes.forEach(function (g, i) {
      var p = cells[i].s[k], q = cells[i].s[stage];
      // 場所が変わるセル（右の表へ飛ぶ写し）だけ、矢印が出そろうのを待つ。濃さだけ変わるもの（剥がし終わったラベル）はすぐ
      var moving = p.x !== q.x || p.y !== q.y;
      var d = moving ? lead : 0;
      // 飛んでいく写しは、まずもとの場所でさっと見えてから動きだす（戻るときは、動きながら消える）
      var od = moving && p.o > q.o ? APPEAR : FLY;
      g.style.transition = animate && FLY ?
        'transform ' + FLY + 'ms ' + EASE + ' ' + d + 'ms, opacity ' + od + 'ms ease ' + d + 'ms' : 'none';
      g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      g.style.opacity = p.o;
    });
    hlNodes.forEach(function (h) { fade(h.e, h.ks.indexOf(k) >= 0, animate); });
    arrowNodes.forEach(function (a) { fade(a.e, a.k === k, animate, a.order * STEP_GAP); });
    labelNodes.forEach(function (a) { fade(a.e, a.k === k, animate); });
    note.textContent = STEPS[k].note;
    // 帯（スマホ用）に、いまの段のコードの行を出す。行頭の空白と行末の %>% は省く
    nowStep.textContent = (k + 1) + ' / ' + (LAST + 1);
    nowCode.innerHTML = '';
    var ids = STEPS[k].code;
    if (!ids.length) {
      nowCode.textContent = '数字のセル一つが、1行になる';
      nowCode.className = 'pv-now-code is-plain';
    } else {
      nowCode.className = 'pv-now-code';
      var segs = CODE[ids[ids.length - 1]];
      segs.forEach(function (sg, j) {
        var t = sg[0];
        if (j === 0) t = t.replace(/^\s+/, '');
        if (j === segs.length - 1) t = t.replace(/\s*%>%\s*$/, '');
        var e = document.createElement(sg[1] ? 'b' : 'span');
        if (sg[1]) e.className = 'pv-dir';
        e.textContent = t;
        nowCode.appendChild(e);
      });
    }
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
    var total = leadFor(to, stage) + FLY;
    show(to, true);
    setTimeout(function () { busy = false; show(stage, false); }, total);
  }
  bNext.addEventListener('click', function () { step(1); });
  bPrev.addEventListener('click', function () { step(-1); });
  bReset.addEventListener('click', function () { if (!busy) show(0, false); });
  show(startStage || 0, false);

  // 幅が境目をまたいだら、いまの段のまま組み立て直す
  if (host._bhResize) window.removeEventListener('resize', host._bhResize);
  host._bhResize = function () {
    if ((host.clientWidth < BEHEAD_NARROW) === narrow || busy) return;
    host.removeChild(fig);
    beheadAnim(stage);
  };
  window.addEventListener('resize', host._bhResize);
}

// 静的な図などページ全体が読み込まれてから組み立てる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { beheadAnim(); });
} else {
  beheadAnim();
}
