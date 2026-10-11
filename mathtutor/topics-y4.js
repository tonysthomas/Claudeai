/* Year 4 small steps (White Rose / Power Maths order). */
(function () {
'use strict';
const E = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : window.MTEngine;
const { R, pick, shuffle, gcd, fmt, frac, fracHTML, cap, choice, num, yesNo, PV, PV1,
  pvChart, colAdd, colSub, colMul, busStop, dotArray, fracBar, barModel, numberLine, gridRect, rectShape, machine, stepsList } = E.H;

const blank = '<span class="blank">?</span>';

/* ---------- shared bits ---------- */
function digitsAt(n) { return String(n).split('').reverse().map(Number); } // index 0 = ones
function addExchanges(a, b) { let c = 0, ex = 0; const A = digitsAt(a), B = digitsAt(b); for (let i = 0; i < Math.max(A.length, B.length); i++) { const s = (A[i] || 0) + (B[i] || 0) + c; c = s >= 10 ? 1 : 0; ex += c; } return ex; }
function subInfo(a, b) { // exchanges + whether we exchange across a zero
  const A = digitsAt(a), B = digitsAt(b); let ex = 0, zero = false, firstEx = -1;
  for (let i = 0; i < A.length; i++) {
    if (A[i] < (B[i] || 0)) {
      ex++; if (firstEx < 0) firstEx = i;
      let j = i + 1; while (A[j] === 0) { zero = true; A[j] = 9; j++; }
      A[j]--; A[i] += 10;
    }
  }
  return { ex, zero, firstEx };
}
const pickNonZeroPos = (n) => { const d = digitsAt(n); const ok = d.map((x, i) => x ? i : -1).filter((i) => i >= 0); return pick(ok); };
function toRoman(n) { const m = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; }

/* times tables strategies — the way the kids learn them at school */
function ttStrategy(t, b) {
  const p = t * b;
  switch (t) {
    case 2: return `×2 is doubling: double ${b} is ${p}.`;
    case 3: return `Count in 3s, or do ${b} × 2 = ${b * 2} and add one more ${b}: ${p}.`;
    case 4: return `×4 is double, double: ${b} → ${b * 2} → ${p}.`;
    case 5: return `×5 is half of ×10: ${b} × 10 = ${b * 10}, half of that is ${p}.`;
    case 6: return `×6 = ×5 and one more group: ${b * 5} + ${b} = ${p}.`;
    case 7: return `×7 = ×5 + ×2: ${b * 5} + ${b * 2} = ${p}.`;
    case 8: return `×8 is double, double, double: ${b} → ${b * 2} → ${b * 4} → ${p}.`;
    case 9: return `×9 = ×10 take away one group: ${b * 10} − ${b} = ${p}.`;
    case 10: return `×10: the digits move one place to the left: ${p}.`;
    case 11: return b <= 9 ? `×11 up to 9: the digit repeats → ${p}.` : `×11 = ×10 + one more group: ${b * 10} + ${b} = ${p}.`;
    case 12: return `×12 = ×10 + ×2: ${b * 10} + ${b * 2} = ${p}.`;
    default: return `${t} × ${b} = ${p}.`;
  }
}
/* a nudge that gets them most of the way without giving the answer */
function ttStep(t, b) {
  switch (t) {
    case 2: return `Double ${b}: ${b} + ${b}.`;
    case 3: return `${b} × 2 = ${b * 2}. Now add one more ${b}.`;
    case 4: return `Double ${b} is ${b * 2}. Now double that.`;
    case 5: return `${b} × 10 = ${b * 10}. Now halve it.`;
    case 6: return `${b} × 5 = ${b * 5}. Now add one more ${b}.`;
    case 7: return `${b} × 5 = ${b * 5} and ${b} × 2 = ${b * 2}. Add them together.`;
    case 8: return `Double ${b} is ${b * 2}, double again is ${b * 4}. Double once more.`;
    case 9: return `${b} × 10 = ${b * 10}. Now take away ${b}.`;
    case 10: return `Move the digits of ${b} one place to the left and put a 0 in the ones.`;
    case 11: return `${b} × 10 = ${b * 10}. Now add one more ${b}.`;
    case 12: return `${b} × 10 = ${b * 10} and ${b} × 2 = ${b * 2}. Add them together.`;
    default: return `Count in ${t}s, ${b} times.`;
  }
}
function pickTable(set, ctx) {
  const weak = (ctx && ctx.weakTags || []).map(Number).filter((t) => set.includes(t));
  return weak.length && Math.random() < 0.5 ? pick(weak) : pick(set);
}

/* =====================================================================
   PLACE VALUE (Year 4)
   ===================================================================== */
const pv = { id: 'y4-pv', year: 4, title: 'Place value', emoji: '🔢', skills: [
  { id: 'pv4-value', title: 'Value of each digit in a 4-digit number', gen() {
    let ds; do { ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4); } while (ds[0] === 0);
    const n = +ds.join(''), p = pickNonZeroPos(n), d = digitsAt(n)[p], val = d * 10 ** p;
    return { prompt: `What is the value of the <b>${d}</b> in <b>${fmt(n)}</b>?`, answer: num(val),
      hints: [`Put ${fmt(n)} into a place value chart. Which column is the ${d} in?`, `The ${d} is in the ${PV[p]} column, so it is worth ${d} ${PV[p]}.`],
      steps: pvChart(n, { highlight: p }) + stepsList([`Find the ${d} in the place value chart.`, `It is in the ${PV[p]} column.`, `${d} ${p ? PV[p] : (d === 1 ? 'one' : 'ones')} = ${fmt(val)}.`]) };
  } },
  { id: 'pv4-partition', title: 'Partition 4-digit numbers', gen() {
    const n = R(1000, 9999), ds = String(n).split('').map(Number);
    const parts = ds.map((d, i) => d * 10 ** (3 - i)).filter((v) => v > 0);
    if (Math.random() < 0.65 && parts.length > 1) {
      const h = R(0, parts.length - 1);
      return { prompt: parts.map((v, i) => (i === h ? blank : fmt(v))).join(' + ') + ` = ${fmt(n)}`, answer: num(parts[h]),
        hints: ['Partition the number into thousands, hundreds, tens and ones.', `Which part of ${fmt(n)} is missing? Look at the place value chart.`],
        steps: pvChart(n) + stepsList([`${fmt(n)} = ${parts.map(fmt).join(' + ')}.`, `The missing part is ${fmt(parts[h])}.`]) };
    }
    return { prompt: `${parts.map(fmt).join(' + ')} = ${blank}`, answer: num(n),
      hints: ['Put each part into its column in a place value chart.', 'Any column with nothing in it gets a 0 as a place holder.'],
      steps: pvChart(n) + stepsList([`Put each part in its column.`, `Read the number: ${fmt(n)}.`]) };
  } },
  { id: 'pv4-more', title: '1, 10, 100, 1,000 more or less', gen() {
    const p = R(0, 3), step = 10 ** p, more = Math.random() < 0.5;
    let n = R(1000, 8999);
    if (Math.random() < 0.4 && p < 3) { // make it cross a boundary
      const d = String(n).split(''); d[3 - p] = more ? '9' : '0'; n = +d.join('');
      if (!more && n - step < 1000) n += 1000;
    }
    if (!more && n - step < 1000) n += 2000;
    const ans = more ? n + step : n - step;
    return { prompt: `What is <b>${fmt(step)} ${more ? 'more' : 'less'}</b> than <b>${fmt(n)}</b>?`, answer: num(ans),
      hints: [`${fmt(step)} ${more ? 'more' : 'less'} changes the ${PV[p]} digit.`, `If the ${PV[p]} digit is ${more ? '9' : '0'}, you need to exchange with the next column.`],
      steps: pvChart(n, { highlight: p }) + stepsList([`Look at the ${PV[p]} column.`, `${more ? 'Add' : 'Take away'} 1 ${PV1[p]}: ${fmt(n)} ${more ? '+' : '−'} ${fmt(step)} = ${fmt(ans)}.`]) };
  } },
  { id: 'pv4-round', title: 'Round to the nearest 10, 100 or 1,000', gen() {
    const to = pick([10, 100, 1000]); let n; do { n = R(1001, 9899); } while (n % to === 0);
    const lo = Math.floor(n / to) * to, hi = lo + to, ans = n - lo >= to / 2 ? hi : lo;
    const p = Math.log10(to);
    return { prompt: `Round <b>${fmt(n)}</b> to the nearest <b>${fmt(to)}</b>.`, answer: num(ans),
      hints: [`Which two multiples of ${fmt(to)} is ${fmt(n)} between? ${fmt(lo)} and ${fmt(hi)}.`, `Look at the ${PV[p - 1]} digit. 5 or more → round up. 4 or less → round down.`],
      steps: numberLine(lo, hi, n) + stepsList([`${fmt(n)} is between ${fmt(lo)} and ${fmt(hi)}.`, `The halfway point is ${fmt(lo + to / 2)}.`, `${fmt(n)} is ${ans === hi ? 'at or past' : 'before'} halfway, so it rounds to ${fmt(ans)}.`]) };
  } },
  { id: 'pv4-compare', title: 'Compare and order numbers', gen() {
    const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const nums = new Set([+ds.join('')]);
    while (nums.size < 4) { const s = ds.slice(); const i = R(1, 3), j = R(1, 3); [s[i], s[j]] = [s[j], s[i]]; if (Math.random() < 0.3) { const k = R(1, 3); [s[0], s[k]] = [s[k], s[0]]; } nums.add(+s.join('')); }
    const arr = [...nums], big = Math.random() < 0.5, ans = big ? Math.max(...arr) : Math.min(...arr);
    return { prompt: `Which number is the <b>${big ? 'greatest' : 'smallest'}</b>?`, answer: choice(ans, arr.filter((x) => x !== ans)),
      hints: ['Compare the thousands first. If they are the same, compare the hundreds, then the tens.', `Look for the ${big ? 'biggest' : 'smallest'} digit in the highest column.`],
      steps: stepsList([`Line the numbers up in a place value chart.`, `Compare from the left: thousands, then hundreds, tens, ones.`, `The ${big ? 'greatest' : 'smallest'} is ${fmt(ans)}.`]) };
  } },
  { id: 'pv4-neg', title: 'Count through zero (negative numbers)', gen() {
    const start = R(1, 9), back = start + R(1, 6), ans = start - back;
    const temp = Math.random() < 0.5;
    const seq = []; for (let v = start; v >= ans; v--) seq.push(fmt(v));
    return { prompt: temp ? `The temperature is <b>${start}°C</b>. It falls by <b>${back} degrees</b>. What is the temperature now?` : `Count back <b>${back}</b> from <b>${start}</b>. Where do you land?`,
      answer: num(ans), keys: ['−'],
      hints: [`Count back to 0 first: that's ${start} jumps. You still need ${back - start} more.`, 'Below zero the numbers are negative: −1, −2, −3 …'],
      steps: stepsList([`Count back one at a time: ${seq.join(', ')}.`, `You land on ${fmt(ans)}${temp ? '°C' : ''}.`]) };
  } },
  { id: 'pv4-roman', title: 'Roman numerals to 100', gen() {
    const n = R(4, 100);
    if (Math.random() < 0.5) return { prompt: `What number is <b>${toRoman(n)}</b>?`, answer: num(n),
      hints: ['I = 1, V = 5, X = 10, L = 50, C = 100.', 'A smaller letter before a bigger one means take away (IV = 4, XL = 40).'],
      steps: stepsList([`Split it up: ${toRoman(n)}.`, `Add the parts: ${n}.`]) };
    const wrong = [n + 1, n - 1, n + 10, n - 10, n + 5].filter((x) => x > 0 && x <= 100).map(toRoman);
    return { prompt: `Which Roman numeral shows <b>${n}</b>?`, answer: choice(toRoman(n), wrong, String),
      hints: ['I = 1, V = 5, X = 10, L = 50, C = 100.', `Partition ${n} into tens and ones first.`],
      steps: stepsList([`${n} = ${Math.floor(n / 10) * 10} + ${n % 10}.`, `So ${n} = ${toRoman(n)}.`]) };
  } }
] };

/* =====================================================================
   ADDITION
   ===================================================================== */
function addQ(a, b, prompt) {
  const w = colAdd(a, b);
  return { prompt: prompt || `${fmt(a)} + ${fmt(b)} = ${blank}`, answer: num(a + b),
    hints: ['Use the column method. Line up the ones under the ones. Start with the ones.', 'If a column adds up to 10 or more, exchange 10 for 1 in the next column.'],
    steps: w.html + stepsList(w.steps) };
}
function genAdd(minEx, maxEx, digA = 4, digB = 4) {
  for (;;) {
    const a = R(10 ** (digA - 1), 10 ** digA - 1), b = R(10 ** (digB - 1), 10 ** digB - 1);
    if (a + b > 9999) continue;
    const ex = addExchanges(a, b); if (ex >= minEx && ex <= maxEx) return [a, b];
  }
}
const add = { id: 'y4-add', year: 4, title: 'Addition', emoji: '➕', skills: [
  { id: 'add4-none', title: 'Add 4-digit numbers — no exchange', gen() { const [a, b] = genAdd(0, 0, 4, pick([3, 4])); return addQ(a, b); } },
  { id: 'add4-one', title: 'Add with one exchange', gen() { const [a, b] = genAdd(1, 1); return addQ(a, b); } },
  { id: 'add4-more', title: 'Add with more than one exchange', gen() { const [a, b] = genAdd(2, 3); return addQ(a, b); } },
  { id: 'add4-word', title: 'Addition word problems', gen() {
    const [a, b] = genAdd(1, 3, 4, pick([3, 4]));
    const ctx = pick([
      `A shoe shop sold <b>${fmt(a)}</b> pairs of trainers in June and <b>${fmt(b)}</b> pairs in July. How many pairs altogether?`,
      `A school library has <b>${fmt(a)}</b> books. <b>${fmt(b)}</b> new books arrive. How many books are there now?`,
      `<b>${fmt(a)}</b> people visited the aquarium on Saturday and <b>${fmt(b)}</b> on Sunday. How many visitors in total?`]);
    return addQ(a, b, ctx);
  } }
] };

/* =====================================================================
   SUBTRACTION (focus area for Evangeline)
   ===================================================================== */
function subQ(a, b, prompt) {
  const w = colSub(a, b), info = subInfo(a, b);
  const h2 = info.firstEx >= 0
    ? `In the ${PV[info.firstEx]}, the top digit is smaller — exchange 1 ${PV1[info.firstEx + 1]} for 10 ${PV[info.firstEx]}.${info.zero ? ' If the next column is 0, go one more column left and exchange down.' : ''}`
    : 'Each top digit is bigger, so no exchanging needed — just subtract each column.';
  return { prompt: prompt || `${fmt(a)} − ${fmt(b)} = ${blank}`, answer: num(a - b),
    hints: ['Column method: the bigger number goes on top. Start with the ones.', h2],
    steps: w.html + stepsList(w.steps.concat([`Check with the inverse: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)} ✓`])) };
}
function genSub(test, dA = 4, dB = 4) {
  for (;;) {
    const a = R(10 ** (dA - 1), 10 ** dA - 1), b = R(10 ** (dB - 1), Math.min(a - 1, 10 ** dB - 1));
    if (b < 1) continue;
    if (test(subInfo(a, b), a, b)) return [a, b];
  }
}
function zeroTop() { // e.g. 4,003  6,040  7,000  5,206
  const th = R(2, 9), pat = pick(['x00x', 'x0x0', 'x000', 'x0xx', 'xx0x']);
  return +pat.split('').map((c, i) => i === 0 ? th : c === '0' ? 0 : R(1, 9)).join('');
}
const sub = { id: 'y4-sub', year: 4, title: 'Subtraction', emoji: '➖', skills: [
  { id: 'sub4-mental', title: 'Subtract 1s, 10s, 100s and 1,000s', gen() {
    const n = R(1111, 9999), p = R(0, 3), d = digitsAt(n)[p];
    const k = R(1, Math.max(1, d)); if (d === 0) return this.gen();
    const s = k * 10 ** p;
    return { prompt: `${fmt(n)} − ${fmt(s)} = ${blank}`, answer: num(n - s),
      hints: [`${fmt(s)} is ${k} ${k === 1 ? PV1[p] : PV[p]}. Which digit will change?`, `Only the ${PV[p]} digit changes: ${d} − ${k} = ${d - k}.`],
      steps: pvChart(n, { highlight: p }) + stepsList([`Take ${k} away from the ${PV[p]} column.`, `${d} − ${k} = ${d - k}, so the answer is ${fmt(n - s)}.`]) };
  } },
  { id: 'sub4-none', title: 'Subtract — no exchange', gen() { const [a, b] = genSub((i) => i.ex === 0, 4, pick([3, 4])); return subQ(a, b); } },
  { id: 'sub4-one', title: 'Subtract with one exchange', gen() { const [a, b] = genSub((i, a) => i.ex === 1 && !i.zero && !String(a).includes('0')); return subQ(a, b); } },
  { id: 'sub4-more', title: 'Subtract with more than one exchange', gen() { const [a, b] = genSub((i, a) => i.ex >= 2 && !i.zero && !String(a).includes('0')); return subQ(a, b); } },
  { id: 'sub4-zero', title: 'Exchange across zero (e.g. 4,003 − 1,257)', gen() {
    for (;;) { const a = zeroTop(), b = R(1000, a - 1); const i = subInfo(a, b); if (i.zero && a - b > 0) return subQ(a, b); }
  } },
  { id: 'sub4-inverse', title: 'Missing numbers — use the inverse', gen() {
    const [a, b] = genSub((i) => i.ex >= 1), c = a - b;
    if (Math.random() < 0.5) return { prompt: `${blank} − ${fmt(b)} = ${fmt(c)}`, answer: num(a),
      hints: ['Subtraction and addition are inverses. Use a part-whole model.', `The missing number is the whole: ${fmt(c)} + ${fmt(b)}.`],
      steps: colAdd(c, b).html + stepsList([`The whole is missing, so add the parts: ${fmt(c)} + ${fmt(b)} = ${fmt(a)}.`]) };
    const w = colSub(a, c);
    return { prompt: `${fmt(a)} − ${blank} = ${fmt(c)}`, answer: num(b),
      hints: ['Draw a bar model: the whole is ' + fmt(a) + '.', `One part is ${fmt(c)}. Find the other part: ${fmt(a)} − ${fmt(c)}.`],
      steps: w.html + stepsList([`Whole − part = other part: ${fmt(a)} − ${fmt(c)} = ${fmt(b)}.`]) };
  } },
  { id: 'sub4-word', title: 'Subtraction word problems', gen() {
    const [a, b] = genSub((i) => i.ex >= 1, 4, pick([3, 4]));
    return subQ(a, b, pick([
      `A shop had <b>${fmt(a)}</b> pairs of school shoes. It sold <b>${fmt(b)}</b> pairs. How many pairs are left?`,
      `Burj Khalifa has <b>${fmt(a)}</b> visitors on Friday and <b>${fmt(b)}</b> on Monday. How many more visitors were there on Friday?`,
      `A plane flew <b>${fmt(a)} km</b>. A train travelled <b>${fmt(b)} km</b>. How much further did the plane go?`]));
  } }
] };

/* =====================================================================
   TIMES TABLES (focus area for Evangeline — tag = table)
   ===================================================================== */
function ttQ(t, b, mode) {
  const p = t * b, [x, y] = Math.random() < 0.5 ? [t, b] : [b, t];
  const steps = dotArray(Math.min(t, b), Math.max(t, b)) + stepsList([ttStrategy(t, b)]);
  if (mode === 'missing') {
    const left = Math.random() < 0.5;
    return { prompt: left ? `${t} × ${blank} = ${p}` : `${blank} × ${t} = ${p}`, answer: num(b), tag: String(t),
      hints: [`Count up in ${t}s until you reach ${p}.`, `How many ${t}s make ${p}? Think: ${p} ÷ ${t}.`], steps };
  }
  if (mode === 'div') return { prompt: `${p} ÷ ${t} = ${blank}`, answer: num(b), tag: String(t),
    hints: [`Use the ${t} times table. What times ${t} makes ${p}?`, `${t} × ? = ${p}`], steps };
  return { prompt: `${x} × ${y} = ${blank}`, answer: num(p), tag: String(t), hints: [ttStrategy(t, b).split(':')[0] + '.', ttStep(t, b)], steps };
}
const tables = { id: 'y4-tables', year: 4, title: 'Times tables', emoji: '✖️', skills: [
  { id: 'tt-2-5-10', title: '2, 5 and 10 times tables', gen(ctx) { return ttQ(pickTable([2, 5, 10], ctx), R(1, 12)); } },
  { id: 'tt-3-4-8', title: '3, 4 and 8 times tables', gen(ctx) { return ttQ(pickTable([3, 4, 8], ctx), R(2, 12)); } },
  { id: 'tt-6-9', title: '6 and 9 times tables', gen(ctx) { return ttQ(pickTable([6, 9], ctx), R(2, 12)); } },
  { id: 'tt-7-11-12', title: '7, 11 and 12 times tables', gen(ctx) { return ttQ(pickTable([7, 11, 12], ctx), R(2, 12)); } },
  { id: 'tt-mixed', title: 'Mixed tables up to 12 × 12', gen(ctx) { return ttQ(pickTable([3, 4, 6, 7, 8, 9, 11, 12], ctx), R(2, 12)); } },
  { id: 'tt-missing', title: 'Missing factors (7 × ? = 56)', gen(ctx) { return ttQ(pickTable([3, 4, 6, 7, 8, 9, 12], ctx), R(2, 12), 'missing'); } },
  { id: 'tt-div', title: 'Division facts (56 ÷ 7)', gen(ctx) { return ttQ(pickTable([3, 4, 6, 7, 8, 9, 11, 12], ctx), R(2, 12), 'div'); } },
  { id: 'tt-related', title: 'Related facts & multiply 3 numbers', gen() {
    const t = R(3, 9), b = R(2, 9), r = Math.random();
    if (r < 0.4) return { prompt: `If ${t} × ${b} = ${t * b}, what is ${t * 10} × ${b}?`, answer: num(t * b * 10), tag: String(t),
      hints: [`${t * 10} is 10 times bigger than ${t}.`, `So the answer is 10 times bigger than ${t * b}.`],
      steps: stepsList([`${t} × ${b} = ${t * b}`, `${t * 10} × ${b} = ${t * b} × 10 = ${t * b * 10}`]) };
    if (r < 0.7) return { prompt: `${t * b * 10} ÷ ${t} = ${blank}`, answer: num(b * 10), tag: String(t),
      hints: [`Use ${t * b} ÷ ${t} = ${b}.`, `${t * b * 10} is 10 times bigger, so the answer is 10 times bigger.`],
      steps: stepsList([`${t * b} ÷ ${t} = ${b}`, `${t * b * 10} ÷ ${t} = ${b * 10}`]) };
    const a = R(2, 5), c = R(2, 5);
    return { prompt: `${a} × ${b} × ${c} = ${blank}`, answer: num(a * b * c),
      hints: ['Multiply two of the numbers first, then multiply by the third.', `${a} × ${b} = ${a * b}. Now × ${c}.`],
      steps: stepsList([`${a} × ${b} = ${a * b}`, `${a * b} × ${c} = ${a * b * c}`]) };
  } }
] };

/* =====================================================================
   MULTIPLES & FACTORS (focus area)
   ===================================================================== */
const mf = { id: 'y4-mf', year: 4, title: 'Multiples & factors', emoji: '🧩', skills: [
  { id: 'mf4-count', title: 'Count in multiples of 6, 7, 9, 25 and 1,000', gen() {
    const n = pick([6, 7, 9, 25, 1000, 8, 4]), s = R(1, 6), terms = [0, 1, 2, 3, 4].map((i) => (s + i) * n), h = R(1, 4);
    return { prompt: `Count in ${fmt(n)}s: ` + terms.map((v, i) => i === h ? blank : fmt(v)).join(', '), answer: num(terms[h]), tag: String(n),
      hints: [`Each number is ${fmt(n)} more than the one before.`, `${fmt(terms[h - 1])} + ${fmt(n)} = ?`],
      steps: stepsList([`The sequence goes up in ${fmt(n)}s.`, `${fmt(terms[h - 1])} + ${fmt(n)} = ${fmt(terms[h])}.`]) };
  } },
  { id: 'mf4-identify', title: 'Is it a multiple?', gen() {
    const n = pick([3, 4, 6, 7, 8, 9, 11, 12]);
    if (Math.random() < 0.5) {
      const m = n * R(3, 12); const ds = []; while (ds.length < 6) { const x = m + pick([-3, -2, -1, 1, 2, 3, 4, -4]); if (x % n && !ds.includes(x)) ds.push(x); }
      return { prompt: `Which of these is a <b>multiple of ${n}</b>?`, answer: choice(m, ds), tag: String(n),
        hints: [`A multiple of ${n} is in the ${n} times table.`, `Try dividing each number by ${n}. Which one has no remainder?`],
        steps: stepsList([`${fmt(m)} = ${n} × ${m / n}, so it is a multiple of ${n}.`]) };
    }
    const yes = Math.random() < 0.5, m = yes ? n * R(3, 12) : n * R(3, 12) + R(1, n - 1);
    return { prompt: `Is <b>${m}</b> a multiple of <b>${n}</b>?`, answer: yesNo(yes), tag: String(n),
      hints: [`Count in ${n}s. Do you land on ${m}?`, `Is ${m} in the ${n} times table?`],
      steps: stepsList([yes ? `${n} × ${m / n} = ${m}, so yes.` : `${n} × ${Math.floor(m / n)} = ${n * Math.floor(m / n)} and ${n} × ${Math.floor(m / n) + 1} = ${n * (Math.floor(m / n) + 1)}. ${m} is between, so no.`]) };
  } },
  { id: 'mf4-pairs', title: 'Factor pairs', gen() {
    const n = pick([12, 16, 18, 20, 24, 30, 36, 40, 48, 60]);
    const pairs = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) pairs.push([i, n / i]);
    if (Math.random() < 0.6) {
      const [a, b] = pick(pairs.filter((p) => p[0] > 1) .length ? pairs.filter((p) => p[0] > 1) : pairs);
      return { prompt: `Complete the factor pair of <b>${n}</b>: ${a} × ${blank} = ${n}`, answer: num(b),
        hints: ['Factor pairs multiply together to make the number.', `${n} ÷ ${a} = ?`],
        steps: stepsList([`${n} ÷ ${a} = ${b}`, `All factor pairs of ${n}: ${pairs.map((p) => p.join(' × ')).join(', ')}.`]) };
    }
    return { prompt: `How many <b>factor pairs</b> does <b>${n}</b> have?`, answer: num(pairs.length),
      hints: ['Start at 1 × ' + n + ', then try 2, 3, 4 … in order.', 'Stop when the pairs start repeating.'],
      steps: stepsList([`Factor pairs of ${n}: ${pairs.map((p) => p.join(' × ')).join(', ')}.`, `That's ${pairs.length} pairs.`]) };
  } },
  { id: 'mf4-common', title: 'Common multiples', gen() {
    const [a, b] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [2, 7], [4, 5], [6, 8]]), l = E.H.lcm(a, b), ans = l * R(1, Math.max(1, Math.floor(60 / l)));
    const ds = []; for (let x = 6; x <= 70 && ds.length < 5; x++) if ((x % a === 0) !== (x % b === 0) && Math.abs(x - ans) < 20) ds.push(x);
    return { prompt: `Which number is a multiple of <b>both ${a} and ${b}</b>?`, answer: choice(ans, shuffle(ds)),
      hints: [`List the multiples of ${a} and of ${b}.`, `Find a number that is in both lists.`],
      steps: stepsList([`Multiples of ${a}: ${[1, 2, 3, 4, 5, 6, 7, 8].map((k) => k * a).join(', ')} …`, `Multiples of ${b}: ${[1, 2, 3, 4, 5, 6, 7, 8].map((k) => k * b).join(', ')} …`, `${ans} is in both lists.`]) };
  } }
] };

/* =====================================================================
   WRITTEN MULTIPLICATION
   ===================================================================== */
function mulQ(a, m, prompt) {
  const w = colMul(a, m);
  const tens = Math.floor(a / 10) * 10, ones = a % 10;
  const part = a < 100 ? [`Or partition: ${tens} × ${m} = ${tens * m} and ${ones} × ${m} = ${ones * m}. ${tens * m} + ${ones * m} = ${a * m}.`] : [];
  return { prompt: prompt || `${fmt(a)} × ${m} = ${blank}`, answer: num(a * m),
    hints: ['Use the column method. Multiply the ones first.', `If you get 10 or more, exchange into the next column and add it on after you multiply.`],
    steps: w.html + stepsList(w.steps.concat(part)) };
}
const mul = { id: 'y4-mul', year: 4, title: 'Multiplication', emoji: '🚀', skills: [
  { id: 'mul4-10-100', title: 'Multiply by 10 and 100', gen() {
    const n = R(2, 99), k = pick([10, 100]);
    return { prompt: `${n} × ${k} = ${blank}`, answer: num(n * k),
      hints: [`When you multiply by ${k}, every digit moves ${k === 10 ? 'one place' : 'two places'} to the left.`, `Fill the empty ${k === 10 ? 'ones column' : 'tens and ones columns'} with 0.`],
      steps: pvChart(n * k) + stepsList([`Move each digit ${k === 10 ? 'one place' : 'two places'} left.`, `${n} × ${k} = ${fmt(n * k)}.`]) };
  } },
  { id: 'mul4-2x1', title: '2-digit × 1-digit', gen() { return mulQ(R(13, 98), R(3, 9)); } },
  { id: 'mul4-3x1', title: '3-digit × 1-digit', gen() { return mulQ(R(102, 989), R(2, 9)); } },
  { id: 'mul4-word', title: 'Multiplication word problems', gen() {
    const a = R(12, 150), m = R(3, 9);
    return mulQ(a, m, pick([
      `A box holds <b>${a}</b> pencils. How many pencils are in <b>${m}</b> boxes?`,
      `A pair of trainers costs <b>${a} dirhams</b>. How much do <b>${m}</b> pairs cost?`,
      `A bus seats <b>${a}</b> people. How many people fit on <b>${m}</b> buses?`]));
  } }
] };

/* =====================================================================
   DIVISION (focus area)
   ===================================================================== */
function divPartitionSteps(n, d) {
  const big = Math.floor(n / (d * 10)) * d * 10;
  if (big === 0 || big === n) return [];
  return [`Partition ${n} into ${big} and ${n - big} (both in the ${d} times table).`, `${big} ÷ ${d} = ${big / d}, ${n - big} ÷ ${d} = ${(n - big) / d}.`, `${big / d} + ${(n - big) / d} = ${n / d}.`];
}
const div = { id: 'y4-div', year: 4, title: 'Division', emoji: '➗', skills: [
  { id: 'div4-facts', title: 'Division facts & related facts', gen() {
    const d = R(2, 12), q = R(2, 12), big = Math.random() < 0.35;
    const n = d * q * (big ? 10 : 1);
    return { prompt: `${fmt(n)} ÷ ${d} = ${blank}`, answer: num(n / d), tag: String(d),
      hints: [big ? `Use ${d * q} ÷ ${d} = ${q}. ${fmt(n)} is 10 times bigger.` : `Think: ${d} × ? = ${n}.`, `Count in ${d}s, or use the inverse.`],
      steps: stepsList([big ? `${d * q} ÷ ${d} = ${q}, so ${fmt(n)} ÷ ${d} = ${q * 10}.` : `${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q}.`]) };
  } },
  { id: 'div4-partition', title: '2-digit ÷ 1-digit (partitioning)', gen() {
    for (;;) {
      const d = R(2, 6), q = R(11, Math.floor(99 / d)), n = d * q;
      if (n < 20) continue;
      const b = busStop(n, d);
      return { prompt: `${n} ÷ ${d} = ${blank}`, answer: num(q), tag: String(d),
        hints: [`Partition ${n} into tens and ones that are easy to divide by ${d}.`, divPartitionSteps(n, d)[0] || `Use short division: how many ${d}s in the tens?`],
        steps: b.html + stepsList(divPartitionSteps(n, d).concat(['Or short division: ', ...b.steps])) };
    }
  } },
  { id: 'div4-rem', title: 'Divide with remainders', gen() {
    const d = R(3, 9), q = R(3, 12), r = R(1, d - 1), n = d * q + r, b = busStop(n, d);
    return { prompt: `${n} ÷ ${d} = ${blank}<div class="small">Write it like <b>8 r 3</b> — use the <b>r</b> key.</div>`, answer: { kind: 'rem', q, r }, tag: String(d),
      hints: [`What is the biggest multiple of ${d} that is not more than ${n}?`, `${d} × ${q} = ${d * q}. How many are left over?`],
      steps: b.html + stepsList([`${d} × ${q} = ${d * q}.`, `${n} − ${d * q} = ${r} left over.`, `So ${n} ÷ ${d} = ${q} r ${r}.`]) };
  } },
  { id: 'div4-3d', title: '3-digit ÷ 1-digit (short division)', gen() {
    const d = R(3, 9), q = R(Math.ceil(100 / d) + 1, Math.floor(999 / d)), r = Math.random() < 0.5 ? 0 : R(1, d - 1), n = d * q + r;
    if (n > 999) return this.gen();
    const b = busStop(n, d);
    return { prompt: `${n} ÷ ${d} = ${blank}` + (r ? '<div class="small">There may be a remainder — use the <b>r</b> key.</div>' : ''), answer: r ? { kind: 'rem', q, r } : num(q), tag: String(d),
      hints: ['Use the bus stop method. Start with the hundreds.', `How many ${d}s in each digit? Exchange any remainder into the next column.`],
      steps: b.html + stepsList(b.steps) };
  } },
  { id: 'div4-word', title: 'Division word problems (what to do with the remainder)', gen() {
    const d = R(4, 9), q = R(4, 12), r = R(1, d - 1), n = d * q + r, kind = R(0, 2);
    if (kind === 0) return { prompt: `<b>${n}</b> children are going on a trip. Each minibus holds <b>${d}</b> children. How many minibuses are needed?`, answer: num(q + 1),
      hints: [`${n} ÷ ${d} = ${q} r ${r}.`, `The ${r} children left over still need a seat!`],
      steps: stepsList([`${n} ÷ ${d} = ${q} r ${r}.`, `${q} minibuses are full and ${r} children are left, so we need 1 more: ${q + 1}.`]) };
    if (kind === 1) return { prompt: `A shop packs trainers into boxes of <b>${d}</b>. It has <b>${n}</b> trainers. How many <b>full</b> boxes can it make?`, answer: num(q),
      hints: [`${n} ÷ ${d} = ? r ?`, 'Only count the full boxes — ignore the remainder.'],
      steps: stepsList([`${n} ÷ ${d} = ${q} r ${r}.`, `${q} full boxes (${r} left over).`]) };
    return { prompt: `<b>${d * q}</b> stickers are shared equally between <b>${d}</b> friends. How many does each friend get?`, answer: num(q),
      hints: ['Sharing equally means dividing.', `${d * q} ÷ ${d} = ?`], steps: stepsList([`${d * q} ÷ ${d} = ${q}.`]) };
  } }
] };

/* =====================================================================
   FRACTIONS
   ===================================================================== */
const fr = { id: 'y4-frac', year: 4, title: 'Fractions', emoji: '🍕', skills: [
  { id: 'fr4-equiv', title: 'Equivalent fractions', gen() {
    const d = pick([2, 3, 4, 5, 6]), n = R(1, d - 1), k = R(2, 4), top = Math.random() < 0.5;
    return { prompt: top ? `${frac(n, d)} = ${frac('?', d * k)}` : `${frac(n, d)} = ${frac(n * k, '?')}`, answer: num(top ? n * k : d * k),
      hints: ['Equivalent fractions: multiply the numerator and the denominator by the same number.', top ? `${d} × ${k} = ${d * k}, so multiply ${n} by ${k} too.` : `${n} × ${k} = ${n * k}, so multiply ${d} by ${k} too.`],
      steps: fracBar(n, d) + fracBar(n * k, d * k) + stepsList([`× ${k} on the top and bottom.`, `${frac(n, d)} = ${frac(n * k, d * k)}`]) };
  } },
  { id: 'fr4-addsub', title: 'Add & subtract fractions (same denominator)', gen() {
    const d = pick([5, 6, 7, 8, 9, 10, 12]), plus = Math.random() < 0.55;
    let a = R(1, d - 1), b = R(1, d - 1);
    if (!plus && b > a) [a, b] = [b, a]; if (!plus && a === b) a = Math.min(d - 1, a + 1), b = Math.max(1, b - 1);
    const fromWhole = !plus && Math.random() < 0.3;
    if (fromWhole) return { prompt: `1 − ${frac(b, d)} = ${blank}`, answer: { kind: 'frac', n: d - b, d },
      hints: [`1 whole = ${frac(d, d)}.`, `${frac(d, d)} − ${frac(b, d)} = ?`], steps: fracBar(d - b, d) + stepsList([`1 = ${frac(d, d)}`, `${d} − ${b} = ${d - b}, so the answer is ${frac(d - b, d)}.`]) };
    const r = plus ? a + b : a - b;
    return { prompt: `${frac(a, d)} ${plus ? '+' : '−'} ${frac(b, d)} = ${blank}<div class="small">Type a fraction like 3/8</div>`, answer: { kind: 'frac', n: r, d },
      hints: ['The denominators are the same, so only the numerators change.', `${a} ${plus ? '+' : '−'} ${b} = ${r}. Keep the denominator ${d}.`],
      steps: fracBar(Math.min(r, d), d) + stepsList([`${a} ${plus ? '+' : '−'} ${b} = ${r} ${d}ths.`, `Answer: ${frac(r, d)}${r > d ? ` (= ${fracHTML(r, d, true)})` : ''}.`]) };
  } },
  { id: 'fr4-of', title: 'Fraction of an amount', gen() {
    const d = pick([2, 3, 4, 5, 6, 8, 10]), n = Math.random() < 0.5 ? 1 : R(1, d - 1), k = R(2, 9), total = d * k;
    return { prompt: `What is ${frac(n, d)} of <b>${total}</b>?`, answer: num(n * k),
      hints: [`Divide ${total} into ${d} equal parts (÷ by the denominator).`, `One part is ${k}.${n > 1 ? ` You need ${n} parts.` : ''}`],
      steps: barModel(total, d, Array(d).fill(k)) + stepsList([`${total} ÷ ${d} = ${k} (one part).`, n > 1 ? `${k} × ${n} = ${n * k}.` : `So ${frac(1, d)} of ${total} = ${k}.`]) };
  } }
] };

/* =====================================================================
   DECIMALS
   ===================================================================== */
const dec = { id: 'y4-dec', year: 4, title: 'Decimals', emoji: '🔟', skills: [
  { id: 'dec4-tenths', title: 'Tenths & hundredths as decimals', gen() {
    if (Math.random() < 0.5) { const n = R(1, 9); return { prompt: `Write ${frac(n, 10)} as a decimal.`, answer: num(n / 10),
      hints: ['Tenths go in the first column after the decimal point.', `${n} tenths = 0.${n}`], steps: pvChart(n / 10, { dp: 1 }) + stepsList([`${frac(n, 10)} = 0.${n}`]) }; }
    const n = R(1, 99); return { prompt: `Write ${frac(n, 100)} as a decimal.`, answer: num(n / 100),
      hints: ['Hundredths go in the second column after the decimal point.', n < 10 ? `${n} hundredths = 0 tenths and ${n} hundredths.` : `${n} hundredths = ${Math.floor(n / 10)} tenths and ${n % 10} hundredths.`],
      steps: pvChart(n / 100, { dp: 2 }) + stepsList([`${frac(n, 100)} = ${fmt(n / 100)}`]) };
  } },
  { id: 'dec4-div10', title: 'Divide by 10 and 100', gen() {
    const k = pick([10, 100]), n = k === 10 ? R(1, 99) : R(1, 99);
    if (n % k === 0) return this.gen();
    return { prompt: `${n} ÷ ${k} = ${blank}`, answer: num(n / k),
      hints: [`Dividing by ${k} moves every digit ${k === 10 ? 'one place' : 'two places'} to the right.`, 'Remember the decimal point stays still — the digits move.'],
      steps: pvChart(n / k, { dp: k === 10 ? 1 : 2 }) + stepsList([`Move the digits ${k === 10 ? 'one place' : 'two places'} right.`, `${n} ÷ ${k} = ${fmt(n / k)}`]) };
  } },
  { id: 'dec4-round', title: 'Round decimals to the nearest whole', gen() {
    const w = R(0, 20), t = R(1, 9), n = w + t / 10, ans = t >= 5 ? w + 1 : w;
    return { prompt: `Round <b>${fmt(n)}</b> to the nearest whole number.`, answer: num(ans),
      hints: [`${fmt(n)} is between ${w} and ${w + 1}.`, 'Look at the tenths digit: 5 or more rounds up.'],
      steps: numberLine(w, w + 1, n) + stepsList([`The tenths digit is ${t}.`, `${t >= 5 ? '5 or more, round up' : 'Less than 5, round down'} → ${ans}.`]) };
  } },
  { id: 'dec4-compare', title: 'Compare decimals', gen() {
    const a = R(1, 9), b = R(1, 9); const set = [a / 10, a / 100, (a * 10 + b) / 100, (b * 10 + a) / 100].map((x) => E.H.rnd(x));
    const uniq = [...new Set(set)]; const big = Math.random() < 0.5; const ans = big ? Math.max(...uniq) : Math.min(...uniq);
    return { prompt: `Which is the <b>${big ? 'greatest' : 'smallest'}</b>?`, answer: choice(ans, uniq.filter((x) => x !== ans)),
      hints: ['Compare the ones first, then the tenths, then the hundredths.', 'Put them in a place value chart to compare.'],
      steps: stepsList(uniq.map((x) => `${fmt(x)} = ${Math.round(x * 100)} hundredths`).concat([`The ${big ? 'greatest' : 'smallest'} is ${fmt(ans)}.`])) };
  } }
] };

/* =====================================================================
   LENGTH, PERIMETER & AREA
   ===================================================================== */
const meas = { id: 'y4-meas', year: 4, title: 'Perimeter & area', emoji: '📏', skills: [
  { id: 'meas4-area', title: 'Area by counting squares', gen() {
    const w = R(2, 8), h = R(2, 6);
    return { prompt: `What is the area of this rectangle? <div class="small">(count the squares)</div>`, visual: gridRect(w, h), answer: num(w * h),
      hints: ['Area is the number of squares inside the shape.', `There are ${h} rows of ${w} squares.`],
      steps: gridRect(w, h) + stepsList([`${h} rows of ${w} = ${h} × ${w} = ${w * h} squares.`]) };
  } },
  { id: 'meas4-perim', title: 'Perimeter of rectangles', gen() {
    const l = R(3, 15), w = R(2, l), unit = pick(['cm', 'm']);
    if (Math.random() < 0.7) return { prompt: `What is the perimeter of this rectangle?`, visual: rectShape(l, w, unit), answer: num(2 * (l + w)),
      hints: ['Perimeter is the distance all the way round the outside.', `Add all 4 sides: ${l} + ${w} + ${l} + ${w}.`],
      steps: stepsList([`${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} ${unit}`, `Or: (${l} + ${w}) × 2 = ${2 * (l + w)} ${unit}`]) };
    return { prompt: `A rectangle has a perimeter of <b>${2 * (l + w)} ${unit}</b>. Its length is <b>${l} ${unit}</b>. How wide is it?`, answer: num(w),
      hints: [`Half the perimeter is one length + one width: ${l + w} ${unit}.`, `${l + w} − ${l} = ?`],
      steps: stepsList([`${2 * (l + w)} ÷ 2 = ${l + w}`, `${l + w} − ${l} = ${w} ${unit}`]) };
  } },
  { id: 'meas4-convert', title: 'Convert km, m, cm and mm', gen() {
    const [big, small, k] = pick([['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10]]), n = R(2, 9);
    if (Math.random() < 0.6) return { prompt: `${n} ${big} = ${blank} ${small}`, answer: num(n * k),
      hints: [`1 ${big} = ${k} ${small}.`, `Multiply by ${k}.`], steps: stepsList([`1 ${big} = ${k} ${small}`, `${n} × ${k} = ${n * k} ${small}`]) };
    return { prompt: `${n * k} ${small} = ${blank} ${big}`, answer: num(n),
      hints: [`1 ${big} = ${k} ${small}.`, `Divide by ${k}.`], steps: stepsList([`${n * k} ÷ ${k} = ${n} ${big}`]) };
  } }
] };

/* =====================================================================
   TIME
   ===================================================================== */
const pad2 = (n) => String(n).padStart(2, '0');
const time = { id: 'y4-time', year: 4, title: 'Time', emoji: '⏰', skills: [
  { id: 'time4-convert', title: 'Convert hours, minutes, seconds, days, weeks', gen() {
    const [a, b, k] = pick([['hours', 'minutes', 60], ['minutes', 'seconds', 60], ['weeks', 'days', 7], ['years', 'months', 12], ['days', 'hours', 24]]), n = R(2, 6);
    if (a === 'hours' && Math.random() < 0.4) { const m = pick([15, 20, 30, 45]); return { prompt: `How many minutes are in <b>${n} hours ${m} minutes</b>?`, answer: num(n * 60 + m),
      hints: ['1 hour = 60 minutes.', `${n} × 60 = ${n * 60}. Then add ${m}.`], steps: stepsList([`${n} × 60 = ${n * 60}`, `${n * 60} + ${m} = ${n * 60 + m} minutes`]) }; }
    return { prompt: `How many ${b} are in <b>${n} ${a}</b>?`, answer: num(n * k),
      hints: [`1 ${a.slice(0, -1)} = ${k} ${b}.`, `${n} × ${k} = ?`], steps: stepsList([`${n} × ${k} = ${n * k} ${b}`]) };
  } },
  { id: 'time4-24h', title: '12-hour and 24-hour clock', gen() {
    const h = R(1, 11), m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]), pm = Math.random() < 0.7;
    const h24 = pm ? h + 12 : h;
    if (Math.random() < 0.55) return { prompt: `Write <b>${h}:${pad2(m)} ${pm ? 'pm' : 'am'}</b> as a 24-hour time.<div class="small">Use the : key</div>`, answer: { kind: 'text', value: `${pad2(h24)}:${pad2(m)}` }, keys: [':'],
      hints: [pm ? 'For pm times, add 12 to the hours.' : 'For am times, keep the hours — but use 2 digits.', `24-hour times always have 4 digits.`],
      steps: stepsList([pm ? `${h} + 12 = ${h24}` : `${h} → ${pad2(h)}`, `${h}:${pad2(m)} ${pm ? 'pm' : 'am'} = ${pad2(h24)}:${pad2(m)}`]) };
    const right = `${h}:${pad2(m)} ${pm ? 'pm' : 'am'}`;
    return { prompt: `What is <b>${pad2(h24)}:${pad2(m)}</b> on a 12-hour clock?`, answer: choice(right, [`${h}:${pad2(m)} ${pm ? 'am' : 'pm'}`, `${(h + 2) % 12 || 12}:${pad2(m)} ${pm ? 'pm' : 'am'}`, `${pad2(h24)}:${pad2(m)} pm`], String),
      hints: ['If the hour is more than 12, take away 12 and it\'s pm.', 'Hours from 00 to 11 are am.'],
      steps: stepsList([pm ? `${h24} − 12 = ${h}, so it's pm.` : 'Less than 12, so it\'s am.', `${right}`]) };
  } },
  { id: 'time4-duration', title: 'How long? (durations)', gen() {
    const sh = R(1, 9), sm = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]), dur = R(25, 150);
    const end = sh * 60 + sm + dur, eh = Math.floor(end / 60), em = end % 60;
    return { prompt: `A film starts at <b>${sh}:${pad2(sm)} pm</b> and ends at <b>${eh > 12 ? eh - 12 : eh}:${pad2(em)} pm</b>. How many minutes long is it?`, answer: num(dur),
      hints: ['Count on to the next o\'clock first.', `From ${sh}:${pad2(sm)} to ${sh + 1}:00 is ${60 - sm} minutes.`],
      steps: stepsList([`${sh}:${pad2(sm)} → ${sh + 1}:00 is ${60 - sm} minutes.`, `${sh + 1}:00 → ${eh}:${pad2(em)} is ${end - (sh + 1) * 60} minutes.`, `${60 - sm} + ${end - (sh + 1) * 60} = ${dur} minutes.`]) };
  } }
] };

/* =====================================================================
   CAT4-STYLE REASONING (quantitative: number series & analogies)
   ===================================================================== */
function seriesOpts(ans, diff) { return choice(ans, shuffle([ans + 1, ans - 1, ans + diff, ans - diff, ans + 2, ans + 10, ans - 2]).filter((x) => x >= 0), fmt, 5); }
function genSeries(level) {
  const types = level === 6 ? ['add', 'sub', 'mul', 'alt', 'grow', 'sq', 'two'] : ['add', 'sub', 'mul', 'alt', 'grow'];
  const t = pick(types); let s = [], rule = '';
  if (t === 'add') { const a = R(1, 30), d = R(3, level === 6 ? 25 : 12); for (let i = 0; i < 6; i++) s.push(a + i * d); rule = `add ${d} each time`; }
  if (t === 'sub') { const d = R(3, level === 6 ? 15 : 9), a = d * 6 + R(1, 40); for (let i = 0; i < 6; i++) s.push(a - i * d); rule = `take away ${d} each time`; }
  if (t === 'mul') { const a = R(1, 4), m = level === 6 ? pick([2, 3]) : 2; for (let i = 0; i < 6; i++) s.push(a * m ** i); rule = `multiply by ${m} each time`; }
  if (t === 'alt') { const a = R(2, 20), x = R(3, 9), y = R(1, x - 1); let v = a; for (let i = 0; i < 6; i++) { s.push(v); v += i % 2 === 0 ? x : -y; } rule = `add ${x}, then take away ${y}, and repeat`; }
  if (t === 'grow') { let v = R(1, 10), d = R(1, 3); for (let i = 0; i < 6; i++) { s.push(v); v += d + i; } rule = `the jumps grow by 1 each time (+${d}, +${d + 1}, +${d + 2} …)`; }
  if (t === 'sq') { const o = R(1, 4); for (let i = 0; i < 6; i++) s.push((i + o) ** 2); rule = 'square numbers'; }
  if (t === 'two') { const m = 2, a = R(1, 5), c = R(1, 3); let v = a; for (let i = 0; i < 6; i++) { s.push(v); v = v * m + c; } rule = `×${m} then +${c}`; }
  const ans = s[5], diff = s[5] - s[4];
  return { prompt: `What comes next?<div class="series">${s.slice(0, 5).map(fmt).join('  ,  ')}  ,  ?</div>`, answer: seriesOpts(ans, Math.abs(diff) || 1),
    hints: ['Find the difference between each pair of numbers.', 'Is it adding, taking away, multiplying — or a pattern in the jumps?'],
    steps: stepsList([`The rule: ${rule}.`, `So the next number is ${fmt(ans)}.`]) };
}
function genAnalogy(level) {
  const rules = level === 6
    ? [['×', R(3, 9)], ['+', R(6, 30)], ['−', R(3, 12)], ['×2+', R(1, 5)], ['²', 0]]
    : [['×', R(2, 5)], ['+', R(3, 15)], ['−', R(2, 9)], ['÷', R(2, 5)]];
  const [op, k] = pick(rules);
  const f = (x) => op === '×' ? x * k : op === '+' ? x + k : op === '−' ? x - k : op === '÷' ? x / k : op === '²' ? x * x : x * 2 + k;
  const inp = () => op === '÷' ? k * R(2, 10) : op === '−' ? R(k + 1, k + 20) : op === '²' ? R(2, 12) : R(2, 12);
  const xs = new Set(); while (xs.size < 3) xs.add(inp());
  const [a, b, c] = [...xs];
  const ruleTxt = op === '×2+' ? `× 2 then + ${k}` : op === '²' ? 'multiply the number by itself' : `${op} ${k}`;
  return { prompt: `The numbers in each bracket follow the same rule.<div class="series">[ ${a} → ${f(a)} ]   [ ${b} → ${f(b)} ]   [ ${c} → ? ]</div>`,
    answer: choice(f(c), [f(c) + 1, f(c) - 1, f(c) + k || f(c) + 2, c + (f(a) - a), f(c) + 10].filter((x) => x >= 0), fmt, 5),
    hints: [`How do you get from ${a} to ${f(a)}?`, `Check the same rule works for ${b} → ${f(b)}.`],
    steps: stepsList([`Rule: ${ruleTxt}.`, `${c} → ${fmt(f(c))}.`]) };
}
function genMachine(level) {
  const m = R(2, level === 6 ? 9 : 5), c = R(1, level === 6 ? 20 : 10), sub = Math.random() < 0.3;
  const f = (x) => sub ? x * m - c : x * m + c;
  let a = R(2, 9), b = R(2, 12); while (b === a) b = R(2, 12);
  if (sub && f(a) < 0) a += c;
  if (level === 6) { // CAT4-style: work out the hidden rule from two examples
    let a2 = R(2, 12); while (a2 <= a || a2 === b) { a2 = R(2, 13); if (a >= 12) a = R(2, 6); }
    if (sub && f(a2) < 0) a2 += c;
    return { prompt: `A machine always does the same two steps.<div class="series">${a} → ${f(a)}     ${a2} → ${f(a2)}</div>${machine('× ?  then  ' + (sub ? '− ?' : '+ ?'))}What comes out if you put in <b>${b}</b>?`,
      answer: num(f(b)), keys: f(b) < 0 ? ['−'] : [],
      hints: [`Compare the inputs and outputs: ${a2} − ${a} = ${a2 - a} more in gives ${f(a2) - f(a)} more out — so it multiplies by ${m}.`, `${a} × ${m} = ${a * m}, and the output is ${f(a)}, so the second step is ${sub ? '− ' : '+ '}${c}.`],
      steps: stepsList([`Rule: × ${m} then ${sub ? '−' : '+'} ${c}.`, `${b} × ${m} = ${b * m}`, `${b * m} ${sub ? '−' : '+'} ${c} = ${f(b)}`]) };
  }
  return { prompt: `A machine changes numbers using two steps.<div class="series">${a} → ${f(a)}</div>${machine(`× ${m}  then  ${sub ? '−' : '+'} ${c}`)}What comes out if you put in <b>${b}</b>?`,
    answer: num(f(b)), keys: f(b) < 0 ? ['−'] : [],
    hints: [`First multiply ${b} by ${m}.`, `${b} × ${m} = ${b * m}. Now ${sub ? 'take away' : 'add'} ${c}.`],
    steps: stepsList([`${b} × ${m} = ${b * m}`, `${b * m} ${sub ? '−' : '+'} ${c} = ${f(b)}`]) };
}
const cat4 = { id: 'y4-cat4', year: 4, title: 'Reasoning (CAT4)', emoji: '🧠', skills: [
  { id: 'cat4-series', title: 'Number series — what comes next?', gen() { return genSeries(4); } },
  { id: 'cat4-analogy', title: 'Number analogies', gen() { return genAnalogy(4); } },
  { id: 'cat4-machine', title: 'Function machines', gen() { return genMachine(4); } }
] };

E.reasoning = { genSeries, genAnalogy, genMachine, ttStrategy, subInfo, addExchanges };
[pv, add, sub, tables, mf, mul, div, fr, dec, meas, time, cat4].forEach((t) => { E.TOPICS[t.id] = t; });
})();
