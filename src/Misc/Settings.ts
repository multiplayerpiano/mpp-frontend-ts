// set variables from settings or set settings

////////////////////////////////////////////////////////////////

import { MPP } from "..";
import { Notification } from "../Interface/Notification";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class Settings {
  gKeyboardSeq: number;
  gKnowsYouCanUseKeyboard: boolean;
  gKnowsYouCanUseKeyboardTimeout: number;
  gKnowsYouCanUseKeyboardNotification: Notification | undefined;
  gHasBeenHereBefore: boolean;
  gInterface: MultiplayerPianoClient;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.gKeyboardSeq = 0;
    this.gKnowsYouCanUseKeyboard = false;
    this.gKnowsYouCanUseKeyboardTimeout = 0;
    this.gKnowsYouCanUseKeyboardNotification;
    this.gHasBeenHereBefore = false;
  }
  checkKeyboard() {
    if (localStorage && localStorage.gKnowsYouCanUseKeyboard) this.gKnowsYouCanUseKeyboard = true;
    if (!this.gKnowsYouCanUseKeyboard) {
      this.gKnowsYouCanUseKeyboardTimeout = window.setTimeout(() => {
        this.gKnowsYouCanUseKeyboardNotification = new Notification({
          title: "Did you know!?!",
          text: "You can play the piano with your keyboard, too.  Try it!",
          target: "#piano",
          duration: 10000
        });
      }, 30000);
    }
  }
  setAudioSettings() {
    if (window.localStorage) {
      if (localStorage.volume) {
        this.gInterface.controlBarEvents.volume_slider.value = localStorage.volume;
       this.gInterface.gPiano.audio.setVolume(localStorage.volume);
        $("#volume-label").text("Volume: " + Math.floor(this.gInterface.gPiano.audio.volume * 100) + "%");
      } else localStorage.volume =this.gInterface.gPiano.audio.volume;
    
      this.gHasBeenHereBefore = (localStorage.gHasBeenHereBefore || false);
      if (this.gHasBeenHereBefore) {}
      localStorage.gHasBeenHereBefore = true;
    
    }
  }
}


