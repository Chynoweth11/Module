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
  bronze:  { c: 0x6e5637, r: .38, m: .88 },
  glass:   { c: 0x9ec3d6, r: .06, m: .1, o: .3, xr: .07 },
  oak:     { c: 0xa87a3e, r: .68 },
  marble:  { c: 0xd9d6d0, r: .28, m: .04 },
  tileI:   { c: 0xa8a196, r: .5 },
  fixture: { c: 0xeef1f3, r: .22 },
  appl:    { c: 0x8b939a, r: .3, m: .82 },
  fabric:  { c: 0x6b6a63, r: 1 },
  paver:   { c: 0x8c8983, r: .92 },
  asph:    { c: 0x3c3e40, r: .96 },
  mulch:   { c: 0x4a3729, r: 1 },
  trunk:   { c: 0x4d3c2d, r: .95, g: 'cyl' },
  conifer: { c: 0x2f5235, r: .96, g: 'cone' },
  leafy:   { c: 0x466f33, r: .96, g: 'sph' },
  water:   { c: 0x2b7f9e, r: .05, m: .25, o: .78 },
  stake:   { c: 0xe0c878, r: .9 },
  strline: { c: 0xe05a4a, r: .8 },
  glow:    { c: 0xffd9a0, r: .4, e: 0xffb45a, ei: 2.2 },
  temp:    { c: 0xc3c9cd, r: .8 },
  tarmac:  { c: 0x555b60, r: .95 }
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
/* push an instance */
function P(g, o) { G[g].list.push(o); return o; }

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
  wall(-8, -24, -8, 2, 13.7, 11, 'ext2', [[9, 20, 2.8, 9.6, 'win']]),
  wall(-8, 2, -32, 2, 13.7, 11, 'ext2', [[6, 17, 2.8, 9.6, 'win']]),
  wall(-32, 2, -32, -24, 13.7, 11, 'ext2', [[8, 18, 2.8, 9.6, 'win']]),
  /* ── main level, interior partitions ── */
  wall(-8, -24, -8, 16, FF, 12, 'int', [[16, 22, 0, 8, 'door'], [30, 36, 0, 8.4, 'door']]),
  wall(-8, 16, 18, 16, FF, 12, 'int', [[6, 13, 0, 8.4, 'door']]),
  wall(8, 16, 8, -24, FF, 12, 'int', [[9, 14, 0, 8, 'door']]),
  wall(18, -10, 30, -10, FF, 12, 'int', [[3, 8, 0, 8, 'door']]),
  wall(-20, -24, -20, 2, FF, 12, 'int', [[12, 17, 0, 8, 'door']]),
  wall(-32, 2, -20, 2, FF, 12, 'int', []),
  wall(8, 0, 18, 0, FF, 12, 'int', [[3, 8, 0, 8, 'door']]),
  /* ── upper level, interior ── */
  wall(-20, -24, -20, 2, 13.7, 11, 'int', [[10, 15, 0, 7.6, 'door']]),
  wall(-32, -10, -8, -10, 13.7, 11, 'int', [[9, 14, 0, 7.6, 'door']])
];
/* slab / floor plates: [x0,z0,x1,z1] */
const PLATES = [[-32, -24, 30, 24], [-6, 24, 18, 38], [30, -24, 58, 0]];
/* roof planes: gables described by ridge line + eave */
const ROOFS = [
  { x0: -8, x1: 30, zc: 0, half: 24, plate: 13.7, rise: 10.0, ov: 2.6, mat: 'slate', key: 'main' },
  { x0: -6, x1: 18, zc: 31, half: 7, plate: 15.2, rise: 3.4, ov: 2.2, mat: 'slate', key: 'great' },
  { x0: 30, x1: 58, zc: -12, half: 12, plate: 12.2, rise: 4.4, ov: 2.2, mat: 'seam', key: 'garage' }
];
const TOWER = { x0: -32, x1: -8, z0: -24, z1: 2, deck: 24.9, plate: 13.7 };

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
