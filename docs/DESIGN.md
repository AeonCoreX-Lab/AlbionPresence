# Design

The UI follows the approved mockup (`docs/design/ui-mockup.png`): splash, five onboarding slides, a dashboard, and a four-tab bar (Home, Preview, Settings, About).

## Colours

Sampled from the mockup: background `#09081D`, tab bar `#0D0D1D`, cards `#131331`, secondary button `#1C1B34`, primary button `#6041E2`, status green `#29E657`. Other tokens (border, violet for text on dark, ivory, gold) were chosen to match. See `src/theme/colors.ts`.

## Deliberate differences from the mockup

| Mockup | Build | Reason |
|---|---|---|
| "Albion Online Detected / Game is running…" | "Albion Online app is active" | Foreground detection cannot know the player is in the game world. |
| "No Tracking", "100% Open Source" | "No analytics or tracking", "Open-source app code" | The Discord SDK is proprietary, and the app does read usage events for the game package. |
| No permission step | Extra "One Permission Needed" slide | Usage Access must be explained, never disguised. |
| Hero illustrations (castle, knight, warriors, shield art) | Supplied logo and simple icons | Those images exist only inside the mockup. Provide them as separate files to add them. |
| Discord logo on status cards | Status dot and check mark | Discord's mark needs the official asset and brand guidelines. |
| Horizontal logo lockup in the dashboard header | Supplied square logo | The logo must not be redrawn or re-cropped. Provide a lockup asset to use it. |
| Gear icon | Sliders icon | Simple vector shape drawn in code. |
| Medieval display font | Platform serif | An open-licensed font must be added as an asset first. |
| Settings, Preview, About | Labelled placeholders | Planned for Phases 4 and 5. |
