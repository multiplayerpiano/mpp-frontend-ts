import { MPP } from "..";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";
import "./ebsprite.js";

export class EbspriteManager {
	gInterface: MultiplayerPianoClient;
  constructor(gInterface: MultiplayerPianoClient) {
		this.gInterface = gInterface;
    gInterface.clientManager.gClient.on("ch", this.eb.bind(this));
    this.eb();
  }
  eb() {
		//using window as a temporary solution. Will be removed when ebsprite is typescriptified
		if(this.gInterface.clientManager.gClient.channel && this.gInterface.clientManager.gClient.channel._id.toLowerCase() === "test/fishing") {
			(window as any).ebsprite.start(this.gInterface.clientManager.gClient); 
		} else {
			(window as any).ebsprite.stop();
		}
	}
}

	