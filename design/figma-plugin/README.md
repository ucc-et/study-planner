# SSP Redesign – Figma-Generator

Lokales Figma-Plugin, das das Redesign des Studienplaners in eine Figma-Datei baut:

| Seite | Inhalt |
| --- | --- |
| 01 · Konzept & Recherche | Aufbau eines TU-Studiums, drei Prüfungsordnungen im Vergleich, Modell vorher/nachher, Prinzipien, Informationsarchitektur, Datenmodell |
| 02 · Screens | Onboarding, Übersicht, Semesterplan, Module, Modul hinzufügen (Dialog), Struktur, Mobil – als klickbarer Prototyp verknüpft |
| 03 · Komponenten | Icons, StatusIcon, Badge, BereichTag, Button, Tab, ModuleCard (12 Varianten), ModuleRow, CP-Balken |

Farben liegen als Variablen (`Farben`), Typografie als Text-Stile (Geist), Schatten als Effekt-Stile.

## Ausführen (Figma Desktop)

1. Datei öffnen: <https://www.figma.com/design/GiwsU6xzPRt8CCFHHuUmVA> (oder eine beliebige leere Design-Datei).
2. Menü **Plugins → Development → Import plugin from manifest…**
3. `manifest.json` aus diesem Ordner wählen (im Dateidialog `⌘⇧G` und den Ordnerpfad einfügen).
4. **Plugins → Development → SSP Redesign Generator** starten. Dauert ein paar Sekunden.

Erneutes Ausführen ersetzt die generierten Frames; Variablen und Stile werden wiederverwendet.
Läuft etwas schief, zeigt Figma eine Meldung – Details unter **Plugins → Development → Show/Hide console**.

Die Beispieldaten (Module, Noten) sind illustrativ. Die CP-Regeln stammen aus den offiziellen
Studien- und Prüfungsplänen (Satzungsbeilagen 2023_II, 2023_IV, 2024_VIII).
