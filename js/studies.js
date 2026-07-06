/* ==========================================================================
   Studies list page
   ========================================================================== */

async function init() {
  const studies = await DataStore.load("studies");
  const grid = document.getElementById("studies-grid");
  grid.innerHTML = studies.map(s => `
    <a href="study.html?id=${s.id}" class="card reveal is-visible">
      <div class="card-icon gold">${ICONS.sparkle}</div>
      <span class="eyebrow" style="margin-bottom:8px">${s.category}</span>
      <h3>${s.title}</h3>
      <p>${s.summary}</p>
      <div class="meta-row"><span class="reading-time">${ICONS.clock} ${s.readingTimeMinutes} min read</span></div>
    </a>
  `).join("");
}

init();
