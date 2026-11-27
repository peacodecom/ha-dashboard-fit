# Usage and integration

Install HA Dashboard Fit as described in the [README](../README.md), then add
`?zoom=0.85&marginTop=-15` to your dashboard URL to adjust zoom and top spacing.

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

An element **inside the scaled content target**, including card shadow roots, can
opt out of dashboard zoom. It receives an inverse zoom of `1 / zoom`. Elements
outside the target must not be compensated. Nested registered layers are compensated
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

The marker permits discovery even when the card connects before this module
loads. A marked layer should not have its own non-default CSS zoom; this API cancels only dashboard zoom,
not transforms or other scaled ancestors. Its previous inline zoom is restored
when the layer leaves the target, disconnects or scaling is disabled. Closed
shadow roots cannot be discovered.

## Runtime behavior

The module follows HA's frontend chain to the active `hui-view` in light DOM or
through its optional shadow boundary. It selects one of these content targets:

| Layout element | Zoom / `marginLeft` target | Reason |
| --- | --- | --- |
| `hui-sections-view` | Its shadow-root `div.wrapper` | Contains view header, badges and sections. |
| `hui-masonry-view` | The layout host | Badges are siblings of `#columns`; both must scale together. |
| `hui-panel-view` | The layout host | Panel renders its card directly, without a shared inner wrapper. |

`marginTop` applies to the body only while a supported target is available.
The app header, sidebar and external HA dialogs are not zoom targets. Standard
and custom cards inherit their parent target's zoom, including cards inside open
shadow roots. Unsupported custom view layouts and sidebar layouts are left alone;
subviews follow the same three-layout rule. See the [supported-elements table](../README.md#supported-layouts-and-elements).

Child-list mutations
inside observed roots schedule one refresh per animation frame. A two-second
fallback while the page is visible discovers late `attachShadow()` calls and URL
changes that do not emit events. It does not patch browser history or shadow APIs.
Attributes are not observed, preventing style-change observer loops. A marker
changed without a child-list mutation is discovered by the fallback.

URL options are checked on `location-changed`, `popstate` and resize as well.
During zoom, fixed-layer discovery traverses the target's own shadow root and
open card shadows. Very large dashboards may incur additional traversal cost. There is no
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

- **Nothing changes:** verify a supported layout, resource URL/type, network response
  and decimal points. Options belong to the dashboard URL, not the resource URL.
- **An update is not visible:** remove duplicate resource entries and clear browser
  cache, then fully reload. Update the version suffix for manual installs.
- **Top content is clipped:** reduce the negative `marginTop` or remove it.
- **Cards or touch controls are too small:** increase `zoom` toward `1`.
- **Background shrinks with cards:** use the fixed-layer API above.
- **Dialogs scale unexpectedly:** verify that they live outside the scaled content
  target; card-local overlays need their own compatibility testing.
- **Other layouts do not scale:** Sections, Masonry and Panel are supported;
  custom view layouts, Sidebar and non-Lovelace panels are not.
- **Regression after HA update:** report HA/frontend, WebView and module versions,
  anonymized query parameters and reproduction steps, not your private config.

## Uninstall

Remove the URL parameters to disable styling. Remove the resource and uninstall
via the Marketplace or HACS (or delete the manually installed file) to remove the module entirely.
Reload all open tabs/Fully sessions. No HA helpers, entities or persistent settings
are created by this project.
