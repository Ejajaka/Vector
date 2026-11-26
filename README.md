# Vector

**Live:** <https://www.vectorco.in>

Vector is a review layer for AI-generated UI. It turns a rough product sentence or a
requirements document into traceable requirements, ambiguity/conflict findings,
acceptance criteria and a build-ready prompt — then lets you compose the screen on a
canvas or in prompt mode. The prompt rebuilds itself as the canvas changes.

## Repository layout

| Path | Purpose |
|---|---|
| `ui/web-app/` | React + Vite application served by Vercel |
| `api/` | Vercel serverless endpoints (Base44 proxy, chat completions) |
| `docs/models/` | BERT tagger + Whisper model files copied into the build (`prebuild`) |
| `supabase/` | Database migrations and edge function source |
| `desktop/` | Windows desktop shell (Electron) that bundles the web build |
| `engine/`, `data/` | Python NLP research engine and its datasets (not required to run the site) |
| `deploy/` | Deployment notes for the Base44 proxy and model proxy |

## Run the site locally

```bash
cd ui/web-app
npm ci
npm run dev        # http://localhost:3000
```

`npm run build` produces `ui/web-app/dist`. The `prebuild` step copies the ONNX
models from `docs/models/` into `public/models/`; keep that folder in the checkout.

## Deploy

Vercel builds `ui/web-app` with the command in `vercel.json`
(`cd ui/web-app && npm ci && npm run build`) and serves `ui/web-app/dist`.
Production is the `main` branch of `Ejajaka/Vector`.

## Windows app

```bash
cd desktop
npm ci
npm run dist       # -> desktop/release/Vector-Setup-<version>.exe
```

The installer bundles the current `ui/web-app/dist`; rebuild the web app first when
shipping UI changes.

## Tests

```bash
cd ui/web-app
npm run lint
npm test
```
