import React, { useRef } from "react";
import BarCell from "./BarCell";
import { useEditorStore } from "../store/editorStore";

interface BarRowProps {
  sectionId: string;
}

const BarRow: React.FC<BarRowProps> = ({ sectionId }) => {
  const project = useEditorStore((state) => state.project);
  const setProject = useEditorStore((state) => state.setProject);

  const section = project.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  const barRefs = useRef<HTMLDivElement[]>([]);

  const createNextBar = () => {
    if (!section) return;

    const newBar = { chords: [{ chord: "", duration: 1 }] };
    const newBars = [...section.bars, newBar];

    const newSection = { ...section, bars: newBars };
    const newSections = project.sections.map((s) =>
      s.id === sectionId ? newSection : s
    );

    setProject({ ...project, sections: newSections });

    setTimeout(() => {
      const lastBarIndex = newBars.length - 1;
      const lastBarDiv = barRefs.current[lastBarIndex];
      if (!lastBarDiv) return;

      const input = lastBarDiv.querySelector<HTMLInputElement>("input");
      input?.focus();
    }, 0);
  };

  return (
    <div className="mb-2">
<div className="bar-row flex flex-row gap-2">
  {section.bars.map((bar, barIndex) => (
<BarCell
  key={barIndex}
  barIndex={barIndex}
  chordData={bar.chords.map(c => c.chord)}
  barRefs={barRefs}
  createNextBar={createNextBar} // <-- aquí antes tenías addBar, ahora es correcto
/>

  ))}
</div>


    </div>
  );
};

export default BarRow;
