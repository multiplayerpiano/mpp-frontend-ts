import { ParticipantMenu } from './Interface/ParticipantMenu';
import { NoteQuotaHandler } from './Pianoctor/NoteQuotaHandler';
import { SoundWarning } from './Interface/SoundWarning';
import { RoomInfoManager } from './Interface/RoomInfoManager';
import { Synth } from "./Synth/Synth";
import { Modal } from './Interface/Modal';
import { RoomManager } from './Interface/RoomManager';
import { RenameManager } from './Interface/RenameManager';
import { Analytics } from './Misc/Analytics';
import { ClientManager } from './Client/ClientManager';
import { EbspriteManager } from './Misc/EbspriteManager';
import { Chat } from './Interface/Chat';
import { Piano } from './Pianoctor/Piano';
import { MIDI } from './MIDI/MIDI';
import { Keyboard } from './Pianoctor/Keyboard';
import { MP3Recorder } from './Interface/MP3Recorder';
import { BugSupply } from './Misc/BugSupply';
import { ControlBarEvents } from './Interface/ControlBarEvents';
import { Translation } from './Misc/Translation';
import { Settings } from './Misc/Settings';
import { KeyboardHandler } from './Pianoctor/KeyboardHandler';
import { Cursor } from './Misc/Cursor';
import { SoundSelector } from './Pianoctor/SoundSelector';
import { PianoAPI, Renderer } from './Renderer/Renderer';

export class MultiplayerPianoClient {
	test_mode: "" | RegExpMatchArray | null;
	gSeeOwnCursor: "" | RegExpMatchArray | null;
	gMidiVolumeTest: "" | RegExpMatchArray | null;
	gMidiOutTest: ((note_name: string, vel: number, delay_ms: number) => void) | undefined;
	DEFAULT_VELOCITY: number;
	TIMING_TARGET: number;
	translation: Translation;
	gPiano: Piano;
	gSoundSelector: SoundSelector;
	synth: Synth;
	clientManager: ClientManager;
	ebspriteManager: EbspriteManager;
	gPianoMutes: string[];
	gChatMutes: string[];
	gNoteQuotaHandler: NoteQuotaHandler;
	participantMenu: ParticipantMenu;
	soundWarning: SoundWarning;
	roomInfoManager: RoomInfoManager;
	modal: Modal;
	roomManager: RoomManager;
	renameManager: RenameManager;
	analytics: Analytics;
	keyboard: Keyboard;
	keyboardHandler: KeyboardHandler;
	mp3Recorder: MP3Recorder;
	chat: Chat;
	midi: MIDI;
	bugSupply: BugSupply;
	controlBarEvents: ControlBarEvents;
	settings: Settings;
	cursor: Cursor;
	renderer: Renderer;
	pianoAPI: PianoAPI

	constructor() {
		this.test_mode = window.location.hash && window.location.hash.match(/^(?:#.+)*#test(?:#.+)*$/i);
		this.gSeeOwnCursor = window.location.hash && window.location.hash.match(/^(?:#.+)*#seeowncursor(?:#.+)*$/i);
		this.gMidiVolumeTest = window.location.hash && window.location.hash.match(/^(?:#.+)*#midivolumetest(?:#.+)*$/i);
		this.clientManager = new ClientManager(this);
		this.chat = new Chat(this);	
		this.keyboard = new Keyboard(this);
		this.DEFAULT_VELOCITY = 0.5;
		this.TIMING_TARGET = 1000;
		this.translation = new Translation();		
		this.gPiano = new Piano(document.getElementById("piano")!, { //this isn't the same style as importing MPP
			test_mode: this.test_mode,
			gMidiOutTest: this.gMidiOutTest,
			synth: this.synth,
			gInterface: this
		});
		this.midi = new MIDI({ //this isn't the same style as importing MPP
			gClient: this.clientManager.gClient,
			keyboard: this.keyboard,
			gMidiVolumeTest: this.gMidiVolumeTest
		});
		this.gMidiOutTest = this.midi.midi_handler?.gMidiOutTest;
		this.synth = new Synth(this);	
		this.gPiano.audio.synth = this.synth; //bad solution
		this.pianoAPI = {
			audio: this.gPiano.audio,
			keys: this.gPiano.keys,
			renderer: this.renderer,
			rootElement: this.gPiano.rootElement
		}
		this.gSoundSelector = new SoundSelector(this.pianoAPI);
		this.renderer = new Renderer();
		this.renderer.init(this.pianoAPI);
		this.ebspriteManager = new EbspriteManager(this);
		this.gPianoMutes = (localStorage.pianoMutes ? localStorage.pianoMutes as string : "").split(',').filter(v => v);
		this.gChatMutes = (localStorage.pianoMutes ? localStorage.pianoMutes as string : "").split(',').filter(v => v);
		this.gNoteQuotaHandler = new NoteQuotaHandler(this);
		this.participantMenu = new ParticipantMenu(this);	
		this.keyboardHandler = new KeyboardHandler(this);
		this.modal = new Modal(this);
		this.soundWarning = new SoundWarning(this);
		this.roomInfoManager = new RoomInfoManager(this);
		this.roomManager = new RoomManager(this);
		this.renameManager = new RenameManager(this);
		this.controlBarEvents = new ControlBarEvents(this);
		this.analytics = new Analytics();		
		this.cursor = new Cursor(this);
		this.bugSupply = new BugSupply();
		this.mp3Recorder = new MP3Recorder(this);
		this.settings = new Settings(this);
		this.init();
	}

	init() {
		//translation
		this.translation.perform();
		
		//sound selector
		this.gSoundSelector.addPacks(["/sounds/Emotional_2.0/", "/sounds/Harp/", "/sounds/Music_Box/", "/sounds/Vintage_Upright/", "/sounds/Steinway_Grand/", "/sounds/Emotional/", "/sounds/Untitled/"]);
		this.gSoundSelector.init();

		//keyboard
		this.keyboardHandler.captureKeyboard();
	}
}