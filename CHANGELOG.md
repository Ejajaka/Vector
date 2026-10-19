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
- **Engine recall improvements:** expanded paraphrase/abbreviation lexicons
  (AZs, OTP, audit records, KMS rotation, "smallest permissions", "different
  region", public address, short-lived credentials, "private network", etc.),
  an explicit-control scope signal (security statements are analysed even with
  no AWS resource named), and an explicit-mention relevance pass. Added
  `npm run probe` (paraphrase recall: 51/54; independent unseen set 13/16).
  Existing tests stay 76/76 and eval F1 1.000.
- **Design system refresh (from the Android client):** geometric V logo,
  accessible risk palette (`#C05621` high, `#9E7D1B` medium, `#2E6F40` low),
  Risk Findings Distribution card, report download, About screen, and revised
  screen copy across `ui/android`, `ui/web-app`, `ui/web`, `ui/mobile-native`
  and `ui/mobile-expo`.

## 0.7.x
- 0.7.0 Security Delta Analysis; 0.7.1 delta clarity + KMS fix; 0.7.2 live
  "What Changed" via `projectDelta()`. See `docs/_sources/MANUAL.md` for the
  full version history.
