import React, { useRef, forwardRef } from "react";
import ChordBlock from "./ChordBlock";
import "./BarCell.css";
import { useEditorStore } from "../store/editorStore";

export interface BarCellProps {
  sectionId: string;
  barIndex: number;
  barRefs: React.MutableRefObject<HTMLDivElement[]>;
  createNextBar: () => void;
  maxSlots?: number;
}

const BarCell = forwardRef<HTMLDivElement, BarCellProps>(
  ({ sectionId, barIndex, barRefs, createNextBar, maxSlots = 4 }, ref) => {
    const chordRefs = useRef<(HTMLInputElement | null)[]>([]);

    const project = useEditorStore((s) => s.project);
    const setProject = useEditorStore((s) => s.setProject);

    const updateChord = useEditorStore((s) => s.updateChord);
    const deleteLastBar = useEditorStore((s) => s.deleteLastBar);
    const deleteBarAt = useEditorStore((s) => s.deleteBarAt);
    const insertBarAfter = useEditorStore((s) => s.insertBarAfter);
    const duplicateBar = useEditorStore((s) => s.duplicateBar);
    const moveBar = useEditorStore((s) => s.moveBar);
    const ensureNextBar = useEditorStore((s) => s.ensureNextBar);
    

    // time sig per-bar
    const beatsPerBar = useEditorStore((s) => s.beatsPerBar);
    const setBarBeats = useEditorStore((s) => s.setBarBeats);

    const section = project.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const bar = section.bars[barIndex];
    if (!bar) return null;

    const chords = bar.chords;

    // ===== time signature logic =====
    const beatsHere = bar.beats ?? beatsPerBar;
    const hasOverride = bar.beats != null;

    const prevBar = section.bars[barIndex - 1];
    const beatsPrev = prevBar ? (prevBar.beats ?? beatsPerBar) : null;

    const showTimeSig = barIndex === 0 || beatsHere !== beatsPrev;

    // bar number logic
    const showPrimaryNumber = barIndex % 4 === 0;

    // ===== helpers =====
    const normalizeSlots = () => {
      const total = chords.reduce((s, c) => s + c.slots, 0);
      if (total === maxSlots) return;

      const diff = maxSlots - total;

      for (let i = chords.length - 1; i >= 0; i--) {
        const c = chords[i];
        const next = c.slots + diff;
        if (next >= 1) {
          c.slots = next;
          return;
        }
      }

      chords[chords.length - 1].slots = Math.max(
        1,
        chords[chords.length - 1].slots + diff
      );
    };

    const focusChord = (targetBarIndex: number, targetChordIndex: number) => {
      if (targetBarIndex === barIndex) {
        chordRefs.current[targetChordIndex]?.focus();
        return;
      }

      const targetEl = barRefs.current[targetBarIndex];
      if (!targetEl) return;

      const chordInputs = Array.from(
        targetEl.querySelectorAll<HTMLInputElement>("input.chord-input")
      );
      chordInputs[targetChordIndex]?.focus();
    };

    const move = (fromChordIndex: number, direction: "prev" | "next") => {
      if (direction === "prev") {
        if (fromChordIndex > 0) {
          focusChord(barIndex, fromChordIndex - 1);
          return;
        }

        if (barIndex > 0) {
          const prev = section.bars[barIndex - 1];
          const lastChordIndex = Math.max(0, prev.chords.length - 1);
          focusChord(barIndex - 1, lastChordIndex);
        }
        return;
      }

      if (fromChordIndex < chords.length - 1) {
        focusChord(barIndex, fromChordIndex + 1);
        return;
      }

      const hasNextBar = Boolean(section.bars[barIndex + 1]);
      if (hasNextBar) {
        focusChord(barIndex + 1, 0);
        return;
      }

      createNextBar();
    };

    const goToNextBar = () => {
      const hasNextBar = Boolean(section.bars[barIndex + 1]);

      if (!hasNextBar) {
        ensureNextBar(sectionId, barIndex);
        setTimeout(() => focusChord(barIndex + 1, 0), 0);
        return;
      }

      focusChord(barIndex + 1, 0);
    };

    const splitChordAt = (idxToSplit: number) => {
      const current = chords[idxToSplit];
      if (!current) return;
      if (current.slots <= 1) return;

      const newSlots = Math.floor(current.slots / 2);
      current.slots -= newSlots;

      chords.splice(idxToSplit + 1, 0, { chord: "", slots: newSlots });

      normalizeSlots();
      setProject({ ...project });

      setTimeout(() => focusChord(barIndex, idxToSplit + 1), 0);
    };

    // ===== bar insert =====
    const handleInsertBarAfter = () => {
      insertBarAfter(sectionId, barIndex);
      setTimeout(() => focusChord(barIndex + 1, 0), 0);
    };

    // ===== drag & drop =====
    const handleDragStart = (e: React.DragEvent) => {
      document.body.classList.add("dragging-bars");
      e.dataTransfer.setData("text/plain", String(barIndex));
      e.dataTransfer.effectAllowed = "move";

      const img = new Image();
      img.src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
      e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragEnd = () => {
      document.body.classList.remove("dragging-bars");
      document
        .querySelectorAll(".drop-target")
        .forEach((el) => el.classList.remove("drop-target"));
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData("text/plain"));
      const to = barIndex;

      if (Number.isNaN(from)) return;
      moveBar(sectionId, from, to);

      setTimeout(() => {
        const newIndex = from < to ? to - 1 : to;
        focusChord(newIndex, 0);
      }, 0);
    };

    return (
      <div
        className={`bar-cell chords-${chords.length}`}
        tabIndex={-1}
        onMouseEnter={(e) => {
  // Solo si YA hay un compás enfocado en algún lado
  const hasFocusedBar = Boolean(document.querySelector(".bar-cell:focus-within"));
  if (!hasFocusedBar) return;

  // Si este compás ya está en focus, no hagas nada
  if (e.currentTarget.querySelector(":focus")) return;

  // Mover el foco al compás que estás hovereando
  e.currentTarget.focus();
}}onMouseDown={(e) => {
  // Evita que el foco se quede “raro” si clicas en zonas vacías
  // (no afecta al input porque el input seguirá enfocándose al click)
  if (e.target === e.currentTarget) e.preventDefault();
}}
onClick={(e) => {
  if (e.target === e.currentTarget) e.currentTarget.focus();
}}
        style={{ minWidth: 0 }}
        ref={(el) => {
          barRefs.current[barIndex] = el!;
          if (typeof ref === "function") ref(el);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        onDragOver={(e) => {
          handleDragOver(e);
          e.currentTarget.classList.add("drop-target");
        }}
        onDrop={(e) => {
          e.currentTarget.classList.remove("drop-target");
          handleDrop(e);
        }}
      >
        {/* Time signature (only when needed) */}
        {showTimeSig && <span className="time-sig">{beatsHere}/4</span>}

        {/* Time signature editor controls */}
{/* TIME SIGNATURE (trigger + menu) */}
<div className="bar-timesig" aria-label="Cambiar compás">
  {/* Trigger: muestra el compás actual */}
  <button
    type="button"
    className="ts-trigger"
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => e.stopPropagation()}
    title="Compás"
  >
    {beatsHere}/4
  </button>

  {/* Menu: opciones */}
  <div className="ts-menu">
    {[2, 3, 4, 5, 6].map((b) => (
      <button
        key={b}
        type="button"
        className={`ts-btn ${beatsHere === b ? "active" : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setBarBeats(sectionId, barIndex, b);
        }}
        title={`${b}/4`}
      >
        {b}/4
      </button>
    ))}

    <button
      type="button"
      className={`ts-btn reset ${!hasOverride ? "active" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        setBarBeats(sectionId, barIndex, null);
      }}
      title="Volver al compás general"
    >
      ↩︎
    </button>
  </div>
</div>

        {/* Drag handle */}
        <button
          type="button"
          className="drag-handle"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          aria-label="Arrastrar compás"
          title="Arrastrar compás"
        >
          ≡
        </button>

        {/* Bar number: hide when time signature is shown */}
        {!showTimeSig && showPrimaryNumber && (
          <span className="bar-number primary">{barIndex + 1}</span>
        )}
        {!showTimeSig && <span className="bar-number hover-only">{barIndex + 1}</span>}

        {/* Insert bar button */}
        <div className="bar-edge-actions" aria-label="Acciones de compás">
          <button
            type="button"
            className="insert-bar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleInsertBarAfter();
            }}
            aria-label="Insertar compás"
            title="Insertar compás"
          >
            +
          </button>

          <button
            type="button"
            className="duplicate-bar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              duplicateBar(sectionId, barIndex);
            }}
            aria-label="Duplicar compás"
            title="Duplicar compás"
          >
            ⧉
          </button>
        </div>

        {/* Chords */}
        {chords.map((chordObj, idx) => (
          <ChordBlock
            key={idx}
            chord={chordObj.chord}
            slots={chordObj.slots}
            maxSlots={maxSlots}
            barIndex={barIndex}
            chordIndex={idx}
            onSplit={() => splitChordAt(idx)}
            autoFocus={idx === 0 && barIndex === 0}
            inputRef={(el) => (chordRefs.current[idx] = el)}
            onMove={(dir) => move(idx, dir)}
            onChordChange={(value) => updateChord(sectionId, barIndex, idx, value)}
            onEnter={(e) => {
              const current = chords[idx];

              // CTRL/CMD + Enter: split
              if (e.ctrlKey || e.metaKey) {
                splitChordAt(idx);
                return;
              }

              // Shift + Enter: next bar
              if (e.shiftKey) {
                goToNextBar();
                return;
              }

              // Enter: if not last chord -> next chord
              const isLastChord = idx === chords.length - 1;
              if (!isLastChord) {
                focusChord(barIndex, idx + 1);
                return;
              }

              // If only chord fills bar -> next bar
              const isOnlyChord = chords.length === 1;
              const fillsWholeBar = current.slots === maxSlots;
              if (isOnlyChord && fillsWholeBar) {
                goToNextBar();
                return;
              }

              // else: create chord with remaining slots
              const used = chords.reduce((sum, c) => sum + c.slots, 0);
              const remaining = maxSlots - used;

              if (remaining <= 0) {
                goToNextBar();
                return;
              }

              chords.splice(idx + 1, 0, { chord: "", slots: remaining });
              normalizeSlots();
              setProject({ ...project });

              setTimeout(() => focusChord(barIndex, idx + 1), 0);
            }}
            onSlotsChange={(requestedSlots) => {
              requestedSlots = Math.max(1, Math.min(requestedSlots, maxSlots));

              // special: 1 chord only
              if (chords.length === 1 && idx === 0) {
                if (chords[0].slots === maxSlots && requestedSlots < maxSlots) {
                  requestedSlots = 2;
                }

                chords[0].slots = requestedSlots;
                const remaining = maxSlots - requestedSlots;

                if (remaining > 0) {
                  chords.push({ chord: "", slots: remaining });
                  setProject({ ...project });
                  setTimeout(() => focusChord(barIndex, 1), 0);
                  return;
                }

                setProject({ ...project });
                return;
              }

              const oldSlots = chords[idx].slots;

              const availableToTake = chords.reduce((acc, c, i) => {
                if (i === idx) return acc;
                return acc + Math.max(0, c.slots - 1);
              }, 0);

              const maxPossibleForThis = oldSlots + availableToTake;
              const newSlots = Math.max(1, Math.min(requestedSlots, maxPossibleForThis));
              const delta = newSlots - oldSlots;

              if (delta === 0) return;

              chords[idx].slots = newSlots;

              if (delta > 0) {
                let need = delta;

                for (let i = chords.length - 1; i >= 0; i--) {
                  if (i === idx) continue;
                  if (need === 0) break;

                  const reducible = Math.max(0, chords[i].slots - 1);
                  const take = Math.min(reducible, need);

                  chords[i].slots -= take;
                  need -= take;
                }
              } else {
                let give = -delta;

                if (idx + 1 < chords.length) {
                  chords[idx + 1].slots += give;
                  give = 0;
                } else if (idx - 1 >= 0) {
                  chords[idx - 1].slots += give;
                  give = 0;
                }
              }

              normalizeSlots();
              setProject({ ...project });
            }}
          onDelete={() => {
            const value = (chords[idx]?.chord ?? "").trim();

            // 1) Si tiene texto -> solo borrar texto
            if (value.length > 0) {
              updateChord(sectionId, barIndex, idx, "");
              return;
            }

            // 2) Si está vacío:

            // 2a) Si hay más de un acorde -> borrar el acorde
            if (chords.length > 1) {
              const removed = chords.splice(idx, 1)[0];
              chords[chords.length - 1].slots += removed.slots;

              normalizeSlots();
              setProject({ ...project });

              // foco al acorde anterior (o al nuevo idx si existe)
              setTimeout(() => {
                const nextIdx = Math.min(idx, chords.length - 1);
                focusChord(barIndex, nextIdx);
              }, 0);

              return;
            }

            // 2b) Si es el único acorde del compás -> borrar el compás entero
            // excepto si la sección solo tiene 1 compás
            if (section.bars.length <= 1) {
              // no se puede borrar el único compás, ya está vacío, no hacemos nada
              return;
            }

            deleteBarAt(sectionId, barIndex);

            // foco: intenta quedarse cerca (mismo índice si existe, o anterior)
            setTimeout(() => {
              const latestProject = useEditorStore.getState().project;
              const latestSection = latestProject.sections.find((s) => s.id === sectionId);
              if (!latestSection) return;

              const nextBarIndex = Math.min(barIndex, latestSection.bars.length - 1);
              const el = barRefs.current[nextBarIndex];
              el?.querySelector<HTMLInputElement>("input.chord-input")?.focus();
            }, 0);
          }}
          />
        ))}
      </div>
    );
  }
);

export default BarCell;