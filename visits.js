/* "You are visitor no. N" badge, counted with Abacus (free, no account, no cookies).
   - A browser is counted once: its number is kept in localStorage and shown again on later visits.
   - Counting only happens on the live domain, so local testing never changes the total.
   - If storage is blocked or the counter can't be reached, the badge simply stays hidden. */
(() => {
  const cfg = (window.PORTFOLIO_CONFIG || {}).visitorCounter;
  if (!cfg || !cfg.namespace || !cfg.key) return;
  const badges = [...document.querySelectorAll('[data-visitor]')];
  if (!badges.length) return;

  const valid = s => /^[A-Za-z0-9_-]{3,64}$/.test(s);
  if (!valid(cfg.namespace) || !valid(cfg.key)) return;
  const live = !cfg.domain || location.hostname === cfg.domain || location.hostname === 'www.' + cfg.domain;
  const automated = navigator.webdriver === true;

  const STORE = 'portfolio-visitor-no';
  let saved = null;
  try { saved = parseInt(localStorage.getItem(STORE), 10); } catch (e) { return; /* storage blocked: can't count once per browser */ }

  if (Number.isFinite(saved) && saved > 0) { show(saved, false); return; }
  if (!live || automated) return;

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 8000);
  fetch(`https://abacus.jasoncameron.dev/hit/${cfg.namespace}/${cfg.key}`, { signal: abort.signal, cache: 'no-store' })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(data => {
      const n = Number(data && data.value);
      if (!Number.isInteger(n) || n < 1) return;
      try { localStorage.setItem(STORE, String(n)); } catch (e) { /* ignore */ }
      show(n, true);
    })
    .catch(() => { /* offline, blocked or rate limited: keep the badge hidden */ })
    .finally(() => clearTimeout(timer));

  function show(n, animate) {
    const fmt = v => v.toLocaleString('en-GB');
    const nums = badges.map(b => b.querySelector('[data-visitor-no]'));
    badges.forEach(b => { b.hidden = false; });
    if (!animate || n < 10 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nums.forEach(el => { el.textContent = fmt(n); });
      return;
    }
    const t0 = performance.now(), dur = 1200;
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.max(1, Math.round(n * (1 - Math.pow(1 - p, 3))));
      nums.forEach(el => { el.textContent = fmt(v); });
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
})();
