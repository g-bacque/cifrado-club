import React, { useRef } from "react";
import BarCell from "./BarCell";
import { useEditorStore } from "../store/editorStore";

interface BarRowProps {
  sectionId: string;
}

const BarRow: React.FC<BarRowProps> = ({ sectionId }) => {

  const project = useEditorStore((s) => s.project);
  const setProject = useEditorStore((s) => s.setProject);

  const section = project.sections.find(s => s.id === sectionId);
  if (!section) return null;

  const barRefs = useRef<HTMLDivElement[]>([]);
  const BARS_PER_ROW = 4;

  const createNextBar = () => {

    const newBar = {
      chords: [{ chord: "", slots: 4 }]
    };

    const newSections = project.sections.map(s =>
      s.id === sectionId
        ? { ...s, bars: [...s.bars, newBar] }
        : s
    );

    setProject({ ...project, sections: newSections });

    setTimeout(() => {
      const lastIndex = newSections
        .find(s => s.id === sectionId)!
        .bars.length - 1;

      barRefs.current[lastIndex]
        ?.querySelector<HTMLInputElement>("input")
        ?.focus();
    }, 0);
  };

  const groupedBars = [];
  for (let i = 0; i < section.bars.length; i += BARS_PER_ROW) {
    groupedBars.push(section.bars.slice(i, i + BARS_PER_ROW));
  }

  return (
    <div className="mb-2">
      {groupedBars.map((rowBars, rowIndex) => (
        <div key={rowIndex} className="bar-row flex gap-2 mb-2">
          {rowBars.map((bar, localIndex) => {
            const barIndex = rowIndex * BARS_PER_ROW + localIndex;

            return (
              <BarCell
                key={barIndex}
                barIndex={barIndex}
                barData={bar.chords}
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