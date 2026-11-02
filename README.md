# Fixkosten & Sparen

Persönliche Finanz-PWA: Gesamtvermögen, Fixkosten, Gehaltsrouting („Pay yourself first“) und
Edelmetall- und Währungsbestände mit Live-Kursen von fastFOREX. Offline-first, Sprachen DE, EN, TR,
helles und dunkles Design.

**Datenschutz:** Die App verbindet sich mit keiner Bank. Alle Eingaben bleiben im Browser
(localStorage). Der fastFOREX-Key liegt nur auf dem Gerät und wird ausschließlich an fastFOREX gesendet.

## Bereiche

- **Übersicht:** Gesamtvermögen aus Girokonto, Sparkonten und Beständen. Diagramm umschaltbar
  zwischen Verteilung (Kreis) und Verlauf (Linie). Schnelle Ein- und Auszahlungen. Sparkonten.
- **Fixkosten:** Einnahmen mit Zahltag, Girokonto, Lebenshaltung, Sicherheitspuffer. Berechnet den
  sicheren Sparbetrag, den Restpuffer, eine tagesgenaue Prognose und Warnungen. Überweisung
  des sicheren Betrags auf ein Sparkonto. Liste aller Fixkosten mit Fälligkeit.
- **Vermögen:** Gold und Silber (in Gramm oder Feinunzen), Fremdwährungen. Werte in Euro live
  aus den Kursen, mit Zwischenspeicher.
- **Einstellungen:** Sprache, Darstellung (hell, dunkel, oder wie das Gerät), fastFOREX-Key mit
  Schritt-für-Schritt-Anleitung, Export und Import.

## Spar-Erinnerung

- In den Einstellungen festlegen: am Gehaltseingang oder an einem festen Tag, mit Uhrzeit.
- Zum Zeitpunkt erscheint im Dashboard ein Banner. Ausgewählte Ziel-Töpfe werden mit ihrem
  Monatsbetrag vom Girokonto gebucht. Die Auswahl wird nur gebucht, wenn sie den sicheren
  Betrag nicht übersteigt.
- Optional eine System-Benachrichtigung über den Service Worker. Sie erscheint, wenn die App
  geöffnet oder kürzlich genutzt wurde. Ein Tipp auf die Benachrichtigung öffnet die App.
- Ohne Server kann eine geschlossene App nicht zur Uhrzeit benachrichtigen. Das wäre ein
  Web-Push-Server, der bewusst nicht gebaut ist.

## Architektur

```
src/
  domain/      Reine Logik: Geld, Fälligkeiten, Cashflow, Vermögen, Bestände, Kategorien
  agents/      Module ohne Sprachmodell (siehe unten)
  storage/     localStorage-Repositories (versioniert, abgesichert)
  hooks/       Daten, Vermögen, Kurse, Einstellungen, Online-Status, Install-Prompt
  i18n/        de.json, en.json, tr.json und Provider (gleiche Schlüssel in allen Sprachen)
  components/  UI-Bausteine
  pages/       Übersicht, Fixkosten, Vermögen, Einstellungen
```

### Agenten

| Modul | Aufgabe | Technik |
|---|---|---|
| `budgetRouter.ts`, `uiDataWorker.ts`, `portfolioWorker.ts` | Agent 1: Validierung, CRUD, Berechnung, Backup | deterministisch |
| `fxConverter.ts` | Agent 2: Kurse holen, zwischenspeichern, Tageskontingent, umrechnen | deterministisch, Netzwerk |
| `cashflowPredictor.ts` | Warnungen aus der Prognose | deterministisch |
| `reminderAgent.ts` | Fälligkeit der Erinnerung, Pläne, Auswahl gegen den sicheren Betrag | deterministisch |

Die Agenten nutzen kein Sprachmodell. Dafür gibt es keine API-Kosten und keinen Server.
**Agent 3 (Finanzanalyse mit Claude) ist nicht implementiert.** Er braucht einen Server, damit der
Anthropic-Key nicht im Browser liegt. Das ist eine offene Entscheidung.

## fastFOREX-Kurse

- Endpunkt: `https://api.fastforex.io/fetch-multi` mit Basiswährung EUR.
- Kurse gelten zehn Minuten. Danach wird neu abgerufen.
- Tageskontingent auf dem Client: 40 Abrufe. Danach gilt der letzte Stand.
- Metallkurse werden als Feinunzen je Euro ausgewertet. Ein Gramm entspricht 1 / 31,1034768 Feinunzen.
  **Bitte einmal gegen die fastFOREX-Dokumentation und einen echten Abruf prüfen.**

## Lokal ausführen

Voraussetzung: Node.js 22 oder neuer.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Tests (Vitest)
npm run typecheck
npm run build      # Ausgabe in dist/
```

## Deployment (GitHub Pages)

Die Datei `.github/workflows/pages.yml` testet, baut und veröffentlicht die App.

1. Repository: **Settings → Pages → Source → GitHub Actions**.
2. **Actions → Deploy to GitHub Pages → Run workflow** (oder Push auf `main`).

Die App liegt danach unter `https://<benutzername>.github.io/<repo>/`. Der Workflow setzt den
Unterpfad automatisch über `VITE_BASE`.

## Icons neu erzeugen

```bash
pip install pillow
python3 scripts/make-icons.py
```
