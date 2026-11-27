# HA Dashboard Fit

**Your dashboard. Your tablet. A better fit.**

[Deutsch](docs/README.de.md) · [Releases](https://github.com/peacodecom/ha-dashboard-fit/releases) · [Report an issue](https://github.com/peacodecom/ha-dashboard-fit/issues)

![Illustration of dashboard fitting on a wall tablet](docs/dashboard-fit.svg)

A lightweight Home Assistant frontend module that adjusts **dashboard zoom and
spacing through URL parameters**. Made for an Android wall tablet running
**Fully Kiosk Browser**; not tied to Fully and requires no Fully integration.

For example, `?zoom=0.85&marginTop=-15` scales the dashboard to 85% and shifts the
page upward by 15 CSS pixels. More room for cards, less wasted space above them.
Each device can use its own URL without changing your dashboard configuration.

**Ideal in combination with [Kiosk Mode](https://github.com/NemesisRE/kiosk-mode)**
and its `?kiosk` URL parameter: hide the HA header/sidebar with Kiosk Mode, then
fine-tune zoom and spacing with HA Dashboard Fit. See the combined example below.

> **Experimental v0.1.0.** Supports **Sections views** only. It relies on internal
> Home Assistant frontend structure, not a supported HA extension API. Automated
> DOM tests are included; this extracted version has not yet been validated on a
> real tablet. The illustration is not a screenshot.

## Features

- Optional `zoom`, `marginTop` and `marginLeft` URL parameters.
- Scales the Sections wrapper, not the whole application or HA dialog layer.
- Re-reads options on navigation; restores original inline styles when disabled.
- Handles delayed loading, view replacement and open shadow roots.
- Compatible with fixed background layers using the existing `ha-scale` events
  or the `data-ha-scale-fixed` attribute.
- No runtime dependencies, backend integration, telemetry or network requests.

## Install

Choose **one** method. Do not load this together with the old `ha-scale.js` helper;
both would manage the same styles. No dashboard card needs to be added.

### HACS custom repository

The project is **not listed in the default HACS catalog**. A published GitHub
release with the JavaScript asset is required for this installation method.

1. In HACS, open **Custom repositories**.
2. Add `https://github.com/peacodecom/ha-dashboard-fit` with type
   **Dashboard** (called **Lovelace** or `plugin` in older interfaces).
3. Download **HA Dashboard Fit**.
4. Check **Settings → Dashboards → Resources** (enable Advanced Mode if needed).
   Keep only one resource entry:

   ```yaml
   url: /hacsfiles/ha-dashboard-fit/ha-dashboard-fit.js
   type: module
   ```

If resources are managed in YAML, add that entry to the existing
`lovelace.resources` list instead. Do not create a second `lovelace` key.

### Manual installation

1. Download **ha-dashboard-fit.js** from a GitHub release (or build it locally;
   the ready-to-use file is also in [dist](dist/ha-dashboard-fit.js)).
2. Place it in your Home Assistant configuration's `www` directory.
3. Add a dashboard resource with URL `/local/ha-dashboard-fit.js?v=0.1.0` and
   type **JavaScript module**:

   ```yaml
   url: /local/ha-dashboard-fit.js?v=0.1.0
   type: module
   ```

Reload the frontend after installation. Clear the browser/Fully WebView cache if
necessary. Change the resource's version suffix when updating a manual install.

## Use it on your tablet

Set Fully Kiosk Browser's **Start URL** to your existing HA dashboard/view URL,
with these parameters appended:

```text
https://ha.example.com/dashboard-tablet/home?zoom=0.85&marginTop=-15
```

Replace the example host and dashboard path. If the URL already has a `?`, append
with `&`, for example `?kiosk&zoom=0.85&marginTop=-15`. Put options before any `#`
fragment, not in the resource URL. Existing unrelated parameters are preserved.

| Parameter | Allowed range | Effect |
| --- | --- | --- |
| `zoom` | `0.3`–`3.0` | Sections wrapper CSS zoom; `0.85` = 85%, `1` = 100%. |
| `marginTop` | `-500`–`500` | Body top margin in CSS pixels; `-15` shifts upward. |
| `marginLeft` | `-500`–`500` | Wrapper left margin in CSS pixels. |

All parameters are optional and case-sensitive. Use decimal **points**, not
commas. Empty, invalid and out-of-range values are ignored. The first value wins
if a parameter is repeated. Removing the options restores the previous inline
styles; an unparameterized desktop URL is unaffected. Values are not stored.

This is **not kiosk mode**: it does not hide the header/sidebar, change Fully's
settings, bypass login or adjust Android screen density. Negative offsets can
clip content; smaller zoom makes touch targets smaller. Start with gentle values.

### Recommended: combine with Kiosk Mode

Install [Kiosk Mode by NemesisRE](https://github.com/NemesisRE/kiosk-mode)
separately, following its installation instructions, then use this Fully Start URL:

```text
https://ha.example.com/dashboard-tablet/home?kiosk&zoom=0.85&marginTop=-15
```

- `kiosk` is handled by **Kiosk Mode** to hide the HA header and sidebar.
- `zoom=0.85` and `marginTop=-15` are handled by **HA Dashboard Fit**.

Kiosk Mode is optional and independent of the **Fully Kiosk Browser** Android app.
The `?kiosk` parameter alone does not install or enable either project. Refer to
Kiosk Mode's documentation for its configuration, exceptions and exit options.
This is a recommended setup, not a claim of automated third-party compatibility
testing; validate the combination on your tablet.

## Compatibility and limitations

- A current browser/WebView with **CSS `zoom`** support is required (for example
  Chromium/Android WebView 120+). Browser minimums are not device certification.
- Only Sections views with HA's `div.wrapper` are targeted. Masonry, panel,
  subview-specific layouts and other panels are not supported or modified.
- Home Assistant dialogs outside that wrapper are deliberately not scaled.
  Card-local dialogs and third-party overlays may behave differently.
- Header/sidebar remain unscaled; `marginTop` offsets the body while a supported
  view is active. Scaling can affect responsive breakpoints and scrolling.
- There is no guarantee for every HA frontend version or third-party card.
  See [validation status](docs/validation.md).

## Migration, troubleshooting and removal

See the [usage and integration guide](docs/usage.md) for migration from the local
helper, fixed-layer integration, cache troubleshooting and complete removal.
No active Home Assistant files are changed by this development repository.

## Development

Node.js 24 or newer: `npm ci`, `npm run check`, then
`npm audit --audit-level=low`. `dist/ha-dashboard-fit.js` is the self-contained
release asset. Source and tests are not needed on Home Assistant.

[Contributing](CONTRIBUTING.md) · [Release process](docs/releasing.md) ·
[Changelog](CHANGELOG.md) · [Security](SECURITY.md)

## License and credits

[MIT](LICENSE) · Copyright © 2026 [Norman Bauer](https://github.com/norman-bauer).
Published by [peacode](https://peacode.com), a registered trademark.
The software license does not grant trademark rights. See [AUTHORS](AUTHORS.md).
Not affiliated with Home Assistant or Fully Kiosk Browser.