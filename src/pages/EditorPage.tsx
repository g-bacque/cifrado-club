import React from "react";
import TopBar from "../components/TopBar";
import SectionsSidebar from "../components/SectionsSidebar";
import ChordGrid from "../components/ChordGrid";
import { useEditorStore } from "../store/editorStore";
import "./EditorPage.css";

const EditorPage: React.FC = () => {
  const project = useEditorStore((state) => state.project);
  const currentSectionId = useEditorStore((state) => state.currentSectionId);

  return (
    <div className="editor-page">
      <div className="editor-shell">
        <TopBar tempo={project.tempo} />

        <div className="editor-main">
          <SectionsSidebar
            sections={project.sections}
            currentSectionId={currentSectionId}
          />
          <ChordGrid />
        </div>
        
      </div>
    </div>
  );
};

export default EditorPage;
