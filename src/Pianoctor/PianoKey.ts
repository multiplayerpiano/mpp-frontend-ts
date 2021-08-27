// Pianoctor

////////////////////////////////////////////////////////////////

import { Rect } from "../Renderer/Rect";
import { Blip } from "../Renderer/Renderer";

export class PianoKey {
  note: string;
  baseNote: string;
  octave: number;
  sharp: boolean;
  loaded: boolean;
  timeLoaded: number;
  domElement: HTMLElement | null;
  timePlayed: number;
  blips: Blip[];
  spatial: number;
  rect: Rect;
  
  constructor(note: string, octave: number) {
    this.note = note + octave;
    this.baseNote = note;
    this.octave = octave;
    this.sharp = note.indexOf("s") != -1;
    this.loaded = false;
    this.timeLoaded = 0;
    this.domElement = null;
    this.timePlayed = 0;
    this.blips = [];
  }
}