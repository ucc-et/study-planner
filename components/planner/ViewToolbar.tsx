"use client";

import * as React from "react";

import type { ViewMode } from "../../lib/planner/types";

export function ViewToolbar({
  view,
  totalCredits,
  onSetView,
  onAddSection,
}: {
  view: ViewMode;
  totalCredits: number;
  onSetView: (next: ViewMode) => void;
  onAddSection: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={
            view === "template"
              ? "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
              : "rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          }
          onClick={() => onSetView("template")}
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
          onClick={() => onSetView("fill")}
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
            onClick={onAddSection}
            type="button"
          >
            Add Section
          </button>
        ) : null}
      </div>
    </div>
  );
}
