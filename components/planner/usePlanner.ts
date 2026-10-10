"use client";

import * as React from "react";

import { AREA_COLORS, loadPlan, savePlan, THEME_KEY } from "../../lib/planner/storage";
import { areasFromTemplate, findTemplate } from "../../lib/planner/templates";
import type { Area, Module, Plan, Program, SubArea, ThemePreference } from "../../lib/planner/types";
import { makeId } from "../../lib/planner/utils";

export type ModuleDraft = Omit<Module, "id">;

export function usePlanner() {
  const [plan, setPlanState] = React.useState<Plan | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    // localStorage only exists in the browser, so the plan is read after mount.
    setPlanState(loadPlan());
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (loaded) savePlan(plan);
  }, [plan, loaded]);

  const update = React.useCallback((fn: (p: Plan) => Plan) => {
    setPlanState((prev) => (prev ? fn(prev) : prev));
  }, []);

  const actions = React.useMemo(
    () => ({
      setPlan: (p: Plan | null) => setPlanState(p),

      addModule: (draft: ModuleDraft): Module => {
        const m: Module = { ...draft, id: makeId() };
        update((p) => ({ ...p, modules: [...p.modules, m] }));
        return m;
      },
      updateModule: (id: string, patch: Partial<ModuleDraft>) =>
        update((p) => ({ ...p, modules: p.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteModule: (id: string) => update((p) => ({ ...p, modules: p.modules.filter((m) => m.id !== id) })),
      restoreModule: (m: Module, index: number) =>
        update((p) => {
          const modules = [...p.modules];
          modules.splice(Math.min(index, modules.length), 0, m);
          return { ...p, modules };
        }),
      moveModule: (id: string, semester: number | null) =>
        update((p) => ({
          ...p,
          modules: p.modules.map((m) => (m.id === id ? { ...m, semester } : m)),
          semesterCount: Math.max(p.semesterCount, semester ?? 0),
        })),

      updateProgram: (patch: Partial<Program>) => update((p) => ({ ...p, program: { ...p.program, ...patch } })),
      updatePlan: (patch: Partial<Pick<Plan, "startTerm" | "studyMode" | "semesterCount">>) => update((p) => ({ ...p, ...patch })),

      addArea: () =>
        update((p) => {
          const used = new Set(p.areas.map((a) => a.color));
          const color = AREA_COLORS.find((c) => !used.has(c)) ?? AREA_COLORS[p.areas.length % AREA_COLORS.length];
          const area: Area = { id: makeId(), name: "Neuer Bereich", color, minCredits: 0, maxCredits: 0, subAreas: [] };
          return { ...p, areas: [...p.areas, area] };
        }),
      updateArea: (id: string, patch: Partial<Omit<Area, "id" | "subAreas">>) =>
        update((p) => ({ ...p, areas: p.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      moveArea: (id: string, dir: -1 | 1) =>
        update((p) => {
          const i = p.areas.findIndex((a) => a.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= p.areas.length) return p;
          const areas = [...p.areas];
          [areas[i], areas[j]] = [areas[j], areas[i]];
          return { ...p, areas };
        }),
      deleteArea: (id: string) =>
        update((p) => ({ ...p, areas: p.areas.filter((a) => a.id !== id), modules: p.modules.filter((m) => m.areaId !== id) })),

      addSubArea: (areaId: string) =>
        update((p) => ({
          ...p,
          areas: p.areas.map((a) =>
            a.id === areaId
              ? { ...a, subAreas: [...a.subAreas, { id: makeId(), name: "Neuer Teilbereich", minCredits: null, maxCredits: null }] }
              : a,
          ),
        })),
      updateSubArea: (areaId: string, subId: string, patch: Partial<Omit<SubArea, "id">>) =>
        update((p) => ({
          ...p,
          areas: p.areas.map((a) =>
            a.id === areaId ? { ...a, subAreas: a.subAreas.map((s) => (s.id === subId ? { ...s, ...patch } : s)) } : a,
          ),
        })),
      deleteSubArea: (areaId: string, subId: string) =>
        update((p) => ({
          ...p,
          areas: p.areas.map((a) => (a.id === areaId ? { ...a, subAreas: a.subAreas.filter((s) => s.id !== subId) } : a)),
          // Modules stay in the area, just without the sub-area.
          modules: p.modules.map((m) => (m.subAreaId === subId ? { ...m, subAreaId: null } : m)),
        })),

      resetStructure: () =>
        update((p) => {
          const t = findTemplate(p.program.templateId);
          if (!t) return p;
          const areas = areasFromTemplate(t);
          const modules = p.modules.map((m) => {
            const area = areas.find((a) => a.id === m.areaId) ?? areas[0];
            const sub = area.subAreas.find((s) => s.id === m.subAreaId) ?? null;
            return { ...m, areaId: area.id, subAreaId: sub ? sub.id : null };
          });
          return {
            ...p,
            areas,
            modules,
            program: { ...p.program, totalCredits: t.totalCredits, standardSemesters: t.standardSemesters, source: t.source },
          };
        }),
    }),
    [update],
  );

  return { plan, loaded, ...actions };
}

export type PlannerActions = Omit<ReturnType<typeof usePlanner>, "plan" | "loaded">;

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
function applyTheme(pref: ThemePreference) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function useTheme() {
  const [pref, setPref] = React.useState<ThemePreference>("system");

  React.useEffect(() => {
    let stored: ThemePreference = "system";
    try {
      const v = window.localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {
      // ignore
    }
    setPref(stored);
  }, []);

  React.useEffect(() => {
    applyTheme(pref);
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const choose = React.useCallback((next: ThemePreference) => {
    setPref(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return { theme: pref, setTheme: choose };
}
