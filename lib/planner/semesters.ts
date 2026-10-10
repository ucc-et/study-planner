import type { StudyMode, Term } from "./types";

// TU Darmstadt: Wintersemester 1 Oct – 31 Mar, Sommersemester 1 Apr – 30 Sep.
export function currentTerm(today: Date = new Date()): Term {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  if (month >= 10) return { season: "WiSe", year };
  if (month <= 3) return { season: "WiSe", year: year - 1 };
  return { season: "SoSe", year };
}

function termIndex(t: Term): number {
  // SoSe 2025 comes right after WiSe 2024/25.
  return t.season === "WiSe" ? t.year * 2 : (t.year - 1) * 2 + 1;
}

function termFromIndex(i: number): Term {
  return i % 2 === 0 ? { season: "WiSe", year: i / 2 } : { season: "SoSe", year: (i - 1) / 2 + 1 };
}

/** Term of the n-th Fachsemester (1-based). */
export function termOfSemester(start: Term, n: number): Term {
  return termFromIndex(termIndex(start) + n - 1);
}

/** Current Fachsemester (1-based, at least 1). */
export function currentSemester(start: Term, today: Date = new Date()): number {
  return Math.max(1, termIndex(currentTerm(today)) - termIndex(start) + 1);
}

export function termLabel(t: Term, long = false): string {
  if (t.season === "SoSe") return `SoSe ${long ? t.year : String(t.year).slice(2)}`;
  const next = t.year + 1;
  return long ? `WiSe ${t.year}/${String(next).slice(2)}` : `WiSe ${String(t.year).slice(2)}/${String(next).slice(2)}`;
}

export function semesterLabel(start: Term, n: number, long = false): string {
  return termLabel(termOfSemester(start, n), long);
}

export function creditsPerSemester(mode: StudyMode): number {
  return mode === "full" ? 30 : 20;
}

/** Recent and upcoming terms, for picking the study start. */
export function startTermOptions(today: Date = new Date()): Term[] {
  const now = termIndex(currentTerm(today));
  const out: Term[] = [];
  for (let i = now + 1; i >= now - 12; i--) out.push(termFromIndex(i));
  return out;
}

export function sameTerm(a: Term, b: Term): boolean {
  return a.season === b.season && a.year === b.year;
}
