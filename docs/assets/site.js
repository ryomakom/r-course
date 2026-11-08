// 目次の開閉（せまい画面用）と、コードのコピー止め。
document.addEventListener('DOMContentLoaded', function () {
  // せまい画面では、目次はいまの画面に重ねて出す（CSS）。開いたら、いま読んでいる章が見える位置まで目次の中を送る。
  // 閉じるのは、もう一度ボタンを押す・目次の外を押す・Esc キーのどれか
  var btn = document.querySelector('.menu-btn');
  var toc = document.querySelector('.toc');
  if (btn && toc) {
    var setOpen = function (open) {
      toc.classList.toggle('open', open);
      document.documentElement.classList.toggle('toc-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '閉じる' : '目次';
      if (open) {
        var here = toc.querySelector('li.here');
        if (here) toc.scrollTop = here.offsetTop - toc.clientHeight / 3;
      }
    };
    btn.addEventListener('click', function () { setOpen(!toc.classList.contains('open')); });
    document.addEventListener('click', function (e) {
      if (toc.classList.contains('open') && !toc.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toc.classList.contains('open')) setOpen(false);
    });
    // 広い画面に戻したら、開いたままの状態を解く（広い画面では目次は左にいつも出ている）
    window.addEventListener('resize', function () {
      if (toc.classList.contains('open') && window.innerWidth > 900) setOpen(false);
    });
  }

  // コードはコピーできないようにしている（自分で打ち込んだほうが身につくため）。
  // 選択・コピー・切り取り・右クリック・ドラッグを、コードの枠のなかでだけ止める。
  function inCode(node) {
    while (node && node !== document) {
      if (node.nodeType === 1 && node.classList.contains('code')) return true;
      node = node.parentNode;
    }
    return false;
  }
  function touchesCode() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return false;
    for (var i = 0; i < sel.rangeCount; i++) {
      var r = sel.getRangeAt(i);
      if (inCode(r.startContainer) || inCode(r.endContainer)) return true;
      var box = r.commonAncestorContainer;
      if (box.nodeType !== 1) box = box.parentNode;
      var codes = box.querySelectorAll ? box.querySelectorAll('.code') : [];
      for (var j = 0; j < codes.length; j++) {
        if (r.intersectsNode(codes[j])) return true;
      }
    }
    return false;
  }
  var hint = null, hintTimer = null;
  function showHint() {
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'nocopy-hint';
      hint.setAttribute('role', 'status');
      hint.textContent = 'コードはコピーできません。自分の手で打ち込んでみてください。';
      document.body.appendChild(hint);
    }
    hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hint.classList.remove('show'); }, 2200);
  }
  ['copy', 'cut'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (touchesCode()) {
        e.preventDefault();
        showHint();
      }
    });
  });
  ['contextmenu', 'dragstart', 'selectstart'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (inCode(e.target)) e.preventDefault();
    });
  });

  // いま開いている章のリンクを目次のなかに見えるようにする
  var here = document.querySelector('.toc li.here');
  if (here && toc && toc.scrollHeight > toc.clientHeight) {
    var top = here.offsetTop - toc.clientHeight / 2;
    if (top > 0) toc.scrollTop = top;
  }
});
