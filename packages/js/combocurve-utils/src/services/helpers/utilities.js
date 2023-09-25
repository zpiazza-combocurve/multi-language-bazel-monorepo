// eslint-disable-next-line no-process-env
const { NODE_ENV } = process.env;

function asyncSeries(array, iterator) {
	// Sequential async iteration over an array. `iterator` will be called for each element of the array,
	// it must return a `Promise`.
	return new Promise((resolve, reject) => {
		const next = (index) => {
			iterator(array[index], index)
				.then((result) => {
					if (index === array.length - 1) {
						resolve(result);
					} else {
						next(index + 1);
					}
				})
				.catch(reject);
		};
		if (array.length) {
			next(0);
		} else {
			resolve();
		}
	});
}

const paginator = (pageSize) =>
	function paginate(array) {
		const numPages = Math.ceil(array.length / pageSize);
		const pages = [];
		for (let i = 0; i < numPages; i += 1) {
			pages.push(array.slice(i * pageSize, Math.min((i + 1) * pageSize, array.length)));
		}
		return pages;
	};

function log(...args) {
	if (NODE_ENV !== 'test') {
		// eslint-disable-next-line no-console
		console.log(...args);
	}
}

class TokenBucket {
	constructor(config = {}) {
		const { initial = 1, rate = 1 /* /sec */, size = 1 } = config;
		// config
		this.size = size;
		this.rate = rate;
		// state
		this.tokens = Math.min(initial, size);
		this.last = Date.now();
	}

	_refill() {
		const now = Date.now();

		const elapsed = (now - this.last) / 1000; // sec
		const add = Math.floor(elapsed * this.rate);
		const cost = Math.floor((add / this.rate) * 1000);

		this.tokens = Math.min(this.size, this.tokens + add);
		this.last = Math.min(now, this.last + cost);
	}

	_wait(n) {
		const elapsed = Date.now() - this.last;
		const need = Math.max(0, n - this.tokens);
		const cost = (need / this.rate) * 1000;

		return Math.max(0, Math.ceil(cost - elapsed));
	}

	take(n = 1) {
		this._refill();
		const wait = this._wait(n);
		this.tokens -= Math.min(this.tokens, n);
		return wait;
	}
}

const nameAttr = Symbol('command.name');

class Limiter {
	constructor(config = {}) {
		const { bucketSize = 1, debug = false, dispatchesPerSecond = 1 } = config;
		this.bucket = new TokenBucket({ rate: dispatchesPerSecond, size: bucketSize });
		this.debug = debug;
	}

	_log(message) {
		if (!this.debug) {
			return;
		}
		log(`limiter: ${message}`);
	}

	next(command) {
		return new Promise((resolve, reject) => {
			const invoke = async () => {
				const start = Date.now();
				try {
					const ret = await command();
					resolve(ret);
				} catch (error) {
					reject(error);
				} finally {
					this._log(`${command[nameAttr] || '<Command>'}: ${Date.now() - start}ms`);
				}
			};
			// TODO: investigate this, it seems there is a bug here causing the waits to be longer then they should
			// const wait = this.bucket.take(1);
			const wait = 250;
			setTimeout(invoke, wait);
		});
	}
}

module.exports = { asyncSeries, paginator, log, Limiter };
