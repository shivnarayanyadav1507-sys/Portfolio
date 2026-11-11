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
