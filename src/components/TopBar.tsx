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

  // ✅ persistencia
  const activeSaveId = useEditorStore((s) => s.activeSaveId);
  const savedProjects = useEditorStore((s) => s.savedProjects);

  const refreshSavedProjects = useEditorStore((s) => s.refreshSavedProjects);
  const saveProject = useEditorStore((s) => s.saveProject);
  const saveProjectAs = useEditorStore((s) => s.saveProjectAs);
  const loadProject = useEditorStore((s) => s.loadProject);
  const newProject = useEditorStore((s) => s.newProject);
  const isDirty = useEditorStore((s) => s.isDirty());

  const handleSave = () => {
    saveProject();
    refreshSavedProjects();
  };

  const handleSaveAs = () => {
    const name = window.prompt("Nombre para este guardado:", title || "Untitled Song");
    if (name == null) return; // cancel
    saveProjectAs(name);
    refreshSavedProjects();
  };

const handleNew = () => {
  if (isDirty) {
    const ok = window.confirm("Hay cambios sin guardar. ¿Continuar?");
    if (!ok) return;
  }

  newProject();
  refreshSavedProjects();
};

  return (
    <div className="topbar">
      <input
        type="text"
        value={title}
        onChange={(e) => setProjectTitle(e.target.value)}
        className="topbar-title"
        placeholder="Título de la canción"
      />

      {isDirty && <span className="unsaved-dot">●</span>}

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

        {/* ✅ Guardado */}
        <div className="topbar-save">
          <button type="button" className="save-btn" onClick={handleSave} title="Guardar">
            Save
          </button>

          <button type="button" className="save-btn" onClick={handleSaveAs} title="Guardar como">
            Save As
          </button>

          <select
            className="load-select"
            value={activeSaveId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;

              if (isDirty) {
                const ok = window.confirm("Hay cambios sin guardar. ¿Continuar?");
                if (!ok) return;
              }

              loadProject(id);
              refreshSavedProjects();
            }}
          >
            <option value="" disabled>
              Load…
            </option>

            {savedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <button type="button" className="save-btn" onClick={handleNew} title="Proyecto nuevo">
            New
          </button>
        </div>

        {/* ✅ Modo */}
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