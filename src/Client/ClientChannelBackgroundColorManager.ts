import { Color } from "../Color";
import { Client } from "./Client";

export class ClientChannelBackgroundColorManager {
  gClient: Client;
  old_color1: Color;
  old_color2: Color;


  constructor(gClient: Client) {
    this.gClient = gClient;
    this.old_color1 = new Color("#000000");
    this.old_color2 = new Color("#000000");
    this.handleBackgroundColor();
  }

  setColor(hex: string, hex2: string) {
    let color1 = new Color(hex);
    let color2 = new Color(hex2 || hex);
    if (!hex2)
      color2.add(-0x40, -0x40, -0x40);

    let bottom = document.getElementById("bottom")!;

    let duration = 500;
    let step = 0;
    let steps = 30;
    let step_ms = duration / steps;
    let difference = new Color(color1.r, color1.g, color1.b);
    difference.r -= this.old_color1.r;
    difference.g -= this.old_color1.g;
    difference.b -= this.old_color1.b;
    let inc1 = new Color(difference.r / steps, difference.g / steps, difference.b / steps);
    difference = new Color(color2.r, color2.g, color2.b);
    difference.r -= this.old_color2.r;
    difference.g -= this.old_color2.g;
    difference.b -= this.old_color2.b;
    let inc2 = new Color(difference.r / steps, difference.g / steps, difference.b / steps);
    let iv = setInterval(function () {
      this.old_color1.add(inc1.r, inc1.g, inc1.b);
      this.old_color2.add(inc2.r, inc2.g, inc2.b);
      document.body.style.background = "radial-gradient(ellipse at center, " + this.old_color1.toHexa() + " 0%," + this.old_color2.toHexa() + " 100%)";
      bottom.style.background = this.old_color2.toHexa();
      if (++step >= steps) {
        clearInterval(iv);
        this.old_color1 = color1;
        this.old_color2 = color2;
        document.body.style.background = "radial-gradient(ellipse at center, " + color1.toHexa() + " 0%," + color2.toHexa() + " 100%)";
        bottom.style.background = color2.toHexa();
      }
    }, step_ms);
  }

  setColorToDefault() {
    this.setColor("#000000", "#000000");
  }

  handleBackgroundColor() {
    // Background color
    this.setColorToDefault();

    this.gClient.on("ch", function (ch) {
      if (ch.ch.settings) {
        if (ch.ch.settings.color) {
          this.setColor(ch.ch.settings.color, ch.ch.settings.color2!);
        } else {
          this.setColorToDefault();
        }
      }
    });
  }
}