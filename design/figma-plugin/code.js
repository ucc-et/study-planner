// =====================================================================
// SSP Studienplaner – Redesign Generator (lokales Figma-Plugin)
// Baut Konzept-Seite, Komponenten und Screens in die geöffnete Datei.
// Mehrfaches Ausführen ist sicher: generierte Frames werden ersetzt,
// Variablen und Stile werden wiederverwendet.
// =====================================================================

const PAGES = {
  konzept: "01 · Konzept & Recherche",
  screens: "02 · Screens",
  comps: "03 · Komponenten",
};
const LOG = [];

// ---------------------------------------------------------------------
// Daten: B.Sc. Informatik (PO 2023, Satzungsbeilage 2023_II)
// Beispiel-Studi im 5. Fachsemester (WiSe 2026/27). Module/Noten sind
// illustrativ, die CP-Regeln stammen aus dem offiziellen Studienplan.
// ---------------------------------------------------------------------
const AREAS = [
  { id: "P", key: "Pflicht", name: "Pflichtbereich", color: "area/pflicht", tint: "area/pflicht-tint", min: 114, max: 114 },
  {
    id: "W", key: "Wahl", name: "Wahlbereich", color: "area/wahl", tint: "area/wahl-tint", min: 48, max: 49,
    subs: [
      { id: "WPB", name: "Wahlpflicht-Katalog", short: "Wahlpflicht-Katalog", min: 10, max: 35 },
      { id: "FP", name: "Fachprüfungen", short: "Fachprüfungen", min: 5, max: 30 },
      { id: "SBL", name: "Studienbegleitende Leistungen", short: "Studienbegleitend", min: 9, max: 18 },
    ],
  },
  { id: "G", key: "Generale", name: "Studium Generale", color: "area/generale", tint: "area/generale-tint", min: 5, max: 6 },
  { id: "T", key: "Thesis", name: "Bachelorarbeit", color: "area/thesis", tint: "area/thesis-tint", min: 12, max: 12 },
];
const A = Object.fromEntries(AREAS.map((a) => [a.id, a]));
const SUB = Object.fromEntries(AREAS.flatMap((a) => (a.subs || []).map((s) => [s.id, s])));
const TOTAL_CP = 180;
const SEM = {
  1: ["WiSe 24/25", "WiSe 2024/25"],
  2: ["SoSe 25", "SoSe 2025"],
  3: ["WiSe 25/26", "WiSe 2025/26"],
  4: ["SoSe 26", "SoSe 2026"],
  5: ["WiSe 26/27", "WiSe 2026/27"],
  6: ["SoSe 27", "SoSe 2027"],
};
const CURRENT_SEM = 5;
// [Titel, CP, Bereich, Teilbereich, Semester (null = Merkzettel), Status B/L/G, Note]
const RAW = [
  ["Erfolgreich ins Informatik-Studium starten", 1, "P", null, 1, "B", null],
  ["Funktionale und objektorientierte Programmierkonzepte", 10, "P", null, 1, "B", "1,7"],
  ["Mathematik I für Informatik", 9, "P", null, 1, "B", "2,3"],
  ["Digitaltechnik", 5, "P", null, 1, "B", "1,3"],
  ["Automaten, formale Sprachen und Entscheidbarkeit", 5, "P", null, 1, "B", "2,0"],
  ["Algorithmen und Datenstrukturen", 10, "P", null, 2, "B", "1,7"],
  ["Mathematik II für Informatik", 9, "P", null, 2, "B", "2,7"],
  ["Rechnerorganisation", 5, "P", null, 2, "B", "2,0"],
  ["Aussagen- und Prädikatenlogik", 5, "P", null, 2, "B", "1,3"],
  ["Software Engineering", 5, "P", null, 3, "B", "1,7"],
  ["Computersystemsicherheit", 5, "P", null, 3, "B", "2,3"],
  ["Informationsmanagement", 5, "P", null, 3, "B", "1,0"],
  ["Computernetze und verteilte Systeme", 5, "P", null, 3, "B", "2,0"],
  ["Probabilistische Methoden der Informatik", 5, "P", null, 3, "B", "2,7"],
  ["Spanisch A1 (Sprachenzentrum)", 3, "G", null, 3, "B", "1,3"],
  ["Einführung in die Künstliche Intelligenz", 5, "P", null, 4, "B", "1,3"],
  ["Modellierung, Spezifikation und Semantik", 5, "P", null, 4, "B", "2,3"],
  ["Parallele Programmierung", 5, "P", null, 4, "B", "1,7"],
  ["Grundlagen der Robotik", 5, "W", "WPB", 4, "B", "1,7"],
  ["Data Mining und Maschinelles Lernen", 5, "W", "WPB", 4, "B", "2,0"],
  ["Seminar: Usable Security", 3, "W", "SBL", 4, "B", "1,0"],
  ["Teamprojekt Softwareentwicklung", 9, "P", null, 5, "L", null],
  ["Informatik und Gesellschaft", 3, "P", null, 5, "L", null],
  ["Einführung in wissenschaftliches Arbeiten", 3, "P", null, 5, "L", null],
  ["Computer Vision", 6, "W", "WPB", 5, "L", null],
  ["Praktikum in der Lehre", 5, "W", "SBL", 5, "L", null],
  ["Spanisch A2 (Sprachenzentrum)", 3, "G", null, 5, "L", null],
  ["Bachelorarbeit", 12, "T", null, 6, "G", null],
  ["Deep Learning: Architectures & Methods", 6, "W", "FP", 6, "G", null],
  ["Projektpraktikum Robotik", 6, "W", "SBL", 6, "G", null],
  ["Natural Language Processing and the Web", 6, "W", "FP", null, "G", null],
  ["Formale Methoden im Softwareentwurf", 5, "W", "WPB", null, "G", null],
];
const MODS = RAW.map(([title, cp, area, sub, sem, status, grade]) => ({ title, cp, area, sub, sem, status, grade }));
const IN_PLAN = MODS.filter((m) => m.sem != null);
const PARKED = MODS.filter((m) => m.sem == null);
const STATUS_NAME = { B: "Bestanden", L: "Belegt", G: "Geplant" };

const sumCp = (ms) => ms.reduce((acc, m) => acc + m.cp, 0);
function stats(filter) {
  const ms = IN_PLAN.filter(filter);
  const by = (s) => sumCp(ms.filter((m) => m.status === s));
  return { passed: by("B"), enrolled: by("L"), planned: by("G"), total: sumCp(ms), count: ms.length, mods: ms };
}
const areaStats = (id) => stats((m) => m.area === id);
const subStats = (id) => stats((m) => m.sub === id);
const ALL = stats(() => true);
const rng = (x) => (x.min === x.max ? `${x.min}` : `${x.min}–${x.max}`);
function areaState(s, x) {
  if (s.total > x.max) return ["Danger", `${s.total - x.max} CP über Maximum`];
  if (s.passed >= x.min) return ["Success", "Erfüllt"];
  if (s.total >= x.min) return ["Neutral", "Vollständig geplant"];
  const lo = x.min - s.total;
  const hi = x.max - s.total;
  return ["Warning", lo === hi ? `Noch ${lo} CP einplanen` : `Noch ${lo}–${hi} CP einplanen`];
}
function breakdown(s) {
  const parts = [];
  if (s.passed) parts.push(`${s.passed} bestanden`);
  if (s.enrolled) parts.push(`${s.enrolled} laufen`);
  if (s.planned) parts.push(`${s.planned} geplant`);
  return parts.join(" · ") || "noch nichts eingeplant";
}
const graded = MODS.filter((m) => m.status === "B" && m.grade);
const GPA = graded.reduce((acc, m) => acc + m.cp * parseFloat(m.grade.replace(",", ".")), 0) / sumCp(graded);
const GPA_TEXT = GPA.toFixed(2).replace(".", ",");
const PCT = Math.round((ALL.passed / TOTAL_CP) * 100);
const MISSING = TOTAL_CP - ALL.total;

// ---------------------------------------------------------------------
// Design-Tokens
// ---------------------------------------------------------------------
const TOKENS = {
  "bg/canvas": ["#F4F5F7", ["FRAME_FILL", "SHAPE_FILL"]],
  "bg/surface": ["#FFFFFF", ["FRAME_FILL", "SHAPE_FILL"]],
  "bg/subtle": ["#F0F1F4", ["FRAME_FILL", "SHAPE_FILL"]],
  "bg/inverse": ["#16181D", ["FRAME_FILL", "SHAPE_FILL"]],
  "border/default": ["#E3E5E9", ["STROKE_COLOR", "SHAPE_FILL"]],
  "border/strong": ["#C9CCD3", ["STROKE_COLOR", "SHAPE_FILL"]],
  "text/primary": ["#16181D", ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  "text/secondary": ["#5A5F6B", ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  "text/tertiary": ["#8B909A", ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  "text/inverse": ["#FFFFFF", ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  "status/success": ["#1E9254", ["TEXT_FILL", "SHAPE_FILL", "FRAME_FILL", "STROKE_COLOR"]],
  "status/success-bg": ["#E5F5EC", ["FRAME_FILL", "SHAPE_FILL"]],
  "status/warning": ["#B8650A", ["TEXT_FILL", "SHAPE_FILL", "FRAME_FILL", "STROKE_COLOR"]],
  "status/warning-bg": ["#FDF1DF", ["FRAME_FILL", "SHAPE_FILL"]],
  "status/danger": ["#CC3535", ["TEXT_FILL", "SHAPE_FILL", "FRAME_FILL", "STROKE_COLOR"]],
  "status/danger-bg": ["#FCE9E9", ["FRAME_FILL", "SHAPE_FILL"]],
  "status/info": ["#3B78D8", ["TEXT_FILL", "SHAPE_FILL", "FRAME_FILL", "STROKE_COLOR"]],
  "status/info-bg": ["#E8F0FC", ["FRAME_FILL", "SHAPE_FILL"]],
  "area/pflicht": ["#3B78D8", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"]],
  "area/pflicht-tint": ["#E2ECFA", ["FRAME_FILL", "SHAPE_FILL"]],
  "area/wahl": ["#2A9A5A", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"]],
  "area/wahl-tint": ["#E0F3E8", ["FRAME_FILL", "SHAPE_FILL"]],
  "area/generale": ["#C2479A", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"]],
  "area/generale-tint": ["#F7E4F0", ["FRAME_FILL", "SHAPE_FILL"]],
  "area/thesis": ["#DF7630", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"]],
  "area/thesis-tint": ["#FBEADC", ["FRAME_FILL", "SHAPE_FILL"]],
  "area/extra-teal": ["#0F95A3", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"]],
  "area/extra-violet": ["#7657D6", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"]],
};
const TEXT_STYLES = [
  ["Display/XL", "Geist", 44, "SemiBold", 48, -2],
  ["Heading/H1", "Geist", 28, "SemiBold", 34, -1.5],
  ["Heading/H2", "Geist", 20, "SemiBold", 26, -1],
  ["Heading/H3", "Geist", 16, "SemiBold", 22, -0.5],
  ["Body/M", "Geist", 14, "Regular", 20, 0],
  ["Body/M Strong", "Geist", 14, "Medium", 20, 0],
  ["Body/S", "Geist", 13, "Regular", 18, 0],
  ["Label/S", "Geist", 12, "Medium", 16, 0],
  ["Label/XS Caps", "Geist", 11, "SemiBold", 14, 6],
  ["Numeric/L", "Geist", 32, "SemiBold", 36, -2],
  ["Numeric/M", "Geist", 18, "SemiBold", 22, -1],
  ["Code/S", "Geist Mono", 12, "Regular", 19, 0],
];

let V = {};
let TS = {};
let ES = {};
const C = {};

const hex = (h) => {
  h = h.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
};
function P(name, opacity = 1) {
  const v = V[name];
  if (!v) throw new Error("Unbekannte Farbe: " + name);
  // Figma übernimmt bei variablengebundenen Paints die Deckkraft der Variable –
  // transparente Varianten deshalb als Rohfarbe des Tokens anlegen.
  if (opacity < 1) return { type: "SOLID", color: hex(TOKENS[name][0]), opacity };
  return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", v);
}

async function setupFoundations() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  let col = cols.find((c) => c.name === "Farben");
  if (!col) {
    col = figma.variables.createVariableCollection("Farben");
    col.renameMode(col.modes[0].modeId, "Hell");
  }
  const modeId = col.modes[0].modeId;
  const existing = await figma.variables.getLocalVariablesAsync("COLOR");
  for (const [name, [h, scopes]] of Object.entries(TOKENS)) {
    let v = existing.find((x) => x.name === name && x.variableCollectionId === col.id);
    if (!v) v = figma.variables.createVariable(name, col, "COLOR");
    v.setValueForMode(modeId, hex(h));
    v.scopes = scopes;
    V[name] = v;
  }

  const textStyles = await figma.getLocalTextStylesAsync();
  for (const [name, family, size, weight, lh, ls] of TEXT_STYLES) {
    let t = textStyles.find((s) => s.name === name);
    if (!t) {
      t = figma.createTextStyle();
      t.name = name;
    }
    t.fontName = { family, style: weight };
    t.fontSize = size;
    t.lineHeight = { unit: "PIXELS", value: lh };
    t.letterSpacing = { unit: "PERCENT", value: ls };
    t.textCase = name.includes("Caps") ? "UPPER" : "ORIGINAL";
    TS[name] = t;
  }

  const effectStyles = await figma.getLocalEffectStylesAsync();
  const EFFECTS = {
    "Elevation/Card": [
      { type: "DROP_SHADOW", color: { r: 0.06, g: 0.07, b: 0.1, a: 0.04 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: "NORMAL" },
      { type: "DROP_SHADOW", color: { r: 0.06, g: 0.07, b: 0.1, a: 0.05 }, offset: { x: 0, y: 4 }, radius: 12, spread: -2, visible: true, blendMode: "NORMAL" },
    ],
    "Elevation/Overlay": [
      { type: "DROP_SHADOW", color: { r: 0.06, g: 0.07, b: 0.1, a: 0.16 }, offset: { x: 0, y: 20 }, radius: 48, spread: -8, visible: true, blendMode: "NORMAL" },
      { type: "DROP_SHADOW", color: { r: 0.06, g: 0.07, b: 0.1, a: 0.06 }, offset: { x: 0, y: 2 }, radius: 6, spread: 0, visible: true, blendMode: "NORMAL" },
    ],
  };
  for (const [name, effects] of Object.entries(EFFECTS)) {
    let e = effectStyles.find((s) => s.name === name);
    if (!e) {
      e = figma.createEffectStyle();
      e.name = name;
    }
    e.effects = effects;
    ES[name] = e;
  }
}

// ---------------------------------------------------------------------
// Layout-Helfer (nur Standard-Plugin-API)
// ---------------------------------------------------------------------
function size(f, w, h) {
  f.resize(w != null ? w : Math.max(f.width, 1), h != null ? h : Math.max(f.height, 1));
  const horiz = f.layoutMode === "HORIZONTAL";
  f[horiz ? "primaryAxisSizingMode" : "counterAxisSizingMode"] = w != null ? "FIXED" : "AUTO";
  f[horiz ? "counterAxisSizingMode" : "primaryAxisSizingMode"] = h != null ? "FIXED" : "AUTO";
}
function asAL(f, dir, o = {}) {
  f.layoutMode = dir;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  f.clipsContent = !!o.clip;
  f.name = o.name || (dir === "HORIZONTAL" ? "Zeile" : "Spalte");
  f.itemSpacing = o.gap != null ? o.gap : 0;
  const p = o.p != null ? o.p : 0;
  const py = o.py != null ? o.py : p;
  const px = o.px != null ? o.px : p;
  f.paddingTop = o.pt != null ? o.pt : py;
  f.paddingBottom = o.pb != null ? o.pb : py;
  f.paddingLeft = o.pl != null ? o.pl : px;
  f.paddingRight = o.pr != null ? o.pr : px;
  if (o.align) f.counterAxisAlignItems = o.align;
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  if (o.fill) f.fills = [P(o.fill, o.fillOpacity != null ? o.fillOpacity : 1)];
  if (o.stroke) {
    f.strokes = [P(o.stroke, o.strokeOpacity != null ? o.strokeOpacity : 1)];
    f.strokeWeight = o.strokeWeight || 1;
    f.strokeAlign = "INSIDE";
  }
  if (o.dash) f.dashPattern = o.dash;
  if (o.radius != null) f.cornerRadius = o.radius;
  if (o.w != null || o.h != null) size(f, o.w, o.h);
  if (o.wrap) {
    f.layoutWrap = "WRAP";
    f.counterAxisSpacing = o.wrapGap != null ? o.wrapGap : f.itemSpacing;
  }
  return f;
}
const AL = (dir, o) => asAL(figma.createFrame(), dir, o);
function add(parent, child, o = {}) {
  if (child.type === "TEXT" && o.fillW) child.textAutoResize = "HEIGHT";
  parent.appendChild(child);
  if (o.fillW) child.layoutSizingHorizontal = "FILL";
  if (o.fillH) child.layoutSizingVertical = "FILL";
  return child;
}
function spacer(parent) {
  const s = figma.createFrame();
  s.name = "Abstand";
  s.fills = [];
  s.resize(1, 1);
  parent.appendChild(s);
  if (parent.layoutMode === "HORIZONTAL") s.layoutSizingHorizontal = "FILL";
  else s.layoutSizingVertical = "FILL";
  return s;
}
function hline(parent) {
  const r = figma.createRectangle();
  r.name = "Trennlinie";
  r.resize(10, 1);
  r.fills = [P("border/default")];
  parent.appendChild(r);
  r.layoutSizingHorizontal = "FILL";
  return r;
}
function vline(h) {
  const r = figma.createRectangle();
  r.name = "Trennlinie";
  r.resize(1, h);
  r.fills = [P("border/default")];
  return r;
}
function bottomBorder(f, color = "border/default") {
  f.strokes = [P(color)];
  f.strokeAlign = "INSIDE";
  f.strokeTopWeight = 0;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 1;
}
function topBorder(f, color = "border/default") {
  f.strokes = [P(color)];
  f.strokeAlign = "INSIDE";
  f.strokeTopWeight = 1;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 0;
}
function swatch(color, s = 10, radius = 3, opacity = 1) {
  const r = figma.createRectangle();
  r.name = "Farbe";
  r.resize(s, s);
  r.cornerRadius = radius;
  r.fills = [P(color, opacity)];
  return r;
}
async function T(chars, style = "Body/M", color = "text/primary", o = {}) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = String(chars);
  t.fills = [P(color, o.opacity != null ? o.opacity : 1)];
  t.name = o.name || String(chars).slice(0, 48);
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.w) {
    t.textAutoResize = "HEIGHT";
    t.resize(o.w, Math.max(t.height, 1));
  }
  return t;
}
async function capsLabel(parent, text) {
  const r = AL("HORIZONTAL", { name: text, px: 8, pt: 6, pb: 4 });
  add(parent, r, { fillW: true });
  r.appendChild(await T(text, "Label/XS Caps", "text/tertiary"));
  return r;
}
async function card(dir = "VERTICAL", o = {}) {
  const c = AL(dir, Object.assign({ fill: "bg/surface", stroke: "border/default", radius: 16 }, o));
  await c.setEffectStyleIdAsync(ES["Elevation/Card"].id);
  return c;
}
async function logo(sz = 28) {
  const f = AL("HORIZONTAL", { name: "Logo", radius: Math.round(sz * 0.26), fill: "bg/inverse", justify: "CENTER", align: "CENTER", w: sz, h: sz });
  const t = await T("S", sz > 24 ? "Heading/H3" : "Label/S", "text/inverse");
  f.appendChild(t);
  return f;
}

// Instanz-Helfer -------------------------------------------------------
function recolor(node, color) {
  const vectors = node.findAll((n) => n.type === "VECTOR");
  for (const v of vectors) if (v.strokes.length) v.strokes = [P(color)];
}
function I(name, color = "text/primary", sz = 16) {
  const comp = C.icons[name];
  if (!comp) throw new Error("Unbekanntes Icon: " + name);
  const inst = comp.createInstance();
  inst.name = "Icon/" + name;
  if (sz !== 16) inst.resize(sz, sz);
  recolor(inst, color);
  return inst;
}
function statusIcon(status) {
  const i = C.status[status].createInstance();
  i.name = "Status";
  return i;
}
function badge(tone, label) {
  const i = C.badge[tone].createInstance();
  i.setProperties({ [C.badgeKey]: label });
  return i;
}
function tag(areaKey, label) {
  const i = C.tag[areaKey].createInstance();
  i.setProperties({ [C.tagKey]: label });
  return i;
}
const BTN_FG = { Primary: "text/inverse", Secondary: "text/primary", Ghost: "text/secondary" };
function button(type, label, icon) {
  const i = C.btn[type].createInstance();
  const props = { [C.btnKeys.label]: label };
  if (icon) props[C.btnKeys.swap] = C.icons[icon].id;
  else props[C.btnKeys.icon] = false;
  i.setProperties(props);
  if (icon) recolor(i, BTN_FG[type]);
  return i;
}
function tab(active, label, icon) {
  const i = C.tab[active ? "Aktiv" : "Standard"].createInstance();
  i.setProperties({ [C.tabKeys.label]: label, [C.tabKeys.swap]: C.icons[icon].id });
  recolor(i, active ? "text/primary" : "text/secondary");
  return i;
}
function moduleMeta(m) {
  if (m.status === "B") return m.grade ? `Note ${m.grade}` : "bestanden";
  if (m.status === "L") return "läuft";
  return m.sub ? SUB[m.sub].short : "geplant";
}
function mcard(m) {
  const comp = C.card[`${A[m.area].key}|${STATUS_NAME[m.status]}`];
  const i = comp.createInstance();
  i.name = m.title;
  i.setProperties({ [C.cardKeys.title]: m.title, [C.cardKeys.meta]: moduleMeta(m), [C.cardKeys.cp]: `${m.cp} CP` });
  return i;
}
function mrow(m) {
  const i = C.row.createInstance();
  i.name = m.title;
  i.setProperties({
    [C.rowKeys.title]: m.title,
    [C.rowKeys.sub]: m.sub ? SUB[m.sub].name : "—",
    [C.rowKeys.sem]: m.sem ? `${m.sem}. · ${SEM[m.sem][0]}` : "Merkzettel",
    [C.rowKeys.cp]: String(m.cp),
    [C.rowKeys.grade]: m.grade || "—",
  });
  const s = i.findOne((n) => n.type === "INSTANCE" && n.name === "Status");
  if (s) s.swapComponent(C.status[STATUS_NAME[m.status]]);
  return i;
}

// CP-Balken: Spur, Zielkorridor (min–max), Segmente, Markierungen
function segsOf(s, gapLast = 0) {
  return [
    { v: s.passed, o: 1, name: "bestanden" },
    { v: s.enrolled, o: 0.5, name: "läuft" },
    { v: s.planned, o: 0.22, name: "geplant", gap: gapLast },
  ];
}
async function rangeBar(o) {
  const w = o.w;
  const h = o.h || 8;
  const top = 4;
  const f = figma.createFrame();
  f.name = o.name || "CP-Balken";
  f.fills = [];
  f.clipsContent = false;
  f.resize(w, h + top * 2 + (o.label ? 16 : 0));
  const clip = figma.createFrame();
  clip.name = "Spur";
  clip.resize(w, h);
  clip.x = 0;
  clip.y = top;
  clip.cornerRadius = h / 2;
  clip.clipsContent = true;
  clip.fills = [P(o.track || "bg/subtle")];
  f.appendChild(clip);
  const X = (v) => Math.round((w * Math.min(v, o.scale)) / o.scale);
  if (o.max > o.min && o.band !== false) {
    const band = figma.createRectangle();
    band.name = "Zielkorridor";
    band.x = X(o.min);
    band.y = 0;
    band.resize(Math.max(X(o.max) - X(o.min), 2), h);
    band.fills = [P(o.color, 0.16)];
    clip.appendChild(band);
  }
  let acc = 0;
  for (const s of o.segs) {
    if (!s.v) continue;
    const r = figma.createRectangle();
    r.name = s.name || "Segment";
    const x0 = X(acc);
    const x1 = X(acc + s.v);
    r.x = x0;
    r.y = 0;
    r.resize(Math.max(x1 - x0 - (s.gap || 0), 1), h);
    r.fills = [P(s.color || o.color, s.o != null ? s.o : 1)];
    clip.appendChild(r);
    acc += s.v;
  }
  if (o.ticks !== false) {
    const tick = (v) => {
      const t = figma.createRectangle();
      t.name = "Markierung";
      t.resize(2, h + top * 2);
      t.x = Math.min(Math.max(X(v) - 1, 0), w - 2);
      t.y = 0;
      t.cornerRadius = 1;
      t.fills = [P("text/primary", 0.75)];
      f.appendChild(t);
    };
    tick(o.min);
    if (o.max !== o.min) tick(o.max);
  }
  if (o.label) {
    const lt = await T(o.max === o.min ? `Ziel ${o.min}` : `Ziel ${o.min}–${o.max}`, "Label/S", "text/secondary");
    f.appendChild(lt);
    const mid = (X(o.min) + X(o.max)) / 2;
    lt.x = Math.round(Math.min(Math.max(mid - lt.width / 2, 0), w - lt.width));
    lt.y = h + top * 2 + 2;
  }
  return f;
}
// Gestapelter Balken über alle Bereiche
async function stackedBar(w, h, areaStatsList, total = TOTAL_CP) {
  const segs = [];
  for (const [a, s] of areaStatsList) {
    const parts = segsOf(s, 3).map((p) => Object.assign({}, p, { color: a.color, name: `${a.name} · ${p.name}` }));
    // Lücke nur hinter dem letzten belegten Segment eines Bereichs
    const lastIdx = parts.map((p) => !!p.v).lastIndexOf(true);
    parts.forEach((p, i) => (p.gap = i === lastIdx ? 3 : 0));
    segs.push(...parts);
  }
  return rangeBar({ w, h, scale: total, min: total, max: total, color: "text/primary", segs, ticks: false, band: false, name: "Gesamtbalken" });
}
// Modul-Mosaik: ein Block pro Modul, Breite ∝ CP
function mosaic(mods, color, w) {
  const f = AL("HORIZONTAL", { name: "Modul-Mosaik", gap: 3, wrap: true, wrapGap: 3, w });
  for (const m of mods) {
    const r = figma.createRectangle();
    r.name = `${m.title} (${m.cp} CP)`;
    r.resize(Math.max(m.cp * 4 - 3, 6), 14);
    r.cornerRadius = 3;
    if (m.status === "B") r.fills = [P(color)];
    else if (m.status === "L") r.fills = [P(color, 0.5)];
    else {
      r.fills = [P(color, 0.12)];
      r.strokes = [P(color, 0.7)];
      r.strokeWeight = 1;
      r.strokeAlign = "INSIDE";
      r.dashPattern = [2, 2];
    }
    f.appendChild(r);
  }
  return f;
}
async function loadBar(cp, max, w, track = "border/default") {
  const f = figma.createFrame();
  f.name = "Semester-Last";
  f.resize(w, 4);
  f.cornerRadius = 2;
  f.clipsContent = true;
  f.fills = [P(track)];
  const r = figma.createRectangle();
  r.resize(Math.max(Math.round((w * Math.min(cp, max)) / max), 1), 4);
  r.fills = [P(cp > max ? "status/warning" : "text/primary")];
  f.appendChild(r);
  return f;
}

// ---------------------------------------------------------------------
// Komponenten
// ---------------------------------------------------------------------
const ICONS = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  cap: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  sliders: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "grip-horizontal": '<circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/><circle cx="5" cy="15" r="1"/>',
};
const STATUS_SVG = {
  Bestanden: '<circle cx="8" cy="8" r="8" fill="#1E9254"/><path d="M4.8 8.3l2.1 2.1 4.3-4.7" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  Belegt: '<circle cx="8" cy="8" r="7" stroke="#16181D" stroke-width="1.6" fill="none"/><path d="M8 4a4 4 0 0 1 0 8z" fill="#16181D"/>',
  Geplant: '<circle cx="8" cy="8" r="7" stroke="#8B909A" stroke-width="1.6" stroke-dasharray="2.4 2.2" fill="none"/>',
  "Nicht bestanden": '<circle cx="8" cy="8" r="8" fill="#CC3535"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>',
};
const HEXMAP = { "16181D": "text/primary", "1E9254": "status/success", "8B909A": "text/tertiary", "CC3535": "status/danger", FFFFFF: "text/inverse" };
const toHex = (c) => [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
function bindByHex(root) {
  for (const n of root.findAll(() => true)) {
    for (const prop of ["fills", "strokes"]) {
      if (!(prop in n)) continue;
      const paints = n[prop];
      if (!Array.isArray(paints) || !paints.length) continue;
      n[prop] = paints.map((p) => {
        if (p.type !== "SOLID") return p;
        const name = HEXMAP[toHex(p.color)];
        return name ? P(name) : p;
      });
    }
  }
}
function gridLayout(set, cols, gapX = 16, gapY = 16, pad = 20) {
  let x = pad;
  let y = pad;
  let rowH = 0;
  let maxW = 0;
  set.children.forEach((k, i) => {
    if (i > 0 && i % cols === 0) {
      x = pad;
      y += rowH + gapY;
      rowH = 0;
    }
    k.x = x;
    k.y = y;
    x += k.width + gapX;
    rowH = Math.max(rowH, k.height);
    maxW = Math.max(maxW, x);
  });
  set.resizeWithoutConstraints(maxW - gapX + pad, y + rowH + pad);
  set.fills = [P("bg/surface")];
  set.cornerRadius = 12;
  set.strokes = [P("border/strong")];
  set.dashPattern = [6, 4];
  set.strokeWeight = 1;
}
function bindText(set, key, layerName) {
  for (const v of set.children) {
    const t = v.findOne((n) => n.type === "TEXT" && n.name === layerName);
    if (t) t.componentPropertyReferences = { characters: key };
  }
}

async function buildComponents(page) {
  const root = AL("VERTICAL", { name: "SSP · Komponenten", gap: 48, p: 64, fill: "bg/canvas" });
  page.appendChild(root);
  root.x = 0;
  root.y = 0;
  const section = async (title, desc) => {
    const s = AL("VERTICAL", { name: title, gap: 12 });
    s.appendChild(await T(title, "Heading/H2"));
    if (desc) s.appendChild(await T(desc, "Body/S", "text/secondary"));
    root.appendChild(s);
    return s;
  };

  // Icons
  const iconSec = await section("Icons", "Lucide-Stil · 16 px · Strichfarbe an text/primary gebunden, in Instanzen überschreibbar");
  const iconRow = AL("HORIZONTAL", { name: "Icons", gap: 16, px: 20, py: 16, radius: 12, fill: "bg/surface", wrap: true, w: 760 });
  iconSec.appendChild(iconRow);
  C.icons = {};
  for (const [name, inner] of Object.entries(ICONS)) {
    const node = figma.createNodeFromSvg(
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16181D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
    );
    const comp = figma.createComponentFromNode(node);
    comp.name = `Icon/${name}`;
    comp.fills = [];
    for (const c of comp.findAll(() => true)) if ("constraints" in c) c.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    bindByHex(comp);
    iconRow.appendChild(comp);
    C.icons[name] = comp;
  }

  // StatusIcon
  const statusSec = await section("StatusIcon", "Jedes Modul hat genau einen Status. Ersetzt das alte „pending“-Häkchen.");
  const statusComps = [];
  for (const [name, inner] of Object.entries(STATUS_SVG)) {
    const node = figma.createNodeFromSvg(`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`);
    const comp = figma.createComponentFromNode(node);
    comp.name = `Status=${name}`;
    comp.fills = [];
    bindByHex(comp);
    statusComps.push(comp);
  }
  const statusSet = figma.combineAsVariants(statusComps, statusSec);
  statusSet.name = "StatusIcon";
  gridLayout(statusSet, 4);
  C.status = Object.fromEntries(statusSet.children.map((c) => [c.name.replace("Status=", ""), c]));

  // Badge
  const TONES = {
    Success: ["status/success", "status/success-bg"],
    Warning: ["status/warning", "status/warning-bg"],
    Danger: ["status/danger", "status/danger-bg"],
    Neutral: ["text/secondary", "bg/subtle"],
    Info: ["status/info", "status/info-bg"],
  };
  const badgeSec = await section("Badge", "Zustand eines Bereichs oder einer Regel: Erfüllt · Vollständig geplant · Lücke · Über Maximum");
  const badgeComps = [];
  for (const [tone, [fg, bg]] of Object.entries(TONES)) {
    const c = asAL(figma.createComponent(), "HORIZONTAL", { name: `Ton=${tone}`, gap: 6, pl: 8, pr: 10, py: 3, radius: 999, align: "CENTER", fill: bg });
    const dot = figma.createEllipse();
    dot.name = "Punkt";
    dot.resize(6, 6);
    dot.fills = [P(fg)];
    c.appendChild(dot);
    c.appendChild(await T("Erfüllt", "Label/S", fg, { name: "Label" }));
    badgeComps.push(c);
  }
  const badgeSet = figma.combineAsVariants(badgeComps, badgeSec);
  badgeSet.name = "Badge";
  C.badgeKey = badgeSet.addComponentProperty("Label", "TEXT", "Erfüllt");
  bindText(badgeSet, C.badgeKey, "Label");
  gridLayout(badgeSet, 5);
  C.badge = Object.fromEntries(badgeSet.children.map((c) => [c.name.replace("Ton=", ""), c]));

  // BereichTag
  const tagSec = await section("BereichTag", "Farbe = Bereich. Angelehnt an die Farben der offiziellen TU-Studienpläne: blau Pflicht · grün Wahl · pink Studium Generale · orange Abschlussarbeit");
  const tagComps = [];
  for (const a of AREAS) {
    const c = asAL(figma.createComponent(), "HORIZONTAL", { name: `Bereich=${a.key}`, gap: 6, pl: 8, pr: 10, py: 3, radius: 6, align: "CENTER", fill: a.tint });
    c.appendChild(swatch(a.color, 8, 2));
    c.appendChild(await T(a.name, "Label/S", "text/primary", { name: "Label" }));
    tagComps.push(c);
  }
  const tagSet = figma.combineAsVariants(tagComps, tagSec);
  tagSet.name = "BereichTag";
  C.tagKey = tagSet.addComponentProperty("Label", "TEXT", "Pflichtbereich");
  bindText(tagSet, C.tagKey, "Label");
  gridLayout(tagSet, 4);
  C.tag = Object.fromEntries(tagSet.children.map((c) => [c.name.replace("Bereich=", ""), c]));

  // Button
  const btnSec = await section("Button", "Primary = eine Hauptaktion pro Screen (meist „Modul hinzufügen“)");
  const BTN = { Primary: ["bg/inverse", null], Secondary: ["bg/surface", "border/default"], Ghost: [null, null] };
  const btnComps = [];
  for (const [type, [bg, border]] of Object.entries(BTN)) {
    const c = asAL(figma.createComponent(), "HORIZONTAL", { name: `Typ=${type}`, gap: 6, pl: 12, pr: 14, radius: 8, align: "CENTER", justify: "CENTER", h: 36 });
    if (bg) c.fills = [P(bg)];
    if (border) {
      c.strokes = [P(border)];
      c.strokeWeight = 1;
      c.strokeAlign = "INSIDE";
    }
    const ic = C.icons.plus.createInstance();
    ic.name = "Icon";
    recolor(ic, BTN_FG[type]);
    c.appendChild(ic);
    c.appendChild(await T("Modul hinzufügen", "Body/M Strong", BTN_FG[type], { name: "Label" }));
    btnComps.push(c);
  }
  const btnSet = figma.combineAsVariants(btnComps, btnSec);
  btnSet.name = "Button";
  C.btnKeys = {
    label: btnSet.addComponentProperty("Label", "TEXT", "Modul hinzufügen"),
    icon: btnSet.addComponentProperty("Icon", "BOOLEAN", true),
    swap: btnSet.addComponentProperty("Icon-Typ", "INSTANCE_SWAP", C.icons.plus.id),
  };
  bindText(btnSet, C.btnKeys.label, "Label");
  for (const v of btnSet.children) {
    const ic = v.findOne((n) => n.type === "INSTANCE" && n.name === "Icon");
    ic.componentPropertyReferences = { visible: C.btnKeys.icon, mainComponent: C.btnKeys.swap };
  }
  gridLayout(btnSet, 3);
  C.btn = Object.fromEntries(btnSet.children.map((c) => [c.name.replace("Typ=", ""), c]));

  // Tab
  const tabSec = await section("Tab", "Hauptnavigation: Übersicht · Semesterplan · Module");
  const tabComps = [];
  for (const state of ["Aktiv", "Standard"]) {
    const fg = state === "Aktiv" ? "text/primary" : "text/secondary";
    const c = asAL(figma.createComponent(), "HORIZONTAL", { name: `Zustand=${state}`, gap: 6, px: 12, radius: 7, align: "CENTER", h: 32 });
    if (state === "Aktiv") {
      c.fills = [P("bg/surface")];
      await c.setEffectStyleIdAsync(ES["Elevation/Card"].id);
    }
    const ic = C.icons.dashboard.createInstance();
    ic.name = "Icon";
    recolor(ic, fg);
    c.appendChild(ic);
    c.appendChild(await T("Übersicht", "Body/M Strong", fg, { name: "Label" }));
    tabComps.push(c);
  }
  const tabSet = figma.combineAsVariants(tabComps, tabSec);
  tabSet.name = "Tab";
  C.tabKeys = {
    label: tabSet.addComponentProperty("Label", "TEXT", "Übersicht"),
    swap: tabSet.addComponentProperty("Icon-Typ", "INSTANCE_SWAP", C.icons.dashboard.id),
  };
  bindText(tabSet, C.tabKeys.label, "Label");
  for (const v of tabSet.children) v.findOne((n) => n.type === "INSTANCE" && n.name === "Icon").componentPropertyReferences = { mainComponent: C.tabKeys.swap };
  gridLayout(tabSet, 2);
  C.tab = Object.fromEntries(tabSet.children.map((c) => [c.name.replace("Zustand=", ""), c]));

  // ModuleCard
  const cardSec = await section("ModuleCard", "Eine Karte = ein Modul. Farbstreifen = Bereich · Füllung = Status: weiß bestanden · getönt läuft · gestrichelt geplant");
  const META = { Bestanden: "Note 1,7", Belegt: "läuft", Geplant: "geplant" };
  const cards = [];
  for (const status of ["Bestanden", "Belegt", "Geplant"]) {
    for (const a of AREAS) {
      const c = figma.createComponent();
      c.name = `Bereich=${a.key}, Status=${status}`;
      c.layoutMode = "HORIZONTAL";
      c.resize(208, 60);
      c.primaryAxisSizingMode = "FIXED";
      c.counterAxisSizingMode = "AUTO";
      c.cornerRadius = 10;
      c.clipsContent = true;
      c.itemSpacing = 0;
      if (status === "Bestanden") {
        c.fills = [P("bg/surface")];
        c.strokes = [P("border/default")];
      }
      if (status === "Belegt") {
        c.fills = [P(a.tint)];
        c.strokes = [P(a.color, 0.3)];
      }
      if (status === "Geplant") {
        c.fills = [P("bg/surface", 0.6)];
        c.strokes = [P("border/strong")];
        c.dashPattern = [4, 3];
      }
      c.strokeWeight = 1;
      c.strokeAlign = "INSIDE";
      const stripe = figma.createRectangle();
      stripe.name = "Bereichsfarbe";
      stripe.resize(4, 40);
      stripe.fills = [P(a.color, status === "Geplant" ? 0.4 : 1)];
      c.appendChild(stripe);
      stripe.layoutSizingVertical = "FILL";
      const body = AL("VERTICAL", { name: "Inhalt", gap: 8, pl: 10, pr: 12, py: 10 });
      add(c, body, { fillW: true });
      const title = await T("Algorithmen und Datenstrukturen", "Body/M Strong", status === "Geplant" ? "text/secondary" : "text/primary", { name: "Titel" });
      add(body, title, { fillW: true });
      const meta = AL("HORIZONTAL", { name: "Meta", gap: 6, align: "CENTER" });
      add(body, meta, { fillW: true });
      meta.appendChild(statusIcon(status));
      meta.appendChild(await T(META[status], "Label/S", "text/secondary", { name: "Meta" }));
      spacer(meta);
      const pill = AL("HORIZONTAL", { name: "CP", px: 6, py: 2, radius: 5, fill: status === "Belegt" ? "bg/surface" : "bg/subtle", fillOpacity: status === "Belegt" ? 0.75 : 1 });
      meta.appendChild(pill);
      pill.appendChild(await T("10 CP", "Label/S", "text/primary", { name: "CP-Text" }));
      cards.push(c);
    }
  }
  const cardSet = figma.combineAsVariants(cards, cardSec);
  cardSet.name = "ModuleCard";
  C.cardKeys = {
    title: cardSet.addComponentProperty("Titel", "TEXT", "Algorithmen und Datenstrukturen"),
    meta: cardSet.addComponentProperty("Meta", "TEXT", "Note 1,7"),
    cp: cardSet.addComponentProperty("CP", "TEXT", "10 CP"),
  };
  bindText(cardSet, C.cardKeys.title, "Titel");
  bindText(cardSet, C.cardKeys.meta, "Meta");
  bindText(cardSet, C.cardKeys.cp, "CP-Text");
  gridLayout(cardSet, 4);
  cardSet.fills = [P("bg/subtle")];
  cardSet.description = "Modulkarte für den Semesterplan. Bereich = Farbe, Status = Füllung.";
  C.card = {};
  for (const c of cardSet.children) {
    const m = c.name.match(/Bereich=(\w+), Status=(\w+)/);
    C.card[`${m[1]}|${m[2]}`] = c;
  }

  // ModuleRow
  const rowSec = await section("ModuleRow", "Zeile der Modulliste – alle Felder eines Moduls auf einer Ebene. Status über die verschachtelte StatusIcon-Instanz.");
  const row = asAL(figma.createComponent(), "HORIZONTAL", { name: "ModuleRow", gap: 16, pl: 16, pr: 12, py: 11, align: "CENTER", fill: "bg/surface", w: 880 });
  bottomBorder(row);
  row.appendChild(statusIcon("Bestanden"));
  const rt = await T("Algorithmen und Datenstrukturen", "Body/M Strong", "text/primary", { name: "Titel" });
  add(row, rt, { fillW: true });
  const rsub = await T("Wahlpflicht-Katalog", "Body/S", "text/secondary", { name: "Teilbereich", w: 190 });
  row.appendChild(rsub);
  const rsem = await T("2. · SoSe 25", "Body/S", "text/secondary", { name: "Semester", w: 96 });
  row.appendChild(rsem);
  const rcp = await T("10", "Body/M Strong", "text/primary", { name: "CP", w: 36, align: "RIGHT" });
  row.appendChild(rcp);
  const rgr = await T("1,7", "Body/M", "text/primary", { name: "Note", w: 40, align: "RIGHT" });
  row.appendChild(rgr);
  const more = C.icons.more.createInstance();
  more.name = "Mehr";
  recolor(more, "text/tertiary");
  row.appendChild(more);
  C.rowKeys = {
    title: row.addComponentProperty("Titel", "TEXT", "Algorithmen und Datenstrukturen"),
    sub: row.addComponentProperty("Teilbereich", "TEXT", "Wahlpflicht-Katalog"),
    sem: row.addComponentProperty("Semester", "TEXT", "2. · SoSe 25"),
    cp: row.addComponentProperty("CP", "TEXT", "10"),
    grade: row.addComponentProperty("Note", "TEXT", "1,7"),
  };
  rt.componentPropertyReferences = { characters: C.rowKeys.title };
  rsub.componentPropertyReferences = { characters: C.rowKeys.sub };
  rsem.componentPropertyReferences = { characters: C.rowKeys.sem };
  rcp.componentPropertyReferences = { characters: C.rowKeys.cp };
  rgr.componentPropertyReferences = { characters: C.rowKeys.grade };
  row.description = "Eine Modulzeile. Status über die verschachtelte StatusIcon-Instanz umschalten.";
  rowSec.appendChild(row);
  C.row = row;

  // Muster: CP-Balken (zur Dokumentation)
  const barSec = await section("CP-Balken (Muster)", "Spur · Zielkorridor min–max (getönt) · Markierungen bei min und max · Segmente: bestanden (voll), läuft (50 %), geplant (22 %)");
  const barBox = AL("VERTICAL", { name: "Beispiele", gap: 20, p: 20, radius: 12, fill: "bg/surface", w: 560 });
  barSec.appendChild(barBox);
  const w = areaStats("W");
  barBox.appendChild(await T("Wahlbereich · Ziel 48–49 CP · 36 eingeplant", "Label/S", "text/secondary"));
  barBox.appendChild(await rangeBar({ w: 520, h: 10, scale: Math.ceil(49 * 1.15), min: 48, max: 49, color: "area/wahl", segs: segsOf(w), label: true }));
  const p = areaStats("P");
  barBox.appendChild(await T("Pflichtbereich · Ziel genau 114 CP", "Label/S", "text/secondary"));
  barBox.appendChild(await rangeBar({ w: 520, h: 10, scale: 114, min: 114, max: 114, color: "area/pflicht", segs: segsOf(p), label: true }));

  return root;
}

// ---------------------------------------------------------------------
// App-Rahmen
// ---------------------------------------------------------------------
async function topBar(active, links) {
  const bar = AL("HORIZONTAL", { name: "Kopfzeile", px: 24, align: "CENTER", justify: "SPACE_BETWEEN", fill: "bg/surface", h: 64 });
  bottomBorder(bar);
  const left = AL("HORIZONTAL", { name: "Marke & Studiengang", gap: 12, align: "CENTER", w: 420 });
  bar.appendChild(left);
  left.appendChild(await logo(28));
  left.appendChild(await T("SSP", "Heading/H3"));
  left.appendChild(vline(20));
  const pill = AL("HORIZONTAL", { name: "Studiengang wechseln", gap: 6, px: 10, py: 6, radius: 8, fill: "bg/subtle", align: "CENTER" });
  pill.appendChild(I("cap", "text/secondary"));
  pill.appendChild(await T("B.Sc. Informatik · PO 2023", "Body/M Strong"));
  pill.appendChild(I("chevron-down", "text/tertiary"));
  left.appendChild(pill);
  links.push([pill, "onboarding"]);

  const tabs = AL("HORIZONTAL", { name: "Navigation", gap: 2, p: 3, radius: 10, fill: "bg/subtle" });
  bar.appendChild(tabs);
  for (const [id, label, icon] of [
    ["uebersicht", "Übersicht", "dashboard"],
    ["semester", "Semesterplan", "columns"],
    ["module", "Module", "list"],
  ]) {
    const t = tab(id === active, label, icon);
    tabs.appendChild(t);
    links.push([t, id]);
  }

  const right = AL("HORIZONTAL", { name: "Aktionen", gap: 4, align: "CENTER", justify: "MAX", w: 420 });
  bar.appendChild(right);
  right.appendChild(button("Ghost", "Import", "upload"));
  right.appendChild(button("Ghost", "Export", "download"));
  const addBtn = button("Primary", "Modul hinzufügen", "plus");
  addBtn.name = "Modul hinzufügen";
  right.appendChild(addBtn);
  links.push([addBtn, "dialog"]);
  return bar;
}
async function appScreen(name, active, links, o = {}) {
  const f = AL("VERTICAL", { name, fill: "bg/canvas", w: o.w || 1440, clip: true });
  add(f, await topBar(active, links), { fillW: true });
  const content = AL("VERTICAL", { name: "Inhalt", gap: 24, pt: 32, pb: 64, px: o.px != null ? o.px : 120 });
  add(f, content, { fillW: true });
  return { f, content };
}
async function pageHeader(parent, title, sub, right = []) {
  const row = AL("HORIZONTAL", { name: "Seitenkopf", align: "MAX", justify: "SPACE_BETWEEN", gap: 24 });
  add(parent, row, { fillW: true });
  const l = AL("VERTICAL", { gap: 4 });
  row.appendChild(l);
  l.appendChild(await T(title, "Heading/H1"));
  l.appendChild(await T(sub, "Body/M", "text/secondary"));
  if (right.length) {
    const r = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
    row.appendChild(r);
    for (const n of right) r.appendChild(n);
  }
  return row;
}
async function sectionTitle(parent, title, sub) {
  const row = AL("HORIZONTAL", { name: title, gap: 12, align: "BASELINE" });
  add(parent, row, { fillW: true });
  row.appendChild(await T(title, "Heading/H2"));
  if (sub) row.appendChild(await T(sub, "Body/M", "text/secondary"));
  return row;
}

// ---------------------------------------------------------------------
// Screen 02 · Übersicht
// ---------------------------------------------------------------------
async function areaCard(a, inner, links) {
  const s = areaStats(a.id);
  const [tone, label] = areaState(s, a);
  const c = await card("VERTICAL", { name: `Bereich · ${a.name}`, p: 24, gap: 16 });
  const head = AL("HORIZONTAL", { gap: 10, align: "CENTER" });
  add(c, head, { fillW: true });
  head.appendChild(swatch(a.color, 12));
  head.appendChild(await T(a.name, "Heading/H3"));
  spacer(head);
  head.appendChild(badge(tone, label));

  const nums = AL("HORIZONTAL", { gap: 6, align: "BASELINE" });
  add(c, nums, { fillW: true });
  nums.appendChild(await T(String(s.total), "Numeric/L"));
  nums.appendChild(await T(`/ ${rng(a)} CP eingeplant`, "Body/M", "text/secondary"));
  spacer(nums);
  nums.appendChild(await T(breakdown(s), "Body/S", "text/secondary"));

  const scale = a.min === a.max ? a.max : Math.ceil(a.max * 1.15);
  c.appendChild(await rangeBar({ w: inner, h: 10, scale, min: a.min, max: a.max, color: a.color, segs: segsOf(s), label: true }));

  if (a.subs) {
    hline(c);
    const rules = AL("VERTICAL", { name: "Davon-Regeln", gap: 10 });
    add(c, rules, { fillW: true });
    rules.appendChild(await T("Davon", "Label/XS Caps", "text/tertiary"));
    for (const sub of a.subs) {
      const ss = subStats(sub.id);
      const ok = ss.total >= sub.min && ss.total <= sub.max;
      const r = AL("HORIZONTAL", { name: sub.name, gap: 10, align: "CENTER" });
      add(rules, r, { fillW: true });
      r.appendChild(I(ok ? "check" : "alert", ok ? "status/success" : "status/warning"));
      r.appendChild(await T(sub.name, "Body/M"));
      spacer(r);
      r.appendChild(await rangeBar({ w: 120, h: 6, scale: Math.ceil(sub.max * 1.1), min: sub.min, max: sub.max, color: a.color, segs: segsOf(ss) }));
      r.appendChild(await T(`${ss.total} / ${rng(sub)} CP`, "Label/S", "text/secondary", { w: 92, align: "RIGHT" }));
    }
  }

  if (!a.subs) {
    hline(c);
    const open = s.mods.filter((m) => m.status !== "B");
    const ol = AL("VERTICAL", { name: "Noch offen", gap: 8 });
    add(c, ol, { fillW: true });
    ol.appendChild(await T(open.length ? `Noch offen · ${open.length}` : "Noch offen", "Label/XS Caps", "text/tertiary"));
    if (!open.length) ol.appendChild(await T("Alles bestanden", "Body/S", "status/success"));
    for (const m of open.slice(0, 3)) {
      const r = AL("HORIZONTAL", { name: m.title, gap: 10, align: "CENTER" });
      add(ol, r, { fillW: true });
      r.appendChild(statusIcon(STATUS_NAME[m.status]));
      add(r, await T(m.title, "Body/S"), { fillW: true });
      r.appendChild(await T(SEM[m.sem][0], "Label/S", "text/tertiary"));
      r.appendChild(await T(`${m.cp} CP`, "Label/S", "text/secondary", { w: 40, align: "RIGHT" }));
    }
    if (open.length > 3) ol.appendChild(await T(`+ ${open.length - 3} weitere`, "Label/S", "text/tertiary"));
  }

  const dl = AL("VERTICAL", { name: "Module", gap: 8 });
  add(c, dl, { fillW: true });
  dl.appendChild(await T(`${s.count} ${s.count === 1 ? "Modul" : "Module"} · ein Block pro Modul, Breite = CP`, "Label/XS Caps", "text/tertiary"));
  dl.appendChild(mosaic(s.mods, a.color, inner));

  spacer(c);
  const foot = AL("HORIZONTAL", { name: "Module ansehen", gap: 4, align: "CENTER" });
  c.appendChild(foot);
  foot.appendChild(await T("Module ansehen", "Label/S"));
  foot.appendChild(I("arrow-right", "text/primary"));
  links.push([foot, "module"]);
  return c;
}
async function nextStep(parent, kind, title, desc, action) {
  const KIND = {
    warning: ["alert", "status/warning", "status/warning-bg"],
    info: ["info", "status/info", "status/info-bg"],
    success: ["check", "status/success", "status/success-bg"],
  }[kind];
  const r = AL("HORIZONTAL", { name: title, gap: 14, py: 14, align: "CENTER" });
  add(parent, r, { fillW: true });
  const ic = AL("HORIZONTAL", { name: "Symbol", radius: 999, fill: KIND[2], justify: "CENTER", align: "CENTER", w: 32, h: 32 });
  ic.appendChild(I(KIND[0], KIND[1]));
  r.appendChild(ic);
  const txt = AL("VERTICAL", { gap: 2 });
  add(r, txt, { fillW: true });
  add(txt, await T(title, "Body/M Strong"), { fillW: true });
  add(txt, await T(desc, "Body/S", "text/secondary"), { fillW: true });
  if (action) r.appendChild(action);
  return r;
}
async function buildOverview(links) {
  const { f, content } = await appScreen("02 · Übersicht", "uebersicht", links);
  const structBtn = button("Secondary", "Struktur bearbeiten", "sliders");
  links.push([structBtn, "struktur"]);
  await pageHeader(content, "Übersicht", `5. Fachsemester · ${SEM[CURRENT_SEM][1]} · automatisch gespeichert`, [structBtn]);

  // Reihe 1: Gesamtfortschritt + Seitenspalte
  const row1 = AL("HORIZONTAL", { name: "Reihe 1", gap: 24 });
  add(content, row1, { fillW: true });
  const hero = await card("VERTICAL", { name: "Gesamtfortschritt", p: 28, gap: 20 });
  add(row1, hero, { fillW: true });
  const top = AL("HORIZONTAL", { justify: "SPACE_BETWEEN" });
  add(hero, top, { fillW: true });
  const tl = AL("VERTICAL", { gap: 6 });
  top.appendChild(tl);
  tl.appendChild(await T("Gesamtfortschritt", "Label/XS Caps", "text/tertiary"));
  const big = AL("HORIZONTAL", { gap: 8, align: "BASELINE" });
  tl.appendChild(big);
  big.appendChild(await T(String(ALL.passed), "Display/XL"));
  big.appendChild(await T(`/ ${TOTAL_CP} CP bestanden`, "Heading/H2", "text/tertiary"));
  tl.appendChild(await T(`${PCT} % deines Studiums sind geschafft`, "Body/M", "text/secondary"));
  const tr = AL("VERTICAL", { gap: 8, align: "MAX" });
  top.appendChild(tr);
  tr.appendChild(badge("Neutral", `${ALL.enrolled} CP laufen gerade`));
  tr.appendChild(badge("Neutral", `${ALL.planned} CP geplant`));
  tr.appendChild(badge("Warning", `${MISSING} CP fehlen noch im Plan`));

  const heroInner = 1200 - 24 - 384 - 56;
  hero.appendChild(await stackedBar(heroInner, 16, AREAS.map((a) => [a, areaStats(a.id)])));
  const legend = AL("HORIZONTAL", { name: "Legende Status", gap: 18, align: "CENTER" });
  hero.appendChild(legend);
  for (const [lbl, o, dashed] of [["bestanden", 1], ["läuft", 0.5], ["geplant", 0.22], ["fehlt noch", 0, true]]) {
    const it = AL("HORIZONTAL", { gap: 6, align: "CENTER" });
    const sw = figma.createRectangle();
    sw.resize(12, 12);
    sw.cornerRadius = 3;
    sw.fills = o ? [P("text/secondary", o)] : [P("bg/subtle")];
    if (dashed) {
      sw.strokes = [P("border/strong")];
      sw.strokeWeight = 1;
      sw.dashPattern = [2, 2];
    }
    it.appendChild(sw);
    it.appendChild(await T(lbl, "Label/S", "text/secondary"));
    legend.appendChild(it);
  }
  spacer(hero);
  hline(hero);
  const al = AL("HORIZONTAL", { name: "Bereiche kompakt", gap: 16 });
  add(hero, al, { fillW: true });
  for (const a of AREAS) {
    const s = areaStats(a.id);
    const col = AL("VERTICAL", { gap: 6 });
    add(al, col, { fillW: true });
    col.appendChild(tag(a.key, a.name));
    col.appendChild(await T(`${s.total} / ${rng(a)} CP`, "Body/M Strong"));
    add(col, await T(breakdown(s), "Body/S", "text/secondary"), { fillW: true });
  }

  const side = AL("VERTICAL", { name: "Seitenspalte", gap: 24, w: 384 });
  row1.appendChild(side);
  const gc = await card("VERTICAL", { name: "Notenschnitt", p: 24, gap: 6 });
  add(side, gc, { fillW: true });
  gc.appendChild(await T("Notenschnitt · Schätzung", "Label/XS Caps", "text/tertiary"));
  gc.appendChild(await T(GPA_TEXT, "Numeric/L"));
  add(gc, await T(`CP-gewichtet über ${graded.length} benotete Module. Unverbindlich – maßgeblich ist dein Zeugnis.`, "Body/S", "text/secondary"), { fillW: true });

  const sc = await card("VERTICAL", { name: "Dieses Semester", p: 24, gap: 14 });
  add(side, sc, { fillW: true });
  const sh = AL("HORIZONTAL", { justify: "SPACE_BETWEEN", align: "MIN" });
  add(sc, sh, { fillW: true });
  const shl = AL("VERTICAL", { gap: 4 });
  sh.appendChild(shl);
  shl.appendChild(await T("Dieses Semester", "Label/XS Caps", "text/tertiary"));
  shl.appendChild(await T(`${CURRENT_SEM}. Semester · ${SEM[CURRENT_SEM][1]}`, "Heading/H3"));
  const cur = IN_PLAN.filter((m) => m.sem === CURRENT_SEM);
  sh.appendChild(badge("Neutral", `${sumCp(cur)} CP`));
  const list = AL("VERTICAL", { gap: 10 });
  add(sc, list, { fillW: true });
  for (const m of cur) {
    const r = AL("HORIZONTAL", { gap: 10, align: "CENTER" });
    add(list, r, { fillW: true });
    r.appendChild(statusIcon("Belegt"));
    r.appendChild(swatch(A[m.area].color, 8, 2));
    add(r, await T(m.title, "Body/S"), { fillW: true });
    r.appendChild(await T(`${m.cp} CP`, "Label/S", "text/secondary"));
  }
  const link = AL("HORIZONTAL", { name: "Zum Semesterplan", gap: 4, align: "CENTER" });
  sc.appendChild(link);
  link.appendChild(await T("Zum Semesterplan", "Label/S"));
  link.appendChild(I("arrow-right"));
  links.push([link, "semester"]);
  if (hero.height < side.height) hero.layoutSizingVertical = "FILL";

  // Reihe 2: Bereiche
  await sectionTitle(content, "Bereiche", "Was deine Prüfungsordnung verlangt – und wo du stehst");
  const inner = (1200 - 24) / 2 - 48;
  for (const pair of [["P", "W"], ["G", "T"]]) {
    const r = AL("HORIZONTAL", { name: "Bereiche", gap: 24 });
    add(content, r, { fillW: true });
    const cards = [];
    for (const id of pair) cards.push(add(r, await areaCard(A[id], inner, links), { fillW: true }));
    const tallest = Math.max(...cards.map((x) => x.height));
    for (const x of cards) if (x.height < tallest) x.layoutSizingVertical = "FILL";
  }

  // Reihe 3: Nächste Schritte
  const ns = await card("VERTICAL", { name: "Nächste Schritte", px: 24, pt: 20, pb: 8, gap: 0 });
  add(content, ns, { fillW: true });
  const nh = AL("HORIZONTAL", { gap: 8, align: "CENTER", pb: 6 });
  ns.appendChild(nh);
  nh.appendChild(await T("Nächste Schritte", "Heading/H3"));
  nh.appendChild(badge("Neutral", "3"));
  const ws = areaStats("W");
  const mzBtn = button("Secondary", "Merkzettel öffnen", "arrow-right");
  links.push([mzBtn, "semester"]);
  await nextStep(ns, "warning", `Wahlbereich: noch ${48 - ws.total}–${49 - ws.total} CP einplanen`,
    `Ziel sind 48–49 CP, eingeplant sind ${ws.total} CP. Auf deinem Merkzettel liegen ${PARKED.length} passende Module (${sumCp(PARKED)} CP).`, mzBtn);
  hline(ns);
  await nextStep(ns, "info", "Bachelorarbeit ist für SoSe 2027 geplant",
    "Prüfe rechtzeitig die Zulassungsvoraussetzungen in deiner Prüfungsordnung.", button("Ghost", "Details", null));
  hline(ns);
  const gs = areaStats("G");
  await nextStep(ns, "success", "Studium Generale ist vollständig geplant",
    `${gs.total} von 5–6 CP · ${gs.passed} CP bestanden, ${gs.enrolled} CP laufen gerade.`, null);
  return f;
}

// ---------------------------------------------------------------------
// Screen 03 · Semesterplan
// ---------------------------------------------------------------------
async function collapsedCol(n) {
  const ms = IN_PLAN.filter((m) => m.sem === n);
  const col = AL("VERTICAL", { name: `${n}. Semester (eingeklappt)`, p: 12, gap: 10, radius: 12, fill: "bg/subtle", w: 104 });
  const h = AL("HORIZONTAL", { align: "CENTER", justify: "SPACE_BETWEEN" });
  add(col, h, { fillW: true });
  h.appendChild(await T(`${n}. Sem.`, "Heading/H3"));
  h.appendChild(I("chevron-right", "text/tertiary"));
  col.appendChild(await T(SEM[n][0], "Label/S", "text/tertiary"));
  const cpRow = AL("HORIZONTAL", { gap: 6, align: "CENTER" });
  col.appendChild(cpRow);
  cpRow.appendChild(statusIcon("Bestanden"));
  cpRow.appendChild(await T(`${sumCp(ms)} CP`, "Body/M Strong"));
  const stack = AL("VERTICAL", { name: "Mini-Karte", gap: 2 });
  add(col, stack, { fillW: true });
  for (const m of ms) {
    const r = figma.createRectangle();
    r.name = `${m.title} (${m.cp} CP)`;
    r.resize(80, Math.max(m.cp * 6 - 2, 4));
    r.cornerRadius = 3;
    r.fills = [P(A[m.area].color, m.status === "B" ? 1 : 0.5)];
    add(stack, r, { fillW: true });
  }
  col.appendChild(await T(`${ms.length} Module`, "Label/S", "text/secondary"));
  return col;
}
async function semCol(n, o = {}) {
  const ms = IN_PLAN.filter((m) => m.sem === n);
  const cp = sumCp(ms);
  const col = AL("VERTICAL", { name: `${n}. Semester`, p: 8, gap: 8, radius: 12, fill: o.current ? "bg/surface" : "bg/subtle", w: 224 });
  if (o.current) {
    col.strokes = [P("text/primary", 0.85)];
    col.strokeWeight = 1.5;
    col.strokeAlign = "INSIDE";
  }
  const head = AL("VERTICAL", { name: "Kopf", gap: 6, pt: 6, pb: 4, px: 6 });
  add(col, head, { fillW: true });
  const l1 = AL("HORIZONTAL", { align: "CENTER", gap: 8 });
  add(head, l1, { fillW: true });
  l1.appendChild(await T(`${n}. Semester`, "Heading/H3"));
  spacer(l1);
  if (o.current) l1.appendChild(badge("Info", "Aktuell"));
  const l2 = AL("HORIZONTAL", { align: "CENTER", gap: 8 });
  add(head, l2, { fillW: true });
  l2.appendChild(await T(SEM[n][1], "Body/S", "text/secondary"));
  spacer(l2);
  l2.appendChild(await T(`${cp} / 30 CP`, "Label/S", cp > 30 ? "status/warning" : "text/primary"));
  head.appendChild(await loadBar(cp, 30, 196));
  for (const m of ms) add(col, mcard(m), { fillW: true });
  if (o.dropHint) {
    const d = AL("HORIZONTAL", { name: "Ablagestelle", py: 20, radius: 10, justify: "CENTER", align: "CENTER", fill: "area/wahl-tint", stroke: "area/wahl", dash: [4, 3] });
    add(col, d, { fillW: true });
    d.appendChild(await T("Hier ablegen · +6 CP", "Label/S", "area/wahl"));
  }
  const addSlot = AL("HORIZONTAL", { name: "Modul hinzufügen", gap: 6, py: 10, radius: 10, justify: "CENTER", align: "CENTER", stroke: "border/strong", dash: [4, 3] });
  add(col, addSlot, { fillW: true });
  addSlot.appendChild(I("plus", "text/tertiary"));
  addSlot.appendChild(await T("Modul", "Body/S", "text/tertiary"));
  return col;
}
async function buildSemester(links) {
  const { f, content } = await appScreen("03 · Semesterplan", "semester", links, { px: 32 });
  const seg = AL("HORIZONTAL", { name: "Studienmodell", gap: 2, p: 3, radius: 10, fill: "bg/subtle" });
  for (const [lbl, act] of [["Vollzeit · 30 CP", true], ["Teilzeit · 20 CP", false]]) {
    const s = AL("HORIZONTAL", { px: 12, h: 30, radius: 7, align: "CENTER", fill: act ? "bg/surface" : null });
    if (act) await s.setEffectStyleIdAsync(ES["Elevation/Card"].id);
    s.appendChild(await T(lbl, "Body/S", act ? "text/primary" : "text/secondary"));
    seg.appendChild(s);
  }
  await pageHeader(content, "Semesterplan", "Ziehe Module zwischen die Semester. Abgeschlossene Semester sind eingeklappt.", [seg, button("Secondary", "Semester hinzufügen", "plus")]);

  const lg = AL("HORIZONTAL", { name: "Legende", gap: 10, align: "CENTER" });
  add(content, lg, { fillW: true });
  for (const a of AREAS) lg.appendChild(tag(a.key, a.name));
  lg.appendChild(vline(16));
  for (const [st, lbl] of [["Bestanden", "bestanden"], ["Belegt", "läuft"], ["Geplant", "geplant"]]) {
    const it = AL("HORIZONTAL", { gap: 6, align: "CENTER", px: 4 });
    it.appendChild(statusIcon(st));
    it.appendChild(await T(lbl, "Label/S", "text/secondary"));
    lg.appendChild(it);
  }

  const board = AL("HORIZONTAL", { name: "Semester-Board", gap: 12, align: "MIN" });
  add(content, board, { fillW: true });
  for (const n of [1, 2, 3]) board.appendChild(await collapsedCol(n));
  board.appendChild(await semCol(4));
  board.appendChild(await semCol(5, { current: true }));
  const col6 = await semCol(6, { dropHint: true });
  board.appendChild(col6);

  const mz = AL("VERTICAL", { name: "Merkzettel", p: 8, gap: 8, radius: 12, fill: "bg/surface", stroke: "border/strong", dash: [6, 4], w: 224 });
  board.appendChild(mz);
  const mh = AL("VERTICAL", { gap: 4, pt: 6, pb: 4, px: 6 });
  add(mz, mh, { fillW: true });
  const mh1 = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  add(mh, mh1, { fillW: true });
  mh1.appendChild(await T("Merkzettel", "Heading/H3"));
  spacer(mh1);
  mh1.appendChild(await T(`${sumCp(PARKED)} CP`, "Label/S", "text/secondary"));
  add(mh, await T("Module ohne Semester – zählen erst, wenn du sie einplanst.", "Body/S", "text/secondary"), { fillW: true });
  PARKED.forEach((m, i) => {
    const c = add(mz, mcard(m), { fillW: true });
    if (i === 0) c.opacity = 0.35;
  });

  const plus = AL("VERTICAL", { name: "Semester hinzufügen", radius: 12, stroke: "border/strong", dash: [4, 3], justify: "CENTER", align: "CENTER", w: 48, h: 160 });
  plus.appendChild(I("plus", "text/tertiary"));
  board.appendChild(plus);

  // Drag-&-Drop-Moment: NLP-Modul wird vom Merkzettel ins 6. Semester gezogen
  const drag = mcard(PARKED[0]);
  drag.name = "Wird gezogen";
  board.appendChild(drag);
  drag.layoutPositioning = "ABSOLUTE";
  drag.resize(208, drag.height);
  // rechts neben der Ablagestelle, damit „Hier ablegen“ lesbar bleibt
  const hint = col6.findOne((n) => n.name === "Ablagestelle");
  drag.x = col6.x + col6.width - 44;
  drag.y = col6.y + (hint ? hint.y : 300) - 10;
  drag.rotation = -3;
  await drag.setEffectStyleIdAsync(ES["Elevation/Overlay"].id);

  const info = AL("HORIZONTAL", { name: "Hinweis", gap: 10, px: 16, py: 12, radius: 12, fill: "status/info-bg", align: "CENTER" });
  add(content, info, { fillW: true });
  info.appendChild(I("info", "status/info"));
  const free6 = Math.max(30 - sumCp(IN_PLAN.filter((m) => m.sem === 6)), 0);
  add(info, await T(`Im Plan stehen ${ALL.total} von ${TOTAL_CP} CP. Im 6. Semester ist bei 30 CP noch Platz für ${free6} CP – für die restlichen ${MISSING - free6} CP brauchst du ein 7. Semester oder ein volleres Semester.`, "Body/S", "text/primary"), { fillW: true });
  return f;
}

// ---------------------------------------------------------------------
// Screen 04 · Module (Liste)
// ---------------------------------------------------------------------
async function tableHeader(parent) {
  const h = AL("HORIZONTAL", { name: "Tabellenkopf", gap: 16, pl: 16, pr: 12, py: 10, align: "CENTER", fill: "bg/subtle" });
  add(parent, h, { fillW: true });
  bottomBorder(h);
  const blank = figma.createFrame();
  blank.fills = [];
  blank.resize(16, 1);
  blank.name = "Status";
  h.appendChild(blank);
  add(h, await T("Modul", "Label/S", "text/secondary"), { fillW: true });
  h.appendChild(await T("Teilbereich", "Label/S", "text/secondary", { w: 190 }));
  h.appendChild(await T("Semester", "Label/S", "text/secondary", { w: 96 }));
  h.appendChild(await T("CP", "Label/S", "text/secondary", { w: 36, align: "RIGHT" }));
  h.appendChild(await T("Note", "Label/S", "text/secondary", { w: 40, align: "RIGHT" }));
  const blank2 = blank.clone();
  h.appendChild(blank2);
}
async function groupHeader(parent, a, expanded) {
  const s = areaStats(a.id);
  const count = MODS.filter((m) => m.area === a.id).length;
  const h = AL("HORIZONTAL", { name: `Gruppe · ${a.name}`, gap: 10, pl: 16, pr: 16, py: 12, align: "CENTER", fill: "bg/surface" });
  add(parent, h, { fillW: true });
  bottomBorder(h);
  h.appendChild(I(expanded ? "chevron-down" : "chevron-right", "text/secondary"));
  h.appendChild(swatch(a.color, 10));
  h.appendChild(await T(a.name, "Body/M Strong"));
  h.appendChild(await T(`${count} Module`, "Body/S", "text/tertiary"));
  spacer(h);
  const [tone, label] = areaState(s, a);
  if (tone === "Warning" || tone === "Danger") h.appendChild(badge(tone, label));
  h.appendChild(await rangeBar({ w: 140, h: 6, scale: a.min === a.max ? a.max : Math.ceil(a.max * 1.15), min: a.min, max: a.max, color: a.color, segs: segsOf(s) }));
  h.appendChild(await T(`${s.total} / ${rng(a)} CP`, "Label/S", "text/secondary", { w: 92, align: "RIGHT" }));
  return h;
}
async function addRow(parent, a) {
  const r = AL("HORIZONTAL", { name: `Modul zu ${a.name} hinzufügen`, gap: 8, pl: 48, py: 11, align: "CENTER" });
  add(parent, r, { fillW: true });
  bottomBorder(r);
  r.appendChild(I("plus", "text/tertiary"));
  r.appendChild(await T(`Modul zu ${a.name} hinzufügen`, "Body/S", "text/tertiary"));
  return r;
}
async function buildModules(links) {
  const { f, content } = await appScreen("04 · Module", "module", links);
  const search = AL("HORIZONTAL", { name: "Suche", gap: 8, px: 12, radius: 8, fill: "bg/surface", stroke: "border/default", align: "CENTER", w: 260, h: 36 });
  search.appendChild(I("search", "text/tertiary"));
  search.appendChild(await T("Modul suchen …", "Body/M", "text/tertiary"));
  await pageHeader(content, "Module", `${IN_PLAN.length} Module im Plan · ${ALL.total} CP · ${PARKED.length} auf dem Merkzettel`, [search, button("Secondary", "Filter", "filter")]);

  const body = AL("HORIZONTAL", { name: "Körper", gap: 24, align: "MIN" });
  add(content, body, { fillW: true });

  // Seitenleiste
  const side = AL("VERTICAL", { name: "Filter", gap: 16, w: 264 });
  body.appendChild(side);
  const bc = await card("VERTICAL", { name: "Bereiche", p: 8, gap: 2, radius: 12 });
  add(side, bc, { fillW: true });
  await capsLabel(bc, "Bereiche");
  const allRow = AL("HORIZONTAL", { name: "Alle", gap: 10, p: 8, radius: 8, fill: "bg/subtle", align: "CENTER" });
  add(bc, allRow, { fillW: true });
  allRow.appendChild(I("layers", "text/primary"));
  allRow.appendChild(await T("Alle Module", "Body/M Strong"));
  spacer(allRow);
  allRow.appendChild(await T(String(MODS.length), "Label/S", "text/secondary"));
  for (const a of AREAS) {
    const s = areaStats(a.id);
    const r = AL("HORIZONTAL", { name: a.name, p: 8, radius: 8, align: "CENTER" });
    add(bc, r, { fillW: true });
    const v = AL("VERTICAL", { gap: 6 });
    add(r, v, { fillW: true });
    const vt = AL("HORIZONTAL", { gap: 10, align: "CENTER" });
    add(v, vt, { fillW: true });
    vt.appendChild(swatch(a.color, 10));
    vt.appendChild(await T(a.name, "Body/M"));
    spacer(vt);
    vt.appendChild(await T(`${s.total}/${rng(a)}`, "Label/S", areaState(s, a)[0] === "Warning" ? "status/warning" : "text/secondary"));
    v.appendChild(await rangeBar({ w: 232, h: 4, scale: a.min === a.max ? a.max : Math.ceil(a.max * 1.15), min: a.min, max: a.max, color: a.color, segs: segsOf(s), ticks: false }));
  }
  const stc = await card("VERTICAL", { name: "Status", p: 8, gap: 2, radius: 12 });
  add(side, stc, { fillW: true });
  await capsLabel(stc, "Status");
  for (const [st, lbl, code] of [["Bestanden", "Bestanden", "B"], ["Belegt", "Läuft", "L"], ["Geplant", "Geplant", "G"], ["Nicht bestanden", "Nicht bestanden", "X"]]) {
    const r = AL("HORIZONTAL", { name: lbl, gap: 10, p: 8, radius: 8, align: "CENTER" });
    add(stc, r, { fillW: true });
    r.appendChild(statusIcon(st));
    r.appendChild(await T(lbl, "Body/M"));
    spacer(r);
    r.appendChild(await T(String(MODS.filter((m) => m.status === code).length), "Label/S", "text/secondary"));
  }

  // Tabelle
  const table = await card("VERTICAL", { name: "Modultabelle", radius: 12, clip: true });
  add(body, table, { fillW: true });
  await tableHeader(table);
  await groupHeader(table, A.P, false);
  for (const id of ["W", "G", "T"]) {
    const a = A[id];
    await groupHeader(table, a, true);
    const ms = MODS.filter((m) => m.area === id).sort((x, y) => (x.sem || 99) - (y.sem || 99));
    for (const m of ms) add(table, mrow(m), { fillW: true });
    await addRow(table, a);
  }
  // letzte Zeile ohne Linie
  const last = table.children[table.children.length - 1];
  last.strokes = [];
  return f;
}

// ---------------------------------------------------------------------
// Screen 05 · Modul hinzufügen (Dialog)
// ---------------------------------------------------------------------
async function field(parent, label, control, o = {}) {
  const f = AL("VERTICAL", { name: label, gap: 8, w: o.w });
  add(parent, f, { fillW: !o.hug && !o.w });
  f.appendChild(await T(label, "Label/S", "text/secondary"));
  add(f, control, { fillW: !o.hugControl });
  return f;
}
async function buildDialog(modulesScreen, links) {
  const W = 1440;
  const H = 1000;
  const f = figma.createFrame();
  f.name = "05 · Modul hinzufügen";
  f.resize(W, H);
  f.clipsContent = true;
  f.fills = [P("bg/canvas")];
  const bg = modulesScreen.clone();
  bg.name = "Hintergrund (Module)";
  f.appendChild(bg);
  bg.x = 0;
  bg.y = 0;
  const scrim = figma.createRectangle();
  scrim.name = "Abdunklung";
  scrim.resize(W, H);
  scrim.fills = [P("bg/inverse", 0.45)];
  f.appendChild(scrim);

  const d = AL("VERTICAL", { name: "Dialog", radius: 16, fill: "bg/surface", w: 560, clip: true });
  await d.setEffectStyleIdAsync(ES["Elevation/Overlay"].id);
  f.appendChild(d);
  d.x = (W - 560) / 2;
  d.y = 64;

  const head = AL("HORIZONTAL", { name: "Kopf", gap: 12, px: 24, pt: 20, pb: 16, justify: "SPACE_BETWEEN", align: "MIN" });
  add(d, head, { fillW: true });
  bottomBorder(head);
  const hl = AL("VERTICAL", { gap: 4 });
  add(head, hl, { fillW: true });
  hl.appendChild(await T("Modul hinzufügen", "Heading/H2"));
  add(hl, await T("Ein Modul ist ein Eintrag – keine Vorlesungen, Übungen oder Prüfungen einzeln anlegen.", "Body/S", "text/secondary"), { fillW: true });
  const close = AL("HORIZONTAL", { name: "Schließen", radius: 8, justify: "CENTER", align: "CENTER", w: 32, h: 32 });
  close.appendChild(I("x", "text/secondary"));
  head.appendChild(close);
  links.push([close, "module"]);

  const body = AL("VERTICAL", { name: "Formular", gap: 20, p: 24 });
  add(d, body, { fillW: true });

  // Name
  const input = AL("HORIZONTAL", { name: "Eingabe", gap: 2, px: 12, radius: 8, fill: "bg/surface", stroke: "text/primary", strokeWeight: 1.5, align: "CENTER", h: 40 });
  input.appendChild(await T("Deep Learning: Architectures & Methods", "Body/M"));
  const caret = figma.createRectangle();
  caret.name = "Cursor";
  caret.resize(1.5, 18);
  caret.fills = [P("text/primary")];
  input.appendChild(caret);
  const nameField = await field(body, "Modulname", input);
  add(nameField, await T("Tipp: Namen einfach aus TUCaN kopieren.", "Label/S", "text/tertiary"), { fillW: true });

  // CP
  const chips = AL("HORIZONTAL", { name: "CP-Auswahl", gap: 6, align: "CENTER" });
  for (const v of ["3", "5", "6", "9", "10", "12", "Andere …"]) {
    const sel = v === "6";
    const c = AL("HORIZONTAL", { name: v, px: 12, h: 32, radius: 8, align: "CENTER", fill: sel ? "bg/inverse" : "bg/surface", stroke: sel ? null : "border/default" });
    c.appendChild(await T(v, "Body/M Strong", sel ? "text/inverse" : v.startsWith("A") ? "text/tertiary" : "text/primary"));
    chips.appendChild(c);
  }
  await field(body, "Credit Points", chips, { hugControl: true });

  // Bereich (flache Liste!)
  const list = AL("VERTICAL", { name: "Bereich-Auswahl", radius: 10, stroke: "border/default", clip: true });
  const OPTIONS = [
    ["P", null, "Pflichtbereich", "vollständig"],
    ["W", "WPB", "Wahlbereich › Wahlpflicht-Katalog", null],
    ["W", "FP", "Wahlbereich › Fachprüfungen", null],
    ["W", "SBL", "Wahlbereich › Studienbegleitende Leistungen", null],
    ["G", null, "Studium Generale", "vollständig"],
    ["T", null, "Bachelorarbeit", "vollständig"],
  ];
  for (const [aid, sid, lbl, hint] of OPTIONS) {
    const sel = sid === "FP";
    const r = AL("HORIZONTAL", { name: lbl, gap: 10, px: 12, py: 10, align: "CENTER", fill: sel ? "area/wahl-tint" : null });
    add(list, r, { fillW: true });
    if (lbl !== "Bachelorarbeit") bottomBorder(r);
    const radio = figma.createEllipse();
    radio.name = sel ? "Auswahl (aktiv)" : "Auswahl";
    radio.resize(16, 16);
    radio.fills = [P("bg/surface")];
    radio.strokes = [P(sel ? "text/primary" : "border/strong")];
    radio.strokeWeight = sel ? 5 : 1.5;
    radio.strokeAlign = "INSIDE";
    r.appendChild(radio);
    r.appendChild(swatch(A[aid].color, 10));
    const t = await T(lbl, "Body/M", "text/primary");
    if (lbl.includes("›")) t.setRangeFills(0, lbl.indexOf("›") + 1, [P("text/tertiary")]);
    r.appendChild(t);
    spacer(r);
    const s = sid ? subStats(sid) : areaStats(aid);
    const x = sid ? SUB[sid] : A[aid];
    r.appendChild(await T(hint ? `${s.total} / ${rng(x)} · ${hint}` : `${s.total} / ${rng(x)} CP`, "Label/S", "text/tertiary"));
  }
  const areaField = await field(body, "Bereich", list);
  add(areaField, await T("Teilbereiche erscheinen direkt in der Liste – du wählst immer genau eine Zeile.", "Label/S", "text/tertiary"), { fillW: true });

  // Semester + Status
  const two = AL("HORIZONTAL", { name: "Semester & Status", gap: 16 });
  add(body, two, { fillW: true });
  const sel = AL("HORIZONTAL", { name: "Semester-Auswahl", gap: 8, px: 12, radius: 8, stroke: "border/default", align: "CENTER", h: 40 });
  sel.appendChild(I("calendar", "text/secondary"));
  sel.appendChild(await T("6. · SoSe 2027", "Body/M"));
  spacer(sel);
  sel.appendChild(I("chevron-down", "text/tertiary"));
  await field(two, "Semester", sel, { w: 190 });
  const stSeg = AL("HORIZONTAL", { name: "Status-Auswahl", gap: 2, p: 3, radius: 9, fill: "bg/subtle", h: 40 });
  for (const [st, lbl] of [["Geplant", "Geplant"], ["Belegt", "Läuft"], ["Bestanden", "Bestanden"]]) {
    const act = st === "Geplant";
    const s = AL("HORIZONTAL", { name: lbl, gap: 6, px: 8, radius: 7, justify: "CENTER", align: "CENTER", fill: act ? "bg/surface" : null });
    if (act) await s.setEffectStyleIdAsync(ES["Elevation/Card"].id);
    add(stSeg, s, { fillW: true, fillH: true });
    s.appendChild(statusIcon(st));
    s.appendChild(await T(lbl, "Body/S", act ? "text/primary" : "text/secondary"));
  }
  await field(two, "Status", stSeg);

  // Auswirkung
  const ws = areaStats("W");
  const fp = subStats("FP");
  const after = ws.total + 6;
  const impact = AL("HORIZONTAL", { name: "Auswirkung", gap: 12, px: 14, py: 12, radius: 10, fill: "bg/subtle", align: "CENTER" });
  add(body, impact, { fillW: true });
  impact.appendChild(I("target", "area/wahl"));
  const it = AL("VERTICAL", { gap: 2 });
  add(impact, it, { fillW: true });
  it.appendChild(await T(`Wahlbereich danach: ${after} / 48–49 CP`, "Body/M Strong"));
  it.appendChild(await T(`Fachprüfungen danach: ${fp.total + 6} / 5–30 CP · noch ${48 - after}–${49 - after} CP bis zum Ziel`, "Body/S", "text/secondary"));
  impact.appendChild(await rangeBar({ w: 120, h: 6, scale: Math.ceil(49 * 1.15), min: 48, max: 49, color: "area/wahl", segs: segsOf(ws).concat([{ v: 6, o: 0.55, name: "neu", color: "area/wahl" }]) }));

  const foot = AL("HORIZONTAL", { name: "Fuß", gap: 12, px: 24, py: 16, justify: "SPACE_BETWEEN", align: "CENTER", fill: "bg/canvas" });
  add(d, foot, { fillW: true });
  topBorder(foot);
  foot.appendChild(await T("Note eintragen, sobald das Modul bestanden ist.", "Label/S", "text/tertiary"));
  const btns = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  foot.appendChild(btns);
  const cancel = button("Ghost", "Abbrechen", null);
  const ok = button("Primary", "Hinzufügen", "check");
  btns.appendChild(cancel);
  btns.appendChild(ok);
  links.push([cancel, "module"], [ok, "module"]);
  return f;
}

// ---------------------------------------------------------------------
// Screen 06 · Struktur
// ---------------------------------------------------------------------
async function numInput(v, w = 52) {
  const f = AL("HORIZONTAL", { name: "Zahl", px: 10, radius: 8, stroke: "border/default", fill: "bg/surface", align: "CENTER", justify: "CENTER", w, h: 34 });
  f.appendChild(await T(String(v), "Body/M Strong"));
  return f;
}
async function textInput(v, o = {}) {
  const f = AL("HORIZONTAL", { name: "Text", px: 10, radius: 8, stroke: "border/default", fill: "bg/surface", align: "CENTER", h: o.h || 34 });
  f.appendChild(await T(v, o.style || "Body/M Strong"));
  return f;
}
async function rangeInputs(min, max) {
  const r = AL("HORIZONTAL", { name: "CP-Spanne", gap: 6, align: "CENTER" });
  r.appendChild(await numInput(min));
  r.appendChild(await T("–", "Body/M", "text/tertiary"));
  r.appendChild(await numInput(max));
  r.appendChild(await T("CP", "Body/S", "text/secondary"));
  return r;
}
async function buildStructure(links) {
  const { f, content } = await appScreen("06 · Struktur", null, links);
  const back = button("Ghost", "Zurücksetzen", null);
  await pageHeader(content, "Struktur", "Vorlage B.Sc. Informatik · PO 2023 (Satzungsbeilage 2023_II) · selten nötig", [back, button("Secondary", "Vorlage exportieren", "download")]);
  const body = AL("HORIZONTAL", { name: "Körper", gap: 24, align: "MIN" });
  add(content, body, { fillW: true });

  const main = AL("VERTICAL", { name: "Bereiche bearbeiten", gap: 12 });
  add(body, main, { fillW: true });
  const tot = await card("HORIZONTAL", { name: "Gesamt", gap: 12, px: 20, py: 14, radius: 12, align: "CENTER" });
  add(main, tot, { fillW: true });
  tot.appendChild(I("target", "text/secondary"));
  tot.appendChild(await T("Gesamtumfang des Studiengangs", "Body/M Strong"));
  spacer(tot);
  tot.appendChild(await numInput(TOTAL_CP, 64));
  tot.appendChild(await T("CP", "Body/S", "text/secondary"));

  for (const a of AREAS) {
    const c = await card("VERTICAL", { name: `Bereich · ${a.name}`, radius: 12 });
    add(main, c, { fillW: true });
    const h = AL("HORIZONTAL", { name: "Kopf", gap: 12, px: 16, py: 14, align: "CENTER" });
    add(c, h, { fillW: true });
    h.appendChild(I("grip", "text/tertiary"));
    h.appendChild(swatch(a.color, 20, 6));
    add(h, await textInput(a.name), { fillW: true });
    h.appendChild(await rangeInputs(a.min, a.max));
    h.appendChild(I("more", "text/tertiary"));
    const sub = AL("VERTICAL", { name: "Teilbereiche", gap: 8, pl: 64, pr: 16, pb: 14 });
    add(c, sub, { fillW: true });
    if (a.subs) {
      sub.appendChild(await T("Davon (Teilbereiche)", "Label/XS Caps", "text/tertiary"));
      for (const s of a.subs) {
        const r = AL("HORIZONTAL", { name: s.name, gap: 12, align: "CENTER" });
        add(sub, r, { fillW: true });
        r.appendChild(swatch(a.color, 8, 2, 0.6));
        add(r, await textInput(s.name, { style: "Body/M" }), { fillW: true });
        r.appendChild(await rangeInputs(s.min, s.max));
        r.appendChild(I("trash", "text/tertiary"));
      }
    }
    const addSub = AL("HORIZONTAL", { name: "Teilbereich hinzufügen", gap: 6, align: "CENTER" });
    sub.appendChild(addSub);
    addSub.appendChild(I("plus", "text/tertiary"));
    addSub.appendChild(await T(a.subs ? "Teilbereich hinzufügen" : "Teilbereich hinzufügen (optional)", "Body/S", "text/tertiary"));
  }
  const addArea = AL("HORIZONTAL", { name: "Bereich hinzufügen", gap: 8, py: 14, radius: 12, stroke: "border/strong", dash: [5, 4], justify: "CENTER", align: "CENTER" });
  add(main, addArea, { fillW: true });
  addArea.appendChild(I("plus", "text/secondary"));
  addArea.appendChild(await T("Bereich hinzufügen", "Body/M Strong", "text/secondary"));
  const note = AL("HORIZONTAL", { name: "Hinweis", gap: 10, px: 16, py: 12, radius: 12, fill: "bg/subtle", align: "MIN" });
  add(main, note, { fillW: true });
  note.appendChild(I("info", "text/secondary"));
  add(note, await T("Maximal eine Ebene Teilbereiche – das reicht für alle untersuchten TU-Ordnungen. Lehrveranstaltungen und Prüfungen werden bewusst nicht modelliert: Credit Points gibt es pro Modul.", "Body/S", "text/secondary"), { fillW: true });

  const side = AL("VERTICAL", { name: "Prüfung & Vorschau", gap: 16, w: 384 });
  body.appendChild(side);
  const minSum = AREAS.reduce((s, a) => s + a.min, 0);
  const maxSum = AREAS.reduce((s, a) => s + a.max, 0);
  const chk = await card("VERTICAL", { name: "Plausibilität", p: 20, gap: 12, radius: 12 });
  add(side, chk, { fillW: true });
  const ch = AL("HORIZONTAL", { gap: 10, align: "CENTER" });
  chk.appendChild(ch);
  const ok = AL("HORIZONTAL", { radius: 999, fill: "status/success-bg", justify: "CENTER", align: "CENTER", w: 28, h: 28 });
  ok.appendChild(I("check", "status/success"));
  ch.appendChild(ok);
  ch.appendChild(await T("Struktur ist schlüssig", "Heading/H3"));
  add(chk, await T(`Die Bereiche lassen sich zu genau ${TOTAL_CP} CP kombinieren.`, "Body/S", "text/secondary"), { fillW: true });
  for (const [lbl, val, strong] of [["Summe der Minima", `${minSum} CP`, false], ["Gesamtumfang", `${TOTAL_CP} CP`, true], ["Summe der Maxima", `${maxSum} CP`, false]]) {
    const r = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
    add(chk, r, { fillW: true });
    r.appendChild(await T(lbl, "Body/S", strong ? "text/primary" : "text/secondary"));
    spacer(r);
    r.appendChild(await T(val, strong ? "Body/M Strong" : "Body/S", strong ? "text/primary" : "text/secondary"));
  }
  add(chk, await T(`${minSum} ≤ ${TOTAL_CP} ≤ ${maxSum} ✓`, "Label/S", "status/success"), { fillW: true });

  const pv = await card("VERTICAL", { name: "Vorschau", p: 20, gap: 14, radius: 12 });
  add(side, pv, { fillW: true });
  pv.appendChild(await T("Vorschau · Mindestwerte", "Label/XS Caps", "text/tertiary"));
  pv.appendChild(await rangeBar({ w: 336, h: 12, scale: TOTAL_CP, min: TOTAL_CP, max: TOTAL_CP, color: "text/primary", ticks: false, band: false, segs: AREAS.map((a) => ({ v: a.min, color: a.color, o: 1, gap: 3, name: a.name })) }));
  for (const a of AREAS) {
    const r = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
    add(pv, r, { fillW: true });
    r.appendChild(tag(a.key, a.name));
    spacer(r);
    r.appendChild(await T(`${rng(a)} CP`, "Label/S", "text/secondary"));
  }

  const src = AL("VERTICAL", { name: "Quelle", p: 20, gap: 8, radius: 12, fill: "bg/subtle" });
  add(side, src, { fillW: true });
  const sh = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  src.appendChild(sh);
  sh.appendChild(I("file", "text/secondary"));
  sh.appendChild(await T("Woher kommen die Zahlen?", "Body/M Strong"));
  add(src, await T("Aus dem Studien- und Prüfungsplan B.Sc. Informatik (Satzungsbeilage 2023_II, in Kraft seit 01.10.2023). Verbindlich ist immer die Ordnung deines Studienbeginns – im Zweifel beim Studienbüro nachfragen.", "Body/S", "text/secondary"), { fillW: true });
  return f;
}

// ---------------------------------------------------------------------
// Screen 01 · Onboarding
// ---------------------------------------------------------------------
const PROGRAMS = [
  {
    deg: "B.Sc.", name: "Informatik", meta: "PO 2023 · ab WiSe 2023/24 · 180 CP", total: 180, selected: true,
    areas: [["area/pflicht", "Pflichtbereich", 114, 114], ["area/wahl", "Wahlbereich", 48, 49], ["area/generale", "Studium Generale", 5, 6], ["area/thesis", "Bachelorarbeit", 12, 12]],
  },
  {
    deg: "M.Sc.", name: "Informatik", meta: "PO 2023 · ab WiSe 2023/24 · 120 CP", total: 120,
    areas: [["area/pflicht", "Individuelle Vertiefung", 66, 72], ["area/generale", "Studium Generale", 18, 24], ["area/thesis", "Master-Thesis", 30, 30]],
  },
  {
    deg: "B.Sc.", name: "Maschinenbau – Sustainable Engineering", meta: "PO 2024 · ab 01.12.2024 · 180 CP", total: 180,
    areas: [["area/pflicht", "Pflichtbereich", 146, 146], ["area/wahl", "Wahlpflichtbereich", 16, 19], ["area/generale", "Studium Generale", 3, 6], ["area/thesis", "Bachelor-Thesis", 12, 12]],
  },
];
async function programCard(p, w) {
  const c = await card("VERTICAL", { name: `${p.deg} ${p.name}`, p: 20, gap: 14, radius: 14 });
  if (p.selected) {
    c.strokes = [P("text/primary")];
    c.strokeWeight = 2;
  }
  const h = AL("HORIZONTAL", { gap: 12, align: "MIN" });
  add(c, h, { fillW: true });
  const hl = AL("VERTICAL", { gap: 2 });
  add(h, hl, { fillW: true });
  hl.appendChild(await T(p.deg, "Label/XS Caps", "text/tertiary"));
  add(hl, await T(p.name, "Heading/H2"), { fillW: true });
  if (p.selected) {
    const ck = AL("HORIZONTAL", { radius: 999, fill: "bg/inverse", justify: "CENTER", align: "CENTER", w: 24, h: 24 });
    ck.appendChild(I("check", "text/inverse"));
    h.appendChild(ck);
  }
  c.appendChild(await T(p.meta, "Body/S", "text/secondary"));
  c.appendChild(await rangeBar({ w: w - 40, h: 8, scale: p.total, min: p.total, max: p.total, color: "text/primary", ticks: false, band: false, segs: p.areas.map(([col, , min]) => ({ v: min, color: col, o: 1, gap: 2 })) }));
  const l = AL("VERTICAL", { gap: 6 });
  add(c, l, { fillW: true });
  for (const [col, name, min, max] of p.areas) {
    const r = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
    add(l, r, { fillW: true });
    r.appendChild(swatch(col, 8, 2));
    r.appendChild(await T(name, "Body/S"));
    spacer(r);
    r.appendChild(await T(min === max ? `${min} CP` : `${min}–${max} CP`, "Label/S", "text/secondary"));
  }
  return c;
}
async function optionCard(icon, title, desc) {
  const c = AL("VERTICAL", { name: title, p: 20, gap: 10, radius: 14, stroke: "border/strong", dash: [6, 4], fill: "bg/surface", fillOpacity: 0.5 });
  const ic = AL("HORIZONTAL", { radius: 10, fill: "bg/subtle", justify: "CENTER", align: "CENTER", w: 36, h: 36 });
  ic.appendChild(I(icon, "text/secondary", 18));
  c.appendChild(ic);
  c.appendChild(await T(title, "Heading/H3"));
  add(c, await T(desc, "Body/S", "text/secondary"), { fillW: true });
  return c;
}
async function buildOnboarding(links) {
  const f = AL("VERTICAL", { name: "01 · Onboarding", gap: 36, pt: 56, pb: 64, align: "CENTER", fill: "bg/canvas", w: 1440 });
  const brand = AL("HORIZONTAL", { gap: 10, align: "CENTER" });
  f.appendChild(brand);
  brand.appendChild(await logo(28));
  brand.appendChild(await T("SSP", "Heading/H3"));
  brand.appendChild(await T("· Studienplaner für die TU Darmstadt", "Body/M", "text/secondary"));
  brand.appendChild(badge("Neutral", "inoffiziell"));
  const hero = AL("VERTICAL", { gap: 10, align: "CENTER" });
  f.appendChild(hero);
  hero.appendChild(await T("Was studierst du?", "Display/XL"));
  hero.appendChild(await T("Wähle deine Prüfungsordnung – Bereiche und CP-Regeln sind dann schon eingetragen.\nDu kannst alles später unter „Struktur“ anpassen.", "Body/M", "text/secondary", { align: "CENTER" }));
  const search = AL("HORIZONTAL", { name: "Suche", gap: 10, px: 14, radius: 10, fill: "bg/surface", stroke: "border/default", align: "CENTER", w: 560, h: 44 });
  search.appendChild(I("search", "text/tertiary"));
  search.appendChild(await T("Studiengang oder Prüfungsordnung suchen …", "Body/M", "text/tertiary"));
  f.appendChild(search);

  const grid = AL("VERTICAL", { name: "Vorlagen", gap: 16, w: 1152 });
  f.appendChild(grid);
  const cw = (1152 - 32) / 3;
  const r1 = AL("HORIZONTAL", { gap: 16 });
  add(grid, r1, { fillW: true });
  const r1cards = [];
  for (const p of PROGRAMS) r1cards.push(add(r1, await programCard(p, cw), { fillW: true }));
  const tallest = Math.max(...r1cards.map((x) => x.height));
  for (const x of r1cards) if (x.height < tallest) x.layoutSizingVertical = "FILL";
  const r2 = AL("HORIZONTAL", { gap: 16 });
  add(grid, r2, { fillW: true });
  add(r2, await optionCard("layers", "Leere Vorlage", "Bereiche und Regeln selbst anlegen – z. B. für ein Zweitfach oder eine ältere Prüfungsordnung."), { fillW: true });
  add(r2, await optionCard("upload", "Plan importieren", "Eine exportierte SSP-Datei (.json) öffnen. Dateien aus dem alten Planer werden automatisch umgewandelt."), { fillW: true });
  add(r2, await optionCard("info", "Dein Studiengang fehlt?", "Vorlagen sind einfache JSON-Dateien. Schick uns die Satzungsbeilage – oder bau sie mit der leeren Vorlage nach."), { fillW: true });

  const foot = AL("HORIZONTAL", { name: "Weiter", gap: 20, align: "CENTER" });
  f.appendChild(foot);
  foot.appendChild(await T("Keine Anmeldung. Deine Daten bleiben auf deinem Gerät.", "Body/S", "text/tertiary"));
  const go = button("Primary", "Weiter mit B.Sc. Informatik", "arrow-right");
  foot.appendChild(go);
  links.push([go, "uebersicht"]);
  return f;
}

// ---------------------------------------------------------------------
// Screen 07 · Mobil
// ---------------------------------------------------------------------
async function buildMobile(links) {
  const f = AL("VERTICAL", { name: "07 · Mobil · Übersicht", fill: "bg/canvas", w: 390, clip: true, radius: 28 });
  const status = AL("HORIZONTAL", { name: "Statusleiste", px: 28, pt: 14, pb: 6, justify: "SPACE_BETWEEN", align: "CENTER" });
  add(f, status, { fillW: true });
  status.appendChild(await T("9:41", "Label/S"));
  status.appendChild(await T("●●● ▮", "Label/S"));
  const head = AL("HORIZONTAL", { name: "Kopf", px: 16, py: 10, justify: "SPACE_BETWEEN", align: "CENTER" });
  add(f, head, { fillW: true });
  const hl = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  head.appendChild(hl);
  hl.appendChild(await logo(24));
  hl.appendChild(await T("SSP", "Heading/H3"));
  const pill = AL("HORIZONTAL", { gap: 4, px: 10, py: 6, radius: 8, fill: "bg/subtle", align: "CENTER" });
  pill.appendChild(await T("B.Sc. Informatik", "Label/S"));
  pill.appendChild(I("chevron-down", "text/tertiary"));
  head.appendChild(pill);

  const content = AL("VERTICAL", { name: "Inhalt", gap: 16, px: 16, pt: 8, pb: 24 });
  add(f, content, { fillW: true });
  const hero = await card("VERTICAL", { name: "Gesamtfortschritt", p: 20, gap: 14 });
  add(content, hero, { fillW: true });
  hero.appendChild(await T("Gesamtfortschritt", "Label/XS Caps", "text/tertiary"));
  const big = AL("HORIZONTAL", { gap: 6, align: "BASELINE" });
  hero.appendChild(big);
  big.appendChild(await T(String(ALL.passed), "Display/XL"));
  big.appendChild(await T(`/ ${TOTAL_CP} CP`, "Heading/H2", "text/tertiary"));
  hero.appendChild(await stackedBar(318, 12, AREAS.map((a) => [a, areaStats(a.id)])));
  const bw = AL("HORIZONTAL", { gap: 6, wrap: true, w: 318 });
  hero.appendChild(bw);
  bw.appendChild(badge("Neutral", `${ALL.enrolled} laufen`));
  bw.appendChild(badge("Neutral", `${ALL.planned} geplant`));
  bw.appendChild(badge("Warning", `${MISSING} fehlen`));

  content.appendChild(await T("Bereiche", "Heading/H3"));
  const lc = await card("VERTICAL", { name: "Bereiche", radius: 14, clip: true });
  add(content, lc, { fillW: true });
  for (const a of AREAS) {
    const s = areaStats(a.id);
    const [tone, label] = areaState(s, a);
    const r = AL("VERTICAL", { name: a.name, gap: 6, px: 16, py: 14 });
    add(lc, r, { fillW: true });
    if (a.id !== "T") bottomBorder(r);
    const t = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
    add(r, t, { fillW: true });
    t.appendChild(swatch(a.color, 10));
    t.appendChild(await T(a.name, "Body/M Strong"));
    spacer(t);
    t.appendChild(await T(`${s.total} / ${rng(a)}`, "Label/S", "text/secondary"));
    r.appendChild(await rangeBar({ w: 326, h: 6, scale: a.min === a.max ? a.max : Math.ceil(a.max * 1.15), min: a.min, max: a.max, color: a.color, segs: segsOf(s) }));
    if (tone === "Warning") r.appendChild(await T(label, "Label/S", "status/warning"));
  }
  const ns = await card("HORIZONTAL", { name: "Nächster Schritt", p: 16, gap: 12, radius: 14, align: "CENTER" });
  add(content, ns, { fillW: true });
  const ic = AL("HORIZONTAL", { radius: 999, fill: "status/warning-bg", justify: "CENTER", align: "CENTER", w: 32, h: 32 });
  ic.appendChild(I("alert", "status/warning"));
  ns.appendChild(ic);
  const nt = AL("VERTICAL", { gap: 2 });
  add(ns, nt, { fillW: true });
  add(nt, await T("Wahlbereich: noch 12–13 CP", "Body/M Strong"), { fillW: true });
  add(nt, await T("2 Module auf dem Merkzettel passen", "Body/S", "text/secondary"), { fillW: true });
  ns.appendChild(I("chevron-right", "text/tertiary"));

  const nav = AL("HORIZONTAL", { name: "Tab-Leiste", px: 12, pt: 8, pb: 28, justify: "SPACE_BETWEEN", align: "CENTER", fill: "bg/surface" });
  add(f, nav, { fillW: true });
  topBorder(nav);
  const NAV = [["dashboard", "Übersicht", true, "uebersicht"], ["columns", "Semester", false, "semester"], [null, null, false, "dialog"], ["list", "Module", false, "module"], ["sliders", "Struktur", false, "struktur"]];
  for (const [icon, lbl, act, dest] of NAV) {
    if (!icon) {
      const fab = AL("HORIZONTAL", { name: "Modul hinzufügen", radius: 999, fill: "bg/inverse", justify: "CENTER", align: "CENTER", w: 48, h: 48 });
      fab.appendChild(I("plus", "text/inverse", 20));
      nav.appendChild(fab);
      links.push([fab, dest]);
      continue;
    }
    const it = AL("VERTICAL", { name: lbl, gap: 4, align: "CENTER", w: 64 });
    it.appendChild(I(icon, act ? "text/primary" : "text/tertiary", 20));
    it.appendChild(await T(lbl, "Label/S", act ? "text/primary" : "text/tertiary"));
    nav.appendChild(it);
    links.push([it, dest]);
  }
  return f;
}

// ---------------------------------------------------------------------
// Seite 01 · Konzept & Recherche
// ---------------------------------------------------------------------
async function docFrame(name, kicker, title, lead) {
  const f = AL("VERTICAL", { name, gap: 40, p: 64, fill: "bg/surface", w: 1440, radius: 24 });
  const h = AL("VERTICAL", { gap: 10 });
  add(f, h, { fillW: true });
  h.appendChild(await T(kicker, "Label/XS Caps", "text/tertiary"));
  h.appendChild(await T(title, "Display/XL"));
  if (lead) h.appendChild(await T(lead, "Body/M", "text/secondary", { w: 880 }));
  return f;
}
async function bullet(parent, icon, color, text, o = {}) {
  const r = AL("HORIZONTAL", { gap: 10, align: "MIN" });
  add(parent, r, { fillW: true });
  const holder = AL("HORIZONTAL", { pt: 2 });
  holder.appendChild(I(icon, color));
  r.appendChild(holder);
  add(r, await T(text, o.style || "Body/M", o.color || "text/primary"), { fillW: true });
  return r;
}
async function buildResearch() {
  const f = await docFrame("K1 · Recherche", "Recherche · Studien- und Prüfungspläne der TU Darmstadt",
    "So ist ein Studium an der TU aufgebaut",
    "Grundlage: die offiziellen Studienpläne (Satzungsbeilagen) für B.Sc. Informatik, M.Sc. Informatik und B.Sc. Maschinenbau sowie die Allgemeinen Prüfungsbestimmungen (APB). Ergebnis: Für das Zählen von Credit Points braucht es nur zwei der fünf Ebenen.");
  const row = AL("HORIZONTAL", { gap: 48, align: "MIN" });
  add(f, row, { fillW: true });

  // Hierarchie
  const left = AL("VERTICAL", { name: "Hierarchie", gap: 10, w: 640 });
  row.appendChild(left);
  left.appendChild(await T("Die Ebenen – und was wir davon brauchen", "Heading/H3"));
  const LEVELS = [
    ["1", "Studiengang & Prüfungsordnung", "B.Sc. = 180 CP in 6 Semestern · M.Sc. = 120 CP in 4 Semestern", "Neutral", "Wird zur Vorlage"],
    ["2", "Bereich", "Pflicht-, Wahlpflicht-, Wahlbereich, Studium Generale, Abschlussarbeit – jeweils mit CP-Spanne", "Success", "Kern"],
    ["3", "Teilbereich / Katalog", "„davon 9–18 CP Studienbegleitende Leistungen“, „je mind. 6 CP aus Theorie“", "Info", "Optional · 1 Ebene"],
    ["4", "Modul", "Bekommt die Credit Points – z. B. „Algorithmen und Datenstrukturen“, 10 CP", "Success", "Kern"],
    ["5", "Lehrveranstaltung & Leistung", "Vorlesung, Übung, Seminar · Fachprüfung (benotet), Studienleistung (meist unbenotet)", "Neutral", "Nur als Status"],
  ];
  for (const [n, title, desc, tone, verdict] of LEVELS) {
    const indent = (parseInt(n, 10) - 1) * 24;
    const wrap = AL("HORIZONTAL", { pl: indent });
    add(left, wrap, { fillW: true });
    const isModule = n === "4";
    const box = AL("HORIZONTAL", { name: `Ebene ${n}`, gap: 14, p: 16, radius: 12, align: "CENTER", fill: isModule ? "bg/surface" : "bg/subtle", stroke: isModule ? "text/primary" : null, strokeWeight: 1.5 });
    add(wrap, box, { fillW: true });
    const num = AL("HORIZONTAL", { radius: 999, fill: isModule ? "bg/inverse" : "bg/surface", justify: "CENTER", align: "CENTER", w: 28, h: 28 });
    num.appendChild(await T(n, "Label/S", isModule ? "text/inverse" : "text/primary"));
    box.appendChild(num);
    const t = AL("VERTICAL", { gap: 2 });
    add(box, t, { fillW: true });
    t.appendChild(await T(title, "Heading/H3"));
    add(t, await T(desc, "Body/S", "text/secondary"), { fillW: true });
    box.appendChild(badge(tone, verdict));
  }
  const star = AL("HORIZONTAL", { gap: 8, align: "CENTER", pl: 72 });
  left.appendChild(star);
  star.appendChild(I("arrow-right", "text/primary"));
  star.appendChild(await T("Credit Points entstehen auf Ebene 4 – alles darunter ist für die Zählung egal.", "Body/M Strong"));

  // Tabelle der Studiengänge
  const right = AL("VERTICAL", { name: "Studiengänge", gap: 16 });
  add(row, right, { fillW: true });
  right.appendChild(await T("Drei Ordnungen im Vergleich", "Heading/H3"));
  const PROGS = [
    ["B.Sc. Informatik", "180 CP", "Satzungsbeilage 2023_II · gültig ab 01.10.2023", [
      ["area/pflicht", "Pflichtbereich", "114 CP", 0], ["area/wahl", "Wahlbereich", "48–49 CP", 0],
      [null, "davon Wahlpflicht-Katalog", "10–35 CP", 1], [null, "davon Fachprüfungen", "5–30 CP", 1], [null, "davon Studienbegleitende Leistungen", "9–18 CP", 1],
      ["area/generale", "Studium Generale", "5–6 CP", 0], ["area/thesis", "Bachelorarbeit", "12 CP", 0]]],
    ["M.Sc. Informatik", "120 CP", "Satzungsbeilage 2023_IV · gültig ab 01.10.2023", [
      ["area/pflicht", "Individuelle Vertiefung", "66–72 CP", 0],
      [null, "davon Basis-Wahlbereiche (je ≥ 6 CP SW/HW und Theorie)", "12–57 CP", 1], [null, "davon Wahlbereiche KI · Sicherheit · Netze", "6–51 CP", 1], [null, "davon Studienbegleitende Leistungen", "9–18 CP", 1],
      ["area/generale", "Studium Generale", "18–24 CP", 0], ["area/thesis", "Master-Thesis", "30 CP", 0]]],
    ["B.Sc. Maschinenbau – Sustainable Eng.", "180 CP", "Satzungsbeilage 2024_VIII · gültig ab 01.12.2024", [
      ["area/pflicht", "Pflichtbereich", "146 CP", 0], [null, "davon Praktika / Projekte", "14 CP", 1],
      ["area/wahl", "Wahlpflichtbereich", "16–19 CP", 0], ["area/generale", "Studium Generale", "3–6 CP", 0], ["area/thesis", "Bachelor-Thesis", "12 CP", 0]]],
  ];
  for (const [name, total, src, rows] of PROGS) {
    const c = AL("VERTICAL", { name, gap: 8, p: 18, radius: 12, fill: "bg/subtle" });
    add(right, c, { fillW: true });
    const h = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
    add(c, h, { fillW: true });
    h.appendChild(await T(name, "Heading/H3"));
    spacer(h);
    h.appendChild(badge("Neutral", total));
    c.appendChild(await T(src, "Label/S", "text/tertiary"));
    for (const [col, lbl, val, lvl] of rows) {
      const r = AL("HORIZONTAL", { gap: 8, align: "CENTER", pl: lvl ? 18 : 0 });
      add(c, r, { fillW: true });
      if (col) r.appendChild(swatch(col, 8, 2));
      else r.appendChild(await T("↳", "Body/S", "text/tertiary"));
      r.appendChild(await T(lbl, lvl ? "Body/S" : "Body/M", lvl ? "text/secondary" : "text/primary"));
      spacer(r);
      r.appendChild(await T(val, lvl ? "Label/S" : "Body/M Strong", lvl ? "text/secondary" : "text/primary"));
    }
  }

  // Erkenntnisse
  const fs = AL("HORIZONTAL", { name: "Erkenntnisse", gap: 16 });
  add(f, fs, { fillW: true });
  const FINDINGS = [
    ["target", "CP gibt es pro Modul", "Erst wenn alle Prüfungs- und Studienleistungen eines Moduls erbracht sind, werden seine Credit Points gutgeschrieben. Vorlesung vs. Übung ist für die Zählung egal."],
    ["sliders", "Bereiche haben Spannen", "Wahlbereiche wie „10–35 CP“ werden gegeneinander verrechnet. Am Ende muss die Summe genau 180 bzw. 120 CP ergeben."],
    ["layers", "„davon“-Regeln", "Unterbedingungen innerhalb eines Bereichs, z. B. „davon 9–18 CP Studienbegleitende Leistungen“. Eine Ebene reicht für alle drei Ordnungen."],
    ["calendar", "Richtwert 30 CP / Semester", "Die Pläne verteilen Module auf Semester (Vollzeit 30, Teilzeit ca. 20 CP). Studis denken in Semestern – der alte Planer kannte keine."],
  ];
  for (const [icon, title, text] of FINDINGS) {
    const c = AL("VERTICAL", { name: title, gap: 10, p: 20, radius: 14, stroke: "border/default" });
    add(fs, c, { fillW: true });
    const ic = AL("HORIZONTAL", { radius: 10, fill: "bg/subtle", justify: "CENTER", align: "CENTER", w: 36, h: 36 });
    ic.appendChild(I(icon, "text/primary", 18));
    c.appendChild(ic);
    c.appendChild(await T(title, "Heading/H3"));
    add(c, await T(text, "Body/S", "text/secondary"), { fillW: true });
  }
  return f;
}
async function buildModel() {
  const f = await docFrame("K2 · Modell vorher/nachher", "Modell", "Von drei Kisten-Ebenen zu einer flachen Modulliste",
    "Der aktuelle Planer bildet Section → Subsection → Event ab und verlangt Constraints auf jeder Ebene. Das neue Modell hat nur Bereiche und Module – Teilbereiche sind Etiketten für „davon“-Regeln.");
  const row = AL("HORIZONTAL", { gap: 24, align: "MIN" });
  add(f, row, { fillW: true });

  // Heute
  const old = AL("VERTICAL", { name: "Heute", gap: 16, p: 24, radius: 16, fill: "bg/subtle" });
  add(row, old, { fillW: true });
  const oh = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  old.appendChild(oh);
  oh.appendChild(badge("Danger", "Heute"));
  oh.appendChild(await T("Template-Modus + Filling-Modus", "Heading/H3"));
  const sec = AL("VERTICAL", { name: "Section", gap: 10, p: 14, radius: 12, fill: "bg/surface", stroke: "border/strong" });
  add(old, sec, { fillW: true });
  const secH = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  add(sec, secH, { fillW: true });
  secH.appendChild(await T("Section „Core“", "Body/M Strong"));
  spacer(secH);
  secH.appendChild(badge("Neutral", "min 12 · max 18"));
  const subs = AL("VERTICAL", { name: "Subsection", gap: 8, p: 12, radius: 10, fill: "bg/subtle", stroke: "border/default" });
  add(sec, subs, { fillW: true });
  const subH = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  add(subs, subH, { fillW: true });
  subH.appendChild(await T("Subsection „Math“", "Body/M Strong"));
  spacer(subH);
  subH.appendChild(badge("Neutral", "min 6 · max 9"));
  for (const [t, cp] of [["Event 1", "5"], ["Event 2", "4"]]) {
    const ev = AL("HORIZONTAL", { name: "Event", gap: 8, p: 10, radius: 8, fill: "bg/surface", stroke: "border/default", align: "CENTER" });
    add(subs, ev, { fillW: true });
    add(ev, await T(t, "Body/S"), { fillW: true });
    ev.appendChild(await T(`Credits ${cp}`, "Label/S", "text/secondary"));
    ev.appendChild(await T("☐ pending", "Label/S", "text/secondary"));
  }
  for (const p of ["Drei Verschachtelungsebenen mit Eingabefeldern auf jeder Ebene", "Min/Max-Constraints an Section und Subsection – doppelt zu pflegen", "Kein Semester, keine Note, kein Gesamtüberblick", "Struktur bauen und Module eintragen sind zwei getrennte Modi"]) {
    await bullet(old, "x", "status/danger", p, { style: "Body/S" });
  }

  const arrow = AL("VERTICAL", { justify: "CENTER", align: "CENTER", w: 40, h: 300 });
  arrow.appendChild(I("arrow-right", "text/tertiary", 24));
  row.appendChild(arrow);

  // Neu
  const neu = AL("VERTICAL", { name: "Neu", gap: 16, p: 24, radius: 16, fill: "bg/surface", stroke: "text/primary", strokeWeight: 1.5 });
  add(row, neu, { fillW: true });
  const nh = AL("HORIZONTAL", { gap: 8, align: "CENTER" });
  neu.appendChild(nh);
  nh.appendChild(badge("Success", "Neu"));
  nh.appendChild(await T("Bereiche + Module", "Heading/H3"));
  const tags = AL("HORIZONTAL", { gap: 6, wrap: true, w: 560 });
  neu.appendChild(tags);
  for (const a of AREAS) tags.appendChild(tag(a.key, `${a.name} · ${rng(a)}`));
  neu.appendChild(await T("↓ jedes Modul gehört zu genau einem Bereich (optional mit Teilbereich)", "Label/S", "text/tertiary"));
  const tbl = AL("VERTICAL", { name: "Module", radius: 10, stroke: "border/default", clip: true });
  add(neu, tbl, { fillW: true });
  for (const m of [MODS[5], MODS[24], MODS[28], MODS[26]]) {
    const r = AL("HORIZONTAL", { gap: 10, px: 12, py: 9, align: "CENTER" });
    add(tbl, r, { fillW: true });
    bottomBorder(r);
    r.appendChild(statusIcon(STATUS_NAME[m.status]));
    r.appendChild(swatch(A[m.area].color, 8, 2));
    add(r, await T(m.title, "Body/S"), { fillW: true });
    r.appendChild(await T(m.sem ? SEM[m.sem][0] : "—", "Label/S", "text/secondary"));
    r.appendChild(await T(`${m.cp} CP`, "Label/S"));
  }
  tbl.children[tbl.children.length - 1].strokes = [];
  for (const p of ["Eine Liste von Modulen – die einzige Ebene, die man befüllt", "CP-Spanne nur am Bereich, „davon“-Regeln als Teilbereiche", "Semester, Status und Note direkt am Modul", "Vorlage wählen statt Struktur bauen – bearbeiten nur bei Bedarf"]) {
    await bullet(neu, "check", "status/success", p, { style: "Body/S" });
  }

  // Zuordnung alt → neu
  const map = AL("VERTICAL", { name: "Zuordnung", radius: 14, stroke: "border/default", clip: true });
  add(f, map, { fillW: true });
  const MAP = [
    ["Alt", "Neu", true],
    ["Section (min/max)", "Bereich – mit Farbe und CP-Spanne"],
    ["Subsection (min/max)", "Teilbereich (optional) – nur für „davon“-Regeln, max. eine Ebene"],
    ["Event (title, credits)", "Modul (Titel, CP, Bereich, Semester, Status, Note)"],
    ["pending ☐", "Status: geplant · läuft · bestanden · nicht bestanden"],
    ["Template-Modus / Filling-Modus", "Vorlage beim Start wählen + Seite „Struktur“ für Ausnahmen"],
    ["Template-Export / Values-Export", "Ein Export – Plan inkl. Struktur. Alte Dateien werden beim Import umgewandelt"],
    ["—", "Neu: Semesterplan, Merkzettel, Notenschnitt, „Nächste Schritte“"],
  ];
  for (const [o, n, head] of MAP) {
    const r = AL("HORIZONTAL", { gap: 24, px: 20, py: 12, align: "CENTER", fill: head ? "bg/subtle" : null });
    add(map, r, { fillW: true });
    bottomBorder(r);
    r.appendChild(await T(o, head ? "Label/XS Caps" : "Body/M", head ? "text/tertiary" : "text/secondary", { w: 360 }));
    if (head) { const b = figma.createFrame(); b.name = "Platzhalter"; b.fills = []; b.resize(16, 1); r.appendChild(b); } else r.appendChild(I("arrow-right", "text/tertiary"));
    add(r, await T(n, head ? "Label/XS Caps" : "Body/M Strong", head ? "text/tertiary" : "text/primary"), { fillW: true });
  }
  map.children[map.children.length - 1].strokes = [];
  return f;
}
async function buildPrinciples() {
  const f = await docFrame("K3 · Prinzipien & Struktur", "Prinzipien", "Fünf Regeln für das neue Design", null);
  const row = AL("HORIZONTAL", { name: "Prinzipien", gap: 16 });
  add(f, row, { fillW: true });
  const PR = [
    ["Module sind die Atome", "Alles, was du einträgst, ist ein Modul. Keine Events, Vorlesungen oder Prüfungen einzeln."],
    ["Zwei Ebenen statt vier", "Bereich → Modul. Teilbereiche sind Etiketten, keine weiteren Kisten zum Aufklappen."],
    ["Spannen sichtbar machen", "Jeder Bereich zeigt Zielkorridor, Stand und Lücke auf einem einzigen Balken."],
    ["Status statt Häkchen", "geplant → läuft → bestanden. Die Füllung der Karte verrät den Stand auf einen Blick."],
    ["Vorlage statt Baukasten", "Prüfungsordnung auswählen, fertig. Die Struktur bearbeitet man nur in Ausnahmefällen."],
  ];
  for (let i = 0; i < PR.length; i++) {
    const c = AL("VERTICAL", { name: PR[i][0], gap: 10, p: 20, radius: 14, fill: "bg/subtle" });
    add(row, c, { fillW: true });
    c.appendChild(await T(String(i + 1).padStart(2, "0"), "Numeric/L", "text/tertiary"));
    add(c, await T(PR[i][0], "Heading/H3"), { fillW: true });
    add(c, await T(PR[i][1], "Body/S", "text/secondary"), { fillW: true });
  }

  // Informationsarchitektur
  const ia = AL("VERTICAL", { name: "Informationsarchitektur", gap: 16 });
  add(f, ia, { fillW: true });
  ia.appendChild(await T("Informationsarchitektur", "Heading/H2"));
  ia.appendChild(await T("Drei Blickwinkel auf dieselben Module – plus ein Dialog, der überall erreichbar ist.", "Body/M", "text/secondary"));
  const flow = AL("HORIZONTAL", { gap: 16, align: "CENTER" });
  add(ia, flow, { fillW: true });
  const box = async (title, desc, o = {}) => {
    const b = AL("VERTICAL", { name: title, gap: 4, p: 16, radius: 12, fill: o.fill || "bg/surface", stroke: o.stroke || "border/default", dash: o.dash, w: o.w || 220 });
    b.appendChild(await T(title, "Body/M Strong"));
    add(b, await T(desc, "Body/S", "text/secondary"), { fillW: true });
    return b;
  };
  flow.appendChild(await box("Onboarding", "Studiengang & PO wählen oder Datei importieren"));
  flow.appendChild(I("arrow-right", "text/tertiary", 20));
  const views = AL("VERTICAL", { name: "Hauptansichten", gap: 10, p: 14, radius: 14, fill: "bg/subtle" });
  flow.appendChild(views);
  views.appendChild(await T("Tabs", "Label/XS Caps", "text/tertiary"));
  const vr = AL("HORIZONTAL", { gap: 10 });
  views.appendChild(vr);
  vr.appendChild(await box("Übersicht", "Wo stehe ich? Was fehlt?", { w: 190 }));
  vr.appendChild(await box("Semesterplan", "Wann mache ich was?", { w: 190 }));
  vr.appendChild(await box("Module", "Alles bearbeiten, filtern, suchen", { w: 190 }));
  flow.appendChild(I("arrow-right", "text/tertiary", 20));
  const side = AL("VERTICAL", { gap: 10 });
  flow.appendChild(side);
  side.appendChild(await box("Modul hinzufügen", "Dialog, aus jeder Ansicht erreichbar", { fill: "bg/inverse", stroke: "bg/inverse" }));
  side.children[0].children.forEach((t) => (t.fills = [P("text/inverse")]));
  side.appendChild(await box("Struktur", "Bereiche & Regeln – nur in Ausnahmefällen", { dash: [5, 4], stroke: "border/strong" }));

  // Visuelle Sprache
  const vis = AL("VERTICAL", { name: "Visuelle Sprache", gap: 16 });
  add(f, vis, { fillW: true });
  vis.appendChild(await T("Visuelle Sprache", "Heading/H2"));
  const vrow = AL("HORIZONTAL", { gap: 24, align: "MIN" });
  add(vis, vrow, { fillW: true });
  const c1 = AL("VERTICAL", { name: "Farbe = Bereich", gap: 10, p: 20, radius: 14, stroke: "border/default" });
  add(vrow, c1, { fillW: true });
  c1.appendChild(await T("Farbe = Bereich", "Heading/H3"));
  add(c1, await T("Wie in den offiziellen Studienplänen der TU – Studis erkennen das Schema wieder.", "Body/S", "text/secondary"), { fillW: true });
  const tg = AL("HORIZONTAL", { gap: 6, wrap: true, w: 380 });
  c1.appendChild(tg);
  for (const a of AREAS) tg.appendChild(tag(a.key, a.name));
  const c2 = AL("VERTICAL", { name: "Füllung = Status", gap: 10, p: 20, radius: 14, stroke: "border/default" });
  add(vrow, c2, { fillW: true });
  c2.appendChild(await T("Füllung = Status", "Heading/H3"));
  add(c2, await T("Weiß bestanden · getönt läuft · gestrichelt geplant.", "Body/S", "text/secondary"), { fillW: true });
  const cr = AL("VERTICAL", { gap: 8 });
  add(c2, cr, { fillW: true });
  for (const m of [MODS[5], MODS[24], MODS[28]]) add(cr, mcard(m), { fillW: true });
  const c3 = AL("VERTICAL", { name: "Balken = Spanne", gap: 10, p: 20, radius: 14, stroke: "border/default" });
  add(vrow, c3, { fillW: true });
  c3.appendChild(await T("Balken = Spanne", "Heading/H3"));
  add(c3, await T("Getönter Korridor = erlaubter Bereich (min–max). Striche markieren die Grenzen. Segmente zeigen bestanden, läuft und geplant.", "Body/S", "text/secondary"), { fillW: true });
  const ws = areaStats("W");
  c3.appendChild(await rangeBar({ w: 360, h: 12, scale: Math.ceil(49 * 1.15), min: 48, max: 49, color: "area/wahl", segs: segsOf(ws), label: true }));
  const lg = AL("HORIZONTAL", { gap: 12, wrap: true, w: 360 });
  c3.appendChild(lg);
  for (const [lbl, o] of [["bestanden", 1], ["läuft", 0.5], ["geplant", 0.22], ["Zielkorridor", 0.16]]) {
    const it = AL("HORIZONTAL", { gap: 6, align: "CENTER" });
    it.appendChild(swatch("area/wahl", 10, 2, o));
    it.appendChild(await T(lbl, "Label/S", "text/secondary"));
    lg.appendChild(it);
  }
  return f;
}
async function buildDataModel() {
  const f = await docFrame("K4 · Datenmodell", "Für die spätere Umsetzung", "Datenmodell-Entwurf",
    "Ersetzt PlannerTemplateV1 / FilledPlanBundleV1. Eine Datei enthält Struktur und Module; alte Exporte lassen sich verlustfrei umwandeln (Section → Area, Subsection → SubArea, Event → Module, pending → status).");
  const row = AL("HORIZONTAL", { gap: 24, align: "MIN" });
  add(f, row, { fillW: true });
  const code = AL("VERTICAL", { name: "Code", p: 24, radius: 14, fill: "bg/inverse" });
  add(row, code, { fillW: true });
  const SRC = [
    "type Plan = {",
    "  version: 2;",
    "  program: { name: string; regulation: string; totalCredits: number };",
    "  areas: Area[];",
    "  modules: Module[];",
    "};",
    "",
    "type Area = {",
    "  id: string;",
    "  name: string;               // „Wahlbereich“",
    "  color: AreaColor;",
    "  minCredits: number;         // 48",
    "  maxCredits: number;         // 49",
    "  subAreas?: SubArea[];       // max. eine Ebene",
    "};",
    "",
    "type SubArea = { id: string; name: string; minCredits?: number; maxCredits?: number };",
    "",
    "type Module = {",
    "  id: string;",
    "  title: string;",
    "  credits: number;",
    "  areaId: string;",
    "  subAreaId?: string;",
    "  semester?: number;          // leer = Merkzettel",
    '  status: "planned" | "enrolled" | "passed" | "failed";',
    "  grade?: number;             // 1.0 – 4.0, nur wenn passed",
    "};",
  ].join("\n");
  const ct = await T(SRC, "Code/S", "text/inverse", { name: "Datenmodell", w: 760 });
  code.appendChild(ct);
  const notes = AL("VERTICAL", { name: "Regeln", gap: 12, w: 460 });
  row.appendChild(notes);
  notes.appendChild(await T("Abgeleitete Werte (nicht gespeichert)", "Heading/H3"));
  for (const t of [
    "Bereichsstand = Summe der CP seiner Module, getrennt nach Status",
    "Bereichszustand: Erfüllt (bestanden ≥ min) · Vollständig geplant (geplant ≥ min) · Lücke (< min) · Über Maximum (> max)",
    "Teilbereich-Regeln werden genauso geprüft, nur über Module mit passender subAreaId",
    "Merkzettel-Module (ohne Semester) zählen nicht zum Plan",
    "Notenschnitt = CP-gewichteter Mittelwert benoteter, bestandener Module (Schätzung)",
    "Semesterlast = Summe der CP pro Semester, Richtwert 30 (Vollzeit) oder 20 (Teilzeit)",
  ]) await bullet(notes, "check", "text/secondary", t, { style: "Body/S", color: "text/secondary" });
  return f;
}

// ---------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------
async function getPage(name) {
  let page = figma.root.children.find((p) => p.name === name);
  if (!page) {
    page = figma.createPage();
    page.name = name;
  }
  return page;
}
async function clearGenerated(page) {
  await figma.setCurrentPageAsync(page);
  for (const n of [...page.children]) {
    if (n.name === "Komponenten" || n.name.startsWith("SSP · ") || /^(0\d|K\d) · /.test(n.name)) n.remove();
  }
}
function placeRow(nodes, x0, y0, gap) {
  let x = x0;
  for (const n of nodes) {
    n.x = x;
    n.y = y0;
    x += n.width + gap;
  }
}
async function step(name, fn) {
  try {
    const r = await fn();
    LOG.push("✓ " + name);
    return r;
  } catch (e) {
    LOG.push("✗ " + name + ": " + (e && e.message ? e.message : e));
    console.error("[SSP] " + name, e);
    return null;
  }
}

async function main() {
  await Promise.all(
    [["Geist", "Regular"], ["Geist", "Medium"], ["Geist", "SemiBold"], ["Geist", "Bold"], ["Geist Mono", "Regular"], ["Inter", "Regular"]].map(([family, style]) =>
      figma.loadFontAsync({ family, style })
    )
  );
  await setupFoundations();

  const pKonzept = await getPage(PAGES.konzept);
  const pScreens = await getPage(PAGES.screens);
  const pComps = await getPage(PAGES.comps);
  // Reihenfolge der Seiten sicherstellen
  figma.root.insertChild(0, pKonzept);
  figma.root.insertChild(1, pScreens);
  figma.root.insertChild(2, pComps);

  await clearGenerated(pScreens);
  await clearGenerated(pKonzept);
  await clearGenerated(pComps);

  await figma.setCurrentPageAsync(pComps);
  const compRoot = await buildComponents(pComps);
  if (!compRoot) throw new Error("Komponenten konnten nicht erstellt werden");

  await figma.setCurrentPageAsync(pKonzept);
  const docs = [];
  for (const [name, fn] of [["Recherche", buildResearch], ["Modell", buildModel], ["Prinzipien", buildPrinciples], ["Datenmodell", buildDataModel]]) {
    const d = await step(name, fn);
    if (d) docs.push(d);
  }
  let y = 0;
  for (const d of docs) {
    d.x = 0;
    d.y = y;
    y += d.height + 80;
  }

  await figma.setCurrentPageAsync(pScreens);
  const links = [];
  const S = {};
  S.onboarding = await step("Onboarding", () => buildOnboarding(links));
  S.uebersicht = await step("Übersicht", () => buildOverview(links));
  S.semester = await step("Semesterplan", () => buildSemester(links));
  S.module = await step("Module", () => buildModules(links));
  S.dialog = S.module ? await step("Dialog", () => buildDialog(S.module, links)) : null;
  S.struktur = await step("Struktur", () => buildStructure(links));
  S.mobil = await step("Mobil", () => buildMobile(links));
  placeRow([S.onboarding, S.uebersicht, S.semester, S.mobil].filter(Boolean), 0, 0, 160);
  const row1H = Math.max(...[S.onboarding, S.uebersicht, S.semester, S.mobil].filter(Boolean).map((n) => n.height));
  placeRow([S.module, S.dialog, S.struktur].filter(Boolean), 0, row1H + 200, 160);

  await step("Prototyp-Verknüpfungen", async () => {
    for (const [node, dest] of links) {
      const target = S[dest];
      if (!target || !node || node.removed) continue;
      await node.setReactionsAsync([
        { trigger: { type: "ON_CLICK" }, actions: [{ type: "NODE", destinationId: target.id, navigation: "NAVIGATE", transition: null, preserveScrollPosition: false }] },
      ]);
    }
    if (S.onboarding) pScreens.flowStartingPoints = [{ nodeId: S.onboarding.id, name: "SSP Redesign" }];
  });

  figma.viewport.scrollAndZoomIntoView([S.uebersicht || S.onboarding].filter(Boolean));
}

main()
  .then(() => {
    const failed = LOG.filter((l) => l.startsWith("✗"));
    console.log("[SSP] " + LOG.join("\n"));
    if (failed.length) figma.closePlugin("SSP: fertig mit " + failed.length + " Fehler(n) – siehe Konsole. " + failed[0]);
    else figma.closePlugin("SSP Redesign erstellt ✓  (Konzept · Screens · Komponenten)");
  })
  .catch((e) => {
    console.error("[SSP]", e);
    figma.closePlugin("SSP-Fehler: " + (e && e.message ? e.message : e));
  });
