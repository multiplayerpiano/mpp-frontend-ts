// Notification class

////////////////////////////////////////////////////////////////

import { EventEmitter } from "events";
import * as $ from "jquery";

export interface NotificationInput {
	id?: string,
	title?: string,
	text?: string,
	html?: string | HTMLElement,
	target?: string,
	duration?: number
	class?: string;
}

export class Notification extends EventEmitter {
  id: string;
  title: string;
  text: string;
  html: string | HTMLElement;
  target: JQuery<HTMLElement>;
  duration: number;
  domElement: JQuery<HTMLElement>;
  class: string;
  onResizeEventFunc: () => void;

  constructor(par: NotificationInput = {}) {
    super();

    this.id = "Notification-" + (par.id || Math.random());
    this.title = par.title || "";
    this.text = par.text || "";
    this.html = par.html || "";
    this.target = $(par.target || "#piano");
    this.duration = par.duration || 30000;
    this["class"] = par["class"] || "classic";
    this.onResizeEventFunc = this.onresize.bind(this);

    let self = this;
    let eles = $("#" + this.id);
    if (eles.length > 0) {
      eles.remove();
    }
    this.domElement = $('<div class="notification"><div class="notification-body"><div class="title"></div>' +
      '<div class="text"></div></div><div class="x">Ⓧ</div></div>');
    this.domElement[0].id = this.id;
    this.domElement.addClass(this["class"]);
    this.domElement.find(".title").text(this.title);
    if (this.text.length > 0) {
      this.domElement.find(".text").text(this.text);
    } else if (this.html instanceof HTMLElement) {
      this.domElement.find(".text")[0].appendChild(this.html);
    } else if (this.html.length > 0) {
      this.domElement.find(".text").html(this.html);
    }
    document.body.appendChild(this.domElement.get(0));

    this.position();
    window.addEventListener("resize", this.onResizeEventFunc);

    this.domElement.find(".x").click(function() {
      self.close();
    });

    if (this.duration > 0) {
      setTimeout(function() {
        self.close();
      }, this.duration);
    }
  }
  
  onresize() {
    this.position();
  }

  position() {
    let pos = this.target.offset()!;
    let x = pos.left - (this.domElement.width()! / 2) + (this.target.width()! / 4);
    let y = pos.top - this.domElement.height()! - 8;
    let width = this.domElement.width()!;
    if (x + width > $("body").width()!) {
      x -= ((x + width) - $("body").width()!);
    }
    if (x < 0) x = 0;
    this.domElement.offset({
      left: x,
      top: y
    });
  }

  close() {
    let self = this;
    window.removeEventListener("resize", this.onResizeEventFunc);
    this.domElement.fadeOut(500, function() {
      self.domElement.remove();
      self.emit("close");
    });
  }
}