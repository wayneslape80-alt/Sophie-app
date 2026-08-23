const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const URL = 'http://127.0.0.1:4173/index.html';

  async function inspect({ viewport, screen, isMobile = false, hasTouch = false }) {
    const context = await browser.newContext({ viewport, screen, isMobile, hasTouch, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.route('https://script.google.com/**', route => route.abort());
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const avatar = document.querySelector('.avatar-button')?.getBoundingClientRect();
      const topbar = document.querySelector('.topbar')?.getBoundingClientRect();
      const grid = document.querySelector('.home-os-grid')?.getBoundingClientRect();
      const main = document.querySelector('.home-main-column')?.getBoundingClientRect();
      return {
        compact: document.documentElement.classList.contains('compact-device'),
        rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
        width: innerWidth,
        avatar: avatar && { left: avatar.left, right: avatar.right, width: avatar.width },
        topbar: topbar && { left: topbar.left, right: topbar.right, width: topbar.width },
        grid: grid && { left: grid.left, width: grid.width },
        main: main && { left: main.left, width: main.width },
        overflow: document.documentElement.scrollWidth - innerWidth,
        colours: document.querySelectorAll('[data-pattern-slot-picker]').length,
        patternSize: getComputedStyle(document.body, '::before').backgroundSize
      };
    });
    await context.close();
    return result;
  }

  const widePhone = await inspect({
    viewport: { width: 980, height: 1400 },
    screen: { width: 1080, height: 2340 },
    isMobile: true,
    hasTouch: true
  });
  assert.equal(widePhone.compact, true, '1080x2340 touch phone must be compact');
  assert(widePhone.rootPx >= 21.5 && widePhone.rootPx <= 22.5, `wide phone root ${widePhone.rootPx}px`);
  assert(widePhone.avatar && widePhone.avatar.right <= widePhone.width - 20, `avatar right clearance ${widePhone.width - widePhone.avatar.right}px`);
  assert(widePhone.grid && widePhone.main && Math.abs(widePhone.grid.width - widePhone.main.width) <= 2, 'wide phone Home main must remain full-width');
  assert(widePhone.overflow <= 2, `wide phone horizontal overflow ${widePhone.overflow}`);
  assert.equal(widePhone.colours, 6, 'Pattern Studio must still expose six colour pickers');
  assert(widePhone.patternSize.includes('128px'), `pattern repeat must remain 128px: ${widePhone.patternSize}`);
  console.log('WIDE_ANDROID_PHONE_OK', JSON.stringify(widePhone));

  for (const [width, height] of [[360,800],[390,844],[412,915]]) {
    const phone = await inspect({ viewport:{width,height}, screen:{width,height}, isMobile:true, hasTouch:true });
    assert.equal(phone.compact, true, `${width}px phone must be compact`);
    assert(phone.rootPx >= 21.5 && phone.rootPx <= 22.5, `${width}px root ${phone.rootPx}px`);
    assert(phone.avatar && phone.avatar.right <= phone.width - 20, `${width}px avatar clearance ${phone.width - phone.avatar.right}px`);
    assert(phone.overflow <= 2, `${width}px overflow ${phone.overflow}`);
    console.log(`PHONE_${width}_OK`, JSON.stringify(phone));
  }

  const desktop = await inspect({ viewport:{width:1280,height:1000}, screen:{width:1280,height:1000}, isMobile:false, hasTouch:false });
  assert.equal(desktop.compact, false, 'desktop must not be compact');
  assert(desktop.rootPx >= 15.5 && desktop.rootPx <= 16.5, `desktop root changed: ${desktop.rootPx}px`);
  assert(desktop.overflow <= 2, `desktop overflow ${desktop.overflow}`);
  console.log('DESKTOP_UNCHANGED_OK', JSON.stringify(desktop));

  await browser.close();
  console.log('ALL_V2923_ANDROID_READABILITY_GATES_OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
