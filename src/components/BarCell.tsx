import React, { useRef, forwardRef, useEffect } from "react";
import ChordBlock from "./ChordBlock";
import "./BarCell.css";

export interface BarCellProps {
  barIndex: number;
  chordData: string[];
  barRefs: React.MutableRefObject<HTMLDivElement[]>;
  createNextBar: () => void; // se llamará al presionar Enter en el último acorde
}

const BarCell = forwardRef<HTMLDivElement, BarCellProps>(
  ({ barIndex, chordData, barRefs, createNextBar }, ref) => {
    const chordRefs = useRef<(HTMLInputElement | null)[]>([]);

    const focusChord = (idx: number) => {
      if (idx >= 0 && idx < chordRefs.current.length) {
        chordRefs.current[idx]?.focus();
      }
    };

    // Enfoca automáticamente el primer acorde de un nuevo BarCell
    useEffect(() => {
      if (chordRefs.current.length > 0) {
        chordRefs.current[0]?.focus();
      }
    }, []);

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
            autoFocus={idx === 0} // enfocamos el primer acorde del nuevo BarCell
            inputRef={(el) => (chordRefs.current[idx] = el)}
            onEnter={() => {
              // Solo el último acorde del compás dispara la creación
              if (idx === chordData.length - 1) createNextBar();
            }}
          />
        ))}
      </div>
    );
  }
);

export default BarCell;
