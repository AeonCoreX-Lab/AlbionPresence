# Architecture

Four independent concerns, each testable alone:

| Concern | Lives in | State |
|---|---|---|
| UI | `src/` (React Native, TypeScript) | Written, unbuilt |
| Game detection | `android/native/monitoring` (Kotlin, `UsageEvents`) | Planned, Phase 2 |
| Session engine | `android/native/session` (pure Kotlin, injected clock and storage) | Planned, Phase 2 |
| Discord integration | `cpp/discord` + `android/native/discord` + `bridge` (C++ over JNI) | Planned, Phase 3 |

## Session engine and tracker (implemented, JVM-tested)

`ForegroundTracker` turns activity events for the configured package into foreground/background changes. It tracks each activity separately, so moving between the game's own screens is not "leaving the app". Events for other packages are dropped immediately.

`SessionEngine` is a state machine (`INACTIVE`, `ACTIVE`, `GRACE`). It has no timers or Android types: callers pass the current time to every method and schedule one wake-up at `nextDeadlineElapsedMs()`. It returns `SessionEvent`s (`Started`, `Resumed`, `GraceStarted`, `Ended`) for the Discord layer and UI bridge.

Rules it enforces:
- Foreground while a session exists never creates a second one.
- Returning within the grace period resumes the same session (same id, same start).
- A return after the deadline ends the old session first and starts a new one, even if the wake-up was delayed.
- Recovery restores a session only when the boot id matches and continuity is proven. Otherwise it closes the session (`UNVERIFIABLE_RECOVERY`). It never invents elapsed time.
- Screen-off is fed in by the monitor as a forced background, so it does not depend on pause events being delivered.

A killed game cannot be told apart from a game that left the foreground, so both end after the grace period.

Test it without the Android SDK: `scripts/verify-kotlin-core.sh`.

## Who owns what

The native layer owns monitoring state, the session, the timer, and the Discord connection. JavaScript mirrors it.

- The session start is persisted as a wall-clock timestamp. Durations during a running session use `SystemClock.elapsedRealtime()`.
- After a reboot, `elapsedRealtime` resets, so a session that cannot be proven continuous is closed. Elapsed time is never invented.
- The UI timer is derived: native reports `elapsedMs` at capture time and the UI extrapolates with a monotonic clock. The 1 s interval in the UI only repaints.

## JS/native contract

`specs/NativeAlbionPresence.ts` is the Turbo Native Module spec. Native emits `AlbionPresenceStateChanged` with a full state snapshot (`NativeStateWire`). Replacing the whole state on each event avoids ordering bugs between partial updates.

The wire format is flat (`''` and `-1` sentinels, plain strings). `src/services/nativeMapper.ts` converts it to domain types and maps unknown values to non-healthy states.

## Honesty rules in the UI

- "Albion Online app is active" is the strongest claim made about the game. Login state cannot be detected.
- A connected Discord state is shown only after the SDK confirmed a presence update.
- Missing native module, missing permission, and restricted background execution each have their own visible state.

## Planned Android behaviour (to verify in Phase 2)

- `UsageEvents` has no push API, so detection polls event deltas, only while the screen is on, at a modest interval.
- Foreground-service use depends on a valid service type for Android 14+. This is unverified and the fallback is documented before it is implemented.
