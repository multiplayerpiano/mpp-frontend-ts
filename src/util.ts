function mixin(obj1: any, obj2: any) {
	for (let i in obj2) {
		if (obj2.hasOwnProperty(i)) {
			obj1[i] = obj2[i];
		}
	}
}

class EventEmitter {
	_events: Record<string, Function[]>;
	
	constructor() {
		this._events = {};
	}

	on(evtn: string, fn: Function) {
		if (!this._events.hasOwnProperty(evtn)) this._events[evtn] = [];
		
		this._events[evtn].push(fn);
	}

	off(evtn: string, fn: Function) {
		if (this._events.hasOwnProperty(evtn)) this._events[evtn] = [];
		
		let idx = this._events[evtn].indexOf(fn);
		if (idx < 0) return;
		
		this._events[evtn].splice(idx, 1);
	}

	emit(evtn: string, ...args: any[]) {
		if (!this._events.hasOwnProperty(evtn)) return;
		
		let fns = this._events[evtn];
		if (fns.length === 0) return;
		
		for (let i = 0; i < fns.length; i++) {
			fns[i].apply(this, args);
		}
	}
}

function hashFnv32a(str: string, asString: false, seed: number): number;
function hashFnv32a(str: string, asString: true, seed: number): string;
function hashFnv32a(str: string, asString: boolean, seed: number = 0x811c9dc5) {
	/*jshint bitwise:false */
	let l, hval = seed;

	for (let i = 0, l = str.length; i < l; i++) {
		hval ^= str.charCodeAt(i);
		hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
	}
	if (asString) {
		// Convert to 8 digit hex string
		return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
	}
	return hval >>> 0;
}

function round(number: number, increment: number, offset: number): number {
	return Math.round((number - offset) / increment) * increment + offset;
}

// knob

class Knob extends EventEmitter {
	min: number;
	max: number;
	step: number;
	value: number;
	knobValue: number;
	name: string;
	unit: string;
	fixedPoint: number;
	dragY: number;
	mouse_over: boolean;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	radius: number;
	baseImage: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement, min: number = 0, max: number = 10, step: number = 0.01, value: number = min, name: string = "", unit: string = "") {
		super();
		this.min = min;
		this.max = max;
		this.step = step;
		this.value = value;
		this.knobValue = (this.value - this.min) / (this.max - this.min);
		this.name = name;
		this.unit = unit;

		let ind = step.toString().indexOf(".");
		if (ind === -1) ind = step.toString().length - 1;
		this.fixedPoint = step.toString().substr(ind).length - 1;

		this.dragY = 0;
		this.mouse_over = false;

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;

		// knob image
		this.radius = this.canvas.width * 0.3333;
		this.baseImage = document.createElement("canvas");
		this.baseImage.width = canvas.width;
		this.baseImage.height = canvas.height;
		let ctx = this.baseImage.getContext("2d")!;
		ctx.fillStyle = "#444";
		ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
		ctx.shadowBlur = 5;
		ctx.shadowOffsetX = this.canvas.width * 0.02;
		ctx.shadowOffsetY = this.canvas.width * 0.02;
		ctx.beginPath();
		ctx.arc(this.canvas.width / 2, this.canvas.height /2, this.radius, 0, Math.PI * 2);
		ctx.fill();

		// events
		let self = this;
		let dragging = false;
		// dragging
		(function() {
			function mousemove(evt: MouseEvent) {
				if (evt.screenY !== self.dragY) {
					let delta = -(evt.screenY - self.dragY);
					let scale = 0.0075;
					if (evt.ctrlKey) scale *= 0.05;
					self.setKnobValue(self.knobValue + delta * scale);
					self.dragY = evt.screenY;
					self.redraw();
				}
				evt.preventDefault();
				showTip();
			}
			function mouseout(evt: MouseEvent) {
				if (evt.target === null && evt.relatedTarget === null) {
					mouseup();
				}
			}
			function mouseup() {
				document.removeEventListener("mousemove", mousemove);
				document.removeEventListener("mouseout", mouseout);
				document.removeEventListener("mouseup", mouseup);
				self.emit("release", self);
				dragging = false;
				if (!self.mouse_over) removeTip();
			}
			canvas.addEventListener("mousedown", function(evt: MouseEvent) {
				let pos = self.translateMouseEvent(evt);
				if (self.contains(pos.x, pos.y)) {
					dragging = true;
					self.dragY = evt.screenY;
					showTip();
					document.addEventListener("mousemove", mousemove);
					document.addEventListener("mouseout", mouseout);
					document.addEventListener("mouseup", mouseup);
				}
			});
			canvas.addEventListener("keydown", function(evt: KeyboardEvent) {
				// FIXME: keyCode is deprecated!
				if (evt.keyCode == 38) {
					self.setValue(self.value + self.step);
					showTip();
				} else if (evt.keyCode == 40) {
					self.setValue(self.value - self.step);
					showTip();
				}
			});
		})();
		// tooltip
		function showTip() {
			let div = document.getElementById("tooltip");
			if (!div) {
				div = document.createElement("div");
				document.body.appendChild(div);
				div.id = "tooltip";
				let rect = self.canvas.getBoundingClientRect();
				div.style.left = rect.left + "px";
				div.style.top = rect.bottom + "px";
			}
			div.textContent = self.name;
			if (self.name) div.textContent += ": ";
			div.textContent += self.valueString() + self.unit;
		}
		function removeTip() {
			let div = document.getElementById("tooltip")!;
			if (div) {
				div.parentElement!.removeChild(div);
			}
		}
		function ttmousemove(evt: MouseEvent) {
			let pos = self.translateMouseEvent(evt);
			if (self.contains(pos.x, pos.y)) {
				self.mouse_over = true;
				showTip();
			} else {
				self.mouse_over = false;
				if (!dragging) removeTip();
			}
		}
		function ttmouseout(evt: MouseEvent) {
			self.mouse_over = false;
			if(!dragging) removeTip();
		}
		self.canvas.addEventListener("mousemove", ttmousemove);
		self.canvas.addEventListener("mouseout", ttmouseout);

		this.redraw();
	}

	redraw() {
		let dot_distance = 0.28 * this.canvas.width;
		let dot_radius = 0.03 * this.canvas.width;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(this.baseImage, 0, 0);

		let a = this.knobValue;
		a *= Math.PI * 2 * 0.8;
		a += Math.PI / 2;
		a += Math.PI * 2 * 0.1;
		let half_width = this.canvas.width / 2;
		let x = Math.cos(a) * dot_distance + half_width;
		let y = Math.sin(a) * dot_distance + half_width;
		this.ctx.fillStyle = "#fff";
		this.ctx.beginPath();
		this.ctx.arc(x, y, dot_radius, 0, Math.PI * 2);
		this.ctx.fill();
	}

	setKnobValue(value: number) {
		value = Math.min(Math.max(value, 0), 1);
		this.knobValue = value;
		this.setValue(value * (this.max - this.min) + this.min);
	}

	setValue(value: number) {
		value = round(value, this.step, this.min);
		value = Math.min(Math.max(value, this.min), this.max);
		if (this.value !== value) {
			this.value = value;
			this.knobValue = (value - this.min) / (this.max - this.min);
			this.redraw();
			this.emit("change", this);
		}
	}

	valueString(): string {
		return this.value.toFixed(this.fixedPoint);
	}

	contains(x: number, y: number): boolean {
		x -= this.canvas.width / 2;
		y -= this.canvas.height / 2;
		return Math.sqrt(x ** 2 + y ** 2) < this.radius;
	}

	translateMouseEvent(evt: MouseEvent): {x: number, y: number} {
		let element = evt.target as HTMLElement;
		return {
			x: (evt.clientX - element.getBoundingClientRect().left - element.clientLeft + element.scrollLeft),
			y: evt.clientY - (element.getBoundingClientRect().top - element.clientTop + element.scrollTop)
		};
	}
}
