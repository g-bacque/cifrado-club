import { useEffect, useState } from "react";
import { subscribeToPlaybackPosition } from "../audio/audioEngine";

type PlaybackPosition = {
  sectionId: string;
  barIndex: number;
  chordIndex: number;
} | null;

export function usePlaybackPosition(): PlaybackPosition {
  const [pos, setPos] = useState<PlaybackPosition>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPlaybackPosition(setPos);
    return unsubscribe;
  }, []);

  return pos;
}