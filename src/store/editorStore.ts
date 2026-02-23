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
 */
function resizeBarToBeats(bar: Bar, beats: number): Bar {
  const chords = bar.chords.map((c) => ({ ...c, slots: Math.max(1, c.slots) }));

  while (chords.length > beats) {
    const last = chords.pop()!;
    chords[chords.length - 1].slots += last.slots;
  }

  let total = chords.reduce((s, c) => s + c.slots, 0);

  if (total > beats) {
    let extra = total - beats;

    for (let i = chords.length - 1; i >= 0 && extra > 0; i--) {
      const reducible = chords[i].slots - 1;
      const take = Math.min(reducible, extra);
      chords[i].slots -= take;
      extra -= take;
    }

    while (extra > 0 && chords.length > 1) {
      const last = chords.pop()!;
      chords[chords.length - 1].slots += last.slots;

      total = chords.reduce((s, c) => s + c.slots, 0);
      extra = total - beats;
    }
  }

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

  beatsPerBar: number;
  setBeatsPerBar: (beats: number) => void;
  insertBarAfter: (sectionId: string, barIndex: number) => void;
  setProject: (project: Project) => void;
  setCurrentSectionId: (id: string) => void;
  setProjectTitle: (title: string) => void;
  moveBar: (sectionId: string, fromIndex: number, toIndex: number) => void;
  toggleDurationControls: () => void;

  updateChord: (
    sectionId: string,
    barIndex: number,
    chordIndex: number,
    chord: string
  ) => void;

  addEmptyBarAtEnd: (sectionId: string) => void;
  ensureNextBar: (sectionId: string, barIndex: number) => void;

  deleteLastBar: (sectionId: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
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

    insertBarAfter: (sectionId, barIndex) => {
    const project = get().project;
    const beats = get().beatsPerBar;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      const bars = [...sec.bars];
      const newBar: Bar = { chords: [{ chord: "", slots: beats }] };

      bars.splice(barIndex + 1, 0, newBar);

      return { ...sec, bars };
    });

    set({ project: { ...project, sections } });
  },

  moveBar: (sectionId, fromIndex, toIndex) => {
  const project = get().project;

  const sections = project.sections.map((sec) => {
    if (sec.id !== sectionId) return sec;

    const bars = [...sec.bars];
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= bars.length ||
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

  deleteLastBar: (sectionId) => {
    const project = get().project;

    const sections = project.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;

      if (sec.bars.length <= 1) return sec;

      return { ...sec, bars: sec.bars.slice(0, -1) };
    });

    set({ project: { ...project, sections } });
  },
}));