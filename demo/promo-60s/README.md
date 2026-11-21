# Vector — 60-second run-through

A continuous one-minute product run-through. One cursor, one project: start on
Home, create a project, choose a template, review a prompt, clarify the brief,
build the screen on the canvas, share it, ship it, and land on pricing.

## Files

| File | Use |
| --- | --- |
| `vector-promo-60s.mp4` | 1080p master, 1920×1080, 30 fps, H.264 + AAC stereo, 60.0 s |
| `poster.jpg` | Cover frame / thumbnail |
| `captions.srt` | English captions timed to the narration |
| `source/promo.html` | The full animation: timeline, copy and motion |

## Beats

| Time | Beat | On screen |
| --- | --- | --- |
| 0:00 | Start a project | Home dashboard, New project clicked, template picker opens, Booking Flow selected, project created; the Learn card sits alongside |
| 0:07 | Live review | A prompt is typed word by word; red button / Pay now / Continue are underlined and four findings cascade into the review panel; risk 72 |
| 0:13 | Clarify | The cursor answers “Go to confirmation”; the reviewed brief checks itself off and risk drops to 5 |
| 0:19 | Canvas | A blank page; Navigation, Hero, Feature cards and Pricing are dragged in and snap into place while the prompt types itself on the right; Midnight tokens apply |
| 0:31 | Pro sharing | Two live cursors, edit / view link, cursor copies the link |
| 0:37 | Build | The brief flies into Base44, Generate is clicked, the app assembles, Vector AI reviews it, Windows download |
| 0:43 | Pricing + CTA | Free vs Pro, ₹199/mo · ₹1,990/yr, PRO stamp, dot-V end card, QR, Start free click |

## Audio

- Voice: `en-US-AndrewNeural` via Edge TTS, one punchy segment per beat.
- Score: original 120 BPM synth bed with risers, impacts and UI pops, snaps and
  whooshes; mastered to −14 LUFS / −1 dBTP.

## Rebuilding

`source/promo.html` is a single self-contained page. Load it as
`promo.html?render=1`, then call `window.seekPromo(t)` for each frame and take a
30 fps screenshot at 1920×1080. The page pauses and seeks every CSS animation,
so the render is deterministic and the audio lines up exactly. Encode the frames
with the included audio, then mux H.264/AAC. Scene times live in the `T` array at
the bottom of the page; all copy is plain HTML.
