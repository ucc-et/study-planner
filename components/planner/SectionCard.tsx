"use client";

import * as React from "react";

import type {
  PlannerEvent,
  SectionTemplate,
  SubsectionTemplate,
  ViewMode,
} from "../../lib/planner/types";
import {
  defaultConstraints,
  formatConstraint,
  sumSectionCredits,
  validateCredits,
} from "../../lib/planner/utils";
import { ConstraintEditor } from "./ConstraintEditor";
import { SubsectionCard } from "./SubsectionCard";

export function SectionCard({
  view,
  section,
  eventsBySubsectionId,
  isCollapsed,
  onToggleCollapse,
  onUpdateTitle,
  onUpdateConstraints,
  onAddSubsection,
  onRemoveSection,
  onUpdateSubsectionTitle,
  onUpdateSubsectionConstraints,
  onRemoveSubsection,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
}: {
  view: ViewMode;
  section: SectionTemplate;
  eventsBySubsectionId: Record<string, PlannerEvent[]>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateConstraints: (next: SectionTemplate["constraints"]) => void;
  onAddSubsection: () => void;
  onRemoveSection: () => void;
  onUpdateSubsectionTitle: (subsectionId: string, title: string) => void;
  onUpdateSubsectionConstraints: (
    subsectionId: string,
    next: SubsectionTemplate["constraints"],
  ) => void;
  onRemoveSubsection: (subsectionId: string) => void;
  onAddEvent: (subsectionId: string) => void;
  onUpdateEvent: (subsectionId: string, eventId: string, next: PlannerEvent) => void;
  onRemoveEvent: (subsectionId: string, eventId: string) => void;
}) {
  const credits = sumSectionCredits(section, eventsBySubsectionId);
  const issue = view === "fill" ? validateCredits(credits, section.constraints) : null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              onClick={onToggleCollapse}
              type="button"
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? "Expand" : "Collapse"}
            </button>

            <input
              className="w-full max-w-md rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={section.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              disabled={view === "fill"}
            />

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {credits} credits
            </span>

            {view === "fill" ? (
              issue ? (
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

          {view === "fill" && issue ? (
            <div className="text-sm text-amber-800 dark:text-amber-200">
              {issue}
            </div>
          ) : (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Section constraints: {formatConstraint(section.constraints)}
            </div>
          )}

          {view === "template" ? (
            <ConstraintEditor
              constraints={section.constraints}
              onChange={onUpdateConstraints}
            />
          ) : null}
        </div>

        {view === "template" ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              onClick={onAddSubsection}
              type="button"
            >
              Add Subsection
            </button>
            <button
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
              onClick={onRemoveSection}
              type="button"
            >
              Remove Section
            </button>
          </div>
        ) : null}
      </div>

      {isCollapsed ? null : (
        <div className="mt-5 space-y-4">
          {section.subsections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-black dark:text-zinc-400">
              No subsections yet. Click “Add Subsection”.
            </div>
          ) : null}

          {section.subsections.map((sub) => (
            <SubsectionCard
              key={sub.id}
              view={view}
              subsection={sub}
              events={eventsBySubsectionId[sub.id] ?? []}
              onUpdateTitle={(title) => onUpdateSubsectionTitle(sub.id, title)}
              onUpdateConstraints={(next) =>
                onUpdateSubsectionConstraints(sub.id, next)
              }
              onRemoveSubsection={() => onRemoveSubsection(sub.id)}
              onAddEvent={() => onAddEvent(sub.id)}
              onUpdateEvent={(eventId, next) =>
                onUpdateEvent(sub.id, eventId, next)
              }
              onRemoveEvent={(eventId) => onRemoveEvent(sub.id, eventId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
