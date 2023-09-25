// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { describe, test, expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ignoreCollectionNotFound, ignoreIndexNotFound } = require('./mongo');

class NamespaceError extends Error {
	constructor() {
		super();
		this.codeName = 'NamespaceNotFound';
	}
}

class IndexError extends Error {
	constructor() {
		super();
		this.codeName = 'IndexNotFound';
	}
}

describe('helpers/mongo', () => {
	test('ignoreCollectionNotFound()', async () => {
		// should not throw
		await ignoreCollectionNotFound(() => {
			throw new NamespaceError();
		});

		// should throw
		let error;
		try {
			await ignoreCollectionNotFound(() => {
				throw new Error('A random error');
			});
		} catch (e) {
			error = e;
		}
		expect(error).toEqual(new Error('A random error'));
	});

	test('ignoreIndexNotFound()', async () => {
		// should not throw
		await ignoreIndexNotFound(() => {
			throw new IndexError();
		});

		// should throw
		let error;
		try {
			await ignoreIndexNotFound(() => {
				throw new Error('A random error');
			});
		} catch (e) {
			error = e;
		}
		expect(error).toEqual(new Error('A random error'));
	});
});
