# Validation status

The original local helper was used by the maintainer for an Android tablet in
Fully Kiosk Browser with `zoom=0.85&marginTop=-15`. This is historical context,
**not** a real-device validation claim for the extracted/reworked release.

## Automated checks

`npm run check` runs ESLint, Node's test runner with Happy DOM, and the bundled
build. Tests cover numeric parsing, style application/restoration, navigation,
shadow roots, delayed content, fixed-layer registration, nesting, disconnection
and metadata. CI also checks dependency advisories and reproducible output.

Happy DOM does not implement a real CSS layout engine. These checks cannot verify
pixel alignment, CSS zoom rendering, browser-specific fixed positioning, HA
dialog behavior or touchscreen hit targets.

## Manual release checklist

- [ ] Install the extracted module on an actual Home Assistant Sections dashboard.
- [ ] Record HA/frontend, Android, WebView and Fully Kiosk versions.
- [ ] Confirm `zoom=0.85&marginTop=-15` with the intended tablet orientation.
- [ ] Test the recommended Kiosk Mode combination with `?kiosk&zoom=0.85&marginTop=-15`.
- [ ] Check header, sidebar, top clipping, horizontal overflow and scrolling.
- [ ] Open more-info/settings dialogs and exercise touch controls.
- [ ] Navigate between views and remove/change query parameters without reloading.
- [ ] Confirm an unparameterized desktop session is unchanged.
- [ ] Confirm a fixed background remains viewport-sized.
- [ ] Test cold start, cache refresh, reconnect and dashboard editing.
- [ ] Install through HACS after release assets are available.
- [ ] Verify GitHub-hosted CI/release runs and downloaded checksums.

Unchecked items remain unverified. Do not infer an HA compatibility matrix from
the build's browser syntax targets.