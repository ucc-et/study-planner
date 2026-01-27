"use client";

import * as React from "react";

import type { PlannerEvent } from "../../lib/planner/types";

export function EventRow({
  event,
  onChange,
  onRemove,
}: {
  event: PlannerEvent;
  onChange: (next: PlannerEvent) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center">
      <input
        className="w-full flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        value={event.title}
        onChange={(e) => onChange({ ...event, title: e.target.value })}
        placeholder="Event title"
      />

      <label className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Credits</span>
        <input
          className="w-28 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          inputMode="decimal"
          value={Number.isFinite(event.credits) ? event.credits : 0}
          onChange={(e) => onChange({ ...event, credits: Number(e.target.value) })}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={event.pending}
          onChange={(e) => onChange({ ...event, pending: e.target.checked })}
        />
        <span className="text-zinc-600 dark:text-zinc-400">Pending</span>
      </label>

      <button
        className="self-start rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900 sm:self-auto"
        onClick={onRemove}
        type="button"
      >
        Remove
      </button>
    </div>
  );
}
