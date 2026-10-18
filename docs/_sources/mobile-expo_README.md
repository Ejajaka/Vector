# Vector Mobile (React Native / Expo)

React Native client for **iOS and Android**. The UI is a full port of the native
Android client (`ui/android`), and it reuses the same shared rule engine
(`engine/src`) as every other Vector surface. All analysis data comes from the
engine - there is **no hardcoded or sample data**.

## Screens (bottom navigation)

| Screen | Purpose |
|---|---|
| Onboarding | 4-page intro (first launch): zero-deployment risk, the 3-step workflow, history/metrics, readiness |
| Home | Hero + metrics (Total, Avg Risk, Avg Coverage, High-Risk) + recent analyses |
| Analyze | Prompt input, example prompts, `Analyze Prompt` and `Deep Scan` |
| Results | Risk badge, coverage, resources, tabs (Missing / Detected / Risky), selectable clauses |
| Improved Prompt | Editable hardened prompt, Copy, Re-analyze, Reset |
| History | Search, risk filter, sort, reopen/delete, clear-all |
| Settings | Light/Dark/System theme, engine status, network + simulate-offline, about |

An online/offline `PersistentNetworkIndicator` appears on Home/Analyze/History,
matching the Android client.

## Run

```powershell
cd ui/mobile-expo
npm install
npm run sync        # copy the shared engine into src/ (taxonomy, semantic, analyzer)
npx expo start       # then scan the QR code with Expo Go
```

Run on **Expo SDK 57 / React Native 0.86 / React 19** (matches the current Expo
Go app).

## Verification

- `npx expo export --platform android` -> **bundles cleanly** (689 modules, Hermes
  bytecode). This proves every screen, component and engine import compiles.

## Dependencies

Beyond Expo itself: `@expo/vector-icons` (Material icons),
`expo-clipboard` (Copy Improved Prompt) and
`@react-native-async-storage/async-storage` (local history).

## Files

```
ui/mobile-expo/
  App.js                     app shell: theme, navigation, top/bottom bars, state
  src/theme.js               light/dark palette + risk helpers
  src/vector.js              engine adapter -> AnalysisResult model (no demo data)
  src/storage.js             AsyncStorage history
  src/ui.js                  shared components (cards, badges, finding card, dialogs)
  src/screens/HomeScreen.js
  src/screens/AnalyzeScreen.js
  src/screens/ResultsScreen.js
  src/screens/ImprovedPromptScreen.js
  src/screens/HistoryScreen.js
  src/screens/OnboardingScreen.js
  src/screens/SettingsScreen.js
  src/analyzer.js ...        (generated copies of the shared engine)
  app.json / package.json / babel.config.js
  sync-engine.ps1
```

## Caveats

- `ui.js` (DOM renderer) is not reused; React Native has its own components. Only
  the pure engine is shared.
- History is stored with AsyncStorage on the device; there is no seeded data.
- Not launched on a device/emulator in the build environment here. Run
  `npx expo start` and verify the UI on a phone before submitting.
