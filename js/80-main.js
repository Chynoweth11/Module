/* ═════════════════════════════════════════════════════════════════
   80 · main — sky & light cycle, time sync, resize, adaptive
   quality, the frame loop and boot.
   ═════════════════════════════════════════════════════════════════ */

/* ── sun/sky cycle: several day/night cycles across the lapse ── */
/* 8.25 cycles puts the playhead at high noon exactly when the house is
   handed over — the reveal used to land on whatever the modulo gave it,
   which is why the finished building was being shown at night */
const SUN_CYCLES = 8.25;
const SUN_ANCHOR = new TH.Vector3(8, 0, 4);
const C_DAYTOP = new TH.Color(0x2c6ba6), C_DAYHZ = new TH.Color(0xc8dae6), C_DAYBOT = new TH.Color(0x6f7d88);
const C_SETTOP = new TH.Color(0x35415f), C_SETHZ = new TH.Color(0xe8935a), C_SETBOT = new TH.Color(0x5a4a44);
const C_NGTTOP = new TH.Color(0x060a14), C_NGTHZ = new TH.Color(0x101a2a), C_NGTBOT = new TH.Color(0x080c12);
const C_GREY = new TH.Color(0x8b96a2);
const _c1 = new TH.Color(), _c2 = new TH.Color(), _fogC = new TH.Color();
const lampA = new TH.PointLight(0xffc07a, 0, 60, 2); lampA.position.set(-6, 8, 4); scene.add(lampA);
const lampB = new TH.PointLight(0xffc07a, 0, 55, 2); lampB.position.set(14, 8, 26); scene.add(lampB);
let nite = 0;

function updateSky(dt) {
  const day = T * DAYS;
  const wx = flags.wx ? weatherAt(day) : WX[0];
  const cloudy = wx.t === 'clear' ? 0 : wx.t === 'overcast' ? .72 : 1;

  /* sun elevation: continuous cycles when the sun toggle is on,
     otherwise pinned to a pleasant mid-morning */
  const ph = flags.sun ? ((T * SUN_CYCLES) % 1) : .3;
  const ang = ph * TAU;
  const el = Math.sin(ang) * .92 + .14;          /* elevation, ~-0.78..1.06 */
  const az = ang * .5 + .8;
  const light = sat(el * 2.2 + .18);              /* 0 night → 1 day */
  nite = 1 - light;
  const dusk = sat(1 - Math.abs(el - .06) * 7) * light; /* golden band */

  const sd = new TH.Vector3(Math.cos(az) * .85, Math.max(el, -.25), Math.sin(az) * .6).normalize();
  skyU.sunDir.value.copy(sd);
  skyU.sunI.value = light * (1 - cloudy * .85);

  /* sky colours: day → sunset → night, greyed by cloud */
  _c1.copy(C_NGTTOP).lerp(C_DAYTOP, light).lerp(C_SETTOP, dusk * .7);
  skyU.top.value.copy(_c1).lerp(_c2.copy(C_GREY).multiplyScalar(.55 + light * .35), cloudy * .8);
  _c1.copy(C_NGTHZ).lerp(C_DAYHZ, light).lerp(C_SETHZ, dusk);
  skyU.hz.value.copy(_c1).lerp(_c2.copy(C_GREY).multiplyScalar(.5 + light * .4), cloudy * .82);
  _c1.copy(C_NGTBOT).lerp(C_DAYBOT, light).lerp(C_SETBOT, dusk * .8);
  skyU.bot.value.copy(_c1).lerp(_c2.copy(C_GREY).multiplyScalar(.4 + light * .3), cloudy * .8);

  /* lights — shadow frustum follows the shot and tightens on zoom */
  const half = clamp(CAM.dist * .62, 38, 125);
  setShadowExtent(half);
  sun.target.position.set(CAM.tg.x, 3, CAM.tg.z);
  sun.position.copy(sun.target.position).addScaledVector(sd, 300);
  sun.intensity = (2.75 - cloudy * 1.95) * light;
  sun.color.setHSL(.095 - dusk * .04, .38 + dusk * .40, .84 - dusk * .18);
  /* every ambient term collapses at night so the ground cannot stay lit
     under a dark sky the way it used to */
  hemi.intensity = .045 + light * (.42 - cloudy * .12) + cloudy * light * .16;
  amb.intensity = .025 + light * .085;
  fill.intensity = .035 + light * .17;
  moon.intensity = nite * .30 * (1 - cloudy * .7);
  lampA.intensity = lampB.intensity = nite * 2.6 * houseLit();
  renderer.toneMappingExposure = .72 + light * .40 - cloudy * .07;

  /* stars & glare */
  stars.material.opacity = nite * (1 - cloudy) * .9;
  stars.rotation.y = clock * .004;
  glare.position.copy(camera.position).addScaledVector(sd, 900);
  glare.material.opacity = light * (1 - cloudy) * .5;
  const gs = 170 + dusk * 160;
  glare.scale.set(gs, gs, 1);

  /* fog closes in with cloud and at night */
  _fogC.copy(skyU.hz.value).lerp(skyU.bot.value, .4);
  scene.fog.color.copy(_fogC);
  scene.fog.near = 340 - cloudy * 150;
  scene.fog.far = 1800 - cloudy * 820 - nite * 300;
  renderer.setClearColor(_fogC);

  /* clouds drift; denser cover when weather says so */
  for (let i = 0; i < clouds.length; i++) {
    const m = clouds[i];
    m.position.x += dt * (2 + i % 3);
    if (m.position.x > 620) m.position.x = -620;
    m.material.opacity = (.16 + cloudy * .5) * (.5 + light * .5);
  }

  /* interior glow — lamps & sconces burn brighter at night */
  if (G.glow && G.glow.mat) G.glow.mat.emissiveIntensity = .45 + nite * 3.6 * (.3 + houseLit() * .7);
  if (G.glass && G.glass.mat) {
    const lit = houseLit();
    if (lit > .001) G.glass.mat.emissive.setHex(0xffd9a0);
    G.glass.mat.emissiveIntensity = nite * .55 * lit;
  }

  /* precipitation */
  const want = flags.wx && (wx.t === 'rain' || wx.t === 'snow') ? (wx.t === 'rain' ? .5 : .8) : 0;
  wxMat.opacity = lerp(wxMat.opacity, want, 1 - Math.pow(.05, dt));
  wxPts.visible = wxMat.opacity > .02;
  if (wxPts.visible) {
    const snow = wx.t === 'snow';
    wxMat.size = snow ? .8 : .5;
    wxMat.color.setHex(snow ? 0xf2f6fa : 0xb9cede);
    const Pp = wxGeo.attributes.position.array;
    const fall = snow ? 14 : 92;
    for (let i = 0; i < wxCount; i++) {
      Pp[i * 3 + 1] -= dt * fall * (.6 + wxSeed[i] * .8);
      if (snow) Pp[i * 3] += Math.sin(clock * 1.4 + wxSeed[i] * 9) * dt * 5;
      if (Pp[i * 3 + 1] < 0) {
        Pp[i * 3] = camera.position.x + (Math.random() - .5) * 300;
        Pp[i * 3 + 1] = 100 + Math.random() * 40;
        Pp[i * 3 + 2] = camera.position.z + (Math.random() - .5) * 260;
      }
    }
    wxGeo.attributes.position.needsUpdate = true;
  }
}
/* how "lived in" the house is: lights come alive through interior finish */
function houseLit() { return sat(pp('interior') * .5 + pp('closeout')); }

/* ── time → world sync ── */
function syncTime() {
  terrainUpdate();
  updateGroups();
  reveal = lerp(reveal, computeReveal(), 1);
  applyReveal();
  aoDecal.material.opacity = sat(pw(126, 150)) * .5;

  const ph = currentPhase();
  const day = Math.round(T * DAYS);
  UI.num.textContent = String(day).padStart(3, '0');
  UI.phase.textContent = ph.name;
  const dt2 = dateAt(T);
  UI.date.textContent = MON[dt2.getMonth()] + ' ' + dt2.getDate() + ', ' + dt2.getFullYear();
  UI.pct.textContent = Math.round(T * 100) + '%';
  UI.fill.style.width = (T * 100) + '%';
  UI.knob.style.left = (T * 100) + '%';
  mkEls.forEach((el, i) => el.classList.toggle('hit', MILESTONES[i].d <= T * DAYS + .5));
  xformDirty = false;
  lastT = T;
}

/* ── resize ── */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  baseFov = h > w ? 52 : 42;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

/* ── adaptive quality: shed load before shedding frame rate ── */
let qStep = 0, qWarm = 0, fpsAcc = 0, fpsN = 0;
function adaptQuality(dt) {
  qWarm += dt; if (qWarm < 4) return;
  fpsAcc += dt; fpsN++;
  if (fpsAcc < 1.6) return;
  const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
  if (fps < 26 && qStep < 3) {
    qStep++;
    if (qStep === 1) { DPR_CAP = Math.max(1, DPR_CAP - .45); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP)); }
    else if (qStep === 2) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    else { sun.castShadow = false; renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }
  }
}

/* ── frame loop ── */
let started = false;
function frame(now) {
  requestAnimationFrame(frame);
  const t = now * .001;
  const dt = Math.min(.05, t - (frame._t || t));
  frame._t = t;
  if (!started) return;
  clock += dt;

  if (playing) {
    T += dt * speed / PLAY_SECONDS;
    if (T >= 1) { T = 1; setPlaying(false); }
  }
  const rv = computeReveal();
  if (Math.abs(rv - reveal) > .003) { reveal = lerp(reveal, rv, 1 - Math.pow(.02, dt)); applyReveal(); }
  if (T !== lastT || xformDirty) { syncTime(); checkMilestones(); }

  updateUO(); updateCrew(); updateEquip(); updateDust(dt);
  updateSky(dt);
  updateCamera(dt);
  adaptQuality(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

/* ── boot ── */
(function boot() {
  const msgs = ['Compiling drawings', 'Pricing the work', 'Mobilizing the site', 'Rolling cameras'];
  let mi = 0;
  UI.bootMsg.textContent = msgs[0];
  const iv = setInterval(() => { mi = (mi + 1) % msgs.length; UI.bootMsg.textContent = msgs[mi]; }, 420);

  setPlaying(false);
  T = 0; syncTime();

  /* verify the triplanar shader compiles; fall back to flat colour if not */
  let shaderBad = false;
  const errOrig = console.error;
  console.error = function () { shaderBad = true; errOrig.apply(console, arguments); };
  try { renderer.render(scene, camera); } catch (e) { shaderBad = true; }
  /* a couple of warm-up frames so the first real frame is smooth */
  try { renderer.render(scene, camera); } catch (e) { shaderBad = true; }
  console.error = errOrig;
  if (shaderBad) {
    TRIMATS.forEach(m => { m.onBeforeCompile = function () {}; m.map = null; m.normalMap = null; m.customProgramCacheKey = function () { return 'flat'; }; m.needsUpdate = true; });
    try { renderer.render(scene, camera); } catch (e) {}
  }

  UI.bootBar.style.width = '100%';
  setTimeout(() => {
    clearInterval(iv);
    UI.boot.classList.add('gone');
    started = true;
    setPlaying(true);
  }, 520);
})();
