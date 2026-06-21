import { escHtml, timeAgo } from './utils.js';
import { scrollObs }        from './scroll-anim.js';
import { playVoice }        from './voice.js';

const ASTRO_VIBES = [
  '🚀 out of this world', '🌌 galaxy brain moment', '⭐ starry bestie energy',
  '🛸 no cap this is wild', '🌙 moon era', '☄️ comet slay',
  '🔭 telescope arc', '🪐 ringed and iconic', '🌠 shooting star moment',
  '👾 alien approved', '🌍 pale blue dot vibes', '💫 cosmic slay',
];

let fetched = false;

export async function fetchAstroNews() {
  if (fetched) return;
  fetched = true;

  const grid = document.getElementById('astro-grid');

  try {
    const res  = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=20&ordering=-published_at');
    const data = await res.json();
    const articles = (data.results || []).filter(a => a.title && a.url);

    if (!articles.length) {
      grid.innerHTML = '<div class="loading-msg">space is quiet rn bestie 😩 try refreshing</div>';
      return;
    }

    grid.innerHTML = '';
    articles.forEach((a, i) => {
      const vibe  = ASTRO_VIBES[Math.floor(Math.random() * ASTRO_VIBES.length)];
      const ago   = timeAgo(Math.floor(new Date(a.published_at).getTime() / 1000));
      const delay = Math.min(i * 0.07, 0.6);

      const card = document.createElement('a');
      card.className  = 'news-card sa astro-card';
      card.dataset.delay = delay;
      card.href   = a.url;
      card.target = '_blank';
      card.rel    = 'noopener noreferrer';

      const headline = document.createElement('div');
      headline.className   = 'news-headline';
      headline.textContent = a.title;

      const vibeEl = document.createElement('div');
      vibeEl.className   = 'news-vibe astro-vibe';
      vibeEl.textContent = vibe;

      const meta = document.createElement('div');
      meta.className = 'news-meta';
      meta.innerHTML =
        `<span class="news-score">${escHtml(a.news_site || 'space')}</span>` +
        `<span class="news-time">${escHtml(ago)}</span>`;

      const voiceBtn = document.createElement('button');
      voiceBtn.className   = 'icon-btn news-voice-btn';
      voiceBtn.title       = 'hear this headline';
      voiceBtn.textContent = '🔊';
      voiceBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        playVoice(a.title, voiceBtn, false);
      });

      meta.appendChild(voiceBtn);
      card.append(headline, vibeEl, meta);
      grid.appendChild(card);
      scrollObs.observe(card);
    });
  } catch (_) {
    grid.innerHTML = '<div class="loading-msg">cosmos not cooperating rn 😩 refresh and manifest harder bestie</div>';
  }
}
