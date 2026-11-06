# Releasing

Status: **untested**. Nothing here has been run. The release workflow (`.github/workflows/release.yml`) has never executed, and the Gradle signing change below has never been applied to a real generated project.

## Before the first public release

1. **Discord Social SDK licence.** The SDK may not be committed to this repository. Read the current Social SDK Terms and confirm with Discord that you may distribute an APK that bundles it. Until then, publish only builds without the SDK (they cannot publish presence) and label them as such.
2. **Brand assets.** The logo is the project's brand asset and is not MIT-licensed (see `LICENSE`). Check Discord's and the game publisher's brand guidelines for anything the app displays.
3. **Albion package name.** Confirm the configured package on a real device. It is unverified.
4. Complete the device checklist in [TESTING.md](TESTING.md) and record real results.

## Create a release keystore

Run this on your own machine. Never commit the result and never paste it into an issue.

```bash
keytool -genkeypair -v \
  -keystore albionpresence-release.jks \
  -alias albionpresence \
  -keyalg RSA -keysize 4096 -validity 10000
```

Keep an offline backup of the keystore and its passwords. If you lose the key you cannot ship updates to people who installed your APK. `.gitignore` already excludes `*.jks` and `*.keystore`.

## Repository secrets

In GitHub: Settings → Secrets and variables → Actions → New repository secret.

| Secret | Value |
|---|---|
| `ALBIONPRESENCE_KEYSTORE_BASE64` | `base64 -w0 albionpresence-release.jks` (macOS: `base64 -i file`) |
| `ALBIONPRESENCE_KEYSTORE_PASSWORD` | keystore password |
| `ALBIONPRESENCE_KEY_ALIAS` | `albionpresence` |
| `ALBIONPRESENCE_KEY_PASSWORD` | key password |

The workflow fails if any is missing. It also fails if the built APK is signed with the Android debug key.

## Wire the signing config into Gradle (manual, once)

The React Native template signs release builds with the debug key. After running `scripts/bootstrap.sh`, change `android/app/build.gradle` (or `build.gradle.kts`) so release signing reads the same environment variables the workflow sets. The generated file's layout differs between React Native versions, so this is not automated. Example for the Groovy file; adapt it to what was generated:

```groovy
android {
    signingConfigs {
        release {
            def ks = System.getenv("ALBIONPRESENCE_KEYSTORE")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("ALBIONPRESENCE_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ALBIONPRESENCE_KEY_ALIAS")
                keyPassword System.getenv("ALBIONPRESENCE_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            // Replace the template's `signingConfig signingConfigs.debug`.
            signingConfig signingConfigs.release
        }
    }
}
```

If `ALBIONPRESENCE_KEYSTORE` is unset the release config has no key and Gradle will not produce a signed APK. That is the intent: a missing key must stop the build rather than fall back to the debug key.

## Cut a release

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow type-checks, lints, runs tests, builds, verifies the signature, records a SHA-256 checksum, and creates a **pre-release** on GitHub. Check the checksum file against your downloaded APK, then install and run the checklist on a device before removing the pre-release flag.

## Local verification of a built APK

```bash
$ANDROID_HOME/build-tools/<version>/apksigner verify --print-certs app-release.apk
```

The certificate owner must be yours, not "Android Debug".
