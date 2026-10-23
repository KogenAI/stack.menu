'use strict';

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

    // Contract descriptions come directly from the maintained research.
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function fmtDate(iso) { var d = new Date(iso + 'T00:00:00'); return d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear(); }
    function guideHref(profile) { return profile.guide_url || profile.html_url || profile.markdown_url || '/rewrite/guide.md'; }
    function extLink(cls, href, label) { return '<a class="' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + ICON.ext + '<span class="sr-only"> (opens in a new tab)</span></a>'; }

    var out = document.getElementById('rw-out');
    var params = new URLSearchParams(location.search);
    var state = { from: '', to: '', mode: 'incremental', scope: '', boundary: '', retained: '', changed: '', otherName: '', confirmed: false, assessment: false };

    Promise.all([
      fetch(BASE + 'rewrite/contracts.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(BASE + 'selection-index.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      import('/design/migration-fit.js'),
      fetch(BASE + 'rewrite/sources.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    ]).then(function (res) { start(res[0], res[1], res[2].assessMigration, res[3]); }).catch(function () {
      // Error state: the records could not be read; the files themselves stay linked
      document.querySelectorAll('[data-picker]').forEach(function (p) { p.innerHTML = '<button type="button" class="picker-btn" disabled><span class="ph">Unavailable</span></button>'; });
      out.innerHTML = '<div class="guide-wrap" style="padding-block:48px 112px"><div class="state"><h2>The rewrite records didn’t load</h2><p>Open them directly instead: <a href="' + BASE + 'rewrite/guide.md">rewrite guide.md</a> · <a href="' + BASE + 'rewrite/contracts.json">contracts.json</a> · <a href="/rewrite/sources.json">source records.json</a></p></div></div>';
    });

    /* ---------- Select/Stack: button + listbox that always opens downward ---------- */
    function makePicker(el, profiles, labelId, onPick) {
      var key = el.getAttribute('data-picker'), listId = 'list-' + key, value = '';
      var opts = [];
      el.innerHTML =
        '<button type="button" class="picker-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + listId + '" aria-labelledby="' + labelId + ' btn-' + key + '" id="btn-' + key + '"><span></span>' + ICON.chev('') + '</button>' +
        '<div class="picker-list" id="' + listId + '" role="listbox" tabindex="-1" aria-labelledby="' + labelId + '">' +
        Array.from(new Set(profiles.map(function (profile) { return profile.group; }))).map(function (g, gi) {
          var items = profiles.filter(function (p) { return p.group === g; });
          return '<div class="picker-group" role="group" aria-labelledby="' + key + '-g' + gi + '"><div class="picker-group-title eyebrow" id="' + key + '-g' + gi + '">' + esc(g) + '</div>' +
            items.map(function (p) {
              return '<div class="picker-opt" role="option" id="' + key + '-' + esc(encodeURIComponent(p.id)) + '" data-id="' + esc(p.id) + '" aria-selected="false"><span class="picker-opt-text"><span class="picker-opt-title">' + esc(p.title) + '</span><span class="picker-opt-sub">' + esc(p.language) + '</span></span>' + ICON.check + '</div>';
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

    function start(R, index, assessMigration, sourceIndex) {
      var byId = Object.create(null), targets = Object.create(null);
      index.profiles.forEach(function (p) { byId[p.id] = p; targets[p.id] = p; });
      var sourceProfiles = index.profiles.concat(sourceIndex.sources.map(function (p) {
        var source = Object.assign({}, p, { source_only: true });
        byId[p.id] = source;
        return source;
      }));
      var otherSource = { id: 'other', title: 'Other / unlisted source', language: 'Source research required', group: 'Other sources', kind: [], unknown_source: true,
        inventory: ['Identify the system, exact versions, extension/tooling support and lifecycle using maintained primary sources.', 'Inventory UI, APIs, publishing, identity, data, jobs, integrations and operations. Name the actual owners and critical behavior checks.', 'Mark every responsibility kept, replaced or retired, including interfaces, validation and rollback.'],
        options: ['Keeping or upgrading the actual system may be appropriate. Research its native modernization path before choosing another ecosystem.'],
        target_research: 'This system has no maintained source guide here. Research its actual architecture and natural upgrade paths. Any target remains a candidate to evaluate, not a compatibility claim.' };
      byId.other = otherSource; sourceProfiles.push(otherSource);
      var fromParam = params.get('from'), toParam = params.get('to');
      var invalidTarget = toParam && !Object.hasOwn(targets, toParam) ? toParam : '';
      if (Object.hasOwn(byId, fromParam)) state.from = fromParam;
      else if (fromParam) { state.from = 'other'; state.otherName = fromParam.slice(0, 240); }
      if (Object.hasOwn(targets, toParam)) state.to = toParam;
      if (R.modes.some(function (m) { return m.id === params.get('mode'); })) state.mode = params.get('mode');

      function resetScope() {
        state.scope = ''; state.boundary = ''; state.retained = ''; state.changed = ''; state.confirmed = false; state.assessment = false;
      }
      function changePair(key, value) {
        if (state[key] === value) return;
        state[key] = value;
        if (key === 'to') invalidTarget = '';
        resetScope();
        render();
      }
      var pFrom = makePicker(document.querySelector('[data-picker="from"]'), sourceProfiles, 'lbl-from', function (v) { changePair('from', v); });
      var pTo = makePicker(document.querySelector('[data-picker="to"]'), index.profiles, 'lbl-to', function (v) { changePair('to', v); });
      pFrom.set(state.from); pTo.set(state.to);
      var msg = document.getElementById('pair-msg');
      var sourceDetails = document.getElementById('rewrite-source-details');
      var otherField = document.getElementById('rewrite-other-source-field');
      var otherInput = document.getElementById('rewrite-other-source');
      if (otherInput) {
        otherInput.value = state.otherName;
        otherInput.addEventListener('input', function () {
          state.otherName = otherInput.value.slice(0, 240);
          state.confirmed = false; state.assessment = false;
          otherInput.setCustomValidity('');
          render();
        });
      }
      function currentSource() {
        var source = byId[state.from];
        return source && source.unknown_source && state.otherName.trim()
          ? Object.assign({}, source, { title: state.otherName.trim() }) : source;
      }
      function sync() {
        var query = new URLSearchParams();
        if (state.from) query.set('from', state.from);
        if (state.to) query.set('to', state.to);
        query.set('mode', state.mode);
        // Scope, free text and confirmation are local application state. Shared
        // links always require a fresh inventory rather than replaying a decision.
        history.replaceState(null, '', '?' + query.toString());
      }
      function listHtml(values) {
        return '<ul>' + (values || []).map(function (value) { return '<li>' + esc(value) + '</li>'; }).join('') + '</ul>';
      }
      function sourceDetailHtml(source) {
        if (!source || (!source.source_only && !source.unknown_source)) return '';
        var lifecycle = source.lifecycle || {};
        var links = source.markdown_url ? '<p>' + extLink('panel-link', guideHref(source), 'Read source guidance') + extLink('panel-link', source.markdown_url, 'Source guide .md') + '</p>' : '';
        return '<details class="source-disclosure"><summary>' + esc(source.unknown_source ? 'About this source coverage gap' : source.title + ': source guide and inventory') + '</summary>' +
          (source.summary ? '<p>' + esc(source.summary) + '</p>' : '') +
          (lifecycle.status ? '<p><strong>Lifecycle:</strong> ' + esc(lifecycle.status) + '. ' + esc(lifecycle.date) + ' <span>Reviewed ' + esc(lifecycle.as_of || sourceIndex.reviewed_on) + '.</span></p>' : '') +
          '<p>' + esc(source.caution || 'Source coverage does not establish what the actual application contains or what a selected target can replace.') + '</p>' +
          '<h3>Check the actual versions</h3>' + listHtml(source.version_check || ['Identify installed versions and consult current primary lifecycle and migration documentation.']) +
          '<h3>Inventory before choosing the boundary</h3>' + listHtml(source.inventory) +
          '<h3>Keeping, upgrading or replacing</h3>' + listHtml(source.options) +
          '<p>' + esc(source.target_research) + '</p>' +
          (source.id === 'vue-2' ? '<p><strong>Guide coverage gap:</strong> Vue 3 has no full target guide in this library. Investigate the official Vue migration path below; choosing a documented React target is optional.</p>' : '') +
          (source.id === 'angularjs' ? '<p><strong>Guide coverage gap:</strong> Modern Angular has no full target guide here. Investigate its official upgrade guidance alongside any deliberately selected target.</p>' : '') +
          (source.id === 'woocommerce' ? '<p><a class="text-link" href="/rewrite/sources/wordpress/">Shared WordPress responsibilities and inventory</a></p>' : '') +
          links + ((source.sources || []).length ? '<p>Primary source references:</p><ul>' + source.sources.map(function (reference) { return '<li>' + extLink('', reference.url, reference.title) + '</li>'; }).join('') + '</ul>' : '') + '</details>';
      }
      function sourceBrief(source) {
        if (!source.source_only && !source.unknown_source) return '';
        var lifecycle = source.lifecycle || {};
        return '\n\nSource guidance and inventory' + (lifecycle.status ? '\nLifecycle (reviewed ' + (lifecycle.as_of || sourceIndex.reviewed_on) + '): ' + lifecycle.status + '. ' + lifecycle.date : '') +
          '\nExact-version checks:\n' + (source.version_check || ['Identify installed versions and verify current primary support and migration guidance.']).map(function (line) { return '- ' + line; }).join('\n') +
          '\nApplication inventory:\n' + (source.inventory || []).map(function (line) { return '- ' + line; }).join('\n') +
          '\nOptions to investigate:\n' + (source.options || []).map(function (line) { return '- ' + line; }).join('\n') +
          '\nTarget research: ' + source.target_research +
          (source.id === 'vue-2' ? '\nVue 3 is a natural candidate and has no full target guide here; use official Vue migration guidance rather than forcing another ecosystem.' : '') +
          (source.id === 'angularjs' ? '\nModern Angular has no full target guide here; investigate its official upgrade path before deciding to leave the ecosystem.' : '') +
          ((source.sources || []).length ? '\nSource references:\n' + source.sources.map(function (reference) { return '- ' + reference.title + ': ' + reference.url; }).join('\n') : '');
      }
      function readingLinks(source, target, format) {
        return ['https://stack.menu/rewrite/guide.md', source[format] ? 'https://stack.menu' + source[format] : null, target[format] ? 'https://stack.menu' + target[format] : null].filter(Boolean).join(', ');
      }

      var roleLabels = { web: 'browser interface', api: 'API or backend service', cli: 'command-line interface', automation: 'automation', ios: 'iOS app', android: 'Android app' };
      var responsibilityLabels = { 'server-runtime': 'server runtime', 'browser-ui': 'browser interface', publishing:'publishing workflow', plugins:'plugins and custom behavior', orders:'orders and customer history', payments:'payment integrations', commerce:'commerce operations' };
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
        var currentTitle = 'Clarify the application scope';
        var panelTitle = 'Application scope and responsibility owners';
        var summary = '<div class="scope-roles"><p><strong>Current stack</strong><span>' + esc(describeRoles(fit.source_roles) || 'Unknown; inventory required') + (sourceResponsibilities ? '<br>Responsibilities: ' + esc(sourceResponsibilities) : '') + '</span></p><p><strong>Target stack</strong><span>' + esc(describeRoles(fit.target_roles)) + (targetResponsibilities ? '<br>Responsibilities: ' + esc(targetResponsibilities) : '') + '</span></p></div>';
        var gaps = describeRoles(missingRoles).split(', ').concat(describeResponsibilities(missingResponsibilities).split(', ')).filter(function (label, i, all) { return label && all.indexOf(label) === i; });
        var warning = '<p class="scope-warning">Inventory the actual application and mark each responsibility kept, replaced or retired with its owner, interfaces and checks. ' + (gaps.length ? 'These responsibilities fall outside the target guide: ' + esc(gaps.join(', ')) + '. Missing documentation is a coverage gap, not evidence that replacement is impossible. ' : '') + 'A completed scope does not establish compatibility.</p>';
        if (state.confirmed) return '<section class="scope-panel" aria-labelledby="scope-heading"><h2 id="scope-heading">' + panelTitle + '</h2>' + summary +
          '<dl><dt>Scope and replaced responsibilities</dt><dd>' + esc(state.boundary) + '</dd><dt>Kept responsibilities, owners and interfaces</dt><dd>' + esc(state.retained) + '</dd>' +
          '<dt>Retired or changed responsibilities and checks</dt><dd>' + esc(state.changed) + '</dd>' + '</dl><button type="button" class="btn-secondary" data-edit-scope>Change these details</button></section>';
        var fields = state.scope ? '<label>Which responsibilities are replaced, and who will own them?<textarea name="boundary" rows="3" maxlength="1200" required>' + esc(state.boundary) + '</textarea></label>' +
          '<label>Which responsibilities are kept, who owns them, and how will they connect?<textarea name="retained" rows="3" maxlength="1200" required>' + esc(state.retained) + '</textarea></label>' +
          '<label>Which responsibilities or behavior are retired or changed, and what checks and rollback apply? Write none if none.<textarea name="changed" rows="3" maxlength="1200" required>' + esc(state.changed) + '</textarea></label>' : '';
        return '<section class="scope-panel" aria-labelledby="scope-heading"><h2 id="scope-heading">' + currentTitle + '</h2>' + summary + warning +
          '<form id="scope-form"><fieldset><legend>What are you changing?</legend>' +
          '<label class="scope-option"><input class="radio" type="radio" name="scope" value="extract" required' + (state.scope === 'extract' ? ' checked' : '') + '><span><strong>Partial replacement or upgrade</strong><span>Name the changed boundary and the responsibilities retained by existing owners.</span></span></label>' +
          '<label class="scope-option"><input class="radio" type="radio" name="scope" value="redesign" required' + (state.scope === 'redesign' ? ' checked' : '') + '><span><strong>Full replacement or interface redesign</strong><span>Assign every responsibility to a new owner or explicitly retire it.</span></span></label></fieldset>' + fields +
          '<p class="guide-caption">Details stay on this page. Shared links include the stack choices, so anyone opening one must supply their own boundary details.</p><button class="btn-primary" type="submit"' + (!state.scope ? ' disabled' : '') + '>Prepare a scoped brief</button></form></section>';
      }

      function briefText(src, tgt) {
        var fit = assessMigration(src, tgt);
        if (fit.requires_clarification) {
          if (!state.confirmed) return 'Resolve the component boundary and retained interfaces before preparing a migration brief.';
          var lead = state.scope === 'extract'
            ? 'Evaluate a partial replacement or upgrade from ' + src.title + ' toward ' + tgt.title + '. Preserve the named retained responsibilities.'
            : 'Evaluate a full replacement or interface redesign from ' + src.title + ' toward ' + tgt.title + '. Assign every responsibility to a named owner or explicitly retire it.';
          var scopedMode = state.scope === 'redesign' ? 'target architecture' : R.modes.find(function (m) { return m.id === state.mode; }).title.toLowerCase();
          var profileRoles = [];
          if (fit.source_roles && fit.source_roles.length) profileRoles.push('The source profile documents ' + describeRoles(fit.source_roles) + '.');
          if (fit.target_roles && fit.target_roles.length) profileRoles.push('The target profile documents ' + describeRoles(fit.target_roles) + '.');
          var profileResponsibilities = [];
          var sourceResponsibilityText = describeResponsibilities(fit.source_responsibilities, fit.source_roles);
          var targetResponsibilityText = describeResponsibilities(fit.target_responsibilities, fit.target_roles);
          if (sourceResponsibilityText) profileResponsibilities.push('The source covers ' + sourceResponsibilityText + '.');
          if (targetResponsibilityText) profileResponsibilities.push('The target covers ' + targetResponsibilityText + '.');
          return lead + '\n\nReplaced responsibilities and owners: ' + state.boundary + '\nKept responsibilities, owners and interfaces: ' + state.retained +
            '\nRetired or changed responsibilities, checks and rollback: ' + state.changed +
            '\n\n' + profileRoles.concat(profileResponsibilities).join(' ') + ' ' +
            'Evaluate ' + scopedMode + ' only within this named boundary. First verify that the target can serve the named responsibility and that the retained composition supplies every required interface. Do not treat a filled form as evidence of compatibility. ' +
            'Read ' + readingLinks(src, tgt, 'markdown_url') + '. Compare keeping the existing implementation before making changes. Inspect exact dependencies, data and execution owners. ' +
            'Qualify the component contracts, connection/adapters, deployment or client-release gates and rollback. Retire only the explicitly replaced responsibility after those checks pass; do not retire the whole source application by implication. Report versions, checks actually run, results and unknowns.' + sourceBrief(src);
        }
        var how = {
          compatible: 'Keep the declared external behaviour and operated dependencies the same; treat any changed guarantee as a separate decision. Keep a rollback path at every step.',
          incremental: 'Move one bounded part at a time while the ' + src.title + ' app stays authoritative, and keep a rollback path at every step.',
          target: 'Evaluate ' + tgt.title + '’s own patterns and the dependencies it changes. Qualify changed guarantees and recovery before retiring the replaced responsibility.'
        }[state.mode];
        var mode = R.modes.filter(function (m) { return m.id === state.mode; })[0];
        return (src.id === tgt.id ? 'Plan maintenance or an upgrade within ' + src.title + '. Inspect the installed version and the guide’s current ecosystem guidance; keep the current stack when it still fits.\n\n' : 'Plan a ' + mode.title.toLowerCase() + ' from ' + src.title + ' to ' + tgt.title + '.\n\n') +
          'Read ' + readingLinks(src, tgt, 'markdown_url') + ' first. Compare keeping the current stack before committing to a move. Inspect the actual application boundary, interfaces, dependencies, jobs and data owners before changing anything. ' + how + ' Report exact versions, checks run, results and unknowns.';
      }

      // The downloadable brief: the same records as the page, as one Markdown file
      function briefMarkdown(src, tgt, note) {
        var md = '# ' + (assessMigration(src, tgt).requires_clarification ? (state.scope === 'extract' ? 'Partial replacement or upgrade brief: ' : 'Full replacement or redesign brief: ') : 'Rewrite brief: ') + src.title + ' → ' + tgt.title + '\n\n' + briefText(src, tgt) + '\n\n' +
          '> ' + R.qualification + ' Reviewed ' + fmtDate(R.reviewed_at) + '.\n\n';
        if (note) md += '## Pair note: ' + note.title + '\n\n' + note.body + '\n\n' + note.sources.map(function (u) { return '- ' + u; }).join('\n') + '\n\n';
        md += '## Stack-specific architecture and transition records\n\nRead ' + readingLinks(src, tgt, 'json_url') + '. Keep each actual dependency and transition decision explicit.\n\n## Steps for every transition\n\n' + R.phases.map(function (p, i) {
          return (i + 1) + '. **' + p.title + '**\n' + p.actions.map(function (a) { return '   - ' + a; }).join('\n') + '\n   - Done when: ' + p.gate + '\n   - If it goes wrong: ' + p.rollback;
        }).join('\n') + '\n\n## What must keep working during the move\n\nInventory actual uses in the replaced boundary and retained interfaces. Mark absent capabilities as not applicable; do not introduce dependencies to fill this checklist.\n\n' + R.contracts.map(function (c) {
          return '### ' + c.title + '\n\n- What to list: ' + c.inventory + '\n- Check: ' + c.gate + '\n- How to undo: ' + c.rollback;
        }).join('\n\n') + '\n\n## Sources\n\n' + R.sources.map(function (s) { return '- [' + s.title + '](' + s.url + ')'; }).join('\n') + '\n';
        return md;
      }

      function assessmentAction(source, target) {
        if (!source) return '';
        var unnamed = source.unknown_source && !state.otherName.trim();
        return '<section class="scope-panel" aria-labelledby="assessment-heading"><h2 id="assessment-heading">Keep or upgrade this system</h2>' +
          '<p>Prepare an inventory and research brief before choosing a target. Compare keeping the current system with its native upgrade or tooling paths.' + (target ? ' This action clears the selected target so the assessment can investigate those paths independently.' : '') + '</p>' +
          (unnamed ? '<p>Name the current system above before preparing its source assessment.</p>' : '') +
          '<button type="button" class="btn-secondary" data-prepare-assessment' + (unnamed ? ' disabled' : '') + '>' + (source.unknown_source ? 'Prepare a source assessment' : 'Prepare an upgrade assessment') + '</button></section>';
      }
      function assessmentText(source) {
        var documents = ['https://stack.menu/rewrite/guide.md', source.markdown_url ? 'https://stack.menu' + source.markdown_url : null,
          source.json_url ? 'https://stack.menu' + source.json_url : null, 'https://stack.menu/rewrite/contracts.json'].filter(Boolean);
        return 'Assess keeping, maintaining or upgrading ' + source.title + ' before selecting a rewrite target. No target has been selected for this assessment.\n\n' +
          (source.unknown_source ? 'Source responsibilities: Unknown; inventory required. Identify the actual system and installed versions, then find its current official support, upgrade and migration documentation. This source has no maintained system-specific guide here.\n\n' : '') +
          'Read ' + documents.join(', ') + '. Inspect the actual application and exact dependencies; source documentation does not establish installed behavior or compatibility. Compare retaining the current implementation, a supported version/tooling upgrade and a bounded rewrite when the actual requirements justify it. Research native ecosystem targets even when this library has no full target guide for them.\n\n' +
          'Inventory UI, APIs, publishing, identity, data, extensions, jobs, integrations, deployment and operational owners as applicable. For each responsibility, record kept, replaced or retired scope, owner, interfaces, behavior checks and rollback. Record missing information as unknown. Do not implement a migration or retire a responsibility until this scope and validation are resolved.' +
          sourceBrief(source) +
          '\n\nAssessment output: report installed versions, current primary lifecycle/upgrade sources, native upgrade candidates and their coverage gaps, the application inventory, consequential questions, checks actually run, results and unknowns. Separate documentation review from execution evidence. This brief does not certify an upgrade, target or application migration.\n\n' +
          'Qualification: ' + sourceIndex.qualification + ' ' + R.qualification + ' Source research reviewed ' + sourceIndex.reviewed_on + '.';
      }
      function assessmentMarkdown(source) {
        return '# ' + (source.unknown_source ? 'Source assessment: ' : 'Upgrade assessment: ') + source.title + '\n\n' + assessmentText(source) + '\n';
      }
      function bindBriefActions(getMarkdown, filename) {
        var status = document.getElementById('copy-status'), copyBtn = document.getElementById('brief-copy');
        copyBtn.addEventListener('click', function () {
          var text = document.getElementById('brief-text').textContent, label = copyBtn.querySelector('span');
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
            label.textContent = 'Copied'; status.textContent = 'Brief copied';
            setTimeout(function () { label.textContent = 'Copy'; }, 2000);
          }, function () { status.textContent = 'Copy failed. Select the brief and copy it manually.'; });
        });
        document.getElementById('brief-dl').addEventListener('click', function () {
          var blob = new Blob([getMarkdown()], { type: 'text/markdown' }), anchor = document.createElement('a');
          anchor.href = URL.createObjectURL(blob); anchor.download = filename;
          document.body.appendChild(anchor); anchor.click(); anchor.remove();
          setTimeout(function () { URL.revokeObjectURL(anchor.href); }, 1000);
        });
      }
      function renderAssessment(source) {
        out.innerHTML = '<div class="rw-band"><div class="guide-wrap rw-plan"><div><section class="scope-panel"><h2>' + (source.unknown_source ? 'Source assessment' : 'Upgrade assessment') + '</h2>' +
          '<p>Keeping this system and researching its native upgrade paths can be evaluated before choosing a target. Choose a target above whenever you want to prepare a scoped rewrite brief.</p>' +
          '<p>This is an assessment request. The actual application inventory and responsibility decisions still need investigation.</p></section></div>' +
          '<div class="plan-side"><h2 class="plan-title">' + esc(source.title) + '</h2><div class="panel panel-brief"><div class="brief-wrap"><div class="brief-bar"><span class="brief-title">Agent assessment brief</span>' +
          '<button type="button" class="cmd-btn" id="brief-copy">' + ICON.copy + '<span>Copy</span></button></div>' +
          '<div class="brief-text"><pre class="mono" id="brief-text">' + esc(assessmentText(source)) + '</pre></div></div>' +
          '<button type="button" class="btn-secondary w-full" id="brief-dl">' + ICON.download + 'Download assessment .md</button><div class="brief-files">' +
          (source.markdown_url ? extLink('', source.markdown_url, 'Source guide') : '') + extLink('', BASE + 'rewrite/guide.md', 'Rewrite guide .md') + extLink('', BASE + 'rewrite/contracts.json', 'Contracts .json') +
          '</div></div><p class="sr-status" id="copy-status" aria-live="polite"></p></div></div></div>';
        bindBriefActions(function () { return assessmentMarkdown(source); }, (source.unknown_source ? 'source-assessment-' : 'upgrade-assessment-') + encodeURIComponent(source.id) + '.md');
      }

      function modesHtml(noneChecked) {
        var scoped = state.confirmed && assessMigration(currentSource(), targets[state.to]).requires_clarification;
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
        var src = currentSource(), tgt = targets[state.to];
        var same = src && tgt && state.from === state.to, pair = src && tgt;
        var fit = assessMigration(src, tgt), crossRole = pair && fit.requires_clarification;
        if (crossRole && state.scope === 'redesign' && state.confirmed) state.mode = 'target';
        var ready = pair && (!crossRole || state.confirmed);
        sync();
        var note = ready ? R.pair_notes.filter(function (n) { return n.source === state.from && n.target === state.to; })[0] : null;

        if (msg) { msg.hidden = !invalidTarget; if (invalidTarget) msg.textContent = 'This link names ' + invalidTarget + ' as its target, but that system has no target guide here. Research it separately or choose a documented target. Source coverage is not a target recommendation.'; }
        pTo.btn.removeAttribute('aria-invalid');
        pTo.btn.removeAttribute('aria-describedby');
        if (otherField) otherField.hidden = state.from !== 'other';
        if (sourceDetails) { sourceDetails.innerHTML = sourceDetailHtml(src); sourceDetails.hidden = !sourceDetails.innerHTML; }

        if (state.assessment && src) { renderAssessment(src); return; }

        var side;
        if (crossRole && !state.confirmed) {
          side = '<div class="plan-side pad"><div class="panel panel-empty"><h2>Clarify the change first</h2><p>A shared language or a selected target does not establish compatibility. Name the full or partial scope, kept, replaced and retired responsibilities, owners and checks.</p><a class="panel-link" href="' + esc(guideHref(src)) + '">Read the current stack guide' + ICON.arrowSm + '</a><a class="panel-link" href="' + esc(guideHref(tgt)) + '">Read the target stack guide' + ICON.arrowSm + '</a></div></div>';
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
            '<div class="brief-files">' + (src.markdown_url ? extLink('', src.markdown_url, 'Source guide') : '') + extLink('', tgt.markdown_url, 'Target stack guide') + extLink('', BASE + 'rewrite/guide.md', 'Rewrite guide .md') + extLink('', BASE + 'rewrite/contracts.json', 'Contracts .json') + '</div>' +
            '</div><p class="sr-status" id="copy-status" aria-live="polite"></p></div>';
        }

        var html = '<div class="rw-band"><div class="guide-wrap rw-plan' + (ready ? '' : ' is-last') + '"><div>' + assessmentAction(src, tgt) + (crossRole ? scopeDetails(fit) : '') + (!crossRole || ready ? modesHtml(false) : '') + '</div>' + side + '</div></div>';

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

        if (ready) bindBriefActions(function () { return briefMarkdown(src, tgt, note); }, 'rewrite-' + encodeURIComponent(src.id) + '-to-' + encodeURIComponent(tgt.id) + '.md');
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
          if (pre) pre.textContent = briefText(currentSource(), targets[state.to]);
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
        if (event.target.closest('[data-prepare-assessment]')) {
          var source = currentSource();
          if (!source) return;
          if (source.unknown_source && !state.otherName.trim()) {
            if (otherInput) { otherInput.setCustomValidity('Name the current system before preparing its source assessment.'); otherInput.reportValidity(); otherInput.focus(); }
            return;
          }
          resetScope();
          state.assessment = true;
          state.to = ''; invalidTarget = ''; pTo.set('');
          render();
          var assessmentBrief = document.getElementById('brief-text');
          assessmentBrief.tabIndex = -1; assessmentBrief.focus();
          return;
        }
        if (!event.target.closest('[data-edit-scope]')) return;
        state.confirmed = false;
        render();
        out.querySelector('input[name="scope"]:checked').focus();
      });

      render();
    }
  })();
