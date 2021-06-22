import { Color } from "../Color";
import { Client } from "./Client";
import { ClientChannelBackgroundColorManager } from "./ClientChannelBackgroundColorManager";

export class ClientSettingsManager {
  gClient: Client;
  clientChannelBackgroundColorManager: ClientChannelBackgroundColorManager;

  constructor(gClient: Client) {
    this.gClient = gClient;
    this.clientChannelBackgroundColorManager = new ClientChannelBackgroundColorManager(this.gClient);
    this.handleSettings();
  }
  handleSettings() {
    // Room settings button
    this.gClient.on("ch", function(msg) {
      if (this.gClient.isOwner()) {
        $("#room-settings-btn").show();
      } else {
        $("#room-settings-btn").hide();
      }
    });
    $("#room-settings-btn").click(evt => {
      if (this.gClient.channel && this.gClient.isOwner()) {
        let settings = this.gClient.channel.settings;
        openModal("#room-settings");
        setTimeout(function() {
          $("#room-settings .checkbox[name=visible]").prop("checked", settings.visible);
          $("#room-settings .checkbox[name=chat]").prop("checked", settings.chat);
          $("#room-settings .checkbox[name=crownsolo]").prop("checked", settings.crownsolo);
          $("#room-settings input[name=color]").val(settings.color!);
        }, 100);
      }
    });
    $("#room-settings .submit").click(() => {
      let settings = {
        visible: $("#room-settings .checkbox[name=visible]").is(":checked"),
        chat: $("#room-settings .checkbox[name=chat]").is(":checked"),
        crownsolo: $("#room-settings .checkbox[name=crownsolo]").is(":checked"),
        color: $("#room-settings input[name=color]").val() as string
      };
      this.gClient.setChannelSettings(settings);
      closeModal();
    });
    $("#room-settings .drop-crown").click(() => {
      closeModal();
      if (confirm("This will drop the crown...!"))
        this.gClient.sendArray([{
          m: "chown"
        }]);
    });

    // Don't foget spin
    this.gClient.on("ch", function(msg) {
      let chidlo = msg.ch._id.toLowerCase();
      if (chidlo === "spin" || chidlo.substr(-5) === "/spin") {
        $("#piano").addClass("spin");
      } else {
        $("#piano").removeClass("spin");
      }
    });

    // Crownsolo notice
    this.gClient.on("ch", function(msg) {
      let notice = "";
      let has_notice = false;
      if (msg.ch.settings.crownsolo) {
        has_notice = true;
        notice += '<p>This room is set to "only the owner can play."</p>';
      }
      if (msg.ch.settings['no cussing']) {
        has_notice = true;
        notice += '<p>This room is set to "no cussing."</p>';
      }
      let notice_div = $("#room-notice");
      if (has_notice) {
        notice_div.html(notice);
        if (notice_div.is(':hidden')) notice_div.fadeIn(1000);
      } else {
        if (notice_div.is(':visible')) notice_div.fadeOut(1000);
      }
    });
    this.gClient.on("disconnect", function() {
      $("#room-notice").fadeOut(1000);
    });  
  }
}
