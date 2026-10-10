"use client";

import * as React from "react";

import type { Plan, ThemePreference, View } from "../../lib/planner/types";
import { Button, cx, Icon, type IconName } from "./ui";

export const VIEWS: { id: View; label: string; short: string; icon: IconName; hash: string }[] = [
  { id: "overview", label: "Übersicht", short: "Übersicht", icon: "dashboard", hash: "uebersicht" },
  { id: "semester", label: "Semesterplan", short: "Semester", icon: "columns", hash: "semester" },
  { id: "modules", label: "Module", short: "Module", icon: "list", hash: "module" },
  { id: "structure", label: "Struktur", short: "Struktur", icon: "sliders", hash: "struktur" },
];

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center bg-inverse font-semibold text-fg-inverse"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), fontSize: size > 24 ? 16 : 13 }}
    >
      S
    </span>
  );
}

const THEME_ORDER: ThemePreference[] = ["system", "light", "dark"];
const THEME_META: Record<ThemePreference, { icon: IconName; label: string }> = {
  system: { icon: "monitor", label: "Design: wie System" },
  light: { icon: "sun", label: "Design: hell" },
  dark: { icon: "moon", label: "Design: dunkel" },
};

export function ThemeButton({ theme, onChange }: { theme: ThemePreference; onChange: (t: ThemePreference) => void }) {
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  return (
    <Button
      variant="ghost"
      icon={THEME_META[theme].icon}
      title={`${THEME_META[theme].label} – klicken für „${THEME_META[next].label.replace("Design: ", "")}“`}
      aria-label={THEME_META[theme].label}
      onClick={() => onChange(next)}
    />
  );
}

export function AppHeader({
  plan,
  view,
  theme,
  onTheme,
  onNavigate,
  onSwitchProgram,
  onImport,
  onExport,
  onAddModule,
}: {
  plan: Plan;
  view: View;
  theme: ThemePreference;
  onTheme: (t: ThemePreference) => void;
  onNavigate: (v: View) => void;
  onSwitchProgram: () => void;
  onImport: () => void;
  onExport: () => void;
  onAddModule: () => void;
}) {
  const programLabel = [plan.program.degree, plan.program.name].filter(Boolean).join(" ");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:w-[400px]">
          <Logo />
          <span className="hidden text-base font-semibold sm:inline">SSP</span>
          <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
          <button
            type="button"
            onClick={onSwitchProgram}
            title="Studiengang wechseln"
            className="flex min-w-0 items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1.5 text-sm font-medium hover:bg-line"
          >
            <Icon name="cap" className="hidden text-fg-2 sm:block" />
            <span className="truncate">
              {programLabel}
              {plan.program.regulation ? <span className="hidden md:inline"> · {plan.program.regulation}</span> : null}
            </span>
            <Icon name="chevron-down" className="text-fg-3" />
          </button>
        </div>

        <nav aria-label="Ansichten" className="hidden items-center gap-0.5 rounded-[10px] bg-subtle p-[3px] md:flex">
          {VIEWS.filter((v) => v.id !== "structure").map((v) => (
            <button
              key={v.id}
              type="button"
              aria-current={view === v.id ? "page" : undefined}
              onClick={() => onNavigate(v.id)}
              className={cx(
                "flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-sm font-medium transition-colors",
                view === v.id ? "bg-surface text-fg shadow-card" : "text-fg-2 hover:text-fg",
              )}
            >
              <Icon name={v.icon} />
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1 lg:w-[400px]">
          <Button variant="ghost" icon="upload" onClick={onImport} className="max-lg:hidden">
            Import
          </Button>
          <Button variant="ghost" icon="download" onClick={onExport} className="max-lg:hidden">
            Export
          </Button>
          <Button variant="ghost" icon="upload" onClick={onImport} title="Plan importieren" aria-label="Plan importieren" className="lg:hidden" />
          <Button variant="ghost" icon="download" onClick={onExport} title="Plan exportieren" aria-label="Plan exportieren" className="lg:hidden" />
          <ThemeButton theme={theme} onChange={onTheme} />
          <Button variant="primary" icon="plus" onClick={onAddModule} className="ml-1 max-md:hidden">
            Modul hinzufügen
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MobileNav({ view, onNavigate, onAddModule }: { view: View; onNavigate: (v: View) => void; onAddModule: () => void }) {
  const items = VIEWS;
  return (
    <nav
      aria-label="Ansichten"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-3">
        {items.slice(0, 2).map((v) => (
          <NavItem key={v.id} item={v} active={view === v.id} onClick={() => onNavigate(v.id)} />
        ))}
        <button
          type="button"
          onClick={onAddModule}
          aria-label="Modul hinzufügen"
          className="grid size-12 place-items-center rounded-full bg-inverse text-fg-inverse shadow-overlay"
        >
          <Icon name="plus" size={20} />
        </button>
        {items.slice(2).map((v) => (
          <NavItem key={v.id} item={v} active={view === v.id} onClick={() => onNavigate(v.id)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ item, active, onClick }: { item: (typeof VIEWS)[number]; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cx("flex w-16 flex-col items-center gap-1 text-xs font-medium", active ? "text-fg" : "text-fg-3")}
    >
      <Icon name={item.icon} size={20} />
      {item.short}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
export type ToastData = { id: number; message: string; tone?: "default" | "error"; action?: { label: string; onClick: () => void } };

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onClose, toast.action ? 6000 : 3500);
    return () => window.clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8" role="status" aria-live="polite">
      <div
        className={cx(
          "pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-overlay",
          toast.tone === "error" ? "bg-danger text-white" : "bg-inverse text-fg-inverse",
        )}
      >
        <span>{toast.message}</span>
        {toast.action ? (
          <button
            type="button"
            className="font-semibold underline-offset-2 hover:underline"
            onClick={() => {
              toast.action?.onClick();
              onClose();
            }}
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal frame + confirm dialog
// ---------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  width?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const body = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = body;
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-start sm:px-4 sm:pt-[8vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ background: "var(--scrim)" }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-overlay sm:max-h-[84vh] sm:rounded-2xl"
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>
  );
}

export type ConfirmRequest = {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  return (
    <Modal open={!!request} onClose={onClose} labelledBy="confirm-title" width={440}>
      {request ? (
        <>
          <div className="flex flex-col gap-2 px-6 pb-2 pt-6">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {request.title}
            </h2>
            <div className="text-sm text-fg-2">{request.body}</div>
          </div>
          <div className="flex justify-end gap-2 px-6 pb-6 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              autoFocus
              className={request.danger ? "!bg-danger !text-white" : undefined}
              onClick={() => {
                request.onConfirm();
                onClose();
              }}
            >
              {request.confirmLabel}
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
