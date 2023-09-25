import { afterAll, afterEach, beforeAll } from '@jest/globals';

import TestDbManager from './test-db-manager';

export function setupTestDbManager() {
	const testDbManager = new TestDbManager();

	beforeAll(() => testDbManager.start());
	afterEach(() => testDbManager.cleanup());
	afterAll(() => testDbManager.stop());

	return testDbManager;
}
