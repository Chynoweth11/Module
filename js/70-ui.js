/* ═════════════════════════════════════════════════════════════════
   70 · interface — transport, scrubber, settings, click-to-identify,
   milestone banner.
   ═════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const UI = {
  play: $('ctPlay'), icon: $('ctIcon'), track: $('ctTrack'), rail: $('ctRail'),
  fill: $('ctFill'), knob: $('ctKnob'), hint: $('ctHint'), gear: $('ctGear'),
  set: $('ctSet'), num: $('ctNum'), phase: $('ctPhase'), date: $('ctDate'),
  pct: $('ctPct'), tag: $('ctTag'), tagN: $('ctTagN'), tagD: $('ctTagD'),
  tagX: $('ctTagX'), boot: $('ctBoot'), bootMsg: $('ctBootMsg'), bootBar: $('ctBootBar'),
  mile: $('ctMile'), mileTxt: $('ctMileTxt'), spd: $('ctSpd'), cut: $('ctCut')
};

/* phase tint bands + milestone ticks on the rail */
const mkEls = [];
(function buildRail() {
  PHASES.forEach(p => {
    const b = document.createElement('i');
    b.className = 'seg';
    b.style.left = (p.t0 * 100) + '%';
    b.style.width = ((p.t1 - p.t0) * 100) + '%';
    b.style.background = p.c;
    UI.rail.appendChild(b);
  });
  MILESTONES.forEach(m => {
    const t = document.createElement('i');
    t.className = 'mk';
    t.style.left = (m.d / DAYS * 100) + '%';
    t.title = m.n;
    UI.rail.appendChild(t);
    mkEls.push(t);
  });
})();

/* transport */
function setPlaying(v) {
  playing = v;
  UI.icon.textContent = v ? '❚❚' : '▶';
  UI.play.setAttribute('aria-label', v ? 'Pause' : 'Play');
}
UI.play.addEventListener('click', () => {
  if (!playing && T >= .9999) { T = 0; lastMile = -1; }
  setPlaying(!playing);
});

/* scrubber */
let scrubbing = false;
function trackT(e) {
  const r = UI.track.getBoundingClientRect();
  return clamp((e.clientX - r.left) / r.width, 0, 1);
}
UI.track.addEventListener('pointerdown', e => {
  scrubbing = true; UI.track.setPointerCapture(e.pointerId);
  T = trackT(e); lastMile = milestoneBefore(T); syncTime();
});
UI.track.addEventListener('pointermove', e => {
  if (scrubbing) { T = trackT(e); lastMile = milestoneBefore(T); syncTime(); return; }
  const t = trackT(e);
  const d = Math.round(t * DAYS);
  const ph = PHASES.find(p => t >= p.t0 && t < p.t1) || PHASES[PHASES.length - 1];
  UI.hint.textContent = 'Day ' + d + ' · ' + ph.name;
  UI.hint.style.left = (t * 100) + '%';
  UI.hint.classList.add('on');
});
UI.track.addEventListener('pointerup', e => { scrubbing = false; });
UI.track.addEventListener('pointerleave', () => { UI.hint.classList.remove('on'); });

/* settings */
UI.gear.addEventListener('click', () => UI.set.classList.toggle('open'));
document.addEventListener('pointerdown', e => {
  if (UI.set.classList.contains('open') && !UI.set.contains(e.target) && e.target !== UI.gear && !UI.gear.contains(e.target))
    UI.set.classList.remove('open');
});
UI.spd.addEventListener('click', e => {
  const b = e.target.closest('b'); if (!b) return;
  [...UI.spd.children].forEach(c => c.classList.toggle('on', c === b));
  speed = parseFloat(b.dataset.v);
});
UI.cut.addEventListener('click', e => {
  const b = e.target.closest('b'); if (!b) return;
  [...UI.cut.children].forEach(c => c.classList.toggle('on', c === b));
  cutMode = b.dataset.v;
});
document.querySelectorAll('#ctSet .sw').forEach(sw => {
  sw.addEventListener('click', () => {
    sw.classList.toggle('on');
    flags[sw.dataset.f] = sw.classList.contains('on');
    if (sw.dataset.f === 'wx') xformDirty = true;
    syncTime();
  });
});

/* keyboard — scoped to hover so embedding pages keep their keys */
let hover = false;
const stage = document.getElementById('ct');
stage.addEventListener('pointerenter', () => hover = true);
stage.addEventListener('pointerleave', () => hover = false);
window.addEventListener('keydown', e => {
  if (!hover) return;
  if (e.code === 'Space') { e.preventDefault(); if (!playing && T >= .9999) { T = 0; lastMile = -1; } setPlaying(!playing); }
  else if (e.code === 'ArrowRight') { T = clamp(T + (e.shiftKey ? 14 : 2) / DAYS, 0, 1); lastMile = milestoneBefore(T); syncTime(); }
  else if (e.code === 'ArrowLeft') { T = clamp(T - (e.shiftKey ? 14 : 2) / DAYS, 0, 1); lastMile = milestoneBefore(T); syncTime(); }
});

/* click to identify */
const ray = new TH.Raycaster(); const ptr = new TH.Vector2();
let downXY = null;
canvas.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downXY) return;
  const moved2 = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved2 > 6) return;
  const r = canvas.getBoundingClientRect();
  ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  /* instanced construction pieces */
  const hits = ray.intersectObjects(pickables, false);
  for (const h of hits) {
    const g = G[h.object.userData.group];
    const o = g && g.list[h.instanceId];
    if (o && o._st !== 0 && o.m) { showTag(o.m.n, o.m.d); return; }
  }
  /* equipment + material stacks */
  const uniq = [];
  EQUIP.forEach(eq => { if (eq.obj.visible) uniq.push(eq.obj); });
  UO.forEach(u => { if (u.obj.visible && u.obj.userData.meta) uniq.push(u.obj); });
  const h2 = ray.intersectObjects(uniq, true);
  if (h2.length) {
    let n = h2[0].object;
    while (n && !n.userData.meta && !EQUIP.find(eq => eq.obj === n)) n = n.parent;
    if (n) {
      const eq = EQUIP.find(q => q.obj === n);
      if (eq) { showTag(eq.name, 'Scheduled to the phase that needs it — mobilized in, demobilized out.'); return; }
      if (n.userData.meta) { showTag(n.userData.meta.n, n.userData.meta.d); return; }
    }
  }
  UI.tag.classList.remove('on');
});
function showTag(n, d) {
  UI.tagN.textContent = n; UI.tagD.textContent = d;
  UI.tag.classList.add('on');
}
UI.tagX.addEventListener('click', () => UI.tag.classList.remove('on'));

/* milestone banner */
let lastMile = -1, mileTimer = 0;
function milestoneBefore(t) {
  const day = t * DAYS; let idx = -1;
  for (let i = 0; i < MILESTONES.length; i++) if (MILESTONES[i].d <= day) idx = i;
  return idx;
}
function showMile(name) {
  UI.mileTxt.textContent = name;
  UI.mile.classList.add('on');
  clearTimeout(mileTimer);
  mileTimer = setTimeout(() => UI.mile.classList.remove('on'), 2800);
}
function checkMilestones() {
  if (!playing) return;
  const idx = milestoneBefore(T);
  if (idx > lastMile) { showMile(MILESTONES[idx].n); lastMile = idx; }
  else if (idx < lastMile) lastMile = idx;
}
