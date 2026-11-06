# Third-party notices

AlbionPresence is an independent community project. It is not affiliated with or endorsed by Sandbox Interactive, Albion Online, or Discord. "Albion Online" and "Discord" are trademarks of their respective owners.

## Not included in this repository

- **Discord Social SDK**: proprietary, governed by Discord's own terms. It is not part of this repository and must not be committed. You obtain it from the Discord Developer Portal.

## Dependencies

Installed from package registries at build time; none are vendored here. After `scripts/bootstrap.sh`, list the exact versions and licences with:

```bash
npx license-checker --summary   # or: npm ls --all
```

Direct dependencies chosen so far: React Native (MIT), Zustand (MIT), react-native-svg (MIT), react-native-safe-area-context (MIT). These licence names are from memory and **have not been verified** against the installed packages. Verify and replace this paragraph with generated output before a release.

Test-only tooling for the Kotlin core: Kotlin compiler (Apache-2.0), JUnit 4 (EPL-1.0).

## Brand assets

`assets/branding/albionpresence-logo.png` is the project logo and is not covered by the MIT licence (see `LICENSE`).
