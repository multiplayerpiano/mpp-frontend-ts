import { MPP } from "..";
import { Notification } from "../Interface/Notification";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class ControlBarEvents {
  volume_slider: HTMLInputElement;
  gInterface: MultiplayerPianoClient;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;   
    this.volume_slider = document.getElementById("volume-slider") as HTMLInputElement;
	  this.volume_slider.value = String(this.gInterface.gPiano.audio.volume);
    this.bindEventListeners();
  }
  bindEventListeners() {
    $("#room").on("click", evt => {
      evt.stopPropagation();
    
      // clicks on a new room
      if ($(evt.target).hasClass("info") && $(evt.target).parents(".more").length) {
        $("#room .more").fadeOut(250);
        let selected_name = $(evt.target).attr("roomname");
        if (typeof selected_name !== "undefined") {
          this.gInterface.roomManager.changeRoom(selected_name, "right");
        }
        return false;
      }
      // clicks on "New Room..."
      else if ($(evt.target).hasClass("new")) {
        this.gInterface.modal.openModal("#new-room", "input[name=name]");
      }
      // all other clicks
      function doc_click(evt: JQuery.MouseDownEvent) {
        if ($(evt.target).is("#room .more")) return;
        $(document).off("mousedown", doc_click.bind(this));
        $("#room .more").fadeOut(250);
        this.gInterface.clientManager.gClient.sendArray([{
          m: "-ls"
        }]);
      }
      $(document).on("mousedown", doc_click.bind(this));
      $("#room .more .info").remove();
      $("#room .more").show();
      this.gInterface.clientManager.gClient.sendArray([{
        m: "+ls"
      }]);
    });

    $("#new-room-btn").on("click", evt => {
      evt.stopPropagation();
      this.gInterface.modal.openModal("#new-room", "input[name=name]");
    });
    
    
    $("#play-alone-btn").on("click", evt => {
      evt.stopPropagation();
      let room_name = "Room" + Math.floor(Math.random() * 1000000000000);
      this.gInterface.roomManager.changeRoom(room_name, "right", {
        "visible": false
      });
      setTimeout(function() {
        new Notification({
          id: "share",
          title: "Playing alone",
          html: 'You are playing alone in a room by yourself, but you can always invite \
          friends by sending them the link.<br/><br/>\
          <a href="#" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href),\'facebook-share-dialog\',\'width=626,height=436\');return false;">Share on Facebook</a><br/><br/>\
          <a href="http://twitter.com/home?status=' + encodeURIComponent(location.href) + '" target="_blank">Tweet</a>',
          duration: 25000
        });
      }, 1000);
    });

    //volume slider
    $("#volume-label").text("Volume: " + Math.floor(this.gInterface.gPiano.audio.volume * 100) + "%");
    this.volume_slider.addEventListener("input", evt => {
      let v = +this.volume_slider.value;
     this.gInterface.gPiano.audio.setVolume(v);
      if (window.localStorage) localStorage.volume = v;
      $("#volume-label").text("Volume: " + Math.floor(v * 100) + "%");
    });
  }
}

