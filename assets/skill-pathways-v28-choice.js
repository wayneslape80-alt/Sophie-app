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

  function catalogueRows(result) {
    return Array.isArray(result) ? result : Array.isArray(result?.candidates) ? result.candidates : [];
  }

  function safetyPreflightKey() {
    return `${String(flow.domain || "")}::${String(flow.techniqueId || "")}`;
  }

  function currentSafetyPreflight() {
    const state = flow.safetyPreflight;
    return state && state.key === safetyPreflightKey() ? state : null;
  }

  function ensureSafetyPreflightStyles() {
    if (document.getElementById("v28-safety-preflight-styles")) return;
    const style = document.createElement("style");
    style.id = "v28-safety-preflight-styles";
    style.textContent = `
      .v28-safety-preflight-status {
        margin: 0 0 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(--surface-2);
        color: var(--muted);
        font-size: .84rem;
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
        font-size: .78rem;
        font-weight: 700;
        line-height: 1.35;
      }
      .rec-choice.v28-safety-unavailable,
      .rec-choice.v28-safety-loading {
        background: color-mix(in srgb, var(--surface) 78%, var(--surface-2));
        color: var(--muted);
      }
      .rec-choice.v28-safety-unavailable {
        opacity: .62;
        filter: grayscale(.3);
        border-style: dashed;
        cursor: not-allowed;
      }
      .rec-choice.v28-safety-loading {
        opacity: .76;
        cursor: wait;
      }
      .rec-choice.v28-safety-check-error .v28-safety-option-note {
        font-weight: 650;
      }
      html.compact-device .v28-safety-preflight-status,
      html.compact-device .v28-safety-option-note {
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  function safetyPreflightStatusText(state) {
    if (!state || state.status === "loading") return "Checking which safety setups currently have a linked learning choice…";
    if (state.status === "error") return "Availability could not be checked yet. Choose a setup and the app will check it when you continue.";
    return "Safety setup changes which linked activities are available. It is not a score of Sophie's ability.";
  }

  function safetyOptionMarkup(value, label, state) {
    const support = String(value);
    const result = state?.availability?.[support] || null;
    const loading = !state || state.status === "loading" || !result;
    const unavailable = result?.status === "ok" && result.eligibleCount === 0;
    const failedOpen = result?.status === "error";
    const selected = !loading && !unavailable && flow.safetySupport === support;
    const noteId = `v28-safety-note-${support.replace(/[^a-z0-9_-]/gi, "-")}`;
    let note = "";
    if (loading) note = "Checking learning choices…";
    else if (unavailable) note = "No learning choice for this setup";
    else if (failedOpen) note = "Availability check unavailable - this setup will be checked when you continue";
    else note = result.eligibleCount === 1 ? "1 linked learning choice available" : `${result.eligibleCount} linked learning choices available`;
    const classes = ["rec-choice"];
    if (loading) classes.push("v28-safety-loading");
    if (unavailable) classes.push("v28-safety-unavailable");
    if (failedOpen) classes.push("v28-safety-check-error");
    const ariaDisabled = loading || unavailable ? ` aria-disabled="true"` : "";
    return `<button class="${classes.join(" ")}" type="button" data-v28-technique-safety="${safe(support)}" aria-pressed="${selected}" aria-describedby="${safe(noteId)}"${ariaDisabled}>${safe(label)}<span id="${safe(noteId)}" class="v28-safety-option-note">${safe(note)}</span></button>`;
  }

  function normalisedLinkedCandidates(result, linkedIds) {
    return catalogueRows(result)
      .map(normaliseCatalogueCandidate)
      .filter(candidate => linkedIds.has(String(candidate.candidateId)))
      .sort((a, b) => Number(b.eligibility?.status === "eligible") - Number(a.eligibility?.status === "eligible") || String(a.title).localeCompare(String(b.title)));
  }

  async function preflightSafetyOptions() {
    const linkedIds = new Set(candidateIdsFor(flow.techniqueId, flow.domain).map(String));
    const safetyOptions = Array.isArray(REC_SAFETY_OPTIONS) ? REC_SAFETY_OPTIONS.map(([support]) => String(support)) : [];
    if (!linkedIds.size || !flow.techniqueId || !flow.domain || !safetyOptions.length) return null;

    const existing = currentSafetyPreflight();
    if (existing?.promise && ["loading", "ready"].includes(existing.status)) return existing.promise;

    const state = {
      key: safetyPreflightKey(),
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
    renderRecommendationDialog();

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
        const candidates = normalisedLinkedCandidates(result, linkedIds);
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
          errorCode: String(error?.code || "")
        };
      }
    };

    state.promise = Promise.all(safetyOptions.map(requestOne)).then(results => {
      results.forEach(result => { state.availability[result.support] = result; });
      state.completedAt = performance.now();
      state.durationMs = state.completedAt - state.startedAt;
      state.status = results.every(result => result.status === "error") ? "error" : "ready";
      app.v28SafetyPreflightMetrics = {
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
      document.documentElement.dataset.v28SafetyPreflightMs = String(Math.round(state.durationMs));
      renderRecommendationDialog();
      return state;
    });

    return state.promise;
  }

  function useCachedTechniqueCandidates() {
    const state = currentSafetyPreflight();
    const selected = state?.availability?.[String(flow.safetySupport || "")];
    if (!selected || selected.status !== "ok" || selected.eligibleCount < 1) return false;
    flow.candidates = selected.candidates.slice();
    app.rec.catalogue = flow.candidates;
    app.rec.availableSafetySupport = flow.safetySupport;
    app.rec.loading = false;
    flow.error = "";
    app.rec.view = "technique-candidates";
    renderRecommendationDialog();
    writeNavigationState("replace", { overlay: "recommendation", recView: "technique-candidates", techniqueId: flow.techniqueId });
    return true;
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
      ensureSafetyPreflightStyles();
      const state = currentSafetyPreflight();
      const selected = state?.availability?.[String(flow.safetySupport || "")];
      const canContinue = Boolean(flow.safetySupport) && (
        selected?.status === "error" || (selected?.status === "ok" && selected.eligibleCount > 0)
      );
      body.innerHTML = `<div class="dialog-head"><div><span class="opportunity-detail-domain">${safe(currentDomainName().toUpperCase())} · LEARN</span><h2>Set up this learning choice</h2></div><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-progress">Step 1 of 3</div><h3>${safe(flow.techniqueTitle)}</h3><p class="rec-copy">Who is around while you practise? This checks safety eligibility; it is not a score of what you can do.</p><div class="v28-safety-preflight-status" role="status" aria-live="polite">${safe(safetyPreflightStatusText(state))}</div><div class="rec-option-group rec-safety" role="group" aria-label="Adult safety support">${REC_SAFETY_OPTIONS.map(([value,label]) => safetyOptionMarkup(value, label, state)).join("")}</div>${flow.error ? `<div class="rec-error" role="status">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="primary-button" type="button" data-v28-check-technique ${canContinue && !app.rec.loading ? "" : "disabled"}>${app.rec.loading ? "Checking…" : "Show learning choices"}</button><button class="secondary-button" type="button" data-rec-exit>Not now</button></div>`;
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
    if (useCachedTechniqueCandidates()) return;
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
      flow.candidates = normalisedLinkedCandidates(result, new Set(Array.from(linkedIds, String)));
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
    flow.safetyPreflight = null;
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
    void preflightSafetyOptions();
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
      if (safety.getAttribute("aria-disabled") === "true") return;
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

  function loadIssue48Suggestions() {
    if (document.querySelector("script[data-issue48-suggestions]")) return;
    const script = document.createElement("script");
    script.src = "./assets/issue48-suggestions.js?v=issue48-draft-1";
    script.dataset.issue48Suggestions = "true";
    script.async = false;
    document.head.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySettingsRefinementV2927, { once: true });
  } else {
    applySettingsRefinementV2927();
  }

  enhanceTechniqueChoice();
  loadIssue48Suggestions();
})();
