"use client";

import * as React from "react";

import { currentSemester, semesterLabel } from "../../lib/planner/semesters";
import {
  areaRange,
  breakdown,
  formatAverage,
  gradeAverage,
  graduationForecast,
  hasRule,
  modulesOfArea,
  modulesOfSubArea,
  type NextStep,
  nextSteps,
  rangeState,
  semesterCredits,
  subAreaRange,
  tally,
} from "../../lib/planner/stats";
import type { Area, Module, Plan } from "../../lib/planner/types";
import {
  AreaTag,
  Badge,
  Button,
  Card,
  cx,
  EmptyState,
  Icon,
  Mosaic,
  RangeBar,
  type Segment,
  StackedBar,
  StatusIcon,
  Swatch,
  tallySegments,
} from "./ui";

export function OverviewView({
  plan,
  onOpenModules,
  onOpenSemester,
  onOpenStructure,
  onAddModule,
  onEditModule,
}: {
  plan: Plan;
  onOpenModules: (areaId?: string) => void;
  onOpenSemester: () => void;
  onOpenStructure: () => void;
  onAddModule: (defaults?: { areaId?: string; subAreaId?: string | null; semester?: number | null }) => void;
  onEditModule: (id: string) => void;
}) {
  const now = currentSemester(plan.startTerm);
  const all = tally(plan.modules);
  const total = plan.program.totalCredits;
  const missing = Math.max(total - all.total, 0);
  const pct = Math.round((all.passed / Math.max(total, 1)) * 100);
  const gpa = gradeAverage(plan.modules);
  const current = plan.modules.filter((m) => m.semester === now && m.status !== "failed");
  const steps = nextSteps(plan);
  const forecast = graduationForecast(plan);

  const segments: Segment[] = plan.areas.flatMap((a) => {
    const t = tally(modulesOfArea(plan, a.id));
    const parts = tallySegments(t, a.color).map((s) => ({ ...s, label: `${a.name}: ${s.value} CP ${s.label}` }));
    const last = parts.map((p) => p.value > 0).lastIndexOf(true);
    return parts.map((p, i) => ({ ...p, gapAfter: i === last }));
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-[34px] tracking-tight">Übersicht</h1>
          <p className="text-sm text-fg-2">
            {now}. Fachsemester · {semesterLabel(plan.startTerm, now, true)} · automatisch gespeichert
          </p>
        </div>
        <Button icon="sliders" onClick={onOpenStructure}>
          Struktur bearbeiten
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <Card className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="caps">Gesamtfortschritt</span>
              <div className="flex items-baseline gap-2">
                <span className="text-[44px] font-semibold leading-[48px] tracking-tight tabular">{all.passed}</span>
                <span className="text-xl font-semibold tracking-tight text-fg-3">/ {total} CP bestanden</span>
              </div>
              <span className="text-sm text-fg-2">{pct} % deines Studiums sind geschafft</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <Badge>{all.enrolled} CP laufen gerade</Badge>
              <Badge>{all.planned} CP geplant</Badge>
              {missing > 0 ? <Badge tone="warning">{missing} CP fehlen noch im Plan</Badge> : <Badge tone="success">Plan vollständig</Badge>}
            </div>
          </div>
          <StackedBar segments={segments} scale={total} height={16} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              ["bestanden", 100],
              ["läuft", 50],
              ["geplant", 22],
            ].map(([label, o]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-fg-2">
                <span className="size-3 rounded-[3px]" style={{ background: `color-mix(in srgb, var(--fg-2) ${o}%, transparent)` }} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs font-medium text-fg-2">
              <span className="size-3 rounded-[3px] border border-dashed border-line-strong bg-subtle" />
              fehlt noch
            </span>
          </div>
          {forecast ? (
            <div className="flex items-center gap-3 rounded-xl bg-subtle px-4 py-3">
              <Icon name="calendar" className="shrink-0 text-fg-2" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">
                  Voraussichtlicher Abschluss: {forecast.semester}. Semester · {semesterLabel(plan.startTerm, forecast.semester, true)}
                </span>
                <span className="text-[13px] text-fg-2">
                  {forecast.missing
                    ? `Wenn du die fehlenden ${forecast.missing} CP mit ${plan.studyMode === "full" ? 30 : 20} CP pro Semester einplanst.`
                    : forecast.semester <= plan.program.standardSemesters
                      ? `In der Regelstudienzeit von ${plan.program.standardSemesters} Semestern.`
                      : `${forecast.semester - plan.program.standardSemesters} Semester über der Regelstudienzeit.`}
                </span>
              </div>
              <button type="button" onClick={onOpenSemester} className="hidden shrink-0 text-xs font-medium hover:underline sm:block">
                Planen
              </button>
            </div>
          ) : null}
          <div className="flex-1" />
          <div className="h-px bg-line" />
          {plan.areas.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {plan.areas.map((a) => {
                const t = tally(modulesOfArea(plan, a.id));
                return (
                  <div key={a.id} className="flex min-w-0 flex-col items-start gap-1.5">
                    <AreaTag color={a.color}>{a.name}</AreaTag>
                    <span className="text-sm font-medium tabular">
                      {t.total} / {areaRange(a)} CP
                    </span>
                    <span className="text-[13px] text-fg-2">{breakdown(t)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-fg-2">Noch keine Bereiche angelegt.</p>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-1.5 p-6">
            <span className="caps">Notenschnitt · Schätzung</span>
            <span className="text-[32px] font-semibold leading-9 tracking-tight tabular">{gpa ? formatAverage(gpa.value) : "–"}</span>
            <p className="text-[13px] text-fg-2">
              {gpa
                ? `CP-gewichtet über ${gpa.count} benotete ${gpa.count === 1 ? "Modul" : "Module"}. Unverbindlich – maßgeblich ist dein Zeugnis.`
                : "Erscheint, sobald du Noten für bestandene Module einträgst."}
            </p>
          </Card>

          <Card className="flex flex-col gap-3.5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="caps">Dieses Semester</span>
                <span className="text-base font-semibold">
                  {now}. Semester · {semesterLabel(plan.startTerm, now, true)}
                </span>
              </div>
              <Badge>{semesterCredits(plan, now)} CP</Badge>
            </div>
            {current.length ? (
              <ul className="flex flex-col gap-1">
                {current.slice(0, 4).map((m) => (
                  <ModuleLine key={m.id} module={m} plan={plan} onClick={() => onEditModule(m.id)} />
                ))}
                {current.length > 4 ? <li className="pt-1 text-xs font-medium text-fg-3">+ {current.length - 4} weitere</li> : null}
              </ul>
            ) : (
              <p className="text-[13px] text-fg-2">Für dieses Semester ist noch nichts eingetragen.</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <LinkButton onClick={onOpenSemester}>Zum Semesterplan</LinkButton>
              {!current.length ? <LinkButton onClick={() => onAddModule({ semester: now })}>Modul eintragen</LinkButton> : null}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Bereiche</h2>
        <p className="text-sm text-fg-2">Was deine Prüfungsordnung verlangt – und wo du stehst</p>
      </div>
      {plan.areas.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {plan.areas.map((a) => (
            <AreaCard key={a.id} plan={plan} area={a} onOpenModules={() => onOpenModules(a.id)} onEditModule={onEditModule} />
          ))}
        </div>
      ) : (
        <EmptyState icon="layers" title="Noch keine Bereiche">
          <p>Lege unter „Struktur“ die Bereiche deines Studiengangs mit ihren CP-Spannen an.</p>
          <Button className="mt-3" onClick={onOpenStructure} icon="sliders">
            Zur Struktur
          </Button>
        </EmptyState>
      )}

      {steps.length ? (
        <Card className="flex flex-col px-6 pb-2 pt-5">
          <div className="flex items-center gap-2 pb-1.5">
            <h2 className="text-base font-semibold">Nächste Schritte</h2>
            <Badge>{steps.length}</Badge>
          </div>
          <ul className="divide-y divide-line">
            {steps.map((s) => (
              <NextStepRow
                key={s.id}
                step={s}
                onAction={() => {
                  const a = s.action;
                  if (!a) return;
                  if (a.target === "semester") onOpenSemester();
                  else if (a.target === "modules") onOpenModules(a.areaId);
                  else if (a.target === "structure") onOpenStructure();
                  else onAddModule({ areaId: a.areaId, subAreaId: a.subAreaId ?? null });
                }}
              />
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function LinkButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium hover:underline">
      {children}
      <Icon name="arrow-right" />
    </button>
  );
}

function ModuleLine({ module: m, plan, onClick }: { module: Module; plan: Plan; onClick: () => void }) {
  const area = plan.areas.find((a) => a.id === m.areaId);
  return (
    <li>
      <button type="button" onClick={onClick} className="-mx-2 flex w-[calc(100%+16px)] items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-subtle">
        <StatusIcon status={m.status} />
        {area ? <Swatch color={area.color} size={8} radius={2} /> : null}
        <span className="flex-1 text-[13px]">{m.title}</span>
        <span className="text-xs font-medium text-fg-2 tabular">{m.credits} CP</span>
      </button>
    </li>
  );
}

function AreaCard({ plan, area, onOpenModules, onEditModule }: { plan: Plan; area: Area; onOpenModules: () => void; onEditModule: (id: string) => void }) {
  const mods = modulesOfArea(plan, area.id);
  const t = tally(mods);
  const state = rangeState(t, area.minCredits, area.maxCredits);
  const scale = area.minCredits === area.maxCredits ? Math.max(area.maxCredits, t.total, 1) : Math.max(Math.ceil(area.maxCredits * 1.15), t.total);
  const counted = mods.filter((m) => m.status !== "failed" && !(m.status === "planned" && m.semester == null));
  const open = counted.filter((m) => m.status !== "passed");

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2.5">
        <Swatch color={area.color} size={12} />
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold">{area.name}</h3>
        <Badge tone={state.tone}>{state.label}</Badge>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span className="text-[32px] font-semibold leading-9 tracking-tight tabular">{t.total}</span>
        <span className="text-sm text-fg-2">/ {areaRange(area)} CP eingeplant</span>
        <span className="ml-auto text-[13px] text-fg-2">{breakdown(t)}</span>
      </div>
      <RangeBar min={area.minCredits} max={area.maxCredits} scale={scale} segments={tallySegments(t, area.color)} color={area.color} height={10} label />

      {area.subAreas.length ? (
        <>
          <div className="h-px bg-line" />
          <div className="flex flex-col gap-2.5">
            <span className="caps">Davon</span>
            {area.subAreas.map((s) => {
              const st = tally(modulesOfSubArea(plan, s.id));
              const ss = rangeState(st, s.minCredits, s.maxCredits);
              const ok = !hasRule(s) || ss.tone === "success" || ss.tone === "neutral";
              const subScale = Math.max(Math.ceil((s.maxCredits ?? (s.minCredits ?? 0) * 2) * 1.1), st.total, 1);
              return (
                <div key={s.id} className="flex items-center gap-2.5">
                  <Icon name={ok ? "check" : "alert"} className={ok ? "text-success" : ss.tone === "danger" ? "text-danger" : "text-warning"} />
                  <span className="min-w-0 flex-1 truncate text-sm" title={s.name}>
                    {s.name}
                  </span>
                  <div className="hidden w-[120px] sm:block">
                    <RangeBar min={s.minCredits} max={s.maxCredits} scale={subScale} segments={tallySegments(st, area.color)} color={area.color} height={6} />
                  </div>
                  <span className="w-[92px] text-right text-xs font-medium text-fg-2 tabular">
                    {st.total} / {subAreaRange(s)} CP
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="h-px bg-line" />
          <div className="flex flex-col gap-2">
            <span className="caps">{open.length ? `Noch offen · ${open.length}` : "Noch offen"}</span>
            {open.length ? (
              <ul className="flex flex-col">
                {open.slice(0, 3).map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => onEditModule(m.id)} className="-mx-1.5 flex w-[calc(100%+12px)] items-center gap-2.5 rounded-md px-1.5 py-1 text-left hover:bg-subtle">
                      <StatusIcon status={m.status} />
                      <span className="flex-1 truncate text-[13px]">{m.title}</span>
                      <span className="text-xs font-medium text-fg-3">{m.semester ? semesterLabel(plan.startTerm, m.semester) : ""}</span>
                      <span className="w-10 text-right text-xs font-medium text-fg-2 tabular">{m.credits} CP</span>
                    </button>
                  </li>
                ))}
                {open.length > 3 ? <li className="pt-1 text-xs font-medium text-fg-3">+ {open.length - 3} weitere</li> : null}
              </ul>
            ) : (
              <p className={cx("text-[13px]", t.passed ? "text-success" : "text-fg-2")}>{t.passed ? "Alles bestanden" : "Noch keine Module eingetragen"}</p>
            )}
          </div>
        </>
      )}

      {counted.length ? (
        <div className="flex flex-col gap-2">
          <span className="caps">
            {counted.length} {counted.length === 1 ? "Modul" : "Module"} · ein Block pro Modul, Breite = CP
          </span>
          <Mosaic modules={counted} color={area.color} />
        </div>
      ) : null}

      <div className="mt-auto pt-1">
        <LinkButton onClick={onOpenModules}>Module ansehen</LinkButton>
      </div>
    </Card>
  );
}

const STEP_STYLE: Record<NextStep["tone"], { icon: "alert" | "info" | "check"; className: string }> = {
  warning: { icon: "alert", className: "bg-warning/12 text-warning" },
  danger: { icon: "alert", className: "bg-danger/12 text-danger" },
  info: { icon: "info", className: "bg-info/12 text-info" },
  success: { icon: "check", className: "bg-success/12 text-success" },
};

function NextStepRow({ step, onAction }: { step: NextStep; onAction: () => void }) {
  const st = STEP_STYLE[step.tone];
  return (
    <li className="flex flex-wrap items-center gap-3.5 py-3.5 sm:flex-nowrap">
      <span className={cx("grid size-8 shrink-0 place-items-center rounded-full", st.className)}>
        <Icon name={st.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{step.title}</p>
        <p className="text-[13px] text-fg-2">{step.description}</p>
      </div>
      {step.action ? (
        <Button size="sm" icon={step.action.target === "add" ? "plus" : "arrow-right"} onClick={onAction} className="ml-12 sm:ml-0">
          {step.action.label}
        </Button>
      ) : null}
    </li>
  );
}
