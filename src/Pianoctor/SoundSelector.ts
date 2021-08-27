// Soundpack Stuff by electrashave ♥

////////////////////////////////////////////////////////////////

import { PianoKey } from "./PianoKey";
import { Notification } from "../Interface/Notification";
import { Piano } from "./Piano";
import * as $ from "jquery";

interface Pack {
  ext: string;
  html: HTMLLIElement;
  keys: string[];
  name: string;
  url: string;
}
interface PackSpec {
  name: string;
  keys: string[];
  ext: string;
  url: string;
}

export class SoundSelector {
  initialized: boolean;
  keys: Record<string, PianoKey>;
  loading: Record<string, boolean>;
  notification: Notification;
  packs: Pack[];
  piano: Piano;
  soundSelection: string;

  constructor(piano: Piano) {
    this.initialized = false;
    this.keys = piano.keys;
    this.loading = {};
    this.packs = [];
    this.piano = piano;
    this.soundSelection = localStorage.soundSelection ? localStorage.soundSelection : "MPP Classic";
    this.addPack({
      name: "MPP Classic",
      keys: Object.keys(this.piano.keys),
      ext: ".mp3",
      url: "/sounds/mppclassic/"
    });
  }
  
  addPack(pack: PackSpec | string, load?: boolean) {
    let self = this;
    
    function add(obj: Pack) {
      let added = false;
      if (obj.url.substr(obj.url.length - 1) != "/") obj.url += "/";
      self.loading[obj.url] = true;
      for (let i = 0; self.packs.length > i; i++) {
        if (obj.name === self.packs[i].name) {
          added = true;
          break;
        }
      }

      if (added) return console.warn("Soundpack already added!!"); //no adding soundpacks twice D:<

      let html = document.createElement("li");
      html.className = "pack"; //* Changed to add - Hri7566
      html.innerText = obj.name + " (" + obj.keys.length + " keys)";
      html.onclick = function() {
        self.loadPack(obj.name);
        self.notification.close();
      };
      obj.html = html;
      self.packs.push(obj);
      self.packs.sort(function(a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      if (load) self.loadPack(obj.name);
      delete self.loading[obj.url];
    }
    
    if (typeof pack === "string") {
      $.getJSON(pack + "/info.json").done(function(json) {
        json.url = pack;
        add(json);
      });
    } else add(pack as Pack);
  }

  addPacks(packs: (PackSpec | string)[]) {
    for (let i = 0; packs.length > i; i++) this.addPack(packs[i]);
  }

  init() {
    let self = this;
    if (self.initialized) return console.warn("Sound selector already initialized!");

    if (!!Object.keys(self.loading).length) return setTimeout(function() {
      self.init();
    }, 250);

    $("#sound-btn").on("click", function() {
      if (document.getElementById("Notification-Sound-Selector") !== null)
        return self.notification.close();
      let html = document.createElement("ul");
      //$(html).append("<p>Current Sound: " + self.soundSelection + "</p>");

      for (let i = 0; self.packs.length > i; i++) {
        let pack = self.packs[i];
        if (pack.name == self.soundSelection) pack.html.className = "pack enabled";
        else pack.html.className = "pack";
        html.appendChild(pack.html);
      }

      self.notification = new Notification({
        title: "Sound Selector",
        html: html,
        id: "Sound-Selector",
        duration: -1,
        target: "#sound-btn"
      });
    });
    self.initialized = true;
    self.loadPack(self.soundSelection, true);
  }

  loadPack(packName: string, f?: boolean): void {
    let pack = this.packs.find(p => p.name === packName);
    if (!pack) {
      console.warn("Sound pack does not exist! Loading default pack...");
      return this.loadPack("MPP Classic");
    }
    
    if (pack.name === this.soundSelection && !f) return;
    if (pack.keys.length !== Object.keys(this.piano.keys).length) {
      this.piano.keys = {};
      for (let i = 0; pack.keys.length > i; i++) {
        this.piano.keys[pack.keys[i]] = this.keys[pack.keys[i]];
      }
      this.piano.renderer.resize();
    }

    let self = this;
    for (let k in this.piano.keys) {
      if (!this.piano.keys.hasOwnProperty(k)) continue;
      (function () {
        let key = self.piano.keys[k];
        key.loaded = false;
        delete self.piano.audio.sounds[k];
        self.piano.audio.load(key.note, pack.url + key.note + pack.ext, function() {
          key.loaded = true;
          key.timeLoaded = Date.now();
        });
      })();
    }
    if (localStorage) localStorage.soundSelection = pack.name;
    this.soundSelection = pack.name;
  }

  removePack(name: string) {
    let found = false;
    for (let i = 0; i < this.packs.length; i++) {
      let pack = this.packs[i];
      if (pack.name === name) {
        this.packs.splice(i, 1);
        if (pack.name === this.soundSelection) this.loadPack(this.packs[0].name); //add mpp default if none?
        break;
      }
    }
    if (!found) console.warn("Sound pack not found!");
  }
}
