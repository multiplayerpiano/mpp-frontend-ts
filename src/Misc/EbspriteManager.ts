import { MPP } from "..";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";
import { Ebsprite } from "./ebsprite";

export class EbspriteManager {
	gInterface: MultiplayerPianoClient;
	ebsprite: Ebsprite;
  constructor(gInterface: MultiplayerPianoClient) {
		this.gInterface = gInterface;
		this.ebsprite = new Ebsprite();
    gInterface.clientManager.gClient.on("ch", this.eb.bind(this));
    this.eb();
  }
  eb() {
		//using window as a temporary solution. Will be removed when ebsprite is typescriptified
		if(this.gInterface.clientManager.gClient.channel && this.gInterface.clientManager.gClient.channel._id.toLowerCase() === "test/fishing") {
			this.ebsprite.start(this.gInterface.clientManager.gClient); 
		} else {
			this.ebsprite.stop();
		}
	}
}

	