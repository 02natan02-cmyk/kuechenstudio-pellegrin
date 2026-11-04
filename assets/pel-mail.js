/* Küchenstudio Pellegrin – Formular-Versand (Make, gestaltete Mails, Rückfall Formular-Dienst) */
(function () {
  var HOOK = document.documentElement.getAttribute('data-hook'); if (!HOOK) return;
  var QSEL = '<label class="tm-l">Wie sind Sie auf uns aufmerksam geworden?<select name="Quelle" data-quelle><option value="">Bitte wählen (freiwillig)</option><option value="Empfehlung von Freunden oder Bekannten">★ Empfehlung von Freunden oder Bekannten · am häufigsten</option><option>Google-Suche</option><option>Google Maps</option><option>ChatGPT oder andere KI</option><option>Instagram oder Facebook</option><option>Ich war schon Kunde</option><option>Vorbeigefahren</option><option>Sonstiges</option></select></label>';
  var MAXJSON = 4.6e6, MAXFILE = 2.9e6, PX = 1800;
  var NAMES = { 'Entwurf-Bild': 'Kuechenentwurf.jpg', 'Raumfoto': 'Raumfoto.jpg', 'Raumfoto-mit-Kueche': 'Raumfoto-mit-Kueche.jpg', 'Rueckwand-Motiv': 'Rueckwand-Motiv.jpg' };
  function shrink(f) {
    return new Promise(function (res) {
      if (!/^image\/(jpeg|png|webp)$/i.test(f.type) || !window.createImageBitmap || f.size < 350e3) return res(f);
      createImageBitmap(f).then(function (bm) {
        var k = Math.min(1, PX / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
        c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
        c.toBlob(function (b) { res(b && b.size < f.size ? new File([b], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : f); }, 'image/jpeg', .82);
      }).catch(function () { res(f); });
    });
  }
  function b64(f) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(f); }); }
  function post(data) {
    var ctl = window.AbortController ? new AbortController() : null; var t = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
    return fetch(HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined, credentials: 'omit', cache: 'no-store' })
      .then(function (r) { clearTimeout(t); return r.ok; }).catch(function () { clearTimeout(t); return false; });
  }
  function base(o) { o.seite = location.hostname + location.pathname; if (!o.files) o.files = []; return o; }
  /* Für eigene Formulare (Termin): PelMail.send({art, name, email, telefon, …}) → Promise<boolean> */
  window.PelMail = { send: function (o) { return post(base(o)); } };

  function fromForm(form, art) {
    var fd = new FormData(form), o = { art: art, files: [] }, files = [];
    var map = { Name: 'name', email: 'email', Telefon: 'telefon', Zeitpunkt: 'zeitpunkt', Anliegen: 'anliegen', Nachricht: 'nachricht', Entwurf: 'entwurf', Quelle: 'quelle', _honey: 'hp' };
    fd.forEach(function (v, k) {
      if (v instanceof File) { if (v.size > 0) files.push({ k: k, f: v }); return; }
      if (map[k]) o[map[k]] = String(v).trim();
    });
    var m = /Link:\s*(\S+)/.exec(o.entwurf || ''); if (m) o.link = m[1];
    /* Für die Mail ans Studio: Link raus (steht als Knopf darunter), jede Position auf eine eigene Zeile */
    if (o.entwurf) o.entwurf = o.entwurf.replace(/\n?\s*Link:\s*\S+/g, '').replace(/ · /g, '\n– ').replace(/\n{3,}/g, '\n\n').trim();
    return { o: base(o), files: files };
  }
  function handle(form, art, nat) {
    if (form._pmBusy) return; form._pmBusy = true;
    var btn = form.querySelector('[type="submit"]'), next = (form.querySelector('[name="_next"]') || {}).value || '';
    if (btn) { btn.disabled = true; btn.textContent = 'Wird gesendet …'; }
    var r = fromForm(form, art);
    if (r.o.hp) { location.href = next || location.href; return; }
    Promise.all(r.files.map(function (x) { return shrink(x.f).then(function (f) { return { k: x.k, f: f }; }); })).then(function (fs) {
      var big = fs.some(function (x) { return x.f.size > MAXFILE; }), sum = fs.reduce(function (s, x) { return s + x.f.size; }, 0);
      var withFiles = !big && sum * 1.37 < MAXJSON;
      var go = withFiles ? Promise.all(fs.map(function (x, i) { return b64(x.f).then(function (d) { return { filename: NAMES[x.k] || x.f.name || ('Datei-' + (i + 1)), data: d }; }); })) : Promise.resolve([]);
      return go.then(function (list) {
        r.o.files = list;
        if (!withFiles && fs.length) r.o.dateien_info = fs.length + (fs.length === 1 ? ' Datei' : ' Dateien') + ' (' + (sum / 1e6).toFixed(1).replace('.', ',') + ' MB) kommen in einer zweiten Mail über den Formular-Dienst.';
        return post(r.o).then(function (ok) { return { ok: ok, rest: !withFiles && fs.length }; });
      });
    }).then(function (res) {
      if (res.ok && !res.rest) { location.href = next || location.href; return; }
      /* Rückfall: Formular-Dienst (schickt auch die großen Dateien) */
      form._pmBusy = false; form._pmNative = true; nat.call(form);
    }).catch(function () { form._pmBusy = false; form._pmNative = true; nat.call(form); });
  }
  var nat = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    var art = this.getAttribute('data-pm');
    if (art && !this._pmNative) return handle(this, art, nat);
    return nat.call(this);
  };
  function arm() {
    var kp = document.querySelector('[data-kp-form]'); if (kp) { kp.setAttribute('data-pm', 'planer');
      if (!kp.querySelector('[name="Quelle"]')) { var sb = kp.querySelector('[type="submit"]'), lab = document.createElement('div'); lab.innerHTML = QSEL; var el = lab.firstChild; var ok = kp.querySelector('.tg') || sb; if (ok && ok.parentNode) ok.parentNode.insertBefore(el, ok); } }
    var ul = document.querySelector('[data-ulform]'); if (ul) {
      ul.setAttribute('data-pm', 'unterlagen');
      ul.addEventListener('submit', function (e) { if (e.defaultPrevented || ul._pmNative) return; e.preventDefault(); handle(ul, 'unterlagen', nat); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();
