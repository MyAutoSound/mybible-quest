/* ==========================================================================
   Study detail page
   ========================================================================== */

async function init() {
  const id = new URLSearchParams(window.location.search).get("id");
  const studies = await DataStore.load("studies");
  const study = studies.find(s => s.id === id) || studies[0];

  document.title = `${study.title} — MyBible.quest`;
  document.getElementById("study-head").innerHTML = `
    <span class="eyebrow">✦ ${study.category} · ${study.readingTimeMinutes} min read</span>
    <h2>${study.title}</h2>
    <p>${study.summary}</p>
  `;

  document.getElementById("study-body").innerHTML = study.sections.map(sec => `
    <div class="study-card reveal is-visible" style="margin-bottom:20px">
      <h3>${sec.heading}</h3>
      <p>${sec.body}</p>
    </div>
  `).join("");
  initScrollReveal();
}

init();
