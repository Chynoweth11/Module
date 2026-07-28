/* ═════════════════════════════════════════════════════════════════
   AURORA RIDGE RESIDENCE — 00 · core
   Constants, math helpers, the master schedule, and runtime state.
   Project time T runs 0 → 1; every object's transform and visibility
   is a pure function of T, so the build reverses cleanly on scrub.
   ═════════════════════════════════════════════════════════════════ */
'use strict';
const TH = THREE;
const DAYS = 412;
const START = new Date(2026, 2, 2);
const d = n => n / DAYS;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sat = v => v < 0 ? 0 : v > 1 ? 1 : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => (t = sat(t), t * t * (3 - 2 * t));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const TAU = Math.PI * 2;

/* deterministic PRNG so the site looks the same on every load */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const R = rng(20260302);

/* spread n elements across [a,b] so the work cascades instead of popping */
function seq(a, b, n, overlap) {
  overlap = overlap === undefined ? .34 : overlap;
  const span = b - a, w = Math.max(span * overlap, 1e-4);
  const step = n > 1 ? (span - w) / (n - 1) : 0;
  return i => { const t0 = a + step * i; return [t0, t0 + w]; };
}

/* systems — used for cutaway grouping and component labels */
const LAYERS = [
  { id: 'site', name: 'Site' }, { id: 'excavation', name: 'Excavation' },
  { id: 'concrete', name: 'Foundation' }, { id: 'framing', name: 'Structure' },
  { id: 'roofing', name: 'Roofing' }, { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' }, { id: 'hvac', name: 'HVAC' },
  { id: 'enclosure', name: 'Enclosure' }, { id: 'insulation', name: 'Insulation & drywall' },
  { id: 'interior', name: 'Interior' }, { id: 'exterior', name: 'Sitework' },
  { id: 'landscape', name: 'Landscape' }
];
const layerOn = {};
LAYERS.forEach(l => layerOn[l.id] = true);

/* ── schedule ─────────────────────────────────────────────────────
   Realistic sequence with realistic overlap:
   design → permit → survey → clearing → excavation → underground →
   footings/foundation → backfill/slab → framing → roof structure →
   roofing/dry-in → windows (dried in) → MEP rough-in → insulation &
   drywall → interior finishes, with exterior masonry overlapping the
   tail of interior work (as it does on a real job), then hardscape,
   landscape and closeout.
   cam = the shot the camera settles into while this phase runs.     */
const PHASES = [
  { key: 'contract', name: 'Contract & design', d0: 0, d1: 18, c: '#8892A0',
    note: 'Drawings, engineering and estimate complete.',
    crew: [['Design', 6]], cam: { pol: .93, dist: 205, tg: [8, 8, 4] } },
  { key: 'permit', name: 'Permitting', d0: 18, d1: 46, c: '#7E8A99',
    note: 'Plan review, fees paid, building permit issued.',
    crew: [['Office', 2]], cam: { pol: .88, dist: 188, tg: [8, 9, 4] } },
  { key: 'survey', name: 'Survey & layout', d0: 46, d1: 55, c: '#B8A06A',
    note: 'Corners set, building lines strung from the benchmark.',
    crew: [['Survey', 3]], cam: { pol: .80, dist: 150, tg: [8, 2, 2] } },
  { key: 'clearing', name: 'Clearing & grading', d0: 55, d1: 72, c: '#7E9455',
    note: 'Erosion control, brush cleared, pad cut to subgrade.',
    crew: [['Operators', 3], ['Laborers', 4]], cam: { pol: .82, dist: 158, tg: [6, 0, 2] } },
  { key: 'excavate', name: 'Excavation', d0: 72, d1: 88, c: '#96754C',
    note: 'Footing trenches and utility runs cut to bearing soil.',
    crew: [['Operators', 3], ['Laborers', 4]], cam: { pol: .90, dist: 126, tg: [6, -2, 2] } },
  { key: 'underground', name: 'Underground utilities', d0: 88, d1: 102, c: '#4FA3A8',
    note: 'Drain, waste, water and electrical set, inspected and tested.',
    crew: [['Plumbers', 4], ['Electricians', 2], ['Laborers', 3]], cam: { pol: 1.02, dist: 102, tg: [4, -3, 2] } },
  { key: 'foundation', name: 'Footings & foundation', d0: 102, d1: 126, c: '#8D949B',
    note: 'Forms, rebar, footing inspection, concrete placed; walls stripped.',
    crew: [['Carpenters', 6], ['Rodbusters', 4], ['Finishers', 4]], cam: { pol: .95, dist: 112, tg: [6, -1, 2] } },
  { key: 'slab', name: 'Backfill & slab', d0: 126, d1: 142, c: '#9AA1A8',
    note: 'Compacted base, vapour barrier, radiant tubing, slab.',
    crew: [['Finishers', 6], ['Laborers', 5]], cam: { pol: .92, dist: 114, tg: [6, 1, 2] } },
  { key: 'framing', name: 'Framing', d0: 142, d1: 176, c: '#C9A063',
    note: 'Walls stood one at a time; beams and floor system set.',
    crew: [['Framers', 10]], cam: { pol: 1.00, dist: 114, tg: [4, 8, 2] } },
  { key: 'roofstruct', name: 'Roof structure', d0: 176, d1: 196, c: '#A8896A',
    note: 'Trusses flown in, braced and sheathed. Framing signed off.',
    crew: [['Framers', 9], ['Operator', 1]], cam: { pol: .84, dist: 126, tg: [4, 13, 2] } },
  { key: 'roofing', name: 'Roofing & weather barrier', d0: 196, d1: 214, c: '#5B6570',
    note: 'Underlayment, slate, standing seam, housewrap, flashing.',
    crew: [['Roofers', 8], ['Sheet metal', 3]], cam: { pol: .76, dist: 124, tg: [4, 15, 2] } },
  { key: 'openings', name: 'Windows & doors', d0: 214, d1: 228, c: '#6E8898',
    note: 'Glazing set, flashed and sealed. The house is dried in.',
    crew: [['Glaziers', 5], ['Carpenters', 4]], cam: { pol: 1.00, dist: 100, tg: [2, 9, 0] } },
  { key: 'roughin', name: 'Mechanical rough‑in', d0: 228, d1: 258, c: '#9B7BC4',
    note: 'Plumbing, wiring and ductwork run through the framing.',
    crew: [['Plumbers', 5], ['Electricians', 6], ['HVAC', 5]], cam: { pol: 1.02, dist: 88, tg: [2, 9, 2] } },
  { key: 'drywall', name: 'Insulation & drywall', d0: 258, d1: 286, c: '#D98CA6',
    note: 'Rough‑in approved, cavities insulated, board hung, taped, finished.',
    crew: [['Insulators', 5], ['Hangers', 8], ['Tapers', 6]], cam: { pol: 1.02, dist: 86, tg: [2, 9, 2] } },
  { key: 'interior', name: 'Interior finishes', d0: 286, d1: 340, c: '#CFC3A8',
    note: 'Oak floors, cabinetry, stone tops, tile, fixtures, lighting.',
    crew: [['Carpenters', 6], ['Tile', 5], ['Painters', 6], ['Trades', 6]], cam: { pol: 1.06, dist: 80, tg: [0, 8, 4] } },
  { key: 'exteriorfin', name: 'Stone & stucco', d0: 322, d1: 356, c: '#B0714E',
    note: 'Stone veneer, stucco, cedar soffits, bronze fascia — running alongside interior trim.',
    crew: [['Masons', 6], ['Plasterers', 5], ['Carpenters', 4]], cam: { pol: 1.00, dist: 106, tg: [4, 8, 2] } },
  { key: 'sitework', name: 'Hardscape & landscape', d0: 352, d1: 396, c: '#5F8F4E',
    note: 'Final grade, driveway, terraces, pool, planting, site lighting.',
    crew: [['Hardscape', 6], ['Landscape', 8], ['Irrigation', 3]], cam: { pol: .86, dist: 145, tg: [8, 3, 8] } },
  { key: 'closeout', name: 'Final inspections & handover', d0: 396, d1: 412, c: '#C8A265',
    note: 'Commissioned, punched, cleaned. Certificate of occupancy.',
    crew: [['Punch', 5], ['Cleaners', 4]], cam: { pol: .96, dist: 130, tg: [6, 7, 4] } }
];
PHASES.forEach((p, i) => { p.i = i; p.t0 = d(p.d0); p.t1 = d(p.d1); });
const PH = {}; PHASES.forEach(p => PH[p.key] = p);
const pp = k => sat((T - PH[k].t0) / (PH[k].t1 - PH[k].t0));
const pw = (a, b) => sat((T * DAYS - a) / (b - a));

const MILESTONES = [
  { d: 46, n: 'Permit issued' }, { d: 102, n: 'Underground approved' },
  { d: 126, n: 'Foundation complete' }, { d: 196, n: 'Topped out' },
  { d: 228, n: 'Dried in' }, { d: 258, n: 'Rough‑in approved' },
  { d: 412, n: 'Certificate of occupancy' }
];

/* ── weather (drives sky tint, particles, ground snow) ── */
const WX = [
  { a: 0, b: 55, t: 'clear', tmp: 48 }, { a: 55, b: 66, t: 'overcast', tmp: 52 },
  { a: 66, b: 74, t: 'rain', tmp: 49 }, { a: 74, b: 118, t: 'clear', tmp: 68 },
  { a: 118, b: 128, t: 'overcast', tmp: 74 }, { a: 128, b: 176, t: 'clear', tmp: 81 },
  { a: 176, b: 190, t: 'rain', tmp: 66 }, { a: 190, b: 244, t: 'clear', tmp: 58 },
  { a: 244, b: 262, t: 'overcast', tmp: 41 }, { a: 262, b: 300, t: 'snow', tmp: 28 },
  { a: 300, b: 322, t: 'overcast', tmp: 36 }, { a: 322, b: 360, t: 'clear', tmp: 52 },
  { a: 360, b: 380, t: 'rain', tmp: 57 }, { a: 380, b: 413, t: 'clear', tmp: 71 }
];
function weatherAt(day) {
  for (let i = 0; i < WX.length; i++) if (day >= WX[i].a && day < WX[i].b) return WX[i];
  return WX[WX.length - 1];
}
const snowCover = day => sat(smooth((day - 250) / 22) - smooth((day - 302) / 26));

/* ── runtime state ── */
let T = 0, playing = false, speed = 1, lastT = -1, xformDirty = true;
let reveal = 0, cutMode = 'auto';
const flags = { sun: true, wx: true, people: true };
const PLAY_SECONDS = 112;
let clock = 0;

function currentPhase() {
  for (let i = PHASES.length - 1; i >= 0; i--) if (T >= PHASES[i].t0 - 1e-9) return PHASES[i];
  return PHASES[0];
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dateAt(t) {
  const dt = new Date(START.getTime());
  dt.setDate(dt.getDate() + Math.round(t * DAYS));
  return dt;
}
