
/* Markenwelt: Regler, Marken-Tabs, Bilderwechsel, Geräte-Karten */
(() => {
  const sec = document.querySelector('.mk2'); if (!sec) return;
  const range = sec.querySelector('[data-mk]'), tabs = [...sec.querySelectorAll('.mk-c')], arts = [...sec.querySelectorAll('.mk2-b')];
  let cur = 1, user = false;
  const show = i => { cur = i; if (range) range.value = i;
    tabs.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    arts.forEach((a, k) => { a.classList.toggle('on', k === i); a.setAttribute('aria-hidden', k === i ? 'false' : 'true'); }); };
  range && range.addEventListener('input', () => { user = true; show(+range.value); });
  tabs.forEach((t, k) => t.addEventListener('click', () => { user = true; show(k); }));
  // Bilder je Marke wechseln
  setInterval(() => { const a = arts[cur]; if (!a || document.hidden) return; const im = [...a.querySelectorAll('.mk2-pics img')], d = [...a.querySelectorAll('.mk2-pdots i')]; if (im.length < 2) return;
    let k = im.findIndex(x => x.classList.contains('on')); im[k].classList.remove('on'); d[k] && d[k].classList.remove('on'); k = (k + 1) % im.length; im[k].classList.add('on'); d[k] && d[k].classList.add('on'); }, 3600);
  // Impuls: einmal alle drei Marken durchspielen, wenn der Bereich ins Bild kommt
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!RM && 'IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
    [[0, 500], [2, 2600], [1, 4700]].forEach(([i, t]) => setTimeout(() => { if (!user) show(i); }, t)); }, { threshold: .35 }); io.observe(sec); }
  // Geräte-Marken
  const gs = [...sec.querySelectorAll('.mk2-g')], gc = [...sec.querySelectorAll('.mk2-gc')];
  const openG = i => gs.forEach((g, k) => { const on = k === i && !g.classList.contains('on'); g.classList.toggle('on', on); gc[k].hidden = !on; });
  gs.forEach((g, k) => { g.addEventListener('click', () => openG(k)); if (matchMedia('(hover:hover)').matches) g.addEventListener('mouseenter', () => { if (!g.classList.contains('on')) openG(k); }); });
})();
