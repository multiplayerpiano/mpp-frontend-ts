interface Participant {
	x?: number;
	y?: number;
	color?: string;
	name?: string;
	_id?: string;
	id?: string;
	nameDiv?: HTMLElement;
	cursorDiv?: HTMLElement;
	displayX?: number;
	displayY?: number;
}

interface Channel {
	_id: string;
	count?: number;
	crown?: {
		participantId: string;
		time: number;
		endPos: {x: number; y: number};
		startPos: {x: number; y: number};
	};
	settings: ChannelSettings
}

interface ChannelSettings {
	chat?: boolean;
	color?: string;
	color2?: string;
	crownsolo?: boolean;
	lobby?: boolean;
	visible?: boolean;
	'no cussing'?: boolean;
}

interface NotificationInput {
	id?: string,
	title?: string,
	text?: string,
	html?: string | HTMLElement,
	target?: string,
	duration?: number
	class?: string;
}

interface Note {
	d?: number;
	s?: number;
	n: string;
	v?: number;
}

interface ChatMessage {
	a: string;
	p: Participant;
}

interface InMessageHi {
	m: "hi";
	motd?: string;
	t: number;
	u?: Participant;
}
interface InMessageT {
	m: "t";
	t: number;
	e?: number;
}
interface InMessageCh {
	m: "ch";
	p: string;
	ppl: {
		color: string;
		id: string;
		_id: string;
		name: string;
	}[];
	ch: Channel;
}
interface InMessageP {
	m: "p";
	id: string;
	_id: string;
	name: string;
	color?: string;
	x?: number;
	y?: number;
}
interface InMessageM {
	m: "m";
	id: string;
	x: number;
	y: number;
}
interface InMessageBye {
	m: "bye";
	p: string;
}
interface InMessageN {
	m: "n";
	t: number;
	p: string;
	n: Note[];
}
interface InMessageNq {
	m: "nq";
	allowance: number;
	max: number;
}
interface InMessageLs {
	m: "ls";
	u: (Channel & {banned: boolean})[];
}
interface InMessageC {
	m: "c";
	c: ChatMessage[];
}
interface InMessageA extends ChatMessage {
	m: "a";
}

interface InMessages {
	"hi": InMessageHi;
	"t": InMessageT;
	"ch": InMessageCh;
	"p": InMessageP;
	"m": InMessageM;
	"bye": InMessageBye;
	"n": InMessageN;
	"nq": InMessageNq;
	"ls": InMessageLs;
	"c": InMessageC;
	"a": InMessageA;
}

interface OutMessageHi {
	m: "hi";
	"🐈"?: number;
}
interface OutMessageT {
	m: "t";
	e: number;
}
interface OutMessageCh {
	m: "ch";
	_id: string;
	set?: ChannelSettings;
}
interface OutMessageUserset {
	m: "userset";
	set: {name: string};
}
interface OutMessageKickban {
	m: "kickban";
	_id: string;
	ms: number;
}
interface OutMessageChown {
	m: "chown";
	id?: string;
}
interface OutMessageN {
	m: "n";
	t: number;
	n: Note[];
}
interface OutMessageM {
	m: "m";
	x: number;
	y: number;
}
interface OutMessageChset {
	m: "chset";
	set: ChannelSettings;
}
interface OutMessageMinusLs {
	m: "-ls";
}
interface OutMessagePlusLs {
	m: "+ls";
}
interface OutMessageA {
	m: "a";
	message: string;
}
interface OutMessageDevices {
	m: "devices";
	list: any;
}
type OutMessage =
	OutMessageHi |
	OutMessageT |
	OutMessageCh |
	OutMessageUserset |
	OutMessageKickban |
	OutMessageChown |
	OutMessageN |
	OutMessageM |
	OutMessageChset |
	OutMessageMinusLs |
	OutMessagePlusLs |
	OutMessageA |
	OutMessageDevices;

declare interface Client {
	on<U extends keyof InMessages>(event: U, listener: (msg: InMessages[U]) => void): void;
	emit<U extends keyof InMessages>(event: U, msg: InMessages[U]): void;
	
	on(event: "status", listener: (status: string) => void): void;
	emit(event: "status", status: string): void;
	on(event: "disconnect", listener: (evt: CloseEvent) => void): void;
	emit(event: "disconnect", evt: CloseEvent): void;
	on(event: "wserror", listener: (err: Event) => void): void;
	emit(event: "wserror", err: Event): void;
	on(event: "connect", listener: () => void): void;
	emit(event: "connect"): void;
	
	on(event: "participant added", listener: (p: Participant) => void): void;
	emit(event: "participant added", p: Participant): void;
	on(event: "participant update", listener: (p: Participant) => void): void;
	emit(event: "participant update", p: Participant): void;
	on(event: "participant removed", listener: (p: Participant) => void): void;
	emit(event: "participant removed", p: Participant): void;
	
	on(event: "count", listener: (count: number) => void): void;
	emit(event: "count", count: number): void;
	on(event: "notification", listener: (input: NotificationInput) => void): void;
	emit(event: "notification", input: NotificationInput): void;
}

class Client extends EventEmitter {
	ws?: WebSocket;
	uri: string;
	serverTimeOffset: number;
	user?: Participant;
	participantId?: string;
	channel?: Channel;
	ppl: Record<string, Participant>;
	connectionTime?: number;
	connectionAttempts: number;
	desiredChannelId?: string;
	desiredChannelSettings?: ChannelSettings;
	pingInterval?: number;
	canConnect: boolean;
	noteBuffer: Note[];
	noteBufferTime: number;
	noteFlushInterval?: number;
	['🐈']: number;
	autoPickupCrown: boolean;
	offlineChannelSettings: ChannelSettings = {color:"#ecfaed"};
	offlineParticipant: Participant = {_id: "", name: "", color: "#777"};

	constructor(uri: string) {
		super();
		this.uri = uri;
		this.ws = undefined;
		this.serverTimeOffset = 0;
		this.user = undefined;
		this.participantId = undefined;
		this.channel = undefined;
		this.ppl = {};
		this.connectionTime = undefined;
		this.connectionAttempts = 0;
		this.desiredChannelId = undefined;
		this.desiredChannelSettings = undefined;
		this.pingInterval = undefined;
		this.canConnect = false;
		this.noteBuffer = [];
		this.noteBufferTime = 0;
		this.noteFlushInterval = undefined;
		this['🐈'] = 0;

		this.offlineParticipant = {
			_id: "",
			name: "",
			color: "#777",
			id: ""
		};

		this.autoPickupCrown = true;

		this.bindEventListeners();
	}

	isSupported(): boolean {
		return typeof WebSocket === "function";
	}

	isConnected(): boolean {
		return this.isSupported() && this.ws !== undefined && this.ws.readyState === WebSocket.OPEN;
	}
	
	isConnecting(): boolean {
		return this.isSupported() && this.ws !== undefined && this.ws.readyState === WebSocket.CONNECTING;
	}

	start() {
		this.canConnect = true;
		this.connect();
	}

	stop() {
		this.canConnect = false;
		this.ws!.close();
	}

	connect() {
		if (!this.canConnect || !this.isSupported() || this.isConnected() || this.isConnecting())
			return;
		this.emit("status", "Connecting...");
		this.ws = new WebSocket(this.uri);
		let self = this;
		this.ws.addEventListener("close", function(evt: CloseEvent) {
			self.user = undefined;
			self.participantId = undefined;
			self.channel = undefined;
			self.setParticipants([]);
			clearInterval(self.pingInterval);
			clearInterval(self.noteFlushInterval);
	
			self.emit("disconnect", evt);
			self.emit("status", "Offline mode");
	
			// reconnect!
			if (self.connectionTime) {
				self.connectionTime = undefined;
				self.connectionAttempts = 0;
			} else {
				++self.connectionAttempts;
			}
			let ms_lut = [50, 2950, 7000, 10000];
			let idx = self.connectionAttempts;
			if (idx >= ms_lut.length) idx = ms_lut.length - 1;
			let ms = ms_lut[idx];
			setTimeout(self.connect.bind(self), ms);
		});
		this.ws.addEventListener("error", function(err: Event) {
			self.emit("wserror", err);
			self.ws!.close(); // self.ws.emit("close");
		});
		this.ws.addEventListener("open", function(evt: Event) {
			self.connectionTime = Date.now();
			self.sendArray([{"m": "hi", "🐈": self['🐈']++ || undefined}]);
			self.pingInterval = window.setInterval(function() {
				self.sendArray([{m: "t", e: Date.now()}]);
			}, 20000);
			//self.sendArray([{m: "t", e: Date.now()}]);
			self.noteBuffer = [];
			self.noteBufferTime = 0;
			self.noteFlushInterval = window.setInterval(function() {
				if(self.noteBufferTime && self.noteBuffer.length > 0) {
					self.sendArray([{m: "n", t: self.noteBufferTime + self.serverTimeOffset, n: self.noteBuffer}]);
					self.noteBufferTime = 0;
					self.noteBuffer = [];
				}
			}, 200);
	
			self.emit("connect");
			self.emit("status", "Joining channel...");
		});
		this.ws.addEventListener("message", function(evt: any) {
			let transmission = JSON.parse(evt.data);
			for (let i = 0; i < transmission.length; i++) {
				let msg = transmission[i];
				self.emit(msg.m, msg);
			}
		});
	}

	bindEventListeners() {
		this.on("hi", msg => {
			this.user = msg.u;
			this.receiveServerTime(msg.t, undefined);
			if (this.desiredChannelId) {
				this.setChannel();
			}
		});

		this.on("t", msg => {
			this.receiveServerTime(msg.t, msg.e || undefined);
		});

		this.on("ch", msg => {
			this.desiredChannelId = msg.ch._id;
			this.desiredChannelSettings = msg.ch.settings;
			this.channel = msg.ch;
			if (msg.p) this.participantId = msg.p;
			this.setParticipants(msg.ppl);
		});

		this.on("p", msg => {
			this.participantUpdate(msg);
			this.emit("participant update", this.findParticipantById(msg.id));
		});

		this.on("m", msg => {
			if (this.ppl.hasOwnProperty(msg.id)) {
				this.participantUpdate(msg);
			}
		});

		this.on("bye", msg => {
			this.removeParticipant(msg.p);
		});

		this.on("ch", msg => {
			if (this.autoPickupCrown) {
				if (msg.ch.crown) {
					var crown = msg.ch.crown;
					if (!crown.participantId || !this.ppl[crown.participantId]) {
						let land_time = crown.time + 2000 - this.serverTimeOffset;
						let avail_time = crown.time + 15000 - this.serverTimeOffset;
						let countdown_interval = setInterval(function() {
							let time = Date.now();
							if (time >= land_time) {
								let ms = avail_time - time;
								if (ms <= 0) {
									clearInterval(countdown_interval);
									this.pickupCrown();
								}
							}
						}, 1000);
					}
				}
			}
		});
	}

	send(raw: string) {
		if (this.isConnected()) this.ws!.send(raw);
	}

	sendArray(arr: OutMessage[]) {
		this.send(JSON.stringify(arr));
	}

	setChannel(id?: string, set?: ChannelSettings) {
		this.desiredChannelId = id || this.desiredChannelId || "lobby";
		this.desiredChannelSettings = set || this.desiredChannelSettings || undefined;
		this.sendArray([{m: "ch", _id: this.desiredChannelId, set: this.desiredChannelSettings}]);
	}

	getChannelSetting<Key extends keyof ChannelSettings>(key: Key): ChannelSettings[Key] {
		if (!this.isConnected() || !this.channel || !this.channel.settings) {
			return this.offlineChannelSettings[key];
		} 
		return this.channel.settings[key];
	}
	
	setChannelSettings(settings: ChannelSettings) {
		if (!this.isConnected() || !this.channel || !this.channel.settings) {
			return;
		}
		if (this.desiredChannelSettings) {
			for (let key in settings) {
				(this.desiredChannelSettings as any)[key] = (settings as any)[key];
			}
			this.sendArray([{m: "chset", set: this.desiredChannelSettings}]);
		}
	}

	getOwnParticipant() {
		return this.findParticipantById(this.participantId!);
	}

	setParticipants(ppl: Participant[]) {
		for (let id in this.ppl) {
			if (!this.ppl.hasOwnProperty(id)) continue;
			let found = false;
			for (let j = 0; j < ppl.length; j++) {
				if (ppl[j].id === id) {
					found = true;
					break;
				}
			}
			if (!found) {
				this.removeParticipant(id);
			}
		}
		// update all
		for (let i = 0; i < ppl.length; i++) {
			this.participantUpdate(ppl[i]);
		}
	}

	countParticipants(): number {
		let count = 0;
		for (let i in this.ppl) {
			if (this.ppl.hasOwnProperty(i)) ++count;
		}
		return count;
	}

	participantUpdate(update: Participant) {
		let part = this.ppl[update.id!] || null;
		if (part === null) {
			part = update;
			this.ppl[part.id!] = part;
			this.emit("participant added", part);
			this.emit("count", this.countParticipants());
		} else {
			if (update.x) part.x = update.x;
			if (update.y) part.y = update.y;
			if (update.color) part.color = update.color;
			if (update.name) part.name = update.name;
		}
	}

	removeParticipant(id: string) {
		if (this.ppl.hasOwnProperty(id)) {
			let part = this.ppl[id];
			delete this.ppl[id];
			this.emit("participant removed", part);
			this.emit("count", this.countParticipants());
		}
	}

	findParticipantById(id: string): Participant {
		return this.ppl[id] || this.offlineParticipant;
	}

	isOwner() {
		return this.channel && this.channel.crown && this.channel.crown.participantId === this.participantId;
	}

	preventsPlaying(): boolean {
		return this.isConnected() && !this.isOwner() && this.getChannelSetting("crownsolo") === true;
	}

	receiveServerTime(time: number, echo: any) {
		let now = Date.now();
		let target = time - now;
		//console.log("Target serverTimeOffset: " + target);
		let duration = 1000;
		let step = 0;
		let steps = 50;
		let step_ms = duration / steps;
		let difference = target - this.serverTimeOffset;
		let inc = difference / steps;
		let iv = setInterval(() => {
			this.serverTimeOffset += inc;
			if (++step >= steps) {
				clearInterval(iv);
				//console.log("serverTimeOffset reached: " + self.serverTimeOffset);
				this.serverTimeOffset = target;
			}
		}, step_ms);
		// smoothen

		//this.serverTimeOffset = time - now;			// mostly time zone offset ... also the lags so todo smoothen this
									// not smooth:
		//if(echo) this.serverTimeOffset += echo - now;	// mostly round trip time offset
	}
	
	startNote(note: string, vel?: number) {
		if (this.isConnected()) {
			vel = typeof vel === "undefined" ? undefined : +vel.toFixed(3);
			if (!this.noteBufferTime) {
				this.noteBufferTime = Date.now();
				this.noteBuffer.push({n: note, v: vel});
			} else {
				this.noteBuffer.push({d: Date.now() - this.noteBufferTime, n: note, v: vel});
			}
		}
	};
	
	stopNote(note: string) {
		if (this.isConnected()) {
			if (!this.noteBufferTime) {
				this.noteBufferTime = Date.now();
				this.noteBuffer.push({n: note, s: 1});
			} else {
				this.noteBuffer.push({d: Date.now() - this.noteBufferTime, n: note, s: 1});
			}
		}
	};
	
	// Where do these methods come from???

	setName(str: string) {
		if (str.length > 40) return;
		this.sendArray([{m:'userset', set:{name:str}}]);
	}

	kickban(_id: string, ms: number) {
		if (ms > 60*60*1000) ms = 60*60*1000;
		if (ms < 0) ms = 0;
		this.sendArray([{m:'kickban', _id: _id, ms: ms}]);
	}

	chown(id: string) {
		if (!this.isOwner()) return;
		this.sendArray([{m:'chown', id: id}]);
	}

	pickupCrown() {
		this.sendArray([{m:'chown', id: this.getOwnParticipant().id!}]);
	}

	getParticipant(str: string) {
		let ret;
		for (let id in this.ppl) {
			let part = this.ppl[id];
			if (part.name!.toLowerCase().includes(str.toLowerCase()) || part._id!.toLowerCase().includes(str.toLowerCase()) || part.id!.toLowerCase().includes(str.toLowerCase())) {
				ret = part;
			}
		}
		if (typeof ret !== "undefined") {
			return ret;
		}
	}
}
(window as any).Client = Client;
