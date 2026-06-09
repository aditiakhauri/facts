import { initTheme }           from './theme.js';
import { setupCursor }         from './cursor.js';
import { spawnParticles, buildHeaderEmojis } from './particles.js';
import { buildTicker }         from './ticker.js';
import { setupScrollAnims, scrollObs } from './scroll-anim.js';
import { randomFeatured, initFeatured } from './featured.js';
import { renderQuiz, initQuiz }         from './quiz.js';
import { renderFacts, initFacts }       from './facts.js';
import { fetchNews }           from './news.js';
import { state }               from './state.js';

function switchCat(cat) {
  state.currentCat = cat;

  const featEl  = document.getElementById('featured-section');
  const quizEl  = document.getElementById('quiz-section');
  const factsEl = document.getElementById('facts-section');
  const newsEl  = document.getElementById('news-section');

  if (cat === 'news') {
    featEl.classList.add('hidden');
    quizEl.classList.add('hidden');
    factsEl.classList.add('hidden');
    newsEl.classList.remove('hidden');
    document.querySelectorAll('.news-card.sa:not(.sa-done)').forEach(el => scrollObs.observe(el));
  } else {
    featEl.classList.remove('hidden');
    quizEl.classList.remove('hidden');
    factsEl.classList.remove('hidden');
    newsEl.classList.add('hidden');
    randomFeatured();
    renderFacts(cat);
    [featEl, quizEl, factsEl].forEach(el => {
      if (!el.classList.contains('sa-done')) scrollObs.observe(el);
    });
    const titles = {
      all:       '✨ all the tea',
      world:     '🌍 world facts, no cap',
      history:   '📜 history slay era',
      geography: '🗺️ geography bestie moments',
      civics:    '🏛️ civics? understood the assignment',
    };
    document.getElementById('facts-title').textContent = titles[cat] || '✨ all the tea';
  }
}

function init() {
  initTheme();
  setupCursor();
  spawnParticles();
  buildHeaderEmojis();
  buildTicker();
  initFeatured();
  initQuiz();
  initFacts();
  randomFeatured();
  renderFacts('all');
  renderQuiz();
  fetchNews();
  setupScrollAnims();

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchCat(btn.dataset.cat);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
