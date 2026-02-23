import React from "react";
import { useEditorStore } from "../store/editorStore";

interface Section {
  id: string;
  name: string;
}

interface Props {
  sections: Section[];
  currentSectionId: string;
}

const SectionsSidebar: React.FC<Props> = ({ sections, currentSectionId }) => {
  const setCurrentSectionId = useEditorStore((s) => s.setCurrentSectionId);
  const addSection = useEditorStore((s) => s.addSection);
  const renameSection = useEditorStore((s) => s.renameSection);

  return (
    <div className="w-28 bg-gray-200 p-2 flex flex-col">

      {/* ⭐ BOTÓN NUEVA SECCIÓN */}
      <button
        type="button"
        onClick={() => addSection()}
        className="mb-3 p-2 rounded bg-gray-300 hover:bg-gray-400 text-sm font-semibold"
      >
        + New
      </button>

      {/* ⭐ LISTA DE SECCIONES */}
      <div className="flex flex-col gap-1">
        {sections.map((s) => (
          <div
            key={s.id}
            className={`p-2 rounded cursor-pointer select-none ${
              s.id === currentSectionId ? "bg-gray-400" : "bg-gray-300 hover:bg-gray-350"
            }`}
            onClick={() => setCurrentSectionId(s.id)}

            // ⭐ DOBLE CLICK PARA RENOMBRAR
            onDoubleClick={() => {
              const next = window.prompt("Nombre de sección:", s.name);
              if (next !== null) renameSection(s.id, next);
            }}
          >
            {s.name}
          </div>
        ))}
      </div>

    </div>
  );
};

export default SectionsSidebar;