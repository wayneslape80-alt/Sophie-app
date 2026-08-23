from pathlib import Path

html = r'''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>if (innerWidth < 600) document.documentElement.classList.add('compact-device');</script>
<link rel="stylesheet" href="./assets/android-first.css">
<link rel="stylesheet" href="./assets/concept-a.css">
<style>
html,body{margin:0}.app-shell{width:min(100%,1120px);margin:0 auto;padding:16px 18px 100px}.progress{height:9px;background:#ddd}.progress>span{display:block;width:57%;height:100%;background:#3f57ff}.goal-meta{display:flex;justify-content:space-between}.bottom-nav{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:grid;grid-template-columns:repeat(4,1fr);width:min(520px,calc(100% - 24px));padding:6px}.nav-button{border:0;background:transparent}.test-product{background:linear-gradient(135deg,#f5ee38,#ff6962)}
</style>
</head>
<body>
<main class="app-shell"><section id="view-home"><div class="home-os-grid"><section>
<div class="home-goal-head"><div><span class="home-os-label">CURRENT GOAL</span><h2>Make today yours.</h2></div></div>
<div id="active-goal"><article class="home-goal-card">
<div class="home-goal-copy"><span class="home-os-label">PINNED GOAL</span><h3>Vinyl starter set</h3><p class="home-goal-amount"><strong>$184</strong> of $320</p><div class="progress"><span></span></div><div class="goal-meta"><span>58%</span><span>$136 to go</span></div></div>
<div class="home-goal-visual"><img class="home-goal-emblem" src="./assets/surreal-os-emblem.png" alt="Colourful goal emblem"><div class="home-goal-product test-product" role="img" aria-label="Product image"></div></div>
</article></div></section>
<div class="home-destinations"><button class="home-destination"><span class="home-destination-icon">S</span><span><strong>Skills</strong><small>Build capability</small></span><span>›</span></button><button class="home-destination"><span class="home-destination-icon">S</span><span><strong>School</strong><small>Stay organised</small></span><span>›</span></button><button class="home-destination"><span class="home-destination-icon">C</span><span><strong>Contribute</strong><small>Family life</small></span><span>›</span></button><button class="home-destination"><span class="home-destination-icon">E</span><span><strong>Earn</strong><small>Extra work</small></span><span>›</span></button></div>
</div></section></main>
<nav class="bottom-nav"><button class="nav-button">Home</button><button class="nav-button">Goals</button><button class="nav-button">Activity</button><button class="nav-button">Me</button></nav>
<pre id="result" style="position:absolute;left:-9999px"></pre>
<script>
(() => {
 const emblem=document.querySelector('.home-goal-emblem').getBoundingClientRect();
 const product=document.querySelector('.home-goal-product').getBoundingClientRect();
 const overlap=!(emblem.right <= product.left || product.right <= emblem.left || emblem.bottom <= product.top || product.bottom <= emblem.top);
 const cols=getComputedStyle(document.querySelector('.home-destinations')).gridTemplateColumns.split(' ').filter(Boolean).length;
 const compact=innerWidth < 600;
 const ep=getComputedStyle(document.querySelector('.home-goal-emblem')).position;
 const pp=getComputedStyle(document.querySelector('.home-goal-product')).position;
 const pass = compact ? (!overlap && ep==='static' && pp==='static' && cols===1) : (ep==='absolute' && pp==='absolute' && cols===2);
 document.getElementById('result').textContent=(pass?'PASS':'FAIL')+`:w=${innerWidth};overlap=${overlap};emblem=${ep};product=${pp};cols=${cols}`;
 document.documentElement.dataset.probe=pass?'pass':'fail';
})();
</script>
</body></html>'''
Path('v2924-layout-probe.html').write_text(html, encoding='utf-8')
print('v2924-layout-probe.html')
