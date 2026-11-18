# Vector - Android app

Native Jetpack Compose client for the Vector workspace. It shares the web
app's branding, logo, engine and Rules/BERT/API analysis, but is deliberately
focused on the mobile workflow: **capture → review → approve → share**.

The full authoring surface stays on the web (`ui/web-app/`): bulk document
work, the interactive requirement graph, design-token editing and the embedded
builder. The Android app carries the parts that work well on a phone.

## What is included

| Screen | Purpose |
|---|---|
| Overview | Project-scoped dashboard, risk distribution, review-queue snapshot, recent analyses |
| Analyze | Prompt review, clarification loop, risk summary, validated prompt, copy/share |
| Review | Requirement inbox (PDF/DOCX/TXT/MD), approve/reject, suggestions, acceptance criteria, findings |
| Prompt Studio | Six-section brief from approved requirements, coverage, saved versions, copy/share |
| Projects | Create/switch/edit/delete local project workspaces |
| History | Search, risk filter, sort, reopen saved results, delete |
| More | Projects, Prompt Studio, History, Help, Guidelines, About, Settings, JSON export |
| Help & Manual | Searchable workflow guide and troubleshooting |
| Guide | Elements, attributes and risk bands |
| About | Product overview and responsible use |
| Settings | Theme, engine/router configuration, AI endpoint, local data |

Every analysis, requirement, review decision and brief is scoped to a project.
Projects, drafts and review artefacts are stored locally; there is no account
requirement.

Branding uses the same teal/mustard palette and the dark-green "V" monogram
(`ui/components/VectorLogo.kt`) as `ui/web-app/src/components/ui/Logo.tsx`.

## Requirement workflow

1. Create or select a project in **More → Projects**.
2. Import a PDF, DOCX, TXT or Markdown document in **Review**. Parsing happens
   on-device with PDFBox-Android and a small DOCX extractor.
3. Approve the statements you trust; reject the rest. Generated suggestions
   point at vague wording, missing states and undefined roles.
4. Review the Given/When/Then acceptance criteria and intelligence findings.
5. Open **Prompt Studio**, pick a design-system preset, generate the brief and
   save a version before sharing it with a UI generator.

The mobile brief never includes unreviewed requirements: only approved
requirements and approved criteria are rendered into the specification.

## Saved analyses

`HistoryRepository` now stores the full analysis payload alongside the summary.
Opening a history record restores that saved result instead of silently
re-running the engine. Records created before this change are re-run once and
then saved with a payload.

## Engine parity

- `app/src/main/assets/engine.js` is an exact copy of `ui/extension/engine.js`
  (the JavaScript port of the Python Rules backend in `engine/src/`).
- `data/engine/JsEngine.kt` loads it in an off-screen `WebView` and calls
  `VectorEngine.analyze(text, answers, finalize)`.
- Analysis, clarification, scoring and the final prompt therefore match the
  Rules behaviour of the website and extension.
- **BERT** loads the fine-tuned DistilBERT model from GitHub Pages once and runs
  through Transformers.js/ONNX in the WebView.
- **API** calls an OpenAI-compatible endpoint (Groq by default) with the key
  stored in Settings. The APK can also pre-fill the key at build time with
  `VECTOR_TEST_API_KEY`.
- All three engines share the same checker, clarification loop and risk score.

## Build

Open this `ui/android/` folder in Android Studio, or from the command line:

```powershell
gradle assembleDebug
```

Requirements: JDK 17+, Android SDK 36, Gradle 9.3.1 (AGP 9.1.1).

## Install on a connected phone

```powershell
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
