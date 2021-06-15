import * as $ from 'jquery';
import "./util.ts";
import "./Client.ts";
import "./Color.ts";
import "./ebsprite.js";
import "./NoteQuota.ts";


interface NotificationInput {
	id?: string,
	title?: string,
	text?: string,
	html?: string | HTMLElement,
	target?: string,
	duration?: number
	class?: string;
}

interface MIDIPort {
	id: string;
	manufacturer ? : string;
	name ? : string;
	type: string;
	version ? : string;
	state: string;
	connection: string;
	onstatechange: Function;
};

/*interface MIDIConnectionEvent {
	port: MIDIPort;
};*/

$(function() {
	let test_mode = window.location.hash && window.location.hash.match(/^(?:#.+)*#test(?:#.+)*$/i);
	let gSeeOwnCursor = window.location.hash && window.location.hash.match(/^(?:#.+)*#seeowncursor(?:#.+)*$/i);
	let gMidiVolumeTest = window.location.hash && window.location.hash.match(/^(?:#.+)*#midivolumetest(?:#.+)*$/i);
	let gMidiOutTest: (note_name: string, vel: number, delay_ms: number) => void;

	let DEFAULT_VELOCITY = 0.5;
	let TIMING_TARGET = 1000;


	// Utility

	////////////////////////////////////////////////////////////////

	class Rect {
		x: number;
		y: number;
		w: number;
		h: number;
		x2: number;
		y2: number;

		constructor(x: number, y: number, w: number, h: number) {
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.x2 = x + w;
			this.y2 = y + h;
		}

		contains(x: number, y: number) {
			return (x >= this.x && x <= this.x2 && y >= this.y && y <= this.y2);
		}
	}

	// performing translation

	////////////////////////////////////////////////////////////////

	class Translation {
		language: string;
		strings: Record<string, Record<string, string>> = {
			"people are playing": {
				"pt": "pessoas estão jogando",
				"es": "personas están jugando",
				"ru": "человек играет",
				"fr": "personnes jouent",
				"ja": "人が遊んでいる",
				"de": "Leute spielen",
				"zh": "人在玩",
				"nl": "mensen spelen",
				"pl": "osób grają",
				"hu": "ember játszik"
			},
			"New Room...": {
				"pt": "Nova Sala ...",
				"es": "Nueva sala de...",
				"ru": "Новый номер...",
				"ja": "新しい部屋",
				"zh": "新房间",
				"nl": "nieuwe Kamer",
				"hu": "új szoba"
			},
			"room name": {
				"pt": "nome da sala",
				"es": "sala de nombre",
				"ru": "название комнаты",
				"fr": "nom de la chambre",
				"ja": "ルーム名",
				"de": "Raumnamen",
				"zh": "房间名称",
				"nl": "kamernaam",
				"pl": "nazwa pokój",
				"hu": "szoba neve"
			},
			"Visible (open to everyone)": {
				"pt": "Visível (aberto a todos)",
				"es": "Visible (abierto a todo el mundo)",
				"ru": "Visible (открытый для всех)",
				"fr": "Visible (ouvert à tous)",
				"ja": "目に見える（誰にでも開いている）",
				"de": "Sichtbar (offen für alle)",
				"zh": "可见（向所有人开放）",
				"nl": "Zichtbaar (open voor iedereen)",
				"pl": "Widoczne (otwarte dla wszystkich)",
				"hu": "Látható (nyitott mindenki számára)"
			},
			"Enable Chat": {
				"pt": "Ativar bate-papo",
				"es": "Habilitar chat",
				"ru": "Включить чат",
				"fr": "Activer discuter",
				"ja": "チャットを有効にする",
				"de": "aktivieren Sie chatten",
				"zh": "启用聊天",
				"nl": "Chat inschakelen",
				"pl": "Włącz czat",
				"hu": "a csevegést"
			},
			"Play Alone": {
				"pt": "Jogar Sozinho",
				"es": "Jugar Solo",
				"ru": "Играть в одиночку",
				"fr": "Jouez Seul",
				"ja": "一人でプレイ",
				"de": "Alleine Spielen",
				"zh": "独自玩耍",
				"nl": "Speel Alleen",
				"pl": "Zagraj sam",
				"hu": "Játssz egyedül"
			}
			// todo: it, tr, th, sv, ar, fi, nb, da, sv, he, cs, ko, ro, vi, id, nb, el, sk, bg, lt, sl, hr
			// todo: Connecting, Offline mode, input placeholder, Notifications
		};
		constructor() {
			this.language = this.getLanguage();
		}

		setLanguage(lang: string) {
			this.language = lang;
		}

		getLanguage(): string {
			if (window.navigator && navigator.language && navigator.language.length >= 2) {
				return navigator.language.substr(0, 2).toLowerCase();
			} else {
				return "en";
			}
		}

		get(text: string, lang: string = this.language): string {
			let row = this.strings[text];
			if (row === undefined) return text;
			let string = row[lang];
			if (string === undefined) return text;
			return string;
		}

		perform(lang: string = this.language) {
			let self = this;
			$(".translate").each(function(i: number, ele: HTMLElement) {
				let th = $(this);
				//if (ele.nodeName === "INPUT") {
				if (ele instanceof HTMLInputElement) {
					if (typeof ele.placeholder !== "undefined") {
						th.attr("placeholder", self.get(th.attr("placeholder")!, lang));
					}
				} else {
					th.text(self.get(th.text(), lang));
				}
			});
		}
	}

	let translation = new Translation();
	translation.perform();















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
				//TODO: How to typescriptify workerTimer.js?
				this.worker = new Worker("/js/workerTimer.js");
				let self = this;
				this.worker.onmessage = function(event) {
					if (event.data.args)
						if (event.data.args.action === 0) {
							self.actualPlay(event.data.args.id, event.data.args.vol, event.data.args.time, event.data.args.part_id);
						}
					else {
						self.actualStop(event.data.args.id, event.data.args.time, event.data.args.part_id);
					}
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
					this.worker.postMessage({
						delay: delay,
						args: {
							action: 0 /*play*/,
							id: id,
							vol: vol,
							time: time,
							part_id: part_id
						}
					}); // but start scheduling right before play.
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
					this.worker.postMessage({
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

	class CanvasRenderer extends Renderer {
		canvas: HTMLCanvasElement;
		ctx: CanvasRenderingContext2D;
		blackKeyHeight: number;
		whiteKeyHeight: number;
		whiteKeyWidth: number;
		blackKeyWidth: number;
		blackKeyOffset: number;
		keyMovement: number;
		whiteBlipWidth: number;
		whiteBlipHeight: number;
		whiteBlipX: number;
		whiteBlipY: number;
		blackBlipWidth: number;
		blackBlipHeight: number;
		blackBlipY: number;
		blackBlipX: number;
		whiteKeyRender: HTMLCanvasElement;
		blackKeyRender: HTMLCanvasElement;
		shadowRender: HTMLCanvasElement[];
		//noteLyrics;

		constructor() {
			super();
		}

		init(piano: PianoAPI) {
			this.canvas = document.createElement("canvas");
			this.ctx = this.canvas.getContext("2d")!;
			piano.rootElement.appendChild(this.canvas);
			
			super.init(piano);
			
			// create render loop
			let self = this;
			let render = function() {
				self.redraw();
				requestAnimationFrame(render);
			};
			requestAnimationFrame(render);

			// add event listeners
			let mouse_down: boolean = false;
			let last_key: PianoKey | null = null;
			$(piano.rootElement).mousedown(function(event) {
				mouse_down = true;
				//event.stopPropagation();
				event.preventDefault();

				let pos = CanvasRenderer.translateMouseEvent(event);
				let hit = self.getHit(pos.x, pos.y);
				if (hit) {
					press(hit.key.note, hit.v);
					last_key = hit.key;
				}
			});

			piano.rootElement.addEventListener("touchstart", function(event) {
				mouse_down = true;
				//event.stopPropagation();
				event.preventDefault();
				for (let i in event.changedTouches) {
					let pos = CanvasRenderer.translateMouseEvent(event.changedTouches[i]);
					let hit = self.getHit(pos.x, pos.y);
					if (hit) {
						press(hit.key.note, hit.v);
						last_key = hit.key;
					}
				}
			}, false);

			$(window).mouseup(function(event) {
				if (last_key) {
					release(last_key.note);
				}
				mouse_down = false;
				last_key = null;
			});
			/*$(piano.rootElement).mousemove(function(event) {
				if (!mouse_down) return;
				let pos = CanvasRenderer.translateMouseEvent(event);
				let hit = self.getHit(pos.x, pos.y);
				if (hit && hit.key != last_key) {
					press(hit.key.note, hit.v);
					last_key = hit.key;
				}
			});*/

			return this;
		}

		resize(width?: number, height?: number) {
			super.resize(width, height);
			if (this.width < 52 * 2) this.width = 52 * 2;
			if (this.height < this.width * 0.2) this.height = Math.floor(this.width * 0.2);
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.canvas.style.width = this.width / window.devicePixelRatio + "px";
			this.canvas.style.height = this.height / window.devicePixelRatio + "px";

			// calculate key sizes
			this.whiteKeyWidth = Math.floor(this.width / 52);
			this.whiteKeyHeight = Math.floor(this.height * 0.9);
			this.blackKeyWidth = Math.floor(this.whiteKeyWidth * 0.75);
			this.blackKeyHeight = Math.floor(this.height * 0.5);

			this.blackKeyOffset = Math.floor(this.whiteKeyWidth - (this.blackKeyWidth / 2));
			this.keyMovement = Math.floor(this.whiteKeyHeight * 0.015);

			this.whiteBlipWidth = Math.floor(this.whiteKeyWidth * 0.7);
			this.whiteBlipHeight = Math.floor(this.whiteBlipWidth * 0.8);
			this.whiteBlipX = Math.floor((this.whiteKeyWidth - this.whiteBlipWidth) / 2);
			this.whiteBlipY = Math.floor(this.whiteKeyHeight - this.whiteBlipHeight * 1.2);
			this.blackBlipWidth = Math.floor(this.blackKeyWidth * 0.7);
			this.blackBlipHeight = Math.floor(this.blackBlipWidth * 0.8);
			this.blackBlipY = Math.floor(this.blackKeyHeight - this.blackBlipHeight * 1.2);
			this.blackBlipX = Math.floor((this.blackKeyWidth - this.blackBlipWidth) / 2);
			
			let ctx: CanvasRenderingContext2D;
			// prerender white key
			this.whiteKeyRender = document.createElement("canvas");
			this.whiteKeyRender.width = this.whiteKeyWidth;
			this.whiteKeyRender.height = this.height + 10;
			ctx = this.whiteKeyRender.getContext("2d")!;
			if (ctx.createLinearGradient) {
				var gradient = ctx.createLinearGradient(0, 0, 0, this.whiteKeyHeight);
				gradient.addColorStop(0, "#eee");
				gradient.addColorStop(0.75, "#fff");
				gradient.addColorStop(1, "#dad4d4");
				ctx.fillStyle = gradient;
			} else {
				ctx.fillStyle = "#fff";
			}
			ctx.strokeStyle = "#000";
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.lineWidth = 10;
			ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.whiteKeyWidth - ctx.lineWidth, this.whiteKeyHeight - ctx.lineWidth);
			ctx.lineWidth = 4;
			ctx.fillRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.whiteKeyWidth - ctx.lineWidth, this.whiteKeyHeight - ctx.lineWidth);

			// prerender black key
			this.blackKeyRender = document.createElement("canvas");
			this.blackKeyRender.width = this.blackKeyWidth + 10;
			this.blackKeyRender.height = this.blackKeyHeight + 10;
			ctx = this.blackKeyRender.getContext("2d")!;
			if (ctx.createLinearGradient) {
				var gradient = ctx.createLinearGradient(0, 0, 0, this.blackKeyHeight);
				gradient.addColorStop(0, "#000");
				gradient.addColorStop(1, "#444");
				ctx.fillStyle = gradient;
			} else {
				ctx.fillStyle = "#000";
			}
			ctx.strokeStyle = "#222";
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.lineWidth = 8;
			ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.blackKeyWidth - ctx.lineWidth, this.blackKeyHeight - ctx.lineWidth);
			ctx.lineWidth = 4;
			ctx.fillRect(ctx.lineWidth / 2, ctx.lineWidth / 2, this.blackKeyWidth - ctx.lineWidth, this.blackKeyHeight - ctx.lineWidth);

			// prerender shadows
			this.shadowRender = [];
			let y = -this.canvas.height * 2;
			for (let j = 0; j < 2; j++) {
				let canvas = document.createElement("canvas");
				this.shadowRender[j] = canvas;
				canvas.width = this.canvas.width;
				canvas.height = this.canvas.height;
				let ctx = canvas.getContext("2d")!;
				let sharp = j ? true : false;
				ctx.lineJoin = "round";
				ctx.lineCap = "round";
				ctx.lineWidth = 1;
				ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
				ctx.shadowBlur = this.keyMovement * 3;
				ctx.shadowOffsetY = -y + this.keyMovement;
				if (sharp) {
					ctx.shadowOffsetX = this.keyMovement;
				} else {
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = -y + this.keyMovement;
				}
				for (let i in this.piano.keys) {
					if (!this.piano.keys.hasOwnProperty(i)) continue;
					let key = this.piano.keys[i];
					if (key.sharp !== sharp) continue;

					if (key.sharp) {
						ctx.fillRect(this.blackKeyOffset + this.whiteKeyWidth * key.spatial + ctx.lineWidth / 2,
							y + ctx.lineWidth / 2,
							this.blackKeyWidth - ctx.lineWidth, this.blackKeyHeight - ctx.lineWidth);
					} else {
						ctx.fillRect(this.whiteKeyWidth * key.spatial + ctx.lineWidth / 2,
							y + ctx.lineWidth / 2,
							this.whiteKeyWidth - ctx.lineWidth, this.whiteKeyHeight - ctx.lineWidth);
					}
				}
			}

			// update key rects
			for (let i in this.piano.keys) {
				if (!this.piano.keys.hasOwnProperty(i)) continue;
				let key = this.piano.keys[i];
				if (key.sharp) {
					key.rect = new Rect(this.blackKeyOffset + this.whiteKeyWidth * key.spatial, 0,
						this.blackKeyWidth, this.blackKeyHeight);
				} else {
					key.rect = new Rect(this.whiteKeyWidth * key.spatial, 0,
						this.whiteKeyWidth, this.whiteKeyHeight);
				}
			}
		}
		
		visualize(key: PianoKey, color: string) {
			key.timePlayed = Date.now();
			key.blips.push({
				time: key.timePlayed,
				color: color
			});
		}

		redraw() {
			let now = Date.now();
			let timeLoadedEnd = now - 1000;
			let timePlayedEnd = now - 100;
			let timeBlipEnd = now - 1000;

			this.ctx.save();
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			// draw all keys
			for (let j = 0; j < 2; j++) {
				this.ctx.globalAlpha = 1.0;
				this.ctx.drawImage(this.shadowRender[j], 0, 0);
				let sharp = j ? true : false;
				for (let i in this.piano.keys) {
					if (!this.piano.keys.hasOwnProperty(i)) continue;
					let key = this.piano.keys[i];
					if (key.sharp != sharp) continue;
					
					if (!key.loaded) {
						this.ctx.globalAlpha = 0.2;
					} else if (key.timeLoaded > timeLoadedEnd) {
						this.ctx.globalAlpha = ((now - key.timeLoaded) / 1000) * 0.8 + 0.2;
					} else {
						this.ctx.globalAlpha = 1.0;
					}
					let y = 0;
					if (key.timePlayed > timePlayedEnd) {
						y = Math.floor(this.keyMovement - (((now - key.timePlayed) / 100) * this.keyMovement));
					}
					let x = Math.floor(key.sharp ? this.blackKeyOffset + this.whiteKeyWidth * key.spatial :
						this.whiteKeyWidth * key.spatial);
					let image: HTMLCanvasElement;
					if (key.sharp == true) {
						image = this.blackKeyRender;
					} else {
						image = this.whiteKeyRender;
					}
					try {
						this.ctx.drawImage(image, x, y);
					} catch (err) {

					}

					// render blips
					if (key.blips.length) {
						let alpha = this.ctx.globalAlpha;
						let w: number, h: number;
						if (key.sharp) {
							x += this.blackBlipX;
							y = this.blackBlipY;
							w = this.blackBlipWidth;
							h = this.blackBlipHeight;
						} else {
							x += this.whiteBlipX;
							y = this.whiteBlipY;
							w = this.whiteBlipWidth;
							h = this.whiteBlipHeight;
						}
						for (let b = 0; b < key.blips.length; b++) {
							let blip = key.blips[b];
							if (blip.time > timeBlipEnd) {
								this.ctx.fillStyle = blip.color;
								this.ctx.globalAlpha = alpha - ((now - blip.time) / 1000);
								this.ctx.fillRect(x, y, w, h);
							} else {
								key.blips.splice(b, 1);
								--b;
							}
							y -= Math.floor(h * 1.1);
						}
					}
				}
			}
			this.ctx.restore();
		}
		
		/*renderNoteLyrics() {
			for (let part_id in this.noteLyrics) {
				if (!this.noteLyrics.hasOwnProperty(i)) continue;
				let lyric = this.noteLyrics[part_id];
				let lyric_x = x;
				let lyric_y = this.whiteKeyHeight + 1;
				this.ctx.fillStyle = key.lyric.color;
				let alpha = this.ctx.globalAlpha;
				this.ctx.globalAlpha = alpha - ((now - key.lyric.time) / 1000);
				this.ctx.fillRect(x, y, 10, 10);
			}
		}*/

		getHit(x: number, y: number): {key: PianoKey, v: number} | null {
			for (let j = 0; j < 2; j++) {
				let sharp = j ? false : true; // black keys first
				for (let i in this.piano.keys) {
					if (!this.piano.keys.hasOwnProperty(i)) continue;
					let key = this.piano.keys[i];
					if (key.sharp != sharp) continue;
					if (key.rect.contains(x, y)) {
						let v = y / (key.sharp ? this.blackKeyHeight : this.whiteKeyHeight);
						v += 0.25;
						v *= DEFAULT_VELOCITY;
						if (v > 1.0) v = 1.0;
						return {
							key: key,
							v: v
						};
					}
				}
			}
			return null;
		}

		isSupported(): boolean {
			let canvas = document.createElement("canvas");
			return !!(canvas.getContext && canvas.getContext("2d"));
		}
		
		static translateMouseEvent(evt: Touch | JQuery.MouseDownEvent<HTMLElement, null, HTMLElement, HTMLElement>): {x: number, y: number} {
			let element: HTMLElement | null = evt.target as HTMLElement;
			let offx = 0;
			let offy = 0;
			do {
				if (!element) break; // wtf, wtf?
				offx += element.offsetLeft;
				offy += element.offsetTop;
			} while (element = element.offsetParent as HTMLElement | null);
			return {
				x: (evt.pageX - offx) * window.devicePixelRatio,
				y: (evt.pageY - offy) * window.devicePixelRatio
			}
		}
	}

	// Soundpack Stuff by electrashave ♥

	////////////////////////////////////////////////////////////////
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

	class SoundSelector {
		initialized: boolean;
		keys: Record<string, PianoKey>;
		loading: Record<string, boolean>;
		notification: Notification;
		packs: Pack[];
		piano: PianoAPI;
		soundSelection: string;

		constructor(piano: PianoAPI) {
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
		
		addPack(pack: PackSpec | string, load?: any) {
			let self = this;
			self.loading[typeof pack === "string" ? pack : pack.url] = true;
			
			function add(obj: Pack) {
				let added = false;
				for (let i = 0; self.packs.length > i; i++) {
					if (obj.name === self.packs[i].name) {
						added = true;
						break;
					}
				}

				if (added) return console.warn("Sounds already added!!"); //no adding soundpacks twice D:<

				if (obj.url.substr(obj.url.length - 1) !== "/") obj.url += "/";
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
			} else add(pack as Pack); //validate packs??
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
				for (let i = 0; pack.keys.length > i; i++) this.piano.keys[pack.keys[i]] = this.keys[pack.keys[i]];
				this.piano.renderer.resize();
			}

			let self = this;
			for (let k in this.piano.keys) {
				if (!this.piano.keys.hasOwnProperty(k)) continue;
				(function () {
					let key = self.piano.keys[k];
					key.loaded = false;
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

	// Pianoctor

	////////////////////////////////////////////////////////////////
	
	class PianoKey {
		note: string;
		baseNote: string;
		octave: number;
		sharp: boolean;
		loaded: boolean;
		timeLoaded: number;
		domElement: HTMLElement | null;
		timePlayed: number;
		blips: Blip[];
		spatial: number;
		rect: Rect;
		
		constructor(note: string, octave: number) {
			this.note = note + octave;
			this.baseNote = note;
			this.octave = octave;
			this.sharp = note.indexOf("s") != -1;
			this.loaded = false;
			this.timeLoaded = 0;
			this.domElement = null;
			this.timePlayed = 0;
			this.blips = [];
		}
	}
	
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

	let gPiano = new Piano(document.getElementById("piano")!);

	let gSoundSelector = new SoundSelector(gPiano);
	gSoundSelector.addPacks(["/sounds/Emotional_2.0/", "/sounds/Harp/", "/sounds/Music_Box/", "/sounds/Vintage_Upright/", "/sounds/Steinway_Grand/", "/sounds/Emotional/", "/sounds/Untitled/"]);
	gSoundSelector.init();







	let gAutoSustain = false;
	let gSustain = false;

	let gHeldNotes: Record<string, boolean> = {};
	let gSustainedNotes: Record<string, boolean> = {};


	function press(id: string, vol: number = DEFAULT_VELOCITY) {
		if (!gClient.preventsPlaying() && gNoteQuota.spend(1)) {
			gHeldNotes[id] = true;
			gSustainedNotes[id] = true;
			gPiano.play(id, vol, gClient.getOwnParticipant(), 0);
			gClient.startNote(id, vol);
		}
	}

	function release(id: string) {
		if (gHeldNotes[id]) {
			gHeldNotes[id] = false;
			if ((gAutoSustain || gSustain) && !enableSynth) {
				gSustainedNotes[id] = true;
			} else {
				if (gNoteQuota.spend(1)) {
					gPiano.stop(id, gClient.getOwnParticipant(), 0);
					gClient.stopNote(id);
					gSustainedNotes[id] = false;
				}
			}
		}
	}

	function pressSustain() {
		gSustain = true;
	}

	function releaseSustain() {
		gSustain = false;
		if (!gAutoSustain) {
			for (let id in gSustainedNotes) {
				if (gSustainedNotes.hasOwnProperty(id) && gSustainedNotes[id] && !gHeldNotes[id]) {
					gSustainedNotes[id] = false;
					if (gNoteQuota.spend(1)) {
						gPiano.stop(id, gClient.getOwnParticipant(), 0);
						gClient.stopNote(id);
					}
				}
			}
		}
	}






	/*
	function getParameterByName(name: string, url = window.location.href): string | null {
		name = name.replace(/[\[\]]/g, "\\$&");
		let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return "";
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
	*/
	// internet science

	////////////////////////////////////////////////////////////////

	let channel_id = decodeURIComponent(window.location.pathname/*getParameterByName("c")!*/);
	if (channel_id.substr(0, 1) === "/") channel_id = channel_id.substr(1);
	if (channel_id === "") channel_id = "lobby";

	let wssport = window.location.hostname === "www.multiplayerpiano.com" ? 443 : 8443;
	let gClient = new Client((window.location.hostname.includes("localhost") ?  "ws://" : "wss://") + window.location.hostname + ":" + wssport);
	gClient.setChannel(channel_id);
	gClient.start();

	gClient.on("disconnect", function (evt) {
		console.log(evt);
	});

	// Setting status
	(function () {
		gClient.on("status", function (status) {
			$("#status").text(status);
		});
		gClient.on("count", function (count) {
			if (count > 0) {
				$("#status").html('<span class="number">' + count + '</span> ' + (count == 1 ? 'person is' : 'people are') + ' playing');
				document.title = "Piano (" + count + ")";
			} else {
				document.title = "Multiplayer Piano";
			}
		});
	})();

	// Handle changes to participants
	(function () {
		gClient.on("participant added", function(part: Participant) {

			part.displayX = 150;
			part.displayY = 50;

			// add nameDiv
			let div: HTMLElement;
			div = document.createElement("div");
			div.className = "name";
			(div as any).participantId = part.id; // Bruh
			div.textContent = part.name || "";
			div.style.backgroundColor = part.color || "#777";
			if (gClient.participantId === part.id) {
				$(div).addClass("me");
			}
			if (gClient.channel && gClient.channel.crown && gClient.channel.crown.participantId === part.id) {
				$(div).addClass("owner");
			}
			if (gPianoMutes.indexOf(part._id!) !== -1) {
				$(part.nameDiv!).addClass("muted-notes");
			}
			if (gChatMutes.indexOf(part._id!) !== -1) {
				$(part.nameDiv!).addClass("muted-chat");
			}
			div.style.display = "none";
			part.nameDiv = $("#names")[0].appendChild(div);
			$(part.nameDiv).fadeIn(2000);

			// sort names
			let arr: any = $("#names .name"); // -_-
			arr.sort(function(a: HTMLElement, b: HTMLElement) {
				let a_ = a.style.backgroundColor; // todo: sort based on user id instead
				let b_ = b.style.backgroundColor;
				if (a_ > b_) return 1;
				else if (a_ < b_) return -1;
				else return 0;
			});
			$("#names").html(arr);

			// add cursorDiv
			if (gClient.participantId !== part.id || gSeeOwnCursor) {
				let div = document.createElement("div");
				div.className = "cursor";
				div.style.display = "none";
				part.cursorDiv = $("#cursors")[0].appendChild(div);
				$(part.cursorDiv).fadeIn(2000);

				div = document.createElement("div");
				div.className = "name";
				div.style.backgroundColor = part.color || "#777"
				div.textContent = part.name || "";
				part.cursorDiv.appendChild(div);

			} else {
				part.cursorDiv = undefined;
			}
		});
		gClient.on("participant removed", function(part: Participant) {
			// remove nameDiv
			let nd = $(part.nameDiv!);
			let cd = $(part.cursorDiv!);
			cd.fadeOut(2000);
			nd.fadeOut(2000, function () {
				nd.remove();
				cd.remove();
				part.nameDiv = undefined;
				part.cursorDiv = undefined;
			});
		});
		gClient.on("participant update", function(part: Participant) {
			let name = part.name || "";
			let color = part.color || "#777";
			part.nameDiv!.style.backgroundColor = color;
			part.nameDiv!.textContent = name;
			$(part.cursorDiv!)
				.find(".name")
				.text(name)
				.css("background-color", color);
		});
		gClient.on("ch", function(msg) {
			for (let id in gClient.ppl) {
				if (gClient.ppl.hasOwnProperty(id)) {
					let part = gClient.ppl[id];
					if (part.id === gClient.participantId) {
						$(part.nameDiv!).addClass("me");
					} else {
						$(part.nameDiv!).removeClass("me");
					}
					if (msg.ch.crown && msg.ch.crown.participantId === part.id) {
						$(part.nameDiv!).addClass("owner");
						$(part.cursorDiv!).addClass("owner");
					} else {
						$(part.nameDiv!).removeClass("owner");
						$(part.cursorDiv!).removeClass("owner");
					}
					if (gPianoMutes.indexOf(part._id!) !== -1) {
						$(part.nameDiv!).addClass("muted-notes");
					} else {
						$(part.nameDiv!).removeClass("muted-notes");
					}
					if (gChatMutes.indexOf(part._id!) !== -1) {
						$(part.nameDiv!).addClass("muted-chat");
					} else {
						$(part.nameDiv!).removeClass("muted-chat");
					}
				}
			}
		});

		function updateCursor(msg: InMessageM) {
			const part = gClient.ppl[msg.id];
			if (part && part.cursorDiv) {
				part.cursorDiv.style.left = msg.x + "%";
				part.cursorDiv.style.top = msg.y + "%";
			}
		}
		gClient.on("m", updateCursor);
		gClient.on("participant added", updateCursor);
	})();


	// Handle changes to crown
	(function () {
		let jqcrown = $('<div id="crown"></div>').appendTo(document.body).hide();
		let jqcountdown = $('<span></span>').appendTo(jqcrown);
		let countdown_interval: number;
		jqcrown.click(function() {
			gClient.sendArray([{
				m: "chown",
				id: gClient.participantId!
			}]);
		});
		gClient.on("ch", function(msg) {
			if (msg.ch.crown) {
				let crown = msg.ch.crown;
				if (!crown.participantId || !gClient.ppl[crown.participantId]) {
					let land_time = crown.time + 2000 - gClient.serverTimeOffset;
					let avail_time = crown.time + 15000 - gClient.serverTimeOffset;
					jqcountdown.text("");
					jqcrown.show();
					if (land_time - Date.now() <= 0) {
						jqcrown.css({
							"left": crown.endPos.x + "%",
							"top": crown.endPos.y + "%"
						});
					} else {
						jqcrown.css({
							"left": crown.startPos.x + "%",
							"top": crown.startPos.y + "%"
						});
						jqcrown.addClass("spin");
						jqcrown.animate({
							"left": crown.endPos.x + "%",
							"top": crown.endPos.y + "%"
						}, 2000, "linear", function () {
							jqcrown.removeClass("spin");
						});
					}
					clearInterval(countdown_interval);
					countdown_interval = window.setInterval(function () {
						let time = Date.now();
						if (time >= land_time) {
							let ms = avail_time - time;
							if (ms > 0) {
								jqcountdown.text(Math.ceil(ms / 1000) + "s");
							} else {
								jqcountdown.text("");
								clearInterval(countdown_interval);
							}
						}
					}, 1000);
				} else {
					jqcrown.hide();
				}
			} else {
				jqcrown.hide();
			}
		});
		gClient.on("disconnect", function () {
			jqcrown.fadeOut(2000);
		});
	})();


	// Playing notes
	gClient.on("n", function(msg) {
		let t = msg.t - gClient.serverTimeOffset + TIMING_TARGET - Date.now();
		let participant = gClient.findParticipantById(msg.p);
		if (gPianoMutes.indexOf(participant._id!) !== -1)
			return;
		for (let i = 0; i < msg.n.length; i++) {
			let note = msg.n[i];
			let ms = t + (note.d || 0);
			if (ms < 0) {
				ms = 0;
			} else if (ms > 10000) continue;
			if (note.s) {
				gPiano.stop(note.n, participant, ms);
			} else {
				let vel = (typeof note.v !== "undefined") ? parseFloat(note.v as unknown as string) : DEFAULT_VELOCITY;
				if (!vel) vel = 0;
				else if (vel < 0) vel = 0;
				else if (vel > 1) vel = 1;
				gPiano.play(note.n, vel, participant, ms);
				if (enableSynth) {
					gPiano.stop(note.n, participant, ms + 1000);
				}
			}
		}
	});

	// Send cursor updates
	let mx: number = 0;
	let last_mx: number = -10;
	let my: number = 0;
	let last_my: number = -10;
	setInterval(function() {
		if (Math.abs(mx - last_mx) > 0.1 || Math.abs(my - last_my) > 0.1) {
			last_mx = mx;
			last_my = my;
			gClient.sendArray([{
				m: "m",
				x: mx,
				y: my
			}]);
			if (gSeeOwnCursor) {
				gClient.emit("m", {
					m: "m",
					id: gClient.participantId!,
					x: mx,
					y: my
				});
			}
			let part = gClient.getOwnParticipant();
			if (part) {
				part.x = mx;
				part.y = my;
			}
		}
	}, 50);
	$(document).on("mousemove", event => { //! ANCHOR - Changed from .mousemove() to .on('mousemove') - Hri7566
		mx = parseFloat(((event.pageX / $(window).width()!) * 100).toFixed(2));
		my = parseFloat(((event.pageY / $(window).height()!) * 100).toFixed(2));
	});

	// Room settings button
	(function () {
		gClient.on("ch", function(msg) {
			if (gClient.isOwner()) {
				$("#room-settings-btn").show();
			} else {
				$("#room-settings-btn").hide();
			}
		});
		$("#room-settings-btn").click(function(evt) {
			if (gClient.channel && gClient.isOwner()) {
				let settings = gClient.channel.settings;
				openModal("#room-settings");
				setTimeout(function() {
					$("#room-settings .checkbox[name=visible]").prop("checked", settings.visible);
					$("#room-settings .checkbox[name=chat]").prop("checked", settings.chat);
					$("#room-settings .checkbox[name=crownsolo]").prop("checked", settings.crownsolo);
					$("#room-settings input[name=color]").val(settings.color!);
				}, 100);
			}
		});
		$("#room-settings .submit").click(function() {
			let settings = {
				visible: $("#room-settings .checkbox[name=visible]").is(":checked"),
				chat: $("#room-settings .checkbox[name=chat]").is(":checked"),
				crownsolo: $("#room-settings .checkbox[name=crownsolo]").is(":checked"),
				color: $("#room-settings input[name=color]").val() as string
			};
			gClient.setChannelSettings(settings);
			closeModal();
		});
		$("#room-settings .drop-crown").click(function() {
			closeModal();
			if (confirm("This will drop the crown...!"))
				gClient.sendArray([{
					m: "chown"
				}]);
		});
	})();

	// Handle notifications
	gClient.on("notification", function(msg) {
		new Notification(msg);
	});

	// Don't foget spin
	gClient.on("ch", function(msg) {
		let chidlo = msg.ch._id.toLowerCase();
		if (chidlo === "spin" || chidlo.substr(-5) === "/spin") {
			$("#piano").addClass("spin");
		} else {
			$("#piano").removeClass("spin");
		}
	});

	/*function eb() {
		if(gClient.channel && gClient.channel._id.toLowerCase() === "test/fishing") {
			ebsprite.start(gClient);
		} else {
			ebsprite.stop();
		}
	}
	if(ebsprite) {
		gClient.on("ch", eb);
		eb();
	}*/

	// Crownsolo notice
	gClient.on("ch", function(msg) {
		let notice = "";
		let has_notice = false;
		if (msg.ch.settings.crownsolo) {
			has_notice = true;
			notice += '<p>This room is set to "only the owner can play."</p>';
		}
		if (msg.ch.settings['no cussing']) {
			has_notice = true;
			notice += '<p>This room is set to "no cussing."</p>';
		}
		let notice_div = $("#room-notice");
		if (has_notice) {
			notice_div.html(notice);
			if (notice_div.is(':hidden')) notice_div.fadeIn(1000);
		} else {
			if (notice_div.is(':visible')) notice_div.fadeOut(1000);
		}
	});
	gClient.on("disconnect", function() {
		$("#room-notice").fadeOut(1000);
	});


	// Background color
	(function () {
		let old_color1 = new Color("#000000");
		let old_color2 = new Color("#000000");

		function setColor(hex: string, hex2: string) {
			let color1 = new Color(hex);
			let color2 = new Color(hex2 || hex);
			if (!hex2)
				color2.add(-0x40, -0x40, -0x40);

			let bottom = document.getElementById("bottom")!;

			let duration = 500;
			let step = 0;
			let steps = 30;
			let step_ms = duration / steps;
			let difference = new Color(color1.r, color1.g, color1.b);
			difference.r -= old_color1.r;
			difference.g -= old_color1.g;
			difference.b -= old_color1.b;
			let inc1 = new Color(difference.r / steps, difference.g / steps, difference.b / steps);
			difference = new Color(color2.r, color2.g, color2.b);
			difference.r -= old_color2.r;
			difference.g -= old_color2.g;
			difference.b -= old_color2.b;
			let inc2 = new Color(difference.r / steps, difference.g / steps, difference.b / steps);
			let iv = setInterval(function () {
				old_color1.add(inc1.r, inc1.g, inc1.b);
				old_color2.add(inc2.r, inc2.g, inc2.b);
				document.body.style.background = "radial-gradient(ellipse at center, " + old_color1.toHexa() + " 0%," + old_color2.toHexa() + " 100%)";
				bottom.style.background = old_color2.toHexa();
				if (++step >= steps) {
					clearInterval(iv);
					old_color1 = color1;
					old_color2 = color2;
					document.body.style.background = "radial-gradient(ellipse at center, " + color1.toHexa() + " 0%," + color2.toHexa() + " 100%)";
					bottom.style.background = color2.toHexa();
				}
			}, step_ms);
		}

		function setColorToDefault() {
			setColor("#000000", "#000000");
		}

		setColorToDefault();

		gClient.on("ch", function (ch) {
			if (ch.ch.settings) {
				if (ch.ch.settings.color) {
					setColor(ch.ch.settings.color, ch.ch.settings.color2!);
				} else {
					setColorToDefault();
				}
			}
		});
	})();





	let gPianoMutes = (localStorage.pianoMutes ? localStorage.pianoMutes as string : "").split(',').filter(v => v);
	let gChatMutes = (localStorage.pianoMutes ? localStorage.pianoMutes as string : "").split(',').filter(v => v);


















	let volume_slider = document.getElementById("volume-slider") as HTMLInputElement;
	volume_slider.value = String(gPiano.audio.volume);
	$("#volume-label").text("Volume: " + Math.floor(gPiano.audio.volume * 100) + "%");
	volume_slider.addEventListener("input", function(evt) {
		let v = +volume_slider.value;
		gPiano.audio.setVolume(v);
		if (window.localStorage) localStorage.volume = v;
		$("#volume-label").text("Volume: " + Math.floor(v * 100) + "%");
	});
	
	class Note {
		note: string;
		octave: number;
		
		constructor(note: string, octave: number = 0) {
			this.note = note;
			this.octave = octave;
		}
	}

	function n(a: string, b?: number): {note: Note, held: boolean} {
		return {
			note: new Note(a, b),
			held: false
		};
	}
	let key_binding: Record<number, {note: Note, held: boolean}> = {
		65: n("gs"),
		90: n("a"),
		83: n("as"),
		88: n("b"),
		67: n("c", 1),
		70: n("cs", 1),
		86: n("d", 1),
		71: n("ds", 1),
		66: n("e", 1),
		78: n("f", 1),
		74: n("fs", 1),
		77: n("g", 1),
		75: n("gs", 1),
		188: n("a", 1),
		76: n("as", 1),
		190: n("b", 1),
		191: n("c", 2),
		222: n("cs", 2),

		49: n("gs", 1),
		81: n("a", 1),
		50: n("as", 1),
		87: n("b", 1),
		69: n("c", 2),
		52: n("cs", 2),
		82: n("d", 2),
		53: n("ds", 2),
		84: n("e", 2),
		89: n("f", 2),
		55: n("fs", 2),
		85: n("g", 2),
		56: n("gs", 2),
		73: n("a", 2),
		57: n("as", 2),
		79: n("b", 2),
		80: n("c", 3),
		189: n("cs", 3),
		173: n("cs", 3), // firefox why
		219: n("d", 3),
		187: n("ds", 3),
		61: n("ds", 3), // firefox why
		221: n("e", 3)
	};

	let capsLockKey = false;

	let transpose_octave = 0;

	function handleKeyDown(evt: JQuery.KeyDownEvent) {
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

	function handleKeyUp(evt: JQuery.KeyUpEvent) {
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

	function handleKeyPress(evt: JQuery.KeyPressEvent) {
		evt.preventDefault();
		evt.stopPropagation();
		if (evt.keyCode === 27 || evt.keyCode === 13) {
			//$("#chat input").focus();
		}
		return false;
	}

	function recapListener(evt: JQuery.MouseDownEvent | JQuery.TouchStartEvent) {
		captureKeyboard();
	}

	function captureKeyboard() {
		$("#piano").off("mousedown", recapListener);
		$("#piano").off("touchstart", recapListener);
		$(document).on("keydown", handleKeyDown); //! These two lines had an error, so I added any (might be a bad idea) - Hri7566
		$(document).on("keyup", handleKeyUp);
		$(window).on("keypress", handleKeyPress);
	};

	function releaseKeyboard() {
		$(document).off("keydown", handleKeyDown); //! I did it here, too - Hri7566
		$(document).off("keyup", handleKeyUp);
		$(window).off("keypress", handleKeyPress);
		$("#piano").on("mousedown", recapListener);
		$("#piano").on("touchstart", recapListener);
	};

	captureKeyboard();


	function velocityFromMouseY(): number {
		return 0.1 + (my / 100) * 0.6;
	}





	// NoteQuota
	let gNoteQuota = (function() {
		let last_rat = 0;
		let nqjq = $("#quota .value");
		setInterval(function () {
			gNoteQuota.tick();
		}, 2000);
		return new NoteQuota(function(points) {
			// update UI
			let rat = (points / this.max) * 100;
			if (rat <= last_rat)
				nqjq.stop(true, true).css("width", rat.toFixed(0) + "%");
			else
				nqjq.stop(true, true).animate({
					"width": rat.toFixed(0) + "%"
				}, 2000, "linear");
			last_rat = rat;
		});
	})();
	gClient.on("nq", function(nq_params) {
		gNoteQuota.setParams(nq_params);
	});
	gClient.on("disconnect", function() {
		gNoteQuota.setParams(NoteQuota.PARAMS_OFFLINE);
	});



	// click participant names
	(function () {
		let ele = document.getElementById("names")!;
		function touchhandler(e: MouseEvent | TouchEvent) {
			let target_jq = $(e.target!);
			if (target_jq.hasClass("name")) {
				target_jq.addClass("play");
				if ((e.target as any).participantId == gClient.participantId) {
					openModal("#rename", "input[name=name]");
					setTimeout(function () {
						$("#rename input[name=name]").val(gClient.ppl[gClient.participantId!].name!);
						$("#rename input[name=color]").val(gClient.ppl[gClient.participantId!].color!);
					}, 100);
				} else if ((e.target as any).participantId) {
					let id = (e.target as any).participantId;
					let part = gClient.ppl[id] || null;
					if (part) {
						participantMenu(part);
						e.stopPropagation();
					}
				}
			}
		}
		ele.addEventListener("mousedown", touchhandler);
		ele.addEventListener("touchstart", touchhandler);
		function releasehandler(e: MouseEvent | TouchEvent) {
			$("#names .name").removeClass("play");
		}
		document.body.addEventListener("mouseup", releasehandler);
		document.body.addEventListener("touchend", releasehandler);

		function removeParticipantMenus() {
			$(".participant-menu").remove();
			$(".participantSpotlight").hide();
			document.removeEventListener("mousedown", removeParticipantMenus);
			document.removeEventListener("touchstart", removeParticipantMenus);
		};

		function participantMenu(part: Participant) {
			if (!part) return;
			removeParticipantMenus();
			document.addEventListener("mousedown", removeParticipantMenus);
			document.addEventListener("touchstart", removeParticipantMenus);
			$("#" + part.id).find(".enemySpotlight").show();
			let menu = $('<div class="participant-menu"></div>');
			$("body").append(menu);
			// move menu to name position
			let jq_nd = $(part.nameDiv!);
			let pos = jq_nd.position();
			menu.css({
				"top": pos.top + jq_nd.height()! + 15,
				"left": pos.left + 6,
				"background": part.color || "black"
			});
			menu.on("mousedown touchstart", function(evt) {
				evt.stopPropagation();
				let target = $(evt.target);
				if (target.hasClass("menu-item")) {
					target.addClass("clicked");
					menu.fadeOut(200, function() {
						removeParticipantMenus();
					});
				}
			});
			// this spaces stuff out but also can be used for informational
			$('<div class="info"></div>').appendTo(menu).text(part._id!);
			// add menu items
			if (gPianoMutes.indexOf(part._id!) == -1) {
				$('<div class="menu-item">Mute Notes</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						gPianoMutes.push(part._id!);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						$(part.nameDiv!).addClass("muted-notes");
					});
			} else {
				$('<div class="menu-item">Unmute Notes</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						let i;
						while ((i = gPianoMutes.indexOf(part._id!)) != -1)
							gPianoMutes.splice(i, 1);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						$(part.nameDiv!).removeClass("muted-notes");
					});
			}
			if (gChatMutes.indexOf(part._id!) == -1) {
				$('<div class="menu-item">Mute Chat</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						gChatMutes.push(part._id!);
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).addClass("muted-chat");
					});
			} else {
				$('<div class="menu-item">Unmute Chat</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						let i;
						while ((i = gChatMutes.indexOf(part._id!)) != -1)
							gChatMutes.splice(i, 1);
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).removeClass("muted-chat");
					});
			}
			if (!(gPianoMutes.indexOf(part._id!) >= 0) || !(gChatMutes.indexOf(part._id!) >= 0)) {
				$('<div class="menu-item">Mute Completely</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						gPianoMutes.push(part._id!);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						gChatMutes.push(part._id!);
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).addClass("muted-notes");
						$(part.nameDiv!).addClass("muted-chat");
					});
			}
			if ((gPianoMutes.indexOf(part._id!) >= 0) || (gChatMutes.indexOf(part._id!) >= 0)) {
				$('<div class="menu-item">Unmute Completely</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						let i;
						while ((i = gPianoMutes.indexOf(part._id!)) != -1)
							gPianoMutes.splice(i, 1);
						while ((i = gChatMutes.indexOf(part._id!)) != -1)
							gChatMutes.splice(i, 1);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).removeClass("muted-notes");
						$(part.nameDiv!).removeClass("muted-chat");
					});
			}
			if (gClient.isOwner()) {
				$('<div class="menu-item give-crown">Give Crown</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						if (confirm("Give room ownership to " + part.name + "?"))
							gClient.sendArray([{
								m: "chown",
								id: part.id
							}]);
					});
				$('<div class="menu-item kickban">Kickban</div>').appendTo(menu)
					.on("mousedown touchstart", function (evt) {
						let minutesRaw = prompt("How many minutes? (0-60)", "30");
						if (minutesRaw === null) return;
						let minutes = parseFloat(minutesRaw) || 0;
						let ms = minutes * 60 * 1000;
						gClient.sendArray([{
							m: "kickban",
							_id: part._id!,
							ms: ms
						}]);
					});
			}
			menu.fadeIn(100);
		}
	})();
















	// Notification class

	////////////////////////////////////////////////////////////////

	class Notification extends EventEmitter {
		id: string;
		title: string;
		text: string;
		html: string | HTMLElement;
		target: JQuery<HTMLElement>;
		duration: number;
		domElement: JQuery<HTMLElement>;
		class: string;

		constructor(par: NotificationInput = {}) {
			super();

			this.id = "Notification-" + (par.id || Math.random());
			this.title = par.title || "";
			this.text = par.text || "";
			this.html = par.html || "";
			this.target = $(par.target || "#piano");
			this.duration = par.duration || 30000;
			this["class"] = par["class"] || "classic";

			let self = this;
			let eles = $("#" + this.id);
			if (eles.length > 0) {
				eles.remove();
			}
			this.domElement = $('<div class="notification"><div class="notification-body"><div class="title"></div>' +
				'<div class="text"></div></div><div class="x">Ⓧ</div></div>');
			this.domElement[0].id = this.id;
			this.domElement.addClass(this["class"]);
			this.domElement.find(".title").text(this.title);
			if (this.text.length > 0) {
				this.domElement.find(".text").text(this.text);
			} else if (this.html instanceof HTMLElement) {
				this.domElement.find(".text")[0].appendChild(this.html);
			} else if (this.html.length > 0) {
				this.domElement.find(".text").html(this.html);
			}
			document.body.appendChild(this.domElement.get(0));

			this.position();
			window.addEventListener("resize", this.onresize);

			this.domElement.find(".x").click(function() {
				self.close();
			});

			if (this.duration > 0) {
				setTimeout(function() {
					self.close();
				}, this.duration);
			}
		}
		
		onresize() {
			this.position();
		}

		position() {
			let pos = this.target.offset()!;
			let x = pos.left - (this.domElement.width()! / 2) + (this.target.width()! / 4);
			let y = pos.top - this.domElement.height()! - 8;
			let width = this.domElement.width()!;
			if (x + width > $("body").width()!) {
				x -= ((x + width) - $("body").width()!);
			}
			if (x < 0) x = 0;
			this.domElement.offset({
				left: x,
				top: y
			});
		}

		close() {
			let self = this;
			window.removeEventListener("resize", this.onresize);
			this.domElement.fadeOut(500, function() {
				self.domElement.remove();
				self.emit("close");
			});
		}
	}

	// set variables from settings or set settings

	////////////////////////////////////////////////////////////////

	let gKeyboardSeq = 0;
	let gKnowsYouCanUseKeyboard = false;
	let gKnowsYouCanUseKeyboardTimeout: number;
	let gKnowsYouCanUseKeyboardNotification: Notification | undefined;
	if (localStorage && localStorage.knowsYouCanUseKeyboard) gKnowsYouCanUseKeyboard = true;
	if (!gKnowsYouCanUseKeyboard) {
		gKnowsYouCanUseKeyboardTimeout = window.setTimeout(function () {
			gKnowsYouCanUseKeyboardNotification = new Notification({
				title: "Did you know!?!",
				text: "You can play the piano with your keyboard, too.  Try it!",
				target: "#piano",
				duration: 10000
			});
		}, 30000);
	}
	
	let gHasBeenHereBefore: boolean;
	if (window.localStorage) {
		if (localStorage.volume) {
			volume_slider.value = localStorage.volume;
			gPiano.audio.setVolume(localStorage.volume);
			$("#volume-label").text("Volume: " + Math.floor(gPiano.audio.volume * 100) + "%");
		} else localStorage.volume = gPiano.audio.volume;

		gHasBeenHereBefore = (localStorage.gHasBeenHereBefore || false);
		if (gHasBeenHereBefore) {}
		localStorage.gHasBeenHereBefore = true;

	}




	// warn user about loud noises before starting sound (no autoplay)
	openModal("#sound-warning");
	function user_interact(evt: MouseEvent) {
		document.removeEventListener("click", user_interact);
		closeModal();
		MPP.piano.audio.resume();
	}
	document.addEventListener("click", user_interact);













	// New room, change room

	////////////////////////////////////////////////////////////////

	$("#room > .info").text("--");
	gClient.on("ch", function(msg) {
		let channel = msg.ch;
		let info = $("#room > .info");
		info.text(channel._id);
		if (channel.settings.lobby) info.addClass("lobby");
		else info.removeClass("lobby");
		if (!channel.settings.chat) info.addClass("no-chat");
		else info.removeClass("no-chat");
		if (channel.settings.crownsolo) info.addClass("crownsolo");
		else info.removeClass("crownsolo");
		if (channel.settings['no cussing']) info.addClass("no-cussing");
		else info.removeClass("no-cussing");
		if (!channel.settings.visible) info.addClass("not-visible");
		else info.removeClass("not-visible");
	});
	gClient.on("ls", function(ls) {
		for (let i in ls.u) {
			if (!ls.u.hasOwnProperty(i)) continue;
			let room = ls.u[i];
			let info = $("#room .info[roomname=\"" + (room._id + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + "\"]");
			if (info.length === 0) {
				info = $("<div class=\"info\"></div>");
				info.attr("roomname", room._id);
				$("#room .more").append(info);
			}
			info.text(room._id + " (" + room.count + ")");
			if (room.settings.lobby) info.addClass("lobby");
			else info.removeClass("lobby");
			if (!room.settings.chat) info.addClass("no-chat");
			else info.removeClass("no-chat");
			if (room.settings.crownsolo) info.addClass("crownsolo");
			else info.removeClass("crownsolo");
			if (room.settings['no cussing']) info.addClass("no-cussing");
			else info.removeClass("no-cussing");
			if (!room.settings.visible) info.addClass("not-visible");
			else info.removeClass("not-visible");
			if (room.banned) info.addClass("banned");
			else info.removeClass("banned");
		}
	});
	$("#room").on("click", function(evt) {
		evt.stopPropagation();

		// clicks on a new room
		if ($(evt.target).hasClass("info") && $(evt.target).parents(".more").length) {
			$("#room .more").fadeOut(250);
			let selected_name = $(evt.target).attr("roomname");
			if (typeof selected_name !== "undefined") {
				changeRoom(selected_name, "right");
			}
			return false;
		}
		// clicks on "New Room..."
		else if ($(evt.target).hasClass("new")) {
			openModal("#new-room", "input[name=name]");
		}
		// all other clicks
		function doc_click(evt: JQuery.MouseDownEvent) {
			if ($(evt.target).is("#room .more")) return;
			$(document).off("mousedown", doc_click);
			$("#room .more").fadeOut(250);
			gClient.sendArray([{
				m: "-ls"
			}]);
		}
		$(document).on("mousedown", doc_click);
		$("#room .more .info").remove();
		$("#room .more").show();
		gClient.sendArray([{
			m: "+ls"
		}]);
	});
	$("#new-room-btn").on("click", function(evt) {
		evt.stopPropagation();
		openModal("#new-room", "input[name=name]");
	});


	$("#play-alone-btn").on("click", function(evt) {
		evt.stopPropagation();
		let room_name = "Room" + Math.floor(Math.random() * 1000000000000);
		changeRoom(room_name, "right", {
			"visible": false
		});
		setTimeout(function() {
			new Notification({
				id: "share",
				title: "Playing alone",
				html: 'You are playing alone in a room by yourself, but you can always invite \
				friends by sending them the link.<br/><br/>\
				<a href="#" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href),\'facebook-share-dialog\',\'width=626,height=436\');return false;">Share on Facebook</a><br/><br/>\
				<a href="http://twitter.com/home?status=' + encodeURIComponent(location.href) + '" target="_blank">Tweet</a>',
				duration: 25000
			});
		}, 1000);
	});



	let gModal: string | null;

	function modalHandleEsc(evt: JQuery.KeyDownEvent) {
		if (evt.keyCode == 27) {
			closeModal();
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

	function openModal(selector: string, focus?: string) {
		if (chat) chat.blur();
		releaseKeyboard();
		$(document).on("keydown", modalHandleEsc);
		$("#modal #modals > *").hide();
		$("#modal").fadeIn(250);
		$(selector).show();
		setTimeout(function () {
			$(selector).find(focus as any).focus();
		}, 100);
		gModal = selector;
	}

	function closeModal() {
		$(document).off("keydown", modalHandleEsc);
		$("#modal").fadeOut(100);
		$("#modal #modals > *").hide();
		captureKeyboard();
		gModal = null;
	}

	let modal_bg = $("#modal .bg")[0];
	$(modal_bg).on("click", function(evt) {
		if (evt.target !== modal_bg) return;
		closeModal();
	});

	(function () {
		function submit() {
			let name = $("#new-room .text[name=name]").val() as string;
			let settings = {
				visible: $("#new-room .checkbox[name=visible]").is(":checked"),
				chat: true
			};
			$("#new-room .text[name=name]").val("");
			closeModal();
			changeRoom(name, "right", settings);
			setTimeout(function() {
				new Notification({
					id: "share",
					title: "Created a Room",
					html: 'You can invite friends to your room by sending them the link.<br/><br/>\
				<a href="#" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href),\'facebook-share-dialog\',\'width=626,height=436\');return false;">Share on Facebook</a><br/><br/>\
				<a href="http://web.archive.org/web/20200825094242/http://twitter.com/home?status=' + encodeURIComponent(location.href) + '" target="_blank">Tweet</a>',
					duration: 25000
				});
			}, 1000);
		}
		$("#new-room .submit").click(function(evt) {
			submit();
		});
		$("#new-room .text[name=name]").keypress(function(evt) {
			if (evt.keyCode == 13) {
				submit();
			} else if (evt.keyCode == 27) {
				closeModal();
			} else {
				return;
			}
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		});
	})();








	function changeRoom(name: string, direction: string = "right", settings: ChannelSettings = {}, push: boolean = true) {
		let opposite = direction == "left" ? "right" : "left";

		if (name === "") name = "lobby";
		if (gClient.channel && gClient.channel._id === name) return;
		if (push) {
			let url = "/" + encodeURIComponent(name).replace("'", "%27");
			if (window.history && history.pushState) {
				history.pushState({
					"depth": gHistoryDepth += 1,
					"name": name
				}, "Piano > " + name, url);
			} else {
				window.location.href = url;
				return;
			}
		}

		gClient.setChannel(name, settings);

		let t = 0,
			d = 100;
		$("#piano").addClass("ease-out").addClass("slide-" + opposite);
		setTimeout(function() {
			$("#piano").removeClass("ease-out").removeClass("slide-" + opposite).addClass("slide-" + direction);
		}, t += d);
		setTimeout(function() {
			$("#piano").addClass("ease-in").removeClass("slide-" + direction);
		}, t += d);
		setTimeout(function() {
			$("#piano").removeClass("ease-in");
		}, t += d);
	};

	let gHistoryDepth = 0;
	$(window).on("popstate", function(evt) {
		let depth = (evt as any).state ? (evt as any).state.depth : 0;
		if (depth === gHistoryDepth) return; // <-- forgot why I did that though...

		let direction = depth <= gHistoryDepth ? "left" : "right";
		gHistoryDepth = depth;

		let name = decodeURIComponent(window.location.pathname);
		if (name.substr(0, 1) == "/") name = name.substr(1);
		changeRoom(name, direction, undefined, false);
	});

	// Rename

	////////////////////////////////////////////////////////////////

	(function () {
		function submit() {
			let set = {
				name: $("#rename input[name=name]").val() as string,
				color: $("#rename input[name=color]").val() as string
			};
			//$("#rename .text[name=name]").val("");
			closeModal();
			gClient.sendArray([{
				m: "userset",
				set: set
			}]);
		}
		$("#rename .submit").click(function(evt) {
			submit();
		});
		$("#rename .text[name=name]").keypress(function(evt) {
			if (evt.keyCode === 13) {
				submit();
			} else if (evt.keyCode === 27) {
				closeModal();
			} else {
				return;
			}
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		});
	})();















	// chatctor

	////////////////////////////////////////////////////////////////

	let chat = (function () {
		gClient.on("ch", function(msg) {
			if (msg.ch.settings.chat) {
				chat.show();
			} else {
				chat.hide();
			}
		});
		gClient.on("disconnect", function(msg) {

		});
		gClient.on("c", function(msg) {
			chat.clear();
			if (msg.c) {
				for (let i = 0; i < msg.c.length; i++) {
					chat.receive(msg.c[i]);
				}
			}
		});
		gClient.on("a", function(msg) {
			chat.receive(msg);
		});

		$("#chat input").on("focus", function(evt) {
			releaseKeyboard();
			$("#chat").addClass("chatting");
			chat.scrollToBottom();
		});
		/*$("#chat input").on("blur", function(evt) {
			captureKeyboard();
			$("#chat").removeClass("chatting");
			chat.scrollToBottom();
		});*/
		$(document).mousedown(function(evt) {
			if (!($("#chat").has(evt.target as unknown as Element).length > 0)) {
				chat.blur();
			}
		});
		document.addEventListener("touchstart", function (event) {
			for (let i in event.changedTouches) {
				let touch = event.changedTouches[i];
				if (!($("#chat").has(touch.target as unknown as Element).length > 0)) {
					chat.blur();
				}
			}
		});
		$(document).on("keydown", function(evt) { // TODO keycode deprecations - Hri7566
			if ($("#chat").hasClass("chatting")) {
				if (evt.keyCode === 27) {
					chat.blur();
					evt.preventDefault();
					evt.stopPropagation();
				} else if (evt.keyCode === 13) {
					$("#chat input").focus();
				}
			} else if (!gModal && (evt.keyCode === 27 || evt.keyCode === 13)) {
				$("#chat input").focus();
			}
		});
		$("#chat input").on("keydown", function(evt) {
			if (evt.keyCode === 13) {
				if (MPP.client.isConnected()) {
					let message = $(this).val() as string;
					if (message.length === 0) {
						setTimeout(function() {
							chat.blur();
						}, 100);
					} else if (message.length <= 512) {
						chat.send(message);
						$(this).val("");
						setTimeout(function() {
							chat.blur();
						}, 100);
					}
				}
				evt.preventDefault();
				evt.stopPropagation();
			} else if (evt.keyCode === 27) {
				chat.blur();
				evt.preventDefault();
				evt.stopPropagation();
			} else if (evt.keyCode === 9) {
				evt.preventDefault();
				evt.stopPropagation();
			}
		});

		return {
			show: function() {
				$("#chat").fadeIn();
			},
			hide: function() {
				$("#chat").fadeOut();
			},
			clear: function() {
				$("#chat li").remove();
			},
			scrollToBottom: function() {
				let ele = $("#chat ul").get(0);
				ele.scrollTop = ele.scrollHeight - ele.clientHeight;
			},
			blur: function() {
				if ($("#chat").hasClass("chatting")) {
					$("#chat input").get(0).blur();
					$("#chat").removeClass("chatting");
					chat.scrollToBottom();
					captureKeyboard();
				}
			},
			send: function(message: string) {
				gClient.sendArray([{
					m: "a",
					message: message
				}]);
			},
			receive: function(msg: ChatMessage) {
				if (gChatMutes.indexOf(msg.p._id!) != -1) return;

				let li = $('<li><span class="name"/><span class="message"/>');

				li.find(".name").text(msg.p.name + ":");
				li.find(".message").text(msg.a);
				li.css("color", msg.p.color || "white");

				$("#chat ul").append(li);

				let eles = $("#chat ul li").get() as HTMLElement[];
				for (let i = 1; i <= 50 && i <= eles.length; i++) {
					eles[eles.length - i].style.opacity = String(1.0 - (i * 0.03));
				}
				if (eles.length > 50) {
					eles[0].style.display = "none";
				}
				if (eles.length > 256) {
					$(eles[0]).remove();
				}

				// scroll to bottom if not "chatting" or if not scrolled up
				if (!$("#chat").hasClass("chatting")) {
					chat.scrollToBottom();
				} else {
					let ele = $("#chat ul").get(0);
					if (ele.scrollTop > ele.scrollHeight - ele.offsetHeight - 50)
						chat.scrollToBottom();
				}
			}
		};
	})();















	// MIDI

	////////////////////////////////////////////////////////////////

	let MIDI_TRANSPOSE = -12;
	let MIDI_KEY_NAMES = ["a-1", "as-1", "b-1"];
	let bare_notes = "c cs d ds e f fs g gs a as b".split(" ");
	for (let oct = 0; oct < 7; oct++) {
		for (let i in bare_notes) {
			MIDI_KEY_NAMES.push(bare_notes[i] + oct);
		}
	}
	MIDI_KEY_NAMES.push("c7");

	let devices_json = "[]";

	function sendDevices() {
		gClient.sendArray([{
			"m": "devices",
			"list": JSON.parse(devices_json)
		}]);
	}
	gClient.on("connect", sendDevices);

	(function() {

		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then(
				function (midi) {
					console.log(midi);

					function midimessagehandler(evt: WebMidi.MIDIMessageEvent) {
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

					function deviceInfo(dev: WebMidi.MIDIInput | WebMidi.MIDIOutput) {
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

					function updateDevices() {
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

					function plug() {
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

					midi.addEventListener("statechange", evt => {
						//if(evt instanceof MIDIConnectionEvent) { // TODO this isn't fully supported
							plug();
						//}
					});

					plug();


					let connectionsNotification: Notification;

					function showConnections(sticky: boolean) {
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
						connectionsNotification = new Notification({
							"id": "MIDI-Connections",
							"title": "MIDI Connections",
							"duration": parseFloat(sticky ? "-1" : "4500"),
							"html": div,
							"target": "#midi-btn"
						});
					}

					document.getElementById("midi-btn")!.addEventListener("click", function(evt) {
						if (!document.getElementById("Notification-MIDI-Connections"))
							showConnections(true);
						else {
							connectionsNotification.close();
						}
					});
				},
				function (err) {
					console.log(err);
				});
		}
	})();














	// bug supply

	////////////////////////////////////////////////////////////////

	window.onerror = function(message: string, url_?: string, line_?: number) {
		let url = url_ || "(no url)";
		let line = line_ || "(no line)";
		// errors in socket.io
		if (url.indexOf("socket.io.js") !== -1) {
			if (message.indexOf("INVALID_STATE_ERR") !== -1) return;
			if (message.indexOf("InvalidStateError") !== -1) return;
			if (message.indexOf("DOM Exception 11") !== -1) return;
			if (message.indexOf("Property 'open' of object #<c> is not a function") !== -1) return;
			if (message.indexOf("Cannot call method 'close' of undefined") !== -1) return;
			if (message.indexOf("Cannot call method 'close' of null") !== -1) return;
			if (message.indexOf("Cannot call method 'onClose' of null") !== -1) return;
			if (message.indexOf("Cannot call method 'payload' of null") !== -1) return;
			if (message.indexOf("Unable to get value of the property 'close'") !== -1) return;
			if (message.indexOf("NS_ERROR_NOT_CONNECTED") !== -1) return;
			if (message.indexOf("Unable to get property 'close' of undefined or null reference") !== -1) return;
			if (message.indexOf("Unable to get value of the property 'close': object is null or undefined") !== -1) return;
			if (message.indexOf("this.transport is null") !== -1) return;
		}
		// errors in soundmanager2
		if (url.indexOf("soundmanager2.js") !== -1) {
			// operation disabled in safe mode?
			if (message.indexOf("Could not complete the operation due to error c00d36ef") !== -1) return;
			if (message.indexOf("_s.o._setVolume is not a function") !== -1) return;
		}
		// errors in midibridge
		if (url.indexOf("midibridge") !== -1) {
			if (message.indexOf("Error calling method on NPObject") !== -1) return;
		}
		// too many failing extensions injected in my html
		if (url.indexOf(".js") !== url.length - 3) return;
		// extensions inject cross-domain embeds too
		if (url.toLowerCase().indexOf("multiplayerpiano.com") == -1) return;

		// errors in my code
		if (url.indexOf("script.js") !== -1) {
			if (message.indexOf("Object [object Object] has no method 'on'") !== -1) return;
			if (message.indexOf("Object [object Object] has no method 'off'") !== -1) return;
			if (message.indexOf("Property '$' of object [object Object] is not a function") !== -1) return;
		}

		let enc = "/bugreport/" +
			(message ? encodeURIComponent(message) : "") + "/" +
			(url ? encodeURIComponent(url) : "") + "/" +
			(line ? encodeURIComponent(line) : "");
		let img = new Image();
		img.src = enc;
	};









	// API
	let MPP = {
		press: press,
		release: release,
		pressSustain: pressSustain,
		releaseSustain: releaseSustain,
		piano: gPiano,
		client: gClient,
		chat: chat,
		noteQuota: gNoteQuota,
		soundSelector: gSoundSelector,
		Notification: Notification
	};
	(window as any).MPP = MPP;










	// record mp3
	(function() {
		let button = document.querySelector("#record-btn")!;
		let audio = MPP.piano.audio;
		let context = audio.context;
		let encoder_sample_rate = 44100;
		let encoder_kbps = 128;
		let encoder: any = null;
		let scriptProcessorNode = context.createScriptProcessor(4096, 2, 2);
		let recording = false;
		let recording_start_time = 0;
		let mp3_buffer = [];
		button.addEventListener("click", function(evt) {
			// if (!recording) {
			// 	// start recording
			// 	mp3_buffer = [];
			// 	encoder = new lamejs.Mp3Encoder(2, encoder_sample_rate, encoder_kbps);
			// 	scriptProcessorNode.onaudioprocess = onAudioProcess;
			// 	audio.masterGain.connect(scriptProcessorNode);
			// 	scriptProcessorNode.connect(context.destination);
			// 	recording_start_time = Date.now();
			// 	recording = true;
			// 	button.textContent = "Stop Recording";
			// 	button.classList.add("stuck");
			// new Notification({"id": "mp3", "title": "Recording MP3...", "html": "It's recording now.  This could make things slow, maybe.  Maybe give it a moment to settle before playing.<br><br>This feature is experimental.<br>Send complaints to <a href=\"mailto:multiplayerpiano.com@gmail.com\">multiplayerpiano.com@gmail.com</a>.", "duration": 10000});
			new Notification({
				"id": "mp3",
				"title": "Recording MP3s is broken.",
				"html": "You can no longer record MP3s.",
				"duration": 10000
			});
			// } else {
			// 	// stop recording
			// 	var mp3buf = encoder.flush();
			// 	mp3_buffer.push(mp3buf);
			// 	var blob = new Blob(mp3_buffer, {type: "audio/mp3"});
			// 	var url = URL.createObjectURL(blob);
			// 	scriptProcessorNode.onaudioprocess = null;
			// 	audio.masterGain.disconnect(scriptProcessorNode);
			// 	scriptProcessorNode.disconnect(context.destination);
			// 	recording = false;
			// 	button.textContent = "Record MP3";
			// 	button.classList.remove("stuck");
			// 	new Notification({"id": "mp3", "title": "MP3 recording finished", "html": "<a href=\""+url+"\" target=\"blank\">And here it is!</a> (open or save as)<br><br>This feature is experimental.<br>Send complaints to <a href=\"mailto:multiplayerpiano.com@gmail.com\">multiplayerpiano.com@gmail.com</a>.", "duration": 0});
			// }
		});

		/*function onAudioProcess(evt ? : any) { // TODO replace any
			var inputL = evt.inputBuffer.getChannelData(0);
			var inputR = evt.inputBuffer.getChannelData(1);
			var mp3buf = encoder.encodeBuffer(convert16(inputL), convert16(inputR));
			mp3_buffer.push(mp3buf);
		}*/

		/*function convert16(samples?: Array < any > ) { // TODO replace any
			var len = samples.length;
			var result = new Int16Array(len);
			for (var i = 0; i < len; i++) {
				result[i] = 0x8000 * samples[i];
			}
			return (result);
		}*/
	})();

	// synth
	let enableSynth = false;
	let audio = gPiano.audio;
	let context = gPiano.audio.context;
	let synth_gain = context.createGain();
	synth_gain.gain.value = 0.05;
	synth_gain.connect(audio.synthGain);

	let osc_types: OscillatorType[] = ["sine", "square", "sawtooth", "triangle"];
	let osc_type_index = 1;

	let osc1_type: OscillatorType = "square";
	let osc1_attack = 0;
	let osc1_decay = 0.2;
	let osc1_sustain = 0.5;
	let osc1_release = 2.0;
	
	class synthVoice {
		osc: OscillatorNode;
		gain: GainNode;
		
		constructor(note_name: string, time: number) {
			let note_number = MIDI_KEY_NAMES.indexOf(note_name);
			note_number = note_number + 9 - MIDI_TRANSPOSE;
			let freq = Math.pow(2, (note_number - 69) / 12) * 440.0;
			this.osc = context.createOscillator();
			this.osc.type = osc1_type;
			this.osc.frequency.value = freq;
			this.gain = context.createGain();
			this.gain.gain.value = 0;
			this.osc.connect(this.gain);
			this.gain.connect(synth_gain);
			this.osc.start(time);
			this.gain.gain.setValueAtTime(0, time);
			this.gain.gain.linearRampToValueAtTime(1, time + osc1_attack);
			this.gain.gain.linearRampToValueAtTime(osc1_sustain, time + osc1_attack + osc1_decay);
		}
		
		stop(time: number) {
			//this.gain.gain.setValueAtTime(osc1_sustain, time);
			this.gain.gain.linearRampToValueAtTime(0, time + osc1_release);
			this.osc.stop(time + osc1_release);
		}
	}

	(function () {
		let button = document.getElementById("synth-btn")!;
		let notification: Notification | null;

		button.addEventListener("click", function() {
			if (notification) {
				notification.close();
			} else {
				showSynth();
			}
		});

		function showSynth() {
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
	})();
});

// misc

////////////////////////////////////////////////////////////////

// analytics
(window as any).google_analytics_uacct = "UA-882009-7";
var _gaq: any = _gaq || [];
_gaq.push(['_setAccount', 'UA-882009-7']);
_gaq.push(['_trackPageview']);
_gaq.push(['_setAllowAnchor', true]);
(function () {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode!.insertBefore(ga, s);
})();
/*
// twitter
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;
	js.src="//web.archive.org/web/20200825094242/https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
*/
// fb
/*
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//web.archive.org/web/20200825094242/https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.8";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
*/

// non-ad-free experience
/*(function() {
	function adsOn() {
		if(window.localStorage) {
			var div = document.querySelector("#inclinations");
			div.innerHTML = "Ads:<br>ON / <a id=\"adsoff\" href=\"#\">OFF</a>";
			div.querySelector("#adsoff").addEventListener("click", adsOff);
			localStorage.ads = true;
		}
		// adsterra
		var script = document.createElement("script");
		script.src = "//web.archive.org/web/20200825094242/https://pl132070.puhtml.com/68/7a/97/687a978dd26d579c788cb41e352f5a41.js";
		document.head.appendChild(script);
	}

	function adsOff() {
		if(window.localStorage) localStorage.ads = false;
		document.location.reload(true);
	}

	function noAds() {
		var div = document.querySelector("#inclinations");
		div.innerHTML = "Ads:<br><a id=\"adson\" href=\"#\">ON</a> / OFF";
		div.querySelector("#adson").addEventListener("click", adsOn);
	}

	if(window.localStorage) {
		if(localStorage.ads === undefined || localStorage.ads === "true")
			adsOn();
		else
			noAds();
	} else {
		adsOn();
	}
})();*/