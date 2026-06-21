import { state }           from './state.js';
import { showToast }       from './utils.js';
import { stopGlobalVoice } from './global-voice.js';

// check once on load whether the server already has a key (e.g. from .env)
let keyConfigured = false;
(async () => {
  try {
    const r = await fetch('/api/key-status');
    const d = await r.json();
    keyConfigured = !!d.configured;
  } catch (_) { /* server not up yet */ }
})();

function showKeyModal(errorMsg = '') {
  return new Promise(resolve => {
    const modal     = document.getElementById('key-modal');
    const input     = document.getElementById('key-input');
    const errorEl   = document.getElementById('key-error');
    const saveBtn   = document.getElementById('key-save-btn');
    const cancelBtn = document.getElementById('key-cancel-btn');

    input.value = '';
    errorEl.textContent = errorMsg;
    errorEl.classList.toggle('hidden', !errorMsg);

    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);

    function onSave() {
      const key = input.value.trim();
      if (!key) { input.focus(); return; }

      // send key to server — it never comes back to the browser
      fetch('/api/save-key', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            keyConfigured = true;
            modal.classList.add('hidden');
            errorEl.classList.add('hidden');
            cleanup();
            resolve(true);
          } else {
            errorEl.textContent = '❌ server rejected the key — try again';
            errorEl.classList.remove('hidden');
          }
        })
        .catch(() => {
          errorEl.textContent = '❌ could not reach server';
          errorEl.classList.remove('hidden');
        });
    }
    function onCancel() {
      modal.classList.add('hidden');
      errorEl.classList.add('hidden');
      cleanup();
      resolve(false);
    }
    function onBackdrop(e) { if (e.target === modal) onCancel(); }
    function onKeydown(e) {
      if (e.key === 'Enter')  onSave();
      if (e.key === 'Escape') onCancel();
    }
    function cleanup() {
      saveBtn.removeEventListener('click',    onSave);
      cancelBtn.removeEventListener('click',  onCancel);
      modal.removeEventListener('click',      onBackdrop);
      document.removeEventListener('keydown', onKeydown);
    }

    saveBtn.addEventListener('click',    onSave);
    cancelBtn.addEventListener('click',  onCancel);
    modal.addEventListener('click',      onBackdrop);
    document.addEventListener('keydown', onKeydown);
  });
}

async function ensureKey() {
  if (keyConfigured) return true;
  return showKeyModal();
}

export function resetVoiceBtn(btn, isFeatured) {
  if (!btn) return;
  btn.textContent = isFeatured ? '🔊 listen' : '🔊';
  btn.classList.remove('playing', 'loading');
  btn.disabled = false;
}

export async function playVoice(text, btn, isFeatured = false) {
  stopGlobalVoice();
  const ready = await ensureKey();
  if (!ready) return;

  // clicking the same playing button stops it
  if (state.currentVoiceBtn === btn && state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
    resetVoiceBtn(btn, isFeatured);
    state.currentVoiceBtn = null;
    return;
  }

  // stop any in-progress audio
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
    if (state.currentVoiceBtn) {
      resetVoiceBtn(state.currentVoiceBtn, state.currentVoiceBtn.id === 'feat-voice-btn');
    }
    state.currentVoiceBtn = null;
  }

  state.currentVoiceBtn = btn;
  btn.textContent = '⏳';
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    // only text goes in the request — key stays on the server
    const res = await fetch('/api/tts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });

    if (!res.ok) {
      resetVoiceBtn(btn, isFeatured);
      state.currentVoiceBtn = null;
      await handleApiError(res, text, btn, isFeatured);
      return;
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    state.currentAudio = new Audio(url);

    btn.textContent = isFeatured ? '⏹ stop' : '⏹';
    btn.classList.remove('loading');
    btn.classList.add('playing');
    btn.disabled = false;

    state.currentAudio.play();
    state.currentAudio.onended = () => {
      resetVoiceBtn(btn, isFeatured);
      URL.revokeObjectURL(url);
      state.currentAudio    = null;
      state.currentVoiceBtn = null;
    };
  } catch (err) {
    console.error('Voice fetch error:', err);
    showToast('voice not cooperating rn 😩 check your connection bestie');
    resetVoiceBtn(btn, isFeatured);
    state.currentVoiceBtn = null;
  }
}

async function handleApiError(res, text, btn, isFeatured) {
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.detail?.message || body?.detail || body?.error || JSON.stringify(body);
  } catch (_) { /* non-JSON body */ }

  console.error(`ElevenLabs ${res.status}:`, detail);

  if (res.status === 401) {
    // key was cleared or rejected — ask again
    keyConfigured = false;
    const msg = detail
      ? `❌ ${detail}`
      : '❌ API key rejected — copy it from elevenlabs.io/app/settings';
    const ok = await showKeyModal(msg);
    if (ok) playVoice(text, btn, isFeatured);
    return;
  }

  if (res.status === 402) {
    showToast('❌ ' + (detail || 'plan does not support this voice'));
    return;
  }

  if (res.status === 404) {
    showToast('voice not found — add it to your VoiceLab at elevenlabs.io 🔑');
    return;
  }

  if (res.status === 422) {
    showToast(detail || 'voice not in your VoiceLab — add it at elevenlabs.io 🔑');
    return;
  }

  if (res.status === 429) {
    showToast('rate limited bestie 😩 wait a sec and try again');
    return;
  }

  showToast(`voice error ${res.status}${detail ? ': ' + detail : ''} 😩`);
}
