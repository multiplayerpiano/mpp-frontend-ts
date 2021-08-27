import { MPP } from "..";
import { Notification } from "../Interface/Notification";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

// record mp3
export class MP3Recorder {
  gInterface: MultiplayerPianoClient; 
  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.init();
  }
  init() {
    let button = document.querySelector("#record-btn")!;
    let audio = this.gInterface.gPiano.audio;
    let context = audio.context;
    let dest = context.createMediaStreamDestination();
    let mediaRecorder = new (window as any).MediaRecorder(dest.stream);
    let chunks: BlobPart[] = [];
    let recording = false;
    button.addEventListener("click", evt => {
      if (!recording) {
        audio.masterGain.connect(dest);
        mediaRecorder.start();
        recording = true;
        button.textContent = "Stop Recording";
        button.classList.add("stuck");
        new Notification({"id": "mp3", "title": "Recording MP3...", "html": "It's recording now.", "duration": 10000});
      } else {
        audio.masterGain.disconnect(dest);
        recording = false;
        button.textContent = "Record MP3";
        button.classList.remove("stuck");
        mediaRecorder.stop();
      }
    });

    mediaRecorder.ondataavailable = function(evt: { data: any; }) {
      console.log(typeof evt.data);
      chunks.push(evt.data);
    };

    mediaRecorder.onstop = function() {
      var blob = new Blob(chunks, { 'type' : 'audio/mp3' });
      new Notification({"id": "mp3", "title": "MP3 recording finished", "html": "<a href=\""+URL.createObjectURL(blob)+"\" target=\"blank\" download=\"recording-" + Date.now() + ".mp3\">And here it is!</a> (click to download!)", "duration": 0});
    };
  }

}