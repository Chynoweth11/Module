const fs=require('fs'),path=require('path'),vm=require('vm');
const run=fs.readFileSync(path.join(__dirname,'run.js'),'utf8');
let head=run.slice(0,run.indexOf('if (ok) {')).replace(/^const (fs|path|vm) = .*$/gm,'');
// capture every addEventListener so handlers can be fired
head = head.replace("addEventListener(){}, removeEventListener(){}, appendChild(c){this.children.push(c); return c},",
  "addEventListener(t,f){(this._h||(this._h={}))[t]=f}, removeEventListener(){}, appendChild(c){this.children.push(c); return c},")
  .replace("const ROOT = require('path').join(__dirname, '..');", 'const ROOT = path.join(D, "..");')
  .replace("require('./mock-three.js')", 'require(path.join(D, "mock-three.js"))');
const sandbox=(new Function('fs','path','vm','require','D',head+'\nreturn sandbox;'))(fs,path,vm,require,__dirname);
const doc = sandbox.document;
function fire(elId, type, target) {
  const el = doc.getElementById(elId);
  if (!el._h || !el._h[type]) return 'NO HANDLER on #' + elId + ' ' + type;
  el._h[type]({ target: target || el, clientX: 400, clientY: 400, pointerId: 1, code: '', preventDefault(){} });
  return 'ok';
}
// a fake speed button, as the real markup declares it
const btn = { dataset: { s: '4' }, classList: { toggle(){}, add(){}, remove(){}, contains(){return false} },
              closest(sel){ return sel === 'button' ? this : null } };
const spd = doc.getElementById('ctSpd');
spd.children.push(btn); spd.contains = () => true;
console.log('click 4x speed  ->', fire('ctSpd','click', btn));
console.log('speed is now    ->', vm.runInContext('speed', sandbox));
const cbtn = { dataset: { c: 'on' }, classList: { toggle(){}, add(){}, remove(){}, contains(){return false} },
               closest(sel){ return sel === 'button' ? this : null } };
const cut = doc.getElementById('ctCut');
cut.children.push(cbtn); cut.contains = () => true;
console.log('click cutaway On->', fire('ctCut','click', cbtn));
console.log('cutMode is now  ->', vm.runInContext('cutMode', sandbox), '| reveal', vm.runInContext('reveal', sandbox).toFixed(2));
console.log('click play      ->', fire('ctPlay','click'));
console.log('playing is now  ->', vm.runInContext('playing', sandbox));
