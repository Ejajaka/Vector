# Free domain: `vector.is-a.dev`

`is-a.dev` hands out free `*.is-a.dev` subdomains to developers. You never see
`vercel.app`, `github.io` or `netlify.app` in the URL — it is just
`vector.is-a.dev`.

## One-time setup (about 10 minutes, then a wait for review)

1. **Fork** <https://github.com/is-a-dev/register>.
2. Copy `deploy/is-a.dev/vector.json` from this repo into the fork's
   `domains/` folder.
3. Replace `REPLACE_WITH_YOUR_EMAIL@example.com` with an email you actually read.
   Keep `username` as `Ejajaka` — it must match your GitHub account.
4. Commit, open a **Pull Request** titled `Add vector.is-a.dev`.
5. A bot (and a maintainer) validates the JSON and your DNS target. Merges are
   usually within 1–3 days.

No payment, no card, no registrar.

## DNS target

The record above points at GitHub Pages (`ejajaka.github.io`), because the
current build publishes to Pages from `docs/`.

Change it depending on where you host:

| Host | `records` value |
|---|---|
| GitHub Pages | `"CNAME": "ejajaka.github.io"` |
| Netlify | `"CNAME": "<site-name>.netlify.app"` |
| Vercel | `"A": "76.76.21.21"` (or the CNAME Vercel gives you) |
| Cloudflare Pages | `"CNAME": "<project>.pages.dev"` |

Do **not** put more than one CNAME in the file — `is-a.dev` rejects it.

## After the merge

1. Add the custom domain in your host's dashboard (Pages → Custom domain,
   Vercel → Domains, Netlify → Domain management).
2. Wait for the TLS certificate (usually under an hour).
3. Set `VITE_PUBLIC_URL=https://vector.is-a.dev` in the build environment so
   share links and OAuth redirects point at the right origin.

## Name availability

`vector` may already be taken — common words usually are. If the PR is rejected,
try these in order and update `vector.json`:

```
vectorui.is-a.dev
vectorprompt.is-a.dev
getvector.is-a.dev
vectorlabs.is-a.dev
```

Check first with:

```bash
curl -s https://raw.githubusercontent.com/is-a-dev/register/main/domains/vector.json | head
```

A `404` means the name is free.

## Honest caveat about "free"

`is-a.dev` is run for developer projects. The rules do not promise commercial
rights, the subdomain is revocable, and once you start taking Razorpay payments
you are commercially active. That is fine for now — but before real revenue,
buy a proper domain (~₹900/year for a `.app` or `.dev`) and keep
`vector.is-a.dev` as a redirect. Losing your primary domain because a volunteer
maintainer changed policy is a bad month.

Recommended paid upgrades when ready: `vectorui.app`, `getvector.dev`,
`vectorstudio.in` (GST-friendly, local trust).
