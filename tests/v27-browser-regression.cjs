const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const { makePathwayPayload } = require("./v27-pathway-fixture.cjs");

const root = path.resolve(__dirname, "..");
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".svg":"image/svg+xml" };

const appData = {
  appVersion: "v2.7-test",
  opportunityContractVersion: "d006-v1",
  learningResourceContractVersion: "lr-v1",
  learningRecommendationContractVersion: "rec-v1",
  learningPathwayContractVersion: "pathway-v1",
  balance: 25,
  pending: 0,
  impact: { contributionsThisWeek: 1, minutesThisWeek: 20, message: "Test impact" },
  goals: [],
  jobs: [{
    id: "OPP-LEARN-1", title: "Practise safe vegetable preparation", type: "learn",
    requiredness: "optional", status: "available", value: 0, category: "Cooking",
    skill: "Kitchen safety", skillId: "SKILL-COOK", estimatedMinutes: 20,
    whyItMatters: "Prepare food safely", scope: "Kitchen", completionStandard: "Practise for now"
  }],
  skills: [{ id:"SKILL-COOK", name:"Kitchen safety", description:"Use ordinary kitchen equipment safely." }],
  transactions: [],
  learningResources: []
};
const observedPosts = [];

function server() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = path.resolve(root, requested);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream", "cache-control":"no-store" });
    fs.createReadStream(file).pipe(response);
  });
}

async function mockApi(page) {
  await page.route("https://script.google.com/**", async route => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ success:true, data:appData }) });
      return;
    }
    const payload = JSON.parse(request.postData() || "{}");
    observedPosts.push(payload);
    if (payload.action === "getLearningPathway") {
      await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ success:true, data:makePathwayPayload() }) });
      return;
    }
    if (payload.action === "getLearningCandidateCatalogue") {
      await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ success:true, data:{ candidates:[
        { candidateId:"LC-COOK-005", title:"Practise controlled vegetable slicing", estimatedMinutes:20, eligibility:{ status:"eligible", reason:"" } },
        { candidateId:"LC-COOK-015", title:"Prepare a firmer ingredient", estimatedMinutes:25, eligibility:{ status:"ineligible", reason:"Use a stronger safety setup first." } },
        { candidateId:"LC-COOK-999", title:"Unlinked activity", estimatedMinutes:10, eligibility:{ status:"eligible", reason:"" } }
      ] } }) });
      return;
    }
    if (payload.action === "chooseRecommendedLearn") {
      const opportunity = {
        id:"OPP-REC-1", title:"Practise controlled vegetable slicing", type:"learn", requiredness:"negotiated",
        status:"available", value:0, category:"Cooking", skill:"Knife control", skillId:"SKILL-COOK",
        estimatedMinutes:20, whyItMatters:"Practise safely", scope:"Kitchen", completionStandard:"Practise for now",
        sourceCandidateId:payload.candidateId
      };
      if (!appData.jobs.some(job => job.id === opportunity.id)) appData.jobs.push(opportunity);
      await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ success:true, data:{ opportunity } }) });
      return;
    }
    await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ success:false, code:"TEST_WRITE_BLOCKED", error:"Unexpected write in pathway regression." }) });
  });
}

(async () => {
  const web = server();
  await new Promise(resolve => web.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${web.address().port}`;
  const browser = await chromium.launch({ headless:true });
  const viewports = [
    [320,700], [360,800], [390,844], [412,915], [480,900],
    [600,900], [839,900], [840,900], [1280,900]
  ];

  try {
    for (const [width,height] of viewports) {
      const phone = width <= 480;
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: phone,
        hasTouch: phone,
        reducedMotion: "reduce",
        userAgent: phone ? "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/151 Mobile Safari/537.36" : undefined
      });
      const page = await context.newPage();
      await mockApi(page);
      await page.addInitScript(() => localStorage.setItem("sophie_learning_recommendation_key", "inert-browser-test-key"));
      await page.goto(origin, { waitUntil:"networkidle" });
      await page.locator('[data-view-target="skills"]').click();
      await page.locator('[data-skills-domain="cooking"]').click();
      await page.locator(".technique-group").first().waitFor();

      assert.equal(await page.locator(".technique-group").count(), 5, `${width}x${height}: technique groups`);
      assert.equal(await page.locator(".technique-group[open]").count(), 1, `${width}x${height}: progressive disclosure`);
      assert.equal(await page.locator(".technique-card:visible").count(), 9, `${width}x${height}: initially visible preparation techniques`);
      assert.ok(await page.locator(".technique-card", { hasText:"Control the Knife" }).isVisible());

      const columns = await page.locator(".technique-group[open] .technique-grid").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length);
      assert.equal(columns, width < 840 ? 1 : 2, `${width}x${height}: adaptive technique columns`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${width}x${height}: horizontal overflow ${overflow}px`);

      const visibleTargets = await page.locator(".technique-group[open] summary, .technique-group[open] .technique-card").evaluateAll(nodes => nodes.filter(node => {
        const style = getComputedStyle(node); return style.display !== "none" && node.getBoundingClientRect().height > 0;
      }).map(node => ({ width:node.getBoundingClientRect().width, height:node.getBoundingClientRect().height })));
      assert.ok(visibleTargets.every(box => box.height >= 48 && box.width >= 48), `${width}x${height}: 48px targets`);

      await page.locator(".technique-card", { hasText:"Control the Knife" }).click();
      await page.locator(".technique-detail h2", { hasText:"Control the Knife" }).waitFor();
      assert.ok(await page.locator(".technique-detail-section", { hasText:"Safety prerequisite" }).isVisible());
      assert.ok(await page.locator(".technique-link", { hasText:"Set Up Sharp Tools Safely" }).isVisible());
      assert.equal(await page.getByRole("button", { name:/I want to learn this/i }).count(), 1, `${width}x${height}: existing-route learning choice`);

      const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(detailOverflow <= 1, `${width}x${height}: detail overflow ${detailOverflow}px`);

      if (width === 390) {
        await page.locator(".technique-link", { hasText:"Set Up Sharp Tools Safely" }).click();
        await page.locator(".technique-detail h2", { hasText:"Set Up Sharp Tools Safely" }).waitFor();
        await page.goBack();
        await page.locator(".technique-detail h2", { hasText:"Control the Knife" }).waitFor();
        await page.goBack();
        await page.locator("#v27-techniques-heading").waitFor();
        assert.equal(await page.locator(".technique-detail").count(), 0, "Android Back returns technique -> Cooking");

        await page.locator(".technique-card", { hasText:"Control the Knife" }).click();
        await page.getByRole("button", { name:"I want to learn this" }).click();
        await page.getByRole("heading", { name:"Set up this learning choice" }).waitFor();
        await page.getByRole("button", { name:"An adult will be nearby" }).click();
        await page.getByRole("button", { name:"Show learning choices" }).click();
        await page.getByRole("heading", { name:"Choose a real activity" }).waitFor();
        assert.equal(await page.locator('[data-v27-technique-candidate="LC-COOK-005"]').count(), 1, "linked eligible candidate shown");
        assert.equal(await page.getByText("Unlinked activity").count(), 0, "unlinked candidate excluded");
        await page.locator('[data-v27-technique-candidate="LC-COOK-005"]').click();
        await page.getByRole("heading", { name:"Choose the support you want" }).waitFor();
        await page.getByRole("button", { name:"Prompt me" }).click();
        await page.getByRole("button", { name:"Add to Learn" }).click();
        await page.getByRole("heading", { name:"Practise controlled vegetable slicing" }).waitFor();

        const cataloguePost = observedPosts.find(post => post.action === "getLearningCandidateCatalogue");
        const choosePost = observedPosts.find(post => post.action === "chooseRecommendedLearn");
        assert.equal(cataloguePost.techniqueId, "COOK-T004");
        assert.equal(cataloguePost.availableSafetySupport, "adult_nearby");
        assert.equal(choosePost.candidateId, "LC-COOK-005");
        assert.equal(choosePost.availableSafetySupport, "adult_nearby");
        assert.equal(choosePost.recommendationKey, "inert-browser-test-key");
        assert.ok(!observedPosts.some(post => post.action === "createOpportunity"), "technique choice must not bypass rec-v1");
        assert.ok(observedPosts.some(post => post.action === "getLearningPathway"), "pathway must come from the authoritative read route");
        await page.locator('#opportunity-detail-dialog [data-close-dialog="opportunity-detail-dialog"]').click();

        await page.addStyleTag({ content:"html{font-size:200% !important}" });
        const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(zoomOverflow <= 1, `390x844 at 200% text: overflow ${zoomOverflow}px`);
      }

      await context.close();
      console.log(`${width}x${height}: PASS`);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => web.close(resolve));
  }

  console.log("v2.7 browser regression: PASS");
})().catch(error => {
  console.error(error);
  const message = String(error && (error.stack || error.message) || error).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  console.error(`::error file=tests/v27-browser-regression.cjs::${message}`);
  process.exitCode = 1;
});
