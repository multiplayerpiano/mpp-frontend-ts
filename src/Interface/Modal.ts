import { MPP } from "..";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class Modal {
  gModal: string | null;
	gInterface: MultiplayerPianoClient;
	modelHandleEscFunc: (evt: JQuery.KeyDownEvent) => void;

  constructor(gInterface: MultiplayerPianoClient) {
		this.gInterface = gInterface;
    this.gModal = null;
    this.bindEventListeners();
		this.modelHandleEscFunc = this.modalHandleEsc.bind(this);
  }

  modalHandleEsc(evt: JQuery.KeyDownEvent) {
		if (evt.keyCode == 27) {
			this.closeModal();
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

  openModal(selector: string, focus?: string) {
		if (this.gInterface.chat) this.gInterface.chat.blur();
		this.gInterface.keyboardHandler.releaseKeyboard();
		$(document).on("keydown", this.modelHandleEscFunc);
		$("#modal #modals > *").hide();
		$("#modal").fadeIn(250);
		$(selector).show();
		setTimeout(function () {
			$(selector).find(focus as any).focus();
		}, 100);
		this.gModal = selector;
	}

  closeModal() {
		$(document).off("keydown", this.modelHandleEscFunc);
		$("#modal").fadeOut(100);
		$("#modal #modals > *").hide();
		this.gInterface.keyboardHandler.captureKeyboard();
		this.gModal = null;
	}

  bindEventListeners() {
    let modal_bg = $("#modal .bg")[0];
    $(modal_bg).on("click", (evt: JQuery.ClickEvent) => {
      if (evt.target !== modal_bg) return;
      this.closeModal();
    });
  }
} 