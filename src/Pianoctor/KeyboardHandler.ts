class KeyboardHandler {
  key_binding: Record<number, {note: Note, held: boolean}>;
  capsLockKey: boolean;
  transpose_octave: number;

  constructor() {
    this.key_binding = this.getKeyBinding();
    this.capsLockKey = false;
    this.transpose_octave = 0;
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
    if (key_binding[code] !== undefined) {
      let binding = key_binding[code];
      if (!binding.held) {
        binding.held = true;
  
        let note = binding.note;
        let octave = 1 + note.octave + transpose_octave;
        if (evt.shiftKey) ++octave;
        else if (capsLockKey || evt.ctrlKey) --octave;
        let noteStr = note.note + octave;
        let vol = velocityFromMouseY();
        press(noteStr, vol);
      }
  
      if (++gKeyboardSeq === 3) {
        gKnowsYouCanUseKeyboard = true;
        if (gKnowsYouCanUseKeyboardTimeout) clearTimeout(gKnowsYouCanUseKeyboardTimeout);
        if (localStorage) localStorage.knowsYouCanUseKeyboard = true;
        if (gKnowsYouCanUseKeyboardNotification) gKnowsYouCanUseKeyboardNotification.close();
      }
  
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    } else if (code === 20) { // Caps Lock
      capsLockKey = true;
      evt.preventDefault();
    } else if (code === 0x20) { // Space Bar
      pressSustain();
      evt.preventDefault();
    } else if ((code === 38 || code === 39) && transpose_octave < 3) {
      ++transpose_octave;
    } else if ((code === 40 || code === 37) && transpose_octave > -2) {
      --transpose_octave;
    } else if (code === 9) { // Tab (don't tab away from the piano)
      evt.preventDefault();
    } else if (code === 8) { // Backspace (don't navigate Back)
      gAutoSustain = !gAutoSustain;
      evt.preventDefault();
    }
  }

  handleKeyUp(evt: JQuery.KeyUpEvent) {
    let code = parseInt(evt.keyCode as any); //! Also deprecated - Hri7566
    if (key_binding[code] !== undefined) {
      let binding = key_binding[code];
      if (binding.held) {
        binding.held = false;
  
        let note = binding.note;
        let octave = 1 + note.octave + transpose_octave;
        if (evt.shiftKey) ++octave;
        else if (capsLockKey || evt.ctrlKey) --octave;
        let noteStr = note.note + octave;
        release(noteStr);
      }
  
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    } else if (code === 20) { // Caps Lock
      capsLockKey = false;
      evt.preventDefault();
    } else if (code === 0x20) { // Space Bar
      releaseSustain();
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
    captureKeyboard();
  }

  captureKeyboard() {
    $("#piano").off("mousedown", recapListener);
    $("#piano").off("touchstart", recapListener);
    $(document).on("keydown", handleKeyDown); 
    $(document).on("keyup", handleKeyUp);
    $(window).on("keypress", handleKeyPress);
  };

  releaseKeyboard() {
    $(document).off("keydown", handleKeyDown);
    $(document).off("keyup", handleKeyUp);
    $(window).off("keypress", handleKeyPress);
    $("#piano").on("mousedown", recapListener);
    $("#piano").on("touchstart", recapListener);
  };

  velocityFromMouseY(): number {
		return 0.1 + (my / 100) * 0.6;
	}
}