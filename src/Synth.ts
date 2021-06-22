// synth
class Synth {
  enableSynth: boolean;
  audio: AudioEngineWeb;
  context: AudioContext;
  synth_gain: GainNode;
  osc_types: OscillatorType[];
  osc_type_index: number;
  osc1_type: OscillatorType;
  osc1_attack: number;
  osc1_decay: number;
  osc1_sustain: number;
  osc1_release: number;
  button: HTMLElement;
  notification: Notification | null;

  constructor() {
    this.enableSynth = false;
    this.audio = gPiano.audio;
    this.context = gPiano.audio.context;
    this.synth_gain = this.context.createGain();
    this.synth_gain.gain.value = 0.05;
    this.synth_gain.connect(this.audio.synthGain);

    this.osc_types = ["sine", "square", "sawtooth", "triangle"];
    this.osc_type_index = 1;

    this.osc1_type = "square";
    this.osc1_attack = 0;
    this.osc1_decay = 0.2;
    this.osc1_sustain = 0.5;
    this.osc1_release = 2.0;
    this.button = document.getElementById("synth-btn")!;
    this.notification = null;
    this.init();
  }
  
  init() {
    this.button.addEventListener("click", (() => {
			if (this.notification) {
				this.notification.close();
			} else {
				showSynth();
			}
		}));
  }

  showSynth() {
    let html = document.createElement("div");

    // on/off button
    (function() {
      let button = document.createElement("input");
      mixin(button, {
        type: "button",
        value: "ON/OFF",
        className: enableSynth ? "switched-on" : "switched-off"
      });
      button.addEventListener("click", function(evt) {
        enableSynth = !enableSynth;
        button.className = enableSynth ? "switched-on" : "switched-off";
        if (!enableSynth) {
          // stop all
          for (let i in audio.playings) {
            if (!audio.playings.hasOwnProperty(i)) continue;
            let playing = audio.playings[i];
            if (playing && playing.voice) {
              playing.voice.osc.stop();
              playing.voice = undefined;
            }
          }
        }
      });
      html.appendChild(button);
    })();
    
    let knobCanvas: HTMLCanvasElement;
    let knob: Knob;
    
    // mix
    knobCanvas = document.createElement("canvas");
    mixin(knobCanvas, {
      width: 32 * window.devicePixelRatio,
      height: 32 * window.devicePixelRatio,
      className: "knob"
    });
    html.appendChild(knobCanvas);
    knob = new Knob(knobCanvas, 0, 100, 0.1, 50, "mix", "%");
    knob.canvas.style.width = "32px";
    knob.canvas.style.height = "32px";
    knob.on("change", function(k: Knob) {
      var mix = k.value / 100;
      audio.pianoGain.gain.value = 1 - mix;
      audio.synthGain.gain.value = mix;
    });
    knob.emit("change", knob);

    // osc1 type
    (function() {
      osc1_type = osc_types[osc_type_index];
      let button = document.createElement("input");
      mixin(button, {
        type: "button",
        value: osc_types[osc_type_index]
      });
      button.addEventListener("click", function(evt) {
        if (++osc_type_index >= osc_types.length) osc_type_index = 0;
        osc1_type = osc_types[osc_type_index];
        button.value = osc1_type;
      });
      html.appendChild(button);
    })();

    // osc1 attack
    knobCanvas = document.createElement("canvas");
    mixin(knobCanvas, {
      width: 32 * window.devicePixelRatio,
      height: 32 * window.devicePixelRatio,
      className: "knob"
    });
    html.appendChild(knobCanvas);
    knob = new Knob(knobCanvas, 0, 1, 0.001, osc1_attack, "osc1 attack", "s");
    knob.canvas.style.width = "32px";
    knob.canvas.style.height = "32px";
    knob.on("change", function(k: Knob) {
      osc1_attack = k.value;
    });
    knob.emit("change", knob);

    // osc1 decay
    knobCanvas = document.createElement("canvas");
    mixin(knobCanvas, {
      width: 32 * window.devicePixelRatio,
      height: 32 * window.devicePixelRatio,
      className: "knob"
    });
    html.appendChild(knobCanvas);
    knob = new Knob(knobCanvas, 0, 2, 0.001, osc1_decay, "osc1 decay", "s");
    knob.canvas.style.width = "32px";
    knob.canvas.style.height = "32px";
    knob.on("change", function(k: Knob) {
      osc1_decay = k.value;
    });
    knob.emit("change", knob);

    knobCanvas = document.createElement("canvas");
    mixin(knobCanvas, {
      width: 32 * window.devicePixelRatio,
      height: 32 * window.devicePixelRatio,
      className: "knob"
    });
    html.appendChild(knobCanvas);
    knob = new Knob(knobCanvas, 0, 1, 0.001, osc1_sustain, "osc1 sustain", "x");
    knob.canvas.style.width = "32px";
    knob.canvas.style.height = "32px";
    knob.on("change", function(k: Knob) {
      osc1_sustain = k.value;
    });
    knob.emit("change", knob);

    // osc1 release
    knobCanvas = document.createElement("canvas");
    mixin(knobCanvas, {
      width: 32 * window.devicePixelRatio,
      height: 32 * window.devicePixelRatio,
      className: "knob"
    });
    html.appendChild(knobCanvas);
    knob = new Knob(knobCanvas, 0, 2, 0.001, osc1_release, "osc1 release", "s");
    knob.canvas.style.width = "32px";
    knob.canvas.style.height = "32px";
    knob.on("change", function(k: Knob) {
      osc1_release = k.value;
    });
    knob.emit("change", knob);



    let div = document.createElement("div");
    div.innerHTML = "<br><br><br><br><center>this space intentionally left blank</center><br><br><br><br>";
    html.appendChild(div);



    // notification
    notification = new Notification({
      title: "Synthesize",
      html: html,
      duration: -1,
      target: "#synth-btn"
    });
    notification.on("close", function() {
      let tip = document.getElementById("tooltip")!;
      if (tip) tip.parentNode!.removeChild(tip);
      notification = null;
    });
  }

}