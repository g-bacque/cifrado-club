import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { CHORDS } from "../utils/chords";

interface Props {
  chord: string;
  barIndex: number;
  chordIndex: number;
  autoFocus?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  onEnter?: () => void; // callback al presionar Enter
}

const ChordBlock: React.FC<Props> = ({
  chord,
  barIndex,
  chordIndex,
  autoFocus,
  inputRef,
  onEnter,
}) => {
  const [value, setValue] = useState(chord);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const setProject = useEditorStore((state) => state.setProject);
  const project = useEditorStore((state) => state.project);
  const currentSectionId = useEditorStore((state) => state.currentSectionId);

  const internalRef = useRef<HTMLInputElement>(null);

  // Autofocus
  useEffect(() => {
    if (autoFocus) internalRef.current?.focus();
  }, [autoFocus]);

  // Pasamos la referencia hacia arriba
  useEffect(() => {
    if (inputRef) inputRef(internalRef.current);
  }, [inputRef]);

  // Filtrado de sugerencias
  useEffect(() => {
    if (!value) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const filtered = CHORDS.filter((c) =>
      c.toLowerCase().startsWith(value.toLowerCase())
    );
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
    setActiveIndex(0);
  }, [value]);

  const updateChord = (newChord: string) => {
    setValue(newChord);

    const section = project.sections.find((s) => s.id === currentSectionId);
    if (!section) return;

    const bar = section.bars[barIndex];
    bar.chords[chordIndex].chord = newChord;
    setProject({ ...project });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateChord(value);
      setShowDropdown(false); // cerramos dropdown antes de crear el nuevo BarCell
      onEnter?.(); // avisamos a BarCell que cree el nuevo compás
    }
  };

  const handleBlur = () => {
    updateChord(value);
  };

  return (
    <div className="relative">
      <input
        ref={internalRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="border border-gray-300 rounded px-1 py-0.5 w-full text-center"
        placeholder="—"
      />
      {showDropdown && (
        <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 max-h-32 overflow-y-auto z-10">
          {suggestions.map((s, idx) => (
            <li
              key={s}
              className={`px-2 py-1 cursor-pointer ${
                idx === activeIndex ? "bg-blue-200" : ""
              }`}
              onMouseDown={() => {
                updateChord(s);
                setShowDropdown(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChordBlock;
