// ---------- BASIC UTILITIES ----------
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const themeToggle = document.getElementById("themeToggle");
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ---------- THEME TOGGLE ----------
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark") {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
  } else if (storedTheme === "light") {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
  }

  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-theme");
      body.classList.toggle("light-theme");

      const current =
        body.classList.contains("dark-theme") ? "dark" : "light";
      localStorage.setItem("theme", current);
      updateThemeIcon();
    });
  }

  function updateThemeIcon() {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector("i");
    if (!icon) return;
    if (body.classList.contains("dark-theme")) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  }

  // ---------- SCROLL TO TOP ----------
  window.addEventListener("scroll", () => {
    if (window.scrollY > 240) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---------- LEAFLET MAP BACKGROUND ----------
  initLeafletBackground();

  // ---------- GITHUB REPOS ----------
  loadGitHubRepos();

  // ---------- 3D GLOBE ----------
  initGlobe();
});

// ========== LEAFLET BACKGROUND MAP ==========
function initLeafletBackground() {
  if (typeof L === "undefined") return;

  const map = L.map("map-bg", {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
  });

  // Center roughly over Himalaya / India
  map.setView([30.0, 78.0], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(map);

  // Gentle drifting animation
  let direction = 1;
  setInterval(() => {
    map.panBy([20 * direction, 4 * direction], {
      animate: true,
      duration: 4,
    });
    direction *= -1;
  }, 8000);
}

// ========== GITHUB REPOS AUTO-LOAD ==========
async function loadGitHubRepos() {
  const container = document.getElementById("repo-list");
  if (!container) return;

  // ✅ Your actual GitHub username
  const GITHUB_USERNAME = "shivnarayanyadav1507-sys";

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
    );

    if (!res.ok) throw new Error("GitHub API error");

    const repos = await res.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      container.innerHTML =
        '<div class="loading">No repositories found for this username.</div>';
      return;
    }

    container.innerHTML = "";
    repos.forEach((repo) => {
      const card = document.createElement("article");
      card.className = "card";

      const topics = (repo.topics || []).slice(0, 3);

      card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description provided."}</p>
        <a class="card-link" href="${repo.html_url}" target="_blank" rel="noopener">
          View on GitHub
        </a>
        <div class="repo-meta">
          <span><i class="fas fa-code-branch"></i> ${repo.language || "Mixed"}</span>
          <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
          <span><i class="fas fa-clock"></i> ${new Date(
            repo.updated_at
          ).toLocaleDateString()}</span>
        </div>
        ${
          topics.length
            ? `<div class="pill-row" style="margin-top:0.5rem;">
                ${topics
                  .map((t) => `<span class="pill">${t}</span>`)
                  .join("")}
               </div>`
            : ""
        }
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="loading">Unable to load repositories. Please check your internet connection.</div>';
  }
}

// ========== THREE.JS 3D GLOBE ==========
function initGlobe() {
  if (typeof THREE === "undefined") return;

  const canvas = document.getElementById("globe-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0x000000, 0); // transparent so your gradient shows

  const globeContainer = canvas.parentElement;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 3.2);

  function resizeRenderer() {
    const rect = globeContainer.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;

    if (!width || !height) {
      width = 400;
      height = 260; // fallback
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(3, 3, 5);
  scene.add(dirLight);

  // Globe geometry + basic material (always visible)
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = new THREE.MeshPhongMaterial({
    color: 0x1f2937, // fallback dark blue/grey Earth
    shininess: 15,
  });
  const globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  // Try to load an Earth texture (with CORS-friendly URL)
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const textureUrl =
    "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg";

  loader.load(
    textureUrl,
    (texture) => {
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    (err) => {
      console.error("Failed to load globe texture, using solid color instead.", err);
    }
  );

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.002;
    renderer.render(scene, camera);
  }

  // Resize & start
  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();
  animate();
}
