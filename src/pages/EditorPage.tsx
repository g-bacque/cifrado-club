import React from "react";
import TopBar from "../components/TopBar";
import ChordGrid from "../components/ChordGrid";
import { useEditorStore } from "../store/editorStore";
import "./EditorPage.css";
import ProjectMenu from "../components/ProjectMenu";
import TransportBar from "../components/TransportBar";

const EditorPage: React.FC = () => {
  const showDurationControls = useEditorStore((s) => s.showDurationControls);

  return (
    <div className="editor-page">
      <ProjectMenu />
      <div className={`editor-shell ${showDurationControls ? "mode-edit" : "mode-print"}`}>
        <TopBar />
        <TransportBar />

        <div className="editor-main">
          <ChordGrid />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;