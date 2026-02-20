import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { CHORDS } from "../utils/chords";
import "./ChordBlock.css";

interface Props {
  chord: string;
  duration?: number;
  maxDuration?: number; // <-- máximo beats que puede tener
  barIndex: number;
  chordIndex: number;
  autoFocus?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDurationChange?: (newDuration: number) => void;
  onDelete?: () => void;
}

const ChordBlock: React.FC<Props> = ({
  chord,
  barIndex,
  chordIndex,
  duration = 1,
    maxDuration = 4,      // <-- añadimos maxDuration,
  autoFocus,
  inputRef,
  onEnter,
  onDurationChange,     // <-- añadimos el callback
  onDelete,
}) => {
  const [value, setValue] = useState(chord);
  const [dur, setDur] = useState(duration);
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

  const updateDuration = (newDuration: number) => {
    // no permitir superar maxDuration
    const validDur = Math.min(newDuration, maxDuration);
    setDur(validDur);

    onDurationChange?.(validDur); // avisamos a BarCell

    const section = project.sections.find((s) => s.id === currentSectionId);
    if (!section) return;

    const bar = section.bars[barIndex];
    bar.chords[chordIndex].duration = validDur;
    setProject({ ...project });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateChord(value);
      setShowDropdown(false);
      onEnter?.(e);
    }
  };

  const handleBlur = () => {
    updateChord(value);
  };

  return (
<div
  className="chord-block relative flex flex-col items-stretch"
  style={{ flexGrow: dur }}
>
      <input
        className="chord-input border border-gray-300 rounded px-1 py-0.5 text-center-"
        ref={internalRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
      onKeyDown={(e) => {
        handleKeyDown(e);
        if (e.key === "Delete") onDelete?.(); // opcional: borrar con Delete
      }}
        
        placeholder="—"
      />
          {onDelete && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // evita que el click afecte al input
          onDelete();
        }}
        className="absolute top-0 right-0 text-red-500 text-xs font-bold px-1"
      >
        x
      </button>
    )}
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
<input
  type="number"
  min={1}
  max={maxDuration}
  value={dur}
  onChange={(e) => {
    const newDur = Math.min(Number(e.target.value), maxDuration);
    setDur(newDur);
    onDurationChange?.(newDur);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.(e); // usamos la misma función que el input principal
    }
  }}
      className="duration-input border rounded px-1 py-0.5 text-center"
/>
    </div>
  );
};

export default ChordBlock;