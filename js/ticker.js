import { TICKER_ITEMS } from './data.js';

export function buildTicker() {
  const track = document.getElementById('ticker-track');
  [...TICKER_ITEMS, ...TICKER_ITEMS].forEach(text => {
    const span = document.createElement('span');
    span.className = 'ticker-item';
    span.textContent = text;
    track.appendChild(span);
  });
}
