# Vector — 60-second promo

A high-energy one-minute product film for Vector. Kinetic type, 3D UI cards,
hard cuts, a live blank-canvas build, the real dot-V logo, an original 120 BPM
score and UI sound design.

## Files

| File | Use |
| --- | --- |
| `vector-promo-60s-4k.mp4` | 4K master, 3840×2160, 30 fps, H.264 + AAC stereo, 60.0 s |
| `vector-promo-60s.mp4` | 1080p cut, 1920×1080, 30 fps |
| `vector-promo-60s-720p.mp4` | Lighter cut for web, WhatsApp and LinkedIn |
| `poster.jpg` | Cover frame / thumbnail |
| `captions.srt` | English captions timed to the narration |
| `source/promo.html` | The full animation: timeline, copy and motion |

## Beats

| Time | Beat | On screen |
| --- | --- | --- |
| 0:00 | Logo sting | The real dot-V assembles, wordmark locks |
| 0:01.5 | The problem | Prompt card, missing-action tags, risk 72 |
| 0:06 | Prompt review | Findings cascade, risk 72 → 22, coverage 68% |
| 0:12 | Clarify | A cursor answers a question, brief assembles, risk 5 |
| 0:18 | Canvas | 12 s centrepiece: a blank page, UI blocks dragged in from the rail, every drop snapping into place while the prompt types itself on the right, then Midnight tokens apply |
| 0:30 | Templates + Learn | 3D template deck, one card lifts, lesson steps check off |
| 0:36 | Pro sharing | Two live cursors, edit / view link, copy toast |
| 0:42 | Build | Brief flies into Base44, app builds, Vector AI review, Windows |
| 0:48 | Pricing | Free vs Pro, ₹199/mo · ₹1,990/yr, PRO stamp |
| 0:52.9 | End card | Dot-V reassembles, vectorco.in, QR, Start free |

## Audio

- Voice: `en-US-AndrewNeural` via Edge TTS, one punchy segment per beat.
- Score: original 120 BPM synth bed (kick, clap, hats, bass, arp, pads) with
  risers and impacts, plus UI pops, snaps, whooshes and a closing chime.
- Mixed with a voice-ducking envelope; mastered to −14 LUFS / −1 dBTP.

## Rebuilding

`source/promo.html` is a single self-contained page. Load it as
`promo.html?render=1`, then call `window.seekPromo(t)` for each frame and take a
30 fps screenshot. For the 4K master use a 1920×1080 viewport with
`deviceScaleFactor: 2`; the page is resolution-independent. The page pauses and
seeks every CSS animation, so the render is deterministic and the audio lines up
exactly. Encode the frames with the included audio, then mux H.264/AAC. Scene
times live in the `T` array at the bottom of the page; all copy is plain HTML.
