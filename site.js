/* Shiv Narayan Yadav · portfolio interactions (no build step needed) */
(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- theme: OS preference first, then the visitor's saved choice ---------- */
  const toggles = [...document.querySelectorAll('.theme-toggle')];
  const meta = document.querySelector('meta[name="theme-color"]');
  function paintToggles() {
    const dark = root.dataset.theme === 'dark';
    toggles.forEach(input => { input.checked = dark; });
    if (meta) meta.content = dark ? '#12221b' : '#d8d5ca';
    window.dispatchEvent(new Event('themechange'));
  }
  toggles.forEach(input => input.addEventListener('change', () => {
    const next = input.checked ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('portfolio-theme', next); } catch (e) { /* storage blocked */ }
    paintToggles();
  }));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    let saved = null;
    try { saved = localStorage.getItem('portfolio-theme'); } catch (err) { /* ignore */ }
    if (!saved) { root.dataset.theme = e.matches ? 'dark' : 'light'; paintToggles(); }
  });
  paintToggles();

  /* ---------- active section in sidebar and dock ---------- */
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = [...new Set(navLinks.map(a => a.hash))].map(h => document.querySelector(h)).filter(Boolean);
  function setActive(id) { navLinks.forEach(a => a.setAttribute('aria-current', String(a.hash === '#' + id))); }
  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null, ratio = 0;
      seen.forEach((r, id) => { if (r > ratio) { ratio = r; best = id; } });
      if (best) setActive(best);
    }, { rootMargin: '-20% 0px -45% 0px', threshold: [0, .1, .25, .5, .75, 1] });
    sections.forEach(s => io.observe(s));
  }
  setActive('home');

  /* ---------- magnetic dock (fine pointers only; phones get plain icons) ---------- */
  const dock = document.querySelector('.dock');
  if (dock) {
    const items = [...dock.querySelectorAll('a')];
    const reset = () => items.forEach(a => { a.style.setProperty('--scale', 1); a.style.setProperty('--lift', '0px'); });
    dock.addEventListener('pointermove', e => {
      if (reduced.matches || e.pointerType !== 'mouse') return;
      items.forEach(a => {
        const r = a.getBoundingClientRect();
        const p = Math.max(0, 1 - Math.abs(e.clientX - r.left - r.width / 2) / 200);
        a.style.setProperty('--scale', String(1 + p * p * .6));
        a.style.setProperty('--lift', `${-p * 8}px`);
      });
    });
    dock.addEventListener('pointerleave', reset);
  }

  /* ---------- copy email ---------- */
  document.querySelectorAll('.copy-email').forEach(btn => btn.addEventListener('click', async () => {
    let msg;
    try { await navigator.clipboard.writeText('email2shivyadav@gmail.com'); msg = 'Email copied.'; }
    catch (e) { msg = 'Please copy the address: email2shivyadav@gmail.com'; }
    document.querySelectorAll('[data-copy-status]').forEach(s => { s.textContent = msg; });
    setTimeout(() => document.querySelectorAll('[data-copy-status]').forEach(s => { s.textContent = ''; }), 4000);
  }));

  /* ---------- social links: real URLs from site-config.js, otherwise "coming soon" ---------- */
  const socialStatus = document.getElementById('social-status');
  document.querySelectorAll('[data-social]').forEach(a => {
    const url = config.socials && config.socials[a.dataset.social];
    const name = a.textContent.trim();
    if (url && /^https:\/\//.test(url)) {
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', name);
    } else if (url && typeof url === 'string') {
      a.setAttribute('aria-label', `${name}: copy username ${url}`);
      a.addEventListener('click', async e => {
        e.preventDefault();
        let ok = true;
        try { await navigator.clipboard.writeText(url); } catch (err) { ok = false; }
        if (socialStatus) socialStatus.textContent = ok ? `${name} username “${url}” copied.` : `${name} username: ${url}`;
      });
    } else {
      a.setAttribute('aria-label', `${name}, profile coming soon`);
      a.addEventListener('click', e => { e.preventDefault(); if (socialStatus) socialStatus.textContent = `${name} profile link coming soon.`; });
    }
  });

  /* ---------- CV destination from site-config.js ---------- */
  if (config.cv) document.querySelectorAll('[data-cv]').forEach(a => { a.href = config.cv; });

  /* ---------- ID card tilt ---------- */
  const card = document.querySelector('.id-card');
  if (card) {
    card.addEventListener('pointermove', e => {
      if (reduced.matches || e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--tx', `${-(e.clientY - r.top - r.height / 2) / r.height * 8}deg`);
      card.style.setProperty('--ty', `${(e.clientX - r.left - r.width / 2) / r.width * 8}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--tx', '0deg'); card.style.setProperty('--ty', '0deg'); });
  }

  /* ---------- weather card (Open-Meteo, only after the visitor asks) ---------- */
  const wBtn = document.getElementById('weather-location');
  const wStatus = document.getElementById('weather-status');
  const wIcon = document.getElementById('weather-icon');
  const wCond = document.getElementById('weather-condition');
  const $w = id => document.getElementById(id);
  const codes = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Freezing fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Mid rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Snow showers',95:'Thunderstorm',96:'Storm, hail',99:'Storm, hail'};
  // icon parts taken from the card's own cloud artwork
  const cloudArt = '<path fill="#fff" d="M18.2 32.5c-.8 0-1.6-.1-2.4-.4c-3.1-1-5.3-3.9-5.3-7.2c0-2.2 1-4.3 2.6-5.7c.4-.4.9-.7 1.4-1l.5-1.8c1.3-4.4 5.4-7.5 10-7.5c.5 0 .9 0 1.5.1c.4.1.8.1 1.2.3l.2-.4c1.9-3.3 5.4-5.4 9.2-5.4C43 3.5 47.7 8.2 47.7 14v1c.4.2.9.4 1.3.6c2.8 1.6 4.5 4.6 4.5 7.8c0 4.2-2.9 7.8-7 8.8c-.7.2-1.4.2-2 .2H18.2z"/><path fill="#b6c1d1" d="M37.1 5c5 0 9 4 9 8.9v.7c-2.1.2-4 1-5.4 2.3c1.1-.6 2.4-1 3.7-1c.5 0 1 .1 1.5.1c.8.2 1.6.5 2.3.9c2.3 1.3 3.8 3.700 3.8 6.5c0 3.6-2.5 6.5-5.8 7.3c-.7.2-1.200.3-1.8.3H18.2c-.7 0-1.3-.1-1.9-.3c-2.4-.8-4.2-3.1-4.2-5.8c0-1.8.8-3.5 2.1-4.6c.6-.5 1.3-.9 2-1.2c.6-.2 1.3-.3 2-.3c2 0 3.7.9 4.9 2.4h.1c-1.3-2.4-3.7-4.1-6.6-4.3c1.1-3.7 4.5-6.4 8.5-6.4c.4 0 .9 0 1.3.1c.8.1 1.6.3 2.300.7c2.7 1.2 4.7 3.7 5.1 6.8V18c0-3.4-1.8-6.5-4.5-8.3C30.8 6.9 33.8 5 37.1 5m0-3C33 2 29.2 4.1 27 7.6h-.3c-.6-.1-1.2-.1-1.7-.1c-5.3 0-10 3.5-11.4 8.6l-.3 1.2c-.4.2-.7.5-1.1.8c-2 1.7-3.1 4.200-3.1 6.9c0 4 2.5 7.4 6.3 8.7c.9.3 1.9.5 2.9.5h26.2c.8 0 1.6-.1 2.4-.3c4.8-1.1 8.2-5.3 8.2-10.3c0-3.8-2-7.3-5.3-9.1c-.2-.1-.3-.2-.5-.3v-.1C49.2 7.4 43.8 2 37.1 2z"/>';
  const drops = '<g fill="#75d6ff"><path d="M10.8 42.9c-.5 1.5-.1 3 1 3.4c1.1.4 2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2.1 1.900-3.6 3.8-4.2 5.5"/><path d="M13.2 57.4c.6-1.8.7-4.1.2-6.9c-2.1 1.8-3.6 3.7-4.2 5.5c-.5 1.5-.1 3 1 3.4c1.1.4 2.5-.5 3-2"/><path d="M51.5 37.4c-2.1 1.8-3.6 3.7-4.2 5.5c-.5 1.5-.1 3 1 3.4c1.1.4 2.4-.5 3-2c.5-1.7.6-4.1.2-6.9"/><path d="M38.2 55.9c-.5 1.5-.1 3 1 3.4s2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2 1.9-3.5 3.8-4.2 5.5"/><path d="M46.9 55.9c-.5 1.5-.1 3 1 3.4s2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2.1 1.9-3.600 3.8-4.2 5.5"/><path d="M18.6 55.9c-.5 1.5-.1 3 1 3.4s2.4-.5 3-2c.6-1.8.7-4.1.2-6.9c-2.1 1.9-3.6 3.8-4.2 5.5"/></g>';
  const bolt = '<path fill="#ffce31" d="M24.5 31.9l-4.9 16.2h12.5L27.9 62l16.5-20.2H32.5l2.9-9.9z"/>';
  const sun = (cx, cy, r) => `<g fill="#ffce31"><circle cx="${cx}" cy="${cy}" r="${r}"/>${[0,45,90,135,180,225,270,315].map(a => `<rect x="${cx - 1.6}" y="${cy - r - 7}" width="3.2" height="5" rx="1.6" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}</g>`;
  const snow = '<g fill="#e8f4ff"><circle cx="18" cy="44" r="2.6"/><circle cx="32" cy="42" r="2.6"/><circle cx="46" cy="44" r="2.6"/><circle cx="25" cy="54" r="2.6"/><circle cx="39" cy="54" r="2.6"/></g>';
  const fog = '<g stroke="#d6dcf5" stroke-width="3.4" stroke-linecap="round"><path d="M12 42h40M8 50h46M16 58h32"/></g>';
  const art = {
    clear: sun(32, 32, 13),
    partly: sun(42, 18, 10) + `<g transform="translate(-2 14)">${cloudArt}</g>`,
    cloud: `<g transform="translate(0 12)">${cloudArt}</g>`,
    fog: `<g transform="translate(0 2)">${cloudArt}</g>` + fog,
    rain: cloudArt + drops,
    snow: cloudArt + snow,
    storm: cloudArt + drops + bolt
  };
  const kind = c => c === 0 || c === 1 ? 'clear' : c === 2 ? 'partly' : c === 3 ? 'cloud' : c <= 48 ? 'fog' : c <= 67 || (c >= 80 && c <= 82) ? 'rain' : c <= 86 ? 'snow' : 'storm';
  const setIcon = k => { if (wIcon) wIcon.innerHTML = `<svg viewBox="0 0 64 64">${art[k]}</svg>`; };
  // date and time: the visitor's own clock, or the place's time zone once weather has loaded
  let wZone;
  function tick() {
    const now = new Date(); const opt = wZone ? { timeZone: wZone } : {};
    try {
      $w('weather-date').textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...opt });
      const t = $w('weather-time');
      t.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', ...opt });
      t.dateTime = now.toISOString();
    } catch (e) { wZone = undefined; }
  }
  if ($w('weather-time')) { tick(); setInterval(tick, 15000); setIcon('partly'); }
  const refreshSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>';
  async function loadWeather(lat, lon, place) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 12000);
    try {
      const u = new URL('https://api.open-meteo.com/v1/forecast');
      u.search = new URLSearchParams({ latitude: lat.toFixed(2), longitude: lon.toFixed(2), current: 'temperature_2m,weather_code', daily: 'temperature_2m_max,temperature_2m_min', forecast_days: 1, timezone: 'auto' });
      const r = await fetch(u, { signal: abort.signal });
      if (!r.ok) throw new Error('bad response');
      const d = await r.json();
      if (!Number.isFinite(d.current && d.current.temperature_2m)) throw new Error('no data');
      const code = d.current.weather_code;
      $w('weather-temp').textContent = Math.round(d.current.temperature_2m) + '°';
      $w('weather-high').textContent = Math.round(d.daily.temperature_2m_max[0]);
      $w('weather-low').textContent = Math.round(d.daily.temperature_2m_min[0]);
      $w('weather-place').textContent = place;
      wCond.textContent = codes[code] || 'Now'; wCond.hidden = false;
      setIcon(kind(code));
      if (d.timezone && d.timezone !== 'GMT') { wZone = d.timezone; tick(); }
      wStatus.textContent = '';
      wBtn.classList.add('is-icon'); wBtn.innerHTML = refreshSvg; wBtn.setAttribute('aria-label', 'Refresh weather');
    } catch (e) {
      wStatus.textContent = 'Weather is unavailable right now.';
    } finally { clearTimeout(timer); wBtn.disabled = false; }
  }
  if (wBtn) {
    wBtn.addEventListener('click', () => {
      wBtn.disabled = true; wStatus.textContent = 'Loading weather…';
      if (config.weather) { loadWeather(config.weather.latitude, config.weather.longitude, config.weather.name); return; }
      if (!navigator.geolocation) { wStatus.textContent = 'Location is not available in this browser.'; wBtn.disabled = false; return; }
      navigator.geolocation.getCurrentPosition(
        p => loadWeather(p.coords.latitude, p.coords.longitude, 'Near you'),
        () => { wStatus.textContent = 'Location not shared.'; wBtn.disabled = false; },
        { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });
    if (config.weather) { wBtn.textContent = 'Show weather'; $w('weather-place').textContent = config.weather.name; }
  }

  /* ---------- project details dialog ---------- */
  const projects={
    meghalaya:{kicker:'RESTORATION & CARBON / EARTHTREE DATA SERVICES',title:'Regeneration Meghalaya',intro:'Geospatial analysis and operational workflows for an afforestation, reforestation and revegetation (ARR) project in Meghalaya.',question:'How can multi-temporal land-cover information, eligibility criteria and spatial quality checks support a consistent restoration project dataset?',contributions:['Performed eligibility area analysis using remote-sensing datasets, land-use history and spatial exclusions.','Managed ARR geodatabases and designed strata, grids and sampling plots.','Developed Python and Earth Engine scripts for attribute generation and other repeatable GIS tasks.','Led GIS analysts and coordinated with drone, forestry, community engagement, carbon accounting and audit teams.'],outputs:'Sampling frames, eligibility layers, QA/QC checks, verification maps, tabular data packs and spatial services.',tools:'QGIS · Google Earth Engine · Python · PostgreSQL / PostGIS · GeoServer',note:'Project focus: spatial eligibility, monitoring workflows and quality-controlled GIS deliverables.'},
    himalaya:{kicker:'CONSERVATION / WII–UNDP SECURE HIMALAYA',title:'Mapping conservation values',intro:'Spatial analysis to identify and delineate areas with high conservation values in the SECURE Himalaya landscape of Himachal Pradesh.',question:'Where are important conservation values located, and how can spatial evidence support landscape management recommendations?',contributions:['Processed survey and spatial datasets for GIS analysis.','Undertook land-use / land-cover analysis, species distribution modelling and HCV delineation.','Developed Python scripts and ModelBuilder tools to support geospatial workflows.','Prepared maps and supported coordination with government stakeholders, NGOs and local communities.'],outputs:'High conservation value maps, supporting GIS analyses and contributions to a technical report and management recommendations.',tools:'ArcGIS · QGIS · ERDAS Imagine · Google Earth Engine · Python · R',note:'A multidisciplinary conservation project combining spatial analysis, field information and stakeholder perspectives.'},
    assam:{kicker:'ECOSYSTEM SERVICES / IIFM · TEEB AGRIFOOD',title:'Land use, ecosystems & value',intro:'Climate data analysis and scenario-based forecasting of ecosystem services for the TEEBAgriFood Initiative in Assam.',question:'How do natural, produced, human and social capital change across four pathways: Business as Usual, Climate Smart Agriculture, Ecosystem based Adaptation and Landscape Transformation?',contributions:['Process UAV imagery and LiDAR point clouds into orthomosaics, DEMs/DSMs, canopy height models and vegetation indices, integrated with satellite and GIS data.','Develop, calibrate and validate biophysical and environmental models (DSSAT, SWAT, SWAT-CUP, InVEST) for ecosystem services, carbon dynamics, water and climate impacts under alternative scenarios.','Carbon storage assessment and MRV design, and policy instruments including Payment for Ecosystem Services and India’s Green Credit Program.','Support nature-positive value chain development for bamboo, Eri silk, Muga silk and other agrocommodities.'],outputs:'Spatial databases, thematic maps, scenario-based ecosystem-service assessments, technical reports, modelling protocols and policy briefs.',tools:'UAV & LiDAR processing · Python / R · DSSAT · SWAT / SWAT-CUP · InVEST',note:'Ongoing work as GIS Consultant with the Indian Institute of Forest Management, since August 2026.'},
    water:{kicker:'HYDROLOGY / IIRS · ACADEMIC DISSERTATION · 2018',title:'Exploring water futures',intro:'Assessment of climate-change impacts on the hydrological regime of a river basin, with a web portal to communicate simulated water-balance components.',question:'How can basin simulations be made easier to explore and interpret through a geospatial web interface?',contributions:['Collected data and set up a suitable hydrological model in a GIS environment.','Performed basin hydrological simulations to explore climate-change impacts.','Developed a web portal using HTML, CSS, JavaScript and Leaflet.','Implemented measurement, layer visibility, zoom and basin-information controls.'],outputs:'A dissertation workflow and a web-based visualization of simulated water-balance components.',tools:'SWAT · QGIS · HTML / CSS · JavaScript · Leaflet',note:'Academic dissertation project completed at the Indian Institute of Remote Sensing in 2018.'}
  };
  const dialog = document.getElementById('project-dialog');
  let opener = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.querySelectorAll('[data-project]').forEach(btn => btn.addEventListener('click', () => {
    const p = projects[btn.dataset.project];
    if (!p || !dialog) return;
    opener = btn;
    document.getElementById('dialog-kicker').textContent = p.kicker;
    document.getElementById('dialog-title').textContent = p.title;
    document.getElementById('dialog-intro').textContent = p.intro;
    document.getElementById('dialog-content').innerHTML =
      `<div class="dialog-grid"><div><h3>The question</h3><p>${esc(p.question)}</p><h3>Outputs &amp; purpose</h3><p>${esc(p.outputs)}</p><h3>Tools &amp; methods</h3><p>${esc(p.tools)}</p></div>` +
      `<div><h3>My contribution</h3><ul>${p.contributions.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div></div><p class="dialog-note">${esc(p.note)}</p>`;
    dialog.showModal(); dialog.scrollTop = 0; document.body.classList.add('dialog-open');
  }));
  if (dialog) {
    document.getElementById('close-project').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (opener) opener.focus({ preventScroll: true }); });
  }
  window.openProject = key => { const b = document.querySelector(`[data-project="${key}"]`); if (b) b.click(); };
})();
