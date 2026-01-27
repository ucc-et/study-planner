import type {
  CreditConstraint,
  FilledValuesV1,
  PlannerEvent,
  PlannerTemplateV1,
  SectionTemplate,
} from "./types";

export function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID() as string;
  }
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function defaultConstraints(): CreditConstraint {
  return { minCredits: null, maxCredits: null };
}

export function clampCredits(n: unknown): number {
  const asNumber = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(asNumber)) return 0;
  return Math.max(0, Math.round(asNumber * 100) / 100);
}

export function parseMaybeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function formatConstraint(c: CreditConstraint): string {
  const min = c.minCredits;
  const max = c.maxCredits;
  if (min == null && max == null) return "No constraints";
  if (min != null && max != null) return `${min}–${max} credits`;
  if (min != null) return `≥ ${min} credits`;
  return `≤ ${max} credits`;
}

export function validateCredits(total: number, c: CreditConstraint): string | null {
  if (c.minCredits != null && total < c.minCredits) {
    return `Needs at least ${c.minCredits} credits (currently ${total}).`;
  }
  if (c.maxCredits != null && total > c.maxCredits) {
    return `Must be at most ${c.maxCredits} credits (currently ${total}).`;
  }
  return null;
}

export function sumCredits(events: PlannerEvent[]): number {
  return events.reduce(
    (acc, e) => acc + (Number.isFinite(e.credits) ? e.credits : 0),
    0,
  );
}

export function sumSectionCredits(
  section: SectionTemplate,
  eventsBySubsectionId: Record<string, PlannerEvent[]>,
): number {
  return section.subsections.reduce(
    (acc, sub) => acc + sumCredits(eventsBySubsectionId[sub.id] ?? []),
    0,
  );
}

export function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function normalizeTemplate(data: unknown): PlannerTemplateV1 {
  const asObj = (data ?? {}) as Record<string, unknown>;
  const rawSections = Array.isArray(asObj.sections)
    ? asObj.sections
    : Array.isArray(data)
      ? (data as unknown[])
      : [];

  const sections: SectionTemplate[] = rawSections
    .map((raw) => {
      const s = (raw ?? {}) as Record<string, unknown>;
      const rawSubsections = Array.isArray(s.subsections) ? s.subsections : [];
      const constraintsObj = (s.constraints ?? {}) as Record<string, unknown>;

      const section: SectionTemplate = {
        id: typeof s.id === "string" && s.id ? s.id : makeId(),
        title: typeof s.title === "string" ? s.title : "Untitled section",
        constraints: {
          minCredits:
            typeof constraintsObj.minCredits === "number" &&
            Number.isFinite(constraintsObj.minCredits)
              ? constraintsObj.minCredits
              : null,
          maxCredits:
            typeof constraintsObj.maxCredits === "number" &&
            Number.isFinite(constraintsObj.maxCredits)
              ? constraintsObj.maxCredits
              : null,
        },
        subsections: rawSubsections.map((rawSub) => {
          const sub = (rawSub ?? {}) as Record<string, unknown>;
          const subConstraintsObj = (sub.constraints ?? {}) as Record<
            string,
            unknown
          >;
          return {
            id: typeof sub.id === "string" && sub.id ? sub.id : makeId(),
            title:
              typeof sub.title === "string"
                ? sub.title
                : "Untitled subsection",
            constraints: {
              minCredits:
                typeof subConstraintsObj.minCredits === "number" &&
                Number.isFinite(subConstraintsObj.minCredits)
                  ? subConstraintsObj.minCredits
                  : null,
              maxCredits:
                typeof subConstraintsObj.maxCredits === "number" &&
                Number.isFinite(subConstraintsObj.maxCredits)
                  ? subConstraintsObj.maxCredits
                  : null,
            },
          };
        }),
      };
      return section;
    })
    .filter(Boolean);

  return { version: 1, sections };
}

export function normalizeFilledValues(
  data: unknown,
  template: PlannerTemplateV1,
): FilledValuesV1 {
  const asObj = (data ?? {}) as Record<string, unknown>;
  const rawMap = (asObj.eventsBySubsectionId ?? {}) as Record<string, unknown>;
  const allowedSubsectionIds = new Set(
    template.sections.flatMap((s) => s.subsections.map((sub) => sub.id)),
  );

  const eventsBySubsectionId: Record<string, PlannerEvent[]> = {};

  for (const [subsectionId, rawEvents] of Object.entries(rawMap)) {
    if (!allowedSubsectionIds.has(subsectionId)) continue;
    if (!Array.isArray(rawEvents)) continue;

    eventsBySubsectionId[subsectionId] = rawEvents.map((rawEvent) => {
      const ev = (rawEvent ?? {}) as Record<string, unknown>;
      return {
        id: typeof ev.id === "string" && ev.id ? ev.id : makeId(),
        title: typeof ev.title === "string" ? ev.title : "Untitled event",
        credits: clampCredits(ev.credits),
        pending: typeof ev.pending === "boolean" ? ev.pending : false,
      } satisfies PlannerEvent;
    });
  }

  return { version: 1, eventsBySubsectionId };
}

export function sampleTemplate(): PlannerTemplateV1 {
  return {
    version: 1,
    sections: [
      {
        id: makeId(),
        title: "Core",
        constraints: { minCredits: 12, maxCredits: 18 },
        subsections: [
          {
            id: makeId(),
            title: "Math",
            constraints: { minCredits: 6, maxCredits: 9 },
          },
        ],
      },
    ],
  };
}
