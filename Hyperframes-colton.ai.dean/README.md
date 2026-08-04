# Hyperframes — AI Video Editing Workspace

An HTML + GSAP video workspace built on [Hyperframes](https://hyperframes.heygen.com), wired up for short-form content (Instagram Reels / TikTok / YouTube Shorts). Clone it, open it in [Claude Code](https://claude.com/claude-code), and it edits videos for you — in *your* style.

> Not a Remotion / React / Next.js video stack. Every composition here is a regular HTML file with a paused GSAP timeline. The Hyperframes CLI handles lint, preview, and render.

## ⚡ Get started in one line

1. Open this repo in **Claude Code**.
2. Say:

   > **clone this repo and help me get set up**

That's it. Claude will greet you, check your environment, ask a few questions about you, and — most importantly — have you **paste in a few of your favorite reels/videos** so it learns the editing style you want before it builds anything. Setup takes about 5 minutes.

*(Prefer to trigger it yourself? Just run `/setup` any time.)*

## What you get

- **A guided setup** (`/setup`) that builds your creator profile and learns your style from reference videos you love.
- **9 skills** that encode the Hyperframes framework so Claude writes correct compositions from the start: `/hyperframes`, `/hyperframes-cli`, `/gsap`, `/hyperframes-registry`, `/website-to-hyperframes`, `/make-a-video`, `/short-form-video`, `/study-creator`, `/feedback`.
- **A style-learning loop** — `/study-creator <url>` studies any TikTok/Reel/Short frame-by-frame; `/feedback` captures what you liked after each video. The workspace gets better at matching your taste over time.
- **A royalty-free SFX + music library** under `assets/` (free for commercial use — see `assets/sfx/MANIFEST.md`).
- **A motion-graphics playbook** (`MOTION_PHILOSOPHY.md`) for a polished, consistent look.

## Prerequisites

- **Node 22+** — `node --version` to check ([nodejs.org](https://nodejs.org))
- **FFmpeg** on your `PATH` — for audio extraction, frame work, and re-encoding
- **Chrome (latest)** — Hyperframes renders through headless Chromium
- **~5 GB free disk** — renders can stack up
- **16 GB RAM recommended** for smooth Studio preview with multiple shader blocks

Setup runs `npx hyperframes doctor` to confirm all of this for you.

## After setup — make your first video

Just talk to Claude:

> `/make-a-video` — *interviews you, then builds a finished MP4 end-to-end*

or, if you already have a talking-head clip to overlay:

> `/short-form-video` — *9:16 vertical talking-head + motion-graphics playbook*

Then capture what you thought:

> `/feedback` — *records what worked / didn't into `PREFERENCES.md`, so future videos respect your taste automatically*

## The authoring loop

```
read CREATOR.md + PREFERENCES.md → invoke /hyperframes → edit → lint
  → live Studio preview (Gate 1) → draft render → frame-by-frame self-review
  → MP4 preview (Gate 2) → final render → /feedback
```

Full details — render contract, preview gates, and the every-frame visual-verification rule — live in [`CLAUDE.md`](CLAUDE.md).

## How it learns your style

| File / folder | What it holds |
|---|---|
| `CREATOR.md` | Who you are — handles, niche, platform priority, on-camera mode, workflow. Set during `/setup`. |
| `PREFERENCES.md` | Your accumulated taste. Starts empty; fills in via `/feedback` after each video. |
| `_reference/creator-library/` | Style fingerprints of creators you study with `/study-creator`. |
| `MOTION_PHILOSOPHY.md` | The gold-standard motion aesthetic the workspace falls back to. |
| `assets/brand-tokens.css` | Your brand colors + fonts. Set during `/setup`. |

## Troubleshooting

| Symptom | First thing to try |
|---|---|
| `npx hyperframes` — command not found | `npm install` here, then `npx skills add heygen-com/hyperframes --yes` |
| Render fails mid-way | `npx hyperframes doctor` — verifies Node, FFmpeg, Chrome |
| Studio preview stuck at 0s | Hard-refresh (Ctrl+Shift+R), or open a sub-comp URL: `http://localhost:3002/?comp=<id>` |
| Lint errors about overlapping clips | Two clips share a `data-track-index` and overlap in time — change the track index or adjust timing |
| Video frozen in render, audio continues | A `<video>` was animated directly — wrap it in a `<div>` and animate the wrapper |

More: `npx hyperframes docs <topic>` (topics: `data-attributes`, `gsap`, `rendering`, `examples`, `troubleshooting`, `compositions`).

## Credits & license

- This workspace is **MIT licensed** — see [`LICENSE`](LICENSE). Use it freely.
- **Hyperframes** — the underlying framework © HeyGen, Apache 2.0, docs at https://hyperframes.heygen.com
- **SFX / music** — Pixabay (CC0) + Mixkit (free license), both free for commercial use. See `assets/sfx/MANIFEST.md`.
