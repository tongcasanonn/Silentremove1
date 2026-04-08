# Silent Remover (Ableton Live 12 + Max for Live)

Dieses Repo enthält ein **Max-JS-Prototyp-Script** für einen „Remove Silence“-Workflow mit zwei Scopes:

- `selected`: nur aktuell gewählter Track
- `all`: alle Tracks

> Hinweis: Mehrfach-Auswahl von Tracks in Live 12 ist per LiveAPI nur eingeschränkt zugänglich. Das Script nutzt zuverlässig den primären `selected_track` oder alle Tracks.

## Datei

- `max/silent_remover.js`

## Schnellstart (so einfach wie möglich)

1. In Ableton Live 12 eine **Max Audio Effect** auf einen beliebigen Track laden.
2. Im Max-Editor diese Objekte anlegen:
   - `js silent_remover.js`
   - Message-Boxen/Controls:
     - `set_scope selected`
     - `set_scope all`
     - `set_action mute`
     - `set_action delete`
     - `set_threshold -40`
     - `set_min_length 120`
     - `set_margin 20`
     - `set_dry_run 1`
     - `set_dry_run 0`
     - `run`
3. `js`-Objekt mit zwei `print`-Objekten verbinden (Outlet 0 + 1), damit du Status/Logs siehst.
4. `run` senden.

## Was schon funktioniert

- Traversiert Session-Clips auf Ziel-Tracks.
- Filtert Audio-Clips.
- Batch-Verarbeitung über alle gefundenen Clips.
- Scope-Umschaltung (`selected`/`all`).

## Was als Nächstes ergänzt werden muss (für echtes „Remove Silence 2.0“-Verhalten)

- Reale Audiomessung pro Clip (z. B. via Node/Python/ffmpeg/librosa) statt Platzhalter.
- `mute`-Mode: Clip-Gain-/Utility-Automation in stillen Segmenten schreiben.
- `delete`-Mode: Clip-Splits + Entfernen stiller Regionen.
- Optional: Handling für „nur markierte Clips“, sobald API-Pfad in deinem Set-Workflow feststeht.

## Parameter

- `thresholdDb` (Default `-40`): Pegelgrenze zur Silence-Erkennung
- `minLengthMs` (Default `120`): Mindestdauer nicht-stiller Bereiche
- `marginMs` (Default `20`): Sicherheitsabstand vor/nach Region
- `scope`: `selected` oder `all`
- `action`: `mute` oder `delete`
- `dryRun`: `1` (nur Analyse-Log) oder `0` (Aktion)

## Nächster Schritt

Wenn du willst, baue ich dir im nächsten Schritt die **echte Audioanalyse** ein (ffmpeg/librosa), damit wirklich stillen Abschnitte erkannt und verarbeitet werden.
