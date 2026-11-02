# Fixkosten – PWA für monatliche Fixkosten

Installierbare Web-App (React + Vite + Tailwind) zum Erfassen und Auswerten monatlicher Fixkosten.
Die Daten liegen lokal im Browser, die App funktioniert offline. Es gibt keinen Server und kein Konto.

## Funktionen

- **Monatsplanung & Sparbetrag:** Gehalt und weitere feste Einnahmen mit Zahltag erfassen.
  Die App berechnet daraus, wie viel du **sofort sicher aufs Sparkonto** überweisen kannst.
- **Restpuffer:** Betrag, der bis zum nächsten Gehalt zwingend auf dem Girokonto bleiben muss,
  damit alle Fixkosten ohne Überziehung abgebucht werden.
- **Prognose:** Tagesgenauer Kontostand bis zum Gehalt. Zeigt den ersten Tag mit Unterdeckung.
- **Warnungen:** Überziehung, Unterschreitung des Sicherheitspuffers, negative Monatsplanung.
- **Fixkosten:** Miete, Abos, Versicherungen usw. mit Intervall (monatlich, vierteljährlich,
  jährlich) und Abbuchungstag. Anzeige der Abbuchungen des laufenden Monats.
- **Import und Export** als JSON (Backup inkl. Einnahmen und Einstellungen).
- **PWA:** Manifest, Service Worker, Offline-Start, Install-Button.

Die gesamte Berechnung läuft lokal im Browser. Es gibt keine KI-Funktionen und keinen Server.

## Struktur

```
src/
  domain/      Geld (Cent-Ganzzahlen), Fälligkeiten, Cashflow-Kern, Kategorien, Typen
  agents/      Lokale Module ohne externe Dienste:
               budgetRouter.ts      Validierung, CRUD, Routing (Puffer, Sparbetrag)
               cashflowPredictor.ts Warnungen aus der Prognose
               uiDataWorker.ts      Validierung und Summen der Fixkosten, Backup
  storage/     localStorage-Repositories (versioniert)
  hooks/       Daten, Einnahmen, Online-Status, Install-Prompt
  components/  UI
public/        manifest.webmanifest, sw.js, Icons
scripts/       make-icons.py (erzeugt die PNG-Icons)
.github/workflows/pages.yml   Tests, Build und Deploy auf GitHub Pages
```

Die Module unter `agents/` sind deterministisch. Sie sind als Module getrennt, damit man später
einzelne Teile austauschen kann, ohne den Rechenkern anzufassen.

## Rechenlogik in Kürze

- **Fenster:** heute bis einen Tag vor dem nächsten Gehaltseingang (ohne Einnahme: 30 Tage).
- **Restpuffer** = Fixkosten im Fenster + Lebenshaltung pro Tag × Tage im Fenster + Sicherheitspuffer.
- **Sicherer Sparbetrag** = Girokonto-Stand − Restpuffer (mindestens 0).
- **Planung pro Monat** = Einnahmen − Fixkosten (auf Monat umgerechnet) − Lebenshaltung.
- Lebenshaltung pro Tag = Monatswert × 12 / 365.

## Lokal ausführen

Voraussetzung: Node.js 22 oder neuer.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Unit-Tests
npm run typecheck  # TypeScript
npm run build      # Produktions-Build nach dist/
```

Service Worker testen: `npm run build && npm run preview`, App einmal online öffnen,
dann offline schalten und neu laden.

## Deployment auf GitHub Pages

Die Datei `.github/workflows/pages.yml` baut und veröffentlicht die App automatisch.

### Einmalige Einrichtung

1. Auf GitHub das Repository öffnen: **Settings → Pages**.
2. Unter **Build and deployment → Source** die Option **GitHub Actions** wählen.
3. Den Workflow starten: **Actions → Deploy to GitHub Pages → Run workflow**
   (oder den Branch nach `main` mergen, dann läuft er bei jedem Push automatisch).

Die App ist danach unter `https://<github-benutzername>/MyCosts/` erreichbar.
Der Benutzername steht in der Seitenleiste der Pages-Einstellungen.

Hinweis: Der Workflow läuft im Environment `github-pages`. Falls GitHub einen Deploy von
einem anderen Branch als `main` ablehnt, Environment-Regeln unter **Settings → Environments**
anpassen oder die Änderungen nach `main` mergen.

### Unterpfad

GitHub Pages veröffentlicht Projekt-Seiten unter `/<repo>/`. Der Workflow setzt dafür die
Umgebungsvariable `VITE_BASE=/MyCosts/`. Wenn du das Repository umbenennst, passt der Workflow
sich automatisch an, weil der Repo-Name dynamisch eingesetzt wird.

## Als App installieren

- Chrome, Edge (Desktop und Android): „App installieren“ im Browsermenü oder über den Button in der App.
- iOS / Safari: Teilen-Symbol, dann „Zum Home-Bildschirm“.

## Icons neu erzeugen

```bash
pip install pillow
python3 scripts/make-icons.py
```

## Hinweise

- Die Daten bleiben auf dem Gerät. Vor dem Browserwechsel, dem Löschen des Browser-Speichers
  oder einem Gerätewechsel bitte exportieren.
- Die App ist ein Werkzeug zur Übersicht und ersetzt keine Finanzberatung. Die Prognose
basiert auf den eingetragenen Werten; Abweichungen durch spontane Ausgaben sind möglich.
