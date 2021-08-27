// New room, change room

////////////////////////////////////////////////////////////////

import { MPP } from "..";
import { ChannelSettings } from "../Client/Client";
import { Notification } from "../Interface/Notification";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class RoomManager {
  gHistoryDepth: number;
  gInterface: MultiplayerPianoClient;
  
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.gHistoryDepth = 0;
    this.bindEventListeners();
  }

  submit() {
    let name = $("#new-room .text[name=name]").val() as string;
    let settings = {
      visible: $("#new-room .checkbox[name=visible]").is(":checked"),
      chat: true
    };
    $("#new-room .text[name=name]").val("");
    this.gInterface.modal.closeModal();
    this.gInterface.roomManager.changeRoom(name, "right", settings);
    setTimeout(function() {
      new Notification({
        id: "share",
        title: "Created a Room",
        html: 'You can invite friends to your room by sending them the link.<br/><br/>\
      <a href="#" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href),\'facebook-share-dialog\',\'width=626,height=436\');return false;">Share on Facebook</a><br/><br/>\
      <a href="http://web.archive.org/web/20200825094242/http://twitter.com/home?status=' + encodeURIComponent(location.href) + '" target="_blank">Tweet</a>',
        duration: 25000
      });
    }, 1000);
  }

  changeRoom(name: string, direction: string = "right", settings: ChannelSettings = {}, push: boolean = true) {
    let opposite = direction == "left" ? "right" : "left";
    
    if (name === "") name = "lobby";
    if (this.gInterface.clientManager.gClient.channel && this.gInterface.clientManager.gClient.channel._id === name) return;
    if (push) {
      let url = "/" + encodeURIComponent(name).replace("'", "%27");
      if (window.history && history.pushState) {
        history.pushState({
          "depth": this.gHistoryDepth += 1,
          "name": name
        }, "Piano > " + name, url);
      } else {
        window.location.href = url;
        return;
      }
    }
    
    this.gInterface.clientManager.gClient.setChannel(name, settings);
    
    let t = 0,
      d = 100;
    $("#piano").addClass("ease-out").addClass("slide-" + opposite);
    setTimeout(function() {
      $("#piano").removeClass("ease-out").removeClass("slide-" + opposite).addClass("slide-" + direction);
    }, t += d);
    setTimeout(function() {
      $("#piano").addClass("ease-in").removeClass("slide-" + direction);
    }, t += d);
    setTimeout(function() {
      $("#piano").removeClass("ease-in");
    }, t += d);
  };

  bindEventListeners() {
    $("#new-room .submit").click(evt => {
      this.submit();
    });

    $("#new-room .text[name=name]").keypress(evt => {
      if (evt.keyCode == 13) {
        this.submit();
      } else if (evt.keyCode == 27) {
        this.gInterface.modal.closeModal();
      } else {
        return;
      }
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    });

    $(window).on("popstate", evt => {
      let depth = (evt as any).state ? (evt as any).state.depth : 0;
      if (depth === this.gHistoryDepth) return; // <-- forgot why I did that though...
      
      let direction = depth <= this.gHistoryDepth ? "left" : "right";
      this.gHistoryDepth = depth;
      
      let name = decodeURIComponent(window.location.pathname);
      if (name.substr(0, 1) == "/") name = name.substr(1);
      this.changeRoom(name, direction, undefined, false);
      });
  }
}










