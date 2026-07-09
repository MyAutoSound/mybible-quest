/* ==========================================================================
   Study detail page
   ========================================================================== */

async function init() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [studies, verses] = await Promise.all([DataStore.load("studies"), DataStore.load("verses")]);
  const study = studies.find(s => s.id === id) || studies[0];

  document.title = `${study.title} — MyBible.quest`;
  setPageMeta(study.summary);
  document.getElementById("study-head").innerHTML = `
    <span class="eyebrow">✦ ${study.category} · ${study.readingTimeMinutes} min read</span>
    <h2>${study.title}</h2>
    <p>${study.summary}</p>
  `;

  const sectionsHtml = study.sections.map(sec => `
    <div class="study-card reveal is-visible" style="margin-bottom:20px">
      <h3>${sec.heading}</h3>
      <p>${sec.body}</p>
    </div>
  `).join("");

  const relatedVerses = (study.relatedVerseIds || []).map(vid => verses.find(v => v.id === vid)).filter(Boolean);
  const relatedHtml = relatedVerses.length ? `
    <div class="study-card reveal is-visible" style="margin-bottom:20px">
      <h3>Read the full verse study</h3>
      <div class="tag-row">${relatedVerses.map(v => `<a href="verse.html?id=${v.id}" class="tag">${v.reference}</a>`).join("")}</div>
    </div>
  ` : "";

  document.getElementById("study-body").innerHTML = sectionsHtml + relatedHtml;
  initScrollReveal();
}

init();
