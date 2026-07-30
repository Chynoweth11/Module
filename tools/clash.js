/* Clash detection: broad-phase AABB overlap between categories that must
   never intersect in reality — vegetation through walls, site kit through
   the building, glass buried behind cladding, anything through the roof.
   Legitimate overlaps (studs into plates, cladding onto sheathing) are not
   tested; only cross-category pairs that would be a real defect. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const run = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
let head = run.slice(0, run.indexOf('if (ok) {')).replace(/^const (fs|path|vm) = .*$/gm, '')
  .replace("const ROOT = require('path').join(__dirname, '..');", 'const ROOT = path.join(D, "..");')
  .replace("require('./mock-three.js')", 'require(path.join(D, "mock-three.js"))');
const sandbox = (new Function('fs', 'path', 'vm', 'require', 'D', head + '\nreturn sandbox;'))(fs, path, vm, require, __dirname);

const r = vm.runInContext(`(function () {
  var out = { clash: [], float: [], roof: [], crew: [] };

  var BUILDING = ['stucco','stone','glass','conc','lumber','gwb','osb','slate','seam','marble','bronze','cedar','steel'];
  var PLANTS   = ['conifer','leafy','shrub','trunk','boulder'];
  var SITEKIT  = ['cone','safety','fence','fpost','tape'];
  var HARD     = ['paver','water'];

  function box(o) {
    // rotation about Y only: swell the footprint so a rotated slab is still bounded
    var sx = o.s[0], sz = o.s[2];
    if (o.r && (o.r[1] || o.r[0] || o.r[2])) { var m = Math.max(sx, sz); sx = m; sz = m; }
    return [o.p[0]-sx/2, o.p[1]-o.s[1]/2, o.p[2]-sz/2, o.p[0]+sx/2, o.p[1]+o.s[1]/2, o.p[2]+sz/2];
  }
  function hit(a, b, tol) {
    tol = tol || 0;
    return a[0] < b[3]-tol && a[3] > b[0]+tol && a[1] < b[4]-tol && a[4] > b[1]+tol && a[2] < b[5]-tol && a[5] > b[2]+tol;
  }
  function gather(keys) {
    var r2 = [];
    keys.forEach(function (k) {
      if (!G[k]) return;
      G[k].list.forEach(function (o) {
        // when this instance is on screen: from t0 until its removal, if any
        r2.push({ k: k, o: o, b: box(o), v0: o.t0, v1: o.x0 !== undefined ? o.x1 : 1.01 });
      });
    });
    return r2;
  }
  // two things cannot clash if they are never on site at the same time
  function coexist(a, b) { return a.v0 < b.v1 && b.v0 < a.v1; }
  // grid hash on the building set so this is not O(n^2)
  function index(items, cell) {
    var g = {};
    items.forEach(function (it) {
      for (var x = Math.floor(it.b[0]/cell); x <= Math.floor(it.b[3]/cell); x++)
        for (var z = Math.floor(it.b[2]/cell); z <= Math.floor(it.b[5]/cell); z++) {
          var key = x + ',' + z;
          (g[key] || (g[key] = [])).push(it);
        }
    });
    return g;
  }
  function query(g, cell, b) {
    var seen = [], ids = {};
    for (var x = Math.floor(b[0]/cell); x <= Math.floor(b[3]/cell); x++)
      for (var z = Math.floor(b[2]/cell); z <= Math.floor(b[5]/cell); z++) {
        var arr = g[x + ',' + z]; if (!arr) continue;
        for (var i = 0; i < arr.length; i++) if (!ids[arr[i]._id]) { ids[arr[i]._id] = 1; seen.push(arr[i]); }
      }
    return seen;
  }
  var CELL = 10;
  var bld = gather(BUILDING); bld.forEach(function (it, i) { it._id = 'b' + i; });
  var bidx = index(bld, CELL);
  var hard = gather(HARD); hard.forEach(function (it, i) { it._id = 'h' + i; });
  var hidx = index(hard, CELL);

  function report(label, items, idx, tol) {
    var counts = {};
    items.forEach(function (it) {
      var near = query(idx, CELL, it.b);
      for (var i = 0; i < near.length; i++) {
        if (!coexist(it, near[i])) continue;
        if (hit(it.b, near[i].b, tol)) {
          var key = it.k + ' through ' + near[i].k;
          counts[key] = (counts[key] || 0) + 1;
          break;
        }
      }
    });
    for (var k in counts) out.clash.push(label + ': ' + k + ' x' + counts[k]);
  }
  report('vegetation', gather(PLANTS), bidx, .6);
  report('vegetation', gather(PLANTS), hidx, .6);
  report('site kit', gather(SITEKIT), bidx, .4);

  // glass buried behind cladding
  var glass = gather(['glass']);
  var clad = index(gather(['stucco','stone']), CELL);
  var buried = 0;
  glass.forEach(function (g2) {
    if (g2.o.l !== 'enclosure') return;
    var near = query(clad, CELL, g2.b);
    for (var i = 0; i < near.length; i++) if (coexist(g2, near[i]) && hit(g2.b, near[i].b, .12)) { buried++; break; }
  });
  if (buried) out.clash.push('glazing buried behind cladding x' + buried);

  // anything on the site poking through a roof plane
  function roofY(x, z) {
    var best = null;
    for (var i = 0; i < ROOFS.length; i++) {
      var rf = ROOFS[i];
      var ovA = rf.ovx0 !== undefined ? rf.ovx0 : rf.ov, ovB = rf.ovx1 !== undefined ? rf.ovx1 : rf.ov;
      if (x < rf.x0 - ovA || x > rf.x1 + ovB) continue;
      var dz = Math.abs(z - rf.zc);
      if (dz > rf.half + rf.ov) continue;
      var y = rf.plate + .4 + rf.rise - dz * (rf.rise / rf.half);
      if (best === null || y < best) best = y;
    }
    return best;
  }
  ['conifer','leafy','shrub','trunk','boulder','cone','safety','fence','fpost','mulch','paver'].forEach(function (k) {
    if (!G[k]) return;
    var n = 0;
    var roofFrom = PH.roofstruct.t0;
    G[k].list.forEach(function (o) {
      if (o.x0 !== undefined && o.x1 <= roofFrom) return;   // gone before the roof exists
      var ry = roofY(o.p[0], o.p[2]);
      if (ry === null) return;
      if (o.p[1] + o.s[1] / 2 > ry - .5) n++;
    });
    if (n) out.roof.push(k + ' intersecting a roof plane x' + n);
  });

  // permanent site geometry must sit on the finished grade
  T = 1; terrainUpdate();
  ['trunk','boulder','mulch','paver','cone','fence','fpost'].forEach(function (k) {
    if (!G[k]) return;
    var hi = 0, lo = 0;
    G[k].list.forEach(function (o) {
      if (o.x0 !== undefined && o.x0 <= 1) return;
      var gy = finalY(o.p[0], o.p[2]), bot = o.p[1] - o.s[1] / 2;
      if (bot > gy + 1.5) hi++;
      if (bot < gy - 4) lo++;
    });
    if (hi) out.float.push(k + ': ' + hi + ' floating above grade');
    if (lo) out.float.push(k + ': ' + lo + ' buried well below grade');
  });

  // workers must not be standing inside a wall, at any point in the build
  var worst = 0, cases = 0;
  for (var st = 0; st <= 40; st++) {
    T = st / 40; clock = st * 7.3; terrainUpdate(); updateCrew();
    var ph = currentPhase(), stn = STATION[ph.key];
    if (!stn) continue;
    // read the matrices updateCrew() actually wrote
    for (var i2 = 0; i2 < Math.min(crewActive, MAXCREW); i2++) {
      var wp = CREWPOS[i2];
      if (!wp) continue;
      for (var w2 = 0; w2 < WALLS.length; w2++) {
        var W = WALLS[w2];
        if (wp[1] < W.y0 - 1.5 || wp[1] > W.y0 + W.h) continue;
        var d = segDist(wp[0], wp[2], W.x1, W.z1, W.x2, W.z2);
        if (d < W.t / 2 + .4) { cases++; if (W.t / 2 + .4 - d > worst) worst = W.t / 2 + .4 - d; break; }
      }
    }
  }
  if (cases) out.crew.push(cases + ' worker-station samples fall inside a wall (worst ' + worst.toFixed(2) + ' units)');
  return out;
})()`, sandbox);

const show = (t, a) => { console.log(''); console.log(t); a.length ? a.forEach(x => console.log('   - ' + x)) : console.log('   none'); };
show('CLASHES', r.clash);
show('THROUGH A ROOF PLANE', r.roof);
show('OFF THE FINISHED GRADE', r.float);
show('CREW INSIDE GEOMETRY', r.crew);
