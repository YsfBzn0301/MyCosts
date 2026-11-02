# Fixkosten – PWA für monatliche Fixkosten

Eine installierbare Web-App (React + Vite + Tailwind) zum Erfassen und Auswerten
monatlicher Fixkosten. Daten liegen **lokal im Browser**, die App funktioniert **offline**.
Drei KI-Sub-Agenten unterstützen die Kategorisierung und die Spar-Analyse.

## Funktionen

- **Dashboard**: Summe monatlich, jährlich hochgerechnet, nächste Fälligkeit, Verteilung nach Kategorie
- **CRUD**: Posten anlegen, bearbeiten, löschen (Name, Betrag, Kategorie, Intervall, Fälligkeitstag/-monat)
- **Intervalle**: monatlich, vierteljährlich, jährlich – inkl. Umrechnung auf Monat und Jahr
- **Import/Export** als JSON (Backup, da die Daten nur lokal liegen)
- **PWA**: Manifest, Service Worker, Install-Button, Offline-Start
- **KI**: Kategorie-Vorschlag beim Anlegen, Spar-Analyse auf Klick

## Architektur

```
src/
  domain/        Reine Logik: Geld (Cent-Ganzzahlen), Fälligkeiten, Typen
  agents/
    uiDataWorker.ts   Agent 1 – Validierung, CRUD, Summen (ohne LLM)
    categorizer.ts    Agent 2 – Regeln zuerst, dann Haiku
    advisor.ts        Agent 3 – Sonnet, nur auf Klick
    agentClient.ts    einziger Weg zum Backend (/api/agent)
  storage/       localStorage-Repository (versioniert)
  hooks/         React-Hooks (Daten, Online-Status, Install-Prompt)
  components/    UI
shared/          Kategorien und Agent-Protokoll (Client + Server)
server/
  agents/config.ts          ← Modell-Konfiguration aller Agenten
  agents/categorizerAgent.ts Prompt + Parsing für Agent 2
  agents/advisorAgent.ts     Prompt + Parsing für Agent 3
  agentHandler.ts            Validierung, Anthropic-Aufruf, Fehlerbehandlung
api/agent.ts     Vercel-Function (POST /api/agent)
public/          manifest.webmanifest, sw.js, Icons
```

### Die Sub-Agenten

| Agent | Aufgabe | Modell | Auslöser | Kosten |
|---|---|---|---|---|
| 1 · UI & Local Data | Validierung, CRUD, Summen, Formatierung | kein LLM | jede Aktion | 0 Tokens |
| 2 · Categorization | Kategorie aus dem Namen ableiten | `claude-haiku-5-5` | Namensfeld verlassen, nur wenn lokale Regeln nichts finden | sehr gering (max. 16 Output-Tokens, Cache) |
| 3 · Financial Insights | Sparpotenziale, Budget-Tipps | `claude-sonnet-5-5` | expliziter Klick „Analysiere meine Fixkosten“ | höher, daher nur auf Klick |

**Warum Agent 1 kein Modell nutzt:** Validierung, CRUD und Formatierung sind deterministisch.
Ein LLM würde dort nur Latenz und Kosten erzeugen. Wenn du es trotzdem willst, lässt sich
eine Modell-Route in `src/agents/uiDataWorker.ts` ergänzen.

**Warum die Modelle serverseitig liegen:** Der API-Key darf nicht im Browser-Bundle stehen.
Der Client schickt nur `{ agent, input }`. Modell, `max_tokens` und Prompt bestimmt der Server.
So kann niemand über die öffentliche Funktion ein teureres Modell erzwingen.

### Modelle ändern

In `server/agents/config.ts` oder per Umgebungsvariable (ohne Code-Änderung):

```bash
CATEGORIZER_MODEL=claude-haiku-5-5
ADVISOR_MODEL=claude-sonnet-5-5
```

Die Standardwerte sind die aktuellen Claude-5.5-Modelle. Falls dein Konto noch Zugriff auf
die 3.5-Modelle hat, setze stattdessen `CATEGORIZER_MODEL=claude-3-5-haiku-latest` und
`ADVISOR_MODEL=claude-3-5-sonnet-latest`. Die Modell-IDs musst du gegen die aktuelle
Anthropic-Modellübersicht prüfen, bevor du sie einträgst.

## Lokal ausführen

Voraussetzungen: Node.js 22 oder neuer, ein Anthropic-API-Key.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. API-Key hinterlegen (Datei wird nicht committet)
cp .env.example .env
# dann in .env eintragen: ANTHROPIC_API_KEY=sk-ant-...

# 3. Entwicklungsserver starten
npm run dev
# → http://localhost:5173
```

Der Dev-Server stellt `/api/agent` lokal bereit und nutzt denselben Handler wie die
Produktion. Ohne Key bleibt die App voll nutzbar, nur die KI-Funktionen melden einen Fehler.

Weitere Befehle:

```bash
npm test          # Unit- und Handler-Tests (Vitest)
npm run typecheck # TypeScript-Prüfung
npm run build     # Produktions-Build nach dist/
npm run preview   # Produktions-Build lokal testen (Service Worker aktiv)
```

**Service Worker testen:** Der Service Worker läuft nur im Produktions-Build. Starte also
`npm run build && npm run preview`, öffne die App einmal online und schalte dann die
Verbindung ab (DevTools → Network → Offline). Ein Neuladen zeigt deine Daten weiterhin.

## Deployment (Vercel, empfohlen)

Vercel bietet kostenloses Hosting für Vite-Apps und Serverless-Funktionen für `api/`.
Dafür brauchst du kein eigenes Backend.

### Schritt für Schritt

1. **Code auf GitHub haben.** Das Repository ist bereits angelegt.
2. **Vercel-Konto erstellen** unter [vercel.com](https://vercel.com) (Login mit GitHub).
3. **Projekt importieren:** „Add New → Project“ → Repository auswählen → „Import“.
4. **Framework-Erkennung prüfen:** Vercel erkennt *Vite*. Build-Befehl `npm run build`,
   Output-Verzeichnis `dist`. Beides ist voreingestellt, es muss nichts geändert werden.
5. **Umgebungsvariable setzen** (wichtig, vor dem ersten Deploy):
   - Name: `ANTHROPIC_API_KEY`
   - Wert: dein Key
   - Environment: Production (und Preview, falls gewünscht)
   - Optional: `CATEGORIZER_MODEL`, `ADVISOR_MODEL`
6. **„Deploy“** klicken. Nach ca. einer Minute erhältst du eine URL wie `https://fixkosten.vercel.app`.
7. **Prüfen:** App öffnen, einen Posten anlegen, „Analysiere meine Fixkosten“ klicken.

### Updates

Jeder `git push` auf den Standard-Branch deployt automatisch neu.

### Sicherheit der öffentlichen Funktion

`/api/agent` ist nach dem Deploy öffentlich erreichbar. Empfehlungen:

- **Ausgabenlimit** im Anthropic-Dashboard setzen (Settings → Limits).
- Optional **Vercel Deployment Protection** aktivieren (Project → Settings → Deployment Protection),
  damit nur du die App-URL aufrufen kannst.
- Der Handler begrenzt Eingabelängen (Namen max. 100 Zeichen, Advisor max. 200 Posten) und
  gibt bei Fehlern keine Upstream-Details an den Client weiter.

### Alternative: Netlify

Netlify funktioniert ebenfalls. Die Funktion muss dafür in `netlify/functions/agent.ts`
liegen und den Handler über `handleAgentRequest` aus `server/agentHandler.ts` aufrufen.
Die Build-Einstellungen sind dieselben (`npm run build`, Publish-Verzeichnis `dist`).
Umgebungsvariable `ANTHROPIC_API_KEY` in den Site-Settings hinterlegen.

## Als App installieren

- **Android / Chrome, Desktop Chrome / Edge:** Der Button „App installieren“ erscheint oben rechts,
  oder über das Browsermenü → „App installieren“.
- **iOS / Safari:** Teilen-Symbol → „Zum Home-Bildschirm“.

## Icons neu erzeugen

Die PNG-Icons entstehen aus dem Design in `public/icon.svg`:

```bash
python3 scripts/make-icons.py   # benötigt Pillow (pip install pillow)
```

## Hinweise

- **Daten bleiben auf dem Gerät.** Es gibt kein Konto und keine Synchronisation. Nutze Export
  für Backups, bevor du den Browser-Speicher leerst oder das Gerät wechselst.
- **Keine Finanzberatung.** Die KI-Vorschläge sind Anhaltspunkte, keine verbindlichen Empfehlungen.
