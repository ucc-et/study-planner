"use client";

import * as React from "react";

import type { Tone } from "../../lib/planner/stats";
import type { AreaColor, ModuleStatus } from "../../lib/planner/types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const areaColor = (c: AreaColor) => `var(--area-${c})`;
/** Area colour with transparency, works in light and dark theme. */
export const areaMix = (c: AreaColor, percent: number) => `color-mix(in srgb, var(--area-${c}) ${percent}%, transparent)`;
/** Opaque tint of an area colour on the current surface. */
export const areaTint = (c: AreaColor, percent = 14) =>
  `color-mix(in srgb, var(--area-${c}) ${percent}%, var(--bg-surface))`;

// ---------------------------------------------------------------------------
// Icons (Lucide style, 24px grid)
// ---------------------------------------------------------------------------
const ICONS = {
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-up": <path d="m18 15-6-6-6 6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  grip: <><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  cap: <><path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
  dashboard: <><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>,
  columns: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" /></>,
  list: <><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" /></>,
  sliders: <><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  "arrow-right": <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></>,
  pencil: <path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" />,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  calendar: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  layers: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  monitor: <><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></>,
  bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16, className, strokeWidth = 2 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("shrink-0", className)}
    >
      {ICONS[name]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export const STATUS_META: Record<ModuleStatus, { label: string; short: string }> = {
  planned: { label: "Geplant", short: "geplant" },
  enrolled: { label: "Läuft", short: "läuft" },
  passed: { label: "Bestanden", short: "bestanden" },
  failed: { label: "Nicht bestanden", short: "nicht bestanden" },
};

export function StatusIcon({ status, size = 16 }: { status: ModuleStatus; size?: number }) {
  const label = STATUS_META[status].label;
  if (status === "passed") {
    return (
      <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 16 16" className="shrink-0">
        <circle cx="8" cy="8" r="8" fill="var(--success)" />
        <path d="M4.8 8.3l2.1 2.1 4.3-4.7" stroke="var(--bg-surface)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "enrolled") {
    return (
      <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 16 16" className="shrink-0">
        <circle cx="8" cy="8" r="7" stroke="var(--fg)" strokeWidth="1.6" fill="none" />
        <path d="M8 4a4 4 0 0 1 0 8z" fill="var(--fg)" />
      </svg>
    );
  }
  if (status === "failed") {
    return (
      <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 16 16" className="shrink-0">
        <circle cx="8" cy="8" r="8" fill="var(--danger)" />
        <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="var(--bg-surface)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r="7" stroke="var(--fg-3)" strokeWidth="1.6" strokeDasharray="2.4 2.2" fill="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Badge, tags, buttons
// ---------------------------------------------------------------------------
const TONE_CLASS: Record<Tone | "info", string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  neutral: "bg-subtle text-fg-2",
  info: "bg-info/12 text-info",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone | "info"; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-[3px] pl-2 pr-2.5 text-xs font-medium", TONE_CLASS[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Swatch({ color, size = 10, radius = 3, opacity = 100 }: { color: AreaColor; size?: number; radius?: number; opacity?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0"
      style={{ width: size, height: size, borderRadius: radius, background: opacity === 100 ? areaColor(color) : areaMix(color, opacity) }}
    />
  );
}

export function AreaTag({ color, children }: { color: AreaColor; children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md py-[3px] pl-2 pr-2.5 text-xs font-medium text-fg" style={{ background: areaMix(color, 15) }}>
      <Swatch color={color} size={8} radius={2} />
      {children}
    </span>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  size?: "md" | "sm";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", icon, size = "md", className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-9 px-3.5 text-sm" : "h-8 px-2.5 text-[13px]",
        icon && children ? (size === "md" ? "pl-3" : "pl-2") : "",
        !children && (size === "md" ? "w-9 px-0" : "w-8 px-0"),
        variant === "primary" && "bg-inverse text-fg-inverse hover:opacity-90",
        variant === "secondary" && "border border-line bg-surface text-fg hover:bg-subtle",
        variant === "ghost" && "text-fg-2 hover:bg-subtle hover:text-fg",
        variant === "danger" && "text-danger hover:bg-danger/10",
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
});

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CP bars
// ---------------------------------------------------------------------------
export type Segment = { value: number; color: AreaColor | "neutral"; opacity: number; gapAfter?: boolean; label?: string };

const segColor = (s: Segment) =>
  s.color === "neutral" ? `color-mix(in srgb, var(--fg-2) ${s.opacity}%, transparent)` : s.opacity === 100 ? areaColor(s.color) : areaMix(s.color, s.opacity);

function withOffsets(segments: Segment[]): { seg: Segment; left: number }[] {
  const out: { seg: Segment; left: number }[] = [];
  let left = 0;
  for (const seg of segments) {
    out.push({ seg, left });
    left += seg.value;
  }
  return out;
}

export function tallySegments(t: { passed: number; enrolled: number; planned: number }, color: AreaColor, gapAfter = false): Segment[] {
  return [
    { value: t.passed, color, opacity: 100, label: "bestanden" },
    { value: t.enrolled, color, opacity: 50, label: "läuft" },
    { value: t.planned, color, opacity: 22, label: "geplant", gapAfter },
  ];
}

/**
 * Track + target corridor (min–max, tinted) + segments (passed / enrolled / planned) + markers at min and max.
 */
export function RangeBar({
  min,
  max,
  scale,
  segments,
  color,
  height = 8,
  ticks = true,
  label = false,
  className,
}: {
  min: number | null;
  max: number | null;
  scale: number;
  segments: Segment[];
  color: AreaColor;
  height?: number;
  ticks?: boolean;
  label?: boolean;
  className?: string;
}) {
  const pct = (v: number) => `${Math.min(Math.max(v / Math.max(scale, 1), 0), 1) * 100}%`;
  const lo = min ?? 0;
  const hi = max ?? null;
  const total = segments.reduce((a, s) => a + s.value, 0);
  const desc = `${total} CP${hi != null ? `, Ziel ${lo === hi ? lo : `${lo}–${hi}`} CP` : lo ? `, mindestens ${lo} CP` : ""}`;
  return (
    <div className={cx("relative w-full", className)} style={{ paddingTop: 4, paddingBottom: label ? 20 : 4 }} role="img" aria-label={desc}>
      <div className="relative w-full overflow-hidden bg-subtle" style={{ height, borderRadius: height / 2 }}>
        {hi != null && hi > lo ? (
          <div className="absolute inset-y-0" style={{ left: pct(lo), width: pct(hi - lo), background: areaMix(color, 16) }} />
        ) : null}
        {withOffsets(segments).map(({ seg: s, left }, i) =>
          s.value ? (
            <div
              key={i}
              className="absolute inset-y-0"
              title={s.label ? `${s.value} CP ${s.label}` : undefined}
              style={{ left: pct(left), width: `calc(${pct(s.value)} - ${s.gapAfter ? 3 : 0}px)`, background: segColor(s) }}
            />
          ) : null,
        )}
      </div>
      {ticks && (lo > 0 || hi != null) ? (
        <>
          {lo > 0 ? <Tick at={pct(lo)} height={height} /> : null}
          {hi != null && hi !== lo ? <Tick at={pct(hi)} height={height} /> : null}
        </>
      ) : null}
      {label ? (
        <span
          className="absolute whitespace-nowrap text-xs font-medium text-fg-2"
          style={{ top: height + 10, left: pct(hi != null ? (lo + hi) / 2 : lo), transform: `translateX(${(hi ?? lo) / scale > 0.85 ? "-100%" : "-50%"})` }}
        >
          Ziel {hi == null ? `mind. ${lo}` : lo === hi ? lo : `${lo}–${hi}`}
        </span>
      ) : null}
    </div>
  );
}

function Tick({ at, height }: { at: string; height: number }) {
  return <span aria-hidden className="absolute top-0 w-0.5 -translate-x-1/2 rounded-full bg-fg/75" style={{ left: `clamp(1px, ${at}, calc(100% - 1px))`, height: height + 8 }} />;
}

export function StackedBar({ segments, scale, height = 16 }: { segments: Segment[]; scale: number; height?: number }) {
  const pct = (v: number) => `${(Math.min(Math.max(v, 0), scale) / Math.max(scale, 1)) * 100}%`;
  return (
    <div className="relative w-full overflow-hidden bg-subtle" style={{ height, borderRadius: height / 2 }}>
      {withOffsets(segments).map(({ seg: s, left }, i) =>
        s.value ? (
          <div
            key={i}
            className="absolute inset-y-0"
            title={s.label}
            style={{ left: pct(left), width: `calc(${pct(s.value)} - ${s.gapAfter ? 3 : 0}px)`, background: segColor(s) }}
          />
        ) : null,
      )}
    </div>
  );
}

/** One block per module, width proportional to its credits. */
export function Mosaic({ modules, color }: { modules: { id: string; title: string; credits: number; status: ModuleStatus }[]; color: AreaColor }) {
  return (
    <div className="flex flex-wrap gap-[3px]">
      {modules.map((m) => (
        <span
          key={m.id}
          title={`${m.title} · ${m.credits} CP · ${STATUS_META[m.status].short}`}
          className="h-3.5 rounded-[3px]"
          style={{
            width: Math.max(m.credits * 4 - 3, 6),
            background: m.status === "passed" ? areaColor(color) : m.status === "enrolled" ? areaMix(color, 50) : areaMix(color, 12),
            border: m.status === "planned" ? `1px dashed ${areaMix(color, 70)}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function LoadBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-line">
      <div className={cx("h-full rounded-full", value > max ? "bg-warning" : "bg-fg")} style={{ width: `${Math.min(value / max, 1) * 100}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-xl bg-subtle text-fg-2">
        <Icon name={icon} size={18} />
      </span>
      <p className="text-base font-semibold">{title}</p>
      {children ? <div className="max-w-md text-[13px] text-fg-2">{children}</div> : null}
    </div>
  );
}
