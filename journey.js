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
  const zoomBtn = document.getElementById('globe-zoom');
  const resetBtn = document.getElementById('globe-reset');
  if (!list || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const CLOSE = 2.6, WORLD = 1;
  let selected = 5, lon = 88, lat = 25, zoom = CLOSE, land = null, w = 0, h = 0, drag = null, raf = 0;
  const ctx = canvas.getContext('2d');

  /* ----- timeline ----- */
  const short = y => '’' + y.slice(2);
  list.innerHTML = experiences.map((e, i) => `
    <li class="tl-item" data-i="${i}">
      <button class="tl-btn" type="button" aria-expanded="false" aria-controls="tl-detail-${i}">
        <span class="tl-year">${short(e.year)}</span>
        <span class="tl-title"><b>${e.title}</b><span>${e.org === e.title ? e.place : e.org + ' · ' + e.place}</span></span>
      </button>
      <div class="tl-detail" id="tl-detail-${i}">
        <span class="tl-when">${e.when}</span>
        <p>${e.text}</p>
        ${e.link ? `<button type="button" class="btn btn-sm" data-open-project="${e.link}">View related project</button>` : ''}
      </div>
    </li>`).join('');
  list.addEventListener('click', ev => {
    const proj = ev.target.closest('[data-open-project]');
    if (proj) { if (window.openProject) window.openProject(proj.dataset.openProject); return; }
    const btn = ev.target.closest('.tl-btn');
    if (btn) select(Number(btn.parentElement.dataset.i), true);
  });
  function select(i, move) {
    selected = i;
    list.querySelectorAll('.tl-item').forEach((li, j) => {
      li.classList.toggle('is-open', i === j);
      li.querySelector('.tl-btn').setAttribute('aria-expanded', String(i === j));
    });
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
    const order = experiences.map((e, i) => i).sort((a, b) => (a === selected) - (b === selected));
    order.forEach(i => {
      const e = experiences[i];
      if (d3.geoDistance([e.lon, e.lat], [lon, lat]) > Math.PI / 2) return;
      const [x, y] = proj([e.lon, e.lat]);
      const on = i === selected;
      ctx.beginPath(); ctx.arc(x, y, on ? 9 : 5.5, 0, Math.PI * 2);
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
  zoomBtn.addEventListener('click', () => {
    zoom = zoom === CLOSE ? WORLD : CLOSE;
    zoomBtn.textContent = zoom === CLOSE ? 'World view' : 'Closer view';
    zoomBtn.setAttribute('aria-pressed', String(zoom === CLOSE));
    const e = experiences[selected]; fly(e.lon, e.lat);
  });
  resetBtn.addEventListener('click', () => {
    zoom = CLOSE; zoomBtn.textContent = 'World view'; zoomBtn.setAttribute('aria-pressed', 'true');
    select(5, false); fly(88, 25);
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
