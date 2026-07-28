/* ═════════════════════════════════════════════════════════════════
   40 · the build itself
   Every construction phase pushes instances with its own time window,
   in realistic sequence: layout → erosion control → excavation →
   underground (inspected before backfill) → footings/rebar/forms →
   stem walls → base/vapour/radiant/slab → framing → roof structure →
   dry-in → windows → MEP rough-in → insulation/drywall → interior,
   with exterior masonry overlapping the interior tail, then sitework.
   ═════════════════════════════════════════════════════════════════ */

/* ═══ 01 · SURVEY & LAYOUT ═══ */
(function survey() {
  const A = PH.survey.t0 + .002, B = PH.survey.t1;
  const X0 = PH.clearing.t0 + .012, X1 = PH.excavate.t0;
  const corners = [[-104, -74], [96, -74], [96, 78], [-104, 78]];
  corners.forEach((c, i) => {
    const s = seq(A, A + (B - A) * .3, 4)(i);
    P('stake', {
      p: [c[0], 0, c[1]], s: [.34, 4.4, .34], t0: s[0], t1: s[1], l: 'site', a: 'rise',
      m: { n: 'Property corner monument', s: 'site', d: 'Set by the licensed surveyor from the recorded plat. All building layout is dimensioned from these monuments.' }
    });
  });
  const box = [[-35, -27], [61, -27], [61, 41], [-35, 41]];
  const perim = [];
  for (let i = 0; i < 4; i++) {
    const a = box[i], b = box[(i + 1) % 4];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const cnt = Math.round(L / 11);
    for (let k = 0; k < cnt; k++) perim.push([lerp(a[0], b[0], k / cnt), lerp(a[1], b[1], k / cnt), i]);
  }
  const sq = seq(A + (B - A) * .18, B, perim.length);
  perim.forEach((pt, i) => {
    const s = sq(i);
    P('stake', {
      p: [pt[0], 1.4, pt[1]], s: [.26, 3.4, .26], t0: s[0], t1: s[1], x0: X0, x1: X0 + .012,
      l: 'site', a: 'rise',
      m: { n: 'Batter board & offset hub', s: 'site', d: 'Layout hubs hold the building lines outside the excavation so corners can be re‑strung after the dirt work.' }
    });
    P('stake', {
      p: [pt[0], 3.0, pt[1]], s: [1.9, .18, .18], r: [0, pt[2] % 2 ? Math.PI / 2 : 0, 0],
      t0: s[0], t1: s[1], x0: X0, x1: X0 + .012, l: 'site', a: 'grow'
    });
  });
  for (let i = 0; i < 4; i++) {
    const a = box[i], b = box[(i + 1) % 4];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const horiz = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
    P('strline', {
      p: [(a[0] + b[0]) / 2, 3.05, (a[1] + b[1]) / 2],
      s: horiz ? [L, .06, .06] : [.06, .06, L],
      t0: A + (B - A) * .55, t1: B, x0: X0, x1: X0 + .012, l: 'site',
      a: 'ext', ax: horiz ? 'x' : 'z', sg: 1,
      m: { n: 'Building layout line', s: 'site', d: 'Mason\'s line pulled between batter boards. Excavation and footing forms are dimensioned off these lines.' }
    });
  }
  [-8, 8, 18, 30].forEach((x, i) => {
    const s = seq(A + (B - A) * .5, B, 4)(i);
    P('strline', {
      p: [x, 2.9, 7], s: [.05, .05, 68], t0: s[0], t1: s[1], x0: X0, x1: X0 + .012, l: 'site',
      a: 'ext', ax: 'z', sg: -1, m: { n: 'Structural gridline', s: 'site', d: 'Column and bearing‑wall grid transferred from sheet S‑101.' }
    });
  });
})();

/* ═══ 02 · SITE PROTECTION & CLEARING ═══ */
(function siteprep() {
  const A = PH.clearing.t0, B = PH.clearing.t0 + (PH.clearing.t1 - PH.clearing.t0) * .35;
  const OUT = PH.sitework.t0 + .012, OUT1 = PH.sitework.t0 + .026;
  const pts = [[-88, -58], [82, -58], [82, 66], [-88, 66]];
  let segs = [];
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), cnt = Math.round(L / 8);
    for (let k = 0; k < cnt; k++) {
      const t = k / cnt;
      segs.push([lerp(a[0], b[0], t + .5 / cnt), lerp(a[1], b[1], t + .5 / cnt), L / cnt,
      Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1])]);
    }
  }
  const sq = seq(A, B, segs.length);
  segs.forEach((s, i) => {
    const w = sq(i);
    P('wrap', {
      p: [s[0], 1.4, s[1]], s: s[3] ? [s[2] * .96, 2.6, .1] : [.1, 2.6, s[2] * .96],
      t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'site', a: 'rise',
      m: { n: 'Silt fence', s: 'site', d: 'Erosion and sediment control required by the SWPPP. Trenched in 6" and staked before any ground is broken.' }
    });
  });
  for (let i = 0; i < 22; i++) {
    const w = seq(A, B, 22)(i);
    P('gravel', {
      p: [-78 + (i % 11) * 5, .3, -30 + Math.floor(i / 11) * 7], s: [5.2, .9, 7.2],
      t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'site', a: 'rise',
      m: { n: 'Stabilized construction entrance', s: 'site', d: '3" clean rock over filter fabric keeps track‑out off the county road.' }
    });
  }
})();

/* ═══ 03 · EXCAVATION ARTEFACTS ═══ */
(function excav() {
  const A = PH.excavate.t0;
  const bed = seq(PH.underground.t0, PH.underground.t0 + .012, TRENCH.length);
  TRENCH.forEach((t, i) => {
    const L = Math.hypot(t[2] - t[0], t[3] - t[1]);
    const ang = Math.atan2(t[2] - t[0], t[3] - t[1]);
    const w = bed(i);
    P('gravel', {
      p: [(t[0] + t[2]) / 2, groundY((t[0] + t[2]) / 2, (t[1] + t[3]) / 2) + .3, (t[1] + t[3]) / 2],
      s: [t[4] * 1.5, .55, L], r: [0, ang, 0],
      t0: w[0], t1: w[1], l: 'excavation', a: 'ext', ax: 'z', sg: -1,
      m: { n: 'Trench bedding', s: 'excavation', d: 'Sand bedding shaped to support the pipe barrel continuously. Inspected before pipe is laid.' }
    });
  });
  for (let i = 0; i < 16; i++) {
    const x = -30 + (i % 8) * 10, z = -20 + Math.floor(i / 8) * 40;
    const w = seq(A + .004, A + .02, 16)(i);
    P('stake', {
      p: [x, -3.5, z], s: [.2, 2.6, .2], t0: w[0], t1: w[1], x0: PH.foundation.t0 + .02, x1: PH.foundation.t0 + .03,
      l: 'excavation', a: 'rise',
      m: { n: 'Grade stake', s: 'excavation', d: 'Blue‑topped to the bottom‑of‑footing elevation shot from the benchmark with a rotary laser.' }
    });
  }
})();

/* ═══ 04 · UNDERGROUND UTILITIES ═══ */
(function underground() {
  const A = PH.underground.t0 + .004, B = PH.underground.t1;
  const q = seq(A, A + (B - A) * .55, 8);
  function pipe(g, ax, a0, a1, f1, f2, dia, w, meta, layer) {
    const L = Math.abs(a1 - a0), mid = (a0 + a1) / 2;
    const o = { s: [dia, L, dia], t0: w[0], t1: w[1], l: layer || 'plumbing', a: 'ext', ax: 'y', sg: a1 > a0 ? -1 : 1, m: meta };
    if (ax === 'x') { o.p = [mid, f1, f2]; o.r = [0, 0, Math.PI / 2]; o.sg = a1 > a0 ? -1 : 1; }
    else if (ax === 'z') { o.p = [f1, f2, mid]; o.r = [Math.PI / 2, 0, 0]; }
    else { o.p = [f1, mid, f2]; }
    P(g, o);
  }
  const mDWV = { n: '4" ABS drain, waste & vent', s: 'plumbing', d: 'Under‑slab sanitary main sloped 1/4" per foot to the septic tank. Tested on a 10‑ft water column before backfill.' };
  const mWTR = { n: '1½" water service', s: 'plumbing', d: 'PE service from the meter to the interior manifold, bedded in sand below frost depth with a tracer wire.' };
  const mCON = { n: 'Electrical service conduit', s: 'electrical', d: '4" schedule‑40 PVC from the transformer to the meter main, with a 2" spare and a low‑voltage sleeve.' };

  pipe('abs', 'x', -28, 20, -3.9, 30, .34, q(0), mDWV);
  pipe('abs', 'z', 30, 44, 20, -4.1, .34, q(1), mDWV);
  pipe('abs', 'z', -18, 30, 4, -3.7, .3, q(2), mDWV);
  pipe('abs', 'x', 4, 26, -3.6, -6, .3, q(2), mDWV);
  pipe('abs', 'z', -22, 4, -14, -3.55, .26, q(3), mDWV);
  pipe('pvc', 'x', -108, -44, -3.6, 14, .2, q(1), mWTR);
  pipe('pvc', 'z', 14, -6, -44, -3.6, .2, q(2), mWTR);
  pipe('pvc', 'x', -44, -26, -3.5, -6, .2, q(3), mWTR);
  pipe('conduit', 'x', -108, -44, -4.1, 11, .34, q(2), mCON, 'electrical');
  pipe('conduit', 'z', 11, -4, -44, -4.1, .34, q(3), mCON, 'electrical');
  pipe('conduit', 'x', -44, -30, -4, -4, .34, q(4), mCON, 'electrical');
  pipe('conduit', 'x', -108, -44, -4.35, 17, .18, q(3), { n: 'Low‑voltage sleeve', s: 'electrical', d: 'Spare conduit for fiber, security and irrigation control so the driveway never has to be cut.' }, 'electrical');
  pipe('pvc', 'x', 56, 96, -3.4, 8, .26, q(5), { n: 'Gas service', s: 'plumbing', d: 'Poly gas main to the meter set with tracer wire and warning tape 12" above.' });

  P('conc', {
    p: [68, -2.4, 54], s: [11, 5.5, 6], t0: q(4)[0], t1: q(4)[1], l: 'plumbing', a: 'drop',
    m: { n: '1,500 gal septic tank', s: 'plumbing', d: 'Two‑compartment precast tank with effluent filter, set on bedding rock and grouted at the inlet and outlet.' }
  });
  for (let i = 0; i < 5; i++) {
    const w = seq(q(5)[0], B, 5)(i);
    pipe('abs', 'x', 74, 106, -3.2, 46 + i * 7, .3, w,
      { n: 'Leach field lateral', s: 'plumbing', d: 'Perforated lateral in a rock trench, level to within 1/8". Field sized from the percolation test.' });
  }
  const stubs = [[-14, 8], [-14, -6], [2, 12], [12, -14], [22, 6], [-24, -16], [-2, 30], [44, -12]];
  stubs.forEach((s, i) => {
    const w = seq(A + (B - A) * .5, B, stubs.length)(i);
    P('abs', {
      p: [s[0], -1.4, s[1]], s: [.3, 5, .3], t0: w[0], t1: w[1], l: 'plumbing', a: 'ext', ax: 'y', sg: -1,
      m: { n: 'Waste riser', s: 'plumbing', d: 'Stubbed above the slab at each fixture group, capped and protected until the rough‑in.' }
    });
  });
})();

/* ═══ 05 · FOOTINGS, STEM WALLS, SLAB ═══ */
(function concreteWork() {
  const A = PH.foundation.t0, B = PH.foundation.t1;
  const fA = A + .004, fB = A + (B - A) * .34;
  const rA = A + (B - A) * .12, rB = A + (B - A) * .3;
  const sA = A + (B - A) * .40, sB = A + (B - A) * .86;
  const formA = A + (B - A) * .06, formOut = A + (B - A) * .9;

  const extWalls = WALLS.filter(w => w.ext && w.y0 === FF);
  let fSegs = [], sSegs = [];
  extWalls.forEach(w => {
    const cnt = Math.max(2, Math.round(w.L / 7));
    for (let i = 0; i < cnt; i++) {
      const s0 = w.L * i / cnt, s1 = w.L * (i + 1) / cnt, mid = (s0 + s1) / 2;
      const p = ptOn(w, mid);
      fSegs.push({ p, len: (s1 - s0) * .99, ax: Math.abs(w.ux) > .5, w });
      sSegs.push({ p, len: (s1 - s0) * .99, ax: Math.abs(w.ux) > .5, w });
    }
  });
  const fq = seq(fA, fB, fSegs.length), sq = seq(sA, sB, sSegs.length);
  const mFoot = { n: 'Continuous spread footing', s: 'concrete', d: '24" × 12" footing with two #5 bars continuous and corner bars lapped 40 diameters. Placed on undisturbed soil verified by the geotech.' };
  const mStem = { n: 'Concrete stem wall', s: 'concrete', d: '10" wall from the footing to finish floor with vertical dowels at 32" and anchor bolts at 48". Damp‑proofed on the exterior face.' };
  fSegs.forEach((f, i) => {
    const w = fq(i);
    P('conc', {
      p: [f.p[0], -3.0, f.p[1]], s: f.ax ? [f.len, 1.1, 2.4] : [2.4, 1.1, f.len],
      t0: w[0], t1: w[1], l: 'concrete', a: 'rise', m: mFoot
    });
    const rw = seq(rA, rB, fSegs.length)(i);
    for (let k = 0; k < 2; k++) {
      P('rebar', {
        p: [f.p[0] + (f.ax ? 0 : (k ? .7 : -.7)), -2.75, f.p[1] + (f.ax ? (k ? .7 : -.7) : 0)],
        s: [.14, f.len, .14], r: f.ax ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0],
        t0: rw[0], t1: rw[1], l: 'concrete', a: 'ext', ax: 'y', sg: -1,
        m: { n: '#5 continuous reinforcement', s: 'concrete', d: 'Grade 60 bar chaired 3" clear of the earth. Inspected and photographed before the pour.' }
      });
    }
  });
  sSegs.forEach((f, i) => {
    const w = sq(i);
    P('conc', {
      p: [f.p[0], -0.72, f.p[1]], s: f.ax ? [f.len, 3.55, 1.0] : [1.0, 3.55, f.len],
      t0: w[0], t1: w[1], l: 'concrete', a: 'rise', m: mStem
    });
    for (let k = 0; k < 2; k++) {
      P('form', {
        p: [f.p[0] + (f.ax ? 0 : (k ? .62 : -.62)), -0.6, f.p[1] + (f.ax ? (k ? .62 : -.62) : 0)],
        s: f.ax ? [f.len, 4.1, .16] : [.16, 4.1, f.len],
        t0: seq(formA, sA, sSegs.length)(i)[0], t1: seq(formA, sA, sSegs.length)(i)[1],
        x0: formOut + (i / sSegs.length) * .006, x1: formOut + .012 + (i / sSegs.length) * .006,
        l: 'concrete', a: 'rise',
        m: { n: 'Wall formwork', s: 'concrete', d: 'Modular steel‑framed panels with snap ties and walers. Stripped once the concrete reaches design strength.' }
      });
    }
    if (i % 2 === 0) P('rebar', {
      p: [f.p[0], 1.35, f.p[1]], s: [.11, 1.5, .11], t0: w[0] + .002, t1: w[1] + .002, l: 'concrete', a: 'ext', ax: 'y', sg: -1,
      m: { n: '5/8" anchor bolt', s: 'concrete', d: 'Wet‑set at 48" on center and within 12" of every plate end, with 3" square plate washers.' }
    });
  });
  [[8, 16], [-8, 16], [18, 16], [8, 0]].forEach((c, i) => {
    const w = seq(fA, fB, 4)(i);
    P('conc', {
      p: [c[0], -3.1, c[1]], s: [4, 1.4, 4], t0: w[0], t1: w[1], l: 'concrete', a: 'rise',
      m: { n: 'Isolated column footing', s: 'concrete', d: '4\'×4\'×14" pad with a mat of #5 each way, carrying the steel column above the great‑room opening.' }
    });
  });

  /* base rock, vapour barrier, radiant tubing, slab */
  const bA = PH.slab.t0 + .004, bB = PH.slab.t0 + (PH.slab.t1 - PH.slab.t0) * .34;
  const cA = PH.slab.t0 + (PH.slab.t1 - PH.slab.t0) * .46, cB = PH.slab.t1;
  let tiles = [];
  PLATES.forEach(pl => {
    for (let x = pl[0]; x < pl[2] - .1; x += 6.2)
      for (let z = pl[1]; z < pl[3] - .1; z += 6.2) {
        const w = Math.min(6.2, pl[2] - x), dpt = Math.min(6.2, pl[3] - z);
        tiles.push([x + w / 2, z + dpt / 2, w * .99, dpt * .99]);
      }
  });
  tiles.sort((a, b) => (a[0] + a[1] * .4) - (b[0] + b[1] * .4));
  const bq = seq(bA, bB, tiles.length), cq = seq(cA, cB, tiles.length);
  tiles.forEach((t, i) => {
    const w = bq(i);
    P('gravel', {
      p: [t[0], .35, t[1]], s: [t[2], 1.0, t[3]], t0: w[0], t1: w[1], l: 'concrete', a: 'rise',
      m: { n: 'Compacted base rock', s: 'concrete', d: '4" of 3/4" clean rock over compacted subgrade, screeded flat to receive the vapour barrier.' }
    });
    P('wrap', {
      p: [t[0], .88, t[1]], s: [t[2], .04, t[3]], t0: w[0] + .0015, t1: w[1] + .0015, l: 'concrete', a: 'grow',
      m: { n: '10 mil vapour barrier', s: 'concrete', d: 'Sealed and taped at all laps and penetrations to stop moisture and soil gas below the slab.' }
    });
    if (i % 2 === 0) P('pvc', {
      p: [t[0], 1.02, t[1]], s: [.09, t[3], .09], r: [Math.PI / 2, 0, 0],
      t0: w[0] + .003, t1: w[1] + .003, l: 'plumbing', a: 'ext', ax: 'y', sg: -1,
      m: { n: 'Radiant floor tubing', s: 'plumbing', d: '1/2" PEX at 9" on center, zoned by room and pressure‑tested at 60 psi while the slab is placed.' }
    });
    const cw = cq(i);
    P('conc', {
      p: [t[0], 1.22, t[1]], s: [t[2], .62, t[3]], t0: cw[0], t1: cw[1], l: 'concrete', a: 'rise',
      m: { n: '4" structural slab', s: 'concrete', d: '4,000 psi mix with fibre reinforcement and #4 at 18" each way, laser‑screeded and power‑troweled, then saw‑cut at control joints.' }
    });
  });
})();

/* ═══ 06 · FLOOR SYSTEM & WALL FRAMING ═══ */
(function framing() {
  const A = PH.framing.t0, B = PH.framing.t1, S = B - A;
  const L0 = [A + S * .04, A + S * .52];
  const FL = [A + S * .48, A + S * .68];
  const L1 = [A + S * .66, A + S * .97];

  const mStud = { n: '2×6 stud wall', s: 'framing', d: 'Douglas fir studs at 16" on center with a single bottom plate and double top plate. Walls are built flat on the deck, sheathed, then stood and braced plumb.' };
  const mPlate = { n: 'Plate', s: 'framing', d: 'Pressure‑treated sill on the concrete over a sill seal, then bottom and double top plates lapped at every corner and intersection.' };
  const mHdr = { n: 'Structural header', s: 'framing', d: 'LVL header sized on sheet S‑301 for the span and the load above, carried by jack studs at each end.' };

  const l0 = WALLS.filter(w => w.y0 === FF), l1 = WALLS.filter(w => w.y0 > FF);
  function frameWalls(list, win) {
    const q = seq(win[0], win[1], list.length, .30);
    list.forEach((w, wi) => {
      const t = q(wi), top = w.y0 + w.h, th = w.t;
      const sub = seq(t[0], t[1], Math.max(4, Math.round(w.L / 6)), .55);
      const hit = s => sub(Math.min(Math.round(s / 6), Math.max(3, Math.round(w.L / 6) - 1)));
      const mid = ptOn(w, w.L / 2), ax = Math.abs(w.ux) > .5;
      [[w.y0 + .075, .15, 'sill'], [w.y0 + .225, .15, 'btm'], [top - .225, .15, 'tp1'], [top - .075, .15, 'tp2']].forEach(pl => {
        P('lumber', {
          p: [mid[0], pl[0], mid[1]], s: ax ? [w.L, pl[1], th] : [th, pl[1], w.L],
          t0: t[0] + (pl[2] === 'sill' ? 0 : pl[2] === 'btm' ? .0006 : (t[1] - t[0]) * .84),
          t1: t[0] + (pl[2] === 'sill' || pl[2] === 'btm' ? (t[1] - t[0]) * .3 : (t[1] - t[0]) * .99),
          l: 'framing', a: 'ext', ax: ax ? 'x' : 'z', sg: -1, m: mPlate
        });
      });
      const n = Math.max(2, Math.floor((w.L - .5) / 1.333));
      for (let i = 0; i <= n; i++) {
        const s = .3 + i * (w.L - .6) / n;
        const pt = ptOn(w, s), hw = hit(s);
        const op = inOpenSpan(w, s);
        if (!op) {
          P('lumber', {
            p: [pt[0], w.y0 + .3 + (w.h - .6) / 2, pt[1]], s: ax ? [.21, w.h - .6, th] : [th, w.h - .6, .21],
            t0: hw[0], t1: hw[1], l: 'framing', a: 'rise', m: mStud
          });
        } else {
          if (op[2] > .4) P('lumber', {
            p: [pt[0], w.y0 + .3 + (op[2] - .3) / 2, pt[1]], s: ax ? [.21, Math.max(.3, op[2] - .3), th] : [th, Math.max(.3, op[2] - .3), .21],
            t0: hw[0], t1: hw[1], l: 'framing', a: 'rise',
            m: { n: 'Cripple stud', s: 'framing', d: 'Short studs under the rough sill carrying the window load down to the plate.' }
          });
          if (top - op[3] - w.y0 > 1.6) P('lumber', {
            p: [pt[0], w.y0 + op[3] + 1.2 + (w.h - op[3] - 1.5) / 2, pt[1]],
            s: ax ? [.21, Math.max(.3, w.h - op[3] - 1.5), th] : [th, Math.max(.3, w.h - op[3] - 1.5), .21],
            t0: hw[0], t1: hw[1], l: 'framing', a: 'rise',
            m: { n: 'Cripple stud', s: 'framing', d: 'Studs above the header transferring roof and floor load into the header below.' }
          });
        }
      }
      w.ops.forEach(op => {
        const span = op[1] - op[0], c = ptOn(w, (op[0] + op[1]) / 2), hw = hit((op[0] + op[1]) / 2);
        P('beam', {
          p: [c[0], w.y0 + op[3] + .6, c[1]], s: ax ? [span + 1.2, 1.2, th * .95] : [th * .95, 1.2, span + 1.2],
          t0: hw[0] + .0008, t1: hw[1] + .0008, l: 'framing', a: 'drop', h: 14, m: mHdr
        });
        if (op[2] > .4) P('lumber', {
          p: [c[0], w.y0 + op[2] - .07, c[1]], s: ax ? [span, .15, th] : [th, .15, span],
          t0: hw[0] + .0008, t1: hw[1] + .0008, l: 'framing', a: 'grow',
          m: { n: 'Rough sill', s: 'framing', d: 'Doubled sill setting the window opening height, checked against the shop drawings before the units arrive.' }
        });
        [op[0], op[1]].forEach(sd => {
          const pt = ptOn(w, sd);
          P('lumber', {
            p: [pt[0], w.y0 + .3 + (op[3] - .3) / 2, pt[1]], s: ax ? [.26, Math.max(.5, op[3] - .3), th] : [th, Math.max(.5, op[3] - .3), .26],
            t0: hw[0], t1: hw[1], l: 'framing', a: 'rise',
            m: { n: 'Jack & king studs', s: 'framing', d: 'Jacks carry the header; full‑height kings nail off beside them to hold the opening square.' }
          });
        });
      });
    });
  }
  frameWalls(l0, L0);
  frameWalls(l1, L1);

  /* second floor joist system over the tower */
  const jn = Math.floor((TOWER.x1 - TOWER.x0) / 1.333);
  const jq = seq(FL[0], FL[1], jn, .4);
  for (let i = 0; i <= jn; i++) {
    const x = TOWER.x0 + .5 + i * (TOWER.x1 - TOWER.x0 - 1) / jn, t = jq(Math.min(i, jn - 1));
    P('lumber', {
      p: [x, TOWER.plate - .8, (TOWER.z0 + TOWER.z1) / 2], s: [.24, 1.2, TOWER.z1 - TOWER.z0],
      t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 10,
      m: { n: 'TJI floor joist', s: 'framing', d: '14" engineered I‑joists at 16" on center with rim board and squash blocks at bearing points.' }
    });
  }
  for (let x = TOWER.x0; x < TOWER.x1 - .1; x += 8)
    for (let z = TOWER.z0; z < TOWER.z1 - .1; z += 4) {
      const w = Math.min(8, TOWER.x1 - x), dp = Math.min(4, TOWER.z1 - z);
      const t = seq(FL[0] + (FL[1] - FL[0]) * .5, FL[1], 12)((Math.round((x - TOWER.x0) / 8) + Math.round((z - TOWER.z0) / 4)) % 12);
      P('osb', {
        p: [x + w / 2, TOWER.plate - .1, z + dp / 2], s: [w * .98, .19, dp * .98],
        t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 6,
        m: { n: '3/4" T&G subfloor', s: 'framing', d: 'Glued and screwed to the joists on a staggered pattern to keep the floor silent.' }
      });
    }
  /* great-room steel & glulam */
  [[8, 16], [-8, 16], [18, 16]].forEach((c, i) => {
    const t = seq(L0[0] + (L0[1] - L0[0]) * .55, L0[1], 3)(i);
    P('steel', {
      p: [c[0], FF + 6.2, c[1]], s: [.85, 12.4, .85], t0: t[0], t1: t[1], l: 'framing', a: 'rise',
      m: { n: 'HSS steel column', s: 'framing', d: 'Hollow structural column on a base plate and anchor rods, carrying the beam over the twenty‑four foot glass opening.' }
    });
  });
  P('beam', {
    p: [5, FF + 13.1, 16], s: [28, 1.9, .9], t0: L0[1] - .004, t1: L0[1] + .004, l: 'framing', a: 'drop', h: 18,
    m: { n: '5¼×18 glulam ridge beam', s: 'framing', d: 'Set by telehandler onto the steel columns. This single member replaces the bearing wall that would otherwise split the great room.' }
  });

  /* wall sheathing (also the shear diaphragm) */
  const shA = PH.roofstruct.t0 + .002, shB = PH.roofstruct.t0 + (PH.roofstruct.t1 - PH.roofstruct.t0) * .62;
  const extAll = WALLS.filter(w => w.ext);
  let panels = [];
  extAll.forEach(w => {
    const ax = Math.abs(w.ux) > .5, cols = Math.ceil(w.L / 4), rows = Math.ceil(w.h / 4);
    for (let cI = 0; cI < cols; cI++) for (let r = 0; r < rows; r++) {
      const s = cI * 4 + Math.min(4, w.L - cI * 4) / 2, y = w.y0 + r * 4 + Math.min(4, w.h - r * 4) / 2;
      if (openingAt(w, s, y)) continue;
      const pt = ptOn(w, s, w.t / 2 + .09);
      panels.push({ p: [pt[0], y, pt[1]], w: Math.min(4, w.L - cI * 4) * .98, h: Math.min(4, w.h - r * 4) * .98, ax });
    }
  });
  const pq = seq(shA, shB, panels.length, .2);
  panels.forEach((pn, i) => {
    const t = pq(i);
    P('osb', {
      p: pn.p, s: pn.ax ? [pn.w, pn.h, .16] : [.16, pn.h, pn.w], t0: t[0], t1: t[1], l: 'framing', a: 'grow',
      m: { n: '7/16" OSB shear sheathing', s: 'framing', d: 'Nailed 6" on the edges and 12" in the field per the shear schedule. This is what makes the walls resist wind and seismic load.' }
    });
  });
})();

/* ═══ 07 · ROOF STRUCTURE, DECK, ROOFING ═══ */
(function roofBuild() {
  const A = PH.roofstruct.t0, B = PH.roofstruct.t1, S = B - A;
  const TR = [A + S * .02, A + S * .58], DK = [A + S * .5, A + S * .98];
  const RA = PH.roofing.t0, RB = PH.roofing.t1;
  const mTruss = { n: 'Engineered roof truss', s: 'framing', d: 'Shop‑fabricated trusses at 24" on center, flown in by telehandler, set to the layout and braced before the ties are nailed.' };

  ROOFS.forEach((rf, ri) => {
    const slope = rf.rise / rf.half, ang = Math.atan(slope);
    const nT = Math.max(3, Math.round((rf.x1 - rf.x0) / 2));
    const tq = seq(TR[0] + ri * .001, TR[1], nT, .22);
    for (let i = 0; i <= nT; i++) {
      const x = rf.x0 + i * (rf.x1 - rf.x0) / nT, t = tq(Math.min(i, nT - 1));
      P('lumber', {
        p: [x, rf.plate + .2, rf.zc], s: [.23, .4, rf.half * 2], t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 20, m: mTruss
      });
      [1, -1].forEach(sg => {
        const len = Math.hypot(rf.half + rf.ov, (rf.half + rf.ov) * slope);
        P('lumber', {
          p: [x, rf.plate + .2 + (rf.rise - rf.ov * slope) / 2, rf.zc + sg * (rf.half + rf.ov) / 2],
          s: [.23, .55, len], r: [sg * ang, 0, 0], t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 20, m: mTruss
        });
        for (let k = 1; k <= 2; k++) {
          const u = k / 3, zz = rf.zc + sg * rf.half * u, hh = rf.rise * (1 - u);
          P('lumber', {
            p: [x, rf.plate + .2 + hh / 2, zz], s: [.2, hh, .3], t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 20,
            m: { n: 'Truss web', s: 'framing', d: 'Web members triangulate the truss so the chords work in pure tension and compression.' }
          });
        }
      });
      P('lumber', {
        p: [x, rf.plate + rf.rise - .2, rf.zc], s: [.2, .5, .5], t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 20, m: mTruss
      });
    }
    [rf.x0, rf.x1].forEach((gx, gi) => {
      if (rf.key === 'main' && gi === 0) return;
      const t = seq(TR[1] - S * .1, TR[1], 2)(gi);
      P('triLum', {
        p: [gx, rf.plate + rf.rise / 2 + .2, rf.zc], s: [rf.half * 2, rf.rise, .5], r: [0, Math.PI / 2, 0],
        t0: t[0], t1: t[1], l: 'framing', a: 'grow',
        m: { n: 'Gable end framing', s: 'framing', d: 'Balloon‑framed gable studs cut to the roof pitch, with continuous blocking to brace the end truss.' }
      });
      P('triOsb', {
        p: [gx + (gi ? .12 : -.12), rf.plate + rf.rise / 2 + .2, rf.zc], s: [rf.half * 2, rf.rise, .16], r: [0, Math.PI / 2, 0],
        t0: t[0] + .004, t1: t[1] + .004, l: 'framing', a: 'grow',
        m: { n: 'Gable sheathing', s: 'framing', d: 'Sheathed and wrapped like the walls below, with continuous soffit venting at the eaves.' }
      });
    });

    /* deck + roofing */
    const eaveY = rf.plate + .4 + rf.rise - (rf.half + rf.ov) * slope;
    const slopeLen = (rf.half + rf.ov) * Math.sqrt(1 + slope * slope);
    const rows = Math.max(3, Math.round(slopeLen / 3.4)), cols = Math.max(3, Math.round((rf.x1 - rf.x0 + rf.ov * 2) / 4));
    const dq = seq(DK[0] + ri * .001, DK[1], rows * cols, .12);
    const rq = seq(RA + ri * .004, RB - .004, rows * cols, .1);
    for (let sgI = 0; sgI < 2; sgI++) {
      const sg = sgI ? -1 : 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const u0 = (r + .5) / rows, uz = (rf.half + rf.ov) * u0;
        const y = rf.plate + .4 + rf.rise - uz * slope;
        const x = rf.x0 - rf.ov + (c + .5) * (rf.x1 - rf.x0 + rf.ov * 2) / cols;
        const idx = (rows - 1 - r) * cols + c;
        const dl = slopeLen / rows;
        const dt = dq(idx);
        P('osb', {
          p: [x, y, rf.zc + sg * uz], s: [(rf.x1 - rf.x0 + rf.ov * 2) / cols * .98, .17, dl * .99],
          r: [sg * ang, 0, 0], t0: dt[0], t1: dt[1], l: 'framing', a: 'grow',
          m: { n: 'Roof sheathing', s: 'framing', d: '5/8" sheathing with H‑clips at the unsupported edges, nailed to the engineered schedule.' }
        });
        const rt = rq(idx);
        P('memb', {
          p: [x, y + .24 * Math.cos(ang), rf.zc + sg * (uz + .24 * Math.sin(ang) * -1)],
          s: [(rf.x1 - rf.x0 + rf.ov * 2) / cols * .99, .06, dl], r: [sg * ang, 0, 0],
          t0: rt[0] - .004, t1: rt[1] - .004, l: 'roofing', a: 'grow',
          m: { n: 'Underlayment & ice shield', s: 'roofing', d: 'Self‑adhered membrane at the eaves, valleys and penetrations; synthetic underlayment over the field.' }
        });
        if (rf.mat === 'slate') {
          const per = 3;
          for (let k = 0; k < per; k++) {
            const yy = y + .36 * Math.cos(ang), zz = rf.zc + sg * (uz - .36 * Math.sin(ang));
            P('slate', {
              p: [x - (rf.x1 - rf.x0 + rf.ov * 2) / cols / 2 + ((k + .5) / per) * (rf.x1 - rf.x0 + rf.ov * 2) / cols, yy, zz],
              s: [(rf.x1 - rf.x0 + rf.ov * 2) / cols / per * .95, .12, dl * .99], r: [sg * ang, 0, 0],
              t0: rt[0], t1: rt[1], l: 'roofing', a: 'grow',
              m: { n: 'Natural slate course', s: 'roofing', d: 'Graduated slate laid to a 3" headlap on copper nails, each course chalked and gauged from the eave.' }
            });
          }
        } else {
          P('seam', {
            p: [x, y + .34 * Math.cos(ang), rf.zc + sg * (uz - .34 * Math.sin(ang))],
            s: [(rf.x1 - rf.x0 + rf.ov * 2) / cols * .97, .1, dl], r: [sg * ang, 0, 0],
            t0: rt[0], t1: rt[1], l: 'roofing', a: 'grow',
            m: { n: 'Standing seam panel', s: 'roofing', d: 'Roll‑formed 24 ga. panels with concealed clips, run full length from ridge to eave with no exposed fasteners.' }
          });
          for (let k = 0; k < 3; k++) P('seam', {
            p: [x - 1.6 + k * 1.6, y + .48 * Math.cos(ang), rf.zc + sg * (uz - .48 * Math.sin(ang))],
            s: [.13, .26, dl], r: [sg * ang, 0, 0], t0: rt[0], t1: rt[1], l: 'roofing', a: 'grow',
            m: { n: 'Standing seam rib', s: 'roofing', d: 'Mechanically seamed rib, 2" tall at 16" on center.' }
          });
        }
      }
      /* fascia & gutter */
      const fy = eaveY - .1;
      P('bronze', {
        p: [(rf.x0 + rf.x1) / 2, fy, rf.zc + sg * (rf.half + rf.ov)], s: [rf.x1 - rf.x0 + rf.ov * 2, .95, .3],
        t0: RA + (RB - RA) * .72, t1: RB, l: 'roofing', a: 'ext', ax: 'x', sg: -1,
        m: { n: 'Bronze fascia & gutter', s: 'roofing', d: 'Anodized bronze fascia with an integral concealed gutter draining to buried downspout leaders.' }
      });
      P('cedar', {
        p: [(rf.x0 + rf.x1) / 2, fy + .5, rf.zc + sg * (rf.half + rf.ov / 2)], s: [rf.x1 - rf.x0 + rf.ov * 2, .12, rf.ov],
        t0: PH.exteriorfin.t0 + .01, t1: PH.exteriorfin.t0 + .03, l: 'enclosure', a: 'grow',
        m: { n: 'Stained cedar soffit', s: 'enclosure', d: 'Clear vertical‑grain cedar with a continuous vent slot feeding the ventilated roof assembly.' }
      });
    }
  });

  /* tower flat roof */
  const dq = seq(DK[0], DK[1], 24, .2);
  let n = 0;
  for (let x = TOWER.x0; x < TOWER.x1 - .1; x += 6) for (let z = TOWER.z0; z < TOWER.z1 - .1; z += 6) {
    const w = Math.min(6, TOWER.x1 - x), dp = Math.min(6, TOWER.z1 - z), t = dq((n++) % 24);
    P('lumber', {
      p: [x + w / 2, TOWER.deck - .55, z + dp / 2], s: [w * .98, .9, dp * .98], t0: t[0], t1: t[1], l: 'framing', a: 'drop', h: 12,
      m: { n: 'Flat roof framing', s: 'framing', d: 'Tapered joists sloped 1/4" per foot to interior drains, with blocking at the parapet.' }
    });
    P('memb', {
      p: [x + w / 2, TOWER.deck + .06, z + dp / 2], s: [w, .12, dp],
      t0: RA + .002 + (n % 24) * .0004, t1: RA + .014 + (n % 24) * .0004, l: 'roofing', a: 'grow',
      m: { n: 'Single‑ply membrane', s: 'roofing', d: 'Fully adhered 60 mil TPO with heat‑welded seams and a 24" walk pad to the mechanical units.' }
    });
  }
  /* parapet */
  [[TOWER.x0, TOWER.z0, TOWER.x1, TOWER.z0], [TOWER.x0, TOWER.z1, TOWER.x1, TOWER.z1],
  [TOWER.x0, TOWER.z0, TOWER.x0, TOWER.z1], [TOWER.x1, TOWER.z0, TOWER.x1, TOWER.z1]].forEach((e, i) => {
    const ax = Math.abs(e[2] - e[0]) > Math.abs(e[3] - e[1]);
    P('lumber', {
      p: [(e[0] + e[2]) / 2, TOWER.deck + .9, (e[1] + e[3]) / 2],
      s: ax ? [Math.abs(e[2] - e[0]) + .5, 1.9, .55] : [.55, 1.9, Math.abs(e[3] - e[1]) + .5],
      t0: DK[1] - .004, t1: DK[1], l: 'framing', a: 'rise',
      m: { n: 'Parapet framing', s: 'framing', d: 'Framed parapet with a sloped cap and continuous through‑wall flashing behind the coping.' }
    });
    P('bronze', {
      p: [(e[0] + e[2]) / 2, TOWER.deck + 1.95, (e[1] + e[3]) / 2],
      s: ax ? [Math.abs(e[2] - e[0]) + .9, .2, .95] : [.95, .2, Math.abs(e[3] - e[1]) + .9],
      t0: PH.roofing.t1 - .008, t1: PH.roofing.t1, l: 'roofing', a: 'grow',
      m: { n: 'Bronze coping', s: 'roofing', d: 'Formed metal coping with cleats and standing seams at every joint.' }
    });
  });

  /* housewrap over the sheathing — before the windows go in */
  const wA = RA + (RB - RA) * .45, wB = RB;
  const extAll = WALLS.filter(w => w.ext);
  let wi = 0;
  const total = extAll.reduce((a, w) => a + Math.ceil(w.L / 8), 0);
  const wq = seq(wA, wB, total, .2);
  extAll.forEach(w => {
    const ax = Math.abs(w.ux) > .5, cols = Math.ceil(w.L / 8);
    for (let c = 0; c < cols; c++) {
      const s = c * 8 + Math.min(8, w.L - c * 8) / 2, pt = ptOn(w, s, w.t / 2 + .2);
      const t = wq(wi++);
      P('wrap', {
        p: [pt[0], w.y0 + w.h / 2, pt[1]],
        s: ax ? [Math.min(8, w.L - c * 8) * .99, w.h, .05] : [.05, w.h, Math.min(8, w.L - c * 8) * .99],
        t0: t[0], t1: t[1], l: 'enclosure', a: 'rise',
        m: { n: 'Weather‑resistive barrier', s: 'enclosure', d: 'Housewrap lapped shingle‑style over the flashing, taped at every seam. This is the drainage plane that keeps the wall dry.' }
      });
    }
  });
})();

/* ═══ 08 · WINDOWS & DOORS ═══ */
(function openings() {
  const A = PH.openings.t0 + .002, B = PH.openings.t1;
  let items = [];
  WALLS.filter(w => w.ext).forEach(w => w.ops.forEach(op => items.push({ w, op })));
  const q = seq(A, B, items.length, .3);
  items.forEach((it, i) => {
    const { w, op } = it, ax = Math.abs(w.ux) > .5;
    const c = ptOn(w, (op[0] + op[1]) / 2), span = op[1] - op[0], hh = op[3] - op[2];
    const t = q(i);
    const isDoor = op[4] === 'door', isGar = op[4] === 'garage';
    const meta = isGar
      ? { n: 'Insulated garage door', s: 'enclosure', d: 'Flush aluminium‑and‑glass sectional door on a low‑headroom track with a belt‑drive opener.' }
      : isDoor
        ? { n: 'Pivot entry door', s: 'enclosure', d: 'Solid core pivot door in a thermally broken frame, hung on a floor‑mounted pivot set and adjusted to swing on a fingertip.' }
        : { n: 'Aluminium‑clad window wall', s: 'enclosure', d: 'Triple‑glazed low‑E units in thermally broken frames, set on a sloped sill pan, shimmed plumb and sealed with a backer rod and sealant joint.' };
    P('glass', {
      p: [c[0], w.y0 + op[2] + hh / 2, c[1]], s: ax ? [span - .5, hh - .45, .22] : [.22, hh - .45, span - .5],
      t0: t[0], t1: t[1], l: 'enclosure', a: 'grow', m: meta
    });
    const fr = 'bronze';
    [[0, hh / 2 - .12, span - .5, .24], [0, -hh / 2 + .12, span - .5, .24]].forEach(f => {
      P(fr, {
        p: [c[0], w.y0 + op[2] + hh / 2 + f[1], c[1]], s: ax ? [f[2], f[3], .34] : [.34, f[3], f[2]],
        t0: t[0], t1: t[1], l: 'enclosure', a: 'grow', m: meta
      });
    });
    [-1, 1].forEach(sg => {
      const e = ptOn(w, (op[0] + op[1]) / 2 + sg * (span - .5) / 2);
      P(fr, {
        p: [e[0], w.y0 + op[2] + hh / 2, e[1]], s: ax ? [.24, hh - .45, .34] : [.34, hh - .45, .24],
        t0: t[0], t1: t[1], l: 'enclosure', a: 'grow', m: meta
      });
    });
    if (span > 9 && !isGar) {
      const div = Math.round(span / 5);
      for (let k = 1; k < div; k++) {
        const e = ptOn(w, op[0] + (op[1] - op[0]) * k / div);
        P(fr, {
          p: [e[0], w.y0 + op[2] + hh / 2, e[1]], s: ax ? [.18, hh - .45, .3] : [.3, hh - .45, .18],
          t0: t[0], t1: t[1], l: 'enclosure', a: 'grow', m: meta
        });
      }
    }
    if (isGar) for (let k = 0; k < 6; k++) P('bronze', {
      p: [c[0], w.y0 + op[2] + .8 + k * 1.4, c[1]], s: ax ? [span - .5, .16, .3] : [.3, .16, span - .5],
      t0: t[0], t1: t[1], l: 'enclosure', a: 'grow', m: meta
    });
  });
})();

/* ═══ 09 · MEP ROUGH-IN ═══ */
(function mep() {
  const A = PH.roughin.t0, B = PH.roughin.t1, S = B - A;
  function run(g, ax, a0, a1, f1, f2, dia, t, meta, layer, anim) {
    const L = Math.abs(a1 - a0), mid = (a0 + a1) / 2;
    const o = { s: [dia, L, dia], t0: t[0], t1: t[1], l: layer, a: anim || 'ext', ax: 'y', sg: a1 > a0 ? -1 : 1, m: meta };
    if (ax === 'x') { o.p = [mid, f1, f2]; o.r = [0, 0, Math.PI / 2]; }
    else if (ax === 'z') { o.p = [f1, f2, mid]; o.r = [Math.PI / 2, 0, 0]; }
    else { o.p = [f1, mid, f2]; }
    return P(g, o);
  }
  /* plumbing */
  const pA = [A + S * .02, A + S * .42];
  const mSup = { n: 'PEX water distribution', s: 'plumbing', d: 'Home‑run PEX from a copper manifold — every fixture has its own line and its own shutoff, and there are no fittings buried in the wall.' };
  const mWst = { n: 'ABS waste & vent', s: 'plumbing', d: 'Drain lines sloped 1/4" per foot with vents carried through the roof. Tested on a static head before cover‑up.' };
  const stubs = [[-14, 8], [-14, -6], [2, 12], [12, -14], [22, 6], [-24, -16], [-2, 30], [44, -12]];
  const pq = seq(pA[0], pA[1], stubs.length * 3, .18);
  stubs.forEach((s, i) => {
    run('abs', 'y', 1.6, 11.4, s[0], s[1], .32, pq(i * 3), mWst, 'plumbing');
    run('copper', 'y', 1.6, 10.8, s[0] + .8, s[1], .13, pq(i * 3 + 1), mSup, 'plumbing');
    run('copper', 'y', 1.6, 10.8, s[0] + 1.2, s[1], .13, pq(i * 3 + 1), mSup, 'plumbing');
    run('abs', 'z', s[1], 3, s[0], 10.9, .3, pq(i * 3 + 2), mWst, 'plumbing');
  });
  run('abs', 'x', -24, 22, 11.2, 3, .34, [A + S * .30, A + S * .44], mWst, 'plumbing');
  [-14, 2, 22].forEach((x, i) => run('abs', 'y', 11, 26, x, 3, .3, [A + S * .40 + i * .002, A + S * .48 + i * .002],
    { n: 'Vent through roof', s: 'plumbing', d: 'Vent stack carried above the roof plane and flashed with a lead boot.' }, 'plumbing'));
  run('copper', 'x', -26, 44, 10.6, 2, .15, [A + S * .28, A + S * .42], mSup, 'plumbing');
  P('gear', {
    p: [-27, 5, -18], s: [2.6, 5.4, 2.4], t0: A + S * .18, t1: A + S * .26, l: 'plumbing', a: 'rise',
    m: { n: 'Water heater & manifold', s: 'plumbing', d: 'Two condensing tankless heaters in series feeding a recirculating loop, with the PEX manifold and pressure‑reducing valve alongside.' }
  });
  /* electrical */
  const eA = [A + S * .30, A + S * .74];
  const mCkt = { n: 'Branch circuit', s: 'electrical', d: 'NM cable stapled within 8" of every box and 4½ ft along the run, drilled through the centre of the studs and nail‑plated.' };
  P('gear', {
    p: [30.6, 6.5, -14], s: [.5, 4.4, 3], t0: eA[0], t1: eA[0] + .004, l: 'electrical', a: 'rise',
    m: { n: '400 A service & panels', s: 'electrical', d: 'Meter main with two 200 A distribution panels, a surge device, generator interlock and space for the battery inverter.' }
  });
  const boxes = [];
  WALLS.forEach(w => {
    const n = Math.floor(w.L / 9);
    for (let i = 0; i < n; i++) {
      const s = 4 + i * 9;
      if (s > w.L - 2 || inOpenSpan(w, s)) continue;
      boxes.push([ptOn(w, s, w.t / 2 - .1), w.y0 + 2.6, Math.abs(w.ux) > .5]);
      if (i % 3 === 0) boxes.push([ptOn(w, s + 2, w.t / 2 - .1), w.y0 + 5.2, Math.abs(w.ux) > .5]);
    }
  });
  const bq = seq(eA[0], eA[1], boxes.length, .12);
  boxes.forEach((b, i) => {
    const t = bq(i);
    P('gear', {
      p: [b[0][0], b[1], b[0][1]], s: b[2] ? [.42, .58, .3] : [.3, .58, .42], t0: t[0], t1: t[1], l: 'electrical', a: 'grow',
      m: { n: 'Device box', s: 'electrical', d: 'Boxes set to the finished drywall plane, height‑gauged off the floor so every plate in the house lines up.' }
    });
  });
  WALLS.forEach((w, i) => {
    const ax = Math.abs(w.ux) > .5, c = ptOn(w, w.L / 2, w.t / 2 - .12);
    const t = seq(eA[0], eA[1], WALLS.length, .16)(i);
    const o = run('conduit', ax ? 'x' : 'z', ax ? w.x1 : w.z1, ax ? w.x2 : w.z2, ax ? c[1] : c[0], w.y0 + w.h - .45, .12, t, mCkt, 'electrical');
    if (ax) o.p = [(w.x1 + w.x2) / 2, w.y0 + w.h - .45, c[1]];
    else o.p = [c[0], w.y0 + w.h - .45, (w.z1 + w.z2) / 2];
  });
  /* ceiling cans */
  const cans = [];
  for (let x = -28; x <= 26; x += 6.5) for (let z = -20; z <= 20; z += 6.5) cans.push([x, z]);
  for (let x = -3; x <= 15; x += 6) for (let z = 27; z <= 36; z += 5) cans.push([x, z]);
  const cq = seq(eA[0] + (eA[1] - eA[0]) * .4, eA[1], cans.length, .1);
  cans.forEach((c, i) => {
    const t = cq(i);
    P('gear', {
      p: [c[0], 12.6, c[1]], s: [.55, .5, .55], t0: t[0], t1: t[1], l: 'electrical', a: 'grow',
      m: { n: 'Recessed downlight housing', s: 'electrical', d: 'IC‑rated airtight housings on a coordinated ceiling plan, laid out against the framing and the HVAC before anything is cut.' }
    });
  });
  /* HVAC */
  const hA = [A + S * .52, A + S * .95];
  const mDuct = { n: 'Rigid trunk duct', s: 'hvac', d: 'Sheet metal trunk sized by Manual D, sealed with mastic and wrapped with R‑8 where it leaves conditioned space.' };
  [[-26, -14], [16, 8]].forEach((c, i) => {
    P('gear', {
      p: [c[0], 15.9, c[1]], s: [3.4, 4.2, 3], t0: hA[0] + i * .004, t1: hA[0] + .01 + i * .004, l: 'hvac', a: 'drop', h: 8,
      m: { n: 'Air handler', s: 'hvac', d: 'Variable‑capacity air handler with an ECM blower and a MERV 13 filter rack, on vibration isolators over a secondary drain pan.' }
    });
  });
  P('duct', {
    p: [1, 11.9, 2], s: [50, 2.0, 1.3], t0: hA[0] + .01, t1: hA[0] + (hA[1] - hA[0]) * .45,
    l: 'hvac', a: 'ext', ax: 'x', sg: -1, m: mDuct
  });
  const regs = [];
  for (let x = -24; x <= 24; x += 8) regs.push([x, 2 + (x % 16 === 0 ? 14 : -14)]);
  regs.push([2, 30], [10, 30], [-20, -18], [20, -18]);
  const rq = seq(hA[0] + (hA[1] - hA[0]) * .35, hA[1], regs.length, .16);
  regs.forEach((r, i) => {
    const t = rq(i);
    run('flex', 'z', 2, r[1], r[0], 11.6, .8, t, { n: 'Branch duct', s: 'hvac', d: 'Insulated flexible branch pulled tight and supported every 4 ft — sags here are what make a system underperform.' }, 'hvac');
    P('duct', {
      p: [r[0], 12.4, r[1]], s: [2.2, .5, 1.2], t0: t[0] + .002, t1: t[1] + .002, l: 'hvac', a: 'grow',
      m: { n: 'Supply register boot', s: 'hvac', d: 'Boot set flush to the finished ceiling and sealed to the drywall to stop attic air bypass.' }
    });
  });
  [[34, 6], [40, 6]].forEach((c, i) => {
    P('conc', {
      p: [c[0], .3, c[1]], s: [4, .5, 4], t0: hA[1] - .01, t1: hA[1] - .006, l: 'hvac', a: 'grow',
      m: { n: 'Equipment pad', s: 'hvac', d: 'Level composite pad set on compacted rock, clear of the roof drip line.' }
    });
    P('gear', {
      p: [c[0], 2.1, c[1]], s: [3.2, 3.2, 3.2], t0: hA[1] - .006, t1: hA[1], l: 'hvac', a: 'drop', h: 6,
      m: { n: 'Inverter condensing unit', s: 'hvac', d: 'Variable‑speed heat pump — it modulates instead of cycling, which is why the house stays within half a degree of setpoint.' }
    });
  });
})();

/* ═══ 10 · INSULATION & DRYWALL ═══ */
(function closein() {
  const A = PH.drywall.t0, B = PH.drywall.t1, S = B - A;
  const iA = [A + S * .02, A + S * .36], gA = [A + S * .32, A + S * .82];

  const bays = [];
  WALLS.filter(w => w.ext).forEach(w => {
    const n = Math.max(2, Math.floor((w.L - .5) / 1.333));
    for (let i = 0; i < n; i++) {
      const s = .3 + (i + .5) * (w.L - .6) / n;
      if (inOpenSpan(w, s)) continue;
      bays.push({ w, s, ax: Math.abs(w.ux) > .5 });
    }
  });
  const iq = seq(iA[0], iA[1], bays.length, .16);
  bays.forEach((b, i) => {
    const pt = ptOn(b.w, b.s), t = iq(i);
    P('insul', {
      p: [pt[0], b.w.y0 + .3 + (b.w.h - .6) / 2, pt[1]],
      s: b.ax ? [1.06, b.w.h - .7, b.w.t * .8] : [b.w.t * .8, b.w.h - .7, 1.06],
      t0: t[0], t1: t[1], l: 'insulation', a: 'rise',
      m: { n: 'R‑23 mineral wool batt', s: 'insulation', d: 'Friction‑fit full depth with no compression, split neatly around wiring rather than crushed behind it. Rim joists get closed‑cell foam.' }
    });
  });
  ROOFS.forEach((rf, ri) => {
    const slope = rf.rise / rf.half, ang = Math.atan(slope);
    const cols = Math.max(3, Math.round((rf.x1 - rf.x0) / 6));
    for (let sgI = 0; sgI < 2; sgI++) for (let c = 0; c < cols; c++) {
      const sg = sgI ? -1 : 1, uz = rf.half * .5;
      const t = seq(iA[0], iA[1], cols * 2 * 3, .2)(ri * cols * 2 + sgI * cols + c);
      P('foam', {
        p: [rf.x0 + (c + .5) * (rf.x1 - rf.x0) / cols, rf.plate + .4 + rf.rise - uz * slope - .5, rf.zc + sg * uz],
        s: [(rf.x1 - rf.x0) / cols * .96, .7, rf.half * Math.sqrt(1 + slope * slope) * .98], r: [sg * ang, 0, 0],
        t0: t[0], t1: t[1], l: 'insulation', a: 'grow',
        m: { n: 'Closed‑cell roof foam', s: 'insulation', d: 'Spray foam directly to the underside of the deck creates an unvented, conditioned roof assembly with no thermal bridging at the rafters.' }
      });
    }
  });

  /* drywall — interior faces */
  const faces = [];
  WALLS.forEach(w => {
    const ax = Math.abs(w.ux) > .5, cols = Math.ceil(w.L / 4), rows = Math.ceil(w.h / 4.5);
    const sides = w.ext ? [-1] : [-1, 1];
    sides.forEach(sd => {
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const s = c * 4 + Math.min(4, w.L - c * 4) / 2, y = w.y0 + r * 4.5 + Math.min(4.5, w.h - r * 4.5) / 2;
        if (openingAt(w, s, y)) continue;
        const pt = ptOn(w, s, sd * (w.t / 2 + .04));
        faces.push({ p: [pt[0], y, pt[1]], w: Math.min(4, w.L - c * 4) * .99, h: Math.min(4.5, w.h - r * 4.5) * .99, ax });
      }
    });
  });
  const gq = seq(gA[0], gA[1], faces.length, .13);
  faces.forEach((f, i) => {
    const t = gq(i);
    P('gwb', {
      p: f.p, s: f.ax ? [f.w, f.h, .1] : [.1, f.h, f.w], t0: t[0], t1: t[1], l: 'insulation', a: 'grow',
      m: { n: '5/8" gypsum board', s: 'insulation', d: 'Hung horizontally with screws every 12", taped, three coats of compound, sanded, then skim‑coated to level 5 where raking light hits.' }
    });
  });
  /* ceilings */
  const ceil = [];
  for (let x = -32; x < 30; x += 6) for (let z = -24; z < 24; z += 6) {
    if (x > -8 && x < 18 && z > 10) continue;
    ceil.push([x + 3, 13.35, z + 3, 6, 6]);
  }
  for (let x = 30; x < 58; x += 7) for (let z = -24; z < 0; z += 6) ceil.push([x + 3.5, 11.9, z + 3, 7, 6]);
  for (let x = -32; x < -8; x += 6) for (let z = -24; z < 2; z += 6.5) ceil.push([x + 3, 24.3, z + 3.25, 6, 6.5]);
  const cq = seq(gA[0] + (gA[1] - gA[0]) * .3, gA[1], ceil.length, .13);
  ceil.forEach((c, i) => {
    const t = cq(i);
    P('gwb', {
      p: [c[0], c[1], c[2]], s: [c[3] * .99, .1, c[4] * .99], t0: t[0], t1: t[1], l: 'insulation', a: 'grow',
      m: { n: 'Ceiling board', s: 'insulation', d: '5/8" sag‑resistant board on resilient channel over the flat ceilings, with blown insulation above to R‑60.' }
    });
    P('foam', {
      p: [c[0], c[1] + 1.1, c[2]], s: [c[3] * .98, 1.7, c[4] * .98], t0: t[0] - .004, t1: t[1] - .004, l: 'insulation', a: 'grow',
      m: { n: 'Blown ceiling insulation', s: 'insulation', d: 'Blown cellulose to R‑60, dammed back from the eave vents by baffles so the soffit intake stays open.' }
    });
  });
})();

/* ═══ 11 · INTERIOR FINISHES ═══ */
(function interior() {
  const A = PH.interior.t0, B = PH.interior.t1, S = B - A;
  const tiles = [];
  PLATES.forEach(pl => {
    for (let x = pl[0] + .6; x < pl[2] - 1; x += 5.5) for (let z = pl[1] + .6; z < pl[3] - 1; z += 5.5)
      tiles.push([x + 2.6, z + 2.6, Math.min(5.3, pl[2] - .6 - x), Math.min(5.3, pl[3] - .6 - z), pl]);
  });
  const tq = seq(A + S * .06, A + S * .46, tiles.length, .12);
  tiles.forEach((t, i) => {
    const wq = tq(i);
    const bath = (t[0] > -30 && t[0] < -18 && t[1] > -22 && t[1] < -8);
    const gar = t[0] > 30;
    if (gar) return;
    P(bath ? 'marble' : 'oak', {
      p: [t[0], FF + .09, t[1]], s: [t[2] * .99, .18, t[3] * .99], t0: wq[0], t1: wq[1], l: 'interior', a: 'grow',
      m: bath
        ? { n: 'Honed marble floor', s: 'interior', d: 'Large‑format honed marble on an uncoupling membrane, dry‑laid first so the veining runs continuously across the room.' }
        : { n: 'Rift white oak flooring', s: 'interior', d: '8" wide rift‑and‑quartered white oak, nailed and glued over the radiant slab, then sanded and finished with a hardwax oil on site.' }
    });
  });
  for (let x = TOWER.x0 + 1; x < TOWER.x1 - 1; x += 5.5) for (let z = TOWER.z0 + 1; z < TOWER.z1 - 1; z += 5.5) {
    const t = seq(A + S * .2, A + S * .5, 24, .2)((Math.round(x) + Math.round(z)) % 24);
    P('oak', {
      p: [x + 2.6, TOWER.plate + .1, z + 2.6], s: [5.3, .18, 5.3], t0: t[0], t1: t[1], l: 'interior', a: 'grow',
      m: { n: 'Upper level flooring', s: 'interior', d: 'Same rift oak laid over an acoustic underlayment to keep footfall out of the rooms below.' }
    });
  }
  WALLS.forEach((w, i) => {
    const ax = Math.abs(w.ux) > .5, c = ptOn(w, w.L / 2, -(w.t / 2 + .09));
    const t = seq(A + S * .5, A + S * .72, WALLS.length, .18)(i);
    P('gwb', {
      p: [c[0], w.y0 + .38, c[1]], s: ax ? [w.L * .98, .76, .1] : [.1, .76, w.L * .98],
      t0: t[0], t1: t[1], l: 'interior', a: 'ext', ax: ax ? 'x' : 'z', sg: -1,
      m: { n: 'Base & trim', s: 'interior', d: 'Square‑edge poplar base set flush with the drywall on a reveal bead, mitred and filled so no joint reads.' }
    });
  });
  /* kitchen */
  const kx = 4, kz = -6;
  const mCab = { n: 'Custom cabinetry', s: 'interior', d: 'Shop‑built rift oak and painted case work on levelling legs, scribed to the wall and set with a laser so every reveal matches.' };
  P('oak', { p: [kx, FF + 1.6, kz], s: [11, 3.1, 3.6], t0: A + S * .52, t1: A + S * .58, l: 'interior', a: 'rise', m: mCab });
  P('marble', {
    p: [kx, FF + 3.28, kz], s: [11.6, .28, 4.2], t0: A + S * .60, t1: A + S * .64, l: 'interior', a: 'drop', h: 5,
    m: { n: 'Waterfall island top', s: 'interior', d: 'Book‑matched marble slab with a mitred waterfall edge. Templated digitally after the cabinets are set, so the seam lands where the veining continues.' }
  });
  [-1, 1].forEach(sg => P('marble', {
    p: [kx + sg * 5.66, FF + 1.6, kz], s: [.28, 3.4, 4.2], t0: A + S * .60, t1: A + S * .64, l: 'interior', a: 'rise',
    m: { n: 'Waterfall return', s: 'interior', d: 'The slab turns the corner and runs to the floor, veins matched across the mitre.' }
  }));
  for (let i = 0; i < 5; i++) P('oak', {
    p: [-4 + i * 3.4, FF + 1.6, -20.5], s: [3.2, 3.2, 2.2], t0: A + S * .52 + i * .002, t1: A + S * .57 + i * .002, l: 'interior', a: 'rise', m: mCab
  });
  P('marble', { p: [1.6, FF + 3.28, -20.5], s: [17.5, .28, 2.5], t0: A + S * .61, t1: A + S * .65, l: 'interior', a: 'drop', h: 4, m: { n: 'Perimeter countertop', s: 'interior', d: 'Continuous slab with an integrated drainboard and a full‑height slab backsplash.' } });
  for (let i = 0; i < 4; i++) P('oak', {
    p: [-4 + i * 3.4, FF + 8.4, -20.5], s: [3.2, 3.4, 1.5], t0: A + S * .55 + i * .002, t1: A + S * .6 + i * .002, l: 'interior', a: 'grow', m: mCab
  });
  P('appl', { p: [6.5, FF + 1.7, -20.5], s: [4, 3.3, 2.4], t0: A + S * .72, t1: A + S * .76, l: 'interior', a: 'slide', off: [0, 0, -6], m: { n: 'Range & hood', s: 'interior', d: '48" dual‑fuel range with a make‑up air interlock — required once the hood moves more than 400 cfm.' } });
  P('appl', { p: [6.5, FF + 8.5, -20.5], s: [4.2, 2.6, 2.6], t0: A + S * .73, t1: A + S * .77, l: 'interior', a: 'drop', h: 4, m: { n: 'Vent hood', s: 'interior', d: 'Insert hood in a plaster surround, ducted straight out through the roof with a smooth‑wall run.' } });
  P('appl', { p: [-8.5, FF + 3, -20.5], s: [3, 6, 2.5], t0: A + S * .74, t1: A + S * .78, l: 'interior', a: 'slide', off: [-6, 0, 0], m: { n: 'Integrated refrigeration', s: 'interior', d: 'Panel‑ready columns set flush with the cabinetry, on their own dedicated circuits.' } });
  /* bath & utility fixtures */
  const fx = [[-24, -18, 'Freestanding tub', 'Cast stone tub on a levelled plinth with a floor‑mounted filler roughed in during the slab.'],
  [-29, -12, 'Double vanity', 'Floating oak vanity with an integrated stone basin and concealed drain carrier in the wall.'],
  [-21, -12, 'Water closet', 'Wall‑hung carrier set in the framing, so the finished wall is clean and the floor is uninterrupted.'],
  [12, -18, 'Guest bath vanity', 'Stone slab vanity with a wall‑mounted spout.'],
  [-27, 18, 'Utility sink', 'Deep basin with a laundry standpipe and a boxed hose bibb.']];
  fx.forEach((f, i) => {
    const t = seq(A + S * .66, A + S * .86, fx.length, .3)(i);
    P('fixture', {
      p: [f[0], FF + 1.2, f[1]], s: [3.4, 2.2, 2.4], t0: t[0], t1: t[1], l: 'interior', a: 'drop', h: 5,
      m: { n: f[2], s: 'interior', d: f[3] }
    });
  });
  /* stair */
  for (let i = 0; i < 16; i++) {
    const t = seq(A + S * .42, A + S * .56, 16, .3)(i);
    P('oak', {
      p: [-14, FF + .4 + i * .76, -20 + i * .95], s: [4.4, .3, 1.05], t0: t[0], t1: t[1], l: 'interior', a: 'grow',
      m: { n: 'Floating oak stair', s: 'interior', d: 'Solid oak treads cantilevered off a concealed steel stringer set during framing, with a frameless glass guard.' }
    });
    if (i % 2 === 0) P('glass', {
      p: [-11.7, FF + 3.6 + i * .76, -20 + i * .95], s: [.14, 3.6, 1.9], t0: t[0] + .004, t1: t[1] + .004, l: 'interior', a: 'grow',
      m: { n: 'Glass guard', s: 'interior', d: 'Structural laminated glass in a base shoe, no posts.' }
    });
  }
  /* interior doors */
  WALLS.filter(w => !w.ext).forEach((w, i) => w.ops.forEach(op => {
    const c = ptOn(w, (op[0] + op[1]) / 2), ax = Math.abs(w.ux) > .5;
    const t = seq(A + S * .5, A + S * .7, 12, .25)(i % 12);
    P('gwb', {
      p: [c[0], FF + (op[3] - op[2]) / 2, c[1]], s: ax ? [op[1] - op[0] - .4, op[3] - op[2] - .2, .22] : [.22, op[3] - op[2] - .2, op[1] - op[0] - .4],
      t0: t[0], t1: t[1], l: 'interior', a: 'grow',
      m: { n: 'Interior door', s: 'interior', d: 'Flush 8‑ft doors in a concealed frame with no visible casing, hung on adjustable European hinges.' }
    });
  }));
  /* furniture — the payoff at the end */
  const furn = [
    ['fabric', 6, 22, 12, 2.4, 5, 'Great room seating', 'Owner‑supplied furnishings placed at the final walkthrough.'],
    ['oak', 6, 30, 6, 1.4, 3, 'Dining table', 'Solid oak table on a blackened steel base.'],
    ['fabric', -24, -4, 8, 2.2, 6.5, 'Primary bed', 'Owner‑supplied furnishings.'],
    ['fabric', 0, 22, 14, .12, 10, 'Rug', 'Hand‑knotted wool, laid at final clean.']
  ];
  furn.forEach((f, i) => {
    const t = seq(PH.closeout.t0 + .006, PH.closeout.t0 + .022, furn.length, .35)(i);
    P(f[0], {
      p: [f[1], FF + .2 + f[4] / 2, f[2]], s: [f[3], f[4], f[5]], t0: t[0], t1: t[1], l: 'interior', a: 'grow',
      m: { n: f[6], s: 'interior', d: f[7] }
    });
  });
  /* light fixtures — switched on at handover */
  const lamps = [];
  for (let x = -26; x <= 24; x += 8) for (let z = -18; z <= 18; z += 9) lamps.push([x, 12.4, z]);
  lamps.push([4, 9, 20], [4, 9, 26], [10, 9, 26], [-14, 10, -10]);
  lamps.forEach((l, i) => {
    const t = seq(A + S * .88, B, lamps.length, .2)(i);
    P('glow', {
      p: [l[0], l[1], l[2]], s: [.5, .3, .5], t0: t[0], t1: t[1], l: 'interior', a: 'grow',
      m: { n: 'Lighting package', s: 'interior', d: 'Tunable‑white fixtures on a scene controller. Layered so the room can go from working light to a single warm layer at night.' }
    });
  });
})();

/* ═══ 12 · EXTERIOR FINISHES & MASONRY ═══ */
(function extfin() {
  const A = PH.exteriorfin.t0, B = PH.exteriorfin.t1, S = B - A;
  const stoneTop = 5.4;
  const cells = [];
  WALLS.filter(w => w.ext).forEach(w => {
    const ax = Math.abs(w.ux) > .5, cols = Math.ceil(w.L / 3.2);
    for (let c = 0; c < cols; c++) {
      const cw = Math.min(3.2, w.L - c * 3.2), s = c * 3.2 + cw / 2;
      const rows = Math.ceil(w.h / 2.6);
      for (let r = 0; r < rows; r++) {
        const rh = Math.min(2.6, w.h - r * 2.6), y = w.y0 + r * 2.6 + rh / 2;
        if (openingAt(w, s, y)) continue;
        cells.push({ w, s, y, cw: cw * .99, rh: rh * .99, ax, stone: y < FF + stoneTop && w.y0 === FF });
      }
    }
  });
  cells.sort((a, b) => a.y - b.y);
  const sq = seq(A + S * .04, A + S * .5, cells.filter(c => c.stone).length, .1);
  const uq = seq(A + S * .4, A + S * .9, cells.filter(c => !c.stone).length, .09);
  let si = 0, ui = 0;
  const mStone = { n: 'Dry‑stack stone veneer', s: 'enclosure', d: 'Quarried ledge stone over a drainage mat and lath, set with a full mortar bed and raked joints. Corners are returned with real corner stones, not mitres.' };
  const mStuc = { n: 'Integral‑colour stucco', s: 'enclosure', d: 'Three‑coat system over paper and lath with a smooth sand finish, expansion joints at every change of plane and a weep screed at the base.' };
  cells.forEach(cl => {
    const pt = ptOn(cl.w, cl.s, cl.w.t / 2 + (cl.stone ? .44 : .36));
    const t = cl.stone ? sq(si++) : uq(ui++);
    P(cl.stone ? 'stone' : 'stucco', {
      p: [pt[0], cl.y, pt[1]], s: cl.ax ? [cl.cw, cl.rh, cl.stone ? .5 : .28] : [cl.stone ? .5 : .28, cl.rh, cl.cw],
      t0: t[0], t1: t[1], l: 'enclosure', a: cl.stone ? 'rise' : 'grow',
      c: cl.stone ? [.44 + R() * .16, .40 + R() * .13, .35 + R() * .1] : null,
      m: cl.stone ? mStone : mStuc
    });
  });
  /* gable end finishes */
  ROOFS.forEach((rf, ri) => [rf.x0, rf.x1].forEach((gx, gi) => {
    if (rf.key === 'main' && gi === 0) return;
    const t = seq(A + S * .55, A + S * .8, 6, .3)(ri * 2 + gi);
    P('triFin', {
      p: [gx + (gi ? .3 : -.3), rf.plate + rf.rise / 2 + .2, rf.zc], s: [rf.half * 2, rf.rise, .3], r: [0, Math.PI / 2, 0],
      t0: t[0], t1: t[1], l: 'enclosure', a: 'grow', m: { n: 'Gable finish', s: 'enclosure', d: 'Stucco carried up the gable with a drip screed at the rake and a ventilated cedar soffit behind.' }
    });
  }));
  /* timber accents at the entry */
  for (let i = 0; i < 7; i++) {
    const t = seq(A + S * .62, A + S * .86, 7, .3)(i);
    P('cedar', {
      p: [-9 + i * 1.5, FF + 6, -24.75], s: [.9, 12, .5], t0: t[0], t1: t[1], l: 'enclosure', a: 'rise',
      m: { n: 'Vertical timber screen', s: 'enclosure', d: 'Rough‑sawn cedar battens on a concealed clip rail, spaced to filter afternoon light off the entry glass.' }
    });
  }
  /* chimney */
  for (let i = 0; i < 9; i++) {
    const t = seq(A + S * .3, A + S * .62, 9, .25)(i);
    P('stone', {
      p: [26, FF + 1.6 + i * 3, 14], s: [5.2, 3, 5.2], t0: t[0], t1: t[1], l: 'enclosure', a: 'rise',
      c: [.42 + R() * .16, .39 + R() * .12, .34 + R() * .1],
      m: { n: 'Stone chimney', s: 'enclosure', d: 'Veneered chimney chase around a direct‑vent flue, with a cricket behind it and a stone cap over a stainless spark arrestor.' }
    });
  }
  /* exterior sconces */
  const sc2 = [[-4, -24.8], [3, -24.8], [33, -24.8], [58.8, -12], [-32.8, 0], [18.8, 30], [-6.8, 30]];
  sc2.forEach((s, i) => {
    const t = seq(A + S * .86, B, sc2.length, .3)(i);
    P('glow', {
      p: [s[0], FF + 7.5, s[1]], s: [.6, 1.4, .6], t0: t[0], t1: t[1], l: 'enclosure', a: 'grow',
      m: { n: 'Exterior sconce', s: 'enclosure', d: 'Dark‑sky compliant bronze sconce on the landscape lighting transformer, so the glass never glares at night.' }
    });
  });
})();

/* ═══ 13 · HARDSCAPE, POOL & LANDSCAPE ═══ */
(function sitefin() {
  const A = PH.sitework.t0, B = PH.sitework.t1, S = B - A;
  const path = [[-112, 14], [-70, 12], [-40, 2], [-14, -34], [22, -38], [46, -33]];
  const drive = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.round(L / 5.5), ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < n; k++) {
      const t = (k + .5) / n;
      drive.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), ang, 17]);
    }
  }
  for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) drive.push([34 + i * 5.5, -28 + k * 4.6, 0, 5.4]);
  const dq = seq(A + S * .02, A + S * .34, drive.length, .1);
  drive.forEach((p, i) => {
    const t = dq(i);
    P('paver', {
      p: [p[0], groundY(p[0], p[1]) + .22, p[1]], s: [p[3], .45, 5.4], r: [0, p[2], 0],
      t0: t[0], t1: t[1], l: 'exterior', a: 'grow', c: [.52 + R() * .1, .51 + R() * .09, .49 + R() * .08],
      m: { n: 'Granite paver driveway', s: 'exterior', d: 'Sawn granite setts on a bedding course over compacted base, with a permeable joint sand and a hidden drainage channel at the garage apron.' }
    });
  });
  const terr = [];
  for (let x = -8; x <= 4; x += 4) for (let z = -38; z <= -25; z += 4) terr.push([x, z, 'walk']);
  for (let x = -8; x <= 20; x += 4.2) for (let z = 39; z <= 55; z += 4.2) terr.push([x, z, 'terrace']);
  for (let x = 24; x <= 44; x += 4.2) for (let z = 28; z <= 34; z += 4.2) terr.push([x, z, 'terrace']);
  const tq = seq(A + S * .2, A + S * .55, terr.length, .1);
  terr.forEach((p, i) => {
    const t = tq(i);
    P('paver', {
      p: [p[0], groundY(p[0], p[1]) + .26, p[1]], s: [4.1, .5, 4.1], t0: t[0], t1: t[1], l: 'exterior', a: 'drop', h: 4,
      c: [.58 + R() * .1, .57 + R() * .09, .55 + R() * .08],
      m: { n: p[2] === 'walk' ? 'Entry walk' : 'Stone terrace', s: 'exterior', d: 'Thermal‑finish stone pavers on pedestals over a drainage layer, set dead level with the interior floor so the threshold disappears.' }
    });
  });
  /* pool */
  const px2 = 30, pz = 46, pww = 34, pd = 15;
  P('conc', {
    p: [px2, -1.6, pz], s: [pww + 2, 6, pd + 2], t0: A + S * .3, t1: A + S * .42, l: 'exterior', a: 'rise',
    m: { n: 'Pool shell', s: 'exterior', d: 'Shotcrete shell over a steel cage, with the plumbing, the perimeter overflow gutter and the vanishing edge formed into it before finish.' }
  });
  P('water', {
    p: [px2, .9, pz], s: [pww, 2.4, pd], t0: A + S * .62, t1: A + S * .72, l: 'exterior', a: 'rise',
    m: { n: 'Pool', s: 'exterior', d: 'Vanishing‑edge pool with a glass‑tile interior finish. The far wall spills into a catch basin below the terrace.' }
  });
  for (let i = 0; i < 20; i++) {
    const t = seq(A + S * .45, A + S * .6, 20, .2)(i);
    P('marble', {
      p: [px2 - pww / 2 + (i % 10 + .5) * pww / 10, 1.5, pz + (i < 10 ? -1 : 1) * (pd / 2 + .9)],
      s: [pww / 10 * .98, .4, 1.8], t0: t[0], t1: t[1], l: 'exterior', a: 'grow',
      m: { n: 'Pool coping', s: 'exterior', d: 'Bullnose stone coping with a 1/4" reveal over the tile line, set on a flexible bond so it never lifts.' }
    });
  }
  P('stone', {
    p: [-2, 1.6, 48], s: [7, 2.4, 7], t0: A + S * .58, t1: A + S * .66, l: 'exterior', a: 'rise',
    m: { n: 'Fire terrace', s: 'exterior', d: 'Stone fire table plumbed to the gas line stubbed during the underground phase, with a keyed shutoff at the terrace edge.' }
  });
  P('stone', {
    p: [16, 2.4, 42], s: [12, 4, 3.4], t0: A + S * .6, t1: A + S * .68, l: 'exterior', a: 'rise',
    m: { n: 'Outdoor kitchen', s: 'exterior', d: 'Masonry counter with a built‑in grill, sink and refrigeration on a GFCI circuit under the covered loggia.' }
  });
  for (let i = 0; i < 14; i++) {
    const x = -46 + i * 5, z = 22 + i * .6;
    const t = seq(A + S * .25, A + S * .5, 14, .2)(i);
    P('stone', {
      p: [x, groundY(x, z) + 1.4, z], s: [5.1, 3.4, 2.2], t0: t[0], t1: t[1], l: 'exterior', a: 'rise',
      c: [.42 + R() * .14, .40 + R() * .12, .36 + R() * .1],
      m: { n: 'Site retaining wall', s: 'exterior', d: 'Battered dry‑stack wall with a drainage chimney and perforated pipe behind it, daylighted at the low end.' }
    });
  }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU, x = 14 + Math.cos(a) * 62, z = 6 + Math.sin(a) * 52;
    const t = seq(A + S * .84, B, 16, .2)(i);
    P('glow', {
      p: [x, groundY(x, z) + 1.4, z], s: [.4, .9, .4], t0: t[0], t1: t[1], l: 'landscape', a: 'rise',
      m: { n: 'Landscape lighting', s: 'landscape', d: 'Low‑voltage path and uplights on an astronomic timer, aimed at night after the plants are in.' }
    });
  }
  const beds = [];
  for (let i = 0; i < 30; i++) {
    const a = R() * TAU, r = 44 + R() * 34;
    const x = 12 + Math.cos(a) * r, z = 6 + Math.sin(a) * r * .8;
    if (x > -36 && x < 62 && z > -28 && z < 42) continue;
    beds.push([x, z]);
  }
  const bq = seq(A + S * .55, A + S * .9, beds.length, .12);
  beds.forEach((b, i) => {
    const t = bq(i);
    P('mulch', {
      p: [b[0], groundY(b[0], b[1]) + .2, b[1]], s: [9, .4, 7], t0: t[0], t1: t[1], l: 'landscape', a: 'grow',
      m: { n: 'Planting bed', s: 'landscape', d: 'Imported topsoil and compost, drip irrigation on its own zone, then bark mulch held back from the trunk flare.' }
    });
    P('leafy', {
      p: [b[0] + 1, groundY(b[0], b[1]) + 1.4, b[1]], s: [3.6, 2.8, 3.6], t0: t[0] + .002, t1: t[1] + .006, l: 'landscape', a: 'grow',
      c: [.22 + R() * .1, .38 + R() * .14, .18 + R() * .08],
      m: { n: 'Shrub planting', s: 'landscape', d: 'Native and adapted species chosen for the exposure, planted slightly high so the crown never sits wet.' }
    });
  });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU + .3, r = 62 + R() * 38;
    const x = 12 + Math.cos(a) * r, z = 6 + Math.sin(a) * r * .85;
    const h = 16 + R() * 15, t = seq(A + S * .6, B, 22, .18)(i);
    P('trunk', {
      p: [x, groundY(x, z) + h * .22, z], s: [1.1, h * .45, 1.1], t0: t[0], t1: t[1], l: 'landscape', a: 'rise',
      m: { n: 'Specimen conifer', s: 'landscape', d: 'Craned in with a root ball, staked for one season and watered on a temporary bag system until it establishes.' }
    });
    P('conifer', {
      p: [x, groundY(x, z) + h * .58, z], s: [h * .48, h * .92, h * .48], t0: t[0] + .003, t1: t[1] + .006, l: 'landscape', a: 'rise',
      c: [.13 + R() * .06, .28 + R() * .1, .17 + R() * .05],
      m: { n: 'Specimen conifer', s: 'landscape', d: 'Craned in with a root ball, staked for one season and watered on a temporary bag system until it establishes.' }
    });
  }
  for (let i = 0; i < 12; i++) {
    const a = R() * TAU, r = 50 + R() * 40, x = 12 + Math.cos(a) * r, z = 6 + Math.sin(a) * r * .8;
    const t = seq(A + S * .5, A + S * .8, 12, .25)(i);
    P('stone', {
      p: [x, groundY(x, z) + .9, z], s: [3 + R() * 4, 2 + R() * 2.4, 3 + R() * 3.4], r: [R(), R() * TAU, R() * .4],
      t0: t[0], t1: t[1], l: 'landscape', a: 'drop', h: 8, c: [.36 + R() * .12, .35 + R() * .1, .33 + R() * .1],
      m: { n: 'Placed boulder', s: 'landscape', d: 'Local granite set with a third of its mass buried so it reads as though it was always there.' }
    });
  }
})();

/* ═══ 14 · EXISTING VEGETATION ═══ */
(function existing() {
  const rr = rng(4471);
  for (let i = 0; i < 46; i++) {
    const a = rr() * TAU, r = 26 + rr() * 96;
    const x = 10 + Math.cos(a) * r, z = 6 + Math.sin(a) * r * .86;
    const inPad = x > -46 && x < 76 && z > -40 && z < 54;
    const h = 14 + rr() * 20;
    const rem = inPad ? { x0: PH.clearing.t0 + .004 + rr() * .012, x1: PH.clearing.t0 + .02 + rr() * .012 } : {};
    P('trunk', Object.assign({
      p: [x, groundY(x, z) + h * .2, z], s: [1 + rr() * .5, h * .42, 1 + rr() * .5], t0: -.002, t1: -.001, l: 'site', a: 'grow',
      m: { n: inPad ? 'Tree to be removed' : 'Protected tree', s: 'site', d: inPad ? 'Marked on the tree survey for removal. Stumps are ground out and the chips are stockpiled for the planting beds.' : 'Inside the tree protection fence. Nothing is stored, parked or graded inside the drip line.' }
    }, rem));
    P(rr() > .45 ? 'conifer' : 'leafy', Object.assign({
      p: [x, groundY(x, z) + h * .56, z], s: [h * .5, h * .9, h * .5], t0: -.002, t1: -.001, l: 'site', a: 'grow',
      c: [.15 + rr() * .1, .3 + rr() * .14, .16 + rr() * .07],
      m: { n: inPad ? 'Tree to be removed' : 'Protected tree', s: 'site', d: inPad ? 'Marked on the tree survey for removal.' : 'Inside the tree protection fence.' }
    }, rem));
  }
})();

/* ═══════════════ MATERIAL RECIPES ═══════════════════════════════ */
const MAT = {
  lumber:  { tex: 'wood', ts: .34, sh: 1, r: .82 },
  beam:    { tex: 'wood', ts: .22, sh: 1, r: .78 },
  steel:   { tex: 'metal', ts: .5, sh: 1, r: .38, m: .9, env: 1.1 },
  osb:     { tex: 'osb', ts: .26, sh: 1, r: .93, xr: .10 },
  conc:    { tex: 'concrete', ts: .17, sh: 1, r: .92 },
  form:    { tex: 'wood', ts: .2, sh: 1, r: .88 },
  rebar:   { r: .58, m: .55, env: .9 },
  gravel:  { tex: 'gravel', ts: .5, sh: 1, r: 1 },
  abs:     { r: .5 }, pvc: { r: .45 }, copper: { r: .3, m: .85, env: 1.2 },
  conduit: { r: .42, m: .6 },
  duct:    { tex: 'metal', ts: .7, r: .35, m: .8, env: 1.1 },
  flex:    { r: .8 },
  gear:    { tex: 'metal', ts: .8, sh: 1, r: .48, m: .65, env: 1 },
  insul:   { tex: 'fiber', ts: .8, r: 1, xr: .5 },
  foam:    { r: 1, xr: .5 },
  gwb:     { tex: 'board', ts: .3, sh: 1, r: .94, xr: .08 },
  slate:   { tex: 'slate', ts: .55, sh: 1, r: .72, env: .8, xr: .07 },
  seam:    { tex: 'metal', ts: .4, sh: 1, r: .36, m: .72, env: 1.3, xr: .07 },
  memb:    { r: .88, xr: .06 },
  wrap:    { tex: 'board', ts: .35, r: .85, xr: .07 },
  stone:   { tex: 'stone', ts: .16, sh: 1, r: .94, env: .5, xr: .10 },
  stucco:  { tex: 'stucco', ts: .30, sh: 1, r: .92, xr: .10 },
  cedar:   { tex: 'wood', ts: .38, sh: 1, r: .76, xr: .14 },
  bronze:  { tex: 'metal', ts: .9, sh: 1, r: .34, m: .92, env: 1.4 },
  glass:   { sh: 0, r: .04, m: .18, o: .26, env: 2.4, xr: .12 },
  oak:     { tex: 'oak', ts: .3, sh: 1, r: .55, env: .7 },
  marble:  { tex: 'concrete', ts: .12, sh: 1, r: .18, env: 1.5 },
  tileI:   { tex: 'concrete', ts: .3, sh: 1, r: .42, env: .9 },
  fixture: { sh: 1, r: .18, env: 1.5 },
  appl:    { tex: 'metal', ts: .8, sh: 1, r: .3, m: .85, env: 1.3 },
  fabric:  { tex: 'fiber', ts: .5, sh: 1, r: 1 },
  paver:   { tex: 'concrete', ts: .25, sh: 1, r: .88 },
  asph:    { tex: 'gravel', ts: .6, sh: 1, r: .96 },
  mulch:   { tex: 'gravel', ts: .7, sh: 1, r: 1 },
  trunk:   { tex: 'wood', ts: .5, sh: 1, r: .95 },
  conifer: { sh: 1, r: .95 }, leafy: { sh: 1, r: .95 },
  water:   { r: .03, m: .35, o: .8, env: 2.6 },
  stake:   { r: .85 }, strline: { r: .8 },
  glow:    { r: .35, e: 1 },
  temp:    { tex: 'board', ts: .3, sh: 1, r: .78 },
  tarmac:  { tex: 'gravel', ts: .5, sh: 1, r: .95 },
  triOsb:  { tex: 'osb', ts: .26, sh: 1, r: .93, xr: .10 },
  triFin:  { tex: 'stucco', ts: .30, sh: 1, r: .92, xr: .10 },
  triLum:  { tex: 'wood', ts: .34, sh: 1, r: .82 }
};
/* thin panels that read from both faces */
const TWOSIDE = { gwb: 1, osb: 1, glass: 1, memb: 1, wrap: 1, slate: 1, seam: 1, insul: 1, foam: 1, triOsb: 1, triFin: 1 };

/* world-space triplanar UVs — one texel density for every instance,
   whatever its scale. Falls back to flat colour if the GPU objects. */
const TRIMATS = [];
function triplanar(mat, scale) {
  mat.onBeforeCompile = function (sh) {
    sh.uniforms.uTexScale = { value: scale };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvec4 twp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\ntwp=instanceMatrix*twp;\n#endif\ntwp=modelMatrix*twp;\nvWP=twp.xyz;\nvec3 ton=objectNormal;\n#ifdef USE_INSTANCING\nton=mat3(instanceMatrix)*ton;\n#endif\nvWN=normalize(mat3(modelMatrix)*ton);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <uv_pars_fragment>',
        'varying vec3 vWP;varying vec3 vWN;uniform float uTexScale;vec2 vUv;')
      .replace('void main() {',
        'void main() {\nvec3 tw=abs(normalize(vWN));\nvUv=(tw.y>max(tw.x,tw.z))?vWP.xz:((tw.x>tw.z)?vWP.zy:vWP.xy);\nvUv*=uTexScale;');
  };
  mat.customProgramCacheKey = function () { return 'tri' + scale; };
  TRIMATS.push(mat);
}

/* ═══════════════ BUILD THE INSTANCED MESHES ═════════════════════ */
const pickables = [];
let TOTAL = 0;
for (const k in G) {
  const g = G[k], n = g.list.length;
  TOTAL += n;
  if (!n) continue;
  const df = g.def, rec = MAT[k] || {};
  const mat = new TH.MeshStandardMaterial({
    color: df.c,
    roughness: rec.r === undefined ? .82 : rec.r,
    metalness: rec.m || 0,
    side: TWOSIDE[k] ? TH.DoubleSide : TH.FrontSide,
    transparent: rec.o !== undefined,
    opacity: rec.o === undefined ? 1 : rec.o,
    envMapIntensity: rec.env === undefined ? .6 : rec.env,
    emissive: df.e || 0x000000,
    emissiveIntensity: df.ei || 0
  });
  if (rec.tex && TEX[rec.tex]) {
    mat.map = TEX[rec.tex].map;
    if (TEX[rec.tex].nrm) {
      mat.normalMap = TEX[rec.tex].nrm;
      mat.normalScale = new TH.Vector2(.85, .85);
    }
    triplanar(mat, rec.ts || .3);
  }
  mat.userData = { o: rec.o === undefined ? 1 : rec.o, xr: rec.xr, dw: !rec.o };
  const mesh = new TH.InstancedMesh(g.geo, mat, n);
  mesh.frustumCulled = false;
  mesh.castShadow = !!rec.sh;
  mesh.receiveShadow = !!rec.sh;
  mesh.userData.group = k;
  if (g.list.some(o => o.c)) {
    mesh.instanceColor = new TH.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const cc = new TH.Color(), base = new TH.Color(df.c);
    g.list.forEach((o, i) => {
      if (o.c) cc.setRGB(o.c[0], o.c[1], o.c[2]);
      else { cc.copy(base); const j = (R() - .5) * .07; cc.offsetHSL(0, 0, j); }
      mesh.instanceColor.setXYZ(i, cc.r, cc.g, cc.b);
    });
    mesh.instanceColor.needsUpdate = true;
    mat.color.setHex(0xffffff);
  } else if (n > 8 && k !== 'glass' && k !== 'water' && k !== 'glow') {
    /* subtle per-piece tonal variation kills the "moulded plastic" look */
    mesh.instanceColor = new TH.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const cc = new TH.Color(), base = new TH.Color(df.c);
    for (let i = 0; i < n; i++) {
      cc.copy(base).offsetHSL((R() - .5) * .012, (R() - .5) * .05, (R() - .5) * .085);
      mesh.instanceColor.setXYZ(i, cc.r, cc.g, cc.b);
    }
    mesh.instanceColor.needsUpdate = true;
    mat.color.setHex(0xffffff);
  }
  g.mesh = mesh; g.mat = mat;
  scene.add(mesh); pickables.push(mesh);
  g.list.forEach(o => { o._st = -1; });
}

/* ═══════════════ PER-INSTANCE TRANSFORMS ════════════════════════ */
const _q = new TH.Quaternion(), _e = new TH.Euler(), _v = new TH.Vector3(), _s = new TH.Vector3(), _m = new TH.Matrix4();
const HIDE = new TH.Matrix4().compose(new TH.Vector3(0, -99999, 0), new TH.Quaternion(), new TH.Vector3(0, 0, 0));

function writeInstance(o, u, v, mesh, i) {
  let sx = o.s[0], sy = o.s[1], sz = o.s[2];
  let px2 = o.p[0], py = o.p[1], pz = o.p[2];
  if (u < 1) {
    const e = Math.max(easeOut(u), .001);
    switch (o.a) {
      case 'rise': { const ny = sy * e; py -= (sy - ny) / 2; sy = ny; break; }
      case 'drop': py += (1 - easeInOut(u)) * (o.h || 22); break;
      case 'ext': {
        let ax = 0, ay = 0, az = 0;
        if (o.ax === 'x') { const n2 = sx * e; ax = (o.sg || 1) * (sx - n2) / 2; sx = n2; }
        else if (o.ax === 'z') { const n2 = sz * e; az = (o.sg || 1) * (sz - n2) / 2; sz = n2; }
        else { const n2 = sy * e; ay = (o.sg || 1) * (sy - n2) / 2; sy = n2; }
        if (o.r) { _v.set(ax, ay, az).applyEuler(_e.set(o.r[0], o.r[1], o.r[2])); px2 += _v.x; py += _v.y; pz += _v.z; }
        else { px2 += ax; py += ay; pz += az; }
        break;
      }
      case 'slide': { const f = o.off || [0, 0, 0], kk = 1 - easeOut(u); px2 += f[0] * kk; py += f[1] * kk; pz += f[2] * kk; break; }
      default: sx *= e; sy *= e; sz *= e;
    }
  }
  if (v > 0) { const kk = 1 - v; sx *= kk; sy *= kk; sz *= kk; py += v * 3.5; }
  if (o.r) _q.setFromEuler(_e.set(o.r[0], o.r[1], o.r[2])); else _q.set(0, 0, 0, 1);
  _m.compose(_v.set(px2, py, pz), _q, _s.set(sx, sy, sz));
  mesh.setMatrixAt(i, _m);
}
function updateGroups() {
  for (const k in G) {
    const g = G[k]; if (!g.mesh) continue;
    const L = g.list, mesh = g.mesh;
    let dirty = false;
    for (let i = 0; i < L.length; i++) {
      const o = L[i];
      const on = layerOn[o.l] !== false;
      let u = o.t1 > o.t0 ? (T - o.t0) / (o.t1 - o.t0) : (T >= o.t0 ? 1 : 0);
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      let v = 0;
      if (o.x0 !== undefined) { v = (T - o.x0) / ((o.x1 - o.x0) || 1e-5); v = v < 0 ? 0 : v > 1 ? 1 : v; }
      const st = (!on || u <= 0 || v >= 1) ? 0 : ((u < 1 || v > 0) ? 1 : 2);
      if (st === 1 || st !== o._st || (xformDirty && st !== 0)) {
        if (st === 0) mesh.setMatrixAt(i, HIDE); else writeInstance(o, u, v, mesh, i);
        o._st = st; dirty = true;
      }
    }
    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  }
}
/* cutaway: fade the enclosure so the systems inside stay legible */
let revealApplied = -1;
function applyReveal() {
  if (Math.abs(reveal - revealApplied) < .004) return;
  revealApplied = reveal;
  for (const k in G) {
    const g = G[k]; if (!g.mat) continue;
    const xr = g.mat.userData.xr; if (xr === undefined) continue;
    const base = g.mat.userData.o;
    const op = lerp(base, xr, reveal);
    const tr = op < .995;
    if (g.mat.transparent !== tr) { g.mat.transparent = tr; g.mat.needsUpdate = true; }
    g.mat.opacity = op;
    g.mat.depthWrite = g.mat.userData.dw && !tr;
  }
}
function computeReveal() {
  if (cutMode === 'on') return .95;
  if (cutMode === 'off') return 0;
  return sat(smooth(pw(224, 244)) - smooth(pw(340, 362))) * .9;
}
