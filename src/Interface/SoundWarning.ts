import { MPP } from "..";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

// warn user about loud noises before starting sound (no autoplay)
export class SoundWarning {
  gInterface: MultiplayerPianoClient;
  user_interact_func: (evt: MouseEvent) => void;
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    gInterface.modal.openModal("#sound-warning");
    this.user_interact_func = this.user_interact.bind(this);
    this.bindEventListeners();
  }

  user_interact(evt: MouseEvent) {
    document.removeEventListener("click", this.user_interact_func);
    this.gInterface.modal.closeModal();
    this.gInterface.gPiano.audio.resume();
  }

  bindEventListeners() {
    document.addEventListener("click", this.user_interact_func);
  }
}

