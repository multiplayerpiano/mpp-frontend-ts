import { Client } from "./Client/Client";
import { Chat } from "./Interface/Chat";
import { NoteQuotaHandler } from "./Pianoctor/NoteQuotaHandler";
import { Piano } from "./Pianoctor/Piano";
import { Notification } from "./Interface/Notification";
import { SoundSelector } from "./Pianoctor/SoundSelector";
import { MultiplayerPianoClient } from "./MultiplayerPianoClient";
import { NoteQuota } from "./Pianoctor/NoteQuota";

class MPPAPI {
	internalInterface: MultiplayerPianoClient;
	press: (id: string, vol?: number) => void;
	release: (id: string) => void;
	pressSustain: () => void;
	releaseSustain: () => void;
	piano: Piano;
	client: Client;
	chat: Chat;
	noteQuota: NoteQuota;
	soundSelector: SoundSelector;
	Notification: typeof Notification;

	constructor() {
			// API
			this.internalInterface = new MultiplayerPianoClient(); //fancy sounding name for the skids
			this.press = this.internalInterface.keyboard.press;
			this.release = this.internalInterface.keyboard.release;
			this.pressSustain = this.internalInterface.keyboard.pressSustain;
			this.releaseSustain = this.internalInterface.keyboard.releaseSustain;
			this.piano = this.internalInterface.gPiano;
			this.client = this.internalInterface.clientManager.gClient;
			this.chat = this.internalInterface.chat;
			this.noteQuota = this.internalInterface.gNoteQuotaHandler.noteQuota;
			this.soundSelector = this.internalInterface.gSoundSelector;
			this.Notification = Notification;
	}
}
export let MPP = new MPPAPI();
window.onload = (() => {
	window.console.log("insert cool spash here");
	(window as any).MPP = MPP;
});
