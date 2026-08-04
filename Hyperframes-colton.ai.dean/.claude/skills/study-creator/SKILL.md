---
name: study-creator
description: Study a reference creator's video (TikTok / Instagram Reel / YouTube Short / YouTube) by downloading it, transcribing it, extracting frames, reading every frame, and writing a structured analysis into the creator-library so future builds can copy their signature moves. Use when the user says "/study-creator <url>", "study this creator", "analyze this video", "save this to the creator library", or pastes a short-form video URL in a context that isn't his own speaking video. Writes a per-video analysis.md and, once a creator has ≥3 analyses, auto-rolls them up into a style-distilled.md.
---

# Study Creator — Reference-Library Capture

This skill turns a pasted creator video URL into a persistent, structured style reference. It mirrors the pattern of the `/feedback` skill (per-item artifact + rolled-up distilled file) but captures external creators instead of feedback on the user's own finished videos.

**Invoke BEFORE any other skill when the trigger fires.** Do not start brainstorming, picking palettes, or sketching scenes — the whole point is to ingest reference, not produce.

## When this skill fires

- `/study-creator <url>` or `/study-creator <url1> <url2> ...`
- `/study-creator` followed by a newline-separated list of URLs in the same message
- "study this creator", "analyze this video", "save this to the creator library", "add this to my references"
- "study every link in `<path/to/links.txt>`" — reads URLs one per line from the file
- Any TikTok / Instagram Reel / YouTube Short / YouTube URL pasted in a context that clearly isn't the user's own speaking recording (e.g. another creator's handle in the URL, or a comment like "I like this one")

### Batch mode (multiple URLs)

If 2+ URLs are provided (bulleted list, newline-separated, or a file reference), run the 13-step pipeline **sequentially** per URL. Don't parallelize — each video burns ~40 frame reads plus a transcription pass, so running them serially gives the user a chance to interrupt mid-batch if something's off, and keeps error handling simple (one failed URL doesn't poison the rest).

After each video finishes, print a one-line progress update: `[N/M] Saved @handle/videos/<slug>/analysis.md — <signature move>`.

At the end of the batch, print a summary:
- Total videos saved
- Per-creator counts (and which creators just crossed the 3-video threshold → distilled file was refreshed)
- Any URLs that failed, with the reason (region lock, 404, login wall, etc.) so the user can decide whether to retry

If any single URL fails, continue with the rest of the batch — don't abort the whole run for one bad link.

**Do NOT fire this skill on:**
- the user's own videos (those get `/feedback`, not `/study-creator`)
- Generic AI news articles or non-video links
- Links where the target is already in `_reference/creator-library/<handle>/videos/<slug>/` (check first; if `analysis.md` exists, tell the user and ask whether to re-analyze or skip)

## Tooling prerequisites

These must be on your `PATH`:

- `yt-dlp` — download from TikTok / IG / YouTube (`brew install yt-dlp`, `pipx install yt-dlp`, or your package manager)
- `ffmpeg` + `ffprobe` — probe duration + extract frames (`brew install ffmpeg` / `choco install ffmpeg` / distro package)
- `npx hyperframes transcribe` — word-level Whisper transcription (baked into the Hyperframes CLI)

If any of these are missing, stop and tell the user what to install before proceeding — do NOT silently skip a step.

## The pipeline (12 steps)

### Step 1 — Parse the URL

From the pasted URL, derive:

- `<handle>` — creator's username as kebab-case, no `@` prefix. Examples:
  - `https://www.tiktok.com/@jason.ai/video/123` → `jason-ai`
  - `https://www.instagram.com/reel/ABC_xyz/` → use creator handle from the page (yt-dlp info JSON has `uploader`)
  - `https://youtube.com/shorts/XYZ123` → uploader handle from info JSON
- `<video-slug>` — kebab-case slug. Preferred: first 4–6 words of the title; fallback: the last path segment (video id).

If the handle isn't obvious from the URL, run a preflight `yt-dlp --skip-download --print '%(uploader)s|||%(title)s|||%(id)s' <url>` and use the result.

### Step 2 — Ensure folders

```bash
# Run from the workspace root. VIDEO_DIR is relative to it.
VIDEO_DIR="_reference/creator-library/<handle>/videos/<video-slug>"
mkdir -p "$VIDEO_DIR/frames"
```

If `$VIDEO_DIR/analysis.md` already exists, ask the user whether to re-analyze (overwrite) or skip. Default: skip.

### Step 3 — Download

```bash
cd "$VIDEO_DIR"
yt-dlp \
  -f 'bv*+ba/b' \
  --no-playlist \
  --write-info-json \
  -o 'source.%(ext)s' \
  '<url>'
echo '<url>' > source.url
```

The `--write-info-json` flag saves `source.info.json` with metadata (view count, like count, upload date, description, tags) — useful for the engagement-context line of the analysis.

If yt-dlp extracts a `.webm` instead of `.mp4`, that's fine — downstream tools accept both. Update the filename in subsequent commands accordingly.

### Step 4 — Probe

```bash
ffprobe -v error \
  -select_streams v:0 \
  -show_entries stream=width,height,duration,r_frame_rate \
  -show_entries format=duration \
  -of json \
  source.mp4
```

Record: duration (seconds, to 2 decimals), width x height, aspect ratio (9:16 / 16:9 / 1:1), source fps. If aspect isn't 9:16, note it in the analysis — scene archetypes may not transfer directly to vertical builds.

### Step 5 — Transcribe

```bash
npx hyperframes transcribe source.mp4 --model small.en --json 2>/dev/null >/dev/null
```

**IMPORTANT — do NOT redirect stdout to transcript.json.** The CLI auto-writes `transcript.json` to the current directory (the video folder) on its own. The `--json` flag causes the CLI to emit a STATUS SUMMARY on stdout (not the transcript content), so `> transcript.json` would OVERWRITE the auto-written file with the status summary and corrupt it. Just let the CLI write its own file and discard the stdout status message. Verify with:

```bash
python3 -c "import json; d=json.load(open('transcript.json')); print(f'OK: {len(d)} words')"
```

If the video has no spoken audio (music-only, asmr, b-roll montage), transcript.json will be mostly empty — that's fine, note it in the analysis and skip the "What they say" parts.

**Common Whisper mistranscription patterns to note in analysis.md:**
- "Cloud" / "Enidn" / "Come" for "Claude" / "n8n" / "Comment" — note these inline so future readers aren't confused
- Creator handles and brand names get mangled; word-level timestamps stay accurate, only the tokens are wrong

### Step 6 — Extract frames

```bash
ffmpeg -y -i source.mp4 -vf fps=2 -q:v 2 frames/frame-%05d.png
```

2fps = one frame per 500ms. Sweet spot for shorts: a 20s video yields 40 frames, scannable in one `Read` pass. For videos >60s, bump to `fps=1` (one frame/second) to keep the batch tractable and note that sampling rate in the analysis.

### Step 7 — Read every frame

Call `Read` on every PNG in `frames/`. Do NOT just list filenames. Batch in groups of 20–30 parallel reads. This follows the every-frame-review discipline already enshrined in the workspace `CLAUDE.md`.

**Batch-mode compromise for long videos or multi-video batches:** at 2fps, a 35s video = 70 frames. In a batch of 8 videos that's ~550 frames — a lot of context. Practical sampling rates:

- **Video ≤25s:** read every frame (2fps effective)
- **Video 25–45s:** read every 2nd frame (1fps effective)
- **Video 45–90s:** read every 3rd–4th frame (0.5–0.7fps effective)
- **Video >90s:** re-extract at `-vf fps=1` and read every frame

ALWAYS note your sampling rate in the analysis's header (e.g., "Sample rate: every 2nd frame (effective 1fps) across 72 extracted frames"). Don't pretend you reviewed every frame when you sampled.

As you read, keep running notes on:

- Scene boundaries (where the visual changes enough that it's a "new scene")
- Caption style + timing
- Transition flavors
- Face treatment / camera mode
- Palette
- Any standout signature moves (slams, stamps, glitches, whip-pans, kinetic typography moments)

### Step 8 — Write `analysis.md`

Path: `$VIDEO_DIR/analysis.md`. Use this template, filling every section — no TBDs.

```markdown
# <video-slug> — @<handle>

**Source:** <url>
**Duration:** X.XXs
**Aspect:** 9:16 / 16:9 / 1:1
**Resolution:** WxH
**Studied:** YYYY-MM-DD
**Engagement (at time of study):** <views / likes / comments from source.info.json, if available>

## Hook (0–2s)
Frame-by-frame account of seconds 0.0–2.0. What visually lands first. Who's on screen. What text/graphic. What the speaker's first words are. This is the most load-bearing section — copy it carefully.

## Pacing
- Total scenes: N
- Average scene length: X.Xs
- Shortest / longest scene: X.X / X.X
- Distribution feel: short-chopped / medium / long / sustained
- Where the pace shifts (accelerates before a payoff, slows on a reveal)

## Captions
- Style: karaoke word-by-word / phrase chunks / burned-in subs / none
- Font feel: <bold sans, stroke treatment, pill bg, etc.>
- Active-word treatment: <scale pop, color swap, underline, etc.>
- Position: center / lower / top
- Size relative to frame: small / medium / large / huge

## Scene types
Numbered list, one bullet per scene: what was visually on screen, what text, what motion. Tag with an archetype from Hyperframes vocabulary where possible:
- talking-head face-cam (fullscreen / bottom-half)
- data-feel grid (stats, bar race, heatmap)
- stamp overlay (KILLED, DEAD, stamp-pound on word)
- split-screen / side-by-side comparison
- kinetic typography slam
- product/UI showcase (app demo, UI zoom)
- b-roll cutaway
- outro / CTA

## Transitions
- Flavors observed: <list, e.g. hard cut, push, flash, shader iris, whip-pan>
- Rotation cadence: <rotate vs repeat>
- Any signature transition this creator always uses

## Face treatment
- Mode mix: fullscreen / bottom-half / picture-in-picture / none
- Grading feel: <warm/cool/contrast/crushed blacks>
- Ken Burns or any camera motion
- Framing consistency (tight/wide, always centered, always offset)

## Audio reactivity
- Text pulses on beat: yes/no
- Background reactivity: yes/no
- Any scene synced to a specific stress syllable or music hit

## Palette
3–5 observed hex values (best-guess by eye from frames). Note which color is dominant vs accent.

## Signature move
The ONE thing that makes this video feel distinctly like this creator. One sentence.

## What to steal (actionable for Hyperframes builds)
Concrete techniques, mapped to Hyperframes patterns or registry blocks where possible:
- <technique 1> — e.g. "Always opens on a full-screen stamp overlay at ~0.5s; map to `short-form-video` stamp archetype with reveal-logic timing"
- <technique 2>
- <technique 3>

## What's creator-specific (don't copy literally)
- Their brand colors, handles, catchphrases, on-screen in-jokes
- Anything that would feel like impersonation

## Transcript
See `transcript.json` in this folder.
```

### Step 9 — Update `INDEX.md`

Path: `_reference/creator-library/INDEX.md`.

If `@<handle>` doesn't have a row yet, add one under "## Creators studied":

```markdown
- **[@<handle>](<handle>/)** — <one-sentence vibe> — 1 video studied
```

If the row exists, increment the video count and refine the vibe if needed.

Sort the list alphabetically by handle. Remove the "_no creators yet_" placeholder line if it's still there.

### Step 10 — Update or create `<handle>/profile.md`

If `<handle>/profile.md` doesn't exist, create it:

```markdown
# @<handle>

**Platforms:** <where they post — TikTok / Instagram / YouTube, plus handle on each if different>
**Niche:** <1-sentence niche>
**Why the user saves them:** <1–2 sentences, infer from the video if no direct statement>

## Signature vibe
<2–3 sentences describing the overall feel across studied videos — updated as more videos are added>
```

### Step 11 — If creator has ≥3 analyses, re-roll `style-distilled.md`

Count `<handle>/videos/*/analysis.md` files. If N ≥ 3:

1. Read every `analysis.md` for this creator.
2. Aggregate patterns — what's consistent across all of them vs. what varies per video.
3. Write (or overwrite) `<handle>/style-distilled.md` with this template:

```markdown
# @<handle> — Style Fingerprint

Rolled up across N videos. See `videos/*/analysis.md` for per-video detail. Last distilled: YYYY-MM-DD.

## Signature moves (consistent across videos)
- Hook pattern: <the 0–2s formula that repeats>
- Caption treatment: <bold sans / karaoke / stroke / etc. — only list things that show up in all N>
- Transition rotation: <A/B/C cycle or the flavors they return to>
- Face treatment: <consistent framing / mode mix>
- Palette: <3–5 hexes observed across most videos>
- Energy profile: sustained high / breathing / escalating / front-loaded

## What to steal (ranked by Hyperframes copy-ability)
1. <Most portable technique — maps directly to a Hyperframes pattern or registry block>
2. <Next most portable>
3. ...

## Don't copy
- <Anything platform- or creator-specific>

## Videos studied
- [<video-slug-1>](videos/<slug-1>/analysis.md) — <1-line summary>
- [<video-slug-2>](videos/<slug-2>/analysis.md) — <1-line summary>
- ...
```

Also update `INDEX.md` to link the handle's entry to `<handle>/style-distilled.md` instead of the bare folder:

```markdown
- **[@<handle>](<handle>/style-distilled.md)** — <vibe> — N videos studied
```

### Step 12 — Update `CREATOR.md` "Inspiration creators"

Open `CREATOR.md` (at the workspace root). If the `## Inspiration creators` section still has its placeholder text, replace it with a pointer to the library:

```markdown
## Inspiration creators

See [`_reference/creator-library/INDEX.md`](_reference/creator-library/INDEX.md) for the full list. Add new creators via `/study-creator <url>`.
```

(Do this once, on the first-ever run. Subsequent runs don't need to touch CREATOR.md.)

### Step 13 — Confirm

Tell the user in 2–3 sentences:

- What was saved (path to `analysis.md`)
- The signature move you extracted
- Whether the distilled file was refreshed or how many more videos are needed to trigger it
- Brief invitation: "Paste another link to grow this creator's fingerprint, or just say 'build this like @<handle>' when you're ready for a new video build."

## Invocation examples

**First video from a new creator:**
> the user: `/study-creator https://www.tiktok.com/@alexhormozi/video/7394827382`
>
> Assistant: <runs all 13 steps>. "Saved `alexhormozi/videos/the-ai-mindset-shift/analysis.md`. Signature move: cuts between fullscreen face-cam and whiteboard freeze-frames with a one-word caption beat on the punchline. 1 video in the library for @alexhormozi — 2 more to trigger a distilled profile."

**Third video from an existing creator:**
> the user: `/study-creator https://www.tiktok.com/@alexhormozi/video/7399888111`
>
> Assistant: <runs all 13 steps, triggers distillation>. "Saved the 3rd @alexhormozi video and rolled up `style-distilled.md`. Across all three, the hook formula is: 0–0.5s fullscreen face + bold 3-word caption, then snap to whiteboard at 0.5s. You can now say 'build this like @alexhormozi'."

## Safety rules

- **Never download videos that require login** (private accounts, age-gated). yt-dlp will fail cleanly; don't try to bypass.
- **Don't commit MP4s or frame PNGs** — `.gitignore` excludes them. Everything else (analysis, transcript, profile, distilled) is committed.
- **If transcription returns empty** (music-only video), note it and proceed with visual-only analysis. Don't skip the analysis.
- **If yt-dlp fails** (404, region lock, login wall), tell the user what failed and ask whether to retry with a different format flag or skip. Don't fabricate analysis from URL metadata alone.

## Related skills

- `/feedback` — captures taste on the user's own finished videos (sister pattern to this one)
- `/short-form-video` — the authoring skill that reads this library when the user names a creator during a build
- `/hyperframes` — the underlying framework
