/* Sequencing / geometry audit: runs inside the same context and checks the
   build against real construction dependencies. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const run = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
let head = run.slice(0, run.indexOf('if (ok) {'));
head = head.replace(/^const (fs|path|vm) = .*$/gm, '')
           .replace("const ROOT = require('path').join(__dirname, '..');",
                    'const ROOT = path.join(__dirname, "..");')
           .replace("require('./mock-three.js')", 'require(path.join(__dirname, "mock-three.js"))');
const sandbox = (new Function('fs','path','vm','require','__dirname', head + '\nreturn sandbox;'))(fs, path, vm, require, __dirname);

const audit = `
(function () {
  var out = { seq: [], dup: [], floaters: [], stats: {} };
  // key on group + layer: several groups are reused for unrelated work
  // (the same timber is a stud, a ladder rung and a scaffold plank)
  var minT = {};
  for (var k in G) {
    var L = G[k].list;
    for (var i = 0; i < L.length; i++) {
      var kk = k + '@' + L[i].l;
      if (L[i].t0 >= 0 && (minT[kk] === undefined || L[i].t0 < minT[kk])) minT[kk] = L[i].t0;
    }
  }
  var D = function (day) { return day / DAYS; };
  // group must not begin before the named prerequisite finishes
  var RULES = [
    ['conc@concrete',    'excavate.t0',    'footings before the dig is even started'],
    ['rebar@concrete',   'excavate.t1',    'reinforcement before excavation is complete'],
    ['lumber@framing',  'slab.t0',        'framing lumber before the slab is under way'],
    ['osb@framing',     'framing.t0',     'sheathing before framing starts'],
    ['slate@roofing',   'roofstruct.t0',  'roofing before the roof is framed'],
    ['seam@roofing',    'roofstruct.t0',  'metal roofing before the roof is framed'],
    ['memb@roofing',    'roofstruct.t0',  'underlayment before the deck exists'],
    ['wrap@enclosure',    'roofstruct.t0',  'housewrap before the walls are sheathed'],
    ['glass@enclosure',   'roofing.t0',     'glazing before the building is dried in'],
    ['insul@insulation',   'roughin.t1',     'insulation before rough-in inspection'],
    ['gwb@insulation',     'roughin.t1',     'drywall before rough-in inspection'],
    ['stone@enclosure',   'openings.t0',    'stone veneer before the openings are in'],
    ['stucco@enclosure',  'roofing.t1',     'stucco before the wall is weathered in'],
    ['oak@interior',     'drywall.t0',     'finish flooring before drywall'],
    ['marble@interior',  'drywall.t0',     'stone tops before drywall'],
    ['appl@interior',    'interior.t0',    'appliances before interior finishes'],
    ['fixture@interior', 'drywall.t1',     'plumbing fixtures before drywall is finished'],
    ['paver@exterior',   'exteriorfin.t0', 'hardscape before the exterior finish starts'],
    ['mulch@landscape',   'exteriorfin.t0', 'planting before the exterior is finished'],
    ['water@exterior',   'sitework.t0',    'pool filled before sitework'],
    ['duct@hvac',    'roofing.t1',     'ductwork before dry-in'],
    ['flex@hvac',    'roofing.t1',     'flexible duct before dry-in'],
    ['copper@plumbing',  'foundation.t0',  'supply piping before the foundation'],
    ['tape@concrete',    'clearing.t0',    'barricade tape before the site is opened']
  ];
  RULES.forEach(function (r) {
    if (minT[r[0]] === undefined) return;
    var parts = r[1].split('.'), lim = PH[parts[0]][parts[1]];
    if (minT[r[0]] < lim - 1e-6)
      out.seq.push(r[0] + ' starts day ' + Math.round(minT[r[0]] * DAYS) +
                   ' but must wait until day ' + Math.round(lim * DAYS) + ' — ' + r[2]);
  });
  // duplicate instances: same group, same position and size
  for (var k2 in G) {
    var L2 = G[k2].list, seen = {}, d = 0;
    for (var j = 0; j < L2.length; j++) {
      var o = L2[j];
      var key = o.p.map(function (v) { return v.toFixed(2); }).join(',') + '|' +
                o.s.map(function (v) { return v.toFixed(2); }).join(',');
      if (seen[key]) { d++; if (d < 4) out.dup.push(k2 + ' @' + o.l + ' duplicated at ' + key.split('|')[0]); }
      else seen[key] = 1;
    }
  }
  // permanent site objects are placed against the FINAL grade, so that is
  // what they have to be measured against
  T = 1; terrainUpdate();
  ['mulch@landscape', 'boulder', 'trunk', 'cone', 'gravel'].forEach(function (k3) {
    if (!G[k3]) return;
    var L3 = G[k3].list, bad = 0;
    for (var j = 0; j < L3.length; j++) {
      var o = L3[j];
      if (o.x0 !== undefined && o.x0 <= 1) continue;   // temporary, removed before handover
      var gy = finalY(o.p[0], o.p[2]);
      var bottom = o.p[1] - o.s[1] / 2;
      if (bottom > gy + 2.5) bad++;
    }
    if (bad) out.floaters.push(k3 + ': ' + bad + ' floating above grade');
  });
  // envelope coverage: clad area per exterior wall vs solid wall area
  out.envelope = [];
  WALLS.filter(function (w) { return w.ext; }).forEach(function (w, wi) {
    var solid = 0;
    wallRects(w).forEach(function (r) { solid += (r.s1 - r.s0) * (r.y1 - r.y0); });
    var clad = 0, glazed = 0;
    ['stone', 'stucco'].forEach(function (k) {
      G[k].list.forEach(function (o) {
        var d = Math.abs(o.p[0] - w.x1) + Math.abs(o.p[2] - w.z1);
        // cheap membership test: is the instance on this wall's line?
        var t = ((o.p[0] - w.x1) * w.ux + (o.p[2] - w.z1) * w.uz);
        var perp = Math.abs((o.p[0] - w.x1) * w.nx + (o.p[2] - w.z1) * w.nz);
        if (t < -1 || t > w.L + 1 || perp < .2 || perp > 1.3) return;
        if (o.p[1] < w.y0 - .5 || o.p[1] > w.y0 + w.h + .5) return;
        var horiz = Math.abs(w.ux) > .5 ? o.s[0] : o.s[2];
        clad += horiz * o.s[1];
      });
    });
    w.ops.forEach(function (op) { glazed += (op[1] - op[0]) * (op[3] - op[2]); });
    var ratio = solid > 0 ? clad / solid : 1;
    if (ratio < .94 || ratio > 1.14)
      out.envelope.push('wall ' + wi + ' (' + w.x1 + ',' + w.z1 + '→' + w.x2 + ',' + w.z2 +
        ') clad ' + Math.round(ratio * 100) + '% of its solid area');
  });
  // roof coverage: every floor plate needs something over it
  out.roofgaps = [];
  PLATES.forEach(function (pl, pi) {
    var step = 4, missed = 0, tot = 0;
    for (var x = pl[0] + 2; x < pl[2]; x += step) for (var z = pl[1] + 2; z < pl[3]; z += step) {
      tot++;
      var covered = false;
      for (var i = 0; i < ROOFS.length; i++) {
        var rf = ROOFS[i];
        if (x >= rf.x0 - rf.ov && x <= rf.x1 + rf.ov &&
            z >= rf.zc - rf.half - rf.ov && z <= rf.zc + rf.half + rf.ov) { covered = true; break; }
      }
      if (!covered && !(x >= TOWER.x0 && x <= TOWER.x1 && z >= TOWER.z0 && z <= TOWER.z1)) covered = false;
      else if (!covered) covered = true;
      if (!covered) missed++;
    }
    if (missed) out.roofgaps.push('floor plate ' + pi + ': ' + missed + '/' + tot + ' sample points with no roof above');
  });
  out.stats.instances = TOTAL;
  out.stats.phases = PHASES.length;
  return out;
})()
`;
const r = vm.runInContext(audit, sandbox, { filename: 'audit.js' });
const line = (t, a) => {
  console.log('');
  console.log(t);
  if (!a.length) console.log('   none');
  else a.forEach(x => console.log('   - ' + x));
};
line('SEQUENCE VIOLATIONS', r.seq);
line('DUPLICATE PLACEMENTS', r.dup);
line('FLOATING SITE OBJECTS', r.floaters);
line('ENVELOPE CLADDING COVERAGE', r.envelope);
line('ROOF COVERAGE GAPS', r.roofgaps);
