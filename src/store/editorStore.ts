import { create } from "zustand";

// Ahora cada acorde ocupa un número de slots
export interface ChordEvent {
  chord: string;   // texto del acorde
  slots: number;   // cuántos slots ocupa este acorde en el compás
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

  showDurationControls: boolean; // 👈 nuevo

  setProject: (project: Project) => void;
  setCurrentSectionId: (id: string) => void;

  toggleDurationControls: () => void; // 👈 nuevo
}

export const useEditorStore = create<EditorState>((set) => ({
  project: {
    id: "1",
    title: "Untitled Song",
    key: "C Major",
    tempo: 120,
    sections: [
      {
        id: "sec1",
        name: "A",
        bars: [
          { chords: [{ chord: "", slots: 1 }] },
        ],
      },
    ],
  },

  currentSectionId: "sec1",

  // 👇 nuevo estado
  showDurationControls: true,

  setProject: (project) => set({ project }),
  setCurrentSectionId: (id) => set({ currentSectionId: id }),

  // 👇 toggle
  toggleDurationControls: () =>
    set((state) => ({
      showDurationControls: !state.showDurationControls,
    })),
}));