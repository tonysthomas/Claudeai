/* Year 6 small steps (White Rose / Power Maths order). */
(function () {
'use strict';
const E = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : window.MTEngine;
const { R, pick, shuffle, gcd, lcm, rnd, fmt, frac, fracHTML, cap, choice, num, yesNo, PV, PV1,
  pvChart, colAdd, colSub, colMul, longMul, busStop, longDiv, fracBar, barModel, numberLine, rectShape, triShape, cuboid, machine, stepsList } = E.H;
const blank = '<span class="blank">?</span>';
const digitsAt = (n) => String(n).split('').reverse().map(Number);

/* ---------- number → words (UK) ---------- */
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const u100 = (x) => x < 20 ? ONES[x] : TENS[Math.floor(x / 10)] + (x % 10 ? '-' + ONES[x % 10] : '');
const u1000 = (x) => { const h = Math.floor(x / 100), r = x % 100; return [h ? ONES[h] + ' hundred' : '', r ? (h ? 'and ' : '') + u100(r) : ''].filter(Boolean).join(' '); };
function words(n) {
  const m = Math.floor(n / 1e6), th = Math.floor(n % 1e6 / 1000), rest = n % 1000;
  const parts = [];
  if (m) parts.push(u1000(m) + ' million');
  if (th) parts.push(u1000(th) + ' thousand');
  if (rest) parts.push((rest < 100 && parts.length ? 'and ' : '') + u1000(rest));
  return parts.join(', ').replace(/, and /, ' and ');
}

/* =====================================================================
   PLACE VALUE to 10,000,000 (focus area for Jaden)
   ===================================================================== */
const pv = { id: 'y6-pv', year: 6, title: 'Place value', emoji: '🔢', skills: [
  { id: 'pv6-value', title: 'Value of digits up to 10,000,000', gen() {
    let ds; do { ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 7); } while (ds[0] === 0);
    const n = +ds.join(''), ok = digitsAt(n).map((d, i) => d && i >= 2 ? i : -1).filter((i) => i >= 0), p = pick(ok), d = digitsAt(n)[p];
    return { prompt: `What is the value of the <b>${d}</b> in <b>${fmt(n)}</b>?`, answer: num(d * 10 ** p),
      hints: [`Put ${fmt(n)} in a place value chart. The commas split millions, thousands and ones.`, `The ${d} is in the ${PV[p]} column.`],
      steps: pvChart(n, { highlight: p }) + stepsList([`The ${d} is in the ${PV[p]} column.`, `${d} ${PV[p]} = ${fmt(d * 10 ** p)}.`]) };
  } },
  { id: 'pv6-words', title: 'Read and write numbers to 10,000,000', gen() {
    const pat = pick(['x0x0x0x', 'xx0x00x', 'x00x0xx', 'x0xx00x', 'xx00x0x', 'x0x00xx']);
    const s = pat.split('').map((c, i) => c === '0' ? '0' : String(i === 0 ? R(1, 9) : R(1, 9)));
    const n = +s.join('');
    const variants = [];
    for (let k = 0; k < 6; k++) { const t = s.slice(); const i = R(1, 6), j = R(1, 6); if (t[i] !== t[j]) { [t[i], t[j]] = [t[j], t[i]]; variants.push(+t.join('')); } }
    variants.push(Math.floor(n / 10), n * 10 > 9999999 ? n + 1e5 : n * 10);
    return { prompt: `Which number is <i>“${words(n)}”</i>?`, answer: choice(n, variants.filter((x) => x !== n && x >= 1e5)),
      hints: ['Write each part in its own group: millions, then thousands, then hundreds-tens-ones.', 'Every group after millions needs 3 digits — use 0 as a place holder.'],
      steps: pvChart(n) + stepsList([`Millions: ${Math.floor(n / 1e6)}`, `Thousands: ${String(Math.floor(n % 1e6 / 1000)).padStart(3, '0')}`, `Ones: ${String(n % 1000).padStart(3, '0')}`, `So it's ${fmt(n)}.`]) };
  } },
  { id: 'pv6-more', title: '10, 100, 1,000 … 1,000,000 more or less', gen() {
    const p = R(1, 6), step = 10 ** p, more = Math.random() < 0.5;
    let n = R(1000000, 8999999);
    if (Math.random() < 0.5 && p < 6) { const d = String(n).split(''); d[6 - p] = more ? '9' : '0'; n = +d.join(''); }
    if (!more && n - step < 0) n += step;
    const ans = more ? n + step : n - step;
    return { prompt: `What is <b>${fmt(step)} ${more ? 'more' : 'less'}</b> than <b>${fmt(n)}</b>?`, answer: num(ans),
      hints: [`${fmt(step)} changes the ${PV[p]} digit.`, `If that digit is ${more ? '9' : '0'}, you must exchange with the column to its left.`],
      steps: pvChart(n, { highlight: p }) + stepsList([`${fmt(n)} ${more ? '+' : '−'} ${fmt(step)} = ${fmt(ans)}.`]) };
  } },
  { id: 'pv6-round', title: 'Round any number', gen() {
    const to = pick([1000, 10000, 100000, 1000000]); let n; do { n = R(1000000, 9899999); } while (n % to === 0);
    const lo = Math.floor(n / to) * to, hi = lo + to, ans = n - lo >= to / 2 ? hi : lo, p = Math.log10(to);
    return { prompt: `Round <b>${fmt(n)}</b> to the nearest <b>${fmt(to)}</b>.`, answer: num(ans),
      hints: [`Which two multiples of ${fmt(to)} is it between? ${fmt(lo)} and ${fmt(hi)}.`, `Look at the digit in the ${PV[p - 1]} column: 5 or more rounds up.`],
      steps: numberLine(lo, hi, n) + stepsList([`Between ${fmt(lo)} and ${fmt(hi)}; halfway is ${fmt(lo + to / 2)}.`, `The ${PV[p - 1]} digit is ${digitsAt(n)[p - 1]} → ${ans === hi ? 'round up' : 'round down'} to ${fmt(ans)}.`]) };
  } },
  { id: 'pv6-compare', title: 'Compare and order numbers', gen() {
    const base = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 7); const set = new Set([+base.join('')]);
    while (set.size < 4) { const t = base.slice(); const i = R(1, 6), j = R(1, 6); [t[i], t[j]] = [t[j], t[i]]; if (Math.random() < 0.25) t.pop(); set.add(+t.join('')); }
    const arr = [...set], big = Math.random() < 0.5, ans = big ? Math.max(...arr) : Math.min(...arr);
    return { prompt: `Which number is the <b>${big ? 'greatest' : 'smallest'}</b>?`, answer: choice(ans, arr.filter((x) => x !== ans)),
      hints: ['First count the digits — more digits means a bigger number.', 'Same number of digits? Compare from the left, column by column.'],
      steps: stepsList(['Check how many digits each number has.', 'Then compare millions, hundred thousands, ten thousands …', `The ${big ? 'greatest' : 'smallest'} is ${fmt(ans)}.`]) };
  } },
  { id: 'pv6-neg', title: 'Negative numbers in context', gen() {
    const r = R(0, 2);
    if (r === 0) { const lo = -R(2, 12), hi = R(2, 15);
      return { prompt: `At night it was <b>${fmt(lo)}°C</b>. In the day it was <b>${hi}°C</b>. How many degrees warmer was the day?`, answer: num(hi - lo),
        hints: ['Use a number line. Count from the night temperature up to 0, then on to the day temperature.', `${fmt(lo)} to 0 is ${-lo}. 0 to ${hi} is ${hi}.`],
        steps: stepsList([`${fmt(lo)} → 0 is ${-lo} degrees.`, `0 → ${hi} is ${hi} degrees.`, `${-lo} + ${hi} = ${hi - lo} degrees.`]) }; }
    if (r === 1) { const a = -R(2, 9), b = R(2, 12), ans = a - b;
      return { prompt: `${fmt(a)} − ${b} = ${blank}`, answer: num(ans), keys: ['−'],
        hints: ['Taking away moves you left on the number line — further below zero.', `Start at ${fmt(a)} and count back ${b}.`],
        steps: stepsList([`Start at ${fmt(a)}, jump back ${b}.`, `You land on ${fmt(ans)}.`]) }; }
    const a = -R(3, 15), b = R(2, 20), ans = a + b;
    return { prompt: `${fmt(a)} + ${b} = ${blank}`, answer: num(ans), keys: ['−'],
      hints: ['Adding moves you right on the number line.', `From ${fmt(a)} it takes ${-a} to reach 0.`],
      steps: stepsList([`${fmt(a)} + ${-a} = 0.`, `${b} − ${-a} = ${ans} more ${ans < 0 ? '(still below zero)' : ''}.`, `Answer: ${fmt(ans)}.`]) };
  } }
] };

/* =====================================================================
   ADDITION & SUBTRACTION
   ===================================================================== */
const as = { id: 'y6-addsub', year: 6, title: 'Add & subtract', emoji: '➕', skills: [
  { id: 'as6-add', title: 'Add large numbers (column method)', gen() {
    const a = R(10000, 999999), b = R(1000, 499999), w = colAdd(a, b);
    return { prompt: `${fmt(a)} + ${fmt(b)} = ${blank}`, answer: num(a + b), hints: ['Line up the digits — ones under ones.', 'Exchange when a column makes 10 or more.'], steps: w.html + stepsList(w.steps) };
  } },
  { id: 'as6-sub', title: 'Subtract large numbers (column method)', gen() {
    const a = pick([R(100000, 999999), +String(R(2, 9)) * 100000 + R(0, 9) * 1000 + R(0, 99)]), b = R(10000, a - 1000), w = colSub(a, b);
    return { prompt: `${fmt(a)} − ${fmt(b)} = ${blank}`, answer: num(a - b), hints: ['Bigger number on top; start with the ones.', 'Watch out for zeros — you may need to exchange across several columns.'], steps: w.html + stepsList(w.steps) };
  } },
  { id: 'as6-missing', title: 'Missing numbers (inverse)', gen() {
    const a = R(20000, 99999), b = R(5000, a - 1000), c = a - b;
    if (Math.random() < 0.5) return { prompt: `${fmt(b)} + ${blank} = ${fmt(a)}`, answer: num(c), hints: ['Use the inverse: whole − part = missing part.', `${fmt(a)} − ${fmt(b)}`], steps: colSub(a, b).html + stepsList([`${fmt(a)} − ${fmt(b)} = ${fmt(c)}`]) };
    return { prompt: `${blank} − ${fmt(b)} = ${fmt(c)}`, answer: num(a), hints: ['The missing number is the whole.', `${fmt(c)} + ${fmt(b)}`], steps: colAdd(c, b).html + stepsList([`${fmt(c)} + ${fmt(b)} = ${fmt(a)}`]) };
  } },
  { id: 'as6-word', title: 'Multi-step problems', gen() {
    const cap0 = pick([45000, 60000, 75000, 90000]), a = R(10000, Math.floor(cap0 / 2)), b = R(5000, cap0 - a - 1000), left = cap0 - a - b;
    return { prompt: `A stadium holds <b>${fmt(cap0)}</b> people. <b>${fmt(a)}</b> adults and <b>${fmt(b)}</b> children are inside. How many seats are empty?`, answer: num(left),
      hints: ['Two steps: first find how many people are inside altogether.', `Then subtract that from ${fmt(cap0)}.`],
      steps: colAdd(a, b).html + colSub(cap0, a + b).html + stepsList([`${fmt(a)} + ${fmt(b)} = ${fmt(a + b)} inside.`, `${fmt(cap0)} − ${fmt(a + b)} = ${fmt(left)} empty seats.`]) };
  } }
] };

/* =====================================================================
   MULTIPLICATION
   ===================================================================== */
const mul = { id: 'y6-mul', year: 6, title: 'Multiplication', emoji: '🚀', skills: [
  { id: 'mul6-4x1', title: 'Multiply 4-digit by 1-digit', gen() { const a = R(1023, 9876), m = R(3, 9), w = colMul(a, m);
    return { prompt: `${fmt(a)} × ${m} = ${blank}`, answer: num(a * m), hints: ['Column method — start with the ones.', 'Add any exchanged digits after you multiply.'], steps: w.html + stepsList(w.steps) }; } },
  { id: 'mul6-2x2', title: 'Multiply 2-digit by 2-digit', gen() { const a = R(12, 98), b = R(12, 98), w = longMul(a, b);
    return { prompt: `${a} × ${b} = ${blank}`, answer: num(a * b), hints: [`Long multiplication: first ${a} × ${b % 10}.`, `Then ${a} × ${Math.floor(b / 10)} tens — remember the 0 place holder.`], steps: w.html + stepsList(w.steps) }; } },
  { id: 'mul6-4x2', title: 'Multiply up to 4-digit by 2-digit', gen() { const a = R(123, 4999), b = R(12, 89), w = longMul(a, b);
    return { prompt: `${fmt(a)} × ${b} = ${blank}`, answer: num(a * b), hints: [`Multiply by the ones (${b % 10}), then by the tens (${Math.floor(b / 10)}0).`, 'Add the two rows together.'], steps: w.html + stepsList(w.steps) }; } },
  { id: 'mul6-word', title: 'Multiplication problems', gen() { const a = R(115, 950), b = R(12, 48), w = longMul(a, b);
    return { prompt: pick([`A school orders <b>${b}</b> boxes of exercise books. Each box has <b>${a}</b> books. How many books altogether?`, `A trainer costs <b>${a} dirhams</b>. A team buys <b>${b}</b> pairs. What is the total cost in dirhams?`]),
      answer: num(a * b), hints: ['Which operation? Equal groups → multiply.', `${a} × ${b}`], steps: w.html + stepsList(w.steps) }; } }
] };

/* =====================================================================
   DIVISION (focus area for Jaden)
   ===================================================================== */
const div = { id: 'y6-div', year: 6, title: 'Division', emoji: '➗', skills: [
  { id: 'div6-facts', title: 'Divide using known facts', gen() {
    const d = R(3, 12), q = R(2, 12), k = pick([10, 100]), byTens = Math.random() < 0.4;
    if (byTens) { const dd = d * 10, n = dd * q * (k === 100 ? 10 : 1); return { prompt: `${fmt(n)} ÷ ${dd} = ${blank}`, answer: num(n / dd),
      hints: [`Divide both numbers by 10 first: ${fmt(n / 10)} ÷ ${d}.`, `${d} × ? = ${fmt(n / 10)}`], steps: stepsList([`${fmt(n)} ÷ ${dd} is the same as ${fmt(n / 10)} ÷ ${d}.`, `= ${fmt(n / dd)}`]) }; }
    const n = d * q * k;
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}`, answer: num(n / d), tag: String(d),
      hints: [`Use ${d * q} ÷ ${d} = ${q}.`, `${fmt(n)} is ${k} times bigger, so the answer is ${k} times bigger.`], steps: stepsList([`${d * q} ÷ ${d} = ${q}`, `${fmt(n)} ÷ ${d} = ${fmt(q * k)}`]) };
  } },
  { id: 'div6-short', title: 'Short division (÷ 1-digit)', gen() {
    const d = R(3, 9), q = R(Math.ceil(1000 / d), Math.floor(9999 / d)), r = Math.random() < 0.5 ? 0 : R(1, d - 1), n = d * q + r;
    if (n > 9999) return this.gen();
    const b = busStop(n, d);
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}` + (r ? '<div class="small">There is a remainder — use the <b>r</b> key.</div>' : ''), answer: r ? { kind: 'rem', q, r } : num(q), tag: String(d),
      hints: ['Bus stop method: work from the left.', 'If the digit is too small, combine it with the next digit (exchange).'], steps: b.html + stepsList(b.steps) };
  } },
  { id: 'div6-short2', title: 'Short division (÷ 2-digit)', gen() {
    const d = pick([11, 12, 15, 25, 13, 14]), q = R(21, Math.floor(9999 / d)), n = d * q, b = busStop(n, d);
    const mults = []; for (let k = 1; k <= 9; k++) mults.push(d * k);
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}`, answer: num(q), tag: String(d),
      hints: [`Write out the multiples of ${d} first: ${mults.slice(0, 5).join(', ')} …`, 'Then use the bus stop, exchanging remainders into the next digit.'],
      steps: `<div class="mults"><b>Multiples of ${d}:</b> ${mults.join(', ')}</div>` + b.html + stepsList(b.steps) };
  } },
  { id: 'div6-long', title: 'Long division (÷ 2-digit)', gen() {
    const d = R(13, 39), q = R(12, Math.floor(9999 / d)), n = d * q, w = longDiv(n, d);
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}`, answer: num(q), tag: String(d),
      hints: [`List the multiples of ${d} (${d}, ${d * 2}, ${d * 3} …) so you don't have to guess.`, 'Divide, multiply, subtract, bring down — then repeat.'], steps: w.html + stepsList(w.steps) };
  } },
  { id: 'div6-longrem', title: 'Remainders as whole numbers, fractions or decimals', gen() {
    const form = pick(['r', 'frac', 'dec']);
    let d, q, r;
    if (form === 'dec') { d = pick([4, 5, 8, 20, 25]); q = R(12, 300); r = R(1, d - 1); }
    else { d = pick([4, 6, 8, 12, 15, 16, 24]); q = R(12, Math.floor(999 / d)); r = R(1, d - 1); }
    const n = d * q + r, w = d < 10 ? busStop(n, d) : longDiv(n, d), g = gcd(r, d);
    if (form === 'r') return { prompt: `${fmt(n)} ÷ ${d} = ${blank}<div class="small">Give the remainder as a whole number (use <b>r</b>).</div>`, answer: { kind: 'rem', q, r }, tag: String(d),
      hints: [`How many whole ${d}s fit into ${fmt(n)}?`, 'Whatever is left over is the remainder.'], steps: w.html + stepsList(w.steps.concat([`${q} r ${r}`])) };
    if (form === 'frac') return { prompt: `${fmt(n)} ÷ ${d} = ${blank}<div class="small">Give the remainder as a fraction in its simplest form, e.g. <b>12 1/4</b> (use the space key).</div>`,
      answer: { kind: 'frac', n, d, simplest: true, mixed: true }, keys: ['/', '␣'], tag: String(d),
      hints: [`First divide: ${q} r ${r}.`, `The remainder over the divisor: ${r}/${d}${g > 1 ? ` — then simplify (÷ ${g})` : ''}.`],
      steps: w.html + stepsList(w.steps.concat([`${q} r ${r} = ${q} ${r}/${d}${g > 1 ? ` = ${q} ${r / g}/${d / g}` : ''}`])) };
    const dec = rnd(n / d);
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}<div class="small">Give your answer as a decimal.</div>`, answer: num(dec), keys: ['.'], tag: String(d),
      hints: [`${q} r ${r}. Now turn ${r}/${d} into a decimal.`, `Put a decimal point and zeros after ${fmt(n)} and keep dividing (${fmt(n)}.00).`],
      steps: stepsList([`${fmt(n)} ÷ ${d} = ${q} r ${r}`, `${r}/${d} = ${fmt(r / d)}`, `So the answer is ${fmt(dec)}.`]) };
  } },
  { id: 'div6-word', title: 'Division problems — interpret the remainder', gen() {
    const d = R(12, 45), q = R(8, 60), r = R(1, d - 1), n = d * q + r, up = Math.random() < 0.5;
    return { prompt: up ? `<b>${fmt(n)}</b> fans are travelling to a match. Each coach holds <b>${d}</b> people. How many coaches are needed?` : `A factory packs <b>${d}</b> trainers in a crate. It has <b>${fmt(n)}</b> trainers. How many crates can be <b>completely filled</b>?`,
      answer: num(up ? q + 1 : q),
      hints: [`${fmt(n)} ÷ ${d} = ${q} r ${r}.`, up ? 'Everyone needs a seat — so round up.' : 'Only full crates count — so round down.'],
      steps: stepsList([`${fmt(n)} ÷ ${d} = ${q} r ${r}.`, up ? `${q} coaches are full, ${r} people still need one → ${q + 1}.` : `${q} full crates (${r} trainers left over).`]) };
  } }
] };

/* =====================================================================
   FACTORS, MULTIPLES & PRIMES (focus area for Jaden)
   ===================================================================== */
const factorsOf = (n) => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
const isPrime = (n) => n > 1 && factorsOf(n).length === 2;
const fmp = { id: 'y6-fmp', year: 6, title: 'Factors, multiples & primes', emoji: '🧩', skills: [
  { id: 'fmp6-multiples', title: 'Multiples', gen() {
    const n = R(6, 15), r = R(0, 2);
    if (r === 0) { const k = R(5, 12); return { prompt: `What is the <b>${k}th multiple</b> of <b>${n}</b>?`, answer: num(n * k), hints: [`The 1st multiple is ${n}, the 2nd is ${n * 2} …`, `${n} × ${k}`], steps: stepsList([`${k}th multiple = ${n} × ${k} = ${n * k}`]) }; }
    if (r === 1) { const start = R(50, 200), ans = Math.ceil((start + 1) / n) * n; return { prompt: `What is the first multiple of <b>${n}</b> that is bigger than <b>${start}</b>?`, answer: num(ans),
      hints: [`Find a multiple of ${n} close to ${start}: ${n} × ${Math.floor(start / n)} = ${n * Math.floor(start / n)}.`, `Add ${n} if you need to go higher.`], steps: stepsList([`${n} × ${Math.floor(start / n)} = ${n * Math.floor(start / n)}`, `Next multiple: ${ans}`]) }; }
    const m = n * R(8, 20), ds = [m + 1, m - 2, m + n - 1, m + 3, m - 1].filter((x) => x % n);
    return { prompt: `Which of these is a multiple of <b>${n}</b>?`, answer: choice(m, ds), hints: [`Divide each one by ${n}.`, 'A multiple divides exactly — no remainder.'], steps: stepsList([`${m} ÷ ${n} = ${m / n} exactly.`]) };
  } },
  { id: 'fmp6-factors', title: 'Factors', gen() {
    const n = pick([24, 30, 36, 40, 42, 45, 48, 56, 60, 64, 72, 84, 90, 96, 100]), f = factorsOf(n);
    if (Math.random() < 0.5) return { prompt: `How many factors does <b>${n}</b> have?`, answer: num(f.length),
      hints: ['Find the factor pairs: 1 × ' + n + ', 2 × …', 'Count every number in every pair (don\'t count a square root twice).'],
      steps: stepsList([`Factors of ${n}: ${f.join(', ')}.`, `That's ${f.length} factors.`]) };
    const not = []; for (let x = 3; x <= 20; x++) if (n % x) not.push(x);
    const ans = pick(not), ds = shuffle(f.filter((x) => x > 1 && x < n)).slice(0, 4);
    return { prompt: `Which of these is <b>not</b> a factor of <b>${n}</b>?`, answer: choice(ans, ds),
      hints: ['A factor divides into the number exactly.', `Try ${n} ÷ each option.`], steps: stepsList([`${n} ÷ ${ans} = ${Math.floor(n / ans)} r ${n % ans}, so ${ans} is not a factor.`, `Factors of ${n}: ${f.join(', ')}.`]) };
  } },
  { id: 'fmp6-hcf', title: 'Common factors (highest common factor)', gen() {
    const g = R(2, 12), a = g * R(2, 8); let b; do { b = g * R(2, 8); } while (b === a || gcd(a, b) !== g);
    return { prompt: `What is the <b>highest common factor</b> of <b>${a}</b> and <b>${b}</b>?`, answer: num(g),
      hints: [`List the factors of ${a} and of ${b}.`, 'Find the biggest number in both lists.'],
      steps: stepsList([`Factors of ${a}: ${factorsOf(a).join(', ')}`, `Factors of ${b}: ${factorsOf(b).join(', ')}`, `Common factors: ${factorsOf(g).join(', ')}. Highest: ${g}.`]) };
  } },
  { id: 'fmp6-lcm', title: 'Common multiples (lowest common multiple)', gen() {
    const [a, b] = pick([[4, 6], [6, 8], [6, 9], [8, 12], [4, 10], [9, 12], [6, 10], [3, 7], [5, 8], [10, 15], [12, 18]]), l = lcm(a, b);
    return { prompt: `What is the <b>lowest common multiple</b> of <b>${a}</b> and <b>${b}</b>?`, answer: num(l),
      hints: [`List the multiples of ${b}: ${b}, ${b * 2}, ${b * 3} …`, `Which is the first one that ${a} also divides into?`],
      steps: stepsList([`Multiples of ${a}: ${[1, 2, 3, 4, 5, 6].map((k) => k * a).join(', ')} …`, `Multiples of ${b}: ${[1, 2, 3, 4, 5, 6].map((k) => k * b).join(', ')} …`, `The first one in both lists is ${l}.`]) };
  } },
  { id: 'fmp6-prime', title: 'Prime numbers', gen() {
    const primes = [], traps = [];
    for (let x = 11; x < 100; x++) (isPrime(x) ? primes : traps).push(x);
    const hardTraps = [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93];
    if (Math.random() < 0.6) { const p = pick(primes); return { prompt: `Which of these is a <b>prime number</b>?`, answer: choice(p, shuffle(hardTraps).slice(0, 3)),
      hints: ['A prime number has exactly 2 factors: 1 and itself.', 'Test the others: do they divide by 3, 7 or 11?'],
      steps: stepsList([`${p} only divides by 1 and ${p}, so it is prime.`, 'Watch out: 51 = 3 × 17, 57 = 3 × 19, 91 = 7 × 13.']) }; }
    const yes = Math.random() < 0.4, n = yes ? pick(primes) : pick(hardTraps), f = factorsOf(n);
    return { prompt: `Is <b>${n}</b> a prime number?`, answer: yesNo(yes),
      hints: ['Try dividing by 2, 3, 5 and 7.', 'Tip: if the digits add up to a multiple of 3, it divides by 3.'],
      steps: stepsList([yes ? `${n} has only two factors (1 and ${n}), so it is prime.` : `${n} = ${f[1]} × ${n / f[1]}, so it is not prime.`]) };
  } },
  { id: 'fmp6-sqcube', title: 'Square and cube numbers', gen() {
    const r = R(0, 2);
    if (r === 0) { const n = R(2, 12); return { prompt: `${n}² = ${blank}`, answer: num(n * n), hints: ['² means "squared": multiply the number by itself.', `${n} × ${n}`], steps: stepsList([`${n}² = ${n} × ${n} = ${n * n}`]) }; }
    if (r === 1) { const n = R(2, 6); return { prompt: `${n}³ = ${blank}`, answer: num(n ** 3), hints: ['³ means "cubed": multiply the number by itself three times.', `${n} × ${n} × ${n}`], steps: stepsList([`${n} × ${n} = ${n * n}`, `${n * n} × ${n} = ${n ** 3}`]) }; }
    const sq = R(4, 12) ** 2, ds = [sq + 1, sq - 2, sq + 4, sq - 1, sq + 6].filter((x) => !Number.isInteger(Math.sqrt(x)));
    return { prompt: `Which of these is a <b>square number</b>?`, answer: choice(sq, ds), hints: ['A square number is a number multiplied by itself.', 'Think: 1, 4, 9, 16, 25, 36, 49 …'], steps: stepsList([`${sq} = ${Math.sqrt(sq)} × ${Math.sqrt(sq)}`]) };
  } },
  { id: 'fmp6-word', title: 'Problems with factors & multiples', gen() {
    if (Math.random() < 0.5) { const [a, b] = pick([[6, 8], [10, 12], [12, 15], [8, 20], [9, 12]]), l = lcm(a, b);
      return { prompt: `Bus A leaves every <b>${a} minutes</b>. Bus B leaves every <b>${b} minutes</b>. They both leave at 9:00. After how many minutes do they next leave together?`, answer: num(l),
        hints: ['You need a number in both "times tables" — a common multiple.', `Find the lowest common multiple of ${a} and ${b}.`], steps: stepsList([`Multiples of ${a}: ${[1, 2, 3, 4, 5].map((k) => k * a).join(', ')}`, `Multiples of ${b}: ${[1, 2, 3, 4].map((k) => k * b).join(', ')}`, `First match: ${l} minutes.`]) }; }
    const g = R(3, 9), a = g * R(2, 7); let b; do { b = g * R(2, 7); } while (b === a || gcd(a, b) !== g);
    return { prompt: `Mum has <b>${a}</b> pencils and <b>${b}</b> rubbers. She makes identical packs with nothing left over. What is the <b>greatest</b> number of packs she can make?`, answer: num(g),
      hints: ['The number of packs must divide into both numbers — a common factor.', `Find the highest common factor of ${a} and ${b}.`], steps: stepsList([`Factors of ${a}: ${factorsOf(a).join(', ')}`, `Factors of ${b}: ${factorsOf(b).join(', ')}`, `HCF = ${g} packs.`]) };
  } }
] };

/* =====================================================================
   ORDER OF OPERATIONS
   ===================================================================== */
const ooo = { id: 'y6-ooo', year: 6, title: 'Order of operations', emoji: '🧮', skills: [
  { id: 'ooo6-basic', title: '× and ÷ before + and −', gen() {
    const a = R(2, 30), b = R(2, 9), c = R(2, 9), t = R(0, 2);
    if (t === 0) return { prompt: `${a} + ${b} × ${c} = ${blank}`, answer: num(a + b * c), hints: ['Multiply before you add.', `${b} × ${c} = ${b * c}`], steps: stepsList([`${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`, `(Not ${(a + b) * c} — that would be adding first!)`]) };
    if (t === 1) { const big = b * c + R(1, 40); return { prompt: `${big} − ${b * c} ÷ ${c} = ${blank}`, answer: num(big - b), hints: ['Divide before you subtract.', `${b * c} ÷ ${c} = ${b}`], steps: stepsList([`${b * c} ÷ ${c} = ${b}`, `${big} − ${b} = ${big - b}`]) }; }
    const d = R(2, 9); return { prompt: `${a} × ${b} − ${c} × ${d} = ${blank}`, answer: num(a * b - c * d), keys: a * b - c * d < 0 ? ['−'] : [], hints: ['Do both multiplications first.', `${a} × ${b} = ${a * b} and ${c} × ${d} = ${c * d}`], steps: stepsList([`${a} × ${b} = ${a * b}`, `${c} × ${d} = ${c * d}`, `${a * b} − ${c * d} = ${a * b - c * d}`]) };
  } },
  { id: 'ooo6-brackets', title: 'Brackets first', gen() {
    const a = R(2, 20), b = R(2, 20), c = R(2, 9), t = R(0, 2);
    if (t === 0) return { prompt: `(${a} + ${b}) × ${c} = ${blank}`, answer: num((a + b) * c), hints: ['Brackets first!', `${a} + ${b} = ${a + b}`], steps: stepsList([`${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`]) };
    if (t === 1) { const [x, y] = a > b ? [a, b] : [b, a]; return { prompt: `${c} × (${x} − ${y}) = ${blank}`, answer: num(c * (x - y)), hints: ['Brackets first!', `${x} − ${y} = ${x - y}`], steps: stepsList([`${x} − ${y} = ${x - y}`, `${c} × ${x - y} = ${c * (x - y)}`]) }; }
    const q = R(2, 12), s = c * q, p = R(1, s - 1); return { prompt: `(${p} + ${s - p}) ÷ ${c} = ${blank}`, answer: num(q), hints: ['Brackets first!', `${p} + ${s - p} = ${s}`], steps: stepsList([`${p} + ${s - p} = ${s}`, `${s} ÷ ${c} = ${q}`]) };
  } },
  { id: 'ooo6-place', title: 'Where do the brackets go?', gen() {
    const a = R(2, 9), b = R(2, 9), c = R(2, 9), target = (a + b) * c;
    return { prompt: `Where do the brackets go to make this true?<div class="series">${a} + ${b} × ${c} = ${target}</div>`,
      answer: choice(`(${a} + ${b}) × ${c}`, [`${a} + (${b} × ${c})`, `${a} + ${b} × ${c}`], String, 3),
      hints: [`Without brackets, ${a} + ${b} × ${c} = ${a + b * c}.`, `Try working out each option.`],
      steps: stepsList([`(${a} + ${b}) × ${c} = ${a + b} × ${c} = ${target} ✓`, `${a} + (${b} × ${c}) = ${a + b * c} ✗`]) };
  } }
] };

/* =====================================================================
   FRACTIONS
   ===================================================================== */
function fracAns(n, d, simplest) { return { kind: 'frac', n, d, simplest: !!simplest }; }
const fr = { id: 'y6-frac', year: 6, title: 'Fractions', emoji: '🍕', skills: [
  { id: 'fr6-simplify', title: 'Simplify fractions', gen() {
    const d = R(3, 12), n = R(1, d - 1), k = R(2, 6); const g = gcd(n, d);
    return { prompt: `Simplify ${frac(n * k, d * k)}<div class="small">Type it like 3/4</div>`, answer: fracAns(n / g, d / g, true),
      hints: ['Find the highest common factor of the numerator and denominator.', `Both ${n * k} and ${d * k} divide by ${k * g}.`],
      steps: stepsList([`HCF of ${n * k} and ${d * k} is ${k * g}.`, `${n * k} ÷ ${k * g} = ${n / g}, ${d * k} ÷ ${k * g} = ${d / g}.`, `${frac(n * k, d * k)} = ${frac(n / g, d / g)}`]) };
  } },
  { id: 'fr6-compare', title: 'Compare and order fractions', gen() {
    let a, b, c, d; do { b = R(3, 12); d = R(3, 12); a = R(1, b - 1); c = R(1, d - 1); } while (a * d === b * c || b === d);
    const bigger = a * d > b * c ? frac(a, b) : frac(c, d), smaller = a * d > b * c ? frac(c, d) : frac(a, b), l = lcm(b, d);
    return { prompt: `Which is greater: ${frac(a, b)} or ${frac(c, d)}?`, answer: choice(bigger, [smaller, 'They are equal'], String, 3),
      hints: ['Make the denominators the same.', `Use ${l} as the common denominator.`],
      steps: stepsList([`${frac(a, b)} = ${frac(a * l / b, l)}`, `${frac(c, d)} = ${frac(c * l / d, l)}`, `So ${bigger} is greater.`]) };
  } },
  { id: 'fr6-addsub', title: 'Add & subtract fractions (different denominators)', gen() {
    let b, d; do { b = R(2, 10); d = R(2, 12); } while (b === d || lcm(b, d) > 40);
    let a = R(1, b - 1), c = R(1, d - 1); const plus = Math.random() < 0.55, l = lcm(b, d);
    let A = a * l / b, C = c * l / d; if (!plus && A < C) { [a, b, c, d] = [c, d, a, b]; [A, C] = [C, A]; }
    if (!plus && A === C) return this.gen();
    const r = plus ? A + C : A - C;
    return { prompt: `${frac(a, b)} ${plus ? '+' : '−'} ${frac(c, d)} = ${blank}<div class="small">Type it like 7/12 — simplify if you can.</div>`, answer: fracAns(r, l),
      hints: [`Find a common denominator: ${l}.`, `${frac(a, b)} = ${frac(A, l)} and ${frac(c, d)} = ${frac(C, l)}.`],
      steps: stepsList([`Common denominator: ${l}.`, `${frac(A, l)} ${plus ? '+' : '−'} ${frac(C, l)} = ${frac(r, l)}`, gcd(r, l) > 1 || r > l ? `Simplify: ${fracHTML(r, l, true)}` : 'This is already in its simplest form.']) };
  } },
  { id: 'fr6-mixed', title: 'Add & subtract mixed numbers', gen() {
    const d = pick([4, 6, 8, 10, 12]), b = pick([2, 3, 4].filter((x) => d % x === 0 && x !== d)), w1 = R(1, 4), w2 = R(1, 3);
    const n1 = R(1, b - 1), n2 = R(1, d - 1), plus = Math.random() < 0.6;
    const A = (w1 * b + n1) * (d / b), C = w2 * d + n2; // both in d-ths
    if (!plus && A <= C) return this.gen();
    const r = plus ? A + C : A - C;
    return { prompt: `${w1}${frac(n1, b)} ${plus ? '+' : '−'} ${w2}${frac(n2, d)} = ${blank}<div class="small">Type a mixed number like <b>3 5/8</b> (space key) or a fraction.</div>`, answer: { kind: 'frac', n: r, d, mixed: true },
      hints: [`Make the denominators the same: ${frac(n1, b)} = ${frac(n1 * d / b, d)}.`, plus ? 'Add the wholes, then add the fractions.' : 'Turn both into improper fractions, then subtract.'],
      steps: stepsList([`${w1}${frac(n1, b)} = ${w1}${frac(n1 * d / b, d)} = ${frac(A, d)}`, `${w2}${frac(n2, d)} = ${frac(C, d)}`, `${frac(A, d)} ${plus ? '+' : '−'} ${frac(C, d)} = ${frac(r, d)} = ${fracHTML(r, d, true)}`]) };
  } },
  { id: 'fr6-mult', title: 'Multiply fractions', gen() {
    if (Math.random() < 0.5) { const b = R(2, 6), d = R(2, 6), a = R(1, b - 1), c = R(1, d - 1);
      return { prompt: `${frac(a, b)} × ${frac(c, d)} = ${blank}`, answer: fracAns(a * c, b * d),
        hints: ['Multiply the numerators. Multiply the denominators.', `${a} × ${c} = ${a * c} and ${b} × ${d} = ${b * d}.`], steps: stepsList([`${frac(a, b)} × ${frac(c, d)} = ${frac(a * c, b * d)}`, gcd(a * c, b * d) > 1 ? `Simplify: ${fracHTML(a * c, b * d)}` : '']) }; }
    const b = R(3, 10), a = R(1, b - 1), w = R(2, 9);
    return { prompt: `${frac(a, b)} × ${w} = ${blank}`, answer: fracAns(a * w, b),
      hints: ['Multiply the numerator by the whole number.', `${a} × ${w} = ${a * w}. Keep the denominator.`], steps: stepsList([`${frac(a, b)} × ${w} = ${frac(a * w, b)} = ${fracHTML(a * w, b, true)}`]) };
  } },
  { id: 'fr6-div', title: 'Divide fractions by whole numbers', gen() {
    const b = R(2, 9), w = R(2, 5), easy = Math.random() < 0.5; const a = easy ? w * R(1, Math.max(1, Math.floor((b - 1) / w))) : R(1, b - 1);
    if (a >= b || a < 1) return this.gen();
    return { prompt: `${frac(a, b)} ÷ ${w} = ${blank}`, answer: fracAns(a, b * w),
      hints: [a % w === 0 ? `Can you divide the numerator ${a} by ${w}?` : `Dividing by ${w} is the same as finding ${frac(1, w)} of it.`, `Multiply the denominator by ${w}: ${frac(a, b * w)}.`],
      steps: stepsList([a % w === 0 ? `${a} ÷ ${w} = ${a / w}, so ${frac(a / w, b)}.` : `${frac(a, b)} ÷ ${w} = ${frac(a, b * w)}`, `Simplest form: ${fracHTML(a, b * w)}`]) };
  } },
  { id: 'fr6-of', title: 'Fraction of an amount (and finding the whole)', gen() {
    const d = R(3, 9), n = R(1, d - 1), k = R(3, 15), total = d * k;
    if (Math.random() < 0.6) return { prompt: `What is ${frac(n, d)} of <b>${total}</b>?`, answer: num(n * k),
      hints: [`÷ by the denominator: ${total} ÷ ${d} = ${k}.`, `× by the numerator: ${k} × ${n}.`], steps: barModel(total, d, Array(d).fill(k)) + stepsList([`${total} ÷ ${d} = ${k}`, `${k} × ${n} = ${n * k}`]) };
    return { prompt: `${frac(n, d)} of a number is <b>${n * k}</b>. What is the number?`, answer: num(total),
      hints: [`${n} parts = ${n * k}, so 1 part = ${n * k} ÷ ${n}.`, `Then the whole is ${d} parts.`], steps: barModel('?', d, Array(n).fill(k)) + stepsList([`1 part = ${n * k} ÷ ${n} = ${k}`, `Whole = ${k} × ${d} = ${total}`]) };
  } }
] };

/* =====================================================================
   DECIMALS
   ===================================================================== */
const dec = { id: 'y6-dec', year: 6, title: 'Decimals', emoji: '🔟', skills: [
  { id: 'dec6-x10', title: '× and ÷ by 10, 100 and 1,000', gen() {
    const k = pick([10, 100, 1000]), times = Math.random() < 0.5;
    const n = times ? rnd(R(1, 999) / pick([10, 100, 1000])) : R(1, 999);
    const ans = rnd(times ? n * k : n / k);
    return { prompt: `${fmt(n)} ${times ? '×' : '÷'} ${fmt(k)} = ${blank}`, answer: num(ans),
      hints: [`${times ? 'Multiplying' : 'Dividing'} by ${fmt(k)} moves the digits ${Math.log10(k)} place${k > 10 ? 's' : ''} to the ${times ? 'left' : 'right'}.`, 'The decimal point doesn\'t move — the digits do. Fill gaps with 0.'],
      steps: pvChart(n, { cols: 4, dp: 3 }) + pvChart(ans, { cols: 4, dp: 3 }) + stepsList([`${fmt(n)} ${times ? '×' : '÷'} ${fmt(k)} = ${fmt(ans)}`]) };
  } },
  { id: 'dec6-mul', title: 'Multiply decimals by whole numbers', gen() {
    const a = rnd(R(2, 99) / pick([10, 100])); if (Number.isInteger(a)) return this.gen();
    const m = R(2, 9), ans = rnd(a * m), scale = String(a).split('.')[1].length;
    const whole = Math.round(a * 10 ** scale);
    return { prompt: `${fmt(a)} × ${m} = ${blank}`, answer: num(ans),
      hints: [`Make it a whole number: ${fmt(a)} × ${10 ** scale} = ${whole}.`, `${whole} × ${m} = ${whole * m}. Now ÷ ${10 ** scale}.`],
      steps: stepsList([`${whole} × ${m} = ${whole * m}`, `${whole * m} ÷ ${10 ** scale} = ${fmt(ans)}`]) };
  } },
  { id: 'dec6-div', title: 'Divide decimals by whole numbers', gen() {
    const d = R(2, 9), q = rnd(R(11, 99) / 10), n = rnd(q * d);
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}`, answer: num(q),
      hints: ['Use short division and keep the decimal point lined up.', `Or: ${fmt(n * 10)} ÷ ${d} = ${fmt(q * 10)}, then ÷ 10.`], steps: stepsList([`${fmt(rnd(n * 10))} ÷ ${d} = ${fmt(rnd(q * 10))}`, `÷ 10 → ${fmt(q)}`]) };
  } },
  { id: 'dec6-round', title: 'Round decimals', gen() {
    const n = rnd(R(1000, 99999) / 1000), to = pick(['whole', '1dp']);
    const ans = to === 'whole' ? Math.round(n) : rnd(Math.round(n * 10) / 10);
    return { prompt: `Round <b>${fmt(n)}</b> to ${to === 'whole' ? 'the nearest whole number' : '1 decimal place'}.`, answer: num(ans),
      hints: [to === 'whole' ? 'Look at the tenths digit.' : 'Look at the hundredths digit.', '5 or more → round up. 4 or less → round down.'],
      steps: stepsList([`${fmt(n)} rounds to ${fmt(ans)}.`]) };
  } }
] };

/* =====================================================================
   FRACTIONS, DECIMALS & PERCENTAGES
   ===================================================================== */
const FDP = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [1, 8], [3, 8], [1, 25], [6, 25], [1, 50]];
const fdp = { id: 'y6-fdp', year: 6, title: 'Fractions, decimals & %', emoji: '💯', skills: [
  { id: 'fdp6-f2d', title: 'Fractions to decimals', gen() {
    const [n, d] = pick(FDP), ans = rnd(n / d), k = 100 % d === 0 ? 100 / d : 1000 / d, base = 100 % d === 0 ? 100 : 1000;
    return { prompt: `Write ${frac(n, d)} as a decimal.`, answer: num(ans),
      hints: [`Make the denominator ${base}: × ${k}.`, `${frac(n, d)} = ${frac(n * k, base)}`], steps: stepsList([`${frac(n, d)} = ${frac(n * k, base)} = ${fmt(ans)}`]) };
  } },
  { id: 'fdp6-d2p', title: 'Decimals and percentages', gen() {
    const p = pick([R(1, 99), R(1, 9), R(10, 95)]), d = rnd(p / 100);
    if (Math.random() < 0.5) return { prompt: `${fmt(d)} = ${blank} %`, answer: num(p), hints: ['Per cent means "out of 100".', `× 100: ${fmt(d)} × 100`], steps: stepsList([`${fmt(d)} × 100 = ${p}%`]) };
    return { prompt: `${p}% as a decimal = ${blank}`, answer: num(d), hints: ['Per cent means "out of 100".', `÷ 100: ${p} ÷ 100`], steps: stepsList([`${p} ÷ 100 = ${fmt(d)}`]) };
  } },
  { id: 'fdp6-pctof', title: 'Percentage of an amount', gen() {
    const p = pick([10, 20, 25, 50, 5, 1, 15, 30, 35, 40, 60, 75]), base = p === 1 ? R(2, 9) * 100 : (p % 10 === 5 && p !== 25 && p !== 75) ? R(2, 30) * 20 : R(2, 30) * 20, ans = rnd(base * p / 100);
    const tenth = base / 10;
    const how = p === 50 ? [`50% = half: ${base} ÷ 2 = ${ans}`] : p === 25 ? [`25% = a quarter: ${base} ÷ 4 = ${ans}`] : p === 75 ? [`25% = ${base / 4}`, `75% = 3 × ${base / 4} = ${ans}`] : p === 1 ? [`1% = ÷ 100 = ${ans}`]
      : p === 5 ? [`10% = ${tenth}`, `5% = half of 10% = ${ans}`] : p % 10 === 5 ? [`10% = ${tenth}`, `5% = ${tenth / 2}`, `${p}% = ${Math.floor(p / 10)} × 10% + 5% = ${ans}`] : [`10% = ${base} ÷ 10 = ${tenth}`, `${p}% = ${p / 10} × ${tenth} = ${ans}`];
    return { prompt: `What is <b>${p}%</b> of <b>${fmt(base)}</b>?`, answer: num(ans), hints: [`Start with 10%: ${fmt(base)} ÷ 10 = ${fmt(tenth)}.`, `Build ${p}% from 10%, 5% and 1%.`], steps: stepsList(how) };
  } },
  { id: 'fdp6-order', title: 'Compare fractions, decimals & %', gen() {
    const picks = shuffle(FDP).slice(0, 3).map(([n, d]) => n / d); const v = [...new Set(picks.map((x) => rnd(x)))]; if (v.length < 3) return this.gen();
    const forms = [(x) => { const f = FDP.find(([n, d]) => rnd(n / d) === x); return frac(f[0], f[1]); }, (x) => fmt(x), (x) => `${fmt(rnd(x * 100))}%`];
    const labels = v.map((x, i) => forms[i](x)); const big = Math.random() < 0.5; const ans = big ? Math.max(...v) : Math.min(...v); const idx = v.indexOf(ans);
    return { prompt: `Which is the <b>${big ? 'greatest' : 'smallest'}</b>?`, answer: choice(labels[idx], labels.filter((_, i) => i !== idx), String, 3),
      hints: ['Convert them all to the same form — percentages are easiest.', 'Fraction → decimal → × 100 for %.'],
      steps: stepsList(v.map((x, i) => `${labels[i]} = ${fmt(rnd(x * 100))}%`).concat([`The ${big ? 'greatest' : 'smallest'} is ${labels[idx]}.`])) };
  } }
] };

/* =====================================================================
   RATIO
   ===================================================================== */
const ratio = { id: 'y6-ratio', year: 6, title: 'Ratio & proportion', emoji: '⚖️', skills: [
  { id: 'rat6-for-every', title: '"For every …" problems', gen() {
    const a = R(1, 5), b = R(2, 7), k = R(2, 9);
    if (a === b) return this.gen();
    return { prompt: `In a bag, for every <b>${a}</b> red beads there are <b>${b}</b> blue beads. There are <b>${a * k}</b> red beads. How many blue beads are there?`, answer: num(b * k),
      hints: [`How many groups of ${a} red are there? ${a * k} ÷ ${a}.`, `Each group has ${b} blue.`], steps: stepsList([`${a * k} ÷ ${a} = ${k} groups.`, `${k} × ${b} = ${b * k} blue beads.`]) };
  } },
  { id: 'rat6-share', title: 'Share in a ratio', gen() {
    const a = R(1, 5), b = R(2, 7), k = R(3, 12); if (a === b) return this.gen();
    const total = (a + b) * k, big = Math.random() < 0.5;
    return { prompt: `Share <b>${total}</b> sweets between Jaden and Evangeline in the ratio <b>${a} : ${b}</b>. How many does ${big ? 'Evangeline' : 'Jaden'} get?`, answer: num((big ? b : a) * k),
      hints: [`Total parts: ${a} + ${b} = ${a + b}.`, `One part = ${total} ÷ ${a + b} = ${k}.`],
      steps: barModel(total, a + b, Array(a + b).fill(k)) + stepsList([`${a} + ${b} = ${a + b} parts.`, `1 part = ${total} ÷ ${a + b} = ${k}.`, `${big ? 'Evangeline' : 'Jaden'}: ${big ? b : a} × ${k} = ${(big ? b : a) * k}.`]) };
  } },
  { id: 'rat6-scale', title: 'Scale factors', gen() {
    const s = R(2, 6), l = R(2, 12);
    return { prompt: `A shape has a side of <b>${l} cm</b>. It is enlarged by a <b>scale factor of ${s}</b>. How long is the new side?`, answer: num(l * s),
      hints: ['Scale factor tells you how many times bigger.', `${l} × ${s}`], steps: stepsList([`${l} × ${s} = ${l * s} cm`]) };
  } },
  { id: 'rat6-recipe', title: 'Recipes & proportion', gen() {
    const p1 = pick([2, 4, 6]), p2 = pick([3, 6, 8, 9, 12].filter((x) => x !== p1)), unit = R(2, 12) * 25, amt = unit * p1;
    return { prompt: `A recipe for <b>${p1}</b> people uses <b>${amt} g</b> of flour. How much flour is needed for <b>${p2}</b> people?`, answer: num(unit * p2),
      hints: [`Find the amount for 1 person: ${amt} ÷ ${p1}.`, `Then × ${p2}.`], steps: stepsList([`1 person: ${amt} ÷ ${p1} = ${unit} g`, `${p2} people: ${unit} × ${p2} = ${unit * p2} g`]) };
  } }
] };

/* =====================================================================
   ALGEBRA
   ===================================================================== */
const alg = { id: 'y6-alg', year: 6, title: 'Algebra', emoji: '🔣', skills: [
  { id: 'alg6-machine', title: 'Function machines (and working backwards)', gen() {
    const m = R(2, 9), c = R(1, 15), x = R(2, 12), y = x * m + c;
    if (Math.random() < 0.5) return { prompt: `${machine(`× ${m}  then  + ${c}`)}The input is <b>${x}</b>. What is the output?`, answer: num(y), hints: [`${x} × ${m} first.`, `Then + ${c}.`], steps: stepsList([`${x} × ${m} = ${x * m}`, `${x * m} + ${c} = ${y}`]) };
    return { prompt: `${machine(`× ${m}  then  + ${c}`)}The output is <b>${y}</b>. What was the input?`, answer: num(x),
      hints: ['Work backwards using the inverse operations.', `${y} − ${c} = ${y - c}, then ÷ ${m}.`], steps: stepsList([`Inverse of + ${c} is − ${c}: ${y} − ${c} = ${y - c}`, `Inverse of × ${m} is ÷ ${m}: ${y - c} ÷ ${m} = ${x}`]) };
  } },
  { id: 'alg6-sub', title: 'Substitution', gen() {
    const a = R(2, 9), b = R(2, 9), p = R(2, 6), q = R(2, 6);
    return { prompt: `If <b>a = ${a}</b> and <b>b = ${b}</b>, what is <b>${p}a + ${q}b</b>?`, answer: num(p * a + q * b),
      hints: [`${p}a means ${p} × a.`, `${p} × ${a} = ${p * a} and ${q} × ${b} = ${q * b}.`], steps: stepsList([`${p}a = ${p} × ${a} = ${p * a}`, `${q}b = ${q} × ${b} = ${q * b}`, `${p * a} + ${q * b} = ${p * a + q * b}`]) };
  } },
  { id: 'alg6-solve', title: 'Solve equations', gen() {
    const n = R(2, 15), m = R(2, 9), c = R(1, 20), minus = Math.random() < 0.4, rhs = minus ? m * n - c : m * n + c;
    if (rhs <= 0) return this.gen();
    return { prompt: `<b>${m}n ${minus ? '−' : '+'} ${c} = ${rhs}</b>. What is <b>n</b>?`, answer: num(n),
      hints: [`Undo the ${minus ? '− ' + c : '+ ' + c} first: ${rhs} ${minus ? '+' : '−'} ${c} = ${minus ? rhs + c : rhs - c}.`, `So ${m}n = ${m * n}. Now ÷ ${m}.`], steps: barModel(rhs, 1) + stepsList([`${m}n = ${rhs} ${minus ? '+' : '−'} ${c} = ${m * n}`, `n = ${m * n} ÷ ${m} = ${n}`]) };
  } },
  { id: 'alg6-seq', title: 'Sequences', gen() {
    const s = R(1, 12), d = R(2, 9), k = R(6, 15);
    return { prompt: `A sequence starts at <b>${s}</b> and goes up by <b>${d}</b> each time. What is the <b>${k}th</b> term?`, answer: num(s + (k - 1) * d),
      hints: [`From the 1st term to the ${k}th term there are ${k - 1} jumps.`, `${s} + ${k - 1} × ${d}`], steps: stepsList([`${k - 1} jumps of ${d} = ${(k - 1) * d}`, `${s} + ${(k - 1) * d} = ${s + (k - 1) * d}`]) };
  } }
] };

/* =====================================================================
   CONVERTING UNITS
   ===================================================================== */
const units = { id: 'y6-units', year: 6, title: 'Converting units', emoji: '📐', skills: [
  { id: 'unit6-metric', title: 'Metric units (with decimals)', gen() {
    const [big, small, k] = pick([['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000], ['m', 'cm', 100], ['cm', 'mm', 10]]);
    const n = rnd(R(11, 99) / 10 + (Math.random() < 0.4 ? R(1, 9) / 100 : 0));
    if (Math.random() < 0.5) return { prompt: `${fmt(n)} ${big} = ${blank} ${small}`, answer: num(rnd(n * k)), hints: [`1 ${big} = ${fmt(k)} ${small}.`, `× ${fmt(k)}`], steps: stepsList([`${fmt(n)} × ${fmt(k)} = ${fmt(rnd(n * k))} ${small}`]) };
    return { prompt: `${fmt(rnd(n * k))} ${small} = ${blank} ${big}`, answer: num(n), hints: [`1 ${big} = ${fmt(k)} ${small}.`, `÷ ${fmt(k)}`], steps: stepsList([`${fmt(rnd(n * k))} ÷ ${fmt(k)} = ${fmt(n)} ${big}`]) };
  } },
  { id: 'unit6-miles', title: 'Miles and kilometres', gen() {
    const k = R(2, 12);
    if (Math.random() < 0.5) return { prompt: `5 miles ≈ 8 km. About how many km is <b>${5 * k} miles</b>?`, answer: num(8 * k), hints: [`How many lots of 5 miles? ${5 * k} ÷ 5 = ${k}.`, `Each lot is 8 km.`], steps: stepsList([`${5 * k} ÷ 5 = ${k}`, `${k} × 8 = ${8 * k} km`]) };
    return { prompt: `5 miles ≈ 8 km. About how many miles is <b>${8 * k} km</b>?`, answer: num(5 * k), hints: [`How many lots of 8 km? ${8 * k} ÷ 8 = ${k}.`, `Each lot is 5 miles.`], steps: stepsList([`${8 * k} ÷ 8 = ${k}`, `${k} × 5 = ${5 * k} miles`]) };
  } }
] };

/* =====================================================================
   AREA, PERIMETER & VOLUME
   ===================================================================== */
const apv = { id: 'y6-apv', year: 6, title: 'Area, perimeter & volume', emoji: '📦', skills: [
  { id: 'apv6-perim', title: 'Area and perimeter of rectangles', gen() {
    const l = R(4, 15), w = R(2, l - 1);
    return { prompt: `A rectangle has an area of <b>${l * w} cm²</b>. Its length is <b>${l} cm</b>. What is its <b>perimeter</b>?`, answer: num(2 * (l + w)),
      hints: [`First find the width: ${l * w} ÷ ${l}.`, `Perimeter = 2 × (length + width).`], steps: rectShape(l, w, 'cm', { hLabel: '? cm' }) + stepsList([`Width = ${l * w} ÷ ${l} = ${w} cm`, `Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)} cm`]) };
  } },
  { id: 'apv6-tri', title: 'Area of a triangle', gen() {
    let b, h; do { b = R(3, 16); h = R(3, 12); } while ((b * h) % 2);
    return { prompt: `What is the area of this triangle in cm²?`, visual: triShape(b, h, 'cm'), answer: num(b * h / 2),
      hints: ['Area of a triangle = ½ × base × height.', `${b} × ${h} = ${b * h}. Now halve it.`], steps: stepsList([`${b} × ${h} = ${b * h}`, `${b * h} ÷ 2 = ${b * h / 2} cm²`]) };
  } },
  { id: 'apv6-para', title: 'Area of a parallelogram', gen() {
    const b = R(3, 15), h = R(2, 10);
    return { prompt: `A parallelogram has a base of <b>${b} cm</b> and a perpendicular height of <b>${h} cm</b>. What is its area in cm²?`, answer: num(b * h),
      hints: ['Area of a parallelogram = base × perpendicular height.', 'It\'s like a rectangle with a triangle moved from one end to the other.'], steps: stepsList([`${b} × ${h} = ${b * h} cm²`]) };
  } },
  { id: 'apv6-vol', title: 'Volume of a cuboid', gen() {
    const l = R(2, 12), w = R(2, 8), h = R(2, 9);
    return { prompt: `What is the volume of this cuboid in cm³?`, visual: cuboid(l, w, h, 'cm'), answer: num(l * w * h),
      hints: ['Volume = length × width × height.', `${l} × ${w} = ${l * w}. Now × ${h}.`], steps: stepsList([`${l} × ${w} = ${l * w}`, `${l * w} × ${h} = ${l * w * h} cm³`]) };
  } }
] };

/* =====================================================================
   CAT4-STYLE REASONING
   ===================================================================== */
const { genSeries, genAnalogy, genMachine } = E.reasoning;
const cat6 = { id: 'y6-cat4', year: 6, title: 'Reasoning (CAT4)', emoji: '🧠', skills: [
  { id: 'cat6-series', title: 'Number series — what comes next?', gen() { return genSeries(6); } },
  { id: 'cat6-analogy', title: 'Number analogies', gen() { return genAnalogy(6); } },
  { id: 'cat6-machine', title: 'Two-step function machines', gen() { return genMachine(6); } }
] };

[pv, as, mul, div, fmp, ooo, fr, dec, fdp, ratio, alg, units, apv, cat6].forEach((t) => { E.TOPICS[t.id] = t; });
E.H.words = words;
})();
