// Stack Menu: glass stack folders, shared by the homepage and the Stack library page.
// Vanilla port of the Glass Folder Cards component (art generator, layered glass, hover lean, click to open).
// Any element with data-stack-folders gets folders. data-ids="id,id,..." picks and orders a subset; without it, all 14 show.
// Add data-single-file to show only each stack's guide.md, open it on click and show a description tooltip.
(function () {
    var ART = {
      dusk:    { style: 'marble', colors: ['#120c18', '#3e2850', '#8f6c9c', '#2b1a24', '#b3502f', '#eab08a', '#fbe7d2'], scale: 0.75, warp: 3.6, angle: 0.8, gloss: 0.5, veins: 0.5 },
      ember:   { style: 'marble', colors: ['#07090c', '#16252c', '#3d5f68', '#1a1416', '#a3201a', '#ef4a2b', '#ff8a5c'], scale: 0.62, warp: 3.2, angle: -0.5, gloss: 0.55, veins: 0.6 },
      verdant: { style: 'marble', colors: ['#070b08', '#173024', '#4f7a5a', '#141812', '#a7843a', '#e9cf87', '#fbf3d6'], scale: 0.7, warp: 3.4, angle: 2.1, gloss: 0.5, veins: 0.5 },
      graphite:{ style: 'streak', colors: ['#f5f5f5', '#bdbdbd', '#3a3a3a', '#0f0f0f', '#2a2a2a', '#9a9a9a', '#ededed'], scale: 0.7, warp: 1.5, angle: -0.6, gloss: 0.22, veins: 0 },
      gocyan:  { style: 'marble', colors: ['#03141b', '#0b3a4a', '#1a6f86', '#05222c', '#00add8', '#7fd8ee', '#e9f7fb'], scale: 0.7, warp: 3.3, angle: 1.2, gloss: 0.5, veins: 0.45 },
      swift:   { style: 'streak', colors: ['#fff3ec', '#ffc2a6', '#f05138', '#5a1a0a', '#1a0703', '#c2432a', '#ffe3d6'], scale: 0.7, warp: 1.4, angle: -0.55, gloss: 0.2, veins: 0 },
      ruby:    { style: 'marble', colors: ['#14050a', '#4a0d1c', '#a3122a', '#2a0a12', '#e8505b', '#f6b4b8', '#fff0f1'], scale: 0.7, warp: 3.4, angle: -1.1, gloss: 0.5, veins: 0.5 },
      teal:    { style: 'streak', colors: ['#effaf8', '#9fded6', '#05998b', '#053d38', '#0b1f1d', '#2bb5a6', '#e6f7f5'], scale: 0.7, warp: 1.5, angle: 0.45, gloss: 0.22, veins: 0 },
      // Added for the Stack library page, each keyed to its ecosystem's colours
      vite:    { style: 'streak', colors: ['#f4f3ff', '#c9c6ff', '#646cff', '#1b1840', '#0a0a1a', '#61dafb', '#e8fbff'], scale: 0.7, warp: 1.5, angle: 0.6, gloss: 0.22, veins: 0 },
      livewire:{ style: 'streak', colors: ['#fff0f6', '#ffc4dc', '#fb70a9', '#5a1030', '#1a0610', '#ff2d20', '#ffe0ea'], scale: 0.7, warp: 1.4, angle: -0.4, gloss: 0.2, veins: 0 },
      copper:  { style: 'marble', colors: ['#0b0c0e', '#2a2f36', '#6b7480', '#1b1410', '#b7410e', '#f0a46a', '#fde6d2'], scale: 0.68, warp: 3.3, angle: 1.6, gloss: 0.5, veins: 0.5 },
      terminal:{ style: 'streak', colors: ['#eafff4', '#9ff0c8', '#19b37a', '#063a28', '#020d09', '#00add8', '#dff7ff'], scale: 0.7, warp: 1.5, angle: -0.7, gloss: 0.22, veins: 0 },
      python:  { style: 'marble', colors: ['#060a12', '#14284a', '#3776ab', '#0f1626', '#ffd43b', '#ffe99a', '#fffbe6'], scale: 0.7, warp: 3.4, angle: 0.3, gloss: 0.5, veins: 0.45 },
      kotlin:  { style: 'streak', colors: ['#f6f0ff', '#cbb6ff', '#7f52ff', '#2a0f55', '#c711e1', '#e44857', '#ffe6ee'], scale: 0.7, warp: 1.5, angle: 0.5, gloss: 0.22, veins: 0 }
    };

    var STACKS = window.StackMenuData.stacks;
    var SEARCH = window.StackMenuData.search;
    window.StackFolders = { stacks: STACKS, search: SEARCH };

    // ---- art generator ----
    function hexToRgb(hex) {
      var h = hex.trim().replace(/^#/, '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = /^[0-9a-f]{6}$/i.test(h) ? parseInt(h, 16) : 0x808080;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rng(seed) {
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) >>> 0;
        var t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function hashString(s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
      return h >>> 0;
    }
    function makeFbm(seed) {
      var r = rng(seed), perm = new Uint8Array(512), grad = new Float32Array(512), p = [], i;
      for (i = 0; i < 256; i++) p.push(i);
      for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255];
      for (i = 0; i < 256; i++) { var a = r() * Math.PI * 2; grad[i * 2] = Math.cos(a); grad[i * 2 + 1] = Math.sin(a); }
      function noise(x, y) {
        var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
        var h00 = perm[X + perm[Y]] * 2, h10 = perm[X + 1 + perm[Y]] * 2, h01 = perm[X + perm[Y + 1]] * 2, h11 = perm[X + 1 + perm[Y + 1]] * 2;
        var d00 = grad[h00] * xf + grad[h00 + 1] * yf, d10 = grad[h10] * (xf - 1) + grad[h10 + 1] * yf;
        var d01 = grad[h01] * xf + grad[h01 + 1] * (yf - 1), d11 = grad[h11] * (xf - 1) + grad[h11 + 1] * (yf - 1);
        var u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
        return d00 + u * (d10 - d00) + v * (d01 - d00 + u * (d11 - d01 - d10 + d00));
      }
      return function (x, y, octaves) {
        var sum = 0, amp = 0.5;
        for (var k = 0; k < octaves; k++) {
          sum += amp * noise(x, y);
          var nx = 1.6 * x + 1.2 * y + 7.1;
          y = -1.2 * x + 1.6 * y + 3.3; x = nx; amp *= 0.5;
        }
        return sum;
      };
    }
    function createArtJob(width, height, recipe, seed) {
      var w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
      var colors = recipe.colors.length >= 2 ? recipe.colors : ['#111111', '#eeeeee'];
      var stops = colors.map(function (c, i) { return { t: i / (colors.length - 1), c: hexToRgb(c) }; });
      var scale = recipe.scale == null ? 0.7 : recipe.scale, warp = recipe.warp == null ? 3 : recipe.warp;
      var gloss = recipe.gloss == null ? 0.4 : recipe.gloss, veins = recipe.veins || 0, streak = recipe.style === 'streak';
      var fbm = makeFbm(seed * 977 + 13), r = rng(seed + 1), ox = r() * 50, oy = r() * 50;
      var angle = (recipe.angle || 0) + (r() - 0.5) * 0.5, ca = Math.cos(angle), sa = Math.sin(angle), m = Math.min(w, h);
      var gw = Math.ceil(w / 2) + 3, gh = Math.ceil(h / 2) + 3;
      var G = new Float32Array(gw * gh), GQ = new Float32Array(gw * gh), F = new Float32Array(w * h), Q = new Float32Array(w * h);
      var pixels = new Uint8ClampedArray(w * h * 4), row = 0;
      function field(gy) {
        for (var gx = 0; gx < gw; gx++) {
          var u = ((gx - 1) * 2 - w / 2) / m, v = ((gy - 1) * 2 - h / 2) / m;
          var px = (u * ca - v * sa) * scale, py = (u * sa + v * ca) * scale;
          if (streak) { px *= 0.14; py *= 2.2; }
          px += ox; py += oy;
          var qx = fbm(px, py, 3), qy = fbm(px + 5.2, py + 1.3, 3);
          var rx = fbm(px + warp * qx + 1.7, py + warp * qy + 9.2, 3), ry = fbm(px + warp * qx + 8.3, py + warp * qy + 2.8, 3);
          G[gy * gw + gx] = fbm(px + warp * rx, py + warp * ry, 4);
          GQ[gy * gw + gx] = Math.sqrt(qx * qx + qy * qy);
        }
      }
      function upsample() {
        var cr = function (a, b, c, d) { return (-a + 9 * b + 9 * c - d) / 16; };
        var T = new Float32Array(w * gh), x, y, c;
        for (var gy = 0; gy < gh; gy++) {
          var rr = gy * gw;
          for (x = 0; x < w; x++) { c = (x >> 1) + 1; T[gy * w + x] = x & 1 ? cr(G[rr + c - 1], G[rr + c], G[rr + c + 1], G[rr + c + 2]) : G[rr + c]; }
        }
        for (y = 0; y < h; y++) {
          c = (y >> 1) + 1;
          for (x = 0; x < w; x++) {
            F[y * w + x] = y & 1 ? cr(T[(c - 1) * w + x], T[c * w + x], T[(c + 1) * w + x], T[(c + 2) * w + x]) : T[c * w + x];
            var gx2 = (x >> 1) + 1, q0 = GQ[c * gw + gx2];
            var qx2 = x & 1 ? (q0 + GQ[c * gw + gx2 + 1]) / 2 : q0;
            var q1 = y & 1 ? (x & 1 ? (GQ[(c + 1) * gw + gx2] + GQ[(c + 1) * gw + gx2 + 1]) / 2 : GQ[(c + 1) * gw + gx2]) : qx2;
            Q[y * w + x] = (qx2 + q1) / 2;
          }
        }
      }
      function colorize() {
        var sample = [], stride = Math.max(1, Math.floor(F.length / 4096)), i;
        for (i = 0; i < F.length; i += stride) sample.push(F[i]);
        sample.sort(function (a, b) { return a - b; });
        var lo = sample[Math.floor(sample.length * 0.02)], hi = sample[Math.floor(sample.length * 0.98)], k = 1 / (hi - lo || 1);
        var lx = -0.55, ly = -0.65, lz = 0.52, slope = k * m * 0.012;
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            i = y * w + x;
            var t = (F[i] - lo) * k; t = t < 0 ? 0 : t > 1 ? 1 : t;
            var j = 1; while (j < stops.length - 1 && stops[j].t < t) j++;
            var a = stops[j - 1], b = stops[j];
            var f = (t - a.t) / (b.t - a.t || 1); f = f < 0 ? 0 : f > 1 ? 1 : f; f = f * f * (3 - 2 * f);
            var gx = (F[x < w - 1 ? i + 1 : i] - F[x > 0 ? i - 1 : i]) * slope;
            var gy = (F[y < h - 1 ? i + w : i] - F[y > 0 ? i - w : i]) * slope;
            var nd = (-gx * lx - gy * ly + lz) / Math.sqrt(gx * gx + gy * gy + 1);
            var spec = Math.pow(nd > 0 ? nd : 0, 24) * gloss * 255;
            var silk = 1 + 0.035 * Math.sin(t * 150 + Q[i] * 24);
            var vein = veins * Math.max(0, 1 - Math.abs(Q[i] - 0.42) * 14) * 0.6;
            var lit = (0.82 + 0.28 * nd) * silk * (1 - vein);
            pixels[i * 4] = (a.c[0] + (b.c[0] - a.c[0]) * f) * lit + spec;
            pixels[i * 4 + 1] = (a.c[1] + (b.c[1] - a.c[1]) * f) * lit + spec;
            pixels[i * 4 + 2] = (a.c[2] + (b.c[2] - a.c[2]) * f) * lit + spec;
            pixels[i * 4 + 3] = 255;
          }
        }
      }
      return {
        width: w, height: h, pixels: pixels,
        step: function (rows) {
          if (row >= gh) return true;
          var end = Math.min(gh, row + Math.max(1, rows));
          while (row < end) field(row++);
          if (row < gh) return false;
          upsample(); colorize(); return true;
        }
      };
    }
    // One shared painter: a few milliseconds a frame, so six folders never jank the page.
    var queue = [], pumping = false;
    function pump() {
      if (pumping) return;
      pumping = true;
      (function tick() {
        var until = performance.now() + 7;
        while (queue.length && performance.now() < until) {
          var head = queue[0];
          if (head.job.step(4)) { queue.shift(); head.done(head.job); }
        }
        if (queue.length) requestAnimationFrame(tick); else pumping = false;
      })();
    }
    function paintInto(canvas, recipe, seed, w, h) {
      queue.push({ job: createArtJob(w, h, recipe, seed), done: function (job) {
        canvas.width = job.width; canvas.height = job.height;
        var ctx = canvas.getContext('2d');
        if (ctx) ctx.putImageData(new ImageData(job.pixels, job.width, job.height), 0, 0);
        canvas.setAttribute('data-ready', '');
      } });
      pump();
    }

    // ---- folder geometry (drawn at 340 x 272, scaled to the cell) ----
    var W = 340, H = 272, HEADROOM = 54, FRONT_H = 198;
    // Back panel: same top edge as the original, but tucked 2px inside the front glass below the tab line,
    // so no sliver of artwork or rim shows around the front's sides and bottom.
    var BACK_PATH = 'M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 120L338 124L338 248A22 22 0 0 1 316 270L24 270A22 22 0 0 1 2 248L2 104L0 100Z';
    var FRONT_PATH = 'M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 ' + (FRONT_H - 22) + 'A22 22 0 0 1 318 ' + FRONT_H + 'L22 ' + FRONT_H + 'A22 22 0 0 1 0 ' + (FRONT_H - 22) + 'Z';
    var density = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    var SVGNS = 'http://www.w3.org/2000/svg';

    function el(tag, cls, attrs) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }
    function svgRim(cls, vbH, d, strokeId) {
      var s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('class', 'gf-rim ' + cls); s.setAttribute('viewBox', '0 0 ' + W + ' ' + vbH); s.setAttribute('aria-hidden', 'true');
      if (strokeId) {
        s.innerHTML = '<defs><linearGradient id="' + strokeId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0.12"/></linearGradient></defs>';
      }
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', d);
      if (strokeId) p.setAttribute('stroke', 'url(#' + strokeId + ')');
      s.appendChild(p);
      return s;
    }

    var roots = [], uid = 0;
    function mount(host) {
      var ids = (host.getAttribute('data-ids') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var list = ids.length ? ids.map(function (id) { return STACKS.filter(function (s) { return s.id === id; })[0]; }).filter(Boolean) : STACKS;
      // data-single-file: each folder holds only its stack guide and a click opens it (guide page if one exists, else guide.md in a new tab)
      var single = host.hasAttribute('data-single-file');
      host.replaceChildren();
      list.forEach(function (stack) {
        var n = uid++;
        var guideFile = stack.files[stack.files.length - 1];
        var guideHref = guideFile[2] || 'content/agent/stacks/' + stack.id + '/guide.md';
        var guideNewTab = !guideFile[2];
        var files = single ? [['guide.md', guideFile[1], guideHref]] : stack.files;
        var cell = el('div', 'gf-cell');
        cell.setAttribute('data-id', stack.id);
        cell.setAttribute('data-group', stack.group);
        var root = el('div', 'gf-root');
        var stage = el('div', 'gf-stage');
        var tilt = el('div', 'gf-tilt');
        tilt.appendChild(el('div', 'gf-shadow', { 'aria-hidden': 'true' }));

        var back = el('div', 'gf-back', { 'aria-hidden': 'true' });
        back.style.clipPath = "path('" + BACK_PATH + "')";
        var art = el('canvas', 'gf-art', { 'aria-hidden': 'true' });
        art.style.width = (W + 24) + 'px'; art.style.height = (H + 24) + 'px';
        back.appendChild(art);
        back.appendChild(el('div', 'gf-back-sheen'));
        tilt.appendChild(back);
        tilt.appendChild(svgRim('gf-back-rim', H, BACK_PATH));

        var front = el('div', 'gf-front');
        front.style.clipPath = "path('" + FRONT_PATH + "')";
        front.appendChild(el('div', 'gf-tint', { 'aria-hidden': 'true' }));
        front.appendChild(el('div', 'gf-spec', { 'aria-hidden': 'true' }));
        front.appendChild(svgRim('gf-front-rim', FRONT_H, FRONT_PATH, 'gf-rim-' + n));
        var count = files.length;
        var hit = single
          ? el('a', 'gf-hit', { href: guideHref, 'aria-label': 'Open the ' + stack.label + ' stack guide' + (guideNewTab ? ' (opens in a new tab)' : '') })
          : el('button', 'gf-hit', { type: 'button', 'aria-expanded': 'false', 'aria-label': 'Open ' + stack.label + ', ' + stack.lang + ', ' + count + ' files' });
        if (single && guideNewTab) { hit.target = '_blank'; hit.rel = 'noopener'; }
        front.appendChild(hit);
        var label = el('div', 'gf-label');
        var title = el('span', 'gf-title'); title.textContent = stack.label;
        var meta = el('span', 'gf-meta'); meta.textContent = stack.lang + ' · ' + count + (count === 1 ? ' file' : ' files');
        label.appendChild(title); label.appendChild(meta);
        front.appendChild(label);
        tilt.appendChild(front);

        var filesEl = el('div', 'gf-files', { role: 'list', 'aria-label': stack.label + ' files' });
        files.forEach(function (file, v) {
          var jitter = rng(hashString(file[0] + stack.id) + v);
          var slot = el('div', 'gf-sheet-slot', { role: 'listitem' });
          var sheet = file[2] ? el('a', 'gf-sheet', { href: file[2], 'aria-label': 'Open ' + stack.label + ' ' + file[0] }) : el('span', 'gf-sheet');
          if (single) { sheet.tabIndex = -1; if (guideNewTab) { sheet.target = '_blank'; sheet.rel = 'noopener'; } }
          sheet.style.setProperty('--gf-slot', count <= 1 ? 0 : (v / (count - 1)) * 2 - 1);
          sheet.style.setProperty('--gf-depth', count - 1 - v);
          sheet.style.setProperty('--gf-jx', ((jitter() - 0.5) * 10).toFixed(2) + 'px');
          sheet.style.setProperty('--gf-jr', ((jitter() - 0.5) * 3.2).toFixed(2) + 'deg');
          sheet.style.zIndex = v + 1;
          sheet.innerHTML = '<span class="gf-lines" aria-hidden="true"><i style="width:86%"></i><i style="width:92%"></i><i style="width:64%"></i><i style="width:88%"></i><i style="width:42%"></i></span>';
          var head = el('span', 'gf-sheet-head');
          var nm = el('span', 'gf-sheet-name'); nm.textContent = file[0];
          head.appendChild(nm);
          if (file[1]) { var mt = el('span', 'gf-sheet-meta'); mt.textContent = file[1]; head.appendChild(mt); }
          sheet.appendChild(head);
          slot.appendChild(sheet);
          filesEl.appendChild(slot);
        });
        tilt.appendChild(filesEl);
        stage.appendChild(tilt);
        root.appendChild(stage);
        cell.appendChild(root);
        if (single && stack.blurb) {
          var tip = el('span', 'gf-tip', { role: 'tooltip', id: 'gf-tip-' + n });
          var tipName = el('b'); tipName.textContent = stack.label;
          tip.appendChild(tipName); tip.appendChild(document.createTextNode(stack.blurb));
          cell.appendChild(tip);
          hit.setAttribute('aria-describedby', tip.id);
        }
        host.appendChild(cell);

        function setOpen(open) {
          if (open) root.setAttribute('data-open', ''); else root.removeAttribute('data-open');
          hit.setAttribute('aria-expanded', String(open));
          hit.setAttribute('aria-label', (open ? 'Close ' : 'Open ') + stack.label + ', ' + stack.lang + ', ' + count + ' files');
        }
        if (!single) hit.addEventListener('click', function () { setOpen(!root.hasAttribute('data-open')); });
        root._close = function () { setOpen(false); };

        // light and parallax follow the cursor
        var raf = 0, px = 0, py = 0;
        function write() { raf = 0; root.style.setProperty('--gf-px', px.toFixed(3)); root.style.setProperty('--gf-py', py.toFixed(3)); }
        root.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var r = root.getBoundingClientRect();
          px = ((e.clientX - r.left) / r.width) * 2 - 1; py = ((e.clientY - r.top) / r.height) * 2 - 1;
          if (!raf) raf = requestAnimationFrame(write);
        });
        root.addEventListener('pointerleave', function () { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(write); });

        // scale the 340-wide drawing to the cell
        function fit() {
          var w = Math.min(W, cell.clientWidth || W), k = w / W;
          root.style.height = ((H + HEADROOM) * k) + 'px';
          stage.style.transform = 'translateY(' + (HEADROOM * k) + 'px) scale(' + k + ')';
        }
        fit();
        if (window.ResizeObserver) new ResizeObserver(fit).observe(cell);

        paintInto(art, ART[stack.art], stack.seed, (W + 24) * density, (H + 24) * density);
        roots.push(root);
      });

    }
    document.querySelectorAll('[data-stack-folders]').forEach(mount);

    // Escape and a press outside close any open folder
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      roots.forEach(function (r) { if (r.hasAttribute('data-open')) { r._close(); r.querySelector('.gf-hit').focus(); } });
    });
    document.addEventListener('pointerdown', function (e) {
      roots.forEach(function (r) { if (r.hasAttribute('data-open') && !r.contains(e.target)) r._close(); });
    });

    // milk glass in light mode, smoked glass in dark mode
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function tone() {
      var t = document.documentElement.getAttribute('data-theme');
      var dark = t ? t === 'dark' : mq.matches;
      roots.forEach(function (r) { r.setAttribute('data-tone', dark ? 'dark' : 'light'); });
    }
    tone();
    if (mq.addEventListener) mq.addEventListener('change', tone);
    new MutationObserver(tone).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Pages that build their own containers (e.g. grouped sections) mount folders into them with this.
    window.StackFolders.mount = function (host) { mount(host); tone(); };
})();
