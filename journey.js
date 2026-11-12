/* Experience: timeline + orthographic globe (D3 + Natural Earth land, both bundled locally). */
(() => {
  const experiences = [
    { year: '2017', title: 'Map database development', org: 'GIS Trainee, MapMyIndia', place: 'New Delhi', when: 'Work location · Feb to Sep 2017', lat: 28.61, lon: 77.21,
      text: 'Geocoding and digitisation of point, line and polygon map data, database updates, and data cleaning, verification and validation.' },
    { year: '2018', title: 'Geo-informatics', org: 'ITC, University of Twente / IIRS', place: 'Dehradun, Uttarakhand', when: 'Education · PG Diploma, Aug 2018', lat: 30.32, lon: 78.04, link: 'water',
      text: 'Postgraduate Diploma in Geo-informatics from ITC, University of Twente, with a dissertation at IIRS on climate-change impacts on the hydrology of a river basin and a Leaflet web portal for simulated water-balance components.' },
    { year: '2019', title: 'SECURE Himalaya', org: 'Junior Project Biologist, Wildlife Institute of India', place: 'Himachal Pradesh', when: 'Project region · Jan 2019 to Jan 2021', lat: 32.0, lon: 77.3, link: 'himalaya',
      text: 'Identifying, delineating and mapping areas with high conservation values, and developing management recommendations for the SECURE Himalaya landscape in Himachal Pradesh (WII and UNDP).' },
    { year: '2021', title: 'Wildlife population estimation', org: 'Project Associate I, Wildlife Institute of India', place: 'Uttarakhand', when: 'Project region · Apr 2021 to Jun 2023', lat: 30.1, lon: 79.2,
      text: 'Study and survey design, survey data processing, LULC classification, species distribution modelling and mapping for the Uttarakhand State Wildlife Population Estimation (Himalayan Zone), plus technical training workshops for government departments.' },
    { year: '2023', title: 'Livestock grazing study', org: 'Project Associate II, Wildlife Institute of India', place: 'Tirthan & Sainj Wildlife Sanctuaries', when: 'Project region · Jul to Dec 2023', lat: 31.65, lon: 77.45,
      text: 'Geospatial analysis for the present status of livestock grazing and a suggestive plan to phase it out: survey design, survey data processing, LULC classification and species distribution modelling.' },
    { year: '2024', title: 'Regeneration Meghalaya', org: 'GIS Analyst, EarthTree Data Services', place: 'Shillong, Meghalaya', when: 'Project region · Jun 2024 to Aug 2026', lat: 25.57, lon: 91.88, link: 'meghalaya',
      text: 'Led a team of GIS analysts delivering MRV outputs for an ARR carbon-credit project: eligibility area analysis in Google Earth Engine, geodatabase and sampling design, topology QA/QC, and Python and GEE automation.' },
    { year: '2025', title: 'EarthTree Kenya', org: 'EarthTree Kenya', place: 'Eldoret, Kenya', when: 'Work location · 15 Jan to 15 Apr 2025', lat: 0.51, lon: 35.27,
      text: 'Brought the project’s GIS work on track through GIS data review, ground data correction, SOP development, land onboarding, stakeholder consultations and process automation, alongside GIS work similar to the Regeneration Meghalaya project in India.' },
    { year: '2026', title: 'TEEB AgriFood', org: 'GIS Consultant, Indian Institute of Forest Management', place: 'Assam', when: 'Project region · Aug 2026 to present', lat: 26.2, lon: 92.9, link: 'assam',
      text: 'Climate data analysis and scenario-based forecasting of ecosystem services for the TEEBAgriFood Initiative, valuing natural, produced, human and social capital across four pathways. The work also covers UAV and LiDAR processing, carbon storage assessment, MRV design, and policy instruments including Payment for Ecosystem Services and India’s Green Credit Program.' }
  ];

  const list = document.getElementById('timeline');
  const canvas = document.getElementById('journey-globe');
  const statusEl = document.getElementById('globe-status');
  const resetBtn = document.getElementById('globe-reset');
  if (!list || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = experiences.length - 1, lon = 80, lat = 18, zoom = 1, land = null, w = 0, h = 0, drag = null, raf = 0;
  const ctx = canvas.getContext('2d');

  /* ----- timeline: zig-zag cards, rolling years, a line that draws as you scroll ----- */
  const tlCol = list.parentElement;
  list.classList.add('tl-cards');
  const reel = d => `<span class="reel" data-d="${d}">${'01234567890123456789'.split('').map(n => `<span>${n}</span>`).join('')}</span>`;
  list.innerHTML = experiences.map((e, i) => `
    <li class="tl-card ${i % 2 ? 'is-left' : 'is-right'}" data-i="${i}">
      <div class="tl-year"><span class="sr-only">${e.year}</span><span aria-hidden="true">’</span><span aria-hidden="true" style="display:flex">${reel(e.year[2])}${reel(e.year[3])}</span></div>
      <h3>${e.title}</h3>
      <p class="tl-org">${e.org === e.title ? e.place : e.org + ' · ' + e.place}</p>
      <p class="tl-when">${e.when}</p>
      <p class="tl-text">${e.text}</p>
      <div class="tl-foot">
        <button type="button" class="btn btn-outline btn-sm" data-show="${i}">Show on globe</button>
        ${e.link ? `<button type="button" class="btn btn-ink btn-sm" data-open-project="${e.link}">View related project</button>` : ''}
      </div>
    </li>`).join('');
  const cards = [...list.querySelectorAll('.tl-card')];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tl-line'); svg.setAttribute('aria-hidden', 'true');
  tlCol.insertBefore(svg, list);

  list.addEventListener('click', ev => {
    const proj = ev.target.closest('[data-open-project]');
    if (proj) { if (window.openProject) window.openProject(proj.dataset.openProject); return; }
    const card = ev.target.closest('.tl-card');
    if (card) { manual = performance.now(); select(Number(card.dataset.i), true); }
  });

  /* years roll up like a counter when a card arrives */
  const rollIn = card => card.querySelectorAll('.reel').forEach(r => { r.style.transform = `translateY(-${(10 + Number(r.dataset.d)) * 1.2}em)`; /* each digit cell is 1.2em tall so tops are not clipped */ });
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in'); rollIn(en.target); revealIO.unobserve(en.target);
  }), { threshold: 0.18 });
  cards.forEach(c => revealIO.observe(c));
  if (reduced.matches) cards.forEach(c => { c.classList.add('is-in'); c.querySelectorAll('.reel').forEach(r => { r.style.transition = 'none'; }); rollIn(c); });

  /* the card crossing the middle of the screen is the active one; the globe follows it */
  let manual = 0;
  const activeIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting || performance.now() - manual < 900) return;
    const i = Number(en.target.dataset.i);
    if (i !== selected) select(i, true);
  }), { rootMargin: '-48% 0px -48% 0px' });
  cards.forEach(c => activeIO.observe(c));

  /* connector: a curve from each card to the next, with dots where it touches them */
  let pathLen = 0, marks = [], path = null, dots = [];
  function layoutLine() {
    if (!cards.length) return;
    const box = tlCol.getBoundingClientRect();
    if (getComputedStyle(svg).display === 'none') return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const pts = cards.map(c => { const r = c.getBoundingClientRect(); return { l: r.left - box.left, r: r.right - box.left, t: r.top - box.top, b: r.bottom - box.top, right: c.classList.contains('is-right') }; });
    let d = '', anchors = [];
    for (let i = 0; i < pts.length - 1; i++) {
      /* like the reference: the line leaves a card on its outer side and sweeps diagonally behind
         to the same side of the next card, alternating right and left */
      const a = pts[i], n = pts[i + 1], dir = i % 2 ? -1 : 1;
      const A = { x: dir > 0 ? a.r : a.l, y: a.b - 42 };
      const B = { x: dir > 0 ? n.r : n.l, y: n.t + 42 };
      const c1 = { x: A.x + dir * 70, y: A.y + 80 };
      const c2 = { x: B.x + dir * 70, y: B.y - 80 };
      d += `${i ? ' ' : ''}M${A.x.toFixed(1)} ${A.y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}`;
      anchors.push(A, B);
    }
    svg.innerHTML = `<path d="${d}"/>` + anchors.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5"/>`).join('');
    path = svg.querySelector('path'); dots = [...svg.querySelectorAll('circle')];
    pathLen = path.getTotalLength();
    /* length along the path at each dot */
    marks = []; let acc = 0;
    const segs = d.split(' M');
    segs.forEach((s, i) => {
      const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path'); tmp.setAttribute('d', (i ? 'M' : '') + s); svg.appendChild(tmp);
      const L = tmp.getTotalLength(); tmp.remove();
      marks.push(acc, acc + L); acc += L;
    });
    path.style.strokeDasharray = `${pathLen} ${pathLen}`;
    drawLine();
  }
  function drawLine() {
    if (!path) return;
    const r = tlCol.getBoundingClientRect(), vh = window.innerHeight;
    const prog = reduced.matches ? 1 : Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
    const drawn = pathLen * prog;
    path.style.strokeDashoffset = String(pathLen - drawn);
    dots.forEach((c, i) => { c.style.opacity = drawn >= marks[i] - 1 ? '1' : '0'; });
  }
  let lineTick = false;
  window.addEventListener('scroll', () => { if (!lineTick) { lineTick = true; requestAnimationFrame(() => { lineTick = false; drawLine(); }); } }, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(layoutLine));
  if ('ResizeObserver' in window) new ResizeObserver(() => layoutLine()).observe(list);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutLine);

  function select(i, move) {
    selected = i;
    cards.forEach((c, j) => c.classList.toggle('is-active', i === j));
    canvas.setAttribute('aria-label', `Globe of experience locations; selected: ${experiences[i].place}. Drag to rotate; arrow keys rotate.`);
    if (move) fly(experiences[i].lon, experiences[i].lat); else render();
  }

  /* ----- globe ----- */
  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const v = n => cs.getPropertyValue(n).trim();
    return { sphere: v('--globe-sphere'), land: v('--globe-land'), coast: v('--globe-coast'), grid: v('--globe-grid'), ink: v('--ink'), accent: v('--accent'), inv: v('--inv') };
  }
  let col = colors();
  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  function render() {
    if (!w || !window.d3) return;
    const lens = Math.min(w, h) * 0.47;
    const proj = d3.geoOrthographic().rotate([-lon, -lat]).translate([w / 2, h / 2]).scale(lens * zoom).clipAngle(90);
    const path = d3.geoPath(proj, ctx);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, lens, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = col.sphere; ctx.fill(); ctx.clip();
    ctx.beginPath(); path(d3.geoGraticule10()); ctx.strokeStyle = col.grid; ctx.lineWidth = 1; ctx.stroke();
    if (land) { ctx.beginPath(); path(land); ctx.fillStyle = col.land; ctx.fill(); ctx.strokeStyle = col.coast; ctx.lineWidth = .9; ctx.stroke(); }
    const shade = ctx.createRadialGradient(w / 2 - lens * .38, h / 2 - lens * .42, lens * .05, w / 2, h / 2, lens);
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    shade.addColorStop(.55, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = shade; ctx.fillRect(w / 2 - lens, h / 2 - lens, lens * 2, lens * 2);
    const order = experiences.map((e, i) => i).sort((a, b) => (a === selected) - (b === selected));
    order.forEach(i => {
      const e = experiences[i];
      if (d3.geoDistance([e.lon, e.lat], [lon, lat]) > Math.PI / 2) return;
      const [x, y] = proj([e.lon, e.lat]);
      const on = i === selected;
      ctx.beginPath(); ctx.arc(x, y, on ? 8 : 4.5, 0, Math.PI * 2);
      if (on) { ctx.lineWidth = 6; ctx.strokeStyle = col.accent; ctx.stroke(); ctx.fillStyle = col.ink; ctx.fill(); }
      else { ctx.fillStyle = col.accent; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = col.ink; ctx.stroke(); }
    });
    ctx.restore();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, lens, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.strokeStyle = col.grid.replace(/[\d.]+\)$/, '0.25)'); ctx.stroke();
    const e = experiences[selected];
    if (d3.geoDistance([e.lon, e.lat], [lon, lat]) <= Math.PI / 2) {
      const [x, y] = proj([e.lon, e.lat]);
      ctx.font = '700 13px Archivo, system-ui, sans-serif';
      const label = e.place, tw = ctx.measureText(label).width;
      const right = x > w * 0.62, bx = Math.max(4, Math.min(w - tw - 24, right ? x - tw - 34 : x + 16)), by = Math.max(4, y - 40);
      ctx.fillStyle = col.ink; roundRect(bx, by, tw + 20, 28, 8); ctx.fill();
      ctx.fillStyle = col.inv; ctx.fillText(label, bx + 10, by + 19);
    }
  }
  function roundRect(x, y, rw, rh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + rw, y, x + rw, y + rh, r); ctx.arcTo(x + rw, y + rh, x, y + rh, r); ctx.arcTo(x, y + rh, x, y, r); ctx.arcTo(x, y, x + rw, y, r); ctx.closePath(); }
  function fly(toLon, toLat) {
    cancelAnimationFrame(raf);
    const lon0 = lon, lat0 = lat, t0 = performance.now();
    let dLon = toLon - lon0; if (dLon > 180) dLon -= 360; if (dLon < -180) dLon += 360;
    const dur = reduced.matches ? 0 : 750;
    function step(t) {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1, a = 1 - Math.pow(1 - p, 3);
      lon = lon0 + dLon * a; lat = lat0 + (toLat - lat0) * a; render();
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  canvas.addEventListener('pointerdown', e => { cancelAnimationFrame(raf); canvas.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, lon, lat }; });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const k = 0.35 / zoom;
    lon = drag.lon - (e.clientX - drag.x) * k;
    lat = Math.max(-75, Math.min(75, drag.lat + (e.clientY - drag.y) * k));
    render();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 6], ArrowDown: [0, -6] }[e.key];
    if (!k) return; e.preventDefault(); cancelAnimationFrame(raf);
    lon += k[0] / zoom * 2; lat = Math.max(-75, Math.min(75, lat + k[1] / zoom * 2)); render();
  });
  resetBtn.addEventListener('click', () => {
    select(experiences.length - 1, false); fly(80, 18);
  });
  window.addEventListener('themechange', () => { col = colors(); render(); });
  window.addEventListener('resize', size);
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);

  select(selected, false);
  size();
  fetch(new URL('assets/land.geojson', document.baseURI))
    .then(r => { if (!r.ok) throw new Error('land'); return r.json(); })
    .then(data => { land = data; render(); })
    .catch(() => { statusEl.textContent = 'Map unavailable. All experience details remain available in the timeline.'; });
  if (!window.d3) statusEl.textContent = 'Map unavailable. All experience details remain available in the timeline.';
})();
