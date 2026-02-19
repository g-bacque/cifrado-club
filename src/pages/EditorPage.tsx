import React from "react";
import TopBar from "../components/TopBar";
import SectionsSidebar from "../components/SectionsSidebar";
import ChordGrid from "../components/ChordGrid";
import { useEditorStore } from "../store/editorStore";

const EditorPage: React.FC = () => {
  const project = useEditorStore((state) => state.project);
  const currentSectionId = useEditorStore((state) => state.currentSectionId);

  const currentSection = project.sections.find((s) => s.id === currentSectionId)!;

  return (
    <div className="h-screen flex flex-col">
      <TopBar title={project.title} tempo={project.tempo} />
      <div className="flex flex-1 overflow-hidden">
        <SectionsSidebar sections={project.sections} currentSectionId={currentSectionId} />
        <ChordGrid />
      </div>
    </div>
  );
};

export default EditorPage;
