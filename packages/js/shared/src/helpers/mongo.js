import { get, groupBy, mapValues } from 'lodash';
import qs from 'querystring';

import { set } from './collections';
import { Executor } from './executor';

function buildConnectionString({ username, password, cluster, database, params = null }) {
	const encodedUser = encodeURIComponent(username);
	const encodedPassword = encodeURIComponent(password);

	const url = `mongodb+srv://${encodedUser}:${encodedPassword}@${cluster}/${database}`;

	if (!params) {
		return url;
	}
	const encodedParams = qs.stringify(params);
	return `${url}?${encodedParams}`;
}

async function populate(documents, projections, schema, models) {
	/** Similar to mongoose's populate, but can run on plain javascript objects */
	const collectionToModel = Object.values(models).reduce(
		(accumulator, model) => ({ ...accumulator, [model.collection.name]: model }),
		{}
	);

	const refPaths = Object.keys(projections).filter((path) => get(schema, path)?.ref);
	const collectedIds = documents.reduce((accumulator, doc) => {
		refPaths.forEach((path) => {
			const collection = get(schema, path).ref;
			const documentId = get(doc, path);
			if (documentId) {
				accumulator[collection] = accumulator[collection] || new Set();
				accumulator[collection].add(documentId);
			}
		});
		return accumulator;
	}, {});

	const commands = Object.keys(projections).reduce((accumulator, path) => {
		let select = projections[path];
		if (typeof select !== 'object') {
			return accumulator;
		}
		if (Object.keys(select).length === 0) {
			select = undefined;
		}
		const collection = get(schema, path)?.ref;
		if (!collection) {
			return accumulator;
		}
		const ids = collectedIds[collection];
		if (!(ids && ids.size)) {
			return accumulator;
		}
		if (accumulator[collection]) {
			return accumulator;
		}
		return {
			...accumulator,
			[collection]: () => collectionToModel[collection].find({ _id: { $in: [...ids] } }, select),
		};
	}, {});

	const documentsByCollection = await Executor.series(commands);

	const collectedModels = mapValues(documentsByCollection, (docs) => {
		const byId = groupBy(docs, '_id');
		return mapValues(byId, ([id]) => id);
	});

	const populated = documents.map((assign) => {
		refPaths.forEach((path) => {
			const collection = get(schema, path).ref;
			const modelMap = collectedModels[collection];
			const value = get(assign, path);
			if (modelMap && modelMap[value]) {
				set(assign, path, modelMap[value].toObject());
			}
		});
		return assign;
	});

	return populated;
}

export { buildConnectionString, populate };
