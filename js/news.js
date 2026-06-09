import { NEWS_VIBES }       from './data.js';
import { escHtml, timeAgo } from './utils.js';
import { scrollObs }        from './scroll-anim.js';
import { playVoice }        from './voice.js';

export async function fetchNews() {
  const grid = document.getElementById('news-grid');

  try {
    const idsRes  = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids     = await idsRes.json();
    const stories = await Promise.all(
      ids.slice(0, 20).map(id =>
        fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').then(r => r.json())
      )
    );
    const valid = stories.filter(s => s && s.title && s.type === 'story');

    if (!valid.length) {
      grid.textContent = '';
      const msg = document.createElement('div');
      msg.className = 'loading-msg';
      msg.textContent = 'the tea is not loading rn bestie 😩 try refreshing';
      grid.appendChild(msg);
      return;
    }

    grid.innerHTML = '';
    valid.forEach((s, i) => {
      const vibe  = NEWS_VIBES[Math.floor(Math.random() * NEWS_VIBES.length)];
      const url   = s.url || 'https://news.ycombinator.com/item?id=' + s.id;
      const ago   = timeAgo(s.time);
      const hot   = s.score > 200;
      const delay = Math.min(i * 0.07, 0.6);

      const a = document.createElement('a');
      a.className = 'news-card sa';
      a.dataset.delay = delay;
      a.href   = url;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';

      const headline = document.createElement('div');
      headline.className = 'news-headline';
      headline.textContent = s.title;

      const vibeEl = document.createElement('div');
      vibeEl.className = 'news-vibe';
      vibeEl.textContent = vibe;

      const meta = document.createElement('div');
      meta.className = 'news-meta';
      meta.innerHTML =
        `<span class="news-score ${hot ? 'trending' : ''}">${hot ? '🔥' : '⬆️'} ${escHtml(String(s.score || 0))}${hot ? ' HOT' : ''}</span>` +
        `<span class="news-comments">💬 ${escHtml(String(s.descendants || 0))}</span>` +
        `<span class="news-time">${escHtml(ago)}</span>`;

      const voiceBtn = document.createElement('button');
      voiceBtn.className = 'icon-btn news-voice-btn';
      voiceBtn.title = 'hear this headline';
      voiceBtn.textContent = '🔊';
      voiceBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        playVoice(s.title, voiceBtn, false);
      });

      meta.appendChild(voiceBtn);
      a.append(headline, vibeEl, meta);
      grid.appendChild(a);
      scrollObs.observe(a);
    });
  } catch (_) {
    grid.textContent = '';
    const msg = document.createElement('div');
    msg.className = 'loading-msg';
    msg.textContent = 'news api not cooperating rn 😩 refresh and manifest harder bestie';
    grid.appendChild(msg);
  }
}
