# Fixkosten – PWA für monatliche Fixkosten

Installierbare Web-App (React + Vite + Tailwind) zum Erfassen und Auswerten monatlicher Fixkosten.
Die Daten liegen lokal im Browser, die App funktioniert offline. Es gibt keinen Server und kein Konto.

## Funktionen

- Dashboard: Summe monatlich und jährlich hochgerechnet, nächste Fälligkeit, Verteilung nach Kategorie
- Posten anlegen, bearbeiten, löschen (Name, Betrag, Kategorie, Intervall, Fälligkeitstag bzw. -monat)
- Intervalle: monatlich, vierteljährlich, jährlich, inkl. Umrechnung auf Monat und Jahr
- Import und Export als JSON (Backup)
- PWA: Manifest, Service Worker, Offline-Start, Install-Button

## Struktur

```
src/
  domain/      Geld (Cent-Ganzzahlen), Fälligkeiten, Kategorien, Typen
  agents/      uiDataWorker.ts: Validierung, CRUD, Summen, Import/Export
  storage/     localStorage-Repository (versioniert)
  hooks/       Daten, Online-Status, Install-Prompt
  components/  UI
public/        manifest.webmanifest, sw.js, Icons
scripts/       make-icons.py (erzeugt die PNG-Icons)
.github/workflows/pages.yml   Tests, Build und Deploy auf GitHub Pages
```

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
- Die App ist ein Werkzeug zur Übersicht und ersetzt keine Finanzberatung.
