// internet science

////////////////////////////////////////////////////////////////

import { Client, InMessageM } from "./Client"
import { ClientStatusManager } from "./ClientStatusManager"
import { ClientParticipantManager } from "./ClientParticipantManager";
import { ClientCrownManager } from "./ClientCrownManager";
import { ClientNoteManager } from "./ClientNoteManager";
import { ClientSettingsManager } from "./ClientSettingsManager";
import { Notification, NotificationInput } from "../Interface/Notification";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class ClientManager {
  channel_id: string;
  wssport: number;
  gClient: Client;
  clientStatusManager: ClientStatusManager;
  clientParticipantManager: ClientParticipantManager;
  clientCrownManager: ClientCrownManager;
  clientNoteManager: ClientNoteManager;
  clientSettingsManager: ClientSettingsManager;
  gInterface: MultiplayerPianoClient;
  
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.channel_id = this.getChannelId();
    this.wssport = window.location.hostname === "www.multiplayerpiano.com" ? 443 : 8443;
    this.gClient = new Client((window.location.hostname.includes("localhost") ?  "ws://" : "wss://") + window.location.hostname + ":" + this.wssport);
    this.gClient.setChannel(this.channel_id);
	  this.gClient.start();
    this.clientStatusManager = new ClientStatusManager(this.gClient);
    this.clientParticipantManager = new ClientParticipantManager(this.gInterface, this.gClient);
    this.clientCrownManager = new ClientCrownManager(this.gClient);
    this.clientNoteManager = new ClientNoteManager(this.gClient, this.gInterface);
    this.clientSettingsManager = new ClientSettingsManager(this.gClient, this.gInterface);
    this.initClientEvents();
  }

  getChannelId(): string {
    let channel_id = decodeURIComponent(window.location.pathname);
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
  
   
    

    this.gClient.on("m", this.updateCursor.bind(this));
    this.gClient.on("participant added", this.updateCursor.bind(this));

    // Handle notifications
    this.gClient.on("notification", (msg: NotificationInput) => {
      new Notification(msg);
    });
  }
}


