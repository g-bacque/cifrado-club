import React from "react";
import { useEditorStore } from "../store/editorStore";
import "./TopBar.css";

interface Props {
  tempo: number;
}

const TopBar: React.FC<Props> = ({ tempo }) => {
  const title = useEditorStore((s) => s.project.title);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);

  const beatsPerBar = useEditorStore((s) => s.beatsPerBar);
  const setBeatsPerBar = useEditorStore((s) => s.setBeatsPerBar);

  const showDurationControls = useEditorStore((s) => s.showDurationControls);
  const toggleDurationControls = useEditorStore((s) => s.toggleDurationControls);

return (
  <div className="topbar">
    <input
      type="text"
      value={title}
      onChange={(e) => setProjectTitle(e.target.value)}
      className="topbar-title"
      placeholder="Título de la canción"
    />

    <div className="topbar-controls">
      <span className="topbar-tempo">{tempo} BPM</span>

      <div className="topbar-time">
        <span className="label">Compás:</span>

        {[3, 4, 6].map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBeatsPerBar(b)}
            className={`time-btn ${beatsPerBar === b ? "active" : ""}`}
            title={`${b}/4`}
          >
            {b}/4
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleDurationControls}
        className="duration-btn"
        aria-pressed={showDurationControls}
        title="Cambiar modo"
      >
        Modo: {showDurationControls ? "Editar" : "Print"}
      </button>
    </div>
  </div>
);
};

export default TopBar;