import { SPARK_POOLS } from './data.js';

const HOVER_TARGETS = 'button, a, .fact-card, .sw-dot, .quiz-opt, .icon-btn, .cat-btn, .news-card';

function getSparkPool() {
  return SPARK_POOLS[document.documentElement.getAttribute('data-theme')] || SPARK_POOLS.pink;
}

function spawnSpark(x, y, burst) {
  const el   = document.createElement('span');
  el.className = 'cur-spark';
  const pool   = getSparkPool();
  el.textContent = pool[Math.floor(Math.random() * pool.length)];

  const spread  = burst ? 55 : 14;
  const riseMin = burst ? 30 : 18;
  const riseRng = burst ? 55 : 30;
  const dur     = (burst ? 0.55 : 0.65) + Math.random() * 0.3;
  const size    = burst ? 0.85 + Math.random() * 0.55 : 0.5 + Math.random() * 0.45;

  el.style.left     = (x + (Math.random() - 0.5) * (burst ? 20 : 10)) + 'px';
  el.style.top      = (y + (Math.random() - 0.5) * (burst ? 20 : 10)) + 'px';
  el.style.fontSize = size + 'rem';
  el.style.setProperty('--dx', ((Math.random() - 0.5) * spread * 2) + 'px');
  el.style.setProperty('--dy', (-(riseMin + Math.random() * riseRng)) + 'px');
  el.style.setProperty('--dr', ((Math.random() - 0.5) * 280) + 'deg');
  el.style.setProperty('--sd', dur + 's');

  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 50);
}

export function setupCursor() {
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  const glow = document.getElementById('cur-glow');

  let mx = 0, my = 0;
  let rx = 0, ry = 0;
  let gx = 0, gy = 0;
  let lastSpark = 0;
  let moving = false, moveTimer;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    const now = Date.now();
    if (now - lastSpark > 55) {
      lastSpark = now;
      spawnSpark(mx, my, false);
    }

    moving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => { moving = false; }, 120);
  });

  (function animLoop() {
    const ease = moving ? 0.16 : 0.08;
    rx += (mx - rx) * ease;
    ry += (my - ry) * ease;
    gx += (mx - gx) * 0.05;
    gy += (my - gy) * 0.05;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(animLoop);
  })();

  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_TARGETS)) document.body.classList.add('cur-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_TARGETS)) document.body.classList.remove('cur-hover');
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.add('cur-click');
    for (let i = 0; i < 10; i++) setTimeout(() => spawnSpark(mx, my, true), i * 28);
  });
  document.addEventListener('mouseup', () => {
    setTimeout(() => document.body.classList.remove('cur-click'), 280);
  });
}
