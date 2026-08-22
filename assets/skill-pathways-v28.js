/* Sophie App v2.8 domain-driven interactive Skill Pathways.
 * Structure comes only from the credential-protected pathway-v1 read model.
 * rec-v1 remains authoritative for eligibility and D-006 Learn creation.
 */
(() => {
  "use strict";

  const CONTRACT = "pathway-v1";
  const DOMAIN_CONFIG = Object.freeze({
    cooking: Object.freeze({
      name:"Cooking", icon:"🍳",
      copy:"Explore techniques, see how they connect, and choose real practice with suitable safety and support.",
      current:"Cooking I'm practising", explore:"Explore cooking techniques",
      groups:[
        ["prepare","Prepare and organise","Set up the work, use tools carefully and make ingredients ready."],
        ["heat","Heat and cooking","Learn how pans, pots, ovens and direct heat behave."],
        ["judge","Judge and adjust","Use food cues, taste and texture to make decisions."],
        ["bake","Grains, batter and dough","Work with ratios, texture and methods that change over time."],
        ["coordinate","Bring meals together","Plan and coordinate more than one part of a meal."]
      ],
      families:{organisation:"prepare",measurement:"prepare",knife_and_prep:"prepare",safety:"prepare",assembly:"prepare",preparation:"prepare",equipment:"prepare",heat_control:"heat",moist_heat:"heat",oven:"heat",judgement:"judge",flavour:"judge",sauces_and_dressings:"judge",grains:"bake",baking:"bake",coordination:"coordinate"}
    }),
    laundry: Object.freeze({
      name:"Laundry", icon:"🧺",
      copy:"Build a practical laundry routine, with care labels and safety support guiding each real step.",
      current:"Laundry I'm practising", explore:"Explore laundry techniques",
      groups:[
        ["sort","Read and sort","Use labels and sorting to decide what belongs together."],
        ["wash","Wash safely","Set up the machine and products with the right adult support."],
        ["dry","Dry and finish","Choose appropriate drying and put clothes away."],
        ["care","Care for clothes","Respond to simple stains and fabric needs."],
        ["routine","Plan the loop","Link small steps into a workable laundry routine."]
      ],
      families:{labels:"sort",sorting:"sort",product_safety:"wash",machine_setup:"wash",drying:"dry",stain_response:"care",finish:"dry",planning:"routine"}
    }),
    money: Object.freeze({
      name:"Money", icon:"💳",
      copy:"Use Sophie's real account names to practise choices. This app does not show a live bank balance or move bank money.",
      current:"Money I'm practising", explore:"Explore money techniques",
      groups:[
        ["understand","Know where money is","Understand Smart Access, Youthsaver and goals without double-counting."],
        ["decide","Make a choice","Think ahead, compare options and keep decisions Sophie's."],
        ["move","Move money on purpose","Use a parent-supported transfer only after a real decision."],
        ["check","Pause and check","Reconcile what happened and ask for help with unfamiliar offers."]
      ],
      families:{account_model:"understand",balance_check:"understand",money_state:"understand",decision:"decide",transfer:"move",goals:"decide",financial_safety:"check",reconciliation:"check"}
    }),
    "pet-care": Object.freeze({
      name:"Lagotto care", icon:"🐩",
      copy:"Take part in kind, safe care for your Lagotto Romagnolo with adult direction for anything that needs it.",
      current:"Lagotto care I'm practising", explore:"Explore Lagotto care techniques",
      groups:[
        ["notice","Notice and communicate","Read the dog's signals and tell an adult what you notice."],
        ["routine","Daily care","Take part in predictable food, water and hygiene routines."],
        ["walk","Prepare and walk safely","Practise adult-supported lead and walking routines."],
        ["coat","Gentle coat care","Use consent and gentle checks for the Lagotto's curly coat."],
        ["enrich","Scent and enrichment","Set up simple adult-approved activities that suit a Lagotto."]
      ],
      families:{daily_care:"routine",safe_interaction:"notice",walk_setup:"walk",walk:"walk",hygiene:"routine",coat_care:"coat",enrichment:"enrich",observation:"notice"}
    })
  });

  const pathways = app.v28Pathways = app.v28Pathways || {};
  function activeDomainId() {
    return Object.prototype.hasOwnProperty.call(DOMAIN_CONFIG, app.skillsDomain) ? app.skillsDomain : "cooking";
  }
  function activeDomainConfig() {
    return DOMAIN_CONFIG[activeDomainId()];
  }
  function isPathwayDomain(domain) {
    return Object.prototype.hasOwnProperty.call(DOMAIN_CONFIG, String(domain || ""));
  }
  app.v28DomainContext = function(domain) {
    return DOMAIN_CONFIG[String(domain || "")] || null;
  };
  function pathwayFor(domain=activeDomainId()) {
    if (!pathways[domain]) pathways[domain] = { status:"idle", domain:domain, techniques:[], error:"", request:null };
    return pathways[domain];
  }
  function groupFor(domain, family) {
    const config = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG.cooking;
    return config.families[String(family || "")] || config.groups[0][0];
  }
  const supportLabel = value => ({
    none:"No special support listed",adult_available:"Adult available",
    adult_nearby:"Adult nearby",direct_supervision:"Adult stays with you"
  })[value] || "Support depends on the activity";

  function normaliseTechnique(row, domain) {
    const safety = row?.safety && typeof row.safety === "object" ? row.safety : {};
    const family = String(row?.family || "");
    return {
      id:String(row?.techniqueId || ""), title:String(row?.title || ""),
      family:family, group:groupFor(domain, family),
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

  function acceptPayload(domain, result) {
    const config = DOMAIN_CONFIG[domain];
    if (String(result?.learningPathwayContractVersion || "") !== CONTRACT) {
      throw new Error("Learning pathway capability mismatch.");
    }
    if (!config || String(result?.domain || "") !== domain || !Array.isArray(result?.techniques)) {
      throw new Error("The " + String(config?.name || "selected") + " pathway response is incomplete.");
    }
    const techniques = result.techniques.map(row => normaliseTechnique(row, domain)).filter(item => item.id && item.title);
    if (!techniques.length) throw new Error("No active " + config.name + " techniques are available.");
    const state = pathwayFor(domain);
    state.status = "ready";
    state.techniques = techniques;
    state.error = "";
    app.v28PathwaySource = Object.freeze({
      version:CONTRACT, domain:domain, authority:"backend",
      sourceTables:["Techniques","TechniquePrerequisites","CandidateTechniques","LearnCandidates"]
    });
  }

  const techniqueById = id => pathwayFor().techniques.find(item => item.id === String(id)) || null;
  const directCandidateIds = id => {
    const technique = techniqueById(id);
    return technique ? technique.candidateLinks.filter(link => link.role === "primary_practice").map(link => link.candidateId) : [];
  };
  const prerequisitesFor = id => techniqueById(id)?.prerequisites || [];
  const unlocksFrom = id => pathwayFor().techniques.flatMap(technique =>
    technique.prerequisites.filter(edge => edge.prerequisiteTechniqueId === String(id))
      .map(edge => ({...edge, techniqueId:technique.id, title:technique.title}))
  );
  app.v28CandidateIdsForTechnique = function(id, domain) {
    const state = pathwayFor(domain || activeDomainId());
    const technique = state.techniques.find(item => item.id === String(id));
    return technique ? technique.candidateLinks.filter(link => link.role === "primary_practice").map(link => link.candidateId) : [];
  };

  function requestPathway({force=false,domain=activeDomainId()} = {}) {
    if (!isPathwayDomain(domain)) return Promise.resolve({ status:"unavailable", domain:domain, techniques:[], error:"That pathway is not available." });
    const state = pathwayFor(domain);
    const config = DOMAIN_CONFIG[domain];
    if (!force && state.status === "ready") return Promise.resolve(state);
    if (!force && state.status === "loading" && state.request) return state.request;
    if (!recommendationInteractionReady()) {
      state.status = "unavailable";
      state.error = app.rec?.unauthorised
        ? "Learning pathways need to be set up again in Parent Mode."
        : "Learning pathways are not available on this device yet.";
      return Promise.resolve(state);
    }
    state.status = "loading";
    state.error = "";
    state.request = recommendationPost({action:"getLearningPathway",domain:domain})
      .then(result => { acceptPayload(domain, result); return state; })
      .catch(error => {
        state.status = "error";
        state.techniques = [];
        state.error = error?.message || ("The " + config.name + " pathway could not be loaded.");
        return state;
      })
      .finally(() => {
        state.request = null;
        if (app.activeView === "skills" && app.skillsDomain === domain) renderSkills();
      });
    return state.request;
  }

  function injectStyles() {
    if (document.getElementById("v28-skill-pathway-styles")) return;
    const style = document.createElement("style");
    style.id = "v28-skill-pathway-styles";
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
    return `<button class="technique-card" type="button" data-v28-technique="${safe(technique.id)}"><span class="technique-card-icon" aria-hidden="true">${technique.safetyCritical ? "🛡️" : "◇"}</span><span class="technique-card-copy"><strong>${safe(technique.title)}</strong><small>${safe(technique.description)}</small>${badge}</span><span class="technique-card-arrow" aria-hidden="true">›</span></button>`;
  }

  function techniqueGroupsMarkup() {
    const state = pathwayFor();
    const config = activeDomainConfig();
    return `<div class="technique-groups">${config.groups.map(([id,title,copy]) => {
      const rows = state.techniques.filter(item => item.group === id);
      return rows.length ? `<details class="technique-group" ${id === config.groups[0][0] ? "open" : ""}><summary><span><span class="technique-group-title">${safe(title)}</span><span class="technique-group-copy">${safe(copy)}</span></span></summary><div class="technique-group-body"><div class="technique-grid">${rows.map(techniqueCardMarkup).join("")}</div></div></details>` : "";
    }).join("")}</div>`;
  }

  function edgeLinkMarkup(edge,direction="prerequisite") {
    const targetId = direction === "next" ? edge.techniqueId : edge.prerequisiteTechniqueId;
    const label = direction === "next" ? (edge.kind === "hard" ? "Safety-gated next step" : "Later technique") : (edge.kind === "hard" ? "Safety prerequisite" : "Helpful preparation");
    return `<button class="technique-link ${edge.kind === "hard" ? "hard" : ""}" type="button" data-v28-technique="${safe(targetId)}"><span><strong>${safe(edge.title || techniqueById(targetId)?.title || "Related technique")}</strong><small>${safe(label)} · ${safe(edge.rationale || edge.supportImplication)}</small></span><span aria-hidden="true">›</span></button>`;
  }

  function renderTechniqueDetail(id) {
    const technique = techniqueById(id);
    if (!technique) return renderPathwayDomain();
    const prerequisites = prerequisitesFor(id);
    const hard = prerequisites.filter(edge => edge.kind === "hard");
    const recommended = prerequisites.filter(edge => edge.kind === "recommended");
    const leadsTo = unlocksFrom(id);
    const directCount = directCandidateIds(id).length;
    return `<button class="skills-back" type="button" data-v28-technique-back>← ${safe(activeDomainConfig().name)}</button><div class="technique-detail">
      <article class="technique-detail-hero"><p class="eyebrow">${safe(activeDomainConfig().name)} technique</p><h2>${safe(technique.title)}</h2><p>${safe(technique.description)}</p></article>
      <section class="technique-detail-section"><h3>Safety and support</h3><p>${safe(supportLabel(technique.safetySupport))}</p>${technique.safetyNote ? `<div class="technique-safety">${safe(technique.safetyNote)}</div>` : ""}</section>
      ${hard.length ? `<section class="technique-detail-section"><h3>Safety prerequisite</h3><p>This is a genuine pathway dependency. Activity availability is checked separately for the current setup.</p><div class="technique-link-list">${hard.map(edge => edgeLinkMarkup(edge)).join("")}</div></section>` : ""}
      ${recommended.length ? `<section class="technique-detail-section"><h3>Helpful before this</h3><p>These can make the technique easier to interpret, but they do not lock it.</p><div class="technique-link-list">${recommended.map(edge => edgeLinkMarkup(edge)).join("")}</div></section>` : ""}
      ${leadsTo.length ? `<section class="technique-detail-section"><h3>Where this can lead</h3><div class="technique-link-list">${leadsTo.map(edge => edgeLinkMarkup(edge,"next")).join("")}</div></section>` : ""}
      <div class="technique-readonly-note"><strong>${directCount ? `${directCount} direct learning ${directCount === 1 ? "activity is" : "activities are"} linked to this technique.` : "No direct primary learning activity is linked yet."}</strong>${directCount ? "Choose it to ask rec-v1 what is eligible for this setup." : "You can still explore its pathway relationships."}</div>
    </div>`;
  }

  function stateMarkup() {
    const state = pathwayFor();
    const config = activeDomainConfig();
    if (["idle","loading"].includes(state.status)) return `<div class="technique-pathway-state" role="status"><strong>Loading the ${safe(config.name)} pathway…</strong>Checking the current learning map.</div>`;
    return `<div class="technique-pathway-state" role="status"><strong>${safe(config.name)} pathway unavailable</strong>${safe(state.error || "The current learning map could not be loaded.")}<div class="rec-controls"><button class="secondary-button" type="button" data-v28-retry-pathway>Try again</button></div></div>`;
  }

  function renderPathwayDomain() {
    const config = activeDomainConfig();
    const state = pathwayFor();
    const current = learnItems().filter(job => String(job.skillId || "") === ({
      cooking:"S001", laundry:"S003", money:"S005", "pet-care":"S009"
    })[activeDomainId()] && !["completed","withdrawn"].includes(job.status));
    return `<button class="skills-back" type="button" data-skills-back>← All skill areas</button><div class="domain-hero"><span class="domain-hero-icon" aria-hidden="true">${safe(config.icon)}</span><div><p class="eyebrow">Learning domain</p><h2>${safe(config.name)}</h2><p>${safe(config.copy)}</p></div></div>
      ${current.length ? `<section class="skills-section"><div class="section-heading"><div><h2>${safe(config.current)}</h2><p>Activities already in your authoritative Learn list.</p></div></div>${learnCardsMarkup(current,"No active Learn activity")}</section>` : ""}
      <section class="skills-section" aria-labelledby="v28-techniques-heading"><div class="section-heading"><div><h2 id="v28-techniques-heading">${safe(config.explore)}</h2><p>Open a technique to see its safety dependencies and helpful preparation.</p></div></div>${state.status === "ready" ? techniqueGroupsMarkup() : stateMarkup()}</section>
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
    state.skillsTechniqueId = isPathwayDomain(app.skillsDomain) ? String(app.skillsTechniqueId || "") : "";
    return state;
  };
  applyNavigationState = function(state) {
    app.skillsTechniqueId = state?.sophieApp && isPathwayDomain(state.skillsDomain) ? String(state.skillsTechniqueId || "") : "";
    return baseApplyNavigationState(state);
  };
  setSkillsDomain = function(domain,options={}) {
    app.skillsTechniqueId = "";
    return baseSetSkillsDomain(domain,options);
  };
  renderSkills = function() {
    const host = document.querySelector("#skills-workspace");
    if (!host) return;
    if (!isPathwayDomain(app.skillsDomain)) return baseRenderSkills();
    if (pathwayFor().status === "idle") requestPathway();
    host.innerHTML = app.skillsTechniqueId && pathwayFor().status === "ready" ? renderTechniqueDetail(app.skillsTechniqueId) : renderPathwayDomain();
    if (!app.skillsTechniqueId) renderLearningRecommendationEntry();
  };

  function openTechnique(id,{historyMode="push"}={}) {
    if (!techniqueById(id)) return;
    app.activeView = "skills"; app.skillsDomain = activeDomainId(); app.skillsTechniqueId = String(id);
    renderSkills(); window.scrollTo({top:0,behavior:"smooth"}); writeNavigationState(historyMode);
  }

  document.addEventListener("click",event => {
    const technique = event.target.closest("[data-v28-technique]");
    if (technique) { event.preventDefault(); openTechnique(technique.dataset.v28Technique); return; }
    const retry = event.target.closest("[data-v28-retry-pathway]");
    if (retry) { event.preventDefault(); requestPathway({force:true}); renderSkills(); return; }
    const back = event.target.closest("[data-v28-technique-back]");
    if (back) {
      event.preventDefault();
      if (history.state?.sophieApp && app.skillsTechniqueId) history.back();
      else { app.skillsTechniqueId = ""; renderSkills(); writeNavigationState("replace"); }
    }
  });

  if (app.activeView === "skills" && isPathwayDomain(app.skillsDomain)) renderSkills();
})();
