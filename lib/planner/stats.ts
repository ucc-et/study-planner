import { creditsPerSemester, semesterLabel } from "./semesters";
import type { Area, Module, Plan, SubArea } from "./types";

export type Tally = {
  passed: number;
  enrolled: number;
  planned: number;
  /** passed + enrolled + planned (what counts towards the plan) */
  total: number;
  count: number;
};

export type Tone = "success" | "neutral" | "warning" | "danger";

export type RangeState = {
  tone: Tone;
  label: string;
  /** Credits still missing to reach min / max (0 when reached). */
  missingMin: number;
  missingMax: number | null;
};

/** Planned modules without semester sit on the Merkzettel and don't count yet. Failed modules never count. */
export function isParked(m: Module): boolean {
  return m.status === "planned" && m.semester == null;
}

export function counts(m: Module): boolean {
  return m.status !== "failed" && !isParked(m);
}

export function tally(modules: Module[]): Tally {
  const t: Tally = { passed: 0, enrolled: 0, planned: 0, total: 0, count: 0 };
  for (const m of modules) {
    if (!counts(m)) continue;
    t.count += 1;
    t.total += m.credits;
    if (m.status === "passed") t.passed += m.credits;
    else if (m.status === "enrolled") t.enrolled += m.credits;
    else t.planned += m.credits;
  }
  return t;
}

export function modulesOfArea(plan: Plan, areaId: string): Module[] {
  return plan.modules.filter((m) => m.areaId === areaId);
}

export function modulesOfSubArea(plan: Plan, subAreaId: string): Module[] {
  return plan.modules.filter((m) => m.subAreaId === subAreaId);
}

export function rangeState(t: Tally, min: number | null, max: number | null): RangeState {
  const lo = min ?? 0;
  const missingMin = Math.max(lo - t.total, 0);
  const missingMax = max == null ? null : Math.max(max - t.total, 0);
  if (max != null && t.total > max) {
    return { tone: "danger", label: `${t.total - max} CP über Maximum`, missingMin, missingMax };
  }
  if (lo > 0 && t.passed >= lo) return { tone: "success", label: "Erfüllt", missingMin, missingMax };
  if (t.total >= lo && (lo > 0 || t.total > 0)) {
    return { tone: "neutral", label: "Vollständig geplant", missingMin, missingMax };
  }
  if (lo === 0) return { tone: "neutral", label: "Optional", missingMin, missingMax };
  const label =
    missingMax == null || missingMax === missingMin
      ? `Noch ${missingMin} CP einplanen`
      : `Noch ${missingMin}–${missingMax} CP einplanen`;
  return { tone: "warning", label, missingMin, missingMax };
}

export function formatRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "beliebig";
  if (min == null) return `max. ${max}`;
  if (max == null) return `mind. ${min}`;
  return min === max ? `${min}` : `${min}–${max}`;
}

export function areaRange(a: Area): string {
  return formatRange(a.minCredits, a.maxCredits);
}

export function subAreaRange(s: SubArea): string {
  return formatRange(s.minCredits, s.maxCredits);
}

export function hasRule(s: SubArea): boolean {
  return s.minCredits != null || s.maxCredits != null;
}

export function breakdown(t: Tally): string {
  const parts: string[] = [];
  if (t.passed) parts.push(`${t.passed} bestanden`);
  if (t.enrolled) parts.push(`${t.enrolled} laufen`);
  if (t.planned) parts.push(`${t.planned} geplant`);
  return parts.join(" · ") || "noch nichts eingeplant";
}

export function gradeAverage(modules: Module[]): { value: number; count: number } | null {
  const graded = modules.filter((m) => m.status === "passed" && m.grade != null && m.credits > 0);
  const credits = graded.reduce((acc, m) => acc + m.credits, 0);
  if (!credits) return null;
  const sum = graded.reduce((acc, m) => acc + m.credits * (m.grade as number), 0);
  return { value: sum / credits, count: graded.length };
}

export function formatGrade(g: number): string {
  return g.toFixed(1).replace(".", ",");
}

export function formatAverage(g: number): string {
  return g.toFixed(2).replace(".", ",");
}

export function semesterCredits(plan: Plan, n: number): number {
  return plan.modules.filter((m) => m.semester === n && m.status !== "failed").reduce((acc, m) => acc + m.credits, 0);
}

/** Highest semester number that should get a column. */
export function semesterColumns(plan: Plan): number {
  const used = plan.modules.reduce((acc, m) => Math.max(acc, m.semester ?? 0), 0);
  return Math.max(plan.semesterCount, used, 1);
}

/**
 * Earliest semester in which the plan can be finished: the last scheduled semester, plus extra
 * semesters for credits that are still missing (at the recommended load per semester).
 */
export function graduationForecast(plan: Plan): { semester: number; missing: number } | null {
  const scheduled = plan.modules.filter((m) => counts(m) && m.semester != null);
  if (!scheduled.length) return null;
  const last = Math.max(...scheduled.map((m) => m.semester as number));
  const missing = Math.max(plan.program.totalCredits - tally(plan.modules).total, 0);
  const limit = creditsPerSemester(plan.studyMode);
  const free = Math.max(limit - semesterCredits(plan, last), 0);
  const extra = missing > free ? Math.ceil((missing - free) / limit) : 0;
  return { semester: last + extra, missing };
}

export type NextStep = {
  id: string;
  tone: "warning" | "info" | "success" | "danger";
  title: string;
  description: string;
  action?: { label: string; target: "semester" | "modules" | "add" | "structure"; areaId?: string; subAreaId?: string | null };
};

export function nextSteps(plan: Plan): NextStep[] {
  const steps: NextStep[] = [];
  const parked = plan.modules.filter(isParked);

  if (!plan.areas.length) {
    steps.push({
      id: "no-areas",
      tone: "info",
      title: "Lege die Bereiche deines Studiengangs an",
      description: "Unter „Struktur“ trägst du Bereiche und ihre CP-Spannen aus deiner Prüfungsordnung ein.",
      action: { label: "Zur Struktur", target: "structure" },
    });
    return steps;
  }

  for (const area of plan.areas) {
    const t = tally(modulesOfArea(plan, area.id));
    const s = rangeState(t, area.minCredits, area.maxCredits);
    if (s.tone === "danger") {
      steps.push({
        id: `over-${area.id}`,
        tone: "danger",
        title: `${area.name}: ${s.label}`,
        description: `Erlaubt sind ${areaRange(area)} CP, eingeplant sind ${t.total} CP. Überzählige Module zählen nicht.`,
        action: { label: "Module ansehen", target: "modules", areaId: area.id },
      });
    } else if (s.tone === "warning") {
      const candidates = parked.filter((m) => m.areaId === area.id);
      const hint = candidates.length
        ? ` Auf deinem Merkzettel ${candidates.length === 1 ? "liegt 1 passendes Modul" : `liegen ${candidates.length} passende Module`} (${candidates.reduce((a, m) => a + m.credits, 0)} CP).`
        : "";
      steps.push({
        id: `gap-${area.id}`,
        tone: "warning",
        title: `${area.name}: ${s.label.replace("Noch", "noch")}`,
        description: `Ziel sind ${areaRange(area)} CP, eingeplant sind ${t.total} CP.${hint}`,
        action: candidates.length
          ? { label: "Merkzettel öffnen", target: "semester" }
          : { label: "Modul hinzufügen", target: "add", areaId: area.id },
      });
    }
    for (const sub of area.subAreas) {
      if (!hasRule(sub)) continue;
      const st = tally(modulesOfSubArea(plan, sub.id));
      const ss = rangeState(st, sub.minCredits, sub.maxCredits);
      if (ss.tone === "danger" || ss.tone === "warning") {
        steps.push({
          id: `sub-${sub.id}`,
          tone: ss.tone,
          title: `${area.name} › ${sub.name}: ${ss.label.replace("Noch", "noch")}`,
          description: `Regel: ${subAreaRange(sub)} CP, eingeplant sind ${st.total} CP.`,
          action: { label: "Modul hinzufügen", target: "add", areaId: area.id, subAreaId: sub.id },
        });
      }
    }
  }

  const limit = creditsPerSemester(plan.studyMode);
  for (let n = 1; n <= semesterColumns(plan); n++) {
    const cp = semesterCredits(plan, n);
    if (cp > limit + 6) {
      steps.push({
        id: `load-${n}`,
        tone: "info",
        title: `${n}. Semester ist mit ${cp} CP sehr voll`,
        description: `Richtwert sind ${limit} CP pro Semester (${semesterLabel(plan.startTerm, n, true)}).`,
        action: { label: "Zum Semesterplan", target: "semester" },
      });
    }
  }

  const missingGrades = plan.modules.filter((m) => m.status === "passed" && m.grade == null).length;
  if (missingGrades >= 3) {
    steps.push({
      id: "grades",
      tone: "info",
      title: `${missingGrades} bestandene Module ohne Note`,
      description: "Trag Noten ein, damit der geschätzte Notenschnitt aussagekräftig wird. Unbenotete Module kannst du leer lassen.",
      action: { label: "Module ansehen", target: "modules" },
    });
  }

  const done = plan.areas.filter((a) => {
    const t = tally(modulesOfArea(plan, a.id));
    const s = rangeState(t, a.minCredits, a.maxCredits);
    return s.tone === "success" || (s.tone === "neutral" && t.total > 0);
  });
  for (const a of done.slice(0, Math.max(0, 4 - steps.length))) {
    const t = tally(modulesOfArea(plan, a.id));
    const s = rangeState(t, a.minCredits, a.maxCredits);
    steps.push({
      id: `ok-${a.id}`,
      tone: "success",
      title: s.tone === "success" ? `${a.name} ist erfüllt` : `${a.name} ist vollständig geplant`,
      description: `${t.total} von ${areaRange(a)} CP · ${breakdown(t)}.`,
    });
  }
  return steps;
}
