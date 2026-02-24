import React from "react";
import TopBar from "../components/TopBar";
import ChordGrid from "../components/ChordGrid";
import { useEditorStore } from "../store/editorStore";
import "./EditorPage.css";

const EditorPage: React.FC = () => {
  const project = useEditorStore((state) => state.project);
    const showDurationControls = useEditorStore((s) => s.showDurationControls);

  return (
    <div className="editor-page">
      <div className={`editor-shell ${showDurationControls ? "mode-edit" : "mode-print"}`}>
        <TopBar tempo={project.tempo} />

        <div className="editor-main">
          <ChordGrid />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
