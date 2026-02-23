import React from "react";
import BarRow from "./BarRow";
import { useEditorStore } from "../store/editorStore";
import "./ChordGrid.css";

const ChordGrid: React.FC = () => {
  const project = useEditorStore((state) => state.project);

  if (!project) return null;

  return (
    <div className="chord-grid">
      {project.sections.map((section) => (
        <div key={section.id} className="section-block">
          <div className="section-header">{section.name}</div>
          <BarRow sectionId={section.id} />
        </div>
        
      ))}
    </div>
  );
};

export default ChordGrid;