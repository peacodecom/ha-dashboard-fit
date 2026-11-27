# Security policy

Security fixes target the latest released version. Report suspected vulnerabilities
privately through [GitHub Security Advisories](https://github.com/peacodecom/ha-dashboard-fit/security/advisories/new).
If private reporting is unavailable, open an issue asking for a private contact
without disclosing exploit details.

The installed module runs with Home Assistant frontend privileges. Only install
JavaScript from sources you trust. It changes local DOM styles; it does not read
HA credentials, call HA services, collect telemetry or make network requests.
URL options are numeric and range-checked, not executed as code.

Never attach access tokens, full HA configuration directories or private dashboard
URLs to reports. This project is not affiliated with Home Assistant or Fully Kiosk.
