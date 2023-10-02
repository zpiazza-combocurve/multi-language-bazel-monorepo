import { IValidationErrorEntry } from '../multi-error';

import { IDirectionalSurveyMeasures } from './models/requests';

type measures = Omit<IDirectionalSurveyMeasures, 'spatialDataType'>;

/** Common Methods for all operations */
const common = {
	createEmptyMeasures: (): measures => {
		return {
			measuredDepth: [],
			trueVerticalDepth: [],
			azimuth: [],
			inclination: [],
			deviationEW: [],
			deviationNS: [],
			latitude: [],
			longitude: [],
		};
	},

	getOrderedMesures: (input: measures): measures => {
		const keyIndex = input.measuredDepth
			.map((value, index) => {
				return { value, index };
			})
			.sort((a, b) => a.value - b.value);

		const output = common.createEmptyMeasures();

		for (const current of keyIndex) {
			output.measuredDepth.push(current.value);
			output.trueVerticalDepth.push(input.trueVerticalDepth[current.index]);
			output.azimuth.push(input.azimuth[current.index]);
			output.inclination.push(input.inclination[current.index]);
			output.deviationEW.push(input.deviationEW[current.index]);
			output.deviationNS.push(input.deviationNS[current.index]);
			output.latitude.push(input.latitude[current.index]);
			output.longitude.push(input.longitude[current.index]);
		}

		return output;
	},

	addMeasure: (target: measures, value: measures, idx: number): void => {
		target.measuredDepth.push(value.measuredDepth[idx]);
		target.trueVerticalDepth.push(value.trueVerticalDepth[idx]);
		target.azimuth.push(value.azimuth[idx]);
		target.inclination.push(value.inclination[idx]);
		target.deviationEW.push(value.deviationEW[idx]);
		target.deviationNS.push(value.deviationNS[idx]);
		target.latitude.push(value.latitude[idx]);
		target.longitude.push(value.longitude[idx]);
	},

	replaceDBMeasures: (db: measures, value: measures): void => {
		db.measuredDepth = value.measuredDepth;
		db.trueVerticalDepth = value.trueVerticalDepth;
		db.azimuth = value.azimuth;
		db.inclination = value.inclination;
		db.deviationEW = value.deviationEW;
		db.deviationNS = value.deviationNS;
		db.latitude = value.latitude;
		db.longitude = value.longitude;
	},
};

/**
 * Add new measures on DB DS model
 * @param dbModel the mongo model
 * @param reqModel the addition request model
 * @returns error message or null
 */
export function addMeasures(dbModel: measures, reqModel: measures): IValidationErrorEntry[] {
	const newMeasures = common.createEmptyMeasures();
	const orderedMesures = common.getOrderedMesures(reqModel);

	return addMerge(newMeasures, orderedMesures, dbModel);
}

const addMerge = (newOne: measures, req: measures, db: measures): IValidationErrorEntry[] => {
	const errorMeasures: { value: number; dbIndex: number; reqIndex: number }[] = [];

	let [reqIndex, dbIndex] = [0, 0];
	const [reqLimit, dbLimit] = [req.measuredDepth.length, db.measuredDepth.length];

	// Get from first array (mongo model) while values are less than the seccond array (payload model)
	// If equal values save index as error one

	while (reqIndex < reqLimit || dbIndex < dbLimit) {
		if (dbIndex >= dbLimit || req.measuredDepth[reqIndex] < db.measuredDepth[dbIndex]) {
			common.addMeasure(newOne, req, reqIndex);
			reqIndex++;
		} else if (reqIndex >= reqLimit || req.measuredDepth[reqIndex] > db.measuredDepth[dbIndex]) {
			common.addMeasure(newOne, db, dbIndex);
			dbIndex++;
		} else {
			errorMeasures.push({ value: req.measuredDepth[reqIndex], dbIndex: dbIndex, reqIndex: reqIndex });
			reqIndex++;
			dbIndex++;
		}
	}

	if (errorMeasures.length === 0) {
		common.replaceDBMeasures(db, newOne);
	}

	return errorMeasures.map((m) => {
		return {
			name: 'AddDuplicateItemError',
			message: `The measures ${m.value} is already present on DB at indexes ${m.dbIndex}`,
			location: `add.measuredDepth[${m.reqIndex}]`,
		};
	});
};

/**
 * Update existing measures on DB DS model
 * @param dbModel the mongo model
 * @param reqModel the updation request measures
 * @returns error message or null
 */
export function updateMeasures(dbModel: measures, reqModel: measures): IValidationErrorEntry[] {
	const newMeasures = common.createEmptyMeasures();
	const orderedMesures = common.getOrderedMesures(reqModel);

	return updateMerge(newMeasures, orderedMesures, dbModel);
}

const updateMerge = (newOne: measures, req: measures, db: measures): IValidationErrorEntry[] => {
	let reqIndex = 0;
	const notFoundValues: { value: number; index: number }[] = [];

	for (let i = 0; i < db.measuredDepth.length; i++) {
		const currentDb = db.measuredDepth[i];
		const currentReq = req.measuredDepth[reqIndex];

		if (currentDb === currentReq) {
			common.addMeasure(newOne, req, reqIndex++);
			continue;
		}

		if (currentDb > currentReq) {
			notFoundValues.push({ index: reqIndex, value: req.measuredDepth[reqIndex++] });
		}

		common.addMeasure(newOne, db, i);
	}

	for (; reqIndex < req.measuredDepth.length; reqIndex++) {
		notFoundValues.push({ index: reqIndex, value: req.measuredDepth[reqIndex] });
	}

	if (notFoundValues.length === 0) {
		common.replaceDBMeasures(db, newOne);
	}

	return notFoundValues.map((m) => {
		return {
			name: 'UpdateNotFoundItemError',
			message: `The measures ${m.value} was not find on saved directional survey for update`,
			location: `update.measuredDepth[${m.index}]`,
		};
	});
};

/**
 * Delete existing measures on DB DS model
 * @param dbModel the mongo model
 * @param reqModel the deletion request measures
 * @returns error message or null
 */
export function removeMeasures(dbModel: measures, deleteIDs: number[]): IValidationErrorEntry[] {
	const newMeasures = common.createEmptyMeasures();
	const orderedMesures = deleteIDs.sort((a, b) => a - b);

	return deleteMerge(newMeasures, orderedMesures, dbModel);
}

const deleteMerge = (newOne: measures, req: number[], db: measures): IValidationErrorEntry[] => {
	let reqIndex = 0;
	const notFoundValues: { value: number; index: number }[] = [];

	for (let i = 0; i < db.measuredDepth.length; i++) {
		const currentDb = db.measuredDepth[i];
		const currentReq = req[reqIndex];

		if (currentDb === currentReq) {
			reqIndex++;
			continue;
		}

		if (currentDb > currentReq) {
			notFoundValues.push({ index: reqIndex, value: req[reqIndex++] });
		}

		common.addMeasure(newOne, db, i);
	}

	for (; reqIndex < req.length; reqIndex++) {
		notFoundValues.push({ index: reqIndex, value: req[reqIndex] });
	}

	if (notFoundValues.length === 0) {
		common.replaceDBMeasures(db, newOne);
	}

	return notFoundValues.map((m) => {
		return {
			name: 'DeleteNotFoundItemError',
			message: `The measures ${m.value} was not find on saved directional survey for delete`,
			location: `remove[${m.index}]`,
		};
	});
};
