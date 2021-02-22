interface Quota {
	allowance: number,
	max: number,
	maxHistLen?: number
}

class NoteQuota {
	static PARAMS_LOBBY = <Quota> {allowance: 200, max: 600};
	static PARAMS_NORMAL = <Quota> {allowance: 400, max: 1200};
	static PARAMS_RIDICULOUS = <Quota> {allowance: 600, max: 1800};
	static PARAMS_OFFLINE = <Quota> {allowance: 8000, max: 24000, maxHistLen: 3};

	cb: Function;
	allowance: number;
	max: number;
	maxHistLen: number;
	points: number;
	history: Array<any>;

	constructor (cb: Function) {
		this.cb = cb;
		this.setParams();
		this.resetPoints();
	}

	setParams(params?: Quota) {
		params = params || NoteQuota.PARAMS_OFFLINE;
		var allowance = params.allowance || this.allowance || NoteQuota.PARAMS_OFFLINE.allowance;
		var max = params.max || this.max || NoteQuota.PARAMS_OFFLINE.max;
		var maxHistLen = params.maxHistLen || this.maxHistLen || NoteQuota.PARAMS_OFFLINE.maxHistLen;
		if(allowance !== this.allowance || max !== this.max || maxHistLen !== this.maxHistLen) {
			this.allowance = allowance;
			this.max = max;
			this.maxHistLen = maxHistLen;
			this.resetPoints();
			return true;
		}
		return false;
	}

	getParams() {
		return {
			m: "nq",
			allowance: this.allowance,
			max: this.max,
			maxHistLen: this.maxHistLen
		};
	}

	resetPoints() {
		this.points = this.max;
		this.history = [];
		for(var i = 0; i < this.maxHistLen; i++)
			this.history.unshift(this.points);
		if(this.cb) this.cb(this.points);
	}

	tick() {
		// keep a brief history
		this.history.unshift(this.points);
		this.history.length = this.maxHistLen;
		// hook a brother up with some more quota
		if(this.points < this.max) {
			this.points += this.allowance;
			if(this.points > this.max) this.points = this.max;
			// fire callback
			if(this.cb) this.cb(this.points);
		}
	}

	spend(needed: number) {
		// check whether aggressive limitation is needed
		var sum = 0;
		for(var i in this.history) {
			sum += this.history[i];
		}
		if(sum <= 0) needed *= this.allowance;
		// can they afford it?  spend
		if(this.points < needed) {
			return false;
		} else {
			this.points -= needed;
			if(this.cb) this.cb(this.points); // fire callback
			return true;
		}
	}
}

(<any>window).NoteQuota = NoteQuota;
