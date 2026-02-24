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
    const insertBarAfter = useEditorStore((s) => s.insertBarAfter);
    const moveBar = useEditorStore((s) => s.moveBar);

    // ✅ NUEVO: action del store para asegurar el siguiente compás
    const ensureNextBar = useEditorStore((s) => s.ensureNextBar);

    const section = project.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const bar = section.bars[barIndex];
    if (!bar) return null;

    const chords = bar.chords;

    const showPrimaryNumber = barIndex % 4 === 0;


    /** Garantiza SIEMPRE suma = maxSlots */
const normalizeSlots = () => {
  const total = chords.reduce((s, c) => s + c.slots, 0);
  if (total === maxSlots) return;

  const diff = maxSlots - total;

  // Ajustar el último acorde que pueda absorber el ajuste sin bajar de 1
  for (let i = chords.length - 1; i >= 0; i--) {
    const c = chords[i];
    const newVal = c.slots + diff;
    if (newVal >= 1) {
      c.slots = newVal;
      return;
    }
  }

  // Si llegamos aquí, fuerza un mínimo seguro
  chords[chords.length - 1].slots = Math.max(1, chords[chords.length - 1].slots + diff);
};

    const focusChord = (targetBarIndex: number, targetChordIndex: number) => {
      // mismo compás
      if (targetBarIndex === barIndex) {
        chordRefs.current[targetChordIndex]?.focus();
        return;
      }

      const targetEl = barRefs.current[targetBarIndex];
      if (!targetEl) return;

      // solo inputs de acordes
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

        // ir al compás anterior
        if (barIndex > 0) {
          const prevBar = section.bars[barIndex - 1];
          const lastChordIndex = Math.max(0, prevBar.chords.length - 1);
          focusChord(barIndex - 1, lastChordIndex);
        }
        return;
      }

      

      // next
      if (fromChordIndex < chords.length - 1) {
        focusChord(barIndex, fromChordIndex + 1);
        return;
      }

      // ir al compás siguiente (si no existe, lo creamos)
      const hasNextBar = Boolean(section.bars[barIndex + 1]);
      if (hasNextBar) {
        focusChord(barIndex + 1, 0);
        return;
      }

      createNextBar();
      // el focus al primer input del nuevo compás lo hace BarRow
    };

    // ✅ NUEVO: helper para saltar al siguiente compás (creándolo si no existe) y enfocar
    const goToNextBar = () => {
      const hasNextBar = Boolean(section.bars[barIndex + 1]);

      if (!hasNextBar) {
        // Creamos el compás siguiente en el store
        ensureNextBar(sectionId, barIndex);

        // BarRow renderiza el nuevo compás y su ref. Esperamos un tick y enfocamos.
        setTimeout(() => focusChord(barIndex + 1, 0), 0);
        return;
      }

      focusChord(barIndex + 1, 0);
    };

    const splitChordAt = (idxToSplit: number) => {
  const current = chords[idxToSplit];
  if (!current) return;

  // no se puede dividir más
  if (current.slots <= 1) return;

  const newSlots = Math.floor(current.slots / 2);
  current.slots -= newSlots;

  chords.splice(idxToSplit + 1, 0, {
    chord: "",
    slots: newSlots,
  });

  normalizeSlots();
  setProject({ ...project });

  // foco al nuevo acorde
  setTimeout(() => focusChord(barIndex, idxToSplit + 1), 0);
};

//HANDLERS



const handleInsertBarAfter = () => {
  insertBarAfter(sectionId, barIndex);

  // Enfocar el nuevo compás insertado
  setTimeout(() => {
    focusChord(barIndex + 1, 0);
  }, 0);
};

const handleDragStart = (e: React.DragEvent) => {
  document.body.classList.add("dragging-bars");
  e.dataTransfer.setData("text/plain", String(barIndex));
  e.dataTransfer.effectAllowed = "move";

  // Esto ayuda a que el drag se “enganche” bien en algunos navegadores
  const img = new Image();
  img.src =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  e.dataTransfer.setDragImage(img, 0, 0);
};

const handleDragEnd = () => {
  document.body.classList.remove("dragging-bars");
  document.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault(); // necesario para permitir drop
  e.dataTransfer.dropEffect = "move";
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const from = Number(e.dataTransfer.getData("text/plain"));
  const to = barIndex;

  if (Number.isNaN(from)) return;
  moveBar(sectionId, from, to);

  // opcional: foco al primer acorde del compás “en su nueva posición”
  setTimeout(() => {
    // cuando mueves hacia delante, el índice del elemento cambia
    const newIndex = from < to ? to - 1 : to;
    focusChord(newIndex, 0);
  }, 0);
};

    return (
      <div
        className={`bar-cell overflow-hidden chords-${chords.length}`}
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
        
          {/* handle de arrastre */}
          <button
            type="button"
            className="drag-handle"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            //onMouseDown={(e) => e.preventDefault()} // no perder foco raro
            aria-label="Arrastrar compás"
            title="Arrastrar compás"
          >
            ≡
          </button>


        {showPrimaryNumber && (
          <span className="bar-number primary">
            {barIndex + 1}
          </span>
        )}

        {/* Número secundario (solo para hover) */}
        <span className="bar-number hover-only">
          {barIndex + 1}
        </span>
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
          ↔
        </button>
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
            /** ENTER = comportamiento nuevo + fallback a split */
            onEnter={(e) => {
              const current = chords[idx];

              // 1) CTRL+ENTER: dividir siempre dentro del compás (aunque sea 4)
if (e.ctrlKey || e.metaKey) {
  splitChordAt(idx);
  return;

                const newSlots = Math.floor(current.slots / 2);
                current.slots -= newSlots;

                chords.splice(idx + 1, 0, {
                  chord: "",
                  slots: newSlots,
                });

                normalizeSlots();
                setProject({ ...project });
                setTimeout(() => focusChord(barIndex, idx + 1), 0);
                return;
              }

              // 2) SHIFT+ENTER: forzar siguiente compás
              if (e.shiftKey) {
                goToNextBar();
                return;
              }

              // ✅ NUEVO: Enter dentro del compás avanza al siguiente acorde si existe
              const isLastChord = idx === chords.length - 1;
              if (!isLastChord) {
                focusChord(barIndex, idx + 1);
                return;
              }

              // ✅ NUEVO: Si es el único acorde y ocupa todo el compás, Enter salta al siguiente compás
              const isOnlyChord = chords.length === 1;
              const fillsWholeBar = current.slots === maxSlots;

              if (isOnlyChord && fillsWholeBar) {
                goToNextBar();
                return;
              }

              // 3) ENTER normal dentro del compás:
              // Crear siguiente acorde con los slots restantes (en vez de "dividir a la mitad")
              const used = chords.reduce((sum, c) => sum + c.slots, 0);
              const remaining = maxSlots - used;

              // Si no queda espacio, significa que estás al final del compás: saltar al siguiente compás
              if (remaining <= 0) {
                goToNextBar();
                return;
              }

              chords.splice(idx + 1, 0, {
                chord: "",
                slots: remaining,
              });

              normalizeSlots();
              setProject({ ...project });
              setTimeout(() => focusChord(barIndex, idx + 1), 0);
            }}
            /** Cambiar slots */
onSlotsChange={(requestedSlots) => {
  // clamp básico
  requestedSlots = Math.max(1, Math.min(requestedSlots, maxSlots));

    // ✅ CASO ESPECIAL: solo 1 acorde en el compás
  if (chords.length === 1 && idx === 0) {
    // Opción "más intuitiva": si bajas desde 4, salta a 2 directamente
    // (si prefieres permitir 3, quita esta línea)
    if (chords[0].slots === maxSlots && requestedSlots < maxSlots) {
      requestedSlots = 2;
    }

    chords[0].slots = requestedSlots;

    const remaining = maxSlots - requestedSlots;

    // Si queda espacio, creamos el segundo acorde automáticamente
    if (remaining > 0) {
      chords.push({ chord: "", slots: remaining });

      setProject({ ...project });
      // foco al acorde nuevo para seguir escribiendo dentro del compás
      setTimeout(() => focusChord(barIndex, 1), 0);
      return;
    }

    // Si vuelve a ocupar todo el compás, nos quedamos con un solo acorde
    setProject({ ...project });
    return;
  }

  const n = chords.length;
  const oldSlots = chords[idx].slots;

  // Cuánto podemos "robar" a los demás sin bajarlos de 1
  const availableToTake = chords.reduce((acc, c, i) => {
    if (i === idx) return acc;
    return acc + Math.max(0, c.slots - 1);
  }, 0);

  // Máximo real que puede tener este acorde sin romper el compás
  const maxPossibleForThis = oldSlots + availableToTake;

  const newSlots = Math.max(1, Math.min(requestedSlots, maxPossibleForThis));
  const delta = newSlots - oldSlots;

  // Si no cambia, salimos
  if (delta === 0) return;

  chords[idx].slots = newSlots;

  if (delta > 0) {
    // Hemos aumentado este acorde, hay que reducir otros para compensar
    let need = delta;

    for (let i = chords.length - 1; i >= 0; i--) {
      if (i === idx) continue;
      if (need === 0) break;

      const reducible = Math.max(0, chords[i].slots - 1);
      const take = Math.min(reducible, need);

      chords[i].slots -= take;
      need -= take;
    }

    // need debería quedar en 0 por el clamp maxPossibleForThis
} else {
  // Hemos reducido este acorde, hay que sumar los tiempos liberados a otro(s)
  let give = -delta;

  // ✅ Preferencia: acorde siguiente
  if (idx + 1 < chords.length) {
    chords[idx + 1].slots += give;
    give = 0;
  } else if (idx - 1 >= 0) {
    // Si es el último, dárselo al anterior
    chords[idx - 1].slots += give;
    give = 0;
  }
}

  // Seguridad final
  normalizeSlots();
  setProject({ ...project });
}}
            /** Delete chord */
  onDelete={() => {
    // ✅ Si es el único acorde del compás, intentamos borrar compás (solo si es el último)
    if (chords.length === 1) {
      const isLastBar = barIndex === section.bars.length - 1;
      const canDeleteBar = isLastBar && section.bars.length > 1;

      if (canDeleteBar) {
        deleteLastBar(sectionId);

        // foco al último compás nuevo (que ahora será el anterior)
        setTimeout(() => {
          const newLastBarIndex = barIndex - 1;
          focusChord(newLastBarIndex, 0);
        }, 0);

        return;
      }

      // Si no se puede borrar (no es el último o es el único compás),
      // en vez de "no hacer nada", lo más natural es vaciar el acorde
      updateChord(sectionId, barIndex, 0, "");
      return;
    }

    // ✅ Caso normal: borrar acorde dentro del compás
    const removed = chords.splice(idx, 1)[0];
    chords[chords.length - 1].slots += removed.slots;

    normalizeSlots();
    setProject({ ...project });

    setTimeout(() => move(Math.min(idx, chords.length - 1), "prev"), 0);
  }}
          />
        ))}
      </div>
    );
  }
);

export default BarCell;