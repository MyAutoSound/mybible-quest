/* ==========================================================================
   Search page
   ========================================================================== */

let searchIndex = [];
let activeFilter = "all";

function buildThemeIndex(verses) {
  const map = {};
  verses.forEach(v => {
    v.themes.forEach(t => {
      if (!map[t]) map[t] = [];
      map[t].push(v.reference);
    });
  });
  return Object.keys(map).sort().map(theme => ({
    type: "theme",
    title: theme.charAt(0).toUpperCase() + theme.slice(1),
    subtitle: `${map[theme].length} verse${map[theme].length > 1 ? "s" : ""}`,
    description: `Appears in ${map[theme].join(", ")}.`,
    searchText: theme,
  }));
}

async function buildIndex() {
  const [verses, people, places, books, studies] = await Promise.all([
    DataStore.load("verses"), DataStore.load("people"), DataStore.load("places"),
    DataStore.load("books"), DataStore.load("studies"),
  ]);

  const verseItems = verses.map(v => ({
    type: "verse",
    title: v.reference,
    subtitle: v.themes.join(" · "),
    description: `${v.text} — ${v.context}`,
    href: `verse.html?id=${v.id}`,
    searchText: [v.reference, v.text, v.context, v.importance, ...v.themes, ...v.emotions].join(" ").toLowerCase(),
  }));

  const themeItems = buildThemeIndex(verses).map(t => ({
    ...t, searchText: t.searchText.toLowerCase() + " " + t.description.toLowerCase()
  }));

  const personItems = people.map(p => ({
    type: "person",
    title: p.name,
    subtitle: p.role,
    description: `${p.description} Associated books: ${p.books.join(", ")}.`,
    href: `person.html?id=${p.id}`,
    searchText: [p.name, p.role, p.description, ...p.books].join(" ").toLowerCase(),
  }));

  const placeItems = places.map(p => ({
    type: "place",
    title: p.name,
    subtitle: p.modern,
    description: p.description,
    href: `explorer.html#map`,
    searchText: [p.name, p.modern, p.description].join(" ").toLowerCase(),
  }));

  const bookItems = books.map(b => ({
    type: "book",
    title: b.title,
    subtitle: `${b.testament === "old" ? "Old Testament" : "New Testament"} · ${b.category}`,
    description: b.purpose,
    href: `book.html?id=${b.id}`,
    searchText: [b.title, b.category, b.purpose, b.historicalContext, ...b.themes].join(" ").toLowerCase(),
  }));

  const studyItems = studies.map(s => ({
    type: "study",
    title: s.title,
    subtitle: s.category,
    description: s.summary,
    href: `study.html?id=${s.id}`,
    searchText: [s.title, s.category, s.summary].join(" ").toLowerCase(),
  }));

  searchIndex = [...verseItems, ...themeItems, ...personItems, ...placeItems, ...bookItems, ...studyItems];
}

function renderResults(query) {
  const resultsEl = document.getElementById("search-results");
  const q = query.trim().toLowerCase();

  let matches = searchIndex;
  if (activeFilter !== "all") matches = matches.filter(i => i.type === activeFilter);
  if (q) matches = matches.filter(i => i.searchText.includes(q));

  if (!q && activeFilter === "all") {
    resultsEl.innerHTML = `<div class="no-results">Start typing to search verses, themes, people, places, books, and studies — or try a filter above.</div>`;
    return;
  }

  if (matches.length === 0) {
    resultsEl.innerHTML = `<div class="no-results">No results for "${query}". Try a different word, or browse <a href="quests.html" class="btn-ghost">Quests</a> / <a href="explorer.html" class="btn-ghost">Explorer</a>.</div>`;
    return;
  }

  resultsEl.innerHTML = matches.slice(0, 40).map(item => `
    <a href="${item.href || '#'}" class="result-item reveal is-visible" style="display:block">
      <span class="result-kind">${item.type}</span>
      <h3>${item.title}</h3>
      <p style="font-weight:600;color:var(--text-secondary);margin-bottom:6px">${item.subtitle}</p>
      <p>${item.description}</p>
    </a>
  `).join("");
}

function initFilters() {
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      renderResults(document.getElementById("search-input").value);
    });
  });
}

function initSearchInput() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", () => renderResults(input.value));

  const urlQuery = new URLSearchParams(window.location.search).get("q");
  if (urlQuery) {
    input.value = urlQuery;
  }
  renderResults(input.value);
}

(async function init() {
  document.getElementById("search-icon").innerHTML = ICONS.search;
  await buildIndex();
  initFilters();
  initSearchInput();
})();
