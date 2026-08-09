// 目次の開閉（せまい画面用）とコードのコピーボタン。
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.querySelector('.menu-btn');
  var toc = document.querySelector('.toc');
  if (btn && toc) {
    btn.addEventListener('click', function () {
      var open = toc.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.code .copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var code = b.parentElement.querySelector('code');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(function () {
        var before = b.textContent;
        b.textContent = 'コピーしました';
        setTimeout(function () { b.textContent = before; }, 1400);
      }).catch(function () {
        b.textContent = 'コピーできません';
      });
    });
  });

  // いま開いている章のリンクを目次のなかに見えるようにする
  var here = document.querySelector('.toc li.here');
  if (here && toc && toc.scrollHeight > toc.clientHeight) {
    var top = here.offsetTop - toc.clientHeight / 2;
    if (top > 0) toc.scrollTop = top;
  }
});
