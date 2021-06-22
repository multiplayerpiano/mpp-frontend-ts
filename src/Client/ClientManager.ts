// internet science

////////////////////////////////////////////////////////////////

import { Client } from "./Client"
import { ClientStatusManager } from "./ClientStatusManager"
import { ClientParticipantManager } from "./ClientParticipantManager";
import { ClientCrownManager } from "./ClientCrownManager";

export class ClientManager {
  channel_id: string;
  wssport: number;
  gClient: Client;
  clientStatusManager: ClientStatusManager;
  clientParticipantManager: ClientParticipantManager;
  clientCrownManager: ClientCrownManager;
  
  constructor() {
    this.channel_id = this.getChannelId();
    this.wssport = window.location.hostname === "www.multiplayerpiano.com" ? 443 : 8443;
    this.gClient = new Client((window.location.hostname.includes("localhost") ?  "ws://" : "wss://") + window.location.hostname + ":" + this.wssport);
    this.gClient.setChannel(this.channel_id);
	  this.gClient.start();
    this.clientStatusManager = new ClientStatusManager(this.gClient);
    this.clientParticipantManager = new ClientParticipantManager(this.gClient);
    this.clientCrownManager = new ClientCrownManager(this.gClient);
    this.initClientEvents();
  }

  getChannelId(): string {
    let channel_id = decodeURIComponent(window.location.pathname/*getParameterByName("c")!*/);
    if (channel_id.substr(0, 1) === "/") channel_id = channel_id.substr(1);
	  if (channel_id === "") channel_id = "lobby"; 
    return channel_id;
  }

  updateCursor(msg: InMessageM) {
    const part = this.gClient.ppl[msg.id];
    if (part && part.cursorDiv) {
      part.cursorDiv.style.left = msg.x + "%";
      part.cursorDiv.style.top = msg.y + "%";
    }
  }

  initClientEvents() {
    this.gClient.on("disconnect", evt => {
      console.log(evt);
    });
  
   
    

    this.gClient.on("m", this.updateCursor);
    this.gClient.on("participant added", this.updateCursor);

    // Handle notifications
    gClient.on("notification", function(msg) {
      new Notification(msg);
    });

	
		
  }
  /*getParameterByName(name: string, url = window.location.href): string | null {
		name = name.replace(/[\[\]]/g, "\\$&");
		let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return "";
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}*/
}


