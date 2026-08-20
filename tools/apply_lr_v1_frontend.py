from pathlib import Path

INDEX = Path("index.html")
SW = Path("sw.js")
text = INDEX.read_text(encoding="utf-8")


def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one anchor, found {count}")
    return source.replace(old, new, 1)


# 1. Learning Resources presentation and Parent Mode styles.
css = r'''
    .learning-resources {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
    }
    .learning-resources-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .learning-resources-head h3 { margin: 0 0 4px; }
    .learning-resources-head p { margin: 0; color: var(--muted); font-size: .8rem; line-height: 1.4; }
    .learning-resource-grid { display: grid; gap: 14px; }
    .learning-resource-card {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--surface);
    }
    .learning-video-frame {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      border: 0;
      background: #111;
    }
    .learning-video-fallback {
      display: grid;
      place-items: center;
      min-height: 120px;
      padding: 20px;
      background: var(--surface-2);
      color: var(--muted);
      text-align: center;
      font-size: .82rem;
    }
    .learning-resource-body { padding: 15px; }
    .learning-resource-kicker {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 7px;
      color: var(--muted);
      font-size: .7rem;
      font-weight: 800;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .learning-resource-body h4 { margin: 0 0 7px; font-size: 1rem; }
    .learning-resource-body > p { margin: 0 0 10px; color: var(--muted); font-size: .82rem; line-height: 1.5; }
    .learning-resource-guidance {
      display: grid;
      gap: 5px;
      margin-top: 9px;
      padding: 11px 12px;
      border-radius: 13px;
      background: var(--surface-2);
      font-size: .8rem;
      line-height: 1.45;
    }
    .learning-resource-guidance strong { color: var(--ink); }
    .learning-resource-safety {
      margin-top: 9px;
      padding: 9px 11px;
      border-radius: 12px;
      background: var(--sun);
      color: var(--sun-ink);
      font-size: .78rem;
      font-weight: 750;
      line-height: 1.4;
    }
    .learning-resource-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 9px;
      margin-top: 11px;
    }
    .learning-resource-link {
      display: inline-flex;
      min-height: 44px;
      align-items: center;
      padding: 9px 12px;
      border-radius: 12px;
      background: var(--brand-soft);
      color: var(--brand);
      font-size: .78rem;
      font-weight: 800;
      text-decoration: none;
    }
    .learning-resource-note,
    .learning-resource-warning {
      margin: 10px 0 0;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: .78rem;
      line-height: 1.45;
    }
    .learning-resource-note { background: var(--surface-2); color: var(--muted); }
    .learning-resource-warning { background: var(--sun); color: var(--sun-ink); }
    .learning-resource-admin-access {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 0 0 12px;
      padding: 12px 14px;
      border-radius: 14px;
      background: var(--surface-2);
      font-size: .8rem;
      line-height: 1.4;
    }
    .learning-resource-admin-list { display: grid; gap: 10px; }
    .learning-resource-admin-card {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: var(--surface);
    }
    .learning-resource-admin-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .learning-resource-admin-head h4 { margin: 3px 0 4px; }
    .learning-resource-admin-head p { margin: 0; color: var(--muted); font-size: .76rem; }
    .learning-resource-status {
      display: inline-flex;
      padding: 5px 8px;
      border-radius: 99px;
      background: var(--surface-2);
      color: var(--muted);
      font-size: .68rem;
      font-weight: 800;
      white-space: nowrap;
    }
    .learning-resource-status.active { background: var(--mint); color: var(--mint-ink); }
    .learning-resource-status.pending { background: var(--sun); color: var(--sun-ink); }
    .learning-resource-status.rejected,
    .learning-resource-status.archived { background: var(--rose); color: var(--rose-ink); }
    .learning-resource-admin-copy { margin: 9px 0 0; color: var(--muted); font-size: .78rem; line-height: 1.45; }
    .learning-resource-provenance { margin-top: 8px; color: var(--muted); font-size: .7rem; }
    @media (min-width: 760px) {
      .learning-resource-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
'''
text = replace_once(text, "  </style>", css + "  </style>", "style insertion")

# 2. Resource authoring/review dialogs.
dialogs = r'''
  <dialog id="learning-resource-suggest-dialog">
    <form class="dialog-body" id="learning-resource-suggest-form">
      <div class="dialog-head"><h2>Suggest a learning video</h2><button type="button" class="close-button" data-close-dialog="learning-resource-suggest-dialog" aria-label="Close">×</button></div>
      <p style="color:var(--muted);line-height:1.5">Add a useful YouTube video for this Learn activity. It stays pending until a parent reviews it.</p>
      <input id="learning-suggest-opportunity-id" type="hidden">
      <div class="form-field"><label for="learning-suggest-title">Video title</label><input id="learning-suggest-title" maxlength="160" required></div>
      <div class="form-field"><label for="learning-suggest-url">YouTube link</label><input id="learning-suggest-url" type="url" maxlength="2048" placeholder="https://www.youtube.com/watch?v=..." required></div>
      <div class="form-field"><label for="learning-suggest-description">Why this might help <span style="font-weight:500">(optional)</span></label><textarea id="learning-suggest-description" maxlength="500"></textarea></div>
      <div class="form-field"><label for="learning-suggest-notice">What to notice <span style="font-weight:500">(optional)</span></label><textarea id="learning-suggest-notice" maxlength="500"></textarea></div>
      <div class="form-field"><label for="learning-suggest-next">Try next <span style="font-weight:500">(optional)</span></label><textarea id="learning-suggest-next" maxlength="500"></textarea></div>
      <div class="form-field"><label for="learning-suggest-safety">Safety / supervision note <span style="font-weight:500">(optional)</span></label><input id="learning-suggest-safety" maxlength="240"></div>
      <div class="form-actions"><button type="button" class="secondary-button" data-close-dialog="learning-resource-suggest-dialog">Cancel</button><button class="primary-button" type="submit">Send for parent review</button></div>
    </form>
  </dialog>

  <dialog id="learning-resource-editor-dialog">
    <form class="dialog-body" id="learning-resource-editor-form">
      <div class="dialog-head"><h2 id="learning-resource-editor-title">Add learning video</h2><button type="button" class="close-button" data-close-dialog="learning-resource-editor-dialog" aria-label="Close">×</button></div>
      <p style="color:var(--muted);line-height:1.5">Use a normal YouTube link. The backend validates the provider and returns the trusted embed metadata used by the app.</p>
      <input id="learning-resource-id" type="hidden">
      <div class="form-field" id="learning-resource-target-field"><label for="learning-resource-target">Learn activity</label><select id="learning-resource-target" required></select></div>
      <div class="form-field"><label for="learning-resource-title">Video title</label><input id="learning-resource-title" maxlength="160" required></div>
      <div class="form-field"><label for="learning-resource-url">YouTube link</label><input id="learning-resource-url" type="url" maxlength="2048" required></div>
      <div class="form-field"><label for="learning-resource-description">Description <span style="font-weight:500">(optional)</span></label><textarea id="learning-resource-description" maxlength="500"></textarea></div>
      <div class="form-field"><label for="learning-resource-notice">What to notice <span style="font-weight:500">(optional)</span></label><textarea id="learning-resource-notice" maxlength="500"></textarea></div>
      <div class="form-field"><label for="learning-resource-next">Try next <span style="font-weight:500">(optional)</span></label><textarea id="learning-resource-next" maxlength="500"></textarea></div>
      <div class="form-field"><label for="learning-resource-safety">Safety / supervision note <span style="font-weight:500">(optional)</span></label><input id="learning-resource-safety" maxlength="240"></div>
      <div class="form-actions"><button type="button" class="secondary-button" data-close-dialog="learning-resource-editor-dialog">Cancel</button><button class="primary-button" type="submit">Save resource</button></div>
    </form>
  </dialog>

  <dialog id="learning-resource-review-dialog">
    <form class="dialog-body" id="learning-resource-review-form">
      <div class="dialog-head"><h2>Review Sophie's suggestion</h2><button type="button" class="close-button" data-close-dialog="learning-resource-review-dialog" aria-label="Close">×</button></div>
      <input id="learning-resource-review-id" type="hidden">
      <div id="learning-resource-review-context" class="surface opportunity-review-context"></div>
      <div class="form-field"><label for="learning-resource-review-outcome">Outcome</label><select id="learning-resource-review-outcome"><option value="approve">Approve and make active</option><option value="reject">Reject</option></select></div>
      <div class="form-field"><label for="learning-resource-review-feedback">Feedback <span style="font-weight:500">(optional)</span></label><textarea id="learning-resource-review-feedback" maxlength="500"></textarea></div>
      <div class="form-actions"><button type="button" class="secondary-button" data-close-dialog="learning-resource-review-dialog">Cancel</button><button class="primary-button" type="submit">Save review</button></div>
    </form>
  </dialog>

'''
text = replace_once(text, '  <dialog id="parent-login-dialog">', dialogs + '  <dialog id="parent-login-dialog">', "resource dialogs")

# 3. Parent dashboard Learning Resources section.
parent_anchor = '      <div class="section-heading" style="margin-top:22px"><div><h3>School support</h3><p>Help requests and useful exceptions — not a productivity score.</p></div></div>'
parent_section = r'''      <div class="section-heading" style="margin-top:22px"><div><h3>Learning resources</h3><p>Videos that support Learn activities without becoming a completion score.</p></div><button class="secondary-button" type="button" id="open-create-learning-resource">+ Add resource</button></div>
      <div id="parent-learning-resource-access"></div>
      <div id="parent-learning-resources"></div>
''' + parent_anchor
text = replace_once(text, parent_anchor, parent_section, "parent Learning Resources section")

# 4. State/capability fields.
text = replace_once(
    text,
    '      opportunityContractVersion: "",\n      balance: 0,',
    '      opportunityContractVersion: "",\n      learningResourceContractVersion: "",\n      learningResources: [],\n      balance: 0,',
    "empty data LR fields",
)
text = replace_once(
    text,
    '      schoolKey: localStorage.getItem("sophie_school_key") || "",\n      schoolTasks: [],',
    '      schoolKey: localStorage.getItem("sophie_school_key") || "",\n      learningKey: localStorage.getItem("sophie_learning_resource_key") || "",\n      learningResourceAdmin: [],\n      learningResourceAdminLoaded: false,\n      learningResourceAdminUnavailable: false,\n      parentData: null,\n      schoolTasks: [],',
    "app LR state",
)

# 5. Canonical LR normalisation and trusted backend embed metadata validation.
helpers = r'''
    function normaliseLearningResource(resource = {}) {
      return {
        ...resource,
        resourceId: String(resource.resourceId || ""),
        attachedToType: String(resource.attachedToType || "").toLowerCase(),
        attachedToId: String(resource.attachedToId || ""),
        resourceType: String(resource.resourceType || "").toLowerCase(),
        provider: String(resource.provider || "").toLowerCase(),
        providerResourceId: String(resource.providerResourceId || resource.videoId || ""),
        videoId: String(resource.videoId || resource.providerResourceId || ""),
        embedUrl: String(resource.embedUrl || ""),
        embeddable: resource.embeddable === true,
        sortOrder: Number(resource.sortOrder) || 0,
        addedByRole: String(resource.addedByRole || "").toLowerCase(),
        reviewState: String(resource.reviewState || "").toLowerCase(),
        active: resource.active === true
      };
    }

    function learningResourceContractAvailable(data = app.data) {
      return String(data?.learningResourceContractVersion || "") === "lr-v1";
    }

    function learningResourceMutationsReady(data = app.data) {
      return !app.dataUnavailable && learningResourceContractAvailable(data);
    }

    function trustedLearningEmbed(resource) {
      if (!resource || resource.provider !== "youtube" || resource.resourceType !== "video" || resource.embeddable !== true) return "";
      const videoId = String(resource.providerResourceId || resource.videoId || "");
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return "";
      try {
        const embed = new URL(String(resource.embedUrl || ""));
        if (embed.protocol !== "https:" || embed.hostname !== "www.youtube-nocookie.com") return "";
        if (embed.pathname !== `/embed/${videoId}` || embed.username || embed.password) return "";
        return embed.href;
      } catch {
        return "";
      }
    }

'''
text = replace_once(text, '    function normaliseData(raw = {}) {', helpers + '    function normaliseData(raw = {}) {', "LR helper functions")
text = replace_once(
    text,
    '        opportunityContractVersion: String(raw.opportunityContractVersion || ""),\n        balance: Number(raw.balance) || 0,',
    '        opportunityContractVersion: String(raw.opportunityContractVersion || ""),\n        learningResourceContractVersion: String(raw.learningResourceContractVersion || ""),\n        learningResources: (Array.isArray(raw.learningResources) ? raw.learningResources : []).map(normaliseLearningResource),\n        balance: Number(raw.balance) || 0,',
    "normaliseData LR fields",
)

# 6. Learn opportunity rendering, using ONLY server-returned trusted embed metadata.
resource_rendering = r'''
    function learningResourcesForOpportunity(opportunityId) {
      return (app.data.learningResources || [])
        .map(normaliseLearningResource)
        .filter(resource => resource.attachedToType === "opportunity" && resource.attachedToId === String(opportunityId) && resource.resourceType === "video" && resource.active === true && resource.reviewState === "active")
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    }

    function learningResourceCardMarkup(resource) {
      const embedUrl = trustedLearningEmbed(resource);
      const openUrl = resource.provider === "youtube" ? safeUrl(resource.url) : "";
      const provenance = resource.addedByRole === "sophie" ? "Suggested by Sophie" : "Added by parent";
      return `<article class="learning-resource-card">
        ${embedUrl ? `<iframe class="learning-video-frame" src="${safe(embedUrl)}" title="${safe(resource.title || "Learning video")}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : `<div class="learning-video-fallback"><span>Video preview unavailable. Use the validated video link below.</span></div>`}
        <div class="learning-resource-body">
          <div class="learning-resource-kicker"><span>YouTube · Learn first</span><span>${safe(provenance)}</span></div>
          <h4>${safe(resource.title || "Learning video")}</h4>
          ${resource.description ? `<p>${safe(resource.description)}</p>` : ""}
          ${resource.whatToNotice ? `<div class="learning-resource-guidance"><strong>What to notice</strong><span>${safe(resource.whatToNotice)}</span></div>` : ""}
          ${resource.tryNext ? `<div class="learning-resource-guidance"><strong>Try next</strong><span>${safe(resource.tryNext)}</span></div>` : ""}
          ${resource.safetyNote ? `<div class="learning-resource-safety">Safety / support: ${safe(resource.safetyNote)}</div>` : ""}
          ${openUrl ? `<div class="learning-resource-actions"><a class="learning-resource-link" href="${safe(openUrl)}" target="_blank" rel="noopener noreferrer">Open video ↗</a></div>` : ""}
        </div>
      </article>`;
    }

    function learningResourceSectionMarkup(job) {
      if (!job || job.type !== "learn" || !learningResourceContractAvailable()) return "";
      const resources = learningResourcesForOpportunity(job.id);
      const canSuggest = learningResourceMutationsReady() && Boolean(app.learningKey);
      const suggestion = canSuggest
        ? `<button class="secondary-button" type="button" data-suggest-learning-resource="${safe(job.id)}">Suggest a video</button>`
        : learningResourceMutationsReady()
          ? `<span class="learning-resource-note">A parent can enable video suggestions on this device.</span>`
          : `<span class="learning-resource-warning">Last loaded resources are shown. Reconnect before suggesting a video.</span>`;
      return `<section class="learning-resources" aria-label="Learning resources">
        <div class="learning-resources-head"><div><h3>Learning resources</h3><p>Watch when useful, then practise the real skill. Watching a video does not complete this activity.</p></div>${suggestion}</div>
        ${resources.length ? `<div class="learning-resource-grid">${resources.map(learningResourceCardMarkup).join("")}</div>` : `<div class="learning-resource-note">No active learning videos are attached yet.</div>`}
      </section>`;
    }

'''
text = replace_once(text, '    function renderOpportunityDetail(job) {', resource_rendering + '    function renderOpportunityDetail(job) {', "Learn resource rendering")
text = replace_once(
    text,
    '        ${job.type === "learn" && job.supportPreference ? opportunityDetailSection("Support I want", schoolSupportLabel(job.supportPreference)) : ""}\n        ${job.type === "earn" && job.partialWorkDescription ? opportunityDetailSection("Partial work described", job.partialWorkDescription) : ""}',
    '        ${job.type === "learn" && job.supportPreference ? opportunityDetailSection("Support I want", schoolSupportLabel(job.supportPreference)) : ""}\n        ${job.type === "learn" ? learningResourceSectionMarkup(job) : ""}\n        ${job.type === "earn" && job.partialWorkDescription ? opportunityDetailSection("Partial work described", job.partialWorkDescription) : ""}',
    "insert resources in Learn detail",
)

# 7. Sophie suggestion + Parent Mode CRUD/review/provisioning.
resource_logic = r'''
    function learningResourceTextPayload(prefix) {
      return {
        title: $(`#${prefix}-title`).value.trim(),
        url: $(`#${prefix}-url`).value.trim(),
        description: $(`#${prefix}-description`).value.trim(),
        whatToNotice: $(`#${prefix}-notice`).value.trim(),
        tryNext: $(`#${prefix}-next`).value.trim(),
        safetyNote: $(`#${prefix}-safety`).value.trim()
      };
    }

    function openLearningResourceSuggestion(opportunityId) {
      const job = opportunityById(opportunityId);
      if (!job || job.type !== "learn") return toast("Learning videos can only be suggested for Learn activities.");
      if (!learningResourceMutationsReady()) return toast("Learning Resources are unavailable until the live lr-v1 backend reloads.");
      if (!app.learningKey) return toast("A parent needs to enable video suggestions on this device first.");
      $("#learning-resource-suggest-form").reset();
      $("#learning-suggest-opportunity-id").value = String(opportunityId);
      $("#learning-resource-suggest-dialog").showModal();
    }

    async function saveLearningResourceSuggestion(event) {
      event.preventDefault();
      const button = event.submitter || $("#learning-resource-suggest-form button[type=submit]");
      if (!learningResourceMutationsReady()) return toast("Reconnect before suggesting a video.");
      if (!app.learningKey) return toast("A parent needs to enable video suggestions on this device first.");
      button.disabled = true;
      try {
        const result = await apiPost({
          action: "suggestLearningResource",
          learningKey: app.learningKey,
          attachedToType: "opportunity",
          attachedToId: $("#learning-suggest-opportunity-id").value,
          resourceType: "video",
          ...learningResourceTextPayload("learning-suggest")
        });
        const authoritative = normaliseLearningResource(result || {});
        if (!authoritative.resourceId || authoritative.reviewState !== "pending" || authoritative.active) throw new Error("The backend did not return the expected pending suggestion state.");
        $("#learning-resource-suggest-dialog").close();
        toast("Video suggestion sent for parent review");
      } catch (error) {
        if (/key|authoris|provision/i.test(String(error.message || ""))) {
          app.learningKey = "";
          localStorage.removeItem("sophie_learning_resource_key");
          const job = opportunityById($("#learning-suggest-opportunity-id").value);
          if ($("#opportunity-detail-dialog").open && job) renderOpportunityDetail(job);
        }
        toast(error.message || "The video suggestion could not be sent.");
      } finally {
        button.disabled = false;
      }
    }

    function parentLearningResourceData() {
      return app.parentData || app.data;
    }

    function learningResourceLearnOptions() {
      return (parentLearningResourceData().jobs || [])
        .filter(job => job.type === "learn" && job.status !== "cancelled")
        .sort((a, b) => String(a.title).localeCompare(String(b.title)));
    }

    function learningResourceTargetTitle(resource) {
      const job = (parentLearningResourceData().jobs || []).find(item => String(item.id) === String(resource.attachedToId));
      return job ? job.title : resource.attachedToId || "Unknown Learn activity";
    }

    function learningResourceStatusLabel(resource) {
      return ({ active: "Active", pending: "Pending review", rejected: "Rejected", archived: "Archived" })[resource.reviewState] || resource.reviewState || "Unknown";
    }

    function activeLearningResourcesForTarget(attachedToId) {
      return app.learningResourceAdmin
        .filter(resource => resource.attachedToId === String(attachedToId) && resource.active === true && resource.reviewState === "active")
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    }

    function renderParentLearningResources() {
      const host = $("#parent-learning-resources");
      const access = $("#parent-learning-resource-access");
      if (!host || !access) return;
      const data = parentLearningResourceData();
      if (!learningResourceContractAvailable(data)) {
        access.innerHTML = `<div class="learning-resource-warning">Learning Resources authoring requires the separate lr-v1 capability. Contribute, Learn and Earn remain available through d006-v1.</div>`;
        host.innerHTML = "";
        return;
      }
      const deviceButton = app.learningKey
        ? `<button class="secondary-button" type="button" data-learning-resource-device="rotate">Rotate Sophie suggestion access</button>`
        : `<button class="secondary-button" type="button" data-learning-resource-device="provision">Enable Sophie suggestions on this device</button>`;
      access.innerHTML = `<div class="learning-resource-admin-access"><span><strong>Sophie suggestions:</strong> ${app.learningKey ? "enabled on this device" : "not set up on this device"}. The private capability key is never displayed.</span>${deviceButton}</div>${app.learningResourceAdminUnavailable ? `<div class="learning-resource-warning">The last loaded Parent resource list is still shown. <button class="text-button" type="button" data-learning-resource-retry>Retry</button></div>` : ""}`;
      if (!app.learningResourceAdminLoaded) {
        host.innerHTML = `<div class="skeleton"></div>`;
        return;
      }
      const resources = [...app.learningResourceAdmin].sort((a, b) => {
        const stateRank = { pending: 0, active: 1, rejected: 2, archived: 3 };
        return (stateRank[a.reviewState] ?? 9) - (stateRank[b.reviewState] ?? 9) || learningResourceTargetTitle(a).localeCompare(learningResourceTargetTitle(b)) || a.sortOrder - b.sortOrder;
      });
      if (!resources.length) {
        host.innerHTML = `<div class="empty"><span class="empty-icon">▶</span><strong>No learning resources yet</strong><p>Add a YouTube video to a Learn activity, or enable Sophie suggestions on this device.</p></div>`;
        return;
      }
      host.innerHTML = `<div class="learning-resource-admin-list">${resources.map(resource => {
        const openUrl = resource.provider === "youtube" ? safeUrl(resource.url) : "";
        const activeList = activeLearningResourcesForTarget(resource.attachedToId);
        const activeIndex = activeList.findIndex(item => item.resourceId === resource.resourceId);
        let actions = "";
        if (!app.dataUnavailable && resource.reviewState === "active") {
          actions = `<button class="secondary-button" type="button" data-learning-resource-edit="${safe(resource.resourceId)}">Edit</button>${activeIndex > 0 ? `<button class="secondary-button" type="button" data-learning-resource-move="${safe(resource.resourceId)}" data-direction="-1">Move up</button>` : ""}${activeIndex >= 0 && activeIndex < activeList.length - 1 ? `<button class="secondary-button" type="button" data-learning-resource-move="${safe(resource.resourceId)}" data-direction="1">Move down</button>` : ""}<button class="danger-button" type="button" data-learning-resource-archive="${safe(resource.resourceId)}">Archive</button>`;
        } else if (!app.dataUnavailable && resource.reviewState === "pending" && resource.addedByRole === "sophie") {
          actions = `<button class="primary-button" type="button" data-learning-resource-review="${safe(resource.resourceId)}">Review suggestion</button>`;
        }
        return `<article class="learning-resource-admin-card">
          <div class="learning-resource-admin-head"><div><span class="job-domain">LEARN · ${safe(learningResourceTargetTitle(resource))}</span><h4>${safe(resource.title)}</h4><p>${safe(resource.provider === "youtube" ? "YouTube" : resource.provider || "Video")}</p></div><span class="learning-resource-status ${safe(resource.reviewState)}">${safe(learningResourceStatusLabel(resource))}</span></div>
          ${resource.description ? `<p class="learning-resource-admin-copy">${safe(resource.description)}</p>` : ""}
          <div class="learning-resource-provenance">${resource.addedByRole === "sophie" ? "Suggested by Sophie" : "Added by parent"}${resource.reviewFeedback ? ` · Review note: ${safe(resource.reviewFeedback)}` : ""}</div>
          <div class="learning-resource-actions">${openUrl ? `<a class="learning-resource-link" href="${safe(openUrl)}" target="_blank" rel="noopener noreferrer">Open video ↗</a>` : ""}${actions}</div>
        </article>`;
      }).join("")}</div>`;
    }

    async function loadParentLearningResources({ quiet = false } = {}) {
      if (!parentSessionValid()) return null;
      if (!learningResourceContractAvailable(parentLearningResourceData())) {
        app.learningResourceAdminLoaded = false;
        app.learningResourceAdminUnavailable = false;
        renderParentLearningResources();
        return null;
      }
      try {
        extendParentSession();
        const result = await apiPost({ action: "getLearningResourcesAdmin", adminKey: app.adminKey });
        app.learningResourceAdmin = (Array.isArray(result) ? result : []).map(normaliseLearningResource);
        app.learningResourceAdminLoaded = true;
        app.learningResourceAdminUnavailable = false;
        renderParentLearningResources();
        return app.learningResourceAdmin;
      } catch (error) {
        app.learningResourceAdminUnavailable = true;
        renderParentLearningResources();
        if (!quiet) toast(error.message || "Learning resources could not be loaded.");
        return null;
      }
    }

    async function refreshLearningResourceViews() {
      await loadParentLearningResources({ quiet: true });
      await loadData({ quiet: true });
      const job = opportunityById(app.activeOpportunityId);
      if ($("#opportunity-detail-dialog").open && job) renderOpportunityDetail(job);
    }

    function openLearningResourceEditor(resourceId = "") {
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      if (!learningResourceMutationsReady(parentLearningResourceData())) return toast("Reconnect to the live lr-v1 backend before changing learning resources.");
      const options = learningResourceLearnOptions();
      if (!options.length) return toast("Create a Learn activity before adding a learning resource.");
      const form = $("#learning-resource-editor-form");
      form.reset();
      const resource = resourceId ? app.learningResourceAdmin.find(item => item.resourceId === String(resourceId)) : null;
      $("#learning-resource-id").value = resource ? resource.resourceId : "";
      $("#learning-resource-editor-title").textContent = resource ? "Edit learning video" : "Add learning video";
      const target = $("#learning-resource-target");
      target.innerHTML = options.map(job => `<option value="${safe(job.id)}">${safe(job.title)}</option>`).join("");
      target.disabled = Boolean(resource);
      $("#learning-resource-target-field").style.opacity = resource ? ".65" : "1";
      if (resource) {
        target.value = resource.attachedToId;
        $("#learning-resource-title").value = resource.title || "";
        $("#learning-resource-url").value = resource.url || "";
        $("#learning-resource-description").value = resource.description || "";
        $("#learning-resource-notice").value = resource.whatToNotice || "";
        $("#learning-resource-next").value = resource.tryNext || "";
        $("#learning-resource-safety").value = resource.safetyNote || "";
      }
      $("#learning-resource-editor-dialog").showModal();
    }

    async function saveLearningResourceEditor(event) {
      event.preventDefault();
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      if (!learningResourceMutationsReady(parentLearningResourceData())) return toast("Reconnect before saving a learning resource.");
      const button = event.submitter || $("#learning-resource-editor-form button[type=submit]");
      const resourceId = $("#learning-resource-id").value;
      const fields = learningResourceTextPayload("learning-resource");
      const payload = resourceId
        ? { action: "updateLearningResource", adminKey: app.adminKey, resourceId, ...fields }
        : { action: "createLearningResource", adminKey: app.adminKey, attachedToType: "opportunity", attachedToId: $("#learning-resource-target").value, resourceType: "video", ...fields };
      button.disabled = true;
      try {
        extendParentSession();
        await apiPost(payload);
        $("#learning-resource-editor-dialog").close();
        toast(resourceId ? "Learning resource updated" : "Learning resource added");
        await refreshLearningResourceViews();
      } catch (error) {
        toast(error.message || "The learning resource could not be saved.");
      } finally {
        button.disabled = false;
      }
    }

    async function moveLearningResource(resourceId, direction, button) {
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      if (!learningResourceMutationsReady(parentLearningResourceData())) return toast("Reconnect before reordering learning resources.");
      const resource = app.learningResourceAdmin.find(item => item.resourceId === String(resourceId));
      if (!resource || resource.reviewState !== "active") return;
      const active = activeLearningResourcesForTarget(resource.attachedToId);
      const index = active.findIndex(item => item.resourceId === resource.resourceId);
      const nextIndex = index + Number(direction || 0);
      if (index < 0 || nextIndex < 0 || nextIndex >= active.length) return;
      const resourceIds = active.map(item => item.resourceId);
      [resourceIds[index], resourceIds[nextIndex]] = [resourceIds[nextIndex], resourceIds[index]];
      button.disabled = true;
      try {
        extendParentSession();
        await apiPost({ action: "reorderLearningResources", adminKey: app.adminKey, attachedToId: resource.attachedToId, resourceIds });
        toast("Learning resources reordered");
        await refreshLearningResourceViews();
      } catch (error) {
        toast(error.message || "The resource order could not be changed.");
      } finally {
        button.disabled = false;
      }
    }

    async function archiveLearningResource(resourceId, button) {
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      if (!learningResourceMutationsReady(parentLearningResourceData())) return toast("Reconnect before archiving a learning resource.");
      const resource = app.learningResourceAdmin.find(item => item.resourceId === String(resourceId));
      if (!resource || !window.confirm(`Archive “${resource.title}”? It will stop appearing to Sophie but provenance is retained.`)) return;
      button.disabled = true;
      try {
        extendParentSession();
        await apiPost({ action: "archiveLearningResource", adminKey: app.adminKey, resourceId });
        toast("Learning resource archived");
        await refreshLearningResourceViews();
      } catch (error) {
        toast(error.message || "The learning resource could not be archived.");
      } finally {
        button.disabled = false;
      }
    }

    function openLearningResourceReview(resourceId) {
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      const resource = app.learningResourceAdmin.find(item => item.resourceId === String(resourceId));
      if (!resource || resource.reviewState !== "pending" || resource.addedByRole !== "sophie") return toast("Only pending Sophie suggestions can be reviewed here.");
      $("#learning-resource-review-form").reset();
      $("#learning-resource-review-id").value = resource.resourceId;
      $("#learning-resource-review-context").innerHTML = `<strong>${safe(resource.title)}</strong><p>${safe(learningResourceTargetTitle(resource))}${resource.description ? `<br>${safe(resource.description)}` : ""}</p>`;
      $("#learning-resource-review-dialog").showModal();
    }

    async function saveLearningResourceReview(event) {
      event.preventDefault();
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      if (!learningResourceMutationsReady(parentLearningResourceData())) return toast("Reconnect before reviewing a learning resource.");
      const button = event.submitter || $("#learning-resource-review-form button[type=submit]");
      button.disabled = true;
      try {
        extendParentSession();
        await apiPost({
          action: "reviewLearningResource",
          adminKey: app.adminKey,
          resourceId: $("#learning-resource-review-id").value,
          outcome: $("#learning-resource-review-outcome").value,
          feedback: $("#learning-resource-review-feedback").value.trim(),
          reviewedBy: "parent"
        });
        $("#learning-resource-review-dialog").close();
        toast("Learning resource review saved");
        await refreshLearningResourceViews();
      } catch (error) {
        toast(error.message || "The suggestion review could not be saved.");
      } finally {
        button.disabled = false;
      }
    }

    async function provisionLearningResourceDevice(mode, button) {
      if (!parentSessionValid()) return toast("Parent Mode is locked. Sign in again.");
      if (!learningResourceMutationsReady(parentLearningResourceData())) return toast("Reconnect before changing Sophie suggestion access.");
      if (button) button.disabled = true;
      try {
        extendParentSession();
        const action = mode === "rotate" ? "rotateLearningResourceDeviceKey" : "provisionLearningResourceDevice";
        const result = await apiPost({ action, adminKey: app.adminKey });
        if (!result?.learningKey) throw new Error("The backend did not return a Learning Resources device key.");
        if (result.learningResourceContractVersion && result.learningResourceContractVersion !== "lr-v1") throw new Error("Learning Resources capability mismatch.");
        app.learningKey = result.learningKey;
        localStorage.setItem("sophie_learning_resource_key", result.learningKey);
        toast(mode === "rotate" ? "Sophie suggestion access rotated on this device" : "Sophie video suggestions enabled on this device");
        renderParentLearningResources();
        const job = opportunityById(app.activeOpportunityId);
        if ($("#opportunity-detail-dialog").open && job) renderOpportunityDetail(job);
      } catch (error) {
        toast(error.message || "Sophie suggestion access could not be changed.");
      } finally {
        if (button) button.disabled = false;
      }
    }

'''
text = replace_once(text, '    function setupPersonalisation() {', resource_logic + '    function setupPersonalisation() {', "resource CRUD logic")

# Parent state refresh and LR admin load.
text = replace_once(text, '    function renderParent(data) {\n      const reviewJobs', '    function renderParent(data) {\n      app.parentData = data;\n      const reviewJobs', "parent data state")
old_parent_open = '''        const data = await apiPost({ action: "getParentData", adminKey: key });
        app.adminKey = key;
        sessionStorage.setItem("sophie_admin_key", key);
        extendParentSession();
        renderParent(normaliseData(data));
        $("#parent-login-dialog").close();
        $("#parent-dialog").showModal();
        loadParentSchoolSupport();'''
new_parent_open = '''        const data = await apiPost({ action: "getParentData", adminKey: key });
        app.adminKey = key;
        sessionStorage.setItem("sophie_admin_key", key);
        extendParentSession();
        const parentData = normaliseData(data);
        app.parentData = parentData;
        renderParent(parentData);
        $("#parent-login-dialog").close();
        $("#parent-dialog").showModal();
        loadParentSchoolSupport();
        loadParentLearningResources();'''
text = replace_once(text, old_parent_open, new_parent_open, "parent dashboard LR load")

# 8. Event routing and forms.
click_anchor = '''      const opportunityRetry = event.target.closest("[data-opportunity-retry]");
      if (opportunityRetry) loadData();
'''
click_extra = click_anchor + r'''
      const suggestLearningResource = event.target.closest("[data-suggest-learning-resource]");
      if (suggestLearningResource) openLearningResourceSuggestion(suggestLearningResource.dataset.suggestLearningResource);

      const editLearningResource = event.target.closest("[data-learning-resource-edit]");
      if (editLearningResource) openLearningResourceEditor(editLearningResource.dataset.learningResourceEdit);

      const moveResource = event.target.closest("[data-learning-resource-move]");
      if (moveResource) moveLearningResource(moveResource.dataset.learningResourceMove, moveResource.dataset.direction, moveResource);

      const archiveResource = event.target.closest("[data-learning-resource-archive]");
      if (archiveResource) archiveLearningResource(archiveResource.dataset.learningResourceArchive, archiveResource);

      const reviewResource = event.target.closest("[data-learning-resource-review]");
      if (reviewResource) openLearningResourceReview(reviewResource.dataset.learningResourceReview);

      const retryResources = event.target.closest("[data-learning-resource-retry]");
      if (retryResources) loadParentLearningResources();

      const learningDevice = event.target.closest("[data-learning-resource-device]");
      if (learningDevice) provisionLearningResourceDevice(learningDevice.dataset.learningResourceDevice, learningDevice);
'''
text = replace_once(text, click_anchor, click_extra, "LR click handlers")

listener_anchor = '''    $("#opportunity-create-form").addEventListener("submit", saveOpportunityCreate);
    $("#opp-create-type").addEventListener("change", configureOpportunityCreateFields);'''
listener_new = '''    $("#opportunity-create-form").addEventListener("submit", saveOpportunityCreate);
    $("#opp-create-type").addEventListener("change", configureOpportunityCreateFields);
    $("#learning-resource-suggest-form").addEventListener("submit", saveLearningResourceSuggestion);
    $("#learning-resource-editor-form").addEventListener("submit", saveLearningResourceEditor);
    $("#learning-resource-review-form").addEventListener("submit", saveLearningResourceReview);
    $("#open-create-learning-resource").addEventListener("click", () => openLearningResourceEditor());'''
text = replace_once(text, listener_anchor, listener_new, "LR form listeners")

refresh_old = '''    $("#refresh-button").addEventListener("click", () => {
      loadData();
      if (app.schoolKey) loadSchoolWorkspace({ quiet: true });
    });'''
refresh_new = '''    $("#refresh-button").addEventListener("click", () => {
      loadData();
      if (app.schoolKey) loadSchoolWorkspace({ quiet: true });
      if (parentSessionValid() && $("#parent-dialog").open) loadParentLearningResources({ quiet: true });
    });'''
text = replace_once(text, refresh_old, refresh_new, "refresh LR admin data")

# More reliable PWA update discovery without changing cache semantics.
sw_registration_old = '    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});'
sw_registration_new = '    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then(registration => registration.update().catch(() => {})).catch(() => {});'
text = replace_once(text, sw_registration_old, sw_registration_new, "service worker update registration")

INDEX.write_text(text, encoding="utf-8")

sw = SW.read_text(encoding="utf-8")
if 'const CACHE_NAME = "sophie-app-v2-8-d006-opportunities";' not in sw:
    raise SystemExit("service worker cache anchor missing")
sw = sw.replace('const CACHE_NAME = "sophie-app-v2-8-d006-opportunities";', 'const CACHE_NAME = "sophie-app-v2-9-learning-resources";', 1)
SW.write_text(sw, encoding="utf-8")

print("Applied lr-v1 Learning Resources frontend integration")
