/* ==========================================================================
   Full verse study page
   ========================================================================== */

function qParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderNotes(verseId) {
  const notes = Store.getNotesFor(verseId);
  const list = document.getElementById("notes-list");
  if (!list) return;
  list.innerHTML = notes.slice().reverse().map(n => `
    <div class="note-item">
      <div>${n.text.replace(/</g, "&lt;")}</div>
      <div class="note-date">${new Date(n.createdAt).toLocaleDateString()}</div>
    </div>
  `).join("") || `<p style="font-size:0.85rem;color:var(--text-tertiary)">No notes yet — add one above.</p>`;
}

async function init() {
  const id = qParam("id") || "john-3-16";
  const verses = await DataStore.load("verses");
  const verse = verses.find(v => v.id === id) || verses[0];

  Store.recordVerseStudyView(verse.id);
  document.title = `${verse.reference} — MyBible.quest`;

  document.getElementById("verse-head").innerHTML = `
    <span class="eyebrow">✦ Verse Study</span>
    <h2>${verse.reference}</h2>
  `;

  const isFav = Store.isFavorite(verse.id);
  const isHi = Store.isHighlighted(verse.id);
  const related = (verse.relatedVerseIds || []).map(rid => verses.find(v => v.id === rid)).filter(Boolean);

  document.getElementById("study-layout").innerHTML = `
    <div class="study-main">
      <div class="study-card reveal is-visible">
        <p class="verse-text">${verse.text}</p>
        <span class="verse-ref">${verse.reference}</span>
        <div class="verse-action-row" style="margin-top:16px">
          <button class="verse-action-btn ${isFav ? "active" : ""}" id="fav-btn">${ICONS.bookmark} <span>${isFav ? "Favorited" : "Favorite"}</span></button>
          <button class="verse-action-btn ${isHi ? "active" : ""}" id="highlight-btn">${ICONS.highlighter} <span>${isHi ? "Highlighted" : "Highlight"}</span></button>
        </div>
        <div class="tag-row" style="margin-top:16px">${verse.themes.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Context</h3>
        <p style="margin-bottom:14px">${verse.context}</p>
        <h3>Why it matters</h3>
        <p>${verse.importance}</p>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Historical &amp; cultural background</h3>
        <p style="margin-bottom:10px"><strong>Political situation:</strong> ${verse.politicalSituation}</p>
        <p><strong>Culture note:</strong> ${verse.culturalNote}</p>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Key words</h3>
        <div>${verse.keyWords.map(k => `<span class="keyword-chip"><strong>${k.word}</strong> — ${k.meaning}</span>`).join("")}</div>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Modern application</h3>
        <p>${verse.modernApplication}</p>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Reflection questions</h3>
        <ul style="padding-left:18px;list-style:disc">
          ${verse.reflectionQuestions.map(q => `<li style="margin-bottom:6px">${q}</li>`).join("")}
        </ul>
        <h3 style="margin-top:18px">Your notes</h3>
        <textarea class="note-textarea" id="note-input" placeholder="Write a private note (saved on this device only)…"></textarea>
        <button class="btn btn-secondary btn-sm" id="note-save-btn" style="margin-top:10px">Save note</button>
        <div id="notes-list"></div>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Suggested prayer</h3>
        <div class="prayer-box">${verse.suggestedPrayer}</div>
      </div>
    </div>

    <div class="study-side">
      <div class="study-card reveal is-visible">
        <h3>At a glance</h3>
        <div class="study-meta-row">
          <div><div class="label">Author</div>${verse.author}</div>
          <div><div class="label">Date</div>${verse.dateApprox}</div>
          <div><div class="label">Place</div>${verse.place}</div>
          <div><div class="label">Audience</div>${verse.audience}</div>
        </div>
      </div>

      <div class="study-card reveal is-visible">
        <h3>Fact, debate &amp; interpretation</h3>
        <div class="fact-tier established"><span class="dot"></span><div><strong>Established:</strong> ${verse.historicityNote.established}</div></div>
        <div class="fact-tier debate"><span class="dot"></span><div><strong>Scholarly debate:</strong> ${verse.historicityNote.scholarlyDebate}</div></div>
        <div class="fact-tier interpretation"><span class="dot"></span><div><strong>Interpretation:</strong> ${verse.historicityNote.interpretation}</div></div>
      </div>

      ${related.length ? `
        <div class="study-card reveal is-visible">
          <h3>Related verses</h3>
          <div class="tag-row">
            ${related.map(r => `<a href="verse.html?id=${r.id}" class="tag" style="cursor:pointer">${r.reference}</a>`).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;

  document.getElementById("fav-btn").addEventListener("click", (e) => {
    const nowFav = Store.toggleFavorite(verse.id);
    const btn = e.currentTarget;
    btn.classList.toggle("active", nowFav);
    btn.querySelector("span").textContent = nowFav ? "Favorited" : "Favorite";
    if (nowFav) showToast("Added to favorites", "default");
  });

  document.getElementById("highlight-btn").addEventListener("click", (e) => {
    const nowHi = Store.toggleHighlight(verse.id);
    const btn = e.currentTarget;
    btn.classList.toggle("active", nowHi);
    btn.querySelector("span").textContent = nowHi ? "Highlighted" : "Highlight";
  });

  document.getElementById("note-save-btn").addEventListener("click", () => {
    const input = document.getElementById("note-input");
    if (!input.value.trim()) return;
    Store.addNote(verse.id, input.value.trim());
    input.value = "";
    renderNotes(verse.id);
    showToast("Note saved", "default");
  });

  renderNotes(verse.id);
  initScrollReveal();
}

init();
