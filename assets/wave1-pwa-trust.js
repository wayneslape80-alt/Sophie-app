/* Sophie App Wave 1 PWA trust layer.
 * Frontend-only lifecycle/offline UX. No credential or site-storage access.
 */
(() => {
  "use strict";

  const TRUST_BUILD = "wave1-pwa-trust-draft";
  const TECHNIQUE_VIEWS = new Set(["technique-safety", "technique-candidates", "technique-support"]);
  const NETWORK_REQUIRED_SELECTORS = [
    "[data-v28-learn-technique]",
    "[data-v28-technique-safety]",
    "[data-v28-check-technique]",
    "[data-rec-request]",
    "[data-rec-catalogue]",
    "[data-rec-add-to-learn]"
  ].join(",");
  const STALE_CHOICE_SELECTORS = [
    "[data-v28-technique-safety]",
    "[data-v28-check-technique]",
    "[data-v28-technique-candidate]",
    "[data-rec-add-to-learn]"
  ].join(",");

  let registration = null;
  let waitingWorker = null;
  let updateDeferred = false;
  let reloadRequested = false;
  let refreshQueued = false;
  let authorityNeedsReopen = false;

  function isOnline() {
    return navigator.onLine !== false;
  }

  function techniqueChoiceActive() {
    const dialog = document.querySelector("#recommendation-dialog");
    return Boolean(dialog?.open && TECHNIQUE_VIEWS.has(String(app.rec?.view || "")));
  }

  function currentPathwayState() {
    return app.v28Pathways?.[String(app.skillsDomain || "")] || null;
  }

  function loadedTechniqueContentAvailable() {
    const state = currentPathwayState();
    return state?.status === "ready" && Array.isArray(state.techniques) && state.techniques.length > 0;
  }

  function ensureTrustUi() {
    if (!document.getElementById("wave1-trust-styles")) {
      const style = document.createElement("style");
      style.id = "wave1-trust-styles";
      style.textContent = `
        .wave1-trust-stack{display:grid;gap:10px;margin:0 0 16px}
        .wave1-trust-banner{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:13px 14px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow-soft)}
        .wave1-trust-banner[hidden]{display:none}
        .wave1-trust-banner strong{display:block;margin-bottom:3px}
        .wave1-trust-banner p{margin:0;color:var(--muted);line-height:1.45}
        .wave1-trust-actions{display:flex;flex-wrap:wrap;gap:8px;flex:0 0 auto}
        .wave1-trust-actions button{min-height:44px}
        .wave1-choice-network{margin:10px 0;padding:11px 12px;border:1px solid var(--line);border-radius:13px;background:var(--surface-2);color:var(--ink);line-height:1.45}
        .wave1-choice-network strong{display:block;margin-bottom:3px}
        @media(max-width:620px){.wave1-trust-banner{display:grid}.wave1-trust-actions{width:100%}.wave1-trust-actions button{flex:1 1 130px}}
        html.compact-device .wave1-trust-banner,html.compact-device .wave1-choice-network{font-size:16px}
      `;
      document.head.appendChild(style);
    }

    let stack = document.getElementById("wave1-trust-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "wave1-trust-stack";
      stack.className = "wave1-trust-stack";
      const main = document.querySelector("main");
      if (main) main.prepend(stack);
      else document.body.prepend(stack);
    }

    for (const id of ["wave1-offline-banner", "wave1-update-banner"]) {
      if (document.getElementById(id)) continue;
      const banner = document.createElement("div");
      banner.id = id;
      banner.className = "wave1-trust-banner";
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      banner.setAttribute("aria-atomic", "true");
      banner.hidden = true;
      stack.appendChild(banner);
    }
  }

  function setBanner(banner, { title, message, actions = [] } = {}) {
    if (!banner) return;
    if (!title && !message) {
      banner.hidden = true;
      banner.replaceChildren();
      delete banner.dataset.wave1Signature;
      return;
    }

    const signature = JSON.stringify([title, message, actions.map(action => [action.label, action.action, Boolean(action.primary)])]);
    if (banner.dataset.wave1Signature === signature && !banner.hidden) return;

    const copy = document.createElement("div");
    if (title) {
      const strong = document.createElement("strong");
      strong.textContent = title;
      copy.appendChild(strong);
    }
    if (message) {
      const p = document.createElement("p");
      p.textContent = message;
      copy.appendChild(p);
    }

    const nodes = [copy];
    if (actions.length) {
      const controls = document.createElement("div");
      controls.className = "wave1-trust-actions";
      for (const action of actions) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = action.primary ? "primary-button" : "secondary-button";
        button.textContent = action.label;
        button.dataset.wave1TrustAction = action.action;
        controls.appendChild(button);
      }
      nodes.push(controls);
    }

    banner.replaceChildren(...nodes);
    banner.dataset.wave1Signature = signature;
    banner.hidden = false;
  }

  function renderOfflineBanner() {
    const banner = document.getElementById("wave1-offline-banner");
    if (!banner) return;
    if (isOnline() || (app.activeView !== "skills" && !techniqueChoiceActive())) {
      setBanner(banner);
      return;
    }

    if (techniqueChoiceActive()) {
      setBanner(banner, app.rec.view === "technique-safety"
        ? {
            title: "You're offline.",
            message: "Connect to check which practice activities are available for each safety setup."
          }
        : {
            title: "You're offline.",
            message: "You can still read this choice, but the app needs a connection before it can check or add it to Learn."
          });
      return;
    }

    if (loadedTechniqueContentAvailable()) {
      setBanner(banner, {
        title: "You're offline.",
        message: "You can look at techniques already loaded, but checking learning choices needs a connection."
      });
      return;
    }

    setBanner(banner, {
      title: "You're offline.",
      message: "These techniques haven't been loaded on this device yet. Connect and try again.",
      actions: [{ label: "Try again", action: "offline-retry", primary: false }]
    });
  }

  function renderChoiceNetworkStatus() {
    document.querySelectorAll(".wave1-choice-network").forEach(node => node.remove());
    if (!techniqueChoiceActive()) return;

    const body = document.querySelector("#recommendation-dialog-body");
    if (!body) return;

    let message = "";
    if (!isOnline()) {
      message = app.rec.view === "technique-safety"
        ? "Connect to check which practice activities are available for each safety setup."
        : "You can still read this choice, but the app needs a connection before it can check or add it to Learn.";
    } else if (authorityNeedsReopen) {
      message = "Connection is back. Close this learning choice and open it again to check current availability.";
    }
    if (!message) return;

    const status = document.createElement("div");
    status.className = "wave1-choice-network";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const strong = document.createElement("strong");
    strong.textContent = !isOnline() ? "You're offline." : "Check this choice again.";
    status.append(strong, document.createTextNode(message));
    const copy = body.querySelector(".rec-copy");
    if (copy) copy.insertAdjacentElement("afterend", status);
    else body.prepend(status);

    body.querySelectorAll(".v28-safety-option-note,.rec-eligibility").forEach(node => { node.hidden = true; });
  }

  function rememberAndDisable(button) {
    if (!(button instanceof HTMLButtonElement)) return;
    if (!button.hasAttribute("data-wave1-network-disabled")) {
      button.dataset.wave1NetworkDisabled = "true";
      button.dataset.wave1PriorDisabled = button.disabled ? "true" : "false";
      button.dataset.wave1PriorAriaDisabled = button.hasAttribute("aria-disabled")
        ? String(button.getAttribute("aria-disabled"))
        : "__none__";
    }
    if (!button.disabled) button.disabled = true;
    if (button.getAttribute("aria-disabled") !== "true") button.setAttribute("aria-disabled", "true");
  }

  function restoreNetworkDisabled(button) {
    if (!(button instanceof HTMLButtonElement) || button.dataset.wave1NetworkDisabled !== "true") return;
    button.disabled = button.dataset.wave1PriorDisabled === "true";
    const priorAria = button.dataset.wave1PriorAriaDisabled;
    if (priorAria === "__none__") button.removeAttribute("aria-disabled");
    else if (priorAria) button.setAttribute("aria-disabled", priorAria);
    delete button.dataset.wave1NetworkDisabled;
    delete button.dataset.wave1PriorDisabled;
    delete button.dataset.wave1PriorAriaDisabled;
  }

  function applyNetworkControlState() {
    document.querySelectorAll("[data-wave1-network-disabled='true']").forEach(restoreNetworkDisabled);

    if (!isOnline()) {
      document.querySelectorAll(NETWORK_REQUIRED_SELECTORS).forEach(rememberAndDisable);
      return;
    }

    if (authorityNeedsReopen && techniqueChoiceActive()) {
      const dialog = document.querySelector("#recommendation-dialog");
      dialog?.querySelectorAll(STALE_CHOICE_SELECTORS).forEach(rememberAndDisable);
    }
  }

  function updatePromptCopy() {
    const banner = document.getElementById("wave1-update-banner");
    if (!banner) return;
    if (!waitingWorker || updateDeferred) {
      setBanner(banner);
      return;
    }

    if (techniqueChoiceActive()) {
      setBanner(banner, {
        title: "Sophie App has an update ready.",
        message: "Reloading now will close this learning choice. Nothing has been added to Learn yet.",
        actions: [
          { label: "Later", action: "update-later", primary: false },
          { label: "Reload and close", action: "update-reload", primary: true }
        ]
      });
      return;
    }

    setBanner(banner, {
      title: "Sophie App has an update ready.",
      message: "Reload when you're ready.",
      actions: [
        { label: "Reload now", action: "update-reload", primary: true },
        { label: "Later", action: "update-later", primary: false }
      ]
    });
  }

  function refreshTrustUi() {
    ensureTrustUi();
    renderOfflineBanner();
    renderChoiceNetworkStatus();
    applyNetworkControlState();
    updatePromptCopy();
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => {
      refreshQueued = false;
      refreshTrustUi();
    });
  }

  function useWaitingWorker(worker) {
    if (!worker || !navigator.serviceWorker.controller) return;
    waitingWorker = worker;
    updateDeferred = false;
    scheduleRefresh();
  }

  function watchInstallingWorker(worker) {
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        useWaitingWorker(registration?.waiting || worker);
      }
    });
  }

  async function setupServiceWorkerLifecycle() {
    if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
    try {
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("./sw.js?v=2.9.2.4-dpr-draft", { updateViaCache: "none" });
      }
      if (registration.waiting) useWaitingWorker(registration.waiting);
      if (registration.installing) watchInstallingWorker(registration.installing);
      registration.addEventListener("updatefound", () => watchInstallingWorker(registration.installing));
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadRequested) location.reload();
      });
      registration.update().catch(() => {});
    } catch {
      // The app remains usable when service workers are unavailable.
    }
  }

  function requestUpdateReload() {
    if (!waitingWorker) return;
    reloadRequested = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  function retryAfterOffline() {
    if (!isOnline()) {
      if (typeof toast === "function") toast("Connect and try again.");
      return;
    }
    const retry = document.querySelector("#skills-workspace [data-v28-retry-pathway]");
    if (retry instanceof HTMLButtonElement) retry.click();
    else if (typeof renderSkills === "function") renderSkills();
  }

  const baseRenderSkillsTrust = typeof renderSkills === "function" ? renderSkills : null;
  if (baseRenderSkillsTrust) {
    renderSkills = function(...args) {
      const result = baseRenderSkillsTrust(...args);
      scheduleRefresh();
      return result;
    };
  }

  const baseRenderRecommendationDialogTrust = typeof renderRecommendationDialog === "function" ? renderRecommendationDialog : null;
  if (baseRenderRecommendationDialogTrust) {
    renderRecommendationDialog = function(...args) {
      const result = baseRenderRecommendationDialogTrust(...args);
      scheduleRefresh();
      return result;
    };
  }

  const baseSetViewTrust = typeof setView === "function" ? setView : null;
  if (baseSetViewTrust) {
    setView = function(...args) {
      const result = baseSetViewTrust(...args);
      scheduleRefresh();
      return result;
    };
  }

  const baseApplyNavigationStateTrust = typeof applyNavigationState === "function" ? applyNavigationState : null;
  if (baseApplyNavigationStateTrust) {
    applyNavigationState = function(...args) {
      const result = baseApplyNavigationStateTrust(...args);
      scheduleRefresh();
      return result;
    };
  }

  document.addEventListener("click", event => {
    const action = event.target.closest?.("[data-wave1-trust-action]");
    if (action) {
      event.preventDefault();
      const type = action.dataset.wave1TrustAction;
      if (type === "update-later") {
        updateDeferred = true;
        scheduleRefresh();
      } else if (type === "update-reload") {
        requestUpdateReload();
      } else if (type === "offline-retry") {
        retryAfterOffline();
      }
      return;
    }

    const learn = event.target.closest?.("[data-v28-learn-technique]");
    if (learn && isOnline()) authorityNeedsReopen = false;

    if (!isOnline()) {
      const liveAction = event.target.closest?.(NETWORK_REQUIRED_SELECTORS);
      if (liveAction) {
        event.preventDefault();
        event.stopImmediatePropagation();
        scheduleRefresh();
      }
      return;
    }

    if (authorityNeedsReopen && techniqueChoiceActive()) {
      const staleAction = event.target.closest?.(STALE_CHOICE_SELECTORS);
      if (staleAction) {
        event.preventDefault();
        event.stopImmediatePropagation();
        scheduleRefresh();
      }
    }
  }, true);

  document.addEventListener("click", () => setTimeout(scheduleRefresh, 0));
  document.addEventListener("close", scheduleRefresh, true);
  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("offline", () => {
    if (techniqueChoiceActive()) authorityNeedsReopen = true;
    scheduleRefresh();
  });
  window.addEventListener("online", scheduleRefresh);

  if (!isOnline() && techniqueChoiceActive()) authorityNeedsReopen = true;
  document.documentElement.dataset.wave1PwaTrust = TRUST_BUILD;
  refreshTrustUi();
  void setupServiceWorkerLifecycle();
})();
