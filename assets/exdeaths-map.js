// 20章のコロナの地図を、ブラウザで描く。
// ・データは assets/exdeaths-data.js（make-exdeaths20.R が書き出す）。地図はSVG、文字はHTMLで描く。
// ・地図は入れ物の幅に合わせて伸び縮みし、文字はどの画面でも同じ大きさのまま読める。
// ・都道府県にマウスを乗せる（スマホなら指で触れる）と、3年分の数字が出る。3枚の地図の同じ県が光る。
// ・外部のライブラリは使わない。スクリプトが動かないとき・印刷するとき用の画像（.fig-exdeaths-static）も置いてある。
function exdeathsMap() {
  var host = document.querySelector('.exdeaths-map');
  var D = window.EXDEATHS_DATA;
  if (!host || !D) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var LIM = 180;                                     // 色の濃さがいちばん濃くなる値（元の地図と同じ）
  var BLUE = [43, 108, 176], WHITE = [247, 246, 243], RED = [197, 48, 48];

  function color(v) {
    var t = Math.max(-1, Math.min(1, v / LIM));
    var to = t < 0 ? BLUE : RED, a = Math.abs(t);
    var c = WHITE.map(function (w, i) { return Math.round(w + (to[i] - w) * a); });
    return 'rgb(' + c.join(',') + ')';
  }
  function signed(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var fig = el('figure', 'fig heat-fig ex-fig');
  var head = el('div', 'hc-head');
  head.appendChild(el('p', 'hc-title', '死者は予測よりどれだけ多かったか'));
  head.appendChild(el('p', 'hc-sub', '都道府県ごとに、実際の死者数と予測死者数の差を、人口10万人あたりで示した。赤は予測より多く、青は少ない'));
  fig.appendChild(head);

  // 凡例（色の帯と目盛り）
  var legend = el('div', 'ex-legend');
  legend.appendChild(el('div', 'ex-legend-title', '予測死者数との差（人口10万人あたり、人）'));
  var bar = el('div', 'ex-bar');
  var stops = [];
  for (var k = 0; k <= 10; k++) {
    var v = -LIM + 2 * LIM * k / 10;
    stops.push(color(v) + ' ' + (k * 10) + '%');
  }
  bar.style.background = 'linear-gradient(to right, ' + stops.join(', ') + ')';
  legend.appendChild(bar);
  var ticks = el('div', 'ex-ticks');
  [-150, -100, -50, 0, 50, 100, 150].forEach(function (t) {
    var s = el('span', '', t > 0 ? '+' + t : (t < 0 ? '−' + (-t) : '0'));
    s.style.left = ((t + LIM) / (2 * LIM) * 100) + '%';
    ticks.appendChild(s);
  });
  legend.appendChild(ticks);
  fig.appendChild(legend);

  // 3年分の地図
  var maps = el('div', 'ex-maps');
  var shapes = [];                                   // shapes[年][県] = path
  D.years.forEach(function (year, yi) {
    var cell = el('div', 'ex-cell');
    cell.appendChild(el('div', 'ex-year', year + '年'));
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + D.width + ' ' + D.height);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', year + '年の、都道府県ごとの予測死者数との差の地図');
    var frame = document.createElementNS(SVGNS, 'rect');
    frame.setAttribute('class', 'ex-inset');
    frame.setAttribute('x', D.inset[0]);
    frame.setAttribute('y', D.inset[1]);
    frame.setAttribute('width', D.inset[2]);
    frame.setAttribute('height', D.inset[3]);
    svg.appendChild(frame);
    shapes[yi] = D.prefs.map(function (p, pi) {
      var path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', p.d);
      path.setAttribute('class', 'ex-pref');
      path.style.fill = color(p.v[yi]);
      path.dataset.i = pi;
      svg.appendChild(path);
      return path;
    });
    cell.appendChild(svg);
    maps.appendChild(cell);
  });
  var tip = el('div', 'hc-tip ex-tip');
  maps.appendChild(tip);
  fig.appendChild(maps);
  fig.appendChild(el('p', 'hc-source', '日本の超過および過少死亡数ダッシュボード（厚生労働省研究班）、国勢調査のデータから作成。地図は地図蔵'));
  host.appendChild(fig);
  var fallback = document.querySelector('.fig-exdeaths-static');
  if (fallback) fallback.classList.add('is-replaced');

  // ---- なぞる
  var current = -1;
  function select(pi) {
    if (pi === current) return;
    if (current >= 0) shapes.forEach(function (row) { row[current].classList.remove('is-on'); });
    current = pi;
    if (pi < 0) return;
    shapes.forEach(function (row) {
      row[pi].classList.add('is-on');
      row[pi].parentNode.appendChild(row[pi]);       // 縁取りが隣の県に隠れないよう、いちばん上に
    });
  }
  function show(ev) {
    var t = ev.target;
    if (!t.classList || !t.classList.contains('ex-pref')) { hide(); return; }
    var pi = +t.dataset.i, p = D.prefs[pi];
    select(pi);
    tip.innerHTML = '';
    tip.appendChild(el('div', 'hc-tip-head', p.name));
    D.years.forEach(function (year, yi) {
      var row = el('div', 'hc-tip-row');
      var dot = el('span', 'hc-dot');
      dot.style.background = color(p.v[yi]);
      dot.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.15)';
      row.appendChild(dot);
      row.appendChild(document.createTextNode(year + '年　'));
      row.appendChild(el('b', '', signed(p.v[yi]) + '人'));
      tip.appendChild(row);
    });
    tip.style.display = 'block';
    var box = maps.getBoundingClientRect();
    var x = ev.clientX - box.left, y = ev.clientY - box.top;
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = x + 14;
    if (left + tw > box.width - 4) left = x - tw - 14;
    var top = y - th - 10;
    if (top < 0) top = y + 16;
    tip.style.left = Math.max(4, left) + 'px';
    tip.style.top = top + 'px';
  }
  function hide() { tip.style.display = 'none'; select(-1); }
  maps.addEventListener('pointermove', show);
  maps.addEventListener('pointerdown', show);
  maps.addEventListener('pointerleave', hide);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', exdeathsMap);
} else {
  exdeathsMap();
}
