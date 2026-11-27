# Validation status

This release includes automated checks. Validation on a real Android tablet in
Fully Kiosk Browser with `zoom=0.85&marginTop=-15` is still pending.

## Automated checks

`npm run check` runs ESLint, Node's test runner with Happy DOM, and the bundled
build. Tests cover numeric parsing, style application/restoration, navigation,
Sections/Masonry/Panel targets, light/shadow view boundaries, delayed content,
fixed-layer registration, nesting, disconnection
and metadata. CI also checks dependency advisories and reproducible output.

Happy DOM does not implement a real CSS layout engine. These checks cannot verify
pixel alignment, CSS zoom rendering, browser-specific fixed positioning, HA
dialog behavior or touchscreen hit targets.

## Manual release checklist

- [ ] Test actual Home Assistant Sections, Masonry and Panel views.
- [ ] Check Masonry badges/columns, the Panel card and transitions between layouts.
- [ ] Record HA/frontend, Android, WebView and Fully Kiosk versions.
- [ ] Confirm `zoom=0.85&marginTop=-15` with the intended tablet orientation.
- [ ] Test the recommended Kiosk Mode combination with `?kiosk&zoom=0.85&marginTop=-15`.
- [ ] Check header, sidebar, top clipping, horizontal overflow and scrolling.
- [ ] Open more-info/settings dialogs and exercise touch controls.
- [ ] Navigate between views and remove/change query parameters without reloading.
- [ ] Confirm an unparameterized desktop session is unchanged.
- [ ] Confirm a fixed background remains viewport-sized.
- [ ] Test cold start, cache refresh, reconnect and dashboard editing.
- [ ] Test Marketplace installation through **Add from link** (HA 2026.11+).
- [ ] Test HACS installation through **Custom repositories** (HA 2026.10 and earlier).
- [ ] Verify GitHub-hosted CI/release runs and downloaded checksums.

Unchecked items remain unverified. Do not infer an HA compatibility matrix from
the build's browser syntax targets.
