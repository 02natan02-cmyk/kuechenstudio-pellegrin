/* Küchenplaner „Ziehen & Planen" – Entwurf Falcon Eye
   Form wählen, Schränke in die Wand ziehen, Stil antippen, absenden. Live in 3D – mit beweglichen Türen und eigenem Raumfoto. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('[data-kp]'); if (!root) return;
  const RMO = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D_ = root.dataset, LOGO = D_.logo ? Object.assign(new Image(), { src: D_.logo }) : null, MAIL = D_.mail, WA = D_.wa, STUDIO = D_.studio || 'Küchenstudio', GREET = D_.greet || 'Hallo', ACC = D_.acc || '#c0673f', PERSON = D_.person || 'Wir';
  const VER = (((document.currentScript && document.currentScript.src) || '').split('v=')[1] || '6').replace(/[^\w.-]/g, '');

  /* ---------------- Bausteine ---------------- */
  // h: b = Unterschrank, t = Hochschrank, u = Hängeschrank · hs: wählbare Höhen (cm) · hinge: Türanschlag wählbar · corner: sitzt in der Ecke
  const HT = [145, 195, 216, 230], HU = [36, 54, 72, 90, 108], W30 = [30, 40, 45, 50, 60], WALL = [30, 40, 45, 50, 60, 80, 90, 100, 120];
  // Aufsatzschrank auf Hochschränken (Höhe in cm) – nur was unter die Decke passt (Raumhöhe 260)
  const AX = [36, 54, 72], AXMAX = 258;
  const M = {
    us: { n: 'Unterschrank', s: 'Schubladen', v: '3 Schubladen', w: 60, ws: WALL, h: 'b' },
    ut: { n: 'Unterschrank', s: 'mit Tür', v: 'Schublade + Tür', w: 60, ws: W30, h: 'b', hinge: 1 },
    u1: { n: 'Unterschrank', s: 'Tür', v: 'Tür', w: 50, ws: W30, h: 'b', hinge: 1 },
    u2: { n: 'Unterschrank', s: '2 Türen', v: '2 Türen', w: 80, ws: [60, 70, 80, 90, 100, 120], h: 'b' },
    s2: { n: 'Unterschrank', s: '2 große Auszüge', v: '2 große Auszüge', w: 60, ws: WALL, h: 'b' },
    s4: { n: 'Unterschrank', s: '4 Schubladen', v: '4 Schubladen', w: 60, ws: WALL, h: 'b' },
    ui: { n: 'Unterschrank', s: 'Auszüge mit Innenschubladen', v: 'Innenschubladen', w: 80, ws: [30, 40, 45, 50, 60, 80, 90, 100, 120], h: 'b' },
    ur: { n: 'Offenes Regal', s: 'unten, ohne Front', w: 30, ws: [15, 20, 30, 40, 45, 50, 60], h: 'b' },
    fa: { n: 'Flaschenauszug', s: 'schmal, für Öl & Flaschen', w: 20, ws: [15, 20, 30], h: 'b' },
    ap: { n: 'Apothekerschrank klein', s: 'Unterschrank-Auszug', w: 30, ws: [15, 20, 30, 40], h: 'b' },
    mt: { n: 'Mülltrenner', s: 'Auszug mit Eimern', w: 60, ws: [30, 40, 45, 50, 60, 80, 90], h: 'b' },
    sp: { n: 'Spüle', s: 'mit Armatur', w: 80, ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'b' },
    kf: { n: 'Kochfeld', s: 'Auszüge darunter', w: 80, ws: [60, 80, 90, 100, 120], h: 'b' },
    ko: { n: 'Herd', s: 'Kochfeld + Backofen', w: 60, ws: [60, 90], h: 'b' },
    gs: { n: 'Spülmaschine', s: 'vollintegriert', w: 60, ws: [45, 60], h: 'b' },
    ek: { n: 'Eckschrank', s: 'mit Karussell', w: 90, ws: [90], h: 'b', corner: 1 },
    el: { n: 'Eckschrank', s: 'Le-Mans-Auszug', w: 110, ws: [100, 110, 120], h: 'b', corner: 1, hinge: 1 },
    eb: { n: 'Eckschrank', s: 'Blindecke', w: 100, ws: [90, 100, 110, 120], h: 'b', corner: 1, hinge: 1 },
    bo: { n: 'Backofen', s: 'auf Augenhöhe', w: 60, ws: [60], h: 't', hs: HT },
    bm: { n: 'Geräte-Hochschrank', s: 'Backofen + Mikrowelle', w: 60, ws: [60], h: 't', hs: [195, 216, 230] },
    kue: { n: 'Kühlschrank', s: 'Kühl-Gefrier-Kombi', w: 60, ws: [60], h: 't', hs: [195, 216, 230], hinge: 1, a: 'r' },
    vo: { n: 'Hochschrank', s: 'Vorrat', w: 60, ws: W30, h: 't', hs: HT, hinge: 1 },
    ah: { n: 'Apothekerschrank groß', s: 'Hochschrank-Auszug', w: 30, ws: [15, 20, 30, 40, 45], h: 't', hs: HT },
    bs: { n: 'Besenschrank', s: 'für Staubsauger & Co.', w: 50, ws: W30, h: 't', hs: [195, 216, 230], hinge: 1 },
    vg: { n: 'Vitrinenschrank', s: 'hoch, oben mit Glastür', v: 'Glastür oben', w: 60, ws: [40, 45, 50, 60], h: 't', hs: HT, hinge: 1 },
    h1: { n: 'Hängeschrank', s: 'Tür', v: 'Tür', w: 60, ws: W30, h: 'u', hs: HU, hinge: 1 },
    h2: { n: 'Hängeschrank', s: '2 Türen', v: '2 Türen', w: 80, ws: [60, 80, 90, 100, 120], h: 'u', hs: HU },
    hk: { n: 'Hängeschrank', s: 'Klappe kippt nach oben', v: 'Klappe kippt nach oben', w: 60, ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'u', hs: [36, 54, 72, 90] },
    hs: { n: 'Hängeschrank', s: 'Klappe schwenkt ganz hoch', v: 'Klappe schwenkt ganz hoch', w: 60, ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'u', hs: [36, 54, 72] },
    hf: { n: 'Hängeschrank', s: 'Klappe knickt in der Mitte', v: 'Faltklappe – knickt in der Mitte', w: 80, ws: [60, 80, 90, 100, 120], h: 'u', hs: [72, 90] },
    hg: { n: 'Glasvitrine', s: 'Hängeschrank mit Glastür', v: 'Glastür', w: 50, ws: [40, 45, 50, 60, 80, 90, 100, 120], h: 'u', hs: HU, hinge: 1 },
    ho: { n: 'Wandregal', s: 'offen', v: 'offen', w: 60, ws: WALL, h: 'u', hs: HU },
    wb: { n: 'Wandboard', s: 'Bretter statt Hängeschrank', v: 'Bretter', w: 90, ws: [60, 80, 90, 100, 120, 150, 180], h: 'u', hs: [30, 60, 90] },
    he: { n: 'Eck-Hängeschrank', s: 'mit Drehboden', w: 65, ws: [55, 60, 65, 70, 80], h: 'u', hs: HU, hinge: 1, a: 'r' },
    dh: { n: 'Dunstabzug', s: 'Wandhaube', w: 90, ws: [60, 90, 120], h: 'u' },
  };
  const CATS = [['unten', 'Unten'], ['geraete', 'Spüle & Herd'], ['ecke', 'Ecke'], ['oben', 'Oben'], ['hoch', 'Hoch']];
  const CATH = { unten: 'Unterschränke unter der Arbeitsplatte. Antippen oder in die Wand ziehen – Breite und Türanschlag danach in der Wand antippen.', geraete: 'Spüle, Kochfeld, Herd und Spülmaschine – mit passenden Schränken darunter.', ecke: 'Eckschränke setzen sich automatisch in die Ecke einer L- oder U-Küche und nutzen den Platz hinter der Ecke.', oben: 'Hängeschränke hängen über der Arbeitsplatte. Antippen oder genau an die Stelle ziehen – Höhe 36 bis 90 cm, mit Tür, Klappe, Glas oder als Eckschrank.', hoch: 'Hochschränke vom Boden bis oben. Nach dem Einsetzen antippen: Höhe 145 bis 230 cm, Türanschlag und ein Aufsatzschrank obendrauf – bis unter die Decke.' };
  const PAL = [
    ['unten', 'us', 0, '3 Schubladen', 'Unterschrank'], ['unten', 's2', 0, '2 Auszüge', 'Unterschrank'], ['unten', 's4', 0, '4 Schubladen', 'Unterschrank'], ['unten', 'ut', 0, 'Schublade + Tür', 'Unterschrank'],
    ['unten', 'u1', { a: 'l' }, 'Tür links', 'öffnet nach links'], ['unten', 'u1', { a: 'r' }, 'Tür rechts', 'öffnet nach rechts'], ['unten', 'u2', 0, '2 Türen', 'Unterschrank'], ['unten', 'ui', 0, 'Innen\u00adschubladen', 'Auszüge mit Innenschub'],
    ['unten', 'mt', 0, 'Mülltrenner', 'Auszug mit Eimern'], ['unten', 'ap', 0, 'Apotheker klein', 'schmaler Auszug'], ['unten', 'fa', 0, 'Flaschen\u00adauszug', '15–30 cm schmal'], ['unten', 'ur', 0, 'Offenes Regal', 'ohne Front'],
    ['geraete', 'sp'], ['geraete', 'kf'], ['geraete', 'ko'], ['geraete', 'gs'],
    ['ecke', 'ek', 0, 'Karussell', 'Eckschrank 90 × 90'], ['ecke', 'el', 0, 'Le-Mans', 'Eckschrank-Auszug'], ['ecke', 'eb', 0, 'Blindecke', 'Eckschrank mit Boden'],
    ['oben', 'h1', { a: 'l' }, 'Tür links', 'öffnet nach links'], ['oben', 'h1', { a: 'r' }, 'Tür rechts', 'öffnet nach rechts'], ['oben', 'hk', 0, 'Klappe – kippt nach oben', 'oben angeschlagen'], ['oben', 'hs', 0, 'Klappe – schwenkt ganz hoch', 'hebt sich über den Schrank'], ['oben', 'hf', 0, 'Klappe – knickt in der Mitte', 'Faltklappe, 72 oder 90 cm hoch'], ['oben', 'h2', 0, '2 Türen', 'Hängeschrank'], ['oben', 'he', 0, 'Eck-Hänge\u00adschrank', 'mit Drehboden'], ['oben', 'hg', 0, 'Glasvitrine', 'mit Glastür'], ['oben', 'ho', 0, 'Wandregal', 'offen'], ['oben', 'wb', 0, 'Wandboard', 'Bretter statt Hängeschrank'], ['oben', 'dh', 0, 'Dunstabzug', 'Wandhaube'],
    ['hoch', 'kue'], ['hoch', 'bo'], ['hoch', 'bm', 0, 'Backofen + Mikro', 'Geräte-Hochschrank'], ['hoch', 'vo'], ['hoch', 'vg', 0, 'Vitrine hoch', 'oben Glastür'], ['hoch', 'ah', 0, 'Apotheker groß', 'Hochschrank-Auszug'], ['hoch', 'bs', 0, 'Besen\u00adschrank'],
  ].map(([c, t, o, n, s], i) => ({ k: 'p' + i, c, t, o: o || null, n: n || M[t].n, s: s || M[t].s }));
  const PLAIN = ['us', 's2', 's4', 'ut', 'u1', 'u2', 'ui'];
  const PLK = [['us', '3 Schubl.'], ['s2', '2 Auszüge'], ['s4', '4 Schubl.'], ['ut', 'Schubl. + Tür'], ['u1', 'Tür'], ['u2', '2 Türen'], ['ui', 'Innenschubl.']];
  const UPK = [['h1', 'Tür'], ['h2', '2 Türen'], ['hk', 'Klappe kippt'], ['hs', 'Klappe ganz hoch'], ['hf', 'Klappe knickt'], ['hg', 'Glas'], ['ho', 'Offen'], ['wb', 'Wandboard'], ['he', 'Ecke']];
  const TLK = [['vo', 'Vorrat'], ['vg', 'Vitrine'], ['ah', 'Apotheker'], ['bs', 'Besen']];
  const FORMS = {
    zeile: { n: 'Küchenzeile', walls: ['N'], d: 'Alles an einer Wand', p: 'M6 6h52v10H6z' },
    l: { n: 'L-Küche', walls: ['W', 'N'], d: 'Über Eck', p: 'M6 6h52v10H16v28H6z' },
    u: { n: 'U-Küche', walls: ['W', 'N', 'E'], d: 'Drei Seiten', p: 'M6 6h52v28H48V16H16v18H6z' },
    zwei: { n: 'Zweizeilig', walls: ['N', 'S'], d: 'Zwei gegenüber', p: 'M6 6h52v10H6zM6 30h52v10H6z' },
    insel: { n: 'Mit Insel', walls: ['N'], island: 1, d: 'Zeile + Kochinsel', p: 'M6 6h52v10H6zM18 26h28v10H18z' },
  };
  const WN = { N: 'Hintere Wand', W: 'Linke Wand', E: 'Rechte Wand', S: 'Wand gegenüber' };
  // „an der …“ für Meldungen – „Rückwand“ meint im Planer nur die Küchenrückwand über der Arbeitsplatte
  const WAN = { N: 'an der hinteren Wand', W: 'an der linken Wand', E: 'an der rechten Wand', S: 'an der Wand gegenüber' };
  // Farbwelten (17.10.): Kunden wählen nach Gefühl, nicht nach Hersteller. Jede Welt hat ihre Töne und eine
  // stimmige Kombination (Arbeitsplatte, Griffe, Wand, Boden). Die Herstellerzuordnung geht nur verdeckt als Hinweis mit der Anfrage ans Studio.
  const WORLDS = [
    { k: 'hell', n: 'Hell & freundlich', d: 'Weiß, Kreide, Creme', m: 'Licht und zeitlos – macht jeden Raum größer.', c: [['Weiß', '#f1eee8'], ['Kreide', '#e9e4da'], ['Creme', '#ece3cf'], ['Seidengrau', '#dad6cd']], pair: { top: 'eiche', handle: 'schwarz', wall: '#f3efe9', floor: 'eiche' } },
    { k: 'natur', n: 'Natürlich & warm', d: 'Sand, Kaschmir, Taupe', m: 'Weich und gemütlich – wie Leinen und warmer Sand.', c: [['Sand', '#dccdb3'], ['Kaschmir', '#d9cfbf'], ['Sandgrau', '#cfc8bc'], ['Macchiato', '#bba58c'], ['Taupe', '#968777']], pair: { top: 'eiche', handle: 'gold', wall: '#e6dccb', floor: 'eiche' } },
    { k: 'gruen', n: 'Grün & ruhig', d: 'Salbei, Olive, Eukalyptus', m: 'Natur im Haus – beruhigt und passt zu Holz und Messing.', c: [['Eukalyptus', '#a1ae9d'], ['Schilf', '#b6b398'], ['Salbei', '#7f8e77'], ['Olive', '#6c6945'], ['Tannengrün', '#37453a']], pair: { top: 'eiche', handle: 'gold', wall: '#f3efe9', floor: 'eiche' } },
    { k: 'blau', n: 'Blau & klar', d: 'Taubenblau, Fjord, Nacht', m: 'Frisch und nordisch – mit heller Platte besonders edel.', c: [['Taubenblau', '#98a9b5'], ['Steinblau', '#6d7e8b'], ['Fjordblau', '#53687a'], ['Nachtblau', '#22304a']], pair: { top: 'keramik', handle: 'gold', wall: '#f3efe9', floor: 'hell' } },
    { k: 'tief', n: 'Tief & elegant', d: 'Graphit, Coffee, Schwarz', m: 'Dunkel und edel – mit Stein und Licht ein Statement.', c: [['Graphit', '#45474b'], ['Schwarzgrün', '#2c3530'], ['Coffee', '#56443a'], ['Schwarz', '#232426']], pair: { top: 'marmor', handle: 'grifflos', wall: '#e6dccb', floor: 'eiche' } },
    { k: 'holz', n: 'Holz pur', d: 'Eiche, Nussbaum', m: 'Echte Wärme – jede Front ein Unikat.', c: [['Eiche', 'wood:eiche'], ['Nussbaum', 'wood:nuss']], pair: { top: 'keramik', handle: 'schwarz', wall: '#f3efe9', floor: 'grau' } },
  ];
  const FRONTS = WORLDS.flatMap(w => w.c);
  // Verdeckter Studio-Hinweis: nächster Herstellerton (Namen aus Herstellerunterlagen 2024–2026, Farbwerte geschätzt → „am Muster prüfen“).
  // Welche Marken: data-herst am Planer (z. B. nobilia, Nolte, Schüller). Ohne Angabe nur Farbname + HEX.
  const HERST = { nobilia: [['Weiß', '#f2f1ec'], ['Sand', '#d8cab1'], ['Macchiato', '#c2ad94'], ['Taupegrau', '#a2988c'], ['Steingrau', '#8b8d89'], ['Coffee', '#5b493c'], ['Schilf', '#b7b496'], ['Olive', '#6e6b46'], ['Steinblau', '#6f7d88'], ['Fjordblau', '#54687a'], ['Schwarz', '#262627']],
    nolte: [['Weiß softmatt', '#f1f0eb'], ['Magnolia', '#ece4d3'], ['Avocado', '#7e8b64'], ['Quarzgrau', '#7c7e7f'], ['Schwarzgrün', '#2c3530']],
    schueller: [['Kristallweiß matt', '#f3f3f0'], ['Muschelweiß matt', '#ebe5d8'], ['Kaschmirbraun', '#b8a58f'], ['Kieselgrau', '#b3afa7'], ['Sandgelb', '#d8c38e'], ['Eukalyptusgrün', '#8fa293'], ['Stahlblau', '#6f8597'], ['Tiefblau matt', '#26344a'], ['Sepiabraun', '#6c5443'], ['Orientrot', '#9a3b2f'], ['Lavaschwarz matt', '#2a2a2b']] };
  const HERSTN = { nobilia: 'nobilia', nolte: 'Nolte', schueller: 'Schüller' };
  const HERSTWOOD = { eiche: 'Holzdekore zum Beispiel Nolte „MANHATTAN Eiche Cognac“, Schüller „Eiche Skagen“', nuss: 'Nussbaum: passendes Holzdekor im Studio wählen' };
  const labC = h => { const L = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v > .04045 ? Math.pow((v + .055) / 1.055, 2.4) : v / 12.92); const f = t => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; const x = f((L[0] * .4124 + L[1] * .3576 + L[2] * .1805) / .95047), y = f(L[0] * .2126 + L[1] * .7152 + L[2] * .0722), z = f((L[0] * .0193 + L[1] * .1192 + L[2] * .9505) / 1.08883); return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
  const dE = (a, b) => { const p = labC(a), q = labC(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  const isHex = v => /^#[0-9a-f]{6}$/i.test(v || '');
  const lch = h => { const [L, a, b] = labC(h); return [L, Math.hypot(a, b), (Math.atan2(b, a) * 180 / Math.PI + 360) % 360]; };
  // Wunschfarbe → deutscher Farbname (nach Farbton/Helligkeit/Buntheit im Lab-Raum), z. B. #B04A3A → „Ziegelrot“
  const TN = [
    [22, [[34, 20, 'Weinrot'], [34, 0, 'Mahagoni'], [60, 46, 'Himbeerrot'], [60, 0, 'Altrosa'], [101, 12, 'Rosa'], [101, 0, 'Puderrosa']]],
    [47, [[34, 22, 'Bordeaux'], [34, 0, 'Mahagoni'], [57, 58, 'Signalrot'], [57, 30, 'Ziegelrot'], [57, 0, 'Altrosa'], [74, 30, 'Koralle'], [74, 0, 'Altrosa'], [101, 22, 'Lachs'], [101, 0, 'Puderrosa']]],
    [57, [[30, 0, 'Mokka'], [46, 30, 'Kupferbraun'], [46, 0, 'Nussbraun'], [64, 40, 'Terrakotta'], [64, 22, 'Cognac'], [64, 0, 'Taupe'], [78, 48, 'Orange'], [101, 22, 'Apricot'], [101, 10, 'Sand'], [101, 0, 'Kaschmir']]],
    [76, [[30, 0, 'Mokka'], [48, 28, 'Nussbraun'], [48, 0, 'Mokka'], [56, 40, 'Cognac'], [56, 0, 'Taupe'], [72, 52, 'Orange'], [72, 24, 'Karamell'], [72, 0, 'Macchiato'], [101, 30, 'Apricot'], [101, 12, 'Sand'], [101, 0, 'Kaschmir']]],
    [100, [[38, 0, 'Bronze'], [62, 40, 'Ocker'], [62, 0, 'Khaki'], [80, 54, 'Senfgelb'], [80, 36, 'Ocker'], [80, 0, 'Sand'], [101, 58, 'Sonnengelb'], [101, 20, 'Vanille'], [101, 11, 'Sand'], [101, 0, 'Creme']]],
    [128, [[38, 0, 'Dunkeloliv'], [62, 16, 'Olivgrün'], [62, 0, 'Schilfgrün'], [92, 42, 'Lindgrün'], [92, 22, 'Pistazie'], [92, 0, 'Schilf'], [101, 0, 'Vanille']]],
    [175, [[36, 0, 'Tannengrün'], [58, 34, 'Smaragdgrün'], [58, 0, 'Salbeigrün'], [80, 36, 'Maigrün'], [80, 0, 'Salbei'], [101, 40, 'Hellgrün'], [101, 14, 'Mint'], [101, 0, 'Eukalyptus']]],
    [225, [[40, 0, 'Petrol'], [64, 20, 'Türkis'], [64, 0, 'Graupetrol'], [101, 22, 'Aqua'], [101, 0, 'Eisgrün']]],
    [303, [[30, 0, 'Nachtblau'], [50, 45, 'Königsblau'], [50, 11, 'Fjordblau'], [50, 0, 'Schieferblau'], [60, 24, 'Himmelblau'], [60, 0, 'Steinblau'], [74, 26, 'Himmelblau'], [74, 0, 'Taubenblau'], [101, 20, 'Hellblau'], [101, 0, 'Eisblau']]],
    [318, [[34, 0, 'Indigo'], [60, 40, 'Violett'], [60, 0, 'Pflaume'], [101, 45, 'Lila'], [101, 0, 'Lavendel']]],
    [340, [[34, 0, 'Aubergine'], [60, 40, 'Violett'], [60, 0, 'Pflaume'], [101, 45, 'Orchidee'], [101, 0, 'Flieder']]],
    [361, [[34, 0, 'Brombeere'], [60, 46, 'Magenta'], [60, 0, 'Beere'], [101, 40, 'Pink'], [101, 12, 'Rosa'], [101, 0, 'Puderrosa']]],
  ];
  function toneName(hex) {
    const [L, C, H] = lch(hex);
    if (C < 6.5) return L >= 93 ? 'Weiß' : L >= 82 ? 'Lichtgrau' : L >= 64 ? 'Hellgrau' : L >= 44 ? 'Steingrau' : L >= 24 ? 'Anthrazit' : 'Schwarz';
    if (C < 13 && H >= 22 && H < 110) return L >= 88 ? 'Creme' : L >= 74 ? 'Kaschmir' : L >= 56 ? 'Greige' : L >= 38 ? 'Taupe' : L >= 24 ? 'Mokka' : 'Schwarzbraun';
    if (C < 8 && H >= 110 && H < 225) return L >= 76 ? 'Grüngrau' : L >= 45 ? 'Salbeigrau' : L >= 24 ? 'Schwarzgrün' : 'Schwarz';
    const band = TN.find(b => (H >= 300 && H < 312 && L < 40 ? 302 : H) < b[0])[1];
    return (band.find(r => L < r[0] && C >= r[1]) || band[band.length - 1])[2];
  }
  // Name einer Wunschfarbe: fast gleich einem Planer-Ton → dessen Name, sonst beschreibender Farbname
  const wishName = hex => { const n = FRONTS.filter(x => !x[1].startsWith('wood')).concat(ALLC).reduce((b, x) => dE(x[1], hex) < dE(b[1], hex) ? x : b); return dE(n[1], hex) < 6 ? n[0] : toneName(hex); };
  const worldOf = st => st.wood ? 'holz' : (WORLDS.find(w => w.c.some(c => c[1] === st.front)) || { k: 'wunsch' }).k;
  const frontName = st => { const f = FRONTS.find(x => st.wood ? x[1] === 'wood:' + st.wood : x[1] === st.front); if (f) return f[0]; return isHex(st.front) ? `Wunschfarbe „${wishName(st.front)}“ ${st.front.toUpperCase()}` : 'Wunschfarbe'; };
  const frontShort = st => st.wood ? (st.wood === 'nuss' ? 'Nussbaum' : 'Eiche') : ((FRONTS.find(x => x[1] === st.front) || [])[0] || (isHex(st.front) ? wishName(st.front) : 'Weiß'));
  // Stimmige Kombination: Farbwelt-Paar, bei Wunschfarben nach Helligkeit und Farbton
  const pairOf = st => { const W = WORLDS.find(w => w.k === worldOf(st)); if (W) return W.pair; const [L, C, H] = lch(isHex(st.front) ? st.front : '#f1eee8');
    if (C < 10) return (L > 80 ? WORLDS[0] : L > 45 ? WORLDS[1] : WORLDS[4]).pair;
    if (L < 32) return { top: 'keramik', handle: 'gold', wall: '#f3efe9', floor: 'eiche' };
    if (H >= 110 && H < 200) return WORLDS[2].pair; if (H >= 200 && H < 312) return WORLDS[3].pair;
    return L < 58 ? { top: 'keramik', handle: 'gold', wall: '#f3efe9', floor: 'eiche' } : { top: 'eiche', handle: 'schwarz', wall: '#f3efe9', floor: 'eiche' }; };
  // Alle Farben: Farbfächer mit 12 Farbfamilien × zart/sanft/kräftig/tief + Neutraltöne
  const FAN = [
    ['Rot', [['Rosenholz', '#e6c3be'], ['Altrot', '#c98a83'], ['Signalrot', '#b8352e'], ['Bordeaux', '#6b2229']]],
    ['Koralle', [['Pfirsich', '#f0cdb8'], ['Koralle', '#e08e74'], ['Ziegelrot', '#b5543a'], ['Rost', '#7a3523']]],
    ['Orange', [['Apricot', '#f2d3ab'], ['Karamell', '#d79b5e'], ['Orange', '#d9752b'], ['Cognac', '#8a4f26']]],
    ['Gelb', [['Vanille', '#f2e5b5'], ['Sonnengelb', '#e8c766'], ['Senfgelb', '#c99a2e'], ['Ocker', '#8c6a22']]],
    ['Oliv', [['Lindgrün', '#e0e2b3'], ['Pistazie', '#bcc48a'], ['Olivgrün', '#8a8d3e'], ['Moosgrün', '#4f5530']]],
    ['Grün', [['Blassgrün', '#cfe0c5'], ['Wiesengrün', '#9fb594'], ['Grasgrün', '#5d8c4a'], ['Waldgrün', '#2f4a34']]],
    ['Jade', [['Mint', '#cde7da'], ['Jade', '#84bba2'], ['Smaragd', '#2f8a68'], ['Flaschengrün', '#1e4a3c']]],
    ['Petrol', [['Aqua', '#c7e4e4'], ['Türkis', '#6fb3b2'], ['Petrol', '#23727a'], ['Tiefpetrol', '#1b4549']]],
    ['Blau', [['Himmelblau', '#cddff0'], ['Hellblau', '#8fb4d6'], ['Königsblau', '#2f5ea8'], ['Marineblau', '#1f2f55']]],
    ['Indigo', [['Lavendelblau', '#d3d3ee'], ['Kornblume', '#8e95cf'], ['Ultramarin', '#3c3f9a'], ['Indigo', '#272657']]],
    ['Lila', [['Flieder', '#e2d2ea'], ['Lavendel', '#b49bc8'], ['Violett', '#7b4a9e'], ['Aubergine', '#3f2440']]],
    ['Rosa', [['Puderrosa', '#f2d4dc'], ['Rosa', '#e7a6bb'], ['Pink', '#d0517f'], ['Beere', '#7a2a4b']]],
  ];
  const NEUT = [['Weiß', '#f4f2ed'], ['Creme', '#efe6d2'], ['Kaschmir', '#ddd2c0'], ['Sand', '#d8c8ac'], ['Greige', '#b8ada0'], ['Taupe', '#8f8275'], ['Mokka', '#5a463b'], ['Lichtgrau', '#d8d8d5'], ['Steingrau', '#9a9a96'], ['Schiefer', '#64686b'], ['Anthrazit', '#3a3d40'], ['Schwarz', '#1f1f21']];
  const ALLC = FAN.flatMap(f => f[1]).concat(NEUT);
  // RAL-Classic-Töne (Richtwerte am Bildschirm, Originalfächer gilt) – für Kunden als neutraler Farbcode, fürs Studio als Lack-Vorlage
  const RAL = ('1000 Grünbeige cdba88|1001 Beige d0b084|1002 Sandgelb d2aa6d|1003 Signalgelb f9a800|1004 Goldgelb e49e00|1011 Braunbeige af8050|1013 Perlweiß e3d9c6|1014 Elfenbein ddc49a|1015 Hellelfenbein e6d2b5|1018 Zinkgelb faca30|1019 Graubeige a48f7a|1020 Olivgelb a08f65|1021 Rapsgelb f6b600|1024 Ockergelb ba8f4c|1032 Ginstergelb e2a300|1034 Pastellgelb eda459|' +
    '2000 Gelborange da6e00|2001 Rotorange ba481b|2003 Pastellorange f67828|2004 Reinorange e25303|2010 Signalorange d4652f|2011 Tieforange e26e0e|2012 Lachsorange d5654d|' +
    '3000 Feuerrot a72920|3002 Karminrot 9b2321|3003 Rubinrot 861a22|3004 Purpurrot 6b1c23|3005 Weinrot 59191f|3007 Schwarzrot 3e2022|3009 Oxidrot 6d342d|3011 Braunrot 792423|3012 Beigerot c6846d|3013 Tomatenrot 972e25|3014 Altrosa cb7375|3015 Hellrosa d8a0a6|3016 Korallenrot a63d2f|3017 Rosé cb555d|3018 Erdbeerrot c73f4a|3020 Verkehrsrot bb1e10|3022 Lachsrot cf6955|3027 Himbeerrot b42041|3031 Orientrot a52c33|' +
    '4001 Rotlila 816183|4002 Rotviolett 8d3c4b|4003 Erikaviolett c4618c|4004 Bordeauxviolett 651e38|4005 Blaulila 76689a|4006 Verkehrspurpur 903373|4007 Purpurviolett 47243c|4008 Signalviolett 844c82|4009 Pastellviolett 9d8692|4010 Telemagenta bc4077|' +
    '5000 Violettblau 384c70|5001 Grünblau 1f4764|5002 Ultramarinblau 2b2c7c|5003 Saphirblau 2a3756|5004 Schwarzblau 1d1f2a|5005 Signalblau 154889|5007 Brillantblau 41678d|5008 Graublau 313c48|5009 Azurblau 2e5978|5010 Enzianblau 13447c|5011 Stahlblau 232c3f|5012 Lichtblau 3481b8|5013 Kobaltblau 232d53|5014 Taubenblau 6c7c98|5015 Himmelblau 2874b2|5018 Türkisblau 0e929f|5020 Ozeanblau 1d4a54|5021 Wasserblau 00737a|5023 Fernblau 4d668e|5024 Pastellblau 6a93b0|' +
    '6000 Patinagrün 3c7460|6002 Laubgrün 325928|6003 Olivgrün 50533c|6004 Blaugrün 024442|6005 Moosgrün 114232|6007 Flaschengrün 2f3a2f|6009 Tannengrün 26392f|6011 Resedagrün 68825b|6013 Schilfgrün 7d765a|6017 Maigrün 4c8f35|6018 Gelbgrün 57a639|6019 Weißgrün b9ceac|6021 Blassgrün 8a9977|6024 Verkehrsgrün 008351|6026 Opalgrün 005d52|6027 Lichtgrün 7ebab5|6028 Kieferngrün 2d5546|6029 Minzgrün 006f3d|6033 Minttürkis 3f888f|6034 Pastelltürkis 7aadac|' +
    '7000 Fehgrau 7e8b92|7001 Silbergrau 8f999f|7004 Signalgrau 9ea0a1|7006 Beigegrau 6e6559|7011 Eisengrau 52595d|7012 Basaltgrau 575d5e|7015 Schiefergrau 51565c|7016 Anthrazitgrau 383e42|7021 Schwarzgrau 2f3234|7022 Umbragrau 4b4d46|7024 Graphitgrau 474a50|7030 Steingrau 939388|7032 Kieselgrau b9b9a8|7035 Lichtgrau cbd0cc|7036 Platingrau 9a9697|7037 Staubgrau 7a7b7a|7038 Achatgrau b4b8b0|7039 Quarzgrau 6b665e|7040 Fenstergrau 9da3a6|7044 Seidengrau cac4b0|7047 Telegrau 4 d0d0d0|' +
    '8001 Ockerbraun 955f20|8002 Signalbraun 6c3b2a|8003 Lehmbraun 734222|8004 Kupferbraun 8e402a|8007 Rehbraun 6f4a2f|8011 Nussbraun 5a3826|8014 Sepiabraun 4a3526|8016 Mahagonibraun 4c2b20|8017 Schokoladenbraun 44322d|8019 Graubraun 3f3a3a|8024 Beigebraun 79553c|8025 Blassbraun 755847|8028 Terrabraun 4e3b2b|' +
    '9001 Cremeweiß e9e0d2|9002 Grauweiß d7d5cb|9003 Signalweiß ecece7|9005 Tiefschwarz 0e0e10|9010 Reinweiß f1ece1|9011 Graphitschwarz 27292b|9016 Verkehrsweiß f1f0ea|9018 Papyrusweiß cfd3cd').split('|').map(x => { const [n, nm, h] = x.split(' '); return [n, nm, '#' + h]; });
  const ralNear = hex => { let b = RAL[0], d = 1e9; RAL.forEach(r => { const e = dE(r[2], hex); if (e < d) { d = e; b = r; } }); return [b, d]; };
  const nearW = d => d < 5 ? 'fast gleich' : d < 12 ? 'ähnlich' : d < 22 ? 'entfernt ähnlich' : 'nur grob';
  // LCh → HEX (Gegenstück zu labC, außerhalb des Bildschirm-Farbraums wird geklemmt)
  const lch2hex = (L, C, H) => { const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180), fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200, iv = t => t * t * t > .008856 ? t * t * t : (t - 16 / 116) / 7.787;
    const X = iv(fx) * .95047, Y = iv(fy), Z = iv(fz) * 1.08883, g = v => { v = v > .0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - .055 : 12.92 * v; return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0'); };
    return '#' + g(3.2406 * X - 1.5372 * Y - .4986 * Z) + g(-.9689 * X + 1.8758 * Y + .0415 * Z) + g(.0557 * X - .2040 * Y + 1.0570 * Z); };
  // Studio-Hinweis zur Frontfarbe: je Marke der nächste Serienton mit Abstand, dazu der nächste RAL-Ton – nur in der Anfrage, nicht auf der Seite
  function herstHint(st) {
    const el = document.querySelector('[data-kp]'), list = String((el && el.dataset.herst) || '').split(',').map(x => x.trim().toLowerCase()).filter(x => HERST[x]);
    if (st.wood) return list.length ? HERSTWOOD[st.wood] || '' : '';
    if (!/^#[0-9a-f]{6}$/i.test(st.front || '')) return '';
    const [r, rd] = ralNear(st.front), ral = `RAL ${r[0]} ${r[1]} (${nearW(rd)})`;
    if (!list.length) return `${ral} · Farbwert ${st.front.toUpperCase()}`;
    return list.map(b => { const best = HERST[b].reduce((x, y) => dE(y[1], st.front) < dE(x[1], st.front) ? y : x), d = dE(best[1], st.front); return d < 22 ? `${HERSTN[b]} „${best[0]}“ (${nearW(d)})` : `${HERSTN[b]}: kein naher Serienton – Lack nach RAL/Muster (am nächsten „${best[0]}“)`; }).join(' · ') + ` · ${ral} · Farbwert ${st.front.toUpperCase()}`;
  }
  const HANDLES = [['grifflos', 'Grifflos'], ['bar', 'Edelstahl'], ['schwarz', 'Schwarz'], ['gold', 'Messing'], ['knopf', 'Knopf']];
  const TOPS = [['eiche', 'Eiche', '#b98a5c'], ['keramik', 'Stein hell', '#e7e4de'], ['beton', 'Beton', '#9b9893'], ['marmor', 'Marmor dunkel', '#1d1d1f']];
  const WOOD = { eiche: '#c39a6b', nuss: '#76553b' };
  const FINISHES = [['matt', 'Matt'], ['seide', 'Seidenmatt'], ['glanz', 'Hochglanz']];
  const FSTY = [['0', 'Glatt'], ['1', 'Rahmen (Landhaus)']];
  // Ausgangsstile (Schritt 1) – setzen alle Stilwerte auf einmal
  const LOOKS = [
    ['modern', 'Grifflos modern', 'Sandgrau matt, Eiche, ohne Griffe', { front: '#cfc8bc', wood: null, handle: 'grifflos', top: 'eiche', finish: 'matt', frame: 0, back: 'platte', wall: '#f3efe9', floor: 'hell' }],
    ['landhaus', 'Modernes Landhaus', 'Rahmenfronten Salbei, Messinggriffe, Holzplatte', { front: '#7f8e77', wood: null, handle: 'gold', top: 'eiche', finish: 'matt', frame: 1, back: 'fliese', wall: '#e6dccb', floor: 'eiche' }],
    ['dunkel', 'Elegant dunkel', 'Schwarz matt, dunkle Steinplatte, Eiche-Akzente', { front: '#232426', wood: null, handle: 'grifflos', top: 'marmor', finish: 'matt', frame: 0, back: 'platte', wall: '#e6dccb', floor: 'eiche' }],
    ['skandi', 'Skandinavisch hell', 'Weiß seidenmatt, helles Holz, schwarze Griffe', { front: '#f1eee8', wood: null, handle: 'schwarz', top: 'eiche', finish: 'seide', frame: 0, back: 'wand', wall: '#f3efe9', floor: 'eiche' }],
  ];
  const BACKS = [['wand', 'Wandfarbe'], ['platte', 'Wie Arbeitsplatte'], ['fliese', 'Metro-Fliesen'], ['glas', 'Glas in Frontfarbe']];
  const WALLC = [['Kalkweiß', '#f3efe9'], ['Sand', '#e6dccb'], ['Salbeigrau', '#d3d7cb'], ['Taubenblau', '#cdd5de'], ['Terrakotta', '#e2c2ab'], ['Anthrazit', '#5a5c5f']];
  const FLOORS = [['eiche', 'Eiche hell', '#c9a77f'], ['dunkel', 'Holz dunkel', '#5c4330'], ['hell', 'Fliese hell', '#e8e4dd'], ['grau', 'Fliese grau', '#a7a49f']];
  const OPN = { fenster: 'Fenster', balkon: 'Balkontür', tuer: 'Tür' };
  const OPW = { fenster: [50, 60, 80, 100, 120, 140, 160, 180, 200, 240], balkon: [80, 100, 120, 160, 200, 240], tuer: [80, 90, 100, 110, 125, 140, 160, 180] };
  const HCOL = { bar: '#b9bcbf', schwarz: '#141414', gold: '#b08a4a', knopf: '#a4a8ac' };
  // Ausstattung (antippen in 3D/Wandansicht oder Schritt 3) – Standard jeweils zuerst
  const SINKS = [['edel', 'Edelstahl', '#c9cccf'], ['gschwarz', 'Granit Schwarz', '#1f1f21'], ['ganth', 'Granit Anthrazit', '#56585b'], ['gweiss', 'Granit Creme', '#e6e0d3'], ['kweiss', 'Keramik Weiß', '#f7f6f2']];
  const TAPS = [['chrom', 'Chrom', '#d9dde0'], ['edel', 'Edelstahl gebürstet', '#b4b7b9'], ['schwarz', 'Schwarz matt', '#1b1b1c'], ['gold', 'Messing gebürstet', '#b8925a']];
  const HOBW = [60, 70, 80, 90];
  const HOBV = [['normal', 'Normal'], ['dd', 'Mit Muldenlüfter']];
  const HOODS = [['schraeg', 'Schräghaube', 'kopffrei, schräg'], ['esse', 'Pyramiden-Esse', 'klassisch an der Wand'], ['flach', 'Flachschirm', 'im Hängeschrank versteckt'], ['decke', 'Deckenlüfter', 'flach in der Decke']];
  const IHOODS = [['mulde', 'Muldenlüfter', 'im Kochfeld'], ['insel', 'Inselhaube', 'hängt über der Insel'], ['decke', 'Deckenlüfter', 'flach in der Decke']];
  const backLit = () => { const b = P && P.style && P.style.back; return b === 'glas' || (b === 'motiv' && (P.style.motivMat || 'glas') === 'glas'); };
  const BACKS2 = [['wand', 'Keine', 'Wandfarbe'], ['glas', 'Glas', 'glänzend, Farbe frei'], ['dibond', 'Dibond', 'matt, Farbe frei'], ['holz', 'Holz', 'Eiche oder Nuss'], ['fliese', 'Fliese', 'Metro-Fliesen'], ['platte', 'Stein', 'wie die Arbeitsplatte'], ['motiv', 'Eigenes Motiv', 'Ihr Foto auf Glas oder Dibond']];
  const BACKC = [['Frontfarbe', ''], ['Weiß', '#f4f2ee'], ['Sand', '#d8cbb6'], ['Salbei', '#8d9b84'], ['Petrol', '#2f5d62'], ['Nachtblau', '#25324a'], ['Terrakotta', '#b8694a'], ['Anthrazit', '#3b3d40'], ['Schwarz', '#151516']];
  const BACKW = [['eiche', 'Eiche', '#c39a6b'], ['nuss', 'Nussbaum', '#76553b']];
  const eqv = (k, d) => (P && P.style && P.style[k]) || d;
  const nm = (L, k) => (L.find(x => x[0] === k) || L[0])[1];
  const sinkCol = () => (SINKS.find(x => x[0] === eqv('sink', 'edel')) || SINKS[0])[2];
  const tapCol = () => (TAPS.find(x => x[0] === eqv('tap', 'chrom')) || TAPS[0])[2];
  const isDD = () => eqv('hobV', 'normal') === 'dd';
  let koWhy = 0;
  // Eine Wandhaube (Schräghaube, Esse, Flachschirm) hängt nie vor einem Fenster oder einer Tür – genau wie die Hängeschränke.
  // Frei davon sind nur der Deckenlüfter (in der Decke) und der Muldenlüfter (im Kochfeld).
  const wallHood = () => !isDD() && eqv('hood', 'schraeg') !== 'decke';
  const hoodW = m => eqv('hood') === 'flach' ? m.w : Math.min(90, Math.max(60, m.w));
  const opAt = (w, s, width) => P.op.find(o => o.wall === w && s + width > o.s + .5 && o.s + o.w > s + .5);
  const backCol = () => P.style.backC || (P.style.wood ? '#2a2420' : P.style.front);
  // eigenes Motiv: bleibt nur im Browser (Speicher + localStorage), wird nie hochgeladen
  let motif = null, motSend = true; // Canvas (max. 1600 px) · motSend: geht mit der Anfrage mit (Schritt 4 abwählbar)
  const motifToSend = () => (P && P.style && P.style.back === 'motiv' && motif && motif._url && motSend) ? motif : null;
  try { const d = localStorage.getItem('kp-motiv'); if (d) { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); c._url = d; motif = c; if (P && P.style.back === 'motiv') { renderWalls(); schedule3D(); syncUI(); } }; im.src = d; } } catch (e) { }

  /* ---------------- Zustand ---------------- */
  // Modul: {id, t, w, h?, a?} · Hängeschrank (frei platziert): {id, t, s (cm ab Wandanfang), w, h?, a?}
  let P = null, uid = 1;
  const HDEF = t => M[t].h === 't' ? 216 : M[t].h === 'u' ? 72 : 0;
  const mk = (t, w, o) => { const m = { id: uid++, t, w: w || M[t].w }; if (o && o.h && M[t].hs && M[t].hs.includes(+o.h)) m.h = +o.h; if (o && (o.a === 'l' || o.a === 'r') && M[t].hinge) m.a = o.a; if (o && o.ax && M[t].h === 't' && AX.includes(+o.ax)) m.ax = +o.ax; if (o) { const ok = { axo: ['klappe', 'zwei', 'l', 'r'], tu: ['tuer', 'schub'], g2: ['micro', 'steam', 'klappe'], to: ['tuer', 'klappe'], led: [0, 1] }; for (const k in ok) if (o[k] != null && ok[k].includes(o[k])) m[k] = o[k]; } return m; };
  const hOf = m => (M[m.t].hs && m.h) || HDEF(m.t);
  const axOf = m => (M[m.t].h === 't' && m.ax && hOf(m) + m.ax + ((P && P.ah || 90) - 90) <= AXMAX) ? m.ax : 0;   // Aufsatzschrank (cm), 0 = keiner
  const axFront = (m, ax) => { const o = m.axo || (ax <= 40 ? 'klappe' : m.w > 60 ? 'zwei' : (m.a || 'r')); if (o === 'klappe') return [{ k: 'flap', p: 1 }]; if (o === 'zwei') return [{ k: 'door2', p: 1 }]; return [{ k: 'door', p: 1, a: o, hp: 'bottom' }]; };
  const isUp = t => M[t].h === 'u';
  function fresh(form, keep) {
    const f = FORMS[form], old = keep || {};
    const room = old.room || { w: 480, d: form === 'insel' ? 420 : form === 'zwei' ? 300 : 380 };
    if (form === 'insel' && room.d < 380) room.d = 420;
    const p = { ah: (old && old.ah) || (P && P.ah) || 90, form, room, rows: {}, up: {}, top: {}, op: [], cx: (old.cx || []).map(c => ({ ...c })), island: { w: 180, v: 'kochfeld' }, style: old.style || { front: '#f1eee8', wood: null, handle: 'grifflos', top: 'eiche', finish: 'matt', wall: '#f3efe9', floor: 'eiche' } };
    f.walls.forEach(w => { p.rows[w] = []; p.top[w] = w === 'N' || form === 'zwei' ? 1 : 0; });
    const seq = {
      zeile: { N: [['kue'], ['bo'], ['us'], ['kf'], ['us', 80], ['sp'], ['gs']] },
      l: { W: [['kue'], ['bo'], ['us']], N: [['el', 110], ['kf'], ['us'], ['sp'], ['gs']] },
      u: { W: [['kue'], ['bo'], ['us']], N: [['ek', 90], ['sp'], ['gs'], ['us', 60], ['eb', 100]], E: [['us'], ['kf'], ['us']] },
      zwei: { N: [['kue'], ['bo'], ['us'], ['sp'], ['gs']], S: [['us'], ['kf'], ['us', 80]] },
      insel: { N: [['kue'], ['bo'], ['vo'], ['us'], ['sp'], ['gs']] },
    }[form];
    P = p;
    for (const w in seq) seq[w].forEach(([t, wd]) => P.rows[w].push(mk(t, wd)));
    if (P.rows.N) { fillRest('N'); normCorners(); }
    for (const w in seq) if (w !== 'N') fillRest(w);
    const sp = locate('N', P.rows.N.findIndex(m => m.t === 'sp'));
    const L = wallLen('N'), win = { id: uid++, t: 'fenster', wall: 'N', w: 120, s: 0, y0: 125 }; win.s = clampOp(win, sp ? sp.x0 + sp.w / 2 - 60 : L / 2 - 60);
    P.op = [win, defaultDoor()];
    return P;
  }
  const wallLen = w => (w === 'N' || w === 'S') ? P.room.w : P.room.d;
  const hasCornerSlot = side => !!P.rows.N && FORMS[P.form].walls.includes(side === 'l' ? 'W' : 'E');
  function range(w) {
    const L = wallLen(w), N = P.rows.N || [], hasN = !!P.rows.N;
    if (w === 'W') return [0, L - (hasN ? 60 + (N[0] && N[0].t === 'ek' ? 30 : 0) : 0)];
    if (w === 'E') return [hasN ? 60 + (N.length && N[N.length - 1].t === 'ek' && hasCornerSlot('r') ? 30 : 0) : 0, L];
    return [0, L];
  }
  const used = w => P.rows[w].reduce((a, m) => a + m.w, 0);
  const free = w => { const [a, b] = range(w); return b - a - used(w); };
  function fillRest(w) { let f = free(w); const R = [120, 100, 90, 80, 60, 50, 45, 40, 30]; while (f >= 30) { const x = R.find(v => v <= f); P.rows[w].push(mk('us', x)); f -= x; } }
  // Ecken: Die Zeile liegt immer an der Ecke an – freier Platz wandert ans offene Ende (bzw. vor den Eckschrank, wenn beide Enden Ecken sind)
  const cornerAt = (w, end) => end ? (w === 'N' && !!P.rows.E && hasCornerSlot('r')) || (w === 'W' && !!P.rows.N) : (w === 'N' && !!P.rows.W && hasCornerSlot('l')) || (w === 'E' && !!P.rows.N);
  function layout(w, skipId) {
    const rows = P.rows[w] || [], [a, b] = range(w), list = rows.filter(m => m.id !== skipId), n = list.length, fr = b - a - list.reduce((t, m) => t + m.w, 0);
    let gi = n; if (fr > .5) { const cs = cornerAt(w, 0), ce = cornerAt(w, 1); if (ce && !cs) gi = 0; else if (ce && cs && n) gi = n - 1; }
    const X = new Map(); let x = a, gx = null; list.forEach((m, i) => { if (i === gi && fr > .5) { gx = x; x += fr; } X.set(m, x); x += m.w; }); if (gx == null && fr > .5) gx = x;
    return { X, gi, n, fr, gx, inner: fr > .5 && ((gi > 0 && gi < n) || (gi === n && cornerAt(w, 1)) || (gi === 0 && cornerAt(w, 0))) };
  }
  // Passstücke & Wangen (automatisch): Restmaß unter 30 cm am Wandende / zwischen den Ecken → Passstück (Höhe wie der Nachbar);
  // freistehendes Zeilenende (≥ 30 cm frei) → Seitenwange, 2 cm vor der Front
  const gripEnd = () => P.style.handle === 'grifflos' && P.style.gripEnd === 'leiste';
  function trims(w) {
    const LY = layout(w), rows = P.rows[w] || [], out = { pf: [], wg: [] }; if (!rows.length || LY.fr <= .5) return out;
    const n = rows.length, at0 = LY.gi === 0, nb = LY.inner ? rows[Math.min(n - 1, LY.gi)] : at0 ? rows[0] : rows[n - 1], tall = M[nb.t].h === 't' && !LY.inner;
    if (LY.fr < 30 || LY.inner) out.pf.push({ x: LY.gx, w: LY.fr, tall, h: tall ? hOf(nb) : 0, where: LY.inner ? 'zwischen den Ecken' : 'am Wandende' });
    else if (M[nb.t].h !== 't') out.wg.push({ x: at0 ? LY.X.get(nb) - 2.5 : LY.X.get(nb) + nb.w, side: at0 ? 'links' : 'rechts' });
    return out;
  }
  const xs = w => { const L = layout(w); return (P.rows[w] || []).map(m => L.X.get(m)); };
  function locate(w, i) { if (!P.rows[w] || i < 0 || i >= P.rows[w].length) return null; return { x0: xs(w)[i], w: P.rows[w][i].w }; }
  const clampOp = (o, s) => { const m = o.t === 'fenster' ? 10 : 5; return Math.round(Math.max(m, Math.min(wallLen(o.wall) - o.w - m, s)) / 5) * 5; };
  const opById = id => P.op.find(o => o.id === id);
  /* Fenster & Türen im Detail: Art, Flügel, Anschlag (Seite der Bänder, Blick von innen), Öffnungsrichtung, Brüstung/Höhe */
  const OPK = { fenster: [['dk', 'Dreh-Kipp'], ['d', 'Dreh'], ['kipp', 'Nur Kipp'], ['fest', 'Fest verglast']], balkon: [['dk', 'Dreh-Kipp'], ['d', 'Dreh'], ['hs', 'Hebe-Schiebe']], tuer: [['dreh', 'Drehtür'], ['schiebe', 'Schiebetür']] };
  const opFl = o => o.fl || (o.t === 'tuer' ? 1 : o.w > 90 ? 2 : 1);
  const opA = o => o.a || (o.t === 'tuer' ? 'r' : 'l');
  const opK = o => o.k || (o.t === 'tuer' ? 'dreh' : 'dk');
  const opDir = o => o.t === 'tuer' && opK(o) === 'dreh' ? (o.dir || 'in') : 'in';
  const opY = o => o.t === 'fenster' ? (o.y0 != null ? o.y0 : 105) : o.t === 'balkon' ? 2 : 0;
  const opHH = o => o.t === 'fenster' ? (o.hh || 115) : o.t === 'balkon' ? 216 : 205;
  const opSlide = o => opK(o) === 'schiebe' || opK(o) === 'hs';
  const opSwings = o => !(opK(o) === 'fest' || opK(o) === 'kipp' || opSlide(o));
  // Flügel entlang der Wand: h = Bandseite, l = Schlossseite, r = Flügelbreite
  const opWings = o => opFl(o) === 2 ? [{ h: o.s, l: o.s + o.w / 2, r: o.w / 2 }, { h: o.s + o.w, l: o.s + o.w / 2, r: o.w / 2 }] : [opA(o) === 'l' ? { h: o.s, l: o.s + o.w, r: o.w } : { h: o.s + o.w, l: o.s, r: o.w }];
  const opDesc = o => { const k = (OPK[o.t].find(x => x[0] === opK(o)) || OPK[o.t][0])[1], fl = opFl(o); let d = `${fl === 2 ? '2-flügelig' : '1-flügelig'} ${k}`; if (fl === 1 && !(opK(o) === 'fest' || opK(o) === 'kipp')) d += opSlide(o) ? `, schiebt nach ${opA(o) === 'l' ? 'links' : 'rechts'}` : `, Anschlag ${opA(o) === 'l' ? 'links' : 'rechts'}`; if (o.t === 'tuer' && !opSlide(o)) d += opDir(o) === 'out' ? ', öffnet nach außen' : ', öffnet in die Küche'; if (o.t === 'fenster') d += `, Brüstung ${opY(o)} cm, Höhe ${opHH(o)} cm`; return d; };
  /* Anschlüsse im Raum: Wasser, Herd 400 V, Steckdose (1-/2-/3-fach, waagerecht/senkrecht), Abluft (Ø), Heizkörper.
     Position = Mitte, ab linker Wandkante (Blick auf die Wand) · Höhe = Mitte über Fußboden (Heizkörper: Bodenabstand + Höhe) */
  const CXN = { wasser: 'Wasseranschluss', herd: 'Herdanschluss 400 V', dose: 'Steckdose', abluft: 'Abluft-Durchbruch', heiz: 'Heizkörper' }, CXS = { wasser: 'Wasser', herd: 'Herd 400 V', dose: 'Steckdose', abluft: 'Abluft', heiz: 'Heizung' };
  const CXC = { wasser: '#2f7fc1', herd: '#d0582a', dose: '#6d6459', abluft: '#3f8f87', heiz: '#b4467e' };
  // Steckdosen-Bereiche wie beim Elektriker (Mitte über Fußboden); „Arbeitsplatte“ folgt der Arbeitshöhe
  const DZ = [['sockel', 'Sockel', 15, 'hinter der Sockelblende'], ['unter', 'Unterschrank', 35, 'hinter dem Unterschrank – Spülmaschine, Geräte'], ['ap', 'Arbeitsplatte', null, 'über der Arbeitsplatte'], ['hoch', 'Hochschrank', 195, 'im Hochschrank über Kühlschrank oder Mikrowelle'], ['haube', 'Haube', 220, 'hinter der Haube, im Kamin verdeckt'], ['haenge', 'Über Hängeschrank', 230, 'über den Hängeschränken – fürs Licht']];
  const AZ = [['haube', 'Über der Haube', 230], ['decke', 'Unter der Decke', 245], ['sockel', 'Im Sockel', 12]];
  const ADS = [100, 125, 150, 160];
  const CXLIM = { dose: [8, 250], wasser: [20, 120], herd: [20, 150], abluft: [8, 252] };
  const zH = z => { const d = DZ.find(x => x[0] === z); return !d ? null : d[2] == null ? (P.ah || 90) + 20 : d[2]; };
  const hzY = c => c.y0 != null ? c.y0 : 10, hzH = c => c.hh || 60, hzW = c => c.hw || 100;
  const cxN = c => c.n || 2, cxO = c => c.o || 'h', cxD = c => c.d || 150;
  const cxDefH = c => c.t === 'dose' ? zH(c.z || 'ap') : c.t === 'wasser' ? 55 : c.t === 'herd' ? 50 : c.t === 'abluft' ? (AZ.find(x => x[0] === (c.z || 'haube')) || AZ[0])[2] : 50;
  const cxH = c => c.t === 'heiz' ? hzY(c) + hzH(c) / 2 : (c.h != null ? c.h : cxDefH(c));
  const cxZone = c => c.t === 'dose' ? (c.h == null ? (DZ.find(x => x[0] === (c.z || 'ap')) || DZ[2])[1] : 'freie Höhe') : c.t === 'abluft' ? (c.h == null ? (AZ.find(x => x[0] === (c.z || 'haube')) || AZ[0])[1] : 'freie Höhe') : '';
  const cxSpec = c => c.t === 'dose' ? `${cxN(c)}-fach ${cxO(c) === 'v' ? 'senkrecht' : 'waagerecht'}` : c.t === 'abluft' ? `Ø ${cxD(c)} mm` : c.t === 'heiz' ? `${hzW(c)} × ${hzH(c)} cm, ${hzY(c)} cm über dem Boden` : '';
  const cxById = id => (P.cx || []).find(c => c.id === id);
  const clampCx = (c, s) => { const m = c.t === 'heiz' ? Math.ceil(hzW(c) / 2) + 2 : 8; return Math.max(m, Math.min(wallLen(c.wall) - m, Math.round(s))); };
  // Höhe setzen (Heizkörper: Bodenabstand) – in der Nähe eines Bereichs rastet sie dort ein
  function setCxH(c, v, snap) {
    if (c.t === 'heiz') { c.y0 = Math.max(0, Math.min(200 - hzH(c), Math.round(v / 5) * 5)); return; }
    const [lo, hi] = CXLIM[c.t]; v = Math.max(lo, Math.min(hi, Math.round(v / 5) * 5));
    if (snap) { const Z = c.t === 'dose' ? DZ.map(z => [z[0], zH(z[0])]) : c.t === 'abluft' ? AZ.map(z => [z[0], z[2]]) : []; const hit = Z.find(([, h]) => Math.abs(h - v) <= 4); if (hit) { c.z = hit[0]; delete c.h; return; } }
    c.h = v; if (c.t === 'dose' || c.t === 'abluft') delete c.z;
  }
  let selCx = null;
  const n2 = v => Math.round(v * 100) / 100;
  function cxSym(c, x, y, r, on) {
    const col = CXC[c.t] || '#6d6459';
    let i = '';
    if (c.t === 'wasser') i = `<path d="M${n2(x)} ${n2(y - r * .6)}c${n2(r * .36)} ${n2(r * .44)} ${n2(r * .46)} ${n2(r * .66)} ${n2(r * .46)} ${n2(r * .92)}a${n2(r * .46)} ${n2(r * .46)} 0 0 1 ${n2(-r * .92)} 0c0 ${n2(-r * .26)} ${n2(r * .1)} ${n2(-r * .48)} ${n2(r * .46)} ${n2(-r * .92)}z" fill="#fff"/>`;
    else if (c.t === 'herd') i = `<path d="M${n2(x + r * .14)} ${n2(y - r * .64)}l${n2(-r * .52)} ${n2(r * .74)}h${n2(r * .4)}l${n2(-r * .14)} ${n2(r * .54)}l${n2(r * .52)} ${n2(-r * .74)}h${n2(-r * .4)}z" fill="#fff"/>`;
    else if (c.t === 'abluft') i = [-.38, 0, .38].map(k => `<path d="M${n2(x - r * .55)} ${n2(y + k * r)}q${n2(r * .28)} ${n2(-r * .22)} ${n2(r * .55)} 0t${n2(r * .55)} 0" fill="none" stroke="#fff" stroke-width="${n2(r * .13)}" stroke-linecap="round"/>`).join('');
    else if (c.t === 'heiz') i = [-.36, 0, .36].map(k => `<rect x="${n2(x + k * r - r * .1)}" y="${n2(y - r * .5)}" width="${n2(r * .2)}" height="${n2(r)}" rx="${n2(r * .08)}" fill="#fff"/>`).join('');
    else i = `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r * .62)}" fill="none" stroke="#fff" stroke-width="${n2(r * .13)}"/><circle cx="${n2(x - r * .27)}" cy="${n2(y)}" r="${n2(r * .13)}" fill="#fff"/><circle cx="${n2(x + r * .27)}" cy="${n2(y)}" r="${n2(r * .13)}" fill="#fff"/>${cxN(c) > 1 ? `<circle cx="${n2(x + r * .78)}" cy="${n2(y - r * .78)}" r="${n2(r * .46)}" fill="#fff" stroke="${col}" stroke-width="${n2(r * .1)}"/><text x="${n2(x + r * .78)}" y="${n2(y - r * .78 + r * .2)}" font-size="${n2(r * .6)}" font-weight="800" text-anchor="middle" fill="${col}" font-family="system-ui">${cxN(c)}</text>` : ''}`;
    return `${on ? `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r * 1.6)}" fill="none" stroke="${ACC}" stroke-width="${n2(r * .2)}" stroke-dasharray="${n2(r * .5)} ${n2(r * .32)}"/>` : ''}<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="${col}" stroke="#fff" stroke-width="${n2(r * .16)}"${c.neu ? ` stroke-dasharray="${n2(r * .4)} ${n2(r * .22)}"` : ''}/>${i}`;
  }
  // Wandansicht: Steckdosen maßstäblich (8 × 8 cm je Dose, Raster 7,1 cm), Abluft mit echtem Durchmesser, Heizkörper in echter Größe
  function cxWall(c, on) {
    const x = c.s, y = FL - cxH(c), col = CXC[c.t]; let g = '', lab = CXS[c.t], top = y - 10.5, hit = `<circle cx="${x}" cy="${n2(y)}" r="14" fill="transparent"/>`;
    const ring = (x0, y0, w, h) => on ? `<rect x="${n2(x0 - 3)}" y="${n2(y0 - 3)}" width="${n2(w + 6)}" height="${n2(h + 6)}" rx="2" fill="none" stroke="${ACC}" stroke-width="1" stroke-dasharray="2.4 1.6"/>` : '';
    if (c.t === 'dose') {
      const n = cxN(c), v = cxO(c) === 'v', u = 7.1, W = v ? 8 : 8 + u * (n - 1), Hh = v ? 8 + u * (n - 1) : 8, x0 = x - W / 2, y0 = y - Hh / 2;
      g += ring(x0, y0, W, Hh) + `<rect x="${n2(x0)}" y="${n2(y0)}" width="${n2(W)}" height="${n2(Hh)}" rx="1.2" fill="#fbfaf7" stroke="${col}" stroke-width=".7"${c.neu ? ' stroke-dasharray="1.6 1"' : ''}/>`;
      for (let i = 0; i < n; i++) { const px = v ? x : x0 + 4 + i * u, py = v ? y0 + 4 + i * u : y; g += `<circle cx="${n2(px)}" cy="${n2(py)}" r="2.6" fill="#efebe4" stroke="${col}" stroke-width=".45"/><circle cx="${n2(px - .9)}" cy="${n2(py)}" r=".45" fill="${col}"/><circle cx="${n2(px + .9)}" cy="${n2(py)}" r=".45" fill="${col}"/>`; }
      lab = n > 1 ? `${n}× Steckdose` : 'Steckdose'; top = y0 - 3.5; hit = `<rect x="${n2(x0 - 8)}" y="${n2(y0 - 8)}" width="${n2(W + 16)}" height="${n2(Hh + 16)}" fill="transparent"/>`;
    } else if (c.t === 'abluft') {
      const r = cxD(c) / 20; g += ring(x - r, y - r, 2 * r, 2 * r) + `<circle cx="${x}" cy="${n2(y)}" r="${n2(r)}" fill="#e6efed" stroke="${col}" stroke-width=".9"${c.neu ? ' stroke-dasharray="2 1.2"' : ''}/>` + [-.5, 0, .5].map(k => `<line x1="${n2(x - r * .8)}" y1="${n2(y + k * r)}" x2="${n2(x + r * .8)}" y2="${n2(y + k * r)}" stroke="${col}" stroke-width=".55"/>`).join('');
      lab = `Abluft Ø ${cxD(c)}`; top = y - r - 3.5; hit = `<circle cx="${x}" cy="${n2(y)}" r="${n2(Math.max(14, r + 6))}" fill="transparent"/>`;
    } else if (c.t === 'heiz') {
      const w = hzW(c), h = hzH(c), x0 = x - w / 2, y0 = FL - hzY(c) - h;
      g += ring(x0, y0, w, h) + `<rect x="${n2(x0)}" y="${n2(y0)}" width="${w}" height="${h}" rx="1.5" fill="#f4f2f0" stroke="${col}" stroke-width=".8"${c.neu ? ' stroke-dasharray="2.4 1.4"' : ''}/>`;
      for (let k = x0 + 4; k < x0 + w - 2; k += 4) g += `<line x1="${n2(k)}" y1="${n2(y0 + 2)}" x2="${n2(k)}" y2="${n2(y0 + h - 2)}" stroke="#ddd6cf" stroke-width=".8"/>`;
      g += `<rect x="${n2(x0 + w - 5)}" y="${n2(y0 - 3.5)}" width="3" height="3.5" rx=".6" fill="#bdb7b0"/>`; lab = `Heizkörper ${w} × ${h}`; top = y0 - 5; hit = `<rect x="${n2(x0)}" y="${n2(y0)}" width="${w}" height="${h}" fill="transparent"/>`;
    } else g = cxSym(c, x, y, 6.5, on);
    const ht = on ? `<text x="${x}" y="${n2(c.t === 'heiz' ? FL - hzY(c) + 8 : y + (c.t === 'abluft' ? cxD(c) / 20 : 6.5) + 9)}" font-size="5.6" font-weight="700" text-anchor="middle" fill="${ACC}" font-family="system-ui" paint-order="stroke" stroke="#fff" stroke-width="2">${c.t === 'heiz' ? `${hzY(c)} cm über Boden` : `${Math.round(cxH(c))} cm hoch`}</text>` : '';
    return `<g data-cx="${c.id}" class="kp-cx" style="cursor:move">${g}<text x="${x}" y="${n2(top)}" font-size="6.2" font-weight="700" text-anchor="middle" fill="#3d3832" font-family="system-ui" paint-order="stroke" stroke="#fff" stroke-width="2.2">${lab}${c.neu ? ' · neu' : ''}</text>${ht}${hit}</g>`;
  }
  function defaultDoor() { const dw = ['E', 'S', 'W'].find(w => !P.rows[w]) || 'S'; return { id: uid++, t: 'tuer', wall: dw, w: 90, s: Math.max(20, Math.round(wallLen(dw) / 2 - 45)) }; }
  const opOver = (o, x0, w, pad = 2) => x0 + w > o.s + pad && x0 < o.s + o.w - pad;
  const ov = (s1, w1, s2, w2) => s1 + w1 > s2 + .5 && s2 + w2 > s1 + .5;
  // Ecke: auf welcher Seite sitzt das Modul in der Ecke? (nur Rückwand bei L/U)
  function cornerSide(w, i) { if (w !== 'N' || !P.rows.N) return null; const n = P.rows.N.length; if (i === 0 && hasCornerSlot('l')) return 'l'; if (i === n - 1 && hasCornerSlot('r')) return 'r'; return null; }
  const aOf = (m, cs) => m.a || m._aa || M[m.t].a || (M[m.t].corner ? (cs === 'r' ? 'l' : 'r') : 'l');
  // Türanschlag automatisch sinnvoll, solange er nicht von Hand gewählt ist: Hochschränke und Kühlschrank öffnen weg von der
  // Arbeitsfläche (man stellt direkt daneben ab), Unterschränke zur Wand bzw. zum Hochschrank hin – die offene Tür steht nie im Weg.
  function autoHinges() {
    for (const w in P.rows) {
      const r = P.rows[w], n = r.length, LY = layout(w), [a, b] = range(w), tall = x => !!x && M[x.t].h === 't', base = x => !!x && M[x.t].h === 'b';
      r.forEach((m, i) => {
        delete m._aa; if (m.a || !M[m.t].hinge || M[m.t].corner) return;
        const x0 = LY.X.get(m), atL = i === 0 && x0 - a < 1, atR = i === n - 1 && x0 + m.w > b - 1;
        if (M[m.t].h === 't') { const lw = r.slice(0, i).some(base), rw = r.slice(i + 1).some(base); m._aa = lw && !rw ? 'r' : rw && !lw ? 'l' : atL && !atR ? 'l' : atR && !atL ? 'r' : undefined; }
        else m._aa = tall(r[i - 1]) || (atL && !tall(r[i + 1])) ? 'l' : tall(r[i + 1]) || atR ? 'r' : undefined;
        if (!m._aa) delete m._aa;
      });
    }
  }
  // Eckschränke bleiben in der Ecke
  function normCorners() {
    const N = P.rows.N; if (!N) return [];
    const drop = [];
    for (const w in P.rows) if (w !== 'N') { const c = P.rows[w].filter(m => M[m.t].corner); if (c.length) { P.rows[w] = P.rows[w].filter(m => !M[m.t].corner); N.push(...c); } }
    const cs = P.rows.N.filter(m => M[m.t].corner); if (!cs.length) return drop;
    const rest = P.rows.N.filter(m => !M[m.t].corner), slot = { l: null, r: null }, n = P.rows.N.length;
    cs.forEach(m => { const i = P.rows.N.indexOf(m), pref = (i === n - 1 && n > 1 && hasCornerSlot('r')) || !hasCornerSlot('l') ? 'r' : 'l', alt = pref === 'l' ? 'r' : 'l'; if (!slot[pref] && hasCornerSlot(pref)) slot[pref] = m; else if (!slot[alt] && hasCornerSlot(alt)) slot[alt] = m; else drop.push(m); });
    P.rows.N = [...(slot.l ? [slot.l] : []), ...rest, ...(slot.r ? [slot.r] : [])];
    return drop;
  }
  // Hängeschränke über Eck: Lücke zwischen Seitenwand-Hängeschrank und dem Hängeschrank der Rückwand mit Passblende schließen
  function upCornerFill(w) {
    if ((w !== 'W' && w !== 'E') || !P.rows.N || !P.rows[w]) return null;
    const L = wallLen(w), [a, b] = range(w), side = upList(w).filter(u => u.t !== 'dh'), back = upList('N').filter(u => u.t !== 'dh'), WN0 = P.room.w;
    if (w === 'W') { const u = side.find(q => q.s + q.w >= b - 1 && q.s + q.w < L - 35 - 1), n = back.find(q => q.s <= 1); if (!u || !n) return null; const { y, h, bottom } = upY(u), s0 = u.s + u.w; return { s: s0, w: L - 35 - s0, y, h, bottom, sx: L - 35 }; }
    const u = side.find(q => q.s <= a + 1 && q.s > 36), n = back.find(q => q.s + q.w >= WN0 - 1); if (!u || !n) return null; const { y, h, bottom } = upY(u); return { s: 35, w: u.s - 35, y, h, bottom, sx: 0 };
  }
  // Jede Ecke einer L-/U-Küche bekommt einen Eckschrank – auch nach dem Löschen (dann Blindecke)
  function fillCorners() {
    const N = P.rows.N, add = []; if (!N) return add;
    ['l', 'r'].forEach(sd => { if (!hasCornerSlot(sd) || !N.length || !(P.rows[sd === 'l' ? 'W' : 'E'] || []).length) return; const m0 = sd === 'l' ? N[0] : N[N.length - 1]; if (m0 && M[m0.t].corner && cornerSide('N', sd === 'l' ? 0 : N.length - 1) === sd) return; const m = mk('eb', 90); if (sd === 'l') N.unshift(m); else N.push(m); add.push(m); });
    if (add.length) { makeRoom('N', add[0]); ['W', 'E'].forEach(w => P.rows[w] && makeRoom(w)); }
    return add;
  }
  function clampIdx(w, idx) { if (w !== 'N') return idx; const N = P.rows.N, n = N.length; if (n && M[N[0].t].corner && cornerSide('N', 0) === 'l') idx = Math.max(1, idx); if (n && M[N[n - 1].t].corner && cornerSide('N', n - 1) === 'r') idx = Math.min(n - 1, idx); return idx; }

  /* ---------------- Hängeschränke ---------------- */
  // Automatisch (wie bisher) oder individuell je Wand (P.up[w])
  function overKind(w, m, x0) {
    if (M[m.t].h === 't') return null;
    if (m.t === 'kf' || m.t === 'ko') return 'hood';
    if (!P.top[w]) return null;
    if (P.op.some(o => o.wall === w && opOver(o, x0, m.w))) return null;
    return 'cab';
  }
  function autoUp(w) {
    const out = [], X = xs(w);
    const L = wallLen(w); P.rows[w].forEach((m, i) => { const x = X[i]; const k = x + m.w > L + .5 ? null : overKind(w, m, x); if (k === 'hood' && isDD()) { /* Muldenlüfter: keine Haube */ } else if (k === 'hood') { const hw = hoodW(m), hs = x + m.w / 2 - hw / 2; if (!(wallHood() && opAt(w, hs, hw))) out.push({ id: 'a' + m.id, t: 'dh', s: hs, w: hw, auto: 1 }); } else if (k === 'cab') { const u = { id: 'a' + m.id, t: m.w > 60 ? 'h2' : 'h1', s: x, w: m.w, auto: 1 }, r = P.rows[w], nb = j => r[j] && M[r[j].t].h === 't'; if (u.t === 'h1') { const ua = nb(i - 1) || x <= 1 ? 'l' : nb(i + 1) || x + m.w >= L - 1 ? 'r' : (m.a || m._aa); if (ua) u.a = ua; } out.push(u); } });
    return out;
  }
  const upList = w => P.up[w] || (P.rows[w] ? autoUp(w) : []);
  function materialize(w) { if (P.up[w]) return {}; const map = {}; P.up[w] = autoUp(w).map(u => { const n = { id: uid++, t: u.t, s: u.s, w: u.w }; map[u.id] = n.id; return n; }); return map; }
  function upY(u) { const h = hOf(u), top = Math.max(217, 145 + h) + ((P && P.ah || 90) - 90); return { y: FL - top, h, bottom: top - h }; }   // Arbeitshöhe höher → Hängeschränke rücken mit den Hochschränken hoch
  function upConflict(w, u) {
    if (u.t === 'dh') return wallHood() && opAt(w, u.s, u.w) ? 'win' : null; const { bottom } = upY(u), X = xs(w); let r = null;
    P.rows[w].forEach((m, i) => { if (M[m.t].h === 't' && ov(X[i], m.w, u.s, u.w) && hOf(m) > bottom + 1) r = 'tall'; });
    if (!r && P.op.some(o => o.wall === w && ov(o.s, o.w, u.s, u.w))) r = 'win';
    return r;
  }
  function upEdges(w, u) { const L = wallLen(w), e = [0, L]; const X = xs(w); P.rows[w].forEach((m, i) => { e.push(X[i], X[i] + m.w); }); (P.up[w] || []).forEach(o => { if (o !== u) e.push(o.s, o.s + o.w); }); P.op.filter(o => o.wall === w).forEach(o => e.push(o.s, o.s + o.w)); if (u && u.t === 'dh') hobsOf(w).forEach(h => e.push(Math.round(h.c - u.w / 2))); return e; }
  function resolveUp(w, u, ds, noSnap) {
    const L = wallLen(w), others = (P.up[w] || []).filter(o => o !== u);
    let s = Math.max(0, Math.min(L - u.w, ds));
    if (!noSnap) { let best = null; upEdges(w, u).forEach(e => [e, e - u.w].forEach(c => { const d = Math.abs(c - s); if (c >= 0 && c + u.w <= L && d < 9 && (!best || d < best.d)) best = { c, d }; })); if (best) s = best.c; }
    s = Math.round(s);
    if (others.some(o => ov(o.s, o.w, s, u.w))) {
      const c = []; others.forEach(o => c.push(o.s - u.w, o.s + o.w)); const ok = c.filter(v => v >= 0 && v + u.w <= L && !others.some(o => ov(o.s, o.w, v, u.w))).sort((p, q) => Math.abs(p - s) - Math.abs(q - s));
      if (!ok.length || Math.abs(ok[0] - s) > Math.max(60, u.w)) return null; s = ok[0];
    }
    return s;
  }
  function freeUpSpot(w, t, width) {
    const L = wallLen(w), ups = P.up[w] || [], tmp = { t, w: width, h: HDEF(t) }, cand = new Set(), X = xs(w);
    P.rows[w].forEach((m, i) => { const x = X[i]; if (M[m.t].h !== 't') { cand.add(x); cand.add(x + m.w - width); } }); ups.forEach(u => { cand.add(u.s + u.w); cand.add(u.s - width); }); cand.add(range(w)[0]); cand.add(range(w)[1] - width);
    const ok = [...cand].filter(s => s >= 0 && s + width <= L && !ups.some(u => ov(u.s, u.w, s, width)) && !upConflict(w, { ...tmp, s })).sort((p, q) => p - q);
    // Bevorzugt über normalen Unterschränken, nicht über dem Kochfeld
    const good = ok.filter(s => { let bad = false; P.rows[w].forEach((m, i) => { if (ov(X[i], m.w, s, width) && (m.t === 'kf' || m.t === 'ko')) bad = true; }); return !bad; });
    return (good.length ? good : ok)[0];
  }
  // Haube ↔ Kochfeld: Haube rastet mittig über dem Kochfeld ein (Fangbereich HSNAP cm) und wandert mit, wenn das Kochfeld verschoben wird
  const HSNAP = 30;
  function hobsOf(w) { if (!P.rows[w]) return []; const X = xs(w); return P.rows[w].map((m, i) => (m.t === 'kf' || m.t === 'ko') ? { id: m.id, c: X[i] + m.w / 2 } : null).filter(Boolean); }
  function hoodSnap(w, u, s) {
    if (!u || u.t !== 'dh' || s == null) return s; const L = wallLen(w), others = (P.up[w] || []).filter(o => o !== u && o.id !== u.id);
    let best = null; hobsOf(w).forEach(h => { const c = Math.round(h.c - u.w / 2), d = Math.abs(s - c); if (d <= HSNAP && c >= 0 && c + u.w <= L && !others.some(o => ov(o.s, o.w, c, u.w)) && (!best || d < best.d)) best = { c, d }; });
    return best ? best.c : s;
  }
  function relinkHood(w, u) { if (!u || u.t !== 'dh') return; const h = hobsOf(w).find(q => Math.abs(q.c - (u.s + u.w / 2)) < 1); if (h) u.hob = h.id; else delete u.hob; }
  function linkHoods() { for (const w in P.up) P.up[w].forEach(u => relinkHood(w, u)); }
  // Hängeschrank, der einer mitgewanderten Haube im Weg ist: an die nächste freie Stelle rücken, sonst entfernen
  function clearAround(w, u) {
    const L = wallLen(w); let gone = 0;
    [...(P.up[w] || [])].forEach(o => {
      if (o === u || !ov(o.s, o.w, u.s, u.w)) return;
      const rest = P.up[w].filter(x => x !== o), cand = new Set([0, L - o.w]); rest.forEach(x => { cand.add(x.s - o.w); cand.add(x.s + x.w); }); const X = xs(w); (P.rows[w] || []).forEach((m, i) => { cand.add(X[i]); cand.add(X[i] + m.w - o.w); });
      const ok = [...cand].map(Math.round).filter(s => s >= 0 && s + o.w <= L && !rest.some(x => ov(x.s, x.w, s, o.w)) && (o.t === 'dh' || !upConflict(w, { ...o, s }))).sort((p, q) => Math.abs(p - o.s) - Math.abs(q - o.s));
      if (ok.length) o.s = ok[0]; else { P.up[w] = rest; gone++; }
    });
    if (P.up[w]) P.up[w].sort((a, b) => a.s - b.s);
    return gone;
  }
  function followHoods() {
    let gone = 0;
    for (const w of Object.keys(P.up)) {
      [...P.up[w]].forEach(u => {
        if (u.t !== 'dh' || u.hob == null || !P.up[w].includes(u)) return;
        let ww = null, c = 0; for (const w2 in P.rows) { const i = P.rows[w2].findIndex(m => m.id === u.hob); if (i >= 0) { ww = w2; c = xs(w2)[i] + P.rows[w2][i].w / 2; break; } }
        if (ww == null) { delete u.hob; return; } // Kochfeld entfernt – Haube bleibt, wo sie ist
        if (ww !== w) { // Kochfeld an eine andere Wand gezogen: Haube geht mit (automatische Wand bekommt ihre Haube ohnehin)
          P.up[w] = P.up[w].filter(x => x !== u);
          if (P.up[ww] && !P.up[ww].some(x => x.t === 'dh' && ov(x.s, x.w, c - u.w / 2, u.w))) { u.s = Math.round(Math.max(0, Math.min(wallLen(ww) - u.w, c - u.w / 2))); P.up[ww].push(u); gone += clearAround(ww, u); }
          return;
        }
        const ns = Math.round(Math.max(0, Math.min(wallLen(w) - u.w, c - u.w / 2)));
        if (Math.abs(ns - u.s) < .5) return;
        u.s = ns; gone += clearAround(w, u);
      });
    }
    return gone;
  }

  /* ---------------- Front-Beschreibung (gemeinsam für Zeichnung und 3D) ---------------- */
  function spec(m, cs) {
    const t = m.t, w = m.w, a = aOf(m, cs), H = hOf(m);
    switch (t) {
      case 'us': return { fr: w < 40 ? [{ k: 'drawer', p: 1, in: 'plates' }] : [{ k: 'drawer', p: .24, in: 'cutlery' }, { k: 'drawer', p: .38 }, { k: 'drawer', p: .38, in: 'plates' }] };
      case 'ut': return { fr: [{ k: 'drawer', p: .2, in: 'cutlery' }, { k: 'door', p: .8, a }] };
      case 'u1': return { fr: [{ k: 'door', p: 1, a }] };
      case 'u2': return { fr: [{ k: 'door2', p: 1 }] };
      case 's2': return { fr: [{ k: 'drawer', p: .5, in: 'pots' }, { k: 'drawer', p: .5, in: 'plates' }] };
      case 's4': return { fr: [{ k: 'drawer', p: .19, in: 'cutlery' }, { k: 'drawer', p: .19 }, { k: 'drawer', p: .27 }, { k: 'drawer', p: .35, in: 'pots' }] };
      case 'ui': return { fr: [{ k: 'drawer', p: .5, in: 'id' }, { k: 'drawer', p: .5, in: 'id' }] };
      case 'ur': return { fr: [{ k: 'open', p: 1 }] };
      case 'fa': return { fr: [{ k: 'pull', p: 1, in: 'bottles' }] };
      case 'ap': return { fr: [{ k: 'pull', p: 1, in: 'baskets' }] };
      case 'mt': return { fr: [{ k: 'pull', p: 1, in: 'bins' }] };
      case 'sp': return { fr: [w >= 80 ? { k: 'door2', p: 1, in: 'none' } : { k: 'door', p: 1, a, in: 'none' }], app: 'sp' };
      case 'kf': return { fr: [{ k: 'drawer', p: .3, in: 'cutlery' }, { k: 'drawer', p: .35 }, { k: 'drawer', p: .35, in: 'pots' }], app: 'kf' };
      case 'ko': return { fr: [{ k: 'drawer', p: .18 }, { k: 'oven', p: .82 }], app: 'kf' };
      case 'gs': return { fr: [{ k: 'dw', p: 1 }] };
      case 'ek': { const s = cs || 'l', bl = { cm: 60, blind: 1, fr: [{ k: 'blind', p: 1 }] }, dr = { cm: 30, fr: [{ k: 'door', p: 1, a: s === 'l' ? 'r' : 'l', in: 'none' }] }; return { corner: { kind: 'kar', side: s }, cols: s === 'l' ? [bl, dr] : [dr, bl] }; }
      case 'el': case 'eb': { const s = cs || 'l', bl = { cm: 60, blind: 1, fr: [{ k: 'blind', p: 1 }] }, dr = { fr: [{ k: 'door', p: 1, a, in: t === 'el' ? 'none' : 'shelf' }], lemans: t === 'el' ? (s === 'l' ? -1 : 1) : 0 }; return { cols: s === 'l' ? [bl, dr] : [dr, bl] }; }
      case 'kue': return { fr: H >= 190 ? [{ k: 'door', p: .6, a, hp: 'bottom', in: 'fridge' }, { k: 'door', p: .4, a, hp: 'top', in: 'fridge' }] : [{ k: 'door', p: 1, a, hp: 'mid', in: 'fridge' }] };
      case 'vo': { if (m.tu === 'schub' && H >= 150) { const F = H - 10; return { fr: [{ k: 'door', cm: F - 80, a, hp: 'bottom' }, { k: 'drawer', cm: 25 }, { k: 'drawer', cm: 27.5 }, { k: 'drawer', cm: 27.5 }] }; } return { fr: H >= 190 ? [{ k: 'door', p: .5, a, hp: 'bottom' }, { k: 'door', p: .5, a, hp: 'top' }] : [{ k: 'door', p: 1, a, hp: 'mid' }] }; }
      case 'bo': { const r = H - 10 - 130, top = r >= 15 ? (m.to === 'klappe' ? { k: 'flap', cm: r } : { k: 'door', cm: r, a, hp: 'bottom', hl: .26 }) : { k: 'blind', cm: Math.max(0, r) }; return { fr: [top, { k: 'oven', cm: 60 }, ...(m.tu === 'tuer' ? [{ k: 'door', cm: 70, a, hp: 'top' }] : [{ k: 'drawer', cm: 35 }, { k: 'drawer', cm: 35 }])] }; }
      case 'bm': { const r = H - 10 - 175, top = r >= 15 ? (m.to === 'klappe' ? { k: 'flap', cm: r } : { k: 'door', cm: r, a, hp: 'bottom', hl: .2 }) : { k: 'blind', cm: Math.max(0, r) }, g2 = m.g2 === 'klappe' ? { k: 'flap', cm: 45, in: 'micro' } : { k: m.g2 === 'steam' ? 'steam' : 'micro', cm: 45 }; return { fr: [top, g2, { k: 'oven', cm: 60 }, ...(m.tu === 'tuer' ? [{ k: 'door', cm: 70, a, hp: 'top' }] : [{ k: 'drawer', cm: 35 }, { k: 'drawer', cm: 35 }])] }; }
      case 'ah': return { fr: [{ k: 'pull', p: 1, in: 'baskets' }] };
      case 'bs': return { fr: [{ k: 'door', p: 1, a, hp: 'mid', in: 'broom' }] };
      case 'vg': return { fr: H >= 190 ? [{ k: 'glass', p: .56, a, hp: 'bottom', dec: 'mix' }, { k: 'door', p: .44, a, hp: 'top' }] : [{ k: 'glass', p: 1, a, hp: 'mid', dec: 'mix' }] };
      case 'he': { const bl = { cm: 25, blind: 1, fr: [{ k: 'blind', p: 1 }] }, dr = { fr: [{ k: 'door', p: 1, a, in: 'lazy' }] }; return { cols: a === 'r' ? [bl, dr] : [dr, bl] }; }
      case 'h1': return { fr: [{ k: 'door', p: 1, a }] };
      case 'h2': return { fr: [{ k: 'door2', p: 1 }] };
      case 'hk': return { fr: [{ k: 'flap', p: 1 }] };
      case 'hs': return { fr: [{ k: 'lift', p: 1 }] };
      case 'hf': return { fr: [{ k: 'fold', p: 1 }] };
      case 'hg': return { fr: [w > 60 ? { k: 'glass2', p: 1 } : { k: 'glass', p: 1, a }] };
      case 'ho': return { fr: [{ k: 'open', p: 1 }] };
      case 'wb': return { fr: [{ k: 'boards', p: 1 }] };
    }
    return { fr: [{ k: 'door', p: 1, a }] };
  }
  const hasHinge = m => m.t === 'hg' ? m.w <= 60 : !!M[m.t].hinge;
  const openable = m => !['dh', 'ur', 'ho', 'wb'].includes(m.t);
  function variant(m, cs) {
    const c = M[m.t], a = aOf(m, cs), dir = a === 'l' ? 'öffnet nach links' : 'öffnet nach rechts';
    if (m.t === 'u1' || m.t === 'h1') return 'Tür ' + dir;
    if (m.t === 'hg' && m.w <= 60) return 'Glastür ' + dir; if (m.t === 'hg') return '2 Glastüren';
    if (m.t === 'he') return 'Ecke ' + (a === 'r' ? 'links' : 'rechts') + ', Drehboden';
    if (['vo', 'bo', 'bm'].includes(m.t) || axOf(m)) { const x = [];
      if (m.t === 'bm') x.push(m.g2 === 'steam' ? 'Backofen + Dampfgarer' : m.g2 === 'klappe' ? 'Backofen + Mikrowelle hinter Klappe' : 'Backofen + Mikrowelle');
      if (m.t === 'bo') x.push('Backofen auf Augenhöhe'); if (m.t === 'vo') x.push('Vorrat');
      if (m.tu) x.push('unten ' + (m.tu === 'schub' ? 'Schubladen' : 'Tür')); if (m.to === 'klappe') x.push('oben Klappe');
      if (axOf(m)) { const o = m.axo || (axOf(m) <= 40 ? 'klappe' : m.w > 60 ? 'zwei' : (m.a || 'r')); x.push('Aufsatz ' + axOf(m) + ' cm (' + ({ klappe: 'Klappe nach oben', zwei: 'zwei Türen', l: 'Tür links', r: 'Tür rechts' })[o] + ')'); }
      if (x.length) return x.join(', '); }
    return c.v || c.s;
  }
  const label = (m, cs) => `${M[m.t].n} · ${variant(m, cs)}`;

  /* ---------------- Ansichtszeichnung (SVG, cm) ---------------- */
  const H = 260, FL = 260; // Raumhöhe, Boden-y
  const fcol = () => P.style.wood ? WOOD[P.style.wood] : P.style.front;
  function lum(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; }
  function shade(hex, a) { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v + a * (a < 0 ? v : 255 - v)))); return '#' + ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1); }
  const topCol = () => TOPS.find(t => t[0] === P.style.top)[2];
  const xr = F => lum(F) > .5 ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.4)';
  // eine Front (x, y oben, Breite, Höhe), Griff je nach Stil; v = senkrechter Griff
  function front(x, y, w, h, o = {}) {
    const F = o.fill || fcol(), str = lum(F) > .5 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.16)';
    let s = `<rect x="${x + .4}" y="${y + .4}" width="${Math.max(.2, w - .8)}" height="${Math.max(.2, h - .8)}" rx=".8" fill="${F}" stroke="${str}" stroke-width=".5"${P.style.wood && !o.fill ? ' filter="url(#kpgrain)"' : ''}/>`;
    if (P.style.frame && w > 9 && h > 8) { const f = Math.min(5, w * .15, h * .2); s += `<rect x="${x + f}" y="${y + f}" width="${w - 2 * f}" height="${h - 2 * f}" rx=".6" fill="none" stroke="${str}" stroke-width=".55"/><rect x="${x + f + .7}" y="${y + f + .7}" width="${w - 2 * f - 1.4}" height="${h - 2 * f - 1.4}" rx=".5" fill="none" stroke="${lum(F) > .5 ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.12)'}" stroke-width=".4"/>`; }
    if (o.noH) return s;
    const hs = P.style.handle;
    if (hs === 'grifflos') s += `<rect x="${x + .4}" y="${o.gripB ? y + h - 2 : y + .4}" width="${Math.max(.2, w - .8)}" height="1.6" fill="${shade(F, -.35)}" opacity=".85"/>`;
    else if (o.v) { const hl = Math.min(o.hl || 34, h * .42), hy = o.hc != null ? Math.max(y + 6, Math.min(y + h - 6 - hl, o.hc - hl / 2)) : o.vpos === 'top' ? y + 6 : o.vpos === 'mid' ? y + h / 2 - hl / 2 : y + h - 6 - hl; s += hs === 'knopf' ? `<circle cx="${o.side < 0 ? x + 5 : x + w - 5}" cy="${hy + (o.vpos === 'top' && o.hc == null ? 2 : o.vpos === 'mid' || o.hc != null ? hl / 2 : hl - 2)}" r="1.8" fill="${HCOL[hs]}" stroke="rgba(0,0,0,.25)" stroke-width=".3"/>` : `<rect x="${o.side < 0 ? x + 4 : x + w - 6}" y="${hy}" width="2" height="${hl}" rx="1" fill="${HCOL[hs]}"/>`; }
    else { const hy = o.hc != null ? Math.max(y + 3, Math.min(y + h - 5, o.hc - .9)) : o.hb ? y + h - 5.8 : y + 4; s += hs === 'knopf' ? `<circle cx="${x + w / 2}" cy="${hy + .9}" r="1.8" fill="${HCOL[hs]}" stroke="rgba(0,0,0,.25)" stroke-width=".3"/>` : `<rect x="${x + w / 2 - Math.min(16, w * .3)}" y="${hy}" width="${Math.min(32, w * .6)}" height="1.8" rx=".9" fill="${HCOL[hs]}"/>`; }
    return s;
  }
  // Öffnungsdreieck (Spitze zeigt zum Scharnier) – wie in jeder Küchenplanung
  function tri(x, y, w, h, a, F) {
    const st = `fill="none" stroke="${xr(F)}" stroke-width=".55" stroke-dasharray="2.2 1.6" class="kp-tri"`;
    if (a === 'up') return `<path d="M${x + 2.5} ${y + h - 2.5}L${x + w / 2} ${y + 2.5}L${x + w - 2.5} ${y + h - 2.5}" ${st}/>`;
    const hx = a === 'r' ? x + w - 2.5 : x + 2.5, fx = a === 'r' ? x + 2.5 : x + w - 2.5;
    return `<path d="M${fx} ${y + 2.5}L${hx} ${y + h / 2}L${fx} ${y + h - 2.5}" ${st}/>`;
  }
  function xray(kind, x, y, w, h, F) {
    const c = xr(F), d = `fill="none" stroke="${c}" stroke-width=".5" stroke-dasharray="1.8 1.4"`;
    if (kind === 'baskets') { let s = ''; const n = Math.max(2, Math.round(h / 18)); for (let i = 1; i <= n; i++) s += `<line x1="${x + 4}" x2="${x + w - 4}" y1="${y + h * i / (n + 1) + 2}" y2="${y + h * i / (n + 1) + 2}" ${d}/>`; return s; }
    if (kind === 'bottles') { let s = ''; const n = Math.max(1, Math.floor((w - 4) / 7)); for (let i = 0; i < n; i++) { const bx = x + 2 + (i + .5) * (w - 4) / n; s += `<path d="M${bx - 2.2} ${y + h - 6}v-14q0-3 1.6-4v-5h1.2v5q1.6 1 1.6 4v14z" ${d}/>`; } return s; }
    if (kind === 'bins') { let s = ''; const n = w > 50 ? 3 : 2, bw = (w - 8) / n; for (let i = 0; i < n; i++) s += `<rect x="${x + 4 + i * bw + 1}" y="${y + h * .35}" width="${bw - 2}" height="${h * .55}" rx="1.5" ${d}/>`; return s + `<text x="${x + w / 2}" y="${y + h * .28}" font-size="7" text-anchor="middle" fill="${c}" font-family="system-ui">♻</text>`; }
    return '';
  }
  function hatch(x, y, w, h, txt) { return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#kphatch)"/><text x="${x + w / 2}" y="${y + h / 2 + 2}" font-size="6.5" text-anchor="middle" fill="#8a7f72" font-family="system-ui">${txt || 'Ecke'}</text></g>`; }
  function openBox(x, y, w, h, n) {
    let s = `<rect x="${x + .4}" y="${y + .4}" width="${w - .8}" height="${h - .8}" fill="#e6dfd3" stroke="${shade(fcol(), -.25)}" stroke-width="1.2"/>`;
    for (let i = 1; i <= n; i++) { const yy = y + h * i / (n + 1); s += `<rect x="${x + 1}" y="${yy}" width="${w - 2}" height="1.8" fill="${fcol()}"/>`; }
    for (let i = 0; i <= n; i++) { const yy = i === n ? y + h - 1 : y + h * (i + 1) / (n + 1); for (let k = 0; k < Math.floor((w - 6) / 12); k++) s += `<rect x="${x + 5 + k * 12}" y="${yy - 7}" width="6" height="7" rx="1.2" fill="${k % 2 ? '#c9b89a' : '#f6f3ee'}" stroke="rgba(0,0,0,.18)" stroke-width=".3"/>`; }
    return s;
  }
  function f2d(f, x, y, w, h, kind) {
    const F = fcol(), gb = kind === 'u';
    switch (f.k) {
      case 'drawer': case 'pull': { let s = front(x, y, w, h, kind === 't' && h > 70 ? { hc: FL - 105 } : {}); if (f.in === 'id') s += `<rect x="${x + 5}" y="${y + 6}" width="${w - 10}" height="${Math.min(9, h * .3)}" rx="1" fill="none" stroke="${xr(F)}" stroke-width=".5" stroke-dasharray="2 1.5"/>`; if (f.k === 'pull') s += xray(f.in, x, y, w, h, F); return s; }
      case 'door': return front(x, y, w, h, { v: 1, side: f.a === 'r' ? -1 : 1, vpos: kind === 't' ? 'bottom' : f.hp || (kind === 'b' ? 'top' : 'bottom'), hc: kind === 't' && FL - (y + h) < 95 ? FL - 105 : null, hl: kind === 'b' ? 14 : kind === 'u' ? 20 : (f.hl ? f.hl * 100 : 34), gripB: gb }) + tri(x, y, w, h, f.a || 'l', F);
      case 'door2': { const hw = w / 2, o = { v: 1, vpos: kind === 'b' ? 'top' : 'bottom', hl: kind === 'b' ? 14 : 20, gripB: gb }; return front(x, y, hw, h, { ...o, side: 1 }) + front(x + hw, y, hw, h, { ...o, side: -1 }) + tri(x, y, hw, h, 'l', F) + tri(x + hw, y, hw, h, 'r', F); }
      case 'glass': case 'glass2': { const parts = f.k === 'glass2' ? [[x, w / 2, 'l'], [x + w / 2, w / 2, 'r']] : [[x, w, f.a || 'l']]; let s = ''; parts.forEach(([px, pw, a]) => { s += front(px, y, pw, h, { v: 1, side: a === 'r' ? -1 : 1, vpos: 'bottom', hc: kind === 't' && FL - (y + h) < 95 ? FL - 105 : null, hl: 20, gripB: gb }); s += `<rect x="${px + 4}" y="${y + 4}" width="${pw - 8}" height="${h - 8}" fill="rgba(208,226,231,.82)" stroke="rgba(0,0,0,.14)" stroke-width=".4"/>`; for (let i = 1; i < (h > 60 ? 3 : 2); i++) { const yy = y + h * i / (h > 60 ? 3 : 2); s += `<rect x="${px + 4}" y="${yy}" width="${pw - 8}" height="1" fill="rgba(255,255,255,.7)"/><rect x="${px + 7}" y="${yy - 7}" width="5" height="7" rx="1" fill="rgba(120,110,95,.35)"/><rect x="${px + 14}" y="${yy - 5}" width="5" height="5" rx="1" fill="rgba(120,110,95,.3)"/>`; } s += tri(px, y, pw, h, a, '#ffffff'); }); return s; }
      case 'flap': return front(x, y, w, h, { hb: 1, gripB: gb }) + tri(x, y, w, h, 'up', F);
      case 'lift': { const cx = x + w / 2, a = Math.min(h * .55, 24), y0 = y + h / 2 - a / 2, c = xr(F); return front(x, y, w, h, { hb: 1, gripB: gb }) + `<path d="M${cx} ${y0 + a}V${y0 + .8}M${cx - 3.4} ${y0 + 4.2}L${cx} ${y0 + .6}L${cx + 3.4} ${y0 + 4.2}" fill="none" stroke="${c}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + 3} ${y + 3}h${w - 6}" stroke="${c}" stroke-width=".5" stroke-dasharray="2 1.6"/>`; }
      case 'fold': { const h2 = h / 2, cx = x + w / 2, ym = y + h2, a = Math.min(h * .22, 9), c = xr(F); return front(x, y, w, h2, { noH: 1 }) + front(x, ym, w, h2, { hb: 1, gripB: gb }) + `<path d="M${x + 1.6} ${ym - 2.6}L${x + 4.2} ${ym}L${x + 1.6} ${ym + 2.6}M${x + w - 1.6} ${ym - 2.6}L${x + w - 4.2} ${ym}L${x + w - 1.6} ${ym + 2.6}" fill="none" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/><path d="M${cx} ${ym - a}V${ym + a}M${cx - 3} ${ym - a + 3.2}L${cx} ${ym - a}L${cx + 3} ${ym - a + 3.2}M${cx - 3} ${ym + a - 3.2}L${cx} ${ym + a}L${cx + 3} ${ym + a - 3.2}" fill="none" stroke="${c}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>`; }
      case 'dw': return front(x, y, w, h, { noH: P.style.handle === 'grifflos' }) + `<text x="${x + w / 2}" y="${y + h / 2 + 2}" font-size="6" text-anchor="middle" fill="${lum(F) > .5 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.22)'}" font-family="system-ui">GS</text>`;
      case 'oven': case 'micro': case 'steam': return `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="2" fill="#141516"/><rect x="${x + 5}" y="${y + (f.k === 'oven' ? 9 : 7)}" width="${w - 10}" height="${Math.max(2, h - (f.k === 'oven' ? 15 : 12))}" rx="1.5" fill="#26292c"/><rect x="${x + 7}" y="${y + 3.5}" width="${w - 14}" height="2" rx="1" fill="#b9bcbf"/>`;
      case 'open': return openBox(x, y, w, h, kind === 'u' ? (h > 60 ? 2 : 1) : 1);
      case 'boards': { let b = ''; const n = Math.max(1, Math.round(h / 30)); for (let i = 0; i < n; i++) { const by = y + h - i * h / n - 4; b += `<rect x="${x + 1}" y="${by}" width="${w - 2}" height="4" rx="1" fill="${topCol()}" stroke="rgba(0,0,0,.25)" stroke-width=".5"/>`; } return b; }
      case 'blind': return front(x, y, w, h, { noH: 1 });
    }
    return front(x, y, w, h);
  }
  function stack2d(x, y, w, total, list, kind) {
    const fixed = list.reduce((a, f) => a + (f.cm != null ? f.cm : 0), 0), pSum = list.reduce((a, f) => a + (f.cm == null ? (f.p || 1) : 0), 0) || 1, rest = Math.max(0, total - fixed);
    let s = '', yy = y; list.forEach(f => { const hh = f.cm != null ? f.cm : rest * (f.p || 1) / pSum; if (hh > .3) s += f2d(f, x, yy, w, hh, kind); yy += hh; }); return s;
  }
  const CNAME = { ek: 'Karussell', el: 'Le Mans', eb: 'Blindecke' };
  function elev(m, x) {
    if (M[m.t].h === 'b' || M[m.t].h === 't') { const dh = (P && P.ah || 90) - 90; if (dh) { const pl = M[m.t].h === 't' && dh > 0 ? `<rect x="${x}" y="${FL - dh}" width="${m.w}" height="${dh}" fill="#2b2b2b"/>` : ''; return pl + `<g transform="translate(0 ${-dh})">${elevRaw(m, x)}</g>`; } }
    return elevRaw(m, x);
  }
  function elevRaw(m, x) {
    const w = m.w, c = M[m.t], sp = spec(m, m._cs);
    if (c.h === 'b') {
      const dh = (P.ah || 90) - 90; let s = `<rect x="${x}" y="${FL - 10}" width="${w}" height="${10 + dh}" fill="#2b2b2b"/>`;
      const cols = sp.cols || [{ fr: sp.fr }], fixedW = cols.reduce((a, k) => a + (k.cm || 0), 0), flex = cols.filter(k => !k.cm).length || 1;
      let cx = x; cols.forEach(k => { const cw = k.cm || (w - fixedW) / flex; s += k.blind ? hatch(cx, FL - 86, cw, 76, CNAME[m.t] || 'Ecke') : stack2d(cx, FL - 86, cw, 76, k.fr, 'b'); cx += cw; });
      s += `<rect x="${x - .3}" y="${FL - 90}" width="${w + .6}" height="4" fill="${topCol()}" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>`;
      if (sp.app === 'sp') { const cx2 = x + w / 2, sc = sinkCol(), tc = tapCol(); s += `<g data-eq="sp"><rect x="${cx2 - Math.min(22, w / 2 - 3)}" y="${FL - 91.6}" width="${Math.min(44, w - 6)}" height="2" rx=".8" fill="${sc}" stroke="rgba(0,0,0,.3)" stroke-width=".3"/><path d="M${cx2 - 3} ${FL - 90}v-20q0-7 7-7h4q5 0 5 5v4" fill="none" stroke="${tc}" stroke-width="2.4" stroke-linecap="round"/><path d="M${cx2 - 3.6} ${FL - 108}q0-3 2-4.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".6" stroke-linecap="round"/><rect x="${cx2 - 6}" y="${FL - 93.2}" width="6" height="2.2" rx=".6" fill="${tc}"/></g>`; }
      if (sp.app === 'kf') { const hw = m.t === 'kf' ? Math.min(eqv('hobW', 80), w) - 2 : w - 4, hx = x + w / 2 - hw / 2; s += `<rect x="${hx}" y="${FL - 91.2}" width="${hw}" height="1.6" fill="#0d0d0e"/>${isDD() ? `<rect x="${x + w / 2 - 5}" y="${FL - 91.6}" width="10" height="1.2" fill="#6a6e72"/>` : ''}`; }
      return s;
    }
    if (c.h === 't') { const Ht = hOf(m), top = FL - Ht, ax = axOf(m); return `<rect x="${x}" y="${FL - 10}" width="${w}" height="10" fill="#2b2b2b"/>` + stack2d(x, top, w, Ht - 10, sp.fr, 't') + (ax ? stack2d(x, top - ax, w, ax - .6, axFront(m, ax), 'u') : ''); }
    return upElev({ ...m, s: x }, x);
  }
  // Dunstabzug in der Ansicht – je nach gewählter Bauform
  function hoodSvg(x, w, v) {
    const cx = x + w / 2, st = 'stroke="rgba(0,0,0,.22)" stroke-width=".5"';
    if (v === 'esse') return `<path d="M${cx - 10} ${FL - 260}h20v${260 - 178}h-20z" fill="#c7cacd" ${st}/><path d="M${cx - 13} ${FL - 178}h26l${w / 2 - 13} 20h${-w}z" fill="#b8bcbf" ${st}/><rect x="${x}" y="${FL - 158}" width="${w}" height="5" rx="1" fill="#a3a7aa" ${st}/>`;
    if (v === 'flach') { const F = fcol(); return front(x, FL - 217, w, 70, { noH: 1 }) + `<rect x="${x + 1}" y="${FL - 147}" width="${w - 2}" height="4" rx="1" fill="#b3b7ba" ${st}/><rect x="${x + 4}" y="${FL - 145.4}" width="${w - 8}" height=".9" fill="#5b5f63"/><text x="${cx}" y="${FL - 180}" font-size="5.5" text-anchor="middle" fill="${xr(F)}" font-family="system-ui">Haube</text>`; }
    if (v === 'decke') return `<rect x="${x - 5}" y="${FL - 260}" width="${w + 10}" height="5" fill="#e9ebec" ${st}/><rect x="${x + 6}" y="${FL - 255.4}" width="${w - 12}" height="1.2" fill="#6a6e72"/><path d="M${cx - 18} ${FL - 248}q4 6 0 12M${cx} ${FL - 248}q4 6 0 12M${cx + 18} ${FL - 248}q4 6 0 12" fill="none" stroke="#9aa0a5" stroke-width=".7" stroke-dasharray="2 1.6"/>`;
    // Schräghaube (Standard): Kamin + schräg nach vorn geneigte Glasfront, kopffrei
    return `<path d="M${cx - 9} ${FL - 260}h18v${260 - 196}h-18z" fill="#c7cacd" ${st}/><rect x="${x + 2}" y="${FL - 198}" width="${w - 4}" height="10" rx="1" fill="#a9adb0" ${st}/><path d="M${x + 2} ${FL - 188}h${w - 4}l3 36h${-w - 2}z" fill="#1c1d1f" ${st}/><path d="M${x + 6} ${FL - 185}h${w - 12}" stroke="rgba(255,255,255,.28)" stroke-width="1"/>`;
  }
  const hoodHit = (x, w) => { const v = eqv('hood', 'schraeg'); return v === 'flach' ? [x, FL - 217, w, 76] : v === 'decke' ? [x - 5, FL - 260, w + 10, 26] : [x, FL - 260, w, 108]; };
  function upElev(u, x) {
    if (u.t === 'dh') return hoodSvg(x, u.w, eqv('hood', 'schraeg'));
    const { y, h } = upY(u), sp = spec(u); let s = '';
    if (sp.cols) { const fixedW = sp.cols.reduce((a, k) => a + (k.cm || 0), 0), flex = sp.cols.filter(k => !k.cm).length || 1; let cx = x; sp.cols.forEach(k => { const cw = k.cm || (u.w - fixedW) / flex; s += k.blind ? front(cx, y, cw, h, { noH: 1 }) + `<path d="M${cx + 3} ${y + h - 3}L${cx + cw - 3} ${y + 3}" stroke="${xr(fcol())}" stroke-width=".5" stroke-dasharray="2 1.6"/><text x="${cx + cw / 2}" y="${y + h / 2 + 2}" font-size="5.5" text-anchor="middle" fill="${xr(fcol())}" font-family="system-ui">Ecke</text>` : stack2d(cx, y, cw, h, k.fr, 'u'); cx += cw; }); }
    else s = stack2d(x, y, u.w, h, sp.fr, 'u');
    if (upLed(u)) s += `<rect x="${x + 2}" y="${y + h - .5}" width="${u.w - 4}" height="1.2" fill="#fff3d0" opacity=".9"/>`;
    return s;
  }
  function upLed(u) { return u.led != null ? !!+u.led : u.t !== 'ho'; }
  function upHit(u, x) { if (u.t === 'dh') return hoodHit(x, u.w); const { y, h } = upY(u); return [x, y, u.w, h]; }
  function drawWall(w, opt = {}) {
    const L = wallLen(w), [a, b] = range(w), rowsW = P.rows[w];
    const flc = (FLOORS.find(f => f[0] === P.style.floor) || FLOORS[0])[2];
    let s = `<rect x="0" y="0" width="${L}" height="${H}" fill="${P.style.wall || '#f3efe9'}"/><rect x="0" y="${FL}" width="${L}" height="6" fill="${flc}"/>`;
    P.op.filter(o => o.wall === w).forEach(o => { s += opElev(o, opt.selOp === o.id); });
    s += backsplash(w);
    // Ecken (Seitenwände an der Rückwand) – beim Karussell mit seiner zweiten Tür
    const N = P.rows.N || [];
    if (a > 0) s += (w === 'E' && N.length && N[N.length - 1].t === 'ek') ? hatch(0, FL - 90, 60, 90, 'Karussell') + `<g transform="translate(0 ${-((P.ah || 90) - 90)})"><rect x="60" y="${FL - 10}" width="30" height="${10 + (P.ah || 90) - 90}" fill="#2b2b2b"/>${stack2d(60, FL - 86, 30, 76, [{ k: 'door', p: 1, a: 'r' }], 'b')}<rect x="59.7" y="${FL - 90}" width="30.6" height="4" fill="${topCol()}"/></g>` : hatch(0, FL - 90, a, 90);
    if (b < L) s += (w === 'W' && N[0] && N[0].t === 'ek') ? `<g transform="translate(0 ${-((P.ah || 90) - 90)})"><rect x="${b}" y="${FL - 10}" width="30" height="${10 + (P.ah || 90) - 90}" fill="#2b2b2b"/>${stack2d(b, FL - 86, 30, 76, [{ k: 'door', p: 1, a: 'l' }], 'b')}<rect x="${b - .3}" y="${FL - 90}" width="30.6" height="4" fill="${topCol()}"/></g>` + hatch(b + 30, FL - 90, L - b - 30, 90, 'Karussell') : hatch(b, FL - 90, L - b, 90);
    const LY = layout(w), sel = opt.sel; let x = a;
    rowsW.forEach((m, i) => {
      m._cs = cornerSide(w, i); x = LY.X.get(m);
      const tall = M[m.t].h === 't', hy = tall ? FL - hOf(m) - axOf(m) : FL - 92, hh = tall ? hOf(m) + axOf(m) : 92;
      s += `<g data-m="${m.id}" class="kp-m${sel === m.id ? ' on' : ''}"${opt.ghost === m.id ? ' opacity=".25"' : ''}>${elev(m, x)}<rect class="kp-hit" x="${x}" y="${hy}" width="${m.w}" height="${hh}" fill="transparent"/></g>`;
      x += m.w;
    });
    const fr = LY.fr, gx = LY.gx;
    const TR = trims(w), dk = k => (P.style[k] === 'top' ? topCol() : P.style[k] === 'front' ? fcol() : k === 'wgDek' ? topCol() : fcol()), dhh = (P.ah || 90) - 90;
    TR.pf.forEach(q => { s += `<g data-pf="${w}" class="kp-trim">${q.tall ? `<rect x="${q.x}" y="${FL - 10}" width="${q.w}" height="10" fill="#2b2b2b"/>${front(q.x, FL - q.h, q.w, q.h - 10, { noH: 1, fill: dk('pfDek') })}` : `<g transform="translate(0 ${-dhh})"><rect x="${q.x}" y="${FL - 10}" width="${q.w}" height="${10 + dhh}" fill="#2b2b2b"/>${front(q.x, FL - 86, q.w, 76, { noH: 1, fill: dk('pfDek') })}<rect x="${q.x - .3}" y="${FL - 90}" width="${q.w + .6}" height="4" fill="${topCol()}"/></g>`}${q.w >= 9 ? `<text x="${q.x + q.w / 2}" y="${FL - 46 - dhh}" font-size="${Math.min(5.5, q.w / 3)}" text-anchor="middle" fill="${xr(dk('pfDek'))}" font-family="system-ui" transform="rotate(-90 ${q.x + q.w / 2} ${FL - 46 - dhh})">Passstück ${Math.round(q.w)}</text>` : ''}<rect class="kp-hit" x="${q.x}" y="${FL - (q.tall ? q.h : 92 + dhh)}" width="${Math.max(q.w, 6)}" height="${q.tall ? q.h : 92 + dhh}" fill="transparent"/></g>`; });
    TR.wg.forEach(q => { s += `<g data-wg="${w}" class="kp-trim"><rect x="${q.x}" y="${FL - 90 - dhh}" width="2.5" height="${90 + dhh}" fill="${gripEnd() ? fcol() : dk('wgDek')}" stroke="rgba(0,0,0,.3)" stroke-width=".4"/>${gripEnd() ? `<rect x="${q.x}" y="${FL - 85.6 - dhh}" width="2.5" height="1.6" fill="#8b8379"/><rect x="${q.x}" y="${FL - 66.6 - dhh}" width="2.5" height="1.6" fill="#8b8379"/>` : ''}<rect class="kp-hit" x="${q.x - 3}" y="${FL - 92 - dhh}" width="8.5" height="${92 + dhh}" fill="transparent"/></g>`; });
    if (fr >= 30 && !LY.inner) s += `<g class="kp-free">${LY.inner ? `<g transform="translate(0 ${-((P.ah || 90) - 90)})"><rect x="${gx}" y="${FL - 10}" width="${fr}" height="${10 + (P.ah || 90) - 90}" fill="#2b2b2b"/>${front(gx, FL - 86, fr, 76, { noH: 1 })}<rect x="${gx - .3}" y="${FL - 90}" width="${fr + .6}" height="4" fill="${topCol()}"/></g>` : ''}<rect x="${gx + 1}" y="${FL - 89}" width="${fr - 2}" height="88" rx="2" fill="rgba(255,255,255,${LY.inner ? .25 : .4})" stroke="${ACC}" stroke-dasharray="3 2.4" stroke-width=".8"/>${fr >= 28 ? `<text x="${gx + fr / 2}" y="${FL - 42}" font-size="${Math.min(8, fr / 5)}" text-anchor="middle" fill="${ACC}" font-family="system-ui" font-weight="700">${LY.inner ? 'Blende' : 'frei'} ${Math.round(fr)}</text>` : ''}</g>`;
    if (fr < -0.5) s += `<rect x="${b}" y="${FL - 92}" width="${Math.min(-fr, 400)}" height="92" fill="rgba(208,40,40,.25)" stroke="#d02828" stroke-width=".8"/>`;
    { const cf = upCornerFill(w); if (cf) s += `<g pointer-events="none">${front(cf.s, cf.y, cf.w, cf.h, { noH: 1 })}<rect x="${cf.sx}" y="${cf.y}" width="35" height="${cf.h}" fill="${shade(fcol(), -.1)}" stroke="rgba(0,0,0,.18)" stroke-width=".4"/></g>`; }
    // Hängeschränke und Hauben
    upList(w).forEach(u => {
      const [hx, hy, hw, hh] = upHit(u, u.s), bad = upConflict(w, u);
      s += `<g data-u="${u.id}" class="kp-m kp-u${sel === u.id ? ' on' : ''}${bad ? ' bad' : ''}"${opt.ghost === u.id ? ' opacity=".25"' : ''}>${upElev(u, u.s)}${bad ? `<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="rgba(208,40,40,.18)" stroke="#d02828" stroke-width=".8"/>` : ''}<rect class="kp-hit" x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="transparent"/></g>`;
    });
    if (opt.prev && opt.prev.w === w) { const p = opt.prev, u = { t: p.t, s: p.s, w: p.width, h: HDEF(p.t), a: p.a }, [hx, hy, hw, hh] = upHit(u, p.s); s += `<g opacity="${p.ok ? .78 : .45}" pointer-events="none">${upElev(u, p.s)}<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="none" stroke="${p.ok ? ACC : '#d02828'}" stroke-width="1.4" stroke-dasharray="4 3"/></g>`; }
    // Anschlüsse (Bestand) – liegen hinter den Schränken, werden zum Planen obendrauf gezeigt
    (P.cx || []).filter(c => c.wall === w).sort((p, q) => (p.t === 'heiz' ? 0 : 1) - (q.t === 'heiz' ? 0 : 1)).forEach(c => { s += cxWall(c, selCx === c.id); });
    // Maßlinie
    s += `<g font-family="system-ui" font-size="7" fill="#6e655b" text-anchor="middle"><line x1="0" y1="${FL + 12}" x2="${L}" y2="${FL + 12}" stroke="#a99d8f" stroke-width=".5"/><text x="${L / 2}" y="${FL + 21}">${WN[w]} · ${L} cm</text></g>`;
    return s;
  }
  function opElev(o, on) {
    const x = o.s, w = o.w, y0 = opY(o), hh = opHH(o), top = FL - y0 - hh, bot = FL - y0, fl = opFl(o), k = opK(o);
    const hi = on ? `<rect x="${x - 6}" y="${top - 6}" width="${w + 12}" height="${hh + 9}" rx="3" fill="none" stroke="${ACC}" stroke-width="1.6" stroke-dasharray="4 3"/>` : '';
    // Flügel-Zeichen nach DIN: Spitze zeigt zur Bandseite (Dreh), nach unten (Kipp)
    const sym = (sx, sw, hinge) => { let d = ''; const mid = top + hh / 2; if (k === 'd' || k === 'dk' || k === 'dreh') d += hinge === 'l' ? `M${sx + sw} ${top + 2}L${sx + 2} ${mid}L${sx + sw} ${bot - 2}` : `M${sx} ${top + 2}L${sx + sw - 2} ${mid}L${sx} ${bot - 2}`; if (k === 'dk' || k === 'kipp') d += `M${sx + 2} ${top + 2}L${sx + sw / 2} ${bot - 2}L${sx + sw - 2} ${top + 2}`; return d ? `<path d="${d}" fill="none" stroke="${o.t === 'tuer' ? 'rgba(60,52,44,.35)' : 'rgba(255,255,255,.9)'}" stroke-width=".7" stroke-dasharray="3 2"/>` : ''; };
    const wings = fl === 2 ? [[x, w / 2, 'l'], [x + w / 2, w / 2, 'r']] : [[x, w, opA(o)]];
    let g = '';
    if (o.t === 'fenster' || o.t === 'balkon') {
      g = `<rect x="${x - 3}" y="${top - 3}" width="${w + 6}" height="${hh + 6}" fill="#fff" stroke="rgba(0,0,0,.15)" stroke-width=".6"/><rect x="${x}" y="${top}" width="${w}" height="${hh}" fill="url(#kpsky)"/>`;
      if (fl === 2) g += `<line x1="${x + w / 2}" y1="${top}" x2="${x + w / 2}" y2="${bot}" stroke="#fff" stroke-width="2.4"/>`;
      if (k === 'hs') g += `<path d="M${x + w * .3} ${top + hh * .55}h${w * .4}m-6 -4l6 4l-6 4" fill="none" stroke="#fff" stroke-width="1.2"/>`;
      else wings.forEach(([sx, sw, hg]) => { g += sym(sx, sw, hg); if (k !== 'fest') { const gx = hg === 'l' ? sx + sw - 4 : sx + 2.5; g += `<rect x="${gx}" y="${top + hh / 2 - 5}" width="1.6" height="10" rx=".8" fill="#9aa0a5"/>`; } });
      if (o.t === 'fenster') g += `<rect x="${x - 5}" y="${bot - 1}" width="${w + 10}" height="3" fill="#e6e1d9"/>`;
    } else {
      g = `<rect x="${x - 4}" y="${top - 4}" width="${w + 8}" height="${hh + 4}" fill="#fff" stroke="rgba(0,0,0,.18)" stroke-width=".6"/><rect x="${x}" y="${top}" width="${w}" height="${hh}" fill="#ddd6cb" stroke="rgba(0,0,0,.12)" stroke-width=".5"/>`;
      if (fl === 2) g += `<line x1="${x + w / 2}" y1="${top}" x2="${x + w / 2}" y2="${bot}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>`;
      if (k === 'schiebe') { g += `<rect x="${x - 6}" y="${top - 7}" width="${w + 12}" height="2.5" fill="#9aa0a5"/>`; wings.forEach(([sx, sw, hg]) => { const dir = fl === 2 ? (sx === x ? -1 : 1) : (opA(o) === 'l' ? -1 : 1), cx = sx + sw / 2; g += `<path d="M${cx - dir * 8} ${top + hh * .45}h${dir * 16}m${-dir * 5} -4l${dir * 5} 4l${-dir * 5} 4" fill="none" stroke="rgba(60,52,44,.5)" stroke-width="1"/><rect x="${dir < 0 ? sx + sw - 5 : sx + 3}" y="${top + hh * .45 - 8}" width="2" height="16" rx="1" fill="#8d9296"/>`; }); }
      else wings.forEach(([sx, sw, hg]) => { g += sym(sx, sw, hg); g += `<rect x="${hg === 'l' ? sx + sw - 13 : sx + 4}" y="${FL - 106}" width="9" height="2.2" rx="1" fill="#8d9296"/>`; });
    }
    return `<g data-op="${o.id}" class="kp-op" style="cursor:ew-resize">${g}${hi}</g>`;
  }
  // Nischenrückwand zwischen Arbeitsplatte und Hängeschrank
  function backsplash(w) {
    if (!P.rows[w]) return '';
    const b = P.style.back || 'wand', dh = (P.ah || 90) - 90, led = !!P.style.backLed, y1 = FL - 90 - dh;
    const fill = b === 'platte' ? topCol() : b === 'fliese' ? 'url(#kptile)' : b === 'holz' ? (BACKW.find(x => x[0] === (P.style.backWood || 'eiche')) || BACKW[0])[2] : b === 'motiv' ? '#d9d4cc' : b === 'dibond' ? backCol() : shade(backCol(), P.style.backC ? 0 : -.12);
    let s = '', rects = '', x0 = null, x1 = 0, tops = '';
    nsSegs(w).forEach(([x, sw, h]) => { rects += `<rect x="${x}" y="${y1 - h}" width="${sw}" height="${h}"/>`; if (h >= 40) tops += `<rect x="${x}" y="${y1 - h}" width="${sw}" height="1.2"/>`; if (x0 == null || x < x0) x0 = x; x1 = Math.max(x1, x + sw); });
    if (x0 == null) return '';
    if (b !== 'wand') {
      if (b === 'motiv' && motif) { const Wn = x1 - x0, z = +P.style.motZ || 1, sc = Math.max(Wn / motif.width, 55 / motif.height) * z, iw = motif.width * sc, ih = motif.height * sc, px = +P.style.motX || 0, py = +P.style.motY || 0;
        s += `<clipPath id="kpbs${w}">${rects}</clipPath><image href="${motif._url}" x="${(x0 + (Wn - iw) * (.5 - px / 2)).toFixed(1)}" y="${(y1 - 55 + (55 - ih) * (.5 + py / 2)).toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="none" clip-path="url(#kpbs${w})"/>`; }
      else s += `<g fill="${fill}"${b === 'holz' ? ' filter="url(#kpgrain)"' : ''}>${rects}</g>`;
      if (b === 'motiv' && !motif) s += `<text x="${(x0 + x1) / 2}" y="${y1 - 24}" font-size="7" text-anchor="middle" fill="#8a7f72" font-family="system-ui">Ihr Motiv – Foto in Schritt 3 hochladen</text>`;
      if (b === 'glas' || b === 'motiv') s += `<g fill="#fff" opacity=".1" clip-path="url(#kpbsg${w})"><clipPath id="kpbsg${w}">${rects}</clipPath><path d="M${x0} ${y1 - 55}h${(x1 - x0) * .35}l-30 55h${-(x1 - x0) * .35 + 30}z"/></g>`;
    }
    if (led) s += `<linearGradient id="kpled${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/></linearGradient><g fill="url(#kpled${w})">${rects}</g><g fill="#fff6dc">${tops}</g>`;
    s += `<g data-bs="${w}" class="kp-bs" fill="transparent">${rects}</g>`;
    return s;
  }
  // Nischen-Abschnitte einer Wand: über jedem Unterschrank + über der Ecke (Eckschrank der Rückwand) – damit die Rückwand über Eck durchläuft
  function nsSegs(w) {
    const out = [], X = xs(w), [a, b] = range(w), L = wallLen(w), seg = (x, sw) => { const h = nsH(w, { w: sw }, x); if (h > 0 && sw > .5) out.push([x, sw, h]); };
    if (cornerAt(w, 0) && w !== 'N') seg(1.6, a - 1.6);
    P.rows[w].forEach((m, i) => { if (M[m.t].h === 'b') seg(X[i], m.w); });
    if (cornerAt(w, 1) && w !== 'N') seg(b, L - b - 1.6);
    return out.sort((p, q) => p[0] - q[0]);
  }
  function nsH(w, m, x0) { const ops = P.op.filter(o => o.wall === w && opOver(o, x0, m.w)); if (ops.some(o => o.t !== 'fenster')) return 0; return ops.length ? Math.max(0, 15 - ((P.ah || 90) - 90)) : 55; }
  const DEFS = `<defs><linearGradient id="kpsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcdcf5"/><stop offset="1" stop-color="#eaf5fc"/></linearGradient><pattern id="kptile" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#d9d4cc"/><rect x=".6" y=".6" width="18.8" height="3.8" rx=".6" fill="#f6f4ef"/><rect x="-9.4" y="5.6" width="18.8" height="3.8" rx=".6" fill="#f6f4ef"/><rect x="10.6" y="5.6" width="18.8" height="3.8" rx=".6" fill="#f6f4ef"/></pattern><pattern id="kphatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#e9e3da"/><line x1="0" y1="0" x2="0" y2="6" stroke="#cfc5b8" stroke-width="2"/></pattern><filter id="kpgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .5" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 .55" result="a"/><feComposite in="a" in2="SourceGraphic" operator="in" result="g"/><feBlend in="SourceGraphic" in2="g" mode="multiply"/></filter></defs>`;

  (function () { const d = document.createElement('div'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = `<svg width="0" height="0">${DEFS}</svg>`; document.body.appendChild(d); })();
  /* ---------------- Rendering Wände ---------------- */
  const wallsEl = $('[data-kp-walls]'), tabsEl = $('[data-kp-walltabs]');
  let sel = null, selOp = null, curWall = 'N', ghostId = null, prev = null;
  const VB0 = 18;
  function renderWalls() {
    const walls = FORMS[P.form].walls;
    if (!walls.includes(curWall) && !(curWall === 'I' && P.form === 'insel')) curWall = walls.includes('N') ? 'N' : walls[0];
    if (curWall === 'I' && P.form !== 'insel') curWall = walls[0];
    tabsEl.innerHTML = walls.length > 1 || P.form === 'insel' ? walls.map(w => `<button type="button" data-wt="${w}" class="${w === curWall ? 'on' : ''}">${WN[w]}${free(w) < -0.5 || upList(w).some(u => upConflict(w, u)) ? ' <i>!</i>' : ''}</button>`).join('') + (P.form === 'insel' ? `<button type="button" data-wt="I" class="${curWall === 'I' ? 'on' : ''}">Insel</button>` : '') : '';
    wallsEl.innerHTML = walls.map(w => { const L = wallLen(w); return `<div class="kp-wall${w === curWall ? ' on' : ''}" data-wall="${w}" style="--L:${L}"><svg viewBox="-4 ${VB0} ${L + 8} ${H - VB0 + 24}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">${drawWall(w, { sel, ghost: ghostId, selOp, prev })}</svg></div>`; }).join('');
    if (P.form === 'insel') wallsEl.insertAdjacentHTML('beforeend', islandCard());
    renderPlan(); renderPop();
  }
  // Insel: Lage und Maße (cm). g = Durchgang zur Küchenzeile, x = seitlicher Versatz zur Raummitte, d = Tiefe
  function isl() {
    const W = P.room.w, D = P.room.d, I = P.island, w = I.w, d = I.d || 100;
    const g = Math.max(80, Math.min(I.g != null ? I.g : 115, D - 60 - d - 70));
    const x = Math.max(w / 2 + 20, Math.min(W - w / 2 - 20, W / 2 + (I.x || 0)));
    return { w, d, g, x, z: 60 + g + d / 2 };
  }
  const IKV = [['schub', 'Schubladen'], ['tuer', 'Türen'], ['mix', 'Gemischt']];
  const IKH = [['sitz', 'Sitzplatz'], ['schub', 'Schubladen'], ['tuer', 'Türen'], ['mix', 'Gemischt'], ['regal', 'Offenes Regal'], ['wand', 'Glatte Rückwand']];
  const ITWO = k => k === 'schub' || k === 'tuer' || k === 'mix' || k === 'regal' || k === 'schrank';
  const IKHT = { sitz: '30 cm Überstand – Platz für Barhocker auf der Raumseite.', schub: 'Zwei Schrankreihen Rücken an Rücken. Ab 100 cm Tiefe, mit 120 cm sind beide Seiten volle 60 cm tief.', tuer: 'Zwei Schrankreihen Rücken an Rücken. Ab 100 cm Tiefe, mit 120 cm sind beide Seiten volle 60 cm tief.', mix: 'Zwei Schrankreihen Rücken an Rücken, Schubladen und Türen im Wechsel.', regal: 'Offene Fächer zum Raum – für Kochbücher, Körbe und Schönes.', wand: 'Eine durchgehende Schrankreihe, zum Raum eine glatte Rückwand in Front- oder Holzoptik.' };
  const islSide = () => { const I = P.island; return { kv: I.kv || 'schub', kh: islKh() }; };
  const islSideTxt = () => { const kh = islKh(), ls = side => islMods(side).map(m => `${M[m.t].v || M[m.t].n} ${m.w} cm`).join(', ') || 'keine Schränke'; return `Kochseite: ${ls('v')} · Raumseite: ${kh === 'schrank' ? ls('h') + ' (Rücken an Rücken)' : (IKH2.find(x => x[0] === kh) || ['', 'Sitzplatz'])[1] + (kh === 'sitz' ? ' mit Überstand' : '')}`; };
  // Insel-Schränke (seit 04.11. abends): Kochseite I.mv und Raumseite I.mh als eigene Schrankreihen – wählbar, verschiebbar wie an der Wand
  const ISLT = [['us', '3 Schubladen'], ['s2', '2 Auszüge'], ['s4', '4 Schubladen'], ['ut', 'Schublade + Tür'], ['u1', 'Tür'], ['u2', '2 Türen'], ['ui', 'Innenschubladen'], ['gs', 'Spülmaschine'], ['mt', 'Mülltrenner'], ['ap', 'Apotheker']];
  const IKH2 = [['sitz', 'Sitzplatz'], ['schrank', 'Schränke'], ['regal', 'Offenes Regal'], ['wand', 'Glatte Rückwand']];
  const islKh = () => { const k = P.island.kh || 'sitz'; return ['schub', 'tuer', 'mix'].includes(k) ? 'schrank' : k; };
  const islDepth = () => { const d = isl().d, kh = islKh(), I = P.island;
    if ((kh === 'schrank' || kh === 'regal') && I.cb && d - I.cb >= 40) return { cf: d - I.cb, cb: I.cb };   // Raumseite tiefengekürzt (Türen meist 35–40 cm)
    const cf = kh === 'wand' ? d - 3 : (kh === 'schrank' || kh === 'regal') ? (d >= 100 ? 60 : Math.round(d / 2)) : Math.max(40, Math.min(60, d - 25)); return { cf, cb: d - cf }; };
  const ICB = [30, 35, 40, 45, 50, 60];
  let iuid = 1;
  function islGen(kind, w) {
    const n = Math.max(1, Math.round(w / 60)), out = []; let left = w;
    for (let i = 0; i < n; i++) { const rest = n - i, ws = [30, 40, 45, 50, 60, 80, 90, 100, 120], want = left / rest; let best = ws.reduce((a, b) => Math.abs(b - want) < Math.abs(a - want) ? b : a); if (i === n - 1) best = ws.filter(v => v <= left).pop() || 30; best = Math.min(best, left); if (best < 15) break;
      const t = kind === 'tuer' ? (best >= 80 ? 'u2' : 'u1') : kind === 'mix' ? (i % 2 ? (best >= 80 ? 'u2' : 'u1') : 'us') : 'us'; out.push({ id: iuid++, t, w: best }); left -= best; }
    return out;
  }
  function islMods(side) {
    const I = P.island, key = side === 'v' ? 'mv' : 'mh', w = isl().w;
    if (side === 'h' && islKh() !== 'schrank') return [];
    if (side === 'h' && !I.mhV) { if (Array.isArray(I.mh) && I.mh.every(m => m.t === 'us')) I.mh = []; I.mhV = 2; }
    if (!Array.isArray(I[key]) || !I[key].length) I[key] = islGen(side === 'v' ? (I.kv || 'schub') : (['schub', 'tuer', 'mix'].includes(I.kh) ? I.kh : (I.khT || 'tuer')), w);
    I[key].forEach(m => { if (!m.id) m.id = iuid++; else iuid = Math.max(iuid, m.id + 1); });
    let sum = I[key].reduce((a, m) => a + m.w, 0); while (sum > w && I[key].length) { const m = I[key][I[key].length - 1], cut = Math.min(m.w - 15, sum - w); if (cut > 0 && m.w - cut >= 15) { m.w -= cut; sum -= cut; } else { sum -= m.w; I[key].pop(); } }
    return I[key];
  }
  let islSel = null;   // 'v:<id>' oder 'h:<id>'
  function islStrip(side) {
    const mods = islMods(side), W = isl().w, dh = (P.ah || 90) - 90, y0 = FL - 96 - dh; let x = 0, g = '';
    mods.forEach(m => { const on = islSel === side + ':' + m.id; g += `<g data-ism="${side}:${m.id}" style="cursor:pointer">${elev(m, x)}${on ? `<rect x="${x + 1}" y="${FL - 91 - dh}" width="${m.w - 2}" height="${90 + dh}" fill="none" stroke="${ACC}" stroke-width="2.4" rx="2"/>` : ''}</g>`; x += m.w; });
    if (x < W - .5) g += `<rect x="${x}" y="${FL - 90 - dh}" width="${W - x}" height="${80 + dh}" fill="#efe9de" stroke="#cfc6b9" stroke-dasharray="3 3"/><text x="${x + (W - x) / 2}" y="${FL - 45}" text-anchor="middle" font-size="9" fill="#8a7f72">${Math.round(W - x)} cm frei</text>`;
    g += `<rect x="-2" y="${FL - 94 - dh}" width="${W + 4}" height="4" fill="${topCol()}"/>`;
    return `<svg class="kp-isl-sv" viewBox="-6 ${y0} ${W + 12} ${104 + dh}" preserveAspectRatio="xMidYMax meet" aria-label="Insel ${side === 'v' ? 'Kochseite' : 'Raumseite'}">${g}</svg>`;
  }
  // Raumseite ohne Schränke: Bild statt leerer Fläche (Sitzplatz mit Hockern, Regal mit Dingen, glatte Rückwand mit Lichtschimmer)
  function islHView(kh) {
    const W = isl().w, dh = (P.ah || 90) - 90, y0 = FL - 96 - dh, top = FL - 94 - dh, wm = (P.style.wgDek || 'top') === 'top' ? topCol() : fcol(), sh = shade(wm, -.18);
    let g = '';
    if (kh === 'sitz') {
      g += `<rect x="0" y="${top + 4}" width="${W}" height="${FL - top - 4}" fill="${wm}" stroke="${sh}" stroke-width=".5"/><rect x="0" y="${top + 4}" width="${W}" height="10" fill="rgba(0,0,0,.18)"/>`;
      const n = Math.max(2, Math.min(4, Math.floor(W / 55))); for (let i = 0; i < n; i++) { const cx = W * (i + .5) / n, sy = FL - 66;
        g += `<g class="kp-ih-st" style="--d:${.12 + i * .14}s"><ellipse cx="${cx}" cy="${FL - 1}" rx="13" ry="2" fill="rgba(0,0,0,.12)"/><path d="M${cx - 9} ${FL}L${cx - 4} ${sy + 6}M${cx + 9} ${FL}L${cx + 4} ${sy + 6}M${cx - 7} ${FL - 22}h14" stroke="#2c2b29" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="${cx - 13}" y="${sy}" width="26" height="7" rx="3.5" fill="#8b7d6b"/><rect x="${cx - 12}" y="${sy - 16}" width="24" height="15" rx="4" fill="#9a8b77" opacity=".9"/></g>`; }
      g += `<text x="${W / 2}" y="${top + 26}" text-anchor="middle" font-size="7" fill="${xr(wm)}" opacity=".6" font-family="system-ui">30 cm Überstand</text>`;
    } else if (kh === 'regal') {
      g += `<rect x="0" y="${top + 4}" width="${W}" height="${FL - 10 - top - 4}" fill="${shade(wm, -.05)}"/><rect x="0" y="${FL - 10}" width="${W}" height="10" fill="#2b2b2b"/>`;
      const n = Math.max(2, Math.round(W / 60)), mw = W / n, rows = [top + 4, top + 4 + (FL - 14 - top) / 2, FL - 10];
      for (let i = 1; i < n; i++) g += `<rect x="${i * mw - 1}" y="${top + 4}" width="2" height="${FL - 14 - top}" fill="${wm}"/>`;
      rows.forEach(y => g += `<rect x="0" y="${y - 1.5}" width="${W}" height="3" fill="${wm}"/>`);
      const items = (x, y, k) => k % 3 === 0 ? [0, 1, 2, 3].map(j => `<rect x="${x + 8 + j * 6}" y="${y - 24 + (j % 2) * 3}" width="5" height="${24 - (j % 2) * 3}" fill="${['#7d5a43', '#a8724f', '#55616d', '#c9b98f'][j]}"/>`).join('') : k % 3 === 1 ? `<path d="M${x + 10} ${y}h22l-3 -16h-16z" fill="#c9a874"/><path d="M${x + 13} ${y - 10}h16" stroke="#a88a5b"/>` : `<rect x="${x + 14}" y="${y - 12}" width="10" height="12" rx="2" fill="#efe9df"/><circle cx="${x + 19}" cy="${y - 18}" r="7" fill="#6f8f4e"/><circle cx="${x + 25}" cy="${y - 22}" r="5" fill="#7fa05c"/>`;
      for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) g += `<g class="kp-ih-it" style="--d:${.1 + (i * 2 + r) * .08}s">${items(i * mw + (mw - 40) / 2, rows[r + 1] - 1.5, i + r * 2)}</g>`;
    } else {
      g += `<rect x="0" y="${top + 4}" width="${W}" height="${FL - top - 4}" fill="${wm}" stroke="${sh}" stroke-width=".5"/><rect class="kp-ih-sh" style="--sw:${W + 120}px" x="-60" y="${top + 4}" width="50" height="${FL - top - 4}" fill="url(#kpihg)"/>`;
    }
    g += `<rect x="-2" y="${top}" width="${W + 4}" height="4" fill="${topCol()}"/>`;
    return `<svg class="kp-isl-sv kp-ih kp-ih-${kh}" viewBox="-6 ${y0} ${W + 12} ${104 + dh}" preserveAspectRatio="xMidYMax meet" aria-label="Insel Raumseite: ${(IKH2.find(x => x[0] === kh) || ['', ''])[1]}"><defs><linearGradient id="kpihg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${g}</svg>`;
  }
  function islEditor() {
    if (!islSel) return ''; const [side, id] = islSel.split(':'), mods = islMods(side), i = mods.findIndex(m => String(m.id) === id); if (i < 0) return ''; const m = mods[i], ws = M[m.t].ws;
    const free = isl().w - mods.reduce((a, q) => a + q.w, 0);
    return `<div class="kp-isl-ed"><b>${M[m.t].n} · ${m.w} cm</b>${chipRow('Art', 'ist', ISLT.filter(([t]) => M[t]), m.t, 'isme')}<div class="kp-isl-edr"><div class="kp-step"><button type="button" data-isme="w-"${stepW(ws, m.w, -1) === m.w ? ' disabled' : ''} aria-label="schmaler">−</button><span>${m.w} cm</span><button type="button" data-isme="w+"${stepW(ws, m.w, 1) === m.w || stepW(ws, m.w, 1) - m.w > free ? ' disabled' : ''} aria-label="breiter">+</button></div><button type="button" data-isme="l"${i === 0 ? ' disabled' : ''} aria-label="nach links">←</button><button type="button" data-isme="r"${i === mods.length - 1 ? ' disabled' : ''} aria-label="nach rechts">→</button>${hasHinge(m) ? `<button type="button" data-isme="a">Tür ${aOf(m) === 'l' ? 'links' : 'rechts'} ⇄</button>` : ''}<button type="button" data-isme="del" class="kp-del">Entfernen</button></div></div>`;
  }
  function islSideBlock(side) {
    const kh = islKh(), mods = side === 'v' || kh === 'schrank' ? islMods(side) : [], free = isl().w - mods.reduce((a, q) => a + q.w, 0);
    let h = `<div class="kp-isl-side2"><div class="kp-isl-sh"><b>${side === 'v' ? 'Kochseite' : 'Raumseite'}</b><small>${side === 'v' ? 'zur Küchenzeile – hier stehen Sie beim Kochen' : 'zum Raum'}</small></div>`;
    if (side === 'h') h += `<div class="kp-seg">${IKH2.map(([k, n]) => `<button type="button" data-iskh="${k}" class="${kh === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
    if (side === 'v' || kh === 'schrank') h += islStrip(side) + `<div class="kp-isl-add"><button type="button" data-isadd="${side}"${free < 30 ? ' disabled' : ''}>＋ Schrank</button><small>Antippen zum Ändern – Art, Breite, Reihenfolge</small></div>`;
    else h += islHView(kh) + `<p class="kp-isl-h">${({ sitz: '30 cm Überstand – Platz für Barhocker.', regal: 'Offene Fächer zum Raum – für Kochbücher, Körbe und Schönes.', wand: 'Durchgehende, glatte Rückwand.' })[kh]}</p>`;
    if (side === 'h' && (kh === 'schrank' || kh === 'regal')) { const cb = islDepth().cb; h += chipRow(kh === 'regal' ? 'Regal-Tiefe' : 'Tiefe zum Raum', 'iscb', ICB.map(v => [v, v + ' cm' + (v === 40 && kh === 'schrank' ? ' · üblich' : '')]), cb, 'iscb') + `<p class="kp-isl-h">Schränke zum Raum sind meist tiefengekürzt – die Insel wird dabei ${cb + 60 > isl().d ? 'tiefer' : 'passend'}: Kochseite 60 cm + Raumseite ${cb} cm.</p>`; }
    if (side === 'h' && (kh === 'sitz' || kh === 'wand')) { const dk = P.style.wgDek || 'top'; h += chipRow('Optik', 'iswd', [['top', 'Wie Arbeitsplatte'], ['front', 'Wie Fronten']], dk, 'iswd'); }
    if (islSel && islSel[0] === side) h += islEditor();
    return h + '</div>';
  }
  function islandCard() {
    const I = P.island, g = isl();
    const steps = [["w", "Breite", g.w + " cm"], ["d", "Tiefe", g.d + " cm"], ["g", "Durchgang", g.g + " cm"], ["x", "Seitlich", Math.abs(Math.round(g.x - P.room.w / 2)) < 5 ? "mittig" : Math.abs(Math.round(g.x - P.room.w / 2)) + " cm " + (g.x < P.room.w / 2 ? "links" : "rechts")]].map(([k, n, v]) => `<div class="kp-step kp-isl-s"><small>${n}</small><button type="button" data-isa="${k}" data-d="-1" aria-label="${n} verringern">${k === "x" ? "←" : "−"}</button><span>${v}</span><button type="button" data-isa="${k}" data-d="1" aria-label="${n} erhöhen">${k === "x" ? "→" : "+"}</button></div>`).join("");
    return `<div class="kp-isl${curWall === 'I' ? ' on' : ''}" data-isl><div class="kp-isl-top"><div><b>Kochinsel</b><p class="kp-isl-h">Größe und Lage – oder im Grundriss mit dem Finger verschieben</p></div><div class="kp-isl-g">${steps}</div></div>${g.g < 100 ? '<p class="kp-isl-w">Tipp: Mit unter 100 cm Durchgang wird es eng, wenn zwei Personen kochen oder Türen und Spülmaschine offen sind.</p>' : ""}<div class="kp-isl-two">${islSideBlock('v')}${islSideBlock('h')}</div><div class="kp-isl-in"><small class="kp-isl-l">In der Insel</small><div class="kp-seg">${[['kochfeld', 'Mit Kochfeld'], ['spuele', 'Mit Spüle'], ['frei', 'Nur Arbeitsfläche']].map(([k, n]) => `<button type="button" data-isv="${k}" class="${I.v === k ? 'on' : ''}">${n}</button>`).join('')}</div>${I.v === 'kochfeld' ? `<div class="kp-eqs kp-eqs-isl">${IHOODS.map(([v, n, d]) => chip('ihood', v, eqv('ihood', 'mulde') === v, IC.hood(v), n)).join('')}</div>` : ''}</div></div>`;
  }
  tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-wt]'); if (!b) return; curWall = b.dataset.wt; sel = null; renderWalls(); });
  wallsEl.addEventListener('click', e => {
    const a = e.target.closest('[data-isa]'), v = e.target.closest('[data-isv]');
    if (a) { const k = a.dataset.isa, dd = +a.dataset.d, I = P.island, g = isl();
      if (k === 'w') I.w = Math.max(100, Math.min(Math.min(300, P.room.w - 60), g.w + dd * 10));
      if (k === 'd') I.d = Math.max(80, Math.min(130, g.d + dd * 10));
      if (k === 'g') I.g = Math.max(80, Math.min(180, g.g + dd * 5));
      if (k === 'x') I.x = Math.round(g.x - P.room.w / 2 + dd * 10);
      const n = isl(); I.x = Math.round(n.x - P.room.w / 2); I.g = n.g; change(); }
    if (v) { P.island.v = v.dataset.isv; change(); }
    const kh = e.target.closest('[data-iskh]'), sm = e.target.closest('[data-ism]'), ed = e.target.closest('[data-isme]'), ad = e.target.closest('[data-isadd]');
    if (kh) { const I = P.island; I.kh = kh.dataset.iskh; if ((I.kh === 'schrank' || I.kh === 'regal') && (I.d || 100) < 100) I.d = 100; if (I.kh === 'sitz' && (I.d || 100) < 90) I.d = 90; if (islSel && islSel[0] === 'h') islSel = null; change(); return; }
    const cbb = e.target.closest('[data-iscb]'), wdb = e.target.closest('[data-iswd]');
    if (cbb) { const v = +cbb.dataset.v, I = P.island; I.cb = v; I.d = Math.max(80, Math.min(130, 60 + v)); change(); return; }
    if (wdb) { P.style.wgDek = wdb.dataset.v; change(); return; }
    if (sm) { islSel = islSel === sm.dataset.ism ? null : sm.dataset.ism; renderWalls(); return; }
    if (ad) { const side = ad.dataset.isadd, mods = islMods(side), free = isl().w - mods.reduce((a, q) => a + q.w, 0), w = [60, 50, 45, 40, 30].find(v => v <= free); if (w) { const m = { id: iuid++, t: side === 'h' ? 'u1' : 'us', w }; mods.push(m); islSel = side + ':' + m.id; change(); } return; }
    if (ed && islSel) { const [side, id] = islSel.split(':'), mods = islMods(side), i = mods.findIndex(m => String(m.id) === id); if (i < 0) return; const m = mods[i], k = ed.dataset.isme, free = isl().w - mods.reduce((a, q) => a + q.w, 0);
      if (k === 'ist') { m.t = ed.dataset.v; if (!M[m.t].ws.includes(m.w)) m.w = M[m.t].ws.filter(v => v <= m.w + free).pop() || M[m.t].ws[0]; }
      if (k === 'w-' || k === 'w+') { const nw = stepW(M[m.t].ws, m.w, k === 'w+' ? 1 : -1); if (nw - m.w <= free) m.w = nw; }
      if (k === 'l' && i > 0) [mods[i - 1], mods[i]] = [mods[i], mods[i - 1]];
      if (k === 'r' && i < mods.length - 1) [mods[i + 1], mods[i]] = [mods[i], mods[i + 1]];
      if (k === 'a') m.a = aOf(m) === 'l' ? 'r' : 'l';
      if (k === 'del') { mods.splice(i, 1); islSel = null; }
      change(); return; }
  });

  /* ---------------- Ziehen & Ablegen ---------------- */
  let drag = null; const ghost = $('[data-kp-ghost]'), caret = $('[data-kp-caret]'), trash = $('[data-kp-trash]');
  function wallAt(cx, cy) { for (const el of $$('.kp-wall', wallsEl)) { if (getComputedStyle(el).display === 'none') continue; const r = el.getBoundingClientRect(); if (cx >= r.left - 10 && cx <= r.right + 10 && cy >= r.top - 40 && cy <= r.bottom + 30) return el; } return null; }
  function sAt(el, cx) { const svg = $('svg', el), p = svg.createSVGPoint(); p.x = cx; p.y = 0; return p.matrixTransform(svg.getScreenCTM().inverse()).x; }
  function yAt(el, cy) { const svg = $('svg', el), p = svg.createSVGPoint(); p.x = 0; p.y = cy; return p.matrixTransform(svg.getScreenCTM().inverse()).y; }
  function insIndex(w, s, skipId) { const L = layout(w, skipId); let i = 0; for (const m of P.rows[w]) { if (m.id === skipId) { i++; continue; } if (s < L.X.get(m) + m.w / 2) return i; i++; } return P.rows[w].length; }
  function caretX(w, idx, skipId) { const L = layout(w, skipId), r = P.rows[w]; for (let j = idx; j < r.length; j++) if (r[j].id !== skipId) return L.X.get(r[j]); let e = range(w)[0]; for (let j = r.length - 1; j >= 0; j--) if (r[j].id !== skipId) { e = L.X.get(r[j]) + r[j].w; break; } return e; }
  const palById = k => PAL.find(p => p.k === k);
  function startDrag(e, kind, payload) { drag = { kind, ...payload, x0: e.clientX, y0: e.clientY, on: false, pid: e.pointerId }; }
  function tileSvg(t, w, o = {}) {
    const c = M[t], m = { t, w, ...o, _cs: c.corner ? 'l' : null };
    if (c.h === 'u') { const u = { ...m, s: 0, h: o.h || HDEF(t) }, [hx, hy, hw, hh] = upHit(u, 0); return { vb: `-3 ${hy - 3} ${w + 6} ${hh + 6}`, cls: 'u', svg: upElev(u, 0) }; }
    if (c.h === 't') { const Ht = hOf(m); return { vb: `-3 ${FL - Ht - 4} ${w + 6} ${Ht + 8}`, cls: 't', svg: elev(m, 0) }; }
    return { vb: `-3 ${FL - 128} ${w + 6} 132`, cls: 'b', svg: elev(m, 0) };
  }
  function upTarget(e, el) {
    const w = el.dataset.wall, pe = drag.pe, t = pe.t, width = M[t].w, sx = sAt(el, e.clientX);
    // auf vorhandenen Hängeschrank gezogen → tauschen
    const hit = upList(w).find(u => sx >= u.s && sx <= u.s + u.w);
    if (hit && !(t === 'dh') !== !(hit.t === 'dh')) { /* Haube nur gegen Haube tauschen */ }
    else if (hit) return { w, s: hit.s, width: hit.w, rep: hit.id, ok: true, t, a: pe.o && pe.o.a };
    const tmp = { t, w: width, h: HDEF(t) }, saved = P.up[w]; if (!P.up[w]) P.up[w] = autoUp(w).map(u => ({ ...u }));
    const s = hoodSnap(w, tmp, resolveUp(w, tmp, sx - width / 2)); const ok = s != null && !upConflict(w, { ...tmp, s });
    if (!saved) delete P.up[w];
    return { w, s: s == null ? Math.round(sx - width / 2) : s, width, ok: s != null, warn: !ok, t, a: pe.o && pe.o.a };
  }
  function dragMove(e) {
    if (!drag) return;
    if (!drag.on) { const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0; if (Math.hypot(dx, dy) < 7) return; if (drag.kind === 'pal' && drag.touch && Math.abs(dx) > Math.abs(dy) * 1.2) { drag = null; return; } drag.on = true; beginGhost(); }
    e.preventDefault();
    ghost.style.transform = `translate(${e.clientX - drag.gw / 2}px,${e.clientY - drag.gh * .7}px)`;
    const el = wallAt(e.clientX, e.clientY);
    if (drag.kind === 'op') { const o = opById(drag.oid); if (o && el && el.dataset.wall === o.wall) { o.s = clampOp(o, drag.ws + (sAt(el, e.clientX) - drag.s0)); renderWalls(); schedule3D(); } return; }
    if (drag.kind === 'plan') { planMove(e); return; }
    if (drag.kind === 'cx') { const c = cxById(drag.cid); if (c && el && el.dataset.wall === c.wall) { c.s = clampCx(c, drag.cs + (sAt(el, e.clientX) - drag.s0)); const dh = drag.sy0 - yAt(el, e.clientY); if (drag.vm || Math.abs(dh) >= 6) { drag.vm = 1; setCxH(c, drag.h0 + dh, true); } renderWalls(); } return; }
    if (drag.kind === 'cxplan') { cxPlanMove(e); return; }
    if (drag.kind === 'up') {
      const u = (P.up[drag.wall] || []).find(x => x.id === drag.uid); if (!u) return;
      if (el && el.dataset.wall === drag.wall) { trash.classList.remove('hot'); drag.raw = drag.us + (sAt(el, e.clientX) - drag.s0); const s = hoodSnap(drag.wall, u, resolveUp(drag.wall, u, drag.raw)); if (s != null) u.s = s; ghostId = null; renderWalls(); schedule3D(); }
      else if (!el) { trash.classList.add('hot'); ghostId = u.id; renderWalls(); }
      return;
    }
    if (drag.kind === 'pal' && isUp(drag.t)) {
      if (el) { const tg = upTarget(e, el); drag.target = tg; prev = { w: tg.w, s: tg.s, width: tg.width, t: tg.t, a: tg.a, ok: tg.ok && !tg.warn }; caret.hidden = true; el.classList.add('hov'); $$('.kp-wall.hov', wallsEl).forEach(x => x !== el && x.classList.remove('hov')); }
      else { drag.target = null; prev = null; $$('.kp-wall.hov', wallsEl).forEach(x => x.classList.remove('hov')); }
      renderWalls(); return;
    }
    if (el) {
      const w = el.dataset.wall, idx = clampIdx(w, insIndex(w, sAt(el, e.clientX), drag.id));
      drag.target = { w, idx }; const svg = $('svg', el), m = svg.getScreenCTM();
      const px = m.a * caretX(w, idx, drag.id) + m.e; caret.hidden = false; caret.style.left = px + 'px'; caret.style.top = (m.f + m.d * (FL - 120)) + 'px'; caret.style.height = (m.d * 120) + 'px';
      trash.classList.remove('hot'); el.classList.add('hov'); $$('.kp-wall.hov', wallsEl).forEach(x => x !== el && x.classList.remove('hov'));
    } else { drag.target = null; caret.hidden = true; $$('.kp-wall.hov', wallsEl).forEach(x => x.classList.remove('hov')); if (drag.kind === 'mod') trash.classList.add('hot'); }
  }
  function beginGhost() {
    pop.hidden = true;
    if (drag.kind === 'op' || drag.kind === 'plan') { ghost.innerHTML = ''; drag.gw = drag.gh = 0; selOp = drag.oid; selCx = null; sel = null; return; }
    if (drag.kind === 'cx' || drag.kind === 'cxplan') { ghost.innerHTML = ''; drag.gw = drag.gh = 0; selCx = drag.cid; selOp = null; sel = null; return; }
    if (drag.kind === 'up') { ghost.innerHTML = ''; drag.gw = drag.gh = 0; if (drag.auto) { const map = materialize(drag.wall); drag.uid = map[drag.uid]; } const u = P.up[drag.wall].find(x => x.id === drag.uid); if (u) drag.us = u.s; sel = drag.uid; selOp = null; selCx = null; trash.hidden = false; root.classList.add('dragging'); return; }
    const t = drag.t, tl = tileSvg(t, drag.w || M[t].w, drag.o || {}), sc = 1.35, [vx, vy, vw, vh] = tl.vb.split(' ').map(Number);
    ghost.innerHTML = `<svg viewBox="${tl.vb}" width="${vw * sc}" height="${vh * sc}">${tl.svg}</svg><span>${drag.pe ? drag.pe.n : M[t].n}</span>`;
    drag.gw = vw * sc; drag.gh = vh * sc; ghost.hidden = false; root.classList.add('dragging');
    if (drag.kind === 'mod') { ghostId = drag.id; trash.hidden = false; renderWalls(); }
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { }
  }
  function dragEnd(e) {
    if (!drag) return; const d = drag; drag = null; const hadPrev = !!prev; prev = null;
    ghost.hidden = true; caret.hidden = true; trash.hidden = true; trash.classList.remove('hot'); root.classList.remove('dragging'); $$('.kp-wall.hov', wallsEl).forEach(x => x.classList.remove('hov'));
    if (d.kind === 'cx' || d.kind === 'cxplan') { if (d.on) { change(); const c = cxById(d.cid); if (c) cxFollow(c); } else { selCx = selCx === d.cid ? null : d.cid; sel = null; selOp = null; renderWalls(); } return; }
    if (d.kind === 'op' || d.kind === 'plan') { if (d.on) change(); else { selOp = selOp === d.oid ? null : d.oid; sel = null; renderWalls(); } return; }
    if (d.kind === 'up') {
      if (!d.on) {
        let id = d.uid; if (d.auto) { const map = materialize(d.wall); id = map[d.uid]; }
        if (armed) { const u = P.up[d.wall].find(x => x.id === id); if (u) { const old = { ...u }; setUpType(u, armed.t, armed.o); const s2 = resolveUp(d.wall, u, u.s, true); if (s2 == null) Object.assign(u, old); else u.s = s2; } disarm(); sel = id; change(); pulse(id, 1); return; }
        if (d.auto) { sel = id; change(); return; } sel = sel === id ? null : id; selOp = null; selCx = null; renderWalls(); return; }
      ghostId = null; const list = P.up[d.wall] || [], u = list.find(x => x.id === d.uid);
      if (u && !wallAt(e.clientX, e.clientY)) { const i = list.indexOf(u); list.splice(i, 1); sel = null; toast(`${M[u.t].n} entfernt`, undo); }
      else if (u && u.t === 'dh') {
        // Haube nah am Kochfeld losgelassen, aber ein Hängeschrank sitzt dort: Haube nimmt den Platz über dem Kochfeld, der Schrank rückt zur Seite
        const h = d.raw == null ? null : hobsOf(d.wall).find(q => Math.abs(q.c - (d.raw + u.w / 2)) <= HSNAP), L = wallLen(d.wall);
        if (h && Math.abs(h.c - (u.s + u.w / 2)) >= 1) { const c = Math.round(h.c - u.w / 2); if (c >= 0 && c + u.w <= L && !list.some(o => o !== u && o.t === 'dh' && ov(o.s, o.w, c, u.w))) { u.s = c; const g = clearAround(d.wall, u); toast(g ? 'Die Haube sitzt über dem Kochfeld – ein Hängeschrank hatte daneben keinen Platz mehr.' : 'Die Haube sitzt über dem Kochfeld – der Hängeschrank ist zur Seite gerückt.', undo); } }
        relinkHood(d.wall, u);
      }
      change(); return;
    }
    if (!d.on) { // Tippen
      if (d.kind === 'pal') addEntry(d.pe);
      else if (d.kind === 'mod') { disarm(); sel = sel === d.id ? null : d.id; selOp = null; selCx = null; renderWalls(); }
      return;
    }
    ghostId = null;
    if (d.kind === 'pal') {
      if (isUp(d.t)) { if (d.target) placeUp(d.target, d.pe); else if (hadPrev) renderWalls(); else renderWalls(); return; }
      if (M[d.t].corner) { if (d.target) addCorner(d.t); else renderWalls(); return; }
      if (d.target && d.t === 'sp' && sinkCount()) { const tg = d.target; renderWalls(); askSink(() => insert(tg.w, tg.idx, mk(d.t, 0, d.pe && d.pe.o))); }
      else if (d.target) insert(d.target.w, d.target.idx, mk(d.t, 0, d.pe && d.pe.o)); else renderWalls();
    }
    if (d.kind === 'mod') {
      const fromW = d.from, m = P.rows[fromW].find(x => x.id === d.id);
      if (!d.target) { P.rows[fromW] = P.rows[fromW].filter(x => x.id !== d.id); sel = null; toast(`${M[m.t].n} entfernt`, undo); change(); return; }
      let idx = d.target.idx; const oldIdx = P.rows[fromW].indexOf(m);
      P.rows[fromW].splice(oldIdx, 1); if (d.target.w === fromW && idx > oldIdx) idx--;
      insert(d.target.w, idx, m, true);
    }
  }
  function insert(w, idx, m) {
    P.rows[w].splice(idx, 0, m); curWall = w;
    makeRoom(w, m);
    sel = m.id; change(); pulse(m.id);
    // Herd mit Backofen darunter und Muldenlüfter passen nicht in einen Schrank – das Neue gewinnt
    if (m.t === 'ko' && isDD()) { koWhy = 1; setEq('hobV', 'normal'); koWhy = 0; }
  }
  function makeRoom(w, keep) {
    let over = -free(w); if (over <= 0.5) return;
    const R = [...P.rows[w]].reverse().filter(x => x.t === 'us' && x !== keep);
    for (const x of R) { if (over <= 0.5) break; const nw = Math.max(0, x.w - over); const fit = M.us.ws.filter(v => v <= nw).pop(); if (fit) { over -= x.w - fit; x.w = fit; } else { over -= x.w; P.rows[w] = P.rows[w].filter(y => y !== x); } }
    if (over > 0.5) toast(`Die Küche ${WAN[w]} ist ${Math.round(over)} cm zu lang für die Wand – einen Schrank herausnehmen oder schmaler machen.`);
  }
  function addTo(w, t, o) {
    const m = mk(t, 0, o); const rowsW = P.rows[w];
    let idx = rowsW.length;
    const spI = rowsW.findIndex(x => x.t === 'sp');
    if (t === 'gs' && spI >= 0) idx = spI + 1; else if (t === 'sp') { const gI = rowsW.findIndex(x => x.t === 'gs'); if (gI >= 0) idx = gI; }
    else if (M[t].h === 't') idx = 0;
    else { const u = rowsW.map((x, i) => [x, i]).filter(([x]) => x.t === 'us').pop(); if (u) idx = u[1]; }
    insert(w, clampIdx(w, idx), m);
  }
  function addCorner(t) {
    if (!hasCornerSlot('l') && !hasCornerSlot('r')) { toast('Eckschränke gibt es in L- und U-Küchen – Form bei „1 Form & Raum“ umstellen.'); return; }
    const N = P.rows.N, m = mk(t), isC = x => x && M[x.t].corner;
    const side = hasCornerSlot('l') && !isC(N[0]) ? 'l' : hasCornerSlot('r') && !isC(N[N.length - 1]) ? 'r' : hasCornerSlot('l') ? 'l' : 'r';
    const idx = side === 'l' ? 0 : N.length - 1, old = N[idx];
    if (old && (isC(old) || PLAIN.includes(old.t))) N.splice(idx, 1, m); else if (side === 'l') N.unshift(m); else N.push(m);
    curWall = 'N'; makeRoom('N', m); ['W', 'E'].forEach(w => P.rows[w] && makeRoom(w));
    sel = m.id; change(); pulse(m.id);
    toast(old && (isC(old) || PLAIN.includes(old.t)) ? `${M[t].n} ${M[t].s} sitzt jetzt in der Ecke (statt ${M[old.t].n.toLowerCase() === 'eckschrank' ? 'des alten Eckschranks' : 'des Unterschranks'}).` : `${M[t].n} ${M[t].s} sitzt jetzt in der Ecke.`, undo);
  }
  function addUp(w, t, o) {
    if (!P.rows[w]) return; materialize(w);
    const f = sel != null && findSel();
    const width = M[t].w, hs = t === 'dh' ? hobsOf(w).map(h => Math.round(h.c - width / 2)).find(x => x >= 0 && x + width <= wallLen(w) && !P.up[w].some(o => ov(o.s, o.w, x, width))) : null, s = hs != null ? hs : freeUpSpot(w, t, width);
    if (s == null) {
      if (f && f.up && f.w === w) { const u = f.m; setUpType(u, t, o); change(); toast(`Hängeschrank getauscht: ${M[t].n} · ${variant(u)}`, undo); return; }
      armed = { t, o }; root.classList.add('kp-arm'); toast(`Oben ist alles belegt – tippen Sie jetzt den Hängeschrank an, der zu „${M[t].n} · ${variant({ t, w: M[t].w, a: o && o.a })}“ werden soll.`); return;
    }
    const u = { id: uid++, t, s, w: width }; if (o && o.a) u.a = o.a; if (t === 'he' && !u.a) u.a = s + width / 2 < wallLen(w) / 2 ? 'r' : 'l'; P.up[w].push(u); P.up[w].sort((a, b) => a.s - b.s); curWall = w; sel = u.id; change(); pulse(u.id, 1);
  }
  let armed = null;
  function disarm() { armed = null; root.classList.remove('kp-arm'); }
  function setUpType(u, t, o) {
    u.t = t; const c = M[t]; if (!c.ws.includes(u.w)) u.w = c.ws.reduce((a, v) => Math.abs(v - u.w) < Math.abs(a - u.w) ? v : a, c.ws[0]);
    if (!c.hs) delete u.h; else if (u.h && !c.hs.includes(u.h)) delete u.h; if (o && o.a) u.a = o.a; if (!c.hinge) delete u.a;
  }
  function placeUp(tg, pe) {
    const w = tg.w; materialize(w); const list = P.up[w];
    if (tg.rep != null) { const u = list.find(x => x.id === tg.rep) || list.find(x => Math.abs(x.s - tg.s) < 1); if (u) { const old = u.w; setUpType(u, pe.t, pe.o); const s = resolveUp(w, u, u.s, true); if (s == null) { u.w = old; } else u.s = s; sel = u.id; curWall = w; change(); pulse(u.id, 1); return; } }
    if (!tg.ok) { toast('Dort ist kein Platz – ein anderer Hängeschrank ist im Weg.'); renderWalls(); return; }
    const u = { id: uid++, t: pe.t, s: tg.s, w: tg.width }; if (pe.o && pe.o.a) u.a = pe.o.a; if (u.t === 'he' && !u.a) u.a = u.s + u.w / 2 < wallLen(w) / 2 ? 'r' : 'l'; list.push(u); list.sort((a, b) => a.s - b.s); sel = u.id; curWall = w; change(); pulse(u.id, 1);
    if (upConflict(w, u)) toast(upConflict(w, u) === 'win' ? (u.t === 'dh' ? 'Achtung: Die Haube hängt vor einem Fenster oder einer Tür.' : 'Achtung: Der Hängeschrank hängt vor einem Fenster oder einer Tür.') : 'Achtung: Der Hängeschrank stößt an einen Hochschrank.');
  }
  function addEntry(pe) { const c = M[pe.t];
    if (curWall === 'I') { const ok = ISLT.some(([t]) => t === pe.t), mods = islMods('v'), free = isl().w - mods.reduce((a2, q) => a2 + q.w, 0); if (ok) { const w = [pe.t === 'gs' ? 60 : c.w, 60, 50, 45, 40, 30].find(v => v <= free && c.ws.includes(v)); if (w) { const m = { id: iuid++, t: pe.t, w }; if (pe.o && pe.o.a) m.a = pe.o.a; mods.push(m); islSel = 'v:' + m.id; change(); return; } toast('In der Insel ist kein Platz mehr – erst einen Schrank schmaler machen.'); return; } curWall = FORMS[P.form].walls[0]; } if (c.corner) return addCorner(pe.t); if (c.h === 'u') return addUp(curWall, pe.t, pe.o); if (pe.t === 'sp') return askSink(() => addTo(curWall, pe.t, pe.o)); addTo(curWall, pe.t, pe.o); }
  const sinkCount = () => Object.values(P.rows).reduce((a, r) => a + r.filter(m => m.t === 'sp').length, 0) + (P.form === 'insel' && P.island.v === 'spuele' ? 1 : 0);
  function askSink(go) { if (sinkCount() < 1) return go(); ask('Sie haben schon eine Spüle geplant – trotzdem eine zweite?', 'Ja, zweite Spüle', go); }
  function pulse(id, up) { requestAnimationFrame(() => { const g = $(`[data-${up ? 'u' : 'm'}="${id}"]`, wallsEl); if (g && g.animate) g.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 420 }); }); }
  // Palette mit Gruppen
  const palEl = $('[data-kp-pal]'), catsEl = $('[data-kp-cats]'), cathEl = $('[data-kp-cath]'); let cat = 'unten';
  function renderPal() {
    if (catsEl) catsEl.innerHTML = CATS.map(([k, n]) => `<button type="button" data-cat="${k}" class="${k === cat ? 'on' : ''}" aria-pressed="${k === cat}">${n}<small>${PAL.filter(p => p.c === k).length}</small></button>`).join('');
    if (cathEl) cathEl.textContent = CATH[cat] || '';
    palEl.innerHTML = PAL.filter(p => !catsEl || p.c === cat).map(p => { const tl = tileSvg(p.t, M[p.t].w, p.o || {}); return `<button type="button" class="kp-tile" data-pal="${p.k}" title="${M[p.t].n} – ${M[p.t].s}"><svg viewBox="${tl.vb}" class="${tl.cls}" aria-hidden="true">${tl.svg}</svg><b>${p.n}</b><small>${p.s}</small></button>`; }).join('');
    syncPalFx();
  }
  if (catsEl) catsEl.addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; renderPal(); palEl.scrollLeft = 0; });
  palEl.addEventListener('pointerdown', e => { const b = e.target.closest('[data-pal]'); if (!b) return; disarm(); const pe = palById(b.dataset.pal); startDrag(e, 'pal', { t: pe.t, pe, o: pe.o, touch: e.pointerType !== 'mouse' }); });

  /* ---------------- v7: Schrankleiste am Handy – weicher Rand, einmaliger Anstupser, Wisch-Hinweis ---------------- */
  // Nur unter 1000 px (dort ist die Leiste in Schritt 2 ein waagrechter Streifen) – am Desktop passiert hier nichts.
  // Streifen: weicher Rand rechts (links, sobald gescrollt); beim ersten Sehen rollt er einmal ~76 px nach rechts und zurück,
  // dazu „← wischen · antippen zum Einsetzen →“, bis die Leiste zum ersten Mal berührt oder gescrollt wird.
  // Gruppen-Reiter darüber: gleicher Rand + ein Anstupser – nur, wenn sie wirklich überlaufen. Reduzierte Bewegung: nur Hinweis.
  const MOBQ = typeof matchMedia === 'function' ? matchMedia('(max-width: 999px)') : { matches: false };
  // Handy quer: 3D links fest, Bedienung rechts (siehe kp.css „Handy quer“)
  const LANDQ = typeof matchMedia === 'function' ? matchMedia('(max-width: 999px) and (orientation: landscape) and (max-height: 560px)') : { matches: false };
  const palFx = { seen: false, done: false, chip: null, run: null, catsDone: false };
  const ovX = el => !!el && el.clientWidth > 0 && el.scrollWidth - el.clientWidth > 4;
  function edgeFx(el) {
    if (!el) return; const on = MOBQ.matches && ovX(el), max = el.scrollWidth - el.clientWidth;
    el.classList.toggle('kp-ov', on); el.classList.toggle('kp-fl', on && el.scrollLeft > 2); el.classList.toggle('kp-fr', on && el.scrollLeft < max - 2);
  }
  function syncPalFx() { edgeFx(palEl); edgeFx(catsEl); if (palFx.chip) palFx.chip.classList.toggle('on', !palFx.done && MOBQ.matches && ovX(palEl)); }
  [palEl, catsEl].forEach(el => { if (!el) return; let q = 0; el.addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(() => { q = 0; edgeFx(el); }); }, { passive: true }); });
  // Einmal kurz nach rechts und zurück – echtes Scrollen (Rasten solange aus); ein Fingertipp übernimmt sofort
  function nudgeX(el, dist, then) {
    const s0 = el.scrollLeft, d = Math.min(dist, el.scrollWidth - el.clientWidth - s0); if (d < 8) { if (then) then(); return null; }
    const T1 = 560, TH = 160, T2 = 640, ez = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; let t0 = 0, raf = 0, end = false;
    const stop = fin => { if (end) return; end = true; cancelAnimationFrame(raf); if (fin) el.scrollLeft = s0; el.classList.remove('kp-nudge'); if (then) then(fin); };
    const f = now => { if (end) return; if (!t0) t0 = now; const t = now - t0; if (t >= T1 + TH + T2) return stop(true); el.scrollLeft = s0 + d * (t < T1 ? ez(t / T1) : t < T1 + TH ? 1 : 1 - ez((t - T1 - TH) / T2)); raf = requestAnimationFrame(f); };
    el.classList.add('kp-nudge'); raf = requestAnimationFrame(f); return { stop: () => stop(false) };
  }
  function palChip() {
    if (palFx.chip || palFx.done) return;
    const c = document.createElement('div'); c.className = 'kp-palhint'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<i>←</i>wischen · antippen zum Einsetzen<i>→</i>';
    palEl.parentNode.insertBefore(c, palEl); palFx.chip = c; requestAnimationFrame(() => requestAnimationFrame(syncPalFx));
  }
  function catsNudge() { if (palFx.catsDone || RMO || drag || !MOBQ.matches || !ovX(catsEl)) return; palFx.catsDone = true; nudgeX(catsEl, 48); }
  function palFirstView() {
    if (palFx.seen || palFx.done || !MOBQ.matches || !ovX(palEl)) return; palFx.seen = true;
    try { if (localStorage.getItem('kp-palseen')) { palFx.done = true; return; } localStorage.setItem('kp-palseen', '1'); } catch (e) { }
    const t0 = Date.now();
    // erst wenn die 3D-Ansicht steht (sonst ruckelt es am Handy) – spätestens ~2,6 s nach dem ersten Sehen
    const wait = () => { if (palFx.done) return; if (document.hidden || (!K && Date.now() - t0 < 2600)) { setTimeout(wait, 200); return; } setTimeout(go2, K ? 450 : 0); };
    const go2 = () => {
      if (palFx.done || drag) return; palChip();
      if (RMO || !ovX(palEl)) { setTimeout(catsNudge, 300); return; }
      palFx.run = nudgeX(palEl, 76, fin => { palFx.run = null; setTimeout(catsNudge, fin ? 300 : 1600); });
    };
    setTimeout(wait, 1100);
  }
  // Erste echte Berührung / Scroll-Geste an der Leiste: Anstupser sofort beenden, Hinweis ausblenden – für den Rest des Besuchs
  const palTouched = () => {
    if (palFx.run) palFx.run.stop(); if (palFx.done) return; palFx.done = true;
    const c = palFx.chip; if (c) { c.classList.remove('on'); setTimeout(() => { c.remove(); if (palFx.chip === c) palFx.chip = null; }, 450); }
  };
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(ev => palEl.addEventListener(ev, palTouched, { passive: true }));
  if (catsEl) catsEl.addEventListener('pointerdown', () => { palFx.catsDone = true; }, { passive: true });
  if (typeof IntersectionObserver === 'function') new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { syncPalFx(); palFirstView(); } }, { threshold: .5 }).observe(palEl);
  { let q = 0; addEventListener('resize', () => { if (!q) q = requestAnimationFrame(() => { q = 0; syncPalFx(); const r = palEl.getBoundingClientRect(); if (r.width && r.top < innerHeight && r.bottom > 0) palFirstView(); }); }); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncPalFx).catch(() => { });
  wallsEl.addEventListener('pointerdown', e => {
    const gu = e.target.closest('[data-u]'), g = e.target.closest('[data-m]'), wn = e.target.closest('[data-op]'), bs = e.target.closest('[data-bs]');
    const wallEl = e.target.closest('.kp-wall'), hadEq = !!eqSel; eqSel = null;
    const tr = e.target.closest('[data-pf],[data-wg]');
    if (tr && wallEl && !gu && !g) { disarm(); const k = tr.dataset.pf ? 'pf' : 'wg', wv = tr.dataset.pf || tr.dataset.wg; openEq({ k, wall: wv, q: `[data-${k}="${wv}"]` }); e.preventDefault(); return; }
    if (bs && wallEl && !gu && !g) { disarm(); openEq({ k: 'bs', wall: bs.dataset.bs, q: `[data-bs="${bs.dataset.bs}"]` }); e.preventDefault(); return; }
    if (hadEq && !gu && !g && !wn) { renderWalls(); }
    const cxe = e.target.closest('[data-cx]'); if (cxe && wallEl) { const c = cxById(+cxe.dataset.cx); if (c) { startDrag(e, 'cx', { cid: c.id, s0: sAt(wallEl, e.clientX), cs: c.s, sy0: yAt(wallEl, e.clientY), h0: c.t === 'heiz' ? hzY(c) : cxH(c) }); e.preventDefault(); return; } }
    if (gu && wallEl) { const w = wallEl.dataset.wall, id = gu.dataset.u, auto = id[0] === 'a', u = upList(w).find(x => String(x.id) === id); if (!u) return; startDrag(e, 'up', { wall: w, uid: auto ? id : +id, auto, s0: sAt(wallEl, e.clientX), us: u.s }); e.preventDefault(); return; }
    if (g && wallEl) { const w = wallEl.dataset.wall, id = +g.dataset.m, m = P.rows[w].find(x => x.id === id); startDrag(e, 'mod', { id, t: m.t, w: m.w, o: { h: m.h, a: m.a }, from: w, idx0: P.rows[w].indexOf(m) }); e.preventDefault(); return; }
    if (wn && wallEl) { const o = opById(+wn.dataset.op); startDrag(e, 'op', { oid: o.id, s0: sAt(wallEl, e.clientX), ws: o.s }); e.preventDefault(); return; }
    if (armed) disarm();
    if (wallEl && (sel || selOp || selCx)) { sel = null; selOp = null; selCx = null; renderWalls(); }
  });
  addEventListener('pointermove', dragMove, { passive: false });
  addEventListener('pointerup', dragEnd); addEventListener('pointercancel', () => { if (drag) { drag.target = null; drag.on = false; drag = null; prev = null; ghost.hidden = true; caret.hidden = true; trash.hidden = true; ghostId = null; root.classList.remove('dragging'); renderWalls(); } });
  addEventListener('touchmove', e => { if (drag && drag.on) e.preventDefault(); }, { passive: false });

  /* ---------------- Auswahl-Popup ---------------- */
  const pop = $('[data-kp-pop]'); const openNow = new Set();
  function findSel() {
    for (const w in P.rows) { const i = P.rows[w].findIndex(x => x.id === sel); if (i >= 0) return { w, i, m: P.rows[w][i], up: false, cs: cornerSide(w, i) }; }
    for (const w in P.up) { const i = P.up[w].findIndex(x => x.id === sel); if (i >= 0) return { w, i, m: P.up[w][i], up: true, cs: null }; }
    return null;
  }
  const ICON_L = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M15 4.5L4.5 10L15 15.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.4"/></svg>';
  const ICON_R = ICON_L.replace('M15 4.5L4.5 10L15 15.5', 'M5 4.5L15.5 10L5 15.5');
  function stepW(ws, cur, dir) { if (dir > 0) return ws.find(v => v > cur) ?? cur; const lo = ws.filter(v => v < cur); return lo.length ? lo[lo.length - 1] : cur; }
  function renderPop() {
    if (eqSel) return renderEqPop();
    pop.classList.remove('kp-pop-eq');
    if (selOp && opById(selOp)) return renderOpPop();
    if (selCx && cxById(selCx) && !(sel != null && findSel())) return renderCxPop();
    const f = sel != null && findSel(); if (!f) { pop.hidden = true; return; }
    const { w, i, m, up, cs } = f, c = M[m.t], ws = c.ws, n = P.rows[w].length;
    const canL = up ? true : i > 0 && !c.corner && !(i === 1 && M[P.rows[w][0].t].corner && cs !== 'r' && cornerSide(w, 0) === 'l');
    const canR = up ? true : i < n - 1 && !c.corner && !(i === n - 2 && M[P.rows[w][n - 1].t].corner && cornerSide(w, n - 1) === 'r');
    const kinds = up ? (m.t !== 'dh' ? UPK : null) : PLAIN.includes(m.t) ? PLK : ['vo', 'vg', 'ah', 'bs'].includes(m.t) ? TLK : null;
    let h = `<div class="kp-pt"><b>${c.n} <small>${variant(m, cs)}</small></b><button type="button" class="kp-px" data-p="x" aria-label="Auswahl schließen">×</button></div>`;
    h += `<div class="kp-prow"><span class="kp-pl">Breite</span><div class="kp-step"><button type="button" data-p="w-"${stepW(ws, m.w, -1) === m.w ? ' disabled' : ''} aria-label="schmaler">−</button><span>${m.w} cm</span><button type="button" data-p="w+"${stepW(ws, m.w, 1) === m.w ? ' disabled' : ''} aria-label="breiter">+</button></div></div>`;
    if (c.hs) h += `<div class="kp-prow"><span class="kp-pl">Höhe</span><div class="kp-chips" role="group" aria-label="Höhe">${c.hs.map(v => `<button type="button" data-p="h" data-v="${v}" class="${hOf(m) === v ? 'on' : ''}" aria-pressed="${hOf(m) === v}">${v}</button>`).join('')}<em>cm</em></div></div>`;
    if (c.h === 't') { const fits = AX.filter(v => hOf(m) + v <= AXMAX); if (fits.length) h += `<div class="kp-prow"><span class="kp-pl">Aufsatz</span><div class="kp-chips" role="group" aria-label="Aufsatzschrank">${[0, ...fits].map(v => `<button type="button" data-p="ax" data-v="${v}" class="${axOf(m) === v ? 'on' : ''}" aria-pressed="${axOf(m) === v}">${v ? v : 'ohne'}</button>`).join('')}<em>cm</em></div></div>`; if (axOf(m)) { const ao = m.axo || (axOf(m) <= 40 ? 'klappe' : m.w > 60 ? 'zwei' : (m.a || 'r')); h += chipRow('Aufsatz öffnet', 'axo', [['klappe', 'Klappe nach oben'], ...(m.w > 60 ? [['zwei', 'Zwei Türen']] : [['l', 'Tür links'], ['r', 'Tür rechts']])], ao, 'p'); } }
    if (['vo', 'bo', 'bm'].includes(m.t)) { if (m.t !== 'vo' || hOf(m) >= 150) h += chipRow('Unten', 'tu', [[m.t === 'vo' ? 'tuer' : 'schub', m.t === 'vo' ? 'Tür' : 'Schubladen'], [m.t === 'vo' ? 'schub' : 'tuer', m.t === 'vo' ? 'Schubladen' : 'Tür']], m.tu || (m.t === 'vo' ? 'tuer' : 'schub'), 'p');
      if (m.t === 'bm') h += chipRow('Oberes Gerät', 'g2', [['micro', 'Mikrowelle sichtbar'], ['steam', 'Dampfgarer sichtbar'], ['klappe', 'Mikrowelle hinter Klappe']], m.g2 || 'micro', 'p');
      if (m.t !== 'vo') h += chipRow('Ganz oben', 'to', [['tuer', 'Tür'], ['klappe', 'Klappe nach oben']], m.to || 'tuer', 'p'); }
    if (hasHinge(m, cs)) { const a = aOf(m, cs); h += `<div class="kp-prow"><span class="kp-pl">Tür öffnet</span><div class="kp-chips" role="group" aria-label="Türanschlag">${[['l', 'nach links', ICON_L], ['r', 'nach rechts', ICON_R]].map(([k, nm, ic]) => `<button type="button" data-p="a" data-v="${k}" class="${a === k ? 'on' : ''}" aria-pressed="${a === k}">${ic}${nm}</button>`).join('')}</div></div>`; }
    if (kinds) h += `<div class="kp-prow kp-kinds"><span class="kp-pl">Art</span><div class="kp-chips" role="group" aria-label="Art">${kinds.map(([t, nm]) => `<button type="button" data-p="t" data-v="${t}" class="${m.t === t ? 'on' : ''}" aria-pressed="${m.t === t}">${nm}</button>`).join('')}</div></div>`;
    if (up && m.t !== 'dh') h += chipRow('Licht darunter', 'led', [[1, 'Mit Licht'], [0, 'Ohne Licht']], upLed(m) ? 1 : 0, 'p');
    if (m.t === 'sp') h += eqRows('sp', m); if (m.t === 'kf' || m.t === 'ko') h += eqRows('kf', m); if (m.t === 'dh') h += eqRows('dh', m);
    const isO = openNow.has(String(m.id)) || (K && K.isAllOpen && K.isAllOpen());
    h += `<div class="kp-pb">${canL || canR ? `<button type="button" data-p="l"${canL ? '' : ' disabled'} aria-label="nach links">←</button><button type="button" data-p="r"${canR ? '' : ' disabled'} aria-label="nach rechts">→</button>` : ''}${openable(m) && K ? `<button type="button" data-p="o" class="kp-ob">${isO ? 'In 3D schließen' : 'In 3D öffnen'}</button>` : ''}<button type="button" data-p="del" class="kp-del">Entfernen</button></div>`;
    pop.innerHTML = h; pop.hidden = false;
    const g = $(`[data-${up ? 'u' : 'm'}="${m.id}"]`, wallsEl); if (!g || !g.getBoundingClientRect().width) { pop.hidden = true; return; } const r = g.getBoundingClientRect(); if (offView(r)) { pop.hidden = true; return; }
    // Handy mit mitlaufender 3D-Ansicht oben: Karte nie über die 3D-Ansicht legen, sondern als Blatt darunter
    const dk = innerWidth < 1000 && $('.kp-stage.kp-docked'), minT = dk ? Math.round(dk.getBoundingClientRect().bottom + (dk.classList.contains('kp-dkmini') ? 34 : 24)) : 64;
    pop.style.maxHeight = dk ? Math.max(160, innerHeight - minT - 8) + 'px' : '';
    // Handy quer: Karte bleibt in der rechten Spalte, das 3D links bleibt frei
    const stg = LANDQ.matches && $('.kp-stage'), minL = stg ? Math.round(stg.getBoundingClientRect().right + 8) : 8;
    pop.style.maxWidth = stg ? (innerWidth - minL - 8) + 'px' : '';
    if (stg) { const hb = Math.round($('.kp-head').getBoundingClientRect().bottom) + 6; pop.style.maxHeight = (innerHeight - hb - 8) + 'px'; }
    const pw = pop.offsetWidth, ph = pop.offsetHeight; let left = r.left + r.width / 2 - pw / 2; left = Math.max(minL, Math.min(innerWidth - pw - 8, left));
    let top = r.top - ph - 10; if (top < Math.max(70, minT)) top = Math.min(innerHeight - ph - 8, r.bottom + 10);
    if (dk && (top < minT || top + ph > innerHeight - 8)) top = Math.max(minT, innerHeight - ph - 8);
    pop.style.left = left + 'px'; pop.style.top = Math.max(minT, top) + 'px';
  }
  const offView = r => r.bottom < 60 || r.top > innerHeight - 8;
  const chipRow = (lab, key, list, cur, attr = 'c') => `<div class="kp-prow"><span class="kp-pl">${lab}</span><div class="kp-chips" role="group" aria-label="${lab}">${list.map(([v, n]) => `<button type="button" data-${attr}="${key}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}" aria-pressed="${String(cur) === String(v)}">${n}</button>`).join('')}</div></div>`;
  const stepRow = (lab, kMinus, kPlus, val, dis0, dis1, attr = 'c') => `<div class="kp-prow"><span class="kp-pl">${lab}</span><div class="kp-step"><button type="button" data-${attr}="${kMinus}"${dis0 ? ' disabled' : ''} aria-label="${lab} kleiner">−</button><span>${val}</span><button type="button" data-${attr}="${kPlus}"${dis1 ? ' disabled' : ''} aria-label="${lab} größer">+</button></div></div>`;
  const DOSEI = (n, v) => { let g = ''; for (let i = 0; i < n; i++) g += v ? `<circle cx="8" cy="${n === 1 ? 8 : n === 2 ? 5 + i * 6 : 3 + i * 5}" r="${n === 3 ? 2 : 2.4}" fill="none" stroke="currentColor" stroke-width="1.2"/>` : `<circle cx="${n === 1 ? 8 : n === 2 ? 5 + i * 6 : 3 + i * 5}" cy="8" r="${n === 3 ? 2 : 2.4}" fill="none" stroke="currentColor" stroke-width="1.2"/>`; return `<svg viewBox="0 0 16 16" aria-hidden="true">${g}</svg>`; };
  function renderCxPop() {
    const c = cxById(selCx), L = wallLen(c.wall), has = ks => Object.values(P.rows).some(r => r.some(m => ks.includes(m.t)));
    const go = c.t === 'wasser' && has(['sp']) ? 'Spüle hierher' : (c.t === 'herd' || c.t === 'abluft') && has(['kf', 'ko']) ? (c.t === 'abluft' ? 'Kochfeld + Haube hierher' : 'Kochfeld hierher') : '';
    let h = `<div class="kp-pt"><b>${CXN[c.t]} <small>${WN[c.wall]}${cxSpec(c) ? ' · ' + cxSpec(c) : ''}</small></b><button type="button" class="kp-px" data-c="x" aria-label="Auswahl schließen">×</button></div>`;
    h += stepRow('Ab links', 'l', 'r', `${c.s} cm`, c.s <= 8, c.s >= L - 8);
    if (c.t === 'heiz') {
      h += stepRow('Breite', 'w-', 'w+', `${hzW(c)} cm`, hzW(c) <= 30, hzW(c) >= 300) + stepRow('Höhe', 'h-', 'h+', `${hzH(c)} cm`, hzH(c) <= 20, hzH(c) >= 200 - hzY(c)) + stepRow('Ab Boden', 'y-', 'y+', `${hzY(c)} cm`, hzY(c) <= 0, hzY(c) >= 200 - hzH(c));
    } else {
      const H0 = Math.round(cxH(c)), [lo, hi] = CXLIM[c.t];
      if (c.t === 'dose') {
        h += `<div class="kp-prow"><span class="kp-pl">Anzahl</span><div class="kp-chips" role="group" aria-label="Anzahl">${[1, 2, 3].map(n => `<button type="button" data-c="n" data-v="${n}" class="${cxN(c) === n ? 'on' : ''}" aria-pressed="${cxN(c) === n}">${DOSEI(n, cxO(c) === 'v')}${n}-fach</button>`).join('')}</div></div>`;
        h += `<div class="kp-prow"><span class="kp-pl">Lage</span><div class="kp-chips" role="group" aria-label="Lage">${[['h', 'waagerecht'], ['v', 'senkrecht']].map(([v, n]) => `<button type="button" data-c="o" data-v="${v}" class="${cxO(c) === v ? 'on' : ''}" aria-pressed="${cxO(c) === v}">${DOSEI(Math.max(2, cxN(c)), v === 'v')}${n}</button>`).join('')}</div></div>`;
        h += `<div class="kp-prow kp-eqrow"><span class="kp-pl">Bereich</span><div class="kp-chips" role="group" aria-label="Höhenbereich">${DZ.map(([z, n]) => `<button type="button" data-c="z" data-v="${z}" class="${c.h == null && (c.z || 'ap') === z ? 'on' : ''}" title="${DZ.find(x => x[0] === z)[3]}">${n}<em>${zH(z)}</em></button>`).join('')}</div></div>`;
      }
      if (c.t === 'abluft') {
        h += chipRow('Ø', 'd', ADS.map(d => [d, d + ' mm']), cxD(c));
        h += `<div class="kp-prow kp-eqrow"><span class="kp-pl">Lage</span><div class="kp-chips" role="group" aria-label="Lage">${AZ.map(([z, n, hh]) => `<button type="button" data-c="z" data-v="${z}" class="${c.h == null && (c.z || 'haube') === z ? 'on' : ''}">${n}<em>${hh}</em></button>`).join('')}</div></div>`;
      }
      h += stepRow('Höhe', 'h-', 'h+', `${H0} cm`, H0 <= lo, H0 >= hi);
    }
    h += chipRow('Stand', 'st', [['b', 'vorhanden'], ['n', 'neu geplant']], c.neu ? 'n' : 'b');
    const hint = { wasser: 'Mitte der Eckventile', herd: 'Mitte der Anschlussdose', dose: 'Mitte der Steckdose', abluft: 'Mitte des Mauerdurchbruchs', heiz: 'Mitte des Heizkörpers' }[c.t];
    h += `<p class="kp-cxh">${hint} ab linker Wandecke, Höhe über dem fertigen Fußboden. In der Wandansicht anfassen: seitlich und in der Höhe ziehen.</p><div class="kp-pb">${go ? `<button type="button" data-c="go">${go}</button>` : ''}<button type="button" data-c="del" class="kp-del">Entfernen</button></div>`;
    pop.innerHTML = h; pop.hidden = false;
    const cands = [$(`[data-cx="${c.id}"]`, wallsEl), $(`[data-cxp="${c.id}"]`)].filter(el => el && el.getBoundingClientRect().width > 0);
    const r = cands.length ? cands[0].getBoundingClientRect() : null; if (!r || offView(r)) { pop.hidden = true; return; }
    // Handy mit mitlaufender 3D-Ansicht oben: Karte nie über die 3D-Ansicht legen, sondern als Blatt darunter
    const dk = innerWidth < 1000 && $('.kp-stage.kp-docked'), minT = dk ? Math.round(dk.getBoundingClientRect().bottom + (dk.classList.contains('kp-dkmini') ? 34 : 24)) : 64;
    pop.style.maxHeight = dk ? Math.max(160, innerHeight - minT - 8) + 'px' : '';
    // Handy quer: Karte bleibt in der rechten Spalte, das 3D links bleibt frei
    const stg = LANDQ.matches && $('.kp-stage'), minL = stg ? Math.round(stg.getBoundingClientRect().right + 8) : 8;
    pop.style.maxWidth = stg ? (innerWidth - minL - 8) + 'px' : '';
    if (stg) { const hb = Math.round($('.kp-head').getBoundingClientRect().bottom) + 6; pop.style.maxHeight = (innerHeight - hb - 8) + 'px'; }
    const pw = pop.offsetWidth, ph = pop.offsetHeight; let left = r.left + r.width / 2 - pw / 2; left = Math.max(minL, Math.min(innerWidth - pw - 8, left));
    let top = r.top - ph - 10; if (top < Math.max(70, minT)) top = Math.min(innerHeight - ph - 8, r.bottom + 10);
    if (dk && (top < minT || top + ph > innerHeight - 8)) top = Math.max(minT, innerHeight - ph - 8);
    pop.style.left = left + 'px'; pop.style.top = Math.max(minT, top) + 'px';
  }
  // Gerät (Spüle samt Spülmaschine daneben, bzw. Kochfeld) so nah wie möglich an einen Anschluss rücken – nur wenn dabei kein neuer Konflikt entsteht
  function moveApp(kinds, c) {
    const nm = kinds.includes('sp') ? 'Spüle' : 'Kochfeld'; let fw = null, fi = -1;
    for (const w in P.rows) { const i = P.rows[w].findIndex(m => kinds.includes(m.t)); if (i >= 0) { fw = w; fi = i; break; } }
    if (fw == null) return { ok: false, msg: P.form === 'insel' && P.island.v === (kinds.includes('sp') ? 'spuele' : 'kochfeld') ? `Die ${nm} sitzt in der Insel – der Anschluss kommt dort aus dem Boden.` : `Noch keine ${nm} im Plan.` };
    if (!P.rows[c.wall]) return { ok: false, msg: `An dieser Wand steht keine Küche – die ${nm} bleibt, wo sie ist. Die Leitung wird dann zur ${nm} verlegt.` };
    const cur = locate(fw, fi); if (fw === c.wall && Math.abs(cur.x0 + cur.w / 2 - c.s) <= 15) return { ok: true, same: true };
    const W0 = () => tips().filter(x => x[0] === 'warn').length, warn0 = W0(), snap = JSON.stringify({ rows: P.rows, up: P.up });
    const restore = st => { const o = JSON.parse(st); P.rows = o.rows; P.up = o.up; };
    const r0 = P.rows[fw], m = r0[fi]; let grp = [m];
    if (kinds.includes('sp')) { if (r0[fi + 1] && r0[fi + 1].t === 'gs') grp = [m, r0[fi + 1]]; else if (r0[fi - 1] && r0[fi - 1].t === 'gs') grp = [r0[fi - 1], m]; }
    const ids = grp.map(x => x.id); let best = null;
    const n = P.rows[c.wall].length - (fw === c.wall ? grp.length : 0);
    for (let k = 0; k <= n; k++) for (const flip of grp.length > 1 ? [false, true] : [false]) {
      try {
        restore(snap); const R = P.rows, g0 = R[fw].filter(x => ids.includes(x.id)); R[fw] = R[fw].filter(x => !ids.includes(x.id)); const tg = R[c.wall];
        if ((k === 0 && tg[0] && M[tg[0].t].corner) || (k === tg.length && tg.length && M[tg[tg.length - 1].t].corner)) continue;
        tg.splice(k, 0, ...(flip ? [...g0].reverse() : g0));
        if (fw !== c.wall) { makeRoomQuiet(c.wall); makeRoomQuiet(fw); if (free(fw) >= 30) fillRest(fw); }
        try { followHoods(); } catch (e) { }
        const i = P.rows[c.wall].findIndex(x => kinds.includes(x.t)), L = i < 0 ? null : locate(c.wall, i); if (!L) continue;
        const dist = Math.abs(L.x0 + L.w / 2 - c.s), wn = W0(), score = dist + Math.max(0, wn - warn0) * 1000 + (flip ? .5 : 0) + (k === (fw === c.wall ? fi : -1) ? 0 : .1);
        if (!best || score < best.score) best = { score, dist, wn, st: JSON.stringify({ rows: P.rows, up: P.up }) };
      } catch (e) { /* Kandidat verwerfen */ }
    }
    restore(snap);
    if (!best || best.wn > warn0) return { ok: false, msg: `Die ${nm} passt dort nicht ohne Konflikt hin – bitte von Hand verschieben.` };
    const cur2 = Math.abs(cur.x0 + cur.w / 2 - c.s) + (fw === c.wall ? 0 : 999); if (best.dist >= cur2 - 1) return { ok: true, same: true };
    restore(best.st); return { ok: true, dist: best.dist };
  }
  function cxFollow(c) {
    if (c.t === 'wasser') { const r = moveApp(['sp'], c); if (r.same) return; if (r.ok) { change(); toast(r.dist > 40 ? `Die Spüle ist zum Wasseranschluss gerückt – so nah, wie es passt (${Math.round(r.dist)} cm daneben).` : 'Die Spüle sitzt jetzt am Wasseranschluss – kurze Wege für Wasser und Abfluss.', undo); } else toast(r.msg); }
    else if (c.t === 'herd' || (c.t === 'abluft' && !isDD() && cxH(c) > 40)) { const ab = c.t === 'abluft'; const has = Object.values(P.rows).some(r => r.some(m => m.t === 'kf' || m.t === 'ko')); if (!has) return; for (const w in P.rows) { const i = P.rows[w].findIndex(m => m.t === 'kf' || m.t === 'ko'); if (i >= 0 && w === c.wall) { const L = locate(w, i); if (Math.abs(L.x0 + L.w / 2 - c.s) <= 30) return; } }
      ask(ab ? 'Kochfeld und Haube zum Abluft-Durchbruch rücken?' : 'Das Kochfeld zum Herdanschluss rücken?', 'Ja, rücken', () => { const r = moveApp(['kf', 'ko'], c); if (r.ok && !r.same) { change(); toast(ab ? 'Kochfeld und Haube sitzen jetzt am Abluft-Durchbruch.' : 'Das Kochfeld sitzt jetzt am Herdanschluss.', undo); } else if (!r.ok) toast(r.msg); }); }
  }
  function addCx(t) {
    if ((P.cx || []).length >= 12) { toast('Mehr als 12 Anschlüsse passen nicht in den Plan.'); return; }
    // Start: Wasser an der Spüle, Herdanschluss am Kochfeld, Steckdose mittig an der ersten Küchenwand – danach an die echte Stelle ziehen
    let wall = FORMS[P.form].walls.includes('N') ? 'N' : FORMS[P.form].walls[0], s = wallLen(wall) / 2 + (P.cx || []).filter(c => c.t === t).length * 30;
    const app = t === 'wasser' ? ['sp'] : t === 'herd' || t === 'abluft' ? ['kf', 'ko'] : null;
    if (app) for (const w in P.rows) { const i = P.rows[w].findIndex(m => app.includes(m.t)); if (i >= 0) { const L = locate(w, i); wall = w; s = L.x0 + L.w / 2; break; } }
    // Steckdose: freie Stelle über der Arbeitsplatte – nicht im Fenster, nicht über Spüle/Kochfeld, nicht hinter Hochschränken
    if (t === 'dose') {
      let best = null;
      for (const w of Object.keys(P.rows)) {
        const L = wallLen(w), blk = [];
        P.rows[w].forEach((m, i) => { const q = locate(w, i); if (!q) return; if (m.t === 'sp') blk.push([q.x0 - 8, q.x0 + q.w + 8]); if (m.t === 'kf' || m.t === 'ko') blk.push([q.x0 - 15, q.x0 + q.w + 15]); if ((M[m.t] || {}).h === 't') blk.push([q.x0 - 3, q.x0 + q.w + 3]); });
        const xsW = xs(w), r0 = P.rows[w].length ? xsW[0] : 0, r1 = P.rows[w].length ? xsW[P.rows[w].length - 1] + P.rows[w][P.rows[w].length - 1].w : 0;
        P.op.filter(o => o.wall === w).forEach(o => blk.push([o.s - 10, o.s + o.w + 10]));
        (P.cx || []).filter(c => c.wall === w && c.t === 'dose').forEach(c => blk.push([c.s - 25, c.s + 25]));
        let a = null; for (let x = Math.max(12, r0 + 8); x <= Math.min(L - 12, r1 - 8) + 5; x += 5) { const free = x <= Math.min(L - 12, r1 - 8) && !blk.some(([p, q]) => x > p && x < q); if (free && a == null) a = x; if ((!free || x > Math.min(L - 12, r1 - 8)) && a != null) { const len = x - 5 - a; if (!best || len > best.len) best = { w, s: a + len / 2, len }; a = null; } }
      }
      if (best) { wall = best.w; s = best.s; }
    }
    // Heizkörper: unter ein Fenster ohne Schränke davor, sonst mittig an eine Wand ohne Küche
    if (t === 'heiz') { const win = P.op.find(o => o.t === 'fenster' && !P.rows[o.wall]) || P.op.find(o => o.t === 'fenster'); if (win) { wall = win.wall; s = win.s + win.w / 2; } else { wall = ['S', 'E', 'W', 'N'].find(w => !P.rows[w]) || 'S'; s = wallLen(wall) / 2; } }
    const c = { id: uid++, t, wall, s: 0 }; if (t === 'heiz') { const win = P.op.find(o => o.t === 'fenster' && o.wall === wall); if (win) c.hw = Math.max(40, Math.min(300, Math.round(win.w * .8 / 10) * 10)); if (win && opY(win) < 75) c.hh = Math.max(20, Math.round((opY(win) - 20) / 5) * 5); } c.s = clampCx(c, s);
    // Handy zeigt nur eine Wand: zur Wand mit dem neuen Anschluss wechseln, sonst sieht man ihn nicht
    (P.cx = P.cx || []).push(c); selCx = c.id; sel = null; selOp = null; if (MOBQ.matches) curWall = c.wall; change();
    toast({ wasser: 'Wasseranschluss eingesetzt – an die echte Stelle ziehen, die Spüle rückt mit.', herd: 'Herdanschluss eingesetzt – an die echte Stelle ziehen.', dose: 'Doppelsteckdose über der Arbeitsplatte eingesetzt – antippen für 1-/2-/3-fach, senkrecht und Höhe.', abluft: 'Abluft-Durchbruch Ø 150 eingesetzt – antippen für Durchmesser und Höhe.', heiz: 'Heizkörper eingesetzt – antippen für Breite, Höhe und Bodenabstand.' }[t]);
  }
  $$('[data-addcx]').forEach(b => b.addEventListener('click', () => addCx(b.dataset.addcx)));
  function renderOpPop() {
    const o = opById(selOp), ws = OPW[o.t], k = opK(o), fl = opFl(o);
    let h = `<div class="kp-pt"><b>${OPN[o.t]} <small>${WN[o.wall]}</small></b><button type="button" class="kp-px" data-o="x" aria-label="Auswahl schließen">×</button></div>`;
    h += stepRow('Breite', 'w-', 'w+', `${o.w} cm`, o.w <= ws[0], o.w >= ws[ws.length - 1], 'o');
    h += chipRow('Art', 'k', OPK[o.t], k, 'o');
    h += chipRow('Flügel', 'fl', [[1, '1-flügelig'], [2, '2-flügelig']], fl, 'o');
    if (fl === 1 && k !== 'fest' && k !== 'kipp') h += `<div class="kp-prow"><span class="kp-pl">${opSlide(o) ? 'Schiebt' : 'Anschlag'}</span><div class="kp-chips" role="group">${[['l', opSlide(o) ? 'nach links' : 'links', ICON_L], ['r', opSlide(o) ? 'nach rechts' : 'rechts', ICON_R]].map(([v, n, ic]) => `<button type="button" data-o="a" data-v="${v}" class="${opA(o) === v ? 'on' : ''}" aria-pressed="${opA(o) === v}">${ic}${n}</button>`).join('')}</div></div>`;
    if (o.t === 'tuer' && k === 'dreh') h += chipRow('Öffnet', 'dir', [['in', 'in die Küche'], ['out', 'nach außen']], opDir(o), 'o');
    if (o.t === 'fenster') h += stepRow('Brüstung', 'y-', 'y+', `${opY(o)} cm`, opY(o) <= 0, opY(o) + opHH(o) >= 250, 'o') + stepRow('Höhe', 'h-', 'h+', `${opHH(o)} cm`, opHH(o) <= 40, opY(o) + opHH(o) >= 250, 'o');
    h += `<p class="kp-cxh">${o.t === 'fenster' ? 'Brüstung = Unterkante Fenster über dem Fußboden. ' : ''}Anschlag = Seite der Bänder, von innen gesehen. Im Grundriss sehen Sie, wohin der Flügel aufgeht.</p>`;
    h += `<div class="kp-pb"><button type="button" data-o="l" aria-label="nach links">←</button><button type="button" data-o="r" aria-label="nach rechts">→</button><button type="button" data-o="del" class="kp-del">Entfernen</button></div>`;
    pop.innerHTML = h; pop.hidden = false;
    const cands = [$(`[data-pop="${o.id}"]`), $(`[data-op="${o.id}"]`, wallsEl)].filter(el => el && el.getBoundingClientRect().width > 0);
    const r = cands.length ? cands[0].getBoundingClientRect() : null; if (!r || offView(r)) { pop.hidden = true; return; }
    // Handy mit mitlaufender 3D-Ansicht oben: Karte nie über die 3D-Ansicht legen, sondern als Blatt darunter
    const dk = innerWidth < 1000 && $('.kp-stage.kp-docked'), minT = dk ? Math.round(dk.getBoundingClientRect().bottom + (dk.classList.contains('kp-dkmini') ? 34 : 24)) : 64;
    pop.style.maxHeight = dk ? Math.max(160, innerHeight - minT - 8) + 'px' : '';
    // Handy quer: Karte bleibt in der rechten Spalte, das 3D links bleibt frei
    const stg = LANDQ.matches && $('.kp-stage'), minL = stg ? Math.round(stg.getBoundingClientRect().right + 8) : 8;
    pop.style.maxWidth = stg ? (innerWidth - minL - 8) + 'px' : '';
    if (stg) { const hb = Math.round($('.kp-head').getBoundingClientRect().bottom) + 6; pop.style.maxHeight = (innerHeight - hb - 8) + 'px'; }
    const pw = pop.offsetWidth, ph = pop.offsetHeight; let left = r.left + r.width / 2 - pw / 2; left = Math.max(minL, Math.min(innerWidth - pw - 8, left));
    let top = r.top - ph - 10; if (top < Math.max(70, minT)) top = Math.min(innerHeight - ph - 8, r.bottom + 10);
    if (dk && (top < minT || top + ph > innerHeight - 8)) top = Math.max(minT, innerHeight - ph - 8);
    pop.style.left = left + 'px'; pop.style.top = Math.max(minT, top) + 'px';
  }
  /* ---------------- Ausstattung: kleine Auswahl mit Mini-Vorschau ---------------- */
  let eqSel = null; // {k: 'sp'|'kf'|'dh'|'bs'|'isl', id?, wall?, rx/ry (Tipp-Punkt in 3D) oder q (Element in der Wandansicht)}
  const IC = {
    sink: c => `<svg viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="4" fill="${c}" stroke="rgba(0,0,0,.28)" stroke-width=".8"/><rect x="5" y="4.5" width="20" height="13" rx="3.4" fill="${shade(c, lum(c) > .5 ? -.16 : .14)}"/><circle cx="15" cy="11" r="1.7" fill="${shade(c, lum(c) > .5 ? -.45 : .35)}"/><path d="M4 3.5h9" stroke="#fff" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/></svg>`,
    tap: c => `<svg viewBox="0 0 30 22" aria-hidden="true"><path d="M11 21V8q0-5 5-5h3q5 0 5 4.5v2.5" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M11 21V8q0-5 5-5" fill="none" stroke="#fff" stroke-opacity="${lum(c) > .5 ? .5 : .22}" stroke-width=".9" stroke-linecap="round"/><rect x="6" y="18.5" width="11" height="3" rx="1" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width=".5"/><path d="M8 12h3" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`,
    hob: (dd, w) => { const k = (w || 80) / 90; return `<svg viewBox="0 0 30 22" aria-hidden="true"><rect x="${15 - 13 * k}" y="2" width="${26 * k}" height="18" rx="2.4" fill="#151617"/>${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b2]) => `<circle cx="${15 + a * (dd ? 7.5 : 6) * k}" cy="${11 + b2 * 4.4}" r="${3 * Math.min(1, k + .1)}" fill="none" stroke="#7b7f83" stroke-width=".9"/>`).join('')}${dd ? `<rect x="13" y="3.5" width="4" height="15" rx="1" fill="#5d6166"/><path d="M13.6 6h2.8M13.6 8.5h2.8M13.6 11h2.8M13.6 13.5h2.8M13.6 16h2.8" stroke="#202224" stroke-width=".8"/>` : ''}</svg>`; },
    hood: v => { const g = '#b9bdc0', d = '#1d1e20'; return `<svg viewBox="0 0 30 22" aria-hidden="true">${v === 'esse' ? `<rect x="12" y="0" width="6" height="11" fill="${g}"/><path d="M11 11h8l7 7H4z" fill="${g}" stroke="rgba(0,0,0,.25)" stroke-width=".5"/><rect x="4" y="18" width="22" height="2" fill="#8f9396"/>` : v === 'flach' ? `<rect x="4" y="2" width="22" height="14" rx="1" fill="var(--kp-fc,#e9e4dc)" stroke="rgba(0,0,0,.25)" stroke-width=".6"/><rect x="4.5" y="16" width="21" height="2.4" rx="1" fill="#9a9ea2"/>` : v === 'decke' ? `<path d="M0 1.5h30" stroke="#cfc6b9" stroke-width="2"/><rect x="5" y="2.5" width="20" height="3" rx="1" fill="#eef0f1" stroke="rgba(0,0,0,.3)" stroke-width=".5"/><path d="M9 8q2 3 0 6M15 8q2 3 0 6M21 8q2 3 0 6" fill="none" stroke="#9aa0a5" stroke-width=".9" stroke-dasharray="1.6 1.2"/><rect x="8" y="18" width="14" height="2.4" rx="1" fill="#151617"/>` : v === 'insel' ? `<rect x="13" y="0" width="4" height="9" fill="${g}"/><rect x="6" y="9" width="18" height="5" rx="1" fill="${g}" stroke="rgba(0,0,0,.25)" stroke-width=".5"/><rect x="6" y="18" width="18" height="3" rx="1" fill="#c9b79c"/>` : v === 'mulde' ? `<rect x="3" y="12" width="24" height="9" rx="1.5" fill="#151617"/><rect x="13" y="13" width="4" height="7" fill="#6a6e72"/><path d="M15 10V3M12.5 5.5L15 3l2.5 2.5" fill="none" stroke="#9aa0a5" stroke-width="1" stroke-linecap="round"/>` : `<rect x="12" y="0" width="6" height="7" fill="${g}"/><rect x="5" y="7" width="20" height="3" fill="${g}"/><path d="M5 10h20l3 9H2z" fill="${d}"/><path d="M6 12h18" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/>`}</svg>`; },
    back: k => { const c = k === 'glas' || k === 'dibond' ? backCol() : k === 'holz' ? (BACKW.find(x => x[0] === (P.style.backWood || 'eiche')) || BACKW[0])[2] : k === 'platte' ? topCol() : k === 'fliese' ? '#f2efe9' : P.style.wall || '#f3efe9';
      let s2 = `<svg viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="2.5" fill="${c}" stroke="rgba(0,0,0,.22)" stroke-width=".7"${k === 'wand' ? ' stroke-dasharray="2 1.5"' : ''}/>`;
      if (k === 'glas') s2 += `<path d="M3 3h9l-6 16H3z" fill="#fff" opacity=".28"/>`;
      if (k === 'holz') s2 += `<path d="M2 6q14 -2 26 1M2 11q12 2 26 -1M2 16q15 -2 26 1" fill="none" stroke="rgba(60,35,15,.35)" stroke-width=".8"/>`;
      if (k === 'fliese') s2 += `<path d="M1 7.7h28M1 14.3h28M10 1v6.7M20 1v6.7M5 7.7v6.6M15 7.7v6.6M25 7.7v6.6M10 14.3V21M20 14.3V21" stroke="#cfc8bd" stroke-width=".8"/>`;
      if (k === 'platte') s2 += `<path d="M4 18q8-9 12-6t11-9" fill="none" stroke="${lum(c) > .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.35)'}" stroke-width=".7"/>`;
      if (k === 'motiv') s2 += motif ? `<image href="${motif._url}" x="1" y="1" width="28" height="20" preserveAspectRatio="xMidYMid slice"/><path d="M3 3h8l-5 16H3z" fill="#fff" opacity=".25"/>` : `<rect x="1" y="1" width="28" height="20" rx="2.5" fill="#dfe8ee"/><path d="M3 19l7-8 5 5 4-4 8 7z" fill="#7b9a7e"/><circle cx="21" cy="6.5" r="2.3" fill="#f2c46b"/>`;
      return s2 + '</svg>'; },
    dot: c => `<svg viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="2.5" fill="${c}" stroke="rgba(0,0,0,.22)" stroke-width=".7"/></svg>`,
    led: on => `<svg viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="2.5" fill="${on ? '#2a2622' : '#e9e4dc'}"/><rect x="3" y="3" width="24" height="2" rx="1" fill="${on ? '#ffe7b0' : '#bdb4a6'}"/>${on ? '<path d="M3 5h24l-3 14H6z" fill="#ffe2a8" opacity=".35"/>' : ''}</svg>`,
  };
  const chip = (e, v, on, icon, label, sub) => `<button type="button" class="kp-eq${on ? ' on' : ''}" data-e="${e}" data-v="${v}" aria-pressed="${!!on}">${icon}<span>${label}${sub ? `<small>${sub}</small>` : ''}</span></button>`;
  const eqRow = (lab, html, blk) => blk ? `<div class="kp-eqblk"><span class="kp-pl">${lab}</span><div class="kp-eqs">${html}</div></div>` : `<div class="kp-prow kp-eqrow"><span class="kp-pl">${lab}</span><div class="kp-eqs">${html}</div></div>`;
  function eqRows(k, m, blk) {
    let h = '';
    if (k === 'sp') {
      h += eqRow('Becken', SINKS.map(([v, n, c]) => chip('sink', v, eqv('sink', 'edel') === v, IC.sink(c), n)).join(''), blk);
      h += eqRow('Armatur', TAPS.map(([v, n, c]) => chip('tap', v, eqv('tap', 'chrom') === v, IC.tap(c), n)).join(''), blk);
    }
    if (k === 'kf' || k === 'isl') {
      if (!m || m.t !== 'ko') h += eqRow('Kochfeld', HOBW.map(v => chip('hobW', v, eqv('hobW', 80) === v, IC.hob(k === 'kf' && isDD(), v), v + ' cm')).join(''), blk);
      if (k === 'kf') { h += eqRow('Art', HOBV.map(([v, n]) => chip('hobV', v, eqv('hobV', 'normal') === v, IC.hob(v === 'dd', 80), n)).join(''), blk); if (isDD()) h += `<p class="kp-eqhint">Der Muldenlüfter saugt den Dampf direkt am Kochfeld nach unten ab – eine Haube braucht es nicht.</p>`; }
      if (k === 'isl') h += eqRow('Abzug', IHOODS.map(([v, n, d]) => chip('ihood', v, eqv('ihood', 'mulde') === v, IC.hood(v), n, d)).join(''), blk);
    }
    if (k === 'dh') { h += eqRow('Haube', HOODS.map(([v, n, d]) => chip('hood', v, eqv('hood', 'schraeg') === v, IC.hood(v), n, d)).join(''), blk); if (!blk) h += `<p class="kp-eqhint">Lieber ohne Haube? Beim Kochfeld „Mit Muldenlüfter“ wählen.</p>`; }
    if (k === 'wg' && P.style.handle === 'grifflos') h += eqRow('Abschluss', chip('gripEnd', 'wange', !gripEnd(), IC.dot(topCol()), 'Wange') + chip('gripEnd', 'leiste', gripEnd(), IC.dot('#8b8379'), 'Griffleiste ums Eck', 'läuft seitlich weiter'), blk);
    if (k === 'pf' || k === 'wg') { const f = k === 'pf' ? 'pfDek' : 'wgDek', cur = P.style[f] || (k === 'pf' ? 'front' : 'top'); h += eqRow('Dekor', chip(f, 'front', cur === 'front', IC.dot(fcol()), 'Frontfarbe') + chip(f, 'top', cur === 'top', IC.dot(topCol()), 'Arbeitsplatte'), blk); if (!blk) h += `<p class="kp-eqhint">${k === 'pf' ? 'Das Passstück schließt das Restmaß automatisch – ohne Lücke zur Wand oder zum Hochschrank.' : 'Die Seitenwange schließt das offene Zeilenende sauber ab und steht 2 cm über die Front.'}</p>`; }
    if (k === 'bs') {
      const b = P.style.back || 'wand';
      h += eqRow(blk ? 'Material' : 'Rückwand', BACKS2.map(([v, n, d]) => chip('back', v, b === v, IC.back(v), n, blk ? d : '')).join(''), blk);
      if (b === 'glas' || b === 'dibond') h += eqRow('Farbe', BACKC.map(([n, c]) => chip('backC', c, (P.style.backC || '') === c, IC.dot(c || (P.style.wood ? WOOD[P.style.wood] : P.style.front)), n)).join(''), blk);
      if (b === 'holz') h += eqRow('Holz', BACKW.map(([v, n, c]) => chip('backWood', v, (P.style.backWood || 'eiche') === v, IC.back('holz').replace(/fill="#[0-9a-f]{6}"/, `fill="${c}"`), n)).join(''), blk);
      if (b === 'motiv') h += eqRow('Motiv', `<button type="button" class="kp-eq kp-equp" data-e="motif" data-v="1">${IC.back('motiv')}<span>${motif ? 'Anderes Foto wählen' : 'Foto hochladen'}<small>bleibt auf Ihrem Gerät, bis Sie anfragen</small></span></button>`, blk);
      if (b === 'motiv' && motif) { const z = +P.style.motZ || 1, mb = (v, l, t, dis) => `<button type="button" class="kp-mv" data-e="motMv" data-v="${v}" aria-label="${l}"${dis ? ' disabled' : ''}>${t}</button>`;
        h += eqRow('Bild verschieben', `<div class="kp-mvpad">${mb('u', 'Bild nach oben', '↑')}${mb('l', 'Bild nach links', '←')}${mb('c', 'Bild mittig und ganz', '•')}${mb('r', 'Bild nach rechts', '→')}${mb('d', 'Bild nach unten', '↓')}</div><div class="kp-mvz">${mb('zo', 'Bild kleiner', '−', z <= 1)}<span>${Math.round(z * 100)} %</span>${mb('zi', 'Bild größer', '+', z >= 3)}</div>`, blk); }
      if (b === 'motiv') h += eqRow('Druck auf', [['glas', 'Glas', 'glänzend, kann leuchten'], ['dibond', 'Dibond', 'matt']].map(([v, n, d]) => chip('motivMat', v, (P.style.motivMat || 'glas') === v, IC.back(v), n, blk ? d : '')).join(''), blk);
      if (backLit()) h += eqRow('Licht', chip('backLed', P.style.backLed ? 0 : 1, !!P.style.backLed, IC.led(!!P.style.backLed), 'Glas beleuchtet', 'leuchtet von innen – im Abendmodus sichtbar'), blk);
      else if (b !== 'wand') h += `<p class="kp-eqhint">Beleuchten lässt sich nur eine Glas-Rückwand – von innen. Bei ${b === 'motiv' ? 'Dibond' : 'diesem Material'} gibt es dafür Licht unter den Hängeschränken.</p>`;
    }
    return h;
  }
  function renderEqPop() {
    const q = eqSel, T = { sp: ['Spüle', 'Becken und Armatur wählen'], kf: ['Kochfeld', 'Breite und Abzug'], dh: ['Dunstabzug', 'Bauform wählen'], bs: ['Küchenrückwand', 'zwischen Arbeitsplatte und Hängeschrank'], isl: ['Kochinsel', 'Kochfeld und Abzug'], pf: ['Passstück', (() => { const t = q.wall && trims(q.wall).pf[0]; return t ? `${Math.round(t.w)} cm ${t.where}` : 'schließt das Restmaß'; })()], wg: ['Seitenwange', 'Abschluss am Zeilenende'] }[q.k];
    let m = null; if (q.id != null) for (const w in P.rows) { const x = P.rows[w].find(y => String(y.id) === String(q.id)); if (x) m = x; }
    pop.innerHTML = `<div class="kp-pt"><b>${T[0]} <small>${T[1]}</small></b><button type="button" class="kp-px" data-e="close" data-v="1" aria-label="Auswahl schließen">×</button></div>` + eqRows(q.k, m);
    pop.hidden = false; pop.classList.add('kp-pop-eq');
    let r; if (q.rx != null) { const hr = host3.getBoundingClientRect(); const x = hr.left + q.rx, y = hr.top + q.ry; r = { left: x, right: x, top: y - 8, bottom: y + 8, width: 0 }; } else { const el = q.q && $(q.q, wallsEl); if (!el || !el.getBoundingClientRect().width) { pop.hidden = true; return; } r = el.getBoundingClientRect(); }
    if (offView(r)) { pop.hidden = true; return; }
    // Handy mit mitlaufender 3D-Ansicht oben: Karte nie über die 3D-Ansicht legen, sondern als Blatt darunter
    const dk = innerWidth < 1000 && $('.kp-stage.kp-docked'), minT = dk ? Math.round(dk.getBoundingClientRect().bottom + (dk.classList.contains('kp-dkmini') ? 34 : 24)) : 64;
    pop.style.maxHeight = dk ? Math.max(160, innerHeight - minT - 8) + 'px' : '';
    // Handy quer: Karte bleibt in der rechten Spalte, das 3D links bleibt frei
    const stg = LANDQ.matches && $('.kp-stage'), minL = stg ? Math.round(stg.getBoundingClientRect().right + 8) : 8;
    pop.style.maxWidth = stg ? (innerWidth - minL - 8) + 'px' : '';
    if (stg) { const hb = Math.round($('.kp-head').getBoundingClientRect().bottom) + 6; pop.style.maxHeight = (innerHeight - hb - 8) + 'px'; }
    const pw = pop.offsetWidth, ph = pop.offsetHeight; let left = r.left + r.width / 2 - pw / 2; left = Math.max(minL, Math.min(innerWidth - pw - 8, left));
    let top = r.top - ph - 10; if (top < Math.max(70, minT)) top = Math.min(innerHeight - ph - 8, r.bottom + 10);
    if (dk && (top < minT || top + ph > innerHeight - 8)) top = Math.max(minT, innerHeight - ph - 8);
    pop.style.left = left + 'px'; pop.style.top = Math.max(minT, top) + 'px';
  }
  function openEq(o) { eqSel = o; sel = null; selOp = null; selCx = null; renderWalls(); }
  const motifIn = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', hidden: true }); document.body.appendChild(motifIn);
  motifIn.addEventListener('change', () => {
    const f = motifIn.files && motifIn.files[0]; motifIn.value = ''; if (!f) return;
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { const sc = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c._url = c.toDataURL('image/jpeg', .86); motif = c; motSend = true; try { localStorage.setItem('kp-motiv', c._url); } catch (e) { } P.style.back = 'motiv'; xfade(); change(); toast('Ihr Motiv ist jetzt die Glasrückwand – das Foto bleibt auf Ihrem Gerät, bis Sie Ihre Anfrage absenden.'); };
    im.onerror = () => { URL.revokeObjectURL(url); toast('Dieses Bild kann der Browser nicht öffnen – bitte ein JPG oder PNG wählen.'); };
    im.src = url;
  });
  function setEq(k, v) {
    if (k === 'close') { eqSel = null; pop.hidden = true; renderWalls(); return; }
    if (k === 'motif') { motifIn.click(); return; }
    if (k === 'motMv') { // eigenes Motiv auf der Rückwand verschieben und vergrößern
      let x = +P.style.motX || 0, y = +P.style.motY || 0, z = +P.style.motZ || 1; const ZS = [1, 1.25, 1.5, 2, 2.5, 3];
      if (v === 'c') { x = 0; y = 0; z = 1; }
      else if (v === 'zi') z = ZS.find(q => q > z + .01) || 3;
      else if (v === 'zo') { z = [...ZS].reverse().find(q => q < z - .01) || 1; }
      else { const A = motif ? motif.width / motif.height : 1.5;
        if (z < 1.01 && ((v === 'l' || v === 'r') || A > 4)) { z = 1.5; toast('Das Bild ist jetzt etwas größer, damit es sich in alle Richtungen schieben lässt.'); }
        if (v === 'l') x = Math.max(-1, x - .25); if (v === 'r') x = Math.min(1, x + .25); if (v === 'u') y = Math.min(1, y + .25); if (v === 'd') y = Math.max(-1, y - .25); }
      P.style.motX = x; P.style.motY = y; P.style.motZ = z; change(); return;
    }
    if (k === 'sink' || k === 'tap' || k === 'hood' || k === 'ihood' || k === 'backWood' || k === 'pfDek' || k === 'wgDek' || k === 'gripEnd') P.style[k] = v;
    if (k === 'backC') { if (v) P.style.backC = v; else delete P.style.backC; }
    if (k === 'backLed') P.style.backLed = +v && backLit() ? 1 : 0;
    if (k === 'motivMat') { P.style.motivMat = v; if (!backLit()) P.style.backLed = 0; }
    if (k === 'back' && !backLit()) P.style.backLed = 0;
    if (k === 'back') { P.style.back = v; if (v === 'motiv' && !motif) { motifIn.click(); } }
    if (k === 'hobW') { P.style.hobW = +v; let grown = 0; for (const w in P.rows) P.rows[w].forEach(m => { if (m.t === 'kf' && m.w < +v) { m.w = M.kf.ws.find(x => x >= +v) || m.w; makeRoom(w, m); grown = m.w; } }); if (grown) toast(`Der Kochfeldschrank ist jetzt ${grown} cm breit, damit das ${v}er Kochfeld hineinpasst.`); }
    if (k === 'hobV') {
      P.style.hobV = v; let koN = 0;
      if (v === 'dd') for (const w in P.rows) P.rows[w].forEach(m => { if (m.t === 'ko') { m.t = 'kf'; koN++; } });
      for (const w in P.up) { const hobs = [], X = xs(w); (P.rows[w] || []).forEach((m, i) => { if (m.t === 'kf' || m.t === 'ko') hobs.push([X[i], m.w]); });
        if (v === 'dd') P.up[w] = P.up[w].filter(u => !(u.t === 'dh' && hobs.some(([a, b]) => ov(a, b, u.s, u.w))));
        else hobs.forEach(([a, b]) => { if (!P.up[w].some(u => u.t === 'dh' && ov(a, b, u.s, u.w))) { const hw = Math.min(90, Math.max(60, b)); P.up[w].push({ id: uid++, t: 'dh', s: a + b / 2 - hw / 2, w: hw }); } }); }
      toast(v === 'dd' ? (koN ? 'Muldenlüfter und Backofen in einem Schrank geht nicht – unter dem Kochfeld sind jetzt Auszüge. Den Backofen gibt es unter „Hoch“ auf Augenhöhe.' : 'Muldenlüfter gewählt – er saugt direkt am Kochfeld ab, die Haube entfällt.')
        : koWhy ? 'Herd mit Backofen darunter geht nicht mit Muldenlüfter – das Kochfeld bekommt wieder eine Haube.' : 'Normales Kochfeld – die Haube hängt wieder darüber.');
    }
    if (eqSel && eqSel.k === 'dh' && k === 'hobV' && v === 'dd') eqSel = null;
    if (['back', 'backC', 'backWood', 'backLed', 'sink', 'tap', 'hood', 'pfDek', 'wgDek', 'gripEnd'].includes(k)) xfade();
    change();
    const FK = { sink: 'sp', tap: 'sp', hobW: 'kf', hobV: 'kf', hood: 'dh', ihood: 'isl', back: 'bs', backC: 'bs', backWood: 'bs', backLed: 'bs' }; if (FK[k]) follow(FK[k]);
  }
  root.addEventListener('click', e => { if (e.target.closest('[data-kp-tipsall]')) { $('[data-kp-tips]').classList.toggle('all'); renderTips(); } });
  root.addEventListener('click', e => { const b = e.target.closest('[data-e]'); if (!b) return; e.preventDefault(); setEq(b.dataset.e, b.dataset.v); });

  pop.addEventListener('click', e => {
    const cb = e.target.closest('[data-c]');
    if (cb) { const c = cxById(selCx); if (!c) return; const k = cb.dataset.c;
      if (k === 'x') { selCx = null; renderWalls(); return; }
      const v = cb.dataset.v;
      if (k === 'l' || k === 'r') { c.s = clampCx(c, c.s + (k === 'r' ? 5 : -5)); change(); return; }
      if (k === 'h-' || k === 'h+') { const d = k === 'h+' ? 5 : -5; if (c.t === 'heiz') { c.hh = Math.max(20, Math.min(200 - hzY(c), hzH(c) + d)); } else setCxH(c, cxH(c) + d, false); change(); return; }
      if (k === 'w-' || k === 'w+') { c.hw = Math.max(30, Math.min(300, hzW(c) + (k === 'w+' ? 10 : -10))); c.s = clampCx(c, c.s); change(); return; }
      if (k === 'y-' || k === 'y+') { setCxH(c, hzY(c) + (k === 'y+' ? 5 : -5)); change(); return; }
      if (k === 'n') { c.n = +v; change(); return; }
      if (k === 'o') { if (v === 'v') c.o = 'v'; else delete c.o; change(); return; }
      if (k === 'd') { c.d = +v; change(); return; }
      if (k === 'z') { c.z = v; delete c.h; change(); return; }
      if (k === 'st') { if (v === 'n') c.neu = 1; else delete c.neu; change(); return; }
      if (k === 'del') { P.cx = P.cx.filter(x => x !== c); selCx = null; change(); toast(`${CXN[c.t]} entfernt`, undo); return; }
      if (k === 'go') { const sp = c.t === 'wasser', r = moveApp(sp ? ['sp'] : ['kf', 'ko'], c); if (r.same) toast(sp ? 'Die Spüle sitzt schon am Wasseranschluss.' : c.t === 'abluft' ? 'Kochfeld und Haube sitzen schon am Abluft-Durchbruch.' : 'Das Kochfeld sitzt schon am Herdanschluss.'); else if (r.ok) { change(); toast(sp ? 'Die Spüle sitzt jetzt am Wasseranschluss.' : c.t === 'abluft' ? 'Kochfeld und Haube sitzen jetzt am Abluft-Durchbruch.' : 'Das Kochfeld sitzt jetzt am Herdanschluss.', undo); } else toast(r.msg); return; }
      return; }
    const ob = e.target.closest('[data-o]');
    if (ob) { const o = opById(selOp); if (!o) return; const k = ob.dataset.o, ws = OPW[o.t];
      if (k === 'x') { selOp = null; selCx = null; renderWalls(); return; }
      if (k === 'w-' || k === 'w+') { let i = ws.indexOf(o.w); if (i < 0) i = ws.findIndex(v => v >= o.w); const c = o.s + o.w / 2; o.w = ws[Math.max(0, Math.min(ws.length - 1, i + (k === 'w+' ? 1 : -1)))]; o.s = clampOp(o, c - o.w / 2); }
      if (k === 'l') o.s = clampOp(o, o.s - 10); if (k === 'r') o.s = clampOp(o, o.s + 10);
      const v = ob.dataset.v;
      if (k === 'k') { o.k = v; if (v === 'fest' || v === 'kipp') delete o.dir; }
      if (k === 'fl') o.fl = +v;
      if (k === 'a') o.a = v;
      if (k === 'dir') o.dir = v;
      if (k === 'y-' || k === 'y+') o.y0 = Math.max(0, Math.min(250 - opHH(o), opY(o) + (k === 'y+' ? 5 : -5)));
      if (k === 'h-' || k === 'h+') o.hh = Math.max(40, Math.min(250 - opY(o), opHH(o) + (k === 'h+' ? 5 : -5)));
      if (k === 'del') { const i = P.op.indexOf(o); P.op.splice(i, 1); selOp = null; selCx = null; toast(`${OPN[o.t]} entfernt`, undo); }
      change(); return; }
    const b = e.target.closest('[data-p]'); if (!b) return; const f = findSel(); if (!f) return; const { w, i, m, up } = f, c = M[m.t];
    const k = b.dataset.p, v = b.dataset.v;
    if (k === 'x') { sel = null; renderWalls(); return; }
    if (k === 'o') { const on = K.toggle(m.id); if (axOf(m)) K.toggle(m.id + 'ax', on); if (on && K.focus) K.focus(m.id); if (on) openNow.add(String(m.id)); else openNow.delete(String(m.id)); renderPop(); if (innerWidth < 1000 && !$('.kp-stage.kp-docked')) $('.kp-stage').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    if (k === 'w-' || k === 'w+') {
      const old = m.w; m.w = stepW(c.ws, m.w, k === 'w+' ? 1 : -1);
      if (up) { const s = resolveUp(w, m, m.s - (m.w - old) / 2, true); if (s == null) { m.w = old; toast('Daneben hängt schon etwas – erst verschieben oder schmaler machen.'); } else m.s = s; }
      else { if (k === 'w+') makeRoom(w, m); if (c.corner) ['W', 'E'].forEach(x => P.rows[x] && makeRoom(x)); }
    }
    if (k === 'h') { m.h = +v; if (m.ax && hOf(m) + m.ax > AXMAX) { delete m.ax; toast('Der Aufsatzschrank passt bei dieser Höhe nicht mehr unter die Decke – entfernt.'); } }
    if (k === 'ax') { if (+v) m.ax = +v; else { delete m.ax; delete m.axo; } }
    if (k === 'axo') m.axo = v;
    if (k === 'led') m.led = +v;
    if (k === 'tu' || k === 'g2' || k === 'to') m[k] = v;
    if (k === 'a') m.a = v;
    if (k === 't' && v !== m.t) {
      if (up) { const old = { ...m }; setUpType(m, v); const s = resolveUp(w, m, m.s, true); if (s == null) { Object.assign(m, old); toast('Der neue Schrank ist breiter – daneben ist kein Platz.'); } else m.s = s; }
      else { m.t = v; if (!M[v].ws.includes(m.w)) { m.w = M[v].ws.reduce((a, x) => Math.abs(x - m.w) < Math.abs(a - m.w) ? x : a, M[v].ws[0]); makeRoom(w, m); } if (!M[v].hinge) delete m.a; if (!M[v].hs || (m.h && !M[v].hs.includes(m.h))) delete m.h; }
    }
    if (k === 'l' || k === 'r') {
      if (up) { const ed = upEdges(w, m).flatMap(e2 => [e2, e2 - m.w]).filter(x => x >= 0 && x + m.w <= wallLen(w)); const cand = [...new Set(ed.map(Math.round))].filter(x => k === 'l' ? x < m.s - .5 : x > m.s + .5).sort((p, q) => k === 'l' ? q - p : p - q); const nx = cand.find(x => !P.up[w].some(o => o !== m && ov(o.s, o.w, x, m.w))); if (nx != null) m.s = nx; else toast('Weiter geht es nicht – dort hängt schon etwas.'); }
      else if (k === 'l' && i > 0) { P.rows[w].splice(i, 1); P.rows[w].splice(i - 1, 0, m); }
      else if (k === 'r' && i < P.rows[w].length - 1) { P.rows[w].splice(i, 1); P.rows[w].splice(i + 1, 0, m); }
    }
    if (k === 'del') { const list = up ? P.up[w] : P.rows[w]; list.splice(i, 1); sel = null; toast(`${c.n} entfernt`, undo); }
    else if (up && m.t === 'dh') relinkHood(w, m);
    change();
  });
  addEventListener('resize', () => renderPop());
  // Auswahl-Popup folgt seinem Element; ist es aus dem Bild gescrollt, verschwindet das Popup (und kommt beim Zurückscrollen wieder)
  addEventListener('scroll', () => { if (!pop.hidden || sel != null || selOp != null || eqSel) renderPop(); }, { passive: true });
  addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || document.querySelector('.kpf:not([hidden])')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selCx && !selOp && sel == null) { P.cx = P.cx.filter(c => c.id !== selCx); selCx = null; change(); e.preventDefault(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selOp) { P.op = P.op.filter(o => o.id !== selOp); selOp = null; selCx = null; change(); e.preventDefault(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel != null) { const f = findSel(); if (f) { (f.up ? P.up[f.w] : P.rows[f.w]).splice(f.i, 1); sel = null; change(); } e.preventDefault(); }
    if (e.key === 'Escape') { sel = null; selOp = null; selCx = null; renderWalls(); try { renderPop(); } catch (er) { } }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { undo(); e.preventDefault(); }
  });

  /* ---------------- Grundriss: Fenster & Türen ---------------- */
  const planEl = $('[data-kp-plan]');
  // Wand-Laufrichtung wie in 3D: N links→rechts, E oben→unten, S rechts→links, W unten→oben
  function seg(wall, a, len) { const W = P.room.w, D = P.room.d; return { N: [a, 0, a + len, 0], S: [W - a, D, W - a - len, D], W: [0, D - a, 0, D - a - len], E: [W, a, W, a + len] }[wall]; }
  function cabR(wall, a, len, dep) { const W = P.room.w, D = P.room.d; return { N: [a, 0, len, dep], S: [W - a - len, D - dep, len, dep], W: [0, D - a - len, dep, len], E: [W - dep, a, dep, len] }[wall]; }
  const INW = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
  function renderPlan() {
    if (!planEl) return;
    const W = P.room.w, D = P.room.d; let s = `<rect x="0" y="0" width="${W}" height="${D}" fill="#f7f2ea"/>`;
    for (const w in P.rows) { const X = xs(w); P.rows[w].forEach((m, i) => { const x = X[i]; const [cx, cy, cw, ch] = cabR(w, x, m.w, 60), tall = M[m.t].h === 't'; s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${tall ? '#cdbfab' : '#e6dccd'}" stroke="#a89880" stroke-width="1.2"/>`; if (m.t === 'ek') { const cs = cornerSide(w, i); s += `<rect x="${cs === 'r' ? W - 60 : 0}" y="60" width="60" height="30" fill="#e6dccd" stroke="#a89880" stroke-width="1.2"/>`; } const mx = cx + cw / 2, my = cy + ch / 2; if (m.t === 'sp') s += `<rect x="${mx - 17}" y="${my - 14}" width="34" height="28" rx="6" fill="#fff" stroke="#8d9296" stroke-width="1.5"/>`; if (m.t === 'kf' || m.t === 'ko') [[-11, -11], [11, -11], [-11, 11], [11, 11]].forEach(([a, b]) => s += `<circle cx="${mx + a}" cy="${my + b}" r="7" fill="none" stroke="#45474b" stroke-width="1.6"/>`); if (m.t === 'kue') s += `<text x="${mx}" y="${my + 5}" font-size="15" text-anchor="middle" fill="#6e655b" font-family="system-ui">❄</text>`;  }); }
    if (P.form === 'insel') { const g = isl(); s += `<g data-isp style="cursor:move"><rect x="${g.x - g.w / 2}" y="${g.z - g.d / 2}" width="${g.w}" height="${g.d}" rx="4" fill="#e6dccd" stroke="${ACC}" stroke-width="2.4" stroke-dasharray="7 5"/>${(() => { const q = islSide(), cf = q.kh === 'wand' ? g.d - 3 : ITWO(q.kh) ? (g.d >= 100 ? 60 : g.d / 2) : Math.max(40, Math.min(60, g.d - 25)), y1 = g.z - g.d / 2 + cf; return q.kh === 'wand' ? '' : `<line x1="${g.x - g.w / 2 + 3}" y1="${y1}" x2="${g.x + g.w / 2 - 3}" y2="${y1}" stroke="#9f978a" stroke-width="1.6" ${q.kh === 'sitz' ? 'stroke-dasharray="3 4"' : ''} pointer-events="none"/>`; })()}<text x="${g.x}" y="${g.z + 6}" text-anchor="middle" font-size="18" font-weight="600" fill="#6b6359" pointer-events="none">Insel ✥</text><line x1="${g.x}" y1="60" x2="${g.x}" y2="${g.z - g.d / 2}" stroke="#9f978a" stroke-width="1.5" stroke-dasharray="4 4" pointer-events="none"/><text x="${g.x + 6}" y="${60 + g.g / 2 + 6}" font-size="15" fill="#6b6359" pointer-events="none">${g.g} cm</text></g>`; }
    s += `<rect x="-6" y="-6" width="${W + 12}" height="${D + 12}" fill="none" stroke="#2b2724" stroke-width="12"/>`;
    P.op.forEach(o => {
      const [x1, y1, x2, y2] = seg(o.wall, o.s, o.w), [nx, ny] = INW[o.wall], on = selOp === o.id, c = on ? ACC : '#4f8fc6', ink = on ? ACC : '#2b2724';
      const pt = (a, off) => { const [ax, ay] = seg(o.wall, a, 0); return [ax + nx * off, ay + ny * off]; };
      let g = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f7f2ea" stroke-width="13"/>`;
      if (o.t !== 'tuer') { const o2 = 4; g += `<line x1="${x1 - nx * o2}" y1="${y1 - ny * o2}" x2="${x2 - nx * o2}" y2="${y2 - ny * o2}" stroke="${c}" stroke-width="2.6"/><line x1="${x1 + nx * o2}" y1="${y1 + ny * o2}" x2="${x2 + nx * o2}" y2="${y2 + ny * o2}" stroke="${c}" stroke-width="2.6"/>`; if (o.t === 'balkon') g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="7" opacity=".35"/>`; }
      if (opSwings(o)) {
        // Aufschlag: jeder Flügel dreht um seine Bandseite – in den Raum (oder bei Türen „nach außen“ aus dem Raum)
        const sg = opDir(o) === 'out' ? -1 : 1, door = o.t === 'tuer';
        opWings(o).forEach(f => {
          const [hx, hy] = pt(f.h, 0), [lx, ly] = pt(f.l, 0), [tx, ty] = pt(f.h, sg * f.r);
          const sw = ((tx - hx) * (ly - hy) - (ty - hy) * (lx - hx)) > 0 ? 1 : 0;
          g += `<line x1="${hx}" y1="${hy}" x2="${tx}" y2="${ty}" stroke="${door ? ink : c}" stroke-width="${door ? 4 : 2}"/><path d="M${tx} ${ty}A${f.r} ${f.r} 0 0 ${sw} ${lx} ${ly}" fill="none" stroke="${door ? ink : c}" stroke-width="${door ? 1.4 : 1.1}" stroke-dasharray="${door ? '6 5' : '4 4'}"${door ? '' : ' opacity=".8"'}/>`;
        });
      } else if (opSlide(o)) {
        // Schiebetür: Flügel vor der Wand, Pfeil in Schieberichtung
        const fl = opFl(o), off = o.t === 'tuer' ? 9 : 8;
        (fl === 2 ? [[o.s, o.s + o.w / 2, -1], [o.s + o.w / 2, o.s + o.w, 1]] : [[o.s, o.s + o.w, opA(o) === 'l' ? -1 : 1]]).forEach(([a0, a1, d]) => {
          const [p1x, p1y] = pt(a0, off), [p2x, p2y] = pt(a1, off), m = (a0 + a1) / 2, [m1x, m1y] = pt(m - d * 12, off + 13), [m2x, m2y] = pt(m + d * 12, off + 13), [h1x, h1y] = pt(m + d * 5, off + 8), [h2x, h2y] = pt(m + d * 5, off + 18);
          g += `<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="${ink}" stroke-width="3.4"/><path d="M${m1x} ${m1y}L${m2x} ${m2y}M${h1x} ${h1y}L${m2x} ${m2y}L${h2x} ${h2y}" fill="none" stroke="${ink}" stroke-width="1.6"/>`;
        });
      }
      if (o.t === 'tuer') g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="1" opacity=".35"/>`;
      const mx = (x1 + x2) / 2 + nx * 26, my = (y1 + y2) / 2 + ny * 26;
      g += `<text x="${mx}" y="${my + 5}" font-size="15" font-weight="700" text-anchor="middle" fill="${on ? ACC : '#4f6b84'}" font-family="system-ui" paint-order="stroke" stroke="#f7f2ea" stroke-width="4">${o.t === 'tuer' ? 'Tür' : o.t === 'balkon' ? 'Balkon' : 'Fenster'}</text>`;
      const hx0 = Math.min(x1, x2) - 14 + (nx ? -8 : 0), hy0 = Math.min(y1, y2) - 14 + (ny ? -8 : 0), hw = Math.abs(x2 - x1) + 28 + (nx ? 40 : 0), hh = Math.abs(y2 - y1) + 28 + (ny ? 40 : 0);
      s += `<g data-pop="${o.id}" class="kp-pop-op${on ? ' on' : ''}">${g}<rect x="${nx < 0 ? hx0 - 32 : hx0}" y="${ny < 0 ? hy0 - 32 : hy0}" width="${hw}" height="${hh}" fill="transparent"/></g>`;
    });
    (P.cx || []).forEach(c => {
      const [nx, ny] = INW[c.wall], on = selCx === c.id;
      if (c.t === 'heiz') { const [ax, ay, bx, by] = seg(c.wall, c.s - hzW(c) / 2, hzW(c)), o = 9; s += `<g data-cxp="${c.id}" class="kp-pop-op kp-cxp${on ? ' on' : ''}" style="cursor:grab"><line x1="${ax + nx * o}" y1="${ay + ny * o}" x2="${bx + nx * o}" y2="${by + ny * o}" stroke="${on ? ACC : CXC.heiz}" stroke-width="10" stroke-linecap="round"/><line x1="${ax + nx * o}" y1="${ay + ny * o}" x2="${bx + nx * o}" y2="${by + ny * o}" stroke="#fff" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/><line x1="${ax + nx * o}" y1="${ay + ny * o}" x2="${bx + nx * o}" y2="${by + ny * o}" stroke="transparent" stroke-width="40"/></g>`; return; }
      const [x1, y1] = seg(c.wall, c.s, 0), x = x1 + nx * 17, y = y1 + ny * 17; s += `<g data-cxp="${c.id}" class="kp-pop-op kp-cxp${on ? ' on' : ''}" style="cursor:grab">${cxSym(c, x, y, 11, on)}<circle cx="${x}" cy="${y}" r="26" fill="transparent"/></g>`;
    });
    s += `<g font-family="system-ui" font-size="15" fill="#8a7f72" text-anchor="middle"><text x="${W / 2}" y="${-22}">${(W / 100).toFixed(2).replace('.', ',')} m</text><text transform="translate(${-22} ${D / 2}) rotate(-90)">${(D / 100).toFixed(2).replace('.', ',')} m</text></g>`;
    planEl.innerHTML = `<svg viewBox="-44 -44 ${W + 88} ${D + 80}" xmlns="http://www.w3.org/2000/svg" aria-label="Grundriss mit Fenstern und Türen">${s}</svg>`;
  }
  function planPt(e) { const svg = $('svg', planEl), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function planMove(e) {
    const o = opById(drag.oid); if (!o) return; const W = P.room.w, D = P.room.d, p = planPt(e);
    const d = { N: Math.abs(p.y), S: Math.abs(p.y - D), W: Math.abs(p.x), E: Math.abs(p.x - W) };
    const wall = Object.keys(d).sort((a, b) => d[a] - d[b])[0], along = { N: p.x, S: W - p.x, W: D - p.y, E: p.y }[wall];
    if (o.wall !== wall) { o.wall = wall; if (o.w > wallLen(wall) - 20) o.w = OPW[o.t].filter(v => v <= wallLen(wall) - 20).pop() || o.w; }
    o.s = clampOp(o, along - o.w / 2); renderWalls(); renderTips(); schedule3D();
  }
  function cxPlanMove(e) {
    const c = cxById(drag.cid); if (!c) return; const W = P.room.w, D = P.room.d, p = planPt(e);
    const d = { N: Math.abs(p.y), S: Math.abs(p.y - D), W: Math.abs(p.x), E: Math.abs(p.x - W) };
    const wall = Object.keys(d).sort((a, b) => d[a] - d[b])[0], along = { N: p.x, S: W - p.x, W: D - p.y, E: p.y }[wall];
    c.wall = wall; c.s = clampCx(c, along); renderWalls();
  }
  if (planEl) planEl.addEventListener('pointerdown', e => {
    const ip = e.target.closest('[data-isp]'); if (!ip) return; e.preventDefault(); e.stopImmediatePropagation();
    const svg = planEl.querySelector('svg'), m = svg.getScreenCTM(); if (!m) return; const inv = m.inverse(), pt = svg.createSVGPoint();
    const toCm = ev => { pt.x = ev.clientX; pt.y = ev.clientY; const q = pt.matrixTransform(inv); return [q.x, q.y]; };
    const g0 = isl(), [x0, y0] = toCm(e); let raf = 0;
    try { planEl.setPointerCapture(e.pointerId); } catch (er) { }
    const mv = ev => { const [x, y] = toCm(ev); P.island.x = Math.round((g0.x + x - x0 - P.room.w / 2) / 5) * 5; P.island.g = Math.round((g0.g + y - y0) / 5) * 5; const n = isl(); P.island.x = Math.round(n.x - P.room.w / 2); P.island.g = n.g; if (!raf) raf = requestAnimationFrame(() => { raf = 0; renderPlan(); }); };
    const up = () => { planEl.removeEventListener('pointermove', mv); planEl.removeEventListener('pointerup', up); planEl.removeEventListener('pointercancel', up); change(); };
    planEl.addEventListener('pointermove', mv); planEl.addEventListener('pointerup', up); planEl.addEventListener('pointercancel', up);
  }, true);
  if (planEl) planEl.addEventListener('pointerdown', e => { const gc = e.target.closest('[data-cxp]'); if (gc) { startDrag(e, 'cxplan', { cid: +gc.dataset.cxp }); e.preventDefault(); return; } const g = e.target.closest('[data-pop]'); if (!g) { if (selOp || selCx) { selOp = null; selCx = null; renderWalls(); } return; } startDrag(e, 'plan', { oid: +g.dataset.pop }); e.preventDefault(); });
  function addOp(t) {
    if (P.op.length >= 8) { toast('Mehr als 8 Fenster und Türen passen nicht in den Plan.'); return; }
    const w0 = t === 'tuer' ? 90 : t === 'balkon' ? 120 : 100, kitchen = Object.keys(P.rows), others = ['N', 'E', 'S', 'W'].filter(w => !kitchen.includes(w));
    const order = t === 'fenster' ? ['N', ...kitchen.filter(w => w !== 'N'), ...others] : [...others, ...kitchen];
    for (const wall of order) {
      const L = wallLen(wall), o = { id: uid++, t, wall, w: Math.min(w0, L - 40), s: 0 }, ok = [];
      for (let s0 = 10; s0 <= L - o.w - 10; s0 += 5) {
        if (P.op.some(q => q.wall === wall && s0 + o.w > q.s - 20 && s0 < q.s + q.w + 20)) continue;
        if (P.rows[wall]) { const X = xs(wall); let bad = false; P.rows[wall].forEach((m, i) => { const x = X[i]; if (s0 + o.w > x + 2 && s0 < x + m.w - 2 && (t !== 'fenster' || M[m.t].h === 't' || m.t === 'kf' || m.t === 'ko')) bad = true; }); if (bad) continue; }
        ok.push(s0);
      }
      if (ok.length) { o.s = ok.sort((a, b) => Math.abs(a + o.w / 2 - L / 2) - Math.abs(b + o.w / 2 - L / 2))[0]; P.op.push(o); selOp = o.id; sel = null; if (MOBQ.matches) curWall = wall; change(); toast(`${OPN[t]} eingesetzt – zum Verschieben anfassen.`); return; }
    }
    toast(`Kein freier Platz für ${t === 'tuer' ? 'eine Tür' : t === 'balkon' ? 'eine Balkontür' : 'ein Fenster'} – erst etwas verschieben oder entfernen.`);
  }
  $$('[data-addop]').forEach(b => b.addEventListener('click', () => addOp(b.dataset.addop)));

  /* ---------------- Toast ---------------- */
  const tst = $('[data-kp-toast]'); let tT = 0;
  // Meldungs-Ruhe (28.10.): Probleme und „Rückgängig“ immer; reine Bestätigungen/Anleitungen nur einmal je Gerät; am Handy höchstens eine Info alle 12 s
  const ONCE = /eingesetzt|übernommen|^Abgestimmt|sind offen|^Alles wieder zu|Muldenlüfter gewählt|^Normales Kochfeld|^Tipp:|Ihr Motiv ist jetzt|ist wieder da/, PROB = /kein(en)? (freien )?Platz|zu lang|geht nicht|passen nicht|passt nicht|Achtung|nicht öffnen|geht es nicht|im Weg|nicht mehr unter|nur in die Ecken|gibt es in L-/;
  let infoT = 0; const onceGet = () => { try { return JSON.parse(localStorage.getItem('kp-once') || '[]'); } catch (e) { return []; } };
  function quiet(msg, und) {
    if (und || PROB.test(msg)) return false;
    const k = String(msg).replace(/<[^>]+>/g, '').replace(/\d+/g, '#').slice(0, 48);
    if (ONCE.test(msg)) { const L = onceGet(); if (L.includes(k)) return true; L.push(k); try { localStorage.setItem('kp-once', JSON.stringify(L.slice(-60))); } catch (e) { } }
    if (innerWidth < 1000 && Date.now() - infoT < 12000) return true; infoT = Date.now(); return false;
  }
  function toast(msg, und) { if (quiet(msg, und)) return; tst.classList.remove('kp-ask'); tst.innerHTML = `<span>${msg}</span>${und ? '<button type="button">Rückgängig</button>' : ''}`; placeToast(); tst.hidden = false; tst.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => { tst.classList.remove('on'); }, und ? 5200 : innerWidth < 1000 ? 3200 : 4200); const b = $('button', tst); if (b) b.onclick = () => { und(); tst.classList.remove('on'); }; }
  // Rückfrage im Toast: nichts passiert, solange nicht „Ja“ getippt wird
  function ask(msg, yes, fn, no, noFn) { tst.classList.add('kp-ask'); tst.innerHTML = `<span>${msg}</span><span class="kp-askb"><button type="button" data-a="1">${yes}</button><button type="button" data-a="0">${no || 'Nein'}</button></span>`; placeToast(); tst.hidden = false; tst.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => tst.classList.remove('on'), 9000); $$('[data-a]', tst).forEach(b => b.onclick = () => { tst.classList.remove('on'); if (b.dataset.a === '1') fn(); else if (noFn) noFn(); }); }
  // Handy: Toast unten mittig über den Kamera-Knöpfen der 3D-Bühne (verdeckt nie die „live in 3D“-Pille); sonst über dem Weiter-Knopf
  function placeToast() {
    tst.style.bottom = ''; if (innerWidth >= 1000) return;
    const st = $('.kp-stage'), cams = st && $('.kp-cams', st), r = st && st.getBoundingClientRect(), cr = cams && cams.getBoundingClientRect();
    if (r && cr && !st.classList.contains('kp-docked') && cr.top > 110 && cr.bottom < innerHeight - 4) { tst.style.bottom = Math.round(innerHeight - cr.top + 8) + 'px'; return; }
    const nx = $('[data-kpane].on .kp-next'), nr = nx && nx.getBoundingClientRect(); tst.style.bottom = (nr && nr.height && nr.top < innerHeight && nr.top > innerHeight - 140 ? Math.round(innerHeight - nr.top + 10) : 16) + 'px';
  }

  // Schlägt ein Flügel beim Aufgehen (0–90°) gegen Schränke an einer anderen Wand oder die Insel? Höhe des Flügels zählt.
  function sweepHits(o) {
    const W = P.room.w, D = P.room.d, ah = P.ah || 90, z0 = opY(o) + 2, z1 = opY(o) + opHH(o) - 2, R = [];
    for (const w in P.rows) { if (w === o.wall) continue; const X = xs(w); P.rows[w].forEach((m, i) => { const t = M[m.t].h === 't'; R.push([...cabR(w, X[i], m.w, 60), 0, t ? hOf(m) + axOf(m) : ah]); }); upList(w).forEach(u => { if (u.t === 'dh') return; const { bottom, h } = upY(u); R.push([...cabR(w, u.s, u.w, 35), bottom, bottom + h]); }); }
    if (P.form === 'insel') { const g = isl(); R.push([g.x - g.w / 2, g.z - g.d / 2, g.w, g.d, 0, 90]); }
    const rel = R.filter(r => r[4] < z1 && r[5] > z0); if (!rel.length) return false;
    const [nx, ny] = INW[o.wall], P0 = a => seg(o.wall, a, 0);
    return opWings(o).some(f => { const [hx, hy] = P0(f.h), [lx, ly] = P0(f.l), ux = (lx - hx) / f.r, uy = (ly - hy) / f.r;
      for (let deg = 10; deg <= 90; deg += 5) { const t = deg * Math.PI / 180, dx = ux * Math.cos(t) + nx * Math.sin(t), dy = uy * Math.cos(t) + ny * Math.sin(t);
        for (let k = 1; k <= 6; k++) { const px = hx + dx * f.r * k / 6, py = hy + dy * f.r * k / 6; if (rel.some(([x, y, w, h]) => px > x + .5 && px < x + w - .5 && py > y + .5 && py < y + h - .5)) return true; } }
      return false; });
  }
  /* ---------------- Tipps (live) ---------------- */
  const HOODWIN = 'Über dem Kochfeld ist ein Fenster – davor darf keine Haube hängen. Kochfeld verschieben oder Muldenlüfter wählen';
  function cookWin() {
    const out = []; if (!wallHood()) return out;
    for (const w in P.rows) { const X = xs(w); P.rows[w].forEach((m, i) => { if (m.t !== 'kf' && m.t !== 'ko') return; const hw = hoodW(m), o = opAt(w, X[i] + m.w / 2 - hw / 2, hw); if (o) out.push({ w, i, m, o }); }); }
    return out;
  }
  // Kochfeld neben das Fenster rücken: beide Seiten jedes betroffenen Fensters (und die anderen Küchenwände) probieren,
  // genommen wird die Stelle ohne Fenster darüber mit den wenigsten Hinweisen und dem kürzesten Weg
  function cookOffWindow() {
    const cw = cookWin()[0]; if (!cw) return { ok: true, same: true };
    const snap = JSON.stringify({ rows: P.rows, up: P.up }), restore = st => { const o = JSON.parse(st); P.rows = o.rows; P.up = o.up; };
    const cand = []; P.op.filter(o => o.wall === cw.w).forEach(o => { cand.push({ wall: cw.w, s: o.s - cw.m.w / 2 - 10 }, { wall: cw.w, s: o.s + o.w + cw.m.w / 2 + 10 }); });
    Object.keys(P.rows).filter(w => w !== cw.w).forEach(w => cand.push({ wall: w, s: wallLen(w) / 2 }));
    const x0 = locate(cw.w, cw.i).x0; let best = null;
    cand.forEach(c => {
      restore(snap); let r = null; try { r = moveApp(['kf', 'ko'], c); } catch (e) { r = null; }
      if (!r || !r.ok || r.same || cookWin().length) return;
      let wl = null, nx = 0; for (const w in P.rows) { const i = P.rows[w].findIndex(m => m.t === 'kf' || m.t === 'ko'); if (i >= 0) { wl = w; nx = locate(w, i).x0; break; } }
      const sc = tips().filter(x => x[0] === 'warn').length * 1000 + (wl === cw.w ? Math.abs(nx - x0) : 500);
      if (!best || sc < best.sc) best = { sc, st: JSON.stringify({ rows: P.rows, up: P.up }) };
    });
    restore(best ? best.st : snap);
    return best ? { ok: true } : { ok: false, msg: 'Neben dem Fenster ist kein Platz fürs Kochfeld – bitte von Hand verschieben oder beim Kochfeld „Mit Muldenlüfter“ wählen.' };
  }
  let cookWinKey = null;
  function cookWinCheck(quiet) {
    const c = cookWin()[0], k = c ? c.m.id + ':' + c.o.id : '';
    if (cookWinKey === null || quiet) { cookWinKey = k; return; }
    if (k && k !== cookWinKey) setTimeout(() => ask('Über dem Kochfeld ist jetzt ein Fenster – davor darf keine Haube hängen. Kochfeld daneben rücken?', 'Ja, rücken', () => { const r = cookOffWindow(); if (r.ok && !r.same) { change(); toast('Das Kochfeld sitzt jetzt neben dem Fenster – die Haube hängt frei an der Wand.', undo); } else if (!r.ok) toast(r.msg); }), 60);
    cookWinKey = k;
  }
  function tips() {
    const out = [], all = []; for (const w in P.rows) P.rows[w].forEach((m, i) => all.push({ w, i, m }));
    const has = t => all.some(x => x.m.t === t);
    const ok = (t) => out.push(['ok', t]), warn = (t) => { if (!out.some(x => x[1] === t)) out.push(['warn', t]); };
    const isl = P.form === 'insel';
    has('sp') || (isl && P.island.v === 'spuele') ? ok('Spüle') : warn('Noch keine Spüle – einfach reinziehen');
    has('kf') || has('ko') || (isl && P.island.v === 'kochfeld') ? ok('Kochfeld') : warn('Noch kein Kochfeld oder Herd');
    if (isDD() && has('ko')) warn('Muldenlüfter und Backofen passen nicht in einen Schrank – beim Herd „Normal“ wählen oder das Kochfeld über Auszüge setzen');
    has('kue') ? ok('Kühlschrank') : warn('Noch kein Kühlschrank');
    for (const w in P.rows) { const f = free(w); if (f < -0.5) warn(`Die Küche ${WAN[w]} ist ${Math.round(-f)} cm zu lang für die Wand`); }
    const gs = all.filter(x => x.m.t === 'gs');
    if (gs.length && has('sp')) { const adj = gs.some(g => { const r = P.rows[g.w]; return (r[g.i - 1] && r[g.i - 1].t === 'sp') || (r[g.i + 1] && r[g.i + 1].t === 'sp'); }); adj ? ok('Spülmaschine neben der Spüle') : warn('Spülmaschine gehört direkt neben die Spüle'); }
    for (const w in P.rows) { const r = P.rows[w], a = r.findIndex(x => x.t === 'sp'), b = r.findIndex(x => x.t === 'kf' || x.t === 'ko'); if (a >= 0 && b >= 0) { const [lo, hi] = a < b ? [a, b] : [b, a]; const mid = r.slice(lo + 1, hi); const wd = mid.filter(x => M[x.t].h === 'b').reduce((s, x) => s + x.w, 0); if (mid.some(x => M[x.t].h === 't')) warn('Hochschrank zwischen Spüle und Kochfeld'); else wd >= 60 ? ok(`${wd} cm Arbeitsfläche zum Schnippeln`) : warn(`Nur ${wd} cm Platz zwischen Spüle und Kochfeld – 60 bis 120 cm sind ideal`); } }
    for (const w in P.rows) { const r = P.rows[w]; r.forEach((m, i) => { if (m.t !== 'kf' && m.t !== 'ko') return; const [a, b] = range(w); const L = locate(w, i); const nb = [r[i - 1], r[i + 1]]; if (nb.some(x => x && M[x.t].h === 't') || L.x0 - a < 1 && a === 0 || (i === r.length - 1 && L.x0 + L.w >= b - 1 && b === wallLen(w))) warn('Neben dem Kochfeld etwas Ablage lassen (min. 30 cm)'); }); }
    P.op.forEach(o => { const r = P.rows[o.wall]; if (!r) return; r.forEach((m, i) => { const L = locate(o.wall, i); if (!opOver(o, L.x0, L.w)) return; if (o.t === 'fenster') { if (M[m.t].h === 't' && hOf(m) > 105) warn('Ein Hochschrank steht vor dem Fenster'); } else warn(o.t === 'tuer' ? 'Vor der Tür stehen Schränke – Tür im Grundriss verschieben' : 'Vor der Balkontür stehen Schränke'); }); });
    for (const w in P.rows) upList(w).forEach(u => { const c = upConflict(w, u); if (c === 'tall') warn('Ein Hängeschrank stößt an einen Hochschrank – verschieben oder Hochschrank niedriger'); if (c === 'win') warn(u.t === 'dh' ? HOODWIN : 'Ein Hängeschrank hängt vor einem Fenster oder einer Tür'); });
    cookWin().forEach(() => warn(HOODWIN));
    if (!isDD()) for (const w in P.up) { const X = xs(w); P.rows[w] && P.rows[w].forEach((m, i) => { if ((m.t === 'kf' || m.t === 'ko') && !P.up[w].some(u => u.t === 'dh' && ov(u.s, u.w, X[i], m.w)) && !(wallHood() && opAt(w, X[i] + m.w / 2 - hoodW(m) / 2, hoodW(m)))) warn('Über dem Kochfeld fehlt die Dunstabzugshaube'); }); }
    if (P.rows.N && P.rows.N.length && (hasCornerSlot('l') || hasCornerSlot('r'))) { const N = P.rows.N; if ((hasCornerSlot('l') && M[N[0].t].corner) || (hasCornerSlot('r') && M[N[N.length - 1].t].corner)) ok('Ecke clever genutzt'); }
    if (!P.op.some(o => o.t === 'tuer' || o.t === 'balkon')) warn('Noch keine Tür – wie kommt man in die Küche?');
    [['wasser', ['sp'], 'Die Spüle', 'Wasseranschluss', isl && P.island.v === 'spuele'], ['herd', ['kf', 'ko'], 'Das Kochfeld', 'Herdanschluss', isl && P.island.v === 'kochfeld']].forEach(([t, ks, nm, an, inIsl]) => {
      const cs = (P.cx || []).filter(c => c.t === t); if (!cs.length || inIsl) return; let best = null;
      for (const w in P.rows) P.rows[w].forEach((m, i) => { if (!ks.includes(m.t)) return; const L = locate(w, i); cs.forEach(c => { const d = c.wall === w ? Math.abs(L.x0 + L.w / 2 - c.s) : 1e4; if (best == null || d < best) best = d; }); });
      if (best == null) return; if (best >= 1e4) warn(`${nm} steht nicht an der Wand mit dem ${an} – Leitung muss verlegt werden`); else if (best > 60) warn(`${nm} steht ${(best / 100).toFixed(1).replace('.', ',')} m neben dem ${an}`); else ok(`${nm} am ${an}`);
    });
    // Fenster über der Arbeitsplatte, Armatur im Fensterflügel, Flügel/Türblatt gegen Schränke
    P.op.forEach(o => {
      const r = P.rows[o.wall], ah = P.ah || 90;
      if (o.t === 'fenster' && r && opK(o) !== 'fest') r.forEach((m, i) => { const L = locate(o.wall, i); if (!opOver(o, L.x0, L.w) || M[m.t].h !== 'b') return; if (opY(o) < ah + 3) warn(`Die Fensterbrüstung (${opY(o)} cm) liegt unter der Arbeitsplatte (${ah} cm) – der Flügel geht nicht auf`); else if (m.t === 'sp' && opSwings(o) && opY(o) < ah + 32) warn('Die Armatur steht im Fensterflügel – umklappbare Vorfenster-Armatur einplanen'); });
      if (opSwings(o) && opDir(o) === 'in' && sweepHits(o)) warn(o.t === 'fenster' ? 'Ein Fensterflügel schlägt beim Öffnen gegen einen Schrank – Anschlag ändern' : `Die ${o.t === 'tuer' ? 'Tür' : 'Balkontür'} schlägt beim Öffnen gegen einen Schrank – Anschlag ändern oder nach außen öffnen lassen`);
    });
    // Heizkörper hinter Schränken
    (P.cx || []).filter(c => c.t === 'heiz').forEach(c => { const r = P.rows[c.wall]; if (!r) return; const a = c.s - hzW(c) / 2, b = c.s + hzW(c) / 2; if (r.some((m, i) => { const L = locate(c.wall, i); return L.x0 < b - 2 && L.x0 + L.w > a + 2; })) warn('Ein Heizkörper sitzt hinter den Schränken – versetzen oder Lüftungsgitter in Sockel und Arbeitsplatte einplanen'); });
    // Steckdose (Bestand) mitten hinter einem Hochschrank
    (P.cx || []).filter(c => c.t === 'dose' && !c.neu && cxH(c) > 60 && cxH(c) < 180).forEach(c => { const r = P.rows[c.wall]; if (r && r.some((m, i) => { const L = locate(c.wall, i); return M[m.t].h === 't' && c.s > L.x0 + 2 && c.s < L.x0 + L.w - 2; })) warn('Eine Steckdose sitzt hinter einem Hochschrank – versetzen oder stilllegen'); });
    // Abluft: Haube am Durchbruch, Muldenlüfter braucht den Durchbruch im Sockel
    { const ab = (P.cx || []).filter(c => c.t === 'abluft'), hobs = []; for (const w in P.rows) { const X = xs(w); P.rows[w].forEach((m, i) => { if (m.t === 'kf' || m.t === 'ko') hobs.push({ w, s: X[i] + m.w / 2 }); }); }
      if (ab.length && hobs.length) { if (isDD()) { if (!ab.some(c => cxH(c) <= 40)) warn('Der Muldenlüfter braucht den Abluft-Durchbruch im Sockel (rund 12 cm über dem Boden)'); }
        else { let best = 1e9; hobs.forEach(hb => ab.forEach(c => { const d = c.wall === hb.w ? Math.abs(c.s - hb.s) : 1e4; if (d < best) best = d; })); if (ab.every(c => cxH(c) <= 40)) warn('Abluft im Sockel passt nur zum Muldenlüfter – für die Haube oben durch die Wand'); else if (best >= 1e4) warn('Die Haube hängt nicht an der Wand mit dem Abluft-Durchbruch – Kanal einplanen oder Umluft'); else if (best > 60) warn(`Die Haube hängt ${(best / 100).toFixed(1).replace('.', ',')} m neben dem Abluft-Durchbruch – Kanal einplanen`); else ok('Haube am Abluft-Durchbruch'); } } }
    if (isl && P.room.d < 380) warn('Für eine Insel sollte der Raum mind. 3,80 m tief sein');
    return out;
  }
  function renderTips() {
    const t = tips(), w = t.filter(x => x[0] === 'warn');
    const tl = $('[data-kp-tips]'); tl.innerHTML = (w.length ? w : [['ok', 'Alles im grünen Bereich – so würde ' + PERSON + ' das auch planen.']]).slice(0, 3).map(([k, s]) => `<li class="${k}"><i>${k === 'ok' ? '✓' : '!'}</i>${s}</li>`).join('') + (Math.min(3, w.length) > 1 ? `<li class="more"><button type="button" data-kp-tipsall aria-expanded="${tl.classList.contains('all')}">${tl.classList.contains('all') ? 'weniger' : '+' + (Math.min(3, w.length) - 1) + ' weitere Tipps'}</button></li>` : '');
    $$('[data-kp-score]').forEach(el => { el.textContent = w.length ? `${w.length} Tipp${w.length > 1 ? 's' : ''}` : 'Passt ✓'; el.classList.toggle('ok', !w.length); });
  }

  /* ---------------- 3D ---------------- */
  function toState() {
    const W = P.room.w, D = P.room.d, items = [], open = [], ah = P.ah || 90;
    const pos = (w, along, d) => ({ N: { x: along, z: d / 2, r: 0 }, S: { x: W - along, z: D - d / 2, r: 180 }, W: { x: d / 2, z: D - along, r: 90 }, E: { x: W - d / 2, z: along, r: 270 } })[w];
    const bk = P.style.back || 'wand', withNs = true; // auch ohne Rückwand: unsichtbare Fläche zum Antippen
    for (const w in P.rows) {
      const LY = layout(w), [ra, rb] = range(w), N0 = P.rows.N || [], segs = nsSegs(w), nx0 = segs.length ? segs[0][0] : 0, nx1 = segs.length ? Math.max(...segs.map(q => q[0] + q[1])) : 0;
      // Stoßfuge über Eck: Arbeitsplatte der Seitenwand endet an der Platte der Rückwand (2 cm Überstand), Sockel läuft in die Ecke
      const ekL = N0[0] && N0[0].t === 'ek', ekR = N0.length && N0[N0.length - 1].t === 'ek' && hasCornerSlot('r');
      P.rows[w].forEach((m, i) => {
        const x = LY.X.get(m), cs = cornerSide(w, i), c = M[m.t], sp = spec(m, cs);
        const cutR = w === 'W' && cornerAt(w, 1) && Math.abs(x + m.w - rb) < .6 && !ekL ? 1 : 0, cutL = w === 'E' && cornerAt(w, 0) && Math.abs(x - ra) < .6 && !ekR ? 1 : 0;
        if (axOf(m)) items.push({ t: 'cab', id: m.id + 'ax', label: 'Aufsatzschrank · ' + axOf(m) + ' cm', kind: 'u', w: m.w, h: axOf(m) - .4, y0: hOf(m) + .4 + (ah - 90), d: 58, led: false, fr: axFront(m, axOf(m)), ...pos(w, x + m.w / 2, 58) });
        items.push({ t: 'cab', id: m.id, label: label(m, cs), kind: c.h, w: m.w, h: c.h === 't' ? hOf(m) : undefined, ah, ...sp, ...(m.t === 'kf' ? { hob: Math.min(eqv('hobW', 80), m.w) - 2 } : {}), ...(cutL || cutR ? { topCut: [cutL * 2, cutR * 2], plExt: [cutL * 6, cutR * 6] } : {}), ...pos(w, x + m.w / 2, 60) });
      });
      // freier Platz zwischen zwei Ecken: Passblende mit durchlaufender Arbeitsplatte – keine offene Lücke
      { const TR = trims(w), pd = P.style.pfDek || 'front'; TR.pf.forEach(q => { if (q.w >= .8) items.push({ t: 'cab', kind: q.tall ? 't' : 'b', w: q.w, h: q.tall ? q.h : undefined, ah, fr: [{ k: 'blind', p: 1 }], noGrip: 1, eqk: 'pf', eqw: w, dekor: pd, ...pos(w, q.x + q.w / 2, 60) }); });
        TR.wg.forEach(q => items.push({ t: 'wg', wall: w, h: 90 + ah - 90, dekor: P.style.wgDek || 'top', grip: gripEnd() ? 1 : 0, ...pos(w, q.x + 1.25, 62) })); }
      if (withNs) segs.forEach(([x, sw, h]) => items.push({ t: 'ns', wall: w, w: sw, h, ah, nx: x - nx0, nW: nx1 - nx0, ...pos(w, x + sw / 2, 2) }));
      { const cf = upCornerFill(w); if (cf) items.push({ t: 'cab', kind: 'u', w: cf.w, h: cf.h, y0: cf.bottom, fr: [{ k: 'blind', p: 1 }], led: false, ...pos(w, cf.s + cf.w / 2, 35) }); }
      upList(w).forEach(u => {
        if (u.t === 'dh') items.push({ t: 'hb', id: u.id, wall: w, v: eqv('hood', 'schraeg'), w: u.w, ...pos(w, u.s + u.w / 2, 50) });
        else if (u.t === 'wb') { const { bottom, h } = upY(u); items.push({ t: 'wb', id: u.id, w: u.w, h, y0: bottom, led: upLed(u), ...pos(w, u.s + u.w / 2, 25) }); }
        else { const { bottom, h } = upY(u); items.push({ t: 'cab', id: u.id, label: label(u), kind: 'u', w: u.w, h, y0: bottom, led: upLed(u), ...spec(u), ...pos(w, u.s + u.w / 2, 35) }); }
      });
    }
    if (P.form === 'insel') { const g = isl(), q = islDepth(), kh2 = islKh();
      // Schränke der Kochseite (Fronten zur Zeile, r = 180) und der Raumseite (r = 0) als echte Schränke – anklickbar, öffnen in 3D
      { let o = 0; islMods('v').forEach(m => { const sp = spec(m); items.push({ t: 'cab', id: 'iv' + m.id, label: label(m) + ' (Insel, Kochseite)', kind: 'b', w: m.w, d: q.cf, ah, ...sp, x: g.x + g.w / 2 - o - m.w / 2, z: g.z - g.d / 2 + q.cf / 2, r: 180 }); o += m.w; }); }
      if (kh2 === 'schrank') { let o = 0; islMods('h').forEach(m => { const sp = spec(m); items.push({ t: 'cab', id: 'ih' + m.id, label: label(m) + ' (Insel, Raumseite)', kind: 'b', w: m.w, d: q.cb, ah, ...sp, x: g.x - g.w / 2 + o + m.w / 2, z: g.z + g.d / 2 - q.cb / 2, r: 0 }); o += m.w; }); }
    }
    if (P.form === 'insel') { const g = isl(), z = g.z; items.push({ t: 'in', mods: 1, cf: islDepth().cf, cb: islDepth().cb, w: g.w, d: g.d, v: P.island.v, kv: islSide().kv, kh: islKh(), dekor: P.style.wgDek || 'top', ih: eqv('ihood', 'mulde'), hob: eqv('hobW', 80) - 2, x: g.x, z, r: 0 }); }
    P.op.forEach(o => { const d = { fl: opFl(o), a: opA(o), k: opK(o), dir: opDir(o) }; open.push(o.t === 'fenster' ? { t: 'fenster', wall: o.wall, s: o.s, w: o.w, y: opY(o), h: opHH(o), ...d } : o.t === 'balkon' ? { t: 'balkon', wall: o.wall, s: o.s, w: o.w, y: 0, h: opHH(o), ...d } : { t: 'tuer', wall: o.wall, s: o.s, w: o.w, ...d }); });
    // Heizkörper (Bestand oder neu) – als flacher Plattenheizkörper an der Wand
    (P.cx || []).filter(c => c.t === 'heiz').forEach(c => items.push({ t: 'hz', wall: c.wall, w: hzW(c), h: hzH(c), y0: hzY(c), ...pos(c.wall, c.s, 10) }));
    return { room: { w: W, d: D, walls: { N: 1, E: 1, S: 1, W: 1 } }, open, items, motif: bk === 'motiv' ? motif : null, style: { ...P.style, front: P.style.wood ? '#ffffff' : P.style.front, backC: bk === 'glas' || bk === 'dibond' ? backCol() : null, sink: sinkCol(), tap: eqv('tap', 'chrom'), hobDD: isDD() } };
  }
  let K = null, t3 = 0, p3 = null;
  const host3 = $('[data-kp-3d]');
  function schedule3D() { if (t3) return; t3 = setTimeout(() => { t3 = 0; K && K.set(toState()); }, 60); }
  function loadEngine() { return p3 || (p3 = new Promise((res, rej) => { if (window.PelPlanner3D) return res(); const s = document.createElement('script'); s.src = 'js/planner3d.js?v=' + VER; s.onload = res; s.onerror = rej; document.head.appendChild(s); })); }
  let l3 = null;
  const opts3 = () => ({ acc: ACC, onHover: hl2d, onEq: (q, cx, cy) => { const hr = host3.getBoundingClientRect(); openEq({ k: q.k, id: q.id, wall: q.wall, rx: cx - hr.left, ry: cy - hr.top }); }, onPick: (id, on) => { if (on) openNow.add(String(id)); else openNow.delete(String(id)); syncDoors(); if (!pop.hidden) renderPop(); }, onLost: lost3D, onRestored: restored3D });
  function mk3D() { K = PelPlanner3D(host3, opts3()); K.set(toState()); syncDoors(); }
  function load3D() {
    return l3 || (l3 = loadEngine()
      .then(() => { const l = $('.kp-load', host3); if (l) l.remove(); mk3D(); })
      .catch(() => { l3 = null; const l = $('.kp-load', host3); if (l) l.textContent = '3D-Ansicht konnte nicht geladen werden.'; }));
  }
  // Selbstheilung (17.10.): Bricht die Grafik weg (Treiber-Neustart, Überlast), zeigt die Bühne
  // kurz „startet neu“ – kommt der Browser-Kontext nicht von selbst zurück, legt der Planer die 3D-Ansicht neu an. Nie ein leeres Feld.
  let lostT = 0, msg3 = null;
  function msg3D(html) { if (!msg3) { msg3 = document.createElement('div'); msg3.className = 'kp-3dmsg'; msg3.setAttribute('role', 'status'); host3.appendChild(msg3); } msg3.innerHTML = html; msg3.hidden = false; }
  function unmsg3D() { if (msg3) msg3.hidden = true; }
  function lost3D() { clearTimeout(lostT); msg3D('<i class="kp-3dspin" aria-hidden="true"></i><b>3D-Ansicht startet neu …</b><small>Die Grafik Ihres Geräts hat kurz ausgesetzt. Ihre Planung bleibt erhalten.</small>'); lostT = setTimeout(heal3D, 2600); }
  function after3D() { const cb = $('[data-cam].on'); if (cb && cb.dataset.cam !== 'perspektive') K.view(cb.dataset.cam); if (night && K.mood) K.mood('abend', toState()); }
  function restored3D() { clearTimeout(lostT); unmsg3D(); if (!K) return; K.set(toState()); syncDoors(); after3D(); }
  function heal3D() {
    if (K && K.lost && !K.lost()) { restored3D(); return; }
    try { if (K) K.dispose(); } catch (e) { }
    K = null; $$('canvas', host3).forEach(c => c.remove());
    try { mk3D(); unmsg3D(); after3D(); }
    catch (e) { K = null; msg3D('<b>Die 3D-Ansicht ist gerade blockiert</b><small>Der Browser hat die Grafik nach einer Überlastung gesperrt. Einmal neu laden behebt das – Ihre Planung bleibt erhalten.</small><button type="button" class="kp-3dre">Seite neu laden</button>'); const b = $('.kp-3dre', host3); if (b) b.addEventListener('click', () => { try { saveAuto(); } catch (er) { } location.reload(); }); }
  }
  // Hover-Kopplung: Wandansicht ↔ 3D (Maus)
  function hl2d(id) { $$('.hl3', wallsEl).forEach(x => x.classList.remove('hl3')); if (id == null) return; const g = $(`[data-m="${id}"],[data-u="${id}"]`, wallsEl); if (g) g.classList.add('hl3'); }
  let hov3 = null; const hover3 = id => { if (id === hov3) return; hov3 = id; if (K && K.highlight) K.highlight(id); };
  wallsEl.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse' || drag) return; const g = e.target.closest('[data-m],[data-u]'); hover3(g ? (g.dataset.m || g.dataset.u) : null); });
  wallsEl.addEventListener('pointerleave', () => hover3(null));
  let night = false;
  $$('[data-mood]').forEach(b => b.addEventListener('click', () => { night = !night; $$('[data-mood]').forEach(x => { x.classList.toggle('on', night); x.setAttribute('aria-pressed', night); x.innerHTML = night ? '☀︎ Tag' : '☾ Abend'; }); root.classList.toggle('kp-night', night); K && K.mood && K.mood(night ? 'abend' : 'tag', toState()); }));
  $$('[data-cam]').forEach(b => b.addEventListener('click', () => { $$('[data-cam]').forEach(x => x.classList.toggle('on', x === b)); K && K.view(b.dataset.cam); }));
  function syncDoors() { const on = !!(K && K.isAllOpen()); $$('[data-kp-doors]').forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const sp = $('span', b); if (sp) sp.textContent = on ? 'Türen schließen' : 'Türen öffnen'; }); }
  $$('[data-kp-doors]').forEach(b => b.addEventListener('click', () => { if (!K) return; const on = K.openAll(!K.isAllOpen()); openNow.clear(); syncDoors(); if (!pop.hidden) renderPop(); toast(on ? 'Alle Türen, Klappen und Auszüge sind offen – einzelne Schränke in 3D antippen.' : 'Alles wieder zu.'); }));

  /* ---------------- Verlauf / Link ---------------- */
  const hist = [];
  const opt = m => { const o = {}; if (m.h && M[m.t].hs && m.h !== HDEF(m.t)) o.h = m.h; if (m.a) o.a = m.a; if (m.ax) o.ax = m.ax; ['axo', 'tu', 'g2', 'to', 'led'].forEach(k => { if (m[k] != null) o[k] = m[k]; }); return Object.keys(o).length ? o : null; };
  const ser = () => { const o = { f: P.form, r: P.room, rw: Object.fromEntries(Object.entries(P.rows).map(([k, v]) => [k, v.map(m => { const q = opt(m); return q ? [m.t, m.w, q] : [m.t, m.w]; })])), tp: P.top, op: P.op.map(o2 => { const x = opExtra(o2); return x ? [o2.t, o2.wall, o2.s, o2.w, x] : [o2.t, o2.wall, o2.s, o2.w]; }), is: P.island, s: P.style, ah: P.ah || 90 }; const up = Object.entries(P.up || {}); if (up.length) o.up = Object.fromEntries(up.map(([k, v]) => [k, v.map(u => { const q = opt(u); return q ? [u.t, u.s, u.w, q] : [u.t, u.s, u.w]; })])); if ((P.cx || []).length) o.cx = P.cx.map(c => { const x = cxExtra(c); return x ? [c.t, c.wall, c.s, x] : [c.t, c.wall, c.s]; }); return JSON.stringify(o); };
  const opExtra = o => { const x = {}; ['fl', 'a', 'k', 'dir', 'y0', 'hh'].forEach(k => { if (o[k] != null) x[k] = o[k]; }); return Object.keys(x).length ? x : null; };
  const cxExtra = c => { const o = {}; if (c.h != null) o.h = c.h; else if (c.z) o.z = c.z; if (c.t === 'dose') { if (cxN(c) !== 2) o.n = cxN(c); if (cxO(c) === 'v') o.o = 'v'; } if (c.t === 'abluft' && cxD(c) !== 150) o.d = cxD(c); if (c.t === 'heiz') { if (c.hw) o.hw = c.hw; if (c.hh) o.hh = c.hh; if (c.y0 != null) o.y0 = c.y0; } if (c.neu) o.neu = 1; return Object.keys(o).length ? o : null; };
  const nIn = (v, a, b) => { v = +v; return isFinite(v) ? Math.max(a, Math.min(b, Math.round(v))) : null; };
  function opFrom(t, wall, s, w, x) {
    const o = { id: uid++, t, wall, s, w }; if (!x || typeof x !== 'object') return o;
    if ([1, 2].includes(+x.fl)) o.fl = +x.fl; if (x.a === 'l' || x.a === 'r') o.a = x.a; if ((OPK[t] || []).some(k => k[0] === x.k)) o.k = x.k; if (t === 'tuer' && (x.dir === 'in' || x.dir === 'out')) o.dir = x.dir;
    if (t === 'fenster') { const y = nIn(x.y0, 0, 200), h = nIn(x.hh, 40, 250); if (y != null) o.y0 = y; if (h) o.hh = Math.min(h, 250 - (o.y0 ?? 105)); }
    return o;
  }
  function cxFrom(t, wall, s, x) {
    const c = { id: uid++, t, wall, s: Math.round(+s) || 0 }; if (!x || typeof x !== 'object') return c;
    if (x.h != null && CXLIM[t]) { const h = nIn(x.h, ...CXLIM[t]); if (h != null) c.h = h; }
    if (typeof x.z === 'string' && c.h == null && (t === 'dose' ? DZ : t === 'abluft' ? AZ : []).some(z => z[0] === x.z)) c.z = x.z;
    if (t === 'dose') { if ([1, 2, 3].includes(+x.n)) c.n = +x.n; if (x.o === 'v') c.o = 'v'; }
    if (t === 'abluft' && ADS.includes(+x.d)) c.d = +x.d;
    if (t === 'heiz') { const hw = nIn(x.hw, 30, 300), hh = nIn(x.hh, 20, 200), y0 = nIn(x.y0, 0, 180); if (hw) c.hw = hw; if (hh) c.hh = hh; if (y0 != null) c.y0 = y0; }
    if (x.neu) c.neu = 1; return c;
  }
  function des(j) {
    const o = JSON.parse(j); P = { form: FORMS[o.f] ? o.f : 'l', room: o.r, rows: {}, up: {}, top: o.tp || {}, op: [], island: o.is || { w: 180, v: 'kochfeld' }, style: o.s, ah: o.ah || 90 };
    for (const k in o.rw) P.rows[k] = o.rw[k].filter(([t]) => M[t]).map(([t, w, q]) => mk(t, w, q));
    if (o.up) for (const k in o.up) if (P.rows[k]) P.up[k] = o.up[k].filter(([t]) => M[t] && isUp(t)).map(([t, s, w, q]) => { const u = mk(t, w, q); u.s = s; return u; });
    sel = null; selOp = null; selCx = null;
    if (o.op) P.op = o.op.filter(q => Array.isArray(q) && OPN[q[0]] && WN[q[1]]).map(([t, wall, s, w, x]) => opFrom(t, wall, s, w, x));
    else { if (o.wi) P.op.push({ id: uid++, t: 'fenster', wall: o.wi.wall, s: o.wi.s, w: o.wi.w }); P.op.push(defaultDoor()); } // ältere Links
    P.cx = Array.isArray(o.cx) ? o.cx.filter(q => Array.isArray(q) && CXN[q[0]] && WN[q[1]]).map(([t, wall, s, x]) => cxFrom(t, wall, s, x)) : [];
  }
  const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  let lastHash = '';
  function change(noHist) {
    { const sd = document.querySelector('.kp-stage.kp-docked'); if (sd) { sd.classList.remove('kp-pulse'); void sd.offsetWidth; sd.classList.add('kp-pulse'); } }
    const dropped = normCorners(); if (dropped.length) toast('Eckschränke passen nur in die Ecken einer L- oder U-Küche.');
    const filled = fillCorners(); if (filled.length && !dropped.length) toast('Die Ecke bleibt nicht offen: Blindeckschrank eingesetzt – in „Ecke“ können Sie Karussell oder Le-Mans wählen.');
    const goneUp = followHoods(); linkHoods(); try { autoHinges(); } catch (e) { } if (goneUp) toast(`Die Haube ist mit dem Kochfeld mitgewandert – ${goneUp > 1 ? goneUp + ' Hängeschränke hatten' : 'ein Hängeschrank hatte'} daneben keinen Platz mehr.`, undo);
    const j = ser(); if (!noHist && hist[hist.length - 1] !== j) { hist.push(j); if (hist.length > 60) hist.shift(); }
    lastHash = '#k=' + b64(j); history.replaceState(null, '', lastHash); try { guardChanged(); } catch (e) { }
    renderWalls(); renderTips(); syncUI(); schedule3D(); $$('[data-undo]').forEach(b => b.disabled = hist.length < 2);
    try { cookWinCheck(noHist); } catch (e) { }
  }
  function undo() { if (hist.length < 2) return; hist.pop(); des(hist[hist.length - 1]); change(true); }
  $$('[data-undo]').forEach(b => b.addEventListener('click', undo));
  // Neu anfangen (17.10.): Raum leeren · neu einrichten mit gleichen Maßen · ganz von vorn – alles mit Rückgängig
  function resetPlan(k) {
    if (k === 'leer') {
      for (const w in P.rows) P.rows[w] = [];
      P.up = {}; for (const w in P.top) P.top[w] = 0;
      if (P.form === 'insel') P.island.v = 'frei';
    } else if (k === 'neu') {
      const ops = P.op.map(o => ({ ...o })); fresh(P.form, { room: { ...P.room }, ah: P.ah, cx: P.cx, style: { ...P.style } });
      P.op = ops; P.op.forEach(o => { o.s = clampOp(o, o.s); });
      const wq = (P.cx || []).find(c => c.t === 'wasser'); if (wq) try { moveApp(['sp'], wq); } catch (e) { }
    } else { fresh('l', { ah: 90 }); attach = null; try { syncAttach(); } catch (e) { } }
    sel = null; selOp = null; selCx = null; eqSel = null; disarm(); pop.hidden = true; openNow.clear(); xfade(); change(); renderPal();
    if (K && K.view) { K.view('perspektive'); $$('[data-cam]').forEach(x => x.classList.toggle('on', x.dataset.cam === 'perspektive')); }
    go(k === 'alles' ? 0 : 1);
    toast({ leer: 'Der Raum ist leer – Fenster, Türen und Anschlüsse sind geblieben. Ziehen Sie Schränke einfach wieder hinein.' + (P.form === 'insel' ? ' Die Insel bleibt als freie Fläche.' : ''), neu: `Neu eingerichtet: ${FORMS[P.form].n} in Ihrem Raum (${P.room.w} × ${P.room.d} cm), Fenster und Türen wie gehabt.`, alles: 'Alles auf Anfang – viel Spaß beim Planen!' }[k], undo);
  }
  { const box = $('[data-kp-new]'), nb = box && $('[data-kp-newb]', box), nm = box && $('[data-kp-newm]', box);
    if (box && nb && nm) {
      const setOpen = on => { nm.hidden = !on; nb.setAttribute('aria-expanded', on); root.classList.toggle('kp-newon', on);
        if (on) { const sm = $('[data-kp-reset="neu"] small', nm); if (sm) sm.textContent = `Frische Grundausstattung als ${FORMS[P.form].n} – gleicher Raum (${P.room.w} × ${P.room.d} cm), Fenster und Türen bleiben`; const l = $('[data-kp-reset="leer"] small', nm); if (l) l.textContent = 'Alle Schränke raus' + (P.form === 'insel' ? ' (Insel bleibt als freie Fläche)' : '') + ' · Raum, Fenster, Türen und Anschlüsse bleiben'; requestAnimationFrame(() => { const f = $('[data-kp-reset]', nm); f && f.focus({ preventScroll: true }); }); } };
      nb.addEventListener('click', e => { e.stopPropagation(); setOpen(nm.hidden); });
      document.addEventListener('pointerdown', e => { if (!nm.hidden && !e.target.closest('[data-kp-new]')) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !nm.hidden) { setOpen(false); nb.focus(); } });
      nm.addEventListener('click', e => { if (e.target.closest('[data-kp-newx]')) { setOpen(false); nb.focus(); return; } const b = e.target.closest('[data-kp-reset]'); if (!b) return; setOpen(false); resetPlan(b.dataset.kpReset); });
    } }
  function fromHash() {
    let h = location.hash.slice(1); if (!h && /[?&]gesendet=1/.test(location.search)) { try { h = (sessionStorage.getItem('kp-last') || '').slice(1); } catch (er) { } } if (!h) return false;
    try {
      if (h.startsWith('k=')) { des(unb64(h.slice(2))); return true; }
      const p = h.split('|'); const fm = { zeile: 'zeile', zwei: 'zwei', l: 'l', u: 'u', insel: 'insel', theke: 'l' }[p[0]];
      if (fm) { fresh(fm); if (p[1]) { P.style.front = '#' + p[1]; } if (p[3] && TOPS.some(t => t[0] === p[3])) P.style.top = p[3]; if (p[4]) P.style.handle = p[4]; P.style.wood = p[5] || null; if (p[2]) P.style.finish = p[2]; return true; }
    } catch (e) { }
    return false;
  }

  /* ---------------- Schritte & Bedienfelder ---------------- */
  const steps = $$('[data-kstep]'), panes = $$('[data-kpane]');
  function go(i, quiet) { if (selCx) { selCx = null; try { renderWalls(); } catch (e) { } } steps.forEach((b, j) => { b.classList.toggle('on', j === i); b.classList.toggle('done', j < i); }); panes.forEach((p, j) => p.classList.toggle('on', j === i)); root.dataset.step = i; if (innerWidth < 1000 && !quiet) { const t = i === 3 ? $('[data-kpane].on') : ($('.kp-stph.on') || $('.kp-stage')); if (t && i !== 1) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } renderPop(); }
  steps.forEach((b, i) => b.addEventListener('click', () => go(i)));
  $$('[data-kgo]').forEach(b => b.addEventListener('click', () => go(+b.dataset.kgo)));
  root.addEventListener('click', e => { const b = e.target.closest('[data-kp-lookinfo] [data-kgo]'); if (b) go(+b.dataset.kgo); });
  $('[data-kp-forms]').innerHTML = Object.entries(FORMS).map(([k, f]) => `<button type="button" data-form="${k}"><svg viewBox="0 0 64 46" aria-hidden="true"><rect x="2" y="2" width="60" height="42" rx="3" fill="none" stroke="currentColor" stroke-opacity=".25"/><path d="${f.p}"/></svg><b>${f.n}</b><small>${f.d}</small></button>`).join('');
  $('[data-kp-forms]').addEventListener('click', e => { const b = e.target.closest('[data-form]'); if (!b) return; const st = P.style, room = { ...P.room }; fresh(b.dataset.form, { style: st, room, cx: P.cx }); sel = null; const wq = P.cx.find(c => c.t === 'wasser'); if (wq) moveApp(['sp'], wq); change(); K && K.view('perspektive'); });
  const rw = $('[data-kp-rw]'), rd = $('[data-kp-rd]');
  function roomIn() { P.room.w = +rw.value; P.room.d = +rd.value; for (const w in P.rows) makeRoomQuiet(w); for (const w in P.up) { const L = wallLen(w); P.up[w] = P.up[w].filter(u => u.w <= L); P.up[w].forEach(u => { u.s = Math.max(0, Math.min(L - u.w, u.s)); }); } P.op.forEach(o => { if (o.w > wallLen(o.wall) - 20) o.w = OPW[o.t].filter(v => v <= wallLen(o.wall) - 20).pop() || o.w; o.s = clampOp(o, o.s); }); (P.cx || []).forEach(c => { c.s = clampCx(c, c.s); }); followHoods(); syncRoomOut(); renderWalls(); renderTips(); schedule3D(); }
  function makeRoomQuiet(w) { let over = -free(w); if (over <= 0) { fillGap(w); return; } const R = [...P.rows[w]].reverse().filter(x => x.t === 'us'); for (const x of R) { if (over <= 0.5) break; const fit = M.us.ws.filter(v => v <= x.w - over).pop(); if (fit) { over -= x.w - fit; x.w = fit; } else { over -= x.w; P.rows[w] = P.rows[w].filter(y => y !== x); } } }
  function fillGap(w) { if (!P.rows[w].length) return; const f = free(w); if (f >= 30) { const last = [...P.rows[w]].reverse().find(x => x.t === 'us'); const grow = last && M.us.ws.filter(v => v <= last.w + f).pop(); if (last && grow > last.w) last.w = grow; else fillRest(w); } }
  [rw, rd].forEach(el => { el.addEventListener('input', roomIn); el.addEventListener('change', () => change()); });
  const ahIn = $('[data-kp-ah]');
  if (ahIn) { ahIn.addEventListener('input', () => { P.ah = +ahIn.value; $('[data-kp-aho]').textContent = P.ah + ' cm'; renderWalls(); schedule3D(); }); ahIn.addEventListener('change', () => change()); }
  function syncRoomOut() { if (ahIn) { ahIn.value = P.ah || 90; $('[data-kp-aho]').textContent = (P.ah || 90) + ' cm'; } $('[data-kp-rwo]').textContent = (P.room.w / 100).toFixed(2).replace('.', ',') + ' m'; $('[data-kp-rdo]').textContent = (P.room.d / 100).toFixed(2).replace('.', ',') + ' m'; }
  const anyTop = () => Object.values(P.top).some(Boolean) || Object.values(P.up || {}).some(l => l.some(u => u.t !== 'dh'));
  $$('[data-kp-gripend]').forEach(b => b.addEventListener('click', () => { P.style.gripEnd = gripEnd() ? 'wange' : 'leiste'; change(); renderPal(); if (gripEnd()) toast('Die Griffleisten laufen jetzt seitlich ums Eck weiter – statt Wange.'); }));
  $$('[data-kp-gripled]').forEach(b => b.addEventListener('click', () => { P.style.gripLed = P.style.gripLed ? 0 : 1; change(); renderPal(); if (P.style.gripLed) toast('Griffleisten leuchten jetzt – am schönsten im Abendmodus.'); if (P.style.gripLed && !night) { const mb = $('[data-mood]'); mb && mb.click(); } }));
  $$('[data-kp-top]').forEach(b => b.addEventListener('click', () => { const on = !anyTop(); const had = Object.keys(P.up).length; for (const k in P.top) P.top[k] = on ? 1 : 0; P.up = {}; change(); if (had) toast(on ? 'Hängeschränke wieder automatisch über allen Unterschränken.' : 'Alle Hängeschränke entfernt.', undo); }));
  // Stil
  const swc = c => c.startsWith('wood') ? WOOD[c.slice(5)] : c;
  const fan = cols => cols.map(([, c], i, a) => `<i style="--c:${swc(c)};--i:${(i - (a.length - 1) / 2).toFixed(2)}"${c.startsWith('wood') ? ' class="wd"' : ''}></i>`).join('');
  { const we = $('[data-kp-worlds]'); if (we) we.innerHTML = WORLDS.map(w => `<button type="button" class="kp-world" data-world="${w.k}" aria-pressed="false"><span class="kp-fan" aria-hidden="true">${fan(w.c)}</span><b>${w.n}</b><small>${w.d}</small></button>`).join('') + `<button type="button" class="kp-world kp-wwish" data-world="wunsch" aria-pressed="false"><span class="kp-fan rb" aria-hidden="true"><i style="--i:-1.5"></i><i style="--i:-.5"></i><i style="--i:.5"></i><i style="--i:1.5"></i></span><b>Ihre Wunschfarbe</b><small>Jeder Farbton möglich</small></button>`; }
  // Kamera folgt der Auswahl – Blick fährt zum geänderten Teil
  let folT = 0;
  function follow(k) { if (!K || !K.focusOn) return; clearTimeout(folT); folT = setTimeout(() => { try { if (K.focusOn(k)) $$('[data-cam]').forEach(b => b.classList.toggle('on', k === 'uebersicht' && b.dataset.cam === 'perspektive')); } catch (e) { } }, 150); }
  let wishT = 0;
  /* ---- Alle Farben: Fächer, Feinregler, Farbcode ---- */
  const acEl = $('[data-kp-allc]');
  if (acEl) {
    const LV = ['zart', 'sanft', 'kräftig', 'tief'], who = acEl.dataset.person || 'Ihr Küchenstudio';
    let grid = ''; for (let i = 0; i < 4; i++) FAN.forEach(([fn, t]) => { const [n, c] = t[i]; grid += `<button type="button" class="kp-acs" data-front="${c}" style="--c:${c}" title="${n}" aria-label="${n} (${fn}, ${LV[i]})"></button>`; });
    grid += NEUT.map(([n, c]) => `<button type="button" class="kp-acs nt" data-front="${c}" style="--c:${c}" title="${n}" aria-label="${n}"></button>`).join('');
    acEl.innerHTML = `<div class="kp-ac-cur" data-ac-cur aria-live="polite"></div>
<div class="kp-ac-grid" data-ac-grid>${grid}</div>
<button type="button" class="kp-ac-ft" data-ac-ft aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span><b>Ton fein abstimmen</b><small>Farbton, Helligkeit, Intensität – oder Farbcode eingeben</small></span></button>
<div class="kp-ac-fb" data-ac-fb hidden>
  <label class="kp-ac-r"><span>Farbton</span><input type="range" min="0" max="359" step="1" data-ac-h aria-label="Farbton"></label>
  <label class="kp-ac-r"><span>Helligkeit</span><input type="range" min="14" max="97" step="1" data-ac-l aria-label="Helligkeit"></label>
  <label class="kp-ac-r"><span>Intensität</span><input type="range" min="0" max="72" step="1" data-ac-c aria-label="Intensität"></label>
  <form class="kp-ac-code" data-ac-code><input data-ac-in placeholder="zum Beispiel RAL 3015 oder #D8A0A6" autocomplete="off" spellcheck="false" aria-label="Farbcode eingeben"><button type="submit">Übernehmen</button></form>
</div>
<p class="kp-p sm kp-ac-note">Am Bildschirm wirken Farben je nach Gerät etwas anders. ${who} bekommt mit Ihrer Anfrage den passenden Herstellerton dazu und zeigt Ihnen das Originalmuster.</p>`;
    const H = $('[data-ac-h]', acEl), Lr = $('[data-ac-l]', acEl), Cr = $('[data-ac-c]', acEl), fb = $('[data-ac-fb]', acEl), ft = $('[data-ac-ft]', acEl);
    const setFront = (hex, final) => { P.style.front = hex; P.style.wood = null; P.style.world = 'wunsch'; clearTimeout(wishT); if (final) { xfade(); change(); renderPal(); follow('front'); } else wishT = setTimeout(() => { change(); renderPal(); }, 160); };
    const fromSl = final => setFront(lch2hex(+Lr.value, +Cr.value, +H.value), final);
    [H, Lr, Cr].forEach(r => { r.addEventListener('input', () => { fromSl(false); acSync(true); }); r.addEventListener('change', () => fromSl(true)); });
    ft.addEventListener('click', () => { const on = fb.hidden; fb.hidden = !on; ft.setAttribute('aria-expanded', on); if (on) acSync(); });
    $('[data-ac-code]', acEl).addEventListener('submit', e => { e.preventDefault(); const inp = $('[data-ac-in]', acEl), v = inp.value.trim(); let hex = null;
      const r = v.match(/(?:ral)?\s*(\d{4})\b/i), h = v.match(/#?([0-9a-f]{6})\b/i);
      if (h && !/^\d{4}$/.test(v.replace(/\s|ral/gi, ''))) hex = '#' + h[1].toLowerCase(); else if (r) { const x = RAL.find(q => q[0] === r[1]); if (x) hex = x[2]; else { toast(`RAL ${r[1]} kennt der Planer nicht – bitte mit den Reglern annähern. ${who} bringt den Originalfächer mit.`); return; } }
      if (!hex) { toast('Bitte einen RAL-Code (zum Beispiel RAL 3015) oder einen Farbwert wie #D8A0A6 eingeben.'); return; }
      inp.value = ''; inp.blur(); setFront(hex, true); });
  }
  // Anzeige „Ihr Ton“ + Regler-Stand + Verläufe der Regler-Spuren
  function acSync(live) {
    if (!acEl) return; const s = P.style, hex = !s.wood && isHex(s.front) ? s.front : null, cur = $('[data-ac-cur]', acEl);
    if (cur) cur.innerHTML = hex ? `<i style="--c:${hex}"></i><span><b>${s.world === 'wunsch' || !WORLDS.some(w => w.c.some(c => c[1] === hex)) ? 'Ihre Wunschfarbe' : 'Ihr Ton'}: ${wishName(hex)}</b><small>${hex.toUpperCase()} · nah an RAL ${ralNear(hex)[0][0]} ${ralNear(hex)[0][1]}</small></span>` : `<i class="wd" style="--c:${WOOD[s.wood] || '#c39a6b'}"></i><span><b>Holzfront</b><small>Tippen Sie eine Farbe an, um zu lackierten Fronten zu wechseln.</small></span>`;
    const H = $('[data-ac-h]', acEl), Lr = $('[data-ac-l]', acEl), Cr = $('[data-ac-c]', acEl); if (!H) return;
    if (!live && hex) { const [L, C, h] = lch(hex); H.value = Math.round(h); Lr.value = Math.round(Math.min(97, Math.max(14, L))); Cr.value = Math.round(Math.min(72, C)); }
    const L = +Lr.value, C = +Cr.value, h = +H.value, st = (f, n) => Array.from({ length: n }, (_, i) => f(i / (n - 1))).join(',');
    H.style.setProperty('--tr', `linear-gradient(90deg,${st(t => lch2hex(Math.max(L, 45), Math.max(C, 34), t * 359), 13)})`);
    Lr.style.setProperty('--tr', `linear-gradient(90deg,${st(t => lch2hex(14 + t * 83, C, h), 7)})`);
    Cr.style.setProperty('--tr', `linear-gradient(90deg,${st(t => lch2hex(L, t * 72, h), 6)})`);
    [H, Lr, Cr].forEach(r => r.style.setProperty('--th', hex || lch2hex(L, C, h)));
  }
  function renderTones() {
    const box = $('[data-kp-fronts]'); if (!box) return; const s = P.style, wk = s.world && (s.world === 'wunsch' || WORLDS.some(w => w.k === s.world)) ? s.world : worldOf(s), W0 = WORLDS.find(w => w.k === wk);
    $$('[data-world]').forEach(b => { const on = b.dataset.world === wk; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    box.innerHTML = W0 ? W0.c.map(([n, c]) => `<button type="button" class="kp-sw${c.startsWith('wood') ? ' wd' : ''}" data-front="${c}" style="--c:${swc(c)}"><i></i><span>${n}</span></button>`).join('') : '';
    box.hidden = !W0;
    const wn = $('[data-kp-wn]'); if (wn) wn.innerHTML = W0 ? `<b>${W0.n}</b> · ${W0.m}` : `<b>Ihre Wunschfarbe${isHex(s.front) && !s.wood ? ' „' + wishName(s.front) + '“' : ''}</b> · Unten unter „Alle Farben“ frei wählen.`;
    acSync();
    const tip = $('[data-kp-wtip]'); if (tip) {
      const pr = W0 ? W0.pair : pairOf(s);
      const same = Object.keys(pr).every(k => s[k] === pr[k]);
      const tn = (TOPS.find(t => t[0] === pr.top) || ['', ''])[1], hn = (HANDLES.find(h => h[0] === pr.handle) || ['', ''])[1], wl = (WALLC.find(c => c[1] === pr.wall) || ['', ''])[0];
      tip.innerHTML = same ? `<span class="ok">✓ Stimmig abgestimmt</span> Arbeitsplatte ${tn} · Griffe ${hn} · Wand ${wl}` : `<span>Passt dazu: Arbeitsplatte <b>${tn}</b> · Griffe <b>${hn}</b> · Wand <b>${wl}</b></span><button type="button" data-kp-pair>Stimmig abstimmen</button>`;
    }
  }
  $('[data-kp-handles]').innerHTML = HANDLES.map(([k, n]) => `<button type="button" data-handle="${k}"><svg viewBox="0 0 40 26" aria-hidden="true"><rect x="1" y="1" width="38" height="24" rx="2" fill="#e9e4dc" stroke="#cfc6b9"/>${k === 'grifflos' ? '<rect x="1" y="1" width="38" height="3" fill="#8b8379"/>' : k === 'knopf' ? `<circle cx="20" cy="7.4" r="2.4" fill="${HCOL[k]}" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>` : `<rect x="12" y="6" width="16" height="2.4" rx="1.2" fill="${HCOL[k]}"/>`}</svg>${n}</button>`).join('');
  const sw = (s2, html) => { const el = $(s2); if (el) el.innerHTML = html; };
  sw('[data-kp-finish]', FINISHES.map(([k, n]) => `<button type="button" data-finish="${k}">${n}</button>`).join(''));
  sw('[data-kp-fstyle]', FSTY.map(([k, n]) => `<button type="button" data-fstyle="${k}">${n}</button>`).join(''));
  function lookSvg(st) {
    const F = st.wood ? WOOD[st.wood] : st.front, T = TOPS.find(t => t[0] === st.top)[2], Fl = (FLOORS.find(f => f[0] === st.floor) || FLOORS[0])[2], str = lum(F) > .5 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.18)';
    const fr = (x, y, w, h, hb) => { let r = `<rect x="${x + .3}" y="${y + .3}" width="${w - .6}" height="${h - .6}" rx=".6" fill="${F}" stroke="${str}" stroke-width=".4"/>`; if (st.frame) r += `<rect x="${x + 2.2}" y="${y + 2.2}" width="${w - 4.4}" height="${h - 4.4}" rx=".4" fill="none" stroke="${str}" stroke-width=".5"/>`; r += st.handle === 'grifflos' ? `<rect x="${x + .4}" y="${hb ? y + h - 1.4 : y + .4}" width="${w - .8}" height="1" fill="${shade(F, -.35)}"/>` : st.handle === 'knopf' ? `<circle cx="${x + w / 2}" cy="${hb ? y + h - 2.8 : y + 3}" r="1" fill="${HCOL.knopf}"/>` : `<rect x="${x + w / 2 - 3.5}" y="${hb ? y + h - 3.4 : y + 2.4}" width="7" height="1.1" rx=".5" fill="${HCOL[st.handle]}"/>`; return r; };
    let s = `<rect width="120" height="72" fill="${st.wall}"/><rect y="64" width="120" height="8" fill="${Fl}"/><rect x="54" y="7" width="12" height="20" rx="1" fill="#cfe4f3" stroke="#fff" stroke-width="1"/>`;
    if (st.back && st.back !== 'wand') s += `<rect x="6" y="31" width="108" height="9" fill="${st.back === 'platte' ? T : st.back === 'fliese' ? '#ece8e1' : shade(F, -.1)}"/>`;
    [[6, 23], [29, 23], [74, 20], [94, 20]].forEach(([x, w]) => s += fr(x, 6, w, 21, 1));
    s += `<rect x="5" y="40" width="110" height="3" fill="${T}"/>`;
    [[6, 27], [33, 27], [60, 27], [87, 27]].forEach(([x, w], i) => { s += i === 2 ? fr(x, 43, w, 19) : fr(x, 43, w, 6) + fr(x, 49, w, 6.5) + fr(x, 55.5, w, 6.5); });
    return s + `<rect x="5" y="62" width="110" height="2" fill="#2b2b2b"/>`;
  }
  sw('[data-kp-looks]', LOOKS.map(([k, n, d, st]) => `<button type="button" class="kp-look" data-look="${k}" aria-pressed="false"><svg viewBox="0 0 120 72" aria-hidden="true">${lookSvg(st)}</svg><b>${n}</b><small>${d}</small></button>`).join(''));
  // weicher Übergang beim Stilwechsel: altes 3D-Bild blendet aus, Wandansicht blendet ein
  function xfade() {
    if (RMO) return;
    try { if (K && K.snapshot) { $$('.kp-xf', host3).forEach(x => x.remove()); const im = new Image(); im.className = 'kp-xf'; im.alt = ''; im.src = K.snapshot(); host3.appendChild(im); setTimeout(() => { im.classList.add('out'); setTimeout(() => im.remove(), 800); }, 160); } } catch (e) { }
    requestAnimationFrame(() => { if (wallsEl.animate) wallsEl.animate([{ opacity: .35, filter: 'blur(1.5px)' }, { opacity: 1, filter: 'none' }], { duration: 520, easing: 'ease-out' }); });
  }
  (function () { const bk = $('[data-kp-backs]'); if (bk) { bk.classList.remove('kp-sws'); bk.classList.add('kp-eq3'); if (!$('[data-kp-eq3]')) bk.insertAdjacentHTML('afterend', '<p class="kp-l">Spüle, Kochfeld & Haube</p><div class="kp-eq3" data-kp-eq3></div>'); } })();
  function renderEq3() {
    const bk = $('[data-kp-backs]'); if (bk) bk.innerHTML = eqRows('bs', null, 1);
    const e3 = $('[data-kp-eq3]'); if (!e3) return; const q = eqData();
    let h = ''; if (q.spuele) h += eqRows('sp', null, 1); if (Object.values(P.rows).flat().some(m => m.t === 'kf' || m.t === 'ko')) h += eqRows('kf', null, 1); if (q.dunstabzug && !isDD()) h += eqRows('dh', null, 1); if (q.inselAbzug) h += eqRows('isl', null, 1);
    e3.innerHTML = h || '<p class="kp-p sm">Noch keine Spüle und kein Kochfeld geplant – in Schritt 2 hineinziehen.</p>';
  }
  sw('[data-kp-wallc]', WALLC.map(([n, c]) => `<button type="button" class="kp-sw" data-wallc="${c}" style="--c:${c}"><i></i><span>${n}</span></button>`).join(''));
  sw('[data-kp-floors]', FLOORS.map(([k, n, c]) => `<button type="button" class="kp-sw" data-floor="${k}" style="--c:${c}"><i></i><span>${n}</span></button>`).join(''));
  $('[data-kp-tops]').innerHTML = TOPS.map(([k, n, c]) => `<button type="button" class="kp-sw" data-top="${k}" style="--c:${c}"><i></i><span>${n}</span></button>`).join('');
  root.addEventListener('click', e => {
    const f = e.target.closest('[data-front]'), h = e.target.closest('[data-handle]'), t = e.target.closest('[data-top]'), st = e.target.closest('[data-style]');
    const fi = e.target.closest('[data-finish]'), bk = e.target.closest('[data-back]'), wc = e.target.closest('[data-wallc]'), fl = e.target.closest('[data-floor]'), fs = e.target.closest('[data-fstyle]'), lk = e.target.closest('[data-look]');
    if (lk) { const L = LOOKS.find(x => x[0] === lk.dataset.look); if (!L) return; xfade(); Object.assign(P.style, L[3], { look: L[0] }); P.style.world = worldOf(P.style); change(); renderPal(); follow('uebersicht'); toast(`Stil „${L[1]}“ übernommen – in Schritt 3 können Sie alles fein anpassen.`); return; }
    const wb = e.target.closest('[data-world]');
    if (wb) {
      const k = wb.dataset.world; P.style.world = k;
      if (k === 'wunsch') { P.style.world = 'wunsch'; renderTones(); if (acEl) { const pn = acEl.closest('.kp-panel'), sc = pn && getComputedStyle(pn).overflowY !== 'visible' ? pn : null; if (sc) sc.scrollTo({ top: sc.scrollTop + acEl.getBoundingClientRect().top - sc.getBoundingClientRect().top - 40, behavior: RMO ? 'auto' : 'smooth' }); else acEl.scrollIntoView({ behavior: RMO ? 'auto' : 'smooth', block: 'center' }); acEl.classList.remove('kp-flash'); void acEl.offsetWidth; acEl.classList.add('kp-flash'); } return; }
      const W0 = WORLDS.find(w => w.k === k); if (W0 && !W0.c.some(c => P.style.wood ? c[1] === 'wood:' + P.style.wood : c[1] === P.style.front)) { const c = W0.c[W0.k === 'gruen' ? 2 : 0][1]; if (c.startsWith('wood:')) P.style.wood = c.slice(5); else { P.style.front = c; P.style.wood = null; } xfade(); change(); renderPal(); follow('front'); }
      renderTones(); return;
    }
    if (e.target.closest('[data-kp-pair]')) { xfade(); Object.assign(P.style, pairOf(P.style)); change(); renderPal(); toast('Abgestimmt: Arbeitsplatte, Griffe und Wand passen jetzt zu Ihrer Farbe.'); return; }
    if (fs) { xfade(); P.style.frame = +fs.dataset.fstyle; change(); renderPal(); follow('front'); return; }
    if (fi || bk || wc || fl) { xfade(); if (fi) P.style.finish = fi.dataset.finish; if (bk) P.style.back = bk.dataset.back; if (wc) P.style.wall = wc.dataset.wallc; if (fl) P.style.floor = fl.dataset.floor; change(); follow(fi ? 'front' : bk ? 'bs' : 'uebersicht'); return; }
    if (f) { const v = f.dataset.front; if (v.startsWith('wood:')) P.style.wood = v.slice(5); else { P.style.front = v; P.style.wood = null; } P.style.world = worldOf(P.style); }
    else if (h) P.style.handle = h.dataset.handle; else if (t) P.style.top = t.dataset.top;
    else if (st) { const S = STY[st.dataset.style]; Object.assign(P.style, S); P.style.world = worldOf(P.style); }
    else return;
    xfade(); change(); renderPal(); follow(f ? 'front' : h ? 'handle' : t ? 'top' : 'uebersicht');
  });
  const STY = { hell: { front: '#f1eee8', wood: null, handle: 'grifflos', top: 'eiche' }, dunkel: { front: '#232426', wood: null, handle: 'grifflos', top: 'eiche' }, natur: { front: '#d9cfbf', wood: null, handle: 'gold', top: 'keramik' }, holz: { wood: 'eiche', handle: 'schwarz', top: 'marmor' }, farbe: { front: '#7f8e77', wood: null, handle: 'gold', top: 'keramik' }, blau: { front: '#22304a', wood: null, handle: 'gold', top: 'keramik' } };
  function syncUI() {
    const s = P.style; renderTones();
    $$('[data-front]').forEach(b => b.classList.toggle('on', s.wood ? b.dataset.front === 'wood:' + s.wood : b.dataset.front === s.front));
    $$('[data-handle]').forEach(b => b.classList.toggle('on', b.dataset.handle === s.handle));
    $$('[data-kp-gripled]').forEach(b => { b.hidden = s.handle !== 'grifflos'; b.classList.toggle('on', !!s.gripLed); b.setAttribute('aria-pressed', !!s.gripLed); });
    $$('[data-kp-gripend]').forEach(b => { b.hidden = s.handle !== 'grifflos'; const on = s.gripEnd === 'leiste'; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $$('[data-top]').forEach(b => b.classList.toggle('on', b.dataset.top === s.top));
    $$('[data-finish]').forEach(b => b.classList.toggle('on', b.dataset.finish === (s.finish || 'matt')));
    $$('[data-fstyle]').forEach(b => b.classList.toggle('on', b.dataset.fstyle === String(s.frame ? 1 : 0)));
    $$('[data-look]').forEach(b => { const on = b.dataset.look === s.look; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const LK = LOOKS.find(x => x[0] === s.look);
    $$('[data-kp-lookinfo]').forEach(el => { el.innerHTML = LK ? `Ausgangsstil: <b>${LK[1]}</b> – hier alle Details anpassen. <button type="button" data-kgo="0">Stil ändern</button>` : `Tipp: In Schritt 1 einen fertigen Stil wählen – oder hier alles einzeln einstellen. <button type="button" data-kgo="0">Stile ansehen</button>`; });
    renderEq3();
    $$('[data-wallc]').forEach(b => b.classList.toggle('on', b.dataset.wallc === (s.wall || '#f3efe9')));
    $$('[data-floor]').forEach(b => b.classList.toggle('on', b.dataset.floor === (s.floor || 'eiche')));
    $$('.kp-bk').forEach(i => { i.style.setProperty('--tc', topCol()); i.style.setProperty('--fc', s.wood ? '#2a2420' : s.front); });
    $$('[data-form]').forEach(b => b.classList.toggle('on', b.dataset.form === P.form));
    { const d = $('[data-kp-cxmore]'); if (d) d.classList.toggle('has', !!(P.cx && P.cx.length)); }   // Anschlüsse eingetragen: Lauflicht aus
    $$('[data-kp-top]').forEach(b => { const on = anyTop(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    rw.value = P.room.w; rd.value = P.room.d; syncRoomOut();
    const n = Object.values(P.rows).reduce((a, r) => a + r.length, 0) + Object.keys(P.rows).reduce((a, w) => a + upList(w).length, 0) + (P.form === 'insel' ? 1 : 0);
    $$('[data-kp-count]').forEach(el => el.textContent = n + ' Elemente');
    try { syncAttach(); } catch (e) { }
  }

  /* ---------------- Senden ---------------- */
  function descr(m, cs, up) {
    const c = M[m.t], hng = hasHinge(m) ? `, Tür öffnet nach ${aOf(m, cs) === 'l' ? 'links' : 'rechts'}` : '';
    if (up) return m.t === 'dh' ? `Dunstabzug ${nm(HOODS, eqv('hood', 'schraeg'))} ${m.w} cm breit (ab ${Math.round(m.s)} cm)` : `${c.n} ${variant(m).replace(/ öffnet nach (links|rechts)/, '')} ${m.w} × ${hOf(m)} cm${hng} (ab ${Math.round(m.s)} cm)`;
    if (c.h === 't') return `${c.n} (${c.s}) ${m.w} × ${hOf(m)} cm${hng}${axOf(m) ? ` + Aufsatzschrank ${axOf(m)} cm (gesamt ${hOf(m) + axOf(m)} cm)` : ''}`;
    if (c.corner) return `${c.n} ${c.s} ${m.w} cm in der ${cs === 'r' ? 'rechten' : 'linken'} Ecke${hng}`;
    if (c.n === 'Unterschrank') return `Unterschrank ${variant(m).replace(/ öffnet nach (links|rechts)/, '')} ${m.w} cm${hng}`;
    return `${c.n} ${m.w} cm`;
  }
  function planData() {
    const W = P.room.w, D = P.room.d, ah = P.ah || 90;
    const opOf = o => ({ id: o.id, typ: o.t, name: OPN[o.t], wand: o.wall, abWand: o.s, breite: o.w, bruestung: opY(o), hoehe: opHH(o), art: (OPK[o.t].find(x => x[0] === opK(o)) || OPK[o.t][0])[1], artKey: opK(o), fluegel: opFl(o), anschlag: opA(o) === 'l' ? 'links' : 'rechts', oeffnet: opSlide(o) ? 'schiebt' : opK(o) === 'fest' ? 'fest' : opK(o) === 'kipp' ? 'kippt' : opDir(o) === 'out' ? 'nach außen' : 'nach innen', beschreibung: opDesc(o) });
    const waende = ['N', 'E', 'S', 'W'].map(w => {
      const L = wallLen(w), rowsW = P.rows[w], o = { wand: w, name: WN[w], laenge: L, kueche: !!rowsW, oeffnungen: P.op.filter(q => q.wall === w).map(opOf) };
      if (!rowsW) return o;
      const [a, b] = range(w), X = xs(w), LY = layout(w);
      o.nutzbarVon = a; o.nutzbarBis = b; o.frei = Math.round(free(w)); if (LY.fr > .5) o.freiAb = Math.round(LY.gx);
      { const TR = trims(w); o.passstuecke = TR.pf.map(q => ({ name: 'Passstück', abWand: Math.round(q.x), breite: Math.round(q.w), hoehe: q.tall ? q.h : ah, dekor: (P.style.pfDek || 'front') === 'top' ? 'Arbeitsplatte' : 'Frontfarbe' })); o.wangen = TR.wg.map(q => ({ name: gripEnd() ? 'Seitenabschluss in Frontfarbe mit umlaufender Griffleiste (oben und Mitte)' : 'Seitenwange', seite: q.side, abWand: Math.round(q.x), breite: 2.5, hoehe: ah, tiefe: 62, dekor: (P.style.wgDek || 'top') === 'top' ? 'Arbeitsplatte' : 'Frontfarbe' })); }
      o.unten = rowsW.map((m, i) => { const cs = cornerSide(w, i), c = M[m.t], tall = c.h === 't', r = { id: m.id, typ: m.t, name: c.n, variante: variant(m, cs), art: tall ? 'hoch' : 'unter', breite: m.w, hoehe: tall ? hOf(m) : ah, ...(tall && axOf(m) ? { aufsatz: axOf(m), gesamthoehe: hOf(m) + axOf(m) } : {}), tiefe: 60, abWand: X[i], ecke: cs || null, tuerAnschlag: hasHinge(m, cs) ? (aOf(m, cs) === 'l' ? 'links' : 'rechts') : null }; return r; });
      o.oben = [...upList(w)].sort((p, q) => p.s - q.s).map(u => u.t === 'dh' ? { id: u.id, typ: 'dh', name: 'Dunstabzug', variante: nm(HOODS, eqv('hood', 'schraeg')), art: 'haube', breite: u.w, hoehe: 108, tiefe: 50, abWand: Math.round(u.s), unterkante: 152 } : { id: u.id, typ: u.t, name: M[u.t].n, variante: variant(u), art: 'haenge', breite: u.w, hoehe: hOf(u), tiefe: 35, abWand: Math.round(u.s), unterkante: upY(u).bottom, oberkante: upY(u).bottom + hOf(u), tuerAnschlag: hasHinge(u) ? (aOf(u) === 'l' ? 'links' : 'rechts') : null, automatisch: !!u.auto });
      return o;
    });
    const LK = LOOKS.find(x => x[0] === P.style.look);
    return {
      einheit: 'cm', hinweis: 'abWand = Abstand von der linken Wandkante, Blick von innen auf die Wand. Wände: N = Rückwand, W = links, E = rechts, S = gegenüber.',
      form: P.form, formName: FORMS[P.form].n, raum: { breite: W, tiefe: D, hoehe: H },
      arbeitshoehe: ah, sockel: 10 + ah - 90, arbeitsplatte: 4, waende, oeffnungen: P.op.map(opOf),
      anschluesse: (P.cx || []).map(c => ({ typ: c.t, name: CXN[c.t], wand: c.wall, abWand: c.s, hoehe: Math.round(cxH(c)), bestand: !c.neu, neu: !!c.neu, ...(c.t === 'dose' ? { fach: cxN(c), lage: cxO(c) === 'v' ? 'senkrecht' : 'waagerecht', bereich: cxZone(c) } : {}), ...(c.t === 'abluft' ? { durchmesser: cxD(c), bereich: cxZone(c) } : {}), ...(c.t === 'heiz' ? { breite: hzW(c), koerperHoehe: hzH(c), bodenabstand: hzY(c) } : {}) })),
      insel: P.form === 'insel' ? (() => { const g = isl(); return { breite: g.w, tiefe: g.d, hoehe: 90, variante: P.island.v, mitteX: g.x, mitteZ: g.z, durchgang: g.g, kochseite: islSide().kv, raumseite: islKh(), tiefeKochseite: islDepth().cf, tiefeRaumseite: islDepth().cb, aufbau: islSideTxt(), schraenkeKochseite: islMods('v').map(m => ({ typ: m.t, name: M[m.t].v || M[m.t].n, breite: m.w })), schraenkeRaumseite: islMods('h').map(m => ({ typ: m.t, name: M[m.t].v || M[m.t].n, breite: m.w })) }; })() : null,
      stil: { ...P.style, ausgangsstil: LK ? LK[1] : null, front: frontName(P.style), farbwelt: (WORLDS.find(w => w.k === worldOf(P.style)) || { n: 'Wunschfarbe' }).n, frontHex: P.style.wood ? null : P.style.front, studioHinweisFront: herstHint(P.style) || null, griffe: (HANDLES.find(h => h[0] === P.style.handle) || ['', ''])[1], arbeitsplatteName: (TOPS.find(t => t[0] === P.style.top) || ['', ''])[1] },
      ausstattung: eqData(),
      zusammenfassung: summary(),
    };
  }
  // Kennzahlen eines Entwurfs (Varianten-Vergleich, KI-Ideen) – Längen in cm, Stauraum in Litern (nutzbarer Anteil je Schrankart geschätzt)
  const STOR = { us: 1, ut: 1, u1: 1, u2: 1, s2: 1, s4: 1, ui: 1, ur: .7, fa: 1, ap: 1, mt: .55, sp: .35, kf: .85, ko: .12, gs: 0, ek: .75, el: .85, eb: .6, bo: .62, bm: .5, kue: 0, vo: 1, ah: 1, bs: .75, vg: .9, h1: 1, h2: 1, hk: 1, hs: 1, hf: 1, hg: .9, ho: .6, he: .9, dh: 0 };
  function metrics() {
    const W = P.room.w, D = P.room.d, ah = P.ah || 90, pt = (w, a, d) => ({ N: [a, d], S: [W - a, D - d], W: [d, D - a], E: [W - d, a] })[w];
    let top = 0, free = 0, best = 0, vol = 0, upLen = 0, tallW = 0, nCab = 0; const at = {}, cnt = {};
    for (const w in P.rows) {
      const LY = layout(w); let end = null, run = 0;
      P.rows[w].forEach(m => {
        const c = M[m.t], x = LY.X.get(m), tall = c.h === 't'; nCab++; cnt[m.t] = (cnt[m.t] || 0) + 1;
        if (end != null && Math.abs(x - end) > 1) run = 0;
        if (tall) { run = 0; tallW += m.w; vol += m.w * (hOf(m) - 10) * 56 / 1000 * (STOR[m.t] ?? 1); if (axOf(m)) vol += m.w * axOf(m) * 56 / 1000; }
        else { top += m.w; vol += m.w * (ah - 14) * 56 / 1000 * (STOR[m.t] ?? 1); if (m.t === 'sp' || m.t === 'kf' || m.t === 'ko') run = 0; else { free += m.w; run += m.w; best = Math.max(best, run); } }
        end = x + m.w;
        const k = m.t === 'ko' ? 'kf' : m.t; if (['sp', 'kf', 'kue'].includes(k) && !at[k]) at[k] = pt(w, x + m.w / 2, 90);
      });
    }
    for (const w in P.rows) upList(w).forEach(u => { if (u.t === 'dh') return; nCab++; upLen += u.w; vol += u.w * hOf(u) * 32 / 1000 * (STOR[u.t] ?? 1); });
    if (P.form === 'insel') { const I = P.island, z = isl().z, occ = I.v === 'frei' ? 0 : 80; top += I.w; free += I.w - occ; best = Math.max(best, I.w - occ); vol += I.w * (ah - 14) * 60 / 1000 * .8; nCab++; { const q = islSide(), bd = (I.d || 100) - 60; if (q.kh === 'schub' || q.kh === 'tuer' || q.kh === 'mix') { vol += I.w * (ah - 14) * bd / 1000 * .8; nCab++; } if (q.kh === 'regal') vol += I.w * (ah - 14) * bd / 1000 * .4; if (q.kh === 'wand') vol += I.w * (ah - 14) * Math.max(0, bd - 3) / 1000 * .8; }
      if (I.v === 'spuele' && !at.sp) at.sp = [W / 2, z]; if (I.v === 'kochfeld' && !at.kf) at.kf = [W / 2, z]; }
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), tri = at.sp && at.kf && at.kue ? Math.round(d(at.sp, at.kf) + d(at.kf, at.kue) + d(at.kue, at.sp)) : null;
    const dev = [], isl = P.form === 'insel' ? P.island.v : null;
    if (cnt.sp || isl === 'spuele') dev.push(isl === 'spuele' ? 'Spüle in der Insel' : 'Spüle');
    if (cnt.kf || isl === 'kochfeld') dev.push(`Kochfeld ${eqv('hobW', 80)} cm${isDD() ? ' mit Muldenlüfter' : ''}${isl === 'kochfeld' ? ' (Insel)' : ''}`);
    if (cnt.ko) dev.push('Herd mit Backofen');
    if (cnt.gs) dev.push('Spülmaschine'); if (cnt.bo) dev.push('Backofen auf Augenhöhe'); if (cnt.bm) dev.push('Backofen + Mikrowelle hoch');
    if (cnt.kue) dev.push(cnt.kue > 1 ? `${cnt.kue} Kühlgeräte` : 'Kühlschrank'); if (cnt.mt) dev.push('Mülltrenner');
    if (cnt.ah || cnt.ap) dev.push('Apothekerschrank'); if (cnt.bs) dev.push('Besenschrank'); if (cnt.vg) dev.push('Vitrine');
    if (isl === 'frei') dev.push('Insel als freie Fläche');
    return { form: P.form, formName: FORMS[P.form].n, raum: [W, D], top, free, best, vol: Math.round(vol / 10) * 10, upLen, tallW, nCab, tri, ah, warn: tips().filter(x => x[0] === 'warn').length,
      front: frontShort(P.style), frontHex: P.style.wood ? WOOD[P.style.wood] : P.style.front, griffe: (HANDLES.find(h => h[0] === P.style.handle) || ['', ''])[1], platte: (TOPS.find(t => t[0] === P.style.top) || ['', ''])[1], platteHex: (TOPS.find(t => t[0] === P.style.top) || ['', '', '#b98a5c'])[2], geraete: dev };
  }
  function backName(att) {
    const b = P.style.back || 'wand', cn = (BACKC.find(c => c[1] === (P.style.backC || '')) || ['eigene Farbe'])[0];
    const mt = !motif ? 'Glas bedruckt mit eigenem Motiv (Foto noch nicht gewählt)' : att ? 'Glas bedruckt mit eigenem Motiv (Motiv-Foto hängt an: „Rueckwand-Motiv“)' : 'Glas bedruckt mit eigenem Motiv (Foto bitte separat mitschicken)';
    const t = { wand: 'keine (Wandfarbe)', glas: `Glas ${cn} glänzend`, dibond: `Dibond ${cn} matt`, holz: `Holz ${nm(BACKW, P.style.backWood || 'eiche')}`, fliese: 'Metro-Fliesen', platte: 'Stein wie Arbeitsplatte', motiv: mt }[b] || b;
    return t + (P.style.backLed ? ', mit LED beleuchtet' : '');
  }
  function eqData() {
    const all = Object.values(P.rows).flat(), sp = all.some(m => m.t === 'sp') || (P.form === 'insel' && P.island.v === 'spuele'), wh = all.some(m => m.t === 'kf' || m.t === 'ko'), ih = P.form === 'insel' && P.island.v === 'kochfeld';
    return { spuele: sp ? nm(SINKS, eqv('sink', 'edel')) : null, armatur: sp ? nm(TAPS, eqv('tap', 'chrom')) : null, kochfeldBreite: wh || ih ? eqv('hobW', 80) : null, kochfeldArt: wh ? (isDD() ? 'mit Muldenlüfter' : 'normal') : null, dunstabzug: wh ? (isDD() ? 'Muldenlüfter im Kochfeld' : nm(HOODS, eqv('hood', 'schraeg'))) : null, inselAbzug: ih ? nm(IHOODS, eqv('ihood', 'mulde')) : null, rueckwand: backName(), rueckwandTyp: P.style.back || 'wand', rueckwandBeleuchtet: !!P.style.backLed, eigenesMotiv: (P.style.back === 'motiv') };
  }
  function summary(motAtt) {
    const s = P.style, fr = [frontName(s)];
    const L = [`Form: ${FORMS[P.form].n} · Raum ${P.room.w} × ${P.room.d} cm`];
    for (const w in P.rows) {
      { const TR = trims(w); L.push(`${WN[w]} unten: ` + ([...P.rows[w].map((m, i) => descr(m, cornerSide(w, i))), ...TR.pf.map(q => `Passstück ${Math.round(q.w)} cm ${q.where}${q.tall ? ' (hoch)' : ''}`), ...TR.wg.map(q => gripEnd() ? `Seitenabschluss ${q.side} mit Griffleiste ums Eck` : `Seitenwange ${q.side} (${(P.style.wgDek || 'top') === 'top' ? 'Arbeitsplattendekor' : 'Frontfarbe'})`)].join(' · ') || '–')); }
      const ups = upList(w); L.push(`${WN[w]} oben${P.up[w] ? '' : ' (automatisch)'}: ` + (ups.length ? [...ups].sort((a, b) => a.s - b.s).map(u => descr(u, null, true)).join(' · ') : 'keine Hängeschränke'));
    }
    if (P.form === 'insel') L.push(`Insel: ${isl().w} × ${isl().d} cm, ${isl().g} cm Durchgang zur Zeile, ${({ kochfeld: 'mit Kochfeld', spuele: 'mit Spüle', frei: 'freie Arbeitsfläche' })[P.island.v]}; ${islSideTxt()}`);
    L.push(`Arbeitshöhe: ${P.ah || 90} cm`);
    if (P.op.length) L.push('Fenster & Türen: ' + P.op.map(o => `${OPN[o.t]} ${o.w} cm (${WN[o.wall]}, ab ${o.s} cm; ${opDesc(o)})`).join(' · '));
    const cxL = c => `${CXN[c.t]}${cxSpec(c) ? ' ' + cxSpec(c) : ''} (${WN[c.wall]}, Mitte ${c.s} cm von links${c.t === 'heiz' ? '' : `, ${Math.round(cxH(c))} cm hoch`})`;
    { const ex = (P.cx || []).filter(c => !c.neu), nw = (P.cx || []).filter(c => c.neu); if (ex.length) L.push('Anschlüsse im Raum (Bestand): ' + ex.map(cxL).join(' · ')); if (nw.length) L.push('Anschlüsse neu geplant: ' + nw.map(cxL).join(' · ')); }
    L.push(`Fronten: ${fr[0]}${WORLDS.some(w => w.k === worldOf(s)) ? ` (Farbwelt „${WORLDS.find(w => w.k === worldOf(s)).n}“)` : ''} · Griffe: ${HANDLES.find(h => h[0] === s.handle)[1]}${s.handle === 'grifflos' && s.gripLed ? ' mit beleuchteter Griffleiste' : ''}${s.handle === 'grifflos' && s.gripEnd === 'leiste' ? ', Griffleisten seitlich ums Eck statt Wange' : ''} · Arbeitsplatte: ${TOPS.find(t => t[0] === s.top)[1]} · Hängeschränke: ${Object.keys(P.up).length ? 'individuell geplant' : anyTop() ? 'automatisch' : 'keine'}`);
    { const hh = herstHint(s); if (hh) L.push('Studio-Hinweis Frontfarbe (Richtwerte, bitte am Originalmuster prüfen): ' + hh); }
    const LK = LOOKS.find(x => x[0] === s.look); if (LK) L.push(`Ausgangsstil: ${LK[1]}`);
    { const q = eqData(), A = []; if (q.spuele) A.push(`Spüle ${q.spuele}`, `Armatur ${q.armatur}`); if (q.kochfeldBreite) A.push(`Kochfeld ${q.kochfeldBreite} cm${q.kochfeldArt === 'mit Muldenlüfter' ? ' mit Muldenlüfter' : ''}`); if (q.dunstabzug && q.kochfeldArt !== 'mit Muldenlüfter') A.push(`Dunstabzug: ${q.dunstabzug}`); if (q.inselAbzug) A.push(`Abzug an der Insel: ${q.inselAbzug}`); if (A.length) L.push('Ausstattung: ' + A.join(' · ')); }
    L.push(`Frontart: ${s.frame ? 'Rahmenfront (Landhaus)' : 'glatt'} · Oberfläche: ${(FINISHES.find(f => f[0] === (s.finish || 'matt')) || FINISHES[0])[1]} · Küchenrückwand: ${backName(motAtt)} · Wand: ${(WALLC.find(c => c[1] === s.wall) || ['eigene Farbe'])[0]} · Boden: ${(FLOORS.find(f => f[0] === s.floor) || FLOORS[0])[1]}`);
    if (attach) L.push('Raumfoto: eigenes Foto mit eingesetzter Küche angehängt (Vorher und Nachher).');
    const w = tips().filter(x => x[0] === 'warn').map(x => x[1]); if (w.length) L.push('Hinweise: ' + w.join('; '));
    return L.join('\n');
  }
  function elevImg(w) { return new Promise(res => { const L = wallLen(w); const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 ${VB0} ${L + 8} ${H - VB0 + 22}" width="${(L + 8) * 2}" height="${(H - VB0 + 22) * 2}">${DEFS}${drawWall(w, {})}</svg>`; const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); }
  async function composite() {
    const c = document.createElement('canvas'); c.width = 1800; c.height = 1100; const g = c.getContext('2d');
    g.fillStyle = '#f7f3ec'; g.fillRect(0, 0, 1800, 1100);
    if (K) { const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = K.snapshot(); }); const s = Math.max(640 / im.height, 1800 / im.width); g.save(); g.beginPath(); g.rect(0, 0, 1800, 640); g.clip(); g.drawImage(im, (1800 - im.width * s) / 2, (640 - im.height * s) / 2, im.width * s, im.height * s); g.restore(); }
    const ws = Object.keys(P.rows); const imgs = await Promise.all(ws.map(elevImg)); let x = 40; const tot = ws.reduce((a, w) => a + wallLen(w) + 8, 0), sc = Math.min(1.25, (1720 - 30 * (ws.length - 1)) / tot);
    imgs.forEach((im, i) => { if (!im) return; const w = (wallLen(ws[i]) + 8) * sc, h = (H - VB0 + 22) * sc; g.drawImage(im, x, 1070 - h, w, h); x += w + 30; });
    g.fillStyle = 'rgba(20,18,16,.72)'; g.fillRect(0, 0, 1800, 84); g.fillStyle = '#fff'; g.font = '600 34px Georgia, serif'; g.fillText('Mein Küchenentwurf', 40, 54); g.font = '19px system-ui, sans-serif'; if (LOGO && LOGO.naturalWidth) { const lh = 70, lw = lh * LOGO.naturalWidth / LOGO.naturalHeight; g.drawImage(LOGO, 1800 - lw - 30, 7, lw, lh); } else g.fillText(STUDIO, 420, 54);
    return c;
  }
  $$('[data-ksend]').forEach(b => b.addEventListener('click', async () => {
    const k = b.dataset.ksend, name = ($('[name="Name"]') || {}).value || '';
    const link = location.href.split('#')[0] + lastHash;
    const text = `${GREET},\n\nich habe meine Küche online geplant:\n\n${summary()}\n\nEntwurf ansehen: ${link}${name ? '\n\n' + name : ''}`;
    if (k === 'wa') window.open(WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    if (k === 'img') { const c = await composite(); const a = document.createElement('a'); a.download = 'mein-kuechenentwurf.jpg'; a.href = c.toDataURL('image/jpeg', .9); a.click(); }
    if (k === 'link') { try { await navigator.clipboard.writeText(link); b.textContent = 'Link kopiert ✓'; } catch (e) { prompt('Link zum Entwurf:', link); } }
  }));
  // Raumfoto als Anhang (kommt aus der Foto-Projektion)
  let attach = null; // {files: [File, File], thumb: dataURL}
  function syncAttach() {
    const mot = motifToSend(); $$('[data-kp-motatt]').forEach(el => { el.hidden = !mot; }); $$('[data-kp-motimg]').forEach(im => { if (mot && im.getAttribute('src') !== mot._url) im.src = mot._url; });
    $$('[data-kpf-att]').forEach(el => { el.hidden = !attach; }); $$('[data-kpf-thumb]').forEach(im => { if (attach) im.src = attach.thumb; });
    $$('[data-kpf-cta]').forEach(el => { el.textContent = attach ? 'Raumfoto ändern' : 'Raumfoto hochladen'; });
  }
  $$('[data-kpf-drop]').forEach(b => b.addEventListener('click', () => { attach = null; syncAttach(); toast('Raumfoto wird nicht mitgeschickt.'); }));
  $$('[data-kp-motdrop]').forEach(b => b.addEventListener('click', () => { motSend = false; syncAttach(); toast('Das Motiv-Foto wird nicht mitgeschickt – im Entwurf steht trotzdem „eigenes Motiv“.'); }));
  const form = $('[data-kp-form]');
  if (form) {
    const b0 = $('[type="submit"]', form);
    form.addEventListener('submit', async e => {
      try { LV.ok(30000); } catch (er) { }
      const fi = $('[data-files]', form), files = fi ? fi.files : []; let total = 0; for (const f of files) total += f.size; if (attach) attach.files.forEach(f => total += f.size);
      const mot = motifToSend(); if (mot) total += Math.round((mot._url || '').length * .75);
      if (total > 9.5e6) { e.preventDefault(); $('[data-form-msg]', form).textContent = 'Die Dateien sind zusammen größer als 10 MB' + (attach ? ' – entfernen Sie ein Foto oder das Raumfoto.' : mot ? ' – entfernen Sie ein Foto oder schicken Sie das Rückwand-Motiv nicht mit.' : '.'); return; }
      $('[name="Entwurf"]', form).value = summary() + '\n\nLink: ' + location.href.split('#')[0] + lastHash;
      $('[name="_next"]', form).value = location.href.split('#')[0].split('?')[0] + '?gesendet=1'; try { sessionStorage.setItem('kp-last', lastHash); } catch (er) { }
      if (window.DataTransfer) {
        e.preventDefault(); b0.disabled = true; b0.textContent = 'Wird gesendet …';
        try { const c = await composite(); const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .85)); const dt = new DataTransfer(); dt.items.add(new File([blob], 'kuechenentwurf.jpg', { type: 'image/jpeg' })); $('[name="Entwurf-Bild"]', form).files = dt.files; } catch (err) { }
        if (attach) [['Raumfoto', 0], ['Raumfoto-mit-Kueche', 1]].forEach(([n, i]) => { const inp = $(`[name="${n}"]`, form); if (!inp || !attach.files[i]) return; try { const dt = new DataTransfer(); dt.items.add(attach.files[i]); inp.files = dt.files; } catch (err) { } });
        // Eigenes Rückwand-Motiv (bereits auf max. 1600 px verkleinert) als JPEG anhängen
        if (mot) { let ok = false; try { let inp = $('[name="Rueckwand-Motiv"]', form); if (!inp) { inp = Object.assign(document.createElement('input'), { type: 'file', name: 'Rueckwand-Motiv', className: 'hp', tabIndex: -1 }); inp.setAttribute('aria-hidden', 'true'); form.appendChild(inp); }
          let blob = await new Promise(r => { try { mot.toBlob(r, 'image/jpeg', .86); } catch (err) { r(null); } }); if (!blob && mot._url) blob = await (await fetch(mot._url)).blob();
          if (blob) { const dt = new DataTransfer(); dt.items.add(new File([blob], 'rueckwand-motiv.jpg', { type: 'image/jpeg' })); inp.files = dt.files; ok = inp.files.length > 0; } } catch (err) { ok = false; }
          if (ok) $('[name="Entwurf"]', form).value = summary(true) + '\n\nLink: ' + location.href.split('#')[0] + lastHash; }
        HTMLFormElement.prototype.submit.call(form);
      }
    });
    const fi = $('[data-files]', form); if (fi) fi.addEventListener('change', e => { $('[data-filelist]', form).innerHTML = [...e.target.files].map(f => `<li>${f.name} <em>${(f.size / 1e6).toFixed(1).replace('.', ',')} MB</em></li>`).join(''); });
  }

  /* ---------------- Ihre Küche in Ihrem Raum (Foto-Projektion, wird bei Bedarf geladen) ---------------- */
  let pf = null;
  function loadFoto() { return pf || (pf = Promise.all([loadEngine(), new Promise((res, rej) => { if (window.KPF) return res(); const s = document.createElement('script'); s.src = 'assets/kp-foto.js?v=' + VER; s.onload = res; s.onerror = rej; document.head.appendChild(s); })])); }
  // Live im Raum (AR): wird erst beim Antippen geladen
  let par = null;
  function openAR() { (par || (par = new Promise((res, rej) => { if (window.KPAR) return res(); const s = document.createElement('script'); s.src = 'assets/kp-ar.js?v=' + VER; s.onload = res; s.onerror = () => { par = null; rej(); }; document.head.appendChild(s); }))).then(() => window.KPAR.open()).catch(() => toast('Die Live-Ansicht konnte nicht geladen werden – bitte Seite neu laden.')); }
  // Erst planen, dann in den Raum stellen (Natan 05.11.: „sonst macht es keinen Sinn“) – mit der Beispielküche geht es trotzdem
  const planned = () => gDirty || root.dataset.hash0 === '1';
  const go1 = i => { go(i); const st = $('.kp-steps'); if (st && st.scrollIntoView && innerWidth < 1000) root.scrollIntoView({ behavior: RMO ? 'auto' : 'smooth', block: 'start' }); };
  const firstPlan = go => { if (planned()) return go(); ask('Planen Sie zuerst Ihre Küche – dann stellen wir genau diese in Ihren Raum. Sonst sehen Sie nur unsere Beispielküche.', 'Beispiel ansehen', go, 'Erst planen', () => { go1(1); }); };
  document.addEventListener('click', e => { const b = e.target.closest('[data-kpar-open]'); if (!b) return; e.preventDefault(); firstPlan(openAR); });
  if (/[?&]ar=1/.test(location.search)) setTimeout(openAR, 1200);
  function openFoto(o) { loadFoto().then(() => window.KPF && window.KPF.open(o || {})).catch(() => { pf = null; toast('Die Foto-Ansicht konnte nicht geladen werden – bitte Seite neu laden.'); }); }
  window.KP = {
    state3d: () => toState(), room: () => ({ ...P.room }),
    stateOf: j => { const keep = P, ks = sel, ko = selOp; try { des(typeof j === 'string' ? j : JSON.stringify(j)); return { state: toState(), room: { ...P.room } }; } finally { P = keep; sel = ks; selOp = ko; } }, form: () => P.form,
    // Live-Tipps (Warnungen) für einen Plan im Hash-Format – ohne den aktuellen Entwurf zu verändern
    tipsOf: j => { const keep = P, ks = sel, ko = selOp; try { des(typeof j === 'string' ? j : JSON.stringify(j)); return tips().filter(x => x[0] === 'warn').map(x => x[1]); } finally { P = keep; sel = ks; selOp = ko; } }, walls: () => FORMS[P.form].walls.slice(), wn: WN, person: PERSON, studio: STUDIO, acc: ACC, logo: LOGO, summary: () => summary(),
    pause3d: b => { if (K) K.pause(b); }, toast: (m) => toast(m), k3d: () => K,
    // Hochwertiges Standbild der aktuellen 3D-Ansicht → Promise<Canvas>
    renderHQ: (w = 1600, h = 1000) => load3D().then(() => { if (!K || !K.renderHQ) throw new Error('3D-Ansicht nicht verfügbar'); return K.renderHQ(w, h); }),
    // Maße der geplanten Küche (alles in cm) – für Maßstabsplan / Ergebnis-Ansicht
    planData: () => planData(),
    // Vorschaubild eines Plans (Hash-Format) aus der Standard-Übersicht – null, solange die 3D-Ansicht nicht geladen ist
    shot: (j, w = 480, h = 300) => { if (!K || !K.shot) return null; const r = window.KP.stateOf(j); return r && r.state ? K.shot(r.state, w, h) : null; },
    metrics: () => metrics(), metricsOf: j => { const keep = P, ks = sel, ko = selOp, kc = selCx; try { des(typeof j === 'string' ? j : JSON.stringify(j)); return metrics(); } finally { P = keep; sel = ks; selOp = ko; selCx = kc; } },
    frontName: st => frontName(st || P.style), frontShort: st => frontShort(st || P.style), toneName: h => isHex(h) ? toneName(h) : '',
    setAttach: a => { attach = a; syncAttach(); }, getAttach: () => attach,
    toSend: () => { go(3); setTimeout(() => { const c = $('[data-kpf-card]'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120); },
    // Fertigen Plan (Hash-Format) übernehmen – ohne Neuladen, mit Rückgängig; bei Fehler bleibt der alte Entwurf
    applyPlan: j => { const keep = P; try { des(typeof j === 'string' ? j : JSON.stringify(j)); if (!P || !P.room || !FORMS[P.form]) throw new Error('Plan ungültig'); } catch (e) { P = keep; throw e; } if (!P.cx.length && keep && keep.cx && keep.cx.length) { P.cx = keep.cx.map(c => ({ ...c })); P.cx.forEach(c => { c.s = clampCx(c, c.s); }); const wq = P.cx.find(c => c.t === 'wasser'); if (wq) try { moveApp(['sp'], wq); } catch (e) { } } sel = null; selOp = null; selCx = null; eqSel = null; disarm(); pop.hidden = true; openNow.clear(); xfade(); change(); renderPal(); if (K && K.view) { K.view('perspektive'); $$('[data-cam]').forEach(x => x.classList.toggle('on', x.dataset.cam === 'perspektive')); } return lastHash; },
    hash: () => lastHash,
    // KI-Planung „Entwurf ändern“: gezielte Änderungen am laufenden Entwurf – jede mit Rückgängig (Verlauf)
    edit: {
      walls: () => FORMS[P.form].walls.slice(), form: () => P.form, len: w => wallLen(w), ah: () => P.ah || 90,
      ops: () => P.op.map(o => ({ id: o.id, t: o.t, wall: o.wall, s: o.s, w: o.w, fl: opFl(o), a: opA(o), k: opK(o), dir: opDir(o), y0: opY(o), hh: opHH(o) })),
      cxs: () => (P.cx || []).map(c => ({ id: c.id, t: c.t, wall: c.wall, s: c.s, h: Math.round(cxH(c)), ...(cxExtra(c) || {}) })),
      sink: () => { for (const w in P.rows) { const i = P.rows[w].findIndex(m => m.t === 'sp'); if (i >= 0) { const L = locate(w, i); return { wall: w, s: L.x0 + L.w / 2, w: L.w }; } } return null; },
      room: (w, d) => { w = Math.round(Math.max(240, Math.min(800, w)) / 10) * 10; d = Math.round(Math.max(240, Math.min(700, d)) / 10) * 10; rw.value = w; rd.value = d; roomIn(); change(); return { w: P.room.w, d: P.room.d }; },
      setAh: v => { v = Math.max(84, Math.min(106, Math.round(v))); P.ah = v; syncRoomOut(); change(); return v; },
      op: (id, ch) => {
        const o = opById(id); if (!o) return null;
        if (ch.del) { P.op = P.op.filter(x => x !== o); selOp = null; selCx = null; change(); return { del: true }; }
        if (ch.wall && WN[ch.wall]) o.wall = ch.wall;
        if (ch.w) { const ws = OPW[o.t]; o.w = ws.reduce((b, x) => Math.abs(x - ch.w) < Math.abs(b - ch.w) ? x : b, ws[0]); if (o.w > wallLen(o.wall) - 20) o.w = ws.filter(v => v <= wallLen(o.wall) - 20).pop() || o.w; }
        { const q = opFrom(o.t, o.wall, o.s, o.w, ch); ['fl', 'a', 'k', 'dir', 'y0', 'hh'].forEach(k => { if (q[k] != null) o[k] = q[k]; }); }
        o.s = clampOp(o, ch.s != null ? ch.s : o.s); change(); return { wall: o.wall, s: o.s, w: o.w };
      },
      cook: () => { for (const w in P.rows) { const i = P.rows[w].findIndex(m => m.t === 'kf' || m.t === 'ko'); if (i >= 0) { const L = locate(w, i); return { wall: w, s: L.x0 + L.w / 2, w: L.w }; } } return null; },
      addOp: (t, wall, s, w) => { if (!OPW[t] || !WN[wall]) return null; const ws = OPW[t], tw = w || (t === 'tuer' ? 90 : t === 'balkon' ? 120 : 120), ow = ws.reduce((b, x) => Math.abs(x - tw) < Math.abs(b - tw) ? x : b, ws[0]); const o = { id: uid++, t, wall, w: Math.min(ow, wallLen(wall) - 30), s: 0 }; o.s = clampOp(o, s != null ? s - o.w / 2 : (wallLen(wall) - o.w) / 2); P.op.push(o); change(); return { wall: o.wall, s: o.s, w: o.w }; },
      cx: (t, wall, s, quiet, extra) => {
        if (!CXN[t] || !WN[wall]) return null; P.cx = P.cx || [];
        let c = t === 'dose' || t === 'heiz' ? null : P.cx.find(x => x.t === t); if (!c) { c = { id: uid++, t, wall, s: 0 }; P.cx.push(c); }
        if (extra && typeof extra === 'object') { const q = cxFrom(t, wall, 0, extra); ['h', 'z', 'n', 'o', 'd', 'hw', 'hh', 'y0', 'neu'].forEach(k => { if (q[k] != null) c[k] = q[k]; }); }
        c.wall = wall; c.s = clampCx(c, s != null ? s : wallLen(wall) / 2); change();
        let r = null; if (t === 'wasser' || t === 'herd' || (t === 'abluft' && cxH(c) > 40 && !isDD())) { r = moveApp(t === 'wasser' ? ['sp'] : ['kf', 'ko'], c); if (r.ok && !r.same) change(); }
        return { wall: c.wall, s: c.s, moved: !!(r && r.ok && !r.same), msg: r && !r.ok ? r.msg : '' };
      },
      sinkTo: (wall, s) => { const r = moveApp(['sp'], { wall, s }); if (r.ok && !r.same) change(); return r; },
      cookTo: (wall, s) => { const r = moveApp(['kf', 'ko'], { wall, s }); if (r.ok && !r.same) change(); return r; },
    },
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-kpf-open]'); if (!b) return; e.preventDefault(); const sm = b.hasAttribute('data-kpf-sample'); sm ? openFoto({ sample: true }) : firstPlan(() => openFoto({})); });

  /* ---------------- Nicht aus Versehen rausfliegen ---------------- */
  // Sobald jemand selbst geplant hat: Rückfrage beim Zurückwischen, bei Links weg vom Planer und beim Schließen des Tabs.
  // Außerdem bleibt die letzte Planung auf diesem Gerät – beim nächsten Öffnen ohne Link: „Weiterplanen“.
  const AS_KEY = 'kp-auto:' + location.pathname.replace(/[^/]*$/, ''), SENT = /[?&]gesendet=1/.test(location.search), HASH0 = /^#k=/.test(location.hash); if (HASH0) root.dataset.hash0 = '1';
  let gActed = false, gDirty = false, gArmed = false, gLeaveOk = false, gLvEl = null, gLvT = 0;
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, e => { if (e.isTrusted) gActed = true; }, { capture: true, passive: true }));
  const LV = window.KPLeave = { ok(ms) { gLeaveOk = true; clearTimeout(gLvT); gLvT = setTimeout(() => { gLeaveOk = false; }, ms || 4000); }, dirty: () => gDirty, show: () => showLeave(() => { }) };
  const saveAuto = () => { if (!/^#k=/.test(lastHash)) return; try { localStorage.setItem(AS_KEY, JSON.stringify({ h: lastHash, t: Date.now() })); } catch (e) { } };
  function guardChanged() {
    if (!gActed) { if (HASH0) saveAuto(); return; }   // Laden zählt nicht – ein geöffneter Entwurfs-Link wird aber gemerkt
    gDirty = true; saveAuto();
    if (!gArmed) { gArmed = true; try { history.pushState({ kpg: 1 }, '', lastHash); } catch (e) { } }
  }
  const home = () => { const a = document.querySelector('a.brand[href], .brand a[href], header a[href$="index.html"], header a[href="./"]'); return a ? a.href : new URL('./', location.href).href; };
  function hideLeave() { if (!gLvEl || gLvEl.hidden) return; gLvEl.classList.remove('on'); setTimeout(() => { gLvEl.hidden = true; document.documentElement.classList.remove('kp-lv-on'); }, 260); }
  function showLeave(go) {
    if (!gLvEl) {
      gLvEl = document.createElement('div'); gLvEl.className = 'kp-leave'; gLvEl.hidden = true; gLvEl.setAttribute('role', 'dialog'); gLvEl.setAttribute('aria-modal', 'true'); gLvEl.setAttribute('aria-labelledby', 'kpLvT');
      gLvEl.innerHTML = `<div class="kp-lv-card"><svg class="kp-lv-door" viewBox="0 0 120 120" aria-hidden="true"><rect x="30" y="16" width="60" height="92" rx="3" class="kp-lv-frame"/><path d="M30 108 L30 16 L72 26 L72 112 Z" class="kp-lv-leaf"/><circle cx="64" cy="66" r="3" class="kp-lv-knob"/><path d="M14 108 H106" class="kp-lv-floor"/><g class="kp-lv-steps"><path d="M95 98 l6 -3 l1 5 z"/><path d="M104 90 l6 -3 l1 5 z"/></g></svg>
        <h3 id="kpLvT">Sie verlassen gerade den Planer</h3>
        <p>Ihre Küche ist noch nicht abgeschickt. Keine Sorge: Wir merken uns die Planung auf diesem Gerät – beim nächsten Öffnen können Sie direkt weitermachen.</p>
        <div class="kp-lv-b"><button type="button" class="kp-lv-stay" data-lv="stay">Weiter planen</button><button type="button" class="kp-lv-send" data-lv="send">Entwurf erst absenden</button><button type="button" class="kp-lv-go" data-lv="go">Planer verlassen</button></div></div>`;
      document.body.appendChild(gLvEl);
      gLvEl.addEventListener('click', e => {
        const b = e.target.closest('[data-lv]'); if (!b && e.target !== gLvEl) return; const k = b ? b.dataset.lv : 'stay';
        hideLeave(); if (k === 'go') { saveAuto(); LV.ok(); const f = gLvEl._go; setTimeout(() => f && f(), 120); }
        else if (k === 'send') { go(3); const t = $('[data-kpane].on') || root; setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
      });
      gLvEl.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); hideLeave(); } });
    }
    gLvEl._go = go; gLvEl.hidden = false; document.documentElement.classList.add('kp-lv-on'); void gLvEl.offsetWidth; gLvEl.classList.add('on');
    setTimeout(() => { const b = $('.kp-lv-stay', gLvEl); b && b.focus({ preventScroll: true }); }, 60);
  }
  // Zurück-Geste / Zurück-Taste: offene Ansichten zuerst schließen, sonst nachfragen
  addEventListener('popstate', () => {
    if (!gArmed || gLeaveOk) return;
    try { history.pushState({ kpg: 1 }, '', lastHash); } catch (e) { }
    const H = document.documentElement;
    if (gLvEl && !gLvEl.hidden) { hideLeave(); return; }
    if (H.classList.contains('kpr-on') && window.KPResult) { window.KPResult.close(); return; }
    if (H.classList.contains('kpf-on') && window.KPF && window.KPF.close) { window.KPF.close(); return; }
    showLeave(() => { if (history.length > 2) history.go(-2); else location.href = home(); });
  });
  // Links, die vom Planer wegführen
  addEventListener('click', e => {
    if (!gDirty || gLeaveOk || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || ''; if (!href || href[0] === '#' || /^javascript:/i.test(href)) return;
    if (/^(mailto|tel|sms|whatsapp):/i.test(href)) { LV.ok(); return; }
    let u; try { u = new URL(a.href, location.href); } catch (er) { return; }
    if (u.origin === location.origin && u.pathname === location.pathname && u.search === location.search) return;
    e.preventDefault(); e.stopImmediatePropagation(); showLeave(() => { location.href = a.href; });
  }, true);
  // Tab schließen / Neu laden: Browser-eigene Rückfrage (Text legt der Browser fest)
  addEventListener('beforeunload', e => { if (!gDirty || gLeaveOk) return; saveAuto(); e.preventDefault(); e.returnValue = ''; return ''; });
  addEventListener('pageshow', e => { if (e.persisted) { gLeaveOk = false; hideLeave(); } });
  // Beim Öffnen ohne Link: letzte Planung auf diesem Gerät anbieten
  function offerResume() {
    if (HASH0 || SENT) return; let d = null; try { d = JSON.parse(localStorage.getItem(AS_KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !/^#k=/.test(d.h || '') || d.h === lastHash || Date.now() - (d.t || 0) > 90 * 864e5) return;
    const when = new Date(d.t), today = new Date().toDateString() === when.toDateString();
    const wt = (today ? 'heute' : 'vom ' + when.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'numeric' })) + ', ' + when.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    const el = document.createElement('div'); el.className = 'kp-resume'; el.setAttribute('role', 'status');
    el.innerHTML = `<i class="kp-rs-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></i><span><b>Weiterplanen?</b>Ihre letzte Küche (${wt}) ist noch auf diesem Gerät.</span><span class="kp-rs-b"><button type="button" data-rs="1">Weiterplanen</button><button type="button" data-rs="0">Neu anfangen</button></span>`;
    document.body.appendChild(el);
    const busy = () => { const it = document.querySelector('.intro'); if (!it || it.classList.contains('gone') || it.hidden) return false; const cs = getComputedStyle(it); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .05; };
    let n = 0; const wait = () => { if (busy() && n++ < 40) return setTimeout(wait, 400); setTimeout(() => el.classList.add('on'), 700); }; wait();
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-rs]'); if (!b) return; el.classList.remove('on'); setTimeout(() => el.remove(), 400);
      if (b.dataset.rs === '1') { history.replaceState(null, '', d.h); if (fromHash()) { renderPal(); change(); syncAttach(); go(1, true); toast('Ihre letzte Planung ist wieder da – „Rückgängig“ führt zum leeren Start zurück.'); } }
      else { try { localStorage.removeItem(AS_KEY); } catch (er) { } }
    });
  }

  /* ---------------- Start ---------------- */
  if (!fromHash()) fresh('l');
  const qAh = +(new URLSearchParams(location.search).get('ah') || 0);
  if (qAh >= 80 && qAh <= 110) { P.ah = qAh; setTimeout(() => toast(`Ihre Arbeitshöhe ${qAh} cm ist übernommen – sehen Sie den höheren Sockel?`), 2600); }
  // 17.10.: Der Planer beginnt bei Schritt 1 „Form & Raum“ – nur mit fertigem Plan im Link (KI, gespeicherte Küche) bei „Einrichten“
  renderPal(); change(); go(SENT ? 3 : HASH0 ? 1 : 0, true); syncAttach();
  if (/[?&]gesendet=1/.test(location.search)) { const n = $('[data-sent]'); if (n) n.hidden = false; }
  offerResume();
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); load3D(); } }); io.observe(host3);
  if (/[?&]foto=1/.test(location.search)) setTimeout(() => openFoto({}), 400);
  /* ---- Mitlauf-3D am Handy ----
     Die Bühne dockt beim Runterscrollen verkleinert unter den Planer-Kopf. Griff: ziehen = Größe, tippen = einklappen. */
  (function () {
    const st = $('.kp-stage'), hd = $('.kp-head'); if (!st || !hd || !window.matchMedia) return;
    const mq = matchMedia('(max-width:999px)'), land = matchMedia('(max-width:999px) and (orientation:landscape) and (max-height:560px)'), H = document.documentElement; let big = false;
    try { big = localStorage.getItem('kp-pip-big') === '1'; } catch (e) { }
    const ph = document.createElement('div'); ph.className = 'kp-stph'; ph.setAttribute('aria-hidden', 'true'); st.parentNode.insertBefore(ph, st);
    const bar = document.createElement('div'); bar.className = 'kp-dock';
    bar.innerHTML = `<button type="button" data-dk-ov>Übersicht</button><button type="button" class="kp-dock-g" data-dk-grip aria-label="3D-Ansicht: ziehen für größer oder kleiner, tippen zum Ein- und Ausklappen"><i></i><span>3D zeigen</span></button><button type="button" class="kp-dock-sz" data-dk-sz aria-label="3D-Fenster größer oder kleiner"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="9.5" y="9" width="6" height="4.5" rx="1" fill="currentColor"/></svg></button><button type="button" data-dk-up aria-label="Zur großen 3D-Ansicht"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    st.appendChild(bar);
    let on = false, mini = false, hh = 0, raf = 0, drag = null; const LS = 'kp-dock-h';
    try { hh = +localStorage.getItem(LS) || 0; } catch (e) { }
    const blocked = () => ['kpr-on', 'kpf-on', 'kpr-vfon', 'kp-lv-on'].some(c => H.classList.contains(c)) || !!document.fullscreenElement;
    const defH = () => Math.round(Math.min(250, Math.max(150, innerHeight * .26)));
    function apply() { st.classList.toggle('kp-pipbig', big); const top = Math.round(hd.getBoundingClientRect().bottom); root.style.setProperty('--dkt', top + 'px'); root.style.setProperty('--dkh', (mini ? 0 : (hh || defH())) + 'px'); st.classList.toggle('kp-dkmini', mini); }
    function set(v) { if (v === on) return; on = v; if (v) ph.style.height = st.offsetHeight + 'px'; st.classList.toggle('kp-docked', v); ph.classList.toggle('on', v); root.classList.toggle('kp-dockon', v); if (v) apply(); }
    function upd() {
      raf = 0; root.style.setProperty('--kpt', Math.round(hd.getBoundingClientRect().bottom) + 'px');
      if (blocked() || land.matches) { set(false); return; }
      const ref = (on ? ph : st).getBoundingClientRect(), top = hd.getBoundingClientRect().bottom, end = root.getBoundingClientRect().bottom;
      // Handy: dockt unter den Kopf · PC: schwebt als Mini-3D unten rechts, sobald die große Ansicht aus dem Bild ist
      if (mq.matches) set(ref.bottom < top + ref.height * .45 && end > top + 320);
      else set(ref.bottom < top + ref.height * .5 && end > innerHeight * .6);
      if (on) apply();
    }
    const q = () => { if (!raf) raf = requestAnimationFrame(upd); };
    // Gerät gedreht mitten im Planen: quer füllt der Planer genau den Bildschirm – dann direkt dorthin, nicht irgendwo darunter landen
    let inPl = false; const seen = () => { const r = root.getBoundingClientRect(); inPl = r.top < innerHeight * .5 && r.bottom > innerHeight * .5; };
    addEventListener('scroll', seen, { passive: true }); seen();
    const toLand = () => { if (land.matches && inPl) requestAnimationFrame(() => { scrollTo({ top: Math.round(root.getBoundingClientRect().top + scrollY), behavior: 'auto' }); seen(); }); };
    if (land.addEventListener) land.addEventListener('change', toLand); else if (land.addListener) land.addListener(toLand);
    addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); new MutationObserver(q).observe(H, { attributes: true, attributeFilter: ['class'] });
    bar.addEventListener('click', e => {
      if (e.target.closest('[data-dk-ov]')) { if (K && K.view) { K.view('perspektive'); $$('[data-cam]').forEach(x => x.classList.toggle('on', x.dataset.cam === 'perspektive')); } return; }
      if (e.target.closest('[data-dk-up]')) { const y = ph.getBoundingClientRect().top + scrollY - hd.getBoundingClientRect().bottom; scrollTo({ top: Math.max(0, y), behavior: RMO ? 'auto' : 'smooth' }); return; }
      if (e.target.closest('[data-dk-sz]')) { big = !big; try { localStorage.setItem('kp-pip-big', big ? '1' : '0'); } catch (er) { } mini = false; apply(); return; }
      if (e.target.closest('[data-dk-grip]') && e.detail === 0) { mini = !mini; apply(); }   // Tastatur
    });
    const grip = $('[data-dk-grip]', bar);
    grip.addEventListener('pointerdown', e => { drag = { y: e.clientY, h: mini ? 0 : (hh || defH()), m: 0 }; try { grip.setPointerCapture(e.pointerId); } catch (er) { } });
    grip.addEventListener('pointermove', e => { if (!drag || !mq.matches) return; const d = e.clientY - drag.y; if (Math.abs(d) > 5) drag.m = 1; if (!drag.m) return; const v = Math.max(0, Math.min(innerHeight * .55, drag.h + d)); st.classList.add('kp-dkdrag'); root.style.setProperty('--dkh', v + 'px'); st.classList.toggle('kp-dkmini', v < 60); drag.v = v; });
    const endDrag = () => { if (!drag) return; const w = drag; drag = null; st.classList.remove('kp-dkdrag'); if (!w.m) mini = !mini; else if (w.v < 70) mini = true; else { mini = false; hh = Math.round(Math.max(110, w.v)); try { localStorage.setItem(LS, String(hh)); } catch (e) { } } apply(); };
    grip.addEventListener('pointerup', endDrag); grip.addEventListener('pointercancel', endDrag);
    upd();
  })();
  // Einmaliger Hinweis

})();
