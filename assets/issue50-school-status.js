/* Sophie App - GitHub issue #50 School status-first information architecture.
 * Frontend-only adapter over the existing School contract.
 * Backend authority, source-conflict rules and D-005 journey semantics remain unchanged.
 */
(() => {
  "use strict";

  if (window.__sophieIssue50SchoolStatusLoaded) return;
  window.__sophieIssue50SchoolStatusLoaded = true;

  const MAIN_VIEWS = new Set(["now", "submitted", "feedback"]);
  const TRANSIENT_VIEWS = new Set(["submitted", "feedback"]);
  const RECENT_FEEDBACK_LIMIT = 6;
  const escapeHtml = typeof safe === "function"
    ? safe
    : value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  const baseRenderSchool = renderSchool;
  const baseRenderSchoolHistory = renderSchoolHistory;
  const baseSyncSchoolViewControls = syncSchoolViewControls;
  const baseSetSchoolView = setSchoolView;
  const baseLoadSchoolWorkspace = loadSchoolWorkspace;

  function normalise(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function sourceConflict(task) {
    return ["true", "1", "yes", "y"].includes(normalise(task?.sourceConflict));
  }

  function recordIdentity(task, fallbackIndex = 0) {
    return String(task?.taskId || task?.sourceTaskId || `${task?.subject || "school"}:${task?.title || "task"}:${task?.dueDate || ""}:${fallbackIndex}`);
  }

  function recordsWithFallback() {
    const merged = new Map();
    (Array.isArray(app.schoolHistory) ? app.schoolHistory : []).forEach((task, index) => {
      const row = { ...task, recordState: task.recordState || "history", __issue50Source: "history" };
      merged.set(recordIdentity(row, index), row);
    });
    (Array.isArray(app.schoolTasks) ? app.schoolTasks : []).forEach((task, index) => {
      const row = { ...task, recordState: task.recordState || "active", __issue50Source: "current" };
      merged.set(recordIdentity(row, index), row);
    });
    return [...merged.values()];
  }

  function meaningfulFeedback(task) {
    return Boolean(
      String(task?.gradeOrResult || "").trim() ||
      String(task?.mark || "").trim() ||
      String(task?.teacherComment || "").trim() ||
      normalise(task?.sourceStatus) === "results published"
    );
  }

  function submissionState(task) {
    return normalise(task?.submissionState);
  }

  function classify(task) {
    const recordState = normalise(task?.recordState || (task?.__issue50Source === "history" ? "history" : "active"));
    if (sourceConflict(task) || normalise(task?.parentReviewState) !== "approved" || recordState === "review") return "withheld";
    if (recordState === "archived") return "history";
    if (meaningfulFeedback(task)) return "feedback";
    const submitted = submissionState(task);
    if (submitted === "submitted" || submitted === "received") return "submitted";
    if (recordState === "active" && submitted === "not_submitted") return "now";
    return "history";
  }

  function school50Model() {
    const model = { now: [], submitted: [], feedback: [], history: [], withheld: [] };
    recordsWithFallback().forEach(task => model[classify(task)].push(task));
    return model;
  }

  function parseDate(value) {
    if (!value) return null;
    if (typeof parseDateOnly === "function") {
      const dateOnly = parseDateOnly(value);
      if (dateOnly) return dateOnly;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function dueDays(task) {
    if (typeof schoolDueInfo === "function") return schoolDueInfo(task?.dueDate).days;
    const due = parseDate(task?.dueDate);
    if (!due) return 9999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
  }

  function stableTaskCompare(a, b) {
    return String(a?.subject || "").localeCompare(String(b?.subject || ""), "en-AU", { sensitivity: "base" }) ||
      String(a?.title || "").localeCompare(String(b?.title || ""), "en-AU", { sensitivity: "base" }) ||
      recordIdentity(a).localeCompare(recordIdentity(b));
  }

  function authoritativeSortTime(task) {
    for (const value of [task?.updatedAt, task?.submittedAt, task?.createdAt]) {
      const date = parseDate(value);
      if (date) return date.getTime();
    }
    const due = parseDate(task?.dueDate);
    return due ? due.getTime() : 0;
  }

  function feedbackHistoryCompare(a, b) {
    const timeDiff = authoritativeSortTime(b) - authoritativeSortTime(a);
    if (timeDiff) return timeDiff;
    const dueA = parseDate(a?.dueDate)?.getTime() || 0;
    const dueB = parseDate(b?.dueDate)?.getTime() || 0;
    if (dueB !== dueA) return dueB - dueA;
    return String(a?.taskId || "").localeCompare(String(b?.taskId || ""));
  }

  function nowGroups(rows) {
    const groups = { overdue: [], dueSoon: [], later: [] };
    rows.forEach(task => {
      const days = dueDays(task);
      if (days < 0) groups.overdue.push(task);
      else if (days <= 7) groups.dueSoon.push(task);
      else groups.later.push(task);
    });
    groups.overdue.sort((a, b) => dueDays(b) - dueDays(a) || stableTaskCompare(a, b));
    groups.dueSoon.sort((a, b) => dueDays(a) - dueDays(b) || stableTaskCompare(a, b));
    groups.later.sort((a, b) => {
      const da = dueDays(a);
      const db = dueDays(b);
      if (da === 9999 && db !== 9999) return 1;
      if (db === 9999 && da !== 9999) return -1;
      return da - db || stableTaskCompare(a, b);
    });
    return groups;
  }

  function formatDate(value) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(date) : "";
  }

  function formatDateTime(value) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(date) : "";
  }

  function subjectAccent(task) {
    return typeof schoolSubjectColour === "function" ? schoolSubjectColour(task) : "var(--brand)";
  }

  function sectionMarkup(title, copy, rows, renderer) {
    if (!rows.length) return "";
    return `<section class="school50-section"><div class="section-heading"><div><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div></div><div class="school-stack">${rows.map(renderer).join("")}</div></section>`;
  }

  function nowCard(task) {
    if (typeof schoolTaskMarkup !== "function") return basicNowCard(task);
    const due = typeof schoolDueInfo === "function" ? schoolDueInfo(task.dueDate) : { label: "" };
    const clone = { ...task };
    let html = schoolTaskMarkup(clone);
    if (!meaningfulFeedback(task)) {
      html = html
        .replace(/<div class="school-feedback-peek">[\s\S]*?<\/div>/, "")
        .replace(/<button class="secondary-button" type="button" data-school-feedback="[^"]+">Feedback<\/button>/, "");
    }
    if (dueDays(task) < 0) {
      const oldMeta = `${escapeHtml(task.subject || "School")} · ${escapeHtml(due.label)}`;
      const newMeta = `${escapeHtml(task.subject || "School")} · Overdue · still needs action`;
      html = html.replace(oldMeta, newMeta);
    }
    return html;
  }

  function basicNowCard(task) {
    const days = dueDays(task);
    const timing = days < 0 ? "Overdue · still needs action" : (formatDate(task.dueDate) ? `Due ${formatDate(task.dueDate)}` : "No due date");
    return `<article class="surface school-task" style="--subject-accent:${escapeHtml(subjectAccent(task))}"><div class="school-task-head"><div><div class="school-meta">${escapeHtml(task.subject || "School")} · ${escapeHtml(timing)}</div><h3>${escapeHtml(task.title || "School task")}</h3></div></div><div class="school-next"><span class="school-next-label">Next</span><strong>${escapeHtml(task.currentAction || task.nextAction || "Choose one useful next action")}</strong></div></article>`;
  }

  function renderNow(rows) {
    if (!rows.length) return `<div class="surface empty school50-empty"><span class="empty-icon">▣</span><strong>Nothing needs action right now.</strong><p>Check Submitted if you're waiting on something, or Feedback to see what came back.</p></div>`;
    const groups = nowGroups(rows);
    return [
      sectionMarkup("Overdue - still needs action", "The due date has passed, but these tasks still have an action you can take.", groups.overdue, nowCard),
      sectionMarkup("Due soon", "Due today or within the next 7 days.", groups.dueSoon, nowCard),
      sectionMarkup("Later", "Still visible without turning School into a giant calendar.", groups.later, nowCard)
    ].join("");
  }

  function submittedCard(task) {
    const state = submissionState(task);
    const received = state === "received";
    const stateLabel = received ? "Received" : "Submitted";
    const waiting = received ? "Waiting for feedback" : "Waiting to confirm it was received";
    const eventDate = received ? (task.receiptConfirmedAt || task.updatedAt) : task.submittedAt;
    const dateLabel = formatDateTime(eventDate);
    const dueLabel = formatDate(task.dueDate);
    return `<article class="surface school50-state-card" style="--subject-accent:${escapeHtml(subjectAccent(task))}">
      <div class="school50-card-head"><div><div class="school-meta">${escapeHtml(task.subject || "School")}</div><h3>${escapeHtml(task.title || "School task")}</h3></div><span class="school-status">${stateLabel}</span></div>
      <p class="school50-waiting"><strong>${waiting}</strong></p>
      <div class="school50-secondary-meta">${dateLabel ? `${stateLabel} ${escapeHtml(dateLabel)}` : ""}${dateLabel && dueLabel ? " · " : ""}${dueLabel ? `Due ${escapeHtml(dueLabel)}` : ""}</div>
      <details class="school50-details"><summary>Open</summary><div class="school50-details-body">${task.currentAction || task.nextAction ? `<p><strong>Last working step</strong><br>${escapeHtml(task.currentAction || task.nextAction)}</p>` : ""}${task.journeyStage ? `<p><strong>Assignment journey</strong><br>${escapeHtml(typeof schoolStageLabel === "function" ? schoolStageLabel(task.journeyStage) : task.journeyStage)}</p>` : ""}</div></details>
      ${!received ? `<div class="school-actions"><button class="secondary-button" type="button" data-school-received="${escapeHtml(task.taskId)}">Confirm received</button></div>` : ""}
    </article>`;
  }

  function renderSubmitted(rows) {
    if (!rows.length) return `<div class="surface empty school50-empty"><span class="empty-icon">▣</span><strong>Nothing is waiting here right now.</strong><p>Submitted work will appear here while you wait for receipt confirmation or feedback.</p></div>`;
    const waitingReceipt = rows.filter(task => submissionState(task) === "submitted").sort(feedbackHistoryCompare);
    const waitingFeedback = rows.filter(task => submissionState(task) === "received").sort(feedbackHistoryCompare);
    return [
      sectionMarkup("Waiting for receipt confirmation", "Work you've sent in while you wait for confirmation.", waitingReceipt, submittedCard),
      sectionMarkup("Received - waiting for feedback", "The work has been received; no returned teacher feedback is recorded yet.", waitingFeedback, submittedCard)
    ].join("");
  }

  function feedbackResultMarkup(task) {
    const result = String(task.gradeOrResult || "").trim();
    const mark = String(task.mark || "").trim();
    const parts = [];
    if (result) {
      const label = /^(on track|not on track)$/i.test(result) ? "Outcome" : "Result";
      parts.push(`<div class="school50-result"><span>${label}</span><strong>${escapeHtml(result)}</strong></div>`);
    }
    if (mark) parts.push(`<div class="school50-result"><span>Mark</span><strong>${escapeHtml(mark)}</strong></div>`);
    if (!parts.length && normalise(task.sourceStatus) === "results published") parts.push(`<div class="school50-result"><span>Feedback</span><strong>Results published</strong></div>`);
    return parts.length ? `<div class="school50-results">${parts.join("")}</div>` : "";
  }

  function feedbackCard(task) {
    const teacher = String(task.teacherComment || "").trim();
    const coach = String(task.coachComment || "").trim();
    const carry = String(task.carryForwardSuggestion || "").trim();
    const dateLabel = formatDateTime(task.updatedAt || task.submittedAt || task.createdAt) || formatDate(task.dueDate);
    return `<article class="surface school50-state-card school50-feedback-card" style="--subject-accent:${escapeHtml(subjectAccent(task))}">
      <div class="school50-card-head"><div><div class="school-meta">${escapeHtml(task.subject || "School")}</div><h3>${escapeHtml(task.title || "School task")}</h3></div></div>
      ${feedbackResultMarkup(task)}
      ${teacher ? `<div class="school50-source-block"><span>Teacher feedback</span><p>${escapeHtml(teacher)}</p></div>` : ""}
      ${coach ? `<div class="school50-source-block school50-app-note"><span>Sophie App support note</span><p>${escapeHtml(coach)}</p></div>` : ""}
      ${carry ? `<div class="school50-source-block school50-app-note"><span>Useful next time</span><p>${escapeHtml(carry)}</p></div>` : ""}
      ${dateLabel ? `<div class="school50-secondary-meta">Updated ${escapeHtml(dateLabel)}</div>` : ""}
      <div class="school-actions"><button class="secondary-button" type="button" data-school-feedback="${escapeHtml(task.taskId)}">View feedback</button></div>
    </article>`;
  }

  function renderFeedback(rows) {
    const ordered = [...rows].sort(feedbackHistoryCompare);
    if (!ordered.length) return `<div class="surface empty school50-empty"><span class="empty-icon">▣</span><strong>No feedback here yet.</strong><p>Results, teacher comments and checkpoint feedback will appear here when they come back.</p></div>`;
    const recent = ordered.slice(0, RECENT_FEEDBACK_LIMIT);
    const earlier = ordered.slice(RECENT_FEEDBACK_LIMIT);
    return [
      sectionMarkup("Recent feedback", "Results, teacher comments and other feedback that has come back.", recent, feedbackCard),
      earlier.length ? `<details class="school50-earlier"><summary>Earlier feedback</summary><div class="school-stack">${earlier.map(feedbackCard).join("")}</div></details>` : ""
    ].join("");
  }

  function historyStateLabel(task) {
    if (meaningfulFeedback(task)) return "Feedback returned";
    const state = submissionState(task);
    if (state === "received") return "Received";
    if (state === "submitted") return "Submitted";
    if (normalise(task.recordState) === "archived") return "Archived";
    return "Past work";
  }

  function historyCard(task) {
    const state = historyStateLabel(task);
    const outcome = [task.gradeOrResult, task.mark].filter(Boolean).join(" · ");
    const dateLabel = formatDateTime(task.updatedAt || task.submittedAt || task.createdAt) || formatDate(task.dueDate);
    return `<article class="school-history-item school50-history-item"><div class="school-history-meta"><span class="school-meta">${escapeHtml(task.subject || "School")}</span><span class="school-history-timing unknown">${escapeHtml(state)}</span></div><strong>${escapeHtml(task.title || "School task")}</strong>${outcome ? `<p>${escapeHtml(outcome)}</p>` : ""}${task.teacherComment ? `<p>${escapeHtml(task.teacherComment)}</p>` : ""}${dateLabel ? `<p class="school-history-dates">${escapeHtml(dateLabel)}</p>` : ""}${meaningfulFeedback(task) ? `<div class="form-actions"><button class="secondary-button" type="button" data-school-feedback="${escapeHtml(task.taskId)}">View feedback</button></div>` : ""}</article>`;
  }

  function renderAllHistory() {
    const host = document.querySelector("#school-history-list");
    if (!host) return;
    const rows = (Array.isArray(app.schoolHistory) ? app.schoolHistory : [])
      .map(task => ({ ...task, recordState: task.recordState || "history", __issue50Source: "history" }))
      .filter(task => classify(task) !== "withheld")
      .sort(feedbackHistoryCompare);
    host.innerHTML = rows.length
      ? rows.map(historyCard).join("")
      : `<div class="empty"><span class="empty-icon">▣</span><strong>No school history here yet.</strong></div>`;
  }

  function enhanceChrome(model = school50Model()) {
    const view = document.querySelector("#view-school");
    const intro = view?.querySelector(".page-intro p");
    if (intro) intro.textContent = "What needs action, what's waiting, and what came back.";

    const toggle = document.querySelector("#school-view-toggle");
    if (toggle) {
      toggle.setAttribute("role", "tablist");
      toggle.setAttribute("aria-label", "School status");
      toggle.innerHTML = [
        ["now", "Now", model.now.length],
        ["submitted", "Submitted", model.submitted.length],
        ["feedback", "Feedback", model.feedback.length]
      ].map(([key, label, count]) => `<button type="button" role="tab" data-school-view="${key}" aria-selected="false" aria-pressed="false" aria-label="${label}, ${count} ${count === 1 ? "task" : "tasks"}"><span>${label}</span><span class="school50-count" aria-hidden="true">${count}</span></button>`).join("");
    }

    const actions = view?.querySelector(".school-toolbar-actions");
    const historyButton = document.querySelector("#open-school-history");
    if (historyButton) historyButton.textContent = "All history";
    if (actions && !document.querySelector("#school50-subjects")) {
      const button = document.createElement("button");
      button.className = "secondary-button school50-subjects-button";
      button.type = "button";
      button.id = "school50-subjects";
      button.dataset.schoolView = "subjects";
      button.textContent = "Subjects";
      actions.insertBefore(button, historyButton || actions.firstChild);
    }
    const historyHeading = document.querySelector("#school-history-dialog .dialog-head h2");
    if (historyHeading) historyHeading.textContent = "All history";
  }

  function syncControlsIssue50() {
    const model = school50Model();
    enhanceChrome(model);
    document.querySelectorAll("#school-view-toggle [data-school-view]").forEach(button => {
      const active = button.dataset.schoolView === app.schoolView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.tabIndex = active || (!MAIN_VIEWS.has(app.schoolView) && button.dataset.schoolView === "now") ? 0 : -1;
    });
    const subjects = document.querySelector("#school50-subjects");
    if (subjects) {
      const active = app.schoolView === "subjects";
      subjects.classList.toggle("active", active);
      subjects.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function renderIssue50Workspace() {
    const workspace = document.querySelector("#school-workspace");
    if (!workspace) return;
    const model = school50Model();
    if (app.schoolView === "submitted") workspace.innerHTML = renderSubmitted(model.submitted);
    else if (app.schoolView === "feedback") workspace.innerHTML = renderFeedback(model.feedback);
    else if (app.schoolView === "now") workspace.innerHTML = renderNow(model.now);
  }

  syncSchoolViewControls = function() {
    try { baseSyncSchoolViewControls(); } catch (_) {}
    syncControlsIssue50();
  };

  renderSchoolHistory = function() {
    try { baseRenderSchoolHistory(); } catch (_) {}
    renderAllHistory();
  };

  renderSchool = function() {
    baseRenderSchool();
    syncControlsIssue50();
    if (app.schoolKey && app.schoolLoaded && !app.schoolUnavailable && MAIN_VIEWS.has(app.schoolView)) {
      renderIssue50Workspace();
    }
    renderAllHistory();
    if (typeof renderHomeOverview === "function") renderHomeOverview();
  };

  setSchoolView = async function(view, button) {
    if (TRANSIENT_VIEWS.has(view)) {
      app.schoolView = view;
      renderSchool();
      return;
    }
    if (!["now", "subjects"].includes(view)) return;
    return baseSetSchoolView(view, button);
  };

  loadSchoolWorkspace = async function(options = {}) {
    const transient = TRANSIENT_VIEWS.has(app.schoolView) ? app.schoolView : "";
    const result = await baseLoadSchoolWorkspace(options);
    if (result && transient) {
      app.schoolView = transient;
      renderSchool();
    }
    return result;
  };

  function ensureStyles() {
    if (document.getElementById("issue50-school-status-styles")) return;
    const style = document.createElement("style");
    style.id = "issue50-school-status-styles";
    style.textContent = `
      #school-view-toggle { grid-template-columns: repeat(3, minmax(0,1fr)); width: min(100%, 520px); }
      #school-view-toggle button { display:flex; align-items:center; justify-content:center; gap:7px; min-width:0; }
      .school50-count { display:inline-flex; align-items:center; justify-content:center; min-width:1.45rem; min-height:1.45rem; padding:0 .38rem; border:1px solid currentColor; border-radius:999px; font-size:.72rem; line-height:1; opacity:.8; }
      .school50-subjects-button.active { border-color:var(--brand); color:var(--brand); background:var(--brand-soft); }
      .school50-section + .school50-section { margin-top:24px; }
      .school50-state-card { border-left:4px solid var(--subject-accent, var(--brand)); padding:18px; }
      .school50-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
      .school50-card-head h3 { margin:5px 0 0; }
      .school50-waiting { margin:14px 0 8px; line-height:1.45; }
      .school50-secondary-meta { color:var(--muted); font-size:.78rem; line-height:1.45; }
      .school50-details { margin-top:12px; border-top:1px solid var(--line); padding-top:10px; }
      .school50-details summary, .school50-earlier > summary { cursor:pointer; color:var(--brand); font-weight:800; min-height:44px; display:flex; align-items:center; }
      .school50-details-body { padding:2px 0 8px; color:var(--muted); }
      .school50-details-body p { margin:8px 0; }
      .school50-results { display:flex; flex-wrap:wrap; gap:10px; margin:14px 0; }
      .school50-result { min-width:110px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--surface-2); }
      .school50-result span, .school50-source-block span { display:block; color:var(--muted); font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
      .school50-result strong { display:block; margin-top:4px; font-size:1rem; }
      .school50-source-block { margin:12px 0; padding:12px; border:1px solid var(--line); border-radius:12px; }
      .school50-source-block p { margin:5px 0 0; line-height:1.5; }
      .school50-app-note { background:var(--surface-2); }
      .school50-earlier { margin-top:22px; }
      .school50-earlier > summary { font-size:1rem; }
      .school50-history-item .form-actions { margin-top:10px; }
      .school50-empty { padding-block:28px; }
      @media (max-width:640px) {
        .school-toolbar { align-items:stretch; flex-direction:column; }
        #school-view-toggle { width:100%; }
        #school-view-toggle button { padding:8px 7px; font-size:.75rem; }
        .school-toolbar-actions { width:100%; }
        .school-toolbar-actions > button { flex:1 1 auto; }
        .school50-card-head { gap:8px; }
      }
      html.compact-device #school-view-toggle button,
      html.compact-device .school50-secondary-meta,
      html.compact-device .school50-result span,
      html.compact-device .school50-source-block span { font-size:16px; }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("keydown", event => {
    const button = event.target.closest?.("#school-view-toggle [data-school-view]");
    if (!button || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...document.querySelectorAll("#school-view-toggle [data-school-view]")];
    if (!tabs.length) return;
    event.preventDefault();
    let index = tabs.indexOf(button);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = tabs.length - 1;
    else index = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[index].focus();
    tabs[index].click();
  });

  ensureStyles();
  enhanceChrome();
  renderSchool();
})();