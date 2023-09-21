import map from 'lodash/map';
import { setupServer } from 'msw/node';

import { setupLocalStorage } from './local';

export const mswServer = setupServer();

export const mswPrintHandlers = () => {
	// eslint-disable-next-line no-console
	console.log(map(mswServer.listHandlers(), 'info.header'));
};

export function setupMSW() {
	setupLocalStorage();
	beforeAll(() => mswServer.listen());
	afterEach(() => mswServer.resetHandlers());
	afterAll(() => mswServer.close());
}
