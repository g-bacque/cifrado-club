import * as Tone from "tone";

export type ParsedChordQuality =
  | "maj"
  | "min"
  | "7"
  | "maj7"
  | "min7"
  | "dim";

export interface ParsedChord {
  root: string;
  quality: ParsedChordQuality;
  bass?: string;
}

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const SEMITONE_TO_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function normalizeNote(note: string): string | null {
  const clean = note.trim();
  if (!clean) return null;

  const first = clean[0].toUpperCase();
  const accidental = clean[1] === "#" || clean[1] === "b" ? clean[1] : "";
  const candidate = `${first}${accidental}`;

  return candidate in NOTE_TO_SEMITONE ? candidate : null;
}

function detectQuality(raw: string): ParsedChordQuality {
  const q = raw.trim();

  if (!q) return "maj";

  if (/^maj7$/i.test(q)) return "maj7";
  if (/^(m7|min7|-7)$/i.test(q)) return "min7";
  if (/^7$/i.test(q)) return "7";
  if (/^(m|min|-)$/i.test(q)) return "min";
  if (/^dim$/i.test(q)) return "dim";

  return "maj";
}

export function parseChordSymbol(symbol: string): ParsedChord | null {
  const input = symbol.trim();
  if (!input) return null;
  if (/^n\.?c\.?$/i.test(input)) return null;

  const [mainPart, bassPart] = input.split("/");

  const mainMatch = mainPart.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!mainMatch) return null;

  const [, rootLetter, accidental, rawQuality] = mainMatch;
  const root = normalizeNote(`${rootLetter}${accidental}`);
  if (!root) return null;

  const bass = bassPart ? normalizeNote(bassPart) ?? undefined : undefined;
  const quality = detectQuality(rawQuality);

  return { root, quality, bass };
}

function noteToMidi(note: string, octave: number): number {
  const semitone = NOTE_TO_SEMITONE[note];
  return 12 * (octave + 1) + semitone;
}

function midiToNote(midi: number): string {
  return Tone.Frequency(midi, "midi").toNote();
}

function getChordIntervals(quality: ParsedChordQuality): number[] {
  switch (quality) {
    case "maj":
      return [0, 4, 7];
    case "min":
      return [0, 3, 7];
    case "7":
      return [0, 4, 7, 10];
    case "maj7":
      return [0, 4, 7, 11];
    case "min7":
      return [0, 3, 7, 10];
    case "dim":
      return [0, 3, 6];
    default:
      return [0, 4, 7];
  }
}

export function getChordNotes(symbol: string): string[] {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return [];

  const rootMidi = noteToMidi(parsed.root, 4);
  const intervals = getChordIntervals(parsed.quality);

  const chordNotes = intervals.map((interval) => midiToNote(rootMidi + interval));

  if (parsed.bass) {
    const bassMidi = noteToMidi(parsed.bass, 3);
    return [midiToNote(bassMidi), ...chordNotes];
  }

  return chordNotes;
}

export function normalizeChordLabel(symbol: string): string {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return symbol;

  const qualityLabel =
    parsed.quality === "maj"
      ? ""
      : parsed.quality === "min"
      ? "m"
      : parsed.quality === "min7"
      ? "m7"
      : parsed.quality;

  return `${parsed.root}${qualityLabel}${parsed.bass ? `/${parsed.bass}` : ""}`;
}