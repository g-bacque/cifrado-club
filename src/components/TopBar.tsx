import React from "react";
import { useEditorStore } from "../store/editorStore";
import "./TopBar.css"

interface Props {
  title: string;
  tempo: number;
}

const TopBar: React.FC<Props> = ({ title, tempo }) => {
  const showDurationControls = useEditorStore((s) => s.showDurationControls);
  const toggleDurationControls = useEditorStore((s) => s.toggleDurationControls);

  return (
    <div className="bg-gray-800 text-white p-2 flex items-center justify-between gap-3">
      <h1 className="font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        <span>{tempo} BPM</span>

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