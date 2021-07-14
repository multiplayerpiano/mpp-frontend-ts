// Rename

////////////////////////////////////////////////////////////////

import { MPP } from "..";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class RenameManager {
  gInterface: MultiplayerPianoClient;
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.bindEventListeners();
  }

  submit() {
    let set = {
      name: $("#rename input[name=name]").val() as string,
      color: $("#rename input[name=color]").val() as string
    };
    //$("#rename .text[name=name]").val("");
    this.gInterface.modal.closeModal();
    this.gInterface.clientManager.gClient.sendArray([{
      m: "userset",
      set: set
    }]);
  }

  bindEventListeners() {
    $("#rename .submit").click(evt => {
      this.submit();
    });

    $("#rename .text[name=name]").keypress(evt => {
      if (evt.keyCode === 13) {
        this.submit();
      } else if (evt.keyCode === 27) {
        this.gInterface.modal.closeModal();
      } else {
        return;
      }
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    });
  }
}
