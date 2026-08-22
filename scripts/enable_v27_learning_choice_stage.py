from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
asset_path = ROOT / "assets" / "skill-pathways-v27.js"
asset = asset_path.read_text(encoding="utf-8")

old_note = '''        <div class="technique-readonly-note"><strong>${relatedCount ? `${relatedCount} direct learning ${relatedCount === 1 ? "activity is" : "activities are"} linked to this technique.` : "This technique does not yet have a direct primary learning activity."}</strong>${relatedCount ? "The next step is to ask rec-v1 which linked activity is actually eligible for the current session before anything can be added to Learn." : "For now this page is for understanding the pathway. It does not create or unlock an activity."}</div>
      </div>`;'''
new_note = '''        <div class="technique-readonly-note"><strong>${relatedCount ? `${relatedCount} direct learning ${relatedCount === 1 ? "activity is" : "activities are"} linked to this technique.` : "This technique does not yet have a direct primary learning activity."}</strong>${relatedCount ? "When you choose this technique, the app checks the current session setup before showing which linked activities are actually available." : "For now this page is for understanding the pathway. It does not create or unlock an activity."}</div>
        ${relatedCount ? `<button class="primary-button technique-learn-action" type="button" data-v27-learn-technique="${safe(technique.id)}" ${recommendationInteractionReady() ? "" : "disabled"}>${recommendationInteractionReady() ? "I want to learn this" : "Learning choices unavailable on this device"}</button>` : ""}
      </div>`;'''
if old_note in asset:
    asset = asset.replace(old_note, new_note, 1)
elif new_note not in asset:
    raise SystemExit("technique learning action anchor not found")

old_css = '.technique-readonly-note{padding:12px 13px;border-radius:14px;background:var(--brand-soft);line-height:1.5}.technique-readonly-note strong{display:block;margin-bottom:3px}'
new_css = '.technique-readonly-note{padding:12px 13px;border-radius:14px;background:var(--brand-soft);line-height:1.5}.technique-readonly-note strong{display:block;margin-bottom:3px}.technique-learn-action{width:100%;min-height:48px}.v27-candidate-list{display:grid;gap:10px}.v27-candidate-card{padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}.v27-candidate-card h3{margin:0 0 4px}.v27-candidate-card p{margin:0;color:var(--muted);font-size:.875rem;line-height:1.45}.v27-candidate-card .primary-button{width:100%;margin-top:10px}.v27-flow-note{margin:0 0 12px;color:var(--muted);line-height:1.5}'
if old_css in asset:
    asset = asset.replace(old_css, new_css, 1)
elif new_css not in asset:
    raise SystemExit("technique learning action CSS anchor not found")

flow_anchor = '''  injectStyles();
  app.skillsTechniqueId = app.skillsTechniqueId || "";'''
flow_code = r'''  function renderV27TechniqueRecommendationDialog() {
    const flow = app.v27TechniqueFlow;
    const technique = techniqueById(flow.techniqueId);
    const title = document.querySelector("#rec-dialog-title");
    const body = document.querySelector("#recommendation-body");
    if (!title || !body || !technique) return;

    if (app.rec.view === "technique-safety") {
      title.textContent = "Set up this learning choice";
      body.innerHTML = `<div class="rec-screen"><div class="rec-progress">Step 1 of 3</div><h3>${safe(technique.title)}</h3><p class="v27-flow-note">Who is around while you practise? This is used for safety eligibility, not as a score of what you can do.</p><div class="rec-choice-list">${REC_SAFETY_OPTIONS.map(option => `<button class="rec-choice ${flow.safetySupport === option.value ? "active" : ""}" type="button" data-v27-technique-safety="${safe(option.value)}"><strong>${safe(option.label)}</strong></button>`).join("")}</div>${flow.error ? `<div class="rec-error">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="primary-button" type="button" data-v27-check-technique ${flow.safetySupport && !app.rec.loading ? "" : "disabled"}>${app.rec.loading ? "Checking…" : "Show learning choices"}</button><button class="text-button" type="button" data-rec-exit>Not now</button></div></div>`;
      return;
    }

    if (app.rec.view === "technique-candidates") {
      title.textContent = "Choose a real activity";
      const candidates = flow.candidates || [];
      body.innerHTML = `<div class="rec-screen"><div class="rec-progress">Step 2 of 3</div><h3>${safe(technique.title)}</h3><p class="v27-flow-note">These are the linked activities returned by the current rec-v1 eligibility check for this session setup.</p>${candidates.length ? `<div class="v27-candidate-list">${candidates.map(candidate => { const eligible = candidate.eligibility?.status === "eligible"; return `<article class="v27-candidate-card"><h3>${safe(candidate.title)}</h3><p>${candidate.estimatedMinutes ? `About ${safe(candidate.estimatedMinutes)} min. ` : ""}${eligible ? "Available for this setup." : safe(candidate.eligibility?.reason || "Not available for this setup.")}</p>${eligible ? `<button class="primary-button" type="button" data-v27-technique-candidate="${safe(candidate.candidateId)}">Choose this</button>` : ""}</article>`; }).join("")}</div>` : `<div class="rec-unavailable"><strong>No linked activity is available for this setup.</strong><p>Try a different support setup or choose another technique.</p></div>`}${flow.error ? `<div class="rec-error">${safe(flow.error)}</div>` : ""}<div class="rec-controls"><button class="text-button" type="button" data-v27-back-technique-safety>Change who is around</button><button class="text-button" type="button" data-rec-exit>Not now</button></div></div>`;
      return;
    }

    if (app.rec.view === "technique-support") {
      const candidate = app.rec.currentCandidate;
      const blocked = candidate?.eligibility?.status && candidate.eligibility.status !== "eligible";
      title.textContent = "Choose the support you want";
      body.innerHTML = `<div class="rec-screen"><div class="rec-progress">Step 3 of 3</div><h3>${safe(candidate?.title || technique.title)}</h3><p class="v27-flow-note">This is for this session only. It does not become a permanent label about your ability.</p><div class="rec-choice-list">${REC_SUPPORT_OPTIONS.map(option => `<button class="rec-choice ${app.rec.supportChoice === option.value ? "active" : ""}" type="button" data-rec-support="${safe(option.value)}"><strong>${safe(option.label)}</strong><span>${safe(option.copy)}</span></button>`).join("")}</div>${recErrorMarkup()}${blocked ? `<div class="rec-unavailable"><strong>That activity is no longer available for this setup.</strong><p>${safe(candidate?.eligibility?.reason || "Try another setup or activity.")}</p></div>` : ""}<p class="rec-consequence">Adding it creates a Learn activity in Available. It does not start automatically and does not create money.</p><div class="rec-controls"><button class="primary-button" type="button" data-rec-add-to-learn ${app.rec.supportChoice && !app.rec.loading && !blocked ? "" : "disabled"}>${app.rec.loading ? "Adding…" : "Add to Learn"}</button><button class="text-button" type="button" data-v27-back-technique-candidates>Back</button><button class="text-button" type="button" data-rec-exit>Not now</button></div></div>`;
    }
  }

  async function loadV27TechniqueCandidates() {
    const flow = app.v27TechniqueFlow;
    const technique = techniqueById(flow.techniqueId);
    if (!technique || !flow.safetySupport || app.rec.loading) return;
    app.rec.loading = true;
    flow.error = null;
    renderRecommendationDialog();
    try {
      const result = await recommendationPost({
        action: "getLearningCandidateCatalogue",
        domain: "cooking",
        availableSafetySupport: flow.safetySupport,
        ...(app.rec.recommendationSessionId ? { recommendationSessionId: app.rec.recommendationSessionId } : {})
      });
      const rows = Array.isArray(result) ? result : result?.candidates;
      const linkedIds = new Set(technique.directCandidates);
      const linked = (Array.isArray(rows) ? rows : []).map(normaliseCatalogueCandidate).filter(candidate => linkedIds.has(candidate.candidateId));
      linked.sort((a, b) => Number(b.eligibility?.status === "eligible") - Number(a.eligibility?.status === "eligible") || String(a.title).localeCompare(String(b.title)));
      flow.candidates = linked;
      app.rec.catalogue = linked;
      app.rec.availableSafetySupport = flow.safetySupport;
      app.rec.loading = false;
      app.rec.view = "technique-candidates";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-candidates", techniqueId: technique.id });
    } catch (error) {
      app.rec.loading = false;
      flow.error = recErrorMessage(error);
      renderRecommendationDialog();
    }
  }

  function openV27TechniqueLearning(techniqueId) {
    const technique = techniqueById(techniqueId);
    if (!technique || !technique.directCandidates.length) return;
    if (!recommendationInteractionReady()) {
      toast(recommendationUnauthorised() ? "Learning choices need to be set up again in Parent Mode." : "Learning choices are not available on this device yet.", true);
      return;
    }
    app.v27TechniqueFlow = { techniqueId: technique.id, safetySupport: "", candidates: [], error: null };
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
    writeNavigationState("push", { overlay: "recommendation", recView: "technique-safety", techniqueId: technique.id });
  }

  function selectV27TechniqueCandidate(candidateId) {
    const candidate = (app.v27TechniqueFlow.candidates || []).find(item => item.candidateId === String(candidateId));
    if (!candidate || candidate.eligibility?.status !== "eligible") return;
    app.rec.currentCandidate = candidate;
    app.rec.currentSource = "catalogue";
    app.rec.supportChoice = "";
    app.rec.error = null;
    app.rec.view = "technique-support";
    renderRecommendationDialog();
    writeNavigationState("replace", { overlay: "recommendation", recView: "technique-support", techniqueId: app.v27TechniqueFlow.techniqueId });
  }

  injectStyles();
  app.skillsTechniqueId = app.skillsTechniqueId || "";'''
if flow_anchor in asset:
    asset = asset.replace(flow_anchor, flow_code, 1)
elif 'function openV27TechniqueLearning' not in asset:
    raise SystemExit("v2.7 technique learning flow anchor not found")

old_setup = '''  app.v27PathwaySource = SOURCE;

  const baseNavigationState = navigationState;
  const baseApplyNavigationState = applyNavigationState;
  const baseSetSkillsDomain = setSkillsDomain;
  const baseRenderSkills = renderSkills;'''
new_setup = '''  app.v27PathwaySource = SOURCE;
  app.v27TechniqueFlow = app.v27TechniqueFlow || { techniqueId: "", safetySupport: "", candidates: [], error: null };

  const baseNavigationState = navigationState;
  const baseApplyNavigationState = applyNavigationState;
  const baseSetSkillsDomain = setSkillsDomain;
  const baseRenderSkills = renderSkills;
  const baseRenderRecommendationDialog = renderRecommendationDialog;'''
if old_setup in asset:
    asset = asset.replace(old_setup, new_setup, 1)
elif new_setup not in asset:
    raise SystemExit("v2.7 flow setup anchor not found")

old_apply = '''  applyNavigationState = function(state) {
    app.skillsTechniqueId = state?.sophieApp && state.skillsDomain === "cooking" ? String(state.skillsTechniqueId || "") : "";
    return baseApplyNavigationState(state);
  };'''
new_apply = '''  applyNavigationState = function(state) {
    app.skillsTechniqueId = state?.sophieApp && state.skillsDomain === "cooking" ? String(state.skillsTechniqueId || "") : "";
    if (state?.sophieApp && String(state.recView || "").startsWith("technique-") && state.techniqueId) {
      app.v27TechniqueFlow.techniqueId = String(state.techniqueId);
    }
    return baseApplyNavigationState(state);
  };'''
if old_apply in asset:
    asset = asset.replace(old_apply, new_apply, 1)
elif new_apply not in asset:
    raise SystemExit("v2.7 history flow anchor not found")

render_anchor = '''  renderSkills = function() {
    const host = document.querySelector("#skills-workspace");
    if (!host) return;
    if (app.skillsDomain !== "cooking") return baseRenderSkills();
    host.innerHTML = app.skillsTechniqueId ? renderTechniqueDetail(app.skillsTechniqueId) : renderCookingDomainV27();
    if (!app.skillsTechniqueId) renderLearningRecommendationEntry();
  };

  function openTechnique'''
render_replacement = '''  renderSkills = function() {
    const host = document.querySelector("#skills-workspace");
    if (!host) return;
    if (app.skillsDomain !== "cooking") return baseRenderSkills();
    host.innerHTML = app.skillsTechniqueId ? renderTechniqueDetail(app.skillsTechniqueId) : renderCookingDomainV27();
    if (!app.skillsTechniqueId) renderLearningRecommendationEntry();
  };

  renderRecommendationDialog = function() {
    if (["technique-safety", "technique-candidates", "technique-support"].includes(app.rec.view)) return renderV27TechniqueRecommendationDialog();
    return baseRenderRecommendationDialog();
  };

  function openTechnique'''
if render_anchor in asset:
    asset = asset.replace(render_anchor, render_replacement, 1)
elif 'renderV27TechniqueRecommendationDialog();' not in asset:
    raise SystemExit("v2.7 recommendation renderer anchor not found")

click_anchor = '''  document.addEventListener("click", event => {
    const technique = event.target.closest("[data-v27-technique]");'''
click_replacement = '''  document.addEventListener("click", event => {
    const learnTechnique = event.target.closest("[data-v27-learn-technique]");
    if (learnTechnique) {
      event.preventDefault();
      openV27TechniqueLearning(learnTechnique.dataset.v27LearnTechnique);
      return;
    }
    const safety = event.target.closest("[data-v27-technique-safety]");
    if (safety) {
      event.preventDefault();
      app.v27TechniqueFlow.safetySupport = safety.dataset.v27TechniqueSafety;
      renderRecommendationDialog();
      return;
    }
    const checkTechnique = event.target.closest("[data-v27-check-technique]");
    if (checkTechnique) {
      event.preventDefault();
      loadV27TechniqueCandidates();
      return;
    }
    const chooseCandidate = event.target.closest("[data-v27-technique-candidate]");
    if (chooseCandidate) {
      event.preventDefault();
      selectV27TechniqueCandidate(chooseCandidate.dataset.v27TechniqueCandidate);
      return;
    }
    const backSafety = event.target.closest("[data-v27-back-technique-safety]");
    if (backSafety) {
      event.preventDefault();
      app.rec.view = "technique-safety";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-safety", techniqueId: app.v27TechniqueFlow.techniqueId });
      return;
    }
    const backCandidates = event.target.closest("[data-v27-back-technique-candidates]");
    if (backCandidates) {
      event.preventDefault();
      app.rec.view = "technique-candidates";
      renderRecommendationDialog();
      writeNavigationState("replace", { overlay: "recommendation", recView: "technique-candidates", techniqueId: app.v27TechniqueFlow.techniqueId });
      return;
    }
    const technique = event.target.closest("[data-v27-technique]");'''
if click_anchor in asset:
    asset = asset.replace(click_anchor, click_replacement, 1)
elif 'data-v27-learn-technique' not in asset:
    raise SystemExit("v2.7 learning click handler anchor not found")

asset_path.write_text(asset, encoding="utf-8")
