import { geoOrthographic, geoPath, geoGraticule, geoDistance } from 'd3-geo';
import data from './data.json';

// Globo desenhado em <canvas> 2D (sem DOM de SVG por quadro, sem filtros), iniciado so perto da tela.
function initGlobe() {
  const cv = document.getElementById('globe');
  if (!cv || !cv.getContext || cv.__ready) return;
  cv.__ready = true;
  const ctx = cv.getContext('2d');
  const R = 170, C = 200, SZ = 400, TAU = Math.PI * 2;
  const proj = geoOrthographic().scale(R).translate([C, C]).clipAngle(90).precision(1);
  const path = geoPath(proj, ctx);
  const colors = { na: '#ff9ec7', sa: '#8fe3c0', eu: '#c9b6ff', af: '#ffb472', as: '#c6ee7a', oc: '#ffa6e8', br: '#ffd54a' };
  const order = ['na', 'sa', 'eu', 'af', 'as', 'oc', 'br'];
  const gratGeo = geoGraticule().step([30, 30])();
  const bz = data.brazil, TILT = -16;
  const cloudSpots = [[-120, 35], [-70, 55], [-15, 10], [30, 45], [75, 15], [130, 40], [-95, -25], [20, -30], [110, -20], [-40, -45]];
  const heart = new Path2D('M0 -4 C-14 -22 -26 -34 -12 -42 C-6 -45 0 -41 0 -36 C0 -41 6 -45 12 -42 C26 -34 14 -22 0 -4 Z');
  let S = 1, px = 400, base = null, top = null;

  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'); g.scale(S, S); return [c, g]; };
  function buildStatic() {
    let g;
    [base, g] = mk();
    let gr = g.createRadialGradient(C, C, 0, C, C, 196); gr.addColorStop(0.8, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(C, C, 196, 0, TAU); g.fill();
    gr = g.createRadialGradient(159, 139, 0, 159, 139, 272); gr.addColorStop(0, '#8be3ff'); gr.addColorStop(0.45, '#3fb0f2'); gr.addColorStop(1, '#1668c9');
    g.fillStyle = gr; g.beginPath(); g.arc(C, C, R, 0, TAU); g.fill();
    [top, g] = mk();
    gr = g.createRadialGradient(C, C, 0, C, C, R); gr.addColorStop(0.62, 'rgba(13,63,122,0)'); gr.addColorStop(1, 'rgba(13,63,122,.55)');
    g.fillStyle = gr; g.beginPath(); g.arc(C, C, R, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(140, 120, 52, 28, -35 * Math.PI / 180, 0, TAU); g.fill();
    g.strokeStyle = '#0d3f7a'; g.lineWidth = 6; g.beginPath(); g.arc(C, C, R, 0, TAU); g.stroke();
  }
  function size() {
    const w = cv.clientWidth || 400, dpr = Math.min(window.devicePixelRatio || 1, 2);
    px = Math.round(Math.min(640, Math.max(240, w * dpr)));
    cv.width = cv.height = px; S = px / SZ; buildStatic();
  }

  function draw(lam, now, light) {
    proj.rotate([lam, TILT, 0]);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, px, px); ctx.drawImage(base, 0, 0);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.arc(C, C, R, 0, TAU); ctx.clip();
    ctx.lineJoin = 'round';
    if (!light) { ctx.beginPath(); path(gratGeo); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.8; ctx.stroke(); }
    ctx.strokeStyle = '#0d3f7a';
    for (const k of order) { ctx.beginPath(); path(data.fills[k]); ctx.fillStyle = colors[k]; ctx.fill(); ctx.lineWidth = k === 'br' ? 2 : 1.4; ctx.stroke(); }
    if (!light) { ctx.beginPath(); path(data.borders); ctx.strokeStyle = 'rgba(13,63,122,.35)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    // pin do Brasil
    if (geoDistance(bz, [-lam, -TILT]) < 1.25) {
      const p = proj(bz), ph = ((now || 0) % 1800) / 1800;
      ctx.save(); ctx.translate(p[0], p[1]);
      ctx.globalAlpha = 1 - ph; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 8 + ph * 13, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1; ctx.scale(0.9, 0.9); ctx.fillStyle = '#ff4f8b'; ctx.strokeStyle = '#0d3f7a'; ctx.lineWidth = 2.5; ctx.fill(heart); ctx.stroke(heart);
      ctx.restore();
    }
    // nuvens (derivam mais rapido que a terra)
    const l2 = lam * 1.35 + 40; proj.rotate([l2, TILT, 0]); const c2 = [-l2, -TILT];
    ctx.fillStyle = '#fff';
    for (const s of cloudSpots) {
      const d = geoDistance(s, c2); if (d > 1.2) continue;
      const p = proj(s), k = Math.cos(d) * 0.55 + 0.55;
      ctx.save(); ctx.globalAlpha = Math.min(0.92, (1.2 - d) * 2.2); ctx.translate(p[0], p[1]); ctx.scale(k, k);
      ctx.beginPath(); ctx.ellipse(0, 3, 22, 7, 0, 0, TAU); ctx.moveTo(-1, -2); ctx.arc(-9, -2, 8, 0, TAU); ctx.moveTo(14, -5); ctx.arc(4, -5, 10, 0, TAU); ctx.moveTo(20, 0); ctx.arc(14, 0, 6, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(top, 0, 0);
  }

  const wrap = document.documentElement.classList.contains('js') ? cv.closest('.reveal') : null; // so anima depois que o reveal terminou
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const gap = coarse ? 41 : 32;
  let lam = 52, last = 0, raf = 0, visible = true, lastDraw = 0, rt = 0, lastScroll = 0;
  // durante a rolagem o globo nao redesenha (libera a thread principal); retoma logo depois
  window.addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  window.__globeDraw = (l) => { lam = l; draw(lam, 0); };
  window.__globePause = (p) => { window.__globePaused = p; };
  const loop = () => {
    const step = (t) => {
      raf = 0;
      if (!visible || document.hidden || window.__globePaused) { last = 0; return; }
      if (last) lam += Math.min(0.05, (t - last) / 1000) * 9;
      last = t;
      if (t - lastDraw >= gap && t - lastScroll > 140 && (!wrap || wrap.classList.contains('settled'))) { lastDraw = t; draw(lam, t); }
      raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '60px' }).observe(cv);
    document.addEventListener('visibilitychange', kick);
    kick();
  };
  // trabalho dividido em tarefas curtas: base estatica, primeiro quadro, depois o loop
  size();
  requestAnimationFrame(() => {
    draw(lam, 0, true);
    requestAnimationFrame(() => draw(lam, 0));
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(lam, 0); }, 200); });
    if (!reduce) setTimeout(loop, 0);
  });
}
window.__initGlobe = initGlobe;
