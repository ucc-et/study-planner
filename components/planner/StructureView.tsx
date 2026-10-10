"use client";

import * as React from "react";

import { currentTerm, sameTerm, startTermOptions, termLabel } from "../../lib/planner/semesters";
import { areaRange, modulesOfArea } from "../../lib/planner/stats";
import { AREA_COLORS } from "../../lib/planner/storage";
import { findTemplate } from "../../lib/planner/templates";
import type { Area, AreaColor, Plan, Term } from "../../lib/planner/types";
import { AreaTag, areaColor, areaMix, Button, Card, cx, Icon, StackedBar } from "./ui";
import type { PlannerActions } from "./usePlanner";

export function StructureView({
  plan,
  actions,
  onConfirm,
  onExportTemplate,
}: {
  plan: Plan;
  actions: PlannerActions;
  onConfirm: (req: { title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void }) => void;
  onExportTemplate: () => void;
}) {
  const template = findTemplate(plan.program.templateId);
  const minSum = plan.areas.reduce((a, x) => a + x.minCredits, 0);
  const maxSum = plan.areas.reduce((a, x) => a + x.maxCredits, 0);
  const total = plan.program.totalCredits;
  const problems: string[] = [];
  if (minSum > total) problems.push(`Die Minima ergeben schon ${minSum} CP – mehr als die ${total} CP des Studiengangs.`);
  if (maxSum < total) problems.push(`Selbst mit allen Maxima kommst du nur auf ${maxSum} von ${total} CP.`);
  for (const a of plan.areas) {
    if (a.maxCredits < a.minCredits) problems.push(`${a.name}: Maximum ist kleiner als das Minimum.`);
    const subMin = a.subAreas.reduce((s, x) => s + (x.minCredits ?? 0), 0);
    if (subMin > a.maxCredits) problems.push(`${a.name}: Die Teilbereiche verlangen zusammen mind. ${subMin} CP, erlaubt sind höchstens ${a.maxCredits}.`);
    for (const s of a.subAreas) {
      if (s.minCredits != null && s.maxCredits != null && s.maxCredits < s.minCredits) problems.push(`${a.name} › ${s.name}: Maximum ist kleiner als das Minimum.`);
    }
  }
  const terms = startTermOptions();
  if (!terms.some((t) => sameTerm(t, plan.startTerm))) terms.push(plan.startTerm);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-[34px] tracking-tight">Struktur</h1>
          <p className="text-sm text-fg-2">
            {template ? `Vorlage ${template.degree} ${template.name} · ${template.regulation}` : "Eigene Struktur"} · Bereiche und CP-Regeln deiner
            Prüfungsordnung
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {template ? (
            <Button
              variant="ghost"
              icon="undo"
              onClick={() =>
                onConfirm({
                  title: "Struktur zurücksetzen?",
                  body: `Bereiche und Regeln werden auf die Vorlage ${template.degree} ${template.name} (${template.regulation}) zurückgesetzt. Deine Module bleiben erhalten.`,
                  confirmLabel: "Zurücksetzen",
                  onConfirm: actions.resetStructure,
                })
              }
            >
              Zurücksetzen
            </Button>
          ) : null}
          <Button icon="download" onClick={onExportTemplate}>
            Vorlage exportieren
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <div className="flex flex-col gap-3">
          <Card className="grid gap-4 rounded-xl p-5 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Abschluss" value={plan.program.degree} placeholder="B.Sc." onChange={(v) => actions.updateProgram({ degree: v })} />
            <TextField label="Studiengang" value={plan.program.name} onChange={(v) => actions.updateProgram({ name: v })} />
            <TextField label="Prüfungsordnung" value={plan.program.regulation} placeholder="PO 2023" onChange={(v) => actions.updateProgram({ regulation: v })} />
            <NumberField label="Gesamtumfang (CP)" value={plan.program.totalCredits} onChange={(v) => actions.updateProgram({ totalCredits: Math.max(v ?? 0, 1) })} />
            <NumberField
              label="Regelstudienzeit (Semester)"
              value={plan.program.standardSemesters}
              onChange={(v) => {
                const n = Math.max(Math.round(v ?? 1), 1);
                actions.updateProgram({ standardSemesters: n });
                if (plan.semesterCount < n) actions.updatePlan({ semesterCount: n });
              }}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-2">Studienbeginn</span>
              <select
                className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm"
                value={`${plan.startTerm.season}-${plan.startTerm.year}`}
                onChange={(e) => {
                  const [season, year] = e.target.value.split("-");
                  actions.updatePlan({ startTerm: { season: season as Term["season"], year: Number(year) } });
                }}
              >
                {terms.map((t) => (
                  <option key={`${t.season}-${t.year}`} value={`${t.season}-${t.year}`}>
                    {termLabel(t, true)}
                    {sameTerm(t, currentTerm()) ? " (aktuell)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          {plan.areas.map((a, i) => (
            <AreaEditor
              key={a.id}
              area={a}
              first={i === 0}
              last={i === plan.areas.length - 1}
              moduleCount={modulesOfArea(plan, a.id).length}
              actions={actions}
              onConfirm={onConfirm}
            />
          ))}

          <button
            type="button"
            onClick={actions.addArea}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-3.5 text-sm font-medium text-fg-2 hover:border-fg-3 hover:text-fg"
          >
            <Icon name="plus" />
            Bereich hinzufügen
          </button>

          <div className="flex items-start gap-2.5 rounded-xl bg-subtle px-4 py-3 text-[13px] text-fg-2">
            <Icon name="info" className="mt-px" />
            <p>
              Maximal eine Ebene Teilbereiche – das reicht für alle untersuchten TU-Ordnungen. Lehrveranstaltungen und Prüfungen werden bewusst
              nicht modelliert: Credit Points gibt es pro Modul.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-3 rounded-xl p-5">
            <div className="flex items-center gap-2.5">
              <span className={cx("grid size-7 place-items-center rounded-full", problems.length ? "bg-warning/12 text-warning" : "bg-success/12 text-success")}>
                <Icon name={problems.length ? "alert" : "check"} />
              </span>
              <h2 className="text-base font-semibold">{problems.length ? "Bitte prüfen" : "Struktur ist schlüssig"}</h2>
            </div>
            {problems.length ? (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-fg-2">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-fg-2">Die Bereiche lassen sich zu genau {total} CP kombinieren.</p>
            )}
            <dl className="flex flex-col gap-1.5 text-[13px]">
              <Row label="Summe der Minima" value={`${minSum} CP`} />
              <Row label="Gesamtumfang" value={`${total} CP`} strong />
              <Row label="Summe der Maxima" value={`${maxSum} CP`} />
            </dl>
          </Card>

          <Card className="flex flex-col gap-3.5 rounded-xl p-5">
            <span className="caps">Vorschau · Mindestwerte</span>
            <StackedBar
              height={12}
              scale={Math.max(total, minSum)}
              segments={plan.areas.map((a) => ({ value: a.minCredits, color: a.color, opacity: 100, gapAfter: true, label: a.name }))}
            />
            <ul className="flex flex-col gap-2">
              {plan.areas.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <AreaTag color={a.color}>{a.name}</AreaTag>
                  <span className="text-xs font-medium text-fg-2 tabular">{areaRange(a)} CP</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-col gap-2 rounded-xl bg-subtle p-5">
            <div className="flex items-center gap-2">
              <Icon name="file" className="text-fg-2" />
              <span className="text-sm font-medium">Woher kommen die Zahlen?</span>
            </div>
            <p className="text-[13px] text-fg-2">
              {plan.program.source
                ? `Aus dem Studien- und Prüfungsplan (${plan.program.source}). Verbindlich ist immer die Ordnung deines Studienbeginns – im Zweifel beim Studienbüro nachfragen.`
                : "Trag die Bereiche und CP-Spannen aus dem Studien- und Prüfungsplan deiner Prüfungsordnung ein (Satzungsbeilage der TU Darmstadt)."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-medium" : "text-fg-2"}>{label}</dt>
      <dd className={cx("tabular", strong ? "font-semibold" : "text-fg-2")}>{value}</dd>
    </div>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-2">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm outline-none placeholder:text-fg-3 focus:border-fg"
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number | null) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-2">{label}</span>
      <NumberInput value={value} onChange={onChange} className="w-full" />
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  className,
  label,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      aria-label={label}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Math.max(Number(e.target.value), 0))}
      className={cx("h-9 w-[52px] rounded-lg border border-line bg-surface text-center text-sm font-medium outline-none placeholder:text-fg-3 focus:border-fg tabular", className)}
    />
  );
}

function AreaEditor({
  area,
  first,
  last,
  moduleCount,
  actions,
  onConfirm,
}: {
  area: Area;
  first: boolean;
  last: boolean;
  moduleCount: number;
  actions: PlannerActions;
  onConfirm: (req: { title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void }) => void;
}) {
  const [palette, setPalette] = React.useState(false);
  return (
    <Card className="rounded-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
        <div className="flex flex-col">
          <button type="button" disabled={first} onClick={() => actions.moveArea(area.id, -1)} className="text-fg-3 hover:text-fg disabled:opacity-30" aria-label="Nach oben">
            <Icon name="chevron-up" size={14} />
          </button>
          <button type="button" disabled={last} onClick={() => actions.moveArea(area.id, 1)} className="text-fg-3 hover:text-fg disabled:opacity-30" aria-label="Nach unten">
            <Icon name="chevron-down" size={14} />
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPalette((p) => !p)}
            className="block size-5 rounded-md ring-offset-2 ring-offset-surface hover:ring-2 hover:ring-line-strong"
            style={{ background: areaColor(area.color) }}
            aria-label="Farbe wählen"
            aria-expanded={palette}
          />
          {palette ? (
            <div className="absolute left-0 top-7 z-10 grid grid-cols-4 gap-1.5 rounded-xl border border-line bg-surface p-2 shadow-overlay">
              {AREA_COLORS.map((c: AreaColor) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    actions.updateArea(area.id, { color: c });
                    setPalette(false);
                  }}
                  className={cx("size-6 rounded-md", c === area.color && "ring-2 ring-fg ring-offset-2 ring-offset-surface")}
                  style={{ background: areaColor(c) }}
                  aria-label={`Farbe ${c}`}
                />
              ))}
            </div>
          ) : null}
        </div>
        <input
          value={area.name}
          onChange={(e) => actions.updateArea(area.id, { name: e.target.value })}
          aria-label="Name des Bereichs"
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium outline-none focus:border-fg"
        />
        <div className="flex items-center gap-1.5">
          <NumberInput label="Minimum CP" value={area.minCredits} onChange={(v) => actions.updateArea(area.id, { minCredits: v ?? 0 })} />
          <span className="text-fg-3">–</span>
          <NumberInput label="Maximum CP" value={area.maxCredits} onChange={(v) => actions.updateArea(area.id, { maxCredits: v ?? 0 })} />
          <span className="text-[13px] text-fg-2">CP</span>
        </div>
        <Button
          variant="ghost"
          icon="trash"
          size="sm"
          aria-label={`${area.name} löschen`}
          title="Bereich löschen"
          onClick={() =>
            onConfirm({
              title: `${area.name} löschen?`,
              body: moduleCount
                ? `Der Bereich und ${moduleCount === 1 ? "sein Modul" : `seine ${moduleCount} Module`} werden gelöscht.`
                : "Der Bereich wird gelöscht.",
              confirmLabel: "Löschen",
              danger: true,
              onConfirm: () => actions.deleteArea(area.id),
            })
          }
        />
      </div>
      <div className="flex flex-col gap-2 pb-3.5 pl-4 pr-4 sm:pl-[60px]">
        {area.subAreas.length ? <span className="caps">Davon (Teilbereiche)</span> : null}
        {area.subAreas.map((s, i) => (
          <div key={s.id} className="flex items-stretch">
            <span aria-hidden className="relative mr-2 flex w-4 shrink-0 justify-center">
              <span className={cx("w-0.5", i === area.subAreas.length - 1 ? "h-1/2" : "h-full")} style={{ background: areaMix(area.color, 55) }} />
              <span className="absolute left-1/2 top-1/2 h-0.5 w-2" style={{ background: areaMix(area.color, 55) }} />
            </span>
            <div className="flex flex-1 flex-wrap items-center gap-2 py-1 sm:flex-nowrap">
              <input
                value={s.name}
                onChange={(e) => actions.updateSubArea(area.id, s.id, { name: e.target.value })}
                aria-label="Name des Teilbereichs"
                className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-fg"
              />
              <div className="flex items-center gap-1.5">
                <NumberInput label="Minimum CP" placeholder="–" value={s.minCredits} onChange={(v) => actions.updateSubArea(area.id, s.id, { minCredits: v })} />
                <span className="text-fg-3">–</span>
                <NumberInput label="Maximum CP" placeholder="–" value={s.maxCredits} onChange={(v) => actions.updateSubArea(area.id, s.id, { maxCredits: v })} />
                <span className="text-[13px] text-fg-2">CP</span>
              </div>
              <Button
                variant="ghost"
                icon="trash"
                size="sm"
                aria-label={`${s.name} löschen`}
                title="Teilbereich löschen (Module bleiben im Bereich)"
                onClick={() => actions.deleteSubArea(area.id, s.id)}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => actions.addSubArea(area.id)} className="flex items-center gap-1.5 self-start py-1 text-[13px] text-fg-3 hover:text-fg">
          <Icon name="plus" />
          {area.subAreas.length ? "Teilbereich hinzufügen" : "Teilbereich hinzufügen (optional)"}
        </button>
      </div>
    </Card>
  );
}
