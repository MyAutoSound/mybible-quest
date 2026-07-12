/* ==========================================================================
   MyBible.quest — local "AI Bible Assistant" engine
   No external API calls: this is a transparent, rule-based matcher over the
   site's own curated data. It always cites its sources and always flags
   whether something is an established fact, a scholarly debate, or an
   interpretation — it never invents an answer outside that data.
   ========================================================================== */

const STOPWORDS = new Set(["the","a","an","is","was","are","were","of","in","on","at","to","for","and","or","what","who","where","when","why","how","does","do","did","this","that","it","about","me","tell","explain","can","you","i","please","which","with","from"]);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w => !STOPWORDS.has(w) && w.length > 1);
}

function scoreOverlap(queryTokens, targetText) {
  const targetTokens = new Set(tokenize(targetText));
  let score = 0;
  queryTokens.forEach(t => { if (targetTokens.has(t)) score += 1; });
  return score;
}

const EMOTION_KEYWORDS = {
  anxiety: ["anxious", "anxiety", "stress", "stressed", "worried", "worry", "overwhelmed", "panic"],
  hope: ["hope", "hopeful", "future", "discouraged"],
  grief: ["grief", "grieving", "sad", "sadness", "loss", "mourning", "depressed"],
  faith: ["doubt", "doubting", "faith", "believe", "belief", "unsure"],
  direction: ["direction", "decision", "confused", "lost", "choice", "purpose"],
  forgiveness: ["forgive", "forgiveness", "grudge", "angry", "resentment"],
  gratitude: ["grateful", "gratitude", "thankful", "thanks", "blessed", "appreciate"],
  protection: ["danger", "unsafe", "protect", "protection", "safety", "watch over", "keep me safe", "afraid for"],
};

const AIEngine = {
  _data: null,

  async _ensureData() {
    if (this._data) return this._data;
    const [verses, people, places, quests, books, prayers] = await Promise.all([
      DataStore.load("verses"), DataStore.load("people"), DataStore.load("places"),
      DataStore.load("quests"), DataStore.load("books"), DataStore.load("prayers"),
    ]);
    this._data = { verses, people, places, quests, books, prayers };
    return this._data;
  },

  async ask(question) {
    const { verses, people, places, quests, books, prayers } = await this._ensureData();
    const q = question.trim();
    const qLower = q.toLowerCase();
    const tokens = tokenize(q);

    // 1) Direct reference match, e.g. "John 3:16" or "psalm 23"
    const refMatch = verses.find(v => qLower.includes(v.reference.toLowerCase().split(":")[0].replace(/\s+/g, " ")));
    if (refMatch && (qLower.includes(":") || qLower.split(" ").length <= 5)) {
      return this._verseAnswer(refMatch, `You asked about ${refMatch.reference} directly, so here's the full picture:`);
    }

    // 2) Emotion intent -> suggest a quest, a grounded verse, and a short prayer
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.some(k => qLower.includes(k))) {
        const answer = this._emotionAnswer(emotion, { quests, verses, prayers });
        if (answer) return answer;
      }
    }

    // 3) "Who is / who was X" -> person lookup
    const personMatch = people
      .map(p => ({ p, score: scoreOverlap(tokens, p.name) * 3 + scoreOverlap(tokens, p.description) }))
      .sort((a, b) => b.score - a.score)[0];

    // 4) "Where is X" -> place lookup
    const placeMatch = places
      .map(pl => ({ pl, score: scoreOverlap(tokens, pl.name) * 3 + scoreOverlap(tokens, pl.description) }))
      .sort((a, b) => b.score - a.score)[0];

    // 5) Book lookup
    const bookMatch = books
      .map(b => ({ b, score: scoreOverlap(tokens, b.title) * 3 + scoreOverlap(tokens, b.purpose + " " + b.historicalContext) }))
      .sort((a, b) => b.score - a.score)[0];

    // 6) Verse/theme lookup (general fallback search)
    const verseMatch = verses
      .map(v => ({
        v,
        score: scoreOverlap(tokens, v.reference) * 2
          + scoreOverlap(tokens, v.text)
          + scoreOverlap(tokens, v.themes.join(" ")) * 2
          + scoreOverlap(tokens, v.context + " " + v.importance),
      }))
      .sort((a, b) => b.score - a.score)[0];

    const candidates = [
      { kind: "person", score: personMatch?.score || 0, item: personMatch?.p },
      { kind: "place", score: placeMatch?.score || 0, item: placeMatch?.pl },
      { kind: "book", score: bookMatch?.score || 0, item: bookMatch?.b },
      { kind: "verse", score: verseMatch?.score || 0, item: verseMatch?.v },
    ].sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < 2) {
      return {
        html: `
          <p>I couldn't find a strong match for that in the site's own verse, people, place, and book library — this assistant only answers from that curated data, it doesn't reach outside it.</p>
          <p>Try rephrasing with a book, person, place, or feeling (e.g. "Who was Jeremiah?", "What happened at Mount Sinai?", "I feel anxious"), or use <a href="search.html">Search</a> directly.</p>
        `,
        sources: [],
      };
    }

    if (best.kind === "person") return this._personAnswer(best.item);
    if (best.kind === "place") return this._placeAnswer(best.item);
    if (best.kind === "book") return this._bookAnswer(best.item);
    return this._verseAnswer(best.item, "Here's what the site's library has on that:");
  },

  _emotionAnswer(emotion, { quests, verses, prayers }) {
    const quest = quests.find(qq => qq.id === emotion);
    const matchingVerse = verses.find(v => v.emotions.includes(emotion));
    const matchingPrayer = prayers.find(p => p.category.toLowerCase() === emotion);
    if (!quest && !matchingVerse && !matchingPrayer) return null;

    const parts = [];
    const sources = [];

    if (quest) {
      parts.push(`<p>It sounds like this might connect to <strong>${quest.title}</strong>. That's one of the site's guided quests — a short, five-step reading path built around this exact feeling.</p>`);
      sources.push({ type: "quest", title: quest.title, href: `quest.html?id=${quest.id}` });
    }
    if (matchingVerse) {
      parts.push(`
        <p>One verse that speaks to this: <em>"${matchingVerse.text}"</em> — <strong>${matchingVerse.reference}</strong>.</p>
        <p>${matchingVerse.context}</p>
      `);
      sources.push({ type: "verse", title: matchingVerse.reference, href: `verse.html?id=${matchingVerse.id}` });
    }
    if (matchingPrayer) {
      parts.push(`
        <p>There's also a short written prayer for this: <strong>${matchingPrayer.title}</strong>.</p>
        <blockquote class="ai-quote">"${matchingPrayer.text}"</blockquote>
      `);
      sources.push({ type: "prayer", title: matchingPrayer.title, href: `prayers.html` });
    }
    parts.push(`<p class="ai-note">This is a suggestion based on keyword matching against the site's own data, not a diagnosis or substitute for professional support.</p>`);

    return { html: parts.join(""), sources };
  },

  _verseAnswer(v, lead) {
    return {
      html: `
        <p>${lead}</p>
        <blockquote class="ai-quote">"${v.text}" <cite>— ${v.reference}</cite></blockquote>
        <p><strong>Context:</strong> ${v.context}</p>
        <p><strong>Why it matters:</strong> ${v.importance}</p>
        <div class="ai-fact-grid">
          <div><strong>Established:</strong> ${v.historicityNote.established}</div>
          <div><strong>Scholarly debate:</strong> ${v.historicityNote.scholarlyDebate}</div>
          <div><strong>Interpretation:</strong> ${v.historicityNote.interpretation}</div>
        </div>
        <p class="ai-note">Source: this site's own verse study data — see the full study for more.</p>
      `,
      sources: [{ type: "verse", title: v.reference, href: `verse.html?id=${v.id}` }],
    };
  },

  _personAnswer(p) {
    return {
      html: `
        <p><strong>${p.name}</strong> — ${p.role}.</p>
        <p>${p.description}</p>
        <p>${p.importance}</p>
        <p class="ai-note">Source: this site's Explorer people profiles.</p>
      `,
      sources: [{ type: "person", title: p.name, href: `person.html?id=${p.id}` }],
    };
  },

  _placeAnswer(pl) {
    return {
      html: `
        <p><strong>${pl.name}</strong> (${pl.modern})</p>
        <p>${pl.description}</p>
        <p class="ai-note">Source: this site's Explorer map data.</p>
      `,
      sources: [{ type: "place", title: pl.name, href: `explorer.html#map` }],
    };
  },

  _bookAnswer(b) {
    return {
      html: `
        <p><strong>${b.title}</strong> (${b.testament === "old" ? "Old Testament" : "New Testament"}, ${b.category})</p>
        <p>${b.purpose}</p>
        <p><strong>Historical context:</strong> ${b.historicalContext}</p>
        <p><strong>Authorship:</strong> ${b.authorNote}</p>
        <p class="ai-note">Source: this site's book overview data.</p>
      `,
      sources: [{ type: "book", title: b.title, href: `book.html?id=${b.id}` }],
    };
  },
};
