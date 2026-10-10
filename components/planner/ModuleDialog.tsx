"use client";

import * as React from "react";

import { currentSemester, semesterLabel } from "../../lib/planner/semesters";
import { areaRange, formatGrade, rangeState, semesterColumns, subAreaRange, tally } from "../../lib/planner/stats";
import type { Module, ModuleStatus, Plan } from "../../lib/planner/types";
import { clampCredits, parseMaybeNumber } from "../../lib/planner/utils";
import { Modal } from "./AppChrome";
import { areaMix, Button, cx, Icon, RangeBar, STATUS_META, StatusIcon, Swatch, tallySegments } from "./ui";
import type { ModuleDraft } from "./usePlanner";

export type DialogState =
  | { mode: "add"; defaults: { areaId?: string; subAreaId?: string | null; semester?: number | null } }
  | { mode: "edit"; moduleId: string }
  | null;

const CP_CHOICES = [3, 5, 6, 9, 10, 12];
const GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];
const STATUSES: ModuleStatus[] = ["planned", "enrolled", "passed", "failed"];

export function ModuleDialog({
  plan,
  state,
  onClose,
  onSave,
  onDelete,
}: {
  plan: Plan;
  state: DialogState;
  onClose: () => void;
  onSave: (draft: ModuleDraft, id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const editing = state?.mode === "edit" ? plan.modules.find((m) => m.id === state.moduleId) ?? null : null;
  return (
    <Modal open={!!state} onClose={onClose} labelledBy="module-dialog-title" width={608}>
      {state ? (
        <ModuleForm
          // Remount for every opening so the form starts from fresh values.
          key={state.mode === "edit" ? state.moduleId : `add-${JSON.stringify(state.defaults)}`}
          plan={plan}
          editing={editing}
          defaults={state.mode === "add" ? state.defaults : {}}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </Modal>
  );
}

function ModuleForm({
  plan,
  editing,
  defaults,
  onClose,
  onSave,
  onDelete,
}: {
  plan: Plan;
  editing: Module | null;
  defaults: { areaId?: string; subAreaId?: string | null; semester?: number | null };
  onClose: () => void;
  onSave: (draft: ModuleDraft, id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const now = currentSemester(plan.startTerm);
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [credits, setCredits] = React.useState<number | null>(editing?.credits ?? null);
  const [customCredits, setCustomCredits] = React.useState(() =>
    editing && !CP_CHOICES.includes(editing.credits) ? String(editing.credits).replace(".", ",") : "",
  );
  const [target, setTarget] = React.useState<{ areaId: string; subAreaId: string | null }>({
    areaId: editing?.areaId ?? defaults.areaId ?? plan.areas[0]?.id ?? "",
    subAreaId: editing ? editing.subAreaId : (defaults.subAreaId ?? null),
  });
  const initialSemester = editing ? editing.semester : defaults.semester !== undefined ? defaults.semester : now;
  const [semester, setSemester] = React.useState<number | null>(initialSemester);
  const [status, setStatus] = React.useState<ModuleStatus>(editing?.status ?? statusForSemester(initialSemester, now));
  const [grade, setGrade] = React.useState(editing?.grade != null ? formatGrade(editing.grade) : "");
  const [touched, setTouched] = React.useState(false);

  const gradeValue = parseMaybeNumber(grade);
  const gradeInvalid = grade.trim() !== "" && (gradeValue == null || gradeValue < 1 || gradeValue > 5);
  const errors = {
    title: !title.trim() ? "Bitte gib einen Namen ein." : null,
    credits: !credits || credits <= 0 ? "Bitte wähle die Credit Points." : null,
    area: !target.areaId ? "Lege zuerst unter „Struktur“ einen Bereich an." : null,
    grade: gradeInvalid ? "Note zwischen 1,0 und 5,0." : null,
  };
  const valid = !errors.title && !errors.credits && !errors.area && !errors.grade;

  const columns = Math.max(semesterColumns(plan), now) + 1;
  const area = plan.areas.find((a) => a.id === target.areaId);
  const sub = area?.subAreas.find((s) => s.id === target.subAreaId) ?? null;

  // Live impact on the chosen area / sub-area.
  const draftModule: Module = {
    id: editing?.id ?? "draft",
    title,
    credits: credits ?? 0,
    areaId: target.areaId,
    subAreaId: target.subAreaId,
    semester,
    status,
    grade: null,
  };
  const others = plan.modules.filter((m) => m.id !== editing?.id);
  const areaAfter = tally([...others.filter((m) => m.areaId === target.areaId), draftModule]);
  const subAfter = sub ? tally([...others.filter((m) => m.subAreaId === sub.id), draftModule]) : null;
  const areaState = area ? rangeState(areaAfter, area.minCredits, area.maxCredits) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || !credits) return;
    onSave(
      {
        title: title.trim(),
        credits: clampCredits(credits),
        areaId: target.areaId,
        subAreaId: target.subAreaId,
        semester,
        status,
        grade: status === "passed" && gradeValue != null ? Math.round(gradeValue * 10) / 10 : null,
      },
      editing?.id ?? null,
    );
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col" noValidate>
      <div className="flex items-start gap-3 border-b border-line px-6 pb-4 pt-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="module-dialog-title" className="text-xl font-semibold tracking-tight">
            {editing ? "Modul bearbeiten" : "Modul hinzufügen"}
          </h2>
          <p className="text-[13px] text-fg-2">Ein Modul ist ein Eintrag – keine Vorlesungen, Übungen oder Prüfungen einzeln anlegen.</p>
        </div>
        <Button variant="ghost" icon="x" onClick={onClose} aria-label="Schließen" />
      </div>

      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
        <Field label="Modulname" htmlFor="module-title" error={touched ? errors.title : null} hint="Tipp: Namen einfach aus TUCaN kopieren.">
          <input
            id="module-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Algorithmen und Datenstrukturen"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none placeholder:text-fg-3 focus:border-fg focus:ring-1 focus:ring-fg"
          />
        </Field>

        <Field label="Credit Points" error={touched ? errors.credits : null}>
          <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Credit Points">
            {CP_CHOICES.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={credits === v && !customCredits}
                onClick={() => {
                  setCredits(v);
                  setCustomCredits("");
                }}
                className={cx(
                  "h-8 min-w-10 rounded-lg px-3 text-sm font-medium tabular",
                  credits === v && !customCredits ? "bg-inverse text-fg-inverse" : "border border-line bg-surface hover:bg-subtle",
                )}
              >
                {v}
              </button>
            ))}
            <input
              inputMode="decimal"
              aria-label="Andere Credit Points"
              placeholder="Andere …"
              value={customCredits}
              onChange={(e) => {
                setCustomCredits(e.target.value);
                const n = parseMaybeNumber(e.target.value);
                setCredits(n != null && n > 0 ? n : null);
              }}
              className={cx(
                "h-8 w-24 rounded-lg border bg-surface px-2.5 text-sm outline-none placeholder:text-fg-3",
                customCredits ? "border-fg" : "border-line",
              )}
            />
          </div>
        </Field>

        <Field label="Bereich" error={touched ? errors.area : null} hint="Teilbereiche sind eingerückt – du wählst immer genau eine Zeile.">
          <div className="overflow-hidden rounded-[10px] border border-line" role="radiogroup" aria-label="Bereich">
            {plan.areas.map((a) => {
              const areaT = tally(plan.modules.filter((m) => m.areaId === a.id && m.id !== editing?.id));
              const rows = [
                { subId: null as string | null, label: a.name, hint: `${areaT.total} / ${areaRange(a)} CP`, depth: 0 },
                ...a.subAreas.map((s) => ({
                  subId: s.id as string | null,
                  label: s.name,
                  hint: `${tally(plan.modules.filter((m) => m.subAreaId === s.id && m.id !== editing?.id)).total} / ${subAreaRange(s)} CP`,
                  depth: 1,
                })),
              ];
              return rows.map((r, i) => {
                const selected = target.areaId === a.id && target.subAreaId === r.subId;
                return (
                  <button
                    key={`${a.id}-${r.subId ?? "area"}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTarget({ areaId: a.id, subAreaId: r.subId })}
                    className={cx("flex w-full items-stretch border-b border-line text-left last:border-b-0", !selected && "hover:bg-subtle/60")}
                    style={selected ? { background: areaMix(a.color, 13) } : undefined}
                  >
                    <span className="flex flex-1 items-center gap-2.5 py-2.5 pl-3 pr-3">
                      {r.depth ? (
                        <span aria-hidden className="relative flex w-4 shrink-0 justify-center self-stretch">
                          <span className={cx("w-0.5", i === rows.length - 1 ? "h-1/2" : "h-full")} style={{ background: areaMix(a.color, 55) }} />
                          <span className="absolute left-1/2 top-1/2 h-0.5 w-2" style={{ background: areaMix(a.color, 55) }} />
                        </span>
                      ) : null}
                      <span
                        aria-hidden
                        className={cx("size-4 shrink-0 rounded-full border bg-surface", selected ? "border-[5px] border-fg" : "border-[1.5px] border-line-strong")}
                      />
                      <Swatch color={a.color} size={r.depth ? 8 : 10} radius={r.depth ? 2 : 3} opacity={r.depth ? 60 : 100} />
                      <span className={cx("min-w-0 flex-1 truncate text-sm", r.depth ? "" : "font-medium")}>{r.label}</span>
                      <span className="shrink-0 text-xs font-medium text-fg-3 tabular">{r.hint}</span>
                    </span>
                  </button>
                );
              });
            })}
          </div>
        </Field>

        <div className="flex flex-col gap-5">
          <Field label="Semester" htmlFor="module-semester">
            <div className="relative sm:max-w-80">
              <Icon name="calendar" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-2" />
              <select
                id="module-semester"
                value={semester ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setSemester(v);
                  if (!editing) setStatus(statusForSemester(v, now));
                }}
                className="h-10 w-full appearance-none rounded-lg border border-line bg-surface pl-9 pr-8 text-sm"
              >
                <option value="">Merkzettel (ohne Semester)</option>
                {Array.from({ length: columns }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}. · {semesterLabel(plan.startTerm, n, true)}
                    {n === now ? " (aktuell)" : ""}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3" />
            </div>
          </Field>
          <Field label="Status">
            <div className="grid grid-cols-2 gap-0.5 rounded-[9px] bg-subtle p-[3px] sm:grid-cols-4" role="radiogroup" aria-label="Status">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={cx(
                    "flex h-[34px] items-center justify-center gap-1.5 rounded-[7px] px-1.5 text-[13px]",
                    status === s ? "bg-surface text-fg shadow-card" : "text-fg-2 hover:text-fg",
                  )}
                  title={STATUS_META[s].label}
                >
                  <StatusIcon status={s} />
                  <span className="truncate">{STATUS_META[s].label}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>

        {status === "passed" ? (
          <Field label="Note (optional)" htmlFor="module-grade" error={errors.grade} hint="Leer lassen bei unbenoteten Modulen.">
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                id="module-grade"
                inputMode="decimal"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="z. B. 1,7"
                className="h-8 w-20 rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-fg"
              />
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(formatGrade(g))}
                  className={cx(
                    "h-8 rounded-lg px-2 text-[13px] tabular",
                    gradeValue === g ? "bg-inverse text-fg-inverse" : "text-fg-2 hover:bg-subtle hover:text-fg",
                  )}
                >
                  {formatGrade(g)}
                </button>
              ))}
            </div>
          </Field>
        ) : null}

        {area && areaState ? (
          <div className="flex items-center gap-3 rounded-[10px] bg-subtle px-3.5 py-3">
            <Icon name="target" className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">
                {area.name} danach: {areaAfter.total} / {areaRange(area)} CP
              </span>
              <span className="text-[13px] text-fg-2">
                {sub && subAfter ? `${sub.name} danach: ${subAfter.total} / ${subAreaRange(sub)} CP · ` : ""}
                {semester == null && status === "planned"
                  ? "Auf dem Merkzettel zählt das Modul noch nicht."
                  : areaState.tone === "warning"
                    ? areaState.label.replace("einplanen", "bis zum Ziel")
                    : areaState.tone === "danger"
                      ? areaState.label
                      : "Ziel erreicht"}
              </span>
            </div>
            <div className="hidden w-32 shrink-0 sm:block">
              <RangeBar
                min={area.minCredits}
                max={area.maxCredits}
                scale={area.minCredits === area.maxCredits ? Math.max(area.maxCredits, areaAfter.total, 1) : Math.max(Math.ceil(area.maxCredits * 1.15), areaAfter.total)}
                segments={tallySegments(areaAfter, area.color)}
                color={area.color}
                height={6}
                className="!py-0"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-4">
        {editing ? (
          <Button variant="danger" icon="trash" onClick={() => onDelete(editing.id)}>
            Löschen
          </Button>
        ) : (
          <span className="hidden text-xs text-fg-3 sm:block">
            {status === "passed" ? "Note kannst du jederzeit nachtragen." : "Note eintragen, sobald das Modul bestanden ist."}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" icon="check" disabled={touched && !valid}>
            {editing ? "Speichern" : "Hinzufügen"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Sensible default: past semesters are done, the current one is running, later ones are planned. */
function statusForSemester(semester: number | null, now: number): ModuleStatus {
  if (semester == null || semester > now) return "planned";
  return semester < now ? "passed" : "enrolled";
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs font-medium text-fg-2">
          {label}
        </label>
      ) : (
        <span className="text-xs font-medium text-fg-2">{label}</span>
      )}
      {children}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : hint ? <span className="text-xs text-fg-3">{hint}</span> : null}
    </div>
  );
}
