/* Sophie App v2.7 staged interactive Skill Pathways.
 * Read-only technique snapshot generated from authoritative spreadsheet tables:
 * Techniques, TechniquePrerequisites and CandidateTechniques on 2026-08-22.
 * This snapshot describes pathway structure only. It must never be used as an
 * authoritative eligibility or mastery decision. rec-v1 remains authoritative
 * for candidate eligibility and D-006 Learn creation.
 */
(() => {
  "use strict";

  const SOURCE = Object.freeze({
    version: "v27-cooking-snapshot-2026-08-22",
    domain: "cooking",
    sourceTables: ["Techniques", "TechniquePrerequisites", "CandidateTechniques", "LearnCandidates"]
  });

  const TECHNIQUES = Object.freeze([
    { id:"COOK-T001", title:"Run the Prep", family:"organisation", group:"prepare", description:"Read ahead, identify equipment and ingredients, prepare what can be prepared before time-sensitive cooking, and keep the workspace workable.", safetyCritical:false, safetySupport:"none", safetyNote:"", directCandidates:["LC-COOK-002","LC-COOK-014"] },
    { id:"COOK-T002", title:"Measure It Properly", family:"measurement", group:"prepare", description:"Select suitable measuring tools; measure mass, volume and count accurately; and interpret common recipe units.", safetyCritical:false, safetySupport:"none", safetyNote:"Hot liquids still need the safety conditions of the activity using them.", directCandidates:["LC-COOK-003","LC-COOK-017"] },
    { id:"COOK-T003", title:"Set Up Sharp Tools Safely", family:"knife_and_prep", group:"prepare", description:"Stabilise the board or tool, select and position a suitable sharp tool, use safe grip and guiding-hand placement, and place or carry the tool safely.", safetyCritical:true, safetySupport:"direct_supervision", safetyNote:"Direct supervision is appropriate while safe sharp-tool setup and hand positioning are first being established.", directCandidates:["LC-COOK-001"] },
    { id:"COOK-T004", title:"Control the Knife", family:"knife_and_prep", group:"prepare", description:"Slice and chop ordinary ingredients with controlled movement and pieces consistent enough for the intended cooking or serving purpose.", safetyCritical:true, safetySupport:"adult_nearby", safetyNote:"Sophie-led cutting requires confirmed safe sharp-tool setup. Harder or unstable ingredients may need stronger support.", directCandidates:["LC-COOK-005","LC-COOK-015"] },
    { id:"COOK-T005", title:"Grate With Control", family:"knife_and_prep", group:"prepare", description:"Stabilise a grater or food and grate with deliberate hand clearance and suitable pressure.", safetyCritical:true, safetySupport:"direct_supervision", safetyNote:"Sharp grating surfaces require direct supervision until hand-clearance judgement is established.", directCandidates:["LC-COOK-012"] },
    { id:"COOK-T018", title:"Keep the Kitchen Safe", family:"safety", group:"prepare", description:"Use appropriate hand hygiene, maintain a workable clean space, manage spills and avoid obvious contamination during ordinary home cooking.", safetyCritical:true, safetySupport:"adult_available", safetyNote:"Support requirements increase when raw high-risk foods or specialised hazards are introduced.", directCandidates:[] },
    { id:"COOK-T019", title:"Build and Present the Dish", family:"assembly", group:"prepare", description:"Assemble prepared ingredients in a deliberate order and portion or present them so the food is practical and appealing to eat.", safetyCritical:false, safetySupport:"none", safetyNote:"Any sharp-tool preparation is governed separately.", directCandidates:["LC-COOK-026"] },
    { id:"COOK-T020", title:"Mix With Purpose", family:"preparation", group:"prepare", description:"Choose and control mixing, whisking or folding motions according to the desired texture without unnecessary force or duration.", safetyCritical:false, safetySupport:"none", safetyNote:"Mechanical mixer safety is separate from hand mixing.", directCandidates:[] },
    { id:"COOK-T021", title:"Use a Small Appliance Safely", family:"equipment", group:"prepare", description:"Use a small food processor or blender only with appropriate lid, hand-clearance and power-state checks.", safetyCritical:true, safetySupport:"direct_supervision", safetyNote:"Current seeded activities keep the powered-blade component adult-led. Future Sophie-led use needs explicit candidate design.", directCandidates:[] },

    { id:"COOK-T006", title:"Read the Heat", family:"heat_control", group:"heat", description:"Establish and adjust stovetop heat in response to what the food and cookware are doing rather than leaving the setting fixed.", safetyCritical:true, safetySupport:"adult_nearby", safetyNote:"Hot cookware and steam require activity-specific supervision even when heat judgement is the learning focus.", directCandidates:["LC-COOK-010","LC-COOK-011","LC-COOK-012","LC-COOK-013","LC-COOK-014"] },
    { id:"COOK-T007", title:"Sauté Without Steaming", family:"heat_control", group:"heat", description:"Use a hot pan, suitable fat and manageable quantities to cook food rapidly while controlling browning and moisture release.", safetyCritical:true, safetySupport:"adult_nearby", safetyNote:"Hot pan and possible oil splatter require activity-specific supervision.", directCandidates:["LC-COOK-013","LC-COOK-021","LC-COOK-023"] },
    { id:"COOK-T008", title:"Hold the Simmer", family:"moist_heat", group:"heat", description:"Bring liquid to the required temperature, distinguish simmering from boiling, and maintain a controlled simmer as ingredients and volume change.", safetyCritical:true, safetySupport:"adult_nearby", safetyNote:"Steam, hot liquid and pot handles require activity-specific supervision.", directCandidates:["LC-COOK-008","LC-COOK-021","LC-COOK-022","LC-COOK-023","LC-COOK-024"] },
    { id:"COOK-T009", title:"Manage a Boiling Pot", family:"moist_heat", group:"heat", description:"Bring and maintain a controlled boil where appropriate, add food safely, and judge pasta or similar foods by texture rather than time alone.", safetyCritical:true, safetySupport:"direct_supervision", safetyNote:"Large volumes of boiling water and draining create burn and lifting hazards. Draining may remain adult-led depending on the activity.", directCandidates:["LC-COOK-021","LC-COOK-022"] },
    { id:"COOK-T010", title:"Use the Oven With Intention", family:"oven", group:"heat", description:"Preheat, position and handle ordinary oven cookware safely, and use time together with food cues to judge progress.", safetyCritical:true, safetySupport:"adult_nearby", safetyNote:"Oven burns and awkward or heavy cookware require activity-specific support.", directCandidates:[] },
    { id:"COOK-T022", title:"Control Direct Grill Heat", family:"heat_control", group:"heat", description:"Cook suitable food over or under direct grill heat while controlling distance, turning and doneness.", safetyCritical:true, safetySupport:"direct_supervision", safetyNote:"Direct grilling is a higher-heat method and requires direct supervision in the seeded catalogue.", directCandidates:["LC-COOK-027"] },

    { id:"COOK-T011", title:"Know When It's Ready", family:"judgement", group:"judge", description:"Judge cooking progress and endpoint using appropriate combinations of colour, texture, tenderness, aroma, viscosity, time and temperature.", safetyCritical:false, safetySupport:"none", safetyNote:"Where food-safety temperatures apply, objective safety requirements remain separate from sensory judgement.", directCandidates:["LC-COOK-008","LC-COOK-010","LC-COOK-020","LC-COOK-027"] },
    { id:"COOK-T012", title:"Make It Taste Right", family:"flavour", group:"judge", description:"Taste safely, describe the result, make a deliberate incremental seasoning adjustment, then taste again.", safetyCritical:false, safetySupport:"none", safetyNote:"Tasting method must avoid cross-contamination.", directCandidates:["LC-COOK-004","LC-COOK-006","LC-COOK-007","LC-COOK-015","LC-COOK-024"] },
    { id:"COOK-T013", title:"Bring Oil and Water Together", family:"sauces_and_dressings", group:"judge", description:"Disperse oil and water-based ingredients into a usable dressing, recognise separation and re-emulsify while balancing flavour.", safetyCritical:false, safetySupport:"none", safetyNote:"No special hazard beyond normal hygiene for the seeded applications.", directCandidates:["LC-COOK-004"] },

    { id:"COOK-T014", title:"Cook the Grain", family:"grains", group:"bake", description:"Use an appropriate grain-to-liquid relationship, control heat through boil, simmer and absorption, rest as needed and judge texture.", safetyCritical:true, safetySupport:"adult_nearby", safetyNote:"Hot pot and steam safety apply. Risk depends on the activity and quantity.", directCandidates:["LC-COOK-009","LC-COOK-023","LC-COOK-025","LC-COOK-026"] },
    { id:"COOK-T015", title:"Know When to Stop Mixing", family:"baking", group:"bake", description:"Combine batter ingredients sufficiently for the intended method without unnecessary overmixing and portion the batter consistently.", safetyCritical:false, safetySupport:"none", safetyNote:"Separate pan or oven safety applies when batter is cooked.", directCandidates:["LC-COOK-011","LC-COOK-012","LC-COOK-017"] },
    { id:"COOK-T016", title:"Handle the Dough", family:"baking", group:"bake", description:"Mix and handle a simple dough according to its method, recognise stickiness and structure, and avoid unnecessary handling.", safetyCritical:false, safetySupport:"none", safetyNote:"Oven and mixer safety are activity-specific.", directCandidates:["LC-COOK-018","LC-COOK-019","LC-COOK-020"] },

    { id:"COOK-T017", title:"Bring It Together", family:"coordination", group:"coordinate", description:"Work backwards from serving time, distinguish active from passive time, sequence components and recover when timing changes.", safetyCritical:false, safetySupport:"adult_available", safetyNote:"Coordination itself is not a hazard, but combining multiple hot or sharp processes may require stronger activity-specific support.", directCandidates:["LC-COOK-019","LC-COOK-021","LC-COOK-022","LC-COOK-023","LC-COOK-024","LC-COOK-025","LC-COOK-026"] }
  ]);

  const PREREQUISITES = Object.freeze([
    { techniqueId:"COOK-T015", prerequisiteId:"COOK-T002", kind:"recommended", rationale:"Accurate measurement supports meaningful batter-texture practice.", support:"Measure together if needed rather than blocking a batter challenge.", safety:false },
    { techniqueId:"COOK-T015", prerequisiteId:"COOK-T020", kind:"recommended", rationale:"General mixing control supports recognising a batter endpoint.", support:"Model the required motion and let Sophie take over the endpoint judgement.", safety:false },
    { techniqueId:"COOK-T009", prerequisiteId:"COOK-T006", kind:"recommended", rationale:"General stovetop heat control supports safe and deliberate boiling-pot management.", support:"Increase adult support around heat changes. Boiling-water safety remains separately gated.", safety:false },
    { techniqueId:"COOK-T017", prerequisiteId:"COOK-T011", kind:"recommended", rationale:"Coordination is more meaningful when Sophie can notice when components need attention or are ready.", support:"Prompt for food cues and share timing decisions rather than requiring prior independent doneness judgement.", safety:false },
    { techniqueId:"COOK-T017", prerequisiteId:"COOK-T001", kind:"recommended", rationale:"Planning and prepared components reduce avoidable overload when coordinating a meal.", support:"Build the sequence together or reduce the number of simultaneous components.", safety:false },
    { techniqueId:"COOK-T016", prerequisiteId:"COOK-T002", kind:"recommended", rationale:"Dough hydration and structure depend on usable measurement.", support:"Use pre-measured ingredients or measure together if the main target is dough handling.", safety:false },
    { techniqueId:"COOK-T016", prerequisiteId:"COOK-T020", kind:"recommended", rationale:"General mixing control supports transitioning from ingredients to dough.", support:"Share early mixing and let Sophie take more ownership as the dough forms.", safety:false },
    { techniqueId:"COOK-T013", prerequisiteId:"COOK-T020", kind:"recommended", rationale:"Whisking control supports forming and restoring a vinaigrette emulsion.", support:"Demonstrate the whisk and pour pattern if needed.", safety:false },
    { techniqueId:"COOK-T013", prerequisiteId:"COOK-T012", kind:"recommended", rationale:"Useful vinaigrette practice includes tasting and balancing, not only mechanical emulsification.", support:"Offer flavour-category prompts without supplying a numeric target.", safety:false },
    { techniqueId:"COOK-T014", prerequisiteId:"COOK-T002", kind:"recommended", rationale:"Grain-to-liquid ratio depends on usable measurement.", support:"Measure together or provide pre-measured ingredients when the target is grain absorption.", safety:false },
    { techniqueId:"COOK-T014", prerequisiteId:"COOK-T008", kind:"recommended", rationale:"Absorption cookery usually relies on a controlled heat transition and simmer.", support:"Use more direct prompting around heat while preserving the grain task.", safety:false },
    { techniqueId:"COOK-T005", prerequisiteId:"COOK-T003", kind:"hard", rationale:"Sophie-led grating requires confirmed stable sharp-tool setup and hand-clearance behaviour.", support:"If not satisfied, the grating component must be adult-led in a separately defined activity variant.", safety:true },
    { techniqueId:"COOK-T022", prerequisiteId:"COOK-T006", kind:"recommended", rationale:"General heat-adjustment experience can support direct-grill judgement even though the heat source behaves differently.", support:"Keep direct supervision and narrate the different cues of direct grilling.", safety:false },
    { techniqueId:"COOK-T007", prerequisiteId:"COOK-T006", kind:"recommended", rationale:"Basic heat adjustment makes sautéing easier to interpret, but its absence does not itself make a supervised sauté activity ineligible.", support:"Offer more support and reduce simultaneous unfamiliar demands.", safety:false },
    { techniqueId:"COOK-T008", prerequisiteId:"COOK-T006", kind:"recommended", rationale:"General stovetop adjustment supports controlled simmering.", support:"Use show-me or do-it-with-me support for boil-to-simmer transitions when heat-control evidence is limited.", safety:false },
    { techniqueId:"COOK-T004", prerequisiteId:"COOK-T003", kind:"hard", rationale:"Sophie-led slicing and chopping requires prior confirmed safe sharp-tool setup and hand positioning.", support:"If not satisfied, use a separately curated adult-led-prep activity rather than treating extra runtime help as satisfying the gate.", safety:true }
  ]);

  const GROUPS = Object.freeze([
    ["prepare", "Prepare and organise", "Set up the work, use tools carefully and make the ingredients ready."],
    ["heat", "Heat and cooking", "Learn how pans, pots, ovens and direct heat behave."],
    ["judge", "Judge and adjust", "Use food cues, taste and texture to make decisions."],
    ["bake", "Grains, batter and dough", "Work with ratios, texture and methods that change over time."],
    ["coordinate", "Bring meals together", "Plan and coordinate more than one part of a meal."]
  ]);

  const supportLabel = value => ({ none:"No special support listed", adult_available:"Adult available", adult_nearby:"Adult nearby", direct_supervision:"Adult stays with you" })[value] || "Support depends on the activity";
  const techniqueById = id => TECHNIQUES.find(item => item.id === String(id)) || null;
  const prerequisitesFor = id => PREREQUISITES.filter(edge => edge.techniqueId === String(id));
  const unlocksFrom = id => PREREQUISITES.filter(edge => edge.prerequisiteId === String(id));

  function injectStyles() {
    if (document.getElementById("v27-skill-pathway-styles")) return;
    const style = document.createElement("style");
    style.id = "v27-skill-pathway-styles";
    style.textContent = `
      .technique-groups{display:grid;gap:12px}.technique-group{border:1px solid var(--line);border-radius:18px;background:var(--surface);overflow:hidden}.technique-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:52px;padding:12px 14px;cursor:pointer;list-style:none}.technique-group>summary::-webkit-details-marker{display:none}.technique-group>summary::after{content:"+";color:var(--brand);font-size:1.2rem;font-weight:900}.technique-group[open]>summary::after{content:"−"}.technique-group-head{min-width:0}.technique-group-head h3{margin:0 0 3px}.technique-group-head p{margin:0;color:var(--muted);font-size:.8125rem;line-height:1.4}.technique-group-body{padding:0 12px 12px}
      .technique-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.technique-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;min-height:64px;width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:17px;background:var(--surface);color:var(--ink);text-align:left;cursor:pointer;box-shadow:var(--shadow-soft)}
      .technique-card:focus-visible{outline:3px solid var(--brand);outline-offset:3px}.technique-card-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:var(--brand-soft);font-size:1.2rem}.technique-card-copy{min-width:0}.technique-card-copy strong{display:block;margin-bottom:3px;font-size:.95rem}.technique-card-copy small{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;color:var(--muted);font-size:.78rem;line-height:1.35}.technique-card-arrow{color:var(--brand);font-weight:900}
      .technique-badge{display:inline-flex;align-items:center;min-height:28px;margin-top:6px;padding:4px 8px;border-radius:99px;background:var(--surface-2);color:var(--muted);font-size:.7rem;font-weight:850}.technique-badge.hard{background:var(--sun);color:var(--sun-ink)}.technique-badge.safety{background:var(--rose);color:var(--rose-ink)}
      .technique-detail{display:grid;gap:18px}.technique-detail-hero{padding:20px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(145deg,var(--surface),var(--brand-soft));box-shadow:var(--shadow-soft)}.technique-detail-hero h2{margin:5px 0 7px}.technique-detail-hero p{margin:0;color:var(--muted);line-height:1.55}
      .technique-detail-section{padding:17px;border:1px solid var(--line);border-radius:18px;background:var(--surface)}.technique-detail-section h3{margin:0 0 8px}.technique-detail-section>p{margin:0;color:var(--muted);line-height:1.5}.technique-link-list{display:grid;gap:8px;margin-top:12px}.technique-link{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;min-height:52px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--ink);text-align:left;cursor:pointer}.technique-link strong{display:block}.technique-link small{display:block;margin-top:2px;color:var(--muted);line-height:1.35}.technique-link.hard{border-color:color-mix(in srgb,var(--sun-ink) 30%,var(--line));background:color-mix(in srgb,var(--sun) 45%,var(--surface))}
      .technique-safety{margin-top:10px;padding:11px 12px;border-radius:13px;background:var(--sun);color:var(--sun-ink);line-height:1.45}.technique-readonly-note{padding:12px 13px;border-radius:14px;background:var(--brand-soft);line-height:1.5}.technique-readonly-note strong{display:block;margin-bottom:3px}
      @media(max-width:839px){.technique-grid{grid-template-columns:1fr}}html.compact-device .technique-grid{grid-template-columns:1fr}html.compact-device .technique-groups{gap:1.25rem}html.compact-device .technique-card{min-height:3rem;padding:.6875rem .75rem;border-radius:1rem;box-shadow:none}html.compact-device .technique-group .technique-grid{overflow:hidden;border:1px solid var(--line);border-radius:1.125rem;background:var(--surface);gap:0}html.compact-device .technique-group .technique-card{border:0;border-bottom:1px solid var(--line);border-radius:0}html.compact-device .technique-group .technique-card:last-child{border-bottom:0}html.compact-device .technique-detail-hero,html.compact-device .technique-detail-section{padding:1rem;border-radius:1rem}
    `;
    document.head.appendChild(style);
  }

  function techniqueStatusMarkup(technique) {
    const edges = prerequisitesFor(technique.id);
    const hard = edges.filter(edge => edge.kind === "hard");
    const recommended = edges.filter(edge => edge.kind === "recommended");
    if (hard.length) return `<span class="technique-badge hard">Safety prerequisite</span>`;
    if (technique.safetyCritical) return `<span class="technique-badge safety">Safety support</span>`;
    if (recommended.length) return `<span class="technique-badge">Helpful preparation</span>`;
    return `<span class="technique-badge">Explore</span>`;
  }

  function techniqueCardMarkup(technique) {
    const icon = technique.safetyCritical ? "◆" : "◇";
    return `<button class="technique-card" type="button" data-v27-technique="${safe(technique.id)}" aria-label="Open ${safe(technique.title)}">
      <span class="technique-card-icon" aria-hidden="true">${icon}</span>
      <span class="technique-card-copy"><strong>${safe(technique.title)}</strong><small>${safe(technique.description)}</small>${techniqueStatusMarkup(technique)}</span>
      <span class="technique-card-arrow" aria-hidden="true">›</span>
    </button>`;
  }

  function techniqueGroupsMarkup() {
    return `<div class="technique-groups">${GROUPS.map(([id,title,copy]) => {
      const items = TECHNIQUES.filter(item => item.group === id);
      return `<details class="technique-group" ${id === "prepare" ? "open" : ""}><summary><span class="technique-group-head"><h3>${safe(title)}</h3><p>${safe(copy)} · ${items.length} techniques</p></span></summary><div class="technique-group-body"><div class="technique-grid">${items.map(techniqueCardMarkup).join("")}</div></div></details>`;
    }).join("")}</div>`;
  }

  function edgeLinkMarkup(edge, direction = "prerequisite") {
    const targetId = direction === "prerequisite" ? edge.prerequisiteId : edge.techniqueId;
    const target = techniqueById(targetId);
    if (!target) return "";
    const hard = edge.kind === "hard";
    const heading = direction === "next" ? (hard ? "Safety-gated next step" : "Can support this next step") : hard ? "Needed first for Sophie-led practice" : "Helpful preparation";
    return `<button class="technique-link ${hard ? "hard" : ""}" type="button" data-v27-technique="${safe(target.id)}"><span><strong>${safe(target.title)}</strong><small>${safe(heading)}. ${safe(edge.rationale)}</small></span><span aria-hidden="true">›</span></button>`;
  }

  function renderTechniqueDetail(techniqueId) {
    const technique = techniqueById(techniqueId);
    if (!technique) return renderCookingDomainV27();
    const prerequisites = prerequisitesFor(technique.id);
    const hard = prerequisites.filter(edge => edge.kind === "hard");
    const recommended = prerequisites.filter(edge => edge.kind === "recommended");
    const leadsTo = unlocksFrom(technique.id);
    const relatedCount = technique.directCandidates.length;
    return `<button class="skills-back" type="button" data-v27-technique-back>← Cooking</button>
      <div class="technique-detail">
        <article class="technique-detail-hero"><p class="eyebrow">Cooking technique</p><h2>${safe(technique.title)}</h2><p>${safe(technique.description)}</p></article>
        <section class="technique-detail-section"><h3>Safety and support</h3><p>${safe(supportLabel(technique.safetySupport))}</p>${technique.safetyNote ? `<div class="technique-safety">${safe(technique.safetyNote)}</div>` : ""}</section>
        ${hard.length ? `<section class="technique-detail-section"><h3>Needed first</h3><p>This is a real safety dependency. Extra help during the later activity does not automatically replace the prerequisite.</p><div class="technique-link-list">${hard.map(edge => edgeLinkMarkup(edge)).join("")}</div></section>` : ""}
        ${recommended.length ? `<section class="technique-detail-section"><h3>Helpful before this</h3><p>These can make the technique easier to interpret, but they do not lock it.</p><div class="technique-link-list">${recommended.map(edge => edgeLinkMarkup(edge)).join("")}</div></section>` : ""}
        ${leadsTo.length ? `<section class="technique-detail-section"><h3>Where this can lead</h3><p>This technique appears as preparation for these later techniques.</p><div class="technique-link-list">${leadsTo.map(edge => edgeLinkMarkup(edge, "next")).join("")}</div></section>` : ""}
        <div class="technique-readonly-note"><strong>${relatedCount ? `${relatedCount} direct learning ${relatedCount === 1 ? "activity is" : "activities are"} linked to this technique.` : "This technique does not yet have a direct primary learning activity."}</strong>${relatedCount ? "The next step is to ask rec-v1 which linked activity is actually eligible for the current session before anything can be added to Learn." : "For now this page is for understanding the pathway. It does not create or unlock an activity."}</div>
      </div>`;
  }

  function renderCookingDomainV27() {
    const cookingLearn = learnItems().filter(job => /cook|food|kitchen|knife|recipe/i.test([job.category, job.skill, job.title, job.scope].join(" ")) && !["completed", "withdrawn"].includes(job.status));
    return `<button class="skills-back" type="button" data-skills-back>← All skill areas</button>
      <div class="domain-hero"><span class="domain-hero-icon" aria-hidden="true">🍳</span><div><p class="eyebrow">Learning domain</p><h2>Cooking</h2><p>Explore techniques, see how they connect, and choose real food practice with the safety and support that fit the session.</p></div></div>
      ${cookingLearn.length ? `<section class="skills-section" aria-labelledby="cooking-current-heading"><div class="section-heading"><div><h2 id="cooking-current-heading">Cooking I'm practising</h2><p>Cooking Learn activities already in your authoritative D-006 list.</p></div></div>${learnCardsMarkup(cookingLearn, "No Cooking activity active")}</section>` : ""}
      <section class="skills-section" aria-labelledby="v27-techniques-heading"><div class="section-heading"><div><h2 id="v27-techniques-heading">Explore cooking techniques</h2><p>Open a technique to see safety dependencies, helpful preparation and where it can lead.</p></div></div>${techniqueGroupsMarkup()}</section>
      <section class="skills-section" aria-labelledby="cooking-discovery-heading"><div id="learn-recommendation-host"></div></section>`;
  }

  injectStyles();
  app.skillsTechniqueId = app.skillsTechniqueId || "";
  app.v27PathwaySource = SOURCE;

  const baseNavigationState = navigationState;
  const baseApplyNavigationState = applyNavigationState;
  const baseSetSkillsDomain = setSkillsDomain;
  const baseRenderSkills = renderSkills;

  navigationState = function(extra = {}) {
    const state = baseNavigationState(extra);
    state.skillsTechniqueId = app.skillsDomain === "cooking" ? String(app.skillsTechniqueId || "") : "";
    return state;
  };

  applyNavigationState = function(state) {
    app.skillsTechniqueId = state?.sophieApp && state.skillsDomain === "cooking" ? String(state.skillsTechniqueId || "") : "";
    return baseApplyNavigationState(state);
  };

  setSkillsDomain = function(domain, options = {}) {
    app.skillsTechniqueId = "";
    return baseSetSkillsDomain(domain, options);
  };

  renderSkills = function() {
    const host = document.querySelector("#skills-workspace");
    if (!host) return;
    if (app.skillsDomain !== "cooking") return baseRenderSkills();
    host.innerHTML = app.skillsTechniqueId ? renderTechniqueDetail(app.skillsTechniqueId) : renderCookingDomainV27();
    if (!app.skillsTechniqueId) renderLearningRecommendationEntry();
  };

  function openTechnique(id, { historyMode = "push" } = {}) {
    if (!techniqueById(id)) return;
    app.activeView = "skills";
    app.skillsDomain = "cooking";
    app.skillsTechniqueId = String(id);
    renderSkills();
    window.scrollTo({ top: 0, behavior: "smooth" });
    writeNavigationState(historyMode);
  }

  document.addEventListener("click", event => {
    const technique = event.target.closest("[data-v27-technique]");
    if (technique) {
      event.preventDefault();
      openTechnique(technique.dataset.v27Technique);
      return;
    }
    const back = event.target.closest("[data-v27-technique-back]");
    if (back) {
      event.preventDefault();
      if (history.state?.sophieApp && app.skillsTechniqueId) history.back();
      else {
        app.skillsTechniqueId = "";
        renderSkills();
        writeNavigationState("replace");
      }
    }
  });

  // The main script may have rendered Skills before this staged enhancement loaded.
  if (app.activeView === "skills") renderSkills();
})();
