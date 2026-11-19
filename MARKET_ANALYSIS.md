# UI Prompt Linter — Deep Market Analysis

**Category-definition, competitive teardown, and go-to-market assessment for a pre-generation UI prompt validator**

| Field | Detail |
|---|---|
| Document type | Deep market analysis (strategic + technical) |
| Product | UI Prompt Linter (`Ejajaka/ui-prompt-linter`) |
| Version analysed | `main` @ `056659a` (286 tracked files) |
| Prepared | 13 November 2026 |
| Coverage | Market sizing, demand evidence, 9 competitor categories, 30+ named players, positioning, pricing, risk, roadmap |
| Method | Repository code/README inspection + public market research (Nov 2026) + analyst modelling |
| Confidence convention | **Verified** = in repo or cited public source. **Modelled** = our assumption, explicitly labelled. |

---

## Contents

1. Executive summary
2. The problem, and why it is suddenly expensive
3. What the product actually is
4. Market definition and sizing
5. Demand drivers and evidence
6. How it works (technical architecture)
7. Measured performance and an honest reading of it
8. Competitive landscape — category map
9. Competitive teardown — theirs vs ours (tabular)
10. Consolidated capability matrix
11. Where competitors are genuinely better than us
12. Differentiation, moat and positioning
13. Business model and pricing
14. Go-to-market
15. SWOT
16. Risk register
17. Roadmap and KPIs
18. Recommendations
19. Appendix A — measured results
20. Appendix B — sources
21. Appendix C — glossary

---

## 1. Executive summary

**The thesis in one sentence:** every AI tool in the design-to-code stack is optimised for *generating* UI from an under-specified prompt, and almost nothing is optimised for *proving the prompt was under-specified before you spend money generating it*.

### 1.1 Key findings

| # | Finding | Evidence | Implication |
|---|---|---|---|
| 1 | The market we sit adjacent to is large and compounding | AI code tools ≈ USD 9.35–9.46B in 2026 → USD 22–38B by 2030–32 (23–24% CAGR) | A thin "quality layer" on a fast-growing base does not need to win the category to be material |
| 2 | The adjacent prompt-engineering tooling market is small but growing fast | ≈ USD 671M in 2026 → ≈ USD 7.9B by 2035 (Precedence) | Prompt tooling alone is a bad standalone market; it must attach to a workflow |
| 3 | Demand is real but trust is collapsing | 84% of developers use or plan to use AI; 46% actively distrust its accuracy, up from 31% a year earlier; only 3% "highly trust" it (Stack Overflow 2025) | "Show me what the AI had to guess" is a more sellable product than "better prompts" |
| 4 | AI amplifies existing dysfunction rather than fixing it | DORA 2025 (~5,000 respondents): AI is an amplifier of an organisation's existing strengths *and* dysfunctions | Input quality becomes the binding constraint, not model quality |
| 5 | Generation tools resolve ambiguity silently | v0, Figma Make, Lovable, Bolt, Builder.io, Anima, Uizard all *guess* and let you iterate | The correction loop is paid in tokens, credits, and review cycles |
| 6 | Nobody owns "UI prompt completeness" | General prompt linters lint *system prompts*; prompt ops measures *outputs*; spec tools write *prose specs*; generators *guess* | There is a genuine unoccupied position |
| 7 | Our differentiation is defensible on mechanics, not on model quality | Deterministic schema + element linking + blocking clarification + shared risk score + offline parity across 5 surfaces | We do not compete on "a better LLM"; we compete on a rubric nobody else has encoded |
| 8 | Our measured accuracy is credible but narrowly validated | Rules: 0.973 token F1, 0.989 missing-attribute F1 on synthetic test; 0.837 / 0.978 on 30 hand-written prompts | Strong enough to demo, not strong enough to claim generality |
| 9 | Our biggest weakness is not accuracy — it is scope | English only, 10 element types, 1,180 records, 30 human prompts, no dependency parse, no calibrated risk | Must be said first, before a buyer says it for us |
| 10 | The commercially correct wedge is the browser extension, not the Streamlit app | Zero permissions, no network, no key, instant, already live on Edge Add-ons | Lowest-friction distribution into an existing habit |

### 1.2 What we are, in market terms

We are **not** a prompt-to-UI generator. We are the **pre-flight validator** for UI instructions: a deterministic spec-checker that reads the prompt, extracts UI elements, binds every colour/location/action/label to the right element, asks blocking questions about what is missing or vague, scores the risk 0–100, and emits a validated prompt that any generator consumes better.

### 1.3 The honest commercial verdict

| Dimension | Verdict |
|---|---|
| Problem reality | Strong. Verified by market behaviour (iteration-heavy workflows) and by developer trust data |
| Category clarity | Weak-to-moderate. "Prompt linting" is not a recognised budget line in 2026 |
| Technical differentiation | Strong on mechanics; replicable by a funded incumbent in ~2 quarters |
| Distribution | Good. Five surfaces, one of them a live store listing |
| Defensibility | Moderate. Data + rubric + workflow habit, not model IP |
| Time window | 12–24 months before a generator vendor ships "clarify first" natively |

**Strategic conclusion:** the product is real and the timing is good, but it must be sold as **"cut regeneration cycles"** to teams who already pay for generation, not as **"write better prompts"** to individuals. Attach to the invoice that already exists.

---

## 2. The problem, and why it is suddenly expensive

### 2.1 The problem stated precisely

A UI instruction like *"Add a red button"* is not a specification. A generator must invent four things: **where** it goes, **what it says**, **what it does**, and **what happens next**. Every invention is a coin flip that the user then pays to correct.

The conventional reading is "the user wrote a bad prompt". The correct reading is **"the tool accepted an incomplete specification without saying so"** — which is a tooling failure, not a user failure.

### 2.2 Why this got expensive now, and did not in 2023

| Era | Cost of ambiguity | Who absorbed it |
|---|---|---|
| 2023 completion | Autocomplete guessed the next line; a wrong guess cost seconds | Developer, invisible |
| 2024 chat | A wrong answer cost a re-prompt; still seconds | Developer, invisible |
| 2025 agentic | A wrong guess produced a whole component or file; correction cost minutes to hours | Developer, visible |
| 2026 prompt-to-app | A wrong guess produces a deployed app, a database schema, and a PR | Team, budget, and trust — **visible and metered** |

The structural change is that **ambiguity is now billed**. v0 meters tokens; Lovable meters credits; Bolt meters agent runs; Figma Make burns seat time. A regeneration is no longer a free question — it is a line item. That converts a UX annoyance into a procurement problem, which is the only kind of problem that gets a budget.

### 2.3 The four failure modes we address

| Failure mode | Example | What the generator does | What it costs |
|---|---|---|---|
| Missing attribute | "Add a button" (no label, action, colour, location) | Invents all four | 1–4 regeneration rounds |
| Vague value | "some nice colour", "somewhere on the side" | Picks one arbitrarily | Rework after review |
| Mislinked attribute | "red card with a blue button" — which is red? | Usually guesses by proximity | Wrong visual, redesign |
| Unknown/unhandled element | "make the hero chunky" | Ignores or hallucinates a "hero" | Silent requirement loss |

Our product turns each of these into an explicit, answerable question **before** generation. That is the whole value proposition, and it is measurable in regenerations avoided.

---

## 3. What the product actually is

### 3.1 One-paragraph definition

UI Prompt Linter reads a natural-language UI instruction, tokenises it, detects which UI elements it names (10 supported types), links each colour/location/action/label mention to the correct element, compares the result against a per-element **required-attribute schema**, detects vague phrasing and unknown element types, blocks the recommendation behind a clarification loop that asks about exactly what is missing, computes a deterministic 0–100 risk score that is shared across all detectors, and finally emits a copy-ready validated prompt plus a per-element report. It runs as a Streamlit app, a CLI, a React web app (Rules via Pyodide, BERT via ONNX, optional grounded LLM), a Manifest V3 browser extension, and a native Android app — with the Rules engine byte-identical across the last three.

### 3.2 Capability summary

| Capability | What it does | Why a buyer cares |
|---|---|---|
| Element detection | Finds 10 UI element types in free text | Turns prose into structure |
| Attribute linking | Binds each value to the right element | Prevents "which one is red?" rework |
| Schema diff | Compares against required attributes per element | Produces the actual gap list |
| Vague detection | Flags "nice", "somewhere", "modern", "do something" | Catches the failures users cannot see |
| Blocking clarification | Asks only about gaps; max 3 rounds, 6 questions/round | Forces resolution before spend |
| Risk score | 0–100, four weighted components, four bands | A number a manager can gate on |
| Best-prompt synthesis | Emits a rewritten, complete instruction | Immediately usable in any tool |
| Multi-surface parity | Same findings in web, extension, Android | Same answer everywhere |
| On-device operation | Rules are fully local; no key, no network | Passes security review |

### 3.3 Who this is for

| Segment | Role | Pain | Willingness to pay | Priority |
|---|---|---|---|---|
| AI-first front-end developers | Builds UI with v0/Cursor/Copilot daily | Regeneration loops, review churn | Medium (individual), high (team) | **Primary** |
| Product designers using prompt-to-UI | Figma Make, Lovable, Uizard | Prototypes that miss intent | Medium | **Primary** |
| Design-system teams | Owns component/attribute standards | Inconsistent instructions to agents | High (team) | **Secondary** |
| Engineering managers / platform teams | Owns AI tooling budget | Cannot measure or gate prompt quality | High | **Secondary** |
| Agencies / studios | Ship many client UIs fast | Margin loss on rework | High | **Secondary** |
| Students / educators | Learning prompt engineering | Needs explainable feedback | Low | **Acquisition** |
| Non-technical founders | Vibe-coding MVPs | Invisible requirements loss | Low-medium | **Opportunistic** |

---

## 4. Market definition and sizing

### 4.1 We sit at the intersection of three markets

| Layer | What it contains | 2026 size | Growth | Source |
|---|---|---|---|---|
| AI code tools | Assistants, generators, agents | USD 9.35–9.46B | ~23–24% CAGR → USD 22.2B (2030) / 38.6B (2032) | Mordor Intelligence; Research and Markets; GMI |
| Prompt engineering tooling | Optimisers, libraries, ops | USD 671M | → USD 7.9B by 2035 | Precedence Research |
| Design-to-code | v0, Figma MCP, Builder.io, Lovable, Bolt, Anima, Uizard (13 tools benchmarked) | Not separately sized at this granularity | Fast; MCP registry 1.2k → 9.4k servers Q1 2025→Apr 2026 | AIMultiple |

**Read this carefully.** We are not "the prompt engineering market". That market is small (≈USD 0.67B) and dominated by observability vendors who bundle prompt tooling into a platform. Attaching our revenue thesis to it would cap us. We belong to the **AI code tools** market as a quality/assurance layer, because that is where the spend and the rework cost actually live.

### 4.2 TAM / SAM / SOM — explicit, labelled model

All figures below the TAM row are **modelled**, not sourced. Assumptions are stated so they can be argued with.

| Layer | Definition | Value (2026) | Assumption |
|---|---|---|---|
| TAM | Global AI code tools spend | ≈ USD 9.4B (verified) | Market reference |
| Layer share | Spend attributable to *input/spec quality* rather than generation | ≈ USD 750M (**modelled**) | 8% of AI code tooling spend is pre-generation specification and review |
| TAM (UI-relevant) | Share of that touching UI/front-end work | ≈ USD 300M (**modelled**) | 40% of spec work is UI-facing |
| SAM | Reachable via self-serve web/extension + team seats, English-first | ≈ USD 120M (**modelled**) | 40% of UI-relevant spend is bottom-up addressable rather than enterprise-procured |
| SOM (36 months) | Realistic capture | USD 1.5M–4.5M ARR (**modelled**) | 1.25%–3.75% of SAM |

### 4.3 Bottom-up sanity check (independent of the top-down model)

| Driver | Low | Base | High |
|---|---|---|---|
| Reachable AI-first front-end devs/designers (extension + web) | 150,000 | 400,000 | 800,000 |
| Paid conversion | 0.8% | 2.0% | 3.5% |
| Individual price/month | USD 5 | USD 8 | USD 12 |
| **Individual ARR** | **USD 72k** | **USD 768k** | **USD 3.36M** |
| Team accounts | 80 | 300 | 700 |
| Team ACV | USD 1,200 | USD 2,400 | USD 6,000 |
| **Team ARR** | **USD 96k** | **USD 720k** | **USD 4.2M** |
| **Total SOM** | **USD 168k** | **USD 1.49M** | **USD 7.56M** |

The two models agree on the base case within ~25%, which is the only useful thing a model of this kind can do. The high case is not a forecast; it is the case where the extension goes genuinely viral inside one large enterprise.

### 4.4 Why the addressable slice is defensible

| Objection | Response |
|---|---|
| "This is a feature, not a market" | Correct today. Features become categories when a regulator, a budget owner, or a vendor standardises them. Our job is to become the rubric before a vendor does |
| "Generators will just do this" | They will do *some* of it. But a generator cannot credibly tell you its own input was bad — that is an adversarial position. An independent checker can |
| "Developers won't pay for linting" | They already do: ESLint is free, but SonarQube, Snyk, Chromatic, and Percy are not. Quality gates sell when they gate something expensive |

---

## 5. Demand drivers and evidence

### 5.1 Driver table

| Driver | Evidence | Strength | Implication |
|---|---|---|---|
| Adoption is near-universal | 84% of developers use or plan to use AI tools (Stack Overflow 2025); ~90% daily use in DORA 2025 | **Very strong** | Every developer is a candidate user; the question is only which tool |
| Trust is falling, not rising | Distrust of AI accuracy rose 31% → 46% in one year; trust 40% → ~29–33%; 3% highly trust | **Very strong** | "Show me the gaps" sells better than "write better" |
| Rework is the dominant hidden cost | DORA 2025: AI amplifies existing strengths and dysfunctions; throughput effects are small and can be negative at high adoption | **Strong** | Input quality is the cheapest lever on rework |
| Ambiguity is now metered | v0 token metering (since May 2025); Lovable credit pricing; Bolt agent runs | **Strong** | Regeneration avoidance has a directly defensible ROI number |
| Design-to-code is standardising on MCP | MCP registry 1,200 → 9,400+ servers (Q1 2025 → Apr 2026); Figma bidirectional MCP Feb 2026; Copilot March 2026 | **Strong** | A natural integration point: become an MCP tool that agents call before generating |
| Spec-driven development is going mainstream | Kiro, GitHub Spec Kit, BMAD all established by 2026 | **Moderate-strong** | Validates "specify before you generate"; we are the UI-specific instance |
| Enterprise AI governance is forming | Vendor compliance push (Bolt SOC 2 Type II; Lovable + Wiz; v0 enterprise controls) | **Moderate** | Auditable prompt quality becomes a procurement checkbox |
| Privacy/local processing matters | Enterprise resistance to sending proprietary prompts to third parties | **Moderate** | Our on-device Rules engine is a genuine differentiator, not a nicety |

### 5.2 The specific gap in the market

| What exists | What it optimises | What it does not do |
|---|---|---|
| Prompt optimisers | Wording quality for a target model | Know that a button needs 4 attributes |
| Prompt linters | System-prompt hygiene, injection, clarity | Link values to UI elements |
| Prompt observability | Post-hoc output quality, traces, evals | Prevent the bad prompt being sent |
| Spec-driven tools | Prose requirements before code | Encode UI attribute schemas; score; work in 5 seconds |
| Prompt-to-UI generators | Speed of generation | Admit uncertainty before spending |
| Guardrails | Safety at runtime | Completeness at authoring time |
| UI QA linters | Accessibility, visuals after code exists | Requirements before code exists |

**No row in that table answers: "is this UI instruction complete, and exactly what is missing?"** That is the gap.

---

## 6. How it works (technical architecture)

### 6.1 Pipeline

```
UI instruction (free text)
        │
        ▼
  tokenize_with_offsets          fixed regex tokenizer, 1,180 records verified
        │
        ▼
  router.route(text)             prompt-only features: hex colours, repeated
  ┌─────┴─────┬──────────┐       nouns, landmark patterns, lexicon coverage,
  ▼           ▼          ▼       list-like labels, OOV density
Rules       BERT       LLM
(6 passes)  (DistilBERT  (grounded JSON,
            BIO)        verbatim-only)
  └─────┬─────┴──────────┘
        │
        ▼
  low detector confidence? ──► LLM extraction fallback
        │
        ▼
  check_elements()               per-element required-attribute diff
        │
        ▼
  clarification loop             missing / vague / unknown / low-confidence
  ask → merge → re-validate      max 3 rounds, 6 questions per round
        │
        ▼
  shared deterministic risk      100 × (0.40·completeness + 0.20·vagueness
                                       + 0.20·detection_quality + 0.20·unresolved)
        │
        ▼
  explanation + recommendations + validated best prompt
  (deterministic templates if no LLM)
        │
        ▼
  Streamlit · CLI · Web app · Extension · Android
```

### 6.2 Stage-by-stage

| Stage | Module | Input | Output | Commercial significance |
|---|---|---|---|---|
| Tokenise | `tokenization.py` | Raw prompt | Tokens + offsets | Reproducibility; offsets enable exact highlighting |
| Route | `router.py` | Prompt features | Rules / BERT / LLM | Cost control: cheap path by default |
| Detect | `rules_tagger.py`, `bert_tagger.py`, `llm_backend.py` | Tokens | BIO spans → elements | Core extraction |
| Link | `linking.py` | Elements + attribute spans | Attribute→element map | The step that prevents "which one is red?" |
| Vague | `vague.py` | Element clause windows | Vague flags | Catches failures users cannot see |
| Check | `checker.py` | Elements + schema | Missing/unknown lists, messages | The actual product output |
| Clarify | `clarification.py` | Gaps | Questions, merged answers | Forces resolution pre-generation |
| Score | `risk.py` | Components | 0–100 + band | The gateable number |
| Explain | `llm_backend.py` / `messages.py` | Result | Narration + recommendations | Makes findings actionable |
| Synthesise | pipeline | All | Validated best prompt | The artefact users copy out |

### 6.3 The three detection engines

| Method | What it is | Where it wins | Where it loses |
|---|---|---|---|
| **Rules** | Six deterministic passes: quoted labels → UI nouns (longest-first, landmark guard) → colours → locations → action clauses → residual labels | Known vocabulary, explicit cues, hex/unseen colour names, auditability | Unseen phrasing, coreference, dense compound sentences |
| **BERT** | Fine-tuned `distilbert-base-uncased` BIO tagger, first sub-token labelled, `-100` elsewhere, served as quantised ONNX in browser | Free-form text, repeated nouns, list-like labels without cues | Unseen vocabulary (hex colours, new colour names); small training set |
| **LLM** | Grounded JSON extraction against an OpenAI-compatible endpoint; values must be copied verbatim or dropped | Prompts with no known UI noun; heavy OOV; vague language | Latency, cost, non-determinism, needs a key; unproven at scale here |

### 6.4 Auto routing rules

| Prompt signature | Route | Rationale |
|---|---|---|
| Hex/held-out colours, `CTA`, known UI nouns, explicit cues | Rules | Lexicon covers them; BERT never saw them |
| Repeated UI nouns, landmark patterns, list-like labels with no cue | BERT | Sequence model handles repetition better |
| No known UI noun, heavy OOV, vague language | LLM | Nothing deterministic to anchor on |
| Unclear margin | LLM if enabled, else Rules | Conservative default |
| BERT chosen only if it beats Rules by margin ≥ **1.25** | — | Deliberately conservative; prevents thrash |

### 6.5 Clarification and risk

| Parameter | Value | Why it matters |
|---|---|---|
| Max rounds | 3 | Bounded interview; respects the user's time |
| Questions per round | 6 | Never a wall of questions |
| Blocking | Yes — recommendation withheld until loop ends | The core mechanism: no validated prompt until gaps resolved |
| "I don't know" | Allowed; keeps item unresolved | Honest — unresolved items are scored, not hidden |
| Risk weights | completeness 0.40, vagueness 0.20, detection quality 0.20, unresolved 0.20 | Completeness dominates, correctly |
| Risk bands | Low 0–24, Medium 25–49, High 50–74, Critical 75–100 | Familiar four-band mental model |
| Initial vs final | Both displayed | Proves the product did something |

### 6.6 Five distribution surfaces, one behaviour

| Surface | Stack | Engines | Distribution | Strategic role |
|---|---|---|---|---|
| Web app | React + TypeScript | Rules (Pyodide) + BERT (ONNX) + LLM | GitHub Pages | The demo and the funnel |
| Rules demo | Static page | Rules via Pyodide | GitHub Pages | Zero-friction proof |
| Browser extension | Manifest V3 | JS port of Rules | Edge Add-ons (live), Chrome Web Store | **Primary wedge** — in the habit loop |
| Android app | Jetpack Compose, minSdk 24 | Same `engine.js` in off-screen WebView | APK / sideload | Credibility; mobile-first designers |
| Full engine | Streamlit (`app.py`) | Rules + DistilBERT + grounded LLM | Streamlit Cloud / Docker / HF Space | Depth; BERT + LLM path |

### 6.7 Privacy and security architecture

| Property | Implementation | Buyer benefit |
|---|---|---|
| No permissions | Extension requests none | Passes security review without a ticket |
| No network calls | Extension is fully offline | Works air-gapped; no data egress |
| No remote code | MV3 compliant, no eval of remote scripts | Store-policy safe |
| Local history only | `prompt_linter_history_v1` in SharedPreferences / `localStorage` | No account, no upload, no DPA needed |
| User-supplied endpoint | Web LLM key stays in `localStorage`, sent only to the chosen endpoint | Buyer controls the processor |
| Input hardening | All user text escaped before HTML; 1,000-char truncation with warning | No XSS from prompt content |
| Deterministic fallback | No LLM → templates | Never a blank screen, never a fabrication |

---

## 7. Measured performance and an honest reading of it

### 7.1 Headline numbers (verified from `results/`)

| Metric | Split | Rules | BERT | Auto |
|---|---|---|---|---|
| Token entity F1 (seqeval) | dev | 0.993 | **1.000** | 0.993 |
| Token entity F1 | test | **0.973** | 0.900 | 0.971 |
| Token entity F1 | handwritten | **0.837** | 0.718 | 0.828 |
| Missing-attribute F1 | dev | 1.000 | 1.000 | 1.000 |
| Missing-attribute F1 | test | **0.989** | 0.977 | **0.989** |
| Missing-attribute F1 | handwritten | **0.978** | 0.926 | 0.968 |
| Prompt-level exact missing-set | test | **0.975** | 0.910 | **0.975** |
| Prompt-level exact missing-set | handwritten | **0.933** | 0.800 | **0.933** |
| Element detection F1 | test | 0.995 | **1.000** | — |
| Attribute linking (gold tags) | all splits | 1.000 | 1.000 | — |

### 7.2 What the numbers actually mean

| Observation | Interpretation | Commercial reading |
|---|---|---|
| Rules beat BERT on synthetic test | Lexicon covers held-out colour vocabulary; BERT never saw it | Our deterministic core is the asset, not the neural model |
| BERT is perfect on dev, weaker on test | Distribution shift, not a bug | Do not market BERT as the differentiator |
| Handwritten performance drops (0.973 → 0.837 entity F1) | Templated training data does not transfer fully | Real-world accuracy is ~0.84, not ~0.97. Say so |
| End metric is far more stable than token F1 (0.989 test, 0.978 handwritten) | Linking + schema recovery absorb boundary errors | **Sell the end metric.** It is the number that maps to user value |
| LOCATION F1 on handwritten is 0.129 | Gold spans omit the leading "at the" | A genuine weak spot, publicly reported |
| Auto matches Rules and rarely diverges | Router is conservative, not clever | Position Auto as cost control, not accuracy gain |
| Linking is 1.000 with gold tags | The bottleneck is detection, not binding | Investment should go into detection breadth |

**The defensible claim:** *on our evaluated distribution, we detect ~98% of missing required attributes and get the exact missing set right for ~93% of hand-written prompts.* That is a real, checkable, non-inflated claim. Do not claim 0.97 general accuracy — the honest number is lower and a sceptical buyer will find out.

### 7.3 Known limitations (as published in the repo)

| Limitation | Severity | Mitigation path |
|---|---|---|
| Synthetic, templated prompts | High | Expand handwritten set; publish per-split numbers |
| Handwritten split is only 30 prompts | High | 300+ human prompts before enterprise claims |
| English only | High for global SAM | Multilingual lexicons; language detection |
| 10 element types | Medium | Extend schema (table, tabs, toast, tooltip, stepper, drawer) |
| Complex coreference out of scope | Medium | Dependency parse; conversation state |
| Fixed vague-phrase cue list | Medium | Learned vagueness classifier |
| Linking is adjacency heuristic, not a parse | Medium | Span-based linking; compare both |
| Risk score is hand-weighted, uncalibrated | Medium | Calibrate against human risk judgements |
| LLM branch unevaluated at scale | Medium | Evaluation harness before enabling as primary |
| BERT checkpoint not in Git | Low | `BERT_MODEL_URL` / release asset (already implemented) |

---

## 8. Competitive landscape — category map

### 8.1 Nine categories, one unoccupied seat

| # | Category | Representative players | Job to be done | Overlap with us | Threat |
|---|---|---|---|---|---|
| A | General prompt optimisers | PromptPerfect (Jina), built-in "improve prompt" in ChatGPT/Claude/Gemini, Promptitude, PromptStorm | Rewrite a prompt to work better | Medium — same object, different rubric | Medium |
| B | Prompt linters / static analysis | `cognitioncommons/prompt-linter`, `lintlang`, Chrome "Prompt Linter", CI prompt-lint gates | Catch prompt anti-patterns | **High — closest analogue** | Medium |
| C | Prompt ops / eval / observability | PromptLayer, LangSmith, Langfuse, Braintrust, Promptfoo, Vellum, Humanloop, Maxim, Agenta, Helicone, Latitude | Version, trace, evaluate prompts in production | Low-medium | Low (complement) |
| D | Spec-driven development | Kiro, GitHub Spec Kit, BMAD | Write a spec before code | Medium — same philosophy | Medium |
| E | Prompt-to-UI generators | v0 (Vercel), Figma Make, Lovable, Bolt, Builder.io, Anima, Uizard, Locofy, Supernova, Grida, Clutch | Turn prompt/design into UI | **High — we sit upstream** | Low (partners) |
| F | AI coding assistants | GitHub Copilot, Cursor, Claude Code, Codex, Windsurf | Generate/edit code inline | Medium | Low |
| G | AI security / guardrails | Lakera Guard (Check Point), Prompt Security, Azure Prompt Shields, Protect AI, Guardrails AI, NeMo Guardrails, Rebuff | Detect injection/jailbreak/PII | Low | None |
| H | Post-hoc UI quality | ESLint, axe-core, Storybook a11y, Chromatic, Percy, Playwright, Lighthouse | Catch defects after code exists | Medium | None |
| I | Requirements / PRD tooling | Notion AI, ChatPRD, Jira Product Discovery | Draft product requirements | Medium | Low |

**The empty seat:** an independent, deterministic, UI-domain-aware validator that runs *before* generation and produces a gateable score. Categories B, D and E each hold one piece. Nobody holds all three.

### 8.2 Positioning map (text form)

Two axes: **when it acts** (before generation ← → after generation) and **specificity** (generic prose ← → domain schema).

| | Generic | Domain-specific (UI) |
|---|---|---|
| **Before generation** | Prompt optimisers, prompt linters, spec tools | **◀ UI Prompt Linter ▶** |
| **After generation** | Prompt ops/eval, guardrails | UI QA (axe, ESLint, Chromatic) |

Everything generic-before-generation competes on wording. Everything domain-specific-after-generation competes on defects. We are the only domain-specific-before-generation cell.

---

## 9. Competitive teardown — theirs vs ours

Each table reads: **how it works**, **its limitations**, **how we overcome it**, and — deliberately — **what we still do not fix**. The last column is what makes this analysis usable rather than promotional.

### 9.1 Category A — General prompt optimisers

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **PromptPerfect (Jina)** | Sends your prompt to an optimiser model, returns a rewritten prompt tuned for a target model | Generic text rewriting; no UI element schema; no deterministic completeness report; no risk score; requires a network call and usually a key; output varies run to run | Schema-driven: 10 element types × required attributes, deterministic, same answer every run, fully local for Rules | We do not produce beautifully fluent prose across arbitrary domains; we optimise for completeness, not style |
| **Built-in "improve prompt" (ChatGPT, Claude, Gemini)** | Conversational rewrite by the same model family | Non-deterministic; no fixed rubric; cannot enumerate what was missing; no audit trail; no offline mode; different answer per vendor | Fixed rubric + explicit gap list + JSON output + identical behaviour across surfaces | The LLM's rewrite may still read better than our synthesised prompt; we are a checker, not a copywriter |
| **Promptitude / PromptStorm / Prompt libraries** | Template and prompt marketplace; fill-in-the-blank patterns | Content library, not validation; nothing verifies *your* prompt is complete; no scoring; no element binding | We validate the user's own instruction rather than supply generic templates | We do not have thousands of curated templates; breadth of content is theirs |
| **Model-specific prompt guides** | Documentation and best practices | Advice, not tooling; no measurement; no enforcement | Automated enforcement with a number and a gate | We cannot enforce anything without integration into a workflow |

### 9.2 Category B — Prompt linters and static analysis (our nearest neighbours)

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **`cognitioncommons/prompt-linter`** (pip, MIT) | CLI over a rule set in three categories — clarity (vague-instruction, missing-context, unclear-output-format, ambiguous-pronoun, missing-examples), injection (unescaped input, weak delimiters, instruction override, role manipulation, missing boundary), consistency (role mismatch, format inconsistency, contradictory constraints, persona drift). `.promptlintrc`, JSON output, pre-commit + GitHub Actions | Built for **system prompts and prompt templates**, not user-facing UI requests; has no concept of UI elements, required attributes, or attribute→element binding; no clarification dialogue; no risk score; no multi-surface distribution; rule matching is phrase/regex-level over the whole prompt | Domain schema (10 element types × required attributes) + attribute linking + blocking clarification + shared 0–100 risk + five surfaces with byte-identical Rules | **We are worse at injection and template hygiene.** Their injection rules are a real capability we do not have; we should import or integrate, not pretend to cover it |
| **`lintlang`** (Hermes Labs) | Static analysis for AI-agent configs; "prompt-lint gate"; tool-description/differentiation analysis; ARIF quality gates | Targets agent configuration and tool descriptions, not end-user UI instructions; no UI semantics; no dialog; no scoring model for requirements completeness | UI-domain rubric + interactive resolution loop | Nothing — different object entirely; but it shows the "lint gate" pattern is being adopted, which validates the category |
| **Chrome "Prompt Linter" extension** | In-page lint, score, and improve AI prompts on any web page | Generic quality signals; typically model-backed, so non-deterministic and network-dependent; no UI element schema; no attribute binding; no clarification | Deterministic, offline, zero-permission, UI-aware, with a specific gap list per element | They have broader in-page reach and generic applicability; ours is narrower by design |
| **CI prompt-lint gates** (blog-level practice, e.g. tianpan.co) | Represent system prompts as files, lint in CI, fail the build | Developer-only, repo-only, heavyweight; nothing for a designer typing one sentence; no UI schema; no clarification | 5-second single-prompt check in browser/extension/mobile; same rubric for designers and developers | They gate at merge time with authority we do not have; we are advisory until integrated |

**Assessment:** this is the most instructive category, because it proves three things at once — the *linter* framing is already accepted, the *prompt* object is already considered lintable, and **nobody has applied it to the UI requirement domain**. It also proves our weak flank: real linters ship injection and consistency rules, and we do not.

### 9.3 Category C — Prompt ops, eval and observability

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **PromptLayer** | Gateway/proxy that logs, versions, and replays prompt traffic | Requires routing calls through their proxy; measures what happened, not whether the input was complete; cloud, key-based, per-seat | No instrumentation; runs before any call; no proxy, no key, no data egress | They own the trace history and team collaboration layer |
| **LangSmith (LangChain)** | Tracing, datasets, evaluators, prompt playground | Deeply tied to the LangChain ecosystem; engineering-heavy setup; evaluates outputs against datasets; no UI-domain rubric | Zero setup, zero ecosystem lock-in, immediate value on one sentence | Dataset-driven evaluation at scale, regression suites, CI evals |
| **Langfuse** | Open-source LLM observability, traces, evals, prompt management | Self-host or cloud; assumes an instrumented app; nothing before the first call; generic quality signals | Same as above — pre-call, no instrumentation | Production observability entirely |
| **Braintrust** | Eval-first platform: datasets, scorers, experiments, CI integration; published 2026 comparisons of prompt-engineering tools | Optimised for teams with an eval culture and existing golden datasets; cost and setup proportional to that; no UI attribute model | Deterministic, opinionated, zero-setup rubric for one narrow but common job | Serious experimentation infrastructure |
| **Promptfoo** | Open-source CLI for prompt/agent evals and red-teaming, YAML config, CI-friendly | Requires you to define test cases and assertions; no domain knowledge; nothing interactive; developer-only | Built-in domain assertions (required attributes per element) with no config | Red-teaming breadth, provider matrix testing |
| **Vellum / Humanloop / Maxim / Agenta / Helicone / Latitude** | Versioning, playgrounds, deployment, monitoring, A/B, gateway caching | Platform-shaped: seat-based, cloud-first, integration-first; each is a *place to manage prompts*, not a *judge of one prompt's completeness* | Single-purpose, instant, free to try, works offline | Collaboration, versioning, deployment, monitoring |

**Assessment:** this category is **complement, not competitor**. The strategically correct move is to emit a result format these platforms can ingest (a JSON risk record per prompt) so that a team using LangSmith can store our score as a metadata field. That turns nine potential competitors into nine distribution channels.

### 9.4 Category D — Spec-driven development

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **Kiro (AWS)** | Agentic IDE; generates `requirements.md` → `design.md` → `tasks.md`; EARS-style acceptance criteria; human review gates before code | Per-repo, developer-only, heavyweight for a one-line UI tweak; requirements are **prose**, not a typed schema; no UI attribute model; no element-level binding; no numeric score | 5-second check on a single instruction; typed element/attribute schema; numeric risk; works for designers and non-developers | Full spec lifecycle, task decomposition, code traceability |
| **GitHub Spec Kit** | Open-source CLI: `/specify`, `/plan`, `/tasks` scaffolded into any agent | Markdown artefacts; quality depends on the model and the author; no schema; no scoring; no enforcement; nothing outside a repo | Deterministic, measured, domain-specific, and usable outside a repo | Repo integration and multi-agent orchestration |
| **BMAD / similar methods** | Role-based agent workflow with story files and acceptance criteria | Process overhead; assumes a team and a sprint; not a single-prompt tool; no UI schema | Lightweight, instant, no ceremony | Delivery discipline that these methods enforce |

**Assessment:** this category validates our philosophy and is the most likely source of an acquisition conversation. It also shows our ceiling: a spec tool that cannot decompose into tasks is a *pre-step*, not a platform. Position accordingly — we are the UI-specific front door to a spec workflow, and we should ship a Spec Kit-compatible export.

### 9.5 Category E — Prompt-to-UI generators (our upstream/downstream partners)

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **v0 (Vercel)** | Prompt → React/Next.js/Tailwind/shadcn code; Git-native branches, sandbox runtime, Figma import on paid tiers; 3.5M+ unique users reported; token-metered pricing | **Resolves ambiguity by guessing** and shows you the guess only after generation; React/Next/shadcn stack lock-in (no Svelte/Vue output); token pricing unpredictable for heavy iterators; cloud-only; no pre-generation completeness report | We make the missing four attributes explicit *before* a token is spent; model- and framework-agnostic; local | It actually builds the app. We do not generate anything |
| **Figma Make** | Prompt → interactive prototype inside Figma, leveraging existing design context | Prototype-grade output; interprets under-specified prompts silently; no completeness check; no risk score; seat-bound | Structured gap list before generation; produces a prompt any generator consumes better | Deep design-file context and one-click prototyping |
| **Lovable** | Prompt → full-stack app with Lovable Cloud (Supabase); Plan Mode (Feb 2026) shows a build plan before coding; credit-based pricing | Complex business logic struggles; credits burn on iteration; no requirement-completeness rubric for *UI intent* specifically; a build plan is not an attribute diff | We supply the missing UI attributes as structured input, reducing plan revisions | Hosting, database, auth, deployment — everything after the prompt |
| **Bolt.new** | Browser-native full-stack via WebContainers; broad framework support; SOC 2 Type II | IDE-style learning curve; no native Figma fidelity path; ambiguity resolved by generation + iteration; agent runs consume quota | Framework-agnostic pre-check; no runtime, no container, instant | The build environment itself |
| **Builder.io / Visual Copilot / Fusion 1.0** | Figma/design → production code with design-system mapping; Slack/Jira → PR agent | Requires a mature design system and Code Connect-style mapping to be good; enterprise-shaped; evaluation and learning curve cost; no prompt-completeness gate | Works with no design system at all; validates the instruction, not the design file | Design token fidelity and component reuse at scale |
| **Anima / Locofy / Uizard / Grida / Supernova / Clutch** | Design/screenshot/sketch → HTML/CSS/React/Flutter/RN | Anima output needs significant manual refinement; Uizard is prototype-grade; all require an input artefact (design, screenshot) rather than validating a verbal instruction | We validate the verbal instruction — the cheapest and most common input | The conversion itself and the visual fidelity |

**Assessment:** these are the **best partners and the worst competitors**, because they are the ones paying the regeneration bill. The commercial play is an integration, not a fight: a "Validate in Prompt Linter" chip next to the generate button. They will not build this themselves for the reason already stated — a generator cannot credibly audit its own input.

### 9.6 Category F — AI coding assistants

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **GitHub Copilot / Cursor / Claude Code / Codex / Windsurf** | Inline and agentic code generation inside the editor | Silently invent unspecified UI details; ask ad-hoc clarifying questions at best; no persistent rubric; no audit trail; context-window-limited; answers differ between tools | Deterministic, repeatable, auditable, tool-agnostic; produces a prompt that improves every assistant equally | They write and edit the code; we only improve the instruction |

**Assessment:** we should ship an **MCP server** so these agents can call `validate_ui_prompt` themselves. That converts the most likely "absorber" of our category into our distribution channel. This is the single highest-leverage integration available.

### 9.7 Category G — AI security and guardrails

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **Lakera Guard (now Check Point)** | Runtime API screening inputs/outputs for prompt injection and jailbreaks; 98%+ detection claimed, sub-50ms, 100+ languages | Runtime only; treats the prompt as an *attack surface*, not a *specification*; no completeness notion; no UI semantics | Authoring-time completeness gate; complementary stage | We have no injection classifier. Do not claim security coverage |
| **Prompt Security / Protect AI / Azure Prompt Shields** | Enterprise runtime defence, DLP, policy enforcement | Same as above; enterprise sales cycle; platform-shaped | Zero-friction, free to try, no procurement | Enterprise policy engine, DLP, compliance reporting |
| **Guardrails AI / NeMo Guardrails / Rebuff** | Output validation and rail definitions | Post-generation; validators are developer-authored; no UI requirement model | Pre-generation, domain-authored | Output-side safety |

**Assessment:** explicitly **not a competitor**. But note the adjacency: "prompt security" is a funded category in 2026, and there is a real risk a buyer hears "prompt linter" and assumes we are a weak security product. Messaging must pre-empt this: *we check completeness, not safety.*

### 9.8 Category H — Post-hoc UI quality tooling

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **ESLint / Stylelint / TypeScript** | Static analysis of code | Code must exist; catches syntax and pattern issues, not requirement gaps | Operates before code exists | Code correctness |
| **axe-core / Storybook a11y / Lighthouse** | Runtime accessibility and performance audits | Post-render; catches a11y defects but not "the button has no label because nobody specified one" | Catches the *cause* of many downstream a11y defects at authoring time | Actual WCAG conformance testing |
| **Chromatic / Percy / Playwright visual tests** | Visual regression across builds | Requires baseline + build; catches change, not omission; per-snapshot cost | Zero build, zero baseline, catches omission directly | Visual diffing |

**Assessment:** the strongest *complementary* story. A missing LABEL is simultaneously a completeness defect and an accessibility defect; catching it at authoring time is strictly cheaper than catching it in a visual regression suite.

### 9.9 Category I — Requirements and PRD tooling

| Player | How it works | Key limitations | How we overcome it | What we still do not fix |
|---|---|---|---|---|
| **Notion AI / ChatPRD / Jira Product Discovery** | Draft and structure product requirements as prose documents | Prose, not schema; no per-element attribute check; no scoring; slow for a one-line UI request; no code-level binding | Typed schema, instant, scored, machine-readable | Long-form narrative, stakeholder collaboration, roadmap linkage |

---

## 10. Consolidated capability matrix

Legend: **Yes** = native and central; **Partial** = possible but not the point; **No** = absent.

| Capability | Us | Prompt optimisers | Prompt linters | Prompt ops / spec | Prompt-to-UI / assistants | Guardrails | UI QA |
|---|---|---|---|---|---|---|---|
| Runs before generation | Yes | Yes | Yes | Yes | No | No | No |
| UI element schema (typed) | Yes | No | No | No | No | No | No |
| Attribute-to-element linking | Yes | No | No | No | Partial | No | No |
| Blocking clarification loop | Yes | No | No | Partial | Partial | No | No |
| Deterministic 0–100 risk score | Yes | No | Partial | No | No | Partial | No |
| Works fully offline / on-device | Yes | No | Partial | No | No | No | Yes |
| No API key required | Yes | No | Yes | No | No | No | Yes |
| Identical behaviour across surfaces | Yes | No | No | No | No | No | No |
| Machine-readable JSON output | Yes | Partial | Yes | Yes | Partial | Yes | Yes |
| Explainable, auditable findings | Yes | No | Yes | Partial | No | Partial | Partial |
| Reduces wasted generation spend | Yes | Partial | No | Partial | No | No | Partial |
| CI / agent integration | Partial | No | Yes | Yes | Yes | Yes | Yes |
| Production tracing and observability | No | No | No | Yes | Partial | Yes | Partial |
| Actual code generation | No | No | No | No | Yes | No | No |
| Design-system / token awareness | No | No | No | No | Yes | No | Partial |
| Injection / jailbreak detection | No | No | Partial | Partial | No | Yes | No |
| Real production-scale evaluation | No | Partial | No | Yes | Yes | Yes | Yes |

**How to read this table:** we win on the four rows nobody else has (schema, linking, blocking loop, cross-surface determinism). We lose on the three rows that are table stakes for scale (CI integration, observability, evaluation depth). The roadmap in §17 is ordered to close exactly those three.

---

## 11. Where competitors are genuinely better than us

This section exists because a market analysis that only lists competitor weaknesses is marketing, not analysis. Each row is a real reason a buyer might choose them.

| Competitor | What they do better | Consequence for us | Required response |
|---|---|---|---|
| **v0 / Lovable / Bolt / Figma Make** | They produce a working artefact in one click | A user who wants a button gets a button; we give them a report about the button | Never sell against them; sell *before* them |
| **cognitioncommons/prompt-linter** | Real injection and consistency rule coverage; CI-native; pip-installable; MIT | Security-conscious buyers get more from it than from us | Integrate or import its rule categories; do not claim security |
| **LangSmith / Braintrust / Langfuse** | Genuine production evaluation, datasets, regression suites | At scale, they answer "is it getting better?"; we answer "is this one prompt complete?" | Emit a compatible record; become an input to their evals |
| **Kiro / Spec Kit** | Full lifecycle from spec to tasks to code | They close the loop; we stop at the prompt | Ship Spec Kit export; be the front door |
| **Lakera / Prompt Security** | Enterprise-grade runtime defence, compliance artefacts, procurement readiness | They pass security review; we have a privacy policy and good intentions | Do not enter their lane; be explicit that we are not a security product |
| **axe-core / Chromatic** | Proven, standardised, trusted a11y and visual gates | They have a decade of trust and a WCAG mapping | Position as *upstream prevention*, not replacement |
| **Everyone** | Distribution, brand, funding, support, SLAs | A free GitHub Pages demo does not close an enterprise deal | Pick one wedge and win it before broadening |

**The uncomfortable summary:** we are better than the market at exactly one thing — turning an under-specified UI instruction into a resolved, scored, reusable specification — and worse than the market at everything adjacent. The strategy must be to make that one thing unavoidable rather than to broaden.

---

## 12. Differentiation, moat and positioning

### 12.1 The five differentiators

| # | Differentiator | Why it is hard to copy quickly | Evidence it is real |
|---|---|---|---|
| 1 | **Typed UI requirement schema** (10 elements × required attributes) | Requires domain modelling and agreement on what "complete" means per element; not a model capability | `data/schema.json`, `checker.py`, published element table |
| 2 | **Attribute-to-element linking** | Needs span-level alignment and clause scoping, not a prompt rewrite; 1.000 accuracy with gold tags proves the mechanism works | `linking.py`, `results/RESULTS.md` |
| 3 | **Blocking clarification, not advisory hints** | A generator cannot credibly block on its own input; a third-party checker can | `clarification.py`, 3 rounds × 6 questions |
| 4 | **One deterministic risk score across all engines** | Shared scoring is an architectural decision; retrofitting it into a model-centric product is awkward | `risk.py`, weights 0.40/0.20/0.20/0.20 |
| 5 | **Byte-identical behaviour across 5 surfaces** | Requires maintaining a JS port and a Python engine in lockstep — real engineering discipline, low glamour | `engine/src/` ↔ `ui/extension/engine.js` ↔ Android asset |

### 12.2 Moat durability assessment

| Moat candidate | Durability (1–5) | Reasoning |
|---|---|---|
| Schema and rubric | **3** | Copyable in a quarter by a funded team, but only if they think of it |
| Linking heuristic | **2** | Easily replicated; a dependency parser would beat it |
| Cross-surface parity | **3** | Operational discipline, not IP; but it buys trust |
| Distribution (live store listing, five surfaces) | **3** | Small but real; store review is a genuine barrier |
| Evaluation dataset and per-label error analysis | **4** | Slow to build honestly; a competitor cannot fake it |
| Brand as "the prompt checker for UI" | **2** today, **4** if we get there first | Category ownership is the only durable moat available |
| Model weights | **1** | Not an asset. Do not build the story on BERT |

**Conclusion:** the only durable moat is **category ownership plus a trustworthy evaluation record**. Everything else is a head start, not a wall. Budget accordingly: more on evidence and distribution, less on model training.

### 12.3 Positioning

**Positioning statement (internal):**
> For developers and designers who generate UI from text, UI Prompt Linter is the pre-flight checker that turns an under-specified instruction into a complete, scored, validated prompt. Unlike prompt optimisers, it checks against a UI requirement schema; unlike generators, it tells you what is missing before you spend anything.

**Tagline options, in order of preference:**

| Tagline | Why it works | Risk |
|---|---|---|
| **"Know what your prompt forgot."** | Concrete, memorable, describes the mechanism | Slightly negative framing |
| "Lint before you generate." | Instantly maps to a known practice (lint) | Collides with security linters verbally |
| "Stop paying to regenerate." | Speaks to the invoice | Only lands with people who pay |
| "From prompt to spec." | Elevates the output artefact | Sounds like a spec tool, confusing the category |
| "Prompt linting for UI." | Clear, literal, ownable | Unambitious; no emotional hook |

**Recommended:** use *"Know what your prompt forgot"* as the hero line and *"prompt linting for UI"* as the category descriptor underneath. The first creates curiosity, the second files the product in a mental drawer.

### 12.4 Message hierarchy (what to say, in what order)

| Order | Message | Proof point |
|---|---|---|
| 1 | Your prompt is missing things you cannot see | 4 missing attributes in "Add a red button" |
| 2 | We tell you exactly which, per element | Schema diff per element |
| 3 | We make you resolve them before generating | Blocking clarification |
| 4 | You get a score you can gate on | 0–100, four bands, initial vs final |
| 5 | It runs offline and asks for no permissions | MV3, zero permissions, no network |
| 6 | Same answer on web, extension, Android | Byte-identical `engine.js` |
| 7 | It is measured, including where it fails | Per-label results, 0.129 LOCATION F1 published |

Message 7 is unusual in marketing and is the single strongest trust signal available to us. Keep it.

---

## 13. Business model and pricing

### 13.1 Model comparison

| Model | Fit | Pros | Cons | Verdict |
|---|---|---|---|---|
| Open source + paid cloud | **Strong** | Trust, distribution, bottom-up growth | Monetisation leakage; support burden | **Recommended** |
| Pure SaaS per seat | Medium | Predictable revenue | Competes with free linters; buyers expect bundling | Secondary |
| API / usage-based | Medium-strong | Natural for CI and MCP | Latency-sensitive; needs hosted Rules | **Recommended later** |
| Per-org enterprise licence | Strong at scale | High ACV; gates are org-level | Long cycles; needs SOC 2, SSO, DPA | Year 2 |
| Marketplace (prompt templates) | Weak | Some traffic | Wrong product; content business | Avoid |

### 13.2 Recommended tiering

| Tier | Price | Includes | Target | Purpose |
|---|---|---|---|---|
| **Free (open source + hosted)** | USD 0 | Web app, extension, Android, full Rules engine, 3-round clarification, local history | Everyone | Distribution and trust |
| **Pro** | USD 8 / month | Cloud history sync, BERT engine in browser, LLM explanation with your key, export to Markdown/JSON, Spec Kit export | Individual developers/designers | Convert the habit |
| **Team** | USD 2,400 / year (up to 10 seats) | Shared rubric configuration (custom element schema, custom required attributes), org prompt library, risk thresholds and gates, audit log, CI action, SSO | Design-system and platform teams | **Core revenue** |
| **Enterprise** | Custom | Self-hosted Docker, on-prem model, DPA, SOC 2 roadmap, MCP server, SLA, custom element ontologies | Regulated and large orgs | Expansion |
| **API / MCP** | Per 1,000 validations | Hosted `validate_ui_prompt`, webhook results, LangSmith/Braintrust-compatible records | Agent and platform vendors | Ecosystem |

### 13.3 Unit economics (modelled)

| Line | Assumption | Value |
|---|---|---|
| Hosting cost per analysis (Rules, client-side) | Pyodide/WASM, no server | ≈ USD 0 |
| Hosting cost per analysis (BERT in browser) | ONNX, client-side, 67 MB model cached | ≈ USD 0 after first load |
| Hosting cost per analysis (LLM) | User-supplied key, or ours at ~1.5k tokens | USD 0 (BYO) to USD 0.002 |
| Gross margin (free/pro) | Near-zero marginal cost | **90–97%** |
| CAC (self-serve, store + content) | Modelled | USD 12–40 |
| CAC (team, outbound) | Modelled | USD 900–1,800 |
| Team payback | At USD 2,400 ACV | **6–12 months** |
| Churn risk (individual) | Utility tool, low switching cost | 4–7% monthly — the main model risk |

**The structural advantage:** because Rules run entirely client-side, our marginal cost is effectively zero for the majority of usage. That is why the free tier can be genuinely generous without burning cash — a rarity in AI tooling, and a real strategic asset against funded competitors paying per token.

### 13.4 The monetisation trap to avoid

| Trap | Why it is tempting | Why it kills the business |
|---|---|---|
| Charging for the core check | It is the value | Kills adoption; a competitor will free it |
| Charging per validation on the client-side path | Looks like SaaS | Users notice it costs us nothing; trust collapses |
| Gating offline mode | Enterprise story | Offline is the differentiator; gate the *schema*, not the engine |
| Making the LLM the paid feature | Easy to meter | It is the optional, unproven path, not the value |

**Charge for what is genuinely scarce:** shared schema configuration, audit history, team policy, CI enforcement, and support. Never charge for the deterministic check itself.

---

## 14. Go-to-market

### 14.1 The wedge sequence

| Stage | Motion | Asset | Why it works |
|---|---|---|---|
| 1 | Free extension + free web app | Live Edge listing, zero permissions | Zero trust cost; instant value; no procurement |
| 2 | Content: "the 10 UI elements and what they must specify" | Guidelines page, per-element pages | Ranks for a real query; establishes the rubric as *the* rubric |
| 3 | Integration: MCP server + GitHub Action | `validate_ui_prompt` tool, CI gate | Meets developers where they already are |
| 4 | Partnership: "Validate before generate" chips | v0/Figma/Bolt-adjacent placement, or a wrapper UI | Converts their regeneration spend into our funnel |
| 5 | Team tier: custom schema + gates | Rubric configuration, audit log | Monetises the org, not the individual |

### 14.2 Channel table

| Channel | Motion | Cost | Expected CAC | Priority |
|---|---|---|---|---|
| Browser extension store listing | Organic search in store | Very low | Very low | **1** |
| SEO on element-attribute pages | Content | Low-medium | Low | **1** |
| GitHub (open source, README, results) | Developer credibility | Low | Low | **2** |
| MCP server registry | Agent ecosystem distribution | Low | Low | **2** |
| Dev communities (Reddit r/PromptEngineering, HN, X) | Launch posts | Low | Low | **2** |
| YouTube / short-form demos of the 4-attribute reveal | Demo-led | Medium | Medium | **3** |
| Design-community content (Figma, Dribbble adjacent) | Designer-led | Medium | Medium | **3** |
| Outbound to design-system teams | Sales | High | High | **4** |
| Paid search on "prompt linter" | Ads | Medium | Medium | **5** — small volume |

### 14.3 The single best demo

Show the sentence **"Add a red button."** Show the four attributes it silently lacks. Ask the audience which one the generator guessed. Then show the blocking questions and the final score going from Critical to Low. It takes 40 seconds, it needs no setup, and it is impossible to unsee. Every piece of marketing should be a variation of it.

---

## 15. SWOT

| Strengths | Weaknesses |
|---|---|
| Deterministic, explainable, auditable core | Narrow scope: English, 10 element types, 1,180 records |
| Genuinely novel rubric in an empty position | No injection/security rules; weak flank vs prompt linters |
| Five surfaces with identical Rules behaviour | 30 hand-written prompts is a thin evidence base |
| Zero marginal cost; 90–97% gross margin | No revenue, no brand, no team, no support capacity |
| Privacy-first: offline, no permissions, no key | Risk score is an uncalibrated heuristic |
| Unusually honest evaluation record | BERT and LLM paths are unproven at scale |

| Opportunities | Threats |
|---|---|
| Ship an MCP server; become the pre-generation tool agents call | v0/Figma/Lovable ship native "clarify first" in 12–24 months |
| B2B "Validate before generate" integrations | LangSmith/Braintrust bundle prompt-quality checks |
| Team tier with custom element schemas and CI gates | Kiro/Spec Kit generalise to UI and absorb the use case |
| A11y-adjacent angle: missing LABEL is a WCAG defect | Prompt-security vendors get misread as overlapping us |
| Category ownership: define "UI prompt linting" publicly | Free open-source linter forks match and exceed our Rules coverage |
| Standardise the rubric into an open spec others adopt | Trust collapse in AI tooling reduces willingness to adopt *any* new checker |

**Strategic reading:** our strengths are *credibility* strengths; our weaknesses are *scale* weaknesses. The fastest correction is not more model training — it is an MCP integration plus 300 hand-written prompts. Both are cheap and both directly attack the two most dangerous threats.

---

## 16. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Trigger to act |
|---|---|---|---|---|---|
| 1 | A generator vendor ships native pre-generation clarification | High | High | Be the independent, model-agnostic checker; integrate before competing; own the rubric publicly | Any major vendor announces "clarify before generate" |
| 2 | Perceived as a feature, not a product | High | High | Attach to regeneration cost; ship team tier with policy and audit | Free users plateau below 2% conversion |
| 3 | Confused with prompt-security tools | Medium | Medium | Explicit messaging: completeness, not safety; separate landing copy | Buyers ask about injection defence |
| 4 | Accuracy claims fail in the wild | Medium | High | Publish per-split numbers; collect opt-in real prompts; never claim 0.97 general accuracy | Real-world disagreement rate > 15% |
| 5 | Thin evidence base (30 human prompts) | High | Medium | 300+ human prompts across 5 UI domains; publish per-domain results | Before any enterprise conversation |
| 6 | LLM path is unproven and could regress determinism | High | Medium | Keep LLM strictly optional; safety gate requiring more grounded spans than Rules; deterministic fallback | Any LLM-accepted result that is worse than Rules |
| 7 | Maintenance burden of 5 surfaces | Medium | Medium | Single generated Rules source; `tools/sync_docs.py` with CI `--check`; drop a surface if it cannibalises | Parity drift detected in CI |
| 8 | Reliance on one maintainer | High | High | Documented build/release; contribution guide; CI; funding | Bus factor raised in any due diligence |
| 9 | Individual churn on a utility tool | High | Medium | Team tier is the revenue base; embed into CI so removal is a decision, not a habit lapse | Monthly churn > 6% |
| 10 | Store policy change removes the extension | Low | High | Keep web app fully functional; ship a PWA; no policy-sensitive permissions | Any MV3 policy revision |
| 11 | Prompt injection via prompt content into our own LLM path | Medium | Medium | Verbatim-only grounding; JSON-only parsing; drop ungrounded values | Any accepted value not present verbatim in the prompt |
| 12 | Dataset licensing / provenance concerns | Low | High | Dataset is provided, not regenerated; document provenance; do not resell data | Any commercial licensing question |

---

## 17. Roadmap and KPIs

### 17.1 Three horizons

| Horizon | Timeframe | Initiative | Why it matters | Success metric |
|---|---|---|---|---|
| **H1 — Credibility** | 0–3 months | MCP server exposing `validate_ui_prompt` | Meets agents where they work; cheapest distribution in existence | 50+ MCP installs; 5 agent-tool listings |
| H1 | 0–3 months | Expand hand-written evaluation to 300 prompts across 5 domains | Removes the strongest objection | Per-domain F1 published; ≥0.87 handwritten entity F1 |
| H1 | 0–3 months | GitHub Action + JSON result schema | Makes us gateable in CI | 100+ repos using the action |
| **H2 — Category** | 3–9 months | Publish "UI Prompt Linting" as an open rubric spec + reference implementation | Category ownership is the only durable moat | 3 external adopters of the schema |
| H2 | 3–9 months | Team tier: custom element schema, risk thresholds, audit log, SSO | The actual revenue line | 30 paying teams |
| H2 | 3–9 months | Schema expansion: table, tabs, toast, tooltip, drawer, stepper | Removes the "10 types" objection | 16 element types |
| H2 | 3–9 months | Dependency-parse linking experiment, published head-to-head | Converts a heuristic into evidence | Linking F1 vs current, on handwritten |
| **H3 — Depth** | 9–18 months | Multilingual support (top 5 languages) | Unlocks non-English SAM | Non-English F1 ≥ 0.75 |
| H3 | 9–18 months | Calibrate the risk score against human judgements | Turns a heuristic into a defensible number | Rank correlation ≥ 0.7 vs human raters |
| H3 | 9–18 months | "Validate before generate" integrations with one generator vendor | Converts the biggest threat into a channel | 1 signed integration |
| H3 | 9–18 months | A11y mode: map missing attributes to WCAG criteria | Opens an adjacent budget | 1 enterprise a11y pilot |

### 17.2 KPI set

| Layer | Metric | Target (12 months) |
|---|---|---|
| Acquisition | Extension installs | 25,000 |
| Acquisition | Weekly active analyses | 4,000 |
| Activation | First analysis completed within 60s of install | ≥ 70% |
| Engagement | Analyses per active user per week | ≥ 3 |
| Value | Mean risk-score reduction per session | ≥ 25 points |
| Value | Clarification completion rate (loop finished, not abandoned) | ≥ 60% |
| Retention | Week-4 retention | ≥ 25% |
| Revenue | Paying individuals | 1,500 |
| Revenue | Paying teams | 30 |
| Revenue | ARR | USD 500k |
| Ecosystem | MCP/CI installs | 150 |
| Credibility | External citations of the rubric | 5 |

### 17.3 The one metric that matters

**Mean risk-score reduction per session.** If a user's prompt goes from 68 to 22 and they generate once instead of four times, the product worked and the ROI story writes itself. Every other metric is a proxy for this one.

---

## 18. Recommendations

### 18.1 Do these five things

| # | Recommendation | Rationale | Effort |
|---|---|---|---|
| 1 | **Lead with the cost of regeneration, not the quality of prompts** | Ambiguity is now metered; that is a budget conversation, not a style conversation | Low |
| 2 | **Ship the MCP server before any other integration** | Turns the most likely absorber (coding agents) into the cheapest distribution channel | Medium |
| 3 | **Triple the human evaluation set before any enterprise conversation** | 30 prompts is the first objection every serious buyer will raise | Medium |
| 4 | **Publish the rubric as an open spec** | The only durable moat is category ownership; an open spec is how you get it | Medium |
| 5 | **Keep the deterministic core free forever** | It costs us nothing, it is our only trust asset, and gating it invites a free fork | None |

### 18.2 Do not do these

| # | Anti-pattern | Why |
|---|---|---|
| 1 | Compete with v0/Lovable on generation | Unwinnable, and destroys the partnership path |
| 2 | Claim injection/security coverage | We have none; one failed security question destroys credibility |
| 3 | Market BERT as the differentiator | It loses to Rules on our own test set |
| 4 | Quote 0.97 accuracy without the handwritten caveat | A sceptical buyer will find 0.837 and stop trusting everything else |
| 5 | Build a marketplace of prompt templates | Wrong product; content business with no moat |
| 6 | Add surfaces before the extension retains users | Five half-used surfaces is worse than one habit |

### 18.3 The 90-day plan

| Week | Focus | Deliverable | Owner |
|---|---|---|---|
| 1–2 | Evidence | 300-prompt handwritten set, 5 domains, per-domain results | ML |
| 2–3 | Ecosystem | MCP server + tool schema + install docs | Eng |
| 3–4 | Credibility | Public "UI Prompt Linting" spec draft v0.1 | Product |
| 4–6 | Gating | GitHub Action, JSON schema, CI examples | Eng |
| 6–8 | Conversion | Pro tier: export, cloud history, BYO key | Eng |
| 8–10 | Distribution | Launch posts, 40-second demo video, element-attribute SEO pages | Growth |
| 10–12 | Revenue test | Team tier pilot with 5 design-system teams; pricing validation | Product |

### 18.4 Final assessment

The market does not need another prompt optimiser, another generator, or another observability platform. It does need a **trustworthy, independent way to know that a UI instruction is complete before money is spent on generating it** — and, crucially, one that a generator cannot credibly provide for itself.

We have that mechanism, working, on five surfaces, with an unusually honest evidence record. What we do not have is scale, breadth, or a category. Those are bought with distribution and public evidence, not with model training.

The window is 12–24 months. Spend it making "UI prompt linting" a phrase other people use, not a phrase we invented alone.

---

## Appendix A — measured results

### A.1 Auto routing behaviour

| Split | Prompts | Rules | BERT | LLM fallback |
|---|---|---|---|---|
| dev | 150 | 148 | 2 | 0 |
| test | 200 | 197 | 3 | 0 |
| handwritten_test | 30 | 27 | 3 | 0 |

### A.2 Dataset composition

| Split | Prompts | Purpose |
|---|---|---|
| `train.jsonl` | 800 | Training and rule tuning |
| `dev.jsonl` | 150 | Development / checkpoint selection |
| `test.jsonl` | 200 | Final reporting only (unseen vocabulary) |
| `handwritten_test.jsonl` | 30 | Natural prompts, final reporting |
| **Total** | **1,180** | All tokenisations verified by test |

### A.3 Element schema (required attributes)

| Element | Required attributes |
|---|---|
| button | LABEL, ACTION, COLOR, LOCATION |
| navbar | COLOR, LOCATION, LABEL |
| input | LABEL, LOCATION |
| card | COLOR, LOCATION, LABEL |
| modal | ACTION, LABEL, COLOR |
| image | LOCATION, LABEL |
| dropdown | LABEL, LOCATION, ACTION |
| sidebar | LOCATION, COLOR, LABEL |
| footer | COLOR, LABEL |
| checkbox | LABEL, LOCATION |

### A.4 Reproducibility commands

| Purpose | Command |
|---|---|
| Run app | `streamlit run app.py` |
| CLI | `python engine/cli/cli.py "Add a button." --backend auto --no-llm --json` |
| Train BERT | `python engine/eval/train_bert.py --model distilbert-base-uncased --epochs 5` |
| Evaluate | `python engine/eval/evaluate.py --backend auto --split all` |
| Sync browser mirrors | `python tools/sync_docs.py` |
| Export ONNX | `python tools/export_onnx.py --model models/bert_tagger --out models/bert_tagger_onnx` |
| Tests | `pytest -q` |

---

## Appendix B — sources

### B.1 Primary (this repository, verified)

| Source | Used for |
|---|---|
| `README.md` | Product definition, platforms, pipeline, limitations |
| `results/RESULTS.md`, `results/metrics_*.json` | All accuracy figures |
| `data/schema.json` | Element schema, 11 BIO tags |
| `engine/src/*.py` | Pipeline stages, router, risk weights, clarification bounds |
| `ui/extension/manifest.json` | Zero-permission MV3 claim |
| `ui/android/README.md` | minSdk 24, parity notes |
| `BUILD_SPEC.md` | Build and deployment constraints |

### B.2 Secondary (public market research, November 2026)

| # | Source | Used for |
|---|---|---|
| 1 | Mordor Intelligence, *AI Code Tools Market Size, Share and 2032 Growth Trends* (Oct 2026) | USD 9.35B (2026) → 38.59B (2032) |
| 2 | Research and Markets, *AI Code Tools Market Report 2026* | USD 9.46B (2026) → 22.2B (2030), 23.8% CAGR |
| 3 | Global Market Insights, *AI Code Tools Market 2026–2035* | USD 9.50B (2026), 23.24% CAGR |
| 4 | Precedence Research, *Prompt Engineering Market 2026–2035* | USD 671.38M → 7,884.41M |
| 5 | Stack Overflow, *2025 Developer Survey — AI* | 84% adoption; 46% distrust; 33% trust; 3% high trust |
| 6 | Google Cloud / DORA, *State of AI-assisted Software Development 2025* | ~5,000 respondents; AI as amplifier; ~90% daily use |
| 7 | AIMultiple, *Best Design to Code Tools Compared* (Nov 2026) | 13-tool benchmark; v0 3.5M users; Figma MCP; Anima/Uizard positioning |
| 8 | Vercel, *Updated v0 pricing*; *v0 FAQs* | Token metering; React/Next/Tailwind/shadcn output |
| 9 | Lovable docs and changelog | Plan Mode (Feb 2026); credit pricing; cloud |
| 10 | Bolt / StackBlitz release notes | WebContainers; SOC 2 Type II; framework breadth |
| 11 | Figma developer docs; GitHub changelog (Mar 2026) | Bidirectional MCP; Code Connect; Copilot integration |
| 12 | `cognitioncommons/prompt-linter` (GitHub, MIT) | Closest linter analogue: 15 rules across clarity, injection, consistency |
| 13 | `hermes-labs-ai/lintlang` | Static analysis and prompt-lint gates for agent configs |
| 14 | Chrome Web Store, *Prompt Linter* | Generic in-page prompt linting |
| 15 | martinfowler.com, *Understanding Spec-Driven Development: Kiro, spec-kit* | SDD definition and tooling |
| 16 | GitHub Blog, *Spec-driven development with AI* | Spec Kit mechanics |
| 17 | Lakera / Check Point AI Guardrails; Prompt Security | Runtime guardrail positioning, detection claims |
| 18 | tianpan.co, *Prompt Linting: The Pre-Deployment Gate* | CI prompt-lint practice |
| 19 | Gartner AI spending commentary (via 2026 secondary summaries) | USD 2.52T worldwide AI spend 2026 |

### B.3 Method notes and caveats

| Caveat | Detail |
|---|---|
| Market size dispersion | Analyst firms differ by up to 3× on AI code tooling (USD 7.9B–10.1B for 2026). Ranges are given rather than a single point |
| Modelled figures | TAM layer share, SAM, SOM, CAC, and churn are our assumptions, labelled as such throughout |
| Competitor capability claims | Based on public documentation and benchmarks as of November 2026; competitors ship quickly and these will age |
| Accuracy claims | All figures come from the repository's own evaluation scripts on its own dataset; they are not third-party verified |
| No primary interviews | This analysis contains no buyer interviews. A real diligence process would require 15–20 of them before any pricing decision |

---

## Appendix C — glossary

| Term | Meaning |
|---|---|
| Attribute | A required property of a UI element: LABEL, ACTION, COLOR, LOCATION |
| Auto router | Heuristic that chooses Rules, BERT, or LLM from prompt features alone |
| BIO tagging | Sequence labelling scheme: Begin, Inside, Outside |
| Completeness | Share of required attributes actually present |
| Element | One of 10 supported UI components (button, navbar, input, card, modal, image, dropdown, sidebar, footer, checkbox) |
| Grounded extraction | LLM output accepted only if values are copied verbatim from the prompt |
| Landmark guard | Rule preventing a noun after a relational preposition ("above the footer") from being detected as an element |
| Prompt linting | Static analysis of a prompt for defects before it is used |
| Risk score | Deterministic 0–100 value from completeness, vagueness, detection quality, and unresolved items |
| Span | A contiguous token range carrying a label |
| Vague value | A phrase that occupies an attribute slot without resolving it ("some nice colour") |
| Validated prompt | The synthesised, complete instruction emitted after clarification |

---

*Prepared for internal strategic use. All accuracy figures are self-reported from the project's own evaluation harness; all market figures are third-party estimates with the dispersion noted in Appendix B.3.*
