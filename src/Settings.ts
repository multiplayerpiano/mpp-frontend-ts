// set variables from settings or set settings

////////////////////////////////////////////////////////////////

class Settings {
  gKeyboardSeq: number;
  gKnowsYouCanUseKeyboard: boolean;
  gKnowsYouCanUseKeyboardTimeout: number;
  gKnowsYouCanUseKeyboardNotification: MPPNotification | undefined;
  gHasBeenHereBefore: boolean;

  constructor() {
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
        this.gKnowsYouCanUseKeyboardNotification = new MPPNotification({
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
        volume_slider.value = localStorage.volume;
        gPiano.audio.setVolume(localStorage.volume);
        $("#volume-label").text("Volume: " + Math.floor(gPiano.audio.volume * 100) + "%");
      } else localStorage.volume = gPiano.audio.volume;
    
      this.gHasBeenHereBefore = (localStorage.gHasBeenHereBefore || false);
      if (this.gHasBeenHereBefore) {}
      localStorage.gHasBeenHereBefore = true;
    
    }
  }
}


