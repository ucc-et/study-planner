"use client";

import * as React from "react";

import type {
  FilledPlanBundleV1,
  PlannerTemplateV1,
  ViewMode,
} from "../../lib/planner/types";

export function PlannerHeader({
  view,
  template,
  eventsBySubsectionId,
  importError,
  valuesImportError,
  onImportTemplateFile,
  onExportTemplate,
  onImportValuesFile,
  onExportValues,
}: {
  view: ViewMode;
  template: PlannerTemplateV1;
  eventsBySubsectionId: FilledPlanBundleV1["eventsBySubsectionId"];
  importError: string | null;
  valuesImportError: string | null;
  onImportTemplateFile: (file: File) => Promise<void>;
  onExportTemplate: () => void;
  onImportValuesFile: (file: File) => Promise<void>;
  onExportValues: () => void;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">study-planner</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Build sections → subsections → events, and enforce min/max credit
          constraints.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            <span>Import Template</span>
            <input
              className="hidden"
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onImportTemplateFile(file);
                e.target.value = "";
              }}
            />
          </label>

          <button
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            onClick={onExportTemplate}
            type="button"
          >
            Export Template
          </button>
        </div>

        {view === "fill" ? (
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <span>Import Values</span>
              <input
                className="hidden"
                type="file"
                accept="application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await onImportValuesFile(file);
                  e.target.value = "";
                }}
              />
            </label>

            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              onClick={onExportValues}
              type="button"
            >
              Export Values
            </button>
          </div>
        ) : null}

        {importError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {importError}
          </div>
        ) : null}

        {view === "fill" && valuesImportError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {valuesImportError}
          </div>
        ) : null}

        {/* keep props "used" so TS doesn't warn if strict settings change */}
        <div className="hidden">
          {template.version}
          {Object.keys(eventsBySubsectionId).length}
        </div>
      </div>
    </header>
  );
}
