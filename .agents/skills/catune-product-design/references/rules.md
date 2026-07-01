# Mechanical Rules

These rules should stay enforceable by script where possible.

## rule/no-legacy-surfaces

Source: root project cleanup.

Rule: Do not recreate `docs/`, `PRD/`, `prototype/`, `web/`, or `src/ui/`.

Reason: Catune now has one formal product surface: Expo RN/RNW App in `src/design/`.

Check: `npm run design:check`.

## rule/design-home

Source: root `AGENTS.md`.

Rule: User-visible UI must live under `src/design/`.

Reason: Keeps vibe coding and Agent navigation simple.

Check: `npm run design:check` validates the directory and skill references.

## rule/i18n-pairing

Source: `src/design/i18n`.

Rule: New user-facing copy must keep `en.ts` and `zh.ts` keys aligned.

Reason: Locale switching is part of the App shell.

Check: `npm test -- --runInBand` includes i18n coverage tests.

## rule/no-native-in-ui

Source: architecture boundary.

Rule: Do not import DeviceMotion, BLE libraries, Vibration, FileSystem, or NativeModules directly in screen/component files.

Reason: UI remains easy to vibe and platform behavior stays in `src/platform/` or `src/mnn/`.

Check: currently guidance only; promote to script if violated.

