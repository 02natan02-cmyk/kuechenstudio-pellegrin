
/* Pellegrin · Universum 2026 – Seitenübergänge, Reveals, Zähler, Kacheln, Cursor, Ausstellung-Teaser, Zoom. Entwurf: Falcon Eye */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement, RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const page = root.dataset.page, IO = 'IntersectionObserver' in window;
  const L = on => { const l = window.__lenis; if (l) on ? l.start() : l.stop(); };
  root.classList.add('uni-js');

  /* ---------- Weicher Seitenwechsel: View Transitions, sonst kurzer Fade ---------- */
  if (!('onpagereveal' in window) && !RM) {
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname || !/(\.html|\/)$/.test(u.pathname)) return;
      e.preventDefault(); root.classList.add('uni-leave'); setTimeout(() => { location.href = u.href; }, 240);
    });
    addEventListener('pageshow', () => root.classList.remove('uni-leave'));
  }

  /* ---------- Einblenden beim Scrollen ---------- */
  const rv = $$('[data-rv]');
  if (RM || !IO) rv.forEach(el => el.classList.add('in'));
  else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -7% 0px' }); rv.forEach(el => io.observe(el)); }

  /* ---------- Zahlen zählen hoch ---------- */
  const cnt = $$('[data-count]');
  if (!RM && IO && cnt.length) {
    const run = el => { const to = +el.dataset.count, from = +(el.dataset.from || 0), T = 1700, t0 = performance.now(); const f = now => { const k = Math.min(1, (now - t0) / T); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { threshold: .6 });
    cnt.forEach(el => { el.textContent = el.dataset.from || 0; io.observe(el); });
  }

  /* ---------- Kacheln: Neigen + Glanz (nur Maus) ---------- */
  if (FINE && !RM) $$('[data-tilt]').forEach(el => {
    const inner = $('.wt-in', el) || el; let raf = 0, px = .5, py = .5;
    const apply = () => { raf = 0; inner.style.transform = `perspective(1100px) rotateX(${((.5 - py) * 6).toFixed(2)}deg) rotateY(${((px - .5) * 8).toFixed(2)}deg)`; el.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (py * 100).toFixed(1) + '%'); };
    el.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = el.getBoundingClientRect(); px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height; el.classList.add('tilting'); if (!raf) raf = requestAnimationFrame(apply); });
    el.addEventListener('pointerleave', () => { el.classList.remove('tilting'); inner.style.transform = ''; });
  });

  /* ---------- Magnetische Knöpfe (nur Maus, nicht im Planer) ---------- */
  if (FINE && !RM && page !== 'planer') $$('.btn').forEach(b => {
    b.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = b.getBoundingClientRect(); b.style.translate = `${(((e.clientX - r.left) / r.width) - .5) * 10}px ${(((e.clientY - r.top) / r.height) - .5) * 8}px`; });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  /* ---------- Cursor-Begleiter (nur Desktop mit Maus) ---------- */
  if (FINE && !RM && page !== 'planer') {
    const c = document.createElement('div'), d = document.createElement('div'); c.className = 'cur'; d.className = 'cur-d'; c.setAttribute('aria-hidden', 'true'); d.setAttribute('aria-hidden', 'true'); document.body.append(c, d);
    const SEL = 'a,button,[role="button"],label,input,select,textarea,[data-tilt],[data-zoom],.kc';
    let x = -200, y = -200, cx = x, cy = y, s = 1, ts = 1, on = false, raf = 0;
    const loop = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; s += (ts - s) * .2; c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) scale(${s.toFixed(3)})`; d.style.transform = `translate3d(${x}px,${y}px,0)`; raf = (Math.abs(x - cx) + Math.abs(y - cy) + Math.abs(ts - s) > .3) ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; x = e.clientX; y = e.clientY; if (!on) { on = true; cx = x; cy = y; c.classList.add('on'); d.classList.add('on'); } const t = e.target.closest ? e.target.closest(SEL) : null; ts = t ? 1.8 : 1; c.classList.toggle('hov', !!t); kick(); }, { passive: true });
    addEventListener('pointerdown', () => { ts = .75; kick(); }); addEventListener('pointerup', () => { ts = c.classList.contains('hov') ? 1.8 : 1; kick(); });
    document.documentElement.addEventListener('mouseleave', () => { on = false; c.classList.remove('on'); d.classList.remove('on'); });
  }

  /* ---------- Ausstellung-Teaser: Bildwechsel, Hover wechselt, Parallax ---------- */
  const at = $('[data-auteaser]');
  if (at) {
    const imgs = $$('.at-img', at), btns = $$('[data-at-i]', at), bars = $$('.at-bars i', at), chip = $('[data-at-chip]', at), stage = $('.at-stage', at);
    const DUR = 6000; let cur = 0, timer = 0, vis = false, hold = false;
    const schedule = () => { clearTimeout(timer); if (vis && !hold && !RM) timer = setTimeout(() => go(cur + 1), DUR); };
    const go = i => {
      cur = (i + imgs.length) % imgs.length;
      imgs.forEach((m, k) => { m.classList.toggle('on', k === cur); if (k === cur) m.loading = 'eager'; });
      btns.forEach((b, k) => { b.classList.toggle('on', k === cur); b.setAttribute('aria-pressed', k === cur ? 'true' : 'false'); });
      bars.forEach((b, k) => { b.classList.toggle('done', k < cur); b.classList.remove('on'); }); void at.offsetWidth; if (bars[cur]) bars[cur].classList.add('on');
      if (chip) chip.textContent = imgs[cur].dataset.name || ''; schedule();
    };
    btns.forEach((b, k) => { b.addEventListener('click', () => { hold = true; at.classList.add('hold'); go(k); }); b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && k !== cur) { hold = true; at.classList.add('hold'); go(k); } }); });
    $('.at-f', at).addEventListener('pointerleave', () => { hold = false; at.classList.remove('hold'); schedule(); });
    if (IO) new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; at.classList.toggle('vis', vis); schedule(); }), { threshold: .35 }).observe(stage); else { vis = true; at.classList.add('vis'); }
    if (FINE && !RM) { let q = 0; stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; if (!q) q = requestAnimationFrame(() => { q = 0; stage.style.setProperty('--px', (-px * 22).toFixed(1) + 'px'); stage.style.setProperty('--py', (-py * 16).toFixed(1) + 'px'); }); }); stage.addEventListener('pointerleave', () => { stage.style.setProperty('--px', '0px'); stage.style.setProperty('--py', '0px'); }); }
    go(0);
  }

  /* ---------- Zoom für Ausstellungsfotos ---------- */
  const zs = $$('[data-zoom]');
  if (zs.length) {
    let box = null, img, cap, list = [], idx = 0, back = null;
    const show = () => { const el = list[idx]; img.src = el.dataset.zoom; img.alt = el.dataset.zoomT || ''; cap.textContent = el.dataset.zoomT || ''; $('.zm-p', box).hidden = $('.zm-n', box).hidden = list.length < 2; };
    const close = () => { box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 300); L(true); if (back) back.focus(); };
    const step = k => { idx = (idx + k + list.length) % list.length; show(); };
    const build = () => {
      box = document.createElement('div'); box.className = 'zm'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Foto groß ansehen');
      box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button type="button" class="zm-x" aria-label="Schließen">×</button><button type="button" class="zm-p" aria-label="Vorheriges Foto">←</button><button type="button" class="zm-n" aria-label="Nächstes Foto">→</button>';
      document.body.appendChild(box); img = $('img', box); cap = $('figcaption', box);
      $('.zm-x', box).addEventListener('click', close); $('.zm-p', box).addEventListener('click', () => step(-1)); $('.zm-n', box).addEventListener('click', () => step(1));
      box.addEventListener('click', e => { if (e.target === box || e.target.tagName === 'FIGURE') close(); });
      addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
      let sx = null; box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true }); box.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });
    };
    zs.forEach(el => el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation(); if (!box) build(); back = el;
      const g = el.dataset.zoomG; list = g ? zs.filter(z => z.dataset.zoomG === g) : [el]; idx = Math.max(0, list.indexOf(el));
      show(); box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); L(false); $('.zm-x', box).focus();
    }));
  }
})();

/* ===== Runde 2: Hero-Tiefe, Wort-für-Wort, Welten-Vorschau, horizontale Leisten ===== */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const ARR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* Hero: Bild bleibt beim Scrollen zurück, Maus gibt Tiefe */
  const hero = $('.hero');
  if (hero && !RM) {
    const pic = $('.hero-pic', hero), cnt = $('.hero-c', hero); let mx = 0, my = 0, raf = 0;
    if (!$('.hero-glow', hero)) { const g = document.createElement('div'); g.className = 'hero-glow'; g.setAttribute('aria-hidden', 'true'); hero.appendChild(g); }
    const upd = () => { raf = 0; const h = hero.offsetHeight, y = Math.min(scrollY, h); const p = y / h;
      if (pic) pic.style.transform = `translate3d(${(-mx * 16).toFixed(1)}px,${(y * .32 - my * 12).toFixed(1)}px,0) scale(${(1.04 + p * .06).toFixed(3)})`;
      if (cnt) { cnt.style.transform = `translate3d(${(mx * 6).toFixed(1)}px,${(-y * .12).toFixed(1)}px,0)`; cnt.style.opacity = (1 - Math.max(0, p - .35) * 1.6).toFixed(3); } };
    const kick = () => { if (!raf) raf = requestAnimationFrame(upd); };
    addEventListener('scroll', () => { if (scrollY < hero.offsetHeight + 50) kick(); }, { passive: true });
    if (FINE) hero.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; kick(); });
    kick();
  }

  /* Einstieg: Wörter leuchten beim Scrollen auf */
  $$('[data-words]').forEach(el => {
    const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(t)); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.appendChild(s); } }); c.replaceWith(f); } else if (c.nodeType === 1) walk(c); }); };
    walk(el); const ws = $$('.w', el);
    if (RM) { ws.forEach(w => w.classList.add('on')); return; }
    // läuft von selbst – sobald der Satz ins Bild kommt, leuchten die Wörter nacheinander auf (kein Extra-Scrollen nötig)
    const go = () => ws.forEach((w, i) => setTimeout(() => w.classList.add('on'), 90 + i * 70));
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { threshold: .3 }); io.observe(el); } else go();
  });

  /* Welten-Liste: schwebende Vorschau folgt der Maus */
  const wn = $('[data-wn]');
  if (wn && FINE && !RM) {
    const fl = $('.wn-fl', wn), ims = $$('img', fl); let x = 0, y = 0, cx = 0, cy = 0, on = false, raf = 0, s = .6;
    const loop = () => { const dx = x - cx; cx += dx * .15; cy += (y - cy) * .15; s += ((on ? 1 : .6) - s) * .15; fl.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) rotate(${Math.max(-9, Math.min(9, dx * .05)).toFixed(2)}deg) scale(${s.toFixed(3)})`; raf = (on || Math.abs(dx) > .5 || s > .62) ? requestAnimationFrame(loop) : 0; };
    $$('.wn-r', wn).forEach((r, i) => r.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; ims.forEach((m, k) => { m.classList.toggle('on', k === i); if (k === i) m.loading = 'eager'; }); if (!on) { cx = Math.min(e.clientX + 48, innerWidth - 380); cy = e.clientY; } x = Math.min(e.clientX + 48, innerWidth - 380); y = e.clientY; on = true; fl.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); }));
    const list = $('.wn-list', wn);
    const tx = cx0 => Math.min(cx0 + 48, innerWidth - 380);
    list.addEventListener('pointermove', e => { x = tx(e.clientX); y = e.clientY; });
    list.addEventListener('pointerleave', () => { on = false; fl.classList.remove('on'); });
    addEventListener('scroll', () => { if (on) { on = false; fl.classList.remove('on'); } }, { passive: true });
  }

  /* Horizontale Leisten: Pfeile, Fortschritt, Hinweis, Ziehen mit der Maus, kurzes Anstupsen */
  const SC = $$('[data-fm], [data-fs], .pf-strip, .hw-compact .hw-steps');
  SC.forEach(el => {
    const bar = document.createElement('div'); bar.className = 'hs-bar'; bar.hidden = true;
    bar.innerHTML = '<span class="hs-hint"><i></i>' + (FINE ? 'Ziehen oder Pfeile' : 'Wischen für mehr') + '</span><span class="hs-prog"><b></b></span><button type="button" data-hs-p aria-label="Zurück">' + ARR + '</button><button type="button" data-hs-n aria-label="Weiter">' + ARR + '</button>';
    el.after(bar);
    const P = $('[data-hs-p]', bar), N = $('[data-hs-n]', bar), pb = $('.hs-prog', bar);
    const can = () => el.scrollWidth > el.clientWidth + 10 && /(auto|scroll)/.test(getComputedStyle(el).overflowX);
    const upd = () => { const m = el.scrollWidth - el.clientWidth, p = m > 0 ? el.scrollLeft / m : 0; pb.style.setProperty('--p', Math.max(.08, Math.min(1, p + el.clientWidth / el.scrollWidth * (1 - p))).toFixed(3)); P.disabled = el.scrollLeft < 6; N.disabled = el.scrollLeft > m - 6; el.classList.toggle('hs-end', el.scrollLeft > m - 6); };
    const setup = () => { const on = can(); bar.hidden = !on; el.classList.toggle('hs-on', on); if (on) { const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0; bar.style.setProperty('--hs-pad', (el.closest('.wrap') && el.classList.contains('wrap') ? 0 : pad) + 'px'); upd(); } };
    setup(); addEventListener('resize', setup); addEventListener('load', setup);
    el.addEventListener('scroll', upd, { passive: true });
    const by = d => el.scrollBy({ left: d * el.clientWidth * .75, behavior: RM ? 'auto' : 'smooth' });
    P.addEventListener('click', () => by(-1)); N.addEventListener('click', () => by(1));
    // Maus: ziehen statt Scrollbalken
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0 || !el.classList.contains('hs-on')) return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (!moved && Math.abs(dx) > 6) { moved = true; el.classList.add('drag'); } if (moved) el.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; if (moved) { el.classList.remove('drag'); const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; el.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => el.removeEventListener('click', stop, true), 50); } });
    // einmal kurz anstupsen, wenn die Leiste ins Bild kommt
    if (!RM && 'IntersectionObserver' in window) { let touched = false; el.addEventListener('pointerdown', () => touched = true, { once: true });
      const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); if (!can() || touched) return; setTimeout(() => { if (touched || el.scrollLeft > 4) return; el.scrollBy({ left: 110, behavior: 'smooth' }); setTimeout(() => { if (!touched) el.scrollBy({ left: -110, behavior: 'smooth' }); }, 750); }, 500); }, { threshold: .6 }); io.observe(el); }
  });
})();

/* ===== Runde 3: Impulse – jedes interaktive Element zeigt einmal von selbst, was es kann ===== */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(hover:hover) and (pointer:fine)').matches, IO = 'IntersectionObserver' in window;
  const HAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0v5.3m0-1.6a1.6 1.6 0 0 1 3.2 0v1.8m0-.6a1.6 1.6 0 0 1 3.2 0v4.1a6.2 6.2 0 0 1-6.2 6.2h-.9a6 6 0 0 1-4.8-2.4l-2.6-3.6a1.6 1.6 0 0 1 2.5-2l1.6 1.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* Nutzer fasst selbst an (nur echte Ereignisse) */
  const onUser = (el, cb) => { let done = false; const f = e => { if (done || (e.type !== 'uni:user' && !e.isTrusted)) return; done = true; cb(); }; ['pointerdown', 'touchstart', 'keydown', 'uni:user'].forEach(t => el.addEventListener(t, f, { passive: true })); };
  /* einmal, wenn sichtbar */
  const seen = (el, fn, th = .55) => { if (!IO) return fn(); const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: th }); io.observe(el); };
  /* Hinweis-Chip (Olive/Creme, Hand), verschwindet nach der ersten echten Berührung */
  const hint = (el, text, kind = 'swipe', host = el) => {
    if (!el || el.__uh) return; const c = document.createElement('span'); c.className = 'uh uh-' + kind; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<i>' + HAND + '</i><b>' + text + '</b>'; host.appendChild(c); el.__uh = c;
    onUser(el, () => { c.classList.add('gone'); setTimeout(() => c.remove(), 600); }); return c;
  };
  /* Regler einmal hin und her bewegen (löst die vorhandenen input-Ereignisse aus) */
  const wiggle = (input, seq, dur = 650, area = input) => {
    if (!input || RM) return; let stop = false; onUser(area, () => stop = true); if (area !== input) onUser(input, () => stop = true);
    const start = +input.value, pts = [start, ...seq, start]; let k = 0;
    const run = () => { if (stop || k >= pts.length - 1) return; const a = pts[k], b = pts[k + 1], t0 = performance.now();
      const f = now => { if (stop) return; const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; input.value = a + (b - a) * e; input.dispatchEvent(new Event('input', { bubbles: true })); if (t < 1) requestAnimationFrame(f); else { k++; setTimeout(run, 260); } };
      requestAnimationFrame(f); };
    seen(input, () => setTimeout(run, 500), .8);
  };
  window.uniHint = hint; window.uniWiggle = wiggle;

  // Elemente, die ihren Hinweis per data-uh mitbringen (87 Tage, Ausstellung)
  $$('[data-uh]').forEach(el => hint(el, el.dataset.uh, el.dataset.uhKind || 'swipe'));

  // Arbeitshöhe: 1,72 → 1,80 → 1,72 m
  const ah = $('[data-ah]'); if (ah) { hint(ah.closest('.ah-r') || ah, 'Regler ziehen', 'swipe'); wiggle(ah, [180], 750, ah.closest('.ah-r') || ah); }
  // Vorher/Nachher (Raum-Vorschau bewegt sich bereits selbst, hier nur der Hinweis) + Pfeiler-Vergleich
  $$('.ki-ba').forEach(b => hint(b, 'Ziehen', 'swipe'));
  const pf = $('.pf-ba'); if (pf) { hint(pf, 'Ziehen', 'swipe'); wiggle($('[data-ba-r]', pf), [72, 28], 700, pf); }
  // Marken-Regler
  const anchor = (input, cls) => { const a = document.createElement('span'); a.className = 'uh-anchor ' + cls; input.before(a); return a; };
  const mk = $('[data-mk]'); if (mk) { const w = mk.parentNode; hint(w, 'Regler ziehen', 'swipe', anchor(mk, 'up')); wiggle(mk, [2, 0], 420, w); }
  // Kochstufe beim Kochfeldabzug
  const kl = $('[data-kfalvl]'); if (kl) { const w = kl.closest('label') || kl.parentNode; hint(w, 'Ziehen', 'swipe', anchor(kl, 'down')); wiggle(kl, [9, 3], 700, w); }
  // Backofen: Tabs antippen
  const oj = $('[data-ofjump]'); if (oj) { const w = oj.parentNode; w.classList.add('uh-dock'); hint(w, 'Antippen', 'tap'); }
  // 3D-Küche im Planer-Teaser
  const tz = $('[data-teaser3d]'); if (tz) hint(tz, 'Ziehen zum Drehen', 'swipe');
  // Küchen-Finder: Antworten winken einmal
  const fd = $('[data-finder]'); if (fd) { hint(fd, 'Antippen', 'tap'); let used = false; onUser(fd, () => used = true); seen(fd, () => { if (used || RM) return; setTimeout(() => { fd.classList.add('uni-wave'); setTimeout(() => fd.classList.remove('uni-wave'), 1800); }, 500); }, .6); }
  // Welten-Liste: erste Vorschau zeigt sich einmal von selbst
  const wn = $('[data-wn]');
  if (wn && !RM) { let used = false; wn.addEventListener('pointermove', e => { if (e.isTrusted) used = true; }); onUser(wn, () => used = true);
    seen($('.wn-list', wn), () => setTimeout(() => { if (used) return; const r0 = $('.wn-r', wn); if (!r0) return; r0.classList.add('peek');
      if (FINE && typeof PointerEvent === 'function') { const b = r0.getBoundingClientRect(); const o = { pointerType: 'mouse', clientX: b.left + b.width * .55, clientY: b.top + b.height / 2, bubbles: false }; r0.dispatchEvent(new PointerEvent('pointerenter', o)); }
      setTimeout(() => { r0.classList.remove('peek'); if (FINE && !used) $('.wn-list', wn).dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })); }, 1900); }, 700), .5); }
  // Horizontale Leisten: Hinweistext weg, sobald selbst gewischt/gezogen wurde
  $$('.hs-bar').forEach(bar => { const sc = bar.previousElementSibling, h = $('.hs-hint', bar); if (!sc || !h) return; const gone = () => h.classList.add('gone'); onUser(sc, gone); bar.addEventListener('click', gone); });
})();
