// Pianoctor

////////////////////////////////////////////////////////////////

class Piano {
  rootElement: HTMLElement;
  keys: Record<string, PianoKey>;
  renderer: CanvasRenderer;
  audio: AudioEngineWeb;
  
  constructor(rootElement: HTMLElement) {
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
    if (test_mode) {
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


    this.renderer = new CanvasRenderer().init(this);

    window.addEventListener("resize", function () {
      piano.renderer.resize();
    });


    window.AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext || undefined;
    this.audio = new AudioEngineWeb().init();
  }
  
  play(note: string, vol: number, participant: Participant, delay_ms: number) {
    if (!this.keys.hasOwnProperty(note) || !participant) return;
    let key = this.keys[note];
    if (key.loaded) this.audio.play(key.note, vol, delay_ms, participant.id!);
    if (gMidiOutTest) gMidiOutTest(key.note, vol * 100, delay_ms);
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
    if (gMidiOutTest) gMidiOutTest(key.note, 0, delay_ms);
  }
}