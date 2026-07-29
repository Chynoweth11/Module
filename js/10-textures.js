/* ═════════════════════════════════════════════════════════════════
   10 · procedural texture engine
   Every surface texture is drawn at load time into a canvas — colour,
   plus a normal map derived from the same height field. Nothing is
   downloaded. buildTextures() is called from 20-scene.js once the
   renderer exists (so MAXANISO is known).
   ═════════════════════════════════════════════════════════════════ */
const TEX = {};
let MAXANISO = 4;

function cvs(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }

/* tileable fractal value noise — table-driven, no per-pixel floor/modulo */
function noiseField(n, freq, oct, seed) {
  const out = new Float32Array(n * n);
  const i0 = new Int32Array(n), i1 = new Int32Array(n), fr = new Float32Array(n);
  let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const g = Math.max(2, (freq * (1 << o)) | 0), rr = rng(seed + o * 9173);
    const grid = new Float32Array(g * g);
    for (let i = 0; i < g * g; i++) grid[i] = rr();
    const sc = g / n;
    for (let i = 0; i < n; i++) {
      const f = i * sc, a = f | 0, t = f - a;
      i0[i] = a % g; i1[i] = (a + 1) % g; fr[i] = t * t * (3 - 2 * t);
    }
    for (let y = 0; y < n; y++) {
      const r0 = i0[y] * g, r1 = i1[y] * g, sy = fr[y], row = y * n;
      for (let x = 0; x < n; x++) {
        const xa = i0[x], xb = i1[x], sx = fr[x];
        const p = grid[r0 + xa], q = grid[r0 + xb];
        const u = grid[r1 + xa], v = grid[r1 + xb];
        const a = p + (q - p) * sx, b = u + (v - u) * sx;
        out[row + x] += (a + (b - a) * sy) * amp;
      }
    }
    tot += amp; amp *= .5;
  }
  const inv = 1 / tot;
  for (let i = 0; i < out.length; i++) out[i] *= inv;
  return out;
}
function mkTexture(canvas, rep) {
  const t = new TH.CanvasTexture(canvas);
  t.wrapS = t.wrapT = TH.RepeatWrapping;
  t.anisotropy = MAXANISO;
  if (rep) t.repeat.set(rep, rep);
  return t;
}
/* height field → tangent-space normal map */
function normalFrom(H, n, st) {
  const nc = cvs(n), nctx = nc.getContext('2d');
  const nimg = nctx.createImageData(n, n), ND = nimg.data;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    const l = H[y * n + ((x - 1 + n) % n)], r = H[y * n + ((x + 1) % n)];
    const u = H[((y - 1 + n) % n) * n + x], dn = H[((y + 1) % n) * n + x];
    let nx = (l - r) * st, ny = (u - dn) * st, nz = 1;
    const m = Math.sqrt(nx * nx + ny * ny + nz * nz);
    ND[i * 4] = (nx / m * .5 + .5) * 255;
    ND[i * 4 + 1] = (ny / m * .5 + .5) * 255;
    ND[i * 4 + 2] = (nz / m * .5 + .5) * 255;
    ND[i * 4 + 3] = 255;
  }
  nctx.putImageData(nimg, 0, 0);
  return mkTexture(nc);
}
/* build a colour texture + matching normal map from one height field */
function surface(name, n, paint, bump) {
  const c = cvs(n), ctx = c.getContext('2d');
  const img = ctx.createImageData(n, n);
  const H = new Float32Array(n * n);
  paint(img.data, H, n);
  ctx.putImageData(img, 0, 0);
  TEX[name] = { map: mkTexture(c), nrm: normalFrom(H, n, bump === undefined ? 2.2 : bump) };
  return TEX[name];
}
const px = (D, i, r, g, b) => { D[i * 4] = r * 255; D[i * 4 + 1] = g * 255; D[i * 4 + 2] = b * 255; D[i * 4 + 3] = 255; };
/* colour canvas → height from luminance → texture pair */
function bakePainted(name, c, n, st) {
  const ctx = c.getContext('2d');
  const id = ctx.getImageData(0, 0, n, n), H = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) H[i] = id.data[i * 4] / 255;
  TEX[name] = { map: mkTexture(c), nrm: normalFrom(H, n, st) };
}

function buildTextures() {
  /* concrete — blotchy grey with aggregate speckle */
  const cf = noiseField(128, 3, 3, 11), cs = noiseField(128, 22, 2, 12);
  surface('concrete', 128, (D, H, n) => {
    for (let i = 0; i < n * n; i++) {
      const v = .82 + cf[i] * .30 - .12, sp = cs[i];
      const k = v + (sp > .74 ? .12 : sp < .22 ? -.09 : 0);
      H[i] = k + (sp > .78 ? .5 : 0);
      px(D, i, k * .98, k * .99, k);
    }
  }, 1.7);
  /* framing lumber — grain running along the length */
  const wg = noiseField(128, 4, 3, 21), wf = noiseField(128, 14, 2, 22);
  surface('wood', 128, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const grain = Math.sin((x + wg[i] * 17) * 1.04) * .5 + .5;
      const k = .74 + grain * .18 + wf[i] * .12 - .06;
      H[i] = grain * .7 + wf[i] * .3;
      px(D, i, k * 1.0, k * .80, k * .53);
    }
  }, 1.3);
  /* white oak — tighter, warmer, satin */
  const og = noiseField(128, 3, 3, 31), of = noiseField(128, 18, 2, 32);
  surface('oak', 128, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const grain = Math.pow(Math.sin((x + og[i] * 13) * 1.56) * .5 + .5, 1.6);
      const plank = (y % 21) < 1 ? .72 : 1;
      const k = (.78 + grain * .13 + of[i] * .07 - .04) * plank;
      H[i] = grain * .5 + (plank < 1 ? -.6 : 0);
      px(D, i, k * 1.0, k * .78, k * .52);
    }
  }, 1.2);
  /* OSB — random strand chips */
  (function () {
    const n = 256, c = cvs(n), ctx = c.getContext('2d');
    ctx.fillStyle = '#b9925f'; ctx.fillRect(0, 0, n, n);
    const rr = rng(41);
    for (let i = 0; i < 620; i++) {
      const w = 12 + rr() * 34, h = 4 + rr() * 8, a = rr() * Math.PI;
      const l = .58 + rr() * .38;
      ctx.save();
      ctx.translate(rr() * n, rr() * n); ctx.rotate(a);
      ctx.fillStyle = 'rgba(' + (200 * l | 0) + ',' + (162 * l | 0) + ',' + (104 * l | 0) + ',.85)';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
    bakePainted('osb', c, n, 1.4);
  })();
  /* ledgestone — irregular courses with raked joints */
  (function () {
    const n = 256, c = cvs(n), ctx = c.getContext('2d');
    ctx.fillStyle = '#3b372f'; ctx.fillRect(0, 0, n, n);
    const rr = rng(55), rows = 8, rh = n / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rr() * 60;
      while (x < n) {
        const w = 20 + rr() * 46, h = rh - 2 - rr() * 2;
        const l = .48 + rr() * .40, warm = .88 + rr() * .24;
        ctx.fillStyle = 'rgb(' + (168 * l * warm | 0) + ',' + (156 * l | 0) + ',' + (138 * l * .95 | 0) + ')';
        ctx.fillRect(x + 1.5, r * rh + 1.5, w - 3, h);
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        ctx.fillRect(x + 1.5, r * rh + 1.5, w - 3, 2.5);
        ctx.fillStyle = 'rgba(0,0,0,.16)';
        ctx.fillRect(x + 1.5, r * rh + h - 1, w - 3, 2.5);
        x += w;
      }
    }
    const gr = noiseField(n, 40, 2, 56), id = ctx.getImageData(0, 0, n, n), D = id.data;
    for (let i = 0; i < n * n; i++) {
      const g = (gr[i] - .5) * 34;
      D[i * 4] = clamp(D[i * 4] + g, 0, 255); D[i * 4 + 1] = clamp(D[i * 4 + 1] + g, 0, 255);
      D[i * 4 + 2] = clamp(D[i * 4 + 2] + g, 0, 255);
    }
    ctx.putImageData(id, 0, 0);
    bakePainted('stone', c, n, 4.2);
  })();
  /* stucco — fine sand float finish */
  const sf = noiseField(256, 58, 2, 61), sb = noiseField(256, 7, 3, 62), sw = noiseField(256, 19, 2, 63);
  surface('stucco', 256, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      /* sand grain + a slow trowel swirl so raking light has something to find */
      const swirl = Math.sin((x * .11 + sw[i] * 5.2)) * .5 + .5;
      const k = .90 + (sf[i] - .5) * .085 + (sb[i] - .5) * .045 + (swirl - .5) * .022;
      H[i] = sf[i] * .62 + sw[i] * .28 + sb[i] * .10;
      px(D, i, k, k * .987, k * .958);
    }
  }, 2.4);
  /* slate — mottled, faintly cleft */
  const qf = noiseField(256, 6, 3, 71), qs = noiseField(256, 34, 2, 72), qc = noiseField(256, 3, 2, 73);
  surface('slate', 256, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      /* cleaving planes run with the bed, so band the height along y */
      const cleft = Math.abs(Math.sin(y * .42 + qf[i] * 3.1));
      const k = .55 + (qf[i] - .5) * .34 + (qs[i] - .5) * .13 + cleft * .05;
      H[i] = qf[i] * .55 + qs[i] * .25 + cleft * .20;
      /* purple-grey through green-grey, the way a graduated roof reads */
      const warm = qc[i];
      px(D, i, k * (.90 + warm * .10), k * (.97 - warm * .04), k * (1.06 - warm * .10));
    }
  }, 2.8);
  /* brushed metal */
  const mf = noiseField(128, 64, 2, 81);
  surface('metal', 128, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const k = .86 + (mf[i] - .5) * .16;
      H[i] = k;
      px(D, i, k, k * .99, k * .97);
    }
  }, .8);
  /* painted board / drywall — almost flat, just enough to catch light */
  const bf = noiseField(128, 24, 2, 91);
  surface('board', 128, (D, H, n) => {
    for (let i = 0; i < n * n; i++) {
      const k = .95 + (bf[i] - .5) * .05; H[i] = bf[i];
      px(D, i, k, k * .995, k * .98);
    }
  }, .7);
  /* gravel / base rock */
  (function () {
    const n = 128, c = cvs(n), ctx = c.getContext('2d');
    ctx.fillStyle = '#5d5952'; ctx.fillRect(0, 0, n, n);
    const rr = rng(101);
    for (let i = 0; i < 950; i++) {
      const r = 1.2 + rr() * 3.0, l = .5 + rr() * .5;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + (150 * l | 0) + ',' + (144 * l | 0) + ',' + (132 * l | 0) + ',.95)';
      ctx.arc(rr() * n, rr() * n, r, 0, TAU); ctx.fill();
    }
    bakePainted('gravel', c, n, 3.4);
  })();
  /* ground detail — near-white so terrain vertex colours still read */
  const gf = noiseField(512, 6, 4, 111), gd = noiseField(512, 74, 2, 112), gc = noiseField(512, 24, 3, 113);
  surface('ground', 512, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      /* fine blade-scale detail over a slow clumping term */
      const blade = (gd[i] - .5) * .26 + Math.sin(x * 1.7 + gc[i] * 8) * .035;
      const k = .80 + gf[i] * .34 + blade + (gc[i] - .5) * .12;
      H[i] = gf[i] * .34 + gd[i] * .46 + gc[i] * .20;
      px(D, i, k * .99, k * 1.02, k * .94);
    }
  }, 3.4);
  /* insulation batt — fibrous */
  const ff = noiseField(128, 32, 2, 121);
  surface('fiber', 128, (D, H, n) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const k = .84 + (ff[i] - .5) * .28 + Math.sin(y * .9) * .04;
      H[i] = ff[i]; px(D, i, k, k * .72, k * .78);
    }
  }, 1.6);
  /* cloud sprite */
  (function () {
    const n = 128, c = cvs(n), ctx = c.getContext('2d');
    const f = noiseField(n, 4, 4, 131), id = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      const dx = (x / n - .5) * 2, dy = (y / n - .5) * 2;
      const fall = 1 - sat(Math.sqrt(dx * dx + dy * dy * 2.1));
      const a = sat((f[i] * 1.5 - .55) * 2.4) * fall * fall;
      id.data[i * 4] = 255; id.data[i * 4 + 1] = 255; id.data[i * 4 + 2] = 255;
      id.data[i * 4 + 3] = a * 255;
    }
    ctx.putImageData(id, 0, 0);
    const t = new TH.CanvasTexture(c); t.anisotropy = MAXANISO;
    TEX.cloud = { map: t };
  })();
  /* soft contact shadow decal */
  (function () {
    const n = 128, c = cvs(n), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.55, 'rgba(0,0,0,.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, n, n);
    const t = new TH.CanvasTexture(c); t.anisotropy = MAXANISO;
    TEX.ao = { map: t };
  })();
  /* sun glare sprite */
  (function () {
    const n = 128, c = cvs(n), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, 'rgba(255,244,224,.9)'); g.addColorStop(.22, 'rgba(255,220,170,.34)');
    g.addColorStop(.55, 'rgba(255,196,130,.10)'); g.addColorStop(1, 'rgba(255,180,110,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, n, n);
    const t = new TH.CanvasTexture(c);
    TEX.glare = { map: t };
  })();
}
