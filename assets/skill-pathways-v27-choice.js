/* Sophie App v2.7 staged technique-choice bridge.
 * This file does not create D-006 opportunities directly. It reuses the
 * existing rec-v1 catalogue and chooseRecommendation() conversion path.
 */
(() => {
  "use strict";

  const DIRECT_CANDIDATES = Object.freeze({
    "COOK-T001":["LC-COOK-002","LC-COOK-014"],
    "COOK-T002":["LC-COOK-003","LC-COOK-017"],
    "COOK-T003":["LC-COOK-001"],
    "COOK-T004":["LC-COOK-005","LC-COOK-015"],
    "COOK-T005":["LC-COOK-012"],
    "COOK-T006":["LC-COOK-010","LC-COOK-011","LC-COOK-012","LC-COOK-013","LC-COOK-014"],
    "COOK-T007":["LC-COOK-013","LC-COOK-021","LC-COOK-023"],
    "COOK-T008":["LC-COOK-008","LC-COOK-021","LC-COOK-022","LC-COOK-023","LC-COOK-024"],
    "COOK-T009":["LC-COOK-021","LC-COOK-022"],
    "COOK-T010":[],
    "COOK-T011":["LC-COOK-008","LC-COOK-010","LC-COOK-020","LC-COOK-027"],
    "COOK-T012":["LC-COOK-004","LC-COOK-006","LC-COOK-007","LC-COOK-015","LC-COOK-024"],
    "COOK-T013":["LC-COOK-004"],
    "COOK-T014":["LC-COOK-009","LC-COOK-023","LC-COOK-025","LC-COOK-026"],
    "COOK-T015":["LC-COOK-011","LC-COOK-012","LC-COOK-017"],
    "COOK-T016":["LC-COOK-018","LC-COOK-019","LC-COOK-020"],
    "COOK-T017":["LC-COOK-019","LC-COOK-021","LC-COOK-022","LC-COOK-023","LC-COOK-024","LC-COOK-025","LC-COOK-026"],
    "COOK-T018":[],
    "COOK-T019":["LC-COOK-026"],
    "COOK-T020":[],
    "COOK-T021":[],
    "COOK-T022":["LC-COOK-027"]
  });

  const flow = app.v27TechniqueChoice = app.v27TechniqueChoice || {
    techniqueId: "",
    techniqueTitle: "",
    safetySupport: "",
    candidates: [],
    error: ""
  };

  function candidateIdsFor(techniqueId) {
    return DIRECT_CANDIDATES[String(techniqueId)] || [];
  }

  function currentTechniqueTitle() {
    return document.querySelector(".technique-detail-hero h2")?.textContent?.trim() || "This technique";
  }

  function enhanceTechniqueChoice() {
    const detail = document.querySelector(".technique-detail");
    if (!detail || app.skillsDomain !== "cooking" || !app.skillsTechniqueId) return;
    const linked = candidateIdsFor(app.skillsTechniqueId);
    const note = detail.querySelector(".technique-readonly-note");
    if (note) {
      note.innerHTML = linked.length
        ? `<strong>${linked.length} direct learning ${linked.length === 1 ? "activity is" : "activities are"} linked to this technique.</strong>When you choose it, the app checks the current safety setup before showing which activities are actually available.`
        : `<strong>No direct learning activity is linked to this technique yet.</strong>You can still explore what comes before it and where it can lead.`;
    }
    if (!linked.length || detail.querySelector("[data-v27-learn-technique]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.dataset.v27LearnTechnique = app.skillsTechniqueId;
    button.style.width = "100%";
    button.style.minHeight = "3rem";
    button.disabled = !recommendationInteractionReady();
    button.textContent = button.disabled ? "Learning choices unavailable on this device" : "I want to learn this";
    detail.appendChild(button);
  }

  function renderTechniqueChoiceDialog() {
    const body = document.querySelector("#recommendation-dialog-body");
    if (!body) return;

    if (app.rec.view === "technique-safety") {
      body.innerHTML = `<div class="dialog-head"><h2>Set up this learning choice</h2><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-screen"><div class="rec-progress">Step 1 of 3</div><h3>${safe(flow.techniqueTitle)}</h3><p class="rec-helper">Who is around while you practise? This is used for safety eligibility, not as a score of what you can do.</p><div class="rec-choice-list">${REC_SAFETY_OPTIONS.map(([value, label]) => `<button class="rec-choice ${flow.safetySupport === value ? "active" : ""}" type="button" data-v27-technique-safety="${safe(value)}"><strong>${safe(label)}</strong></button>`).join("")}</div>${flow.error ? `<div class="rec-error">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="primary-button" type="button" data-v27-check-technique ${flow.safetySupport && !app.rec.loading ? "" : "disabled"}>${app.rec.loading ? "Checking…" : "Show learning choices"}</button><button class="text-button" type="button" data-rec-exit>Not now</button></div></div>`;
      return;
    }

    if (app.rec.view === "technique-candidates") {
      body.innerHTML = `<div class="dialog-head"><h2>Choose a real activity</h2><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-screen"><div class="rec-progress">Step 2 of 3</div><h3>${safe(flow.techniqueTitle)}</h3><p class="rec-helper">These are linked activities that fit the safety setup you chose.</p>${flow.candidates.length ? `<div class="rec-grid">${flow.candidates.map(candidate => { const eligible = candidate.eligibility?.status === "eligible"; return `<article class="rec-card"><div class="rec-card-head"><div><h3>${safe(candidate.title)}</h3>${candidate.estimatedMinutes ? `<span>About ${safe(candidate.estimatedMinutes)} min</span>` : ""}</div></div><p class="rec-reason">${eligible ? "Available for this setup." : safe(candidate.eligibility?.reason || "Not available for this setup.")}</p>${eligible ? `<button class="primary-button" type="button" data-v27-technique-candidate="${safe(candidate.candidateId)}">Choose this</button>` : ""}</article>`; }).join("")}</div>` : `<div class="rec-unavailable"><strong>No linked activity is available for this setup.</strong><p>Try a different setup or choose another technique.</p></div>`}${flow.error ? `<div class="rec-error">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="text-button" type="button" data-v27-back-technique-safety>Change who is around</button><button class="text-button" type="button" data-rec-exit>Not now</button></div></div>`;
      return;
    }

    if (app.rec.view === "technique-support") {
      const candidate = app.rec.currentCandidate;
      const blocked = candidate?.eligibility?.status && candidate.eligibility.status !== "eligible";
      body.innerHTML = `<div class="dialog-head"><h2>Choose the support you want</h2><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-screen"><div class="rec-progress">Step 3 of 3</div><h3>${safe(candidate?.title || flow.techniqueTitle)}</h3><p class="rec-helper">This choice is for this session. It does not become a permanent label about your ability.</p><div class="rec-choice-list">${REC_SUPPORT_OPTIONS.map(([value, label]) => `<button class="rec-choice ${app.rec.supportChoice === value ? "active" : ""}" type="button" data-rec-support="${safe(value)}"><strong>${safe(label)}</strong></button>`).join("")}</div>${recErrorMarkup()}${blocked ? `<div class="rec-unavailable"><strong>That activity is no longer available for this setup.</strong><p>${safe(candidate?.eligibility?.reason || "Try another setup or activity.")}</p></div>` : ""}<p class="rec-consequence">Adding it creates a Learn activity in Available. It does not start automatically and does not create money.</p><div class="rec-controls"><button class="primary-button" type="button" data-rec-add-to-learn ${app.rec.supportChoice && !app.rec.loading && !blocked ? "" : "disabled"}>${app.rec.loading ? "Adding…" : "Add to Learn"}</button><button class="text-button" type="button" data-v27-back-technique-candidates>Back</button><button class="text-button" type="button" data-rec-exit>Not now</button></div></div>`;
    }
  }

  async function loadTechniqueCandidates() {
    const linkedIds = new Set(candidateIdsFor(flow.techniqueId));
    if (!linkedIds.size || !flow.safetySupport || app.rec.loading) return;
    app.rec.loading = true;
    flow.error = "";
    renderRecommendationDialog();
    try {
      const result = await recommendationPost({
        action: "getLearningCandidateCatalogue",
        domain: "cooking",
        availableSafetySupport: flow.safetySupport,
        ...(app.rec.recommendationSessionId ? { recommendationSessionId: app.rec.recommendationSessionId } : {})
      });
      const rows = Array.isArray(result) ? result : result?.candidates;
      flow.candidates = (Array.isArray(rows) ? rows : [])
        .map(normaliseCatalogueCandidate)
        .filter(candidate => linkedIds.has(candidate.candidateId))
        .sort((a, b) => Number(b.eligibility?.status === "eligible") - Number(a.eligibility?.status === "eligible") || String(a.title).localeCompare(String(b.title)));
      app.rec.catalogue = flow.candidates;
      app.rec.availableSafetySupport = flow.safetySupport;
      app.rec.loading = false;
      app.rec.view = "technique-candidates";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-candidates", techniqueId: flow.techniqueId });
    } catch (error) {
      app.rec.loading = false;
      flow.error = recErrorMessage(error);
      renderRecommendationDialog();
    }
  }

  function openTechniqueLearning(techniqueId) {
    const linked = candidateIdsFor(techniqueId);
    if (!linked.length) return;
    if (!recommendationInteractionReady()) {
      toast(recommendationUnauthorised() ? "Learning choices need to be set up again in Parent Mode." : "Learning choices are not available on this device yet.", true);
      return;
    }
    flow.techniqueId = String(techniqueId);
    flow.techniqueTitle = currentTechniqueTitle();
    flow.safetySupport = "";
    flow.candidates = [];
    flow.error = "";
    app.rec.currentCandidate = null;
    app.rec.currentSource = "catalogue";
    app.rec.supportChoice = "";
    app.rec.error = null;
    app.rec.retry = null;
    app.rec.loading = false;
    app.rec.view = "technique-safety";
    renderRecommendationDialog();
    const dialog = document.querySelector("#recommendation-dialog");
    if (dialog && !dialog.open) dialog.showModal();
    writeNavigationState("push", { overlay: "recommendation", recView: "technique-safety", techniqueId: flow.techniqueId });
  }

  function selectTechniqueCandidate(candidateId) {
    const candidate = flow.candidates.find(item => item.candidateId === String(candidateId));
    if (!candidate || candidate.eligibility?.status !== "eligible") return;
    app.rec.currentCandidate = candidate;
    app.rec.currentSource = "catalogue";
    app.rec.supportChoice = "";
    app.rec.error = null;
    app.rec.view = "technique-support";
    renderRecommendationDialog();
    writeNavigationState("replace", { overlay: "recommendation", recView: "technique-support", techniqueId: flow.techniqueId });
  }

  const baseRenderSkillsV27 = renderSkills;
  const baseRenderRecommendationDialogV27 = renderRecommendationDialog;
  const baseApplyNavigationStateV27 = applyNavigationState;

  renderSkills = function() {
    const result = baseRenderSkillsV27();
    enhanceTechniqueChoice();
    return result;
  };

  renderRecommendationDialog = function() {
    if (["technique-safety", "technique-candidates", "technique-support"].includes(app.rec.view)) return renderTechniqueChoiceDialog();
    return baseRenderRecommendationDialogV27();
  };

  applyNavigationState = function(state) {
    if (state?.sophieApp && String(state.recView || "").startsWith("technique-") && state.techniqueId) {
      flow.techniqueId = String(state.techniqueId);
      flow.techniqueTitle = flow.techniqueTitle || currentTechniqueTitle();
    }
    return baseApplyNavigationStateV27(state);
  };

  document.addEventListener("click", event => {
    const learn = event.target.closest("[data-v27-learn-technique]");
    if (learn) {
      event.preventDefault();
      openTechniqueLearning(learn.dataset.v27LearnTechnique);
      return;
    }
    const safety = event.target.closest("[data-v27-technique-safety]");
    if (safety) {
      event.preventDefault();
      flow.safetySupport = safety.dataset.v27TechniqueSafety;
      renderRecommendationDialog();
      return;
    }
    const check = event.target.closest("[data-v27-check-technique]");
    if (check) {
      event.preventDefault();
      loadTechniqueCandidates();
      return;
    }
    const candidate = event.target.closest("[data-v27-technique-candidate]");
    if (candidate) {
      event.preventDefault();
      selectTechniqueCandidate(candidate.dataset.v27TechniqueCandidate);
      return;
    }
    const backSafety = event.target.closest("[data-v27-back-technique-safety]");
    if (backSafety) {
      event.preventDefault();
      app.rec.view = "technique-safety";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-safety", techniqueId: flow.techniqueId });
      return;
    }
    const backCandidates = event.target.closest("[data-v27-back-technique-candidates]");
    if (backCandidates) {
      event.preventDefault();
      app.rec.view = "technique-candidates";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-candidates", techniqueId: flow.techniqueId });
    }
  });

  enhanceTechniqueChoice();
})();
