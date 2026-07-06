/* ==========================================================================
   Quest detail / step flow
   ========================================================================== */

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

let state = { quest: null, verses: null, stepIndex: 0 };

function renderTracker() {
  const tracker = document.getElementById("step-tracker");
  tracker.innerHTML = state.quest.steps.map((_, i) => {
    let cls = "step-dot";
    if (i < state.stepIndex) cls += " done";
    else if (i === state.stepIndex) cls += " current";
    return `<div class="${cls}"></div>`;
  }).join("");
}

function renderStep() {
  const step = state.quest.steps[state.stepIndex];
  const verse = state.verses.find(v => v.id === step.verseId);
  const panel = document.getElementById("step-panel");
  const isLast = state.stepIndex === state.quest.steps.length - 1;

  panel.innerHTML = `
    <div class="step-count">Step ${state.stepIndex + 1} of ${state.quest.steps.length}</div>
    <p class="verse-text">${verse.text}</p>
    <span class="verse-ref">${verse.reference} <a href="verse.html?id=${verse.id}" class="btn-ghost" style="font-size:0.8rem;margin-left:8px">Full study →</a></span>
    <div>
      <h4 style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:6px;">Context</h4>
      <p>${verse.context}</p>
    </div>
    <div class="reflection-box">
      <h4>Reflect</h4>
      <p>${step.reflection}</p>
    </div>
    <div class="step-nav">
      <button class="btn btn-secondary" id="prev-btn" ${state.stepIndex === 0 ? "disabled style='opacity:.4;cursor:not-allowed'" : ""}>← Previous</button>
      <button class="btn btn-primary" id="next-btn">${isLast ? "Finish quest" : "Next step →"}</button>
    </div>
  `;

  document.getElementById("prev-btn").addEventListener("click", () => {
    if (state.stepIndex > 0) {
      state.stepIndex--;
      renderTracker();
      renderStep();
      window.scrollTo({ top: document.getElementById("step-panel").offsetTop - 100, behavior: "smooth" });
    }
  });

  document.getElementById("next-btn").addEventListener("click", () => {
    if (isLast) {
      Store.completeQuest(state.quest.id);
      showToast("Quest complete — +30 XP", "default");
      renderComplete();
    } else {
      state.stepIndex++;
      Store.setQuestStep(state.quest.id, state.stepIndex);
      renderTracker();
      renderStep();
      window.scrollTo({ top: document.getElementById("step-panel").offsetTop - 100, behavior: "smooth" });
    }
  });

  renderTracker();
}

function renderComplete() {
  document.getElementById("step-tracker").innerHTML = state.quest.steps.map(() => `<div class="step-dot done"></div>`).join("");
  const panel = document.getElementById("step-panel");
  panel.innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">${ICONS.check}</div>
      <h3 style="margin-bottom:12px">Quest complete</h3>
      <p style="max-width:420px;margin:0 auto 28px">You've walked through all five verses in "${state.quest.title}". Come back anytime — the passages will still be here.</p>
      <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
        <button class="btn btn-secondary" id="restart-btn">Restart this quest</button>
        <a href="quests.html" class="btn btn-primary">Choose another quest</a>
        <a href="profile.html" class="btn-ghost">View your badges →</a>
      </div>
    </div>
  `;
  document.getElementById("restart-btn").addEventListener("click", () => {
    state.stepIndex = 0;
    Store.setQuestStep(state.quest.id, 0);
    renderStep();
  });
}

async function init() {
  const id = getQueryParam("id") || "anxiety";
  const [quests, verses] = await Promise.all([DataStore.load("quests"), DataStore.load("verses")]);
  const quest = quests.find(q => q.id === id) || quests[0];
  state.quest = quest;
  state.verses = verses;

  document.title = `${quest.title} — MyBible.quest`;
  document.getElementById("quest-tagline").textContent = quest.tagline;
  document.getElementById("quest-title").textContent = quest.title;
  document.getElementById("quest-description").textContent = quest.description;

  const progress = Store.getQuestProgress(quest.id);
  if (!progress.completed && progress.step > 0 && progress.step < quest.steps.length) {
    state.stepIndex = progress.step;
  } else {
    state.stepIndex = 0;
  }

  if (progress.completed) {
    renderComplete();
  } else {
    renderStep();
  }
}

init();
