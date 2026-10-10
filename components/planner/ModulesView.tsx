"use client";

import * as React from "react";

import { semesterLabel } from "../../lib/planner/semesters";
import {
  areaRange,
  formatGrade,
  hasRule,
  isParked,
  modulesOfArea,
  modulesOfSubArea,
  rangeState,
  subAreaRange,
  tally,
} from "../../lib/planner/stats";
import type { Area, AreaColor, Module, ModuleStatus, Plan, SubArea } from "../../lib/planner/types";
import { areaMix, Badge, Button, Card, cx, EmptyState, Icon, RangeBar, STATUS_META, StatusIcon, Swatch, tallySegments } from "./ui";

export type AreaFilter = { areaId: string; subAreaId: string | null } | null;

const STATUS_ORDER: ModuleStatus[] = ["passed", "enrolled", "planned", "failed"];
const NEXT_STATUS: Record<ModuleStatus, ModuleStatus> = { planned: "enrolled", enrolled: "passed", passed: "planned", failed: "planned" };

export function ModulesView({
  plan,
  filter,
  onFilter,
  onEditModule,
  onAddModule,
  onDeleteModule,
  onSetStatus,
}: {
  plan: Plan;
  filter: AreaFilter;
  onFilter: (f: AreaFilter) => void;
  onEditModule: (id: string) => void;
  onAddModule: (defaults: { areaId?: string; subAreaId?: string | null }) => void;
  onDeleteModule: (id: string) => void;
  onSetStatus: (id: string, status: ModuleStatus) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [statuses, setStatuses] = React.useState<Set<ModuleStatus>>(() => new Set());
  // Big areas (e.g. 20 Pflicht modules) start collapsed so the interesting groups stay visible.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(
    () => new Set(plan.areas.filter((a) => modulesOfArea(plan, a.id).length > 12).map((a) => a.id)),
  );

  const q = query.trim().toLowerCase();
  const filtering = q !== "" || statuses.size > 0;
  const matches = (m: Module) =>
    (!q || m.title.toLowerCase().includes(q)) &&
    (statuses.size === 0 || statuses.has(m.status)) &&
    (!filter || (m.areaId === filter.areaId && (filter.subAreaId == null || m.subAreaId === filter.subAreaId)));
  const visibleCount = plan.modules.filter(matches).length;
  const inPlan = plan.modules.filter((m) => !isParked(m) && m.status !== "failed");
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isOpen = (id: string) => filtering || !!filter || !collapsed.has(id);

  const areas = plan.areas.filter((a) => !filter || a.id === filter.areaId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-[34px] tracking-tight">Module</h1>
          <p className="text-sm text-fg-2">
            {inPlan.length} Module im Plan · {tally(plan.modules).total} CP · {plan.modules.filter(isParked).length} auf dem Merkzettel
          </p>
        </div>
        <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 focus-within:border-fg sm:w-64">
          <Icon name="search" className="text-fg-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Modul suchen …"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-3"
            aria-label="Modul suchen"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Suche leeren" className="text-fg-3 hover:text-fg">
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </label>
      </div>

      {/* Compact filters for small screens */}
      <div className="flex flex-wrap items-center gap-2 lg:hidden">
        <select
          aria-label="Bereich filtern"
          className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm"
          value={filter ? `${filter.areaId}|${filter.subAreaId ?? ""}` : ""}
          onChange={(e) => {
            const [areaId, subAreaId] = e.target.value.split("|");
            onFilter(areaId ? { areaId, subAreaId: subAreaId || null } : null);
          }}
        >
          <option value="">Alle Bereiche</option>
          {plan.areas.map((a) => (
            <React.Fragment key={a.id}>
              <option value={`${a.id}|`}>{a.name}</option>
              {a.subAreas.map((s) => (
                <option key={s.id} value={`${a.id}|${s.id}`}>
                  {"   ↳ "}
                  {s.name}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>
        {STATUS_ORDER.slice(0, 3).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={statuses.has(s)}
            onClick={() => setStatuses((cur) => toggleSet(cur, s))}
            className={cx(
              "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[13px]",
              statuses.has(s) ? "border-fg bg-surface" : "border-line bg-surface text-fg-2",
            )}
          >
            <StatusIcon status={s} />
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-4 lg:flex">
          <Card className="flex flex-col gap-0.5 rounded-xl p-2">
            <span className="caps px-2 pb-1 pt-1.5">Bereiche</span>
            <FilterRow active={!filter} onClick={() => onFilter(null)}>
              <Icon name="layers" />
              <span className="flex-1 font-medium">Alle Module</span>
              <span className="text-xs font-medium text-fg-2 tabular">{plan.modules.length}</span>
            </FilterRow>
            {plan.areas.map((a) => {
              const t = tally(modulesOfArea(plan, a.id));
              const st = rangeState(t, a.minCredits, a.maxCredits);
              const scale = a.minCredits === a.maxCredits ? Math.max(a.maxCredits, t.total, 1) : Math.max(Math.ceil(a.maxCredits * 1.15), t.total);
              return (
                <React.Fragment key={a.id}>
                  <FilterRow active={filter?.areaId === a.id && filter.subAreaId == null} onClick={() => onFilter({ areaId: a.id, subAreaId: null })}>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex items-center gap-2.5">
                        <Swatch color={a.color} />
                        <span className="min-w-0 flex-1 truncate">{a.name}</span>
                        <span className={cx("text-xs font-medium tabular", st.tone === "warning" || st.tone === "danger" ? "text-warning" : "text-fg-2")}>
                          {t.total}/{areaRange(a)}
                        </span>
                      </span>
                      <RangeBar min={a.minCredits} max={a.maxCredits} scale={scale} segments={tallySegments(t, a.color)} color={a.color} height={4} ticks={false} className="!py-0" />
                    </span>
                  </FilterRow>
                  {a.subAreas.map((s, i) => {
                    const sTally = tally(modulesOfSubArea(plan, s.id));
                    return (
                      <FilterRow
                        key={s.id}
                        active={filter?.subAreaId === s.id}
                        onClick={() => onFilter({ areaId: a.id, subAreaId: s.id })}
                        className="py-1.5 pl-2"
                      >
                        <Rail color={a.color} strength={55} last={i === a.subAreas.length - 1} />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">{s.name}</span>
                        <span className="text-xs font-medium text-fg-3 tabular">
                          {sTally.total}/{subAreaRange(s)}
                        </span>
                      </FilterRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </Card>
          <Card className="flex flex-col gap-0.5 rounded-xl p-2">
            <span className="caps px-2 pb-1 pt-1.5">Status</span>
            {STATUS_ORDER.map((s) => (
              <FilterRow key={s} active={statuses.has(s)} onClick={() => setStatuses((cur) => toggleSet(cur, s))} pressed>
                <StatusIcon status={s} />
                <span className="flex-1">{STATUS_META[s].label}</span>
                <span className="text-xs font-medium text-fg-2 tabular">{plan.modules.filter((m) => m.status === s).length}</span>
              </FilterRow>
            ))}
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          {filter || filtering ? (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg-2">
              <span>
                {visibleCount} von {plan.modules.length} Modulen
              </span>
              <button
                type="button"
                className="font-medium text-fg underline-offset-2 hover:underline"
                onClick={() => {
                  onFilter(null);
                  setStatuses(new Set());
                  setQuery("");
                }}
              >
                Filter zurücksetzen
              </button>
            </div>
          ) : null}

          {!plan.modules.length ? (
            <EmptyState icon="list" title="Noch keine Module">
              <p>Trag dein erstes Modul ein – Name, Credit Points und Bereich reichen.</p>
              <Button variant="primary" icon="plus" className="mt-3" onClick={() => onAddModule({})}>
                Modul hinzufügen
              </Button>
            </EmptyState>
          ) : (
            <Card className="overflow-hidden rounded-xl">
              <div className="hidden items-center gap-4 border-b border-line bg-subtle py-2.5 pl-4 pr-3 text-xs font-medium text-fg-2 sm:flex">
                <span className="flex-1 pl-6">Modul</span>
                <span className="w-28">Semester</span>
                <span className="w-9 text-right">CP</span>
                <span className="w-10 text-right">Note</span>
                <span className="w-7" />
              </div>
              {areas.map((a) => (
                <AreaGroup
                  key={a.id}
                  plan={plan}
                  area={a}
                  filter={filter}
                  matches={matches}
                  filtering={filtering || !!filter}
                  isOpen={isOpen}
                  onToggle={toggle}
                  onEditModule={onEditModule}
                  onAddModule={onAddModule}
                  onDeleteModule={onDeleteModule}
                  onSetStatus={onSetStatus}
                />
              ))}
              {visibleCount === 0 ? <p className="px-4 py-8 text-center text-sm text-fg-2">Keine Module passen zu deinem Filter.</p> : null}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function toggleSet<T>(s: Set<T>, v: T) {
  const next = new Set(s);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

function FilterRow({
  active,
  onClick,
  children,
  className,
  pressed,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed ? active : undefined}
      aria-current={!pressed && active ? "true" : undefined}
      className={cx("flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-sm", active ? "bg-subtle" : "hover:bg-subtle/60", className)}
    >
      {children}
    </button>
  );
}

/** Vertical guide line that shows which group a row belongs to. */
function Rail({ color, strength, last = false }: { color: AreaColor; strength: number; last?: boolean }) {
  return (
    <span aria-hidden className="relative flex w-4 shrink-0 justify-center self-stretch">
      <span className={cx("w-0.5 rounded-full", last ? "h-1/2" : "h-full")} style={{ background: areaMix(color, strength) }} />
      {last ? <span className="absolute left-1/2 top-1/2 h-0.5 w-2 rounded-full" style={{ background: areaMix(color, strength) }} /> : null}
    </span>
  );
}

/** Rails for a given depth: level 1 = one rail (area), level 2 = two rails (area + sub-area). */
function Rails({ color, depth }: { color: AreaColor; depth: number }) {
  return (
    <>
      {Array.from({ length: depth }, (_, i) => (
        <span key={i} className="mr-2 flex">
          <Rail color={color} strength={i === 0 ? 55 : 30} />
        </span>
      ))}
    </>
  );
}

function AreaGroup({
  plan,
  area,
  filter,
  matches,
  filtering,
  isOpen,
  onToggle,
  onEditModule,
  onAddModule,
  onDeleteModule,
  onSetStatus,
}: {
  plan: Plan;
  area: Area;
  filter: AreaFilter;
  matches: (m: Module) => boolean;
  filtering: boolean;
  isOpen: (id: string) => boolean;
  onToggle: (id: string) => void;
  onEditModule: (id: string) => void;
  onAddModule: (defaults: { areaId?: string; subAreaId?: string | null }) => void;
  onDeleteModule: (id: string) => void;
  onSetStatus: (id: string, status: ModuleStatus) => void;
}) {
  const all = modulesOfArea(plan, area.id);
  const shown = all.filter(matches);
  if (filtering && !shown.length) return null;
  const t = tally(all);
  const state = rangeState(t, area.minCredits, area.maxCredits);
  const open = isOpen(area.id);
  const scale = area.minCredits === area.maxCredits ? Math.max(area.maxCredits, t.total, 1) : Math.max(Math.ceil(area.maxCredits * 1.15), t.total);
  const direct = sortModules(shown.filter((m) => m.subAreaId == null));
  const subs = area.subAreas.filter((s) => !filter?.subAreaId || s.id === filter.subAreaId);

  return (
    <div role="group" aria-label={area.name}>
      <button
        type="button"
        onClick={() => onToggle(area.id)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 border-b border-line bg-subtle/50 py-3 pl-4 pr-4 text-left hover:bg-subtle"
      >
        <Icon name={open ? "chevron-down" : "chevron-right"} className="text-fg-2" />
        <Swatch color={area.color} />
        <span className="text-sm font-semibold">{area.name}</span>
        <span className="whitespace-nowrap text-[13px] text-fg-3 max-sm:hidden">
          {all.length} {all.length === 1 ? "Modul" : "Module"}
        </span>
        <span className="flex-1" />
        {state.tone === "warning" || state.tone === "danger" ? (
          <Badge tone={state.tone} className="max-sm:hidden">
            {state.label}
          </Badge>
        ) : null}
        <span className="hidden w-36 md:block">
          <RangeBar min={area.minCredits} max={area.maxCredits} scale={scale} segments={tallySegments(t, area.color)} color={area.color} height={6} className="!py-0" />
        </span>
        <span className={cx("w-24 text-right text-xs font-medium tabular", state.tone === "warning" ? "text-warning" : state.tone === "danger" ? "text-danger" : "text-fg-2")}>
          {t.total} / {areaRange(area)} CP
        </span>
      </button>
      {open ? (
        <>
          {direct.map((m) => (
            <ModuleRow
              key={m.id}
              module={m}
              plan={plan}
              color={area.color}
              depth={1}
              onEdit={() => onEditModule(m.id)}
              onDelete={() => onDeleteModule(m.id)}
              onCycleStatus={() => onSetStatus(m.id, NEXT_STATUS[m.status])}
            />
          ))}
          {subs.map((s) => (
            <SubAreaGroup
              key={s.id}
              plan={plan}
              area={area}
              sub={s}
              matches={matches}
              filtering={filtering}
              open={isOpen(s.id)}
              onToggle={() => onToggle(s.id)}
              onEditModule={onEditModule}
              onAddModule={onAddModule}
              onDeleteModule={onDeleteModule}
              onSetStatus={onSetStatus}
            />
          ))}
          {!area.subAreas.length && !filtering ? (
            <AddRow color={area.color} depth={1} label={`Modul zu ${area.name} hinzufügen`} onClick={() => onAddModule({ areaId: area.id, subAreaId: null })} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function SubAreaGroup({
  plan,
  area,
  sub,
  matches,
  filtering,
  open,
  onToggle,
  onEditModule,
  onAddModule,
  onDeleteModule,
  onSetStatus,
}: {
  plan: Plan;
  area: Area;
  sub: SubArea;
  matches: (m: Module) => boolean;
  filtering: boolean;
  open: boolean;
  onToggle: () => void;
  onEditModule: (id: string) => void;
  onAddModule: (defaults: { areaId?: string; subAreaId?: string | null }) => void;
  onDeleteModule: (id: string) => void;
  onSetStatus: (id: string, status: ModuleStatus) => void;
}) {
  const all = modulesOfSubArea(plan, sub.id);
  const shown = sortModules(all.filter(matches));
  if (filtering && !shown.length) return null;
  const t = tally(all);
  const state = rangeState(t, sub.minCredits, sub.maxCredits);
  const ok = !hasRule(sub) || state.tone === "success" || state.tone === "neutral";
  const scale = Math.max(Math.ceil((sub.maxCredits ?? (sub.minCredits ?? 0) * 2) * 1.1), t.total, 1);

  return (
    <div role="group" aria-label={`${area.name} › ${sub.name}`}>
      <div className="flex items-stretch pl-4">
        <Rails color={area.color} depth={1} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 border-b border-line py-2.5 pr-4 text-left hover:bg-subtle/50"
        >
          <Icon name={open ? "chevron-down" : "chevron-right"} className="text-fg-3" />
          <Swatch color={area.color} size={8} radius={2} opacity={60} />
          <span className="min-w-0 truncate text-sm font-medium">{sub.name}</span>
          <span className="shrink-0 text-[13px] text-fg-3">{all.length}</span>
          <span className="flex-1" />
          {hasRule(sub) ? (
            <Icon name={ok ? "check" : "alert"} className={cx("hidden sm:block", ok ? "text-success" : state.tone === "danger" ? "text-danger" : "text-warning")} />
          ) : null}
          <span className="hidden w-28 md:block">
            <RangeBar min={sub.minCredits} max={sub.maxCredits} scale={scale} segments={tallySegments(t, area.color)} color={area.color} height={5} className="!py-0" />
          </span>
          <span className={cx("w-24 text-right text-xs font-medium tabular", ok ? "text-fg-2" : state.tone === "danger" ? "text-danger" : "text-warning")}>
            {t.total} / {subAreaRange(sub)} CP
          </span>
        </button>
      </div>
      {open ? (
        <>
          {shown.map((m) => (
            <ModuleRow
              key={m.id}
              module={m}
              plan={plan}
              color={area.color}
              depth={2}
              onEdit={() => onEditModule(m.id)}
              onDelete={() => onDeleteModule(m.id)}
              onCycleStatus={() => onSetStatus(m.id, NEXT_STATUS[m.status])}
            />
          ))}
          {!filtering ? (
            <AddRow color={area.color} depth={2} label={`Modul zu ${sub.name} hinzufügen`} onClick={() => onAddModule({ areaId: area.id, subAreaId: sub.id })} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function sortModules(ms: Module[]): Module[] {
  return [...ms].sort((a, b) => (a.semester ?? 99) - (b.semester ?? 99) || a.title.localeCompare(b.title, "de"));
}

function ModuleRow({
  module: m,
  plan,
  color,
  depth,
  onEdit,
  onDelete,
  onCycleStatus,
}: {
  module: Module;
  plan: Plan;
  color: AreaColor;
  depth: number;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
}) {
  const sem = m.semester ? `${m.semester}. · ${semesterLabel(plan.startTerm, m.semester)}` : "Merkzettel";
  return (
    <div className="group flex items-stretch pl-4">
      <Rails color={color} depth={depth} />
      <div className="flex min-w-0 flex-1 items-center gap-4 border-b border-line py-2 pr-3">
        <button
          type="button"
          onClick={onCycleStatus}
          title={`${STATUS_META[m.status].label} – klicken für „${STATUS_META[NEXT_STATUS[m.status]].label}“`}
          aria-label={`Status: ${STATUS_META[m.status].label}. Ändern zu ${STATUS_META[NEXT_STATUS[m.status]].label}`}
          className="-m-1 grid place-items-center rounded-full p-1 hover:bg-subtle"
        >
          <StatusIcon status={m.status} />
        </button>
        <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-0.5 text-left sm:flex-row sm:items-center sm:gap-4">
          <span className={cx("min-w-0 flex-1 text-sm font-medium", m.status === "failed" && "text-fg-3 line-through")}>{m.title}</span>
          <span className={cx("text-[13px] sm:w-28", m.semester ? "text-fg-2" : "text-fg-3")}>
            {sem}
            <span className="sm:hidden">
              {" "}
              · {m.credits} CP{m.grade != null ? ` · Note ${formatGrade(m.grade)}` : ""}
            </span>
          </span>
          <span className="hidden w-9 text-right text-sm font-medium tabular sm:block">{m.credits}</span>
          <span className="hidden w-10 text-right text-sm tabular sm:block">{m.grade != null ? formatGrade(m.grade) : <span className="text-fg-3">–</span>}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Modul löschen"
          aria-label={`${m.title} löschen`}
          className="hidden size-7 place-items-center rounded-md text-fg-3 opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger focus:opacity-100 group-hover:opacity-100 sm:grid"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  );
}

function AddRow({ color, depth, label, onClick }: { color: AreaColor; depth: number; label: string; onClick: () => void }) {
  return (
    <div className="flex items-stretch pl-4">
      <Rails color={color} depth={depth} />
      <button type="button" onClick={onClick} className="flex flex-1 items-center gap-2 border-b border-line py-2.5 text-left text-[13px] text-fg-3 hover:text-fg">
        <Icon name="plus" />
        {label}
      </button>
    </div>
  );
}
