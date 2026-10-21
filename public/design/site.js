// Progressive navigation: links stay visible without JavaScript.
(() => {
  const button = document.querySelector('#menu-btn');
  const panel = document.querySelector('#mobile-nav');
  const desktop = matchMedia('(min-width: 768px)');
  if (button && panel) {
    document.documentElement.classList.add('has-js');
    const setOpen = (open, restore = false) => {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.hidden = !open;
      document.querySelector('#icon-menu').toggleAttribute('hidden', open);
      document.querySelector('#icon-close').toggleAttribute('hidden', !open);
      document.body.classList.toggle('menu-open', open);
      document.querySelector('main').inert = open;
      document.querySelector('footer').inert = open;
      if (open) panel.querySelector('a').focus();
      else if (restore) button.focus();
    };
    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', event => {
      if (button.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Escape') { setOpen(false, true); return; }
      if (event.key === 'Tab') {
        const last = [...panel.querySelectorAll('a')].at(-1);
        if (event.shiftKey && document.activeElement === button) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); button.focus(); }
      }
    });
    desktop.addEventListener('change', () => setOpen(false));
  }
  window.StackMenu = window.StackMenu || {};
  window.StackMenu.reveal = element => {
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > innerHeight) element.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
})();
