export type CreditConstraint = {
  minCredits: number | null;
  maxCredits: number | null;
};

export type PlannerEvent = {
  id: string;
  title: string;
  credits: number;
  pending: boolean;
};

export type SubsectionTemplate = {
  id: string;
  title: string;
  constraints: CreditConstraint;
};

export type SectionTemplate = {
  id: string;
  title: string;
  constraints: CreditConstraint;
  subsections: SubsectionTemplate[];
};

export type PlannerTemplateV1 = {
  version: 1;
  sections: SectionTemplate[];
};

export type FilledValuesV1 = {
  version: 1;
  eventsBySubsectionId: Record<string, PlannerEvent[]>;
};

export type FilledPlanBundleV1 = {
  version: 1;
  template: PlannerTemplateV1;
  eventsBySubsectionId: Record<string, PlannerEvent[]>;
};

export type ViewMode = "template" | "fill";
