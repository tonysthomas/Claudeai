# SFX + Music Library — Asset Index

Source: Pixabay (CC0-equivalent — free commercial use, no attribution) for the original kit, and Mixkit (Mixkit Sound Effects Free License — free commercial use, no attribution) for the expansion pack. Both are safe for monetized TikTok + Instagram.

All paths below are **relative to `assets/`** so they match `<audio src="...">` values when a Hyperframes project symlinks or copies this folder.

## Quick pick — by purpose

| Moment in video | Best SFX | Path | Duration |
|-----------------|----------|------|----------|
| Scene cut / whip transition | whoosh | `sfx/transitions/whoosh.mp3` | 0.57s |
| Side-to-side swipe transition | swipe | `sfx/transitions/swipe.mp3` | 1.06s |
| Digital/tech transition, data reveal | glitch | `sfx/transitions/glitch.mp3` | 2.64s |
| Hard snap on a beat drop | hard-cut | `sfx/transitions/hard-cut.mp3` | 0.20s |
| Button press, caption reveal, UI action | click | `sfx/ui/click.wav` | 0.46s |
| Emoji / sticker / bubble pop-in | pop | `sfx/ui/pop.mp3` | 0.72s |
| iMessage/Slack-style ping | notification | `sfx/ui/notification.mp3` | 0.50s |
| Text typing on screen | keyboard-typing *(loop — see note)* | `sfx/ui/keyboard-typing.mp3` | 19.59s |
| Hit-enter / send-prompt beat | send-message | `sfx/ui/send-message.mp3` | 1.06s |
| Quick electric punctuation / chip pop-in | zap | `sfx/ui/zap.mp3` | 0.92s |
| "Wrong way" / pre-AI / fail beat | error | `sfx/ui/error.mp3` | 2.55s |
| Logo slam, title stamp, emphatic hit | slam | `sfx/impact/slam.mp3` | 1.22s |
| Cinematic intro punch | boom | `sfx/impact/boom.mp3` | 2.78s |
| Musical emphasis stab on a key word | stinger | `sfx/impact/stinger.mp3` | 5.63s |
| Sub-bass drop after a reveal lands | bass-drop | `sfx/impact/bass-drop.mp3` | 1.10s |
| Building tension into reveal | riser | `sfx/cinematic/riser.mp3` | 4.03s |
| "AI activates" / energizing build | power-up | `sfx/cinematic/power-up.mp3` | 2.00s |
| Text glint / "wow" / magic moment | sparkle | `sfx/cinematic/sparkle.mp3` | 2.04s |
| List item / page turn / reveal | paper-flip | `sfx/cinematic/paper-flip.mp3` | 2.61s |
| Room tone under tech/server visuals | ambient-hum *(loopable)* | `sfx/ambient/ambient-hum.mp3` | 62.85s |
| Darker tech drone bed | tech-drone *(short — repeat or crossfade)* | `sfx/ambient/tech-drone.mp3` | 10.03s |
| Music bed under a full video | cinematic-tech | `music/music-bed-cinematic-tech.mp3` | 122.91s |

## Usage notes + gotchas

- **`hard-cut.mp3` was trimmed** from the original 8s (which had 7.8s of dead air tail) down to 0.2s with the snap hitting at ~23ms. Drop it in with `data-duration="0.2"` and it'll fire cleanly on the beat. The untrimmed source is kept alongside as `hard-cut.original.mp3` in case you ever want to re-trim differently.
- **`keyboard-typing.mp3` is a ~20s continuous loop** of fast laptop keys. For typing that lasts N seconds, set `data-start` where the typing begins and `data-duration` to match the typing length — the mixer will truncate naturally. Pair with `<audio>` not `<video>`.
- **`click.wav` is WAV** (uncompressed, ~80KB). All other SFX are MP3. Hyperframes' mixer handles both — no conversion needed.
- **Loopable beds**: `ambient-hum.mp3` (62.85s) and `music-bed-cinematic-tech.mp3` (122.91s) are long enough to cover most shorts without a loop seam being audible. For videos longer than the bed's duration, crossfade a second copy at `(duration - 1s)` with a 1s overlap.
- **Level discipline**: SFX should sit **-12 to -18 dB under the speaking voice**, music bed **-18 to -24 dB under**. Mix the voice as loudest element — never let SFX or music fight the user's speech.
- **No double-hits**: on a single beat, pick ONE SFX (e.g. whoosh OR slam, not both). Layering is for specific craft moments, not every cut.

## Folder structure (actual)

```
assets/
├── sfx/
│   ├── transitions/    whoosh.mp3  swipe.mp3  glitch.mp3  hard-cut.mp3
│   ├── ui/             click.wav   pop.mp3    notification.mp3  keyboard-typing.mp3
│   │                   send-message.mp3  zap.mp3  error.mp3
│   ├── impact/         slam.mp3    boom.mp3   stinger.mp3   bass-drop.mp3
│   ├── cinematic/      riser.mp3   sparkle.mp3  paper-flip.mp3  power-up.mp3
│   ├── ambient/        ambient-hum.mp3  tech-drone.mp3
│   └── MANIFEST.md     (this file)
├── music/              music-bed-cinematic-tech.mp3
└── _inbox/             (staging — empty after sort)
```

## Expanding the library

To add more SFX later:
1. Search Pixabay at `https://pixabay.com/sound-effects/search/<term>/`
2. Download to `~/Downloads/` with a descriptive filename
3. Drop it in `assets/_inbox/` (or leave in Downloads — the assistant can find it)
4. Tell the assistant what it is ("add a glass-shatter SFX I just downloaded") and it'll sort + index + update this manifest.

License:
- Pixabay assets — Pixabay Content License (free commercial use, no attribution required).
- Mixkit assets (`keyboard-typing`, `send-message`, `zap`, `error`, `stinger`, `bass-drop`, `power-up`) — Mixkit Sound Effects Free License (free commercial use, no attribution required, cannot be redistributed as a standalone sound pack).
