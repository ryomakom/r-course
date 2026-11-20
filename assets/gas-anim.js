// 16章の冒頭で、記事のもとになった発見を、スクロールしながら一つずつ見せるグラフ。
// スクロールで進む（assets/scrolly.js の部品を使う。トップ・9章・20章と同じ作り）。グラフが画面に留まり、その上を段ごとの札
// （見出しと短い説明）が流れていく。札がグラフの上端を越えて抜けたら、その段の見せ方（見る範囲と、印）に切り替える。
// 段は5つ：全体（高知が高いほうにいる）→ 平らな期間1 → 平らな期間2 → 信濃毎日新聞の報道 → 急落して全国平均より安く。
// ・データは assets/gas-data.js（make-figures.R の16章のところが書き出す）。
// ・グラフは SVG で、実際の幅（ピクセル）のまま描く（スマホでも字が小さくなりすぎないように）。幅が変わったら描き直す。
// ・折れ線は、日数と円の座標で一度だけ描き、見る範囲が変わるときは、線をまとめた入れ物の拡大・移動（transform）だけを変える
//   （コマごとに48本の線を描き直すと、スマホで動きがかくかくするため）。線の太さは vector-effect で変わらないようにしている。
// ・高知の線を引いて見せる動きは、線の頭から引いた先までの線を、コマごとに描き直して行う
//   （stroke-dasharray と pathLength を使うやり方は、iPhone の Safari で、左から順に引かれず途中から出ることがあるため）。
// ・見る範囲（横軸の期間と縦軸の幅）が変わるときは、なめらかに寄ったり引いたりする。戻ったときも同じ。動きを減らす設定では、すぐに切り替える。
// ・高知の線の上には点が一つ乗っていて、段ごとに時を追って右へ進む（日付と価格を添える）。1段目は線を引く先を進み、
//   2・3段目は平らな期間を端から端へ、4段目は報道の週へ、5段目は5月19日でいったん止まってから、急に下がって年末まで。
//   戻ったときは、その段の始めから進め直す。動きを減らす設定では、その段の終わりの位置にすぐ置く。
// ・外部のライブラリは使わない。
// ・ページには、スクリプトが動かないとき用の静的な図（.fig-gas-static）も置いてある。組み立てられたら、そちらは隠す（印刷では静的な図を出す）。

// 見る範囲。x0・x1 は日付、y0・y1 は円、yt は縦軸の目盛りの間隔
var GAS_VIEWS = [
  { x0: '2018-12-01', x1: '2026-10-01', y0: 110, y1: 230, yt: 20 },   // 全体
  { x0: '2022-01-01', x1: '2025-01-01', y0: 155, y1: 195, yt: 10 },   // 平らな二つの期間
  { x0: '2024-10-01', x1: '2026-09-15', y0: 145, y1: 205, yt: 10 }    // 報道のあと（2026年3月の、沖縄などの一時的な跳ね上がりは上が切れる）
];

// 段ごとの札と見せ方。view：見る範囲、on：出す印、dim：薄く残す印、draw：高知の線を引いて見せる段
// ride：高知の線の上の点を、どこからどこへ進めるか。[から, まで, ミリ秒] を順に。数だけのものは、その長さ（ミリ秒）だけ止まる。
//   日付は、その日かそれより後の最初の調査の週。点は週から週へ、データの上を進む（寄ったり引いたりの途中でも、線から外れない）
// lbl：点の日付と価格を、点の上（above）に出すか下（below）に出すか。平らな期間では、上に期間の文字が来るので下に
var GAS_STEPS = [
  { title: '高知は、いつも高いほう', view: 0, on: [], draw: true,
    sub: '太い赤の線が高知、もう1本の太い線が全国平均、灰色の細い線がほかの46都道府県です。2019〜2024年の年ごとの平均で、高知は毎年、47都道府県のなかで5〜7番目の高さでした。' },
  { title: '50週、ほとんど動かない', view: 1, on: ['flat1'], lbl: 'below',
    ride: [['2022-08-01', '2023-07-24', 1600]],
    sub: '2022年8月から2023年7月下旬まで、高知の価格は176円台から出ませんでした。上下の幅は0.4円。ほかの都道府県は、そのあいだも細かく上下しています。' },
  // 前の段の終わり（平らな期間1の最後の週）から、少し上がって平らな期間2へ入り、その終わりまで
  { title: 'そして、また止まる', view: 1, on: ['flat2'], dim: ['flat1'], lbl: 'below',
    ride: [['2023-07-24', '2024-07-29', 1700]],
    sub: '少し動いたあと、2023年10月下旬から2024年7月までの40週は、179円台のまま。幅は0.2円でした。' },
  { title: '2025年2月、カルテル疑惑の報道', view: 2, on: ['report'],
    ride: [['2024-07-29', '2025-02-01', 1300]],
    sub: '信濃毎日新聞が、長野県のガソリン価格のカルテル疑惑を報じました。このころの高知は、全国平均より9円ほど高いところにいます。' },
  // 5月19日（193.7円）でいったん止まってから、急に下がって、全国平均より安い期間の終わりまで
  { title: '急に下がり、全国平均より安く', view: 2, on: ['report', 'below'],
    ride: [['2025-02-01', '2025-05-19', 900], 800, ['2025-05-19', '2025-12-22', 1400]],
    sub: '5月下旬、高知の価格は急に下がり始めました。5月19日には全国平均より11.6円高かったのが、6月30日に全国平均を下回り、8月中旬から年末までは、ずっと全国平均より安いままでした。' }
];

function gasFigure() {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var D = window.GAS_DATA;
  var DAY = 864e5;
  var t0 = Date.parse(D.start + 'T00:00:00Z');
  var times = D.days.split(',').map(function (d) { return t0 + (+d) * DAY; });
  var series = {};
  Object.keys(D.prices).forEach(function (p) {
    series[p] = D.prices[p].split(',').map(function (v) { return v / 10; });
  });
  var others = Object.keys(series).filter(function (p) { return p !== '全国' && p !== '高知'; });
  function T(s) { return Date.parse(s + 'T00:00:00Z'); }
  function ix(s) { var t = T(s); for (var i = 0; i < times.length; i++) if (times[i] >= t) return i; return times.length - 1; }

  var DUR = 900;   // 寄ったり引いたりする長さ（ミリ秒）
  // 出だしから大きく動き、終わりでゆっくり止まる（出だしをゆっくりにすると、札が抜けてから動き出すまでが遅く感じられるため）
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  // CSS の cubic-bezier と同じ曲線（線を引く動きと、その先を進む点を、同じ曲線で動かすため）
  function bezier(x1, y1, x2, y2) {
    function c(a, b, t) { return 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 24; i++) { t = (lo + hi) / 2; if (c(x1, x2, t) < x) lo = t; else hi = t; }
      return c(y1, y2, t);
    };
  }
  var DRAW = 1500;                         // 高知の線を引く長さ（ミリ秒）
  var easeDraw = bezier(.25, .6, .35, 1);  // 出だしは速く、右の端でゆっくり
  // 点が進む動き：はじめから少し速さを持って出て、終わりでなめらかに止まる（ゆっくり出ると、段が替わったのに止まって見える）
  var easeGlide = bezier(.3, .2, .25, 1);

  // ---- 入れ物（凡例・グラフ・出典）
  var frame = document.createElement('div');
  frame.className = 'gas-frame';
  var legend = document.createElement('div');
  legend.className = 'gas-legend';
  legend.setAttribute('aria-hidden', 'true');
  [['k', '高知'], ['n', '全国平均'], ['o', 'ほかの46都道府県']].forEach(function (l) {
    var s = document.createElement('span');
    var i = document.createElement('i');
    i.className = 'gas-key-' + l[0];
    s.appendChild(i);
    s.appendChild(document.createTextNode(l[1]));
    legend.appendChild(s);
  });
  frame.appendChild(legend);
  var svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'gas-chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '2019年からのレギュラーガソリンの店頭価格を、都道府県ごとに折れ線で示したグラフ。高知は全国平均より高いところで、何カ月も平らなまま動かない時期が二つある。2025年5月下旬に急に下がり、夏から年末までは全国平均を下回った');
  frame.appendChild(svg);
  var src = document.createElement('p');
  src.className = 'gas-src';
  src.textContent = 'レギュラーガソリンの店頭価格（1リットルあたり）。資源エネルギー庁「石油製品価格調査」から';
  frame.appendChild(src);

  function mk(tag, cls, parent, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (cls) e.setAttribute('class', cls);
    if (attrs) Object.keys(attrs).forEach(function (a) { e.setAttribute(a, attrs[a]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- 大きさ。幅は入れ物の幅、高さは幅と画面の高さから決める
  var W = 0, H = 0, M = { l: 32, r: 10, t: 14, b: 24 };
  var clipId = 'gas-clip-' + Math.random().toString(36).slice(2, 8);
  var gGrid, gAxis, gAnn, gLines, gData, gLabels, pOthers, pNation, pKochi, clipRect, ann = {};
  // 折れ線の座標：横は、最初の週からの日数。縦は、価格（円）そのまま
  var U = times.map(function (t) { return Math.round((t - t0) / DAY); });
  function bpath(vals, i0, i1) {
    var s = '';
    for (var i = i0; i <= i1; i++) s += (i === i0 ? 'M' : 'L') + U[i] + ',' + vals[i];
    return s;
  }
  var gRider, cRider, tRider;   // 高知の線の上を進む点と、その日付・価格

  // 印の定義。それぞれ、今の範囲（sx, sy）で位置を決め直す関数 place を持つ
  function flatMark(id, a, b, label) {
    var g = mk('g', 'gas-ann gas-ann-' + id, null);
    var band = mk('rect', 'gas-band', g);
    var pill = mk('rect', 'gas-pill', g, { rx: 9 });
    var tx = mk('text', 'gas-lbl gas-lbl-k', g);
    tx.textContent = label;
    var i0 = ix(a), i1 = ix(b);
    var ks = series['高知'].slice(i0, i1 + 1);
    var lo = Math.min.apply(null, ks), hi = Math.max.apply(null, ks);
    return { g: g, layer: 'ann', place: function (sx, sy) {
      var x0 = sx(times[i0] - 3.5 * DAY), x1 = sx(times[i1] + 3.5 * DAY);
      band.setAttribute('x', x0); band.setAttribute('width', Math.max(0, x1 - x0));
      band.setAttribute('y', M.t); band.setAttribute('height', H - M.t - M.b);
      var y0 = sy(hi) - 8, y1 = sy(lo) + 8;
      pill.setAttribute('x', x0 - 2); pill.setAttribute('width', Math.max(0, x1 - x0 + 4));
      pill.setAttribute('y', y0); pill.setAttribute('height', y1 - y0);
      tx.setAttribute('x', (x0 + x1) / 2); tx.setAttribute('y', y0 - 6); tx.setAttribute('text-anchor', 'middle');
    } };
  }
  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    pool = {};
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var defs = mk('defs', null, svg);
    var cp = mk('clipPath', null, defs, { id: clipId });
    clipRect = mk('rect', null, cp, { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b });
    gGrid = mk('g', 'gas-grid', svg);
    gAnn = mk('g', null, svg, { 'clip-path': 'url(#' + clipId + ')' });
    gLines = mk('g', null, svg, { 'clip-path': 'url(#' + clipId + ')' });
    gData = mk('g', 'gas-data', gLines);
    pOthers = mk('path', 'gas-other', gData);
    pNation = mk('path', 'gas-nation', gData);
    pKochi = mk('path', 'gas-kochi', gData);
    var d = '';
    others.forEach(function (p) { d += bpath(series[p], 0, LAST); });
    pOthers.setAttribute('d', d);
    pNation.setAttribute('d', bpath(series['全国'], 0, LAST));
    gAxis = mk('g', 'gas-axis', svg);
    gLabels = mk('g', null, svg);   // 印の文字は、線より手前に（切り取らない）

    ann = {};
    ann.flat1 = flatMark('flat1', '2022-08-01', '2023-07-24', '50週で幅0.4円');
    ann.flat2 = flatMark('flat2', '2023-10-23', '2024-07-29', '40週で幅0.2円');
    // 報道：2025年2月に縦の点線。文字は線の右の下のほう（このころの線は、どれも上のほうにある）
    (function () {
      var g = mk('g', 'gas-ann gas-ann-report', null);
      var ln = mk('line', 'gas-vline', g);
      var t1 = mk('text', 'gas-lbl gas-lbl-strong', g); t1.textContent = '信濃毎日新聞の報道';
      var t2 = mk('text', 'gas-lbl', g); t2.textContent = '2025年2月';
      ann.report = { g: g, layer: 'label', place: function (sx) {
        var x = sx(T('2025-02-01'));
        ln.setAttribute('x1', x); ln.setAttribute('x2', x);
        ln.setAttribute('y1', M.t); ln.setAttribute('y2', H - M.b);
        [t1, t2].forEach(function (t, i) { t.setAttribute('x', x + 5); t.setAttribute('y', H - M.b - 24 + i * 15); t.setAttribute('text-anchor', 'start'); });
      } };
    })();
    // 5月19日の193.7円は、高知の線の上を進む点が、そこでいったん止まって見せる（GAS_STEPS の5段目）
    // 全国平均より安かった期間（8月中旬〜年末）。文字は帯の上のほう（このころの線は、どれも下のほうにある）
    (function () {
      var g = mk('g', 'gas-ann gas-ann-below', null);
      var band = mk('rect', 'gas-band gas-band-n', g);
      var t1 = mk('text', 'gas-lbl', g); t1.textContent = '全国平均より安い';
      var i0 = ix('2025-08-12'), i1 = ix('2025-12-22');
      ann.below = { g: g, layer: 'ann', place: function (sx, sy) {
        var x0 = sx(times[i0] - 3.5 * DAY), x1 = sx(times[i1] + 3.5 * DAY);
        band.setAttribute('x', x0); band.setAttribute('width', Math.max(0, x1 - x0));
        band.setAttribute('y', M.t); band.setAttribute('height', H - M.t - M.b);
        t1.setAttribute('x', (x0 + x1) / 2); t1.setAttribute('y', M.t + 14); t1.setAttribute('text-anchor', 'middle');
      } };
    })();
    Object.keys(ann).forEach(function (k) { (ann[k].layer === 'ann' ? gAnn : gLabels).appendChild(ann[k].g); });
    // 平らな期間の文字は、線より手前に出す（帯と囲みは線の奥）
    ['flat1', 'flat2'].forEach(function (k) {
      var t = ann[k].g.querySelector('text');
      var g = mk('g', ann[k].g.getAttribute('class'), gLabels);
      g.appendChild(t);
      ann[k].label = g;
    });
    // 高知の線の上を進む点。どの線や印の文字よりも手前に、切り取らずに描く（見る範囲の外に出たときは隠す）
    gRider = mk('g', 'gas-rider', svg, { 'aria-hidden': 'true' });
    tRider = mk('text', 'gas-lbl gas-lbl-k', gRider);
    cRider = mk('circle', 'gas-dot', gRider, { r: 5 });
    // 日付と価格の文字の幅は、いちばん長くなる形で一度だけ測る（文字が替わるたびに測ると、そのたびに描き直しを待つことになり、動きが滞る）
    tRider.textContent = '2026年12月 888.8円';
    try { rLblW = tRider.getComputedTextLength(); } catch (e) { rLblW = 0; }
    if (!rLblW) rLblW = 120;
    rLblText = '';
    riderShow(rOn, false);
    setWait(rWait);
    setDraw(drawP);
  }

  // ---- 今の範囲で描く
  // 目盛りの線と文字の置き場（key → 要素）。build() で空にする
  var pool = {}, used = {};
  function tick(key, tag, cls, parent, attrs, text) {
    var e = pool[key];
    if (!e) { e = pool[key] = mk(tag, cls, parent); if (text != null) e.textContent = text; }
    else if (text != null && e.textContent !== text) e.textContent = text;
    Object.keys(attrs).forEach(function (n) { var x = attrs[n]; e.setAttribute(n, typeof x === 'number' ? x.toFixed(1) : x); });
    used[key] = 1;
  }
  var cur = null;   // { x0, x1, y0, y1 }（x は時刻）
  function viewOf(k) { var v = GAS_VIEWS[k]; return { x0: T(v.x0), x1: T(v.x1), y0: v.y0, y1: v.y1 }; }
  function render() {
    if (!W || !cur) return;
    var v = cur;
    var sx = function (t) { return M.l + (t - v.x0) / (v.x1 - v.x0) * (W - M.l - M.r); };
    var sy = function (p) { return M.t + (v.y1 - p) / (v.y1 - v.y0) * (H - M.t - M.b); };
    // 折れ線は、入れ物の拡大・移動だけを変える（日数・円 → ピクセル）
    var a = (W - M.l - M.r) / ((v.x1 - v.x0) / DAY), c = -(H - M.t - M.b) / (v.y1 - v.y0);
    gData.setAttribute('transform', 'matrix(' + a + ',0,0,' + c + ',' + (M.l - (v.x0 - t0) / DAY * a) + ',' + (M.t - v.y1 * c) + ')');
    // 線の頭からの長さ（ピクセル）を点ごとに。線を引く動きで、引いた先の位置（長さの割合）を、何週目かに直すのに使う
    var kv = series['高知'], px0 = sx(times[0]), py0 = sy(kv[0]);
    cumLen = [0];
    for (var ci = 1; ci < times.length; ci++) {
      var px1 = sx(times[ci]), py1 = sy(kv[ci]);
      cumLen.push(cumLen[ci - 1] + Math.sqrt((px1 - px0) * (px1 - px0) + (py1 - py0) * (py1 - py0)));
      px0 = px1; py0 = py1;
    }
    SX = sx; SY = sy;
    // 目盛り。線と文字は、同じ目盛りなら作り直さず、位置だけを変える
    // （コマごとに作り直すと、文字の組み直しが毎回起きて、スマホで動きが滞るため）
    used = {};
    var span = v.y1 - v.y0, yt = span > 70 ? 20 : 10;
    for (var y = Math.ceil(v.y0 / yt) * yt; y <= v.y1; y += yt) {
      var py = sy(y);
      if (py < M.t + 4 || py > H - M.b - 2) continue;
      tick('gy' + y, 'line', null, gGrid, { x1: M.l, x2: W - M.r, y1: py, y2: py });
      tick('ty' + y, 'text', 'gas-tick', gAxis, { x: M.l - 5, y: py + 4, 'text-anchor': 'end' }, String(y));
    }
    tick('unit', 'text', 'gas-tick', gAxis, { x: M.l - 5, y: M.t - 3, 'text-anchor': 'end' }, '円');
    tick('base', 'line', 'gas-base', gAxis, { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b });
    // 横軸：年の頭に目盛り。狭いときは1年おきに。期間が短いときは、4・7・10月にも小さな目盛り
    var y0 = new Date(v.x0).getUTCFullYear(), y1 = new Date(v.x1).getUTCFullYear();
    var pxYear = (W - M.l - M.r) / ((v.x1 - v.x0) / (365.25 * DAY));
    var every = pxYear < 44 ? 2 : 1;
    for (var yr = y0; yr <= y1 + 1; yr++) {
      for (var m = 0; m < 12; m += 3) {
        var px = sx(Date.UTC(yr, m, 1));
        if (px < M.l - .5 || px > W - M.r + .5) continue;
        if (m === 0) {
          tick('gx' + yr, 'line', 'gas-tickline', gGrid, { x1: px, x2: px, y1: H - M.b, y2: H - M.b + 4 });
          if (yr % every) continue;
          tick('tx' + yr, 'text', 'gas-tick', gAxis, { x: px, y: H - M.b + 16, 'text-anchor': 'middle' }, yr + (pxYear > 150 ? '年' : ''));
        } else if (pxYear > 150) {
          tick('gm' + yr + '-' + m, 'line', 'gas-tickline', gGrid, { x1: px, x2: px, y1: H - M.b, y2: H - M.b + 3 });
          if (pxYear > 190) tick('tm' + yr + '-' + m, 'text', 'gas-tick gas-tick-m', gAxis, { x: px, y: H - M.b + 16, 'text-anchor': 'middle' }, (m + 1) + '月');
        }
      }
    }
    Object.keys(pool).forEach(function (key) {
      if (used[key]) return;
      var e = pool[key];
      if (e.parentNode) e.parentNode.removeChild(e);
      delete pool[key];
    });
    Object.keys(ann).forEach(function (k) { ann[k].place(sx, sy); });
    placeRider();
  }

  // ---- 高知の線の上を進む点
  // 位置は「何週目か」（小数。rFi）で持ち、描くたびに、いまの範囲（SX, SY）で前後の週の点のあいだに置く。
  // 寄ったり引いたりの途中でも、点は線の上からずれない
  var SX = null, SY = null, cumLen = [];
  var rFi = times.length - 1, rOn = true, rSide = 'above', rLblText = '', rLblW = 0, rWait = [];
  var mraf = 0, drawing = false, drawP = 1;
  var LAST = times.length - 1;
  function ym(i) { var d = new Date(times[i]); return d.getUTCFullYear() + '年' + (d.getUTCMonth() + 1) + '月'; }
  function placeRider() {
    if (!gRider || !SX) return;
    var i = Math.max(0, Math.min(LAST, Math.floor(rFi))), f = rFi - i, j = Math.min(LAST, i + 1);
    var kv = series['高知'];
    var x = SX(times[i]) + (SX(times[j]) - SX(times[i])) * f;
    var y = SY(kv[i]) + (SY(kv[j]) - SY(kv[i])) * f;
    // 見る範囲の外（寄ったり引いたりの途中で、外へ出ているとき）は隠す
    gRider.classList.toggle('is-out', x < M.l - .5 || x > W - M.r + .5 || y < M.t - .5 || y > H - M.b + .5);
    cRider.setAttribute('cx', x.toFixed(1)); cRider.setAttribute('cy', y.toFixed(1));
    // 日付と価格は、近いほうの週のもの（例：2023年7月 176.1円）
    var n = Math.round(rFi), txt = ym(n) + ' ' + kv[n].toFixed(1) + '円';
    if (txt !== rLblText) {
      rLblText = txt; tRider.textContent = txt;
    }
    // 横：ふつうは点の右。右の端からはみ出すときは左へ。縦：段の指定（上か下）。グラフの上下の端にかかるときは反対側へ
    var right = x + 8 + rLblW <= W - M.r;
    var ty = rSide === 'below' ? y + 19 : y - 9;
    if (rSide === 'below' && ty > H - M.b - 4) ty = y - 9;
    else if (rSide !== 'below' && ty - 11 < M.t) ty = y + 19;
    tRider.setAttribute('x', (right ? x + 8 : x - 8).toFixed(1));
    tRider.setAttribute('y', ty.toFixed(1));
    tRider.setAttribute('text-anchor', right ? 'start' : 'end');
  }
  // 点を出すか。jump：出すときは、いったん消してから出す（離れた位置に移るとき）。隠すときは、ふわっとではなく、すぐに消す
  function riderShow(on, jump) {
    rOn = on;
    if (!gRider) return;
    if (!on) {
      gRider.classList.toggle('is-jump', !!jump);
      gRider.classList.add('is-off');
      return;
    }
    if (jump) {
      gRider.classList.add('is-jump');
      gRider.getBoundingClientRect();   // 消した状態を一度描かせてから、出す（そうしないと、消えずに飛んで見える）
    }
    gRider.classList.remove('is-jump');
    gRider.classList.toggle('is-off', !on);
  }
  // 平らな期間の囲みと文字を、点が渡りきるまで隠しておく
  function setWait(keys) {
    rWait = keys;
    Object.keys(ann).forEach(function (k) {
      [ann[k].g, ann[k].label].forEach(function (g) { if (g) g.classList.toggle('is-wait', keys.indexOf(k) >= 0); });
    });
  }
  // 高知の線を、線の頭から長さの割合 p のところまで描く（引いた先は、前後の週のあいだの途中の点）
  function setDraw(p) {
    drawP = p;
    if (!pKochi) return;
    var kv = series['高知'];
    if (p >= 1) { pKochi.setAttribute('d', bpath(kv, 0, LAST)); return; }
    if (p <= 0) { pKochi.setAttribute('d', ''); return; }
    var fi = fiAtLen(p), i = Math.min(LAST - 1, Math.floor(fi)), f = fi - i;
    pKochi.setAttribute('d', bpath(kv, 0, i) + 'L' + (U[i] + (U[i + 1] - U[i]) * f).toFixed(2) + ',' + (kv[i] + (kv[i + 1] - kv[i]) * f).toFixed(2));
  }
  // 線を引いた先（長さの割合 p）が、何週目にあたるか
  function fiAtLen(p) {
    var n = cumLen.length;
    if (n < 2) return p * LAST;
    var L = p * cumLen[n - 1], lo = 0, hi = n - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cumLen[mid] <= L) lo = mid; else hi = mid; }
    var seg = cumLen[hi] - cumLen[lo];
    return lo + (seg > 0 ? (L - cumLen[lo]) / seg : 0);
  }
  function stopRide() { if (mraf) { cancelAnimationFrame(mraf); mraf = 0; } drawing = false; }
  // 動きを順に進める。legs：{ dur, tick(p) } の並び（tick を持たないものは、その長さだけ止まる）
  function runLegs(legs, done) {
    stopRide();
    var li = 0, start = 0;
    function f(ts) {
      if (!start) start = ts;
      var L = legs[li], p = L.dur ? Math.min(1, (ts - start) / L.dur) : 1;
      if (L.tick) L.tick(p);
      placeRider();
      if (p >= 1) {
        li++; start = ts;
        if (li >= legs.length) { mraf = 0; drawing = false; if (done) done(); return; }
      }
      mraf = requestAnimationFrame(f);
    }
    mraf = requestAnimationFrame(f);
  }
  function glideLeg(a, b, dur) {
    return { dur: dur, tick: function (p) { rFi = a + (b - a) * easeGlide(p); } };
  }
  // 段 k の点の動き。animate：段の始めから終わりまで進めて見せる（でなければ、終わりの位置にすぐ置く）。
  // fwd：前の段から進んできた（平らな期間の囲みを、点が渡りきってから出すのは、進んできたときだけ。戻ったときは、すでに見たものなので）
  function ride(k, animate, fwd) {
    var s = GAS_STEPS[k];
    rSide = s.lbl || 'above';
    if (!s.ride) {
      // 1段目：線を引いているあいだは、線を引く動きが点を動かす。線が隠れているあいだは点も隠す。引き終えていれば、線の右の端に
      if (drawing) return;
      stopRide(); setWait([]);
      var jump = rOn && Math.abs(rFi - LAST) > .5;
      rFi = LAST;
      riderShow(drawP >= 1, jump && animate);
      placeRider();
      return;
    }
    var legs = [], endFi = rFi, a0 = null;
    s.ride.forEach(function (r) {
      if (typeof r === 'number') { legs.push({ dur: r }); return; }
      var a = ix(r[0]), b = ix(r[1]);
      if (a0 === null) a0 = a;
      legs.push(glideLeg(a, b, r[2]));
      endFi = b;
    });
    if (!animate) {
      stopRide(); setWait([]);
      rFi = endFi; riderShow(true, false); placeRider();
      return;
    }
    // 始めの位置。点が、この段の始めより少し手前（前の段の動きの途中で、先へ進んできたときなど）にいれば、そこから続けて進める。
    // 離れたところにいれば、いったん消して、始めの位置から出す
    var from = a0, jump2 = !rOn || drawP < 1;
    if (rOn && !drawing && rFi <= a0 + .01 && a0 - rFi < 60) from = rFi;
    else if (Math.abs(rFi - a0) > .5) jump2 = true;
    legs[0] = glideLeg(from, ix(s.ride[0][1]), s.ride[0][2]);
    stopRide();
    rFi = from;
    var flats = fwd ? s.on.filter(function (key) { return key === 'flat1' || key === 'flat2'; }) : [];
    setWait(flats);
    // 見る範囲を寄せたり引いたりしている最中（go() が先に動き始めている）は、点を隠して待ち、寄り終えてから出して進める。
    // 同時に動かすと、範囲が動くぶんだけ点が画面の上で左へ流れて見え、右へ進んでいるように見えないため
    if (raf) {
      riderShow(false, true);
      placeRider();
      legs.unshift({ dur: DUR }, { dur: 0, tick: function () { riderShow(true, true); } });
    } else {
      riderShow(true, jump2);
      placeRider();
    }
    runLegs(legs, function () { setWait([]); });
  }

  // ---- 大きさを決めて描き直す（幅が変わったとき）
  function size() {
    var w = Math.floor(svg.parentNode ? frame.clientWidth - parseFloat(getComputedStyle(frame).paddingLeft) - parseFloat(getComputedStyle(frame).paddingRight) : 0);
    if (!w || w === W) return false;
    W = w;
    var narrow = window.innerWidth <= 600;   // CSS で枠を本文の幅いっぱいにする幅（それより広いと、枠は本文の3分の2）
    M.l = narrow ? 30 : 34;
    // 高さ：幅の0.95倍（スマホ）か0.75倍（パソコン）。ただし画面の高さの55%まで
    H = Math.round(Math.max(200, Math.min(W * (narrow ? .95 : .75), window.innerHeight * .55)));
    build();
    applyMarks(true);
    render();
    return true;
  }

  // ---- 段 k の見せ方にする
  var now = 0, raf = 0;
  function applyMarks(instant) {
    var s = GAS_STEPS[now];
    Object.keys(ann).forEach(function (k) {
      var on = s.on.indexOf(k) >= 0, dim = (s.dim || []).indexOf(k) >= 0;
      [ann[k].g, ann[k].label].forEach(function (g) {
        if (!g) return;
        g.classList.toggle('is-instant', !!instant);
        g.classList.toggle('is-on', on);
        g.classList.toggle('is-dim', dim);
      });
    });
  }
  function go(k, animate) {
    now = k;
    var to = viewOf(GAS_STEPS[k].view);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    applyMarks(!animate);
    if (!animate || !cur) { cur = to; render(); return; }
    var from = cur, start = 0;
    if (from.x0 === to.x0 && from.x1 === to.x1 && from.y0 === to.y0 && from.y1 === to.y1) return;
    function frameStep(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / DUR), e = ease(p);
      cur = { x0: from.x0 + (to.x0 - from.x0) * e, x1: from.x1 + (to.x1 - from.x1) * e,
              y0: from.y0 + (to.y0 - from.y0) * e, y1: from.y1 + (to.y1 - from.y1) * e };
      render();
      raf = p < 1 ? requestAnimationFrame(frameStep) : 0;
      if (!raf) { cur = to; render(); }
    }
    raf = requestAnimationFrame(frameStep);
  }
  // 高知の線：hidden のときは隠しておき（点も隠す）、shown で出す。animate なら、左から右へ引いて見せ、引いた先を点が進む。
  // 線と点を同じ時計（requestAnimationFrame）で動かすので、点は線の先からずれない。引き終えたら、点は線の右の端（いちばん新しい週）で止まる
  function kochi(state, animate) {
    if (state === 'hidden') {
      stopRide(); setWait([]);
      // 線はすぐに消えるので、点もその場ですぐに消す（線の頭へ動かしてから消すと、消えるあいだに左へ飛んで見える）
      setDraw(0); riderShow(false, true);
      return;
    }
    if (!animate) {
      if (drawing) stopRide();
      setDraw(1);
      return;
    }
    rSide = 'above';
    setDraw(0); rFi = 0;
    runLegs([{ dur: DRAW, tick: function (p) { var e = easeDraw(p); setDraw(e); rFi = fiAtLen(e); } }]);
    drawing = true;
    riderShow(true, false);
    placeRider();
  }

  return { el: frame, size: size, go: go, kochi: kochi, ride: ride, now: function () { return now; } };
}

function gasAnim() {
  var host = document.querySelector('.gas-anim');
  if (!host || typeof Scrolly !== 'function' || !window.GAS_DATA) return;
  var fig = gasFigure();

  var steps = GAS_STEPS.map(function (s) {
    var p = document.createElement('p');
    p.className = 'scly-sub';
    p.textContent = s.sub;
    return { title: s.title, nodes: [p] };
  });

  // 高知の線を引く動き：1段目の札が、まだグラフの上を抜けていないあいだ（本文から来たところ）は線を隠して待ち、
  // 札が抜けたら引いて見せる（札は、グラフで起きることの予告なので）。2段目より先や、動きを減らす設定では、いつも引いたまま。
  // 抜けたあとで、札が抜ける前の位置まで戻ったときは、また隠して待つ
  var armed = false;
  var sc = Scrolly(host, {
    className: 'gas-scly',
    label: '高知のガソリン価格で分かった三つのこと',
    steps: steps,
    stage: fig.el,
    onMeasure: function () { fig.size(); },
    // グラフの背が高いので、札がグラフの上の3分の1ほどにかかっているうちに次の段へ進める
    // （ほかの実演と同じ「上端ぎりぎり」まで待つと、札がグラフを渡りきるまでが長く、動き出しが遅く感じられる）
    hook: function (h) { return h * 0.35; },
    onStep: function (k, prev, info) {
      fig.go(k, prev >= 0 && !info.reduced);
      if (k > 0 || info.reduced) { armed = false; fig.kochi('shown', false); }
      // 高知の線の上の点：段が替わると同時に、その段の始めから終わりまで進める（戻ったときも同じ。開いたときと、動きを減らす設定では、終わりの位置に置く）
      fig.ride(k, prev >= 0 && !info.reduced, !!info.fwd);
    },
    onUpdate: function (k, info) {
      if (k !== 0) return;
      if (info.passed === 0 && !info.reduced) {
        if (!armed) { armed = true; fig.kochi('hidden', false); }
      } else if (armed) {
        armed = false;
        fig.kochi('shown', true);
      }
    }
  });
  if (!sc) return;   // 古いブラウザでは組み立てない（静的な図のまま）
  var fallback = document.querySelector('.fig-gas-static');
  if (fallback) fallback.classList.add('is-replaced');
  // 入れ物の幅が変わったら描き直し、測り直す（グラフの高さが変わるため）
  if (window.ResizeObserver) {
    new ResizeObserver(function () { if (fig.size()) sc.measure(); }).observe(fig.el);
  }
}

// 静的な図などページ全体が読み込まれてから組み立てる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', gasAnim);
} else {
  gasAnim();
}
