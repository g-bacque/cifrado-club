import React, { useRef } from "react";
import BarCell from "./BarCell";
import { useEditorStore } from "../store/editorStore";

interface BarRowProps {
  sectionId: string;
}

const BarRow: React.FC<BarRowProps> = ({ sectionId }) => {
  const project = useEditorStore((s) => s.project);

  // ✅ NUEVO: usar actions del store
  const addEmptyBarAtEnd = useEditorStore((s) => s.addEmptyBarAtEnd);

  const section = project.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  const barRefs = useRef<HTMLDivElement[]>([]);
  const BARS_PER_ROW = 4;

  const createNextBar = () => {
    // Añadimos compás al final con el store
    addEmptyBarAtEnd(sectionId);

    // Enfocar el primer acorde del nuevo compás (último)
    setTimeout(() => {
      const latestProject = useEditorStore.getState().project;
      const latestSection = latestProject.sections.find((s) => s.id === sectionId);
      if (!latestSection) return;

      const lastIndex = latestSection.bars.length - 1;

      barRefs.current[lastIndex]
        ?.querySelector<HTMLInputElement>("input.chord-input")
        ?.focus();
    }, 0);
  };

  const groupedBars: typeof section.bars[] = [];
  for (let i = 0; i < section.bars.length; i += BARS_PER_ROW) {
    groupedBars.push(section.bars.slice(i, i + BARS_PER_ROW));
  }

  return (
    <div className="mb-2">
      {groupedBars.map((rowBars, rowIndex) => (
        <div key={rowIndex} className="bar-row flex gap-2 mb-2">
          {rowBars.map((_, localIndex) => {
            const barIndex = rowIndex * BARS_PER_ROW + localIndex;

            return (
              <BarCell
                sectionId={sectionId}
                key={barIndex}
                barIndex={barIndex}
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