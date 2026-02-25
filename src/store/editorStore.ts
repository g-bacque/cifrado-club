// src/store/editorStore.ts
import { create } from "zustand";
export interface SavedProject {
  id: string;          // id del guardado (slot)
  title: string;
  updatedAt: number;
  data: {
    project: Project;
    beatsPerBar: number;
    currentSectionId: string;
    showDurationControls: boolean;
  };
}

const STORAGE_KEY = "cifrado_projects_v1";

function loadAllSaved(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllSaved(items: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
/** Cada acorde ocupa un número de slots dentro del compás */
export interface ChordEvent {
  chord: string;
  slots: number;
}

/**
 * Un compás puede:
 * - usar el compás global (beatsPerBar) si beats es undefined
 * - tener un override propio si beats tiene valor
 */
export interface Bar {
  beats?: number; // override opcional (ej: 3 para 3/4)
  chords: ChordEvent[];
}

export interface Section {
  id: string;
  name: string;
  bars: Bar[];
}

export interface Project {
  id: string;
  title: string;
  key: string;
  tempo: number;
  sections: Section[];
}

/**
 * Ajusta un compás para que la suma de slots sea exactamente "beats".
 * - Mantiene mínimo 1 slot por acorde
 * - Si hay exceso, recorta desde el final sin bajar de 1
 * - Si falta, añade al último acorde
 * - Si hay demasiados acordes para el número de beats, fusiona acordes desde el final
 */
function resizeBarToBeats(bar: Bar, beats: number): Bar {
  const chords = (bar.chords ?? []).map((c) => ({
    ...c,
    slots: Math.max(1, Number.isFinite(c.slots) ? c.slots : 1),
  }));

  // si el compás quedara vacío, garantizamos 1 acorde
  if (chords.length === 0) chords.push({ chord: "", slots: beats });

  // Si hay más acordes que beats, fusionamos desde el final
  while (chords.length > beats) {
    const last = chords.pop()!;
    chords[chords.length - 1].slots += last.slots;
  }

  // total actual
  let total = chords.reduce((s, c) => s + c.slots, 0);

  // Si sobra, recortar desde el final sin bajar de 1
  if (total > beats) {
    let extra = total - beats;

    for (let i = chords.length - 1; i >= 0 && extra > 0; i--) {
      const reducible = chords[i].slots - 1;
      const take = Math.min(reducible, extra);
      chords[i].slots -= take;
      extra -= take;
    }

    // Caso extremo: aún sobra y ya no se puede recortar (todos en 1)
    // Fusionamos hasta que quepa.
    while (extra > 0 && chords.length > 1) {
      const last = chords.pop()!;
      chords[chords.length - 1].slots += last.slots;

      total = chords.reduce((s, c) => s + c.slots, 0);
      extra = total - beats;
    }
  }

  // Si falta, sumar al último acorde
  total = chords.reduce((s, c) => s + c.slots, 0);
  if (total < beats) {
    chords[chords.length - 1].slots += beats - total;
  }

  return { ...bar, chords };
}

function clampBeats(beats: number, min = 1, max = 12) {
  const n = Math.round(beats);
  return Math.max(min, Math.min(n, max));
}

function uid(prefix: string) {
  // crypto.randomUUID en browsers modernos
  // fallback si no existe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyCrypto = (globalThis as any).crypto;
  if (anyCrypto?.randomUUID) return `${prefix}_${anyCrypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Deep clone seguro para no compartir referencias */
function cloneBar(bar: Bar): Bar {
  return {
    beats: bar.beats,
    chords: (bar.chords ?? []).map((c) => ({
      chord: c.chord,
      slots: c.slots,
    })),
  };
}

function cloneSection(section: Section): Section {
  return {
    id: uid("sec"),
    name: `${section.name} copy`,
    bars: section.bars.map(cloneBar),
  };
}

interface EditorState {
  project: Project;
  currentSectionId: string;

  /**
   * OJO: este flag ahora lo estás usando como Modo Edit/Print.
   * true = Edit (muestra controles), false = Print (oculta controles)
   */
  showDurationControls: boolean;

  /** Compás global por defecto (3 = 3/4, 4 = 4/4, etc.) */
  beatsPerBar: number;
    // persistencia local
  activeSaveId: string | null;
  savedProjects: SavedProject[];

  refreshSavedProjects: () => void;

  saveProject: () => void;                 // guarda sobre activeSaveId, o crea si null
  saveProjectAs: (title?: string) => void; // siempre crea un nuevo slot
  loadProject: (saveId: string) => void;
  deleteSavedProject: (saveId: string) => void;

  newProject: () => void;

  lastSavedSnapshot: string | null;
isDirty: () => boolean;
markSaved: () => void;

  // setters básicos
  setProject: (project: Project) => void;
  setCurrentSectionId: (id: string) => void;
  setProjectTitle: (title: string) => void;

  toggleDurationControls: () => void;

  // compás global
  setBeatsPerBar: (beats: number) => void;

  // compás por compás
  setBarBeats: (sectionId: string, barIndex: number, beats: number | null) => void;

  // acordes
  updateChord: (
    sectionId: string,
    barIndex: number,
    chordIndex: number,
    chord: string
  ) => void;

  // compases
  addEmptyBarAtEnd: (sectionId: string) => void;
  ensureNextBar: (sectionId: string, barIndex: number) => void;
  deleteLastBar: (sectionId: string) => void;
  insertBarAfter: (sectionId: string, barIndex: number) => void;
  moveBar: (sectionId: string, fromIndex: number, toIndex: number) => void;

  /** ✅ NUEVO: duplicar compás */
  duplicateBar: (sectionId: string, barIndex: number) => void;

  // secciones
  addSection: () => void;
  renameSection: (sectionId: string, name: string) => void;

  /** ✅ NUEVO: duplicar sección */
  duplicateSection: (sectionId: string) => void;
}

export const useEditorStore = create<EditorState>((set, get ) => ({
  beatsPerBar: 4,
  lastSavedSnapshot: null,

  project: {
    id: "1",
    title: "Untitled Song",
    key: "C Major",
    tempo: 120,
    sections: [
      {
        id: "sec1",
        name: "A",
        bars: [{ chords: [{ chord: "", slots: 4 }] }], // sin override beats
      },
    ],
  },

  currentSectionId: "sec1",

  showDurationControls: true,

  activeSaveId: null,
  savedProjects: loadAllSaved(),

  setProject: (project) => set({ project }),

  setCurrentSectionId: (id) => set({ currentSectionId: id }),

  setProjectTitle: (title) => {
    const project = get().project;
    set({ project: { ...project, title } });
  },

  toggleDurationControls: () =>
    set((state) => ({ showDurationControls: !state.showDurationControls })),

  /**
   * Cambia el compás global. Importante:
   * - No pisa los compases con override (bar.beats definido).
   * - Sí reajusta los compases “normales” para que encajen al nuevo beats.
   */
  setBeatsPerBar: (beats) => {
    const safeBeats = clampBeats(beats, 1, 12);
    const project = get().project;

    const sections = project.sections.map((sec) => ({
      ...sec,
      bars: sec.bars.map((bar) => {
        if (bar.beats != null) {
          // respeta override (pero lo re-normalizamos con su propio beats por seguridad)
          return resizeBarToBeats(bar, clampBeats(bar.beats, 1, 12));
        }
        return resizeBarToBeats(bar, safeBeats);
      }),
    }));

    set({
      beatsPerBar: safeBeats,
      project: { ...project, sections },
    });
  },

  /**
   * Override de compás por compás:
   * - beats = number => fija beats en ese compás y reajusta slots
   * - beats = null => elimina override y vuelve al compás global
   */
  setBarBeats: (sectionId, barIndex, beats) => {
    const project = get().project;
    const globalBeats = get().beatsPerBar;

    const nextOverride = beats == null ? undefined : clampBeats(beats, 1, 12);
    const effective = nextOverride ?? globalBeats;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = sec.bars.map((bar, idx) => {
        if (idx !== barIndex) return bar;

        const updated: Bar = { ...bar, beats: nextOverride };
        return resizeBarToBeats(updated, effective);
      });

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  updateChord: (sectionId, barIndex, chordIndex, chord) => {
    const project = get().project;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = sec.bars.map((bar, bIdx) => {
        if (bIdx !== barIndex) return bar;

        const chords = bar.chords.map((c, cIdx) =>
          cIdx === chordIndex ? { ...c, chord } : c
        );

        return { ...bar, chords };
      });

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  addEmptyBarAtEnd: (sectionId) => {
    const project = get().project;
    const beats = get().beatsPerBar;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const newBar: Bar = { chords: [{ chord: "", slots: beats }] }; // sin override
      return { ...sec, bars: [...sec.bars, newBar] };
    });

    set({ project: { ...project, sections } });
  },

  ensureNextBar: (sectionId, barIndex) => {
    const project = get().project;
    const beats = get().beatsPerBar;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = [...sec.bars];

      if (!bars[barIndex + 1]) {
        bars.push({ chords: [{ chord: "", slots: beats }] }); // sin override
      }

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  deleteLastBar: (sectionId) => {
    const project = get().project;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      // Nunca borrar si solo queda 1 compás
      if (sec.bars.length <= 1) return sec;

      return { ...sec, bars: sec.bars.slice(0, -1) };
    });

    set({ project: { ...project, sections } });
  },

  /**
   * Inserta un compás “vacío” justo después de barIndex.
   * (sin override, usa beats global)
   */
  insertBarAfter: (sectionId, barIndex) => {
    const project = get().project;
    const beats = get().beatsPerBar;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = [...sec.bars];
      const insertAt = Math.min(Math.max(barIndex + 1, 0), bars.length);

      bars.splice(insertAt, 0, { chords: [{ chord: "", slots: beats }] });

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  /**
   * Mueve un compás de fromIndex a toIndex dentro de una sección.
   * Si dropeas “encima” de otro compás, este método lo reordena.
   */
  moveBar: (sectionId, fromIndex, toIndex) => {
    const project = get().project;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = [...sec.bars];
      if (
        fromIndex < 0 ||
        fromIndex >= bars.length ||
        toIndex < 0 ||
        toIndex >= bars.length ||
        fromIndex === toIndex
      ) {
        return sec;
      }

      const [moved] = bars.splice(fromIndex, 1);
      bars.splice(toIndex, 0, moved);

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  /** ✅ Duplica el compás y lo inserta justo después */
  duplicateBar: (sectionId, barIndex) => {
    const project = get().project;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = [...sec.bars];
      const target = bars[barIndex];
      if (!target) return sec;

      bars.splice(barIndex + 1, 0, cloneBar(target));
      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  addSection: () => {
    const project = get().project;
    const beats = get().beatsPerBar;

    const newSectionId = uid("sec");
    const nextName = String.fromCharCode(65 + project.sections.length); // A, B, C...
    const name =
      nextName >= "A" && nextName <= "Z"
        ? nextName
        : `Section ${project.sections.length + 1}`;

    const newSection: Section = {
      id: newSectionId,
      name,
      bars: [{ chords: [{ chord: "", slots: beats }] }],
    };

    set({
      project: { ...project, sections: [...project.sections, newSection] },
      currentSectionId: newSectionId,
    });
  },

  renameSection: (sectionId, name) => {
    const project = get().project;
    const next = name.trim();
    if (!next) return;

    const sections = project.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, name: next } : sec
    );

    set({ project: { ...project, sections } });
  },

  /** ✅ Duplica una sección completa (con IDs nuevos) y la inserta justo después */
  duplicateSection: (sectionId) => {
    const project = get().project;
    const idx = project.sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;

    const source = project.sections[idx];
    const copy = cloneSection(source);

    const sections = [...project.sections];
    sections.splice(idx + 1, 0, copy);

    set({
      project: { ...project, sections },
      currentSectionId: copy.id,
    });
  },

     refreshSavedProjects: () => {
    set({ savedProjects: loadAllSaved() });
  },

  saveProject: () => {
    const { project, beatsPerBar, currentSectionId, showDurationControls, activeSaveId } = get();

    const now = Date.now();
    const all = loadAllSaved();

    // si no hay slot activo, crea uno nuevo
    const saveId = activeSaveId ?? uid("save");

    const payload: SavedProject = {
      id: saveId,
      title: project.title || "Untitled Song",
      updatedAt: now,
      data: {
        project,
        beatsPerBar,
        currentSectionId,
        showDurationControls,
      },
    };

    const idx = all.findIndex((p) => p.id === saveId);
    if (idx >= 0) all[idx] = payload;
    else all.unshift(payload);

    saveAllSaved(all);

    set({
      activeSaveId: saveId,
      savedProjects: all,
    });
    get().markSaved();
  },

  saveProjectAs: (title) => {
    const { project, beatsPerBar, currentSectionId, showDurationControls } = get();

    const now = Date.now();
    const all = loadAllSaved();

    const saveId = uid("save");
    const payload: SavedProject = {
      id: saveId,
      title: (title?.trim() || project.title || "Untitled Song"),
      updatedAt: now,
      data: {
        project: { ...project, title: (title?.trim() || project.title) },
        beatsPerBar,
        currentSectionId,
        showDurationControls,
      },
    };

    all.unshift(payload);
    saveAllSaved(all);

    set({
      activeSaveId: saveId,
      project: payload.data.project,
      beatsPerBar: payload.data.beatsPerBar,
      currentSectionId: payload.data.currentSectionId,
      showDurationControls: payload.data.showDurationControls,
      savedProjects: all,
    });
    get().markSaved();
  },

  loadProject: (saveId) => {
    const all = loadAllSaved();
    const found = all.find((p) => p.id === saveId);
    if (!found) return;

    set({
      activeSaveId: found.id,
      project: found.data.project,
      beatsPerBar: found.data.beatsPerBar,
      currentSectionId: found.data.currentSectionId,
      showDurationControls: found.data.showDurationControls,
      savedProjects: all,
    });
    get().markSaved();
  },

  deleteSavedProject: (saveId) => {
    const { activeSaveId } = get();
    const all = loadAllSaved().filter((p) => p.id !== saveId);
    saveAllSaved(all);

    set({
      savedProjects: all,
      activeSaveId: activeSaveId === saveId ? null : activeSaveId,
    });
  },

  newProject: () => {
    const beats = get().beatsPerBar;

    const newSecId = uid("sec");
    const fresh: Project = {
      id: uid("proj"),
      title: "Untitled Song",
      key: "C Major",
      tempo: 120,
      sections: [
        {
          id: newSecId,
          name: "A",
          bars: [{ chords: [{ chord: "", slots: beats }] }],
        },
      ],
    };

    set({
      activeSaveId: null,
      project: fresh,
      currentSectionId: newSecId,
      showDurationControls: true,
    });
    get().markSaved();
  },
  isDirty: () => {
  const { project, beatsPerBar, currentSectionId, showDurationControls, lastSavedSnapshot } = get();

  const current = JSON.stringify({
    project,
    beatsPerBar,
    currentSectionId,
    showDurationControls,
  });

  return lastSavedSnapshot !== current;
},

markSaved: () => {
  const { project, beatsPerBar, currentSectionId, showDurationControls } = get();

  const snapshot = JSON.stringify({
    project,
    beatsPerBar,
    currentSectionId,
    showDurationControls,
  });

  set({ lastSavedSnapshot: snapshot });
},
}));

