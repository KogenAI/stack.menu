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
    var profiles = window.StackInteractiveProfiles || {};
    var stage = document.getElementById('stage');
    var host = document.getElementById('folders');
    var opts = document.getElementById('opts');
    var status = document.getElementById('recommendation-status');
    var result = document.getElementById('recommendation-result');
    var msg = document.getElementById('msg');
    var matchLabel = document.getElementById('match-label');
    var allLabel = document.getElementById('all-label');
    var cells = [].slice.call(host.querySelectorAll('.gf-cell'));
    var revealEl = document.getElementById('reveal');
    var clearSel = document.getElementById('clear-sel');
    var current = null;
    var resolver = null;
    if (!cells.length) {
      status.textContent = 'Stack guides are available in the library.';
      return;
    }

    function esc(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }
    function setStatus(message, linkedProfile) {
      status.replaceChildren(document.createTextNode(message + ' '));
      if (linkedProfile) {
        var guide = document.createElement('a');
        guide.className = 'text-link';
        guide.href = linkedProfile.guide_url || '/library/';
        guide.textContent = 'Open ' + linkedProfile.title + ' guide';
        status.appendChild(guide);
        status.appendChild(document.createTextNode(' · '));
      }
      var workflow = document.createElement('a');
      workflow.className = 'text-link';
      workflow.href = '/choose.md';
      workflow.textContent = 'Complete selection workflow';
      status.appendChild(workflow);
      status.appendChild(document.createTextNode(' · '));
      var library = document.createElement('a');
      library.className = 'text-link';
      library.href = '/library/';
      library.textContent = 'Browse every stack guide';
      status.appendChild(library);
    }
    function writeQuery(query) {
      var search = query.toString();
      history.replaceState(null, '', location.pathname + (search ? '?' + search : '') + location.hash);
    }
    function updateQuery(changes) {
      var query = new URLSearchParams(location.search);
      Object.keys(changes).forEach(function (key) {
        if (changes[key] == null) query.delete(key);
        else query.set(key, changes[key]);
      });
      writeQuery(query);
    }
    function sourcesHtml(sources) {
      return (sources || []).filter(function (source) {
        return source && source.title && /^https?:\/\//i.test(String(source.url || ''));
      }).map(function (source) {
        return '<a class="text-link" href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.title) + '<span class="sr-only"> (opens in a new tab)</span></a>';
      }).join(' · ');
    }
    function renderAlternatives(useCase, alternatives) {
      var relevant = (useCase.alternatives || alternatives).filter(function (alternative) {
        return alternative.profile_id !== useCase.primary && Array.isArray(alternative.use_cases) && alternative.use_cases.indexOf(useCase.id) !== -1;
      });
      if (!relevant.length) return '';
      return '<details class="recommendation-alternatives"><summary>When another stack may fit</summary><div class="recommendation-options">' + relevant.map(function (alternative) {
        var id = alternative.profile_id;
        var profile = id && profiles[id];
        var title = (profile && profile.title) || alternative.label;
        var links = '';
        if (id) {
          var href = (profile && profile.guide_url) || '/library/';
          links = '<div class="recommendation-actions"><a class="recommendation-link" href="' + esc(href) + '" aria-label="Read ' + esc(title) + ' guide">Read guide <span aria-hidden="true">→</span></a>';
          if (profile && useCase.primary && id !== useCase.primary) {
            links += '<a class="recommendation-link" href="/compare/?stacks=' + encodeURIComponent(useCase.primary) + ',' + encodeURIComponent(id) + '" aria-label="Compare ' + esc(title) + ' with ' + esc((profiles[useCase.primary] || {}).title || useCase.primary) + '">Compare <span aria-hidden="true">→</span></a>';
          }
          links += '</div>';
        }
        var sourceLinks = sourcesHtml(alternative.sources);
        return '<article class="recommendation-alternative"><h3>' + esc(title) + '</h3>' +
          (alternative.choose_when ? '<p><strong>Choose it when:</strong> ' + esc(alternative.choose_when) + '</p>' : '') +
          (alternative.caveat ? '<p><strong>Trade-off:</strong> ' + esc(alternative.caveat) + '</p>' : '') +
          '<div class="recommendation-footer">' + links + (sourceLinks ? '<p class="recommendation-sources">Sources: ' + sourceLinks + '</p>' : '') + '</div></article>';
      }).join('') + '</div></details>';
    }
    function renderRecommendation(useCase, alternatives) {
      var id = useCase.primary;
      var profile = id && profiles[id];
      var title = (profile && profile.title) || id || 'Recommended stack';
      var href = (profile && profile.guide_url) || '/library/';
      var sourceLinks = sourcesHtml(useCase.sources);
      var actions = '<div class="recommendation-actions"><a class="btn-primary" href="' + esc(href) + '" aria-label="Read ' + esc(title) + ' guide">Read guide <span aria-hidden="true">→</span></a>';
      actions += '<a class="recommendation-link" href="/library/">All stack guides <span aria-hidden="true">→</span></a></div>';
      var missing = profile ? '' : '<p class="recommendation-missing">The matching guide is not present in this catalogue build yet. Browse the library while it is added.</p>';
      var pending = useCase.pending_questions || [];
      result.innerHTML = '<div class="recommendation-primary"><p class="eyebrow">' + (pending.length ? 'Possible starting point' : 'Recommended starting point') + '</p><h2><a class="text-link" href="' + esc(href) + '">' + esc(title) + '</a></h2>' +
        pending.map(function (question) { return '<p class="recommendation-tradeoff">' + esc(question) + ' Choose a mobile platform above to narrow the recommendation.</p>'; }).join('') +
        '<p>' + esc(useCase.why || '') + '</p>' +
        (useCase.tradeoff ? '<p class="recommendation-tradeoff"><strong>Trade-off:</strong> ' + esc(useCase.tradeoff) + '</p>' : '') +
        missing + actions + (sourceLinks ? '<p class="recommendation-sources">Editorial sources: ' + sourceLinks + '</p>' : '') + '</div>' +
        renderAlternatives(useCase, alternatives);
      result.hidden = false;
    }

    function start(contract) {
      var useCases = contract.use_cases;
      var alternatives = contract.alternatives || [];
      var ecosystem = document.getElementById('recommendation-ecosystem');
      var mobile = document.getElementById('recommendation-mobile-platform');
      var preferencePanel = document.getElementById('recommendation-constraints');
      var selectedTask = null;
      var inputs = [].slice.call(opts.querySelectorAll('input[name="use_case"]'));
      var defaultStatus = 'Recommendations follow the task and your preferences. The library includes other guides for existing or deliberately chosen stacks.';

      function preferences(task, values) {
        var constraints = task.constraints || {};
        preferencePanel.hidden = !Object.keys(constraints).length;
        document.getElementById('recommendation-ecosystem-field').hidden = !constraints.ecosystem;
        document.getElementById('recommendation-mobile-field').hidden = !constraints.mobile_platform;
        var names = {any:'No preference',python:'Python',php:'PHP',ruby:'Ruby',elixir:'Elixir',react:'React',rust:'Rust'};
        ecosystem.replaceChildren();
        ['any'].concat(constraints.ecosystem || []).forEach(function (value) {
          var option = document.createElement('option'); option.value = value; option.textContent = names[value] || value; ecosystem.appendChild(option);
        });
        ecosystem.value = values.ecosystem || 'any';
        mobile.value = values.mobile_platform || '';
      }
      function choose(task, values, rewriteUrl) {
        selectedTask = task;
        preferences(task, values || {});
        var selection = {use_case: task.id};
        if (task.constraints && task.constraints.ecosystem && ecosystem.value !== 'any') selection.ecosystem = ecosystem.value;
        if (task.constraints && task.constraints.mobile_platform && mobile.value) selection.mobile_platform = mobile.value;
        var resolved = resolver(contract, selection);
        var chosen = resolved.task;
        current = {id: task.id, title: task.label, conditional: chosen.pending_questions.length > 0, primaryId: chosen.primary, ids: profiles[chosen.primary] ? [chosen.primary] : []};
        if (rewriteUrl !== false) {
          updateQuery({use_case: task.id, ecosystem: selection.ecosystem || null, mobile_platform: selection.mobile_platform || null, stack: null, kind: null});
          setStatus(defaultStatus, null);
        }
        clearSel.hidden = false;
        renderRecommendation(chosen, alternatives);
        layout(true);
        // Keep the chosen control in place; changing a radio must not move focus off screen.
      }
      inputs.forEach(function (input) {
        input.addEventListener('change', function () {
          var task = useCases.find(function (item) { return item.id === input.value; });
          if (task) choose(task, {}, true);
        });
      });
      [ecosystem, mobile].forEach(function (select) {
        select.addEventListener('change', function () {
          if (selectedTask) choose(selectedTask, {ecosystem: ecosystem.value, mobile_platform: mobile.value}, true);
        });
      });
      var query = new URLSearchParams(location.search);
      var requested = query.get('use_case');
      var values = {ecosystem: query.get('ecosystem'), mobile_platform: query.get('mobile_platform')};
      var alias = (contract.aliases || {})[requested];
      if (alias) {
        try {
          var legacySelection = resolver(contract, {use_case:requested, ecosystem:values.ecosystem, mobile_platform:values.mobile_platform});
          requested = legacySelection.task.id;
          values = legacySelection.constraints;
        } catch (error) { setStatus(error.message, null); return; }
      }
      var legacyKinds = {web:'web-product', api:'api-service', cli:'cli', automation:'automation', ios:'cross-platform-mobile', android:'cross-platform-mobile'};
      if (!requested && legacyKinds[query.get('kind')]) {
        requested = legacyKinds[query.get('kind')];
        if (['ios','android'].includes(query.get('kind'))) values.mobile_platform = query.get('kind');
      }
      var task = useCases.find(function (item) { return item.id === requested; });
      var linkedProfile = profiles[query.get('stack')];
      if (!task && linkedProfile) {
        task = useCases.find(function (item) { return item.primary === linkedProfile.id; });
        if (!task) task = useCases.find(function (item) {
          var override = (item.overrides || []).find(function (row) { return row.primary === linkedProfile.id; });
          if (override) { values = override.when; return true; }
          return false;
        });
      }
      if (task) {
        var ignoredPreferences = [];
        // Ignore invalid bookmark preferences visibly instead of rendering a stale choice.
        Object.keys(values).forEach(function (key) {
          if (values[key] && values[key] !== 'any' && !(task.constraints && task.constraints[key] || []).includes(values[key])) { ignoredPreferences.push(values[key]); values[key] = null; }
        });
        var radio = inputs.find(function (input) { return input.value === task.id; });
        if (radio) radio.checked = true;
        choose(task, values, true);
        if (ignoredPreferences.length) setStatus('This task has no reviewed preference for ' + ignoredPreferences.join(', ') + '. Showing its starting point; verify that requirement before choosing.', null);
        else if (alias) setStatus('This older link now opens the task with its original preference.', null);
        else if (linkedProfile) setStatus('This link opens the task related to ' + linkedProfile.title + '. Your chosen stack remains available in its guide.', linkedProfile);
      } else {
        setStatus(requested ? 'That task is not in the catalogue. Choose a task or open a guide.' : defaultStatus, linkedProfile);
      }
    }

    var matchLabel = document.getElementById('match-label');
    function layout(animate) {
      var vw = stage.clientWidth;
      var small = vw < 640;
      var CW = 220, CH = (cells[0].offsetHeight) || 211;
      var ids = current ? current.ids : [];
      var pickedSet = Object.create(null);
      ids.forEach(function (id) { pickedSet[id] = true; });
      var n = ids.length;
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
      var labelH = 36, gridH = n ? rows * cellH + (rows - 1) * cgap : 0;
      var rowLabelY = (n ? labelH + gridH + 24 : (small ? 160 : 220)) + 24;
      var rest = cells.filter(function (cell) { return !pickedSet[cell.getAttribute('data-id')]; });
      var m = Math.max(rest.length, 1), rs = small ? .38 : vw < 1024 ? .44 : .52;
      var rw = CW * rs, rh = CH * rs;
      var step = m < 2 ? 0 : Math.min(rw + 12, (vw - rw) / (m - 1));
      var rowW = step * (m - 1) + rw, rowX = (vw - rowW) / 2, rowY = rowLabelY + 32;
      stage.style.height = (rowY + rh + 8) + 'px';
      revealEl.style.height = Math.max(1, n ? labelH + gridH + 24 : 180) + 'px';
      var order = 0;
      cells.forEach(function (cell, i) {
        var id = cell.getAttribute('data-id'), isPicked = !!pickedSet[id];
        cell.classList.toggle('is-center', isPicked);
        cell.classList.toggle('is-dim', !!current && !isPicked);
        cell.style.zIndex = isPicked ? 30 : 10 + i;
        var x, y, scale;
        if (isPicked) {
          var k = ids.indexOf(id), row = Math.floor(k / cols), col = k % cols;
          var inRow = Math.min(cols, n - row * cols);
          x = (vw - (inRow * cellW + (inRow - 1) * cgap)) / 2 + col * (cellW + cgap);
          y = labelH + row * (cellH + cgap); scale = cs;
          cell.style.transitionDelay = animate ? (order++ * 60) + 'ms' : '0ms';
        } else {
          x = rowX + rest.indexOf(cell) * step; y = rowY; scale = rs; cell.style.transitionDelay = '0ms';
        }
        cell.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
        cell.style.setProperty('--gf-tip-scale', (1 / scale).toFixed(3));
      });
      msg.style.top = (((small ? 160 : 220) / 2) - msg.offsetHeight / 2) + 'px';
      msg.classList.toggle('is-hidden', !!current);
      matchLabel.style.top = '0px';
      matchLabel.classList.toggle('is-hidden', !current);
      matchLabel.textContent = current ? (current.conditional ? 'Possible for ' : 'Recommended for ') + current.title : '';
      allLabel.style.top = rowLabelY + 'px';
      allLabel.textContent = current ? 'Other guides · recommendations depend on the task' : 'All ' + Object.keys(profiles).length + ' stack guides';
    }

    clearSel.addEventListener('click', function () {
      var selected = opts.querySelector('input[name="use_case"]:checked');
      if (selected) selected.checked = false;
      current = null; result.hidden = true;
      updateQuery({ use_case: null, stack: null, ecosystem: null, mobile_platform: null, kind: null });
      document.getElementById('recommendation-constraints').hidden = true;
      setStatus('Choose a job to see one reviewed starting point and when another stack may suit better.', null);
      clearSel.hidden = true;
      layout(true);
      var first = opts.querySelector('input[name="use_case"]'); if (first) first.focus();
    });

    Promise.all([fetch('/recommendations.json').then(function (response) {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    }), import('/design/recommendation-policy.js')]).then(function (results) { resolver = results[1].resolveRecommendation; start(results[0]); }).catch(function () {
      opts.disabled = true;
      setStatus('Recommendations are temporarily unavailable. Read the complete selection workflow or browse the library.', null);
    });
    cells.forEach(function (cell) { cell.style.transition = 'none'; });
    layout(false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { cells.forEach(function (cell) { cell.style.transition = ''; }); }); });
    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { layout(false); }, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(false); });
  })();
