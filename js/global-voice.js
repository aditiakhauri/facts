import { state }     from './state.js';
import { showToast } from './utils.js';

const MAX_CHUNK = 1200; // safe under ElevenLabs free-tier limit

const gv = {
  queue:        [],
  idx:          0,
  audio:        null,
  playing:      false,
  paused:       false,
  answerListener: null,
};

function getBtn() { return document.getElementById('global-voice-btn'); }

function setIcon(icon) {
  const btn = getBtn();
  if (btn) btn.textContent = icon;
}

function collectText() {
  const parts = [];

  const featEl = document.getElementById('featured-section');
  if (featEl && !featEl.classList.contains('hidden')) {
    const feat = document.getElementById('feat-text')?.textContent?.trim();
    if (feat && feat !== 'loading the most bussin fact rn…') parts.push({ text: feat });

    const quizQ = document.getElementById('quiz-q')?.textContent?.trim();
    if (quizQ && !quizQ.startsWith('loading')) parts.push({ text: quizQ, isQuiz: true });

    document.querySelectorAll('.fc-text').forEach(el => {
      const t = el.textContent.trim();
      if (t) parts.push({ text: t });
    });
  }

  const newsEl = document.getElementById('news-section');
  if (newsEl && !newsEl.classList.contains('hidden')) {
    document.querySelectorAll('#news-grid .news-headline').forEach(el => {
      const t = el.textContent.trim();
      if (t) parts.push({ text: t });
    });
  }

  const astroEl = document.getElementById('astro-section');
  if (astroEl && !astroEl.classList.contains('hidden')) {
    document.querySelectorAll('#astro-grid .news-headline').forEach(el => {
      const t = el.textContent.trim();
      if (t) parts.push({ text: t });
    });
  }

  return parts;
}

function buildQueue(parts) {
  return parts.map(p => ({ ...p, text: p.text.endsWith('.') ? p.text : p.text + '.' }));
}

function stopCurrent() {
  if (gv.audio) {
    gv.audio.pause();
    gv.audio = null;
  }
  // also stop any per-item audio
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
  }
  if (state.currentVoiceBtn) {
    const b = state.currentVoiceBtn;
    b.textContent = b.id === 'feat-voice-btn' ? '🔊 listen' : '🔊';
    b.classList.remove('playing', 'loading');
    b.disabled = false;
    state.currentVoiceBtn = null;
  }
}

async function ttsPlay(text) {
  const res = await fetch('/api/tts', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });
  if (!res.ok) throw Object.assign(new Error('tts failed'), { status: res.status });
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const audio = new Audio(url);
  return { audio, url };
}

async function playChunk(idx) {
  if (idx >= gv.queue.length) {
    reset();
    return;
  }

  gv.idx = idx;
  const item = gv.queue[idx];

  try {
    const { audio, url } = await ttsPlay(item.text);
    if (!gv.playing) { URL.revokeObjectURL(url); return; }

    gv.audio = audio;
    setIcon('⏸');
    audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(url);
      gv.audio = null;

      if (!gv.playing || gv.paused) return;

      if (item.isQuiz) {
        // wait for the user to answer before continuing
        waitForQuizAnswer(idx);
      } else {
        setTimeout(() => {
          if (gv.playing && !gv.paused) playChunk(idx + 1);
        }, 3000);
      }
    };
  } catch (err) {
    if (err.status === 401) showToast('🔑 add your ElevenLabs key first bestie');
    else { console.error('global voice error:', err); showToast('voice not cooperating rn 😩'); }
    reset();
  }
}

function waitForQuizAnswer(idx) {
  setIcon('⏳');

  function onAnswer(e) {
    document.removeEventListener('quiz-answered', onAnswer);
    gv.answerListener = null;
    if (!gv.playing) return;

    const reaction = e.detail.correct
      ? 'slay bestie, clock itttt'
      : 'that was a bit ohio of you not gonna lie';

    ttsPlay(reaction).then(({ audio, url }) => {
      if (!gv.playing) { URL.revokeObjectURL(url); return; }
      gv.audio = audio;
      setIcon('⏸');
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        gv.audio = null;
        if (gv.playing && !gv.paused) waitForNextQuestion(idx);
      };
    }).catch(() => {
      if (gv.playing && !gv.paused) playChunk(idx + 1);
    });
  }

  gv.answerListener = onAnswer;
  document.addEventListener('quiz-answered', onAnswer);
}

// after the reaction: if user clicks "next question" within 8s, read it and loop
// otherwise move on to the rest of the queue (facts etc.)
function waitForNextQuestion(idx) {
  setIcon('⏳');
  let settled = false;
  const nextBtn = document.getElementById('next-btn');

  function finish(readNextQ) {
    if (settled) return;
    settled = true;
    clearTimeout(tid);
    nextBtn.removeEventListener('click', onNext);

    if (readNextQ) {
      // quiz.js's handler fires first, so renderQuiz() already ran —
      // #quiz-q already contains the new question text
      setTimeout(() => {
        if (!gv.playing) return;
        const newQ = document.getElementById('quiz-q')?.textContent?.trim();
        if (newQ && !newQ.startsWith('loading')) {
          ttsPlay(newQ.endsWith('.') ? newQ : newQ + '.').then(({ audio, url }) => {
            if (!gv.playing) { URL.revokeObjectURL(url); return; }
            gv.audio = audio;
            setIcon('⏸');
            audio.play();
            audio.onended = () => {
              URL.revokeObjectURL(url);
              gv.audio = null;
              if (gv.playing && !gv.paused) waitForQuizAnswer(idx);
            };
          }).catch(() => { if (gv.playing && !gv.paused) playChunk(idx + 1); });
        } else {
          if (gv.playing && !gv.paused) playChunk(idx + 1);
        }
      }, 150);
    } else {
      setTimeout(() => {
        if (gv.playing && !gv.paused) playChunk(idx + 1);
      }, 3000);
    }
  }

  function onNext() { finish(true); }
  const tid = setTimeout(() => finish(false), 8000);
  nextBtn.addEventListener('click', onNext);
}

function reset() {
  if (gv.answerListener) {
    document.removeEventListener('quiz-answered', gv.answerListener);
    gv.answerListener = null;
  }
  gv.queue   = [];
  gv.idx     = 0;
  gv.audio   = null;
  gv.playing = false;
  gv.paused  = false;
  setIcon('🔊');
  getBtn()?.classList.remove('gv-playing');
}

export function globalVoiceToggle() {
  // pause
  if (gv.playing && !gv.paused) {
    gv.paused = true;
    gv.audio?.pause();
    setIcon('▶');
    return;
  }

  // resume
  if (gv.playing && gv.paused) {
    gv.paused = false;
    if (gv.audio) {
      gv.audio.play();
      setIcon('⏸');
    } else {
      // chunk finished while paused — move to next
      playChunk(gv.idx + 1);
    }
    return;
  }

  // start fresh
  const parts = collectText();
  if (!parts.length) {
    showToast('nothing to read on this page bestie 👀');
    return;
  }

  stopCurrent();
  gv.queue   = buildQueue(parts);
  gv.idx     = 0;
  gv.playing = true;
  gv.paused  = false;
  getBtn()?.classList.add('gv-playing');
  setIcon('⏳');
  playChunk(0);
}

// let per-item voice buttons stop the global reader
export function stopGlobalVoice() {
  if (gv.playing) reset();
}
