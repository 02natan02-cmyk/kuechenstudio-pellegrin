/* Feedback in Klick-Karten – freiwillig, ohne Name und ohne E-Mail-Adresse des Absenders.
   Einbinden:  <script src="assets/fe-feedback.js" data-mail="…" data-site="Name der Seite" data-topic="Küchenplaner" data-art="der" defer></script>
   Optional:   data-anrede="du" · data-accent="#b5632f" · data-good="A|B|C" · data-wish="A|B|C" · data-bottom="22" · data-bottom-m="96" (Abstand der Einladung unten in px, Handy bis 760 px)
   Öffnen:     Element mit data-fe-fb (Wert = Thema) anklicken · FEFeedback.open({ topic, art }) · FEFeedback.invite({ topic, art }) = kleine Einladung, höchstens einmal pro Besuch */
(function () {
  'use strict';
  if (window.FEFeedback) return;
  var S = document.currentScript || document.querySelector('script[src*="fe-feedback"]'), D = (S && S.dataset) || {};
  var MAIL = D.mail || '', SITE = D.site || document.title, DU = D.anrede === 'du', ACC = D.accent || '#b5632f';
  var GOOD = (D.good || 'Einfach zu bedienen|Sieht richtig gut aus|Die 3D-Ansicht|Schnell am Ziel').split('|');
  var WISH = (D.wish || 'Mehr Auswahl|Hilfe-Video|Preis-Schätzung|Etwas anderes').split('|');
  var HAKT = ['Nein, alles lief rund', 'War mal langsam', 'Hat sich aufgehängt', 'Etwas nicht gefunden', 'Am Handy umständlich', 'Etwas war unklar'];
  var FACES = [[5, 'Super', '#2e9e5b'], [4, 'Gut', '#7bb33a'], [3, 'Geht so', '#e0a92a'], [2, 'Eher nicht', '#ec8338'], [1, 'Schlecht', '#de4f3c']];
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Y = DU ? { dir: 'dich', dat: 'dir', poss: 'Deine', imp: 'Schreib', you: 'du' } : { dir: 'Sie', dat: 'Ihnen', poss: 'Ihre', imp: 'Schreiben Sie', you: 'Sie' };
  var store = {
    get: function (k) { try { return sessionStorage.getItem('fefb:' + k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem('fefb:' + k, v); } catch (e) { } }
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- Aussehen ---------- */
  var css = '' +
    '.fefb,.fefb *{box-sizing:border-box}.fefb{--a:' + ACC + ';position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;padding:16px;font:inherit;color:#1d1b19;-webkit-tap-highlight-color:transparent}' +
    '.fefb[hidden]{display:none}.fefb-bg{position:absolute;inset:0;background:rgba(20,16,12,.48);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .3s}.fefb.in .fefb-bg{opacity:1}' +
    '.fefb-card{position:relative;width:100%;max-width:460px;max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:#fffdf9;border-radius:22px;padding:22px 22px 20px;box-shadow:0 30px 80px rgba(0,0,0,.35);transform:translateY(24px) scale(.97);opacity:0;transition:transform .45s cubic-bezier(.2,.9,.25,1.15),opacity .3s}' +
    '.fefb.in .fefb-card{transform:none;opacity:1}' +
    '.fefb-top{display:flex;align-items:center;gap:10px;margin-bottom:14px}.fefb-bar{flex:1;height:6px;border-radius:9px;background:rgba(0,0,0,.08);overflow:hidden}.fefb-bar i{display:block;height:100%;width:0;background:var(--a);border-radius:9px;transition:width .5s cubic-bezier(.3,.9,.3,1)}' +
    '.fefb-x{border:0;background:rgba(0,0,0,.06);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;color:#4a443d}.fefb-x:hover{background:rgba(0,0,0,.12)}' +
    '.fefb-step{animation:fefbIn .45s cubic-bezier(.2,.9,.25,1)}@keyframes fefbIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}' +
    '.fefb h2{font-size:clamp(20px,5.2vw,25px);line-height:1.2;margin:2px 0 6px;font-weight:700;letter-spacing:-.01em;outline:none}.fefb p{margin:0 0 14px;color:#5e564d;font-size:15px;line-height:1.45}' +
    '.fefb-faces{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0 4px}.fefb-face{border:0;background:none;cursor:pointer;padding:8px 2px 6px;border-radius:16px;display:flex;flex-direction:column;align-items:center;gap:6px;font:inherit;font-size:12.5px;color:#4a443d;transition:transform .2s,background .2s}' +
    '.fefb-face svg{width:100%;max-width:58px;height:auto;transition:transform .25s cubic-bezier(.3,1.6,.5,1)}.fefb-face:hover svg,.fefb-face:focus-visible svg{transform:scale(1.14) rotate(-4deg)}.fefb-face:focus-visible{outline:2px solid var(--a);outline-offset:2px}' +
    '.fefb-face.on{background:rgba(0,0,0,.05)}.fefb-face.on svg{transform:scale(1.22)}.fefb-face .eye{transform-box:fill-box;transform-origin:center;animation:fefbBl 4.2s infinite}.fefb-face:nth-child(2) .eye{animation-delay:.7s}.fefb-face:nth-child(3) .eye{animation-delay:1.9s}.fefb-face:nth-child(4) .eye{animation-delay:2.6s}.fefb-face:nth-child(5) .eye{animation-delay:3.3s}' +
    '@keyframes fefbBl{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    '.fefb-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 14px}.fefb-chip{border:1.5px solid rgba(0,0,0,.14);background:#fff;border-radius:999px;padding:10px 14px;font:inherit;font-size:14.5px;line-height:1.2;color:#2a2622;cursor:pointer;transition:transform .15s,background .2s,border-color .2s,color .2s}' +
    '.fefb-chip:hover{border-color:var(--a)}.fefb-chip:active{transform:scale(.95)}.fefb-chip.on{background:var(--a);border-color:var(--a);color:#fff}.fefb-chip.on::before{content:"✓ "}.fefb-chip:focus-visible{outline:2px solid var(--a);outline-offset:2px}' +
    '.fefb textarea{width:100%;min-height:74px;resize:vertical;border:1.5px solid rgba(0,0,0,.14);border-radius:14px;padding:11px 13px;font:inherit;font-size:16px;line-height:1.4;color:#2a2622;background:#fff;margin-bottom:6px}.fefb textarea:focus{outline:none;border-color:var(--a)}' +
    '.fefb-note{font-size:12.5px!important;color:#8a8076!important;margin-bottom:12px!important}' +
    '.fefb-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px}.fefb-go{border:0;background:var(--a);color:#fff;font:inherit;font-weight:700;font-size:15.5px;padding:13px 22px;border-radius:999px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);transition:transform .15s,filter .2s}.fefb-go:hover{filter:brightness(1.07)}.fefb-go:active{transform:scale(.97)}.fefb-go[disabled]{opacity:.55;cursor:default}' +
    '.fefb-skip{border:0;background:none;font:inherit;font-size:14px;color:#7a7067;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:8px 4px}' +
    '.fefb-err{color:#b23a2a!important;font-weight:600}' +
    '.fefb-done{text-align:center;padding:10px 0 4px}.fefb-done .big{font-size:58px;line-height:1;display:block;margin:6px 0 10px;animation:fefbPop .7s cubic-bezier(.3,1.7,.5,1)}@keyframes fefbPop{from{transform:scale(.2) rotate(-30deg);opacity:0}to{transform:none;opacity:1}}' +
    '.fefb-cf{position:absolute;left:50%;top:38%;width:9px;height:14px;border-radius:2px;pointer-events:none;animation:fefbCf 1.5s cubic-bezier(.15,.7,.4,1) forwards}@keyframes fefbCf{from{transform:translate(-50%,-50%) rotate(0);opacity:1}to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}' +
    '.fefb-inv{--a:' + ACC + ';position:fixed;left:50%;bottom:calc(var(--b,22px) + env(safe-area-inset-bottom,0px));z-index:2147481999;width:min(430px,calc(100vw - 24px));transform:translate(-50%,140%);transition:transform .55s cubic-bezier(.2,.9,.25,1.1);background:#fffdf9;color:#1d1b19;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);padding:14px 14px 14px 16px;display:flex;gap:12px;align-items:center;font:inherit}' +
    '.fefb-inv.in{transform:translate(-50%,0)}.fefb-inv .ic{flex:0 0 44px;height:44px;border-radius:50%;background:var(--a);display:grid;place-items:center;animation:fefbWv 2.4s ease-in-out infinite}.fefb-inv .ic svg{width:28px;height:28px}@keyframes fefbWv{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-12deg)}84%{transform:rotate(10deg)}92%{transform:rotate(-6deg)}}' +
    '.fefb-inv .tx{flex:1;min-width:0;font-size:14px;line-height:1.35}.fefb-inv .tx b{display:block;font-size:15px;margin-bottom:2px}.fefb-inv .bt{display:flex;flex-direction:column;gap:4px;align-items:stretch}.fefb-inv .fefb-go{padding:10px 15px;font-size:14px;box-shadow:none;white-space:nowrap}.fefb-inv .fefb-skip{padding:3px;font-size:13px}' +
    'html.fefb-lock,html.fefb-lock body{overflow:hidden!important}' +
    '@media (max-width:760px){.fefb-inv{bottom:calc(var(--bm,var(--b,22px)) + env(safe-area-inset-bottom,0px))}}' +
    '@media (max-width:560px){.fefb{align-items:flex-end;padding:0}.fefb-card{max-width:none;border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));max-height:92dvh;transform:translateY(100%)}.fefb-face{font-size:11.5px}}' +
    '@media (prefers-reduced-motion:reduce){.fefb *,.fefb-inv,.fefb-inv *{animation:none!important;transition:none!important}}';
  function addCss() { if (document.getElementById('fefb-css')) return; var st = document.createElement('style'); st.id = 'fefb-css'; st.textContent = css; document.head.appendChild(st); }

  function face(lv, col) {
    var m = { 5: 'M17 34 Q30 47 43 34', 4: 'M18 35 Q30 42 42 35', 3: 'M19 37 L41 37', 2: 'M19 40 Q30 33 41 40', 1: 'M18 42 Q30 31 42 42' }[lv];
    var br = lv === 1 ? '<path d="M15 18 L24 21M45 18 L36 21" stroke="#3a2a20" stroke-width="2.6" stroke-linecap="round"/>' : '';
    var ck = lv >= 4 ? '<circle cx="15" cy="33" r="4" fill="#fff" opacity=".28"/><circle cx="45" cy="33" r="4" fill="#fff" opacity=".28"/>' : '';
    return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="27" fill="' + col + '"/><circle cx="30" cy="30" r="27" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>' + ck + br +
      '<ellipse class="eye" cx="21.5" cy="25" rx="3.4" ry="4.4" fill="#2b1d14"/><ellipse class="eye" cx="38.5" cy="25" rx="3.4" ry="4.4" fill="#2b1d14"/><path d="' + m + '" fill="none" stroke="#2b1d14" stroke-width="3.4" stroke-linecap="round"/></svg>';
  }
  var BUB = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 6.5h18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" fill="#fff"/><circle cx="10" cy="13" r="1.6" fill="' + ACC + '"/><circle cx="14" cy="13" r="1.6" fill="' + ACC + '"/><circle cx="18" cy="13" r="1.6" fill="' + ACC + '"/></svg>';

  /* ---------- Ablauf ---------- */
  var el = null, inv = null, st = null, back = null, lenisWas = false;
  function phrase(o) { return (o.art ? o.art + ' ' : '') + o.topic; }
  function open(opts) {
    opts = opts || {}; addCss(); hideInvite(true);
    var o = { topic: opts.topic || D.topic || 'Seite', art: opts.art != null ? opts.art : (D.art != null ? D.art : 'die') };
    st = { o: o, step: 0, face: null, good: [], hakt: [], wish: [], text: '' };
    if (!el) { el = document.createElement('div'); el.className = 'fefb'; el.setAttribute('data-lenis-prevent', ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'fefb-h'); document.body.appendChild(el); bind(); }
    back = document.activeElement; el.hidden = false; document.documentElement.classList.add('fefb-lock');
    try { if (window.__lenis) { lenisWas = true; window.__lenis.stop(); } } catch (e) { }
    render(); requestAnimationFrame(function () { el.classList.add('in'); focusH(); });
  }
  function close() {
    if (!el || el.hidden) return; el.classList.remove('in'); document.documentElement.classList.remove('fefb-lock');
    try { if (lenisWas && window.__lenis) window.__lenis.start(); } catch (e) { } lenisWas = false;
    if (st && st.step < 4) store.set(st.o.topic, 'later');
    setTimeout(function () { el.hidden = true; el.innerHTML = ''; }, RM ? 0 : 320);
    try { if (back && back.focus) back.focus({ preventScroll: true }); } catch (e) { }
  }
  function focusH() { var h = el.querySelector('h2'); if (h) try { h.focus({ preventScroll: true }); } catch (e) { } }
  function chips(list, sel, key) { return '<div class="fefb-chips" role="group">' + list.map(function (t) { return '<button type="button" class="fefb-chip' + (sel.indexOf(t) >= 0 ? ' on' : '') + '" aria-pressed="' + (sel.indexOf(t) >= 0) + '" data-' + key + '="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>'; }
  function render() {
    var o = st.o, P = phrase(o), h = '', n = st.step;
    var top = '<div class="fefb-top"><div class="fefb-bar" aria-hidden="true"><i style="width:' + Math.min(100, n * 25 + (n < 4 ? 8 : 0)) + '%"></i></div><button type="button" class="fefb-x" data-x aria-label="Schließen">×</button></div>';
    if (n === 0) h = '<h2 id="fefb-h" tabindex="-1">Wie war ' + esc(P) + ' für ' + Y.dir + '?</h2><p>Ein Tipp genügt – ' + (DU ? 'du hilfst' : 'Sie helfen') + ' uns, besser zu werden.</p><div class="fefb-faces" role="group" aria-label="Bewertung">' +
      FACES.map(function (f) { return '<button type="button" class="fefb-face' + (st.face === f[0] ? ' on' : '') + '" data-face="' + f[0] + '" aria-label="' + f[1] + '">' + face(f[0], f[2]) + '<span>' + f[1] + '</span></button>'; }).join('') + '</div>';
    else if (n === 1) h = '<h2 id="fefb-h" tabindex="-1">Was hat ' + Y.dat + ' gefallen?</h2><p>Mehrere Antworten möglich.</p>' + chips(GOOD, st.good, 'good') + nav('Weiter');
    else if (n === 2) h = '<h2 id="fefb-h" tabindex="-1">Hat irgendwo etwas gehakt?</h2><p>Ehrlich sein ist erwünscht – genau das wollen wir wissen.</p>' + chips(HAKT, st.hakt, 'hakt') + nav('Weiter');
    else if (n === 3) h = '<h2 id="fefb-h" tabindex="-1">Was fehlt ' + Y.dat + ' noch?</h2><p>Welche Funktion ' + (DU ? 'wünschst du dir' : 'wünschen Sie sich') + '?</p>' + chips(WISH, st.wish, 'wish') +
      '<textarea maxlength="300" data-text aria-label="' + Y.poss + ' Idee" placeholder="' + Y.poss + ' Idee in einem Satz (freiwillig)">' + esc(st.text) + '</textarea><p class="fefb-note">Bitte keine Namen oder Telefonnummern – das Feedback kommt ohne Absender bei uns an.</p><p class="fefb-err" data-err hidden></p>' + nav('Abschicken', 1);
    else h = '<div class="fefb-done"><span class="big" aria-hidden="true">🎉</span><h2 id="fefb-h" tabindex="-1">Danke!</h2><p>' + Y.poss + ' Antworten sind angekommen – damit wird ' + esc(P) + ' noch besser.</p><button type="button" class="fefb-go" data-x>Schließen</button></div>';
    el.innerHTML = '<div class="fefb-bg" data-x></div><div class="fefb-card">' + top + '<div class="fefb-step">' + h + '</div></div>';
    if (n === 4) confetti();
  }
  function nav(label, send) { return '<div class="fefb-row"><button type="button" class="fefb-skip" data-skip>' + (send ? 'Ohne Wunsch abschicken' : 'Überspringen') + '</button><button type="button" class="fefb-go" data-next' + (send ? ' data-send' : '') + '>' + label + ' →</button></div>'; }
  function toggle(arr, t, excl) { var i = arr.indexOf(t); if (i >= 0) arr.splice(i, 1); else { if (excl && t === excl) arr.length = 0; else if (excl) { var j = arr.indexOf(excl); if (j >= 0) arr.splice(j, 1); } arr.push(t); } }
  function go(n) { st.step = n; render(); focusH(); }
  function bind() {
    el.addEventListener('click', function (e) {
      var t = e.target.closest('button,[data-x]'); if (!t) return;
      if (t.hasAttribute('data-x')) return close();
      if (t.dataset.face) { st.face = +t.dataset.face; t.classList.add('on'); setTimeout(function () { go(1); }, RM ? 0 : 380); return; }
      if (t.dataset.good != null) { toggle(st.good, t.dataset.good); t.classList.toggle('on'); t.setAttribute('aria-pressed', t.classList.contains('on')); return; }
      if (t.dataset.hakt != null) { toggle(st.hakt, t.dataset.hakt, HAKT[0]); el.querySelectorAll('[data-hakt]').forEach(function (b) { var on = st.hakt.indexOf(b.dataset.hakt) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); return; }
      if (t.dataset.wish != null) { toggle(st.wish, t.dataset.wish); t.classList.toggle('on'); t.setAttribute('aria-pressed', t.classList.contains('on')); return; }
      if (t.hasAttribute('data-skip') || t.hasAttribute('data-next')) { if (st.step === 3) return submit(t.hasAttribute('data-skip')); return go(st.step + 1); }
    });
    el.addEventListener('input', function (e) { if (e.target.hasAttribute('data-text')) st.text = e.target.value; });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') { var f = [].slice.call(el.querySelectorAll('button,textarea')).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
  }
  function submit(noWish) {
    var b = el.querySelector('[data-send]'), er = el.querySelector('[data-err]'); if (b) { b.disabled = true; b.textContent = 'Wird gesendet …'; }
    var f = FACES.filter(function (x) { return x[0] === st.face; })[0];
    var data = { _subject: 'Feedback: ' + st.o.topic + ' – ' + SITE, _template: 'table', _captcha: 'false', Seite: SITE, Bereich: st.o.topic,
      Eindruck: f ? f[0] + ' von 5 (' + f[1] + ')' : 'keine Angabe', 'Hat gefallen': st.good.join(', ') || '–', 'Hat gehakt': st.hakt.join(', ') || '–',
      'Wünsche': noWish ? '–' : (st.wish.join(', ') || '–'), Idee: noWish ? '–' : (st.text.trim().slice(0, 300) || '–') };
    var ok = function () { store.set(st.o.topic, 'done'); go(4); };
    if (!MAIL || /[?&]fefb=test/.test(location.search)) { window.__fefbLast = data; return ok(); }
    fetch('https://formsubmit.co/ajax/' + MAIL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data), credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json().catch(function () { return {}; }); })
      .then(function (j) { if (j && (j.success === false || j.success === 'false')) throw new Error('fs'); ok(); })
      .catch(function () { if (b) { b.disabled = false; b.textContent = 'Nochmal versuchen →'; } if (er) { er.hidden = false; er.textContent = 'Das hat gerade nicht geklappt – bitte gleich nochmal versuchen.'; } });
  }
  function confetti() {
    if (RM) return; var c = el.querySelector('.fefb-card'), cols = [ACC, '#f2c94c', '#2e9e5b', '#e0533d', '#4a8fd8'];
    for (var i = 0; i < 34; i++) { var p = document.createElement('i'); p.className = 'fefb-cf'; var a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170;
      p.style.cssText = 'background:' + cols[i % cols.length] + ';--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d * .8 + 60) + 'px;--r:' + Math.round(Math.random() * 720 - 360) + 'deg;animation-delay:' + (Math.random() * .15).toFixed(2) + 's';
      c.appendChild(p); }
  }
  /* ---------- Einladung ---------- */
  var invT = 0;
  function invite(opts) {
    opts = opts || {}; var topic = opts.topic || D.topic || 'Seite', art = opts.art != null ? opts.art : (D.art != null ? D.art : 'die');
    if (store.get(topic) || (el && !el.hidden) || inv) return false; addCss();
    inv = document.createElement('div'); inv.className = 'fefb-inv'; inv.setAttribute('role', 'status'); if (D.bottom) inv.style.setProperty('--b', (+D.bottom || 22) + 'px'); if (D.bottomM) inv.style.setProperty('--bm', (+D.bottomM || 22) + 'px');
    inv.innerHTML = '<span class="ic">' + BUB + '</span><span class="tx"><b>Kurz gefragt: Wie war ' + esc(phrase({ topic: topic, art: art })) + '?</b>4 Klicks, 20 Sekunden – ' + (DU ? 'du hilfst' : 'Sie helfen') + ' uns, besser zu werden.</span><span class="bt"><button type="button" class="fefb-go" data-yes>Los geht’s</button><button type="button" class="fefb-skip" data-no>Später</button></span>';
    document.body.appendChild(inv); requestAnimationFrame(function () { requestAnimationFrame(function () { inv && inv.classList.add('in'); }); });
    inv.addEventListener('click', function (e) { if (e.target.closest('[data-yes]')) open({ topic: topic, art: art }); else if (e.target.closest('[data-no]')) { store.set(topic, 'later'); hideInvite(); } });
    clearTimeout(invT); invT = setTimeout(function () { hideInvite(); }, 16000); return true;
  }
  function hideInvite(now) { clearTimeout(invT); var x = inv; inv = null; if (!x) return; x.classList.remove('in'); setTimeout(function () { x.remove(); }, now || RM ? 0 : 600); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-fe-fb]'); if (!t) return; e.preventDefault(); open({ topic: t.getAttribute('data-fe-fb') || undefined, art: t.getAttribute('data-fe-fb-art') }); });
  window.FEFeedback = { open: open, close: close, invite: invite, version: '1.0' };
})();
