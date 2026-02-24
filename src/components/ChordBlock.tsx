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

  /** ✅ NUEVO: clase según longitud del acorde */
  const len = (chord || "").trim().length;
  const lenClass =
    len >= 8 ? "chord-len-xl" :
    len >= 6 ? "chord-len-lg" :
    len >= 4 ? "chord-len-md" :
    "chord-len-sm";

  /** autofocus */
  useEffect(() => {
    if (autoFocus) internalRef.current?.focus();
  }, [autoFocus]);

  /** pasar ref hacia arriba */
  useEffect(() => {
    inputRef?.(internalRef.current);
  }, [inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.(e);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      onMove?.(e.shiftKey ? "prev" : "next");
      return;
    }

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

    if (e.key === "Backspace") {
      if (!e.currentTarget.value.trim()) {
        onDelete?.();
      }
    }

    if (e.key === "Delete") {
      onDelete?.();
    }
  };

  return (
    <div
      className={`chord-block ${lenClass} relative flex flex-col items-stretch overflow-hidden`}
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

{/* CONTROLS STACK (solo visible en focus/hover via CSS) */}
<div className="chord-controls" aria-hidden="true">
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
      className="duration-input border rounded px-1 py-0.5 text-center"
    />
  )}

  <div className="chord-controls-row">
    {onDelete && (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="delete-btn"
        aria-label="Delete chord"
        title="Delete chord"
      >
        ×
      </button>
    )}

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
</div>
    </div>
  );
};

export default ChordBlock;
