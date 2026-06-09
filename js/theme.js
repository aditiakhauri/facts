export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('pk-theme', t);
  document.querySelectorAll('.sw-dot').forEach(d =>
    d.classList.toggle('active', d.dataset.theme === t)
  );
}

export function initTheme() {
  applyTheme(localStorage.getItem('pk-theme') || 'pink');
  document.querySelectorAll('.sw-dot').forEach(d =>
    d.addEventListener('click', () => applyTheme(d.dataset.theme))
  );
}
