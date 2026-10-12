/* Maths Buddy — app (UI, storage, gamification, planning, reports). Offline, device storage only. */
(function () {
'use strict';
const E = window.MTEngine, C = window.MTCurriculum, H = E.H;
const T = E.TOPICS;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'mathbuddy.v1';
const pad2 = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mondayOf = (d) => { const x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); };
const fmtDate = (d, o = { weekday: 'short', day: 'numeric', month: 'short' }) => d.toLocaleDateString('en-GB', o);
const pct = (x) => (x == null ? '—' : Math.round(x) + '%');
const sum = (a) => a.reduce((x, y) => x + y, 0);

/* =========================================================================
   STORAGE
   ========================================================================= */
function newKid(id, name, year, avatar, color, focus) {
  return { id, name, year, avatar, color, focus, points: 0, badges: {}, best: {}, days: {}, skills: {}, tags: {}, correct: 0, comebacks: 0, override: null };
}
function defaults() {
  return {
    v: 1,
    settings: { pin: null, terms: Object.assign({}, C.DEFAULT_TERMS), sessionMins: 60, days: [1, 2, 3, 4, 5], sound: true, speech: true },
    kids: {
      jaden: newKid('jaden', 'Jaden', 6, '🦁', '#2563eb', ['y6-pv', 'y6-div', 'y6-fmp']),
      evangeline: newKid('evangeline', 'Evangeline', 4, '🦄', '#c026d3', ['y4-sub', 'y4-mf', 'y4-div', 'y4-tables'])
    },
    log: [], sessions: [], checks: []
  };
}
let DB;
function load() {
  try { const raw = localStorage.getItem(KEY); DB = raw ? JSON.parse(raw) : defaults(); }
  catch (e) { DB = defaults(); }
  const d = defaults();
  DB.settings = Object.assign(d.settings, DB.settings || {});
  DB.settings.terms = Object.assign({}, C.DEFAULT_TERMS, DB.settings.terms || {});
  DB.kids = DB.kids || d.kids;
  Object.values(DB.kids).forEach((k) => { const base = newKid(k.id, k.name, k.year, k.avatar, k.color, k.focus || []); Object.keys(base).forEach((x) => { if (k[x] === undefined) k[x] = base[x]; }); });
  ['log', 'sessions', 'checks'].forEach((x) => { DB[x] = DB[x] || []; });
}
let saveWarned = false;
function save() {
  if (DB.log.length > 15000) DB.log = DB.log.slice(-12000);
  try { localStorage.setItem(KEY, JSON.stringify(DB)); }
  catch (e) { if (!saveWarned) { saveWarned = true; toast('⚠️ Could not save progress on this device (storage full or private mode).'); } }
}
const kids = () => Object.values(DB.kids);
const K = (id) => DB.kids[id];

/* =========================================================================
   MASTERY
   ========================================================================= */
const topicsFor = (year) => Object.values(T).filter((t) => t.year === year);
/* Mastery % = accuracy over the last 10 answers. "Secure" also needs enough evidence (5+ recent answers). */
function skillMastery(kid, sid) {
  const st = kid.skills[sid]; if (!st || !st.n) return null;
  return Math.round(100 * sum(st.recent) / st.recent.length);
}
function slevel(kid, sid) {
  const m = skillMastery(kid, sid); if (m == null) return 'new';
  if (m < 50) return 'red';
  return m >= 80 && kid.skills[sid].recent.length >= 5 ? 'green' : 'amber';
}
const secure = (kid, sid) => slevel(kid, sid) === 'green';
function topicMastery(kid, tid) {
  const t = T[tid]; const ms = t.skills.map((s) => skillMastery(kid, s.id));
  const started = ms.filter((m) => m != null).length;
  return { pct: started ? Math.round(sum(ms.map((m) => m || 0)) / ms.length) : null, started, secure: t.skills.filter((s) => secure(kid, s.id)).length, total: ms.length };
}
const level = (m) => (m == null ? 'new' : m >= 80 ? 'green' : m >= 50 ? 'amber' : 'red');
const levelName = { new: 'Not started', red: 'Needs help', amber: 'Getting there', green: 'Secure' };
function nextSkill(kid, tid) {
  const t = T[tid];
  return (t.skills.find((s) => !secure(kid, s.id)) || H.pick(t.skills));
}
function weakTags(kid) {
  return Object.entries(kid.tags).filter(([, r]) => r.length >= 3 && sum(r) / r.length < 0.7).map(([t]) => t);
}

/* =========================================================================
   SCHOOL CALENDAR & WEEKLY PLAN
   ========================================================================= */
function schoolWeek(date) {
  const t = DB.settings.terms; const d = startOfDay(date);
  const order = [['autumn', t.autumn, t.spring], ['spring', t.spring, t.summer], ['summer', t.summer, t.end]];
  for (const [name, a, b] of order) {
    if (!a || !b) continue;
    const s = parseDay(a), e = parseDay(b);
    if (d >= mondayOf(s) && d < e) return { term: name, week: Math.floor((mondayOf(d) - mondayOf(s)) / (7 * 864e5)) + 1 };
  }
  return null;
}
function calendarFor(kid, date) {
  const sw = schoolWeek(date); const cal = C.CALENDAR[kid.year];
  if (!sw || !cal) return { block: 'Holiday', topic: null, sw };
  const blocks = cal[sw.term]; let w = 0;
  for (const b of blocks) {
    if (sw.week <= w + b.weeks) {
      const topics = b.topics.filter((x) => T[x]);
      const i = topics.length ? Math.min(topics.length - 1, Math.floor((sw.week - w - 1) * topics.length / b.weeks)) : -1;
      return { block: b.block, topic: i >= 0 ? topics[i] : null, sw, soon: b.soon };
    }
    w += b.weeks;
  }
  const last = blocks[blocks.length - 1];
  return { block: last.block, topic: last.topics[0] || null, sw };
}
function planWeekStart(date = new Date()) {
  const wd = date.getDay(); // on a weekend with no planned session, show the coming week
  if ((wd === 6 || wd === 0) && !DB.settings.days.includes(wd)) return mondayOf(addDays(date, wd === 6 ? 2 : 1));
  return mondayOf(date);
}
function weekPlan(kid, date = new Date()) {
  const ws = planWeekStart(date), wk = dayKey(ws);
  const cal = calendarFor(kid, ws);
  const ov = kid.override && kid.override.week === wk && T[kid.override.topic] ? kid.override.topic : null;
  const focus = kid.focus.filter((x) => T[x]);
  const main = ov || cal.topic || focus[0] || topicsFor(kid.year)[0].id;
  let boosts = focus.filter((x) => x !== main);
  if (!boosts.length) boosts = [main];
  boosts.sort((a, b) => (topicMastery(kid, a).pct || 0) - (topicMastery(kid, b).pct || 0));
  const mainSkills = T[main].skills.filter((s) => !secure(kid, s.id));
  const days = DB.settings.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const lastDay = days[days.length - 1];
  const plan = days.map((dow, i) => {
    const date = addDays(ws, (dow + 6) % 7);
    const isCheck = dow === lastDay && days.length > 2;
    const learnSkill = mainSkills.length ? mainSkills[Math.min(i, mainSkills.length - 1)] : T[main].skills[i % T[main].skills.length];
    const bt = boosts[i % boosts.length];
    return { date, dow, isCheck, parts: missionParts(kid, { main, learnSkill, bt, isCheck, i }) };
  });
  return { ws, wk, cal, override: !!ov, main, boosts, days: plan };
}
function warmupFor(kid, i) {
  if (kid.year <= 4) {
    const tt = T['y4-tables'].skills.filter((s) => !['tt-related'].includes(s.id));
    const weak = tt.find((s) => !secure(kid, s.id)) || H.pick(tt);
    return { topic: 'y4-tables', skill: weak.id };
  }
  return i % 2 ? { topic: 'y6-div', skill: 'div6-facts' } : { topic: 'y4-tables', skill: 'tt-mixed' };
}
function missionParts(kid, o) {
  const wu = warmupFor(kid, o.i);
  const parts = [{ key: 'warmup', icon: '🔥', title: 'Warm-up', sub: T[wu.topic].skills.find((s) => s.id === wu.skill).title, mode: 'practice', topic: wu.topic, skill: wu.skill, n: 5 }];
  if (o.main) {
    if (o.isCheck) parts.push({ key: 'learn', icon: '📝', title: 'Weekly check', sub: T[o.main].title, mode: 'check', topic: o.main });
    else parts.push({ key: 'learn', icon: '📘', title: 'Learn', sub: `${T[o.main].title}: ${o.learnSkill.title}`, mode: 'practice', topic: o.main, skill: o.learnSkill.id, n: 10, teach: true });
  }
  const bs = nextSkill(kid, o.bt);
  parts.push({ key: 'boost', icon: '💪', title: 'Boost', sub: `${T[o.bt].title}: ${bs.title}`, mode: 'practice', topic: o.bt, skill: bs.id, n: 8 });
  const ch = kid.year <= 4 ? (o.i % 2 ? 'sprint' : 'mtc') : (o.i % 2 ? 'cat4' : 'sprint');
  parts.push({ key: 'challenge', icon: '⚡', title: 'Challenge', sub: CHALLENGES[ch].name, mode: ch });
  return parts;
}
function todaysMission(kid) {
  const today = new Date();
  const p = weekPlan(kid, today);
  const d = p.days.find((x) => dayKey(x.date) === dayKey(today));
  if (d) return { parts: d.parts, isCheck: d.isCheck, plan: p };
  // not a school-plan day: lighter mission
  const parts = missionParts(kid, { main: null, bt: p.boosts[0], i: today.getDay() });
  return { parts, weekend: true, plan: p };
}
function partDone(kid, key, dk = dayKey()) { return DB.sessions.some((s) => s.k === kid.id && s.part === key && s.day === dk && s.complete); }

/* =========================================================================
   GAMIFICATION
   ========================================================================= */
const RANKS = [[0, 'Starter'], [250, 'Explorer'], [750, 'Problem Solver'], [1500, 'Maths Star'], [3000, 'Maths Hero'], [6000, 'Maths Legend'], [12000, 'Grand Master']];
const rankOf = (p) => { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) if (p >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; } return { name: r[1], next }; };
const CHALLENGES = {
  sprint: { name: 'Beat the Clock', icon: '⏱️', desc: '60 seconds — how many can you get?' },
  mtc: { name: 'Times Tables Check', icon: '✖️', desc: '25 questions, 6 seconds each — like the real Year 4 check.' },
  cat4: { name: 'Reasoning Challenge', icon: '🧠', desc: 'CAT4-style number series and analogies. 12 questions.' }
};
const BADGES = [
  { id: 'first', icon: '🌟', name: 'First Steps', desc: 'Finish your first session' },
  { id: 'mission', icon: '🎯', name: 'Mission Complete', desc: 'Finish every part of a day\'s mission' },
  { id: 'streak10', icon: '🔥', name: 'Hot Streak', desc: '10 right in a row' },
  { id: 'perfect', icon: '💎', name: 'Perfect Ten', desc: '10/10 first time, no hints' },
  { id: 'days3', icon: '📅', name: '3-Day Streak', desc: 'Practise 3 days in a row' },
  { id: 'days7', icon: '🏆', name: 'Week Warrior', desc: 'Practise 7 days in a row' },
  { id: 'comeback', icon: '💪', name: 'Never Give Up', desc: 'Get 10 questions right on a second try' },
  { id: 'secure1', icon: '✅', name: 'Step Master', desc: 'Make a small step secure (green)' },
  { id: 'secure10', icon: '🧗', name: 'Climber', desc: 'Make 10 small steps secure' },
  { id: 'c100', icon: '💯', name: 'Century', desc: '100 correct answers' },
  { id: 'c500', icon: '🚀', name: '500 Club', desc: '500 correct answers' },
  { id: 'p1000', icon: '🪙', name: 'Point Collector', desc: 'Earn 1,000 points' },
  { id: 'p5000', icon: '👑', name: 'Maths Royalty', desc: 'Earn 5,000 points' },
  { id: 'speed15', icon: '⚡', name: 'Lightning', desc: '15+ in Beat the Clock' },
  { id: 'speed25', icon: '🌩️', name: 'Thunderbolt', desc: '25+ in Beat the Clock' },
  { id: 'mtc20', icon: '✖️', name: 'Tables Ace', desc: '20+/25 in the Times Tables Check' },
  { id: 'mtc25', icon: '🥇', name: 'Times Table Titan', desc: '25/25 in the Times Tables Check' },
  { id: 'cat10', icon: '🧠', name: 'Big Thinker', desc: '10+/12 in the Reasoning Challenge' },
  { id: 'check90', icon: '📝', name: 'Test Ace', desc: '90%+ in a quick check' }
];
const topicBadge = (t) => ({ id: 'topic:' + t.id, icon: t.emoji, name: `${t.title} Champion`, desc: `Make every step in ${t.title} secure` });
function allBadges(kid) { return BADGES.concat(topicsFor(kid.year).map(topicBadge)); }
function streakDays(kid) {
  let n = 0, d = new Date();
  if (!kid.days[dayKey(d)]) d = addDays(d, -1);
  while (kid.days[dayKey(d)]) { n++; d = addDays(d, -1); }
  return n;
}
function award(kid, id, list) { if (!kid.badges[id]) { kid.badges[id] = Date.now(); list.push(id); } }
function checkBadges(kid, sess) {
  const got = [];
  const res = sess ? sess.results : [];
  if (sess) award(kid, 'first', got);
  if (sess && sess.bestRun >= 10) award(kid, 'streak10', got);
  if (sess && res.length >= 10 && res.every((r) => r.sc === 1) && (sess.mode === 'practice')) award(kid, 'perfect', got);
  const sd = streakDays(kid); if (sd >= 3) award(kid, 'days3', got); if (sd >= 7) award(kid, 'days7', got);
  if (kid.comebacks >= 10) award(kid, 'comeback', got);
  const nSecure = Object.keys(kid.skills).filter((s) => secure(kid, s)).length;
  if (nSecure >= 1) award(kid, 'secure1', got); if (nSecure >= 10) award(kid, 'secure10', got);
  if (kid.correct >= 100) award(kid, 'c100', got); if (kid.correct >= 500) award(kid, 'c500', got);
  if (kid.points >= 1000) award(kid, 'p1000', got); if (kid.points >= 5000) award(kid, 'p5000', got);
  if (sess && sess.mode === 'sprint') { const c = res.filter((r) => r.sc > 0).length; if (c >= 15) award(kid, 'speed15', got); if (c >= 25) award(kid, 'speed25', got); }
  if (sess && sess.mode === 'mtc') { const c = res.filter((r) => r.sc > 0).length; if (c >= 20) award(kid, 'mtc20', got); if (c >= 25) award(kid, 'mtc25', got); }
  if (sess && sess.mode === 'cat4' && res.filter((r) => r.sc > 0).length >= 10) award(kid, 'cat10', got);
  if (sess && sess.mode === 'check' && res.length && sum(res.map((r) => r.sc)) / res.length >= 0.9) award(kid, 'check90', got);
  topicsFor(kid.year).forEach((t) => { const m = topicMastery(kid, t.id); if (m.secure === m.total) award(kid, 'topic:' + t.id, got); });
  if (sess && sess.part) { const m = todaysMission(kid); if (m.parts.every((p) => partDone(kid, p.key))) award(kid, 'mission', got); }
  return got;
}
const badgeById = (kid, id) => allBadges(kid).find((b) => b.id === id) || { icon: '🏅', name: id, desc: '' };

/* =========================================================================
   SOUND, SPEECH, CONFETTI, TOAST
   ========================================================================= */
let AC = null;
function beep(type) {
  if (!DB.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === 'good' ? [660, 880] : type === 'badge' ? [523, 659, 784, 1046] : [220];
    notes.forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain(); o.type = type === 'bad' ? 'triangle' : 'sine'; o.frequency.value = f;
      const t0 = AC.currentTime + i * 0.09; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + 0.25);
    });
  } catch (e) { /* audio not available */ }
}
function speakText(html) {
  if (!DB.settings.speech || !('speechSynthesis' in window)) return;
  const div = document.createElement('div');
  div.innerHTML = html.replace(/<span class="frac"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, ' $1 over $2 ').replace(/<span class="blank">\?<\/span>/g, ' what ');
  const txt = div.textContent.replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/=/g, ' equals ').replace(/²/g, ' squared').replace(/³/g, ' cubed').replace(/\s+/g, ' ');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt); u.lang = 'en-GB'; u.rate = 0.92;
  const v = speechSynthesis.getVoices().find((x) => x.lang === 'en-GB'); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];
  const P = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5, r: 4 + Math.random() * 6, c: H.pick(cols), vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4, a: Math.random() * 6 }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    P.forEach((p) => { p.y += p.vy; p.x += p.vx; p.a += 0.1; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore(); });
    if (++f < 150) requestAnimationFrame(tick); else c.remove();
  })();
}
let toastT;
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.innerHTML = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* =========================================================================
   SESSIONS (practice, check, challenges)
   ========================================================================= */
let S = null;          // active session
let timers = [], qTimers = [];
const clearQTimers = () => { qTimers.forEach((t) => { clearTimeout(t); clearInterval(t); }); qTimers = []; };
const clearTimers = () => { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; clearQTimers(); };

function buildPractice(kid, tid, sid, n) {
  const t = T[tid]; const focus = sid ? t.skills.find((s) => s.id === sid) : nextSkill(kid, tid);
  const fi = t.skills.indexOf(focus);
  const earlier = t.skills.slice(0, fi).filter((s) => kid.skills[s.id]);
  const q = [];
  for (let i = 0; i < n; i++) q.push({ topic: tid, skill: (!sid && earlier.length && i % 4 === 3) ? H.pick(earlier).id : focus.id });
  return q;
}
function buildCheck(tid) {
  const sk = T[tid].skills; const n = Math.max(8, Math.min(12, sk.length * 2));
  return H.shuffle(Array.from({ length: n }, (_, i) => ({ topic: tid, skill: sk[i % sk.length].id })));
}
function sprintItem(kid) {
  const pool = kid.year <= 4
    ? [['y4-tables', 'tt-mixed'], ['y4-tables', 'tt-div'], ['y4-sub', 'sub4-mental'], ['y4-pv', 'pv4-more'], ['y4-mul', 'mul4-10-100'], ['y4-tables', 'tt-2-5-10']]
    : [['y4-tables', 'tt-mixed'], ['y6-div', 'div6-facts'], ['y6-fmp', 'fmp6-sqcube'], ['y6-pv', 'pv6-more'], ['y6-dec', 'dec6-x10'], ['y6-ooo', 'ooo6-basic'], ['y4-tables', 'tt-div']];
  const [topic, skill] = H.pick(pool); return { topic, skill };
}
function startSession(o) {
  clearTimers();
  const kid = K(o.kid);
  S = Object.assign({ idx: 0, results: [], queue: [], extra: 0, start: Date.now(), run: 0, bestRun: 0, points: 0, recent: new Set(), day: dayKey() }, o);
  if (o.mode === 'practice') S.queue = buildPractice(kid, o.topic, o.skill, o.n || 10);
  else if (o.mode === 'check') S.queue = buildCheck(o.topic);
  else if (o.mode === 'mtc') S.queue = Array.from({ length: 25 }, () => ({ topic: 'y4-tables', skill: H.pick(['tt-2-5-10', 'tt-3-4-8', 'tt-6-9', 'tt-6-9', 'tt-7-11-12', 'tt-7-11-12', 'tt-3-4-8']) }));
  else if (o.mode === 'cat4') { const tid = kid.year >= 6 ? 'y6-cat4' : 'y4-cat4'; S.queue = Array.from({ length: 12 }, (_, i) => ({ topic: tid, skill: T[tid].skills[i % 3].id })); S.queue = H.shuffle(S.queue); }
  else if (o.mode === 'sprint') { S.deadline = Date.now() + 60000; timers.push(setInterval(tickSprint, 200)); }
  view = 'play';
  nextQuestion();
}
const isChallenge = () => ['sprint', 'mtc', 'cat4'].includes(S.mode);
const allowHelp = () => S.mode === 'practice';
function nextQuestion() {
  clearQTimers();
  const kid = K(S.kid);
  if (S.mode !== 'sprint' && S.idx >= S.queue.length) return finishSession(true);
  if (S.mode === 'sprint' && Date.now() >= S.deadline) return finishSession(true);
  const item = S.mode === 'sprint' ? sprintItem(kid) : S.queue[S.idx];
  S.q = E.generate(item.topic, item.skill, { recent: S.recent, weakTags: weakTags(kid) });
  S.recent.add(S.q.prompt);
  S.attempt = 0; S.hints = 0; S.input = ''; S.phase = 'ask'; S.wrongChoices = []; S.qStart = Date.now();
  render();
  const per = S.mode === 'mtc' ? 6000 : S.mode === 'cat4' ? 30000 : 0;
  if (per) {
    S.qDeadline = Date.now() + per;
    qTimers.push(setTimeout(() => { if (S && S.phase === 'ask') submit(null, true); }, per));
    qTimers.push(setInterval(() => { const b = $('#qtimer'); if (b && S) b.style.width = Math.max(0, (S.qDeadline - Date.now()) / per * 100) + '%'; }, 100));
  }
}
function tickSprint() {
  if (!S || S.mode !== 'sprint') return;
  const left = Math.max(0, S.deadline - Date.now());
  const b = $('#qtimer'); if (b) b.style.width = (left / 600) + '%';
  const tl = $('#timeleft'); if (tl) tl.textContent = Math.ceil(left / 1000) + 's';
  if (left <= 0) { clearTimers(); finishSession(true); }
}
function record(sc) {
  const kid = K(S.kid), q = S.q;
  const st = kid.skills[q.skill] || (kid.skills[q.skill] = { n: 0, c: 0, recent: [], last: 0 });
  const before = secure(kid, q.skill);
  st.n++; if (sc > 0) st.c++; st.recent.push(sc); if (st.recent.length > 10) st.recent.shift(); st.last = Date.now();
  if (q.tag) { const r = kid.tags[q.tag] || (kid.tags[q.tag] = []); r.push(sc); if (r.length > 10) r.shift(); }
  if (sc > 0) kid.correct++;
  kid.days[S.day] = true;
  DB.log.push({ k: kid.id, t: Date.now(), d: S.day, tp: q.topic, s: q.skill, sc, h: S.hints, ms: Date.now() - S.qStart, m: S.mode, tag: q.tag || undefined });
  S.results.push({ topic: q.topic, skill: q.skill, sc, prompt: q.prompt, answer: E.answerText(q), steps: q.steps, given: S.lastGiven });
  let pts = 0;
  if (sc > 0) { pts = isChallenge() ? 5 : S.mode === 'check' ? 10 : sc === 1 ? 10 : 5; S.run++; S.bestRun = Math.max(S.bestRun, S.run); if (S.run % 5 === 0 && S.mode === 'practice') { pts += 10; toast(`🔥 ${S.run} in a row! +10 bonus`); } }
  else S.run = 0;
  kid.points += pts; S.points += pts; S.lastPts = pts;
  if (!before && secure(kid, q.skill) && S.mode !== 'sprint') toast(`✅ <b>${esc(q.skillTitle)}</b> is now secure!`);
  save();
}
function submit(val, timeout) {
  if (!S || S.phase !== 'ask') return;
  const q = S.q;
  if (!timeout && q.answer.kind !== 'choice' && !String(val).trim()) return;
  S.lastGiven = timeout ? '(time up)' : q.answer.kind === 'choice' ? q.answer.options[val] : val;
  const ok = !timeout && E.check(q, val);
  if (ok) {
    const sc = allowHelp() ? (S.attempt === 0 && S.hints === 0 ? 1 : 0.5) : 1;
    if (S.attempt > 0) K(S.kid).comebacks++;
    record(sc); beep('good'); S.phase = 'right';
    S.praise = H.pick(sc === 1 ? ['Brilliant!', 'Super!', 'Spot on!', 'Fantastic!', 'Nailed it!', 'Great maths!'] : ['Well done — you got there!', 'Good fixing!', 'Yes! That\'s it.']);
    render();
    const id = setTimeout(advance, isChallenge() ? 450 : 1100); timers.push(id);
    return;
  }
  beep('bad');
  if (allowHelp()) {
    S.attempt++;
    if (q.answer.kind === 'choice') S.wrongChoices.push(val);
    if (S.attempt === 1) { S.phase = 'ask'; S.input = ''; S.hints = Math.max(S.hints, 1); S.flash = 'Not quite — have another go. Here\'s a hint:'; render(); return; }
    record(0); S.phase = 'reveal'; requeue(); render(); return;
  }
  record(0);
  if (isChallenge()) { S.phase = 'missed'; render(); const id = setTimeout(advance, S.mode === 'sprint' ? 900 : 1300); timers.push(id); return; }
  advance(); // check mode: move on, review at the end
}
function requeue() { if (S.mode === 'practice' && S.extra < 3) { S.queue.splice(Math.min(S.queue.length, S.idx + 3), 0, { topic: S.q.topic, skill: S.q.skill }); S.extra++; } }
function showMe() { if (!S || S.phase !== 'ask') return; S.lastGiven = '(asked to see the method)'; record(0); S.phase = 'reveal'; requeue(); render(); }
function advance() { if (!S) return; S.idx++; S.flash = ''; nextQuestion(); }
function finishSession(complete) {
  clearTimers();
  if (!S) return;
  const kid = K(S.kid), res = S.results;
  const correct = res.filter((r) => r.sc > 0).length;
  const rec = { k: kid.id, t: S.start, end: Date.now(), day: S.day, mode: S.mode, topic: S.topic || null, skill: S.skill || null, part: S.part || null, n: res.length, correct, score: sum(res.map((r) => r.sc)), points: S.points, complete: complete && res.length > 0 };
  DB.sessions.push(rec);
  if (S.mode === 'check' && res.length) {
    const bySkill = {}; res.forEach((r) => { const b = bySkill[r.skill] || (bySkill[r.skill] = [0, 0]); b[0] += r.sc; b[1]++; });
    DB.checks.push({ k: kid.id, t: Date.now(), day: S.day, topic: S.topic, score: rec.score, total: res.length, bySkill });
  }
  if (isChallenge() && complete) { const prev = kid.best[S.mode] || 0; S.newBest = correct > prev && correct > 0; if (S.newBest) kid.best[S.mode] = correct; }
  if (!complete && !res.length) { DB.sessions.pop(); S = null; view = 'kid'; save(); render(); return; }
  S.newBadges = checkBadges(kid, S);
  S.done = rec; save();
  view = 'summary'; render();
  if (S.newBadges.length || (res.length && correct / res.length >= 0.8) || S.newBest) { confetti(); beep('badge'); }
}

/* =========================================================================
   VIEWS
   ========================================================================= */
let view = 'home', cur = { kid: null, topic: null }, parentTab = 'overview', unlocked = false, P = {};
const app = () => $('#app');
function setAccent(kid) { document.documentElement.style.setProperty('--accent', kid ? kid.color : '#4f46e5'); }

function render() {
  const fn = { home: vHome, kid: vKid, topic: vTopic, play: vPlay, summary: vSummary, badges: vBadges, pin: vPin, parent: vParent }[view] || vHome;
  app().innerHTML = fn();
  app().scrollTop = 0;
  if (view === 'play') bindPlay();
  if (view === 'parent') afterParent();
}

/* ---------- home ---------- */
function vHome() {
  setAccent(null);
  return `<div class="home">
    <div class="brand"><div class="logo">➗</div><h1>Maths Buddy</h1><p>Who's learning today?</p></div>
    <div class="kidpick">${kids().map((k) => `<button class="kidcard" style="--c:${k.color}" data-act="kid" data-id="${k.id}">
      <span class="ava">${k.avatar}</span><b>${esc(k.name)}</b><small>Year ${k.year}</small><span class="kp">⭐ ${k.points.toLocaleString()} · 🔥 ${streakDays(k)}</span></button>`).join('')}</div>
    <button class="parentbtn" data-act="parent">🔒 Parent area</button>
    <p class="foot">Mapped to the White Rose Maths / Power Maths small steps · Works offline</p>
  </div>`;
}

/* ---------- kid home ---------- */
function vKid() {
  const kid = K(cur.kid); setAccent(kid);
  const rk = rankOf(kid.points), m = todaysMission(kid), cal = { topic: m.plan.main }; // same topic the parent's weekly plan uses
  const done = m.parts.filter((p) => partDone(kid, p.key)).length;
  const nextIdx = m.parts.findIndex((p) => !partDone(kid, p.key));
  const nb = Object.keys(kid.badges).length;
  return `<div class="kidhome">
    <header class="khead">
      <button class="iconbtn" data-act="home" aria-label="Back">←</button>
      <div class="who"><span class="ava sm">${kid.avatar}</span><div><b>Hi ${esc(kid.name)}!</b><small>${rk.name}${rk.next ? ` · ${(rk.next[0] - kid.points).toLocaleString()} pts to ${rk.next[1]}` : ''}</small></div></div>
      <div class="chips"><span class="chip">⭐ ${kid.points.toLocaleString()}</span><span class="chip">🔥 ${streakDays(kid)} day${streakDays(kid) === 1 ? '' : 's'}</span><button class="chip" data-act="badges">🏅 ${nb}</button></div>
    </header>
    <section class="card mission">
      <div class="mhead"><h2>${m.weekend ? 'Bonus mission' : m.isCheck ? 'Today: check-up day!' : 'Today\'s mission'}</h2><span class="mcount">${done}/${m.parts.length} done</span></div>
      <div class="mbar"><i style="width:${done / m.parts.length * 100}%"></i></div>
      <div class="mparts">${m.parts.map((p, i) => { const d = partDone(kid, p.key); return `<button class="mpart ${d ? 'done' : ''} ${i === nextIdx ? 'next' : ''}" data-act="part" data-i="${i}">
        <span class="mi">${d ? '✅' : p.icon}</span><span class="mt"><b>${p.title}</b><small>${esc(p.sub)}</small>${p.teach && !d ? '<em>👩‍🏫 Learn it with Mum first, then practise</em>' : ''}</span><span class="go">${d ? 'Again' : 'Start'}</span></button>`; }).join('')}</div>
    </section>
    <h3 class="sect">My topics ${cal.topic ? `<small>· This week: ${esc(T[cal.topic].title)}</small>` : ''}</h3>
    <div class="tgrid">${topicsFor(kid.year).map((t) => { const tm = topicMastery(kid, t.id); const lv = level(tm.pct);
      return `<button class="tile ${lv}" data-act="topic" data-id="${t.id}"><span class="te">${t.emoji}</span><b>${t.title}</b>
        ${kid.focus.includes(t.id) ? '<span class="tag focus">★ focus</span>' : ''}${cal.topic === t.id ? '<span class="tag school">this week</span>' : ''}
        <span class="tbar"><i style="width:${tm.pct || 0}%"></i></span><small>${tm.secure}/${tm.total} steps secure</small></button>`; }).join('')}
      ${kid.year >= 6 ? `<button class="tile ${level(topicMastery(kid, 'y4-tables').pct)}" data-act="topic" data-id="y4-tables"><span class="te">✖️</span><b>Times tables</b><span class="tag">refresh</span><span class="tbar"><i style="width:${topicMastery(kid, 'y4-tables').pct || 0}%"></i></span><small>keeps division fast</small></button>` : ''}
    </div>
    <h3 class="sect">Challenges</h3>
    <div class="cgrid">${Object.entries(CHALLENGES).map(([id, c]) => `<button class="ctile" data-act="challenge" data-id="${id}"><span class="te">${c.icon}</span><b>${c.name}</b><small>${c.desc}</small><span class="best">Best: ${kid.best[id] || 0}${id === 'mtc' ? '/25' : id === 'cat4' ? '/12' : ''}</span></button>`).join('')}</div>
  </div>`;
}

/* ---------- topic (kid) ---------- */
function vTopic() {
  const kid = K(cur.kid), t = T[cur.topic]; setAccent(kid);
  const tm = topicMastery(kid, t.id);
  return `<div class="kidhome">
    <header class="khead"><button class="iconbtn" data-act="kid" data-id="${kid.id}">←</button><div class="who"><span class="ava sm">${t.emoji}</span><div><b>${t.title}</b><small>${tm.secure} of ${tm.total} small steps secure</small></div></div></header>
    <div class="row2"><button class="big primary" data-act="practise" data-topic="${t.id}">▶ Smart practice</button><button class="big" data-act="check" data-topic="${t.id}">📝 Quick check</button></div>
    <div class="steps-list">${t.skills.map((s, i) => { const m = skillMastery(kid, s.id); const lv = slevel(kid, s.id);
      return `<button class="steprow" data-act="practise" data-topic="${t.id}" data-skill="${s.id}"><span class="dot ${lv}">${i + 1}</span><span class="st">${esc(s.title)}<small>${levelName[lv]}${m != null ? ' · ' + m + '%' : ''}</small></span><span class="go">Practise</span></button>`; }).join('')}</div>
  </div>`;
}

/* ---------- play ---------- */
function vPlay() {
  const kid = K(S.kid), q = S.q; setAccent(kid);
  const total = S.mode === 'sprint' ? null : S.queue.length;
  const progress = total ? (S.idx / total * 100) : 0;
  const label = S.mode === 'check' ? 'Quick check' : isChallenge() ? CHALLENGES[S.mode].name : `${T[q.topic].title}`;
  const choice = q.answer.kind === 'choice';
  const reveal = S.phase === 'reveal', right = S.phase === 'right', missed = S.phase === 'missed';
  const fb = right ? `<div class="fb good">✔ ${S.praise} ${S.lastPts ? `<span class="plus">+${S.lastPts}</span>` : ''}</div>`
    : missed ? `<div class="fb bad">The answer was <b>${E.answerText(q)}</b></div>`
    : reveal ? `<div class="fb info">Let's look at how to do it. The answer is <b>${E.answerText(q)}</b>.</div>`
    : S.flash ? `<div class="fb bad">${S.flash}</div>` : '';
  const hints = allowHelp() && S.hints && !reveal ? `<div class="hints">${q.hints.slice(0, S.hints).map((h) => `<div class="hint">💡 ${h}</div>`).join('')}</div>` : '';
  const steps = reveal ? `<div class="worked"><h4>How to do it — the school way</h4>${q.steps}</div>` : '';
  const timer = S.mode === 'sprint' || S.mode === 'mtc' || S.mode === 'cat4' ? `<div class="qtimer"><i id="qtimer"></i></div>` : '';
  const pad = reveal ? `<div class="pad"><button class="key next wide" data-act="next">Next ➜</button></div>`
    : choice ? `<div class="pad choices ${q.answer.options.length > 3 ? 'four' : ''}">${q.answer.options.map((o, i) => `<button class="opt ${S.wrongChoices.includes(i) ? 'wrong' : ''} ${right && i === q.answer.correct ? 'right' : ''}" data-act="choose" data-i="${i}" ${S.wrongChoices.includes(i) || S.phase !== 'ask' ? 'disabled' : ''}>${o}</button>`).join('')}</div>`
    : keypad(q);
  return `<div class="play">
    <header class="playbar">
      <button class="iconbtn" data-act="quit" aria-label="Stop">✕</button>
      <div class="pinfo"><b>${esc(label)}</b><small>${S.mode === 'sprint' ? `<span id="timeleft">60s</span> · ${S.results.filter((r) => r.sc > 0).length} right` : `Question ${Math.min(S.idx + 1, total)} of ${total}`}</small></div>
      <span class="chip">⭐ ${kid.points.toLocaleString()}</span>
    </header>
    ${total ? `<div class="pbar"><i style="width:${progress}%"></i></div>` : ''}${timer}
    <div class="qwrap">
      <section class="qcard ${right ? 'isright' : ''} ${missed ? 'ismissed' : ''}">
        <div class="skilltag">${esc(q.skillTitle)}</div>
        <div class="prompt">${q.prompt}</div>
        ${q.visual ? `<div class="visual">${q.visual}</div>` : ''}
        ${choice || reveal ? '' : `<div class="answerbox" id="ans">${S.input ? esc(S.input) : '<span class="ph">tap the numbers</span>'}</div>`}
        ${fb}${hints}${steps}
        <div class="qtools">
          ${allowHelp() && !reveal && !right && S.hints < q.hints.length ? `<button class="tool" data-act="hint">💡 Hint</button>` : ''}
          ${allowHelp() && !reveal && !right ? `<button class="tool" data-act="showme">👀 Show me how</button>` : ''}
          ${DB.settings.speech ? `<button class="tool" data-act="speak">🔊 Read</button>` : ''}
        </div>
      </section>
      <section class="padwrap">${pad}</section>
    </div>
  </div>`;
}
function keypad(q) {
  const extra = (q.keys || []).map((k) => `<button class="key alt" data-key="${k === '␣' ? ' ' : k}">${k === '␣' ? 'space' : k}</button>`).join('');
  const disabled = S.phase !== 'ask' ? 'disabled' : '';
  return `<div class="pad keys">
    ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => `<button class="key" data-key="${n}" ${disabled}>${n}</button>`).join('')}
    <button class="key alt" data-key="⌫" ${disabled}>⌫</button><button class="key" data-key="0" ${disabled}>0</button><button class="key alt" data-key="C" ${disabled}>C</button>
    ${extra ? `<div class="extra">${extra}</div>` : ''}
    <button class="key go wide" data-act="submit" ${disabled}>Check ✓</button>
  </div>`;
}
function typeKey(k) {
  if (!S || S.phase !== 'ask') return;
  if (k === '⌫') S.input = S.input.slice(0, -1);
  else if (k === 'C') S.input = '';
  else if (S.input.length < 14) {
    if (k === 'r' || k === ' ') { if (!S.input || /[ r]$/.test(S.input)) return; S.input += k === 'r' ? ' r ' : ' '; }
    else S.input += k;
  }
  const a = $('#ans'); if (a) a.innerHTML = S.input ? esc(S.input) : '<span class="ph">tap the numbers</span>';
}
function bindPlay() { if (S && S.mode === 'sprint') tickSprint(); }

/* ---------- summary ---------- */
function vSummary() {
  const kid = K(S.kid), r = S.done, res = S.results; setAccent(kid);
  const acc = r.n ? r.score / r.n : 0;
  const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
  const msg = isChallenge() ? (S.newBest ? 'New personal best! 🎉' : `Your best is ${kid.best[S.mode] || 0}. Keep going!`)
    : stars === 3 ? 'Amazing work!' : stars === 2 ? 'Great effort — nearly there!' : stars === 1 ? 'Good practice. Mistakes help us learn!' : 'That was tricky. Let\'s ask Mum to go through it together.';
  const wrong = res.filter((x) => x.sc === 0);
  return `<div class="summary">
    <div class="sumcard">
      <div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('')}</div>
      <h2>${msg}</h2>
      <div class="sumstats"><div><b>${r.correct}${isChallenge() && S.mode === 'sprint' ? '' : '/' + r.n}</b><small>${S.mode === 'sprint' ? 'correct in 60s' : 'correct'}</small></div><div><b>+${r.points}</b><small>points</small></div><div><b>${S.bestRun}</b><small>best run</small></div></div>
      ${S.newBadges.length ? `<div class="newbadges"><h3>New badge${S.newBadges.length > 1 ? 's' : ''}!</h3>${S.newBadges.map((id) => { const b = badgeById(kid, id); return `<div class="nb"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`; }).join('')}</div>` : ''}
      ${S.mode === 'check' && wrong.length ? `<div class="review"><h3>Let's look at the ones to fix</h3>${wrong.map((w) => `<details><summary>${w.prompt.replace(/<div[\s\S]*$/, '')} → <b>${w.answer}</b></summary><div class="worked">${w.steps}</div></details>`).join('')}</div>` : ''}
      <div class="row2"><button class="big" data-act="again">↻ Again</button><button class="big primary" data-act="kid" data-id="${kid.id}">Done ➜</button></div>
    </div>
  </div>`;
}

/* ---------- badges ---------- */
function vBadges() {
  const kid = K(cur.kid); setAccent(kid);
  return `<div class="kidhome"><header class="khead"><button class="iconbtn" data-act="kid" data-id="${kid.id}">←</button><div class="who"><span class="ava sm">🏅</span><div><b>My badges</b><small>${Object.keys(kid.badges).length} of ${allBadges(kid).length} collected</small></div></div></header>
    <div class="bgrid">${allBadges(kid).map((b) => `<div class="badge ${kid.badges[b.id] ? 'got' : ''}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small>${kid.badges[b.id] ? `<em>${fmtDate(new Date(kid.badges[b.id]), { day: 'numeric', month: 'short' })}</em>` : ''}</div>`).join('')}</div></div>`;
}

/* ---------- PIN ---------- */
let pinBuf = '', pinFirst = null;
function vPin() {
  setAccent(null);
  const creating = !DB.settings.pin;
  const title = creating ? (pinFirst ? 'Type the new PIN again' : 'Create a 4-digit parent PIN') : 'Parent PIN';
  return `<div class="pinwrap"><button class="iconbtn" data-act="home">←</button>
    <h2>🔒 ${title}</h2><p class="muted">${creating ? 'Keeps planning and reports for grown-ups only.' : 'Enter your PIN to open the parent area.'}</p>
    <div class="pindots">${[0, 1, 2, 3].map((i) => `<i class="${i < pinBuf.length ? 'on' : ''}"></i>`).join('')}</div>
    <div class="pad keys pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-pin="${n}">${n}</button>`).join('')}<button class="key alt" data-pin="⌫">⌫</button><button class="key" data-pin="0">0</button><span></span></div>
    ${creating ? '' : '<button class="linkbtn" data-act="forgotpin">Forgot PIN?</button>'}
  </div>`;
}
function pinKey(k) {
  if (k === '⌫') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < 4) pinBuf += k;
  if (pinBuf.length === 4) {
    const v = pinBuf; pinBuf = '';
    if (!DB.settings.pin) {
      if (!pinFirst) { pinFirst = v; }
      else if (pinFirst === v) { DB.settings.pin = v; pinFirst = null; save(); unlocked = true; view = 'parent'; toast('PIN saved'); }
      else { pinFirst = null; toast('PINs didn\'t match — try again'); }
    } else if (v === DB.settings.pin) { unlocked = true; view = 'parent'; }
    else { toast('Wrong PIN'); }
  }
  render();
}

/* =========================================================================
   PARENT AREA
   ========================================================================= */
const TABS = [['overview', '🏠', 'Overview'], ['plan', '🗓️', 'Weekly plan'], ['teach', '👩‍🏫', 'Lesson guides'], ['reports', '📊', 'Reports'], ['settings', '⚙️', 'Settings']];
function vParent() {
  setAccent(null);
  P.kid = P.kid && K(P.kid) ? P.kid : kids()[0].id;
  const body = { overview: pOverview, plan: pPlan, teach: pTeach, reports: pReports, settings: pSettings }[parentTab]();
  return `<div class="parent">
    <header class="phead"><button class="iconbtn" data-act="lock" aria-label="Lock">←</button><h1>Parent area</h1><span class="muted">${fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</span></header>
    <nav class="ptabs">${TABS.map(([id, ic, nm]) => `<button class="${parentTab === id ? 'on' : ''}" data-act="ptab" data-id="${id}"><span>${ic}</span>${nm}</button>`).join('')}</nav>
    <main class="pbody">${body}</main>
  </div>`;
}
function kidSwitch(withBoth) {
  const opts = (withBoth ? [['both', '👨‍👩‍👧‍👦 Both']] : []).concat(kids().map((k) => [k.id, `${k.avatar} ${esc(k.name)}`]));
  const curK = withBoth ? (P.rkid || 'both') : P.kid;
  return `<div class="seg">${opts.map(([id, l]) => `<button class="${curK === id ? 'on' : ''}" data-act="${withBoth ? 'rkid' : 'pkid'}" data-id="${id}">${l}</button>`).join('')}</div>`;
}

/* ---------- daily/weekly stats ---------- */
function statsFor(kid, fromKey, toKey) {
  const L = DB.log.filter((l) => l.k === kid.id && l.d >= fromKey && l.d <= toKey);
  const sess = DB.sessions.filter((s) => s.k === kid.id && s.day >= fromKey && s.day <= toKey);
  const mins = Math.round(sum(sess.map((s) => Math.min(30, (s.end - s.t) / 60000))));
  const bySkill = {};
  L.forEach((l) => { const b = bySkill[l.s] || (bySkill[l.s] = { tp: l.tp, s: l.s, n: 0, sc: 0, first: 0 }); b.n++; b.sc += l.sc; if (l.sc === 1) b.first++; });
  const byTopic = {};
  L.forEach((l) => { const b = byTopic[l.tp] || (byTopic[l.tp] = { n: 0, sc: 0 }); b.n++; b.sc += l.sc; });
  const tags = {};
  L.filter((l) => l.tag).forEach((l) => { const b = tags[l.tag] || (tags[l.tag] = { n: 0, sc: 0 }); b.n++; b.sc += l.sc; });
  return { n: L.length, acc: L.length ? sum(L.map((l) => l.sc)) / L.length * 100 : null, mins, points: sum(sess.map((s) => s.points || 0)), sessions: sess, bySkill, byTopic, tags, hints: sum(L.map((l) => l.h ? 1 : 0)) };
}
function skillTitle(sid) { for (const t of Object.values(T)) { const s = t.skills.find((x) => x.id === sid); if (s) return { topic: t, skill: s }; } return null; }
function alertsFor(kid) {
  const from = dayKey(addDays(new Date(), -7));
  const st = statsFor(kid, from, dayKey());
  const out = [];
  Object.values(st.bySkill).filter((b) => b.n >= 4 && b.sc / b.n < 0.5).sort((a, b) => a.sc / a.n - b.sc / b.n).slice(0, 4)
    .forEach((b) => { const x = skillTitle(b.s); out.push({ type: 'stuck', topic: b.tp, skill: b.s, text: `Stuck on <b>${esc(x.skill.title)}</b> (${x.topic.title}) — ${Math.round(b.sc / b.n * 100)}% over ${b.n} questions.` }); });
  const wt = Object.entries(st.tags).filter(([t, b]) => b.n >= 3 && b.sc / b.n < 0.6 && +t <= 12).map(([t]) => '×' + t);
  if (wt.length) out.push({ type: 'tables', text: `Times tables to practise: <b>${wt.join(', ')}</b>.` });
  const lastDay = Object.keys(kid.days).sort().pop();
  if (!lastDay || lastDay < dayKey(addDays(new Date(), -3))) out.push({ type: 'idle', text: lastDay ? `No practice since ${fmtDate(parseDay(lastDay))}.` : 'No practice yet — start with today\'s mission.' });
  return out;
}

/* ---------- overview ---------- */
function pOverview() {
  return `<div class="ovgrid">${kids().map((kid) => {
    const p = weekPlan(kid), st = statsFor(kid, dayKey(), dayKey()), m = todaysMission(kid), al = alertsFor(kid);
    const done = m.parts.filter((x) => partDone(kid, x.key)).length;
    return `<section class="card ov" style="--c:${kid.color}">
      <div class="ovh"><span class="ava sm">${kid.avatar}</span><div><b>${esc(kid.name)}</b><small>Year ${kid.year} · ${kid.points.toLocaleString()} pts · 🔥 ${streakDays(kid)} day${streakDays(kid) === 1 ? '' : 's'}</small></div></div>
      <div class="kv"><span>At school (approx.)</span><b>${esc(p.cal.block)}${p.cal.sw ? ` · ${cap(p.cal.sw.term)} wk ${p.cal.sw.week}` : ''}</b></div>
      <div class="kv"><span>This week's main topic</span><b>${esc(T[p.main].title)}${p.override ? ' (set by you)' : ''}</b></div>
      <div class="stats4"><div><b>${st.mins}</b><small>min today</small></div><div><b>${st.n}</b><small>questions</small></div><div><b>${pct(st.acc)}</b><small>accuracy</small></div><div><b>${done}/${m.parts.length}</b><small>mission</small></div></div>
      <h4>Focus areas</h4>
      ${kid.focus.filter((x) => T[x]).map((tid) => { const tm = topicMastery(kid, tid); return `<div class="fbar2"><span>${T[tid].emoji} ${T[tid].title}</span><span class="tbar ${level(tm.pct)}"><i style="width:${tm.pct || 0}%"></i></span><b>${pct(tm.pct)}</b></div>`; }).join('')}
      <h4>Alerts</h4>
      ${al.length ? `<ul class="alerts">${al.map((a) => `<li class="${a.type}">${a.text}${a.topic ? ` <button class="linkbtn" data-act="guide" data-topic="${a.topic}" data-kid="${kid.id}">Lesson guide →</button>` : ''}</li>`).join('')}</ul>` : '<p class="muted">Nothing worrying this week 👍</p>'}
      <div class="row2"><button class="btn" data-act="gotab" data-tab="plan" data-kid="${kid.id}">🗓️ Weekly plan</button><button class="btn" data-act="gotab" data-tab="reports" data-kid="${kid.id}">📊 Today's report</button></div>
    </section>`; }).join('')}</div>
    <section class="card tipcard"><h3>How to use your hour</h3><ol><li><b>Warm-up (5 min, app)</b> — fluency facts.</li><li><b>Teach (15 min, you)</b> — open the Lesson guide for today's step; use the school method and the "Say / Ask" prompts.</li><li><b>Practise (15 min, app)</b> — the app gives hints and shows the school method when they're stuck.</li><li><b>Boost (10 min, app)</b> — their focus areas.</li><li><b>Challenge (10 min, app)</b> — points, badges, personal bests.</li><li><b>Review (5 min, together)</b> — check today's report and celebrate.</li></ol></section>`;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- plan ---------- */
function agenda(parts, mins) {
  const base = [['warmup', 5], ['teach', 15], ['learn', 15], ['boost', 10], ['challenge', 10], ['review', 5]];
  const f = mins / 60; let t = 0;
  const row = (label, dur, what) => { const s = t; t += Math.round(dur * f); return `<tr><td class="time">${s}–${t} min</td><td><b>${label}</b><br>${what}</td></tr>`; };
  const by = Object.fromEntries(parts.map((p) => [p.key, p]));
  let h = '<table class="agenda">';
  h += row('🔥 Warm-up (app)', 5, esc(by.warmup.sub));
  if (by.learn && by.learn.mode === 'check') { h += row('🗣️ Recap (you)', 15, `Go over this week's steps in <a href="#" data-act="guide" data-topic="${by.learn.topic}">${esc(T[by.learn.topic].title)}</a> — ask the "Ask" questions from the guide.`); h += row('📝 Weekly check (app)', 15, `${esc(T[by.learn.topic].title)} — no hints; review the mistakes together after.`); }
  else if (by.learn) { h += row('👩‍🏫 Teach (you)', 15, `<a href="#" data-act="guide" data-topic="${by.learn.topic}" data-skill="${by.learn.skill}">${esc(by.learn.sub)}</a>`); h += row('📘 Practise (app)', 15, esc(by.learn.sub)); }
  else { h += row('🎲 Free choice (app)', 30, 'Let them pick a topic or replay a challenge.'); }
  h += row('💪 Boost (app)', 10, esc(by.boost.sub));
  h += row('⚡ Challenge (app)', 10, esc(by.challenge.sub));
  h += row('⭐ Review together', 5, 'Open today\'s report, praise effort, note anything tricky.');
  return h + '</table>';
}
function pPlan() {
  const kid = K(P.kid), p = weekPlan(kid);
  const opts = topicsFor(kid.year).map((t) => `<option value="${t.id}" ${p.override && p.main === t.id ? 'selected' : ''}>${t.title}</option>`).join('');
  return `${kidSwitch(false)}
  <section class="card">
    <div class="planhead"><div><h2>Week of ${fmtDate(p.ws, { day: 'numeric', month: 'long' })}</h2>
      <p class="muted">School calendar estimate: <b>${esc(p.cal.block)}</b>${p.cal.sw ? ` (${cap(p.cal.sw.term)} term, week ${p.cal.sw.week})` : ''}. If school is teaching something else, change it here — it applies to this week.</p></div>
      <button class="btn noprint" data-act="print" data-what="plan">🖨️ PDF</button></div>
    <div class="formrow noprint"><label>What is school teaching this week?</label><select data-act="override"><option value="">Use the school calendar${p.cal.topic ? ` (${esc(T[p.cal.topic].title)})` : ''}</option>${opts}</select></div>
    <div class="kv"><span>Main topic</span><b>${T[p.main].emoji} ${esc(T[p.main].title)}</b></div>
    <div class="kv"><span>Boost (focus areas)</span><b>${p.boosts.map((b) => esc(T[b].title)).join(' · ')}</b></div>
  </section>
  <div class="daygrid">${p.days.map((d) => `<section class="card day ${dayKey(d.date) === dayKey() ? 'today' : ''}">
      <h3>${fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'short' })}${d.isCheck ? ' <span class="tag">check day</span>' : ''}${dayKey(d.date) === dayKey() ? ' <span class="tag school">today</span>' : ''}</h3>
      ${agenda(d.parts, DB.settings.sessionMins)}
      <div class="dstat">${d.parts.map((x) => `<span class="${partDone(kid, x.key, dayKey(d.date)) ? 'ok' : ''}">${partDone(kid, x.key, dayKey(d.date)) ? '✅' : '○'} ${x.title}</span>`).join('')}</div>
    </section>`).join('')}</div>`;
}

/* ---------- teach (lesson guides) ---------- */
function pTeach() {
  const kid = K(P.kid);
  const tid = P.topic && T[P.topic] && T[P.topic].year === kid.year ? P.topic : (P.topic === 'y4-tables' ? 'y4-tables' : weekPlan(kid).main);
  P.topic = tid;
  const t = T[tid], g = C.LESSONS[tid] || {}, cal = C.CALENDAR[kid.year];
  const exSkill = P.skill && t.skills.find((s) => s.id === P.skill) ? P.skill : g.example && t.skills.find((s) => s.id === g.example) ? g.example : t.skills[0].id;
  P.skill = exSkill;
  const ex = E.generate(tid, exSkill);
  const quick = [0, 1, 2].map(() => E.generate(tid, exSkill));
  const map = `<details class="card cmap"><summary><b>📚 Year ${kid.year} curriculum map</b> <span class="muted">(White Rose / Power Maths order — tap a topic)</span></summary>
    ${['autumn', 'spring', 'summer'].map((term) => `<div class="term"><h4>${cap(term)} term</h4><div class="blocks">${cal[term].map((b) => `<div class="block ${b.soon ? 'soon' : ''}"><b>${esc(b.block)}</b><small>${b.weeks} wk${b.weeks > 1 ? 's' : ''}</small>${b.topics.filter((x) => T[x]).map((x) => `<button class="linkbtn" data-act="guide" data-topic="${x}">${T[x].emoji} ${T[x].title}</button>`).join('')}${b.soon ? '<small class="muted">coming in Phase 2</small>' : ''}</div>`).join('')}</div></div>`).join('')}
  </details>`;
  return `${kidSwitch(false)}${map}
  <div class="formrow"><label>Topic</label><select data-act="topicsel">${topicsFor(kid.year).concat(kid.year >= 6 ? [T['y4-tables']] : []).map((x) => `<option value="${x.id}" ${x.id === tid ? 'selected' : ''}>${x.emoji} ${x.title}</option>`).join('')}</select>
    <button class="btn" data-act="print" data-what="guide">🖨️ PDF</button></div>
  <section class="card guide">
    <h2>${t.emoji} ${t.title} <small class="muted">Year ${t.year}</small></h2>
    ${g.nc ? `<p class="nc"><b>National Curriculum:</b> ${esc(g.nc)}</p>` : ''}
    <h3>Small steps & ${esc(kid.name)}'s progress</h3>
    <div class="steps-list compact">${t.skills.map((s, i) => { const m = skillMastery(kid, s.id); return `<button class="steprow ${s.id === exSkill ? 'sel' : ''}" data-act="guideskill" data-skill="${s.id}"><span class="dot ${slevel(kid, s.id)}">${i + 1}</span><span class="st">${esc(s.title)}<small>${levelName[slevel(kid, s.id)]}${m != null ? ' · ' + m + '%' : ''}</small></span></button>`; }).join('')}</div>
    ${g.method ? `<h3>The school method: ${esc(g.method.name)}</h3><ol>${g.method.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
    ${g.cpa ? `<h3>Concrete → Pictorial → Abstract</h3><div class="cpa"><div><b>Concrete</b>${esc(g.cpa.c)}</div><div><b>Pictorial</b>${esc(g.cpa.p)}</div><div><b>Abstract</b>${esc(g.cpa.a)}</div></div>` : ''}
    <div class="two">
      ${g.say ? `<div><h3>🗣️ Say this</h3><ul>${g.say.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${g.ask ? `<div><h3>❓ Ask this</h3><ul>${g.ask.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    </div>
    <h3>✏️ Worked example — ${esc(t.skills.find((s) => s.id === exSkill).title)} <button class="linkbtn noprint" data-act="newex">↻ another</button></h3>
    <div class="example"><div class="prompt sm">${ex.prompt}</div>${ex.visual}<div class="worked">${ex.steps}</div><p><b>Answer:</b> ${E.answerText(ex)}</p></div>
    <h3>⚡ Quick-fire questions to ask (answers hidden)</h3>
    <ol class="quick">${quick.map((q) => `<li><span>${q.prompt.replace(/<div class="small">[\s\S]*?<\/div>/, '')}${q.visual ? ' (see app)' : ''}</span> <details><summary>answer</summary>${E.answerText(q)}</details></li>`).join('')}</ol>
    ${g.mistakes ? `<h3>⚠️ Common mistakes & fixes</h3><table class="mist">${g.mistakes.map(([m, f]) => `<tr><td>${esc(m)}</td><td>${esc(f)}</td></tr>`).join('')}</table>` : ''}
    ${g.vocab ? `<h3>Key vocabulary</h3><p class="vocab">${g.vocab.map((v) => `<span>${esc(v)}</span>`).join('')}</p>` : ''}
    ${g.home ? `<h3>🏠 Everyday maths</h3><p>${esc(g.home)}</p>` : ''}
    <div class="row2 noprint"><button class="btn primary" data-act="assign" data-topic="${tid}" data-skill="${exSkill}">Make this step ${esc(kid.name)}'s main topic this week</button></div>
  </section>`;
}

/* ---------- reports ---------- */
function reportKid(kid, kind, date) {
  if (kind === 'heatmap') return heatmap(kid);
  const dk = dayKey(date);
  if (kind === 'daily') {
    const st = statsFor(kid, dk, dk), m = todaysMission(kid);
    const skills = Object.values(st.bySkill).sort((a, b) => b.n - a.n);
    const badges = Object.entries(kid.badges).filter(([, t]) => dayKey(new Date(t)) === dk).map(([id]) => badgeById(kid, id));
    const wins = skills.filter((b) => b.n >= 4 && b.sc / b.n >= 0.8), worry = skills.filter((b) => b.n >= 3 && b.sc / b.n < 0.5);
    const tomorrow = weekPlan(kid, addDays(date, 1)).days.find((d) => d.date > date);
    return `<section class="rep"><h2>${kid.avatar} ${esc(kid.name)} — Daily summary <small>${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small></h2>
      <div class="stats4"><div><b>${st.mins}</b><small>minutes</small></div><div><b>${st.n}</b><small>questions</small></div><div><b>${pct(st.acc)}</b><small>accuracy</small></div><div><b>${st.points}</b><small>points</small></div></div>
      ${dk === dayKey() ? `<p><b>Mission:</b> ${m.parts.map((p) => `${partDone(kid, p.key) ? '✅' : '○'} ${p.title}`).join(' · ')}</p>` : ''}
      ${skills.length ? `<table class="rtable"><tr><th>Topic › small step</th><th>Qs</th><th>Accuracy</th><th>First try</th><th>Mastery now</th></tr>${skills.map((b) => { const x = skillTitle(b.s); const m2 = skillMastery(kid, b.s); return `<tr><td>${x.topic.emoji} ${esc(x.topic.title)} › ${esc(x.skill.title)}</td><td>${b.n}</td><td>${Math.round(b.sc / b.n * 100)}%</td><td>${b.first}/${b.n}</td><td><span class="pill ${slevel(kid, b.s)}">${pct(m2)}</span></td></tr>`; }).join('')}</table>` : '<p class="muted">No practice on this day.</p>'}
      <div class="two"><div><h3>🌟 Wins</h3>${wins.length || badges.length ? `<ul>${wins.map((b) => `<li>${esc(skillTitle(b.s).skill.title)} — ${Math.round(b.sc / b.n * 100)}%</li>`).join('')}${badges.map((b) => `<li>${b.icon} Badge: ${esc(b.name)}</li>`).join('')}</ul>` : '<p class="muted">—</p>'}</div>
      <div><h3>🔍 Needs attention</h3>${worry.length ? `<ul>${worry.map((b) => `<li>${esc(skillTitle(b.s).skill.title)} — ${Math.round(b.sc / b.n * 100)}% (${b.n} Qs)</li>`).join('')}</ul>` : '<p class="muted">Nothing today 👍</p>'}</div></div>
      ${tomorrow ? `<p><b>Next session (${fmtDate(tomorrow.date)}):</b> ${tomorrow.parts.filter((p) => p.key === 'learn' || p.key === 'boost').map((p) => `${p.title}: ${esc(p.sub)}`).join(' · ')}</p>` : ''}
    </section>`;
  }
  // weekly
  const ws = mondayOf(date), we = addDays(ws, 6), st = statsFor(kid, dayKey(ws), dayKey(we));
  const prev = statsFor(kid, dayKey(addDays(ws, -7)), dayKey(addDays(ws, -1)));
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = addDays(ws, i), s = statsFor(kid, dayKey(d), dayKey(d)); return { d, s }; });
  const maxM = Math.max(10, ...days.map((x) => x.s.mins));
  const topicsRows = Object.entries(st.byTopic).sort((a, b) => b[1].n - a[1].n);
  const checks = DB.checks.filter((c) => c.k === kid.id && c.day >= dayKey(ws) && c.day <= dayKey(we));
  const skills = Object.values(st.bySkill);
  const strengths = skills.filter((b) => b.n >= 5 && b.sc / b.n >= 0.85).sort((a, b) => b.sc / b.n - a.sc / b.n).slice(0, 4);
  const concerns = skills.filter((b) => b.n >= 4 && b.sc / b.n < 0.6).sort((a, b) => a.sc / a.n - b.sc / b.n).slice(0, 4);
  const badges = Object.entries(kid.badges).filter(([, t]) => t >= ws.getTime() && t < addDays(we, 1).getTime()).map(([id]) => badgeById(kid, id));
  const next = weekPlan(kid, addDays(we, 1));
  const trend = st.acc != null && prev.acc != null ? (st.acc - prev.acc >= 3 ? '▲' : st.acc - prev.acc <= -3 ? '▼' : '▶') : '';
  return `<section class="rep"><h2>${kid.avatar} ${esc(kid.name)} — Weekly summary <small>${fmtDate(ws, { day: 'numeric', month: 'short' })} – ${fmtDate(we, { day: 'numeric', month: 'short', year: 'numeric' })}</small></h2>
    <div class="stats4"><div><b>${days.filter((x) => x.s.n).length}/7</b><small>days practised</small></div><div><b>${st.mins}</b><small>minutes</small></div><div><b>${st.n}</b><small>questions</small></div><div><b>${pct(st.acc)} ${trend}</b><small>accuracy${prev.acc != null ? ` (last wk ${pct(prev.acc)})` : ''}</small></div></div>
    <div class="weekbars">${days.map((x) => `<div><span class="wb"><i style="height:${x.s.mins / maxM * 100}%" class="${level(x.s.acc)}"></i></span><b>${x.d.toLocaleDateString('en-GB', { weekday: 'short' })}</b><small>${x.s.mins}m · ${pct(x.s.acc)}</small></div>`).join('')}</div>
    ${topicsRows.length ? `<table class="rtable"><tr><th>Topic</th><th>Qs</th><th>Accuracy</th><th>Mastery now</th></tr>${topicsRows.map(([tid, b]) => { const tm = topicMastery(kid, tid); return `<tr><td>${T[tid].emoji} ${esc(T[tid].title)}</td><td>${b.n}</td><td>${Math.round(b.sc / b.n * 100)}%</td><td><span class="pill ${level(tm.pct)}">${pct(tm.pct)}</span> ${tm.secure}/${tm.total} steps</td></tr>`; }).join('')}</table>` : '<p class="muted">No practice this week.</p>'}
    ${checks.length ? `<h3>📝 Quick checks</h3><ul>${checks.map((c) => `<li>${esc(T[c.topic].title)}: <b>${Math.round(c.score)}/${c.total}</b> (${fmtDate(new Date(c.t))})</li>`).join('')}</ul>` : ''}
    <div class="two"><div><h3>💪 Strengths</h3>${strengths.length ? `<ul>${strengths.map((b) => `<li>${esc(skillTitle(b.s).skill.title)} (${Math.round(b.sc / b.n * 100)}%)</li>`).join('')}</ul>` : '<p class="muted">Keep practising to show strengths.</p>'}${badges.length ? `<p>${badges.map((b) => `${b.icon} ${esc(b.name)}`).join(' · ')}</p>` : ''}</div>
    <div><h3>🔍 To work on</h3>${concerns.length ? `<ul>${concerns.map((b) => `<li>${esc(skillTitle(b.s).skill.title)} (${Math.round(b.sc / b.n * 100)}%)</li>`).join('')}</ul>` : '<p class="muted">No concerns 👍</p>'}</div></div>
    <p><b>Next week:</b> main topic <b>${esc(T[next.main].title)}</b>; boost ${next.boosts.map((b) => esc(T[b].title)).join(', ')}.</p>
  </section>`;
}
function heatmap(kid) {
  const tops = topicsFor(kid.year).concat(kid.year >= 6 ? [T['y4-tables']] : []);
  const maxSteps = Math.max(...tops.map((t) => t.skills.length));
  return `<section class="rep"><h2>${kid.avatar} ${esc(kid.name)} — Topic heatmap <small>Year ${kid.year} · ${fmtDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })}</small></h2>
    <table class="heat"><tr><th>Topic</th>${Array.from({ length: maxSteps }, (_, i) => `<th>${i + 1}</th>`).join('')}<th>Topic</th></tr>
    ${tops.map((t) => { const tm = topicMastery(kid, t.id); return `<tr><td class="hn">${t.emoji} ${esc(t.title)}${kid.focus.includes(t.id) ? ' ★' : ''}</td>${Array.from({ length: maxSteps }, (_, i) => { const s = t.skills[i]; if (!s) return '<td class="hx"></td>'; const m = skillMastery(kid, s.id); return `<td class="hc ${slevel(kid, s.id)}" title="${esc(s.title)}">${m == null ? '' : m}</td>`; }).join('')}<td><span class="pill ${level(tm.pct)}">${pct(tm.pct)}</span></td></tr>`; }).join('')}
    </table>
    <p class="legend"><span class="hc new"></span> not started <span class="hc red"></span> needs help (&lt;50%) <span class="hc amber"></span> getting there (50–79%) <span class="hc green"></span> secure (80%+ over 5+ answers) · numbers = accuracy % on the last 10 answers · ★ focus area</p>
    <details class="noprint"><summary>Small step key</summary>${tops.map((t) => `<p><b>${esc(t.title)}:</b> ${t.skills.map((s, i) => `${i + 1}. ${esc(s.title)}`).join(' · ')}</p>`).join('')}</details>
    <div class="printonly">${tops.map((t) => `<p class="keyline"><b>${esc(t.title)}:</b> ${t.skills.map((s, i) => `${i + 1}. ${esc(s.title)}`).join(' · ')}</p>`).join('')}</div>
  </section>`;
}
function pReports() {
  P.rkind = P.rkind || 'daily'; P.rdate = P.rdate || dayKey();
  const date = parseDay(P.rdate);
  const list = (P.rkid && P.rkid !== 'both') ? [K(P.rkid)] : kids();
  return `<div class="noprint">${kidSwitch(true)}
    <div class="seg">${[['daily', 'Daily'], ['weekly', 'Weekly'], ['heatmap', 'Topic heatmap']].map(([id, l]) => `<button class="${P.rkind === id ? 'on' : ''}" data-act="rkind" data-id="${id}">${l}</button>`).join('')}</div>
    <div class="formrow">${P.rkind !== 'heatmap' ? `<label>${P.rkind === 'daily' ? 'Day' : 'Week containing'}</label><input type="date" data-act="rdate" value="${P.rdate}">` : ''}<button class="btn primary" data-act="print" data-what="report">📄 Save as PDF</button></div>
    <p class="muted small">On iPad: tap <b>Save as PDF</b> → in the print screen, pinch out on the preview (or tap Share) → <b>Save to Files</b>.</p></div>
    <div class="report" id="report"><div class="printhead">Maths Buddy · ${P.rkind === 'heatmap' ? 'Topic heatmap' : P.rkind === 'daily' ? 'Daily summary' : 'Weekly summary'}</div>${list.map((k) => reportKid(k, P.rkind, date)).join('')}</div>`;
}

/* ---------- settings ---------- */
const AVATARS = ['🦁', '🦄', '🐯', '🐼', '🦊', '🐬', '🦋', '🐉', '🚀', '⚽', '🎨', '🌟', '🐱', '🐶', '🦖', '👑'];
function pSettings() {
  const s = DB.settings;
  return `<section class="card"><h2>Children</h2>${kids().map((k) => `<div class="kidset" data-kid="${k.id}">
      <div class="formrow"><label>Name</label><input data-act="kname" data-kid="${k.id}" value="${esc(k.name)}"><label>Year</label><select data-act="kyear" data-kid="${k.id}">${[4, 6].map((y) => `<option ${k.year === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
      <div class="avas">${AVATARS.map((a) => `<button class="${k.avatar === a ? 'on' : ''}" data-act="kava" data-kid="${k.id}" data-a="${a}">${a}</button>`).join('')}</div>
      <div class="formrow wrap"><label>Focus areas</label>${topicsFor(k.year).map((t) => `<label class="cb"><input type="checkbox" data-act="kfocus" data-kid="${k.id}" value="${t.id}" ${k.focus.includes(t.id) ? 'checked' : ''}> ${t.title}</label>`).join('')}</div>
    </div>`).join('')}</section>
  <section class="card"><h2>Term dates (for "what is school teaching")</h2>
    <div class="formrow wrap">${[['autumn', 'Autumn starts'], ['spring', 'Spring starts'], ['summer', 'Summer starts'], ['end', 'Year ends']].map(([id, l]) => `<label>${l}<input type="date" data-act="term" data-id="${id}" value="${s.terms[id]}"></label>`).join('')}</div>
    <p class="muted small">Defaults are typical Dubai British-curriculum dates for 2026–27. Change them to match GEMS Winchester's calendar.</p></section>
  <section class="card"><h2>Sessions</h2>
    <div class="formrow wrap"><label>Minutes per session <input type="number" min="20" max="90" step="5" data-act="mins" value="${s.sessionMins}"></label>
    <span>Days:</span>${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="cb"><input type="checkbox" data-act="pday" value="${d}" ${s.days.includes(d) ? 'checked' : ''}> ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]}</label>`).join('')}</div>
    <div class="formrow wrap"><label class="cb"><input type="checkbox" data-act="sound" ${s.sound ? 'checked' : ''}> Sound effects</label><label class="cb"><input type="checkbox" data-act="speech" ${s.speech ? 'checked' : ''}> "Read aloud" button</label></div></section>
  <section class="card"><h2>Security & data</h2>
    <div class="row2"><button class="btn" data-act="changepin">Change PIN</button><button class="btn" data-act="export">⬇️ Back up progress</button><label class="btn filebtn">⬆️ Restore backup<input type="file" accept="application/json" data-act="import"></label></div>
    <p class="muted small">Progress is stored only on this iPad. Make a backup now and then (save it to Files or iCloud) — if Safari's data is cleared, you can restore it.</p>
    <div class="row2"><button class="btn danger" data-act="reset">Reset all progress…</button></div></section>`;
}

function afterParent() { /* placeholder for future charts */ }

/* =========================================================================
   EVENTS
   ========================================================================= */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act],[data-key],[data-pin]'); if (!el) return;
  if (el.dataset.key !== undefined) { typeKey(el.dataset.key); return; }
  if (el.dataset.pin !== undefined) { pinKey(el.dataset.pin); return; }
  const a = el.dataset.act, d = el.dataset;
  if (el.tagName === 'A') e.preventDefault();
  if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type !== 'button')) return;
  switch (a) {
    case 'home': S = null; clearTimers(); view = 'home'; break;
    case 'kid': S = null; clearTimers(); cur.kid = d.id || cur.kid; view = 'kid'; break;
    case 'topic': cur.topic = d.id; view = 'topic'; break;
    case 'badges': view = 'badges'; break;
    case 'part': { const kid = K(cur.kid), p = todaysMission(kid).parts[+d.i]; startSession(Object.assign({ kid: kid.id, part: p.key }, p)); return; }
    case 'practise': startSession({ kid: cur.kid, mode: 'practice', topic: d.topic, skill: d.skill || null, n: 10 }); return;
    case 'check': startSession({ kid: cur.kid, mode: 'check', topic: d.topic }); return;
    case 'challenge': startSession({ kid: cur.kid, mode: d.id }); return;
    case 'submit': submit(S.input); return;
    case 'choose': submit(+d.i); return;
    case 'hint': if (S.hints < S.q.hints.length) S.hints++; break;
    case 'showme': showMe(); return;
    case 'speak': speakText(S.q.prompt); return;
    case 'next': advance(); return;
    case 'quit': if (S.results.length && !confirm('Stop now? Your answers so far are saved.')) return; finishSession(false); return;
    case 'again': { const o = S; startSession({ kid: o.kid, mode: o.mode, topic: o.topic, skill: o.skill, n: o.n, part: o.part }); return; }
    case 'parent': pinBuf = ''; view = unlocked ? 'parent' : 'pin'; break;
    case 'forgotpin': if (confirm('Reset the parent PIN? Progress is kept; you will create a new PIN.')) { DB.settings.pin = null; save(); } break;
    case 'lock': unlocked = false; view = 'home'; break;
    case 'ptab': parentTab = d.id; break;
    case 'gotab': parentTab = d.tab; P.kid = d.kid; P.rkid = d.kid; if (d.tab === 'reports') { P.rkind = 'daily'; P.rdate = dayKey(); } break;
    case 'pkid': P.kid = d.id; P.topic = null; P.skill = null; break;
    case 'rkid': P.rkid = d.id; break;
    case 'rkind': P.rkind = d.id; break;
    case 'guide': parentTab = 'teach'; if (d.kid) P.kid = d.kid; P.topic = d.topic; P.skill = d.skill || null; break;
    case 'guideskill': P.skill = d.skill; break;
    case 'newex': break;
    case 'assign': { const kid = K(P.kid); kid.override = { topic: d.topic, week: dayKey(planWeekStart()) }; save(); toast(`${esc(T[d.topic].title)} set as ${esc(kid.name)}'s main topic this week`); break; }
    case 'print': document.body.dataset.print = d.what; setTimeout(() => { window.print(); }, 50); return;
    case 'kava': K(d.kid).avatar = d.a; save(); break;
    case 'changepin': DB.settings.pin = null; unlocked = false; pinFirst = null; save(); view = 'pin'; break;
    case 'export': exportData(); return;
    case 'reset': if (prompt('Type RESET to delete all progress (names and settings are kept).') === 'RESET') { const keep = DB; load(); DB.log = []; DB.sessions = []; DB.checks = []; kids().forEach((k) => { const b = newKid(k.id, k.name, k.year, k.avatar, k.color, k.focus); Object.assign(k, b); }); DB.settings = keep.settings; save(); toast('Progress reset'); } break;
    default: return;
  }
  render();
});
document.addEventListener('change', (e) => {
  const el = e.target, a = el.dataset.act, d = el.dataset; if (!a) return;
  const k = d.kid ? K(d.kid) : null;
  switch (a) {
    case 'override': { const kid = K(P.kid); kid.override = el.value ? { topic: el.value, week: dayKey(planWeekStart()) } : null; break; }
    case 'topicsel': P.topic = el.value; P.skill = null; break;
    case 'rdate': P.rdate = el.value || dayKey(); break;
    case 'kname': k.name = el.value.trim() || k.name; break;
    case 'kyear': k.year = +el.value; k.focus = k.focus.filter((t) => T[t] && T[t].year === k.year); break;
    case 'kfocus': k.focus = el.checked ? [...new Set(k.focus.concat(el.value))] : k.focus.filter((x) => x !== el.value); break;
    case 'term': if (el.value) DB.settings.terms[d.id] = el.value; break;
    case 'mins': DB.settings.sessionMins = Math.max(20, Math.min(90, +el.value || 60)); break;
    case 'pday': { const v = +el.value; DB.settings.days = el.checked ? [...new Set(DB.settings.days.concat(v))] : DB.settings.days.filter((x) => x !== v); if (!DB.settings.days.length) DB.settings.days = [1]; break; }
    case 'sound': DB.settings.sound = el.checked; break;
    case 'speech': DB.settings.speech = el.checked; break;
    case 'import': importData(el.files[0]); return;
    default: return;
  }
  save(); render();
});
document.addEventListener('keydown', (e) => {
  if (view === 'pin' && /^\d$/.test(e.key)) return pinKey(e.key);
  if (view !== 'play' || !S) return;
  if (e.target.tagName === 'INPUT') return;
  const q = S.q;
  if (S.phase === 'reveal' && e.key === 'Enter') return advance();
  if (q.answer.kind === 'choice') { const n = +e.key; if (n >= 1 && n <= q.answer.options.length) submit(n - 1); return; }
  if (/^[0-9]$/.test(e.key)) typeKey(e.key);
  else if (e.key === 'Backspace') typeKey('⌫');
  else if (e.key === 'Enter') submit(S.input);
  else if (e.key === '-') typeKey('−');
  else if (['.', '/', ':', 'r'].includes(e.key)) typeKey(e.key);
  else if (e.key === ' ') { e.preventDefault(); typeKey(' '); }
});
window.addEventListener('afterprint', () => { delete document.body.dataset.print; });

function exportData() {
  const blob = new Blob([JSON.stringify(DB)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `maths-buddy-backup-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!d.kids || !d.settings) throw 0; if (!confirm('Replace the progress on this iPad with the backup?')) return; localStorage.setItem(KEY, JSON.stringify(d)); load(); toast('Backup restored'); render(); } catch (e) { toast('That file is not a Maths Buddy backup'); } };
  r.readAsText(file);
}

/* =========================================================================
   BOOT
   ========================================================================= */
load();
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
window.MB = { get DB() { return DB; }, get S() { return S; }, weekPlan, todaysMission, calendarFor, statsFor, render, K };
})();
