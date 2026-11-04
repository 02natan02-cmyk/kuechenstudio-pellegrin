
/* Pellegrin – Logo-Animation (ohne Abhängigkeiten) */
(() => {
  const ease = t => 1 - Math.pow(1 - t, 3);
  const tween = (el, attr, a, b, dur, delay) => new Promise(res => {
    if (!el) return res(); const t0 = performance.now() + delay;
    const step = now => { const t = Math.min(1, Math.max(0, (now - t0) / dur)); el.setAttribute(attr, (a + (b - a) * ease(t)).toFixed(1)); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
  const sheen = svg => tween(svg.querySelector('.pl-sheen'), 'x', -700, 2700, 1500, 0);
  const play = svg => {
    if (!svg || svg.dataset.plState) return; svg.dataset.plState = '1';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { svg.classList.add('pl-done'); const l = svg.querySelector('.pl-mL'), r = svg.querySelector('.pl-mR'); l && l.setAttribute('x', -200); r && r.setAttribute('x', 0); return; }
    svg.classList.add('pl-armed', 'pl-go');
    tween(svg.querySelector('.pl-mL'), 'x', 880, -200, 2300, 420);
    tween(svg.querySelector('.pl-mR'), 'x', -996, 0, 2300, 420);
    setTimeout(() => sheen(svg).then(() => svg.classList.add('pl-done')), 1500);
  };
  window.plPlay = play;
  const all = [...document.querySelectorAll('.plogo[data-pl-play]')].filter(s => !s.closest('.intro'));
  const busy = () => !!document.querySelector('.intro:not(.gone)');
  const vis = s => { const r = s.getBoundingClientRect(); return r.width > 0 && r.bottom > innerHeight * .05 && r.top < innerHeight * .92; };
  const check = () => all.forEach(s => {
    if (s.dataset.plState || s.__plWait || !vis(s)) return;
    if (!busy()) return play(s);
    s.__plWait = setInterval(() => { if (!busy()) { clearInterval(s.__plWait); s.__plWait = 0; play(s); } }, 150);
  });
  addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); addEventListener('load', check);
  [0, 250, 800, 1600].forEach(t => setTimeout(check, t));
  // Hover/Tippen: Lichtkante nochmal drüber
  document.querySelectorAll('.plogo[data-pl-play]').forEach(s => s.addEventListener('pointerenter', () => { if (s.classList.contains('pl-done')) sheen(s); }));
})();

/* Ausstellung: Rundgang, Hotspots, Auto-Weiter */
(() => {
  const W = document.querySelector('[data-au]'); if (!W) return;
  const sls = [...W.querySelectorAll('[data-au-sl]')], tabs = [...W.querySelectorAll('[data-au-tab]')], tip = W.querySelector('[data-au-tip]'), stage = W.querySelector('.au-stage');
  const DUR = 9000; let cur = 0, t0 = performance.now(), auto = true, vis = false, raf;
  const hideTip = () => { tip.hidden = true; W.querySelectorAll('.au-dot.act').forEach(d => d.classList.remove('act')); };
  const go = i => { cur = (i + sls.length) % sls.length; sls.forEach((s, k) => s.classList.toggle('on', k === cur)); tabs.forEach((t, k) => { t.classList.toggle('on', k === cur); t.setAttribute('aria-selected', k === cur); t.querySelector('.au-bar b').style.width = '0'; }); hideTip(); t0 = performance.now(); };
  tabs.forEach((t, k) => t.addEventListener('click', () => { auto = false; go(k); }));
  const tick = now => { if (vis && auto) { const p = Math.min(1, (now - t0) / DUR); const b = tabs[cur].querySelector('.au-bar b'); b.style.width = (p * 100).toFixed(1) + '%'; if (p >= 1) go(cur + 1); } raf = requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis) t0 = performance.now() - 0; }), { threshold: .4 }).observe(stage); else vis = true;
  let touched = false;
  const openTip = d => {
    d.classList.add('act'); const li = d.closest('.au-sl').querySelector(`.au-info li[data-k="${[...d.parentNode.querySelectorAll('.au-dot')].indexOf(d)}"]`);
    tip.querySelector('b').textContent = li.querySelector('b').textContent; tip.querySelector('p').textContent = li.textContent.replace(li.querySelector('b').textContent, '');
    tip.hidden = false; tip.style.animation = 'none'; void tip.offsetWidth; tip.style.animation = '';
    const sr = stage.getBoundingClientRect(), dr = d.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = dr.left - sr.left + dr.width / 2 + 18, y = dr.top - sr.top - th / 2 + dr.height / 2;
    if (x + tw > sr.width - 12) x = dr.left - sr.left + dr.width / 2 - 18 - tw;
    y = Math.max(12, Math.min(sr.height - th - 12, y)); x = Math.max(12, x);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  W.querySelectorAll('.au-dot').forEach(d => d.addEventListener('click', e => {
    e.stopPropagation(); auto = false; touched = true; W.dispatchEvent(new CustomEvent('uni:user')); const was = d.classList.contains('act'); hideTip(); if (was) return; openTip(d);
  }));
  ['pointerdown', 'touchstart', 'keydown'].forEach(t => W.addEventListener(t, e => { if (e.isTrusted) touched = true; }, { passive: true }));
  // Impuls: der erste leuchtende Punkt öffnet sich einmal kurz von selbst
  if ('IntersectionObserver' in window) { const pio = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; pio.disconnect(); setTimeout(() => { if (touched) return; const d = sls[cur].querySelector('.au-dot'); if (!d) return; openTip(d); setTimeout(() => { if (!touched && d.classList.contains('act')) hideTip(); }, 3200); }, 1400); }, { threshold: .55 }); pio.observe(stage); }
  stage.addEventListener('click', e => { if (!e.target.closest('.au-dot,.au-tip')) hideTip(); });
  // Wischen auf dem Handy
  let sx = null; stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { auto = false; go(cur + (dx < 0 ? 1 : -1)); } sx = null; });
  stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') auto = false; });
})();

/* ===== Google-Bewertungen: Stern-Füllung beim Hereinscrollen, Welle beim Antippen ===== */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-bw]').forEach(function (sec) {
    var wall = sec.querySelector('[data-bw-wall]'), tiles = wall ? [].slice.call(wall.querySelectorAll('i')) : [], n = sec.querySelector('[data-bw-n]');
    var cols = 10;
    function wave(from) {
      var fx = from % cols, fy = Math.floor(from / cols);
      tiles.forEach(function (t, i) { var d = Math.hypot(i % cols - fx, Math.floor(i / cols) - fy); t.classList.remove('w'); void t.offsetWidth; t.style.setProperty('--w', Math.round(d * 55) + 'ms'); t.classList.add('w'); });
    }
    function count() { if (!n || RM) return; var to = +n.dataset.bwN, t0 = performance.now(); (function f(now) { var k = Math.min(1, (now - t0) / 1600); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(f); })(t0); }
    function go() { sec.classList.add('in'); count(); if (!RM) setTimeout(function () { if (!wall.classList.contains('t')) wave(0); }, 1500); }
    if (!('IntersectionObserver' in window) || RM) sec.classList.add('in');
    else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { threshold: .35 }).observe(sec);
    if (wall) wall.addEventListener('click', function (e) { var i = tiles.indexOf(e.target); wall.classList.add('t'); if (!RM) wave(i < 0 ? Math.floor(tiles.length / 2) : i); });
  });
})();

/* Nolte & Schüller: Lichtleiste ziehen, Neuheiten antippen, Bilder wechseln, Messband */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-hs-q]').forEach(q => {
    const mm = q.querySelector('[data-hs-mm]');
    const go = () => { q.classList.add('in'); if (!mm) return; if (RM) { mm.textContent = '0,0'; return; }
      const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 2200), v = 3 * Math.pow(1 - k, 3); mm.textContent = v.toFixed(1).replace('.', ','); if (k < 1) requestAnimationFrame(f); })(t0); };
    if (!('IntersectionObserver' in window)) return go();
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { threshold: .5 }).observe(q);
  });
  const sec = document.querySelector('[data-hs]'); if (!sec) return;
  const st = sec.querySelector('[data-hs-stage]'), bar = sec.querySelector('[data-hs-bar]');
  let x = 50, user = false;
  const set = (v, from) => { x = Math.max(8, Math.min(92, v)); st.style.setProperty('--x', x + '%'); bar.setAttribute('aria-valuenow', Math.round(x));
    const lean = x > 60 ? 'l' : x < 40 ? 'r' : ''; lean ? st.setAttribute('data-lean', lean) : st.removeAttribute('data-lean');
    bar.setAttribute('aria-valuetext', lean === 'l' ? 'Mehr Nolte' : lean === 'r' ? 'Mehr Schüller' : 'Nolte und Schüller zu gleichen Teilen'); };
  const fromEv = e => { const r = st.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
  let drag = false, sx = 0, sy = 0, decided = false;
  st.addEventListener('pointerdown', e => { if (e.target.closest('a')) return; drag = true; decided = e.pointerType === 'mouse'; sx = e.clientX; sy = e.clientY; user = true; st.classList.remove('cue');
    if (decided) { st.classList.add('drag'); st.setPointerCapture(e.pointerId); set(fromEv(e)); } });
  st.addEventListener('pointermove', e => { if (!drag) return;
    if (!decided) { const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy); if (dx < 6 && dy < 6) return; if (dy > dx) { drag = false; return; } decided = true; st.classList.add('drag'); try { st.setPointerCapture(e.pointerId); } catch (_) {} }
    set(fromEv(e)); });
  const end = e => { if (!drag) return; drag = false; st.classList.remove('drag');
    if (!decided && e && e.type === 'pointerup') set(fromEv(e)); };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', () => { drag = false; st.classList.remove('drag'); });
  bar.addEventListener('keydown', e => { const k = { ArrowLeft: -6, ArrowRight: 6, Home: -100, End: 100 }[e.key]; if (k == null) return; e.preventDefault(); user = true; set(k === -100 ? 8 : k === 100 ? 92 : x + k); });
  // Bilder je Seite langsam wechseln
  const cycle = side => { const ps = [...side.querySelectorAll('.hs-p')]; if (ps.length < 2) return; let k = ps.findIndex(p => p.classList.contains('on')); ps[k].classList.remove('on'); ps[(k + 1) % ps.length].classList.add('on'); };
  const sides = { nolte: sec.querySelector('[data-side="nolte"]'), schueller: sec.querySelector('[data-side="schueller"]') };
  let pause = 0;
  setInterval(() => { if (document.hidden || Date.now() < pause) return; cycle(sides.nolte); setTimeout(() => cycle(sides.schueller), 1800); }, 6400);
  // Neuheit antippen: Seite öffnet sich, passendes Bild erscheint
  const IMG = 'img/hs/';
  sec.querySelectorAll('.hs-n').forEach(b => b.addEventListener('click', () => {
    user = true; pause = Date.now() + 12000; st.classList.remove('cue');
    sec.querySelectorAll('.hs-n').forEach(o => o.classList.toggle('on', o === b));
    const side = sides[b.dataset.b], key = b.dataset.k;
    let p = side.querySelector('.hs-p[data-k="' + key + '"]');
    if (!p) { p = document.createElement('picture'); p.className = 'hs-p'; p.dataset.k = key; p.innerHTML = '<source media="(max-width: 760px)" srcset="' + IMG + key + '_m.webp"><img src="' + IMG + key + '.webp" alt="' + b.querySelector('b').textContent + '" decoding="async">'; side.insertBefore(p, side.querySelector('.hs-src')); }
    const show = () => { side.querySelectorAll('.hs-p').forEach(o => o.classList.toggle('on', o === p)); };
    const im = p.querySelector('img'); im.complete ? requestAnimationFrame(show) : im.addEventListener('load', show, { once: true });
    set(b.dataset.b === 'nolte' ? 78 : 22);
    if (innerWidth < 760) st.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  }));
  // Selbst-Impuls: Leiste einmal hin und her, dann Hinweis
  if (!RM && 'IntersectionObserver' in window) {
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect();
      [[30, 400], [70, 1500], [50, 2600]].forEach(([v, t]) => setTimeout(() => { if (!user) set(v); }, t));
      setTimeout(() => { if (!user) st.classList.add('cue'); }, 3500); setTimeout(() => st.classList.remove('cue'), 9000);
    }, { threshold: .45 }).observe(st);
  }
})();
