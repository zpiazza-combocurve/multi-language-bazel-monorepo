// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ConfigBackend } = require('../../utilities/config-manager');

/**
 * @class ConfigBackendFirestore
 * @see https://googleapis.dev/nodejs/firestore/latest/index.html
 */
class ConfigBackendFirestore extends ConfigBackend {
	constructor(firestore, prefix = null) {
		super();

		this.firestore = firestore;
		this.prefix = prefix;
		this.cache = new Map();
		this.subscriptions = new Map();
	}

	/** @private */
	internalGetUri(key) {
		if (!this.prefix) {
			return key;
		}
		return this.prefix + key;
	}

	/** @private */
	internalReadSnapshot(uri, documentSnapshot) {
		const data = documentSnapshot.exists ? documentSnapshot.data() : null;
		this.cache.set(uri, data);
		return data;
	}

	/** @private */
	internalSubscribe(uri, documentRef) {
		this.subscriptions.set(
			uri,
			documentRef.onSnapshot((documentSnapshot) => {
				this.internalReadSnapshot(uri, documentSnapshot);
			})
		);
	}

	/** @public */
	async read(key) {
		const uri = this.internalGetUri(key);
		const documentRef = this.firestore.doc(uri);
		let data = this.cache.get(uri);

		if (data === undefined) {
			data = this.internalReadSnapshot(uri, await documentRef.get());
		}

		if (!this.subscriptions.has(uri)) {
			this.internalSubscribe(uri, documentRef);
		}

		return data;
	}

	async write(key, data, options = {}) {
		const uri = this.internalGetUri(key);
		const documentRef = this.firestore.doc(uri);
		await documentRef.set(data, options);
	}
}

module.exports = ConfigBackendFirestore;
