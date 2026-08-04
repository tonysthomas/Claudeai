# DESIGN — Talking Head Landscape (It's AI Education · Lesson 3)

A clean, corporate-professional educational look layered over a real talking-head take.
The subject sits right-of-center against a warm off-white wall, so **all motion graphics
live in the left negative space** and the **captions sit in a bottom-center pill** — nothing
ever covers his face or hands.

## Style Prompt

Modern, credible, "explainer channel" polish. Restrained motion (fade + short slide,
no bounce), one idea per beat, generous breathing room. High-legibility captions with a
warm-gold karaoke word highlight. Dark navy plates (pulled from the subject's blazer)
carry white text so overlays read cleanly over the bright wall.

## Colors

| Role | Hex | Use |
|---|---|---|
| Ink / plate | `#0E1626` | overlay + caption backgrounds (from blazer navy) |
| Plate translucent | `rgba(12,20,34,0.82)` | caption pill, card fills |
| Text | `#FFFFFF` | primary text |
| Text dim | `#AEB9CC` | secondary/label text, un-spoken caption words |
| Accent (gold) | `#FFC24B` | karaoke highlight, key emphasis, brand dot |
| Accent 2 (sky) | `#5AA9FF` | numerals, agenda index (from shirt blue) |
| Hairline | `rgba(255,255,255,0.14)` | dividers, card borders |

## Typography

- **Inter** everywhere (compiler-embedded, guaranteed).
  - Display / headings: Inter 800, tight tracking.
  - Kickers / labels: Inter 700, letter-spaced uppercase.
  - Captions: Inter 800, 56px.

## Motion

- Entrances: `opacity` + 20–40px slide, `power3.out`, 0.22–0.35s.
- Exits: quick `opacity`→0 + small counter-slide, `power2.in`, 0.14s.
- Karaoke: current word → gold + `scale 1.08`, previous word reverts to white.
- No bounce, no spin, no continuous ambient loops.

## Layout zones

- **Left graphics:** x 90–470, y 230–620 (above the hand zone). Never wider than x 470.
- **Captions:** bottom-center pill, ~70px from bottom, max-width 1500px, one group at a time.
- **Brand bug:** top-left, persistent, small.
- **Outro card:** bottom-center, fades in after speech ends (~49s).

## What NOT to Do

- Don't place any graphic over x 470 while the subject is on screen (covers his hands/body).
- Don't use bright saturated fills or gradients that band on the bright wall — solid plates only.
- Don't bounce, spin, or use elastic eases — this is a credibility-first educational look.
- Don't stack two caption groups; exactly one visible at a time, hard-killed at its end.
- Don't cover the face — ever.
