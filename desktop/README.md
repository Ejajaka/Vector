# Vector Desktop

Electron shell that wraps the production web build in a real native window, so
daily users get a dock icon, offline start-up, native menus and (optionally)
signed installers.

## What ships

| Platform | Target | Output |
|---|---|---|
| Windows 10+ | NSIS installer | `release/Vector-Setup-2.0.0.exe` |
| macOS 12+ | DMG (universal: Intel + Apple silicon) | `release/Vector-2.0.0-universal.dmg` |
| Linux | AppImage | `release/Vector-2.0.0.AppImage` |

## Why Electron (not Tauri)

The app runs a 67 MB quantised ONNX model plus WASM SIMD threads for the BERT
engine. Electron guarantees the same Chromium build on every OS, so the in-browser
engine behaves identically. Tauri uses the system webview (WKWebView on macOS),
which has inconsistent WebGPU/WASM threading — a later optimisation, not a first
release.

## Develop

```bash
# terminal 1 — web app
cd ../ui/web-app && npm install && npm run dev

# terminal 2 — desktop shell pointing at the dev server
cd ../desktop && npm install
npm run start:dev
```

## Build

```bash
cd ../ui/web-app && npm run build
cd ../desktop && npm install
npm run dist          # Windows
npm run dist:mac      # macOS (must run on macOS)
```

`extraResources` copies `ui/web-app/dist` into the package, so the installed app
works with no network. The rules engine and history are already client-side, so
offline mode is genuinely offline.

## macOS signing (needed before public distribution)

Unsigned builds work but macOS shows “Apple could not verify…”. Users can
right-click → **Open** once. To remove that friction:

1. Join the Apple Developer Program (~$99/yr).
2. Export a **Developer ID Application** certificate.
3. Set `CSC_LINK` and `CSC_KEY_PASSWORD`, then:

```bash
npm run dist:mac
npx electron-notarize --bundle-id dev.vector.desktop --apple-id you@example.com \
  --apple-id-password "$APP_PASSWORD" --path release/mac-universal/Vector.app
```

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Preload exposes only `isDesktop`, `platform` and a navigation listener
- External links are handed to the OS browser, never loaded in-app
- No telemetry, no auto-update server until one is configured

## Auto-update (next step)

Add `electron-updater`, point `publish` at GitHub Releases, and call
`autoUpdater.checkForUpdatesAndNotify()` after `ready`. Not enabled yet because
it requires a signed build and a release channel.
