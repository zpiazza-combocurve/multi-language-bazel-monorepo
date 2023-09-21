import { local } from '@/helpers/storage';

export function setupLocalStorage() {
	beforeEach(() => local.clear());
}
