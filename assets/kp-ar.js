/* Küchenplaner – „Live in Ihrem Raum“ (AR) · Entwurf Falcon Eye
   Wie bei großen Online-Shops: Handy auf den Boden richten, die geplante Küche steht in Originalgröße im Raum.
   Mit einem Finger verschieben, mit zwei Fingern drehen und größer oder kleiner ziehen, drumherum laufen.
   Android: WebXR (Chrome mit Google Play-Dienste für AR) · iPhone/iPad: AR Quick Look (das Modell wird im Gerät umgewandelt).
   Am PC: 3D-Vorschau zum Drehen und ein QR-Code, der dieselbe Planung am Handy öffnet.
   Alles läuft im Browser, die Planung verlässt das Gerät nicht. model-viewer liegt auf dem eigenen Server (kein fremder Dienst). */
(function () {
  'use strict';
  const KP = window.KP; if (!KP || window.KPAR) return;
  const $ = (s, r = document) => r.querySelector(s);
  const VER = ((document.querySelector('script[src*="kp-ar.js"]') || {}).src || '').split('v=')[1] || '1';
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const MOBILE = matchMedia('(pointer: coarse)').matches;
  const load = (src, test) => new Promise((res, rej) => { if (test()) return res(); const s = document.createElement('script'); s.src = src; s.onload = () => test() ? res() : rej(new Error(src)); s.onerror = () => rej(new Error(src)); document.head.appendChild(s); });
  const loadMV = () => customElements.get('model-viewer') ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.type = 'module'; s.src = 'assets/mv/model-viewer.min.js?v=' + VER; s.onerror = () => rej(new Error('mv')); document.head.appendChild(s); customElements.whenDefined('model-viewer').then(res); setTimeout(() => rej(new Error('mv-timeout')), 30000); });
  const fmt = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
  let el, mv, url = null, busy = false, back = null;

  const CSS = `
.kpar{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;background:#14110e;color:#f3eee6;font-family:inherit}
.kpar[hidden]{display:none}
.kpar-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px 12px 18px;border-bottom:1px solid rgba(255,255,255,.08)}
.kpar-top b{display:block;font-size:17px}.kpar-top span{font-size:12.5px;color:#b9b0a2}
.kpar-x{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;display:grid;place-items:center}
.kpar-x svg{width:18px;height:18px}
.kpar-body{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 360px;min-height:0}
.kpar-stage{position:relative;min-height:0;background:radial-gradient(90% 80% at 50% 35%,#3a332b,#17140f)}
.kpar-stage model-viewer{width:100%;height:100%;--poster-color:transparent;--progress-bar-color:var(--kpar-acc)}
.kpar-busy{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:#d9d2c6;font-size:15px}
.kpar-busy i{display:block;width:44px;height:44px;margin:0 auto 12px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:var(--kpar-acc);animation:kparSpin 1s linear infinite}
@keyframes kparSpin{to{transform:rotate(360deg)}}
.kpar-side{padding:20px 20px 24px;border-left:1px solid rgba(255,255,255,.08);overflow:auto;display:flex;flex-direction:column;gap:14px}
.kpar-side h2{margin:0;font-size:22px;line-height:1.2}.kpar-side p{margin:0;color:#cfc6b8;line-height:1.55;font-size:15px}
.kpar-size{display:flex;gap:8px;flex-wrap:wrap}.kpar-size span{padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.08);font-size:13.5px}
.kpar-go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:16px 18px;border:0;border-radius:16px;background:var(--kpar-acc);color:#fff;font:600 17px inherit;font-family:inherit;cursor:pointer;box-shadow:0 18px 40px -18px var(--kpar-acc);animation:kparPulse 2.2s ease-in-out infinite}
.kpar-go svg{width:24px;height:24px}
@keyframes kparPulse{50%{transform:scale(1.03)}}
.kpar-steps{margin:0;padding:0;list-style:none;display:grid;gap:8px}.kpar-steps li{display:flex;gap:10px;align-items:flex-start;color:#d9d2c6;font-size:14.5px;line-height:1.45}
.kpar-steps b{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);font-size:12.5px}
.kpar-qr{display:flex;gap:14px;align-items:center;padding:14px;border-radius:16px;background:#fff;color:#1c1a17}
.kpar-qr img{flex:none;width:132px;height:132px;image-rendering:pixelated}.kpar-qr p{color:#4b453d;font-size:14px}
.kpar-note{font-size:12.5px!important;color:#9f978a!important}
.kpar-err{padding:12px 14px;border-radius:12px;background:rgba(208,0,26,.16);color:#ffd9d9!important}
.kpar-alt{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:12px;padding:12px 14px;font:600 15px inherit;font-family:inherit;cursor:pointer}
@media (max-width:860px){.kpar-body{grid-template-columns:1fr;grid-template-rows:minmax(260px,1fr) auto}.kpar-side{border-left:0;border-top:1px solid rgba(255,255,255,.08);padding:16px 16px calc(16px + env(safe-area-inset-bottom))}.kpar-side h2{font-size:19px}.kpar-hide-m{display:none}}
@media (prefers-reduced-motion:reduce){.kpar-go{animation:none}.kpar-busy i{animation-duration:3s}}`;
  const ICO = {
    x: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    ar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4.4 7.4L12 11.8l7.6-4.4M12 11.8v9.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  };

  function build() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    el = document.createElement('div'); el.className = 'kpar'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kpar-t');
    el.style.setProperty('--kpar-acc', KP.acc || '#7f7d4c');
    el.innerHTML = `
<div class="kpar-top"><div><b id="kpar-t">Live in Ihrem Raum</b><span>Ihre geplante Küche in Originalgröße – mit der Handykamera.</span></div><button type="button" class="kpar-x" data-x aria-label="Schließen">${ICO.x}</button></div>
<div class="kpar-body">
  <div class="kpar-stage" data-stage><div class="kpar-busy" data-busy><div><i></i>Ihre Küche wird vorbereitet …</div></div></div>
  <div class="kpar-side" data-side></div>
</div>`;
    document.body.appendChild(el);
    $('[data-x]', el).addEventListener('click', close);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  }

  function side(html) { $('[data-side]', el).innerHTML = html; }
  function shareUrl() { const h = (KP.hash && KP.hash()) || ''; return location.origin + location.pathname + '?ar=1' + h; }
  function qrImg(text) {
    try { const q = window.qrcode(0, 'L'); q.addData(text); q.make(); return q.createDataURL(4, 2); } catch (e) { return ''; }
  }

  async function open() {
    if (!el) build();
    if (busy) return; busy = true;
    back = document.activeElement; el.hidden = false; document.documentElement.classList.add('kpar-on'); KP.pause3d && KP.pause3d(true);
    const stage = $('[data-stage]', el); $('[data-busy]', el).hidden = false; if (mv) { mv.remove(); mv = null; }
    side('<h2>Einen Moment …</h2><p>Ich baue Ihre Küche als 3D-Modell in Originalgröße. Das dauert nur ein paar Sekunden.</p>');
    requestAnimationFrame(() => { const x = $('[data-x]', el); x && x.focus({ preventScroll: true }); });
    try {
      if (KP.renderHQ) await KP.renderHQ(16, 10).catch(() => null);   // sorgt dafür, dass die 3D-Ansicht geladen ist
      const K = KP.k3d && KP.k3d(); if (!K || !K._rt) throw new Error('3D');
      if (K.openAll) K.openAll(false);
      await Promise.all([load('assets/kp-arx.js?v=' + VER, () => !!window.KPARX), loadMV(), MOBILE ? Promise.resolve() : load('assets/qrcode.js?v=' + VER, () => !!window.qrcode)]);
      const r = await window.KPARX.build(K._rt());
      if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(r.blob);
      mv = document.createElement('model-viewer');
      Object.entries({ src: url, alt: 'Ihre geplante Küche in 3D', ar: '', 'ar-modes': 'webxr quick-look', 'ar-scale': 'auto', 'ar-placement': 'floor', 'camera-controls': '', 'touch-action': 'pan-y', 'shadow-intensity': '1', 'shadow-softness': '.8', exposure: '1.05', 'environment-image': 'neutral', 'camera-orbit': '-25deg 70deg auto', 'interaction-prompt': 'auto', 'xr-environment': '' }).forEach(([k, v]) => mv.setAttribute(k, v));
      const btn = document.createElement('button'); btn.slot = 'ar-button'; btn.hidden = true; mv.appendChild(btn);   // eigener großer Knopf rechts
      stage.appendChild(mv);
      await new Promise(res => { mv.addEventListener('load', res, { once: true }); setTimeout(res, 15000); });
      $('[data-busy]', el).hidden = true;
      const size = `<div class="kpar-size"><span>${fmt(r.size.w)} m breit</span><span>${fmt(r.size.d)} m tief</span><span>${fmt(r.size.h)} m hoch</span></div>`;
      const can = !!mv.canActivateAR;
      if (can) {
        side(`<h2>Ihre Küche ist bereit.</h2>${size}
<button type="button" class="kpar-go" data-go>${ICO.ar}<span>In Ihrem Raum platzieren</span></button>
<ol class="kpar-steps"><li><b>1</b>Handy auf den Boden richten und langsam etwas hin und her bewegen, bis der Boden erkannt ist.</li><li><b>2</b>Die Küche steht in Originalgröße im Raum. <strong>Ein Finger</strong> verschiebt sie, <strong>zwei Finger</strong> drehen sie und machen sie größer oder kleiner.</li><li><b>3</b>Laufen Sie einfach drumherum. ${IOS ? 'Mit dem Auslöser machen Sie ein Foto.' : 'Mit dem Zurück-Pfeil geht es zurück zum Planer.'}</li></ol>
<p class="kpar-note">Darstellung zur Orientierung – Maße und Details plant ${KP.person || 'das Studio'} mit Ihnen millimetergenau.</p>`);
        $('[data-go]', el).addEventListener('click', () => { try { mv.activateAR(); } catch (e) { } });
        mv.addEventListener('ar-status', e => { if (e.detail && e.detail.status === 'failed') side(`<h2>Das hat leider nicht geklappt.</h2><p class="kpar-err">Ihr Handy konnte die Kamera-Ansicht nicht starten. Unter Android braucht es die App „Google Play-Dienste für AR“.</p><button type="button" class="kpar-alt" data-foto>Stattdessen ein Foto Ihres Raums nutzen</button>`) || bindFoto(); });
      } else if (MOBILE) {
        side(`<h2>Ihre Küche in 3D</h2>${size}<p class="kpar-err">Dieses Handy oder dieser Browser kann die Kamera-Ansicht leider nicht öffnen. Am iPhone klappt es mit Safari, unter Android mit Chrome.</p><p>Drehen Sie die Küche hier mit dem Finger – oder setzen Sie sie in ein Foto Ihres Raums:</p><button type="button" class="kpar-alt" data-foto>Mit einem Foto Ihres Raums</button>`);
        bindFoto();
      } else {
        const u = shareUrl(), q = u.length < 2200 ? qrImg(u) : '';
        side(`<h2>Ihre Küche in 3D</h2>${size}<p>Mit der Maus drehen, mit dem Mausrad näher heran. <b>Live in Ihrem Raum</b> geht mit dem Handy:</p>
${q ? `<div class="kpar-qr"><img src="${q}" alt="QR-Code: diese Planung am Handy öffnen"><p>Mit der Handykamera scannen – Ihre Planung öffnet sich dort direkt, dann auf <b>In Ihrem Raum platzieren</b> tippen.</p></div>` : '<p>Öffnen Sie diese Seite am Handy und tippen Sie dort auf „Live im Raum“.</p>'}
<button type="button" class="kpar-alt" data-foto>Oder: Küche in ein Foto Ihres Raums setzen</button>`);
        bindFoto();
      }
    } catch (e) {
      $('[data-busy]', el).hidden = true;
      side(`<h2>Das hat leider nicht geklappt.</h2><p class="kpar-err">Die 3D-Ansicht konnte nicht vorbereitet werden. Laden Sie die Seite bitte einmal neu.</p><button type="button" class="kpar-alt" data-foto>Stattdessen ein Foto Ihres Raums nutzen</button>`); bindFoto();
    } finally { busy = false; }
  }
  function bindFoto() { const b = $('[data-foto]', el); if (b) b.addEventListener('click', () => { close(); const o = document.querySelector('[data-kpf-open]:not([data-kpf-sample])'); if (o) o.click(); }); return true; }
  function close() {
    if (!el || el.hidden) return; el.hidden = true; document.documentElement.classList.remove('kpar-on'); KP.pause3d && KP.pause3d(false);
    if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (e) { }
  }
  window.KPAR = { open, close };
})();
