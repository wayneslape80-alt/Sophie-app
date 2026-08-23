const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const HEAD = 'http://127.0.0.1:4173/index.html';
  const BASE = 'http://127.0.0.1:4174/index.html';
  const browser = await chromium.launch({ headless: true });

  async function pageFor(url, options = {}) {
    const context = await browser.newContext({
      viewport: options.viewport || { width: 390, height: 844 },
      screen: options.screen || options.viewport || { width: 390, height: 844 },
      isMobile: Boolean(options.isMobile),
      hasTouch: Boolean(options.hasTouch),
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    await page.route('https://script.google.com/**', route => route.abort());
    if (options.init) await page.addInitScript(options.init);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    return { context, page };
  }

  function assertSlots(cells) {
    assert.equal(cells.length, 1024);
    assert(cells.every(cell => cell === null || Number.isInteger(cell) && cell >= 1 && cell <= 6), 'pattern contains values outside slot refs 1-6');
  }

  // Six-colour editor, app palette binding, slot recolour, Saved Look persistence and 128px repeat.
  {
    const { context, page } = await pageFor(HEAD, { isMobile: true, hasTouch: true });
    assert.equal(await page.locator('#theme-options').evaluate(el => el.closest('.setting-row').hidden), true, 'legacy Colour theme row still visible');
    await page.click('[data-open-pattern-studio]');
    assert.equal(await page.locator('[data-pattern-slot]').count(), 6, 'expected exactly six drawing colour slots');
    assert.equal(await page.locator('[data-pattern-slot-picker]').count(), 6, 'expected exactly six editable colour pickers');
    assert.equal(await page.locator('#pattern-custom-colour').count(), 0, 'legacy free-standing custom picker still present');

    const sizes = await page.evaluate(() => ({
      body: getComputedStyle(document.body, '::before').backgroundSize,
      preview: getComputedStyle(document.querySelector('.pattern-repeat-preview')).backgroundSize
    }));
    assert.equal(sizes.body, '128px 128px');
    assert.equal(sizes.preview, '128px 128px');

    const before = await page.evaluate(() => ({
      image: getComputedStyle(document.documentElement).getPropertyValue('--sophie-pattern-image'),
      state: window.SophieStyleLab.getState(),
      brand: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()
    }));
    assertSlots(before.state.cells);
    assert.equal(before.state.palette.length, 6);

    await page.locator('[data-pattern-slot-picker="4"]').evaluate(input => {
      input.focus();
      input.value = '#00aa44';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const changed = await page.evaluate(() => ({
      image: getComputedStyle(document.documentElement).getPropertyValue('--sophie-pattern-image'),
      brand: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim(),
      state: window.SophieStyleLab.getState()
    }));
    assert.equal(changed.brand, '#00aa44');
    assert.notEqual(changed.image, before.image, 'changing slot 4 did not recolour existing slot-4 pixels');
    assertSlots(changed.state.cells);
    assert(changed.state.cells.includes(4), 'default pattern no longer demonstrates slot 4 recolouring');

    await page.fill('#pattern-name', 'Green test look');
    await page.click('[data-pattern-save]');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sophie_style_saved_looks_v2')));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].palette.length, 6);
    assert.equal(saved[0].palette[3], '#00aa44');
    assertSlots(saved[0].cells);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.click('[data-open-pattern-studio]');
    assert.equal(await page.locator('.saved-pattern-swatch').count(), 1);
    const thumb = await page.locator('.saved-pattern-swatch').evaluate(el => getComputedStyle(el).backgroundImage);
    assert(thumb.includes('data:image/png;base64,'), 'saved thumbnail blank after reload');
    assert.equal(await page.locator('.saved-look-palette span').count(), 6, 'Saved Look does not show all six colours');
    await page.click('[data-pattern-load]');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()), '#00aa44', 'loading Saved Look did not restore app palette');
    await page.click('[data-pattern-use]');
    const active = await page.evaluate(() => JSON.parse(localStorage.getItem('sophie_style_look_v2')));
    assert.equal(active.version, 2);
    assert.equal(active.palette[3], '#00aa44');
    assertSlots(active.cells);
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()), '#00aa44', 'active look did not survive reload');

    // Readability fallback remains safe even if Sophie chooses unusable text/card colours.
    await page.click('[data-open-pattern-studio]');
    for (const slot of [2, 3]) {
      await page.locator(`[data-pattern-slot-picker="${slot}"]`).evaluate(input => {
        input.focus(); input.value = '#ffffff';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    const contrast = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return window.SophieStyleLab.contrastRatio(root.getPropertyValue('--ink').trim(), root.getPropertyValue('--surface').trim());
    });
    assert(contrast >= 4.5, `safe contrast failed: ${contrast}`);
    console.log('SIX_COLOUR_SAVED_LOOKS_OK');
    await context.close();
  }

  // Legacy v1 data migrates to v2 while legacy keys remain for rollback.
  {
    const legacyCells = Array(1024).fill(null);
    legacyCells[0] = '#3f57ff';
    legacyCells[1] = '#f5ee38';
    legacyCells[2] = '#ff6962';
    const legacySaved = [{ id: 'old-look', name: 'Old pattern', cells: legacyCells }];
    const init = `localStorage.setItem('sophie_style_pattern_v1', ${JSON.stringify(JSON.stringify(legacyCells))}); localStorage.setItem('sophie_style_saved_patterns_v1', ${JSON.stringify(JSON.stringify(legacySaved))});`;
    const { context, page } = await pageFor(HEAD, { init });
    const migrated = await page.evaluate(() => ({
      active: JSON.parse(localStorage.getItem('sophie_style_look_v2')),
      saved: JSON.parse(localStorage.getItem('sophie_style_saved_looks_v2')),
      oldActive: localStorage.getItem('sophie_style_pattern_v1'),
      oldSaved: localStorage.getItem('sophie_style_saved_patterns_v1')
    }));
    assert.equal(migrated.active.palette.length, 6);
    assert.equal(migrated.active.cells[0], 4);
    assert.equal(migrated.active.cells[1], 5);
    assert.equal(migrated.active.cells[2], 6);
    assert.equal(migrated.saved[0].cells[0], 4);
    assert(migrated.oldActive && migrated.oldSaved, 'legacy rollback keys were removed');
    console.log('LEGACY_MIGRATION_OK');
    await context.close();
  }

  // Compact phones stay single-column and normal-sized even in the wide-layout physical Android failure state.
  for (const [width, height] of [[360, 800], [390, 844], [412, 915]]) {
    const { context, page } = await pageFor(HEAD, { viewport: { width, height }, screen: { width, height }, isMobile: true, hasTouch: true });
    const g = await page.evaluate(() => {
      const grid = document.querySelector('.home-os-grid').getBoundingClientRect();
      const main = document.querySelector('.home-main-column').getBoundingClientRect();
      const side = document.querySelector('.home-side-stack').getBoundingClientRect();
      return {
        compact: document.documentElement.classList.contains('compact-device'),
        rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
        gridWidth: grid.width,
        mainWidth: main.width,
        sideWidth: side.width,
        mainBottom: main.bottom,
        sideTop: side.top,
        sidePosition: getComputedStyle(document.querySelector('.home-side-stack')).position,
        scrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth,
        wrap: getComputedStyle(document.querySelector('.home-destination strong')).whiteSpace
      };
    });
    assert.equal(g.compact, true);
    assert(Math.abs(g.gridWidth - g.mainWidth) < 2 && Math.abs(g.gridWidth - g.sideWidth) < 2, `${width}: Home compressed`);
    assert(g.sideTop >= g.mainBottom - 2, `${width}: side content beside main`);
    assert.equal(g.sidePosition, 'static');
    assert(g.rootFont <= 18, `${width}: root text scale unexpectedly ${g.rootFont}px`);
    assert.equal(g.wrap, 'normal');
    assert(g.scrollWidth <= g.innerWidth + 2, `${width}: horizontal overflow`);
    await context.close();
  }
  console.log('COMPACT_PHONE_WRAP_OK');

  {
    const { context, page } = await pageFor(HEAD, { viewport: { width: 980, height: 1400 }, screen: { width: 980, height: 1400 } });
    const result = await page.evaluate(() => {
      const root = document.documentElement;
      root.classList.add('compact-device', 'effective-mobile-scale');
      root.style.fontSize = '43px';
      const grid = document.querySelector('.home-os-grid').getBoundingClientRect();
      const main = document.querySelector('.home-main-column').getBoundingClientRect();
      const side = document.querySelector('.home-side-stack').getBoundingClientRect();
      return {
        font: parseFloat(getComputedStyle(root).fontSize),
        grid: grid.width,
        main: main.width,
        side: side.width,
        sideTop: side.top,
        mainBottom: main.bottom,
        position: getComputedStyle(document.querySelector('.home-side-stack')).position,
        scrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth
      };
    });
    assert(result.font <= 18, `hostile compact root font still oversized: ${result.font}`);
    assert(Math.abs(result.grid - result.main) < 2 && Math.abs(result.grid - result.side) < 2);
    assert(result.sideTop >= result.mainBottom - 2);
    assert.equal(result.position, 'static');
    assert(result.scrollWidth <= result.innerWidth + 2);
    console.log('HOSTILE_ANDROID_SCALE_OK');
    await context.close();
  }

  // Desktop Home geometry stays unchanged against current production main.
  async function desktopGeometry(url) {
    const { context, page } = await pageFor(url, { viewport: { width: 1280, height: 1000 }, screen: { width: 1280, height: 1000 } });
    const result = await page.evaluate(() => {
      const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return [r.x, r.y, r.width, r.height];
      };
      return {
        grid: rect('.home-os-grid'), main: rect('.home-main-column'), side: rect('.home-side-stack'),
        position: getComputedStyle(document.querySelector('.home-side-stack')).position,
        columns: getComputedStyle(document.querySelector('.home-os-grid')).gridTemplateColumns
      };
    });
    await context.close();
    return result;
  }
  const base = await desktopGeometry(BASE);
  const head = await desktopGeometry(HEAD);
  assert.equal(head.position, base.position);
  assert.equal(head.columns, base.columns);
  for (const key of ['grid', 'main', 'side']) {
    head[key].forEach((value, i) => assert(Math.abs(value - base[key][i]) <= 1, `desktop ${key}[${i}] changed`));
  }
  console.log('DESKTOP_LAYOUT_UNCHANGED_OK');

  await browser.close();
  console.log('ALL_V292_SAVED_LOOKS_GATES_OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
