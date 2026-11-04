/* Raum-Vorschau: Foto automatisch vermessen · Entwurf Falcon Eye
   17.10.: „Es muss viel mehr automatisch passieren“ – die vier Bodenpunkte werden nicht mehr von Hand gesetzt,
   sondern aus dem Foto gelesen. Läuft komplett im Browser (wenn möglich in einem Web Worker), ohne Server, ohne KI-Dienst.
   Ablauf:
   1. Kanten → gerade Linienstücke (wie LSD: Bereiche gleicher Kantenrichtung wachsen lassen)
   2. Senkrechte Linien → „oben“ der Kamera (Neigung, Schräglage)
   3. Linien auf dem Horizont gebündelt → die zwei Raumrichtungen (Manhattan-Welt: Wände stehen im rechten Winkel)
   4. Linien unterhalb des Horizonts auf den Boden zurückrechnen → Bodenkanten der linken/rechten/hinteren Wand
      (innen Boden-, außen Wandfarbe; Fliesenfugen und Steckdosenreihen fallen damit heraus)
   5. Ecken → die vier Punkte im Format von kp-foto.js (hinten links, hinten rechts, vorne rechts, vorne links) + Sicherheit
   Ergebnis: { ok, conf, pts, mm, why, dbg } – bei geringer Sicherheit trotzdem ein plausibler Vorschlag (Kamera 1,5 m hoch). */
(function (G) {
  'use strict';
  function core(px, W, H, opt) {
    opt = opt || {};
    const t0 = Date.now(), PI = Math.PI, dbg = {};
    // ---------- kleine Vektorrechnung (3D) ----------
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], ln = a => Math.hypot(a[0], a[1], a[2]);
    const nz = a => { const l = ln(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const sb = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], ad = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    let seed = 1234567; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // ---------- 1) Graustufen, weichzeichnen, Kanten ----------
    const N = W * H, g0 = new Float32Array(N), g = new Float32Array(N), tmp = new Float32Array(N);
    for (let i = 0, j = 0; i < N; i++, j += 4) g0[i] = (px[j] * .299 + px[j + 1] * .587 + px[j + 2] * .114) / 255;
    for (let y = 0; y < H; y++) { const r = y * W; for (let x = 0; x < W; x++) tmp[r + x] = (g0[r + Math.max(0, x - 1)] + 2 * g0[r + x] + g0[r + Math.min(W - 1, x + 1)]) / 4; }
    for (let y = 0; y < H; y++) { const r = y * W, ym1 = Math.max(0, y - 1) * W, yp1 = Math.min(H - 1, y + 1) * W; for (let x = 0; x < W; x++) g[r + x] = (tmp[ym1 + x] + 2 * tmp[r + x] + tmp[yp1 + x]) / 4; }
    const mag = new Float32Array(N), ang = new Float32Array(N), TH = opt.th || .014;
    let cnt = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = (g[i - W + 1] + 2 * g[i + 1] + g[i + W + 1]) - (g[i - W - 1] + 2 * g[i - 1] + g[i + W - 1]);
      const gy = (g[i + W - 1] + 2 * g[i + W] + g[i + W + 1]) - (g[i - W - 1] + 2 * g[i - W] + g[i - W + 1]);
      const m = Math.hypot(gx, gy) / 8; mag[i] = m; ang[i] = Math.atan2(gx, -gy); if (m > TH) cnt++;
    }
    // ---------- 2) Linienstücke (Bereiche gleicher Kantenrichtung) ----------
    const TOL = PI / 8, order = new Int32Array(cnt); let k0 = 0;
    for (let i = 0; i < N; i++) if (mag[i] > TH) order[k0++] = i;
    const ord = Array.from(order).sort((a, b) => mag[b] - mag[a]);
    const used = new Uint8Array(N), segs = [], reg = new Int32Array(N);
    for (const s0 of ord) {
      if (used[s0]) continue;
      let n = 1, sxx = Math.cos(ang[s0]), syy = Math.sin(ang[s0]), ra = ang[s0]; reg[0] = s0; used[s0] = 1;
      for (let k = 0; k < n; k++) {
        const i = reg[k], x = i % W, y = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 1 || yy < 1 || xx >= W - 1 || yy >= H - 1) continue;
          const j = yy * W + xx; if (used[j] || mag[j] <= TH) continue;
          let d = Math.abs(ang[j] - ra); if (d > PI) d = 2 * PI - d; if (d > TOL) continue;
          used[j] = 1; reg[n++] = j; sxx += Math.cos(ang[j]); syy += Math.sin(ang[j]); ra = Math.atan2(syy, sxx);
        }
      }
      if (n < 12) continue;
      let sw = 0, mx = 0, my = 0; for (let k = 0; k < n; k++) { const i = reg[k], w = mag[i]; sw += w; mx += w * (i % W); my += w * ((i / W) | 0); } mx /= sw; my /= sw;
      let ixx = 0, iyy = 0, ixy = 0; for (let k = 0; k < n; k++) { const i = reg[k], w = mag[i], dx = (i % W) - mx, dy = ((i / W) | 0) - my; ixx += w * dx * dx; iyy += w * dy * dy; ixy += w * dx * dy; }
      const th = .5 * Math.atan2(2 * ixy, ixx - iyy), ux = Math.cos(th), uy = Math.sin(th);
      let lo = 1e9, hi = -1e9, wl = 1e9, wh = -1e9;
      for (let k = 0; k < n; k++) { const i = reg[k], dx = (i % W) - mx, dy = ((i / W) | 0) - my, t = dx * ux + dy * uy, s = -dx * uy + dy * ux; if (t < lo) lo = t; if (t > hi) hi = t; if (s < wl) wl = s; if (s > wh) wh = s; }
      const len = hi - lo, wid = wh - wl + 1;
      if (len < Math.max(14, (W + H) * .012) || len < wid * 3.2) continue;
      segs.push({ x1: mx + ux * lo, y1: my + uy * lo, x2: mx + ux * hi, y2: my + uy * hi, len, m: sw / n });
    }
    dbg.nSeg = segs.length;
    // ---------- Kamera: Brennweite (EXIF oder Handy-Standard 26 mm Kleinbild) ----------
    const L0 = Math.max(W, H), mm0 = opt.mm || 26, cx = W / 2, cy = H / 2;
    const fOf = mm => mm / 36 * L0;   // Kleinbild-Breite 36 mm entspricht der langen Bildseite
    let f = fOf(mm0);
    const ray = (x, y) => nz([(x - cx) / f, (y - cy) / f, 1]);
    // Linie im Kamera-Raum: Ebene durch die Kamera und das Linienstück (Normale)
    const prep = () => segs.forEach(s => { const a = ray(s.x1, s.y1), b = ray(s.x2, s.y2); s.n = nz(cr(a, b)); s.ux = (s.x2 - s.x1) / s.len; s.uy = (s.y2 - s.y1) / s.len; s.mx = (s.x1 + s.x2) / 2; s.my = (s.y1 + s.y2) / 2; });
    prep();
    // Winkelfehler Richtung d (Kamera-Raum) ↔ Linienstück: Richtung liegt in der Ebene der Linie (|n·d| klein)
    const errD = (s, d) => Math.abs(dt(s.n, d));
    // ---------- 3) Senkrechte → oben (Fluchtpunkt der senkrechten Kanten) ----------
    function refineDir(list, d0) {
      if (list.length < 2) return d0;
      const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; list.forEach(s => { const w = s.len; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] += w * s.n[i] * s.n[j]; });
      // inverse Potenzmethode: kleinster Eigenwert = Richtung, die in allen Linien-Ebenen liegt
      let v = d0.slice();
      for (let it = 0; it < 30; it++) { const s2 = solve3(A.map((r, i) => r.map((x, j) => x + (i === j ? 1e-9 : 0))), v); if (!s2) break; const nv = nz(s2); v = dt(nv, v) < 0 ? sc(nv, -1) : nv; }
      return dt(v, d0) < 0 ? sc(v, -1) : v;
    }
    function solve3(M, b) { const det3 = (m0, m1, m2) => m0[0] * (m1[1] * m2[2] - m1[2] * m2[1]) - m0[1] * (m1[0] * m2[2] - m1[2] * m2[0]) + m0[2] * (m1[0] * m2[1] - m1[1] * m2[0]); const det = det3(M[0], M[1], M[2]); if (Math.abs(det) < 1e-18) return null; const col = i => M.map((row, k) => row.map((x, j) => j === i ? b[k] : x)); return [det3(...col(0)) / det, det3(...col(1)) / det, det3(...col(2)) / det]; }
    const steep = s => Math.abs(s.uy) > Math.cos(25 * PI / 180);
    // ---------- 3+4) Fluchtpunkte im Bild: Raumtiefe, Raumbreite (beide auf dem Horizont) ----------
    // Echte Handyfotos sind oft entzerrt/beschnitten – darum zuerst die zwei waagerechten Fluchtpunkte direkt im Bild suchen.
    // Der Horizont durch beide legt die Bodenebene fest (das ist für das Hineinstellen entscheidend), die Brennweite folgt
    // aus dem rechten Winkel zwischen den beiden Richtungen; die senkrechten Kanten dienen nur als Gegenprobe.
    const S2 = L0;   // Normierung
    const hl = s => { const a = [s.x1 / S2, s.y1 / S2, 1], b = [s.x2 / S2, s.y2 / S2, 1]; return nz(cr(a, b)); };
    segs.forEach(s => { s.l = hl(s); });
    // Abweichung (Winkel) Linienstück ↔ Fluchtpunkt v (homogen, normiert)
    const vErr = (s, v) => { const mx = s.mx / S2, my = s.my / S2; let dx = v[0] - mx * v[2], dy = v[1] - my * v[2]; const L = Math.hypot(dx, dy); if (L < 1e-9) return 0; dx /= L; dy /= L; return Math.abs(dx * s.uy - dy * s.ux); };   // sin(Winkel)
    const VT = Math.sin(1.6 * PI / 180);
    const supV = (v, list) => { let t = 0; for (const s of list) { const e = vErr(s, v); if (e < VT) t += s.len * (1 - e / VT); } return t; };
    const ransac = (list, iters, ok) => { if (list.length < 2) return null; const tot = list.reduce((a, s) => a + s.len, 0); let best = null, bs = 0;
      for (let it = 0; it < iters; it++) { const a = pickW(list, tot), b = pickW(list, tot); if (a === b) continue; let v = cr(a.l, b.l); const n = ln(v); if (n < 1e-12) continue; v = sc(v, 1 / n); if (v[2] < 0) v = sc(v, -1); if (ok && !ok(v)) continue; const sc2 = supV(v, list); if (sc2 > bs) { bs = sc2; best = v; } }
      return best && { v: best, sc: bs }; };
    const pickW = (list, tot) => { let r = rnd() * tot; for (const s of list) { r -= s.len; if (r <= 0) return s; } return list[list.length - 1]; };
    const img = v => Math.abs(v[2]) < 1e-9 ? null : [v[0] / v[2] * S2, v[1] / v[2] * S2];   // Bildkoordinaten (px) oder null (unendlich)
    // a) senkrechter Fluchtpunkt (weit über/unter dem Bild)
    const vs = segs.filter(steep);
    const VV = ransac(vs, 500, v => { const q = img(v); return !q || Math.abs(q[1] - cy) > H * 1.2; });
    const vIn = VV ? segs.filter(s => steep(s) && vErr(s, VV.v) < VT) : [];
    dbg.upW = vIn.reduce((a, s) => a + s.len, 0) / H;
    // b) erster waagerechter Fluchtpunkt: meiste Linienlänge (ohne die Senkrechten)
    const rest = segs.filter(s => !vIn.includes(s));
    const okH = v => { const q = img(v); if (!q) return Math.abs(v[1]) < Math.abs(v[0]) * Math.tan(25 * PI / 180); return Math.abs(q[1] - cy) < H * 1.1; };   // in der Nähe der Bildmitte (Höhe)
    const V1 = ransac(rest, 900, okH);
    let V2 = null, fEst = null;
    if (V1) {
      const r1 = rest.filter(s => vErr(s, V1.v) >= VT * 1.4), q1 = img(V1.v);
      // c) zweiter Fluchtpunkt: rechter Winkel muss möglich sein (Brennweite 9–80 mm), Horizont kaum schief
      const ok2 = v => { if (!okH(v)) return false; const q2 = img(v);
        if (q1 && q2) { const dd = (q1[0] - cx) * (q2[0] - cx) + (q1[1] - cy) * (q2[1] - cy); if (dd >= 0) return false; const ff = Math.sqrt(-dd), mm = ff / L0 * 36; if (mm < 9 || mm > 80) return false; if (Math.abs(q2[1] - q1[1]) > Math.abs(q2[0] - q1[0]) * Math.tan(20 * PI / 180)) return false; }
        else if (q1 && !q2) { if (Math.abs(v[1]) > Math.abs(v[0]) * Math.tan(20 * PI / 180)) return false; }
        else if (!q1 && q2) { if (Math.abs(V1.v[1]) > Math.abs(V1.v[0]) * Math.tan(20 * PI / 180)) return false; }
        else return false;
        return true; };
      V2 = ransac(r1, 900, ok2);
      if (V2) { const q2 = img(V2.v); if (q1 && q2) { const dd = (q1[0] - cx) * (q2[0] - cx) + (q1[1] - cy) * (q2[1] - cy); fEst = Math.sqrt(-dd); } }
    }
    // Fluchtpunkte verfeinern: kleinste Quadrate über alle passenden Linien (Toleranz schrittweise enger)
    const refineV = (v, list, tol) => { for (let it = 0; it < 3; it++) { const T = Math.sin(tol * PI / 180), inl = list.filter(s => vErr(s, v) < T); if (inl.length < 2) break;
      const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; inl.forEach(s => { const w = s.len; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] += w * s.l[i] * s.l[j]; });
      let u = v.slice(); for (let k = 0; k < 25; k++) { const s2 = solve3(A.map((r, i) => r.map((x, j) => x + (i === j ? 1e-12 : 0))), u); if (!s2) break; const nu = nz(s2); u = dt(nu, u) < 0 ? sc(nu, -1) : nu; }
      if (u[2] < 0) u = sc(u, -1); v = u; tol = Math.max(1.6, tol * .7); } return v; };
    if (V1) V1.v = refineV(V1.v, rest, 3);
    if (V2) V2.v = refineV(V2.v, rest.filter(s => vErr(s, V1.v) >= VT), 3);
    if (V1 && V2) { const q1 = img(V1.v), q2 = img(V2.v); if (q1 && q2) { const dd = (q1[0] - cx) * (q2[0] - cx) + (q1[1] - cy) * (q2[1] - cy); fEst = dd < 0 ? Math.sqrt(-dd) : null; } }
    // Kandidaten für den Raumrahmen – der mit der meisten passenden Linienlänge gewinnt:
    //  A) senkrechter + erster waagerechter Fluchtpunkt → Brennweite aus deren rechtem Winkel, zweite Richtung rechtwinklig dazu
    //  B) beide waagerechten Fluchtpunkte → Brennweite aus deren rechtem Winkel, oben senkrecht zum Horizont
    //  C) Foto-Daten/26 mm mit dem jeweils besseren Rest
    const okMM = mm => mm >= 9 && mm <= 80;
    const fFrom = (a, b) => { const qa = img(a), qb = img(b); if (!qa || !qb) return null; const dd = (qa[0] - cx) * (qb[0] - cx) + (qa[1] - cy) * (qb[1] - cy); return dd < 0 ? Math.sqrt(-dd) : null; };
    const mkFrame = (mm, how) => {
      f = fOf(mm); prep();
      const dirOf = v => { const q = img(v); return q ? nz([(q[0] - cx) / f, (q[1] - cy) / f, 1]) : nz([v[0], v[1], 0]); };
      let up = null;
      if (how === 'B' && V1 && V2) { up = nz(cr(dirOf(V1.v), dirOf(V2.v))); }
      else if (VV) up = dirOf(VV.v);
      else up = [0, -Math.cos(.12), -Math.sin(.12)];
      if (up[1] > 0) up = sc(up, -1);
      let d1 = V1 ? dirOf(V1.v) : nz(sb([0, 0, 1], sc(up, up[2]))); d1 = nz(sb(d1, sc(up, dt(d1, up))));
      const d2 = nz(cr(up, d1));
      let Z = Math.abs(d1[2]) >= Math.abs(d2[2]) ? d1 : d2; if (Z[2] < 0) Z = sc(Z, -1);
      const X = nz(cr(Z, up));
      // Güte: Linien zu Z, X (Bild-Fluchtpunkte) und Senkrechte
      const vO = d => nz([(d[0] * f + cx * d[2]) / S2, (d[1] * f + cy * d[2]) / S2, d[2]]), vz = vO(Z), vx = vO(X), vy = vO(up), T = Math.sin(1.8 * PI / 180);
      // ausgewogen: beide waagerechten Richtungen müssen getragen werden (die Tiefe hat oft nur wenige, aber entscheidende Linien)
      let sz = 0, sx = 0, sv = 0; segs.forEach(s => { const ez = vErr(s, vz), ex = vErr(s, vx), ev = steep(s) ? vErr(s, vy) : 9, e = Math.min(ez, ex, ev); if (e >= T) return; const w = s.len * (1 - e / T); if (e === ev) sv += w; else if (e === ez) sz += w; else sx += w; });
      return { mm, up, Z, X, sc: sz + sx + .25 * sv + 1.5 * Math.min(sz, sx), sz, sx, sv, how };
    };
    const prior = opt.mm || 26, cands = [];
    const fA = V1 && VV ? fFrom(VV.v, V1.v) : null, fB = V1 && V2 ? fFrom(V1.v, V2.v) : null;
    if (fA && okMM(fA / L0 * 36)) cands.push([fA / L0 * 36, 'A']);
    if (fB && okMM(fB / L0 * 36)) cands.push([fB / L0 * 36, 'B']);
    cands.push([prior, 'A']); if (V2) cands.push([prior, 'B']);
    let FR = null; dbg.fr = [];
    cands.forEach(([mm, how]) => { const fr = mkFrame(mm, how); const k = opt.mm ? 1 - .35 * Math.abs(Math.log(mm / opt.mm)) : 1; fr.sc2 = fr.sc * k; dbg.fr.push([Math.round(mm * 10) / 10, how, Math.round(fr.sc), Math.round(fr.sz), Math.round(fr.sx), Math.round(fr.sv)]); if (!FR || fr.sc2 > FR.sc2) FR = fr; });
    FR = mkFrame(FR.mm, FR.how);
    let { up, Z, X } = FR; let mmUse = FR.mm;
    dbg.mm = Math.round(mmUse * 10) / 10; dbg.how = FR.how; if (!V1) dbg.noFrame = 1;
    // ---------- 4b) Bodenebene aus den Bodenlinien nachschärfen ----------
    // Linien auf dem Boden (Sockel, Fugen) bestimmen die Bodenebene am genauesten – Fenster und Decke können durch
    // Objektiv-Entzerrung leicht anders laufen. Fluchtpunkte nur aus Linien unterhalb des Horizonts, nahe am alten Horizont.
    {
      const vO = d => nz([(d[0] * f + cx * d[2]) / S2, (d[1] * f + cy * d[2]) / S2, d[2]]);
      const hz = vO(up);   // Horizont als Bildlinie: Punkte p mit (K⁻¹p)·up = 0 → homogene Linie l = K⁻ᵀ up (in S2-Normierung)
      const hl2 = [up[0] / f * S2, up[1] / f * S2, up[2] - (up[0] * cx + up[1] * cy) / f];
      const belowH = (x, y) => { const r = ray(x, y); return dt(r, up) < -.03; };
      const flo = segs.filter(s => !steep(s) || !(VV && vErr(s, VV.v) < VT)).filter(s => belowH(s.x1, s.y1) && belowH(s.x2, s.y2));
      const nearH = v => { const q = img(v); if (!q) return Math.abs(v[0] * hl2[0] + v[1] * hl2[1]) < .2 * Math.hypot(hl2[0], hl2[1]); const d = Math.abs(hl2[0] * q[0] / S2 + hl2[1] * q[1] / S2 + hl2[2]) / Math.hypot(hl2[0], hl2[1]) * S2; return d < H * .14 && q[0] > -W * 2 && q[0] < W * 3; };
      const F1 = ransac(flo, 700, nearH);
      if (F1 && F1.sc > H * .3) {
        F1.v = refineV(F1.v, flo, 2.5);
        const r2 = flo.filter(s => vErr(s, F1.v) >= VT * 1.4), F2 = ransac(r2, 700, v => { if (!nearH(v)) return false; const ff = fFrom(F1.v, v); return !img(v) || !img(F1.v) || (ff && okMM(ff / L0 * 36)); });
        if (F2) F2.v = refineV(F2.v, r2, 2.5);
        const ff = F2 ? fFrom(F1.v, F2.v) : null, mmF = ff ? ff / L0 * 36 : null;
        dbg.F1 = img(F1.v) && img(F1.v).map(Math.round); dbg.F2 = F2 && (img(F2.v) ? img(F2.v).map(Math.round) : 'inf'); dbg.mmF = mmF && Math.round(mmF * 10) / 10;
        if (F2 && (mmF ? okMM(mmF) : true)) {
          const mm2 = mmF && (!opt.mm || Math.abs(Math.log(mmF / opt.mm)) < .35) ? mmF : mmUse; f = fOf(mm2); prep();
          const dirOf = v => { const q = img(v); return q ? nz([(q[0] - cx) / f, (q[1] - cy) / f, 1]) : nz([v[0], v[1], 0]); };
          const a1 = dirOf(F1.v), a2 = dirOf(F2.v); let u2 = nz(cr(a1, a2)); if (u2[1] > 0) u2 = sc(u2, -1);
          if (Math.abs(u2[1]) > Math.cos(40 * PI / 180)) {
            let z2 = Math.abs(a1[2]) >= Math.abs(a2[2]) ? a1 : a2; z2 = nz(sb(z2, sc(u2, dt(z2, u2)))); if (z2[2] < 0) z2 = sc(z2, -1);
            up = u2; Z = z2; X = nz(cr(Z, up)); mmUse = mm2; dbg.mm = Math.round(mm2 * 10) / 10; dbg.how += '+Boden';
          } else { f = fOf(mmUse); prep(); }
        }
      }
    }
    dbg.V1 = V1 && img(V1.v) && img(V1.v).map(v => Math.round(v)); dbg.V2 = V2 && (img(V2.v) ? img(V2.v).map(v => Math.round(v)) : 'inf');
    const vertIn = s => errD(s, up) < .02, hs = segs.filter(s => !vertIn(s));
    const upW = segs.filter(vertIn).reduce((a, s) => a + s.len, 0); dbg.upW = upW / H; if (upW < H * .25) dbg.upGuess = 1;
    { const vp = d => Math.abs(d[2]) < 1e-6 ? null : [(d[0] / d[2] * f + cx) / W, (d[1] / d[2] * f + cy) / H]; dbg.vpZ = vp(Z); dbg.vpX = vp(X); dbg.vpY = vp(up); dbg.f = f; }
    const vOf = d => nz([(d[0] * f + cx * d[2]) / S2, (d[1] * f + cy * d[2]) / S2, d[2]]), vZ = vOf(Z), vX = vOf(X), CT = Math.sin(2.2 * PI / 180);
    const inZ = s => !vertIn(s) && vErr(s, vZ) < CT && vErr(s, vX) > CT * .6, inX = s => !vertIn(s) && vErr(s, vX) < CT && vErr(s, vZ) > CT * .6;
    const sZ = hs.filter(inZ), sX = hs.filter(inX);
    dbg.nZ = sZ.length; dbg.nX = sX.length;
    // ---------- 5) Boden: Linien unterhalb des Horizonts zurückrechnen (Kamera 1 hoch, später skaliert) ----------
    const toFloor = (x, y) => { const r = ray(x, y), dn = dt(r, up); if (dn > -.025) return null; const t = 1 / -dn, P = sc(r, t); return { x: dt(P, X), z: dt(P, Z) }; };
    // Farben für den Boden-/Wand-Test (innen Boden, außen Wand)
    const col = (x, y) => { x = Math.max(0, Math.min(W - 1, Math.round(x))); y = Math.max(0, Math.min(H - 1, Math.round(y))); const j = (y * W + x) * 4; return [px[j], px[j + 1], px[j + 2]]; };
    const avg = (pts2) => { const s3 = [0, 0, 0]; pts2.forEach(c => { s3[0] += c[0]; s3[1] += c[1]; s3[2] += c[2]; }); return sc(s3, 1 / Math.max(1, pts2.length)); };
    const cd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / 255;
    // Bodenfarbe: unten in der Bildmitte (dort ist fast immer Boden)
    const floorC = (() => { const P2 = []; for (let i = 0; i < 60; i++) P2.push(col(W * (.3 + .4 * rnd()), H * (.8 + .17 * rnd()))); return avg(P2); })();
    const sideTest = (s, sgn) => {
      // Farbe 4 px beiderseits entlang der Linie; sgn: welche Seite ist „innen“ (Richtung Raummitte im Bild)
      const nx = -s.uy, ny = s.ux, A = [], B = [];
      for (let k = 1; k <= 7; k++) { const t = k / 8, x = s.x1 + (s.x2 - s.x1) * t, y = s.y1 + (s.y2 - s.y1) * t; A.push(col(x + nx * 4 * sgn, y + ny * 4 * sgn)); B.push(col(x - nx * 4 * sgn, y - ny * 4 * sgn)); }
      const ci = avg(A), co = avg(B); return { inF: cd(ci, floorC), outF: cd(co, floorC), io: cd(ci, co) };
    };
    const fl = (list) => list.map(s => { const a = toFloor(s.x1, s.y1), b = toFloor(s.x2, s.y2); if (!a || !b) return null; return { s, a, b }; }).filter(Boolean);
    const FZ = fl(sZ), FX = fl(sX);
    // Seitenwände: Linien in die Tiefe, seitlicher Abstand x (für alle Punkte gleich)
    const side2 = (sgn) => {
      const C = FZ.filter(o => sgn * (o.a.x + o.b.x) / 2 > .12 && Math.abs(o.a.x - o.b.x) < .08 + .04 * Math.abs(o.a.x)).map(o => {
        const xm = (o.a.x + o.b.x) / 2; // Innenseite: im Bild zur Mitte hin (vom Linienstück aus Richtung Bildmitte)
        const toMid = Math.sign((cx - o.s.mx) * -o.s.uy + (H * .75 - o.s.my) * o.s.ux) || 1; const t = sideTest(o.s, toMid);
        const jl = Math.max(0, .26 - t.inF) * 3.6 * Math.min(1, t.outF * 4) * Math.min(1, t.io * 6);   // innen wie Boden, außen anders
        return { x: xm, z0: Math.min(o.a.z, o.b.z), z1: Math.max(o.a.z, o.b.z), w: o.s.len * (.4 + jl), jl, s: o.s };
      });
      if (!C.length) return null;
      dbg['S' + sgn] = C.map(c => [Math.round(c.x * 100) / 100, Math.round(c.z0 * 10) / 10, Math.round(c.z1 * 10) / 10, Math.round(c.jl * 100) / 100, [c.s.x1, c.s.y1, c.s.x2, c.s.y2].map(Math.round)]);
      // bündeln (gleicher seitlicher Abstand) und die äußerste Gruppe mit echter Boden-/Wand-Kante nehmen
      C.sort((p, q) => sgn * (q.x - p.x));
      const grp = []; C.forEach(c => { const g2 = grp.find(G2 => Math.abs(G2.x - c.x) < .035 + .025 * Math.abs(c.x)); if (g2) { g2.w += c.w; g2.jl = Math.max(g2.jl, c.jl); g2.x = (g2.x * g2.n + c.x) / (g2.n + 1); g2.n++; g2.z0 = Math.min(g2.z0, c.z0); g2.z1 = Math.max(g2.z1, c.z1); g2.list.push(c.s); } else grp.push({ x: c.x, w: c.w, jl: c.jl, n: 1, z0: c.z0, z1: c.z1, list: [c.s] }); });
      const wmax = Math.max(...grp.map(G2 => G2.w));
      const cand = grp.filter(G2 => G2.w > wmax * .22 && G2.jl > .12);
      const pick = (cand.length ? cand : grp.filter(G2 => G2.w > wmax * .35)).sort((p, q) => sgn * (q.x - p.x))[0];
      return pick || null;
    };
    const Ls = side2(-1), Rs = side2(1);
    // ---------- 5b) Ecken suchen: die Bodenkante der Seitenwand im Bild weiterverfolgen, bis sie endet ----------
    // (Linienstücke reißen oft vor der Ecke ab – die Kante selbst läuft bis zur Rückwand)
    const projPx = (x, z) => { const P = ad(ad(sc(X, x), sc(Z, z)), sc(up, -1)); if (P[2] < .05) return null; return [P[0] / P[2] * f + cx, P[1] / P[2] * f + cy]; };
    const gAt = (x, y) => { const xi = Math.round(x), yi = Math.round(y); return xi < 1 || yi < 1 || xi >= W - 1 || yi >= H - 1 ? null : g[yi * W + xi]; };
    const edgeAt = (a, b) => { if (!a || !b) return null; let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L; const nx = -ty, ny = tx; let e = 0; for (const o of [1.5, 2.5, 3.5]) { const p = gAt(a[0] + nx * o, a[1] + ny * o), q = gAt(a[0] - nx * o, a[1] - ny * o); if (p == null || q == null) return null; e = Math.max(e, Math.abs(p - q)); } return e; };
    const traceZ = G2 => {
      const at = z => edgeAt(projPx(G2.x, z), projPx(G2.x, z * 1.004 + .004));
      const ref = []; for (let k = 0; k <= 8; k++) { const e = at(G2.z0 + (G2.z1 - G2.z0) * k / 8); if (e != null) ref.push(e); }
      if (ref.length < 3) return G2.z1; ref.sort((p, q) => p - q); const r = ref[ref.length >> 1]; if (r < .02) return G2.z1;
      let z = G2.z1, last = G2.z1, miss = 0;
      for (let k = 0; k < 160 && z < G2.z1 * 2.2 + 1; k++) { z *= 1.012; const e = at(z); if (e == null) break; if (e > r * .45) { last = z; miss = 0; } else if (++miss > 3) break; }
      return last;
    };
    [Ls, Rs].forEach(G2 => { if (G2) G2.zc = traceZ(G2); });
    // Rückwand: Linien quer, Tiefe z – Innenseite ist zur Kamera hin (im Bild unten)
    const back = (() => {
      const C = FX.filter(o => Math.abs(o.a.z - o.b.z) < .1 + .05 * Math.abs(o.a.z) && (o.a.z + o.b.z) / 2 > .8).map(o => {
        const zm = (o.a.z + o.b.z) / 2, toMid = Math.sign(-o.s.uy * (cx - o.s.mx) + o.s.ux * (H - o.s.my)) || 1, t = sideTest(o.s, toMid);
        const jl = Math.max(0, .26 - t.inF) * 3.6 * Math.min(1, t.outF * 4) * Math.min(1, t.io * 6);
        return { z: zm, x0: Math.min(o.a.x, o.b.x), x1: Math.max(o.a.x, o.b.x), w: o.s.len * (.4 + jl), jl, s: o.s };
      });
      if (!C.length) return null;
      const grp = []; C.forEach(c => { const g2 = grp.find(G2 => Math.abs(G2.z - c.z) < .05 + .03 * c.z); if (g2) { g2.w += c.w; g2.jl = Math.max(g2.jl, c.jl); g2.z = (g2.z * g2.n + c.z) / (g2.n + 1); g2.n++; g2.x0 = Math.min(g2.x0, c.x0); g2.x1 = Math.max(g2.x1, c.x1); g2.list.push(c.s); } else grp.push({ z: c.z, w: c.w, jl: c.jl, n: 1, x0: c.x0, x1: c.x1, list: [c.s] }); });
      const wmax = Math.max(...grp.map(G2 => G2.w)), cand = grp.filter(G2 => G2.w > wmax * .2 && G2.jl > .12);
      dbg.Bc = grp.map(G2 => [Math.round(G2.z * 100) / 100, Math.round(G2.jl * 100) / 100, Math.round(G2.w), G2.list.map(s => [s.x1, s.y1, s.x2, s.y2].map(Math.round))]);
      // wo die Seitenwand-Kanten enden, ist die Ecke – die Bodenkante der Rückwand liegt dort oder knapp dahinter, nie davor
      // (davor liegen Fugen und Schattenkanten auf dem Boden, dahinter die Oberkante der Sockelleiste und Dinge an der Wand)
      const ends2 = [Ls, Rs].filter(Boolean).map(G2 => G2.zc || G2.z1);
      if (ends2.length) {
        const ze = Math.max(...ends2), okW = G2 => G2.w > wmax * .12;
        // Fenster um die verfolgte Ecke (die Verfolgung läuft oft ein Stück über die Sockelleiste hinaus): die nächste kräftige Linie
        // gewinnt; eine zweite knapp dahinter (Oberkante der Sockelleiste) bestätigt sie als Bodenkante
        const win = grp.filter(G2 => okW(G2) && G2.z >= ze * .86 && G2.z <= ze * 1.06 + .05);
        if (win.length) {
          win.forEach(G2 => { const pair = grp.some(H2 => H2 !== G2 && H2.z > G2.z * 1.025 && H2.z < G2.z * 1.13 && H2.w > G2.w * .3); G2.sc = G2.w * (1 + G2.jl) * (pair ? 1.6 : 1); });
          const mx = Math.max(...win.map(G2 => G2.sc)), pk = win.filter(G2 => G2.sc >= mx * .45).sort((p, q) => p.z - q.z)[0];
          if (pk) { dbg.bPick = 'ecke+linie'; return pk; }
        }
        const beyond = grp.filter(G2 => okW(G2) && G2.z >= ze * .955 && G2.z < ze * 1.35 + .15).sort((p, q) => p.z - q.z);
        if (beyond.length) { dbg.bPick = 'ende'; return beyond[0]; }
        const near = grp.filter(G2 => Math.abs(G2.z - ze) < .2 * ze + .1 && okW(G2)).sort((p, q) => q.w * (1 + q.jl) - p.w * (1 + p.jl)); if (near.length) { dbg.bPick = 'nah'; return near[0]; }
        dbg.bPick = 'ecke'; return null;
      }
      return (cand.length ? cand : grp.filter(G2 => G2.w > wmax * .4)).sort((p, q) => q.z - p.z)[0] || null;
    })();
    // Rückwand-Tiefe: Querlinie – oder die verfolgte Ecke
    const ends = [Ls, Rs].filter(Boolean).map(G2 => G2.zc || G2.z1), zE = ends.length ? Math.max(...ends) : null;
    let zB = back ? back.z : null;
    if (zB == null && zE != null) zB = zE;
    else if (zB != null && zE != null && zE > zB * 1.2) zB = zE;   // Querlinie war eine Fuge weit davor
    dbg.L = Ls && { x: Ls.x, jl: Ls.jl, w: Ls.w, z1: Ls.z1, zc: Ls.zc }; dbg.R = Rs && { x: Rs.x, jl: Rs.jl, w: Rs.w, z1: Rs.z1, zc: Rs.zc }; dbg.B = back && { z: back.z, jl: back.jl }; dbg.zB = zB;
    // ---------- 6) Ecken → Bildpunkte ----------
    const H_CAM = 1.45;   // übliche Kamerahöhe (m) – nur für fehlende Teile; der Maßstab kommt aus der Wandlänge im Plan
    let xL = Ls ? Ls.x : null, xR = Rs ? Rs.x : null;
    const wallW = opt.wallW || null;   // Breite der Rückwand laut Plan (m), wenn bekannt
    if (xL == null && xR != null) xL = xR - (wallW ? wallW / H_CAM : 2.4);
    if (xR == null && xL != null) xR = xL + (wallW ? wallW / H_CAM : 2.4);
    if (xL == null) { const ww = wallW ? wallW / H_CAM : 2.4; xL = -ww * .45; xR = ww * .55; }
    if (zB == null) zB = Math.max(1.6, (opt.depth || 3.6) / H_CAM - .3);
    const proj = (x, z) => { const P = ad(ad(sc(X, x), sc(Z, z)), sc(up, -1)); if (P[2] < .05) return null; return [(P[0] / P[2] * f + cx) / W, (P[1] / P[2] * f + cy) / H]; };
    // vorne: die beiden vorderen Punkte so weit vorn, dass sie gerade noch gut im Bild liegen (zum Anfassen)
    const inside = p => p && p[1] <= .94 && p[0] >= .03 && p[0] <= .97;
    let zF = zB * .55; for (let k = 0; k < 40 && zF > .5; k++) { if (!inside(proj(xL, zF * .97)) || !inside(proj(xR, zF * .97))) break; zF *= .97; }
    for (let k = 0; k < 60 && zF < zB * .9; k++) { if (inside(proj(xL, zF)) && inside(proj(xR, zF))) break; zF *= 1.03; }
    let pts = [proj(xL, zB), proj(xR, zB), proj(xR, zF), proj(xL, zF)];
    if (pts.some(p => !p)) pts = null;
    // ---------- 7) Sicherheit: Linien-Beleg × Geometrie × drinnen × Kamerahöhe ----------
    const sup = (Ls ? Math.min(1, .35 + Ls.jl * 1.6) * .3 : 0) + (Rs ? Math.min(1, .35 + Rs.jl * 1.6) * .3 : 0) + (back ? Math.min(1, .35 + back.jl * 1.6) * .25 : zE != null ? .12 : 0) + (dbg.upGuess || dbg.noFrame ? 0 : .15);
    // Geometrie: hinten oben, vorne unten, sinnvolle Breite, nicht überkreuzt
    let geo = 1;
    if (!pts) geo = 0;
    else {
      const [a, b2, c, d] = pts, side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const cvx = [side(a, b2, c), side(b2, c, d), side(c, d, a), side(d, a, b2)], conv = cvx.every(v => v > 0) || cvx.every(v => v < 0);
      if (!conv || b2[0] - a[0] < .08 || d[1] - a[1] < .04 || c[1] - b2[1] < .04) geo = .15;
      else if (b2[0] - a[0] < .14) geo = .6;
      const area = Math.abs((a[0] * b2[1] - b2[0] * a[1]) + (b2[0] * c[1] - c[0] * b2[1]) + (c[0] * d[1] - d[0] * c[1]) + (d[0] * a[1] - a[0] * d[1])) / 2;
      if (area < .04) geo *= .5; dbg.area = Math.round(area * 100) / 100;
    }
    // drinnen? Himmel oben im Bild (blau, oder sehr hell und glatt) spricht für ein Foto von draußen
    let skyN = 0, skyT = 0;
    for (let y = 1; y < H * .24; y += 2) for (let x = 1; x < W - 1; x += 2) {
      const i = y * W + x, j = i * 4, r0 = px[j], g1 = px[j + 1], b0 = px[j + 2], L = g0[i]; skyT++;
      if ((b0 > r0 + 14 && b0 >= g1 - 6 && L > .42) || (L > .88 && mag[i] < .01)) skyN++;
    }
    const sky = skyT ? skyN / skyT : 0; dbg.sky = Math.round(sky * 100) / 100;
    const indoor = 1 - Math.max(0, Math.min(1, (sky - .14) / .3)) * .9;
    // Kamerahöhe aus der Breite der Rückwand (Plan) – Handyfotos entstehen meist aus 1,1–1,8 m
    let hp = 1, hEst = H_CAM;
    const walls = (opt.walls || (wallW ? [wallW] : [])).filter(v => v > .5);
    if (Ls && Rs && xR > xL) {
      const wu = xR - xL;
      if (walls.length) { let best = 0; walls.forEach(Lw => { const h = Lw / wu, q = Math.exp(-Math.pow(Math.log(h / 1.45) / .33, 2)); if (q > best) { best = q; hEst = h; } }); hp = .25 + .75 * best; }
      else { const ww = wu * H_CAM; hp = ww < 1.4 || ww > 9 ? .35 : 1; }
    }
    const dBack = zB * hEst, dMax = (opt.walls && opt.walls.length ? Math.max(...opt.walls) : 6.5) + 1.6;
    if (dBack > dMax) hp *= Math.exp(-Math.pow((dBack - dMax) / 2.2, 2)); if (dBack < .9) hp *= .4;
    dbg.h = Math.round(hEst * 100) / 100; dbg.dBack = Math.round(dBack * 10) / 10;
    const conf = Math.max(0, Math.min(1, sup * geo * indoor * hp * (dbg.noFrame ? .6 : 1)));
    dbg.cs = [sup, geo, indoor, hp].map(v => Math.round(v * 100) / 100);
    dbg.ms = Date.now() - t0;
    const kind = conf >= .55 ? 'ok' : conf >= .3 ? 'check' : sky > .3 ? 'outdoor' : 'none';
    const why = { ok: 'Boden und Wände erkannt.', check: 'Teilweise erkannt – bitte kurz prüfen.', outdoor: 'Das sieht nach einem Foto von draußen aus.', none: 'Keine klaren Bodenkanten gefunden.' }[kind];
    // Kamera und Raumlinien für die Vorschau (Einrasten, Bodenraster): Richtungen im Kamera-Raum, Maßstab Kamerahöhe = 1
    const camOut = { up, Z, X, f: f / L0, W, H, xL, xR, zB, zF, h: hEst, sides: { L: !!Ls, R: !!Rs, B: !!back || zE != null } };
    return { ok: !!pts, conf, kind, pts, mm: Math.round(mmUse * 10) / 10, why, dbg, cam: camOut, segs: opt.withSegs ? segs.map(s => [s.x1 / W, s.y1 / H, s.x2 / W, s.y2 / H, inZ(s) ? 'z' : inX(s) ? 'x' : vertIn(s) ? 'v' : '']) : null,
      lines: { L: Ls ? Ls.list.map(s => [s.x1 / W, s.y1 / H, s.x2 / W, s.y2 / H]) : [], R: Rs ? Rs.list.map(s => [s.x1 / W, s.y1 / H, s.x2 / W, s.y2 / H]) : [], B: back ? back.list.map(s => [s.x1 / W, s.y1 / H, s.x2 / W, s.y2 / H]) : [] } };
  }
  // Bild verkleinern (lange Seite ~640 px) und im Worker rechnen – Ausweichweg: direkt im Hauptfaden
  function pixels(src, max) {
    const W0 = src.naturalWidth || src.width, H0 = src.naturalHeight || src.height, r = Math.min(1, max / Math.max(W0, H0)), w = Math.max(16, Math.round(W0 * r)), h = Math.max(16, Math.round(H0 * r));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, w, h);
    return { px: x.getImageData(0, 0, w, h).data, w, h };
  }
  let wk = null;
  function worker() {
    if (wk !== null) return wk;
    try { const code = `const core=${core.toString()};onmessage=e=>{const d=e.data;let r=null;try{r=core(d.px,d.w,d.h,d.opt)}catch(er){r={ok:false,err:String(er&&er.message||er)}}postMessage(r)}`; wk = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))); } catch (e) { wk = false; }
    return wk;
  }
  function detect(src, opt = {}) {
    const { px, w, h } = pixels(src, opt.max || 900);
    const run = () => core(px, w, h, opt);
    const W2 = opt.noWorker ? false : worker();
    if (!W2) return new Promise(res => setTimeout(() => { try { res(run()); } catch (e) { res({ ok: false, err: String(e && e.message || e) }); } }, 0));
    return new Promise(res => {
      let done = false; const tm = setTimeout(() => { if (done) return; done = true; try { res(run()); } catch (e) { res({ ok: false }); } }, 6000);
      W2.onmessage = e => { if (done) return; done = true; clearTimeout(tm); res(e.data); };
      W2.onerror = () => { if (done) return; done = true; clearTimeout(tm); wk = false; try { res(run()); } catch (e) { res({ ok: false }); } };
      W2.postMessage({ px, w, h, opt: Object.assign({}, opt, { noWorker: undefined }) });
    });
  }
  // Punkte neu ableiten, wenn eine Seitenwand nicht erkannt wurde und sich die Wandlänge (andere Wand im Plan) ändert
  function ptsFrom(cam, wallW) {
    if (!cam) return null;
    const { up, Z, X, W, H, sides } = cam, hc = cam.h || 1.45, L = Math.max(W, H), fp = cam.f * L, cx = W / 2, cy = H / 2;
    let xL = sides.L ? cam.xL : null, xR = sides.R ? cam.xR : null; const ww = (wallW || 3) / hc;
    if (xL == null && xR != null) xL = xR - ww; if (xR == null && xL != null) xR = xL + ww; if (xL == null) { xL = -ww * .45; xR = ww * .55; }
    const proj = (x, z) => { const P = [X[0] * x + Z[0] * z - up[0], X[1] * x + Z[1] * z - up[1], X[2] * x + Z[2] * z - up[2]]; if (P[2] < .05) return null; return [(P[0] / P[2] * fp + cx) / W, (P[1] / P[2] * fp + cy) / H]; };
    const zB = cam.zB, inside = p => p && p[1] <= .94 && p[0] >= .03 && p[0] <= .97;
    let zF = zB * .55; for (let k = 0; k < 40 && zF > .5; k++) { if (!inside(proj(xL, zF * .97)) || !inside(proj(xR, zF * .97))) break; zF *= .97; }
    for (let k = 0; k < 60 && zF < zB * .9; k++) { if (inside(proj(xL, zF)) && inside(proj(xR, zF))) break; zF *= 1.03; }
    const pts = [proj(xL, zB), proj(xR, zB), proj(xR, zF), proj(xL, zF)]; return pts.some(q => !q) ? null : pts;
  }
  G.KPRaum = { detect, core, ptsFrom, version: 'r2' };
})(typeof window !== 'undefined' ? window : self);
