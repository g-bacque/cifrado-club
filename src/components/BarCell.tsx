import React, { useRef, forwardRef, useEffect } from "react";
import ChordBlock from "./ChordBlock";
import "./BarCell.css";
import { useEditorStore } from "../store/editorStore";

export interface BarCellProps {
  barIndex: number;
  barData: { chord: string; duration: number }[];
  barRefs: React.MutableRefObject<HTMLDivElement[]>;
  createNextBar: () => void;
  addChord: (barIndex: number) => void;
  maxBeats?: number; // <-- nuevo
}

const BarCell = forwardRef<HTMLDivElement, BarCellProps>(
  ({ barIndex, barData, barRefs, createNextBar, addChord, maxBeats = 4 }, ref) => {
    const chordRefs = useRef<(HTMLInputElement | null)[]>([]);

    const focusChord = (idx: number) => {
      if (idx >= 0 && idx < chordRefs.current.length) {
        chordRefs.current[idx]?.focus();
      }
    };

    useEffect(() => {
      if (chordRefs.current.length > 0) {
        chordRefs.current[0]?.focus();
      }
    }, []);

    return (
      <div
        className="bar-cell flex" // <-- flex para que los chordBlocks se alineen horizontalmente
        ref={(el) => {
          barRefs.current[barIndex] = el!;
          if (typeof ref === "function") ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
{barData.map((chordObj, idx) => {
  // Calculamos cuántos beats ya se han usado antes de este acorde
  const usedBeats = barData
    .slice(0, idx)
    .reduce((sum, c) => sum + c.duration, 0);

  // Calculamos cuántos beats quedan disponibles para este acorde
  const remainingBeats = Math.max(maxBeats - usedBeats, 1); // al menos 1

  return (
<ChordBlock
  key={idx}
  chord={chordObj.chord}
  duration={chordObj.duration}
  maxDuration={remainingBeats}
  barIndex={barIndex}
  chordIndex={idx}
  autoFocus={idx === barData.length - 1}
  inputRef={(el) => (chordRefs.current[idx] = el)}
  onEnter={(e) => {
    if (e.shiftKey) createNextBar();
    else addChord(barIndex);
  }}
  onDurationChange={(newDur) => {
    const project = useEditorStore.getState().project;
    const section = project.sections.find((s) => s.bars[barIndex]);
    if (!section) return;

    section.bars[barIndex].chords[idx].duration = newDur;
    useEditorStore.getState().setProject({ ...project });
  }}
  onDelete={() => {
    // Eliminar el acorde
    const project = useEditorStore.getState().project;
    const section = project.sections.find((s) => s.bars[barIndex]);
    if (!section) return;

    section.bars[barIndex].chords.splice(idx, 1);
    useEditorStore.getState().setProject({ ...project });
  }}
/>
  );
})}
      </div>
    );
  }
);

export default BarCell;