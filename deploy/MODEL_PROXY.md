# Commercial model deployment

Vector has two model modes:

| Mode | Best for | Key location | Offline |
|---|---|---|---|
| **BYO key** | local development, demos, single-user | browser localStorage | no |
| **Serverless proxy** | commercial deployment | server environment | no |

The wireframe is still drawn by the deterministic compiler. The model only
proposes the schema; it never emits HTML, CSS or pixels.

## Proxy setup

1. Deploy `api/chat/completions.ts` on Vercel (or port the same handler to
   Netlify Functions / Cloudflare Workers).
2. Set the server environment variables:

```text
MODEL_BASE_URL=https://api.openai.com/v1      # or Groq/OpenRouter/Anthropic gateway
MODEL_API_KEY=...                             # NEVER expose this to the browser
MODEL_NAME=gpt-4.1-mini                       # or a stronger model
ALLOWED_ORIGIN=https://app.example.com        # only if the app is on another origin
```

3. Build the web app with:

```text
VITE_VECTOR_PROXY_URL=https://your-proxy.example.com/api
VITE_VECTOR_MODEL=gpt-4.1-mini
```

`chatJson` appends `/chat/completions`, so the final URL is
`https://your-proxy.example.com/api/chat/completions`.

The browser sends a placeholder key (`server-proxy`); the proxy ignores it and
uses `MODEL_API_KEY`.

## Model choice

The parser needs **structured extraction**, not conversation. Recommended:

- `gpt-4.1-mini` — good quality/cost for schema extraction.
- `gpt-4.1` / `claude-sonnet` — best on messy or highly visual prompts.
- `openai/gpt-oss-120b` on Groq — fast and inexpensive.
- A fine-tuned small model — if you later collect enough prompt → schema data.

Use temperature `0`, JSON mode, and a strict system schema (already in
`src/services/semanticParser.ts`).

## Why not retrain a foundation model

A hosted strong model already generalises over open vocabulary. Retraining is
only justified once you have a labelled corpus of prompts and correct schemas;
then fine-tune a small model and point `MODEL_NAME`/`MODEL_BASE_URL` at it. The
proxy and schema stay the same.

## Production checklist

- Authenticate proxy calls (Supabase JWT or session cookie).
- Rate limit per workspace; cap max tokens.
- Do not log prompt text; keep metadata only.
- Publish privacy terms: the prompt is sent to the provider only when the user
  clicks **AI parse**.
- Monitor cost and latency; cache parse results by prompt hash if needed.
- Keep the deterministic fallback: if the model fails or returns invalid JSON,
  the wireframe still renders from the local compiler.
- Keep the learned lexicon and clarification loop; they handle workspace words
  without another model call.
