/* ==========================================================================
   Prayers page
   ========================================================================== */

let allPrayers = [];
let allVerses = [];
let activeFilter = "all";

function renderPrayersGrid() {
  const grid = document.getElementById("prayers-grid");
  const items = activeFilter === "all" ? allPrayers : allPrayers.filter(p => p.category === activeFilter);

  grid.innerHTML = items.map(p => {
    const related = (p.relatedVerseIds || []).map(id => allVerses.find(v => v.id === id)).filter(Boolean);
    return `
      <div class="study-card reveal is-visible">
        <span class="eyebrow" style="margin-bottom:6px">${p.category}</span>
        <h3 style="font-size:1.1rem">${p.title}</h3>
        <p style="margin-bottom:14px;color:var(--text-tertiary);font-size:0.85rem">${p.occasion}</p>
        <div class="prayer-box">${p.text}</div>
        ${related.length ? `
          <div class="tag-row" style="margin-top:14px">
            ${related.map(v => `<a href="verse.html?id=${v.id}" class="tag">${v.reference}</a>`).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

function initFilters() {
  const chips = document.querySelectorAll("#prayer-filters .filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      renderPrayersGrid();
    });
  });
}

(async function init() {
  const [prayers, verses] = await Promise.all([DataStore.load("prayers"), DataStore.load("verses")]);
  allPrayers = prayers;
  allVerses = verses;
  initFilters();
  renderPrayersGrid();
  initScrollReveal();
})();
