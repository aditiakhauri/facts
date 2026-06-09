import { state }        from './state.js';
import { ACHIEVEMENTS } from './data.js';

export function gainXP(amount) {
  state.xp += amount;
  const pct = Math.min((state.xp / 300) * 100, 100);
  document.getElementById('xp-fill').style.width = pct + '%';
  document.getElementById('xp-val').textContent  = state.xp + ' xp';
}

export function checkAchievement(streak) {
  const ach = ACHIEVEMENTS.find(a => a.trigger === streak);
  if (!ach) return;
  const el = document.getElementById('achievement');
  document.getElementById('ach-body').textContent = ach.msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const style  = getComputedStyle(document.documentElement);
  const a      = style.getPropertyValue('--accent').trim()  || '#db2777';
  const a2     = style.getPropertyValue('--accent2').trim() || '#f472b6';
  const a3     = style.getPropertyValue('--accent3').trim() || '#fbcfe8';
  const colors = [a, a2, a3, '#22c55e', '#f59e0b', '#fff'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.5 - canvas.height * 0.5,
    w: 4 + Math.random() * 8, h: 3 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 4, vx: (Math.random() - 0.5) * 4,
    rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 8, opacity: 1,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.rot += p.rotV;
      if (frame > 80) p.opacity -= 0.02;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
      ctx.fill();
      ctx.restore();
    });
    frame++;
    if (frame < 140) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}
