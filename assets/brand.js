
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
    const nk = wall ? +wall.dataset.nk || 0 : 0;
    let flipT = 0;
    function flips() {
      if (!nk || RM) return;
      tiles.forEach(t => { const k = t.querySelector('.bw-k'); if (k && !k.style.backgroundImage) k.style.backgroundImage = 'url(img/bw/k' + String(1 + Math.floor(Math.random() * nk)).padStart(2, '0') + '.webp)'; });
      const step = () => { if (document.hidden) { flipT = setTimeout(step, 1500); return; }
        const n = 2 + Math.floor(Math.random() * 2), used = new Set();
        for (let j = 0; j < n; j++) { let i; do { i = Math.floor(Math.random() * tiles.length); } while (used.has(i)); used.add(i); const t = tiles[i];
          const k = t.querySelector('.bw-k'); k.style.backgroundImage = 'url(img/bw/k' + String(1 + Math.floor(Math.random() * nk)).padStart(2, '0') + '.webp)';
          setTimeout(() => t.classList.add('fl'), j * 160); setTimeout(() => t.classList.remove('fl'), 2300 + j * 160); }
        flipT = setTimeout(step, 1500 + Math.random() * 900); };
      step();
    }
    function go() { sec.classList.add('in'); count(); setTimeout(flips, 2600); if (!RM) setTimeout(function () { if (!wall.classList.contains('t')) wave(0); }, 1500); }
    if (!('IntersectionObserver' in window) || RM) sec.classList.add('in');
    else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { threshold: .35 }).observe(sec);
    if (wall) wall.addEventListener('click', function (e) { var i = tiles.indexOf(e.target); wall.classList.add('t'); if (!RM) wave(i < 0 ? Math.floor(tiles.length / 2) : i); });
  });
})();

/* Nolte & Schüller: Lichtleiste ziehen, Neuheiten antippen, Bilder wechseln, Messband */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-nsh-q]').forEach(q => {
    const mm = q.querySelector('[data-nsh-mm]');
    const go = () => { q.classList.add('in'); if (!mm) return; if (RM) { mm.textContent = '0,0'; return; }
      const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 2200), v = 3 * Math.pow(1 - k, 3); mm.textContent = v.toFixed(1).replace('.', ','); if (k < 1) requestAnimationFrame(f); })(t0); };
    if (!('IntersectionObserver' in window)) return go();
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { threshold: .5 }).observe(q);
  });
  const sec = document.querySelector('[data-nsh]'); if (!sec) return;
  const st = sec.querySelector('[data-nsh-stage]'), bar = sec.querySelector('[data-nsh-bar]');
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
  const cycle = side => { const ps = [...side.querySelectorAll('.nsh-p')]; if (ps.length < 2) return; let k = ps.findIndex(p => p.classList.contains('on')); ps[k].classList.remove('on'); ps[(k + 1) % ps.length].classList.add('on'); };
  const sides = { nolte: sec.querySelector('[data-side="nolte"]'), schueller: sec.querySelector('[data-side="schueller"]') };
  let pause = 0;
  setInterval(() => { if (document.hidden || Date.now() < pause) return; cycle(sides.nolte); setTimeout(() => cycle(sides.schueller), 1800); }, 6400);
  // Neuheit antippen: Seite öffnet sich, passendes Bild erscheint
  const IMG = 'img/hs/';
  sec.querySelectorAll('.nsh-n').forEach(b => b.addEventListener('click', () => {
    user = true; pause = Date.now() + 12000; st.classList.remove('cue');
    sec.querySelectorAll('.nsh-n').forEach(o => o.classList.toggle('on', o === b));
    const side = sides[b.dataset.b], key = b.dataset.k;
    let p = side.querySelector('.nsh-p[data-k="' + key + '"]');
    if (!p) { p = document.createElement('picture'); p.className = 'nsh-p'; p.dataset.k = key; p.innerHTML = '<source media="(max-width: 760px)" srcset="' + IMG + key + '_m.webp"><img src="' + IMG + key + '.webp" alt="' + b.querySelector('b').textContent + '" decoding="async">'; side.insertBefore(p, side.querySelector('.nsh-src')); }
    const show = () => { side.querySelectorAll('.nsh-p').forEach(o => o.classList.toggle('on', o === p)); };
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

/* Handy-Menü: Escape schließt */
addEventListener('keydown', e => { if (e.key !== 'Escape') return; const b = document.querySelector('.burger[aria-expanded="true"]'); if (b) { b.click(); b.focus(); } });
/* Fragen & Antworten: Schubladen fahren ein, die erste öffnet sich von selbst */
(() => {
  const sec = document.querySelector('[data-fq]'); if (!sec) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, items = [...sec.querySelectorAll('.fq-i')];
  items.forEach(d => d.addEventListener('toggle', () => { if (d.open) { items.forEach(o => { if (o !== d && o.open && o.dataset.auto) o.open = false; }); } }));
  ['pointerdown', 'keydown'].forEach(t => sec.addEventListener(t, () => sec.classList.add('touched'), { once: true }));
  const go = () => { sec.classList.add('in'); if (RM) { items[0].open = true; return; } setTimeout(() => { if (!sec.classList.contains('touched') && items[0]) { items[0].dataset.auto = '1'; items[0].open = true; } }, 900 + items.length * 70); };
  if (!('IntersectionObserver' in window)) return go();
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { threshold: .25 }).observe(sec);
})();

/* Öffnungszeiten-Küchenrolle */
(() => {
  const H = { 1: [600, 990], 2: [600, 990], 3: [600, 840], 4: [600, 990], 5: [600, 990], 6: [540, 720] };
  const DN = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const f = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`.replace(':00', '');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = () => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value])); return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute }; };
  function info() {
    const { d, m } = now(), h = H[d];
    if (h && m >= h[0] && m < h[1]) return { open: true, d, t: `Jetzt geöffnet – heute bis ${f(h[1])} Uhr.` };
    let k = h && m < h[0] ? 0 : 1; while (!H[(d + k) % 7]) k++;
    const nd = (d + k) % 7, w = k === 0 ? 'heute' : k === 1 ? 'morgen' : k === 2 ? 'übermorgen' : 'am ' + DN[nd];
    return { open: false, d, t: `Gerade geschlossen – ${w} ab ${f(H[nd][0])} Uhr wieder für Sie da.` };
  }
  const sheetHTML = () => { const i = info(); return `<div class="oz-pg"><div class="oz-in"><p class="oz-k">Öffnungszeiten</p><p class="oz-now${i.open ? ' open' : ''}"><i></i><span>${i.t}</span></p><p class="oz-h">Für eine Küche nimmt man sich Zeit.</p><p class="oz-p">Vereinbaren Sie einen Termin – oder kommen Sie spontan vorbei und lassen Sie sich in unserer Ausstellung inspirieren.</p><ul class="oz-l">${[1, 2, 3, 4, 5, 6, 0].map(d => `<li class="${d === i.d ? 't' : ''}${H[d] ? '' : ' x'}"><b>${DN[d]}</b><span>${H[d] ? f(H[d][0]) + '–' + f(H[d][1]) + ' Uhr' : 'nach Vereinbarung'}</span></li>`).join('')}</ul><div class="oz-b"><a href="index.html#termin">Termin vereinbaren</a><a href="tel:+4968519397460">Anrufen</a></div></div></div><div class="oz-perf"></div><span class="oz-tear">abreißen ↓</span><div class="oz-lip"></div>`; };
  let el, roll, sh, pp, src = null, T = [], state = 'off', stay = false, y0 = 0;
  const clear = () => { T.forEach(clearTimeout); T = []; };
  const later = (fn, ms) => T.push(setTimeout(fn, RM ? 0 : ms));
  function build() {
    el = document.createElement('div'); el.className = 'oz'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Öffnungszeiten');
    el.innerHTML = '<div class="oz-roll" aria-hidden="true"><img src="img/oz/rolle.webp" alt="" width="640" height="250" decoding="async"></div><div class="oz-sh"><div class="oz-pp"></div></div>';
    document.body.appendChild(el); roll = el.querySelector('.oz-roll'); sh = el.querySelector('.oz-sh'); pp = el.querySelector('.oz-pp');
    el.addEventListener('mouseleave', () => { if (stay && state === 'open') later(tear, 450); });
    el.addEventListener('mouseenter', () => { if (state === 'open') clear(); });
    document.addEventListener('pointerdown', e => { if (state === 'open' && !el.contains(e.target) && !e.target.closest('.hdr .status')) tear(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && state === 'open') tear(); });
    addEventListener('scroll', () => { if (state === 'open' && Math.abs(scrollY - y0) > 80) tear(); }, { passive: true });
    new Image().src = 'img/oz/blatt.webp';
  }
  function anchor() {
    src = [...document.querySelectorAll('.hdr .status')].find(x => x.offsetParent) || null;
    const hb = (document.querySelector('.hdr') || document.body).getBoundingClientRect(), w = 300 * (innerWidth <= 860 ? .9 : 1);
    let x = src ? (() => { const r = src.getBoundingClientRect(); return r.left + r.width / 2 - w / 2; })() : innerWidth - w - 10;
    x = Math.max(8, Math.min(innerWidth - w - 8, x)); el.style.left = x + 'px'; el.style.top = Math.round(Math.max(0, hb.bottom) - 26) + 'px';
    return src ? src.getBoundingClientRect() : null;
  }
  // Rolle wächst aus der Statusanzeige heraus, dann rollt das Blatt ab
  function open(keep) {
    if (!el) build(); clear(); if (state === 'open' || state === 'opening') { stay = stay || keep; return; }
    state = 'opening'; stay = !!keep; y0 = scrollY; el.hidden = false; el.classList.add('on'); el.classList.remove('done', 'stay');
    pp.classList.add('fast'); pp.style.setProperty('--h', '0px'); pp.innerHTML = sheetHTML(); void pp.offsetWidth; pp.classList.remove('fast');
    const r = anchor(), er = el.getBoundingClientRect();
    if (src) src.classList.add('oz-src');
    if (!RM && r && roll.animate) {
      const dx = r.left + r.width / 2 - (er.left + 150), dy = r.top + r.height / 2 - (er.top + 50);
      roll.animate([{ transform: `translate(${dx}px,${dy}px) scale(.12) rotate(-8deg)`, opacity: 0 }, { transform: 'translate(0,6px) scale(1.04) rotate(1deg)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' });
    } else roll.style.opacity = 1;
    later(() => { el.classList.add('turn'); const hh = pp.querySelector('.oz-in').offsetHeight + 8; pp.style.setProperty('--h', hh + 'px'); }, 420);
    later(() => { el.classList.remove('turn'); el.classList.add('done'); el.classList.toggle('stay', stay); state = 'open'; if (src) src.classList.remove('oz-src');
      if (!stay && sh.animate && !RM) sh.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2.4deg)' }, { transform: 'rotate(1.8deg)' }, { transform: 'rotate(-.8deg)' }, { transform: 'rotate(0)' }], { duration: 900, easing: 'ease-in-out' });
      if (!stay) later(tear, 3400); }, 1600);
  }
  // Blatt reißt an der Perforation ab und fällt flatternd nach unten; die Rolle verschwindet in der Statusanzeige
  function tear() {
    if (state !== 'open') return; clear(); state = 'closing';
    const rect = pp.getBoundingClientRect(), fall = document.createElement('div');
    fall.className = 'oz-fall'; fall.style.cssText = `left:${rect.left}px;top:${rect.top + 4}px;width:${rect.width}px;height:${rect.height - 4}px;overflow:hidden;box-shadow:0 20px 30px -18px rgba(30,24,12,.45);clip-path:polygon(0 6px,6% 2px,12% 7px,19% 3px,26% 6px,33% 1px,41% 5px,48% 2px,56% 7px,63% 3px,71% 6px,78% 1px,86% 5px,93% 2px,100% 6px,100% 100%,0 100%)`;
    const g = pp.querySelector('.oz-pg').cloneNode(true); g.style.top = '-4px'; fall.appendChild(g);
    document.body.appendChild(fall);
    pp.classList.add('fast'); pp.style.setProperty('--h', '0px');
    if (RM) { fall.remove(); finish(); return; }
    const t0 = performance.now(), side = Math.random() < .5 ? -1 : 1; let vy = -1.2, y = 0;
    (function step(t) { const k = (t - t0) / 1000; vy += .55; y += vy; const x = side * (Math.sin(k * 3.2) * 28 + k * 30), rz = side * (Math.sin(k * 2.6) * 14 + k * 18), rx = Math.sin(k * 5.5) * 28;
      fall.style.transform = `translate(${x}px,${y}px) rotate(${rz}deg) rotateX(${rx}deg)`; fall.style.opacity = Math.max(0, 1 - Math.max(0, k - .9) / .6);
      if (k < 1.6 && y < innerHeight) requestAnimationFrame(step); else fall.remove(); })(t0);
    later(finish, 320);
  }
  function finish() {
    const r = src && src.offsetParent ? src.getBoundingClientRect() : null, er = el.getBoundingClientRect();
    const done = () => { el.classList.remove('on', 'done', 'stay'); el.hidden = true; state = 'off'; };
    if (!RM && r && roll.animate) { const dx = r.left + r.width / 2 - (er.left + 150), dy = r.top + r.height / 2 - (er.top + 50); const a = roll.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.12) rotate(10deg)`, opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'both' }); a.onfinish = done; src.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 420, delay: 420 }); }
    else if (!RM && roll.animate) { const a = roll.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-30px) scale(.6)' }], { duration: 420, fill: 'both' }); a.onfinish = done; }
    else done();
  }
  document.addEventListener('click', e => { const s = e.target.closest('.hdr .status'); if (!s) return; e.preventDefault(); if (state === 'open') { stay = true; el.classList.add('stay'); return; } open(true); });
  document.querySelectorAll('.hdr .status').forEach(s => { s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0'); s.setAttribute('aria-label', 'Öffnungszeiten anzeigen'); s.title = 'Öffnungszeiten anzeigen'; s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(true); } }); });
  addEventListener('resize', () => { if (el && !el.hidden) anchor(); });
  let seen = false; try { seen = sessionStorage.getItem('pel-oz2') === '1'; } catch (e) { }
  if (seen || /planer\.html/.test(location.pathname)) return;
  const start = () => { try { sessionStorage.setItem('pel-oz2', '1'); } catch (e) { } if (scrollY < 80) open(false); };
  const wait = () => { const it = document.querySelector('.intro'); if (it && !it.classList.contains('gone')) return setTimeout(wait, 400); setTimeout(start, 1500); };
  if (document.readyState === 'complete') wait(); else addEventListener('load', wait, { once: true });
})();

(() => {
  const f = document.querySelector('[data-pfilm]'); if (!f) return;
  const v = f.querySelector('video'), go = f.querySelector('[data-pf-go]'), snd = f.querySelector('[data-pf-snd]'), prog = f.querySelector('[data-pf-prog]');
  const S = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, x) => { try { localStorage.setItem(k, x); } catch (e) { } } };
  const port = () => innerHeight > innerWidth * 1.05;
  let started = false, ending = false, lastFocus = null;
  function load() { if (v.dataset.on) return; v.dataset.on = 1; const m = port(); v.poster = m ? v.dataset.pm : v.dataset.pd; v.src = m ? v.dataset.m : v.dataset.d; v.preload = 'auto'; try { v.load(); } catch (e) { } }
  function lock(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; if (window.lenis) { try { on ? lenis.stop() : lenis.start(); } catch (e) { } } }
  function open() {
    load(); lastFocus = document.activeElement; f.hidden = false; f.classList.remove('open', 'fade', 'now'); requestAnimationFrame(() => f.classList.add('on')); lock(true); started = false; ending = false;
    setTimeout(() => go.focus({ preventScroll: true }), 300);
  }
  function play() {
    if (started) return; started = true; S.set('pel-film1', '1'); load();
    f.classList.add('open'); v.currentTime = 0; v.muted = false; v.volume = 1;
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.muted = true; snd.hidden = false; v.play().catch(() => { }); });
  }
  // weicher Übergang: Film zieht zurück, Ton klingt aus, Startseite kommt mit leichtem Heranzoomen
  function close() {
    if (ending) return; ending = true; S.set('pel-film1', '1');
    const vol0 = v.volume, t0 = performance.now(); (function fade() { const k = Math.min(1, (performance.now() - t0) / 1500); try { v.volume = vol0 * (1 - k); } catch (e) { } if (k < 1) requestAnimationFrame(fade); })();
    document.documentElement.classList.remove('pf-first'); document.documentElement.classList.add('pf-reveal');
    lock(false); window.scrollTo(0, 0);
    f.classList.add('fade');
    setTimeout(() => { f.hidden = true; f.classList.remove('on', 'fade', 'open'); try { v.pause(); } catch (e) { } if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); setTimeout(() => document.documentElement.classList.remove('pf-reveal'), 2400); }, 1650);
  }
  go.addEventListener('click', e => { e.stopPropagation(); play(); });
  // auch ein Klick auf den Vorhang selbst öffnet ihn
  f.addEventListener('click', e => { if (!started && !e.target.closest('button')) play(); });
  snd.addEventListener('click', () => { v.muted = false; snd.hidden = true; if (v.paused) v.play().catch(() => { }); });
  f.querySelector('[data-pf-skip]').addEventListener('click', e => { e.stopPropagation(); close(); });
  addEventListener('keydown', e => { if (f.hidden) return; if (e.key === 'Escape') close(); else if (!started && (e.key === ' ' || e.key === 'Enter') && document.activeElement !== go) { e.preventDefault(); play(); } });
  v.addEventListener('timeupdate', () => { if (!v.duration) return; prog.style.width = (v.currentTime / v.duration * 100) + '%'; if (started && v.duration - v.currentTime < 1.5) close(); });
  v.addEventListener('ended', close);
  document.querySelectorAll('[data-pf-open]').forEach(b => b.addEventListener('click', () => open()));
  // erster Besuch: der Vorhang steht schon (Inline-Skript nach <body>) – Film vorladen, auf den Klick warten
  if (!f.hidden && f.classList.contains('now')) { lastFocus = document.activeElement; lock(true); load(); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('now'))); setTimeout(() => go.focus({ preventScroll: true }), 400); }
})();
