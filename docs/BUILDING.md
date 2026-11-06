# Building

> Nothing here has been run yet. The authoring environment had no access to npm or the Android SDK. Treat the first successful build as the real verification, and fix this document with what you find.

## Prerequisites

Check the exact minimums for your React Native version in the official environment setup guide (https://reactnative.dev/docs/set-up-your-environment):

- Node.js and npm
- JDK
- Android Studio with an Android SDK and NDK (the NDK is needed from Phase 3, for the C++ Discord integration)
- A device or emulator

## First-time setup

```bash
./scripts/bootstrap.sh          # generates the React Native Android project and overlays this repo
npm run typecheck
npm test
npm run android
```

Defaults: React Native `0.88.1` (latest stable at the time of writing, from the GitHub releases page) and application id `io.github.aeoncorexlab.albionpresence`. Override with `RN_VERSION` and `PACKAGE_NAME`. The application id cannot be changed after you publish.

Commit the generated files afterwards so contributors do not rerun the bootstrap.

## Discord Social SDK (Phase 3)

The SDK is not in this repository and must never be committed. It is downloaded from the Discord Developer Portal for an application that has the Social SDK enabled. Review Discord's Social SDK Terms and Developer Terms before distributing builds that bundle it. The planned build property and layout will be documented here when Phase 3 starts.

## Signing

No signing keys are stored in the repository. Release signing instructions arrive with the CI work in Phase 5.
