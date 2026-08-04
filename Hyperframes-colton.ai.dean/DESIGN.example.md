# Brand Visual Identity — TEMPLATE

> **This is a worked example / template.** Copy it into a project as `DESIGN.md` and rewrite every section for your own brand. Replace the placeholder values below with yours. Once set, every composition in that project should trace its palette, typography, and motion back to this file. Your `/setup` answers and `assets/brand-tokens.css` are the source for the colors and fonts here.

## Style Prompt

_(One paragraph describing the mood. Example: "Clean, confident, and modern — deep canvases, one sharp accent color, generous spacing, restrained motion. Not playful, not gradient-heavy, not neon.") Rewrite for your brand's personality._

## Colors

Mirror these to your `assets/brand-tokens.css` `:root` variables.

| Token | Hex | Role |
|---|---|---|
| `--brand-bg` | `#0a0a0f` | Primary background |
| `--brand-surface` | `#1a1a23` | Cards, panels, surfaces |
| `--brand-border` | `#2a2a36` | Borders, dividers, hairlines |
| `--brand-accent` | `#3b82f6` | Primary accent — highlights, numbers, CTAs |
| `--brand-warn` | `#f59e0b` | Secondary accent — use sparingly for contrast |
| `--brand-text` | `#ffffff` | Primary text on dark |
| `--brand-text-dim` | `#96a2b6` | Secondary / meta text |

Keep the palette tight — a background, one or two accents, text, and a dim text. ≤5 symbolic colors total.

## Typography

- **Display font** — _(your headline font)_. Use for: headlines, body copy, taglines.
- **Mono / label font** — _(optional second font)_. Use for: UI labels, stats, numbers, terminal lines, pill text, CTAs.

Pairing a mono label above a display headline is a strong, reliable pattern. Avoid relying on a single weight — vary light vs. bold for hierarchy.

## Logo

- _(Path to your logo asset, e.g. `assets/logo.png` — drop it into the project's `assets/` folder.)_
- CSS glow on dark: `filter: drop-shadow(0 0 50px rgba(<accent-rgb>, 0.6));`
- Clearspace: at least half a logo-height of margin on all sides.
- Never recolor, stretch, or add effects beyond the spec.

## Motion Rules

- **Entrance only** (per the Hyperframes skill rule): elements animate in via `gsap.from()`. Scene transitions handle exits.
- **Easing palette:** `power3.out`, `expo.out`, `back.out(1.4)`, `power4.out` for entrances; `power2.in` for hand-offs into transitions; `sine.inOut` for ambient loops.
- **Use at least 3 different eases per scene.** Vary the feel.
- **Duration bands:** snap entrances 0.3–0.5s, headline entrances 0.5–0.8s, ambient drifts 2–4s.
- **Offset the first animation** 0.1–0.3s from scene start.
- **Text stagger:** 0.04–0.08s per character for display type, 0.12–0.18s per word for headlines.
- **Numbers:** use GSAP `{innerText: N, snap: {innerText: 1}}` for count-up, add `font-variant-numeric: tabular-nums`.

## Transitions

Prefer CSS transitions (not shaders) for simple scenes. Pick a primary transition for ~60% of scene changes and reserve one or two accents for the opener and outro.

| Scene change | Transition | Duration | Ease |
|---|---|---|---|
| 1 → 2 | Zoom through | 0.35s | `power4.inOut` (opener) |
| 2 → 3 | Push slide left | 0.35s | `power2.inOut` |
| 3 → 4 | Push slide left | 0.35s | `power2.inOut` |
| 4 → 5 | Blur crossfade | 0.5s | `sine.inOut` (wind-down into CTA) |

## Buttons / Pills

Rounded pill, transparent fill, 1.5px `--brand-accent` border, uppercase label, 16–18px, 14–18px vertical + 28–36px horizontal padding. Example: `[ FOLLOW → ]`

## What NOT to Do

1. **No full-screen linear gradients** on dark backgrounds — H.264 banding. Use a solid `--brand-bg` + localized radial glow behind focal elements.
2. **Stay inside your palette.** Define the colors above and don't introduce off-brand ones.
3. **No system fonts** unless that's intentionally your brand — pick your fonts and stick to them.
4. **No `transparent` keyword in gradients** — shader-compatible CSS rule. Use `rgba(r,g,b,0)`.
5. **No `Math.random()` or `Date.now()`** — render determinism. Use a seeded PRNG if needed.
6. **No exit animations** on any scene except the final one — transitions handle exits.
7. **No stretching the logo.** Keep aspect ratio. Respect clearspace.

## File References

- _(your logo asset path)_
- `assets/brand-tokens.css` — the CSS `:root` vars imported by every composition
