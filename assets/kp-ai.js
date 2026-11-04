/* KI-Planung für den Küchenplaner „Ziehen & Planen" – Entwurf Falcon Eye
   Kunde beschreibt Raum und Wünsche in eigenen Worten → Server-KI (Make) plant, sonst der eingebaute
   Planungs-Assistent → fertiger, regelkonformer Plan im Planer, danach nur noch fein anpassen.
   Hängt sich selbst in den Planer ein (Kopf-Knopf + Karte in Schritt 1), braucht kein eigenes Markup. */
(function () {
  'use strict';
  // Optionaler Webhook (z. B. Make-Szenario mit KI). Standard: leer = nur der eingebaute Planungs-Assistent, keine externen Aufrufe.
  // Setzen über window.KPAI_HOOK = 'https://…' oder data-kpai-hook="https://…" am [data-kp]-Element.
  const HOOK = '';
  const MAXLEN = 1500, MAXREQ = 3, MAXSESS = 8, TIMEOUT = 25000, MINWAIT = 2600;

  /* ================= Katalog (Spiegel von kp.js – nur lesen) ================= */
  const HT = [145, 195, 216, 230], HU = [36, 54, 72, 90, 108], W30 = [30, 40, 45, 50, 60], WALL = [30, 40, 45, 50, 60, 80, 90, 100, 120];
  const M = {
    us: { ws: WALL, h: 'b' }, ut: { ws: W30, h: 'b' }, u1: { ws: W30, h: 'b' }, u2: { ws: [60, 70, 80, 90, 100, 120], h: 'b' },
    s2: { ws: WALL, h: 'b' }, s4: { ws: WALL, h: 'b' }, ui: { ws: [30, 40, 45, 50, 60, 80, 90, 100, 120], h: 'b' }, ur: { ws: [15, 20, 30, 40, 45, 50, 60], h: 'b' },
    fa: { ws: [15, 20, 30], h: 'b' }, ap: { ws: [15, 20, 30, 40], h: 'b' }, mt: { ws: [30, 40, 45, 50, 60, 80, 90], h: 'b' },
    sp: { ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'b' }, kf: { ws: [60, 80, 90, 100, 120], h: 'b' }, ko: { ws: [60, 90], h: 'b' }, gs: { ws: [45, 60], h: 'b' },
    ek: { ws: [90], h: 'b', c: 1 }, el: { ws: [100, 110, 120], h: 'b', c: 1 }, eb: { ws: [90, 100, 110, 120], h: 'b', c: 1 },
    bo: { ws: [60], h: 't', hs: HT }, bm: { ws: [60], h: 't', hs: [195, 216, 230] }, kue: { ws: [60], h: 't', hs: [195, 216, 230] },
    vo: { ws: W30, h: 't', hs: HT }, ah: { ws: [15, 20, 30, 40, 45], h: 't', hs: HT }, bs: { ws: W30, h: 't', hs: [195, 216, 230] }, vg: { ws: [40, 45, 50, 60], h: 't', hs: HT },
    h1: { ws: W30, h: 'u', hs: HU }, h2: { ws: [60, 80, 90, 100, 120], h: 'u', hs: HU }, hk: { ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'u', hs: [36, 54, 72, 90] },
    hs: { ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'u', hs: [36, 54, 72] }, hf: { ws: [60, 80, 90, 100, 120], h: 'u', hs: [72, 90] },
    hg: { ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'u', hs: HU }, ho: { ws: WALL, h: 'u', hs: HU }, he: { ws: [55, 60, 65, 70, 80], h: 'u', hs: HU }, dh: { ws: [60, 90, 120], h: 'u' },
  };
  const NM = { us: 'Schubladen', ut: 'Unterschrank', u1: 'Unterschrank', u2: 'Unterschrank', s2: 'Auszüge', s4: 'Schubladen', ui: 'Innenschubladen', ur: 'Regal', fa: 'Flaschenauszug', ap: 'Apotheker klein', mt: 'Mülltrenner', sp: 'Spüle', kf: 'Kochfeld', ko: 'Herd', gs: 'Spülmaschine', ek: 'Eckschrank', el: 'Eckschrank', eb: 'Eckschrank', bo: 'Backofen', bm: 'Backofen + Mikrowelle', kue: 'Kühlschrank', vo: 'Vorratsschrank', ah: 'Apothekerschrank', bs: 'Besenschrank', vg: 'Vitrine' };
  const FORMS = { zeile: { n: 'Küchenzeile', walls: ['N'] }, l: { n: 'L-Küche', walls: ['W', 'N'] }, u: { n: 'U-Küche', walls: ['W', 'N', 'E'] }, zwei: { n: 'zweizeilige Küche', walls: ['N', 'S'] }, insel: { n: 'Küche mit Kochinsel', walls: ['N'], island: 1 } };
  const FN = { zeile: 'Küchenzeile', l: 'L-Küche', u: 'U-Küche', zwei: 'Zweizeilig', insel: 'Mit Kochinsel' };
  const WAN = { N: 'an der Rückwand', W: 'an der linken Wand', E: 'an der rechten Wand', S: 'an der Wand gegenüber' };
  // Spiegel der Farbwelten aus kp.js (gleiche HEX-Werte)
  const FRONTS = [['Weiß', '#f1eee8'], ['Kreide', '#e9e4da'], ['Creme', '#ece3cf'], ['Seidengrau', '#dad6cd'], ['Sand', '#dccdb3'], ['Kaschmir', '#d9cfbf'], ['Sandgrau', '#cfc8bc'], ['Macchiato', '#bba58c'], ['Taupe', '#968777'], ['Eukalyptus', '#a1ae9d'], ['Schilf', '#b6b398'], ['Salbei', '#7f8e77'], ['Olive', '#6c6945'], ['Tannengrün', '#37453a'], ['Taubenblau', '#98a9b5'], ['Steinblau', '#6d7e8b'], ['Fjordblau', '#53687a'], ['Nachtblau', '#22304a'], ['Graphit', '#45474b'], ['Schwarzgrün', '#2c3530'], ['Coffee', '#56443a'], ['Schwarz', '#232426']];
  const HANDLES = { grifflos: 'grifflos', bar: 'mit Edelstahlgriffen', schwarz: 'mit schwarzen Griffen', gold: 'mit Messinggriffen', knopf: 'mit Knopfgriffen' };
  const TOPS = { eiche: 'Eiche', keramik: 'Stein hell', beton: 'Beton', marmor: 'Marmor dunkel' };
  const FINISH = { matt: 'matt', seide: 'seidenmatt', glanz: 'in Hochglanz' };
  const BACKS = ['wand', 'platte', 'fliese', 'glas', 'dibond', 'holz', 'motiv'], WALLC = ['#f3efe9', '#e6dccb', '#d3d7cb', '#cdd5de', '#e2c2ab', '#5a5c5f'], FLOORS = ['eiche', 'dunkel', 'hell', 'grau'];
  const LOOKS = {
    modern: { front: '#cfc8bc', wood: null, handle: 'grifflos', top: 'eiche', finish: 'matt', frame: 0, back: 'platte', wall: '#f3efe9', floor: 'hell' },
    landhaus: { front: '#7f8e77', wood: null, handle: 'gold', top: 'eiche', finish: 'matt', frame: 1, back: 'fliese', wall: '#e6dccb', floor: 'eiche' },
    dunkel: { front: '#232426', wood: null, handle: 'grifflos', top: 'marmor', finish: 'matt', frame: 0, back: 'platte', wall: '#e6dccb', floor: 'eiche' },
    skandi: { front: '#f1eee8', wood: null, handle: 'schwarz', top: 'eiche', finish: 'seide', frame: 0, back: 'wand', wall: '#f3efe9', floor: 'eiche' },
  };
  const DEF_STYLE = { front: '#f1eee8', wood: null, handle: 'grifflos', top: 'eiche', finish: 'matt', wall: '#f3efe9', floor: 'eiche' };
  const OPW = { fenster: [50, 60, 80, 100, 120, 140, 160, 180, 200, 240], balkon: [80, 100, 120, 160, 200, 240], tuer: [80, 90, 100, 110, 125] };
  const ISW = [120, 150, 180, 210, 240, 270];
  const isTall = t => M[t] && M[t].h === 't', isBase = t => M[t] && M[t].h === 'b';
  const FILL = ['us', 'ut', 'u1', 'u2', 's2', 's4', 'ui', 'ur', 'fa', 'ap'];
  const snap = (ws, v) => ws.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) ? x : b, ws[0]);
  const r10 = v => Math.round(v / 10) * 10, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mtr = cm => (cm / 100).toFixed(2).replace('.', ','), mm = (a, b) => `${mtr(a)}\u00a0×\u00a0${mtr(b)}\u00a0m`;

  /* ================= Hash-Format (wie kp.js) ================= */
  const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function current() {
    let o = null; try { const h = location.hash.slice(1); if (h.startsWith('k=')) o = JSON.parse(unb64(h.slice(2))); } catch (e) { o = null; }
    const K = window.KP || {};
    let room = (o && o.r) || null; try { if (!room && K.room) room = K.room(); } catch (e) { }
    let form = (o && o.f) || null; try { if (!form && K.form) form = K.form(); } catch (e) { }
    return { form: FORMS[form] ? form : 'l', room: room && room.w ? { w: room.w, d: room.d } : { w: 480, d: 380 }, style: (o && o.s) || null, ah: (o && o.ah) || 90 };
  }

  /* ================= 1) Text verstehen ================= */
  // Zahlwörter und „3 auf 4 Meter“ in Ziffern bzw. „3 x 4“ übersetzen
  const NW = { ein: 1, eins: 1, eine: 1, einen: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12 };
  const NWR = Object.keys(NW).sort((a, b) => b.length - a.length).join('|');
  // Gesprochene Zahlen ab 13 (eindeutig, darum immer umwandeln): „achtzig“, „fünfundneunzig“, „dreihundertachtzig“
  const U9 = { ein: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
  const TEEN = { zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
  const TENS = { zwanzig: 20, dreißig: 30, dreissig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
  const U9R = 'ein|zwei|zwo|drei|vier|fünf|sechs|sieben|acht|neun', TENR = Object.keys(TENS).join('|'), TEENR = 'dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn';
  const BIG = new RegExp(`(^|[^a-zäöüß])((?:(?:${U9R})?hundert(?:und)?(?:(?:${U9R})und(?:${TENR})|${TENR}|${TEENR}|zehn|elf|zwölf|eins|${U9R})?)|(?:${U9R})und(?:${TENR})|${TENR}|${TEENR})(?=[^a-zäöüß]|$)`, 'g');
  function bigNum(w) {
    let n = 0, r = w; const h = r.match(new RegExp(`^(${U9R})?hundert(?:und)?`));
    if (h) { n = (h[1] ? U9[h[1]] : 1) * 100; r = r.slice(h[0].length); if (!r) return n; }
    if (TEEN[r] != null) return n + TEEN[r]; if (TENS[r] != null) return n + TENS[r];
    const c = r.match(new RegExp(`^(${U9R})und(${TENR})$`)); if (c) return n + U9[c[1]] + TENS[c[2]];
    if (n && (U9[r] != null || r === 'eins')) return n + (r === 'eins' ? 1 : U9[r]);
    return null;
  }
  function normNum(t) {
    const nv = x => NW[x] != null ? NW[x] : x;
    t = t.replace(BIG, (a, pre, w) => { const v = bigNum(w); return v == null ? a : pre + v; });
    t = t.replace(/\banderthalb\b/g, '1,5');
    t = t.replace(new RegExp(`\\b(${NWR})einhalb\\b`, 'g'), (a, w) => String(NW[w] + .5).replace('.', ','));
    t = t.replace(/\b(ein(?:en)?\s+)?halbe[nr]?\s+meter\b/g, '0,5 meter');
    t = t.replace(new RegExp(`\\b(${NWR}|\\d+)\\s+komma\\s+(${NWR}|\\d+)\\b`, 'g'), (a, x, y) => `${nv(x)},${nv(y)}`);
    t = t.replace(new RegExp(`\\b(${NWR})(?=\\s*(meter|metern|m\\b|zentimeter|cm\\b|auf\\b|x\\b|bei\\b))`, 'g'), (a, w) => String(NW[w]));
    t = t.replace(new RegExp(`\\b(auf|x|bei)\\s+(${NWR})\\b`, 'g'), (a, q, w) => `${q} ${NW[w]}`);
    t = t.replace(/(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?\s+(?:auf|bei)\s+(\d+(?:[.,]\d+)?)/g, (a, x, u, y) => `${x}${u ? ' ' + u : ''} x ${y}`);
    // „3 meter 80“ / „3 m 80“ → „3,80 m“ (gesprochen: drei Meter achtzig; „drei Meter fünf“ = 3,05 m)
    t = t.replace(/(^|[^\d,.])(\d)\s*(?:m|meter|metern)\s+(\d{1,2})(?![\d,.])(?!\s*(?:cm|mm|m\b|meter|metern|%|grad))/g, (a, p, x, y) => `${p}${x},${y.length < 2 ? '0' + y : y} m`);
    // „drei 80 x zwei 60“ (Meter weggelassen) → „3,80 x 2,60“
    t = t.replace(new RegExp(`(^|\\s)(${NWR})\\s+(\\d{2})(?=\\s*(?:x\\b|m\\b|meter|metern))`, 'g'), (a, p, w, y) => `${p}${NW[w]},${y}`);
    t = t.replace(/(^|[\s(])(\d)\s+(\d{2})(?=\s*(?:x\b|m\b|meter|metern))/g, '$1$2,$3');
    t = t.replace(/(\bx\s+)(\d)\s+(\d{2})(?!\d|[.,]\d)/g, '$1$2,$3');
    return t;
  }
  const normText = raw => normNum(' ' + String(raw || '').toLowerCase().replace(/[×*]/g, ' x ').replace(/\bmal\b/g, ' x ').replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/zentimeter/g, 'cm').replace(/\s+/g, ' ') + ' ');
  function parse(raw, cur) {
    let t = normText(raw);
    // Millimeter → Zentimeter („3200 x 2400 mm", „3.200 mm")
    t = t.replace(/(\d+(?:[.,]\d+)?)(\s*(?:mm|millimeter)\b)?(\s*x\s*)(\d+(?:[.,]\d+)?)\s*(?:mm|millimeter)\b/g, (a, n1, u1, xx, n2) => mmcm(n1) + ' cm x ' + mmcm(n2) + ' cm').replace(/(\d+(?:[.,]\d+)?)\s*(?:mm|millimeter)\b/g, (a, n) => mmcm(n) + ' cm');
    const has = re => re.test(t);
    const neg = w => new RegExp('(kein\\w*|ohne|nicht|brauche?n? kein\\w*)\\s+(\\S+\\s+){0,2}' + w).test(t);
    const b = { raw: t, budget: null, form: null, formSaid: false, room: null, roomGiven: false, win: { wall: null, w: 120, none: false }, door: { wall: null, w: 90 }, balkon: false, isl: { want: false, v: 'kochfeld', w: null, big: false }, W: {}, style: {}, look: null, ah: null, notes: [], got: [] };
    const N = s => parseFloat(String(s).replace(',', '.'));
    const cm = (v, u) => u === 'cm' ? v : (u && u[0] === 'm') ? v * 100 : (v < 15 ? v * 100 : v);
    const blank = (m) => { t = t.slice(0, m.index) + ' '.repeat(m[0].length) + t.slice(m.index + m[0].length); };
    let m;
    // Budget („Budget 15.000 €", „bis 25000 Euro", „20 Tsd.", „12k €")
    {
      const BU = [[/(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})(?:,-|,00)?\s*(?:€|euro\b|eur\b)/, 1], [/(\d{1,3}(?:[.,]\d)?)\s*(?:tsd\.?|tausend|k(?![a-zäöüß]))\s*(?:€|euro\b|eur\b)?/, 1000], [/(?:budget|preisrahmen|kostenrahmen)\D{0,14}?(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})/, 1]];
      for (const [r, f] of BU) { if (!(m = t.match(r))) continue; const v = f === 1 ? +m[1].replace(/[.\s]/g, '') : parseFloat(m[1].replace(',', '.')) * f; if (v >= 1500 && v <= 250000) { b.budget = Math.round(v / 100) * 100; blank(m); break; } }
    }
    // Körpergröße / Arbeitshöhe
    if ((m = t.match(/(?:ich bin|wir sind|körpergrö(?:ß|ss)e)\D{0,10}?(\d[.,]\d{1,2}|1\d{2})\s*(m|cm)?/)) || (m = t.match(/(\d[.,]\d{1,2}|1\d{2})\s*(m|cm)?\s*gro(?:ß|ss)\b/))) { const v = cm(N(m[1]), m[2]); if (v >= 140 && v <= 215) b.body = v; blank(m); }
    if ((m = t.match(/arbeitshöhe\D{0,14}?(\d{2,3})\s*(cm)?/))) { const v = +m[1]; if (v >= 80 && v <= 110) b.ah = v; blank(m); }
    // Fläche
    if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*(qm|m²|m2|quadratmeter)/))) { const a = N(m[1]); if (a >= 5 && a <= 60) b.area = a; blank(m); }
    // Paar „3,80 x 2,60 m"
    let pair = null;
    if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?\s*x\s*(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?/))) {
      const u2 = m[4] || m[2], a = cm(N(m[1]), m[2] || u2), c = cm(N(m[3]), u2);
      if (a >= 150 && a <= 1200 && c >= 150 && c <= 1200) pair = [a, c]; blank(m);
    }
    // Einzelmaße mit Bezug
    const lab = { w: null, d: null, l: null, gen: [] };
    const re = /(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)(?![a-zäöü²])/g;
    while ((m = re.exec(t))) {
      const v = cm(N(m[1]), m[2]), bef = t.slice(Math.max(0, m.index - 26), m.index), aft = t.slice(m.index + m[0].length, m.index + m[0].length + 16);
      const near = (bef.split(/[,.;:]/).pop() || '') + ' | ' + (aft.split(/[,.;:]/)[0] || '');
      if (/fenster/.test(near) && !/raum|küche|wand/.test(bef.split('fenster').pop())) { if (v >= 40 && v <= 300) b.win.w = snap(OPW.fenster, v); continue; }
      if (/(balkon|terrassen)tür/.test(near)) { b.balkon = true; continue; }
      if (/tür/.test(near)) { if (v >= 60 && v <= 140) b.door.w = snap(OPW.tuer, v); continue; }
      if (/insel/.test(near)) { if (v >= 100 && v <= 320) b.isl.w = v; continue; }
      if (/kochfeld|herd|spüle|spülmaschine|kühlschrank|schrank|backofen|ofen|griff|platte|tief(e)? (der|des) schr/.test(near)) continue;
      if (v < 150 || v > 1200) continue;
      if (/^\s*lang/.test(aft) || /länge\s*(von|:)?\s*$/.test(bef)) lab.l = v;
      else if (/^\s*breit/.test(aft) || /breite\s*(von|:)?\s*$/.test(bef)) lab.w = v;
      else if (/^\s*tief/.test(aft) || /tiefe\s*(von|:)?\s*$/.test(bef)) lab.d = v;
      else lab.gen.push(v);
    }
    let w = null, d = null;
    if (pair) { w = Math.max(...pair); d = Math.min(...pair); }
    else if (lab.gen.length >= 2) { w = Math.max(lab.gen[0], lab.gen[1]); d = Math.min(lab.gen[0], lab.gen[1]); }
    else if (lab.gen.length === 1) w = lab.gen[0];
    if (lab.l) { w = lab.l; d = lab.d || lab.w || d; if (d === w) d = null; } else { if (lab.w) w = lab.w; if (lab.d) d = lab.d; }
    if (!w && !d && b.area) { w = r10(Math.sqrt(b.area) * 115); d = r10(b.area * 10000 / w); }
    b.roomGiven = !!(w || d);
    // Form
    const sayU = has(/\bu[- ]?(küche|form|förmig)|hufeisen|drei (seiten|wänden|wände)/), sayL = has(/\bl[- ]?(küche|form|förmig)|über ?eck|eckküche|winkelküche|winkel\b/);
    const sayZwei = has(/zweizeil|zwei[- ]?zeil|zwei (reihen|zeilen|seiten)|gegenüberliegend|parallel|galley|schlauch|beidseitig/);
    const sayZeile = has(/küchenzeile|einzeil|\bzeile\b|(an )?einer wand|eine wand|gerade küche|nur eine wand/);
    const halb = has(/halbinsel|\btheke|\btresen/);
    b.isl.want = has(/insel/) && !has(/halbinsel/) && !neg('(koch)?insel');
    if (halb && !b.isl.want) b.halb = true;
    b.formSaid = sayU || sayL || sayZwei || sayZeile || b.isl.want;
    let form = b.isl.want ? 'insel' : sayU ? 'u' : sayZwei ? 'zwei' : sayL ? 'l' : sayZeile ? 'zeile' : halb ? 'l' : null;
    b.wantForm = form;
    // Insel-Variante
    if (has(/spüle\s+(auf|in|an)\s+(der|die)\s+insel|insel\s+mit\s+(der\s+|einer\s+)?spüle|spülinsel/)) b.isl.v = 'spuele';
    else if (has(/insel\s+(nur\s+|als\s+|zum\s+)+(arbeits|ablage|theke|tresen|sitzen|frühstück)|frühstücks|sitzplätze|insel zum sitzen|bartheke/) && !has(/koch(en|feld)?\s+(auf|an|in)\s+(der\s+)?insel|kochinsel/)) b.isl.v = 'frei';
    b.isl.big = has(/gro(?:ß|ss)\w*\s+(koch)?insel|insel\s+(gro(?:ß|ss)|lang)/);
    // Wünsche
    const W = b.W;
    W.apo = has(/apotheker/) ? (has(/(klein|schmal|unter)\w*\s+apotheker|apotheker\w*\s+(klein|unten|im unterschrank)/) ? 'small' : 'tall') : null;
    W.micro = has(/mikrowelle|dampfgar|kompaktbackofen|zweiter backofen/);
    W.ovenHigh = has(/backofen\s+(auf|in)\s+(augen|brust|greif)|augenhöhe|hochgebaut|backofen\s+(hoch|oben)|hoh(e|er|en)\s+backofen|ofen\s+(hoch|auf augen)/) || W.micro;
    W.herd = !W.ovenHigh && has(/\bherd\b|backofen\s+(unten|unter dem kochfeld|unterm kochfeld)/);
    W.side = has(/side.?by.?side|amerikanisch|zwei kühl|kühlschrank und (einen )?gefrierschrank|separate\w* gefrier|gefrierschrank (extra|separat|dazu)|extra gefrier/);
    W.bigFridge = W.side || has(/gro(?:ß|ss)\w*\s+(kühl|gefrier)|kühl.?gefrier|gefrierschrank|xxl|viel kühl/);
    W.noDw = neg('(spülmaschine|geschirrspüler|spüler)');
    W.mulde = has(/muldenl|kochfeldabzug|kochfeld mit (integriertem )?abzug|downdraft|nach unten absaug/) || neg('(dunstabzug\\w*|haube|abzugshaube)');
    W.storage = has(/stauraum|vorrat|speisekammer|viel platz|viele schränke|gro(?:ß|ss)\w* familie|viel geschirr/);
    W.besen = has(/besen|staubsauger|putzschrank|putzmittel/);
    W.vitrine = has(/vitrine|glastür|glasschrank/);
    W.noUp = neg('(hängeschr\\w*|oberschr\\w*|hängeschränke|oberschränke)') || has(/offene regale statt|ohne oberschränke|luftig/);
    W.upAll = !W.noUp && has(/viele hängeschr|hängeschränke (überall|rundum|an allen)/);
    W.muell = has(/müll/);
    W.bigSink = has(/gro(?:ß|ss)\w*\s+spüle|doppelspüle|zwei becken|doppelbecken|gro(?:ß|ss)es becken/);
    W.bigHob = has(/(90|120)\s*(cm|er)?\s*kochfeld|kochfeld\s*(mit\s*)?(90|120)|gro(?:ß|ss)\w*\s+kochfeld|viel kochen|koche gern|kochen gern|hobbykoch|5 platten|fünf platten/);
    W.corner = has(/karussell/) ? 'ek' : has(/le.?mans/) ? 'el' : has(/blindeck/) ? 'eb' : null;
    // Fenster / Türen
    const clauses = t.split(/[.;!?\n]| und |, /);
    const wallOf = c => /lang/.test(c) ? 'lang' : /kurz/.test(c) ? 'kurz' : /\blink|\blinks/.test(c) ? 'W' : /\brecht/.test(c) ? 'E' : /gegenüber|vorn|vorne/.test(c) ? 'S' : /hinten|rückwand|hinter/.test(c) ? 'N' : null;
    if (neg('fenster')) b.win.none = true;
    const fc = clauses.find(c => /fenster/.test(c) && wallOf(c)); if (fc) b.win.wall = wallOf(fc);
    if (has(/gro(?:ß|ss)\w*\s+fenster|bodentief|panorama/)) b.win.w = Math.max(b.win.w, 160);
    const dc = clauses.find(c => /(tür|eingang)/.test(c) && !/(balkon|terrass|schrank|glas)tür/.test(c) && wallOf(c)); if (dc) { const x = wallOf(dc); b.door.wall = /lang|kurz/.test(x) ? null : x; }
    if (has(/(balkon|terrass|garten)\w*tür|zum balkon|zur terrass|zum garten|auf die terrass/)) b.balkon = true;
    // Anschlüsse: „Wasser kommt links aus der Wand“, „Starkstrom an der Rückwand“
    const wc = clauses.find(c => /wasser|abfluss|abwasser/.test(c) && wallOf(c)); if (wc) b.water = { wall: wallOf(wc) };
    const hc = clauses.find(c => /starkstrom|herdanschluss|drehstrom|400 ?v(olt)?\b/.test(c) && wallOf(c)); if (hc) b.herdcx = { wall: wallOf(hc) };
    // „Heizkörper unterm Fenster“, „Abluft (150er) an der rechten Wand“
    const zc = clauses.find(c => /heizk(ö|oe)rper|heizung/.test(c) && !/fu(ß|ss)boden/.test(c)); if (zc) b.heat = { wall: wallOf(zc), win: /fenster/.test(zc) };
    const vc = clauses.find(c => /abluft|mauerkasten|wanddurchbruch|mauerdurchbruch/.test(c) && !/umluft/.test(c)); if (vc) { const dm = vc.match(/\b(100|125|150|160)\b/); b.vent = { wall: wallOf(vc), d: dm ? +dm[1] : 150 }; }
    // Stil
    const st = b.style;
    if ((m = t.match(/grifflos|ohne griff\w*|griffleiste|push.?to.?open|tip.?on/))) { st.handle = 'grifflos'; blank(m); }
    else if ((m = t.match(/(messing|gold\w*|bronze)\w*\s*(griff\w*)?|griff\w*\s+(in|aus)\s+(messing|gold)/))) { st.handle = 'gold'; blank(m); }
    else if ((m = t.match(/schwarz\w*\s+griff\w*|griff\w*\s+(in\s+)?schwarz/))) { st.handle = 'schwarz'; blank(m); }
    else if ((m = t.match(/(edelstahl|chrom|silber\w*)\s*griff\w*|stangengriff\w*|griff\w*\s+(in|aus)\s+edelstahl/))) { st.handle = 'bar'; blank(m); }
    else if ((m = t.match(/knöpfe|knopf\w*|knauf|knäufe/))) { st.handle = 'knopf'; blank(m); }
    if ((m = t.match(/(arbeits)?platte\w*\s+(in\s+|aus\s+)?(\w+\s+)?(eiche|holz|stein|keramik|quarz|granit|beton|marmor|schwarz|dunkel|hell|weiß)\w*|(holz|eichen|stein|keramik|quarz|granit|beton|marmor)(arbeits)?platte/))) {
      const s = m[0]; st.top = /eiche|holz/.test(s) ? 'eiche' : /beton/.test(s) ? 'beton' : /marmor|schwarz|dunkel/.test(s) ? 'marmor' : 'keramik'; blank(m);
    } else if (has(/marmor/)) st.top = 'marmor'; else if (has(/beton/)) st.top = 'beton'; else if (has(/keramik|quarz|naturstein|granit/)) st.top = 'keramik';
    if ((m = t.match(/(parkett|holzboden|dielen|eichenboden|dunkle\w*\s+(holz)?boden|dunkler boden|helle\w*\s+fliesen|weiße\w*\s+fliesen|graue\w*\s+fliesen|grauer boden|betonboden|boden\s+(in\s+)?(eiche|holz|dunkel|grau|hell)\w*)/))) {
      const s = m[0]; st.floor = /dunkel/.test(s) ? 'dunkel' : /grau|beton/.test(s) ? 'grau' : /hell|weiß/.test(s) ? 'hell' : 'eiche'; blank(m);
    }
    if ((m = t.match(/wand\w*\s+(in\s+)?(salbei|grün|blau|terrakotta|anthrazit|sand|beige|weiß)\w*/))) { const s = m[0]; st.wall = /salbei|grün/.test(s) ? '#d3d7cb' : /blau/.test(s) ? '#cdd5de' : /terra/.test(s) ? '#e2c2ab' : /anthrazit/.test(s) ? '#5a5c5f' : /sand|beige/.test(s) ? '#e6dccb' : '#f3efe9'; blank(m); }
    if ((m = t.match(/(granit\w*\s+)?schwarz\w*\s+(granit)?spüle|spüle\w*\s+(in\s+|aus\s+)?(granit\s+)?schwarz/))) { st.sink = 'gschwarz'; blank(m); }
    else if ((m = t.match(/anthrazit\w*\s+spüle|spüle\w*\s+(in\s+|aus\s+)?(granit\s+)?anthrazit/))) { st.sink = 'ganth'; blank(m); }
    else if ((m = t.match(/keramik\w*spüle|keramik\w*\s+spüle|weiße\w*\s+spüle|spüle\w*\s+(in\s+|aus\s+)?(keramik|weiß)/))) { st.sink = 'kweiss'; blank(m); }
    else if ((m = t.match(/edelstahl\w*\s*spüle|spüle\w*\s+(in\s+|aus\s+)?edelstahl/))) { st.sink = 'edel'; blank(m); }
    if ((m = t.match(/schwarz\w*\s+armatur|armatur\w*\s+(in\s+)?schwarz/))) { st.tap = 'schwarz'; blank(m); }
    else if ((m = t.match(/(messing|gold)\w*\s*armatur|armatur\w*\s+(in\s+|aus\s+)?(messing|gold)/))) { st.tap = 'gold'; blank(m); }
    if (has(/inselhaube|haube über der insel/)) st.ihood = 'insel'; else if (has(/deckenlüfter|deckenhaube|abzug in der decke/)) { st.ihood = 'decke'; st.hood = 'decke'; }
    else if (has(/flachschirm|flachhaube/)) st.hood = 'flach'; else if (has(/\besse\b|pyramide/)) st.hood = 'esse';
    if (has(/metro|fliesenspiegel|fliesen an der wand|wandfliesen/)) st.back = 'fliese'; else if (has(/glasrückwand|rückwand aus glas/)) st.back = 'glas';
    if (has(/hochglanz|glänzend|glanz\b/)) st.finish = 'glanz'; else if (has(/seidenmatt|seidig/)) st.finish = 'seide'; else if (has(/\bmatt/)) st.finish = 'matt';
    if (has(/landhaus|rahmenfront|kassette|klassisch|country|cottage/)) { b.look = 'landhaus'; st.frame = 1; }
    else if (has(/skandi|skandinav|nordisch/)) b.look = 'skandi';
    // Farben außerhalb der Planer-Töne (rot, gelb, rosa …) werden als Wunschfarbe übernommen
    const col = [[/bordeaux|weinrot|dunkelrot|burgunder/, '#6e2a33'], [/terrakotta|terracotta|rostrot|ziegelrot|ziegelfarb/, '#b5603f'], [/senfgelb|\bsenf|\bocker/, '#c39a3c'], [/aubergine|\bpflaume/, '#5b4058'], [/flieder|lavendel/, '#b9abc9'], [/türkis/, '#3f8a8c'],
      [/schwarzgrün|schwarz-grün/, '#2c3530'], [/tannengrün|dunkelgrün|flaschengrün|waldgrün/, '#37453a'], [/oliv/, '#6c6945'], [/eukalyptus|mint/, '#a1ae9d'], [/schilf/, '#b6b398'], [/salbei|grün/, '#7f8e77'],
      [/taubenblau|hellblau|graublau|blaugrau/, '#98a9b5'], [/fjord|petrol/, '#53687a'], [/steinblau/, '#6d7e8b'], [/nachtblau|dunkelblau|navy|\bblau/, '#22304a'],
      [/\bcoffee\b|\bmokka\b|kaffeebraun|schokobraun|dunkelbraun|\bbraune?n?\b/, '#56443a'], [/macchiato|cappuccino|milchkaffee/, '#bba58c'], [/taupe/, '#968777'], [/kaschmir|cashmere|beige/, '#d9cfbf'], [/sandgrau|greige|hellgrau|\bgrau\b|\bgraue/, '#cfc8bc'], [/sandfarb|\bsand\b/, '#dccdb3'],
      [/seidengrau|lichtgrau/, '#dad6cd'], [/kreide|kalkweiß|altweiß|naturweiß/, '#e9e4da'], [/creme|elfenbein|vanille/, '#ece3cf'], [/\brot(e|en|er|es)?\b|signalrot|kirschrot/, '#a8443a'], [/\bgelb(e|en|er|es)?\b|zitronengelb|sonnengelb/, '#e0c25a'], [/\borange(n|farben)?\b|apricot|aprikose/, '#d0783f'],
      [/altrosa|\brosa\b|rosé|\bpink\b|puderrosa/, '#d6aaa4'], [/\blila\b|violett/, '#5b4058'], [/graphit|grafit|anthrazit|dunkelgrau/, '#45474b'], [/schwarz/, '#232426'], [/weiß|\bweiße|\bhell\b|hell und|helle küche/, '#f1eee8']];
    const fc2 = col.find(([r]) => r.test(t)); if (fc2) st.front = fc2[1];
    const wood = has(/nussbaum|walnuss|\bnuss/) ? 'nuss' : has(/eiche|holz/) ? 'eiche' : null;
    if (wood) { if (!st.front && !b.look) { st.wood = wood; if (!st.top) st.top = wood === 'nuss' ? 'keramik' : 'marmor'; } else if (!st.top) st.top = 'eiche'; }
    if (!b.look && !st.front && !st.wood && has(/dunkel|elegant/)) b.look = 'dunkel';
    if (!b.look && has(/modern|minimalist|puristisch/) && !st.front) b.look = 'modern';
    if (st.front && st.front !== '#232426' && st.front !== '#45474b' && st.front !== '#22304a' && b.look === 'dunkel') b.look = null;
    // Arbeitshöhe aus Körpergröße
    if (!b.ah && b.body) b.ah = clamp(Math.round(b.body / 2 + 5), 84, 106);

    /* --- Form und Raum festlegen --- */
    const cw = cur.room.w, cd = cur.room.d;
    if (!form) form = cur.form === 'insel' && !b.isl.want ? 'l' : cur.form;
    let room;
    if (b.roomGiven) {
      w = w || cw; d = d || (form === 'zwei' ? 300 : form === 'insel' ? 420 : Math.min(cd, Math.max(240, Math.round(w * 0.8))));
      room = { w: clamp(r10(w), 240, 800), d: clamp(r10(d), 240, 700) };
    } else room = { w: cw, d: cd };
    if (form === 'insel') {
      const hi = Math.max(room.w, room.d), lo = Math.min(room.w, room.d);
      if (!b.roomGiven) { room.d = Math.max(room.d, 420); }
      else if (lo >= 380) room = { w: hi, d: lo };
      else if (hi >= 400 && lo >= 300) room = { w: lo, d: hi };
      else {
        
        form = sayU ? 'u' : sayZwei ? 'zwei' : sayZeile ? 'zeile' : 'l';
        b.notes.push(`Eine Kochinsel braucht rund 4 m Raumtiefe und ringsum gut 1 m Laufweg – bei ${mtr(room.w)} × ${mtr(room.d)} m wäre es zu eng. Darum ${form === 'l' ? 'über Eck' : 'als ' + FORMS[form].n} geplant: Die Arbeitsfläche ist trotzdem großzügig.`);
        b.islDropped = true;
      }
    }
    if (form === 'zwei' && room.d > 420 && b.roomGiven) b.notes.push('Bei zweizeiligen Küchen sind 1,20 bis 1,50 m Gang ideal – die Zeilen stehen an den langen Wänden.');
    b.form = form; b.room = room;
    if (b.halb) b.notes.push('Eine Halbinsel oder Theke plant der Online-Planer als L-Schenkel – die genaue Theke zeichnet das Studio danach ein.');
    // Erkanntes für die Chips
    const g = b.got;
    if (b.formSaid || b.halb) g.push(FORMS[form].n.replace(/^k/, 'K')); else g.push(FORMS[form].n.replace(/^k/, 'K') + ' (Vorschlag)');
    if (b.roomGiven) g.push(`Raum ${mm(room.w, room.d)}`);
    if (b.win.none) g.push('Kein Fenster'); else if (b.win.wall) g.push('Fenster ' + ({ lang: 'an der langen Wand', kurz: 'an der kurzen Wand', W: 'links', E: 'rechts', S: 'gegenüber', N: 'an der Rückwand' })[b.win.wall]);
    if (/spüle\s+(unter|am|vor)\s+(dem\s+)?fenster/.test(t)) g.push('Spüle am Fenster');
    if (b.isl.want) g.push(b.islDropped ? 'Insel (zu wenig Platz)' : 'Kochinsel' + (b.isl.v === 'spuele' ? ' mit Spüle' : b.isl.v === 'frei' ? ' als Arbeitsfläche' : ''));
    if (W.apo) g.push(W.apo === 'tall' ? 'Apothekerschrank' : 'Apotheker klein'); if (W.ovenHigh) g.push(W.micro ? 'Backofen + Mikrowelle hoch' : 'Backofen auf Augenhöhe');
    if (W.side) g.push('Kühl- und Gefrierschrank'); else if (W.bigFridge) g.push('Großer Kühlschrank');
    if (W.mulde) g.push('Muldenlüfter'); if (W.storage) g.push('Viel Stauraum'); if (W.noDw) g.push('Ohne Spülmaschine'); if (W.muell) g.push('Mülltrenner');
    if (W.besen) g.push('Besenschrank'); if (W.vitrine) g.push('Vitrine'); if (W.noUp) g.push('Ohne Hängeschränke'); if (W.bigSink) g.push('Große Spüle'); if (W.bigHob) g.push('Großes Kochfeld'); if (W.herd) g.push('Herd mit Backofen unten');
    if (b.balkon) g.push('Balkontür');
    if (b.water) g.push('Wasser ' + ({ lang: 'an der langen Wand', kurz: 'an der kurzen Wand', W: 'links', E: 'rechts', S: 'gegenüber', N: 'an der Rückwand' })[b.water.wall]);
    if (b.look) g.push({ landhaus: 'Landhaus', skandi: 'Skandinavisch', dunkel: 'Elegant dunkel', modern: 'Modern' }[b.look]);
    if (st.front) g.push(fnm({ front: st.front })); if (st.wood) g.push(st.wood === 'nuss' ? 'Nussbaum' : 'Eiche-Fronten');
    if (st.handle) g.push({ grifflos: 'Grifflos', gold: 'Messinggriffe', schwarz: 'Schwarze Griffe', bar: 'Edelstahlgriffe', knopf: 'Knopfgriffe' }[st.handle]);
    if (st.top) g.push('Platte ' + TOPS[st.top]); if (st.finish) g.push({ matt: 'Matt', seide: 'Seidenmatt', glanz: 'Hochglanz' }[st.finish]);
    if (b.ah) g.push(`Arbeitshöhe ${b.ah} cm`);
    if (b.budget) g.push(`Budget rund ${eur(b.budget)} €`);
    return b;
  }

  /* ================= 2) Planen (regelbasiert) ================= */
  function decompose(X, fa) {
    if (X === 0) return []; if (X < 0 || X % 5) return null;
    const P = [120, 100, 90, 80, 60, 50, 45, 40, 30].concat(fa ? [20, 15] : []), n = X / 5, best = new Array(n + 1).fill(null);
    const cost = c => c.length * 10 + c.reduce((s, w) => s + (w < 30 ? 30 : 0) + (w === 45 ? 3 : 0) + Math.abs(w - 70) / 25, 0);
    best[0] = [];
    for (let i = 1; i <= n; i++) { let bb = null; for (const p of P) { const k = p / 5; if (k > i || !best[i - k]) continue; const c = best[i - k].concat(p); if (!bb || cost(c) < cost(bb)) bb = c; } best[i] = bb; }
    return best[n] ? best[n].slice().sort((a, b) => b - a) : null;
  }
  const ok30 = v => v === 0 || (v >= 30 && !!decompose(v));
  // Wand füllen: feste Module + flexible Füllstücke (Schubladenschränke) → exakt Wandlänge
  function layWall(seq, L, kind) {
    const fixed = seq.filter(x => !x.F).reduce((s, x) => s + x.w, 0), fl = seq.filter(x => x.F);
    const T = L - fixed, mins = fl.reduce((s, x) => s + x.min, 0);
    if (!fl.length) return T === 0 ? seq.map(x => [x.t, x.w].concat(x.q ? [x.q] : [])) : null;
    if (T < mins) return null;
    fl.forEach(x => x.v = x.min);
    const R = T - mins, ws = fl.reduce((s, x) => s + x.wt, 0) || 1;
    fl.forEach(x => { x.v += Math.floor(R * x.wt / ws / 10) * 10; });
    let left = T - fl.reduce((s, x) => s + x.v, 0);
    fl.forEach(x => { if (x.max && x.v > x.max) { left += x.v - x.max; x.v = x.max; } });
    const sink = fl.filter(x => !x.max).sort((a, b) => b.wt - a.wt)[0] || fl[fl.length - 1]; sink.v += left;
    for (let it = 0; it < 12; it++) {
      const bad = fl.find(x => !ok30(x.v)); if (!bad) break; let fixd = false;
      for (const dl of [10, -10, 20, -20, 5, -5, 15, -15, 30, -30]) {
        for (const o of fl) { if (o === bad) continue; const a = bad.v + dl, c = o.v - dl; if (a >= bad.min && c >= o.min && ok30(a) && ok30(c)) { bad.v = a; o.v = c; fixd = true; break; } }
        if (fixd) break;
      }
      if (!fixd) for (const it2 of seq) { if (!it2.adj) continue; for (const nw of it2.adj.slice().sort((p, q) => Math.abs(p - it2.w) - Math.abs(q - it2.w))) { const a = bad.v + it2.w - nw; if (nw !== it2.w && a >= bad.min && ok30(a)) { bad.v = a; it2.w = nw; fixd = true; break; } } if (fixd) break; }
      if (!fixd) break;
    }
    const out = [];
    for (const x of seq) {
      if (!x.F) { out.push([x.t, x.w].concat(x.q ? [x.q] : [])); continue; }
      const parts = (x.v >= 30 || x.v === 0) && decompose(x.v) || decompose(x.v, true); if (!parts) return null;
      parts.forEach(p => out.push([p < 30 ? 'fa' : (kind === 'store' && p >= 80 ? 'ui' : 'us'), p]));
    }
    return out;
  }
  const F = (min, wt, max) => ({ F: 1, min, wt, max: max || 0 }), C = (t, w, q) => ({ t, w, q });
  function seqs(f, c) {
    const A = (t, w) => Object.assign(C(t, w), { adj: M[t].ws.filter(v => v >= 30 && (t !== 'sp' || v <= 100) && (t !== 'kf' || v <= 90)) });
    const T = c.talls.map(t => ['vo', 'ah', 'bs', 'vg'].includes(t) ? A(t, t === 'ah' ? 30 : 60) : C(t, 60)), cook = c.cook ? [c.cook.t === 'kf' ? A('kf', c.cook.w) : C(c.cook.t, c.cook.w)].concat(c.apS ? [A('ap', c.apS)] : []) : [];
    const sinkB = [].concat(c.mt ? [A('mt', c.mt)] : [], [A('sp', c.sink)], c.dw ? [A('gs', c.dw)] : []);
    const fm = c.fmin, wk = c.work, cl = c.cornerL ? [c.cornerL.t === 'ek' ? C('ek', 90) : A(c.cornerL.t, c.cornerL.w)] : [], cr = c.cornerR ? [A(c.cornerR.t, c.cornerR.w)] : [];
    const split = (n) => [T.slice(0, n), T.slice(n)];
    if (f === 'zeile' || f === 'insel') {
      const [TL, TR] = split(3), tr = TR.length ? [F(0, 1)].concat(TR) : [F(0, 1)];
      if (f === 'insel' && c.islV === 'kochfeld') return { N: [...TL, F(fm, 1), ...sinkB, ...tr] };
      if (f === 'insel' && c.islV === 'spuele') return { N: [...TL, F(fm, 1), ...cook, F(fm, 2), ...TR] };
      return { N: [...TL, F(fm, 1), ...cook, F(wk, 2, 120), ...sinkB, ...tr] };
    }
    if (f === 'l') {
      const capW = c.room.d - 60 - (c.cornerL && c.cornerL.t === 'ek' ? 30 : 0) - (c.sinkWall === 'W' ? c.sink + c.dw + c.mt + fm : 0);
      let n = 0, s = 0; while (n < T.length && s + T[n].w <= capW) { s += T[n].w; n++; }
      const [TW, TN] = split(n);
      if (c.sinkWall === 'W') return { W: [...TW, F(fm, 1), ...sinkB, F(0, 1)], N: [...(cl.length ? cl : [F(fm, 1)]), ...cook, F(fm, 2), ...TN] };
      return { W: [...TW, F(0, 1)], N: [...(cl.length ? cl : [F(fm, 1)]), ...cook, F(wk, 2, 120), ...sinkB, F(0, 1), ...TN] };
    }
    if (f === 'u') {
      const capW = c.room.d - 60 - (c.cornerL && c.cornerL.t === 'ek' ? 30 : 0);
      let n = 0, s = 0; while (n < T.length && s + T[n].w <= capW) { s += T[n].w; n++; }
      const [TW, TE] = split(n);
      return { W: [...TW, F(0, 1)], N: [...(cl.length ? cl : []), F(0, 1), ...sinkB, F(0, 1), ...cr], E: [F(fm, 1), ...cook, F(fm, 2), ...TE] };
    }
    // zweizeilig
    const [TN, TS] = split(2);
    const a = [...TN, F(fm, 1), ...sinkB, F(0, 1)], b2 = [F(fm, 1), ...cook, F(fm, 2), ...TS];
    return c.sinkWall === 'S' ? { N: [...TN, F(fm, 1), ...cook, F(fm, 2)], S: [F(0, 1), ...sinkB, F(fm, 1), ...TS] } : { N: a, S: b2 };
  }
  function usableOf(w, rows, f, room) {
    const N = rows.N || [], L = (w === 'N' || w === 'S') ? room.w : room.d, walls = FORMS[f].walls;
    if (w === 'W') return L - (N.length ? 60 + (N[0] && N[0].t === 'ek' ? 30 : 0) : 0);
    if (w === 'E') return L - (N.length ? 60 + (N.length && N[N.length - 1].t === 'ek' && walls.includes('E') ? 30 : 0) : 0);
    return L;
  }
  function generate(b, cur, opt) {
    opt = opt || {};
    const f = b.form, room = b.room, W = b.W, notes = b.notes.slice();
    // Fensterwand → Spülenwand
    const walls = FORMS[f].walls;
    let ww = b.win.none ? null : b.win.wall;
    if (ww === 'lang') ww = room.w >= room.d ? 'N' : (walls.includes('W') ? 'W' : walls.includes('E') ? 'E' : 'W');
    if (ww === 'kurz') ww = room.w < room.d ? 'N' : (walls.includes('W') ? 'W' : 'W');
    let sinkWall = 'N';
    if (f === 'l' && ww === 'W') sinkWall = 'W';
    if (f === 'zwei' && ww === 'S') sinkWall = 'S';
    if (opt.altSink && f === 'l') sinkWall = sinkWall === 'W' ? 'N' : 'W';
    if (opt.altSink && f === 'zwei') sinkWall = sinkWall === 'S' ? 'N' : 'S';
    if (opt.wsink && walls.includes(opt.wsink) && (f === 'l' || f === 'zwei')) sinkWall = opt.wsink;   // Wasser bestimmt die Spülenwand
    const isl = f === 'insel' ? { w: 180, v: b.isl.v } : null;
    if (isl) { const mx = Math.min(b.isl.big ? 270 : 240, room.w - 180); isl.w = b.isl.w ? snap(ISW, b.isl.w) : (ISW.filter(v => v <= mx).pop() || 120); if (isl.w > room.w - 140) isl.w = ISW.filter(v => v <= room.w - 140).pop() || 120; }
    const talls = ['kue'], islCook = !!(isl && isl.v === 'kochfeld'), herd = !islCook && (W.herd || !!opt.herd);
    if (W.side) talls.push('kue');
    if (!herd) talls.push(W.micro ? 'bm' : 'bo');
    if (islCook && W.herd) notes.push('Gekocht wird auf der Insel – der Backofen sitzt darum im Hochschrank, unter dem Kochfeld bleibt Platz für Töpfe.');
    if (W.apo === 'tall') talls.push('ah');
    if (W.storage) talls.push('vo');
    if (W.storage && room.w >= 500) talls.push('vo');
    if (W.besen) talls.push('bs');
    if (W.vitrine) talls.push('vg');
    const ctx = {
      room, talls, sink: W.bigSink ? 100 : 80, dw: W.noDw || opt.noDw ? 0 : 60, mt: W.muell ? 60 : 0, apS: W.apo === 'small' ? 30 : 0,
      cook: islCook ? null : herd ? { t: 'ko', w: W.bigHob ? 90 : 60 } : { t: 'kf', w: W.bigHob ? 90 : 80 },
      cornerL: (f === 'l' || f === 'u') ? (W.corner === 'ek' ? { t: 'ek', w: 90 } : W.corner === 'eb' || (b.budget && b.budget < 10000 && W.corner !== 'el') ? { t: 'eb', w: 100 } : { t: 'el', w: 110 }) : null,
      cornerR: f === 'u' ? { t: 'eb', w: 100 } : null, sinkWall, islV: isl ? isl.v : null, fmin: 30, work: 60,
    };
    const rmT = (c, t) => { const i = c.talls.lastIndexOf(t); if (i < 0 || (t === 'kue' && c.talls.indexOf('kue') === i)) return false; c.talls.splice(i, 1); return true; };
    const RED = [
      c => rmT(c, 'vg'), c => rmT(c, 'bs'), c => c.talls.filter(t => t === 'vo').length > 1 && rmT(c, 'vo'),
      c => c.mt ? (c.mt = 0, true) : false,
      c => c.sink > 80 ? (c.sink = 80, true) : false,
      c => c.cook && c.cook.w > 80 && c.cook.t === 'kf' ? (c.cook.w = 80, true) : false,
      c => c.cornerL && c.cornerL.t === 'el' && c.cornerL.w > 100 ? (c.cornerL.w = 100, true) : false,
      c => c.cornerR && c.cornerR.w > 90 ? (c.cornerR.w = 90, true) : false,
      c => rmT(c, 'vo'),
      c => c.talls.includes('ah') ? (rmT(c, 'ah'), c.apS = 30, true) : false,
      c => c.work > 30 ? (c.work = 30, true) : false,
      c => c.dw === 60 ? (c.dw = 45, true) : false,
      c => c.sink > 60 ? (c.sink = 60, true) : false,
      c => c.cook && c.cook.w > 60 ? (c.cook.w = 60, true) : false,
      c => c.talls.filter(t => t === 'kue').length > 1 ? rmT(c, 'kue') : false,
      c => c.apS ? (c.apS = 0, true) : false,
      c => c.cornerL && c.cornerL.t !== 'eb' && c.cornerL.t !== 'ek' ? (c.cornerL = { t: 'eb', w: 90 }, true) : false,
      c => c.cornerL && c.cornerL.t === 'ek' ? (c.cornerL = { t: 'eb', w: 90 }, true) : false,
      c => { const i = c.talls.findIndex(t => t === 'bo' || t === 'bm'); if (i < 0 || !c.cook || c.cook.t !== 'kf') return false; c.talls.splice(i, 1); c.cook = { t: 'ko', w: 60 }; return true; },
      c => c.fmin > 0 ? (c.fmin = 0, true) : false,
      c => c.work > 0 ? (c.work = 0, true) : false,
      c => c.dw ? (c.dw = 0, true) : false,
      c => rmT(c, 'ah') || rmT(c, 'bs') || rmT(c, 'vg') || rmT(c, 'vo'),
    ];
    // Wie viele cm fehlen (je Wand, aufsummiert)? – Reduktionen nur übernehmen, wenn sie genau dort helfen
    const short = c => { const sq = seqs(f, c); return walls.reduce((a, w) => { const need = sq[w].reduce((s2, x) => s2 + (x.F ? x.min : x.w), 0) - usableOf(w, sq, f, room); return a + Math.max(0, need); }, 0); };
    const tryLay = c => { const out = {}; for (const w of walls) { const sq = seqs(f, c); const r = layWall(sq[w], usableOf(w, sq, f, room), W.storage ? 'store' : ''); if (!r) return null; out[w] = r; } return out; };
    const clone = c => JSON.parse(JSON.stringify(c));
    let rows = null, c0 = ctx;
    for (let g = 0; g < 60; g++) {
      rows = tryLay(c0); if (rows) break;
      if (c0.dw) { const c2 = clone(c0); c2.dw = c0.dw === 60 ? 45 : 60; rows = tryLay(c2); if (rows) { c0 = c2; break; } }
      const sf = short(c0); let next = null;
      for (const red of RED) { const c2 = clone(c0); if (!red(c2)) continue; if (sf <= 0 || short(c2) < sf) { next = c2; break; } }
      if (!next) break; c0 = next;
    }
    Object.assign(ctx, c0);
    if (!rows) return null;
    const plan = { f, r: { w: room.w, d: room.d }, rw: rows, tp: {}, op: [], is: isl || { w: 180, v: 'kochfeld' }, s: null, ah: b.ah || cur.ah || 90 };
    walls.forEach(w => plan.tp[w] = (w === 'N' || f === 'zwei' || W.upAll || (W.storage && f !== 'u')) ? 1 : 0);
    if (W.noUp) walls.forEach(w => plan.tp[w] = 0);
    placeOps(plan, b, ww, sinkWall);
    // Im Raum-Schritt bestätigt: Fenster und Türen stehen genau dort
    if (Array.isArray(b.fixOps) && b.fixOps.length) plan.op = b.fixOps.filter(o => OPW[o[0]] && ['N', 'E', 'S', 'W'].includes(o[1])).map(([t, w, s0, ow]) => { const L = wlen(plan, w), mg = t === 'fenster' ? 10 : 5, wd = Math.min(ow, L - 2 * mg); return [t, w, Math.round(clamp(s0, mg, L - wd - mg) / 5) * 5, wd]; });
    if (b.water && ['N', 'E', 'S', 'W'].includes(b.water.wall)) plan.cx = [['wasser', b.water.wall, Math.round(b.water.s != null ? b.water.s : wlen(plan, b.water.wall) / 2)]];
    { const xc = extraCx(plan, b); if (xc.length) plan.cx = (plan.cx || []).concat(xc); }
    plan.s = buildStyle(b, cur);
    // … und die Spüle rückt zum Wasser oder unters Fenster – nur wenn es insgesamt besser wird
    if (plan.cx) { try { sinkToWater(plan, { wall: plan.cx[0][1], s: plan.cx[0][2] }); } catch (e) { } }
    else if (Array.isArray(b.fixOps) && b.fixOps.length) { const fw = plan.op.find(o => o[0] === 'fenster' && plan.rw[o[1]]); if (fw) try { sinkToWater(plan, { wall: fw[1], s: fw[2] + fw[3] / 2 }); } catch (e) { } }
    if (W.mulde && Object.values(plan.rw).some(r => r.some(m => m[0] === 'kf' || m[0] === 'ko'))) plan.s.hobV = 'dd';
    // … und das Kochfeld steht nie unter einem Fenster: davor dürfte keine Haube hängen
    try { if (underWin(plan) && !cookFromWindow(plan) && underWin(plan)) { plan.s.hobV = 'dd'; notes.push('Neben dem Fenster ist kein Platz fürs Kochfeld – darum ein Muldenlüfter, der den Dampf direkt am Kochfeld absaugt. Vor dem Fenster hängt so keine Haube.'); } } catch (e) { }
    // Ehrliche Hinweise: was gewünscht war, aber nicht hineinpasst
    const all = [].concat(...walls.map(w => rows[w].map(m => m[0]))), cnt = t => all.filter(x => x === t).length;
    if (W.apo === 'tall' && !cnt('ah')) notes.push(cnt('ap') ? 'Für den großen Apothekerschrank reicht die Wand nicht – darum ein schmaler Apotheker-Auszug direkt am Kochfeld.' : 'Für einen Apothekerschrank reicht der Platz leider nicht – im Planer lässt er sich gegen einen anderen Schrank tauschen.');
    if (W.apo === 'small' && !cnt('ap')) notes.push('Der schmale Apotheker-Auszug hat keinen Platz mehr gefunden – im Planer unter „Unten" einfach dazuziehen.');
    if (W.ovenHigh && !cnt('bo') && !cnt('bm')) notes.push('Für einen Backofen auf Augenhöhe ist die Wand zu knapp – darum ein Herd mit Backofen unter dem Kochfeld.');
    if (W.side && cnt('kue') < 2) notes.push('Für Kühl- und Gefrierschrank nebeneinander reicht der Platz nicht – geplant ist eine große Kühl-Gefrier-Kombination.');
    if (W.storage && !cnt('vo')) notes.push('Ein eigener Vorratsschrank passte nicht – Stauraum gibt es dafür in breiten Auszügen und Hängeschränken.');
    if (W.besen && !cnt('bs')) notes.push('Für den Besenschrank reicht die Wand nicht – Tipp: Flur oder Hauswirtschaftsraum.');
    if (W.vitrine && !cnt('vg')) notes.push('Die Vitrine hat keinen Platz mehr gefunden – im Planer gibt es auch Glas-Hängeschränke.');
    if (W.muell && !cnt('mt')) notes.push('Der Mülltrenner sitzt bei dieser Größe am besten im Spülenschrank.');
    if (!W.noDw && !cnt('gs') && !(isl && isl.v === 'spuele')) notes.push('Eine Spülmaschine passt bei dieser Wandlänge leider nicht hinein.');
    if (opt.herd && cnt('ko') && !W.herd) notes.push('Bei dieser Wandlänge sitzt der Backofen im Herd unter dem Kochfeld – so bleibt genug Arbeitsfläche zwischen Kochfeld und Spüle.');
    if (b.budget) notes.push(b.budget < 10000 ? `Für rund ${eur(b.budget)} € ist alles bewusst schlicht geplant${cnt('eb') && !W.corner ? ' (Blindecke statt Le-Mans-Auszug)' : ''} – Geräte und Fronten stimmt ${person()} mit Ihnen auf das Budget ab.` : `Ihr Budget von rund ${eur(b.budget)} € geht mit Ihrer Anfrage mit – die genaue Kalkulation macht ${person()} mit Ihnen.`);
    return { plan, notes: notes.filter(Boolean), ctx, sinkWall, ww, opt };
  }
  // Spüle (samt Spülmaschine daneben) an eine Stelle rücken – nur übernehmen, wenn es nicht mehr Hinweise gibt als vorher
  const tipW = t => { if (/davor darf keine Haube/.test(t)) return 25; let m = /Nur (\d+) cm Platz zwischen Spüle/.exec(t); if (m) return +m[1] < 30 ? 9 : 4; if (/nicht an der Wand mit dem Wasser/.test(t)) return 14; m = /Spüle steht (\d+,\d) m neben dem Wasser/.exec(t); if (m) { const v = parseFloat(m[1].replace(',', '.')); return v <= 1.2 ? 4 : v <= 2 ? 7 : 10; } return 6; };
  const warnN = p => { try { return window.KP && KP.tipsOf ? (KP.tipsOf(p) || []).reduce((a, t) => a + tipW(t), 0) : 0; } catch (e) { return 0; } };
  // Kochfeld nie unter Fenster oder Tür: eine Wandhaube darf dort nicht hängen (gleiche Regel wie bei den Hängeschränken).
  // Muldenlüfter und Deckenlüfter sind frei davon.
  function underWin(p) {
    const st = p.s || {}; if (st.hobV === 'dd' || st.hood === 'decke') return false;
    return (p.op || []).some(o => spans(p, o[1]).some(s => { if (s.t !== 'kf' && s.t !== 'ko') return false; const hw = st.hood === 'flach' ? s.w : Math.min(90, Math.max(60, s.w)); return ov(s.x + s.w / 2 - hw / 2, hw, o[2], o[3]); }));
  }
  function cookFromWindow(plan) {
    if (!underWin(plan)) return false;
    const ws = FORMS[plan.f].walls, fw = ws.find(w => (plan.rw[w] || []).some(m => m[0] === 'kf' || m[0] === 'ko')); if (!fw) return false;
    const i0 = plan.rw[fw].findIndex(m => m[0] === 'kf' || m[0] === 'ko'), g = plan.rw[fw][i0], x0 = (spans(plan, fw).find(s => s.t === g[0]) || { x: 0 }).x;
    let best = null;
    for (const tw of ws) {
      if (!plan.rw[tw]) continue; const n = plan.rw[tw].length - (tw === fw ? 1 : 0);
      for (let k = 0; k <= n; k++) {
        const p = JSON.parse(JSON.stringify(plan)); p.rw[fw].splice(i0, 1); const row = p.rw[tw];
        if ((k === 0 && row[0] && M[row[0][0]].c) || (k === row.length && row.length && M[row[row.length - 1][0]].c)) continue;
        row.splice(k, 0, g.slice());
        let bad = false;
        if (fw !== tw) for (const w of [fw, tw]) { const L = usableOf(w, { N: (p.rw.N || []).map(m => ({ t: m[0] })) }, p.f, p.r), r = fitRow(p.rw[w], L, true); if (!r) { bad = true; break; } p.rw[w] = r; }
        if (bad || !valid(p) || underWin(p)) continue;
        const nx = (spans(p, tw).find(s => s.t === g[0]) || { x: 0 }).x, sc = warnN(p) * 100 + (tw === fw ? Math.abs(nx - x0) : 300);
        if (!best || sc < best.sc) best = { sc, rw: p.rw };
      }
    }
    if (best) { plan.rw = best.rw; return true; } return false;
  }
  function sinkToWater(plan, tg) {
    const ws = FORMS[plan.f].walls; if (!plan.rw[tg.wall]) return false;
    const fw = ws.find(w => (plan.rw[w] || []).some(m => m[0] === 'sp')); if (!fw) return false;
    const dist = p => { const sp = spans(p, tg.wall).find(x => x.t === 'sp'); return sp ? Math.abs(sp.x + sp.w / 2 - tg.s) : 1e4; };
    let best = { rw: plan.rw, d: dist(plan), wn: warnN(plan) };
    const r0 = plan.rw[fw], i0 = r0.findIndex(m => m[0] === 'sp'); let grp = [i0];
    if (r0[i0 + 1] && r0[i0 + 1][0] === 'gs') grp = [i0, i0 + 1]; else if (r0[i0 - 1] && r0[i0 - 1][0] === 'gs') grp = [i0 - 1, i0];
    const g = grp.map(i => r0[i]), n = plan.rw[tg.wall].length - (fw === tg.wall ? grp.length : 0);
    for (let k = 0; k <= n; k++) for (const flip of grp.length > 1 ? [false, true] : [false]) {
      const p = JSON.parse(JSON.stringify(plan)); p.rw[fw] = p.rw[fw].filter((m, i) => !grp.includes(i)); const row = p.rw[tg.wall];
      if ((k === 0 && row[0] && M[row[0][0]].c) || (k === row.length && row.length && M[row[row.length - 1][0]].c)) continue;
      row.splice(k, 0, ...(flip ? g.slice().reverse() : g).map(m => m.slice()));
      let bad = false;
      if (fw !== tg.wall) for (const w of [fw, tg.wall]) { const L = usableOf(w, { N: (p.rw.N || []).map(m => ({ t: m[0] })) }, p.f, p.r), r = fitRow(p.rw[w], L, true); if (!r) { bad = true; break; } p.rw[w] = r; }
      if (bad || !valid(p)) continue;
      const d = dist(p); if (d >= best.d - 1) continue; const wn = warnN(p);
      if (wn <= best.wn) best = { rw: p.rw, d, wn };
    }
    if (best.rw !== plan.rw) { plan.rw = best.rw; return true; } return false;
  }
  function mmcm(n) { const s = String(n); const v = /^\d{1,2}\.\d{3}$/.test(s) ? +s.replace('.', '') : parseFloat(s.replace(',', '.')); return Math.round(v / 10); }
  const eur = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const person = () => { const p = (window.KP && KP.person) || ''; return p && p !== 'Wir' ? p : 'das Studio'; };
  // Mehrere sinnvolle Varianten durchrechnen und die mit den wenigsten Kompromissen nehmen – gemessen mit den Live-Tipps des Planers
  function score(res, b) {
    let s = 0; const W = b.W, o = res.opt || {}, p = res.plan;
    let warns = []; try { if (window.KP && KP.tipsOf) warns = KP.tipsOf(p) || []; } catch (e) { warns = []; }
    warns.forEach(t => { s += tipW(t); });
    s += res.notes.filter(n => !/^Bei dieser Wandlänge sitzt der Backofen/.test(n)).length * 5;
    if (o.noDw) s += 3;
    if (o.herd) s += 3;
    if ((o.altSink || o.wsink) && !b.water && (b.win.wall || /spüle\s+(unter|am|vor)\s+(dem\s+)?fenster/.test(b.raw || ''))) s += 3;
    if (!b.win.none && !p.op.some(x => x[0] === 'fenster')) s += 3;
    return s;
  }
  function generateBest(b, cur) {
    const W = b.W, V = [{}];
    if (b.form === 'l' || b.form === 'zwei') V.push({ altSink: 1 });
    if (b.water && FORMS[b.form].walls.includes(b.water.wall) && (b.form === 'l' || b.form === 'zwei')) V.push({ wsink: b.water.wall });
    if (!W.herd && !W.ovenHigh && !(b.form === 'insel' && b.isl.v === 'kochfeld')) V.slice().forEach(v => V.push(Object.assign({}, v, { herd: 1 })));
    if (!W.noDw) V.slice().forEach(v => V.push(Object.assign({}, v, { noDw: 1 })));
    let best = null, bs = Infinity;
    for (const o of V) {
      let r = null; try { r = generate(JSON.parse(JSON.stringify(b)), cur, o); } catch (e) { r = null; }
      if (!r || !valid(r.plan)) continue;
      const sc = score(r, b); if (sc < bs) { best = r; bs = sc; }
    }
    return best;
  }
  // Zweite Idee (17.10.): deutlich andere Anordnung zum Vergleichen – was der Kunde gesagt hat, bleibt in beiden gleich
  function sig(p) { const ws = FORMS[p.f].walls, has = (w, ts) => (p.rw[w] || []).some(m => ts.includes(m[0])); const sw = ws.find(w => has(w, ['sp'])) || (p.f === 'insel' && p.is.v === 'spuele' ? 'I' : '-'), cw = ws.find(w => has(w, ['kf', 'ko'])) || (p.f === 'insel' && p.is.v === 'kochfeld' ? 'I' : '-'); return [p.f, sw, cw, ws.map(w => (p.rw[w] || []).map(m => m[0]).join(',')).join('/')].join('|'); }
  function mirror(p0) {
    const p = JSON.parse(JSON.stringify(p0));
    const flip = r => { if (!r || r.length < 2) return r; const c0 = M[r[0][0]] && M[r[0][0]].c ? 1 : 0, c1 = r.length > 1 && M[r[r.length - 1][0]] && M[r[r.length - 1][0]].c ? 1 : 0; return [...r.slice(0, c0), ...r.slice(c0, r.length - c1).reverse(), ...r.slice(r.length - c1)]; };
    p.rw.N = flip(p.rw.N); if (p.f === 'zwei') p.rw.S = flip(p.rw.S);
    return p;
  }
  function ideaB(b, cur, A, formFixed) {
    if (!A || !A.plan) return null;
    const sa = sig(A.plan), R = b.room, cands = [];
    const roomy = f => f !== 'insel' || (R.w >= 420 && R.d >= 400);   // Insel nur mit Platz zum Herumgehen
    // andere Form zuerst (sieht man sofort), in dieser Reihenfolge bevorzugt; gleiche Form nur, wenn keine andere passt
    if (!formFixed) ({ zeile: ['l', 'zwei', 'insel'], l: ['insel', 'u', 'zwei', 'zeile'], u: ['insel', 'l'], zwei: ['l', 'u'], insel: ['u', 'l'] }[A.plan.f] || []).filter(roomy).forEach((f, k) => {
      const b2 = JSON.parse(JSON.stringify(b)); b2.form = f; b2.isl = Object.assign({ v: 'kochfeld' }, b2.isl || {}, { want: f === 'insel' }); b2.notes = (b2.notes || []).slice();
      let r = null; try { r = generateBest(b2, cur); } catch (e) { r = null; } if (r && valid(r.plan)) cands.push({ r, b: b2, pen: -3 + k * .5 });
    });
    [{ altSink: 1 }, { herd: 1 }].forEach(o => { let r = null; try { r = generate(JSON.parse(JSON.stringify(b)), cur, o); } catch (e) { r = null; } if (r && valid(r.plan)) cands.push({ r, b, pen: 2 }); });
    { const m = mirror(A.plan); if (m && valid(m)) cands.push({ r: { plan: m, notes: (A.notes || []).slice(), opt: {} }, b, pen: 1.5 }); }
    let best = null, bs = Infinity;
    cands.forEach(c => { if (sig(c.r.plan) === sa) return; let sc = 99; try { sc = score(c.r, c.b) + c.pen; } catch (e) { sc = 99; } if (sc < bs) { bs = sc; best = c; } });
    let sA = 0; try { sA = score(A, b); } catch (e) { sA = 0; }
    if (!best || bs > sA + 8) return null;
    return { plan: best.r.plan, why: whyOf(best.r, best.b), notes: best.r.notes || [], got: b.got, brief: best.b, src: 'local' };
  }
  // Positionen entlang einer Wand
  function rangeStart(plan, w) { const N = plan.rw.N || []; if (w === 'E' && N.length) return 60 + (N[N.length - 1][0] === 'ek' && FORMS[plan.f].walls.includes('E') ? 30 : 0); return 0; }
  function spans(plan, w) { const out = []; let x = rangeStart(plan, w); (plan.rw[w] || []).forEach(m => { out.push({ t: m[0], x, w: m[1] }); x += m[1]; }); return out; }
  const wlen = (plan, w) => (w === 'N' || w === 'S') ? plan.r.w : plan.r.d;
  const ov = (a, aw, b, bw, pad = 2) => a + aw > b + pad && a < b + bw - pad;
  function blocked(plan, w, kind) {
    // belegte Bereiche einer Wand: Fenster → nur Hochschränke stören; Türen → jede Küchenzeile, auch die Tiefe der Nachbarwände
    const L = wlen(plan, w), out = [], rw = plan.rw, ws = FORMS[plan.f].walls;
    spans(plan, w).forEach(s => { if (kind !== 'fenster' || isTall(s.t) || s.t === 'kf' || s.t === 'ko') out.push([s.x, s.w]); });
    if (kind !== 'fenster' || !rw[w]) {
      // Ecken: Nachbarzeilen ragen 60 cm in die Wand
      if (w === 'W') { if (rw.N) out.push([L - 60, 60]); if (rw.S) out.push([0, 60]); }
      if (w === 'E') { if (rw.N) out.push([0, 60]); if (rw.S) out.push([L - 60, 60]); }
      if (w === 'S') { if (rw.E) out.push([0, 60]); if (rw.W) out.push([L - 60, 60]); }
      if (w === 'N') { if (rw.W) out.push([0, 60]); if (rw.E) out.push([L - 60, 60]); }
    }
    plan.op.filter(o => o[1] === w).forEach(o => out.push([o[2] - 15, o[3] + 30]));
    return out;
  }
  function fitOp(plan, w, kind, width, want) {
    const L = wlen(plan, w), mg = kind === 'fenster' ? 10 : 5, bl = blocked(plan, w, kind);
    const sizes = OPW[kind].filter(v => v <= width).reverse(); if (!sizes.length) sizes.push(OPW[kind][0]);
    for (const ow of sizes) {
      if (ow > L - 2 * mg) continue;
      const cand = new Set([want - ow / 2]); bl.forEach(([a, bw]) => { cand.add(a + bw); cand.add(a - ow); }); cand.add(mg); cand.add(L - ow - mg);
      const ok = [...cand].map(s => Math.round(clamp(s, mg, L - ow - mg) / 5) * 5).filter(s => !bl.some(([a, bw]) => ov(s, ow, a, bw))).sort((p, q) => Math.abs(p + ow / 2 - want) - Math.abs(q + ow / 2 - want));
      if (ok.length) return [kind, w, ok[0], ow];
      if (kind === 'fenster' && ow <= 60) break;
    }
    return null;
  }
  // Heizkörper (unters Fenster, Breite ≈ 80 % des Fensters) und Abluft-Durchbruch aus dem Text
  function extraCx(plan, b) {
    const out = [], WK = ['N', 'E', 'S', 'W'];
    if (b.heat) {
      let w = WK.includes(b.heat.wall) ? b.heat.wall : null, s0 = null, hw = 100;
      if (!w || b.heat.win) { const o = (plan.op || []).find(o => o[0] === 'fenster' && (!w || o[1] === w)); if (o) { w = o[1]; s0 = o[2] + o[3] / 2; hw = Math.max(40, Math.round(o[3] * .8 / 10) * 10); } }
      if (w) out.push(['heiz', w, Math.round(s0 != null ? s0 : wlen(plan, w) / 2), { hw }]);
    }
    if (b.vent && WK.includes(b.vent.wall)) out.push(['abluft', b.vent.wall, Math.round(wlen(plan, b.vent.wall) / 2), b.vent.d && b.vent.d !== 150 ? { d: b.vent.d } : undefined].filter(x => x !== undefined));
    return out;
  }
  function placeOps(plan, b, ww, sinkWall) {
    const walls = FORMS[plan.f].walls, free = ['S', 'E', 'W', 'N'].filter(w => !walls.includes(w));
    // Fenster
    if (!b.win.none) {
      let w = ww || sinkWall, want;
      if (plan.rw[w]) { const sp = spans(plan, w).find(s => s.t === 'sp'); want = sp ? sp.x + sp.w / 2 : wlen(plan, w) / 2; }
      else want = wlen(plan, w) / 2;
      const o = fitOp(plan, w, 'fenster', b.win.w || 120, want) || (plan.rw[w] ? null : fitOp(plan, w, 'fenster', 100, want));
      if (o) plan.op.push(o);
    }
    // Tür
    const pref = { zeile: ['S', 'E', 'W'], insel: ['S', 'E', 'W'], l: ['E', 'S'], u: ['S'], zwei: ['W', 'E'] }[plan.f];
    let dw = b.door.wall && !walls.includes(b.door.wall) ? b.door.wall : null;
    const order = (dw ? [dw] : []).concat(pref, free).filter((x, i, a) => a.indexOf(x) === i && !walls.includes(x));
    for (const w of order) { const o = fitOp(plan, w, 'tuer', b.door.w || 90, wlen(plan, w) / 2); if (o) { plan.op.push(o); break; } }
    if (b.balkon) {
      const bo = order.filter(w => !plan.op.some(o => o[1] === w)).concat(order);
      for (const w of bo) { const o = fitOp(plan, w, 'balkon', 120, wlen(plan, w) * (plan.op.some(q => q[1] === w) ? 0.75 : 0.5)); if (o) { plan.op.push(o); break; } }
    }
  }
  function buildStyle(b, cur) {
    // Neue Frontfarbe genannt → frischer, stimmiger Grundstil (Griffe/Platte/Rahmen nicht vom alten Entwurf erben); sonst aktuellen Stil behalten
    const st = b.style, fresh = st.front != null || st.wood != null;
    const base = b.look ? Object.assign({}, LOOKS[b.look], { look: b.look }) : fresh ? Object.assign({}, DEF_STYLE, cur.style || {}, { front: '#f1eee8', wood: null, handle: 'grifflos', top: 'eiche', finish: 'matt', frame: 0, look: null }) : Object.assign({}, DEF_STYLE, cur.style || {});
    const s = Object.assign({}, base);
    if (st.front) { s.front = st.front; s.wood = null; }
    if (st.wood) { s.wood = st.wood; }
    ['handle', 'top', 'finish', 'floor', 'wall', 'back', 'sink', 'tap', 'hood', 'ihood'].forEach(k => { if (st[k] != null) s[k] = st[k]; });
    const extra = {}; if (cur.style) for (const k in cur.style) if (!(k in DEF_STYLE) && !['look', 'frame', 'back', 'hobV', 'world'].includes(k) && /^(string|number)$/.test(typeof cur.style[k]) && String(cur.style[k]).length < 24) extra[k] = cur.style[k];
    if (st.frame != null) s.frame = st.frame;
    if (b.look === 'landhaus' && !st.handle && s.front === '#232426') s.handle = 'gold';
    if (s.look && (st.front || st.wood || st.handle || st.top) && JSON.stringify(Object.assign({}, LOOKS[s.look], { look: s.look })) !== JSON.stringify(s)) { /* bleibt Ausgangsstil, Details angepasst */ }
    return Object.assign(extra, cleanStyle(s));
  }
  function cleanStyle(s0) {
    const s = Object.assign({}, DEF_STYLE, s0 || {}), out = {};
    out.front = /^#[0-9a-f]{6}$/i.test(s.front || '') ? String(s.front).toLowerCase() : '#f1eee8';
    out.wood = s.wood === 'eiche' || s.wood === 'nuss' ? s.wood : null;
    out.handle = HANDLES[s.handle] ? s.handle : 'grifflos';
    out.top = TOPS[s.top] ? s.top : 'eiche';
    out.finish = FINISH[s.finish] ? s.finish : 'matt';
    out.wall = WALLC.includes(s.wall) ? s.wall : '#f3efe9';
    out.floor = FLOORS.includes(s.floor) ? s.floor : 'eiche';
    if (s.frame != null) out.frame = s.frame ? 1 : 0;
    if (BACKS.includes(s.back)) out.back = s.back;
    if (LOOKS[s.look]) out.look = s.look;
    const EQ = { sink: ['edel', 'gschwarz', 'ganth', 'gweiss', 'kweiss'], tap: ['chrom', 'edel', 'schwarz', 'gold'], hood: ['schraeg', 'esse', 'flach', 'decke'], ihood: ['mulde', 'insel', 'decke'], hobV: ['normal', 'dd'] };
    for (const k in EQ) if (EQ[k].includes(s[k])) out[k] = s[k];
    return out;
  }

  /* ================= 3) Begründung (lokal) ================= */
  function whyOf(res, b) {
    const p = res.plan, f = p.f, S = [], all = [];
    for (const w in p.rw) spans(p, w).forEach(s => all.push(Object.assign({ wall: w }, s)));
    const sp = all.find(s => s.t === 'sp'), cook = all.find(s => s.t === 'kf' || s.t === 'ko'), win = p.op.find(o => o[0] === 'fenster');
    S.push(`Für Ihren Raum mit ${mtr(p.r.w)} × ${mtr(p.r.d)} m habe ich eine ${FORMS[f].n} geplant${b.formSaid ? '' : f === 'l' ? ' – über Eck entsteht die meiste Arbeitsfläche' : ''}.`);
    if (sp) {
      const under = win && win[1] === sp.wall && ov(sp.x, sp.w, win[2], win[3], 0);
      S.push(`Die Spüle sitzt ${under ? 'direkt unter dem Fenster' : WAN[sp.wall]}${all.some(s => s.t === 'gs') ? ', die Spülmaschine gleich daneben – kurze Wege beim Abräumen' : ''}.`);
    } else if (f === 'insel' && p.is.v === 'spuele') S.push('Gespült wird auf der Insel, mit Blick in den Raum – die Wand bleibt fürs Kochen frei.');
    if (f === 'insel' && p.is.v === 'kochfeld') S.push(`Gekocht wird auf der ${p.is.w} cm breiten Kochinsel – Sie stehen dabei mit dem Gesicht zum Raum statt zur Wand.`);
    else if (cook && sp && cook.wall === sp.wall) {
      const lo = Math.min(cook.x + cook.w, sp.x + sp.w), hi = Math.max(cook.x, sp.x); const gap = Math.max(0, hi - lo);
      S.push(`Zwischen ${cook.t === 'ko' ? 'Herd' : 'Kochfeld'} und Spüle bleiben ${gap} cm Arbeitsfläche zum Schnippeln${all.some(s => s.t === 'ap') ? ', direkt am Kochfeld ein schmaler Apotheker für Gewürze und Öle' : ''}.`);
    } else if (cook && f === 'insel') S.push(`${cook.t === 'ko' ? 'Der Herd' : 'Das Kochfeld'} sitzt an der Rückwand, die Spüle auf der Insel direkt dahinter – eine Drehung, und Sie sind am Becken.`);
    else if (cook) S.push(`${cook.t === 'ko' ? 'Der Herd' : 'Das Kochfeld'} liegt ${f === 'zwei' ? 'gegenüber der Spüle – ein Schritt zurück, und Sie sind am Spülbecken' : 'über Eck zur Spüle – das klassische Arbeitsdreieck mit kurzen Wegen'}${all.some(s => s.t === 'ap') ? ', daneben ein schmaler Apotheker für Gewürze' : ''}.`);
    const tl = all.filter(s => isTall(s.t)).map(s => NM[s.t]);
    const uniq = tl.filter((x, i) => tl.indexOf(x) === i).map(x => x === 'Kühlschrank' && tl.filter(y => y === x).length > 1 ? 'Kühl- und Gefrierschrank' : x);
    if (uniq.length) S.push(`${list(uniq)} ${uniq.length > 1 ? 'stehen als Hochschrank-Block' : 'steht als Hochschrank'} am Wandende – so bleibt die Arbeitsfläche durchgehend frei${b.W.ovenHigh && tl.includes('Backofen') ? ', und der Backofen ist rückenschonend auf Augenhöhe' : ''}.`);
    const s = p.s, fr = fnm(s);
    S.push(`Fronten in ${fr} ${FINISH[s.finish]}${s.frame ? ' mit Rahmen im Landhausstil' : ''}, ${HANDLES[s.handle]}, Arbeitsplatte ${TOPS[s.top]}${b.W.mulde ? (s.hobV === 'dd' ? ' – der Muldenlüfter saugt direkt am Kochfeld ab, darum hängt keine Haube darüber' : f === 'insel' ? ' – der Muldenlüfter sitzt direkt im Kochfeld der Insel' : '') : ''}.`);
    return S.slice(0, 5).join(' ');
  }
  // Frontname: Planer-Ton oder beschreibende Wunschfarbe (Ziegelrot, Senfgelb …) – Namen liefert der Planer
  function fnm(s) { try { if (window.KP && KP.frontShort) return KP.frontShort(s); } catch (e) { } return s.wood ? (s.wood === 'nuss' ? 'Nussbaum' : 'Eiche') : (FRONTS.find(x => x[1] === s.front) || ['Wunschfarbe'])[0]; }
  const list = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1];

  /* ================= 4) Server-Antwort prüfen und reparieren ================= */
  function extractJSON(tx) { if (!tx) return null; if (typeof tx === 'object') return tx; const a = tx.indexOf('{'), z = tx.lastIndexOf('}'); if (a < 0 || z <= a) return null; try { return JSON.parse(tx.slice(a, z + 1)); } catch (e) { return null; } }
  function fitRow(row, L, keepEnds) {
    let r = row.map(m => m.slice()), sum = () => r.reduce((s, m) => s + m[1], 0), guard = 0;
    const fillIdx = () => { for (let i = r.length - 1; i >= 0; i--) if (FILL.includes(r[i][0])) return i; return -1; };
    while (sum() > L && guard++ < 60) {
      const over = sum() - L, i = fillIdx();
      if (i >= 0) { const x = r[i], fit = M[x[0]].ws.filter(v => v <= x[1] - over && v >= 30).pop(); if (fit) x[1] = fit; else r.splice(i, 1); continue; }
      const j = ['mt', 'vg', 'bs', 'vo', 'ah'].map(t => r.map(m => m[0]).lastIndexOf(t)).find(k => k >= 0);
      if (j != null && j >= 0) { r.splice(j, 1); continue; }
      const k = r.findIndex(m => (m[0] === 'sp' || m[0] === 'kf') && m[1] > 60) ; if (k >= 0) { r[k][1] = 60; continue; }
      const g = r.findIndex(m => m[0] === 'gs' && m[1] > 45); if (g >= 0) { r[g][1] = 45; continue; }
      const ex = r.findIndex(m => M[m[0]].c && m[1] > M[m[0]].ws[0]); if (ex >= 0) { r[ex][1] = M[r[ex][0]].ws[0]; continue; }
      const tt = r.map(m => m[0]).lastIndexOf('bo'); if (tt >= 0) { r.splice(tt, 1); continue; }
      return null;
    }
    let diff = L - sum();
    if (diff > 0) {
      // Füllstücke einsetzen – nicht hinter Hochschränke/Ecke am Wandende, sondern davor
      let pos = r.length; if (keepEnds) while (pos > 0 && (isTall(r[pos - 1][0]) || M[r[pos - 1][0]].c)) pos--;
      if (pos === 0) pos = r.length;
      const grow = r.findIndex(m => FILL.includes(m[0]) && M[m[0]].ws.includes(m[1] + diff));
      if (diff < 30 && grow >= 0) r[grow][1] += diff;
      else {
        let parts = decompose(diff) || null;
        if (!parts) { const sh = r.findIndex(m => m[0] === 'us' && m[1] >= 60); if (sh >= 0) { const nw = M.us.ws.filter(v => v < r[sh][1] && decompose(diff + r[sh][1] - v)).pop(); if (nw) { diff += r[sh][1] - nw; r[sh][1] = nw; parts = decompose(diff); } } }
        if (!parts) parts = decompose(diff, true);
        if (!parts) return null;
        r.splice(pos, 0, ...parts.map(p => [p < 30 ? 'fa' : 'us', p]));
      }
    }
    return sum() === L ? r : null;
  }
  function repair(raw, b, cur) {
    const o = extractJSON(raw); if (!o || typeof o !== 'object') return null;
    let f = FORMS[o.f] ? o.f : FORMS[o.form] ? o.form : b.form;
    const r0 = o.r || o.room || {}, room = { w: clamp(r10(+r0.w || b.room.w), 240, 800), d: clamp(r10(+r0.d || b.room.d), 240, 700) };
    if (f === 'insel' && room.d < 380) f = 'zeile';
    const rw0 = o.rw || o.rows || {}, walls = FORMS[f].walls, plan = { f, r: room, rw: {}, tp: {}, op: [], is: { w: 180, v: 'kochfeld' }, s: null, ah: 90 };
    const norm = it => { if (!Array.isArray(it)) it = it && typeof it === 'object' ? [it.t || it.typ, it.w || it.breite] : []; const t = String(it[0] || '').toLowerCase(), w = +it[1]; if (!M[t] || M[t].h === 'u') return null; const q = it[2] && typeof it[2] === 'object' ? it[2] : null; const m = [t, snap(M[t].ws, w || M[t].ws[0])]; if (q && q.a && (q.a === 'l' || q.a === 'r')) m.push({ a: q.a }); return m; };
    for (const w of walls) {
      let row = (Array.isArray(rw0[w]) ? rw0[w] : []).map(norm).filter(Boolean);
      row = row.map((m, i) => { if (!M[m[0]].c) return m; const okL = w === 'N' && i === 0 && walls.includes('W'), okR = w === 'N' && i === row.length - 1 && walls.includes('E'); return okL || okR ? m : ['us', snap(M.us.ws, m[1])]; });
      if (w === 'N' && walls.includes('W') && !(row[0] && M[row[0][0]].c)) row.unshift(['eb', 90]);
      if (w === 'N' && walls.includes('E') && !(row.length > 1 && M[row[row.length - 1][0]].c)) row.push(['eb', 90]);
      plan.rw[w] = row;
    }
    // Pflicht: Spüle, Kochstelle, Kühlschrank
    const isl0 = o.is || o.island || {}; plan.is = { w: snap(ISW, +isl0.w || 180), v: ['kochfeld', 'spuele', 'frei'].includes(isl0.v) ? isl0.v : 'kochfeld' };
    const all = [].concat(...walls.map(w => plan.rw[w].map(m => m[0])));
    const isl = f === 'insel';
    if (!(all.includes('sp') || (isl && plan.is.v === 'spuele'))) return null;
    if (!(all.includes('kf') || all.includes('ko') || (isl && plan.is.v === 'kochfeld'))) return null;
    if (!all.includes('kue')) return null;
    for (const w of walls) { const L = usableOf(w, { N: (plan.rw.N || []).map(m => ({ t: m[0] })) }, f, room), r = fitRow(plan.rw[w], L, true); if (!r) return null; plan.rw[w] = r; }
    const tp = o.tp || {}; walls.forEach(w => plan.tp[w] = tp[w] != null ? (tp[w] ? 1 : 0) : (w === 'N' || f === 'zwei' ? 1 : 0));
    // Öffnungen
    (Array.isArray(o.op) ? o.op : []).forEach(x => {
      if (!Array.isArray(x)) return; const t = x[0], w = x[1]; if (!OPW[t] || !['N', 'E', 'S', 'W'].includes(w)) return;
      const ow = snap(OPW[t], +x[3] || OPW[t][2]), L = wlen(plan, w), mg = t === 'fenster' ? 10 : 5; if (ow > L - 2 * mg) return;
      const s = Math.round(clamp(+x[2] || 0, mg, L - ow - mg) / 5) * 5;
      const bl = blocked(plan, w, t === 'fenster' ? 'fenster' : 'tuer');
      if (bl.some(([a, bw]) => ov(s, ow, a, bw))) { const alt = fitOp(plan, w, t === 'balkon' ? 'balkon' : t, ow, s + ow / 2); if (alt && (t === 'fenster' || !walls.includes(w))) plan.op.push(alt); return; }
      plan.op.push([t, w, s, ow]);
    });
    if (!plan.op.some(x => x[0] === 'tuer' || x[0] === 'balkon')) placeOps(plan, Object.assign({}, b, { win: { none: true }, balkon: false }), null, 'N');
    plan.s = cleanStyle(Object.assign({}, o.s || o.style || {}));
    // Stilwünsche aus dem Text haben Vorrang, falls die KI sie übersehen hat
    const loc = buildStyle(b, cur); ['front', 'wood', 'handle', 'top', 'finish', 'frame', 'back', 'floor', 'wall', 'sink', 'tap', 'hood', 'ihood'].forEach(k => { if (b.style[k] != null) plan.s[k] = loc[k]; });
    if (b.W.mulde && Object.values(plan.rw).some(r => r.some(m => m[0] === 'kf' || m[0] === 'ko'))) plan.s.hobV = 'dd';
    if (b.style.front) plan.s.wood = null;
    plan.ah = clamp(Math.round(+o.ah || b.ah || cur.ah || 90), 84, 106);
    const why = typeof o.why === 'string' ? o.why.replace(/\s+/g, ' ').trim().slice(0, 900) : '';
    return { plan, why };
  }
  function valid(plan) {
    try { if (window.KP && KP.stateOf) { const r = KP.stateOf(plan); if (!r || !r.state || !r.state.items || !r.state.items.length) return false; } } catch (e) { return false; }
    const N = plan.rw.N || [], ws = FORMS[plan.f].walls;
    if (ws.includes('W') && !(N[0] && M[N[0][0]].c)) return false;
    if (ws.includes('E') && !(N.length > 1 && M[N[N.length - 1][0]].c)) return false;
    for (const w in plan.rw) { const L = usableOf(w, { N: (plan.rw.N || []).map(m => ({ t: m[0] })) }, plan.f, plan.r), s = plan.rw[w].reduce((a, m) => a + m[1], 0); if (s !== L) return false; }
    return true;
  }
  function localPlan(text, cur) {
    const b = parse(text, cur);
    let res = generateBest(b, cur);
    if (!res) { b.form = 'l'; b.room = { w: Math.max(b.room.w, 300), d: Math.max(b.room.d, 300) }; res = generateBest(b, cur); }
    if (!res) return null;
    return { plan: res.plan, why: whyOf(res, b), notes: res.notes, got: b.got, brief: b, src: 'local' };
  }
  async function askServer(text, cur) {
    const el = document.querySelector('[data-kp]'), hook = String((window.KPAI_HOOK != null ? window.KPAI_HOOK : (el && el.dataset.kpaiHook)) || HOOK || '').trim();
    if (!/^https:\/\/[^\s"'<>]+$/i.test(hook)) return null;
    if (srvCount >= MAXREQ) return null; let sc = 0; try { sc = +sessionStorage.getItem('kpai-n') || 0; } catch (e) { }
    if (sc >= MAXSESS) return null; srvCount++; try { sessionStorage.setItem('kpai-n', sc + 1); } catch (e) { }
    const ctl = typeof AbortController === 'function' ? new AbortController() : null, tm = setTimeout(() => ctl && ctl.abort(), TIMEOUT);
    try {
      const body = new URLSearchParams({ text: text.slice(0, MAXLEN), form: cur.form, studio: (window.KP && KP.studio) || 'Küchenstudio', room: cur.room.w + 'x' + cur.room.d });
      const r = await fetch(hook, { method: 'POST', body, signal: ctl ? ctl.signal : undefined, credentials: 'omit', cache: 'no-store' });
      if (!r.ok) return null; return await r.text();
    } catch (e) { return null; } finally { clearTimeout(tm); }
  }
  function localPlanB(b, cur) {
    let res = generateBest(b, cur);
    if (!res && b.form !== 'l') { const b2 = JSON.parse(JSON.stringify(b)); b2.form = 'l'; b2.notes.push('Mit dieser Form passte nicht alles hinein – darum über Eck geplant.'); res = generateBest(b2, cur); }
    if (!res) return null;
    return { plan: res.plan, why: whyOf(res, b), notes: res.notes, got: b.got, brief: b, src: 'local' };
  }
  async function planB(b, text, cur) {
    const loc = localPlanB(b, cur);
    const items = (b.fixOps || []).map(o => `${o[0]} ${o[1]} ab ${o[2]} cm, ${o[3]} cm breit`).join('; ');
    const raw = await askServer(`${text}\n[Vom Kunden bestätigt: Raum ${b.room.w} × ${b.room.d} cm, Form ${b.form}${items ? ', Öffnungen: ' + items : ''}${b.water ? `, Wasser ${b.water.wall} bei ${b.water.s} cm` : ''}]`, Object.assign({}, cur, { room: b.room, form: b.form }));
    if (raw) {
      const rp = repair(raw, b, cur);
      if (rp && valid(rp.plan)) {
        if ((b.fixOps || []).length) rp.plan.op = b.fixOps.map(o => o.slice());
        if (b.water) rp.plan.cx = [['wasser', b.water.wall, b.water.s]];
        { const xc = extraCx(rp.plan, b); if (xc.length) rp.plan.cx = (rp.plan.cx || []).filter(c => c[0] === 'wasser' || c[0] === 'herd').concat(xc); }
        if (valid(rp.plan)) return { plan: rp.plan, why: rp.why || (loc ? loc.why : ''), notes: [], got: b.got, src: 'server' };
      }
    }
    return loc;
  }
  let srvCount = 0;
  async function plan(text, cur) {
    const loc = localPlan(text, cur);
    const raw = await askServer(text, cur);
    if (raw) {
      const rp = repair(raw, loc ? loc.brief : parse(text, cur), cur);
      if (rp && valid(rp.plan)) return { plan: rp.plan, why: rp.why || (loc ? loc.why : ''), notes: loc && loc.brief.islDropped && rp.plan.f !== 'insel' ? loc.notes : [], got: loc ? loc.got : [], src: 'server' };
    }
    return loc;
  }

  /* ================= 5) Grundriss-Skizze ================= */
  function planSvg(p) {
    const W = p.r.w, D = p.r.d, pad = 34, out = [];
    const fit = (lab, w) => lab.length * 8.8 > w - 6 ? ` textLength="${Math.max(10, w - 8)}" lengthAdjust="spacingAndGlyphs"` : '';
    const rect = (x, y, w, h, cls, i, lab) => out.push(`<g class="kpai-m ${cls}" style="--i:${i}"><rect x="${x + .8}" y="${y + .8}" width="${Math.max(1, w - 1.6)}" height="${Math.max(1, h - 1.6)}" rx="3"/>${lab ? `<text x="${x + w / 2}" y="${y + h / 2}" dy=".35em"${fit(lab, Math.min(w, h > w ? 60 : w))}>${lab}</text>` : ''}</g>`);
    const LB = { sp: 'Spüle', kf: 'Kochfeld', ko: 'Herd', gs: 'SM', kue: 'Kühl', bo: 'Ofen', bm: 'Ofen', vo: 'Vorrat', ah: 'Apo', bs: 'Besen', vg: 'Vitr.', mt: 'Müll', ek: '', el: '', eb: '' };
    const cls = t => isTall(t) ? 'tall' : (t === 'sp' || t === 'kf' || t === 'ko' || t === 'gs') ? 'dev' : M[t].c ? 'cor' : 'base';
    let i = 0;
    for (const w in p.rw) spans(p, w).forEach(s => {
      const lab = s.w >= 50 ? (LB[s.t] != null ? LB[s.t] : '') : '';
      if (w === 'N') rect(s.x, 0, s.w, 60, cls(s.t), i++, lab);
      if (w === 'S') rect(W - s.x - s.w, D - 60, s.w, 60, cls(s.t), i++, lab);
      if (w === 'W') rect(0, D - s.x - s.w, 60, s.w, cls(s.t), i++, s.w >= 60 ? lab : '');
      if (w === 'E') rect(W - 60, s.x, 60, s.w, cls(s.t), i++, s.w >= 60 ? lab : '');
    });
    if (p.f === 'insel') { const zc = Math.max(210, Math.min(D - 120, 225)); rect(W / 2 - p.is.w / 2, zc - 50, p.is.w, 100, 'isl', i++, p.is.v === 'kochfeld' ? 'Insel · Kochfeld' : p.is.v === 'spuele' ? 'Insel · Spüle' : 'Insel'); }
    const ops = p.op.map(o => {
      const [t, w, s, ow] = o; let x1, y1, x2, y2;
      if (w === 'N') { x1 = s; y1 = 0; x2 = s + ow; y2 = 0; } if (w === 'S') { x1 = W - s; y1 = D; x2 = W - s - ow; y2 = D; }
      if (w === 'W') { x1 = 0; y1 = D - s; x2 = 0; y2 = D - s - ow; } if (w === 'E') { x1 = W; y1 = s; x2 = W; y2 = s + ow; }
      return `<line class="kpai-op ${t}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('');
    const cxs = (p.cx || []).map(([t, w, s0]) => { const [x, y] = { N: [s0, 22], S: [W - s0, D - 22], W: [22, D - s0], E: [W - 22, s0] }[w] || [0, 0]; return `<circle class="kpai-cx" cx="${x}" cy="${y}" r="13"/>`; }).join('');
    const dim = `<g class="kpai-dim"><text x="${W / 2}" y="${-14}">${mtr(W)} m</text><text x="${-14}" y="${D / 2}" transform="rotate(-90 ${-14} ${D / 2})">${mtr(D)} m</text></g>`;
    return `<svg class="kpai-plan" viewBox="${-pad} ${-pad} ${W + 2 * pad} ${D + 2 * pad}" role="img" aria-label="Grundriss des Entwurfs"><rect class="kpai-floor" x="0" y="0" width="${W}" height="${D}"/>${out.join('')}<rect class="kpai-wall" x="0" y="0" width="${W}" height="${D}"/>${ops}${cxs}${dim}</svg>`;
  }

  /* ================= 6) Oberfläche ================= */
  const ICO = {
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" opacity=".7"/></svg>',
    mic: '<svg class="i-mic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    stop: '<svg class="i-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.6"/></svg>',
  };
  // Tastatur mit pulsierender Mikrofon-Taste (Hinweis, wenn der Browser selbst nicht zuhören kann)
  const KBSVG = '<svg viewBox="0 0 72 48" aria-hidden="true"><rect class="kb" x="1.5" y="1.5" width="69" height="45" rx="8"/><g class="ky"><rect x="7" y="9" width="7" height="7" rx="1.6"/><rect x="16" y="9" width="7" height="7" rx="1.6"/><rect x="25" y="9" width="7" height="7" rx="1.6"/><rect x="34" y="9" width="7" height="7" rx="1.6"/><rect x="43" y="9" width="7" height="7" rx="1.6"/><rect x="11" y="19" width="7" height="7" rx="1.6"/><rect x="20" y="19" width="7" height="7" rx="1.6"/><rect x="29" y="19" width="7" height="7" rx="1.6"/><rect x="38" y="19" width="7" height="7" rx="1.6"/><rect x="47" y="19" width="7" height="7" rx="1.6"/><rect x="7" y="29" width="7" height="7" rx="1.6"/><rect x="16" y="29" width="34" height="7" rx="1.6"/><rect x="52" y="29" width="7" height="7" rx="1.6"/></g><g class="mk"><circle class="mr" cx="60" cy="12.5" r="8.5"/><circle class="mb" cx="60" cy="12.5" r="6.2"/><rect x="58.2" y="8.6" width="3.6" height="5.6" rx="1.8" fill="#fff"/><path d="M56.6 12.6a3.4 3.4 0 006.8 0M60 16v1.6" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></g></svg>';
  const EXE = 'Fenster 30 cm nach links, Raum 3,20 × 4,00 m, Wasser an der linken Wand, Spüle unters Fenster';
  const CHIPS_E = ['Fenster 30 cm nach links', 'Fenster an die linke Wand', 'Raum 3,20 × 4,00 m', 'Wasser an der linken Wand', 'Spüle unters Fenster', 'Tür nach rechts', 'Fenster breiter', 'Arbeitshöhe 95 cm', 'Fronten in Salbei'];
  const EX = 'L-Küche, Raum 3,80 × 2,60 m, Fenster an der langen Wand, Spüle unter dem Fenster, großer Kühlschrank, Backofen auf Augenhöhe, viel Stauraum, Kochinsel wäre toll, grifflos in Sandgrau mit Eiche';
  const CHIPS_F = [['Küchenzeile', 'Küchenzeile'], ['L-Küche', 'L-Küche'], ['U-Küche', 'U-Küche'], ['Zweizeilig', 'zweizeilig'], ['Kochinsel', 'Kochinsel']];
  const CHIPS_W = [['Apothekerschrank', 'Apothekerschrank'], ['Backofen hoch', 'Backofen auf Augenhöhe'], ['Großer Kühlschrank', 'großer Kühlschrank'], ['Muldenlüfter', 'Muldenlüfter'], ['Viel Stauraum', 'viel Stauraum'], ['Mülltrenner', 'Mülltrenner'], ['Landhaus', 'Landhausstil'], ['Grifflos', 'grifflos'], ['Dunkel & elegant', 'dunkel und elegant'], ['Hell & Holz', 'weiß mit Eiche'], ['Ohne Hängeschränke', 'keine Hängeschränke']];
  const STAT = ['Raum wird vermessen …', 'Fenster und Türen werden eingezeichnet …', 'Spüle an das Fenster …', 'Arbeitsdreieck wird optimiert …', 'Hochschränke werden gebündelt …', 'Stauraum wird verteilt …', 'Farben und Griffe werden abgestimmt …', 'Letzter Feinschliff …'];
  const RMO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let ov_ = null, lastFocus = null, result = null, V = null;
  function build() {
    const el = document.createElement('div'); el.className = 'kpai'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kpai-t');
    el.innerHTML = `<div class="kpai-bg" data-kpai-x></div>
<div class="kpai-box" data-lenis-prevent>
  <button type="button" class="kpai-x" data-kpai-x aria-label="Schließen">×</button>
  <section class="kpai-s on" data-s="in">
    <div class="kpai-top"><p class="kpai-k">${ICO.spark}<span>KI-Planung</span></p><div class="kpai-mode" role="group" aria-label="Was möchten Sie tun?"><button type="button" data-mode="neu" class="on" aria-pressed="true">Neu planen</button><button type="button" data-mode="edit" aria-pressed="false">Entwurf ändern</button></div></div>
    <h2 class="kpai-h" id="kpai-t"><span class="kpai-mn">Erzählen Sie uns von Ihrer Küche.<em>Wir planen sie ein.</em></span><span class="kpai-me">Was soll sich ändern?<em>Einfach sagen – wir setzen es um.</em></span></h2>
    <p class="kpai-p"><span class="kpai-mn">Raum, Fenster, Wünsche, Farben – ganz in Ihren Worten. Zuerst prüfen wir mit Ihnen die Raummaße, dann steht ein durchdachter Entwurf im Planer, den Sie nur noch verfeinern.</span><span class="kpai-me">Fenster verschieben, Raummaße korrigieren, Wasseranschluss eintragen, Spüle unters Fenster … – Ihr Entwurf bleibt, nur das Gesagte ändert sich. Jede Änderung lässt sich rückgängig machen.</span></p>
    <div class="kpai-coach" hidden role="status" aria-live="polite"></div>
    <div class="kpai-ta"><textarea maxlength="${MAXLEN}" rows="5" placeholder="zum Beispiel ${esc(EX)}" aria-label="Ihre Küche in eigenen Worten"></textarea>
      <div class="kpai-tab"><button type="button" class="kpai-ex">Beispiel<span>einsetzen</span></button><span class="kpai-cnt">0 / ${MAXLEN}</span><span class="kpai-vst"></span><canvas class="kpai-wave" aria-hidden="true"></canvas><button type="button" class="kpai-mic" aria-pressed="false" aria-label="Einsprechen: Ihre Küche einfach erzählen"><span class="kpai-mh" aria-hidden="true"></span>${ICO.mic}${ICO.stop}<b>Einsprechen</b></button><span class="kpai-tip" aria-hidden="true">Neu: einfach erzählen statt tippen</span></div></div>
    <p class="kpai-vnote" hidden>Die Sprache wandelt Ihr Browser in Text um (je nach Browser bei Google, Apple oder Microsoft). Wir erhalten keine Aufnahme – nur den Text im Feld.</p>
    <div class="kpai-mn"><p class="kpai-l">Form</p><div class="kpai-chips" data-g="f">${CHIPS_F.map(([n, s]) => `<button type="button" data-ph="${esc(s)}">${n}</button>`).join('')}</div>
    <p class="kpai-l">Wünsche – einfach antippen</p><div class="kpai-chips">${CHIPS_W.map(([n, s]) => `<button type="button" data-ph="${esc(s)}">${n}</button>`).join('')}</div></div>
    <div class="kpai-me"><p class="kpai-l">Beispiele – antippen und anpassen</p><div class="kpai-chips">${CHIPS_E.map(s => `<button type="button" data-ph="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
    <div class="kpai-go"><button type="button" class="kpai-btn" data-kpai-run>${ICO.spark}<span class="kpai-mn">Weiter: Raum prüfen</span><span class="kpai-me">Änderung ausführen</span></button><p class="kpai-fine">Kostenlos und unverbindlich. Ihre Beschreibung wird nur für diesen Entwurf verwendet – bitte keine persönlichen Daten eingeben.</p></div>
    <p class="kpai-err" aria-live="polite"></p>
  </section>
  <section class="kpai-s" data-s="room">
    <p class="kpai-k">${ICO.spark}<span>Schritt 1 von 2 · Raum prüfen</span></p>
    <h2 class="kpai-h">Stimmt Ihr Raum so?<em>Erst die Maße, dann die Küche.</em></h2>
    <p class="kpai-p kpai-rq" data-rq></p>
    <div class="kpai-rg2">
      <div class="kpai-rbox"><div class="kpai-rsvg" data-rsvg></div><div class="kpai-rmenu" data-rmenu hidden></div><p class="kpai-rhelp">Wand antippen: Fenster, Tür oder Wasser genau dort einsetzen · Symbole anfassen und verschieben</p></div>
      <div class="kpai-rctl">
        <div class="kpai-dim"><span>Breite<small>Rückwand (oben)</small></span><div class="kpai-stp"><button type="button" data-rd="w-" aria-label="Breite 10 cm weniger">−</button><label><input data-rin="w" inputmode="decimal" aria-label="Breite in Metern"><i>m</i></label><button type="button" data-rd="w+" aria-label="Breite 10 cm mehr">+</button></div></div>
        <div class="kpai-dim"><span>Tiefe<small>Seitenwände</small></span><div class="kpai-stp"><button type="button" data-rd="d-" aria-label="Tiefe 10 cm weniger">−</button><label><input data-rin="d" inputmode="decimal" aria-label="Tiefe in Metern"><i>m</i></label><button type="button" data-rd="d+" aria-label="Tiefe 10 cm mehr">+</button></div></div>
        <button type="button" class="kpai-rrot" data-rrot>⟳ Raum drehen <small>Küche an eine andere Wand</small></button>
        <p class="kpai-l">Form</p><div class="kpai-chips sm" data-rform>${Object.keys(FN).map(k => `<button type="button" data-rf="${k}">${FN[k]}</button>`).join('')}</div>
        <ul class="kpai-ritems" data-ritems></ul>
        <ul class="kpai-rwarn" data-rwarn></ul>
      </div>
    </div>
    <div class="kpai-go row"><button type="button" class="kpai-btn" data-kpai-plan>${ICO.spark}<span>Passt – Küche planen</span></button><button type="button" class="kpai-ghost" data-kpai-back>Text ändern</button></div>
    <p class="kpai-fine">Nur zum Ausprobieren? Einfach „Passt“ tippen – alles lässt sich später im Planer ändern.</p>
  </section>
  <section class="kpai-s" data-s="done">
    <p class="kpai-k">${ICO.spark}<span>Erledigt</span></p>
    <h2 class="kpai-h">Ihr Entwurf ist angepasst.<em>Schauen Sie mal.</em></h2>
    <ul class="kpai-dl" data-dl></ul>
    <div class="kpai-go row"><button type="button" class="kpai-btn" data-kpai-x>${ICO.spark}<span>Ansehen</span></button><button type="button" class="kpai-ghost" data-kpai-more>Noch etwas ändern</button><button type="button" class="kpai-ghost" data-kpai-undo>Rückgängig</button></div>
    <p class="kpai-fine" data-dfine></p>
  </section>
  <section class="kpai-s" data-s="run" aria-live="polite">
    <div class="kpai-sk" aria-hidden="true"><svg viewBox="0 0 320 230"><defs><pattern id="kpai-g" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="currentColor" stroke-opacity=".09"/></pattern></defs>
      <rect x="20" y="20" width="280" height="190" fill="url(#kpai-g)"/>
      <path class="kpai-dr" pathLength="1" d="M20 20H300V210H20Z"/>
      <path class="kpai-dr d2" pathLength="1" d="M20 6H300M6 20V210"/>
      <g class="kpai-bl"><rect style="--i:0" x="22" y="22" width="34" height="34"/><rect style="--i:1" x="56" y="22" width="44" height="34"/><rect class="a" style="--i:2" x="100" y="22" width="48" height="34"/><rect style="--i:3" x="148" y="22" width="38" height="34"/><rect class="a" style="--i:4" x="186" y="22" width="50" height="34"/><rect class="a" style="--i:5" x="236" y="22" width="36" height="34"/><rect style="--i:6" x="272" y="22" width="26" height="34"/>
      <rect class="t" style="--i:7" x="22" y="170" width="34" height="38"/><rect class="t" style="--i:8" x="22" y="132" width="34" height="38"/><rect style="--i:9" x="22" y="56" width="34" height="76"/>
      <rect class="i" style="--i:10" x="120" y="110" width="110" height="52"/></g>
      <path class="kpai-win" d="M186 20H236"/><line class="kpai-scan" x1="20" y1="20" x2="20" y2="210"/></svg></div>
    <p class="kpai-st">Planung läuft …</p><div class="kpai-bar"><i></i></div>
  </section>
  <section class="kpai-s" data-s="res">
    <p class="kpai-k">${ICO.spark}<span>Ihr Entwurf ist fertig</span></p>
    <div class="kpai-ideas" data-kpai-ideas hidden></div>
    <div class="kpai-rg"><div class="kpai-pv"></div><div class="kpai-rt"><h3 class="kpai-h3"></h3><div class="kpai-got"></div><p class="kpai-why"></p><ul class="kpai-notes"></ul></div></div>
    <div class="kpai-go row"><button type="button" class="kpai-btn" data-kpai-apply>${ICO.spark}<span>Plan übernehmen</span></button><button type="button" class="kpai-ghost" data-kpai-back>Text ändern</button></div>
    <p class="kpai-fine">Im Planer passen Sie danach alles frei an – jeden Schrank, jede Breite, jede Farbe.</p>
  </section>
</div>`;
    document.body.appendChild(el);
    const ta = el.querySelector('textarea'), cnt = el.querySelector('.kpai-cnt');
    const sync = () => { cnt.textContent = `${ta.value.length} / ${MAXLEN}`; el.querySelectorAll('[data-ph]').forEach(b => b.classList.toggle('on', ta.value.toLowerCase().includes(b.dataset.ph.toLowerCase()))); };
    ta.addEventListener('input', sync);
    el.querySelector('.kpai-ex').addEventListener('click', () => { ta.value = EX; sync(); ta.focus(); });
    el.addEventListener('click', e => {
      if (e.target.closest('[data-kpai-x]')) return close();
      const ch = e.target.closest('[data-ph]');
      if (ch) {
        const ph = ch.dataset.ph, v = ta.value; const i = v.toLowerCase().indexOf(ph.toLowerCase());
        if (i >= 0) ta.value = (v.slice(0, i) + v.slice(i + ph.length)).replace(/\s*,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();
        else {
          let base = v.trim();
          if (ch.closest('[data-g="f"]')) CHIPS_F.forEach(([, s]) => { const k = base.toLowerCase().indexOf(s.toLowerCase()); if (k >= 0) base = (base.slice(0, k) + base.slice(k + s.length)).replace(/\s*,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim(); });
          ta.value = (base ? base.replace(/[,.\s]+$/, '') + ', ' : '') + ph;
        }
        ta.value = ta.value.slice(0, MAXLEN); sync(); return;
      }
      if (e.target.closest('[data-kpai-run]')) return run();
      if (e.target.closest('[data-kpai-back]')) { if (V) V.cancel(); return show('in'); }
      { const id = e.target.closest('[data-idea]'); if (id) return pickIdea(+id.dataset.idea); }
      if (e.target.closest('[data-kpai-apply]')) return apply();
      const md = e.target.closest('[data-mode]'); if (md) return setMode(md.dataset.mode, true);
      if (e.target.closest('[data-kpai-plan]')) return planConfirmed();
      if (e.target.closest('[data-kpai-more]')) { setMode('edit'); const ta2 = el.querySelector('textarea'); ta2.value = ''; ta2.dispatchEvent(new Event('input')); return show('in'); }
      if (e.target.closest('[data-kpai-undo]')) { undoEdits(); return; }
      const rd = e.target.closest('[data-rd]'); if (rd && rc) { const k = rd.dataset.rd[0], st = rd.dataset.rd[1] === '+' ? 10 : -10; setDim(k, rc[k] + st); return; }
      const rf = e.target.closest('[data-rf]'); if (rf && rc) { rc.form = rf.dataset.rf; rc.menu = null; renderRoom(); return; }
      if (e.target.closest('[data-rrot]') && rc) { rotateRoom(); return; }
      const rx = e.target.closest('[data-rx]'); if (rx && rc) { rc.items.splice(+rx.dataset.rx, 1); rc.menu = null; renderRoom(); return; }
      const ra = e.target.closest('[data-ra]'); if (ra && rc) { roomMenuAct(ra.dataset.ra); return; }
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && el.querySelector('[data-s="in"].on')) run();
      if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-rin]')) { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Tab') { const f = [...el.querySelectorAll('.kpai-s.on button, .kpai-s.on textarea, .kpai-s.on input, .kpai-x')].filter(x => x.offsetParent); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    el.querySelectorAll('[data-rin]').forEach(inp => inp.addEventListener('change', () => { if (!rc) return; let v = parseFloat(String(inp.value).replace(',', '.')); if (!isFinite(v)) return renderRoom(); if (v < 15) v *= 100; setDim(inp.dataset.rin, v); }));
    roomPointer(el.querySelector('[data-rsvg]'));
    // Spracheingabe (Mikrofon im Textfeld)
    V = voiceInit(el, ta, sync);
    return el;
  }
  /* ================= 6c) Spracheingabe ================= */
  // Chrome, Edge, Safari, Samsung: Spracherkennung des Browsers (Web Speech API), Text erscheint live im Feld.
  // Ohne eigene Erkennung (z. B. Firefox, In-App-Browser) oder wenn sie scheitert: Hinweis auf das Diktier-Mikrofon der Tastatur oder des Computers.
  const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
  const UA = navigator.userAgent || '', TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const OSN = /Android/i.test(UA) ? 'android' : (/iPhone|iPad|iPod/i.test(UA) || (/Macintosh/i.test(UA) && navigator.maxTouchPoints > 1)) ? 'ios' : /Windows/i.test(UA) ? 'win' : /Mac OS X|Macintosh/i.test(UA) ? 'mac' : 'other';
  const KBD = TOUCH || OSN === 'android' || OSN === 'ios';
  const REALWAVE = !KBD && /Chrome\/|Edg\//.test(UA) && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const VMAX = 120000, VQUIET = 7000;
  const srOK = () => { if (!SRC || /[?&]sr=0\b/.test(location.search)) return false; try { return sessionStorage.getItem('kpai-sr') !== 'x'; } catch (e) { return true; } };
  const srBad = () => { try { sessionStorage.setItem('kpai-sr', 'x'); } catch (e) { } };
  function voiceInit(el, ta, sync) {
    const box = el.querySelector('.kpai-ta'), mic = el.querySelector('.kpai-mic'), lab = mic.querySelector('b'), st = el.querySelector('.kpai-vst'), cv = el.querySelector('.kpai-wave'), coach = el.querySelector('.kpai-coach'), note = el.querySelector('.kpai-vnote'), err = el.querySelector('.kpai-err');
    const cx = cv.getContext && cv.getContext('2d');
    let rec = null, on = false, want = false, t0 = 0, last = 0, base = '', finals = [], off = 0, interim = '', heard = false, speaking = false, bump = 0, lvl = 0, raf = 0, tmr = 0, why = '', restarts = 0, after = null;
    let stream = null, actx = null, ana = null, abuf = null, col = '#b0703f', coachOn = false, coachLen = 0, okT = 0;
    const fmt = ms => { const q = Math.floor(ms / 1000); return Math.floor(q / 60) + ':' + String(q % 60).padStart(2, '0'); };
    // Android liefert gelegentlich den ganzen Satz noch einmal als neues Ergebnis – dann ersetzen statt anhängen
    const compose = () => {
      let out = '';
      const add = t => { t = String(t || '').replace(/\s+/g, ' ').trim(); if (!t) return; const a = out.toLowerCase(), b = t.toLowerCase(); if (!out) out = t; else if (b.startsWith(a)) out = t; else if (!a.endsWith(b)) out += ' ' + t; };
      finals.forEach(add); if (interim.trim()) add(interim); return out;
    };
    const write = () => {
      const said = compose(); let v = base;
      if (said) { const sx = v ? said : said.charAt(0).toUpperCase() + said.slice(1); v = v ? v.replace(/\s+$/, '') + (/[.,;:!?]$/.test(v) ? ' ' : ', ') + sx : sx; }
      ta.value = v.slice(0, MAXLEN); sync(); ta.scrollTop = ta.scrollHeight;
    };
    const ui = state => {
      box.classList.toggle('vox', state === 'on'); mic.setAttribute('aria-pressed', state === 'on' ? 'true' : 'false');
      lab.textContent = state === 'on' ? 'Fertig' : 'Einsprechen'; mic.setAttribute('aria-label', state === 'on' ? 'Zuhören beenden' : 'Einsprechen: Ihre Küche einfach erzählen');
      note.hidden = state !== 'on';
    };
    const say = (html, ms) => {
      clearTimeout(okT); if (!html) { st.innerHTML = ''; box.classList.remove('vmsg'); return; }
      if (st.innerHTML !== html) st.innerHTML = html; box.classList.add('vmsg'); if (ms) okT = setTimeout(() => { st.innerHTML = ''; box.classList.remove('vmsg'); }, ms);
    };
    function tip() {
      let seen = false; try { seen = !!sessionStorage.getItem('kpai-mt'); } catch (e) { }
      if (seen || on) return; try { sessionStorage.setItem('kpai-mt', '1'); } catch (e) { }
      setTimeout(() => { box.classList.add('tip'); setTimeout(() => box.classList.remove('tip'), 5200); }, 900);
    }
    function start() {
      if (on) return stop();
      hideCoach(); err.textContent = ''; box.classList.remove('tip');
      if (!srOK()) return showCoach();
      let r = null; try { r = new SRC(); } catch (e) { srBad(); return showCoach(); }
      base = ta.value.trim(); finals = []; off = 0; interim = ''; heard = false; speaking = false; why = ''; restarts = 0; want = true; t0 = last = Date.now(); after = null;
      try { col = (getComputedStyle(box).getPropertyValue('--a') || '').trim() || col; } catch (e) { }
      rec = r; wire(r);
      try { r.start(); } catch (e) { rec = null; srBad(); return showCoach(); }
      on = true; ui('on'); say('<i></i>Mikrofon wird geöffnet …');
      if (document.activeElement === ta) ta.blur();   // Handy: Tastatur weg, damit Welle und Text sichtbar bleiben
      cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
      clearInterval(tmr); tmr = setInterval(() => {
        const now = Date.now();
        if (on) say(`<i></i>${heard ? 'Hört zu' : 'Jetzt sprechen'} · ${fmt(now - t0)}`);
        if (now - t0 > VMAX || (heard && !speaking && now - last > VQUIET)) stop();
      }, 250);
    }
    function wire(r) {
      r.lang = 'de-DE'; r.interimResults = true; r.continuous = true; try { r.maxAlternatives = 1; } catch (e) { }
      r.onaudiostart = () => { if (REALWAVE && !stream) realWave(); };
      r.onspeechstart = () => { speaking = true; last = Date.now(); };
      r.onspeechend = () => { speaking = false; last = Date.now(); };
      r.onresult = ev => {
        if (rec !== r) return; interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) { const x = ev.results[i], t = (x[0] && x[0].transcript) || ''; if (x.isFinal) finals[off + i] = t; else interim += t; }
        heard = true; last = Date.now(); bump = 1; write();
      };
      r.onerror = ev => { why = (ev && ev.error) || 'x'; };
      r.onend = () => {
        if (rec !== r) return;
        if (interim.trim()) { finals.push(interim); interim = ''; }
        const fatal = /not-allowed|service-not-allowed|network|audio-capture|language-not-supported|bad-grammar/.test(why), now = Date.now();
        // Handy-Browser beenden nach einer Sprechpause von selbst – solange gerade noch gesprochen wurde, weiter zuhören
        if (want && !fatal && now - t0 < VMAX && restarts < 10 && (heard ? now - last < VQUIET : now - t0 < 8000)) {
          restarts++; off = finals.length; why = '';
          try { const n = new SRC(); rec = n; wire(n); n.start(); return; } catch (e) { }
        }
        finish();
      };
    }
    function stop(cb) { if (typeof cb === 'function') after = cb; want = false; const r = rec; if (!r) return finish(); try { r.stop(); } catch (e) { finish(); } setTimeout(() => { if (on && rec === r) finish(); }, 2500); }
    function cancel() { after = null; if (on) { want = false; finish(true); } hideCoach(); }
    function finish(quiet) {
      if (!on) return; on = false; want = false; clearInterval(tmr); cancelAnimationFrame(raf); stopWave();
      const r = rec; rec = null; if (r) { r.onresult = r.onend = r.onerror = r.onaudiostart = r.onspeechstart = r.onspeechend = null; try { r.abort(); } catch (e) { } }
      if (interim.trim()) { finals.push(interim); interim = ''; }
      write(); ui('off'); box.style.removeProperty('--lv');
      const said = compose().trim(), cb = after; after = null;
      if (quiet) { say(''); return; }
      if (said) {
        say(`<b class="ok">✓</b> Verstanden – Text prüfen, dann weiter`, 4200);
        box.classList.remove('vok'); void box.offsetWidth; box.classList.add('vok'); setTimeout(() => box.classList.remove('vok'), 1500);
        if (cb) return cb();
        const go = el.querySelector('[data-kpai-run]'); if (go) { go.classList.remove('nudge'); void go.offsetWidth; go.classList.add('nudge'); setTimeout(() => go.classList.remove('nudge'), 3200); }
        return;
      }
      say('');
      if (cb && ta.value.trim().length >= 4) return cb();
      if (/^not-allowed$/.test(why)) showCoach('Das Mikrofon ist für diese Seite gesperrt – erlauben Sie es über das Schloss-Symbol neben der Adresse, oder diktieren Sie so:');
      else if (/network|service-not-allowed|language-not-supported|bad-grammar/.test(why)) { srBad(); showCoach('Die Spracherkennung Ihres Browsers ist gerade nicht erreichbar – so geht es trotzdem:'); }
      else if (why === 'audio-capture') showCoach('Es wurde kein Mikrofon gefunden – diktieren Sie stattdessen so:');
      else err.textContent = 'Ich habe nichts gehört – tippen Sie noch einmal auf „Einsprechen“ und sprechen Sie einfach los.';
    }
    // Welle: am PC echte Lautstärke (Chrome/Edge), sonst aus den Sprach-Ereignissen des Browsers
    async function realWave() {
      try {
        const sm = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        if (!on) { sm.getTracks().forEach(t => t.stop()); return; } stream = sm;
        const AC = window.AudioContext || window.webkitAudioContext; actx = new AC(); const src = actx.createMediaStreamSource(sm);
        ana = actx.createAnalyser(); ana.fftSize = 1024; abuf = new Float32Array(ana.fftSize); src.connect(ana);
      } catch (e) { stopWave(); }
    }
    function stopWave() { ana = null; if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch (e) { } stream = null; } if (actx) { try { actx.close(); } catch (e) { } actx = null; } }
    function draw(ts) {
      if (!on) return; raf = requestAnimationFrame(draw);
      let tg;
      if (ana && abuf) { ana.getFloatTimeDomainData(abuf); let q = 0; for (let i = 0; i < abuf.length; i += 2) q += abuf[i] * abuf[i]; tg = Math.min(1, Math.sqrt(q / (abuf.length / 2)) * 7.5); }
      else { tg = Math.max(bump, speaking ? .5 + .28 * Math.sin(ts / 170) * Math.sin(ts / 83 + 1) : heard ? .1 : .05); bump *= .93; }
      lvl += (tg - lvl) * (tg > lvl ? .45 : .12); box.style.setProperty('--lv', lvl.toFixed(3));
      if (!cx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      const n = Math.max(14, Math.min(64, Math.floor(W / 6))), bw = Math.max(2, W / n * .52), mid = H / 2, t = RMO ? 0 : ts;
      cx.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), env = Math.sin(Math.PI * u) * .75 + .25;
        const wob = .55 + .45 * Math.sin(i * 1.83 + t / 140) * Math.sin(i * .61 - t / 230);
        const h = Math.max(2.5, (H - 4) * env * (.07 + lvl * wob));
        cx.globalAlpha = .35 + .65 * env; const x = i * (W / n) + (W / n - bw) / 2;
        if (cx.roundRect) { cx.beginPath(); cx.roundRect(x, mid - h / 2, bw, h, bw / 2); cx.fill(); } else cx.fillRect(x, mid - h / 2, bw, h);
      }
      cx.globalAlpha = 1;
    }
    // Hinweis-Karte: Diktieren über die Tastatur (Handy) bzw. den Computer
    function showCoach(title) {
      const kb = KBD;
      const key = OSN === 'mac' ? 'Zweimal <kbd>fn</kbd> (🌐) drücken' : OSN === 'win' ? '<kbd>⊞ Win</kbd> + <kbd>H</kbd> drücken' : 'Diktierfunktion Ihres Systems starten';
      const head = kb ? `Jetzt in Ihrer Tastatur auf <i class="kpai-kbm">${ICO.mic}</i> tippen` : key;
      const body = 'Dann einfach lossprechen – der Text erscheint direkt hier im Feld.';
      const extra = title ? '' : !SRC ? `<small>${kb ? 'Ihr Browser hört hier nicht selbst zu, Ihre Tastatur schon. In Chrome oder Safari geht es auch direkt.' : 'Ihr Browser hört hier nicht selbst zu. In Chrome, Edge oder Safari geht es auch direkt.'}</small>` : '';
      coach.innerHTML = `<div class="kpai-kbi${kb ? '' : ' pc'}" aria-hidden="true">${kb ? KBSVG : ICO.mic}</div><div class="kpai-ctx">${title ? `<em>${title}</em>` : ''}<b>${head}</b><span>${body}</span>${extra}</div><button type="button" class="kpai-cx" aria-label="Hinweis schließen">×</button>`;
      coach.hidden = false; coach.classList.remove('ok'); requestAnimationFrame(() => coach.classList.add('in'));
      coach.querySelector('.kpai-cx').onclick = () => { hideCoach(); ta.focus(); };
      coachOn = true; coachLen = ta.value.length;
      try { ta.focus({ preventScroll: true }); const n = ta.value.length; ta.setSelectionRange(n, n); } catch (e) { ta.focus(); }
      setTimeout(() => { try { coach.scrollIntoView({ block: 'nearest', behavior: RMO ? 'auto' : 'smooth' }); } catch (e) { } }, kb ? 420 : 60);
    }
    function hideCoach() { if (!coachOn && coach.hidden) return; coachOn = false; coach.classList.remove('in'); setTimeout(() => { if (!coachOn) coach.hidden = true; }, 260); }
    ta.addEventListener('input', () => {
      if (!coachOn || ta.value.length < coachLen + 3) return;
      coachOn = false; coach.classList.add('ok');
      const b = coach.querySelector('.kpai-ctx'); if (b) b.innerHTML = '<b>✓ Klappt – einfach weitererzählen.</b><span>Wenn alles drinsteht, tippen Sie auf „Weiter“.</span>';
      setTimeout(hideCoach, 2600);
    });
    mic.addEventListener('click', () => { if (on) stop(); else start(); });
    return { start, stop, cancel, tip, on: () => on };
  }
  function accent() {
    const root = document.querySelector('[data-kp]'), a = (window.KP && KP.acc) || (root && root.dataset.acc);
    if (a && /^#[0-9a-f]{3,8}$/i.test(a)) document.documentElement.style.setProperty('--kpai-acc', a);
  }
  function show(s) {
    ov_.querySelectorAll('.kpai-s').forEach(x => x.classList.toggle('on', x.dataset.s === s));
    const box = ov_.querySelector('.kpai-box'); box.scrollTop = 0;
    if (s === 'in') setTimeout(() => { if (!(V && V.on())) ov_.querySelector('textarea').focus(); }, 30);
    if (s === 'res') setTimeout(() => ov_.querySelector('[data-kpai-apply]').focus(), 30);
    if (s === 'room') setTimeout(() => ov_.querySelector('[data-kpai-plan]').focus({ preventScroll: true }), 30);
    if (s === 'done') setTimeout(() => ov_.querySelector('.kpai-s[data-s="done"] [data-kpai-x]').focus({ preventScroll: true }), 30);
  }
  function open(pre, mode, opt) {
    if (!ov_) ov_ = build(); accent();
    lastFocus = document.activeElement; ov_.hidden = false; document.documentElement.classList.add('kpai-lock'); try { window.__lenis && window.__lenis.stop(); } catch (e) { }
    requestAnimationFrame(() => ov_.classList.add('in'));
    let used = false; try { used = !!sessionStorage.getItem('kpai-used'); } catch (e) { }
    setMode(mode || (used ? 'edit' : 'neu'));
    if (pre) { const ta = ov_.querySelector('textarea'); ta.value = pre; ta.dispatchEvent(new Event('input')); }
    show('in');
    if (opt && opt.listen && V) V.start(); else if (V) V.tip();
  }
  let mode = 'neu';
  function setMode(m, focus) {
    mode = m === 'edit' ? 'edit' : 'neu'; const sec = ov_.querySelector('[data-s="in"]'); sec.classList.toggle('edit', mode === 'edit');
    ov_.querySelectorAll('[data-mode]').forEach(b => { const on = b.dataset.mode === mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const ta = ov_.querySelector('textarea'); ta.placeholder = 'zum Beispiel ' + (mode === 'edit' ? EXE : EX); ov_.querySelector('.kpai-err').textContent = '';
    if (focus) ta.focus();
  }
  function close() {
    if (!ov_ || ov_.hidden) return; if (V) V.cancel(); ov_.classList.remove('in'); document.documentElement.classList.remove('kpai-lock'); try { window.__lenis && window.__lenis.start(); } catch (e) { }
    setTimeout(() => { ov_.hidden = true; }, RMO ? 0 : 260); if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  let busy = false, rc = null;
  function run() {
    if (busy) return; if (V && V.on()) return V.stop(run); const ta = ov_.querySelector('textarea'), err = ov_.querySelector('.kpai-err'); const text = ta.value.trim().slice(0, MAXLEN);
    if (text.length < 4) { err.textContent = mode === 'edit' ? 'Was soll sich ändern? Zum Beispiel: „Fenster 30 cm nach links“.' : 'Beschreiben Sie kurz Ihren Raum oder Ihre Wünsche – oder tippen Sie ein paar Wünsche an.'; ta.focus(); return; }
    err.textContent = '';
    if (mode === 'edit' || looksLikeEdit(text)) return runEdit(text);
    const cur = current(); let b = null; try { b = parse(text, cur); } catch (e) { b = null; }
    if (!b) { err.textContent = 'Das hat leider nicht geklappt – bitte etwas anders formulieren.'; return; }
    let pre = null; try { pre = generateBest(JSON.parse(JSON.stringify(b)), cur); } catch (e) { pre = null; }
    rc = makeRC(b, pre, text); renderRoom(); show('room');
  }
  async function planConfirmed() {
    if (busy || !rc) return; const err = ov_.querySelector('.kpai-err'); busy = true; show('run');
    const text = rc.text, b = briefFromRC(rc);
    const st = ov_.querySelector('.kpai-st'), bar = ov_.querySelector('.kpai-bar i'); let k = 0; st.textContent = STAT[0];
    const iv = setInterval(() => { k = Math.min(STAT.length - 1, k + 1); st.textContent = STAT[k]; }, 650);
    const t0 = Date.now(); bar.style.transitionDuration = (RMO ? 0.6 : MINWAIT / 1000 + 1.5) + 's'; requestAnimationFrame(() => bar.style.width = '92%');
    let res = null; const cur = current();
    try { res = await planB(b, text, cur); } catch (e) { res = null; }
    if (!res) try { res = localPlanB(b, cur); } catch (e) { res = null; }
    const wait = (RMO ? 500 : MINWAIT) - (Date.now() - t0); if (wait > 0) await new Promise(r => setTimeout(r, wait));
    clearInterval(iv); bar.style.transitionDuration = '.25s'; bar.style.width = '100%'; busy = false;
    setTimeout(() => { bar.style.transitionDuration = '0s'; bar.style.width = '0'; }, 400);
    if (!res) { show('room'); const wl = ov_.querySelector('[data-rwarn]'); wl.innerHTML = '<li class="bad">Mit diesen Maßen ließ sich keine Küche planen – bitte Raum oder Form prüfen.</li>'; return; }
    res.text = text; result = res;
    let alt = null; try { alt = ideaB(b, cur, res, !!(rc.b && rc.b.formSaid) || rc.form !== rc.form0); } catch (e) { alt = null; }
    if (alt) alt.text = text;
    ideas = alt ? [res, alt] : [res]; pick = 0;
    renderResult(res); renderIdeas();
    show('res');
  }
  function renderResult(r) {
    const p = r.plan;
    ov_.querySelector('[data-s="res"]').dataset.src = r.src;
    ov_.querySelector('.kpai-pv').innerHTML = planSvg(p) + `<p class="kpai-leg"><span><i class="dev"></i>Geräte</span><span><i class="tall"></i>Hochschränke</span><span><i class="base"></i>Unterschränke</span><span><i class="win"></i>Fenster</span><span><i class="door"></i>Tür</span></p>`;
    ov_.querySelector('.kpai-h3').textContent = `${FORMS[p.f].n.replace(/^k/, 'K')} · ${mm(p.r.w, p.r.d)}`;
    ov_.querySelector('.kpai-got').innerHTML = (r.got || []).slice(0, 14).map(g => `<span>${esc(g)}</span>`).join('');
    ov_.querySelector('.kpai-why').textContent = r.why || '';
    ov_.querySelector('.kpai-notes').innerHTML = (r.notes || []).slice(0, 3).map(n => `<li>${esc(n)}</li>`).join('');
  }
  // Zwei Ideen als Karten: 3D-Vorschaubild (Planer), drei Kennzahlen, was sie unterscheidet
  let ideas = [], pick = 0;
  function traits(p) {
    const ws = FORMS[p.f].walls, all = [].concat(...ws.map(w => (p.rw[w] || []).map(m => m[0]))), T = [];
    const win = (p.op || []).filter(o => o[0] === 'fenster'), sinkW = ws.find(w => (p.rw[w] || []).some(m => m[0] === 'sp'));
    if (sinkW) { const sp = spans(p, sinkW).find(x => x.t === 'sp'); if (sp && win.some(o => o[1] === sinkW && ov(sp.x, sp.w, o[2], o[3], 10))) T.push('Spüle unterm Fenster'); }
    { const WA = { W: 'an der linken Wand', E: 'an der rechten Wand', S: 'gegenüber' }; if (sinkW && sinkW !== 'N' && WA[sinkW]) T.push('Spüle ' + WA[sinkW]); const cw = ws.find(w => (p.rw[w] || []).some(m => m[0] === 'kf' || m[0] === 'ko')); if (cw && cw !== 'N' && WA[cw]) T.push('Kochfeld ' + WA[cw]); }
    if (p.f === 'insel') T.push(p.is.v === 'kochfeld' ? 'Kochen auf der Insel' : p.is.v === 'spuele' ? 'Spülen auf der Insel' : 'Insel als Arbeitsfläche');
    if (all.includes('bm')) T.push('Backofen + Mikrowelle hoch'); else if (all.includes('bo')) T.push('Backofen auf Augenhöhe'); else if (all.includes('ko')) T.push('Herd mit Backofen unten');
    if (all.includes('vo')) T.push('Vorratsschrank'); if (all.includes('ah') || all.includes('ap')) T.push('Apothekerschrank');
    if (all.filter(t => t === 'kue').length > 1) T.push('Kühl- + Gefrierschrank');
    { const sp = spans(p, 'N').find(x => x.t === 'sp'), kf = spans(p, 'N').find(x => x.t === 'kf' || x.t === 'ko'); if (sp && kf) T.push(sp.x < kf.x ? 'Spüle links, Kochfeld rechts' : 'Kochfeld links, Spüle rechts'); }
    return T;
  }
  function renderIdeas() {
    const box = ov_.querySelector('[data-kpai-ideas]'), sec = ov_.querySelector('[data-s="res"]'), k = sec.querySelector('.kpai-k span'), ap = sec.querySelector('[data-kpai-apply] span');
    if (ideas.length < 2) { box.hidden = true; box.innerHTML = ''; sec.classList.remove('two'); if (k) k.textContent = 'Ihr Entwurf ist fertig'; if (ap) ap.textContent = 'Plan übernehmen'; return; }
    sec.classList.add('two'); if (k) k.textContent = 'Zwei Ideen für Ihren Raum';
    const met = ideas.map(r => { try { return window.KP && KP.metricsOf ? KP.metricsOf(r.plan) : null; } catch (e) { return null; } });
    const tr = ideas.map(r => traits(r.plan)), fm = ideas.map(r => { const n = FORMS[r.plan.f].n; return n.charAt(0).toUpperCase() + n.slice(1); });
    const m1 = v => (v / 100).toFixed(1).replace('.', ',') + ' m', lt = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' l';
    const better = (i, key, low) => { const a = met[0], c = met[1]; if (!a || !c || a[key] == null || c[key] == null) return false; const v = [a[key], c[key]]; return low ? v[i] < v[1 - i] - 30 : v[i] > v[1 - i] * 1.04; };
    box.innerHTML = `<p class="kpai-il">Welche gefällt Ihnen auf den ersten Blick? Tippen Sie eine an – darunter stehen die Details.</p><div class="kpai-ig">${ideas.map((r, i) => {
      const own = tr[i].filter(t => !tr[1 - i].includes(t)).slice(0, 2), m = met[i], sub = fm[0] !== fm[1] ? fm[i] : (own[0] || fm[i]);
      return `<button type="button" class="kpai-idea${i === pick ? ' on' : ''}" data-idea="${i}" aria-pressed="${i === pick}">
        <span class="kpai-iv"><span class="kpai-iimg" data-iimg="${i}">${planSvg(r.plan)}</span><b class="kpai-it">Idee ${'AB'[i]}</b><i class="kpai-ick" aria-hidden="true">✓</i></span>
        <span class="kpai-ib"><b>${esc(sub)}</b>${(fm[0] !== fm[1] ? own : own.slice(1)).map(t => `<small>${esc(t)}</small>`).join('')}</span>
        ${m ? `<span class="kpai-im"><span${better(i, 'free') ? ' class="up"' : ''}><em>${m1(m.free)}</em>Arbeitsfläche</span><span${better(i, 'vol') ? ' class="up"' : ''}><em>${lt(m.vol)}</em>Stauraum</span><span${m.tri != null && better(i, 'tri', 1) ? ' class="up"' : ''}><em>${m.tri != null ? m1(m.tri) : '–'}</em>Laufweg</span></span>` : ''}
      </button>`; }).join('')}</div>`;
    box.hidden = false; if (ap) ap.textContent = `Mit Idee ${'AB'[pick]} weitermachen`;
    // echte 3D-Vorschaubilder, sobald der Ergebnis-Schritt steht (Planer-Engine; ohne Planer bleibt der Grundriss)
    setTimeout(() => { ideas.forEach((r, i) => { try { const c = window.KP && KP.shot ? KP.shot(r.plan, 560, 350) : null; const el = box.querySelector(`[data-iimg="${i}"]`); if (c && el) { el.innerHTML = `<img src="${c.toDataURL('image/jpeg', .86)}" alt="Idee ${'AB'[i]} als 3D-Ansicht">`; el.classList.add('img'); } } catch (e) { } }); }, 120);
  }
  function pickIdea(i) {
    if (!ideas[i] || i === pick) return; pick = i; result = ideas[i]; renderResult(result);
    ov_.querySelectorAll('[data-idea]').forEach(b => { const on = +b.dataset.idea === i; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const ap = ov_.querySelector('[data-kpai-apply] span'); if (ap) ap.textContent = `Mit Idee ${'AB'[i]} weitermachen`;
  }
  function apply() {
    if (!result) return; const p = result.plan;
    if (window.KP && typeof KP.applyPlan === 'function') {
      let prev = ''; try { prev = (KP.hash && KP.hash()) || location.hash || ''; } catch (e) { prev = ''; }
      let ok = false; try { KP.applyPlan(JSON.parse(JSON.stringify(p))); ok = true; } catch (e) { ok = false; }
      if (ok) {
        try { sessionStorage.setItem('kpai-used', '1'); } catch (e) { }
        toForm(result.text);
        close(); done({ why: result.why, prev: /^#k=/.test(prev) ? prev : '' });
        if (innerWidth < 1000) setTimeout(toStage, 300);
        return;
      }
    }
    try { sessionStorage.setItem('kpai-after', JSON.stringify({ why: result.why, prev: location.hash, t: Date.now(), text: result.text || '' })); } catch (e) { }
    try { history.scrollRestoration = 'manual'; } catch (e) { }
    history.replaceState(null, '', '#k=' + b64(JSON.stringify(p)));
    scrollTo(0, 0); try { window.KPLeave && window.KPLeave.ok(); } catch (e) { } location.reload();
  }
  // Handy: zur 3D-Bühne scrollen – unter dem klebenden Kopf (Seitenkopf + Planer-Schritte)
  function toStage() {
    const st = document.querySelector('.kp-stph.on') || document.querySelector('.kp-stage'), hd = document.querySelector('.kp-head'); if (!st) return;
    let off = 0; try { off = hd ? (parseFloat(getComputedStyle(hd).top) || 0) + hd.offsetHeight : 0; } catch (e) { off = 0; }
    const y = Math.max(0, st.getBoundingClientRect().top + scrollY - off - 2), L = window.__lenis;
    if (L && typeof L.scrollTo === 'function') { try { L.scrollTo(y, { immediate: RMO }); return; } catch (e) { } }
    scrollTo({ top: y, behavior: RMO ? 'auto' : 'smooth' });
  }
  // Die eigene Beschreibung geht mit der Anfrage mit (FormSubmit-Formular in Schritt 4)
  function toForm(text) {
    try {
      const f = document.querySelector('[data-kp-form]'); if (!f || !text) return;
      let i = f.querySelector('[name="KI-Beschreibung"]'); if (!i) { i = document.createElement('input'); i.type = 'hidden'; i.name = 'KI-Beschreibung'; const e = f.querySelector('[name="Entwurf"]'); if (e && e.parentNode) e.parentNode.insertBefore(i, e.nextSibling); else f.appendChild(i); }
      i.value = String(text).slice(0, MAXLEN);
    } catch (e) { }
  }
  // Nach dem Übernehmen: Hinweis „Jetzt nach Herzenslust anpassen"
  function done(info) {
    const stage = document.querySelector('.kp-stage') || document.querySelector('[data-kp]'); if (!stage) return;
    document.querySelectorAll('.kpai-done').forEach(x => x.remove());
    const d = document.createElement('div'); d.className = 'kpai-done'; d.setAttribute('role', 'status');
    d.innerHTML = `<div class="kpai-dh">${ICO.spark}<div><b>Ihre KI-Küche steht.</b><span>Jetzt nach Herzenslust anpassen – Schränke antippen, ziehen, tauschen. Oder der KI sagen, was sich ändern soll.</span></div><button type="button" class="kpai-dx" aria-label="Hinweis schließen">×</button></div>${info.why ? `<details><summary>Warum so geplant?</summary><p>${esc(info.why)}</p></details>` : ''}<div class="kpai-da"><button type="button" data-kpai-say class="say">${ICO.mic}Einsprechen</button><button type="button" data-kpai-edit>Mit KI ändern</button>${info.prev ? '<button type="button" data-kpai-prev>Alten Entwurf zurück</button>' : ''}<button type="button" data-kpai-again>Neu beschreiben</button></div>`;
    stage.appendChild(d); requestAnimationFrame(() => d.classList.add('in'));
    const rm = () => { d.classList.remove('in'); setTimeout(() => d.remove(), 300); };
    d.querySelector('.kpai-dx').onclick = rm;
    const pv = d.querySelector('[data-kpai-prev]');
    if (pv) pv.onclick = () => {
      if (window.KP && typeof KP.applyPlan === 'function') { try { KP.applyPlan(unb64(info.prev.slice(3))); rm(); if (KP.toast) KP.toast('Ihr vorheriger Entwurf ist wieder da.'); return; } catch (e) { } }
      history.replaceState(null, '', info.prev); try { window.KPLeave && window.KPLeave.ok(); } catch (e) { } location.reload();
    };
    d.querySelector('[data-kpai-again]').onclick = () => { rm(); open('', 'neu'); };
    d.querySelector('[data-kpai-edit]').onclick = () => { rm(); open('', 'edit'); };
    d.querySelector('[data-kpai-say]').onclick = () => { rm(); open('', 'edit', { listen: true }); };
    setTimeout(() => { if (d.isConnected && !d.matches(':hover') && !d.querySelector('details[open]')) d.classList.add('mini'); }, innerWidth < 1000 ? 9000 : 14000);
  }

  /* ================= 6b) Raum prüfen (vor dem Planen) ================= */
  const WLAB = { N: 'Rückwand', W: 'linke Wand', E: 'rechte Wand', S: 'Wand gegenüber' }, WAN2 = { N: 'an der Rückwand', W: 'an der linken Wand', E: 'an der rechten Wand', S: 'an der Wand gegenüber' };
  const ITN = { fenster: 'Fenster', balkon: 'Balkontür', tuer: 'Tür', wasser: 'Wasseranschluss' };
  const rlen = (w, r) => (w === 'N' || w === 'S') ? r.w : r.d;
  const resolveWall = (x, r) => x === 'lang' ? (r.w >= r.d ? 'N' : 'W') : x === 'kurz' ? (r.w < r.d ? 'N' : 'W') : x;
  function makeRC(b, pre, text) {
    const r = pre ? { w: pre.plan.r.w, d: pre.plan.r.d } : { w: b.room.w, d: b.room.d }, form = pre ? pre.plan.f : b.form, items = [];
    (pre ? pre.plan.op : []).forEach(([t, w, s0, ow]) => items.push({ t, wall: w, c: s0 + ow / 2, w: ow }));
    if (!pre && !b.win.none) items.push({ t: 'fenster', wall: resolveWall(b.win.wall, r) || 'N', c: r.w / 2, w: b.win.w || 120 });
    if (b.water) { const w = resolveWall(b.water.wall, r) || 'N'; items.push({ t: 'wasser', wall: w, c: rlen(w, r) / 2, w: 0 }); }
    return { b, text, w: r.w, d: r.d, form, form0: form, items, given: !!b.roomGiven, menu: null };
  }
  function briefFromRC(c) {
    const b = JSON.parse(JSON.stringify(c.b)); b.room = { w: c.w, d: c.d }; b.roomGiven = true; b.form = c.form; b.formSaid = true;
    b.isl.want = c.form === 'insel'; b.notes = (b.notes || []).filter(n => !/Kochinsel braucht/.test(n)); b.islDropped = false;
    const wins = c.items.filter(i => i.t === 'fenster'), door = c.items.find(i => i.t === 'tuer'), bal = c.items.find(i => i.t === 'balkon'), wat = c.items.find(i => i.t === 'wasser');
    b.win = { wall: wins[0] ? wins[0].wall : null, w: wins[0] ? wins[0].w : 120, none: !wins.length };
    b.door = { wall: door ? door.wall : null, w: door ? door.w : 90 }; b.balkon = !!bal;
    b.fixOps = c.items.filter(i => i.t !== 'wasser').map(i => [i.t, i.wall, Math.round(i.c - i.w / 2), i.w]);
    b.water = wat ? { wall: wat.wall, s: Math.round(wat.c) } : null;
    b.got = (b.got || []).filter(g => !/^Raum |^Küchenzeile|^L-Küche|^U-Küche|^Zweizeil|^Küche mit|^Kochinsel|^Wasser /.test(g));
    b.got.unshift(`Raum ${mm(c.w, c.d)} · bestätigt`, FORMS[c.form].n.replace(/^k/, 'K')); if (wat) b.got.push('Wasser ' + WAN2[wat.wall].replace(/^an der /, ''));
    return b;
  }
  function setDim(k, v) { rc[k] = clamp(r10(v), 240, k === 'w' ? 800 : 700); rc.items.forEach(i => clampItem(i)); rc.menu = null; renderRoom(); }
  function clampItem(i) { const L = rlen(i.wall, rc); if (i.w > L - 30) i.w = (OPW[i.t] || [0]).filter(v => v <= L - 30).pop() || i.w; const h = i.w / 2 + (i.t === 'fenster' ? 10 : i.t === 'wasser' ? 8 : 5); i.c = Math.round(clamp(i.c, h, L - h) / 5) * 5; }
  function rotateRoom() { const R = { N: 'E', E: 'S', S: 'W', W: 'N' }; const w = rc.w; rc.w = rc.d; rc.d = w; rc.items.forEach(i => { i.wall = R[i.wall]; clampItem(i); }); rc.menu = null; renderRoom(); }
  function roomSvg() {
    const W = rc.w, D = rc.d, pad = Math.max(46, Math.round(Math.max(W, D) * .11)), kw = FORMS[rc.form].walls, out = [];
    out.push(`<rect class="kpai-floor" x="0" y="0" width="${W}" height="${D}"/>`);
    const band = { N: [0, 0, W, 60], S: [0, D - 60, W, 60], W: [0, 0, 60, D], E: [W - 60, 0, 60, D] };
    kw.forEach(w => { const [x, y, bw, bh] = band[w]; out.push(`<rect class="kpai-rk" x="${x}" y="${y}" width="${bw}" height="${bh}"/>`); });
    if (rc.form === 'insel') out.push(`<rect class="kpai-rk isl" x="${W / 2 - 90}" y="${Math.max(210, Math.min(D - 120, 225)) - 50}" width="180" height="100" rx="6"/>`);
    if (kw.length) { const k0 = kw.includes('N') ? 'N' : kw[0], [x, y, bw, bh] = band[k0], wat = rc.items.find(i => i.t === 'wasser' && i.wall === k0), L0 = rlen(k0, rc); let f = .5; if (wat) f = wat.c / L0 < .5 ? .76 : .24; const tx = bw > bh ? x + bw * f : x + bw / 2, ty = bw > bh ? y + bh / 2 : y + bh * (1 - f); out.push(`<text class="kpai-rkt" x="${tx}" y="${ty}" dy=".35em"${bw > bh ? '' : ` transform="rotate(-90 ${tx} ${ty})"`}>Küche</text>`); }
    out.push(`<rect class="kpai-wall" x="0" y="0" width="${W}" height="${D}"/>`);
    // Wand-Trefferflächen
    [['N', 0, 0, W, 0], ['S', 0, D, W, D], ['W', 0, 0, 0, D], ['E', W, 0, W, D]].forEach(([k, x1, y1, x2, y2]) => out.push(`<line class="kpai-rhit" data-rw="${k}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`));
    const P = (w, a, o = 0) => ({ N: [a, o], S: [W - a, D - o], W: [o, D - a], E: [W - o, a] })[w];
    rc.items.forEach((it, i) => {
      const on = rc.menu && rc.menu.item === i ? ' on' : '';
      if (it.t === 'wasser') { const [x, y] = P(it.wall, it.c, 26); out.push(`<g class="kpai-ri w${on}" data-ri="${i}"><circle cx="${x}" cy="${y}" r="17"/><path d="M${x} ${y - 10}c6 7 8 11 8 15a8 8 0 0 1-16 0c0-4 2-8 8-15z" fill="#fff"/><circle cx="${x}" cy="${y}" r="34" fill="transparent"/></g>`); return; }
      const [x1, y1] = P(it.wall, it.c - it.w / 2), [x2, y2] = P(it.wall, it.c + it.w / 2), hit = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="56"/>`;
      if (it.t === 'tuer') { const [nx, ny] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[it.wall], ex = x2 + nx * it.w, ey = y2 + ny * it.w, sw = ((ex - x2) * (y1 - y2) - (ey - y2) * (x1 - x2)) > 0 ? 1 : 0; out.push(`<g class="kpai-ri d${on}" data-ri="${i}"><line class="gap" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="leaf" x1="${x2}" y1="${y2}" x2="${ex}" y2="${ey}"/><path class="arc" d="M${ex} ${ey}A${it.w} ${it.w} 0 0 ${sw} ${x1} ${y1}"/>${hit}</g>`); }
      else out.push(`<g class="kpai-ri ${it.t === 'balkon' ? 'b' : 'f'}${on}" data-ri="${i}"><line class="gap" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="glass" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${hit}</g>`);
    });
    if (rc.menu && rc.menu.wall) { const [x, y] = P(rc.menu.wall, rc.menu.a, 0); out.push(`<circle class="kpai-rtap" cx="${x}" cy="${y}" r="16"/>`); }
    const f = Math.max(15, Math.round(Math.max(W, D) * .036));
    out.push(`<g class="kpai-rlab" style="font-size:${f}px"><text x="${W / 2}" y="${-pad * .42}">Rückwand · ${mtr(W)} m</text><text x="${W / 2}" y="${D + pad * .62}">gegenüber</text><text transform="translate(${-pad * .42} ${D / 2}) rotate(-90)">links · ${mtr(D)} m</text><text transform="translate(${W + pad * .42} ${D / 2}) rotate(90)">rechts</text></g>`);
    return `<svg class="kpai-rplan" viewBox="${-pad} ${-pad} ${W + 2 * pad} ${D + 2 * pad}" role="img" aria-label="Raum von oben: Wände antippen">${out.join('')}</svg>`;
  }
  function renderRoom() {
    if (!ov_ || !rc) return;
    const q = ov_.querySelector('[data-rq]');
    q.innerHTML = rc.given ? `Verstanden: <b>${mm(rc.w, rc.d)}</b>. Die Küche steht an der Rückwand oben. Stimmt das? Sonst Maße ändern oder den Raum drehen.` : `Sie haben keine Raummaße genannt – angenommen sind <b>${mm(rc.w, rc.d)}</b>. Bitte die echten Maße eintragen, sonst passt die Planung nicht.`;
    ov_.querySelector('[data-rsvg]').innerHTML = roomSvg();
    ov_.querySelectorAll('[data-rin]').forEach(i => { if (document.activeElement !== i) i.value = mtr(rc[i.dataset.rin]); });
    ov_.querySelectorAll('[data-rf]').forEach(b => { const on = b.dataset.rf === rc.form; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    ov_.querySelector('[data-ritems]').innerHTML = rc.items.length ? rc.items.map((it, i) => `<li><i class="kpai-rdot ${it.t}"></i><span><b>${ITN[it.t]}</b> ${WAN2[it.wall]}<small>${it.w ? `${mtr(it.w)} m breit · ` : ''}Mitte ${mtr(it.c)} m von links</small></span><button type="button" data-rx="${i}" aria-label="${ITN[it.t]} entfernen">×</button></li>`).join('') : '<li class="none">Keine Fenster oder Türen – Wand antippen, um sie einzuzeichnen.</li>';
    const kw = FORMS[rc.form].walls, warn = [], door = rc.items.find(i => i.t === 'tuer' || i.t === 'balkon'), wat = rc.items.find(i => i.t === 'wasser');
    rc.items.filter(i => i.t === 'tuer' || i.t === 'balkon').forEach(i => { if (kw.includes(i.wall)) warn.push(`Die ${ITN[i.t]} liegt an einer Küchenwand – dort wird die Küche unterbrochen. Besser an eine freie Wand ziehen, den Raum drehen oder eine andere Form wählen.`); });
    if (!door) warn.push('Noch keine Tür eingezeichnet – Wand antippen und „Tür“ wählen.');
    if (wat && !kw.includes(wat.wall)) warn.push('Das Wasser kommt an einer Wand ohne Küche – die Leitungen müssten verlegt werden. Tipp: Raum drehen oder Form ändern.');
    if (rc.form === 'insel' && Math.min(rc.w, rc.d) < 380) warn.push('Für eine Kochinsel sollte der Raum mindestens 3,80 m tief sein – rundherum braucht es gut 1 m Laufweg.');
    if (rc.form === 'zwei' && rc.d < 240) warn.push('Für zwei Zeilen ist der Raum sehr schmal – 1,20 m Gang sind ideal.');
    ov_.querySelector('[data-rwarn]').innerHTML = warn.map(w => `<li>${esc(w)}</li>`).join('');
    const mn = ov_.querySelector('[data-rmenu]');
    if (!rc.menu) { mn.hidden = true; mn.innerHTML = ''; return; }
    mn.hidden = false;
    if (rc.menu.wall) mn.innerHTML = `<p><b>${WLAB[rc.menu.wall]}</b> · ${mtr(rc.menu.a)} m von links – was ist hier?</p><div class="kpai-chips sm"><button type="button" data-ra="fenster">Fenster</button><button type="button" data-ra="tuer">Tür</button><button type="button" data-ra="balkon">Balkontür</button><button type="button" data-ra="wasser">Wasser</button><button type="button" data-ra="x" class="ghost">Abbrechen</button></div>`;
    else { const it = rc.items[rc.menu.item]; if (!it) { rc.menu = null; mn.hidden = true; return; } mn.innerHTML = `<p><b>${ITN[it.t]}</b> ${WAN2[it.wall]}${it.w ? ` · ${mtr(it.w)} m breit` : ''} – zum Verschieben anfassen und ziehen.</p><div class="kpai-chips sm">${it.w ? '<button type="button" data-ra="w-">− schmaler</button><button type="button" data-ra="w+">breiter +</button>' : ''}<button type="button" data-ra="del" class="del">Entfernen</button><button type="button" data-ra="x" class="ghost">Fertig</button></div>`; }
  }
  function roomMenuAct(a) {
    const m = rc.menu; if (!m) return;
    if (a === 'x') { rc.menu = null; return renderRoom(); }
    if (m.wall) {
      const t = a, w0 = t === 'tuer' ? 90 : t === 'balkon' ? 120 : t === 'fenster' ? 120 : 0;
      if (t === 'tuer' || t === 'wasser') rc.items = rc.items.filter(i => i.t !== t);
      if (t === 'fenster' && rc.items.filter(i => i.t === 'fenster').length >= 4) { rc.menu = null; return renderRoom(); }
      const it = { t, wall: m.wall, c: m.a, w: w0 }; clampItem(it); rc.items.push(it); rc.menu = null; return renderRoom();
    }
    const it = rc.items[m.item]; if (!it) { rc.menu = null; return renderRoom(); }
    if (a === 'del') { rc.items.splice(m.item, 1); rc.menu = null; return renderRoom(); }
    if (a === 'w-' || a === 'w+') { const ws = OPW[it.t]; let i = ws.indexOf(it.w); if (i < 0) i = ws.findIndex(v => v >= it.w); i = clamp(i + (a === 'w+' ? 1 : -1), 0, ws.length - 1); if (ws[i] <= rlen(it.wall, rc) - 30) it.w = ws[i]; clampItem(it); return renderRoom(); }
  }
  // Antippen und Ziehen im Raum-Grundriss
  function roomPointer(host) {
    let dr = null;
    const pt = e => { const svg = host.querySelector('svg'); if (!svg) return null; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    const nearest = p => { const W = rc.w, D = rc.d, d = { N: Math.abs(p.y), S: Math.abs(p.y - D), W: Math.abs(p.x), E: Math.abs(p.x - W) }; const wall = Object.keys(d).sort((a, b) => d[a] - d[b])[0]; return { wall, a: clamp(Math.round({ N: p.x, S: W - p.x, W: D - p.y, E: p.y }[wall] / 5) * 5, 0, rlen(wall, rc)), dist: d[wall] }; };
    host.addEventListener('pointerdown', e => {
      if (!rc) return; const g = e.target.closest('[data-ri]'), p = pt(e); if (!p) return;
      dr = { x0: e.clientX, y0: e.clientY, item: g ? +g.dataset.ri : null, moved: false, id: e.pointerId };
      if (g) { try { host.setPointerCapture(e.pointerId); } catch (er) { } e.preventDefault(); }
    });
    host.addEventListener('pointermove', e => {
      if (!dr || dr.item == null || !rc) return; if (!dr.moved && Math.hypot(e.clientX - dr.x0, e.clientY - dr.y0) < 6) return; dr.moved = true;
      const it = rc.items[dr.item], p = pt(e); if (!it || !p) return; const n = nearest(p); it.wall = n.wall; it.c = n.a; clampItem(it); rc.menu = { item: dr.item }; renderRoom(); e.preventDefault();
    });
    const up = e => {
      if (!dr || !rc) { dr = null; return; } const d = dr; dr = null; if (d.moved) return;
      if (d.item != null) { rc.menu = rc.menu && rc.menu.item === d.item ? null : { item: d.item }; return renderRoom(); }
      const p = pt(e); if (!p) return; const n = nearest(p), pad = Math.max(rc.w, rc.d) * .16;
      if (n.dist > pad && p.x > 0 && p.y > 0 && p.x < rc.w && p.y < rc.d) { rc.menu = null; return renderRoom(); }
      rc.menu = { wall: n.wall, a: n.a }; renderRoom();
    };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', () => { dr = null; });
  }

  /* ================= 6c) Entwurf ändern – Sätze in gezielte Änderungen übersetzen ================= */
  const EDV = /(verschieb|versetz|nach links|nach rechts|weiter links|weiter rechts|breiter|schmaler|größer|kleiner|entfern|\bweg\b|lösch|statt|ändern|änder|tausch|rück|mittig|in die mitte|unters fenster|unter das fenster|anschluss|ist (an|auf|links|rechts|hinten)|kommt (an|links|rechts|aus)|arbeitshöhe)/;
  function looksLikeEdit(text) {
    const t = normText(text); if (t.length > 160) return false;
    const plan = /(küchenzeile|l-küche|u-küche|zweizeil|kochinsel|insel|apotheker|kühlschrank|backofen|stauraum|grifflos|landhaus|skandi|hängeschr|budget)/.test(t);
    const strong = /(verschieb|versetz|nach links|nach rechts|weiter links|weiter rechts|breiter|schmaler|entfern|\bweg\b|lösch|tausch|änder|unters fenster|unter das fenster)/.test(t);
    return strong && !plan && parseEdit(text).length > 0;
  }
  function parseEdit(raw) {
    const t = normText(raw), acts = [];
    const num = (v, u) => { const x = parseFloat(String(v).replace(',', '.')); return u && u[0] === 'c' ? x : (u || x < 15 ? (x < 15 ? x * 100 : x) : x); };
    const wallIn = c => { c = c.replace(/(nach|weiter|von|ab) (links|rechts)/g, ' '); return /\blink/.test(c) ? 'W' : /\brecht/.test(c) ? 'E' : /gegenüber|vorne?\b/.test(c) ? 'S' : /rückwand|hinten|hinter/.test(c) ? 'N' : null; };
    const by = c => { const m = c.match(/(?:um\s+)?(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)\b(?=[^.]*?(nach|weiter) (links|rechts))/) || c.match(/(?:nach|weiter) (?:links|rechts)\s+(?:um\s+)?(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)\b/); return m ? Math.round(num(m[1], m[2])) : null; };
    const at = c => { const m = c.match(/(?:bei|ab|auf)\s+(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?(?:\s+(?:von links|ab links|von der linken))?/) || c.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)\s+(?:von links|ab links|von der linken)/); return m ? Math.round(num(m[1], m[2] || 'm')) : null; };
    const wid = c => { const m = c.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?\s*breit/); return m ? Math.round(num(m[1], m[2] || (+m[1].replace(',', '.') < 15 ? 'm' : 'cm'))) : null; };
    const clauses = t.split(/[.;!?\n]| und |, (?=[a-zäöü])/).map(c => ' ' + c.trim() + ' ').filter(c => c.trim());
    for (const c of clauses) {
      let m;
      // Raummaße
      if ((m = c.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?\s*x\s*(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?/)) && !/fenster|tür|insel/.test(c)) { const u = m[4] || m[2] || 'm', a = num(m[1], m[2] || u), b2 = num(m[3], u); if (a >= 150 && b2 >= 150) { acts.push({ k: 'room', w: Math.round(a), d: Math.round(b2) }); continue; } }
      if (/(raum|zimmer|küche ist|rückwand|seitenw)/.test(c) && (m = c.match(/(\d+(?:[.,]\d+)?)\s*(cm|m|meter|metern)?\s*(breit|lang|tief)?/)) && (m[2] || m[3])) { const v = Math.round(num(m[1], m[2] || (+m[1].replace(',', '.') < 15 ? 'm' : 'cm'))); if (v >= 150) { acts.push({ k: 'room', [/tief|seitenw/.test(c) ? 'd' : 'w']: v }); continue; } }
      if ((m = c.match(/arbeitshöhe\D{0,14}(\d{2,3})/))) { acts.push({ k: 'ah', v: +m[1] }); continue; }
      // Anschlüsse
      if (/wasser|abfluss|abwasser/.test(c) && !/spülmaschine/.test(c)) { acts.push({ k: 'cx', t: 'wasser', wall: wallIn(c), s: at(c) }); continue; }
      if (/starkstrom|herdanschluss|drehstrom|400 ?v/.test(c)) { acts.push({ k: 'cx', t: 'herd', wall: wallIn(c), s: at(c) }); continue; }
      // Spüle / Kochfeld
      const dev = /spüle|becken/.test(c) && !/spülmaschine/.test(c) ? 'sinkTo' : /kochfeld|\bherd\b|ceran/.test(c) ? 'cookTo' : null;
      if (dev) { const a = { k: dev }; if (/fenster/.test(c)) a.ref = 'fenster'; else { const w = wallIn(c); if (w) a.wall = w; if (/nach links|weiter links/.test(c)) a.dx = -(by(c) || 60); if (/nach rechts|weiter rechts/.test(c)) a.dx = by(c) || 60; const s0 = at(c); if (s0 != null) a.s = s0; } if (a.ref || a.wall || a.dx || a.s != null) { acts.push(a); continue; } }
      // Fenster / Türen
      const ot = /balkon|terrass/.test(c) ? 'balkon' : /fenster/.test(c) ? 'fenster' : /\btür\b|eingang/.test(c) ? 'tuer' : null;
      if (ot) {
        if (/(kein|ohne|entfern|\bweg\b|raus\b|lösch)/.test(c)) { acts.push({ k: 'op', t: ot, del: true }); continue; }
        const a = { k: 'op', t: ot }, w = wallIn(c);
        if (/(dazu|hinzu|zusätzlich|noch ein|weiteres|zweites|neue[sr]?\b|einsetzen|einbauen)/.test(c)) { acts.push({ k: 'opAdd', t: ot, wall: w, s: at(c), w: wid(c) }); continue; }
        if (/nach links|weiter links|links rüber/.test(c)) a.dx = -(by(c) || 30); else if (/nach rechts|weiter rechts|rechts rüber/.test(c)) a.dx = by(c) || 30;
        if (/mittig|in die mitte|zentriert/.test(c)) a.center = true;
        if (w) { if (/\b(an|auf) der\b/.test(c) && !/\b(an|auf) die\b|\bzur\b|\bist\b|\bsoll\b|\bgehört\b/.test(c)) a.from = w; else if (/\b(an|auf|zur|zu|in|ist|soll|gehört)\b/.test(c)) a.wall = w; }
        const ww = wid(c); if (ww) a.w = ww; else if (/breiter|größer/.test(c)) a.dw = 1; else if (/schmaler|kleiner/.test(c)) a.dw = -1;
        const s0 = at(c); if (s0 != null && !a.dx) a.s = s0;
        if (a.dx || a.center || a.wall || a.w || a.dw || a.s != null) acts.push(a);
      }
    }
    return acts;
  }
  let editMark = 0, editBefore = '';
  function runEdit(text) {
    const E = window.KP && KP.edit, err = ov_.querySelector('.kpai-err');
    if (!E) { err.textContent = 'Der Planer ist noch nicht bereit – bitte kurz warten.'; return; }
    const acts = parseEdit(text), out = [];
    let st = null; try { const b = parse(text, current()); if (Object.keys(b.style).length || b.look) st = b; } catch (e) { st = null; }
    if (!acts.length && !st) { err.innerHTML = 'Das habe ich nicht verstanden. Zum Beispiel: „Fenster 30 cm nach links“, „Raum 3,20 × 4,00 m“, „Wasser an der linken Wand“ oder „Spüle unters Fenster“.'; return; }
    editMark = 0; editBefore = ''; try { editBefore = (KP.hash && KP.hash()) || ''; } catch (e) { } const OPN2 = { fenster: 'Fenster', tuer: 'Tür', balkon: 'Balkontür' };
    const did = (ok, msg) => { out.push({ ok, msg }); if (ok) editMark++; };
    for (const a of acts) {
      try {
        if (a.k === 'room') { const R = KP.room(); const r = E.room(a.w || R.w, a.d || R.d); did(1, `Raum jetzt ${mm(r.w, r.d)} – die Küche passt sich an.`); }
        else if (a.k === 'ah') { const v = E.setAh(a.v); did(1, `Arbeitshöhe jetzt ${v} cm.`); }
        else if (a.k === 'op' || a.k === 'opAdd') {
          const list = E.ops().filter(o => o.t === a.t), o = (a.from && list.find(x => x.wall === a.from)) || list[0];
          if (a.k === 'opAdd' || !o) {
            if (a.del) { did(0, `Es gibt keine ${OPN2[a.t]} zum Entfernen.`); continue; }
            const ws = E.walls(), free = ['N', 'E', 'S', 'W'].filter(w => !ws.includes(w)), wall = a.wall || (a.t === 'fenster' ? 'N' : free[0] || 'S');
            const r = E.addOp(a.t, wall, a.s != null ? a.s : null, a.w); if (r) did(1, `${OPN2[a.t]} ${WAN2[r.wall]} eingesetzt (${mtr(r.w)} m breit).`); else did(0, `Die ${OPN2[a.t]} ließ sich dort nicht einsetzen.`); continue;
          }
          if (a.del) { E.op(o.id, { del: true }); did(1, `${OPN2[a.t]} ${WAN2[o.wall]} entfernt.`); continue; }
          const ch = {}; let wall = o.wall;
          if (a.wall && a.wall !== o.wall) { ch.wall = wall = a.wall; ch.s = (E.len(wall) - o.w) / 2; }
          if (a.w) ch.w = a.w; else if (a.dw) { const ws = OPW[a.t], i = ws.indexOf(o.w); ch.w = ws[clamp((i < 0 ? ws.findIndex(v => v >= o.w) : i) + a.dw, 0, ws.length - 1)]; }
          const nw = ch.w || o.w;
          if (a.center) ch.s = (E.len(wall) - nw) / 2;
          if (a.s != null) ch.s = a.s;
          if (a.dx) ch.s = (ch.s != null ? ch.s : o.s) + a.dx;
          if (ch.w && ch.s == null) ch.s = o.s + (o.w - nw) / 2;
          const r = E.op(o.id, ch); if (!r) { did(0, `${OPN2[a.t]} ließ sich nicht ändern.`); continue; }
          const parts = [];
          if (r.wall !== o.wall) parts.push(`sitzt jetzt ${WAN2[r.wall]}`);
          if (a.dx && r.wall === o.wall) { const mv = r.s - o.s; parts.push(mv === 0 ? 'geht nicht weiter – die Wand ist zu Ende' : `${Math.abs(mv)} cm nach ${mv < 0 ? 'links' : 'rechts'} gerückt`); }
          if (r.w !== o.w) parts.push(`jetzt ${mtr(r.w)} m breit`);
          if ((a.center || a.s != null) && !a.dx && r.wall === o.wall) parts.push(`beginnt jetzt bei ${mtr(r.s)} m`);
          did(1, `${OPN2[a.t]}: ${parts.join(', ') || 'unverändert'}.`);
        }
        else if (a.k === 'cx') {
          const sp = E.sink(), wall = a.wall || (a.t === 'wasser' ? (sp && sp.wall) : ((E.cook() || {}).wall)) || 'N', r = E.cx(a.t, wall, a.s);
          const nm = a.t === 'wasser' ? 'Wasseranschluss' : 'Herdanschluss';
          did(1, `${nm} ${WAN2[r.wall]} bei ${mtr(r.s)} m eingetragen` + (r.moved ? (a.t === 'wasser' ? ' – die Spüle ist mitgerückt.' : ' – das Kochfeld ist mitgerückt.') : r.msg ? ` – ${r.msg}` : '.'));
        }
        else if (a.k === 'sinkTo' || a.k === 'cookTo') {
          const nm = a.k === 'sinkTo' ? 'Spüle' : 'Kochfeld', cur0 = a.k === 'sinkTo' ? E.sink() : E.cook(); if (!cur0) { did(0, `Es ist noch keine ${nm} geplant.`); continue; }
          let wall = cur0.wall, s0 = cur0.s;
          if (a.ref === 'fenster') { const ws = E.walls(), f = E.ops().filter(o => o.t === 'fenster' && ws.includes(o.wall)).sort((p, q) => (p.wall === cur0.wall ? 0 : 1) - (q.wall === cur0.wall ? 0 : 1))[0]; if (!f) { did(0, 'An den Küchenwänden ist kein Fenster.'); continue; } wall = f.wall; s0 = f.s + f.w / 2; }
          else { if (a.wall) { wall = a.wall; s0 = E.len(wall) / 2; } if (a.s != null) s0 = a.s; if (a.dx) s0 = cur0.s + a.dx; }
          const r = a.k === 'sinkTo' ? E.sinkTo(wall, s0) : E.cookTo(wall, s0);
          if (r.same) did(0, `Die ${nm} sitzt schon dort.`); else if (r.ok) did(1, `${nm} ${a.ref === 'fenster' ? 'sitzt jetzt unter dem Fenster' : 'ist verschoben'}${r.dist > 40 ? ` – so nah, wie es passt (${Math.round(r.dist)} cm daneben)` : ''}.`); else did(0, r.msg || `Die ${nm} passt dort nicht hin.`);
        }
      } catch (e) { did(0, 'Diese Änderung hat leider nicht geklappt.'); }
    }
    if (st) {
      try { const h = location.hash.slice(1), o = h.startsWith('k=') ? JSON.parse(unb64(h.slice(2))) : null; if (o) { o.s = buildStyle(st, current()); KP.applyPlan(o); did(1, 'Farben und Stil angepasst: ' + st.got.filter(g => !/^(Küchenzeile|L-Küche|U-Küche|Zweizeil|Küche mit|Kochinsel)/.test(g)).slice(0, 5).join(', ') + '.'); } } catch (e) { did(0, 'Der Stil ließ sich nicht übernehmen.'); }
    }
    try { sessionStorage.setItem('kpai-used', '1'); } catch (e) { }
    ov_.querySelector('[data-dl]').innerHTML = out.map(x => `<li class="${x.ok ? 'ok' : 'no'}"><i>${x.ok ? '✓' : '!'}</i>${esc(x.msg)}</li>`).join('');
    ov_.querySelector('[data-kpai-undo]').hidden = !editMark;
    ov_.querySelector('[data-dfine]').textContent = mode === 'edit' ? 'Alles bleibt im Planer frei veränderbar – jeder Schritt lässt sich rückgängig machen.' : 'Das klang nach einer Änderung – darum wurde Ihr aktueller Entwurf angepasst statt neu geplant. Für einen ganz neuen Entwurf oben „Neu planen“ wählen.';
    show('done');
  }
  function undoEdits() {
    let ok = false; if (/^#k=/.test(editBefore) && window.KP && KP.applyPlan) { try { KP.applyPlan(unb64(editBefore.slice(3))); ok = true; } catch (e) { ok = false; } }
    if (!ok) return;
    editMark = 0; ov_.querySelector('[data-dl]').innerHTML = '<li class="ok"><i>✓</i>Änderungen zurückgenommen.</li>'; ov_.querySelector('[data-kpai-undo]').hidden = true;
  }

  /* ================= 7) Einhängen ================= */
  function inject() {
    const root = document.querySelector('[data-kp]'); if (!root || root.dataset.kpai) return; root.dataset.kpai = '1';
    // Knopf im Kopf
    const hr = root.querySelector('.kp-hr');
    if (hr) { const b = document.createElement('button'); b.type = 'button'; b.className = 'kpai-hb'; b.setAttribute('aria-label', 'KI plant Ihre Küche'); b.innerHTML = `${ICO.spark}<span>KI-Planung</span>`; b.addEventListener('click', () => open()); hr.insertBefore(b, hr.firstChild); }
    // Karte in Schritt 1
    const pane = root.querySelectorAll('[data-kpane]')[0];
    if (pane) {
      const c = document.createElement('div'); c.className = 'kpai-card';
      c.innerHTML = `<div class="kpai-ci">${ICO.spark}</div><div class="kpai-ct"><b>KI plant Ihre Küche</b><span>Raum und Wünsche in eigenen Worten beschreiben – oder einfach einsprechen. Sekunden später steht Ihr Entwurf, Sie verfeinern nur noch.</span><div class="kpai-cb"><button type="button" class="kpai-btn sm">${ICO.spark}<span>Jetzt beschreiben</span></button><button type="button" class="kpai-cmic" aria-label="Küche einsprechen">${ICO.mic}<span>Einsprechen</span></button></div></div>`;
      c.querySelector('.kpai-btn').addEventListener('click', () => open());
      c.querySelector('.kpai-cmic').addEventListener('click', () => open('', null, { listen: true }));
      const forms = pane.querySelector('[data-kp-forms]');
      if (forms && forms.parentNode === pane) pane.insertBefore(c, forms); else pane.insertBefore(c, pane.firstChild);
    }
    document.addEventListener('click', e => { const t = e.target.closest('[data-kpai-open]'); if (t) { e.preventDefault(); open(); } });
    // nach dem Neuladen
    let info = null; try { info = JSON.parse(sessionStorage.getItem('kpai-after') || 'null'); sessionStorage.removeItem('kpai-after'); } catch (e) { }
    if (info && Date.now() - info.t < 120000) {
      const top = () => { const L = window.__lenis || window.lenis; if (L && L.scrollTo) try { L.scrollTo(0, { immediate: true }); } catch (e) { } scrollTo(0, 0); };
      top(); setTimeout(() => { top(); done(info); toForm(info.text); }, 700); setTimeout(() => { try { history.scrollRestoration = 'auto'; } catch (e) { } }, 2500);
    }
    if (/[?&]ki=1/.test(location.search)) setTimeout(() => open(), 500);
  }
  function boot() { let n = 0; (function wait() { if (window.KP || n++ > 60) inject(); else setTimeout(wait, 100); })(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // Für Tests und Erweiterungen
  window.KPAI = { open, close, parseEdit, normText, room: () => rc, _dbg: { sinkToWater, generateBest, generate, score, briefFromRC, valid, fitRow, usableOf, warnN, spans }, parse: (t) => parse(t, current()), local: (t) => localPlan(t, current()), repair: (raw, t) => { const c = current(); return repair(raw, parse(t || '', c), c); }, valid, svg: planSvg, b64, hook: HOOK };
})();
