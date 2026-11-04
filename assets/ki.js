/* Ihre Küche in Ihrem Raum: Vorher/Nachher-Beispiele aus der Foto-Projektion + Stil-Chips */
(function () {
  'use strict';
  document.querySelectorAll('.ki').forEach(sec => {
    const ba = sec.querySelector('[data-ba]'), r = sec.querySelector('[data-ba-r]'), img = sec.querySelector('[data-ki-img]');
    if (ba && r) {
      const after = ba.querySelector('.ki-after'), knob = ba.querySelector('.ki-knob'), labL = ba.querySelector('.ki-lab.l'), labR = ba.querySelector('.ki-lab.r');
      [labL, labR].forEach(l => l && (l.style.transition = 'opacity .25s'));
      // Regler-Wert 0…100 → Schnittkante. Ränder hart einrasten (keine Rest-Streifen), Küche bei 100 % wirklich ausblenden
      const set = raw => {
        let v = Math.max(0, Math.min(100, +raw || 0)); if (v < 0.5) v = 0; if (v > 99.5) v = 100;
        ba.style.setProperty('--p', v + '%');
        if (after) after.style.visibility = v >= 100 ? 'hidden' : '';
        if (knob) knob.style.left = `clamp(24px, ${v}%, calc(100% - 24px))`; // Knopf bleibt immer ganz im Bild
        if (labL) labL.style.opacity = v < 14 ? 0 : 1;   // „Vorher“ nur, wenn auch Vorher zu sehen ist
        if (labR) labR.style.opacity = v > 86 ? 0 : 1;   // „Raum-Vorschau“ nur, wenn die Küche zu sehen ist
      };
      let auto = false, user = false;
      r.addEventListener('input', () => { if (!auto) user = true; set(r.value); });
      ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(t => r.addEventListener(t, () => { user = true; }, { passive: true }));
      set(r.value);
      // sanftes Einladen: einmal hin und her wischen, wenn sichtbar – bricht sofort ab, sobald jemand selbst zieht
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io.disconnect();
        if (user || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const start = +r.value || 52; let t0 = null;
        const step = t => {
          if (user) return; t0 = t0 || t; const k = (t - t0) / 2200;
          const v = k >= 1 ? start : start + Math.sin(k * Math.PI * 2) * 34;
          auto = true; r.value = v; set(v); auto = false;
          if (k < 1) requestAnimationFrame(step);
        };
        setTimeout(() => { if (!user) requestAnimationFrame(step); }, 400);
      }, { threshold: .5 }); io.observe(ba);
    }
    const pre = {}; sec.querySelectorAll('[data-ki]').forEach(b => { const src = img.src.replace(/[^/?]+\.webp(\?[^#]*)?$/, b.dataset.ki + '.webp$1'); pre[b.dataset.ki] = src; (new Image()).src = src;
      b.addEventListener('click', () => { sec.querySelectorAll('[data-ki]').forEach(x => x.classList.toggle('on', x === b)); img.animate ? img.animate([{ opacity: .2, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 500, easing: 'ease-out' }) : 0; img.src = src;
        const rad = sec.querySelector(`input[name="Stil"][value="${b.textContent}"]`); if (rad) rad.checked = true; const sm = sec.querySelector('[data-kidet] summary span'); if (sm) sm.textContent = '📷 Meinen Raum in „' + b.textContent + '“ zeigen'; }); });
    const f = sec.querySelector('[data-kiform]'); if (!f) return;
    f.addEventListener('submit', e => { const fi = f.querySelector('[data-files]'); let t = 0; for (const x of fi.files) t += x.size; if (t > 9.5e6) { e.preventDefault(); alert('Das Foto ist größer als 10 MB – bitte ein kleineres wählen.'); return; } f.querySelector('[name="_next"]').value = location.href.split('#')[0].split('?')[0] + '?vorschau=1#ki-vorschau'; });
    f.querySelector('[data-files]').addEventListener('change', e => { f.querySelector('[data-filelist]').innerHTML = [...e.target.files].map(x => `<li>${x.name} <em>${(x.size / 1e6).toFixed(1).replace('.', ',')} MB</em></li>`).join(''); });
    if (/[?&]vorschau=1/.test(location.search)) { const sn = sec.querySelector('[data-ki-sent]'); if (sn) sn.hidden = false; }
  });
})();
/* Arbeitshöhen-Rechner (mit „zu zweit") */
(function () {
  document.querySelectorAll('.ah').forEach(sec => {
    const $ = q => sec.querySelector(q), r = $('[data-ah]'), r2 = $('[data-ah2]'), two = $('[data-ah-two]'), S = 440 / 210;
    const y = cm => 440 - cm * S, ideal = K => Math.round(.63 * K - 15);
    function fig(g, K, hx, reach) {
      const top = y(K), h = K * S, sh = top + h * .18, hip = top + h * .52, el = y(reach + 15);
      g.querySelector('circle').setAttribute('cy', top + h * .065); g.querySelector('circle').setAttribute('r', h * .062);
      g.querySelector('path').setAttribute('d', `M${hx - h * .11} ${sh} Q${hx} ${sh - h * .03} ${hx + h * .11} ${sh} L${hx + h * .09} ${hip} L${hx + h * .07} 440 L${hx + h * .02} 440 L${hx} ${hip + h * .05} L${hx - h * .02} 440 L${hx - h * .07} 440 L${hx - h * .09} ${hip} Z M${hx + h * .1} ${sh + 6} L${hx + h * .14} ${el} L210 ${el - 4} L210 ${el + 8} L${hx + h * .12} ${el + 10} Z`);
    }
    function upd() {
      const K = +r.value, on = two.getAttribute('aria-pressed') === 'true', K2 = +r2.value, i1 = ideal(K), i2 = ideal(K2);
      const res = on ? Math.round((i1 + i2) / 2) : i1, diff = res - 86;
      $('[data-ah-k]').textContent = K + ' cm'; $('[data-ah-k2]').textContent = K2 + ' cm';
      $('[data-ah-ideal]').textContent = res;
      let msg;
      if (on && Math.abs(i1 - i2) >= 8) msg = `Zwischen Ihnen liegen ${Math.abs(i1 - i2)} cm Wunschhöhe. Der Profi-Trick: zwei Höhen planen, zum Beispiel Kochinsel auf ${Math.max(i1, i2)} cm, Spülzeile auf ${Math.min(i1, i2)} cm. Das kann kein Möbelhaus von der Stange.`;
      else if (on) msg = `Gute Nachricht: Sie liegen nah beieinander. ${res} cm passt Ihnen beiden – ${diff > 0 ? diff + ' cm höher' : diff < 0 ? -diff + ' cm niedriger' : 'genau so hoch'} als Standard.`;
      else msg = Math.abs(diff) <= 1 ? 'Die Standardhöhe passt Ihnen fast genau – Glückwunsch.' : diff > 0 ? `Eine Standardküche wäre für Sie ${diff} cm zu niedrig – das spüren Sie nach jedem Kochen im Kreuz. Spüle gern noch 5 cm höher, Kochfeld 5 cm tiefer.` : `Eine Standardküche wäre für Sie ${-diff} cm zu hoch. Wir planen sie niedriger – mit passendem Sockel.`;
      $('[data-ah-msg]').textContent = msg;
      $('[data-ah-std]').setAttribute('transform', `translate(0 ${y(86)})`);
      $('[data-ah-cnt]').setAttribute('transform', `translate(0 ${y(res)})`);
      $('[data-ah-lab]').textContent = 'Für ' + (on ? 'Sie beide' : 'Sie') + ': ' + res + ' cm'; $('[data-ah-body2]').setAttribute('height', res * S - 10);
      fig($('[data-ah-p]'), K, 120, res); const q = $('[data-ah-q]'); q.setAttribute('opacity', on ? .38 : 0); fig(q, K2, 58, res);
      const wa = $('[data-ah-wa]'); if (wa) wa.href = wa.href.split('?')[0] + '?text=' + encodeURIComponent(on ? `Hallo, wir kochen zu zweit (${K} und ${K2} cm groß). Laut Ihrem Rechner passen ${res} cm – können Sie uns dazu eine Küche planen?` : `Hallo, ich bin ${K} cm groß – laut Ihrem Rechner wäre ${res} cm meine ideale Arbeitshöhe. Können Sie mir dazu eine Küche planen?`);
      const pl = $('[data-ah-plan]'); if (pl) pl.href = 'planer.html?ah=' + res;
    }
    r.addEventListener('input', upd); r2.addEventListener('input', upd);
    two.addEventListener('click', () => { const on = two.getAttribute('aria-pressed') !== 'true'; two.setAttribute('aria-pressed', on); two.classList.toggle('on', on); $('[data-ah-r2]').hidden = !on; upd(); });
    upd();
  });
})();

/* Einheitliche Einblend-Animationen für die neuen Bausteine */
(function () {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sel = '.ki-txt>*, .ki-demo, .ah-txt>*, .ah-vis, .hw-head>*, .hw-proof li, .hw-quote, .hw-mosaic figure, .k-more';
  const els = [...document.querySelectorAll(sel)];
  els.forEach(el => { el.classList.add('rv'); const sib = [...el.parentNode.children].filter(x => x.matches(sel)); el.style.setProperty('--d', Math.min(sib.indexOf(el), 6) * 70 + 'ms'); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
})();

/* Lese-Fortschritt oben (nur Startseiten) */
(function () {
  if (document.documentElement.dataset.page === 'planer') return;
  const bar = document.createElement('div'); bar.className = 'kp-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  let raf = 0; const upd = () => { raf = 0; const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true }); upd();
})();
