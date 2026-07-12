/* ==========================================================================
   Bible Context Explorer — map (with routes), timeline, books, people, archaeology
   ========================================================================== */

let activeRouteId = null;
let placesCache = [];

function activateTab(target) {
  const tabs = document.querySelectorAll(".explorer-tab");
  const tab = [...tabs].find(t => t.dataset.tab === target);
  if (!tab) return;
  tabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  ["map", "timeline", "books", "people", "archaeology"].forEach(key => {
    document.getElementById(`panel-${key}`).style.display = key === target ? "" : "none";
  });
  if (typeof Store !== "undefined") Store.recordExplorerTabVisit(target);
}

function initTabs() {
  const tabs = document.querySelectorAll(".explorer-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });
  const hashTarget = window.location.hash.replace("#", "");
  const validTargets = ["map", "timeline", "books", "people", "archaeology"];
  activateTab(validTargets.includes(hashTarget) ? hashTarget : "map");
}

function drawRoutes(routes) {
  const wrap = document.getElementById("map-wrap");
  let svg = wrap.querySelector(".map-routes-svg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "map-routes-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    wrap.prepend(svg);
  }
  svg.innerHTML = "";
  if (!activeRouteId) return;

  const route = routes.find(r => r.id === activeRouteId);
  if (!route) return;

  const points = route.waypoints
    .map(w => placesCache.find(p => p.id === w.placeId))
    .filter(Boolean)
    .map(p => `${p.x},${p.y}`)
    .join(" ");

  const colorVar = route.color === "gold" ? "var(--gold)" : "var(--accent)";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  path.setAttribute("points", points);
  path.setAttribute("class", "map-route-path");
  path.setAttribute("stroke", colorVar);
  path.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(path);
}

async function renderMap() {
  const [places, verses, routes] = await Promise.all([
    DataStore.load("places"), DataStore.load("verses"), DataStore.load("map-routes")
  ]);
  placesCache = places;
  const wrap = document.getElementById("map-wrap");

  const geoSvg = `
    <svg class="map-geo-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path class="map-sea" d="M 0,10 L 10,8 L 18,14 L 26,20 L 33,24 L 40,27 L 44,32 L 45,45 L 43,55 L 38,60 L 30,63 L 20,60 L 10,50 L 0,35 Z" vector-effect="non-scaling-stroke"/>
      <path class="map-sea map-red-sea" d="M 30,72 L 38,72 L 36,90 L 32,90 Z" vector-effect="non-scaling-stroke"/>
      <path class="map-river" d="M 24,63 L 20,95" vector-effect="non-scaling-stroke"/>
      <path class="map-river" d="M 51,38 L 52,47 L 53,58" vector-effect="non-scaling-stroke"/>
    </svg>
  `;

  const pinsHtml = places.map(p => `
    <div class="map-pin" style="left:${p.x}%; top:${p.y}%;" data-id="${p.id}" title="${p.name}" tabindex="0" role="button" aria-label="${p.name}">
      <span class="map-pin-label">${p.name}</span>
    </div>
  `).join("");
  wrap.innerHTML = geoSvg + pinsHtml;

  // Layer toggle buttons
  const toggles = document.getElementById("map-layer-toggles");
  toggles.innerHTML = routes.map(r => `
    <button class="layer-btn" data-route="${r.id}"><span class="swatch" style="background:var(--${r.color === 'gold' ? 'gold' : 'accent'})"></span>${r.label}</button>
  `).join("");
  toggles.querySelectorAll(".layer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const clickedId = btn.dataset.route;
      const wasActive = activeRouteId === clickedId;
      activeRouteId = wasActive ? null : clickedId;
      toggles.querySelectorAll(".layer-btn").forEach(b => b.classList.remove("active"));
      if (!wasActive) btn.classList.add("active");
      drawRoutes(routes);
      if (!wasActive) {
        const route = routes.find(r => r.id === clickedId);
        document.getElementById("place-detail").innerHTML = `
          <h3>${route.label}</h3>
          <p>${route.description}</p>
          <div style="margin-top:14px; display:flex; flex-direction:column; gap:8px;">
            ${route.waypoints.map((w, i) => {
              const place = places.find(pl => pl.id === w.placeId);
              return `<div style="font-size:0.88rem"><strong>${i + 1}. ${place ? place.name : w.placeId}</strong> — ${w.note}</div>`;
            }).join("")}
          </div>
        `;
      }
    });
  });

  const detailBox = document.getElementById("place-detail");

  function showPlace(place) {
    const verseRefs = (place.relatedVerses || []).map(id => verses.find(v => v.id === id)).filter(Boolean);
    detailBox.innerHTML = `
      <h3>${place.name}</h3>
      <div class="modern-loc">📍 ${place.modern}</div>
      <p>${place.description}</p>
      ${verseRefs.length ? `
        <div style="margin-top:18px">
          <h4 style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:8px;">Related verses</h4>
          <div class="tag-row">${verseRefs.map(v => `<a href="verse.html?id=${v.id}" class="tag">${v.reference}</a>`).join("")}</div>
        </div>
      ` : ""}
    `;
  }

  function selectPin(pin) {
    wrap.querySelectorAll(".map-pin").forEach(p => p.classList.remove("active"));
    pin.classList.add("active");
    const place = places.find(p => p.id === pin.dataset.id);
    showPlace(place);
    if (typeof Store !== "undefined") Store.recordMapPlaceClick(place.id);
  }

  wrap.querySelectorAll(".map-pin").forEach(pin => {
    pin.addEventListener("click", () => selectPin(pin));
    pin.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPin(pin); } });
  });

  if (places.length) {
    wrap.querySelector(".map-pin")?.classList.add("active");
    showPlace(places[0]);
  }
}

const TIMELINE_CATEGORIES = [
  { key: "all", label: "All" }, { key: "creation", label: "Creation" }, { key: "patriarchs", label: "Patriarchs" },
  { key: "exodus", label: "Exodus" }, { key: "judges", label: "Judges" }, { key: "kings", label: "Kings" },
  { key: "exile", label: "Exile" }, { key: "return", label: "Return" }, { key: "jesus", label: "Jesus" },
  { key: "early-church", label: "Early Church" },
];

function timelineSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function yearLabel(year) {
  if (year < 0) return `${Math.abs(year)} BC`;
  return year === 0 ? "AD 1" : `AD ${year}`;
}

function renderTimelineScale(events, onJump) {
  const dated = events.filter(e => typeof e.yearApprox === "number").sort((a, b) => a.yearApprox - b.yearApprox);
  const minYear = dated[0].yearApprox;
  const maxYear = dated[dated.length - 1].yearApprox;
  const span = maxYear - minYear;
  const pct = (y) => ((y - minYear) / span) * 100;

  // Gridlines close to the last one are dropped so labels never collide.
  const gridYears = [-2000, -1500, -1000, -500, 0].filter(y => y >= minYear && y <= maxYear - span * 0.04);
  const gridlinesHtml = gridYears.map(y => `
    <div class="scale-gridline" style="left:${pct(y)}%"><span>${yearLabel(y)}</span></div>
  `).join("");

  // Events close together in time (relative to the full span) are stacked
  // downward in a small cascade so nearby dots stay individually clickable.
  let lastPct = -Infinity;
  let stack = 0;
  const dotsHtml = dated.map(e => {
    const p = pct(e.yearApprox);
    stack = (p - lastPct < 1.5) ? stack + 1 : 0;
    lastPct = p;
    const top = -8 + stack * 9;
    return `<button type="button" class="scale-dot ${e.highlight ? "highlight" : ""}" style="left:${p}%; top:${top}px" data-target="${timelineSlug(e.title)}" title="${e.era} — ${e.title}"></button>`;
  }).join("");

  const scaleEl = document.getElementById("timeline-scale");
  scaleEl.innerHTML = `
    <div class="scale-creation-marker">✦ Creation — outside the dated scale below</div>
    <div class="scale-track">${gridlinesHtml}${dotsHtml}</div>
  `;

  scaleEl.querySelectorAll(".scale-dot").forEach(dot => {
    dot.addEventListener("click", () => onJump(dot.dataset.target));
  });
}

async function renderTimeline() {
  const events = await DataStore.load("timeline");
  const list = document.getElementById("timeline-list");
  const filters = document.getElementById("timeline-filters");

  filters.innerHTML = TIMELINE_CATEGORIES.map((c, i) => `<span class="filter-chip ${i === 0 ? "active" : ""}" data-cat="${c.key}">${c.label}</span>`).join("");

  function renderList(cat) {
    const filtered = cat === "all" ? events : events.filter(e => e.category === cat);
    list.innerHTML = filtered.map(e => `
      <div class="timeline-item ${e.highlight ? "highlight" : ""}" id="${timelineSlug(e.title)}">
        <div class="era">${e.era}</div>
        <h3>${e.title}</h3>
        <p>${e.description}</p>
      </div>
    `).join("") || `<p style="color:var(--text-tertiary)">No events in this category.</p>`;
  }

  function jumpToEvent(targetId) {
    filters.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    filters.querySelector('[data-cat="all"]').classList.add("active");
    renderList("all");
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("pulse");
    setTimeout(() => target.classList.remove("pulse"), 1200);
  }

  filters.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      filters.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderList(chip.dataset.cat);
    });
  });

  renderTimelineScale(events, jumpToEvent);
  renderList("all");
}

async function renderBooks() {
  const books = await DataStore.load("books");
  const grid = document.getElementById("books-grid");
  grid.innerHTML = books.map(b => `
    <a href="book.html?id=${b.id}" class="card reveal is-visible">
      <div class="card-icon ${b.testament === "old" ? "blue" : "gold"}">${ICONS.book}</div>
      <h3>${b.title}</h3>
      <p>${b.summary || b.purpose}</p>
      <div class="meta-row">
        <span class="tag">${b.testament === "old" ? "Old Testament" : "New Testament"}</span>
        <span class="reading-time">${ICONS.clock} ${b.readingTimeMinutes} min read</span>
      </div>
    </a>
  `).join("");
}

async function renderPeople() {
  const people = await DataStore.load("people");
  const grid = document.getElementById("people-grid");
  grid.innerHTML = people.map(p => `
    <a href="person.html?id=${p.id}" class="person-card reveal is-visible">
      <div class="person-avatar">${p.name.charAt(0)}</div>
      <div class="person-info">
        <div class="role">${p.role}</div>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="person-books">Associated books: ${p.books.join(", ")}</div>
      </div>
    </a>
  `).join("");
}

async function renderArchaeology() {
  const items = await DataStore.load("archaeology");
  const grid = document.getElementById("archaeology-grid");
  grid.innerHTML = items.map(a => `
    <div class="artifact-card reveal is-visible">
      <div class="artifact-photo">
        <img src="${a.imageUrl}" alt="${a.imageAlt}" loading="lazy">
        <span class="artifact-consensus">${a.consensusLevel}</span>
      </div>
      <div class="artifact-body">
        <div class="artifact-meta">${a.era} · ${a.location}</div>
        <h3>${a.name}</h3>
        <p>${a.description}</p>
        <div class="artifact-significance"><strong>Why it matters:</strong> ${a.significance}</div>
        <div class="artifact-credit">${a.imageCredit}</div>
      </div>
    </div>
  `).join("");
}

(async function init() {
  initTabs();
  await Promise.all([renderMap(), renderTimeline(), renderBooks(), renderPeople(), renderArchaeology()]);
  initScrollReveal();
})();
