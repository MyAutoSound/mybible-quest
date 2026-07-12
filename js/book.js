/* ==========================================================================
   Book detail page
   ========================================================================== */

async function init() {
  const id = new URLSearchParams(window.location.search).get("id") || "genesis";
  const [books, verses] = await Promise.all([DataStore.load("books"), DataStore.load("verses")]);
  const book = books.find(b => b.id === id) || books[0];

  document.title = `${book.title} — MyBible.quest`;
  setPageMeta(book.authorNote || `${book.title}: ${book.category}, ${book.testament === "old" ? "Old Testament" : "New Testament"} — author, context, and key verses.`);
  if (typeof Store !== "undefined") Store.recordBookVisit(book.id, books.length);
  document.getElementById("book-head").innerHTML = `
    <span class="eyebrow">✦ ${book.testament === "old" ? "Old Testament" : "New Testament"} · ${book.category}</span>
    <h2>${book.title}</h2>
  `;

  const keyVerses = (book.keyVerseIds || []).map(id2 => verses.find(v => v.id === id2)).filter(Boolean);

  document.getElementById("book-layout").innerHTML = `
    <div class="study-main">
      <div class="study-card reveal is-visible">
        <h3>Purpose</h3>
        <p style="margin-bottom:14px">${book.purpose}</p>
        <h3>Historical context</h3>
        <p>${book.historicalContext}</p>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Structure</h3>
        <ul style="padding-left:18px;list-style:decimal">
          ${book.structure.map(s => `<li style="margin-bottom:6px">${s}</li>`).join("")}
        </ul>
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
        <div class="study-meta-row">
          <div><div class="label">Author</div>${book.author}</div>
          <div><div class="label">Date written</div>${book.dateWritten}</div>
          <div><div class="label">Audience</div>${book.audience}</div>
          <div><div class="label">Chapters</div>${book.chapters} (~${book.readingTimeMinutes} min read)</div>
        </div>
      </div>

      <div class="study-card reveal is-visible">
        <h3>On authorship</h3>
        <p>${book.authorNote}</p>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Themes</h3>
        <div class="tag-row">${book.themes.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      </div>
    </div>
  `;
  initScrollReveal();
}

init();
