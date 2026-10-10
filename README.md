# study-planner (SSP)

A small Next.js app for students of TU Darmstadt who want a clear overview of their credit points.

If you’ve ever tried to keep track of modules and credit requirements in TUCaN and thought “there must be a better way”… this is that better way.

## How it models your studies

Credit points at TU Darmstadt are awarded per **module**, so that's the only thing you fill in. Everything above it comes from your study regulation (Prüfungsordnung):

- **Area** (Bereich, e.g. “Pflichtbereich”, “Wahlbereich”)
	- has a colour and a **credit range** (e.g. 48–49 CP)
	- can have **sub-areas** (one level max) for “davon” rules, e.g. “davon 9–18 CP Studienbegleitende Leistungen”
- **Module**
	- title, credit points, area (and optionally sub-area)
	- semester (or none – then it sits on the *Merkzettel*)
	- status: planned · running · passed · failed
	- grade (optional, once passed)

Lectures, exercises and individual exams are intentionally not modelled – they don't change how credits are counted.

## Views

- **Onboarding** – pick your programme (B.Sc./M.Sc. Informatik PO 2023, B.Sc. Maschinenbau SE 2024), start from a blank structure, import a file or try the sample plan.
- **Übersicht** – total progress, every area with its target range, open modules, estimated grade average, graduation forecast and next steps.
- **Semesterplan** – modules per semester with drag & drop, collapsed past semesters, Merkzettel for ideas, full-/part-time load.
- **Module** – all modules as a tree: area → sub-area → module, with filters and search.
- **Struktur** – edit areas, sub-areas and credit ranges, with a plausibility check.

Light and dark mode follow your system setting; the button in the header switches between system, light and dark.

## Data, import & export

Your plan is saved automatically in your browser (localStorage) – there's no account and nothing leaves your device.

- **Export** downloads the whole plan (structure + modules) as JSON.
- **Import** reads those files – and files exported by the previous version of this planner, which are converted automatically (Section → area, Subsection → sub-area, Event → module).
- **Vorlage exportieren** (in Struktur) exports only the structure, to share it with fellow students.

The credit rules in the templates come from the official Studien- und Prüfungspläne (Satzungsbeilagen 2023_II, 2023_IV, 2024_VIII). Always double-check against the regulation that applies to you.

## Design

The redesign was done in Figma first. `design/figma-plugin/` contains a local Figma plugin that generates the design file (concept, screens, components) – see its README.

## Run locally

Prerequisites:

- Node.js

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open:

- http://localhost:3000
