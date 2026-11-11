// Head-turn character: 45 frames extracted from the supplied video. The pointer's horizontal
// position picks the pose; this is an image sequence, not a rigged 3D model.
const stage = document.getElementById('character-stage');
const canvas = document.getElementById('character-canvas');
if (stage && canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const FRAME_COUNT = 45;
  const frames = new Array(FRAME_COUNT);
  let desired = 0.5, current = 0.5, drawn = -1, raf = 0, last = 0, ready = false, touching = null;
  const frameFor = p => Math.round(p <= .5 ? p * 48 : 24 + (p - .5) * 40);

  // Edge-connected background matte (same treatment as the previous site), cached per frame.
  const matteCache = new Map();
  function matteFrame(index) {
    if (matteCache.has(index)) return matteCache.get(index);
    const out = document.createElement('canvas'); out.width = canvas.width; out.height = canvas.height;
    const c = out.getContext('2d', { willReadFrequently: true }); c.drawImage(frames[index], 0, 0);
    const image = c.getImageData(0, 0, out.width, out.height), data = image.data, W = out.width, H = out.height, N = W * H;
    const seen = new Uint8Array(N), queue = new Int32Array(N), dist = new Float32Array(N); dist.fill(999);
    let head = 0, tail = 0;
    const add = i => {
      if (i < 0 || i >= N || seen[i]) return; seen[i] = 1;
      const p = i * 4, r = data[p], g = data[p + 1], b = data[p + 2];
      if (r > 164 && g > 169 && b > 147 && Math.abs(r - g) < 17 && Math.abs(g - b) < 37) { queue[tail++] = i; dist[i] = 0; }
    };
    for (let x = 0; x < W; x++) { add(x); add((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { add(y * W); add(y * W + W - 1); }
    while (head < tail) { const i = queue[head++]; if (i % W) add(i - 1); if (i % W < W - 1) add(i + 1); add(i - W); add(i + W); }
    for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) { const i = y * W + x; dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1, dist[i - W - 1] + 1.414); }
    for (let y = H - 2; y >= 0; y--) for (let x = W - 2; x >= 0; x--) { const i = y * W + x; dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 1.414); }
    for (let i = 0; i < N; i++) { const a = Math.max(0, Math.min(1, (dist[i] - 2.2) / 1.5)); data[i * 4 + 3] = Math.round(a * 255); }
    c.putImageData(image, 0, 0);
    matteCache.set(index, out);
    if (matteCache.size > 12) matteCache.delete(matteCache.keys().next().value);
    return out;
  }

  function draw() {
    const wanted = frameFor(current);
    let pick = wanted;
    if (!frames[pick]) pick = frames.reduce((best, img, i) => img && (best < 0 || Math.abs(i - wanted) < Math.abs(best - wanted)) ? i : best, -1);
    if (pick < 0 || pick === drawn) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(matteFrame(pick), 0, 0, canvas.width, canvas.height);
    drawn = pick;
    stage.classList.add('is-ready');
    stage.dataset.frame = String(pick);
  }
  const wake = () => { if (!raf && ready && !reduced.matches && !document.hidden) raf = requestAnimationFrame(tick); };
  function tick(now) {
    raf = 0;
    if (reduced.matches || document.hidden) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60; last = now;
    current += (desired - current) * (1 - Math.exp(-18 * dt));
    if (Math.abs(desired - current) < .002) current = desired;
    draw();
    if (current !== desired) wake(); else last = 0;
  }
  const setProgress = v => { desired = Math.max(0, Math.min(1, v)); stage.dataset.target = desired.toFixed(3); wake(); };
  function track(e) {
    if (reduced.matches || e.pointerType === 'touch') return;
    const box = stage.getBoundingClientRect();
    const anchor = Math.max(1, Math.min(innerWidth - 1, box.left + box.width * .52));
    setProgress(e.clientX <= anchor ? .5 * e.clientX / anchor : .5 + .5 * (e.clientX - anchor) / (innerWidth - anchor));
  }
  window.addEventListener('pointermove', track, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => setProgress(.5));
  stage.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const was = reduced.matches;
    setProgress(e.key === 'Home' ? 0 : e.key === 'End' ? 1 : desired + (e.key === 'ArrowLeft' ? -.1 : .1));
    if (was) { current = desired; draw(); }
  });
  const touch = e => { const b = stage.getBoundingClientRect(); setProgress((e.clientX - b.left) / b.width); };
  stage.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { touching = e.pointerId; touch(e); } }, { passive: true });
  stage.addEventListener('pointermove', e => { if (e.pointerId === touching) touch(e); }, { passive: true });
  window.addEventListener('pointerup', () => { touching = null; });
  window.addEventListener('pointercancel', () => { touching = null; });
  reduced.addEventListener('change', () => { current = desired = .5; drawn = -1; draw(); wake(); });
  document.addEventListener('visibilitychange', () => { last = 0; wake(); });

  // Neutral pose first, then the turns; six parallel loaders.
  const order = [24, 0, 44, ...Array.from({ length: FRAME_COUNT }, (_, i) => i).filter(i => ![24, 0, 44].includes(i))];
  async function loader() {
    while (order.length) {
      const i = order.shift();
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const img = new Image();
          img.src = new URL(`assets/explorer-frames/${String(i + 1).padStart(2, '0')}.jpg`, import.meta.url).href;
          await img.decode();
          frames[i] = img;
          if (!ready) { ready = true; stage.dataset.ready = 'true'; }
          draw(); wake(); break;
        } catch (err) { /* retry once; the nearest loaded pose stays in use */ }
      }
    }
  }
  // The 45 frames are about 3 MB. Desktop pointers load them straight away; touch screens only
  // after the first touch on the character, and data-saver mode never (the poster stays).
  let started = false;
  const startLoading = () => { if (!started) { started = true; Promise.all(Array.from({ length: 6 }, loader)); } };
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  if (saveData) { /* keep the static poster */ }
  else if (matchMedia('(hover: none)').matches) {
    stage.addEventListener('pointerdown', startLoading, { once: true, passive: true });
    stage.addEventListener('focus', startLoading, { once: true });
  } else startLoading();
}
