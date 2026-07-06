/* ==========================================================================
   Person detail page
   ========================================================================== */

async function init() {
  const id = new URLSearchParams(window.location.search).get("id") || "moses";
  const [people, places, verses] = await Promise.all([
    DataStore.load("people"), DataStore.load("places"), DataStore.load("verses")
  ]);
  const person = people.find(p => p.id === id) || people[0];

  document.title = `${person.name} — MyBible.quest`;
  document.getElementById("person-head").innerHTML = `
    <span class="eyebrow">✦ ${person.role}</span>
    <h2>${person.name}</h2>
  `;

  const visitedPlaces = (person.placesVisited || []).map(pid => places.find(p => p.id === pid)).filter(Boolean);
  const keyVerses = (person.keyVerseIds || []).map(vid => verses.find(v => v.id === vid)).filter(Boolean);

  document.getElementById("person-layout").innerHTML = `
    <div class="study-main">
      <div class="study-card reveal is-visible">
        <h3>Overview</h3>
        <p style="margin-bottom:14px">${person.description}</p>
        <p><strong>Why they matter:</strong> ${person.importance}</p>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Life timeline</h3>
        <div class="timeline" style="padding-left:26px">
          ${person.timeline.map(t => `
            <div class="timeline-item">
              <div class="era">${t.era}</div>
              <p>${t.text}</p>
            </div>
          `).join("")}
        </div>
      </div>

      ${keyVerses.length ? `
        <div class="study-card reveal is-visible">
          <h3>Key verses</h3>
          <div class="tag-row">${keyVerses.map(v => `<a href="verse.html?id=${v.id}" class="tag">${v.reference}</a>`).join("")}</div>
        </div>
      ` : ""}
    </div>

    <div class="study-side">
      <div class="study-card reveal is-visible">
        <h3>At a glance</h3>
        <div class="study-meta-row" style="grid-template-columns:1fr">
          <div><div class="label">Born</div>${person.born}</div>
          <div><div class="label">Associated books</div>${person.books.join(", ")}</div>
        </div>
      </div>

      ${person.relations.length ? `
        <div class="study-card reveal is-visible">
          <h3>Family &amp; relationships</h3>
          <div class="relations-list">
            ${person.relations.map(r => `<span class="relation-chip"><strong>${r.name}</strong> — ${r.relation}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      ${visitedPlaces.length ? `
        <div class="study-card reveal is-visible">
          <h3>Places visited</h3>
          <div class="tag-row">${visitedPlaces.map(p => `<a href="explorer.html#map" class="tag">${p.name}</a>`).join("")}</div>
        </div>
      ` : ""}
    </div>
  `;
  initScrollReveal();
}

init();
