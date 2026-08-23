/* Sophie App v2.9.2.2 - device-local six-colour Saved Looks and 32 x 32 Pattern Studio. */
(() => {
  "use strict";

  const SIZE = 32;
  const CELL_COUNT = SIZE * SIZE;
  const LOOK_VERSION = 2;
  const CANDIDATE_VERSION = "v2.9.2.2";
  const ACTIVE_LOOK_KEY = "sophie_style_look_v2";
  const SAVED_LOOKS_KEY = "sophie_style_saved_looks_v2";
  const LEGACY_ACTIVE_KEY = "sophie_style_pattern_v1";
  const LEGACY_SAVED_KEY = "sophie_style_saved_patterns_v1";
  const DEFAULT_PALETTE = Object.freeze([
    "#eeecde", // 1 - app background
    "#fffef7", // 2 - cards and surfaces
    "#101225", // 3 - text seed
    "#3f57ff", // 4 - primary accent
    "#f5ee38", // 5 - highlight
    "#ff6962"  // 6 - special accent
  ]);
  const SLOT_LABELS = Object.freeze([
    "Background",
    "Cards",
    "Text",
    "Primary",
    "Highlight",
    "Accent"
  ]);
  const LEGACY_EXACT_SLOTS = Object.freeze({
    "#fffef7": 2,
    "#101225": 3,
    "#3f57ff": 4,
    "#f5ee38": 5,
    "#ff6962": 6
  });

  const state = {
    cells: [],
    palette: DEFAULT_PALETTE.slice(),
    storedCells: [],
    storedPalette: DEFAULT_PALETTE.slice(),
    selectedSlot: 4,
    tool: "pencil",
    history: [],
    future: [],
    drawing: false,
    touched: -1,
    cursor: 0,
    paletteEditSlot: 0,
    ready: false
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function normaliseHex(value) {
    const text = String(value || "").trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(text) ? text : "";
  }

  function validPalette(value) {
    return Array.isArray(value)
      && value.length === 6
      && value.every(colour => Boolean(normaliseHex(colour)));
  }

  function validSlotCells(value) {
    return Array.isArray(value)
      && value.length === CELL_COUNT
      && value.every(cell => cell === null || Number.isInteger(cell) && cell >= 1 && cell <= 6);
  }

  function validLegacyCells(value) {
    return Array.isArray(value)
      && value.length === CELL_COUNT
      && value.every(cell => cell === null || Boolean(normaliseHex(cell)));
  }

  function defaultPattern() {
    return Array.from({ length: CELL_COUNT }, (_, index) => {
      const x = index % SIZE;
      const y = Math.floor(index / SIZE);
      if ((x === y || x + y === SIZE - 1) && x % 3 !== 0) return 4;
      if (x > 12 && x < 19 && y > 12 && y < 19) return 5;
      if ((x + y) % 17 === 0) return 6;
      return null;
    });
  }

  function cloneLook(look) {
    return {
      version: LOOK_VERSION,
      palette: look.palette.slice(),
      cells: look.cells.slice()
    };
  }

  function defaultLook() {
    return { version: LOOK_VERSION, palette: DEFAULT_PALETTE.slice(), cells: defaultPattern() };
  }

  function readJson(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function rgb(hex) {
    const value = normaliseHex(hex) || "#000000";
    return {
      r: Number.parseInt(value.slice(1, 3), 16),
      g: Number.parseInt(value.slice(3, 5), 16),
      b: Number.parseInt(value.slice(5, 7), 16)
    };
  }

  function hexFromRgb({ r, g, b }) {
    const channel = value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
    return `#${channel(r)}${channel(g)}${channel(b)}`;
  }

  function mixHex(first, second, amount = 0.5) {
    const a = rgb(first);
    const b = rgb(second);
    const t = Math.max(0, Math.min(1, Number(amount) || 0));
    return hexFromRgb({
      r: a.r * (1 - t) + b.r * t,
      g: a.g * (1 - t) + b.g * t,
      b: a.b * (1 - t) + b.b * t
    });
  }

  function linearChannel(value) {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(hex) {
    const value = rgb(hex);
    return 0.2126 * linearChannel(value.r) + 0.7152 * linearChannel(value.g) + 0.0722 * linearChannel(value.b);
  }

  function contrastRatio(first, second) {
    const a = luminance(first);
    const b = luminance(second);
    const light = Math.max(a, b);
    const dark = Math.min(a, b);
    return (light + 0.05) / (dark + 0.05);
  }

  function safeText(background, preferred = []) {
    const candidates = [...preferred, "#101225", "#000000", "#ffffff"]
      .map(normaliseHex)
      .filter(Boolean);
    const passing = candidates.find(colour => contrastRatio(colour, background) >= 4.5);
    if (passing) return passing;
    return candidates.sort((a, b) => contrastRatio(b, background) - contrastRatio(a, background))[0] || "#000000";
  }

  function adjustForContrast(foreground, background, target = 4.5) {
    const fg = normaliseHex(foreground) || "#000000";
    const bg = normaliseHex(background) || "#ffffff";
    if (contrastRatio(fg, bg) >= target) return fg;
    const endpoint = contrastRatio("#000000", bg) >= contrastRatio("#ffffff", bg) ? "#000000" : "#ffffff";
    for (let step = 1; step <= 20; step += 1) {
      const candidate = mixHex(fg, endpoint, step / 20);
      if (contrastRatio(candidate, bg) >= target) return candidate;
    }
    return endpoint;
  }

  function rgbaFromHex(hex, alpha) {
    const value = rgb(hex);
    return `rgba(${value.r}, ${value.g}, ${value.b}, ${alpha})`;
  }

  function nearestSlot(hex, palette = DEFAULT_PALETTE) {
    const source = rgb(hex);
    let bestSlot = 1;
    let bestDistance = Infinity;
    palette.forEach((colour, index) => {
      const target = rgb(colour);
      const distance = Math.pow(source.r - target.r, 2) + Math.pow(source.g - target.g, 2) + Math.pow(source.b - target.b, 2);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSlot = index + 1;
      }
    });
    return bestSlot;
  }

  function migrateLegacyCells(cells, palette = DEFAULT_PALETTE) {
    if (!validLegacyCells(cells)) return defaultPattern();
    return cells.map(cell => {
      if (cell === null) return null;
      const colour = normaliseHex(cell);
      return LEGACY_EXACT_SLOTS[colour] || nearestSlot(colour, palette);
    });
  }

  function normaliseLook(value) {
    if (!value || !validPalette(value.palette) || !validSlotCells(value.cells)) return null;
    return {
      version: LOOK_VERSION,
      palette: value.palette.map(normaliseHex),
      cells: value.cells.slice()
    };
  }

  function readActiveLook() {
    const current = normaliseLook(readJson(ACTIVE_LOOK_KEY));
    if (current) return current;
    const legacy = readJson(LEGACY_ACTIVE_KEY);
    if (validLegacyCells(legacy)) {
      return { version: LOOK_VERSION, palette: DEFAULT_PALETTE.slice(), cells: migrateLegacyCells(legacy) };
    }
    return defaultLook();
  }

  function normaliseSavedLook(value) {
    const look = normaliseLook(value);
    if (!look || typeof value.name !== "string" || typeof value.id !== "string" || !/^[a-z0-9-]{1,80}$/i.test(value.id)) return null;
    return { ...look, id: value.id, name: value.name.slice(0, 32) };
  }

  function readSavedLooks() {
    const current = readJson(SAVED_LOOKS_KEY, []);
    const validCurrent = Array.isArray(current) ? current.map(normaliseSavedLook).filter(Boolean).slice(0, 6) : [];
    if (validCurrent.length || localStorage.getItem(SAVED_LOOKS_KEY)) return validCurrent;

    const legacy = readJson(LEGACY_SAVED_KEY, []);
    if (!Array.isArray(legacy)) return [];
    return legacy.map(item => {
      if (!item || typeof item.name !== "string" || typeof item.id !== "string" || !validLegacyCells(item.cells)) return null;
      return {
        version: LOOK_VERSION,
        id: /^[a-z0-9-]{1,80}$/i.test(item.id) ? item.id : `legacy-${Date.now().toString(36)}`,
        name: item.name.slice(0, 32),
        palette: DEFAULT_PALETTE.slice(),
        cells: migrateLegacyCells(item.cells)
      };
    }).filter(Boolean).slice(0, 6);
  }

  function persistMigrationIfNeeded() {
    if (!localStorage.getItem(ACTIVE_LOOK_KEY) && localStorage.getItem(LEGACY_ACTIVE_KEY)) {
      localStorage.setItem(ACTIVE_LOOK_KEY, JSON.stringify(readActiveLook()));
    }
    if (!localStorage.getItem(SAVED_LOOKS_KEY) && localStorage.getItem(LEGACY_SAVED_KEY)) {
      localStorage.setItem(SAVED_LOOKS_KEY, JSON.stringify(readSavedLooks()));
    }
  }

  function themeValues(palette = state.palette) {
    const [background, surface, textSeed, primary, highlight, accent] = palette;
    const ink = adjustForContrast(textSeed, surface, 4.5);
    const bgInk = adjustForContrast(textSeed, background, 4.5);
    const muted = adjustForContrast(mixHex(ink, surface, 0.28), surface, 4.5);
    const bgMuted = adjustForContrast(mixHex(bgInk, background, 0.28), background, 4.5);
    const surface2 = mixHex(surface, background, 0.18);
    const line = mixHex(ink, surface, 0.78);
    const brandStrong = adjustForContrast(primary, surface, 4.5);
    const brandSoft = mixHex(primary, surface, 0.82);
    const brandContrast = safeText(primary, [textSeed, surface, background]);
    const highlightInk = safeText(highlight, [textSeed, surface, background]);
    const accentContrast = safeText(accent, [textSeed, surface, background]);
    const mint = mixHex(highlight, surface, 0.72);
    const mintInk = safeText(mint, [textSeed, primary]);
    const rose = mixHex(accent, surface, 0.72);
    const roseInk = safeText(rose, [textSeed, accent]);
    const inkContrast = safeText(ink, [surface, background, "#ffffff"]);
    return {
      background, surface, ink, bgInk, muted, bgMuted, surface2, line,
      primary, brandStrong, brandSoft, brandContrast,
      highlight, highlightInk, accent, accentContrast,
      mint, mintInk, rose, roseInk, inkContrast
    };
  }

  function applyTheme(palette = state.palette) {
    if (!validPalette(palette)) return;
    const root = document.documentElement;
    const values = themeValues(palette);
    root.removeAttribute("data-theme");
    root.dataset.sophieLook = "saved-look-v2";
    const variables = {
      "--bg": values.background,
      "--surface": values.surface,
      "--surface-2": values.surface2,
      "--ink": values.ink,
      "--muted": values.muted,
      "--line": values.line,
      "--brand": values.primary,
      "--brand-strong": values.brandStrong,
      "--brand-soft": values.brandSoft,
      "--mint": values.mint,
      "--mint-ink": values.mintInk,
      "--sun": values.highlight,
      "--sun-ink": values.highlightInk,
      "--rose": values.rose,
      "--rose-ink": values.roseInk,
      "--shadow": `7px 7px 0 ${rgbaFromHex(values.ink, 0.18)}`,
      "--shadow-soft": `3px 3px 0 ${rgbaFromHex(values.ink, 0.16)}`,
      "--sophie-bg-ink": values.bgInk,
      "--sophie-bg-muted": values.bgMuted,
      "--sophie-brand-contrast": values.brandContrast,
      "--sophie-accent-six": values.accent,
      "--sophie-accent-six-contrast": values.accentContrast,
      "--sophie-ink-contrast": values.inkContrast
    };
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", values.background);
  }

  function colourForCell(cell, palette = state.palette) {
    return Number.isInteger(cell) && cell >= 1 && cell <= 6 ? palette[cell - 1] : "";
  }

  function patternUrl(cells = state.cells, palette = state.palette) {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const context = canvas.getContext("2d", { alpha: true });
    context.clearRect(0, 0, SIZE, SIZE);
    cells.forEach((cell, index) => {
      const colour = colourForCell(cell, palette);
      if (!colour) return;
      context.fillStyle = colour;
      context.fillRect(index % SIZE, Math.floor(index / SIZE), 1, 1);
    });
    return `url(${canvas.toDataURL("image/png")})`;
  }

  function applyPattern(cells = state.cells, palette = state.palette) {
    const image = patternUrl(cells, palette);
    document.documentElement.style.setProperty("--sophie-pattern-image", image);
    $$("[data-pattern-preview]").forEach(element => {
      element.style.backgroundImage = image;
    });
  }

  function applyLook() {
    applyTheme(state.palette);
    applyPattern(state.cells, state.palette);
  }

  function snapshot() {
    return {
      cells: state.cells.slice(),
      palette: state.palette.slice(),
      selectedSlot: state.selectedSlot
    };
  }

  function restoreSnapshot(value) {
    if (!value || !validSlotCells(value.cells) || !validPalette(value.palette)) return;
    state.cells = value.cells.slice();
    state.palette = value.palette.slice();
    state.selectedSlot = Number.isInteger(value.selectedSlot) && value.selectedSlot >= 1 && value.selectedSlot <= 6 ? value.selectedSlot : 4;
    renderAll();
  }

  function remember() {
    state.history.push(snapshot());
    if (state.history.length > 50) state.history.shift();
    state.future = [];
  }

  function injectStyles() {
    if (document.getElementById("sophie-saved-look-v2-styles")) return;
    const style = document.createElement("style");
    style.id = "sophie-saved-look-v2-styles";
    style.textContent = `
      /* Physical Android scale is bounded by the early head script; do not override its readable root size here. */
      .topbar { color: var(--sophie-bg-ink, var(--ink)); }
      .topbar .eyebrow { color: var(--sophie-bg-muted, var(--muted)); }
      .bottom-nav { color: var(--sophie-bg-ink, var(--ink)); }
      .nav-button:not(.active) { color: var(--sophie-bg-ink, var(--ink)); }
      .nav-button.active { color: var(--sophie-ink-contrast, var(--bg)); }
      .primary-button { color: var(--sophie-brand-contrast, #fff) !important; }
      .home-destination-icon { color: var(--sophie-brand-contrast, #fff); }
      .home-destination:nth-child(2) .home-destination-icon { background: var(--sun); color: var(--sun-ink); }
      .home-destination:nth-child(3) .home-destination-icon { background: var(--sophie-accent-six, var(--rose-ink)); color: var(--sophie-accent-six-contrast, #fff); }
      #active-goal .home-goal-card { box-shadow: 7px 7px 0 var(--sophie-accent-six, #ff6962); }
      .pattern-readability-card { box-shadow: 4px 4px 0 var(--sophie-accent-six, #ff6962); }
      .pattern-palette { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; margin-top: 12px; }
      .pattern-palette-help { grid-column: 1 / -1; margin: 0 0 2px; color: var(--muted); font-size: .78rem; line-height: 1.45; }
      .pattern-theme-slot { min-width: 0; min-height: 64px; display: grid; grid-template-columns: minmax(0, 1fr) 54px; gap: 8px; align-items: center; padding: 7px; border: 1px solid var(--line); border-radius: 2px 10px 2px 10px; background: var(--surface); color: var(--ink); cursor: pointer; }
      .pattern-theme-slot[data-selected="true"] { outline: 3px solid var(--brand-strong); outline-offset: 2px; }
      .pattern-slot-copy { min-width: 0; }
      .pattern-slot-copy strong, .pattern-slot-copy small { display: block; overflow-wrap: anywhere; }
      .pattern-slot-copy strong { font-size: .75rem; }
      .pattern-slot-copy small { margin-top: 1px; color: var(--muted); font-size: .64rem; }
      .pattern-slot-picker { width: 54px; min-width: 54px; height: 54px; padding: 3px; border: 2px solid var(--ink); border-radius: 2px 10px 2px 10px; background: var(--surface); cursor: pointer; }
      .pattern-candidate-version { display: inline-block; margin-top: 5px; padding: 3px 6px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font: 800 .62rem/1.2 monospace; letter-spacing: .04em; }
      .saved-look-palette { display: flex; gap: 2px; margin-top: 4px; }
      .saved-look-palette span { width: 14px; height: 6px; border: 1px solid color-mix(in srgb, var(--ink) 30%, transparent); }
      .saved-pattern-copy { min-width: 0; }
      .saved-pattern-copy strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      html.compact-device .home-destination strong,
      html.compact-device .home-destination small,
      html.compact-device .home-now-card strong,
      html.compact-device .home-now-card small,
      html.compact-device .home-now-note,
      html.compact-device .home-style-card h3,
      html.compact-device .home-style-card p,
      html.compact-device .home-wallet,
      html.compact-device .section-heading,
      html.compact-device button { overflow-wrap: anywhere; white-space: normal; }
      html.compact-device .home-destination strong,
      html.compact-device .home-destination small { overflow: visible; text-overflow: clip; }
      html.compact-device .home-main-column,
      html.compact-device .home-side-stack,
      html.compact-device .home-style-card,
      html.compact-device .home-wallet-copy,
      html.compact-device .home-now-card > span { min-width: 0; }
      @media (max-width: 560px) {
        .pattern-palette { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 360px) {
        .pattern-palette { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function hideLegacyThemeChooser() {
    const themeOptions = $("#theme-options");
    const row = themeOptions?.closest(".setting-row");
    if (row) {
      row.hidden = true;
      row.setAttribute("aria-hidden", "true");
    }
    document.documentElement.removeAttribute("data-theme");
  }

  function updateCopy() {
    document.documentElement.dataset.sophieCandidate = CANDIDATE_VERSION;
    const intro = $("#pattern-studio-intro");
    if (intro) intro.textContent = "Draw one 32 x 32 tile with your six colours. Editing a colour recolours both the pattern and the app. The background repeats at four times the authored size.";
    const palette = $(".pattern-palette");
    if (palette) palette.setAttribute("aria-label", "Six editable look colours");
    const name = $("#pattern-name");
    if (name) {
      name.placeholder = "Name this look";
      name.setAttribute("aria-label", "Saved Look name");
    }
    const save = $("[data-pattern-save]");
    if (save) save.textContent = "Save look";
    const use = $("[data-pattern-use]");
    if (use) use.textContent = "Use this look";
    const note = $(".pattern-studio-note");
    if (note) note.textContent = "Saved Looks keep both the 32 x 32 artwork and all six colours on this device. They are creative choices, not rewards.";
    const title = $("#pattern-studio-title");
    if (title && !$(".pattern-candidate-version")) {
      const marker = document.createElement("span");
      marker.className = "pattern-candidate-version";
      marker.textContent = CANDIDATE_VERSION;
      title.insertAdjacentElement("afterend", marker);
    }
    const homeCard = $(".home-style-card");
    if (homeCard) {
      const heading = homeCard.querySelector("h3");
      const copy = homeCard.querySelector("p");
      if (heading) heading.textContent = "Pattern Studio";
      if (copy) copy.textContent = "Draw a 32 x 32 look. Its six colours theme the whole app.";
    }
    const settingsButton = $("#settings-dialog [data-open-pattern-studio]");
    const settingsRow = settingsButton?.closest(".setting-row");
    if (settingsRow) {
      const strong = settingsRow.querySelector("strong");
      const paragraph = settingsRow.querySelector("p");
      if (strong) strong.textContent = "Visual look";
      if (paragraph) paragraph.textContent = "Edit one repeating pattern and the six colours used across the app. It stays on this device.";
    }
  }

  function buildPaletteEditor() {
    const host = $(".pattern-palette");
    if (!host) return;
    host.innerHTML = "";
    const help = document.createElement("p");
    help.className = "pattern-palette-help";
    help.textContent = "Six colours control both the artwork and the app. Tap any colour box to select and edit that slot.";
    host.appendChild(help);

    state.palette.forEach((colour, index) => {
      const slot = index + 1;
      const wrapper = document.createElement("label");
      wrapper.className = "pattern-theme-slot";
      wrapper.dataset.patternSlotControl = String(slot);
      wrapper.dataset.selected = state.selectedSlot === slot ? "true" : "false";

      const copy = document.createElement("span");
      copy.className = "pattern-slot-copy";
      const strong = document.createElement("strong");
      strong.textContent = `Colour ${slot}`;
      const small = document.createElement("small");
      small.textContent = `${SLOT_LABELS[index]} - tap to edit`;
      copy.append(strong, small);

      const picker = document.createElement("input");
      picker.type = "color";
      picker.className = "pattern-slot-picker";
      picker.dataset.patternSlotPicker = String(slot);
      picker.value = colour;
      picker.setAttribute("aria-label", `Select and edit colour ${slot}, ${SLOT_LABELS[index]}`);

      wrapper.append(copy, picker);
      host.appendChild(wrapper);
    });
  }

  function updatePaletteEditor() {
    $$('[data-pattern-slot-control]').forEach(control => {
      const slot = Number(control.dataset.patternSlotControl);
      control.dataset.selected = state.selectedSlot === slot ? "true" : "false";
    });
    $$('[data-pattern-slot-picker]').forEach(input => {
      const slot = Number(input.dataset.patternSlotPicker);
      const colour = state.palette[slot - 1];
      if (input.value !== colour) input.value = colour;
    });
  }

  function selectSlot(slot) {
    const value = Number(slot);
    if (!Number.isInteger(value) || value < 1 || value > 6) return;
    state.selectedSlot = value;
    updatePaletteEditor();
    if (state.tool === "eraser" || state.tool === "eyedropper") selectTool("pencil");
  }

  function editPaletteSlot(slot, colour) {
    const value = Number(slot);
    const next = normaliseHex(colour);
    if (!Number.isInteger(value) || value < 1 || value > 6 || !next || state.palette[value - 1] === next) return;
    state.palette[value - 1] = next;
    state.selectedSlot = value;
    renderAll();
  }

  function renderCanvas() {
    const canvas = $("#pattern-canvas");
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, SIZE, SIZE);
    state.cells.forEach((cell, index) => {
      const colour = colourForCell(cell);
      if (!colour) return;
      context.fillStyle = colour;
      context.fillRect(index % SIZE, Math.floor(index / SIZE), 1, 1);
    });
    const undoButton = $("[data-pattern-command='undo']");
    const redoButton = $("[data-pattern-command='redo']");
    if (undoButton) undoButton.disabled = !state.history.length;
    if (redoButton) redoButton.disabled = !state.future.length;
    updateCursor();
  }

  function renderAll() {
    applyLook();
    renderCanvas();
    updatePaletteEditor();
  }

  function cellDescription(index = state.cursor) {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    const value = state.cells[index];
    return `Column ${x + 1}, row ${y + 1}, ${value ? `colour ${value}` : "empty"}.`;
  }

  function announceCursor(message = "") {
    const status = $("#pattern-canvas-status");
    if (status) status.textContent = message || cellDescription();
  }

  function updateCursor(announce = false) {
    const cursor = $(".pattern-keyboard-cursor");
    const canvas = $("#pattern-canvas");
    if (!cursor || !canvas) return;
    const x = state.cursor % SIZE;
    const y = Math.floor(state.cursor / SIZE);
    cursor.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
    canvas.setAttribute("aria-label", `Editable 32 by 32 pixel pattern canvas. ${cellDescription()}`);
    if (announce) announceCursor();
  }

  function selectTool(tool) {
    if (!["pencil", "eraser", "fill", "eyedropper"].includes(tool)) return;
    state.tool = tool;
    $$("[data-pattern-tool]").forEach(button => {
      const active = button.dataset.patternTool === tool;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setCell(index, slot) {
    if (index < 0 || index >= CELL_COUNT || state.cells[index] === slot) return false;
    state.cells[index] = slot;
    return true;
  }

  function floodFill(start, replacement) {
    const target = state.cells[start];
    if (target === replacement) return;
    remember();
    const stack = [start];
    const visited = new Uint8Array(CELL_COUNT);
    while (stack.length) {
      const index = stack.pop();
      if (visited[index] || state.cells[index] !== target) continue;
      visited[index] = 1;
      state.cells[index] = replacement;
      const x = index % SIZE;
      const y = Math.floor(index / SIZE);
      if (x > 0) stack.push(index - 1);
      if (x < SIZE - 1) stack.push(index + 1);
      if (y > 0) stack.push(index - SIZE);
      if (y < SIZE - 1) stack.push(index + SIZE);
    }
    renderAll();
  }

  function canvasIndex(event) {
    const canvas = $("#pattern-canvas");
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(SIZE - 1, Math.floor((event.clientX - rect.left) / rect.width * SIZE)));
    const y = Math.max(0, Math.min(SIZE - 1, Math.floor((event.clientY - rect.top) / rect.height * SIZE)));
    return y * SIZE + x;
  }

  function beginPaint(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const index = canvasIndex(event);
    state.cursor = index;
    updateCursor();
    if (state.tool === "fill") return floodFill(index, state.selectedSlot);
    if (state.tool === "eyedropper") {
      if (state.cells[index]) selectSlot(state.cells[index]);
      return;
    }
    event.preventDefault();
    remember();
    state.drawing = true;
    state.touched = -1;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    continuePaint(event);
  }

  function continuePaint(event) {
    if (!state.drawing) return;
    event.preventDefault();
    const index = canvasIndex(event);
    state.cursor = index;
    if (index === state.touched) return;
    state.touched = index;
    if (setCell(index, state.tool === "eraser" ? null : state.selectedSlot)) renderAll();
  }

  function endPaint() {
    state.drawing = false;
    state.touched = -1;
  }

  function useToolAt(index) {
    if (state.tool === "fill") {
      if (state.cells[index] === state.selectedSlot) return announceCursor("That area already uses the selected colour. " + cellDescription(index));
      floodFill(index, state.selectedSlot);
      announceCursor("Area filled. " + cellDescription(index));
      return;
    }
    if (state.tool === "eyedropper") {
      if (state.cells[index]) {
        selectSlot(state.cells[index]);
        announceCursor(`Colour ${state.cells[index]} selected. ` + cellDescription(index));
      } else announceCursor("That pixel is empty.");
      return;
    }
    const replacement = state.tool === "eraser" ? null : state.selectedSlot;
    if (state.cells[index] === replacement) return announceCursor();
    remember();
    setCell(index, replacement);
    renderAll();
    announceCursor(state.tool === "eraser" ? "Pixel erased. " + cellDescription(index) : "Pixel drawn. " + cellDescription(index));
  }

  function handleCanvasKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
      announceCursor(event.shiftKey ? "Redo." : "Undo.");
      return;
    }
    const x = state.cursor % SIZE;
    const y = Math.floor(state.cursor / SIZE);
    let next = state.cursor;
    if (event.key === "ArrowLeft") next = y * SIZE + Math.max(0, x - 1);
    else if (event.key === "ArrowRight") next = y * SIZE + Math.min(SIZE - 1, x + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, y - 1) * SIZE + x;
    else if (event.key === "ArrowDown") next = Math.min(SIZE - 1, y + 1) * SIZE + x;
    else if (event.key === "Home") next = y * SIZE;
    else if (event.key === "End") next = y * SIZE + SIZE - 1;
    else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      useToolAt(state.cursor);
      return;
    } else return;
    event.preventDefault();
    state.cursor = next;
    updateCursor(true);
  }

  function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    restoreSnapshot(state.history.pop());
  }

  function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    restoreSnapshot(state.future.pop());
  }

  function resetEditor(look) {
    state.cells = look.cells.slice();
    state.palette = look.palette.slice();
    state.selectedSlot = 4;
    state.history = [];
    state.future = [];
    renderAll();
  }

  function renderSavedLooks() {
    const host = $("#saved-patterns");
    if (!host) return;
    const saved = readSavedLooks();
    host.innerHTML = "";
    if (!saved.length) {
      const empty = document.createElement("p");
      empty.className = "pattern-studio-note";
      empty.textContent = "No Saved Looks yet. Your active look is still kept on this device.";
      host.appendChild(empty);
      return;
    }

    saved.forEach(item => {
      const row = document.createElement("div");
      row.className = "saved-pattern";
      const swatch = document.createElement("span");
      swatch.className = "saved-pattern-swatch";
      swatch.style.backgroundImage = patternUrl(item.cells, item.palette);
      swatch.setAttribute("aria-hidden", "true");

      const copy = document.createElement("span");
      copy.className = "saved-pattern-copy";
      const title = document.createElement("strong");
      title.textContent = item.name;
      const palette = document.createElement("span");
      palette.className = "saved-look-palette";
      palette.setAttribute("aria-label", "Six saved colours");
      item.palette.forEach(colour => {
        const chip = document.createElement("span");
        chip.style.background = colour;
        chip.setAttribute("aria-hidden", "true");
        palette.appendChild(chip);
      });
      copy.append(title, palette);

      const actions = document.createElement("span");
      actions.className = "saved-pattern-actions";
      const load = document.createElement("button");
      load.type = "button";
      load.dataset.patternLoad = item.id;
      load.textContent = "Load";
      load.setAttribute("aria-label", `Load ${item.name}`);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.patternDelete = item.id;
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Delete ${item.name}`);
      actions.append(load, remove);
      row.append(swatch, copy, actions);
      host.appendChild(row);
    });
  }

  function saveNamed() {
    const input = $("#pattern-name");
    const name = input?.value.trim().slice(0, 32) || "";
    if (!name) {
      input?.focus();
      return;
    }
    const saved = readSavedLooks();
    saved.unshift({
      version: LOOK_VERSION,
      id: globalThis.crypto?.randomUUID?.() || `look-${Date.now()}`,
      name,
      palette: state.palette.slice(),
      cells: state.cells.slice()
    });
    localStorage.setItem(SAVED_LOOKS_KEY, JSON.stringify(saved.slice(0, 6)));
    input.value = "";
    renderSavedLooks();
  }

  function loadNamed(id) {
    const found = readSavedLooks().find(item => item.id === id);
    if (!found) return;
    remember();
    state.cells = found.cells.slice();
    state.palette = found.palette.slice();
    state.selectedSlot = 4;
    renderAll();
    announceCursor(`${found.name} loaded. Its pattern and six app colours are previewing now.`);
  }

  function deleteNamed(id) {
    localStorage.setItem(SAVED_LOOKS_KEY, JSON.stringify(readSavedLooks().filter(item => item.id !== id)));
    renderSavedLooks();
  }

  function open() {
    const dialog = $("#pattern-studio-dialog");
    if (!dialog) return;
    const settings = $("#settings-dialog");
    if (settings?.open) settings.close();
    const active = readActiveLook();
    state.storedCells = active.cells.slice();
    state.storedPalette = active.palette.slice();
    resetEditor(active);
    renderSavedLooks();
    selectTool("pencil");
    dialog.showModal();
  }

  function cancel() {
    state.cells = state.storedCells.slice();
    state.palette = state.storedPalette.slice();
    state.history = [];
    state.future = [];
    renderAll();
    $("#pattern-studio-dialog")?.close();
  }

  function useLook() {
    const active = { version: LOOK_VERSION, palette: state.palette.slice(), cells: state.cells.slice() };
    localStorage.setItem(ACTIVE_LOOK_KEY, JSON.stringify(active));
    state.storedCells = state.cells.slice();
    state.storedPalette = state.palette.slice();
    applyLook();
    $("#pattern-studio-dialog")?.close();
  }

  function command(name) {
    if (name === "undo") return undo();
    if (name === "redo") return redo();
    if (name === "clear") {
      remember();
      state.cells = Array(CELL_COUNT).fill(null);
      return renderAll();
    }
    if (name === "reset") {
      remember();
      state.cells = defaultPattern();
      return renderAll();
    }
  }

  function init() {
    if (state.ready) return;
    const canvas = $("#pattern-canvas");
    if (!canvas) return;
    state.ready = true;
    injectStyles();
    hideLegacyThemeChooser();
    updateCopy();
    persistMigrationIfNeeded();

    const active = readActiveLook();
    state.cells = active.cells.slice();
    state.palette = active.palette.slice();
    state.storedCells = state.cells.slice();
    state.storedPalette = state.palette.slice();
    buildPaletteEditor();
    renderAll();
    renderSavedLooks();
    selectTool("pencil");
    selectSlot(4);

    canvas.addEventListener("pointerdown", beginPaint);
    canvas.addEventListener("pointermove", continuePaint);
    canvas.addEventListener("pointerup", endPaint);
    canvas.addEventListener("pointercancel", endPaint);
    canvas.addEventListener("keydown", handleCanvasKeydown);
    canvas.addEventListener("focus", () => updateCursor(true));
    canvas.addEventListener("contextmenu", event => event.preventDefault());

    document.addEventListener("click", event => {
      const openButton = event.target.closest("[data-open-pattern-studio]");
      if (openButton) open();
      const tool = event.target.closest("[data-pattern-tool]");
      if (tool) selectTool(tool.dataset.patternTool);
      const action = event.target.closest("[data-pattern-command]");
      if (action) command(action.dataset.patternCommand);
      if (event.target.closest("[data-pattern-save]")) saveNamed();
      const load = event.target.closest("[data-pattern-load]");
      if (load) loadNamed(load.dataset.patternLoad);
      const remove = event.target.closest("[data-pattern-delete]");
      if (remove) deleteNamed(remove.dataset.patternDelete);
      if (event.target.closest("[data-pattern-cancel]")) cancel();
      if (event.target.closest("[data-pattern-use]")) useLook();
    });

    const beginPaletteEdit = event => {
      const picker = event.target.closest?.("[data-pattern-slot-picker]");
      if (!picker) return;
      const slot = Number(picker.dataset.patternSlotPicker);
      if (state.paletteEditSlot !== slot) {
        remember();
        state.paletteEditSlot = slot;
      }
      selectSlot(slot);
    };

    document.addEventListener("pointerdown", beginPaletteEdit);
    document.addEventListener("focusin", beginPaletteEdit);

    document.addEventListener("input", event => {
      const picker = event.target.closest?.("[data-pattern-slot-picker]");
      if (!picker) return;
      editPaletteSlot(picker.dataset.patternSlotPicker, picker.value);
    });

    document.addEventListener("change", event => {
      if (event.target.closest?.("[data-pattern-slot-picker]")) state.paletteEditSlot = 0;
    });

    $("#pattern-name")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveNamed();
      }
    });
    $("#pattern-studio-dialog")?.addEventListener("cancel", event => {
      event.preventDefault();
      cancel();
    });
  }

  window.SophieStyleLab = {
    init,
    open,
    applyPattern,
    applyTheme,
    contrastRatio,
    migrateLegacyCells,
    readActiveLook,
    readSavedLooks,
    getState: () => cloneLook(state),
    constants: Object.freeze({ SIZE, CELL_COUNT, LOOK_VERSION, CANDIDATE_VERSION, ACTIVE_LOOK_KEY, SAVED_LOOKS_KEY })
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
