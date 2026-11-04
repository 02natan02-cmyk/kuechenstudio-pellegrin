/* Pellegrin · Dampfbackofen in Teilen (3D) + Kochfeldabzug-Animation – Entwurf Falcon Eye */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq = function (q) { return window.matchMedia(q).matches; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function scrollToY(y) { var L = window.__lenis; if (L) L.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); }

  /* ================= Dampfbackofen in Teilen ================= */
  (function () {
    var sec = $('[data-ofen]'); if (!sec) return;
    var host = $('[data-of3d]', sec), stageEl = $('[data-ofstage]', sec), linesSvg = $('[data-oflines]', sec);
    var steps = $$('[data-ofs]', sec), bar = $('[data-ofbar]', sec), tEl = $('[data-oftemp]', sec), mEl = $('[data-ofmode]', sec), arc = $('[data-ofarc]', sec), cnt = $('[data-ofcount]', sec);
    var ghostEl = $('[data-ofghost]', sec), WORDS = ['Glas', 'Touch', 'Ebenen', 'Kern', 'Luft', 'Dampf', 'Kohle', 'Maß', 'Auf.'];
    function ghost(k) {
      if (!ghostEl) return;
      $$('i', ghostEl).forEach(function (o) { $$('span', o).forEach(function (x) { x.className = 'out'; }); setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 1400); });
      var lay = document.createElement('i'); WORDS[k].split('').forEach(function (c, j) { var sp = document.createElement('span'); sp.textContent = c; sp.style.setProperty('--i', j); sp.className = RM ? 'in' : 'pre'; lay.appendChild(sp); }); ghostEl.appendChild(lay);
      if (!RM) requestAnimationFrame(function () { requestAnimationFrame(function () { $$('span', lay).forEach(function (x) { x.className = 'in'; }); }); });
    }
    var labels = {}; $$('[data-ofl]', sec).forEach(function (l) { labels[l.dataset.ofl] = l; });
    var KEYS = ['tuer', 'display', 'garraum', 'fuehler', 'rapidair', 'dampf', 'abzug', 'gehaeuse', 'smart'];
    var AT = steps.map(function (s) { return +s.dataset.at; });
    var NS = 'http://www.w3.org/2000/svg', lineEls = {};
    Object.keys(labels).forEach(function (k) {
      var g = document.createElementNS(NS, 'g'); g.style.opacity = 0; g.style.transition = 'opacity .35s';
      var ln = document.createElementNS(NS, 'line'), c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 5);
      g.appendChild(ln); g.appendChild(c); linesSvg.appendChild(g); lineEls[k] = { g: g, l: ln, c: c };
    });
    // Etiketten-Versatz in px (Kamera schaut von rechts)
    var OFF = { tuer: [70, 70], display: [40, -100], garraum: [-150, 70], fuehler: [-170, -70], rapidair: [160, -70], dampf: [130, 80], abzug: [-140, -110], gehaeuse: [150, 10] };
    var X = null, P = 0, cur = -1, staticMode = RM, ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var win = function (p, a, b) { return ease(clamp((p - a) / (b - a), 0, 1)); };
    var webgl = (function () { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } })();
    if (staticMode) sec.classList.add('static');
    function stepFor(p) { var k = 0; for (var i = 0; i < AT.length; i++) if (p >= AT[i]) k = i; return k; }
    function fallback() { var f = $('.of-fb', sec); if (f) f.hidden = false; sec.classList.add('static'); staticMode = true; }
    function hud(p) {
      var t = 30 + 150 * win(p, .02, .5) + 20 * win(p, .5, .7);
      tEl.textContent = Math.round(t) + '°';
      arc.style.strokeDasharray = ((t - 30) / 170 * 100).toFixed(1) + ' 100';
      mEl.textContent = p > .88 ? 'Tür auf' : p > .76 ? 'Setzt sich zusammen' : p > .5 ? 'Heißluft + Dampf' : p > .06 ? 'Teil ' + (stepFor(p) + 1) + ' von 8' : 'In einem Stück';
      bar.style.transform = 'scaleY(' + p.toFixed(3) + ')';
      var k = stepFor(p);
      if (k !== cur) {
        cur = k; steps.forEach(function (s, i) { s.classList.toggle('on', i === k); s.classList.toggle('done', i < k); });
        if (cnt) cnt.textContent = (k < 9 ? '0' : '') + (k + 1) + ' / 09';
        ghost(k);
      }
      $$('[data-ofjump]', sec).forEach(function (b) { var v = +b.dataset.ofjump; b.classList.toggle('on', (v === .72 && p > .1 && p < .76) || (v === .9 && p >= .76 && p < .93) || (v === 1 && p >= .93)); });
    }
    function onFrame(an, p) {
      var r = stageEl.getBoundingClientRect(), w = r.width, h = r.height, ck = KEYS[stepFor(p)], mob = mq('(max-width:899px)');
      Object.keys(labels).forEach(function (k) {
        var a = an[k]; if (!a) return;
        var at = AT[KEYS.indexOf(k)], vis = (staticMode ? p > .06 : p >= at + .015) && p < .76 && (!mob || k === ck);
        var o = OFF[k] || [60, -40], s = mob ? .5 : 1, L = labels[k];
        var top0 = mob ? 84 : 120;
        var lw = Math.max(L.offsetWidth, L.scrollWidth || 0);
        // Handy: Etikett immer oben im freien Raum (nie über Display/Garraum), Linie führt zum Bauteil
        var lx = mob ? clamp(a.x - lw / 2, 8, w - lw - 96) : clamp(a.x + o[0] * s - (o[0] < 0 ? lw : 0), 6, w - lw - 6), ly = mob ? top0 + 8 : clamp(a.y + o[1] * s, top0, h - 120);
        L.style.transform = 'translate(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px)';
        L.classList.toggle('on', vis); L.classList.toggle('cur', k === ck);
        L.tabIndex = vis ? 0 : -1;
        var le = lineEls[k]; le.g.style.opacity = vis ? 1 : 0;
        var tx = mob ? lx + lw / 2 : lx + (o[0] < 0 ? lw : 0), ty = mob ? ly + L.offsetHeight : ly + L.offsetHeight / 2;
        le.l.setAttribute('x1', a.x); le.l.setAttribute('y1', a.y); le.l.setAttribute('x2', tx); le.l.setAttribute('y2', ty);
        le.c.setAttribute('cx', a.x); le.c.setAttribute('cy', a.y);
      });
    }
    function prog() { var r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); }
    function update() { if (staticMode) return; P = prog(); hud(P); if (X) X.set(P); }
    function load() {
      if (!webgl) { fallback(); hud(.72); return; }
      var s = document.createElement('script'); s.src = 'js/ofen3d.js';
      s.onload = function () {
        try { X = window.PellegrinOfen3D(host, { onFrame: onFrame }); } catch (e) { fallback(); return; }
        if (staticMode) { P = .72; X.set(P); hud(P); } else update();
        if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && !RM) X.play(); else X.pause(); }).observe(sec);
      };
      s.onerror = fallback;
      document.head.appendChild(s);
    }
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '1200px 0px' }); io.observe(sec); } else load();
    window.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    function goP(p) {
      if (staticMode) { P = p; hud(p); if (X) X.set(p); return; }
      var r = sec.getBoundingClientRect(), top = r.top + scrollY; scrollToY(top + p * (sec.offsetHeight - innerHeight));
    }
    function goStep(i) { i = clamp(i, 0, 8); goP(i === 8 ? .97 : AT[i] + (i === 0 ? .12 : .045)); }
    $$('[data-ofjump]', sec).forEach(function (b) { b.addEventListener('click', function () { goP(+b.dataset.ofjump); }); });
    Object.keys(labels).forEach(function (k) {
      var L = labels[k]; L.setAttribute('role', 'button'); L.setAttribute('aria-label', 'Zu: ' + L.textContent.replace(/^\d+/, ''));
      L.addEventListener('click', function () { goStep(KEYS.indexOf(k)); });
      L.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goStep(KEYS.indexOf(k)); } });
    });
    $$('[data-ofgo]', sec).forEach(function (b) { b.addEventListener('click', function () { goStep(+b.dataset.ofgo); }); });
    $$('[data-ofstep]', sec).forEach(function (b) { b.addEventListener('click', function () { goStep(Math.max(cur, 0) + (+b.dataset.ofstep)); }); });
    hud(staticMode ? .72 : 0);
  })();

  /* ================= Kochfeldabzug-Animation ================= */
  (function () {
    var sec = $('[data-kfa]'); if (!sec) return;
    var cv = $('[data-kfac]', sec), cx = cv.getContext('2d'), cap = $('[data-kfacap]', sec), lvl = $('[data-kfalvl]', sec), out = $('[data-kfaout]', sec);
    var FS = 1, W = 800, H = 620, mode = 'abzug', luft = 'umluft', level = 6, parts = [], flow = [], haze = 0, run = false, raf = 0, last = 0;
    var SANS = '"DM Sans", Arial, sans-serif';
    function size() { var r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.width * (H / W) * d); cx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); FS = clamp(560 / Math.max(1, r.width), 1, 1.75); if (!run) draw(); }
    var V = { x: 430, y: 352 }, POT = { x: 340, y: 296 };
    var PATH_U = [[430, 362], [430, 430], [430, 470], [540, 470], [540, 560], [540, 588], [620, 588], [700, 588], [790, 588]];
    var PATH_A = [[430, 362], [430, 430], [430, 470], [600, 470], [700, 470], [800, 470]];
    var HOOD = [[430, 120], [430, 40], [430, -20]];
    function pathPt(P, t) { var L = [], tot = 0, i; for (i = 1; i < P.length; i++) { var d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; } var s = t * tot; for (i = 0; i < L.length; i++) { if (s <= L[i]) { var k = s / L[i]; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; } s -= L[i]; } return P[P.length - 1]; }
    function spawn(n) { for (var i = 0; i < n; i++) parts.push({ x: POT.x + (Math.random() - .5) * 90, y: POT.y - 2, vx: (Math.random() - .5) * .3, vy: -.6 - Math.random() * .6, a: .9, r: 10 + Math.random() * 12, life: 0 }); }
    function step(dt) {
      spawn(Math.random() < level / 9 ? (level > 6 ? 2 : 1) : 0);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life += dt;
        p.vx += (Math.random() - .5) * .08; p.vy -= .006;
        if (mode === 'abzug') {
          var dx = V.x - p.x, dy = V.y - p.y, d = Math.hypot(dx, dy) + 1, f = 260 / (d * d) * 9 + .02;
          p.vx += dx / d * f * 2.4; p.vy += dy / d * f * 2.4; p.vx *= .9; p.vy *= .9;
          if (d < 16) { flow.push({ t: 0, sp: .0055 + Math.random() * .002, P: luft === 'umluft' ? PATH_U : PATH_A }); parts.splice(i, 1); continue; }
        } else {
          p.vx *= .985; p.vy *= .985;
          if (p.y < 150 && p.x > 330 && p.x < 530) { var hx = 430 - p.x, hy = 100 - p.y, hd = Math.hypot(hx, hy) + 1; p.vx += hx / hd * .12; p.vy += hy / hd * .12; if (hd < 24) { flow.push({ t: 0, sp: .012, P: HOOD }); parts.splice(i, 1); continue; } }
          if (p.y < 60) { p.vy = Math.abs(p.vy) * .2; p.vx += (p.x < 430 ? -.06 : .06); }
          p.r += .05; p.a -= .0016; if (p.a <= .05 || p.x < -40 || p.x > 840) { parts.splice(i, 1); haze = Math.min(1, haze + .004); continue; }
        }
        p.x += p.vx * dt * 1.6; p.y += p.vy * dt * 1.6;
      }
      for (i = flow.length - 1; i >= 0; i--) { flow[i].t += flow[i].sp * dt; if (flow[i].t >= 1) flow.splice(i, 1); }
      haze = mode === 'abzug' ? Math.max(0, haze - .004) : Math.max(0, haze - .0008);
      if (parts.length > 420) parts.splice(0, parts.length - 420);
    }
    function rr(x, y, w, h, r, fill) { cx.beginPath(); if (cx.roundRect) cx.roundRect(x, y, w, h, r); else cx.rect(x, y, w, h); cx.fillStyle = fill; cx.fill(); }
    function txt(s, x, y, c, sz, al, w) { cx.font = (w || 600) + ' ' + (sz * FS) + 'px ' + SANS; cx.fillStyle = c; cx.textAlign = al || 'left'; cx.fillText(s, x, y); }
    function pill(s, x, y, bg, col, al) { cx.font = '600 ' + (12.5 * FS) + 'px ' + SANS; var w = cx.measureText(s).width + 20, h = 14 + 11 * FS, x0 = al === 'right' ? x - w : x; rr(x0, y - h / 2, w, h, h / 2, bg); txt(s, x0 + 10, y + 4.2 * FS, col, 12.5, 'left', 600); }
    function arrow(x1, y1, x2, y2, c) { cx.strokeStyle = c; cx.fillStyle = c; cx.lineWidth = 2; cx.setLineDash([5, 5]); cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke(); cx.setLineDash([]); var a = Math.atan2(y2 - y1, x2 - x1); cx.beginPath(); cx.moveTo(x2, y2); cx.lineTo(x2 - 11 * Math.cos(a - .45), y2 - 11 * Math.sin(a - .45)); cx.lineTo(x2 - 11 * Math.cos(a + .45), y2 - 11 * Math.sin(a + .45)); cx.fill(); }
    function draw() {
      cx.clearRect(0, 0, W, H);
      // Wand: warmer Abend
      var g = cx.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, '#2c241f'); g.addColorStop(1, '#3a2f28'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var gl = cx.createRadialGradient(400, 10, 10, 400, 10, 420); gl.addColorStop(0, 'rgba(240,184,150,.28)'); gl.addColorStop(1, 'rgba(240,184,150,0)'); cx.fillStyle = gl; cx.fillRect(0, 0, W, 360);
      // Rückwand: Keramik in Steinoptik
      var gk = cx.createLinearGradient(0, 210, 0, 360); gk.addColorStop(0, '#d6cdc0'); gk.addColorStop(1, '#bdb2a3'); cx.fillStyle = gk; cx.fillRect(0, 210, W, 150);
      cx.strokeStyle = 'rgba(120,100,85,.22)'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(0, 300); cx.bezierCurveTo(200, 260, 320, 340, 520, 280); cx.bezierCurveTo(640, 250, 720, 300, 800, 270); cx.stroke();
      cx.beginPath(); cx.moveTo(60, 360); cx.bezierCurveTo(160, 300, 260, 330, 330, 240); cx.stroke();
      // links: offenes Eichenregal mit Gläsern
      rr(0, 156, 250, 12, 2, '#b5835a'); cx.fillStyle = '#93673f'; cx.fillRect(0, 166, 250, 3);
      [[30, 112, 34, 44, '#e9dccb'], [74, 124, 26, 32, '#7f7d4c'], [112, 100, 30, 56, '#efe6d8'], [170, 118, 40, 38, '#7d8c75']].forEach(function (j) { rr(j[0], j[1], j[2], j[3], 6, j[4]); cx.fillStyle = 'rgba(255,255,255,.18)'; cx.fillRect(j[0] + 4, j[1] + 6, 4, j[3] - 12); });
      // rechts: Oberschrank Anthrazit mit Eichenkante
      rr(W - 240, 34, 240, 150, 4, '#3a3633'); cx.fillStyle = '#b5835a'; cx.fillRect(W - 240, 178, 240, 6);
      cx.fillStyle = 'rgba(255,214,170,.55)'; cx.fillRect(W - 232, 186, 224, 3);
      // Haube
      if (mode === 'haube') { cx.fillStyle = '#3d3936'; cx.fillRect(404, 0, 52, 84); cx.beginPath(); cx.moveTo(318, 142); cx.lineTo(542, 142); cx.lineTo(474, 82); cx.lineTo(386, 82); cx.closePath(); cx.fillStyle = '#4a4542'; cx.fill(); cx.fillStyle = '#7f7d4c'; cx.fillRect(326, 138, 208, 4); }
      // Arbeitsplatte Keramik hell + Unterschrank (aufgeschnitten)
      cx.fillStyle = '#ece6dc'; cx.fillRect(0, 360, W, 18); cx.fillStyle = '#cfc6b8'; cx.fillRect(0, 374, W, 4);
      rr(0, 378, W, 202, 0, '#2c2927');
      cx.fillStyle = 'rgba(255,240,225,.05)'; cx.fillRect(250, 390, 380, 180);
      cx.strokeStyle = 'rgba(233,162,124,.6)'; cx.setLineDash([3, 6]); cx.lineWidth = 1.5; cx.strokeRect(250, 390, 380, 180); cx.setLineDash([]);
      txt(FS > 1.3 ? 'Unterschrank' : 'Blick in den Unterschrank', 262, 410, 'rgba(240,184,150,.75)', 12);
      [[16, 396, 210, 74], [16, 478, 210, 88], [646, 396, 140, 74], [646, 478, 140, 88]].forEach(function (b) { rr(b[0], b[1], b[2], b[3], 3, '#363230'); cx.fillStyle = '#b5835a'; cx.fillRect(b[0], b[1], b[2], 3); });
      // Sockel + Eichenboden
      cx.fillStyle = '#191615'; cx.fillRect(0, 580, W, 18);
      var gf = cx.createLinearGradient(0, 598, 0, 620); gf.addColorStop(0, '#8a5e3c'); gf.addColorStop(1, '#6e4a2f'); cx.fillStyle = gf; cx.fillRect(0, 598, W, 22);
      // Kochfeld
      cx.fillStyle = '#0d0b0a'; cx.fillRect(250, 352, 360, 9);
      if (mode === 'abzug') { cx.fillStyle = '#4a4440'; cx.fillRect(405, 351, 50, 10); for (var k = 0; k < 6; k++) { cx.fillStyle = '#171412'; cx.fillRect(408 + k * 8, 353, 4, 6); } }
      // Kanal + Filter
      cx.lineCap = 'round';
      if (mode === 'abzug') {
        cx.strokeStyle = '#8c8279'; cx.lineWidth = 26; cx.beginPath(); var P = luft === 'umluft' ? PATH_U : PATH_A; cx.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) cx.lineTo(P[i][0], P[i][1]); cx.stroke();
        cx.strokeStyle = '#5b534c'; cx.lineWidth = 18; cx.stroke();
        rr(408, 386, 44, 22, 5, '#d98c62'); pill('Fettfilter', 462, 397, 'rgba(246,241,233,.92)', '#1c1a17');
        rr(500, 452, 80, 36, 10, '#cfc6b8'); cx.save(); cx.translate(540, 470); cx.rotate(performance.now() / 120 * (level / 6)); cx.fillStyle = '#4a4440'; for (var b = 0; b < 5; b++) { cx.rotate(Math.PI * 2 / 5); cx.fillRect(-2, -14, 4, 14); } cx.restore(); pill('Gebläse', 590, 470, 'rgba(246,241,233,.92)', '#1c1a17');
        if (luft === 'umluft') { rr(560, 574, 90, 28, 6, '#1d1a18'); for (var h = 0; h < 8; h++) { cx.fillStyle = '#433d39'; cx.fillRect(566 + h * 10, 578, 6, 20); } pill('Aktivkohle', 560, 556, 'rgba(246,241,233,.92)', '#1c1a17'); txt(FS > 1.3 ? 'saubere Luft →' : 'gereinigte Luft zurück in die Küche →', 790, 615, '#f6efe6', 12, 'right'); }
        else { cx.fillStyle = '#d9cfc0'; cx.fillRect(770, 360, 30, 250); cx.fillStyle = 'rgba(0,0,0,.12)'; for (var z = 0; z < 12; z++) cx.fillRect(770, 368 + z * 20, 30, 1.5); txt('Außenwand', 762, 446, '#d5d8bf', 12, 'right'); txt('nach draußen →', 762, 500, '#f6efe6', 13, 'right'); }
      }
      var ig = cx.createRadialGradient(340, 356, 4, 340, 356, 90); var pul = .45 + .1 * Math.sin(performance.now() / 300) + level / 30; ig.addColorStop(0, 'rgba(255,110,60,' + pul + ')'); ig.addColorStop(1, 'rgba(255,110,60,0)'); cx.fillStyle = ig; cx.fillRect(250, 340, 180, 22);
      // Kupfertopf
      var gp = cx.createLinearGradient(284, 0, 396, 0); gp.addColorStop(0, '#9c4f2c'); gp.addColorStop(.45, '#e09a70'); gp.addColorStop(1, '#5f5d36'); cx.fillStyle = gp; rr(284, 300, 112, 52, 6, gp);
      cx.fillStyle = '#d5d8bf'; cx.fillRect(282, 298, 116, 6); cx.fillStyle = '#7a5a46'; cx.fillRect(266, 310, 18, 5); cx.fillRect(396, 310, 18, 5);
      // Dampf
      for (var j = 0; j < parts.length; j++) { var p = parts[j], gg = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); var al = p.a * (mode === 'abzug' ? .62 : .78); gg.addColorStop(0, 'rgba(255,248,240,' + al + ')'); gg.addColorStop(1, 'rgba(255,248,240,0)'); cx.fillStyle = gg; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.3); cx.fill(); }
      cx.lineCap = 'round'; for (j = 0; j < flow.length; j++) { var f = flow[j], q = pathPt(f.P, f.t); if (f.P !== HOOD && f.t > .03) { var q0 = pathPt(f.P, f.t - .03); cx.strokeStyle = f.P === PATH_U && f.t > .78 ? 'rgba(190,220,180,.35)' : 'rgba(240,184,150,.35)'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(q0[0], q0[1]); cx.lineTo(q[0], q[1]); cx.stroke(); } var clean = f.P === PATH_U && f.t > .78; cx.fillStyle = f.P === HOOD ? 'rgba(255,248,240,.7)' : (f.t < .2 ? 'rgba(255,248,240,.85)' : clean ? 'rgba(190,220,180,.95)' : 'rgba(240,184,150,.9)'); cx.beginPath(); cx.arc(q[0] + (Math.random() - .5) * 4, q[1] + (Math.random() - .5) * 4, 3.2, 0, 6.3); cx.fill(); }
      if (haze > .01) { cx.fillStyle = 'rgba(214,204,192,' + (haze * .42) + ')'; cx.fillRect(0, 0, W, 360); }
      // Geschwindigkeit
      arrow(252, 282, 252, 232, '#f6efe6'); pill('Dunst steigt: ≤ 1 m/s', 252, 214, 'rgba(28,26,23,.75)', '#f6efe6', 'right');
      if (mode === 'abzug') { arrow(476, 296, 448, 340, '#d5d8bf'); pill('ca. 4 m/s nach unten', 486, 290, '#7f7d4c', '#fff'); }
      else { var ht = FS > 1.3 ? 'Der Rest bleibt im Raum.' : 'Was die Haube nicht erwischt, bleibt im Raum.'; pill(ht, 790, 300, 'rgba(28,26,23,.86)', '#f6efe6', 'right'); }
      var bt = mode === 'abzug' ? 'Kochfeldabzug · ' + (luft === 'umluft' ? 'Umluft' : 'Abluft') : 'Dunsthaube'; cx.font = 'italic 400 ' + (17 * FS) + 'px Fraunces, Georgia, serif'; var bw = cx.measureText(bt).width + 30;
      var bh = 18 + 16 * FS; rr(W - bw - 16, 14, bw, bh, 8, mode === 'abzug' ? 'rgba(127,125,76,.95)' : 'rgba(246,241,233,.95)'); cx.fillStyle = mode === 'abzug' ? '#fff' : '#1c1a17'; cx.textAlign = 'left'; cx.fillText(bt, W - bw - 1, 14 + bh / 2 + 6 * FS);
    }
    function loop(t) { var dt = Math.min(3, (t - (last || t)) / 16.7); last = t; step(dt); draw(); if (run) raf = requestAnimationFrame(loop); }
    function setCap() { cap.textContent = mode === 'haube' ? 'Mit Haube zieht der Dunst erst an Gesicht und Oberschrank vorbei nach oben – was am Rand vorbeigeht, verteilt sich in der Küche.' : luft === 'umluft' ? 'Umluft: erst Fettfilter, dann Aktivkohle – die gereinigte Luft kommt unten am Sockel zurück in die Küche.' : 'Abluft: Der Dunst läuft durch einen Kanal im Unterschrank nach draußen.'; }
    function setMode(m) { mode = m; $$('[data-kfam]', sec).forEach(function (x) { var o = x.dataset.kfam === m; x.classList.toggle('on', o); x.setAttribute('aria-pressed', o ? 'true' : 'false'); }); }
    $$('[data-kfam]', sec).forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.kfam); flow = []; setCap(); if (!run) { warm(); draw(); } }); });
    $$('[data-kfal]', sec).forEach(function (b) { b.addEventListener('click', function () { luft = b.dataset.kfal; $$('[data-kfal]', sec).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); if (mode !== 'abzug') setMode('abzug'); flow = []; setCap(); if (!run) { warm(); draw(); } }); });
    lvl.addEventListener('input', function () { level = +lvl.value; out.textContent = level; if (!run) { warm(); draw(); } });
    $$('[data-kfashow]', sec).forEach(function (b) { b.addEventListener('click', function () { var t = $('[data-kfal="abluft"]', sec); if (t) t.click(); var r = cv.getBoundingClientRect(); scrollToY(r.top + scrollY - 110); }); });
    function warm() { parts = []; flow = []; haze = 0; for (var i = 0; i < 260; i++) step(1); }
    // Kinetische Überschrift: die Buchstaben fallen nach unten – wie der Dunst
    var drop = $('[data-kfadrop]', sec);
    if (drop && !RM && 'IntersectionObserver' in window) {
      var tx = drop.textContent, n = 0; drop.textContent = ''; tx.split(' ').forEach(function (w, wi) { if (wi) drop.appendChild(document.createTextNode(' ')); var ws = document.createElement('span'); ws.className = 'w'; w.split('').forEach(function (c) { var sp = document.createElement('span'); sp.className = 'c'; sp.textContent = c; sp.style.setProperty('--i', n++); ws.appendChild(sp); }); drop.appendChild(ws); });
      drop.setAttribute('aria-label', tx); drop.classList.add('arm');
      var dio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { dio.disconnect(); drop.classList.remove('arm'); drop.classList.add('go'); } }, { threshold: .6 }); dio.observe(drop);
    }
    // leichtes Kippen des Bildes mit der Maus
    var fr = $('.kfa-frame', sec);
    if (fr && !RM && mq('(hover:hover) and (pointer:fine)')) {
      fr.addEventListener('pointermove', function (e) { var r = fr.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; fr.style.transform = 'perspective(1200px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg)'; });
      fr.addEventListener('pointerleave', function () { fr.style.transform = ''; });
    }
    window.addEventListener('resize', size); size(); warm(); draw();
    if (!RM && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { var on = es[0].isIntersecting; if (on && !run) { run = true; last = 0; raf = requestAnimationFrame(loop); } else if (!on) { run = false; cancelAnimationFrame(raf); } }).observe(cv);
  })();
})();
