import React from "react";
import TopBar from "../components/TopBar";
import ChordGrid from "../components/ChordGrid";
import { useEditorStore } from "../store/editorStore";
import "./EditorPage.css";

const EditorPage: React.FC = () => {
  const project = useEditorStore((state) => state.project);

  return (
    <div className="editor-page">
      <div className="editor-shell">
        <TopBar tempo={project.tempo} />

        <div className="editor-main">
          <ChordGrid />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
