# Contributing

Thanks for helping. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) first.

## Ground rules

- No Discord user tokens, passwords, or self-bot techniques. Ever.
- No Accessibility Services, root, game memory inspection, packet interception, or screen scraping.
- No analytics, ads, or telemetry.
- Do not commit the Discord Social SDK, signing keys, keystores, or credentials.
- Do not fake behaviour. If something is not implemented, the UI and docs must say so.
- Do not claim a test passed unless it was actually run. Record real device results in the test checklist.

## Workflow

1. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/BUILDING.md](docs/BUILDING.md).
2. Keep UI, session management, game detection, and Discord integration independent.
3. Add or update tests with your change: `npm run typecheck`, `npm run lint`, `npm test`.
4. Describe in the pull request what you ran and on which device or emulator.
