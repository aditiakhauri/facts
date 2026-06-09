import { HEADER_EMOJIS } from './data.js';

export function spawnParticles() {
  const pool = ['✨','💫','🌟','💅','🔥','💖','🌸','🦋','⭐','🌈','💜','🩷','🪄','🌙','🫧'];
  const wrap = document.getElementById('particles');
  for (let i = 0; i < 25; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = pool[i % pool.length];
    el.style.left              = Math.random() * 100 + 'vw';
    el.style.animationDuration = (20 + Math.random() * 30) + 's';
    el.style.animationDelay    = (Math.random() * 30) + 's';
    el.style.fontSize          = (0.9 + Math.random() * 1.4) + 'rem';
    wrap.appendChild(el);
  }
}

export function buildHeaderEmojis() {
  const wrap = document.getElementById('header-emojis');
  const pos  = [[5,20],[12,70],[20,45],[80,15],[88,65],[95,40],[35,85],[65,90],[50,5],[25,10],[75,8]];
  pos.forEach(([l, t], i) => {
    const el = document.createElement('span');
    el.className = 'h-emoji';
    el.textContent = HEADER_EMOJIS[i % HEADER_EMOJIS.length];
    el.style.left              = l + '%';
    el.style.top               = t + '%';
    el.style.animationDuration = (3 + Math.random() * 3) + 's';
    el.style.animationDelay    = (Math.random() * 3) + 's';
    el.style.fontSize          = (1.2 + Math.random() * 1) + 'rem';
    el.style.opacity           = '0.5';
    wrap.appendChild(el);
  });
}
