import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from 'd3-geo';
import data from './data.json';

const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('globe');
if (svg) {
  const R = 170, C = 200;
  const proj = geoOrthographic().scale(R).translate([C, C]).clipAngle(90).precision(0.6);
  const path = geoPath(proj);
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };

  // defs
  const defs = el('defs', {});
  const g1 = el('radialGradient', { id: 'gOcean', cx: '38%', cy: '32%', r: '80%' }, defs);
  [['0', '#8be3ff'], ['.45', '#3fb0f2'], ['1', '#1668c9']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g1));
  const g2 = el('radialGradient', { id: 'gRim', cx: '50%', cy: '50%', r: '50%' }, defs);
  [['.62', 'rgba(13,63,122,0)'], ['1', 'rgba(13,63,122,.55)']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g2));
  const g3 = el('radialGradient', { id: 'gGlow', cx: '50%', cy: '50%', r: '50%' }, defs);
  [['.8', 'rgba(255,255,255,.55)'], ['1', 'rgba(255,255,255,0)']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g3));
  const clip = el('clipPath', { id: 'gClip' }, defs); el('circle', { cx: C, cy: C, r: R }, clip);

  el('circle', { cx: C, cy: C, r: R + 26, fill: 'url(#gGlow)' });
  el('circle', { cx: C, cy: C, r: R, fill: 'url(#gOcean)' });
  const sphere = el('g', { 'clip-path': 'url(#gClip)' });
  const grat = el('path', { fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-width': '.8' }, sphere);
  const colors = { na: '#ff9ec7', sa: '#8fe3c0', eu: '#c9b6ff', af: '#ffb472', as: '#c6ee7a', oc: '#ffa6e8', br: '#ffd54a' };
  const order = ['na', 'sa', 'eu', 'af', 'as', 'oc', 'br'];
  const land = {};
  order.forEach(k => { land[k] = el('path', { fill: colors[k], stroke: '#0d3f7a', 'stroke-width': k === 'br' ? '2' : '1.4', 'stroke-linejoin': 'round' }, sphere); });
  const borders = el('path', { fill: 'none', stroke: 'rgba(13,63,122,.35)', 'stroke-width': '.6' }, sphere);
  // clouds
  const cloudSpots = [[-120, 35], [-70, 55], [-15, 10], [30, 45], [75, 15], [130, 40], [-95, -25], [20, -30], [110, -20], [-40, -45]];
  const clouds = cloudSpots.map(() => {
    const g = el('g', { opacity: '.9' }, sphere);
    el('ellipse', { cx: 0, cy: 3, rx: 22, ry: 7, fill: '#fff' }, g);
    el('circle', { cx: -9, cy: -2, r: 8, fill: '#fff' }, g);
    el('circle', { cx: 4, cy: -5, r: 10, fill: '#fff' }, g);
    el('circle', { cx: 14, cy: 0, r: 6, fill: '#fff' }, g);
    return g;
  });
  // brazil pin
  const pin = el('g', {}, sphere);
  const pulse = el('circle', { r: 8, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, pin);
  pulse.setAttribute('class', 'globe-pulse');
  el('path', { d: 'M0 -4 C-14 -22 -26 -34 -12 -42 C-6 -45 0 -41 0 -36 C0 -41 6 -45 12 -42 C26 -34 14 -22 0 -4 Z', fill: '#ff4f8b', stroke: '#0d3f7a', 'stroke-width': 2.5, 'stroke-linejoin': 'round', transform: 'scale(.9)' }, pin);

  // limb shading + shine + outline
  el('circle', { cx: C, cy: C, r: R, fill: 'url(#gRim)' });
  el('ellipse', { cx: 140, cy: 120, rx: 52, ry: 28, fill: 'rgba(255,255,255,.35)', transform: 'rotate(-35 140 120)' });
  el('circle', { cx: C, cy: C, r: R, fill: 'none', stroke: '#0d3f7a', 'stroke-width': 6 });

  const geo = {};
  for (const k in data.fills) geo[k] = data.fills[k];
  const gratGeo = geoGraticule10();
  const bz = data.brazil;
  const TILT = -16;

  function draw(lam) {
    proj.rotate([lam, TILT, 0]);
    grat.setAttribute('d', path(gratGeo) || '');
    for (const k in geo) land[k].setAttribute('d', path(geo[k]) || '');
    borders.setAttribute('d', path(data.borders) || '');
    // brazil pin
    const center = [-lam, -TILT];
    const vis = geoDistance(bz, center) < 1.25;
    if (vis) { const p = proj(bz); pin.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`); pin.setAttribute('opacity', '1'); }
    else pin.setAttribute('opacity', '0');
    // clouds drift faster than land
    const l2 = lam * 1.35 + 40;
    proj.rotate([l2, TILT, 0]);
    const c2 = [-l2, -TILT];
    cloudSpots.forEach((s, i) => {
      const d = geoDistance(s, c2);
      if (d > 1.2) { clouds[i].setAttribute('opacity', '0'); return; }
      const p = proj(s); const k = Math.cos(d) * 0.55 + 0.55;
      clouds[i].setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) scale(${k.toFixed(2)})`);
      clouds[i].setAttribute('opacity', Math.min(0.92, (1.2 - d) * 2.2).toFixed(2));
    });
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lam = 52, last = 0, raf = 0, visible = true;
  draw(lam);
  window.__globeDraw = (l) => { lam = l; draw(lam); };
  window.__globePause = (p) => { window.__globePaused = p; };
  if (!reduce) {
    const step = (t) => {
      raf = 0;
      if (!visible || document.hidden || window.__globePaused) { last = 0; return; }
      if (last) { const dt = Math.min(0.05, (t - last) / 1000); lam += dt * 9; }
      if (!last || t - last > 28) { if (last) draw(lam); last = t; }
      raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(svg);
    } else kick();
    document.addEventListener('visibilitychange', kick);
    kick();
  }
}
