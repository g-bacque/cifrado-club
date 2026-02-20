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

  const BARS_PER_ROW = 4;

const groupedBars = [];
for (let i = 0; i < section.bars.length; i += BARS_PER_ROW) {
  groupedBars.push(section.bars.slice(i, i + BARS_PER_ROW));
}

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
    {groupedBars.map((rowBars, rowIndex) => (
      <div key={rowIndex} className="bar-row flex flex-row gap-2 mb-2">
        {rowBars.map((bar, localIndex) => {
          const barIndex = rowIndex * BARS_PER_ROW + localIndex;

          return (
            <BarCell
              key={barIndex}
              barIndex={barIndex}
              chordData={bar.chords.map(c => c.chord)}
              barRefs={barRefs}
              createNextBar={createNextBar}
            />
          );
        })}
      </div>
    ))}
  </div>
);
};

export default BarRow;
