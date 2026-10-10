export type AreaColor =
  | "blue"
  | "green"
  | "pink"
  | "orange"
  | "teal"
  | "violet"
  | "amber"
  | "slate";

export type ModuleStatus = "planned" | "enrolled" | "passed" | "failed";

export type StudyMode = "full" | "part";

export type Season = "WiSe" | "SoSe";

/** A term. For WiSe, `year` is the year it starts in (WiSe 2024 = WiSe 2024/25). */
export type Term = {
  season: Season;
  year: number;
};

/** Optional "davon" rule inside an area, e.g. "davon 9–18 CP Studienbegleitende Leistungen". */
export type SubArea = {
  id: string;
  name: string;
  minCredits: number | null;
  maxCredits: number | null;
};

/** Top-level block of a study regulation with a credit range, e.g. "Wahlbereich 48–49 CP". */
export type Area = {
  id: string;
  name: string;
  color: AreaColor;
  minCredits: number;
  maxCredits: number;
  subAreas: SubArea[];
};

export type Program = {
  templateId: string | null;
  degree: string;
  name: string;
  regulation: string;
  source: string | null;
  totalCredits: number;
  standardSemesters: number;
};

/** The only thing students fill in. Credit points are awarded per module. */
export type Module = {
  id: string;
  title: string;
  credits: number;
  areaId: string;
  subAreaId: string | null;
  /** null = Merkzettel (not scheduled yet) */
  semester: number | null;
  status: ModuleStatus;
  /** 1.0–5.0, only meaningful when passed */
  grade: number | null;
};

export type Plan = {
  version: 2;
  program: Program;
  areas: Area[];
  modules: Module[];
  startTerm: Term;
  studyMode: StudyMode;
  /** Number of semester columns shown in the semester plan. */
  semesterCount: number;
};

export type View = "overview" | "semester" | "modules" | "structure";

export type ThemePreference = "system" | "light" | "dark";
