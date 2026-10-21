
  (function () {
    // Copy the llms.txt link
    var btn = document.getElementById('copy-llms'), status = document.getElementById('copy-status');
    btn.addEventListener('click', function () {
      var text = document.getElementById('llms-link').textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { status.textContent = 'Copied'; }, function () { status.textContent = 'Copy failed. Select the link and copy it manually.'; });
      setTimeout(function () { status.textContent = ''; }, 2000);
    });
  })();
