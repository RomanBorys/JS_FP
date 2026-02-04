const API_BASE_URL = 'https://your-energy.b.goit.study/api';
const SUBSCRIPTION_ENDPOINT = `${API_BASE_URL}/subscription`;

async function submitSubscription(email) {
  const response = await fetch(SUBSCRIPTION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const contentType = response.headers.get('content-type') || '';
  const hasJson = contentType.includes('application/json');
  const data = hasJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data && typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'Subscription failed. Please try again later.';
    throw new Error(message);
  }

  return data;
}

function setMessage(messageEl, text, state) {
  if (!messageEl) return;
  messageEl.textContent = text || '';
  messageEl.classList.remove('is-success', 'is-error');
  if (state) messageEl.classList.add(state);
}

function setLoading(form, isLoading) {
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const input = form.querySelector('input[type="email"]');

  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Sending...' : 'Send';
  }

  if (input) input.disabled = isLoading;

  form.setAttribute('aria-busy', String(isLoading));
}

function initFooterSubscription() {
  if (window.__footerSubscribeInitDone) return;
  window.__footerSubscribeInitDone = true;

  const form = document.getElementById('footerSubscribeForm');
  const input = document.getElementById('footerSubscribeInput');
  const messageEl = document.getElementById('footerSubscribeMessage');

  if (!form || !input || !messageEl) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }

    const email = input.value.trim();
    if (!email) return;

    setMessage(messageEl, '', null);
    setLoading(form, true);

    try {
      const data = await submitSubscription(email);
      const text =
        data && typeof data.message === 'string' && data.message.trim()
          ? data.message.trim()
          : 'Thanks for subscribing!';
      setMessage(messageEl, text, 'is-success');
      form.reset();
    } catch (error) {
      setMessage(messageEl, error.message || 'Subscription failed. Please try again later.', 'is-error');
    } finally {
      setLoading(form, false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooterSubscription);
} else {
  initFooterSubscription();
}
