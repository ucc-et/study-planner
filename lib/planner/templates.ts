import type { Area, AreaColor, Module, ModuleStatus, Plan, Term } from "./types";
import { currentTerm } from "./semesters";
import { makeId } from "./utils";

type SubAreaTemplate = {
  key: string;
  name: string;
  min: number | null;
  max: number | null;
};

type AreaTemplate = {
  key: string;
  name: string;
  color: AreaColor;
  min: number;
  max: number;
  subAreas?: SubAreaTemplate[];
};

export type ProgramTemplate = {
  id: string;
  degree: string;
  name: string;
  regulation: string;
  validFrom: string;
  source: string;
  totalCredits: number;
  standardSemesters: number;
  areas: AreaTemplate[];
};

// Credit rules from the official Studien- und Prüfungspläne (Satzungsbeilagen) of TU Darmstadt.
export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "bsc-informatik-2023",
    degree: "B.Sc.",
    name: "Informatik",
    regulation: "PO 2023",
    validFrom: "ab WiSe 2023/24",
    source: "Satzungsbeilage 2023_II, in Kraft seit 01.10.2023",
    totalCredits: 180,
    standardSemesters: 6,
    areas: [
      { key: "pflicht", name: "Pflichtbereich", color: "blue", min: 114, max: 114 },
      {
        key: "wahl",
        name: "Wahlbereich",
        color: "green",
        min: 48,
        max: 49,
        subAreas: [
          { key: "wpb", name: "Wahlpflicht-Katalog", min: 10, max: 35 },
          { key: "fp", name: "Fachprüfungen", min: 5, max: 30 },
          { key: "sbl", name: "Studienbegleitende Leistungen", min: 9, max: 18 },
        ],
      },
      { key: "generale", name: "Studium Generale", color: "pink", min: 5, max: 6 },
      { key: "thesis", name: "Bachelorarbeit", color: "orange", min: 12, max: 12 },
    ],
  },
  {
    id: "msc-informatik-2023",
    degree: "M.Sc.",
    name: "Informatik",
    regulation: "PO 2023",
    validFrom: "ab WiSe 2023/24",
    source: "Satzungsbeilage 2023_IV, in Kraft seit 01.10.2023",
    totalCredits: 120,
    standardSemesters: 4,
    areas: [
      {
        key: "vertiefung",
        name: "Individuelle Vertiefung",
        color: "blue",
        min: 66,
        max: 72,
        subAreas: [
          { key: "basis-swhw", name: "Basis: Software und Hardware", min: 6, max: null },
          { key: "basis-theorie", name: "Basis: Theorie", min: 6, max: null },
          { key: "vertiefung", name: "Wahlbereiche KI · Sicherheit · Netze", min: 6, max: 51 },
          { key: "sbl", name: "Studienbegleitende Leistungen", min: 9, max: 18 },
        ],
      },
      { key: "generale", name: "Studium Generale", color: "pink", min: 18, max: 24 },
      { key: "thesis", name: "Master-Thesis", color: "orange", min: 30, max: 30 },
    ],
  },
  {
    id: "bsc-maschinenbau-se-2024",
    degree: "B.Sc.",
    name: "Maschinenbau – Sustainable Engineering",
    regulation: "PO 2024",
    validFrom: "ab 01.12.2024",
    source: "Satzungsbeilage 2024_VIII, in Kraft seit 01.12.2024",
    totalCredits: 180,
    standardSemesters: 6,
    areas: [
      {
        key: "pflicht",
        name: "Pflichtbereich",
        color: "blue",
        min: 146,
        max: 146,
        subAreas: [{ key: "praktika", name: "Praktika / Projekte", min: 14, max: 14 }],
      },
      { key: "wpb", name: "Wahlpflichtbereich", color: "green", min: 16, max: 19 },
      { key: "generale", name: "Studium Generale", color: "pink", min: 3, max: 6 },
      { key: "thesis", name: "Bachelor-Thesis", color: "orange", min: 12, max: 12 },
    ],
  },
];

export function findTemplate(id: string | null): ProgramTemplate | null {
  return PROGRAM_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function areasFromTemplate(t: ProgramTemplate): Area[] {
  return t.areas.map((a) => ({
    id: a.key,
    name: a.name,
    color: a.color,
    minCredits: a.min,
    maxCredits: a.max,
    subAreas: (a.subAreas ?? []).map((s) => ({
      id: `${a.key}-${s.key}`,
      name: s.name,
      minCredits: s.min,
      maxCredits: s.max,
    })),
  }));
}

export function planFromTemplate(t: ProgramTemplate, startTerm: Term): Plan {
  return {
    version: 2,
    program: {
      templateId: t.id,
      degree: t.degree,
      name: t.name,
      regulation: t.regulation,
      source: t.source,
      totalCredits: t.totalCredits,
      standardSemesters: t.standardSemesters,
    },
    areas: areasFromTemplate(t),
    modules: [],
    startTerm,
    studyMode: "full",
    semesterCount: t.standardSemesters,
  };
}

export function blankPlan(startTerm: Term): Plan {
  return {
    version: 2,
    program: {
      templateId: null,
      degree: "",
      name: "Eigener Studiengang",
      regulation: "",
      source: null,
      totalCredits: 180,
      standardSemesters: 6,
    },
    areas: [
      { id: makeId(), name: "Pflichtbereich", color: "blue", minCredits: 0, maxCredits: 0, subAreas: [] },
    ],
    modules: [],
    startTerm,
    studyMode: "full",
    semesterCount: 6,
  };
}

type SampleRow = [string, number, string, string | null, number | null, ModuleStatus, number | null];

// Example student of B.Sc. Informatik, started WiSe 2024/25. Modules and grades are illustrative.
const SAMPLE_BSC_INFORMATIK: SampleRow[] = [
  ["Erfolgreich ins Informatik-Studium starten", 1, "pflicht", null, 1, "passed", null],
  ["Funktionale und objektorientierte Programmierkonzepte", 10, "pflicht", null, 1, "passed", 1.7],
  ["Mathematik I für Informatik", 9, "pflicht", null, 1, "passed", 2.3],
  ["Digitaltechnik", 5, "pflicht", null, 1, "passed", 1.3],
  ["Automaten, formale Sprachen und Entscheidbarkeit", 5, "pflicht", null, 1, "passed", 2.0],
  ["Algorithmen und Datenstrukturen", 10, "pflicht", null, 2, "passed", 1.7],
  ["Mathematik II für Informatik", 9, "pflicht", null, 2, "passed", 2.7],
  ["Rechnerorganisation", 5, "pflicht", null, 2, "passed", 2.0],
  ["Aussagen- und Prädikatenlogik", 5, "pflicht", null, 2, "passed", 1.3],
  ["Software Engineering", 5, "pflicht", null, 3, "passed", 1.7],
  ["Computersystemsicherheit", 5, "pflicht", null, 3, "passed", 2.3],
  ["Informationsmanagement", 5, "pflicht", null, 3, "passed", 1.0],
  ["Computernetze und verteilte Systeme", 5, "pflicht", null, 3, "passed", 2.0],
  ["Probabilistische Methoden der Informatik", 5, "pflicht", null, 3, "passed", 2.7],
  ["Spanisch A1 (Sprachenzentrum)", 3, "generale", null, 3, "passed", 1.3],
  ["Einführung in die Künstliche Intelligenz", 5, "pflicht", null, 4, "passed", 1.3],
  ["Modellierung, Spezifikation und Semantik", 5, "pflicht", null, 4, "passed", 2.3],
  ["Parallele Programmierung", 5, "pflicht", null, 4, "passed", 1.7],
  ["Grundlagen der Robotik", 5, "wahl", "wahl-wpb", 4, "passed", 1.7],
  ["Data Mining und Maschinelles Lernen", 5, "wahl", "wahl-wpb", 4, "passed", 2.0],
  ["Seminar: Usable Security", 3, "wahl", "wahl-sbl", 4, "passed", 1.0],
  ["Teamprojekt Softwareentwicklung", 9, "pflicht", null, 5, "enrolled", null],
  ["Informatik und Gesellschaft", 3, "pflicht", null, 5, "enrolled", null],
  ["Einführung in wissenschaftliches Arbeiten", 3, "pflicht", null, 5, "enrolled", null],
  ["Computer Vision", 6, "wahl", "wahl-wpb", 5, "enrolled", null],
  ["Praktikum in der Lehre", 5, "wahl", "wahl-sbl", 5, "enrolled", null],
  ["Spanisch A2 (Sprachenzentrum)", 3, "generale", null, 5, "enrolled", null],
  ["Bachelorarbeit", 12, "thesis", null, 6, "planned", null],
  ["Deep Learning: Architectures & Methods", 6, "wahl", "wahl-fp", 6, "planned", null],
  ["Projektpraktikum Robotik", 6, "wahl", "wahl-sbl", 6, "planned", null],
  ["Natural Language Processing and the Web", 6, "wahl", "wahl-fp", null, "planned", null],
  ["Formale Methoden im Softwareentwurf", 5, "wahl", "wahl-wpb", null, "planned", null],
];

/** A filled B.Sc. Informatik plan, so people can try the planner before entering their own data. */
export function samplePlan(today: Date = new Date()): Plan {
  const template = PROGRAM_TEMPLATES[0];
  // Start four terms before the current one, so the sample student is in the 5th semester.
  const now = currentTerm(today);
  const startYear = now.season === "WiSe" ? now.year - 2 : now.year - 3;
  const start: Term = now.season === "WiSe" ? { season: "WiSe", year: startYear } : { season: "SoSe", year: startYear + 1 };
  const plan = planFromTemplate(template, start);
  const modules: Module[] = SAMPLE_BSC_INFORMATIK.map(([title, credits, areaId, subAreaId, semester, status, grade]) => ({
    id: makeId(),
    title,
    credits,
    areaId,
    subAreaId,
    semester,
    status,
    grade,
  }));
  return { ...plan, modules };
}
