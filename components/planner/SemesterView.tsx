"use client";

import * as React from "react";

import { creditsPerSemester, currentSemester, semesterLabel } from "../../lib/planner/semesters";
import { formatGrade, isParked, semesterColumns, semesterCredits, tally } from "../../lib/planner/stats";
import type { Area, Module, Plan, StudyMode } from "../../lib/planner/types";
import { areaColor, areaMix, areaTint, AreaTag, Badge, Button, cx, Icon, LoadBar, STATUS_META, StatusIcon } from "./ui";

const DRAG_TYPE = "application/x-ssp-module";

export function SemesterView({
  plan,
  onMove,
  onEditModule,
  onAddModule,
  onSetStudyMode,
  onSetSemesterCount,
}: {
  plan: Plan;
  onMove: (id: string, semester: number | null) => void;
  onEditModule: (id: string) => void;
  onAddModule: (defaults: { semester: number | null }) => void;
  onSetStudyMode: (m: StudyMode) => void;
  onSetSemesterCount: (n: number) => void;
}) {
  const now = currentSemester(plan.startTerm);
  const columns = semesterColumns(plan);
  const limit = creditsPerSemester(plan.studyMode);
  const [expanded, setExpanded] = React.useState<Set<number>>(() => new Set());
  const [collapsedFuture, setCollapsedFuture] = React.useState<Set<number>>(() => new Set());
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<number | "park" | null>(null);

  const isCollapsed = (n: number) => (n < now ? !expanded.has(n) : collapsedFuture.has(n));
  const toggle = (n: number) => {
    if (n < now) setExpanded((s) => flip(s, n));
    else setCollapsedFuture((s) => flip(s, n));
  };

  const unscheduled = plan.modules.filter((m) => m.semester == null);
  const all = tally(plan.modules);
  const missing = Math.max(plan.program.totalCredits - all.total, 0);
  const lastSem = Math.max(columns, now);
  const freeInLast = Math.max(limit - semesterCredits(plan, lastSem), 0);
  const lastIsEmpty = !plan.modules.some((m) => m.semester === columns);

  const dropProps = (target: number | "park") => ({
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== target) setOver(target);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((o) => (o === target ? null : o));
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData(DRAG_TYPE);
      setOver(null);
      setDragId(null);
      if (id) onMove(id, target === "park" ? null : target);
    },
  });

  const cardProps = (m: Module) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData(DRAG_TYPE, m.id);
      e.dataTransfer.effectAllowed = "move";
      setDragId(m.id);
    },
    onDragEnd: () => {
      setDragId(null);
      setOver(null);
    },
  });

  const dragged = dragId ? plan.modules.find((m) => m.id === dragId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-[34px] tracking-tight">Semesterplan</h1>
          <p className="text-sm text-fg-2">Ziehe Module zwischen die Semester. Abgeschlossene Semester sind eingeklappt.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-[10px] bg-subtle p-[3px]" role="radiogroup" aria-label="Studienmodell">
            {(["full", "part"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={plan.studyMode === mode}
                onClick={() => onSetStudyMode(mode)}
                className={cx(
                  "h-[30px] rounded-[7px] px-3 text-[13px]",
                  plan.studyMode === mode ? "bg-surface text-fg shadow-card" : "text-fg-2 hover:text-fg",
                )}
              >
                {mode === "full" ? "Vollzeit · 30 CP" : "Teilzeit · 20 CP"}
              </button>
            ))}
          </div>
          <Button icon="plus" onClick={() => onSetSemesterCount(columns + 1)}>
            Semester hinzufügen
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {plan.areas.map((a) => (
          <AreaTag key={a.id} color={a.color}>
            {a.name}
          </AreaTag>
        ))}
        <span aria-hidden className="mx-1 hidden h-4 w-px bg-line sm:block" />
        {(["passed", "enrolled", "planned"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5 px-1 text-xs font-medium text-fg-2">
            <StatusIcon status={s} />
            {STATUS_META[s].short}
          </span>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex w-max items-start gap-3">
          {Array.from({ length: columns }, (_, i) => i + 1).map((n) => {
            const mods = plan.modules.filter((m) => m.semester === n);
            const cp = semesterCredits(plan, n);
            const isOver = over === n;
            if (isCollapsed(n)) {
              return (
                <section
                  key={n}
                  aria-label={`${n}. Semester (eingeklappt)`}
                  className={cx("flex w-[104px] flex-col gap-2.5 rounded-xl bg-subtle p-3 transition-shadow", isOver && "ring-2 ring-fg")}
                  {...dropProps(n)}
                >
                  <button type="button" onClick={() => toggle(n)} className="flex items-center justify-between text-left" title="Aufklappen">
                    <span className="text-base font-semibold">{n}. Sem.</span>
                    <Icon name="chevron-right" className="text-fg-3" />
                  </button>
                  <span className="text-xs font-medium text-fg-3">{semesterLabel(plan.startTerm, n)}</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <StatusIcon status={mods.every((m) => m.status === "passed") && mods.length ? "passed" : mods.some((m) => m.status === "enrolled") ? "enrolled" : "planned"} />
                    {cp} CP
                  </span>
                  <div className="flex flex-col gap-0.5" aria-hidden>
                    {mods.map((m) => {
                      const area = plan.areas.find((a) => a.id === m.areaId);
                      return (
                        <span
                          key={m.id}
                          title={`${m.title} · ${m.credits} CP`}
                          className="block w-full rounded-[3px]"
                          style={{ height: Math.max(m.credits * 6 - 2, 4), background: area ? (m.status === "passed" ? areaColor(area.color) : areaMix(area.color, 50)) : "var(--line)" }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-medium text-fg-2">
                    {mods.length} {mods.length === 1 ? "Modul" : "Module"}
                  </span>
                </section>
              );
            }
            const current = n === now;
            return (
              <section
                key={n}
                aria-label={`${n}. Semester`}
                className={cx(
                  "flex w-56 flex-col gap-2 rounded-xl p-2 transition-shadow",
                  current ? "border-[1.5px] border-fg/85 bg-surface p-[6.5px]" : "bg-subtle",
                  isOver && "ring-2 ring-fg",
                )}
                {...dropProps(n)}
              >
                <div className="flex flex-col gap-1.5 px-1.5 pb-1 pt-1.5">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggle(n)} className="flex items-center gap-1 text-base font-semibold" title="Einklappen">
                      {n}. Semester
                    </button>
                    <span className="flex-1" />
                    {current ? <Badge tone="info">Aktuell</Badge> : null}
                    {n === columns && n > 1 && lastIsEmpty && n > now ? (
                      <button
                        type="button"
                        onClick={() => onSetSemesterCount(n - 1)}
                        className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-line hover:text-fg"
                        title="Leeres Semester entfernen"
                        aria-label="Leeres Semester entfernen"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-fg-2">{semesterLabel(plan.startTerm, n, true)}</span>
                    <span className="flex-1" />
                    <span className={cx("text-xs font-medium tabular", cp > limit ? "text-warning" : "text-fg")}>
                      {cp} / {limit} CP
                    </span>
                  </div>
                  <LoadBar value={cp} max={limit} />
                </div>
                {mods.map((m) => (
                  <ModuleCard
                    key={m.id}
                    module={m}
                    area={plan.areas.find((a) => a.id === m.areaId)}
                    dragging={dragId === m.id}
                    onClick={() => onEditModule(m.id)}
                    {...cardProps(m)}
                  />
                ))}
                {isOver && dragged && dragged.semester !== n ? <DropHint module={dragged} plan={plan} /> : null}
                <button
                  type="button"
                  onClick={() => onAddModule({ semester: n })}
                  className="flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line-strong py-2.5 text-[13px] text-fg-3 hover:border-fg-3 hover:text-fg-2"
                >
                  <Icon name="plus" />
                  Modul
                </button>
              </section>
            );
          })}

          <section
            aria-label="Merkzettel"
            className={cx(
              "flex w-56 flex-col gap-2 rounded-xl border border-dashed border-line-strong bg-surface p-2 transition-shadow",
              over === "park" && "ring-2 ring-fg",
            )}
            {...dropProps("park")}
          >
            <div className="flex flex-col gap-1 px-1.5 pb-1 pt-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">Merkzettel</span>
                <span className="flex-1" />
                <span className="text-xs font-medium text-fg-2 tabular">{unscheduled.reduce((a, m) => a + m.credits, 0)} CP</span>
              </div>
              <p className="text-[13px] text-fg-2">Module ohne Semester – geplante zählen erst, wenn du sie einplanst.</p>
            </div>
            {unscheduled.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                area={plan.areas.find((a) => a.id === m.areaId)}
                dragging={dragId === m.id}
                onClick={() => onEditModule(m.id)}
                {...cardProps(m)}
              />
            ))}
            {over === "park" && dragged && dragged.semester != null ? <DropHint module={dragged} plan={plan} parked /> : null}
            <button
              type="button"
              onClick={() => onAddModule({ semester: null })}
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line-strong py-2.5 text-[13px] text-fg-3 hover:border-fg-3 hover:text-fg-2"
            >
              <Icon name="plus" />
              Idee merken
            </button>
          </section>

          <button
            type="button"
            onClick={() => onSetSemesterCount(columns + 1)}
            className="grid h-40 w-12 place-items-center rounded-xl border border-dashed border-line-strong text-fg-3 hover:border-fg-3 hover:text-fg-2"
            title="Semester hinzufügen"
            aria-label="Semester hinzufügen"
          >
            <Icon name="plus" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-info/10 px-4 py-3 text-[13px]">
        <Icon name="info" className="mt-px text-info" />
        <p>
          {missing === 0
            ? `Alle ${plan.program.totalCredits} CP sind eingeplant.`
            : `Im Plan stehen ${all.total} von ${plan.program.totalCredits} CP. ${
                freeInLast > 0
                  ? `Im ${lastSem}. Semester ist bei ${limit} CP noch Platz für ${Math.min(freeInLast, missing)} CP${missing > freeInLast ? ` – für die restlichen ${missing - freeInLast} CP brauchst du ein weiteres Semester oder vollere Semester.` : "."}`
                  : `Für die fehlenden ${missing} CP brauchst du ein weiteres Semester oder vollere Semester.`
              }`}
          {unscheduled.some(isParked) ? " Module auf dem Merkzettel zählen noch nicht mit." : ""}
        </p>
      </div>
    </div>
  );
}

function flip(s: Set<number>, n: number) {
  const next = new Set(s);
  if (next.has(n)) next.delete(n);
  else next.add(n);
  return next;
}

function DropHint({ module: m, plan, parked = false }: { module: Module; plan: Plan; parked?: boolean }) {
  const area = plan.areas.find((a) => a.id === m.areaId);
  return (
    <div
      className="grid place-items-center rounded-[10px] border border-dashed py-5 text-xs font-medium"
      style={area ? { borderColor: areaColor(area.color), background: areaMix(area.color, 12), color: areaColor(area.color) } : undefined}
    >
      {parked ? "Auf den Merkzettel legen" : `Hier ablegen · +${m.credits} CP`}
    </div>
  );
}

export function moduleMeta(m: Module, area: Area | undefined): string {
  if (m.status === "passed") return m.grade != null ? `Note ${formatGrade(m.grade)}` : "bestanden";
  if (m.status === "enrolled") return "läuft";
  if (m.status === "failed") return "nicht bestanden";
  const sub = area?.subAreas.find((s) => s.id === m.subAreaId);
  return sub ? sub.name : "geplant";
}

export function ModuleCard({
  module: m,
  area,
  dragging,
  onClick,
  ...drag
}: {
  module: Module;
  area: Area | undefined;
  dragging?: boolean;
  onClick: () => void;
} & Pick<React.HTMLAttributes<HTMLButtonElement>, "onDragStart" | "onDragEnd"> & { draggable?: boolean }) {
  const color = area?.color ?? "slate";
  const style: React.CSSProperties =
    m.status === "enrolled"
      ? { background: areaTint(color, 13), borderColor: areaMix(color, 30) }
      : m.status === "planned"
        ? { background: "color-mix(in srgb, var(--bg-surface) 60%, transparent)" }
        : {};
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${m.title} · ${m.credits} CP · ${STATUS_META[m.status].short}${area ? ` · ${area.name}` : ""}`}
      className={cx(
        "group flex w-full overflow-hidden rounded-[10px] border text-left transition-opacity",
        m.status === "planned" ? "border-dashed border-line-strong" : "border-line bg-surface",
        dragging && "opacity-35",
        "cursor-grab active:cursor-grabbing",
      )}
      style={style}
      {...drag}
    >
      <span aria-hidden className="w-1 shrink-0" style={{ background: m.status === "planned" || m.status === "failed" ? areaMix(color, 40) : areaColor(color) }} />
      <span className="flex min-w-0 flex-1 flex-col gap-2 py-2.5 pl-2.5 pr-3">
        <span className={cx("text-sm font-medium leading-5", m.status === "planned" ? "text-fg-2" : "text-fg", m.status === "failed" && "text-fg-3 line-through")}>
          {m.title}
        </span>
        <span className="flex items-center gap-1.5">
          <StatusIcon status={m.status} />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg-2">{moduleMeta(m, area)}</span>
          <span className={cx("rounded-[5px] px-1.5 py-0.5 text-xs font-medium tabular", m.status === "enrolled" ? "bg-surface/75" : "bg-subtle")}>{m.credits} CP</span>
        </span>
      </span>
    </button>
  );
}
