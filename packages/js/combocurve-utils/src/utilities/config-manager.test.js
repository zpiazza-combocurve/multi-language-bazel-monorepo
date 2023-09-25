// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ConfigBackend, ConfigClient, ConfigReadOnlyClient } = require('./config-manager');

class FakeBackend extends ConfigBackend {
	constructor(store = {}) {
		super();
		this.store = store;
	}

	read(key) {
		return Promise.resolve(this.store[key]);
	}

	write(key, value) {
		this.store[key] = value;
		return Promise.resolve();
	}
}

describe('config-manager', () => {
	describe('ConfigReadOnlyClient', () => {
		it('gets a value for the given key', async () => {
			const client = new ConfigReadOnlyClient(new FakeBackend({ foo: 'bar' }));
			const value = await client.get('foo');

			expect(value).toEqual('bar');
		});
	});

	describe('ConfigClient', () => {
		it('sets a value for the given key', async () => {
			const store = {};
			const client = new ConfigClient(new FakeBackend(store));
			await client.set('foo', 'bar');

			expect(store.foo).toEqual('bar');
		});

		it('gets a value for the given key', async () => {
			const client = new ConfigClient(new FakeBackend({ foo: 'bar' }));
			const value = await client.get('foo');

			expect(value).toEqual('bar');
		});
	});
});
