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
  searchIndex.forEach(item => {
    item._words = new Set(wordsOf(item.searchText));
    item._titleWords = new Set(wordsOf(item.title));
    item._subtitleWords = new Set(wordsOf(item.subtitle || ""));
    item._fuzzyWordList = [...item._words];
  });
}

// Plain alphanumeric tokens, stripped of punctuation — this keeps a short
// token like "is" from falsely substring-matching inside an unrelated word
// like "Isaiah", which raw string.includes() matching was doing before.
function wordsOf(text) {
  return text.toLowerCase().match(/[a-z0-9']+/g) || [];
}

/* ---------- Ranking: exact/substring matches score highest, then a small
   edit-distance fallback catches typos without turning search into noise. ---------- */
function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyTolerance(word) {
  if (word.length <= 3) return 0;
  if (word.length <= 6) return 1;
  return 2;
}

function fuzzyHit(words, token, tol) {
  return tol > 0 && words.some(w => Math.abs(w.length - token.length) <= tol && levenshtein(w, token) <= tol);
}

function scoreItem(item, tokens, rawQuery) {
  const title = item.title.toLowerCase();
  let score = 0;

  if (rawQuery && title === rawQuery) score += 40;
  else if (rawQuery && title.includes(rawQuery)) score += 20;

  for (const token of tokens) {
    if (item._titleWords.has(token)) { score += 8; continue; }
    if (item._subtitleWords.has(token)) { score += 4; continue; }
    if (item._words.has(token)) { score += 2; continue; }

    const tol = fuzzyTolerance(token);
    if (fuzzyHit(item._titleWords.size ? [...item._titleWords] : [], token, tol)) score += 3;
    else if (fuzzyHit(item._fuzzyWordList, token, tol)) score += 1;
  }
  return score;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, tokens, rawQuery) {
  const terms = [...new Set([rawQuery, ...tokens].filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return text.replace(re, "<mark>$1</mark>");
}

function renderResults(query) {
  const resultsEl = document.getElementById("search-results");
  const rawQuery = query.trim().toLowerCase();
  const tokens = wordsOf(rawQuery);

  let pool = searchIndex;
  if (activeFilter !== "all") pool = pool.filter(i => i.type === activeFilter);

  if (!rawQuery) {
    if (activeFilter === "all") {
      resultsEl.innerHTML = `<div class="no-results">Start typing to search verses, themes, people, places, books, and studies — or try a filter above.</div>`;
      return;
    }
    renderList(resultsEl, pool.slice(0, 40), [], "");
    return;
  }

  const scored = pool
    .map(item => ({ item, score: scoreItem(item, tokens, rawQuery) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);

  if (scored.length === 0) {
    resultsEl.innerHTML = `<div class="no-results">No results for "${query}". Try a different word, or browse <a href="quests.html" class="btn-ghost">Quests</a> / <a href="explorer.html" class="btn-ghost">Explorer</a>.</div>`;
    return;
  }

  renderList(resultsEl, scored.slice(0, 40), tokens, rawQuery);
}

function renderList(resultsEl, items, tokens, rawQuery) {
  resultsEl.innerHTML = items.map(item => `
    <a href="${item.href || '#'}" class="result-item reveal is-visible" style="display:block">
      <span class="result-kind">${item.type}</span>
      <h3>${highlight(item.title, tokens, rawQuery)}</h3>
      <p style="font-weight:600;color:var(--text-secondary);margin-bottom:6px">${highlight(item.subtitle || "", tokens, rawQuery)}</p>
      <p>${highlight(item.description, tokens, rawQuery)}</p>
    </a>
  `).join("");
}

function initFilters() {
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
      chip.classList.add("active");
      chip.setAttribute("aria-pressed", "true");
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
