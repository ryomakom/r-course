// 読みながら、気になった場所にメモを書き残すための仕組み。
//
// ・右下の「メモ」ボタンを押すとメモモードになります。
// ・段落や囲み記事、コードの上にマウスを乗せると枠が出るので、クリックして書き込みます。
// ・メモはこのブラウザのなかに保存されます（サーバーには送りません）。
// ・「書き出す」を押すと、メモをまとめたテキストファイルが手に入ります。
//   そのファイルをClaudeに渡せば、場所（ファイル名と行番号）つきでまとめて直せます。
// ・公開しているサイトでは動きません。手元でファイルを直接開いたとき（file:）と
//   localhost で開いたときだけ使えます（判定は各ページの<head>で html に付ける local）。

(function () {
  if (!document.documentElement.classList.contains('local')) return;

  var KEY = 'r-course-notes-v1';
  var SEL = '[data-src]';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function save(notes) {
    try { localStorage.setItem(KEY, JSON.stringify(notes)); return true; }
    catch (e) {
      alert('メモを保存できませんでした。ブラウザの設定でこのページの保存が禁止されている可能性があります。\n書き出しはできますので、閉じる前に「書き出す」を押してください。');
      return false;
    }
  }

  var notes = load();
  var memoMode = false;

  // ---------------------------------------------------------- 部品の用意
  var bar = document.createElement('div');
  bar.className = 'memo-bar';
  bar.innerHTML =
    '<button type="button" class="memo-toggle">メモ</button>' +
    '<span class="memo-count"></span>' +
    '<button type="button" class="memo-list-btn" title="このサイト全体のメモを見る">一覧</button>' +
    '<button type="button" class="memo-export" title="テキストファイルに書き出す">書き出す</button>';
  document.body.appendChild(bar);

  var panel = document.createElement('div');
  panel.className = 'memo-panel';
  panel.innerHTML = '<div class="memo-panel-head"><strong>メモの一覧</strong>' +
    '<button type="button" class="memo-panel-close">閉じる</button></div>' +
    '<div class="memo-panel-body"></div>' +
    '<div class="memo-panel-foot">' +
    '<button type="button" class="memo-export2">テキストに書き出す</button>' +
    '<button type="button" class="memo-copy">クリップボードにコピー</button>' +
    '<button type="button" class="memo-clear">全部消す</button></div>';
  document.body.appendChild(panel);

  function excerpt(el) {
    var clone = el.cloneNode(true);
    // ボタンやメモ自体は抜粋に入れない
    clone.querySelectorAll('button, .memo-mark, .memo-editor').forEach(function (x) { x.remove(); });
    var t = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 70 ? t.slice(0, 70) + '…' : t;
  }

  function count() { return Object.keys(notes).length; }

  // 章ごと、行番号の小さい順に並べる（文字列順だと117行目が9行目より前に来てしまう）
  function sortedKeys() {
    return Object.keys(notes).sort(function (a, b) {
      var pa = a.split(':'), pb = b.split(':');
      if (pa[0] !== pb[0]) return pa[0] < pb[0] ? -1 : 1;
      return parseInt(pa[1], 10) - parseInt(pb[1], 10);
    });
  }

  function refreshCount() {
    var n = count();
    bar.querySelector('.memo-count').textContent = n ? n + '件' : '';
    bar.classList.toggle('has-notes', n > 0);
  }

  // 保存済みメモを、そのページの該当箇所に表示する
  function paint() {
    document.querySelectorAll('.memo-mark').forEach(function (m) { m.remove(); });
    document.querySelectorAll(SEL).forEach(function (el) {
      el.classList.remove('memo-has');
      var key = el.getAttribute('data-src');
      if (!notes[key]) return;
      el.classList.add('memo-has');
      var mark = document.createElement('div');
      mark.className = 'memo-mark';
      mark.textContent = notes[key].note;
      el.appendChild(mark);
    });
    refreshCount();
  }

  // ------------------------------------------------------ 書き込みの画面
  function openEditor(el) {
    var key = el.getAttribute('data-src');
    var existing = notes[key] ? notes[key].note : '';
    document.querySelectorAll('.memo-editor').forEach(function (e) { e.remove(); });

    var box = document.createElement('div');
    box.className = 'memo-editor';
    box.innerHTML =
      '<p class="memo-editor-loc">' + key.replace(':', '.md の ') + '行目</p>' +
      '<textarea rows="3" placeholder="気になったことを書いてください"></textarea>' +
      '<div class="memo-editor-btns">' +
      '<button type="button" class="memo-save">保存</button>' +
      '<button type="button" class="memo-del">消す</button>' +
      '<button type="button" class="memo-cancel">やめる</button></div>';
    el.appendChild(box);
    var ta = box.querySelector('textarea');
    ta.value = existing;
    ta.focus();

    box.addEventListener('click', function (ev) { ev.stopPropagation(); });

    box.querySelector('.memo-save').addEventListener('click', function () {
      var v = ta.value.trim();
      if (v) {
        notes[key] = {
          note: v,
          excerpt: excerpt(el),
          title: (document.querySelector('h1') || {}).textContent || '',
          page: location.pathname.split('/').pop()
        };
      } else {
        delete notes[key];
      }
      save(notes); box.remove(); paint();
    });
    box.querySelector('.memo-del').addEventListener('click', function () {
      delete notes[key]; save(notes); box.remove(); paint();
    });
    box.querySelector('.memo-cancel').addEventListener('click', function () {
      box.remove();
    });
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        box.querySelector('.memo-save').click();
      }
      if (ev.key === 'Escape') box.remove();
    });
  }

  // -------------------------------------------------------- メモモード
  function setMemoMode(on) {
    memoMode = on;
    document.body.classList.toggle('memo-mode', on);
    bar.querySelector('.memo-toggle').textContent = on ? 'メモをやめる' : 'メモ';
    if (!on) document.querySelectorAll('.memo-editor').forEach(function (e) { e.remove(); });
  }

  bar.querySelector('.memo-toggle').addEventListener('click', function () {
    setMemoMode(!memoMode);
  });

  document.addEventListener('click', function (ev) {
    if (!memoMode) return;
    if (ev.target.closest('.memo-bar, .memo-panel, .memo-editor')) return;
    var el = ev.target.closest(SEL);
    if (!el) return;
    if (ev.target.closest('a')) ev.preventDefault();   // メモ中はリンクで飛ばない
    openEditor(el);
  });

  // ------------------------------------------------------------ 書き出し
  function buildText() {
    var keys = sortedKeys();
    var out = ['# 「記者のためのR講座」への書き込み', '',
               '書き出した日時：' + new Date().toLocaleString('ja-JP'),
               'メモの数：' + keys.length + '件', ''];
    var lastFile = null;
    keys.forEach(function (k) {
      var parts = k.split(':');
      var file = 'content/' + parts[0] + '.md';
      if (file !== lastFile) { out.push('', '## ' + file, ''); lastFile = file; }
      out.push('### ' + parts[1] + '行目');
      out.push('もとの文：' + notes[k].excerpt);
      out.push('メモ：' + notes[k].note);
      out.push('');
    });
    return out.join('\n');
  }

  function download() {
    if (!count()) { alert('メモがまだありません。'); return; }
    var blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'メモ.md';
    document.body.appendChild(a); a.click(); a.remove();
  }

  bar.querySelector('.memo-export').addEventListener('click', download);
  panel.querySelector('.memo-export2').addEventListener('click', download);

  panel.querySelector('.memo-copy').addEventListener('click', function () {
    navigator.clipboard.writeText(buildText()).then(function () {
      panel.querySelector('.memo-copy').textContent = 'コピーしました';
      setTimeout(function () {
        panel.querySelector('.memo-copy').textContent = 'クリップボードにコピー';
      }, 1500);
    });
  });

  panel.querySelector('.memo-clear').addEventListener('click', function () {
    if (!confirm('メモを全部消します。よろしいですか。書き出していないものは戻せません。')) return;
    notes = {}; save(notes); paint(); showPanel();
  });

  // -------------------------------------------------------------- 一覧
  function showPanel() {
    var keys = sortedKeys();
    var body = panel.querySelector('.memo-panel-body');
    if (!keys.length) {
      body.innerHTML = '<p class="memo-empty">メモはまだありません。「メモ」を押して、気になった場所をクリックしてください。</p>';
    } else {
      body.innerHTML = keys.map(function (k) {
        var parts = k.split(':');
        return '<div class="memo-item">' +
          '<p class="memo-item-loc"><a href="' + parts[0] + '.html">' +
          parts[0] + '.md の ' + parts[1] + '行目</a></p>' +
          '<p class="memo-item-note">' + notes[k].note.replace(/</g, '&lt;') + '</p>' +
          '<p class="memo-item-ex">' + notes[k].excerpt.replace(/</g, '&lt;') + '</p></div>';
      }).join('');
    }
    panel.classList.add('open');
  }
  bar.querySelector('.memo-list-btn').addEventListener('click', showPanel);
  panel.querySelector('.memo-panel-close').addEventListener('click', function () {
    panel.classList.remove('open');
  });

  paint();
})();
