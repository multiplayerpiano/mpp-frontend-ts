import { MPP } from "..";
import { Participant } from "../Client/Client";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

// click participant names
export class ParticipantMenu {
  ele: HTMLElement;
  gInterface: MultiplayerPianoClient;
  touchHandlerFunc: (e: MouseEvent | TouchEvent) => void;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.ele = document.getElementById("names")!;
    this.touchHandlerFunc = this.touchhandler.bind(this);
    this.bindEventListeners();
  }

  touchhandler(e: MouseEvent | TouchEvent) {
    let target_jq = $(e.target!);
    if (target_jq.hasClass("name")) {
      target_jq.addClass("play");
      if ((e.target as any).participantId == this.gInterface.clientManager.gClient.participantId) {
        this.gInterface.modal.openModal("#rename", "input[name=name]");
        setTimeout(() => {
          $("#rename input[name=name]").val(this.gInterface.clientManager.gClient.ppl[this.gInterface.clientManager.gClient.participantId!].name!);
          $("#rename input[name=color]").val(this.gInterface.clientManager.gClient.ppl[this.gInterface.clientManager.gClient.participantId!].color!);
        }, 100);
      } else if ((e.target as any).participantId) {
        let id = (e.target as any).participantId;
        let part = this.gInterface.clientManager.gClient.ppl[id] || null;
        if (part) {
          this.participantMenu(part);
          e.stopPropagation();
        }
      }
    }
  }

  releasehandler(e: MouseEvent | TouchEvent) {
    $("#names .name").removeClass("play");
  }

  bindEventListeners() {
    this.ele.addEventListener("mousedown", this.touchHandlerFunc);
    this.ele.addEventListener("touchstart", this.touchHandlerFunc);
    document.body.addEventListener("mouseup", this.releasehandler);
    document.body.addEventListener("touchend", this.releasehandler);
  }

  removeParticipantMenus() {
    $(".participant-menu").remove();
    $(".participantSpotlight").hide();
    document.removeEventListener("mousedown", this.removeParticipantMenus);
    document.removeEventListener("touchstart", this.removeParticipantMenus);
  };

  participantMenu(part: Participant) {
    if (!part) return;
    this.removeParticipantMenus();
    document.addEventListener("mousedown", this.removeParticipantMenus);
    document.addEventListener("touchstart", this.removeParticipantMenus);
    $("#" + part.id).find(".enemySpotlight").show();
    let menu = $('<div class="participant-menu"></div>');
    $("body").append(menu);
    // move menu to name position
    let jq_nd = $(part.nameDiv!);
    let pos = jq_nd.position();
    menu.css({
      "top": pos.top + jq_nd.height()! + 15,
      "left": pos.left + 6,
      "background": part.color || "black"
    });
    menu.on("mousedown touchstart", evt => {
      evt.stopPropagation();
      let target = $(evt.target);
      if (target.hasClass("menu-item")) {
        target.addClass("clicked");
        menu.fadeOut(200, () => {
          this.removeParticipantMenus();
        });
      }
    });
    // this spaces stuff out but also can be used for informational
    $('<div class="info"></div>').appendTo(menu).text(part._id!);
    // add menu items
    let gPianoMutes = this.gInterface.gPianoMutes;
    let gChatMutes = this.gInterface.gChatMutes;
    if (gPianoMutes.indexOf(part._id!) == -1) {
      $('<div class="menu-item">Mute Notes</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          gPianoMutes.push(part._id!);
          if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
          $(part.nameDiv!).addClass("muted-notes");
        });
    } else {
      $('<div class="menu-item">Unmute Notes</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          let i;
          while ((i = gPianoMutes.indexOf(part._id!)) != -1)
            gPianoMutes.splice(i, 1);
          if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
          $(part.nameDiv!).removeClass("muted-notes");
        });
    }
    if (gChatMutes.indexOf(part._id!) == -1) {
      $('<div class="menu-item">Mute Chat</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          gChatMutes.push(part._id!);
          if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
          $(part.nameDiv!).addClass("muted-chat");
        });
    } else {
      $('<div class="menu-item">Unmute Chat</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          let i;
          while ((i = gChatMutes.indexOf(part._id!)) != -1)
            gChatMutes.splice(i, 1);
          if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
          $(part.nameDiv!).removeClass("muted-chat");
        });
    }
    if (!(gPianoMutes.indexOf(part._id!) >= 0) || !(gChatMutes.indexOf(part._id!) >= 0)) {
      $('<div class="menu-item">Mute Completely</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          gPianoMutes.push(part._id!);
          if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
          gChatMutes.push(part._id!);
          if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
          $(part.nameDiv!).addClass("muted-notes");
          $(part.nameDiv!).addClass("muted-chat");
        });
    }
    if ((gPianoMutes.indexOf(part._id!) >= 0) || (gChatMutes.indexOf(part._id!) >= 0)) {
      $('<div class="menu-item">Unmute Completely</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          let i;
          while ((i = gPianoMutes.indexOf(part._id!)) != -1)
            gPianoMutes.splice(i, 1);
          while ((i = gChatMutes.indexOf(part._id!)) != -1)
            gChatMutes.splice(i, 1);
          if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
          if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
          $(part.nameDiv!).removeClass("muted-notes");
          $(part.nameDiv!).removeClass("muted-chat");
        });
    }
    if (this.gInterface.clientManager.gClient.isOwner()) {
      $('<div class="menu-item give-crown">Give Crown</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          if (confirm("Give room ownership to " + part.name + "?"))
            this.gInterface.clientManager.gClient.sendArray([{
              m: "chown",
              id: part.id
            }]);
        });
      $('<div class="menu-item kickban">Kickban</div>').appendTo(menu)
        .on("mousedown touchstart", evt => {
          let minutesRaw = prompt("How many minutes? (0-60)", "30");
          if (minutesRaw === null) return;
          let minutes = parseFloat(minutesRaw) || 0;
          let ms = minutes * 60 * 1000;
          this.gInterface.clientManager.gClient.sendArray([{
            m: "kickban",
            _id: part._id!,
            ms: ms
          }]);
        });
    }
    menu.fadeIn(100);
  }

}