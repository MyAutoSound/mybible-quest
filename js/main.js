/* ==========================================================================
   MyBible.quest — shared shell (header, footer, theme, nav, scroll reveal)
   ========================================================================== */

const NAV_LINKS = [
  { href: "index.html", label: "Home", key: "home" },
  { href: "quests.html", label: "Quests", key: "quests" },
  { href: "explorer.html", label: "Explorer", key: "explorer" },
  { href: "studies.html", label: "Studies", key: "studies" },
  { href: "assistant.html", label: "Assistant", key: "assistant" },
  { href: "understand.html", label: "Understand", key: "understand" },
  { href: "search.html", label: "Search", key: "search" },
  { href: "profile.html", label: "Profile", key: "profile" },
];

const ICONS = {
  sun: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke-linecap="round"/></svg>`,
  moon: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/></svg>`,
  menu: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  close: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>`,
  search: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  wave: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 15c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3 2-3 4-3M2 20c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3 2-3 4-3"/></svg>`,
  dove: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c2-4 6-5 8-3 1-3 5-6 9-4-2 1-3 2-3 4 3 0 4 2 4 3-2-1-4-1-5 1-1 2-3 3-5 3-1 2-3 4-6 4 1-2 2-3 2-5-2 0-3-1-4-3z"/></svg>`,
  sprout: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V10"/><path d="M12 12c0-4-3-6-7-6 0 4 3 7 7 6z"/><path d="M12 10c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 6-6 5.5z"/></svg>`,
  compass: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6z"/></svg>`,
  hands: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11V6a2 2 0 1 1 4 0v4"/><path d="M11 10V4a2 2 0 1 1 4 0v7"/><path d="M15 10.5V6a2 2 0 1 1 4 0v8c0 3.3-2.7 6-6 6h-1c-2.5 0-4-1-5.5-3L4 13c-.6-.8-.4-1.8.4-2.3.7-.4 1.6-.2 2.1.4l1.5 1.9"/></svg>`,
  book: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5z"/></svg>`,
  map: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>`,
  clock: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  users: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15.5 13c2.8.4 4.5 2.3 4.5 5.5"/></svg>`,
  arrowRight: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  check: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`,
  flame: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3-3 4-3 8a4 4 0 0 0 8 0c1.5 1 2 3 2 4.5A6.5 6.5 0 0 1 5 14.5C5 9 12 7 12 2z"/></svg>`,
  sparkle: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z"/></svg>`,
  user: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/></svg>`,
  star: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9l-5.6 3.2 1.4-6.3-4.8-4.3 6.4-.6z"/></svg>`,
  bookmark: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z"/></svg>`,
  highlighter: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l5 5-9 9-6 1 1-6z"/><path d="M4 21h16"/></svg>`,
  pin: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/></svg>`,
  chevronDown: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
};

function currentPageKey() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const map = {
    "": "home", "index.html": "home",
    "quests.html": "quests", "quest.html": "quests", "reading-plan.html": "quests",
    "explorer.html": "explorer", "book.html": "explorer", "person.html": "explorer",
    "assistant.html": "assistant",
    "search.html": "search",
    "understand.html": "understand",
    "studies.html": "studies", "study.html": "studies",
    "profile.html": "profile",
    "verse.html": "home",
  };
  return map[path] || "home";
}

function renderSkipLink() {
  const link = document.createElement("a");
  link.href = "#main-content";
  link.className = "skip-link";
  link.textContent = "Skip to content";
  document.body.prepend(link);
}

function renderHeader() {
  const active = currentPageKey();
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="container nav">
      <a href="index.html" class="brand">
        <span class="brand-mark">Q</span>
        <span>MyBible<span style="color:var(--gold)">.quest</span></span>
      </a>
      <nav class="nav-links">
        ${NAV_LINKS.map(l => `<a href="${l.href}" class="${l.key === active ? "active" : ""}">${l.label}</a>`).join("")}
      </nav>
      <div class="nav-actions">
        <a href="profile.html" class="icon-btn streak-chip" aria-label="Your profile" id="nav-profile-btn">
          ${ICONS.flame}<span id="nav-streak-count">0</span>
        </a>
        <button class="icon-btn" id="theme-toggle" aria-label="Toggle dark mode">${ICONS.moon}</button>
        <button class="hamburger" id="hamburger-btn" aria-label="Open menu">${ICONS.menu}</button>
      </div>
    </div>
  `;
  document.body.prepend(header);

  // Mobile menu must NOT be nested inside .site-header: that element uses
  // backdrop-filter, which makes it the containing block for fixed-position
  // descendants and collapses the menu to the header's own height.
  const mobileMenu = document.createElement("div");
  mobileMenu.className = "mobile-menu";
  mobileMenu.id = "mobile-menu";
  mobileMenu.innerHTML = `
    <button class="icon-btn mobile-menu-close" id="mobile-menu-close" aria-label="Close menu">${ICONS.close}</button>
    ${NAV_LINKS.map(l => `<a href="${l.href}" class="${l.key === active ? "active" : ""}">${l.label}</a>`).join("")}
  `;
  header.after(mobileMenu);

  if (typeof Store !== "undefined") {
    const streakEl = document.getElementById("nav-streak-count");
    if (streakEl) streakEl.textContent = Store.getStreak();
  }

  header.querySelector(".brand").addEventListener("click", () => {
    if (typeof Store !== "undefined") Store.recordLogoClick();
  });

  document.getElementById("hamburger-btn").addEventListener("click", () => {
    document.getElementById("mobile-menu").classList.add("open");
  });
  document.getElementById("mobile-menu-close").addEventListener("click", () => {
    document.getElementById("mobile-menu").classList.remove("open");
  });
}

function renderFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="brand">
            <span class="brand-mark">Q</span>
            <span>MyBible<span style="color:var(--gold)">.quest</span></span>
          </a>
          <p>An educational space to read, understand, and explore the Bible in context — one verse, one quest, one question at a time.</p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <a href="quests.html">Guided Quests</a>
          <a href="quests.html">Reading Plans</a>
          <a href="explorer.html">Context Explorer</a>
          <a href="explorer.html#map">Bible Maps</a>
          <a href="search.html">Search</a>
        </div>
        <div class="footer-col">
          <h4>Learn</h4>
          <a href="studies.html">Featured Studies</a>
          <a href="explorer.html">Books &amp; People</a>
          <a href="explorer.html">Archaeology</a>
          <a href="assistant.html">AI Bible Assistant</a>
        </div>
        <div class="footer-col">
          <h4>You</h4>
          <a href="profile.html">Your profile</a>
          <a href="understand.html">Our purpose</a>
          <a href="index.html#faq">FAQ</a>
        </div>
        <div class="footer-col">
          <h4>Start here</h4>
          <a href="quest.html?id=anxiety">Feeling anxious</a>
          <a href="quest.html?id=grief">Processing grief</a>
          <a href="quest.html?id=hope">Looking for hope</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} MyBible.quest — an independent educational project.</span>
        <span>Made for quiet, honest reading.</span>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

/* ---------- Theme ---------- */
function initTheme() {
  const stored = localStorage.getItem("mbq-theme");
  if (stored) document.documentElement.setAttribute("data-theme", stored);
  updateThemeIcon();

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mbq-theme", next);
    updateThemeIcon();
    if (next === "dark" && typeof Store !== "undefined") Store.recordDarkModeToggle();
  });
}

function updateThemeIcon() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const current = document.documentElement.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  btn.innerHTML = current === "dark" ? ICONS.sun : ICONS.moon;
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || items.length === 0) {
    items.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(el => io.observe(el));
}

/* ---------- Data loading ---------- */
const DataStore = {
  cache: {},
  async load(name) {
    if (this.cache[name]) return this.cache[name];
    const res = await fetch(`data/${name}.json`);
    if (!res.ok) throw new Error(`Failed to load ${name}.json`);
    const json = await res.json();
    this.cache[name] = json;
    return json;
  }
};

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function setPageMeta(description) {
  const canonicalHref = `https://mybible.quest/${location.pathname.replace(/^\//, "")}${location.search}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalHref;

  if (description) {
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.name = "description";
      document.head.appendChild(desc);
    }
    desc.content = description;
  }
}

function initShell() {
  renderSkipLink();
  renderHeader();
  renderFooter();
  initTheme();
  window.addEventListener("load", initScrollReveal);

  if (typeof Store !== "undefined") {
    const { streak, isNewDay } = Store.recordVisit();
    const streakEl = document.getElementById("nav-streak-count");
    if (streakEl) streakEl.textContent = streak;
    if (isNewDay && streak > 1) {
      window.addEventListener("load", () => {
        setTimeout(() => showToast(`Day ${streak} streak — welcome back.`, "default"), 600);
      });
    }
    Store.recordPageVisit(currentPageKey());
  }
}

initShell();
