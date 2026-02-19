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

  const addBar = () => {
    if (!section) return;
    const newBar = {
      chords: [{ chord: "", duration: 1 }],
    };
    section.bars.push(newBar);
    setProject({ ...project });
  };

  return (
    <div className="mb-2">
      <div className="flex flex-col">
        {section.bars.map((bar, barIndex) => (
          <BarCell
            key={barIndex}
            barIndex={barIndex}
            chordData={bar.chords.map((c) => c.chord)}
            barRefs={barRefs}
          />
        ))}
      </div>
      <button
        onClick={addBar}
        className="mt-1 px-2 py-1 border rounded text-sm bg-gray-200 hover:bg-gray-300"
      >
        + Add Bar
      </button>
    </div>
  );
};

export default BarRow;
