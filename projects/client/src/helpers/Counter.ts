export class IdCounter {
	count = 0;

	prefix = '__inpt_counter_';

	constructor(prefix = '__inpt_counter_') {
		this.prefix = prefix;
	}

	next() {
		const p = this.count;
		this.count++;
		return p;
	}

	nextId(prefix = this.prefix) {
		const index = this.next();
		return `${prefix}${index}`;
	}
}

export const counter = new IdCounter();
