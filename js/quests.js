/* ==========================================================================
   Quests + Reading Plans list page
   ========================================================================== */

async function renderQuestsGrid() {
  const quests = await DataStore.load("quests");
  const grid = document.getElementById("quests-grid");

  grid.innerHTML = quests.map(q => {
    const p = Store.getQuestProgress(q.id);
    const pct = p.completed ? 100 : Math.round((p.step / q.steps.length) * 100);
    const label = p.completed ? "Completed" : (p.step > 0 ? `Step ${p.step + 1} of ${q.steps.length}` : `${q.steps.length} steps`);
    return `
      <div class="card quest-card reveal is-visible" id="${q.id}">
        <div class="card-icon ${q.color === 'gold' ? 'gold' : 'blue'}">${ICONS[q.icon] || ""}</div>
        <h3>${q.title}</h3>
        <p>${q.description}</p>
        <div class="quest-progress-bar"><span style="width:${pct}%"></span></div>
        <div class="quest-progress-label">${label}${p.completed ? " · +30 XP earned" : ""}</div>
        <div class="card-foot">
          <a href="quest.html?id=${q.id}" class="btn-ghost">${p.step > 0 && !p.completed ? "Continue" : "Begin"} →</a>
        </div>
      </div>
    `;
  }).join("");

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }
}

async function renderPlansGrid() {
  const plans = await DataStore.load("reading-plans");
  const grid = document.getElementById("plans-grid");

  grid.innerHTML = plans.map(plan => {
    const p = Store.getReadingPlanProgress(plan.id);
    const pct = p.completed ? 100 : Math.round((p.day / plan.durationDays) * 100);
    const label = p.completed ? "Completed" : (p.day > 0 ? `Day ${p.day + 1} of ${plan.durationDays}` : `${plan.durationDays} days`);
    return `
      <div class="card reveal is-visible">
        <div class="card-icon gold">${ICONS[plan.icon] || ICONS.book}</div>
        <h3>${plan.title}</h3>
        <p>${plan.description}</p>
        <div class="quest-progress-bar"><span style="width:${pct}%"></span></div>
        <div class="quest-progress-label">${label}</div>
        <div class="card-foot">
          <a href="reading-plan.html?id=${plan.id}" class="btn-ghost">${p.day > 0 && !p.completed ? "Continue" : "Begin"} →</a>
        </div>
      </div>
    `;
  }).join("");
}

function initModeToggle() {
  const tabs = document.querySelectorAll(".explorer-tab[data-mode]");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const mode = tab.dataset.mode;
      document.getElementById("mode-quests").style.display = mode === "quests" ? "" : "none";
      document.getElementById("mode-plans").style.display = mode === "plans" ? "" : "none";
    });
  });
}

(async function init() {
  initModeToggle();
  await Promise.all([renderQuestsGrid(), renderPlansGrid()]);
  initScrollReveal();
})();
