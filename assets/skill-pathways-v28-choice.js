/* Sophie App v2.8 domain-driven technique-choice bridge.
 * This file does not create D-006 opportunities directly. It reuses the
 * existing rec-v1 catalogue and chooseRecommendation() conversion path.
 */
(() => {
  "use strict";

  const flow = app.v28TechniqueChoice = app.v28TechniqueChoice || {
    techniqueId: "",
    techniqueTitle: "",
    domain: "",
    safetySupport: "",
    candidates: [],
    error: ""
  };

  function activeDomainContext() {
    return typeof app.v28DomainContext === "function" ? app.v28DomainContext(app.skillsDomain) : null;
  }

  function currentDomainName() {
    return activeDomainContext()?.name || "Learning";
  }

  function candidateIdsFor(techniqueId, domain=flow.domain || app.skillsDomain) {
    return typeof app.v28CandidateIdsForTechnique === "function"
      ? app.v28CandidateIdsForTechnique(String(techniqueId), String(domain || ""))
      : [];
  }

  function currentTechniqueTitle() {
    return document.querySelector(".technique-detail-hero h2")?.textContent?.trim() || "This technique";
  }

  function enhanceTechniqueChoice() {
    const detail = document.querySelector(".technique-detail");
    const context = activeDomainContext();
    if (!detail || !context || !app.skillsTechniqueId) return;
    const linked = candidateIdsFor(app.skillsTechniqueId, context && app.skillsDomain);
    const note = detail.querySelector(".technique-readonly-note");
    if (note) {
      note.innerHTML = linked.length
        ? `<strong>${linked.length} direct learning ${linked.length === 1 ? "activity is" : "activities are"} linked to this technique.</strong>When you choose it, the app checks the current safety setup before showing which activities are actually available.`
        : `<strong>No direct learning activity is linked to this technique yet.</strong>You can still explore what comes before it and where it can lead.`;
    }
    if (!linked.length || detail.querySelector("[data-v28-learn-technique]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.dataset.v28LearnTechnique = app.skillsTechniqueId;
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
      body.innerHTML = `<div class="dialog-head"><div><span class="opportunity-detail-domain">${safe(currentDomainName().toUpperCase())} · LEARN</span><h2>Set up this learning choice</h2></div><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-progress">Step 1 of 3</div><h3>${safe(flow.techniqueTitle)}</h3><p class="rec-copy">Who is around while you practise? This checks safety eligibility; it is not a score of what you can do.</p><div class="rec-option-group rec-safety" role="group" aria-label="Adult safety support">${REC_SAFETY_OPTIONS.map(([value,label]) => `<button class="rec-choice" type="button" data-v28-technique-safety="${safe(value)}" aria-pressed="${flow.safetySupport === value}">${safe(label)}</button>`).join("")}</div>${flow.error ? `<div class="rec-error" role="status">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="primary-button" type="button" data-v28-check-technique ${flow.safetySupport && !app.rec.loading ? "" : "disabled"}>${app.rec.loading ? "Checking…" : "Show learning choices"}</button><button class="secondary-button" type="button" data-rec-exit>Not now</button></div>`;
      return;
    }

    if (app.rec.view === "technique-candidates") {
      body.innerHTML = `<div class="dialog-head"><div><span class="opportunity-detail-domain">${safe(currentDomainName().toUpperCase())} · LEARN</span><h2>Choose a real activity</h2></div><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-progress">Step 2 of 3</div><h3>${safe(flow.techniqueTitle)}</h3><p class="rec-copy">These are linked activities that fit the safety setup you chose.</p>${flow.candidates.length ? `<div class="rec-grid">${flow.candidates.map(candidate => { const eligible = candidate.eligibility?.status === "eligible"; return `<article class="rec-card"><h3>${safe(candidate.title)}</h3><div class="rec-meta">${candidate.estimatedMinutes ? `<span class="pill">About ${safe(candidate.estimatedMinutes)} min</span>` : ""}</div><div class="rec-eligibility ${eligible ? "" : "locked"}"><strong>${eligible ? "Available for this setup" : "Not available for this setup"}</strong>${eligible ? "" : `<br>${safe(candidate.eligibility?.reason || "Try another setup.")}`}</div>${eligible ? `<div class="rec-controls"><button class="primary-button" type="button" data-v28-technique-candidate="${safe(candidate.candidateId)}">Choose this</button></div>` : ""}</article>`; }).join("")}</div>` : `<div class="rec-unavailable"><strong>No linked activity is available for this setup.</strong><br>Try a different setup or choose another technique.</div>`}${flow.error ? `<div class="rec-error" role="status">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="secondary-button" type="button" data-v28-back-technique-safety>Change who is around</button><button class="secondary-button" type="button" data-rec-exit>Not now</button></div>`;
      return;
    }

    if (app.rec.view === "technique-support") {
      const candidate = app.rec.currentCandidate;
      const blocked = candidate?.eligibility?.status && candidate.eligibility.status !== "eligible";
      body.innerHTML = `<div class="dialog-head"><div><span class="opportunity-detail-domain">${safe(currentDomainName().toUpperCase())} · LEARN</span><h2>Choose the support you want</h2></div><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-progress">Step 3 of 3</div><h3>${safe(candidate?.title || flow.techniqueTitle)}</h3><p class="rec-copy">This choice is for this session. It does not become a permanent label about your ability.</p><div class="rec-option-group rec-safety" role="group" aria-label="Learning support choice">${REC_SUPPORT_OPTIONS.map(([value,label]) => `<button class="rec-choice" type="button" data-rec-support="${safe(value)}" aria-pressed="${app.rec.supportChoice === value}">${safe(label)}</button>`).join("")}</div>${recErrorMarkup()}${blocked ? `<div class="rec-unavailable"><strong>That activity is no longer available for this setup.</strong><br>${safe(candidate?.eligibility?.reason || "Try another setup or activity.")}</div>` : ""}<div class="rec-consequence"><strong>Add to Learn</strong><br>Adding it creates an available Learn activity. It does not start automatically and does not create money.</div><div class="rec-controls"><button class="primary-button" type="button" data-rec-add-to-learn ${app.rec.supportChoice && !app.rec.loading && !blocked ? "" : "disabled"}>${app.rec.loading ? "Adding…" : "Add to Learn"}</button><button class="secondary-button" type="button" data-v28-back-technique-candidates>Back</button><button class="secondary-button" type="button" data-rec-exit>Not now</button></div>`;
    }
  }

  async function loadTechniqueCandidates() {
    const linkedIds = new Set(candidateIdsFor(flow.techniqueId, flow.domain));
    if (!linkedIds.size || !flow.safetySupport || app.rec.loading) return;
    app.rec.loading = true;
    flow.error = "";
    renderRecommendationDialog();
    try {
      const result = await recommendationPost({
        action: "getLearningCandidateCatalogue",
        domain: flow.domain,
        techniqueId: flow.techniqueId,
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
      flow.error = error?.message || recommendationUnavailableMessage();
      renderRecommendationDialog();
    }
  }

  function openTechniqueLearning(techniqueId) {
    const context = activeDomainContext();
    if (!context) return;
    const linked = candidateIdsFor(techniqueId, context && app.skillsDomain);
    if (!linked.length) return;
    if (!recommendationInteractionReady()) {
      toast(app.rec.unauthorised ? "Learning choices need to be set up again in Parent Mode." : "Learning choices are not available on this device yet.");
      return;
    }
    flow.techniqueId = String(techniqueId);
    flow.techniqueTitle = currentTechniqueTitle();
    flow.domain = context ? app.skillsDomain : "";
    flow.safetySupport = "";
    flow.candidates = [];
    flow.error = "";
    app.rec.currentCandidate = null;
    app.rec.currentSource = "catalogue";
    app.rec.supportChoice = "";
    app.rec.error = "";
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
    app.rec.error = "";
    app.rec.view = "technique-support";
    renderRecommendationDialog();
    writeNavigationState("replace", { overlay: "recommendation", recView: "technique-support", techniqueId: flow.techniqueId });
  }

  const baseRenderSkillsV28 = renderSkills;
  const baseRenderRecommendationDialogV28 = renderRecommendationDialog;
  const baseRenderLearningRecommendationEntryV28 = renderLearningRecommendationEntry;
  const baseRecommendationOperationV28 = recommendationOperation;
  const baseLoadRecommendationCatalogueV28 = loadRecommendationCatalogue;
  const baseApplyNavigationStateV28 = applyNavigationState;

  function rewriteCookingMarkup(html, context) {
    if (!context) return html;
    const name = safe(context.name);
    const lower = safe(String(context.name).toLowerCase());
    const upper = safe(String(context.name).toUpperCase());
    return String(html)
      .replaceAll("COOKING · LEARN", upper + " · LEARN")
      .replaceAll(">COOKING<", ">" + upper + "<")
      .replaceAll('id="cooking-discovery-heading"', 'id="' + safe(context.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")) + '-discovery-heading"')
      .replaceAll("Find something to cook or practise", "Find something to explore or practise")
      .replaceAll("Get Cooking ideas", "Get " + name + " ideas")
      .replaceAll("Cooking discovery", name + " discovery")
      .replaceAll("Find a Cooking idea", "Find a " + name + " idea")
      .replaceAll("What feels right for cooking today?", "What feels right for " + lower + " today?")
      .replaceAll("this Cooking session", "this " + lower + " session")
      .replaceAll("this cooking session", "this " + lower + " session")
      .replaceAll("Who's around while you cook?", "Who's around while you practise?")
      .replaceAll("at cooking", "in " + lower)
      .replaceAll("A few Cooking ideas", "A few " + name + " ideas")
      .replaceAll("Browse more Cooking ideas", "Browse more " + name + " ideas");
  }

  renderLearningRecommendationEntry = function() {
    baseRenderLearningRecommendationEntryV28();
    const context = activeDomainContext();
    const host = document.querySelector("#learn-recommendation-host");
    if (context && host) host.innerHTML = rewriteCookingMarkup(host.innerHTML, context);
  };

  recommendationOperation = function(requestKind, existingOperation=null) {
    if (existingOperation) return existingOperation;
    const context = activeDomainContext();
    if (!context) return baseRecommendationOperationV28(requestKind, existingOperation);
    const operation = {
      action:"getLearningRecommendations",
      domain:app.skillsDomain,
      limit:3,
      clientRequestId:recRequestId(),
      requestKind:requestKind,
      availableSafetySupport:app.rec.availableSafetySupport
    };
    if (app.rec.recommendationSessionId) operation.recommendationSessionId = app.rec.recommendationSessionId;
    if (["show_something_else","repeat_or_refine"].includes(requestKind) && app.rec.recommendationSetId) operation.priorRecommendationSetId = app.rec.recommendationSetId;
    if (app.rec.challengePreference && requestKind !== "surprise_me") {
      operation.challengePreference = app.rec.challengePreference;
      operation.challengePreferenceDuration = "session";
    }
    return operation;
  };

  loadRecommendationCatalogue = async function(existingOperation=null) {
    if (!recommendationInteractionReady()) return toast(recommendationUnavailableMessage());
    const context = activeDomainContext();
    if (!context) return baseLoadRecommendationCatalogueV28(existingOperation);
    const operation = existingOperation || {
      action:"getLearningCandidateCatalogue",
      domain:app.skillsDomain,
      availableSafetySupport:app.rec.availableSafetySupport,
      ...(app.rec.recommendationSessionId ? { recommendationSessionId:app.rec.recommendationSessionId } : {})
    };
    app.rec.loading = true;
    app.rec.error = "";
    app.rec.view = "catalogue";
    renderRecommendationDialog();
    try {
      const result = await recommendationPost(operation);
      const rows = Array.isArray(result) ? result : Array.isArray(result?.candidates) ? result.candidates : [];
      app.rec.catalogue = rows.map(normaliseCatalogueCandidate);
      app.rec.retry = null;
      writeNavigationState("replace", { overlay:"recommendation", recView:"catalogue" });
    } catch (error) {
      if (error.code !== "UNAUTHORISED") {
        app.rec.error = error.message || "Couldn't load more ideas.";
        app.rec.retry = { type:"catalogue", operation:operation };
      }
    } finally {
      app.rec.loading = false;
      renderRecommendationDialog();
    }
  };

  renderSkills = function() {
    const result = baseRenderSkillsV28();
    enhanceTechniqueChoice();
    return result;
  };

  renderRecommendationDialog = function() {
    if (["technique-safety", "technique-candidates", "technique-support"].includes(app.rec.view)) return renderTechniqueChoiceDialog();
    baseRenderRecommendationDialogV28();
    const context = activeDomainContext();
    const host = document.querySelector("#recommendation-dialog-body");
    if (context && host) host.innerHTML = rewriteCookingMarkup(host.innerHTML, context);
  };

  applyNavigationState = function(state) {
    if (state?.sophieApp && String(state.recView || "").startsWith("technique-") && state.techniqueId) {
      flow.techniqueId = String(state.techniqueId);
      flow.domain = String(state.skillsDomain || app.skillsDomain || "");
      flow.techniqueTitle = flow.techniqueTitle || currentTechniqueTitle();
    }
    return baseApplyNavigationStateV28(state);
  };

  document.addEventListener("click", event => {
    const learn = event.target.closest("[data-v28-learn-technique]");
    if (learn) {
      event.preventDefault();
      openTechniqueLearning(learn.dataset.v28LearnTechnique);
      return;
    }
    const safety = event.target.closest("[data-v28-technique-safety]");
    if (safety) {
      event.preventDefault();
      flow.safetySupport = safety.dataset.v28TechniqueSafety;
      renderRecommendationDialog();
      return;
    }
    const check = event.target.closest("[data-v28-check-technique]");
    if (check) {
      event.preventDefault();
      loadTechniqueCandidates();
      return;
    }
    const candidate = event.target.closest("[data-v28-technique-candidate]");
    if (candidate) {
      event.preventDefault();
      selectTechniqueCandidate(candidate.dataset.v28TechniqueCandidate);
      return;
    }
    const backSafety = event.target.closest("[data-v28-back-technique-safety]");
    if (backSafety) {
      event.preventDefault();
      app.rec.view = "technique-safety";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-safety", techniqueId: flow.techniqueId });
      return;
    }
    const backCandidates = event.target.closest("[data-v28-back-technique-candidates]");
    if (backCandidates) {
      event.preventDefault();
      app.rec.view = "technique-candidates";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-candidates", techniqueId: flow.techniqueId });
    }
  });

  function applySettingsRefinementV2927() {
    const settingsButton = document.querySelector("#settings-button");
    if (settingsButton) {
      const syncDot = settingsButton.querySelector("#sync-dot");
      settingsButton.classList.remove("avatar-button");
      settingsButton.classList.add("icon-button", "settings-button");
      settingsButton.setAttribute("aria-label", "Open settings");
      settingsButton.setAttribute("title", "Settings");
      settingsButton.replaceChildren(document.createTextNode("⚙"));
      if (syncDot) settingsButton.appendChild(syncDot);
    }

    const dialog = document.querySelector("#settings-dialog");
    if (dialog) {
      const kicker = dialog.querySelector(".dialog-head .style-lab-kicker");
      const heading = dialog.querySelector(".dialog-head h2");
      if (kicker) kicker.textContent = "SOPHIE // SETTINGS";
      if (heading) heading.textContent = "Settings";

      dialog.querySelectorAll(".setting-row").forEach(row => {
        const label = row.querySelector("strong")?.textContent?.trim();
        if (label === "Your character" || label === "Colour theme") row.remove();
      });

      const patternButton = dialog.querySelector("[data-open-pattern-studio]");
      const patternRow = patternButton?.closest(".setting-row");
      if (patternRow) {
        const label = patternRow.querySelector("strong");
        const copy = patternRow.querySelector("p");
        if (label) label.textContent = "Visual look";
        if (copy) copy.textContent = "Pattern Studio controls the repeating artwork and six colours used across the app.";
      }
    }

    document.documentElement.removeAttribute("data-theme");

    if (!document.getElementById("sophie-settings-v2927-styles")) {
      const style = document.createElement("style");
      style.id = "sophie-settings-v2927-styles";
      style.textContent = `
        #settings-button.settings-button { font-size: 1.15rem; }
        #settings-button.settings-button .sync-dot { margin: 28px 0 0 28px; }
        html.compact-device #settings-button.settings-button { font-size: 22px !important; }
      `;
      document.head.appendChild(style);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySettingsRefinementV2927, { once: true });
  } else {
    applySettingsRefinementV2927();
  }

  enhanceTechniqueChoice();
})();