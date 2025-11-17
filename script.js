// Update footer year
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Fake "theme toggle" (you can extend later)
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  let isAlt = false;
  themeToggle.addEventListener("click", () => {
    isAlt = !isAlt;
    themeToggle.textContent = isAlt ? "◎" : "⏺";
  });
}
