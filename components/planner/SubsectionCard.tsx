"use client";

import * as React from "react";

import type {
  PlannerEvent,
  SubsectionTemplate,
  ViewMode,
} from "../../lib/planner/types";
import { clampCredits, formatConstraint, sumCredits, validateCredits } from "../../lib/planner/utils";
import { ConstraintEditor } from "./ConstraintEditor";
import { EventRow } from "./EventRow";

export function SubsectionCard({
  view,
  subsection,
  events,
  onUpdateTitle,
  onUpdateConstraints,
  onRemoveSubsection,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
}: {
  view: ViewMode;
  subsection: SubsectionTemplate;
  events: PlannerEvent[];
  onUpdateTitle: (title: string) => void;
  onUpdateConstraints: (next: SubsectionTemplate["constraints"]) => void;
  onRemoveSubsection: () => void;
  onAddEvent: () => void;
  onUpdateEvent: (eventId: string, next: PlannerEvent) => void;
  onRemoveEvent: (eventId: string) => void;
}) {
  const credits = sumCredits(events);
  const issue = view === "fill" ? validateCredits(credits, subsection.constraints) : null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="w-full max-w-md rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={subsection.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              disabled={view === "fill"}
            />
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
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
              Subsection constraints: {formatConstraint(subsection.constraints)}
            </div>
          )}

          {view === "template" ? (
            <ConstraintEditor
              constraints={subsection.constraints}
              onChange={onUpdateConstraints}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {view === "template" ? (
            <button
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
              onClick={onRemoveSubsection}
              type="button"
            >
              Remove Subsection
            </button>
          ) : (
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              onClick={onAddEvent}
              type="button"
            >
              Add Event
            </button>
          )}
        </div>
      </div>

      {view === "fill" ? (
        <div className="mt-4 space-y-3">
          {events.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-white p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              No events yet. Click “Add Event”.
            </div>
          ) : null}

          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onChange={(next) => {
                const normalized = {
                  ...next,
                  credits: clampCredits(next.credits),
                };
                onUpdateEvent(event.id, normalized);
              }}
              onRemove={() => onRemoveEvent(event.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
