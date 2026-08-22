/* Sophie App v2.7 staged interactive Skill Pathways.
 * Structure comes only from the credential-protected pathway-v1 read model.
 * rec-v1 remains authoritative for eligibility and D-006 Learn creation.
 */
(() => {
  "use strict";

  const CONTRACT = "pathway-v1";
  const GROUPS = [
    ["prepare","Prepare and organise","Set up the work, use tools carefully and make ingredients ready."],
    ["heat","Heat and cooking","Learn how pans, pots, ovens and direct heat behave."],
    ["judge","Judge and adjust","Use food cues, taste and texture to make decisions."],
    ["bake","Grains, batter and dough","Work with ratios, texture and methods that change over time."],
    ["coordinate","Bring meals together","Plan and coordinate more than one part of a meal."]
  ];
  const FAMILY_GROUP = {
    organisation:"prepare",measurement:"prepare",knife_and_prep:"prepare",safety:"prepare",
    assembly:"prepare",preparation:"prepare",equipment:"prepare",heat_control:"heat",
    moist_heat:"heat",oven:"heat",judgement:"judge",flavour:"judge",
    sauces_and_dressings:"judge",grains:"bake",baking:"bake",coordination:"coordinate"
  };
  const pathway = app.v27Pathway = app.v27Pathway || {
    status:"idle", domain:"cooking", techniques:[], error:"", request:null
  };

  const supportLabel = value => ({
    none:"No special support listed",adult_available:"Adult available",
    adult_nearby:"Adult nearby",direct_supervision:"Adult stays with you"
  })[value] || "Support depends on the activity";

  function normaliseTechnique(row) {
    const safety = row?.safety && typeof row.safety === "object" ? row.safety : {};
    return {
      id:String(row?.techniqueId || ""), title:String(row?.title || ""),
      family:String(row?.family || ""), group:FAMILY_GROUP[String(row?.family || "")] || "prepare",
      description:String(row?.description || ""),
      supportOptions:Array.isArray(row?.typicalSupportOptions) ? row.typicalSupportOptions.map(String) : [],
      safetyCritical:Boolean(safety.critical), safetySupport:String(safety.typicalSupport || "none"),
      safetyNote:String(safety.note || ""),
      candidateLinks:Array.isArray(row?.candidateLinks) ? row.candidateLinks.map(link => ({
        candidateId:String(link?.candidateId || ""), role:String(link?.role || ""),
        evidenceRelevant:Boolean(link?.evidenceRelevant), safetyRole:String(link?.safetyRole || "")
      })).filter(link => link.candidateId) : [],
      prerequisites:Array.isArray(row?.prerequisites) ? row.prerequisites.map(edge => ({
        prerequisiteTechniqueId:String(edge?.prerequisiteTechniqueId || ""),
        title:String(edge?.title || ""), kind:String(edge?.kind || ""),
        rationale:String(edge?.rationale || ""), safetyRelated:Boolean(edge?.safetyRelated),
        supportImplication:String(edge?.supportImplication || "")
      })).filter(edge => edge.prerequisiteTechniqueId && ["hard","recommended"].includes(edge.kind)) : []
    };
  }

  function acceptPayload(result) {
    if (String(result?.learningPathwayContractVersion || "") !== CONTRACT) {
      throw new Error("Learning pathway capability mismatch.");
    }
    if (String(result?.domain || "") !== "cooking" || !Array.isArray(result?.techniques)) {
      throw new Error("The Cooking pathway response is incomplete.");
    }
    const techniques = result.techniques.map(normaliseTechnique).filter(item => item.id && item.title);
    if (!techniques.length) throw new Error("No active Cooking techniques are available.");
    pathway.status = "ready";
    pathway.techniques = techniques;
    pathway.error = "";
    app.v27PathwaySource = Object.freeze({
      version:CONTRACT, domain:"cooking", authority:"backend",
      sourceTables:["Techniques","TechniquePrerequisites","CandidateTechniques","LearnCandidates"]
    });
  }

  const techniqueById = id => pathway.techniques.find(item => item.id === String(id)) || null;
  const directCandidateIds = id => {
    const technique = techniqueById(id);
    return technique ? technique.candidateLinks.filter(link => link.role === "primary_practice").map(link => link.candidateId) : [];
  };
  const prerequisitesFor = id => techniqueById(id)?.prerequisites || [];
  const unlocksFrom = id => pathway.techniques.flatMap(technique =>
    technique.prerequisites.filter(edge => edge.prerequisiteTechniqueId === String(id))
      .map(edge => ({...edge, techniqueId:technique.id, title:technique.title}))
  );
  app.v27CandidateIdsForTechnique = directCandidateIds;

  function requestPathway({force=false} = {}) {
    if (!force && pathway.status === "ready") return Promise.resolve(pathway);
    if (!force && pathway.status === "loading" && pathway.request) return pathway.request;
    if (!recommendationInteractionReady()) {
      pathway.status = "unavailable";
      pathway.error = app.rec?.unauthorised
        ? "Learning pathways need to be set up again in Parent Mode."
        : "Learning pathways are not available on this device yet.";
      return Promise.resolve(pathway);
    }
    pathway.status = "loading";
    pathway.error = "";
    pathway.request = recommendationPost({action:"getLearningPathway",domain:"cooking"})
      .then(result => { acceptPayload(result); return pathway; })
      .catch(error => {
        pathway.status = "error";
        pathway.techniques = [];
        pathway.error = error?.message || "The Cooking pathway could not be loaded.";
        return pathway;
      })
      .finally(() => {
        pathway.request = null;
        if (app.activeView === "skills" && app.skillsDomain === "cooking") renderSkills();
      });
    return pathway.request;
  }

  function injectStyles() {
    if (document.getElementById("v27-skill-pathway-styles")) return;
    const style = document.createElement("style");
    style.id = "v27-skill-pathway-styles";
    style.textContent = `
      .technique-groups,.technique-detail,.technique-link-list{display:grid;gap:12px}
      .technique-group,.technique-detail-hero,.technique-detail-section,.technique-pathway-state{border:1px solid var(--line);border-radius:18px;background:var(--surface)}
      .technique-group{overflow:hidden}.technique-group>summary{display:flex;justify-content:space-between;gap:12px;min-height:52px;padding:12px 14px;cursor:pointer;list-style:none}.technique-group>summary::-webkit-details-marker{display:none}.technique-group>summary::after{content:"+";color:var(--brand);font-weight:900}.technique-group[open]>summary::after{content:"−"}.technique-group-title{display:block;font-weight:850}.technique-group-copy{display:block;margin-top:3px;color:var(--muted);font-size:.8125rem}.technique-group-body{padding:0 12px 12px}
      .technique-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.technique-card,.technique-link{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;min-height:64px;width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:15px;background:var(--surface);color:var(--ink);text-align:left;cursor:pointer}.technique-link{grid-template-columns:minmax(0,1fr) auto;min-height:52px;background:var(--bg)}.technique-card:focus-visible,.technique-link:focus-visible{outline:3px solid var(--brand);outline-offset:3px}.technique-card-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:var(--brand-soft)}.technique-card-copy strong,.technique-link strong{display:block}.technique-card-copy small,.technique-link small{display:block;margin-top:3px;color:var(--muted);line-height:1.35}.technique-card-arrow{color:var(--brand);font-weight:900}
      .technique-badge{display:inline-flex;min-height:28px;margin-top:6px;padding:4px 8px;border-radius:99px;background:var(--surface-2);color:var(--muted);font-size:.7rem;font-weight:850}.technique-badge.hard{background:var(--sun);color:var(--sun-ink)}.technique-badge.safety,.technique-safety{background:var(--rose);color:var(--rose-ink)}
      .technique-detail-hero,.technique-detail-section,.technique-pathway-state{padding:18px}.technique-detail-hero{background:linear-gradient(145deg,var(--surface),var(--brand-soft))}.technique-detail-hero h2{margin:5px 0 7px}.technique-detail-hero p,.technique-detail-section>p,.technique-pathway-state{color:var(--muted);line-height:1.5}.technique-detail-section h3{margin:0 0 8px}.technique-safety,.technique-readonly-note{margin-top:10px;padding:11px 12px;border-radius:13px;line-height:1.45}.technique-readonly-note{background:var(--brand-soft)}.technique-readonly-note strong,.technique-pathway-state strong{display:block;margin-bottom:4px;color:var(--ink)}
      @media(max-width:839px){.technique-grid{grid-template-columns:1fr}}html.compact-device .technique-grid{grid-template-columns:1fr}html.compact-device .technique-card{min-height:3rem;padding:.6875rem .75rem}html.compact-device .technique-detail-hero,html.compact-device .technique-detail-section{padding:1rem}
    `;
    document.head.appendChild(style);
  }

  function techniqueCardMarkup(technique) {
    const hard = technique.prerequisites.some(edge => edge.kind === "hard");
    const badge = hard ? '<span class="technique-badge hard">Safety prerequisite</span>'
      : technique.safetyCritical ? '<span class="technique-badge safety">Safety support applies</span>'
      : '<span class="technique-badge">Ready to explore</span>';
    return `<button class="technique-card" type="button" data-v27-technique="${safe(technique.id)}"><span class="technique-card-icon" aria-hidden="true">${technique.safetyCritical ? "🛡️" : "◇"}</span><span class="technique-card-copy"><strong>${safe(technique.title)}</strong><small>${safe(technique.description)}</small>${badge}</span><span class="technique-card-arrow" aria-hidden="true">›</span></button>`;
  }

  function techniqueGroupsMarkup() {
    return `<div class="technique-groups">${GROUPS.map(([id,title,copy]) => {
      const rows = pathway.techniques.filter(item => item.group === id);
      return rows.length ? `<details class="technique-group" ${id === "prepare" ? "open" : ""}><summary><span><span class="technique-group-title">${safe(title)}</span><span class="technique-group-copy">${safe(copy)}</span></span></summary><div class="technique-group-body"><div class="technique-grid">${rows.map(techniqueCardMarkup).join("")}</div></div></details>` : "";
    }).join("")}</div>`;
  }

  function edgeLinkMarkup(edge,direction="prerequisite") {
    const targetId = direction === "next" ? edge.techniqueId : edge.prerequisiteTechniqueId;
    const label = direction === "next" ? (edge.kind === "hard" ? "Safety-gated next step" : "Later technique") : (edge.kind === "hard" ? "Safety prerequisite" : "Helpful preparation");
    return `<button class="technique-link ${edge.kind === "hard" ? "hard" : ""}" type="button" data-v27-technique="${safe(targetId)}"><span><strong>${safe(edge.title || techniqueById(targetId)?.title || "Related technique")}</strong><small>${safe(label)} · ${safe(edge.rationale || edge.supportImplication)}</small></span><span aria-hidden="true">›</span></button>`;
  }

  function renderTechniqueDetail(id) {
    const technique = techniqueById(id);
    if (!technique) return renderCookingDomain();
    const prerequisites = prerequisitesFor(id);
    const hard = prerequisites.filter(edge => edge.kind === "hard");
    const recommended = prerequisites.filter(edge => edge.kind === "recommended");
    const leadsTo = unlocksFrom(id);
    const directCount = directCandidateIds(id).length;
    return `<button class="skills-back" type="button" data-v27-technique-back>← Cooking</button><div class="technique-detail">
      <article class="technique-detail-hero"><p class="eyebrow">Cooking technique</p><h2>${safe(technique.title)}</h2><p>${safe(technique.description)}</p></article>
      <section class="technique-detail-section"><h3>Safety and support</h3><p>${safe(supportLabel(technique.safetySupport))}</p>${technique.safetyNote ? `<div class="technique-safety">${safe(technique.safetyNote)}</div>` : ""}</section>
      ${hard.length ? `<section class="technique-detail-section"><h3>Safety prerequisite</h3><p>This is a genuine pathway dependency. Activity availability is checked separately for the current setup.</p><div class="technique-link-list">${hard.map(edge => edgeLinkMarkup(edge)).join("")}</div></section>` : ""}
      ${recommended.length ? `<section class="technique-detail-section"><h3>Helpful before this</h3><p>These can make the technique easier to interpret, but they do not lock it.</p><div class="technique-link-list">${recommended.map(edge => edgeLinkMarkup(edge)).join("")}</div></section>` : ""}
      ${leadsTo.length ? `<section class="technique-detail-section"><h3>Where this can lead</h3><div class="technique-link-list">${leadsTo.map(edge => edgeLinkMarkup(edge,"next")).join("")}</div></section>` : ""}
      <div class="technique-readonly-note"><strong>${directCount ? `${directCount} direct learning ${directCount === 1 ? "activity is" : "activities are"} linked to this technique.` : "No direct primary learning activity is linked yet."}</strong>${directCount ? "Choose it to ask rec-v1 what is eligible for this setup." : "You can still explore its pathway relationships."}</div>
    </div>`;
  }

  function stateMarkup() {
    if (["idle","loading"].includes(pathway.status)) return '<div class="technique-pathway-state" role="status"><strong>Loading the Cooking pathway…</strong>Checking the current learning map.</div>';
    return `<div class="technique-pathway-state" role="status"><strong>Cooking pathway unavailable</strong>${safe(pathway.error || "The current learning map could not be loaded.")}<div class="rec-controls"><button class="secondary-button" type="button" data-v27-retry-pathway>Try again</button></div></div>`;
  }

  function renderCookingDomain() {
    const current = learnItems().filter(job => /cook|food|kitchen|knife|recipe/i.test([job.category,job.skill,job.title,job.scope].join(" ")) && !["completed","withdrawn"].includes(job.status));
    return `<button class="skills-back" type="button" data-skills-back>← All skill areas</button><div class="domain-hero"><span class="domain-hero-icon" aria-hidden="true">🍳</span><div><p class="eyebrow">Learning domain</p><h2>Cooking</h2><p>Explore techniques, see how they connect, and choose real practice with suitable safety and support.</p></div></div>
      ${current.length ? `<section class="skills-section"><div class="section-heading"><div><h2>Cooking I'm practising</h2><p>Activities already in your authoritative Learn list.</p></div></div>${learnCardsMarkup(current,"No Cooking activity active")}</section>` : ""}
      <section class="skills-section" aria-labelledby="v27-techniques-heading"><div class="section-heading"><div><h2 id="v27-techniques-heading">Explore cooking techniques</h2><p>Open a technique to see its safety dependencies and helpful preparation.</p></div></div>${pathway.status === "ready" ? techniqueGroupsMarkup() : stateMarkup()}</section>
      <section class="skills-section"><div id="learn-recommendation-host"></div></section>`;
  }

  injectStyles();
  app.skillsTechniqueId = app.skillsTechniqueId || "";
  const baseNavigationState = navigationState;
  const baseApplyNavigationState = applyNavigationState;
  const baseSetSkillsDomain = setSkillsDomain;
  const baseRenderSkills = renderSkills;

  navigationState = function(extra={}) {
    const state = baseNavigationState(extra);
    state.skillsTechniqueId = app.skillsDomain === "cooking" ? String(app.skillsTechniqueId || "") : "";
    return state;
  };
  applyNavigationState = function(state) {
    app.skillsTechniqueId = state?.sophieApp && state.skillsDomain === "cooking" ? String(state.skillsTechniqueId || "") : "";
    return baseApplyNavigationState(state);
  };
  setSkillsDomain = function(domain,options={}) {
    app.skillsTechniqueId = "";
    return baseSetSkillsDomain(domain,options);
  };
  renderSkills = function() {
    const host = document.querySelector("#skills-workspace");
    if (!host) return;
    if (app.skillsDomain !== "cooking") return baseRenderSkills();
    if (pathway.status === "idle") requestPathway();
    host.innerHTML = app.skillsTechniqueId && pathway.status === "ready" ? renderTechniqueDetail(app.skillsTechniqueId) : renderCookingDomain();
    if (!app.skillsTechniqueId) renderLearningRecommendationEntry();
  };

  function openTechnique(id,{historyMode="push"}={}) {
    if (!techniqueById(id)) return;
    app.activeView = "skills"; app.skillsDomain = "cooking"; app.skillsTechniqueId = String(id);
    renderSkills(); window.scrollTo({top:0,behavior:"smooth"}); writeNavigationState(historyMode);
  }

  document.addEventListener("click",event => {
    const technique = event.target.closest("[data-v27-technique]");
    if (technique) { event.preventDefault(); openTechnique(technique.dataset.v27Technique); return; }
    const retry = event.target.closest("[data-v27-retry-pathway]");
    if (retry) { event.preventDefault(); requestPathway({force:true}); renderSkills(); return; }
    const back = event.target.closest("[data-v27-technique-back]");
    if (back) {
      event.preventDefault();
      if (history.state?.sophieApp && app.skillsTechniqueId) history.back();
      else { app.skillsTechniqueId = ""; renderSkills(); writeNavigationState("replace"); }
    }
  });

  if (app.activeView === "skills") renderSkills();
})();
