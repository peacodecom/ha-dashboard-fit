# Usage and integration

## Migrating from the local helper

1. Back up your resource entry and old helper file.
2. Remove the old `ha-scale.js` resource (and any extra `ha-zoom.js` copy).
3. Install HA Dashboard Fit using one method from the README.
4. Keep your dashboard URL: `?zoom=0.85&marginTop=-15` remains compatible.
5. Fully reload the frontend; clear Fully's WebView cache if stale code remains.
6. Test navigation, header, dialogs, scrolling and touch targets on the tablet.

Do not run both modules simultaneously. Unloading a resource does not undo code
already running in an open tab; reload that tab. The development repository does
not install anything or modify active HA configuration automatically.

Unlike the original helper, numeric values must be entirely valid (`0.85foo` is
not accepted), URL options are re-read, styles are restored when options disappear,
and body offsets are only applied while a supported Sections wrapper exists.

## Recommended companion: Kiosk Mode

[Kiosk Mode](https://github.com/NemesisRE/kiosk-mode) can hide HA's header and
sidebar while HA Dashboard Fit adjusts zoom and spacing. Install it separately,
then combine the query parameters:

```text
https://ha.example.com/dashboard-tablet/home?kiosk&zoom=0.85&marginTop=-15
```

`kiosk` belongs to Kiosk Mode; this module leaves it untouched. The Android app
Fully Kiosk Browser is a separate product and simply opens the configured URL.
Follow Kiosk Mode's own documentation for configuration and exit options, and
test the combination on the actual device. Neither companion is required here.

## Fixed viewport backgrounds

An element **inside the scaled wrapper**, including card shadow roots, can opt
out of wrapper zoom. It receives an inverse zoom of `1 / zoom`. Elements outside
the wrapper must not be compensated. Nested registered layers are compensated
only at the outermost registered element.

Prefer setting the marker in the element's lifecycle:

```js
connectedCallback() {
  this.setAttribute("data-ha-scale-fixed", "");
  window.dispatchEvent(new CustomEvent("ha-scale-fixed-layer-connected", {
    detail: { element: this },
  }));
}

disconnectedCallback() {
  window.dispatchEvent(new CustomEvent("ha-scale-fixed-layer-disconnected", {
    detail: { element: this },
  }));
  this.removeAttribute("data-ha-scale-fixed");
}
```

The legacy event names intentionally remain unchanged. The marker permits
discovery even when the card connects before this module loads. A marked layer
should not have its own non-default CSS zoom; this API cancels only wrapper zoom,
not transforms or other scaled ancestors. Its previous inline zoom is restored
when the layer leaves the wrapper, disconnects or scaling is disabled. Closed
shadow roots cannot be discovered.

## Runtime behavior

The module follows HA's frontend chain to `hui-sections-view` and its
`div.wrapper`, with an optional `hui-view` shadow boundary. Child-list mutations
inside observed roots schedule one refresh per animation frame. A two-second
fallback while the page is visible discovers late `attachShadow()` calls and URL
changes that do not emit events. It does not patch browser history or shadow APIs.
Attributes are not observed, preventing style-change observer loops. A marker
changed without a child-list mutation is discovered by the fallback.

URL options are checked on `location-changed`, `popstate` and resize as well.
During zoom, fixed-layer discovery traverses open card shadows in the active
wrapper. Very large dashboards may incur additional traversal cost. There is no
continuous animation and no per-card backend subscription.

An optional console API is available:

```js
window.haDashboardFit.version;
window.haDashboardFit.refresh();
window.haDashboardFit.disconnect();
```

`disconnect()` stops observers, listeners and timers and restores managed inline
styles. Reload the page to start again. Style restoration avoids overwriting a
different current value written by another extension. Concurrent style writers
are nevertheless unsupported; do not combine competing zoom helpers.

## Troubleshooting

- **Nothing changes:** verify Sections layout, resource URL/type, network response
  and decimal points. Options belong to the dashboard URL, not the resource URL.
- **Old behavior persists:** remove duplicate/legacy resources and clear browser
  cache, then fully reload. Update the version suffix for manual installs.
- **Top content is clipped:** reduce the negative `marginTop` or remove it.
- **Cards or touch controls are too small:** increase `zoom` toward `1`.
- **Background shrinks with cards:** use the fixed-layer API above.
- **Dialogs scale unexpectedly:** verify that they live outside the Sections
  wrapper; card-local overlays need their own compatibility testing.
- **Other layouts do not scale:** only Sections is supported intentionally.
- **Regression after HA update:** report HA/frontend, WebView and module versions,
  anonymized query parameters and reproduction steps, not your private config.

## Uninstall

Remove the URL parameters to disable styling. Remove the resource and uninstall
via HACS (or delete the manually installed file) to remove the module entirely.
Reload all open tabs/Fully sessions. No HA helpers, entities or persistent settings
are created by this project.