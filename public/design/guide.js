/* Progressive enhancement only: the full guide and text brief are in HTML. */
(() => {
  const guide = document.querySelector('.stack-guide');
  if (!guide) return;
  const output = guide.querySelector('#guide-brief');
  const baseline = output.textContent;
  const inputs = [...guide.querySelectorAll('input[name="brief-tool"]')];
  const count = guide.querySelector('#brief-count');
  const status = guide.querySelector('[data-brief-status]');
  const update = () => {
    const chosen = inputs.filter(input => input.checked);
    const tools = chosen.map(input => {
      const card = input.closest('.tool-card');
      const sources = [...card.querySelectorAll('.tool-sources a')].map(link => '- ' + link.href);
      return ['## ' + card.querySelector('.tool-job').textContent + ': ' + card.querySelector('.tool-name').textContent,
        card.querySelector('.tool-why').textContent, card.querySelector('.tool-limits').textContent, ...sources].join('\n\n');
    });
    output.textContent = baseline + (tools.length ? '\n\n# Selected tools\n\n' + tools.join('\n\n') : '');
    count.textContent = chosen.length ? `${chosen.length} tool${chosen.length === 1 ? '' : 's'} included in your brief.` : 'Select tools to tailor this brief.';
    status.textContent = '';
  };
  inputs.forEach(input => input.addEventListener('change', update));
  guide.querySelector('[data-clear-tools]').addEventListener('click', () => {
    inputs.forEach(input => { input.checked = false; });
    update();
  });
  guide.querySelector('[data-copy-brief]').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(output.textContent);
      status.textContent = 'Agent brief copied.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(output);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Select Copy from your browser menu to copy the highlighted brief.';
    }
  });
  guide.querySelector('[data-download-brief]').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([output.textContent + '\n'], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = guide.dataset.profile + '-agent-brief.md';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Agent brief downloaded.';
  });
  guide.classList.add('is-enhanced');
  update();
  const links = [...guide.querySelectorAll('.guide-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      links.forEach(link => {
        if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -70% 0px' });
    links.forEach(link => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) observer.observe(section);
    });
  }
})();
