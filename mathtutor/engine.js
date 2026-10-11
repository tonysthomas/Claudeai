/* Maths Buddy — question engine.
 * Pure functions: question generators for every small step, answer checking,
 * and HTML renderers for school-method working (column methods, bus stop,
 * place value charts, bar models). No DOM access, so it runs in Node tests too.
 */
(function (root) {
'use strict';

/* ---------- helpers ---------- */
const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
const rnd = (x, dp = 6) => Math.round(x * 10 ** dp) / 10 ** dp;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function fmt(n) {
  n = rnd(n);
  const s = Math.abs(n).toLocaleString('en-GB', { maximumFractionDigits: 6 });
  return (n < 0 ? '−' : '') + s;
}
const frac = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
const mixed = (w, n, d) => (w ? `${w}` : '') + (n ? frac(n, d) : '');
function fracHTML(n, d, asMixed) {
  const g = gcd(n, d); n /= g; d /= g;
  if (d === 1) return String(n);
  if (asMixed && n > d) return mixed(Math.floor(n / d), n % d, d);
  return frac(n, d);
}
const PV = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions', 'ten millions'];
const PV1 = ['one', 'ten', 'hundred', 'thousand', 'ten thousand', 'hundred thousand', 'million', 'ten million'];
const PVH = ['O', 'T', 'H', 'Th', 'TTh', 'HTh', 'M', 'TM'];
const DIGIT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/* Multiple-choice answer: correct option first, then distractors; deduped & shuffled. */
function choice(correct, distractors, render = fmt, max = 4) {
  const seen = new Set(); const opts = [];
  const add = (v) => { const k = String(render(v)); if (!seen.has(k)) { seen.add(k); opts.push(k); } };
  add(correct); distractors.forEach(add);
  const label = opts[0];
  const sh = shuffle(opts.slice(0, max));
  return { kind: 'choice', options: sh, correct: sh.indexOf(label) };
}
const num = (value) => ({ kind: 'num', value: rnd(value) });
const yesNo = (yes) => ({ kind: 'choice', options: ['Yes', 'No'], correct: yes ? 0 : 1 });

/* ---------- visual renderers (HTML strings) ---------- */
function pvChart(n, opts = {}) {
  const neg = n < 0; n = Math.abs(n);
  const [ip, dp = ''] = String(rnd(n)).split('.');
  const cols = Math.max(opts.cols || 0, ip.length);
  const heads = PVH.slice(0, cols).reverse();
  const digits = ip.padStart(cols, ' ').split('');
  const decH = ['Tth', 'Hth', 'Thth'].slice(0, Math.max(dp.length, opts.dp || 0));
  const hi = opts.highlight; // place index (0 = ones) to highlight
  let h = '<table class="pvc"><tr>' + heads.map((x, i) => `<th class="${cols - 1 - i === hi ? 'hl' : ''}">${x}</th>`).join('');
  if (decH.length) h += '<th class="dot"></th>' + decH.map((x) => `<th>${x}</th>`).join('');
  h += '</tr><tr>' + digits.map((d, i) => `<td class="${cols - 1 - i === hi ? 'hl' : ''}">${d.trim()}</td>`).join('');
  if (decH.length) h += '<td class="dot">.</td>' + decH.map((_, i) => `<td>${dp[i] || ''}</td>`).join('');
  return h + '</tr></table>' + (neg ? '<div class="small">(negative)</div>' : '');
}

function calcTable(rows) {
  // rows: [{op, cells:[...], cls}]
  return '<table class="colcalc">' + rows.map((r) => `<tr class="${r.cls || ''}"><td class="op">${r.op || ''}</td>${r.cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') + '</table>';
}
const padCells = (n, len) => String(n).padStart(len, ' ').split('').map((c) => c.trim());

function colAdd(a, b) {
  const sum = a + b, len = String(sum).length;
  const A = padCells(a, len), B = padCells(b, len), S = padCells(sum, len);
  const carry = Array(len).fill(''); const steps = []; let c = 0;
  for (let i = len - 1; i >= 0; i--) {
    const p = len - 1 - i, da = +(A[i] || 0), db = +(B[i] || 0);
    if (A[i] === '' && B[i] === '') { steps.push(`${cap(PV[p])}: bring down the exchanged 1.`); break; }
    const tot = da + db + c;
    let t = `${cap(PV[p])}: ${da} + ${db}${c ? ' + 1 exchanged' : ''} = ${tot}.`;
    if (tot >= 10) { t += ` Write ${tot % 10} and exchange 10 ${PV[p]} for 1 ${PV1[p + 1]}.`; carry[i - 1] = '1'; c = 1; }
    else { t += ` Write ${tot}.`; c = 0; }
    steps.push(t);
  }
  const html = calcTable([
    { cells: A }, { op: '+', cells: B, cls: 'line' },
    { cells: S, cls: 'ans' }, { cells: carry.map((x) => x ? `<span class="carry">${x}</span>` : ''), cls: 'carryrow' }
  ]);
  return { html, steps };
}

function colSub(a, b) {
  const len = String(a).length;
  const A = padCells(a, len).map((x) => +(x || 0)), B = padCells(b, len);
  const top = A.slice(), gave = Array(len).fill(false), recv = Array(len).fill(false), chain = Array(len).fill(false);
  const steps = [];
  for (let i = len - 1; i >= 0; i--) {
    const p = len - 1 - i, db = +(B[i] || 0);
    if (top[i] < db) {
      let j = i - 1; while (top[j] === 0) j--;
      const before = top[i];
      top[j]--; gave[j] = true;
      for (let k = j + 1; k < i; k++) { top[k] = 9; gave[k] = recv[k] = chain[k] = true; }
      top[i] += 10; recv[i] = true;
      const pj = len - 1 - j;
      let t = `${cap(PV[p])}: ${before} − ${db}? Not enough ${PV[p]}. `;
      if (j === i - 1) t += `Exchange 1 ${PV1[pj]} for 10 ${PV[p]}.`;
      else t += `The ${PV.slice(p + 1, pj).join(' and ')} ${pj - p > 2 ? 'are' : 'is'} 0, so exchange 1 ${PV1[pj]} for 10 ${PV[pj - 1]} first, then keep exchanging down until you have 10 more ${PV[p]}.`;
      t += ` Now ${top[i]} − ${db} = ${top[i] - db}.`;
      steps.push(t);
    } else {
      steps.push(`${cap(PV[p])}: ${top[i]} − ${db} = ${top[i] - db}.`);
    }
  }
  const above = top.map((v, i) => {
    if (!gave[i] && !recv[i]) return '';
    if (chain[i]) return '<span class="exch">9</span>';
    if (gave[i]) return `<span class="exch">${recv[i] ? '<sup>1</sup>' + (v - 10) : v}</span>`;
    return '';
  });
  const topCells = A.map((d, i) => {
    if (i === 0 && d === 0 && len > 1) return '';
    if (gave[i]) return `<s>${d}</s>`;
    if (recv[i]) return `<sup class="exch">1</sup>${d}`;
    return String(d);
  });
  const html = calcTable([
    { cells: above, cls: 'exrow' }, { cells: topCells }, { op: '−', cells: B, cls: 'line' },
    { cells: padCells(a - b, len), cls: 'ans' }
  ]);
  return { html, steps };
}

function colMul(a, m) { // a × single digit
  const prod = a * m, len = String(prod).length;
  const A = padCells(a, len), P = padCells(prod, len), carry = Array(len).fill('');
  const steps = []; let c = 0;
  for (let i = len - 1; i >= 0; i--) {
    const p = len - 1 - i;
    if (A[i] === '') { if (c) steps.push(`${cap(PV[p])}: write the exchanged ${c}.`); break; }
    const v = +A[i] * m + c;
    let t = `${cap(PV[p])}: ${A[i]} × ${m}${c ? ` + ${c} exchanged` : ''} = ${v}.`;
    if (v >= 10) { c = Math.floor(v / 10); t += ` Write ${v % 10}, exchange ${c} into the ${PV[p + 1]}.`; carry[i - 1] = String(c); }
    else { c = 0; t += ` Write ${v}.`; }
    steps.push(t);
  }
  const html = calcTable([
    { cells: A }, { op: '×', cells: padCells(m, len), cls: 'line' },
    { cells: P, cls: 'ans' }, { cells: carry.map((x) => x ? `<span class="carry">${x}</span>` : ''), cls: 'carryrow' }
  ]);
  return { html, steps };
}

function longMul(a, b) { // a × 2-digit b
  const o = b % 10, t = Math.floor(b / 10), p1 = a * o, p2 = a * t * 10, prod = a * b;
  const len = String(prod).length;
  const html = calcTable([
    { cells: padCells(a, len) }, { op: '×', cells: padCells(b, len), cls: 'line' },
    { cells: padCells(p1, len), cls: 'part' }, { op: '+', cells: padCells(p2, len), cls: 'part line' },
    { cells: padCells(prod, len), cls: 'ans' }
  ]);
  const steps = [
    `Multiply by the ones: ${fmt(a)} × ${o} = ${fmt(p1)}.`,
    `Multiply by the tens: put a 0 in the ones column as a place holder (because it's ${t} tens), then ${fmt(a)} × ${t} → ${fmt(p2)}.`,
    `Add the two rows: ${fmt(p1)} + ${fmt(p2)} = ${fmt(prod)}.`
  ];
  return { html, steps };
}

function busStop(dividend, divisor) {
  const D = String(dividend).split('').map(Number);
  const q = [], carries = [], steps = []; let r = 0;
  D.forEach((d, i) => {
    const cur = r * 10 + d, qd = Math.floor(cur / divisor);
    const p = D.length - 1 - i;
    q.push(qd); carries.push(r);
    let t = `${cap(PV[p])}: how many ${divisor}s in ${cur}? ${qd}`;
    r = cur - qd * divisor;
    t += r ? ` remainder ${r}.` : '.';
    if (r && i < D.length - 1) t += ` Exchange the ${r} ${r === 1 ? PV1[p] : PV[p]} for ${r * 10} ${PV[p - 1]} — write a small ${r} by the next digit.`;
    steps.push(t);
  });
  if (r) steps.push(`Nothing left to divide, so the remainder is ${r}.`);
  let firstNZ = q.findIndex((x) => x > 0); if (firstNZ < 0) firstNZ = q.length - 1;
  const html = '<table class="bus"><tr><td></td>' + q.map((x, i) => `<td class="qd">${i < firstNZ ? '<span class="faint">0</span>' : x}</td>`).join('') + (r ? `<td class="qd rem">r ${r}</td>` : '') + '</tr>' +
    `<tr><td class="dvs">${divisor}</td>` + D.map((d, i) => `<td class="dd">${carries[i] ? `<sup class="carry">${carries[i]}</sup>` : ''}${d}</td>`).join('') + (r ? '<td></td>' : '') + '</tr></table>';
  return { html, steps, q: Math.floor(dividend / divisor), r };
}

function longDiv(dividend, divisor) {
  const D = String(dividend).split('').map(Number), n = D.length;
  const q = []; const rows = []; const steps = []; let cur = 0, started = false;
  for (let i = 0; i < n; i++) {
    cur = cur * 10 + D[i];
    const qd = Math.floor(cur / divisor); q.push(qd);
    if (!started && qd === 0 && i < n - 1) continue;
    started = true;
    const prod = qd * divisor, rem = cur - prod;
    steps.push(`How many ${divisor}s in ${cur}? ${divisor} × ${qd} = ${prod}. Write ${qd} on top. ${cur} − ${prod} = ${rem}.` + (i < n - 1 ? ` Bring down the ${D[i + 1]}.` : ''));
    rows.push({ val: prod, end: i, sub: true });
    if (i < n - 1) rows.push({ val: rem * 10 + D[i + 1], end: i + 1 });
    else rows.push({ val: rem, end: i, last: true });
    cur = rem;
  }
  const cell = (val, end, k) => { const s = String(val); const start = end - s.length + 1; return k >= start && k <= end ? s[k - start] : ''; };
  let html = '<table class="ldiv"><tr><td></td>' + q.map((x, i) => `<td class="qd">${q.slice(0, i + 1).every((y) => y === 0) && i < n - 1 ? '' : x}</td>`).join('') + '</tr>';
  html += `<tr><td class="dvs">${divisor}</td>` + D.map((d) => `<td class="dd">${d}</td>`).join('') + '</tr>';
  rows.forEach((rw) => { html += `<tr class="${rw.sub ? 'sub' : ''}"><td class="op">${rw.sub ? '−' : ''}</td>` + D.map((_, k) => `<td>${cell(rw.val, rw.end, k)}</td>`).join('') + '</tr>'; });
  html += '</table>';
  const mults = []; for (let k = 1; k <= 9; k++) mults.push(`${k}× = ${divisor * k}`);
  html += `<div class="mults"><b>Multiples of ${divisor}:</b> ${mults.join(' · ')}</div>`;
  return { html, steps, q: Math.floor(dividend / divisor), r: dividend % divisor };
}

function dotArray(r, c) {
  if (r * c > 144) return '';
  let h = `<div class="arr" style="grid-template-columns:repeat(${c},1fr)">`;
  for (let i = 0; i < r * c; i++) h += '<i></i>';
  return h + `</div><div class="small">${r} rows of ${c}</div>`;
}
function fracBar(n, d, label = '') {
  let h = '<div class="fbar">';
  for (let i = 0; i < d; i++) h += `<span class="${i < n ? 'on' : ''}">${label}</span>`;
  return h + '</div>';
}
function barModel(total, parts, labels = []) {
  let h = `<div class="bm"><div class="bmtop">${total}</div><div class="fbar">`;
  for (let i = 0; i < parts; i++) h += `<span>${labels[i] || ''}</span>`;
  return h + '</div></div>';
}
function numberLine(lo, hi, val, mid = true) {
  const w = 300, x = (v) => 20 + (v - lo) / (hi - lo) * (w - 40);
  let s = `<svg class="nline" viewBox="0 0 ${w} 62"><line x1="20" y1="30" x2="${w - 20}" y2="30" />`;
  [lo, hi].forEach((v) => { s += `<line x1="${x(v)}" y1="22" x2="${x(v)}" y2="38"/><text x="${x(v)}" y="54">${fmt(v)}</text>`; });
  if (mid) { const m = (lo + hi) / 2; s += `<line class="mid" x1="${x(m)}" y1="25" x2="${x(m)}" y2="35"/><text class="midt" x="${x(m)}" y="54">${fmt(m)}</text>`; }
  if (val !== undefined) s += `<circle cx="${x(val)}" cy="30" r="5"/><text class="val" x="${x(val)}" y="14">${fmt(val)}</text>`;
  return s + '</svg>';
}
function gridRect(w, h, label) {
  const u = Math.min(22, Math.floor(240 / Math.max(w, h)));
  let s = `<svg class="grid" viewBox="0 0 ${w * u + 2} ${h * u + 2}" style="max-width:${w * u + 2}px">`;
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) s += `<rect x="${1 + i * u}" y="${1 + j * u}" width="${u}" height="${u}"/>`;
  return s + '</svg>' + (label ? `<div class="small">${label}</div>` : '');
}
function rectShape(w, h, unit, opts = {}) {
  const W = 220, hh = Math.min(150, Math.max(70, Math.round(220 * h / w)));
  const wl = opts.wLabel != null ? opts.wLabel : `${w} ${unit}`, hl = opts.hLabel != null ? opts.hLabel : `${h} ${unit}`;
  let s = `<svg class="shape" viewBox="0 0 300 ${hh + 40}"><rect x="40" y="10" width="${W}" height="${hh}"/>`;
  s += `<text x="${40 + W / 2}" y="${hh + 32}">${wl}</text><text x="${40 + W + 8}" y="${10 + hh / 2}" text-anchor="start">${hl}</text>`;
  return s + '</svg>';
}
function triShape(b, h, unit) {
  return `<svg class="shape" viewBox="0 0 300 170"><polygon points="40,140 260,140 ${R(80, 220)},20"/><line class="dash" x1="150" y1="140" x2="150" y2="20"/>` +
    `<text x="150" y="162">${b} ${unit}</text><text x="156" y="85" text-anchor="start">${h} ${unit}</text></svg>`;
}
function cuboid(l, w, h, unit) {
  return `<svg class="shape" viewBox="0 0 300 180"><polygon points="40,60 190,60 190,150 40,150"/><polygon points="40,60 90,20 240,20 190,60"/><polygon points="190,60 240,20 240,110 190,150"/>` +
    `<text x="115" y="170">${l} ${unit}</text><text x="250" y="70" text-anchor="start">${h} ${unit}</text><text x="232" y="148" text-anchor="start">${w} ${unit}</text></svg>`;
}
function machine(rule) { return `<div class="machine"><span>IN</span><b>${rule}</b><span>OUT</span></div>`; }
const stepsList = (arr) => '<ol class="steps">' + arr.map((s) => `<li>${s}</li>`).join('') + '</ol>';

/* ---------- answer checking ---------- */
function parseFracInput(s) {
  let m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const w = +m[1], n = +m[2], d = +m[3]; if (!d) return null; return { n: w * d + Math.sign(w || 1) * n, d, fn: n, fd: d }; }
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) { if (!+m[2]) return null; return { n: +m[1], d: +m[2], fn: +m[1], fd: +m[2] }; }
  m = s.match(/^-?\d+$/);
  if (m) return { n: +s, d: 1, fn: 0, fd: 1 };
  return null;
}
function norm(s) { return String(s).replace(/,/g, '').replace(/−/g, '-').replace(/\s+/g, ' ').trim().toLowerCase(); }
function check(q, input) {
  const a = q.answer;
  if (a.kind === 'choice') return input === a.correct;
  const s = norm(input);
  if (!s) return false;
  switch (a.kind) {
    case 'num': return /^-?(\d+\.?\d*|\.\d+)$/.test(s) && Math.abs(parseFloat(s) - a.value) < 1e-9;
    case 'rem': {
      const m = s.match(/^(\d+)\s*r\s*(\d+)$/);
      if (m) return +m[1] === a.q && +m[2] === a.r;
      return a.r === 0 && /^\d+$/.test(s) && +s === a.q;
    }
    case 'frac': {
      const v = parseFracInput(s); if (!v) return false;
      if (v.n * a.d !== a.n * v.d) return false;
      if (a.simplest && v.fd > 1 && gcd(v.fn, v.fd) !== 1) return false;
      return true;
    }
    case 'text': return s.replace(/\s/g, '') === String(a.value).toLowerCase().replace(/\s/g, '');
  }
  return false;
}
function answerText(q) {
  const a = q.answer;
  switch (a.kind) {
    case 'num': return fmt(a.value);
    case 'rem': return a.r ? `${fmt(a.q)} r ${a.r}` : fmt(a.q);
    case 'frac': return fracHTML(a.n, a.d, a.mixed);
    case 'text': return a.value;
    case 'choice': return a.options[a.correct];
  }
}
function canonicalInput(q) { // what a perfect learner would type (used by tests)
  const a = q.answer;
  switch (a.kind) {
    case 'num': return String(a.value);
    case 'rem': return a.r ? `${a.q} r ${a.r}` : String(a.q);
    case 'frac': { const g = gcd(a.n, a.d); return a.d / g === 1 ? String(a.n / g) : `${a.n / g}/${a.d / g}`; }
    case 'text': return a.value;
    case 'choice': return a.correct;
  }
}
function keysFor(q) {
  if (q.keys) return q.keys;
  switch (q.answer.kind) {
    case 'rem': return ['r'];
    case 'frac': return ['/', '␣'];
    case 'num': { const v = q.answer.value; const k = []; if (!Number.isInteger(v)) k.push('.'); if (v < 0) k.push('−'); return k; }
    default: return [];
  }
}

const H = { R, pick, shuffle, gcd, lcm, rnd, fmt, frac, mixed, fracHTML, cap, choice, num, yesNo, PV, PV1, DIGIT_WORDS,
  pvChart, calcTable, colAdd, colSub, colMul, longMul, busStop, longDiv, dotArray, fracBar, barModel, numberLine, gridRect, rectShape, triShape, cuboid, machine, stepsList };

const TOPICS = {};
/* Build one question for a small step. ctx: { recent: Set of prompts to avoid, weakTags: [] } */
function generate(topicId, skillId, ctx = {}) {
  const t = TOPICS[topicId]; if (!t) throw new Error('Unknown topic ' + topicId);
  const s = t.skills.find((x) => x.id === skillId) || t.skills[0];
  let q;
  for (let tries = 0; tries < 8; tries++) {
    q = s.gen(ctx);
    if (!ctx.recent || !ctx.recent.has(q.prompt)) break;
  }
  q.topic = t.id; q.skill = s.id; q.skillTitle = s.title;
  q.hints = q.hints || []; q.steps = q.steps || ''; q.visual = q.visual || '';
  q.keys = keysFor(q);
  return q;
}

const api = { H, check, answerText, canonicalInput, keysFor, parseFracInput, norm, TOPICS, generate };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.MTEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
