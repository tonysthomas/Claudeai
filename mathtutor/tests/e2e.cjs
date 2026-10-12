// End-to-end smoke test (iPad-sized). Needs a server: `npx http-server -p 8765 .` from the repo root.
// Run: NODE_PATH=$(npm root -g) node mathtutor/tests/e2e.cjs [outDir]
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/mathtutor/';
const OUT = process.argv[2] || '/tmp/mb-shots';
const fs = require('fs'); fs.mkdirSync(OUT, { recursive: true });

(async () => {
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
const click = (sel) => page.locator(sel).first().click();

async function answer(correct = true) {
  const q = await page.evaluate(() => { const s = window.MB.S; return s && s.q ? { kind: s.q.answer.kind, correct: s.q.answer.correct, n: s.q.answer.options && s.q.answer.options.length } : null; });
  if (!q) return false;
  if (q.kind === 'choice') { const i = correct ? q.correct : (q.correct + 1) % q.n; await click(`[data-act="choose"][data-i="${i}"]`); return true; }
  const val = await page.evaluate((ok) => { const s = window.MB.S; const a = s.q.answer; const c = window.MTEngine.canonicalInput(s.q); return ok ? String(c) : (a.kind === 'text' ? '00:00' : '9999'); }, correct);
  for (const ch of val) { const k = ch === '-' ? '−' : ch; await click(`[data-key="${k === ' ' ? ' ' : k}"]`); }
  await click('[data-act="submit"]');
  return true;
}
async function playThrough(maxQ = 40, wrongFirst = false) {
  for (let i = 0; i < maxQ; i++) {
    const v = await page.evaluate(() => window.MB.S && document.querySelector('.play') ? 'play' : 'other');
    if (v !== 'play') break;
    const phase = await page.evaluate(() => window.MB.S.phase);
    if (phase === 'reveal') { await click('[data-act="next"]'); continue; }
    if (phase !== 'ask') { await page.waitForTimeout(300); continue; }
    await answer(!(wrongFirst && i === 0));
    await page.waitForTimeout(wrongFirst && i === 0 ? 100 : 1250);
  }
}

await page.goto(URL);
await page.waitForSelector('.kidcard');
await shot('01-home');

// Evangeline: mission warm-up with a wrong first answer (hint flow)
await click('[data-act="kid"][data-id="evangeline"]');
await shot('02-evangeline-home');
await click('[data-act="part"][data-i="0"]');
await page.waitForSelector('.play');
await shot('03-question');
await answer(false); await page.waitForTimeout(200);
await shot('04-wrong-hint');
await answer(false); await page.waitForTimeout(200);
await shot('05-reveal');
await click('[data-act="next"]');
await playThrough(30);
await page.waitForSelector('.summary');
await shot('06-summary');
await click('.summary [data-act="kid"]');

// Subtraction across zero: get the worked method
await click('[data-act="topic"][data-id="y4-sub"]');
await shot('07-topic');
await click('[data-act="practise"][data-skill="sub4-zero"]');
await click('[data-act="showme"]');
await shot('08-sub-worked');
await click('[data-act="next"]');
await playThrough(20);
await click('.summary [data-act="kid"]');

// Division worked method (bus stop)
await click('[data-act="topic"][data-id="y4-div"]');
await click('[data-act="practise"][data-skill="div4-3d"]');
await click('[data-act="showme"]');
await shot('09-busstop');
await click('[data-act="quit"]'); page.once('dialog', (d) => d.accept());
await page.waitForTimeout(300);
await page.evaluate(() => { if (window.MB.S && document.querySelector('.play')) { /* confirm handled */ } });

// Times Tables Check challenge (shortened)
await page.goto(URL); await click('[data-act="kid"][data-id="evangeline"]');
await click('[data-act="challenge"][data-id="mtc"]');
await page.waitForSelector('.play');
await shot('10-mtc');
await playThrough(30);
await page.waitForSelector('.summary', { timeout: 60000 });
await shot('11-mtc-summary');

// Jaden: long division + reasoning
await page.goto(URL); await click('[data-act="kid"][data-id="jaden"]');
await shot('12-jaden-home');
await click('[data-act="topic"][data-id="y6-div"]');
await click('[data-act="practise"][data-skill="div6-long"]');
await click('[data-act="showme"]');
await shot('13-longdiv');
await page.goto(URL); await click('[data-act="kid"][data-id="jaden"]');
await click('[data-act="topic"][data-id="y6-fmp"]');
await click('[data-act="check"]');
await playThrough(20);
await page.waitForSelector('.summary');
await shot('14-check-summary');
await page.goto(URL); await click('[data-act="kid"][data-id="jaden"]');
await click('[data-act="challenge"][data-id="cat4"]');
await shot('15-cat4');
await playThrough(15);

// Parent area
await page.goto(URL);
await click('[data-act="parent"]');
for (const d of '12341234') await click(`[data-pin="${d}"]`);
await page.waitForSelector('.parent');
await shot('20-parent-overview');
await click('[data-act="ptab"][data-id="plan"]'); await shot('21-plan');
await click('[data-act="ptab"][data-id="teach"]'); await shot('22-teach');
await click('[data-act="pkid"][data-id="evangeline"]'); await shot('23-teach-evangeline');
await click('[data-act="ptab"][data-id="reports"]'); await shot('24-report-daily');
await click('[data-act="rkind"][data-id="weekly"]'); await shot('25-report-weekly');
await click('[data-act="rkind"][data-id="heatmap"]'); await shot('26-heatmap');
await page.emulateMedia({ media: 'print' }); await shot('27-heatmap-print'); await page.emulateMedia({ media: 'screen' });
await click('[data-act="ptab"][data-id="settings"]'); await shot('28-settings');

// iPad portrait
await page.setViewportSize({ width: 820, height: 1180 });
await page.goto(URL); await click('[data-act="kid"][data-id="jaden"]');
await click('[data-act="part"][data-i="1"]');
await shot('30-portrait-question');

console.log('sessions:', await page.evaluate(() => window.MB.DB.sessions.length), 'log:', await page.evaluate(() => window.MB.DB.log.length));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No page errors');
await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
