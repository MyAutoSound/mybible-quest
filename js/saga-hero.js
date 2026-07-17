/* ==========================================================================
   Shared "Through the Bible" saga hero — renders into #saga-hero.
   Used on both index.html and quests.html. Depends on store.js, main.js
   (DataStore, ICONS) and mountain-trail.js (renderMountainTrail).
   ========================================================================== */

async function renderSagaHero() {
  const hero = document.getElementById("saga-hero");
  if (!hero) return;

  const [saga, quests] = await Promise.all([DataStore.load("saga"), DataStore.load("quests")]);
  const chapters = saga.chapterIds.map(id => quests.find(q => q.id === id)).filter(Boolean);
  const progress = chapters.map(c => Store.getQuestProgress(c.id));
  const firstUnfinished = progress.findIndex(p => !p.completed);
  const completed = firstUnfinished === -1;
  const activeIndex = completed ? chapters.length - 1 : firstUnfinished;
  const activeChapter = chapters[activeIndex];
  const started = progress[activeIndex].step > 0 || progress[activeIndex].completed;
  const ctaLabel = completed
    ? "Journey complete — revisit a chapter →"
    : started ? `Continue: ${activeChapter.title} →` : "Begin the journey →";

  hero.innerHTML = `
    <div class="section-head center reveal is-visible" style="margin-bottom:24px;margin-left:auto;margin-right:auto">
      <span class="eyebrow">✦ The Main Quest</span>
      <h2>${saga.title}</h2>
      <p>${saga.description}</p>
    </div>
    <div class="trail-card" id="saga-trail"></div>
    <div class="card-foot" style="justify-content:center;padding-top:4px">
      <a href="quest.html?id=${activeChapter.id}" class="btn btn-primary">${ctaLabel}</a>
    </div>
  `;

  renderMountainTrail(document.getElementById("saga-trail"), {
    totalSteps: chapters.length,
    currentIndex: activeIndex,
    completed,
    unitLabel: "Chapter",
    onSelect: (i) => { window.location.href = `quest.html?id=${chapters[i].id}`; },
  });
}
