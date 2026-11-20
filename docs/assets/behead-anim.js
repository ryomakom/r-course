// 20章の behead() で、ラベルがどう剥がされて、中身の各行に配られるかを見せるアニメーション。
// スクロールで進む（assets/scrolly.js の部品を使う）。絵（シートと整然データ）が画面に留まり、その上を段ごとの札
// （見出しと、その段で実行するコード）が流れていく。札が絵の上を通り過ぎ、絵の上端を越えて抜けたら、その段の動きを見せる。
// 1段目（はがす前のシート）には動きがないので、1枚目の札が抜けても絵はそのまま。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-behead-static）も置いてある。
//   アニメーションが組み立てられたら、そちらは隠す（印刷するときは静的な図を出す）。
// ・シートのセルの位置と中身は、files/000979550.xlsx の「東京都第７区」のとおり（D〜F列を省いている）。
//   1〜2行目と、3行目の右端の「[単位：票]」は filter() で捨てるので、3行目はA3（選挙区名）だけが残る。
// ・せまい画面（入れ物の幅が NARROW 未満）では、シートの下に整然データを置く（縦に並べる）。
//   横に並べたまま縮めると、スマホでは文字が5px ほどになって読めないため。幅が境目をまたいだら絵だけ組み立て直す。
var BEHEAD_NARROW = 600;

// コードの行。[文字, 種類] の並び。種類は 0＝ふつう、1＝向きの語、'k-…'＝列名（その列のセルと同じ色の札）。
// 札の幅を抑えるため（スマホでも字が小さくなりすぎないよう）、filter() の行は引数の切れ目で折り返し、半角36字以内にしてある
var BEHEAD_CODE = {
  load: [
    [['"download/000979550.xlsx" %>%', 0]],
    [['  xlsx_cells() %>%', 0]],
    [['  filter(sheet == "東京都第７区",', 0]],
    [['         row >= 4 | address == "A3",', 0]],
    [['         !is_blank) %>%', 0]]
  ],
  filter: [['  filter(…) %>%', 0]],
  district: [['  behead(', 0], ['"up-left"', 1], [', ', 0], ['"district"', 'k-green'], [') %>%', 0]],
  name: [['  behead(', 0], ['"up"', 1], [', ', 0], ['"name"', 'k-red'], [') %>%', 0]],
  party: [['  behead(', 0], ['"up"', 1], [', ', 0], ['"party"', 'k-blue'], [') %>%', 0]],
  municipality: [['  behead(', 0], ['"left"', 1], [', ', 0], ['"municipality"', 'k-yellow'], [')', 0]]
};
// 段ごとの札。title：見出し、sub：小さい説明（もとの段ごとの説明文）、
// code：[前からある行（ふつうの字）, その段で書き足す行（強調）]。前からある行は、どこに書き足したのかが分かるように1行だけ添える
var BEHEAD_STEPS = [
  { title: 'はがす前のシート', sub: '', code: [[], BEHEAD_CODE.load] },
  { title: '数字のセル一つが、1行になる', sub: '数字のセルが、整然データの numeric の列に1行ずつ並ぶ', code: null },
  { title: '選挙区名をはがす', code: [[BEHEAD_CODE.filter], [BEHEAD_CODE.district]],
    sub: '"up-left"：数字のセルから、いちばん上の3行目まで上がる。真上のセルは空白なので左へ進み、A3の選挙区名を district の列に入れる' },
  { title: '候補者名をはがす', code: [[BEHEAD_CODE.district], [BEHEAD_CODE.name]],
    sub: '"up"：数字のセルから見て「上」にあるラベル（候補者名）を、name の列に入れる' },
  { title: '政党名をはがす', code: [[BEHEAD_CODE.name], [BEHEAD_CODE.party]],
    sub: '"up"：その次に「上」にあるラベル（政党名）を、party の列に入れる' },
  { title: '市区町村名をはがす', code: [[BEHEAD_CODE.party], [BEHEAD_CODE.municipality]],
    sub: '"left"：数字のセルから見て「左」にあるラベル（A列）を、municipality の列に入れる' }
];

// ---- 絵（シートと整然データの SVG）を組み立てる。narrow：縦に並べるか。
// 戻り値の go(k, animate) で段 k の形にする。animate のときは、段 k-1 の完成形から、ラベルが飛んでいく動きを見せる
function beheadFigure(narrow) {
  var SVGNS = 'http://www.w3.org/2000/svg';
  // 時間（ミリ秒）。前に進む段では、まず矢印を1本ずつ出し（STEP_GAP ずつずらし、ARROW_IN かけて出す）、
  // 出そろったところ（LEAD）で、指されたラベルの写しが右の表へ飛んでいく（FLY）
  var FLY = 1000;   // スクロールで進む形では、次の札が来るまでに見終えられるよう短めにしている
  // 飛ぶときの速さの変化。動きだしをゆっくりにして（どこから飛んだか目で追えるように）、着くときもゆっくり
  var EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  var APPEAR = 250;                // 飛んでいく写しが、もとの場所で見えてくるまでの時間
  var LEAD = 650;
  var ARROW_IN = 250, STEP_GAP = 50;
  var PEEL = 0.3;                 // 剥がし終わったラベルを、もとの場所にうすく残す濃さ

  // ---- 左（せまい画面では上）：シート
  // せまい画面では、シートと整然データが一つの画面に収まるよう、セルの高さと余白を詰める
  var SX = narrow ? 4 : 10, SY = narrow ? 22 : 30, RH = narrow ? 20 : 24, GUT = 22;
  var SW = { A: 108, B: 80, C: 80 };   // B・C列は、候補者名（石川　ゆりか）がセルの右端で切れない幅
  var SCOLS = ['A', 'B', 'C'];
  var MROWS = [6, 7, 8];          // 市区町村の行（いちばん下の8行目は合計の行。R の結果にも1行ずつ入るので、そのまま見せる）
  var ROWS = [3, 4, 5].concat(MROWS);
  var LASTROW = MROWS[MROWS.length - 1];
  function sx(c) { var x = SX + GUT; for (var k = 0; k < SCOLS.indexOf(c); k++) x += SW[SCOLS[k]]; return x; }
  function sy(r) { return SY + RH * (ROWS.indexOf(r) + 1); }

  // ---- 右（せまい画面ではシートの下）：整然データ
  // せまい画面では、整然データの表はシートの下端（と矢印の説明）から44下に置く。行の数が変わっても、すき間が同じになるよう式にしている
  var TX = narrow ? 4 : 318, TY = narrow ? SY + RH * (ROWS.length + 1) + 44 : 30, TH = narrow ? 20 : 24;
  var W = narrow ? 424 : 748;      // 図の横幅（viewBox）
  // numeric の幅は、シートのB・C列（SW.B, SW.C）と同じにする。数字のセルはこの幅のままシートから右の表へ動くので、
  // 違う幅だと、シートの中で数字のセルの横にすき間ができて、別のセルのように見えてしまう
  var TCOLS = [['district', 76], ['municipality', 104], ['name', 80], ['party', 76], ['numeric', 80]];
  function tx(name) { var x = TX; for (var k = 0; k < TCOLS.length && TCOLS[k][0] !== name; k++) x += TCOLS[k][1]; return x; }
  function tw(name) { for (var k = 0; k < TCOLS.length; k++) if (TCOLS[k][0] === name) return TCOLS[k][1]; }
  function ty(i) { return TY + TH * (i + 1); }

  // シートの中身（A3の選挙区名、A列の市区町村名、4行目の候補者名、5行目の政党名、数字のセル）。B3・C3 は空白
  var DISTRICT = '東京都第７区';
  var MUNI = { 6: '港区', 7: '渋谷区', 8: '東京都第７区 合計' };
  var NAME = { B: '丸川　珠代', C: '石川　ゆりか' };
  var PARTY = { B: '自由民主党', C: '参政党' };
  var VAL = { 6: [30037, 8066], 7: [25811, 8522], 8: [55848, 16588] };
  // 数字のセルを、シートの行の順・列の順に並べる（R が返す行の順番と同じ）
  var votes = [];
  MROWS.forEach(function (r) {
    votes.push([r, 'B', String(VAL[r][0])]);
    votes.push([r, 'C', String(VAL[r][1])]);
  });

  var LAST = BEHEAD_STEPS.length - 1;
  // 色つきのセルの、左端の帯の色（CSS の f-bar-*）。図のセルとコードの語（色札 k-*）を同じ色で結ぶ
  var BAR = { 'f-mark4': 'green', 'f-mark': 'red', 'f-mark2': 'blue', 'f-mark3': 'yellow' };
  var COLCOLOR = { district: 'green', name: 'red', party: 'blue', municipality: 'yellow' };

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
  MROWS.forEach(function (r) {
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

  // ---- 矢印：前に進む段で、写しが飛んでいくあいだだけ出す（着いたら消す）。[段, 線の形（path の d）, 始点x, 始点y]
  // 数字のセル一つひとつに始点の点を打ち、そこから矢印を出す（どのセルも自分でラベルを探しにいく、と見えるように）。
  // 線が数字やラベルの文字にかぶらないよう、点は数字の右の空いたところに打ち、線はセルの辺に沿わせる。
  // 上へ行く矢印は列の右の辺を、左へ行く矢印は行の下の辺を通る（同じ列・同じ行のセルの線は、そこで1本に重なる）
  var arrows = [];
  var EDGE = 2;                   // 線を通す位置（セルの辺から内側へ）
  ['B', 'C'].forEach(function (c) {
    MROWS.forEach(function (r) {
      var x = sx(c) + SW[c] - 9, y = sy(r) + RH / 2;      // 始点（数字は左寄せなので、右端の近くは空いている）
      var vx = sx(c) + SW[c] - EDGE;                      // 列の右の辺
      var up = 'M' + x + ' ' + y + ' H' + vx + ' V';
      // up-left（選挙区名）：上端の3行目まで上がり、真上が空白なので左のA3へ（B列は少し上、C列は少し下を通す）
      arrows.push([2, up + (sy(3) + RH / 2 + (c === 'B' ? -4 : 4)) + ' H' + (sx('A') + SW.A + 1), x, y]);
      // up（候補者名）：真上のラベルの行のすぐ下まで
      arrows.push([3, up + (sy(4) + RH), x, y]);
      // up（政党名）
      arrows.push([4, up + (sy(5) + RH), x, y]);
      // left（市区町村名）：行の下の辺に沿って、左のA列へ
      arrows.push([5, 'M' + x + ' ' + y + ' V' + (sy(r) + RH - (narrow ? EDGE : EDGE + 1)) + ' H' + (sx('A') + SW.A - 3), x, y]);
    });
  });
  var LABEL_Y = sy(LASTROW) + RH + (narrow ? 15 : 18);   // 矢印の説明は、シートのすぐ下
  var arrowLabels = [
    [2, '"up-left"：上へ、空白なら左へ', sx('A') + 4, LABEL_Y],
    [3, '"up"：上のラベルへ', sx('B'), LABEL_Y],
    [4, '"up"：上のラベルへ', sx('B'), LABEL_Y],
    [5, '"left"：左のラベルへ', sx('B'), LABEL_Y]
  ];

  // ---- 組み立て
  var fig = document.createElement('figure');
  fig.className = 'fig behead-fig anim-fig';
  var svg = document.createElementNS(SVGNS, 'svg');
  // 図の高さは、整然データの表の下端か、シートの下の矢印の説明（の字の下端）の、下のほうまで。
  // 広い画面では、市区町村の行が少ないと表よりシートの下の説明のほうが下に来るので、両方を見る
  var VH = Math.max(ty(votes.length - 1) + TH, LABEL_Y + 4) + (narrow ? 4 : 14);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + VH);
  // 画面の高さに収めるときに、幅をいくつまで縮めるかを CSS で決めるための縦横比
  fig.style.setProperty('--bh-ar', (W / VH).toFixed(4));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'behead() でラベルを剥がし、数字のセルの1行ずつに配っていく様子のアニメーション');
  fig.appendChild(svg);
  var defs = document.createElementNS(SVGNS, 'defs');
  defs.innerHTML = '<marker id="bh-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">' +
                   '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--accent)"/></marker>';
  svg.appendChild(defs);

  function el(name, attrs, text) {
    var e = document.createElementNS(SVGNS, name);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (text !== undefined) e.textContent = text;
    svg.appendChild(e);
    return e;
  }
  el('text', { 'class': 'f-label', x: SX, y: narrow ? 14 : 18 }, 'Excelのシート（東京都第７区）');
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
    // 色つきのセルは、左端に濃い色の帯をつける（同じ <g> の中なので、セルといっしょに動き、いっしょにうすくなる）。
    // 右の表の列名のセルは、下の辺にその列の色の線を引く（numeric は色なし）
    var band = BAR[c.cls], under = c.cls === 'f-head' && COLCOLOR[c.text];
    if (band || under) {
      var b = document.createElementNS(SVGNS, 'rect');
      b.setAttribute('class', 'f-bar-' + (band || under));
      if (band) {
        b.setAttribute('width', 3);
        b.setAttribute('height', c.h);
      } else {
        b.setAttribute('y', c.h - 2.5);
        b.setAttribute('width', c.w);
        b.setAttribute('height', 2.5);
      }
      g.appendChild(b);
    }
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

  // ---- その段で剥がすラベル（矢印の行き先）を、その段のあいだだけ赤い枠で目立たせる（矢印が消えたあとも、次の段まで残る）。[枠を出す段, 列, 行]
  var hls = [];
  ['B', 'C'].forEach(function (c) {
    hls.push([[3], c, 4]);                                                    // 候補者名
    hls.push([[4], c, 5]);                                                    // 政党名
  });
  hls.push([[2], 'A', 3]);                                                    // 選挙区名
  MROWS.forEach(function (r) { hls.push([[5], 'A', r]); });       // 市区町村名
  var hlNodes = hls.map(function (h) {
    return { ks: h[0], e: el('rect', { 'class': 'pv-hl', x: sx(h[1]) + 1, y: sy(h[2]) + 1, width: SW[h[1]] - 2, height: RH - 2 }) };
  });

  // 矢印は、始点の点と線をひとまとめにする。order は、その段のなかで何本目か（順番に出すため）
  var perStep = {};
  var arrowNodes = arrows.map(function (a) {
    var g = document.createElementNS(SVGNS, 'g');
    g.style.opacity = 0;          // 矢印は、前に進む段で出すときまで見せない
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
    var e = el('text', { 'class': 'pv-arrow-label', x: a[2], y: a[3] }, a[1]);
    e.style.opacity = 0;
    return { k: a[0], e: e };
  });

  // ---- 動かす
  var stage = 0, timer = 0;
  function hasArrows(k) { return arrows.some(function (a) { return a[0] === k; }); }
  // 前に進んで矢印のある段へ行くときは、矢印が出そろうまでセルを動かさずに待つ
  function leadFor(to, from) { return to > from && hasArrows(to) ? LEAD : 0; }
  // delay：出すときだけ、その分（ミリ秒）遅らせる。矢印をセルごとに順番に出すのに使う
  function fade(e, on, animate, delay) {
    e.style.transition = animate ? 'opacity ' + ARROW_IN + 'ms ease ' + (on ? delay || 0 : 0) + 'ms' : 'none';
    e.style.opacity = on ? 1 : 0;
  }
  function show(k, animate) {
    var lead = leadFor(k, stage);
    nodes.forEach(function (g, i) {
      var p = cells[i].s[k], q = cells[i].s[stage];
      // 場所が変わるセル（右の表へ飛ぶ写し）だけ、矢印が出そろうのを待つ。濃さだけ変わるもの（剥がし終わったラベル）はすぐ
      var moving = p.x !== q.x || p.y !== q.y;
      var d = moving ? lead : 0;
      // 飛んでいく写しは、まずもとの場所でさっと見えてから動きだす
      var od = moving && p.o > q.o ? APPEAR : FLY;
      g.style.transition = animate ?
        'transform ' + FLY + 'ms ' + EASE + ' ' + d + 'ms, opacity ' + od + 'ms ease ' + d + 'ms' : 'none';
      g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      g.style.opacity = p.o;
    });
    hlNodes.forEach(function (h) { fade(h.e, h.ks.indexOf(k) >= 0, animate); });
    // 矢印・始点の点・矢印の説明は、前に進む段で写しが飛んでいるあいだだけ出す。写しが着いたら（go() が
    // animate なしで呼び直す）消すので、止まっている絵に矢印は残らない
    var withArrows = animate && k > stage;
    arrowNodes.forEach(function (a) { fade(a.e, withArrows && a.k === k, animate, a.order * STEP_GAP); });
    labelNodes.forEach(function (a) { fade(a.e, withArrows && a.k === k, animate); });
    stage = k;
  }
  // 動きの途中なら止める（待っているタイマーを消し、いまの段の完成形にそろえる）
  function stop() {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    show(stage, false);
  }
  // 段 k の形にする。animate のときは、段 k-1 の完成形から始めて、ラベルが飛んでいく動きを見せ、着いたら矢印を消す。
  // 前の動きの途中で来ても、いったん k-1 の完成形にそろえるので、途中の形が混ざらない
  function go(k, animate) {
    stop();
    if (!animate || k < 1) { show(k, false); return; }
    show(k - 1, false);
    svg.getBoundingClientRect();   // いまの形を確定させてから動きを始める（そうしないと、そろえた形を飛ばして動く）
    show(k, true);
    timer = setTimeout(function () { timer = 0; show(k, false); }, leadFor(k, k - 1) + FLY);
  }
  show(0, false);
  return { el: fig, go: go, stop: stop, now: function () { return stage; } };
}

// 札の中のコードを作る。前からある行はふつうの字、書き足した行は強調（.scly-new）
function beheadCode(code) {
  var pre = document.createElement('pre');
  pre.className = 'scly-code';
  function line(segs, isNew) {
    var span = document.createElement('span');
    if (isNew) span.className = 'scly-new';
    segs.forEach(function (sg) {
      var kind = sg[1];
      // 列名だけは色札にして、絵のセルと同じ色で結ぶ（向きの語は、書き足した行の強調の中で目立つので、別の色にはしない）
      var e = document.createElement('span');
      if (typeof kind === 'string') e.className = kind;
      e.textContent = sg[0];
      span.appendChild(e);
    });
    pre.appendChild(span);
    pre.appendChild(document.createTextNode('\n'));
  }
  code[0].forEach(function (segs) { line(segs, false); });
  code[1].forEach(function (segs) { line(segs, true); });
  // 最後の改行は取る（札の下に空の行ができないように）
  if (pre.lastChild) pre.removeChild(pre.lastChild);
  return pre;
}

function beheadAnim() {
  var host = document.querySelector('.behead-anim');
  if (!host || typeof Scrolly !== 'function') return;
  var narrow = host.clientWidth < BEHEAD_NARROW;
  var fig = beheadFigure(narrow);
  // 絵を入れておく枠。幅が境目をまたいだら、中の絵だけを差し替える（札や帯はそのまま）
  var box = document.createElement('div');
  box.className = 'behead-box';
  box.appendChild(fig.el);

  var steps = BEHEAD_STEPS.map(function (s) {
    var nodes = [];
    if (s.sub) {
      var p = document.createElement('p');
      p.className = 'scly-sub';
      p.textContent = s.sub;
      nodes.push(p);
    }
    if (s.code) nodes.push(beheadCode(s.code));
    return { title: s.title, nodes: nodes };
  });

  var sc = Scrolly(host, {
    className: 'behead-scly',
    label: 'behead() でラベルを1枚ずつはがす様子',
    steps: steps,
    stage: box,
    // 前の段から進んできたときだけ、ラベルが飛んでいく動きを見せる。2段以上飛ばしたとき（速いスクロール）は、
    // 途中の段は完成形にして、最後の段の動きだけを見せる。戻ったとき・開いたとき・動きを減らす設定では、完成形をすぐ出す
    onStep: function (k, prev, info) {
      fig.go(k, info.fwd && !info.reduced);
    },
    // 幅が境目をまたいだら、いまの段の完成形のまま絵を組み立て直す（動きの途中なら止める）
    onResize: function () {
      if ((host.clientWidth < BEHEAD_NARROW) === narrow) return;
      narrow = !narrow;
      var k = fig.now();
      fig.stop();
      box.removeChild(fig.el);
      fig = beheadFigure(narrow);
      box.appendChild(fig.el);
      fig.go(k, false);
    }
  });
  if (!sc) return;   // 古いブラウザでは組み立てない（静的な図のまま）
  var fallback = document.querySelector('.fig-behead-static');
  if (fallback) fallback.classList.add('is-replaced');
}

// 静的な図などページ全体が読み込まれてから組み立てる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', beheadAnim);
} else {
  beheadAnim();
}
