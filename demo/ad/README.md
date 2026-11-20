# Vector — 40 second ad film

A short, silent-friendly product film cut in the Linear-style dark brand:
graphite canvas, indigo accent, Inter, real product screenshots.

## Files

| File | Use |
| --- | --- |
| `vector-ad-1080p.mp4` | Master, 1920×1080, 30 fps, loudness-normalised stereo |
| `vector-ad-720p.mp4` | Web cut for LinkedIn, X and the site |
| `poster.jpg` | Cover frame / video thumbnail |
| `captions.srt` | Burn-in or sidecar captions |
| `build_ad.py` | Generator: frames, neural voiceover, score, mix and encode |

## Beats

| Time | Beat | Line |
| --- | --- | --- |
| 0:00 | Hook | Most AI tools start with a prompt. Vector starts with the truth. |
| 0:07 | Brief | Drop in a brief. Vector extracts every requirement, with the source attached. |
| 0:14 | Review | It finds the gaps a generator would have guessed at. You decide what gets accepted. |
| 0:19 | Prompt | Then it writes one complete, versioned prompt. Ready for Base44, v0, Bolt or Figma. |
| 0:27 | Build | From a rough sentence to an interface your team can defend. |
| 0:32 | CTA | Vector. The requirement-to-interface system. Start free at vector.is-a.dev. |

## Regenerating

```bash
pip install edge-tts imageio-ffmpeg mutagen pillow numpy
python demo/ad/build_ad.py
```

The script renders every frame with Pillow, synthesises the narration with
Edge TTS, writes a soft minor-key pad with numpy, and mixes with ffmpeg
(loudnorm −16 LUFS, −1.5 dBTP). Frames and audio are cached between runs;
delete `frames/` or `audio/` to force a rebuild.

Source screenshots come from `prototype/preview-*.png`.
`ad/screens/overview-clean.png` is the same still with the demo persona
replaced, so no real name appears on screen.
