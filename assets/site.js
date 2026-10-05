// 目次の開閉（せまい画面用）と、コードのコピー止め。
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.querySelector('.menu-btn');
  var toc = document.querySelector('.toc');
  if (btn && toc) {
    btn.addEventListener('click', function () {
      var open = toc.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
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
