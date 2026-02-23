import React, { useEffect, useRef } from "react";
import "./ChordBlock.css";
import { useEditorStore } from "../store/editorStore";

interface Props {
  chord: string;
  slots: number;
  maxSlots?: number;
  barIndex: number;
  chordIndex: number;
  autoFocus?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;

  onChordChange?: (value: string) => void;

  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSlotsChange?: (slots: number) => void;
  onDelete?: () => void;
  onSplit?: () => void;

  /** Navegación rápida entre acordes */
  onMove?: (direction: "prev" | "next") => void;
}

const ChordBlock: React.FC<Props> = ({
  chord,
  slots,
  maxSlots = 4,
  autoFocus,
  inputRef,
  onChordChange,
  onEnter,
  onSlotsChange,
  onDelete,
  onSplit,
  onMove,
}) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const showDurationControls = useEditorStore((s) => s.showDurationControls);

  /** autofocus */
  useEffect(() => {
    if (autoFocus) internalRef.current?.focus();
  }, [autoFocus]);

  /** pasar ref hacia arriba */
  useEffect(() => {
    inputRef?.(internalRef.current);
  }, [inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ENTER: lo gestiona BarCell (divide slots / crea compás)
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.(e);
      return;
    }

    // TAB: navegar sin salir del grid
    if (e.key === "Tab") {
      e.preventDefault();
      onMove?.(e.shiftKey ? "prev" : "next");
      return;
    }

    // FLECHAS: moverte con el cursor al borde
    if (e.key === "ArrowLeft") {
      const el = e.currentTarget;
      if (el.selectionStart === 0 && el.selectionEnd === 0) {
        e.preventDefault();
        onMove?.("prev");
      }
    }

    if (e.key === "ArrowRight") {
      const el = e.currentTarget;
      const atEnd =
        el.selectionStart === el.value.length && el.selectionEnd === el.value.length;

      if (atEnd) {
        e.preventDefault();
        onMove?.("next");
      }
    }

    // BACKSPACE en vacío: borrar acorde (si existe handler)
    if (e.key === "Backspace") {
      if (!e.currentTarget.value.trim()) {
        onDelete?.();
      }
    }

    // DELETE: borrar acorde
    if (e.key === "Delete") {
      onDelete?.();
    }
  };

  return (
    <div
      className="chord-block relative flex flex-col items-stretch overflow-hidden"
      style={{
        flex: `${slots} 1 0%`,
        minWidth: 0,
      }}
    >
      {/* CHORD INPUT */}
      <input
        ref={internalRef}
        className="chord-input w-full min-w-0 border rounded px-1 py-0.5 text-center"
        type="text"
        value={chord}
        onChange={(e) => onChordChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="—"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      {/* SLOT INPUT */}
      {showDurationControls && (
        <input
          type="number"
          min={1}
          max={maxSlots}
          value={slots}
          onChange={(e) => {
            const newSlots = Math.max(1, Math.min(Number(e.target.value), maxSlots));
            onSlotsChange?.(newSlots);
          }}
          className="duration-input border rounded px-1 py-0.5 text-center mt-1"
        />
      )}

      {/* DELETE BUTTON */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-0 right-0 text-red-500 text-xs font-bold px-1"
          aria-label="Delete chord"
          title="Delete chord"
        >
          ×
        </button>
      )}
      
      {/*SPLIT BUTTON*/}
      {onSplit && (
        <button
          type="button"
          className="split-btn"
          onMouseDown={(e) => e.preventDefault()} 
          onClick={(e) => {
            e.stopPropagation();
            onSplit();
          }}
          aria-label="Añadir acorde"
          title="Añadir acorde"
        >
          +
        </button>
      )}
    </div>
  );
};

export default ChordBlock;
