/* ═════════════════════════════════════════════════════════════════
   60 · cinematic camera
   The shot is directed by the schedule: azimuth sweeps continuously
   while height, distance and focus are keyed per phase. Dragging
   nudges the shot and the nudge eases out again after a few seconds
   so the time-lapse always recovers on its own. A subtle FOV
   "breath" and hand-drift keep the frame from feeling locked-off.
   ═════════════════════════════════════════════════════════════════ */
const CAM = {
  az: -1.6, pol: .82, dist: 300, tg: new TH.Vector3(8, 8, 4),
  azG: -1.6, polG: .82, distG: 300, tgG: new TH.Vector3(8, 8, 4),
  azOff: 0, polOff: 0, distMul: 1, idle: 99, intro: 1
};
const REDUCED = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ptrs = new Map();
let dragMode = 0, pinch0 = 0, moved = 0;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragMode = ptrs.size === 2 ? 2 : 1;
  if (dragMode === 2) pinch0 = pinchDist();
  moved = 0; CAM.idle = 0; canvas.classList.add('drag');
});
function pinchDist() { const a = [...ptrs.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  moved += Math.abs(dx) + Math.abs(dy); CAM.idle = 0;
  if (dragMode === 2 && ptrs.size === 2) {
    const nd = pinchDist();
    if (pinch0 > 0) CAM.distMul = clamp(CAM.distMul * (pinch0 / Math.max(nd, 1)), .22, 2.3);
    pinch0 = nd; return;
  }
  CAM.azOff -= dx * .0048;
  CAM.polOff = clamp(CAM.polOff - dy * .0040, -.55, .55);
});
function endPtr(e) {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch0 = 0;
  if (ptrs.size === 0) { dragMode = 0; canvas.classList.remove('drag'); }
}
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('pointerleave', endPtr);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  CAM.distMul = clamp(CAM.distMul * Math.exp(e.deltaY * .0011), .22, 2.3);
  CAM.idle = 0;
}, { passive: false });

let baseFov = 42;
function updateCamera(dt) {
  const p = currentPhase();
  const nx = PHASES[Math.min(PHASES.length - 1, p.i + 1)];
  const k = smooth(sat((T - p.t0) / (p.t1 - p.t0)));
  const pol = lerp(p.cam.pol, nx.cam.pol, k);
  const dist = lerp(p.cam.dist, nx.cam.dist, k);
  const tx = lerp(p.cam.tg[0], nx.cam.tg[0], k);
  const ty = lerp(p.cam.tg[1], nx.cam.tg[1], k);
  const tz = lerp(p.cam.tg[2], nx.cam.tg[2], k);

  CAM.idle += dt;
  if (CAM.idle > 3.2) {
    const e = 1 - Math.pow(.28, dt);
    CAM.azOff = lerp(CAM.azOff, 0, e); CAM.polOff = lerp(CAM.polOff, 0, e);
    CAM.distMul = lerp(CAM.distMul, 1, e);
  }
  CAM.intro = Math.max(0, CAM.intro - dt * .28);
  const introEase = CAM.intro * CAM.intro;
  const drift = REDUCED ? 0 : 1;
  CAM.azG = -.95 + T * TAU * 1.35 + clock * .010 * drift + CAM.azOff - introEase * .9;
  CAM.polG = clamp(pol + CAM.polOff + Math.sin(clock * .17) * .008 * drift - introEase * .12, .12, 1.46);
  CAM.distG = clamp(dist * CAM.distMul + introEase * 150, 24, 460);
  CAM.tgG.set(
    tx + Math.sin(clock * .11) * .5 * drift,
    ty + Math.sin(clock * .23) * .3 * drift,
    tz + Math.cos(clock * .13) * .5 * drift
  );

  const s = 1 - Math.pow(.0022, dt);
  CAM.az = lerp(CAM.az, CAM.azG, s);
  CAM.pol = lerp(CAM.pol, CAM.polG, s);
  CAM.dist = lerp(CAM.dist, CAM.distG, s);
  CAM.tg.lerp(CAM.tgG, s);

  const sp = Math.sin(CAM.pol), cp = Math.cos(CAM.pol);
  let x = CAM.tg.x + CAM.dist * sp * Math.sin(CAM.az);
  let y = CAM.tg.y + CAM.dist * cp;
  let z = CAM.tg.z + CAM.dist * sp * Math.cos(CAM.az);
  const floor = groundY(x, z) + 2.5;
  if (y < floor) y = floor;
  camera.position.set(x, y, z);
  camera.lookAt(CAM.tg);
  /* long-lens feel up close, wider when pulled back */
  const wantFov = baseFov + (CAM.dist < 90 ? -3 : 0) + (REDUCED ? 0 : Math.sin(clock * .09) * .5);
  if (Math.abs(camera.fov - wantFov) > .05) {
    camera.fov = lerp(camera.fov, wantFov, 1 - Math.pow(.05, dt));
    camera.updateProjectionMatrix();
  }
}
