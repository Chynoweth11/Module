const fs=require('fs'),path=require('path'),vm=require('vm');
const run=fs.readFileSync(path.join(__dirname,'run.js'),'utf8');
let head=run.slice(0,run.indexOf('if (ok) {')).replace(/^const (fs|path|vm) = .*$/gm,'')
  .replace("const ROOT = require('path').join(__dirname, '..');", 'const ROOT = path.join(D, "..");')
  .replace("require('./mock-three.js')", 'require(path.join(D, "mock-three.js"))');
const sandbox=(new Function('fs','path','vm','require','D',head+'\nreturn sandbox;'))(fs,path,vm,require,__dirname);
console.log(vm.runInContext(`(function(){
  var out=[];
  // does the broadleaf canopy actually meet its trunk?
  var L=G.leafy.list, TR=G.trunk.list, worst=0, n=0;
  L.forEach(function(c){
    var t=null;
    for(var i=0;i<TR.length;i++){
      if(Math.abs(TR[i].p[0]-c.p[0])<.01 && Math.abs(TR[i].p[2]-c.p[2])<.01){ t=TR[i]; break; }
    }
    if(!t) return;
    n++;
    var trunkTop = t.p[1] + t.s[1]/2;
    // broadleaf geometry reaches .39 below its own centre
    var canopyBottom = c.p[1] - c.s[1]*0.39;
    var gap = canopyBottom - trunkTop;
    if (gap > worst) worst = gap;
  });
  out.push('broadleaf trees paired: '+n+'  worst trunk-to-canopy gap: '+worst.toFixed(2));
  // same for conifers
  var C=G.conifer.list, cworst=-99, cn=0;
  C.forEach(function(c){
    var t=null;
    for(var i=0;i<TR.length;i++){ if(Math.abs(TR[i].p[0]-c.p[0])<.01&&Math.abs(TR[i].p[2]-c.p[2])<.01){t=TR[i];break;} }
    if(!t) return; cn++;
    var gap = (c.p[1] - c.s[1]*0.38) - (t.p[1] + t.s[1]/2);
    if (gap > cworst) cworst = gap;
  });
  out.push('conifers paired: '+cn+'  worst gap: '+cworst.toFixed(2));
  // how deep does the dig actually read at mid-excavation?
  T = 79/DAYS; terrainUpdate();
  var d1 = groundY(8, 0);
  T = 60/DAYS; terrainUpdate();
  var d0 = groundY(8, 0);
  out.push('grade at pad centre: day60 '+d0.toFixed(2)+'  day79 '+d1.toFixed(2)+'  (dig depth '+(d0-d1).toFixed(2)+')');
  // objects baked against pre-grade terrain then left behind by grading
  T = 1; terrainUpdate();
  var drift=0, dn=0;
  ['trunk','mulch','boulder','paver'].forEach(function(k){
    G[k].list.forEach(function(o){
      var gy=groundY(o.p[0],o.p[2]);
      var bottom=o.p[1]-o.s[1]/2;
      var dd=Math.abs(bottom-gy);
      if(dd>2){ dn++; if(dd>drift) drift=dd; }
    });
  });
  out.push('site objects off final grade by >2 units: '+dn+'  worst '+drift.toFixed(2));
  // how much of the timeline is night?
  var night=0, samples=400;
  for(var i=0;i<samples;i++){
    T=i/samples; clock=i; updateSky(.016);
    if (nite > .6) night++;
  }
  out.push('frames at deep night: '+Math.round(night/samples*100)+'% of the timeline');
  return out.join('\\n');
})()`, sandbox));
