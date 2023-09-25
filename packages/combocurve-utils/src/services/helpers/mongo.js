function insertIfNotExists(document, key = '_id') {
	return {
		updateOne: {
			filter: { [key]: document[key] },
			update: { $setOnInsert: document },
			upsert: true,
		},
	};
}

async function ignoreCollectionNotFound(operation) {
	try {
		await operation();
	} catch (error) {
		if (error.codeName !== 'NamespaceNotFound') {
			throw error;
		}
	}
}

async function ignoreIndexNotFound(operation) {
	try {
		await operation();
	} catch (error) {
		if (error.codeName !== 'IndexNotFound') {
			throw error;
		}
	}
}

async function ignoreNamespaceExists(operation) {
	try {
		await operation();
	} catch (error) {
		if (error.codeName !== 'NamespaceExists') {
			throw error;
		}
	}
}

module.exports = {
	insertIfNotExists,
	ignoreCollectionNotFound,
	ignoreIndexNotFound,
	ignoreNamespaceExists,
};
