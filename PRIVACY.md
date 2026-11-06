# Privacy

AlbionPresence is designed to keep your data on your phone.

## What the app does not do

- It does not ask for or store your Discord token or password.
- It does not ask for or store Albion Online credentials.
- It does not include analytics, advertising SDKs, crash reporters, or any third-party tracking.
- It does not send telemetry anywhere.
- It does not modify the game, read game memory, intercept network traffic, use Accessibility Services, or read the screen.

## What the app will use (once implemented)

- **Usage Access (Android):** to learn whether the configured Albion Online app is in the foreground. The app only inspects that one package identifier and ignores events for every other app. You grant this permission in Android settings and can revoke it there at any time.
- **Notification permission (Android 13+):** only if needed to show a visible notice while background monitoring runs.
- **Session data:** the start time of the current session and your settings, stored locally on the device. Nothing is uploaded.

## Discord

Presence is published through Discord's official Social SDK to the Discord app on your phone. Discord's own terms and privacy policy apply to what Discord does with that information.

Open item: before the first release, the app's network traffic with the SDK enabled will be inspected and this document updated to state exactly what the SDK contacts. Until then, treat the Discord part as unverified.

## Current state of the source

The current source contains no network code. Debug builds of a React Native app connect to a development server on your computer; release builds do not.

## Logs

Diagnostic logs never include tokens or credentials.
