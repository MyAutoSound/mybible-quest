/* ==========================================================================
   Home page logic
   ========================================================================== */

const EMOTION_TO_QUEST = {
  "Stressed": "anxiety",
  "Hopeful": "hope",
  "Grieving": "grief",
  "Doubting": "faith",
  "Searching for direction": "direction",
  "Holding a grudge": "forgiveness",
};

async function renderVerseOfDay() {
  const verses = await DataStore.load("verses");
  const idx = dayOfYear() % verses.length;
  const v = verses[idx];
  const card = document.getElementById("verse-card");
  card.innerHTML = `
    <p class="verse-text">${v.text}</p>
    <span class="verse-ref">${v.reference}</span>
    <div class="verse-meta">
      <div>
        <h4>Context</h4>
        <p>${v.context}</p>
      </div>
      <div>
        <h4>Why it matters</h4>
        <p>${v.importance}</p>
      </div>
    </div>
    <div class="verse-card-foot">
      <div class="tag-row">${v.themes.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      <a href="verse.html?id=${v.id}" class="btn-ghost">Read the full study →</a>
    </div>
  `;
}

function renderEmotionRow() {
  const row = document.getElementById("emotion-row");
  row.innerHTML = Object.keys(EMOTION_TO_QUEST).map(label => `
    <a href="quest.html?id=${EMOTION_TO_QUEST[label]}" class="emotion-pill">${label}</a>
  `).join("");
}

async function renderQuestTeasers() {
  const quests = await DataStore.load("quests");
  const grid = document.getElementById("quest-teaser-grid");
  grid.innerHTML = quests.slice(0, 3).map(q => `
    <div class="card reveal">
      <div class="card-icon ${q.color === 'gold' ? 'gold' : 'blue'}">${ICONS[q.icon] || ""}</div>
      <h3>${q.title}</h3>
      <p>${q.tagline}</p>
      <div class="card-foot">
        <a href="quest.html?id=${q.id}" class="btn-ghost">Begin quest →</a>
      </div>
    </div>
  `).join("");
  initScrollReveal();
}

async function renderStats() {
  const [verses, places] = await Promise.all([DataStore.load("verses"), DataStore.load("places")]);
  document.getElementById("stat-verses").textContent = verses.length + "+";
  document.getElementById("stat-places").textContent = places.length;
}

async function renderMapPreview() {
  const places = await DataStore.load("places");
  const sample = places.slice(0, 8);
  const box = document.getElementById("map-preview");
  box.innerHTML = `
    <div class="map-wrap" style="aspect-ratio:16/10">
      ${sample.map(p => `<div class="map-pin" style="left:${p.x}%; top:${p.y}%; opacity:0.85"><span class="map-pin-label">${p.name}</span></div>`).join("")}
    </div>
  `;
}

async function renderTimelinePreview() {
  const events = await DataStore.load("timeline");
  const sample = [events[0], events.find(e => e.category === "exodus"), events.find(e => e.highlight), events[events.length - 1]].filter(Boolean);
  document.getElementById("timeline-preview").innerHTML = `
    <div class="timeline" style="padding-left:26px">
      ${sample.map(e => `
        <div class="timeline-item ${e.highlight ? "highlight" : ""}">
          <div class="era">${e.era}</div>
          <h3 style="font-size:1.1rem">${e.title}</h3>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderPlansTeaser() {
  const plans = await DataStore.load("reading-plans");
  document.getElementById("plans-teaser-grid").innerHTML = plans.map(p => `
    <div class="card reveal">
      <div class="card-icon gold">${ICONS[p.icon] || ICONS.book}</div>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="card-foot">
        <span class="reading-time">${ICONS.clock} ${p.durationDays} days</span>
        <a href="reading-plan.html?id=${p.id}" class="btn-ghost">Start →</a>
      </div>
    </div>
  `).join("");
  initScrollReveal();
}

async function renderArchaeologyTeaser() {
  const items = await DataStore.load("archaeology");
  document.getElementById("archaeology-teaser-grid").innerHTML = items.slice(0, 3).map(a => `
    <div class="card reveal">
      <div class="card-icon blue">${ICONS.pin}</div>
      <h3>${a.name}</h3>
      <p>${a.description}</p>
      <div class="meta-row"><span class="tag">${a.consensusLevel}</span></div>
    </div>
  `).join("");
  initScrollReveal();
}

async function renderStudiesTeaser() {
  const studies = await DataStore.load("studies");
  document.getElementById("studies-teaser-grid").innerHTML = studies.slice(0, 3).map(s => `
    <a href="study.html?id=${s.id}" class="card reveal">
      <div class="card-icon gold">${ICONS.sparkle}</div>
      <h3>${s.title}</h3>
      <p>${s.summary}</p>
      <div class="meta-row"><span class="reading-time">${ICONS.clock} ${s.readingTimeMinutes} min read</span></div>
    </a>
  `).join("");
  initScrollReveal();
}

async function renderTestimonials() {
  const items = await DataStore.load("testimonials");
  document.getElementById("testimonials-grid").innerHTML = items.map(t => `
    <div class="testimonial-card reveal">
      <p class="testimonial-quote">"${t.quote}"</p>
      <div class="testimonial-person">
        <div class="testimonial-avatar">${t.avatarInitial}</div>
        <div>
          <div class="name">${t.name}</div>
          <div class="role">${t.role}</div>
        </div>
      </div>
    </div>
  `).join("");
  initScrollReveal();
}

async function renderFAQ() {
  const items = await DataStore.load("faq");
  const accordion = document.getElementById("faq-accordion");
  accordion.innerHTML = items.map(f => `
    <div class="accordion-item" id="${f.id}">
      <button class="accordion-question" aria-expanded="false">
        <span>${f.question}</span>${ICONS.chevronDown}
      </button>
      <div class="accordion-answer"><p>${f.answer}</p></div>
    </div>
  `).join("");

  accordion.querySelectorAll(".accordion-item").forEach(item => {
    const q = item.querySelector(".accordion-question");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      accordion.querySelectorAll(".accordion-item").forEach(i => { i.classList.remove("open"); i.querySelector(".accordion-question").setAttribute("aria-expanded", "false"); });
      if (!isOpen) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
    });
  });
}

function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    Store.subscribeNewsletter();
    document.getElementById("newsletter-note").textContent = "Subscribed — thanks for sticking around.";
    form.querySelector("input").value = "";
    showToast("Subscribed", "default");
  });
}

function renderHowItWorksTrail() {
  renderMountainTrail(document.getElementById("how-it-works-trail"), {
    totalSteps: 5,
    currentIndex: 2,
    completed: false,
  });
}

(async function init() {
  renderEmotionRow();
  initNewsletter();
  renderHowItWorksTrail();
  await Promise.all([
    renderVerseOfDay(), renderQuestTeasers(), renderStats(),
    renderMapPreview(), renderTimelinePreview(), renderPlansTeaser(),
    renderArchaeologyTeaser(), renderStudiesTeaser(), renderTestimonials(), renderFAQ(),
  ]);
  initScrollReveal();
})();
