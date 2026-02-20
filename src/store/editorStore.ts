import { create } from "zustand";

// Cada acorde ocupa un número de slots dentro del compás
export interface ChordEvent {
  chord: string; // texto del acorde
  slots: number; // cuántos slots ocupa este acorde en el compás
}

export interface Bar {
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
 * - Si hay demasiados acordes para el número de beats (ej: 4 acordes en 3/4),
 *   fusiona acordes desde el final
 */
function resizeBarToBeats(bar: Bar, beats: number): Bar {
  const chords = bar.chords.map((c) => ({ ...c, slots: Math.max(1, c.slots) }));

  // Si hay más acordes que beats, fusionamos desde el final
  while (chords.length > beats) {
    const last = chords.pop()!;
    chords[chords.length - 1].slots += last.slots;
  }

  // Ajuste por exceso o defecto
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

interface EditorState {
  project: Project;
  currentSectionId: string;

  showDurationControls: boolean;
  

  /** NUEVO: número de tiempos por compás (3 = 3/4, 4 = 4/4, etc.) */
  beatsPerBar: number;
  setBeatsPerBar: (beats: number) => void;

  setProject: (project: Project) => void;
  setCurrentSectionId: (id: string) => void;
  setProjectTitle: (title: string) => void;
  toggleDurationControls: () => void;

  /** Actualiza el texto de un acorde (persistente) */
  updateChord: (
    sectionId: string,
    barIndex: number,
    chordIndex: number,
    chord: string
  ) => void;

  /** Añade un compás vacío al final de una sección */
  addEmptyBarAtEnd: (sectionId: string) => void;

  /** Asegura que exista el siguiente compás (barIndex + 1) en una sección */
  ensureNextBar: (sectionId: string, barIndex: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Estado nuevo por defecto: 4/4
  beatsPerBar: 4,

  project: {
    id: "1",
    title: "Untitled Song",
    key: "C Major",
    tempo: 120,
    sections: [
      {
        id: "sec1",
        name: "A",
        bars: [{ chords: [{ chord: "", slots: 4 }] }],
      },
    ],
  },

  currentSectionId: "sec1",

  showDurationControls: true,

  setProject: (project) => set({ project }),
  setCurrentSectionId: (id) => set({ currentSectionId: id }),

  setProjectTitle: (title) => {
  const project = get().project;
  set({ project: { ...project, title } });
},

  toggleDurationControls: () =>
    set((state) => ({
      showDurationControls: !state.showDurationControls,
    })),

  setBeatsPerBar: (beats) => {
    const safeBeats = Math.max(1, Math.min(beats, 12));
    const project = get().project;

    const sections = project.sections.map((sec) => ({
      ...sec,
      bars: sec.bars.map((bar) => resizeBarToBeats(bar, safeBeats)),
    }));

    set({
      beatsPerBar: safeBeats,
      project: { ...project, sections },
    });
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

      const newBar: Bar = { chords: [{ chord: "", slots: beats }] };
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
        bars.push({ chords: [{ chord: "", slots: beats }] });
      }

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },
}));