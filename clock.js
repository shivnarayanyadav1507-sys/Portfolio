/* Solar system clock: tilted orbits around a lime sun.
   Ringed planet = hours, olive planet = minutes, comet = seconds.
   Reads the visitor's own device clock; nothing is sent anywhere. */
(() => {
  const svg = document.getElementById('orbit-clock');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const make = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };

  /* fixed starfield (same pattern on every visit) */
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 30; i++) {
    make('circle', { class: 'orbit-star', cx: (rand() * 220).toFixed(1), cy: (rand() * 150).toFixed(1), r: (0.5 + rand() * 0.8).toFixed(2) }, svg);
  }

  /* tilted system */
  const C = { x: 110, y: 75 };
  const TILT = -14;
  const system = make('g', { transform: `rotate(${TILT} ${C.x} ${C.y})` }, svg);
  const orbits = [46, 70, 96].map(rx => ({ rx, ry: rx * 0.32 }));
  orbits.forEach(o => make('ellipse', { class: 'orbit-path', cx: C.x, cy: C.y, rx: o.rx, ry: o.ry }, system));
  const back = make('g', {}, system);
  make('circle', { class: 'orbit-halo', cx: C.x, cy: C.y, r: 28 }, system);
  make('circle', { class: 'orbit-sun', cx: C.x, cy: C.y, r: 20 }, system);
  const front = make('g', {}, system);

  const hourPlanet = make('g', {});
  make('ellipse', { class: 'orbit-ring', rx: 13, ry: 3.6 }, hourPlanet);
  make('circle', { class: 'orbit-p1', r: 7 }, hourPlanet);
  const minutePlanet = make('g', {});
  make('circle', { class: 'orbit-p2', r: 5 }, minutePlanet);
  const comet = make('g', {});
  const trail = [];
  for (let i = 5; i >= 1; i--) trail.push(make('circle', { class: 'orbit-p3', r: 3 - i * 0.4, opacity: (0.5 - i * 0.08).toFixed(2) }, comet));
  make('circle', { class: 'orbit-p3', r: 3 }, comet);

  /* place a body on its ellipse; behind the sun on the far half, slightly larger on the near half */
  function place(node, orbit, f) {
    const a = f * TAU - Math.PI / 2;
    const x = C.x + orbit.rx * Math.cos(a);
    const y = C.y + orbit.ry * Math.sin(a);
    const scale = 1 + 0.2 * Math.sin(a);
    node.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)}) rotate(${-TILT})`);
    const layer = Math.sin(a) < 0 ? back : front;
    if (node.parentNode !== layer) layer.appendChild(node);
    return { a, scale };
  }

  /* readout */
  const hm = document.getElementById('orbit-hm');
  const sec = document.getElementById('orbit-sec');
  const ampm = document.getElementById('orbit-ampm');
  const date = document.getElementById('orbit-date');
  const stamp = document.getElementById('orbit-time');
  let lastSecond = -1;
  function readout(now) {
    const s = now.getSeconds();
    if (s === lastSecond) return;
    lastSecond = s;
    const parts = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).split(' ');
    hm.textContent = parts[0];
    ampm.textContent = parts[1] || '';
    sec.textContent = ':' + String(s).padStart(2, '0');
    date.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    stamp.dateTime = now.toISOString();
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function draw() {
    const now = new Date();
    const smooth = reduced.matches ? 0 : now.getMilliseconds() / 1000;
    const sf = (now.getSeconds() + smooth) / 60;
    const mf = (now.getMinutes() + sf) / 60;
    const hf = ((now.getHours() % 12) + mf) / 12;
    place(hourPlanet, orbits[0], hf);
    place(minutePlanet, orbits[1], mf);
    const o = orbits[2];
    const { a: a0, scale } = place(comet, o, sf);
    trail.forEach((dot, i) => {
      const a = (sf - (5 - i) * 0.012) * TAU - Math.PI / 2;
      dot.setAttribute('cx', ((o.rx * Math.cos(a) - o.rx * Math.cos(a0)) / scale).toFixed(2));
      dot.setAttribute('cy', ((o.ry * Math.sin(a) - o.ry * Math.sin(a0)) / scale).toFixed(2));
    });
    readout(now);
  }

  /* run only while the clock is on screen; once a second when motion is reduced */
  let raf = 0, timer = 0, visible = true;
  function loop() { draw(); raf = requestAnimationFrame(loop); }
  function start() {
    stop();
    if (!visible) return;
    if (reduced.matches) { draw(); timer = setInterval(draw, 1000); }
    else raf = requestAnimationFrame(loop);
  }
  function stop() { cancelAnimationFrame(raf); clearInterval(timer); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }).observe(svg);
  }
  reduced.addEventListener('change', start);
  draw();
  start();
})();
