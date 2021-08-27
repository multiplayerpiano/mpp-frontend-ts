import { Client } from "../Client/Client";
import * as spriteData from "./ebsprite-data.json";

function downloadImage(url: string, cb: any) {
	var img = new Image();
	img.onerror = function() {
		cb("onerror", img);
	};
	img.onabort = function() {
		cb("onabort", img);
	};
	img.onload = function() {
		cb(false, img);
	};
	img.src = url;
};

async function downloadImages(urls: string[], cb: any) {
/*	var imgs = new Array(urls.length);
	var c = 0;
	for(var i in urls) {
		(function() {
			var j = i;
			downloadImage(urls[i], function(err: boolean, img: HTMLImageElement) {
				console.log(img, err, i);
				if(err) {
					cb(err, imgs);
					cb = function() {};
				} else {
					imgs[i] = img;
					if(++c == urls.length) {
						cb(false, imgs);
					}
				}
			});
		})();
	}*/
	let promises = [];
	for (let url of urls) {
		promises.push(fetch(url));
	}
	return (await Promise.all(promises)).map(async (a) => await a.blob());
};

export class Ebsprite {
	run: boolean;
	client: Client;
	canvas: HTMLCanvasElement | undefined;
	context: CanvasRenderingContext2D;
	playerMap: Record<string, Player>;
	animationInterval: NodeJS.Timeout;
	spriteData: { name: string; sprites: string[]; }[];
	camera: Camera;
	participantAddedFunc: (part: { id: string; }) => void;
	participantRemovedFunc: (part: { id: string; }) => void;
	onresizeFunc: () => void;
	constructor() {
		this.spriteData = spriteData.data;
		this.playerMap = {};
	}
	
	start(client: Client) {
		if(this.run) return;
		this.run = true;
		this.client = client;
		this.canvas = document.createElement("canvas");
		this.participantAddedFunc = this.participantAdded.bind(this);
		this.participantRemovedFunc = this.participantRemoved.bind(this);
		this.onresizeFunc = this.onresize.bind(this);
		let canvas = this.canvas;
		document.body.insertBefore(this.canvas, document.body.firstChild);
	
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.style.position = "absolute";
		let camera = new Camera(this.canvas.width, this.canvas.height);
		this.camera = camera;
		let context = <CanvasRenderingContext2D> this.canvas.getContext("2d");
		this.context = context;
		context.fillStyle = "rgb(255,255,255)";
	
		let requestAnimationFrame = (window as any).requestAnimationFrame || (window as any).mozRequestAnimationFrame ||  
			(window as any).webkitRequestAnimationFrame || (window as any).msRequestAnimationFrame;
	
		this.render_loop();
	
		window.addEventListener("resize", this.onresizeFunc);
	
		var player = new Player(this, String(this.client.participantId));

		//SpriteProvider.prototype = new SpriteProvider(player, ["2354","2355","2356","2357","2358","2359","2360","2361"], (() => {}));
		
		this.playerMap = {}
		this.playerMap[String(client.participantId)] = player;
		
		this.animationInterval = setInterval(() => {
			player.move(String(this.client.participantId));
			for(var id in client.ppl) {
				if(!client.ppl.hasOwnProperty(id)) continue;
				player.move(id);
			}
		}, 50);
	
		for(var id in client.ppl) {
			if(!client.ppl.hasOwnProperty(id)) continue;
			this.playerMap[id] = new Player(this, id);
		}
		this.client.on("participant added", this.participantAddedFunc);
		this.client.on("participant removed", this.participantRemovedFunc);
	}

	stop() {
		this.run = false;
		if(this.canvas) {
			document.body.removeChild(this.canvas);
			this.canvas = undefined;
		}
		window.removeEventListener("resize", this.onresizeFunc);
		clearInterval(this.animationInterval);
		if(this.client) {
			this.client.off("participant added", this.participantAddedFunc);
			this.client.off("participant removed", this.participantRemovedFunc);
		}
	}

	onresize() {
		(<HTMLCanvasElement> this.canvas).width = Number($(window).width());
		(<HTMLCanvasElement> this.canvas).height = Number($(window).height());
		this.context.clearRect(0, 0, (<HTMLCanvasElement> this.canvas).width, (<HTMLCanvasElement> this.canvas).height);
	}

	ySort(a: { position: { y: number; }; }, b: { position: { y: number; }; }) {
		return a.position.y - b.position.y;
	};

	render_loop() {
		let directionMap: { [unit: string]: {x: number, y: number}} = {
			"up": {x: 0, y: -1},
			"up-right": {x: 0.707106782, y: -0.707106782},
			"right": {x: 1, y: 0},
			"right-down": {x: 0.707106782, y: 0.707106782},
			"down": {x: 0, y: 1},
			"down-left": {x: -0.707106782, y: 0.707106782},
			"left": {x: -1, y: 0},
			"left-up": {x: -0.707106782, y: -0.707106782}
		};
		var players = [];
		for(var i in this.playerMap) {
			players.push(this.playerMap[i]);
		}
		this.context.clearRect(0, 0, (<HTMLCanvasElement> this.canvas).width, (<HTMLCanvasElement> this.canvas).height);
		for(var i in players) {
			var player = players[i];
			if(player.walking) {
				var vec = directionMap[player.direction];
				var time = Date.now() - player.updateTime;
				player.position.x = player.updatePosition.x + (vec.x * player.walkSpeed * time);
				player.position.y = player.updatePosition.y + (vec.y * player.walkSpeed * time);
				if(player.position.x < 0) player.position.x = 0;
				else if(player.position.x > (<HTMLCanvasElement> this.canvas).width) player.position.x = (<HTMLCanvasElement> this.canvas).width;
				if(player.position.y < 0) player.position.y = 0;
				else if(player.position.y > (<HTMLCanvasElement> this.canvas).width) player.position.y = (<HTMLCanvasElement>this.canvas).width;
			}
		}
		players.sort(this.ySort);
		for(var i in players) {
			var player = players[i];
			var img = player.spriteProvider.getCurrentSprite(player);
			if(img) this.context.drawImage(img,
				Math.floor(player.position.x - this.camera.position.x - (img.width / 2)),
				Math.floor(player.position.y - this.camera.position.y - img.height));
			/*if(player.chat) {
				var text = player.chat;
				var t = Math.floor((Date.now() - player.chatTime) / 50);
				text = text.substring(0, t);
				context.fillText(text,
					Math.floor(player.position.x - camera.position.x),
					Math.floor(player.position.y - camera.position.y - img.height) - 10);
			}*/
		}
		if(this.run) requestAnimationFrame(this.render_loop.bind(this));
	};
	participantAdded(part: { id: string; }) {
		this.playerMap[part.id] = new Player(this, part.id);
	}

	participantRemoved(part: { id: string; }) {
		delete this.playerMap[part.id];
	}
}

class Camera {
	width: number;
	height: number;
	position: { x: number; y: number; };
	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.position = {x: 0, y: 0};
	}	
}

class SpriteProvider {
	player: Player;
	spritesList: string[];
	sprites: {[key: string]: any}
	constructor(player: Player, sprites: string[], cb: { (): void; (): void; } | undefined) {
		this.spritesList = sprites;
		this.sprites = {};
		this.player = player;
		var urls = new Array(sprites.length);
		for(var i in sprites) {
			urls[i] = "/img/ebsprite/" + sprites[i] + ".png";
		}
		let self = this;
		downloadImages(urls, (() => {})).then((imgs) => {
			let images: HTMLImageElement[] = [];
			let promise = new Promise ((resolve, reject) => {
				imgs.forEach(async (img, index, array) => {
					let image = new Image();
					let objectURL = URL.createObjectURL(await img);
					image.src = objectURL;
					images.push(image);
					if (index === array.length -1) resolve(1);
				})
			});
			promise.then(() => {
				var s = images;
				self.sprites = {};
				self.sprites["up"] = [s[0], s[1]];
				self.sprites["right"] = [s[2], s[3]];
				self.sprites["down"] = [s[4], s[5]];
				self.sprites["left"] = [s[6], s[7]];
				self.sprites["up-right"] = [s[8] || s[2], s[9] || s[3]];
				self.sprites["right-down"] = [s[10] || s[2], s[11] || s[3]];
				self.sprites["down-left"] = [s[12] || s[6], s[13] || s[7]];
				self.sprites["left-up"] = [s[14] || s[6], s[15] || s[7]];
			});
		});
		/*downloadImages(urls, (function(err: any, imgs: any) {
			if(!err) {
				var s = imgs;
				this.sprites = {};
				this.sprites["up"] = [s[0], s[1]];
				this.sprites["right"] = [s[2], s[3]];
				this.sprites["down"] = [s[4], s[5]];
				this.sprites["left"] = [s[6], s[7]];
				this.sprites["up-right"] = [s[8] || s[2], s[9] || s[3]];
				this.sprites["right-down"] = [s[10] || s[2], s[11] || s[3]];
				this.sprites["down-left"] = [s[12] || s[6], s[13] || s[7]];
				this.sprites["left-up"] = [s[14] || s[6], s[15] || s[7]];
			}
			if(cb) cb();
		}).bind(this));*/
	}

	getCurrentSprite(player: Player) {
		if(this.sprites && (this.sprites as {[key: string]: any})[this.player.direction]) {
			if(player.walking) {
				var time = Date.now() - player.updateTime;
				return (this.sprites as {[key: string]: any})[this.player.direction][time & 0x80 ? 0 : 1];
			} else {
				return (this.sprites as {[key: string]: any})[this.player.direction][0];
			}
		}
	};

}

class Player {
	id: string;
	sprites: any;
	spriteProvider: SpriteProvider;
	canMoveDiagonally: boolean;
	walkSpeed: number;
	direction: string;
	walking: boolean;
	updatePosition: { x: number; y: number; };
	position: { x: number; y: number; };
	updateTime: number;
	ebsprite: Ebsprite;
	constructor(ebsprite: Ebsprite, id: string) {
		this.id = id;
		this.ebsprite = ebsprite;
		
		//this.sprites = spriteData[0].sprites;
		this.sprites = this.ebsprite.spriteData[parseInt(id, 16) % this.ebsprite.spriteData.length].sprites;
		this.spriteProvider = new SpriteProvider(this, this.sprites, (() => {}));
		this.canMoveDiagonally = (this.sprites[8] && this.sprites[9] && this.sprites[10] && this.sprites[11] && this.sprites[12] && this.sprites[13] && this.sprites[14] && this.sprites[15]) ? true : false;
		this.walkSpeed = 0.15;

		this.direction = "down";
		this.walking = false;
		this.updatePosition = {
			x: (<HTMLCanvasElement> ebsprite.canvas).width / 2,
			y: (<HTMLCanvasElement> ebsprite.canvas).height / 2
		};
		this.position = {x: this.updatePosition.x, y: this.updatePosition.y};
		this.updateTime = Date.now();
	}

	move(id: string) {
		var player = this.ebsprite.playerMap[id];
		var part = this.ebsprite.client.ppl[id];
		if(!player || !part) return;
		var target = {x: (Number(part.x) / 100) * (<HTMLCanvasElement>this.ebsprite.canvas).width, y: (Number(this.ebsprite.client.ppl[id].y) / 100) * (<HTMLCanvasElement> this.ebsprite.canvas).height};
		var difference = {x: target.x - player.position.x, y: target.y - player.position.y};
		var distance = Math.sqrt(Math.pow(difference.x, 2) + Math.pow(difference.y, 2));
		if(distance > 4) {
			var angle = Math.atan2(difference.y, difference.x);
			angle += Math.PI; // account negative Math.PI
			angle += Math.PI / 8; // askew
			angle /= (Math.PI * 2);
			angle = Math.floor(angle * 8) % 8;
			var direction = ["left", "left-up", "up", "up-right", "right", "right-down", "down", "down-left"][angle];
			if(player.direction !== direction) {
				if((Date.now() - player.updateTime > 500) || !player.walking) {
					player.direction = direction;
					player.updatePosition = {x: player.position.x, y: player.position.y};
					player.updateTime = Date.now();
				}
			}
			if(distance > 75) {
				if(!player.walking) {
					player.walking = true;
					player.updatePosition = {x: player.position.x, y: player.position.y};
					player.updateTime = Date.now();
				}
			}
		} 
		if(distance < 25) {
			if(player.walking) {
				player.walking = false;
				player.updatePosition = {x: player.position.x, y: player.position.y};
				player.updateTime = Date.now();
			}
		}
	}
}