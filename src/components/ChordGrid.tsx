import React from "react";
import BarRow from "./BarRow";
import { useEditorStore } from "../store/editorStore";
import "./ChordGrid.css";

const ChordGrid: React.FC = () => {
  const project = useEditorStore((state) => state.project);
  const currentSectionId = useEditorStore((state) => state.currentSectionId);

  if (!project) return null;

  const currentSection = project.sections.find((s) => s.id === currentSectionId);
  if (!currentSection) return null;

  return (
    <div className="chord-grid">
      {project.sections.map((section) => (
        <div key={section.id} className="section-block">

          <BarRow sectionId={section.id} />
        </div>
        
      ))}
    </div>
  );
};

export default ChordGrid;