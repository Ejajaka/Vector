# Vector — marketing video plan

Three assets, all recordable from the current build. No actors, no stock footage.

| Asset | Length | Where it goes |
|---|---|---|
| A. Hero film | 90 s | Landing page, YouTube, X/LinkedIn |
| B. Feature reel | 3 × 30 s | Learn page, integration pages |
| C. Silent loop | 12 s | Landing hero background, ads |

---

## A. Hero film — 90 seconds

Record at 1440×900, 60 fps, browser at 100% zoom, light theme, bookmarks bar hidden.

| # | Time | On screen | Voiceover | Why it is in the film |
|---|---|---|---|---|
| 1 | 0:00–0:05 | Dashboard, cursor idle | “This is the part nobody shows you.” | Pattern interrupt; no logo yet |
| 2 | 0:05–0:14 | Type into New Analysis: **“Add a red button.”** | “One sentence. Four things missing.” | The core demo, stated plainly |
| 3 | 0:14–0:24 | Result panel: four attributes flagged, risk 74 → CRITICAL | “It needs a label, an action, a colour and a place. The generator guessed all four.” | Shows the mechanism, not the marketing |
| 4 | 0:24–0:34 | Clarification questions answered one by one; score drops to 18 | “Answer four questions before you spend anything.” | Proves the loop works |
| 5 | 0:34–0:44 | Templates page → hover three cards → open the SaaS dashboard preview | “Or start from a template that already knows.” | Breadth without scrolling |
| 6 | 0:44–0:56 | Prompt studio: search “button” in the left palette, click three blocks, prompt assembles on the right | “Search the palette. Click. The prompt writes itself.” | The differentiator |
| 7 | 0:56–1:06 | Integrations: Figma card → Connect → frame import → Vercel deploy → live URL appears | “Import from Figma. Ship to Vercel.” | End-to-end promise |
| 8 | 1:06–1:16 | Pricing page → click Pro → Razorpay modal opens | “Two projects free. Then ₹499 a month.” | Price stated without apology |
| 9 | 1:16–1:24 | Desktop icon in the dock, window opens, same dashboard | “Also a real desktop app — Windows and Mac.” | Platform credibility |
| 10 | 1:24–1:30 | Logo, `vector.is-a.dev`, end card | “Know what your prompt forgot.” | Tagline + one CTA |

**Rules for the edit**

- No text-heavy slides. Every claim is shown on screen, not said over a slide.
- Cut on action, never on a fade.
- Music: one track, −22 LUFS under voice, duck to −26 while speaking.
- Do not show a loading spinner longer than 0.4 s; trim the wait.

---

## B. Feature reel — three 30-second clips

| Clip | Hook (first 3 s) | Beats |
|---|---|---|
| B1 — Block palette | “Stop typing prompts.” | Search → click → prompt grows → score improves → copy |
| B2 — Figma import | “Your design is already the brief.” | Connect → pick frame → extracted elements → generate |
| B3 — Deploy | “From prompt to URL.” | Project → deploy → progress → live link → open in new tab |

Each clip: hook, three beats, one CTA. Captions burned in, because 85% of feed
views are muted.

---

## C. Silent loop — 12 seconds

A screen recording of the risk gauge dropping from 74 to 18 while the prompt
rewrites itself. Loop seamlessly, no text, 1080×1080 for social, 1920×1080 for
the landing hero.

---

## Production checklist

| Step | Detail |
|---|---|
| Reset state | Clear `localStorage` so the trial counter starts at 2 and the tour fires |
| Seed content | Create two projects with realistic names before recording, so grids are not empty |
| Recording | OBS, 1440×900 canvas, 60 fps, display capture, cursor highlight on |
| Voice | Record in one take per section; re-record any sentence you stumble on |
| Captions | Export SRT, keep lines ≤ 42 characters, no more than 2 lines |
| Colour | Match the app: ivory `#F6F4EC`, teal `#49686C`, mustard `#D1B653` |
| Thumbnail | Single frame from beat 3 (the CRITICAL score), 1280×720, tagline bottom-left |

## Reuse the existing pipeline

`demo/build/build_demo.py` already renders ten screens and `demo/captions.srt`
already holds narration timings. Regenerate stills after UI changes:

```bash
python demo/build/build_demo.py
```

Then record only the interactions (typing, clicking) and drop the stills in as
B-roll. That keeps the video current without a full re-shoot every release.
