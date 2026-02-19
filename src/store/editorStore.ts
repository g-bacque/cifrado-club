import { create } from "zustand";

export interface ChordEvent {
  chord: string;   // por ahora solo texto
  duration: number;
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
  setProject: (project: Project) => void;
  setCurrentSectionId: (id: string) => void;
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
          { chords: [{ chord: "", duration: 1 }] }, // primer compás vacío
        ],
      },
    ],
  },
  currentSectionId: "sec1",
  setProject: (project) => set({ project }),
  setCurrentSectionId: (id) => set({ currentSectionId: id }),
}));
