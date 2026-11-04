/* Küchenplaner – Wartezeit-Spiel „Schnippeljagd“ · Entwurf Falcon Eye
   Gemüse und Obst fliegen durchs Bild – mit Finger oder Maus durchschneiden. Porzellan nicht treffen (3 Leben).
   Im Hintergrund entwickelt sich live das eigene Küchenbild; oben läuft der Fortschritt, am Ende „Ansehen“.
   API: KPGame.open({ host, title, sub, acc, onShow(url), onClose }) · progress(f, canvas, restSek) · done(url) · fail(titel, text) · close() · isOpen() · playing()
   17.10.: Ist das Bild fertig, geht das Spiel von selbst aus – wer gerade mitten in einer Runde ist, wird gefragt
   („Ihr Bild ist fertig – ansehen oder weiterspielen?“). */
(function () {
  'use strict';
  if (window.KPGame) return;
  const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const HS = 'kp-game-hs';
  const CSS = `
.kpg{position:absolute;inset:0;z-index:40;display:grid;grid-template-rows:auto 1fr;background:#0f0d0b;color:#fff;opacity:0;transition:opacity .35s ease;overflow:hidden;border-radius:inherit;touch-action:none;-webkit-user-select:none;user-select:none;font-family:var(--kpr-sans,system-ui,sans-serif)}
.kpg.on{opacity:1}
.kpg-top{position:relative;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(180deg,rgba(10,9,8,.86),rgba(10,9,8,.55));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.kpg-th{position:relative;flex:none;width:58px;height:38px;border-radius:9px;overflow:hidden;background:#2a2622;box-shadow:0 0 0 1px rgba(255,255,255,.12)}
.kpg-th canvas{width:100%;height:100%;display:block}
.kpg-ti{flex:1;min-width:0;display:grid;gap:3px}
.kpg-ti b{font:600 14px/1.2 var(--kpr-sans,system-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kpg-ti small{font-size:11.5px;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kpg-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:linear-gradient(90deg,var(--kpg-acc,#c0673f),#ffd59a);transition:width .5s ease;box-shadow:0 0 12px var(--kpg-acc,#c0673f)}
.kpg-go{flex:none;display:none;padding:9px 14px;border:0;border-radius:11px;background:var(--kpg-acc,#c0673f);color:#fff;font:700 13.5px var(--kpr-sans,system-ui);cursor:pointer;animation:kpgPulse 1.4s ease-in-out infinite}
.kpg.ready .kpg-go{display:block}
@media (max-width:520px){.kpg-top{gap:8px;padding:8px 10px}.kpg-th{width:48px;height:32px}.kpg-ib{width:34px;height:34px}.kpg.ready .kpg-ti small{display:none}.kpg-go{padding:9px 12px}}
.kpg-ib{flex:none;width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:11px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}
.kpg-ib svg{width:18px;height:18px}
.kpg-cv{position:relative;z-index:1;width:100%;height:100%;display:block;cursor:crosshair}
.kpg-hud{position:absolute;left:14px;right:14px;top:72px;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}
.kpg-sc{font:800 40px/1 var(--kpr-sans,system-ui);letter-spacing:-.02em;text-shadow:0 3px 14px rgba(0,0,0,.55)}
.kpg-sc small{display:block;margin-top:4px;font:600 11.5px var(--kpr-sans,system-ui);letter-spacing:.06em;text-transform:uppercase;opacity:.7}
.kpg-lv{display:flex;gap:6px}
.kpg-lv i{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#fff 0 45%,#2f63b5 46% 52%,#fff 53% 100%);box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .3s,opacity .3s}
.kpg-lv i.x{opacity:.2;transform:scale(.7) rotate(40deg)}
.kpg-card{position:absolute;left:50%;top:54%;z-index:4;width:min(380px,calc(100% - 32px));transform:translate(-50%,-50%);padding:24px 22px 20px;border-radius:22px;background:rgba(20,18,15,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 30px 80px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.08);text-align:center;transition:opacity .3s,transform .4s cubic-bezier(.2,1.2,.3,1)}
.kpg-card[hidden]{display:none}
.kpg-card h3{margin:0 0 6px;font:600 30px/1.05 var(--kpr-serif,Georgia,serif);letter-spacing:-.01em}
.kpg-card h3 em{font-style:italic;color:var(--kpg-acc2,#ffd59a)}
.kpg-card p{margin:0 auto 16px;max-width:30ch;font-size:14px;line-height:1.45;opacity:.82}
.kpg-card .kpg-demo{display:flex;justify-content:center;gap:10px;margin:2px 0 16px}
.kpg-card .kpg-demo canvas{width:46px;height:46px}
.kpg-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:170px;padding:14px 22px;border:0;border-radius:14px;background:var(--kpg-acc,#c0673f);color:#fff;font:700 15.5px var(--kpr-sans,system-ui);cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.35)}
.kpg-btn.sec{min-width:0;margin-left:8px;background:rgba(255,255,255,.12);box-shadow:none}
.kpg-hint{margin-top:12px;font-size:12px;opacity:.6}
.kpg-fin{display:block;width:min(240px,70%);margin:0 auto 14px;aspect-ratio:16/10;border-radius:14px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.14);animation:kpgTh .6s cubic-bezier(.2,1.3,.3,1)}
@keyframes kpgTh{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:none}}
.kpg-fin canvas{width:100%;height:100%;display:block}
.kpg-card.fin{animation:kpgIn .45s cubic-bezier(.2,1.2,.3,1)}
@keyframes kpgIn{0%{opacity:0;transform:translate(-50%,-46%) scale(.9)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
.kpg-flash{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:rgba(12,10,8,.55);opacity:0;transition:opacity .3s;pointer-events:none;font:800 26px/1.2 var(--kpr-sans,system-ui);text-align:center;text-shadow:0 3px 18px rgba(0,0,0,.5)}
.kpg-flash.on{opacity:1}
.kpg-pop{position:absolute;z-index:3;pointer-events:none;font:800 22px var(--kpr-sans,system-ui);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.6);transform:translate(-50%,-50%);animation:kpgPop 1s ease-out forwards;white-space:nowrap}
.kpg-pop.gold{color:#ffd86b}.kpg-pop.bad{color:#ff8a7a}
@keyframes kpgPop{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}15%{opacity:1;transform:translate(-50%,-60%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-150%) scale(1)}}
@keyframes kpgPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,213,154,.55)}50%{box-shadow:0 0 0 8px rgba(255,213,154,0)}}
.kpg.shake .kpg-cv{animation:kpgShake .35s}
@keyframes kpgShake{0%,100%{transform:none}20%{transform:translate(-6px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,2px)}80%{transform:translate(3px,-1px)}}
@media (prefers-reduced-motion:reduce){.kpg *{animation:none!important}}`;
  const ICO = {
    x: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    on: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor"/><path d="M13 7.2a4 4 0 0 1 0 5.6M15.2 5a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    off: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor"/><path d="M13.5 8l4 4M17.5 8l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  /* ---------------------------------------------------------------- Zeichnungen (je Sorte: ganz + Querschnitt) */
  // Alle Formen um (0,0), Radius r. g = CanvasRenderingContext2D
  const glossy = (g, r, x = -.32, y = -.38, a = .55) => { const h = g.createRadialGradient(r * x, r * y, 0, r * x, r * y, r * .55); h.addColorStop(0, `rgba(255,255,255,${a})`); h.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = h; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); };
  const ball = (g, r, c0, c1, c2) => { const gr = g.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r); gr.addColorStop(0, c0); gr.addColorStop(.6, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); };
  const TYPES = {
    tomato: { juice: '#e2341f', pts: 1, whole(g, r) { ball(g, r, '#ff8a6a', '#e3321f', '#9c1408'); glossy(g, r); g.save(); g.translate(0, -r * .74); g.fillStyle = '#3f7d2a'; for (let i = 0; i < 6; i++) { g.save(); g.rotate(i / 6 * TAU + .3); g.beginPath(); g.ellipse(0, -r * .17, r * .07, r * .2, 0, 0, TAU); g.fill(); g.restore(); } g.fillStyle = '#2f5f1f'; g.beginPath(); g.arc(0, 0, r * .09, 0, TAU); g.fill(); g.fillRect(-r * .03, -r * .26, r * .06, r * .22); g.restore(); },
      cut(g, r) { ball(g, r, '#ff7a5c', '#e3321f', '#a11a0c'); g.fillStyle = '#f35a40'; g.beginPath(); g.arc(0, 0, r * .86, 0, TAU); g.fill(); for (let i = 0; i < 4; i++) { g.save(); g.rotate(i / 4 * TAU + .4); g.fillStyle = '#ffb08a'; g.beginPath(); g.ellipse(0, -r * .44, r * .2, r * .3, 0, 0, TAU); g.fill(); g.fillStyle = '#f7d36b'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse((k - 1.5) * r * .07, -r * (.38 + (k % 2) * .1), r * .035, r * .055, .4, 0, TAU); g.fill(); } g.restore(); } g.fillStyle = '#ff9a7c'; g.beginPath(); g.arc(0, 0, r * .16, 0, TAU); g.fill(); } },
    lemon: { juice: '#f5d53a', pts: 1, whole(g, r) { g.save(); g.scale(1.14, .88); ball(g, r, '#fff27a', '#f2cf1d', '#c99a00'); g.restore(); g.fillStyle = '#e8c010'; g.beginPath(); g.ellipse(r * 1.08, 0, r * .16, r * .12, 0, 0, TAU); g.ellipse(-r * 1.08, 0, r * .16, r * .12, 0, 0, TAU); g.fill(); glossy(g, r * .95); for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(170,120,0,.18)'; g.beginPath(); g.arc(rnd(-r * .8, r * .8), rnd(-r * .6, r * .6), r * .025, 0, TAU); g.fill(); } },
      cut(g, r) { ball(g, r, '#fff6a0', '#f6dd4a', '#d8b200'); g.fillStyle = '#fffbe2'; g.beginPath(); g.arc(0, 0, r * .86, 0, TAU); g.fill(); for (let i = 0; i < 9; i++) { g.save(); g.rotate(i / 9 * TAU); const gr = g.createLinearGradient(0, 0, 0, -r * .8); gr.addColorStop(0, '#fff3a6'); gr.addColorStop(1, '#f8de52'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -r * .12); g.arc(0, 0, r * .78, -Math.PI / 2 - .3, -Math.PI / 2 + .3); g.closePath(); g.fill(); g.restore(); } g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(0, 0, r * .12, 0, TAU); g.fill(); } },
    kiwi: { juice: '#8cc63f', pts: 1, whole(g, r) { g.save(); g.scale(1.1, .92); ball(g, r, '#b08a5a', '#8a6236', '#5a3d1c'); g.restore(); for (let i = 0; i < 120; i++) { g.strokeStyle = 'rgba(70,45,20,.35)'; g.lineWidth = 1; const a = rnd(0, TAU), d = rnd(0, r * .95); g.beginPath(); g.moveTo(Math.cos(a) * d, Math.sin(a) * d * .9); g.lineTo(Math.cos(a) * d + 2, Math.sin(a) * d * .9 + 1); g.stroke(); } },
      cut(g, r) { ball(g, r, '#9a7346', '#7b5530', '#5a3d1c'); const gr = g.createRadialGradient(0, 0, r * .1, 0, 0, r * .88); gr.addColorStop(0, '#e9f2b8'); gr.addColorStop(.35, '#a9d34f'); gr.addColorStop(1, '#5e9e1e'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .88, 0, TAU); g.fill(); g.fillStyle = '#fbfbe8'; g.beginPath(); g.ellipse(0, 0, r * .24, r * .2, 0, 0, TAU); g.fill(); g.fillStyle = '#1b1a14'; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, d = r * (.32 + (i % 2) * .05); g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * .035, r * .06, a, 0, TAU); g.fill(); } g.strokeStyle = 'rgba(240,250,200,.5)'; g.lineWidth = 1; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * r * .26, Math.sin(a) * r * .22); g.lineTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); g.stroke(); } } },
    pepper: { juice: '#d81e1e', pts: 1, whole(g, r) { const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r * 1.05); gr.addColorStop(0, '#ff6b5a'); gr.addColorStop(.55, '#d4140f'); gr.addColorStop(1, '#7c0705'); g.fillStyle = gr; g.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU, k = 1 + .08 * Math.cos(a * 3) - .06 * Math.max(0, -Math.sin(a)); g.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k * 1.05); } g.fill(); glossy(g, r, -.35, -.25, .7); g.fillStyle = '#2f6b25'; g.beginPath(); g.ellipse(0, -r * .98, r * .3, r * .12, 0, 0, TAU); g.fill(); g.fillRect(-r * .06, -r * 1.35, r * .12, r * .4); },
      cut(g, r) { ball(g, r, '#ff5545', '#d4140f', '#8a0806'); g.fillStyle = '#fff5ee'; g.beginPath(); g.arc(0, 0, r * .8, 0, TAU); g.fill(); g.strokeStyle = '#d4140f'; g.lineWidth = r * .1; g.beginPath(); g.arc(0, 0, r * .84, 0, TAU); g.stroke(); g.strokeStyle = '#f4e4d2'; g.lineWidth = r * .08; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * .78, Math.sin(a) * r * .78); g.stroke(); } g.fillStyle = '#efdc9c'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(rnd(-r * .25, r * .25), rnd(-r * .25, r * .25), r * .05, r * .035, rnd(0, 3), 0, TAU); g.fill(); } } },
    avocado: { juice: '#b6cf4c', pts: 1, whole(g, r) { g.save(); g.scale(.86, 1.12); const gr = g.createRadialGradient(-r * .3, -r * .2, r * .1, 0, r * .1, r); gr.addColorStop(0, '#5f7a30'); gr.addColorStop(.6, '#2f4a17'); gr.addColorStop(1, '#16260a'); g.fillStyle = gr; g.beginPath(); g.arc(0, r * .15, r * .85, 0, TAU); g.arc(0, -r * .38, r * .55, 0, TAU); g.fill(); g.restore(); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(120,150,60,.25)'; g.beginPath(); g.arc(rnd(-r * .6, r * .6), rnd(-r * .8, r * .9), r * .03, 0, TAU); g.fill(); } glossy(g, r * .8, -.3, -.6, .35); },
      cut(g, r) { g.save(); g.scale(.86, 1.12); g.fillStyle = '#28401a'; g.beginPath(); g.arc(0, r * .15, r * .85, 0, TAU); g.arc(0, -r * .38, r * .55, 0, TAU); g.fill(); const gr = g.createRadialGradient(0, r * .1, r * .1, 0, r * .1, r * .85); gr.addColorStop(0, '#f2f0a6'); gr.addColorStop(.7, '#cfe06a'); gr.addColorStop(1, '#7da332'); g.fillStyle = gr; g.beginPath(); g.arc(0, r * .15, r * .78, 0, TAU); g.arc(0, -r * .38, r * .48, 0, TAU); g.fill(); g.restore(); const pg = g.createRadialGradient(-r * .1, r * .05, r * .05, 0, r * .15, r * .38); pg.addColorStop(0, '#c0794a'); pg.addColorStop(1, '#6b3a1c'); g.fillStyle = pg; g.beginPath(); g.arc(0, r * .17, r * .36, 0, TAU); g.fill(); glossy(g, r * .35, -.2, .1, .4); } },
    orange: { juice: '#ff9a1f', pts: 1, whole(g, r) { ball(g, r, '#ffc061', '#ff8c12', '#c25a00'); for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(160,70,0,.18)'; g.beginPath(); g.arc(rnd(-r * .85, r * .85), rnd(-r * .85, r * .85), r * .025, 0, TAU); g.fill(); } glossy(g, r, -.32, -.38, .32); g.fillStyle = '#5b7d2a'; g.beginPath(); g.arc(r * .05, -r * .9, r * .09, 0, TAU); g.fill(); },
      cut(g, r) { ball(g, r, '#ffb24d', '#ff8c12', '#c25a00'); g.fillStyle = '#fff1d9'; g.beginPath(); g.arc(0, 0, r * .88, 0, TAU); g.fill(); for (let i = 0; i < 10; i++) { g.save(); g.rotate(i / 10 * TAU); const gr = g.createLinearGradient(0, 0, 0, -r * .8); gr.addColorStop(0, '#ffc874'); gr.addColorStop(1, '#ff8f1f'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -r * .1); g.arc(0, 0, r * .8, -Math.PI / 2 - .26, -Math.PI / 2 + .26); g.closePath(); g.fill(); g.restore(); } } },
    eggplant: { juice: '#e8dcc0', pts: 1, whole(g, r) { g.save(); g.rotate(.5); g.scale(.72, 1.3); const gr = g.createRadialGradient(-r * .3, -r * .2, r * .1, 0, 0, r); gr.addColorStop(0, '#8a4fa8'); gr.addColorStop(.55, '#4a1c63'); gr.addColorStop(1, '#22072f'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, r * .1, r * .9, r * .82, 0, 0, TAU); g.fill(); g.restore(); glossy(g, r * .8, -.4, -.5, .6); g.save(); g.rotate(.5); g.fillStyle = '#4c7a2c'; g.beginPath(); g.ellipse(0, -r * 1.02, r * .4, r * .17, 0, 0, TAU); g.fill(); g.fillRect(-r * .07, -r * 1.35, r * .14, r * .35); g.restore(); },
      cut(g, r) { g.fillStyle = '#3a1150'; g.beginPath(); g.arc(0, 0, r * .95, 0, TAU); g.fill(); const gr = g.createRadialGradient(0, 0, r * .1, 0, 0, r * .9); gr.addColorStop(0, '#fbf3dc'); gr.addColorStop(1, '#e6d6ae'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .88, 0, TAU); g.fill(); g.fillStyle = '#b29a68'; for (let i = 0; i < 40; i++) { const a = rnd(0, TAU), d = rnd(r * .2, r * .55); g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * .03, r * .05, a, 0, TAU); g.fill(); } } },
    carrot: { juice: '#ff8a1c', pts: 1, whole(g, r) { g.save(); g.rotate(-.7); const gr = g.createLinearGradient(-r * .4, 0, r * .4, 0); gr.addColorStop(0, '#d45b00'); gr.addColorStop(.45, '#ff9a2a'); gr.addColorStop(1, '#c04f00'); g.fillStyle = gr; g.beginPath(); g.moveTo(-r * .38, -r * .9); g.quadraticCurveTo(0, -r * 1.05, r * .38, -r * .9); g.lineTo(r * .04, r * 1.2); g.quadraticCurveTo(0, r * 1.28, -r * .04, r * 1.2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(140,60,0,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = -r * .6 + i * r * .3; g.beginPath(); g.moveTo(-r * .3 + i * .03 * r, y); g.lineTo(-r * .1, y + 2); g.stroke(); } g.fillStyle = '#4e8f2a'; for (let i = -2; i <= 2; i++) { g.save(); g.translate(0, -r * .95); g.rotate(i * .28); g.beginPath(); g.ellipse(0, -r * .35, r * .07, r * .38, 0, 0, TAU); g.fill(); g.restore(); } g.restore(); },
      cut(g, r) { ball(g, r * .7, '#ffad4d', '#ff8a1c', '#c25a00'); g.fillStyle = '#ffb867'; g.beginPath(); g.arc(0, 0, r * .45, 0, TAU); g.fill(); g.fillStyle = '#ffd08f'; g.beginPath(); g.arc(0, 0, r * .24, 0, TAU); g.fill(); } },
    gold: { juice: '#ffd86b', pts: 5, gold: 1, whole(g, r) { g.save(); g.scale(1.14, .88); ball(g, r, '#fff6b0', '#ffcf2e', '#b27b00'); g.restore(); glossy(g, r, -.3, -.35, .9); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .3; g.beginPath(); g.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); g.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5); g.stroke(); } },
      cut(g, r) { TYPES.lemon.cut(g, r); g.fillStyle = 'rgba(255,215,90,.35)'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); } },
    plate: { hazard: 1, juice: '#ffffff', whole(g, r) { const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dfe3e8'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = '#2f63b5'; g.lineWidth = r * .07; g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.stroke(); g.lineWidth = r * .03; g.beginPath(); g.arc(0, 0, r * .62, 0, TAU); g.stroke(); g.fillStyle = '#2f63b5'; for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * TAU); g.beginPath(); g.ellipse(0, -r * .76, r * .05, r * .09, 0, 0, TAU); g.fill(); g.restore(); } g.fillStyle = 'rgba(47,99,181,.9)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.ellipse(Math.cos(a) * r * .2, Math.sin(a) * r * .2, r * .11, r * .045, a, 0, TAU); g.fill(); } g.strokeStyle = 'rgba(47,99,181,.55)'; g.lineWidth = r * .02; for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * r * .34, Math.sin(a) * r * .34); g.quadraticCurveTo(Math.cos(a + .2) * r * .45, Math.sin(a + .2) * r * .45, Math.cos(a) * r * .52, Math.sin(a) * r * .52); g.stroke(); } g.fillStyle = '#f0c844'; g.beginPath(); g.arc(0, 0, r * .07, 0, TAU); g.fill(); glossy(g, r, -.35, -.4, .8); },
      cut(g, r) { TYPES.plate.whole(g, r); } },
  };
  const FOOD = ['tomato', 'lemon', 'kiwi', 'pepper', 'avocado', 'orange', 'eggplant', 'carrot'];
  const spriteCache = {};
  function sprite(type, kind, r, dpr) {
    const k = type + kind + Math.round(r * dpr); if (spriteCache[k]) return spriteCache[k];
    const s = Math.ceil(r * 3.2 * dpr), c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
    g.translate(s / 2, s / 2); g.scale(dpr, dpr); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 0; TYPES[type][kind](g, r);
    return spriteCache[k] = c;
  }

  /* ---------------------------------------------------------------- Klang (WebAudio, kurz und dezent) */
  let AC = null, mute = false; try { mute = localStorage.getItem('kp-game-mute') === '1'; } catch (e) { }
  function ac() { if (mute) return null; try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
  function noise(dur, f0, f1, vol, type = 'bandpass') { const a = ac(); if (!a) return; const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, a.currentTime); f.frequency.exponentialRampToValueAtTime(f1, a.currentTime + dur); f.Q.value = 1.2; const gn = a.createGain(); gn.gain.value = vol; s.connect(f); f.connect(gn); gn.connect(a.destination); s.start(); }
  function tone(freq, dur, vol, type = 'sine', at = 0) { const a = ac(); if (!a) return; const o = a.createOscillator(), gn = a.createGain(); o.type = type; o.frequency.value = freq; gn.gain.setValueAtTime(0, a.currentTime + at); gn.gain.linearRampToValueAtTime(vol, a.currentTime + at + .01); gn.gain.exponentialRampToValueAtTime(.0001, a.currentTime + at + dur); o.connect(gn); gn.connect(a.destination); o.start(a.currentTime + at); o.stop(a.currentTime + at + dur + .05); }
  const SFX = {
    swish() { noise(.12, 5200, 1800, .07, 'highpass'); },
    slice() { noise(.08, 3000, 900, .12); tone(180, .12, .06, 'triangle'); },
    splat() { noise(.16, 600, 120, .16, 'lowpass'); },
    crash() { noise(.45, 4200, 1400, .22); tone(1800, .25, .05, 'triangle'); tone(2600, .2, .04, 'triangle', .05); },
    combo(n) { [0, 4, 7, 12].slice(0, Math.min(4, n)).forEach((st, i) => tone(523.25 * Math.pow(2, st / 12), .22, .07, 'sine', i * .07)); },
    gold() { [0, 7, 12, 16, 19].forEach((st, i) => tone(659.25 * Math.pow(2, st / 12), .3, .06, 'sine', i * .06)); },
  };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

  /* ---------------------------------------------------------------- Spiel */
  let root = null, cv = null, g = null, opts = null, raf = 0, st = null, dpr = 1, W = 0, H = 0, bg = null, bgSrc = null, bgT = 0, lastProg = null, readyUrl = null, ro = null, autoT = 0;
  const isOpen = () => !!(root && root.isConnected && !root.hidden);
  const playing = () => !!(st && st.run && !st.over);
  function injectCSS() { if (document.getElementById('kpg-css')) return; const s = document.createElement('style'); s.id = 'kpg-css'; s.textContent = CSS; document.head.appendChild(s); }
  function hs() { try { return +localStorage.getItem(HS) || 0; } catch (e) { return 0; } }
  function setHs(v) { try { localStorage.setItem(HS, String(v)); } catch (e) { } }
  function open(o = {}) {
    injectCSS(); close(true); opts = o; readyUrl = null; lastProg = null;
    const host = o.host || document.body;
    root = document.createElement('div'); root.className = 'kpg'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Spiel Schnippeljagd');
    if (o.acc) root.style.setProperty('--kpg-acc', o.acc);
    root.innerHTML = `<div class="kpg-top"><span class="kpg-th"><canvas width="116" height="76" data-th></canvas></span><span class="kpg-ti"><b data-tt>${o.title || 'Ihr Bild entsteht'}</b><small data-ts>${o.sub || 'Spielen Sie solange eine Runde.'}</small></span><button type="button" class="kpg-go" data-go>Ansehen</button><button type="button" class="kpg-ib" data-mute aria-label="Ton an/aus">${mute ? ICO.off : ICO.on}</button><button type="button" class="kpg-ib" data-close aria-label="Spiel schließen">${ICO.x}</button><i class="kpg-bar" data-bar></i></div>
      <canvas class="kpg-cv" data-cv aria-label="Spielfeld"></canvas>
      <div class="kpg-hud" aria-hidden="true"><div class="kpg-sc"><span data-score>0</span><small data-best>Rekord ${hs()}</small></div><div class="kpg-lv" data-lives><i></i><i></i><i></i></div></div>
      <div class="kpg-card" data-card><h3>Schnippel<em>jagd</em></h3><p>Schneiden Sie mit dem Finger durch alles, was fliegt – Obst und Gemüse bringen Punkte. <b>Finger weg vom Porzellan!</b></p><div class="kpg-demo" data-demo></div><button type="button" class="kpg-btn" data-start>Los geht’s</button><div class="kpg-hint">Mehrere auf einmal = Kombo · goldene Zitrone = Bonus</div></div>`;
    host.appendChild(root); cv = root.querySelector('[data-cv]'); g = cv.getContext('2d');
    // kleine Vorschau-Figuren auf der Startkarte
    const demo = root.querySelector('[data-demo]'); ['tomato', 'kiwi', 'lemon', 'plate'].forEach(t => { const c = document.createElement('canvas'); c.width = c.height = 92; const x = c.getContext('2d'); x.translate(46, 46); x.scale(2, 2); TYPES[t][t === 'kiwi' ? 'cut' : 'whole'](x, 14); demo.appendChild(c); });
    root.addEventListener('click', onClick);
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
    ro = new ResizeObserver(fit); ro.observe(root);
    document.addEventListener('visibilitychange', onVis);
    fit(); st = newState(); st.attract = true;
    requestAnimationFrame(() => root.classList.add('on'));
    if (o.progressCanvas) setBg(o.progressCanvas);
    else if (o.bgUrl) { const i = new Image(); i.onload = () => { if (!bgSrc) { setBg(i); buildBg(.6); try { const th = root && root.querySelector('[data-th]'); th && th.getContext('2d').drawImage(i, 0, 0, th.width, th.height); } catch (e) { } } }; i.src = o.bgUrl; }
    loop(performance.now());
  }
  function newState() { return { items: [], halves: [], parts: [], splats: [], trail: [], score: 0, lives: 3, t: 0, spawnT: .6, wave: 0, combo: [], slow: 0, over: false, attract: false, run: false, best: hs() }; }
  function fit() { if (!cv) return; const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = Math.max(200, r.width); H = Math.max(200, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); bgT = 0; }
  function onVis() { if (document.hidden && st) st.paused = true; else if (st && !st.ask) { st.paused = false; } }
  function onClick(e) {
    if (e.target.closest('[data-close]')) { close(); return; }
    if (e.target.closest('[data-mute]')) { mute = !mute; try { localStorage.setItem('kp-game-mute', mute ? '1' : '0'); } catch (er) { } e.target.closest('[data-mute]').innerHTML = mute ? ICO.off : ICO.on; return; }
    if (e.target.closest('[data-go]')) { const u = readyUrl, o = opts; close(); if (o && o.onShow) o.onShow(u); return; }
    if (e.target.closest('[data-resume]')) { const c = root.querySelector('[data-card]'); c.hidden = true; c.classList.remove('fin'); if (st) { st.ask = false; st.paused = false; } last = 0; return; }
    if (e.target.closest('[data-start]') || e.target.closest('[data-again]')) { start(); return; }
  }
  function start() { ac(); st = newState(); st.run = true; root.querySelector('[data-card]').hidden = true; root.querySelectorAll('[data-lives] i').forEach(i => i.classList.remove('x')); root.querySelector('[data-score]').textContent = '0'; root.querySelector('[data-best]').textContent = 'Rekord ' + hs(); }
  function close(silent) {
    cancelAnimationFrame(raf); raf = 0; clearTimeout(autoT); autoT = 0;
    if (ro) { ro.disconnect(); ro = null; }
    removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); document.removeEventListener('visibilitychange', onVis);
    if (root) { const r = root; r.classList.remove('on'); setTimeout(() => r.remove(), silent ? 0 : 320); root = null; }
    if (!silent && opts && opts.onClose) opts.onClose(readyUrl);
  }
  // Hintergrund: das eigene Küchenbild, weich gezeichnet und abgedunkelt – wird mit dem Fortschritt schärfer
  function setBg(src) { bgSrc = src; bgT = 0; }
  function buildBg(f) {
    if (!bgSrc || !W) return null;
    const c = bg || document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const x = c.getContext('2d');
    const sw = bgSrc.width, sh = bgSrc.height, s = Math.max(c.width / sw, c.height / sh), dw = sw * s, dh = sh * s;
    // Unschärfe über Verkleinern/Vergrößern (schnell), je weiter, desto schärfer
    const k = clamp(.04 + (f || 0) * .2, .04, .24), t = document.createElement('canvas'); t.width = Math.max(8, Math.round(c.width * k)); t.height = Math.max(8, Math.round(c.height * k)); const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(bgSrc, (t.width - dw * k) / 2, (t.height - dh * k) / 2, dw * k, dh * k);
    x.imageSmoothingQuality = 'high'; x.drawImage(t, 0, 0, c.width, c.height);
    const gr = x.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, 'rgba(12,10,8,.55)'); gr.addColorStop(.5, 'rgba(12,10,8,.38)'); gr.addColorStop(1, 'rgba(12,10,8,.7)'); x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    return bg = c;
  }
  function progress(f, canvas, rest) {
    if (!root) return; lastProg = f;
    const bar = root.querySelector('[data-bar]'); if (bar) bar.style.width = Math.round(clamp(f, 0, 1) * 100) + '%';
    const ts = root.querySelector('[data-ts]'); if (ts && !readyUrl) ts.textContent = `${Math.round(f * 100)} %` + (rest != null && isFinite(rest) ? ` · noch rund ${rest >= 60 ? Math.round(rest / 60) + ' min' : Math.max(1, Math.round(rest)) + ' s'}` : '') + ' – spielen Sie solange eine Runde.';
    if (canvas) { try { const th = root.querySelector('[data-th]'); th.getContext('2d').drawImage(canvas, 0, 0, th.width, th.height); } catch (e) { } if (performance.now() - bgT > 1600) { setBg(canvas); bgT = performance.now(); buildBg(f); } }
  }
  let finImg = null;
  function done(url) {
    if (!root) return; readyUrl = url || null; root.classList.add('ready');
    const tt = root.querySelector('[data-tt]'), ts = root.querySelector('[data-ts]'), bar = root.querySelector('[data-bar]');
    if (tt) tt.textContent = 'Bild ist fertig!'; if (ts) ts.textContent = 'Jetzt ansehen – oder erst zu Ende spielen.'; if (bar) bar.style.width = '100%';
    finImg = null;
    if (url) { const i = new Image(); i.onload = () => { finImg = i; try { const th = root && root.querySelector('[data-th]'); th && th.getContext('2d').drawImage(i, 0, 0, th.width, th.height); } catch (e) { } setBg(i); buildBg(1); paintFin(); }; i.src = url; }
    tone(784, .25, .07); tone(1046.5, .35, .07, 'sine', .12); buzz(30);
    clearTimeout(autoT);
    if (playing()) { ask(); return; }
    // nicht mitten im Spiel: kurz „fertig“ zeigen, dann geht das Spiel von selbst aus und das Bild ist da
    const f = document.createElement('div'); f.className = 'kpg-flash'; f.innerHTML = '<span>Ihr Bild ist fertig ✓</span>'; root.appendChild(f); requestAnimationFrame(() => f.classList.add('on'));
    autoT = setTimeout(() => { autoT = 0; if (!root) return; if (playing()) { f.remove(); ask(); return; } const u = readyUrl, o = opts; close(); if (o && o.onShow) o.onShow(u); }, RM ? 400 : 1300);
  }
  // mitten in einer Runde: Spiel anhalten und fragen
  function ask() {
    if (!root || !st) return; st.ask = true; st.paused = true; ptr = null; st.trail = [];
    const card = root.querySelector('[data-card]'); card.hidden = false; card.classList.add('fin');
    card.innerHTML = `${readyUrl ? '<span class="kpg-fin"><canvas width="480" height="300" data-fth></canvas></span>' : ''}<h3>Ihr Bild ist <em>fertig!</em></h3><p>${st.score} Punkte bis jetzt. Möchten Sie das Bild ansehen – oder die Runde zu Ende spielen?</p><div><button type="button" class="kpg-btn" data-go>Bild ansehen</button><button type="button" class="kpg-btn sec" data-resume>Weiterspielen</button></div>`;
    paintFin();
    const b = card.querySelector('[data-go]'); if (b) try { b.focus({ preventScroll: true }); } catch (e) { }
  }
  function paintFin() { try { const c = root && root.querySelector('[data-fth]'); if (!c || !finImg) return; const x = c.getContext('2d'), s = Math.max(c.width / finImg.width, c.height / finImg.height); x.drawImage(finImg, (c.width - finImg.width * s) / 2, (c.height - finImg.height * s) / 2, finImg.width * s, finImg.height * s); } catch (e) { } }
  function fail(t1, t2) { if (!root) return; const tt = root.querySelector('[data-tt]'), ts = root.querySelector('[data-ts]'); if (tt) tt.textContent = t1 || 'Ultra-Qualität ist auf diesem Gerät nicht möglich'; if (ts) ts.textContent = t2 || 'Ihr Echtoptik-Bild bleibt erhalten.'; root.classList.add('ready'); }

  /* ---------- Spielmechanik ---------- */
  const R0 = () => clamp(Math.min(W, H) * .075, 26, 46);
  function spawn() {
    const n = st.wave < 2 ? 1 : st.wave < 5 ? 1 + (Math.random() < .5 ? 1 : 0) : 1 + Math.floor(Math.random() * Math.min(4, 1 + st.wave / 4));
    for (let i = 0; i < n; i++) {
      const hazard = st.wave > 2 && Math.random() < Math.min(.22, .08 + st.wave * .01), gold = !hazard && Math.random() < .045;
      const type = hazard ? 'plate' : gold ? 'gold' : FOOD[Math.floor(Math.random() * FOOD.length)], r = R0() * (hazard ? 1.12 : type === 'eggplant' ? 1.05 : 1);
      const x = rnd(W * .15, W * .85), vx = (W / 2 - x) * rnd(.25, .7) + rnd(-40, 40), apex = rnd(H * .12, H * .42), vy = -Math.sqrt(2 * G() * (H + r - apex));
      st.items.push({ type, r, x, y: H + r + 4, vx, vy, a: rnd(0, TAU), va: rnd(-3, 3), born: st.t + i * .12, cut: false });
    }
    st.wave++;
  }
  const G = () => H * 1.25;   // Schwerkraft in px/s² (bildschirmabhängig)
  function segHit(ax, ay, bx, by, cx, cy, r) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = clamp(((cx - ax) * dx + (cy - ay) * dy) / l2, 0, 1), px = ax + dx * t - cx, py = ay + dy * t - cy; return px * px + py * py <= r * r; }
  function slice(it, ang, sp) {
    it.cut = true; const T = TYPES[it.type];
    if (T.hazard) { st.lives--; root.querySelectorAll('[data-lives] i')[2 - st.lives] && root.querySelectorAll('[data-lives] i')[2 - st.lives].classList.add('x'); SFX.crash(); buzz([40, 30, 60]); pop(it.x, it.y, 'Klirr! Omas Teller', 'bad'); root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
      for (let i = 0; i < 18; i++) st.parts.push({ x: it.x, y: it.y, vx: rnd(-420, 420), vy: rnd(-520, 80), r: rnd(3, 9), c: i % 3 ? '#f4f6f8' : '#2f63b5', life: 1.2, shard: 1, a: rnd(0, TAU), va: rnd(-8, 8) });
      if (st.lives <= 0) gameOver(); return; }
    SFX.slice(); setTimeout(SFX.splat, 40); buzz(12);
    const nx = -Math.sin(ang), ny = Math.cos(ang), kick = 120 + sp * .05;
    [1, -1].forEach(s => st.halves.push({ type: it.type, r: it.r, x: it.x + nx * s * 3, y: it.y + ny * s * 3, vx: it.vx * .6 + nx * s * kick, vy: it.vy * .4 + ny * s * kick - 60, a: ang, va: s * rnd(2, 5), side: s, life: 2.4 }));
    const pc = RM ? 8 : 22; for (let i = 0; i < pc; i++) { const a = ang + rnd(-.9, .9) + (i % 2 ? Math.PI : 0), v = rnd(140, 520); st.parts.push({ x: it.x, y: it.y, vx: Math.cos(a) * v + it.vx * .3, vy: Math.sin(a) * v - 120, r: rnd(2, 6), c: T.juice, life: rnd(.5, 1.1) }); }
    st.splats.push({ x: it.x, y: it.y, r: it.r * rnd(1.1, 1.7), c: T.juice, life: 2.2, seed: Math.random() * 1000 });
    const pts = T.pts || 1; st.score += pts; st.combo.push(st.t);
    if (T.gold) { SFX.gold(); st.slow = 2.2; pop(it.x, it.y, '+5 Goldene Zitrone!', 'gold'); }
    root.querySelector('[data-score]').textContent = st.score;
  }
  function pop(x, y, txt, cls = '') { const p = document.createElement('div'); p.className = 'kpg-pop ' + cls; p.textContent = txt; const r = cv.getBoundingClientRect(), rr = root.getBoundingClientRect(); p.style.left = (r.left - rr.left + x) + 'px'; p.style.top = (r.top - rr.top + y) + 'px'; root.appendChild(p); setTimeout(() => p.remove(), 1000); }
  function gameOver() {
    st.over = true; st.run = false; const best = Math.max(hs(), st.score), rec = st.score > hs(); if (rec) setHs(st.score);
    const card = root.querySelector('[data-card]'); card.hidden = false;
    card.innerHTML = `<h3>${rec && st.score > 0 ? 'Neuer <em>Rekord!</em>' : 'Porzellan <em>ade</em>'}</h3><p>${st.score} Punkte${rec ? '' : ` · Rekord ${best}`}. ${readyUrl ? 'Ihr Bild ist übrigens fertig.' : 'Ihr Bild rechnet noch – noch eine Runde?'}</p><div><button type="button" class="kpg-btn" data-again>Nochmal</button>${readyUrl ? '<button type="button" class="kpg-btn sec" data-go>Bild ansehen</button>' : ''}</div>`;
  }
  // Zeiger
  let ptr = null;
  function pos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function onDown(e) { if (!st) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) { } const [x, y] = pos(e); ptr = { id: e.pointerId, x, y, t: performance.now(), hits: 0, sw: 0 }; st.trail = [{ x, y, t: performance.now() }]; }
  function onMove(e) {
    if (!st || !ptr || e.pointerId !== ptr.id) return; e.preventDefault();
    const [x, y] = pos(e), now = performance.now(), dt = Math.max(1, now - ptr.t), dx = x - ptr.x, dy = y - ptr.y, sp = Math.hypot(dx, dy) / dt * 1000;
    st.trail.push({ x, y, t: now }); if (st.trail.length > 40) st.trail.shift();
    if (sp > 420 && st.run) {
      if (now - ptr.sw > 260) { SFX.swish(); ptr.sw = now; }
      const ang = Math.atan2(dy, dx);
      for (const it of st.items) if (!it.cut && st.t >= it.born && segHit(ptr.x, ptr.y, x, y, it.x, it.y, it.r * .95)) { slice(it, ang, sp); ptr.hits++; }
    }
    ptr.x = x; ptr.y = y; ptr.t = now;
  }
  function onUp(e) { if (!ptr || (e && e.pointerId !== ptr.id)) return; if (ptr.hits >= 3 && st.run) { const b = ptr.hits - 1; st.score += b; root.querySelector('[data-score]').textContent = st.score; pop(ptr.x, ptr.y, `${ptr.hits}er-Kombo! +${b}`, 'gold'); SFX.combo(ptr.hits); buzz(25); } ptr = null; }
  // Schleife
  let last = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop); if (!st || !g || st.paused) { last = now; return; }
    let dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    const ts = st.slow > 0 ? .45 : 1; st.slow = Math.max(0, st.slow - dt); dt *= ts; st.t += dt;
    // Startbildschirm: ein paar Figuren schweben vorbei
    if (st.run || st.attract) { st.spawnT -= dt; if (st.spawnT <= 0) { spawn(); st.spawnT = st.attract && !st.run ? 1.6 : Math.max(.55, 1.5 - st.wave * .035); } }
    const gg = G();
    st.items.forEach(it => { if (st.t < it.born) return; it.vy += gg * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.a += it.va * dt; });
    st.items = st.items.filter(it => !it.cut && it.y < H + it.r * 3);
    st.halves.forEach(h => { h.vy += gg * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.a += h.va * dt; h.life -= dt; });
    st.halves = st.halves.filter(h => h.life > 0 && h.y < H + h.r * 3);
    st.parts.forEach(p => { p.vy += gg * .9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.shard) p.a += p.va * dt; });
    st.parts = st.parts.filter(p => p.life > 0);
    st.splats.forEach(s => s.life -= dt * .6); st.splats = st.splats.filter(s => s.life > 0);
    draw(now);
  }
  function draw(now) {
    const c = g; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (bg) c.drawImage(bg, 0, 0, W, H); else { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a241e'); gr.addColorStop(1, '#100e0c'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
    if (!bg && bgSrc && W) buildBg(lastProg || 0);
    // Saftflecken
    st.splats.forEach(s => { c.save(); c.globalAlpha = clamp(s.life / 2.2, 0, 1) * .42; c.fillStyle = s.c; c.beginPath(); for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU, rr = s.r * (.78 + .12 * Math.sin(s.seed + a * 3) + .08 * Math.sin(s.seed * 1.7 + a * 7)); i ? c.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr) : c.moveTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); } c.closePath(); c.fill();
      for (let k = 0; k < 6; k++) { const a = s.seed * 3 + k * 1.1, d = s.r * (1.05 + .35 * ((s.seed * (k + 3)) % 1)); c.beginPath(); c.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, s.r * (.06 + .05 * ((s.seed * (k + 7)) % 1)), 0, TAU); c.fill(); } c.restore(); });
    // Figuren
    st.items.forEach(it => { if (st.t < it.born) return; const sp = sprite(it.type, 'whole', it.r, dpr), s = sp.width / dpr; c.save(); c.translate(it.x, it.y); c.rotate(it.a); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 8; c.drawImage(sp, -s / 2, -s / 2, s, s); c.restore(); });
    // Hälften: Querschnitt, an der Schnittlinie geteilt
    st.halves.forEach(h => { const sp = sprite(h.type, TYPES[h.type].hazard ? 'whole' : 'cut', h.r, dpr), s = sp.width / dpr; c.save(); c.globalAlpha = clamp(h.life / .5, 0, 1); c.translate(h.x, h.y); c.rotate(h.a); c.beginPath(); c.rect(-s, h.side > 0 ? 0 : -s, s * 2, s); c.clip(); c.drawImage(sp, -s / 2, -s / 2, s, s); c.restore(); });
    // Spritzer und Scherben
    st.parts.forEach(p => { c.save(); c.globalAlpha = clamp(p.life * 1.4, 0, 1); c.fillStyle = p.c; if (p.shard) { c.translate(p.x, p.y); c.rotate(p.a); c.beginPath(); c.moveTo(-p.r, -p.r * .4); c.lineTo(p.r, 0); c.lineTo(-p.r * .3, p.r * .6); c.closePath(); c.fill(); } else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); } c.restore(); });
    // Klingenspur
    const tr = st.trail.filter(p => now - p.t < 140); st.trail = tr;
    if (tr.length > 1) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; for (let pass = 0; pass < 2; pass++) { for (let i = 1; i < tr.length; i++) { const k = i / tr.length, a = tr[i - 1], b = tr[i]; c.strokeStyle = pass ? `rgba(255,255,255,${.9 * k})` : `rgba(255,213,154,${.35 * k})`; c.lineWidth = (pass ? 3.2 : 11) * k + .5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } } c.restore(); }
    if (st.slow > 0) { c.save(); c.fillStyle = `rgba(255,215,107,${.08 * clamp(st.slow, 0, 1)})`; c.fillRect(0, 0, W, H); c.restore(); }
  }
  window.KPGame = { open, close, isOpen, playing, progress, done, fail, version: '1.1' };
})();
