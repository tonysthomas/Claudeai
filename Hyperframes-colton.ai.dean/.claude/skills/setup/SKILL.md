---
name: setup
description: First-run onboarding for a freshly cloned Hyperframes workspace. Use when CREATOR.md still contains the HYPERFRAMES_SETUP_INCOMPLETE marker, when the user says "/setup", "help me get set up", "let's get started", "I just cloned this", "set up Hyperframes", or otherwise arrives at a brand-new, un-configured clone. Walks the user through an environment check, a creator-profile interview, collecting their favorite reference reels (auto-studied via /study-creator), and brand colors — then removes the setup marker.
---

# Setup — Get a New Hyperframes User Started

This skill is the welcome mat. Someone just cloned this repo into Claude Code and said "clone this repo" / "help me get set up." Your job is to walk them from zero to ready-to-make-their-first-video, in a friendly one-pass conversation.

**Tone:** warm, concise, encouraging. They may be brand new to video editing AND to Claude Code. Don't dump walls of text — one short step at a time, confirm, move on.

**The most important step is Step 3 (reference reels).** Before they make anything, you collect a few of their favorite videos so the workspace learns the style they want you to edit in. Don't skip it.

## When this skill fires

- `CREATOR.md` contains `<!-- HYPERFRAMES_SETUP_INCOMPLETE -->` and the user sends their first message
- The user says `/setup`, "help me get set up", "let's get started", "I just cloned this", "set up Hyperframes"
- Any time the user wants to re-run onboarding or reset their profile

## Before you start

Read `CREATOR.md` and `PREFERENCES.md` so you know the current state. If the setup marker is gone and the profile looks filled in, ask the user whether they want to re-run setup (and overwrite) or just edit a specific section — don't blow away a configured profile without asking.

## The flow

### Step 0 — Welcome

Greet them. One or two sentences. Set expectations:

> 👋 Welcome to Hyperframes! This is a workspace where I build short-form videos (TikTok / Reels / Shorts) for you in *your* style. Let's spend ~5 minutes getting set up so I know who you are and what you like. I'll go one step at a time.

### Step 1 — Environment check

Confirm the machine can actually render video. Run these and report results plainly:

```bash
node --version          # need Node 22+
npm install             # installs the workspace dev deps (just Playwright)
npx hyperframes doctor  # checks Node, FFmpeg, Chrome
```

- If `node` is missing or <22 → point them to https://nodejs.org (LTS).
- If FFmpeg is missing → `brew install ffmpeg` (macOS), `choco install ffmpeg` (Windows), or the distro package manager (Linux).
- If Chrome is missing → install the latest Google Chrome.
- If `npx hyperframes` isn't found after `npm install` → `npx skills add heygen-com/hyperframes --yes` then retry `npx hyperframes doctor`.

Don't block on a perfect environment — note anything missing, tell them how to fix it, and continue. They can render once it's installed.

### Step 2 — Creator interview

Ask, ideally in **one `AskUserQuestion` batch**, the essentials. Keep options concrete; let them free-type when needed:

1. **Name on-screen** — what name (or brand name) appears in outros/lower-thirds?
2. **Handles** — Instagram / TikTok / YouTube / X (whichever they have; "—" for none).
3. **Platform priority** — TikTok-first / Reels-first / Shorts-first / cross-post all. (Drives default aspect ratio; default to 9:16 vertical 1080×1920 unless they say landscape.)
4. **Content niche** — what their videos are about (AI, fitness, finance, cooking, comedy, etc.).
5. **On-camera mix** — face-cam / faceless / both.
6. **Workflow** — do they record + pre-edit their own speaking video (you build the visual layer on top, never cutting their audio), or build from scratch with you (motion graphics + TTS)?

Write the answers into `CREATOR.md` by editing the matching sections. Replace the `_(placeholder)_` italics with their real values. **Do not remove the setup marker yet** — that happens at the end.

### Step 3 — Reference reels (THE KEY STEP — don't skip)

This is what makes the workspace edit in *their* style. Say something like:

> Now the fun part. Before we make anything, paste in **3–5 of your favorite videos** — reels, TikToks, or Shorts whose editing style you'd love yours to feel like. They can be other creators you admire or your own best videos. I'll study each one frame-by-frame and learn its signature moves so your videos start out looking the way you want.

Collect the links (any mix of TikTok / Instagram Reel / YouTube Short / YouTube URLs). For **each** link, run the existing **`/study-creator <url>`** skill — it downloads, transcribes, extracts frames, reads every frame, and writes a style analysis into `_reference/creator-library/<handle>/`. At 3+ videos per creator it auto-rolls a `style-distilled.md` fingerprint.

- Run them one at a time and give a one-line progress note after each: `[2/4] Studied @creator — signature move: <one line>`.
- If a link fails (private account, region lock, login wall), tell them and move on to the next — don't abort the whole step.
- Suggest at least 3 total. If they only have one creator they love, 3 videos from that one creator still triggers a distilled fingerprint.
- If they genuinely have none right now, that's OK — tell them they can add references any time with `/study-creator <url>`, and the workspace will lean on `MOTION_PHILOSOPHY.md` defaults until then.

### Step 4 — Brand colors

Ask for their brand look (or offer to start neutral):

- Background color, accent/highlight color, text color, and a display font (or "use sensible defaults for now").

Fill `assets/brand-tokens.css` with their values. If they're not sure, set a clean dark default and tell them it'll evolve via `/feedback`:

```css
:root {
  --brand-bg: #0a0a0f;
  --brand-surface: #1a1a23;
  --brand-accent: #3b82f6;
  --brand-text: #ffffff;
  --font-display: system-ui, sans-serif;
}
```

### Step 5 — Optional API keys

Mention that nothing is required to start, but if any project uses OpenAI or ClickUp, they can copy `.env.example` to `.env` and add keys later. Don't block on this.

```bash
cp .env.example .env   # then fill in keys only if/when a project needs them
```

### Step 6 — Finish

1. **Remove the setup marker.** Edit `CREATOR.md` and delete the `<!-- HYPERFRAMES_SETUP_INCOMPLETE -->` line (and its companion comment lines). This flips the workspace into normal mode so the welcome doesn't fire again.
2. Recap in 2–3 sentences: what you saved (profile, N reference creators studied, brand colors), and that `PREFERENCES.md` will fill in automatically as they use `/feedback`.
3. Point them at the first build:
   > You're all set! 🎬 To make your first video, say **`/make-a-video`** (I'll interview you and build it end-to-end) or **`/short-form-video`** if you've already got a talking-head clip to overlay. After each video, run **`/feedback`** so I keep getting closer to your taste.

## Safety rules

- **Never remove the setup marker before the flow actually completes** — if the user bails partway, leave it so onboarding resumes next time.
- **Don't overwrite a already-configured `CREATOR.md`/`PREFERENCES.md` without confirming.**
- **Don't fabricate reference analyses** — only `/study-creator` writes to `_reference/creator-library/`. If a link fails, say so.
- **Keep it conversational** — one step at a time, confirm before moving on. This is someone's first impression of the workspace.
