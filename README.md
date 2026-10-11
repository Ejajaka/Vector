# Vector

Vector looks at a natural-language AWS infrastructure prompt before any code is generated, points out the security controls the prompt left out, and turns each one into a clause you can add with a single click.

It ships as a Chrome extension (Manifest V3) and a CLI. The core analysis is rule-based NLP with no trained model and no network calls, so it runs offline. An optional AI deep scan can catch paraphrased controls the rules miss.

## How the analysis works

```
prompt
  -> normalise and tokenise
  -> synonym expansion        ("website" -> ec2 / load balancer)
  -> resource detection       (78 AWS resources and aliases)
  -> requirement detection    (30 controls, regex with a negation guard)
  -> omissions                (controls needed MINUS controls stated)
  -> risky statements         (0.0.0.0/0, public buckets, wildcard IAM, ...)
  -> risk score, confidence, and fillable clauses
```

The engine is deterministic and explainable. There are no weights or model files; the knowledge lives in the curated taxonomy at `engine/src/taxonomy.js`.

## Install the extension

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select the repo folder.
3. Use the toolbar popup, or the floating V button on `chatgpt.com`, `claude.ai`, and `gemini.google.com`. Right-click the toolbar icon and choose **Options** for settings, policy, and history.

Run `npm run package` to build `dist/vector-extension.zip` for distribution.

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

1. On-device: Chrome's built-in model via the browser Prompt API. No API key and no network, used automatically when available.
2. Hosted: an OpenAI-compatible endpoint, configured with a key in Settings.

Only controls the rules may have missed are requested, and each finding is labelled as AI or rule. If neither tier is available the extension still works on rules alone.

Because the in-page demo is limited by CORS, only providers that send CORS headers can be called from a web page (Gemini does). Use the extension or the mobile app for the rest.

## Confidence and coverage

Every analysis returns a rule-engine confidence from 0 to 100 (high at 75 and above, medium from 45 to 74, low below 50). Coverage is `mentioned / (mentioned + missing)`, shown as a percentage and updated live as you accept clauses. With auto deep scan enabled, a deep scan runs when confidence is low or coverage is under 50%.

## Evaluation

```powershell
npm run eval        # precision / recall / F1 over labelled prompts
npm test            # unit tests
npm run downstream  # insecure vs hardened Terraform demo
```

The labelled sets are small and were tuned after seeing failures, so treat the reported scores as indicative rather than a benchmark.

## One-tap harden

`VectorAnalyzer.harden(prompt)` returns a prompt that re-analyses to risk 0 and 100% coverage: risky phrases are neutralised (for example `0.0.0.0/0` becomes "a restricted trusted CIDR range") and missing-control clauses are appended, re-checked until nothing new appears.

## Repository layout

```
ui/extension/          Chrome MV3 popup, content script, options
engine/src/taxonomy.js resources, controls, risky patterns, synonyms
engine/src/analyzer.js rule engine (negation guard, scoring, merge)
engine/src/semantic.js TF-IDF relevance ranking (informational only)
engine/src/llm.js      optional deep scan (on-device and hosted)
engine/src/settings.js chrome.storage helpers
engine/cli/            CLI, CI hook, and post-generation verify
engine/eval/           labelled sets, metrics, downstream demo
engine/test/           unit tests
ui/web/                browser demo
ui/mobile-expo/        Expo mobile app
ui/mobile-native/      Capacitor Android app
tools/                 icon generation and packaging
docs/                  architecture, roadmap, manual, and report sources
```

The `docs/_sources` folder holds the markdown behind the Word documents in `docs/`. `MANUAL.md` there walks through rebuilding the whole project from a clean machine.

## Grounding

CIS AWS Foundations Benchmark, AWS Well-Architected (Security), AWS Foundational Security Best Practices, NIST SP 800-53 Rev.5, GDPR Art. 5/32, and India DPDP Act 2023.
