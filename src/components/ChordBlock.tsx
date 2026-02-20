import React, { useState, useEffect, useRef } from "react";
import "./ChordBlock.css"

interface Props {
  chord: string;
  slots: number;
  maxSlots?: number;
  barIndex: number;
  chordIndex: number;
  autoFocus?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;

  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSlotsChange?: (slots: number) => void;
  onDelete?: () => void;
}

const ChordBlock: React.FC<Props> = ({
  chord,
  slots,
  maxSlots = 4,
  autoFocus,
  inputRef,
  onEnter,
  onSlotsChange,
  onDelete,
}) => {
  const [value, setValue] = useState(chord);

  const internalRef = useRef<HTMLInputElement>(null);

  /** autofocus */
  useEffect(() => {
    if (autoFocus) internalRef.current?.focus();
  }, [autoFocus]);

  /** pasar ref hacia arriba */
  useEffect(() => {
    inputRef?.(internalRef.current);
  }, [inputRef]);

  /** mantener sincronizado si cambia desde BarCell */
  useEffect(() => {
    setValue(chord);
  }, [chord]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.(e);
    }

    if (e.key === "Delete") {
      onDelete?.();
    }
  };

  return (
<div
  className="chord-block relative flex flex-col items-stretch overflow-hidden"
style={{
  flex: `${slots} 1 0%`,   // ⭐ solución real
  minWidth: 0,
}}
>
      {/* CHORD INPUT */}
      <input
        ref={internalRef}
        className="chord-input w-full min-w-0 border rounded px-1 py-0.5 text-center"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="—"
      />

      {/* SLOT INPUT */}
      <input
        type="number"
        min={1}
        max={maxSlots}
        value={slots}
        onChange={(e) => {
          const newSlots = Math.max(
            1,
            Math.min(Number(e.target.value), maxSlots)
          );

          onSlotsChange?.(newSlots); // 🔥 avisamos al BarCell
        }}
        className="duration-input border rounded px-1 py-0.5 text-center mt-1"
      />

      {/* DELETE BUTTON */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-0 right-0 text-red-500 text-xs font-bold px-1"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ChordBlock;