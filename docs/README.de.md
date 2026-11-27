# HA Dashboard Fit

**Dein Dashboard. Dein Tablet. Passend gemacht.**

[English](../README.md) · [Releases](https://github.com/peacodecom/ha-dashboard-fit/releases) · [Fehler melden](https://github.com/peacodecom/ha-dashboard-fit/issues)

![Illustration eines angepassten Tablet-Dashboards](dashboard-fit.svg)

Ein schlankes Frontend-Modul für Home Assistant: **Dashboard-Zoom und Abstände
per URL einstellen**, ohne das Dashboard für alle Geräte umzubauen.
Entstanden für ein Android-Wandtablet mit **Fully Kiosk Browser**. Es funktioniert
auch ohne Fully; eine Fully-Integration wird nicht benötigt.

`?zoom=0.85&marginTop=-15` verkleinert das Dashboard auf 85 % und verschiebt die
Seite um 15 CSS-Pixel nach oben. So passen mehr Karten auf den Bildschirm und
der obere Abstand wird kleiner. Jedes Gerät kann seine eigene URL verwenden.

**Ideal in Verwendung mit [Kiosk Mode](https://github.com/NemesisRE/kiosk-mode)**
und dessen URL-Parameter `?kiosk`: Kiosk Mode blendet HA-Kopfzeile und Seitenleiste
aus, HA Dashboard Fit passt Zoom und Abstände an. Kombiniertes Beispiel unten.

> **Experimentelle Version 0.1.0.** Unterstützt ausschließlich **Abschnitte-/
> Sections-Ansichten**. Das Modul nutzt interne HA-Frontend-Strukturen, keine
> stabile HA-Erweiterungsschnittstelle. Automatisierte DOM-Tests sind vorhanden;
> diese ausgegliederte Version wurde noch nicht auf einem echten Tablet geprüft.
> Das Bild ist eine Illustration, kein Screenshot.

## Funktionen

- Optionale URL-Parameter `zoom`, `marginTop` und `marginLeft`.
- Zoom nur auf dem Sections-Wrapper, nicht auf der ganzen Anwendung.
- HA-Dialoge außerhalb des Wrappers bleiben unskaliert.
- URL-Werte werden bei Navigation neu gelesen; entfernte Parameter setzen die
  zuvor vorhandenen Inline-Styles zurück.
- Unterstützt verzögertes Laden, Ansichtswechsel und offene Shadow Roots.
- Kompatibel mit festen Hintergrundebenen über die bisherigen `ha-scale`-Events
  oder das Attribut `data-ha-scale-fixed`.
- Keine Laufzeit-Abhängigkeiten, Backend-Integration, Telemetrie oder Netzabrufe.

## Installation

**Nur eine Methode verwenden.** Den alten lokalen Helfer `ha-scale.js` nicht
parallel laden: Beide würden dieselben Styles verwalten. Es muss keine Karte
zum Dashboard hinzugefügt werden.

### HACS als benutzerdefiniertes Repository

Das Projekt ist **nicht im HACS-Standardkatalog gelistet**. Für diese Methode
muss ein veröffentlichtes GitHub-Release mit JavaScript-Datei vorhanden sein.

1. In HACS **Benutzerdefinierte Repositories** öffnen.
2. `https://github.com/peacodecom/ha-dashboard-fit` mit Typ **Dashboard**
   hinzufügen (ältere Oberflächen: **Lovelace** beziehungsweise `plugin`).
3. **HA Dashboard Fit** herunterladen.
4. Unter **Einstellungen → Dashboards → Ressourcen** kontrollieren, bei Bedarf
   den erweiterten Modus aktivieren. Die Ressource nur einmal eintragen:

   ```yaml
   url: /hacsfiles/ha-dashboard-fit/ha-dashboard-fit.js
   type: module
   ```

Bei YAML-verwalteten Ressourcen diesen Eintrag in die bestehende Liste
`lovelace.resources` aufnehmen, keinen zweiten `lovelace`-Schlüssel anlegen.

### Manuell

1. **ha-dashboard-fit.js** aus einem Release herunterladen oder selbst bauen.
   Die fertige Datei liegt auch unter [dist](../dist/ha-dashboard-fit.js).
2. In den Ordner `www` der Home-Assistant-Konfiguration kopieren.
3. Dashboard-Ressource mit URL `/local/ha-dashboard-fit.js?v=0.1.0` und Typ
   **JavaScript-Modul** hinzufügen:

   ```yaml
   url: /local/ha-dashboard-fit.js?v=0.1.0
   type: module
   ```

Danach das Frontend neu laden. Bei Bedarf den Browser-/Fully-WebView-Cache leeren.
Bei manuellen Updates den Versionszusatz der Ressourcen-URL ändern.

## Beispiel für Fully Kiosk Browser

Als **Start URL** die bisherige Dashboard-/Ansichtsadresse mit Parametern setzen:

```text
https://ha.example.com/dashboard-tablet/home?zoom=0.85&marginTop=-15
```

Beispielhost und Dashboardpfad ersetzen. Enthält die URL schon ein `?`, die
Parameter mit `&` ergänzen: `?kiosk&zoom=0.85&marginTop=-15`.
Parameter gehören vor ein eventuelles `#`-Fragment und in die Dashboard-URL,
**nicht** in die Ressourcen-URL.

| Parameter | Wertebereich | Wirkung |
| --- | --- | --- |
| `zoom` | `0.3`–`3.0` | CSS-Zoom des Wrappers; `0.85` = 85 %, `1` = 100 %. |
| `marginTop` | `-500`–`500` | Oberer Body-Abstand in CSS-Pixeln; `-15` verschiebt nach oben. |
| `marginLeft` | `-500`–`500` | Linker Wrapper-Abstand in CSS-Pixeln. |

Alle Parameter sind optional, Groß-/Kleinschreibung beachten. Dezimalzahlen mit
**Punkt**, nicht mit Komma schreiben. Leere, ungültige oder zu große/kleine Werte
werden ignoriert. Bei mehrfach vorhandenen Parametern zählt der erste Wert.
Ohne Parameter werden die vorherigen Inline-Styles wiederhergestellt; ein
Desktop-Aufruf ohne Parameter bleibt unverändert. Werte werden nicht gespeichert.

Das Modul ist **kein Kiosk-Modus**: Es versteckt weder Kopfzeile noch Seitenleiste,
ändert keine Fully-Einstellungen oder Android-Pixeldichte und umgeht keine
Anmeldung. Negative Abstände können Inhalte abschneiden; kleine Zoomwerte
verkleinern auch die Touch-Ziele.

### Empfehlung: zusammen mit Kiosk Mode verwenden

[Kiosk Mode von NemesisRE](https://github.com/NemesisRE/kiosk-mode) separat nach
dessen Anleitung installieren. Anschließend diese kombinierte Fully-Start-URL
verwenden:

```text
https://ha.example.com/dashboard-tablet/home?kiosk&zoom=0.85&marginTop=-15
```

- `kiosk` wird von **Kiosk Mode** ausgewertet und versteckt HA-Kopfzeile und
  Seitenleiste.
- `zoom=0.85` und `marginTop=-15` werden von **HA Dashboard Fit** ausgewertet.

Kiosk Mode ist optional und unabhängig von der Android-App **Fully Kiosk Browser**.
Der Parameter `?kiosk` allein installiert oder aktiviert keines der Projekte.
Konfiguration, Ausnahmen und Ausstiegsmöglichkeiten stehen in der Kiosk-Mode-
Dokumentation. Diese Empfehlung ersetzt keinen Test der Kombination auf dem
eigenen Tablet; automatisierte Drittanbieter-Kompatibilitätstests fehlen noch.

## Grenzen

- Aktueller Browser/WebView mit **CSS-`zoom`**, beispielsweise Chromium/Android
  WebView 120+. Das ist keine Zusicherung für ein bestimmtes Gerät.
- Nur Sections-Ansichten mit internem `div.wrapper`; Masonry, Panel und andere
  Layouts beziehungsweise Panels werden nicht unterstützt oder verändert.
- Karteninterne Dialoge und Drittanbieter-Overlays können sich anders verhalten
  als HA-Dialoge außerhalb des Wrappers.
- Kopfzeile und Seitenleiste bleiben unskaliert. `marginTop` verschiebt den Body,
  solange eine unterstützte Ansicht aktiv ist. Breakpoints und Scrollverhalten
  können sich ändern.
- HA-Frontend-Updates können Anpassungen nötig machen. Den tatsächlichen
  [Prüfstatus](validation.md) beachten.

## Migration, Fehlerbehebung und Deinstallation

Den alten `ha-scale.js`-Ressourceneintrag durch dieses Modul ersetzen, nicht beide
laden. Die Dashboard-URL mit `zoom=0.85&marginTop=-15` kann bleiben. Anschließend
Frontend vollständig neu laden und gegebenenfalls den Fully-Cache leeren.
Dieses Entwicklungsrepository verändert keine aktive HA-Konfiguration.

Bei Problemen zuerst Ressourcendownload und Modultyp, Sections-Ansicht,
Dezimalpunkt und aktuelle WebView-Version prüfen. Dann ohne andere
Zoom-/Kiosk-Erweiterungen testen. Vollständige Frontend-Neuladung nicht vergessen.

Zum Deaktivieren die URL-Parameter entfernen. Zum Entfernen zusätzlich die
Ressource und HACS-Installation beziehungsweise manuelle Datei löschen und das
Frontend neu laden. Details zur Hintergrund-API stehen in der englischen
[Integrationsanleitung](usage.md).

## Entwicklung und Lizenz

Node.js 24 oder neuer: `npm ci`, `npm run check`,
`npm audit --audit-level=low`. Fertige Einzeldatei: `dist/ha-dashboard-fit.js`.
Quellcode und Tests müssen nicht auf Home Assistant installiert werden.

[MIT-Lizenz](../LICENSE) · Copyright © 2026
[Norman Bauer](https://github.com/norman-bauer) · Veröffentlicht von
[peacode](https://peacode.com), einer eingetragenen Marke.
Die Softwarelizenz gewährt keine Markenrechte. Keine Verbindung zu Home Assistant
oder Fully Kiosk Browser. [Mitwirken](../CONTRIBUTING.md) ·
[Änderungen](../CHANGELOG.md) · [Sicherheit](../SECURITY.md).