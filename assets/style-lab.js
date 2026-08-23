/* Sophie App v2.9 — device-local 32 × 32 Pattern Studio. */
(() => {
  "use strict";

  const SIZE = 32;
  const CELL_COUNT = SIZE * SIZE;
  const ACTIVE_KEY = "sophie_style_pattern_v1";
  const SAVED_KEY = "sophie_style_saved_patterns_v1";
  const PALETTE = ["#101225", "#3f57ff", "#f5ee38", "#ff6962", "#fffef7"];
  const state = {
    cells: [],
    storedCells: [],
    tool: "pencil",
    colour: PALETTE[1],
    history: [],
    future: [],
    drawing: false,
    touched: -1,
    cursor: 0,
    ready: false
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function defaultPattern() {
    return Array.from({ length: CELL_COUNT }, (_, index) => {
      const x = index % SIZE;
      const y = Math.floor(index / SIZE);
      if ((x === y || x + y === SIZE - 1) && x % 3 !== 0) return PALETTE[1];
      if (x > 12 && x < 19 && y > 12 && y < 19) return PALETTE[2];
      if ((x + y) % 17 === 0) return PALETTE[3];
      return null;
    });
  }

  function validCells(value) {
    return Array.isArray(value)
      && value.length === CELL_COUNT
      && value.every(cell => cell === null || /^#[0-9a-f]{6}$/i.test(String(cell)));
  }

  function readActive() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null");
      return validCells(parsed) ? parsed : defaultPattern();
    } catch {
      return defaultPattern();
    }
  }

  function readSaved() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      return Array.isArray(parsed)
        ? parsed.filter(item => item
          && typeof item.name === "string"
          && typeof item.id === "string"
          && /^[a-z0-9-]{1,80}$/i.test(item.id)
          && validCells(item.cells)).slice(0, 6)
        : [];
    } catch {
      return [];
    }
  }

  function patternUrl(cells = state.cells) {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const context = canvas.getContext("2d", { alpha: true });
    context.clearRect(0, 0, SIZE, SIZE);
    cells.forEach((cell, index) => {
      if (!cell) return;
      context.fillStyle = cell;
      context.fillRect(index % SIZE, Math.floor(index / SIZE), 1, 1);
    });
    return `url(${canvas.toDataURL("image/png")})`;
  }

  function applyPattern(cells = state.cells) {
    const image = patternUrl(cells);
    document.documentElement.style.setProperty("--sophie-pattern-image", image);
    $$("[data-pattern-preview]").forEach(element => {
      element.style.backgroundImage = image;
    });
  }

  function renderCanvas() {
    const canvas = $("#pattern-canvas");
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, SIZE, SIZE);
    state.cells.forEach((cell, index) => {
      if (!cell) return;
      context.fillStyle = cell;
      context.fillRect(index % SIZE, Math.floor(index / SIZE), 1, 1);
    });
    applyPattern();
    const undo = $("[data-pattern-command='undo']");
    const redo = $("[data-pattern-command='redo']");
    if (undo) undo.disabled = !state.history.length;
    if (redo) redo.disabled = !state.future.length;
    updateCursor();
  }

  function cellDescription(index = state.cursor) {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    const value = state.cells[index] || "empty";
    return `Column ${x + 1}, row ${y + 1}, ${value}.`;
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
    state.tool = tool;
    $$("[data-pattern-tool]").forEach(button => {
      const active = button.dataset.patternTool === tool;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function selectColour(colour) {
    if (!/^#[0-9a-f]{6}$/i.test(String(colour))) return;
    state.colour = colour.toLowerCase();
    $$("[data-pattern-colour]").forEach(button => {
      const active = button.dataset.patternColour.toLowerCase() === state.colour;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const picker = $("#pattern-custom-colour");
    if (picker) picker.value = state.colour;
    if (state.tool === "eraser" || state.tool === "eyedropper") selectTool("pencil");
  }

  function remember() {
    state.history.push(state.cells.slice());
    if (state.history.length > 50) state.history.shift();
    state.future = [];
  }

  function setCell(index, colour) {
    if (index < 0 || index >= CELL_COUNT || state.cells[index] === colour) return false;
    state.cells[index] = colour;
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
    renderCanvas();
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
    if (state.tool === "fill") return floodFill(index, state.colour);
    if (state.tool === "eyedropper") {
      if (state.cells[index]) selectColour(state.cells[index]);
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
    if (setCell(index, state.tool === "eraser" ? null : state.colour)) renderCanvas();
  }

  function endPaint() {
    state.drawing = false;
    state.touched = -1;
  }

  function useToolAt(index) {
    if (state.tool === "fill") {
      if (state.cells[index] === state.colour) {
        announceCursor("That area already uses the selected colour. " + cellDescription(index));
        return;
      }
      floodFill(index, state.colour);
      announceCursor("Area filled. " + cellDescription(index));
      return;
    }
    if (state.tool === "eyedropper") {
      if (state.cells[index]) {
        selectColour(state.cells[index]);
        announceCursor("Colour selected. " + cellDescription(index));
      } else {
        announceCursor("That pixel is empty.");
      }
      return;
    }
    const replacement = state.tool === "eraser" ? null : state.colour;
    if (state.cells[index] === replacement) {
      announceCursor();
      return;
    }
    remember();
    setCell(index, replacement);
    renderCanvas();
    announceCursor(state.tool === "eraser" ? "Pixel erased. " + cellDescription(index) : "Pixel drawn. " + cellDescription(index));
  }

  function handleCanvasKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
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
    state.future.push(state.cells.slice());
    state.cells = state.history.pop();
    renderCanvas();
  }

  function redo() {
    if (!state.future.length) return;
    state.history.push(state.cells.slice());
    state.cells = state.future.pop();
    renderCanvas();
  }

  function resetEditor(cells) {
    state.cells = cells.slice();
    state.history = [];
    state.future = [];
    renderCanvas();
  }

  function renderSavedPatterns() {
    const host = $("#saved-patterns");
    if (!host) return;
    const saved = readSaved();
    host.innerHTML = saved.length ? saved.map(item => `
      <div class="saved-pattern">
        <span class="saved-pattern-swatch" style="background-image:${patternUrl(item.cells)}" aria-hidden="true"></span>
        <strong>${escapeHtml(item.name)}</strong>
        <span class="saved-pattern-actions">
          <button type="button" data-pattern-load="${item.id}" aria-label="Load ${escapeHtml(item.name)}">Use</button>
          <button type="button" data-pattern-delete="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">×</button>
        </span>
      </div>`).join("") : `<p class="pattern-studio-note">No saved designs yet. Your active pattern is still kept on this device.</p>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function saveNamed() {
    const input = $("#pattern-name");
    const name = input.value.trim().slice(0, 32);
    if (!name) {
      input.focus();
      return;
    }
    const saved = readSaved();
    saved.unshift({ id: globalThis.crypto?.randomUUID?.() || `pattern-${Date.now()}`, name, cells: state.cells.slice() });
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, 6)));
    input.value = "";
    renderSavedPatterns();
  }

  function loadNamed(id) {
    const found = readSaved().find(item => item.id === id);
    if (!found) return;
    remember();
    state.cells = found.cells.slice();
    renderCanvas();
  }

  function deleteNamed(id) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(readSaved().filter(item => item.id !== id)));
    renderSavedPatterns();
  }

  function open() {
    const dialog = $("#pattern-studio-dialog");
    if (!dialog) return;
    const settings = $("#settings-dialog");
    if (settings?.open) settings.close();
    state.storedCells = readActive();
    resetEditor(state.storedCells);
    renderSavedPatterns();
    selectTool("pencil");
    dialog.showModal();
  }

  function cancel() {
    const dialog = $("#pattern-studio-dialog");
    state.cells = state.storedCells.slice();
    applyPattern(state.cells);
    dialog?.close();
  }

  function usePattern() {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(state.cells));
    state.storedCells = state.cells.slice();
    applyPattern();
    $("#pattern-studio-dialog")?.close();
  }

  function command(name) {
    if (name === "undo") return undo();
    if (name === "redo") return redo();
    if (name === "clear") {
      remember();
      state.cells = Array(CELL_COUNT).fill(null);
      return renderCanvas();
    }
    if (name === "reset") {
      remember();
      state.cells = defaultPattern();
      return renderCanvas();
    }
  }

  function init() {
    if (state.ready) return;
    const canvas = $("#pattern-canvas");
    if (!canvas) return;
    state.ready = true;
    state.cells = readActive();
    state.storedCells = state.cells.slice();
    applyPattern();
    renderCanvas();
    selectTool("pencil");
    selectColour(PALETTE[1]);

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
      const colour = event.target.closest("[data-pattern-colour]");
      if (colour) selectColour(colour.dataset.patternColour);
      const action = event.target.closest("[data-pattern-command]");
      if (action) command(action.dataset.patternCommand);
      if (event.target.closest("[data-pattern-save]")) saveNamed();
      const load = event.target.closest("[data-pattern-load]");
      if (load) loadNamed(load.dataset.patternLoad);
      const remove = event.target.closest("[data-pattern-delete]");
      if (remove) deleteNamed(remove.dataset.patternDelete);
      if (event.target.closest("[data-pattern-cancel]")) cancel();
      if (event.target.closest("[data-pattern-use]")) usePattern();
    });

    $("#pattern-custom-colour")?.addEventListener("input", event => selectColour(event.target.value));
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

  window.SophieStyleLab = { init, open, applyPattern };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
