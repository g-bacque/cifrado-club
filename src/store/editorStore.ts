import { create } from "zustand";

// Ahora cada acorde ocupa un número de slots
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

interface EditorState {
  project: Project;
  currentSectionId: string;

  showDurationControls: boolean;

  setProject: (project: Project) => void;
  setCurrentSectionId: (id: string) => void;

  toggleDurationControls: () => void;

  /** Actualiza el texto de un acorde (persistente) */
  updateChord: (
    sectionId: string,
    barIndex: number,
    chordIndex: number,
    chord: string
  ) => void;

  /**
   * Añade un compás vacío al final de una sección.
   * Útil para cuando llegas al final y quieres seguir escribiendo.
   */
  addEmptyBarAtEnd: (sectionId: string) => void;

  /**
   * Asegura que exista el siguiente compás (barIndex + 1) en una sección.
   * Si no existe, lo crea con un acorde vacío de 4 slots.
   */
  ensureNextBar: (sectionId: string, barIndex: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
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

  toggleDurationControls: () =>
    set((state) => ({
      showDurationControls: !state.showDurationControls,
    })),

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

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const newBar: Bar = { chords: [{ chord: "", slots: 4 }] };
      return { ...sec, bars: [...sec.bars, newBar] };
    });

    set({ project: { ...project, sections } });
  },

  ensureNextBar: (sectionId, barIndex) => {
    const project = get().project;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = [...sec.bars];

      if (!bars[barIndex + 1]) {
        bars.push({ chords: [{ chord: "", slots: 4 }] });
      }

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },
}));