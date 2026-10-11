// Run: node mathtutor/tests/engine.test.js
// Generates many questions for every small step and checks that each one is well-formed
// and that the engine accepts its own correct answer (and rejects an obviously wrong one).
const assert = require('assert');
const E = require('../engine.js');
require('../topics-y4.js');
require('../topics-y6.js');

const N = +process.env.N || 400;
let total = 0;
const bad = (q, msg) => { throw new Error(`${q.topic}/${q.skill}: ${msg}\n${JSON.stringify(q, null, 1).slice(0, 900)}`); };

for (const t of Object.values(E.TOPICS)) {
  assert(t.skills.length, t.id + ' has no skills');
  for (const s of t.skills) {
    for (let i = 0; i < N; i++) {
      const q = E.generate(t.id, s.id, { weakTags: ['7', '8'] });
      total++;
      if (!q.prompt || /undefined|NaN|Infinity|\[object/.test(q.prompt + q.steps + q.visual + q.hints.join())) bad(q, 'bad text');
      if (q.hints.length < 2) bad(q, 'needs 2 hints');
      if (!q.steps) bad(q, 'no worked steps');
      const a = q.answer;
      if (a.kind === 'choice') {
        if (a.options.length < 2) bad(q, 'too few options');
        if (new Set(a.options).size !== a.options.length) bad(q, 'duplicate options');
        if (a.correct < 0 || a.correct >= a.options.length) bad(q, 'correct index out of range');
      } else if (a.kind === 'num') {
        if (!Number.isFinite(a.value)) bad(q, 'non-finite answer');
        if (a.value < 0 && !q.keys.includes('−')) bad(q, 'negative answer without minus key');
        if (!Number.isInteger(a.value) && !q.keys.includes('.')) bad(q, 'decimal answer without point key');
      } else if (a.kind === 'rem') {
        if (!(a.r > 0) || !q.keys.includes('r')) bad(q, 'rem answer needs r>0 and r key');
      } else if (a.kind === 'frac') {
        if (!(a.d > 0) || !Number.isInteger(a.n) || !Number.isInteger(a.d)) bad(q, 'bad fraction');
      }
      const input = E.canonicalInput(q);
      if (!E.check(q, input)) bad(q, `rejects its own answer "${input}"`);
      if (a.kind === 'choice') { if (E.check(q, (a.correct + 1) % a.options.length)) bad(q, 'accepts wrong choice'); }
      else if (a.kind === 'num' && E.check(q, String(a.value + 1))) bad(q, 'accepts wrong number');
    }
  }
}

// Spot checks on the checker
const q = (answer) => ({ answer, keys: [] });
assert(E.check(q({ kind: 'num', value: 1234 }), '1,234'));
assert(E.check(q({ kind: 'num', value: -5 }), '−5'));
assert(E.check(q({ kind: 'num', value: 0.25 }), '.25'));
assert(!E.check(q({ kind: 'num', value: 3 }), ''));
assert(E.check(q({ kind: 'rem', q: 9, r: 2 }), '9 r 2'));
assert(E.check(q({ kind: 'rem', q: 9, r: 2 }), '9r2'));
assert(!E.check(q({ kind: 'rem', q: 9, r: 2 }), '9'));
assert(E.check(q({ kind: 'frac', n: 6, d: 8 }), '3/4'));
assert(E.check(q({ kind: 'frac', n: 6, d: 8 }), '6/8'));
assert(!E.check(q({ kind: 'frac', n: 6, d: 8, simplest: true }), '6/8'));
assert(E.check(q({ kind: 'frac', n: 49, d: 4, simplest: true }), '12 1/4'));
assert(E.check(q({ kind: 'frac', n: 49, d: 4, simplest: true }), '49/4'));
assert(!E.check(q({ kind: 'frac', n: 49, d: 4, simplest: true }), '12 2/8'));
assert(E.check(q({ kind: 'frac', n: 4, d: 2 }), '2'));
assert(E.check(q({ kind: 'text', value: '15:45' }), '15:45'));

// Worked-method correctness
const { colSub, busStop, longDiv, colAdd } = E.H;
for (let i = 0; i < 2000; i++) {
  const a = Math.floor(Math.random() * 9000) + 1000, b = Math.floor(Math.random() * a);
  const plain = colSub(a, b).html.replace(/<s>\d<\/s>|<sup[^>]*>1<\/sup>|<span class="exch">.*?<\/span>/g, '');
  const ans = plain.match(/<tr class="ans">(.*?)<\/tr>/)[1].replace(/<[^>]+>/g, '');
  assert.strictEqual(+ans, a - b, `colSub ${a}-${b}`);
  const s = colAdd(a, b).html.match(/<tr class="ans">(.*?)<\/tr>/)[1].replace(/<[^>]+>/g, '');
  assert.strictEqual(+s, a + b, `colAdd ${a}+${b}`);
  const d = Math.floor(Math.random() * 8) + 2;
  assert.strictEqual(busStop(a, d).q, Math.floor(a / d));
  const d2 = Math.floor(Math.random() * 40) + 11;
  const ld = longDiv(a, d2);
  const top = ld.html.match(/<tr><td><\/td>(.*?)<\/tr>/)[1].replace(/<[^>]+>/g, '');
  assert.strictEqual(+top, Math.floor(a / d2), `longDiv ${a}/${d2}`);
}

console.log(`OK — ${Object.keys(E.TOPICS).length} topics, ${Object.values(E.TOPICS).reduce((n, t) => n + t.skills.length, 0)} small steps, ${total} questions checked.`);

// Curriculum map and lesson guides point at real topics and small steps
const Cur = require('../curriculum.js');
for (const [year, terms] of Object.entries(Cur.CALENDAR)) for (const blocks of Object.values(terms)) for (const b of blocks)
  for (const tid of b.topics) assert(E.TOPICS[tid] && E.TOPICS[tid].year === +year, `calendar Y${year} ${b.block} → ${tid}`);
for (const t of Object.values(E.TOPICS)) {
  const g = Cur.LESSONS[t.id]; assert(g, 'missing lesson guide for ' + t.id);
  assert(t.skills.some((s) => s.id === g.example) || t.id.endsWith('cat4'), `guide example ${g.example} not in ${t.id}`);
}
console.log('OK — curriculum map and lesson guides consistent.');
