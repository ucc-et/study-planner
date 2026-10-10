"use client";

import * as React from "react";

import { isLegacyFile, parsePlanFile } from "../../lib/planner/storage";
import { blankPlan, planFromTemplate, samplePlan } from "../../lib/planner/templates";
import type { ModuleStatus, Plan, View } from "../../lib/planner/types";
import { downloadJson, slugify, today } from "../../lib/planner/utils";
import { AppHeader, ConfirmDialog, type ConfirmRequest, MobileNav, Toast, type ToastData, VIEWS } from "./AppChrome";
import { type DialogState, ModuleDialog } from "./ModuleDialog";
import { type AreaFilter, ModulesView } from "./ModulesView";
import { Onboarding } from "./Onboarding";
import { OverviewView } from "./OverviewView";
import { SemesterView } from "./SemesterView";
import { StructureView } from "./StructureView";
import { usePlanner, useTheme } from "./usePlanner";

function viewFromHash(): View {
  const hash = window.location.hash.replace("#", "");
  return VIEWS.find((v) => v.hash === hash)?.id ?? "overview";
}

export default function PlannerApp() {
  const { plan, loaded, ...actions } = usePlanner();
  const { theme, setTheme } = useTheme();
  const [view, setView] = React.useState<View>("overview");
  const [switching, setSwitching] = React.useState(false);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [filter, setFilter] = React.useState<AreaFilter>(null);
  const [toast, setToast] = React.useState<ToastData | null>(null);
  const [confirm, setConfirm] = React.useState<ConfirmRequest | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const sync = () => setView(viewFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = React.useCallback((v: View) => {
    const hash = VIEWS.find((x) => x.id === v)?.hash ?? "uebersicht";
    if (window.location.hash !== `#${hash}`) window.location.hash = hash;
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  const notify = React.useCallback((message: string, extra?: Partial<ToastData>) => setToast({ id: Date.now(), message, ...extra }), []);
  const closeToast = React.useCallback(() => setToast(null), []);

  const startPlan = (p: Plan, message: string) => {
    actions.setPlan(p);
    setSwitching(false);
    setFilter(null);
    navigate("overview");
    notify(message);
  };

  const exportPlan = () => {
    if (!plan) return;
    downloadJson(`ssp-${slugify(`${plan.program.degree} ${plan.program.name}`)}-${today()}.json`, plan);
    notify("Plan exportiert");
  };

  const exportTemplate = () => {
    if (!plan) return;
    downloadJson(`ssp-vorlage-${slugify(`${plan.program.degree} ${plan.program.name}`)}-${today()}.json`, { ...plan, modules: [] });
    notify("Vorlage exportiert – ohne Module");
  };

  const importFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as unknown;
      const next = parsePlanFile(data);
      const apply = () =>
        startPlan(
          next,
          isLegacyFile(data)
            ? `Alte Planer-Datei umgewandelt: ${next.areas.length} ${next.areas.length === 1 ? "Bereich" : "Bereiche"}, ${next.modules.length} ${next.modules.length === 1 ? "Modul" : "Module"}`
            : `Plan importiert: ${next.modules.length} ${next.modules.length === 1 ? "Modul" : "Module"}`,
        );
      if (plan && plan.modules.length) {
        setConfirm({
          title: "Aktuellen Plan ersetzen?",
          body: "Der importierte Plan ersetzt deinen aktuellen. Exportiere ihn vorher, wenn du ihn behalten möchtest.",
          confirmLabel: "Ersetzen",
          onConfirm: apply,
        });
      } else apply();
    } catch {
      notify("Datei konnte nicht gelesen werden – ist es eine SSP-Datei (.json)?", { tone: "error" });
    }
  };

  const deleteModule = (id: string) => {
    if (!plan) return;
    const index = plan.modules.findIndex((m) => m.id === id);
    const m = plan.modules[index];
    if (!m) return;
    actions.deleteModule(id);
    setDialog(null);
    notify(`„${m.title}“ gelöscht`, { action: { label: "Rückgängig", onClick: () => actions.restoreModule(m, index) } });
  };

  const setStatus = (id: string, status: ModuleStatus) => {
    actions.updateModule(id, status === "passed" ? { status } : { status, grade: null });
  };

  const openAdd = (defaults: { areaId?: string; subAreaId?: string | null; semester?: number | null } = {}) => setDialog({ mode: "add", defaults });

  const hiddenInput = (
    <input
      ref={fileInput}
      type="file"
      accept="application/json,.json"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) void importFile(file);
      }}
    />
  );

  if (!loaded) {
    return <div className="min-h-screen bg-canvas" aria-busy="true" />;
  }

  if (!plan || switching) {
    return (
      <>
        <Onboarding
          hasExistingPlan={!!plan && plan.modules.length > 0}
          theme={theme}
          onTheme={setTheme}
          onCancel={plan ? () => setSwitching(false) : undefined}
          onExportCurrent={plan ? exportPlan : undefined}
          onChooseTemplate={(t, start) => startPlan(planFromTemplate(t, start), `${t.degree} ${t.name} angelegt – füge jetzt deine Module hinzu`)}
          onBlank={(start) => {
            startPlan(blankPlan(start), "Leere Vorlage angelegt – lege jetzt deine Bereiche an");
            navigate("structure");
          }}
          onSample={() => startPlan(samplePlan(), "Beispielplan geladen")}
          onImport={() => fileInput.current?.click()}
        />
        {hiddenInput}
        <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
        <Toast toast={toast} onClose={closeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader
        plan={plan}
        view={view}
        theme={theme}
        onTheme={setTheme}
        onNavigate={navigate}
        onSwitchProgram={() => setSwitching(true)}
        onImport={() => fileInput.current?.click()}
        onExport={exportPlan}
        onAddModule={() => openAdd()}
      />
      {hiddenInput}

      <main className={view === "semester" ? "mx-auto max-w-[1440px] px-4 pb-28 pt-8 sm:px-6 md:pb-16" : "mx-auto max-w-[1248px] px-4 pb-28 pt-8 sm:px-6 md:pb-16"}>
        {view === "overview" ? (
          <OverviewView
            plan={plan}
            onOpenModules={(areaId) => {
              setFilter(areaId ? { areaId, subAreaId: null } : null);
              navigate("modules");
            }}
            onOpenSemester={() => navigate("semester")}
            onOpenStructure={() => navigate("structure")}
            onAddModule={openAdd}
            onEditModule={(id) => setDialog({ mode: "edit", moduleId: id })}
          />
        ) : null}
        {view === "semester" ? (
          <SemesterView
            plan={plan}
            onMove={actions.moveModule}
            onEditModule={(id) => setDialog({ mode: "edit", moduleId: id })}
            onAddModule={openAdd}
            onSetStudyMode={(studyMode) => actions.updatePlan({ studyMode })}
            onSetSemesterCount={(semesterCount) => actions.updatePlan({ semesterCount })}
          />
        ) : null}
        {view === "modules" ? (
          <ModulesView
            plan={plan}
            filter={filter}
            onFilter={setFilter}
            onEditModule={(id) => setDialog({ mode: "edit", moduleId: id })}
            onAddModule={openAdd}
            onDeleteModule={deleteModule}
            onSetStatus={setStatus}
          />
        ) : null}
        {view === "structure" ? <StructureView plan={plan} actions={actions} onConfirm={setConfirm} onExportTemplate={exportTemplate} /> : null}
      </main>

      <MobileNav view={view} onNavigate={navigate} onAddModule={() => openAdd()} />

      <ModuleDialog
        plan={plan}
        state={dialog}
        onClose={() => setDialog(null)}
        onDelete={deleteModule}
        onSave={(draft, id) => {
          if (id) {
            actions.updateModule(id, draft);
            notify("Modul gespeichert");
          } else {
            actions.addModule(draft);
            notify(`„${draft.title}“ hinzugefügt`);
          }
          setDialog(null);
        }}
      />
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
