import React from "react";

interface Section {
  id: string;
  name: string;
}

interface Props {
  sections: Section[];
  currentSectionId: string;
}

const SectionsSidebar: React.FC<Props> = ({ sections, currentSectionId }) => {
  return (
    <div className="w-24 bg-gray-200 p-2">
      {sections.map((s) => (
        <div
          key={s.id}
          className={`p-1 mb-1 cursor-pointer ${s.id === currentSectionId ? "bg-gray-400" : ""}`}
        >
          {s.name}
        </div>
      ))}
    </div>
  );
};

export default SectionsSidebar;
