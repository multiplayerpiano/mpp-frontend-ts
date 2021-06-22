class Keyboard {
  gAutoSustain: boolean;
  gSustain: boolean;
  gHeldNotes: Record<string, boolean> = {};
  gSustainedNotes: Record<string, boolean> = {};

  constructor() {
    this.gAutoSustain = false;
    this.gSustain = false;
    this.gHeldNotes = {};
    this.gSustainedNotes = {};
  }

  press(id: string, vol: number = DEFAULT_VELOCITY) {
    if (!gClient.preventsPlaying() && gNoteQuota.spend(1)) {
      gHeldNotes[id] = true;
      gSustainedNotes[id] = true;
      gPiano.play(id, vol, gClient.getOwnParticipant(), 0);
      gClient.startNote(id, vol);
    }
  }

  release(id: string) {
    if (gHeldNotes[id]) {
      gHeldNotes[id] = false;
      if ((gAutoSustain || gSustain) && !enableSynth) {
        gSustainedNotes[id] = true;
      } else {
        if (gNoteQuota.spend(1)) {
          gPiano.stop(id, gClient.getOwnParticipant(), 0);
          gClient.stopNote(id);
          gSustainedNotes[id] = false;
        }
      }
    }
  }

  pressSustain() {
    gSustain = true;
  }

  releaseSustain() {
    gSustain = false;
    if (!gAutoSustain) {
      for (let id in gSustainedNotes) {
        if (gSustainedNotes.hasOwnProperty(id) && gSustainedNotes[id] && !gHeldNotes[id]) {
          gSustainedNotes[id] = false;
          if (gNoteQuota.spend(1)) {
            gPiano.stop(id, gClient.getOwnParticipant(), 0);
            gClient.stopNote(id);
          }
        }
      }
    }
  }

}