import React, { useRef } from "react";
import BarCell from "./BarCell";
import { useEditorStore } from "../store/editorStore";
import "./BarRow.css";

interface BarRowProps {
  sectionId: string;
}

const BarRow: React.FC<BarRowProps> = ({ sectionId }) => {
  const project = useEditorStore((s) => s.project);

  const addEmptyBarAtEnd = useEditorStore((s) => s.addEmptyBarAtEnd);
  const beatsPerBar = useEditorStore((s) => s.beatsPerBar);

  const section = project.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  const barRefs = useRef<HTMLDivElement[]>([]);
  const BARS_PER_ROW = 4;

  const createNextBar = () => {
    addEmptyBarAtEnd(sectionId);

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
      {groupedBars.map((rowBars, rowIndex) => {
        const isLastRow = rowIndex === groupedBars.length - 1;

        return (
        <div key={rowIndex} className="bar-row">
          <div className="bar-system">
            {rowBars.map((_, localIndex) => {
              const barIndex = rowIndex * BARS_PER_ROW + localIndex;

              return (
                <BarCell
                  sectionId={sectionId}
                  key={barIndex}
                  barIndex={barIndex}
                  barRefs={barRefs}
                  createNextBar={createNextBar}
                  maxSlots={beatsPerBar}
                />
              );
            })}
          </div>

          {isLastRow && (
            <button
              type="button"
              className="add-bar-btn"
              onClick={createNextBar}
              title="Añadir compás"
              aria-label="Añadir compás"
            >
              +
            </button>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default BarRow;