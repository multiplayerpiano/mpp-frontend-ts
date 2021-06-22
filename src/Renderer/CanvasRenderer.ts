// Renderer classes

////////////////////////////////////////////////////////////////

class CanvasRenderer extends Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  blackKeyHeight: number;
  whiteKeyHeight: number;
  whiteKeyWidth: number;
  blackKeyWidth: number;
  blackKeyOffset: number;
  keyMovement: number;
  whiteBlipWidth: number;
  whiteBlipHeight: number;
  whiteBlipX: number;
  whiteBlipY: number;
  blackBlipWidth: number;
  blackBlipHeight: number;
  blackBlipY: number;
  blackBlipX: number;
  whiteKeyRender: HTMLCanvasElement;
  blackKeyRender: HTMLCanvasElement;
  shadowRender: HTMLCanvasElement[];
  //noteLyrics;

  constructor() {
    super();
  }

  init(piano: PianoAPI) {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
    piano.rootElement.appendChild(this.canvas);
    
    super.init(piano);
    
    // create render loop
    let self = this;
    let render = function() {
      self.redraw();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    // add event listeners
    let mouse_down: boolean = false;
    let last_key: PianoKey | null = null;
    $(piano.rootElement).mousedown(function(event) {
      mouse_down = true;
      //event.stopPropagation();
      event.preventDefault();

      let pos = CanvasRenderer.translateMouseEvent(event);
      let hit = self.getHit(pos.x, pos.y);
      if (hit) {
        press(hit.key.note, hit.v);
        last_key = hit.key;
      }
    });

    piano.rootElement.addEventListener("touchstart", function(event) {
      mouse_down = true;
      //event.stopPropagation();
      event.preventDefault();
      for (let i in event.changedTouches) {
        let pos = CanvasRenderer.translateMouseEvent(event.changedTouches[i]);
        let hit = self.getHit(pos.x, pos.y);
        if (hit) {
          press(hit.key.note, hit.v);
          last_key = hit.key;
        }
      }
    }, false);

    $(window).mouseup(function(event) {
      if (last_key) {
        release(last_key.note);
      }
      mouse_down = false;
      last_key = null;
    });
    /*$(piano.rootElement).mousemove(function(event) {
      if (!mouse_down) return;
      let pos = CanvasRenderer.translateMouseEvent(event);
      let hit = self.getHit(pos.x, pos.y);
      if (hit && hit.key != last_key) {
        press(hit.key.note, hit.v);
        last_key = hit.key;
      }
    });*/

    return this;
  }

  resize(width?: number, height?: number) {
    super.resize(width, height);
    if (this.width < 52 * 2) this.width = 52 * 2;
    if (this.height < this.width * 0.2) this.height = Math.floor(this.width * 0.2);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = this.width / window.devicePixelRatio + "px";
    this.canvas.style.height = this.height / window.devicePixelRatio + "px";

    // calculate key sizes
    this.whiteKeyWidth = Math.floor(this.width / 52);
    this.whiteKeyHeight = Math.floor(this.height * 0.9);
    this.blackKeyWidth = Math.floor(this.whiteKeyWidth * 0.75);
    this.blackKeyHeight = Math.floor(this.height * 0.5);

    this.blackKeyOffset = Math.floor(this.whiteKeyWidth - (this.blackKeyWidth / 2));
    this.keyMovement = Math.floor(this.whiteKeyHeight * 0.015);

    this.whiteBlipWidth = Math.floor(this.whiteKeyWidth * 0.7);
    this.whiteBlipHeight = Math.floor(this.whiteBlipWidth * 0.8);
    this.whiteBlipX = Math.floor((this.whiteKeyWidth - this.whiteBlipWidth) / 2);
    this.whiteBlipY = Math.floor(this.whiteKeyHeight - this.whiteBlipHeight * 1.2);
    this.blackBlipWidth = Math.floor(this.blackKeyWidth * 0.7);
    this.blackBlipHeight = Math.floor(this.blackBlipWidth * 0.8);
    this.blackBlipY = Math.floor(this.blackKeyHeight - this.blackBlipHeight * 1.2);
    this.blackBlipX = Math.floor((this.blackKeyWidth - this.blackBlipWidth) / 2);
    
    let ctx: CanvasRenderingContext2D;
    // prerender white key
    this.whiteKeyRender = document.createElement("canvas");
    this.whiteKeyRender.width = this.whiteKeyWidth;
    this.whiteKeyRender.height = this.height + 10;
    ctx = this.whiteKeyRender.getContext("2d")!;
    if (ctx.createLinearGradient) {
      var gradient = ctx.createLinearGradient(0, 0, 0, this.whiteKeyHeight);
      gradient.addColorStop(0, "#eee");
      gradient.addColorStop(0.75, "#fff");
      gradient.addColorStop(1, "#dad4d4");
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = "#fff";
    }
    ctx.strokeStyle = "#000";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.whiteKeyWidth - ctx.lineWidth, this.whiteKeyHeight - ctx.lineWidth);
    ctx.lineWidth = 4;
    ctx.fillRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.whiteKeyWidth - ctx.lineWidth, this.whiteKeyHeight - ctx.lineWidth);

    // prerender black key
    this.blackKeyRender = document.createElement("canvas");
    this.blackKeyRender.width = this.blackKeyWidth + 10;
    this.blackKeyRender.height = this.blackKeyHeight + 10;
    ctx = this.blackKeyRender.getContext("2d")!;
    if (ctx.createLinearGradient) {
      var gradient = ctx.createLinearGradient(0, 0, 0, this.blackKeyHeight);
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(1, "#444");
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = "#000";
    }
    ctx.strokeStyle = "#222";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 8;
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.blackKeyWidth - ctx.lineWidth, this.blackKeyHeight - ctx.lineWidth);
    ctx.lineWidth = 4;
    ctx.fillRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.blackKeyWidth - ctx.lineWidth, this.blackKeyHeight - ctx.lineWidth);

    // prerender shadows
    this.shadowRender = [];
    let y = -this.canvas.height * 2;
    for (let j = 0; j < 2; j++) {
      let canvas = document.createElement("canvas");
      this.shadowRender[j] = canvas;
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      let ctx = canvas.getContext("2d")!;
      let sharp = j ? true : false;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.keyMovement * 3;
      ctx.shadowOffsetY = -y + this.keyMovement;
      if (sharp) {
        ctx.shadowOffsetX = this.keyMovement;
      } else {
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = -y + this.keyMovement;
      }
      for (let i in this.piano.keys) {
        if (!this.piano.keys.hasOwnProperty(i)) continue;
        let key = this.piano.keys[i];
        if (key.sharp !== sharp) continue;

        if (key.sharp) {
          ctx.fillRect(this.blackKeyOffset + this.whiteKeyWidth * key.spatial + ctx.lineWidth / 2,
            y + ctx.lineWidth / 2,
            this.blackKeyWidth - ctx.lineWidth, this.blackKeyHeight - ctx.lineWidth);
        } else {
          ctx.fillRect(this.whiteKeyWidth * key.spatial + ctx.lineWidth / 2,
            y + ctx.lineWidth / 2,
            this.whiteKeyWidth - ctx.lineWidth, this.whiteKeyHeight - ctx.lineWidth);
        }
      }
    }

    // update key rects
    for (let i in this.piano.keys) {
      if (!this.piano.keys.hasOwnProperty(i)) continue;
      let key = this.piano.keys[i];
      if (key.sharp) {
        key.rect = new Rect(this.blackKeyOffset + this.whiteKeyWidth * key.spatial, 0,
          this.blackKeyWidth, this.blackKeyHeight);
      } else {
        key.rect = new Rect(this.whiteKeyWidth * key.spatial, 0,
          this.whiteKeyWidth, this.whiteKeyHeight);
      }
    }
  }
  
  visualize(key: PianoKey, color: string) {
    key.timePlayed = Date.now();
    key.blips.push({
      time: key.timePlayed,
      color: color
    });
  }

  redraw() {
    let now = Date.now();
    let timeLoadedEnd = now - 1000;
    let timePlayedEnd = now - 100;
    let timeBlipEnd = now - 1000;

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // draw all keys
    for (let j = 0; j < 2; j++) {
      this.ctx.globalAlpha = 1.0;
      this.ctx.drawImage(this.shadowRender[j], 0, 0);
      let sharp = j ? true : false;
      for (let i in this.piano.keys) {
        if (!this.piano.keys.hasOwnProperty(i)) continue;
        let key = this.piano.keys[i];
        if (key.sharp != sharp) continue;
        
        if (!key.loaded) {
          this.ctx.globalAlpha = 0.2;
        } else if (key.timeLoaded > timeLoadedEnd) {
          this.ctx.globalAlpha = ((now - key.timeLoaded) / 1000) * 0.8 + 0.2;
        } else {
          this.ctx.globalAlpha = 1.0;
        }
        let y = 0;
        if (key.timePlayed > timePlayedEnd) {
          y = Math.floor(this.keyMovement - (((now - key.timePlayed) / 100) * this.keyMovement));
        }
        let x = Math.floor(key.sharp ? this.blackKeyOffset + this.whiteKeyWidth * key.spatial :
          this.whiteKeyWidth * key.spatial);
        let image: HTMLCanvasElement;
        if (key.sharp == true) {
          image = this.blackKeyRender;
        } else {
          image = this.whiteKeyRender;
        }
        try {
          this.ctx.drawImage(image, x, y);
        } catch (err) {

        }

        // render blips
        if (key.blips.length) {
          let alpha = this.ctx.globalAlpha;
          let w: number, h: number;
          if (key.sharp) {
            x += this.blackBlipX;
            y = this.blackBlipY;
            w = this.blackBlipWidth;
            h = this.blackBlipHeight;
          } else {
            x += this.whiteBlipX;
            y = this.whiteBlipY;
            w = this.whiteBlipWidth;
            h = this.whiteBlipHeight;
          }
          for (let b = 0; b < key.blips.length; b++) {
            let blip = key.blips[b];
            if (blip.time > timeBlipEnd) {
              this.ctx.fillStyle = blip.color;
              this.ctx.globalAlpha = alpha - ((now - blip.time) / 1000);
              this.ctx.fillRect(x, y, w, h);
            } else {
              key.blips.splice(b, 1);
              --b;
            }
            y -= Math.floor(h * 1.1);
          }
        }
      }
    }
    this.ctx.restore();
  }
  
  /*renderNoteLyrics() {
    for (let part_id in this.noteLyrics) {
      if (!this.noteLyrics.hasOwnProperty(i)) continue;
      let lyric = this.noteLyrics[part_id];
      let lyric_x = x;
      let lyric_y = this.whiteKeyHeight + 1;
      this.ctx.fillStyle = key.lyric.color;
      let alpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = alpha - ((now - key.lyric.time) / 1000);
      this.ctx.fillRect(x, y, 10, 10);
    }
  }*/

  getHit(x: number, y: number): {key: PianoKey, v: number} | null {
    for (let j = 0; j < 2; j++) {
      let sharp = j ? false : true; // black keys first
      for (let i in this.piano.keys) {
        if (!this.piano.keys.hasOwnProperty(i)) continue;
        let key = this.piano.keys[i];
        if (key.sharp != sharp) continue;
        if (key.rect.contains(x, y)) {
          let v = y / (key.sharp ? this.blackKeyHeight : this.whiteKeyHeight);
          v += 0.25;
          v *= DEFAULT_VELOCITY;
          if (v > 1.0) v = 1.0;
          return {
            key: key,
            v: v
          };
        }
      }
    }
    return null;
  }

  isSupported(): boolean {
    let canvas = document.createElement("canvas");
    return !!(canvas.getContext && canvas.getContext("2d"));
  }
  
  static translateMouseEvent(evt: Touch | JQuery.MouseDownEvent<HTMLElement, null, HTMLElement, HTMLElement>): {x: number, y: number} {
    let element: HTMLElement | null = evt.target as HTMLElement;
    let offx = 0;
    let offy = 0;
    do {
      if (!element) break; // wtf, wtf?
      offx += element.offsetLeft;
      offy += element.offsetTop;
    } while (element = element.offsetParent as HTMLElement | null);
    return {
      x: (evt.pageX - offx) * window.devicePixelRatio,
      y: (evt.pageY - offy) * window.devicePixelRatio
    }
  }
}