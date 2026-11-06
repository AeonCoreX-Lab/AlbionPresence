# AlbionPresence — Findings & Implementation Plan

Date: 2026-11-05
Status (2026-11-06): SDK validation done (from public docs). Phase 1 source is written but NOT built: this workspace cannot install dependencies (see section 4). Executed here: strict `tsc` and 29 TypeScript logic tests (Jest-compatible shim); Kotlin core compiled with Kotlin 2.0.21 and 48 JUnit tests passed on a plain JVM, with 3 injected bugs all caught. Not executed: React Native type-check, ESLint, real Jest, any Gradle or Android build, any device test.

Phase 2 is split: 2a (pure session engine and foreground tracker) is done and JVM-tested. 2b (Usage Access flow, `UsageStatsManager` adapter, Android storage, Turbo Module implementation) needs the Android SDK and is not started. The official Android reference page for `UsageEvents.Event` could not be read by the fetch tool (it returned only the navigation menu), so no constant values were taken from memory: the adapter must use the named constants and be verified by compiling against `android.jar`.

AlbionPresence is an independent community project. It is not affiliated with or endorsed by Sandbox Interactive or Discord.

## 1. Verified facts (Discord Social SDK)

Sources: docs.discord.com Social SDK pages (Rich Presence guide, Mobile guide, C++ getting-started) and the official release notes page, all read on 2026-11-05.

- Unauthenticated Rich Presence over RPC is supported on desktop and on Android from Social SDK 1.10. It is not supported on iOS, console or web.
- Release 1.10.18247 (2026-07-28) added the Android RPC transport. Latest release listed in the notes: 1.10.19337 (2026-09-01).
- Android requirements per the docs: the Discord app must be installed and signed in, and the app needs a registered Discord Application ID.
- Android platform support: 7.0+. The SDK has been 16 KB page-size compatible since 1.4. The project's minSdk of 26 (Android 8.0) is therefore compatible.
- Documented unauthenticated flow: `Client::SetApplicationId(id)`, build an `Activity`, call `Client::UpdateRichPresence(activity, callback)`. No `Connect()` and no OAuth.
- Documented `Activity` API: `SetType(ActivityTypes::Playing)`, `SetName(...)` (overrides the displayed name), `SetDetails`, `SetState`, `SetTimestamps`.
- Timestamps are Unix seconds. Setting only `ActivityTimestamps::SetStart` produces a count-up elapsed timer. Setting an end time turns it into a countdown, so we never set one.
- C++20 is required. `discordpp.h` is a header-only wrapper over a shared library: define `DISCORDPP_IMPLEMENTATION` in exactly one source file. Callbacks run via `discordpp::RunCallbacks()`.
- Release builds log only Warning/Error levels. Tokens are filtered from logs (1.7.x+ security notes).

## 2. NOT verified yet (must be checked against the real SDK download before coding)

- Android package layout: AAR vs. `.so` + headers, which ABIs ship, and whether CMake config is provided. The C++ guide only documents desktop layouts.
- How the SDK is initialised on Android (JNI `JavaVM`/`Context` requirements, any required manifest entries or `<queries>` for the Discord app).
- The exact "clear presence" API. It was not seen in the docs I read, so it will not be assumed.
- What event confirms that the RPC link to Discord is live. The only confirmation seen so far is a successful `UpdateRichPresence` callback result, so the UI will show "Published" only after that succeeds.
- Whether `Client::Status` callbacks fire in RPC-only mode.
- Android 14/15 foreground-service types and restrictions. Needs checking against current Android docs in Phase 2.

## 3. Blockers and risks

1. SDK download is gated. It is only available from the Discord Developer Portal, for an application that has the Social SDK enabled. CI cannot fetch it anonymously.
2. Licensing (from excerpts only; needs a proper read by the maintainer):
   - The Social SDK Terms grant a limited license to distribute the SDK as integrated in your application, and prohibit copying or redistributing it otherwise and creating derivative works.
   - A third-party framework vendor states it cannot redistribute the SDK for license reasons.
   - The Developer Terms say developer credentials may not be embedded in open-source projects. Whether an Application ID counts is unclear.
   - Consequence: the MIT repository must NOT contain SDK headers or binaries. Contributors supply their own SDK directory via a build property. Release builds use a private CI secret or artifact. Confirm with Discord before publishing APKs that bundle the SDK.
3. Albion package name. A store-listing aggregator shows `com.albiononline` for the Android app. Not verified on a device, and a sideloaded APK might differ. It will be a configurable setting, validated against installed packages with a package-scoped `<queries>` entry. `QUERY_ALL_PACKAGES` will not be used.
4. Foreground detection only shows the game app is in front, not that the player is logged in. The UI says "game app active", nothing more.
5. UsageStatsManager has no push API, so detection has to poll `UsageEvents`. Mitigation: poll only while the screen is on, use a modest interval, and query only events since the last cursor.

## 4. Workspace limitation (why Phase 1 has not started)

The workspace egress policy returned 403 for `registry.npmjs.org`, `dl.google.com` and `maven.google.com`. No Android SDK is installed. Available: Node 22, npm 10, Java 21, Gradle 8.14.3, CMake, Ninja.

This means that here we cannot: create the React Native project, install dependencies, run `tsc`/ESLint/Jest, or build an APK. No test results exist for this project yet.

## 5. Architecture decisions

- Kotlin core (`SessionEngine`) is pure JVM, with injected clock (`SystemClock.elapsedRealtime()` in production) and injected persistence, so it is unit-testable without a device.
- Native owns authoritative state. React Native receives typed events and derives display time from a native snapshot; a JS timer only repaints the UI.
- Persist session start wall-clock time. After reboot, `elapsedRealtime` resets, so recovery never invents elapsed time: a session that cannot be proven continuous is closed.
- Grace period handled in the engine with a cancellable timer; a return within the window resumes the same session.
- Discord layer: C++ wrapper behind a narrow JNI interface, one worker thread, `RunCallbacks` only while needed, exponential backoff on failure, explicit states (unavailable, initialising, published, error).
- Presence payload per spec: type Playing, name "Albion Online", details "Exploring Albion", state "Playing Albion Online", start timestamp only.

## 6. Phases and exit criteria

| Phase | Scope | Exit criteria |
|---|---|---|
| 1 | RN CLI project (New Architecture), TypeScript, theme, Zustand store, navigation, Dashboard, native module spec | `tsc`, ESLint, Jest pass; debug build compiles |
| 2 | UsageEvents detection, Usage Access flow, session engine | JVM unit tests pass; manual device checklist run |
| 3 | SDK integration, C++/JNI, publish and clear | Presence visible in Discord on a real device |
| 4 | Settings, privacy controls, error handling, perf pass | Checklist on a ~6 GB MediaTek device |
| 5 | Tests, GitHub Actions, release docs, APK | CI green; APK installs |

A phase is only marked complete when its exit criteria were actually executed.
