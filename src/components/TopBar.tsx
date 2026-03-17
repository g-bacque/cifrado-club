import React from "react";
import { useEditorStore } from "../store/editorStore";
import "./TopBar.css";

const TopBar: React.FC = () => {
  const title = useEditorStore((s) => s.project.title);
  const tempo = useEditorStore((s) => s.project.tempo);

  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);
  const setTempo = useEditorStore((s) => s.setTempo);

  const beatsPerBar = useEditorStore((s) => s.beatsPerBar);
  const setBeatsPerBar = useEditorStore((s) => s.setBeatsPerBar);

  const showDurationControls = useEditorStore((s) => s.showDurationControls);
  const toggleDurationControls = useEditorStore((s) => s.toggleDurationControls);

  const isDirty = useEditorStore((s) => s.isDirty());

  return (
    <div className="topbar">
      <div className="topbar-left">
        <input
          type="text"
          value={title}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="topbar-title"
          placeholder="Título de la canción"
        />
      </div>

      <div className="topbar-controls">
        <div className="topbar-tempo-wrap">
          <span className="label">BPM:</span>
          <input
            type="number"
            min={30}
            max={300}
            step={1}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="topbar-tempo-input"
            title="Tempo"
          />
        </div>

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

        <span
          className={`topbar-dirty-dot ${isDirty ? "is-dirty" : ""}`}
          title={isDirty ? "Hay cambios sin guardar" : "Todo guardado"}
        />
      </div>
    </div>
  );
};

export default TopBar;