import * as Tone from "tone";

let electricPiano: Tone.PolySynth<Tone.Synth> | null = null;

export function getElectricPiano() {
  if (electricPiano) return electricPiano;

  electricPiano = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.35,
      release: 1.2,
    },
  }).toDestination();

  electricPiano.volume.value = -10;

  return electricPiano;
}

export function releaseAllNotes() {
  if (electricPiano) {
    electricPiano.releaseAll();
  }
}

export function disposeInstruments() {
  if (electricPiano) {
    electricPiano.dispose();
    electricPiano = null;
  }
}