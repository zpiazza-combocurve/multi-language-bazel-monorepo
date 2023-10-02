import { addMeasures, removeMeasures, updateMeasures } from './measures-facade';
import { IDirectionalSurveyMeasures } from './models/requests';

const no_errors: string[] = [];

describe('directional surveys payload and mongo models merge', () => {
	function createValidMeasures(idArray: number[], arrayValue: number[] = []): IDirectionalSurveyMeasures {
		arrayValue = arrayValue.length !== 0 ? arrayValue : idArray;

		return {
			measuredDepth: idArray,
			trueVerticalDepth: arrayValue,
			azimuth: arrayValue,
			inclination: arrayValue,
			deviationEW: arrayValue,
			deviationNS: arrayValue,
			latitude: arrayValue,
			longitude: arrayValue,
		};
	}

	describe('add operation', () => {
		function addBaseTest(dbArr: number[], payloadArr: number[], expectArr: number[], expectError: string[]) {
			const db = createValidMeasures(dbArr, dbArr);
			const payload = createValidMeasures(payloadArr, payloadArr);

			const error = addMeasures(db, payload);

			expect(error.length).toBe(expectError.length);
			error.forEach((f, i) => expect(f.message).toBe(expectError[i]));

			expect(db.measuredDepth).toEqual(expectArr);
			expect(db.trueVerticalDepth).toEqual(expectArr);
			expect(db.azimuth).toEqual(expectArr);
			expect(db.inclination).toEqual(expectArr);
			expect(db.deviationEW).toEqual(expectArr);
			expect(db.deviationNS).toEqual(expectArr);
			expect(db.latitude).toEqual(expectArr);
			expect(db.longitude).toEqual(expectArr);
		}

		it('should add ordered numbers', () => {
			addBaseTest([5, 7], [3, 2, 1], [1, 2, 3, 5, 7], no_errors);
		});

		it('should add all numbers', () => {
			const size = 100000;
			const first = Array.from(Array(size).keys());
			const seccond = Array.from(Array(size).keys()).map((m) => m + size);
			const all = Array.from(Array(size * 2).keys());

			addBaseTest(first, seccond, all, no_errors);
		});

		it('should not accept duplicates', () => {
			const expectErroMsg = [
				`The measures ${1} is already present on DB at indexes ${0}`,
				`The measures ${2} is already present on DB at indexes ${1}`,
				`The measures ${3} is already present on DB at indexes ${2}`,
			];

			addBaseTest([1, 2, 3], [1, 2, 3, 4, 5], [1, 2, 3], expectErroMsg);
		});
	});

	describe('update operation', () => {
		const updateBaseTest = (
			dbModel: IDirectionalSurveyMeasures,
			updateModel: IDirectionalSurveyMeasures,
			expectError: string[],
			expectIds: number[],
			expectArray: number[],
		) => {
			const error = updateMeasures(dbModel, updateModel);

			expect(error.length).toBe(expectError.length);
			error.forEach((f, i) => expect(f.message).toBe(expectError[i]));

			expect(dbModel.measuredDepth).toEqual(expectIds);
			expect(dbModel.trueVerticalDepth).toEqual(expectArray);
			expect(dbModel.azimuth).toEqual(expectArray);
			expect(dbModel.inclination).toEqual(expectArray);
			expect(dbModel.deviationEW).toEqual(expectArray);
			expect(dbModel.deviationNS).toEqual(expectArray);
			expect(dbModel.latitude).toEqual(expectArray);
			expect(dbModel.longitude).toEqual(expectArray);
		};

		it('should update all elements', () => {
			const dbModel = createValidMeasures([1, 2, 3]);
			const updateModel = createValidMeasures([1, 2, 3], [9, 9, 9]);

			updateBaseTest(dbModel, updateModel, no_errors, [1, 2, 3], [9, 9, 9]);
		});

		it('should keep untouch the elements not updated', () => {
			const dbModel = createValidMeasures([0, 1, 2, 3, 4, 5, 6]);
			const updateModel = createValidMeasures([2, 3], [9, 9]);

			updateBaseTest(dbModel, updateModel, no_errors, [0, 1, 2, 3, 4, 5, 6], [0, 1, 9, 9, 4, 5, 6]);
		});

		it('should not accept not found elements', () => {
			const dbModel = createValidMeasures([0, 1, 2, 3]);
			const updateModel = createValidMeasures([11, 2, 3, 18, 14], [11, 9, 9, 18, 14]);
			const expectError = [
				`The measures ${11} was not find on saved directional survey for update`,
				`The measures ${14} was not find on saved directional survey for update`,
				`The measures ${18} was not find on saved directional survey for update`,
			];

			updateBaseTest(dbModel, updateModel, expectError, [0, 1, 2, 3], [0, 1, 2, 3]);
		});
	});

	describe('delete operation', () => {
		const updateBaseTest = (
			dbModel: IDirectionalSurveyMeasures,
			removeElements: number[],
			expectError: string[],
			expectIds: number[],
		) => {
			const error = removeMeasures(dbModel, removeElements);

			expect(error.length).toBe(expectError.length);
			error.forEach((f, i) => expect(f.message).toBe(expectError[i]));

			expect(dbModel.measuredDepth).toEqual(expectIds);
			expect(dbModel.trueVerticalDepth).toEqual(expectIds);
			expect(dbModel.azimuth).toEqual(expectIds);
			expect(dbModel.inclination).toEqual(expectIds);
			expect(dbModel.deviationEW).toEqual(expectIds);
			expect(dbModel.deviationNS).toEqual(expectIds);
			expect(dbModel.latitude).toEqual(expectIds);
			expect(dbModel.longitude).toEqual(expectIds);
		};

		it('should remove all elements', () => {
			const dbModel = createValidMeasures([1, 2, 3]);

			updateBaseTest(dbModel, [1, 2, 3], no_errors, []);
		});

		it('should keep untouch the elements not removed', () => {
			const dbModel = createValidMeasures([0, 1, 2, 3, 4, 5, 6]);

			updateBaseTest(dbModel, [1, 2, 3], no_errors, [0, 4, 5, 6]);
		});

		it('should not accept not found elements', () => {
			const dbModel = createValidMeasures([0, 1, 2, 3]);
			const expectError = [
				`The measures ${5} was not find on saved directional survey for delete`,
				`The measures ${11} was not find on saved directional survey for delete`,
				`The measures ${14} was not find on saved directional survey for delete`,
			];

			updateBaseTest(dbModel, [0, 1, 5, 14, 11], expectError, [0, 1, 2, 3]);
		});
	});
});
