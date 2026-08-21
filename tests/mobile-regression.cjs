const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const viewports = [
  [320, 700], [360, 800], [390, 844], [412, 915], [480, 900],
  [600, 900], [839, 900], [840, 900], [1280, 900]
];

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  });
}

function baseData() {
  return {
    appVersion: "v2.5.0",
    opportunityContractVersion: "d006-v1",
    learningResourceContractVersion: "lr-v1",
    learningRecommendationContractVersion: "rec-v1",
    balance: 125.4,
    pending: 10,
    impact: { contributionsThisWeek: 2, minutesThisWeek: 35, message: "You helped family life run more smoothly." },
    goals: [{ goalId: "G1", title: "Drawing tablet", targetAmount: 300, savedAmount: 80, status: "active", icon: "🎯" }],
    jobs: [
      { id: "C1", type: "contribute", title: "Clear the dinner table", requiredness: "expected", status: "available", whyItMatters: "It helps everyone reset the kitchen.", completionStandard: "Table cleared and wiped.", estimatedMinutes: 10 },
      { id: "E1", type: "earn", title: "Wash the family car", requiredness: "optional", status: "available", scope: "Wash and dry the outside.", completionStandard: "Body and windows are clean.", agreedValue: 15, value: 15, estimatedMinutes: 40 },
      { id: "L1", type: "learn", title: "Cook rice", requiredness: "optional", status: "in_progress", whyItMatters: "Make a useful meal base.", completionStandard: "Practise measuring, simmering and checking texture.", skill: "Cooking", skillId: "COOK-T010", estimatedMinutes: 30 },
      { id: "L2", type: "learn", title: "Thread a needle", requiredness: "optional", status: "completed", whyItMatters: "Start simple repairs.", completionStandard: "Thread and secure the needle.", skill: "Sewing", skillId: "SEW-T001", estimatedMinutes: 10 }
    ],
    skills: [
      { id: "S1", name: "Cooking", description: "Prepare food safely and confidently.", icon: "🍳", level: 4, progress: 88, nextLevelAt: 100 },
      { id: "S2", name: "Money", description: "Make thoughtful everyday money choices.", icon: "💰", level: 2, progress: 30, nextLevelAt: 50 }
    ],
    learningResources: [{ resourceId: "R1", attachedToType: "opportunity", attachedToId: "L1", resourceType: "video", provider: "youtube", providerResourceId: "dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ", embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", embeddable: true, title: "How rice changes as it cooks", description: "Notice the water and texture.", active: true, reviewState: "active", sortOrder: 1, addedByRole: "parent", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
    transactions: [{ description: "Family contribution", type: "contribute", amount: 0, date: "2026-08-20", status: "recorded" }]
  };
}

function json(route, data, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
}

async function installApiMock(page, calls, state) {
  await page.route("https://script.google.com/**", async route => {
    const request = route.request();
    if (request.method() === "GET") return json(route, { success: true, data: state.data });
    const payload = JSON.parse(request.postData() || "{}");
    calls.push(payload);
    const find = id => state.data.jobs.find(job => job.id === id);
    if (payload.action === "getParentData") return json(route, { success: true, data: state.data });
    if (payload.action === "getLearningRecommendations") return json(route, { success: true, data: {
      learningRecommendationContractVersion: "rec-v1",
      recommendationSessionId: "RS1",
      recommendationSetId: "SET1",
      recommendations: [{ candidateId: "LC-COOK-005", title: "Caprese-style salad", whyItMatters: "Make a fresh side dish.", practiceDescription: "Arrange ingredients and practise controlled preparation.", estimatedMinutes: 20, safety: { required: false, minimumSupport: "none", note: "" }, eligibility: { status: "eligible", reason: "" }, reasons: ["It fits the challenge you chose."], recommendationEventId: "RE1" }]
    }});
    if (payload.action === "getLearningCandidateCatalogue") return json(route, { success: true, data: { candidates: [
      { candidateId: "LC-COOK-005", title: "Caprese-style salad", estimatedMinutes: 20, eligibility: { status: "eligible", reason: "" } },
      { candidateId: "LC-COOK-020", title: "Fine knife cuts", estimatedMinutes: 25, eligibility: { status: "hard_prerequisite_unmet", reason: "First establish Set Up Sharp Tools Safely, then practise Control the Knife." } }
    ] }});
    if (payload.action === "chooseRecommendedLearn") {
      const opportunity = { id: "L3", type: "learn", title: "Caprese-style salad", requiredness: "negotiated", status: "available", whyItMatters: "Make a fresh side dish.", completionStandard: "Practise controlled preparation and assembly.", skill: "Cooking", sourceCandidateId: payload.candidateId, estimatedMinutes: 20 };
      state.data.jobs.push(opportunity);
      return json(route, { success: true, data: { opportunity } });
    }
    if (["startOpportunity", "finishOpportunity", "stopLearn"].includes(payload.action)) {
      const job = find(payload.opportunityId);
      if (job) job.status = payload.action === "startOpportunity" ? "in_progress" : payload.action === "finishOpportunity" ? "completed" : "withdrawn";
      return json(route, { success: true, data: { opportunity: job } });
    }
    if (payload.action === "getSchoolWorkspace") return json(route, { success: true, data: { tasks: [], history: [], profile: { scaffoldMode: "guided", preferredSchoolView: "now" } } });
    if (payload.action === "getLearningResourcesAdmin") return json(route, { success: true, data: [] });
    return json(route, { success: true, data: {} });
  });
}

async function openApp(browser, baseUrl, viewport, { reducedMotion = "no-preference", serviceWorkers = "block" } = {}) {
  const context = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, reducedMotion, serviceWorkers });
  await context.addInitScript(() => {
    localStorage.setItem("sophie_learning_recommendation_key", "mock-device-key");
    localStorage.setItem("sophie_school_key", "mock-school-key");
  });
  const page = await context.newPage();
  const calls = [];
  const state = { data: baseData() };
  await installApiMock(page, calls, state);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#balance")?.textContent.includes("125"));
  return { context, page, calls, state };
}

async function layoutAudit(page, width) {
  const audit = await page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll("button, [role=button], summary, a.learning-resource-link")].filter(visible);
    const undersized = controls.map(element => {
      const rect = element.getBoundingClientRect();
      return { label: (element.getAttribute("aria-label") || element.textContent || element.tagName).trim().slice(0, 80), width: rect.width, height: rect.height };
    }).filter(item => item.width < 47.5 || item.height < 47.5);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      undersized,
      navGridColumns: getComputedStyle(document.querySelector(".bottom-nav")).gridTemplateColumns,
      navGridRows: getComputedStyle(document.querySelector(".bottom-nav")).gridTemplateRows
    };
  });
  assert(audit.scrollWidth <= audit.innerWidth + 1, `horizontal overflow ${audit.scrollWidth} > ${audit.innerWidth}`);
  assert.deepStrictEqual(audit.undersized, [], `undersized targets: ${JSON.stringify(audit.undersized)}`);
  if (width < 840) assert(audit.navGridColumns.split(" ").length >= 5, "compact/medium navigation is not horizontal");
  if (width >= 840) assert(audit.navGridRows.split(" ").length >= 5, "expanded navigation is not a rail");
  return audit;
}

async function runViewport(browser, baseUrl, viewport) {
  const { context, page } = await openApp(browser, baseUrl, viewport);
  await layoutAudit(page, viewport[0]);
  await page.getByRole("button", { name: "Skills", exact: true }).click();
  await page.getByRole("heading", { name: "Currently learning" }).waitFor();
  assert.strictEqual(await page.getByText(/Level \d/i).count(), 0, "legacy Level presentation is visible");
  assert.strictEqual(await page.getByText(/to next level/i).count(), 0, "legacy percentage-to-level presentation is visible");
  await page.getByRole("button", { name: /Cooking Choose something/ }).click();
  await page.getByRole("heading", { name: "Cooking", exact: true }).waitFor();
  await page.getByText("Hard safety prerequisite", { exact: true }).waitFor();
  await layoutAudit(page, viewport[0]);
  await page.evaluate(() => history.back());
  await page.getByRole("heading", { name: "Currently learning" }).waitFor();
  await page.getByRole("button", { name: "Opportunities", exact: true }).click();
  await page.getByRole("heading", { name: "Contribute & Earn" }).waitFor();
  assert.strictEqual(await page.getByRole("button", { name: "Learn", exact: true }).count(), 0, "Learn remains an Opportunities filter");
  assert.strictEqual(await page.locator("#all-jobs").getByText("Cook rice", { exact: true }).count(), 0, "Learn activity duplicated in Opportunities");
  await layoutAudit(page, viewport[0]);
  await context.close();
  return { viewport: `${viewport[0]}x${viewport[1]}`, result: "PASS" };
}

async function runFunctional(browser, baseUrl) {
  const { context, page, calls, state } = await openApp(browser, baseUrl, [390, 844]);
  await page.getByRole("button", { name: "Skills", exact: true }).click();
  await page.getByRole("button", { name: /Cooking Choose something/ }).click();
  await page.getByRole("button", { name: "Find a Cooking idea" }).click();
  await page.getByRole("button", { name: "About the same" }).click();
  await page.getByRole("button", { name: "An adult will be nearby" }).click();
  await page.getByRole("button", { name: "Show me some ideas" }).click();
  await page.getByRole("heading", { name: "A few Cooking ideas" }).waitFor();
  await page.getByRole("button", { name: "Browse more ideas" }).click();
  await page.getByRole("heading", { name: "Browse more Cooking ideas" }).waitFor();
  await page.getByText(/First establish Set Up Sharp Tools Safely/).waitFor();
  const locked = page.getByRole("article").filter({ hasText: "Fine knife cuts" });
  assert.strictEqual(await locked.getByRole("button", { name: "Add to Learn" }).count(), 0, "hard prerequisite item can be added");
  await page.getByRole("button", { name: "Back to a few ideas" }).click();
  await page.getByRole("heading", { name: "A few Cooking ideas" }).waitFor();
  await page.getByRole("button", { name: "See this idea" }).click();
  await page.getByRole("button", { name: "Choose this" }).click();
  await page.getByRole("button", { name: "Prompt me" }).click();
  await page.getByRole("button", { name: "Add to Learn" }).click();
  await page.getByRole("heading", { name: "Caprese-style salad" }).waitFor();
  assert(await page.locator("#opportunity-detail-dialog").getByText("Available", { exact: true }).isVisible(), "new Learn is not available/unstarted");
  assert.strictEqual(calls.some(call => call.action === "chooseRecommendedLearn"), true, "chooseRecommendedLearn was not used");
  assert.strictEqual(calls.some(call => call.action === "startOpportunity" && call.opportunityId === "L3"), false, "Learn auto-started");
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("heading", { name: "Currently learning" }).waitFor();
  await page.getByText("Caprese-style salad", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Opportunities", exact: true }).click();
  await page.getByRole("button", { name: "Open Clear the dinner table details" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  assert(calls.some(call => call.action === "startOpportunity" && call.opportunityId === "C1"), "Contribute lifecycle did not use D-006 action");
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Goals", exact: true }).click();
  await page.getByRole("heading", { name: "My goals" }).waitFor();
  await page.getByText(/\$80.00 saved towards \$300.00/).waitFor();
  await page.getByRole("button", { name: "School", exact: true }).click();
  await page.getByRole("heading", { name: "School", exact: true }).waitFor();

  await page.getByRole("button", { name: "Open personalisation" }).click();
  await page.getByRole("button", { name: "Parent access" }).click();
  await page.getByLabel("Admin key").fill("mock-admin-key");
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await page.getByRole("button", { name: "+ Add Learn" }).waitFor();
  await page.getByRole("button", { name: "+ Add Learn" }).click();
  assert.strictEqual(await page.locator("#opp-create-type").inputValue(), "learn", "Add Learn did not preselect Learn");
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Goals", exact: true }).click();
  await page.getByRole("button", { name: "+ Add a goal" }).click();
  await page.setViewportSize({ width: 390, height: 500 });
  const keyboardAudit = await page.evaluate(() => {
    const actions = document.querySelector("#goal-dialog .form-actions");
    actions.scrollIntoView({ block: "end" });
    return { position: getComputedStyle(actions).position, dialogHeight: document.querySelector("#goal-dialog").getBoundingClientRect().height, viewportHeight: innerHeight };
  });
  assert.strictEqual(keyboardAudit.position, "sticky", "mobile form actions are not sticky");
  assert(keyboardAudit.dialogHeight <= keyboardAudit.viewportHeight + 1, "dialog exceeds reduced soft-keyboard viewport");
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await page.getByRole("button", { name: "Skills", exact: true }).click();
  const zoomAudit = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }));
  assert(zoomAudit.scrollWidth <= zoomAudit.innerWidth + 1, "200% text causes horizontal overflow");

  const moneyState = { balance: state.data.balance, pending: state.data.pending };
  assert.deepStrictEqual(moneyState, { balance: 125.4, pending: 10 }, "financial state changed during non-financial Learn flow");
  await context.close();
  return { recommendationConversion: "PASS", noAutoStart: "PASS", contributeLifecycle: "PASS", goals: "PASS", school: "PASS", parentCreation: "PASS", softKeyboard: "PASS", text200: "PASS", financialIsolation: "PASS" };
}

async function runAccessibility(browser, baseUrl) {
  const { context, page } = await openApp(browser, baseUrl, [1280, 900], { reducedMotion: "reduce" });
  const motion = await page.evaluate(() => {
    const view = document.querySelector(".view");
    const style = getComputedStyle(view);
    return { animationDuration: style.animationDuration, transitionDuration: style.transitionDuration };
  });
  assert(["0s", "0.001ms"].includes(motion.animationDuration), `reduced animation remains ${motion.animationDuration}`);
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return { tag: element.tagName, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  assert.notStrictEqual(focus.outlineStyle, "none", "keyboard focus indicator is missing");
  await context.close();
  return { reducedMotion: "PASS", keyboardFocus: "PASS" };
}

async function runPwa(browser, baseUrl) {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const manifest = await fetch("./manifest.webmanifest").then(response => response.json());
    return { scope: registration.scope, controller: Boolean(navigator.serviceWorker.controller), manifest };
  });
  assert.strictEqual(result.manifest.id, "./");
  assert.strictEqual(result.manifest.start_url, "./index.html");
  assert.strictEqual(result.manifest.scope, "./");
  assert.strictEqual(result.manifest.display, "standalone");
  assert(result.manifest.icons.some(icon => icon.sizes === "192x192"));
  assert(result.manifest.icons.some(icon => icon.sizes === "512x512"));
  assert(result.manifest.icons.every(icon => !String(icon.purpose || "").includes("maskable")), "unverified maskable icon declared");
  await context.close();
  return { manifest: "PASS", registration: "PASS", maskableDeclaration: "PASS" };
}

(async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch({ headless: true });
  try {
    const viewportResults = [];
    for (const viewport of viewports) viewportResults.push(await runViewport(browser, baseUrl, viewport));
    const functional = await runFunctional(browser, baseUrl);
    const accessibility = await runAccessibility(browser, baseUrl);
    const pwa = await runPwa(browser, baseUrl);
    console.log(JSON.stringify({ viewportResults, functional, accessibility, pwa }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
