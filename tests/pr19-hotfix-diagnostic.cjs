const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const HEAD = 'http://127.0.0.1:4173/index.html';
  const BASE = 'http://127.0.0.1:4174/index.html';
  const browser = await chromium.launch({ headless: true });

  async function makePage({ width, height, isMobile = false, hasTouch = false } = {}) {
    const context = await browser.newContext({
      viewport: { width, height },
      screen: { width, height },
      isMobile,
      hasTouch,
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    await page.route('https://script.google.com/**', route => route.abort());
    return { context, page };
  }

  async function geometry(page) {
    return page.evaluate(() => {
      const rect = selector => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom };
      };
      const grid = document.querySelector('.home-os-grid');
      const side = document.querySelector('.home-side-stack');
      return {
        compact: document.documentElement.classList.contains('compact-device'),
        grid: rect('.home-os-grid'),
        main: rect('.home-main-column'),
        side: rect('.home-side-stack'),
        styleLab: rect('.home-style-card'),
        impact: rect('#impact-card'),
        columns: grid ? getComputedStyle(grid).gridTemplateColumns : '',
        sidePosition: side ? getComputedStyle(side).position : '',
        bodyScrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth
      };
    });
  }

  function assertSingleColumn(g, label) {
    assert(g.grid && g.main && g.side && g.styleLab && g.impact, `${label}: required Home elements missing`);
    const tol = 2.5;
    assert(Math.abs(g.main.x - g.grid.x) <= tol, `${label}: main column not aligned to grid`);
    assert(Math.abs(g.side.x - g.grid.x) <= tol, `${label}: side stack not aligned below grid`);
    assert(Math.abs(g.main.width - g.grid.width) <= tol, `${label}: main content compressed`);
    assert(Math.abs(g.side.width - g.grid.width) <= tol, `${label}: Style Lab / Family Impact stack compressed`);
    assert(g.side.y >= g.main.bottom - tol, `${label}: side stack still beside/overlapping main content`);
    assert(g.styleLab.width >= g.side.width - tol, `${label}: Style Lab not full-width`);
    assert(g.impact.width >= g.side.width - tol, `${label}: Family Impact not full-width`);
    assert.equal(g.sidePosition, 'static', `${label}: compact side stack must not be sticky`);
    assert(g.bodyScrollWidth <= g.innerWidth + 2, `${label}: horizontal overflow ${g.bodyScrollWidth} > ${g.innerWidth}`);
  }

  for (const [width,height] of [[360,800],[390,844],[412,915]]) {
    const { context, page } = await makePage({ width, height, isMobile:true, hasTouch:true });
    await page.goto(HEAD, { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(250);
    const g = await geometry(page);
    assert.equal(g.compact, true, `${width}px: phone not classified compact-device`);
    assertSingleColumn(g, `compact ${width}x${height}`);
    console.log(`COMPACT_${width}_OK`, JSON.stringify(g));
    await context.close();
  }

  {
    const { context, page } = await makePage({ width:980, height:1400 });
    await page.goto(HEAD, { waitUntil:'domcontentloaded' });
    await page.evaluate(() => document.documentElement.classList.add('compact-device'));
    const g = await geometry(page);
    assertSingleColumn(g, 'hostile compact 980px');
    console.log('HOSTILE_COMPACT_980_OK', JSON.stringify(g));
    await context.close();
  }

  async function patternResult(url) {
    const { context, page } = await makePage({ width:390, height:844, isMobile:true, hasTouch:true });
    await page.goto(url, { waitUntil:'domcontentloaded' });
    await page.click('[data-open-pattern-studio]');
    await page.fill('#pattern-name', 'Reload test');
    await page.click('[data-pattern-save]');
    const before = await page.$eval('.saved-pattern-swatch', el => ({ bg:getComputedStyle(el).backgroundImage, style:el.getAttribute('style') || '' }));
    await page.reload({ waitUntil:'domcontentloaded' });
    await page.click('[data-open-pattern-studio]');
    const after = await page.$eval('.saved-pattern-swatch', el => ({ bg:getComputedStyle(el).backgroundImage, style:el.getAttribute('style') || '' }));
    await context.close();
    return { before, after };
  }

  const headPattern = await patternResult(HEAD);
  for (const phase of ['before','after']) {
    assert(headPattern[phase].bg && headPattern[phase].bg !== 'none', `head swatch ${phase} has no background image`);
    assert(headPattern[phase].bg.includes('data:image/png;base64,'), `head swatch ${phase} lost PNG data URL`);
  }
  console.log('PATTERN_SAVE_RELOAD_OK', JSON.stringify({beforeBg:headPattern.before.bg.slice(0,80), afterBg:headPattern.after.bg.slice(0,80)}));

  const basePattern = await patternResult(BASE);
  const baseBroken = !basePattern.after.bg || basePattern.after.bg === 'none' || !basePattern.after.bg.includes('data:image/png;base64,');
  assert.equal(baseBroken, true, 'base snapshot unexpectedly does not reproduce blank saved-swatch defect');
  console.log('BASE_PATTERN_DEFECT_REPRODUCED');

  async function desktopSnapshot(url) {
    const { context, page } = await makePage({ width:1280, height:1000 });
    await page.goto(url, { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(200);
    const g = await geometry(page);
    await context.close();
    return g;
  }

  const baseDesktop = await desktopSnapshot(BASE);
  const headDesktop = await desktopSnapshot(HEAD);
  assert.equal(baseDesktop.compact, false, 'base desktop unexpectedly compact');
  assert.equal(headDesktop.compact, false, 'head desktop unexpectedly compact');
  assert.equal(baseDesktop.sidePosition, 'sticky', 'base desktop side stack not sticky');
  assert.equal(headDesktop.sidePosition, 'sticky', 'head desktop side stack not sticky');
  assert.equal(baseDesktop.columns, headDesktop.columns, 'desktop grid columns changed');
  for (const key of ['grid','main','side','styleLab','impact']) {
    for (const dim of ['x','y','width','height']) {
      const delta = Math.abs(baseDesktop[key][dim] - headDesktop[key][dim]);
      assert(delta <= 1, `desktop ${key}.${dim} changed by ${delta}px`);
    }
  }
  console.log('DESKTOP_UNCHANGED_OK', JSON.stringify(headDesktop));

  await browser.close();
  console.log('ALL_PR19_HOTFIX_GATES_OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
