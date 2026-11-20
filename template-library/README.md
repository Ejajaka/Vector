# Vector template and asset library

A local, license-safe starting pack for the template gallery and project canvas.

## Open the catalog

From the repository root:

```
python -m http.server 8094
```

Open http://localhost:8094/template-library/index.html

The library is standalone and is not linked from the app UI.

## What is included

| Folder | Contents | License |
| --- | --- | --- |
| `links.md` | 16 focused Figma Community references for the app template categories. | Links only. Each file has its own license. |
| `blocks/` | 17 original, self-contained UI screens: dashboard, analytics, projects, requirements, review, prompt studio, settings, billing, auth, landing, commerce, chat, onboarding, empty state, 404 and mobile. | Original Vector work. |
| `icons/` | 85 Lucide SVG icons used by the product UI. | ISC. |
| `_archive/` | Extra images, illustrations and duplicate icon sets kept for reference only. | Mixed; see LICENSES. |
| `fonts/` | Inter and JetBrains Mono WOFF2 files plus the generated `fonts.css`. | SIL Open Font License 1.1. |
| `manifest.json` | Machine-readable index used by the catalog page and the app. | Metadata. |

## Important

- **No Figma files are copied or redistributed.** The pack stores source links so the
  original file, author and license stay intact.
- **Check each Figma file's license before commercial use.** Some Community files are
  free, some require attribution, and some have restrictions. The catalog labels them
  as references, not as bundled templates.
- **The active catalog is UI-focused.** Random stock photos, illustrations and duplicate
  icon sets are archived in `_archive/`, not shown in the catalog.
- **Fonts are OFL.** Keep the license links in `LICENSES.md` with the files.

## Building the pack again

The downloader is at `tools/fetch_template_library.py`:

```
python tools/fetch_template_library.py
```

It downloads only the image, icon and font assets from their public sources. Edit the
`FIGMA` list in that script to add or remove links.

## Using the assets in the app

Not wired in. The app still uses the original generated wireframes. If you approve a
specific block, the next step is:

- Add a template preview under the app's template assets.
- Add the matching block map for the canvas.
- Replace only the approved wireframe thumbnail.

No gallery or canvas change happens until that approval.
