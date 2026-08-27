/* Issue #50: preserve keyboard focus when status-tab rendering replaces the tab nodes. */
(() => {
  "use strict";

  const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
  const VIEWS = ["now", "submitted", "feedback", "overdue"];

  document.addEventListener("keydown", event => {
    const button = event.target.closest?.("#school-view-toggle [data-school-view]");
    if (!button || !KEYS.has(event.key)) return;

    let index = VIEWS.indexOf(String(button.dataset.schoolView || ""));
    if (index < 0) return;

    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = VIEWS.length - 1;
    else index = (index + (event.key === "ArrowRight" ? 1 : -1) + VIEWS.length) % VIEWS.length;

    const targetView = VIEWS[index];
    setTimeout(() => {
      document.querySelector(`#school-view-toggle [data-school-view="${targetView}"]`)?.focus();
    }, 0);
  }, { capture: true });
})();
