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
    let encoder_sample_rate = 44100;
    let encoder_kbps = 128;
    let encoder: any = null;
    let scriptProcessorNode = context.createScriptProcessor(4096, 2, 2);
    let recording = false;
    let recording_start_time = 0;
    let mp3_buffer = [];
    button.addEventListener("click", evt => {
      // if (!recording) {
      // 	// start recording
      // 	mp3_buffer = [];
      // 	encoder = new lamejs.Mp3Encoder(2, encoder_sample_rate, encoder_kbps);
      // 	scriptProcessorNode.onaudioprocess = onAudioProcess;
      // 	audio.masterGain.connect(scriptProcessorNode);
      // 	scriptProcessorNode.connect(context.destination);
      // 	recording_start_time = Date.now();
      // 	recording = true;
      // 	button.textContent = "Stop Recording";
      // 	button.classList.add("stuck");
      // new Notification({"id": "mp3", "title": "Recording MP3...", "html": "It's recording now.  This could make things slow, maybe.  Maybe give it a moment to settle before playing.<br><br>This feature is experimental.<br>Send complaints to <a href=\"mailto:multiplayerpiano.com@gmail.com\">multiplayerpiano.com@gmail.com</a>.", "duration": 10000});
      new Notification({
        "id": "mp3",
        "title": "Recording MP3s is broken.",
        "html": "You can no longer record MP3s.",
        "duration": 10000
      });
      // } else {
      // 	// stop recording
      // 	var mp3buf = encoder.flush();
      // 	mp3_buffer.push(mp3buf);
      // 	var blob = new Blob(mp3_buffer, {type: "audio/mp3"});
      // 	var url = URL.createObjectURL(blob);
      // 	scriptProcessorNode.onaudioprocess = null;
      // 	audio.masterGain.disconnect(scriptProcessorNode);
      // 	scriptProcessorNode.disconnect(context.destination);
      // 	recording = false;
      // 	button.textContent = "Record MP3";
      // 	button.classList.remove("stuck");
      // 	new Notification({"id": "mp3", "title": "MP3 recording finished", "html": "<a href=\""+url+"\" target=\"blank\">And here it is!</a> (open or save as)<br><br>This feature is experimental.<br>Send complaints to <a href=\"mailto:multiplayerpiano.com@gmail.com\">multiplayerpiano.com@gmail.com</a>.", "duration": 0});
      // }
    });
  }

  /*onAudioProcess(evt ? : any) { // TODO replace any
    var inputL = evt.inputBuffer.getChannelData(0);
    var inputR = evt.inputBuffer.getChannelData(1);
    var mp3buf = encoder.encodeBuffer(convert16(inputL), convert16(inputR));
    mp3_buffer.push(mp3buf);
  }*/

  /*convert16(samples?: Array < any > ) { // TODO replace any
    var len = samples.length;
    var result = new Int16Array(len);
    for (var i = 0; i < len; i++) {
      result[i] = 0x8000 * samples[i];
    }
    return (result);
  }*/

}