import { useEditorStore } from "../store/editorStore";

export default function EditorToolbar() {
  const showDurationControls = useEditorStore(
    (s) => s.showDurationControls
  );

  const toggleDurationControls = useEditorStore(
    (s) => s.toggleDurationControls
  );

  return (
    <div className="flex gap-2 p-2 border-b">
      <button
        onClick={toggleDurationControls}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
      >
        {showDurationControls
          ? "Ocultar duraciones"
          : "Mostrar duraciones"}
      </button>
    </div>
  );
}