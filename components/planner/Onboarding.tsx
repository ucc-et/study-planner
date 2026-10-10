"use client";

import * as React from "react";

import { currentTerm, sameTerm, startTermOptions, termLabel } from "../../lib/planner/semesters";
import { PROGRAM_TEMPLATES, type ProgramTemplate } from "../../lib/planner/templates";
import type { Term, ThemePreference } from "../../lib/planner/types";
import { Logo, ThemeButton } from "./AppChrome";
import { areaColor, Badge, Button, cx, Icon, type IconName, StackedBar } from "./ui";

export function Onboarding({
  hasExistingPlan,
  theme,
  onTheme,
  onChooseTemplate,
  onBlank,
  onSample,
  onImport,
  onCancel,
  onExportCurrent,
}: {
  hasExistingPlan: boolean;
  theme: ThemePreference;
  onTheme: (t: ThemePreference) => void;
  onChooseTemplate: (t: ProgramTemplate, start: Term) => void;
  onBlank: (start: Term) => void;
  onSample: () => void;
  onImport: () => void;
  onCancel?: () => void;
  onExportCurrent?: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string>(PROGRAM_TEMPLATES[0].id);
  const [start, setStart] = React.useState<Term>(() => currentTerm());
  const terms = React.useMemo(() => startTermOptions(), []);

  const q = query.trim().toLowerCase();
  const visible = PROGRAM_TEMPLATES.filter((t) => !q || `${t.degree} ${t.name} ${t.regulation}`.toLowerCase().includes(q));
  const chosen = PROGRAM_TEMPLATES.find((t) => t.id === selected) ?? null;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-[1152px] flex-col items-center gap-9 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="flex w-full items-center justify-between">
          {onCancel ? (
            <Button variant="ghost" icon="chevron-left" onClick={onCancel}>
              Zurück
            </Button>
          ) : (
            <span />
          )}
          <ThemeButton theme={theme} onChange={onTheme} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Logo />
          <span className="text-base font-semibold">SSP</span>
          <span className="text-sm text-fg-2">· Studienplaner für die TU Darmstadt</span>
          <Badge>inoffiziell</Badge>
        </div>

        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-[44px]">Was studierst du?</h1>
          <p className="max-w-xl text-sm text-fg-2">
            Wähle deine Prüfungsordnung – Bereiche und CP-Regeln sind dann schon eingetragen. Du kannst alles später unter „Struktur“ anpassen.
          </p>
        </div>

        {hasExistingPlan ? (
          <div className="flex w-full max-w-[560px] items-start gap-3 rounded-xl bg-warning/12 px-4 py-3 text-sm">
            <Icon name="alert" className="mt-0.5 text-warning" />
            <p className="flex-1">
              Ein neuer Plan ersetzt deinen aktuellen. Exportiere ihn vorher, wenn du ihn behalten möchtest.
            </p>
            {onExportCurrent ? (
              <button type="button" className="shrink-0 font-medium underline-offset-2 hover:underline" onClick={onExportCurrent}>
                Exportieren
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="flex h-11 w-full max-w-[560px] items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 focus-within:border-fg">
          <Icon name="search" className="text-fg-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Studiengang oder Prüfungsordnung suchen …"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-fg-3"
            aria-label="Studiengang suchen"
          />
        </label>

        <div className="grid w-full gap-4 md:grid-cols-3" role="radiogroup" aria-label="Vorlagen">
          {visible.map((t) => (
            <ProgramCard key={t.id} template={t} selected={t.id === selected} onSelect={() => setSelected(t.id)} />
          ))}
          {!visible.length ? (
            <p className="col-span-full py-6 text-center text-sm text-fg-2">Keine Vorlage gefunden – starte mit der leeren Vorlage.</p>
          ) : null}
        </div>

        <div className="grid w-full gap-4 md:grid-cols-3">
          <OptionCard icon="layers" title="Leere Vorlage" onClick={() => onBlank(start)}>
            Bereiche und Regeln selbst anlegen – z. B. für ein Zweitfach oder eine ältere Prüfungsordnung.
          </OptionCard>
          <OptionCard icon="upload" title="Plan importieren" onClick={onImport}>
            Eine exportierte SSP-Datei (.json) öffnen. Dateien aus dem alten Planer werden automatisch umgewandelt.
          </OptionCard>
          <OptionCard icon="bookmark" title="Beispielplan ansehen" onClick={onSample}>
            Ein ausgefüllter B.Sc.-Informatik-Plan im 5. Semester – zum Ausprobieren, bevor du deine eigenen Module einträgst.
          </OptionCard>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-fg-2">Studienbeginn</span>
            <select
              className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium"
              value={`${start.season}-${start.year}`}
              onChange={(e) => {
                const [season, year] = e.target.value.split("-");
                setStart({ season: season as Term["season"], year: Number(year) });
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
          <Button variant="primary" icon="arrow-right" disabled={!chosen} onClick={() => chosen && onChooseTemplate(chosen, start)}>
            {chosen ? `Weiter mit ${chosen.degree} ${chosen.name.split(" – ")[0]}` : "Vorlage wählen"}
          </Button>
        </div>
        <p className="-mt-4 text-[13px] text-fg-3">Keine Anmeldung. Deine Daten bleiben auf deinem Gerät.</p>
      </div>
    </div>
  );
}

function ProgramCard({ template: t, selected, onSelect }: { template: ProgramTemplate; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "flex flex-col gap-3.5 rounded-[14px] bg-surface p-5 text-left shadow-card transition-colors",
        selected ? "border-2 border-fg p-[19px]" : "border border-line hover:border-line-strong",
      )}
    >
      <div className="flex w-full items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="caps">{t.degree}</span>
          <span className="text-xl font-semibold leading-tight tracking-tight">{t.name}</span>
        </div>
        {selected ? (
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-inverse text-fg-inverse">
            <Icon name="check" size={14} />
          </span>
        ) : null}
      </div>
      <span className="text-[13px] text-fg-2">
        {t.regulation} · {t.validFrom} · {t.totalCredits} CP
      </span>
      <StackedBar
        height={8}
        scale={t.totalCredits}
        segments={t.areas.map((a) => ({ value: a.min, color: a.color, opacity: 100, gapAfter: true, label: a.name }))}
      />
      <ul className="flex w-full flex-col gap-1.5">
        {t.areas.map((a) => (
          <li key={a.key} className="flex items-center gap-2 text-[13px]">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ background: areaColor(a.color) }} />
            <span className="flex-1">{a.name}</span>
            <span className="text-xs font-medium text-fg-2 tabular">{a.min === a.max ? `${a.min} CP` : `${a.min}–${a.max} CP`}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function OptionCard({ icon, title, children, onClick }: { icon: IconName; title: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2.5 rounded-[14px] border border-dashed border-line-strong bg-surface/50 p-5 text-left transition-colors hover:border-fg-3 hover:bg-surface"
    >
      <span className="grid size-9 place-items-center rounded-[10px] bg-subtle text-fg-2">
        <Icon name={icon} size={18} />
      </span>
      <span className="text-base font-semibold">{title}</span>
      <span className="text-[13px] text-fg-2">{children}</span>
    </button>
  );
}
