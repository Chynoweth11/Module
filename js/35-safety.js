/* ═════════════════════════════════════════════════════════════════
   35 · site safety systems

   The scene previously showed people standing in an open excavation
   with no protective system, framers on a leading edge with no
   guardrail, roofers with nothing to tie off to, masons finishing a
   two-storey wall off no scaffold at all, and an unbarricaded dig
   with a public road running past it. Everything here is the
   protection that has to exist for the work in the frame to be legal
   and survivable, scheduled to the phase that requires it.
   ═════════════════════════════════════════════════════════════════ */
GD.safety = { c: 0xe0621f, r: .93 };
GD.cone = { c: 0xe4551a, r: .86, g: 'cone' };
GD.tape = { c: 0xe8c122, r: .82 };
['safety', 'cone', 'tape'].forEach(k => {
  G[k] = { key: k, list: [], def: GD[k], geo: GD[k].g === 'cone' ? geoCone : geoBox };
});

/* ── 1 · trench protective system ────────────────────────────────
   Anything over 5 ft deep needs a shield, a slope or shoring, plus a
   means of egress within 25 ft of every worker.                     */
(function trenchProtection() {
  const A = PH.underground.t0 - .002, B = PH.underground.t1;
  const OUT = PH.slab.t0 - .004, OUT1 = PH.slab.t0 + .004;
  const mBox = { n: 'Trench shield (trench box)', s: 'excavation', d: 'Steel shield set in the trench so the walls cannot come in on anyone. Required in any trench deeper than 5 ft that is not sloped or benched — a cubic yard of soil weighs about as much as a car.' };
  const mLad = { n: 'Trench egress ladder', s: 'excavation', d: 'Ladder extending 3 ft above the trench lip, placed so no one is ever more than 25 ft from a way out.' };
  let n = 0;
  TRENCH.forEach((t, ti) => {
    const L = Math.hypot(t[2] - t[0], t[3] - t[1]);
    const ang = Math.atan2(t[2] - t[0], t[3] - t[1]);
    const cnt = Math.max(1, Math.round(L / 24));
    for (let k = 0; k < cnt; k++) {
      const u = (k + .5) / cnt;
      const x = lerp(t[0], t[2], u), z = lerp(t[1], t[3], u);
      const w = seq(A, A + (B - A) * .4, 12, .3)((n++) % 12);
      const gy = groundY(x, z);
      [-1, 1].forEach(sg => P('steel', {
        p: [x + Math.cos(ang) * sg * t[4] * .62, gy + 1.6, z - Math.sin(ang) * sg * t[4] * .62],
        s: [.22, 3.6, 15], r: [0, ang, 0], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
        l: 'excavation', a: 'grow', m: mBox
      }));
      [-5, 5].forEach(off => P('steel', {
        p: [x + Math.sin(ang) * off, gy + 2.6, z + Math.cos(ang) * off],
        s: [t[4] * 1.3, .3, .3], r: [0, ang, 0], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
        l: 'excavation', a: 'grow', m: mBox
      }));
      /* egress ladder at every shield */
      P('lumber', {
        p: [x + Math.cos(ang) * t[4] * .5, gy + .4, z - Math.sin(ang) * t[4] * .5],
        s: [.9, 7.2, .3], r: [0, ang, .22], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
        l: 'excavation', a: 'rise', m: mLad
      });
    }
  });
})();

/* ── 2 · excavation barricade, signage and access ────────────────
   An open excavation next to a drive has to be guarded, and people
   need a way in and out that is not the side of the hole.           */
(function excavationGuard() {
  const A = PH.excavate.t0 - .002, B = PH.excavate.t0 + .02;
  const OUT = PH.slab.t0, OUT1 = PH.slab.t0 + .008;
  const ring = [[-46, -34], [40, -34], [40, 36], [-46, 36]];
  const mFence = { n: 'Excavation barricade', s: 'excavation', d: 'High-visibility barrier fence set back from the edge with warning signage, so nobody walks into an open excavation. Spoil is stockpiled at least 2 ft back from the lip.' };
  let n = 0;
  for (let i = 0; i < 4; i++) {
    const a = ring[i], b = ring[(i + 1) % 4];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), cnt = Math.round(L / 8);
    const ax = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
    for (let k = 0; k < cnt; k++) {
      if (i === 3 && k === Math.round(cnt * .5)) continue;   /* access point */
      const u = (k + .5) / cnt;
      const x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u);
      const w = seq(A, B, 20, .3)((n++) % 20);
      const gy = groundY(x, z);
      P('safety', {
        p: [x, gy + 2.0, z], s: ax ? [L / cnt * .94, 3.4, .12] : [.12, 3.4, L / cnt * .94],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'excavation', a: 'rise', m: mFence
      });
      if (n % 3 === 0) P('stake', {
        p: [x, gy + 1.9, z], s: [.2, 4.4, .2], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
        l: 'excavation', a: 'rise', m: mFence
      });
    }
  }
  /* graded access ramp into the dig for equipment and people */
  for (let i = 0; i < 7; i++) {
    const x = -50 + i * 3.4, z = 30 - i * 1.1;
    const w = seq(A, B, 7, .3)(i);
    P('gravel', {
      p: [x, groundY(x, z) + .6, z], s: [6, 1.2, 9], r: [0, .3, 0],
      t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'excavation', a: 'grow',
      m: { n: 'Excavation access ramp', s: 'excavation', d: 'Graded ramp no steeper than 3:1 so equipment and crews enter the dig without scrambling the slope.' }
    });
  }
})();

/* ── 3 · leading-edge fall protection ────────────────────────────
   Guardrail at every open edge above 6 ft — the framed deck, the
   stair opening, and the second-floor perimeter.                    */
(function fallProtection() {
  const A = PH.framing.t0 + (PH.framing.t1 - PH.framing.t0) * .5, B = PH.framing.t1;
  const OUT = PH.openings.t1 - .006, OUT1 = PH.openings.t1;
  const mRail = { n: 'Guardrail system', s: 'framing', d: 'Top rail at 42", mid rail and toe board at every open edge over 6 ft. Goes up as the deck is sheathed and stays until the permanent wall and glass replace it.' };
  const edges = [
    [TOWER.x0, TOWER.z0, TOWER.x1, TOWER.z0], [TOWER.x0, TOWER.z1, TOWER.x1, TOWER.z1],
    [TOWER.x0, TOWER.z0, TOWER.x0, TOWER.z1], [TOWER.x1, TOWER.z0, TOWER.x1, TOWER.z1]
  ];
  let n = 0;
  edges.forEach(e => {
    const ax = Math.abs(e[2] - e[0]) > Math.abs(e[3] - e[1]);
    const L = Math.hypot(e[2] - e[0], e[3] - e[1]), cnt = Math.max(2, Math.round(L / 7));
    for (let k = 0; k < cnt; k++) {
      const u = (k + .5) / cnt;
      const x = lerp(e[0], e[2], u), z = lerp(e[1], e[3], u);
      const w = seq(A, B, 16, .3)((n++) % 16);
      [[3.5, .28], [1.9, .22]].forEach(r => P('lumber', {
        p: [x, TOWER.plate + r[0], z], s: ax ? [L / cnt, r[1], .22] : [.22, r[1], L / cnt],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'framing', a: 'grow', m: mRail
      }));
      P('osb', {
        p: [x, TOWER.plate + .55, z], s: ax ? [L / cnt, .9, .18] : [.18, .9, L / cnt],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'framing', a: 'grow', m: mRail
      });
      P('lumber', {
        p: [x - (ax ? L / cnt / 2 : 0), TOWER.plate + 2, z - (ax ? 0 : L / cnt / 2)], s: [.28, 4, .28],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'framing', a: 'rise', m: mRail
      });
    }
  });
  /* stair opening guarded until the stair and its guard go in */
  for (let i = 0; i < 5; i++) {
    const w = seq(A, B, 5, .3)(i);
    P('lumber', {
      p: [-11.4, FF + 3.5, -18 + i * 3.2], s: [.24, .26, 3.1], t0: w[0], t1: w[1],
      x0: PH.interior.t0 + .01, x1: PH.interior.t0 + .02, l: 'framing', a: 'grow',
      m: { n: 'Floor opening guard', s: 'framing', d: 'Every floor opening is either covered and marked or guarded on all exposed sides until the permanent stair and guard are installed.' }
    });
  }
})();

/* ── 4 · roof anchors and horizontal lifeline ────────────────────  */
(function roofSafety() {
  const A = PH.roofstruct.t0, B = PH.roofstruct.t0 + .01;
  const OUT = PH.roofing.t1, OUT1 = PH.roofing.t1 + .006;
  const mLine = { n: 'Horizontal lifeline', s: 'roofing', d: 'Engineered anchors at the ridge with a horizontal lifeline between them. Everyone working the roof plane is tied off to it with a shock-absorbing lanyard.' };
  ROOFS.forEach((rf, ri) => {
    const n = Math.max(2, Math.round((rf.x1 - rf.x0) / 12));
    for (let i = 0; i <= n; i++) {
      const x = rf.x0 + i * (rf.x1 - rf.x0) / n;
      const w = seq(A, B, n + 1, .3)(Math.min(i, n));
      P('steel', {
        p: [x, rf.plate + rf.rise + 1.1, rf.zc], s: [.26, 2.2, .26],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'roofing', a: 'rise', m: mLine
      });
    }
    P('steel', {
      p: [(rf.x0 + rf.x1) / 2, rf.plate + rf.rise + 2.0, rf.zc], s: [rf.x1 - rf.x0, .1, .1],
      t0: B, t1: B + .004, x0: OUT, x1: OUT1, l: 'roofing', a: 'ext', ax: 'x', sg: -1, m: mLine
    });
  });
})();

/* ── 5 · scaffold for the exterior finish ────────────────────────
   Masons and plasterers were working a two-storey elevation off
   nothing. Frames on mud sills and base plates, planked out, with a
   full guardrail and toe board at every working level.              */
(function scaffold() {
  const A = PH.exteriorfin.t0 - .006, B = PH.exteriorfin.t0 + .014;
  const OUT = PH.exteriorfin.t1 - .004, OUT1 = PH.exteriorfin.t1 + .004;
  const mSc = { n: 'Frame scaffold', s: 'enclosure', d: 'Scaffold frames on base plates and mud sills, plumb and tied to the structure, fully planked with guardrail, mid rail and toe board at each working level. Access is by an internal ladder, never by climbing the frame.' };
  let n = 0;
  WALLS.filter(w => w.ext && w.y0 === FF && w.L > 12).forEach(wl => {
    const ax = Math.abs(wl.ux) > .5;
    const bays = Math.max(2, Math.round(wl.L / 7));
    for (let b = 0; b < bays; b++) {
      const s = (b + .5) * wl.L / bays;
      const p = ptOn(wl, s, wl.t / 2 + 3.4);
      const gy = groundY(p[0], p[1]);
      const w = seq(A, B, 18, .28)((n++) % 18);
      /* mud sill + base plates */
      P('lumber', {
        p: [p[0], gy + .18, p[1]], s: ax ? [wl.L / bays * .9, .36, 2.4] : [2.4, .36, wl.L / bays * .9],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'enclosure', a: 'grow', m: mSc
      });
      /* two lifts of frames */
      for (let lift = 0; lift < 2; lift++) {
        const y0 = gy + .4 + lift * 6.4;
        [-1, 1].forEach(sg => P('steel', {
          p: [p[0] + (ax ? sg * wl.L / bays * .42 : 0), y0 + 3.2, p[1] + (ax ? 0 : sg * wl.L / bays * .42)],
          s: [.22, 6.4, .22], t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'enclosure', a: 'rise', m: mSc
        }));
        /* plank deck */
        P('lumber', {
          p: [p[0], y0 + 6.4, p[1]], s: ax ? [wl.L / bays * .96, .26, 2.2] : [2.2, .26, wl.L / bays * .96],
          t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'enclosure', a: 'grow', m: mSc
        });
        /* guardrail, mid rail, toe board on the open side */
        const off = wl.t / 2 + 4.5;
        const q = ptOn(wl, s, off);
        [[3.5, .2], [1.9, .18]].forEach(r => P('steel', {
          p: [q[0], y0 + 6.4 + r[0], q[1]], s: ax ? [wl.L / bays * .96, r[1], .18] : [.18, r[1], wl.L / bays * .96],
          t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'enclosure', a: 'grow', m: mSc
        }));
        P('lumber', {
          p: [q[0], y0 + 6.9, q[1]], s: ax ? [wl.L / bays * .96, .8, .16] : [.16, .8, wl.L / bays * .96],
          t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'enclosure', a: 'grow', m: mSc
        });
      }
    }
  });
})();

/* ── 6 · traffic control and site access ─────────────────────────  */
(function trafficControl() {
  const A = PH.clearing.t0, B = PH.clearing.t0 + .01;
  const OUT = PH.sitework.t1 - .01, OUT1 = PH.sitework.t1;
  const mCone = { n: 'Traffic delineator', s: 'site', d: 'Cones and signage channel truck traffic in and out of the one controlled entrance, keeping deliveries off the road shoulder and out of the work area.' };
  for (let i = 0; i < 16; i++) {
    const u = i / 15;
    const x = lerp(-108, -66, u) + (i % 2 ? 0 : 2);
    const z = lerp(14, 12, u) + (i % 2 ? 13 : -13);
    const w = seq(A, B, 16, .3)(i);
    P('cone', {
      p: [x, groundY(x, z) + 1.1, z], s: [2.4, 2.6, 2.4], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
      l: 'site', a: 'rise', m: mCone
    });
  }
  [[-98, 26, 'TRUCK ENTRANCE'], [-98, 0, 'HARD HAT AREA']].forEach((s2, i) => {
    const w = seq(A, B, 2, .3)(i);
    P('stake', {
      p: [s2[0], groundY(s2[0], s2[1]) + 3, s2[1]], s: [.3, 6, .3], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
      l: 'site', a: 'rise', m: { n: s2[2] + ' sign', s: 'site', d: 'Posted at the entrance: PPE requirement, authorised personnel only, and the emergency contact list.' }
    });
    P('safety', {
      p: [s2[0], groundY(s2[0], s2[1]) + 6.6, s2[1]], s: [4.4, 3, .18], t0: w[0], t1: w[1], x0: OUT, x1: OUT1,
      l: 'site', a: 'grow', m: { n: s2[2] + ' sign', s: 'site', d: 'Posted at the entrance: PPE requirement, authorised personnel only, and the emergency contact list.' }
    });
  });
  /* caution tape across the wet slab pour */
  for (let i = 0; i < 10; i++) {
    const x = -34 + i * 7;
    const w = seq(PH.slab.t0 + .006, PH.slab.t0 + .012, 10, .3)(i);
    P('tape', {
      p: [x, 3.2, -26], s: [6.9, .22, .05], t0: w[0], t1: w[1],
      x0: PH.slab.t1 - .004, x1: PH.slab.t1, l: 'concrete', a: 'grow',
      m: { n: 'Barricade tape', s: 'concrete', d: 'Fresh concrete barricaded off until it has set — a footprint in a slab is a repair, and a fall onto rebar is not.' }
    });
  }
})();

/* ── 7 · site perimeter fence (instanced) ────────────────────────
   A six-foot fence around the whole site with one controlled entry.
   Instanced rather than built as several hundred separate meshes.  */
GD.fence = { c: 0xb4bbc1, r: .78, m: .3 };
GD.fpost = { c: 0x8c949b, r: .6, m: .45, g: 'cyl' };
['fence', 'fpost'].forEach(k => {
  G[k] = { key: k, list: [], def: GD[k], geo: GD[k].g === 'cyl' ? geoCyl : geoBox };
});
(function perimeterFence() {
  const A = PH.clearing.t0 + .002, B = PH.clearing.t0 + .016;
  const OUT = PH.sitework.t0 + .01, OUT1 = PH.sitework.t0 + .026;
  const pts = [[-84, -54], [78, -54], [78, 62], [-84, 62]];
  const mF = { n: 'Site perimeter fence', s: 'site', d: 'Six-foot fence around the entire site with a single controlled entrance, warning signage at intervals, and the gate closed and locked outside working hours. It keeps the public — and children — out of an active construction site.' };
  let n = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const cnt = Math.max(2, Math.round(L / 11.6));
    const ax = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
    for (let k = 0; k < cnt; k++) {
      if (i === 0 && k === Math.round(cnt * .16)) continue;    /* controlled gate */
      const u = (k + .5) / cnt;
      const x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u);
      const gy = groundY(x, z);
      const seg = L / cnt;
      const w = seq(A, B, 26, .3)((n++) % 26);
      P('fence', {
        p: [x, gy + 3.6, z], s: ax ? [seg * .96, 6.6, .14] : [.14, 6.6, seg * .96],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'site', a: 'rise', m: mF
      });
      [-1, 1].forEach(sg => P('fpost', {
        p: [x + (ax ? sg * seg * .48 : 0), gy + 3.7, z + (ax ? 0 : sg * seg * .48)],
        s: [.36, 7.4, .36], t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'site', a: 'rise', m: mF
      }));
      if (n % 5 === 0) P('safety', {
        p: [x + (ax ? 0 : .16), gy + 4.6, z + (ax ? .16 : 0)],
        s: ax ? [2.6, 1.9, .1] : [.1, 1.9, 2.6],
        t0: w[0], t1: w[1], x0: OUT, x1: OUT1, l: 'site', a: 'grow',
        m: { n: 'Perimeter warning sign', s: 'site', d: 'DANGER — construction site, authorised personnel only, PPE required beyond this point.' }
      });
    }
  }
})();
