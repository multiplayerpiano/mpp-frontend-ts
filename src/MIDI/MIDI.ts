// MIDI

////////////////////////////////////////////////////////////////

import { Client } from "../Client/Client";
import { Keyboard } from "../Pianoctor/Keyboard";
import { MIDIHandler } from "./MIDIHandler";

interface MIDINode {
  gClient: Client;
  keyboard: Keyboard;
  gMidiVolumeTest: "" | RegExpMatchArray | null;
}

export class MIDI {
  MIDI_TRANSPOSE: number;
  MIDI_KEY_NAMES: Array<string>;
  bare_notes: Array<string>;
  devices_json: string;
  midi_handler: MIDIHandler | undefined;
  gClient: Client;
  midiNode: MIDINode;

  constructor(midiNode: MIDINode) {
    this.midiNode = midiNode;
    this.MIDI_TRANSPOSE = -12;
    this.MIDI_KEY_NAMES = ["a-1", "as-1", "b-1"];
    this.bare_notes = "c cs d ds e f fs g gs a as b".split(" ");
    this.addMidiKeyNames();
    this.devices_json = "[]";
    this.midi_handler = this.requestMIDIHandler();
    midiNode.gClient.on("connect", this.sendDevices.bind(this))
  }

  addMidiKeyNames() {
    for (let oct = 0; oct < 7; oct++) {
      for (let i in this.bare_notes) {
        this.MIDI_KEY_NAMES.push(this.bare_notes[i] + oct);
      }
    }
    this.MIDI_KEY_NAMES.push("c7");
  }

  sendDevices() {
    this.midiNode.gClient.sendArray([{
      "m": "devices",
      "list": JSON.parse(this.devices_json)
    }]);
  }
  requestMIDIHandler() {
    let midiHandler;
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(midi => {
        midiHandler = new MIDIHandler(midi, {
          midiCls: this,
          keyboard: this.midiNode.keyboard,
          gMidiVolumeTest: this.midiNode.gMidiVolumeTest
        });
        midiHandler.init();
      }).catch(e => {
        console.error(e);
      })
    } else {
      console.error("Browser does not support WebMIDI!");
    }
    return midiHandler;
  }
}



