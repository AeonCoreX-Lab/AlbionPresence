# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/). No release has been published.

## [Unreleased]

### Added
- Design system tokens (colours sampled from the approved mockup, spacing, typography).
- Typed wire-format mapper from native state to UI state, with tests.
- Pure helpers for durations, derived elapsed time, relative time, and honest status wording, with tests.
- Turbo Native Module spec (`specs/NativeAlbionPresence.ts`). The Android implementation does not exist yet.
- Zustand store that mirrors native state and never creates sessions itself.
- Splash, onboarding (including a permission explanation), dashboard, and bottom tab bar.
- `scripts/bootstrap.sh` to generate the React Native Android scaffolding with the official CLI.

- `SessionEngine` (pure Kotlin): start, duplicate prevention, grace period with same-session resume, late-return handling, stop on permission revoke or detection off, and recovery that never invents elapsed time (boot id check, continuity check). Time and storage are injected.
- `ForegroundTracker` (pure Kotlin): per-activity foreground tracking for one configured package; other packages' events are discarded on arrival.
- 48 JUnit tests including scripted flows (launch, switching apps, screen lock, process recreation, device restart). `scripts/verify-kotlin-core.sh` runs them without the Android SDK.

- GitHub Actions: `ci.yml` (Kotlin core, JS checks, debug APK) and `release.yml` (signed release, refuses debug-signed APKs), `dependabot.yml`. YAML parses; the workflows have never run, and action versions were chosen without being able to look up current releases.
- `bootstrap.yml`: on every push to main, generates the project via `scripts/bootstrap.sh` if `package.json` is missing, otherwise refreshes `package-lock.json`, commits back with `[skip ci]`, and starts CI. Never run.
- `docs/TESTING.md` (manual device checklist, results blank), `docs/RELEASING.md` (keystore, secrets, manual Gradle signing step), `THIRD_PARTY_NOTICES.md`.

### Known limitations
- Release signing is not wired into the generated Gradle project; it is a documented manual step.
- The Kotlin Gradle module files (`android/native/*/build.gradle.kts`) have never been run.
- Android adapters are not written: `UsageStatsManager` polling, Usage Access check, `BootIdProvider`, persistent `SessionStore`, Turbo Module implementation.
- A killed game cannot be told apart from a game that left the foreground; both end the session after the grace period.
- Whether a pause/resume event pair is reported when the screen turns off has not been checked on a device. The design does not rely on it: screen-off is handled separately.
- Not built or run on a device. React-Native-dependent files have not been type-checked or linted.
- Preview and About screens exist but are unbuilt/unchecked (React Native not installed here). Settings is still a placeholder.
- Onboarding completion is not persisted.
- No native code yet: nothing is detected and nothing is published to Discord.
