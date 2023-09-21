/** Versioned storage access */
export function getVersionedKey(key: string, version?: number | string | undefined) {
	if (version) {
		return `${key}-${version}`;
	}
	return key;
}

class Wrapper {
	storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setItem(key: string, obj: any) {
		this.storage.setItem(key, JSON.stringify(obj));
	}

	getItem(key: string) {
		return JSON.parse(
			// TODO fix type
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			this.storage.getItem(key)
		);
	}

	clear() {
		this.storage.clear();
	}
}

export const session = new Wrapper(window.sessionStorage);
export const local = new Wrapper(window.localStorage);
