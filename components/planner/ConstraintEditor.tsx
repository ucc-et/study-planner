"use client";

import * as React from "react";

import type { CreditConstraint } from "../../lib/planner/types";
import { formatConstraint, parseMaybeNumber } from "../../lib/planner/utils";

export function ConstraintEditor({
  constraints,
  onChange,
}: {
  constraints: CreditConstraint;
  onChange: (next: CreditConstraint) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Min credits</span>
        <input
          className="w-36 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          inputMode="decimal"
          placeholder="(none)"
          value={constraints.minCredits ?? ""}
          onChange={(e) =>
            onChange({
              ...constraints,
              minCredits: parseMaybeNumber(e.target.value),
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Max credits</span>
        <input
          className="w-36 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          inputMode="decimal"
          placeholder="(none)"
          value={constraints.maxCredits ?? ""}
          onChange={(e) =>
            onChange({
              ...constraints,
              maxCredits: parseMaybeNumber(e.target.value),
            })
          }
        />
      </label>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        {formatConstraint(constraints)}
      </div>
    </div>
  );
}
