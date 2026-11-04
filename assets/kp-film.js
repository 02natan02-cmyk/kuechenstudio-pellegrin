/* Willkommens-Film im Küchenplaner (28.10.): 6 kurze Szenen, ca. 22 s, Überspringen jederzeit.
   Läuft beim ersten Besuch von selbst, danach über „So geht's“ im Planer-Kopf. Kein Ton, keine Daten. */
(() => {
  const root = document.querySelector('[data-kp]'); if (!root) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = root.dataset.person || 'Ihr Küchenstudio', ST = (root.dataset.studio || '').split('·')[0].trim() || 'unserem Küchenstudio';
  const ERF = root.dataset.erf || 'mit viel Erfahrung', KEY = 'kp-film';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CAB = (x, y, w, h, cls, d) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" style="--d:${d}s"/>`;
  const S = [
    { t: 3.4, k: 'Willkommen', h: `Willkommen im Küchenplaner von ${esc(ST)}`, p: 'In vier Schritten zu Ihrer eigenen Küche – ganz ohne Vorkenntnisse.',
      svg: `<g class="iso">${[0, 1, 2, 3].map(i => `<path class="pop" style="--d:${.15 + i * .18}s" d="M${70 + i * 46} ${150 - i * 12}l40 -12v52l-40 12z"/><path class="pop top" style="--d:${.15 + i * .18}s" d="M${70 + i * 46} ${150 - i * 12}l40 -12l22 10l-40 12z"/>`).join('')}<path class="pop hood" style="--d:1s" d="M210 44h40l8 26h-56z"/><rect class="pop hood" style="--d:1s" x="224" y="20" width="12" height="24"/><circle class="spark" cx="268" cy="52" r="5" style="--d:1.3s"/></g>` },
    { t: 3.6, k: 'Schritt 1', h: 'Raum & Form', p: 'Form antippen, Maße einstellen, Fenster und Türen dazu.',
      svg: `<rect class="draw" x="60" y="34" width="200" height="150" rx="3" pathLength="1"/><path class="fillin" style="--d:1.1s" d="M60 34h200v34H96v116H60z"/><rect class="win" x="140" y="30" width="54" height="8" style="--d:1.4s"/><g class="dim" style="--d:1.7s"><path d="M60 200h200M60 195v10M260 195v10"/><text x="160" y="216">3,80 m</text></g><g class="dim" style="--d:1.9s"><path d="M278 34v150M273 34h10M273 184h10"/><text x="292" y="114" transform="rotate(90 292 114)">2,60 m</text></g>` },
    { t: 3.6, k: 'Schritt 2', h: 'Einrichten', p: 'Schränke und Geräte hineinziehen oder antippen – alles lässt sich verschieben.',
      svg: `<path class="wall" d="M30 190h260"/><rect class="ctr" x="34" y="120" width="252" height="6" style="--d:1.2s"/>${[0, 1, 2, 3, 4].map(i => CAB(36 + i * 50, 126, 46, 62, 'drop', .1 + i * .16)).join('')}${[0, 1, 3, 4].map(i => CAB(36 + i * 50, 40, 46, 44, 'drop up', .9 + i * .1)).join('')}<g class="hand"><circle cx="0" cy="0" r="11"/><circle cx="0" cy="0" r="20" class="ring"/></g>` },
    { t: 3.6, k: 'Schritt 3', h: 'Design', p: 'Farbe, Griffe, Arbeitsplatte und Boden wählen. Jede Farbe ist möglich.',
      svg: `<path class="wall" d="M30 190h260"/><rect class="ctr tint2" x="34" y="120" width="252" height="6"/>${[0, 1, 2, 3, 4].map(i => CAB(36 + i * 50, 126, 46, 62, 'tint', 0) + `<rect class="hdl" x="${49 + i * 50}" y="134" width="20" height="3" rx="1.5" style="--d:${1 + i * .08}s"/>`).join('')}${[0, 1, 3, 4].map(i => CAB(36 + i * 50, 40, 46, 44, 'tint', 0)).join('')}<g class="sw">${['#f1eee8', '#7f8e77', '#e7a6bb', '#22304a', '#c39a6b'].map((c, i) => `<circle cx="${100 + i * 30}" cy="212" r="9" fill="${c}" style="--d:${i * .55}s"/>`).join('')}</g>` },
    { t: 3.6, k: 'Schritt 4', h: 'Ihre Pläne', p: 'Grundriss, Wandansichten und Installationsplan – fertig zum Herunterladen.',
      svg: `${[['Grundriss', -14], ['Wände', 0], ['Installation', 14]].map(([n, r], i) => `<g class="sheet" style="--r:${r}deg;--x:${(i - 1) * 92}px;--d:${.15 + i * .2}s"><rect x="-44" y="-62" width="88" height="124" rx="4"/><path d="M-30 -40h60M-30 -28h44M-30 -16h52M-30 8h60v34h-60z"/><text x="0" y="56">${n}</text></g>`).join('')}<g class="dl"><circle cx="298" cy="44" r="18"/><path d="M298 33v20M290 46l8 8l8-8M289 58h18"/></g>` },
    { t: 5.2, k: 'Zum Schluss', h: `Anfrage an ${esc(P)}`, p: `${esc(P)} schaut sich Ihre Planung persönlich an – ${esc(ERF)}: Was lässt sich verbessern, welche Möglichkeiten gibt es noch?`,
      svg: `<path class="trail" d="M40 170C110 60 190 200 250 92" pathLength="1"/><g class="plane"><path d="M0 0l26 10l-26 10l6-10z"/></g><g class="studio"><path d="M226 120l28-24l28 24v52h-56z"/><rect x="246" y="146" width="16" height="26"/></g><g class="ok"><circle cx="292" cy="96" r="14"/><path d="M285 96l5 5l9-10"/></g>` },
  ];
  const TOT = S.reduce((a, s) => a + s.t, 0);
  let el = null, i = 0, tm = 0, t0 = 0, left = 0, paused = false, last = null;
  function build() {
    el = document.createElement('div'); el.className = 'kpfm'; el.setAttribute('role', 'dialog'); el.tabIndex = -1; el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `So geht's – der Küchenplaner in ${Math.round(TOT)} Sekunden`);
    el.innerHTML = `<div class="kpfm-bar">${S.map(() => '<i><b></b></i>').join('')}</div>
<button type="button" class="kpfm-skip" data-fm-skip>Überspringen</button>
<div class="kpfm-stage">${S.map((s, j) => `<section class="kpfm-s" data-s="${j}" aria-hidden="true"><svg viewBox="0 0 320 230" aria-hidden="true">${s.svg}</svg><p class="kpfm-k">${s.k}</p><h2>${s.h}</h2><p class="kpfm-p">${s.p}</p></section>`).join('')}</div>
<div class="kpfm-nav"><button type="button" data-fm-prev aria-label="Zurück">‹</button><button type="button" class="kpfm-go" data-fm-go>Weiter</button><button type="button" data-fm-next aria-label="Weiter">›</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => {
      if (e.target.closest('[data-fm-skip]')) return close();
      if (e.target.closest('[data-fm-prev]')) return show(Math.max(0, i - 1));
      if (e.target.closest('[data-fm-next],[data-fm-go]')) return i >= S.length - 1 ? close() : show(i + 1);
      if (e.target.closest('.kpfm-stage')) { const r = el.getBoundingClientRect(); return e.clientX < r.width * .3 ? show(Math.max(0, i - 1)) : (i >= S.length - 1 ? close() : show(i + 1)); }
    });
    // gedrückt halten = Pause (wie bei Stories)
    el.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; paused = true; left = Math.max(0, left - (performance.now() - t0)); clearTimeout(tm); el.classList.add('paused'); });
    const go = () => { if (!paused) return; paused = false; el.classList.remove('paused'); t0 = performance.now(); tm = setTimeout(() => i >= S.length - 1 ? 0 : show(i + 1), left); };
    el.addEventListener('pointerup', go); el.addEventListener('pointercancel', go);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'ArrowRight') show(Math.min(S.length - 1, i + 1)); else if (e.key === 'ArrowLeft') show(Math.max(0, i - 1)); });
  }
  function show(j) {
    i = j; clearTimeout(tm);
    el.querySelectorAll('.kpfm-s').forEach((s, k) => { s.classList.toggle('on', k === j); s.setAttribute('aria-hidden', k !== j); });
    el.querySelectorAll('.kpfm-bar i').forEach((b, k) => { b.className = k < j ? 'done' : k === j ? 'now' : ''; b.style.setProperty('--t', S[k].t + 's'); });
    const g = el.querySelector('[data-fm-go]'); g.textContent = j >= S.length - 1 ? 'Jetzt loslegen' : 'Weiter'; el.classList.toggle('end', j >= S.length - 1);
    if (RM) return; left = S[j].t * 1000; t0 = performance.now(); if (j < S.length - 1) tm = setTimeout(() => show(j + 1), left);
  }
  function open() {
    if (el) return; last = document.activeElement; build(); document.documentElement.classList.add('kpfm-on');
    requestAnimationFrame(() => { el.classList.add('in'); show(0); el.focus({ preventScroll: true }); });
  }
  function close() {
    if (!el) return; clearTimeout(tm); try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { }
    const e0 = el; el = null; e0.classList.remove('in'); document.documentElement.classList.remove('kpfm-on'); setTimeout(() => e0.remove(), RM ? 0 : 360);
    if (last && last.focus) try { last.focus({ preventScroll: true }); } catch (e) { }
  }
  // Knopf „So geht's“ im Planer-Kopf
  const hr = root.querySelector('.kp-hr');
  if (hr) { const b = document.createElement('button'); b.type = 'button'; b.className = 'kp-film-b'; b.setAttribute('aria-label', "So geht's – kurzer Film"); b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.2 6.6l5 3.4-5 3.4z" fill="currentColor"/></svg><span>So geht\'s</span>'; b.addEventListener('click', open); hr.insertBefore(b, hr.firstChild); }
  window.KPFilm = { open, close };
  // Erster Besuch: von selbst – nicht bei einem geteilten Plan im Link, nach dem Absenden, mit ?nointro oder ?foto
  let seen = null; try { seen = localStorage.getItem(KEY); } catch (e) { seen = '1'; }
  const q = location.search;
  if (!seen && !root.dataset.hash0 && !/[?&](nointro|gesendet|foto)=?/.test(q)) setTimeout(open, 600);
})();
