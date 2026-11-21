# Vector — 72-second product tour

A slideshow-style walkthrough of the real Vector site: cream paper, dark UI
screenshots, kinetic type, and the actual product on every slide.

This is a separate film from the 60-second promo; the promo is unchanged.

## Files

| File | Use |
| --- | --- |
| `vector-site-tour-4k.mp4` | 4K master, 3840×2160, 30 fps, H.264 + AAC, 72.0 s |
| `vector-site-tour-1080p.mp4` | 1080p cut, 1920×1080, 30 fps |
| `vector-site-tour-720p.mp4` | Lighter cut for web and social |
| `poster.jpg` | Cover frame / thumbnail |
| `captions.srt` | English captions timed to the narration |
| `source/tour.html` | The animation and the real screenshots it uses |

## Chapters

| Time | Chapter | On screen |
| --- | --- | --- |
| 0:00 | Intro | Home, canvas and Vector AI screens fan out |
| 0:04 | Workspace | Home + Projects |
| 0:11 | Analyse | A real prompt and the resulting gaps |
| 0:19 | Clarify | 58 requirements + 4 review findings |
| 0:27 | Canvas | The real editor + design-system panel |
| 0:35 | Templates + Learn | 21 templates + guided lessons |
| 0:42 | Vector AI | A real screen-aware answer |
| 0:49 | Pro sharing | Can edit / Can view live room |
| 0:56 | Ship | Canvas + Base44 hand-off + Windows |
| 1:03 | Pricing | Free vs Pro, ₹199/mo · ₹1,990/yr, end card |

## Audio

- Voice: `en-US-AndrewNeural` via Edge TTS, one segment per chapter.
- Score: original 100 BPM warm synth bed with soft percussion, plus slide
  whooshes, UI pops and an end chime.
- Mixed with a voice-ducking envelope; mastered to −14 LUFS / −1 dBTP.

## Rebuilding

`source/tour.html` is self-contained apart from `source/screens/`. Load it as
`tour.html?render=1`, call `window.seekTour(t)` for each frame and take a 30 fps
screenshot. Use a 1920×1080 viewport with `deviceScaleFactor: 2` for the 4K
master. Scene times live in the `T` array at the bottom of the page.
