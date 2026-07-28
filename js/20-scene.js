/* ═════════════════════════════════════════════════════════════════
   20 · renderer, atmosphere and terrain
   ═════════════════════════════════════════════════════════════════ */
const root = document.getElementById('ct');
const canvas = document.getElementById('ctv');
const SMALL = Math.min(innerWidth, innerHeight) < 780 ||
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
const renderer = new TH.WebGLRenderer({ canvas, antialias: !SMALL, powerPreference: 'high-performance', alpha: false });
let DPR_CAP = SMALL ? 1.5 : 1.85;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP));
renderer.setSize(root.clientWidth || innerWidth, root.clientHeight || innerHeight, false);
renderer.outputEncoding = TH.sRGBEncoding;
renderer.toneMapping = TH.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = SMALL ? TH.PCFShadowMap : TH.PCFSoftShadowMap;
MAXANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
buildTextures();

const scene = new TH.Scene();
scene.fog = new TH.Fog(0x9fb2c4, 300, 1700);
const camera = new TH.PerspectiveCamera(42, 1, .5, 3400);

/* ── sky dome with a real sun ── */
const skyU = {
  top: { value: new TH.Color(0x2c6ba6) },
  hz: { value: new TH.Color(0xc8dae6) },
  bot: { value: new TH.Color(0x6f7d88) },
  sunDir: { value: new TH.Vector3(0, 1, 0) },
  sunI: { value: 1 }
};
const skyMat = new TH.ShaderMaterial({
  side: TH.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: [
    'uniform vec3 top;uniform vec3 hz;uniform vec3 bot;uniform vec3 sunDir;uniform float sunI;varying vec3 vP;',
    'void main(){vec3 dir=normalize(vP);float h=dir.y;',
    'vec3 c=mix(hz,top,smoothstep(-0.02,0.62,h));',
    'c=mix(bot,c,smoothstep(-0.30,0.015,h));',
    'float sd=max(dot(dir,sunDir),0.0);',
    'c+=sunI*vec3(1.0,0.88,0.70)*pow(sd,1100.0)*14.0;',
    'c+=sunI*vec3(1.0,0.76,0.52)*pow(sd,14.0)*0.26;',
    'c+=sunI*vec3(1.0,0.84,0.66)*pow(sd,3.0)*0.06;',
    'float dth=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
    'c+=(dth-0.5)*0.007;gl_FragColor=vec4(c,1.0);}'
  ].join('\n')
});
const sky = new TH.Mesh(new TH.SphereGeometry(2000, 40, 22), skyMat);
sky.frustumCulled = false;
scene.add(sky);

/* ── stars — fade in with night ── */
const stars = (function () {
  const N = SMALL ? 500 : 1100, g = new TH.BufferGeometry();
  const p = new Float32Array(N * 3), rr = rng(777);
  for (let i = 0; i < N; i++) {
    const a = rr() * TAU, e = Math.asin(rr() * .96 + .03), rad = 1900;
    p[i * 3] = Math.cos(a) * Math.cos(e) * rad;
    p[i * 3 + 1] = Math.sin(e) * rad;
    p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * rad;
  }
  g.setAttribute('position', new TH.BufferAttribute(p, 3));
  const m = new TH.PointsMaterial({ color: 0xcfe0f2, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const pts = new TH.Points(g, m);
  pts.frustumCulled = false; pts.renderOrder = -2;
  scene.add(pts);
  return pts;
})();

/* ── sun glare sprite ── */
const glare = new TH.Sprite(new TH.SpriteMaterial({
  map: TEX.glare.map, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false,
  blending: TH.AdditiveBlending
}));
glare.scale.set(520, 520, 1);
glare.renderOrder = 5;
scene.add(glare);

/* ── clouds ── */
const clouds = [];
(function () {
  const g = new TH.PlaneGeometry(1, 1);
  const rr = rng(909);
  for (let i = 0; i < 13; i++) {
    const m = new TH.Mesh(g, new TH.MeshBasicMaterial({
      map: TEX.cloud.map, transparent: true, depthWrite: false, fog: false,
      opacity: .34 + rr() * .3, side: TH.DoubleSide
    }));
    const s = 420 + rr() * 760;
    m.scale.set(s, s * .62, 1);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rr() * TAU;
    m.position.set((rr() - .5) * 2600, 320 + rr() * 260, (rr() - .5) * 2600);
    m.renderOrder = -1;
    m.frustumCulled = false;
    scene.add(m); clouds.push(m);
  }
})();

/* ── lights ── */
const hemi = new TH.HemisphereLight(0xbcd4e8, 0x4a4237, .6);
scene.add(hemi);
const sun = new TH.DirectionalLight(0xfff2dc, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(SMALL ? 1024 : 2048, SMALL ? 1024 : 2048);
const sc = sun.shadow.camera;
sc.left = -112; sc.right = 132; sc.top = 128; sc.bottom = -108; sc.near = 30; sc.far = 500;
sc.updateProjectionMatrix();
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = .45;
scene.add(sun, sun.target);
const amb = new TH.AmbientLight(0xffffff, .14);
scene.add(amb);
const fill = new TH.DirectionalLight(0xa8c0d8, .30);
fill.position.set(-120, 60, -90);
scene.add(fill);
/* cool moonlight, keyed to night in 80-main.js */
const moon = new TH.DirectionalLight(0x9db8dd, 0);
moon.position.set(120, 180, -140);
scene.add(moon);

/* ── environment reflections (generated once from a neutral sky) ── */
(function buildEnv() {
  try {
    const pm = new TH.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    const es = new TH.Scene();
    const em = skyMat.clone();
    em.uniforms = TH.UniformsUtils.clone(skyU);
    em.uniforms.top.value = new TH.Color(0x2f6fa8);
    em.uniforms.hz.value = new TH.Color(0xcfdfea);
    em.uniforms.bot.value = new TH.Color(0x707d87);
    em.uniforms.sunDir.value = new TH.Vector3(.45, .62, .35).normalize();
    em.uniforms.sunI.value = 1;
    es.add(new TH.Mesh(new TH.SphereGeometry(600, 24, 14), em));
    const rt = pm.fromScene(es, 0, .1, 1400);
    scene.environment = rt.texture;
    pm.dispose();
  } catch (e) { /* reflections are a bonus, never a requirement */ }
})();

/* ═══════════════ TERRAIN ════════════════════════════════════════ */
const SITE_W = 280, SITE_D = 240, SEG_X = 104, SEG_Z = 88;
function natural(x, z) {
  return 2.1 * Math.sin(x * 0.0295) + 1.7 * Math.cos(z * 0.0362)
    + 1.15 * Math.sin((x * 0.7 + z) * 0.0224) + 0.55 * Math.cos((x - z * 1.3) * 0.058)
    - x * 0.0325 + z * 0.0225 + 0.34 * Math.sin(x * 0.19) * Math.cos(z * 0.17);
}
function padMask(x, z) {
  const dx = Math.max(0, Math.abs(x - 13) - 62), dz = Math.max(0, Math.abs(z - 5) - 47);
  return 1 - smooth(Math.hypot(dx, dz) / 34);
}
function digMask(x, z) {
  const dx = Math.max(0, Math.abs(x - 13) - 47), dz = Math.max(0, Math.abs(z - 6) - 32);
  return 1 - smooth(Math.hypot(dx, dz) / 7);
}
const TRENCH = [
  [-112, 14, -46, 14, 2.6], [-46, 14, -46, -6, 2.6], [-46, -6, -30, -6, 2.6],
  [-46, 14, -46, 26, 2.2], [-30, 30, 26, 44, 2.6], [26, 44, 74, 60, 3.2],
  [58, 8, 96, 8, 2.4]
];
function segDist(px2, pz, x1, z1, x2, z2) {
  const vx = x2 - x1, vz = z2 - z1, wx = px2 - x1, wz = pz - z1;
  const L = vx * vx + vz * vz;
  const t = L > 0 ? clamp((wx * vx + wz * vz) / L, 0, 1) : 0;
  return Math.hypot(px2 - (x1 + vx * t), pz - (z1 + vz * t));
}
function trenchMask(x, z) {
  let m = 0;
  for (let i = 0; i < TRENCH.length; i++) {
    const t = TRENCH[i];
    m = Math.max(m, 1 - smooth((segDist(x, z, t[0], t[1], t[2], t[3]) - t[4] * .55) / (t[4] * .9)));
  }
  return m;
}
const SPOIL = [[-64, -40, 15, 6.4], [-70, 34, 13, 5.2], [64, -34, 14, 5.8], [44, 62, 16, 5.0]];

const terrainGeo = new TH.PlaneGeometry(SITE_W, SITE_D, SEG_X, SEG_Z);
terrainGeo.rotateX(-Math.PI / 2);
const tPos = terrainGeo.attributes.position;
const tCol = new TH.BufferAttribute(new Float32Array(tPos.count * 3), 3);
terrainGeo.setAttribute('color', tCol);
TEX.ground.map.repeat.set(30, 26); TEX.ground.nrm.repeat.set(30, 26);
const terrainMat = new TH.MeshStandardMaterial({
  vertexColors: true, roughness: .96, metalness: 0,
  map: TEX.ground.map, normalMap: TEX.ground.nrm,
  normalScale: new TH.Vector2(1.3, 1.3), envMapIntensity: .35
});
const terrain = new TH.Mesh(terrainGeo, terrainMat);
terrain.receiveShadow = true;
terrain.userData.meta = {
  n: 'Site grade', s: 'site',
  d: 'Native soil is stripped, cut to subgrade, excavated for footings, then backfilled in compacted lifts before the slab is placed.'
};
scene.add(terrain);

let _grade = 0, _dig = 0, _tr = 0, _fill = 0, _spoil = 0, _snow = 0, _lawn = 0;

/* analytic ground height — used to sit objects on the terrain */
function spoilAt(x, z) {
  let a = 0;
  for (let i = 0; i < SPOIL.length; i++) {
    const s = SPOIL[i], dd = Math.hypot(x - s[0], z - s[1]);
    if (dd < s[2]) a += Math.pow(Math.cos(dd / s[2] * Math.PI * .5), 1.7) * s[3];
  }
  return a;
}
function groundY(x, z) {
  const base = natural(x, z);
  const target = -0.35 - Math.max(0, x - 40) * 0.012;
  let h = base + (target - base) * padMask(x, z) * _grade;
  h -= digMask(x, z) * 4.6 * _dig * (1 - _fill * .965);
  h -= trenchMask(x, z) * 3.4 * _tr * (1 - _fill);
  h += spoilAt(x, z) * _spoil;
  return h;
}

/* ── the terrain mesh evaluates the same formula, but every term that
   does not depend on time is baked once so the per-frame regrade is
   pure arithmetic. Normals come from the height grid directly. ── */
const VN = tPos.count;
const F_NAT = new Float32Array(VN), F_TGT = new Float32Array(VN), F_PAD = new Float32Array(VN);
const F_DIG = new Float32Array(VN), F_TRN = new Float32Array(VN), F_SPL = new Float32Array(VN);
const F_VAR = new Float32Array(VN), F_H = new Float32Array(VN);
(function bakeTerrain() {
  const P2 = tPos.array;
  for (let i = 0, j = 0; i < VN; i++, j += 3) {
    const x = P2[j], z = P2[j + 2];
    F_NAT[i] = natural(x, z);
    F_TGT[i] = -0.35 - Math.max(0, x - 40) * 0.012;
    F_PAD[i] = padMask(x, z);
    F_DIG[i] = digMask(x, z);
    F_TRN[i] = trenchMask(x, z);
    F_SPL[i] = spoilAt(x, z);
    F_VAR[i] = (Math.sin(x * .31) * Math.cos(z * .27) + 1) * .5;
  }
})();
const COLS = SEG_X + 1, ROWS = SEG_Z + 1;
const DX2 = (SITE_W / SEG_X) * 2, DZ2 = (SITE_D / SEG_Z) * 2;
const tNrm = terrainGeo.attributes.normal;
let _tKey = -1;
function terrainUpdate() {
  _grade = smooth(pw(56, 71)); _dig = smooth(pw(72, 88)); _tr = smooth(pw(76, 92));
  _fill = smooth(pw(126, 140));
  _spoil = smooth(pw(74, 84)) * (1 - smooth(pw(126, 141)));
  _snow = flags.wx ? snowCover(T * DAYS) : 0;
  _lawn = smooth(pw(374, 394));
  /* nothing to redraw unless one of the drivers actually moved */
  const key = _grade + _dig * 3 + _tr * 7 + _fill * 13 + _spoil * 17 + _snow * 23 + _lawn * 29;
  if (Math.abs(key - _tKey) < 6e-4) return;
  _tKey = key;

  const P2 = tPos.array, C = tCol.array, N = tNrm.array;
  const kDig = 4.6 * _dig * (1 - _fill * .965), kTrn = 3.4 * _tr * (1 - _fill);
  for (let i = 0, j = 0; i < VN; i++, j += 3) {
    const base = F_NAT[i];
    const h = base + (F_TGT[i] - base) * F_PAD[i] * _grade - F_DIG[i] * kDig - F_TRN[i] * kTrn + F_SPL[i] * _spoil;
    F_H[i] = h; P2[j + 1] = h;
    const n = F_VAR[i];
    let r = .225 + n * .06, g = .305 + n * .07, b = .150 + n * .032;
    const dis = sat(F_PAD[i] * _grade * 1.1 + F_TRN[i] * _tr + F_DIG[i] * _dig);
    r += (.352 + n * .05 - r) * dis; g += (.272 + n * .04 - g) * dis; b += (.181 + n * .03 - b) * dis;
    const lawn = _lawn * F_PAD[i];
    r += (.178 + n * .05 - r) * lawn; g += (.368 + n * .075 - g) * lawn; b += (.140 + n * .03 - b) * lawn;
    if (_snow > .01) {
      const k = _snow * (.72 + n * .28);
      r += (.93 - r) * k; g += (.95 - g) * k; b += (.99 - b) * k;
    }
    C[j] = r; C[j + 1] = g; C[j + 2] = b;
  }
  /* height-field normals */
  for (let row = 0; row < ROWS; row++) {
    const o = row * COLS;
    const up = (row > 0 ? o - COLS : o), dn = (row < ROWS - 1 ? o + COLS : o);
    const sz = (row > 0 && row < ROWS - 1) ? DZ2 : DZ2 * .5;
    for (let cx = 0; cx < COLS; cx++) {
      const i = o + cx;
      const l = cx > 0 ? i - 1 : i, rr = cx < COLS - 1 ? i + 1 : i;
      const sx = (cx > 0 && cx < COLS - 1) ? DX2 : DX2 * .5;
      const fx = (F_H[rr] - F_H[l]) / sx, fz = (F_H[dn + cx] - F_H[up + cx]) / sz;
      const inv = 1 / Math.sqrt(fx * fx + 1 + fz * fz);
      const j = i * 3;
      N[j] = -fx * inv; N[j + 1] = inv; N[j + 2] = -fz * inv;
    }
  }
  tPos.needsUpdate = true; tCol.needsUpdate = true; tNrm.needsUpdate = true;
}

/* soft contact shadow under the building — fades in with the structure */
const aoDecal = new TH.Mesh(
  new TH.PlaneGeometry(150, 118),
  new TH.MeshBasicMaterial({ map: TEX.ao.map, transparent: true, opacity: 0, depthWrite: false, fog: true })
);
aoDecal.rotation.x = -Math.PI / 2;
aoDecal.position.set(12, .06, 4);
aoDecal.renderOrder = 1;
scene.add(aoDecal);

/* distant ridges */
(function ridges() {
  const g = new TH.BufferGeometry(), N = 132, verts = [], cols = [];
  const c1 = new TH.Color(0x415568), c2 = new TH.Color(0x8199ad);
  for (let ring = 0; ring < 3; ring++) {
    const rad = 900 + ring * 250, amp = 150 - ring * 24, base = -30 - ring * 14;
    const rr = rng(700 + ring * 31);
    for (let i = 0; i < N; i++) {
      const a0 = i / N * TAU, a1 = (i + 1) / N * TAU;
      const h0 = base + amp * (.35 + .65 * Math.abs(Math.sin(a0 * 3.7 + ring) * Math.cos(a0 * 1.9 + rr() * .02)));
      const h1 = base + amp * (.35 + .65 * Math.abs(Math.sin(a1 * 3.7 + ring) * Math.cos(a1 * 1.9 + rr() * .02)));
      const x0 = Math.sin(a0) * rad, z0 = Math.cos(a0) * rad;
      const x1 = Math.sin(a1) * rad, z1 = Math.cos(a1) * rad;
      verts.push(x0, base - 300, z0, x1, base - 300, z1, x1, h1, z1);
      verts.push(x0, base - 300, z0, x1, h1, z1, x0, h0, z0);
      const hs = [base - 300, base - 300, h1, base - 300, h1, h0];
      for (let k = 0; k < 6; k++) {
        const t = sat((hs[k] - base) / amp);
        const col = c1.clone().lerp(c2, t * .55 + ring * .17);
        if (t > .70) col.lerp(new TH.Color(0xeaf1f6), (t - .70) * 2.8);
        cols.push(col.r, col.g, col.b);
      }
    }
  }
  g.setAttribute('position', new TH.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new TH.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const m = new TH.Mesh(g, new TH.MeshBasicMaterial({ vertexColors: true, fog: true }));
  m.frustumCulled = false;
  scene.add(m);
})();
