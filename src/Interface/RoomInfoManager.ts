import { MPP } from "..";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class RoomInfoManager {
  gInterface: MultiplayerPianoClient;
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    $("#room > .info").text("--");
    this.bindEventListeners();
  }
  bindEventListeners() {
    this.gInterface.clientManager.gClient.on("ch", function(msg) {
      let channel = msg.ch;
      let info = $("#room > .info");
      info.text(channel._id);
      if (channel.settings.lobby) info.addClass("lobby");
      else info.removeClass("lobby");
      if (!channel.settings.chat) info.addClass("no-chat");
      else info.removeClass("no-chat");
      if (channel.settings.crownsolo) info.addClass("crownsolo");
      else info.removeClass("crownsolo");
      if (channel.settings['no cussing']) info.addClass("no-cussing");
      else info.removeClass("no-cussing");
      if (!channel.settings.visible) info.addClass("not-visible");
      else info.removeClass("not-visible");
    });
    this.gInterface.clientManager.gClient.on("ls", function(ls) {
      for (let i in ls.u) {
        if (!ls.u.hasOwnProperty(i)) continue;
        let room = ls.u[i];
        let info = $("#room .info[roomname=\"" + (room._id + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + "\"]");
        if (info.length === 0) {
          info = $("<div class=\"info\"></div>");
          info.attr("roomname", room._id);
          $("#room .more").append(info);
        }
        info.text(room._id + " (" + room.count + ")");
        if (room.settings.lobby) info.addClass("lobby");
        else info.removeClass("lobby");
        if (!room.settings.chat) info.addClass("no-chat");
        else info.removeClass("no-chat");
        if (room.settings.crownsolo) info.addClass("crownsolo");
        else info.removeClass("crownsolo");
        if (room.settings['no cussing']) info.addClass("no-cussing");
        else info.removeClass("no-cussing");
        if (!room.settings.visible) info.addClass("not-visible");
        else info.removeClass("not-visible");
        if (room.banned) info.addClass("banned");
        else info.removeClass("banned");
      }
    });
  }
}

	