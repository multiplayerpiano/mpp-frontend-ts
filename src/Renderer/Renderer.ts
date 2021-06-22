// Renderer classes

////////////////////////////////////////////////////////////////
interface Blip {
  color: string;
  time: number;
}
interface PianoAPI {
  audio: AudioEngineWeb;
  keys: Record<string, PianoKey>;
  renderer: Renderer;
  rootElement: HTMLElement;
}
class Renderer {
  piano: PianoAPI;
  width: number;
  height: number;

  init(piano: PianoAPI): this {
    this.piano = piano;
    this.resize();
    return this;
  }

  resize(width: number = $(this.piano.rootElement).width()!, height: number = Math.floor(width * 0.2)) {
    $(this.piano.rootElement).css({
      height: height + "px",
      marginTop: Math.floor($(window).height()! / 2 - height / 2) + "px"
    });
    this.width = width * window.devicePixelRatio;
    this.height = height * window.devicePixelRatio;
  }
  
  visualize(key: PianoKey, color: string) {}
}