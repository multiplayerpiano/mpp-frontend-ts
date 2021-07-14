import { MPP } from "..";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

// Send cursor updates
export class Cursor {
  mx: number;
  last_mx: number;
  my: number;
  last_my: number;
  gInterface: MultiplayerPianoClient;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.mx = 0;
    this.last_mx = -10;
    this.my = 0;
    this.last_my = -10;
    this.updateCursor();
    this.bindEventListeners();
  }
  updateCursor() {
    setInterval(() => {
      if (Math.abs(this.mx - this.last_mx) > 0.1 || Math.abs(this.my - this.last_my) > 0.1) {
        this.last_mx = this.mx;
        this.last_my = this.my;
        this.gInterface.clientManager.gClient.sendArray([{
          m: "m",
          x: this.mx,
          y: this.my
        }]);
        if (this.gInterface.gSeeOwnCursor) {
          this.gInterface.clientManager.gClient.emit("m", {
            m: "m",
            id: this.gInterface.clientManager.gClient.participantId!,
            x: this.mx,
            y: this.my
          });
        }
        let part = this.gInterface.clientManager.gClient.getOwnParticipant();
        if (part) {
          part.x = this.mx;
          part.y = this.my;
        }
      }
    }, 50);
  }

  bindEventListeners() {
    $(document).on("mousemove", event => { //! ANCHOR - Changed from .mousemove() to .on('mousemove') - Hri7566
      this.mx = parseFloat(((event.pageX / $(window).width()!) * 100).toFixed(2));
      this.my = parseFloat(((event.pageY / $(window).height()!) * 100).toFixed(2));
    });
  }
  
}