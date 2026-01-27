"use client";

import * as React from "react";

import type {
  FilledPlanBundleV1,
  PlannerEvent,
  PlannerTemplateV1,
  SectionTemplate,
  SubsectionTemplate,
  ViewMode,
} from "../../lib/planner/types";
import {
  defaultConstraints,
  downloadJson,
  makeId,
  normalizeFilledValues,
  normalizeTemplate,
  sampleTemplate,
  sumSectionCredits,
} from "../../lib/planner/utils";
import { PlannerHeader } from "./PlannerHeader";
import { SectionCard } from "./SectionCard";
import { SectionTotalsPanel } from "./SectionTotalsPanel";
import { ViewToolbar } from "./ViewToolbar";

export default function PlannerApp() {
  const [view, setView] = React.useState<ViewMode>("template");
  const [template, setTemplate] = React.useState<PlannerTemplateV1>(() =>
    sampleTemplate(),
  );
  const [eventsBySubsectionId, setEventsBySubsectionId] = React.useState<
    Record<string, PlannerEvent[]>
  >({});
  const [collapsedSectionIds, setCollapsedSectionIds] = React.useState<
    Record<string, boolean>
  >({});
  const [importError, setImportError] = React.useState<string | null>(null);
  const [valuesImportError, setValuesImportError] = React.useState<string | null>(
    null,
  );

  const totalCredits = React.useMemo(() => {
    return template.sections.reduce(
      (acc, s) => acc + sumSectionCredits(s, eventsBySubsectionId),
      0,
    );
  }, [eventsBySubsectionId, template.sections]);

  async function onImportTemplateFile(file: File) {
    setImportError(null);
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
    }
  }

  function onExportTemplate() {
    const filename = `study-planner-template-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    downloadJson(filename, template);
  }

  async function onImportValuesFile(file: File) {
    setValuesImportError(null);
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
    }
  }

  function onExportValues() {
    const payload: FilledPlanBundleV1 = {
      version: 1,
      template,
      eventsBySubsectionId,
    };
    const filename = `study-planner-plan-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    downloadJson(filename, payload);
  }

  function addSection() {
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
  }

  function updateSection(sectionId: string, updater: (s: SectionTemplate) => SectionTemplate) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? updater(s) : s)),
    }));
  }

  function removeSection(section: SectionTemplate) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== section.id),
    }));
    setEventsBySubsectionId((prev) => {
      const next = { ...prev };
      for (const sub of section.subsections) delete next[sub.id];
      return next;
    });
    setCollapsedSectionIds((prev) => {
      const next = { ...prev };
      delete next[section.id];
      return next;
    });
  }

  function addSubsection(sectionId: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      subsections: [
        ...s.subsections,
        {
          id: makeId(),
          title: `Subsection ${s.subsections.length + 1}`,
          constraints: defaultConstraints(),
        },
      ],
    }));
  }

  function updateSubsection(
    sectionId: string,
    subsectionId: string,
    updater: (sub: SubsectionTemplate) => SubsectionTemplate,
  ) {
    updateSection(sectionId, (s) => ({
      ...s,
      subsections: s.subsections.map((sub) =>
        sub.id === subsectionId ? updater(sub) : sub,
      ),
    }));
  }

  function removeSubsection(sectionId: string, subsectionId: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      subsections: s.subsections.filter((sub) => sub.id !== subsectionId),
    }));
    setEventsBySubsectionId((prev) => {
      const next = { ...prev };
      delete next[subsectionId];
      return next;
    });
  }

  function addEvent(subsectionId: string) {
    setEventsBySubsectionId((prev) => {
      const existing = prev[subsectionId] ?? [];
      const nextEvent: PlannerEvent = {
        id: makeId(),
        title: `Event ${existing.length + 1}`,
        credits: 0,
        pending: true,
      };
      return { ...prev, [subsectionId]: [...existing, nextEvent] };
    });
  }

  function updateEvent(subsectionId: string, eventId: string, nextEvent: PlannerEvent) {
    setEventsBySubsectionId((prev) => {
      const existing = prev[subsectionId] ?? [];
      return {
        ...prev,
        [subsectionId]: existing.map((e) => (e.id === eventId ? nextEvent : e)),
      };
    });
  }

  function removeEvent(subsectionId: string, eventId: string) {
    setEventsBySubsectionId((prev) => {
      const existing = prev[subsectionId] ?? [];
      return { ...prev, [subsectionId]: existing.filter((e) => e.id !== eventId) };
    });
  }

  function toggleCollapsed(sectionId: string) {
    setCollapsedSectionIds((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  function collapseAll() {
    setCollapsedSectionIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const s of template.sections) next[s.id] = true;
      return next;
    });
  }

  function expandAll() {
    setCollapsedSectionIds({});
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-5xl">
        <PlannerHeader
          view={view}
          template={template}
          eventsBySubsectionId={eventsBySubsectionId}
          importError={importError}
          valuesImportError={valuesImportError}
          onImportTemplateFile={onImportTemplateFile}
          onExportTemplate={onExportTemplate}
          onImportValuesFile={onImportValuesFile}
          onExportValues={onExportValues}
        />

        <ViewToolbar
          view={view}
          totalCredits={totalCredits}
          onSetView={setView}
          onAddSection={addSection}
        />

        {view === "fill" ? (
          <SectionTotalsPanel
            sections={template.sections}
            eventsBySubsectionId={eventsBySubsectionId}
            collapsedSectionIds={collapsedSectionIds}
            onToggleCollapsed={toggleCollapsed}
            onCollapseAll={collapseAll}
            onExpandAll={expandAll}
          />
        ) : null}

        <div className="space-y-6">
          {template.sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              No sections yet. Click “Add Section”.
            </div>
          ) : null}

          {template.sections.map((section) => (
            <SectionCard
              key={section.id}
              view={view}
              section={section}
              eventsBySubsectionId={eventsBySubsectionId}
              isCollapsed={!!collapsedSectionIds[section.id]}
              onToggleCollapse={() => toggleCollapsed(section.id)}
              onUpdateTitle={(title) =>
                updateSection(section.id, (s) => ({ ...s, title }))
              }
              onUpdateConstraints={(constraints) =>
                updateSection(section.id, (s) => ({ ...s, constraints }))
              }
              onAddSubsection={() => addSubsection(section.id)}
              onRemoveSection={() => removeSection(section)}
              onUpdateSubsectionTitle={(subId, title) =>
                updateSubsection(section.id, subId, (sub) => ({ ...sub, title }))
              }
              onUpdateSubsectionConstraints={(subId, constraints) =>
                updateSubsection(section.id, subId, (sub) => ({
                  ...sub,
                  constraints,
                }))
              }
              onRemoveSubsection={(subId) => removeSubsection(section.id, subId)}
              onAddEvent={(subId) => addEvent(subId)}
              onUpdateEvent={(subId, eventId, next) =>
                updateEvent(subId, eventId, next)
              }
              onRemoveEvent={(subId, eventId) => removeEvent(subId, eventId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
