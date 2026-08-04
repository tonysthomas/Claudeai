# Hyperframes — Video Workspace

HTML-native video workspace built on [Hyperframes](https://hyperframes.heygen.com). A workspace for short-form content (Instagram Reels / TikTok / YouTube Shorts). Not a Remotion project — this is the HTML pipeline.

**This workspace hosts multiple video projects, one folder each, all under `video-projects/`.** The workspace root holds shared tooling (`node_modules/`, `package.json`, `.claude/`, this `CLAUDE.md`, `MOTION_PHILOSOPHY.md`, `PREFERENCES.md`, `DESIGN.example.md`) — never put `index.html`, `assets/`, `compositions/`, or `renders/` directly at the root. Always work from inside a project subfolder.

---

## 🚀 FIRST-RUN SETUP — DO THIS BEFORE ANYTHING ELSE

**Before any other action, check whether this is a fresh, un-configured clone.** Open `CREATOR.md` and look for the marker `<!-- HYPERFRAMES_SETUP_INCOMPLETE -->` near the top.

**If that marker is present**, the user just cloned this repo and has not set it up yet. Your **first response** must be to greet them and start onboarding — do not begin any video work, do not ask what they want to build first. Say something like:

> 👋 **Welcome to Hyperframes! Let's get you set up.**
> I'll walk you through a quick setup so I can edit videos in *your* style. This takes about 5 minutes.

Then **invoke the `/setup` skill** (`.claude/skills/setup/SKILL.md`) and follow it step by step. The setup flow covers: checking your environment, filling in your creator profile, **collecting your favorite reel/video links so I can learn the style you want**, and setting your brand colors. When setup finishes, the `<!-- HYPERFRAMES_SETUP_INCOMPLETE -->` marker is removed and normal video work begins.

**If the marker is absent**, setup is already done — skip straight to the normal workflow below. (If the user ever wants to redo setup, they can say `/setup`.)

---

## CREATOR.md + PREFERENCES.md — READ BOTH BEFORE EVERY VIDEO TASK

**`CREATOR.md`** holds the user's identity, handles, niche, platform priority, on-camera mode, and the division of labor. **`PREFERENCES.md`** holds the user's accumulated taste — what they like, what they don't, what to never repeat (populated over time via `/feedback`).

**You MUST read BOTH before:**
- Brainstorming a new composition or scene
- Picking colors, fonts, transitions, or pacing
- Choosing registry blocks
- Drafting captions or motion graphics
- Putting any handle, name, or social text on screen

**Order of precedence**: `CREATOR.md` (identity facts) > `PREFERENCES.md` (user's taste) > **named `_reference/creator-library/<handle>/style-distilled.md`** (when the user names a creator reference for this build) > `MOTION_PHILOSOPHY.md` (aesthetic baseline) > skill defaults.

If `PREFERENCES.md` is empty in a section, fall back to skill defaults — it will fill in via `/feedback` over time.

When the user says "log feedback", "save feedback", or invokes `/feedback`, run the feedback skill to capture lessons from the just-finished video.

### Inspiration creators — `/study-creator`

When the user pastes an external creator's TikTok / Instagram Reel / YouTube Short URL (anything that isn't their own speaking video), or says "study this creator" / "analyze this video" / "save this to the creator library", run the `/study-creator` skill. It downloads the video, transcribes it, extracts frames, reads every frame, and writes a structured `analysis.md` into `_reference/creator-library/<handle>/videos/<slug>/`. At 3+ analyses per creator, a `style-distilled.md` auto-rolls.

This is the engine behind setup's "paste your favorite reels" step — those links get studied here so the workspace knows the style you want from day one.

**At build time**: when the user says "build this like @handle" (or "blend @h1 + @h2"), read each named handle's `_reference/creator-library/<handle>/style-distilled.md` before brainstorming scenes. Those fingerprints override `MOTION_PHILOSOPHY.md` defaults for hook structure, caption style, pacing, transition rotation, and scene archetypes — but remain subordinate to `PREFERENCES.md`. If a handle doesn't have a distilled file yet (fewer than 3 analyses), read the available `videos/*/analysis.md` files directly.

### Division of labor (from CREATOR.md)

Many creators record and pre-edit their own speaking video, then have the assistant build the visual layer on top. **If `CREATOR.md` says the user works this way, do NOT cut their audio, remove pauses, restructure their speech, or change their pacing.** Their speaking video is the source of truth — sync visuals to its timing, never the other way around. Other creators build faceless videos with motion graphics + TTS narration; `CREATOR.md` records which mode the user prefers.

## MOTION_PHILOSOPHY.md — READ BEFORE BRAINSTORMING

**`MOTION_PHILOSOPHY.md` (at the workspace root) is the canonical motion-graphics aesthetic baseline.** It is a deconstructed playbook of a gold-standard 30s motion spot — the reference for motion builds in this workspace.

**You MUST read it before:**
- Brainstorming a new composition, scene, or storyboard
- Proposing a visual direction, palette, or pacing
- Picking transitions, animations, or registry blocks
- Designing any kinetic typography, logo reveal, or product showcase

**How to use it:**
1. **Always read the full file** at the start of any creative session — `Read MOTION_PHILOSOPHY.md` from the workspace root. Don't skim, don't quote from memory.
2. **Re-read sections 0 (10 Laws) and 4 (pre-flight checklist)** every time, even on quick iterations. They are the discipline.
3. **Apply the defaults**: ~1.5s avg scene length, black canvas + perspective grid + crosshairs + vignette + grain on every scene, chrome-gradient text with halo glow, motion-blurred whip transitions (never hard cuts), ≤5 symbolic colors, hold the outro 4–6s, rule of threes.
4. **Use the recipes**: section 3 has copy-pasteable HyperFrames patterns (composition shell, kinetic-type opener, whip-streak, color-recolor trick, registry block mappings).
5. **Run the pre-flight checklist** before claiming any motion piece is done.

**Order of precedence**: `PREFERENCES.md` (user's taste) > `MOTION_PHILOSOPHY.md` (aesthetic baseline) > skill defaults. When a brand brief explicitly demands a different aesthetic, keep the discipline (one idea per beat, motion in transitions, breathing outros, callbacks) but adapt the palette and texture.

If either file is missing from the workspace root, stop and ask the user before brainstorming — they should always be there.

## Skills — USE THESE FIRST

**Always invoke the matching skill before writing or modifying compositions.** Skills encode framework-specific patterns (`window.__timelines` registration, `data-*` attribute semantics, shader-compatible CSS, relative-timing syntax) that are NOT in generic web docs. Skipping them produces broken compositions.

| Skill                    | Command                    | When to use                                                                               |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------- |
| `setup`                  | `/setup`                   | First-run onboarding — creator profile, reference reels, brand colors (re-run any time)    |
| `hyperframes`            | `/hyperframes`             | Authoring/editing compositions, captions, TTS, audio-reactive animation, transitions      |
| `hyperframes-cli`        | `/hyperframes-cli`         | CLI commands: `init`, `add`, `lint`, `preview`, `render`, `transcribe`, `tts`, `doctor`   |
| `gsap`                   | `/gsap`                    | GSAP animation — timelines, easing, stagger, ScrollTrigger, plugins, performance          |
| `hyperframes-registry`   | `/hyperframes-registry`    | Installing catalog blocks/components via `npx hyperframes add <name>`                     |
| `website-to-hyperframes` | `/website-to-hyperframes`  | Turning a URL into a composition (7-step capture-to-video pipeline)                       |
| `make-a-video`           | `/make-a-video`            | Beginner-friendly end-to-end video creator (interview → scaffold → render)                 |
| `short-form-video`       | `/short-form-video`        | 9:16 vertical talking-head + motion-graphic playbook (TikTok/Reels/Shorts)                 |
| `feedback`               | `/feedback`                | Capture what worked/didn't on a finished video; updates `PREFERENCES.md`                   |
| `study-creator`          | `/study-creator <url>`     | Study a reference creator's video; writes analysis + rolls up style fingerprint at ≥3 vids |

Not present? `npx skills add heygen-com/hyperframes --yes` then reopen this directory.

## Commands

```bash
# Authoring loop
npx hyperframes preview                          # Studio opens in browser with hot reload (port 3002)
npx hyperframes lint                             # static HTML check — always run before rendering
npx hyperframes compositions                     # list comp IDs + resolved durations
npx hyperframes render --quality draft --output renders/draft.mp4   # fast iteration render
npx hyperframes render --quality standard --output renders/final.mp4 # visually lossless 1080p

# Catalog & install
npx hyperframes catalog --type block             # browse 38 blocks
npx hyperframes catalog --type component         # browse 3 components
npx hyperframes add <name>                       # install a catalog item into compositions/

# Media pipeline (baked into CLI — no Whisper CLI needed)
npx hyperframes transcribe <file> --model small.en --json   # word-level timestamps
npx hyperframes tts "text" --voice am_adam --output narration.wav   # on-device Kokoro-82M

# Diagnostics
npx hyperframes doctor                           # env check (Node, FFmpeg, Chrome, Docker)
npx hyperframes info --json                      # project stats
npx hyperframes benchmark                        # find optimal workers/quality
npx hyperframes docs <topic>                     # inline docs: data-attributes, gsap, rendering, examples, troubleshooting, compositions
```

### Render flags worth knowing

- `--quality draft|standard|high` — CRF 28 / 18 / 15 (standard is visually lossless at 1080p)
- `--fps 24|30|60` (default 30)
- `--format mp4|mov|webm` — `mov` = ProRes 4444 with alpha, `webm` = VP9 alpha (Chromium only)
- `--workers <n>` / `--gpu` / `--docker` / `--crf <n>` / `--video-bitrate 10M`
- `--max-concurrent-renders <n>` — when running the producer server

## Workspace Layout

```
hyperframes/
├── CLAUDE.md, AGENTS.md, README.md          ← workspace docs (you are here)
├── CREATOR.md                                ← your identity & workflow — set during /setup, read before EVERY task
├── PREFERENCES.md                            ← your accumulated taste — read before EVERY video task
├── MOTION_PHILOSOPHY.md                      ← gold-standard motion aesthetic — read before brainstorming
├── DESIGN.example.md                         ← brand-spec template (worked example)
├── package.json, node_modules/               ← workspace tooling (just Playwright; CLI via npx)
├── .claude/                                  ← skills + plugin config
├── assets/                                   ← shared assets (brand-tokens.css + SFX/music library)
│   ├── brand-tokens.css                      ← your brand colors / fonts — set during /setup
│   ├── sfx/                                   ← royalty-free sound-effects library (see MANIFEST.md)
│   └── music/                                 ← royalty-free music bed
├── video-projects/                           ← YOUR active projects, one folder each
└── _reference/
    └── creator-library/                      ← style fingerprints from creators you study (/study-creator)
```

Each project under `video-projects/<name>/` is a self-contained Hyperframes project:

- `index.html` — root composition entry point
- `compositions/` — sub-compositions loaded via `data-composition-src`
  - `compositions/components/` — shared snippets installed by `npx hyperframes add <component>`
- `assets/` — media files for this project (videos, audio, images, SVG, transcripts). Brand assets that multiple projects need (logo, brand-tokens.css) are duplicated per-project, not symlinked — keeps each project portable.
- `renders/` — render outputs for this project (gitignored)
- `hyperframes.json` — CLI config (registry URL, paths — all relative to the project folder)
- `meta.json` — project metadata (id, name, dimensions, fps)
- (optional) `STORYBOARD.md`, `scripts/`, etc. — anything project-specific

### Always run the CLI from inside the project folder

```bash
cd video-projects/<your-project>
npx hyperframes lint
npx hyperframes preview
npx hyperframes render --quality standard --output renders/final.mp4
```

The CLI reads `hyperframes.json`/`meta.json` from the current directory and resolves `assets/`, `compositions/`, `renders/` relative to it. Running it from the workspace root will fail or scan the wrong files.

### Adding a new video project

1. `mkdir video-projects/<new-project-slug>` (kebab-case, e.g. `ai-agents-intro`)
2. `cd video-projects/<new-project-slug>`
3. Run `npx hyperframes init` to scaffold, then edit `meta.json` for the new id/name/dimensions, and create `index.html`, `compositions/`, `assets/`, `renders/`
4. Pull in the shared brand tokens: `cp ../../assets/brand-tokens.css assets/`
5. Build the composition; lint + render from inside this folder

### What lives at the workspace root

- **Creator profile** (read first): `CREATOR.md`
- **User preferences** (read first): `PREFERENCES.md`
- **Motion-graphics philosophy** (read before brainstorming): `MOTION_PHILOSOPHY.md`
- **Brand-spec template**: `DESIGN.example.md` (a worked example; copy into a project as `DESIGN.md` and rewrite for your brand)
- **Shared assets**: `assets/brand-tokens.css` (CSS custom-prop scaffold — fill values per your brand), plus the `assets/sfx/` + `assets/music/` royalty-free libraries
- **Tooling**: `node_modules/`, `package.json`, `.claude/`, `.gitignore`, `skills-lock.json`

## Render Contract (the must-dos and must-not-dos)

1. Root `<div>` needs `id`, `data-composition-id`, `data-start="0"`, `data-width`, `data-height`.
2. Timed visible elements need `class="clip"` — **except** `<video>` and `<audio>` (adding `class="clip"` to `<video>` breaks it).
3. Every timed element needs `data-start`, `data-duration`, `data-track-index`.
4. `data-start` can reference another clip's id: `data-start="intro"`, `data-start="intro + 2"`, `data-start="intro - 0.5"`. Same-track clips cannot overlap — use different `data-track-index` values.
5. `<video>` must be `muted`; audio belongs in sibling `<audio>` elements for the mixer. `data-has-audio="true"` only when the video's own audio should feed the mix.
6. Every composition registers exactly one GSAP timeline, paused, on `window.__timelines["<data-composition-id>"]`. Key must match `data-composition-id` exactly.
7. Composition duration = `tl.duration()`. If the timeline is shorter than the video, the video truncates. Pad with `tl.set({}, {}, <seconds>)` to extend.
8. Never call `.play()`, `.pause()`, or set `.currentTime` on media. The framework owns playback.
9. Never animate `width`/`height`/`top`/`left` directly on a `<video>` — the browser freezes frames. Wrap in a `<div>` and animate the wrapper.
10. Sub-compositions use `<template>` + `data-composition-src`. Their timelines auto-link to the parent — never do `masterTL.add(child)`.
11. Determinism: no `Date.now()`, no unseeded `Math.random()`, no render-time network fetches. Use seeded PRNGs.

## Authoring Loop

1. **Read `CREATOR.md`** — identity, handles, niche, division of labor. If the user provides their own pre-edited speaking video, build the visual layer on top of it.
2. **Read `PREFERENCES.md`** — the user's accumulated taste. Apply as overrides.
3. **If the user named a creator reference for this build** ("build this like @handle" / "blend @h1 + @h2"): read `_reference/creator-library/<handle>/style-distilled.md` for each named handle (or the raw `videos/*/analysis.md` files if no distilled file yet). Apply their signature moves to the visual layer.
4. **Read `MOTION_PHILOSOPHY.md`** if you haven't this session — the aesthetic baseline.
5. Pick the skill → invoke `/hyperframes` (or sibling) before editing.
6. Edit HTML in `index.html` or `compositions/<name>.html`.
7. `npx hyperframes lint` — fix errors, triage warnings.
8. **Localhost Studio preview** — before **any** render (even a draft), start `npx hyperframes preview` in the background and hand the user the URL. They eyeball the edit live and iterate; no render cycle until they've seen it.
9. Only after explicit sign-off on the live preview: `render --quality draft` for a draft MP4.
10. **Every-frame self-review** (REQUIRED before showing any output to the user) — extract every frame, look at every frame, fix any issue you find, re-render and re-verify. Only THEN present to the user. See "Visual Verification — EVERY-FRAME REVIEW" below.
11. **Run the `MOTION_PHILOSOPHY.md` pre-flight checklist** (section 4) before claiming done.
12. Second localhost preview pass on the draft MP4 (via static server on port 8080 for scrubbable playback) — wait for explicit sign-off before the final render.
13. Final: `render --quality standard`. Re-run every-frame self-review on the final render before reporting the path.
14. **After delivery**: prompt the user with "Want to log feedback on this one? Just say `/feedback`." Don't auto-trigger — they invoke when ready.

**On every iteration cycle**: if the user asks for a change, treat the resulting render as "any output" — do the every-frame review again before showing them the new version. New changes can introduce new bugs.

## Visual Verification — EVERY-FRAME REVIEW (MANDATORY before any output)

**Lint passing ≠ design working.** The discipline this workspace enforces: **before showing the user ANY render, draft or final, first or revision — extract every frame, look at every frame, fix any issues you find, then re-render and re-verify. Only THEN show them the result.** This applies to:

- The first draft of a new video
- Every revision after the user asks for a change
- The final render
- Any "preview" or intermediate output

The cost of the user discovering a regression is higher than the cost of you self-reviewing first. If you find an issue mid-review, you fix it and re-verify before showing anything — never ship a broken frame and let them find it.

### Required steps before any output

1. **Render a draft**: `npx hyperframes render --quality draft --output renders/<name>-draft.mp4`
2. **Extract every frame** of the rendered video at the project's native fps (typically 30):
   ```bash
   mkdir -p renders/frames
   ffmpeg -y -i renders/<name>-draft.mp4 -vsync 0 -q:v 2 "renders/frames/frame-%05d.png"
   ```
   For a 20s short at 30fps that's 600 frames. For longer videos (>60s), sample at 5fps as a practical compromise (`-vf fps=5`) and explicitly note in your report that you sampled rather than reviewed every frame.
3. **Read every frame into context** with the `Read` tool — DO NOT just `ls` the directory. The image must load so you actually see it. Process in batches of 20–30 frames.
4. **Verify each frame** for:
   - Speaker's face not cropped in any face-cam scene
   - Correct face-mode (full-screen vs bottom-half) for the scene
   - On-screen text fully visible, not overflowing, not overlapping unintentionally
   - Captions sync to the right word (cross-check against `transcript.json` if available)
   - Transitions land cleanly (no half-rendered shaders, no black flashes mid-frame except intentional)
   - No blank/missing frames
   - On-brand colors (per `assets/brand-tokens.css` and `PREFERENCES.md`)
   - Handles, names, and on-screen identity text match `CREATOR.md` exactly
5. **If you find any issue**: fix the composition, re-render, re-extract frames, re-verify. Do NOT show the user the broken version — only present the fixed one.
6. **Report what you reviewed**: when you hand the user a draft, briefly say "I extracted N frames at Mfps and reviewed all of them; found and fixed X, Y, Z; here's the result." If you sampled instead of reviewed every frame (long video), say so.
7. **Only after self-review passes** → present the draft for the live preview / MP4 preview gates below.

### Why this matters

Without this gate, the user has to be your QA. With it, they only see iterations you've already vetted, and changes are real changes — not new bugs introduced while fixing old ones.

**Pre-render (live scrubbing):** Playwright 1.59.1 is installed. For quick contrast/layout checks on a single scene mid-authoring without paying a full render, run `npx hyperframes preview` (opens on localhost:3002) and drive Playwright to screenshot the live state at specific timestamps. This is a separate tool from the every-frame review — it's for iterating cheaply within a scene; the every-frame review still happens on the rendered MP4 before any output reaches the user.

## Localhost Preview Before Any Render (MANDATORY)

**Every edit pass gets two preview gates**: one on the live Studio **before** any render (so the user can iterate on cheap edits without waiting for a render), and one on the rendered MP4 **before** the final `--quality standard` bake. Do not run `render --quality draft` OR `render --quality standard` until the user has eyeballed the relevant state in their browser.

### Gate 1 — Live Studio preview (before any render)

After editing compositions and before any render command:

1. Start Studio in the background:
   ```bash
   cd video-projects/<project-slug>
   npx hyperframes preview    # run_in_background: true
   ```
2. Wait for "Studio running" on http://localhost:3002.
3. Hand the user the URL + tell them exactly which sub-compositions to scrub (individual comp URLs load fastest — the master composition can stall when it includes WebGL shader blocks under software WebGL fallback). Example: `http://localhost:3002/?comp=v01-kinetic-type`.
4. Wait for explicit sign-off on the live preview ("looks good, render a draft" / "ship it" / "go ahead"). Silence is not approval.
5. Hot reload means any further edit you make shows up live without a restart.

### Gate 2 — Rendered MP4 preview (before final)

After frame-verification passes on a draft render:

6. Serve `renders/` via `npx serve . -p 8080 -n` (NOT Python's `http.server` — it doesn't support HTTP Range requests, so scrubbing breaks). Hand the user `http://localhost:8080/<project>-draft.mp4`.
7. Wait for explicit sign-off on the full motion + audio playback.
8. Then run the final `--quality standard` render; report the output path.

Why two gates: the live Studio catches layout/timing/visual bugs on edits you just made — before spending ~2 minutes per render iteration. The rendered-MP4 gate catches pacing, audio sync, and beat-to-beat feel that only reads correctly in real-time playback. Skipping either one turns render cycles into expensive guesses.

**If the master composition stalls in Studio** (software WebGL + multiple shader blocks): route the user to individual sub-composition URLs instead. They load instantly and isolate the change you're previewing.

The render is the ground truth. "The code looks correct" doesn't clear the bar.

## Audio — SFX + music library

The `assets/sfx/` and `assets/music/` folders ship with a royalty-free sound library (free for commercial use, including monetized TikTok + Instagram). See `assets/sfx/MANIFEST.md` for a purpose-indexed list (whoosh, click, pop, notification, impact, ambient, cinematic, transitions). To use a sound in a project, copy it into the project's `assets/` and reference it from an `<audio>` element per the render contract. Keep SFX subtle — they punctuate beats, they don't carry the video.

## Asset Prep

Re-encode raw recordings to H.264 MP4 before referencing as `<video src>`:

```bash
ffmpeg -i raw.mov -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -movflags +faststart assets/clip.mp4
```

Keeps `assets/` light and avoids codec issues during capture. Use `npx hyperframes doctor` if a render fails partway.

## Prompting Shorthand (what the `/hyperframes` skill understands)

- **Motion easing:** smooth / snappy / bouncy / springy / dramatic / dreamy
- **Caption energy:** hype / corporate / tutorial / storytelling / social
- **Transition energy:** calm (blur) / medium (push) / high (zoom, glitch)
- **Audio reactivity:** bass→scale, treble→glow, amplitude→opacity, mids→shape. Keep text reactivity at 3–6%; backgrounds can go 10–30%.

Cold-start prompt shape: *"Using /hyperframes, create a 10-second product intro with a fade-in title over a dark background and subtle background music."* Warm-start: *"Summarize this PDF into a 45-second pitch video using /hyperframes."*

## Registry (available via `npx hyperframes add <name>`)

- **Blocks (38):** data viz (`data-chart`, `flowchart`), outros (`logo-outro`), social overlays (`instagram-follow`, `tiktok-follow`, `yt-lower-third`, `x-post`, `reddit-post`, `spotify-card`, `macos-notification`), app/UI (`app-showcase`, `ui-3d-reveal`), shader transitions (`glitch`, `whip-pan`, `cinematic-zoom`, `flash-through-white`, `light-leak`, `ripple-waves`, `chromatic-radial-split`, `cross-warp-morph`, `domain-warp-dissolve`, `gravitational-lens`, `ridged-burn`, `sdf-iris`, `swirl-vortex`, `thermal-distortion`), CSS transition packs (`transitions-3d|blur|cover|destruction|dissolve|distortion|grid|light|mechanical|other|push|radial|scale`)
- **Components (3):** `grain-overlay`, `shimmer-sweep`, `grid-pixelate-wipe`
- Browse: `npx hyperframes catalog --type block --json`

## Documentation — fetch when the skills don't cover enough

The `/hyperframes*` skills encode the common authoring patterns, but the hosted docs are the source of truth for **every block's props, every package's API, and deeper usage examples**. Reach for them when brainstorming scenes, picking a transition or component, or digging into a package you haven't used before. The catalog pages in particular hide a lot of gems — don't guess at a block's props, fetch the page.

**Entry points:**

- **Agent index (fetch first if unsure of a path):** https://hyperframes.heygen.com/llms.txt — the complete sitemap
- **Full site:** https://hyperframes.heygen.com/introduction
- **Inline terminal docs:** `npx hyperframes docs <topic>` — topics: `data-attributes`, `gsap`, `rendering`, `examples`, `troubleshooting`, `compositions`
- **Source repo:** https://github.com/heygen-com/hyperframes

**Known URL patterns (hit directly with WebFetch):**

- **Catalog — Blocks (38):** `https://hyperframes.heygen.com/catalog/blocks/<slug>`
- **Catalog — Components (3):** `https://hyperframes.heygen.com/catalog/components/<slug>` — `grain-overlay`, `grid-pixelate-wipe`, `shimmer-sweep`
- **Packages:** `https://hyperframes.heygen.com/packages/<name>` — `cli`, `core`, `engine`, `player`, `producer`, `studio`
- **Reference:** `https://hyperframes.heygen.com/reference/html-schema` — authoritative data-attribute + timeline-registration spec
- **Core concepts & guides:** listed in `llms.txt`

**When to reach for this:** brainstorming a new scene, looking up a block's exact props before wiring it into a composition, deep-diving into a package API, or debugging something the render contract doesn't explain.
