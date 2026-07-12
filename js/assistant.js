/* ==========================================================================
   AI Bible Assistant — chat UI wiring
   ========================================================================== */

function appendMessage(role, html) {
  const window_ = document.getElementById("chat-window");
  const msg = document.createElement("div");
  msg.className = `chat-message ${role}`;
  msg.innerHTML = `<div class="chat-bubble">${html}</div>`;
  window_.appendChild(msg);
  window_.scrollTop = window_.scrollHeight;
  return msg;
}

function appendSkeleton() {
  const window_ = document.getElementById("chat-window");
  const msg = document.createElement("div");
  msg.className = "chat-message assistant";
  msg.id = "chat-skeleton";
  msg.innerHTML = `
    <div class="chat-bubble">
      <div class="skeleton-line" style="width:85%"></div>
      <div class="skeleton-line" style="width:65%"></div>
      <div class="skeleton-line" style="width:40%"></div>
    </div>
  `;
  window_.appendChild(msg);
  window_.scrollTop = window_.scrollHeight;
}

async function handleQuestion(question) {
  if (!question.trim()) return;
  if (typeof Store !== "undefined") Store.recordAssistantUse();
  appendMessage("user", question.replace(/</g, "&lt;"));
  appendSkeleton();

  const start = Date.now();
  const result = await AIEngine.ask(question);
  const elapsed = Date.now() - start;
  await new Promise(r => setTimeout(r, Math.max(0, 350 - elapsed))); // avoid an instant, jarring flash

  document.getElementById("chat-skeleton")?.remove();

  const sourcesHtml = result.sources.length
    ? `<div class="ai-sources">${result.sources.map(s => `<a href="${s.href}" class="tag">${s.type}: ${s.title}</a>`).join("")}</div>`
    : "";
  appendMessage("assistant", result.html + sourcesHtml);
}

function initAssistant() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value;
    input.value = "";
    handleQuestion(q);
  });

  document.getElementById("chat-suggestions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-q]");
    if (!btn) return;
    handleQuestion(btn.dataset.q);
  });
}

initAssistant();
