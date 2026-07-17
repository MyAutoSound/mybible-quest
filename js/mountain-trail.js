/* ==========================================================================
   Mountain trail — visual step progress for Quests & Reading Plans
   A winding hiking path up a mountain; each step is a waypoint on the trail,
   the summit represents completion. Waypoints you've already reached (or the
   current one) are clickable to jump back and revisit.
   ========================================================================== */

function mountainTrailSVGMarkup() {
  return `
    <svg class="trail-svg" viewBox="0 0 1000 380" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path class="trail-mountain-back" d="M0,380 L0,230 C150,160 260,110 400,140 C550,170 630,95 760,65 C860,42 930,75 1000,115 L1000,380 Z"></path>
      <path class="trail-mountain-front" d="M0,380 L0,300 C120,262 225,232 340,262 C460,292 525,238 650,220 C770,202 865,238 1000,258 L1000,380 Z"></path>
      <path class="trail-path-line" id="trail-path-line" d="M60,358 C170,340 150,296 262,272 C374,248 330,204 442,182 C556,160 512,124 622,110 C704,100 690,82 760,66"></path>
      <g class="trail-waypoints" id="trail-waypoints"></g>
    </svg>
  `;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {number} opts.totalSteps
 * @param {number} opts.currentIndex - 0-based index of the active step
 * @param {boolean} opts.completed - whether the whole quest/plan is finished
 * @param {(index: number) => void} opts.onSelect - called when a reachable waypoint is clicked
 * @param {string} [opts.unitLabel] - noun used in each waypoint's aria-label (defaults to "Step")
 */
function renderMountainTrail(container, { totalSteps, currentIndex, completed, onSelect, unitLabel = "Step" }) {
  container.innerHTML = mountainTrailSVGMarkup();
  const pathEl = container.querySelector("#trail-path-line");
  const group = container.querySelector("#trail-waypoints");
  const totalLen = pathEl.getTotalLength();

  for (let i = 0; i < totalSteps; i++) {
    const frac = totalSteps === 1 ? 0.5 : 0.06 + (0.8 * i) / (totalSteps - 1);
    const pt = pathEl.getPointAtLength(frac * totalLen);
    const state = completed || i < currentIndex ? "done" : i === currentIndex ? "current" : "locked";

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", `trail-waypoint ${state}`);
    g.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${unitLabel} ${i + 1}${state === "done" ? " — completed" : state === "current" ? ` — current ${unitLabel.toLowerCase()}` : " — locked"}`);
    if (state !== "locked") g.setAttribute("tabindex", "0");

    g.innerHTML = `
      ${state === "current" ? '<circle class="pulse-ring" r="15"></circle>' : ""}
      <circle class="waypoint-circle" r="15"></circle>
      ${state === "done"
        ? '<path class="waypoint-check" d="M-5,0.5 L-1.5,4.5 L6,-5"></path>'
        : `<text class="waypoint-num" dy="5">${i + 1}</text>`}
    `;

    if (state !== "locked" && typeof onSelect === "function") {
      g.style.cursor = "pointer";
      g.addEventListener("click", () => onSelect(i));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i); }
      });
    }
    group.appendChild(g);
  }

  const summitPt = pathEl.getPointAtLength(totalLen);
  const summitG = document.createElementNS(SVG_NS, "g");
  summitG.setAttribute("class", `trail-summit ${completed ? "done" : "locked"}`);
  summitG.setAttribute("transform", `translate(${summitPt.x}, ${summitPt.y - 24})`);
  summitG.setAttribute("aria-label", completed ? "Summit reached" : "Summit — not yet reached");
  summitG.innerHTML = `
    <circle class="summit-circle" r="17"></circle>
    <path class="summit-flag" d="M0,-9 L0,9 M0,-9 L8,-5 L0,-1 Z"></path>
  `;
  group.appendChild(summitG);
}

/**
 * The "journey" trail used on the Profile page — an open-ended path for
 * overall level progression, with no visible summit. Past your current
 * level, the trail (and the mountain itself) fades into fog: what's ahead
 * is deliberately unknown rather than a fixed, visible endpoint.
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {number} opts.level - 1-based current level
 * @param {number} opts.maxLevel - total number of level waypoints to lay out
 */
function renderJourneyTrail(container, { level, maxLevel }) {
  container.innerHTML = mountainTrailSVGMarkup();
  const svg = container.querySelector(".trail-svg");
  const pathEl = container.querySelector("#trail-path-line");
  const group = container.querySelector("#trail-waypoints");
  const totalLen = pathEl.getTotalLength();

  const fracFor = (i) => maxLevel === 1 ? 0.5 : 0.06 + (0.8 * i) / (maxLevel - 1);

  for (let i = 0; i < maxLevel; i++) {
    const lvl = i + 1;
    const pt = pathEl.getPointAtLength(fracFor(i) * totalLen);
    const state = lvl < level ? "done" : lvl === level ? "current" : "locked";

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", `trail-waypoint ${state}`);
    g.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
    g.setAttribute("aria-label", state === "done" ? `Level ${lvl} — reached` : state === "current" ? `Level ${lvl} — current` : "A future level — not yet revealed");
    g.innerHTML = `
      ${state === "current" ? '<circle class="pulse-ring" r="15"></circle>' : ""}
      <circle class="waypoint-circle" r="15"></circle>
      ${state === "done"
        ? '<path class="waypoint-check" d="M-5,0.5 L-1.5,4.5 L6,-5"></path>'
        : `<text class="waypoint-num" dy="5">${state === "current" ? lvl : "?"}</text>`}
    `;
    group.appendChild(g);
  }

  // Fog: fully transparent up to just past the current level, then ramps to
  // fully opaque — obscuring both the remaining waypoints and the mountain/
  // summit behind them, so the path visibly disappears rather than ending.
  const fogStart = Math.min(0.94, fracFor(Math.max(0, level - 1)) + 0.09);
  const fogEnd = Math.min(1, fogStart + 0.24);
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.innerHTML = `
    <linearGradient id="journey-fog" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-opacity="0" style="stop-color:var(--bg-elevated)"></stop>
      <stop offset="${fogStart}" stop-opacity="0" style="stop-color:var(--bg-elevated)"></stop>
      <stop offset="${fogEnd}" stop-opacity="0.94" style="stop-color:var(--bg-elevated)"></stop>
      <stop offset="1" stop-opacity="1" style="stop-color:var(--bg-elevated)"></stop>
    </linearGradient>
  `;
  svg.insertBefore(defs, svg.firstChild);

  const fogRect = document.createElementNS(SVG_NS, "rect");
  fogRect.setAttribute("x", "0");
  fogRect.setAttribute("y", "0");
  fogRect.setAttribute("width", "1000");
  fogRect.setAttribute("height", "380");
  fogRect.setAttribute("fill", "url(#journey-fog)");
  fogRect.setAttribute("pointer-events", "none");
  svg.appendChild(fogRect);
}
