# Releasing

Repository: `peacodecom/ha-dashboard-fit`. Node.js 24+ is required locally.
Use an authenticated GitHub account with repository/release write permissions.
Never commit tokens or private Home Assistant configuration.

1. Update `package.json`, lockfile, changelog and versioned installation examples.
2. Run `npm ci`, `npm run check` and `npm audit --audit-level=low`.
3. Run the build with `RELEASE_TAG=vX.Y.Z`; a mismatching tag is rejected.
4. Confirm `git diff -- dist` is understood and commit source plus distribution.
5. Complete the real-device checklist in [validation](validation.md), or clearly
   label remaining limitations. Do not claim device validation from DOM tests.
6. Push `main`, inspect green CI, then create the matching Git tag and push it.
7. Publish a GitHub release against that tag. Use a prerelease flag for versions
   with a prerelease suffix. Note experimental status and any untested hardware.
8. The release workflow builds, tests, audits, verifies the distribution and uploads
   `ha-dashboard-fit.js`, `LICENSE` and `SHA256SUMS.txt` to the release.
9. Inspect the workflow result and download the JavaScript/checksum to verify them.
   The checksum covers the JavaScript asset; it is not a cryptographic signature.
10. Test Marketplace **Add from link → Dashboard** on HA 2026.11+ and HACS
   **Custom repositories → Dashboard** on earlier versions. Default catalog
   inclusion is a separate process, not performed by this workflow.

The GitHub Actions token is supplied by GitHub with `contents: write` for the
release job only. No npm publication or external deployment occurs. For an
initial public repository, enable Issues and private vulnerability reporting in
GitHub settings. A public URL alone does not mean code or a release was published.
