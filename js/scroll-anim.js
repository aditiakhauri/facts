const REVEAL_EASE = 'cubic-bezier(0.22,1,0.36,1)';

function revealEl(el) {
  const delay = parseFloat(el.dataset.delay || '0') * 1000;
  setTimeout(() => {
    el.style.transition = `opacity 0.62s ${REVEAL_EASE}, transform 0.62s ${REVEAL_EASE}`;
    void el.offsetHeight;
    el.style.opacity   = '1';
    el.style.transform = 'none';
    setTimeout(() => {
      el.style.transition = '';
      el.style.opacity    = '';
      el.style.transform  = '';
      el.classList.add('sa-done');
      el.classList.remove('sa', 'sa-up', 'sa-left', 'sa-right', 'sa-scale');
    }, 700);
  }, delay);
}

export const scrollObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    revealEl(e.target);
    scrollObs.unobserve(e.target);
  });
}, { threshold: 0.06 });

export function setupScrollAnims() {
  document.querySelectorAll('.sa').forEach(el => scrollObs.observe(el));
}
