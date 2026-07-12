/* ==========================================================================
   Account button, sign-in/sign-up modal, and account dropdown.
   Talks to window.Auth (js/firebase-init.js). Signing in is always optional —
   everything keeps working locally if you never touch this.
   ========================================================================== */

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.19.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;

function initials(user) {
  const source = user.displayName || user.email || "?";
  return source.trim().charAt(0).toUpperCase();
}

function avatarInner(user) {
  return user.photoURL ? `<img src="${user.photoURL}" alt="">` : initials(user);
}

function providerLabel(user) {
  const isGoogle = (user.providerData || []).some((p) => p.providerId === "google.com");
  return isGoogle ? "Signed in with Google" : "Signed in with email";
}

function renderAuthButton() {
  const actions = document.querySelector(".nav-actions");
  if (!actions) return null;
  const btn = document.createElement("button");
  btn.className = "icon-btn auth-btn";
  btn.id = "auth-btn";
  btn.setAttribute("aria-label", "Account");
  btn.innerHTML = ICONS.user;
  actions.insertBefore(btn, actions.firstChild);
  return btn;
}

function renderAuthModal() {
  const overlay = document.createElement("div");
  overlay.className = "auth-modal-overlay";
  overlay.id = "auth-modal-overlay";
  overlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button class="icon-btn auth-modal-close" id="auth-modal-close" aria-label="Close">${ICONS.close}</button>
      <div class="auth-modal-tabs">
        <button class="auth-tab active" type="button" data-tab="signin">Sign in</button>
        <button class="auth-tab" type="button" data-tab="signup">Create account</button>
      </div>
      <h3 id="auth-modal-title">Sign in</h3>
      <p class="auth-modal-sub">Optional — sync your favorites, notes, and progress across devices. Stay signed out and everything keeps working locally, as always.</p>
      <button type="button" class="btn btn-secondary auth-google-btn" id="auth-google-btn">${GOOGLE_ICON}<span>Continue with Google</span></button>
      <div class="auth-divider"><span>or</span></div>
      <form id="auth-form" novalidate>
        <label class="auth-field" id="auth-name-field" hidden>
          <span>Name</span>
          <input type="text" id="auth-name" autocomplete="name">
        </label>
        <label class="auth-field">
          <span>Email</span>
          <input type="email" id="auth-email" autocomplete="email" required>
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input type="password" id="auth-password" autocomplete="current-password" minlength="6" required>
        </label>
        <button type="button" class="auth-forgot-link" id="auth-forgot-btn">Forgot password?</button>
        <p class="auth-error" id="auth-error" hidden></p>
        <button type="submit" class="btn btn-primary auth-submit" id="auth-submit">Sign in</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function renderAccountDropdown() {
  const dropdown = document.createElement("div");
  dropdown.className = "auth-dropdown";
  dropdown.id = "auth-dropdown";
  dropdown.hidden = true;
  dropdown.innerHTML = `
    <div class="account-row" style="margin-bottom:14px">
      <div class="account-avatar-lg" id="auth-dropdown-avatar" style="width:40px;height:40px;font-size:0.95rem"></div>
      <div style="min-width:0">
        <div id="auth-dropdown-name" style="font-weight:600;font-size:0.92rem"></div>
        <p class="auth-dropdown-email" id="auth-dropdown-email" style="margin:0"></p>
      </div>
    </div>
    <a href="profile.html" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:8px">View profile</a>
    <button class="btn btn-secondary btn-sm" id="auth-signout-btn" style="width:100%">Sign out</button>
  `;
  document.body.appendChild(dropdown);
  return dropdown;
}

function setMode(overlay, mode) {
  overlay.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === mode));
  overlay.querySelector("#auth-modal-title").textContent = mode === "signup" ? "Create account" : "Sign in";
  overlay.querySelector("#auth-submit").textContent = mode === "signup" ? "Create account" : "Sign in";
  overlay.querySelector("#auth-name-field").hidden = mode !== "signup";
  overlay.querySelector("#auth-forgot-btn").hidden = mode === "signup";
  overlay.querySelector("#auth-password").autocomplete = mode === "signup" ? "new-password" : "current-password";
  const errorEl = overlay.querySelector("#auth-error");
  errorEl.hidden = true;
  errorEl.classList.remove("auth-error-success");
  overlay.dataset.mode = mode;
}

function showAuthError(overlay, message, tone = "error") {
  const errorEl = overlay.querySelector("#auth-error");
  errorEl.textContent = message;
  errorEl.classList.toggle("auth-error-success", tone === "success");
  errorEl.hidden = false;
}

function openModal(overlay) {
  overlay.classList.add("open");
  document.body.classList.add("no-scroll");
  setTimeout(() => overlay.querySelector("#auth-email")?.focus(), 50);
}

function closeModal(overlay) {
  overlay.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

function initAuthUI() {
  if (typeof ICONS === "undefined" || typeof Auth === "undefined") return;

  const btn = renderAuthButton();
  const overlay = renderAuthModal();
  const dropdown = renderAccountDropdown();
  if (!btn) return;

  setMode(overlay, "signin");

  overlay.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => setMode(overlay, tab.dataset.tab));
  });
  overlay.querySelector("#auth-modal-close").addEventListener("click", () => closeModal(overlay));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });

  overlay.querySelector("#auth-forgot-btn").addEventListener("click", async () => {
    const email = overlay.querySelector("#auth-email").value.trim();
    if (!email) { showAuthError(overlay, "Enter your email above first."); return; }
    const result = await Auth.sendPasswordReset(email);
    if (result.error) { showAuthError(overlay, result.error); return; }
    showAuthError(overlay, "Reset email sent — check your inbox.", "success");
  });

  overlay.querySelector("#auth-google-btn").addEventListener("click", async () => {
    const result = await Auth.signInWithGoogle();
    if (result.error) { showAuthError(overlay, result.error); return; }
    closeModal(overlay);
    showToast("Signed in — syncing your progress.", "default");
  });

  overlay.querySelector("#auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mode = overlay.dataset.mode;
    const email = overlay.querySelector("#auth-email").value.trim();
    const password = overlay.querySelector("#auth-password").value;
    const name = overlay.querySelector("#auth-name").value.trim();
    const submitBtn = overlay.querySelector("#auth-submit");
    submitBtn.disabled = true;

    const result = mode === "signup"
      ? await Auth.signUpWithEmail(email, password, name)
      : await Auth.signInWithEmail(email, password);

    submitBtn.disabled = false;
    if (result.error) { showAuthError(overlay, result.error); return; }
    closeModal(overlay);
    showToast(mode === "signup" ? "Account created — welcome!" : "Signed in — syncing your progress.", "default");
  });

  dropdown.querySelector("#auth-signout-btn").addEventListener("click", async () => {
    await Auth.signOutUser();
    dropdown.hidden = true;
    showToast("Signed out. Your data stays on this device.", "default");
  });

  btn.addEventListener("click", () => {
    if (Auth.currentUser) {
      const rect = btn.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.right = `${window.innerWidth - rect.right}px`;
      dropdown.hidden = !dropdown.hidden;
    } else {
      setMode(overlay, "signin");
      openModal(overlay);
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      dropdown.hidden = true;
    }
  });

  Auth.onChange((user) => {
    if (user) {
      btn.innerHTML = `<span class="auth-avatar">${avatarInner(user)}</span>`;
      btn.setAttribute("aria-label", `Signed in as ${user.email}`);
      dropdown.querySelector("#auth-dropdown-avatar").innerHTML = avatarInner(user);
      dropdown.querySelector("#auth-dropdown-name").textContent = user.displayName || "";
      dropdown.querySelector("#auth-dropdown-email").textContent = user.email;
    } else {
      btn.innerHTML = ICONS.user;
      btn.setAttribute("aria-label", "Account — sign in");
      dropdown.hidden = true;
    }
  });

  initProfileAccountCard(overlay);
}

function initProfileAccountCard(overlay) {
  const signedOutView = document.getElementById("profile-account-signed-out");
  const signedInView = document.getElementById("profile-account-signed-in");
  if (!signedOutView || !signedInView) return;

  const nameEl = document.getElementById("profile-account-name");
  const nameForm = document.getElementById("profile-edit-name-form");
  const nameInput = document.getElementById("profile-edit-name-input");
  const editNameBtn = document.getElementById("profile-edit-name-btn");
  const deleteBtn = document.getElementById("profile-delete-btn");
  const deleteForm = document.getElementById("profile-delete-form");
  const errorEl = document.getElementById("profile-account-error");

  const showError = (msg) => { errorEl.textContent = msg; errorEl.hidden = false; };
  const clearError = () => { errorEl.hidden = true; };

  document.getElementById("profile-signin-btn").addEventListener("click", () => {
    setMode(overlay, "signin");
    openModal(overlay);
  });

  document.getElementById("profile-signout-btn").addEventListener("click", async () => {
    await Auth.signOutUser();
    showToast("Signed out. Your data stays on this device.", "default");
  });

  document.getElementById("profile-sync-btn").addEventListener("click", async (e) => {
    const syncBtn = e.currentTarget;
    syncBtn.disabled = true;
    syncBtn.textContent = "Syncing…";
    await Auth.syncNow();
    syncBtn.textContent = "Sync now";
    syncBtn.disabled = false;
    showToast("Synced.", "default");
  });

  editNameBtn.addEventListener("click", () => {
    nameInput.value = Auth.currentUser?.displayName || "";
    nameForm.hidden = false;
    nameEl.hidden = true;
    editNameBtn.hidden = true;
    nameInput.focus();
  });

  nameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    clearError();
    const result = await Auth.updateDisplayName(name);
    if (result.error) { showError(result.error); return; }
    nameForm.hidden = true;
    nameEl.hidden = false;
    editNameBtn.hidden = false;
  });

  let deleteArmed = false;
  deleteBtn.addEventListener("click", async () => {
    clearError();
    if (!deleteArmed) {
      deleteArmed = true;
      deleteBtn.textContent = "Click again to confirm — this can't be undone";
      setTimeout(() => {
        deleteArmed = false;
        deleteBtn.textContent = "Delete account";
      }, 4000);
      return;
    }
    deleteArmed = false;
    deleteBtn.textContent = "Delete account";
    const result = await Auth.deleteAccount();
    if (!result.error) { showToast("Account deleted. Your local data stays on this device.", "default"); return; }
    if (result.error === "reauth-required") {
      deleteForm.hidden = false;
      document.getElementById("profile-delete-password").focus();
      return;
    }
    showError(result.error);
  });

  deleteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    const password = document.getElementById("profile-delete-password").value;
    const result = await Auth.deleteAccount(password);
    if (result.error) { showError(result.error); return; }
    deleteForm.hidden = true;
    showToast("Account deleted. Your local data stays on this device.", "default");
  });

  Auth.onChange((user) => {
    signedOutView.hidden = !!user;
    signedInView.hidden = !user;
    if (!user) return;

    document.getElementById("profile-account-avatar").innerHTML = avatarInner(user);
    nameEl.textContent = user.displayName || "No name set";
    document.getElementById("profile-account-email").textContent = user.email;
    document.getElementById("profile-account-provider").textContent = providerLabel(user);

    const syncedEl = document.getElementById("profile-last-synced");
    syncedEl.textContent = Auth.lastSyncedAt
      ? `Last synced at ${new Date(Auth.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Syncing…";
  });
}

initAuthUI();
