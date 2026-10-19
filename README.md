# Vector

Vector looks at a natural-language AWS infrastructure prompt before any code is
generated, points out the security controls the prompt left out, and turns each
one into a clause you can add with a single click.

The core analysis is rule-based NLP with no trained model and no network calls,
so it runs offline. An optional AI deep scan can catch paraphrased controls the
rules miss.

## How the analysis works

```
prompt
  -> normalise and tokenise
  -> synonym expansion        ("website" -> ec2 / load balancer)
  -> resource detection       (78 AWS resources and aliases)
  -> requirement detection    (30 controls, regex + paraphrase + negation guard)
  -> omissions                (controls needed MINUS controls stated)
  -> risky statements         (0.0.0.0/0, public buckets, wildcard IAM, ...)
  -> risk score, confidence, and fillable clauses
```

The engine is deterministic and explainable. There are no weights or model
files; the knowledge lives in the curated taxonomy at `engine/src/taxonomy.js`.
A light stemmer plus an order-tolerant fallback handles morphological variants.

## Clients

Every client calls the same engine, so results are identical everywhere.

| Client | Path | Stack |
|---|---|---|
| Chrome / Edge extension | `ui/extension/` | Manifest V3 (popup, in-page panel, options) |
| Web demo | `ui/web/` | static HTML/JS (GitHub Pages) |
| Web app | `ui/web-app/` | React + Vite + Tailwind |
| Mobile (iOS + Android) | `ui/mobile-expo/` | React Native / Expo |
| Mobile (Android) | `ui/mobile-native/` | Capacitor (wraps the web client) |
| Native Android | `ui/android/` | Kotlin + Jetpack Compose |

## Install the extension

1. `npm run package` (builds `dist/vector-extension.zip` and the loadable `dist/vector/`).
2. Open `edge://extensions` (or `chrome://extensions`) and enable **Developer mode**.
3. Choose **Load unpacked** and select **`dist/vector`**.
4. Use the toolbar popup, or the floating V button on `chatgpt.com`, `claude.ai`
   and `gemini.google.com`. Right-click the toolbar icon -> **Options** for
   settings, policy and history.

## Run the web app

```powershell
npm run webapp:install    # first time only
npm run webapp            # -> http://localhost:3000
```

## Build the native Android app

```powershell
cd ui/android
./gradlew assembleDebug   # needs the Android SDK + JDK 17
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## CLI

```powershell
node engine/cli/vector-cli.js analyze "Create an S3 bucket and an EC2 instance"
node engine/cli/vector-cli.js improved "Create an S3 bucket"
node engine/cli/vector-cli.js hook "Deploy an S3 bucket open to the public"   # exit 2 or 1
node engine/cli/vector-cli.js verify "engine/eval/downstream/insecure.tf"
node engine/cli/vector-cli.js analyze --policy docs/examples/policy-cis.json "Deploy in us-east-1"
```

## Deep scan (optional AI)

Two tiers are tried in order:

1. On-device: Chrome's built-in model via the browser Prompt API. No API key and
   no network, used automatically when available.
2. Hosted: an OpenAI-compatible endpoint, configured with a key in Settings.

Only controls the rules may have missed are requested, and each finding is
labelled as AI or rule. If neither tier is available the extension still works
on rules alone.

Because the in-page demo is limited by CORS, only providers that send CORS
headers can be called from a web page (Gemini does). Use the extension or the
mobile app for the rest.

## Confidence and coverage

Every analysis returns a rule-engine confidence from 0 to 100 (high at 75 and
above, medium from 45 to 74, low below 50). Coverage is
`mentioned / (mentioned + missing)`, shown as a percentage and updated live as
you accept clauses. With auto deep scan enabled, a deep scan runs when
confidence is low or coverage is under 50%.

## Evaluation

```powershell
npm run eval           # precision / recall / F1 over labelled prompts
npm run eval:controls  # the same, broken down per security control
npm test               # unit tests
npm run probe          # paraphrase/morphology recall probe
npm run downstream     # insecure vs hardened Terraform demo
npm run verify:all     # tests + eval + per-control + probe + package
```

The three original labelled sets are small and were tuned after seeing failures,
so their scores are optimistic. `heldout2.json` is a **100-case suite labelled
independently of the rules and not used for tuning**; it is the honest number:

| Set | Missing-constraint F1 | Risky F1 | Negation failures |
|---|---|---|---|
| dataset.json (39) + dataset2.json (59) + heldout.json (14) | 1.000 | 1.000 | 0 |
| **heldout2.json (100, held out)** | **0.941** (P 93.6 / R 94.6) | **0.821** (P 94.1 / R 72.7) | 1 |

Weakest controls on the held-out suite: `network_isolation` (recall 66.7%) and
`monitoring_alerting` (77.8%); `no_wildcard_policy` and `network_restricted`
have lower precision because of negation phrasing ("without public access",
"do not have wildcard permissions"). The paraphrase probe is stricter still
(arbitrary wording): tuned sets ~100%, never-tuned held-out set 58%.

**Inter-annotator agreement:** `engine/eval/labels/heldout2-annotator-a.json`
holds the first annotation; a second human should fill
`heldout2-annotator-b.TEMPLATE.json`, then run
`npm run kappa -- engine/eval/labels/heldout2-annotator-a.json engine/eval/labels/heldout2-annotator-b.json`.
The current labels were produced by the author with AI assistance, so they
should be reviewed before being quoted as a benchmark.

## One-tap harden

`VectorAnalyzer.harden(prompt)` returns a prompt that re-analyses to risk 0 and
100% coverage: risky phrases are neutralised (for example `0.0.0.0/0` becomes
"a restricted trusted CIDR range") and missing-control clauses are appended,
re-checked until nothing new appears.

## Brand

The logo is a dark-green tile (`#2D5D4F`) with a gold V (`#FACB43`). All icons,
launchers and splash screens are generated by `tools/make-icons.js`
(`npm run icons`).

## Repository layout

```
ui/extension/          Chrome/Edge MV3 popup, content script, options
ui/web/                static browser demo
ui/web-app/            React + Vite web app
ui/mobile-expo/        Expo (React Native) app
ui/mobile-native/      Capacitor Android app
ui/android/            native Kotlin + Jetpack Compose app
engine/src/taxonomy.js resources, controls, risky patterns, synonyms
engine/src/analyzer.js rule engine (negation guard, stemming fallback, scoring)
engine/src/semantic.js TF-IDF relevance ranking (informational only)
engine/src/llm.js      optional deep scan (on-device and hosted)
engine/src/settings.js storage helpers shared by the clients
engine/cli/            CLI, CI hook, and post-generation verify
engine/eval/           labelled sets, metrics, paraphrase probe, downstream demo
engine/test/           unit tests
tools/                 icon generation, packaging, engine sync, doc build
docs/                  Word deliverables + `_sources/` markdown
```

## Credits

See `CREDITS.md` (the React web app and native Android client are contributed UI,
adapted to run on the shared engine).

## Version

0.8.0

## Grounding

CIS AWS Foundations Benchmark, AWS Well-Architected (Security), AWS Foundational
Security Best Practices, NIST SP 800-53 Rev.5, GDPR Art. 5/32, and India DPDP
Act 2023.
