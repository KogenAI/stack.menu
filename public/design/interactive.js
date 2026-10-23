/* Adapted from Oghogho’s editable design; canonical data is generated at build time. */

  (function () {
    if (!document.querySelector('main[data-interactive="library"]')) return;
    var data = window.StackFolders;
    if (!data || !data.mount) return;
    var GROUPS = Array.from(new Set(data.stacks.map(function (stack) { return stack.group; })));
    var groupsEl = document.getElementById('stack-groups');
    groupsEl.replaceChildren();
    var countEl = document.getElementById('result-count');
    var input = document.getElementById('stack-search');
    var empty = document.getElementById('no-results');
    var chips = [].slice.call(document.querySelectorAll('#type-filter .chip'));
    var state = { group: 'all', query: '' };
    var sections = [];

    function plural(n) { return n + (n === 1 ? ' guide' : ' guides'); }

    // A titled section per group, each with its own folder grid
    GROUPS.forEach(function (group, i) {
      var ids = data.stacks.filter(function (s) { return s.group === group; }).map(function (s) { return s.id; });
      var section = document.createElement('section');
      section.className = '';
      section.setAttribute('aria-labelledby', 'group-' + i);
      section.innerHTML =
        '<div class="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1" data-head>' +
          '<h2 id="group-' + i + '" class="flex items-baseline gap-3 whitespace-nowrap text-[20px] font-semibold leading-7 tracking-[-0.01em] text-ink">' +
            '<span></span><span class="eyebrow font-normal text-body" data-count></span>' +
          '</h2>' +
        '</div>' +
        '<div class="mt-2 grid grid-cols-1 justify-items-center gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-4"></div>';
      section.querySelector('h2 span').textContent = group;
      var grid = section.querySelector('.grid');
      grid.setAttribute('data-ids', ids.join(','));
      groupsEl.appendChild(section);
      data.mount(grid);
      sections.push({ el: section, group: group, head: section.querySelector('[data-head]'), count: section.querySelector('[data-count]'), cells: [].slice.call(grid.querySelectorAll('.gf-cell')) });
    });

    // ---------- Compare: toggle, per-folder checkboxes (max 3), floating bar ----------
    var MAX = 3;
    var main = document.querySelector('main');
    var toggle = document.getElementById('compare-toggle');
    var tray = document.getElementById('compare-tray');
    var trayCount = document.getElementById('compare-count');
    var goBtn = document.getElementById('compare-go');
    var boxes = [];
    sections.forEach(function (sec) {
      sec.cells.forEach(function (cell) {
        var name = cell.querySelector('.gf-title').textContent;
        var wrap = document.createElement('label');
        wrap.className = 'compare-check';
        wrap.innerHTML = '<input type="checkbox" class="checkbox">';
        var box = wrap.firstChild;
        box.setAttribute('aria-label', 'Compare ' + name);
        box.value = cell.getAttribute('data-id');
        box.addEventListener('change', updateCompare);
        cell.appendChild(wrap);
        boxes.push(box);
      });
    });
    function updateCompare() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) { b.disabled = !b.checked && n >= MAX; });
      tray.hidden = n === 0;
      trayCount.innerHTML = n + (n === 1 ? ' stack' : ' stacks') + ' selected <span>· ' + (n >= MAX ? 'max reached' : 'up to ' + MAX) + '</span>';
      var ready = n >= 2;
      var picked = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      goBtn.href = ready ? '/compare/?stacks=' + picked.join(',') : '#';
      goBtn.setAttribute('aria-disabled', String(!ready));
      goBtn.title = ready ? '' : 'Pick at least 2 stacks';
    }
    function setCompare(on) {
      toggle.setAttribute('aria-checked', String(on));
      if (on) main.setAttribute('data-compare', ''); else main.removeAttribute('data-compare');
      if (!on) boxes.forEach(function (b) { b.checked = false; });
      updateCompare();
    }
    toggle.addEventListener('click', function () {
      var on = toggle.getAttribute('aria-checked') !== 'true';
      setCompare(on);
      // Turning compare on scrolls the folders into view so the new checkboxes are seen
      if (on) {
        var top = toggle.parentNode.getBoundingClientRect().top + window.scrollY - 24;
        if (top > window.scrollY) {
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
        }
      }
    });
    document.getElementById('compare-cancel').addEventListener('click', function () { setCompare(false); toggle.focus(); });
    goBtn.addEventListener('click', function (e) { if (goBtn.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    // The toggle sits on the first visible group's title row
    function placeToggle() {
      var first = sections.filter(function (s) { return !s.el.hidden; })[0];
      toggle.hidden = !first;
      if (first && toggle.parentNode !== first.head) first.head.appendChild(toggle);
    }

    // Words to search per stack; a term matches the start of a word, so "rust" finds Rust but not "trust"
    var words = {};
    data.stacks.forEach(function (s) {
      words[s.id] = (s.label + ' ' + s.lang + ' ' + (data.search[s.id] || '')).toLowerCase().split(/[\s/+.·-]+/).filter(Boolean);
    });
    function matches(id, term) { return words[id].some(function (w) { return w.indexOf(term) === 0; }); }

    function apply() {
      var terms = state.query.toLowerCase().split(/[\s,/+.·-]+/).filter(Boolean);
      var total = 0;
      sections.forEach(function (sec) {
        var inGroup = state.group === 'all' || state.group === sec.group;
        var shown = 0;
        sec.cells.forEach(function (cell) {
          var hit = inGroup && terms.every(function (t) { return matches(cell.getAttribute('data-id'), t); });
          cell.hidden = !hit;
          if (hit) shown++;
        });
        sec.el.hidden = shown === 0;
        sec.count.textContent = plural(shown);
        total += shown;
      });
      countEl.textContent = plural(total);
      empty.hidden = total !== 0;
      document.getElementById('no-results-term').textContent = state.query;
      placeToggle();
    }

    // Pill selection: pass null to show search results with no pill selected
    function selectChip(group) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-group') === group)); });
    }
    function showGroup(group) {
      state.group = group; state.query = ''; input.value = '';
      selectChip(group); apply();
    }

    // A pill shows that group and clears any search
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        showGroup(chip.getAttribute('data-group'));
        var first = groupsEl.querySelector('.gf-cell:not([hidden])');
        if (window.StackMenu) window.StackMenu.reveal(empty.hidden ? first : empty);
      });
    });
    // Search runs only when the user presses Enter; results span every group, so no pill stays selected
    document.getElementById('search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) { showGroup('all'); return; }
      state.group = 'all'; state.query = q;
      selectChip(null); apply();
    });
    // Emptying the field (backspace or the clear x) after a search returns to All stacks
    input.addEventListener('input', function () { if (!input.value && state.query) showGroup('all'); });
    document.getElementById('clear-search').addEventListener('click', function () { showGroup('all'); input.focus(); });

    apply();
  })();


  (function () {
    if (!document.querySelector('main[data-interactive="compare"]')) return;
    var P = window.StackInteractiveProfiles;
    if (!P) return;
    var KIND = { web: 'Web app', api: 'API', cli: 'Command-line tool', automation: 'Automation', ios: 'iOS app', android: 'Android app' };
    var UI = { server: 'Server-rendered UI', full: 'Server and client UI', client: 'Browser UI', none: 'No UI', terminal: 'Terminal UI', native: 'Native UI' };
    var HOST = { server: 'Runs on a server', node: 'Runs on Node.js', static: 'Static hosting', binary: 'Ships as a single binary', native: 'Installed on the device' };

    // The seven criteria, each read from the matching field of the stack guide
    var CRITERIA = [
      { id: 'role', label: 'Role', on: true, render: function (p) {
          return head(p.group) + list([p.kind.map(function (k) { return KIND[k] || k; }).join(' + '), UI[p.ui] || p.ui, HOST[p.host] || p.host]); } },
      { id: 'why', label: 'Why choose it', on: true, render: function (p) { return head(p.summary) + list(p.choose_when); } },
      { id: 'shape', label: 'Application shape', on: true, render: function (p) { return '<ul class="cell-list"><li>' + esc(p.shape) + '</li></ul>'; } },
      { id: 'tradeoff', label: 'Main tradeoff', on: true, render: function (p) { return list([p.tradeoff]); } },
      { id: 'avoid', label: 'Choose another path when', on: true, render: function (p) { return list(p.avoid_when); } },
      { id: 'practices', label: 'Working practices', on: false, render: function (p) { return list(p.best_practices); } },
      { id: 'questions', label: 'Questions to resolve', on: false, render: function (p) { return list(p.open_questions); } }
    ];

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function head(s) { return '<p class="cell-head">' + esc(s) + '</p>'; }
    function body(s, first) { return '<p class="cell-body"' + (first ? ' style="margin-top:0"' : '') + '>' + esc(s) + '</p>'; }
    function list(items) { return '<ul class="cell-list">' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>'; }

    // Stacks come from the link: compare.html?stacks=id,id(,id)
    var params = new URLSearchParams(location.search);
    var ids = (params.get('stacks') || '').split(',').map(function (s) { return s.trim(); })
      .filter(function (id, i, a) { return Object.hasOwn(P, id) && a.indexOf(id) === i; }).slice(0, 3);

    var headRow = document.getElementById('compare-head');
    var rows = document.getElementById('compare-rows');
    var table = document.getElementById('compare-table');

    function render() {
      var enough = ids.length >= 2;
      document.getElementById('compare-body').hidden = !enough;
      document.getElementById('compare-empty').hidden = enough;
      if (!enough) return;
      table.style.setProperty('--cols', ids.length);

      headRow.innerHTML = '<th scope="col" class="row-label">Criterion</th>' + ids.map(function (id) {
        var p = P[id];
        var remove = ids.length > 2
          ? '<button type="button" class="remove-stack" data-remove="' + id + '" aria-label="Remove ' + esc(p.title) + ' from comparison"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>'
          : '';
        // Name at the top; language and guide button pinned to the bottom so they line up across columns
        return '<th scope="col"><div class="head-inner">' +
          '<div class="flex items-start justify-between gap-2"><p class="stack-name text-[20px] font-semibold leading-7 tracking-[-0.01em] text-ink">' + esc(p.title) + '</p>' + remove + '</div>' +
          '<div class="head-meta">' +
            '<span class="text-[14px] font-normal leading-5 text-body">' + esc(p.language) + '</span>' +
            '<a href="' + esc(p.guide_url) + '" class="btn-secondary stack-guide h-10 px-4 text-[14px]">Open complete guide</a>' +
          '</div></div></th>';
      }).join('');

      rows.innerHTML = CRITERIA.map(function (c) {
        return '<tr data-crit="' + c.id + '"' + (c.on ? '' : ' hidden') + '>' +
          '<th scope="row" class="row-label eyebrow text-left font-normal text-body">' + c.label + '</th>' +
          ids.map(function (id) {
            return '<td data-stack="' + esc(P[id].title) + '"><span class="cell-label eyebrow text-body">' + c.label + '</span>' + c.render(P[id]) + '</td>';
          }).join('') + '</tr>';
      }).join('');

      // Phone header: titles, and the guide menu listing each stack
      var titles = document.getElementById('mobile-titles');
      titles.style.setProperty('--cols', ids.length);
      var names = ids.map(function (id) { return P[id].title; });
      titles.textContent = names.length > 2 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names.join(' and ');
      menu.innerHTML = ids.map(function (id) {
        return '<a href="' + esc(P[id].guide_url) + '">' + esc(P[id].title) + '<span>' + esc(P[id].language) + '</span></a>';
      }).join('');
    }

    // Guide menu (phones): opens under the button; Escape or a tap outside closes it
    var menu = document.getElementById('guide-menu');
    var menuBtn = document.getElementById('guide-toggle');
    function setMenu(open) { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); }
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); if (!menu.hidden) menu.querySelector('a').focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    document.addEventListener('pointerdown', function (e) { if (!menu.hidden && !e.target.closest('.guide-menu-wrap')) setMenu(false); });

    // Criteria checkboxes
    var listEl = document.getElementById('crit-list');
    var allBox = document.getElementById('crit-all');
    var boxes = CRITERIA.map(function (c) {
      var label = document.createElement('label');
      label.className = 'crit';
      label.innerHTML = '<input type="checkbox" class="checkbox"' + (c.on ? ' checked' : '') + '>' + c.label;
      var box = label.firstChild;
      box.addEventListener('change', function () { c.on = box.checked; syncCriteria(); });
      listEl.appendChild(label);
      return box;
    });
    allBox.addEventListener('change', function () {
      CRITERIA.forEach(function (c, i) { c.on = allBox.checked; boxes[i].checked = allBox.checked; });
      syncCriteria();
    });
    function syncCriteria() {
      var n = CRITERIA.filter(function (c) { return c.on; }).length;
      allBox.checked = n === CRITERIA.length;
      allBox.indeterminate = n > 0 && n < CRITERIA.length;
      document.getElementById('crit-count').textContent = n + ' of ' + CRITERIA.length + ' selected';
      CRITERIA.forEach(function (c) { var tr = rows.querySelector('[data-crit="' + c.id + '"]'); if (tr) tr.hidden = !c.on; });
    }

    // Remove a stack (only offered while three are shown); the link updates to match
    headRow.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove]');
      if (!btn) return;
      ids = ids.filter(function (id) { return id !== btn.getAttribute('data-remove'); });
      history.replaceState(null, '', '?stacks=' + ids.join(','));
      render(); syncCriteria();
    });

    render(); syncCriteria();
  })();


  (function () {
    if (!document.querySelector('main[data-interactive="recommend"]')) return;
    // The maintained records own the application kinds and shortlist membership.
    var OPTIONS = [
      { id: 'web', label: 'Website or web app', title: 'websites and web apps', ids: ['elixir-phoenix-liveview', 'typescript-next-node', 'typescript-react-vite-browser', 'rails-hotwire-postgresql', 'laravel-livewire-postgresql', 'python-django'] },
      { id: 'api', label: 'API or backend service', title: 'APIs and backend services', ids: ['go-service', 'rust-service', 'python-fastapi', 'elixir-phoenix-liveview'] },
      { id: 'cli', label: 'Command-line tool', title: 'command-line tools', ids: ['go-cli', 'rust-cli'] },
      { id: 'automation', label: 'Automation, scripts or AI workflows', title: 'automation, scripts and AI workflows', ids: ['python-scripts-workers'] },
      { id: 'ios', label: 'iPhone or iPad app', title: 'iPhone and iPad apps', ids: ['swift-swiftui-ios'] },
      { id: 'android', label: 'Android app', title: 'Android apps', ids: ['kotlin-compose-android'] },
      { id: 'other', label: 'Something else', title: '', ids: [] }
    ];
    OPTIONS.forEach(function (o) { o.ids = Object.keys(window.StackInteractiveProfiles).filter(function (id) { return window.StackInteractiveProfiles[id].kind.indexOf(o.id) !== -1; }); });
    var MAX_COMPARE = 3;

    var stage = document.getElementById('stage');
    var host = document.getElementById('folders');
    var msg = document.getElementById('msg'), gap = document.getElementById('gap');
    var matchLabel = document.getElementById('match-label'), allLabel = document.getElementById('all-label');
    var compare = document.getElementById('compare'), compareBtn = document.getElementById('compare-btn');
    var compareLabel = compareBtn.querySelector('[data-label]'), compareHint = document.getElementById('compare-hint');
    var compareCancel = document.getElementById('compare-cancel');
    var cells = [].slice.call(host.querySelectorAll('.gf-cell'));
    if (!cells.length) return;
    var byId = Object.create(null);
    cells.forEach(function (c) { byId[c.getAttribute('data-id')] = c; });

    var current = null, picking = false;
    var revealEl = document.getElementById('reveal');

    // ---- Options ----
    var opts = document.getElementById('opts');
    OPTIONS.forEach(function (o) {
      var label = document.createElement('label');
      label.className = 'opt';
      label.innerHTML = '<input type="radio" name="build" value="' + o.id + '"><span></span>';
      label.querySelector('span').appendChild(document.createTextNode(o.label));
      label.querySelector('input').addEventListener('change', function () { choose(o); });
      opts.appendChild(label);
    });

    // ---- Pick-to-compare checkboxes (only used when more than 3 stacks match) ----
    cells.forEach(function (cell) {
      var name = cell.querySelector('.gf-title').textContent;
      var wrap = document.createElement('label');
      wrap.className = 'rec-check';
      wrap.innerHTML = '<input type="checkbox" class="checkbox">';
      var box = wrap.firstChild;
      box.setAttribute('aria-label', 'Compare ' + name);
      box.value = cell.getAttribute('data-id');
      box.addEventListener('change', updatePicks);
      cell.appendChild(wrap);
      // While picking, a click on a centred folder ticks it instead of opening the guide
      cell.querySelector('.gf-hit').addEventListener('click', function (e) {
        if (picking && cell.classList.contains('is-center')) { e.preventDefault(); if (!box.disabled || box.checked) { box.checked = !box.checked; updatePicks(); } }
      });
    });
    function boxes() { return cells.filter(function (c) { return c.classList.contains('is-center'); }).map(function (c) { return c.querySelector('.rec-check input'); }); }
    function picked() { return boxes().filter(function (b) { return b.checked; }).map(function (b) { return b.value; }); }
    function updatePicks() {
      var ids = picked(), n = ids.length;
      boxes().forEach(function (b) { b.disabled = !b.checked && n >= MAX_COMPARE; });
      var ready = n >= 2;
      compareBtn.href = ready ? '/compare/?stacks=' + ids.join(',') : '#';
      compareBtn.setAttribute('aria-disabled', String(!ready));
      compareLabel.textContent = n ? 'Compare ' + n + ' of ' + MAX_COMPARE : 'Compare';
    }
    function setPicking(on) {
      picking = on;
      if (on) stage.setAttribute('data-picking', ''); else stage.removeAttribute('data-picking');
      cells.forEach(function (c) { var b = c.querySelector('.rec-check input'); b.checked = false; b.disabled = false; });
      compareBtn.className = on ? 'btn-primary' : 'btn-secondary';
      compareHint.hidden = !on; compareCancel.hidden = !on;
      if (on) updatePicks(); else setCompareLink();
    }
    function setCompareLink() {
      var ids = current ? current.ids : [];
      compareLabel.textContent = 'Compare stacks';
      compareBtn.removeAttribute('aria-disabled');
      // 2 or 3 matches compare straight away; more than 3 asks the viewer to pick
      compareBtn.href = ids.length >= 2 && ids.length <= MAX_COMPARE ? '/compare/?stacks=' + ids.join(',') : '#';
    }
    compareBtn.addEventListener('click', function (e) {
      if (!current) return;
      if (picking) { if (compareBtn.getAttribute('aria-disabled') === 'true') e.preventDefault(); return; }
      if (current.ids.length > MAX_COMPARE) { e.preventDefault(); setPicking(true); var first = boxes()[0]; if (first) first.focus(); }
    });
    compareCancel.addEventListener('click', function () { setPicking(false); compareBtn.focus(); });

    var clearSel = document.getElementById('clear-sel');
    clearSel.addEventListener('click', function () {
      var on = opts.querySelector('input:checked');
      if (on) on.checked = false;
      current = null;
      history.replaceState(null, '', location.pathname);
      if (picking) setPicking(false);
      clearSel.hidden = true;
      layout(true);
      var first = opts.querySelector('input'); if (first) first.focus();
    });

    function choose(o) {
      current = o;
      history.replaceState(null, '', '?kind=' + encodeURIComponent(o.id));
      clearSel.hidden = false;
      if (picking) setPicking(false);
      setCompareLink();
      layout(true);
      if (window.StackMenu) window.StackMenu.reveal(revealEl);
    }

    // ---- Layout: picked folders in a centred grid, the rest in an overlapping row at the bottom ----
    function layout(animate) {
      var vw = stage.clientWidth;
      var small = vw < 640;
      var CW = 220, CH = (byId[cells[0].getAttribute('data-id')].offsetHeight) || 211;
      var ids = current ? current.ids : [];
      var pickedSet = {};
      ids.forEach(function (id) { pickedSet[id] = true; });
      var n = ids.length;

      // Centre grid: as many columns as fit while folders stay readable
      var cgap = small ? 12 : 24, cols = n, rows = 1, cs = 1;
      if (n) {
        var minScale = small ? .6 : .72;
        for (cols = n; cols >= 1; cols--) {
          rows = Math.ceil(n / cols);
          cs = Math.min(1, (vw - cgap * (cols - 1)) / (cols * CW));
          if (cs >= minScale || cols === 1) break;
        }
      }
      var cellW = CW * cs, cellH = CH * cs;
      var labelH = 36;                       // "6 stacks for …" above the grid
      var gridH = n ? rows * cellH + (rows - 1) * cgap : 0;
      var compareH = n >= 2 ? 72 : 0;

      // Centre area height: grid + label + compare, or the message / no-guide panel
      var centreH;
      if (n) centreH = labelH + gridH + compareH + 24;
      else if (current && current.id === 'other') centreH = gap.offsetHeight + 48;
      else centreH = small ? 160 : 220;

      // Bottom row of the remaining folders
      var rest = cells.filter(function (c) { return !pickedSet[c.getAttribute('data-id')]; });
      var m = Math.max(rest.length, 1);
      var rs = small ? .38 : vw < 1024 ? .44 : .52;
      var rw = CW * rs, rh = CH * rs;
      var step = m < 2 ? 0 : Math.min(rw + 12, (vw - rw) / (m - 1));
      var rowW = step * (m - 1) + rw;
      var rowX = (vw - rowW) / 2;
      var rowLabelY = centreH + 24;
      var rowY = rowLabelY + 32;
      stage.style.height = (rowY + rh + 8) + 'px';
      // Area to bring into view after a choice: the matches and Compare, or the no-guide panel
      revealEl.style.height = Math.max(1, n ? labelH + gridH + compareH : centreH) + 'px';

      // Place
      var order = 0;
      cells.forEach(function (c, i) {
        var id = c.getAttribute('data-id'), isPicked = !!pickedSet[id];
        c.classList.toggle('is-center', isPicked);
        c.classList.toggle('is-dim', !!current && !isPicked);
        c.style.zIndex = isPicked ? 30 : 10 + i;
        var x, y, s;
        if (isPicked) {
          var k = ids.indexOf(id), r = Math.floor(k / cols), col = k % cols;
          var inRow = Math.min(cols, n - r * cols);
          var rowWidth = inRow * cellW + (inRow - 1) * cgap;
          x = (vw - rowWidth) / 2 + col * (cellW + cgap);
          y = labelH + r * (cellH + cgap);
          s = cs;
          c.style.transitionDelay = animate ? (order++ * 60) + 'ms' : '0ms';
        } else {
          x = rowX + rest.indexOf(c) * step; y = rowY; s = rs;
          c.style.transitionDelay = '0ms';
        }
        c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        c.style.setProperty('--gf-tip-scale', (1 / s).toFixed(3));
      });

      // Messages
      msg.style.top = (centreH / 2 - msg.offsetHeight / 2) + 'px';
      msg.classList.toggle('is-hidden', !!current);
      gap.style.top = '0px';
      var isGap = !!current && current.id === 'other';
      gap.classList.toggle('is-hidden', !isGap);
      gap.setAttribute('aria-hidden', String(!isGap));
      matchLabel.style.top = '0px';
      matchLabel.classList.toggle('is-hidden', !n);
      matchLabel.textContent = n ? n + (n === 1 ? ' stack for ' : ' stacks for ') + current.title : '';
      compare.style.top = (labelH + gridH + 24) + 'px';
      compare.classList.toggle('is-hidden', n < 2);
      allLabel.style.top = rowLabelY + 'px';
      allLabel.textContent = n ? 'Other stack guides' : Object.keys(window.StackInteractiveProfiles).length + ' stack guides';
    }

    // Accept useful shared links without allowing query text into markup.
    var query = new URLSearchParams(location.search);
    var requestedKind = query.get('kind');
    var requestedStackId = query.get('stack');
    var requestedStack = Object.hasOwn(window.StackInteractiveProfiles, requestedStackId) ? window.StackInteractiveProfiles[requestedStackId] : null;
    if (!requestedKind && requestedStack) requestedKind = requestedStack.kind[0];
    var initialOption = OPTIONS.filter(function (o) { return o.id === requestedKind; })[0];
    if (initialOption) {
      var initialRadio = opts.querySelector('input[value="' + initialOption.id + '"]');
      initialRadio.checked = true;
      current = initialOption; clearSel.hidden = false; setCompareLink();
    }

    // First paint without animation, then animate every later change
    cells.forEach(function (c) { c.style.transition = 'none'; });
    layout(false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { cells.forEach(function (c) { c.style.transition = ''; }); }); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(false); }, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(false); });
  })();


  (function () {
    if (!document.querySelector('main[data-interactive="rewrite"]')) return;
    var BASE = '/';
    var SVG = function (w, body) { return '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>'; };
    var ICON = {
      chev: function (cls) { return SVG(20, '<path d="m6 9 6 6 6-6"/>').replace('<svg ', '<svg class="' + cls + '" '); },
      arrow: SVG(20, '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
      arrowSm: SVG(16, '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
      check: SVG(18, '<path d="M20 6 9 17l-5-5"/>'),
      ext: SVG(16, '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
      copy: SVG(16, '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
      download: SVG(18, '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
      download20: SVG(20, '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
      split: SVG(20, '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>'),
      circleCheck: SVG(20, '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>')
    };
    var GROUPS = Array.from(new Set(Object.keys(window.StackInteractiveProfiles).map(function (id) { return window.StackInteractiveProfiles[id].group; })));

    // Contract descriptions come directly from the maintained research.
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function fmtDate(iso) { var d = new Date(iso + 'T00:00:00'); return d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear(); }
    function guideHref(id) { return '/stacks/' + encodeURIComponent(id) + '/'; }
    function extLink(cls, href, label) { return '<a class="' + cls + '" href="' + href + '" target="_blank" rel="noopener">' + esc(label) + ICON.ext + '<span class="sr-only"> (opens in a new tab)</span></a>'; }

    var out = document.getElementById('rw-out');
    var params = new URLSearchParams(location.search);
    var state = { from: '', to: '', mode: 'incremental', scope: '', boundary: '', retained: '', changed: '', confirmed: false };

    Promise.all([
      fetch(BASE + 'rewrite/contracts.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(BASE + 'selection-index.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      import('/design/migration-fit.js')
    ]).then(function (res) { start(res[0], res[1], res[2].assessMigration); }).catch(function () {
      // Error state: the records could not be read; the files themselves stay linked
      document.querySelectorAll('[data-picker]').forEach(function (p) { p.innerHTML = '<button type="button" class="picker-btn" disabled><span class="ph">Unavailable</span></button>'; });
      out.innerHTML = '<div class="guide-wrap" style="padding-block:48px 112px"><div class="state"><h2>The rewrite records didn’t load</h2><p>Open them directly instead: <a href="' + BASE + 'rewrite/guide.md">rewrite guide.md</a> · <a href="' + BASE + 'rewrite/contracts.json">contracts.json</a></p></div></div>';
    });

    /* ---------- Select/Stack: button + listbox that always opens downward ---------- */
    function makePicker(el, profiles, labelId, onPick) {
      var key = el.getAttribute('data-picker'), listId = 'list-' + key, value = '';
      var opts = [];
      el.innerHTML =
        '<button type="button" class="picker-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + listId + '" aria-labelledby="' + labelId + ' btn-' + key + '" id="btn-' + key + '"><span></span>' + ICON.chev('') + '</button>' +
        '<div class="picker-list" id="' + listId + '" role="listbox" tabindex="-1" aria-labelledby="' + labelId + '">' +
        GROUPS.map(function (g, gi) {
          var items = profiles.filter(function (p) { return p.group === g; });
          return '<div class="picker-group" role="group" aria-labelledby="' + key + '-g' + gi + '"><div class="picker-group-title eyebrow" id="' + key + '-g' + gi + '">' + esc(g) + '</div>' +
            items.map(function (p) {
              return '<div class="picker-opt" role="option" id="' + key + '-' + p.id + '" data-id="' + p.id + '" aria-selected="false"><span class="picker-opt-text"><span class="picker-opt-title">' + esc(p.title) + '</span><span class="picker-opt-sub">' + esc(p.language) + '</span></span>' + ICON.check + '</div>';
            }).join('') + '</div>';
        }).join('') + '</div>';
      var btn = el.querySelector('.picker-btn'), list = el.querySelector('.picker-list'), label = btn.querySelector('span');
      opts = Array.prototype.slice.call(list.querySelectorAll('.picker-opt'));
      var active = -1;

      function show() {
        var p = profiles.filter(function (x) { return x.id === value; })[0];
        label.className = p ? '' : 'ph';
        label.textContent = p ? p.title : el.getAttribute('data-ph');
        opts.forEach(function (o) { o.setAttribute('aria-selected', String(o.getAttribute('data-id') === value)); });
      }
      function setActive(i) {
        if (active > -1) opts[active].classList.remove('active');
        active = Math.max(0, Math.min(opts.length - 1, i));
        opts[active].classList.add('active');
        list.setAttribute('aria-activedescendant', opts[active].id);
        var o = opts[active], top = o.offsetTop, bottom = top + o.offsetHeight;
        if (top < list.scrollTop + 8) list.scrollTop = top - 36;
        else if (bottom > list.scrollTop + list.clientHeight - 8) list.scrollTop = bottom - list.clientHeight + 8;
      }
      function open() {
        if (list.classList.contains('open')) return;
        document.querySelectorAll('.picker-list.open').forEach(function (l) { if (l !== list) l.dispatchEvent(new Event('close')); });
        list.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
        var i = opts.findIndex(function (o) { return o.getAttribute('data-id') === value; });
        list.scrollTop = 0;
        setActive(i < 0 ? 0 : i);
        list.focus({ preventScroll: true });
        // Always opens below. If the bottom of the list is off screen, scroll the page so it fits.
        var r = list.getBoundingClientRect(), over = r.bottom - window.innerHeight + 16;
        if (over > 0) window.scrollBy({ top: over, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      function close(focusBtn) {
        if (!list.classList.contains('open')) return;
        list.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
        if (active > -1) opts[active].classList.remove('active');
        active = -1; list.removeAttribute('aria-activedescendant');
        if (focusBtn) btn.focus();
      }
      function pick(i) { value = opts[i].getAttribute('data-id'); show(); close(true); onPick(value); }

      list.addEventListener('close', function () { close(false); });
      btn.addEventListener('click', function (e) { list.classList.toggle('kb', e.detail === 0); list.classList.contains('open') ? close(true) : open(); });
      btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); list.classList.add('kb'); open(); } });
      list.addEventListener('keydown', function () { list.classList.add('kb'); });
      list.addEventListener('pointermove', function () { list.classList.remove('kb'); });
      list.addEventListener('click', function (e) { var o = e.target.closest('.picker-opt'); if (o) pick(opts.indexOf(o)); });
      list.addEventListener('mousemove', function (e) { var o = e.target.closest('.picker-opt'); if (o && opts.indexOf(o) !== active) { if (active > -1) opts[active].classList.remove('active'); active = opts.indexOf(o); list.setAttribute('aria-activedescendant', o.id); } });
      var typed = '', typedAt = 0;
      list.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
        else if (e.key === 'End') { e.preventDefault(); setActive(opts.length - 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active > -1) pick(active); }
        else if (e.key === 'Escape') { e.preventDefault(); close(true); }
        else if (e.key === 'Tab') { close(false); }
        else if (e.key.length === 1) {
          // Type-ahead: jump to the first stack whose name starts with what was typed
          typed = (Date.now() - typedAt > 600 ? '' : typed) + e.key.toLowerCase(); typedAt = Date.now();
          var i = opts.findIndex(function (o) { return o.querySelector('.picker-opt-title').textContent.toLowerCase().indexOf(typed) === 0; });
          if (i > -1) setActive(i);
        }
      });
      document.addEventListener('pointerdown', function (e) { if (!el.contains(e.target)) close(false); });

      show();
      return { set: function (v) { value = v; show(); }, btn: btn };
    }

    function start(R, index, assessMigration) {
      var byId = Object.create(null);
      index.profiles.forEach(function (p) { byId[p.id] = p; });
      if (Object.hasOwn(byId, params.get('from'))) state.from = params.get('from');
      if (Object.hasOwn(byId, params.get('to'))) state.to = params.get('to');
      if (R.modes.some(function (m) { return m.id === params.get('mode'); })) state.mode = params.get('mode');

      if (['extract', 'redesign'].includes(params.get('scope'))) state.scope = params.get('scope');
      function changePair(key, value) {
        if (state[key] === value) return;
        state[key] = value;
        state.scope = ''; state.boundary = ''; state.retained = ''; state.changed = ''; state.confirmed = false;
        render();
      }
      var pFrom = makePicker(document.querySelector('[data-picker="from"]'), index.profiles, 'lbl-from', function (v) { changePair('from', v); });
      var pTo = makePicker(document.querySelector('[data-picker="to"]'), index.profiles, 'lbl-to', function (v) { changePair('to', v); });
      pFrom.set(state.from); pTo.set(state.to);
      var msg = document.getElementById('pair-msg');

      function sync() {
        var q = [];
        if (state.from) q.push('from=' + state.from);
        if (state.to) q.push('to=' + state.to);
        q.push('mode=' + state.mode);
        if (state.scope) q.push('scope=' + state.scope);
        history.replaceState(null, '', '?' + q.join('&'));
      }

      var roleLabels = { web: 'browser interface', api: 'API or backend service', cli: 'command-line interface', automation: 'automation', ios: 'iOS app', android: 'Android app' };
      var responsibilityLabels = { 'server-runtime': 'server runtime', 'browser-ui': 'browser interface' };
      function describeRoles(roles) { return (roles || []).map(function (role) { return roleLabels[role] || role; }).join(', '); }
      function describeResponsibilities(responsibilities, roles) {
        var existing = (roles || []).map(function (role) { return roleLabels[role] || role; });
        return (responsibilities || []).map(function (responsibility) { return responsibilityLabels[responsibility] || responsibility; })
          .filter(function (label) { return existing.indexOf(label) === -1; }).join(', ');
      }
      function scopeDetails(fit) {
        var missingResponsibilities = fit.missing_responsibilities || [];
        var missingRoles = fit.missing_roles || [];
        var sourceResponsibilities = describeResponsibilities(fit.source_responsibilities, fit.source_roles);
        var targetResponsibilities = describeResponsibilities(fit.target_responsibilities, fit.target_roles);
        var responsibilityGap = missingResponsibilities.length > 0;
        var responsibilityOnlyGap = responsibilityGap && missingRoles.length === 0;
        var currentTitle = responsibilityOnlyGap ? 'Clarify the application boundary' : 'These stacks serve different roles';
        var panelTitle = responsibilityOnlyGap ? 'Application boundary' : (state.scope === 'extract' ? 'Component boundary' : 'Interface change');
        var summary = '<div class="scope-roles"><p><strong>Current stack</strong><span>' + esc(describeRoles(fit.source_roles)) + (sourceResponsibilities ? '<br>Responsibilities: ' + esc(sourceResponsibilities) : '') + '</span></p><p><strong>Target stack</strong><span>' + esc(describeRoles(fit.target_roles)) + (targetResponsibilities ? '<br>Responsibilities: ' + esc(targetResponsibilities) : '') + '</span></p></div>';
        var gaps = describeRoles(missingRoles).split(', ').concat(describeResponsibilities(missingResponsibilities).split(', ')).filter(function (label, i, all) { return label && all.indexOf(label) === i; });
        var warning = '<p class="scope-warning">The target profile does not cover the current ' + esc(gaps.join(', ')) + '. Name the part being moved and what stays, or describe the intended change to the application’s interface.</p>';
        if (state.confirmed) return '<section class="scope-panel" aria-labelledby="scope-heading"><h2 id="scope-heading">' + panelTitle + '</h2>' + summary +
          '<dl><dt>Part being moved</dt><dd>' + esc(state.boundary) + '</dd><dt>What stays and how it connects</dt><dd>' + esc(state.retained) + '</dd>' +
          (state.scope === 'redesign' ? '<dt>Intended changes or removals</dt><dd>' + esc(state.changed) + '</dd>' : '') + '</dl><button type="button" class="btn-secondary" data-edit-scope>Change these details</button></section>';
        var fields = state.scope ? '<label>Which part are you moving?<textarea name="boundary" rows="3" maxlength="1200" required>' + esc(state.boundary) + '</textarea></label>' +
          '<label>What stays in the existing app, and how will it connect?<textarea name="retained" rows="3" maxlength="1200" required>' + esc(state.retained) + '</textarea></label>' +
          (state.scope === 'redesign' ? '<label>Which interfaces or behavior are intentionally changed or removed?<textarea name="changed" rows="3" maxlength="1200" required>' + esc(state.changed) + '</textarea></label>' : '') : '';
        return '<section class="scope-panel" aria-labelledby="scope-heading"><h2 id="scope-heading">' + currentTitle + '</h2>' + summary + warning +
          '<form id="scope-form"><fieldset><legend>What are you changing?</legend>' +
          '<label class="scope-option"><input class="radio" type="radio" name="scope" value="extract" required' + (state.scope === 'extract' ? ' checked' : '') + '><span><strong>Move one component</strong><span>Keep the existing interface and connect the extracted component.</span></span></label>' +
          '<label class="scope-option"><input class="radio" type="radio" name="scope" value="redesign" required' + (state.scope === 'redesign' ? ' checked' : '') + '><span><strong>Change the application’s interface</strong><span>Describe the behavior that changes and the parts that remain.</span></span></label></fieldset>' + fields +
          '<p class="guide-caption">Details stay on this page. Shared links include the stack choices, so anyone opening one must supply their own boundary details.</p><button class="btn-primary" type="submit"' + (!state.scope ? ' disabled' : '') + '>Prepare a scoped brief</button></form></section>';
      }

      function briefText(src, tgt) {
        var fit = assessMigration(src, tgt);
        if (fit.requires_clarification) {
          if (!state.confirmed) return 'Resolve the component boundary and retained interfaces before preparing a migration brief.';
          var lead = state.scope === 'extract'
            ? 'Evaluate extracting a component from ' + src.title + ' into ' + tgt.title + '. Preserve the rest of the existing application.'
            : 'Evaluate a product interface change from ' + src.title + ' toward ' + tgt.title + '. This is not a compatible replacement of the whole application.';
          var scopedMode = state.scope === 'redesign' ? 'target architecture' : R.modes.find(function (m) { return m.id === state.mode; }).title.toLowerCase();
          var profileRoles = [];
          if (fit.source_roles && fit.source_roles.length) profileRoles.push('The source profile documents ' + describeRoles(fit.source_roles) + '.');
          if (fit.target_roles && fit.target_roles.length) profileRoles.push('The target profile documents ' + describeRoles(fit.target_roles) + '.');
          var profileResponsibilities = [];
          var sourceResponsibilityText = describeResponsibilities(fit.source_responsibilities, fit.source_roles);
          var targetResponsibilityText = describeResponsibilities(fit.target_responsibilities, fit.target_roles);
          if (sourceResponsibilityText) profileResponsibilities.push('The source covers ' + sourceResponsibilityText + '.');
          if (targetResponsibilityText) profileResponsibilities.push('The target covers ' + targetResponsibilityText + '.');
          return lead + '\n\nPart being moved: ' + state.boundary + '\nRetained interfaces and integration: ' + state.retained +
            (state.scope === 'redesign' ? '\nIntended changes or removals: ' + state.changed : '') +
            '\n\n' + profileRoles.concat(profileResponsibilities).join(' ') + ' ' +
            'Evaluate ' + scopedMode + ' only within this named boundary. First verify that the target can serve the named responsibility and that the retained composition supplies every required interface. Do not treat a filled form as evidence of compatibility. ' +
            'Read https://stack.menu/rewrite/guide.md, https://stack.menu' + src.markdown_url + ' and https://stack.menu' + tgt.markdown_url + '. Compare keeping the existing implementation before making changes. Inspect exact dependencies, data and execution owners. ' +
            'Qualify the component contracts, connection/adapters, deployment or client-release gates and rollback. Retire only the explicitly replaced responsibility after those checks pass; do not retire the whole source application by implication. Report versions, checks actually run, results and unknowns.';
        }
        var how = {
          compatible: 'Keep the declared external behaviour and operated dependencies the same; treat any changed guarantee as a separate decision. Keep a rollback path at every step.',
          incremental: 'Move one bounded part at a time while the ' + src.title + ' app stays authoritative, and keep a rollback path at every step.',
          target: 'Evaluate ' + tgt.title + '’s own patterns and the dependencies it changes. Qualify changed guarantees and recovery before retiring the replaced responsibility.'
        }[state.mode];
        var mode = R.modes.filter(function (m) { return m.id === state.mode; })[0];
        return 'Plan a ' + mode.title.toLowerCase() + ' from ' + src.title + ' to ' + tgt.title + '.\n\n' +
          'Read https://stack.menu/rewrite/guide.md, https://stack.menu' + src.markdown_url + ' and https://stack.menu' + tgt.markdown_url + ' first. Compare keeping the current stack before committing to a move. Inspect the actual application boundary, interfaces, dependencies, jobs and data owners before changing anything. ' + how + ' Report exact versions, checks run, results and unknowns.';
      }

      // The downloadable brief: the same records as the page, as one Markdown file
      function briefMarkdown(src, tgt, note) {
        var md = '# ' + (assessMigration(src, tgt).requires_clarification ? (state.scope === 'extract' ? 'Component extraction brief: ' : 'Product interface change brief: ') : 'Rewrite brief: ') + src.title + ' → ' + tgt.title + '\n\n' + briefText(src, tgt) + '\n\n' +
          '> ' + R.qualification + ' Reviewed ' + fmtDate(R.reviewed_at) + '.\n\n';
        if (note) md += '## Pair note: ' + note.title + '\n\n' + note.body + '\n\n' + note.sources.map(function (u) { return '- ' + u; }).join('\n') + '\n\n';
        md += '## Stack-specific architecture and transition records\n\nRead https://stack.menu' + src.json_url + ' and https://stack.menu' + tgt.json_url + '. Keep each actual dependency and transition decision explicit.\n\n## Steps for every transition\n\n' + R.phases.map(function (p, i) {
          return (i + 1) + '. **' + p.title + '**\n' + p.actions.map(function (a) { return '   - ' + a; }).join('\n') + '\n   - Done when: ' + p.gate + '\n   - If it goes wrong: ' + p.rollback;
        }).join('\n') + '\n\n## What must keep working during the move\n\nInventory actual uses in the replaced boundary and retained interfaces. Mark absent capabilities as not applicable; do not introduce dependencies to fill this checklist.\n\n' + R.contracts.map(function (c) {
          return '### ' + c.title + '\n\n- What to list: ' + c.inventory + '\n- Check: ' + c.gate + '\n- How to undo: ' + c.rollback;
        }).join('\n\n') + '\n\n## Sources\n\n' + R.sources.map(function (s) { return '- [' + s.title + '](' + s.url + ')'; }).join('\n') + '\n';
        return md;
      }

      function modesHtml(noneChecked) {
        var scoped = state.confirmed && assessMigration(byId[state.from], byId[state.to]).requires_clarification;
        var descriptions = {
          compatible: 'Preserve the named component’s declared behavior and dependencies while the retained application continues to run.',
          incremental: 'Move the named responsibility in stages, keeping the retained interfaces and execution owners explicit.',
          target: 'Evaluate the target’s idioms within the named boundary. Qualify changed behavior and recovery before retiring only the replaced responsibility.'
        };
        return '<fieldset><legend class="rw-q">What kind of change is it?</legend><div class="modes">' + R.modes.filter(function (m) { return !(state.scope === 'redesign' && state.confirmed) || m.id === 'target'; }).map(function (m) {
          return '<label class="mode"><span class="mode-head"><input class="radio" type="radio" name="mode" value="' + m.id + '"' + (!noneChecked && m.id === state.mode ? ' checked' : '') + '>' + esc(m.title) + '</span><p>' + esc(scoped ? descriptions[m.id] : m.description) + '</p></label>';
        }).join('') + '</div></fieldset>';
      }

      function render() {
        var src = byId[state.from], tgt = byId[state.to];
        var same = src && tgt && state.from === state.to, pair = src && tgt && !same;
        var fit = assessMigration(src, tgt), crossRole = pair && fit.requires_clarification;
        if (crossRole && state.scope === 'redesign' && state.confirmed) state.mode = 'target';
        var ready = pair && (!crossRole || state.confirmed);
        sync();
        var note = ready ? R.pair_notes.filter(function (n) { return n.source === state.from && n.target === state.to; })[0] : null;

        msg.hidden = !same;
        pTo.btn.setAttribute('aria-invalid', String(!!same));
        if (same) pTo.btn.setAttribute('aria-describedby', 'pair-msg'); else pTo.btn.removeAttribute('aria-describedby');

        var side;
        if (same) {
          side = '<div class="plan-side pad"><div class="panel panel-empty"><h2>Pick two different stacks</h2>' +
            '<p>You selected ' + esc(src.title) + ' for both ends. Use its guide to improve the existing application, or choose another target to evaluate a migration.</p>' +
            '<a class="panel-link" href="' + guideHref(src.id) + '">Open the ' + esc(src.title) + ' guide' + ICON.arrowSm + '</a></div></div>';
        } else if (crossRole && !state.confirmed) {
          side = '<div class="plan-side pad"><div class="panel panel-empty"><h2>Clarify the change first</h2><p>A shared language or a selected target does not make these profiles interchangeable. Your brief will cover the named component and retained interfaces.</p><a class="panel-link" href="' + guideHref(src.id) + '">Read the current stack guide' + ICON.arrowSm + '</a><a class="panel-link" href="' + guideHref(tgt.id) + '">Read the target stack guide' + ICON.arrowSm + '</a></div></div>';
        } else if (!ready) {
          side = '<div class="plan-side pad"><div class="panel panel-empty"><h2>Your plan appears here</h2>' +
            '<p>Pick the stack your app uses now and the one you want to move to. You’ll get:</p><ul class="gets">' +
            '<li>' + ICON.download20 + 'A brief to paste into your coding agent, or download as .md</li>' +
            '<li>' + ICON.split + 'Steps for every transition</li>' +
            '<li>' + ICON.circleCheck + 'The things to keep working while old and new run side by side</li></ul></div></div>';
        } else {
          side = '<div class="plan-side"><h2 class="plan-title">' + esc(src.title) + '<span class="sr-only"> to </span>' + ICON.arrow + esc(tgt.title) + '</h2>' +
            '<div class="panel panel-brief"><div class="brief-wrap"><div class="brief-bar"><span class="brief-title">Agent brief</span>' +
            '<button type="button" class="cmd-btn" id="brief-copy">' + ICON.copy + '<span>Copy</span></button></div>' +
            '<div class="brief-text"><pre class="mono" id="brief-text">' + esc(briefText(src, tgt)) + '</pre></div></div>' +
            '<button type="button" class="btn-secondary w-full" id="brief-dl">' + ICON.download + 'Download brief .md</button>' +
            '<div class="brief-files">' + extLink('', src.markdown_url, 'Current stack guide') + extLink('', tgt.markdown_url, 'Target stack guide') + extLink('', BASE + 'rewrite/guide.md', 'Rewrite guide .md') + extLink('', BASE + 'rewrite/contracts.json', 'Contracts .json') + '</div>' +
            '</div><p class="sr-status" id="copy-status" aria-live="polite"></p></div>';
        }

        var html = '<div class="rw-band"><div class="guide-wrap rw-plan' + (ready ? '' : ' is-last') + '"><div>' + (crossRole ? scopeDetails(fit) : '') + (!crossRole || ready ? modesHtml(same) : '') + '</div>' + side + '</div></div>';

        if (ready) {
          html += '<div class="guide-wrap rw-details">';

          if (note) {
            html += '<section class="guide-section" aria-labelledby="h-note"><h2 id="h-note" class="guide-h2">Research note for this pair</h2>' +
              '<p class="guide-caption">Specific to ' + esc(src.title) + ' → ' + esc(tgt.title) + '. Read it before you choose how to move this part.</p>' +
              '<div class="acc"><details><summary><span class="acc-text"><span class="acc-title m">' + esc(note.title) + '</span></span>' + ICON.chev('acc-chev') + '</summary>' +
              '<div class="acc-body plain"><p>' + esc(note.body) + '</p><div class="note-sources">' + note.sources.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + '<span class="sr-only"> (opens in a new tab)</span></a>'; }).join('') + '</div></div></details></div></section>';
          }

          html += '<section class="guide-section" aria-labelledby="h-steps"><h2 id="h-steps" class="guide-h2">Steps for every transition</h2>' +
            '<p class="guide-caption">' + (crossRole ? 'Apply these gates to the named component and retained composition. Use deployment or client-release checks appropriate to that boundary.' : 'Work through them in order. Each one ends with a check; don’t start the next until it passes.') + '</p><div class="acc">' +
            R.phases.map(function (p, i) {
              return '<details' + (i === 0 ? ' open' : '') + '><summary><span class="step-num" aria-hidden="true">' + (i + 1) + '</span><span class="acc-text"><span class="acc-title"><span class="sr-only">Step ' + (i + 1) + ': </span>' + esc(p.title) + '</span>' +
                '<span class="acc-sub"><b>Done when:</b> ' + esc(p.gate) + '</span></span>' + ICON.chev('acc-chev') + '</summary>' +
                '<div class="acc-body"><ul>' + p.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul><p><b>If it goes wrong:</b> ' + esc(p.rollback) + '</p></div></details>';
            }).join('') + '</div></section>';

          html += '<section class="guide-section" aria-labelledby="h-keep"><h2 id="h-keep" class="guide-h2">What must keep working during the move</h2>' +
            '<p class="guide-caption">' + (crossRole ? 'Inventory actual uses within the named boundary and retained interfaces. Mark unused capabilities as not applicable; do not introduce dependencies just to fill this list.' : 'List each of these before you change anything. Each one comes with what to list, a check that proves it still works, and how to undo the change.') + '</p><div class="acc">' +
            R.contracts.map(function (c, i) {
              return '<details' + (i === 0 ? ' open' : '') + '><summary><span class="acc-text" style="gap:2px"><span class="acc-title m">' + esc(c.title) + '</span><span class="acc-sub">' + esc(c.inventory) + '</span></span>' + ICON.chev('acc-chev') + '</summary>' +
                '<div class="acc-body plain"><dl class="kv"><dt>What to list</dt><dd>' + esc(c.inventory) + '</dd><dt>Check</dt><dd>' + esc(c.gate) + '</dd><dt>How to undo</dt><dd>' + esc(c.rollback) + '</dd></dl></div></details>';
            }).join('') + '</div>' + extLink('rw-filelink', BASE + 'rewrite/contracts.json', 'Full checklist for your agent (contracts.json)') + '</section>';

          html += '<section class="guide-section" aria-labelledby="h-sources"><h2 id="h-sources" class="guide-h2">Sources</h2>' +
            '<p class="guide-caption">Pattern references for coexistence and migration, reviewed ' + fmtDate(R.reviewed_at) + '. These plans come from reading documentation; no stack pair or migration here has been tested by running it.</p><div class="sources">' +
            R.sources.map(function (s) { return '<a class="source" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(s.title) + '<span class="sr-only"> (opens in a new tab)</span></span>' + ICON.ext + '</a>'; }).join('') +
            '</div></section></div>';
        }

        out.innerHTML = html;

        if (ready) {
          var status = document.getElementById('copy-status'), copyBtn = document.getElementById('brief-copy');
          copyBtn.addEventListener('click', function () {
            var text = document.getElementById('brief-text').textContent, lbl = copyBtn.querySelector('span');
            (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
              lbl.textContent = 'Copied'; status.textContent = 'Brief copied';
              setTimeout(function () { lbl.textContent = 'Copy'; }, 2000);
            }, function () { status.textContent = 'Copy failed. Select the brief and copy it manually.'; });
          });
          document.getElementById('brief-dl').addEventListener('click', function () {
            var blob = new Blob([briefMarkdown(src, tgt, note)], { type: 'text/markdown' }), a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = 'rewrite-' + src.id + '-to-' + tgt.id + '.md';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
          });
        }
      }

      out.addEventListener('input', function (event) {
        if (!['boundary', 'retained', 'changed'].includes(event.target.name)) return;
        state[event.target.name] = event.target.value;
        event.target.setCustomValidity('');
      });
      out.addEventListener('change', function (event) {
        if (event.target.name === 'scope') {
          state.scope = event.target.value;
          state.confirmed = false;
          render();
          out.querySelector('input[name="scope"]:checked').focus({ preventScroll: true });
        } else if (event.target.name === 'mode') {
          state.mode = event.target.value;
          var pre = document.getElementById('brief-text');
          if (pre) pre.textContent = briefText(byId[state.from], byId[state.to]);
          sync();
        }
      });
      out.addEventListener('submit', function (event) {
        if (event.target.id !== 'scope-form') return;
        event.preventDefault();
        var fields = [...event.target.querySelectorAll('textarea')];
        fields.forEach(function (field) {
          state[field.name] = field.value.trim();
          field.setCustomValidity(state[field.name] ? '' : 'Describe this part of the change.');
        });
        if (!event.target.reportValidity()) return;
        state.confirmed = true;
        render();
        var brief = document.getElementById('brief-text');
        brief.tabIndex = -1;
        brief.focus();
      });
      out.addEventListener('click', function (event) {
        if (!event.target.closest('[data-edit-scope]')) return;
        state.confirmed = false;
        render();
        out.querySelector('input[name="scope"]:checked').focus();
      });

      render();
    }
  })();
