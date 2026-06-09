export function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

export function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 3600)  return Math.floor(s / 60)   + 'm ago';
  if (s < 86400) return Math.floor(s / 3600)  + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export function showToast(msg) {
  const el = document.getElementById('copy-toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}
