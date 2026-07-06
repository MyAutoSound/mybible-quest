/* ==========================================================================
   Reading Plan detail / day flow
   ========================================================================== */

let planState = { plan: null, dayIndex: 0 };

function renderPlanTracker() {
  const tracker = document.getElementById("step-tracker");
  tracker.innerHTML = planState.plan.days.map((_, i) => {
    let cls = "step-dot";
    if (i < planState.dayIndex) cls += " done";
    else if (i === planState.dayIndex) cls += " current";
    return `<div class="${cls}"></div>`;
  }).join("");
}

function renderDay() {
  const day = planState.plan.days[planState.dayIndex];
  const panel = document.getElementById("step-panel");
  const isLast = planState.dayIndex === planState.plan.days.length - 1;

  panel.innerHTML = `
    <div class="step-count">Day ${day.day} of ${planState.plan.durationDays}</div>
    <p class="verse-text">${day.verseText}</p>
    <span class="verse-ref">${day.reference}</span>
    <div class="reflection-box">
      <h4>Devotional</h4>
      <p>${day.devotional}</p>
    </div>
    <div class="step-nav">
      <button class="btn btn-secondary" id="prev-btn" ${planState.dayIndex === 0 ? "disabled style='opacity:.4;cursor:not-allowed'" : ""}>← Previous</button>
      <button class="btn btn-primary" id="next-btn">${isLast ? "Finish plan" : "Next day →"}</button>
    </div>
  `;

  document.getElementById("prev-btn").addEventListener("click", () => {
    if (planState.dayIndex > 0) {
      planState.dayIndex--;
      renderPlanTracker();
      renderDay();
    }
  });

  document.getElementById("next-btn").addEventListener("click", () => {
    if (isLast) {
      Store.setReadingPlanDay(planState.plan.id, planState.plan.durationDays, planState.plan.durationDays);
      showToast("Reading plan complete — +40 XP", "default");
      renderPlanComplete();
    } else {
      planState.dayIndex++;
      Store.setReadingPlanDay(planState.plan.id, planState.dayIndex, planState.plan.durationDays);
      renderPlanTracker();
      renderDay();
    }
    window.scrollTo({ top: document.getElementById("step-panel").offsetTop - 100, behavior: "smooth" });
  });

  renderPlanTracker();
}

function renderPlanComplete() {
  document.getElementById("step-tracker").innerHTML = planState.plan.days.map(() => `<div class="step-dot done"></div>`).join("");
  document.getElementById("step-panel").innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">${ICONS.check}</div>
      <h3 style="margin-bottom:12px">Plan complete</h3>
      <p style="max-width:420px;margin:0 auto 28px">You've finished "${planState.plan.title}".</p>
      <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
        <a href="quests.html" class="btn btn-primary">Choose another plan</a>
        <a href="profile.html" class="btn-ghost">View your badges →</a>
      </div>
    </div>
  `;
}

async function init() {
  const id = new URLSearchParams(window.location.search).get("id");
  const plans = await DataStore.load("reading-plans");
  const plan = plans.find(p => p.id === id) || plans[0];
  planState.plan = plan;

  document.title = `${plan.title} — MyBible.quest`;
  document.getElementById("plan-head").innerHTML = `
    <span class="eyebrow">✦ ${plan.tagline}</span>
    <h2>${plan.title}</h2>
    <p>${plan.description}</p>
  `;

  const progress = Store.getReadingPlanProgress(plan.id);
  planState.dayIndex = (!progress.completed && progress.day > 0 && progress.day < plan.days.length) ? progress.day : 0;

  if (progress.completed) renderPlanComplete();
  else renderDay();
}

init();
