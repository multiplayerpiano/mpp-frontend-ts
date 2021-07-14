import { MPP } from "..";
import { Client, Participant } from "./Client";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class ClientParticipantManager {
  gClient: Client;
  gInterface: MultiplayerPianoClient;

  constructor(gInterface: MultiplayerPianoClient, gClient: Client) {
    this.gInterface = gInterface;
    this.gClient = gClient;
    this.handleParticipants();
  }
  handleParticipants() {
    // Handle changes to participants
    this.gClient.on("participant added", (part: Participant) => {

      part.displayX = 150;
      part.displayY = 50;

      // add nameDiv
      let div: HTMLElement;
      div = document.createElement("div");
      div.className = "name";
      (div as any).participantId = part.id; // Bruh
      div.textContent = part.name || "";
      div.style.backgroundColor = part.color || "#777";
      if (this.gClient.participantId === part.id) {
        $(div).addClass("me");
      }
      if (this.gClient.channel && this.gClient.channel.crown && this.gClient.channel.crown.participantId === part.id) {
        $(div).addClass("owner");
      }
      if (this.gInterface.gPianoMutes.indexOf(part._id!) !== -1) {
        $(part.nameDiv!).addClass("muted-notes");
      }
      if (this.gInterface.gChatMutes.indexOf(part._id!) !== -1) {
        $(part.nameDiv!).addClass("muted-chat");
      }
      div.style.display = "none";
      part.nameDiv = $("#names")[0].appendChild(div);
      $(part.nameDiv).fadeIn(2000);

      // sort names
      let arr: any = $("#names .name"); // -_-
      arr.sort(function(a: HTMLElement, b: HTMLElement) {
        let a_ = a.style.backgroundColor; // todo: sort based on user id instead
        let b_ = b.style.backgroundColor;
        if (a_ > b_) return 1;
        else if (a_ < b_) return -1;
        else return 0;
      });
      $("#names").html(arr);

      // add cursorDiv
      if (this.gClient.participantId !== part.id || this.gInterface.gSeeOwnCursor) {
        let div = document.createElement("div");
        div.className = "cursor";
        div.style.display = "none";
        part.cursorDiv = $("#cursors")[0].appendChild(div);
        $(part.cursorDiv).fadeIn(2000);

        div = document.createElement("div");
        div.className = "name";
        div.style.backgroundColor = part.color || "#777"
        div.textContent = part.name || "";
        part.cursorDiv.appendChild(div);

      } else {
        part.cursorDiv = undefined;
      }
    });
    this.gClient.on("participant removed", function(part: Participant) {
      // remove nameDiv
      let nd = $(part.nameDiv!);
      let cd = $(part.cursorDiv!);
      cd.fadeOut(2000);
      nd.fadeOut(2000, function () {
        nd.remove();
        cd.remove();
        part.nameDiv = undefined;
        part.cursorDiv = undefined;
      });
    });
    this.gClient.on("participant update", function(part: Participant) {
      let name = part.name || "";
      let color = part.color || "#777";
      part.nameDiv!.style.backgroundColor = color;
      part.nameDiv!.textContent = name;
      $(part.cursorDiv!)
        .find(".name")
        .text(name)
        .css("background-color", color);
    });
    this.gClient.on("ch", msg => {
      for (let id in this.gClient.ppl) {
        if (this.gClient.ppl.hasOwnProperty(id)) {
          let part = this.gClient.ppl[id];
          if (part.id === this.gClient.participantId) {
            $(part.nameDiv!).addClass("me");
          } else {
            $(part.nameDiv!).removeClass("me");
          }
          if (msg.ch.crown && msg.ch.crown.participantId === part.id) {
            $(part.nameDiv!).addClass("owner");
            $(part.cursorDiv!).addClass("owner");
          } else {
            $(part.nameDiv!).removeClass("owner");
            $(part.cursorDiv!).removeClass("owner");
          }
          if (this.gInterface.gPianoMutes.indexOf(part._id!) !== -1) {
            $(part.nameDiv!).addClass("muted-notes");
          } else {
            $(part.nameDiv!).removeClass("muted-notes");
          }
          if (this.gInterface.gChatMutes.indexOf(part._id!) !== -1) {
            $(part.nameDiv!).addClass("muted-chat");
          } else {
            $(part.nameDiv!).removeClass("muted-chat");
          }
        }
      }
    });
  }
}