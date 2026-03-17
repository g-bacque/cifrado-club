import * as Tone from "tone";
import type { Project } from "../store/editorStore";
import { getChordNotes } from "../utils/chordParser";
import { getElectricPiano, releaseAllNotes } from "./instruments";

export interface PlaybackEvent {
  chordSymbol: string;
  notes: string[];
  startBeats: number;
  durationBeats: number;
  sectionId: string;
  barIndex: number;
  chordIndex: number;
}

type PlaybackPosition = {
  sectionId: string;
  barIndex: number;
  chordIndex: number;
} | null;

let isPlaying = false;
let playbackEndedCallback: (() => void) | null = null;

let playbackPosition: PlaybackPosition = null;
let playbackListeners: Array<(pos: PlaybackPosition) => void> = [];

export function subscribeToPlaybackPosition(
  listener: (pos: PlaybackPosition) => void
) {
  playbackListeners.push(listener);

  return () => {
    playbackListeners = playbackListeners.filter((l) => l !== listener);
  };
}

function emitPlaybackPosition(pos: PlaybackPosition) {
  playbackPosition = pos;
  playbackListeners.forEach((listener) => listener(pos));
}

export function buildPlaybackEvents(
  project: Project,
  defaultBeatsPerBar: number
): PlaybackEvent[] {
  const events: PlaybackEvent[] = [];
  let cursorBeats = 0;

  for (const section of project.sections) {
    section.bars.forEach((bar, barIndex) => {
      const effectiveBeats = bar.beats ?? defaultBeatsPerBar;
      let insideBarCursor = 0;

      bar.chords.forEach((chordEvent, chordIndex) => {
        const symbol = chordEvent.chord.trim();
        const durationBeats = Math.max(1, chordEvent.slots || 1);

        if (symbol) {
          const notes = getChordNotes(symbol);

          if (notes.length > 0) {
            events.push({
              chordSymbol: symbol,
              notes,
              startBeats: cursorBeats + insideBarCursor,
              durationBeats,
              sectionId: section.id,
              barIndex,
              chordIndex,
            });
          }
        }

        insideBarCursor += durationBeats;
      });

      cursorBeats += effectiveBeats;
    });
  }

  return events;
}

interface PlayProjectOptions {
  onEnded?: () => void;
}

export async function playProject(
  project: Project,
  beatsPerBar: number,
  options?: PlayProjectOptions
): Promise<void> {
  stopPlayback();

  await Tone.start();

  const transport = Tone.getTransport();
  const synth = getElectricPiano();
  const events = buildPlaybackEvents(project, beatsPerBar);

  playbackEndedCallback = options?.onEnded ?? null;

  transport.stop();
  transport.cancel();
  transport.position = 0;
  transport.bpm.value = project.tempo || 120;

  const quarterNoteSeconds = 60 / (project.tempo || 120);

  events.forEach((event) => {
    const startSeconds = event.startBeats * quarterNoteSeconds;
    const durationSeconds = event.durationBeats * quarterNoteSeconds;

    transport.schedule((time) => {
      synth.triggerAttackRelease(event.notes, durationSeconds, time);

      emitPlaybackPosition({
        sectionId: event.sectionId,
        barIndex: event.barIndex,
        chordIndex: event.chordIndex,
      });
    }, startSeconds);
  });

  const totalDurationBeats = project.sections.reduce((sum, section) => {
    return (
      sum +
      section.bars.reduce(
        (barSum, bar) => barSum + (bar.beats ?? beatsPerBar),
        0
      )
    );
  }, 0);

  const totalDurationSeconds = totalDurationBeats * quarterNoteSeconds;

  transport.scheduleOnce(() => {
    isPlaying = false;
    transport.stop();
    transport.cancel();
    releaseAllNotes();
    emitPlaybackPosition(null);

    const cb = playbackEndedCallback;
    playbackEndedCallback = null;
    cb?.();
  }, totalDurationSeconds + 0.05);

  isPlaying = true;
  transport.start();
}

export function stopPlayback() {
  const transport = Tone.getTransport();

  transport.stop();
  transport.cancel();
  transport.position = 0;

  releaseAllNotes();
  emitPlaybackPosition(null);

  isPlaying = false;
  playbackEndedCallback = null;
}

export function getIsPlaying() {
  return isPlaying;
}