// chatctor

////////////////////////////////////////////////////////////////

import { MPP } from "..";
import {
  ChatMessage,
  InMessageA,
  InMessageC,
  InMessageCh,
} from "../Client/Client";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class Chat {
  gInterface: MultiplayerPianoClient;
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.bindClientEventListeners();
    this.bindChatEventListeners();
  }

  show() {
    $("#chat").fadeIn();
  }

  hide() {
    $("#chat").fadeOut();
  }

  clear() {
    $("#chat li").remove();
  }

  scrollToBottom() {
    let ele = $("#chat ul").get(0) as HTMLUListElement;
    ele.scrollTop = ele.scrollHeight - ele.clientHeight;
  }

  blur() {
    if ($("#chat").hasClass("chatting")) {
      ($("#chat input").get(0) as any).blur();
      $("#chat").removeClass("chatting");
      this.gInterface.chat.scrollToBottom();
      this.gInterface.keyboardHandler.captureKeyboard();
    }
  }

  send(message: string) {
    this.gInterface.clientManager.gClient.sendArray([
      {
        m: "a",
        message: message,
      },
    ]);
  }

  receive(msg: ChatMessage) {
    if (this.gInterface.gChatMutes.indexOf(msg.p._id!) != -1) return;
    let li = $('<li><span class="name"/><span class="message"/>'); //LOOK HERE
    li.find(".name").text(msg.p.name + ":");
    li.append(`<span class="message"/>`); //ADDED THIS! WHAT THE HECK JQUERY
    li.css("color", msg.p.color || "white");
    li.find(".message").text(msg.a);

    $("#chat ul").append(li);

    let eles = $("#chat ul li").get() as HTMLElement[];
    for (let i = 1; i <= 50 && i <= eles.length; i++) {
      eles[eles.length - i].style.opacity = String(1.0 - i * 0.03);
    }
    if (eles.length > 50) {
      eles[0].style.display = "none";
    }
    if (eles.length > 256) {
      $(eles[0]).remove();
    }

    // scroll to bottom if not "chatting" or if not scrolled up
    if (!$("#chat").hasClass("chatting")) {
      this.gInterface.chat.scrollToBottom();
    } else {
      let ele = $("#chat ul").get(0) as HTMLUListElement;
      if (ele.scrollTop > ele.scrollHeight - ele.offsetHeight - 50)
        this.gInterface.chat.scrollToBottom();
    }
  }

  bindClientEventListeners() {
    this.gInterface.clientManager.gClient.on("ch", (msg: InMessageCh) => {
      if (msg.ch.settings.chat) {
        this.show();
      } else {
        this.hide();
      }
    });
    this.gInterface.clientManager.gClient.on("c", (msg: InMessageC) => {
      this.clear();
      if (msg.c) {
        for (let i = 0; i < msg.c.length; i++) {
          this.receive(msg.c[i]);
        }
      }
    });
    this.gInterface.clientManager.gClient.on("a", (msg: InMessageA) => {
      this.receive(msg);
    });
  }

  bindChatEventListeners() {
    $("#chat input").on("focus", (evt) => {
      this.gInterface.keyboardHandler.releaseKeyboard();
      $("#chat").addClass("chatting");
      this.gInterface.chat.scrollToBottom();
    });
    /*$("#chat input").on("blur", evt => {
      captureKeyboard();
      $("#chat").removeClass("chatting");
      chat.scrollToBottom();
    });*/
    $(document).mousedown((evt) => {
      if (!($("#chat").has(evt.target as unknown as Element).length > 0)) {
        this.gInterface.chat.blur();
      }
    });
    document.addEventListener("touchstart", (event) => {
      for (let i in event.changedTouches) {
        let touch = event.changedTouches[i];
        if (!($("#chat").has(touch.target as unknown as Element).length > 0)) {
          this.gInterface.chat.blur();
        }
      }
    });
    $(document).on("keydown", (evt) => {
      // TODO keycode deprecations - Hri7566
      if ($("#chat").hasClass("chatting")) {
        if (evt.keyCode === 27) {
          this.gInterface.chat.blur();
          evt.preventDefault();
          evt.stopPropagation();
        } else if (evt.keyCode === 13) {
          $("#chat input").focus();
        }
      } else if (
        !this.gInterface.modal.gModal &&
        (evt.keyCode === 27 || evt.keyCode === 13)
      ) {
        $("#chat input").focus();
      }
    });
    let self = this;
    $("#chat input").on("keydown", function (evt) {
      if (evt.keyCode === 13) {
        if (self.gInterface.clientManager.gClient.isConnected()) {
          let message = $(this).val() as string;
          if (message.length === 0) {
            setTimeout(function () {
              self.gInterface.chat.blur();
            }, 100);
          } else if (message.length <= 512) {
            self.gInterface.chat.send(message);
            $(this).val("");
            setTimeout(function () {
              self.gInterface.chat.blur();
            }, 100);
          }
        }
        evt.preventDefault();
        evt.stopPropagation();
      } else if (evt.keyCode === 27) {
        self.gInterface.chat.blur();
        evt.preventDefault();
        evt.stopPropagation();
      } else if (evt.keyCode === 9) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    });
  }
}
