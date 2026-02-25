import React, { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import "./ProjectMenu.css";

const ProjectMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const title = useEditorStore((s) => s.project.title);

  const activeSaveId = useEditorStore((s) => s.activeSaveId);
  const savedProjects = useEditorStore((s) => s.savedProjects);

  const refreshSavedProjects = useEditorStore((s) => s.refreshSavedProjects);
  const saveProject = useEditorStore((s) => s.saveProject);
  const saveProjectAs = useEditorStore((s) => s.saveProjectAs);
  const loadProject = useEditorStore((s) => s.loadProject);
  const newProject = useEditorStore((s) => s.newProject);

  const isDirty = useEditorStore((s) => s.isDirty());

  // cerrar al click fuera + Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const confirmDiscardIfDirty = () => {
    if (!isDirty) return true;
    return window.confirm("Hay cambios sin guardar. ¿Continuar?");
  };

  const handleSave = () => {
    saveProject();
    refreshSavedProjects();
  };

  const handleSaveAs = () => {
    const name = window.prompt("Nombre para este guardado:", title || "Untitled Song");
    if (name == null) return;
    saveProjectAs(name);
    refreshSavedProjects();
  };

  const handleNew = () => {
    if (!confirmDiscardIfDirty()) return;
    newProject();
    refreshSavedProjects();
    setOpen(false);
  };

  const handleLoad = (id: string) => {
    if (!id) return;
    if (!confirmDiscardIfDirty()) return;

    loadProject(id);
    refreshSavedProjects();
    setOpen(false);
  };

  return (
    <div className="project-menu" ref={rootRef}>
      <button
        type="button"
        className="project-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Proyecto
        {isDirty && <span className="project-dot" title="Cambios sin guardar">●</span>}
        <span className="project-caret">▾</span>
      </button>

      {open && (
        
        <div className="project-panel" role="menu">
          <button type="button" className="pm-item danger" onClick={handleNew}>
            New Project
          </button>
          <button type="button" className="pm-item" onClick={handleSave}>
            Save
          </button>

          <button type="button" className="pm-item" onClick={handleSaveAs}>
            Save As…
          </button>

          <div className="pm-sep" />

          <div className="pm-row">
            <span className="pm-label">Load</span>
            <select
              className="pm-select"
              value={activeSaveId ?? ""}
              onChange={(e) => handleLoad(e.target.value)}
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {savedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>


        </div>
      )}
    </div>
  );
};

export default ProjectMenu;