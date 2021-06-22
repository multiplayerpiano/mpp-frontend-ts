import { Client } from "./Client";

export class ClientStatusManager {
  gClient: Client;

  constructor(gClient: Client) {
    this.gClient = gClient;
    this.handleStatus();
  }
  handleStatus() {
    // Setting status
    this.gClient.on("status", status => {
      $("#status").text(status);
    });
    this.gClient.on("count", count => {
      if (count > 0) {
        $("#status").html('<span class="number">' + count + '</span> ' + (count == 1 ? 'person is' : 'people are') + ' playing');
        document.title = "Piano (" + count + ")";
      } else {
        document.title = "Multiplayer Piano";
      }
    });
  }
}