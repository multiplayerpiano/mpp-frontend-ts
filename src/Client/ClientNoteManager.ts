import { MPP } from "..";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";
import { Client } from "./Client";

export class ClientNoteManager {
  gClient: Client;
  gInterface: MultiplayerPianoClient;

  constructor(gClient: Client, gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.gClient = gClient;
    this.handleNotes();
  }
  handleNotes() {
    // Playing notes
    this.gClient.on("n", msg => {
      let t = msg.t - this.gClient.serverTimeOffset + this.gInterface.TIMING_TARGET - Date.now();
      let participant = this.gClient.findParticipantById(msg.p);
      if (this.gInterface.gPianoMutes.indexOf(participant._id!) !== -1)
        return;
      for (let i = 0; i < msg.n.length; i++) {
        let note = msg.n[i];
        let ms = t + (note.d || 0);
        if (ms < 0) {
          ms = 0;
        } else if (ms > 10000) continue;
        if (note.s) {
          this.gInterface.gPiano.stop(note.n, participant, ms);
        } else {
          let vel = (typeof note.v !== "undefined") ? parseFloat(note.v as unknown as string) : this.gInterface.DEFAULT_VELOCITY;
          if (!vel) vel = 0;
          else if (vel < 0) vel = 0;
          else if (vel > 1) vel = 1;
          this.gInterface.gPiano.play(note.n, vel, participant, ms);
          if (this.gInterface.synth.enableSynth) {
            this.gInterface.gPiano.stop(note.n, participant, ms + 1000);
          }
        }
      }
    });
  }
}