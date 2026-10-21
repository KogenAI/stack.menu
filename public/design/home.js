  // ---------- Agent link: copy to clipboard (hero field and agent panel) ----------
  [['hero-copy', 'hero-url', 'hero-copy-status'], ['copy-url', 'agent-url', 'copy-status']].forEach(function (ids) {
    var btn = document.getElementById(ids[0]);
    var urlEl = document.getElementById(ids[1]);
    var status = document.getElementById(ids[2]);
    if (!btn || !urlEl) return;
    var timer;
    function selectUrl() {
      var range = document.createRange(); range.selectNodeContents(urlEl);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    }
    function done() {
      btn.setAttribute('data-copied', ''); btn.setAttribute('aria-label', 'Link copied');
      status.textContent = 'Link copied';
      clearTimeout(timer);
      timer = setTimeout(function () { btn.removeAttribute('data-copied'); btn.setAttribute('aria-label', 'Copy link'); status.textContent = ''; }, 1800);
    }
    function failed() {
      selectUrl();
      status.textContent = 'Copying is blocked here. The link is selected, so press Ctrl+C (or Cmd+C) to copy it.';
    }
    btn.addEventListener('click', function () {
      var text = urlEl.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          selectUrl();
          try { document.execCommand('copy') ? done() : failed(); } catch (e) { failed(); }
        });
      } else {
        selectUrl();
        try { document.execCommand('copy') ? done() : failed(); } catch (e) { failed(); }
      }
    });
  });

  // Keep the two views of this recording from playing over one another.
  document.querySelectorAll('.demo-video').forEach(function (video) {
    video.addEventListener('play', function () {
      document.querySelectorAll('.demo-video').forEach(function (other) {
        if (other !== video) other.pause();
      });
    });
  });
