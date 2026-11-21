# Vector — 60-second promo

A one-minute product film for Vector, built as a custom 1920×1080 animation in
the app's own dark / violet visual language, then recorded and scored.

## Files

| File | Use |
| --- | --- |
| `vector-promo-60s.mp4` | Master, 1920×1080, 25 fps, H.264 + AAC stereo, 60.0 s |
| `poster.jpg` | Cover frame / thumbnail |
| `captions.srt` | Sidecar English captions, timed to the narration |
| `source/promo.html` | The full animation: all eight scenes, copy and timeline |

## Beats

| Time | Scene | What it shows |
| --- | --- | --- |
| 0:00 | Hook | A prompt, and the gaps it left — risk 72, High |
| 0:08.5 | Prompt review | Missing actions, unresolved attributes, unlinked states |
| 0:16 | Clarify | Questions become a complete, reviewed brief |
| 0:23.5 | Canvas | Blocks, assets, pages, inspector, design tokens |
| 0:31 | Templates + Learn | The template library, and a guided lesson mid-step |
| 0:38.5 | Pro sharing | Live cursors, edit / view link, no refresh |
| 0:46 | Build | Base44 hand-off, Vector AI, Windows desktop |
| 0:53.5 | Pricing + CTA | Free vs Pro, ₹199/month · ₹1,990/year, vectorco.in |

## Audio

- Voice: `en-US-AndrewNeural` via Edge TTS, one segment per scene.
- Score: original ambient pad + pulse synthesised in numpy, ducked under the voice.
- Mastered to roughly −15.7 LUFS integrated, −1.5 dBTP.

## Rebuilding

`source/promo.html` is self-contained. Open it in Chrome at 1920×1080, or record
it with Playwright: load with `?sync=1`, which holds a magenta pre-roll for
1.4 s and then starts the timeline exactly when the marker disappears. Trim the
marker in post, mux the voice + score, and encode H.264/AAC. The scene times live
in the `times` array at the bottom of the file; all copy is plain HTML.
