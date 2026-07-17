/* ==========================================================================
   MyBible.quest — local community & progress store
   Everything here lives in the visitor's own browser (localStorage).
   No account, no server, nothing transmitted — see the FAQ for why.
   ========================================================================== */

const CORE_QUEST_IDS = ["anxiety", "hope", "grief", "faith", "direction", "forgiveness"];
const SAGA_CHAPTER_IDS = [
  "saga-1-creation", "saga-2-kingdom", "saga-3-wisdom", "saga-4-psalms", "saga-5-prophets",
  "saga-6-jesus", "saga-7-church", "saga-8-letters", "saga-9-hope",
];
const EXPLORER_TABS = ["map", "timeline", "books", "people", "archaeology"];
const XP_LEVELS = [0, 80, 200, 400, 700, 1100, 1650, 2350, 3250, 4400, 6000];
const LEVEL_TITLES = [
  "Wanderer", "Seeker", "Pilgrim", "Disciple", "Student of the Word",
  "Devoted Reader", "Scholar", "Sage", "Elder", "Luminary", "Keeper of the Mountain",
];
// The full set of distinct top-level sections tracked for the "Every Corner" badge.
const SITE_SECTIONS = ["home", "quests", "prayers", "explorer", "assistant", "search", "understand", "studies", "profile"];

const XP_AWARDS = {
  dailyVisit: 10,
  verseStudyFirstOpen: 5,
  favoriteFirstAdd: 2,
  highlightFirstAdd: 2,
  noteAdd: 5,
  questStep: 5,
  questComplete: 30,
  readingPlanDay: 8,
  readingPlanComplete: 40,
  badgeUnlock: 25,
  mapPlaceFirstClick: 2,
};

const DEFAULT_STATE = () => ({
  favorites: [],
  highlights: [],
  notes: [],
  xp: 0,
  badges: [],
  streak: 0,
  lastVisit: null,
  visitDates: [],
  questProgress: {},
  readingPlanProgress: {},
  verseStudiesOpened: [],
  explorerTabsVisited: [],
  mapPlacesVisited: [],
  newsletterSubscribed: false,
  pagesVisited: [],
  booksVisited: [],
  studiesOpened: [],
  assistantUsed: false,
  darkModeUsed: false,
  logoClicks: 0,
});

const Store = {
  _key: "mbq_store_v1",
  _listeners: [],
  _state: null,

  _load() {
    if (this._state) return this._state;
    let state = null;
    try {
      state = JSON.parse(localStorage.getItem(this._key) || "null");
    } catch (e) {
      state = null;
    }
    if (!state) state = DEFAULT_STATE();

    // one-time migration from the old quest-progress-only key used before the
    // community/gamification layer existed
    if (!state._migratedLegacyProgress) {
      try {
        const legacy = JSON.parse(localStorage.getItem("mbq_progress") || "null");
        if (legacy) state.questProgress = { ...legacy, ...state.questProgress };
      } catch (e) { /* ignore */ }
      state._migratedLegacyProgress = true;
    }

    this._state = { ...DEFAULT_STATE(), ...state };
    return this._state;
  },

  _save() {
    localStorage.setItem(this._key, JSON.stringify(this._state));
    this._emit();
  },

  _emit() {
    this._listeners.forEach(fn => fn(this._state));
  },

  onChange(fn) {
    this._listeners.push(fn);
  },

  /* ---------- Cloud sync (optional, used by firebase-init.js) ---------- */
  _exportState() {
    return { ...this._load() };
  },

  _importState(remote) {
    this._state = { ...DEFAULT_STATE(), ...remote };
    localStorage.setItem(this._key, JSON.stringify(this._state));
    this._emit();
  },

  // Combines this device's local state with a remote (cloud) state so that
  // signing into an existing account never silently discards progress made
  // as a guest on this device: lists union, counters/steps take the higher
  // value, booleans OR together.
  _mergeState(remote) {
    const local = this._load();
    const merged = { ...DEFAULT_STATE(), ...remote };
    const union = (a = [], b = []) => [...new Set([...a, ...b])];

    merged.favorites = union(local.favorites, remote.favorites);
    merged.highlights = union(local.highlights, remote.highlights);
    merged.badges = union(local.badges, remote.badges);
    merged.verseStudiesOpened = union(local.verseStudiesOpened, remote.verseStudiesOpened);
    merged.explorerTabsVisited = union(local.explorerTabsVisited, remote.explorerTabsVisited);
    merged.mapPlacesVisited = union(local.mapPlacesVisited, remote.mapPlacesVisited);
    merged.visitDates = union(local.visitDates, remote.visitDates);
    merged.pagesVisited = union(local.pagesVisited, remote.pagesVisited);
    merged.booksVisited = union(local.booksVisited, remote.booksVisited);
    merged.studiesOpened = union(local.studiesOpened, remote.studiesOpened);
    merged.assistantUsed = !!(local.assistantUsed || remote.assistantUsed);
    merged.darkModeUsed = !!(local.darkModeUsed || remote.darkModeUsed);
    merged.logoClicks = Math.max(local.logoClicks || 0, remote.logoClicks || 0);

    const notesById = new Map();
    [...(remote.notes || []), ...(local.notes || [])].forEach(n => notesById.set(n.id, n));
    merged.notes = [...notesById.values()];

    merged.xp = Math.max(local.xp || 0, remote.xp || 0);
    merged.streak = Math.max(local.streak || 0, remote.streak || 0);
    merged.lastVisit = [local.lastVisit, remote.lastVisit].filter(Boolean).sort().pop() || null;
    merged.newsletterSubscribed = !!(local.newsletterSubscribed || remote.newsletterSubscribed);

    merged.questProgress = {};
    new Set([...Object.keys(local.questProgress || {}), ...Object.keys(remote.questProgress || {})])
      .forEach(id => {
        const a = local.questProgress?.[id] || { step: 0, completed: false };
        const b = remote.questProgress?.[id] || { step: 0, completed: false };
        merged.questProgress[id] = { step: Math.max(a.step, b.step), completed: a.completed || b.completed };
      });

    merged.readingPlanProgress = {};
    new Set([...Object.keys(local.readingPlanProgress || {}), ...Object.keys(remote.readingPlanProgress || {})])
      .forEach(id => {
        const a = local.readingPlanProgress?.[id] || { day: 0, completed: false };
        const b = remote.readingPlanProgress?.[id] || { day: 0, completed: false };
        merged.readingPlanProgress[id] = { day: Math.max(a.day, b.day), completed: a.completed || b.completed };
      });

    return merged;
  },

  getLevel(xp) {
    const value = xp ?? this._load().xp;
    let level = 1;
    for (let i = 1; i < XP_LEVELS.length; i++) {
      if (value >= XP_LEVELS[i]) level = i + 1;
    }
    return level;
  },

  getLevelProgress() {
    const state = this._load();
    const level = this.getLevel();
    const floor = XP_LEVELS[level - 1] ?? 0;
    const ceiling = XP_LEVELS[level] ?? floor + 1000;
    const pct = Math.min(100, Math.round(((state.xp - floor) / (ceiling - floor)) * 100));
    return { level, xp: state.xp, floor, ceiling, pct };
  },

  getLevelTitle(level) {
    const value = level ?? this.getLevel();
    return LEVEL_TITLES[Math.min(value, LEVEL_TITLES.length) - 1];
  },

  addXP(amount, reason) {
    const state = this._load();
    const levelBefore = this.getLevel(state.xp);
    state.xp += amount;
    const levelAfter = this.getLevel(state.xp);
    this._save();
    if (levelAfter > levelBefore && typeof showToast === "function") {
      showToast(`Level up! You're now a ${this.getLevelTitle(levelAfter)} (level ${levelAfter}).`, "level");
    }
    return { leveledUp: levelAfter > levelBefore, level: levelAfter };
  },

  unlockBadge(badgeId) {
    const state = this._load();
    if (state.badges.includes(badgeId)) return false;
    state.badges.push(badgeId);
    this._save();
    this.addXP(XP_AWARDS.badgeUnlock, "badge:" + badgeId);
    if (typeof showToast === "function" && typeof BADGE_LOOKUP !== "undefined" && BADGE_LOOKUP[badgeId]) {
      showToast(`Badge unlocked: ${BADGE_LOOKUP[badgeId].name}`, "badge");
    }
    return true;
  },

  hasBadge(badgeId) {
    return this._load().badges.includes(badgeId);
  },

  getBadges() {
    return [...this._load().badges];
  },

  /* ---------- Daily visit / streak ---------- */
  recordVisit() {
    const state = this._load();
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastVisit === today) return { streak: state.streak, isNewDay: false };

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (state.lastVisit === yesterday) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }
    state.lastVisit = today;
    state.visitDates.push(today);
    this._save();
    this.addXP(XP_AWARDS.dailyVisit, "daily-visit");

    if (state.streak >= 3) this.unlockBadge("consistent-reader");
    if (state.streak >= 7) this.unlockBadge("devoted");

    return { streak: state.streak, isNewDay: true };
  },

  getStreak() {
    return this._load().streak;
  },

  /* ---------- Favorites ---------- */
  toggleFavorite(verseId) {
    const state = this._load();
    const idx = state.favorites.indexOf(verseId);
    let isFav;
    if (idx === -1) {
      state.favorites.push(verseId);
      isFav = true;
      this._save();
      this.addXP(XP_AWARDS.favoriteFirstAdd, "favorite");
      if (state.favorites.length >= 10) this.unlockBadge("collector");
    } else {
      state.favorites.splice(idx, 1);
      isFav = false;
      this._save();
    }
    return isFav;
  },

  isFavorite(verseId) {
    return this._load().favorites.includes(verseId);
  },

  getFavorites() {
    return [...this._load().favorites];
  },

  /* ---------- Highlights ---------- */
  toggleHighlight(verseId) {
    const state = this._load();
    const idx = state.highlights.indexOf(verseId);
    let isHighlighted;
    if (idx === -1) {
      state.highlights.push(verseId);
      isHighlighted = true;
      this._save();
      this.addXP(XP_AWARDS.highlightFirstAdd, "highlight");
    } else {
      state.highlights.splice(idx, 1);
      isHighlighted = false;
      this._save();
    }
    return isHighlighted;
  },

  isHighlighted(verseId) {
    return this._load().highlights.includes(verseId);
  },

  getHighlights() {
    return [...this._load().highlights];
  },

  /* ---------- Notes ---------- */
  addNote(verseId, text) {
    const state = this._load();
    const note = { id: "n" + Date.now(), verseId, text, createdAt: new Date().toISOString() };
    state.notes.push(note);
    this._save();
    this.addXP(XP_AWARDS.noteAdd, "note");
    if (state.notes.length >= 5) this.unlockBadge("note-taker");
    return note;
  },

  deleteNote(noteId) {
    const state = this._load();
    state.notes = state.notes.filter(n => n.id !== noteId);
    this._save();
  },

  getNotesFor(verseId) {
    return this._load().notes.filter(n => n.verseId === verseId);
  },

  getAllNotes() {
    return [...this._load().notes];
  },

  /* ---------- Verse studies (deep-diver) ---------- */
  recordVerseStudyView(verseId) {
    const state = this._load();
    if (!state.verseStudiesOpened.includes(verseId)) {
      state.verseStudiesOpened.push(verseId);
      this._save();
      this.addXP(XP_AWARDS.verseStudyFirstOpen, "verse-study");
      if (state.verseStudiesOpened.length >= 10) this.unlockBadge("deep-diver");
    }
  },

  /* ---------- Explorer tabs (historian) ---------- */
  recordExplorerTabVisit(tabKey) {
    const state = this._load();
    if (!state.explorerTabsVisited.includes(tabKey)) {
      state.explorerTabsVisited.push(tabKey);
      this._save();
      if (EXPLORER_TABS.every(t => state.explorerTabsVisited.includes(t))) {
        this.unlockBadge("historian");
      }
    }
  },

  /* ---------- Map places (cartographer) ---------- */
  recordMapPlaceClick(placeId) {
    const state = this._load();
    if (!state.mapPlacesVisited.includes(placeId)) {
      state.mapPlacesVisited.push(placeId);
      this._save();
      this.addXP(XP_AWARDS.mapPlaceFirstClick, "map-place");
      if (state.mapPlacesVisited.length >= 10) this.unlockBadge("cartographer");
    }
  },

  /* ---------- Hidden badges: exploring the site itself ---------- */
  recordPageVisit(pageKey) {
    const state = this._load();
    const now = new Date();

    if (!state.pagesVisited.includes(pageKey)) {
      state.pagesVisited.push(pageKey);
      this._save();
      if (SITE_SECTIONS.every(k => state.pagesVisited.includes(k))) this.unlockBadge("every-corner");
    }

    const hour = now.getHours();
    if (hour >= 0 && hour < 4) this.unlockBadge("night-owl");
    if (hour >= 4 && hour < 6) this.unlockBadge("early-bird");
    if (now.getDay() === 0) this.unlockBadge("sabbath-rest");
  },

  recordBookVisit(bookId, totalBooks) {
    const state = this._load();
    if (!state.booksVisited.includes(bookId)) {
      state.booksVisited.push(bookId);
      this._save();
    }
    if (state.booksVisited.includes("genesis") && state.booksVisited.includes("revelation")) {
      this.unlockBadge("alpha-and-omega");
    }
    if (totalBooks && state.booksVisited.length >= totalBooks) this.unlockBadge("whole-story");
  },

  recordStudyOpened(studyId, totalStudies) {
    const state = this._load();
    if (!state.studiesOpened.includes(studyId)) {
      state.studiesOpened.push(studyId);
      this._save();
    }
    if (totalStudies && state.studiesOpened.length >= totalStudies) this.unlockBadge("well-read");
  },

  recordAssistantUse() {
    const state = this._load();
    if (!state.assistantUsed) {
      state.assistantUsed = true;
      this._save();
      this.unlockBadge("still-small-voice");
    }
  },

  recordDarkModeToggle() {
    const state = this._load();
    if (!state.darkModeUsed) {
      state.darkModeUsed = true;
      this._save();
      this.unlockBadge("turn-the-lights-off");
    }
  },

  recordLogoClick() {
    const state = this._load();
    state.logoClicks += 1;
    this._save();
    if (state.logoClicks >= 7) this.unlockBadge("secret-keeper");
  },

  /* ---------- Quest progress ---------- */
  getQuestProgress(questId) {
    return this._load().questProgress[questId] || { step: 0, completed: false };
  },

  getAllQuestProgress() {
    return { ...this._load().questProgress };
  },

  setQuestStep(questId, step) {
    const state = this._load();
    const prev = state.questProgress[questId] || { step: 0, completed: false };
    state.questProgress[questId] = { step, completed: prev.completed };
    this._save();
    this.addXP(XP_AWARDS.questStep, "quest-step");
  },

  completeQuest(questId) {
    const state = this._load();
    const wasAlreadyDone = state.questProgress[questId]?.completed;
    state.questProgress[questId] = { step: 0, completed: true };
    this._save();
    if (!wasAlreadyDone) {
      this.addXP(XP_AWARDS.questComplete, "quest-complete");
      this.unlockBadge("first-steps");
      const doneCount = CORE_QUEST_IDS.filter(id => state.questProgress[id]?.completed).length;
      if (doneCount >= CORE_QUEST_IDS.length) this.unlockBadge("quest-master");
      if (SAGA_CHAPTER_IDS.includes(questId)) {
        const sagaDone = SAGA_CHAPTER_IDS.every(id => state.questProgress[id]?.completed);
        if (sagaDone) this.unlockBadge("pilgrim");
      }
    }
  },

  /* ---------- Reading plans ---------- */
  getReadingPlanProgress(planId) {
    return this._load().readingPlanProgress[planId] || { day: 0, completed: false };
  },

  setReadingPlanDay(planId, day, totalDays) {
    const state = this._load();
    const completed = day >= totalDays;
    state.readingPlanProgress[planId] = { day, completed };
    this._save();
    this.addXP(XP_AWARDS.readingPlanDay, "reading-plan-day");
    if (completed) {
      this.addXP(XP_AWARDS.readingPlanComplete, "reading-plan-complete");
      this.unlockBadge("scholar");
    }
  },

  /* ---------- Newsletter (locally simulated, no backend) ---------- */
  subscribeNewsletter() {
    const state = this._load();
    state.newsletterSubscribed = true;
    this._save();
  },

  isNewsletterSubscribed() {
    return this._load().newsletterSubscribed;
  },

  /* ---------- Stats summary for the profile page ---------- */
  getStats() {
    const state = this._load();
    const questsCompleted = CORE_QUEST_IDS.filter(id => state.questProgress[id]?.completed).length;
    return {
      xp: state.xp,
      level: this.getLevel(),
      streak: state.streak,
      favoritesCount: state.favorites.length,
      highlightsCount: state.highlights.length,
      notesCount: state.notes.length,
      badgesCount: state.badges.length,
      questsCompleted,
      totalQuests: CORE_QUEST_IDS.length,
      verseStudiesOpened: state.verseStudiesOpened.length,
      mapPlacesVisited: state.mapPlacesVisited.length,
    };
  },
};

/* ---------- Toast notifications ---------- */
function showToast(message, type = "default") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const iconMap = { level: "⭐", badge: "\u{1F396}️", default: "✨" };
  toast.innerHTML = `<span class="toast-icon">${iconMap[type] || iconMap.default}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}
