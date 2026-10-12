# Maths Buddy: maths tutor for Jaden (Year 6) and Evangeline (Year 4)

An offline iPad web app that tutors both children in maths. It follows the **White Rose Maths / Power Maths** small steps used at GEMS Winchester, and it helps the parent plan, teach and assess.

## What's inside (Phase 1)

| For the kids | For the parent (PIN-protected) |
|---|---|
| **Today's mission**: Warm-up, Learn, Boost and Challenge, built from the weekly plan | **Overview**: today's minutes, questions, accuracy, focus areas and "stuck on X" alerts |
| **26 topics / 117 small steps** (Y4 and Y6) with endless generated questions | **Weekly plan**: a 60-minute agenda for each day; set what school is teaching this week |
| **Hints**, then a **"Show me how"** worked solution in the *school method* (column methods with exchanging, bus stop, long division with a multiples list, place value charts, bar models) | **Lesson guides** for every topic: the school method, Concrete → Pictorial → Abstract, "Say this / Ask this", common mistakes and fixes, a live worked example and quick-fire questions |
| **Points, ranks, badges, streaks** | **Reports**: daily summary, weekly summary and a topic heatmap, all saved as **PDF** |
| **Challenges**: Beat the Clock, the Year 4 **Times Tables Check** (25 questions × 6 s) and a **CAT4-style Reasoning** challenge | **Settings**: names, avatars, focus areas, term dates, session length, backup and restore |

Focus areas are already set:
- **Jaden:** place value, division, and factors/multiples/primes.
- **Evangeline:** subtraction, multiples and factors, division, and times tables.

## How mastery works
- Each small step tracks the last 10 answers. First-time correct counts 1, correct after a hint or a second try counts ½, and wrong counts 0.
- **Secure (green)** means 80%+ accuracy over at least 5 recent answers. Amber means "getting there" and red means "needs help".
- Practice is adaptive. It works on the first step that isn't secure, mixes in earlier steps, and re-asks a similar question after a mistake. Times-table practice leans towards the tables the child gets wrong.

## Install on the iPad
1. Open the app's web address in **Safari** (GitHub Pages: `…/mathtutor/`).
2. Tap **Share → Add to Home Screen**. It now opens full-screen and works **offline**.
3. Open **Parent area** and create a 4-digit PIN. In **Settings**, check the term dates against the school calendar.

> Progress is saved **on the iPad only**. Use **Settings → Back up progress** now and then and keep the file in Files/iCloud.
> PDF: in Reports tap **Save as PDF**, then on the print screen tap **Share → Save to Files**. If the print screen doesn't appear in the home-screen app, open the same address in Safari.

## Files
`engine.js` holds the question engine, answer checking and the school-method renderers. `topics-y4.js` and `topics-y6.js` hold the small steps. `curriculum.js` holds the term map and lesson guides. `app.js` holds the UI, plans, gamification and reports. `sw.js` handles offline caching. There is no build step.

To add a subject or year later, add a topics file with the same shape plus a block in `curriculum.js`.

## Tests
```bash
node mathtutor/tests/engine.test.js            # generates ~45k questions; checks every answer key and worked method
npx http-server -p 8765 . &                     # from the repo root
NODE_PATH=$(npm root -g) node mathtutor/tests/e2e.cjs /tmp/shots   # iPad-sized browser run with screenshots
```

When you change any app file, bump `VERSION` in `sw.js` so installed iPads pick up the update.
