import React, { useEffect, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { playProject, stopPlayback, getIsPlaying } from "../audio/audioEngine";
import "./TransportBar.css";

const TransportBar: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const beatsPerBar = useEditorStore((s) => s.beatsPerBar);

  const [isPlaying, setIsPlaying] = useState(getIsPlaying());

  useEffect(() => {
    return () => {
      stopPlayback();
      setIsPlaying(false);
    };
  }, []);

  const handlePlay = async () => {
    try {
      await playProject(project, beatsPerBar, {
        onEnded: () => {
          setIsPlaying(false);
        },
      });

      setIsPlaying(true);
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    stopPlayback();
    setIsPlaying(false);
  };

  return (
    <div className="transport-bar">
      <button
        type="button"
        className="transport-btn transport-btn--play"
        onClick={handlePlay}
        disabled={isPlaying}
      >
        ▶️
      </button>

      <button
        type="button"
        className="transport-btn transport-btn--stop"
        onClick={handleStop}
        disabled={!isPlaying}
      >
        ⏹️
      </button>
    </div>
  );
};

export default TransportBar;