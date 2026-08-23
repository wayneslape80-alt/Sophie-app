/* v2.8 supervision-option availability prototype.
 * Additive staging layer only. It does not change rec-v1, D-006, Sheets or credentials.
 * Assumes it is loaded after assets/skill-pathways-v28-choice.js.
 */
(() => {
  "use strict";

  const flow = app.v28TechniqueChoice;
  if (!flow || typeof recommendationPost !== "function") return;

  const safetyOptions = Array.isArray(REC_SAFETY_OPTIONS) ? REC_SAFETY_OPTIONS : [];
  const prototypeState = app.v28SafetyPreflightPrototype = app.v28SafetyPreflightPrototype || {
    lastMetrics: null
  };

  function linkedCandidateIds() {
    if (typeof app.v28CandidateIdsForTechnique !== "function") return [];
    return app.v28CandidateIdsForTechnique(String(flow.techniqueId || ""), String(flow.domain || app.skillsDomain || ""));
  }

  function catalogueRows(result) {
    return Array.isArray(result) ? result : Array.isArray(result?.candidates) ? result.candidates : [];
  }

  function currentPreflight() {
    const state = flow.safetyPreflight;
    if (!state) return null;
    const key = `${String(flow.domain)}::${String(flow.techniqueId)}`;
    return state.key === key ? state : null;
  }

  function injectPrototypeStyles() {
    if (document.getElementById("v28-safety-preflight-prototype-styles")) return;
    const style = document.createElement("style");
    style.id = "v28-safety-preflight-prototype-styles";
    style.textContent = `
      .v28-safety-preflight-status {
        margin: 0 0 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(--surface-2);
        color: var(--muted);
        font-size: .82rem;
        line-height: 1.45;
      }
      .rec-choice[data-v28-technique-safety] {
        display: block;
        width: 100%;
      }
      .v28-safety-option-note {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: .76rem;
        font-weight: 700;
        line-height: 1.35;
      }
      .rec-choice.v28-safety-unavailable,
      .rec-choice.v28-safety-loading {
        background: color-mix(in srgb, var(--surface) 78%, var(--surface-2));
        color: var(--muted);
      }
      .rec-choice.v28-safety-unavailable {
        opacity: .58;
        filter: grayscale(.35);
        cursor: not-allowed;
      }
      .rec-choice.v28-safety-loading {
        opacity: .72;
        cursor: wait;
      }
      html.compact-device .v28-safety-preflight-status { font-size: 16px; }
      html.compact-device .v28-safety-option-note { font-size: 16px; }
    `;
    document.head.appendChild(style);
  }

  function decorateSafetyStep() {
    if (app.rec.view !== "technique-safety") return;
    const body = document.querySelector("#recommendation-dialog-body");
    if (!body) return;

    injectPrototypeStyles();
    const state = currentPreflight();
    let status = body.querySelector("[data-v28-safety-preflight-status]");
    if (!status) {
      status = document.createElement("div");
      status.className = "v28-safety-preflight-status";
      status.dataset.v28SafetyPreflightStatus = "";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      const group = body.querySelector(".rec-option-group.rec-safety");
      if (group) group.before(status);
    }

    if (!state || state.status === "loading") {
      status.textContent = "Checking which safety setups currently have a linked learning choice…";
    } else if (state.status === "ready") {
      status.textContent = "Safety setup changes which linked activities are available. It is not a score of Sophie's ability.";
    } else {
      status.textContent = "Some safety setups could not be checked. You can still retry by reopening this learning choice.";
    }

    body.querySelectorAll("[data-v28-technique-safety]").forEach(button => {
      const support = String(button.dataset.v28TechniqueSafety || "");
      const result = state?.availability?.[support] || null;
      button.classList.remove("v28-safety-unavailable", "v28-safety-loading");
      button.removeAttribute("aria-disabled");
      let note = button.querySelector(".v28-safety-option-note");
      if (!note) {
        note = document.createElement("span");
        note.className = "v28-safety-option-note";
        button.appendChild(note);
      }

      if (!state || state.status === "loading" || !result) {
        button.disabled = true;
        button.classList.add("v28-safety-loading");
        note.textContent = "Checking learning choices…";
        return;
      }

      if (result.status === "error") {
        button.disabled = false;
        note.textContent = "Availability check unavailable";
        return;
      }

      if (result.eligibleCount === 0) {
        if (flow.safetySupport === support) flow.safetySupport = "";
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        button.classList.add("v28-safety-unavailable");
        note.textContent = "No learning choice for this setup";
        return;
      }

      button.disabled = false;
      note.textContent = result.eligibleCount === 1 ? "1 linked learning choice available" : `${result.eligibleCount} linked learning choices available`;
    });

    const check = body.querySelector("[data-v28-check-technique]");
    if (check) check.disabled = !(flow.safetySupport && state?.availability?.[flow.safetySupport]?.eligibleCount > 0) || Boolean(app.rec.loading);
  }

  async function preflightSafetyOptions() {
    const linked = new Set(linkedCandidateIds().map(String));
    if (!linked.size || !flow.techniqueId || !flow.domain || !safetyOptions.length) return null;

    const key = `${String(flow.domain)}::${String(flow.techniqueId)}`;
    const existing = currentPreflight();
    if (existing?.promise && ["loading", "ready"].includes(existing.status)) return existing.promise;

    const state = {
      key,
      status: "loading",
      availability: {},
      requestCount: 0,
      startedAt: performance.now(),
      completedAt: 0,
      durationMs: 0,
      promise: null
    };
    flow.safetyPreflight = state;
    flow.safetySupport = "";
    decorateSafetyStep();

    const requestOne = async support => {
      state.requestCount += 1;
      const startedAt = performance.now();
      try {
        const result = await recommendationPost({
          action: "getLearningCandidateCatalogue",
          domain: flow.domain,
          techniqueId: flow.techniqueId,
          availableSafetySupport: support,
          ...(app.rec.recommendationSessionId ? { recommendationSessionId: app.rec.recommendationSessionId } : {})
        });
        const candidates = catalogueRows(result)
          .map(normaliseCatalogueCandidate)
          .filter(candidate => linked.has(String(candidate.candidateId)));
        return {
          support,
          status: "ok",
          candidates,
          eligibleCount: candidates.filter(candidate => candidate.eligibility?.status === "eligible").length,
          durationMs: performance.now() - startedAt
        };
      } catch (error) {
        return {
          support,
          status: "error",
          candidates: [],
          eligibleCount: null,
          durationMs: performance.now() - startedAt,
          errorCode: String(error?.code || ""),
          errorMessage: String(error?.message || recommendationUnavailableMessage())
        };
      }
    };

    state.promise = Promise.all(safetyOptions.map(([support]) => requestOne(String(support))))
      .then(results => {
        results.forEach(result => { state.availability[result.support] = result; });
        state.completedAt = performance.now();
        state.durationMs = state.completedAt - state.startedAt;
        state.status = results.every(result => result.status === "error") ? "error" : "ready";
        prototypeState.lastMetrics = {
          techniqueId: String(flow.techniqueId),
          domain: String(flow.domain),
          requestCount: state.requestCount,
          wallClockMs: Math.round(state.durationMs),
          supports: results.map(result => ({
            support: result.support,
            status: result.status,
            eligibleCount: result.eligibleCount,
            durationMs: Math.round(result.durationMs)
          }))
        };
        document.documentElement.dataset.v28SafetyPreflight = state.status;
        document.documentElement.dataset.v28SafetyPreflightRequests = String(state.requestCount);
        renderRecommendationDialog();
        return state;
      });

    return state.promise;
  }

  function useCachedCandidatesForSelectedSafety(event) {
    const check = event.target.closest("[data-v28-check-technique]");
    if (!check) return false;
    const state = currentPreflight();
    const selected = state?.availability?.[String(flow.safetySupport || "")];
    if (!selected || selected.status !== "ok") return false;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (selected.eligibleCount < 1) return true;

    flow.candidates = selected.candidates.slice();
    app.rec.catalogue = flow.candidates;
    app.rec.availableSafetySupport = flow.safetySupport;
    app.rec.loading = false;
    flow.error = "";
    app.rec.view = "technique-candidates";
    renderRecommendationDialog();
    writeNavigationState("replace", {
      overlay: "recommendation",
      recView: "technique-candidates",
      techniqueId: flow.techniqueId
    });
    return true;
  }

  const baseRenderRecommendationDialog = renderRecommendationDialog;
  renderRecommendationDialog = function() {
    const result = baseRenderRecommendationDialog();
    decorateSafetyStep();
    return result;
  };

  document.addEventListener("click", event => {
    if (useCachedCandidatesForSelectedSafety(event)) return;

    const safety = event.target.closest("[data-v28-technique-safety]");
    if (safety && (safety.disabled || safety.classList.contains("v28-safety-unavailable"))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    const learn = event.target.closest("[data-v28-learn-technique]");
    if (learn) {
      queueMicrotask(() => {
        if (app.rec.view !== "technique-safety") return;
        flow.safetyPreflight = null;
        preflightSafetyOptions();
      });
    }
  }, true);
})();
