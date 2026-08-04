---
name: feedback
description: Capture what worked and what didn't on a finished video, then update PREFERENCES.md so future videos respect the user's accumulated taste. Use when the user says "/feedback", "log feedback", "save feedback", "feedback on this video", "I want to capture what I liked", "remember this for next time", or any request to record lessons from a finished or in-progress video edit. Writes a per-video log to _reference/feedback-logs/ and merges distilled rules into PREFERENCES.md.
---

# Feedback — Capture What Worked & Didn't

This skill is the workspace's memory loop. After (or during) a video edit, the user invokes it to record reactions. The skill writes two artifacts:

1. **A per-session log** with the full feedback verbatim — `_reference/feedback-logs/<YYYY-MM-DD>-<project-slug>.md`
2. **Distilled rules merged into `PREFERENCES.md`** — the rolling preferences file every video task reads first

Future video tasks read `PREFERENCES.md` *before* picking colors, fonts, transitions, pacing, etc. That's how the workspace learns your taste without you having to repeat yourself.

## When this skill fires

- User says `/feedback`, "log feedback", "save feedback", "feedback on this video", "remember this for next time"
- User shares a reaction to a draft or final render and wants it captured ("I liked this but…")
- After delivery, the workspace prompts: *"Want to log feedback? Just say `/feedback`."* — when they say yes, fire this skill.

**Do NOT auto-fire this skill.** It's user-invoked only. The post-delivery prompt is a reminder, not an automatic trigger.

## The flow

### Step 1 — Read PREFERENCES.md first

Always read `PREFERENCES.md` (at the workspace root) first. This lets you (a) avoid duplicating existing rules, (b) refine wording when the user gives an updated take, and (c) detect contradictions to flag back.

### Step 2 — Identify the project

Determine which project the feedback is about. In order of preference:
1. The user names it explicitly ("feedback on `ai-agents-intro`")
2. The most recently edited project under `video-projects/` (check mtime via Glob)
3. Ask the user via `AskUserQuestion` with a list of `video-projects/*` slugs

### Step 3 — Gather the feedback

Use **a single `AskUserQuestion` call** with **four questions** (all open-text since this is qualitative):

1. **What worked well?** — colors, pacing, transitions, captions, audio, hooks, anything they liked
2. **What didn't work / needs to change?** — specific complaints, things to fix on this video
3. **Rules for ALL future videos** — distilled preferences to apply going forward (e.g. "always use snappier scene cuts", "never use the glitch transition", "captions should be 1 word at a time, not phrase chunks")
4. **Anything else worth remembering?** — open catch-all for context that doesn't fit above

For #3, push for *generalizable* rules — the user is teaching you their taste, not just patching this one video. If they give a one-off tactical note, ask "should this apply to all future videos, or just this one?"

### Step 4 — Write the per-session log

Path: `_reference/feedback-logs/<YYYY-MM-DD>-<project-slug>.md`

Use today's date (look at environment context) and the project slug. If a log already exists for today + project, append a `## Round N` section instead of overwriting.

Template:

```markdown
# Feedback — <project-slug> (<YYYY-MM-DD>)

**Render reviewed:** <path to renders/*.mp4 if known, else "draft" or "final">

## What worked
<verbatim from question 1>

## What didn't
<verbatim from question 2>

## Rules for future videos
<verbatim from question 3>

## Other notes
<verbatim from question 4>
```

### Step 5 — Merge into PREFERENCES.md

Take the answers from question 3 (and any generalizable insights from questions 1–2) and **integrate them into the relevant section of `PREFERENCES.md`**. The sections are:

- Visual style (colors, typography, density)
- Pacing (scene length, cuts vs. transitions)
- Captions (style, color, sync tightness)
- Transitions (preferred / avoid)
- Audio (music vibe, voiceover style, mix)
- Brand (logo treatment, hashtags, handles)
- Avoid (anti-patterns to never repeat)

**Merge rules:**
- **Read first**, then `Edit` to add — never `Write` over the file (would clobber existing rules).
- **No duplicates** — if a similar rule already exists, refine the wording or skip. When in doubt, ask the user.
- **Resolve contradictions** — if a new rule contradicts an existing one, flag it and ask the user which wins. Update or remove the old rule per their answer.
- **One rule per bullet line** — keep `PREFERENCES.md` scannable. Long explanations go in the per-session log, not here.
- **Cite the source date** — append ` (<YYYY-MM-DD>)` to each new bullet so the user can trace it back to the per-session log.

### Step 6 — Confirm and exit

Tell the user what was captured: which sections of `PREFERENCES.md` you updated, the per-session log path, and any contradictions you resolved. Keep it under 4 sentences.

## Example interaction

> User: /feedback on the ai-agents-intro short
>
> Assistant: <reads PREFERENCES.md, identifies project, asks 4 questions in one batch>
>
> User: <answers> What worked: the chrome text and tight 1-word captions felt punchy. What didn't: the whip-pan transition between scene 3 and 4 was too aggressive. Rules: always 1-word captions, never use whip-pan with anything faster than 0.4s, prefer crossfade for scene-to-scene under 1s. Other: I want a vertical 9:16 by default unless I say otherwise.
>
> Assistant: <writes _reference/feedback-logs/2026-04-20-ai-agents-intro.md, edits PREFERENCES.md adding 4 new bullets across Captions / Transitions / Avoid / Visual style sections, confirms in 2 sentences>

## Safety rules

- **Logs go under `_reference/feedback-logs/`** — create the folder if it doesn't exist yet.
- **Never delete from PREFERENCES.md without asking** — only the user can retire a preference.
- **If `PREFERENCES.md` doesn't exist**, create it from the skeleton in `CLAUDE.md` step 8 (sections listed above) before merging.
- **Don't ask if the feedback "is ready"** — when the user invokes this skill, capture what they have and write it. Quality is their concern, not yours.
