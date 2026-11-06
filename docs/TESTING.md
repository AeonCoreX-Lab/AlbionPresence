# Testing

## What has actually been executed

Only these, in the authoring workspace (no Android SDK, no npm registry access):

| Check | Command | Result recorded |
|---|---|---|
| Kotlin core compile (`-Werror`) and 48 JUnit tests, plain JVM | `scripts/verify-kotlin-core.sh` | passed |
| Strict TypeScript for the pure-logic files | `tsc` with a strict config | passed |
| 29 TypeScript logic tests | custom Jest-compatible runner, **not real Jest** | passed |
| Mutation check on the engine (3 injected bugs) | manual | all 3 caught |

Not executed anywhere yet: React Native type-check, ESLint, real Jest, any Gradle or Android build, instrumented tests, any device test, any Discord test.

## Automated tests

- `scripts/verify-kotlin-core.sh` — `SessionEngine`, `ForegroundTracker`, scripted scenarios.
- `npm test` — `tests/*.test.ts` (time, status wording, native mapper). Needs the bootstrapped project.
- `npm run typecheck`, `npm run lint` — after bootstrap. The `lint` and `test` scripts come from the React Native template; confirm they exist after generating the project.

Not written yet because they depend on Android classes: `UsageStatsManager` adapter tests, Turbo Module tests, JNI/Discord tests, UI component tests.

## Manual device checklist

Fill this in on a real device. **Leave a row blank rather than guess.** Do not mark a row passed unless you performed it. Record device, Android version, app version/commit, and date for each run.

Run: device ______ / Android ____ / commit ______ / date ______

### Permissions and setup
| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| 1 | Fresh install, finish onboarding | Reaches dashboard; permission is explained before being requested | | |
| 2 | Open Usage Access settings from the app, grant | Dashboard shows permission granted | | |
| 3 | Revoke Usage Access while monitoring | Monitoring stops, UI shows permission missing, no session continues | | |

### Detection and session
| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| 4 | Start monitoring, open Albion Online | Session starts once; wording says "app is active", not "logged in" | | |
| 5 | Switch to another app for less than the grace period, return | Same session, same start time | | |
| 6 | Leave for longer than the grace period | Session ends | | |
| 7 | Navigate between Albion screens | No new session | | |
| 8 | Lock the screen, unlock, return to game | Behaviour matches the documented rule; record what happened | | |
| 9 | Force-stop the game | Session ends after the grace period | | |
| 10 | Force-stop AlbionPresence mid-session, reopen | Session is closed or recovered per the rules; elapsed time is not invented | | |
| 11 | Reboot mid-session | Session closed, not resumed | | |
| 12 | Other apps in use | Only the configured package is inspected (check logs) | | |

### Discord (needs SDK, Phase 3)
| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| 13 | Discord app not installed or signed out | App reports unavailable; no crash | | |
| 14 | Play with Discord running | Profile shows Playing "Albion Online", "Exploring Albion", "Playing Albion Online", count-up timer, no end time | | |
| 15 | Leave the game past grace | Presence cleared | | |
| 16 | Toggle presence off in Settings | Nothing published | | |

### Background and battery
| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| 17 | Monitor for 1 hour with screen on | Record battery use and CPU wakeups | | |
| 18 | Screen off for 1 hour | Polling stops or is minimal; record | | |
| 19 | Battery saver / OEM task killer | Record whether monitoring survives and what the UI shows | | |

Performance targets from the spec should be measured on a ~6 GB MediaTek device. Record the measured numbers; do not copy targets into the results column.
