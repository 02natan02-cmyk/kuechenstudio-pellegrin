/* Ihre Küche in Ihrem Raum – eigenes Raumfoto, geplante Küche perspektivisch hinein, Vorher/Nachher · Entwurf Falcon Eye
   Läuft komplett im Browser: kein Server, kein Schlüssel. Das Foto verlässt das Gerät erst, wenn man es selbst mitschickt.
   Neu seit 17.10.: einfacher und automatischer – das soll jeder sofort verstehen.
   Ablauf:
   1. Foto wählen → der Raum wird automatisch vermessen (kp-raum.js: Boden, Wände, Brennweite) – mit Such-Animation.
   2. Die geplante Küche steht sofort an ihrem Platz. Mit einem Finger verschieben, mit zwei Fingern drehen und skalieren
      (PC: ziehen, ↻-Griff oder Umschalt + ziehen, Mausrad). An den Wänden rastet sie ein (mit kurzer Vibration am Handy).
   3. „Vorher / Nachher“: Regler direkt im Bild – ganz rechts ist die Küche wirklich weg.
   4. „Boden anpassen“ (nur falls nötig): vier vorbelegte Punkte, Bodenraster und Lupe zeigen sofort, ob es passt.
   Welche Wand hinten im Foto ist, wird geschätzt (Tür, Küche, Wandlänge) und im Mini-Grundriss mit einem Tipp geändert.
   Ausrichtung: 1 + 2 = hintere Ecken am Boden (Wandlänge aus dem Plan gibt den Maßstab), 3 + 4 = Punkte auf den
   Bodenkanten der Seitenwände (geben die Richtung in den Raum). */
(function () {
  'use strict';
  const KP = window.KP; if (!KP || window.KPF) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, TOUCH = matchMedia('(pointer: coarse)').matches;
  const LENS = [[13, '0,5×', 'Ultraweit'], [26, '1×', 'Standard'], [52, '2×', 'Zoom']];
  const PI = Math.PI, H90 = PI / 2;
  // Beispielfoto (Raum ca. 2,70 × 4 m) mit passender Beispielküche an der rechten Wand – die eigene Planung erscheint im eigenen Foto
  const SAMPLE = { src: 'img/ki/vorher.webp', pts: [[.189, .628], [.534, .574], [.812, .828], [.151, .958]], mm: 26, face: 'W',
    plan: { f: 'zeile', r: { w: 400, d: 270 }, rw: { N: [['kue', 60], ['bo', 60], ['kf', 80], ['s2', 60], ['sp', 80], ['gs', 60]] }, tp: { N: 1 }, op: [['fenster', 'W', 75, 120], ['tuer', 'S', 20, 90]], is: { w: 180, v: 'kochfeld' }, s: { front: '#f1eee8', wood: null, handle: 'grifflos', top: 'eiche', finish: 'matt', wall: '#f3efe9', floor: 'eiche' }, ah: 90 } };
  const DEF_PTS = [[.3, .58], [.7, .58], [.94, .9], [.06, .9]];
  // Freie Platzierung (ohne Bodenpunkte): angenommener Boden aus dem Regler „Blickwinkel“ (0 = gerade, 1 = von oben)
  const freePts = t => { const y = .5 + .14 * t, w = .2 + .07 * t; return [[.5 - w, y], [.5 + w, y], [.97, .93], [.03, .93]]; };
  const PN = ['hinten links', 'hinten rechts', 'vorne rechts', 'vorne links'];
  const WN = { N: 'Rückwand', E: 'rechte Wand', S: 'vordere Wand', W: 'linke Wand' };   // Namen wie im Grundriss des Planers
  // kleine Vektorrechnung
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
  const sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const nrm = a => sc(a, 1 / (len(a) || 1)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (v, d = 2) => v.toFixed(d).replace('.', ',');
  const ease = k => 1 - Math.pow(1 - k, 3), springy = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const buzz = ms => { try { if (TOUCH && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };

  let demo = null; const room = () => demo ? demo.room : KP.room(), st3 = () => demo ? demo.state : KP.state3d();
  let el, stage, fit, img, host, ov, loupe, K = null, ph = null, pts = null, face = 'N', faceManual = false, mm = 26, mmSrc = 'std', rig = { x: 0, z: 0, ry: 0, s: 1 }, expo = 1;
  let free = false, tilt = .45, mode = 'view', cmpOn = false, cmp = 50, pose = null, backEl = null, shareOk = false, det = null, fp = null, snapW = new Set(), dragUI = false, flashT = 0, anim = 0, light = null, noRoom = false;

  /* ---------------- Oberfläche ---------------- */
  const ICO = {
    x: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cam: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6.5h3l1.4-2h5.2l1.4 2h3v9.5H3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="11" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    img: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 14l4-4 3 3 2-2 3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="13" cy="7.5" r="1.4" fill="currentColor"/></svg>',
    rot: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 9.5A5.5 5.5 0 1 1 13 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12 2.5l1.5 2.8-2.9 1.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    home: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 9.5L10 4l6.5 5.5M5.5 8v8h9V8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    cmp: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.5v15" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 13.5l2.5-3 2 2" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    pts: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 16L7 7h6l4 9z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="7" cy="7" r="1.8" fill="currentColor"/><circle cx="13" cy="7" r="1.8" fill="currentColor"/><circle cx="17" cy="16" r="1.8" fill="currentColor"/><circle cx="3" cy="16" r="1.8" fill="currentColor"/></svg>',
    ok: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mag: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12.5 12.5L17 17" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  };
  const ILL = `<svg class="kpf-ill" viewBox="0 0 260 150" aria-hidden="true"><path d="M20 140L84 70h92l64 70" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/><path d="M84 70V14M176 70V14" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/><rect x="104" y="26" width="52" height="30" rx="2" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><g class="kpf-ill-k"><path d="M92 70h76V48H92z" fill="var(--kpf-acc)" fill-opacity=".9"/><path d="M90 48h80" stroke="#fff" stroke-opacity=".75" stroke-width="2.4"/><path d="M111 52v14M130 52v14M149 52v14" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/></g><path class="kpf-ill-s" d="M26 104h208" stroke="var(--kpf-acc)" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  function buildDom() {
    el = document.createElement('div'); el.className = 'kpf'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kpf-t');
    el.style.setProperty('--kpf-acc', KP.acc);
    const gest = TOUCH ? '<b>1 Finger</b> verschieben · <b>2 Finger</b> drehen' : '<b>Ziehen</b> verschiebt · <b>↻</b> dreht · <b>Mausrad</b> = Größe';
    el.innerHTML = `
<div class="kpf-top"><div class="kpf-tt"><b id="kpf-t">Ihre Küche in Ihrem Raum</b><span>Ihr Foto bleibt auf Ihrem Gerät.</span></div><button type="button" class="kpf-x" data-x aria-label="Schließen">${ICO.x}</button></div>
<div class="kpf-body">
  <div class="kpf-stage" data-stage>
    <div class="kpf-empty" data-empty>
      ${ILL}
      <h2>Ein Foto von Ihrem Raum – <em>den Rest mache ich.</em></h2>
      <p>Stellen Sie sich in die Tür und fotografieren Sie quer. Wichtig ist nur, dass man unten sieht, wo Wand und Boden zusammenstoßen. Ich erkenne den Raum und stelle Ihre Küche hinein.</p>
      <div class="kpf-up"><label class="btn btn-copper kpf-file">${ICO.cam}<span>Foto aufnehmen</span><input type="file" accept="image/*" capture="environment" data-file></label><label class="btn kpf-file kpf-file2">${ICO.img}<span>Foto auswählen</span><input type="file" accept="image/*,.heic,.heif" data-file></label></div>
      <button type="button" class="kpf-link" data-sample>Erst mal mit einem Beispielfoto ausprobieren</button>
      <p class="kpf-small" data-drophint>Sie können ein Foto auch einfach hierher ziehen.</p>
      <p class="kpf-err" data-err role="alert" hidden></p>
    </div>
    <div class="kpf-fit" data-fit hidden>
      <img data-photo alt="Ihr Raumfoto" draggable="false">
      <div class="kpf-3d" data-3d></div>
      <svg class="kpf-ov" data-ov viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="kpf-scan" data-scan hidden aria-hidden="true"><i></i></div>
      <div class="kpf-cmp" data-cmpl hidden><i></i><span class="l">Vorher</span><span class="r">Nachher</span><b class="kpf-knob" data-knob tabindex="0" role="slider" aria-label="Vorher und Nachher vergleichen – Pfeiltasten" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></b></div>
      ${PN.map((n, i) => `<button type="button" class="kpf-hd" data-h="${i}" aria-label="Punkt ${i + 1}: ${n} am Boden – mit den Pfeiltasten verschieben" hidden><i>${i + 1}</i></button>`).join('')}
      <button type="button" class="kpf-rot" data-rot hidden aria-label="Küche drehen – ziehen, oder antippen für 90°">${ICO.rot}</button>
      <span class="kpf-wl" data-wl hidden></span>
      <div class="kpf-chip" data-chip hidden role="status" aria-live="polite"></div>
      <p class="kpf-gest" data-gest hidden>${gest}</p>
      <div class="kpf-loupe" data-loupe hidden><i></i></div>
      <div class="kpf-msg" data-msg hidden role="alert"></div>
      <p class="kpf-scant" data-scant hidden><i></i><span>Ich suche Boden und Wände …</span></p>
    </div>
    <p class="kpf-busy" data-busy hidden><i></i>Foto wird vorbereitet …</p>
  </div>
  <aside class="kpf-side" data-side hidden>
    <section class="kpf-pane" data-pane="view">
      <p class="kpf-lead" data-lead></p>
      <div class="kpf-tools" role="group" aria-label="Werkzeuge">
        <button type="button" class="kpf-tool" data-act="rot">${ICO.rot}<span>Drehen</span></button>
        <button type="button" class="kpf-tool" data-act="home">${ICO.home}<span>An den Platz</span></button>
        <button type="button" class="kpf-tool" data-act="cmp" aria-pressed="false">${ICO.cmp}<span>Vorher / Nachher</span></button>
        <button type="button" class="kpf-tool" data-act="align">${ICO.pts}<span>Feinjustieren</span></button>
      </div>
      <div class="kpf-wall">
        <p class="kpf-wq">Welche Wand sehen Sie <b>hinten</b> im Foto? <span>Antippen zum Ändern.</span></p>
        <div class="kpf-plan"><svg data-plan viewBox="0 0 220 170" role="group" aria-label="Grundriss – Wand wählen"></svg></div>
        <p class="kpf-wsel" data-wsel></p>
      </div>
      <p class="kpf-sn" data-samplenote hidden>Beispielfoto mit einer Beispielküche an der rechten Wand. Mit Ihrem eigenen Foto erscheint dort Ihre eigene Planung.</p>
      <div class="kpf-free" data-freebox hidden>
        <label class="kpf-rg"><span>Blickwinkel</span><output data-o="tl"></output><input type="range" min="0" max="100" step="1" data-r="tl" aria-label="Blickwinkel: gerade bis von oben"></label>
        <label class="kpf-rg"><span>Größe</span><output data-o="sz"></output><input type="range" min="30" max="260" step="1" data-r="sz" aria-label="Größe der Küche im Foto"></label>
      </div>
      <label class="kpf-rg"><span>Helligkeit der Küche</span><output data-o="ex"></output><input type="range" min="60" max="150" step="1" data-r="ex"></label>
    </section>
    <section class="kpf-pane" data-pane="align" hidden>
      <p class="kpf-lead">Ziehen Sie die vier Punkte auf den <b>Boden</b> – das Raster zeigt sofort, ob es passt:</p>
      <ol class="kpf-ol"><li><span>1</span><span>2</span><p>in die <b>hinteren Ecken</b>, genau dort, wo Wand und Boden zusammenstoßen.</p></li><li><span>3</span><span>4</span><p>weiter vorn auf die <b>Bodenkante der Seitenwände</b> – wie weit vorn, ist egal.</p></li></ol>
      <div class="kpf-lens"><span>Mit welchem Objektiv fotografiert?</span><div class="kpf-seg" data-lens>${LENS.map(([v, n, d]) => `<button type="button" data-mm="${v}"><b>${n}</b><small>${d}</small></button>`).join('')}</div><small data-mmsrc></small></div>
      <label class="kpf-rg"><span>Brennweite</span><output data-o="mm"></output><input type="range" min="12" max="80" step="1" data-r="mm"></label>
      <p class="kpf-ok" data-hint aria-live="polite"></p>
      <div class="kpf-row"><button type="button" class="kpf-b" data-auto>${ICO.mag}<span>Automatisch erkennen</span></button><button type="button" class="kpf-b" data-reset>Zurücksetzen</button></div>
      <button type="button" class="kpf-b kpf-go" data-done>${ICO.ok}<span>Fertig – Küche ansehen</span></button>
    </section>
    <div class="kpf-acts">
      <button type="button" class="btn btn-copper kpf-send" data-attach>Mit meiner Anfrage senden</button>
      <label class="btn btn-copper kpf-send kpf-file" data-own hidden>${ICO.cam}<span>Jetzt mit eigenem Foto</span><input type="file" accept="image/*,.heic,.heif" data-file></label>
      <div class="kpf-row"><button type="button" class="kpf-b" data-save>Bild speichern</button><button type="button" class="kpf-b" data-share hidden>Teilen …</button><button type="button" class="kpf-b" data-again>Anderes Foto</button></div>
      <p class="kpf-note">Darstellung zur Orientierung – Maße, Geräte und Details plant ${KP.person} mit Ihnen millimetergenau.</p>
    </div>
  </aside>
</div>`;
    document.body.appendChild(el);
    stage = $('[data-stage]', el); fit = $('[data-fit]', el); img = $('[data-photo]', el); host = $('[data-3d]', el); ov = $('[data-ov]', el); loupe = $('[data-loupe]', el);
    $('[data-x]', el).addEventListener('click', close);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); if (mode === 'align' && ph && pose) { setMode('view'); return; } close(); } if (e.key === 'Tab') trap(e); });
    $$('[data-file]', el).forEach(i => i.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; loadFile(f); }));
    $('[data-sample]', el).addEventListener('click', loadSample);
    ['dragenter', 'dragover'].forEach(t => stage.addEventListener(t, e => { if (ph && !$('[data-empty]', el).offsetParent) return; e.preventDefault(); stage.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => stage.addEventListener(t, () => stage.classList.remove('over')));
    stage.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (!f) return; e.preventDefault(); loadFile(f); });
    $$('[data-act]', el).forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
    $('[data-done]', el).addEventListener('click', () => { free = false; if (!pose) { flash('Die Punkte passen so noch nicht zusammen – bitte 1 und 2 in die hinteren Ecken ziehen.'); return; } noRoom = false; hideMsg(); setMode('view'); });
    $('[data-auto]', el).addEventListener('click', () => { if (ph && !ph.sample) analyse(true); else if (ph) { pts = SAMPLE.pts.map(p => p.slice()); update(); } });
    $('[data-reset]', el).addEventListener('click', () => { pts = (ph && ph.sample ? SAMPLE.pts : det && det.pts0 ? det.pts0 : DEF_PTS).map(p => p.slice()); update(); });
    $$('[data-mm]', el).forEach(b => b.addEventListener('click', () => { mm = +b.dataset.mm; mmSrc = 'user'; update(); }));
    $$('[data-r]', el).forEach(r => r.addEventListener('input', () => { const k = r.dataset.r, v = +r.value; if (k === 'mm') { mm = v; mmSrc = 'user'; } if (k === 'ex') { expo = v / 100; K && K.exposure(expo); } if (k === 'tl') { tilt = v / 100; pts = freePts(tilt); } if (k === 'sz') { rig = { ...rig, s: v / 100 }; } update(); }));
    $('[data-save]', el).addEventListener('click', save);
    $('[data-share]', el).addEventListener('click', share);
    $('[data-again]', el).addEventListener('click', () => showEmpty());
    $('[data-attach]', el).addEventListener('click', attach);
    $$('[data-h]', el).forEach(bindHandle);
    bindStage(); bindCmp(); bindRot();
    new ResizeObserver(() => layout()).observe(stage);
    if (!TOUCH) { const lb = $$('.kpf-up .kpf-file', el); lb[0].hidden = true; lb[1].classList.add('btn-copper'); lb[1].classList.remove('kpf-file2'); }
    try { const f = new File([new Uint8Array(1)], 't.jpg', { type: 'image/jpeg' }); shareOk = !!(navigator.canShare && navigator.canShare({ files: [f] })); } catch (e) { shareOk = false; }
    $('[data-share]', el).hidden = !shareOk;
  }
  function trap(e) { const f = $$('button:not([hidden]):not([disabled]), input:not([hidden]):not([type="file"]), select, [tabindex="0"]', el).filter(x => x.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }

  /* ---------------- Öffnen / Schließen ---------------- */
  function open(o = {}) {
    if (!el) buildDom();
    backEl = document.activeElement; el.hidden = false; document.documentElement.classList.add('kpf-on'); KP.pause3d(true);
    if (K) { if (K.lost && K.lost()) { try { K.dispose(); } catch (e) { } K = null; host.innerHTML = ''; if (ph) { K = window.PelPlanner3D(host, { photo: true }); K.exposure(expo); } } if (K) { K.pause(false); K.set(st3()); fp = K.footprint ? K.footprint() : null; } }
    if (o.sample) loadSample(); else if (!ph) showEmpty(); else { showFit(); update(); }
    requestAnimationFrame(() => { const x = $('[data-x]', el); x && x.focus({ preventScroll: true }); });
    loadRaum().catch(() => { });   // Raumerkennung schon mal laden
  }
  function close() {
    if (!el || el.hidden) return; el.hidden = true; document.documentElement.classList.remove('kpf-on'); KP.pause3d(false); if (K) K.pause(true);
    cancelAnimationFrame(anim); anim = 0; anTok++;
    if (backEl && backEl.focus) try { backEl.focus({ preventScroll: true }); } catch (e) { }
  }
  function showEmpty() { anTok++; $('[data-empty]', el).hidden = false; fit.hidden = true; $('[data-side]', el).hidden = true; $('[data-err]', el).hidden = true; stage.style.height = ''; el.classList.add('empty'); }
  function showFit() { $('[data-empty]', el).hidden = true; fit.hidden = false; $('[data-side]', el).hidden = false; el.classList.remove('empty'); layout(); }
  function busy(on) { $('[data-busy]', el).hidden = !on; }
  function err(msg) { const e = $('[data-err]', el); e.textContent = msg; e.hidden = false; busy(false); showEmpty(); e.hidden = false; }

  /* ---------------- Raumerkennung laden ---------------- */
  let rp = null;
  function loadRaum() {
    if (window.KPRaum) return Promise.resolve(window.KPRaum); if (rp) return rp;
    const v = (($$('script').find(s => /kp-foto\.js/.test(s.src)) || {}).src || '').split('v=')[1] || '1';
    return rp = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/kp-raum.js?v=' + v; s.onload = () => window.KPRaum ? res(window.KPRaum) : rej(new Error('raum')); s.onerror = () => { rp = null; rej(new Error('raum-load')); }; document.head.appendChild(s); });
  }

  /* ---------------- Foto laden ---------------- */
  async function exifMM(file) {
    try {
      const buf = await file.slice(0, 262144).arrayBuffer(), v = new DataView(buf); if (v.byteLength < 12 || v.getUint16(0) !== 0xFFD8) return null;
      let o = 2;
      while (o + 10 < v.byteLength) {
        const mk = v.getUint16(o), ln = v.getUint16(o + 2); if ((mk & 0xFF00) !== 0xFF00) break;
        if (mk === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
          const t = o + 10, le = v.getUint16(t) === 0x4949, g16 = p => v.getUint16(t + p, le), g32 = p => v.getUint32(t + p, le);
          const find = (p, tag) => { const n = g16(p); for (let i = 0; i < n; i++) { const e = p + 2 + i * 12; if (g16(e) === tag) return e; } return null; };
          const e0 = find(g32(4), 0x8769); if (e0 == null) return null; const e1 = find(g32(e0 + 8), 0xA405); if (e1 == null) return null;
          const val = g16(e1 + 8); return val >= 10 && val <= 300 ? val : null;
        }
        o += 2 + ln;
      }
    } catch (e) { }
    return null;
  }
  async function loadFile(f) {
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(f.name)) { err('Das ist leider kein Foto. Bitte ein Bild wählen (JPG, PNG, WebP oder HEIC).'); return; }
    busy(true);
    const exif = await exifMM(f);
    let bmp = null;
    try { bmp = await createImageBitmap(f, { imageOrientation: 'from-image' }); }
    catch (e) { try { bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(f); }); } catch (e2) { bmp = null; } }
    if (!bmp || !bmp.width) { err('Dieses Foto kann Ihr Browser nicht öffnen. Speichern Sie es bitte als JPG – oder wählen Sie ein anderes.'); return; }
    setPhoto(bmp, { mm: exif, name: f.name });
  }
  function loadSample() {
    if (!el) buildDom(); busy(true);
    const im = new Image(); im.onload = () => setPhoto(im, { sample: 1, mm: SAMPLE.mm, pts: SAMPLE.pts, face: SAMPLE.face }); im.onerror = () => err('Das Beispielfoto konnte nicht geladen werden.'); im.src = SAMPLE.src;
  }
  function setPhoto(src, o) {
    const W0 = src.naturalWidth || src.width, H0 = src.naturalHeight || src.height, r = Math.min(1, 2400 / Math.max(W0, H0));
    const c = document.createElement('canvas'); c.width = Math.round(W0 * r); c.height = Math.round(H0 * r); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    if (src.close) try { src.close(); } catch (e) { }
    light = photoLight(c);
    ph = { cv: c, w: c.width, h: c.height, sample: !!o.sample, mm: o.mm || null, expo: light.expo };
    img.src = c.toDataURL('image/jpeg', .9);
    loupe.style.backgroundImage = `url("${img.src}")`;
    free = false; tilt = .45; mm = o.mm || 26; mmSrc = o.sample ? 'sample' : o.mm ? 'exif' : 'std'; rig = { x: 0, z: 0, ry: 0, s: 1 }; expo = ph.expo; cmp = 50; cmpOn = false; snapW = new Set(); det = null; faceManual = false; pose = null;
    pts = (o.pts || DEF_PTS).map(p => p.slice()); if (o.face) face = o.face;
    busy(false); hideChip(); hideHint(); hideMsg(); noRoom = false; showFit();
    demo = o.sample ? KP.stateOf(SAMPLE.plan) : null;
    if (K && K.lost && K.lost()) { try { K.dispose(); } catch (e) { } K = null; host.innerHTML = ''; }
    if (!K) K = window.PelPlanner3D(host, { photo: true }); K.set(st3());
    fp = K.footprint ? K.footprint() : null;
    K.pause(false); K.exposure(expo); K.openAll(false);
    mode = 'view';
    if (o.sample) { pts = SAMPLE.pts.map(p => p.slice()); face = SAMPLE.face; det = { kind: 'ok', conf: 1, sample: true }; place(true); return; }
    pts = DEF_PTS.map(p => p.slice()); face = guessFace(null);
    analyse(false);
  }

  /* ---------------- Automatisch vermessen ---------------- */
  let anTok = 0;
  async function analyse(manual) {
    const tok = ++anTok; mode = 'view'; hideMsg(); hideChip(); hideHint(); cmpOn = false; noRoom = false; host.classList.add('kpf-hide');
    const scan = $('[data-scan]', el), st = $('[data-scant]', el); scan.hidden = false; st.hidden = false; scan.classList.remove('done'); void scan.offsetWidth; scan.classList.add('on'); ov.innerHTML = ''; syncUI();
    const t0 = performance.now(); let r = null;
    try {
      const R = await loadRaum(), rm = room(), walls = [rm.w / 100, rm.d / 100];
      r = await R.detect(ph.cv, { mm: ph.mm || undefined, walls, wallW: faceLen(face), max: 900 });
    } catch (e) { r = null; }
    // die Such-Animation läuft mindestens kurz (sonst wirkt es wie ein Flackern)
    const rest = (RM ? 0 : 1300) - (performance.now() - t0); if (rest > 0) await new Promise(res => setTimeout(res, rest));
    if (tok !== anTok || !ph) return;
    det = r || { kind: 'none', conf: 0 };
    const good = r && r.ok && (r.kind === 'ok' || r.kind === 'check');
    if (good) {
      if (!ph.mm && r.mm) { mm = clamp(r.mm, 12, 80); mmSrc = 'auto'; }
      if (!faceManual) face = guessFace(r);
      pts = ptsFor(r, face); det.pts0 = pts.map(p => p.slice());
      await revealLines(r, tok);
      if (tok !== anTok) return;
      if (manual && mode === 'align') { host.classList.remove('kpf-hide'); update(); chip(`${ICO.ok}<span>Punkte neu gesetzt</span>`, 2200); return; }
      place(false);
    } else {
      endScan(); host.classList.remove('kpf-hide');
      if (det.kind === 'outdoor') { update(); showMsg('outdoor'); return; }
      goFree(true);
    }
  }
  function endScan() { const scan = $('[data-scan]', el); scan.classList.add('done'); setTimeout(() => { scan.hidden = true; scan.classList.remove('on', 'done'); }, RM ? 0 : 450); $('[data-scant]', el).hidden = true; }
  // erkannte Bodenkanten zeichnen sich auf, dann gehen sie ins Bodenraster über
  function revealLines(r, tok) {
    return new Promise(res => {
      const L = r.lines || {}, segs = [];
      ['L', 'R', 'B'].forEach(k => (L[k] || []).forEach(s => segs.push(s)));
      const q = (pts || r.pts).map(([x, y]) => [(x * 1000).toFixed(1), (y * 1000).toFixed(1)]);
      let s = '<g class="kpf-det">';
      segs.forEach((g, i) => { s += `<line x1="${g[0] * 1000}" y1="${g[1] * 1000}" x2="${g[2] * 1000}" y2="${g[3] * 1000}" style="animation-delay:${i * 45}ms" vector-effect="non-scaling-stroke"/>`; });
      s += `<path class="kpf-detq" d="M${q[0]} L${q[1]} L${q[2]} L${q[3]} Z" vector-effect="non-scaling-stroke"/></g>`;
      ov.innerHTML = s; endScan();
      setTimeout(() => res(), tok !== anTok || RM ? 0 : 950);
    });
  }
  // Küche erscheint: Raster blitzt auf, Küche „landet“ mit leichter Federung
  function place(sample) {
    hideMsg(); noRoom = false; host.classList.remove('kpf-hide'); rig = { x: 0, z: 0, ry: 0, s: 1 }; snapW = new Set(); mode = 'view';
    update();
    if (!pose) { goFree(true); return; }
    const k = det && det.kind === 'check' ? 'check' : sample ? 'sample' : 'ok';
    chip(k === 'check' ? '<b>Bitte kurz prüfen:</b> liegt das Raster auf dem Boden? <button type="button" data-chipfix>Anpassen</button>' : k === 'sample' ? `${ICO.ok}<span>Beispielraum vermessen</span>` : `${ICO.ok}<span>Boden und Wände erkannt</span>`, k === 'check' ? 9000 : 3600, k === 'check' ? 'warn' : 'ok');
    flashGrid(1700);
    if (!RM) {
      const t0 = performance.now(); host.style.opacity = 0; cancelAnimationFrame(anim);
      const run = now => { const k2 = Math.min(1, (now - t0) / 720); host.style.opacity = Math.min(1, k2 * 1.7); rig.s = .9 + .1 * springy(k2); update(); if (k2 < 1) anim = requestAnimationFrame(run); else { anim = 0; rig.s = 1; host.style.opacity = ''; update(); hint(); } };
      anim = requestAnimationFrame(run);
    } else hint();
  }
  function goFree(first) {
    free = true; pts = freePts(tilt); mode = 'view'; hideMsg(); noRoom = false; host.classList.remove('kpf-hide');
    rig = { x: 0, z: 0, ry: 0, s: .8 }; snapW = new Set(); update();
    if (!pose) { tilt = .45; pts = freePts(tilt); update(); }
    if (first) chip(`${ICO.ok}<span>Ihre Küche steht im Foto – schieben, drehen und größer oder kleiner ziehen</span>`, 4200, 'ok');
    flashGrid(1200); hint();
  }
  function hint() { const g = $('[data-gest]', el); try { const n = +localStorage.getItem('kpf-gest') || 0; if (n >= 3) return; localStorage.setItem('kpf-gest', String(n + 1)); } catch (e) { } g.hidden = false; void g.offsetWidth; g.classList.add('on'); clearTimeout(hint.t); hint.t = setTimeout(() => { g.classList.remove('on'); setTimeout(() => { g.hidden = true; }, 400); }, 5200); }
  function showMsg(kind) {
    const m = $('[data-msg]', el);
    const T = {
      outdoor: ['Das sieht nach einem Foto von draußen aus.', 'Für die Vorschau brauche ich Ihren Raum von innen – am besten aus der Tür heraus, quer, mit dem Boden unten im Bild.'],
      none: ['Hier finde ich keine klaren Bodenkanten.', 'Kein Problem: Markieren Sie den Boden selbst mit vier Punkten – das dauert 20 Sekunden. Oder nehmen Sie ein Foto, auf dem unten mehr Boden zu sehen ist.'],
    }[kind] || ['', ''];
    m.innerHTML = `<b>${T[0]}</b><p>${T[1]}</p><div class="kpf-row"><button type="button" class="kpf-b kpf-go" data-msgalign>${ICO.pts}<span>Selbst ausrichten</span></button><button type="button" class="kpf-b" data-msgnew>Anderes Foto</button></div>`;
    noRoom = true; hideChip(); hideHint();
    m.hidden = false; m.querySelector('[data-msgalign]').addEventListener('click', () => { hideMsg(); setMode('align'); });
    m.querySelector('[data-msgnew]').addEventListener('click', () => { hideMsg(); showEmpty(); });
    host.classList.add('kpf-hide'); syncUI();
  }
  function hideMsg() { const m = $('[data-msg]', el); if (m) m.hidden = true; if (host) host.classList.remove('kpf-hide'); }
  function hideChip() { const c = $('[data-chip]', el); if (c) { c.classList.remove('on'); c.hidden = true; } clearTimeout(chipT); }
  function hideHint() { const g = $('[data-gest]', el); if (g) { g.classList.remove('on'); g.hidden = true; } clearTimeout(hint.t); }
  let chipT = 0;
  function chip(html, ms = 3500, kind = 'ok') {
    const c = $('[data-chip]', el); c.innerHTML = html; c.className = 'kpf-chip ' + kind; c.hidden = false; void c.offsetWidth; c.classList.add('on');
    const fx = c.querySelector('[data-chipfix]'); if (fx) fx.addEventListener('click', () => { c.classList.remove('on'); setMode('align'); });
    clearTimeout(chipT); chipT = setTimeout(() => { c.classList.remove('on'); setTimeout(() => { if (!c.classList.contains('on')) c.hidden = true; }, 350); }, ms);
  }

  /* ---------------- Welche Wand ist hinten im Foto? ---------------- */
  const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const faceLen = F => { const R = room(); return (F === 'N' || F === 'S' ? R.w : R.d) / 100; };
  const wallOfItem = it => ({ 0: 'N', 180: 'S', 90: 'W', 270: 'E' })[((it.r || 0) % 360 + 360) % 360] || null;
  // links/rechts im Foto, wenn F hinten ist
  const sidesOf = F => ({ N: ['W', 'E'], E: ['N', 'S'], S: ['E', 'W'], W: ['S', 'N'] })[F];
  function guessFace(r) {
    const st = st3(), R = room(), W = R.w / 100, D = R.d / 100, s2 = { N: 0, E: 0, S: 0, W: 0 };
    // Fotos entstehen meist in der Tür → hinten ist die gegenüberliegende Wand
    (st.open || []).filter(o => o.t === 'tuer').forEach(o => { s2[OPP[o.wall]] += 2.5; s2[o.wall] -= 1.5; });
    // die Küche soll zu sehen sein: Hauptwand hinten oder seitlich – nicht im Rücken des Fotografen
    const kw = {}; (st.items || []).filter(i => i.t === 'cab' && i.kind !== 'u').forEach(i => { const w = wallOfItem(i); if (w) kw[w] = (kw[w] || 0) + (i.w || 0); });
    const main = Object.keys(kw).sort((a, b) => kw[b] - kw[a])[0];
    if (main) ['N', 'E', 'S', 'W'].forEach(F => { if (F === main) s2[F] += 1.2; else if (sidesOf(F).includes(main)) s2[F] += .7; else s2[F] -= 3; });
    // erkannte Breite der Rückwand ↔ Wandlänge im Plan (Kamera meist ca. 1,45 m hoch)
    if (r && r.cam && r.cam.sides && r.cam.sides.L && r.cam.sides.R && r.cam.xR > r.cam.xL) {
      const wu = r.cam.xR - r.cam.xL;
      ['N', 'E', 'S', 'W'].forEach(F => { const Lu = F === 'N' || F === 'S' ? W : D, h = Lu / wu; s2[F] += 2.2 * Math.exp(-Math.pow(Math.log(h / 1.45) / .33, 2)); });
    }
    return ['N', 'E', 'S', 'W'].sort((a, b) => s2[b] - s2[a])[0];
  }
  function ptsFor(r, F) {
    if (!r || !r.pts) return DEF_PTS.map(p => p.slice());
    if (r.cam && r.cam.sides && !(r.cam.sides.L && r.cam.sides.R) && window.KPRaum && KPRaum.ptsFrom) { const q = KPRaum.ptsFrom(r.cam, faceLen(F)); if (q) return q; }
    return r.pts.map(p => p.slice());
  }
  function setFace(F) {
    if (!F || F === face) return; face = F; faceManual = true;
    if (det && det.cam && !det.sample) { pts = ptsFor(det, face); det.pts0 = pts.map(p => p.slice()); }
    rig = { x: 0, z: 0, ry: 0, s: 1 }; snapW = new Set(); update(); flashGrid(1300);
    chip(`${ICO.ok}<span>Hinten im Foto: ${WN[face]} (${fmt(faceLen(face))} m)</span>`, 2600);
  }
  function drawPlan() {
    const svg = $('[data-plan]', el); if (!svg) return;
    const R = room(), W = R.w / 100, D = R.d / 100, st = st3(), pad = 26, sk = Math.min((220 - pad * 2) / W, (170 - pad * 2) / D), ox = (220 - W * sk) / 2, oy = (170 - D * sk) / 2;
    const X = x => ox + x * sk, Y = z => oy + z * sk;
    let s = `<rect x="${X(0)}" y="${Y(0)}" width="${W * sk}" height="${D * sk}" rx="2" class="kpf-pr"/>`;
    (st.items || []).filter(i => i.t === 'cab' || i.t === 'in').forEach(it => { const w = (it.w || 60) / 100, d = (it.d || (it.kind === 'u' ? 35 : it.t === 'in' ? 100 : 60)) / 100, q = ((it.r || 0) % 180) !== 0, hx = (q ? d : w) / 2, hz = (q ? w : d) / 2; s += `<rect x="${X(it.x / 100 - hx).toFixed(1)}" y="${Y(it.z / 100 - hz).toFixed(1)}" width="${(hx * 2 * sk).toFixed(1)}" height="${(hz * 2 * sk).toFixed(1)}" class="kpf-pc${it.kind === 'u' ? ' u' : ''}"/>`; });
    (st.open || []).forEach(o => { const a = o.s / 100, b = (o.s + o.w) / 100; const seg = { N: [X(a), Y(0), X(b), Y(0)], S: [X(W - a), Y(D), X(W - b), Y(D)], W: [X(0), Y(D - a), X(0), Y(D - b)], E: [X(W), Y(a), X(W), Y(b)] }[o.wall]; if (seg) s += `<line x1="${seg[0]}" y1="${seg[1]}" x2="${seg[2]}" y2="${seg[3]}" class="kpf-po ${o.t === 'tuer' ? 't' : 'f'}"/>`; });
    const segW = { N: [X(0), Y(0), X(W), Y(0)], S: [X(0), Y(D), X(W), Y(D)], W: [X(0), Y(0), X(0), Y(D)], E: [X(W), Y(0), X(W), Y(D)] };
    ['N', 'E', 'S', 'W'].forEach(F => { const g = segW[F]; s += `<g class="kpf-pw${F === face ? ' on' : ''}" data-face="${F}" role="button" tabindex="0" aria-pressed="${F === face}" aria-label="${WN[F]}, ${fmt(faceLen(F))} m – ist hinten im Foto"><line x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}" class="hit"/><line x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}" class="vis"/></g>`; });
    // Kamera: gegenüber der gewählten Wand, Blick dorthin
    const cpos = { N: [X(W / 2), Y(D) + 13, -90], S: [X(W / 2), Y(0) - 13, 90], W: [X(W) + 13, Y(D / 2), 180], E: [X(0) - 13, Y(D / 2), 0] }[face];
    s += `<g class="kpf-pcam" transform="translate(${cpos[0]} ${cpos[1]}) rotate(${cpos[2]})"><path d="M2 0L58 -24A62 62 0 0 1 58 24Z" class="cone"/><rect x="-10" y="-6.5" width="13" height="13" rx="3"/><path d="M3 -3.5l6 -3.5v14l-6 -3.5z"/></g>`;
    svg.innerHTML = s;
    $$('.kpf-pw', svg).forEach(g => { const go = () => setFace(g.dataset.face); g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    const ws = $('[data-wsel]', el); if (ws) ws.innerHTML = `Hinten im Foto: <b>${WN[face]}</b> · ${fmt(faceLen(face))} m`;
  }

  /* ---------------- Ausrichtung ---------------- */
  function faceCfg(F, W, D) {
    return { N: { O: [0, 0, 0], U: [1, 0, 0], V: [0, 0, 1], Lu: W, Lv: D }, E: { O: [W, 0, 0], U: [0, 0, 1], V: [-1, 0, 0], Lu: D, Lv: W }, S: { O: [W, 0, D], U: [-1, 0, 0], V: [0, 0, -1], Lu: W, Lv: D }, W: { O: [0, 0, D], U: [0, 0, -1], V: [1, 0, 0], Lu: D, Lv: W } }[F];
  }
  function norm2() { const a = ph.w / ph.h; return a >= 1 ? [1, 1 / a] : [a, 1]; }
  function solve() {
    const R = room(), W = R.w / 100, D = R.d / 100, cfg = faceCfg(face, W, D), [nW, nH] = norm2(), f = mm / 34.6;
    const q = pts.map(p => [(p[0] - .5) * nW / f, (p[1] - .5) * nH / f, 1]);
    const side = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const P = pts; if (side(P[0], P[1], P[2]) * side(P[0], P[1], P[3]) < 0 || side(P[1], P[2], P[3]) * side(P[1], P[2], P[0]) < 0 || side(P[3], P[0], P[1]) * side(P[3], P[0], P[2]) < 0) return { err: 'Die Linien überkreuzen sich – 1 und 2 gehören nach hinten, 3 rechts und 4 links nach vorn.' };
    let V = cross(cross(q[0], q[3]), cross(q[1], q[2])); if (len(V) < 1e-9) return { err: 'Bitte 3 und 4 etwas weiter von 1 und 2 weg ziehen.' }; V = nrm(V);
    if (Math.abs(V[2]) > 1e-4) { if (V[2] > 0) V = sc(V, -1); } else if (V[0] * (q[3][0] - q[0][0]) + V[1] * (q[3][1] - q[0][1]) < 0) V = sc(V, -1);
    let U = nrm(cross(cross(q[0], q[1]), V)); if (dot(cross(U, q[0]), cross(q[1], q[0])) < 0) U = sc(U, -1);
    const Y = cross(V, U), d0 = -dot(Y, q[0]), d1 = -dot(Y, q[1]);
    if (d0 <= 1e-6 || d1 <= 1e-6) return { err: 'So passt es nicht zusammen – liegen 1 und 2 wirklich unten in den Ecken am Boden?' };
    const p0 = sc(q[0], 1 / d0), p1 = sc(q[1], 1 / d1), h = cfg.Lu / len(sub(p1, p0)), P0 = sc(p0, h);
    const Rm = [0, 1, 2].map(i => [0, 1, 2].map(j => U[i] * cfg.U[j] + V[i] * cfg.V[j] + Y[i] * [0, 1, 0][j]));
    const RtP = [0, 1, 2].map(j => Rm[0][j] * P0[0] + Rm[1][j] * P0[1] + Rm[2][j] * P0[2]);
    const C = sub(cfg.O, RtP), dist = dot(sub(C, cfg.O), cfg.V);
    return { Rm, C, h, dist, f, nW, nH, cfg, W, D };
  }
  function quat(m) {
    const t = m[0][0] + m[1][1] + m[2][2]; let x, y, z, w, s;
    if (t > 0) { s = .5 / Math.sqrt(t + 1); w = .25 / s; x = (m[2][1] - m[1][2]) * s; y = (m[0][2] - m[2][0]) * s; z = (m[1][0] - m[0][1]) * s; }
    else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { s = 2 * Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]); w = (m[2][1] - m[1][2]) / s; x = .25 * s; y = (m[0][1] + m[1][0]) / s; z = (m[0][2] + m[2][0]) / s; }
    else if (m[1][1] > m[2][2]) { s = 2 * Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]); w = (m[0][2] - m[2][0]) / s; x = (m[0][1] + m[1][0]) / s; y = .25 * s; z = (m[1][2] + m[2][1]) / s; }
    else { s = 2 * Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]); w = (m[1][0] - m[0][1]) / s; x = (m[0][2] + m[2][0]) / s; y = (m[1][2] + m[2][1]) / s; z = .25 * s; }
    return [x, y, z, w];
  }
  // Weltpunkt → Bildkoordinate 0..1 (oder null, wenn hinter der Kamera)
  function project(p, pw) { const d = sub(pw, p.C), c = [0, 1, 2].map(i => p.Rm[i][0] * d[0] + p.Rm[i][1] * d[1] + p.Rm[i][2] * d[2]); if (c[2] < .08) return null; return [c[0] / c[2] * p.f / p.nW + .5, c[1] / c[2] * p.f / p.nH + .5]; }
  // Drehpunkt der Küche = Mitte ihrer Grundfläche (sie dreht sich „um sich selbst“)
  const pivot = () => fp ? [(fp.x0 + fp.x1) / 2, (fp.z0 + fp.z1) / 2] : pose ? [pose.cfg.O[0] + pose.cfg.U[0] * pose.cfg.Lu / 2, pose.cfg.O[2] + pose.cfg.U[2] * pose.cfg.Lu / 2] : [0, 0];
  function update() {
    if (!ph || !K) return;
    const p = solve(); pose = p.err ? null : p;
    const hintEl = $('[data-hint]', el);
    if (p.err) { hintEl.textContent = p.err; hintEl.className = 'kpf-ok bad'; host.classList.add('kpf-hide'); }
    else {
      if ($('[data-msg]', el).hidden && $('[data-scan]', el).hidden) host.classList.remove('kpf-hide');
      const RtF = [0, 1, 2].map(i => [p.Rm[0][i], -p.Rm[1][i], -p.Rm[2][i]]);
      K.setPhoto({ pos: p.C, quat: quat(RtF), fov: 2 * Math.atan(p.nH / 2 / p.f) * 180 / PI });
      const c = pivot(); K.setRig({ ...rig, cx: c[0], cz: c[1] });
      applyLight();
      const odd = p.h < .5 || p.h > 2.6 || p.dist < .3;
      hintEl.className = 'kpf-ok' + (odd ? ' warn' : '');
      hintEl.innerHTML = odd ? `Ungewöhnlich: Die Kamera wäre ${fmt(p.h)} m hoch. Liegen 1 und 2 unten in den Ecken? Stimmt die Wandlänge (${WN[face]}: ${fmt(p.cfg.Lu)} m)?` : `Passt: Foto aus rund <b>${fmt(p.h)} m</b> Höhe, <b>${fmt(p.dist, 1)} m</b> vor der Wand.`;
    }
    drawOv(); syncUI();
  }

  /* ---------------- Überlagerung: Bodenraster, Wände, Einrasten ---------------- */
  const polyOn = (p, pa, pb, n = 24) => { const out = []; for (let k = 0; k <= n; k++) { const t = k / n, q = project(p, [pa[0] + (pb[0] - pa[0]) * t, 0, pa[1] + (pb[1] - pa[1]) * t]); if (q) out.push((q[0] * 1000).toFixed(1) + ',' + (q[1] * 1000).toFixed(1)); } return out; };
  function flashGrid(ms) { dragUI = true; drawOv(); clearTimeout(flashT); flashT = setTimeout(() => { dragUI = false; drawOv(); }, ms); }
  function drawOv() {
    if (!ph || !pts) return; let s = '';
    const P = pts.map(([x, y]) => [x * 1000, y * 1000]), ln = (a, b, c, w = 2, da = '') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" vector-effect="non-scaling-stroke"${da ? ` stroke-dasharray="${da}"` : ''}/>`;
    if (pose && (mode === 'align' || dragUI)) {
      const W = pose.W, D = pose.D, grid = [];
      for (let x = 0; x <= W + 1e-6; x += .5) { const q = polyOn(pose, [x, 0], [x, D]); if (q.length > 1) grid.push(`<polyline points="${q.join(' ')}"/>`); }
      for (let z = 0; z <= D + 1e-6; z += .5) { const q = polyOn(pose, [0, z], [W, z]); if (q.length > 1) grid.push(`<polyline points="${q.join(' ')}"/>`); }
      s += `<g class="kpf-grid${mode === 'align' ? ' al' : ''}">${grid.join('')}</g>`;
      const WS = { W: [[0, 0], [0, D]], E: [[W, 0], [W, D]], N: [[0, 0], [W, 0]], S: [[0, D], [W, D]] };
      for (const k in WS) { const q = polyOn(pose, WS[k][0], WS[k][1], 12); if (q.length > 1) s += `<polyline class="kpf-wline${snapW.has(k) ? ' on' : ''}" points="${q.join(' ')}"/>`; }
    }
    if (mode === 'align') {
      const ext = (a, b) => [a[0] + (b[0] - a[0]) * 1.6, a[1] + (b[1] - a[1]) * 1.6];
      s += ln(P[0], ext(P[0], P[3]), 'rgba(0,0,0,.35)', 4) + ln(P[1], ext(P[1], P[2]), 'rgba(0,0,0,.35)', 4) + ln(P[0], P[1], 'rgba(0,0,0,.35)', 5);
      s += ln(P[0], ext(P[0], P[3]), KP.acc, 2, '7 5') + ln(P[1], ext(P[1], P[2]), KP.acc, 2, '7 5') + ln(P[0], P[1], KP.acc, 3);
    }
    const keep = !dragUI && mode !== 'align' ? ov.querySelector('.kpf-det') : null;
    ov.innerHTML = s; if (keep) ov.appendChild(keep);
    $$('[data-h]', el).forEach((h, i) => { h.style.left = pts[i][0] * 100 + '%'; h.style.top = pts[i][1] * 100 + '%'; h.hidden = mode !== 'align'; });
    const wl = $('[data-wl]', el); wl.hidden = mode !== 'align'; if (mode === 'align') { wl.textContent = WN[face] + (pose ? ' · ' + fmt(pose.cfg.Lu) + ' m' : ''); wl.style.left = (pts[0][0] + pts[1][0]) * 50 + '%'; wl.style.top = (pts[0][1] + pts[1][1]) * 50 + '%'; }
    placeRot();
  }
  // Dreh-Griff (PC): schwebt über der Mitte der Küche
  function placeRot() {
    const b = $('[data-rot]', el); if (!b) return;
    const show = !TOUCH && mode === 'view' && !cmpOn && pose && fp && !noRoom && $('[data-msg]', el).hidden && $('[data-scan]', el).hidden;
    if (!show) { b.hidden = true; return; }
    const c = pivot(), q = project(pose, [c[0] + rig.x, 1.15, c[1] + rig.z]); if (!q || q[0] < .02 || q[0] > .98 || q[1] < .02 || q[1] > .98) { b.hidden = true; return; }
    b.hidden = false; b.style.left = q[0] * 100 + '%'; b.style.top = clamp(q[1] - .06, .07, .93) * 100 + '%';
  }

  /* ---------------- Modus, Knöpfe ---------------- */
  function act(k) {
    if (!ph) return;
    if (k === 'rot') { if (pose) turn(H90); return; }
    if (k === 'home') { if (!pose) return; snapW = new Set(); tween({ x: 0, z: 0, ry: 0, s: 1 }); flashGrid(1100); chip(`${ICO.home}<span>Zurück an ihrem geplanten Platz</span>`, 2000); return; }
    if (k === 'cmp') { if (pose) setCmpOn(!cmpOn); return; }
    if (k === 'align') { setMode('align'); return; }
  }
  function setMode(m, quiet) {
    mode = m; if (m === 'align') { setCmpOn(false, true); hideMsg(); }
    drawOv(); syncUI();
    if (m === 'view' && !quiet && pose) flashGrid(900);
  }
  function syncUI() {
    if (!el) return;
    $$('[data-pane]', el).forEach(p => p.hidden = p.dataset.pane !== mode);
    $$('[data-mm]', el).forEach(b => b.classList.toggle('on', Math.abs(+b.dataset.mm - mm) < 1.5));
    const set = (k, v, t) => { const r = $(`[data-r="${k}"]`, el), o = $(`[data-o="${k}"]`, el); if (r && document.activeElement !== r) r.value = v; if (o) o.textContent = t; };
    set('mm', Math.round(mm), Math.round(mm) + ' mm'); set('ex', Math.round(expo * 100), Math.round(expo * 100) + ' %'); set('tl', Math.round(tilt * 100), tilt < .3 ? 'gerade' : tilt > .7 ? 'von oben' : 'leicht von oben'); set('sz', Math.round(rig.s * 100), Math.round(rig.s * 100) + ' %');
    const fb = $('[data-freebox]', el); if (fb) fb.hidden = !free;
    const src = $('[data-mmsrc]', el); if (src && ph) src.textContent = mmSrc === 'exif' ? `Aus den Foto-Daten erkannt: ${Math.round(ph.mm)} mm (Kleinbild).` : mmSrc === 'auto' ? `Aus den Raumfluchten geschätzt: ${Math.round(mm)} mm.` : mmSrc === 'sample' ? 'Beispielfoto: normales Handy-Objektiv (1×).' : mmSrc === 'user' ? '' : 'Unbekannt – angenommen: normales Handy-Objektiv (1×).';
    fit.classList.toggle('al', mode === 'align'); fit.classList.toggle('cmp', cmpOn); fit.classList.toggle('mv', mode === 'view' && !cmpOn && !!pose);
    const smp = !!(ph && ph.sample); $('[data-samplenote]', el).hidden = !smp; $('[data-attach]', el).hidden = smp; $('[data-own]', el).hidden = !smp;
    $('[data-cmpl]', el).hidden = !cmpOn;
    const cb = $('[data-act="cmp"]', el); if (cb) { cb.setAttribute('aria-pressed', cmpOn); cb.classList.toggle('on', cmpOn); }
    const lead = $('[data-lead]', el);
    if (lead) lead.innerHTML = free && pose ? (TOUCH ? '<b>Ihre Küche steht in Ihrem Foto.</b> Mit einem Finger verschieben, mit zwei Fingern drehen und größer oder kleiner ziehen. Passt der Boden nicht ganz? Regler <b>Blickwinkel</b>.' : '<b>Ihre Küche steht in Ihrem Foto.</b> Ziehen verschiebt sie, ↻ dreht sie, das Mausrad macht sie größer oder kleiner. Passt der Boden nicht ganz? Regler <b>Blickwinkel</b>.') : !pose || noRoom ? 'Der Boden ist noch nicht markiert – tippen Sie auf <b>Feinjustieren</b>.' : cmpOn ? '<b>Ziehen Sie den Regler im Bild:</b> links Ihr Raum heute, rechts mit Ihrer geplanten Küche.' : TOUCH ? '<b>Ihre geplante Küche steht in Ihrem Raum.</b> Mit einem Finger verschieben, mit zwei Fingern drehen – an den Wänden rastet sie ein.' : '<b>Ihre geplante Küche steht in Ihrem Raum.</b> Ziehen verschiebt sie, mit ↻ drehen Sie sie – an den Wänden rastet sie ein.';
    ['rot', 'home', 'cmp'].forEach(k => { const b = $(`[data-act="${k}"]`, el); if (b) b.disabled = !pose || noRoom; });
    drawPlan(); applyCmp(); placeRot();
  }
  /* ---------------- Vorher / Nachher ---------------- */
  // links vom Regler „Vorher“ (nur Foto), rechts „Nachher“ (mit Küche). Ganz rechts = nur Vorher: die Küche ist dann ganz weg.
  function setCmpOn(on, quiet) { cmpOn = !!on; if (cmpOn && (cmp >= 98 || cmp <= 2)) cmp = 50; syncUI(); if (cmpOn && !quiet) chip(`${ICO.cmp}<span>Regler im Bild ziehen</span>`, 2200); }
  function applyCmp() { if (!host) return; host.style.clipPath = cmpOn ? `inset(0 0 0 ${clamp(cmp, 0, 100)}%)` : ''; const l = $('[data-cmpl]', el); l.style.setProperty('--p', cmp + '%'); const k = $('[data-knob]', el); if (k) k.setAttribute('aria-valuenow', Math.round(cmp)); }
  function setCmp(v) { cmp = clamp(+v || 0, 0, 100); applyCmp(); }
  function bindCmp() {
    const k = $('[data-knob]', el);
    k.addEventListener('keydown', e => { const d = { ArrowLeft: -2, ArrowRight: 2, Home: -100, End: 100, PageDown: -10, PageUp: 10 }[e.key]; if (d == null) return; e.preventDefault(); setCmp(cmp + d); });
  }

  /* ---------------- Küche im Bild bewegen – mit Einrasten ---------------- */
  const SN = .14, SN2 = .26, AS = 6 * PI / 180;   // Einrasten: Abstand zur Wand (m), Loslassen (m), Winkel
  const rot2 = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
  function box(r) {
    if (!fp) return null; const c = pivot(), s = r.s;
    const cs = [[fp.x0, fp.z0], [fp.x1, fp.z0], [fp.x1, fp.z1], [fp.x0, fp.z1]].map(([x, z]) => { const q = rot2((x - c[0]) * s, (z - c[1]) * s, r.ry); return [q[0] + c[0] + r.x, q[1] + c[1] + r.z]; });
    return { X0: Math.min(...cs.map(q => q[0])), X1: Math.max(...cs.map(q => q[0])), Z0: Math.min(...cs.map(q => q[1])), Z1: Math.max(...cs.map(q => q[1])) };
  }
  // Welche Wände berührt die Küche an ihrem geplanten Platz („Rücken“)? Hauptwand = die mit den meisten Unterschränken.
  // Nach einer Drehung um k·90° liegen diese Rücken an anderen Wänden (N → W → S → E bei +90°).
  const ROT = { 1: { N: 'W', W: 'S', S: 'E', E: 'N' }, 2: { N: 'S', S: 'N', E: 'W', W: 'E' }, 3: { N: 'E', E: 'S', S: 'W', W: 'N' } };
  let hwCache = null;
  function homeWalls() {
    if (!fp) return { all: [], main: null };
    if (hwCache && hwCache.fp === fp) return hwCache;
    const t = .04, all = []; if (fp.z0 < t) all.push('N'); if (fp.z1 > fp.D - t) all.push('S'); if (fp.x0 < t) all.push('W'); if (fp.x1 > fp.W - t) all.push('E');
    const kw = {}; (st3().items || []).filter(i => i.t === 'cab' && i.kind !== 'u').forEach(i => { const w = wallOfItem(i); if (w) kw[w] = (kw[w] || 0) + (i.w || 0); });
    const main = Object.keys(kw).filter(w => all.includes(w)).sort((a, b) => kw[b] - kw[a])[0] || all[0] || null;
    return hwCache = { fp, all, main };
  }
  const quarter = ry => ((Math.round(ry / H90) % 4) + 4) % 4;
  const wallsAt = ry => { const h = homeWalls(), k = quarter(ry), m = w => k ? ROT[k][w] : w; return { all: h.all.map(m), main: h.main ? m(h.main) : null }; };
  // Rohwert → mit Wandanschlag und Einrasten (Hysterese: was eingerastet ist, bleibt es ein Stück länger).
  // Eingerastet wird nur mit dem Rücken der Küche – nie mit den Fronten an die Wand.
  function constrain(r0) {
    if (free) { const r = { ...r0 }, q = Math.round(r.ry / H90) * H90; if (Math.abs(r.ry - q) < AS) r.ry = q; r.s = clamp(r.s, .3, 2.6); return r; }
    const r = { ...r0 }, W = fp ? fp.W : 0, D = fp ? fp.D : 0;
    const q = Math.round(r.ry / H90) * H90, aligned = Math.abs(r.ry - q) < AS; if (aligned) r.ry = q;
    if (Math.abs(r.s - 1) < .025) r.s = 1;
    const now = new Set();
    if (fp && aligned) {
      let b = box(r);
      // nicht durch die Wand schieben (wenn die Küche in den Raum passt)
      if (b.X1 - b.X0 <= W + .02) { if (b.X0 < 0) r.x -= b.X0; else if (b.X1 > W) r.x -= b.X1 - W; }
      if (b.Z1 - b.Z0 <= D + .02) { if (b.Z0 < 0) r.z -= b.Z0; else if (b.Z1 > D) r.z -= b.Z1 - D; }
      b = box(r);
      const th = k => snapW.has(k) ? SN2 : SN, back = wallsAt(r.ry).all, okW = k => back.includes(k);
      if (okW('W') && b.X0 < th('W')) { r.x -= b.X0; now.add('W'); } else if (okW('E') && W - b.X1 < th('E')) { r.x += W - b.X1; now.add('E'); }
      if (okW('N') && b.Z0 < th('N')) { r.z -= b.Z0; now.add('N'); } else if (okW('S') && D - b.Z1 < th('S')) { r.z += D - b.Z1; now.add('S'); }
    }
    const added = [...now].filter(k => !snapW.has(k));
    snapW = now;
    if (added.length && dragUI) {
      buzz(10); const sd = sidesOf(face), lab = k => k === face ? 'an der Wand hinten' : k === OPP[face] ? 'an der vorderen Wand' : k === sd[0] ? 'an der Wand links' : 'an der Wand rechts';
      chip(`${ICO.ok}<span>Eingerastet ${added.map(lab).join(' und ')}</span>`, 1500);
    }
    return r;
  }
  // Beim Loslassen: Die Küche dreht sich, falls nötig, mit dem Rücken zur nächsten Wand und rastet bündig ein
  // (eine Zeile, die man an die gegenüberliegende Wand zieht, dreht sich um – die Fronten zeigen in den Raum).
  function smartSnap() {
    const h = homeWalls(); if (!fp || !h.main) return null;
    const W = fp.W, D = fp.D, b0 = box(rig), c0 = [(b0.X0 + b0.X1) / 2, (b0.Z0 + b0.Z1) / 2], base = Math.round(rig.ry / H90) * H90;
    let best = null;
    [0, 1, -1, 2].forEach(d => {
      const r = { ...rig, ry: base + d * H90 }, wa = wallsAt(r.ry), order = [wa.main, ...wa.all.filter(w => w !== wa.main)], used = {};
      let b = box(r);
      order.forEach(w => { const ax = w === 'N' || w === 'S' ? 'z' : 'x'; if (used[ax]) return; used[ax] = 1; if (w === 'N') r.z -= b.Z0; else if (w === 'S') r.z += D - b.Z1; else if (w === 'W') r.x -= b.X0; else r.x += W - b.X1; b = box(r); });
      if (b.X1 - b.X0 <= W + .02) { if (b.X0 < 0) r.x -= b.X0; else if (b.X1 > W) r.x -= b.X1 - W; }
      if (b.Z1 - b.Z0 <= D + .02) { if (b.Z0 < 0) r.z -= b.Z0; else if (b.Z1 > D) r.z -= b.Z1 - D; }
      // nah an der eigenen Wand: bündig ranziehen; an einer anderen Wand (deutlich hingezogen): umdrehen und einrasten
      b = box(r); const c = [(b.X0 + b.X1) / 2, (b.Z0 + b.Z1) / 2], shift = Math.hypot(c[0] - c0[0], c[1] - c0[1]), dist = shift + Math.abs(d) * .22;
      if (shift > (d ? .6 : .35)) return;
      if (!best || dist < best.dist) best = { r, dist, d, walls: wa.all, main: wa.main };
    });
    return best;
  }
  function settleDrop() {
    if (free) return false;
    const s0 = smartSnap(); if (!s0) return false;
    const moved = Math.hypot(s0.r.x - rig.x, s0.r.z - rig.z) > .005 || Math.abs(s0.r.ry - rig.ry) > .002;
    const added = s0.walls.filter(k => !snapW.has(k)); snapW = new Set(s0.walls); tween(s0.r, s0.d ? 420 : 260);
    if (moved || added.length) {
      buzz(s0.d ? [8, 40, 12] : 10); const sd = sidesOf(face), lab = k => k === face ? 'an der Wand hinten' : k === OPP[face] ? 'an der vorderen Wand' : k === sd[0] ? 'an der Wand links' : 'an der Wand rechts';
      const m = s0.main ? lab(s0.main) : '';
      chip(`${ICO.ok}<span>${s0.d ? 'Gedreht und eingerastet' : 'Eingerastet'} ${m}</span>`, 1800);
    }
    return true;
  }
  function tween(to, ms = 380) {
    const from = { ...rig }, t0 = performance.now(); cancelAnimationFrame(anim);
    if (RM) { rig = { ...to }; update(); return; }
    const run = now => { const k = Math.min(1, (now - t0) / ms), e = ease(k); rig = { x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e, ry: from.ry + (to.ry - from.ry) * e, s: from.s + (to.s - from.s) * e }; update(); if (k < 1) anim = requestAnimationFrame(run); else { anim = 0; rig = { ...to }; update(); } };
    anim = requestAnimationFrame(run);
  }
  function turn(da) {
    dragUI = true; const r0 = rig, tgt = constrain({ ...rig, ry: Math.round((rig.ry + da) / H90) * H90 });
    // gedreht soll die Küche wieder mit dem Rücken an einer Wand stehen (wenn das in der Nähe geht)
    rig = tgt; const s0 = smartSnap(); rig = r0; const to = s0 && Math.abs(s0.r.ry - tgt.ry) < .01 ? s0.r : tgt; if (s0 && to === s0.r) snapW = new Set(s0.walls);
    flashGrid(1400); tween(to);
  }
  function bindStage() {
    const P = new Map(); let g0 = null;
    const ndc = (x, y) => { const r = fit.getBoundingClientRect(); return [(x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1)]; };
    const floorAt = (x, y) => { const n = ndc(x, y); return K && K.floorAt(n[0], n[1]); };
    const two = () => { const [a, b] = [...P.values()]; return { a: Math.atan2(b.y - a.y, b.x - a.x), d: Math.hypot(b.x - a.x, b.y - a.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; };
    fit.addEventListener('pointerdown', e => {
      if (!ph || e.target.closest('[data-h],[data-rot],[data-msg],[data-chip] button,[data-knob]') && !cmpOn) return;
      if (mode !== 'view' || !pose || noRoom || !$('[data-msg]', el).hidden) return;
      if (cmpOn) { try { fit.setPointerCapture(e.pointerId); } catch (er) { } g0 = { kind: 'cmp' }; const r = fit.getBoundingClientRect(); setCmp((e.clientX - r.left) / r.width * 100); fit.classList.add('drag'); e.preventDefault(); return; }
      cancelAnimationFrame(anim); anim = 0;
      try { fit.setPointerCapture(e.pointerId); } catch (er) { }
      P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (P.size === 1) g0 = { kind: e.shiftKey || e.button === 2 ? 'rot' : 'move', f: floorAt(e.clientX, e.clientY), x: e.clientX, r0: { ...rig } };
      else if (P.size === 2) { const t = two(); g0 = { kind: 'two', ...t, f: floorAt(t.mx, t.my), r0: { ...rig } }; }
      dragUI = true; clearTimeout(flashT); fit.classList.add('drag'); e.preventDefault();
    });
    fit.addEventListener('pointermove', e => {
      if (!g0) return;
      if (g0.kind === 'cmp') { const r = fit.getBoundingClientRect(); setCmp((e.clientX - r.left) / r.width * 100); return; }
      if (!P.has(e.pointerId)) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = { ...g0.r0 };
      if (g0.kind === 'two' && P.size === 2) {
        const t = two(); r.ry = g0.r0.ry - (t.a - g0.a); r.s = clamp(g0.r0.s * t.d / Math.max(1, g0.d), free ? .3 : .85, free ? 2.6 : 1.15);
        const f = floorAt(t.mx, t.my); if (f && g0.f) { r.x += f.x - g0.f.x; r.z += f.z - g0.f.z; }
      } else if (g0.kind === 'rot') r.ry = g0.r0.ry + (e.clientX - g0.x) * .008;
      else if (g0.kind === 'move' && g0.f) { const f = floorAt(e.clientX, e.clientY); if (f) { r.x += f.x - g0.f.x; r.z += f.z - g0.f.z; } }
      rig = constrain(r); update();
    });
    const end = e => {
      if (!g0) return;
      if (g0.kind === 'cmp') { g0 = null; fit.classList.remove('drag'); return; }
      P.delete(e.pointerId);
      if (P.size === 1 && g0.kind === 'two') { const [q] = [...P.values()]; g0 = { kind: 'move', f: floorAt(q.x, q.y), x: q.x, r0: { ...rig } }; return; }
      if (P.size) return;
      g0 = null; fit.classList.remove('drag');
      // nach dem Loslassen: klug einrasten (Drehung + Wand), sonst fast gerade → gerade (weich); Raster blendet aus
      if (!settleDrop()) { const q = Math.round(rig.ry / H90) * H90; if (Math.abs(rig.ry - q) > 1e-4 && Math.abs(rig.ry - q) < 12 * PI / 180) tween(constrain({ ...rig, ry: q }), 260); }
      clearTimeout(flashT); flashT = setTimeout(() => { dragUI = false; drawOv(); }, 700);
    };
    fit.addEventListener('pointerup', end); fit.addEventListener('pointercancel', end);
    fit.addEventListener('contextmenu', e => { if (mode === 'view' && pose) e.preventDefault(); });
    fit.addEventListener('wheel', e => { if (mode !== 'view' || !pose || cmpOn) return; e.preventDefault(); dragUI = true; rig = constrain({ ...rig, s: clamp(rig.s * Math.exp(-e.deltaY * .0012), free ? .3 : .85, free ? 2.6 : 1.15) }); update(); flashGrid(700); }, { passive: false });
    // Tastatur (Fokus auf dem Bild): Pfeile schieben, Q/E drehen
    fit.tabIndex = 0; fit.setAttribute('aria-label', 'Küche im Foto – Pfeiltasten verschieben, Q und E drehen');
    fit.addEventListener('keydown', e => {
      if (mode !== 'view' || !pose || e.target !== fit) return;
      const st = e.shiftKey ? .2 : .05, k = e.key; const r = { ...rig };
      if (k === 'q' || k === 'Q') { turn(-H90); e.preventDefault(); return; } if (k === 'e' || k === 'E') { turn(H90); e.preventDefault(); return; }
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]; if (!dir) return; e.preventDefault();
      const U = pose.cfg.U, V = pose.cfg.V; r.x += (U[0] * dir[0] + V[0] * dir[1]) * st; r.z += (U[2] * dir[0] + V[2] * dir[1]) * st; dragUI = true; rig = constrain(r); update(); flashGrid(800);
    });
  }
  // Dreh-Griff: ziehen = frei drehen (rastet bei 90° ein), antippen = 90°
  function bindRot() {
    const b = $('[data-rot]', el); let g = null;
    b.addEventListener('pointerdown', e => {
      if (!pose) return; e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (er) { }
      const c = pivot(), q = project(pose, [c[0] + rig.x, 0, c[1] + rig.z]), fr = fit.getBoundingClientRect(), cx = fr.left + (q ? q[0] : .5) * fr.width, cy = fr.top + (q ? q[1] : .6) * fr.height;
      g = { cx, cy, a0: Math.atan2(e.clientY - cy, e.clientX - cx), r0: { ...rig }, moved: false, x: e.clientX, y: e.clientY }; dragUI = true; clearTimeout(flashT); drawOv();
    });
    b.addEventListener('pointermove', e => { if (!g) return; if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 4) g.moved = true; if (!g.moved) return; const a = Math.atan2(e.clientY - g.cy, e.clientX - g.cx); rig = constrain({ ...g.r0, ry: g.r0.ry - (a - g.a0) }); update(); });
    const up = () => { if (!g) return; const m = g.moved; g = null; if (!m) turn(H90); else if (!settleDrop()) { const q = Math.round(rig.ry / H90) * H90; if (Math.abs(rig.ry - q) < 12 * PI / 180) tween(constrain({ ...rig, ry: q }), 240); } clearTimeout(flashT); flashT = setTimeout(() => { dragUI = false; drawOv(); }, 800); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(H90); } });
  }

  /* ---------------- Punkte ziehen (Boden anpassen) ---------------- */
  function bindHandle(h) {
    const i = +h.dataset.h; let pid = null;
    const pos = e => { const r = fit.getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width, -.02, 1.02), clamp((e.clientY - r.top) / r.height, -.02, 1.02)]; };
    h.addEventListener('pointerdown', e => { pid = e.pointerId; try { h.setPointerCapture(pid); } catch (er) { } h.classList.add('on'); e.preventDefault(); e.stopPropagation(); showLoupe(e, i); });
    h.addEventListener('pointermove', e => { if (e.pointerId !== pid) return; pts[i] = pos(e); update(); showLoupe(e, i); });
    const up = e => { if (e.pointerId !== pid) return; pid = null; h.classList.remove('on'); loupe.hidden = true; };
    h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    h.addEventListener('keydown', e => { const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!k) return; e.preventDefault(); const st = e.shiftKey ? .02 : .004; pts[i] = [clamp(pts[i][0] + k[0] * st, -.02, 1.02), clamp(pts[i][1] + k[1] * st, -.02, 1.02)]; update(); });
  }
  function showLoupe(e, i) {
    if (e.pointerType === 'mouse') { loupe.hidden = true; return; }
    const r = fit.getBoundingClientRect(), z = 2.6, L = 112, x = pts[i][0] * r.width, y = pts[i][1] * r.height;
    loupe.hidden = false; loupe.style.left = clamp(x - L / 2, -10, r.width - L + 10) + 'px'; loupe.style.top = (y - L - 46 < -40 ? y + 46 : y - L - 46) + 'px';
    loupe.style.backgroundSize = `${r.width * z}px ${r.height * z}px`; loupe.style.backgroundPosition = `${-(x * z - L / 2)}px ${-(y * z - L / 2)}px`;
  }

  /* ---------------- Licht aus dem Foto ---------------- */
  // hellste Stelle (meist das Fenster) → Richtung des Lichts; Farbton der Mitteltöne → Lichtfarbe; Helligkeit → Belichtung
  function photoLight(c) {
    const w = 64, h = Math.max(16, Math.round(64 * c.height / c.width)), t = document.createElement('canvas'); t.width = w; t.height = h; const g = t.getContext('2d'); g.drawImage(c, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, Ls = []; let L = 0, sr = 0, sg = 0, sb = 0, sn = 0;
    for (let i = 0, k = 0; i < d.length; i += 4, k++) { const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; L += l; Ls.push([l, k % w, (k / w) | 0]); if (l > .25 && l < .85) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; sn++; } }
    L /= w * h; Ls.sort((a, b) => b[0] - a[0]);
    const top = Ls.filter(q => q[2] < h * .75).slice(0, Math.max(6, Math.round(w * h * .03))); let ux = 0; top.forEach(q => { ux += q[1]; });
    const u = top.length ? ux / top.length / w : .5, bright = top.length ? top[0][0] : 1;
    let tint = [1, 1, 1]; if (sn) { const m = (sr + sg + sb) / 3 / sn; tint = [sr / sn / m, sg / sn / m, sb / sn / m].map(v => clamp(1 + (v - 1) * .7, .88, 1.12)); }
    const lo = Ls[Math.floor(Ls.length * .9)][0], hi = Ls[Math.floor(Ls.length * .1)][0], con = clamp(hi - lo, .1, .8);
    return { u, bright, tint, expo: clamp(.72 + L * .62, .82, 1.3), catcher: clamp(.16 + con * .22, .18, .34), contact: clamp(.4 + con * .3, .42, .64) };
  }
  // Licht kommt von der hellsten Seite: hinten = Richtung Hinterwand des Fotos, links/rechts entlang der Hinterwand
  let lightKey = '';
  function applyLight() {
    if (!K || !K.photoLight || !light || !pose) return;
    const key = face + '|' + light.u.toFixed(2); if (key === lightKey) return; lightKey = key;
    const cfg = pose.cfg, sx = (light.u - .5) * 2, dirFrom = nrm([-cfg.V[0] + cfg.U[0] * sx * 1.3, 0, -cfg.V[2] + cfg.U[2] * sx * 1.3]);
    K.photoLight({ az: Math.atan2(dirFrom[0], dirFrom[2]), el: light.bright > .9 ? 1.02 : 1.16, tint: light.tint, catcher: light.catcher, contact: light.contact });
  }

  /* ---------------- Größe ---------------- */
  function layout() {
    if (!el || el.hidden || !ph || fit.hidden) return;
    const mob = innerWidth < 900, a = ph.w / ph.h;
    if (mob) { const top = $('.kpf-top', el).offsetHeight; stage.style.height = Math.round(Math.min((innerHeight - top) * .58, (innerWidth - 16) / a + 16)) + 'px'; } else stage.style.height = '';
    const r = stage.getBoundingClientRect(), pad = mob ? 8 : 20, aw = r.width - pad * 2, ah = r.height - pad * 2; let w = aw, h = w / a; if (h > ah) { h = ah; w = h * a; }
    fit.style.width = Math.round(w) + 'px'; fit.style.height = Math.round(h) + 'px'; drawOv();
  }
  addEventListener('resize', () => layout());

  /* ---------------- Bild, Teilen, Anhängen ---------------- */
  function compose(split, maxL = 1800, foot = true) {
    const s0 = Math.min(1, maxL / Math.max(ph.w, ph.h)), w = Math.round(ph.w * s0), h = Math.round(ph.h * s0), bar = foot ? Math.round(Math.max(w, h) * .042) : 0;
    const k3 = K.capture(w, h), c = document.createElement('canvas'); c.width = w; c.height = h + bar; const g = c.getContext('2d');
    g.drawImage(ph.cv, 0, 0, w, h);
    const sx = split == null ? 0 : Math.round(w * split / 100); if (sx < w) g.drawImage(k3, sx, 0, w - sx, h, sx, 0, w - sx, h);
    if (split != null && split > 0 && split < 100) {
      g.fillStyle = '#fff'; g.fillRect(sx - 2, 0, 4, h); const fs = Math.round(h * .032); g.font = `700 ${fs}px system-ui, sans-serif`;
      [['VORHER', 16, 'rgba(0,0,0,.55)'], ['NACHHER', w - 16, 'rgba(0,0,0,.55)']].forEach(([t, x, bg], i) => { const tw = g.measureText(t).width + fs * 1.2; const bx = i ? x - tw : x; g.fillStyle = bg; g.fillRect(bx, 16, tw, fs * 1.9); g.fillStyle = '#fff'; g.fillText(t, bx + fs * .6, 16 + fs * 1.33); });
    }
    if (bar) { g.fillStyle = '#16130f'; g.fillRect(0, h, w, bar); g.fillStyle = '#f3eee6'; g.font = `600 ${Math.round(bar * .42)}px Georgia, serif`; g.textBaseline = 'middle'; const LG = KP.logo; if (LG && LG.naturalWidth) { const lh = bar * .78, lw = lh * LG.naturalWidth / LG.naturalHeight; g.drawImage(LG, bar * .35, h + (bar - lh) / 2, lw, lh); } else g.fillText(KP.studio, bar * .5, h + bar / 2); g.font = `${Math.round(bar * .3)}px system-ui, sans-serif`; g.fillStyle = '#c9c0b4'; g.textAlign = 'right'; g.fillText('Geplante Küche im eigenen Raumfoto · Darstellung zur Orientierung', w - bar * .5, h + bar / 2); }
    return c;
  }
  const blob = (c, q = .86) => new Promise(r => c.toBlob(r, 'image/jpeg', q));
  async function save() { if (!pose) { flash('Bitte erst den Boden markieren („Boden anpassen“).'); return; } const c = compose(cmpOn ? cmp : null); const a = document.createElement('a'); a.download = 'meine-kueche-im-raum.jpg'; a.href = c.toDataURL('image/jpeg', .9); document.body.appendChild(a); a.click(); a.remove(); flash('Bild gespeichert.'); }
  async function share() { if (!pose) return; const b = await blob(compose(cmpOn ? cmp : null)), f = new File([b], 'meine-kueche-im-raum.jpg', { type: 'image/jpeg' }); try { await navigator.share({ files: [f], title: 'Meine Küche im Raum', text: 'Meine geplante Küche – ' + KP.studio }); } catch (e) { } }
  async function attach() {
    if (!pose) { flash('Bitte erst den Boden markieren („Boden anpassen“).'); return; }
    const btn = $('[data-attach]', el); btn.disabled = true; btn.textContent = 'Wird angehängt …';
    try {
      const after = compose(null), s0 = Math.min(1, 2000 / Math.max(ph.w, ph.h)), o = document.createElement('canvas'); o.width = Math.round(ph.w * s0); o.height = Math.round(ph.h * s0); o.getContext('2d').drawImage(ph.cv, 0, 0, o.width, o.height);
      const [bo, ba] = await Promise.all([blob(o), blob(after)]);
      const t = document.createElement('canvas'), tw = 360; t.width = tw; t.height = Math.round(tw * after.height / after.width); t.getContext('2d').drawImage(after, 0, 0, t.width, t.height);
      KP.setAttach({ files: [new File([bo], 'raumfoto-vorher.jpg', { type: 'image/jpeg' }), new File([ba], 'raumfoto-mit-kueche.jpg', { type: 'image/jpeg' })], thumb: t.toDataURL('image/jpeg', .8) });
      close(); KP.toSend(); KP.toast('Ihr Raumfoto mit Küche hängt jetzt an der Anfrage – Vorher und Nachher.');
    } finally { btn.disabled = false; btn.textContent = 'Mit meiner Anfrage senden'; }
  }
  function flash(m) { KP.toast(m); }

  window.KPF = { _drop: () => { const ok = settleDrop(); return ok; }, open, close, _solve: () => pose, _pts: () => pts, _set: p => { pts = p; update(); }, _rig: () => ({ ...rig }), _setRig: (r, drag) => { if (drag) dragUI = true; rig = constrain({ ...rig, ...r }); update(); return { ...rig, snaps: [...snapW] }; }, _det: () => det, _face: () => face, _setFace: setFace, _fp: () => fp, _mode: () => mode, _cmp: v => { setCmpOn(true, true); setCmp(v); return host.style.clipPath; } };
})();
