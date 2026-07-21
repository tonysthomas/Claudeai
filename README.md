# JARVIS · It's AI Education

A voice-enabled **command dashboard** for the *It's AI Education* academy — a Jarvis-style co-pilot that knows the whole strategy and guides Tony through the daily plan.

> **Signature promise:** *From AI Awareness to AI Leadership.*

## What it does

Jarvis has the entire project loaded — the strategy, the Phase 1 working plan, the day-by-day posting plan (all 65 posts), and the five-level academy framework — and uses it to keep you focused each day.

| Section | What it gives you |
|---|---|
| **Command** | A date-aware daily briefing, the reactive Jarvis orb, today's posts, and live gate progress. |
| **Today** | Every scheduled post for the current date — hook, format, time, CTA — checkable as you publish. |
| **This Week** | The week's curriculum focus, the Sun→Fri production rhythm, and every post in the week. |
| **Academy** | The 5-level pyramid (Fluency → Application → Adoption → Governance → Leadership) with modules, audiences, outcomes and certifications, plus the content→revenue map. |
| **Strategy** | Purpose / vision / mission, the founder edge, three pillars, the four phases, the revenue model, non-negotiables and market signal. |
| **Phase Gate** | The seven "must be true by 31 Aug" conditions with live progress meters — update your numbers and Jarvis reflects them everywhere. |
| **Daily Log** | Tell Jarvis how the day went or log a change to the strategy/plan. Everything feeds tomorrow's brief. |
| **Social** | Phase-2 scaffold for live channel intelligence (Instagram, LinkedIn, YouTube, Email). |

## Talking to Jarvis

- **Tap the orb or the mic** and speak — voice input uses the browser's Web Speech API.
- **Or type** in the dock at the bottom.
- Jarvis **speaks its replies** (toggle the 🔊 button to mute).

Things to try: *"Brief me"* · *"What's my plan today?"* · *"How am I doing?"* · *"Read me the strategy"* · *"Explain the five levels"* · *"I have 40 subscribers"* (updates the tracker) · *"Log: posted the settings carousel, 14 saves"*.

### Two brains
- **Local brain (default):** works offline, no keys. Knows the plan and answers the common questions, updates metrics, logs notes, marks posts done.
- **Claude (optional):** add an Anthropic API key in **⚙ Settings** to unlock open-ended conversation, nuanced feedback and content drafting. The key is stored only in your browser. Live API calls need the app served from a real web host (a preview sandbox will fall back to the local brain automatically).

## Running it

It's a single self-contained file — no build step.

- **Locally:** open `index.html` in Chrome or Edge. *(Voice input needs a secure context — use `http://localhost` or a hosted HTTPS URL, not `file://`.)*
- **Hosted:** enable GitHub Pages on this repo (Settings → Pages → deploy from branch) and open the published URL. Voice works over HTTPS.

## Notes

- **Voice support:** speech recognition works in Chromium browsers (Chrome, Edge). Speech synthesis works everywhere. Pick a British male voice in Settings for the full Jarvis effect.
- **Your data** (task progress, metrics, logs, settings) lives in `localStorage` in your browser — nothing is sent anywhere unless you add an API key.
- Built on the brand palette: Navy `#0c1a2b` · aha-blue `#5ab0ff` · stop-orange `#ff7a59`.

---
*Today's date drives the dashboard. During Phase 1 (18 Jul – 31 Aug 2026) it lands you on the exact day's plan; outside that window it clamps to the nearest planned day.*
