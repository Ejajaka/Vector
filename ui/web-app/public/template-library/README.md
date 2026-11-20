# Vector template and asset library

A local, license-safe starting pack for the template gallery and project canvas.

## Open the catalog

With the web app running:

```
http://localhost:3000/template-library/
```

Or open `public/template-library/index.html` directly.

## What is included

| Folder | Contents | License |
| --- | --- | --- |
| `links.md` | 56 curated Figma Community links across dashboards, landing pages, commerce, auth, data tables, collaboration, mobile, portfolio and components. | Links only. Each file has its own license. |
| `blocks/` | 17 original, self-contained UI screens: dashboard, analytics, projects, requirements, review, prompt studio, settings, billing, auth, landing, commerce, chat, onboarding, empty state, 404 and mobile. | Original Vector work. |
| `images/` | 24 placeholder images from Lorem Picsum. | Unsplash License via Lorem Picsum. |
| `illustrations/` | 12 unDraw illustrations. | unDraw License. |
| `icons/` | 217 SVG icons across Lucide (ISC), Tabler (MIT) and Heroicons (MIT). | ISC / MIT. |
| `fonts/` | Inter and JetBrains Mono WOFF2 files plus the generated `fonts.css`. | SIL Open Font License 1.1. |
| `manifest.json` | Machine-readable index used by the catalog page and the app. | Metadata. |

## Important

- **No Figma files are copied or redistributed.** The pack stores source links so the
  original file, author and license stay intact.
- **Check each Figma file's license before commercial use.** Some Community files are
  free, some require attribution, and some have restrictions. The catalog labels them
  as references, not as bundled templates.
- **Images are placeholders.** Use your own product screenshots or licensed art for
  production.
- **Fonts are OFL.** Keep the license links in `LICENSES.md` with the files.

## Building the pack again

The downloader is at `tools/fetch_template_library.py`:

```
python tools/fetch_template_library.py
```

It downloads only the image, icon and font assets from their public sources. Edit the
`FIGMA` list in that script to add or remove links.

## Using the assets in the app

- Add real template previews under `public/templates/<slug>/preview.png`.
- Add the matching block map under `public/templates/<slug>/template.json`.
- The gallery can then show the real thumbnail and the canvas can instantiate the
  actual blocks instead of the generated wireframe.

The current app templates are still generated. Real Figma/PPTX blocks require the
source files or a Figma token and frame export.
