import { currentTerm } from "./semesters";
import type { Area, AreaColor, Module, ModuleStatus, Plan, Program, SubArea, Term } from "./types";
import { clampCredits, makeId } from "./utils";

const PLAN_KEY = "ssp.plan.v2";
export const THEME_KEY = "ssp.theme";

export const AREA_COLORS: AreaColor[] = ["blue", "green", "pink", "orange", "teal", "violet", "amber", "slate"];

export function loadPlan(): Plan | null {
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    return parsePlanFile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function savePlan(plan: Plan | null) {
  try {
    if (plan) window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    else window.localStorage.removeItem(PLAN_KEY);
  } catch {
    // Storage can be unavailable (private mode, quota). The plan still lives in memory.
  }
}

// ---------------------------------------------------------------------------
// Parsing & validation
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>;
const asObj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const asStr = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const asNum = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const asId = (v: unknown): string => (typeof v === "string" && v ? v : makeId());

const STATUSES: ModuleStatus[] = ["planned", "enrolled", "passed", "failed"];

function parseTerm(v: unknown): Term {
  const o = asObj(v);
  const season = o.season === "SoSe" ? "SoSe" : o.season === "WiSe" ? "WiSe" : null;
  const year = asNum(o.year);
  return season && year ? { season, year: Math.round(year) } : currentTerm();
}

function parseSubArea(v: unknown): SubArea {
  const o = asObj(v);
  return {
    id: asId(o.id),
    name: asStr(o.name, "Teilbereich"),
    minCredits: asNum(o.minCredits),
    maxCredits: asNum(o.maxCredits),
  };
}

function parseArea(v: unknown, index: number): Area {
  const o = asObj(v);
  const min = asNum(o.minCredits) ?? 0;
  const max = asNum(o.maxCredits) ?? min;
  const color = AREA_COLORS.includes(o.color as AreaColor) ? (o.color as AreaColor) : AREA_COLORS[index % AREA_COLORS.length];
  return {
    id: asId(o.id),
    name: asStr(o.name, "Bereich"),
    color,
    minCredits: min,
    maxCredits: Math.max(max, min),
    subAreas: Array.isArray(o.subAreas) ? o.subAreas.map(parseSubArea) : [],
  };
}

function parseModule(v: unknown, areas: Area[]): Module | null {
  const o = asObj(v);
  const area = areas.find((a) => a.id === o.areaId) ?? areas[0];
  if (!area) return null;
  const sub = area.subAreas.find((s) => s.id === o.subAreaId) ?? null;
  const semester = asNum(o.semester);
  const grade = asNum(o.grade);
  return {
    id: asId(o.id),
    title: asStr(o.title, "Modul"),
    credits: clampCredits(o.credits),
    areaId: area.id,
    subAreaId: sub ? sub.id : null,
    semester: semester != null && semester >= 1 ? Math.round(semester) : null,
    status: STATUSES.includes(o.status as ModuleStatus) ? (o.status as ModuleStatus) : "planned",
    grade: grade != null && grade >= 1 && grade <= 5 ? grade : null,
  };
}

function parseProgram(v: unknown): Program {
  const o = asObj(v);
  return {
    templateId: typeof o.templateId === "string" ? o.templateId : null,
    degree: asStr(o.degree),
    name: asStr(o.name, "Mein Studiengang"),
    regulation: asStr(o.regulation),
    source: typeof o.source === "string" ? o.source : null,
    totalCredits: asNum(o.totalCredits) ?? 180,
    standardSemesters: asNum(o.standardSemesters) ?? 6,
  };
}

function parseV2(o: Raw): Plan {
  const areas = Array.isArray(o.areas) ? o.areas.map(parseArea) : [];
  const modules = (Array.isArray(o.modules) ? o.modules : [])
    .map((m) => parseModule(m, areas))
    .filter((m): m is Module => m != null);
  const program = parseProgram(o.program);
  return {
    version: 2,
    program,
    areas,
    modules,
    startTerm: parseTerm(o.startTerm),
    studyMode: o.studyMode === "part" ? "part" : "full",
    semesterCount: Math.max(1, Math.round(asNum(o.semesterCount) ?? program.standardSemesters)),
  };
}

// ---------------------------------------------------------------------------
// Migration of files exported by the old planner (version 1)
//   Section → Area, Subsection → SubArea, Event → Module, pending → enrolled
// ---------------------------------------------------------------------------

function migrateV1(o: Raw): Plan {
  const template = asObj(o.template ?? o);
  const rawSections = Array.isArray(template.sections) ? template.sections : Array.isArray(o) ? (o as unknown[]) : [];
  const events = asObj(o.eventsBySubsectionId);
  const areas: Area[] = [];
  const modules: Module[] = [];

  rawSections.forEach((rawSection, index) => {
    const s = asObj(rawSection);
    const c = asObj(s.constraints);
    const min = asNum(c.minCredits) ?? 0;
    const max = asNum(c.maxCredits) ?? Math.max(min, 0);
    const area: Area = {
      id: asId(s.id),
      name: asStr(s.title, `Bereich ${index + 1}`),
      color: AREA_COLORS[index % AREA_COLORS.length],
      minCredits: min,
      maxCredits: Math.max(max, min),
      subAreas: [],
    };
    const subs = Array.isArray(s.subsections) ? s.subsections : [];
    for (const rawSub of subs) {
      const sub = asObj(rawSub);
      const sc = asObj(sub.constraints);
      const subArea: SubArea = {
        id: asId(sub.id),
        name: asStr(sub.title, "Teilbereich"),
        minCredits: asNum(sc.minCredits),
        maxCredits: asNum(sc.maxCredits),
      };
      area.subAreas.push(subArea);
      const list = events[subArea.id];
      if (!Array.isArray(list)) continue;
      for (const rawEvent of list) {
        const ev = asObj(rawEvent);
        modules.push({
          id: asId(ev.id),
          title: asStr(ev.title, "Modul"),
          credits: clampCredits(ev.credits),
          areaId: area.id,
          subAreaId: subArea.id,
          semester: null,
          status: ev.pending === true ? "enrolled" : "passed",
          grade: null,
        });
      }
    }
    areas.push(area);
  });

  const total = areas.reduce((acc, a) => acc + a.minCredits, 0);
  return {
    version: 2,
    program: {
      templateId: null,
      degree: "",
      name: "Importierter Plan",
      regulation: "",
      source: null,
      totalCredits: total > 0 ? total : 180,
      standardSemesters: 6,
    },
    areas,
    modules,
    startTerm: currentTerm(),
    studyMode: "full",
    semesterCount: 6,
  };
}

/** Accepts plans of this version and both export formats of the old planner. */
export function parsePlanFile(data: unknown): Plan {
  const o = asObj(data);
  if (o.version === 2) return parseV2(o);
  if (o.version === 1 || Array.isArray(o.sections) || o.template != null || Array.isArray(data)) return migrateV1(o);
  throw new Error("Unbekanntes Dateiformat");
}

export function isLegacyFile(data: unknown): boolean {
  return asObj(data).version !== 2;
}
