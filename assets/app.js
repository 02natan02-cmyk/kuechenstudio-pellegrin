/* Küchenstudio Pellegrin – Website: Falcon Eye */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasG = !!(window.gsap && window.ScrollTrigger); if (hasG) gsap.registerPlugin(ScrollTrigger);
  const page = root.dataset.page;
  const store = { get(k) { try { return sessionStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { sessionStorage.setItem(k, v) } catch (e) {} } };
  const TEL = '+4968519397460', MAIL = 'info@kuechenstudio-pellegrin.de', WA = 'https://wa.me/4917656791796';
  const onView = (el, fn, margin = '300px') => { if (!el) return; let d = false; const go = () => { if (!d) { d = true; fn(); } }; const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: margin }); io.observe(el); const chk = () => { if (d) return removeEventListener('scroll', chk); const r = el.getBoundingClientRect(); if (r.top < innerHeight + 300 && r.bottom > -300) go(); }; addEventListener('scroll', chk, { passive: true }); setTimeout(chk, 400); };
  const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); };

  let lenis = null;
  if (hasG && window.Lenis && !reduce && page !== 'planer') { lenis = new Lenis({ lerp: .1 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  window.__lenis = lenis;

  /* ---------- Header ---------- */
  // Ein-/Ausblenden mit Hysterese: erst nach ~40 px am Stück nach unten weg, nach ~28 px nach oben wieder da.
  // (Vorher reichten 2 px – langsames Daumen-Scrollen und die Montage-Fahrt ließen den Kopf am Handy zittern.)
  const hdr = $('.hdr'), heroEl = $('.hero'); let lastY = scrollY, acc = 0, hid = false, heroH = heroEl ? heroEl.offsetHeight : 0, solid = null;
  const heroM = () => { heroH = heroEl ? heroEl.offsetHeight : 0; }; addEventListener('resize', heroM, { passive: true }); addEventListener('load', heroM); setTimeout(heroM, 1500);
  const setHide = v => { if (v !== hid) { hid = v; hdr.classList.toggle('hide', v); } };
  const onScroll = () => {
    const y = Math.max(0, scrollY), d = y - lastY; lastY = y;
    const so = !heroEl || y > heroH - 90; if (so !== solid) { solid = so; hdr.classList.toggle('solid', so); }
    if (y < 700 || page === 'planer' || root.classList.contains('menu-open')) { acc = 0; setHide(false); return; }
    if (!d) return; if ((d > 0) !== (acc > 0)) acc = 0; acc += d;
    if (acc > 40) setHide(true); else if (acc < -28) setHide(false);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // Handy: Schnellkontakt-Leiste macht Platz, solange die 3D-Montage den Bildschirm füllt (sie verdeckte sonst deren Knöpfe)
  { const dock = $('.dock'), mt = $('.pm3-track'); if (dock && mt && 'IntersectionObserver' in window) new IntersectionObserver(es => root.classList.toggle('dock-off', es[0].isIntersecting), { rootMargin: '-45% 0px -45% 0px' }).observe(mt); }
  const burger = $('.burger');
  burger.addEventListener('click', () => { const o = root.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o); $('.mnav').setAttribute('aria-hidden', !o); lenis && (o ? lenis.stop() : lenis.start()); });
  $$('.mnav a').forEach(a => a.addEventListener('click', () => { root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); $('.mnav').setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }));

  /* ---------- Öffnungszeiten ---------- */
  const HRS = { 1: [600, 990], 2: [600, 990], 3: [600, 840], 4: [600, 990], 5: [600, 990], 6: [540, 720] };
  const DN = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const fmt = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`.replace(':00', '');
  const berlin = () => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value])); return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute }; };
  const hours = () => {
    const { d, m } = berlin(), h = HRS[d], open = h && m >= h[0] && m < h[1];
    let txt; if (open) txt = `Jetzt geöffnet · bis ${fmt(h[1])} Uhr`; else { let k = 0; if (!(h && m < h[0])) { do { k++; } while (!HRS[(d + k) % 7]); } const nd = (d + k) % 7; txt = `Geschlossen · öffnet ${k === 0 ? 'heute' : k === 1 ? 'morgen' : DN[nd]} um ${fmt(HRS[nd][0])} Uhr`; }
    $$('[data-status]').forEach(s => { s.classList.toggle('open', !!open); s.classList.toggle('closed', !open); s.querySelector('b').textContent = open ? 'Jetzt geöffnet' : 'Geschlossen'; });
    $$('[data-countdown]').forEach(c => c.textContent = txt);
    const hb = $('[data-hours]'); if (hb) hb.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(i => `<div class="${i === d ? 'today' : ''}"><span>${DN[i]}</span><span>${HRS[i] ? fmt(HRS[i][0]) + '–' + fmt(HRS[i][1]) + ' Uhr' : 'nach Vereinbarung'}</span></div>`).join('') + `<div><span>${txt}</span><span></span></div>`;
  };
  hours(); setInterval(hours, 30000);

  /* ---------- Videos ---------- */
  $$('video[data-src]').forEach(v => { v.muted = true; onView(v, () => { v.src = v.dataset.src; const p = v.play(); p && p.catch(() => {}); }); });

  /* =====================================================================
     INTRO: Gespräch – Skizze – Zuhause – aus Ruppenthal wird Pellegrin
     ===================================================================== */
  const intro = $('.intro');
  const heroIn = () => { if (!hasG || reduce || !document.querySelector('.hero-c')) return; gsap.from('.hero-c > *', { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: .1 }); gsap.fromTo('.hero-pic img', { scale: 1.06 }, { scale: 1, duration: 2.4, ease: 'power2.out' }); };
  if (intro) {
    const force = /[?&]intro/.test(location.search);
    if (!hasG || reduce || (store.get('pel-intro3') && !force)) { intro.classList.add('gone'); heroIn(); }
    else {
      store.set('pel-intro3', '1'); lenis && lenis.stop(); root.style.overflow = 'hidden';
      const port = innerHeight > innerWidth * 1.05, sk = $(port ? '.sk-m' : '.sk-d', intro); $(port ? '.sk-d' : '.sk-m', intro).remove(); sk.style.display = 'block';
      const lines = $$('polyline', sk), hole = $('.sk-hole', sk), vb = sk.viewBox.baseVal, R = Math.hypot(vb.width, vb.height) * .62;
      gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 });
      const L = $('.intro-logo', intro);
      const end = () => { intro.classList.add('gone'); root.style.overflow = ''; lenis && lenis.start(); };
      const tl = gsap.timeline({ onComplete: end });
      tl.to('.in-cap .c1', { opacity: 1, y: 0, duration: .9, ease: 'power2.out' }, .25)
        .to(lines, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut', stagger: { each: 1.7 / lines.length } }, .9)
        .to('.in-cap .c1', { opacity: 0, y: -16, duration: .45 }, 1.75)
        .to('.in-cap .c2', { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 2.3)
        .to('.in-cap .c2', { opacity: 0, y: -16, duration: .5 }, 3.5)
        .to(hole, { attr: { r: R }, duration: 1.7, ease: 'power2.inOut' }, 3.5)
        .to($('.sk-lines', sk), { opacity: .12, duration: 1.2 }, 3.9)
        .to('.in-cap .c3', { opacity: 1, y: 0, duration: .9, ease: 'power2.out' }, 4.1)
        .to('.in-cap .c3', { opacity: 0, duration: .6 }, 5.7)
        .to('.in-dim', { opacity: 1, duration: .9 }, 5.6)
        .to('.in-old', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, 5.9)
        .to('.in-arrow', { opacity: 1, duration: .5 }, 6.4)
        .to('.in-old', { opacity: .35, filter: 'grayscale(1) blur(1px)', duration: .8 }, 6.6)
        .to(L, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, 6.5)
        .add(() => { window.plPlay && window.plPlay(L.querySelector('.plogo')); }, 6.5)
        .to('.in-claim', { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 8.6)
        .add(() => heroIn(), 10.4)
        .to(intro, { opacity: 0, duration: .9, ease: 'power2.inOut' }, 10.4);
      // Tippen beschleunigt, Überspringen springt ans Ende
      intro.addEventListener('pointerdown', e => { if (e.target.closest('.intro-skip')) return; tl.timeScale(3.2); });
      // Scrollen/Wischen/Tasten während des Intros = Vorspulen (nicht „zu oft scrollen müssen“)
      ['wheel', 'touchmove', 'keydown'].forEach(ev => addEventListener(ev, () => { if (!intro.classList.contains('gone')) tl.timeScale(3.2); }, { passive: true }));
      $('.intro-skip', intro).addEventListener('click', () => { tl.progress(1); });
      setTimeout(() => { if (!intro.classList.contains('gone')) end(); }, 17000);
    }
  } else heroIn();

  /* ---------- Story: Logo-Morph + Zeitleiste ---------- */
  const morph = $('[data-morph]');
  if (morph && hasG) {
    gsap.fromTo(morph, { '--m': '100%' }, { '--m': '0%', ease: 'none', scrollTrigger: { trigger: morph, start: 'top 80%', end: 'bottom 35%', scrub: true } });
    gsap.from('.polaroid', { rotate: 6, y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.polaroid', start: 'top 90%' } });
    $$('.tl li').forEach((li, i) => gsap.from(li, { x: -20, opacity: 0, duration: .8, delay: i * .12, scrollTrigger: { trigger: '.tl', start: 'top 85%' } }));
  } else if (morph) morph.style.setProperty('--m', '0%');

  /* ---------- Reveals ---------- */
  if (hasG && !reduce) {
    $$('.sec-head, .kc, .mk-c, .termin, .mo-vid, .pt-3d').forEach(el => gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    $$('.h2').forEach(h => gsap.from(h, { clipPath: 'inset(0 0 100% 0)', y: 20, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 92%', once: true } }));
  }

  /* ---------- Küchen: Filter + Lightbox ---------- */
  const grid = $('.k-grid');
  if (grid) {
    $$('.filters button').forEach(b => b.addEventListener('click', () => { $$('.filters button').forEach(x => x.classList.toggle('on', x === b)); const f = b.dataset.f; $$('.kc', grid).forEach(k => k.classList.toggle('hide', f !== '*' && !k.dataset.tags.includes(f))); if (f !== '*') { grid.classList.add('all'); const km = $('.k-more'); if (km) km.hidden = true; } hasG && ScrollTrigger.refresh(); }));
    const lb = document.createElement('div'); lb.className = 'lbx'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="lbx-x" aria-label="Schließen">×</button><div class="lbx-img"><img alt=""></div><div class="lbx-bar"><button data-p aria-label="Vorheriges Bild">←</button><div><b></b><p class="small" style="color:#cfc6ba;margin:4px 0 0"></p></div><a class="btn btn-copper sm" data-lp href="planer.html">Ähnlich planen</a><a class="btn btn-wa sm" data-lw target="_blank" rel="noopener" href="https://wa.me/4917656791796">So eine will ich</a><button data-n aria-label="Nächstes Bild">→</button></div>';
    document.body.appendChild(lb);
    const cards = $$('.kc', grid); let ci = 0, ii = 0;
    const show = () => { const c = cards[ci], n = +c.dataset.n; $('img', lb).src = `img/k/${c.dataset.k}_${ii}.webp`; $('img', lb).alt = $('b', c).textContent; $('b', lb).textContent = $('b', c).textContent + (n > 1 ? ` · ${ii + 1}/${n}` : ''); $('p', lb).textContent = $('span', c).textContent; $('[data-lp]', lb).href = $('.kc-plan', c).getAttribute('href'); $('[data-lw]', lb).href = WA + '?text=' + encodeURIComponent('Hallo Herr Pellegrin, mir gefällt die Küche „' + $('b', c).textContent + '“ auf Ihrer Website. Können wir über so eine Küche für mich sprechen?'); };
    const vis = () => cards.filter(c => !c.classList.contains('hide'));
    const step = dir => { const c = cards[ci], n = +c.dataset.n; if (ii + dir >= 0 && ii + dir < n) ii += dir; else { const v = vis(), k = (v.indexOf(c) + dir + v.length) % v.length; ci = cards.indexOf(v[k]); ii = dir > 0 ? 0 : +v[k].dataset.n - 1; } show(); };
    const open = i => { ci = i; ii = 0; show(); lb.hidden = false; lenis && lenis.stop(); };
    const close = () => { lb.hidden = true; lenis && lenis.start(); };
    cards.forEach((c, i) => { c.addEventListener('click', e => { if (e.target.closest('.kc-plan')) return; open(i); }); c.addEventListener('keydown', e => { if (e.key === 'Enter') open(i); }); });
    $('.lbx-x', lb).addEventListener('click', close); $('[data-p]', lb).addEventListener('click', () => step(-1)); $('[data-n]', lb).addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lbx-img')) close(); });
    addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    let sx = 0; lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true }); lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
  }


  /* ---------- Küchen-Finder ---------- */
  const fd = $('[data-finder]');
  if (fd) {
    const kd = $('#k-data'); let K = []; try { K = kd ? JSON.parse(kd.textContent) : $$('.kc').map(c => ({ k: c.dataset.k, tags: c.dataset.tags, t: $('b', c).textContent, d: $('span', c).textContent, plan: $('.kc-plan', c).getAttribute('href') })); } catch (e) {}
    const ans = []; const qs = $$('.fi-q', fd), res = $('[data-res]', fd);
    const show = i => { qs.forEach((q, j) => q.classList.toggle('on', j === i)); res.hidden = i < 3; };
    qs.forEach((q, i) => $$('button', q).forEach(b => b.addEventListener('click', () => { ans[i] = b.dataset.v; if (i < 2) show(i + 1); else finish(); })));
    const finish = () => { const score = c => { let s = 0; if (c.tags.includes(ans[0])) s += 3; if (ans[1] === 'insel' && c.tags.includes('insel')) s += 2; if (ans[1] === 'theke' && c.tags.includes('theke')) s += 2; if (ans[1] === 'wand' && !c.tags.includes('insel')) s += 2; if (ans[2] === 'grifflos' && c.tags.includes('grifflos')) s += 1; if (ans[2] === 'griffe' && !c.tags.includes('grifflos')) s += 1; return s + Math.random() * .3; };
      const best = K.slice().sort((a, b) => score(b) - score(a))[0];
      $('[data-res-img]', fd).src = `img/k/${best.k}_0_s.webp`; $('[data-res-img]', fd).alt = best.t; $('[data-res-t]', fd).textContent = best.t; $('[data-res-d]', fd).textContent = best.d; $('[data-res-plan]', fd).href = best.plan; show(3); };
    $('[data-res-again]', fd).addEventListener('click', () => { ans.length = 0; show(0); });
  }

  /* ---------- Ergonomie ---------- */
  const eg = $('[data-ergo]');
  if (eg) { const svg = $('.er-svg'), hd = $('[data-hd]', svg), bd = $('[data-bd]', svg), ct = $('[data-ct]', svg), tp = $('[data-tp]', svg), ln = $('[data-ln]', svg);
    const upd = () => { const h = +eg.value, lo = Math.round(h / 2 + 5), hi = Math.round(h / 2 + 10), mid = (lo + hi) / 2, sc = 1.15, G = 250;
      const top = G - h * sc, wy = G - mid * sc, sh = top + 26 * sc * .9;
      hd.setAttribute('cy', top + 13); bd.setAttribute('y', top + 28); bd.setAttribute('height', G - top - 28); const arm = $('[data-arm]', svg); arm.setAttribute('y', wy - 14); ct.setAttribute('y', wy + 7); ct.setAttribute('height', G - wy - 7); tp.setAttribute('y', wy); ln.setAttribute('y1', wy); ln.setAttribute('y2', wy);
      $('[data-ergo-v]').textContent = h + ' cm'; $('[data-ergo-out]').textContent = `${lo}–${hi} cm`; };
    eg.addEventListener('input', upd); upd(); }

  /* ---------- 3D laden ---------- */
  let k3p = null; const load3d = () => k3p || (k3p = new Promise((res, rej) => { if (window.PelKitchen) return res(); const s = document.createElement('script'); s.src = 'js/kitchen3d.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
  const BASE = { shape: 'insel', a: 460, b: 300, c: 300, front: '#2b2c2e', finish: 'matt', worktop: 'eiche', handle: 'grifflos', tall: true, wallCab: true, hood: 'bora' };

  /* ---------- Planer-Teaser ---------- */
  const tz = $('[data-teaser3d]');
  if (tz) onView(tz, () => load3d().then(() => { $('.pt-load', tz).remove(); const k = PelKitchen(tz, { autoRotate: true }); const cfg = { ...BASE }; k.set(cfg);
    $$('.pt-sw button', tz).forEach(b => b.addEventListener('click', () => { $$('.pt-sw button', tz).forEach(x => x.classList.toggle('on', x === b)); cfg.front = b.dataset.c; k.set(cfg); })); }).catch(() => { $('.pt-load', tz).textContent = '3D-Vorschau nicht verfügbar – im Planer geht es trotzdem.'; }), '600px');

  /* ---------- Ablauf ---------- */
  const stp = $('[data-steps]');
  if (stp && hasG) { const lis = $$('li', stp); ScrollTrigger.create({ trigger: stp, start: 'top 75%', end: 'bottom 55%', scrub: true, onUpdate: s => { stp.style.setProperty('--p', s.progress); lis.forEach((l, i) => l.classList.toggle('on', s.progress >= i / lis.length + .02)); } }); }

  /* ---------- Marken ---------- */
  const mk = $('[data-mk]'); if (mk) mk.addEventListener('input', () => $$('.mk-c').forEach(c => c.classList.toggle('on', +c.dataset.i === +mk.value))); if (mk) $$('.mk-c').forEach(c => c.addEventListener('click', () => { mk.value = c.dataset.i; mk.dispatchEvent(new Event('input')); }));

  /* ---------- Termin ---------- */
  const tf = $('[data-termin]');
  if (tf) {
    const days = $('[data-days]', tf), list = []; const now = new Date(); for (let k = 1; list.length < 6 && k < 14; k++) { const d = new Date(now); d.setDate(now.getDate() + k); if (d.getDay() !== 0) list.push(d); }
    days.innerHTML = list.map((d, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-d="${d.toISOString().slice(0, 10)}"><span>${d.toLocaleDateString('de-DE', { weekday: 'short' })}</span><b>${d.getDate()}.</b><span>${d.toLocaleDateString('de-DE', { month: 'short' })}</span></button>`).join('');
    $$('button', days).forEach(b => b.addEventListener('click', () => $$('button', days).forEach(x => x.classList.toggle('on', x === b))));
    $$('[data-slot] button', tf).forEach(b => b.addEventListener('click', () => $$('[data-slot] button', tf).forEach(x => x.classList.toggle('on', x === b))));
    let via = 'mail'; $$('[data-via]', tf).forEach(b => b.addEventListener('click', () => via = b.dataset.via));
    tf.addEventListener('submit', e => { e.preventDefault(); const d = new Date($('[data-days] .on', tf).dataset.d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }); const slot = $('[data-slot] .on', tf).dataset.v, what = $('[data-what]', tf).value, name = $('[data-name]', tf).value.trim();
      const txt = `Hallo Herr Pellegrin,\n\nich würde gern einen Beratungstermin vereinbaren.\nWunschtermin: ${d}, ${slot}\nThema: ${what}\n\nViele Grüße\n${name || ''}`;
      if (via === 'wa') { window.open(WA + '?text=' + encodeURIComponent(txt), '_blank'); return; }
      const quelle = ($('[data-quelle]', tf) || {}).value || '', tel = ($('[data-tel]', tf) || {}).value || '', em = (($('[data-mail-in]', tf) || {}).value || '').trim(), ok = $('[data-ok]', tf), msg = $('[data-tm-msg]', tf), btn = $('[data-via="mail"]', tf);
      const mailto = () => { location.href = `mailto:${tf.dataset.mail || MAIL}?subject=${encodeURIComponent('Terminanfrage: ' + what)}&body=${encodeURIComponent(txt)}`; };
      if (!name || (!tel.trim() && !em)) { msg.textContent = 'Bitte Ihren Namen und eine Telefonnummer oder E-Mail-Adresse angeben – dann können wir den Termin bestätigen.'; return; }
      if (ok && !ok.checked) { msg.textContent = 'Bitte kurz bestätigen, dass wir Ihre Angaben für den Termin verwenden dürfen.'; ok.focus(); return; }
      if (!window.PelMail) { mailto(); return; }
      msg.textContent = ''; btn.disabled = true; btn.textContent = 'Wird gesendet …';
      window.PelMail.send({ art: 'termin', name, telefon: tel.trim(), email: em, wunsch: d + ', ' + slot, thema: what, quelle }).then(sent => {
        btn.disabled = false; btn.textContent = 'Termin anfragen';
        if (sent) { $('[data-tm-sent]', tf).hidden = false; $('[data-tm-sent]', tf).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } else mailto();
      }); });
  }

  /* =====================================================================
     PLANER
     ===================================================================== */
  /* ---------- Drohnenflug: Scroll steuert den Flug ---------- */
  const fly = $('[data-fly]');
  if (fly) {
    const cv = $('[data-fly-canvas]', fly), cx = cv.getContext('2d'), N = 130, imgs = [], bar = $('[data-fly-bar]', fly), steps = $$('.fl-steps li', fly);
    let loaded = 0, cur = -1, want = 0;
    const draw = i => { const im = imgs[i]; if (!im || !im.complete || !im.naturalWidth) return false; cx.drawImage(im, 0, 0, cv.width, cv.height); cur = i; return true; };
    const load = () => { for (let i = 0; i < N; i++) { const im = new Image(); im.decoding = 'async'; im.src = `img/fly/f${String(i + 1).padStart(3, '0')}.webp`; im.onload = () => { loaded++; if (i === 0 || i === want) draw(want); }; imgs[i] = im; } };
    onView(fly, load, '800px');
    const setP = p => { p = Math.max(0, Math.min(1, p)); want = Math.round(p * (N - 1)); if (want !== cur) { if (!draw(want)) { for (let k = want; k >= 0; k--) if (draw(k)) break; } } bar.style.transform = `scaleX(${p})`; steps.forEach((li, j) => { const a = +li.dataset.at, b = steps[j + 1] ? +steps[j + 1].dataset.at : 1.01; li.classList.toggle('on', p >= a && p < b); li.classList.toggle('done', p >= b); }); };
    if (hasG && !reduce) ScrollTrigger.create({ trigger: fly, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: st => setP(st.progress) });
    else { setP(.7); }
    setP(0);
  }

  /* ---------- Unterlagen senden ---------- */
  const ulf = $('[data-ulform]');
  if (ulf) {
    $$('[data-ul]').forEach(b => b.addEventListener('click', () => { $$('[data-ul]').forEach(x => x.classList.toggle('on', x === b)); $('[data-ul-val]').value = b.dataset.ul; $('[data-ul-title]').textContent = { 'Aufmaß / Grundriss': 'Aufmaß oder Grundriss schicken', 'Eigenes Projekt': 'Ihr eigenes Projekt schicken', 'Gegenangebot prüfen': 'Angebot kostenlos prüfen lassen', 'Fotos vom Raum': 'Fotos vom Raum schicken' }[b.dataset.ul]; }));
    const fi = $('[data-ul-files]'), drop = $('[data-drop]');
    fi.addEventListener('change', () => { $('[data-ul-list]').innerHTML = [...fi.files].map(f => `<li>${f.name} <em>${(f.size / 1e6).toFixed(1).replace('.', ',')} MB</em></li>`).join(''); });
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, () => drop.classList.add('over'))); ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
    ulf.addEventListener('submit', e => { let t = 0; for (const f of fi.files) t += f.size; if (t > 9.5e6) { e.preventDefault(); $('[data-ul-msg]').textContent = 'Zusammen über 10 MB – bitte weniger oder kleinere Dateien wählen, oder per WhatsApp schicken.'; return; } $('[name="_next"]', ulf).value = location.href.split('#')[0].split('?')[0] + '?gesendet=1#unterlagen'; });
    if (/[?&]gesendet=1/.test(location.search)) $('[data-ul-sent]').hidden = false;
  }

  /* Planer: siehe assets/planer.js */

  /* ---------- Anker ---------- */
  $$('a[href^="#"], a[href^="index.html#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href').replace('index.html', ''); if (page !== 'home' && a.getAttribute('href').startsWith('index.html')) return; const t = h.length > 1 && $(h); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -70 }) : t.scrollIntoView({ behavior: 'smooth' }); }));
  if (page === 'home' && location.hash && $(location.hash)) setTimeout(() => lenis ? lenis.scrollTo($(location.hash), { offset: -70, immediate: true }) : null, 600);


  const kmb = $('[data-kmore]');
  if (kmb) kmb.addEventListener('click', () => { const g = $('[data-kgrid]'); g.classList.add('all'); kmb.parentNode.hidden = true; $$('.kc', g).forEach((c, i) => { if (c.animate) c.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: Math.max(0, i - 6) * 40, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' }); }); hasG && ScrollTrigger.refresh(); });
  /* ---------- Martins Handschrift (Rohbau → Küche) ---------- */
  const hw = $('[data-hw]');
  if (hw) {
    const figs = $$('[data-hwf]', hw), steps = $$('[data-hws]', hw), dots = $$('.hw-dots li', hw), dEl = $('[data-hw-days]', hw), DAYS = [0, 10, 82, 87];
    let cur = -1, shown = 0;
    const set = i => { if (i === cur) return; cur = i; figs.forEach((f, j) => f.classList.toggle('on', j === i)); steps.forEach((s, j) => s.classList.toggle('on', j === i)); dots.forEach((d, j) => d.classList.toggle('on', j <= i));
      const from = shown, to = DAYS[i], t0 = performance.now(); const tick = t => { const k = Math.min(1, (t - t0) / 700); shown = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); dEl.textContent = shown; if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.hws); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s)); set(0);
  }
  if (hasG) { ScrollTrigger.refresh(); addEventListener('load', () => ScrollTrigger.refresh()); }
})();
