// Pianoctor

////////////////////////////////////////////////////////////////

class Note {
  note: string;
  octave: number;
  
  constructor(note: string, octave: number = 0) {
    this.note = note;
    this.octave = octave;
  }
}