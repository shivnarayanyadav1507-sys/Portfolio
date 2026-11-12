/* Character follows the mouse: the head turns toward the pointer.
   assets/character-turn/ holds 32 frames of one real head turn from the clip (00 = looking to the
   viewer's right, 31 = to the left). They load on the first mouse move, or the first touch on him.
   While the pointer moves, the idle clip pauses and these frames take over; after a short rest the
   clip picks up again from the source frame that matches the pose on screen, so there is no jump. */
(() => {
  const stage = document.getElementById('character-stage');
  if (!stage) return;
  const N = 32, FIRST = 199, CENTRE = 17, REST_MS = 2200;
  /* for each of the clip's 240 source frames, the turn frame with the same head angle */
  const MAP = '444433333333333333333002445677889999aaabccdeeffggggggggggghhhiijjjkklllllmmmmnnonnnnnnnnnnnnnnnnnnnnnnnnnnnnnonnmnmmllkjjiiihhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhggggfeeddccbba99877644422121001100123456789abcdefghijklmnopqrstuvuuuuuuuuu';

  const canvas = document.createElement('canvas');
  canvas.width = 528; canvas.height = 720;
  canvas.className = 'char-turn';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const frames = new Array(N);
  let loading = null, loaded = 0;
  function load() {
    if (loading) return loading;
    const base = new URL('assets/character-turn/', document.baseURI).href;
    loading = Promise.all(Array.from({ length: N }, (_, i) => {
      const img = new Image();
      img.src = base + String(i).padStart(2, '0') + '.webp';
      return img.decode().then(() => { frames[i] = img; loaded++; }, () => {});
    })).then(() => loaded === N);
    return loading;
  }

  const video = () => window.charVideo;
  const isActive = () => !video() || video().active;
  let turning = false, cur = CENTRE, target = CENTRE, shown = -1, raf = 0, restTimer = 0, releasing = false;

  function paint(i) {
    if (i === shown || !frames[i]) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[i], 0, 0);
    shown = i;
  }
  function tick() {
    cur += (target - cur) * 0.16;
    if (Math.abs(target - cur) < 0.05) cur = target;
    paint(Math.round(cur));
    raf = cur === target ? 0 : requestAnimationFrame(tick);
  }
  function engage() {
    if (turning || releasing || !isActive()) return;
    turning = true;
    const k = video() ? video().hold() : FIRST + CENTRE;
    cur = parseInt(MAP[k] || 'h', 32);
    shown = -1; paint(Math.round(cur));
    canvas.classList.add('is-on'); stage.classList.add('is-turning');
  }
  function release() {
    clearTimeout(restTimer); cancelAnimationFrame(raf); raf = 0;
    if (!turning) return;
    turning = false;
    const done = () => {
      stage.classList.remove('is-turning');           /* the clip fades back in underneath first */
      setTimeout(() => { canvas.classList.remove('is-on'); releasing = false; }, 260);
    };
    if (!video()) return done();
    releasing = true;
    video().resume(FIRST + Math.round(cur), done);
  }
  /* pointer x relative to the character: right of him turns him to the right */
  function aim(x) {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    const cx = r.left + r.width / 2;
    const reach = Math.max(r.width * 0.9, Math.min(cx, innerWidth - cx));
    const nx = Math.max(-1, Math.min(1, (x - cx) / reach));
    const e = Math.sign(nx) * (1 - Math.pow(1 - Math.abs(nx), 1.6));
    target = e >= 0 ? CENTRE - e * CENTRE : CENTRE - e * (N - 1 - CENTRE);
  }
  function move(x) {
    if (!isActive()) { release(); return; }
    load().then(ok => {
      if (!ok || !isActive()) return;
      engage();
      if (!turning) return;
      aim(x);
      if (!raf) raf = requestAnimationFrame(tick);
      clearTimeout(restTimer);
      restTimer = setTimeout(release, REST_MS);
    });
  }

  /* mouse and pen: anywhere on the page while the intro shows him */
  addEventListener('pointermove', e => { if (e.pointerType !== 'touch') move(e.clientX); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { clearTimeout(restTimer); restTimer = setTimeout(release, 600); });

  /* touch: a finger that lands on him turns him; page scrolling is left alone */
  let touching = false;
  addEventListener('touchstart', e => {
    const t = e.touches[0], r = stage.getBoundingClientRect();
    touching = e.touches.length === 1 && !e.target.closest('a, button, input, label') &&
      t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
    if (touching) move(t.clientX);
  }, { passive: true });
  addEventListener('touchmove', e => { if (touching) move(e.touches[0].clientX); }, { passive: true });
  addEventListener('touchend', () => { touching = false; }, { passive: true });

  /* scrolled past the intro: give the clip back so intro.js can pause it as before */
  addEventListener('scroll', () => { if (turning && !isActive()) release(); }, { passive: true });
})();
