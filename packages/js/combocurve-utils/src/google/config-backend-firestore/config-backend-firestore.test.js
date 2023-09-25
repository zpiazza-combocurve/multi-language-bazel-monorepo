// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { firebaseStub } = require('firestore-jest-mock/mocks/firebase');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const ConfigBackendFirestore = require('./config-backend-firestore');

const firebase = firebaseStub({
	database: {
		reports: [
			{ id: 'abc123', name: 'Benchmark' },
			{ id: 'abc456', name: 'Reconciliation' },
		],
	},
});

const firestore = firebase.firestore();

describe('ConfigBackendFirestore', () => {
	it('reads the value for the given configuration key', async () => {
		const backend = new ConfigBackendFirestore(firestore);
		const config = await backend.read('reports/abc123');
		expect(config).toEqual({ name: 'Benchmark' });
	});

	it('reads the value for the given configuration key when using prefix', async () => {
		const backend = new ConfigBackendFirestore(firestore, 'reports');
		const config = await backend.read('/abc456');
		expect(config).toEqual({ name: 'Reconciliation' });
	});

	it('returns null when the given key does not exist', async () => {
		const backend = new ConfigBackendFirestore(firestore);
		const config = await backend.read('reports/ABC321');
		expect(config).toEqual(null);
	});
});
