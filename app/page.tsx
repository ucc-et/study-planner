"use client";

import * as React from "react";

type CreditConstraint = {
  minCredits: number | null;
  maxCredits: number | null;
};

type PlannerEvent = {
  id: string;
  title: string;
  credits: number;
  pending: boolean;
};

type SubsectionTemplate = {
  id: string;
  title: string;
  constraints: CreditConstraint;
};

type SectionTemplate = {
  id: string;
  title: string;
  constraints: CreditConstraint;
  subsections: SubsectionTemplate[];
};

type PlannerTemplateV1 = {
  version: 1;
  sections: SectionTemplate[];
};

type FilledValuesV1 = {
  version: 1;
  eventsBySubsectionId: Record<string, PlannerEvent[]>;
};

type FilledPlanBundleV1 = {
  version: 1;
  template: PlannerTemplateV1;
  eventsBySubsectionId: Record<string, PlannerEvent[]>;
};

type ViewMode = "template" | "fill";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID() as string;
  }
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function defaultConstraints(): CreditConstraint {
  return { minCredits: null, maxCredits: null };
}

function clampCredits(n: unknown): number {
  const asNumber = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(asNumber)) return 0;
  return Math.max(0, Math.round(asNumber * 100) / 100);
}

function parseMaybeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatConstraint(c: CreditConstraint): string {
  const min = c.minCredits;
  const max = c.maxCredits;
  if (min == null && max == null) return "No constraints";
  if (min != null && max != null) return `${min}–${max} credits`;
  if (min != null) return `≥ ${min} credits`;
  return `≤ ${max} credits`;
}

function validateCredits(total: number, c: CreditConstraint): string | null {
  if (c.minCredits != null && total < c.minCredits) {
    return `Needs at least ${c.minCredits} credits (currently ${total}).`;
  }
  if (c.maxCredits != null && total > c.maxCredits) {
    return `Must be at most ${c.maxCredits} credits (currently ${total}).`;
  }
  return null;
}

function sumCredits(events: PlannerEvent[]): number {
  return events.reduce((acc, e) => acc + (Number.isFinite(e.credits) ? e.credits : 0), 0);
}

function sumSectionCredits(section: SectionTemplate, eventsBySubsectionId: Record<string, PlannerEvent[]>): number {
  return section.subsections.reduce((acc, sub) => acc + sumCredits(eventsBySubsectionId[sub.id] ?? []), 0);
}

function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeTemplate(data: unknown): PlannerTemplateV1 {
  const asObj = (data ?? {}) as Record<string, unknown>;
  const rawSections = Array.isArray(asObj.sections)
    ? asObj.sections
    : Array.isArray(data)
      ? (data as unknown[])
      : [];

  const sections: SectionTemplate[] = rawSections
    .map((raw) => {
      const s = (raw ?? {}) as Record<string, unknown>;
      const rawSubsections = Array.isArray(s.subsections) ? s.subsections : [];
      const constraintsObj = (s.constraints ?? {}) as Record<string, unknown>;

      const section: SectionTemplate = {
        id: typeof s.id === "string" && s.id ? s.id : makeId(),
        title: typeof s.title === "string" ? s.title : "Untitled section",
        constraints: {
          minCredits:
            typeof constraintsObj.minCredits === "number" && Number.isFinite(constraintsObj.minCredits)
              ? constraintsObj.minCredits
              : null,
          maxCredits:
            typeof constraintsObj.maxCredits === "number" && Number.isFinite(constraintsObj.maxCredits)
              ? constraintsObj.maxCredits
              : null,
        },
        subsections: rawSubsections.map((rawSub) => {
          const sub = (rawSub ?? {}) as Record<string, unknown>;
          const subConstraintsObj = (sub.constraints ?? {}) as Record<string, unknown>;
          const subsection: SubsectionTemplate = {
            id: typeof sub.id === "string" && sub.id ? sub.id : makeId(),
            title: typeof sub.title === "string" ? sub.title : "Untitled subsection",
            constraints: {
              minCredits:
                typeof subConstraintsObj.minCredits === "number" && Number.isFinite(subConstraintsObj.minCredits)
                  ? subConstraintsObj.minCredits
                  : null,
              maxCredits:
                typeof subConstraintsObj.maxCredits === "number" && Number.isFinite(subConstraintsObj.maxCredits)
                  ? subConstraintsObj.maxCredits
                  : null,
            },
          };
          return subsection;
        }),
      };
      return section;
    })
    .filter(Boolean);

  return { version: 1, sections };
}

function normalizeFilledValues(data: unknown, template: PlannerTemplateV1): FilledValuesV1 {
  const asObj = (data ?? {}) as Record<string, unknown>;
  const rawMap = (asObj.eventsBySubsectionId ?? {}) as Record<string, unknown>;
  const allowedSubsectionIds = new Set(
    template.sections.flatMap((s) => s.subsections.map((sub) => sub.id)),
  );

  const eventsBySubsectionId: Record<string, PlannerEvent[]> = {};

  for (const [subsectionId, rawEvents] of Object.entries(rawMap)) {
    if (!allowedSubsectionIds.has(subsectionId)) continue;
    if (!Array.isArray(rawEvents)) continue;

    eventsBySubsectionId[subsectionId] = rawEvents.map((rawEvent) => {
      const ev = (rawEvent ?? {}) as Record<string, unknown>;
      return {
        id: typeof ev.id === "string" && ev.id ? ev.id : makeId(),
        title: typeof ev.title === "string" ? ev.title : "Untitled event",
        credits: clampCredits(ev.credits),
        pending: typeof ev.pending === "boolean" ? ev.pending : false,
      } satisfies PlannerEvent;
    });
  }

  return { version: 1, eventsBySubsectionId };
}

function sampleTemplate(): PlannerTemplateV1 {
  return {
    version: 1,
    sections: [
      {
        id: makeId(),
        title: "Core",
        constraints: { minCredits: 12, maxCredits: 18 },
        subsections: [
          {
            id: makeId(),
            title: "Math",
            constraints: { minCredits: 6, maxCredits: 9 },
          },
        ],
      },
    ],
  };
}

function ConstraintEditor({
  constraints,
  onChange,
}: {
  constraints: CreditConstraint;
  onChange: (next: CreditConstraint) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600">Min credits</span>
        <input
          className="w-36 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          inputMode="decimal"
          placeholder="(none)"
          value={constraints.minCredits ?? ""}
          onChange={(e) => onChange({ ...constraints, minCredits: parseMaybeNumber(e.target.value) })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600">Max credits</span>
        <input
          className="w-36 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          inputMode="decimal"
          placeholder="(none)"
          value={constraints.maxCredits ?? ""}
          onChange={(e) => onChange({ ...constraints, maxCredits: parseMaybeNumber(e.target.value) })}
        />
      </label>
      <div className="text-xs text-zinc-500">{formatConstraint(constraints)}</div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = React.useState<ViewMode>("template");
  const [template, setTemplate] = React.useState<PlannerTemplateV1>(() => sampleTemplate());
  const [eventsBySubsectionId, setEventsBySubsectionId] = React.useState<Record<string, PlannerEvent[]>>({});
  const [collapsedSectionIds, setCollapsedSectionIds] = React.useState<Record<string, boolean>>({});
  const [importError, setImportError] = React.useState<string | null>(null);
  const [valuesImportError, setValuesImportError] = React.useState<string | null>(null);

  const totalCredits = React.useMemo(() => {
    return template.sections.reduce((acc, s) => acc + sumSectionCredits(s, eventsBySubsectionId), 0);
  }, [eventsBySubsectionId, template.sections]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">study-planner</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Build sections → subsections → events, and enforce min/max credit constraints.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <span>Import Template</span>
              <input
                className="hidden"
                type="file"
                accept="application/json"
                onChange={async (e) => {
                  setImportError(null);
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    const text = await file.text();
                    const parsed = JSON.parse(text) as unknown;
                    const normalized = normalizeTemplate(parsed);
                    setTemplate(normalized);
                    setEventsBySubsectionId({});
                    setCollapsedSectionIds({});
                    setValuesImportError(null);
                  } catch {
                    setImportError("Could not import: invalid JSON/template.");
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
            </label>

            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              onClick={() => {
                const filename = `study-planner-template-${new Date().toISOString().slice(0, 10)}.json`;
                downloadJson(filename, template);
              }}
              type="button"
            >
              Export Template
            </button>

            {view === "fill" ? (
              <>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                  <span>Import Values</span>
                  <input
                    className="hidden"
                    type="file"
                    accept="application/json"
                    onChange={async (e) => {
                      setValuesImportError(null);
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const text = await file.text();
                        const parsed = JSON.parse(text) as unknown;
                        const parsedObj = (parsed ?? {}) as Record<string, unknown>;

                        // If the file bundles a template, load it first.
                        const bundledTemplateRaw = parsedObj.template as unknown;
                        if (bundledTemplateRaw != null) {
                          const nextTemplate = normalizeTemplate(bundledTemplateRaw);
                          setTemplate(nextTemplate);
                          setCollapsedSectionIds({});

                          const normalized = normalizeFilledValues(parsed, nextTemplate);
                          setEventsBySubsectionId(normalized.eventsBySubsectionId);
                        } else {
                          // Back-compat: values-only JSON
                          const normalized = normalizeFilledValues(parsed, template);
                          setEventsBySubsectionId(normalized.eventsBySubsectionId);
                        }
                      } catch {
                        setValuesImportError("Could not import values: invalid JSON.");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                </label>

                <button
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  onClick={() => {
                    const payload: FilledPlanBundleV1 = {
                      version: 1,
                      template,
                      eventsBySubsectionId,
                    };
                    const filename = `study-planner-plan-${new Date().toISOString().slice(0, 10)}.json`;
                    downloadJson(filename, payload);
                  }}
                  type="button"
                >
                  Export Values
                </button>
              </>
            ) : null}
          </div>
        </header>

        {importError ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {importError}
          </div>
        ) : null}

        {view === "fill" && valuesImportError ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {valuesImportError}
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={
                view === "template"
                  ? "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                  : "rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              }
              onClick={() => setView("template")}
              type="button"
            >
              Template Editor
            </button>
            <button
              className={
                view === "fill"
                  ? "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                  : "rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              }
              onClick={() => setView("fill")}
              type="button"
            >
              Filling View
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Total credits:</span>{" "}
              <span className="font-semibold">{totalCredits}</span>
            </div>
            {view === "template" ? (
              <button
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={() => {
                  setTemplate((prev) => ({
                    ...prev,
                    sections: [
                      ...prev.sections,
                      {
                        id: makeId(),
                        title: `Section ${prev.sections.length + 1}`,
                        constraints: defaultConstraints(),
                        subsections: [],
                      },
                    ],
                  }));
                }}
                type="button"
              >
                Add Section
              </button>
            ) : null}
          </div>
        </div>

        {view === "fill" && template.sections.length > 0 ? (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Section totals</div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  onClick={() => {
                    setCollapsedSectionIds((prev) => {
                      const next: Record<string, boolean> = { ...prev };
                      for (const s of template.sections) next[s.id] = true;
                      return next;
                    });
                  }}
                  type="button"
                >
                  Collapse all
                </button>
                <button
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  onClick={() => setCollapsedSectionIds({})}
                  type="button"
                >
                  Expand all
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {template.sections.map((s) => {
                const credits = sumSectionCredits(s, eventsBySubsectionId);
                const issue = validateCredits(credits, s.constraints);
                const collapsed = !!collapsedSectionIds[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-left shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-900"
                    onClick={() =>
                      setCollapsedSectionIds((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                    }
                    title="Toggle collapse"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{s.title}</div>
                        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {formatConstraint(s.constraints)}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="text-sm font-semibold">{credits}</div>
                        <div
                          className={
                            issue
                              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                              : "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          }
                        >
                          {issue ? "Not met" : "OK"}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {collapsed ? "Collapsed" : "Expanded"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          {template.sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              No sections yet. Click “Add Section”.
            </div>
          ) : null}

          {template.sections.map((section) => {
            const sectionCredits = sumSectionCredits(section, eventsBySubsectionId);
            const sectionIssue = view === "fill" ? validateCredits(sectionCredits, section.constraints) : null;
            const isCollapsed = !!collapsedSectionIds[section.id];
            return (
              <section
                key={section.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                        onClick={() =>
                          setCollapsedSectionIds((prev) => ({
                            ...prev,
                            [section.id]: !prev[section.id],
                          }))
                        }
                        type="button"
                        aria-label={isCollapsed ? "Expand section" : "Collapse section"}
                        title={isCollapsed ? "Expand" : "Collapse"}
                      >
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>
                      <input
                        className="w-full max-w-md rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                        value={section.title}
                        onChange={(e) => {
                          const nextTitle = e.target.value;
                          setTemplate((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) =>
                              s.id === section.id ? { ...s, title: nextTitle } : s,
                            ),
                          }));
                        }}
                        disabled={view === "fill"}
                      />
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                        {sectionCredits} credits
                      </span>
                      {view === "fill" ? (
                        sectionIssue ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            Constraint not met
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                            OK
                          </span>
                        )
                      ) : null}
                    </div>
                    {view === "fill" && sectionIssue ? (
                      <div className="text-sm text-amber-800 dark:text-amber-200">{sectionIssue}</div>
                    ) : (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Section constraints: {formatConstraint(section.constraints)}
                      </div>
                    )}
                    {view === "template" ? (
                      <ConstraintEditor
                        constraints={section.constraints}
                        onChange={(next) => {
                          setTemplate((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) =>
                              s.id === section.id ? { ...s, constraints: next } : s,
                            ),
                          }));
                        }}
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {view === "template" ? (
                      <>
                        <button
                          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                          onClick={() => {
                            setTemplate((prev) => ({
                              ...prev,
                              sections: prev.sections.map((s) =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      subsections: [
                                        ...s.subsections,
                                        {
                                          id: makeId(),
                                          title: `Subsection ${s.subsections.length + 1}`,
                                          constraints: defaultConstraints(),
                                        },
                                      ],
                                    }
                                  : s,
                              ),
                            }));
                          }}
                          type="button"
                        >
                          Add Subsection
                        </button>
                        <button
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
                          onClick={() => {
                            setTemplate((prev) => ({
                              ...prev,
                              sections: prev.sections.filter((s) => s.id !== section.id),
                            }));
                            setEventsBySubsectionId((prev) => {
                              const next = { ...prev };
                              for (const sub of section.subsections) {
                                delete next[sub.id];
                              }
                              return next;
                            });
                          }}
                          type="button"
                        >
                          Remove Section
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {isCollapsed ? null : (
                  <div className="mt-5 space-y-4">
                  {section.subsections.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-black dark:text-zinc-400">
                      No subsections yet. Click “Add Subsection”.
                    </div>
                  ) : null}

                  {section.subsections.map((sub) => {
                    const subEvents = eventsBySubsectionId[sub.id] ?? [];
                    const subCredits = sumCredits(subEvents);
                    const subIssue = view === "fill" ? validateCredits(subCredits, sub.constraints) : null;

                    return (
                      <div
                        key={sub.id}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                className="w-full max-w-md rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                                value={sub.title}
                                onChange={(e) => {
                                  const nextTitle = e.target.value;
                                  setTemplate((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s) =>
                                      s.id !== section.id
                                        ? s
                                        : {
                                            ...s,
                                            subsections: s.subsections.map((ss) =>
                                              ss.id === sub.id ? { ...ss, title: nextTitle } : ss,
                                            ),
                                          },
                                    ),
                                  }));
                                }}
                                disabled={view === "fill"}
                              />
                              <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                                {subCredits} credits
                              </span>
                              {view === "fill" ? (
                                subIssue ? (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                    Constraint not met
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                                    OK
                                  </span>
                                )
                              ) : null}
                            </div>
                            {view === "fill" && subIssue ? (
                              <div className="text-sm text-amber-800 dark:text-amber-200">{subIssue}</div>
                            ) : (
                              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                Subsection constraints: {formatConstraint(sub.constraints)}
                              </div>
                            )}

                            {view === "template" ? (
                              <ConstraintEditor
                                constraints={sub.constraints}
                                onChange={(next) => {
                                  setTemplate((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s) =>
                                      s.id !== section.id
                                        ? s
                                        : {
                                            ...s,
                                            subsections: s.subsections.map((ss) =>
                                              ss.id === sub.id ? { ...ss, constraints: next } : ss,
                                            ),
                                          },
                                    ),
                                  }));
                                }}
                              />
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {view === "template" ? (
                              <button
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
                                onClick={() => {
                                  setTemplate((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s) =>
                                      s.id !== section.id
                                        ? s
                                        : {
                                            ...s,
                                            subsections: s.subsections.filter((ss) => ss.id !== sub.id),
                                          },
                                    ),
                                  }));
                                  setEventsBySubsectionId((prev) => {
                                    const next = { ...prev };
                                    delete next[sub.id];
                                    return next;
                                  });
                                }}
                                type="button"
                              >
                                Remove Subsection
                              </button>
                            ) : (
                              <button
                                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                                onClick={() => {
                                  setEventsBySubsectionId((prev) => {
                                    const existing = prev[sub.id] ?? [];
                                    const nextEvent: PlannerEvent = {
                                      id: makeId(),
                                      title: `Event ${existing.length + 1}`,
                                      credits: 0,
                                      pending: true,
                                    };
                                    return { ...prev, [sub.id]: [...existing, nextEvent] };
                                  });
                                }}
                                type="button"
                              >
                                Add Event
                              </button>
                            )}
                          </div>
                        </div>

                        {view === "fill" ? (
                          <div className="mt-4 space-y-3">
                            {subEvents.length === 0 ? (
                              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                                No events yet. Click “Add Event”.
                              </div>
                            ) : null}

                            {subEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center"
                              >
                                <input
                                  className="w-full flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                                  value={ev.title}
                                  onChange={(e) => {
                                    const nextTitle = e.target.value;
                                    setEventsBySubsectionId((prev) => {
                                      const existing = prev[sub.id] ?? [];
                                      return {
                                        ...prev,
                                        [sub.id]: existing.map((ee) =>
                                          ee.id === ev.id ? { ...ee, title: nextTitle } : ee,
                                        ),
                                      };
                                    });
                                  }}
                                  placeholder="Event title"
                                />

                                <label className="flex items-center gap-2 text-sm">
                                  <span className="text-zinc-600 dark:text-zinc-400">Credits</span>
                                  <input
                                    className="w-28 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                                    inputMode="decimal"
                                    value={Number.isFinite(ev.credits) ? ev.credits : 0}
                                    onChange={(e) => {
                                      const nextCredits = clampCredits(e.target.value);
                                      setEventsBySubsectionId((prev) => {
                                        const existing = prev[sub.id] ?? [];
                                        return {
                                          ...prev,
                                          [sub.id]: existing.map((ee) =>
                                            ee.id === ev.id ? { ...ee, credits: nextCredits } : ee,
                                          ),
                                        };
                                      });
                                    }}
                                  />
                                </label>

                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={ev.pending}
                                    onChange={(e) => {
                                      const nextPending = e.target.checked;
                                      setEventsBySubsectionId((prev) => {
                                        const existing = prev[sub.id] ?? [];
                                        return {
                                          ...prev,
                                          [sub.id]: existing.map((ee) =>
                                            ee.id === ev.id ? { ...ee, pending: nextPending } : ee,
                                          ),
                                        };
                                      });
                                    }}
                                  />
                                  <span className="text-zinc-600 dark:text-zinc-400">Pending</span>
                                </label>

                                <button
                                  className="self-start rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900 sm:self-auto"
                                  onClick={() => {
                                    setEventsBySubsectionId((prev) => {
                                      const existing = prev[sub.id] ?? [];
                                      return {
                                        ...prev,
                                        [sub.id]: existing.filter((ee) => ee.id !== ev.id),
                                      };
                                    });
                                  }}
                                  type="button"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
