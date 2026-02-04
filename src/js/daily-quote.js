const API_BASE_URL = 'https://your-energy.b.goit.study/api';
const QUOTE_ENDPOINT = `${API_BASE_URL}/quote`;

let quoteBlockEl;
let quoteImageWrapEl;
let quoteImageEl;
let quoteResizeObserver;

function syncQuoteImageHeight() {
  if (!quoteBlockEl || !quoteImageWrapEl) return;

  const height = quoteBlockEl.offsetHeight;
  if (height > 0) {
    quoteImageWrapEl.style.height = `${height}px`;
    if (quoteImageEl) {
      quoteImageEl.style.height = '100%';
    }
  }
}

function updateQuote(data) {
  const quoteEl = document.querySelector('.inspiration__quoteBlock__text_quote');
  const authorEl = document.querySelector('.inspiration__quoteBlock__author');

  if (!quoteEl || !authorEl || !data) return;

  const quote = typeof data.quote === 'string' ? data.quote.trim() : '';
  const author = typeof data.author === 'string' ? data.author.trim() : '';

  if (quote) quoteEl.textContent = quote;
  if (author) authorEl.textContent = author;

  requestAnimationFrame(syncQuoteImageHeight);
}

async function fetchQuote() {
  try {
    const response = await fetch(QUOTE_ENDPOINT, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    updateQuote(data);
  } catch (error) {
    console.error('Error fetching quote:', error);
  }
}

function initQuote() {
  if (window.__quoteInitDone) return;
  window.__quoteInitDone = true;

  quoteBlockEl = document.querySelector('.inspiration__quoteBlock');
  quoteImageWrapEl = document.querySelector('.inspiration__image');
  quoteImageEl = quoteImageWrapEl ? quoteImageWrapEl.querySelector('img') : null;

  syncQuoteImageHeight();

  if (quoteResizeObserver) {
    quoteResizeObserver.disconnect();
    quoteResizeObserver = null;
  }

  if (quoteBlockEl && typeof ResizeObserver !== 'undefined') {
    quoteResizeObserver = new ResizeObserver(syncQuoteImageHeight);
    quoteResizeObserver.observe(quoteBlockEl);
  } else {
    window.addEventListener('resize', syncQuoteImageHeight);
  }

  fetchQuote();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuote);
} else {
  initQuote();
}
