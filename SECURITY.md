# Security Policy

## Supported versions

No release exists yet. Once releases exist, only the latest one will be supported.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private vulnerability reporting on this repository (Security tab, "Report a vulnerability"). Include steps to reproduce and the affected version or commit.

## Scope notes

- The app must never handle Discord tokens, passwords, or Albion credentials. Any change that does is a security bug.
- Signing keys, keystores, passwords, and API credentials must never be committed. If you find one in the history, report it.
- The Discord Social SDK is third-party software governed by Discord's terms. Report SDK vulnerabilities to Discord.
