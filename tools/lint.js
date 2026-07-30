/* Structural lint: things that are cheap to measure and expensive to spot
   by eye. Runs the real project in the mock context. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const run = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
let head = run.slice(0, run.indexOf('if (ok) {')).replace(/^const (fs|path|vm) = .*$/gm, '')
  .replace("const ROOT = require('path').join(__dirname, '..');", 'const ROOT = path.join(D, "..");')
  .replace("require('./mock-three.js')", 'require(path.join(D, "mock-three.js"))');
const sandbox = (new Function('fs', 'path', 'vm', 'require', 'D', head + '\nreturn sandbox;'))(fs, path, vm, require, __dirname);

const r = vm.runInContext(`(function () {
  var o = { bad: [], warn: [], perf: [] };

  // ── every layer referenced must be a declared layer ──
  var layers = {};
  for (var k in G) G[k].list.forEach(function (x) { layers[x.l] = (layers[x.l] || 0) + 1; });
  for (var l in layers) if (!(l in layerOn)) o.bad.push('layer "' + l + '" used by ' + layers[l] + ' instances but never declared in LAYERS');
  for (var l2 in layerOn) if (!layers[l2]) o.warn.push('layer "' + l2 + '" is declared but nothing uses it');

  // ── time windows that cannot animate or that unbuild before they build ──
  var inst = 0, zero = 0, inverted = 0, preRemoved = 0;
  for (var k2 in G) G[k2].list.forEach(function (x) {
    inst++;
    if (x.t1 <= x.t0) zero++;
    if (x.x0 !== undefined && x.x1 <= x.x0) inverted++;
    if (x.x0 !== undefined && x.x0 < x.t1) preRemoved++;
  });
  if (zero) o.warn.push(zero + ' instances have t1 <= t0 (they pop in with no transition)');
  if (inverted) o.bad.push(inverted + ' instances have an inverted removal window');
  if (preRemoved) o.bad.push(preRemoved + ' instances begin being removed before they finish building');

  // ── click-to-identify completeness ──
  var noMeta = 0, thin = 0;
  for (var k3 in G) G[k3].list.forEach(function (x) {
    if (!x.m) { noMeta++; return; }
    if (!x.m.n || !x.m.d || x.m.d.length < 25) thin++;
  });
  o.warn.push(noMeta + ' of ' + inst + ' instances have no caption; ' + thin + ' have a thin one');

  // ── phase table continuity ──
  for (var i = 1; i < PHASES.length; i++) {
    if (PHASES[i].d0 > PHASES[i - 1].d1)
      o.bad.push('GAP in the programme: ' + PHASES[i - 1].key + ' ends day ' + PHASES[i - 1].d1 +
                 ' and ' + PHASES[i].key + ' does not start until day ' + PHASES[i].d0);
    else if (PHASES[i].d0 < PHASES[i - 1].d1)
      o.warn.push('trades overlap (intended): ' + PHASES[i].key + ' starts day ' + PHASES[i].d0 +
                  ' while ' + PHASES[i - 1].key + ' runs to ' + PHASES[i - 1].d1);
    if (!PHASES[i].cam) o.bad.push('phase ' + PHASES[i].key + ' has no camera key');
    if (!PHASES[i].crew) o.bad.push('phase ' + PHASES[i].key + ' has no crew list');
  }
  if (PHASES[PHASES.length - 1].d1 !== DAYS)
    o.bad.push('last phase ends day ' + PHASES[PHASES.length - 1].d1 + ' but DAYS is ' + DAYS);

  // ── no day of the programme may be unaccounted for ──
  for (var d = 0; d < DAYS; d++) {
    var hit = false;
    for (var pi = 0; pi < PHASES.length; pi++) if (d >= PHASES[pi].d0 && d < PHASES[pi].d1) { hit = true; break; }
    if (!hit) { o.bad.push('day ' + d + ' is not covered by any phase'); break; }
  }

  // ── milestones must land inside a phase, in order ──
  var last = -1;
  MILESTONES.forEach(function (m) {
    if (m.d <= last) o.bad.push('milestone "' + m.n + '" is out of order');
    last = m.d;
    if (m.d < 0 || m.d > DAYS) o.bad.push('milestone "' + m.n + '" is off the timeline');
  });

  // ── NaN anywhere in a transform, at any point on the timeline ──
  var nan = 0;
  [0, .07, .18, .3, .42, .55, .68, .8, .93, 1].forEach(function (t) {
    T = t; clock = t * 90; xformDirty = true;
    terrainUpdate(); updateGroups(); syncTime(); updateCrew(); updateSky(.016); updateCamera(.016);
    for (var k4 in G) G[k4].list.forEach(function (x) {
      if (!isFinite(x.p[0] + x.p[1] + x.p[2] + x.s[0] + x.s[1] + x.s[2])) nan++;
    });
    if (!isFinite(camera.position.x + camera.position.y + camera.position.z)) o.bad.push('camera position is NaN at T=' + t);
    if (!isFinite(sun.intensity) || !isFinite(hemi.intensity)) o.bad.push('light intensity is NaN at T=' + t);
  });
  if (nan) o.bad.push(nan + ' instance transforms contain NaN');

  // ── groups that allocate a mesh + material for nothing ──
  var empty = [];
  for (var k5 in G) if (!G[k5].list.length) empty.push(k5);
  if (empty.length) o.perf.push('empty groups still declared: ' + empty.join(', '));

  // ── where the instance budget actually goes ──
  var sizes = [];
  for (var k6 in G) sizes.push([k6, G[k6].list.length]);
  sizes.sort(function (a, b) { return b[1] - a[1]; });
  o.perf.push('largest groups: ' + sizes.slice(0, 8).map(function (x) { return x[0] + ' ' + x[1]; }).join(', '));
  o.perf.push('total ' + inst + ' instances in ' + sizes.filter(function (x) { return x[1]; }).length + ' draw calls');

  // ── shadow casters: the cost driver ──
  var casters = 0;
  for (var k7 in G) if (G[k7].mesh && G[k7].mesh.castShadow) casters += G[k7].list.length;
  o.perf.push(casters + ' of ' + inst + ' instances cast shadows');
  return o;
})()`, sandbox);

const show = (t, a) => { console.log(''); console.log(t); a.length ? a.forEach(x => console.log('   - ' + x)) : console.log('   none'); };
show('DEFECTS', r.bad);
show('WARNINGS', r.warn);
show('PERFORMANCE', r.perf);
