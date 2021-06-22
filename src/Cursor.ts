// Send cursor updates
class Cursor {
  mx: number;
  last_mx: number;
  my: number;
  last_my: number;

  constructor() {
    this.mx = 0;
    this.last_mx = -10;
    this.my = 0;
    this.last_my = -10;
    this.updateCursor();
  }
  updateCursor() {
    setInterval(function() {
      if (Math.abs(this.mx - this.last_mx) > 0.1 || Math.abs(this.my - this.last_my) > 0.1) {
        this.last_mx = this.mx;
        this.last_my = this.my;
        gClient.sendArray([{
          m: "m",
          x: this.mx,
          y: this.my
        }]);
        if (gSeeOwnCursor) {
          gClient.emit("m", {
            m: "m",
            id: gClient.participantId!,
            x: this.mx,
            y: this.my
          });
        }
        let part = gClient.getOwnParticipant();
        if (part) {
          part.x = this.mx;
          part.y = this.my;
        }
      }
    }, 50);
  }
  
}