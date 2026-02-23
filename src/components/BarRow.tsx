import React, { useRef, useState } from "react";
import BarCell from "./BarCell";
import { useEditorStore } from "../store/editorStore";
import "./BarRow.css";

interface BarRowProps {
  sectionId: string;
}

const BarRow: React.FC<BarRowProps> = ({ sectionId }) => {
  const project = useEditorStore((s) => s.project);

  const addEmptyBarAtEnd = useEditorStore((s) => s.addEmptyBarAtEnd);
  const beatsPerBar = useEditorStore((s) => s.beatsPerBar);

  // ✅ Secciones: crear/renombrar/navegar
  const addSection = useEditorStore((s) => s.addSection);
  const renameSection = useEditorStore((s) => s.renameSection);
  const setCurrentSectionId = useEditorStore((s) => s.setCurrentSectionId);

  const section = project.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  const barRefs = useRef<HTMLDivElement[]>([]);
  const BARS_PER_ROW = 4;

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(section.name);

  // Mantener draft sincronizado si cambias de sección
  React.useEffect(() => {
    setDraftName(section.name);
    setIsEditingName(false);
  }, [section.id, section.name]);

  const createNextBar = () => {
    addEmptyBarAtEnd(sectionId);

    setTimeout(() => {
      const latestProject = useEditorStore.getState().project;
      const latestSection = latestProject.sections.find((s) => s.id === sectionId);
      if (!latestSection) return;

      const lastIndex = latestSection.bars.length - 1;

      barRefs.current[lastIndex]
        ?.querySelector<HTMLInputElement>("input.chord-input")
        ?.focus();
    }, 0);
  };

  const groupedBars: typeof section.bars[] = [];
  for (let i = 0; i < section.bars.length; i += BARS_PER_ROW) {
    groupedBars.push(section.bars.slice(i, i + BARS_PER_ROW));
  }

  const sectionIndex = project.sections.findIndex((s) => s.id === sectionId);
  const hasPrev = sectionIndex > 0;
  const hasNext = sectionIndex >= 0 && sectionIndex < project.sections.length - 1;

  const goPrev = () => {
    if (!hasPrev) return;
    setCurrentSectionId(project.sections[sectionIndex - 1].id);
  };

  const goNext = () => {
    if (!hasNext) return;
    setCurrentSectionId(project.sections[sectionIndex + 1].id);
  };

  const commitName = () => {
    const next = draftName.trim();
    if (next && next !== section.name) {
      renameSection(section.id, next);
    } else {
      setDraftName(section.name);
    }
    setIsEditingName(false);
  };

  return (
    <div className="barrow-wrapper">
      {/* ✅ HEADER DE SECCIÓN */}
      <div className="section-header">
        <div className="section-left">
          <button
            type="button"
            className="section-nav-btn"
            onClick={goPrev}
            disabled={!hasPrev}
            title="Sección anterior"
            aria-label="Sección anterior"
          >
            ‹
          </button>

          {!isEditingName ? (
            <button
              type="button"
              className="section-title"
              onClick={() => setIsEditingName(true)}
              title="Renombrar sección"
            >
              {section.name}
            </button>
          ) : (
            <input
              className="section-title-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setDraftName(section.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
            />
          )}

          <button
            type="button"
            className="section-nav-btn"
            onClick={goNext}
            disabled={!hasNext}
            title="Sección siguiente"
            aria-label="Sección siguiente"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          className="new-section-btn"
          onClick={() => addSection()}
          title="Nueva sección"
          aria-label="Nueva sección"
        >
          + New Section
        </button>
      </div>

      {/* ✅ SISTEMAS / COMPASES */}
      <div className="mb-2">
        {groupedBars.map((rowBars, rowIndex) => {
          const isLastRow = rowIndex === groupedBars.length - 1;

          return (
            <div key={rowIndex} className="bar-row">
              <div className="bar-system">
                {rowBars.map((_, localIndex) => {
                  const barIndex = rowIndex * BARS_PER_ROW + localIndex;

                  return (
                    <BarCell
                      sectionId={sectionId}
                      key={barIndex}
                      barIndex={barIndex}
                      barRefs={barRefs}
                      createNextBar={createNextBar}
                      maxSlots={beatsPerBar}
                    />
                  );
                })}
              </div>

              {isLastRow && (
                <button
                  type="button"
                  className="add-bar-btn"
                  onClick={createNextBar}
                  title="Añadir compás"
                  aria-label="Añadir compás"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarRow;