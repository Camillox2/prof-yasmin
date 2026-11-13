// Reduz a complexidade da geometria (Douglas-Peucker em graus) para o globo e o mapa ficarem leves.
import fs from 'fs';
const d = JSON.parse(fs.readFileSync('data.json'));
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]]; const t2 = tol * tol;
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]; let dd;
      if (L === 0) dd = (px - ax) ** 2 + (py - ay) ** 2;
      else { let t = ((px - ax) * dx + (py - ay) * dy) / L; t = Math.max(0, Math.min(1, t)); dd = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2; }
      if (dd > md) { md = dd; mi = i; }
    }
    if (md > t2) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = (r) => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(a / 2); };
const cnt = (c) => Array.isArray(c[0]) ? c.reduce((s, x) => s + cnt(x), 0) : 1;
const TOL = +process.env.TOL || 0.45, MINA = +process.env.MINA || 1.5;
const before = Object.values(d.fills).reduce((s, f) => s + cnt(f.coordinates), 0) + cnt(d.borders.coordinates);
const ring = (r) => { const s = dp(r, TOL); return area(s) < MINA || s.length < 4 ? null : s; };
for (const k in d.fills) {
  const f = d.fills[k];
  f.coordinates = f.coordinates.map(poly => { const o = ring(poly[0]); return o ? [o, ...poly.slice(1).map(ring).filter(Boolean)] : null; }).filter(Boolean);
}
d.borders.coordinates = d.borders.coordinates.map(l => dp(l, TOL)).filter(l => l.length > 2);
const after = Object.values(d.fills).reduce((s, f) => s + cnt(f.coordinates), 0) + cnt(d.borders.coordinates);
fs.writeFileSync('data.json', JSON.stringify(d));
console.log('pontos', before, '->', after, fs.statSync('data.json').size, 'bytes');
