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
    <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between gap-6 shadow-md">
      <input
        type="text"
        value={title}
        onChange={(e) => setProjectTitle(e.target.value)}
        className="bg-transparent border-none text-2xl font-bold outline-none text-center"
        placeholder="Título de la canción"
      />

      <div className="flex items-center gap-3">
        <span>{tempo} BPM</span>

        <div className="flex items-center gap-2">
          <span className="text-sm">Compás:</span>

          {[3, 4, 6].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBeatsPerBar(b)}
              className={`px-2 py-1 rounded text-sm ${
                beatsPerBar === b ? "bg-gray-700 text-white" : "bg-gray-200"
              }`}
              title={`${b}/4`}
            >
              {b}/4
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleDurationControls}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
          aria-pressed={showDurationControls}
          title="Mostrar u ocultar duraciones"
        >
          Duraciones: {showDurationControls ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
};

export default TopBar;