/* Projekt-Geschichten – Pfeiler-Kapitel, Kapitel-Parallax, Lightbox. Entwurf: Falcon Eye */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('.pg'); if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lenisStop = on => { const l = window.__lenis; if (l) on ? l.stop() : l.start(); };

  /* ================= Kapitel 01: Der Pfeiler (echte Montagefotos) ================= */
  const pf = $('[data-pf]', root);
  if (pf) {
    const pin = $('.pf-pin', pf), intro = $('[data-pf-intro]', pf), card = $('[data-pf-card]', pf), shade = $('[data-pf-shade]', pf);
    const draw = $('[data-pf-draw]', pf), ring = $('[data-pf-ring]', pf);
    const steps = $$('[data-pfs]', pf), prog = $$('.pf-prog li', pf), sls = $$('[data-pfsl]', pf);
    // Pro Foto: Fokuspunkt (Bildpixel) Anfang→Ende, Zoom Anfang→Ende, aktives Fenster, Einblendung
    const CFG = [
      { f0: [508, 446], f1: [508, 446], z: [1, 1.5], win: [0, .24], fade: null },
      { f0: [700, 760], f1: [760, 860], z: [1.02, 1.16], win: [.16, .44], fade: [.16, .25] },
      { f0: [640, 260], f1: [640, 860], z: [1.25, 1.1], win: [.40, .60], fade: [.40, .47] },
      { f0: [600, 760], f1: [780, 820], z: [1.02, 1.18], win: [.56, .78], fade: [.56, .63] },
      { f0: [640, 470], f1: [640, 470], z: [1.25, 1.0], win: [.74, .96], fade: [.74, .81] },
    ];
    sls.forEach((el, i) => { const c = CFG[i]; c.el = el; c.ph = $('.pf-ph', el); c.w = +el.dataset.w; c.h = +el.dataset.h; c.ph.style.width = c.w + 'px'; c.ph.style.height = c.h + 'px'; });
    if (reduce) {
      pf.classList.add('static'); if (draw) draw.setAttribute('stroke-dashoffset', 0);
    } else {
      let W = 0, H = 0, mob = false, last = -1;
      const layout = () => { W = pin.clientWidth; H = pin.clientHeight; mob = W < 900; last = -1; tick(); };
      const place = (c, t) => {
        const z = c.z[0] + (c.z[1] - c.z[0]) * t, fx = c.f0[0] + (c.f1[0] - c.f0[0]) * t, fy = c.f0[1] + (c.f1[1] - c.f0[1]) * t;
        const S = Math.max(W / c.w, H / c.h) * z;
        const tx = mob ? .5 * W : .36 * W, ty = mob ? .36 * H : .5 * H;
        const X = clamp(tx - fx * S, W - c.w * S, 0), Y = clamp(ty - fy * S, H - c.h * S, 0);
        c.ph.style.transform = `translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0) scale(${S.toFixed(4)})`;
      };
      const render = p => {
        CFG.forEach((c, i) => {
          const next = CFG[i + 1], near = p >= c.win[0] - .04 && (!next || p <= next.fade[1] + .02);
          c.el.style.visibility = near ? '' : 'hidden';
          if (!near) return;
          c.el.style.opacity = c.fade ? ease(seg(p, c.fade[0], c.fade[1])).toFixed(3) : 1;
          place(c, ease(seg(p, c.win[0], c.win[1])));
        });
        const qo = 1 - seg(p, .1, .18);
        intro.style.opacity = qo; intro.style.transform = `translateY(${(-30 * (1 - qo)).toFixed(1)}px)`; intro.style.visibility = qo <= 0 ? 'hidden' : '';
        shade.style.setProperty('--sh', p < .2 ? 1 : .75);
        if (ring) ring.classList.toggle('on', p > .08 && p < .2);
        if (draw) draw.setAttribute('stroke-dashoffset', (1 - seg(p, .26, .37)).toFixed(4));
        const st = p < .2 ? -1 : p < .43 ? 0 : p < .59 ? 1 : p < .77 ? 2 : 3;
        card.classList.toggle('on', st >= 0); card.classList.toggle('done', p > .88);
        steps.forEach((s, j) => s.classList.toggle('on', j === st)); prog.forEach((l, j) => l.classList.toggle('on', j === st));
        const bounds = [[.2, .43], [.43, .59], [.59, .77], [.77, .88]];
        prog.forEach((l, j) => l.querySelector('i').style.setProperty('--f', seg(p, bounds[j][0], bounds[j][1]).toFixed(3)));
      };
      let raf = 0;
      const tick = () => {
        raf = 0; const r = pf.getBoundingClientRect(), span = r.height - innerHeight;
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const p = clamp(-r.top / span); if (Math.abs(p - last) < .0004) return; last = p; render(p);
      };
      const req = () => { if (!raf) raf = requestAnimationFrame(tick); };
      addEventListener('scroll', req, { passive: true }); addEventListener('resize', layout);
      if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', layout);
      layout(); render(0);
    }
  }
  /* ---------- Frisch montiert: Pfeile ---------- */
  const fm = $('[data-fm]', root);
  if (fm) { const by = d => fm.scrollBy({ left: d * fm.clientWidth * .7, behavior: reduce ? 'auto' : 'smooth' }); const p = $('[data-fm-p]', root), n = $('[data-fm-n]', root); p && p.addEventListener('click', () => by(-1)); n && n.addEventListener('click', () => by(1)); }
  /* ---------- Vorher / Nachher ---------- */
  const ba = $('[data-ba]', root);
  if (ba) { const r = $('[data-ba-r]', ba); const set = () => ba.style.setProperty('--x', r.value + '%'); r.addEventListener('input', set); set(); }

  /* ================= Kapitel 02–08: Einblenden + Parallax/Ken Burns ================= */
  const chs = $$('[data-ch]', root);
  if (reduce || !('IntersectionObserver' in window)) chs.forEach(c => c.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -18% 0px' });
    chs.forEach(c => io.observe(c));
    const par = $$('[data-par]', root), insets = $$('.ch-inset', root); let pr = 0;
    const upd = () => {
      pr = 0; const vh = innerHeight;
      par.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return; const k = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1); img.style.setProperty('--py', (k * -7).toFixed(2) + '%'); img.style.setProperty('--ks', (1.08 + (1 - Math.abs(k)) * .05).toFixed(4)); });
      insets.forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return; const k = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1); el.style.setProperty('--iy', (k * 60).toFixed(1) + 'px'); });
    };
    addEventListener('scroll', () => { if (!pr) pr = requestAnimationFrame(upd); }, { passive: true }); upd();
  }

  /* ================= Lightbox (Tastatur, Wischen, Fokusfalle, Esc) ================= */
  const items = $$('[data-lb]', root);
  if (!items.length) return;
  const WA = 'https://wa.me/4917656791796';
  const slides = []; items.forEach(el => { el._first = slides.length; el.dataset.srcs.split(',').forEach((src, i, a) => slides.push({ el, src, i, n: a.length })); });
  const lb = document.createElement('div');
  lb.className = 'pgx'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Küchenbilder');
  lb.innerHTML = '<div class="pgx-top"><span class="pgx-count" aria-live="polite"></span><button type="button" class="pgx-x" aria-label="Schließen (Esc)">✕</button></div><div class="pgx-stage"><img alt=""><button type="button" class="pgx-prev" aria-label="Vorheriges Bild">←</button><button type="button" class="pgx-next" aria-label="Nächstes Bild">→</button></div><div class="pgx-bar"><div class="pgx-txt"><b></b><p></p></div><div class="pgx-act"><a class="btn btn-copper sm" data-plan href="planer.html">Ähnlich planen</a><a class="btn btn-wa sm" data-wa target="_blank" rel="noopener" href="https://wa.me/4917656791796">So eine will ich</a></div></div>';
  document.body.appendChild(lb);
  const img = $('img', lb), cnt = $('.pgx-count', lb), tb = $('.pgx-txt b', lb), tp = $('.pgx-txt p', lb);
  let cur = 0, opener = null;
  const show = k => {
    cur = (k + slides.length) % slides.length; const s = slides[cur], el = s.el;
    img.classList.add('ld');
    const im = new Image(); im.onload = im.onerror = () => { img.src = s.src; img.alt = (el.querySelector('img') || {}).alt || el.dataset.t; requestAnimationFrame(() => img.classList.remove('ld')); }; im.src = s.src;
    cnt.textContent = `${cur + 1} / ${slides.length}`;
    tb.textContent = el.dataset.t + (s.n > 1 ? ` · Bild ${s.i + 1}/${s.n}` : ''); tp.textContent = el.dataset.d;
    $('[data-plan]', lb).href = el.dataset.plan || 'planer.html';
    $('[data-wa]', lb).href = WA + '?text=' + encodeURIComponent('Hallo Herr Pellegrin, mir gefällt die Küche „' + el.dataset.t + '“ auf Ihrer Website. Können wir über so eine Küche für mich sprechen?');
    [1, -1].forEach(d => { const n = slides[(cur + d + slides.length) % slides.length]; const p = new Image(); p.src = n.src; });
  };
  const open = el => { opener = el; lb.hidden = false; show(el._first); requestAnimationFrame(() => lb.classList.add('on')); document.documentElement.style.overflow = 'hidden'; lenisStop(true); $('.pgx-x', lb).focus(); };
  const close = () => { lb.classList.remove('on'); lb.hidden = true; document.documentElement.style.overflow = ''; lenisStop(false); opener && opener.focus({ preventScroll: true }); };
  items.forEach(el => el.addEventListener('click', () => open(el)));
  $('.pgx-x', lb).addEventListener('click', close);
  $('.pgx-prev', lb).addEventListener('click', () => show(cur - 1)); $('.pgx-next', lb).addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('pgx-stage')) close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'Tab') { const f = $$('button,a[href]', lb).filter(x => x.offsetParent !== null); const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  let sx = 0, sy = 0; const st = $('.pgx-stage', lb);
  st.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  st.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1)); });
})();

/* ===== Review 16.10.: Zeitstrahl „87 Tage“, Lichtschalter, Karte auf Klick, WhatsApp kompakt, Kopfzeile im Hero ===== */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const once = (el, fn, opt) => { if (!el) return; if (!('IntersectionObserver' in window)) { fn(); return; } const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); fn(); } }, opt || { threshold: .45 }); o.observe(el); };

  /* ---------- Handschrift: 87 Tage – Zeitleiste zum Ziehen (Maus, Finger, Tastatur), mit Impuls beim Erscheinen ---------- */
  const tl = $('[data-hwtl]');
  if (tl) {
    const sec = tl.closest('.hw'), cards = $$('.hw-s', sec), track = $('.hw-steps', sec);
    const num = $('[data-hwtl-n]', tl), unit = $('[data-hwtl-u]', tl), lab = $('[data-hwtl-l]', tl), bar = $('.hw-tl-bar', tl), ms = $$('.hw-tl-m', tl), band = $('.hw-tl-band', tl);
    const STEPS = ['Aufmaß im Rohbau', 'Der 3D-Entwurf steht', 'Montage im September', 'Fertig – derselbe Raum'];
    const AT = [0, 10, 63, 87], CARD_D = [0, 10, 72, 87];
    const mob = () => innerWidth <= 640;
    sec.classList.add('tl-js');
    // kleines Bild in der Zeitleiste, wechselt mit dem Schritt
    const ph = document.createElement('div'); ph.className = 'hw-tl-ph'; ph.setAttribute('aria-hidden', 'true');
    cards.forEach((c, i) => { const im = $('.hw-mimg img', c); const x = new Image(); x.alt = ''; x.decoding = 'async'; if (im) x.src = im.getAttribute('src'); if (i === 0) x.className = 'on'; ph.appendChild(x); });
    tl.insertBefore(ph, tl.firstChild); tl.classList.add('has-ph');
    const phs = $$('img', ph);
    let day = 0, cur = -1, user = false, raf = 0, prog = 0;
    const stepOf = d => AT.reduce((a, v, i) => d >= v - .01 ? i : a, 0);
    const setDay = (d, fromTrack) => {
      d = Math.max(0, Math.min(87, d)); day = d; const n = Math.round(d), s = stepOf(n);
      bar.style.setProperty('--p', d / 87); ms.forEach(m => m.classList.toggle('on', d >= +m.dataset.d - .01)); band.classList.toggle('on', d >= 63);
      num.textContent = n; unit.textContent = n === 1 ? 'Tag' : 'Tage'; lab.textContent = STEPS[s];
      cards.forEach((c, i) => c.classList.toggle('lit', d >= 86.5 || i === s)); phs.forEach((m, i) => m.classList.toggle('on', i === s));
      tl.setAttribute('aria-valuenow', n); tl.setAttribute('aria-valuetext', n + (n === 1 ? ' Tag' : ' Tage') + ' – ' + STEPS[s]);
      if (s !== cur) { cur = s; if (mob() && track && !fromTrack) { const c = cards[s]; prog = performance.now(); track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' }); } }
    };
    const tween = (to, dur, done) => { cancelAnimationFrame(raf); const from = day, t0 = performance.now(); const f = now => { const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; setDay(from + (to - from) * e); if (t < 1) raf = requestAnimationFrame(f); else if (done) done(); }; raf = requestAnimationFrame(f); };
    const stopNudge = () => { if (!user) { user = true; tl.dispatchEvent(new CustomEvent('uni:user')); } cancelAnimationFrame(raf); };
    // Ziehen auf der Leiste
    const fromX = x => { const r = bar.getBoundingClientRect(); return (x - r.left) / r.width * 87; };
    let drag = false;
    tl.addEventListener('pointerdown', e => { if (e.button) return; stopNudge(); drag = true; tl.classList.add('drag'); setDay(fromX(e.clientX)); try { tl.setPointerCapture(e.pointerId); } catch (x) {} });
    tl.addEventListener('pointermove', e => { if (drag) setDay(fromX(e.clientX)); });
    const end = () => { if (!drag) return; drag = false; tl.classList.remove('drag'); const near = AT.reduce((a, v) => Math.abs(v - day) < Math.abs(a - day) ? v : a, AT[0]); if (Math.abs(near - day) < 4) tween(near, 280); };
    tl.addEventListener('pointerup', end); tl.addEventListener('pointercancel', end); tl.addEventListener('lostpointercapture', end);
    tl.addEventListener('keydown', e => { const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key]; let to = null; if (e.key === 'Home') to = 0; else if (e.key === 'End') to = 87; else if (k) to = Math.round(day) + k; if (to === null) return; e.preventDefault(); stopNudge(); setDay(to); });
    // Desktop: über die Karten fahren = zu diesem Tag springen
    cards.forEach((c, i) => { c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !mob() && user) tween(CARD_D[i], 520); }); c.addEventListener('click', () => { if (!mob()) { stopNudge(); tween(CARD_D[i], 520); } }); });
    // Handy: Wischen durch die Karten = Reise durch die Zeit
    if (track) {
      let q = 0;
      track.addEventListener('scroll', () => { if (!mob() || q || performance.now() - prog < 700) return; q = requestAnimationFrame(() => { q = 0; const st = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1; let i = Math.round(track.scrollLeft / st); if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) i = cards.length - 1; i = Math.max(0, Math.min(cards.length - 1, i)); if (stepOf(day) !== i) { cur = i; tween(CARD_D[i], 520); } }); }, { passive: true });
      ['pointerdown', 'touchstart'].forEach(t => track.addEventListener(t, e => { if (e.isTrusted) stopNudge(); }, { passive: true }));
    }
    tl.dataset.uh = mob() ? 'Wischen oder ziehen' : 'Ziehen'; tl.dataset.uhKind = 'swipe';
    setDay(0);
    // Impuls: sobald sichtbar 0 → Tag 10 → kurz Richtung Montage → wieder zurück
    if (RM) setDay(87);
    else once(tl, () => { if (user) return; tween(10, 950, () => setTimeout(() => { if (!user) tween(54, 1150, () => setTimeout(() => { if (!user) tween(0, 1050); }, 500)); }, 600)); }, { threshold: .6 });
  }

  /* ---------- Pellegrin-Detail: Licht im Foto selbst schalten ---------- */
  const lt = $('.lt');
  if (lt && $('.lt-fx', lt)) {
    const sw = $('.lt-sw', lt), bs = $$('[data-lt]', lt); let touched = false;
    const set = (k, on) => { lt.classList.toggle(k === 'out' ? 'lo' : 'li', on); const b = bs.find(x => x.dataset.lt === k); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    lt.classList.add('fx'); if (sw) sw.hidden = false;
    bs.forEach(b => b.addEventListener('click', () => { touched = true; set(b.dataset.lt, b.getAttribute('aria-pressed') !== 'true'); }));
    if (RM) { set('out', true); set('in', true); }
    else { set('out', false); set('in', false); once(lt, () => { setTimeout(() => { if (!touched) set('out', true); }, 600); setTimeout(() => { if (!touched) set('in', true); }, 1700); }, { threshold: .55 }); }
  }

  /* ---------- Karte erst auf Klick laden (keine Verbindung zu OpenStreetMap ohne Zustimmung) ---------- */
  $$('[data-map]').forEach(m => { const b = $('[data-map-load]', m); if (!b) return; b.addEventListener('click', () => { const f = document.createElement('iframe'); f.title = m.dataset.title || 'Karte'; f.src = m.dataset.src; m.appendChild(f); m.classList.add('on'); f.setAttribute('tabindex', '0'); f.focus({ preventScroll: true }); }); });

  /* ---------- WhatsApp-Knopf kompakt nach dem Einstieg, Kopfzeile im Hero hinterlegt ---------- */
  const fab = $('.wa-fab'), hdr = $('.hdr'); let rq = 0;
  const onS = () => { rq = 0; const y = scrollY; if (fab) fab.classList.toggle('mini', y > innerHeight * .85); if (hdr) hdr.classList.toggle('lift', y > 24); };
  addEventListener('scroll', () => { if (!rq) rq = requestAnimationFrame(onS); }, { passive: true }); onS();
})();
