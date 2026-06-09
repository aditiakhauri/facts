import { QUIZ }                           from './data.js';
import { state }                          from './state.js';
import { gainXP, checkAchievement, launchConfetti } from './xp.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function renderQuiz() {
  state.quizAnswered = false;
  const q = QUIZ[state.quizIndex % QUIZ.length];

  // progress dots
  const dotsEl = document.getElementById('q-dots');
  dotsEl.innerHTML = '';
  QUIZ.forEach((_, i) => {
    const dot = document.createElement('div');
    const cur = state.quizIndex % QUIZ.length;
    dot.className = 'q-dot' + (i < cur ? ' done' : i === cur ? ' current' : '');
    dotsEl.appendChild(dot);
  });

  document.getElementById('quiz-q').textContent    = q.q;
  document.getElementById('quiz-result').textContent = '';
  document.getElementById('quiz-result').style.color  = '';
  document.getElementById('next-btn').classList.add('hidden');

  // options — built with DOM, no inline handlers
  const optsEl = document.getElementById('quiz-opts');
  optsEl.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.dataset.optIdx = i;

    const letter = document.createElement('span');
    letter.className = 'opt-letter';
    letter.textContent = LETTERS[i];

    btn.appendChild(letter);
    btn.appendChild(document.createTextNode(' ' + opt));
    optsEl.appendChild(btn);
  });
}

function answerQuiz(selected) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;
  state.quizTotal++;

  const q    = QUIZ[state.quizIndex % QUIZ.length];
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach(o => { o.disabled = true; });
  opts[q.ans].classList.add('correct');

  const resultEl = document.getElementById('quiz-result');

  if (selected === q.ans) {
    state.quizScore++;
    state.quizStreak++;
    resultEl.textContent = '✅ SLAY you ate that!! ' + q.exp;
    resultEl.style.color = 'var(--correct)';
    launchConfetti();
    gainXP(20);
    checkAchievement(state.quizStreak);
  } else {
    state.quizStreak = 0;
    opts[selected].classList.add('wrong');
    resultEl.textContent = '❌ not it bestie, but now you know! ' + q.exp;
    resultEl.style.color = 'var(--wrong)';
    gainXP(5);
  }

  const sb = document.getElementById('streak-badge');
  sb.textContent = '🔥 ' + state.quizStreak + ' streak';
  sb.classList.toggle('hot', state.quizStreak >= 3);

  document.getElementById('q-score').textContent = state.quizScore;
  document.getElementById('q-total').textContent = state.quizTotal;
  document.getElementById('next-btn').classList.remove('hidden');
}

export function initQuiz() {
  // event delegation for option clicks
  document.getElementById('quiz-opts').addEventListener('click', e => {
    const opt = e.target.closest('.quiz-opt');
    if (!opt) return;
    answerQuiz(parseInt(opt.dataset.optIdx, 10));
  });

  document.getElementById('next-btn').addEventListener('click', () => {
    state.quizIndex++;
    renderQuiz();
  });
}
