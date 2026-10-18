# Changelog

## 0.8.0
- **Version unified** to `0.8.0` across the engine, CLI, extension manifest, web
  demo, React web client, Expo and Android clients.
- **New client - React web app** (`ui/web-app`, teammate UI) wired to the shared
  `engine/src`. All hardcoded/demo data removed; every analysis is a real engine
  call.
- **New client - native Android** (`ui/android`, teammate UI, Kotlin/Compose).
- **Expo mobile app ported** (`ui/mobile-expo`): the full Android UI (Onboarding,
  Home, Analyze, Results, Improved Prompt, History, Settings + bottom nav,
  network indicator) rebuilt in React Native and wired to the shared engine.
  Bundles cleanly with `npx expo export`.
- **New brand logo** - dark-green tile `#2D5D4F` + gold V `#FACB43` - applied to
  all icons, store logo, Android launchers, splash screens and in-app marks.
- `ui/web-app` dependencies trimmed; it now installs without `--legacy-peer-deps`.
- Engine logic is unchanged: `engine/src` remains the single source of truth.

## 0.7.x
- 0.7.0 Security Delta Analysis; 0.7.1 delta clarity + KMS fix; 0.7.2 live
  "What Changed" via `projectDelta()`. See `docs/_sources/MANUAL.md` for the
  full version history.
