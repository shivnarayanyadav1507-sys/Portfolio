/* Visitor stats with GoatCounter (no cookies, no personal data).
   - Records the visit, so Shiv's private dashboard shows unique visitors and locations.
   - Shows "You are visitor no. N" using the site's total visitor count.
   Switched off until site-config.js has a goatcounter code. */
(() => {
  const code = ((window.PORTFOLIO_CONFIG || {}).goatcounter || '').trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(code)) return;
  const base = `https://${code}.goatcounter.com`;

  /* 1. record this visit */
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://gc.zgo.at/count.js';
  tag.dataset.goatcounter = `${base}/count`;
  document.head.appendChild(tag);

  /* 2. show the visitor number (home page only) */
  const badges = [...document.querySelectorAll('[data-visitor]')];
  if (!badges.length) return;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 8000);
  fetch(`${base}/counter/TOTAL.json`, { signal: abort.signal })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(data => {
      const total = parseInt(String(data.count || '').replace(/[^\d]/g, ''), 10);
      if (!Number.isFinite(total)) return;
      // the published total refreshes every few hours, so this visit is counted as the next one
      show(total + 1);
    })
    .catch(() => { /* blocked or offline: keep the badge hidden */ })
    .finally(() => clearTimeout(timer));

  function show(n) {
    const fmt = v => v.toLocaleString('en-GB');
    badges.forEach(b => { b.hidden = false; });
    const nums = badges.map(b => b.querySelector('[data-visitor-no]'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || n < 10) {
      nums.forEach(el => { el.textContent = fmt(n); });
      return;
    }
    const t0 = performance.now(), dur = 1200;
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(n * (1 - Math.pow(1 - p, 3)));
      nums.forEach(el => { el.textContent = fmt(v); });
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
})();
