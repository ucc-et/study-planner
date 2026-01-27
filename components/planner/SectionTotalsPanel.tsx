"use client";

import * as React from "react";

import type { PlannerEvent, SectionTemplate } from "../../lib/planner/types";
import { formatConstraint, sumSectionCredits, validateCredits } from "../../lib/planner/utils";

export function SectionTotalsPanel({
  sections,
  eventsBySubsectionId,
  collapsedSectionIds,
  onToggleCollapsed,
  onCollapseAll,
  onExpandAll,
}: {
  sections: SectionTemplate[];
  eventsBySubsectionId: Record<string, PlannerEvent[]>;
  collapsedSectionIds: Record<string, boolean>;
  onToggleCollapsed: (sectionId: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Section totals
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={onCollapseAll}
            type="button"
          >
            Collapse all
          </button>
          <button
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={onExpandAll}
            type="button"
          >
            Expand all
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const credits = sumSectionCredits(s, eventsBySubsectionId);
          const issue = validateCredits(credits, s.constraints);
          const collapsed = !!collapsedSectionIds[s.id];

          return (
            <button
              key={s.id}
              type="button"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-left shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-900"
              onClick={() => onToggleCollapsed(s.id)}
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
  );
}
