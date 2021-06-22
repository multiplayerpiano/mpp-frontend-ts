// AudioEngine classes

////////////////////////////////////////////////////////////////

class AudioEngine {
  volume: number;
  sounds: Record<string, AudioBuffer>;
  paused: boolean;

  init(): this {
    this.volume = 0.6;
    this.sounds = {};
    this.paused = true;
    return this;
  }
  load(id: string, url: string, cb: Function) {}
  play(id: string, vol: number, delay_ms: number, part_id: string) {}
  stop(id: string, delay_ms: number, part_id: string) {}
  setVolume(vol: number) {
    this.volume = vol;
  }
  resume() {
    this.paused = false;
  }
}
interface PlayingNode {
  source: AudioBufferSourceNode;
  gain: GainNode;
  part_id: string;
  voice?: synthVoice;
}
