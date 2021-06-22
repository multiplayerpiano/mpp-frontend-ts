class MIDIHandler {
  midi: WebMidi.MIDIAccess;
  connectionsNotification: Notification;

  constructor(midi: WebMidi.MIDIAccess) {
    this.midi = midi;
  }

  midimessagehandler(evt: WebMidi.MIDIMessageEvent) {
    if (!(evt.target as any).enabled) return;
    //console.log(evt);
    let channel = evt.data[0] & 0xf;
    let cmd = evt.data[0] >> 4;
    let note_number = evt.data[1];
    let vel = evt.data[2];
    //console.log(channel, cmd, note_number, vel);
    if (cmd === 8 || (cmd === 9 && vel === 0)) {
      // NOTE_OFF
      release(MIDI_KEY_NAMES[note_number - 9 + MIDI_TRANSPOSE]);
    } else if (cmd === 9) {
      // NOTE_ON
      if ((evt.target as any).volume !== undefined)
        vel *= (evt.target as any).volume;
      press(MIDI_KEY_NAMES[note_number - 9 + MIDI_TRANSPOSE], vel / 100);
    } else if (cmd === 11) {
      // CONTROL_CHANGE
      if (!gAutoSustain) {
        if (note_number === 64) {
          if (vel > 0) {
            pressSustain();
          } else {
            releaseSustain();
          }
        }
      }
    }
  }

  deviceInfo(dev: WebMidi.MIDIInput | WebMidi.MIDIOutput) {
    return {
      type: dev.type,
      //id: dev.id,
      manufacturer: dev.manufacturer,
      name: dev.name,
      version: dev.version,
      //connection: dev.connection,
      //state: dev.state,
      enabled: (dev as any).enabled as boolean,
      volume: (dev as any).volume as number
    };
  }

  updateDevices() {
    let list = [];
    if (midi.inputs.size > 0) {
      let inputs = midi.inputs.values();
      for (let input_it = inputs.next(); input_it && !input_it.done; input_it = inputs.next()) {
        let input = input_it.value;
        list.push(deviceInfo(input));
      }
    }
    if (midi.outputs.size > 0) {
      let outputs = midi.outputs.values();
      for (let output_it = outputs.next(); output_it && !output_it.done; output_it = outputs.next()) {
        let output = output_it.value;
        list.push(deviceInfo(output));
      }
    }
    let new_json = JSON.stringify(list);
    if (new_json !== devices_json) {
      devices_json = new_json;
      sendDevices();
    }
  }

  plug() {
    if (midi.inputs.size > 0) {
      let inputs = midi.inputs.values();
      for (let input_it = inputs.next(); input_it && !input_it.done; input_it = inputs.next()) {
        let input = input_it.value;
        //input.removeEventListener("midimessage", midimessagehandler);
        //input.addEventListener("midimessage", midimessagehandler);
        input.onmidimessage = midimessagehandler;
        if ((input as any).enabled !== false) {
          (input as any).enabled = true;
        }
        if (typeof (input as any).volume === "undefined") {
          (input as any).volume = 1.0;
        }
        console.log("input", input);
      }
    }
    if (midi.outputs.size > 0) {
      let outputs = midi.outputs.values();
      for (let output_it = outputs.next(); output_it && !output_it.done; output_it = outputs.next()) {
        let output = output_it.value;
        //output.enabled = false; // edit: don't touch
        if (typeof (output as any).volume === "undefined") {
          (output as any).volume = 1.0;
        }
        console.log("output", output);
      }
      gMidiOutTest = function(note_name: string, vel: number, delay_ms: number) {
        let note_number = MIDI_KEY_NAMES.indexOf(note_name);
        if (note_number == -1) return;
        note_number = note_number + 9 - MIDI_TRANSPOSE;

        let outputs = midi.outputs.values();
        for (let output_it = outputs.next(); output_it && !output_it.done; output_it = outputs.next()) {
          let output = output_it.value;
          if ((output as any).enabled) {
            let v = vel;
            if ((output as any).volume !== undefined)
              v *= (output as any).volume;
            output.send([0x90, note_number, v], window.performance.now() + delay_ms);
          }
        }
      }
    }
    showConnections(false);
    updateDevices();
  }

  showConnections(sticky: boolean) {
    //if(document.getElementById("Notification-MIDI-Connections"))
    //sticky = 1; // todo: instead, 
    let inputs_ul = document.createElement("ul")!;
    if (midi.inputs.size > 0) {
      let inputs = midi.inputs.values();
      for (let input_it = inputs.next(); input_it && !input_it.done; input_it = inputs.next()) {
        let input = input_it.value;
        let li = document.createElement("li")!;
        (li as any).connectionId = input.id;
        li.classList.add("connection");
        if ((input as any).enabled) li.classList.add("enabled");
        li.textContent = input.name!;
        li.addEventListener("click", function(evt) {
          let inputs = midi.inputs.values();
          for (let input_it = inputs.next(); input_it && !input_it.done; input_it = inputs.next()) {
            let input = input_it.value;
            if (input.id === (evt.target as any).connectionId) {
              (input as any).enabled = !(input as any).enabled;
              (evt.target as HTMLElement).classList.toggle("enabled");
              console.log("click", input);
              updateDevices();
              return;
            }
          }
        });
        if (gMidiVolumeTest) {
          let knobCanvas = document.createElement("canvas")!;
          knobCanvas.width = 16 * window.devicePixelRatio;
          knobCanvas.height = 16 * window.devicePixelRatio;
          knobCanvas.className = "knob";
          li.appendChild(knobCanvas);
          let knob = new Knob(knobCanvas, 0, 2, 0.01, (input as any).volume, "volume");
          knob.canvas.style.width = "16px";
          knob.canvas.style.height = "16px";
          knob.canvas.style.float = "right";
          knob.on("change", function(k: Knob) {
            (input as any).volume = k.value;
          });
          knob.emit("change", knob);
        }
        inputs_ul.appendChild(li);
      }
    } else {
      inputs_ul.textContent = "(none)";
    }
    let outputs_ul = document.createElement("ul");
    if (midi.outputs.size > 0) {
      let outputs = midi.outputs.values();
      for (let output_it = outputs.next(); output_it && !output_it.done; output_it = outputs.next()) {
        let output = output_it.value;
        let li = document.createElement("li")!;
        (li as any).connectionId = output.id;
        li.classList.add("connection");
        if ((output as any).enabled) li.classList.add("enabled");
        li.textContent = output.name!;
        li.addEventListener("click", function (evt) {
          let outputs = midi.outputs.values();
          for (let output_it = outputs.next(); output_it && !output_it.done; output_it = outputs.next()) {
            let output = output_it.value;
            if (output.id === (evt.target as any).connectionId) {
              (output as any).enabled = !(output as any).enabled;
              (evt.target as HTMLElement).classList.toggle("enabled");
              console.log("click", output);
              updateDevices();
              return;
            }
          }
        });
        if (gMidiVolumeTest) {
          let knobCanvas = document.createElement("canvas")!;
          mixin(knobCanvas, {
            width: 16 * window.devicePixelRatio,
            height: 16 * window.devicePixelRatio,
            className: "knob"
          });
          li.appendChild(knobCanvas);
          let knob = new Knob(knobCanvas, 0, 2, 0.01, (output as any).volume, "volume");
          knob.canvas.style.width = "16px";
          knob.canvas.style.height = "16px";
          knob.canvas.style.float = "right";
          knob.on("change", function(k: Knob) {
            (output as any).volume = k.value;
          });
          knob.emit("change", knob);
        }
        outputs_ul.appendChild(li);
      }
    } else {
      outputs_ul.textContent = "(none)";
    }
    let div = document.createElement("div");
    let h1 = document.createElement("h1");
    h1.textContent = "Inputs";
    div.appendChild(h1);
    div.appendChild(inputs_ul);
    h1 = document.createElement("h1");
    h1.textContent = "Outputs";
    div.appendChild(h1);
    div.appendChild(outputs_ul);
    this.connectionsNotification = new MPPNotification({
      "id": "MIDI-Connections",
      "title": "MIDI Connections",
      "duration": parseFloat(sticky ? "-1" : "4500"),
      "html": div,
      "target": "#midi-btn"
    });
  }
  
  init() {
    this.midi.addEventListener("statechange", evt => {
      //if(evt instanceof MIDIConnectionEvent) { // TODO this isn't fully supported
        this.plug();
      //}
    });

    this.plug();

    document.getElementById("midi-btn")!.addEventListener("click", (evt => {
      if (!document.getElementById("Notification-MIDI-Connections"))
        this.showConnections(true);
      else {
        this.connectionsNotification.close();
      }
    }));
  }
}