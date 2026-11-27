# Contributing

Use Node.js 24 or newer. Run `npm ci`, then `npm run check` and
`npm audit --audit-level=low`. Commit the rebuilt distribution with source changes.
The browser module has no runtime dependencies; development dependencies are pinned.

Add regression tests for behavior changes and keep English/German documentation
in sync. State HA version, layout, browser/WebView and whether a real tablet was
tested. DOM simulation is not proof of correct CSS zoom or touch behavior.

Do not commit credentials, local HA backups, internal addresses, private entity
names or unredacted screenshots. Keep changes focused and communicate respectfully.

See [release instructions](docs/releasing.md) for versioning and publication.
