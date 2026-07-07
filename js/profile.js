/* ==========================================================================
   Profile / Community page
   ========================================================================== */

function renderLevelCard() {
  const { level, xp, floor, ceiling, pct } = Store.getLevelProgress();
  document.getElementById("level-card").innerHTML = `
    <div style="text-align:center">
      <div class="level-ring-value">Lv ${level}</div>
    </div>
    <div style="flex:1">
      <div class="flex-between" style="margin-bottom:8px">
        <strong style="font-size:0.9rem">${xp} XP total</strong>
        <span style="font-size:0.8rem;color:var(--text-tertiary)">${ceiling - xp > 0 ? `${ceiling - xp} XP to level ${level + 1}` : "Max level"}</span>
      </div>
      <div class="xp-bar"><span style="width:${pct}%"></span></div>
    </div>
  `;
}

function renderProfileJourney() {
  const { level } = Store.getLevelProgress();
  renderJourneyTrail(document.getElementById("journey-trail"), { level, maxLevel: XP_LEVELS.length });
}

function renderStats() {
  const s = Store.getStats();
  const items = [
    { value: s.streak, label: "Day streak" },
    { value: `${s.questsCompleted}/${s.totalQuests}`, label: "Quests done" },
    { value: s.favoritesCount, label: "Favorites" },
    { value: s.notesCount, label: "Notes" },
    { value: s.badgesCount, label: "Badges" },
    { value: s.verseStudiesOpened, label: "Verses studied" },
    { value: s.mapPlacesVisited, label: "Places explored" },
    { value: s.highlightsCount, label: "Highlights" },
  ];
  document.getElementById("stats-grid").innerHTML = items.map(i => `
    <div class="stat-card"><strong>${i.value}</strong><span>${i.label}</span></div>
  `).join("");
}

async function renderBadges() {
  const badges = await DataStore.load("badges");
  const unlocked = Store.getBadges();
  document.getElementById("badge-grid").innerHTML = badges.map(b => {
    const isUnlocked = unlocked.includes(b.id);
    if (!isUnlocked) {
      return `
        <div class="badge-card locked mystery">
          <div class="badge-icon">?</div>
          <h4>Unknown badge</h4>
          <p>Keep going — you'll find out.</p>
        </div>
      `;
    }
    return `
      <div class="badge-card">
        <div class="badge-icon">${ICONS[b.icon] || ICONS.star}</div>
        <h4>${b.name}</h4>
        <p>${b.description}</p>
      </div>
    `;
  }).join("");
}

async function renderFavorites() {
  const verses = await DataStore.load("verses");
  const favIds = Store.getFavorites();
  const list = document.getElementById("favorites-list");
  if (!favIds.length) {
    list.innerHTML = `<p style="color:var(--text-tertiary);font-size:0.9rem">No favorites yet — open any verse study and tap "Favorite."</p>`;
    return;
  }
  list.innerHTML = favIds.map(id => {
    const v = verses.find(vv => vv.id === id);
    if (!v) return "";
    return `
      <a href="verse.html?id=${v.id}" class="result-item" style="display:block;margin-bottom:12px">
        <span class="result-kind">verse</span>
        <h3>${v.reference}</h3>
        <p>${v.text}</p>
      </a>
    `;
  }).join("");
}

function renderNotes() {
  const notes = Store.getAllNotes();
  const list = document.getElementById("notes-list-profile");
  if (!notes.length) {
    list.innerHTML = `<p style="color:var(--text-tertiary);font-size:0.9rem">No notes yet — write one from any verse study page.</p>`;
    return;
  }
  list.innerHTML = notes.slice().reverse().map(n => `
    <a href="verse.html?id=${n.verseId}" class="note-item" style="display:block;margin-bottom:10px">
      <div>${n.text.replace(/</g, "&lt;")}</div>
      <div class="note-date">${n.verseId} · ${new Date(n.createdAt).toLocaleDateString()}</div>
    </a>
  `).join("");
}

(async function init() {
  renderLevelCard();
  renderProfileJourney();
  renderStats();
  await Promise.all([renderBadges(), renderFavorites()]);
  renderNotes();
  initScrollReveal();
})();
