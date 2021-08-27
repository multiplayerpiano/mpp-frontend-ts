import { MPP } from "..";
import { NoteQuota } from "./NoteQuota";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

// NoteQuota
export class NoteQuotaHandler {
  last_rat: number;
  nqjq: JQuery<HTMLElement>;
  gInterface: MultiplayerPianoClient;
  noteQuota: NoteQuota;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.last_rat = 0;
    this.nqjq = $("#quota .value");
    this.bindClientEventListeners();
    let self = this;
    this.noteQuota = new NoteQuota(function(points) {
      // update UI
      let rat = (points / this.max) * 100;
      if (rat <= self.last_rat)
        self.nqjq.stop(true, true).css("width", rat.toFixed(0) + "%");
      else
        self.nqjq.stop(true, true).animate({
          "width": rat.toFixed(0) + "%"
        }, 2000, "linear");
      self.last_rat = rat;
    });
    window.setInterval(() => {
      this.noteQuota.tick();
    }, 2000);
  }

  bindClientEventListeners() {
    this.gInterface.clientManager.gClient.on("nq", nq_params => {
      this.noteQuota.setParams(nq_params);
    });
    this.gInterface.clientManager.gClient.on("disconnect", () => {
      this.noteQuota.setParams(NoteQuota.PARAMS_OFFLINE);
    });
  }
}