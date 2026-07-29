/* Executes every project script in load order against DOM + THREE mocks
   so logic errors surface without a GPU. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = require('path').join(__dirname, '..');
const THREE = require('./mock-three.js');

function el(id) {
  const e = {
    id, style: {}, children: [], classList: { _s: new Set(), add(c){this._s.add(c)}, remove(c){this._s.delete(c)},
      toggle(c,v){v?this._s.add(c):this._s.delete(c)}, contains(c){return this._s.has(c)} },
    dataset: {}, clientWidth: 1600, clientHeight: 900, textContent: '', title: '',
    addEventListener(){}, removeEventListener(){}, appendChild(c){this.children.push(c); return c},
    setAttribute(){}, getAttribute(){return null}, contains(){return false},
    getBoundingClientRect(){return {left:0,top:0,width:1600,height:900}},
    setPointerCapture(){}, releasePointerCapture(){}, closest(){return null},
    getContext(k){ return k === '2d' ? ctx2d() : null }, focus(){}, blur(){}
  };
  return e;
}
function ctx2d() {
  const noop = () => {};
  const c = {
    canvas: { width: 256, height: 256 },
    fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1, globalCompositeOperation: '',
    font: '', textAlign: '', textBaseline: '', shadowBlur: 0, shadowColor: '', lineCap: '', lineJoin: '', filter: '',
    fillRect: noop, clearRect: noop, strokeRect: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, arc: noop, ellipse: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    fill: noop, stroke: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, drawImage: noop, fillText: noop, rect: noop, clip: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
    putImageData: noop,
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h })
  };
  return c;
}
const registry = {};
const doc = {
  getElementById: id => (registry[id] || (registry[id] = el(id))),
  createElement: t => { const e = el('_' + t); if (t === 'canvas') { e.width = 256; e.height = 256; } return e; },
  querySelectorAll: () => [], querySelector: () => null,
  addEventListener(){}, body: el('body'), documentElement: el('html')
};
const sandbox = {
  THREE, document: doc, console,
  window: null, navigator: { userAgent: 'node' }, devicePixelRatio: 1,
  innerWidth: 1600, innerHeight: 900,
  matchMedia: () => ({ matches: false, addEventListener(){}, addListener(){} }),
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  setTimeout: (f) => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  ResizeObserver: class { observe(){} disconnect(){} },
  performance: { now: () => 0 },
  Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int32Array, Math, Date, JSON,
  Map, Set, Promise, Error, Object, Array, String, Number, Boolean, RegExp, isNaN, parseFloat, parseInt
};
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const files = ['00-core','10-textures','20-scene','30-plan','35-safety','40-build','50-actors','60-camera','70-ui','80-main'];
let ok = true;
for (const f of files) {
  const p = path.join(ROOT, 'js', f + '.js');
  const src = fs.readFileSync(p, 'utf8');
  try {
    vm.runInContext(src, sandbox, { filename: f + '.js' });
    console.log('  ✓ ' + f);
  } catch (e) {
    ok = false;
    console.log('  ✗ ' + f + '  →  ' + e.message);
    const st = (e.stack || '').split('\n').slice(1, 4).join('\n');
    console.log(st);
    break;
  }
}
if (ok) {
  // `const` declarations live in the context's lexical scope, not on the
  // sandbox object — so the sweep has to run inside the context too.
  const sweep = `
    (function () {
      var report = { steps: 0 };
      for (var i = 0; i <= 240; i++) {
        T = i / 240;
        clock = i * 0.37;
        xformDirty = true;
        terrainUpdate(); updateGroups();
        reveal = computeReveal(); applyReveal();
        syncTime();
        updateUO(); updateCrew(); updateEquip(); updateDust(0.016);
        updateSky(0.016); updateCamera(0.016);
        report.steps++;
      }
      // scrub backwards too — the build has to reverse cleanly
      for (var j = 240; j >= 0; j--) {
        T = j / 240; clock += 0.21; xformDirty = true;
        terrainUpdate(); updateGroups(); syncTime(); updateCrew(); updateSky(0.016);
        report.steps++;
      }
      // cutaway modes and every layer toggle
      ['on','off','auto'].forEach(function (m) {
        cutMode = m; reveal = computeReveal(); applyReveal();
      });
      for (var k in layerOn) { layerOn[k] = false; updateGroups(); layerOn[k] = true; }
      flags.people = false; updateCrew(); updateEquip(); flags.people = true;
      flags.wx = false; updateSky(0.016); flags.wx = true;
      flags.sun = false; updateSky(0.016); flags.sun = true;
      report.total = TOTAL;
      report.groups = Object.keys(G).length;
      report.uo = UO.length;
      report.equip = EQUIP.length;
      report.crewMeshes = Object.keys(CREWM).length;
      report.trimats = TRIMATS.length;
      report.phases = PHASES.length;
      return report;
    })()
  `;
  try {
    const r = vm.runInContext(sweep, sandbox, { filename: 'sweep.js' });
    console.log('  ✓ swept ' + r.steps + ' timeline steps (forward, reverse, all modes, all layers)');
    console.log('  · ' + r.total + ' instances across ' + r.groups + ' material groups');
    console.log('  · ' + r.uo + ' unique objects, ' + r.equip + ' machines, ' +
                r.crewMeshes + ' crew draw calls, ' + r.trimats + ' triplanar materials');
  } catch (e) {
    ok = false;
    console.log('  ✗ runtime  →  ' + e.message);
    console.log((e.stack || '').split('\n').slice(1, 6).join('\n'));
  }
}
process.exit(ok ? 0 : 1);
