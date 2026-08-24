/* Sophie App issue #48 - Sophie-authored suggestions frontend.
 * Draft-only frontend integration against the accepted issue #48 UX/behaviour/backend contracts.
 * A suggestion is non-authoritative until parent review creates a final authoritative activity.
 */
(() => {
  "use strict";

  const DEVICE_STORAGE_KEY = "sophie_suggestion_device_key";
  const ACTIONS = Object.freeze({
    list: "getSuggestions",
    create: "createSuggestion",
    update: "updateSuggestion",
    withdraw: "withdrawSuggestion",
    parentList: "getSuggestionsAdmin",
    review: "reviewSuggestion",
    provision: "provisionSuggestionDevice",
    rotate: "rotateSuggestionDeviceKey"
  });
  const DOMAIN_LABELS = Object.freeze({ contribute: "CONTRIBUTE", earn: "EARN", learn: "LEARN" });
  const state = app.issue48Suggestions = app.issue48Suggestions || {
    items: [], parentItems: [], loaded: false, loading: false,
    parentLoaded: false, parentLoading: false, unavailable: false,
    parentUnavailable: false, currentId: "", currentDomain: "",
    createRequestId: "", reviewRequestId: "", formDirty: false
  };

  function suggestionCredential() {
    try { return localStorage.getItem(DEVICE_STORAGE_KEY) || ""; } catch { return ""; }
  }
  function setSuggestionCredential(value) {
    try { if (value) localStorage.setItem(DEVICE_STORAGE_KEY, value); else localStorage.removeItem(DEVICE_STORAGE_KEY); } catch {}
  }
  function requestId(prefix) {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
  function firstDefined(source, names, fallback = "") {
    for (const name of names) if (source && source[name] !== undefined && source[name] !== null) return source[name];
    return fallback;
  }
  function normaliseSuggestion(row = {}) {
    const finalPlan = row.finalPlan && typeof row.finalPlan === "object" ? row.finalPlan : {};
    const item = {
      id: String(firstDefined(row, ["suggestionId", "SuggestionID", "id"], "")),
      domain: String(firstDefined(row, ["domain", "Domain"], "")).toLowerCase(),
      status: String(firstDefined(row, ["status", "Status"], "pending")).toLowerCase(),
      title: String(firstDefined(row, ["title", "Title"], "")),
      description: String(firstDefined(row, ["description", "Description"], "")),
      timingOrFrequency: String(firstDefined(row, ["timingOrFrequency", "TimingOrFrequency"], "")),
      suggestedAmount: Number(firstDefined(row, ["suggestedAmount", "SuggestedAmount"], 0)) || 0,
      interestReason: String(firstDefined(row, ["interestReason", "InterestReason"], "")),
      suggestedLink: String(firstDefined(row, ["suggestedLink", "SuggestedLink"], "")),
      submittedAt: String(firstDefined(row, ["submittedAt", "SubmittedAt"], "")),
      updatedAt: String(firstDefined(row, ["updatedAt", "UpdatedAt"], "")),
      revision: Number(firstDefined(row, ["revision", "Revision"], 0)) || 0,
      reviewReasonText: String(firstDefined(row, ["reviewReasonText", "ReviewReasonText"], "")),
      finalTitle: String(firstDefined(row, ["finalTitle", "FinalTitle"], firstDefined(finalPlan, ["title"], ""))),
      finalScope: String(firstDefined(row, ["finalScope", "FinalScope"], firstDefined(finalPlan, ["scope"], ""))),
      finalRequiredness: String(firstDefined(row, ["finalRequiredness", "FinalRequiredness"], firstDefined(finalPlan, ["requiredness"], ""))),
      finalFrequency: String(firstDefined(row, ["finalFrequency", "FinalFrequency"], firstDefined(finalPlan, ["frequency"], ""))),
      finalCompletionStandard: String(firstDefined(row, ["finalCompletionStandard", "FinalCompletionStandard"], firstDefined(finalPlan, ["completionStandard"], ""))),
      finalEstimatedMinutes: Number(firstDefined(row, ["finalEstimatedMinutes", "FinalEstimatedMinutes"], firstDefined(finalPlan, ["estimatedMinutes"], 0))) || 0,
      finalAgreedPay: Number(firstDefined(row, ["finalAgreedPay", "FinalAgreedPay"], firstDefined(finalPlan, ["agreedPay"], 0))) || 0,
      finalSkillArea: String(firstDefined(row, ["finalSkillArea", "FinalSkillArea"], firstDefined(finalPlan, ["skillArea"], ""))),
      finalTechniqueTitle: String(firstDefined(row, ["finalTechniqueTitle", "FinalTechniqueTitle"], firstDefined(finalPlan, ["techniqueTitle"], ""))),
      finalActivityTitle: String(firstDefined(row, ["finalActivityTitle", "FinalActivityTitle"], firstDefined(finalPlan, ["activityTitle"], ""))),
      mappingOptions: Array.isArray(row.mappingOptions) ? row.mappingOptions.map(option => ({
        label: String(firstDefined(option, ["label", "title"], "Learning activity")),
        candidateId: String(firstDefined(option, ["candidateId", "CandidateID"], "")),
        techniqueId: String(firstDefined(option, ["techniqueId", "TechniqueID"], "")),
        skillArea: String(firstDefined(option, ["skillArea", "domainName"], ""))
      })).filter(option => option.candidateId && option.techniqueId) : []
    };
    return item.id && ["contribute", "earn", "learn"].includes(item.domain) ? item : null;
  }
  function rowsFrom(result) { return Array.isArray(result) ? result : Array.isArray(result?.suggestions) ? result.suggestions : []; }
  function itemById(id, parent = false) { return (parent ? state.parentItems : state.items).find(item => item.id === String(id)) || null; }
  function dateLabel(value) {
    const date = new Date(value); if (!value || Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }
  function statusCopy(item) {
    if (item.status === "pending") return "Waiting for parent review";
    if (item.status === "withdrawn") return "Withdrawn";
    if (item.status === "approved") return item.domain === "earn" ? "Paid job agreed" : item.domain === "learn" ? "Added to Learn" : "Added to Contribute";
    if (item.status === "not_yet" && item.domain === "learn") return "Not yet";
    if (item.status === "declined") return "Not agreed this time";
    return "Reviewed";
  }
  function suggestionPost(operation, { parent = false } = {}) {
    const payload = { ...operation };
    if (parent) {
      if (!parentSessionValid()) return Promise.reject(Object.assign(new Error("Parent Mode is locked. Sign in again."), { code: "PARENT_LOCKED" }));
      payload.adminKey = app.adminKey; extendParentSession();
    } else {
      const credential = suggestionCredential();
      if (!credential) return Promise.reject(Object.assign(new Error("Suggestions aren't available on this device yet."), { code: "SUGGESTION_DEVICE_UNAVAILABLE" }));
      payload.suggestionKey = credential;
    }
    return apiPost(payload);
  }

  function ensureStyles() {
    if (document.getElementById("issue48-suggestion-styles")) return;
    const style = document.createElement("style");
    style.id = "issue48-suggestion-styles";
    style.textContent = `
      .issue48-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0 18px}.issue48-actions button{min-height:44px}
      .issue48-device-state{margin:10px 0 16px;padding:12px 14px;border:1px solid var(--line);border-radius:15px;background:var(--surface-2);color:var(--muted);line-height:1.45}
      .issue48-list{display:grid;gap:10px}.issue48-card{padding:15px}.issue48-card h3{margin:4px 0 7px}.issue48-card-meta{display:flex;flex-wrap:wrap;gap:7px;color:var(--muted);font-size:.82rem}.issue48-status{display:inline-flex;padding:5px 8px;border-radius:99px;background:var(--surface-2);font-weight:800}.issue48-summary{margin:10px 0 0;line-height:1.5;color:var(--muted)}
      .issue48-detail-grid,.issue48-parent-grid{display:grid;gap:12px}.issue48-source,.issue48-final{padding:15px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}.issue48-source dl,.issue48-final dl{display:grid;grid-template-columns:minmax(110px,.35fr) 1fr;gap:6px 12px;margin:0}.issue48-source dt,.issue48-final dt{font-weight:800}.issue48-source dd,.issue48-final dd{margin:0;overflow-wrap:anywhere}
      .issue48-parent-section{margin:22px 0}.issue48-parent-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:12px}.issue48-parent-head p{margin:0;color:var(--muted)}.issue48-parent-access{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:center;margin:0 0 14px;padding:12px 14px;border:1px solid var(--line);border-radius:15px;background:var(--surface-2)}
      .issue48-form-note,.issue48-helper{color:var(--muted);line-height:1.45}.issue48-error{padding:10px 12px;border-radius:12px;background:var(--rose);color:var(--rose-ink);line-height:1.45}.issue48-review-reason{display:grid;gap:7px}.issue48-fullscreen-dialog{max-width:min(720px,calc(100vw - 24px));width:100%}.issue48-fullscreen-dialog .dialog-body{max-height:min(88vh,900px);overflow:auto}
      @media(max-width:620px){.issue48-actions{display:grid;grid-template-columns:1fr}.issue48-actions button{width:100%}.issue48-source dl,.issue48-final dl{grid-template-columns:1fr}.issue48-fullscreen-dialog{width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;border-radius:0}.issue48-fullscreen-dialog .dialog-body{max-height:100dvh;min-height:100dvh}}
      html.compact-device .issue48-card,html.compact-device .issue48-device-state,html.compact-device .issue48-source,html.compact-device .issue48-final,html.compact-device .issue48-form-note,html.compact-device .issue48-helper{font-size:16px}
    `;
    document.head.appendChild(style);
  }
  function ensureDialogs() {
    if (document.getElementById("issue48-suggestion-dialog")) return;
    const host = document.createElement("div");
    host.innerHTML = `<dialog id="issue48-suggestion-dialog" class="issue48-fullscreen-dialog"><form class="dialog-body" id="issue48-suggestion-form"></form></dialog><dialog id="issue48-suggestions-dialog" class="issue48-fullscreen-dialog"><div class="dialog-body"><div class="dialog-head"><div><p class="eyebrow">YOUR IDEAS</p><h2>My suggestions</h2></div><button class="close-button" type="button" data-issue48-close="issue48-suggestions-dialog" aria-label="Close My suggestions">×</button></div><div id="issue48-suggestions-body"></div></div></dialog><dialog id="issue48-detail-dialog" class="issue48-fullscreen-dialog"><div class="dialog-body" id="issue48-detail-body"></div></dialog><dialog id="issue48-confirm-dialog" class="issue48-fullscreen-dialog"><div class="dialog-body" id="issue48-confirm-body"></div></dialog><dialog id="issue48-parent-review-dialog" class="issue48-fullscreen-dialog"><form class="dialog-body" id="issue48-parent-review-form"></form></dialog>`;
    document.body.append(...host.children);
    document.getElementById("issue48-suggestion-form").addEventListener("submit", saveSuggestion);
    document.getElementById("issue48-suggestion-form").addEventListener("input", () => { state.formDirty = true; });
    document.getElementById("issue48-parent-review-form").addEventListener("submit", saveParentReview);
  }
  function deviceStateMarkup() {
    if (suggestionCredential()) return "";
    return `<div class="issue48-device-state" role="status"><strong>Suggestions aren't available on this device yet.</strong><br>Ask a parent to set up Suggestions on this device.<div class="form-actions"><button class="secondary-button" type="button" data-issue48-device-retry>Try again</button></div></div>`;
  }
  function domainEntry(domain) {
    const label = domain === "contribute" ? "Suggest a contribution" : domain === "earn" ? "Suggest a paid job" : "Suggest something to learn";
    return `${deviceStateMarkup()}<div class="issue48-actions"><button class="secondary-button" type="button" data-issue48-open="${domain}" ${!suggestionCredential() ? "disabled" : ""}>${label}</button><button class="text-button" type="button" data-issue48-my>My suggestions</button></div>`;
  }
  function injectOpportunityActions() {
    const filters = document.getElementById("opportunity-filters"); if (!filters) return;
    document.querySelectorAll("#view-opportunities .issue48-opportunity-actions").forEach(node => node.remove());
    const box = document.createElement("div"); box.className = "issue48-opportunity-actions";
    if (app.jobFilter === "contribute") box.innerHTML = domainEntry("contribute");
    else if (app.jobFilter === "earn") box.innerHTML = domainEntry("earn");
    else box.innerHTML = `${deviceStateMarkup()}<div class="issue48-actions"><button class="secondary-button" type="button" data-issue48-open="contribute" ${!suggestionCredential() ? "disabled" : ""}>Suggest a contribution</button><button class="secondary-button" type="button" data-issue48-open="earn" ${!suggestionCredential() ? "disabled" : ""}>Suggest a paid job</button><button class="text-button" type="button" data-issue48-my>My suggestions</button></div>`;
    filters.insertAdjacentElement("afterend", box);
  }
  function injectSkillsActions() {
    const host = document.getElementById("skills-workspace"); if (!host || host.querySelector(".issue48-skills-actions")) return;
    const box = document.createElement("section"); box.className = "skills-section issue48-skills-actions"; box.innerHTML = domainEntry("learn"); host.prepend(box);
  }

  function formConfig(domain) {
    return {
      contribute: { title:"Suggest a contribution", intro:"Have an idea for something you could help with? Send it for a parent to look at.", footer:"A parent will work out the final plan with you before anything is added to Contribute.", fields:[["title","What would you like to help with?","text",true,""],["description","Anything else about the idea?","textarea",false,""],["timingOrFrequency","When or how often?","text",false,"For example: once a week, after dinner, or when needed."]] },
      earn: { title:"Suggest a paid job", intro:"Suggest extra work you'd be willing to do for pay. Normal responsibilities stay in Contribute.", footer:"Sending this doesn't create a paid job yet.", fields:[["title","What paid job are you suggesting?","text",true,""],["description","What would you do?","textarea",true,""],["suggestedAmount","What do you think it's worth?","money",false,"Just a suggestion - a parent decides the agreed pay."]] },
      learn: { title:"Suggest something to learn", intro:"What would you like to learn or get better at?", footer:"This saves your idea. A parent will check how it fits with Skills and safety before anything is added to Learn.", fields:[["title","What do you want to learn or practise?","text",true,""],["interestReason","Why does this interest you?","textarea",false,""],["suggestedLink","Link or idea","url",false,"You can add a recipe, video or page you found."]] }
    }[domain];
  }
  function fieldMarkup([name,label,kind,required,helper], value="") {
    const id=`issue48-${name}`, optional=required?"":` <span style="font-weight:500">(Optional)</span>`;
    const control = kind === "textarea" ? `<textarea id="${id}" name="${name}" maxlength="1500" ${required?"required":""}>${safe(value)}</textarea>` : kind === "money" ? `<input id="${id}" name="${name}" type="number" min="0.01" step="0.01" inputmode="decimal" value="${value?safe(value):""}">` : `<input id="${id}" name="${name}" type="${kind === "url" ? "url" : "text"}" maxlength="${kind === "url" ? "2048" : "240"}" value="${safe(value)}" ${required?"required":""}>`;
    return `<div class="form-field"><label for="${id}">${label}${optional}</label>${control}${helper?`<p class="issue48-helper">${safe(helper)}</p>`:""}</div>`;
  }
  function openSuggestionForm(domain,item=null) {
    const config=formConfig(domain); if(!config) return;
    if(!suggestionCredential()) return toast("Suggestions aren't available on this device yet. Ask a parent to set up Suggestions on this device.");
    state.currentDomain=domain; state.currentId=item?.id||""; state.createRequestId=item?"":requestId("suggestion-create"); state.formDirty=false;
    const form=document.getElementById("issue48-suggestion-form");
    form.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">${DOMAIN_LABELS[domain]}</span><h2>${config.title}</h2></div><button class="close-button" type="button" data-issue48-cancel-form aria-label="Close">×</button></div><p class="issue48-form-note">${config.intro}</p>${config.fields.map(field=>fieldMarkup(field,item?.[field[0]]||"")).join("")}<p class="issue48-form-note">${config.footer}</p><div id="issue48-form-error"></div><div class="form-actions"><button type="button" class="secondary-button" data-issue48-cancel-form>Cancel</button><button class="primary-button" type="submit">${item?"Save changes":"Send suggestion"}</button></div>`;
    document.getElementById("issue48-suggestion-dialog").showModal();
  }
  function payloadFromForm() {
    const data=new FormData(document.getElementById("issue48-suggestion-form")); const domain=state.currentDomain;
    const payload={domain,title:String(data.get("title")||"").trim()};
    if(domain==="contribute"){payload.description=String(data.get("description")||"").trim();payload.timingOrFrequency=String(data.get("timingOrFrequency")||"").trim();}
    if(domain==="earn"){payload.description=String(data.get("description")||"").trim();const amount=Number(data.get("suggestedAmount"));if(amount>0)payload.suggestedAmount=amount;}
    if(domain==="learn"){payload.interestReason=String(data.get("interestReason")||"").trim();const link=String(data.get("suggestedLink")||"").trim();if(link){const cleaned=safeUrl(link);if(!cleaned||!/^https?:/i.test(cleaned))throw new Error("Use a normal http or https link, or leave the link blank.");payload.suggestedLink=cleaned;}}
    return payload;
  }
  function setFormError(message,retry=false){const host=document.getElementById("issue48-form-error");if(host)host.innerHTML=message?`<div class="issue48-error" role="status">${safe(message)}${retry?`<div class="form-actions"><button type="button" class="secondary-button" data-issue48-retry-submit>Try again</button></div>`:""}</div>`:"";}
  async function saveSuggestion(event){
    event.preventDefault();const form=event.currentTarget,button=event.submitter||form.querySelector("button[type=submit]");
    if(navigator.onLine===false)return setFormError("You're offline. Reconnect to send this suggestion.");
    let fields;try{fields=payloadFromForm();}catch(error){return setFormError(error.message);}
    const current=state.currentId?itemById(state.currentId):null;button.disabled=true;button.textContent=state.currentId?"Saving…":"Sending…";setFormError("");
    try{
      const operation=state.currentId?{action:ACTIONS.update,suggestionId:state.currentId,expectedRevision:current?.revision,...fields}:{action:ACTIONS.create,createRequestId:state.createRequestId,...fields};
      const result=await suggestionPost(operation), authoritative=normaliseSuggestion(result?.suggestion||result);
      if(!authoritative||authoritative.status!=="pending")throw new Error("The backend did not confirm a pending suggestion.");
      const index=state.items.findIndex(item=>item.id===authoritative.id);if(index>=0)state.items[index]=authoritative;else state.items.unshift(authoritative);state.loaded=true;state.formDirty=false;document.getElementById("issue48-suggestion-dialog").close();
      if(state.currentId){toast("Suggestion updated");openSuggestionDetail(authoritative.id);}else showSubmissionConfirmation();
    }catch(error){if(error?.code==="SUGGESTION_CONFLICT")setFormError("This suggestion has already been reviewed. Refresh to see the outcome.");else setFormError("Couldn't send your suggestion. Your text is still here.",true);}
    finally{button.disabled=false;button.textContent=state.currentId?"Save changes":"Send suggestion";}
  }
  function closeSuggestionForm(){const dialog=document.getElementById("issue48-suggestion-dialog");if(!dialog?.open)return;if(state.formDirty&&!window.confirm("Discard this unsent text? Choose Cancel to keep editing."))return;state.formDirty=false;dialog.close();}
  function showSubmissionConfirmation(){const body=document.getElementById("issue48-confirm-body");body.innerHTML=`<div class="dialog-head"><h2>Suggestion sent</h2><button class="close-button" type="button" data-issue48-close="issue48-confirm-dialog" aria-label="Close">×</button></div><p>It's waiting for parent review. Nothing has been added to Contribute, Earn or Learn yet.</p><div class="form-actions"><button class="secondary-button" type="button" data-issue48-my>View My suggestions</button><button class="primary-button" type="button" data-issue48-close="issue48-confirm-dialog">Done</button></div>`;document.getElementById("issue48-confirm-dialog").showModal();}

  function summary(item){return item.description||item.timingOrFrequency||item.interestReason||"Open to see your suggestion.";}
  function suggestionCard(item){return `<article class="surface issue48-card"><span class="job-domain">${DOMAIN_LABELS[item.domain]}</span><h3>${safe(item.title)}</h3><div class="issue48-card-meta"><span class="issue48-status">${safe(statusCopy(item))}</span>${item.submittedAt?`<span>${safe(dateLabel(item.submittedAt))}</span>`:""}${item.domain==="learn"?"<span>Started by you</span>":""}</div><p class="issue48-summary">${safe(summary(item))}</p>${item.domain==="earn"&&item.suggestedAmount>0?`<p class="issue48-summary">You suggested ${money(item.suggestedAmount)}</p>`:""}<div class="form-actions"><button class="secondary-button" type="button" data-issue48-view="${safe(item.id)}">View</button>${item.status==="pending"?`<button class="text-button" type="button" data-issue48-edit="${safe(item.id)}">Edit suggestion</button><button class="text-button" type="button" data-issue48-withdraw="${safe(item.id)}">Withdraw suggestion</button>`:""}</div></article>`;}
  function renderMySuggestions(){
    const host=document.getElementById("issue48-suggestions-body");if(!host)return;if(!suggestionCredential()){host.innerHTML=deviceStateMarkup();return;}if(state.loading&&!state.loaded){host.innerHTML=`<div class="skeleton"></div>`;return;}
    const pending=state.items.filter(item=>item.status==="pending"), reviewed=state.items.filter(item=>item.status!=="pending");
    host.innerHTML=`${state.unavailable?`<div class="issue48-error" role="status">Couldn't refresh suggestions. The last loaded list is still here.<div class="form-actions"><button class="secondary-button" type="button" data-issue48-device-retry>Try again</button></div></div>`:""}<section><div class="section-heading"><div><h3>Waiting for parent review</h3></div></div><div class="issue48-list">${pending.length?pending.map(suggestionCard).join(""):`<div class="empty"><strong>Nothing waiting for review</strong></div>`}</div></section><section style="margin-top:20px"><div class="section-heading"><div><h3>Reviewed</h3></div></div><div class="issue48-list">${reviewed.length?reviewed.map(suggestionCard).join(""):`<div class="empty"><strong>No reviewed suggestions yet</strong></div>`}</div></section>`;
  }
  async function loadSuggestions({quiet=false}={}){if(!suggestionCredential()){state.loaded=false;state.items=[];renderMySuggestions();return [];}if(navigator.onLine===false){state.unavailable=true;renderMySuggestions();return state.items;}state.loading=true;renderMySuggestions();try{const result=await suggestionPost({action:ACTIONS.list});state.items=rowsFrom(result).map(normaliseSuggestion).filter(Boolean).sort((a,b)=>new Date(b.updatedAt||b.submittedAt||0)-new Date(a.updatedAt||a.submittedAt||0));state.loaded=true;state.unavailable=false;return state.items;}catch(error){if(/key|authoris|provision|suggestion_device/i.test(String(error?.message||error?.code||""))){setSuggestionCredential("");state.items=[];state.loaded=false;}state.unavailable=true;if(!quiet)toast("Couldn't load My suggestions.");return state.items;}finally{state.loading=false;renderMySuggestions();}}
  async function openMySuggestions(){const dialog=document.getElementById("issue48-suggestions-dialog");if(!dialog.open)dialog.showModal();renderMySuggestions();await loadSuggestions({quiet:true});}
  function sourceRows(item,parent=false){const rows=[[parent?"Title":"What you suggested",item.title]];if(item.description)rows.push([item.domain==="earn"?"What you would do":"Details",item.description]);if(item.timingOrFrequency)rows.push(["When or how often",item.timingOrFrequency]);if(item.interestReason)rows.push(["Why it interests you",item.interestReason]);if(item.domain==="earn"&&item.suggestedAmount>0)rows.push([parent?"Sophie suggested":"You suggested",money(item.suggestedAmount)]);return rows;}
  function rowsMarkup(rows){return `<dl>${rows.map(([label,value])=>`<dt>${safe(label)}</dt><dd>${safe(value)}</dd>`).join("")}</dl>`;}
  function linkMarkup(item){const url=safeUrl(item.suggestedLink);return url&&/^https?:/i.test(url)?`<p><a class="product-link" href="${safe(url)}" target="_blank" rel="noopener noreferrer">Open suggested link</a></p>`:"";}
  function finalRows(item){const rows=[];if(item.finalTitle)rows.push(["Title",item.finalTitle]);if(item.finalScope)rows.push(["Plan",item.finalScope]);if(item.finalRequiredness)rows.push(["How it fits",item.finalRequiredness==="expected"?"Part of normal responsibilities":item.finalRequiredness==="negotiated"?"Agreed together":item.finalRequiredness]);if(item.finalFrequency)rows.push(["When or how often",item.finalFrequency]);if(item.finalCompletionStandard)rows.push(["What done looks like",item.finalCompletionStandard]);if(item.finalEstimatedMinutes)rows.push(["About how long",`${item.finalEstimatedMinutes} minutes`]);if(item.domain==="earn"&&item.finalAgreedPay>0)rows.push(["Agreed pay",money(item.finalAgreedPay)]);if(item.domain==="learn"){if(item.finalSkillArea)rows.push(["Skill area",item.finalSkillArea]);if(item.finalTechniqueTitle)rows.push(["Technique",item.finalTechniqueTitle]);if(item.finalActivityTitle)rows.push(["Learning activity",item.finalActivityTitle]);}return rows;}
  function openSuggestionDetail(id){const item=itemById(id);if(!item)return;const pending=item.status==="pending",final=finalRows(item),support=pending?(item.domain==="learn"?"A parent will work out how this idea fits with Skills and safety.":"A parent can approve a final version, make changes before approving it, or decide not to use it this time."):"";const outcome=!pending?`<section class="issue48-final"><h3>${safe(statusCopy(item))}</h3>${item.reviewReasonText?`<p>${safe(item.reviewReasonText)}</p>`:""}${item.status==="not_yet"&&item.domain==="learn"?`<p>Your idea is still saved. You can come back to it later.</p>`:""}</section>`:"";const body=document.getElementById("issue48-detail-body");body.innerHTML=`<div class="dialog-head"><div><span class="job-domain">${DOMAIN_LABELS[item.domain]}</span><h2>${pending?"Your suggestion":statusCopy(item)}</h2></div><button class="close-button" type="button" data-issue48-close="issue48-detail-dialog" aria-label="Close">×</button></div>${pending?`<span class="issue48-status">Waiting for parent review</span>`:""}<div class="issue48-detail-grid"><section class="issue48-source"><h3>What you suggested</h3>${rowsMarkup(sourceRows(item))}${linkMarkup(item)}</section>${outcome}${final.length?`<section class="issue48-final"><h3>Final plan</h3>${rowsMarkup(final)}${item.status==="approved"&&item.domain==="contribute"?`<p>The final plan is a little different from your suggestion.</p>`:""}</section>`:""}</div>${support?`<p class="issue48-form-note">${support}</p>`:""}${pending?`<div class="form-actions"><button class="secondary-button" type="button" data-issue48-edit="${safe(item.id)}">Edit suggestion</button><button class="secondary-button" type="button" data-issue48-withdraw="${safe(item.id)}">Withdraw suggestion</button></div>`:""}`;document.getElementById("issue48-detail-dialog").showModal();}
  function confirmWithdraw(id){const item=itemById(id);if(!item||item.status!=="pending")return;const body=document.getElementById("issue48-confirm-body");body.innerHTML=`<div class="dialog-head"><h2>Withdraw this suggestion?</h2><button class="close-button" type="button" data-issue48-close="issue48-confirm-dialog" aria-label="Close">×</button></div><p>It won't be reviewed or added. You can suggest it again later if you want.</p><div id="issue48-withdraw-error"></div><div class="form-actions"><button class="secondary-button" type="button" data-issue48-close="issue48-confirm-dialog">Keep it</button><button class="primary-button" type="button" data-issue48-confirm-withdraw="${safe(item.id)}">Withdraw suggestion</button></div>`;document.getElementById("issue48-confirm-dialog").showModal();}
  async function withdrawSuggestion(id,button){const item=itemById(id);if(!item||item.status!=="pending")return;if(navigator.onLine===false){document.getElementById("issue48-withdraw-error").innerHTML=`<div class="issue48-error">You're offline. Reconnect before withdrawing this suggestion.</div>`;return;}button.disabled=true;try{const result=await suggestionPost({action:ACTIONS.withdraw,suggestionId:item.id,expectedRevision:item.revision}), authoritative=normaliseSuggestion(result?.suggestion||result);if(!authoritative||authoritative.status!=="withdrawn")throw new Error("The backend did not confirm withdrawal.");const index=state.items.findIndex(row=>row.id===item.id);if(index>=0)state.items[index]=authoritative;document.getElementById("issue48-confirm-dialog").close();document.getElementById("issue48-detail-dialog")?.close();renderMySuggestions();toast("Withdrawn");}catch(error){const message=error?.code==="SUGGESTION_CONFLICT"?"This suggestion has already been reviewed. Refresh to see the outcome.":"Couldn't withdraw this suggestion. Try again.";document.getElementById("issue48-withdraw-error").innerHTML=`<div class="issue48-error" role="status">${safe(message)}</div>`;}finally{button.disabled=false;}}

  function parentSuggestionCard(item){return `<article class="surface issue48-card"><span class="job-domain">${DOMAIN_LABELS[item.domain]}</span><h3>${safe(item.title)}</h3><div class="issue48-card-meta"><span class="issue48-status">${safe(statusCopy(item))}</span>${item.submittedAt?`<span>${safe(dateLabel(item.submittedAt))}</span>`:""}<span>Suggested by Sophie</span></div><p class="issue48-summary">${safe(summary(item))}</p>${item.domain==="earn"&&item.suggestedAmount>0?`<p>Sophie suggested ${money(item.suggestedAmount)}</p>`:""}<div class="form-actions"><button class="primary-button" type="button" data-issue48-parent-review="${safe(item.id)}">Review</button></div></article>`;}
  function renderParentSuggestions(){const anchor=document.getElementById("parent-goal-reviews");if(!anchor)return;let section=document.getElementById("issue48-parent-suggestions");if(!section){section=document.createElement("section");section.id="issue48-parent-suggestions";section.className="issue48-parent-section";anchor.insertAdjacentElement("afterend",section);}const access=suggestionCredential()?`<span><strong>Suggestions are ready on this device.</strong></span><button class="secondary-button" type="button" data-issue48-provision="rotate">Rotate Suggestions access</button>`:`<span><strong>Suggestions aren't available on this device yet.</strong><br>Set up Suggestions for Sophie's device.</span><button class="secondary-button" type="button" data-issue48-provision="provision">Set up Suggestions on this device</button>`;const pending=state.parentItems.filter(item=>item.status==="pending"),reviewed=state.parentItems.filter(item=>item.status!=="pending").slice(0,8);section.innerHTML=`<div class="issue48-parent-head"><div><h3>Sophie suggestions</h3><p>Ideas Sophie has sent for review. Nothing becomes active until you approve a final version.</p></div></div><div class="issue48-parent-access">${access}</div>${state.parentUnavailable?`<div class="issue48-error">Suggestions couldn't be refreshed. Reload before reviewing anything.</div>`:""}<h4>Waiting for review</h4><div class="issue48-list">${state.parentLoading&&!state.parentLoaded?`<div class="skeleton"></div>`:pending.length?pending.map(parentSuggestionCard).join(""):`<div class="empty"><strong>No suggestions waiting</strong></div>`}</div><h4 style="margin-top:18px">Recently reviewed</h4><div class="issue48-list">${reviewed.length?reviewed.map(parentSuggestionCard).join(""):`<div class="empty"><strong>No reviewed suggestions yet</strong></div>`}</div>`;}
  async function loadParentSuggestions({quiet=false}={}){if(!parentSessionValid())return[];if(navigator.onLine===false){state.parentUnavailable=true;renderParentSuggestions();return state.parentItems;}state.parentLoading=true;renderParentSuggestions();try{const result=await suggestionPost({action:ACTIONS.parentList},{parent:true});state.parentItems=rowsFrom(result).map(normaliseSuggestion).filter(Boolean).sort((a,b)=>new Date(b.updatedAt||b.submittedAt||0)-new Date(a.updatedAt||a.submittedAt||0));state.parentLoaded=true;state.parentUnavailable=false;return state.parentItems;}catch(error){state.parentUnavailable=true;if(!quiet)toast("Sophie suggestions could not be loaded.");return state.parentItems;}finally{state.parentLoading=false;renderParentSuggestions();}}
  async function provisionSuggestionDevice(mode,button){if(!parentSessionValid())return toast("Parent Mode is locked. Sign in again.");if(navigator.onLine===false)return toast("Reconnect before setting up Suggestions.");button.disabled=true;try{const result=await suggestionPost({action:mode==="rotate"?ACTIONS.rotate:ACTIONS.provision},{parent:true});const credential=String(result?.suggestionKey||result?.deviceKey||"");if(!credential)throw new Error("Suggestions setup could not be completed.");setSuggestionCredential(credential);state.loaded=false;state.items=[];renderParentSuggestions();injectOpportunityActions();injectSkillsActions();toast("Suggestions are ready on this device.");}catch(error){toast(error.message||"Suggestions could not be set up on this device.");}finally{button.disabled=false;}}
  function reviewReasonOptions(domain){if(domain==="contribute")return["Not right now","Needs a different plan","We already have this covered","Something else"];if(domain==="earn")return["Not right now","We don't need this paid job right now","This is part of normal responsibilities","Needs a different plan","Something else"];return["Not right now","Needs a different safety setup","There's something useful to learn first","We don't have the equipment/time/support for this yet","Something else"];}
  function finalPlanFields(item){if(item.domain==="contribute")return `<div class="form-field"><label>Final title<input name="finalTitle" maxlength="240" value="${safe(item.title)}" required></label></div><div class="form-field"><label>Final scope<textarea name="finalScope" maxlength="1500" required>${safe(item.description)}</textarea></label></div><div class="form-field"><label>Requiredness<select name="finalRequiredness" required><option value="expected">Part of normal responsibilities</option><option value="negotiated">Agreed together</option></select></label></div><div class="form-field"><label>When or how often <span style="font-weight:500">(Optional)</span><input name="finalFrequency" maxlength="240" value="${safe(item.timingOrFrequency)}"></label></div><div class="form-field"><label>What done looks like<textarea name="finalCompletionStandard" maxlength="1500" required></textarea></label></div>`;if(item.domain==="earn")return `<div class="issue48-device-state"><strong>Paid jobs are optional extra work.</strong><br>If this is part of Sophie's normal responsibilities, don't approve it as Earn.</div><div class="form-field"><label>Final title<input name="finalTitle" maxlength="240" value="${safe(item.title)}" required></label></div><div class="form-field"><label>Agreed scope<textarea name="finalScope" maxlength="1500" required>${safe(item.description)}</textarea></label></div><div class="form-field"><label>Completion standard<textarea name="finalCompletionStandard" maxlength="1500" required></textarea></label></div><div class="form-field"><label>Estimated time <span style="font-weight:500">(Optional)</span><input name="finalEstimatedMinutes" type="number" min="0" max="1440"></label></div><div class="form-field"><label>Agreed pay<input name="finalAgreedPay" type="number" min="0.01" step="0.01" inputmode="decimal" ${item.suggestedAmount>0?`value="${safe(item.suggestedAmount)}"`:""} required></label><p class="issue48-helper">Entering the same amount Sophie suggested is still a parent decision.</p></div>`;if(item.mappingOptions.length)return `<div class="form-field"><label>Learning activity<select name="learningMap" required>${item.mappingOptions.map((option,index)=>`<option value="${index}">${safe(option.label)}</option>`).join("")}</select></label><p class="issue48-helper">The backend must still recheck current pathway and safety rules when approving.</p></div>`;return `<div class="issue48-device-state"><strong>This idea needs a learning setup before it can be added to Learn.</strong><br>Keep it pending until an authoritative learning activity can be mapped.</div>`;}
  function openParentReview(id){const item=itemById(id,true);if(!item||!parentSessionValid())return;state.currentId=item.id;state.reviewRequestId=requestId("suggestion-review");const mappingAvailable=item.domain!=="learn"||item.mappingOptions.length>0,reasons=reviewReasonOptions(item.domain),form=document.getElementById("issue48-parent-review-form");form.innerHTML=`<div class="dialog-head"><div><span class="job-domain">${DOMAIN_LABELS[item.domain]}</span><h2>Review Sophie's suggestion</h2></div><button class="close-button" type="button" data-issue48-close="issue48-parent-review-dialog" aria-label="Close">×</button></div><div class="issue48-parent-grid"><section class="issue48-source"><h3>Sophie's suggestion</h3>${rowsMarkup(sourceRows(item,true))}${linkMarkup(item)}</section><section class="issue48-final"><h3>Final plan</h3><p>You can approve the idea as a final plan, adjust the final plan before approving it, or decline it. Sophie's original suggestion stays visible.</p>${finalPlanFields(item)}</section></div><div class="form-field"><label>Decision<select name="outcome" required>${mappingAvailable?`<option value="approved">Approve</option><option value="approved_edit">Edit then approve</option>`:""}${item.domain==="learn"?`<option value="not_yet">Not yet</option>`:`<option value="declined">Decline</option>`}</select></label></div><div class="issue48-review-reason"><label for="issue48-review-reason">Reason</label><select id="issue48-review-reason-preset"><option value="">Choose a reason</option>${reasons.map(reason=>`<option value="${safe(reason)}">${safe(reason)}</option>`).join("")}</select><textarea id="issue48-review-reason" name="reviewReasonText" maxlength="1000" placeholder="Factual reason"></textarea></div><div id="issue48-parent-review-error"></div><div class="form-actions"><button class="secondary-button" type="button" data-issue48-close="issue48-parent-review-dialog">Cancel</button><button class="primary-button" type="submit">Save decision</button></div>`;const preset=document.getElementById("issue48-review-reason-preset"),reason=document.getElementById("issue48-review-reason");preset.addEventListener("change",()=>{if(preset.value!=="Something else")reason.value=preset.value;else reason.focus();});document.getElementById("issue48-parent-review-dialog").showModal();}
  function parentReviewPayload(item,form){const data=new FormData(form),raw=String(data.get("outcome")||""),outcome=raw==="approved_edit"?"approved":raw,reviewReasonText=String(data.get("reviewReasonText")||"").trim();if(["declined","not_yet"].includes(outcome)&&!reviewReasonText)throw new Error("Add a direct factual reason for this decision.");const payload={action:ACTIONS.review,suggestionId:item.id,expectedRevision:item.revision,reviewRequestId:state.reviewRequestId,outcome,reviewReasonText};if(outcome==="approved"){payload.finalTitle=String(data.get("finalTitle")||"").trim();if(item.domain==="contribute"){payload.finalScope=String(data.get("finalScope")||"").trim();payload.finalRequiredness=String(data.get("finalRequiredness")||"");payload.finalFrequency=String(data.get("finalFrequency")||"").trim();payload.finalCompletionStandard=String(data.get("finalCompletionStandard")||"").trim();}else if(item.domain==="earn"){payload.finalScope=String(data.get("finalScope")||"").trim();payload.finalCompletionStandard=String(data.get("finalCompletionStandard")||"").trim();payload.finalEstimatedMinutes=Number(data.get("finalEstimatedMinutes"))||0;payload.finalAgreedPay=Number(data.get("finalAgreedPay"));payload.finalRequiredness="optional";}else{const mapping=item.mappingOptions[Number(data.get("learningMap"))];if(!mapping)throw new Error("This idea needs a learning setup before it can be added to Learn.");payload.mappedCandidateId=mapping.candidateId;payload.mappedTechniqueId=mapping.techniqueId;}}return payload;}
  function parentReviewError(message){const host=document.getElementById("issue48-parent-review-error");if(host)host.innerHTML=message?`<div class="issue48-error" role="status">${safe(message)}</div>`:"";}
  async function saveParentReview(event){event.preventDefault();const form=event.currentTarget,button=event.submitter||form.querySelector("button[type=submit]"),item=itemById(state.currentId,true);if(!item)return;if(navigator.onLine===false)return parentReviewError("Reconnect before reviewing this suggestion.");let payload;try{payload=parentReviewPayload(item,form);}catch(error){return parentReviewError(error.message);}button.disabled=true;parentReviewError("");try{const result=await suggestionPost(payload,{parent:true}),authoritative=normaliseSuggestion(result?.suggestion||result);if(!authoritative)throw new Error("The backend did not confirm the review outcome.");const index=state.parentItems.findIndex(row=>row.id===item.id);if(index>=0)state.parentItems[index]=authoritative;document.getElementById("issue48-parent-review-dialog").close();renderParentSuggestions();await loadSuggestions({quiet:true});toast(authoritative.status==="not_yet"?"Not yet saved with the idea retained":"Suggestion review saved");}catch(error){if(error?.code==="SUGGESTION_CONFLICT")parentReviewError("This suggestion changed while you were reviewing it. Reload before making a decision.");else if(/mapping|eligible|prerequisite|safety/i.test(String(error?.message||""))&&item.domain==="learn")parentReviewError("This idea needs a learning setup before it can be added to Learn. It is still waiting for review.");else parentReviewError(error.message||"The suggestion review could not be saved.");}finally{button.disabled=false;}}

  async function retryDeviceState(){if(!suggestionCredential()){injectOpportunityActions();injectSkillsActions();renderMySuggestions();return toast("Suggestions aren't available on this device yet. Ask a parent to set up Suggestions on this device.");}await loadSuggestions({quiet:true});injectOpportunityActions();injectSkillsActions();}
  function closeDialog(id){const dialog=document.getElementById(id);if(dialog?.open)dialog.close();}
  const baseRenderJobsIssue48=renderJobs;renderJobs=function(...args){const result=baseRenderJobsIssue48(...args);injectOpportunityActions();return result;};
  const baseRenderSkillsIssue48=renderSkills;renderSkills=function(...args){const result=baseRenderSkillsIssue48(...args);injectSkillsActions();return result;};
  const baseRenderParentIssue48=renderParent;renderParent=function(...args){const result=baseRenderParentIssue48(...args);renderParentSuggestions();void loadParentSuggestions({quiet:true});return result;};
  const baseLockParentIssue48=lockParentMode;lockParentMode=function(...args){state.parentItems=[];state.parentLoaded=false;state.parentUnavailable=false;return baseLockParentIssue48(...args);};

  document.addEventListener("click",event=>{
    const open=event.target.closest("[data-issue48-open]");if(open){event.preventDefault();openSuggestionForm(open.dataset.issue48Open);return;}
    const mine=event.target.closest("[data-issue48-my]");if(mine){event.preventDefault();closeDialog("issue48-confirm-dialog");void openMySuggestions();return;}
    const view=event.target.closest("[data-issue48-view]");if(view){event.preventDefault();openSuggestionDetail(view.dataset.issue48View);return;}
    const edit=event.target.closest("[data-issue48-edit]");if(edit){event.preventDefault();const item=itemById(edit.dataset.issue48Edit);if(item?.status==="pending"){closeDialog("issue48-detail-dialog");openSuggestionForm(item.domain,item);}return;}
    const withdraw=event.target.closest("[data-issue48-withdraw]");if(withdraw){event.preventDefault();confirmWithdraw(withdraw.dataset.issue48Withdraw);return;}
    const confirm=event.target.closest("[data-issue48-confirm-withdraw]");if(confirm){event.preventDefault();void withdrawSuggestion(confirm.dataset.issue48ConfirmWithdraw,confirm);return;}
    const retry=event.target.closest("[data-issue48-device-retry]");if(retry){event.preventDefault();void retryDeviceState();return;}
    const retrySubmit=event.target.closest("[data-issue48-retry-submit]");if(retrySubmit){event.preventDefault();document.getElementById("issue48-suggestion-form")?.requestSubmit();return;}
    const cancel=event.target.closest("[data-issue48-cancel-form]");if(cancel){event.preventDefault();closeSuggestionForm();return;}
    const close=event.target.closest("[data-issue48-close]");if(close){event.preventDefault();closeDialog(close.dataset.issue48Close);return;}
    const review=event.target.closest("[data-issue48-parent-review]");if(review){event.preventDefault();openParentReview(review.dataset.issue48ParentReview);return;}
    const provision=event.target.closest("[data-issue48-provision]");if(provision){event.preventDefault();void provisionSuggestionDevice(provision.dataset.issue48Provision,provision);}
  });
  window.addEventListener("online",()=>{injectOpportunityActions();injectSkillsActions();if(document.getElementById("issue48-suggestions-dialog")?.open)void loadSuggestions({quiet:true});if(parentSessionValid()&&document.getElementById("parent-dialog")?.open)void loadParentSuggestions({quiet:true});});
  window.addEventListener("offline",()=>{injectOpportunityActions();injectSkillsActions();if(document.getElementById("issue48-suggestions-dialog")?.open)renderMySuggestions();});
  ensureStyles();ensureDialogs();injectOpportunityActions();injectSkillsActions();
})();
