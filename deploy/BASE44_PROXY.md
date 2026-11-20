# Base44 proxy

> **Current app behaviour:** the Build workspace embeds `https://app.base44.com`
> in an iframe and offers **Copy prompt for Base44**. No API token or proxy is
> used by the UI today. This document is kept for the optional server-side
> generation path in `api/base44/apps.ts`.

Vector can create a Base44 app directly from the active UI prompt. The browser
must not hold a workspace token in production, so use the server proxy in
`api/base44/apps.ts`.

## Environment

Set these on Vercel/Netlify/Cloudflare:

| Variable | Required | Purpose |
|---|---|---|
| `BASE44_API_TOKEN` | yes | Base44 workspace API token with app-create permission |
| `BASE44_ORGANIZATION_ID` | no | Workspace/organization id when the token can access several |
| `ALLOWED_ORIGIN` | recommended | Restrict browser CORS to the Vector deployment |

The function accepts:

- `POST /api/base44/apps` with `{ initial_message: { content }, name, prevent_iframe_embedding }`
- `GET /api/base44/apps?id=<appId>` for build status

## Connect the app

In a project, open **Generate with Base44 → Connect Base44** and enter the proxy
URL, for example:

```
https://your-vector.vercel.app/api/base44/apps
```

Leave the workspace token blank when the proxy has `BASE44_API_TOKEN`; the proxy
adds it server-side.

## Local development

For a quick local test, enter a Base44 workspace token in the Connect dialog.
It is stored only in that browser. Direct browser calls may be blocked by CORS;
the proxy is the supported production path.

## Behaviour

1. Drag a prompt version from the project folder onto the Base44 panel.
2. Generate calls the proxy, which creates the app with that prompt.
3. Vector polls the app status and stores the app id, status and screenshots in
   `builder/base44.json` inside the project.
4. No copy/paste is required.

Base44 limits app creation to **5 requests/minute** and builds consume credits.
