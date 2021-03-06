// Pianoctor

////////////////////////////////////////////////////////////////

import { AudioEngineWeb } from "../AudioEngine/AudioEngineWeb";
import { Participant } from "../Client/Client";
import { CanvasRenderer } from "../Renderer/CanvasRenderer";
import { Synth } from "../Synth/Synth";
import { PianoKey } from "./PianoKey";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

interface PianoOptionsNode {
  test_mode: "" | RegExpMatchArray | null;
  gMidiOutTest: ((note_name: string, vel: number, delay_ms: number) => void) | undefined;
  synth: Synth;
  gInterface: MultiplayerPianoClient; //oh well
}

export class Piano {
  rootElement: HTMLElement;
  keys: Record<string, PianoKey>;
  renderer: CanvasRenderer;
  audio: AudioEngineWeb;
  options: PianoOptionsNode;
  
  constructor(rootElement: HTMLElement, options: PianoOptionsNode) {
    this.options = options;
    let piano = this;
    piano.rootElement = rootElement;
    piano.keys = {};

    let white_spatial = 0;
    let black_spatial = 0;
    let black_it = 0;
    let black_lut = [2, 1, 2, 1, 1];
    let addKey = function(note: string, octave: number) {
      let key = new PianoKey(note, octave);
      piano.keys[key.note] = key;
      if (key.sharp) {
        key.spatial = black_spatial;
        black_spatial += black_lut[black_it % 5];
        ++black_it;
      } else {
        key.spatial = white_spatial;
        ++white_spatial;
      }
    }
    if (options.test_mode) {
      addKey("c", 2);
    } else {
      addKey("a", -1);
      addKey("as", -1);
      addKey("b", -1);
      let notes = "c cs d ds e f fs g gs a as b".split(" ");
      for (let oct = 0; oct < 7; oct++) {
        for (let i in notes) {
          addKey(notes[i], oct);
        }
      }
      addKey("c", 7);
    }


    this.renderer = new CanvasRenderer(this.options.gInterface).init(this);

    window.addEventListener("resize", function () {
      piano.renderer.resize();
    });


    window.AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext || undefined;
    this.audio = new AudioEngineWeb(this.options.gInterface).init();
  }
  
  play(note: string, vol: number, participant: Participant, delay_ms: number) {
    if (!this.keys.hasOwnProperty(note) || !participant) return;
    let key = this.keys[note];
    if (key.loaded) this.audio.play(key.note, vol, delay_ms, participant.id!);
    if (this.options.gMidiOutTest) this.options.gMidiOutTest(key.note, vol * 100, delay_ms);
    let self = this;
    setTimeout(function() {
      self.renderer.visualize(key, participant.color!);
      
      let jq_namediv = $(participant.nameDiv!);
      jq_namediv.addClass("play");
      setTimeout(function() {
        jq_namediv.removeClass("play");
      }, 30);
    }, delay_ms);
  }
  
  stop(note: string, participant: Participant, delay_ms: number) {
    if (!this.keys.hasOwnProperty(note)) return;
    let key = this.keys[note];
    if (key.loaded) this.audio.stop(key.note, delay_ms, participant.id!);
    if (this.options.gMidiOutTest) this.options.gMidiOutTest(key.note, 0, delay_ms);
  }
}