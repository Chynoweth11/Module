/* ═════════════════════════════════════════════════════════════════
   50 · actors — crew, equipment, temporary facilities, particles.

   Crew is fully instanced: every worker on site is drawn in eight
   draw calls total instead of eight meshes and eight materials per
   person. Workers are stationed at real work, in PPE, and kept out
   of equipment swing radii.
   ═════════════════════════════════════════════════════════════════ */

/* ── shared material cache: equipment used to allocate a fresh
      MeshStandardMaterial per box, which is hundreds of programs ── */
const _MATC = {};
function pmat(col, rough, met, opts) {
  opts = opts || {};
  const key = col + '|' + rough + '|' + (met || 0) + '|' + (opts.o || 1) + '|' + (opts.e || 0) + '|' + (opts.env === undefined ? 'd' : opts.env);
  let m = _MATC[key];
  if (!m) {
    m = new TH.MeshStandardMaterial({
      color: col, roughness: rough === undefined ? .68 : rough, metalness: met || 0,
      envMapIntensity: opts.env === undefined ? .7 : opts.env,
      transparent: opts.o !== undefined && opts.o < 1, opacity: opts.o === undefined ? 1 : opts.o,
      emissive: opts.e || 0x000000, emissiveIntensity: opts.ei || 0
    });
    _MATC[key] = m;
  }
  return m;
}
const UO = [];
function addU(obj, o) { o.obj = obj; UO.push(o); scene.add(obj); return o; }
function box(w, h, dp, col, x, y, z, rough, met) {
  const m = new TH.Mesh(geoBox, pmat(col, rough, met));
  m.scale.set(w, h, dp);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(r1, r2, h, col, rough, met) {
  const m = new TH.Mesh(new TH.CylinderGeometry(r1, r2, h, 14), pmat(col, rough === undefined ? .55 : rough, met));
  m.castShadow = true; return m;
}
const YEL = 0xd8a13c, DRK = 0x24282c, STL = 0x8d949b, GLS = 0x22323c;
const HIVIS = 0xd8e04a, HIVIS2 = 0xe8823a;

/* ═══════════════ DESIGN HOLOGRAM & PERMIT BOARD ═════════════════ */
(function hologram() {
  const g = new TH.Group();
  const mat = new TH.LineBasicMaterial({ color: 0xd4a860, transparent: true, opacity: .85 });
  const fillM = new TH.MeshBasicMaterial({ color: 0x7ba0bd, transparent: true, opacity: .07, side: TH.DoubleSide, depthWrite: false });
  function mass(x0, z0, x1, z1, y0, y1) {
    const bg = new TH.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    const ln = new TH.LineSegments(new TH.EdgesGeometry(bg), mat);
    ln.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const mm = new TH.Mesh(bg, fillM); mm.position.copy(ln.position);
    g.add(ln, mm);
  }
  mass(-32, -24, 30, 24, FF, 13.7); mass(-6, 24, 18, 38, FF, 15.2);
  mass(30, -24, 58, 0, FF, 12.2); mass(-32, -24, -8, 2, 13.7, 24.9);
  ROOFS.forEach(rf => {
    const pts = [[rf.x0, rf.zc - rf.half, rf.plate], [rf.x0, rf.zc, rf.plate + rf.rise], [rf.x0, rf.zc + rf.half, rf.plate],
    [rf.x1, rf.zc - rf.half, rf.plate], [rf.x1, rf.zc, rf.plate + rf.rise], [rf.x1, rf.zc + rf.half, rf.plate]];
    const v = [];
    [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]].forEach(e => {
      v.push(pts[e[0]][0], pts[e[0]][2], pts[e[0]][1], pts[e[1]][0], pts[e[1]][2], pts[e[1]][1]);
    });
    const bg = new TH.BufferGeometry();
    bg.setAttribute('position', new TH.Float32BufferAttribute(v, 3));
    g.add(new TH.LineSegments(bg, mat));
  });
  const fp = new TH.BufferGeometry(), fv = [];
  WALLS.filter(w => w.ext && w.y0 === FF).forEach(w => fv.push(w.x1, .12, w.z1, w.x2, .12, w.z2));
  fp.setAttribute('position', new TH.Float32BufferAttribute(fv, 3));
  g.add(new TH.LineSegments(fp, new TH.LineBasicMaterial({ color: 0xd4a860, transparent: true, opacity: .95 })));
  addU(g, {
    t0: .0008, t1: PH.contract.t1 * .8, x0: PH.survey.t0 + .004, x1: PH.clearing.t0, l: 'site', anim: 'holo',
    tick: (o, u, v) => {
      const op = sat(u) * (1 - sat(v));
      mat.opacity = .2 + .62 * op * (.74 + .26 * Math.sin(clock * 1.5));
      fillM.opacity = .05 * op;
      g.position.y = (1 - easeOut(sat(u))) * 3 - v * 4;
    }
  });
  /* permit board + site rules, posted where the job is entered */
  const pl = new TH.Group();
  pl.add(box(.4, 5, .4, 0x6b5b45, -1.6, 2.5, 0), box(.4, 5, .4, 0x6b5b45, 1.6, 2.5, 0));
  pl.add(box(5, 3.4, .18, 0xe8e3d4, 0, 6, 0));
  pl.add(box(4.2, .3, .22, 0xd4a860, 0, 7, .02));
  pl.add(box(2.4, 2.6, .16, 0xe0b32c, 3.6, 5.4, 0));
  pl.add(box(2.4, 2.6, .16, 0xd8402c, -3.6, 5.4, 0));
  pl.userData.meta = { n: 'Permit & site safety board', s: 'site', d: 'Building permit, inspection card, emergency contacts, the site safety plan and the PPE requirement posted where every visitor passes.' };
  pl.position.set(-14, 0, -34); pl.rotation.y = .35;
  addU(pl, {
    t0: PH.permit.t1 - .004, t1: PH.permit.t1, x0: PH.closeout.t0, x1: PH.closeout.t0 + .01, l: 'site',
    tick: (o, u, v) => { pl.position.y = groundY(-14, -34) - (1 - easeOut(u)) * 6; }
  });
})();

/* ═══════════════ EQUIPMENT ══════════════════════════════════════ */
function tracks(len, w) {
  const g = new TH.Group();
  [-1, 1].forEach(s => {
    g.add(box(len, 1.7, 2.1, DRK, 0, 1.05, s * (w / 2), .9));
    g.add(box(len * .96, 1.05, 2.35, 0x33383d, 0, 1.0, s * (w / 2), .82));
    for (let i = 0; i < 7; i++) g.add(box(.3, 2.1, 2.5, 0x191c1f, -len / 2 + .8 + i * (len - 1.6) / 6, 1.0, s * (w / 2), .95));
  });
  return g;
}
function glassPane(w, h, dp, x, y, z) {
  const m = box(w, h, dp, GLS, x, y, z, .12, .25);
  m.material = pmat(GLS, .12, .25, { o: .5, env: 1.8 });
  return m;
}
/* ROPS/FOPS cage — every cab on site has one */
function cage(w, h, dp, x, y, z, col) {
  const g = new TH.Group();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => g.add(box(.22, h, .22, col, c[0] * w / 2, 0, c[1] * dp / 2, .5, .3)));
  g.add(box(w + .3, .24, dp + .3, col, 0, h / 2, 0, .5, .3));
  g.position.set(x, y, z);
  return g;
}
function beacon(x, y, z) {
  const m = new TH.Mesh(new TH.CylinderGeometry(.26, .3, .5, 10), pmat(0xffa723, .35, 0, { e: 0xff8a12, ei: 2.4 }));
  m.position.set(x, y, z);
  return m;
}
function mkExcavator() {
  const g = new TH.Group();
  g.add(tracks(11.5, 6.6));
  const house = new TH.Group(); house.position.y = 2.05; g.add(house);
  house.add(box(9, 3.2, 6.0, YEL, -.6, 1.6, 0, .48, .18));
  house.add(box(9.2, .5, 6.2, 0x2b2f34, -.6, 3.3, 0, .6, .3));
  house.add(box(3.2, 4.4, 4.4, YEL, 2.7, 2.2, -.7, .45, .18));
  house.add(glassPane(3.0, 3.0, 4.5, 2.75, 2.7, -.7));
  house.add(cage(3.4, 4.6, 4.6, 2.7, 2.3, -.7, 0x3a3f45));
  house.add(box(2.6, 3.4, 6.2, 0x2b2f34, -4.7, 1.5, 0, .8));
  house.add(beacon(1.2, 4.9, -.7));
  const boom = new TH.Group(); boom.position.set(3.6, 2.2, 1.5); house.add(boom);
  /* boom: tapered box plus a hydraulic ram, chunky enough to read as steel */
  boom.add(box(12, 1.9, 1.7, YEL, 6, 0, 0, .45, .2));
  boom.add(box(9, 1.2, 1.15, YEL, 8.5, .9, 0, .45, .2));
  const bp = cyl(.42, .42, 5.2, 0xb4bac0, .3, .7);
  bp.rotation.z = Math.PI / 2 - .5; bp.position.set(3.4, 1.5, 0);
  boom.add(bp);
  const stick = new TH.Group(); stick.position.set(12, 0, 0); boom.add(stick);
  stick.add(box(8, 1.5, 1.35, YEL, 4, 0, 0, .45, .2));
  const sp = cyl(.34, .34, 4.0, 0xb4bac0, .3, .7);
  sp.rotation.z = Math.PI / 2 - .35; sp.position.set(2.2, 1.1, 0);
  stick.add(sp);
  const bk = new TH.Group(); bk.position.set(8, 0, 0); stick.add(bk);
  bk.add(box(2.6, 2.6, 3.2, 0x36393d, 1, -.9, 0, .55, .5));
  bk.add(box(1.0, .34, 3.0, 0x9aa1a8, .1, .5, 0, .4, .6));
  for (let i = 0; i < 5; i++) bk.add(box(.9, .5, .32, 0x9a9da0, 2.3, -1.9, -1.3 + i * .65, .42, .65));
  g.userData = { house, boom, stick, bk, swing: 22 };
  return g;
}
function mkDozer() {
  const g = new TH.Group();
  g.add(tracks(10.5, 6.4));
  g.add(box(7, 3.0, 5.2, YEL, -.5, 3.2, 0, .5, .18));
  g.add(box(3.0, 3.4, 4.2, YEL, -3, 4.6, 0, .45, .18));
  g.add(glassPane(2.9, 2.6, 4.3, -3, 4.9, 0));
  g.add(cage(3.4, 3.8, 4.5, -3, 4.7, 0, 0x3a3f45));
  g.add(beacon(-4.6, 6.8, 0));
  const bl = new TH.Group(); bl.position.set(6.4, 1.7, 0); g.add(bl);
  bl.add(box(.85, 4.4, 11, 0xa7adb3, 0, 0, 0, .3, .7));
  bl.add(box(2.6, .8, 11, 0x9aa1a8, -1.2, -1.8, 0, .38, .6));
  [-1, 1].forEach(s => bl.add(box(.4, 3.4, .4, 0x8d949b, -.6, .4, s * 3.4, .4, .6)));
  g.add(box(5, .5, .5, STL, 2.6, 2.6, 2.4, .45, .7), box(5, .5, .5, STL, 2.6, 2.6, -2.4, .45, .7));
  g.userData = { bl, swing: 13 };
  return g;
}
function mkTele() {
  const g = new TH.Group();
  g.add(box(12, 3.4, 6, 0xc8552f, 0, 3.4, 0, .5, .2));
  [-1, 1].forEach(s => [-3.6, 3.6].forEach(x => {
    const w = cyl(1.9, 1.9, 1.7, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 1.9, s * 3.1); g.add(w);
  }));
  g.add(box(3.2, 3.6, 3.3, 0xc8552f, -2.6, 6.6, -1.2, .45, .2));
  g.add(glassPane(2.9, 3.0, 3.4, -2.6, 6.8, -1.2));
  g.add(cage(3.5, 3.9, 3.6, -2.6, 6.7, -1.2, 0x3a3f45));
  g.add(beacon(-4.4, 8.9, -1.2));
  /* outriggers — down whenever it is lifting */
  const og = new TH.Group(); g.add(og);
  [-1, 1].forEach(s => {
    const o = box(1.0, 3.2, 1.0, 0x9aa1a8, 5.2, 1.4, s * 3.4, .5, .5);
    og.add(o);
    og.add(box(2.6, .5, 2.6, 0x6f767e, 5.2, .1, s * 3.4, .7));
  });
  const boom = new TH.Group(); boom.position.set(-4.5, 5.4, 1.4); g.add(boom);
  boom.add(box(14, 1.8, 1.7, 0xd8dcdf, 7, 0, 0, .4, .45));
  const ext = new TH.Group(); ext.position.set(13, 0, 0); boom.add(ext);
  ext.add(box(9, 1.3, 1.2, 0xb4bac0, 4.5, 0, 0, .4, .45));
  const forks = new TH.Group(); forks.position.set(9, 0, 0); ext.add(forks);
  forks.add(box(.5, 3, 3.2, STL, 0, -.8, 0, .45, .65));
  const load = new TH.Group(); load.position.set(2.2, -1.5, 0); forks.add(load);
  load.add(box(4.4, 1.3, 6, 0xd6ae74, 0, 0, 0, .85));
  /* load is banded to the pallet, as it must be */
  load.add(box(4.6, .12, .3, 0x2b2f34, 0, .1, -1.6, .6), box(4.6, .12, .3, 0x2b2f34, 0, .1, 1.6, .6));
  g.userData = { boom, ext, forks, load, swing: 16 };
  return g;
}
function mkMixer() {
  const g = new TH.Group();
  g.add(box(20, 3, 7, 0x2f3439, -1, 3.4, 0, .7));
  g.add(box(6, 5.2, 6.9, 0xc2cad0, -8.6, 6.4, 0, .4, .3));
  g.add(glassPane(5.4, 2.3, 7.0, -8.8, 7.7, 0));
  const drum = cyl(3.4, 2.2, 12, 0xcbd1d6, .45, .4);
  drum.rotation.z = Math.PI / 2 - .22; drum.position.set(1, 8.4, 0); g.add(drum);
  const rib = cyl(3.5, 2.3, .5, 0x9aa1a8, .45, .45); rib.rotation.z = Math.PI / 2 - .22; rib.position.set(1, 8.4, 0); g.add(rib);
  const chute = box(6, .5, 2.2, 0x9aa1a8, 9.4, 5.2, 0, .4, .5); chute.rotation.z = -.3; g.add(chute);
  g.add(beacon(-8.6, 9.2, 0));
  [-1, 1].forEach(s => [-7, 3, 6].forEach(x => {
    const w = cyl(2, 2, 1.5, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 2, s * 3.4); g.add(w);
  }));
  g.userData = { drum, rib, chute, swing: 14 };
  return g;
}
function mkDump() {
  const g = new TH.Group();
  g.add(box(9, 4, 8, 0x9c3f34, -8, 4.6, 0, .5, .22));
  g.add(glassPane(7, 2.3, 7.6, -8, 6.2, 0));
  g.add(box(24, 1.6, 8, 0x2f3439, 2, 2.6, 0, .7));
  g.add(beacon(-8, 7.1, 0));
  const bed = new TH.Group(); bed.position.set(12, 3.4, 0); g.add(bed);
  bed.add(box(20, .8, 8.4, 0x99a0a7, -10, 0, 0, .5, .4));
  [-1, 1].forEach(s => bed.add(box(20, 3.6, .6, 0x99a0a7, -10, 1.8, s * 4, .5, .4)));
  bed.add(box(.6, 3.6, 8.4, 0x99a0a7, -20, 1.8, 0, .5, .4));
  /* tarped load — required for haul-off */
  bed.add(box(19, .5, 8.0, 0x3f4a3a, -10, 2.0, 0, .95));
  [-1, 1].forEach(s => [-9, 6, 10, 14].forEach(x => {
    const w = cyl(2.1, 2.1, 1.6, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 2.1, s * 3.8); g.add(w);
  }));
  g.userData = { bed, swing: 15 };
  return g;
}
function mkPickup(col) {
  const g = new TH.Group();
  g.add(box(15, 2.5, 6.4, col, 0, 3.3, 0, .3, .4));
  g.add(box(6, 2.9, 6.2, col, -1, 5.6, 0, .3, .4));
  g.add(glassPane(5.5, 2.1, 6.4, -1, 6, 0));
  g.add(box(7, 1.9, 6.4, col, 5.2, 5.2, 0, .35, .35));
  [-1, 1].forEach(s => [-4.6, 4.4].forEach(x => {
    const w = cyl(1.5, 1.5, 1.2, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 1.5, s * 3.3); g.add(w);
  }));
  g.userData = { swing: 9 };
  return g;
}
function mkLift() {
  const g = new TH.Group();
  g.add(box(8, 1.6, 5, 0x2b3035, 0, 1.6, 0, .7));
  [-1, 1].forEach(s => [-2.8, 2.8].forEach(x => {
    const w = cyl(1.1, 1.1, 1.0, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 1.1, s * 2.3); g.add(w);
  }));
  const mast = new TH.Group(); mast.position.y = 2.4; g.add(mast);
  for (let i = 0; i < 4; i++) mast.add(box(6.4 - i * .6, .4, 4 - i * .3, YEL, 0, i * .5, 0, .55, .2));
  const deck = new TH.Group(); deck.position.y = 2.4; g.add(deck);
  deck.add(box(7, .3, 4.4, 0xb8bec4, 0, 0, 0, .5, .35));
  /* full guardrail: top rail, mid rail, toe board */
  [-1, 1].forEach(s => {
    deck.add(box(7, .16, .16, YEL, 0, 3.5, s * 2.1, .55, .2));
    deck.add(box(7, .16, .16, YEL, 0, 1.9, s * 2.1, .55, .2));
    deck.add(box(7, .5, .16, 0x2b3035, 0, .35, s * 2.1, .7));
  });
  [-1, 1].forEach(s => {
    deck.add(box(.16, .16, 4.4, YEL, s * 3.4, 3.5, 0, .55, .2));
    deck.add(box(.16, .16, 4.4, YEL, s * 3.4, 1.9, 0, .55, .2));
    deck.add(box(.16, 3.6, .16, YEL, s * 3.4, 1.8, 2.1, .55, .2));
    deck.add(box(.16, 3.6, .16, YEL, s * 3.4, 1.8, -2.1, .55, .2));
  });
  g.userData = { deck, swing: 8 };
  return g;
}
function mkRoller() {
  const g = new TH.Group();
  g.add(box(7, 2.8, 5, YEL, 0, 4.2, 0, .5, .18));
  const dr = cyl(2.6, 2.6, 6, 0x99a0a7, .35, .55); dr.rotation.x = Math.PI / 2; dr.position.set(4, 2.6, 0); g.add(dr);
  const dr2 = cyl(2.4, 2.4, 6, 0x99a0a7, .35, .55); dr2.rotation.x = Math.PI / 2; dr2.position.set(-4, 2.4, 0); g.add(dr2);
  g.add(box(2.6, 2.6, 3, YEL, 0, 6.6, 0, .45, .18));
  g.add(cage(3.0, 3.2, 3.4, 0, 6.9, 0, 0x3a3f45));
  g.add(beacon(0, 8.7, 0));
  g.userData = { dr, dr2, swing: 11 };
  return g;
}

const EQUIP = [];
function equip(obj, cfg) { obj.visible = false; scene.add(obj); EQUIP.push(Object.assign({ obj }, cfg)); }
(function placeEquipment() {
  const ex = mkExcavator();
  equip(ex, {
    t0: PH.excavate.t0 - .004, t1: PH.underground.t1, name: 'Tracked excavator', dusty: 1,
    tick: (o) => {
      const path = [[-14, -14], [16, 10], [-6, 24], [24, -14]];
      const k = (clock * .020) % 1;
      const seg = Math.floor(k * 4) % 4, f = (k * 4) % 1;
      const a = path[seg], b = path[(seg + 1) % 4];
      const x = lerp(a[0], b[0], smooth(f)), z = lerp(a[1], b[1], smooth(f));
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      /* a real dig cycle: reach out, curl, lift, swing, dump */
      const c = clock * .5;
      const cyc = (c % TAU) / TAU;
      o.userData.house.rotation.y = Math.sin(c * .5) * .85;
      o.userData.boom.rotation.z = -.22 + Math.sin(c) * .30;
      o.userData.stick.rotation.z = -1.05 + Math.sin(c + 1.15) * .42;
      o.userData.bk.rotation.z = .55 + Math.sin(c + 2.3) * .62;
    }
  });
  const dz = mkDozer();
  equip(dz, {
    t0: PH.clearing.t0, t1: PH.slab.t0 + .01, name: 'Dozer', dusty: 1,
    tick: (o) => {
      const t = (clock * .08) % 1, back = t > .5, u = back ? 1 - (t - .5) * 2 : t * 2;
      const x = lerp(-44, 52, u), z = -12 + Math.sin(clock * .06) * 20;
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = back ? -Math.PI / 2 : Math.PI / 2;
      o.userData.bl.rotation.z = Math.sin(clock * 1.4) * .07 - .05;
    }
  });
  const dt = mkDump();
  equip(dt, {
    t0: PH.excavate.t0 + .004, t1: PH.slab.t0, name: 'Haul truck', dusty: 1,
    tick: (o) => {
      const t = (clock * .045) % 1;
      const path = [[-70, 6], [-30, -2], [6, -30], [-40, -44], [-70, 6]];
      const seg = Math.min(3, Math.floor(t * 4)), f = t * 4 - seg;
      const a = path[seg], b = path[seg + 1];
      const x = lerp(a[0], b[0], f), z = lerp(a[1], b[1], f);
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      o.userData.bed.rotation.z = t > .3 && t < .38 ? -Math.sin((t - .3) / .08 * Math.PI) * .5 : 0;
    }
  });
  for (let i = 0; i < 2; i++) {
    const mx = mkMixer();
    equip(mx, {
      t0: i ? PH.slab.t0 + .004 : PH.foundation.t0 + .01,
      t1: i ? PH.slab.t1 : PH.foundation.t1 - .01, name: 'Mixer truck',
      tick: (o) => {
        const x = -40 + i * 16, z = -32 + Math.sin(clock * .1 + i) * 3;
        o.position.set(x, groundY(x, z), z);
        o.rotation.y = Math.PI * .5 + .3;
        o.userData.drum.rotation.y += .04; o.userData.rib.rotation.y += .04;
        o.userData.chute.rotation.y = Math.sin(clock * .35 + i) * .35;
      }
    });
  }
  const th = mkTele();
  equip(th, {
    t0: PH.framing.t0, t1: PH.roofstruct.t1, name: 'Telehandler',
    tick: (o) => {
      const x = 40 + Math.sin(clock * .09) * 8, z = -6 + Math.cos(clock * .07) * 14;
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = Math.PI + Math.sin(clock * .09) * .45;
      const lift = Math.sin(clock * .3) * .5 + .5;
      o.userData.boom.rotation.z = .12 + lift * .5;
      o.userData.ext.position.x = 13 + lift * 6.5;
      o.userData.forks.rotation.z = -(.12 + lift * .5);
      o.userData.load.visible = lift > .12;
    }
  });
  for (let i = 0; i < 2; i++) {
    const lf = mkLift();
    equip(lf, {
      t0: PH.roughin.t0, t1: PH.interior.t1, name: 'Scissor lift', idx: i,
      tick: (o) => {
        const x = -18 + i * 26 + Math.sin(clock * .1 + i * 2) * 7;
        const z = 2 + Math.cos(clock * .09 + i * 3) * 12;
        o.position.set(x, FF, z);
        o.rotation.y = clock * .04 + i;
        o.userData.deck.position.y = 3 + (Math.sin(clock * .26 + i) * .5 + .5) * 5.5;
      }
    });
  }
  [[PH.slab.t0, PH.slab.t0 + .02, -44, 20, 30], [PH.sitework.t0 + .004, PH.sitework.t0 + .08, -64, -20, 6]].forEach(cfg => {
    const rl = mkRoller();
    equip(rl, {
      t0: cfg[0], t1: cfg[1], name: 'Vibratory roller', dusty: 1,
      tick: (o) => {
        const t = (clock * .06) % 1, u = t > .5 ? 1 - (t - .5) * 2 : t * 2;
        const x = lerp(cfg[2], cfg[3], u), z = cfg[4];
        o.position.set(x, groundY(x, z), z);
        o.rotation.y = t > .5 ? -Math.PI / 2 : Math.PI / 2;
        o.userData.dr.rotation.z += .07; o.userData.dr2.rotation.z += .07;
      }
    });
  });
  const pk = mkPickup(0x272c31);
  equip(pk, { t0: PH.survey.t0, t1: 1.01, name: "Superintendent's truck", tick: o => { o.position.set(-54, groundY(-54, -22), -22); o.rotation.y = .5; } });
  const pk2 = mkPickup(0x7a8288);
  equip(pk2, { t0: PH.framing.t0, t1: PH.closeout.t0, name: 'Trade truck', tick: o => { o.position.set(-60, groundY(-60, -12), -12); o.rotation.y = .4; } });
  const car = mkPickup(0x15181b);
  equip(car, { t0: PH.closeout.t0 + .016, t1: 1.01, name: "Owner's vehicle", tick: o => { o.position.set(42, groundY(42, -32), -32); o.rotation.y = Math.PI; } });
})();

/* ═══════════════ CREW — instanced, in PPE ═══════════════════════
   Eight InstancedMeshes cover every worker on site. Each carries a
   hard hat, a hi-vis vest with reflective banding, safety glasses,
   gloves and boots; roof and leading-edge work adds a harness.      */
const MAXCREW = 24;
const HATS = [0xe0bc3c, 0xf0f2f4, 0x2f6fb5, 0xd8542e, 0x3f9a5c];
function instMesh(geo, m, n, cast) {
  const im = new TH.InstancedMesh(geo, m, n);
  im.frustumCulled = false;
  im.castShadow = cast !== false; im.receiveShadow = false;
  im.instanceMatrix.setUsage(TH.DynamicDrawUsage);
  scene.add(im);
  return im;
}
const CREWM = (function () {
  const skin = pmat(0xb08a63, .92, 0);
  const pants = pmat(0x2f3641, .95, 0);
  const boot = pmat(0x201d1a, .8, 0);
  const glove = pmat(0xc9a06a, .9, 0);
  const vest = pmat(0xffffff, .82, 0);   /* tinted per instance */
  const hat = pmat(0xffffff, .38, 0, { env: .9 });
  const refl = pmat(0xd8dfe4, .28, .35, { env: 1.4 });
  const harn = pmat(0x232a33, .8, 0);
  /* torso = shirt + vest shell in one geometry */
  const gTorso = mergeParts([
    { geo: geoBox, p: [0, 0, 0], s: [1.42, 2.5, .86] },
    { geo: geoBox, p: [0, .95, 0], s: [1.12, .55, .8] }
  ]);
  const gVest = mergeParts([{ geo: geoBox, p: [0, -.1, 0], s: [1.52, 1.85, .96] }]);
  const gRefl = mergeParts([
    { geo: geoBox, p: [0, .42, 0], s: [1.56, .2, 1.0] },
    { geo: geoBox, p: [0, -.36, 0], s: [1.56, .2, 1.0] },
    { geo: geoBox, p: [-.42, .04, .49], s: [.2, 1.7, .04] },
    { geo: geoBox, p: [.42, .04, .49], s: [.2, 1.7, .04] }
  ]);
  /* head + safety glasses */
  const gHead = mergeParts([
    { geo: new TH.SphereGeometry(.5, 9, 7), p: [0, 0, 0], s: [1.04, 1.1, 1.0] },
    { geo: geoBox, p: [0, .06, .24], s: [.98, .22, .18] }
  ]);
  /* hard hat: dome + brim + ridge */
  const gHat = mergeParts([
    { geo: new TH.SphereGeometry(.5, 10, 6, 0, TAU, 0, Math.PI / 2), p: [0, 0, 0], s: [1.24, 1.05, 1.24] },
    { geo: geoBox, p: [0, .02, .12], s: [1.5, .1, 1.62] },
    { geo: geoBox, p: [0, .28, 0], s: [.22, .18, 1.14] }
  ]);
  /* limbs with glove / boot on the end */
  const gArm = mergeParts([
    { geo: geoBox, p: [0, .06, 0], s: [.34, 1.9, .34] },
    { geo: geoBox, p: [0, -.98, .04], s: [.42, .42, .46] }
  ]);
  const gLeg = mergeParts([
    { geo: geoBox, p: [0, .1, 0], s: [.46, 2.8, .46] },
    { geo: geoBox, p: [0, -1.4, .1], s: [.54, .5, .8] }
  ]);
  const gTool = mergeParts([
    { geo: geoBox, p: [0, 0, 0], s: [.18, 1.5, .18] },
    { geo: geoBox, p: [0, .78, .12], s: [.34, .5, .74] }
  ]);
  const gHarness = mergeParts([
    { geo: geoBox, p: [-.34, .1, 0], s: [.2, 2.3, .96] },
    { geo: geoBox, p: [.34, .1, 0], s: [.2, 2.3, .96] },
    { geo: geoBox, p: [0, -.75, 0], s: [1.5, .22, 1.0] },
    { geo: geoBox, p: [0, .1, -.5], s: [.5, .4, .22] }
  ]);
  return {
    torso: instMesh(gTorso, pants, MAXCREW),
    vest: instMesh(gVest, vest, MAXCREW),
    refl: instMesh(gRefl, refl, MAXCREW, false),
    head: instMesh(gHead, skin, MAXCREW),
    hat: instMesh(gHat, hat, MAXCREW),
    armL: instMesh(gArm, glove, MAXCREW),
    armR: instMesh(gArm, glove, MAXCREW),
    legL: instMesh(gLeg, boot, MAXCREW),
    legR: instMesh(gLeg, boot, MAXCREW),
    tool: instMesh(gTool, pmat(0x9aa1a8, .45, .55), MAXCREW),
    harness: instMesh(gHarness, harn, MAXCREW, false)
  };
})();
/* per-instance colour: hats and vests vary, everything else is shared */
(function tintCrew() {
  const cc = new TH.Color();
  ['hat', 'vest'].forEach(k => {
    const im = CREWM[k];
    im.instanceColor = new TH.InstancedBufferAttribute(new Float32Array(MAXCREW * 3), 3);
    for (let i = 0; i < MAXCREW; i++) {
      if (k === 'hat') cc.setHex(HATS[i % HATS.length]);
      else cc.setHex(i % 3 === 0 ? HIVIS2 : HIVIS);
      cc.offsetHSL(0, 0, (R() - .5) * .05);
      im.instanceColor.setXYZ(i, cc.r, cc.g, cc.b);
    }
    im.instanceColor.needsUpdate = true;
  });
})();

/* ── task stations: derived from the work itself, so people stand
      where the work is instead of orbiting the site in a circle ── */
function alongWalls(list, n, yOf, off) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const w = list[i % list.length];
    const s = ((i * 7.3) % Math.max(1, w.L - 2)) + 1;
    const p = ptOn(w, s, (off === undefined ? 3.2 : off) * (i % 2 ? 1 : -1));
    pts.push([p[0], p[1], yOf]);
  }
  return pts;
}
function onRoof(n) {
  const pts = [], rf = ROOFS[0], slope = rf.rise / rf.half;
  for (let i = 0; i < n; i++) {
    const sg = i % 2 ? 1 : -1, u = .25 + ((i * .17) % .6);
    const x = rf.x0 + 3 + ((i * 6.1) % Math.max(1, rf.x1 - rf.x0 - 6));
    const z = rf.zc + sg * rf.half * u;
    pts.push([x, z, rf.plate + .4 + rf.rise - rf.half * u * slope + .5]);
  }
  return pts;
}
function inside(n, y) {
  const pts = [], rr = rng(991);
  for (let i = 0; i < n; i++) {
    let x, z, k = 0;
    do { x = -30 + rr() * 58; z = -22 + rr() * 44; k++; } while (k < 8 && Math.abs(x - 4) < 3);
    pts.push([x, z, y]);
  }
  return pts;
}
function scattered(n, x0, z0, x1, z1, y) {
  const pts = [], rr = rng(4242);
  for (let i = 0; i < n; i++) pts.push([lerp(x0, x1, rr()), lerp(z0, z1, rr()), y]);
  return pts;
}
const STATION = {
  survey: [[-34, -26, 0], [32, -26, 0], [32, 26, 0], [-34, 26, 0], [-2, -30, 0], [-14, -34, 0]],
  clearing: scattered(7, -40, -34, 46, 34, 0),
  excavate: [[-38, -18, 0], [-38, 8, 0], [36, -18, 0], [36, 12, 0], [8, 30, 0], [-20, 30, 0], [-46, 20, 0]],
  underground: [[-44, 14, -3.2], [-30, -6, -3.2], [-4, 34, -3.2], [30, 46, -3.2], [-46, 26, 0], [10, 36, 0], [62, 54, 0]],
  foundation: alongWalls([], 0, 0),
  slab: scattered(11, -28, -20, 26, 20, 1.7),
  framing: null, roofstruct: null, roofing: null,
  openings: null,
  roughin: inside(13, FF + .2),
  drywall: inside(15, FF + .2),
  interior: inside(14, FF + .2),
  exteriorfin: null,
  sitework: scattered(16, -60, -40, 56, 56, 0),
  closeout: [[-6, -30, 0], [2, -30, 0], [8, 26, FF], [-12, 8, FF], [16, 6, FF], [-24, -10, FF], [30, 34, 0], [-2, 40, 0], [22, 44, 0]]
};
(function fillStations() {
  const ext0 = WALLS.filter(w => w.ext && w.y0 === FF);
  STATION.foundation = alongWalls(ext0, 12, -1.2, 3.4);
  STATION.framing = alongWalls(ext0, 11, FF + .2, 2.6);
  STATION.roofstruct = onRoof(9);
  STATION.roofing = onRoof(11);
  STATION.openings = alongWalls(ext0, 9, FF + .2, 4.2);
  STATION.exteriorfin = alongWalls(ext0, 12, FF + .2, 5.0);
})();
/* phases where the work is at height and a harness is worn */
const HARNESS_PH = { roofstruct: 1, roofing: 1, framing: 1 };

const crewCount = ph => ph.crew.length ? Math.min(MAXCREW, ph.crew.reduce((a, c) => a + c[1], 0)) : 0;
let crewActive = 0;
const _cm = new TH.Matrix4(), _cq = new TH.Quaternion(), _ce = new TH.Euler(), _cv = new TH.Vector3(), _cs = new TH.Vector3();
const HIDEC = new TH.Matrix4().compose(new TH.Vector3(0, -9999, 0), new TH.Quaternion(), new TH.Vector3(0, 0, 0));
const _cv2 = new TH.Vector3();
function setPart(im, i, x, y, z, ry, rx, off) {
  _ce.set(rx || 0, ry, 0);
  _cq.setFromEuler(_ce);
  let px = x, py = y, pz = z;
  if (off) {
    _cv2.set(off[0], off[1], off[2]).applyQuaternion(_cq);
    px += _cv2.x; py += _cv2.y; pz += _cv2.z;
  }
  _cm.compose(_cv.set(px, py, pz), _cq, _cs.set(1, 1, 1));
  im.setMatrixAt(i, _cm);
}
function updateCrew() {
  const ph = currentPhase(), st = STATION[ph.key];
  const n = flags.people && st && st.length ? Math.min(crewCount(ph), MAXCREW) : 0;
  crewActive = st && st.length ? crewCount(ph) : 0;
  const harness = !!HARNESS_PH[ph.key];
  for (let i = 0; i < MAXCREW; i++) {
    if (i >= n) {
      for (const k in CREWM) CREWM[k].setMatrixAt(i, HIDEC);
      continue;
    }
    const s = st[i % st.length];
    const jx = ((i * 37) % 17) / 17 - .5, jz = ((i * 53) % 19) / 19 - .5;
    /* small local task motion — a step here, a reach there */
    const ph2 = clock * (.5 + (i % 5) * .09) + i * 2.1;
    const wob = Math.sin(ph2 * .5);
    let x = s[0] + jx * 5.5 + Math.sin(ph2 * .32) * 1.6;
    let z = s[1] + jz * 5.5 + Math.cos(ph2 * .27) * 1.6;
    let y = s[2];
    if (y === 0) y = groundY(x, z);
    /* stay clear of anything with a swing radius */
    for (let e = 0; e < EQUIP.length; e++) {
      const eq = EQUIP[e];
      if (!eq.obj.visible || !eq.obj.userData.swing) continue;
      const dx = x - eq.obj.position.x, dz = z - eq.obj.position.z;
      const dd = Math.hypot(dx, dz), rr = eq.obj.userData.swing;
      if (dd < rr && dd > .001) { x += dx / dd * (rr - dd); z += dz / dd * (rr - dd); }
    }
    const face = Math.atan2(s[0] - x, s[1] - z) + Math.PI;
    const bob = Math.sin(clock * 3.4 + i) * (Math.abs(wob) > .8 ? 1 : .25);
    const yb = y + Math.abs(bob) * .12;
    const work = Math.sin(clock * 2.6 + i * 1.7);
    setPart(CREWM.torso, i, x, yb + 4.25, z, face);
    setPart(CREWM.vest, i, x, yb + 4.35, z, face);
    setPart(CREWM.refl, i, x, yb + 4.35, z, face);
    setPart(CREWM.head, i, x, yb + 5.95, z, face);
    setPart(CREWM.hat, i, x, yb + 6.18, z, face);
    const cf = Math.cos(face), sf = Math.sin(face);
    const ax = .95 * cf, az = -.95 * sf;
    setPart(CREWM.armL, i, x - ax, yb + 4.2, z - az, face, -.5 - work * .55);
    const rArm = -.5 + work * .55;
    setPart(CREWM.armR, i, x + ax, yb + 4.2, z + az, face, rArm);
    /* most trades are carrying something */
    if (i % 3 !== 0) setPart(CREWM.tool, i, x + ax, yb + 4.2, z + az, face, rArm, [0, -1.35, .1]);
    else CREWM.tool.setMatrixAt(i, HIDEC);
    const lx = .42 * cf, lz = -.42 * sf;
    setPart(CREWM.legL, i, x - lx, yb + 1.55, z - lz, face, bob * .42);
    setPart(CREWM.legR, i, x + lx, yb + 1.55, z + lz, face, -bob * .42);
    if (harness) setPart(CREWM.harness, i, x, yb + 4.4, z, face);
    else CREWM.harness.setMatrixAt(i, HIDEC);
  }
  for (const k in CREWM) CREWM[k].instanceMatrix.needsUpdate = true;
}
let equipActive = 0;
function updateEquip() {
  equipActive = 0;
  for (let i = 0; i < EQUIP.length; i++) {
    const e = EQUIP[i], vis = flags.people && T >= e.t0 && T < e.t1;
    if (e.obj.visible !== vis) e.obj.visible = vis;
    if (!vis) continue;
    equipActive++; e.tick(e.obj);
  }
}
function updateUO() {
  for (let i = 0; i < UO.length; i++) {
    const o = UO[i];
    const on = o.l === 'temps' ? flags.people : true;
    let u = sat(o.t1 > o.t0 ? (T - o.t0) / (o.t1 - o.t0) : (T >= o.t0 ? 1 : 0));
    let v = o.x0 !== undefined ? sat((T - o.x0) / ((o.x1 - o.x0) || 1e-5)) : 0;
    const vis = on && u > 0 && v < 1;
    if (o.obj.visible !== vis) o.obj.visible = vis;
    if (!vis) continue;
    if (o.tick) o.tick(o, u, v);
    if (!o.anim) o.obj.scale.setScalar(Math.max(easeOut(u) * (1 - v), .001));
  }
}

/* ═══════════════ TEMPORARY FACILITIES ═══════════════════════════ */
(function temps() {
  const IN = PH.clearing.t0 + .004, OUT = PH.closeout.t0 + .006, OUT1 = PH.closeout.t0 + .02;
  function place(g, x, z, ry, t0, t1, x0, x1, meta) {
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    if (meta) g.userData.meta = meta;
    addU(g, {
      t0: t0 === undefined ? IN : t0, t1: (t0 === undefined ? IN : t0) + .008,
      x0: x0 === undefined ? OUT : x0, x1: x1 === undefined ? OUT1 : x1, l: 'temps',
      tick: (o, u, v) => { g.position.y = groundY(x, z) + (1 - easeOut(u)) * -8 + v * 5; }
    });
  }
  /* site office, with the required postings and a first-aid station */
  const tr = new TH.Group();
  tr.add(box(34, 9, 12, 0xdde2e6, 0, 6.5, 0, .62));
  tr.add(box(34.6, 1, 12.6, 0x99a0a7, 0, 11.4, 0, .5, .35));
  for (let i = 0; i < 4; i++) tr.add(glassPane(3.4, 3, .3, -12 + i * 8, 7.6, 6.1));
  tr.add(box(3, 6.6, .4, 0x454c53, 13, 5.3, 6.1, .7));
  /* stair with a handrail, not a jump to the door */
  tr.add(box(5, .4, 4, 0x666d74, 13, 2.6, 8.6, .8));
  tr.add(box(5, .4, 2.4, 0x666d74, 13, 1.5, 10.6, .8));
  [-1, 1].forEach(s => tr.add(box(.2, 3.4, 4.4, 0xd8a13c, 13 + s * 2.4, 4.2, 9.4, .6)));
  [-1, 1].forEach(s => tr.add(box(.2, .2, 4.6, 0xd8a13c, 13 + s * 2.4, 5.7, 9.4, .6)));
  tr.add(box(2.6, 2.2, .2, 0xd8402c, -14, 9.2, 6.2, .6));
  tr.add(box(1.6, 2.2, 1.0, 0xd8402c, 17.4, 3.6, 3, .55));
  tr.userData.meta = { n: 'Site office & first aid', s: 'site', d: 'Superintendent\'s office with the permit set, the safety plan, the SDS binder, a stocked first-aid cabinet, eyewash and a fire extinguisher on the exterior wall.' };
  place(tr, -62, 6, .28);
  /* waste separation — one general, one recycling */
  [[-46, -40, 0x8a4a3c, 'General construction waste'], [-52, 18, 0x46613f, 'Recycling — wood, metal, cardboard']].forEach((p, i) => {
    const dm = new TH.Group();
    dm.add(box(20, 7, 8, p[2], 0, 3.5, 0, .85));
    dm.add(box(20.4, .5, 8.4, 0x35393e, 0, 7.1, 0, .8));
    place(dm, p[0], p[1], i ? .5 : -.2, undefined, undefined, undefined, undefined,
      { n: 'Waste container', s: 'site', d: p[3] + '. Emptied on a schedule so debris never accumulates in the work area — housekeeping is the single most common citation on a residential job.' });
  });
  [[-52, -34], [-48, -34], [-44, -34]].forEach((p, i) => {
    const pt = new TH.Group();
    pt.add(box(4, 8, 4, i === 1 ? 0x3f7fa8 : 0x4a8f6a, 0, 4, 0, .72));
    pt.add(box(4.2, .6, 4.2, 0xe4e8eb, 0, 8.2, 0, .68));
    place(pt, p[0], p[1], .1 * i, undefined, undefined, undefined, undefined,
      { n: 'Sanitation', s: 'site', d: 'One unit per twenty workers with a wash station alongside, serviced weekly.' });
  });
  const tp = new TH.Group();
  tp.add(box(1, 22, 1, 0x6b5b45, 0, 11, 0, .9));
  tp.add(box(2.4, 3.4, 1.4, 0x99a0a7, 1.4, 15, 0, .45, .45));
  tp.add(box(2.0, 2.6, 1.2, 0xd8402c, 1.4, 5.2, 0, .6));
  place(tp, -72, -4, 0, PH.clearing.t0 + .006, 0, PH.sitework.t1 - .02, PH.sitework.t1 - .01,
    { n: 'Temporary power', s: 'electrical', d: 'GFCI-protected temporary service on a pole with a weatherproof panel and a lockable disconnect. Every cord on site lands on a GFCI.' });

  /* ── material laydown: banded, blocked and off the ground ── */
  function stack(x, z, col, t0, phaseKey, label, note, w, h, dp) {
    const g = new TH.Group(), rows = 6, parts = [];
    g.add(box(w + 1, .5, dp + 1, 0x6b5b45, 0, .25, 0, .9));
    for (let i = 0; i < rows; i++) {
      const b = box(w, h / rows * .84, dp, col, 0, .5 + h / rows * (i + .5), 0, .85);
      g.add(b); parts.push(b);
      if (i === rows - 1) {
        [-1, 1].forEach(s => g.add(box(.16, h + .6, dp + .2, 0x2b2f34, s * w * .3, .5 + h / 2, 0, .6)));
      }
    }
    g.position.set(x, 0, z); g.rotation.y = R() * .3;
    g.userData.meta = { n: label, s: 'site', d: note };
    const done = PH[phaseKey] ? PH[phaseKey].t1 : OUT;
    addU(g, {
      t0: t0, t1: t0 + .006, x0: done, x1: done + .008, l: 'temps',
      tick: (o, u, v) => {
        g.position.y = groundY(x, z) + (1 - easeOut(u)) * -6 + v * 4;
        const used = PH[phaseKey] ? sat((T - PH[phaseKey].t0) / (PH[phaseKey].t1 - PH[phaseKey].t0)) : 0;
        parts.forEach((p, i) => p.visible = (i / rows) < 1 - used * .96);
      }
    });
  }
  stack(-26, -44, 0xd6ae74, PH.framing.t0 - .008, 'framing', 'Lumber package',
    'Delivered in the order it is needed, banded, dunnaged clear of the ground and covered. Stacked below head height and well back from the excavation edge.', 22, 6, 8);
  stack(-6, -44, 0xd6ae74, PH.roofstruct.t0 - .006, 'roofstruct', 'Truss bundle',
    'Stacked flat, blocked and banded so nothing can twist or roll before it is set.', 24, 5, 7);
  stack(16, -44, 0xe9e5dc, PH.drywall.t0 - .006, 'drywall', 'Drywall load',
    'Boarded room by room through the openings. Sheets stored flat, never leaned against a wall where they can slide.', 18, 4, 8);
  stack(38, 16, 0x7f766a, PH.exteriorfin.t0 - .006, 'exteriorfin', 'Stone pallets',
    'Blended across three pallets at a time so the finished wall has no colour banding. Pallets stay banded until they are worked.', 10, 5, 10);
})();

/* ═══════════════ WEATHER PARTICLES ══════════════════════════════ */
const wxCount = SMALL ? 1200 : 2400;
const wxGeo = new TH.BufferGeometry();
const wxPos = new Float32Array(wxCount * 3), wxSeed = new Float32Array(wxCount);
for (let i = 0; i < wxCount; i++) {
  wxPos[i * 3] = (Math.random() - .5) * 300;
  wxPos[i * 3 + 1] = Math.random() * 130;
  wxPos[i * 3 + 2] = (Math.random() - .5) * 260;
  wxSeed[i] = Math.random();
}
wxGeo.setAttribute('position', new TH.BufferAttribute(wxPos, 3));
const wxMat = new TH.PointsMaterial({ color: 0xdfe9f2, size: .55, transparent: true, opacity: 0, depthWrite: false, fog: false });
const wxPts = new TH.Points(wxGeo, wxMat);
wxPts.frustumCulled = false;
scene.add(wxPts);

/* ═══════════════ DUST ═══════════════════════════════════════════ */
const duCount = SMALL ? 70 : 150;
const duGeo = new TH.BufferGeometry();
const duPos = new Float32Array(duCount * 3), duSeed = new Float32Array(duCount);
for (let i = 0; i < duCount; i++) {
  duPos[i * 3] = (Math.random() - .5) * 120;
  duPos[i * 3 + 1] = Math.random() * 8;
  duPos[i * 3 + 2] = (Math.random() - .5) * 100;
  duSeed[i] = Math.random();
}
duGeo.setAttribute('position', new TH.BufferAttribute(duPos, 3));
const duMat = new TH.PointsMaterial({ color: 0xb9a486, size: 2.6, transparent: true, opacity: 0, depthWrite: false, map: TEX.cloud.map, fog: true });
const duPts = new TH.Points(duGeo, duMat);
duPts.frustumCulled = false;
scene.add(duPts);
function updateDust(dt) {
  const day = T * DAYS;
  const earthy = flags.people && day > PH.clearing.d0 && day < PH.slab.d1 && weatherAt(day).t === 'clear';
  duMat.opacity = lerp(duMat.opacity, earthy ? .13 : 0, 1 - Math.pow(.06, dt));
  duPts.visible = duMat.opacity > .01;
  if (!duPts.visible) return;
  const Pd = duGeo.attributes.position.array;
  let ax = 8, az = 2, found = false;
  for (let k = 0; k < EQUIP.length; k++) {
    if (EQUIP[k].dusty && EQUIP[k].obj.visible) { ax = EQUIP[k].obj.position.x; az = EQUIP[k].obj.position.z; found = true; break; }
  }
  for (let i = 0; i < duCount; i++) {
    Pd[i * 3] += dt * (2.5 + duSeed[i] * 2);
    Pd[i * 3 + 1] += dt * (1.2 + duSeed[i] * 1.6);
    if (Pd[i * 3 + 1] > 9 + duSeed[i] * 5) {
      Pd[i * 3] = ax + (Math.random() - .5) * (found ? 16 : 90);
      Pd[i * 3 + 1] = groundY(Pd[i * 3], az) + .5;
      Pd[i * 3 + 2] = az + (Math.random() - .5) * (found ? 14 : 80);
    }
  }
  duGeo.attributes.position.needsUpdate = true;
}
