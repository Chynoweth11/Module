/* ═════════════════════════════════════════════════════════════════
   50 · actors — hologram, equipment, crew, temporary facilities,
   weather & dust particles. Everything here is scheduled off the
   same project time T as the building itself.
   ═════════════════════════════════════════════════════════════════ */

/* ── unique (non-instanced) objects ── */
const UO = [];
function addU(obj, o) { o.obj = obj; UO.push(o); scene.add(obj); return o; }
function box(w, h, dp, col, x, y, z, rough, met) {
  const m = new TH.Mesh(new TH.BoxGeometry(w, h, dp),
    new TH.MeshStandardMaterial({ color: col, roughness: rough === undefined ? .68 : rough, metalness: met || 0, envMapIntensity: .8 }));
  m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(r1, r2, h, col, rough, met) {
  const m = new TH.Mesh(new TH.CylinderGeometry(r1, r2, h, 16),
    new TH.MeshStandardMaterial({ color: col, roughness: rough === undefined ? .55 : rough, metalness: met || 0, envMapIntensity: .9 }));
  m.castShadow = true; return m;
}
const YEL = 0xd8a13c, DRK = 0x22262a, STL = 0x8d949b, GLS = 0x223642;

/* design & permit hologram — the house appears as wireframe intent
   during pre-construction, then dissolves as the survey begins */
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
  /* permit board goes up when the permit is issued, comes down at closeout */
  const pl = new TH.Group();
  pl.add(box(.4, 5, .4, 0x6b5b45, -1.6, 2.5, 0), box(.4, 5, .4, 0x6b5b45, 1.6, 2.5, 0));
  pl.add(box(5, 3.4, .18, 0xe8e3d4, 0, 6, 0));
  pl.add(box(4.2, .3, .22, 0xd4a860, 0, 7, .02));
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
    g.add(box(len, 1.9, 2.2, DRK, 0, .95, s * (w / 2), .9));
    for (let i = 0; i < 6; i++) g.add(box(.35, 2.3, 2.5, 0x181b1e, -len / 2 + 1 + i * (len - 2) / 5, 1, s * (w / 2), .95));
  });
  return g;
}
function glassPane(w, h, dp, x, y, z) {
  const m = box(w, h, dp, GLS, x, y, z, .1, .3);
  m.material.transparent = true; m.material.opacity = .55; m.material.envMapIntensity = 2;
  return m;
}
function mkExcavator() {
  const g = new TH.Group();
  g.add(tracks(11, 6.4));
  const house = new TH.Group(); house.position.y = 2.1; g.add(house);
  house.add(box(9, 3.4, 6.2, YEL, -.6, 1.7, 0, .5, .15));
  house.add(box(3.4, 4.2, 4.6, YEL, 2.6, 2.1, -.6, .45, .15));
  house.add(glassPane(3.0, 2.6, 4.0, 2.7, 2.9, -.6));
  house.add(box(2.4, 3.2, 6.2, 0x2b2f34, -4.6, 1.6, 0, .8));
  const boom = new TH.Group(); boom.position.set(3.6, 2.2, 1.6); house.add(boom);
  boom.add(box(12, 1.5, 1.4, YEL, 6, 0, 0, .45, .2));
  const stick = new TH.Group(); stick.position.set(12, 0, 0); boom.add(stick);
  stick.add(box(8, 1.1, 1.0, YEL, 4, 0, 0, .45, .2));
  const bk = new TH.Group(); bk.position.set(8, 0, 0); stick.add(bk);
  bk.add(box(2.6, 2.6, 3.2, 0x36393d, 1, -.9, 0, .55, .5));
  for (let i = 0; i < 5; i++) bk.add(box(.9, .5, .35, 0x9a9da0, 2.3, -1.9, -1.3 + i * .65, .45, .6));
  g.userData = { house, boom, stick, bk };
  return g;
}
function mkDozer() {
  const g = new TH.Group();
  g.add(tracks(10, 6.2));
  g.add(box(7, 3.2, 5.4, YEL, -.5, 3.2, 0, .5, .15));
  g.add(box(3.2, 3.4, 4.4, YEL, -3, 4.6, 0, .45, .15));
  g.add(glassPane(2.8, 2.4, 4.0, -3, 5, 0));
  const bl = new TH.Group(); bl.position.set(6.4, 1.6, 0); g.add(bl);
  bl.add(box(.9, 4.4, 11, 0xa7adb3, 0, 0, 0, .28, .75));
  bl.add(box(2.6, .8, 11, 0xa7adb3, -1.2, -1.8, 0, .35, .6));
  g.add(box(5, .5, .5, STL, 2.6, 2.6, 2.4, .45, .7), box(5, .5, .5, STL, 2.6, 2.6, -2.4, .45, .7));
  g.userData = { bl };
  return g;
}
function mkTele() {
  const g = new TH.Group();
  g.add(box(12, 3.6, 6, 0xc8552f, 0, 3.4, 0, .5, .18));
  [-1, 1].forEach(s => [-3.6, 3.6].forEach(x => {
    const w = cyl(1.9, 1.9, 1.6, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 1.9, s * 3.1); g.add(w);
  }));
  g.add(box(3.2, 3.6, 3.4, 0xc8552f, -2.6, 6.6, -1.2, .45, .18));
  g.add(glassPane(2.8, 2.8, 3.0, -2.6, 6.9, -1.2));
  const boom = new TH.Group(); boom.position.set(-4.5, 5.4, 1.4); g.add(boom);
  boom.add(box(14, 1.8, 1.8, 0xd8dcdf, 7, 0, 0, .4, .5));
  const ext = new TH.Group(); ext.position.set(13, 0, 0); boom.add(ext);
  ext.add(box(9, 1.3, 1.3, 0xb4bac0, 4.5, 0, 0, .4, .5));
  const forks = new TH.Group(); forks.position.set(9, 0, 0); ext.add(forks);
  forks.add(box(.5, 3, 3.2, STL, 0, -.8, 0, .45, .7));
  const load = new TH.Group(); load.position.set(2.2, -1.6, 0); forks.add(load);
  load.add(box(4.4, 1.4, 6, 0xd6ae74, 0, 0, 0, .85));
  g.userData = { boom, ext, forks, load };
  return g;
}
function mkMixer() {
  const g = new TH.Group();
  g.add(box(20, 3, 7, 0x2f3439, -1, 3.4, 0, .7));
  g.add(box(6, 5.4, 7, 0xc2cad0, -8.6, 6.4, 0, .4, .35));
  g.add(glassPane(5.4, 2.2, 6.4, -8.8, 7.8, 0));
  const drum = cyl(3.4, 2.2, 12, 0xcbd1d6, .45, .45);
  drum.rotation.z = Math.PI / 2 - .22; drum.position.set(1, 8.4, 0); g.add(drum);
  const rib = cyl(3.5, 2.3, .5, 0x9aa1a8, .45, .5); rib.rotation.z = Math.PI / 2 - .22; rib.position.set(1, 8.4, 0); g.add(rib);
  const chute = box(6, .5, 2.2, 0x9aa1a8, 9.4, 5.2, 0, .4, .55); chute.rotation.z = -.3; g.add(chute);
  [-1, 1].forEach(s => [-7, 3, 6].forEach(x => {
    const w = cyl(2, 2, 1.4, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 2, s * 3.4); g.add(w);
  }));
  g.userData = { drum, rib, chute };
  return g;
}
function mkDump() {
  const g = new TH.Group();
  g.add(box(9, 4, 8, 0x9c3f34, -8, 4.6, 0, .5, .2));
  g.add(glassPane(7, 2.2, 7.4, -8, 6.2, 0));
  g.add(box(24, 1.6, 8, 0x2f3439, 2, 2.6, 0, .7));
  const bed = new TH.Group(); bed.position.set(12, 3.4, 0); g.add(bed);
  bed.add(box(20, .8, 8.4, 0x99a0a7, -10, 0, 0, .5, .45));
  [-1, 1].forEach(s => bed.add(box(20, 3.6, .6, 0x99a0a7, -10, 1.8, s * 4, .5, .45)));
  bed.add(box(.6, 3.6, 8.4, 0x99a0a7, -20, 1.8, 0, .5, .45));
  [-1, 1].forEach(s => [-9, 6, 10, 14].forEach(x => {
    const w = cyl(2.1, 2.1, 1.5, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 2.1, s * 3.8); g.add(w);
  }));
  g.userData = { bed };
  return g;
}
function mkPickup(col) {
  const g = new TH.Group();
  g.add(box(15, 2.6, 6.6, col, 0, 3.3, 0, .32, .35));
  g.add(box(6, 3, 6.4, col, -1, 5.6, 0, .32, .35));
  g.add(glassPane(5.4, 2, 6.5, -1, 6, 0));
  g.add(box(7, 1.9, 6.6, col, 5.2, 5.2, 0, .36, .3));
  [-1, 1].forEach(s => [-4.6, 4.4].forEach(x => {
    const w = cyl(1.5, 1.5, 1.1, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 1.5, s * 3.4); g.add(w);
  }));
  return g;
}
function mkLift() {
  const g = new TH.Group();
  g.add(box(8, 1.6, 5, 0x2b3035, 0, 1.6, 0, .7));
  [-1, 1].forEach(s => [-2.8, 2.8].forEach(x => {
    const w = cyl(1.1, 1.1, .9, 0x1b1e21, .9); w.rotation.x = Math.PI / 2; w.position.set(x, 1.1, s * 2.4); g.add(w);
  }));
  const mast = new TH.Group(); mast.position.y = 2.4; g.add(mast);
  for (let i = 0; i < 4; i++) mast.add(box(6.4 - i * .6, .4, 4 - i * .3, YEL, 0, i * .5, 0, .55, .2));
  const deck = new TH.Group(); deck.position.y = 2.4; g.add(deck);
  deck.add(box(7, .3, 4.4, 0xb8bec4, 0, 0, 0, .5, .4));
  [-1, 1].forEach(s => deck.add(box(7, 3.4, .2, YEL, 0, 1.7, s * 2.1, .55, .2)));
  [-1, 1].forEach(s => deck.add(box(.2, 3.4, 4.4, YEL, s * 3.4, 1.7, 0, .55, .2)));
  g.userData = { deck };
  return g;
}
function mkRoller() {
  const g = new TH.Group();
  g.add(box(7, 3, 5, YEL, 0, 4.2, 0, .5, .15));
  const dr = cyl(2.6, 2.6, 6, 0x99a0a7, .35, .6); dr.rotation.x = Math.PI / 2; dr.position.set(4, 2.6, 0); g.add(dr);
  const dr2 = cyl(2.4, 2.4, 6, 0x99a0a7, .35, .6); dr2.rotation.x = Math.PI / 2; dr2.position.set(-4, 2.4, 0); g.add(dr2);
  g.add(box(2.6, 2.6, 3, YEL, 0, 6.6, 0, .45, .15));
  g.userData = { dr, dr2 };
  return g;
}

const EQUIP = [];
function equip(obj, cfg) { obj.visible = false; scene.add(obj); EQUIP.push(Object.assign({ obj }, cfg)); }
(function placeEquipment() {
  const ex = mkExcavator();
  equip(ex, {
    t0: PH.excavate.t0 - .004, t1: PH.underground.t1, name: 'Excavator', dusty: 1,
    tick: (o) => {
      const path = [[-14, -14], [16, 10], [-6, 24], [24, -14]];
      const k = (clock * .022) % 1;
      const seg = Math.floor(k * 4) % 4, f = (k * 4) % 1;
      const a = path[seg], b = path[(seg + 1) % 4];
      const x = lerp(a[0], b[0], smooth(f)), z = lerp(a[1], b[1], smooth(f));
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      const c = clock * .8;
      o.userData.house.rotation.y = Math.sin(c * .9) * 1.1;
      o.userData.boom.rotation.z = -.28 + Math.sin(c * 2) * .30;
      o.userData.stick.rotation.z = -.9 + Math.sin(c * 2 + 1.1) * .55;
      o.userData.bk.rotation.z = .6 + Math.sin(c * 2 + 2.2) * .8;
    }
  });
  const dz = mkDozer();
  equip(dz, {
    t0: PH.clearing.t0, t1: PH.slab.t0 + .01, name: 'Dozer', dusty: 1,
    tick: (o) => {
      const t = (clock * .09) % 1, back = t > .5, u = back ? 1 - (t - .5) * 2 : t * 2;
      const x = lerp(-44, 52, u), z = -12 + Math.sin(clock * .07) * 22;
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = back ? -Math.PI / 2 : Math.PI / 2;
      o.userData.bl.rotation.z = Math.sin(clock * 1.6) * .08 - .05;
    }
  });
  const dt = mkDump();
  equip(dt, {
    t0: PH.excavate.t0 + .004, t1: PH.slab.t0, name: 'Haul truck', dusty: 1,
    tick: (o) => {
      const t = (clock * .05) % 1;
      const path = [[-70, 6], [-30, -2], [6, -30], [-40, -44], [-70, 6]];
      const seg = Math.min(3, Math.floor(t * 4)), f = t * 4 - seg;
      const a = path[seg], b = path[seg + 1];
      const x = lerp(a[0], b[0], f), z = lerp(a[1], b[1], f);
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      o.userData.bed.rotation.z = t > .3 && t < .38 ? -Math.sin((t - .3) / .08 * Math.PI) * .55 : 0;
    }
  });
  for (let i = 0; i < 2; i++) {
    const mx = mkMixer();
    equip(mx, {
      t0: i ? PH.slab.t0 + .004 : PH.foundation.t0 + .01,
      t1: i ? PH.slab.t1 : PH.foundation.t1 - .01, name: 'Mixer truck',
      tick: (o) => {
        const x = -40 + i * 16, z = -34 + Math.sin(clock * .12 + i) * 4;
        o.position.set(x, groundY(x, z), z);
        o.rotation.y = Math.PI * .5 + .3;
        o.userData.drum.rotation.y += .05; o.userData.rib.rotation.y += .05;
        o.userData.chute.rotation.y = Math.sin(clock * .4 + i) * .4;
      }
    });
  }
  const th = mkTele();
  equip(th, {
    t0: PH.framing.t0, t1: PH.roofstruct.t1, name: 'Telehandler',
    tick: (o) => {
      const x = 38 + Math.sin(clock * .1) * 10, z = -6 + Math.cos(clock * .08) * 16;
      o.position.set(x, groundY(x, z), z);
      o.rotation.y = Math.PI + Math.sin(clock * .1) * .5;
      const lift = Math.sin(clock * .35) * .5 + .5;
      o.userData.boom.rotation.z = .12 + lift * .55;
      o.userData.ext.position.x = 13 + lift * 7;
      o.userData.forks.rotation.z = -(.12 + lift * .55);
      o.userData.load.visible = lift > .12;
    }
  });
  for (let i = 0; i < 2; i++) {
    const lf = mkLift();
    equip(lf, {
      t0: PH.roughin.t0, t1: PH.interior.t1, name: 'Scissor lift', idx: i,
      tick: (o) => {
        const x = -18 + i * 26 + Math.sin(clock * .12 + i * 2) * 8;
        const z = 2 + Math.cos(clock * .1 + i * 3) * 14;
        o.position.set(x, FF, z);
        o.rotation.y = clock * .05 + i;
        o.userData.deck.position.y = 3 + (Math.sin(clock * .3 + i) * .5 + .5) * 6;
      }
    });
  }
  [[PH.slab.t0, PH.slab.t0 + .02, -44, 20, 30], [PH.sitework.t0 + .004, PH.sitework.t0 + .08, -64, -20, 6]].forEach(cfg => {
    const rl = mkRoller();
    equip(rl, {
      t0: cfg[0], t1: cfg[1], name: 'Roller', dusty: 1,
      tick: (o) => {
        const t = (clock * .07) % 1, u = t > .5 ? 1 - (t - .5) * 2 : t * 2;
        const x = lerp(cfg[2], cfg[3], u), z = cfg[4];
        o.position.set(x, groundY(x, z), z);
        o.rotation.y = t > .5 ? -Math.PI / 2 : Math.PI / 2;
        o.userData.dr.rotation.z += .08; o.userData.dr2.rotation.z += .08;
      }
    });
  });
  const pk = mkPickup(0x272c31);
  equip(pk, { t0: PH.survey.t0, t1: 1.01, name: "Superintendent's truck", tick: o => { o.position.set(-52, groundY(-52, -26), -26); o.rotation.y = .5; } });
  const pk2 = mkPickup(0x7a8288);
  equip(pk2, { t0: PH.framing.t0, t1: PH.closeout.t0, name: 'Trade truck', tick: o => { o.position.set(-58, groundY(-58, -14), -14); o.rotation.y = .4; } });
  const car = mkPickup(0x15181b);
  equip(car, { t0: PH.closeout.t0 + .016, t1: 1.01, name: "Owner's vehicle", tick: o => { o.position.set(40, groundY(40, -30), -30); o.rotation.y = Math.PI; } });
})();

/* ═══════════════ CREW ═══════════════════════════════════════════ */
const HATS = [0xd8b23c, 0xe4e7ea, 0x2f6fb5, 0xcf5a2e, 0x3f9a5c];
function mkWorker(seed) {
  const g = new TH.Group();
  const hat = HATS[seed % HATS.length], vest = seed % 3 === 0 ? 0xd8e04a : 0xe07c3a;
  g.add(box(1.5, 2.5, .9, vest, 0, 4.3, 0, .85));
  const head = new TH.Mesh(new TH.SphereGeometry(.52, 10, 7), new TH.MeshStandardMaterial({ color: 0xb9906c, roughness: .9 }));
  head.position.y = 5.9; head.castShadow = true; g.add(head);
  const hm = new TH.Mesh(new TH.SphereGeometry(.62, 11, 6, 0, TAU, 0, Math.PI / 2),
    new TH.MeshStandardMaterial({ color: hat, roughness: .4, envMapIntensity: .9 }));
  hm.position.y = 6.15; hm.castShadow = true; g.add(hm);
  g.add(box(1.5, .12, 1.5, hat, 0, 6.14, 0, .4));
  const la = box(.34, 2.1, .34, vest, -.95, 4.2, 0, .85), ra = box(.34, 2.1, .34, vest, .95, 4.2, 0, .85);
  const ll = box(.44, 3, .44, 0x2c3238, -.42, 1.5, 0, .9), rl = box(.44, 3, .44, 0x2c3238, .42, 1.5, 0, .9);
  g.add(la, ra, ll, rl);
  g.userData = { la, ra, ll, rl, seed };
  return g;
}
const CREW = [];
for (let i = 0; i < 22; i++) { const w = mkWorker(i); w.visible = false; scene.add(w); CREW.push(w); }
const ZONE = {
  contract: null, permit: null,
  survey: [10, 6, 46, 0], clearing: [8, 0, 50, 0], excavate: [6, 4, 34, -3.5],
  underground: [4, 6, 32, -3.4], foundation: [6, 2, 36, -1], slab: [6, 2, 34, 1.6],
  framing: [4, 2, 30, 1.6], roofstruct: [4, 2, 28, 14], roofing: [4, 2, 28, 18],
  openings: [4, 0, 30, 4], roughin: [2, 2, 26, 2], drywall: [2, 2, 26, 2],
  interior: [2, 4, 26, 2], exteriorfin: [8, 2, 34, 4], sitework: [12, 12, 48, 0],
  closeout: [2, 4, 26, 2]
};
const crewCount = ph => ph.crew.length ? Math.min(22, ph.crew.reduce((a, c) => a + c[1], 0)) : 0;
let crewActive = 0;
function updateCrew() {
  const ph = currentPhase(), zone = ZONE[ph.key];
  const n = flags.people && zone ? crewCount(ph) : 0;
  crewActive = zone ? crewCount(ph) : 0;
  for (let i = 0; i < CREW.length; i++) {
    const w = CREW[i], on = i < n;
    if (w.visible !== on) w.visible = on;
    if (!on) continue;
    const s = w.userData.seed;
    const a = clock * (.13 + (s % 5) * .022) + s * 2.4;
    const rr = zone[2] * (.28 + ((s * 37) % 100) / 140);
    const x = zone[0] + Math.cos(a) * rr, z = zone[1] + Math.sin(a * 1.31 + s) * rr * .72;
    let y = zone[3];
    if (ph.key === 'roofstruct' || ph.key === 'roofing') {
      const rf = ROOFS[0];
      y = rf.plate + rf.rise - Math.abs(z - rf.zc) * (rf.rise / rf.half) + .6;
      if (Math.abs(x - 11) > 22) y = FF;
    } else if (zone[3] < 2 && ph.key !== 'excavate' && ph.key !== 'underground') y = groundY(x, z);
    const bob = Math.sin(clock * 4.2 + s);
    w.position.set(x, y + Math.abs(bob) * .16, z);
    w.rotation.y = -a - Math.PI / 2;
    w.userData.ll.rotation.x = bob * .55; w.userData.rl.rotation.x = -bob * .55;
    w.userData.la.rotation.x = -bob * .5; w.userData.ra.rotation.x = bob * .5;
  }
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
  function place(g, x, z, ry, t0, t1, x0, x1) {
    g.position.set(x, 0, z); g.rotation.y = ry || 0;
    addU(g, {
      t0: t0 === undefined ? IN : t0, t1: (t0 === undefined ? IN : t0) + .008,
      x0: x0 === undefined ? OUT : x0, x1: x1 === undefined ? OUT1 : x1, l: 'temps',
      tick: (o, u, v) => { g.position.y = groundY(x, z) + (1 - easeOut(u)) * -8 + v * 5; }
    });
  }
  const tr = new TH.Group();
  tr.add(box(34, 9, 12, 0xdde2e6, 0, 6.5, 0, .62));
  tr.add(box(34.6, 1, 12.6, 0x99a0a7, 0, 11.4, 0, .5, .4));
  for (let i = 0; i < 4; i++) tr.add(glassPane(3.4, 3, .3, -12 + i * 8, 7.6, 6.1));
  tr.add(box(3, 6.6, .4, 0x454c53, 13, 5.3, 6.1, .7));
  tr.add(box(5, .4, 4, 0x666d74, 13, 2.2, 8.4, .8));
  tr.add(box(3, 2.4, .2, 0xd4a860, -12, 10.2, 6.2, .5));
  place(tr, -62, 6, .28);
  [[-46, -40], [-38, 22]].forEach((p, i) => {
    const dm = new TH.Group();
    dm.add(box(20, 7, 8, i ? 0x46613f : 0x8a4a3c, 0, 3.5, 0, .85));
    dm.add(box(20.4, .5, 8.4, 0x35393e, 0, 7.1, 0, .8));
    place(dm, p[0], p[1], i ? .5 : -.2);
  });
  [[-52, -34], [-48, -34], [-44, -34]].forEach((p, i) => {
    const pt = new TH.Group();
    pt.add(box(4, 8, 4, i === 1 ? 0x3f7fa8 : 0x4a8f6a, 0, 4, 0, .72));
    pt.add(box(4.2, .6, 4.2, 0xe4e8eb, 0, 8.2, 0, .68));
    place(pt, p[0], p[1], .1 * i);
  });
  const tp = new TH.Group();
  tp.add(box(1, 22, 1, 0x6b5b45, 0, 11, 0, .9));
  tp.add(box(2.4, 3.4, 1.4, 0x99a0a7, 1.4, 15, 0, .45, .5));
  place(tp, -70, -18, 0, PH.clearing.t0 + .006, 0, PH.sitework.t1 - .02, PH.sitework.t1 - .01);
  for (let i = 0; i < 16; i++) {
    const fp = new TH.Group();
    fp.add(box(11.6, 7, .3, 0xc4cace, 0, 3.6, 0, .7, .35));
    for (let k = 0; k < 3; k++) fp.add(box(.4, 7.4, .5, 0x99a0a7, -5.6 + k * 5.6, 3.7, 0, .55, .45));
    const x = -92 + i * 3, z = -56 + i * 7.6;
    place(fp, x, z, Math.atan2(3, 7.6), PH.clearing.t0 + .002 + i * .0004, 0, PH.sitework.t0 + .01, PH.sitework.t0 + .022);
  }
  function stack(x, z, col, t0, phaseKey, label, note, w, h, dp) {
    const g = new TH.Group(), rows = 6, parts = [];
    for (let i = 0; i < rows; i++) {
      const b = box(w, h / rows * .82, dp, col, 0, h / rows * (i + .5), (i % 2) * .6 - .3, .85);
      g.add(b); parts.push(b);
    }
    g.position.set(x, 0, z); g.rotation.y = R() * .4;
    g.userData.meta = { n: label, s: 'site', d: note };
    addU(g, {
      t0: t0, t1: t0 + .006, l: 'temps',
      tick: (o, u) => {
        g.position.y = groundY(x, z) + (1 - easeOut(u)) * -6;
        const used = PH[phaseKey] ? sat((T - PH[phaseKey].t0) / (PH[phaseKey].t1 - PH[phaseKey].t0)) : 0;
        parts.forEach((p, i) => p.visible = (i / rows) < 1 - used * .96);
      }
    });
  }
  stack(-30, -42, 0xd6ae74, PH.framing.t0 - .008, 'framing', 'Lumber package',
    'Delivered in the order it is needed — plates and studs first, then joists, then the truss set.', 22, 6, 8);
  stack(-14, -44, 0xd6ae74, PH.roofstruct.t0 - .006, 'roofstruct', 'Truss bundle',
    'Stacked flat and blocked off the ground so the trusses cannot twist before they are set.', 26, 5, 7);
  stack(20, -42, 0xe9e5dc, PH.drywall.t0 - .006, 'drywall', 'Drywall load',
    'Boarded room by room through the window openings before the glass goes in.', 18, 4, 8);
  stack(34, 14, 0x7f766a, PH.exteriorfin.t0 - .006, 'exteriorfin', 'Stone pallets',
    'Blended across three pallets at a time so the finished wall has no colour banding.', 10, 5, 10);
})();

/* ═══════════════ WEATHER PARTICLES ══════════════════════════════ */
const wxCount = SMALL ? 1400 : 2600;
const wxGeo = new TH.BufferGeometry();
const wxPos = new Float32Array(wxCount * 3), wxSeed = new Float32Array(wxCount);
for (let i = 0; i < wxCount; i++) {
  wxPos[i * 3] = (Math.random() - .5) * 300;
  wxPos[i * 3 + 1] = Math.random() * 130;
  wxPos[i * 3 + 2] = (Math.random() - .5) * 260;
  wxSeed[i] = Math.random();
}
wxGeo.setAttribute('position', new TH.BufferAttribute(wxPos, 3));
const wxMat = new TH.PointsMaterial({ color: 0xdfe9f2, size: .55, transparent: true, opacity: 0, depthWrite: false });
const wxPts = new TH.Points(wxGeo, wxMat);
wxPts.frustumCulled = false;
scene.add(wxPts);

/* ═══════════════ DUST — kicked up by earthwork equipment ════════ */
const duCount = SMALL ? 90 : 170;
const duGeo = new TH.BufferGeometry();
const duPos = new Float32Array(duCount * 3), duSeed = new Float32Array(duCount);
for (let i = 0; i < duCount; i++) {
  duPos[i * 3] = (Math.random() - .5) * 120;
  duPos[i * 3 + 1] = Math.random() * 8;
  duPos[i * 3 + 2] = (Math.random() - .5) * 100;
  duSeed[i] = Math.random();
}
duGeo.setAttribute('position', new TH.BufferAttribute(duPos, 3));
const duMat = new TH.PointsMaterial({ color: 0xb9a486, size: 2.6, transparent: true, opacity: 0, depthWrite: false, map: TEX.cloud.map });
const duPts = new TH.Points(duGeo, duMat);
duPts.frustumCulled = false;
scene.add(duPts);
function updateDust(dt) {
  const day = T * DAYS;
  const earthy = flags.people && day > PH.clearing.d0 && day < PH.slab.d1 && weatherAt(day).t === 'clear';
  duMat.opacity = lerp(duMat.opacity, earthy ? .16 : 0, 1 - Math.pow(.06, dt));
  duPts.visible = duMat.opacity > .01;
  if (!duPts.visible) return;
  const Pd = duGeo.attributes.position.array;
  for (let i = 0; i < duCount; i++) {
    Pd[i * 3] += dt * (2.5 + duSeed[i] * 2);
    Pd[i * 3 + 1] += dt * (1.2 + duSeed[i] * 1.6);
    if (Pd[i * 3 + 1] > 9 + duSeed[i] * 5) {
      /* respawn near a working machine so the dust reads as activity */
      let ax = 8, az = 2, found = false;
      for (let k = 0; k < EQUIP.length; k++) {
        if (EQUIP[k].dusty && EQUIP[k].obj.visible) { ax = EQUIP[k].obj.position.x; az = EQUIP[k].obj.position.z; found = true; break; }
      }
      Pd[i * 3] = ax + (Math.random() - .5) * (found ? 16 : 90);
      Pd[i * 3 + 1] = groundY(Pd[i * 3], az) + .5;
      Pd[i * 3 + 2] = az + (Math.random() - .5) * (found ? 14 : 80);
    }
  }
  duGeo.attributes.position.needsUpdate = true;
}
