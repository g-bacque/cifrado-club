import React from "react";
import BarRow from "./BarRow";
import { useEditorStore } from "../store/editorStore";

const ChordGrid: React.FC = () => {
  const project = useEditorStore((state) => state.project);

  if (!project) return null;

  return (
    <div className="mt-4">
      {project.sections.map((section) => (
        <BarRow key={section.id} sectionId={section.id} />
      ))}
    </div>
  );
};

export default ChordGrid;
