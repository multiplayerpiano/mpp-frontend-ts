import { Client } from "./Client";

export class ClientNoteManager {
  gClient: Client;

  constructor(gClient: Client) {
    this.gClient = gClient;
    this.handleNotes();
  }
  handleNotes() {
    // Playing notes
    this.gClient.on("n", msg => {
      let t = msg.t - this.gClient.serverTimeOffset + TIMING_TARGET - Date.now();
      let participant = this.gClient.findParticipantById(msg.p);
      if (gPianoMutes.indexOf(participant._id!) !== -1)
        return;
      for (let i = 0; i < msg.n.length; i++) {
        let note = msg.n[i];
        let ms = t + (note.d || 0);
        if (ms < 0) {
          ms = 0;
        } else if (ms > 10000) continue;
        if (note.s) {
          gPiano.stop(note.n, participant, ms);
        } else {
          let vel = (typeof note.v !== "undefined") ? parseFloat(note.v as unknown as string) : DEFAULT_VELOCITY;
          if (!vel) vel = 0;
          else if (vel < 0) vel = 0;
          else if (vel > 1) vel = 1;
          gPiano.play(note.n, vel, participant, ms);
          if (enableSynth) {
            gPiano.stop(note.n, participant, ms + 1000);
          }
        }
      }
    });
  }
}