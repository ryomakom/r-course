// スクロールで進む実演（スクローリーテリング）の共通の部品。トップの実演（top-demo.js）、9章（pivot-anim.js）、16章（gas-anim.js）、20章（behead-anim.js）が使う。
// 留まる枠（.scly-stage）と、その上を下から上へ流れる札（.scly-card）と、上の帯（.scly-bar）を組み立てる。
// ・枠は、いちばん長い札でも、札が枠を抜けるときに見出しが読めるところまで下げ、それ以上は下げない（CSS の --scly-stick と、ここで測る --scly-min）。
// ・札は、枠の上で起きることの「予告」。札が下から入ってきて、枠の上を通るあいだに読まれ、札の下端が枠の上端を越えて
//   上へ抜けようとするところ（札の下端が、枠の上端から少しだけ下＝ぎりぎりまだ枠にかかっている位置。HOOK）で、その段に切り替える（opts.onStep）。
//   札が抜けきるのを待つと、読み終えてから出来事までに一拍の間があって遅く感じるため、抜けきる少し手前で始める。
//   札が枠にかかっているあいだ（ただし切り替えの位置より上に抜けかけた札は除く）は、枠を少し薄くして（.is-covered）、次に何か起きることを示す。
// ・段ごとの絵をどう動かすかは、呼ぶ側が決める（ここでは、どの段にいるか、前から進んできたか、札が何枚抜けたかだけを渡す）。
// ・svh を知らない古いブラウザでは、留まる位置や札の間隔の指定が効かず札が重なってしまうので、組み立てずに null を返す（静的な図のまま）。
// ・外部のライブラリは使わない。
//
// 使い方： var s = Scrolly(host, {
//   label: '読み上げ用の名前',
//   className: '入れ物（.scly）に足すクラス',
//   steps: [{ title: '見出し', nodes: [札に入れる要素…] }, …],
//   stage: 留まる枠に入れる要素,
//   onStep: function (k, prev, info) { … },    // 段が替わったとき。info.fwd：前の段から進んできた、info.reduced：動きを減らす設定
//   onUpdate: function (k, info) { … },        // スクロールのたび（段の判定のあと）。info.passed：上へ抜けた札の枚数、info.live：実演の領域にいるか
//   onMeasure: function () { … },              // 測り直すたび、測る前に呼ぶ（札の中身の組み替えなど）
//   onResize: function () { … },               // 幅が変わったとき、測り直す前に呼ぶ（絵を組み直すなど）
//   stageHeight: function () { return px; },   // 枠の高さの基準。段によって枠の高さが変わるときに、いちばん高い段の高さを返す
//                                               // （留まる位置をこれで決めるので、段が替わっても枠の上端が動かない）。省けば枠の高さ
//   stepHeight: function (k) { return px; }    // 段 k のときの枠の高さ（札の間隔を段ごとに決めるのに使う）。省けば stageHeight と同じ
// });
// 戻り値の s.measure() で、絵の大きさが変わったあとに測り直せる。s.destroy() で片づける。
// 確認用の入口：host._scShow(k)（段を直接切り替えて固定する）、host._scUpdate()（いまの位置で段を決め直す）、host._scLock（固定中）
function Scrolly(host, opts) {
  if (!host) return null;
  if (!(window.CSS && CSS.supports && CSS.supports('height', '100svh'))) return null;
  var N = opts.steps.length;
  // 札が抜けてから次の札が枠にかかるまでの、出来事を見る間（画面の高さの何倍か）。動きは1.5〜2秒ほどに縮めてあるので、ふつうに読みながらスクロールしても（1秒に画面0.3〜0.5枚ぶん）、
  // 動きのほとんどが終わるまで次の札がかからない長さにする。0.35 では1秒前後で次の札が来て、動きの途中で枠が薄くなってしまった。
  // 0.65 では実演がスマホで画面12枚ぶんにもなったので、動きを短くしたうえで 0.5 にした
  var WATCH = opts.watch || 0.5;   // 長くしすぎると、1段ぶんのスクロール（枠の高さ＋札の高さ＋この間）が間延びする

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ---- 組み立て
  // 同じマス目に三つを重ねる。下から順に、留まる枠（.scly-stage）、流れる札の列（.scly-steps）、留まる帯（.scly-bar）。
  // 帯を枠と別にしているのは、帯を札より手前に置いて、札が帯の下にもぐって消えるようにするため
  var root = el('div', 'scly' + (opts.className ? ' ' + opts.className : ''));
  root.setAttribute('role', 'group');
  if (opts.label) root.setAttribute('aria-label', opts.label);

  var bar = el('div', 'scly-bar');
  var hint = el('span', 'scly-hint', opts.hint || 'スクロールで進みます');
  hint.setAttribute('aria-hidden', 'true');
  bar.appendChild(hint);

  var stage = el('div', 'scly-stage');
  stage.appendChild(opts.stage);

  var steps = el('div', 'scly-steps');
  var stepEls = [];
  var cardEls = opts.steps.map(function (s, i) {
    var step = el('div', 'scly-step');
    var card = el('div', 'scly-card');
    var title = el('p', 'scly-title');
    title.appendChild(typeof s.title === 'string' ? document.createTextNode(s.title) : s.title);
    card.appendChild(title);
    (s.nodes || []).forEach(function (n) { card.appendChild(n); });
    step.appendChild(card);
    steps.appendChild(step);
    stepEls.push(step);
    return card;
  });

  // 読み上げでは、札（見出しとコード）→絵、の順になるよう、札の列を先に置く（見た目の重なりは CSS の z-index で決める）
  root.appendChild(bar);
  root.appendChild(steps);
  root.appendChild(stage);
  host.appendChild(root);

  // ---- 段の切り替え
  var now = -1;
  function show(k) {
    if (k === now) return;
    var prev = now;
    now = k;
    cardEls.forEach(function (c, i) { c.classList.toggle('is-on', i === k); });
    hint.classList.toggle('is-off', k > 0);
    // 動きを見せるかは呼ぶ側が決める。前の段から進んできたとき（prev が -1 ＝開いたときは除く）だけ fwd
    if (opts.onStep) opts.onStep(k, prev, { fwd: prev >= 0 && k > prev, reduced: reduced() });
  }

  // ---- 留まる位置と札の間隔を、いまの画面に合わせる
  // ・上の帯（.site-head）の高さは字の折り返しで変わるので測る。せまい画面では帯が出ない（「目次」ボタンだけが浮く）ので 0。
  // ・枠の高さ（--scly-h）から、CSS が留まる位置（--scly-stick）を決める。段の切り替えの線は、その留まる位置（stickPx）。
  // ・札と札の間：札が枠の上端を抜けて（段が替わって）から、次の札が枠の下端にかかるまでに、
  //   出来事を見る間（画面の高さ × WATCH）ができる長さ＝その段の枠の高さ＋見る間。段ごとに枠の高さが違う（トップの表とグラフ）ときは、
  //   段ごとに決める（低い表の段で、余計に長くスクロールさせないため）。最後の札のあと（札の列の末尾の余白）も同じ長さにして、
  //   最後の出来事を見てから、枠が本文といっしょに流れ去るようにする
  var topPx = 0, stickPx = 0;
  var vhW = -1, vhFix = 0;   // 札の間隔に使う画面の高さ（幅が変わったときだけ測り直す）
  function measure() {
    if (opts.onMeasure) opts.onMeasure();
    var sh = document.querySelector('.site-head');
    var top = 0;
    if (sh && getComputedStyle(sh).position === 'sticky') top = Math.max(0, Math.floor(sh.getBoundingClientRect().height) - 1);
    topPx = top;
    root.style.setProperty('--scly-top', top + 'px');
    // 画面の高さは、幅が変わったときだけ測り直す。スマホでは、アドレスバーが出たり消えたりするたびに高さが変わり
    // resize が来るが、そのたびに札の間隔を変えると、読んでいる最中に実演の長さが伸び縮みしてしまうため
    // （留まる位置のほうは、CSS で 100svh（アドレスバーが出ているときの高さ）から決めるので、もともと動かない）
    if (vhW !== window.innerWidth) { vhW = window.innerWidth; vhFix = window.innerHeight; }
    var stageH = opts.stageHeight ? opts.stageHeight() : stage.offsetHeight;
    root.style.setProperty('--scly-h', Math.round(stageH) + 'px');
    var watch = vhFix * WATCH;
    var gaps = stepEls.map(function (s, i) { return Math.round((opts.stepHeight ? opts.stepHeight(i) : stageH) + watch) + 'px'; });
    stepEls.forEach(function (s, i) { s.style.marginTop = i ? gaps[i - 1] : ''; });
    steps.style.paddingBottom = gaps[N - 1];
    // 枠を、どこまで上げてよいか（--scly-min）：いちばん長い札でも、札の下端が枠の上端＋hook を越える（段が替わる）とき、
    // 札の頭が帯の下端から 1rem 下にある（見出しが見えている）位置。枠はこれより上には上げない（CSS の --scly-stick）。
    // hook は枠の高さで変わるので、いちばん低い段の枠で見る（hook が小さいほど、枠を下げる側に倒れる）
    var minH = opts.stepHeight ? Math.min.apply(null, stepEls.map(function (s, i) { return opts.stepHeight(i); })) : stageH;
    var longest = Math.max.apply(null, cardEls.map(function (c) { return c.offsetHeight; }));
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    root.style.setProperty('--scly-min', Math.round(top + bar.offsetHeight + rem + longest - hookOf(minH)) + 'px');
    stickPx =parseFloat(getComputedStyle(stage).top) || (topPx + bar.offsetHeight);
  }

  // 実演の領域にいるか（＝入れ物の頭が、留まる位置まで上がってきて帯が留まり始め、まだ枠が流れ去り始めていないか）。
  // 終わりのほうも見るのは、最後の札が抜けて枠が本文といっしょに上へ流れていくあいだ、帯だけが上に残って
  // 流れていく絵に重ならないようにするため
  function stuck() {
    var r = root.getBoundingClientRect();
    return r.top - topPx < 1.5 && r.bottom - (stickPx + stage.offsetHeight) > -1.5;
  }
  // 札の下端が、枠の上端からこれだけ下（枠の高さの割合、ただし上限 px）に来たら、抜けたものとみなす（＝ぎりぎりまだかかっている位置）
  // 使う側が opts.hook(枠の高さ) で変えられる（背の高いグラフで、札が枠を渡りきるまで待たせないように。16章）
  function hookOf(h) { return opts.hook ? opts.hook(h) : Math.min(h * 0.12, 72); }
  function hook() { return hookOf(stage.offsetHeight); }
  // ただし札が長いと、下端が枠にかかる頃には、札の頭の見出しが画面の上へ出てしまい、読んだ見出しが見えなくなってから出来事が始まる。
  // そこで、見出しの下端が、上の帯の下端からこれだけ下まで上がってきたとき（見出しがまだ読めるうち）も、抜けたものとみなす（どちらか早いほう）。
  // 札の頭で測ると、短い札でも、札がまだ枠に深くかかっているうちに始まってしまうので、見出しの下端で測る
  var HEAD_MARGIN = 16;
  // いまの段＝下端が、留まった枠の上端（stickPx）＋hook() を越えて上へ抜けた札のうち、いちばん後ろのもの。
  // まだ1枚も抜けていないあいだは1段目（その出来事は、1枚目の札が抜けたときに呼ぶ側が起こす。onUpdate の passed）。
  // 毎回、札の位置を測って決めるので、スクロールを戻しても（札の下端が枠の上端より下に戻れば前の段）、画面の大きさを変えても合う
  function update() {
    if (host._scLock) return;   // 確認用：段を固定しているあいだは、スクロールで動かさない
    var passed = 0, covered = false;
    var sr = stage.getBoundingClientRect();
    var line = stickPx + hook();
    var headLine = topPx + bar.offsetHeight + HEAD_MARGIN;
    cardEls.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var t = c.querySelector('.scly-title');
      var tb = t ? t.getBoundingClientRect().bottom : r.top;
      if (r.bottom < line || tb < headLine) passed++;
      // 札が枠にかかっているか（枠が留まる前や流れ去るときも、いまの枠の位置で見る）。
      // 切り替えの位置を越えた札（出来事がもう始まっている）は、まだ少しかかっていても数えない（出来事を薄いまま見せないように）
      else if (r.bottom > sr.top && r.top < sr.bottom) covered = true;
    });
    var live = stuck();
    // 帯は、実演の領域に入ってから出す（本文を読んでいるあいだ、帯だけがぽつんと見えたり、本文に重なったりしないように）
    root.classList.toggle('is-live', live);
    root.classList.toggle('is-covered', covered);
    show(Math.max(0, passed - 1));
    if (opts.onUpdate) opts.onUpdate(now, { passed: passed, live: live, reduced: reduced() });
  }
  var waiting = false;
  function onScroll() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(function () { waiting = false; update(); });
  }
  function onResize() {
    if (opts.onResize) opts.onResize();
    measure();
    onScroll();
  }
  function onLoad() { measure(); update(); }   // 書体や画像が入って高さが変わったあとに測り直す
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onLoad);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (root.parentNode) { measure(); onScroll(); } });

  host._scShow = function (k) { host._scLock = true; show(k); };   // 確認用：段を直接切り替えて固定する
  host._scUpdate = update;                                          // 確認用：いまのスクロール位置で段を決め直す（ヘッドレスでは描画の合図が来ないことがあるため）

  measure();
  update();

  return {
    root: root, cards: cardEls, stage: stage,
    measure: function () { measure(); onScroll(); },
    update: update,
    now: function () { return now; },
    // 片づけ：組み立てたものと、窓に足した合図を取り除く（作り直すときに、前のものが残らないように）
    destroy: function () {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onLoad);
      if (root.parentNode) root.parentNode.removeChild(root);
      delete host._scShow; delete host._scUpdate; delete host._scLock;
    }
  };
}
