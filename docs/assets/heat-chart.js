// 20章の熱中症のグラフを、ブラウザで描く。
// ・データは assets/heat-data.js（make-heat20.R が書き出す）。点はキャンバス、軸や曲線はSVGで描く。
// ・入れ物の幅に合わせて描き直すので、文字はどの画面でも同じ大きさのまま読める。
// ・外部のライブラリは使わない（勉強会の会場や、ファイルを直接開いたときにも動くように）。
// ・スクリプトが動かないとき・印刷するとき用の画像（.fig-heat-static）も置いてある。
function heatChart() {
  var host = document.querySelector('.heat-chart');
  var D = window.HEAT_DATA;
  if (!host || !D) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var XMIN = 8, XMAX = 42, YMIN = 0, YMAX = 7;

  // ---- 点をほどく（1つ4文字：グループ・気温×10・搬送数×100）
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  var val = {};
  for (var a = 0; a < 64; a++) val[ALPHA.charAt(a)] = a;
  var n = D.n, px = new Float32Array(n), py = new Float32Array(n), pg = new Uint8Array(n);
  for (var i = 0; i < n; i++) {
    var s = D.points, k = i * 4;
    var v = ((val[s.charAt(k)] * 64 + val[s.charAt(k + 1)]) * 64 + val[s.charAt(k + 2)]) * 64 + val[s.charAt(k + 3)];
    pg[i] = v >> 20;
    px[i] = ((v >> 10) & 1023) / 10;
    py[i] = (v & 1023) / 100;
  }

  // ---- 組み立て
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  var fig = el('figure', 'fig heat-fig');
  var head = el('div', 'hc-head');
  head.appendChild(el('p', 'hc-title', 'その日の最高気温と、熱中症の救急搬送数'));
  head.appendChild(el('p', 'hc-sub', '人口10万人あたり。点は都道府県ごとの1日分（2008〜22年の5〜9月、' +
    n.toLocaleString('ja-JP') + '日分）、線は近似曲線'));
  fig.appendChild(head);

  var legend = el('div', 'hc-legend');
  legend.appendChild(el('span', 'hc-legend-title', '夏場の平均気温'));
  D.groups.forEach(function (g, j) {
    var chip = el('span', 'hc-chip');
    var dot = el('span', 'hc-dot');
    dot.style.background = D.colors[j];
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(g + 'の地域'));
    legend.appendChild(chip);
  });
  fig.appendChild(legend);

  var ylab = el('p', 'hc-ylab', '搬送数（人）');
  fig.appendChild(ylab);
  var plot = el('div', 'hc-plot');
  plot.setAttribute('role', 'img');
  plot.setAttribute('aria-label', 'その日の最高気温と、人口10万人あたりの熱中症の救急搬送数の散布図と近似曲線。夏場の平均気温が低い地域ほど、同じ最高気温でも搬送が多い');
  var canvas = document.createElement('canvas');
  var svg = document.createElementNS(SVGNS, 'svg');
  var tip = el('div', 'hc-tip');
  plot.appendChild(canvas);
  plot.appendChild(svg);
  plot.appendChild(tip);
  fig.appendChild(plot);
  fig.appendChild(el('p', 'hc-source', '総務省消防庁、気象庁、国勢調査のデータから作成'));
  host.appendChild(fig);
  var fallback = document.querySelector('.fig-heat-static');
  if (fallback) fallback.classList.add('is-replaced');

  // ---- 描く
  var W, H, M = { l: 34, r: 12, t: 8, b: 44 }, sx, sy;
  function svgEl(name, attrs, text) {
    var e = document.createElementNS(SVGNS, name);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (text !== undefined) e.textContent = text;
    svg.appendChild(e);
    return e;
  }
  function hexToRgba(hex, al) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + al + ')';
  }
  var guide, marks = [];

  function draw() {
    W = plot.clientWidth;
    H = Math.round(Math.max(260, Math.min(440, W * 0.6)));
    plot.style.height = H + 'px';
    sx = function (x) { return M.l + (x - XMIN) / (XMAX - XMIN) * (W - M.l - M.r); };
    sy = function (y) { return M.t + (1 - (y - YMIN) / (YMAX - YMIN)) * (H - M.t - M.b); };

    // 点（キャンバス）。画面の細かさに合わせて描く
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var r = W < 500 ? 1.1 : 1.5;
    var fills = D.colors.map(function (c, j) { return hexToRgba(c, j === 2 ? 0.10 : 0.22); });
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = fills[pg[i]];
      ctx.beginPath();
      ctx.arc(sx(px[i]), sy(Math.min(py[i], YMAX)), r, 0, 6.2832);
      ctx.fill();
    }

    // 軸・目盛り・曲線（SVG）
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var y = 0; y <= YMAX; y++) {
      svgEl('line', { 'class': y === 0 ? 'hc-axis' : 'hc-grid', x1: M.l, x2: W - M.r, y1: sy(y), y2: sy(y) });
      svgEl('text', { 'class': 'hc-tick', x: M.l - 8, y: sy(y) + 4, 'text-anchor': 'end' }, String(y));
    }
    for (var x = 10; x <= 40; x += 5) {
      svgEl('line', { 'class': 'hc-grid', x1: sx(x), x2: sx(x), y1: M.t, y2: H - M.b });
      svgEl('text', { 'class': 'hc-tick', x: sx(x), y: H - M.b + 18, 'text-anchor': 'middle' }, x + '度');
    }
    svgEl('text', { 'class': 'hc-xlab', x: (M.l + W - M.r) / 2, y: H - 6, 'text-anchor': 'middle' }, 'その日の最高気温');
    D.groups.forEach(function (g, j) {
      var d = D.curves[g].map(function (p, k) { return (k ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1); }).join(' ');
      svgEl('path', { 'class': 'hc-halo', d: d });
      var line = svgEl('path', { 'class': 'hc-curve', d: d });
      line.style.stroke = D.colors[j];
    });

    // なぞったときの縦線と、曲線の上の印
    guide = svgEl('line', { 'class': 'hc-guide', x1: 0, x2: 0, y1: M.t, y2: H - M.b });
    marks = D.groups.map(function (g, j) {
      var c = svgEl('circle', { 'class': 'hc-mark', r: 5 });
      c.style.fill = D.colors[j];
      return c;
    });
    hide();
  }

  // ---- なぞる
  function curveAt(g, x) {
    var c = D.curves[g];
    if (x < c[0][0] || x > c[c.length - 1][0]) return null;
    for (var k = 1; k < c.length; k++) {
      if (c[k][0] >= x) {
        var t = (x - c[k - 1][0]) / (c[k][0] - c[k - 1][0]);
        return c[k - 1][1] + t * (c[k][1] - c[k - 1][1]);
      }
    }
    return null;
  }
  function hide() {
    tip.style.display = 'none';
    if (guide) guide.style.display = 'none';
    marks.forEach(function (m) { m.style.display = 'none'; });
  }
  function show(ev) {
    var rect = plot.getBoundingClientRect();
    var mx = ev.clientX - rect.left;
    var x = XMIN + (mx - M.l) / (W - M.l - M.r) * (XMAX - XMIN);
    x = Math.round(x * 2) / 2;                       // 0.5度きざみ
    if (x < 10 || x > 40.5) { hide(); return; }
    guide.setAttribute('x1', sx(x));
    guide.setAttribute('x2', sx(x));
    guide.style.display = '';
    tip.innerHTML = '';
    tip.appendChild(el('div', 'hc-tip-head', '最高気温 ' + x.toFixed(1) + '度のとき'));
    D.groups.forEach(function (g, j) {
      var yv = curveAt(g, x);
      var row = el('div', 'hc-tip-row');
      var dot = el('span', 'hc-dot');
      dot.style.background = D.colors[j];
      row.appendChild(dot);
      row.appendChild(document.createTextNode(g + '　'));
      row.appendChild(el('b', '', yv === null ? '―' : yv.toFixed(2) + '人'));
      tip.appendChild(row);
      if (yv === null) { marks[j].style.display = 'none'; return; }
      marks[j].setAttribute('cx', sx(x));
      marks[j].setAttribute('cy', sy(yv));
      marks[j].style.display = '';
    });
    tip.style.display = 'block';
    var tw = tip.offsetWidth;
    var left = sx(x) + 12;
    if (left + tw > W - 4) left = sx(x) - tw - 12;
    tip.style.left = Math.max(4, left) + 'px';
    tip.style.top = (M.t + 6) + 'px';
  }
  plot.addEventListener('pointermove', show);
  plot.addEventListener('pointerdown', show);
  plot.addEventListener('pointerleave', hide);

  draw();
  var timer = null, lastW = plot.clientWidth;
  window.addEventListener('resize', function () {
    if (plot.clientWidth === lastW) return;
    clearTimeout(timer);
    timer = setTimeout(function () { lastW = plot.clientWidth; draw(); }, 120);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', heatChart);
} else {
  heatChart();
}
