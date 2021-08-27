import { Client } from "./Client";
import * as $ from "jquery";

export class ClientCrownManager {
  gClient: Client;
  jqcrown: JQuery<HTMLElement>;
  jqcountdown: JQuery<HTMLElement>;
  countdown_interval: number;

  constructor(gClient: Client) {
    this.gClient = gClient;
    this.jqcrown = $('<div id="crown"></div>').appendTo(document.body).hide();
    this.jqcountdown = $('<span></span>').appendTo(this.jqcrown);
    this.handleCrown();
  }
  handleCrown() {
    // Handle changes to crown
		this.jqcrown.click(() => {
			this.gClient.sendArray([{
				m: "chown",
				id: this.gClient.participantId!
			}]);
		});
		this.gClient.on("ch", msg => {
			if (msg.ch.crown) {
				let crown = msg.ch.crown;
				if (!crown.participantId || !this.gClient.ppl[crown.participantId]) {
					let land_time = crown.time + 2000 - this.gClient.serverTimeOffset;
					let avail_time = crown.time + 15000 - this.gClient.serverTimeOffset;
					this.jqcountdown.text("");
					this.jqcrown.show();
					if (land_time - Date.now() <= 0) {
						this.jqcrown.css({
							"left": crown.endPos.x + "%",
							"top": crown.endPos.y + "%"
						});
					} else {
						this.jqcrown.css({
							"left": crown.startPos.x + "%",
							"top": crown.startPos.y + "%"
						});
						this.jqcrown.addClass("spin");
						this.jqcrown.animate({
							"left": crown.endPos.x + "%",
							"top": crown.endPos.y + "%"
						}, 2000, "linear", () => {
							this.jqcrown.removeClass("spin");
						});
					}
					clearInterval(this.countdown_interval);
					this.countdown_interval = window.setInterval(() => {
						let time = Date.now();
						if (time >= land_time) {
							let ms = avail_time - time;
							if (ms > 0) {
								this.jqcountdown.text(Math.ceil(ms / 1000) + "s");
							} else {
								this.jqcountdown.text("");
								clearInterval(this.countdown_interval);
							}
						}
					}, 1000);
				} else {
					this.jqcrown.hide();
				}
			} else {
				this.jqcrown.hide();
			}
		});
		this.gClient.on("disconnect", (() => {
			this.jqcrown.fadeOut(2000);
		}));
  }
}