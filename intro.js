/* Opening sequence, tied to scroll position (so scrolling back up plays it in reverse):
   - the character blurs into a soft backdrop that stays behind the page;
   - SHIV, the menu, the stats, the switch and View CV fly into their places in the sidebar,
     the menu items one after another;
   - the name rises and fades; the sidebar panels fade in around the items as they land. */
(() => {
  const stage = document.querySelector('[data-intro]');
  if (!stage) return;
  const root = document.documentElement;
  const sidebar = document.querySelector('.sidebar');
  const charStage = document.getElementById('character-stage');
  const head = stage.querySelector('[data-rise]');
  const fades = [...document.querySelectorAll('[data-fade]')];
  const fadeBtns = [...document.querySelectorAll('[data-fade-btn]')];
  const desk = matchMedia('(min-width: 1001px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* timing of each flyer, as fractions of the intro scroll: [start, end] */
  const timing = key => {
    if (key.startsWith('nav-')) { const i = +key.slice(4); return [0.1 + i * 0.04, 0.58 + i * 0.04]; }
    return ({ brand: [0.12, 0.78], switch: [0.2, 0.78], 'stat-0': [0.22, 0.8], 'stat-1': [0.26, 0.82], cv: [0.3, 0.84] })[key] || [0.2, 0.8];
  };
  const flyers = [...document.querySelectorAll('[data-fly]')].map(el => ({
    el, key: el.dataset.fly, target: document.querySelector(`[data-land="${el.dataset.fly}"]`)
  })).filter(f => f.target);
  flyers.forEach(f => { f.t = timing(f.key); f.align = f.key.startsWith('nav-') ? 'left' : 'center'; });

  /* the intro copies of the menu, stats and switch are visual only; the sidebar holds the real ones */
  stage.querySelectorAll('.intro-nav, .intro-stats, .intro-switch').forEach(n => n.setAttribute('aria-hidden', 'true'));
  stage.querySelectorAll('.intro-nav a, .intro-switch input').forEach(n => n.setAttribute('tabindex', '-1'));

  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const span = (p, a, b) => clamp((p - a) / (b - a));

  let geo = [], distance = 1, lastP = -1, ticking = false;

  function measure() {
    flyers.forEach(f => { f.el.style.transform = ''; });
    if (head) head.style.transform = '';
    const headTop = head ? head.getBoundingClientRect().top : 0;
    geo = flyers.map(f => {
      const a = f.el.getBoundingClientRect(), b = f.target.getBoundingClientRect();
      return { a, b, inHead: head && head.contains(f.el), headTop };
    });
    distance = Math.max(1, window.innerHeight);
    fitWordmark();
    lastP = -1; update();
  }

  /* SHIV fills the width of the screen, like the reference */
  function fitWordmark() {
    const wm = document.querySelector('.intro-wordmark');
    if (!wm || !desk.matches) { if (wm) wm.style.fontSize = ''; return; }
    wm.style.fontSize = '100px';
    const range = document.createRange(); range.selectNodeContents(wm);
    const w = range.getBoundingClientRect().width || 1;
    const size = Math.min(100 * (window.innerWidth - 40) / w, window.innerHeight * 0.42);
    wm.style.fontSize = size + 'px';
    root.style.setProperty('--wm-h', wm.getBoundingClientRect().height + 'px');
    flyers.forEach(f => { if (f.key === 'brand') f.el.style.transform = ''; });
    const i = flyers.findIndex(f => f.key === 'brand');
    if (i > -1 && geo[i]) geo[i].a = flyers[i].el.getBoundingClientRect();
  }

  function update() {
    ticking = false;
    let p = clamp(window.scrollY / distance);
    if (reduced.matches) p = p > 0.4 ? 1 : 0;
    if (p === lastP) return;
    lastP = p;
    root.style.setProperty('--intro', p.toFixed(4));

    /* character: blur into the background, never fully gone */
    if (charStage) {
      charStage.style.filter = p > 0 ? `blur(${(p * (desk.matches ? 34 : 18)).toFixed(1)}px)` : '';
      charStage.style.opacity = (desk.matches ? 1 - p * 0.55 : 1 - span(p, 0.1, 0.75)).toFixed(3);
      charStage.style.transform = `translateX(-50%) scale(${(1 + p * 0.1).toFixed(3)})`;
    }
    if (window.charVideo) window.charVideo.setActive(p < 0.95);

    /* on phones the cards and text are ordinary content: only the character changes */
    fades.forEach(el => { el.style.opacity = desk.matches ? (1 - span(p, 0, 0.35)).toFixed(3) : ''; el.style.transform = desk.matches ? `translateY(${(-p * 40).toFixed(1)}px)` : ''; });
    fadeBtns.forEach(el => { el.style.opacity = desk.matches ? (1 - span(p, 0.05, 0.3)).toFixed(3) : ''; });

    const headShift = desk.matches ? -p * window.innerHeight * 0.55 : 0;
    if (head) {
      head.style.transform = `translateY(${headShift.toFixed(1)}px)`;
      head.style.opacity = desk.matches ? (1 - span(p, 0.25, 0.7)).toFixed(3) : '';
    }

    /* sidebar fades in around the landed items, the flying copies fade out on the spot */
    const land = span(p, 0.8, 0.98);
    const landed = p >= 0.985;
    root.classList.toggle('intro-landed', landed);
    if (desk.matches) {
      sidebar.style.opacity = sidebar.matches(':focus-within') ? '1' : '';
      flyers.forEach((f, i) => {
        const g = geo[i]; if (!g) return;
        const e = ease(span(p, f.t[0], f.t[1]));
        const s = 1 + (g.b.height / g.a.height - 1) * e;
        let dx, dy;
        if (f.align === 'left') { dx = g.b.left - g.a.left; dy = (g.b.top + g.b.height / 2) - (g.a.top + g.a.height / 2); }
        else { dx = (g.b.left + g.b.width / 2) - (g.a.left + g.a.width / 2); dy = (g.b.top + g.b.height / 2) - (g.a.top + g.a.height / 2); }
        let ty = dy * e; if (g.inHead) ty -= headShift;
        const origin = f.align === 'left' ? '0 50%' : '50% 50%';
        f.el.style.transformOrigin = origin;
        f.el.style.transform = `translate(${(dx * e).toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
        if (f.key.startsWith('nav-')) f.el.style.opacity = landed ? '0' : '1';      /* same text: swap on the spot */
        else if (f.key === 'brand') f.el.style.opacity = (1 - span(p, 0.55, 0.8)).toFixed(3); /* SHIV dissolves into the logo */
        else f.el.style.opacity = (1 - land).toFixed(3);                                /* restyled items cross-fade */
      });
    } else {
      sidebar.style.opacity = '';
      flyers.forEach(f => { f.el.style.transform = ''; f.el.style.opacity = ''; });
    }
    stage.classList.toggle('is-done', p >= 0.999 && desk.matches);
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(measure));
  desk.addEventListener('change', measure);
  reduced.addEventListener('change', () => { lastP = -1; update(); });
  sidebar.addEventListener('focusin', () => { lastP = -1; update(); });
  sidebar.addEventListener('focusout', () => setTimeout(() => { lastP = -1; update(); }, 0));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  measure();
})();
