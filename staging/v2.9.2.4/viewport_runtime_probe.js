const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<meta name="viewport"[^>]*>\s*<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('early viewport bootstrap not found');
const script = match[1];

function runCase(name, { width, height, dpr, innerWidth, touch = true, coarse = true }) {
  const viewport = { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' };
  const classes = {};
  const root = {
    dataset: {},
    classList: {
      toggle(key, value) { classes[key] = Boolean(value); }
    }
  };
  const sandbox = {
    console,
    navigator: { maxTouchPoints: touch ? 5 : 0 },
    window: {
      screen: { width, height },
      devicePixelRatio: dpr,
      innerWidth,
      matchMedia() { return { matches: coarse }; },
      addEventListener() {}
    },
    document: {
      documentElement: root,
      currentScript: {},
      head: { insertBefore() {} },
      querySelector(selector) {
        return selector === 'meta[name="viewport"]' ? viewport : null;
      },
      createElement() { return { name: '', content: '' }; }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: 'viewport-bootstrap.js' });
  return { name, viewport: viewport.content, classes, dataset: root.dataset };
}

const portrait = runCase('SM-S911B physical portrait', {
  width: 1080,
  height: 2340,
  dpr: 2.625,
  innerWidth: 980
});
if (!portrait.classes['compact-device']) throw new Error('physical portrait was not classified compact');
if (!/^width=411, /.test(portrait.viewport)) throw new Error(`expected width=411 viewport, got ${portrait.viewport}`);
if (portrait.dataset.phoneCssWidth !== '411') throw new Error(`expected phoneCssWidth=411, got ${portrait.dataset.phoneCssWidth}`);
if (portrait.dataset.physicalPixelScreen !== 'true') throw new Error('physical-pixel marker missing');
console.log(`PASS: ${portrait.name} repairs 980px layout to ${portrait.dataset.phoneCssWidth}px CSS viewport`);

const cssPhone = runCase('normal CSS-pixel phone', {
  width: 412,
  height: 915,
  dpr: 2.625,
  innerWidth: 412
});
if (!cssPhone.classes['compact-device']) throw new Error('CSS-pixel phone was not classified compact');
if (cssPhone.viewport !== 'width=device-width, initial-scale=1, viewport-fit=cover') throw new Error('normal CSS phone should keep standard viewport');
console.log('PASS: normal 412px CSS phone keeps standard device-width viewport');

const desktop = runCase('desktop', {
  width: 1280,
  height: 900,
  dpr: 1,
  innerWidth: 1280,
  touch: false,
  coarse: false
});
if (desktop.classes['compact-device']) throw new Error('desktop incorrectly classified compact');
if (desktop.viewport !== 'width=device-width, initial-scale=1, viewport-fit=cover') throw new Error('desktop viewport changed');
console.log('PASS: desktop viewport and classification remain unchanged');
