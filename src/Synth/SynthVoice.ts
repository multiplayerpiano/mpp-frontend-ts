import { MPP } from "..";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";
import { Synth } from "./Synth";

export class SynthVoice {
  osc: OscillatorNode;
  gain: GainNode;
  synth: Synth;
  gInterface: MultiplayerPianoClient;
  
  constructor(gInterface: MultiplayerPianoClient, note_name: string, time: number) {
    this.synth = gInterface.synth;
    this.gInterface = gInterface;
    let note_number = this.gInterface.midi.MIDI_KEY_NAMES.indexOf(note_name);
    note_number = note_number + 9 - this.gInterface.midi.MIDI_TRANSPOSE;
    let freq = Math.pow(2, (note_number - 69) / 12) * 440.0;
    this.osc = this.synth.context.createOscillator();
    this.osc.type = this.synth.osc1_type;
    this.osc.frequency.value = freq;
    this.gain = this.synth.context.createGain();
    this.gain.gain.value = 0;
    this.osc.connect(this.gain);
    this.gain.connect(this.synth.synth_gain);
    this.osc.start(time);
    this.gain.gain.setValueAtTime(0, time);
    this.gain.gain.linearRampToValueAtTime(1, time + this.synth.osc1_attack);
    this.gain.gain.linearRampToValueAtTime(this.synth.osc1_sustain, time + this.synth.osc1_attack + this.synth.osc1_decay);
  }
  
  stop(time: number) {
    //this.gain.gain.setValueAtTime(osc1_sustain, time);
    this.gain.gain.linearRampToValueAtTime(0, time + this.synth.osc1_release);
    this.osc.stop(time + this.synth.osc1_release);
  }
}