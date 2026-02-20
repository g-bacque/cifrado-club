import React, { useRef, forwardRef, useEffect } from "react";
import ChordBlock from "./ChordBlock";
import "./BarCell.css";
import { useEditorStore, ChordEvent } from "../store/editorStore";

export interface BarCellProps {
  barIndex: number;
  barData: ChordEvent[];
  barRefs: React.MutableRefObject<HTMLDivElement[]>;
  createNextBar: () => void;
  maxSlots?: number;
}

const BarCell = forwardRef<HTMLDivElement, BarCellProps>(
({ barIndex, barData, barRefs, createNextBar, maxSlots = 4 }, ref) => {

  const chordRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    chordRefs.current[0]?.focus();
  }, []);

  const project = useEditorStore.getState().project;
  const setProject = useEditorStore.getState().setProject;

  const section = project.sections.find(s => s.bars[barIndex]);
  if (!section) return null;

  const chords = section.bars[barIndex].chords;

  /** 🔥 Garantiza SIEMPRE suma = maxSlots */
  const normalizeSlots = () => {
    let total = chords.reduce((s, c) => s + c.slots, 0);

    if (total === maxSlots) return;

    const diff = maxSlots - total;
    const last = chords[chords.length - 1];

    last.slots = Math.max(1, last.slots + diff);
  };

  return (
    <div
    className="bar-cell flex w-full overflow-hidden"
    style={{ minWidth: 0}}
      ref={(el) => {
        barRefs.current[barIndex] = el!;
        if (typeof ref === "function") ref(el);
        else if (ref)
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
    >
      {chords.map((chordObj, idx) => (
        <ChordBlock
          
          key={idx}
          chord={chordObj.chord}
          slots={chordObj.slots}
          maxSlots={maxSlots}
          barIndex={barIndex}
          chordIndex={idx}
          autoFocus={idx === chords.length - 1}
          inputRef={(el) => (chordRefs.current[idx] = el)}

          /** ENTER = dividir slots */
          onEnter={(e) => {
            if (e.shiftKey) {
              createNextBar();
              return;
            }

            const current = chords[idx];

            // no se puede dividir más
            if (current.slots <= 1) return;

            const newSlots = Math.floor(current.slots / 2);
            current.slots -= newSlots;

            chords.splice(idx + 1, 0, {
              chord: "",
              slots: newSlots
            });

            normalizeSlots();
            setProject({ ...project });
          }}

          /** Cambiar slots */
          onSlotsChange={(newSlots) => {
            newSlots = Math.max(1, Math.min(newSlots, maxSlots));

            const diff = newSlots - chords[idx].slots;
            chords[idx].slots = newSlots;

            // compensamos en los demás acordes
            let remaining = diff;

            for (let i = chords.length - 1; i >= 0; i--) {
              if (i === idx) continue;
              if (remaining === 0) break;

              const reducible = chords[i].slots - 1;
              const change = Math.min(Math.abs(remaining), reducible);

              if (diff > 0) {
                chords[i].slots -= change;
                remaining -= change;
              } else {
                chords[i].slots += change;
                remaining += change;
              }
            }

            normalizeSlots();
            setProject({ ...project });
          }}

          /** Delete chord */
          onDelete={() => {
            if (chords.length === 1) return;

            const removed = chords.splice(idx, 1)[0];
            chords[chords.length - 1].slots += removed.slots;

            normalizeSlots();
            setProject({ ...project });
          }}
        />
      ))}
    </div>
  );
});

export default BarCell;