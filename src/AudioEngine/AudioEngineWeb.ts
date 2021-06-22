// AudioEngine classes

////////////////////////////////////////////////////////////////

class AudioEngineWeb extends AudioEngine {
  threshold: number;
  worker: Worker;
  context: AudioContext;
  masterGain: GainNode;
  limiterNode: DynamicsCompressorNode;
  pianoGain: GainNode;
  synthGain: GainNode;
  playings: Record<string, PlayingNode>;
  
  constructor() {
    super();
    this.threshold = 1000;
    //this.worker = new Worker("/js/workerTimer.js");
    //let self = this;
    /*this.worker.onmessage = function(event) {
      if (event.data.args)
        if (event.data.args.action === 0) {
          self.actualPlay(event.data.args.id, event.data.args.vol, event.data.args.time, event.data.args.part_id);
        }
      else {
        self.actualStop(event.data.args.id, event.data.args.time, event.data.args.part_id);
      }
    }*/
  }
  audioEngineOnMessage(event: any) {
    let self = this;
    if (event.data.args)
      if (event.data.args.action === 0) {
        self.actualPlay(event.data.args.id, event.data.args.vol, event.data.args.time, event.data.args.part_id);
      }
    else {
      self.actualStop(event.data.args.id, event.data.args.time, event.data.args.part_id);
    }
  }
  init(cb?: Function): this {
    super.init();
    this.context = new AudioContext({
      latencyHint: "interactive"
    });
    
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = this.volume;

    this.limiterNode = this.context.createDynamicsCompressor();
    this.limiterNode.threshold.value = -10;
    this.limiterNode.knee.value = 0;
    this.limiterNode.ratio.value = 20;
    this.limiterNode.attack.value = 0;
    this.limiterNode.release.value = 0.1;
    this.limiterNode.connect(this.masterGain);

    // for synth mix
    this.pianoGain = this.context.createGain();
    this.pianoGain.gain.value = 0.5;
    this.pianoGain.connect(this.limiterNode);
    this.synthGain = this.context.createGain();
    this.synthGain.gain.value = 0.5;
    this.synthGain.connect(this.limiterNode);

    this.playings = {};

    if (cb) setTimeout(cb, 0);
    return this;
  }
  load(id: string, url: string, cb?: Function) {
    let audio = this;
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.responseType = "arraybuffer";
    req.addEventListener("readystatechange", function(evt: Event) {
      if (req.readyState !== 4) return;
      try {
        audio.context.decodeAudioData(req.response, function(buffer) {
          audio.sounds[id] = buffer;
          if (cb) cb();
        });
      } catch (e) {
        /*throw new Error(e.message
          + " / id: " + id
          + " / url: " + url
          + " / status: " + req.status
          + " / ArrayBuffer: " + (req.response instanceof ArrayBuffer)
          + " / byteLength: " + (req.response && req.response.byteLength ? req.response.byteLength : "undefined"));*/
        new Notification({
          id: "audio-download-error",
          title: "Problem",
          text: "For some reason, an audio download failed with a status of " + req.status + ". ",
          target: "#piano",
          duration: 10000
        });
      }
    });
    req.send();
  }
  actualPlay(id: string, vol: number, time: number, part_id: string) { //the old play(), but with time insted of delay_ms.
    if (this.paused) return;
    if (!this.sounds.hasOwnProperty(id)) return;
    let source = this.context.createBufferSource();
    source.buffer = this.sounds[id];
    let gain = this.context.createGain();
    gain.gain.value = vol;
    source.connect(gain);
    gain.connect(this.pianoGain);
    source.start(time);
    // Patch from ste-art remedies stuttering under heavy load
    if (this.playings[id]) {
      let playing = this.playings[id];
      playing.gain.gain.setValueAtTime(playing.gain.gain.value, time);
      playing.gain.gain.linearRampToValueAtTime(0.0, time + 0.2);
      playing.source.stop(time + 0.21);
      if (enableSynth && playing.voice) {
        playing.voice.stop(time);
      }
    }
    this.playings[id] = {
      "source": source,
      "gain": gain,
      "part_id": part_id
    };
    
    if (enableSynth) {
      this.playings[id].voice = new synthVoice(id, time);
    }
  }
  play(id: string, vol: number, delay_ms: number, part_id: string) {
    if (!this.sounds.hasOwnProperty(id)) return;
    let time = this.context.currentTime + (delay_ms / 1000); //calculate time on note receive.
    let delay = delay_ms - this.threshold;
    if (delay <= 0) this.actualPlay(id, vol, time, part_id);
    else {
      this.audioEngineOnMessage({
        delay: delay,
        args: {
          action: 0 /*play*/,
          id: id,
          vol: vol,
          time: time,
          part_id: part_id
        }
      }) // but start scheduling right before play.
    }
  }
  actualStop(id: string, time: number, part_id: string) {
    if (this.playings.hasOwnProperty(id) && this.playings[id] && this.playings[id].part_id === part_id) {
      let gain = this.playings[id].gain.gain;
      gain.setValueAtTime(gain.value, time);
      gain.linearRampToValueAtTime(gain.value * 0.1, time + 0.16);
      gain.linearRampToValueAtTime(0.0, time + 0.4);
      this.playings[id].source.stop(time + 0.41);
      
      
      if (this.playings[id].voice) {
        this.playings[id].voice!.stop(time);
      }

      delete this.playings[id];
    }
  }
  stop(id: string, delay_ms: number, part_id: string) {
    let time = this.context.currentTime + (delay_ms / 1000);
    let delay = delay_ms - this.threshold;
    if (delay <= 0) this.actualStop(id, time, part_id);
    else {
      this.audioEngineOnMessage({
        delay: delay,
        args: {
          action: 1 /*stop*/,
          id: id,
          time: time,
          part_id: part_id
        }
      });
    }
  }
  setVolume(vol: number) {
    super.setVolume(vol);
    this.masterGain.gain.value = this.volume;
  }
  resume() {
    this.paused = false;
    this.context.resume();
  }
}