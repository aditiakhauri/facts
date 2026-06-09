import { FACTS }              from './data.js';
import { state }              from './state.js';
import { showToast }          from './utils.js';
import { gainXP }             from './xp.js';
import { playVoice, resetVoiceBtn } from './voice.js';

export function randomFeatured() {
  const pool = state.currentCat === 'all'
    ? FACTS
    : FACTS.filter(f => f.cat === state.currentCat);
  const f    = pool[Math.floor(Math.random() * pool.length)];

  const emoEl = document.getElementById('feat-emoji');
  emoEl.style.animation = 'none';
  void emoEl.offsetHeight;
  emoEl.style.animation = '';
  emoEl.textContent = f.emoji;

  document.getElementById('feat-text').textContent = f.text;
  document.getElementById('feat-cat').textContent  = '# ' + f.cat + ' era';

  // stop audio and reset voice button when the fact changes
  const vBtn = document.getElementById('feat-voice-btn');
  if (vBtn) {
    if (state.currentVoiceBtn === vBtn && state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    resetVoiceBtn(vBtn, true);
    if (state.currentVoiceBtn === vBtn) state.currentVoiceBtn = null;
  }

  gainXP(2);
}

export function initFeatured() {
  document.getElementById('random-feat-btn').addEventListener('click', randomFeatured);

  document.getElementById('share-feat-btn').addEventListener('click', () => {
    const text = document.getElementById('feat-text').textContent;
    navigator.clipboard.writeText(text)
      .then(() => showToast('copied bestie ✅'))
      .catch(() => showToast("couldn't copy rn 😩"));
  });

  document.getElementById('feat-voice-btn').addEventListener('click', e => {
    const text = document.getElementById('feat-text').textContent;
    playVoice(text, e.currentTarget, true);
  });
}
