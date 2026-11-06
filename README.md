# AlbionPresence

**PLAY • TRACK • SHARE**

An independent Android companion app that detects when the Albion Online app is in the foreground and shows it as your Discord Rich Presence, with an elapsed-time counter.

> AlbionPresence is an independent community project. It is not affiliated with, endorsed by, or sponsored by Sandbox Interactive or Discord.

## Status: early development, not usable yet

| Area | State |
|---|---|
| Phase 1: app shell, design system, splash, onboarding, dashboard (React Native source) | Source written. Not yet built or run on a device. |
| Phase 2a: session engine and foreground tracker (pure Kotlin) | Written; 48 JUnit tests passed on a plain JVM |
| Phase 2b: Usage Access flow, `UsageStatsManager` adapter, Android storage, Turbo Module implementation | Not started (needs the Android SDK) |
| Phase 3: Discord Social SDK, C++/JNI, presence publishing | Not started |
| Phase 4: settings, privacy controls, error handling | Not started |
| Phase 5: tests on device, CI, release APK | CI/release workflows and docs written, never run; no APK exists |

There is no APK yet and no test has been run on a device or emulator.

What was actually executed so far:
- Kotlin core: compiled with Kotlin 2.0.21 (warnings as errors) and 48 JUnit 4 tests passed, via `scripts/verify-kotlin-core.sh`. Deliberately injected bugs were caught by the tests. This is logic only, not Android behaviour.
- TypeScript logic: strict `tsc` and 29 tests passed, using a small Jest-compatible shim rather than Jest itself.

Not executed: ESLint, real Jest, React Native type-checking, any Gradle build, any Android code. See [CHANGELOG.md](CHANGELOG.md) and [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## What it will do

- Detect whether the Albion Online app is in the foreground, using Android Usage Access (an explicit permission you grant and can revoke).
- Publish "Playing Albion Online" with a live elapsed timer to the signed-in Discord app, using Discord's official Social SDK. No Discord token or password is ever requested.

## Honest limits

- Foreground detection only shows the game app is in front. It cannot tell whether you are logged in, on the login screen, or disconnected, so the app calls this an "active game-app session".
- Force-stopping the app, revoking Usage Access, or aggressive battery management by your device maker can interrupt monitoring.
- Android Rich Presence needs the Discord app installed and signed in.

## Privacy

No analytics, no ads, no telemetry, no account credentials, and no collection of other apps' usage. See [PRIVACY.md](PRIVACY.md).

## Building

See [docs/BUILDING.md](docs/BUILDING.md), [docs/TESTING.md](docs/TESTING.md) and [docs/RELEASING.md](docs/RELEASING.md). The Discord Social SDK is **not** included in this repository and must not be committed to it.

## Contributing and security

[CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md)

## Licence

Source code: [MIT](LICENSE).

### Branding

`assets/branding/albionpresence-logo.png` is the project's logo and is used unmodified. It contains Discord's logo mark. The maintainers must confirm the licence for the logo and check Discord's brand guidelines before publishing releases. The MIT licence does not automatically cover it.
