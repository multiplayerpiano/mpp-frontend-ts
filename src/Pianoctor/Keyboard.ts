import { MPP } from "..";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class Keyboard {
  gAutoSustain: boolean;
  gSustain: boolean;
  gHeldNotes: Record<string, boolean> = {};
  gSustainedNotes: Record<string, boolean> = {};
  gInterface: MultiplayerPianoClient;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.gAutoSustain = false;
    this.gSustain = false;
    this.gHeldNotes = {};
    this.gSustainedNotes = {};
  }

  press(id: string, vol: number = this.gInterface.DEFAULT_VELOCITY) {
    if (!this.gInterface.clientManager.gClient.preventsPlaying() && this.gInterface.gNoteQuotaHandler.noteQuota.spend(1)) {
      this.gHeldNotes[id] = true;
      this.gSustainedNotes[id] = true;
     this.gInterface.gPiano.play(id, vol, this.gInterface.clientManager.gClient.getOwnParticipant(), 0);
      this.gInterface.clientManager.gClient.startNote(id, vol);
    }
  }

  release(id: string) {
    if (this.gHeldNotes[id]) {
      this.gHeldNotes[id] = false;
      if ((this.gAutoSustain || this.gSustain) && !this.gInterface.synth.enableSynth) {
        this.gSustainedNotes[id] = true;
      } else {
        if (this.gInterface.gNoteQuotaHandler.noteQuota.spend(1)) {
         this.gInterface.gPiano.stop(id, this.gInterface.clientManager.gClient.getOwnParticipant(), 0);
          this.gInterface.clientManager.gClient.stopNote(id);
          this.gSustainedNotes[id] = false;
        }
      }
    }
  }

  pressSustain() {
    this.gSustain = true;
  }

  releaseSustain() {
    this.gSustain = false;
    if (!this.gAutoSustain) {
      for (let id in this.gSustainedNotes) {
        if (this.gSustainedNotes.hasOwnProperty(id) && this.gSustainedNotes[id] && !this.gHeldNotes[id]) {
          this.gSustainedNotes[id] = false;
          if (this.gInterface.gNoteQuotaHandler.noteQuota.spend(1)) {
           this.gInterface.gPiano.stop(id, this.gInterface.clientManager.gClient.getOwnParticipant(), 0);
            this.gInterface.clientManager.gClient.stopNote(id);
          }
        }
      }
    }
  }

}