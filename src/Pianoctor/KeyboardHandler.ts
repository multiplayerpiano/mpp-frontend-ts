import { MPP } from "..";
import { Note } from "./Note";
import * as $ from "jquery";
import { MultiplayerPianoClient } from "../MultiplayerPianoClient";

export class KeyboardHandler {
  key_binding: Record<number, {note: Note, held: boolean}>;
  capsLockKey: boolean;
  transpose_octave: number;
  gInterface: MultiplayerPianoClient;
  recapListenerFunc: (evt: JQuery.MouseDownEvent | JQuery.TouchStartEvent) => void;
  recapListenerFunc2: (evt: JQuery.MouseDownEvent | JQuery.TouchStartEvent) => void;
  handleKeyDownFunc: (evt: JQuery.KeyDownEvent) => void;
  handleKeyUpFunc: (evt: JQuery.KeyUpEvent) => void;

  constructor(gInterface: MultiplayerPianoClient) {
    this.gInterface = gInterface;
    this.key_binding = this.getKeyBinding();
    this.capsLockKey = false;
    this.transpose_octave = 0;
    this.recapListenerFunc = this.recapListener.bind(this);
    this.recapListenerFunc2 = this.recapListener.bind(this);
    this.handleKeyDownFunc = this.handleKeyDown.bind(this);
    this.handleKeyUpFunc = this.handleKeyUp.bind(this);

  }

  n(a: string, b?: number): {note: Note, held: boolean} {
    return {
      note: new Note(a, b),
      held: false
    };
  }

  getKeyBinding(): Record<number, {note: Note, held: boolean}> {
    return {
      65: this.n("gs"),
      90: this.n("a"),
      83: this.n("as"),
      88: this.n("b"),
      67: this.n("c", 1),
      70: this.n("cs", 1),
      86: this.n("d", 1),
      71: this.n("ds", 1),
      66: this.n("e", 1),
      78: this.n("f", 1),
      74: this.n("fs", 1),
      77: this.n("g", 1),
      75: this.n("gs", 1),
      188: this.n("a", 1),
      76: this.n("as", 1),
      190: this.n("b", 1),
      191: this.n("c", 2),
      222: this.n("cs", 2),
    
      49: this.n("gs", 1),
      81: this.n("a", 1),
      50: this.n("as", 1),
      87: this.n("b", 1),
      69: this.n("c", 2),
      52: this.n("cs", 2),
      82: this.n("d", 2),
      53: this.n("ds", 2),
      84: this.n("e", 2),
      89: this.n("f", 2),
      55: this.n("fs", 2),
      85: this.n("g", 2),
      56: this.n("gs", 2),
      73: this.n("a", 2),
      57: this.n("as", 2),
      79: this.n("b", 2),
      80: this.n("c", 3),
      189: this.n("cs", 3),
      173: this.n("cs", 3), // firefox why
      219: this.n("d", 3),
      187: this.n("ds", 3),
      61: this.n("ds", 3), // firefox why
      221: this.n("e", 3)
    };
  }

  handleKeyDown(evt: JQuery.KeyDownEvent) {
    //console.log(evt);
    let code = parseInt(evt.keyCode as any); //! Deprecated - Hri7566
    if (this.key_binding[code] !== undefined) {
      let binding = this.key_binding[code];
      if (!binding.held) {
        binding.held = true;
  
        let note = binding.note;
        let octave = 1 + note.octave + this.transpose_octave;
        if (evt.shiftKey) ++octave;
        else if (this.capsLockKey || evt.ctrlKey) --octave;
        let noteStr = note.note + octave;
        let vol = this.velocityFromMouseY();
        this.gInterface.keyboard.press(noteStr, vol);
      }
  
      if (++this.gInterface.settings.gKeyboardSeq === 3) {
        this.gInterface.settings.gKnowsYouCanUseKeyboard = true;
        if (this.gInterface.settings.gKnowsYouCanUseKeyboardTimeout) clearTimeout(this.gInterface.settings.gKnowsYouCanUseKeyboardTimeout);
        if (localStorage) localStorage.knowsYouCanUseKeyboard = true;
        if (this.gInterface.settings.gKnowsYouCanUseKeyboardNotification) this.gInterface.settings.gKnowsYouCanUseKeyboardNotification.close();
      }
  
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    } else if (code === 20) { // Caps Lock
      this.capsLockKey = true;
      evt.preventDefault();
    } else if (code === 0x20) { // Space Bar
     this.gInterface.keyboard.pressSustain();
      evt.preventDefault();
    } else if ((code === 38 || code === 39) && this.transpose_octave < 3) {
      ++this.transpose_octave;
    } else if ((code === 40 || code === 37) && this.transpose_octave > -2) {
      --this.transpose_octave;
    } else if (code === 9) { // Tab (don't tab away from the piano)
      evt.preventDefault();
    } else if (code === 8) { // Backspace (don't navigate Back)
      this.gInterface.keyboard.gAutoSustain = !this.gInterface.keyboard.gAutoSustain;
      evt.preventDefault();
    }
  }

  handleKeyUp(evt: JQuery.KeyUpEvent) {
    let code = parseInt(evt.keyCode as any); //! Also deprecated - Hri7566
    if (this.key_binding[code] !== undefined) {
      let binding = this.key_binding[code];
      if (binding.held) {
        binding.held = false;
  
        let note = binding.note;
        let octave = 1 + note.octave + this.transpose_octave;
        if (evt.shiftKey) ++octave;
        else if (this.capsLockKey || evt.ctrlKey) --octave;
        let noteStr = note.note + octave;
       this.gInterface.keyboard.release(noteStr);
      }
  
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    } else if (code === 20) { // Caps Lock
      this.capsLockKey = false;
      evt.preventDefault();
    } else if (code === 0x20) { // Space Bar
      this.gInterface.keyboard.releaseSustain();
      evt.preventDefault();
    }
  }

  handleKeyPress(evt: JQuery.KeyPressEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    if (evt.keyCode === 27 || evt.keyCode === 13) {
      //$("#chat input").focus();
    }
    return false;
  }

  recapListener(evt: JQuery.MouseDownEvent | JQuery.TouchStartEvent) {
    this.captureKeyboard();
  }

  captureKeyboard() {
    $("#piano").off("mousedown", this.recapListenerFunc);
    $("#piano").off("touchstart", this.recapListenerFunc2);
    $(document).on("keydown", this.handleKeyDownFunc); 
    $(document).on("keyup", this.handleKeyUpFunc);
    $(window).on("keypress", this.handleKeyPress);
  };

  releaseKeyboard() {
    $(document).off("keydown", this.handleKeyDownFunc);
    $(document).off("keyup", this.handleKeyUpFunc);
    $(window).off("keypress", this.handleKeyPress);
    $("#piano").on("mousedown", this.recapListenerFunc);
    $("#piano").on("touchstart", this.recapListenerFunc2);
  };

  velocityFromMouseY(): number {
		return 0.1 + (this.gInterface.cursor.my / 100) * 0.6;
	}
}