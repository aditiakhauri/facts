import { FACTS }     from './data.js';
import { state }     from './state.js';
import { showToast } from './utils.js';
import { gainXP }    from './xp.js';
import { playVoice } from './voice.js';
import { scrollObs } from './scroll-anim.js';

export function renderFacts(cat) {
  const pool = cat === 'all' ? FACTS : FACTS.filter(f => f.cat === cat);
  document.getElementById('facts-count').textContent = pool.length + ' facts';

  const grid = document.getElementById('facts-grid');
  grid.innerHTML = '';

  pool.forEach((f, i) => {
    const isNew  = i < 3;
    const baseL  = 80 + Math.floor(Math.random() * 120);
    const likeC  = state.likes[i] !== undefined ? (state.likes[i] ? baseL + 1 : baseL) : baseL;
    const delay  = Math.min(i * 0.055, 0.5);

    const card = document.createElement('div');
    card.className    = 'fact-card sa';
    card.dataset.cat   = f.cat;
    card.dataset.idx   = i;
    card.dataset.base  = baseL;
    card.dataset.delay = delay;

    // top row
    const fcTop = document.createElement('div');
    fcTop.className = 'fc-top';

    const emojiEl = document.createElement('span');
    emojiEl.className = 'fc-emoji';
    emojiEl.textContent = f.emoji;
    fcTop.appendChild(emojiEl);

    if (isNew) {
      const badge = document.createElement('span');
      badge.className = 'fc-new-badge';
      badge.textContent = 'NEW';
      fcTop.appendChild(badge);
    }
    card.appendChild(fcTop);

    // fact text — textContent prevents any XSS
    const textEl = document.createElement('p');
    textEl.className = 'fc-text';
    textEl.textContent = f.text;
    card.appendChild(textEl);

    // footer
    const footer = document.createElement('div');
    footer.className = 'fc-footer';

    const tag = document.createElement('span');
    tag.className = `fc-tag tag-${f.cat}`;
    tag.textContent = '#' + f.cat;
    footer.appendChild(tag);

    const actions = document.createElement('div');
    actions.className = 'fc-actions';

    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.id = 'lc-' + i;
    likeCount.textContent = likeC;

    const likeBtn = document.createElement('button');
    likeBtn.className = 'icon-btn' + (state.likes[i] ? ' liked' : '');
    likeBtn.id = 'lb-' + i;
    likeBtn.dataset.action = 'like';
    likeBtn.dataset.idx    = i;
    likeBtn.dataset.base   = baseL;
    likeBtn.title = 'vibe with this fact';
    likeBtn.textContent = state.likes[i] ? '🩷' : '🤍';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'icon-btn';
    copyBtn.dataset.action = 'copy';
    copyBtn.title = 'copy this tea';
    copyBtn.textContent = '📋';

    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'icon-btn';
    voiceBtn.dataset.action = 'voice';
    voiceBtn.title = 'hear this fact';
    voiceBtn.textContent = '🔊';

    actions.append(likeCount, likeBtn, copyBtn, voiceBtn);
    footer.appendChild(actions);
    card.appendChild(footer);

    grid.appendChild(card);
    scrollObs.observe(card);
  });
}

export function initFacts() {
  document.getElementById('facts-grid').addEventListener('click', e => {
    const btn  = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const card   = btn.closest('.fact-card');

    if (action === 'like') {
      const idx  = parseInt(btn.dataset.idx,  10);
      const base = parseInt(btn.dataset.base, 10);
      toggleLike(idx, base, btn);
    } else if (action === 'copy') {
      const text = card?.querySelector('.fc-text')?.textContent;
      if (text) copyFact(text);
    } else if (action === 'voice') {
      const text = card?.querySelector('.fc-text')?.textContent;
      if (text) playVoice(text, btn, false);
    }
  });
}

function toggleLike(idx, base, btn) {
  state.likes[idx] = !state.likes[idx];
  const cnt = document.getElementById('lc-' + idx);
  if (state.likes[idx]) {
    btn.textContent = '🩷';
    btn.classList.add('liked');
    if (cnt) cnt.textContent = (base + 1).toString();
    gainXP(5);
  } else {
    btn.textContent = '🤍';
    btn.classList.remove('liked');
    if (cnt) cnt.textContent = base.toString();
  }
}

function copyFact(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('copied bestie ✅'))
    .catch(() => showToast("couldn't copy rn 😩"));
}
