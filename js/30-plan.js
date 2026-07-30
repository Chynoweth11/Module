/* ═════════════════════════════════════════════════════════════════
   30 · site & building plan + instanced element registry
   One InstancedMesh per material. Unit box / cylinder geometry gets
   scaled per instance, so studs, pipes, panels and pavers all share
   a handful of draw calls. Every instance stores its own build window
   [t0,t1] and optional removal window [x0,x1].
   ═════════════════════════════════════════════════════════════════ */
const GD = {
  lumber:  { c: 0xd6ae74, r: .87 },
  beam:    { c: 0xa9814f, r: .84 },
  steel:   { c: 0x555e69, r: .42, m: .85 },
  osb:     { c: 0xc5a271, r: .94, xr: .10 },
  conc:    { c: 0xa2a5a6, r: .93 },
  form:    { c: 0xb98a3c, r: .9 },
  rebar:   { c: 0x8a5334, r: .62, m: .5, g: 'cyl' },
  gravel:  { c: 0x77726a, r: 1 },
  abs:     { c: 0x24282c, r: .55, g: 'cyl' },
  pvc:     { c: 0xdfe4e6, r: .5, g: 'cyl' },
  copper:  { c: 0xb2703c, r: .34, m: .8, g: 'cyl' },
  conduit: { c: 0x9aa1a8, r: .45, m: .6, g: 'cyl' },
  duct:    { c: 0xb6bdc4, r: .38, m: .78 },
  flex:    { c: 0x8d959d, r: .8, g: 'cyl' },
  gear:    { c: 0x767d85, r: .5, m: .6 },
  insul:   { c: 0xd98ca6, r: 1 },
  foam:    { c: 0xe0dcc4, r: 1 },
  gwb:     { c: 0xe9e5dc, r: .95, xr: .07 },
  slate:   { c: 0x49515a, r: .78, xr: .06 },
  seam:    { c: 0x6f767e, r: .42, m: .7, xr: .06 },
  memb:    { c: 0x2e3236, r: .9, xr: .05 },
  wrap:    { c: 0xcfd6da, r: .9, xr: .08 },
  stone:   { c: 0x7f766a, r: .95, xr: .09 },
  stucco:  { c: 0xd9d3c6, r: .93, xr: .09 },
  cedar:   { c: 0x8d5f38, r: .8, xr: .12 },
  bronze:  { c: 0x5f5340, r: .55, m: .34 },
  glass:   { c: 0x9ec3d6, r: .06, m: .1, o: .3, xr: .07 },
  oak:     { c: 0xa87a3e, r: .68 },
  marble:  { c: 0xd9d6d0, r: .28, m: .04 },
  fixture: { c: 0xeef1f3, r: .22 },
  appl:    { c: 0x8b939a, r: .3, m: .82 },
  fabric:  { c: 0x6b6a63, r: 1 },
  paver:   { c: 0x8c8983, r: .92 },
  mulch:   { c: 0x4a3729, r: 1 },
  trunk:   { c: 0x4d3c2d, r: .95, g: 'cyl' },
  conifer: { c: 0x2f5235, r: .96, g: 'cone' },
  leafy:   { c: 0x466f33, r: .96, g: 'sph' },
  water:   { c: 0x2b7f9e, r: .05, m: .25, o: .78 },
  stake:   { c: 0xe0c878, r: .9 },
  strline: { c: 0xe05a4a, r: .8 },
  glow:    { c: 0xffd9a0, r: .4, e: 0xffb45a, ei: 2.2 }
};
const G = {};
const geoBox = new TH.BoxGeometry(1, 1, 1);
const geoCyl = new TH.CylinderGeometry(.5, .5, 1, 10, 1);
const geoCone = new TH.ConeGeometry(.5, 1, 9, 1);
const geoSph = new TH.SphereGeometry(.5, 10, 7);
for (const k in GD) {
  const s = GD[k];
  G[k] = {
    key: k, list: [], def: s,
    geo: s.g === 'cyl' ? geoCyl : s.g === 'cone' ? geoCone : s.g === 'sph' ? geoSph : geoBox
  };
}
/* push an instance — exact duplicates (same group, place, size, time)
   are dropped so nothing ever z-fights with a copy of itself */
const _seenP = {};
function P(g, o) {
  const k = g + '|' + o.p[0].toFixed(3) + ',' + o.p[1].toFixed(3) + ',' + o.p[2].toFixed(3) +
    '|' + o.s[0].toFixed(3) + ',' + o.s[1].toFixed(3) + ',' + o.s[2].toFixed(3);
  if (_seenP[k]) return o;
  _seenP[k] = 1;
  G[g].list.push(o);
  return o;
}

/* triangular prism geometry for gable ends */
const geoTri = (function () {
  const g = new TH.BufferGeometry();
  const v = [];
  const A = [-.5, -.5], B = [.5, -.5], C = [0, .5];
  [[A, B, C], [B, A, C]].forEach((tri, s) => {
    const z = s ? -.5 : .5;
    tri.forEach(p => v.push(p[0], p[1], z));
  });
  const P0 = [A, B, C];
  for (let i = 0; i < 3; i++) {
    const a = P0[i], b = P0[(i + 1) % 3];
    v.push(a[0], a[1], .5, b[0], b[1], .5, b[0], b[1], -.5);
    v.push(a[0], a[1], .5, b[0], b[1], -.5, a[0], a[1], -.5);
  }
  g.setAttribute('position', new TH.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
})();
['triOsb', 'triFin', 'triLum'].forEach((k, i) => {
  const base = [GD.osb, GD.stucco, GD.lumber][i];
  GD[k] = Object.assign({}, base);
  G[k] = { key: k, list: [], def: GD[k], geo: geoTri };
});

/* ═══════════════ SITE / BUILDING PLAN ════════════════════════════ */
const FF = 1.5;            // finish floor elevation
const WT = 0.52, IT = 0.36; // exterior / interior wall thickness

function wall(x1, z1, x2, z2, y0, h, kind, ops) {
  const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
  return {
    x1, z1, x2, z2, y0, h, kind, L, ops: ops || [],
    ux: dx / L, uz: dz / L, nx: -dz / L, nz: dx / L,
    t: kind === 'int' ? IT : WT, ext: kind !== 'int'
  };
}
/* opening: [startDist, endDist, sill, head, type] */
const WALLS = [
  /* ── main level, exterior ── */
  wall(-32, -24, 30, -24, FF, 12, 'ext', [[7, 20, 3.4, 10.5, 'win'], [26, 33, 0, 8.6, 'door'], [40, 55, 3.4, 11, 'win']]),
  wall(30, -24, 30, 24, FF, 12, 'ext', [[28, 42, 3.4, 10.5, 'win']]),
  wall(30, 24, 18, 24, FF, 12, 'ext', []),
  wall(18, 24, 18, 38, FF, 15, 'ext', [[3, 12, 2.6, 12.4, 'win']]),
  wall(18, 38, -6, 38, FF, 15, 'ext', [[3, 21, 2.6, 12.4, 'slider']]),
  wall(-6, 38, -6, 24, FF, 15, 'ext', [[2, 11, 2.6, 12.4, 'win']]),
  wall(-6, 24, -32, 24, FF, 12, 'ext', [[4, 13, 3.4, 10.5, 'win'], [17, 23, 3.4, 10.5, 'win']]),
  wall(-32, 24, -32, -24, FF, 12, 'ext', [[9, 19, 3.4, 10.5, 'win'], [30, 40, 3.4, 10.5, 'win']]),
  /* ── garage wing ── */
  wall(30, -24, 58, -24, FF, 11, 'ext', [[4, 14, 0, 9, 'garage'], [17, 27, 0, 9, 'garage']]),
  wall(58, -24, 58, 0, FF, 11, 'ext', [[15, 21, 3.4, 9, 'win']]),
  wall(58, 0, 30, 0, FF, 11, 'ext', [[8, 12, 0, 8, 'door']]),
  /* ── upper level (tower over the west wing) ── */
  wall(-32, -24, -8, -24, 13.7, 11, 'ext2', [[5, 12, 2.8, 9.6, 'win'], [16, 21, 2.8, 9.6, 'win']]),
  wall(-8, -24, -8, 24, 13.7, 11, 'ext2', [[9, 20, 2.8, 9.6, 'win'], [30, 41, 2.8, 9.6, 'win']]),
  wall(-8, 24, -32, 24, 13.7, 11, 'ext2', [[6, 17, 2.8, 9.6, 'win']]),
  wall(-32, 24, -32, -24, 13.7, 11, 'ext2', [[8, 18, 2.8, 9.6, 'win'], [30, 40, 2.8, 9.6, 'win']]),
  /* ── main level, interior partitions ── */
  wall(-8, -24, -8, 16, FF, 12, 'int', [[16, 22, 0, 8, 'door'], [30, 36, 0, 8.4, 'door']]),
  wall(-8, 16, 18, 16, FF, 12, 'int', [[6, 13, 0, 8.4, 'door']]),
  wall(8, 16, 8, -24, FF, 12, 'int', [[9, 14, 0, 8, 'door']]),
  wall(18, -10, 30, -10, FF, 12, 'int', [[3, 8, 0, 8, 'door']]),
  wall(-20, -24, -20, 2, FF, 12, 'int', [[12, 17, 0, 8, 'door']]),
  wall(-32, 2, -20, 2, FF, 12, 'int', []),
  wall(8, 0, 18, 0, FF, 12, 'int', [[3, 8, 0, 8, 'door']]),
  /* ── upper level, interior ── */
  wall(-20, -24, -20, 24, 13.7, 11, 'int', [[10, 15, 0, 7.6, 'door'], [32, 37, 0, 7.6, 'door']]),
  wall(-32, -10, -8, -10, 13.7, 11, 'int', [[9, 14, 0, 7.6, 'door']])
];
/* slab / floor plates: [x0,z0,x1,z1] */
const PLATES = [[-32, -24, 30, 24], [-6, 24, 18, 38], [30, -24, 58, 0]];
/* roof planes: gables described by ridge line + eave */
const ROOFS = [
  /* main gable stops against the two-storey west wing. ng skips the gable
     end that lands inside it; ovx0 kills the rake overhang on that side so
     the roof does not poke through the tower wall. */
  { x0: -8, x1: 30, zc: 0, half: 24, plate: 13.7, rise: 10.0, ov: 2.6, ovx0: 0, mat: 'slate', key: 'main', ng: [0] },
  { x0: -6, x1: 18, zc: 31, half: 7, plate: 15.2, rise: 3.4, ov: 2.2, mat: 'slate', key: 'great' },
  { x0: 30, x1: 58, zc: -12, half: 12, plate: 12.2, rise: 4.4, ov: 2.2, mat: 'seam', key: 'garage' },
];
const TOWER = { x0: -32, x1: -8, z0: -24, z1: 24, deck: 24.9, plate: 13.7 };

function openingAt(w, s, y) {
  for (let i = 0; i < w.ops.length; i++) {
    const o = w.ops[i];
    if (s > o[0] - .1 && s < o[1] + .1 && y > w.y0 + o[2] - .05 && y < w.y0 + o[3] + .05) return o;
  }
  return null;
}
function inOpenSpan(w, s) {
  for (let i = 0; i < w.ops.length; i++) if (s > w.ops[i][0] && s < w.ops[i][1]) return w.ops[i];
  return null;
}
function ptOn(w, s, off) {
  off = off || 0;
  return [w.x1 + w.ux * s + w.nx * off, w.z1 + w.uz * s + w.nz * off];
}

/* ═══════════════ PANELIZATION ═══════════════════════════════════
   Cladding, sheathing, drywall and insulation used to be laid out on
   a fixed grid and any cell whose CENTRE landed in an opening was
   dropped whole — which punched 3-ft holes around every window and
   let the housewrap and the insulation read straight through the
   finished wall. Instead: take the wall rectangle, subtract each
   opening from it properly, then tile the remainder. Full coverage,
   nothing overlapping the glass, no holes.                          */
function wallRects(w, grow) {
  grow = grow || 0;
  let rects = [{ s0: 0, s1: w.L, y0: w.y0, y1: w.y0 + w.h }];
  for (let i = 0; i < w.ops.length; i++) {
    const op = w.ops[i];
    const o = { s0: op[0] - grow, s1: op[1] + grow, y0: w.y0 + op[2] - grow, y1: w.y0 + op[3] + grow };
    const out = [];
    for (let k = 0; k < rects.length; k++) {
      const r = rects[k];
      if (o.s1 <= r.s0 || o.s0 >= r.s1 || o.y1 <= r.y0 || o.y0 >= r.y1) { out.push(r); continue; }
      if (o.y0 > r.y0) out.push({ s0: r.s0, s1: r.s1, y0: r.y0, y1: o.y0 });
      if (o.y1 < r.y1) out.push({ s0: r.s0, s1: r.s1, y0: o.y1, y1: r.y1 });
      const yb = Math.max(r.y0, o.y0), yt = Math.min(r.y1, o.y1);
      if (yt - yb > .01) {
        if (o.s0 > r.s0) out.push({ s0: r.s0, s1: o.s0, y0: yb, y1: yt });
        if (o.s1 < r.s1) out.push({ s0: o.s1, s1: r.s1, y0: yb, y1: yt });
      }
    }
    rects = [];
    for (let k = 0; k < out.length; k++)
      if (out[k].s1 - out[k].s0 > .1 && out[k].y1 - out[k].y0 > .1) rects.push(out[k]);
  }
  return rects;
}
/* tile the solid part of a wall into panels no bigger than maxW × maxH */
function panelize(w, maxW, maxH, grow) {
  const out = [], ax = Math.abs(w.ux) > .5, rects = wallRects(w, grow);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i], W = r.s1 - r.s0, H = r.y1 - r.y0;
    const nc = Math.max(1, Math.round(W / maxW)), nr = Math.max(1, Math.round(H / maxH));
    const cw = W / nc, ch = H / nr;
    for (let c = 0; c < nc; c++) for (let k = 0; k < nr; k++)
      out.push({ s: r.s0 + (c + .5) * cw, y: r.y0 + (k + .5) * ch, w: cw, h: ch, ax: ax, wall: w });
  }
  return out;
}
/* stud bays that are actually framed (not inside an opening) */
function studBays(w, spacing) {
  const out = [], n = Math.max(2, Math.floor((w.L - .5) / (spacing || 1.333)));
  for (let i = 0; i < n; i++) {
    const s = .3 + (i + .5) * (w.L - .6) / n;
    const op = inOpenSpan(w, s);
    const y0 = op ? w.y0 + op[3] + 1.2 : w.y0 + .3;
    const y1 = w.y0 + w.h - .3;
    if (y1 - y0 < .8) continue;
    out.push({ s: s, y0: y0, y1: y1, ax: Math.abs(w.ux) > .5 });
  }
  return out;
}

/* ═══════════════ SITE KEEP-OUT ZONES ════════════════════════════
   Vegetation was landing on the terraces, inside the driveway and
   straight through the site trailer. Everything the landscape has to
   stay clear of lives here so placement can be tested against it.   */
const KEEPOUT = [
  /* generous enough to clear every eave and rake overhang, not just walls */
  { x0: -42, z0: -34, x1: 68, z1: 48, n: 'building & roof overhangs' },
  { x0: -12, z0: 34, x1: 54, z1: 62, n: 'terrace & pool' },
  { x0: -14, z0: -44, x1: 8, z1: -22, n: 'entry court' },
  { x0: -78, z0: -12, x1: -44, z1: 24, n: 'laydown & trailer' },
  { x0: -60, z0: -46, x1: -34, z1: -26, n: 'sanitation & bins' },
  { x0: 26, z0: -36, x1: 60, z1: -20, n: 'garage apron' },
  { x0: 56, z0: 38, x1: 114, z1: 68, n: 'septic tank & leach field' }
];
const DRIVE_PATH = [[-118, 14], [-70, 12], [-40, 2], [-14, -34], [22, -38], [46, -33]];
function nearDrive(x, z, w) {
  for (let i = 0; i < DRIVE_PATH.length - 1; i++) {
    const a = DRIVE_PATH[i], b = DRIVE_PATH[i + 1];
    if (segDist(x, z, a[0], a[1], b[0], b[1]) < w) return true;
  }
  return false;
}
/* Clearance for a planting, given its height and species. Callers used to
   pass their own pad and forgot the crown, which put trees through walls
   twice. This works the radius out so they cannot. */
function plantClear(x, z, h, conifer) {
  return siteClear(x, z, 5 + h * (conifer ? .24 : .34));
}
function siteClear(x, z, pad) {
  pad = pad === undefined ? 4 : pad;
  for (let i = 0; i < KEEPOUT.length; i++) {
    const k = KEEPOUT[i];
    if (x > k.x0 - pad && x < k.x1 + pad && z > k.z0 - pad && z < k.z1 + pad) return false;
  }
  return !nearDrive(x, z, 13 + pad);
}

/* ═══════════════ BETTER NATURAL GEOMETRY ════════════════════════
   Cones and spheres read as cheap. These merge a few primitives into
   one unit-box geometry so the instancing cost is unchanged.        */
function mergeParts(parts) {
  let n = 0;
  const bufs = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    const m = new TH.Matrix4().compose(
      new TH.Vector3(p.p[0], p.p[1], p.p[2]),
      new TH.Quaternion().setFromEuler(new TH.Euler(p.r ? p.r[0] : 0, p.r ? p.r[1] : 0, p.r ? p.r[2] : 0)),
      new TH.Vector3(p.s[0], p.s[1], p.s[2]));
    g.applyMatrix4(m);
    if (!g.attributes.normal) g.computeVertexNormals();
    bufs.push(g); n += g.attributes.position.count;
  }
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
  let o = 0;
  for (let i = 0; i < bufs.length; i++) {
    pos.set(bufs[i].attributes.position.array, o);
    nrm.set(bufs[i].attributes.normal.array, o);
    o += bufs[i].attributes.position.count * 3;
    bufs[i].dispose();
  }
  const out = new TH.BufferGeometry();
  out.setAttribute('position', new TH.BufferAttribute(pos, 3));
  out.setAttribute('normal', new TH.BufferAttribute(nrm, 3));
  return out;
}
/* layered conifer — five skirts of needles, not one smooth cone */
const geoConifer = (function () {
  const c = new TH.ConeGeometry(.5, 1, 9, 1);
  const parts = [], L = 5;
  for (let i = 0; i < L; i++) {
    const u = i / (L - 1);
    const rad = .5 * (1 - u * .74);
    const hh = .40 - u * .13;
    const y = -.5 + .12 + u * .80;
    parts.push({ geo: c, p: [0, y + hh * .5, 0], s: [rad * 2, hh, rad * 2], r: [0, i * .7, 0] });
  }
  const g = mergeParts(parts);
  c.dispose();
  return g;
})();
/* broadleaf crown — overlapping lobes */
const geoBroadleaf = (function () {
  const s = new TH.SphereGeometry(.5, 8, 6), parts = [], rr = rng(5150);
  parts.push({ geo: s, p: [0, .04, 0], s: [.92, .86, .92] });
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + rr() * .6, r = .24 + rr() * .12;
    parts.push({
      geo: s, p: [Math.cos(a) * r, -.06 + rr() * .34, Math.sin(a) * r],
      s: [.46 + rr() * .24, .42 + rr() * .22, .46 + rr() * .24]
    });
  }
  const g = mergeParts(parts); s.dispose(); return g;
})();
/* irregular boulder */
const geoRock = (function () {
  const g = new TH.IcosahedronGeometry(.5, 1).toNonIndexed();
  const p = g.attributes.position.array, rr = rng(8821);
  const seen = {};
  for (let i = 0; i < p.length; i += 3) {
    const k = (p[i] * 97 | 0) + ',' + (p[i + 1] * 97 | 0) + ',' + (p[i + 2] * 97 | 0);
    if (!seen[k]) seen[k] = [.72 + rr() * .5, .58 + rr() * .34, .72 + rr() * .5];
    const f = seen[k];
    p[i] *= f[0]; p[i + 1] *= f[1]; p[i + 2] *= f[2];
  }
  g.computeVertexNormals();
  return g;
})();
/* shrub — low dense mound */
const geoShrub = (function () {
  const s = new TH.SphereGeometry(.5, 7, 5), parts = [], rr = rng(3311);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU;
    parts.push({ geo: s, p: [Math.cos(a) * .2, -.12 + rr() * .2, Math.sin(a) * .2], s: [.6 + rr() * .2, .5 + rr() * .2, .6 + rr() * .2] });
  }
  const g = mergeParts(parts); s.dispose(); return g;
})();
/* trunks taper — a straight cylinder reads as a dowel */
const geoTrunk = (function () {
  const g = new TH.CylinderGeometry(.32, .5, 1, 9, 1);
  return g;
})();
G.trunk.geo = geoTrunk;
GD.tpo = { c: 0xd2d5d4, r: .74, xr: .06 };
G.tpo = { key: 'tpo', list: [], def: GD.tpo, geo: geoBox };
G.conifer.geo = geoConifer;
G.leafy.geo = geoBroadleaf;
G.shrub = { key: 'shrub', list: [], def: GD.leafy, geo: geoShrub };
GD.shrub = GD.leafy;
G.boulder = { key: 'boulder', list: [], def: GD.stone, geo: geoRock };
GD.boulder = GD.stone;
