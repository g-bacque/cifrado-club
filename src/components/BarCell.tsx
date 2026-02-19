import React, { useRef, forwardRef } from "react";
import ChordBlock from "./ChordBlock";
import "./BarCell.css";

interface BarCellProps {
  barIndex: number;
  chordData: string[];
  barRefs: React.MutableRefObject<HTMLDivElement[]>;
}

const BarCell = forwardRef<HTMLDivElement, BarCellProps>(
  ({ barIndex, chordData, barRefs }, ref) => {
    const chordRefs = useRef<(HTMLInputElement | null)[]>([]);

    const focusChord = (idx: number) => {
      if (idx >= 0 && idx < chordRefs.current.length) {
        chordRefs.current[idx]?.focus();
      }
    };

    const focusChordInOtherBar = (targetBarIndex: number, chordIndex: number) => {
      const barDiv = barRefs.current[targetBarIndex];
      if (!barDiv) return;

      const inputs = barDiv.querySelectorAll<HTMLInputElement>("input");
      if (inputs[chordIndex]) inputs[chordIndex].focus();
    };

    return (
      <div
        className="bar-cell"
        ref={(el) => {
          barRefs.current[barIndex] = el!;
          if (typeof ref === "function") ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        {chordData.map((chord, idx) => (
          <ChordBlock
            key={idx}
            chord={chord}
            barIndex={barIndex}
            chordIndex={idx}
            autoFocus={idx === chordData.length - 1}
            inputRef={(el) => (chordRefs.current[idx] = el)}
            focusNext={() => focusChord(idx + 1)}
            focusPrev={() => focusChord(idx - 1)}
            focusUp={() => focusChordInOtherBar(barIndex - 1, idx)}
            focusDown={() => focusChordInOtherBar(barIndex + 1, idx)}
          />
        ))}
      </div>
    );
  }
);

export default BarCell;
