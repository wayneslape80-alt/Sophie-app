const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { makePathwayPayload } = require('./v27-pathway-fixture.cjs');

const APP_URL = process.env.V27_APP_URL || 'http://127.0.0.1:4173/index.html';
const API_PREFIX = 'https://script.google.com/macros/s/';

const newLearn = {
  id: 'OP-V27-TEST',
  title: 'Caprese Salad',
  type: 'learn',
  status: 'available',
  requiredness: 'optional',
  category: 'Cooking',
  capabilityLabel: 'Knife control and cold assembly',
  skillId: 'S001',
  estimatedMinutes: 20,
  whyItMatters: 'Practise controlled cutting in a real food task.',
  completionStandard: 'Prepare the activity safely with the support chosen for this session.',
  supportPreference: 'got_this',
  sourceCandidateId: 'LC-COOK-005',
  value: 0
};

function appData(created) {
  return {
    appVersion: '2.5.0-test',
    opportunityContractVersion: 'd006-v1',
    learningResourceContractVersion: 'lr-v1',
    learningRecommendationContractVersion: 'rec-v1',
    learningPathwayContractVersion: 'pathway-v1',
    learningResources: [],
    balance: 0,
    pending: 0,
    impact: { contributionsThisWeek: 0, minutesThisWeek: 0, message: 'Test state' },
    goals: [],
    jobs: created ? [newLearn] : [],
    skills: [],
    transactions: []
  };
}

function json(route, payload) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload)
  });
}

(async () => {
  let created = false;
  const posts = [];
  const pageErrors = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    screen: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.625,
    serviceWorkers: 'block'
  });

  await context.addInitScript(() => {
    localStorage.setItem('sophie_learning_recommendation_key', 'test-rec-key-not-production');
  });

  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(String(error && (error.stack || error.message) || error)));

  await page.route(`${API_PREFIX}**`, async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      return json(route, { success: true, data: appData(created) });
    }

    let payload = {};
    try { payload = JSON.parse(request.postData() || '{}'); } catch {}
    posts.push(payload);

    if (payload.action === 'getLearningPathway') {
      assert.equal(payload.domain, 'cooking');
      assert.equal(payload.recommendationKey, 'test-rec-key-not-production');
      return json(route, { success: true, data: makePathwayPayload() });
    }

    if (payload.action === 'getLearningCandidateCatalogue') {
      assert.equal(payload.domain, 'cooking');
      assert.equal(payload.techniqueId, 'COOK-T004');
      assert.equal(payload.recommendationKey, 'test-rec-key-not-production');
      return json(route, {
        success: true,
        data: {
          candidates: [
            { candidateId: 'LC-COOK-005', title: 'Caprese Salad', estimatedMinutes: 20, eligibility: { status: 'eligible', reason: '' } },
            { candidateId: 'LC-COOK-015', title: 'White Bean Salad', estimatedMinutes: 20, eligibility: { status: 'ineligible', reason: 'Use the safer precursor first for this setup.' } },
            { candidateId: 'LC-COOK-002', title: 'Berry Breakfast Trifle', estimatedMinutes: 20, eligibility: { status: 'eligible', reason: '' } }
          ]
        }
      });
    }

    if (payload.action === 'chooseRecommendedLearn') {
      assert.equal(payload.recommendationKey, 'test-rec-key-not-production');
      assert.equal(payload.candidateId, 'LC-COOK-005');
      assert.equal(payload.availableSafetySupport, 'direct_supervision');
      created = true;
      return json(route, {
        success: true,
        data: { opportunity: { id: newLearn.id, type: 'learn', status: 'available' } }
      });
    }

    return json(route, { success: false, error: `Unexpected test action: ${payload.action}` });
  });

  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('button[data-view-target="skills"]');

  // Accepted v2.6.3 compact Android baseline must remain intact.
  await page.click('button[data-view-target="skills"]');
  await page.waitForSelector('button[data-skills-domain="cooking"]');
  const compact = await page.evaluate(() => document.documentElement.classList.contains('compact-device'));
  assert.equal(compact, true, 'Android phone should retain compact-device mode');
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  assert.ok(overflow.scrollWidth <= overflow.clientWidth + 1, `Unexpected horizontal overflow: ${JSON.stringify(overflow)}`);
  const navBox = await page.locator('.bottom-nav').boundingBox();
  assert.ok(navBox && navBox.y > 700 && navBox.width > 300, 'Compact bottom navigation should remain near the bottom of the phone viewport');

  // Skills -> Cooking -> interactive technique groups.
  await page.click('button[data-skills-domain="cooking"]');
  await page.waitForSelector('.technique-groups');
  assert.equal(await page.locator('.technique-group').count(), 5, 'Cooking should expose five progressively disclosed technique groups');
  assert.equal(await page.locator('.technique-group[open]').count(), 1, 'Only the first technique family should be open initially');
  assert.equal(await page.locator('.technique-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1, 'Phone technique list must be single column');

  // Hard-prerequisite detail and explorable prerequisite navigation.
  await page.click('[data-v27-technique="COOK-T004"]');
  await page.waitForSelector('.technique-detail-hero h2');
  assert.equal((await page.locator('.technique-detail-hero h2').textContent()).trim(), 'Control the Knife');
  assert.ok((await page.locator('.technique-detail').textContent()).includes('Safety prerequisite'), 'Hard prerequisite section should be visible');
  assert.ok((await page.locator('.technique-detail').textContent()).includes('Set Up Sharp Tools Safely'), 'Hard prerequisite should name the precursor');

  await page.click('.technique-link[data-v27-technique="COOK-T003"]');
  await page.waitForFunction(() => document.querySelector('.technique-detail-hero h2')?.textContent?.trim() === 'Set Up Sharp Tools Safely');
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('.technique-detail-hero h2')?.textContent?.trim() === 'Control the Knife');

  // Technique-originated choice must use the existing rec-v1 catalogue, then existing chooseRecommendation path.
  const learnButton = page.locator('[data-v27-learn-technique="COOK-T004"]');
  await learnButton.waitFor();
  assert.equal(await learnButton.isEnabled(), true, 'Technique learning choice should be enabled with a scoped test device credential');
  await learnButton.click();

  await page.waitForSelector('#recommendation-dialog[open]');
  assert.ok((await page.locator('#recommendation-dialog-body').textContent()).includes('Step 1 of 3'));
  assert.equal(await page.locator('[data-v27-technique-safety]').count(), 4, 'Safety setup should reuse all four existing options');
  await page.click('[data-v27-technique-safety="direct_supervision"]');
  await page.click('[data-v27-check-technique]');

  await page.waitForFunction(() => document.querySelector('#recommendation-dialog-body')?.textContent?.includes('Step 2 of 3'));
  assert.equal(await page.locator('[data-v27-technique-candidate]').count(), 1, 'Only eligible linked candidates should be directly choosable');
  const step2 = await page.locator('#recommendation-dialog-body').textContent();
  assert.ok(step2.includes('Caprese Salad'));
  assert.ok(step2.includes('White Bean Salad'));
  assert.ok(!step2.includes('Berry Breakfast Trifle'), 'Unrelated catalogue candidates must not leak into the technique flow');
  assert.ok(!step2.includes('rec-v1'), 'Internal recommendation architecture should not be Sophie-facing');
  await page.click('[data-v27-technique-candidate="LC-COOK-005"]');

  await page.waitForFunction(() => document.querySelector('#recommendation-dialog-body')?.textContent?.includes('Step 3 of 3'));
  assert.equal(await page.locator('[data-rec-support]').count(), 4, 'Support step should reuse the four existing reversible choices');
  await page.click('[data-rec-support="got_this"]');
  await page.click('[data-rec-add-to-learn]');

  // Existing chooseRecommendation() must confirm authoritative available Learn state after reload.
  await page.waitForSelector('#opportunity-detail-dialog[open]');
  const detailText = await page.locator('#opportunity-detail-dialog').textContent();
  assert.ok(detailText.includes('Caprese Salad'));
  assert.ok(detailText.toLowerCase().includes('available'));
  assert.ok(posts.some(item => item.action === 'getLearningCandidateCatalogue'));
  assert.ok(posts.some(item => item.action === 'getLearningPathway'));
  assert.ok(posts.some(item => item.action === 'chooseRecommendedLearn'));
  assert.ok(!posts.some(item => item.action === 'createOpportunity'), 'Technique choice must not bypass rec-v1 with direct opportunity creation');

  const finalOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  assert.ok(finalOverflow.scrollWidth <= finalOverflow.clientWidth + 1, 'Pathway flow must preserve compact no-overflow layout');

  assert.deepEqual(pageErrors, [], `Page errors encountered:\n${pageErrors.join('\n')}`);
  await browser.close();
  console.log('v2.7 Skill Pathways runtime regression passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
